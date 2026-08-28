import Phaser from 'phaser';
import { RunnerScene } from '../scenes/RunnerScene.js';

// Gameplay Expansion V4 SAFE
// Ten additive systems covering the audited twelve ideas.
// V4 uses world pointer/touch interactions only to avoid keyboard ownership conflicts.
const NS = '__relayGameplayExpansionV4Safe';
const FEATURES = [
  'echoScan', 'surfacePhysics', 'temperatureSystem', 'objectDuplication',
  'trajectoryPreview', 'sonicPushPull', 'remoteCamera', 'objectRotation',
  'surfacePhaseMarking', 'impactBanking',
];
const LAYOUT = {
  'first-delivery': ['echoScan', 'surfacePhysics'],
  'dead-drop': ['temperatureSystem', 'objectDuplication', 'sonicPushPull'],
  blackout: ['trajectoryPreview', 'remoteCamera', 'surfacePhaseMarking'],
  pursuit: ['objectRotation', 'surfacePhysics', 'trajectoryPreview'],
  'signal-storm': ['impactBanking', 'temperatureSystem', 'echoScan'],
  'corporate-lockdown': ['remoteCamera', 'objectDuplication', 'sonicPushPull'],
  'final-relay': ['echoScan', 'temperatureSystem', 'objectRotation', 'surfacePhaseMarking', 'impactBanking'],
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);

function getState(scene) {
  if (scene[NS]) return scene[NS];
  const enabled = Object.fromEntries(FEATURES.map(key => [key, false]));
  for (const key of LAYOUT[scene.mission?.id] || []) enabled[key] = true;
  scene[NS] = { enabled, entities: {}, resources: new Set(), bindings: [], timers: new Set(), destroyed: false };
  return scene[NS];
}
function remember(scene, value) { if (value) getState(scene).resources.add(value); return value; }
function routeX(scene, fraction) {
  const start = Number(scene.mission?.spawn?.x || 160);
  const goal = Number(scene.mission?.goal?.x || start + 3600);
  return clamp(lerp(start + 200, goal - 260, fraction), start + 120, goal - 100);
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
function label(scene, text, x, y, color = '#dffcff', size = '8px') {
  return remember(scene, scene.add.text(x, y, text, { fontFamily: 'DM Mono', fontSize: size, color, stroke: '#08101c', strokeThickness: 4, letterSpacing: 1 }).setOrigin(0.5).setDepth(31).setAlpha(0.93));
}
function cue(scene, text, color = '#8df4ff') { try { scene.playerCue?.(text, color); } catch {} }
function makeTexture(scene, key, width, height, fill, line = 0xdffcff) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(fill, 1).fillRoundedRect(0, 0, width, height, Math.min(12, width * 0.18));
  g.lineStyle(2, line, 0.85).strokeRoundedRect(1, 1, width - 2, height - 2, Math.min(11, width * 0.15));
  g.generateTexture(key, width, height); g.destroy();
}
function makeTextures(scene) {
  makeTexture(scene, 'gxv4-scan', 34, 34, 0x203c4f, 0x8df4ff);
  makeTexture(scene, 'gxv4-pad', 118, 16, 0x25374a, 0xaee37f);
  makeTexture(scene, 'gxv4-thermal', 34, 34, 0x412d2d, 0xff826e);
  makeTexture(scene, 'gxv4-cold', 34, 34, 0x263c52, 0x8df4ff);
  makeTexture(scene, 'gxv4-crate', 32, 30, 0x4b3b2f, 0xffd06e);
  makeTexture(scene, 'gxv4-sonic', 28, 28, 0x2c3b53, 0xe0a7ff);
  makeTexture(scene, 'gxv4-camera', 38, 28, 0x263b50, 0x8df4ff);
  makeTexture(scene, 'gxv4-rotor', 42, 42, 0x354156, 0xffcf82);
  makeTexture(scene, 'gxv4-phase', 30, 72, 0x2c3050, 0xe0a7ff);
  makeTexture(scene, 'gxv4-impact', 34, 34, 0x4e3328, 0xff9c6e);
}
function addPointerTarget(scene, node, handler) {
  node?.setInteractive?.({ useHandCursor: false });
  node?.on?.('pointerdown', handler);
  return node;
}

