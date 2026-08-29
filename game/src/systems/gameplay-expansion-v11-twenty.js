import Phaser from 'phaser';

const STORAGE_KEY = 'relay.gameplay.v11.twenty';

const FEATURES = [
  ['NOISE', 'SOUND SIGNATURE', 0x65d9ff],
  ['TRACKING', 'FOOTPRINTS', 0xb9a7ff],
  ['HEAT', 'HEAT TRAIL', 0xff6f91],
  ['OBSTACLE', 'WORLD MEMORY', 0xffb86b],
  ['ROUTES', 'RISK ENGINE', 0x73e6ff],
  ['MUTATION', 'MISSION SHIFT', 0xffd66b],
  ['COVER', 'IMPROVISED COVER', 0x8df4ff],
  ['MOMENTUM', 'TRAVERSAL CHAIN', 0x9eff7a],
  ['RECOVERY', 'RECOVERY WINDOW', 0x77ffcf],
  ['DECOY', 'TACTICAL NOISE', 0xff9f5b],
  ['CONTACT', 'RELIABILITY', 0xff8ee8],
  ['METHOD', 'REP BY METHOD', 0xffd66b],
  ['CARGO', 'PHYSICS RISK', 0x7dd3fc],
  ['EMERGENCY', 'CHOICE EVENT', 0xff826e],
  ['OPPORTUNITY', 'WINDOW', 0x8dff8d],
  ['CHAIN', 'REACTION EVENT', 0xff5577],
  ['DECOY CARGO', 'FALSE DELIVERY', 0xc4a0ff],
  ['LOADOUT', 'SAFEHOUSE KIT', 0x77ffcf],
  ['TIME DEBT', 'MISSION DELAY', 0xffb86b],
  ['MARKER', 'PLAYER ROUTE', 0x65d9ff],
];

const freshState = () => ({
  version: 1,
  values: Array.from({ length: FEATURES.length }, () => 0),
  lastEvent: 'READY',
});

function loadState() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    const state = freshState();
    state.values = Array.isArray(parsed.values) && parsed.values.length === FEATURES.length
      ? parsed.values.map(value => Number.isFinite(Number(value)) ? Number(value) : 0)
      : state.values;
    state.lastEvent = typeof parsed.lastEvent === 'string' ? parsed.lastEvent : state.lastEvent;
    return state;
  } catch {
    return freshState();
  }
}

function saveState(state) {
  try { window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* optional */ }
}

