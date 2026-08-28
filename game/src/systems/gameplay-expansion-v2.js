import Phaser from 'phaser';

// Gameplay Expansion V2
// Eight new mechanics, isolated from the existing movement/combat/progression owners.
const NS = '__relayGameplayExpansionV2';
const LAYOUT = {
  'first-delivery': ['magnetic', 'conveyor', 'rewind'],
  'dead-drop': ['conveyor', 'pressure', 'weight'],
  blackout: ['phase', 'signalIntercept', 'magnetic'],
  pursuit: ['rotation', 'weight', 'signalIntercept'],
  'signal-storm': ['magnetic', 'phase', 'rewind', 'signalIntercept'],
  'corporate-lockdown': ['pressure', 'conveyor', 'weight', 'phase'],
  'final-relay': ['rotation', 'magnetic', 'pressure', 'rewind'],
};
const KEYS = ['magnetic', 'conveyor', 'rotation', 'rewind', 'phase', 'pressure', 'signalIntercept', 'weight'];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;

function state(scene) {
  if (scene[NS]) return scene[NS];
  const features = Object.fromEntries(KEYS.map(k => [k, false]));
  for (const key of LAYOUT[scene.mission?.id] || []) features[key] = true;
  scene[NS] = { features, entities: {}, timers: new Set(), destroyed: false, polarity: 1, rewind: null };
  return scene[NS];
}
function routeX(scene, fraction) {
  const a = Number(scene.mission?.spawn?.x || 160), b = Number(scene.mission?.goal?.x || a + 3600);
  return clamp(lerp(a + 260, b - 300, fraction), a + 150, b - 120);
}
function platformY(scene, x, fallback = 540) {
  const ps = Array.isArray(scene.mission?.platforms) ? scene.mission.platforms : [];
  let best = null;
  for (const [px, py, width] of ps) {
    if (![px, py, width].every(Number.isFinite)) continue;
    const score = Math.abs(px + width / 2 - x);
    if (!best || score < best.score) best = { y: py, score };
  }
  return best?.y ?? fallback;
}
function text(scene, value, x, y, color = '#dffcff', size = '8px') {
  return scene.add.text(x, y, value, { fontFamily: 'DM Mono', fontSize: size, color, stroke: '#08101c', strokeThickness: 4, letterSpacing: 1 }).setOrigin(.5).setDepth(20).setAlpha(.86);
}
function cue(scene, value, color = '#8df4ff') { try { scene.playerCue?.(value, color); } catch {} }
function texture(scene, key, w, h, fill, line = 0xdffcff) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(fill, 1).fillRoundedRect(0, 0, w, h, Math.min(12, w * .15));
  g.lineStyle(2, line, .8).strokeRoundedRect(1, 1, w - 2, h - 2, Math.min(11, w * .14));
  g.generateTexture(key, w, h); g.destroy();
}
function makeTextures(scene) {
  texture(scene, 'gx2-magnet', 32, 32, 0x273950, 0x8df4ff);
  texture(scene, 'gx2-belt', 180, 24, 0x202d43, 0xaee37f);
  texture(scene, 'gx2-phase', 28, 60, 0x2c3150, 0xe0a7ff);
  texture(scene, 'gx2-drone', 42, 26, 0x24364f, 0xffcf82);
  texture(scene, 'gx2-crate', 34, 34, 0x44363b, 0xffd06e);
  texture(scene, 'gx2-valve', 30, 30, 0x24374a, 0xaee37f);
  texture(scene, 'gx2-door', 26, 86, 0x202d43, 0x8df4ff);
  texture(scene, 'gx2-plate', 72, 12, 0x2c3140, 0xff826e);
}
function timer(scene, fn, delay) {
  const st = state(scene);
  const id = scene.time.delayedCall(delay, () => { st.timers.delete(id); if (!st.destroyed) fn(); });
  st.timers.add(id);
}

