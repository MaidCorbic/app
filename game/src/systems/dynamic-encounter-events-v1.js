import { RunnerScene } from '../scenes/RunnerScene.js';

// UPDATE 22 — DIEGETIC ENCOUNTERS / GAMEPLAY DIRECTOR REFINE
// Extends the existing encounter system only. No duplicate HUD, score, mission,
// cargo, combo, progression, or movement ownership.

const CONFIG = {
  'first-delivery': { variants: [
    { type: 'signal-anomaly', triggerX: 1780, radius: 210, duration: 6200, message: 'SIGNAL FIELD UNSTABLE' },
    { type: 'ambush', triggerX: 2240, radius: 220, duration: 6500, message: 'MOVEMENT AHEAD' },
  ]},
  'dead-drop': { variants: [
    { type: 'ambush', triggerX: 2050, radius: 230, duration: 7000, message: 'HOSTILES MOVING' },
    { type: 'signal-anomaly', triggerX: 2520, radius: 220, duration: 6200, message: 'DEAD DROP SIGNAL DISTORTED' },
  ]},
  blackout: { variants: [
    { type: 'power-surge', triggerX: 2280, radius: 230, duration: 5600, message: 'GRID LOAD SPIKE' },
    { type: 'ambush', triggerX: 2760, radius: 230, duration: 6800, message: 'SECURITY RESPONSE' },
  ]},
  pursuit: { variants: [
    { type: 'pursuit', triggerX: 2200, radius: 250, duration: 8500, message: 'INTERCEPTOR LOCKED ON' },
    { type: 'ambush', triggerX: 2880, radius: 240, duration: 6800, message: 'CUT-OFF AHEAD' },
  ]},
  'signal-storm': { variants: [
    { type: 'signal-anomaly', triggerX: 2350, radius: 250, duration: 8000, message: 'SIGNAL FIELD DESTABILIZED' },
    { type: 'power-surge', triggerX: 3180, radius: 250, duration: 6200, message: 'ARRAY SURGE' },
  ]},
  'corporate-lockdown': { variants: [
    { type: 'ambush', triggerX: 2450, radius: 250, duration: 8000, message: 'SECURITY RESPONSE ACTIVE' },
    { type: 'pursuit', triggerX: 3220, radius: 250, duration: 8200, message: 'INTERCEPTOR DEPLOYED' },
  ]},
  'final-relay': { variants: [
    { type: 'pursuit', triggerX: 2500, radius: 260, duration: 9000, message: 'FINAL INTERCEPT' },
    { type: 'signal-anomaly', triggerX: 3420, radius: 260, duration: 7600, message: 'RELAY CORE DISTORTION' },
  ]},
};

const FALLBACK = { type: 'signal-anomaly', radius: 220, duration: 6200, message: 'SIGNAL FIELD UNSTABLE' };
const DIRECTOR = {
  baseCooldown: 7800,
  earlyCooldown: 11000,
  lateCooldown: 6200,
  nearMissDistance: 78,
};
const states = new WeakMap();
const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (from, to, amount) => from + (to - from) * amount;

function missionId(scene) {
  return [scene?.sys?.settings?.data?.missionId, scene?.sys?.settings?.data?.mission, scene?.registry?.get?.('missionId'), scene?.mission?.id, document.documentElement?.dataset?.missionId, document.body?.dataset?.missionId].find(value => typeof value === 'string') || null;
}

function progressOf(scene) {
  const bounds = scene?.physics?.world?.bounds;
  const width = Number(bounds?.width);
  const left = Number(bounds?.x);
  const playerX = Number(scene?.player?.x);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(left) || !Number.isFinite(playerX)) return 0.5;
  return clamp((playerX - left) / width, 0, 1);
}

function directorIntensity(scene) {
  const progress = progressOf(scene);
  if (progress >= 0.78) return 1.15;
  if (progress <= 0.28) return 0.85;
  return 1;
}

function directorCooldown(scene) {
  const progress = progressOf(scene);
  if (progress >= 0.78) return DIRECTOR.lateCooldown;
  if (progress <= 0.28) return DIRECTOR.earlyCooldown;
  return DIRECTOR.baseCooldown;
}

function getConfig(scene, id) {
  const variants = CONFIG[id]?.variants;
  if (variants?.length) {
    const runId = Number(scene?.runId);
    const seed = Number.isFinite(runId) ? Math.abs(runId) : Math.floor(performance.now() / 1000);
    return { ...variants[seed % variants.length] };
  }
  const bounds = scene?.physics?.world?.bounds;
  const width = Number(bounds?.width);
  const left = Number(bounds?.x);
  const triggerX = Number.isFinite(width) && width > 600 && Number.isFinite(left) ? left + width * .55 : Number(scene?.player?.x || 0) + 900;
  return { ...FALLBACK, triggerX };
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
  const list = scene.children?.list || [];
  if (!player || !list.length) return [];
  return list.filter(node => node?.active !== false && node?.texture?.key === 'signal' && distance(node, player) <= radius);
}

