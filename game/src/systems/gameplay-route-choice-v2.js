// RUNNER RELAY — GAMEPLAY ROUTE CHOICE V2
// Integrates the existing gameplay systems without becoming a new mission/enemy owner.
// SAFE reduces one nearby non-boss threat for a short window.
// HOT marks one nearby non-boss threat as an aggressive pressure target for a short window.
// Both effects are reversible and scoped to one run.

import { RunnerScene } from '../scenes/RunnerScene.js';

const states = new WeakMap();
const ACTIONS = new Set(['dash', 'jump', 'vault', 'sword', 'fire', 'build']);
const WINDOW_MS = 5200;
const ACTIVATION_PROGRESS = 0.42;

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, Number(v) || 0));

function progressOf(scene) {
  const mission = scene?.mission;
  const start = Number(mission?.spawn?.x ?? scene?.physics?.world?.bounds?.x ?? 0);
  const goal = Number(mission?.goal?.x ?? start + 3200);
  const player = Number(scene?.player?.x);
  if (!Number.isFinite(player) || goal <= start) return 0;
  return clamp((player - start) / (goal - start));
}

function enemiesOf(scene) {
  for (const group of [scene?.enemies, scene?.hostiles, scene?.enemyGroup]) {
    const children = group?.getChildren?.() || (Array.isArray(group) ? group : null);
    if (children?.length) {
      return children.filter(enemy => enemy && enemy.active !== false && enemy.body?.enable !== false);
    }
  }
  return [];
}

function distance(a, b) {
  return Math.hypot((Number(a?.x) || 0) - (Number(b?.x) || 0), (Number(a?.y) || 0) - (Number(b?.y) || 0));
}

function showCue(scene, message) {
  try { scene?.playerCue?.(message, '#8df4ff'); } catch {}
  try { scene?.game?.events?.emit?.('feedback', 'signal'); } catch {}
}

function snapshotEnemy(state, enemy) {
  if (!enemy || state.enemySnapshots.has(enemy)) return;
  const velocity = enemy.body?.velocity;
  state.enemySnapshots.set(enemy, {
    velocityX: Number(velocity?.x) || 0,
    velocityY: Number(velocity?.y) || 0,
    active: enemy.active !== false,
    bodyEnabled: enemy.body?.enable !== false,
    tint: enemy.tint,
    dynamicEncounter: enemy.getData?.('dynamicEncounter'),
    dynamicUntil: enemy.getData?.('dynamicEncounterUntil'),
    route: enemy.getData?.('dynamicEncounterRoute')
  });
}

function restoreEnemy(state, enemy) {
  const snapshot = state.enemySnapshots.get(enemy);
  if (!snapshot || !enemy) return;
  try {
    if (enemy.body?.velocity) {
      enemy.body.velocity.x = snapshot.velocityX;
      enemy.body.velocity.y = snapshot.velocityY;
    }
    if (snapshot.bodyEnabled && enemy.body?.enable === false) {
      enemy.enableBody?.(true, enemy.x, enemy.y, true, true);
    }
    if (!snapshot.bodyEnabled && enemy.body?.enable !== false) {
      enemy.disableBody?.(false, false);
    }
    enemy.clearTint?.();
    if (snapshot.tint != null) enemy.setTint?.(snapshot.tint);
    enemy.setData?.('dynamicEncounter', snapshot.dynamicEncounter);
    enemy.setData?.('dynamicEncounterUntil', snapshot.dynamicUntil);
    enemy.setData?.('dynamicEncounterRoute', snapshot.route);
  } catch {}
  state.enemySnapshots.delete(enemy);
}

function restoreAll(state) {
  for (const enemy of [...state.enemySnapshots.keys()]) restoreEnemy(state, enemy);
  state.enemySnapshots.clear();
}

function selectTarget(scene, route) {
  const player = scene?.player;
  if (!player) return null;
  const candidates = enemiesOf(scene)
    .filter(enemy => !enemy.getData?.('boss'))
    .filter(enemy => {
      const dx = Number(enemy.x) - Number(player.x);
      return dx > 180 && dx < 1050 && Math.abs(Number(enemy.y) - Number(player.y)) < 420;
    })
    .sort((a, b) => Math.abs(Number(a.x) - Number(player.x)) - Math.abs(Number(b.x) - Number(player.x)));
  if (!candidates.length) return null;
  return route === 'hot' ? candidates[Math.min(1, candidates.length - 1)] : candidates[0];
}

