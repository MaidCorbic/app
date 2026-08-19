import { RunnerScene } from '../scenes/RunnerScene.js';

// UPDATE 14 — DYNAMIC ENCOUNTER EVENTS V1
// One deterministic encounter per run. Reads existing scene/enemy state only.
// No progression, score, Performance V1, mission completion, or save ownership.
// Existing mission-specific encounters always win. A safe Signal Anomaly fallback
// is used only for a mission that has no encounter configured yet.
const CONFIG = {
  'first-delivery': { type: 'signal-anomaly', triggerX: 1780, radius: 210, title: 'SIGNAL ANOMALY', message: 'SIGNAL FIELD UNSTABLE', duration: 6500 },
  'dead-drop': { type: 'ambush', triggerX: 2050, radius: 230, title: 'AMBUSH', message: 'HOSTILES INBOUND', duration: 7000 },
  blackout: { type: 'power-surge', triggerX: 2280, radius: 230, title: 'POWER SURGE', message: 'GRID LOAD SPIKE', duration: 6500 },
  pursuit: { type: 'pursuit', triggerX: 2200, radius: 250, title: 'PURSUIT', message: 'INTERCEPTOR LOCKED ON', duration: 8500 },
  'signal-storm': { type: 'signal-anomaly', triggerX: 2350, radius: 250, title: 'SIGNAL STORM', message: 'SIGNAL FIELD DESTABILIZED', duration: 8000 },
  'corporate-lockdown': { type: 'ambush', triggerX: 2450, radius: 250, title: 'LOCKDOWN', message: 'SECURITY RESPONSE ACTIVE', duration: 8000 },
  'final-relay': { type: 'pursuit', triggerX: 2500, radius: 260, title: 'FINAL PURSUIT', message: 'INTERCEPTOR DEPLOYED', duration: 9000 },
};

const DEFAULT_SIGNAL_ANOMALY = {
  type: 'signal-anomaly',
  radius: 220,
  title: 'SIGNAL ANOMALY',
  message: 'SIGNAL FIELD UNSTABLE',
  duration: 6500,
};

const states = new WeakMap();
const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

function missionId(scene) {
  return [
    scene?.sys?.settings?.data?.missionId,
    scene?.sys?.settings?.data?.mission,
    scene?.registry?.get?.('missionId'),
    scene?.mission?.id,
    document.documentElement?.dataset?.missionId,
    document.body?.dataset?.missionId,
  ].find(value => typeof value === 'string') || null;
}

function fallbackTriggerX(scene) {
  const bounds = scene?.physics?.world?.bounds;
  const width = Number(bounds?.width);
  const left = Number(bounds?.x);
  if (Number.isFinite(width) && width > 600 && Number.isFinite(left)) {
    return left + width * .55;
  }
  return Number(scene?.player?.x || 0) + 900;
}

function getConfig(scene, id) {
  if (!id) return null;
  if (CONFIG[id]) return CONFIG[id];
  // Future/new missions get a single lightweight anomaly instead of no encounter.
  // This is deliberately fallback-only so existing authored encounters are untouched.
  return { ...DEFAULT_SIGNAL_ANOMALY, triggerX: fallbackTriggerX(scene) };
}

function getEnemies(scene) {
  for (const group of [scene.enemies, scene.hostiles, scene.enemyGroup]) {
    const children = group?.getChildren?.() || (Array.isArray(group) ? group : null);
    if (children?.length) return children.filter(enemy => enemy && enemy.active !== false && enemy.body?.enable !== false);
  }
  return [];
}

function getNearbySignals(scene, radius = 620) {
  const player = scene.player;
  const displayList = scene.children?.list || [];
  if (!player || !displayList.length) return [];
  return displayList.filter(node => {
    if (!node || node.active === false || node.texture?.key !== 'signal') return false;
    return distance(node, player) <= radius;
  });
}

