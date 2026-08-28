import Phaser from 'phaser';

// Gameplay Expansion V2 SAFE
// New gameplay only; existing RunnerScene movement/combat/state remains authoritative.
const NS = '__relayGameplayExpansionV2Safe';
const LAYOUT = {
  'first-delivery': ['magnetic', 'conveyor', 'rewind'],
  'dead-drop': ['conveyor', 'pressure', 'weight'],
  blackout: ['phase', 'signalIntercept', 'magnetic'],
  pursuit: ['rotation', 'weight', 'signalIntercept'],
  'signal-storm': ['magnetic', 'phase', 'rewind', 'signalIntercept'],
  'corporate-lockdown': ['pressure', 'conveyor', 'weight', 'phase'],
  'final-relay': ['rotation', 'magnetic', 'pressure', 'rewind'],
};
const FEATURES = ['magnetic', 'conveyor', 'rotation', 'rewind', 'phase', 'pressure', 'signalIntercept', 'weight'];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;

function getState(scene) {
  if (scene[NS]) return scene[NS];
  const enabled = Object.fromEntries(FEATURES.map(key => [key, false]));
  for (const key of LAYOUT[scene.mission?.id] || []) enabled[key] = true;
  scene[NS] = { enabled, entities: {}, timers: new Set(), destroyed: false, polarity: 1 };
  return scene[NS];
}
function routeX(scene, fraction) {
  const start = Number(scene.mission?.spawn?.x || 160);
  const goal = Number(scene.mission?.goal?.x || start + 3600);
  return clamp(lerp(start + 220, goal - 280, fraction), start + 120, goal - 100);
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
function label(scene, value, x, y, color = '#dffcff', size = '8px') {
  return scene.add.text(x, y, value, { fontFamily: 'DM Mono', fontSize: size, color, stroke: '#08101c', strokeThickness: 4, letterSpacing: 1 }).setOrigin(.5).setDepth(22).setAlpha(.86);
}
function cue(scene, value, color = '#8df4ff') { try { scene.playerCue?.(value, color); } catch {} }
function makeTexture(scene, key, w, h, fill, line = 0xdffcff) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(fill, 1).fillRoundedRect(0, 0, w, h, Math.min(12, w * .14));
  g.lineStyle(2, line, .8).strokeRoundedRect(1, 1, w - 2, h - 2, Math.min(11, w * .12));
  g.generateTexture(key, w, h); g.destroy();
}
function makeTextures(scene) {
  makeTexture(scene, 'gxv2-magnet', 34, 34, 0x263a52, 0x8df4ff);
  makeTexture(scene, 'gxv2-belt', 180, 24, 0x202d43, 0xaee37f);
  makeTexture(scene, 'gxv2-metal-cargo', 34, 34, 0x443b34, 0xffcf82);
  makeTexture(scene, 'gxv2-phase-wall', 30, 64, 0x302c50, 0xe0a7ff);
  makeTexture(scene, 'gxv2-intercept', 44, 28, 0x25344b, 0xffcf82);
  makeTexture(scene, 'gxv2-valve', 32, 32, 0x253b4a, 0xaee37f);
  makeTexture(scene, 'gxv2-door', 28, 88, 0x202d43, 0x8df4ff);
  makeTexture(scene, 'gxv2-weight', 36, 36, 0x4a3732, 0xffd06e);
  makeTexture(scene, 'gxv2-bridge', 160, 20, 0x27374e, 0xaee37f);
}
function timer(scene, fn, delay) {
  const st = getState(scene);
  const handle = scene.time.delayedCall(delay, () => { st.timers.delete(handle); if (!st.destroyed) fn(); });
  st.timers.add(handle);
}
function onKey(scene, key, handler, name) {
  scene.input.keyboard?.on(`keydown-${key}`, handler);
  getState(scene).entities[name] = handler;
}

