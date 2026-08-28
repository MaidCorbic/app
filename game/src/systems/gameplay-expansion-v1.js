import Phaser from 'phaser';

// Gameplay Expansion V1
// Additive only: attaches a self-contained set of traversal/world mechanics to RunnerScene.
// Core mission, combat, movement and persistence logic remain authoritative elsewhere.

const NS = '__relayGameplayExpansionV1';
const FEATURE_LAYOUT = {
  'first-delivery': ['companion', 'throwable'],
  'dead-drop': ['crane', 'throwable', 'handoff'],
  blackout: ['lightTraversal', 'companion', 'movingRelay'],
  pursuit: ['train', 'traffic', 'courierHandoff'],
  'signal-storm': ['movingRelay', 'lightTraversal', 'companion'],
  'corporate-lockdown': ['train', 'traffic', 'elevator', 'handoff'],
  'final-relay': ['train', 'crane', 'courierHandoff', 'movingRelay', 'traffic'],
};
const DEFAULT_FEATURES = Object.fromEntries([
  'train', 'crane', 'traffic', 'companion', 'throwable', 'lightTraversal', 'movingRelay', 'handoff', 'elevator', 'courierHandoff'
].map(key => [key, false]));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;

function routeWidth(scene) { return Math.max(1200, Number(scene.worldWidth || scene.mission?.goal?.x || 4200)); }

function makeRectTexture(scene, key, width, height, fill, line = 0xdffcff) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(fill, 1).fillRoundedRect(0, 0, width, height, Math.min(10, width * .12));
  g.lineStyle(2, line, .75).strokeRoundedRect(1, 1, width - 2, height - 2, Math.min(9, width * .11));
  g.generateTexture(key, width, height); g.destroy();
}

function safeCue(scene, text, color = '#8df4ff') { try { scene.playerCue?.(text, color); } catch {} }

function addWorldText(scene, text, x, y, color = '#dffcff') {
  return scene.add.text(x, y, text, { fontFamily: 'DM Mono', fontSize: '8px', color, stroke: '#08101c', strokeThickness: 4, letterSpacing: 1 }).setOrigin(.5).setDepth(14).setAlpha(.84);
}

function pickRouteX(scene, fraction, offset = 0) {
  const start = Number(scene.mission?.spawn?.x || 160);
  const goal = Number(scene.mission?.goal?.x || start + 3600);
  return clamp(lerp(start + 360, goal - 260, fraction) + offset, start + 180, goal - 120);
}

function nearestPlatformY(scene, x, fallback = 540) {
  const platforms = Array.isArray(scene.mission?.platforms) ? scene.mission.platforms : [];
  let best = null;
  for (const data of platforms) {
    const [px, py, width] = data;
    if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(width)) continue;
    const score = Math.abs(px + width / 2 - x);
    if (!best || score < best.score) best = { y: py, score };
  }
  return best?.y ?? fallback;
}

function destroySafely(value) { try { value?.destroy?.(); } catch {} }

function installTextures(scene) {
  makeRectTexture(scene, 'gx-train', 210, 46, 0x17263b, 0x8df4ff);
  makeRectTexture(scene, 'gx-crane', 44, 18, 0x2a3b54, 0xffd06e);
  makeRectTexture(scene, 'gx-traffic', 78, 32, 0x241d2a, 0xff826e);
  makeRectTexture(scene, 'gx-drone', 42, 28, 0x203d5a, 0x8df4ff);
  makeRectTexture(scene, 'gx-crate', 32, 30, 0x3f3440, 0xffd06e);
  makeRectTexture(scene, 'gx-relay', 30, 48, 0x1b3a4d, 0xb9f5ff);
  makeRectTexture(scene, 'gx-elevator', 118, 18, 0x263953, 0xaee37f);
  makeRectTexture(scene, 'gx-courier', 36, 52, 0x22304c, 0xe0a7ff);
}

function baseState(scene) {
  if (scene[NS]) return scene[NS];
  const selected = FEATURE_LAYOUT[scene.mission?.id] || ['companion'];
  const features = { ...DEFAULT_FEATURES };
  selected.forEach(key => { features[key] = true; });
  const state = { features, entities: {}, timers: new Set(), destroyed: false, shadowPenaltyAt: 0, handoffDone: false, courierHandoffDone: false, throwHeld: null };
  scene[NS] = state;
  return state;
}

function addTimer(scene, fn, delay) {
  const state = scene[NS]; if (!state) return;
  const id = scene.time.delayedCall(delay, () => { state.timers.delete(id); if (!state.destroyed) fn(); });
  state.timers.add(id);
}

