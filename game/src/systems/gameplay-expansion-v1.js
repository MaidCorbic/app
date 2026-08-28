import Phaser from 'phaser';

// Gameplay Expansion V1
// Additive world/traversal pack. Existing RunnerScene systems remain authoritative.
// Features are intentionally mission-scoped so the route does not become overloaded.

const NS = '__relayGameplayExpansionV1';
const FEATURE_LAYOUT = {
  'first-delivery': ['zipline', 'throwable'],
  'dead-drop': ['crane', 'throwable', 'handoff'],
  blackout: ['laserSweep', 'soundPressure', 'movingRelay'],
  pursuit: ['train', 'traffic', 'zipline'],
  'signal-storm': ['movingRelay', 'laserSweep', 'soundPressure'],
  'corporate-lockdown': ['train', 'traffic', 'elevator', 'handoff'],
  'final-relay': ['train', 'crane', 'elevator', 'movingRelay', 'soundPressure'],
};
const FEATURE_KEYS = ['train', 'crane', 'traffic', 'zipline', 'throwable', 'laserSweep', 'movingRelay', 'handoff', 'elevator', 'soundPressure'];
const DEFAULT_FEATURES = Object.fromEntries(FEATURE_KEYS.map(key => [key, false]));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;

function routeWidth(scene) { return Math.max(1200, Number(scene.worldWidth || scene.mission?.goal?.x || 4200)); }
function routeX(scene, fraction, offset = 0) {
  const start = Number(scene.mission?.spawn?.x || 160);
  const goal = Number(scene.mission?.goal?.x || start + 3600);
  return clamp(lerp(start + 340, goal - 250, fraction) + offset, start + 170, goal - 120);
}
function platformY(scene, x, fallback = 540) {
  const platforms = Array.isArray(scene.mission?.platforms) ? scene.mission.platforms : [];
  let best = null;
  for (const [px, py, width] of platforms) {
    if (![px, py, width].every(Number.isFinite)) continue;
    const score = Math.abs(px + width / 2 - x);
    if (!best || score < best.score) best = { y: py, score };
  }
  return best?.y ?? fallback;
}
function cue(scene, text, color = '#8df4ff') { try { scene.playerCue?.(text, color); } catch {} }
function text(scene, label, x, y, color = '#dffcff') {
  return scene.add.text(x, y, label, { fontFamily: 'DM Mono', fontSize: '8px', color, stroke: '#08101c', strokeThickness: 4, letterSpacing: 1 }).setOrigin(.5).setDepth(16).setAlpha(.84);
}
function timer(scene, fn, ms) {
  const state = scene[NS]; if (!state) return;
  const id = scene.time.delayedCall(ms, () => { state.timers.delete(id); if (!state.destroyed) fn(); });
  state.timers.add(id);
}
function texture(scene, key, width, height, fill, line = 0xdffcff) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(fill, 1).fillRoundedRect(0, 0, width, height, Math.min(12, width * .12));
  g.lineStyle(2, line, .8).strokeRoundedRect(1, 1, width - 2, height - 2, Math.min(11, width * .11));
  g.generateTexture(key, width, height); g.destroy();
}
function installTextures(scene) {
  texture(scene, 'gx-train', 210, 46, 0x17263b, 0x8df4ff);
  texture(scene, 'gx-crane', 44, 18, 0x2a3b54, 0xffd06e);
  texture(scene, 'gx-traffic', 78, 32, 0x241d2a, 0xff826e);
  texture(scene, 'gx-crate', 32, 30, 0x3f3440, 0xffd06e);
  texture(scene, 'gx-relay', 30, 48, 0x1b3a4d, 0xb9f5ff);
  texture(scene, 'gx-elevator', 118, 18, 0x263953, 0xaee37f);
  texture(scene, 'gx-zip-anchor', 18, 18, 0x213b50, 0xe0a7ff);
  texture(scene, 'gx-zip-car', 28, 20, 0x382844, 0xe0a7ff);
  texture(scene, 'gx-laser-node', 22, 22, 0x2e1f34, 0xff6a9c);
  texture(scene, 'gx-noise-beacon', 28, 42, 0x22304c, 0xffcf82);
}
function base(scene) {
  if (scene[NS]) return scene[NS];
  const state = { features: { ...DEFAULT_FEATURES }, entities: {}, timers: new Set(), destroyed: false, heldCrate: null, handoffDone: false, soundAlarmUntil: 0 };
  for (const key of (FEATURE_LAYOUT[scene.mission?.id] || [])) state.features[key] = true;
  scene[NS] = state;
  return state;
}

