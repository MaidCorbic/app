import Phaser from 'phaser';

// Gameplay Expansion V3 SAFE
// Seven new gameplay verbs; existing RunnerScene remains authoritative.
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
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function getState(scene) {
  if (scene[NS]) return scene[NS];
  const enabled = Object.fromEntries(FEATURES.map((k) => [k, false]));
  for (const key of LAYOUT[scene.mission?.id] || []) enabled[key] = true;
  scene[NS] = { enabled, entities: {}, destroyed: false, timers: new Set() };
  return scene[NS];
}

function routeX(scene, fraction) {
  const start = Number(scene.mission?.spawn?.x || 160);
  const goal = Number(scene.mission?.goal?.x || start + 3600);
  return clamp(lerp(start + 180, goal - 280, fraction), start + 120, goal - 100);
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
function makeTexture(scene, key, w, h, fill, line = 0xdffcff) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(fill, 1).fillRoundedRect(0, 0, w, h, Math.min(12, w * 0.18));
  g.lineStyle(2, line, 0.85).strokeRoundedRect(1, 1, w - 2, h - 2, Math.min(11, w * 0.16));
  g.generateTexture(key, w, h); g.destroy();
}
function makeTextures(scene) {
  makeTexture(scene, 'gxv3-host', 34, 54, 0x263b58, 0xffd06e);
  makeTexture(scene, 'gxv3-clone', 28, 48, 0x332e54, 0xe0a7ff);
  makeTexture(scene, 'gxv3-anchor', 42, 42, 0x3d2f40, 0xff826e);
  makeTexture(scene, 'gxv3-phase-echo', 30, 50, 0x29364b, 0x8df4ff);
  makeTexture(scene, 'gxv3-fuse-a', 28, 28, 0x47352e, 0xffcf82);
  makeTexture(scene, 'gxv3-fuse-b', 28, 28, 0x2b3a49, 0xaee37f);
  makeTexture(scene, 'gxv3-fused', 48, 48, 0x39414a, 0xffd06e);
  makeTexture(scene, 'gxv3-rule', 38, 38, 0x28384a, 0xb9f5ff);
}
function label(scene, value, x, y, color = '#dffcff', size = '8px') {
  return scene.add.text(x, y, value, {
    fontFamily: 'DM Mono', fontSize: size, color, stroke: '#08101c', strokeThickness: 4,
    letterSpacing: 1,
  }).setOrigin(0.5).setDepth(30).setAlpha(0.9);
}
function cue(scene, value, color = '#8df4ff') {
  try { scene.playerCue?.(value, color); } catch {}
}
function onKey(scene, key, fn, name) {
  scene.input.keyboard?.on(`keydown-${key}`, fn);
  getState(scene).entities[name] = fn;
}
function addButton(scene, x, y, textValue, fn, color = '#8df4ff') {
  const node = label(scene, textValue, x, y, color, '9px').setInteractive({ useHandCursor: false });
  node.on('pointerdown', fn);
  return node;
}