function installEchoScan(scene) {
  const st = getState(scene); if (!st.enabled.echoScan || st.entities.echoScan || !scene.player) return;
  const x = routeX(scene, 0.28), y = platformY(scene, x) - 74;
  const node = remember(scene, scene.physics.add.sprite(x, y, 'gxv4-scan').setDepth(13).setImmovable(true)); node.body.allowGravity = false;
  const pulse = remember(scene, scene.add.circle(x, y, 16, 0x8df4ff, 0.05).setStrokeStyle(2, 0x8df4ff, 0.6).setDepth(12));
  const hiddenA = remember(scene, scene.add.circle(routeX(scene, 0.39), platformY(scene, routeX(scene, 0.39)) - 50, 12, 0xffd06e, 0.92).setDepth(10).setAlpha(0.08));
  const hiddenB = remember(scene, scene.add.rectangle(routeX(scene, 0.46), platformY(scene, routeX(scene, 0.46)) - 34, 22, 58, 0xe0a7ff, 0.86).setDepth(10).setAlpha(0.08));
  const text = label(scene, 'ECHO SCAN · TAP', x, y - 34, '#8df4ff');
  const e = { node, pulse, hidden: [hiddenA, hiddenB], activeUntil: 0, text }; st.entities.echoScan = e;
  const scan = () => { e.activeUntil = performance.now() + 3200; cue(scene, 'ECHO SCAN — HIDDEN OBJECTS', '#8df4ff'); for (const item of e.hidden) item.setAlpha(1); };
  addPointerTarget(scene, node, scan);
}
function updateEchoScan(scene) {
  const e = scene[NS]?.entities.echoScan; if (!e) return;
  const active = performance.now() < e.activeUntil;
  const radius = active ? 56 + Math.sin(performance.now() / 80) * 16 : 18;
  e.pulse.setRadius(radius).setAlpha(active ? 0.78 : 0.35);
  if (!active) for (const item of e.hidden) item.setAlpha(0.08);
  e.text.setPosition(e.node.x, e.node.y - 34);
}

function installSurfacePhysics(scene) {
  const st = getState(scene); if (!st.enabled.surfacePhysics || st.entities.surfacePhysics || !scene.player) return;
  const x = routeX(scene, 0.34), y = platformY(scene, x) - 10;
  const grip = remember(scene, scene.physics.add.sprite(x - 78, y, 'gxv4-pad').setDepth(9).setImmovable(true));
  const slick = remember(scene, scene.physics.add.sprite(x + 78, y, 'gxv4-pad').setDepth(9).setImmovable(true));
  grip.body.allowGravity = false; slick.body.allowGravity = false; grip.setTint(0xaee37f); slick.setTint(0x8df4ff);
  const a = label(scene, 'GRIP', grip.x, grip.y - 24, '#aee37f'); const b = label(scene, 'SLICK', slick.x, slick.y - 24, '#8df4ff');
  st.entities.surfacePhysics = { grip, slick, a, b, mode: 'normal' };
}
function updateSurfacePhysics(scene) {
  const e = scene[NS]?.entities.surfacePhysics; if (!e || !scene.player?.active) return;
  const pb = scene.player.getBounds();
  const onGrip = Phaser.Geom.Intersects.RectangleToRectangle(pb, e.grip.getBounds());
  const onSlick = Phaser.Geom.Intersects.RectangleToRectangle(pb, e.slick.getBounds());
  e.mode = onGrip ? 'grip' : onSlick ? 'slick' : 'normal';
  if (e.mode === 'grip') { scene.player.body.velocity.x *= 0.82; scene.player.setTint(0xaee37f); }
  else if (e.mode === 'slick') { scene.player.body.velocity.x = clamp(scene.player.body.velocity.x * 1.012, -620, 620); scene.player.setTint(0x8df4ff); }
  else scene.player.clearTint?.();
  e.a.setPosition(e.grip.x, e.grip.y - 24); e.b.setPosition(e.slick.x, e.slick.y - 24);
}