function installTrain(scene) {
  const state = baseState(scene); if (!state.features.train || state.entities.train) return;
  const x = pickRouteX(scene, .22), y = nearestPlatformY(scene, x, 540) - 32;
  const train = scene.physics.add.sprite(x, y, 'gx-train').setDepth(9).setImmovable(true); train.body.allowGravity = false; train.body.setVelocityX(115); train.setData('gxLastX', train.x);
  const label = addWorldText(scene, 'MOVING LINE · BOARD / VAULT', x, y - 34, '#8df4ff'); state.entities.train = { train, label };
  scene.physics.add.overlap(scene.player, train, () => { if (train.active && !scene.respawning && !scene.finished) safeCue(scene, 'MOVING LINE', '#8df4ff'); });
}

function updateTrain(scene, dt) {
  const entry = scene[NS]?.entities.train; if (!entry?.train?.active) return;
  const train = entry.train, previousX = Number(train.getData('gxLastX') || train.x);
  const maxX = Number(scene.mission?.goal?.x || train.x + 1000) - 90, minX = Number(scene.mission?.spawn?.x || 100) + 220;
  if (train.x >= maxX) train.body.setVelocityX(-115); if (train.x <= minX) train.body.setVelocityX(115);
  const dx = train.x - previousX; train.setData('gxLastX', train.x); entry.label?.setPosition(train.x, train.y - 34);
  if (scene.player?.active && Phaser.Geom.Intersects.RectangleToRectangle(scene.player.getBounds(), train.getBounds()) && Math.abs(dx) > .1 && dt < 45) scene.player.x = clamp(scene.player.x + dx, 20, routeWidth(scene) - 20);
}

function installCrane(scene) {
  const state = baseState(scene); if (!state.features.crane || state.entities.crane) return;
  const x = pickRouteX(scene, .34), top = nearestPlatformY(scene, x, 520) - 170, bottom = top + 115;
  const body = scene.physics.add.sprite(x, top, 'gx-crane').setDepth(8).setImmovable(true); body.body.allowGravity = false; body.setData('gxTop', top); body.setData('gxBottom', bottom);
  const cable = scene.add.graphics().setDepth(7), label = addWorldText(scene, 'CONSTRUCTION LIFT', x, top - 24, '#ffd06e'); state.entities.crane = { body, cable, label };
}

function updateCrane(scene, time) {
  const entry = scene[NS]?.entities.crane; if (!entry?.body?.active) return;
  const p = entry.body, top = p.getData('gxTop'), bottom = p.getData('gxBottom'); p.y = lerp(top, bottom, (Math.sin(time / 1150) + 1) / 2);
  entry.label?.setPosition(p.x, p.y - 24); entry.cable?.clear().lineStyle(2, 0x8fa7ba, .65).lineBetween(p.x, 335, p.x, p.y);
}

function installTraffic(scene) {
  const state = baseState(scene); if (!state.features.traffic || state.entities.traffic) return;
  const traffic = [];
  for (let i = 0; i < 3; i++) {
    const x = pickRouteX(scene, .46 + i * .13, i * 34), y = nearestPlatformY(scene, x, 555) - 24;
    const vehicle = scene.physics.add.sprite(x, y, 'gx-traffic').setDepth(8).setImmovable(true); vehicle.body.allowGravity = false; vehicle.body.setVelocityX(i % 2 ? -145 : 145);
    const label = addWorldText(scene, i % 2 ? 'CROSS TRAFFIC' : 'LIVE ROAD', x, y - 24, '#ff9c91'); traffic.push({ vehicle, label, min: x - 260, max: x + 520 });
    scene.physics.add.overlap(scene.player, vehicle, () => { if (scene.healthInvulnerable > 0 || scene.respawning || scene.finished) return; scene.takeSciFiHit?.('Cross traffic clipped the courier.'); safeCue(scene, 'TRAFFIC IMPACT', '#ff9c91'); });
  }
  state.entities.traffic = traffic;
}

function updateTraffic(scene) {
  const traffic = scene[NS]?.entities.traffic; if (!Array.isArray(traffic)) return;
  for (const item of traffic) { const v = item.vehicle; if (!v?.active) continue; if (v.x >= item.max) v.body.setVelocityX(-145); if (v.x <= item.min) v.body.setVelocityX(145); item.label?.setPosition(v.x, v.y - 24); }
}

