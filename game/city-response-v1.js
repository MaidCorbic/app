/* UPDATE 20 — CITY RESPONSE V2
   Living-world gameplay reaction layer.
   Finish UI is intentionally untouched.
*/
const STORAGE_KEY = 'relay-city-response-v1';
const ROOT_ID = 'cityResponseV1';
const VERSION = 'V2';

export const RESPONSE_PROFILES = {
  CLEAN: {
    label: 'CITY CALM',
    accent: '#8df4ff',
    line: 'LOCAL RELAYS REMAIN OPEN',
    detail: 'Clean delivery. The district remains stable.',
    event: 'RELAY RECOVERY',
  },
  DAMAGED: {
    label: 'CITY ALERT',
    accent: '#ff9d6e',
    line: 'SECURITY PRESSURE DETECTED',
    detail: 'Your last delivery left the district on alert.',
    event: 'SECURITY RESPONSE',
  },
  NETWORKED: {
    label: 'CITY LINKED',
    accent: '#c8b5ff',
    line: 'RELAY RESPONSE PROPAGATED',
    detail: 'The network remembers your last intervention.',
    event: 'NETWORK SURGE',
  },
};

const safeNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function classifyResponse({ packageCondition = 100, networkLinked = false, collisions = 0, alarms = 0 } = {}) {
  if (networkLinked) return 'NETWORKED';
  if (safeNumber(packageCondition) < 70 || safeNumber(collisions) >= 4 || safeNumber(alarms) >= 3) return 'DAMAGED';
  return 'CLEAN';
}

export function buildDistrictRecord({ missionId, district, response, signals = 0, packageCondition = 100, score = 0 } = {}) {
  return {
    missionId: String(missionId || ''),
    district: String(district || ''),
    response: RESPONSE_PROFILES[response] ? response : 'CLEAN',
    signals: safeNumber(signals),
    packageCondition: Math.max(0, Math.min(100, safeNumber(packageCondition))),
    score: Math.max(0, safeNumber(score)),
    updatedAt: Date.now(),
    version: VERSION,
  };
}

function readStore() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function writeStore(value) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch {}
}

export function loadDistrictRecord(district) {
  if (!district) return null;
  return readStore()[district] || null;
}

function saveDistrictRecord(record) {
  if (!record?.district) return;
  const store = readStore();
  store[record.district] = record;
  writeStore(store);
}

function root() {
  let node = document.getElementById(ROOT_ID);
  if (node) return node;
  node = document.createElement('section');
  node.id = ROOT_ID;
  node.setAttribute('aria-live', 'polite');
  node.setAttribute('role', 'status');
  node.innerHTML = '<div class="city-response-card"><div class="city-response-kicker">CITY RESPONSE // LIVE</div><div class="city-response-title"></div><div class="city-response-line"></div><div class="city-response-detail"></div></div>';
  document.body.appendChild(node);
  return node;
}

function showResponse(response, mode = 'visit') {
  const profile = RESPONSE_PROFILES[response] || RESPONSE_PROFILES.CLEAN;
  const node = root();
  node.style.setProperty('--city-response-accent', profile.accent);
  node.dataset.response = response;
  node.querySelector('.city-response-title').textContent = mode === 'event' ? profile.event : profile.label;
  node.querySelector('.city-response-line').textContent = profile.line;
  node.querySelector('.city-response-detail').textContent = profile.detail;
  node.classList.remove('is-visible', 'is-burst');
  void node.offsetWidth;
  node.classList.add('is-visible', 'is-burst');
  window.clearTimeout(node.__hideTimer);
  node.__hideTimer = window.setTimeout(() => node.classList.remove('is-visible', 'is-burst'), mode === 'event' ? 2400 : 1900);
}

function clearGameplayVisuals(scene) {
  scene.__cityResponseApplied = false;
  scene.__cityResponseVisuals?.forEach(item => item?.destroy?.());
  scene.__cityResponseVisuals = [];
}

function pulseOverlay(scene, color, duration = 700, alpha = .11) {
  const width = Number(scene.scale?.width || 1280);
  const height = Number(scene.scale?.height || 720);
  const overlay = scene.add?.rectangle?.(width / 2, height / 2, width, height, color, alpha)?.setScrollFactor?.(0)?.setDepth?.(999);
  if (!overlay) return;
  scene.__cityResponseVisuals ||= [];
  scene.__cityResponseVisuals.push(overlay);
  scene.tweens?.add?.({
    targets: overlay,
    alpha: { from: alpha, to: 0 },
    duration,
    ease: 'Quad.easeOut',
    onComplete: () => overlay.destroy?.(),
  });
}

function spawnRelayPulse(scene, color, radius = 14, repeat = 2) {
  const x = Number(scene.player?.x || 180);
  const y = Number(scene.player?.y || 520) - 70;
  const ring = scene.add?.circle?.(x, y, radius, color, .08)?.setStrokeStyle?.(2, color, .9)?.setDepth?.(110);
  if (!ring) return;
  scene.__cityResponseVisuals ||= [];
  scene.__cityResponseVisuals.push(ring);
  scene.tweens?.add?.({
    targets: ring,
    scale: 3.4,
    alpha: 0,
    duration: 850,
    repeat,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy?.(),
  });
}

