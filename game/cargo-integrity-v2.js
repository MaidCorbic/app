import { packages } from './src/packages.js';

const STYLE_ID = 'cargo-integrity-v2-style';
const ROOT_ID = 'cargoIntegrityV2';
const VERSION = 'V2';

const PACKAGE_PROFILES = {
  STANDARD: { label: 'STANDARD', accent: '#8df4ff', damageMultiplier: 0.72, warningAt: 55, criticalAt: 28, effect: 'STABLE CARGO', description: 'Balanced protection for the baseline route.' },
  URGENT: { label: 'URGENT', accent: '#ffbd7a', damageMultiplier: 0.82, warningAt: 62, criticalAt: 34, effect: 'TIME PRESSURE', description: 'Low impact damage, higher urgency near the route target.' },
  FRAGILE: { label: 'FRAGILE', accent: '#b993ff', damageMultiplier: 1.65, warningAt: 62, criticalAt: 30, effect: 'IMPACT SENSITIVE', description: 'Impacts distort the relay and rapidly push the package toward critical.' },
  'HIGH VALUE': { label: 'HIGH VALUE', accent: '#ffd06e', damageMultiplier: 1.18, warningAt: 66, criticalAt: 34, effect: 'EXPOSURE', description: 'Hostile pressure makes the delivery more fragile.' },
  SECRET: { label: 'SECRET', accent: '#c8b5ff', damageMultiplier: 1.28, warningAt: 68, criticalAt: 38, effect: 'SIGNAL INSTABILITY', description: 'The package becomes anomalous under sustained pressure.' },
  OVERSIZED: { label: 'OVERSIZED', accent: '#ff826e', damageMultiplier: 1.08, warningAt: 64, criticalAt: 35, effect: 'HEAVY LOAD', description: 'Hard landings and collisions cost more while carrying the core.' },
  'PRIME RELAY': { label: 'PRIME RELAY', accent: '#eaffff', damageMultiplier: 1.22, warningAt: 75, criticalAt: 40, effect: 'RELAY STABILITY', description: 'Endgame cargo with a strict but forgiving stability threshold.' },
};

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const profileForType = type => PACKAGE_PROFILES[type] || PACKAGE_PROFILES.STANDARD;
const missionIdForScene = scene => scene?.mission?.id || scene?.registry?.get?.('missionId') || null;
const packageForScene = scene => {
  const missionId = missionIdForScene(scene);
  return scene?.package || packages[missionId] || null;
};

export function getCargoProfile(packageType) { return { ...profileForType(String(packageType || 'STANDARD').toUpperCase()) }; }

export function classifyCargoCondition(integrity) {
  const value = clamp(integrity);
  if (value >= 90) return 'PERFECT';
  if (value >= 70) return 'STABLE';
  if (value >= 40) return 'DAMAGED';
  if (value > 0) return 'CRITICAL';
  return 'LOST';
}

export function calculateCargoDamage({ packageType = 'STANDARD', amount = 1, cause = 'impact' } = {}) {
  const profile = profileForType(String(packageType || 'STANDARD').toUpperCase());
  const causeMultiplier = cause === 'fall' ? 1.25 : cause === 'death' ? 1.55 : cause === 'exposure' ? .72 : 1;
  return Math.max(0, Number((Number(amount || 0) * profile.damageMultiplier * causeMultiplier).toFixed(2)));
}

function installStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#${ROOT_ID}{position:fixed;left:50%;top:76px;transform:translateX(-50%);z-index:204;pointer-events:none;width:min(360px,calc(100vw - 28px));font:700 10px/1.15 ui-monospace,SFMono-Regular,Menlo,monospace;color:#eaffff;filter:drop-shadow(0 10px 30px rgba(0,0,0,.35));opacity:0;transition:opacity .18s ease,transform .2s ease}
#${ROOT_ID}.is-visible{opacity:1;transform:translateX(-50%) translateY(0)}
#${ROOT_ID}.is-critical{filter:drop-shadow(0 0 18px rgba(255,80,80,.20))}
#${ROOT_ID} .cargo-card{border:1px solid color-mix(in srgb,var(--cargo-accent) 45%,transparent);border-radius:11px;background:linear-gradient(145deg,rgba(5,15,27,.94),rgba(2,7,14,.94));box-shadow:0 10px 35px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04);padding:9px 11px}
#${ROOT_ID} .cargo-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px}
#${ROOT_ID} .cargo-label{font-size:8px;letter-spacing:.16em;opacity:.68}
#${ROOT_ID} .cargo-type{font-size:9px;letter-spacing:.10em;color:var(--cargo-accent)}
#${ROOT_ID} .cargo-row{display:flex;align-items:center;gap:9px}
#${ROOT_ID} .cargo-track{height:7px;flex:1;border:1px solid rgba(141,244,255,.12);background:#030914;border-radius:99px;overflow:hidden;box-shadow:inset 0 0 7px rgba(0,0,0,.55)}
#${ROOT_ID} .cargo-fill{display:block;height:100%;width:100%;border-radius:99px;background:linear-gradient(90deg,color-mix(in srgb,var(--cargo-accent) 70%,#fff),var(--cargo-accent));box-shadow:0 0 12px color-mix(in srgb,var(--cargo-accent) 38%,transparent);transition:width .16s ease,filter .16s ease}
#${ROOT_ID} .cargo-value{min-width:36px;text-align:right;font-size:12px;font-weight:950;font-variant-numeric:tabular-nums}
#${ROOT_ID} .cargo-foot{display:flex;justify-content:space-between;gap:8px;margin-top:7px;font-size:7px;letter-spacing:.08em;opacity:.58}
#${ROOT_ID} .cargo-foot b{color:var(--cargo-accent);opacity:.95}
#${ROOT_ID} .cargo-flash{position:absolute;inset:0;border-radius:11px;opacity:0;box-shadow:inset 0 0 0 1px var(--cargo-accent),0 0 24px color-mix(in srgb,var(--cargo-accent) 18%,transparent)}
#${ROOT_ID}.is-hit .cargo-flash{animation:cargoFlash .28s ease-out}
#${ROOT_ID}.is-warning .cargo-flash{animation:cargoWarn .55s ease-out}
#${ROOT_ID}.is-anomaly .cargo-card{animation:cargoAnomaly .6s ease-out}
#${ROOT_ID}.is-critical .cargo-card{animation:cargoCritical 1.1s ease-in-out infinite alternate}
@keyframes cargoFlash{0%{opacity:.65;transform:scale(1)}100%{opacity:0;transform:scale(1.03)}}
@keyframes cargoWarn{0%{opacity:.6}100%{opacity:0}}
@keyframes cargoAnomaly{0%{filter:brightness(1)}35%{filter:brightness(1.22) saturate(1.3)}100%{filter:brightness(1)}}
@keyframes cargoCritical{from{transform:translateY(0)}to{transform:translateY(-1px)}}
@media(max-width:700px){#${ROOT_ID}{top:82px;width:min(330px,calc(100vw - 22px))}#${ROOT_ID} .cargo-card{padding:8px 9px}#${ROOT_ID} .cargo-foot{font-size:6.5px}}
@media(prefers-reduced-motion:reduce){#${ROOT_ID},#${ROOT_ID} .cargo-fill{transition:none}#${ROOT_ID}.is-critical .cargo-card{animation:none}#${ROOT_ID}.is-hit .cargo-flash,#${ROOT_ID}.is-warning .cargo-flash,#${ROOT_ID}.is-anomaly .cargo-card{animation:none}}
`;
  document.head.appendChild(style);
}

function mountHud() {
  if (document.getElementById(ROOT_ID)) return document.getElementById(ROOT_ID);
  installStyle();
  const root = document.createElement('section');
  root.id = ROOT_ID;
  root.innerHTML = '<div class="cargo-card"><div class="cargo-head"><span class="cargo-label">CARGO INTEGRITY</span><b class="cargo-type">STANDARD</b></div><div class="cargo-row"><div class="cargo-track"><i class="cargo-fill"></i></div><b class="cargo-value">100%</b></div><div class="cargo-foot"><span class="cargo-effect">STABLE CARGO</span><b class="cargo-state">PERFECT</b></div><span class="cargo-flash" aria-hidden="true"></span></div>';
  document.body.appendChild(root);
  return root;
}

const runtime = {
  scene: null, missionId: null, packageType: 'STANDARD', packageProfile: PACKAGE_PROFILES.STANDARD,
  integrity: 100, initialized: false, lastCollisionCount: 0, lastFallCount: 0, lastDeathCount: 0,
  lastExposureAt: 0, warningShown: false, criticalShown: false, anomalyCooldownUntil: 0, runStartedAt: 0,
};

function pulse(kind = 'hit') {
  const root = mountHud();
  root.classList.remove('is-hit', 'is-warning', 'is-anomaly');
  void root.offsetWidth;
  root.classList.add(`is-${kind}`);
  window.setTimeout(() => root.classList.remove(`is-${kind}`), kind === 'warning' ? 600 : 320);
}

function emitCue(type, detail) {
  const scene = runtime.scene;
  scene?.game?.events?.emit?.('cargo', { type, detail, packageType: runtime.packageType, integrity: runtime.integrity });
}

function setIntegrity(value, reason = 'state') {
  const previous = runtime.integrity;
  runtime.integrity = clamp(value);
  if (runtime.scene) runtime.scene.packageCondition = Math.round(runtime.integrity);
  renderHud();
  if (runtime.integrity < previous) pulse(runtime.integrity <= runtime.packageProfile.criticalAt ? 'warning' : 'hit');
  if (runtime.integrity <= runtime.packageProfile.warningAt && previous > runtime.packageProfile.warningAt) {
    runtime.warningShown = true;
    emitCue('warning', `${runtime.packageType} cargo integrity ${Math.round(runtime.integrity)}%`);
  }
  if (runtime.integrity <= runtime.packageProfile.criticalAt && previous > runtime.packageProfile.criticalAt) {
    runtime.criticalShown = true;
    emitCue('critical', `${runtime.packageType} cargo integrity critical`);
  }
  if (runtime.integrity <= 0 && previous > 0) emitCue('lost', 'Cargo integrity depleted');
  if (reason === 'anomaly') pulse('anomaly');
}

function damage(amount, cause = 'impact') {
  if (!runtime.initialized || !runtime.scene || runtime.integrity <= 0) return;
  const value = calculateCargoDamage({ packageType: runtime.packageType, amount, cause });
  setIntegrity(runtime.integrity - value, cause);
}

function resetForScene(scene) {
  if (!scene?.mission?.id) return false;
  const missionId = scene.mission.id;
  if (runtime.scene === scene && runtime.missionId === missionId && runtime.initialized && !scene.finished) return true;

  runtime.scene = scene;
  runtime.missionId = missionId;
  runtime.packageType = String(packageForScene(scene)?.type || 'STANDARD').toUpperCase();
  runtime.packageProfile = profileForType(runtime.packageType);
  const existing = Number(scene.packageCondition);
  runtime.integrity = Number.isFinite(existing) ? clamp(existing) : 100;
  if (scene.finished) return false;

  runtime.initialized = true;
  runtime.lastCollisionCount = Number(scene.collisions) || 0;
  runtime.lastFallCount = Number(scene.falls) || 0;
  runtime.lastDeathCount = Number(scene.deaths) || 0;
  runtime.lastExposureAt = 0;
  runtime.warningShown = false;
  runtime.criticalShown = false;
  runtime.anomalyCooldownUntil = performance.now() + 7000;
  runtime.runStartedAt = performance.now();
  scene.packageCondition = Math.round(runtime.integrity);
  renderHud();
  emitCue('init', runtime.packageProfile.description);
  return true;
}

function renderHud() {
  const root = mountHud();
  root.style.setProperty('--cargo-accent', runtime.packageProfile.accent);
  root.classList.toggle('is-visible', Boolean(runtime.initialized && runtime.scene && !runtime.scene.finished));
  root.classList.toggle('is-critical', runtime.integrity <= runtime.packageProfile.criticalAt && runtime.integrity > 0);
  root.querySelector('.cargo-fill').style.width = `${runtime.integrity}%`;
  root.querySelector('.cargo-value').textContent = `${Math.round(runtime.integrity)}%`;
  root.querySelector('.cargo-type').textContent = runtime.packageType;
  root.querySelector('.cargo-effect').textContent = runtime.packageProfile.effect;
  root.querySelector('.cargo-state').textContent = classifyCargoCondition(runtime.integrity);
}

function parseDuration(value) {
  const match = String(value || '').match(/^(\d+):(\d{2})$/);
  if (!match) return 0;
  return Number(match[1]) * 60 * 1000 + Number(match[2]) * 1000;
}

function applyPackageSpecificEffects(scene, now) {
  if (!scene || !runtime.initialized) return;
  if (runtime.packageType === 'HIGH VALUE' && scene.chaseActive && now - runtime.lastExposureAt > 1800) {
    runtime.lastExposureAt = now;
    damage(2, 'exposure');
    emitCue('exposure', 'Hostile pressure is affecting the high-value relay');
  }
  if (runtime.packageType === 'SECRET' && now > runtime.anomalyCooldownUntil && runtime.integrity < 88) {
    runtime.anomalyCooldownUntil = now + 6500;
    emitCue('anomaly', 'Signal anomaly detected');
    pulse('anomaly');
  }
  if (runtime.packageType === 'PRIME RELAY' && runtime.integrity <= runtime.packageProfile.warningAt && now > runtime.anomalyCooldownUntil) {
    runtime.anomalyCooldownUntil = now + 4200;
    emitCue('stability', 'Prime relay stability warning');
  }
  if (runtime.packageType === 'URGENT') {
    const duration = parseDuration(packages[runtime.missionId]?.duration);
    const elapsed = Math.max(0, Number(scene.elapsedMs) || now - runtime.runStartedAt);
    if (duration && elapsed >= duration * .78 && runtime.integrity > runtime.packageProfile.criticalAt) emitCue('pressure', 'URGENT delivery window is tightening');
  }
}

function sampleScene(scene) {
  if (!runtime.initialized || scene !== runtime.scene || scene.finished) return;
  const collisionCount = Number(scene.collisions) || 0;
  const fallCount = Number(scene.falls) || 0;
  const deathCount = Number(scene.deaths) || 0;
  if (collisionCount > runtime.lastCollisionCount) damage(collisionCount - runtime.lastCollisionCount, 'impact');
  if (fallCount > runtime.lastFallCount) damage(fallCount - runtime.lastFallCount, 'fall');
  if (deathCount > runtime.lastDeathCount) damage(deathCount - runtime.lastDeathCount, 'death');
  runtime.lastCollisionCount = collisionCount;
  runtime.lastFallCount = fallCount;
  runtime.lastDeathCount = deathCount;
  applyPackageSpecificEffects(scene, performance.now());
  renderHud();
}

function bindGame(game) {
  if (!game?.events?.on || game.__cargoIntegrityV2Bound) return false;
  game.__cargoIntegrityV2Bound = true;
  game.events.on('feedback', kind => {
    if (kind === 'hit') damage(2, 'impact');
    if (kind === 'land' && Number(runtime.scene?.player?.body?.velocity?.y || 0) > 820) damage(2, 'fall');
  });
  game.events.on('chase', active => {
    if (runtime.scene) runtime.scene.chaseActive = Boolean(active);
    if (active && runtime.packageType === 'HIGH VALUE') emitCue('exposure', 'High-value package exposed');
  });
  game.events.on('game-over', () => { if (runtime.initialized) damage(5, 'death'); });
  game.events.on('complete', () => finalize(runtime.scene));
  game.events.on('fail', () => finalize(runtime.scene));
  return true;
}

function finalize(scene) {
  if (!scene || scene !== runtime.scene || !runtime.initialized) return null;
  runtime.integrity = clamp(scene.packageCondition ?? runtime.integrity);
  scene.packageCondition = Math.round(runtime.integrity);
  const result = { version: VERSION, missionId: runtime.missionId, packageType: runtime.packageType, condition: Math.round(runtime.integrity), status: classifyCargoCondition(runtime.integrity), effect: runtime.packageProfile.effect };
  api.latest = result;
  window.__relayCargoIntegrityV2 = api;
  window.dispatchEvent(new CustomEvent('relay:cargo-complete', { detail: result }));
  return result;
}

function syncScene() {
  const scene = window.__relayRunnerScene;
  if (!scene?.mission?.id) return;
  if (scene.finished && runtime.scene === scene) { finalize(scene); return; }
  resetForScene(scene);
  bindGame(scene.game);
  sampleScene(scene);
}

const api = { version: VERSION, latest: null, profiles: PACKAGE_PROFILES, getProfile: getCargoProfile, getDamage: calculateCargoDamage, getCondition: classifyCargoCondition, reset() { if (runtime.scene) { runtime.scene.packageCondition = 100; resetForScene(runtime.scene); } }, damage };

function init() {
  if (window.__relayCargoIntegrityV2) return;
  window.__relayCargoIntegrityV2 = api;
  mountHud();
  window.addEventListener('relay:runner-scene-ready', event => bindGame(event.detail?.scene?.game || window.__relayRunnerScene?.game), { passive: true });
  window.addEventListener('relay:mission-complete', event => {
    const result = finalize(event.detail?.scene || window.__relayRunnerScene);
    if (!result) return;
    const finish = document.getElementById('finish');
    if (finish && !finish.classList.contains('hidden')) {
      finish.dataset.cargoCondition = String(result.condition);
      finish.dataset.cargoPackage = result.packageType;
    }
    if (result.condition >= 100 && result.missionId) {
      import('./src/state.js').then(({ loadState, saveState }) => {
        const state = loadState();
        const mastery = new Set(state.mastery?.[result.missionId] || []);
        if (!mastery.has('PERFECT PACKAGE')) {
          state.mastery = { ...state.mastery, [result.missionId]: [...mastery, 'PERFECT PACKAGE'] };
          saveState(state);
        }
      }).catch(() => {});
    }
  });
  window.setInterval(syncScene, 180);
  syncScene();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
}
