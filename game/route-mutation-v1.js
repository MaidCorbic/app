import { RunnerScene } from './src/scenes/RunnerScene.js';

// ROUTE MUTATION V1
// Reuses existing barrier objects. Once per run, an authored pair of barriers
// swaps open/closed state after the player passes mid-route. No new mission owner.

const sceneState = new WeakMap();

function setup(scene) {
  if (!scene?.player || sceneState.has(scene)) return;
  const barriers = scene.barriers?.getChildren?.() || [];
  if (barriers.length < 2) return;

  const ordered = barriers.filter(item => item?.active).sort((a, b) => a.x - b.x);
  const left = ordered[Math.max(0, Math.floor(ordered.length * .42))];
  const right = ordered[Math.max(0, Math.floor(ordered.length * .64))];
  if (!left || !right || left === right) return;

  sceneState.set(scene, { left, right, mutated: false });
}

function update(scene) {
  const state = sceneState.get(scene);
  if (!state || state.mutated || scene.finished) return;
  const start = Number(scene.mission?.spawn?.x ?? scene.player.x ?? 0);
  const goal = Number(scene.mission?.goal?.x ?? start + 3200);
  const threshold = start + (goal - start) * .55;
  if (scene.player.x < threshold) return;

  state.mutated = true;
  state.left.disableBody?.(true, true);
  state.right.enableBody?.(false, state.right.x, state.right.y, true, true);
  state.right.setImmovable?.(true);
  scene.playerCue?.('ROUTE SHIFT · NEW LINE OPEN', '#8df4ff');
  scene.game?.events?.emit('feedback', 'signal');

  const flash = scene.add.circle(state.right.x, state.right.y, 12, 0x8df4ff, .22).setDepth(12);
  scene.tweens?.add({ targets: flash, scale: 4, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
}

function teardown(scene) { sceneState.delete(scene); }

if (!RunnerScene.prototype.__routeMutationPatched) {
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function routeMutationCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { setup(this); } catch (error) { console.error('[RouteMutation] create failed', error); }
    return result;
  };
  RunnerScene.prototype.update = function routeMutationUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    try { update(this); } catch (error) { console.error('[RouteMutation] update failed', error); }
    return result;
  };
  RunnerScene.prototype.shutdown = function routeMutationShutdown(...args) {
    try { teardown(this); } catch (error) { console.error('[RouteMutation] teardown failed', error); }
    return originalShutdown.apply(this, args);
  };
  RunnerScene.prototype.__routeMutationPatched = true;
}