function label(scene, x, y, text, style = {}) {
  return scene.add.text(x, y, text, {
    fontFamily: 'monospace',
    fontSize: style.fontSize || '9px',
    fontStyle: style.fontStyle || 'bold',
    color: style.color || '#e9fbff',
    align: style.align || 'center',
    wordWrap: { width: style.width || 180 },
  }).setOrigin(style.originX ?? 0.5, style.originY ?? 0.5);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function installCard(scene, x, y, width, height, index, onActivate) {
  const [, title, color] = FEATURES[index];
  const card = scene.add.rectangle(x, y, width, height, 0x07131f, 0.96)
    .setStrokeStyle(1, color, 0.55)
    .setInteractive({ useHandCursor: true });
  const glow = scene.add.rectangle(x, y, width + 5, height + 5, color, 0.035).setDepth(card.depth - 1);
  const icon = scene.add.circle(x - width / 2 + 20, y - 1, 9, color, 0.16)
    .setStrokeStyle(1, color, 0.85);
  const number = label(scene, x - width / 2 + 20, y - 1, String(index + 1).padStart(2, '0'), { fontSize: '7px', color: '#ffffff' });
  const titleText = label(scene, x - width / 2 + 38, y - 8, title, { originX: 0, fontSize: width < 150 ? '8px' : '9px', width: width - 52 });
  const stateText = label(scene, x - width / 2 + 38, y + 9, 'READY', { originX: 0, fontSize: '7px', color: '#7593a1', width: width - 52 });
  const refs = { card, glow, icon, number, titleText, stateText };
  const setActive = active => {
    card.setStrokeStyle(active ? 2 : 1, color, active ? 1 : 0.55);
    glow.setAlpha(active ? 0.8 : 0.25);
  };
  card.on('pointerover', () => setActive(true));
  card.on('pointerout', () => setActive(false));
  card.on('pointerdown', () => onActivate(index, refs));
  return refs;
}

export function installGameplayExpansionV11Twenty(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__gameplayExpansionV11Installed) return;
  RunnerScene.prototype.__gameplayExpansionV11Installed = true;

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function gameplayV11Create(...args) {
    const result = originalCreate.apply(this, args);
    const scene = this;
    const state = loadState();
    const width = scene.scale.width || scene.cameras.main.width || 1280;
    const height = scene.scale.height || scene.cameras.main.height || 720;
    const mobile = width < 600;
    const columns = mobile ? 2 : 4;
    const rows = Math.ceil(FEATURES.length / columns);
    const gap = mobile ? 7 : 10;
    const side = mobile ? 10 : 22;
    const usableWidth = width - side * 2;
    const cardWidth = (usableWidth - gap * (columns - 1)) / columns;
    const cardHeight = mobile ? 43 : 48;
    const headerHeight = mobile ? 82 : 86;
    const gridHeight = rows * cardHeight + (rows - 1) * gap;
    const totalHeight = headerHeight + 10 + gridHeight;
    const top = Math.max(8, (height - totalHeight) * 0.5);
    const root = scene.add.container(0, 0).setScrollFactor(0).setDepth(930);
    const panel = scene.add.rectangle(width / 2, top + totalHeight / 2, width - side * 0.7, totalHeight, 0x040b13, 0.92)
      .setStrokeStyle(1, 0x65d9ff, 0.32);
    root.add(panel);
    root.add(label(scene, width / 2, top + 17, 'V11 // TWENTY NEW GAMEPLAY SYSTEMS', { fontSize: mobile ? '10px' : '12px', color: '#7ee7ff' }));
    root.add(label(scene, width / 2, top + 36, 'POINTER / TOUCH ONLY · EXISTING CONTROLS UNCHANGED', { fontSize: '7px', color: '#6d8794' }));
    const status = label(scene, width / 2, top + 62, state.lastEvent, { fontSize: '8px', color: '#b8e9f5', width: width - 50 });
    root.add(status);

    const cards = [];
    const nodes = [panel, status];
    const emit = (type, index, detail) => {
      scene.events.emit('relay:gameplay:v11', { type, index, detail, state });
    };

    const descriptions = [
      () => `SIGNATURE ${state.values[0] % 4 + 1}/4`,
      () => `TRAIL SEGMENTS ${state.values[1]}`,
      () => `HEAT ${clamp(state.values[2], 0, 100)}%`,
      () => `OBJECT STATE ${['INTACT', 'MOVED', 'DAMAGED', 'BLOCKED'][state.values[3] % 4]}`,
      () => `ROUTE ${['SAFE', 'FAST', 'PROFIT', 'ESCAPE'][state.values[4] % 4]}`,
      () => `MISSION BRANCH ${state.values[5] % 5 + 1}`,
      () => `COVER ${state.values[6] % 3 === 0 ? 'READY' : 'DEPLOYED'}`,
      () => `CHAIN ${state.values[7] % 6}/6`,
      () => `RECOVERY ${state.values[8] % 3 === 0 ? 'READY' : 'ACTIVE'}`,
      () => `DECOY SIGNAL ${state.values[9] % 4 + 1}`,
      () => `TRUST ${clamp(50 + state.values[10] * 5, 0, 100)}%`,
      () => `STYLE ${['CLEAN', 'STEALTH', 'FORCE', 'FAST'][state.values[11] % 4]}`,
      () => `RISK ${clamp(state.values[12] * 10, 0, 100)}%`,
      () => `CHOICE ${state.values[13] % 3 === 0 ? 'SAFE' : 'RISK'}`,
      () => `WINDOW ${state.values[14] % 4 === 0 ? 'OPEN' : 'SCANNING'}`,
      () => `CHAIN DEPTH ${state.values[15] % 5 + 1}`,
      () => `CARGO ${state.values[16] % 3 === 0 ? 'REAL' : 'DECOY'}`,
      () => `KIT ${['LIGHT', 'TACTICAL', 'CARGO', 'ESCAPE'][state.values[17] % 4]}`,
      () => `DEBT ${state.values[18]}`,
      () => `MARKERS ${state.values[19]}`,
    ];

    const activate = (index, refs) => {
      const actions = [
        () => ['NOISE SIGNATURE', 'QUIET', 'LOUD', 'DISTRACTION'][state.values[0] % 4],
        () => `FOOTPRINT ${state.values[1] + 1} RECORDED`,
        () => `HEAT ${state.values[2] % 2 ? 'COOLING' : 'RISING'}`,
        () => `OBSTACLE ${['MOVED', 'DAMAGED', 'BLOCKED', 'RESTORED'][state.values[3] % 4]}`,
        () => `ROUTE PROFILE ${['SAFE', 'FAST', 'PROFIT', 'ESCAPE'][state.values[4] % 4]}`,
        () => `MISSION MUTATED TO BRANCH ${state.values[5] % 5 + 1}`,
        () => `IMPROVISED COVER ${state.values[6] % 2 ? 'DEPLOYED' : 'PACKED'}`,
        () => `MOMENTUM CHAIN ${state.values[7] % 6 + 1}/6`,
        () => `RECOVERY WINDOW ${state.values[8] % 2 ? 'OPEN' : 'CLOSED'}`,
        () => `TACTICAL NOISE ${state.values[9] % 2 ? 'DISTRACTION' : 'SILENT'}`,
        () => `CONTACT RELIABILITY ${clamp(50 + state.values[10] * 5, 0, 100)}%`,
        () => `METHOD RECORDED: ${['CLEAN', 'STEALTH', 'FORCE', 'FAST'][state.values[11] % 4]}`,
        () => `CARGO HANDLING RISK ${clamp(state.values[12] * 10, 0, 100)}%`,
        () => `EMERGENCY CHOICE: ${state.values[13] % 2 ? 'RISK' : 'SAFE'}`,
        () => `OPPORTUNITY WINDOW ${state.values[14] % 4 === 0 ? 'OPENED' : 'SCANNED'}`,
        () => `CHAIN REACTION DEPTH ${state.values[15] % 5 + 1}`,
        () => `DECOY CARGO ${state.values[16] % 2 ? 'DEPLOYED' : 'RECALLED'}`,
        () => `SAFEHOUSE LOADOUT ${['LIGHT', 'TACTICAL', 'CARGO', 'ESCAPE'][state.values[17] % 4]}`,
        () => `MISSION TIME DEBT ${state.values[18]} MIN`,
        () => `ROUTE MARKER ${state.values[19] + 1} PLACED`,
      ];

      state.values[index] += 1;
      state.lastEvent = actions[index]();
      saveState(state);
      status.setText(state.lastEvent);
      refs.stateText.setText(descriptions[index]());
      refs.card.setStrokeStyle(2, FEATURES[index][2], 1);
      scene.tweens.add({ targets: refs.card, alpha: { from: 0.7, to: 1 }, duration: 110, yoyo: true });
      emit('activate', index, state.lastEvent);
    };

    for (let index = 0; index < FEATURES.length; index += 1) {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const x = side + cardWidth / 2 + col * (cardWidth + gap);
      const y = top + headerHeight + 10 + cardHeight / 2 + row * (cardHeight + gap);
      const refs = installCard(scene, x, y, cardWidth, cardHeight, index, activate);
      refs.stateText.setText(descriptions[index]());
      cards.push(refs);
      nodes.push(refs.card, refs.glow, refs.icon, refs.number, refs.titleText, refs.stateText);
    }

    scene.__relayV11 = { state, cards, root, emit };
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      nodes.forEach(node => node?.destroy?.());
      scene.__relayV11 = null;
    });

    return result;
  };
}
