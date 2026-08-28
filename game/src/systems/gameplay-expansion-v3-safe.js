import Phaser from 'phaser';

// Gameplay Expansion V3 SAFE
// Seven new gameplay verbs. No existing movement/combat/progression owner is replaced.
const NS = '__relayGameplayExpansionV3Safe';
const FEATURES = ['bodySwap', 'clonePosition', 'massTransfer', 'phaseSplit', 'objectFusion', 'scaleShift', 'ruleInjection'];
const LAYOUT = {
  'first-delivery': ['bodySwap', 'clonePosition'],
  'dead-drop': ['massTransfer', 'objectFusion'],
  blackout: ['phaseSplit', 'ruleInjection'],
  pursuit: ['bodySwap', 'scaleShift'],
  'signal-storm': ['clonePosition', 'phaseSplit', 'massTransfer'],
  'corporate-lockdown': ['ruleInjection', 'objectFusion', 'scaleShift'],
  'final-relay': ['bodySwap', 'clonePosition', 'phaseSplit', 'ruleInjection'],
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;

function state(scene) {
  if (scene[NS]) return scene[NS];
  const enabled = Object.fromEntries(FEATURES.map((key) => [key, false]));
  for (const key of LAYOUT[scene.mission?.id] || []) enabled[key] = true;
  scene[NS] = { enabled, resources: new Set(), bindings: [], entities: {}, destroyed: false };
  return scene[NS];
}
function routeX(scene, fraction) {
  const start = Number(scene.mission?.spawn?.x || 160);
  const goal = Number(scene.mission?.goal?.x || start + 3600);
  return clamp(lerp(start + 190, goal - 270, fraction), start + 120, goal - 100);
}
function platformY(scene, x, fallback = 540) {
  const platforms = Array.isArray(scene.mission?.platforms) ? scene.mission.platforms : [];
  let best = null;
  for (const [px, py, width] of platforms) {
    if (![px, py, width].every(Number.isFinite)) continue;
    const distance = Math.abs(px + width / 2 - x);
    if (!best || distance < best.distance) best = { y: py, distance };
  }
  return best?.y ?? fallback;
}
function remember(scene, object) { if (object) state(scene).resources.add(object); return object; }
function label(scene, value, x, y, color = '#dffcff', size = '8px') {
  return remember(scene, scene.add.text(x, y, value, { fontFamily: 'DM Mono', fontSize: size, color, stroke: '#08101c', strokeThickness: 4, letterSpacing: 1 }).setOrigin(0.5).setDepth(30).setAlpha(0.92));
}
function button(scene, x, y, value, fn, color = '#8df4ff') {
  const node = label(scene, value, x, y, color, '9px');
  node.setInteractive({ useHandCursor: false });
  node.on('pointerdown', fn);
  return node;
}
function bindKey(scene, code, fn) {
  const keyName = `keydown-${code}`;
  scene.input.keyboard?.on(keyName, fn);
  state(scene).bindings.push([keyName, fn]);
}
function makeTexture(scene, key, w, h, fill, line = 0xdffcff) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(fill, 1).fillRoundedRect(0, 0, w, h, Math.min(12, w * 0.18));
  g.lineStyle(2, line, 0.85).strokeRoundedRect(1, 1, w - 2, h - 2, Math.min(11, w * 0.15));
  g.generateTexture(key, w, h);
  g.destroy();
}
function makeTextures(scene) {
  makeTexture(scene, 'gxv3-host', 34, 54, 0x263b58, 0xffd06e);
  makeTexture(scene, 'gxv3-clone', 28, 48, 0x332e54, 0xe0a7ff);
  makeTexture(scene, 'gxv3-anchor', 42, 42, 0x3d2f40, 0xff826e);
  makeTexture(scene, 'gxv3-phase-echo', 30, 50, 0x29364b, 0x8df4ff);
  makeTexture(scene, 'gxv3-fuse-a', 28, 28, 0x47352e, 0xffcf82);
  makeTexture(scene, 'gxv3-fuse-b', 28, 28, 0x2b3a49, 0xaee37f);
  makeTexture(scene, 'gxv3-fused', 50, 50, 0x39414a, 0xffd06e);
  makeTexture(scene, 'gxv3-rule', 40, 40, 0x28384a, 0xb9f5ff);
}
function cue(scene, value, color = '#8df4ff') { try { scene.playerCue?.(value, color); } catch {} }