function installBodySwap(scene) {
  const st = getState(scene);
  if (!st.enabled.bodySwap || st.entities.bodySwap || !scene.player) return;
  const player = scene.player;
  const base = {
    width: player.body?.width || player.displayWidth || 28,
    height: player.body?.height || player.displayHeight || 42,
    offsetX: player.body?.offset?.x || 0,
    offsetY: player.body?.offset?.y || 0,
    scaleX: player.scaleX,
    scaleY: player.scaleY,
    tint: player.tintTopLeft,
  };
  const host = scene.physics.add.sprite(player.x + 64, player.y, 'gxv3-host').setDepth(15).setAlpha(0.18).setVisible(false);
  host.body.allowGravity = false; host.body.immovable = true;
  const state = {
    active: false,
    base,
    host,
    label: label(scene, 'BODY SWAP · B', 110, 74, '#ffd06e', '9px').setScrollFactor(0),
  };
  st.entities.bodySwap = state;
  const toggle = () => {
    state.active = !state.active;
    if (state.active) {
      player.setTexture('gxv3-host');
      player.setScale(0.92, 1.0);
      player.body.setSize(base.width * 0.82, base.height * 1.12, true);
      player.body.setOffset(0, 0);
      player.body.setMaxVelocity(420, 980);
      player.body.setMass(1.6);
      player.setTint(0xffd06e);
      host.setPosition(player.x, player.y).setVisible(true).setAlpha(0.26);
      state.label.setText('HOST BODY · B');
      cue(scene, 'BODY SWAP — HOST BODY', '#ffd06e');
    } else {
      player.setTexture(null);
      player.clearTint();
      player.setScale(base.scaleX, base.scaleY);
      player.body.setSize(base.width, base.height, true);
      player.body.setOffset(base.offsetX, base.offsetY);
      player.body.setMaxVelocity(420, 980);
      player.body.setMass(1);
      host.setVisible(false);
      state.label.setText('BODY SWAP · B');
      cue(scene, 'BODY SWAP — BASE BODY', '#8df4ff');
    }
  };
  state.toggle = toggle;
  addButton(scene, 110, 94, 'SWAP BODY', toggle, '#ffd06e');
  onKey(scene, 'B', toggle, 'bodySwapKey');
}
function updateBodySwap(scene) {
  const e = scene[NS]?.entities.bodySwap;
  if (!e || !scene.player?.active) return;
  if (e.active) {
    e.host.setPosition(scene.player.x - 10, scene.player.y).setVisible(true);
    e.host.rotation = scene.player.rotation || 0;
  }
}

function installClonePosition(scene) {
  const st = getState(scene);
  if (!st.enabled.clonePosition || st.entities.clonePosition || !scene.player) return;
  const xA = routeX(scene, 0.36), xB = routeX(scene, 0.46);
  const y = Math.min(platformY(scene, xA), platformY(scene, xB)) - 18;
  const clonePlate = scene.add.rectangle(xB, y, 92, 12, 0x2b2542, 0.9).setDepth(8).setStrokeStyle(2, 0xe0a7ff, 0.6);
  const playerPlate = scene.add.rectangle(xA, y, 92, 12, 0x203b3e, 0.9).setDepth(8).setStrokeStyle(2, 0xaee37f, 0.6);
  const gate = scene.add.rectangle(routeX(scene, 0.52), y - 72, 28, 130, 0x232f40, 0.95).setDepth(10).setStrokeStyle(2, 0x8df4ff, 0.55);
  scene.physics.add.existing(playerPlate, true); scene.physics.add.existing(clonePlate, true); scene.physics.add.existing(gate, true);
  const clone = scene.physics.add.sprite(scene.player.x, scene.player.y, 'gxv3-clone').setDepth(12).setVisible(false).setAlpha(0.72);
  clone.body.allowGravity = false; clone.body.immovable = true;
  const state = {
    clone,
    playerPlate,
    clonePlate,
    gate,
    active: false,
    expiresAt: 0,
    label: label(scene, 'CLONE POSITION · C', routeX(scene, 0.40), 106, '#e0a7ff', '9px').setScrollFactor(0),
  };
  st.entities.clonePosition = state;
  const deploy = () => {
    if (state.active) {
      state.active = false; state.clone.setVisible(false); cue(scene, 'CLONE RECALLED', '#e0a7ff'); return;
    }
    state.active = true;
    state.expiresAt = performance.now() + 7000;
    state.clone.setPosition(scene.player.x, scene.player.y).setVisible(true);
    cue(scene, 'CLONE DEPLOYED', '#e0a7ff');
  };
  state.deploy = deploy;
  addButton(scene, routeX(scene, 0.40), 128, 'DEPLOY CLONE', deploy, '#e0a7ff');
  onKey(scene, 'C', deploy, 'clonePositionKey');
}
function updateClonePosition(scene) {
  const e = scene[NS]?.entities.clonePosition; if (!e || !scene.player?.active) return;
  if (e.active && performance.now() >= e.expiresAt) { e.active = false; e.clone.setVisible(false); }
  const px = scene.player.x, cx = e.clone.x;
  const onPlayerPlate = Math.abs(px - e.playerPlate.x) < 42 && Math.abs(scene.player.y - e.playerPlate.y) < 42;
  const onClonePlate = e.active && Math.abs(cx - e.clonePlate.x) < 42 && Math.abs(e.clone.y - e.clonePlate.y) < 42;
  e.gate.body.enable = !(onPlayerPlate && onClonePlate);
  e.gate.setAlpha(onPlayerPlate && onClonePlate ? 0.22 : 0.95);
  e.label.setText(onPlayerPlate && onClonePlate ? 'CLONE SYNC · GATE OPEN' : 'CLONE POSITION · C');
}

