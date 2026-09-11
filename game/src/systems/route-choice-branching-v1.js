// RUNNER RELAY — ROUTE CHOICE BRANCHING V2
// Mission-specific branch profiles using existing barrier geometry.
// Additive only: no new mission, physics, input, or progression owner.

import { RunnerScene } from '../scenes/RunnerScene.js';

const states = new WeakMap();
const DEFAULT_ACTIVATION_PROGRESS = 0.5;
const BRANCH_WINDOW_MS = 900;
const MIN_FORWARD_DISTANCE = 120;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));

// Offsets are resolved against barriers that are still ahead of the player when
// the branch is actually applied. This prevents a profile from mutating an
// obstacle that the courier has already passed.
const BRANCH_PROFILES = Object.freeze({
  'first-delivery': { safeOffset: 0, hotOffset: 1, activationProgress: 0.40, label: 'OLD QUARTER // MID-ROUTE SPLIT' },
  'dead-drop': { safeOffset: 0, hotOffset: 1, activationProgress: 0.48, label: 'SALT DOCKS // LOW-HIGH SPLIT' },
  blackout: { safeOffset: 0, hotOffset: 1, activationProgress: 0.46, label: 'GRID NINE // LIT-DARK SPLIT' },
  pursuit: { safeOffset: 0, hotOffset: 1, activationProgress: 0.42, label: 'RAIL SPINE // ESCAPE-INTERCEPT SPLIT' },
  'signal-storm': { safeOffset: 0, hotOffset: 1, activationProgress: 0.46, label: 'CROWN ARRAY // CLEAN-STORM SPLIT' },
  'corporate-lockdown': { safeOffset: 0, hotOffset: 1, activationProgress: 0.45, label: 'HELIX TOWER // SECURITY SPLIT' },
  'final-relay': { safeOffset: 0, hotOffset: 1, activationProgress: 0.48, label: 'APEX SPINE // FINAL SPLIT' }
});

function missionId(scene) {
  const candidates = [
    scene?.mission?.id,
    scene?.sys?.settings?.data?.missionId,
    scene?.sys?.settings?.data?.mission,
    scene?.registry?.get?.('missionId'),
    typeof document !== 'undefined' ? document?.documentElement?.dataset?.missionId : null,
    typeof document !== 'undefined' ? document?.body?.dataset?.missionId : null
  ];
  return candidates.find(value => typeof value === 'string' && value.length > 0) || null;
}

function progressOf(scene) {
  const mission = scene?.mission;
  const start = Number(mission?.spawn?.x ?? scene?.physics?.world?.bounds?.x ?? 0);
  const goal = Number(mission?.goal?.x ?? start + 3200);
  const player = Number(scene?.player?.x);
  if (!Number.isFinite(player) || goal <= start) return 0;
  return clamp((player - start) / (goal - start));
}

function getBarriers(scene) {
  const children = scene?.barriers?.getChildren?.() || [];
  return children
    .filter(item => item?.active)
    .filter(item => item?.body || item?.enableBody)
    .sort((a, b) => Number(a.x) - Number(b.x));
}

function getForwardBarriers(scene) {
  const playerX = Number(scene?.player?.x);
  if (!Number.isFinite(playerX)) return [];
  return getBarriers(scene).filter(item => Number(item.x) > playerX + MIN_FORWARD_DISTANCE);
}

function pickBranch(scene) {
  const id = missionId(scene);
  const profile = BRANCH_PROFILES[id];
  const ordered = getForwardBarriers(scene);
  if (ordered.length < 2) return null;

  if (profile) {
    const safeIndex = Math.max(0, Number(profile.safeOffset) || 0);
    const hotIndex = Math.max(safeIndex + 1, Number(profile.hotOffset) || safeIndex + 1);
    const left = ordered[safeIndex];
    const right = ordered[hotIndex];
    if (left && right && left !== right) {
      return { left, right, profile, source: 'mission-profile' };
    }
  }

  const left = ordered[0];
  const right = ordered[1];
  if (!left || !right || left === right) return null;
  return { left, right, profile: profile || null, source: 'forward-fallback' };
}

function setBarrierOpen(barrier, open) {
  if (!barrier?.active) return false;
  try {
    if (open) {
      barrier.disableBody?.(true, true);
      barrier.setData?.('relayRouteGate', 'open');
      return true;
    }
    if (!barrier.body) return false;
    barrier.enableBody?.(false, barrier.x, barrier.y, true, true);
    barrier.setImmovable?.(true);
    barrier.setData?.('relayRouteGate', 'closed');
    return true;
  } catch (error) {
    console.warn('[RouteChoiceBranchingV2] barrier state skipped', error);
    return false;
  }
}