function installTemperatureSystem(scene) {
  const st = getState(scene); if (!st.enabled.temperatureSystem || st.entities.temperatureSystem) return;
  const x = routeX(scene, 0.34), y = platformY(scene, x) - 82;
  const hot = remember(scene, scene.physics.add.sprite(x - 74, y, 'gxv4-thermal').setDepth(12).setImmovable(true));
  const cold = remember(scene, scene.physics.add.sprite(x + 74, y, 'gxv4-cold').setDepth(12).setImmovable(true));
  hot.body.allowGravity = false; cold.body.allowGravity = false;
  const nodes = [remember(scene, scene.physics.add.sprite(x - 10, y + 64, 'gxv4-thermal').setDepth(11)), remember(scene, scene.physics.add.sprite(x + 58, y + 64, 'gxv4-thermal').setDepth(11))];
  nodes.forEach(node => node.body.setAllowGravity(true));
  const labelNode = label(scene, 'THERMAL STATE · TAP', x, y - 34, '#ff9c91');
  const e = { hot, cold, nodes, states: nodes.map(() => 'normal'), label: labelNode, lastTransfer: 0 }; st.entities.temperatureSystem = e;
  const heat = () => { e.hot.setTint(0xff6f5f); e.cold.clearTint?.(); e.states = e.states.map(() => 'hot'); cue(scene, 'THERMAL STATE — HOT', '#ff826e'); };
  const chill = () => { e.cold.setTint(0x6ecbff); e.hot.clearTint?.(); e.states = e.states.map(() => 'cold'); cue(scene, 'THERMAL STATE — COLD', '#8df4ff'); };
  addPointerTarget(scene, hot, heat); addPointerTarget(scene, cold, chill);
}
function updateTemperatureSystem(scene, time) {
  const e = scene[NS]?.entities.temperatureSystem; if (!e) return;
  if (time - e.lastTransfer > 900) { e.lastTransfer = time; for (let i = 0; i < e.nodes.length - 1; i++) { const source = e.states[i]; if (source !== 'normal' && dist(e.nodes[i], e.nodes[i + 1]) < 100) e.states[i + 1] = source; } }
  e.nodes.forEach((node, i) => { const s = e.states[i]; node.setTint(s === 'hot' ? 0xff6f5f : s === 'cold' ? 0x6ecbff : 0x7d8b97); node.body.setMass(s === 'hot' ? 1.4 : s === 'cold' ? 3.8 : 2.4); });
  e.label.setPosition(e.hot.x + 74, e.hot.y - 34);
}

function installObjectDuplication(scene) {
  const st = getState(scene); if (!st.enabled.objectDuplication || st.entities.objectDuplication) return;
  const x = routeX(scene, 0.43), y = platformY(scene, x) - 36;
  const source = remember(scene, scene.physics.add.sprite(x, y, 'gxv4-crate').setDepth(10)); source.body.setAllowGravity(true).setMass(2.5);
  const text = label(scene, 'OBJECT DUPLICATION · TAP', x, y - 28, '#ffd06e'); const e = { source, clones: [], text }; st.entities.objectDuplication = e;
  const duplicate = () => { if (e.clones.length >= 3) return cue(scene, 'DUPLICATION LIMIT REACHED', '#ffd06e'); const clone = remember(scene, scene.physics.add.sprite(source.x + 42 * (e.clones.length + 1), source.y - 12, 'gxv4-crate').setDepth(10)); clone.body.setAllowGravity(true).setMass(2.5); clone.setTint(0xe6b7ff); e.clones.push(clone); cue(scene, 'OBJECT DUPLICATED', '#ffd06e'); };
  addPointerTarget(scene, source, duplicate);
}
function updateObjectDuplication(scene) { const e = scene[NS]?.entities.objectDuplication; if (e) e.text.setPosition(e.source.x, e.source.y - 28); }