function installMagnetic(scene) {
  const st = getState(scene); if (!st.enabled.magnetic || st.entities.magnetic) return;
  const sources = [];
  for (let i = 0; i < 3; i++) {
    const x = routeX(scene, .18 + i * .24);
    const y = platformY(scene, x) - 118;
    const source = scene.physics.add.sprite(x, y, 'gxv2-magnet').setDepth(13).setImmovable(true);
    source.body.allowGravity = false; source.setData('polarity', i % 2 ? -1 : 1);
    const ring = scene.add.circle(x, y, 58, i % 2 ? 0xff826e : 0x8df4ff, .06).setStrokeStyle(2, i % 2 ? 0xff826e : 0x8df4ff, .32).setDepth(12);
    const textNode = label(scene, i % 2 ? 'MAGNET −' : 'MAGNET +', x, y - 30, i % 2 ? '#ff9c91' : '#b9f5ff');
    source.setInteractive(); source.on('pointerdown', () => flipPolarity(scene));
    sources.push({ source, ring, text: textNode });
  }
  const cargo = [];
  for (let i = 0; i < 2; i++) {
    const x = routeX(scene, .34 + i * .28), y = platformY(scene, x) - 26;
    const item = scene.physics.add.sprite(x, y, 'gxv2-metal-cargo').setDepth(10);
    item.body.setAllowGravity(true).setMass(2 + i); item.setData('magneticPolarity', i ? -1 : 1);
    cargo.push(item);
  }
  const status = label(scene, 'POLARITY + · TAP / M', routeX(scene, .32), 74, '#8df4ff', '9px').setScrollFactor(0);
  status.setInteractive(); status.on('pointerdown', () => flipPolarity(scene));
  st.entities.magnetic = { sources, cargo, status };
  const flip = () => flipPolarity(scene);
  onKey(scene, 'M', flip, 'magneticKey');
}
function flipPolarity(scene) {
  const st = getState(scene); if (!st.enabled.magnetic) return;
  st.polarity *= -1;
  st.entities.magnetic?.status?.setText(st.polarity > 0 ? 'POLARITY + · TAP / M' : 'POLARITY − · TAP / M');
  cue(scene, st.polarity > 0 ? 'POLARITY +' : 'POLARITY −', st.polarity > 0 ? '#8df4ff' : '#ff826e');
}
function applyMagnet(scene, body, x, y, targetPolarity) {
  if (!body?.velocity) return;
  const dx = x - body.position.x;
  const dy = y - body.position.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 18 || distance > 250) return;
  const same = targetPolarity === getState(scene).polarity;
  const sign = same ? 1 : -1;
  const force = ((250 - distance) / 250) * 110 * sign;
  body.velocity.x += (dx / distance) * force;
  body.velocity.y += (dy / distance) * force * .72;
}
function updateMagnetic(scene) {
  const entry = scene[NS]?.entities.magnetic; if (!entry || !scene.player?.active) return;
  for (const item of entry.sources) {
    const source = item.source;
    applyMagnet(scene, scene.player.body, source.x, source.y, Number(source.getData('polarity') || 1));
    for (const cargo of entry.cargo) applyMagnet(scene, cargo.body, source.x, source.y, Number(cargo.getData('magneticPolarity') || 1));
    item.ring.setPosition(source.x, source.y); item.text.setPosition(source.x, source.y - 30);
  }
  entry.cargo.forEach(cargo => cargo.setData('lastY', cargo.y));
}

function installConveyor(scene) {
  const st = getState(scene); if (!st.enabled.conveyor || st.entities.conveyor) return;
  const belts = [];
  for (let i = 0; i < 2; i++) {
    const x = routeX(scene, .28 + i * .31), y = platformY(scene, x) - 18;
    const belt = scene.physics.add.sprite(x, y, 'gxv2-belt').setDepth(9).setImmovable(true);
    belt.body.allowGravity = false;
    belt.setData('speed', i % 2 ? -105 : 105);
    belt.setData('min', x - 260); belt.setData('max', x + 420);
    const textNode = label(scene, i % 2 ? 'CONVEYOR ←' : 'CONVEYOR →', x, y - 24, '#aee37f');
    belts.push({ belt, text: textNode });
  }
  st.entities.conveyor = { belts };
}
function updateConveyor(scene) {
  const belts = scene[NS]?.entities.conveyor?.belts || [];
  for (const entry of belts) {
    const belt = entry.belt, data = belt.data.values;
    if (belt.x >= data.max) data.speed = -105;
    if (belt.x <= data.min) data.speed = 105;
    if (scene.player?.active && Phaser.Geom.Intersects.RectangleToRectangle(scene.player.getBounds(), belt.getBounds())) scene.player.x = clamp(scene.player.x + data.speed * (scene.game.loop.delta || 16) / 1000, 30, Number(scene.worldWidth || 5000) - 30);
    for (const cargo of scene[NS]?.entities.magnetic?.cargo || []) if (cargo.active && Phaser.Geom.Intersects.RectangleToRectangle(cargo.getBounds(), belt.getBounds())) cargo.x += data.speed * (scene.game.loop.delta || 16) / 1000;
    entry.text.setPosition(belt.x, belt.y - 24);
  }
}

