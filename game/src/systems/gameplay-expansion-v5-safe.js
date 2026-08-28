import Phaser from 'phaser';
import { RunnerScene } from '../scenes/RunnerScene.js';

// Gameplay Expansion V5 SAFE
// Nine additive systems covering the audited twelve ideas.
// Pointer/touch-first so V5 adds no keyboard ownership conflicts.
const NS = '__relayGameplayExpansionV5Safe';
const FEATURES = [
  'stamina', 'fieldCrafting', 'vehicle', 'rescueCarry', 'lootExtraction',
  'blackMarket', 'escort', 'fieldRepair', 'investigation',
];

const LAYOUT = {
  'first-delivery': ['stamina', 'investigation'],
  'dead-drop': ['fieldCrafting', 'blackMarket', 'lootExtraction'],
  blackout: ['fieldRepair', 'investigation', 'escort'],
  pursuit: ['vehicle', 'stamina'],
  'signal-storm': ['escort', 'lootExtraction', 'fieldCrafting'],
  'corporate-lockdown': ['vehicle', 'fieldRepair', 'blackMarket'],
  'final-relay': ['vehicle', 'rescueCarry', 'investigation', 'lootExtraction'],
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);

function getState(scene) {
  if (scene[NS]) return scene[NS];
  const enabled = Object.fromEntries(FEATURES.map(k => [k, false]));
  for (const k of LAYOUT[scene.mission?.id] || []) enabled[k] = true;
  scene[NS] = { enabled, entities: {}, resources: new Set(), destroyed: false };
  return scene[NS];
}

function remember(scene, obj) {
  if (obj) getState(scene).resources.add(obj);
  return obj;
}

function routeX(scene, fraction = .5) {
  const start = Number(scene.mission?.spawn?.x || 160);
  const goal = Number(scene.mission?.goal?.x || start + 3600);
  return clamp(Phaser.Math.Linear(start + 220, goal - 220, fraction), start + 120, goal - 120);
}

function platformY(scene, x, fallback = 540) {
  const ps = Array.isArray(scene.mission?.platforms) ? scene.mission.platforms : [];
  let best = null;
  for (const [px, py, width] of ps) {
    if (![px, py, width].every(Number.isFinite)) continue;
    const d = Math.abs(px + width / 2 - x);
    if (!best || d < best.d) best = { y: py, d };
  }
  return best?.y ?? fallback;
}

function label(scene, value, x, y, color = '#dffcff', size = '9px') {
  return remember(scene, scene.add.text(x, y, value, {
    fontFamily: 'DM Mono', fontSize: size, color, stroke: '#07101b', strokeThickness: 4, letterSpacing: 1,
  }).setOrigin(.5).setDepth(40).setAlpha(.95));
}

function panel(scene, x, y, width, height) {
  return remember(scene, scene.add.rectangle(x, y, width, height, 0x0b1522, .78)
    .setOrigin(0).setDepth(39).setStrokeStyle(1, 0x6ed6ff, .32).setScrollFactor(0));
}

function touch(scene, node, handler) {
  node?.setInteractive?.({ useHandCursor: false });
  node?.on?.('pointerdown', handler);
  return node;
}

function cue(scene, text, color = '#8df4ff') {
  try { scene.playerCue?.(text, color); } catch {}
}

