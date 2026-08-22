/* UPDATE 19 — SIGNAL NETWORK V1
   Additive gameplay layer. No ownership over movement, enemy AI, Cargo V2, progression or saves.
   Nodes are derived from existing mission signal coordinates and live entirely inside this runtime.
*/

const VERSION = 'V1';
const STORAGE_KEY = 'relay-signal-network-v1';
const ROOT_ID = 'signalNetworkV1';

export const NODE_PROFILES = [
  { kind: 'SCAN', label: 'UPLINK SCAN', short: 'SCAN', accent: 0x8df4ff, css: '#8df4ff', description: 'Reveals the next signal chain.', reward: 'SIGNAL MAP' },
  { kind: 'BOOST', label: 'POWER SURGE', short: 'SURGE', accent: 0xffd06e, css: '#ffd06e', description: 'Restores combat resources and kicks the run forward.', reward: 'RESOURCE SURGE' },
  { kind: 'LINK', label: 'NETWORK LINK', short: 'LINK', accent: 0xc8b5ff, css: '#c8b5ff', description: 'Synchronizes the district relay.', reward: 'NETWORK STABLE' },
];

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
export const chooseNodeSignalIndices = length => {
  const count = Math.max(0, Number(length) || 0);
  if (count <= 3) return Array.from({ length: count }, (_, index) => index);
  const indexes = [Math.round((count - 1) * .22), Math.round((count - 1) * .52), Math.round((count - 1) * .80)];
  return [...new Set(indexes)];
};

export function networkKey(missionId) { return `${STORAGE_KEY}:${missionId}`; }

export function createNetworkModel(missionId, signalPositions = []) {
  const indices = chooseNodeSignalIndices(signalPositions.length);
  return indices.map((signalIndex, index) => ({
    id: `relay-node-${missionId}-${index + 1}`,
    missionId,
    nodeIndex: index,
    signalIndex,
    position: signalPositions[signalIndex] ? [...signalPositions[signalIndex]] : [0, 0],
    profile: NODE_PROFILES[index % NODE_PROFILES.length],
  }));
}