function installMagnetic(scene) {
  const st = state(scene); if (!st.features.magnetic || st.entities.magnetic) return;
  const nodes = [];
  for (let i = 0; i < 3; i++) {
    const x = routeX(scene, .18 + i * .25), y = platformY(scene, x) - 110;
    const node = scene.physics.add.sprite(x, y, 'gx2-magnet').setDepth(12).setImmovable(true);
    node.body.allowGravity = false; node.setData('polarity', i % 2 ? -1 : 1);
    const ring = scene.add.circle(x, y, 54, i % 2 ? 0xff826e : 0x8df4ff, .06).setStrokeStyle(2, i % 2 ? 0xff826e : 0x8df4ff, .32).setDepth(11);
    const label = text(scene, i % 2 ? 'MAGNET −' : 'MAGNET +', x, y - 28, i % 2 ? '#ff9c91' : '#b9f5ff');
    nodes.push({ node, ring, label });
    node.on('pointerdown', () => togglePolarity(scene));
    node.setInteractive();
  }
  st.entities.magnetic = { nodes, status: text(scene, 'POLARITY +  ·  TAP / M TO FLIP', routeX(scene, .32), 76, '#8df4ff', '9px').setScrollFactor(0) };
  const key = () => togglePolarity(scene);
  scene.input.keyboard?.on('keydown-M', key); st.entities.magneticKey = key;
}
function togglePolarity(scene) {
  const st = state(scene); if (!st.features.magnetic) return;
  st.polarity *= -1; st.entities.magnetic?.status?.setText(st.polarity > 0 ? 'POLARITY +  ·  TAP / M TO FLIP' : 'POLARITY −  ·  TAP / M TO FLIP'); cue(scene, st.polarity > 0 ? 'POLARITY +' : 'POLARITY −', st.polarity > 0 ? '#8df4ff' : '#ff826e');
}
function updateMagnetic(scene) {
  const st = scene[NS], entry = st?.entities.magnetic; if (!entry || !scene.player?.active) return;
  for (const item of entry.nodes) {
    const node = item.node, dist = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, node.x, node.y);
    if (dist < 230 && dist > 12) {
      const nodePolarity = Number(node.getData('polarity') || 1);
      const sign = nodePolarity === st.polarity ? 1 : -1;
      const force = (230 - dist) / 230 * 95 * sign;
      scene.player.body.velocity.x += Math.cos(Math.atan2(node.y - scene.player.y, node.x - scene.player.x)) * force;
      scene.player.body.velocity.y += Math.sin(Math.atan2(node.y - scene.player.y, node.x - scene.player.x)) * force * .7;
    }
    item.label?.setPosition(node.x, node.y - 28); item.ring?.setPosition(node.x, node.y);
  }
}
function installConveyor(scene) {
  const st = state(scene); if (!st.features.conveyor || st.entities.conveyor) return;
  const belts = [];
  for (let i = 0; i < 2; i++) {
    const x = routeX(scene, .28 + i * .32), y = platformY(scene, x) - 18;
    const belt = scene.physics.add.sprite(x, y, 'gx2-belt').setDepth(9).setImmovable(true);
    belt.body.allowGravity = false; belt.body.setVelocityX(i % 2 ? -90 : 90);
    belt.setData({ min: x - 280, max: x + 420, speed: i % 2 ? -90 : 90 });
    belts.push({ belt, label: text(scene, i % 2 ? 'CONVEYOR ←' : 'CONVEYOR →', x, y - 25, '#aee37f') });
  }
  st.entities.conveyor = { belts };
}
function updateConveyor(scene) {
  for (const item of scene[NS]?.entities.conveyor?.belts || []) {
    const belt = item.belt, data = belt.data.values;
    if (belt.x >= data.max) data.speed = -90; if (belt.x <= data.min) data.speed = 90;
    belt.body.setVelocityX(data.speed); item.label?.setPosition(belt.x, belt.y - 25);
    if (scene.player?.active && Phaser.Geom.Intersects.RectangleToRectangle(scene.player.getBounds(), belt.getBounds())) scene.player.x = clamp(scene.player.x + data.speed / 60, 30, Number(scene.worldWidth || 5000) - 30);
  }
}