function installStamina(scene) {
  const st = getState(scene);
  if (!st.enabled.stamina || st.entities.stamina || !scene.player?.body) return;
  panel(scene, 18, 88, 170, 36);
  label(scene, 'STAMINA', 32, 100, '#aee37f', '8px').setOrigin(0, .5);
  const fill = remember(scene, scene.add.rectangle(72, 108, 86, 7, 0xaee37f, 1).setOrigin(0, .5).setDepth(41).setScrollFactor(0));
  const meter = label(scene, '100%', 184, 108, '#dffcff', '8px');
  const mode = label(scene, 'READY', 108, 150, '#aee37f', '8px').setScrollFactor(0);
  const button = touch(scene, remember(scene, scene.add.circle(108, 188, 24, 0x173827, .9).setStrokeStyle(2, 0xaee37f, .65).setDepth(41).setScrollFactor(0)), () => {
    const e = st.entities.stamina;
    if (e.energy < 30) return cue(scene, 'STAMINA LOW', '#ff826e');
    e.exertUntil = performance.now() + 900;
    cue(scene, 'EXERTION BOOST', '#aee37f');
  });
  label(scene, 'EXERT', 108, 188, '#aee37f', '7px').setScrollFactor(0);
  st.entities.stamina = { energy: 100, exertUntil: 0, fill, meter, mode, button };
}
function updateStamina(scene, delta) {
  const e = scene[NS]?.entities.stamina; if (!e || !scene.player?.active) return;
  const exerting = performance.now() < e.exertUntil;
  const vx = Math.abs(scene.player.body?.velocity?.x || 0);
  if (exerting) {
    e.energy = clamp(e.energy - delta * .045, 0, 100);
    scene.player.body.velocity.x = clamp(scene.player.body.velocity.x * 1.012, -560, 560);
  } else if (vx > 260) {
    e.energy = clamp(e.energy - delta * .009, 0, 100);
  } else {
    e.energy = clamp(e.energy + delta * .012, 0, 100);
  }
  e.fill.scaleX = Math.max(.02, e.energy / 100);
  e.meter.setText(`${Math.round(e.energy)}%`);
  e.mode.setText(exerting ? 'EXERTING' : e.energy < 25 ? 'RECOVER' : 'READY');
}

function installFieldCrafting(scene) {
  const st = getState(scene); if (!st.enabled.fieldCrafting || st.entities.fieldCrafting) return;
  const x = routeX(scene, .34), y = platformY(scene, x) - 48;
  const e = { parts: 0, crafted: false, sourceParts: [] };
  let output;
  const bench = touch(scene, remember(scene, scene.add.rectangle(x, y, 108, 42, 0x3a2d24, .96).setDepth(12).setStrokeStyle(2, 0xffcf82, .7)), () => {
    if (e.parts < 3) return cue(scene, `CRAFT NEEDS 3 PARTS · ${e.parts}/3`, '#ffcf82');
    e.parts = 0; e.crafted = true; output.setVisible(true); cue(scene, 'FIELD CRAFT COMPLETE', '#ffcf82');
  });
  output = remember(scene, scene.add.rectangle(x, y - 50, 38, 24, 0xaee37f, .18).setDepth(13).setStrokeStyle(2, 0xaee37f, .7).setVisible(false));
  for (let i = 0; i < 3; i += 1) {
    const part = touch(scene, remember(scene, scene.add.circle(x - 70 + i * 28, y + 62, 10, 0x28394a, .95).setDepth(12).setStrokeStyle(1, 0x8df4ff, .65)), () => {
      if (part.getData('taken')) return;
      part.setData('taken', true).setFillStyle(0x16212f, .4);
      e.parts += 1;
      cue(scene, `COMPONENT ${e.parts}/3`, '#8df4ff');
    });
    part.setData('taken', false);
    e.sourceParts.push(part);
  }
  e.bench = bench; e.output = output; e.text = label(scene, 'FIELD CRAFT · 0/3', x, y - 34, '#ffcf82');
  st.entities.fieldCrafting = e;
}
function updateFieldCrafting(scene) {
  const e = scene[NS]?.entities.fieldCrafting; if (!e) return;
  e.text.setText(e.crafted ? 'FIELD CRAFT · READY' : `FIELD CRAFT · ${e.parts}/3`);
  e.text.setPosition(e.bench.x, e.bench.y - 34);
}