function installRotation(scene) {
  const st = getState(scene); if (!st.enabled.rotation || st.entities.rotation) return;
  const cx = routeX(scene, .5), cy = platformY(scene, cx) - 150, radius = 112;
  const pivot = scene.add.circle(cx, cy, 10, 0xffd06e, .9).setDepth(18).setInteractive();
  const arms = [0, Math.PI].map(angle => {
    const platform = scene.add.rectangle(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 138, 20, 0x263852).setDepth(9).setImmovable(true);
    scene.physics.add.existing(platform);
    platform.body.allowGravity = false;
    return platform;
  });
  const textNode = label(scene, 'ROTATING STRUCTURE · TAP / T TO LOCK', cx, cy - 154, '#ffd06e', '9px');
  const entry = { pivot, arms, cx, cy, radius, angle: 0, locked: false, text: textNode };
  st.entities.rotation = entry;
  const toggle = () => { entry.locked = !entry.locked; cue(scene, entry.locked ? 'STRUCTURE LOCKED' : 'STRUCTURE ROTATING', '#ffd06e'); };
  pivot.on('pointerdown', toggle); textNode.setInteractive(); textNode.on('pointerdown', toggle); onKey(scene, 'T', toggle, 'rotationKey');
}
function updateRotation(scene) {
  const e = scene[NS]?.entities.rotation; if (!e) return;
  if (!e.locked) e.angle += (scene.game.loop.delta || 16) * .00095;
  for (let i = 0; i < e.arms.length; i++) {
    const a = e.angle + i * Math.PI;
    e.arms[i].x = e.cx + Math.cos(a) * e.radius;
    e.arms[i].y = e.cy + Math.sin(a) * e.radius;
    e.arms[i].rotation = a;
  }
  e.pivot.setPosition(e.cx, e.cy); e.text.setPosition(e.cx, e.cy - 154);
}

function installRewind(scene) {
  const st = getState(scene); if (!st.enabled.rewind || st.entities.rewind) return;
  const entry = { buffer: [], accumulator: 0, active: false, index: 0, label: label(scene, 'TEMPORAL REWIND · R', 92, 106, '#e0a7ff', '9px').setScrollFactor(0) };
  st.entities.rewind = entry;
  entry.label.setInteractive(); entry.label.on('pointerdown', () => triggerRewind(scene));
  const trigger = () => triggerRewind(scene);
  onKey(scene, 'R', trigger, 'rewindKey');
}
function triggerRewind(scene) {
  const e = state(scene).entities.rewind; if (!e || e.active || e.buffer.length < 10 || scene.respawning || scene.finished) return;
  e.active = true; e.index = Math.max(0, e.buffer.length - 30); scene.player.body.moves = false; scene.player.body.velocity.set(0, 0); cue(scene, 'TEMPORAL REWIND', '#e0a7ff');
}
function updateRewind(scene, delta) {
  const e = scene[NS]?.entities.rewind; if (!e || !scene.player?.active) return;
  if (!e.active) {
    e.accumulator += delta;
    if (e.accumulator >= 80) {
      e.accumulator = 0;
      e.buffer.push({ x: scene.player.x, y: scene.player.y, vx: scene.player.body.velocity.x, vy: scene.player.body.velocity.y });
      if (e.buffer.length > 34) e.buffer.shift();
    }
    return;
  }
  e.index = Math.max(0, e.index - 1);
  const sample = e.buffer[e.index];
  if (sample) { scene.player.setPosition(sample.x, sample.y); scene.player.body.velocity.set(sample.vx, sample.vy); }
  if (e.index === 0) { e.active = false; scene.player.body.moves = true; e.buffer.length = 0; }
}