function installRotation(scene) {
  const st = state(scene); if (!st.features.rotation || st.entities.rotation) return;
  const cx = routeX(scene, .48), cy = platformY(scene, cx) - 145, radius = 115;
  const pivot = scene.add.circle(cx, cy, 10, 0xffd06e, .9).setDepth(15);
  const arms = [0, Math.PI].map(angle => {
    const p = scene.physics.add.rectangle(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 132, 20, 0x263852).setDepth(9).setImmovable(true);
    scene.physics.add.existing(p); p.body.setAllowGravity(false); return p;
  });
  const label = text(scene, 'ROTATING STRUCTURE · LOCK WITH T', cx, cy - 155, '#ffd06e');
  st.entities.rotation = { pivot, arms, cx, cy, radius, angle: 0, speed: .008, locked: false, label };
  const lock = () => { const entry = state(scene).entities.rotation; if (!entry) return; entry.locked = !entry.locked; cue(scene, entry.locked ? 'STRUCTURE LOCKED' : 'STRUCTURE ROTATING', '#ffd06e'); };
  scene.input.keyboard?.on('keydown-T', lock); st.entities.rotationKey = lock;
}
function updateRotation(scene) {
  const e = scene[NS]?.entities.rotation; if (!e) return;
  if (!e.locked) e.angle += e.speed * (scene.game.loop.delta || 16);
  e.arms.forEach((p, i) => { const a = e.angle + i * Math.PI; p.x = e.cx + Math.cos(a) * e.radius; p.y = e.cy + Math.sin(a) * e.radius; p.rotation = a; });
  e.label?.setPosition(e.cx, e.cy - 155); e.pivot?.setPosition(e.cx, e.cy);
}

function installRewind(scene) {
  const st = state(scene); if (!st.features.rewind || st.entities.rewind) return;
  st.entities.rewind = { buffer: [], acc: 0, duration: 2400, active: false, index: 0, label: text(scene, 'REWIND · R', 76, 106, '#e0a7ff', '9px').setScrollFactor(0), key: null };
  const trigger = () => {
    const e = state(scene).entities.rewind; if (!e || e.active || e.buffer.length < 8 || scene.respawning || scene.finished) return;
    e.active = true; e.index = Math.max(0, e.buffer.length - Math.floor(e.duration / 80)); scene.player.body.moves = false; scene.player.body.velocity.set(0, 0); cue(scene, 'TEMPORAL REWIND', '#e0a7ff');
  };
  scene.input.keyboard?.on('keydown-R', trigger); st.entities.rewind.key = trigger; st.entities.rewind.trigger = trigger;
}
function updateRewind(scene, delta) {
  const e = scene[NS]?.entities.rewind; if (!e || !scene.player?.active) return;
  e.acc += delta;
  if (!e.active && e.acc >= 80) { e.acc = 0; e.buffer.push({ x: scene.player.x, y: scene.player.y, vx: scene.player.body.velocity.x, vy: scene.player.body.velocity.y }); if (e.buffer.length > 52) e.buffer.shift(); return; }
  if (!e.active) return;
  e.index -= 1;
  const sample = e.buffer[clamp(e.index, 0, e.buffer.length - 1)];
  if (sample) { scene.player.x = sample.x; scene.player.y = sample.y; scene.player.body.velocity.set(sample.vx, sample.vy); }
  if (e.index <= 0) { e.active = false; scene.player.body.moves = true; e.buffer.length = 0; }
}

function installPhase(scene) {
  const st = state(scene); if (!st.features.phase || st.entities.phase) return;
  const walls = [];
  for (let i = 0; i < 2; i++) {
    const x = routeX(scene, .37 + i * .24), y = platformY(scene, x) - 55;
    const wall = scene.physics.add.sprite(x, y, 'gx2-phase').setDepth(10).setImmovable(true); wall.body.allowGravity = false;
    const label = text(scene, 'PHASE GATE', x, y - 40, '#e0a7ff'); walls.push({ wall, label });
  }
  st.entities.phase = { walls, active: false, label: text(scene, 'PHASE SHIFT · P', 180, 106, '#e0a7ff', '9px').setScrollFactor(0) };
  const trigger = () => {
    const e = state(scene).entities.phase; if (!e) return; e.active = !e.active; for (const item of e.walls) { item.wall.body.enable = !e.active; item.wall.setAlpha(e.active ? .25 : 1); } cue(scene, e.active ? 'PHASE SHIFT ACTIVE' : 'PHASE SHIFT OFF', '#e0a7ff');
  };
  scene.input.keyboard?.on('keydown-P', trigger); st.entities.phaseKey = trigger; st.entities.phase.trigger = trigger;
}
function updatePhase(scene) { for (const item of scene[NS]?.entities.phase?.walls || []) item.label?.setPosition(item.wall.x, item.wall.y - 40); }