function installTrajectoryPreview(scene) {
  const st = getState(scene); if (!st.enabled.trajectoryPreview || st.entities.trajectoryPreview) return;
  const x = routeX(scene, 0.52), y = platformY(scene, x) - 90;
  const orb = remember(scene, scene.physics.add.sprite(x, y, 'gxv4-impact').setDepth(11).setImmovable(true)); orb.body.allowGravity = false;
  const path = remember(scene, scene.add.graphics().setDepth(8)); const text = label(scene, 'TRAJECTORY PREVIEW · LIVE', x, y - 30, '#ff9c6e'); st.entities.trajectoryPreview = { orb, path, text };
}
function updateTrajectoryPreview(scene, time) {
  const e = scene[NS]?.entities.trajectoryPreview; if (!e) return;
  const originX = e.orb.x, originY = e.orb.y, vx = 280, gravity = 260;
  e.path.clear().lineStyle(2, 0xff9c6e, 0.58);
  for (let i = 0; i < 22; i++) { const t = i * 0.08, px = originX + vx * t, py = originY - 120 * t + 0.5 * gravity * t * t + Math.sin(time / 180 + i) * 2; e.path.lineBetween(px, py, px + 8, py); }
  e.text.setPosition(originX, originY - 30);
}

function installSonicPushPull(scene) {
  const st = getState(scene); if (!st.enabled.sonicPushPull || st.entities.sonicPushPull) return;
  const x = routeX(scene, 0.56), y = platformY(scene, x) - 62;
  const node = remember(scene, scene.physics.add.sprite(x, y, 'gxv4-sonic').setDepth(13).setImmovable(true)); node.body.allowGravity = false;
  const ring = remember(scene, scene.add.circle(x, y, 54, 0xe0a7ff, 0.06).setStrokeStyle(2, 0xe0a7ff, 0.5).setDepth(8));
  const text = label(scene, 'SONIC PUSH / PULL · TAP TO PULSE', x, y - 34, '#e0a7ff'); const e = { node, ring, text, mode: 1, pulse: 0 }; st.entities.sonicPushPull = e;
  const toggle = () => { e.mode *= -1; e.pulse = 300; cue(scene, e.mode > 0 ? 'SONIC PUSH' : 'SONIC PULL', '#e0a7ff'); }; addPointerTarget(scene, node, toggle);
}
function updateSonicPushPull(scene, time, delta) {
  const e = scene[NS]?.entities.sonicPushPull; if (!e) return;
  e.pulse = Math.max(0, e.pulse - delta); const radius = e.pulse ? 108 + (300 - e.pulse) * 0.8 : 54; e.ring.setRadius(radius).setAlpha(e.pulse ? 0.82 : 0.34);
  if (e.pulse) { const bodies = [...(scene[NS]?.entities?.objectDuplication?.clones || []), scene[NS]?.entities?.objectDuplication?.source].filter(Boolean); for (const obj of bodies) { const d = dist(obj, e.node); if (!obj.active || d > 150 || d < 12) continue; const sign = e.mode > 0 ? 1 : -1; obj.body.velocity.x += ((obj.x - e.node.x) / d) * sign * 18 * (1 - d / 150); obj.body.velocity.y += ((obj.y - e.node.y) / d) * sign * 10 * (1 - d / 150); } }
  e.text.setPosition(e.node.x, e.node.y - 34);
}

function installRemoteCamera(scene) {
  const st = getState(scene); if (!st.enabled.remoteCamera || st.entities.remoteCamera) return;
  const x = routeX(scene, 0.64), y = platformY(scene, x) - 92;
  const node = remember(scene, scene.physics.add.sprite(x, y, 'gxv4-camera').setDepth(13).setImmovable(true)); node.body.allowGravity = false;
  const text = label(scene, 'REMOTE CAMERA · TAP', x, y - 32, '#8df4ff'); const e = { node, text, active: false, until: 0, saved: null }; st.entities.remoteCamera = e;
  const activate = () => { if (e.active || !scene.cameras?.main) return; e.active = true; e.until = performance.now() + 2400; e.saved = { x: scene.cameras.main.scrollX, y: scene.cameras.main.scrollY }; scene.cameras.main.pan(e.node.x, e.node.y, 550, 'Sine.easeInOut'); cue(scene, 'REMOTE CAMERA LINK', '#8df4ff'); };
  addPointerTarget(scene, node, activate);
}
function updateRemoteCamera(scene) {
  const e = scene[NS]?.entities.remoteCamera; if (!e) return;
  if (e.active && performance.now() >= e.until) { e.active = false; if (e.saved) scene.cameras.main.pan(e.saved.x + scene.cameras.main.width / 2, e.saved.y + scene.cameras.main.height / 2, 450, 'Sine.easeInOut'); }
  e.text.setPosition(e.node.x, e.node.y - 32);
}