function installVehicle(scene) {
  const st = getState(scene); if (!st.enabled.vehicle || st.entities.vehicle || !scene.player) return;
  const x = routeX(scene, .42), y = platformY(scene, x) - 54;
  const e = { mode: 'run', loaded: false, fuel: 100, lastFuel: performance.now() };
  const vehicle = touch(scene, remember(scene, scene.add.rectangle(x, y, 132, 40, 0x233b52, .98).setDepth(13).setStrokeStyle(2, 0x8df4ff, .7)), () => {
    if (e.mode === 'drive') { e.mode = 'run'; cue(scene, 'VEHICLE EXIT', '#8df4ff'); return; }
    if (e.fuel <= 0) return cue(scene, 'FUEL EMPTY', '#ff826e');
    e.mode = 'drive'; cue(scene, 'VEHICLE CONTROLLED', '#8df4ff');
  });
  const wheelA = remember(scene, scene.add.circle(x - 42, y + 24, 12, 0x111922, 1).setDepth(12));
  const wheelB = remember(scene, scene.add.circle(x + 42, y + 24, 12, 0x111922, 1).setDepth(12));
  const cargoNode = touch(scene, remember(scene, scene.add.rectangle(x, y - 34, 54, 18, 0x5a4730, .95).setDepth(14).setStrokeStyle(1, 0xffcf82, .7)), () => {
    e.loaded = !e.loaded; cargoNode.setAlpha(e.loaded ? 1 : .28); cue(scene, e.loaded ? 'CARGO LOADED' : 'CARGO UNLOADED', '#ffcf82');
  });
  const fuelNode = touch(scene, remember(scene, scene.add.circle(x + 74, y - 2, 11, 0x402d2d, .95).setDepth(14).setStrokeStyle(2, 0xff826e, .65)), () => {
    if (e.fuel >= 100) return cue(scene, 'TANK FULL', '#ffcf82');
    if (e.mode === 'drive') return cue(scene, 'STOP VEHICLE TO REFUEL', '#ff826e');
    e.fuel = clamp(e.fuel + 30, 0, 100); cue(scene, `FUEL ${Math.round(e.fuel)}%`, '#ffcf82');
  });
  e.vehicle = vehicle; e.wheelA = wheelA; e.wheelB = wheelB; e.cargoNode = cargoNode; e.fuelNode = fuelNode;
  e.text = label(scene, 'VEHICLE · WALK', x, y - 66, '#8df4ff');
  e.fuelText = label(scene, 'FUEL 100%', x + 62, y + 46, '#ffcf82', '8px');
  st.entities.vehicle = e;
}
function updateVehicle(scene) {
  const e = scene[NS]?.entities.vehicle; if (!e || !scene.player?.active) return;
  if (e.mode === 'drive') {
    e.vehicle.x = scene.player.x; e.vehicle.y = scene.player.y + 18;
    e.wheelA.x = e.vehicle.x - 42; e.wheelB.x = e.vehicle.x + 42;
    scene.player.setAlpha(.16); scene.player.body.velocity.x = 280;
    if (performance.now() - e.lastFuel > 650) { e.lastFuel = performance.now(); e.fuel = clamp(e.fuel - 2.5, 0, 100); }
    if (e.fuel <= 0) { e.mode = 'run'; cue(scene, 'VEHICLE FUEL EMPTY', '#ff826e'); }
  } else scene.player.setAlpha(1);
  e.text.setPosition(e.vehicle.x, e.vehicle.y - 66).setText(`VEHICLE · ${e.mode === 'drive' ? 'DRIVE' : 'TAP TO DRIVE'}`);
  e.fuelText.setPosition(e.vehicle.x + 62, e.vehicle.y + 46).setText(`FUEL ${Math.round(e.fuel)}%`);
  e.cargoNode.setPosition(e.vehicle.x, e.vehicle.y - 34); e.fuelNode.setPosition(e.vehicle.x + 74, e.vehicle.y - 2);
}