function installPressure(scene) {
  const st = state(scene); if (!st.features.pressure || st.entities.pressure) return;
  const x = routeX(scene, .58), y = platformY(scene, x) - 110;
  const left = scene.physics.add.sprite(x - 92, y, 'gx2-valve').setDepth(12), right = scene.physics.add.sprite(x + 92, y, 'gx2-valve').setDepth(12);
  left.body.allowGravity = false; right.body.allowGravity = false;
  const door = scene.physics.add.sprite(x, y + 52, 'gx2-door').setDepth(11).setImmovable(true); door.body.allowGravity = false;
  const label = text(scene, 'PRESSURE CHAMBER · C LEFT / V RIGHT', x, y - 42, '#aee37f');
  st.entities.pressure = { left, right, door, leftP: 0, rightP: 0, target: 100, label, status: text(scene, 'PRESSURE 00 / 00', x, y + 94, '#dffcff') };
  const adjust = side => {
    const e = state(scene).entities.pressure; if (!e) return; e[side + 'P'] = clamp(e[side + 'P'] + 10, 0, 100); cue(scene, side === 'left' ? 'PRESSURE LEFT +' : 'PRESSURE RIGHT +', '#aee37f');
  };
  const l = () => adjust('left'), r = () => adjust('right');
  scene.input.keyboard?.on('keydown-C', l); scene.input.keyboard?.on('keydown-V', r); st.entities.pressureKeys = { l, r };
  left.setInteractive(); right.setInteractive(); left.on('pointerdown', l); right.on('pointerdown', r);
}
function updatePressure(scene, delta) {
  const e = scene[NS]?.entities.pressure; if (!e) return;
  e.leftP = Math.max(0, e.leftP - delta * .006); e.rightP = Math.max(0, e.rightP - delta * .006);
  const balanced = Math.abs(e.leftP - e.rightP) <= 10 && e.leftP >= 60 && e.rightP >= 60;
  e.door.body.enable = !balanced; e.door.setAlpha(balanced ? .18 : 1); e.status?.setText(`PRESSURE ${String(Math.round(e.leftP)).padStart(2, '0')} / ${String(Math.round(e.rightP)).padStart(2, '0')}${balanced ? ' · BALANCED' : ''}`); e.label?.setPosition(e.door.x, e.door.y - 95);
}

function installSignalIntercept(scene) {
  const st = state(scene); if (!st.features.signalIntercept || st.entities.signalIntercept) return;
  const x = routeX(scene, .61), y = platformY(scene, x) - 160;
  const drone = scene.physics.add.sprite(x, y, 'gx2-drone').setDepth(13); drone.body.allowGravity = false; drone.body.setImmovable(true);
  const label = text(scene, 'MOVING SIGNAL · INTERCEPT', x, y - 28, '#ffcf82');
  st.entities.signalIntercept = { drone, label, phase: Math.random() * Math.PI * 2, secured: false };
  scene.physics.add.overlap(scene.player, drone, () => {
    const e = state(scene).entities.signalIntercept; if (!e || e.secured) return;
    e.secured = true; e.drone.disableBody(true, true); e.label.setText('SIGNAL INTERCEPTED'); cue(scene, 'SIGNAL INTERCEPTED', '#ffcf82'); scene.game.events.emit('signal-intercepted', { missionId: scene.mission?.id });
  });
}
function updateSignalIntercept(scene, time) {
  const e = scene[NS]?.entities.signalIntercept; if (!e?.drone?.active) return;
  const a = routeX(scene, .56), b = routeX(scene, .76), t = (Math.sin(time / 1000 + e.phase) + 1) / 2;
  e.drone.x = lerp(a, b, t); e.drone.y = platformY(scene, e.drone.x) - 160 + Math.sin(time / 280) * 9; e.label?.setPosition(e.drone.x, e.drone.y - 28);
}