function installPhase(scene) {
  const st = getState(scene); if (!st.enabled.phase || st.entities.phase) return;
  const walls = [];
  for (let i = 0; i < 2; i++) {
    const x = routeX(scene, .36 + i * .24), y = platformY(scene, x) - 50;
    const wall = scene.physics.add.sprite(x, y, 'gxv2-phase-wall').setDepth(12).setImmovable(true);
    wall.body.allowGravity = false;
    const textNode = label(scene, 'PHASE GATE', x, y - 40, '#e0a7ff');
    walls.push({ wall, text: textNode });
  }
  const status = label(scene, 'PHASE SHIFT · P', 205, 106, '#e0a7ff', '9px').setScrollFactor(0);
  st.entities.phase = { walls, active: false, status };
  const toggle = () => togglePhase(scene);
  status.setInteractive(); status.on('pointerdown', toggle); onKey(scene, 'P', toggle, 'phaseKey');
}
function togglePhase(scene) {
  const e = state(scene).entities.phase; if (!e) return;
  e.active = !e.active;
  for (const item of e.walls) { item.wall.body.enable = !e.active; item.wall.setAlpha(e.active ? .22 : 1); }
  e.status.setText(e.active ? 'PHASE SHIFT ACTIVE · P' : 'PHASE SHIFT · P');
  cue(scene, e.active ? 'PHASE SHIFT ACTIVE' : 'PHASE SHIFT OFF', '#e0a7ff');
}
function updatePhase(scene) {
  for (const item of scene[NS]?.entities.phase?.walls || []) item.text.setPosition(item.wall.x, item.wall.y - 40);
}

function installPressure(scene) {
  const st = getState(scene); if (!st.enabled.pressure || st.entities.pressure) return;
  const x = routeX(scene, .59), y = platformY(scene, x) - 115;
  const left = scene.physics.add.sprite(x - 96, y, 'gxv2-valve').setDepth(13).setImmovable(true);
  const right = scene.physics.add.sprite(x + 96, y, 'gxv2-valve').setDepth(13).setImmovable(true);
  left.body.allowGravity = false; right.body.allowGravity = false;
  const door = scene.physics.add.sprite(x, y + 52, 'gxv2-door').setDepth(11).setImmovable(true); door.body.allowGravity = false;
  const status = label(scene, 'PRESSURE 00 / 00', x, y + 98, '#dffcff');
  const heading = label(scene, 'PRESSURE CHAMBER · TAP VALVES', x, y - 44, '#aee37f');
  const entry = { left, right, door, leftP: 0, rightP: 0, status, heading };
  st.entities.pressure = entry;
  const add = side => { entry[side] = clamp(entry[side] + 12, 0, 100); cue(scene, side === 'left' ? 'LEFT PRESSURE +' : 'RIGHT PRESSURE +', '#aee37f'); };
  const leftTap = () => add('leftP'), rightTap = () => add('rightP');
  left.setInteractive(); right.setInteractive(); left.on('pointerdown', leftTap); right.on('pointerdown', rightTap);
  onKey(scene, 'C', leftTap, 'pressureLeftKey'); onKey(scene, 'V', rightTap, 'pressureRightKey');
}
function updatePressure(scene, delta) {
  const e = scene[NS]?.entities.pressure; if (!e) return;
  e.leftP = Math.max(0, e.leftP - delta * .0045); e.rightP = Math.max(0, e.rightP - delta * .0045);
  const balanced = Math.abs(e.leftP - e.rightP) <= 8 && e.leftP >= 60 && e.rightP >= 60;
  e.door.body.enable = !balanced; e.door.setAlpha(balanced ? .18 : 1);
  e.status.setText(`PRESSURE ${String(Math.round(e.leftP)).padStart(2, '0')} / ${String(Math.round(e.rightP)).padStart(2, '0')}${balanced ? ' · BALANCED' : ''}`);
  e.heading.setPosition(e.door.x, e.door.y - 96);
}

function installSignalIntercept(scene) {
  const st = getState(scene); if (!st.enabled.signalIntercept || st.entities.signalIntercept) return;
  const x = routeX(scene, .61), y = platformY(scene, x) - 160;
  const drone = scene.physics.add.sprite(x, y, 'gxv2-intercept').setDepth(14).setImmovable(true); drone.body.allowGravity = false;
  const textNode = label(scene, 'SIGNAL TARGET · INTERCEPT', x, y - 28, '#ffcf82');
  st.entities.signalIntercept = { drone, text: textNode, phase: Math.random() * Math.PI * 2, secured: false };
  scene.physics.add.overlap(scene.player, drone, () => {
    const e = state(scene).entities.signalIntercept; if (!e || e.secured) return;
    e.secured = true; e.drone.disableBody(true, true); e.text.setText('SIGNAL INTERCEPTED'); cue(scene, 'SIGNAL INTERCEPTED', '#ffcf82'); scene.game.events.emit('signal-intercepted', { missionId: scene.mission?.id });
  });
}
function updateSignalIntercept(scene, time) {
  const e = scene[NS]?.entities.signalIntercept; if (!e?.drone?.active) return;
  const a = routeX(scene, .56), b = routeX(scene, .76), t = (Math.sin(time / 1000 + e.phase) + 1) / 2;
  e.drone.x = lerp(a, b, t); e.drone.y = platformY(scene, e.drone.x) - 160 + Math.sin(time / 270) * 9; e.text.setPosition(e.drone.x, e.drone.y - 28);
}

