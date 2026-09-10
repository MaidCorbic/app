/* RUNNER RELAY — SIGNAL HUD RUN PROGRESS V1
 * Presentation/runtime HUD binding only.
 * Keeps collected signal HUD progress on checkpoint respawn and makes the
 * FLOW SIGNALS bar advance linearly from collected / total signals.
 * No audio, combat, progression, save or input ownership changes.
 */
(() => {
  'use strict';

  if (window.__relaySignalHudRunProgressV1) return;
  window.__relaySignalHudRunProgressV1 = true;

  const seen = new WeakMap();
  const pending = new WeakMap();

  const numberFrom = element => {
    if (!element) return 0;
    const match = String(element.textContent || '').match(/\d+/);
    return match ? Number(match[0]) : 0;
  };

  const missionTotal = scene => {
    const domTotal = numberFrom(document.getElementById('signalTotal'));
    if (domTotal > 0) return domTotal;

    const groupTotal = Number(scene?.signals?.getChildren?.().length || 0);
    if (groupTotal > 0) return groupTotal;

    const hiddenProgress = numberFrom(document.getElementById('signalProgress'));
    return hiddenProgress > 0 ? hiddenProgress : 0;
  };

  const collected = scene => {
    const domCount = numberFrom(document.getElementById('signalCount'));
    const remembered = Number(seen.get(scene) || 0);
    return Math.max(domCount, remembered, 0);
  };

  const syncHud = scene => {
    const root = document.getElementById('relay-gameplay-feel-v3');
    const progress = document.getElementById('progress');
    const count = document.getElementById('signalCount');
    if (!root || !progress || !count) return;

    const current = collected(scene);
    const total = missionTotal(scene);
    const percent = total > 0
      ? Math.max(0, Math.min(100, Math.round((current / total) * 100)))
      : 0;

    if (Number(numberFrom(count)) < current) {
      count.textContent = String(current).padStart(2, '0');
    }

    progress.style.width = `${percent}%`;
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    progress.setAttribute('aria-valuenow', String(percent));
    progress.dataset.signalProgress = String(percent);

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
    const target = Number(seen.get(scene) || 0);
    if (!target) return;

    const count = document.getElementById('signalCount');
    if (count && numberFrom(count) < target) {
      count.textContent = String(target).padStart(2, '0');
    }

    syncHud(scene);
  };

  const scheduleRestore = scene => {
    window.clearTimeout(pending.get(scene));
    pending.set(scene, window.setTimeout(() => restoreHudCount(scene), 80));
    window.setTimeout(() => restoreHudCount(scene), 260);
    window.setTimeout(() => restoreHudCount(scene), 620);
  };

  const remember = scene => {
    if (!scene) return;
    const next = Math.max(Number(seen.get(scene) || 0), numberFrom(document.getElementById('signalCount')));
    seen.set(scene, next);
    syncHud(scene);
  };

  const baseCreate = RunnerScene.prototype.create;
  const baseCollectSignal = RunnerScene.prototype.collectSignal;
  const baseRespawn = RunnerScene.prototype.respawnCheckpoint;

  if (!RunnerScene.prototype.__relaySignalHudRunProgressCreate) {
    RunnerScene.prototype.create = function signalHudRunProgressCreate(...args) {
      seen.set(this, 0);
      const result = baseCreate.apply(this, args);
      window.setTimeout(() => syncHud(this), 0);
      window.setTimeout(() => syncHud(this), 120);
      return result;
    };
    RunnerScene.prototype.__relaySignalHudRunProgressCreate = true;
  }

  if (!RunnerScene.prototype.__relaySignalHudRunProgressCollectSignal && typeof baseCollectSignal === 'function') {
    RunnerScene.prototype.collectSignal = function signalHudRunProgressCollectSignal(...args) {
      const result = baseCollectSignal.apply(this, args);
      remember(this);
      return result;
    };
    RunnerScene.prototype.__relaySignalHudRunProgressCollectSignal = true;
  }

  if (!RunnerScene.prototype.__relaySignalHudRunProgressRespawn) {
    RunnerScene.prototype.respawnCheckpoint = function signalHudRunProgressRespawn(...args) {
      remember(this);
      const result = baseRespawn.apply(this, args);
      scheduleRestore(this);
      return result;
    };
    RunnerScene.prototype.__relaySignalHudRunProgressRespawn = true;
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
    if (scene) syncHud(scene);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once:true });
  } else {
    boot();
  }
})();