function installCompanion(scene) {
  const state = baseState(scene); if (!state.features.companion || state.entities.companion) return;
  const drone = scene.physics.add.sprite(scene.player.x - 62, scene.player.y - 72, 'gx-drone').setDepth(15); drone.body.allowGravity = false; drone.setData('phase', Math.random() * Math.PI * 2);
  const label = addWorldText(scene, 'RELAY SCOUT', drone.x, drone.y - 22, '#b9f5ff'); state.entities.companion = { drone, label, pulse: 0 };
}

function updateCompanion(scene, time) {
  const entry = scene[NS]?.entities.companion; if (!entry?.drone?.active || !scene.player?.active) return;
  const drone = entry.drone, phase = Number(drone.getData('phase') || 0), targetX = scene.player.x - (scene.player.flipX ? -58 : 58), targetY = scene.player.y - 72 + Math.sin(time / 340 + phase) * 8;
  drone.x = lerp(drone.x, targetX, .08); drone.y = lerp(drone.y, targetY, .08); entry.label?.setPosition(drone.x, drone.y - 22);
}

function installThrowables(scene) {
  const state = baseState(scene); if (!state.features.throwable || state.entities.throwables) return;
  const crates = [];
  for (let i = 0; i < 4; i++) {
    const x = pickRouteX(scene, .18 + i * .17, i * 26), y = nearestPlatformY(scene, x, 540) - 15;
    const crate = scene.physics.add.sprite(x, y, 'gx-crate').setDepth(10); crate.body.setAllowGravity(true).setBounce(.05).setDrag(260, 0);
    const label = addWorldText(scene, 'LIFTABLE', x, y - 24, '#ffd06e'); crates.push({ crate, label });
    scene.physics.add.overlap(scene.player, crate, () => { if (!crate.active || state.throwHeld) return; if (Phaser.Math.Distance.Between(scene.player.x, scene.player.y, crate.x, crate.y) > 62) return; state.throwHeld = crate; crate.body.enable = false; crate.setAlpha(.86); safeCue(scene, 'OBJECT READY · G TO THROW', '#ffd06e'); });
  }
  state.entities.throwables = crates;
  const release = event => {
    if (String(event.key || '').toLowerCase() !== 'g' || !state.throwHeld || state.destroyed) return;
    const crate = state.throwHeld; state.throwHeld = null; crate.body.enable = true; crate.setAlpha(1);
    const direction = scene.player?.flipX ? -1 : 1; crate.x = scene.player.x + direction * 34; crate.y = scene.player.y - 4; crate.body.setVelocity(direction * 520, -250); safeCue(scene, 'THROW', '#ffd06e');
  };
  scene.input.keyboard?.on('keydown', release); state.entities.throwableKeyHandler = release;
}

function updateThrowables(scene) {
  const state = scene[NS], crates = state?.entities.throwables; if (!Array.isArray(crates)) return;
  for (const item of crates) item.label?.setPosition(item.crate.x, item.crate.y - 24);
  const held = state.throwHeld; if (held?.active && scene.player?.active) { held.x = scene.player.x + (scene.player.flipX ? -1 : 1) * 26; held.y = scene.player.y - 42; }
}

function installLightTraversal(scene) {
  const state = baseState(scene); if (!state.features.lightTraversal || state.entities.light) return;
  const zones = [];
  for (let i = 0; i < 2; i++) {
    const x = pickRouteX(scene, .29 + i * .32), y = nearestPlatformY(scene, x, 520) - 120, width = 220, required = i % 2 ? 'dark' : 'light';
    const zone = { x1: x - width / 2, x2: x + width / 2, y1: y - 110, y2: y + 20, required };
    const g = scene.add.graphics().setDepth(2); g.fillStyle(required === 'light' ? 0xffe0a8 : 0x050a12, required === 'light' ? .08 : .2).fillRect(zone.x1, zone.y1, width, 130); g.lineStyle(1, required === 'light' ? 0xffe0a8 : 0x8df4ff, .25).strokeRect(zone.x1, zone.y1, width, 130);
    zone.graphics = g; zone.label = addWorldText(scene, required === 'light' ? 'LIGHT ROUTE' : 'SHADOW ROUTE', x, y - 8, required === 'light' ? '#ffdca0' : '#8df4ff').setDepth(3); zones.push(zone);
  }
  const veil = scene.add.rectangle(0, 0, routeWidth(scene), 720, 0x02060d, 0).setOrigin(0).setDepth(30).setScrollFactor(0); state.entities.light = { zones, veil };
}