function installWeight(scene) {
  const st = state(scene); if (!st.features.weight || st.entities.weight) return;
  const x = routeX(scene, .52), y = platformY(scene, x) - 65;
  const plates = [x - 74, x + 74].map((px, i) => {
    const plate = scene.physics.add.sprite(px, y + 26, 'gx2-plate').setDepth(8).setImmovable(true); plate.body.allowGravity = false; plate.setData('required', i ? 6 : 10); return plate;
  });
  const crates = [8, 4, 6].map((weight, i) => {
    const crate = scene.physics.add.sprite(x - 90 + i * 82, y - 4, 'gx2-crate').setDepth(10); crate.body.setAllowGravity(true).setMass(weight); crate.setData('weight', weight); return crate;
  });
  const bridge = scene.physics.add.sprite(x, y - 54, 'gx2-belt').setScale(.95, .7).setDepth(7).setImmovable(true); bridge.body.allowGravity = false;
  const label = text(scene, 'WEIGHT BALANCE · MOVE THE CRATES', x, y - 82, '#ffcf82');
  st.entities.weight = { plates, crates, bridge, label, lastOpen: false };
}
function updateWeight(scene) {
  const e = scene[NS]?.entities.weight; if (!e) return;
  const totals = e.plates.map(plate => e.crates.reduce((sum, item) => {
    const on = Phaser.Geom.Intersects.RectangleToRectangle(plate.getBounds(), item.getBounds()); return sum + (on ? Number(item.getData('weight') || 0) : 0);
  }, 0));
  const open = totals[0] >= 10 && totals[1] >= 6;
  e.bridge.body.enable = !open; e.bridge.setAlpha(open ? .18 : 1); e.label?.setPosition(e.bridge.x, e.bridge.y - 50);
}

function install(scene) {
  const st = state(scene); if (st.destroyed || st.initialized) return; st.initialized = true; makeTextures(scene);
  installMagnetic(scene); installConveyor(scene); installRotation(scene); installRewind(scene); installPhase(scene); installPressure(scene); installSignalIntercept(scene); installWeight(scene);
}
function update(scene, time, delta) {
  const st = scene[NS]; if (!st || st.destroyed || !scene.player?.active || scene.respawning || scene.finished) return;
  updateMagnetic(scene); updateConveyor(scene); updateRotation(scene); updateRewind(scene, delta); updatePhase(scene); updatePressure(scene, delta); updateSignalIntercept(scene, time); updateWeight(scene);
}
function destroy(scene) {
  const st = scene[NS]; if (!st || st.destroyed) return; st.destroyed = true;
  for (const t of st.timers) t.remove?.(); st.timers.clear();
  const keyboard = scene.input.keyboard;
  if (st.entities.magneticKey) keyboard?.off('keydown-M', st.entities.magneticKey);
  if (st.entities.rotationKey) keyboard?.off('keydown-T', st.entities.rotationKey);
  if (st.entities.rewind?.key) keyboard?.off('keydown-R', st.entities.rewind.key);
  if (st.entities.phaseKey) keyboard?.off('keydown-P', st.entities.phaseKey);
  if (st.entities.pressureKeys) { keyboard?.off('keydown-C', st.entities.pressureKeys.l); keyboard?.off('keydown-V', st.entities.pressureKeys.r); }
}

export function installGameplayExpansionV2(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__relayGameplayExpansionV2Installed) return;
  RunnerScene.prototype.__relayGameplayExpansionV2Installed = true;
  const create = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function gameplayExpansionV2Create(...args) {
    const result = create.apply(this, args);
    try { if (this.mission) install(this); } catch (error) { console.warn('[Relay] gameplay expansion v2 install isolated:', error); }
    return result;
  };
  const updateOriginal = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function gameplayExpansionV2Update(time, delta, ...args) {
    const result = updateOriginal.apply(this, [time, delta, ...args]);
    try { update(this, time, delta); } catch (error) { console.warn('[Relay] gameplay expansion v2 update isolated:', error); }
    return result;
  };
  const shutdown = RunnerScene.prototype.shutdown;
  RunnerScene.prototype.shutdown = function gameplayExpansionV2Shutdown(...args) {
    try { destroy(this); } catch (error) { console.warn('[Relay] gameplay expansion v2 cleanup isolated:', error); }
    return shutdown?.apply(this, args);
  };
}
