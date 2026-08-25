import { RunnerScene } from './src/scenes/RunnerScene.js';

// TIMED ENERGY TRAP V1
// Uses the existing energy state only. No new damage, HUD, mission, score,
// cargo, progression, or movement system.

const sceneState = new WeakMap();

function routeX(scene, fraction) {
  const start = Number(scene?.mission?.spawn?.x ?? scene?.player?.x ?? 0);
  const goal = Number(scene?.mission?.goal?.x ?? start + 3200);
  return start + (goal - start) * fraction;
}

function groundY(scene, x, fallback = 560) {
  const platforms = scene?.mission?.platforms || [];
  return platforms
    .map(([px, py, width]) => ({ x: px, y: py, width }))
    .filter(p => x >= p.x + 20 && x <= p.x + p.width - 20)
    .sort((a, b) => a.y - b.y)[0]?.y ?? fallback;
}

function setup(scene) {
  if (!scene?.player || sceneState.has(scene)) return;
  const start = Number(scene.mission?.spawn?.x ?? scene.player.x ?? 0);
  const goal = Number(scene.mission?.goal?.x ?? start + 3200);
  if (!(goal - start > 1500)) return;

  const x = routeX(scene, .56);
  const y = groundY(scene, x) - 20;
  const zone = scene.add.rectangle(x, y, 138, 48, 0xff826e, .055).setDepth(4);
  const core = scene.add.rectangle(x, y, 118, 3, 0xff826e, .72).setDepth(5);
  scene.physics.add.existing(zone, true);

  const state = {
    zone,
    core,
    active: false,
    phase: 0,
    drainCarry: 0,
    lastCueAt: -Infinity,
  };
  sceneState.set(scene, state);

  if (!scene.motionReduced) {
    scene.tweens.add({ targets: core, alpha: { from: .25, to: 1 }, duration: 360, yoyo: true, repeat: -1 });
    scene.tweens.add({ targets: zone, alpha: { from: .025, to: .12 }, duration: 540, yoyo: true, repeat: -1 });
  }
}

function update(scene, delta) {
  const state = sceneState.get(scene);
  if (!state || !scene.player?.active || scene.finished) return;

  const now = Number(scene.elapsedMs || 0);
  const period = 3600;
  const phase = now % period;
  const active = phase >= 1500 && phase < 2850;
  const changed = active !== state.active;
  state.active = active;
  state.phase = phase;

  state.core.setFillStyle(active ? 0xff826e : 0x8df4ff, active ? .9 : .42);
  state.zone.setFillStyle(active ? 0xff826e : 0x8df4ff, active ? .08 : .025);

  if (changed && now - state.lastCueAt > 700) {
    state.lastCueAt = now;
    scene.playerCue?.(active ? 'ENERGY FIELD · WAIT OR PUSH' : 'ENERGY FIELD · CLEAR', active ? '#ffcf82' : '#b9f5ff');
  }

  if (!active || scene.respawning) return;

  const inside = Math.abs(scene.player.x - state.zone.x) < 68 && Math.abs(scene.player.y - state.zone.y) < 44;
  if (!inside) return;

  state.drainCarry += delta;
  if (state.drainCarry < 250) return;
  const ticks = Math.floor(state.drainCarry / 250);
  state.drainCarry -= ticks * 250;
  const before = Number(scene.energy || 0);
  scene.energy = Math.max(0, before - ticks * 4);
  if (scene.energy !== before) scene.game?.events?.emit('energy', scene.energy, scene.energyMax);
  if (before > 0 && now - state.lastCueAt > 900) {
    state.lastCueAt = now;
    scene.playerCue?.('ENERGY DRAIN · MOVE', '#ff9c91');
    scene.game?.events?.emit('feedback', 'empty');
  }
}

function teardown(scene) {
  const state = sceneState.get(scene);
  if (!state) return;
  state.zone?.destroy?.();
  state.core?.destroy?.();
  sceneState.delete(scene);
}

if (!RunnerScene.prototype.__timedEnergyTrapPatched) {
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function timedEnergyTrapCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { setup(this); } catch (error) { console.error('[EnergyTrap] create failed', error); }
    return result;
  };

  RunnerScene.prototype.update = function timedEnergyTrapUpdate(...args) {
    const delta = Number(args[1] ?? this.game?.loop?.delta ?? 16.67);
    const result = originalUpdate.apply(this, args);
    try { update(this, delta); } catch (error) { console.error('[EnergyTrap] update failed', error); }
    return result;
  };

  RunnerScene.prototype.shutdown = function timedEnergyTrapShutdown(...args) {
    try { teardown(this); } catch (error) { console.error('[EnergyTrap] teardown failed', error); }
    return originalShutdown.apply(this, args);
  };

  RunnerScene.prototype.__timedEnergyTrapPatched = true;
}