function announce(scene, config) {
  try { scene.playerCue?.(config.message, '#8df4ff'); } catch {}

  let node = document.getElementById('dynamicEncounterEvent');
  if (!node) {
    node = document.createElement('div');
    node.id = 'dynamicEncounterEvent';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.innerHTML = '<strong></strong><small></small>';
    document.body.appendChild(node);

    const style = document.createElement('style');
    style.id = 'dynamic-encounter-events-v1-style';
    style.textContent = `
      #dynamicEncounterEvent{position:fixed;left:50%;top:calc(86px + env(safe-area-inset-top,0px));transform:translateX(-50%) translateY(-8px);z-index:100002;display:none;min-width:min(84vw,340px);padding:10px 14px;border:1px solid rgba(141,244,255,.72);border-radius:10px;background:rgba(4,12,24,.94);box-shadow:0 0 20px rgba(141,244,255,.18),inset 0 0 18px rgba(141,244,255,.04);text-align:center;color:#e9fdff;font:900 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.11em;text-transform:uppercase;pointer-events:none;opacity:0;transition:opacity .18s ease,transform .18s ease}
      #dynamicEncounterEvent.is-visible{display:block;opacity:1;transform:translateX(-50%) translateY(0)}
      #dynamicEncounterEvent small{display:block;margin-top:4px;font-size:8px;letter-spacing:.08em;color:#8df4ff;opacity:.78}
      @media(max-width:700px){#dynamicEncounterEvent{top:calc(72px + env(safe-area-inset-top,0px));min-width:76vw;padding:9px 11px;font-size:9px}}
      @media(prefers-reduced-motion:reduce){#dynamicEncounterEvent{transition:none}}
    `;
    document.head.appendChild(style);
  }

  node.querySelector('strong').textContent = config.title;
  node.querySelector('small').textContent = config.type.replaceAll('-', ' ').toUpperCase();
  node.classList.add('is-visible');
  clearTimeout(node.__hideTimer);
  node.__hideTimer = setTimeout(() => node.classList.remove('is-visible'), 2600);
}

function createWorldCue(scene, state) {
  const config = state.config;
  try {
    if (config.type === 'signal-anomaly') {
      const signals = getNearbySignals(scene);
      state.affectedSignals = signals.map(signal => ({ signal, scale: signal.scaleX || 1, alpha: signal.alpha ?? 1 }));
      signals.forEach(signal => {
        signal.setTint?.(0x8df4ff);
        signal.setAlpha?.(.72);
        signal.setScale?.((signal.scaleX || 1) * 1.14, (signal.scaleY || 1) * 1.14);
      });
      state.pulseUntil = performance.now() + config.duration;
      try { scene.cameras?.main?.flash?.(180, 70, 180, 255, false); } catch {}
    } else if (config.type === 'power-surge') {
      state.pulseUntil = performance.now() + config.duration;
      try { scene.cameras?.main?.flash?.(120, 90, 220, 255, false); } catch {}
    }
  } catch (error) {
    console.warn('[DynamicEncounterV1] visual cue skipped', error);
  }
}

function restoreWorldCue(state) {
  for (const entry of state.affectedSignals || []) {
    const signal = entry.signal;
    if (!signal || signal.destroyed) continue;
    try {
      signal.clearTint?.();
      signal.setAlpha?.(entry.alpha);
      signal.setScale?.(entry.scale);
    } catch {}
  }
  state.affectedSignals = [];
}

function spawnAmbush(scene, state) {
  const player = scene.player;
  if (!player) return false;
  const candidates = getEnemies(scene).filter(enemy => distance(enemy, player) > 280 && distance(enemy, player) < 1200);
  if (!candidates.length) return false;
  candidates.slice(0, 2).forEach(enemy => enemy.setData?.('dynamicEncounter', state.config.type));
  return true;
}

function triggerPursuit(scene, state) {
  const player = scene.player;
  const enemy = getEnemies(scene).find(candidate => distance(candidate, player) > 240 && distance(candidate, player) < 1000);
  if (!enemy) return false;
  enemy.setData?.('dynamicEncounter', 'pursuit');
  enemy.setData?.('dynamicEncounterTarget', player);
  enemy.setData?.('dynamicEncounterUntil', performance.now() + state.config.duration);
  return true;
}