function installBodySwap(scene) {
  const st = state(scene); if (!st.enabled.bodySwap || st.entities.bodySwap || !scene.player?.body) return;
  const player = scene.player;
  const base = {
    scaleX: player.scaleX, scaleY: player.scaleY,
    width: player.body.width, height: player.body.height,
    offsetX: player.body.offset.x, offsetY: player.body.offset.y,
    mass: player.body.mass,
  };
  const host = remember(scene, scene.physics.add.sprite(player.x + 52, player.y, 'gxv3-host').setDepth(14).setVisible(false).setAlpha(0.22));
  host.body.allowGravity = false; host.body.immovable = true;
  const badge = label(scene, 'BODY SWAP · B', 108, 72, '#ffd06e', '9px').setScrollFactor(0);
  const stateObj = { active: false, base, host, badge };
  st.entities.bodySwap = stateObj;
  const toggle = () => {
    stateObj.active = !stateObj.active;
    if (stateObj.active) {
      player.setScale(base.scaleX * 0.92, base.scaleY);
      player.body.setSize(base.width * 0.82, base.height * 1.10, true);
      player.body.setMass(Math.max(0.5, base.mass * 1.6));
      host.setPosition(player.x, player.y).setVisible(true).setAlpha(0.28);
      player.setTint(0xffd06e);
      stateObj.badge.setText('HOST BODY · B');
      cue(scene, 'BODY SWAP — HOST BODY', '#ffd06e');
    } else {
      player.setScale(base.scaleX, base.scaleY);
      player.body.setSize(base.width, base.height, true);
      player.body.setOffset(base.offsetX, base.offsetY);
      player.body.setMass(base.mass || 1);
      player.clearTint();
      host.setVisible(false);
      stateObj.badge.setText('BODY SWAP · B');
      cue(scene, 'BASE BODY RESTORED', '#8df4ff');
    }
  };
  stateObj.toggle = toggle;
  remember(scene, button(scene, 108, 94, 'SWAP BODY', toggle, '#ffd06e'));
  bindKey(scene, 'B', toggle);
}
function updateBodySwap(scene) {
  const e = scene[NS]?.entities.bodySwap;
  if (e?.active && scene.player?.active) e.host.setPosition(scene.player.x - 12, scene.player.y).setVisible(true);
}

function installClonePosition(scene) {
  const st = state(scene); if (!st.enabled.clonePosition || st.entities.clonePosition || !scene.player) return;
  const x1 = routeX(scene, 0.35), x2 = routeX(scene, 0.47), y = Math.min(platformY(scene, x1), platformY(scene, x2)) - 18;
  const playerPlate = remember(scene, scene.add.rectangle(x1, y, 92, 12, 0x203b3e, 0.95).setDepth(8).setStrokeStyle(2, 0xaee37f, 0.65));
  const clonePlate = remember(scene, scene.add.rectangle(x2, y, 92, 12, 0x2b2542, 0.95).setDepth(8).setStrokeStyle(2, 0xe0a7ff, 0.65));
  const clone = remember(scene, scene.physics.add.sprite(scene.player.x, scene.player.y, 'gxv3-clone').setDepth(12).setVisible(false).setAlpha(0.72));
  clone.body.allowGravity = false; clone.body.immovable = true;
  const gate = remember(scene, scene.add.rectangle(routeX(scene, 0.53), y - 72, 28, 130, 0x232f40, 0.95).setDepth(10).setStrokeStyle(2, 0x8df4ff, 0.6));
  const badge = label(scene, 'CLONE POSITION · C', x1, 108, '#e0a7ff', '9px').setScrollFactor(0);
  const stateObj = { clone, playerPlate, clonePlate, gate, active: false, expiresAt: 0, badge };
  st.entities.clonePosition = stateObj;
  const deploy = () => {
    if (stateObj.active) { stateObj.active = false; clone.setVisible(false); cue(scene, 'CLONE RECALLED', '#e0a7ff'); return; }
    stateObj.active = true; stateObj.expiresAt = performance.now() + 7000;
    clone.setPosition(scene.player.x, scene.player.y).setVisible(true);
    cue(scene, 'CLONE DEPLOYED', '#e0a7ff');
  };
  stateObj.deploy = deploy;
  remember(scene, button(scene, x1, 130, 'DEPLOY CLONE', deploy, '#e0a7ff'));
  bindKey(scene, 'C', deploy);
}
function updateClonePosition(scene) {
  const e = scene[NS]?.entities.clonePosition; if (!e || !scene.player?.active) return;
  if (e.active && performance.now() >= e.expiresAt) { e.active = false; e.clone.setVisible(false); }
  const onPlayerPlate = Math.abs(scene.player.x - e.playerPlate.x) < 42 && Math.abs(scene.player.y - e.playerPlate.y) < 42;
  const onClonePlate = e.active && Math.abs(e.clone.x - e.clonePlate.x) < 42 && Math.abs(e.clone.y - e.clonePlate.y) < 42;
  const open = onPlayerPlate && onClonePlate;
  e.gate.setAlpha(open ? 0.18 : 0.9);
  e.gate.setStrokeStyle(2, open ? 0xaee37f : 0x8df4ff, 0.65);
  e.badge.setText(open ? 'CLONE SYNC · PATH OPEN' : 'CLONE POSITION · C');
}