function installRescueCarry(scene) {
  const st = getState(scene); if (!st.enabled.rescueCarry || st.entities.rescueCarry || !scene.player) return;
  const x = routeX(scene, .46), y = platformY(scene, x) - 20;
  const e = { carrying: false, complete: false };
  const target = touch(scene, remember(scene, scene.add.rectangle(x, y, 28, 42, 0x5b3553, .95).setDepth(11).setStrokeStyle(2, 0xe0a7ff, .7)), () => {
    if (e.complete) return;
    e.carrying = !e.carrying;
    cue(scene, e.carrying ? 'RESCUE CARRY ACTIVE' : 'PATIENT PLACED', '#e0a7ff');
    if (!e.carrying) { e.complete = true; target.setVisible(false); }
  });
  e.target = target; e.text = label(scene, 'RESCUE · PICK UP', x, y - 34, '#e0a7ff');
  st.entities.rescueCarry = e;
}
function updateRescueCarry(scene) {
  const e = scene[NS]?.entities.rescueCarry; if (!e || !scene.player?.active) return;
  if (e.carrying) { e.target.setVisible(true).setPosition(scene.player.x, scene.player.y - 46); scene.player.body.velocity.x = clamp(scene.player.body.velocity.x, -250, 250); }
  e.text.setPosition(scene.player.x, scene.player.y - 76).setText(e.complete ? 'RESCUE COMPLETE' : e.carrying ? 'CARRYING · SLOW' : 'RESCUE · PICK UP');
}

function installLootExtraction(scene) {
  const st = getState(scene); if (!st.enabled.lootExtraction || st.entities.lootExtraction) return;
  const x = routeX(scene, .52), y = platformY(scene, x) - 52;
  const e = { claimed: false, complete: false };
  const loot = touch(scene, remember(scene, scene.add.circle(x, y, 14, 0xffd06e, .95).setDepth(13).setStrokeStyle(2, 0xfff1b5, .75)), () => {
    if (e.claimed) return; e.claimed = true; loot.setAlpha(.3); cue(scene, 'LOOT SECURED — REACH EXTRACTION', '#ffd06e');
  });
  const extract = remember(scene, scene.add.rectangle(x + 190, y, 76, 116, 0xaee37f, .10).setDepth(8).setStrokeStyle(2, 0xaee37f, .65));
  e.loot = loot; e.extract = extract; e.text = label(scene, 'EXTRACTION', extract.x, extract.y - 74, '#aee37f', '8px');
  st.entities.lootExtraction = e;
}
function updateLootExtraction(scene) {
  const e = scene[NS]?.entities.lootExtraction; if (!e || !scene.player?.active) return;
  if (e.claimed && !e.complete && Phaser.Geom.Intersects.RectangleToRectangle(scene.player.getBounds(), e.extract.getBounds())) { e.complete = true; cue(scene, 'LOOT EXTRACTED', '#aee37f'); }
  e.text.setPosition(e.extract.x, e.extract.y - 74).setText(e.complete ? 'EXTRACTED' : 'EXTRACTION');
}

function installBlackMarket(scene) {
  const st = getState(scene); if (!st.enabled.blackMarket || st.entities.blackMarket) return;
  const x = routeX(scene, .62), y = platformY(scene, x) - 62;
  const e = { trades: 0 };
  const stall = touch(scene, remember(scene, scene.add.rectangle(x, y, 104, 64, 0x342746, .98).setDepth(12).setStrokeStyle(2, 0xb993ff, .65)), () => {
    if (e.trades >= 2) return cue(scene, 'MARKET SOLD OUT', '#b993ff');
    e.trades += 1; cue(scene, 'TRADE COMPLETED', '#b993ff');
  });
  e.stall = stall; e.text = label(scene, 'BLACK MARKET · TRADE', x, y - 48, '#b993ff', '8px'); e.stock = label(scene, 'STOCK 2', x, y + 50, '#d8c1ff', '8px');
  st.entities.blackMarket = e;
}
function updateBlackMarket(scene) { const e = scene[NS]?.entities.blackMarket; if (e) e.stock.setText(`STOCK ${2 - e.trades}`); }