function installTrain(scene) {
  const s = base(scene); if (!s.features.train || s.entities.train) return;
  const x = routeX(scene, .24), y = platformY(scene, x) - 34;
  const train = scene.physics.add.sprite(x, y, 'gx-train').setDepth(10).setImmovable(true); train.body.allowGravity = false; train.body.setVelocityX(120); train.setData('lastX', x);
  const label = text(scene, 'MOVING LINE · BOARD / VAULT', x, y - 34, '#8df4ff'); s.entities.train = { train, label };
}
function updateTrain(scene) {
  const e = scene[NS]?.entities.train; if (!e?.train?.active) return;
  const train = e.train, previous = Number(train.getData('lastX') || train.x), min = Number(scene.mission?.spawn?.x || 100) + 220, max = Number(scene.mission?.goal?.x || train.x + 1000) - 90;
  if (train.x >= max) train.body.setVelocityX(-120); if (train.x <= min) train.body.setVelocityX(120);
  const dx = train.x - previous; train.setData('lastX', train.x); e.label?.setPosition(train.x, train.y - 34);
  if (scene.player?.active && Math.abs(dx) > .1 && Phaser.Geom.Intersects.RectangleToRectangle(scene.player.getBounds(), train.getBounds())) scene.player.x = clamp(scene.player.x + dx, 20, routeWidth(scene) - 20);
}
function installCrane(scene) {
  const s = base(scene); if (!s.features.crane || s.entities.crane) return;
  const x = routeX(scene, .34), top = platformY(scene, x) - 170, bottom = top + 115;
  const lift = scene.physics.add.sprite(x, top, 'gx-crane').setDepth(9).setImmovable(true); lift.body.allowGravity = false; lift.setData({ top, bottom });
  const cable = scene.add.graphics().setDepth(8), label = text(scene, 'CONSTRUCTION LIFT', x, top - 24, '#ffd06e'); s.entities.crane = { lift, cable, label };
}
function updateCrane(scene, time) {
  const e = scene[NS]?.entities.crane; if (!e?.lift?.active) return;
  const lift = e.lift, data = lift.data.values; lift.y = lerp(data.top, data.bottom, (Math.sin(time / 1150) + 1) / 2); e.cable?.clear().lineStyle(2, 0x8fa7ba, .65).lineBetween(lift.x, 330, lift.x, lift.y); e.label?.setPosition(lift.x, lift.y - 24);
}
function installTraffic(scene) {
  const s = base(scene); if (!s.features.traffic || s.entities.traffic) return;
  const traffic = [];
  for (let i = 0; i < 3; i++) {
    const x = routeX(scene, .43 + i * .12), y = platformY(scene, x) - 24;
    const vehicle = scene.physics.add.sprite(x, y, 'gx-traffic').setDepth(9).setImmovable(true); vehicle.body.allowGravity = false; vehicle.body.setVelocityX(i % 2 ? -150 : 150);
    const label = text(scene, 'LIVE TRAFFIC', x, y - 24, '#ff9c91'); traffic.push({ vehicle, label, min: x - 250, max: x + 520 });
    scene.physics.add.overlap(scene.player, vehicle, () => { if (scene.healthInvulnerable > 0 || scene.respawning || scene.finished) return; scene.takeSciFiHit?.('Cross traffic clipped the courier.'); cue(scene, 'TRAFFIC IMPACT', '#ff9c91'); });
  }
  s.entities.traffic = traffic;
}
function updateTraffic(scene) {
  for (const item of scene[NS]?.entities.traffic || []) { const v = item.vehicle; if (!v?.active) continue; if (v.x >= item.max) v.body.setVelocityX(-150); if (v.x <= item.min) v.body.setVelocityX(150); item.label?.setPosition(v.x, v.y - 24); }
}