function installMassTransfer(scene) {
  const st = state(scene); if (!st.enabled.massTransfer || st.entities.massTransfer || !scene.player?.body) return;
  const x = routeX(scene, 0.53), y = platformY(scene, x) - 34;
  const anchor = remember(scene, scene.physics.add.sprite(x, y, 'gxv3-anchor').setDepth(12).setImmovable(true));
  anchor.body.allowGravity = false; anchor.body.setMass(5.5);
  const beam = remember(scene, scene.add.line(0, 0, scene.player.x, scene.player.y, anchor.x, anchor.y, 0xff826e, 0.32).setLineWidth(2).setDepth(7));
  const baseMass = scene.player.body.mass || 1;
  const badge = label(scene, 'MASS TRANSFER · M', x, y - 40, '#ff9c91', '9px');
  const stateObj = { active: false, anchor, beam, baseMass, badge };
  st.entities.massTransfer = stateObj;
  const toggle = () => {
    stateObj.active = !stateObj.active;
    scene.player.body.setMass(stateObj.active ? Math.max(0.35, baseMass * 0.35) : baseMass);
    anchor.body.setMass(stateObj.active ? 5.5 : 1.0);
    anchor.setTint(stateObj.active ? 0xff826e : 0xffffff);
    stateObj.badge.setText(stateObj.active ? 'MASS TRANSFERRED · M' : 'MASS TRANSFER · M');
    cue(scene, stateObj.active ? 'MASS TRANSFERRED' : 'MASS RETURNED', stateObj.active ? '#ff826e' : '#8df4ff');
  };
  stateObj.toggle = toggle;
  remember(scene, button(scene, x, y + 58, 'TRANSFER MASS', toggle, '#ff826e'));
  bindKey(scene, 'M', toggle);
}
function updateMassTransfer(scene) {
  const e = scene[NS]?.entities.massTransfer; if (!e || !scene.player?.active) return;
  e.beam.setTo(scene.player.x, scene.player.y, e.anchor.x, e.anchor.y);
  if (e.active && Phaser.Math.Distance.Between(scene.player.x, scene.player.y, e.anchor.x, e.anchor.y) > 360) e.toggle();
}

