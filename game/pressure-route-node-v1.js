import { RunnerScene } from './src/scenes/RunnerScene.js';

// PRESSURE ROUTE NODE V1
// Uses existing moving gates/barriers. No new HUD, mission, score,
// cargo, progression, or movement owner.

const sceneState = new WeakMap();

function hasBody(gameObject) {
  return !!gameObject?.body && typeof gameObject.body === 'object';
}

function disableGate(gate) {
  if (!gate?.active) return false;
  if (hasBody(gate)) {
    if (typeof gate.body.stop === 'function') gate.body.stop();
    gate.body.enable = false;
    return true;
  }
  return false;
}

function enableGate(gate) {
  if (!gate?.active || !hasBody(gate)) return false;
  if (typeof gate.enableBody === 'function') {
    gate.enableBody(false, gate.x, gate.y, true, true);
    gate.setImmovable?.(true);
    return true;
  }
  gate.body.enable = true;
  return true;
}

function setup(scene) {
  if (!scene?.player || sceneState.has(scene)) return;
  const gates = scene.movingGates?.getChildren?.() || [];
  if (!gates.length) return;

  const gate = gates[0];
  const plate = scene.add.rectangle(gate.x - 120, gate.y + 32, 54, 8, 0xaee37f, .35)
    .setStrokeStyle(1, 0xaee37f, .7)
    .setDepth(6);
  const ring = scene.add.circle(plate.x, plate.y - 3, 15, 0xaee37f, .04)
    .setStrokeStyle(1, 0xaee37f, .3)
    .setDepth(5);

  scene.physics.add.existing(plate, true);
  sceneState.set(scene, { plate, ring, gate, activeUntil: 0, used: false });
}

function update(scene) {
  const state = sceneState.get(scene);
  if (!state || !scene.player?.active || scene.finished) return;
  if (!state.plate?.active || !state.gate?.active) return;

  const now = Number(scene.elapsedMs || 0);
  const plateHit = Math.abs(scene.player.x - state.plate.x) < 34 && Math.abs(scene.player.y - state.plate.y) < 44;

  if (plateHit && !state.used) {
    state.used = true;
    state.activeUntil = now + 2600;
    state.gate.setAlpha(.24);
    disableGate(state.gate);
    state.ring.setStrokeStyle(2, 0xaee37f, .9);
    scene.playerCue?.('ROUTE SWITCH · GATE OPEN', '#aee37f');
    scene.game?.events?.emit('feedback', 'signal');
  }

  if (state.activeUntil && now >= state.activeUntil) {
    state.activeUntil = 0;
    enableGate(state.gate);
    state.gate.setAlpha(1);
    state.gate.setImmovable?.(true);
    state.ring.setStrokeStyle(1, 0xaee37f, .3);
    scene.playerCue?.('ROUTE SWITCH · CLOSED', '#c8d7e2');
  }
}

function teardown(scene) {
  const state = sceneState.get(scene);
  if (!state) return;
  state.plate?.destroy?.();
  state.ring?.destroy?.();
  sceneState.delete(scene);
}

if (!RunnerScene.prototype.__pressureRouteNodePatched) {
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function pressureRouteNodeCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { setup(this); } catch (error) { console.error('[PressureRoute] create failed', error); }
    return result;
  };
  RunnerScene.prototype.update = function pressureRouteNodeUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    try { update(this); } catch (error) { console.error('[PressureRoute] update failed', error); }
    return result;
  };
  RunnerScene.prototype.shutdown = function pressureRouteNodeShutdown(...args) {
    try { teardown(this); } catch (error) { console.error('[PressureRoute] teardown failed', error); }
    return originalShutdown.apply(this, args);
  };
  RunnerScene.prototype.__pressureRouteNodePatched = true;
}