// NEW #4 — Zipline Traversal. Distinct from grapple: player rides a fixed cable between two anchors.
function installZipline(scene) {
  const s = base(scene); if (!s.features.zipline || s.entities.zipline) return;
  const x1 = routeX(scene, .30), x2 = routeX(scene, .48), y = platformY(scene, x1) - 150;
  const line = scene.add.graphics().setDepth(7).lineStyle(3, 0xe0a7ff, .55).lineBetween(x1, y, x2, y + 55);
  const a = scene.add.image(x1, y, 'gx-zip-anchor').setDepth(10), b = scene.add.image(x2, y + 55, 'gx-zip-anchor').setDepth(10);
  const car = scene.physics.add.sprite(x1, y, 'gx-zip-car').setDepth(11); car.body.allowGravity = false; car.body.setImmovable(true);
  const label = text(scene, 'ZIPLINE · Z TO RIDE', (x1 + x2) / 2, y - 28, '#e0a7ff');
  s.entities.zipline = { line, a, b, car, label, x1, y1: y, x2, y2: y + 55, riding: false };
  const ride = () => {
    const e = scene[NS]?.entities.zipline; if (!e || e.riding || !scene.player?.active) return;
    if (Phaser.Math.Distance.Between(scene.player.x, scene.player.y, e.car.x, e.car.y) > 95) return;
    e.riding = true; cue(scene, 'ZIPLINE ENGAGED', '#e0a7ff'); scene.player.body.setAllowGravity(false); scene.player.setData('ziplineRide', true);
  };
  scene.input.keyboard?.on('keydown-Z', ride); s.entities.zipKey = ride;
}
function updateZipline(scene) {
  const e = scene[NS]?.entities.zipline; if (!e?.car?.active) return;
  if (!e.riding) { e.car.x = e.x1 + Math.sin(scene.time.now / 950) * 6; e.car.y = lerp(e.y1, e.y2, (Math.sin(scene.time.now / 1500) + 1) / 2); }
  else {
    const t = Number(scene.player.getData('ziplineT') || 0); const next = clamp(t + .008, 0, 1); scene.player.setData('ziplineT', next); scene.player.x = lerp(e.x1, e.x2, next); scene.player.y = lerp(e.y1, e.y2, next) + 12; e.car.x = scene.player.x; e.car.y = scene.player.y - 12;
    if (next >= 1) { e.riding = false; scene.player.setData('ziplineRide', false).setData('ziplineT', 0); scene.player.body.setAllowGravity(true); cue(scene, 'ZIPLINE RELEASE', '#e0a7ff'); }
  }
  e.label?.setPosition((e.x1 + e.x2) / 2, Math.min(e.y1, e.y2) - 28);
}

function installThrowables(scene) {
  const s = base(scene); if (!s.features.throwable || s.entities.throwables) return;
  const crates = [];
  for (let i = 0; i < 4; i++) { const x = routeX(scene, .18 + i * .17), y = platformY(scene, x) - 15; const crate = scene.physics.add.sprite(x, y, 'gx-crate').setDepth(10); crate.body.setAllowGravity(true).setBounce(.06).setDrag(260, 0); const label = text(scene, 'LIFTABLE', x, y - 24, '#ffd06e'); crates.push({ crate, label });
    scene.physics.add.overlap(scene.player, crate, () => { if (!crate.active || s.heldCrate) return; if (Phaser.Math.Distance.Between(scene.player.x, scene.player.y, crate.x, crate.y) > 65) return; s.heldCrate = crate; crate.body.enable = false; crate.setAlpha(.8); cue(scene, 'OBJECT READY · G TO THROW', '#ffd06e'); });
  }
  s.entities.throwables = crates;
  const release = event => { if (String(event.key).toLowerCase() !== 'g' || !s.heldCrate) return; const item = s.heldCrate; s.heldCrate = null; item.crate.body.enable = true; item.crate.setAlpha(1); const dir = scene.player.flipX ? -1 : 1; item.crate.x = scene.player.x + dir * 34; item.crate.y = scene.player.y - 4; item.crate.body.setVelocity(dir * 520, -250); cue(scene, 'THROW', '#ffd06e'); };
  scene.input.keyboard?.on('keydown', release); s.entities.throwableKey = release;
}
function updateThrowables(scene) { const s = scene[NS]; if (!s) return; for (const item of s.entities.throwables || []) item.label?.setPosition(item.crate.x, item.crate.y - 24); if (s.heldCrate?.crate?.active) { s.heldCrate.crate.x = scene.player.x + (scene.player.flipX ? -1 : 1) * 26; s.heldCrate.crate.y = scene.player.y - 42; } }