function installPhaseSplit(scene) {
  const st = state(scene); if (!st.enabled.phaseSplit || st.entities.phaseSplit || !scene.player) return;
  const echo = remember(scene, scene.physics.add.sprite(scene.player.x - 150, scene.player.y, 'gxv3-phase-echo').setDepth(11).setVisible(false).setAlpha(0.55));
  echo.body.allowGravity = false; echo.body.immovable = true;
  const phaseNode = label(scene, 'PHASE SPLIT · V', routeX(scene, 0.44), 142, '#8df4ff', '9px').setScrollFactor(0);
  const beacon = remember(scene, scene.add.circle(routeX(scene, 0.48), platformY(scene, routeX(scene, 0.48)) - 42, 48, 0x2d4053, 0.13).setStrokeStyle(2, 0x8df4ff, 0.55).setDepth(8));
  const stateObj = { active: false, echo, beacon, badge: phaseNode, lastX: scene.player.x };
  st.entities.phaseSplit = stateObj;
  const toggle = () => {
    stateObj.active = !stateObj.active;
    echo.setVisible(stateObj.active);
    beacon.setStrokeStyle(2, stateObj.active ? 0xe0a7ff : 0x8df4ff, 0.7);
    cue(scene, stateObj.active ? 'PHASE SPLIT ACTIVE' : 'PHASE SPLIT OFF', stateObj.active ? '#e0a7ff' : '#8df4ff');
  };
  stateObj.toggle = toggle;
  remember(scene, button(scene, routeX(scene, 0.44), 164, 'SPLIT PHASE', toggle, '#8df4ff'));
  bindKey(scene, 'V', toggle);
}
function updatePhaseSplit(scene) {
  const e = scene[NS]?.entities.phaseSplit; if (!e || !scene.player?.active) return;
  const dx = scene.player.x - e.lastX;
  if (e.active) { e.echo.x += -dx * 0.8; e.echo.y = scene.player.y + Math.sin(performance.now() / 150) * 5; }
  e.lastX = scene.player.x;
  e.badge.setText(e.active ? 'PHASE SPLIT · ECHO LIVE' : 'PHASE SPLIT · V');
}

function installObjectFusion(scene) {
  const st = state(scene); if (!st.enabled.objectFusion || st.entities.objectFusion) return;
  const x = routeX(scene, 0.35), y = platformY(scene, x) - 30;
  const a = remember(scene, scene.physics.add.sprite(x - 34, y, 'gxv3-fuse-a').setDepth(11));
  const b = remember(scene, scene.physics.add.sprite(x + 34, y, 'gxv3-fuse-b').setDepth(11));
  a.body.allowGravity = b.body.allowGravity = true; a.body.setMass(1); b.body.setMass(1);
  const fused = remember(scene, scene.physics.add.sprite(x, y, 'gxv3-fused').setDepth(11).setVisible(false));
  fused.body.allowGravity = true; fused.body.setMass(4);
  const badge = label(scene, 'OBJECT FUSION · F', x, y - 62, '#ffd06e', '9px');
  const stateObj = { a, b, fused, active: false, badge };
  st.entities.objectFusion = stateObj;
  const fuse = () => {
    if (stateObj.active) return;
    stateObj.active = true; a.disableBody(true, true); b.disableBody(true, true); fused.setPosition(x, y).setVisible(true);
    cue(scene, 'OBJECTS FUSED', '#ffd06e');
  };
  stateObj.fuse = fuse;
  a.setInteractive(); b.setInteractive(); a.on('pointerdown', fuse); b.on('pointerdown', fuse);
  remember(scene, button(scene, x, y + 60, 'FUSE OBJECTS', fuse, '#ffd06e'));
  bindKey(scene, 'F', fuse);
}
function updateObjectFusion(scene) {
  const e = scene[NS]?.entities.objectFusion; if (!e) return;
  e.badge.setText(e.active ? 'FUSED OBJECT · F' : 'OBJECT FUSION · F');
}

