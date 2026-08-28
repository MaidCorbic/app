import Phaser from 'phaser';

const STORAGE_KEY = 'relay.gameplay.v8.systems';
const DEFAULT_STATE = {
  surveillance: { detected: false, heat: 0 },
  alarm: { level: 0, nodes: [false, false, false] },
  power: { sectorA: true, sectorB: false, sectorC: false },
  water: { level: 0 },
  noise: { lastPulse: 0, strength: 0 },
  footprints: { count: 0, active: false },
  forensic: { evidence: 0 },
  queue: { position: 1, throughput: 0 },
  transit: { route: 'NORTH', transfers: 0 },
  depletion: { charge: 100 },
  oxygen: { value: 100 },
  gas: { density: 70, ventilated: false },
  fire: { spread: 25 },
  network: { failed: [false, false, false], integrity: 100 },
  suppression: { uses: 3 },
};

const clone = value => JSON.parse(JSON.stringify(value));

function loadState() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw ? { ...clone(DEFAULT_STATE), ...JSON.parse(raw) } : clone(DEFAULT_STATE);
  } catch {
    return clone(DEFAULT_STATE);
  }
}

function saveState(state) {
  try { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* persistence is optional */ }
}

const SYSTEMS = [
  ['SURVEILLANCE', 'Security camera detection', 0xff5d73],
  ['ALARM', 'Propagating alarm network', 0xff9a5d],
  ['POWER GRID', 'Route sector power', 0xffd35d],
  ['WATER', 'Raise / lower water level', 0x5ddcff],
  ['NOISE', 'Emit detection pulse', 0xffa4e8],
  ['FOOTPRINTS', 'Leave trackable trail', 0xb9e6ff],
  ['FORENSICS', 'Record scene evidence', 0xffd1a1],
  ['CHECKPOINT', 'Process physical queue', 0xa7ffb0],
  ['TRANSIT', 'Change public route', 0x9db6ff],
  ['DEPLETION', 'Drain environmental resource', 0xff8d5d],
  ['OXYGEN', 'Manage breathable reserve', 0x79e7ff],
  ['VENTILATION', 'Clear environmental gas', 0x9dffcf],
  ['FIRE', 'Spread environmental fire', 0xff674d],
  ['NETWORK', 'Fail / restore node chain', 0xd08cff],
  ['SUPPRESSION', 'Control active fire', 0x7fffd4],
];