function readPersistent() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function writePersistent(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function persistentMissionState(missionId) {
  const all = readPersistent();
  const current = all[missionId] || { linked: [], stable: false };
  return { all, current };
}

function nodeLabel(scene, node) {
  const stable = persistentMissionState(node.missionId).current.stable;
  const state = node.active ? 'LINKING' : stable ? 'SYNCED' : 'STANDBY';
  const text = node.profile.kind === 'SCAN' && !node.active ? 'E  UPLINK SCAN' : node.profile.kind === 'BOOST' && !node.active ? 'E  POWER SURGE' : node.profile.kind === 'LINK' && !node.active ? 'E  NETWORK LINK' : state;
  if (!node.text) node.text = scene.add.text(node.position[0], node.position[1] - 62, text, { fontFamily: 'DM Mono', fontSize: '10px', color: node.profile.css, stroke: '#030914', strokeThickness: 5, align: 'center', letterSpacing: 1.4 }).setOrigin(.5).setDepth(32);
  else node.text.setText(text);
}

function toast(text, accent = '#8df4ff', duration = 1300) {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  root.style.setProperty('--network-accent', accent);
  const title = root.querySelector('.signal-network-title');
  const detail = root.querySelector('.signal-network-detail');
  if (title) title.textContent = text;
  if (detail) detail.textContent = '';
  root.classList.remove('is-visible', 'is-burst');
  void root.offsetWidth;
  root.classList.add('is-visible', 'is-burst');
  window.clearTimeout(root.__hideTimer);
  root.__hideTimer = window.setTimeout(() => root.classList.remove('is-visible'), duration);
}

function createToastRoot() {
  if (document.getElementById(ROOT_ID)) return document.getElementById(ROOT_ID);
  const root = document.createElement('section');
  root.id = ROOT_ID;
  root.setAttribute('aria-live', 'polite');
  root.innerHTML = '<div class="signal-network-card"><div class="signal-network-tag">RELAY NETWORK // LIVE</div><div class="signal-network-title">NETWORK NODE</div><div class="signal-network-detail"></div></div>';
  document.body.appendChild(root);
  return root;
}

function destroyChildren(node) {
  node.visuals?.forEach(item => item?.destroy?.());
  node.visuals = [];
  node.text?.destroy?.();
  node.text = null;
}

function createNodeVisual(scene, node) {
  const [x, y] = node.position;
  const profile = node.profile;
  const container = scene.add.container(x, y).setDepth(28);
  const glow = scene.add.circle(0, 0, 24, profile.accent, .08);
  const ring = scene.add.circle(0, 0, 19, 0x050914, .78).setStrokeStyle(2, profile.accent, .78);
  const core = scene.add.circle(0, 0, 8, profile.accent, .95).setStrokeStyle(2, 0xffffff, .65);
  const inner = scene.add.circle(0, 0, 3, 0xffffff, .95);
  const cross = scene.add.graphics();
  cross.lineStyle(1, profile.accent, .45);
  cross.lineBetween(-30, 0, 30, 0);
  cross.lineBetween(0, -30, 0, 30);
  const hit = scene.add.circle(0, 0, 64, profile.accent, 0).setInteractive({ useHandCursor: false });
  container.add([glow, ring, core, inner, cross, hit]);
  node.container = container;
  node.visuals = [container];
  node.hit = hit;
  node.active = false;
  nodeLabel(scene, node);

  scene.tweens.add({ targets: [glow, ring], scale: 1.25, alpha: 0.18, yoyo: true, repeat: -1, duration: 900 + node.nodeIndex * 120, ease: 'Sine.inOut' });
  scene.tweens.add({ targets: core, scale: 1.35, yoyo: true, repeat: -1, duration: 500 + node.nodeIndex * 90, ease: 'Sine.inOut' });

  hit.on('pointerdown', () => tryActivate(scene, node));
  return node;
}

function drawLink(scene, from, to, active) {
  const beam = scene.add.graphics().setDepth(27);
  beam.lineStyle(active ? 3 : 1, active ? 0xc8b5ff : 0x8df4ff, active ? .65 : .14);
  beam.lineBetween(from.position[0], from.position[1], to.position[0], to.position[1]);
  if (active) {
    scene.tweens.add({ targets: beam, alpha: { from: .22, to: .72 }, yoyo: true, repeat: -1, duration: 720 });
  }
  return beam;
}

function pulseAt(scene, x, y, color, radius = 82) {
  const pulse = scene.add.circle(x, y, 12, color, .08).setStrokeStyle(2, color, .8).setDepth(31);
  scene.tweens.add({ targets: pulse, radius: radius, alpha: 0, duration: 700, ease: 'Cubic.out', onComplete: () => pulse.destroy() });
}

function revealSignals(scene) {
  const signals = scene?.mission?.signals || [];
  const playerX = Number(scene.player?.x || 0);
  const ahead = signals.filter(([x]) => Number(x) > playerX + 120).slice(0, 4);
  ahead.forEach(([x, y], index) => {
    const marker = scene.add.circle(x, y, 22, 0x8df4ff, .04).setStrokeStyle(2, 0x8df4ff, .82).setDepth(29);
    const tag = scene.add.text(x, y - 30, `UPLINK ${String(index + 1).padStart(2, '0')}`, { fontFamily: 'DM Mono', fontSize: '8px', color: '#8df4ff', stroke: '#030914', strokeThickness: 4 }).setOrigin(.5).setDepth(30);
    scene.tweens.add({ targets: [marker, tag], alpha: 0, scale: 1.45, delay: 4200, duration: 700, onComplete: () => { marker.destroy(); tag.destroy(); } });
    scene.tweens.add({ targets: marker, scale: 1.35, yoyo: true, repeat: 5, duration: 340, ease: 'Sine.inOut' });
  });
  toast('UPLINK SCAN COMPLETE', '#8df4ff', 1450);
  scene.game?.events?.emit?.('signal-network', { type: 'scan', count: ahead.length });
}

function applyPowerSurge(scene) {
  if (typeof scene.ammo === 'number' && typeof scene.ammoMax === 'number') scene.ammo = Math.min(scene.ammoMax, scene.ammoMax);
  if (typeof scene.energy === 'number' && typeof scene.energyMax === 'number') scene.energy = Math.min(scene.energyMax, scene.energyMax);
  scene.blasterCooldown = 0;
  scene.swordCooldown = 0;
  scene.boostCooldown = 0;
  if (scene.player?.body) scene.player.body.setVelocityX?.(Math.max(scene.player.body.velocity.x || 0, 540));
  scene.game?.events?.emit?.('ammo', 100);
  scene.game?.events?.emit?.('signal-network', { type: 'surge', ammoRestored: true, energyRestored: typeof scene.energy === 'number' });
  toast('POWER SURGE', '#ffd06e', 1250);
}

function applyNetworkLink(scene) {
  scene.__signalNetworkOverdriveUntil = performance.now() + 2200;
  if (scene.player?.body) scene.player.body.setVelocityX?.(Math.max(scene.player.body.velocity.x || 0, 680));
  pulseAt(scene, scene.player?.x || 0, scene.player?.y || 0, 0xc8b5ff, 120);
  scene.game?.events?.emit?.('signal-network', { type: 'link', overdriveMs: 2200 });
  toast('NETWORK LINK // STABLE', '#c8b5ff', 1550);
}

function persistActivation(node, stable = false) {
  const { all, current } = persistentMissionState(node.missionId);
  const linked = [...new Set([...(current.linked || []), node.id])];
  all[node.missionId] = { linked, stable: stable || Boolean(current.stable) };
  writePersistent(all);
}

function setNodeActive(scene, node) {
  node.active = true;
  node.container?.setAlpha?.(1);
  node.container?.list?.forEach(child => {
    if (child?.setStrokeStyle && child.type !== 'Text') {
      try { child.setStrokeStyle(2, node.profile.accent, 1); } catch {}
    }
  });
  nodeLabel(scene, node);
  const ring = scene.add.circle(node.position[0], node.position[1], 20, node.profile.accent, .05).setStrokeStyle(2, node.profile.accent, .95).setDepth(30);
  node.visuals.push(ring);
  scene.tweens.add({ targets: ring, scale: 3.4, alpha: 0, duration: 780, onComplete: () => ring.destroy() });
  pulseAt(scene, node.position[0], node.position[1], node.profile.accent, 100);
}

function completeNetwork(scene, state) {
  if (state.current.stable) {
    toast('NETWORK ALREADY STABLE', '#eaffff', 1150);
    return;
  }
  state.current.stable = true;
  state.all[scene.mission.id] = state.current;
  writePersistent(state.all);
  scene.__signalNetworkStable = true;
  const [goalX, goalY] = [scene.mission.goal?.x || scene.goal?.x || scene.player?.x || 0, scene.mission.goal?.y || scene.goal?.y || scene.player?.y || 0];
  const burst = scene.add.circle(goalX, goalY, 18, 0xc8b5ff, .12).setStrokeStyle(2, 0xeaffff, .85).setDepth(28);
  scene.tweens.add({ targets: burst, scale: 7, alpha: 0, duration: 1150, onComplete: () => burst.destroy() });
  toast('NETWORK STABLE // DISTRICT LINKED', '#eaffff', 1850);
  scene.game?.events?.emit?.('signal-network-complete', { missionId: scene.mission.id, linkedNodes: state.current.linked.length, version: VERSION });
}

function tryActivate(scene, node) {
  if (!scene?.player || scene.finished || scene.cinematicActive || window.__relayCinematicLock || scene.firstTimeTutorial) return false;
  if (node.active) return false;
  const distance = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, node.position[0], node.position[1]);
  if (distance > 120) {
    toast('MOVE CLOSER TO RELAY NODE', node.profile.css, 900);
    return false;
  }

  setNodeActive(scene, node);
  const state = persistentMissionState(node.missionId);
  persistActivation(node);
  if (node.profile.kind === 'SCAN') revealSignals(scene);
  if (node.profile.kind === 'BOOST') applyPowerSurge(scene);
  if (node.profile.kind === 'LINK') applyNetworkLink(scene);

  const activeCount = scene.__signalNetworkNodes.filter(item => item.active).length;
  if (activeCount === scene.__signalNetworkNodes.length) completeNetwork(scene, persistentMissionState(node.missionId));
  else if (activeCount === 1) toast('RELAY NODE LINKED', node.profile.css, 1100);
  scene.game?.events?.emit?.('signal-network-node', { missionId: node.missionId, nodeId: node.id, type: node.profile.kind, activeCount, total: scene.__signalNetworkNodes.length });
  return true;
}