// NEW #6 — Rotating laser hazard. It is a spatial timing hazard, not a flashlight/lighting system.
function installLaserSweep(scene) {
  const s = base(scene); if (!s.features.laserSweep || s.entities.laserSweep) return;
  const x = routeX(scene, .40), y = platformY(scene, x) - 130;
  const node = scene.add.image(x, y, 'gx-laser-node').setDepth(12);
  const beam = scene.add.graphics().setDepth(11); const label = text(scene, 'LASER SWEEP · TIME YOUR PASS', x, y - 30, '#ff7aa8');
  s.entities.laserSweep = { node, beam, label, x, y, angle: -1.1, hitAt: 0 };
}
function updateLaserSweep(scene, time) {
  const e = scene[NS]?.entities.laserSweep; if (!e?.node?.active || !scene.player?.active) return;
  e.angle = Math.sin(time / 900) * 1.1; e.beam.clear().lineStyle(5, 0xff4f8c, .8).lineBetween(e.x, e.y, e.x + Math.cos(e.angle) * 360, e.y + Math.sin(e.angle) * 360);
  const dx = scene.player.x - e.x, dy = scene.player.y - e.y, distance = Math.hypot(dx, dy), angle = Math.atan2(dy, dx); let diff = Math.atan2(Math.sin(angle - e.angle), Math.cos(angle - e.angle));
  if (distance < 330 && Math.abs(diff) < .035 && time - e.hitAt > 900 && scene.healthInvulnerable <= 0) { e.hitAt = time; scene.takeSciFiHit?.('The sweep laser caught the courier.'); cue(scene, 'LASER CONTACT', '#ff7aa8'); }
  e.label?.setPosition(e.x, e.y - 30);
}

function installMovingRelay(scene) {
  const s = base(scene); if (!s.features.movingRelay || s.entities.movingRelay) return;
  const relay = scene.physics.add.sprite(routeX(scene, .56), platformY(scene, routeX(scene, .56)) - 62, 'gx-relay').setDepth(12).setImmovable(true); relay.body.allowGravity = false;
  const label = text(scene, 'MOVING RELAY · INTERCEPT', relay.x, relay.y - 34, '#b9f5ff'); s.entities.movingRelay = { relay, label, collected: false, phase: Math.random() * Math.PI * 2 };
  scene.physics.add.overlap(scene.player, relay, () => { if (!relay.active || s.entities.movingRelay.collected) return; s.entities.movingRelay.collected = true; relay.disableBody(true, true); cue(scene, 'MOVING RELAY SECURED', '#b9f5ff'); scene.game.events.emit('signal', { source: 'moving-relay' }); });
}
function updateMovingRelay(scene, time) { const e = scene[NS]?.entities.movingRelay; if (!e?.relay?.active) return; const start = routeX(scene, .55), end = routeX(scene, .76), phase = (Math.sin(time / 1200 + e.phase) + 1) / 2; e.relay.x = lerp(start, end, phase); e.relay.y = platformY(scene, e.relay.x) - 62 + Math.sin(time / 300) * 7; e.label?.setPosition(e.relay.x, e.relay.y - 34); }

function installHandoff(scene) {
  const s = base(scene); if (!s.features.handoff || s.entities.handoff) return;
  const x = routeX(scene, .79), y = platformY(scene, x) - 30; const npc = scene.physics.add.sprite(x, y, 'gx-crate').setDepth(11).setImmovable(true); npc.body.allowGravity = false; npc.setScale(.8);
  const marker = scene.add.circle(x, y - 12, 34, 0xe0a7ff, .08).setStrokeStyle(2, 0xe0a7ff, .55).setDepth(10); const label = text(scene, 'HANDOFF POINT', x, y - 44, '#e0a7ff'); s.entities.handoff = { npc, marker, label };
  scene.physics.add.overlap(scene.player, npc, () => { if (s.handoffDone || scene.respawning || scene.finished) return; s.handoffDone = true; marker.setFillStyle(0x8df4ff, .15); marker.setStrokeStyle(2, 0x8df4ff, .75); label.setText('HANDOFF COMPLETE'); cue(scene, 'PACKAGE HANDOFF COMPLETE', '#8df4ff'); scene.game.events.emit('package-handoff', { missionId: scene.mission?.id }); });
}
function installElevator(scene) {
  const s = base(scene); if (!s.features.elevator || s.entities.elevator) return;
  const x = routeX(scene, .67), y = platformY(scene, x) - 96; const platform = scene.physics.add.sprite(x, y, 'gx-elevator').setDepth(9).setImmovable(true); platform.body.allowGravity = false;
  const label = text(scene, 'VERTICAL LIFT', x, y - 22, '#aee37f'); s.entities.elevator = { platform, top: y - 130, bottom: y + 58, label, lastY: y };
}
function updateElevator(scene, time) { const e = scene[NS]?.entities.elevator; if (!e?.platform?.active) return; const p = e.platform, previous = e.lastY; p.y = lerp(e.top, e.bottom, (Math.sin(time / 1500) + 1) / 2); e.lastY = p.y; e.label?.setPosition(p.x, p.y - 22); const dy = p.y - previous; if (scene.player?.active && Math.abs(dy) > .05 && Phaser.Geom.Intersects.RectangleToRectangle(scene.player.getBounds(), p.getBounds())) scene.player.y += dy; }