function pulse(scene, barrier, color = 0x8df4ff) {
  if (!barrier?.active || !scene?.add?.circle) return;
  try {
    const ring = scene.add.circle(Number(barrier.x) || 0, Number(barrier.y) || 0, 10, color, 0.2).setDepth(12);
    scene.tweens?.add?.({ targets: ring, scale: 3.5, alpha: 0, duration: BRANCH_WINDOW_MS, onComplete: () => ring.destroy() });
  } catch {}
}

function applyBranch(scene, state) {
  if (state.branchApplied || !['safe', 'hot'].includes(state.route)) return;
  const branch = state.branch || pickBranch(scene);
  const profile = branch?.profile;
  const activationProgress = Number(profile?.activationProgress) || DEFAULT_ACTIVATION_PROGRESS;
  if (progressOf(scene) < activationProgress) return;

  if (!branch?.left || !branch?.right || branch.left === branch.right) {
    state.branchApplied = true;
    return;
  }
  state.branch = branch;
  state.branchApplied = true;

  const mission = missionId(scene) || 'unknown-mission';
  const branchName = state.route === 'safe' ? 'stable' : 'alternate';
  const color = state.route === 'safe' ? 0x8df4ff : 0xff6b6b;
  const cue = state.route === 'safe'
    ? `SAFE ROUTE // ${profile?.label || 'STABLE LINE OPEN'}`
    : `HOT ROUTE // ${profile?.label || 'ALTERNATE LINE OPEN'}`;

  if (state.route === 'safe') {
    setBarrierOpen(branch.left, true);
    setBarrierOpen(branch.right, false);
    pulse(scene, branch.left, color);
  } else {
    setBarrierOpen(branch.right, true);
    setBarrierOpen(branch.left, false);
    pulse(scene, branch.right, color);
  }

  scene.playerCue?.(cue, state.route === 'safe' ? '#8df4ff' : '#ff6b6b');
  try {
    scene.game?.events?.emit?.('relay:route-branch-applied', {
      route: state.route,
      branch: branchName,
      mission,
      profile: profile?.label || null,
      source: branch.source
    });
  } catch {}
}

function cleanup(scene, state) {
  if (state?.choiceHandler) {
    try { scene?.game?.events?.off?.('relay:variety-route', state.choiceHandler); } catch {}
  }
  if (state?.raf) cancelAnimationFrame(state.raf);
  states.delete(scene);
  if (scene) scene.__relayRouteChoiceBranchingV1 = null;
}

function init(scene) {
  if (!scene || states.has(scene)) return;
  const state = {
    route: null,
    branch: null,
    branchApplied: false,
    choiceHandler: null,
    raf: 0
  };
  states.set(scene, state);
  scene.__relayRouteChoiceBranchingV1 = state;

  const events = scene.game?.events;
  if (events) {
    state.choiceHandler = payload => {
      const route = payload?.route;
      if (!['safe', 'hot'].includes(route) || state.branchApplied) return;
      state.route = route;
      state.branchApplied = false;
      // Resolve the actual barrier pair only when the route reaches its
      // activation window, so the chosen pair is guaranteed to be forward.
      state.branch = null;
      const profile = BRANCH_PROFILES[missionId(scene)];
      if (profile?.label) {
        try { scene.playerCue?.(`ROUTE LOCK // ${profile.label}`, '#b9f5ff'); } catch {}
      }
    };
    events.on('relay:variety-route', state.choiceHandler);
  }

  const loop = () => {
    if (!states.has(scene)) return;
    try {
      if (scene.finished || scene.sys?.isActive?.() === false) {
        cleanup(scene, state);
        return;
      }
      applyBranch(scene, state);
    } catch (error) {
      console.warn('[RouteChoiceBranchingV2] update skipped', error);
    }
    state.raf = requestAnimationFrame(loop);
  };
  state.raf = requestAnimationFrame(loop);
  scene.events?.once?.('shutdown', () => cleanup(scene, state));
}

if (!RunnerScene.prototype.__relayRouteChoiceBranchingV1) {
  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function routeChoiceBranchingCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { init(this); } catch (error) { console.warn('[RouteChoiceBranchingV2] create failed', error); }
    return result;
  };
  RunnerScene.prototype.__relayRouteChoiceBranchingV1 = true;
}
