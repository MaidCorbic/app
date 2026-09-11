// RUNNER RELAY — ROUTE CHOICE BRANCHING V1
// Turns SAFE/HOT selection into a real mid-route branch using existing barriers.
// Additive only: no new mission, physics, input, or progression owner.

import { RunnerScene } from '../scenes/RunnerScene.js';

const states = new WeakMap();
const ACTIVATION_PROGRESS = 0.50;
const BRANCH_WINDOW_MS = 900;

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));

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

function pickBranch(scene) {
  const ordered = getBarriers(scene);
  if (ordered.length < 2) return null;
  return {
    left: ordered[Math.max(0, Math.floor(ordered.length * 0.42))],
    right: ordered[Math.max(0, Math.floor(ordered.length * 0.64))]
  };
}

function setBarrierOpen(barrier, open) {
  if (!barrier?.active) return false;
  try {
    if (open) {
      barrier.disableBody?.(true, true);
      return true;
    }

    if (!barrier.body) return false;
    barrier.enableBody?.(false, barrier.x, barrier.y, true, true);
    barrier.setImmovable?.(true);
    return true;
  } catch (error) {
    console.warn('[RouteChoiceBranchingV1] barrier state skipped', error);
    return false;
  }
}

function pulse(scene, barrier, color = 0x8df4ff) {
  if (!barrier?.active || !scene?.add?.circle) return;
  try {
    const ring = scene.add.circle(Number(barrier.x) || 0, Number(barrier.y) || 0, 10, color, 0.2).setDepth(12);
    scene.tweens?.add?.({
      targets: ring,
      scale: 3.5,
      alpha: 0,
      duration: BRANCH_WINDOW_MS,
      onComplete: () => ring.destroy()
    });
  } catch {}
}

function applyBranch(scene, state) {
  if (state.branchApplied || !['safe', 'hot'].includes(state.route)) return;
  if (progressOf(scene) < ACTIVATION_PROGRESS) return;

  const branch = state.branch || pickBranch(scene);
  if (!branch?.left || !branch?.right || branch.left === branch.right) {
    state.branchApplied = true;
    return;
  }

  state.branch = branch;
  state.branchApplied = true;

  const stableOpen = branch.left;
  const stableClosed = branch.right;
  const alternateOpen = branch.right;
  const alternateClosed = branch.left;

  if (state.route === 'safe') {
    setBarrierOpen(stableOpen, true);
    setBarrierOpen(stableClosed, false);
    pulse(scene, stableOpen, 0x8df4ff);
    scene.playerCue?.('SAFE ROUTE // STABLE LINE OPEN', '#8df4ff');
    try { scene.game?.events?.emit?.('relay:route-branch-applied', { route: 'safe', branch: 'stable' }); } catch {}
  } else {
    setBarrierOpen(alternateOpen, true);
    setBarrierOpen(alternateClosed, false);
    pulse(scene, alternateOpen, 0xff6b6b);
    scene.playerCue?.('HOT ROUTE // ALTERNATE LINE OPEN', '#ff6b6b');
    try { scene.game?.events?.emit?.('relay:route-branch-applied', { route: 'hot', branch: 'alternate' }); } catch {}
  }
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

  const state = { route: null, branch: null, branchApplied: false, choiceHandler: null, raf: 0 };
  states.set(scene, state);
  scene.__relayRouteChoiceBranchingV1 = state;

  const events = scene.game?.events;
  if (events) {
    state.choiceHandler = payload => {
      const route = payload?.route;
      if (!['safe', 'hot'].includes(route)) return;
      state.route = route;
      state.branchApplied = false;
      state.branch = pickBranch(scene);
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
      console.warn('[RouteChoiceBranchingV1] update skipped', error);
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
    try { init(this); } catch (error) { console.warn('[RouteChoiceBranchingV1] create failed', error); }
    return result;
  };
  RunnerScene.prototype.__relayRouteChoiceBranchingV1 = true;
}