function spawnRelayBars(scene, color) {
  const width = Number(scene.scale?.width || 1280);
  const y = Number(scene.player?.y || 520) - 120;
  for (let index = 0; index < 3; index += 1) {
    const x = width * (0.36 + index * 0.14);
    const bar = scene.add?.rectangle?.(x, y, 4, 56, color, .55)?.setDepth?.(108);
    if (!bar) continue;
    scene.__cityResponseVisuals ||= [];
    scene.__cityResponseVisuals.push(bar);
    scene.tweens?.add?.({
      targets: bar,
      scaleY: 0.18,
      alpha: 0,
      duration: 900 + index * 100,
      delay: index * 90,
      ease: 'Sine.easeOut',
      onComplete: () => bar.destroy?.(),
    });
  }
}

function applyGameplayResponse(scene, record) {
  if (!scene || scene.__cityResponseApplied || !record?.response) return;
  if (scene.cinematicActive || window.__relayCinematicLock || scene.firstTimeTutorial || !scene.player) return;

  scene.__cityResponseApplied = true;
  scene.__cityResponseActive = record.response;
  scene.__cityResponseVisuals = [];

  const response = record.response;
  const profile = RESPONSE_PROFILES[response];
  showResponse(response, 'event');

  if (response === 'CLEAN') {
    pulseOverlay(scene, 0x8df4ff, 750, .08);
    spawnRelayPulse(scene, 0x8df4ff, 12, 2);
    spawnRelayBars(scene, 0x8df4ff);
    scene.events?.emit?.('feedback', 'signal');
  } else if (response === 'DAMAGED') {
    pulseOverlay(scene, 0xff6a4e, 900, .1);
    spawnRelayPulse(scene, 0xff9d6e, 16, 3);
    spawnRelayBars(scene, 0xff9d6e);
    scene.events?.emit?.('feedback', 'warning');
  } else {
    pulseOverlay(scene, 0xc8b5ff, 1000, .09);
    spawnRelayPulse(scene, 0xc8b5ff, 18, 4);
    spawnRelayBars(scene, 0xc8b5ff);
    scene.events?.emit?.('feedback', 'signal');
  }

  window.setTimeout(() => {
    scene.game?.events?.emit?.('city-response-event', {
      type: response,
      label: profile.label,
      event: profile.event,
      district: record.district,
      missionId: record.missionId,
    });
  }, 180);
}

function getMissionDistrict(scene) {
  return String(scene?.mission?.district || scene?.mission?.districtId || '').trim() || null;
}

function getPackageCondition(scene) {
  return Number.isFinite(Number(scene?.packageCondition)) ? Number(scene.packageCondition) : 100;
}

function handleMissionComplete(event) {
  const scene = event?.detail?.scene;
  const mission = scene?.mission;
  const district = getMissionDistrict(scene);
  if (!scene || !mission?.id || !district || scene.__cityResponseRecorded) return;

  scene.__cityResponseRecorded = true;
  const networkLinked = Boolean(scene.__signalNetworkStable || event.detail?.networkLinked);
  const packageCondition = getPackageCondition(scene);
  const response = classifyResponse({
    packageCondition,
    networkLinked,
    collisions: safeNumber(scene.collisions),
    alarms: safeNumber(scene.alarms),
  });

  const record = buildDistrictRecord({
    missionId: mission.id,
    district,
    response,
    signals: safeNumber(scene.collected),
    packageCondition,
    score: safeNumber(scene.collected) * 100 + safeNumber(scene.secretsCollected) * 250,
  });

  saveDistrictRecord(record);
  scene.__cityResponse = response;
}

function bindScene(scene) {
  if (!scene || scene.__cityResponseBound) return;
  scene.__cityResponseBound = true;
  scene.__cityResponseApplied = false;
  scene.__cityResponseVisuals = [];

  const district = getMissionDistrict(scene);
  if (!district) return;

  const record = loadDistrictRecord(district);
  if (record) {
    const delay = scene.firstTimeTutorial ? 0 : 650;
    window.setTimeout(() => applyGameplayResponse(scene, record), delay);
  }

  scene.events?.once?.('shutdown', () => {
    clearGameplayVisuals(scene);
    scene.__cityResponseBound = false;
    scene.__cityResponseRecorded = false;
    scene.__cityResponse = null;
    scene.__cityResponseActive = null;
  });

  scene.events?.once?.('destroy', () => {
    clearGameplayVisuals(scene);
    scene.__cityResponseBound = false;
    scene.__cityResponseRecorded = false;
    scene.__cityResponse = null;
    scene.__cityResponseActive = null;
  });
}

function tick() {
  const scene = window.__relayRunnerScene;
  if (scene?.mission?.id) bindScene(scene);
}

if (typeof window !== 'undefined' && !window.__relayCityResponseV1) {
  window.__relayCityResponseV1 = true;
  window.addEventListener('relay:mission-complete', handleMissionComplete, { passive: true });
  window.addEventListener('relay:signal-network-complete', () => {
    const scene = window.__relayRunnerScene;
    if (scene) scene.__signalNetworkStable = true;
  }, { passive: true });
  window.setInterval(tick, 300);
}