function installObjectRotation(scene) {
  const st = getState(scene); if (!st.enabled.objectRotation || st.entities.objectRotation) return;
  const x = routeX(scene, 0.45), y = platformY(scene, x) - 30;
  const body = remember(scene, scene.physics.add.sprite(x, y, 'gxv4-rotor').setDepth(12)); body.body.setAllowGravity(true).setMass(3.5).setImmovable(true);
  const text = label(scene, 'OBJECT ROTATION · TAP', x, y - 34, '#ffcf82'); const e = { body, text, turns: 0 }; st.entities.objectRotation = e;
  const rotate = () => { e.turns = (e.turns + 1) % 4; e.body.rotation = e.turns * Math.PI / 2; cue(scene, `OBJECT ROTATION ${e.turns * 90}°`, '#ffcf82'); }; addPointerTarget(scene, body, rotate);
}
function updateObjectRotation(scene) { const e = scene[NS]?.entities.objectRotation; if (e) e.text.setPosition(e.body.x, e.body.y - 34); }

function installSurfacePhaseMarking(scene) {
  const st = getState(scene); if (!st.enabled.surfacePhaseMarking || st.entities.surfacePhaseMarking) return;
  const x = routeX(scene, 0.55), y = platformY(scene, x) - 54;
  const marker = remember(scene, scene.physics.add.sprite(x, y, 'gxv4-phase').setDepth(12).setImmovable(true)); marker.body.allowGravity = false;
  const target = remember(scene, scene.add.rectangle(x + 62, y, 26, 104, 0x2a2f45, 0.96).setDepth(10)); scene.physics.add.existing(target); target.body.allowGravity = false; target.body.setImmovable(true);
  const text = label(scene, 'SURFACE PHASE MARK · TAP', x, y - 44, '#e0a7ff'); const e = { marker, target, text, phase: false }; st.entities.surfacePhaseMarking = e;
  const toggle = () => { e.phase = !e.phase; e.target.body.enable = !e.phase; e.target.setAlpha(e.phase ? 0.18 : 0.96); cue(scene, e.phase ? 'SURFACE MARK — PASSABLE' : 'SURFACE MARK — SOLID', '#e0a7ff'); }; addPointerTarget(scene, marker, toggle);
}
function updateSurfacePhaseMarking(scene) { const e = scene[NS]?.entities.surfacePhaseMarking; if (e) e.text.setPosition(e.marker.x, e.marker.y - 44); }