function updateLightTraversal(scene, time) {
  const entry = scene[NS]?.entities.light; if (!entry?.zones || !scene.player?.active) return;
  let activeZone = null;
  for (const zone of entry.zones) { zone.label?.setPosition((zone.x1 + zone.x2) / 2, zone.y1 - 8); if (scene.player.x >= zone.x1 && scene.player.x <= zone.x2 && scene.player.y >= zone.y1 && scene.player.y <= zone.y2) { activeZone = zone; break; } }
  if (!activeZone) { scene.player.setData('shadowState', null); entry.veil?.setAlpha(0); return; }
  const current = Math.sin(scene.player.x / 38 + time / 500) > 0 ? 'light' : 'dark'; scene.player.setData('shadowState', current); const valid = current === activeZone.required; entry.veil?.setAlpha(valid ? 0 : .08);
  if (!valid && time - (scene[NS].shadowPenaltyAt || 0) > 1800 && scene.healthInvulnerable <= 0) { scene[NS].shadowPenaltyAt = time; scene.takeSciFiHit?.(activeZone.required === 'light' ? 'The courier crossed a dark surveillance lane.' : 'The courier broke cover in the lit lane.'); safeCue(scene, activeZone.required === 'light' ? 'STAY IN LIGHT' : 'STAY IN SHADOW', '#ffcf82'); }
}

function installMovingRelay(scene) {
  const state = baseState(scene); if (!state.features.movingRelay || state.entities.movingRelay) return;
  const x = pickRouteX(scene, .56), relay = scene.physics.add.sprite(x, nearestPlatformY(scene, x, 520) - 58, 'gx-relay').setDepth(12).setImmovable(true); relay.body.allowGravity = false;
  const label = addWorldText(scene, 'MOVING RELAY · INTERCEPT', relay.x, relay.y - 34, '#b9f5ff'); state.entities.movingRelay = { relay, label, collected: false, phase: Math.random() * Math.PI * 2 };
  scene.physics.add.overlap(scene.player, relay, () => { if (!relay.active || state.entities.movingRelay.collected) return; state.entities.movingRelay.collected = true; relay.disableBody(true, true); safeCue(scene, 'MOVING RELAY SECURED', '#b9f5ff'); scene.game.events.emit('signal', { source: 'moving-relay' }); });
}

function updateMovingRelay(scene, time) {
  const entry = scene[NS]?.entities.movingRelay; if (!entry?.relay?.active) return;
  const start = pickRouteX(scene, .55), end = pickRouteX(scene, .76), phase = (Math.sin(time / 1200 + entry.phase) + 1) / 2;
  entry.relay.x = lerp(start, end, phase); entry.relay.y = nearestPlatformY(scene, entry.relay.x, 520) - 62 + Math.sin(time / 300) * 7; entry.label?.setPosition(entry.relay.x, entry.relay.y - 34);
}

function installDeliveryHandoff(scene) {
  const state = baseState(scene); if (!state.features.handoff || state.entities.handoff) return;
  const x = pickRouteX(scene, .79), y = nearestPlatformY(scene, x, 530) - 30;
  const npc = scene.physics.add.sprite(x, y, 'gx-courier').setDepth(11).setImmovable(true); npc.body.allowGravity = false;
  const marker = scene.add.circle(x, y - 12, 34, 0xe0a7ff, .08).setStrokeStyle(2, 0xe0a7ff, .55).setDepth(10); const label = addWorldText(scene, 'HANDOFF POINT', x, y - 44, '#e0a7ff');
  state.entities.handoff = { npc, marker, label };
  scene.physics.add.overlap(scene.player, npc, () => { if (state.handoffDone || scene.respawning || scene.finished) return; state.handoffDone = true; marker.setFillStyle(0x8df4ff, .15); marker.setStrokeStyle(2, 0x8df4ff, .75); label.setText('HANDOFF COMPLETE'); safeCue(scene, 'PACKAGE HANDOFF COMPLETE', '#8df4ff'); scene.game.events.emit('package-handoff', { missionId: scene.mission?.id }); });
}

function installElevator(scene) {
  const state = baseState(scene); if (!state.features.elevator || state.entities.elevator) return;
  const x = pickRouteX(scene, .67), y = nearestPlatformY(scene, x, 520) - 96; const platform = scene.physics.add.sprite(x, y, 'gx-elevator').setDepth(8).setImmovable(true); platform.body.allowGravity = false;
  const label = addWorldText(scene, 'VERTICAL LIFT', x, y - 22, '#aee37f'); state.entities.elevator = { platform, top: y - 130, bottom: y + 58, label, lastY: y };
}