function installEscort(scene) {
  const st = getState(scene); if (!st.enabled.escort || st.entities.escort || !scene.player) return;
  const x = routeX(scene, .42), y = platformY(scene, x) - 34;
  const follower = remember(scene, scene.physics.add.sprite(x, y, 'enemy-runner').setDepth(12).setAlpha(.78));
  follower.body.allowGravity = true; follower.body.setImmovable(true);
  const safe = remember(scene, scene.add.rectangle(routeX(scene, .70), y, 70, 92, 0xaee37f, .10).setDepth(8).setStrokeStyle(2, 0xaee37f, .65));
  const e = { follower, safe, complete: false, text: label(scene, 'ESCORT TARGET', follower.x, follower.y - 46, '#aee37f', '8px'), status: label(scene, 'FOLLOWING', follower.x, follower.y + 40, '#dffcff', '7px') };
  st.entities.escort = e;
}
function updateEscort(scene) {
  const e = scene[NS]?.entities.escort; if (!e || !scene.player?.active || e.complete) return;
  const gap = dist(e.follower, scene.player);
  if (gap > 420) { e.follower.setPosition(scene.player.x - 90, scene.player.y); e.status.setText('CATCHING UP'); }
  else { e.follower.x += Math.sign(scene.player.x - e.follower.x) * Math.min(5.2, gap / 40); e.follower.y = scene.player.y; e.status.setText(gap < 170 ? 'ESCORT OK' : 'KEEP CLOSE'); }
  if (Phaser.Geom.Intersects.RectangleToRectangle(e.follower.getBounds(), e.safe.getBounds())) { e.complete = true; cue(scene, 'ESCORT COMPLETE', '#aee37f'); }
  e.text.setPosition(e.follower.x, e.follower.y - 46); e.status.setPosition(e.follower.x, e.follower.y + 40);
}

function installFieldRepair(scene) {
  const st = getState(scene); if (!st.enabled.fieldRepair || st.entities.fieldRepair) return;
  const x = routeX(scene, .36), y = platformY(scene, x) - 60;
  const e = { progress: 0, repaired: false };
  const damaged = touch(scene, remember(scene, scene.add.rectangle(x, y, 76, 76, 0x4b2c2c, .96).setDepth(12).setStrokeStyle(2, 0xff826e, .7)), () => {
    if (e.repaired) return cue(scene, 'ALREADY REPAIRED', '#aee37f');
    e.progress = clamp(e.progress + 34, 0, 100); e.bar.scaleX = e.progress / 100;
    if (e.progress >= 100) { e.repaired = true; damaged.setFillStyle(0x2c4d3d, .95); cue(scene, 'FIELD REPAIR COMPLETE', '#aee37f'); }
  });
  e.damaged = damaged; e.bar = remember(scene, scene.add.rectangle(x, y + 54, 62, 6, 0x542a2a, 1).setOrigin(.5).setDepth(13)); e.text = label(scene, 'FIELD REPAIR · TAP 3×', x, y - 52, '#ff826e', '8px');
  st.entities.fieldRepair = e;
}
function updateFieldRepair(scene) { const e = scene[NS]?.entities.fieldRepair; if (e) e.text.setText(e.repaired ? 'REPAIRED' : `FIELD REPAIR · ${Math.round(e.progress)}%`); }

