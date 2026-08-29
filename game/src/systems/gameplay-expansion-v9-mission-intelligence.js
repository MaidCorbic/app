import Phaser from 'phaser';

const STORAGE_KEY = 'relay.gameplay.v9.missionIntelligence';
const DEFAULT_STATE = Object.freeze({
  intel: { source: 0, confidence: 0, verified: false },
  delayed: { armed: false, fired: false, count: 0 },
  ghost: { samples: [], plays: 0 },
});

const clone = value => JSON.parse(JSON.stringify(value));
function loadState() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw ? { ...clone(DEFAULT_STATE), ...JSON.parse(raw) } : clone(DEFAULT_STATE);
  } catch { return clone(DEFAULT_STATE); }
}
function saveState(state) {
  try { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* optional */ }
}
function text(scene, x, y, value, style = {}) {
  return scene.add.text(x, y, value, {
    fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#e9fbff', ...style,
  }).setOrigin(0.5);
}

export function installGameplayExpansionV9MissionIntelligence(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__gameplayExpansionV9Installed) return;
  RunnerScene.prototype.__gameplayExpansionV9Installed = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function v9Create(...args) {
    const result = originalCreate.apply(this, args);
    const scene = this;
    const state = loadState();
    scene.__v9 = { state, destroyed: false, samples: [], ghost: null, ghostIndex: 0, ghostPlaying: false, delayedTimer: null };

    const width = scene.scale?.width || scene.cameras?.main?.width || 1280;
    const height = scene.scale?.height || scene.cameras?.main?.height || 720;
    const mobile = width <= 760;
    const panelW = mobile ? Math.min(width - 20, 330) : 365;
    const panelH = 208;
    const px = mobile ? (width - panelW) / 2 : width - panelW - 16;
    const py = mobile ? 70 : Math.max(80, height - panelH - 22);

    const panel = scene.add.rectangle(px + panelW / 2, py + panelH / 2, panelW, panelH, 0x06111e, 0.94)
      .setStrokeStyle(1, 0x7ee7ff, 0.72).setScrollFactor(0).setDepth(700);
    const title = text(scene, px + 14, py + 14, 'V9 // MISSION INTELLIGENCE', { fontSize: '11px', color: '#7ee7ff' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(701);
    const help = text(scene, px + panelW - 14, py + 14, 'ALT+Q / W / E', { fontSize: '7px', color: '#7896a4' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(701);
    const status = text(scene, px + 14, py + panelH - 14, 'READY', { fontSize: '8px', color: '#a7dbe8' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(701);

    const buttons = [];
    const defs = [
      ['Q', 'INTEL VERIFY', 'Compare sources', 0x8ee7ff],
      ['W', 'DELAYED TRIGGER', 'Arm 3s action', 0xffd27a],
      ['E', 'REPLAY GHOST', 'Replay last path', 0xc4a0ff],
    ];
    const bw = (panelW - 42) / 3;
    defs.forEach((d, i) => {
      const x = px + 14 + bw / 2 + i * (bw + 7);
      const y = py + 58;
      const bg = scene.add.rectangle(x, y, bw, 54, 0x0b1b2a, 0.98).setStrokeStyle(1, d[3], 0.8)
        .setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(701);
      const key = text(scene, x, y - 17, d[0], { fontSize: '12px', color: '#ffffff' }).setScrollFactor(0).setDepth(702);
      const label = text(scene, x, y - 1, d[1], { fontSize: '7px', color: '#e9fbff' }).setScrollFactor(0).setDepth(702);
      const sub = text(scene, x, y + 13, d[2], { fontSize: '6px', color: '#86a9b8' }).setScrollFactor(0).setDepth(702);
      const button = { bg, key, label, sub, color: d[3] };
      buttons.push(button);
      bg.on('pointerover', () => bg.setStrokeStyle(2, d[3], 1));
      bg.on('pointerout', () => bg.setStrokeStyle(1, d[3], 0.8));
    });

    // Visible information source nodes: the player validates information rather than manipulating the world.
    const worldY = Math.max(185, Math.min(height - 120, height * 0.38));
    const sourceXs = [width * 0.18, width * 0.32, width * 0.46];
    const sources = sourceXs.map((x, i) => {
      const circle = scene.add.circle(x, worldY, 16, 0x0a1724, 0.96).setStrokeStyle(2, [0x65d9ff, 0xffc65d, 0xbda0ff][i], 0.9)
        .setInteractive({ useHandCursor: true }).setDepth(610);
      const lab = text(scene, x, worldY + 31, `SOURCE ${i + 1}`, { fontSize: '7px', color: '#b8d8e3' }).setDepth(611);
      circle.on('pointerdown', () => verifySource(i));
      return { circle, lab };
    });
    const intelLine = scene.add.rectangle(width * 0.32, worldY, width * 0.28, 2, 0x477086, 0.55).setDepth(609);

    // Visible delayed-action beacon. It changes state after a real timer, not merely a toast.
    const beacon = scene.add.circle(width * 0.62, worldY, 18, 0x1b1520, 0.96).setStrokeStyle(2, 0xffd27a, 0.9)
      .setInteractive({ useHandCursor: true }).setDepth(610);
    const beaconLabel = text(scene, width * 0.62, worldY + 31, 'DELAY BEACON', { fontSize: '7px', color: '#e9d5a7' }).setDepth(611);
    const beaconState = text(scene, width * 0.62, worldY + 48, 'SAFE', { fontSize: '7px', color: '#a8b8c2' }).setDepth(611);

    const ghostLayer = scene.add.container(0, 0).setDepth(605);
    const ghostTrail = scene.add.graphics().setDepth(604);
    const ghostDot = scene.add.circle(0, 0, 9, 0xc4a0ff, 0.36).setStrokeStyle(2, 0xe9ddff, 0.8).setVisible(false).setDepth(606);

    const flash = button => {
      button.bg.setStrokeStyle(2, button.color, 1);
      scene.tweens?.add?.({ targets: button.bg, alpha: { from: 0.45, to: 1 }, duration: 110, yoyo: true, repeat: 2 });
    };

    const setStatus = message => status.setText(message);

    const verifySource = index => {
      const s = scene.__v9.state;
      s.intel.source = index;
      // Source 2 is the corroborating source in the demonstrator. The state is explicit and inspectable.
      s.intel.confidence = index === 1 ? 100 : index === 0 ? 55 : 35;
      s.intel.verified = index === 1;
      saveState(s);
      sources.forEach((source, i) => source.circle.setStrokeStyle(2, [0x65d9ff, 0xffc65d, 0xbda0ff][i], i === index ? 1 : 0.55));
      setStatus(`INTEL SOURCE ${index + 1} · CONFIDENCE ${s.intel.confidence}%${s.intel.verified ? ' · VERIFIED' : ''}`);
      flash(buttons[0]);
    };

    const armDelayed = () => {
      const s = scene.__v9.state;
      if (scene.__v9.delayedTimer) return setStatus('DELAY ALREADY ARMED');
      s.delayed.armed = true;
      s.delayed.fired = false;
      saveState(s);
      beaconState.setText('ARMED 3.0s');
      beacon.setFillStyle(0x3b2c16, 1);
      setStatus('DELAYED ACTION ARMED · 3 SECONDS');
      flash(buttons[1]);
      scene.__v9.delayedTimer = scene.time?.delayedCall?.(3000, () => {
        const next = scene.__v9.state;
        next.delayed.armed = false;
        next.delayed.fired = true;
        next.delayed.count += 1;
        saveState(next);
        beaconState.setText('FIRED');
        beacon.setFillStyle(0x5a2b1d, 1);
        setStatus(`DELAYED ACTION FIRED · COUNT ${next.delayed.count}`);
        scene.__v9.delayedTimer = null;
      });
    };

    const capture = () => {
      const p = scene.player;
      if (!p) return;
      const sample = { x: Number(p.x) || 0, y: Number(p.y) || 0 };
      scene.__v9.samples.push(sample);
      if (scene.__v9.samples.length > 180) scene.__v9.samples.shift();
      if (scene.__v9.samples.length >= 12) scene.__v9.state.ghost.samples = scene.__v9.samples.slice(-180);
    };

    const startGhost = () => {
      const samples = scene.__v9.state.ghost.samples?.length ? scene.__v9.state.ghost.samples : scene.__v9.samples;
      if (samples.length < 4) return setStatus('REPLAY NEEDS A RECORDED PATH');
      scene.__v9.ghost = samples.map(p => ({ ...p }));
      scene.__v9.ghostIndex = 0;
      scene.__v9.ghostPlaying = true;
      scene.__v9.state.ghost.plays += 1;
      saveState(scene.__v9.state);
      ghostDot.setVisible(true);
      ghostTrail.clear();
      setStatus(`REPLAY GHOST ACTIVE · ${samples.length} SAMPLES`);
      flash(buttons[2]);
    };

    buttons[0].bg.on('pointerdown', () => verifySource((scene.__v9.state.intel.source + 1) % 3));
    buttons[1].bg.on('pointerdown', armDelayed);
    buttons[2].bg.on('pointerdown', startGhost);

    const keyHandler = event => {
      if (!event?.altKey) return;
      if (event.code === 'KeyQ') verifySource((scene.__v9.state.intel.source + 1) % 3);
      else if (event.code === 'KeyW') armDelayed();
      else if (event.code === 'KeyE') startGhost();
    };
    scene.__v9KeyHandler = keyHandler;
    scene.input.keyboard?.on('keydown', keyHandler);

    scene.__v9.renderGhost = () => {
      const g = scene.__v9.ghost;
      if (!scene.__v9.ghostPlaying || !g?.length) return;
      const current = g[Math.min(scene.__v9.ghostIndex, g.length - 1)];
      ghostDot.setPosition(current.x, current.y);
      ghostTrail.clear();
      ghostTrail.lineStyle(2, 0xc4a0ff, 0.28);
      const end = Math.min(scene.__v9.ghostIndex + 24, g.length);
      if (end > 1) {
        ghostTrail.beginPath();
        ghostTrail.moveTo(g[Math.max(0, scene.__v9.ghostIndex - 1)].x, g[Math.max(0, scene.__v9.ghostIndex - 1)].y);
        for (let i = scene.__v9.ghostIndex; i < end; i += 1) ghostTrail.lineTo(g[i].x, g[i].y);
        ghostTrail.strokePath();
      }
      scene.__v9.ghostIndex += 1;
      if (scene.__v9.ghostIndex >= g.length) {
        scene.__v9.ghostPlaying = false;
        ghostDot.setVisible(false);
        setStatus('REPLAY GHOST COMPLETE');
      }
    };

    scene.__v9.cleanup = () => {
      if (scene.__v9.destroyed) return;
      scene.__v9.destroyed = true;
      scene.__v9.delayedTimer?.remove?.(false);
      scene.input.keyboard?.off('keydown', scene.__v9KeyHandler);
      [panel, title, help, status, intelLine, beacon, beaconLabel, beaconState, ghostDot, ghostTrail, ghostLayer, ...buttons.flatMap(b => [b.bg, b.key, b.label, b.sub]), ...sources.flatMap(s => [s.circle, s.lab])].forEach(o => o?.destroy?.());
    };
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, scene.__v9.cleanup);

    return result;
  };

  RunnerScene.prototype.update = function v9Update(time, delta, ...args) {
    const result = originalUpdate.call(this, time, delta, ...args);
    if (!this.__v9 || this.__v9.destroyed) return result;
    if (this.player) {
      const last = this.__v9.samples[this.__v9.samples.length - 1];
      const dx = last ? Math.abs((Number(this.player.x) || 0) - last.x) : 999;
      const dy = last ? Math.abs((Number(this.player.y) || 0) - last.y) : 999;
      if (dx + dy > 4) {
        const sample = { x: Number(this.player.x) || 0, y: Number(this.player.y) || 0 };
        this.__v9.samples.push(sample);
        if (this.__v9.samples.length > 180) this.__v9.samples.shift();
        if (this.__v9.samples.length >= 12) this.__v9.state.ghost.samples = this.__v9.samples.slice(-180);
      }
    }
    this.__v9.renderGhost?.();
    return result;
  };
}
