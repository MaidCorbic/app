import { RunnerScene } from './src/scenes/RunnerScene.js';

// WORLD GAMEPLAY EXPANSION V1
// New mechanics only. Reuses existing energy, boosterTimer, fail/checkpoint,
// playerCue and world objects. No new HUD, score owner, mission owner,
// progression owner, or movement system.

const stateByScene = new WeakMap();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

function routeX(scene, fraction) {
  const start = Number(scene?.mission?.spawn?.x || scene?.player?.x || 0);
  const goal = Number(scene?.mission?.goal?.x || start + 3200);
  return start + (goal - start) * fraction;
}

function groundY(scene, x, fallback = 560) {
  const platforms = scene?.mission?.platforms || [];
  const candidates = platforms
    .map(([px, py, width, height]) => ({ x: px, y: py, width, height }))
    .filter(platform => x >= platform.x + 18 && x <= platform.x + platform.width - 18)
    .sort((a, b) => a.y - b.y);
  return candidates[0]?.y ?? fallback;
}

function drawCharge(scene, x, y) {
  const container = scene.add.container(x, y).setDepth(11);
  const ring = scene.add.circle(0, 0, 16, 0x8df4ff, .08).setStrokeStyle(2, 0xb9f5ff, .7);
  const core = scene.add.circle(0, 0, 7, 0x8df4ff, .95);
  const spark = scene.add.circle(0, 0, 3, 0xe8fdff, 1);
  container.add([ring, core, spark]);
  if (!scene.motionReduced) {
    scene.tweens?.add({ targets: ring, scale: { from: .8, to: 1.45 }, alpha: { from: .45, to: 0 }, duration: 760, yoyo: true, repeat: -1 });
    scene.tweens?.add({ targets: core, y: -7, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
  return container;
}

function drawHazard(scene, x, y, width = 110) {
  const container = scene.add.container(x, y).setDepth(5);
  const glow = scene.add.rectangle(0, 0, width, 34, 0xff826e, .08).setStrokeStyle(1, 0xff826e, .55);
  const line = scene.add.rectangle(0, 0, width - 14, 3, 0xff826e, .65);
  container.add([glow, line]);
  if (!scene.motionReduced) scene.tweens?.add({ targets: line, alpha: { from: .2, to: 1 }, duration: 420, yoyo: true, repeat: -1 });
  return container;
}

function drawBreaker(scene, x, y) {
  const body = scene.add.rectangle(x, y, 42, 54, 0x132139, 1).setStrokeStyle(2, 0xffd06e, .85).setDepth(9);
  scene.add.line(x, y, -11, -18, 12, 18, 0xff826e, .65).setLineWidth(2).setDepth(10);
  scene.add.line(x, y, 12, -18, -11, 18, 0x8df4ff, .5).setLineWidth(2).setDepth(10);
  return body;
}

function drawAccessNode(scene, x, y) {
  const node = scene.add.container(x, y).setDepth(10);
  const shell = scene.add.rectangle(0, 0, 34, 44, 0x101d31, 1).setStrokeStyle(2, 0x8df4ff, .85);
  const core = scene.add.circle(0, 0, 6, 0xffd06e, 1).setStrokeStyle(1, 0xfff0b0, .9);
  node.add([shell, core]);
  if (!scene.motionReduced) scene.tweens?.add({ targets: core, scale: { from: .9, to: 1.2 }, alpha: { from: .45, to: 1 }, duration: 620, yoyo: true, repeat: -1 });
  return node;
}

function drawMovingPickup(scene, x, y) {
  const node = scene.add.circle(x, y, 10, 0xffd06e, .95).setStrokeStyle(2, 0xfff0b5, .8).setDepth(11);
  const trail = scene.add.circle(x, y, 18, 0xffd06e, .07).setStrokeStyle(1, 0xffd06e, .35).setDepth(10);
  return { node, trail };
}

function collectCharge(scene, charge, kind) {
  if (!charge?.active || charge.getData('collected')) return;
  charge.setData('collected', true);
  charge.disableBody?.(true, true);
  const energyGain = kind === 'moving' ? 18 : 28;
  scene.energy = Math.min(Number(scene.energyMax || 100), Number(scene.energy || 0) + energyGain);
  scene.boosterTimer = Math.max(Number(scene.boosterTimer) || 0, kind === 'moving' ? 1800 : 3600);
  scene.game?.events?.emit('feedback', 'gadget');
  scene.playerCue?.(kind === 'moving' ? 'MOBILE CHARGE · SIGNAL BOOST' : 'EMERGENCY CHARGE · +ENERGY', '#8df4ff');
  const burst = scene.add.circle(charge.x, charge.y, 10, 0x8df4ff, .35).setDepth(12);
  scene.tweens?.add({ targets: burst, scale: 3.2, alpha: 0, duration: 260, onComplete: () => burst.destroy() });
}

function activateHazard(scene, state, now) {
  if (state.hazardCooldownUntil > now || scene.respawning || scene.finished) return;
  state.hazardCooldownUntil = now + 1800;
  scene.game?.events?.emit('feedback', 'warning');
  scene.playerCue?.('LIVE CURRENT · MOVE THROUGH', '#ffcf82');
  if (typeof scene.fail === 'function') scene.fail('A live route hazard hit the courier.');
}

function breakRouteObject(scene, breaker, state) {
  if (!breaker?.active || breaker.getData('broken')) return;
  const dashActive = Number(scene.dashTimer || 0) > 0;
  const speed = Math.abs(Number(scene.player?.body?.velocity?.x || 0));
  if (!dashActive && speed < 250) return;
  breaker.setData('broken', true);
  breaker.disableBody?.(true, true);
  state.breakersBroken.add(breaker.getData('id'));
  scene.playerCue?.('ROUTE OPEN', '#aee37f');
  scene.game?.events?.emit('feedback', dashActive ? 'dash' : 'vault');
  const burst = scene.add.circle(breaker.x, breaker.y, 12, 0xffd06e, .25).setDepth(12);
  scene.tweens?.add({ targets: burst, scale: 3.5, alpha: 0, duration: 300, onComplete: () => burst.destroy() });
}

function activateAccess(scene, node) {
  if (!node?.active || node.getData('used')) return;
  if (distance(scene.player, node) > 72) return;
  node.setData('used', true);
  const barrier = (scene.barriers?.getChildren?.() || [])
    .filter(item => item?.active)
    .map(item => ({ item, distance: distance(node, item) }))
    .filter(entry => entry.distance < 230)
    .sort((a, b) => a.distance - b.distance)[0]?.item;
  if (barrier) {
    barrier.disableBody?.(true, true);
    scene.playerCue?.('HIDDEN ACCESS · ROUTE OPEN', '#8df4ff');
  } else {
    scene.playerCue?.('HIDDEN ACCESS NODE · LINKED', '#8df4ff');
  }
  scene.game?.events?.emit('feedback', 'signal');
  scene.tweens?.add({ targets: node, scale: 1.35, alpha: 0, duration: 360, onComplete: () => node.destroy() });
}

function updateMovingPickup(scene, state, now) {
  const moving = state.movingPickup;
  if (!moving?.node?.active) return;
  const offset = Math.sin(now * .0012) * moving.range;
  moving.node.x = moving.originX + offset;
  moving.node.y = moving.originY + Math.sin(now * .0021) * 8;
  moving.trail.x = moving.node.x;
  moving.trail.y = moving.node.y;
  if (distance(scene.player, moving.node) < 32) {
    collectCharge(scene, moving.node, 'moving');
    moving.trail.destroy();
  }
}

function update(scene) {
  const state = stateByScene.get(scene);
  if (!state || !scene.player?.active || scene.finished) return;
  const now = scene.time?.now ?? performance.now();

  state.hazards?.forEach(hazard => {
    if (hazard?.active && hazard.getBounds?.()?.contains?.(scene.player.x, scene.player.y)) activateHazard(scene, state, now);
  });

  state.breakers?.forEach(breaker => {
    if (breaker?.active && distance(scene.player, breaker) < 62) breakRouteObject(scene, breaker, state);
  });

  state.accessNodes?.forEach(node => activateAccess(scene, node));
  updateMovingPickup(scene, state, now);
}

function makeFeatureState(scene) {
  const state = {
    charges: [],
    hazards: [],
    breakers: [],
    accessNodes: [],
    movingPickup: null,
    hazardCooldownUntil: 0,
    breakersBroken: new Set(),
  };

  const start = Number(scene?.mission?.spawn?.x || scene.player.x || 0);
  const goal = Number(scene?.mission?.goal?.x || start + 3200);
  const span = goal - start;
  if (!(span > 1200)) return state;

  // 1) Emergency Charge — stationary, uses existing energy/booster runtime.
  const chargeX = routeX(scene, .22);
  const chargeY = groundY(scene, chargeX) - 30;
  const charge = scene.add.image(chargeX, chargeY, 'signal').setScale(.42).setTint(0x8df4ff).setData('feature', 'emergency-charge').setData('collected', false).setDepth(10);
  scene.physics.add.existing(charge, true);
  state.charges.push(charge);
  scene.physics.add.overlap(scene.player, charge, () => collectCharge(scene, charge, 'emergency'), undefined, scene);
  drawCharge(scene, chargeX, chargeY);

  // 2) Reactive Hazard Zone — uses the existing fail/checkpoint path.
  const hazardX = routeX(scene, .38);
  const hazardY = groundY(scene, hazardX) - 18;
  const hazard = scene.add.rectangle(hazardX, hazardY, 118, 36, 0xff826e, .06).setDepth(4);
  scene.physics.add.existing(hazard, true);
  state.hazards.push(hazard);
  drawHazard(scene, hazardX, hazardY);
  scene.physics.add.overlap(scene.player, hazard, () => activateHazard(scene, state, scene.time?.now ?? performance.now()), undefined, scene);

  // 3) Breakable Route Object — only breaks under a high-speed/dash approach.
  const breakerX = routeX(scene, .50);
  const breakerY = groundY(scene, breakerX) - 27;
  const breaker = drawBreaker(scene, breakerX, breakerY);
  scene.physics.add.existing(breaker, true);
  breaker.setData('id', 'breaker-01');
  state.breakers.push(breaker);
  scene.physics.add.overlap(scene.player, breaker, () => breakRouteObject(scene, breaker, state), undefined, scene);

  // 4) Hidden Access Node — proximity reveals a nearby existing route opening.
  const nodeX = routeX(scene, .64);
  const nodeY = groundY(scene, nodeX) - 34;
  const node = drawAccessNode(scene, nodeX, nodeY);
  node.setData('used', false);
  state.accessNodes.push(node);

  // 5) Moving Target Pickup — moving challenge, reuses existing boost + energy state.
  const movingX = routeX(scene, .80);
  const movingY = groundY(scene, movingX) - 48;
  const moving = drawMovingPickup(scene, movingX, movingY);
  state.movingPickup = { node: moving.node, trail: moving.trail, originX: movingX, originY: movingY, range: clamp(span * .045, 70, 150) };
  scene.physics.add.existing(moving.node);
  moving.node.body.setAllowGravity(false);
  scene.physics.add.overlap(scene.player, moving.node, () => collectCharge(scene, moving.node, 'moving'), undefined, scene);
}

function teardown(scene) {
  const state = stateByScene.get(scene);
  if (!state) return;
  state.charges.forEach(item => item?.destroy?.());
  state.hazards.forEach(item => item?.destroy?.());
  state.breakers.forEach(item => item?.destroy?.());
  state.accessNodes.forEach(item => item?.destroy?.());
  state.movingPickup?.node?.destroy?.();
  state.movingPickup?.trail?.destroy?.();
  stateByScene.delete(scene);
}

const originalCreate = RunnerScene.prototype.create;
const originalUpdate = RunnerScene.prototype.update;
const originalShutdown = RunnerScene.prototype.shutdown;

if (!RunnerScene.prototype.__worldGameplayExpansionCreatePatched) {
  RunnerScene.prototype.create = function worldGameplayExpansionCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { stateByScene.set(this, makeFeatureState(this)); } catch (error) { console.error('[WorldGameplayExpansion] create failed', error); }
    return result;
  };
  RunnerScene.prototype.__worldGameplayExpansionCreatePatched = true;
}

if (!RunnerScene.prototype.__worldGameplayExpansionUpdatePatched) {
  RunnerScene.prototype.update = function worldGameplayExpansionUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    try { update(this); } catch (error) { console.error('[WorldGameplayExpansion] update failed', error); }
    return result;
  };
  RunnerScene.prototype.__worldGameplayExpansionUpdatePatched = true;
}

if (!RunnerScene.prototype.__worldGameplayExpansionShutdownPatched) {
  RunnerScene.prototype.shutdown = function worldGameplayExpansionShutdown(...args) {
    try { teardown(this); } catch (error) { console.error('[WorldGameplayExpansion] teardown failed', error); }
    return originalShutdown.apply(this, args);
  };
  RunnerScene.prototype.__worldGameplayExpansionShutdownPatched = true;
}
