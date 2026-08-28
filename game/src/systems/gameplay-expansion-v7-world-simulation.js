import Phaser from 'phaser';

const STORAGE_KEY = 'relay.gameplay.v7.worldSimulation';
const DEFAULT_STATE = Object.freeze({
  economy: { marketIndex: 100, trades: 0 },
  reputation: { dock: 0, civic: 0 },
  damage: {},
  rumors: 0,
  safehouse: { visits: 0, supplies: 3 },
  contacts: {},
});

const cloneDefault = () => JSON.parse(JSON.stringify(DEFAULT_STATE));

function readState() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return cloneDefault();
    return { ...cloneDefault(), ...JSON.parse(raw) };
  } catch {
    return cloneDefault();
  }
}

function writeState(state) {
  try { window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* optional */ }
}

const save = (state, mutate) => {
  const next = mutate(JSON.parse(JSON.stringify(state)));
  writeState(next);
  return next;
};

function makeLabel(scene, x, y, title, subtitle) {
  const bg = scene.add.rectangle(x, y, 150, 46, 0x07111e, 0.94).setStrokeStyle(1, 0x5be7ff, 0.55);
  const text = scene.add.text(x, y - 5, title, { fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#e9fbff' }).setOrigin(0.5);
  const sub = scene.add.text(x, y + 11, subtitle, { fontFamily: 'monospace', fontSize: '8px', color: '#8ed8e8' }).setOrigin(0.5);
  return { bg, text, sub };
}

function installNode(scene, config, onActivate) {
  const { x, y, title, subtitle, color = 0x5be7ff, radius = 18 } = config;
  const glow = scene.add.circle(x, y, radius + 8, color, 0.08).setDepth(40);
  const node = scene.add.circle(x, y, radius, 0x07111e, 0.98).setStrokeStyle(2, color, 0.9).setDepth(41);
  const core = scene.add.circle(x, y, 5, color, 0.9).setDepth(42);
  const label = makeLabel(scene, x, y + 49, title, subtitle);
  [node, core].forEach(item => item.setInteractive({ useHandCursor: true }));
  node.on('pointerover', () => node.setStrokeStyle(3, color, 1));
  node.on('pointerout', () => node.setStrokeStyle(2, color, 0.9));
  node.on('pointerdown', () => onActivate({ node, core, glow, label }));
  return { node, core, glow, label };
}

function hourFromScene(scene) {
  const progress = Number(scene.__relayTimeMs || 0) / 90000;
  return ((6 + progress * 24) % 24 + 24) % 24;
}

function weatherForHour(hour) {
  if (hour >= 20 || hour < 5) return { name: 'NIGHT RAIN', routeOpen: false, friction: 'LOW' };
  if (hour < 8) return { name: 'DAWN MIST', routeOpen: true, friction: 'MEDIUM' };
  if (hour < 17) return { name: 'CLEAR', routeOpen: true, friction: 'HIGH' };
  return { name: 'SUNSET WIND', routeOpen: true, friction: 'MEDIUM' };
}

export function installGameplayExpansionV7WorldSimulation(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__gameplayExpansionV7Installed) return;
  RunnerScene.prototype.__gameplayExpansionV7Installed = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function v7Create(...args) {
    const result = originalCreate.apply(this, args);
    const state = readState();
    this.__relayV7State = state;
    this.__relayV7Nodes = [];
    this.__relayV7ScheduleAgents = [];
    this.__relayV7MissionKey = this.mission?.id || 'default';

    const width = Math.max(900, this.scale.width || this.cameras.main.width || 1280);
    const y = Math.max(170, Math.min(250, (this.scale.height || 720) * 0.34));
    const positions = [
      [105, y], [255, y], [405, y], [555, y],
      [705, y], [855, y], [1005, y], [1155, y],
    ];
    const defs = [
      ['ECONOMY', 'TRADE', 0x8dff8d],
      ['REPUTATION', 'FACTION', 0xffd66b],
      ['WORLD DAMAGE', 'PERSIST', 0xff6f91],
      ['NPC SCHEDULE', 'TIME', 0x9e9bff],
      ['RUMORS', 'SPREAD', 0xff9f5b],
      ['WEATHER ROUTE', 'ADAPT', 0x65d9ff],
      ['SAFEHOUSE', 'OPERATE', 0x77ffcf],
      ['CONTACTS', 'MEMORY', 0xff8ee8],
    ];

    const activate = (index, refs) => {
      const current = this.__relayV7State;
      let message = '';
      const next = save(current, s => {
        if (index === 0) {
          const delta = current.economy.trades % 2 === 0 ? 7 : -5;
          s.economy.marketIndex = Math.max(60, Math.min(160, s.economy.marketIndex + delta));
          s.economy.trades += 1;
          message = `MARKET ${s.economy.marketIndex}`;
        } else if (index === 1) {
          const faction = current.economy.trades % 2 === 0 ? 'dock' : 'civic';
          s.reputation[faction] = (s.reputation[faction] || 0) + 1;
          message = `${faction.toUpperCase()} REP +1`;
        } else if (index === 2) {
          const key = this.__relayV7MissionKey;
          s.damage[key] = !s.damage[key];
          message = s.damage[key] ? 'STRUCTURE DAMAGED' : 'STRUCTURE RESTORED';
        } else if (index === 3) {
          message = 'SCHEDULE: ACTIVE NPC ROUTE';
        } else if (index === 4) {
          s.rumors += 1;
          message = `RUMOR NETWORK ${s.rumors}`;
        } else if (index === 5) {
          const weather = weatherForHour(hourFromScene(this));
          message = `${weather.name} · ROUTE ${weather.routeOpen ? 'OPEN' : 'RESTRICTED'}`;
        } else if (index === 6) {
          s.safehouse.visits += 1;
          s.safehouse.supplies = Math.max(0, s.safehouse.supplies - 1);
          message = `SAFEHOUSE VISIT ${s.safehouse.visits}`;
        } else {
          const id = 'primary';
          s.contacts[id] = (s.contacts[id] || 0) + 1;
          message = `CONTACT MEMORY ${s.contacts[id]}`;
        }
        return s;
      });
      this.__relayV7State = next;
      this.__relayV7Toast(message);
      if (index === 2) refs.core.setFillStyle(next.damage[this.__relayV7MissionKey] ? 0xff385d : defs[index][2], 1);
    };

    defs.forEach((def, index) => {
      const [x, py] = positions[index];
      this.__relayV7Nodes.push(installNode(this, { x, y: py, title: def[0], subtitle: def[1], color: def[2] }, refs => activate(index, refs)));
    });

    // Visible schedule agents: their route changes continuously with the existing time cycle.
    const agentY = Math.min((this.scale.height || 720) - 150, 570);
    for (let i = 0; i < 3; i += 1) {
      const agent = this.add.circle(180 + i * 330, agentY, 10, 0x9e9bff, 0.9).setDepth(39);
      agent.setStrokeStyle(2, 0xe8e7ff, 0.7).setInteractive({ useHandCursor: true });
      agent.on('pointerdown', () => this.__relayV7Toast(`NPC ${i + 1} SCHEDULE · ${weatherForHour(hourFromScene(this)).name}`));
      this.__relayV7ScheduleAgents.push(agent);
    }

    // A visible weather route gate whose state follows the already-existing time/weather cycle.
    const gateX = width * 0.5;
    const gateY = Math.min((this.scale.height || 720) - 95, 625);
    this.__relayV7WeatherGate = this.add.rectangle(gateX, gateY, 270, 22, 0x16354a, 0.92).setStrokeStyle(1, 0x65d9ff, 0.8).setDepth(38);
    this.__relayV7WeatherText = this.add.text(gateX, gateY, 'WEATHER ROUTE · CHECKING', { fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#dffbff' }).setOrigin(0.5).setDepth(39);

    this.__relayV7Toast = message => {
      if (!this.__relayV7ToastText) {
        this.__relayV7ToastText = this.add.text(this.cameras.main.centerX, 112, '', { fontFamily: 'monospace', fontSize: '12px', fontStyle: 'bold', color: '#eaffff', backgroundColor: '#06121ddd', padding: { left: 12, right: 12, top: 8, bottom: 8 } }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
      }
      this.__relayV7ToastText.setText(message).setAlpha(1);
      this.tweens.killTweensOf(this.__relayV7ToastText);
      this.tweens.add({ targets: this.__relayV7ToastText, alpha: 0, delay: 1200, duration: 350 });
    };

    this.__relayV7Cleanup = () => {
      [...this.__relayV7Nodes, ...this.__relayV7ScheduleAgents].forEach(group => {
        if (group?.node) group.node.destroy();
        if (group?.core) group.core.destroy();
        if (group?.glow) group.glow.destroy();
        if (group?.label) Object.values(group.label).forEach(item => item?.destroy());
        if (group?.destroy) group.destroy();
      });
      this.__relayV7WeatherGate?.destroy();
      this.__relayV7WeatherText?.destroy();
      this.__relayV7ToastText?.destroy();
      this.__relayV7Nodes = [];
      this.__relayV7ScheduleAgents = [];
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.__relayV7Cleanup);

    return result;
  };

  RunnerScene.prototype.update = function v7Update(time, delta, ...args) {
    const result = originalUpdate.call(this, time, delta, ...args);
    if (!this.__relayV7WeatherGate?.active) return result;
    const hour = hourFromScene(this);
    const weather = weatherForHour(hour);
    this.__relayV7WeatherText.setText(`WEATHER ROUTE · ${weather.name} · ${weather.routeOpen ? 'OPEN' : 'RESTRICTED'}`);
    this.__relayV7WeatherGate.setFillStyle(weather.routeOpen ? 0x16354a : 0x401c2a, 0.94);
    this.__relayV7WeatherGate.setStrokeStyle(2, weather.routeOpen ? 0x65d9ff : 0xff5577, 0.85);

    const schedulePhase = hour / 24;
    this.__relayV7ScheduleAgents.forEach((agent, i) => {
      const base = 170 + i * 330;
      const span = 180;
      const x = base + Math.sin((schedulePhase * Math.PI * 2) + i * 1.8) * span;
      agent.x = Phaser.Math.Clamp(x, 70, (this.scale.width || 1280) - 70);
    });
    return result;
  };
}