function activateRoute(scene, state, route) {
  if (state.effectActive || !['safe', 'hot'].includes(route)) return;
  const target = selectTarget(scene, route);
  state.route = route;
  state.multiplier = route === 'hot' ? 1.5 : 1;
  state.effectActive = true;
  state.effectUntil = performance.now() + WINDOW_MS;
  state.target = target;
  if (!target) {
    showCue(scene, route === 'hot' ? 'HOT ROUTE // NO TARGET — CLEAR LANE' : 'SAFE ROUTE // CLEAR LANE');
    return;
  }

  snapshotEnemy(state, target);
  try {
    if (route === 'safe') {
      target.disableBody?.(false, false);
      target.setData?.('varietyRoute', 'safe');
      target.setTint?.(0x527686);
      showCue(scene, 'SAFE ROUTE // THREAT DISENGAGED');
      try { scene?.game?.events?.emit?.('relay:variety-route-effect', { route, effect: 'threat-disengaged' }); } catch {}
    } else {
      const player = scene?.player;
      target.setData?.('varietyRoute', 'hot');
      target.setData?.('dynamicEncounter', 'ambush');
      target.setData?.('dynamicEncounterUntil', state.effectUntil);
      target.setData?.('dynamicEncounterRoute', 'hot');
      target.setTint?.(0xff6b6b);
      const direction = Number(target.x) < Number(player?.x) ? 1 : -1;
      target.setVelocityX?.(direction * 125);
      showCue(scene, 'HOT ROUTE // INTERCEPTOR ENGAGED');
      try { scene?.game?.events?.emit?.('relay:variety-route-effect', { route, effect: 'pressure-targeted' }); } catch {}
    }
  } catch (error) {
    console.warn('[GameplayRouteChoiceV2] route effect skipped', error);
  }
}

function applyChoice(scene, state, route) {
  state.routeChoices += 1;
  state.route = route;
  state.multiplier = route === 'hot' ? 1.5 : 1;
  state.requestedAt = performance.now();
  state.armed = true;
  showCue(scene, route === 'hot' ? 'HOT ROUTE // ARMED' : 'SAFE ROUTE // ARMED');
  try {
    scene?.game?.events?.emit?.('relay:variety-route', {
      route,
      multiplier: state.multiplier,
      gameplayIntegrated: true
    });
  } catch {}
}

function update(scene, state, now) {
  if (!state?.armed || state.effectActive || progressOf(scene) < ACTIVATION_PROGRESS) return;
  activateRoute(scene, state, state.route);
}

function cleanup(scene, state) {
  restoreAll(state);
  if (state.raf) cancelAnimationFrame(state.raf);
  if (state.feedbackBound) {
    try { scene?.game?.events?.off?.('feedback', state.feedbackHandler); } catch {}
  }
  states.delete(scene);
  if (scene) scene.__relayGameplayRouteChoiceV2 = null;
}

function init(scene) {
  if (!scene || states.has(scene)) return;
  const state = {
    route: 'safe', multiplier: 1, routeChoices: 0, requestedAt: 0,
    armed: false, effectActive: false, effectUntil: 0, target: null,
    enemySnapshots: new Map(), raf: 0, feedbackBound: false, feedbackHandler: null
  };
  states.set(scene, state);
  scene.__relayGameplayRouteChoiceV2 = state;

  const events = scene.game?.events;
  if (events) {
    state.feedbackHandler = kind => {
      const value = String(kind || '').toLowerCase();
      if (ACTIONS.has(value) && state.route === 'hot') {
        state.hotFlow = Math.min(8, (state.hotFlow || 0) + 1);
      }
    };
    events.on('feedback', state.feedbackHandler);
    state.feedbackBound = true;
  }

  const loop = now => {
    if (!states.has(scene)) return;
    try {
      if (scene.finished || scene.sys?.isActive?.() === false) {
        cleanup(scene, state);
        return;
      }
      if (state.effectActive && now >= state.effectUntil) {
        restoreAll(state);
        state.effectActive = false;
        state.target = null;
        try { scene?.game?.events?.emit?.('relay:variety-route-effect', { route: state.route, effect: 'window-complete' }); } catch {}
        showCue(scene, state.route === 'hot' ? 'HOT ROUTE // PRESSURE WINDOW COMPLETE' : 'SAFE ROUTE // LANE STABLE');
      }
      update(scene, state, now);
    } catch (error) {
      console.warn('[GameplayRouteChoiceV2] update skipped', error);
    }
    state.raf = requestAnimationFrame(loop);
  };
  state.raf = requestAnimationFrame(loop);
  scene.events?.once?.('shutdown', () => cleanup(scene, state));
}

if (!RunnerScene.prototype.__relayGameplayRouteChoiceV2) {
  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function gameplayRouteChoiceV2Create(...args) {
    const result = originalCreate.apply(this, args);
    try { init(this); } catch (error) { console.warn('[GameplayRouteChoiceV2] create failed', error); }
    return result;
  };
  RunnerScene.prototype.__relayGameplayRouteChoiceV2 = true;
}

window.addEventListener('relay:gameplay-variety-route-choice', event => {
  const scene = event.detail?.scene || window.__relayRunnerScene;
  const route = event.detail?.route;
  const state = scene ? states.get(scene) : null;
  if (state && ['safe', 'hot'].includes(route)) applyChoice(scene, state, route);
});