function installImpactBanking(scene) {
  const st = getState(scene); if (!st.enabled.impactBanking || st.entities.impactBanking) return;
  const x = routeX(scene, 0.56), y = platformY(scene, x) - 34;
  const bank = remember(scene, scene.physics.add.sprite(x, y, 'gxv4-impact').setDepth(12).setImmovable(true)); bank.body.allowGravity = false;
  const orb = remember(scene, scene.physics.add.sprite(x - 130, y - 120, 'gxv4-crate').setDepth(11)); orb.body.setAllowGravity(true).setMass(1.2).setBounce(0.45);
  const text = label(scene, 'IMPACT BANK · TAP TO RELEASE', x, y - 32, '#ff9c6e'); const meter = remember(scene, scene.add.rectangle(x, y + 24, 72, 5, 0x4a2a24, 0.95).setOrigin(0.5).setDepth(11));
  const e = { bank, orb, text, meter, charge: 0 }; st.entities.impactBanking = e;
  const release = () => { if (e.charge < 10) return cue(scene, 'BANK TOO LOW — IMPACT REQUIRED', '#ff9c6e'); const power = clamp(e.charge * 1.8, 120, 600); e.orb.body.setVelocityX(power); e.charge = 0; cue(scene, 'IMPACT BANK RELEASED', '#ff9c6e'); }; addPointerTarget(scene, bank, release);
}
function updateImpactBanking(scene) {
  const e = scene[NS]?.entities.impactBanking; if (!e) return;
  const d = dist(e.orb, e.bank);
  if (d < 46 && Math.abs(e.orb.body.velocity.x) > 70) { e.charge = clamp(e.charge + Math.abs(e.orb.body.velocity.x) * 0.012, 0, 100); e.orb.x = e.bank.x - 44; e.orb.body.setVelocity(-e.orb.body.velocity.x * 0.52, -150); }
  e.charge = Math.max(0, e.charge - 0.003 * (scene.game.loop.delta || 16)); e.meter.scaleX = e.charge / 100; e.text.setPosition(e.bank.x, e.bank.y - 32);
}

function install(scene) {
  const st = getState(scene); if (st.initialized || st.destroyed || !scene.player) return;
  st.initialized = true; makeTextures(scene); installEchoScan(scene); installSurfacePhysics(scene); installTemperatureSystem(scene); installObjectDuplication(scene); installTrajectoryPreview(scene); installSonicPushPull(scene); installRemoteCamera(scene); installObjectRotation(scene); installSurfacePhaseMarking(scene); installImpactBanking(scene);
}
function update(scene, time, delta) {
  const st = scene[NS]; if (!st || st.destroyed || !scene.player?.active || scene.respawning || scene.finished) return;
  updateEchoScan(scene); updateSurfacePhysics(scene); updateTemperatureSystem(scene, time); updateObjectDuplication(scene); updateTrajectoryPreview(scene, time); updateSonicPushPull(scene, time, delta); updateRemoteCamera(scene); updateObjectRotation(scene); updateSurfacePhaseMarking(scene); updateImpactBanking(scene);
}
function destroy(scene) {
  const st = scene[NS]; if (!st || st.destroyed) return; st.destroyed = true;
  for (const timer of st.timers) timer.remove?.(); st.timers.clear(); if (scene.player) scene.player.clearTint?.();
  if (st.entities.remoteCamera?.active && st.entities.remoteCamera.saved && scene.cameras?.main) { const saved = st.entities.remoteCamera.saved; scene.cameras.main.setScroll(saved.x, saved.y); }
  for (const resource of st.resources) { try { resource?.destroy?.(); } catch {} }
  scene[NS] = null;
}
export function installGameplayExpansionV4Safe(SceneClass = RunnerScene) {
  if (!SceneClass?.prototype || SceneClass.prototype.__relayGameplayExpansionV4SafeInstalled) return;
  SceneClass.prototype.__relayGameplayExpansionV4SafeInstalled = true;
  const originalCreate = SceneClass.prototype.create;
  SceneClass.prototype.create = function gameplayExpansionV4SafeCreate(...args) { const result = originalCreate.apply(this, args); try { install(this); } catch (error) { console.warn('[Relay] V4 init isolated:', error); } return result; };
  const originalUpdate = SceneClass.prototype.update;
  SceneClass.prototype.update = function gameplayExpansionV4SafeUpdate(time, delta, ...args) { try { update(this, time, delta); } catch (error) { console.warn('[Relay] V4 update isolated:', error); } return originalUpdate.apply(this, [time, delta, ...args]); };
  const originalShutdown = SceneClass.prototype.shutdown;
  SceneClass.prototype.shutdown = function gameplayExpansionV4SafeShutdown(...args) { try { destroy(this); } catch (error) { console.warn('[Relay] V4 cleanup isolated:', error); } return originalShutdown?.apply(this, args); };
}
export { FEATURES as gameplayExpansionV4Features, LAYOUT as gameplayExpansionV4Layout };