// NEW #10 — Sound Pressure. Movement/noise temporarily creates a pressure field and can trigger a local alarm.
function installSoundPressure(scene) {
  const s = base(scene); if (!s.features.soundPressure || s.entities.soundPressure) return;
  const x = routeX(scene, .63), y = platformY(scene, x) - 46; const beacon = scene.physics.add.sprite(x, y, 'gx-noise-beacon').setDepth(10).setImmovable(true); beacon.body.allowGravity = false;
  const ring = scene.add.circle(x, y, 24, 0xffcf82, .06).setStrokeStyle(2, 0xffcf82, .45).setDepth(9); const label = text(scene, 'QUIET ZONE · MANAGE NOISE', x, y - 42, '#ffcf82');
  s.entities.soundPressure = { beacon, ring, label, radius: 190, pulseAt: 0 };
}
function updateSoundPressure(scene, time) {
  const e = scene[NS]?.entities.soundPressure; if (!e?.beacon?.active || !scene.player?.active) return;
  const distance = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, e.beacon.x, e.beacon.y); const moving = Math.abs(scene.player.body?.velocity?.x || 0) > 250 || Math.abs(scene.player.body?.velocity?.y || 0) > 520; const noisy = distance < e.radius && moving;
  e.ring.setRadius(noisy ? 34 + Math.sin(time / 70) * 8 : 24).setStrokeStyle(2, noisy ? 0xff6b7b : 0xffcf82, noisy ? .75 : .45); e.label?.setPosition(e.beacon.x, e.beacon.y - 42);
  if (noisy && time - e.pulseAt > 1200) { e.pulseAt = time; cue(scene, 'NOISE PRESSURE', '#ffcf82'); scene.game.events.emit('sound-pressure', { missionId: scene.mission?.id }); if (time > (scene[NS].soundAlarmUntil || 0)) scene[NS].soundAlarmUntil = time + 1800; }
  if (time < (scene[NS].soundAlarmUntil || 0)) scene.player.setTint(0xffc48b); else if (scene.player?.active && scene.player.tintTopLeft) scene.player.clearTint();
}

function install(scene) {
  if (!scene || scene[NS]?.initialized) return;
  const s = base(scene); s.initialized = true; installTextures(scene);
  installTrain(scene); installCrane(scene); installTraffic(scene); installZipline(scene); installThrowables(scene); installLaserSweep(scene); installMovingRelay(scene); installHandoff(scene); installElevator(scene); installSoundPressure(scene);
}
function update(scene, time, delta) {
  const s = scene[NS]; if (!s || s.destroyed || !scene.player?.active || scene.respawning || scene.finished) return;
  updateTrain(scene, delta); updateCrane(scene, time); updateTraffic(scene); updateZipline(scene); updateThrowables(scene); updateLaserSweep(scene, time); updateMovingRelay(scene, time); updateElevator(scene, time); updateSoundPressure(scene, time);
}
function destroy(scene) {
  const s = scene[NS]; if (!s || s.destroyed) return; s.destroyed = true; for (const id of s.timers) id.remove?.(); s.timers.clear();
  if (s.entities.zipKey) scene.input.keyboard?.off('keydown-Z', s.entities.zipKey);
  if (s.entities.throwableKey) scene.input.keyboard?.off('keydown', s.entities.throwableKey);
  const destroyAny = value => { if (!value) return; if (Array.isArray(value)) return value.forEach(destroyAny); if (typeof value === 'object') { for (const child of Object.values(value)) { if (child && typeof child.destroy === 'function') { try { child.destroy(); } catch {} } } } };
  destroyAny(s.entities);
}
export function installGameplayExpansion(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__relayGameplayExpansionInstalled) return;
  RunnerScene.prototype.__relayGameplayExpansionInstalled = true;
  const create = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function gameplayExpansionCreate(...args) { const result = create.apply(this, args); try { if (this.mission) install(this); } catch (error) { console.warn('[Relay] gameplay expansion isolated:', error); } return result; };
  const updateCore = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function gameplayExpansionUpdate(time, delta, ...args) { try { update(this, time, delta); } catch (error) { console.warn('[Relay] gameplay expansion update isolated:', error); } return updateCore.apply(this, [time, delta, ...args]); };
  const shutdown = RunnerScene.prototype.shutdown;
  RunnerScene.prototype.shutdown = function gameplayExpansionShutdown(...args) { try { destroy(this); } catch (error) { console.warn('[Relay] gameplay expansion cleanup isolated:', error); } return shutdown?.apply(this, args); };
}