function installScaleShift(scene) {
  const st = state(scene); if (!st.enabled.scaleShift || st.entities.scaleShift || !scene.player?.body) return;
  const p = scene.player;
  const base = { scaleX: p.scaleX, scaleY: p.scaleY, width: p.body.width, height: p.body.height };
  const badge = label(scene, 'SCALE SHIFT · S', routeX(scene, 0.48), 178, '#aee37f', '9px').setScrollFactor(0);
  const stateObj = { small: false, base, badge };
  st.entities.scaleShift = stateObj;
  const toggle = () => {
    stateObj.small = !stateObj.small;
    const factor = stateObj.small ? 0.62 : 1;
    p.setScale(base.scaleX * factor, base.scaleY * factor);
    p.body.setSize(base.width * factor, base.height * factor, true);
    stateObj.badge.setText(stateObj.small ? 'SCALE SHIFT · SMALL · S' : 'SCALE SHIFT · NORMAL · S');
    cue(scene, stateObj.small ? 'SMALL FORM' : 'NORMAL FORM', '#aee37f');
  };
  stateObj.toggle = toggle;
  remember(scene, button(scene, routeX(scene, 0.48), 200, 'SHIFT SCALE', toggle, '#aee37f'));
  bindKey(scene, 'S', toggle);
}

function installRuleInjection(scene) {
  const st = state(scene); if (!st.enabled.ruleInjection || st.entities.ruleInjection) return;
  const x = routeX(scene, 0.58), y = platformY(scene, x) - 38;
  const target = remember(scene, scene.physics.add.sprite(x, y, 'gxv3-rule').setDepth(12).setImmovable(true));
  target.body.allowGravity = false;
  const modes = [
    { id: 'ANCHOR', tint: 0x8df4ff, immovable: true, bounce: 0 },
    { id: 'BOUNCE', tint: 0xffd06e, immovable: false, bounce: 1.15 },
    { id: 'DRIFT', tint: 0xaee37f, immovable: false, bounce: 0.15 },
  ];
  const badge = label(scene, 'RULE INJECTION · Q', x, y - 48, '#b9f5ff', '9px');
  const stateObj = { index: 0, target, modes, badge };
  st.entities.ruleInjection = stateObj;
  const apply = () => {
    stateObj.index = (stateObj.index + 1) % modes.length;
    const mode = modes[stateObj.index];
    target.body.setImmovable(mode.immovable); target.body.setBounce(mode.bounce); target.setTint(mode.tint);
    if (mode.id === 'DRIFT') target.body.setVelocityX(120); else target.body.setVelocity(0, 0);
    stateObj.badge.setText(`RULE: ${mode.id} · Q`);
    cue(scene, `RULE ${mode.id}`, '#b9f5ff');
  };
  stateObj.apply = apply;
  target.setInteractive(); target.on('pointerdown', apply);
  remember(scene, button(scene, x, y + 66, 'INJECT RULE', apply, '#b9f5ff'));
  bindKey(scene, 'Q', apply);
}
function updateRuleInjection(scene) {
  const e = scene[NS]?.entities.ruleInjection; if (!e) return;
  if (e.modes[e.index].id === 'DRIFT' && Math.abs(e.target.body.velocity.x) < 5) e.target.body.setVelocityX(120);
}

function install(scene) {
  const st = state(scene); if (st.destroyed || !scene.player) return;
  makeTextures(scene);
  installBodySwap(scene); installClonePosition(scene); installMassTransfer(scene); installPhaseSplit(scene); installObjectFusion(scene); installScaleShift(scene); installRuleInjection(scene);
}

export function installGameplayExpansionV3Safe(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__gameplayExpansionV3SafeInstalled) return;
  RunnerScene.prototype.__gameplayExpansionV3SafeInstalled = true;
  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    try { install(this); } catch (error) { console.warn('[Gameplay V3] init failed safely', error); }
    const update = (_time, _delta = 16) => {
      const st = this[NS]; if (!st || st.destroyed || !this.player?.active) return;
      try { updateBodySwap(this); updateClonePosition(this); updateMassTransfer(this); updatePhaseSplit(this); updateObjectFusion(this); updateRuleInjection(this); } catch (error) { console.warn('[Gameplay V3] update failed safely', error); }
    };
    this.events?.on?.('update', update);
    this.events?.once?.('shutdown', () => {
      const st = this[NS]; if (!st) return;
      st.destroyed = true;
      for (const [eventName, fn] of st.bindings) this.input.keyboard?.off?.(eventName, fn);
      for (const resource of st.resources) { try { resource?.destroy?.(); } catch {} }
      this.events?.off?.('update', update);
      this[NS] = null;
    });
    return result;
  };
}