function feedback(scene, kind) {
  try { scene.game?.events?.emit('feedback', kind); } catch {}
}

function dispatchGameplayEvent(name, detail = {}) {
  try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {}
}

function announce(scene, config) {
  try { scene.playerCue?.(config.message, '#8df4ff'); } catch {}
  feedback(scene, config.type === 'pursuit' || config.type === 'ambush' ? 'chase' : 'warning');
}

function createWorldCue(scene, state) {
  try {
    if (state.config.type === 'signal-anomaly') {
      const signals = getNearbySignals(scene);
      state.affectedSignals = signals.map(signal => ({ signal, scaleX: signal.scaleX || 1, scaleY: signal.scaleY || 1, alpha: signal.alpha ?? 1 }));
      signals.forEach(signal => { signal.setTint?.(0x8df4ff); signal.setAlpha?.(.72); });
      state.lastWorldPulse = performance.now();
      if (!scene.motionReduced) scene.cameras?.main?.flash?.(110, 70, 180, 255, false);
    } else if (state.config.type === 'power-surge') {
      state.lastWorldPulse = performance.now();
      if (!scene.motionReduced) scene.cameras?.main?.flash?.(90, 90, 220, 255, false);
    }
  } catch (error) { console.warn('[DynamicEncounterV1] world cue skipped', error); }
}

function restoreWorldCue(state) {
  for (const entry of state.affectedSignals || []) {
    const signal = entry.signal;
    if (!signal || signal.destroyed) continue;
    try { signal.clearTint?.(); signal.setAlpha?.(entry.alpha); signal.setScale?.(entry.scaleX, entry.scaleY); } catch {}
  }
  state.affectedSignals = [];
}

function spawnAmbush(scene, state) {
  const player = scene.player;
  if (!player) return false;
  const candidates = getEnemies(scene)
    .filter(enemy => !enemy.getData?.('boss') && distance(enemy, player) > 280 && distance(enemy, player) < 1050)
    .sort((a, b) => distance(a, player) - distance(b, player));
  if (!candidates.length) return false;
  const count = state.intensity > 1 ? Math.min(2, candidates.length) : 1;
  const selected = candidates.slice(0, count);
  selected.forEach((enemy, index) => {
    const route = enemy.getData?.('route') || {};
    const direction = enemy.x < player.x ? 1 : -1;
    enemy.setData?.('dynamicEncounter', 'ambush');
    enemy.setData?.('dynamicEncounterUntil', performance.now() + state.config.duration);
    enemy.setData?.('dynamicEncounterDirection', direction);
    enemy.setData?.('dynamicEncounterSlot', index);
    enemy.setData?.('dynamicEncounterRoute', route);
  });
  state.selectedEnemies = selected;
  return true;
}

function triggerPursuit(scene, state) {
  const player = scene.player;
  const enemy = getEnemies(scene)
    .filter(candidate => !candidate.getData?.('boss'))
    .sort((a, b) => distance(a, player) - distance(b, player))
    .find(candidate => distance(candidate, player) > 240 && distance(candidate, player) < 1000);
  if (!enemy) return false;
  enemy.setData?.('dynamicEncounter', 'pursuit');
  enemy.setData?.('dynamicEncounterTarget', player);
  enemy.setData?.('dynamicEncounterUntil', performance.now() + state.config.duration);
  state.selectedEnemies = [enemy];
  return true;
}

function canActivate(scene, state, now) {
  if (state.triggered || state.completed) return false;
  if (state.lastActivatedAt && now - state.lastActivatedAt < directorCooldown(scene)) return false;
  return true;
}

function activate(scene, state) {
  const now = performance.now();
  if (!canActivate(scene, state, now)) return;
  let applied = true;
  if (state.config.type === 'ambush') applied = spawnAmbush(scene, state);
  else if (state.config.type === 'pursuit') applied = triggerPursuit(scene, state);
  if (!applied && (state.config.type === 'ambush' || state.config.type === 'pursuit')) return;
  state.triggered = true;
  state.lastActivatedAt = now;
  state.expiresAt = now + Math.round(state.config.duration / state.intensity);
  createWorldCue(scene, state);
  announce(scene, state.config);
}

function updateSignalAnomaly(scene, state, now) {
  if (state.config.type !== 'signal-anomaly' || now >= state.expiresAt) return;
  const pulse = 1 + Math.sin(now * .018) * .075;
  for (const entry of state.affectedSignals || []) {
    const signal = entry.signal;
    if (!signal?.active) continue;
    signal.setScale?.(entry.scaleX * pulse, entry.scaleY * pulse);
    signal.setAlpha?.(.52 + (Math.sin(now * .012) + 1) * .12);
  }
  if (!scene.motionReduced && now - state.lastWorldPulse > 900) {
    state.lastWorldPulse = now;
    scene.cameras?.main?.shake?.(70, .0012);
  }
}