function installInvestigation(scene) {
  const st = getState(scene); if (!st.enabled.investigation || st.entities.investigation) return;
  const x = routeX(scene, .32), y = platformY(scene, x) - 58;
  const e = { evidence: 0, packageVerified: false };
  const marker = touch(scene, remember(scene, scene.add.circle(x, y, 18, 0x8df4ff, .18).setDepth(12).setStrokeStyle(2, 0x8df4ff, .72)), () => {
    if (e.evidence >= 3) return cue(scene, 'INSPECTION COMPLETE', '#8df4ff');
    e.evidence += 1; cue(scene, `EVIDENCE ${e.evidence}/3`, '#8df4ff');
  });
  const packageA = touch(scene, remember(scene, scene.add.rectangle(x + 104, y, 34, 26, 0xffd06e, .92).setDepth(12).setStrokeStyle(2, 0xfff1b5, .65)), () => {
    e.packageVerified = true; cue(scene, 'PACKAGE VERIFIED', '#aee37f');
  });
  const packageB = touch(scene, remember(scene, scene.add.rectangle(x + 148, y, 34, 26, 0x5a4a39, .92).setDepth(12).setStrokeStyle(1, 0xb8a58a, .45)), () => cue(scene, 'WRONG PACKAGE', '#ff826e'));
  e.marker = marker; e.packageA = packageA; e.packageB = packageB; e.text = label(scene, 'INVESTIGATION · EVIDENCE 0/3', x + 52, y - 42, '#8df4ff', '8px'); e.hint = label(scene, 'INSPECT / IDENTIFY', x + 106, y + 34, '#dffcff', '7px');
  st.entities.investigation = e;
}
function updateInvestigation(scene) {
  const e = scene[NS]?.entities.investigation; if (!e) return;
  e.text.setText(e.packageVerified ? 'DELIVERY INSPECTED · VERIFIED' : `INVESTIGATION · EVIDENCE ${e.evidence}/3`);
}

function install(scene) {
  const st = getState(scene); if (st.initialized || st.destroyed || !scene.player) return;
  st.initialized = true;
  installStamina(scene); installFieldCrafting(scene); installVehicle(scene); installRescueCarry(scene);
  installLootExtraction(scene); installBlackMarket(scene); installEscort(scene); installFieldRepair(scene); installInvestigation(scene);
}

function update(scene, time, delta) {
  const st = scene[NS];
  if (!st || st.destroyed || !scene.player?.active || scene.respawning || scene.finished) return;
  updateStamina(scene, delta); updateFieldCrafting(scene); updateVehicle(scene); updateRescueCarry(scene);
  updateLootExtraction(scene); updateBlackMarket(scene); updateEscort(scene); updateFieldRepair(scene); updateInvestigation(scene);
}

function destroy(scene) {
  const st = scene[NS]; if (!st || st.destroyed) return; st.destroyed = true;
  scene.player?.setAlpha?.(1);
  for (const resource of st.resources) { try { resource?.destroy?.(); } catch {} }
  scene[NS] = null;
}

export function installGameplayExpansionV5Safe(SceneClass = RunnerScene) {
  if (!SceneClass?.prototype || SceneClass.prototype.__relayGameplayExpansionV5SafeInstalled) return;
  SceneClass.prototype.__relayGameplayExpansionV5SafeInstalled = true;
  const originalCreate = SceneClass.prototype.create;
  SceneClass.prototype.create = function gameplayExpansionV5SafeCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { install(this); } catch (error) { console.warn('[Relay] V5 init isolated:', error); }
    return result;
  };
  const originalUpdate = SceneClass.prototype.update;
  SceneClass.prototype.update = function gameplayExpansionV5SafeUpdate(time, delta, ...args) {
    try { update(this, time, delta); } catch (error) { console.warn('[Relay] V5 update isolated:', error); }
    return originalUpdate.apply(this, [time, delta, ...args]);
  };
  const originalShutdown = SceneClass.prototype.shutdown;
  SceneClass.prototype.shutdown = function gameplayExpansionV5SafeShutdown(...args) {
    try { destroy(this); } catch (error) { console.warn('[Relay] V5 cleanup isolated:', error); }
    return originalShutdown?.apply(this, args);
  };
}

export { FEATURES as gameplayExpansionV5Features, LAYOUT as gameplayExpansionV5Layout };