function installWeight(scene) {
  const st = getState(scene); if (!st.enabled.weight || st.entities.weight) return;
  const x = routeX(scene, .52), y = platformY(scene, x) - 70;
  const plates = [x - 82, x + 82].map((px, i) => {
    const plate = scene.physics.add.sprite(px, y + 30, 'gxv2-belt').setDisplaySize(72, 12).setDepth(8).setImmovable(true);
    plate.body.allowGravity = false; plate.setData('required', i ? 6 : 10); return plate;
  });
  const crates = [10, 6, 4].map((weight, i) => {
    const crate = scene.physics.add.sprite(x - 95 + i * 90, y - 4, 'gxv2-weight').setDepth(10);
    crate.body.setAllowGravity(true).setMass(weight); crate.setData('weightValue', weight); return crate;
  });
  const bridge = scene.physics.add.sprite(x, y - 60, 'gxv2-bridge').setDepth(7).setImmovable(true); bridge.body.allowGravity = false;
  const textNode = label(scene, 'WEIGHT BALANCE · MOVE THE LOAD', x, y - 92, '#ffcf82');
  st.entities.weight = { plates, crates, bridge, text: textNode, open: false };
}
function updateWeight(scene) {
  const e = scene[NS]?.entities.weight; if (!e) return;
  const totals = e.plates.map(plate => e.crates.reduce((sum, crate) => {
    return sum + (Phaser.Geom.Intersects.RectangleToRectangle(plate.getBounds(), crate.getBounds()) ? Number(crate.getData('weightValue') || 0) : 0);
  }, 0));
  const open = totals[0] >= 10 && totals[1] >= 6;
  e.bridge.body.enable = !open; e.bridge.setAlpha(open ? .18 : 1); e.open = open; e.text.setPosition(e.bridge.x, e.bridge.y - 50);
}

function install(scene) {
  const st = getState(scene); if (st.initialized || st.destroyed) return;
  st.initialized = true; makeTextures(scene);
  installMagnetic(scene); installConveyor(scene); installRotation(scene); installRewind(scene); installPhase(scene); installPressure(scene); installSignalIntercept(scene); installWeight(scene);
}
function update(scene, time, delta) {
  const st = scene[NS]; if (!st || st.destroyed || !scene.player?.active) return;
  updateMagnetic(scene); updateConveyor(scene); updateRotation(scene); updateRewind(scene, delta); updatePhase(scene); updatePressure(scene, delta); updateSignalIntercept(scene, time); updateWeight(scene);
}
function destroy(scene) {
  const st = scene[NS]; if (!st || st.destroyed) return; st.destroyed = true;
  for (const handle of st.timers) handle.remove?.(); st.timers.clear();
  const keyMap = [['M', 'magneticKey'], ['T', 'rotationKey'], ['R', 'rewindKey'], ['P', 'phaseKey'], ['C', 'pressureLeftKey'], ['V', 'pressureRightKey']];
  for (const [key, name] of keyMap) { const fn = st.entities[name]; if (fn) scene.input.keyboard?.off(`keydown-${key}`, fn); }
  if (st.entities.rewind) scene.player?.body && (scene.player.body.moves = true);
}
export function installGameplayExpansionV2Safe(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__relayGameplayExpansionV2SafeInstalled) return;
  RunnerScene.prototype.__relayGameplayExpansionV2SafeInstalled = true;
  const create = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function gameplayExpansionV2SafeCreate(...args) {
    const result = create.apply(this, args);
    try { if (this.mission) install(this); } catch (error) { console.warn('[Relay] V2 gameplay isolated:', error); }
    return result;
  };
  const updateOriginal = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function gameplayExpansionV2SafeUpdate(time, delta, ...args) {
    const result = updateOriginal.apply(this, [time, delta, ...args]);
    try { update(this, time, delta); } catch (error) { console.warn('[Relay] V2 gameplay update isolated:', error); }
    return result;
  };
  const shutdown = RunnerScene.prototype.shutdown;
  RunnerScene.prototype.shutdown = function gameplayExpansionV2SafeShutdown(...args) {
    try { destroy(this); } catch (error) { console.warn('[Relay] V2 gameplay cleanup isolated:', error); }
    return shutdown?.apply(this, args);
  };
}