function bindScene(scene) {
  if (!scene?.mission?.id || scene.__signalNetworkV1Bound) return;
  scene.__signalNetworkV1Bound = true;
  createToastRoot();

  const model = createNetworkModel(scene.mission.id, scene.mission.signals || []);
  scene.__signalNetworkNodes = model.map(node => createNodeVisual(scene, node));
  scene.__signalNetworkLinks = [];
  for (let i = 1; i < scene.__signalNetworkNodes.length; i += 1) {
    scene.__signalNetworkLinks.push(drawLink(scene, scene.__signalNetworkNodes[i - 1], scene.__signalNetworkNodes[i], false));
  }

  const onKey = () => {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const node of scene.__signalNetworkNodes) {
      if (node.active) continue;
      const distance = Phaser.Math.Distance.Between(scene.player?.x || 0, scene.player?.y || 0, node.position[0], node.position[1]);
      if (distance < nearestDistance) { nearestDistance = distance; nearest = node; }
    }
    if (nearest) tryActivate(scene, nearest);
  };
  scene.input?.keyboard?.on?.('keydown-E', onKey);
  scene.__signalNetworkKeyHandler = onKey;

  const updateLinks = () => {
    scene.__signalNetworkLinks.forEach((beam, index) => beam?.setAlpha?.(scene.__signalNetworkNodes[index]?.active && scene.__signalNetworkNodes[index + 1]?.active ? .95 : .16));
  };
  scene.__signalNetworkUpdateLinks = updateLinks;

  scene.events?.once?.('shutdown', () => destroyScene(scene));
  scene.events?.once?.('destroy', () => destroyScene(scene));
  updateLinks();

  scene.__signalNetworkRuntimeTick = window.setInterval(() => {
    if (!scene.sys?.isActive?.()) return;
    if (scene.finished || scene.cinematicActive || window.__relayCinematicLock || scene.firstTimeTutorial) return;
    scene.__signalNetworkNodes.forEach(node => nodeLabel(scene, node));
    updateLinks();
  }, 180);

  if (!window.__relaySignalNetworkV1) window.__relaySignalNetworkV1 = api;
}

function destroyScene(scene) {
  if (!scene || !scene.__signalNetworkV1Bound) return;
  scene.__signalNetworkV1Bound = false;
  if (scene.__signalNetworkRuntimeTick) window.clearInterval(scene.__signalNetworkRuntimeTick);
  scene.input?.keyboard?.off?.('keydown-E', scene.__signalNetworkKeyHandler);
  scene.__signalNetworkNodes?.forEach(destroyChildren);
  scene.__signalNetworkLinks?.forEach(item => item?.destroy?.());
  scene.__signalNetworkNodes = [];
  scene.__signalNetworkLinks = [];
}

const api = {
  version: VERSION,
  profiles: NODE_PROFILES,
  chooseNodeSignalIndices,
  createNetworkModel,
  networkKey,
  resetMission(missionId) {
    const all = readPersistent();
    delete all[missionId];
    writePersistent(all);
  },
};

function init() {
  if (window.__relaySignalNetworkV1) return;
  window.__relaySignalNetworkV1 = api;
  createToastRoot();
  window.addEventListener('relay:runner-scene-ready', event => bindScene(event.detail?.scene || window.__relayRunnerScene));
  if (window.__relayRunnerScene) bindScene(window.__relayRunnerScene);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}