function installMassTransfer(scene) {
  const st = getState(scene);
  if (!st.enabled.massTransfer || st.entities.massTransfer || !scene.player) return;
  const x = routeX(scene, 0.52), y = platformY(scene, x) - 34;
  const anchor = scene.physics.add.sprite(x, y, 'gxv3-anchor').setDepth(11).setImmovable(true);
  anchor.body.allowGravity = false;
  const beam = scene.add.line(0, 0, scene.player.x, scene.player.y, anchor.x, anchor.y, 0xff826e, 0.28).setLineWidth(2).setDepth(7);
  const state = { active: false, anchor, beam, baseMass: scene.player.body?.mass || 1, label: label(scene, 'MASS TRANSFER · M', x, y - 38, '#ff9c91', '9px') };
  st.entities.massTransfer = state;
  const toggle = () => {
    state.active = !state.active;
    if (state.active) {
      scene.player.body.setMass(0.42);
      anchor.body.setMass(5.5);
      anchor.setTint(0xff826e);
      cue(scene, 'MASS TRANSFERRED', '#ff826e');
    } else {
      scene.player.body.setMass(state.baseMass || 1);
      anchor.body.setMass(5.5);
      anchor.clearTint();
      cue(scene, 'MASS RETURNED', '#8df4ff');
    }
  };
  state.toggle = toggle;
  addButton(scene, x, y + 56, 'TRANSFER MASS', toggle, '#ff826e');
  onKey(scene, 'M', toggle, 'massTransferKey');
}
function updateMassTransfer(scene) {
  const e = scene[NS]?.entities.massTransfer; if (!e || !scene.player?.active) return;
  e.beam.setTo(scene.player.x, scene.player.y, e.anchor.x, e.anchor.y);
  const d = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, e.anchor.x, e.anchor.y);
  if (e.active && d > 340) e.toggle();
}

function installPhaseSplit(scene) {
  const st = getState(scene);
  if (!st.enabled.phaseSplit || st.entities.phaseSplit || !scene.player) return;
  const echo = scene.physics.add.sprite(scene.player.x - 150, scene.player.y, 'gxv3-phase-echo').setDepth(10).setAlpha(0.58);
  echo.body.allowGravity = true; echo.body.immovable = true;
  const phaseWall = scene.add.rectangle(routeX(scene, 0.48), platformY(scene, routeX(scene, 0.48)) - 60, 30, 120, 0x302c50, 0.9).setDepth(9).setStrokeStyle(2, 0x8df4ff, 0.65);
  scene.physics.add.existing(phaseWall, true);
  const state = { active: false, echo, phaseWall, lastX: scene.player.x, label: label(scene, 'PHASE SPLIT · V', routeX(scene, 0.43), 140, '#8df4ff', '9px').setScrollFactor(0) };
  st.entities.phaseSplit = state;
  const toggle = () => {
    state.active = !state.active;
    if (state.active) { echo.setVisible(true); phaseWall.fillColor = 0x263e48; cue(scene, 'PHASE SPLIT ACTIVE', '#8df4ff'); }
    else { echo.setVisible(false); phaseWall.fillColor = 0x302c50; cue(scene, 'PHASE SPLIT OFF', '#e0a7ff'); }
  };
  state.toggle = toggle;
  addButton(scene, routeX(scene, 0.43), 162, 'SPLIT PHASE', toggle, '#8df4ff');
  onKey(scene, 'V', toggle, 'phaseSplitKey');
}
function updatePhaseSplit(scene) {
  const e = scene[NS]?.entities.phaseSplit; if (!e || !scene.player?.active) return;
  const dx = scene.player.x - e.lastX;
  if (e.active) {
    e.echo.x += -dx * 0.72;
    e.echo.y = scene.player.y + Math.sin(performance.now() / 180) * 6;
    e.echo.setVisible(true);
  }
  e.lastX = scene.player.x;
  e.label.setText(e.active ? 'PHASE SPLIT · ECHO LIVE' : 'PHASE SPLIT · V');
}

