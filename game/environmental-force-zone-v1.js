import { RunnerScene } from './src/scenes/RunnerScene.js';

// ENVIRONMENTAL FORCE ZONE V1
// New world interaction only. Uses existing player physics and movement state.
// No HUD, damage, mission, score, cargo, progression, or movement owner.

const sceneState = new WeakMap();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function routeX(scene, fraction) {
  const start = Number(scene?.mission?.spawn?.x ?? scene?.player?.x ?? 0);
  const goal = Number(scene?.mission?.goal?.x ?? start + 3200);
  return start + (goal - start) * fraction;
}

function groundY(scene, x, fallback = 560) {
  const platforms = scene?.mission?.platforms || [];
  const candidates = platforms
    .map(([px, py, width]) => ({ x: px, y: py, width }))
    .filter(p => x >= p.x + 20 && x <= p.x + p.width - 20)
    .sort((a, b) => a.y - b.y);
  return candidates[0]?.y ?? fallback;
}

function createZone(scene, x, y, width, direction, strength) {
  const zone = scene.add.zone(x, y, width, 70).setOrigin(.5).setDepth(2);
  const visual = scene.add.container(x, y).setDepth(3);
  const band = scene.add.rectangle(0, 0, width, 70, 0x8df4ff, .045).setStrokeStyle(1, 0x8df4ff, .28);
  const core = scene.add.rectangle(direction * 7, 0, width - 18, 3, 0x8df4ff, .52);
  visual.add([band, core]);
  if (!scene.motionReduced) {
    scene.tweens.add({ targets: core, x: direction * 18, alpha: { from: .25, to: .9 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    scene.tweens.add({ targets: visual, alpha: { from: .55, to: 1 }, duration: 900, yoyo: true, repeat: -1 });
  }
  zone.setData('direction', direction);
  zone.setData('strength', strength);
  zone.setData('visual', visual);
  return zone;
}

function applyForce(scene, zone, delta) {
  const player = scene.player;
  if (!player?.active || !zone?.active || scene.finished || scene.respawning) return;
  const body = player.body;
  if (!body) return;
  const width = Number(zone.input?.hitArea?.width ?? zone.width ?? 0) || 0;
  const inside = Math.abs(player.x - zone.x) <= width * 0.5 && Math.abs(player.y - zone.y) <= 52;
  if (!inside) return;

  const direction = Number(zone.getData('direction')) || 1;
  const strength = Number(zone.getData('strength')) || 160;
  const target = direction * strength;
  const response = Math.min(1, delta * 0.0045);

  body.velocity.x = Phaser.Math.Linear(body.velocity.x, body.velocity.x + target, response);
  body.velocity.x = clamp(body.velocity.x, -scene.sys.game.config.width * 2, scene.sys.game.config.width * 2);

  const state = sceneState.get(scene);
  if (state && scene.elapsedMs - state.lastCueAt > 1800) {
    state.lastCueAt = scene.elapsedMs;
    scene.playerCue?.(direction < 0 ? 'CROSSWIND · HOLD LINE' : 'CROSSWIND · RIDE CURRENT', '#b9f5ff');
    scene.game?.events?.emit('feedback', 'warning');
  }
}

function update(scene, delta) {
  const state = sceneState.get(scene);
  if (!state) return;
  state.zones.forEach(zone => applyForce(scene, zone, delta));
}

function teardown(scene) {
  const state = sceneState.get(scene);
  if (!state) return;
  state.zones.forEach(zone => {
    zone.getData('visual')?.destroy?.();
    zone.destroy?.();
  });
  sceneState.delete(scene);
}

function setup(scene) {
  if (!scene?.player || sceneState.has(scene)) return;
  const start = Number(scene.mission?.spawn?.x ?? scene.player.x ?? 0);
  const goal = Number(scene.mission?.goal?.x ?? start + 3200);
  if (!(goal - start > 1400)) return;

  const fractions = [0.31, 0.68];
  const strengths = [125, 175];
  const directions = [1, -1];
  const zones = [];

  fractions.forEach((fraction, index) => {
    const x = routeX(scene, fraction);
    const y = groundY(scene, x) - 28;
    zones.push(createZone(scene, x, y, 150, directions[index], strengths[index]));
  });

  sceneState.set(scene, { zones, lastCueAt: -Infinity });
}

if (!RunnerScene.prototype.__environmentalForceCreatePatched) {
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function environmentalForceCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { setup(this); } catch (error) { console.error('[EnvironmentalForce] create failed', error); }
    return result;
  };

  RunnerScene.prototype.update = function environmentalForceUpdate(...args) {
    const delta = Number(args[1] ?? this.game?.loop?.delta ?? 16.67);
    const result = originalUpdate.apply(this, args);
    try { update(this, delta); } catch (error) { console.error('[EnvironmentalForce] update failed', error); }
    return result;
  };

  RunnerScene.prototype.shutdown = function environmentalForceShutdown(...args) {
    try { teardown(this); } catch (error) { console.error('[EnvironmentalForce] teardown failed', error); }
    return originalShutdown.apply(this, args);
  };

  RunnerScene.prototype.__environmentalForceCreatePatched = true;
}