function activate(scene, state) {
  if (state.triggered || state.completed) return;
  const type = state.config.type;
  let applied = true;
  if (type === 'ambush') applied = spawnAmbush(scene, state);
  else if (type === 'pursuit') applied = triggerPursuit(scene, state);
  if (!applied && (type === 'ambush' || type === 'pursuit')) return;

  state.triggered = true;
  state.expiresAt = performance.now() + state.config.duration;
  createWorldCue(scene, state);
  announce(scene, state.config);
}

function setup(scene) {
  if (!scene || states.has(scene)) return;
  const id = missionId(scene);
  const config = getConfig(scene, id);
  if (config && scene.player) {
    states.set(scene, {
      missionId: id,
      config,
      fallback: !CONFIG[id],
      triggered: false,
      completed: false,
      expiresAt: 0,
      affectedSignals: [],
      pulseUntil: 0,
    });
  }
}

function update(scene) {
  const state = states.get(scene);
  if (!state || state.completed || !scene.player?.active) return;

  if (!state.triggered && Math.abs((scene.player.x || 0) - state.config.triggerX) <= state.config.radius) activate(scene, state);

  if (state.triggered && state.expiresAt && performance.now() >= state.expiresAt) {
    restoreWorldCue(state);
    state.completed = true;
  }

  if (state.triggered && state.config.type === 'signal-anomaly' && state.expiresAt > performance.now()) {
    const pulse = 1 + Math.sin(performance.now() * .018) * .07;
    for (const entry of state.affectedSignals || []) entry.signal?.setScale?.(entry.scale * pulse, entry.scale * pulse);
  }

  if (state.triggered && state.config.type === 'pursuit') {
    const now = performance.now();
    getEnemies(scene).forEach(enemy => {
      if (enemy.getData?.('dynamicEncounter') !== 'pursuit') return;
      const until = enemy.getData?.('dynamicEncounterUntil') || 0;
      if (now >= until) {
        enemy.setData?.('dynamicEncounter', null);
        enemy.setData?.('dynamicEncounterTarget', null);
        enemy.setData?.('dynamicEncounterUntil', 0);
        return;
      }
      const target = enemy.getData?.('dynamicEncounterTarget');
      const dx = (target?.x || 0) - (enemy.x || 0);
      const dy = (target?.y || 0) - (enemy.y || 0);
      if (enemy.body?.velocity) {
        enemy.body.velocity.x += Math.sign(dx) * 7;
        enemy.body.velocity.y += Math.sign(dy) * 2;
      }
    });
  }
}

function teardown(scene) {
  const state = states.get(scene);
  if (!state) return;
  restoreWorldCue(state);
  getEnemies(scene).forEach(enemy => {
    if (enemy.getData?.('dynamicEncounter')) {
      enemy.setData('dynamicEncounter', null);
      enemy.setData('dynamicEncounterTarget', null);
      enemy.setData('dynamicEncounterUntil', 0);
    }
  });
  document.getElementById('dynamicEncounterEvent')?.classList.remove('is-visible');
  states.delete(scene);
}

const originalCreate = RunnerScene.prototype.create;
const originalUpdate = RunnerScene.prototype.update;
const originalShutdown = RunnerScene.prototype.shutdown;

if (!RunnerScene.prototype.__dynamicEncounterV1CreatePatched) {
  RunnerScene.prototype.create = function dynamicEncounterCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { setup(this); } catch (error) { console.error('[DynamicEncounterV1] setup failed', error); }
    return result;
  };
  RunnerScene.prototype.__dynamicEncounterV1CreatePatched = true;
}

if (!RunnerScene.prototype.__dynamicEncounterV1UpdatePatched) {
  RunnerScene.prototype.update = function dynamicEncounterUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    try { update(this); } catch (error) { console.error('[DynamicEncounterV1] update failed', error); }
    return result;
  };
  RunnerScene.prototype.__dynamicEncounterV1UpdatePatched = true;
}

if (!RunnerScene.prototype.__dynamicEncounterV1ShutdownPatched) {
  RunnerScene.prototype.shutdown = function dynamicEncounterShutdown(...args) {
    try { teardown(this); } catch (error) { console.error('[DynamicEncounterV1] teardown failed', error); }
    return originalShutdown.apply(this, args);
  };
  RunnerScene.prototype.__dynamicEncounterV1ShutdownPatched = true;
}