function updateElevator(scene, time) {
  const entry = scene[NS]?.entities.elevator; if (!entry?.platform?.active) return;
  const p = entry.platform, previousY = Number(entry.lastY || p.y); p.y = lerp(entry.top, entry.bottom, (Math.sin(time / 1500) + 1) / 2); entry.lastY = p.y; entry.label?.setPosition(p.x, p.y - 22);
  const dy = p.y - previousY; if (scene.player?.active && Math.abs(dy) > .05 && Phaser.Geom.Intersects.RectangleToRectangle(scene.player.getBounds(), p.getBounds())) scene.player.y += dy;
}

function installCourierHandoff(scene) {
  const state = baseState(scene); if (!state.features.courierHandoff || state.entities.courierHandoff) return;
  const x = pickRouteX(scene, .63, 55), y = nearestPlatformY(scene, x, 525) - 30; const courier = scene.physics.add.sprite(x, y, 'gx-courier').setDepth(10).setImmovable(true); courier.body.allowGravity = false;
  const label = addWorldText(scene, 'COURIER SYNC', x, y - 44, '#e0a7ff'); state.entities.courierHandoff = { courier, label, nextPulse: 0 };
  scene.physics.add.overlap(scene.player, courier, () => { if (state.courierHandoffDone) return; state.courierHandoffDone = true; label.setText('SYNCED · FOLLOW THE RUNNER'); safeCue(scene, 'COURIER SYNC COMPLETE', '#e0a7ff'); scene.game.events.emit('courier-handoff', { missionId: scene.mission?.id }); addTimer(scene, () => { if (courier.active) courier.body.setVelocityX(220); }, 250); });
}

function updateCourierHandoff(scene, time) {
  const entry = scene[NS]?.entities.courierHandoff; if (!entry?.courier?.active) return; const courier = entry.courier;
  if (scene[NS].courierHandoffDone) { courier.x += 1.6; entry.label?.setPosition(courier.x, courier.y - 44); if (time > entry.nextPulse) { entry.nextPulse = time + 2200; const pulse = scene.add.circle(courier.x, courier.y, 10, 0xe0a7ff, .25).setDepth(12); scene.tweens.add({ targets: pulse, scale: 3.4, alpha: 0, duration: 520, onComplete: () => pulse.destroy() }); } return; }
  courier.x += Math.sin(time / 900) * .55; entry.label?.setPosition(courier.x, courier.y - 44);
}

function install(scene) {
  if (!scene || scene[NS]?.initialized) return;
  baseState(scene).initialized = true; installTextures(scene);
  installTrain(scene); installCrane(scene); installTraffic(scene); installCompanion(scene); installThrowables(scene); installLightTraversal(scene); installMovingRelay(scene); installDeliveryHandoff(scene); installElevator(scene); installCourierHandoff(scene);
}

function update(scene, time, delta) {
  const state = scene[NS]; if (!state || state.destroyed || !scene.player?.active || scene.respawning || scene.finished) return;
  updateTrain(scene, delta); updateCrane(scene, time); updateTraffic(scene); updateCompanion(scene, time); updateThrowables(scene); updateLightTraversal(scene, time); updateMovingRelay(scene, time); updateElevator(scene, time); updateCourierHandoff(scene, time);
}

function destroy(scene) {
  const state = scene[NS]; if (!state || state.destroyed) return; state.destroyed = true;
  for (const timer of state.timers) timer.remove?.(); state.timers.clear();
  if (state.entities.throwableKeyHandler) scene.input.keyboard?.off('keydown', state.entities.throwableKeyHandler);
  const destroyEntry = entry => { if (!entry) return; if (Array.isArray(entry)) return entry.forEach(destroyEntry); for (const value of Object.values(entry)) if (value && typeof value === 'object' && ('destroy' in value || 'remove' in value)) destroySafely(value); };
  destroyEntry(state.entities);
}

export function installGameplayExpansion(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__relayGameplayExpansionInstalled) return;
  RunnerScene.prototype.__relayGameplayExpansionInstalled = true;
  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function gameplayExpansionCreate(...args) { const result = originalCreate.apply(this, args); try { if (this.mission) install(this); } catch (error) { console.warn('[Relay] gameplay expansion isolated:', error); } return result; };
  const originalUpdate = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function gameplayExpansionUpdate(time, delta, ...args) { try { update(this, time, delta); } catch (error) { console.warn('[Relay] gameplay expansion update isolated:', error); } return originalUpdate.apply(this, [time, delta, ...args]); };
  const originalShutdown = RunnerScene.prototype.shutdown;
  RunnerScene.prototype.shutdown = function gameplayExpansionShutdown(...args) { try { destroy(this); } catch (error) { console.warn('[Relay] gameplay expansion cleanup isolated:', error); } return originalShutdown?.apply(this, args); };
}