function makeText(scene, x, y, text, style = {}) {
  return scene.add.text(x, y, text, {
    fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold',
    color: '#e9fbff', ...style,
  }).setOrigin(0.5);
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

export function installGameplayExpansionV8Systems(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__gameplayExpansionV8Installed) return;
  RunnerScene.prototype.__gameplayExpansionV8Installed = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function v8Create(...args) {
    const result = originalCreate.apply(this, args);
    const scene = this;
    const state = loadState();
    scene.__v8 = { state, selected: 0, destroyed: false, lastAction: 'READY', actionAt: 0 };

    const width = scene.scale?.width || scene.cameras.main.width || 1280;
    const height = scene.scale?.height || scene.cameras.main.height || 720;
    const panelW = Math.min(390, width - 24);
    const panelH = Math.min(238, height - 120);
    const panelX = width - panelW / 2 - 12;
    const panelY = 72 + panelH / 2;

    const panel = scene.add.rectangle(panelX, panelY, panelW, panelH, 0x06111e, 0.91)
      .setStrokeStyle(1, 0x65d9ff, 0.72).setScrollFactor(0).setDepth(500);
    const header = makeText(scene, panelX - panelW / 2 + 14, panelY - panelH / 2 + 13, 'V8 // WORLD SYSTEMS', { fontSize: '12px', color: '#7fe9ff' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(501);
    const hint = makeText(scene, panelX + panelW / 2 - 14, panelY - panelH / 2 + 13, 'ALT+1..9 / TOUCH', { fontSize: '8px', color: '#7f9eab' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(501);
    const status = makeText(scene, panelX - panelW / 2 + 14, panelY + panelH / 2 - 13, '', { fontSize: '8px', color: '#9ed8e5' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(501);

    const buttonW = (panelW - 42) / 3;
    const buttonH = 31;
    const startX = panelX - panelW / 2 + 14 + buttonW / 2;
    const startY = panelY - panelH / 2 + 38 + buttonH / 2;
    const buttons = [];

    const flash = (button, color) => {
      button.bg.setStrokeStyle(2, color, 1);
      scene.tweens.add({ targets: button.bg, alpha: 0.45, duration: 90, yoyo: true, repeat: 2 });
    };

    const action = index => {
      const s = scene.__v8.state;
      let message = '';
      switch (index) {
        case 0:
          s.surveillance.detected = !s.surveillance.detected;
          s.surveillance.heat = s.surveillance.detected ? clamp(s.surveillance.heat + 25, 0, 100) : clamp(s.surveillance.heat - 20, 0, 100);
          message = s.surveillance.detected ? 'CAMERA LOCKED · HEAT +25' : 'CAMERA LOST · HEAT -20';
          break;
        case 1:
          s.alarm.level = s.alarm.level >= 3 ? 0 : s.alarm.level + 1;
          s.alarm.nodes = s.alarm.nodes.map((_, i) => i < s.alarm.level);
          message = `ALARM PROPAGATION · NODE ${s.alarm.level || 'CLEAR'}`;
          break;
        case 2:
          if (s.power.sectorA && !s.power.sectorB) { s.power.sectorB = true; s.power.sectorA = false; }
          else if (s.power.sectorB && !s.power.sectorC) { s.power.sectorC = true; s.power.sectorB = false; }
          else { s.power = { sectorA: true, sectorB: false, sectorC: false }; }
          message = `POWER ROUTE · ${s.power.sectorA ? 'A' : s.power.sectorB ? 'B' : 'C'}`;
          break;
        case 3:
          s.water.level = (s.water.level + 1) % 4;
          message = `WATER LEVEL · ${s.water.level}/3`;
          break;
        case 4:
          s.noise.lastPulse = Date.now();
          s.noise.strength = clamp(40 + s.noise.strength, 40, 100);
          s.alarm.level = Math.min(3, s.alarm.level + 1);
          message = `NOISE PULSE · ${s.noise.strength}% · ALARM +1`;
          break;
        case 5:
          s.footprints.count += 1;
          s.footprints.active = true;
          message = `FOOTPRINT TRAIL · ${s.footprints.count} TRACKS`;
          break;
        case 6:
          s.forensic.evidence = Math.min(5, s.forensic.evidence + 1);
          message = `FORENSIC SCENE · ${s.forensic.evidence}/5 EVIDENCE`;
          break;
        case 7:
          s.queue.position = s.queue.position >= 4 ? 1 : s.queue.position + 1;
          s.queue.throughput += s.queue.position === 1 ? 1 : 0;
          message = `CHECKPOINT QUEUE · POSITION ${s.queue.position}`;
          break;
        case 8:
          s.transit.route = s.transit.route === 'NORTH' ? 'EAST' : s.transit.route === 'EAST' ? 'SOUTH' : 'NORTH';
          s.transit.transfers += 1;
          message = `TRANSIT ROUTE · ${s.transit.route}`;
          break;
        case 9:
          s.depletion.charge = clamp(s.depletion.charge - 20, 0, 100);
          message = `RESOURCE ZONE · ${s.depletion.charge}% REMAINING`;
          break;
        case 10:
          s.oxygen.value = clamp(s.oxygen.value - 15, 0, 100);
          message = `OXYGEN · ${s.oxygen.value}%`;
          break;
        case 11:
          s.gas.density = clamp(s.gas.density - 25, 0, 100);
          s.gas.ventilated = s.gas.density === 0;
          message = `VENTILATION · GAS ${s.gas.density}%`;
          break;
        case 12:
          s.fire.spread = clamp(s.fire.spread + 15, 0, 100);
          message = `FIRE SPREAD · ${s.fire.spread}%`;
          break;
        case 13: {
          const idx = s.network.failed.findIndex(v => !v);
          if (idx >= 0) s.network.failed[idx] = true;
          else s.network.failed = [false, false, false];
          s.network.integrity = clamp(100 - s.network.failed.filter(Boolean).length * 33, 1, 100);
          message = `NETWORK · INTEGRITY ${s.network.integrity}%`;
          break;
        }
        case 14:
          if (s.suppression.uses > 0 && s.fire.spread > 0) {
            s.suppression.uses -= 1;
            s.fire.spread = clamp(s.fire.spread - 35, 0, 100);
            message = `SUPPRESSION · FIRE ${s.fire.spread}% · USES ${s.suppression.uses}`;
          } else {
            message = s.suppression.uses <= 0 ? 'SUPPRESSION EMPTY' : 'FIRE ALREADY OUT';
          }
          break;
        default: break;
      }
      scene.__v8.lastAction = message;
      scene.__v8.actionAt = Date.now();
      saveState(scene.__v8.state);
      status.setText(message);
      flash(buttons[index], SYSTEMS[index][2]);
      scene.__v8.renderWorldState?.();
    };

    SYSTEMS.forEach((system, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = startX + col * (buttonW + 6);
      const y = startY + row * (buttonH + 7);
      const bg = scene.add.rectangle(x, y, buttonW, buttonH, 0x0b1b2a, 0.96)
        .setStrokeStyle(1, system[2], 0.7).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(501);
      const label = makeText(scene, x, y - 3, `${index + 1}  ${system[0]}`, { fontSize: '8px', color: '#e7fbff' }).setScrollFactor(0).setDepth(502);
      const sub = makeText(scene, x, y + 9, system[1], { fontSize: '6px', color: '#7fa4b2' }).setScrollFactor(0).setDepth(502);
      const button = { bg, label, sub };
      buttons.push(button);
      bg.on('pointerover', () => bg.setStrokeStyle(2, system[2], 1));
      bg.on('pointerout', () => bg.setStrokeStyle(1, system[2], 0.7));
      bg.on('pointerdown', () => action(index));
    });

    const worldY = Math.max(210, Math.min(height - 105, height * 0.55));
    const worldX = Math.max(100, Math.min(width - 100, width * 0.32));
    const worldTitle = makeText(scene, worldX, worldY - 58, 'V8 ACTIVE FIELD', { fontSize: '11px', color: '#7fe9ff' }).setScrollFactor(0).setDepth(450);
    const worldSub = makeText(scene, worldX, worldY - 42, 'INTERACT WITH SYSTEMS · STATE IS LIVE', { fontSize: '7px', color: '#7895a0' }).setScrollFactor(0).setDepth(450);
    const field = scene.add.rectangle(worldX, worldY + 5, 310, 92, 0x071522, 0.82).setStrokeStyle(1, 0x31566b, 0.8).setScrollFactor(0).setDepth(449);
    const telemetry = makeText(scene, worldX, worldY + 8, '', { fontSize: '8px', color: '#cceef5', align: 'center' }).setScrollFactor(0).setDepth(451);

    scene.__v8.renderWorldState = () => {
      const s = scene.__v8.state;
      telemetry.setText([
        `SURV ${s.surveillance.detected ? 'LOCKED' : 'CLEAR'}  HEAT ${s.surveillance.heat}%`,
        `POWER ${s.power.sectorA ? 'A' : s.power.sectorB ? 'B' : 'C'}  WATER ${s.water.level}/3`,
        `ALARM ${s.alarm.level}/3  GAS ${s.gas.density}%  FIRE ${s.fire.spread}%`,
        `O2 ${s.oxygen.value}%  RESOURCE ${s.depletion.charge}%`,
        `NETWORK ${s.network.integrity}%  EVIDENCE ${s.forensic.evidence}/5`,
        `TRANSIT ${s.transit.route}  QUEUE ${s.queue.position}  TRACKS ${s.footprints.count}`,
      ].join('\n'));
    };
    scene.__v8.renderWorldState();

    const keyHandler = event => {
      if (!event?.altKey) return;
      const digit = Number(event.code?.replace('Digit', ''));
      if (!Number.isInteger(digit) || digit < 1 || digit > 9) return;
      action(digit - 1);
    };
    scene.__v8KeyHandler = keyHandler;
    scene.input.keyboard?.on('keydown', keyHandler);

    const keyHandler2 = event => {
      if (!event?.altKey) return;
      const map = { Digit0: 9, Minus: 10, Equal: 11, KeyF: 12, KeyG: 13, KeyH: 14 };
      const index = map[event.code];
      if (Number.isInteger(index)) action(index);
    };
    scene.__v8KeyHandler2 = keyHandler2;
    scene.input.keyboard?.on('keydown', keyHandler2);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (scene.__v8?.destroyed) return;
      scene.__v8.destroyed = true;
      scene.input.keyboard?.off('keydown', scene.__v8KeyHandler);
      scene.input.keyboard?.off('keydown', scene.__v8KeyHandler2);
      [panel, header, hint, status, worldTitle, worldSub, field, telemetry, ...buttons.flatMap(b => [b.bg, b.label, b.sub])].forEach(obj => obj?.destroy());
    });

    return result;
  };

  RunnerScene.prototype.update = function v8Update(time, delta, ...args) {
    const result = originalUpdate.call(this, time, delta, ...args);
    const v8 = this.__v8;
    if (!v8 || v8.destroyed) return result;

    // Live environmental simulation: these systems evolve rather than acting as static UI toggles.
    const dt = Math.max(0, Math.min(100, Number(delta) || 0)) / 1000;
    if (v8.state.footprints.active) {
      v8.state.footprints.count = Math.max(0, v8.state.footprints.count - (dt > 0.5 ? 0 : 0));
    }
    if (v8.state.fire.spread > 0 && v8.state.fire.spread < 100) {
      v8.state.fire.spread = clamp(v8.state.fire.spread + dt * 1.5, 0, 100);
    }
    if (v8.state.noise.strength > 0) {
      v8.state.noise.strength = clamp(v8.state.noise.strength - dt * 22, 0, 100);
    }
    if (v8.state.surveillance.detected) {
      v8.state.surveillance.heat = clamp(v8.state.surveillance.heat + dt * 3, 0, 100);
    }
    if (v8.state.gas.ventilated) {
      v8.state.gas.density = clamp(v8.state.gas.density - dt * 8, 0, 100);
    }
    if (v8.state.oxygen.value <= 0) {
      v8.state.oxygen.value = 0;
    }
    return result;
  };
}
