/* UPDATE 20 — CITY RESPONSE V1
   Additive living-world layer.
   Records the outcome of a completed mission in a dedicated namespace and
   applies a small, non-authoritative response presentation to the next visit.
   It does not modify progression, missions, movement, enemy AI or Cargo state.
*/

const STORAGE_KEY = 'relay-city-response-v1';
const ROOT_ID = 'cityResponseV1';
const VERSION = 'V1';

export const RESPONSE_PROFILES = {
  CLEAN: {
    label: 'CITY CALM',
    accent: '#8df4ff',
    line: 'LOCAL RELAYS REMAIN OPEN',
    detail: 'Your last run kept the district stable.',
  },
  DAMAGED: {
    label: 'CITY ALERT',
    accent: '#ff9d6e',
    line: 'SECURITY PRESSURE DETECTED',
    detail: 'The district is reacting to the last delivery.',
  },
  NETWORKED: {
    label: 'CITY LINKED',
    accent: '#c8b5ff',
    line: 'RELAY RESPONSE PROPAGATED',
    detail: 'The network remembers your last intervention.',
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
  node.dataset.mode = mode;
  const title = node.querySelector('.city-response-title');
  const line = node.querySelector('.city-response-line');
  const detail = node.querySelector('.city-response-detail');
  if (title) title.textContent = mode === 'complete' ? `${profile.label} // RESPONSE UPDATED` : profile.label;
  if (line) line.textContent = profile.line;
  if (detail) detail.textContent = profile.detail;
  node.classList.remove('is-visible', 'is-burst', 'is-complete');
  void node.offsetWidth;
  node.classList.add('is-visible', mode === 'complete' ? 'is-complete' : 'is-burst');
  window.clearTimeout(node.__hideTimer);
  node.__hideTimer = window.setTimeout(() => node.classList.remove('is-visible', 'is-burst', 'is-complete'), mode === 'complete' ? 3000 : 1900);
}

function responseVisuals(scene, record) {
  if (!scene || scene.__cityResponseApplied) return;
  if (scene.finished || scene.cinematicActive || window.__relayCinematicLock || scene.firstTimeTutorial) return;
  scene.__cityResponseApplied = true;

  const response = record?.response;
  if (!response) return;

  showResponse(response, 'visit');

  const color = response === 'DAMAGED' ? 0xff9d6e : response === 'NETWORKED' ? 0xc8b5ff : 0x8df4ff;
  const width = Math.max(640, Number(scene.scale?.width || 1200));
  const x = Number(scene.cameras?.main?.scrollX || 0) + width * .72;
  const y = Number(scene.player?.y || 520) - 90;

  if (response === 'DAMAGED') {
    const alert = scene.add?.graphics?.().setDepth?.(25);
    alert?.lineStyle?.(2, color, .44);
    alert?.strokeRect?.(x - 18, y - 18, 36, 36);
    if (alert) {
      scene.tweens?.add?.({ targets: alert, alpha: { from: .18, to: .72 }, yoyo: true, repeat: 5, duration: 260 });
      window.setTimeout(() => alert.destroy?.(), 3200);
    }
    scene.game?.events?.emit?.('city-response', { type: response, district: record.district });
    return;
  }

  if (response === 'NETWORKED') {
    const beacon = scene.add?.circle?.(x, y, 14, color, .12)?.setStrokeStyle?.(2, color, .86)?.setDepth?.(25);
    if (beacon) {
      scene.tweens?.add?.({ targets: beacon, scale: 3.2, alpha: 0, duration: 1200, repeat: 1, onComplete: () => beacon.destroy?.() });
    }
    scene.game?.events?.emit?.('city-response', { type: response, district: record.district });
    return;
  }

  const calm = scene.add?.circle?.(x, y, 9, color, .08)?.setStrokeStyle?.(2, color, .56)?.setDepth?.(25);
  if (calm) {
    scene.tweens?.add?.({ targets: calm, scale: 2.1, alpha: 0, duration: 1000, onComplete: () => calm.destroy?.() });
  }
  scene.game?.events?.emit?.('city-response', { type: response, district: record.district });
}

function getMissionDistrict(scene) {
  return String(scene?.mission?.district || scene?.mission?.districtId || '').trim() || null;
}

function getPackageCondition(scene) {
  const value = scene?.packageCondition;
  return Number.isFinite(Number(value)) ? Number(value) : 100;
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

  // The finish overlay may sit above normal presentation layers. Show the response
  // immediately and re-pulse after the overlay has had a chance to mount.
  showResponse(response, 'complete');
  window.setTimeout(() => showResponse(response, 'complete'), 80);
}

function bindScene(scene) {
  if (!scene || scene.__cityResponseBound) return;
  scene.__cityResponseBound = true;
  const district = getMissionDistrict(scene);
  if (!district) return;

  const record = loadDistrictRecord(district);
  if (record) responseVisuals(scene, record);
  scene.events?.once?.('shutdown', () => {
    scene.__cityResponseApplied = false;
    scene.__cityResponseBound = false;
    scene.__cityResponseRecorded = false;
  });
  scene.events?.once?.('destroy', () => {
    scene.__cityResponseApplied = false;
    scene.__cityResponseBound = false;
    scene.__cityResponseRecorded = false;
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