function installObjectFusion(scene) {
  const st = getState(scene);
  if (!st.enabled.objectFusion || st.entities.objectFusion) return;
  const x = routeX(scene, 0.34), y = platformY(scene, x) - 30;
  const a = scene.physics.add.sprite(x - 34, y, 'gxv3-fuse-a').setDepth(11); const b = scene.physics.add.sprite(x + 34, y, 'gxv3-fuse-b').setDepth(11);
  for (const obj of [a, b]) { obj.body.allowGravity = true; obj.setInteractive(); }
  const fused = scene.physics.add.sprite(x, y, 'gxv3-fused').setDepth(11).setVisible(false);
  fused.body.allowGravity = true; fused.body.setMass(4);
  const state = { a, b, fused, active: false, label: label(scene, 'OBJECT FUSION · F', x, y - 62, '#ffd06e', '9px') };
  st.entities.objectFusion = state;
  const fuse = () => {
    if (state.active) return;
    a.disableBody(true, true); b.disableBody(true, true); fused.setPosition(x, y).setVisible(true); state.active = true;
    cue(scene, 'OBJECTS FUSED', '#ffd06e');
  };
  a.on('pointerdown', fuse); b.on('pointerdown', fuse);
  addButton(scene, x, y + 60, 'FUSE OBJECTS', fuse, '#ffd06e');
  onKey(scene, 'F', fuse, 'objectFusionKey');
}
function updateObjectFusion(scene) {
  const e = scene[NS]?.entities.objectFusion; if (!e || !scene.player?.active) return;
  if (!e.active) {
    const d = Phaser.Math.Distance.Between(e.a.x, e.a.y, e.b.x, e.b.y);
    if (d < 48) e.label.setText('OBJECT FUSION · TAP F'); else e.label.setText('OBJECT FUSION · F');
  } else e.label.setText('FUSED OBJECT ACTIVE');
}

function installScaleShift(scene) {
  const st = getState(scene);
  if (!st.enabled.scaleShift || st.entities.scaleShift || !scene.player) return;
  const player = scene.player;
  const base = { scaleX: player.scaleX, scaleY: player.scaleY, width: player.body?.width || player.displayWidth || 28, height: player.body?.height || player.displayHeight || 42 };
  const state = { small: false, base, label: label(scene, 'SCALE SHIFT · S', routeX(scene, 0.48), 176, '#aee37f', '9px').setScrollFactor(0) };
  st.entities.scaleShift = state;
  const toggle = () => {
    state.small = !state.small;
    const factor = state.small ? 0.62 : 1;
    player.setScale(base.scaleX * factor, base.scaleY * factor);
    player.body.setSize(base.width * factor, base.height * factor, true);
    state.label.setText(state.small ? 'SCALE SHIFT · SMALL · S' : 'SCALE SHIFT · NORMAL · S');
    cue(scene, state.small ? 'SMALL FORM' : 'NORMAL FORM', '#aee37f');
  };
  state.toggle = toggle;
  addButton(scene, routeX(scene, 0.48), 198, 'SHIFT SCALE', toggle, '#aee37f');
  onKey(scene, 'S', toggle, 'scaleShiftKey');
}

