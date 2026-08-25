import { RunnerScene } from './src/scenes/RunnerScene.js';

// TEMPORARY WORLD DISTORTION V1
// A short diegetic signal-interference beat. Reuses camera, signal sprites,
// and existing feedback. No HUD, mission, score, progression, or movement owner.

const sceneState = new WeakMap();

function setup(scene) {
  if (!scene?.player || sceneState.has(scene)) return;
  const start = Number(scene.mission?.spawn?.x ?? scene.player.x ?? 0);
  const goal = Number(scene.mission?.goal?.x ?? start + 3200);
  if (!(goal - start > 1700)) return;
  sceneState.set(scene, { triggered: false, restoreTimer: 0, originals: [] });
}

function trigger(scene, state) {
  if (state.triggered || scene.finished || scene.motionReduced) return;
  state.triggered = true;
  const camera = scene.cameras.main;
  const signals = scene.signals?.getChildren?.().filter(item => item?.active) || [];
  state.originals = signals.slice(0, 12).map(signal => ({ signal, tint: signal.tintTopLeft ?? 0xffffff, angle: signal.angle, alpha: signal.alpha }));

  camera.flash(140, 70, 190, 255);
  scene.playerCue?.('SIGNAL DISTORTION', '#b9f5ff');
  scene.game?.events?.emit('feedback', 'warning');

  scene.tweens.add({ targets: camera, zoom: { from: 1.018, to: 0.985 }, angle: { from: -0.6, to: .55 }, duration: 220, yoyo: true });
  signals.forEach((signal, index) => {
    signal.setTint(0xb993ff);
    signal.setAlpha(.62);
    signal.setAngle((index % 2 ? -1 : 1) * 8);
  });

  state.restoreTimer = (scene.elapsedMs || 0) + 900;
}

function restore(scene, state) {
  if (!state.restoreTimer || (scene.elapsedMs || 0) < state.restoreTimer) return;
  state.originals.forEach(({ signal, tint, angle, alpha }) => {
    if (!signal?.active) return;
    signal.clearTint?.();
    signal.setAngle(angle);
    signal.setAlpha(alpha);
  });
  sceneState.set(scene, { ...state, restoreTimer: 0 });
}

function update(scene) {
  const state = sceneState.get(scene);
  if (!state || scene.finished) return;
  const start = Number(scene.mission?.spawn?.x ?? scene.player.x ?? 0);
  const goal = Number(scene.mission?.goal?.x ?? start + 3200);
  const threshold = start + (goal - start) * .82;
  if (!state.triggered && scene.player.x >= threshold) trigger(scene, state);
  if (state.triggered) restore(scene, state);
}

function teardown(scene) {
  const state = sceneState.get(scene);
  if (!state) return;
  state.originals?.forEach(({ signal, angle, alpha }) => {
    if (!signal?.active) return;
    signal.clearTint?.();
    signal.setAngle(angle);
    signal.setAlpha(alpha);
  });
  sceneState.delete(scene);
}

if (!RunnerScene.prototype.__temporaryWorldDistortionPatched) {
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function temporaryWorldDistortionCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { setup(this); } catch (error) { console.error('[WorldDistortion] create failed', error); }
    return result;
  };
  RunnerScene.prototype.update = function temporaryWorldDistortionUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    try { update(this); } catch (error) { console.error('[WorldDistortion] update failed', error); }
    return result;
  };
  RunnerScene.prototype.shutdown = function temporaryWorldDistortionShutdown(...args) {
    try { teardown(this); } catch (error) { console.error('[WorldDistortion] teardown failed', error); }
    return originalShutdown.apply(this, args);
  };
  RunnerScene.prototype.__temporaryWorldDistortionPatched = true;
}