function updatePowerSurge(scene, state, now) {
  if (state.config.type !== 'power-surge' || now >= state.expiresAt || now - state.lastWorldPulse < 700) return;
  state.lastWorldPulse = now;
  const gates = scene.movingGates?.getChildren?.() || [];
  const gate = gates.find(item => item?.active);
  if (gate && scene.tweens) scene.tweens.add({ targets: gate, alpha: .35, duration: 90, yoyo: true, repeat: 2 });
}

function checkNearMiss(scene, state, enemy, now) {
  if (!enemy?.active || state.nearMissCooldownUntil > now) return;
  const player = scene.player;
  const d = distance(enemy, player);
  const previous = state.previousEnemyDistances.get(enemy) ?? d;
  state.previousEnemyDistances.set(enemy, d);
  if (previous > DIRECTOR.nearMissDistance && d <= DIRECTOR.nearMissDistance && d > 18) {
    state.nearMissCooldownUntil = now + 650;
    dispatchGameplayEvent('relay:new-gameplay-near-miss', { distance: Math.round(d), source: enemy, missionId: state.missionId });
  }
}

function updateEnemies(scene, state, now) {
  const player = scene.player;
  if (!player) return;
  for (const enemy of state.selectedEnemies || []) {
    if (!enemy?.active) continue;
    checkNearMiss(scene, state, enemy, now);
    const mode = enemy.getData?.('dynamicEncounter');
    const until = enemy.getData?.('dynamicEncounterUntil') || 0;
    if (!mode || now >= until) {
      enemy.setData?.('dynamicEncounter', null);
      enemy.setData?.('dynamicEncounterTarget', null);
      enemy.setData?.('dynamicEncounterUntil', 0);
      continue;
    }
    if (mode === 'pursuit') {
      const target = enemy.getData?.('dynamicEncounterTarget') || player;
      const dx = (target?.x || 0) - enemy.x;
      const dy = (target?.y || 0) - enemy.y;
      if (enemy.body?.velocity) {
        enemy.body.velocity.x = clamp(enemy.body.velocity.x + Math.sign(dx) * .95, -250, 250);
        enemy.body.velocity.y = clamp(enemy.body.velocity.y + Math.sign(dy) * .18, -55, 55);
      }
      enemy.setFlipX?.(dx < 0);
    }
    if (mode === 'ambush') {
      const direction = enemy.getData?.('dynamicEncounterDirection') || 1;
      const route = enemy.getData?.('dynamicEncounterRoute') || enemy.getData?.('route') || {};
      if (enemy.body?.velocity) enemy.body.velocity.x = lerp(enemy.body.velocity.x || 0, direction * 170, .035);
      if (Number.isFinite(route.min) && Number.isFinite(route.max)) {
        if (enemy.x <= route.min) enemy.setData?.('dynamicEncounterDirection', 1);
        if (enemy.x >= route.max) enemy.setData?.('dynamicEncounterDirection', -1);
      }
      enemy.setFlipX?.(direction < 0);
    }
  }
}

function update(scene) {
  const state = states.get(scene);
  if (!state || state.completed || !scene.player?.active || scene.finished || scene.respawning) return;
  const now = performance.now();
  if (!state.triggered && Math.abs((scene.player.x || 0) - state.config.triggerX) <= state.config.radius) activate(scene, state);
  if (!state.triggered) return;
  updateSignalAnomaly(scene, state, now);
  updatePowerSurge(scene, state, now);
  updateEnemies(scene, state, now);
  if (state.expiresAt && now >= state.expiresAt) {
    restoreWorldCue(state);
    state.selectedEnemies?.forEach(enemy => {
      if (!enemy?.active) return;
      enemy.setData?.('dynamicEncounter', null);
      enemy.setData?.('dynamicEncounterTarget', null);
      enemy.setData?.('dynamicEncounterUntil', 0);
    });
    state.selectedEnemies = [];
    state.previousEnemyDistances.clear();
    state.completed = true;
  }
}

function setup(scene) {
  if (!scene || states.has(scene) || !scene.player) return;
  const id = missionId(scene);
  states.set(scene, {
    missionId: id,
    config: getConfig(scene, id),
    intensity: directorIntensity(scene),
    triggered: false,
    completed: false,
    expiresAt: 0,
    lastActivatedAt: 0,
    lastWorldPulse: 0,
    nearMissCooldownUntil: 0,
    affectedSignals: [],
    selectedEnemies: [],
    previousEnemyDistances: new Map(),
  });
}

function teardown(scene) {
  const state = states.get(scene);
  if (!state) return;
  restoreWorldCue(state);
  state.selectedEnemies?.forEach(enemy => {
    if (!enemy?.active) return;
    enemy.setData?.('dynamicEncounter', null);
    enemy.setData?.('dynamicEncounterTarget', null);
    enemy.setData?.('dynamicEncounterUntil', 0);
  });
  state.previousEnemyDistances.clear();
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
