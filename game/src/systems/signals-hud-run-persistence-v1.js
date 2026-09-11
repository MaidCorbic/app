import { RunnerScene as RelaySignalHudRunnerScene } from '../scenes/RunnerScene.js';

const RunnerScene = RelaySignalHudRunnerScene;

/* RUNNER RELAY — SIGNAL HUD RUN PROGRESS V2
 * Presentation/runtime run-memory binding only.
 * Remembers collected signal ids for the current browser session, restores
 * the canonical HUD after checkpoint respawn/recreate, and makes the
 * FLOW SIGNALS bar advance linearly from collected / total signals.
 * No audio, combat, input ownership or persistent save storage changes.
 */
(() => {
  'use strict';

  if (window.__relaySignalHudRunProgressV2) return;
  window.__relaySignalHudRunProgressV2 = true;

  const seen = new WeakMap();
  const pending = new WeakMap();
  const missionKeys = new WeakMap();
  const STORAGE_KEY = 'runner-relay:signals:session-v2';

  const numberFrom = element => {
    if (!element) return 0;
    const match = String(element.textContent || '').match(/\d+/);
    return match ? Number(match[0]) : 0;
  };

  const safeRead = () => {
    try {
      const raw = window.sessionStorage?.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const safeWrite = value => {
    try {
      window.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {}
  };

  const signalId = signal => {
    const value = signal?.getData?.('id');
    return Number.isFinite(Number(value)) ? Number(value) : null;
  };

  const signalFingerprint = scene => {
    const children = scene?.signals?.getChildren?.() || [];
    const entries = children
      .map(signal => ({
        id: signalId(signal),
        x: Number(signal?.getData?.('spawnX') ?? signal?.x ?? 0),
        y: Number(signal?.getData?.('spawnY') ?? signal?.y ?? 0)
      }))
      .filter(item => item.id !== null)
      .sort((a, b) => a.id - b.id);

    if (!entries.length) return '';
    return entries
      .map(item => `${item.id}:${Math.round(item.x * 10) / 10},${Math.round(item.y * 10) / 10}`)
      .join('|');
  };

  const loadCollectedIds = key => {
    if (!key) return new Set();
    const store = safeRead();
    const ids = Array.isArray(store[key]) ? store[key] : [];
    return new Set(ids.map(Number).filter(Number.isFinite));
  };

  const saveCollectedIds = (key, ids) => {
    if (!key) return;
    const store = safeRead();
    store[key] = Array.from(ids).sort((a, b) => a - b);
    safeWrite(store);
  };

  const totalFromScene = scene => {
    const domTotal = numberFrom(document.getElementById('signalTotal'));
    if (domTotal > 0) return domTotal;
    return Number(scene?.signals?.getChildren?.().length || 0);
  };

  const missionTotal = scene => {
    const total = totalFromScene(scene);
    if (total > 0) return total;
    const hiddenProgress = numberFrom(document.getElementById('signalProgress'));
    return hiddenProgress > 0 ? hiddenProgress : 0;
  };

  const collected = scene => {
    const domCount = numberFrom(document.getElementById('signalCount'));
    const remembered = Number(seen.get(scene)?.size || 0);
    return Math.max(domCount, remembered, 0);
  };

  const restoreCollectedSignals = scene => {
    const ids = seen.get(scene);
    if (!scene?.signals || !ids?.size) return;

    for (const signal of scene.signals.getChildren?.() || []) {
      const id = signalId(signal);
      if (id === null || !ids.has(id)) continue;

      try {
        signal.disableBody?.(true, true);
        signal.setActive?.(false);
        signal.setVisible?.(false);
      } catch {}
    }
  };

  const syncHud = scene => {
    const root = document.getElementById('relay-gameplay-feel-v3');
    const progress = document.getElementById('progress');
    const count = document.getElementById('signalCount');
    if (!progress || !count) return;

    const current = collected(scene);
    const total = missionTotal(scene);
    const percent = total > 0
      ? Math.max(0, Math.min(100, Math.round((current / total) * 100)))
      : 0;

    if (numberFrom(count) < current) {
      count.textContent = String(current).padStart(2, '0');
    }

    progress.style.width = `${percent}%`;
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    progress.setAttribute('aria-valuenow', String(percent));
    progress.dataset.signalProgress = String(percent);

    if (!root) return;

    const strip = root.querySelector('.gf-strip');
    const chips = root.querySelectorAll('.gf-chip');
    const meter = root.querySelector('.gf-meter i');
    const firstValue = chips[0]?.querySelector('.gf-value');
    const secondValue = chips[1]?.querySelector('.gf-value');

    if (strip) strip.setAttribute('data-signal-progress', String(percent));
    if (firstValue) firstValue.textContent = `${percent}%`;
    if (secondValue) secondValue.textContent = String(current).padStart(2, '0');
    if (meter) meter.style.width = `${percent}%`;

    const firstChip = chips[0];
    if (firstChip && !firstChip.dataset.signalLabelFixed) {
      for (const node of Array.from(firstChip.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          node.textContent = 'FLOW SIGNALS ';
          break;
        }
      }
      firstChip.dataset.signalLabelFixed = '1';
    }
  };

  const restoreHudCount = scene => {
    const ids = seen.get(scene);
    const target = Number(ids?.size || 0);
    if (!target) {
      syncHud(scene);
      return;
    }

    const count = document.getElementById('signalCount');
    if (count && numberFrom(count) < target) {
      count.textContent = String(target).padStart(2, '0');
    }

    restoreCollectedSignals(scene);
    syncHud(scene);
  };

  const scheduleRestore = scene => {
    window.clearTimeout(pending.get(scene));
    pending.set(scene, window.setTimeout(() => restoreHudCount(scene), 80));
    window.setTimeout(() => restoreHudCount(scene), 260);
    window.setTimeout(() => restoreHudCount(scene), 620);
  };

  const remember = (scene, signal = null) => {
    if (!scene) return;

    const key = missionKeys.get(scene) || signalFingerprint(scene);
    if (key) missionKeys.set(scene, key);

    const ids = seen.get(scene) || new Set();
    if (signal) {
      const id = signalId(signal);
      if (id !== null) ids.add(id);
    }

    const domCount = numberFrom(document.getElementById('signalCount'));
    while (ids.size < domCount && ids.size < missionTotal(scene)) {
      ids.add(ids.size);
    }

    seen.set(scene, ids);
    saveCollectedIds(key, ids);
    syncHud(scene);
  };

  const restoreForScene = scene => {
    const key = signalFingerprint(scene);
    if (!key) {
      seen.set(scene, new Set());
      return;
    }

    missionKeys.set(scene, key);
    seen.set(scene, loadCollectedIds(key));
    restoreCollectedSignals(scene);
    restoreHudCount(scene);
  };

  const baseCreate = RunnerScene.prototype.create;
  const baseCollectSignal = RunnerScene.prototype.collectSignal;
  const baseRespawn = RunnerScene.prototype.respawnCheckpoint;

  if (!RunnerScene.prototype.__relaySignalHudRunProgressCreateV2) {
    RunnerScene.prototype.create = function signalHudRunProgressCreateV2(...args) {
      const result = baseCreate.apply(this, args);
      window.setTimeout(() => restoreForScene(this), 0);
      window.setTimeout(() => syncHud(this), 120);
      window.setTimeout(() => restoreCollectedSignals(this), 260);
      return result;
    };
    RunnerScene.prototype.__relaySignalHudRunProgressCreateV2 = true;
  }

  if (!RunnerScene.prototype.__relaySignalHudRunProgressCollectSignalV2 && typeof baseCollectSignal === 'function') {
    RunnerScene.prototype.collectSignal = function signalHudRunProgressCollectSignalV2(signal, ...args) {
      const result = baseCollectSignal.call(this, signal, ...args);
      remember(this, signal);
      restoreCollectedSignals(this);
      return result;
    };
    RunnerScene.prototype.__relaySignalHudRunProgressCollectSignalV2 = true;
  }

  if (!RunnerScene.prototype.__relaySignalHudRunProgressRespawnV2) {
    RunnerScene.prototype.respawnCheckpoint = function signalHudRunProgressRespawnV2(...args) {
      remember(this);
      const result = baseRespawn.apply(this, args);
      scheduleRestore(this);
      return result;
    };
    RunnerScene.prototype.__relaySignalHudRunProgressRespawnV2 = true;
  }

  const observeCount = () => {
    const count = document.getElementById('signalCount');
    const total = document.getElementById('signalTotal');
    if (!count && !total) return;

    const observer = new MutationObserver(() => {
      const scene = window.__relayRunnerScene;
      if (!scene) return;
      remember(scene);
    });

    if (count) observer.observe(count, { childList:true, characterData:true, subtree:true });
    if (total) observer.observe(total, { childList:true, characterData:true, subtree:true });
  };

  const boot = () => {
    observeCount();
    const scene = window.__relayRunnerScene;
    if (scene) restoreForScene(scene);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  } else {
    boot();
  }
})();