function installRuleInjection(scene) {
  const st = getState(scene);
  if (!st.enabled.ruleInjection || st.entities.ruleInjection) return;
  const x = routeX(scene, 0.58), y = platformY(scene, x) - 38;
  const target = scene.physics.add.sprite(x, y, 'gxv3-rule').setDepth(11).setImmovable(true);
  target.body.allowGravity = false;
  const modes = [
    { id: 'ANCHOR', tint: 0x8df4ff, restitution: 0, immovable: true, enable: true },
    { id: 'BOUNCE', tint: 0xffd06e, restitution: 1.18, immovable: false, enable: true },
    { id: 'DRIFT', tint: 0xaee37f, restitution: 0.15, immovable: false, enable: true },
  ];
  const state = { index: 0, target, modes, label: label(scene, 'RULE INJECTION · Q', x, y - 48, '#b9f5ff', '9px') };
  st.entities.ruleInjection = state;
  const apply = () => {
    state.index = (state.index + 1) % modes.length;
    const mode = modes[state.index];
    target.body.setImmovable(mode.immovable); target.body.setBounce(mode.restitution); target.body.enable = mode.enable; target.setTint(mode.tint);
    if (mode.id === 'DRIFT') target.body.setVelocityX(120);
    else target.body.setVelocity(0, 0);
    state.label.setText(`RULE: ${mode.id} · Q`); cue(scene, `RULE ${mode.id}`, '#b9f5ff');
  };
  state.apply = apply;
  target.setInteractive(); target.on('pointerdown', apply);
  addButton(scene, x, y + 66, 'INJECT RULE', apply, '#b9f5ff');
  onKey(scene, 'Q', apply, 'ruleInjectionKey');
}
function updateRuleInjection(scene) {
  const e = scene[NS]?.entities.ruleInjection; if (!e) return;
  const mode = e.modes[e.index];
  if (mode.id === 'DRIFT' && Math.abs(e.target.body.velocity.x) < 5) e.target.body.setVelocityX(120);
}

function installV3Scene(scene) {
  const st = getState(scene);
  if (st.destroyed || !scene.player) return;
  makeTextures(scene);
  installBodySwap(scene); installClonePosition(scene); installMassTransfer(scene); installPhaseSplit(scene); installObjectFusion(scene); installScaleShift(scene); installRuleInjection(scene);
}

export function installGameplayExpansionV3Safe(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__gameplayExpansionV3SafeInstalled) return;
  RunnerScene.prototype.__gameplayExpansionV3SafeInstalled = true;
  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    try { installV3Scene(this); } catch (error) { console.warn('[Gameplay V3] init failed safely', error); }
    const update = (_time, delta = 16) => {
      if (this[NS]?.destroyed || !this.player?.active) return;
      try {
        updateBodySwap(this); updateClonePosition(this); updateMassTransfer(this); updatePhaseSplit(this); updateObjectFusion(this); updateRuleInjection(this);
      } catch (error) { console.warn('[Gameplay V3] update failed safely', error); }
    };
    this.events?.on?.('update', update);
    this.events?.once?.('shutdown', () => {
      const st = this[NS]; if (!st) return; st.destroyed = true;
      for (const handle of st.timers || []) handle?.remove?.(false);
      for (const entry of Object.values(st.entities || {})) {
        if (typeof entry === 'function') { this.input.keyboard?.off?.('keydown', entry); continue; }
        for (const value of Object.values(entry || {})) {
          if (value?.active && typeof value.destroy === 'function') value.destroy();
        }
      }
      this.events?.off?.('update', update);
      this[NS] = null;
    });
    return result;
  };
}
