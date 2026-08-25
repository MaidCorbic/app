import Phaser from 'phaser';
import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE — NEW GAMEPLAY LAYER
// Deliberately isolated from existing progression, mission, world and combat systems.
// Adds only new moment-to-moment mechanics: momentum chain, near-miss, clutch window,
// adaptive camera language, micro choices, personal ghost echo, silent beats and run recap.

const STYLE_ID = 'relay-gameplay-new-layer-style';
const ROOT_ID = 'relay-gameplay-new-layer';
const GHOST_KEY = 'relay.runner.ghost.v1';
const MAX_GHOST_POINTS = 520;
const CHAIN_TIMEOUT = 1450;
const CLUTCH_MS = 180;

const state = {
  scene: null,
  player: null,
  startedAt: 0,
  lastSampleAt: 0,
  lastActionAt: 0,
  lastAction: '',
  chain: 0,
  chainScore: 0,
  chainPeak: 0,
  nearMisses: 0,
  clutches: 0,
  peakSpeed: 0,
  events: [],
  path: [],
  ghost: null,
  ghostIndex: 0,
  ghostElapsed: 0,
  choice: null,
  choiceAt: 0,
  choiceCooldown: 0,
  clutchUntil: 0,
  lastX: null,
  lastY: null,
  lastVx: 0,
  lastVy: 0,
  lastNearMissAt: 0,
  lastCameraAt: 0,
  silentUntil: 0,
};

const now = () => performance.now();
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dist = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

function installStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#${ROOT_ID}{position:fixed;inset:0;pointer-events:none;z-index:235;font-family:inherit;color:#eafcff}
#${ROOT_ID} .new-layer-chain{position:absolute;top:clamp(78px,10vh,118px);left:50%;transform:translate(-50%,-10px) scale(.96);opacity:0;transition:opacity .16s ease,transform .18s ease;text-align:center;filter:drop-shadow(0 0 14px rgba(25,200,245,.18))}
#${ROOT_ID} .new-layer-chain.active{opacity:1;transform:translate(-50%,0) scale(1)}
#${ROOT_ID} .chain-kicker{font-size:8px;letter-spacing:.28em;opacity:.65}
#${ROOT_ID} .chain-value{font-size:34px;font-weight:950;line-height:1;margin-top:3px;letter-spacing:.02em}
#${ROOT_ID} .chain-value em{font-style:normal;font-size:12px;letter-spacing:.16em;vertical-align:middle;margin-left:5px}
#${ROOT_ID} .new-layer-event{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) scale(.9);opacity:0;font-size:15px;font-weight:950;letter-spacing:.16em;text-shadow:0 0 18px rgba(141,244,255,.7);transition:opacity .12s ease,transform .18s ease}
#${ROOT_ID} .new-layer-event.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
#${ROOT_ID} .new-layer-choice{position:absolute;left:50%;bottom:clamp(84px,12vh,126px);width:min(520px,calc(100vw - 34px));transform:translate(-50%,10px);opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease}
#${ROOT_ID} .new-layer-choice.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}
#${ROOT_ID} .choice-title{text-align:center;font-size:9px;letter-spacing:.22em;opacity:.65;margin-bottom:8px}
#${ROOT_ID} .choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#${ROOT_ID} .choice-btn{pointer-events:auto;appearance:none;border:1px solid rgba(141,244,255,.28);border-radius:10px;background:linear-gradient(145deg,rgba(8,24,42,.94),rgba(3,10,20,.96));color:#eafcff;min-height:52px;padding:9px 12px;font:inherit;text-align:left;box-shadow:0 8px 30px rgba(0,0,0,.28);cursor:pointer}
#${ROOT_ID} .choice-btn b{display:block;font-size:10px;letter-spacing:.12em}.choice-btn small{display:block;margin-top:4px;font-size:8px;opacity:.55;letter-spacing:.05em}
#${ROOT_ID} .choice-btn:hover,#${ROOT_ID} .choice-btn:focus-visible{border-color:rgba(141,244,255,.8);box-shadow:0 0 24px rgba(25,200,245,.16);outline:none}
#${ROOT_ID} .new-layer-recap{position:absolute;right:16px;top:50%;transform:translateY(-50%) translateX(14px);opacity:0;width:min(190px,calc(100vw - 32px));padding:12px;border:1px solid rgba(141,244,255,.18);border-radius:10px;background:rgba(3,10,20,.88);box-shadow:0 20px 55px rgba(0,0,0,.45);transition:opacity .2s ease,transform .2s ease}
#${ROOT_ID} .new-layer-recap.show{opacity:1;transform:translateY(-50%) translateX(0)}
#${ROOT_ID} .recap-title{font-size:9px;letter-spacing:.2em;margin-bottom:9px}.recap-row{display:flex;justify-content:space-between;gap:8px;font-size:8px;letter-spacing:.08em;margin:6px 0;opacity:.72}.recap-row b{color:#eaffff;opacity:1}
#${ROOT_ID} .new-layer-ghost-label{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:7px;letter-spacing:.18em;opacity:.36;writing-mode:vertical-rl}
#${ROOT_ID}.silent{opacity:.18;transition:opacity .3s ease}
@media(max-width:520px){#${ROOT_ID} .new-layer-chain{top:92px}.new-layer-event{top:38%}.new-layer-choice{bottom:112px}.new-layer-recap{right:10px;width:170px}}
@media(prefers-reduced-motion:reduce){#${ROOT_ID} *{transition:none!important}}
`;
  document.head.appendChild(style);
}

function mountHud() {
  if (document.getElementById(ROOT_ID)) return document.getElementById(ROOT_ID);
  installStyle();
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.innerHTML = `
    <div class="new-layer-chain" aria-live="polite"><div class="chain-kicker">MOMENTUM CHAIN</div><div class="chain-value">0<em>x FLOW</em></div></div>
    <div class="new-layer-event" aria-live="polite"></div>
    <div class="new-layer-choice"><div class="choice-title">MICRO DECISION // CHOOSE YOUR LINE</div><div class="choice-grid"><button class="choice-btn" data-choice="overdrive"><b>OVERDRIVE</b><small>HIGH SPEED · HIGH RISK · 4s</small></button><button class="choice-btn" data-choice="recovery"><b>RECOVERY</b><small>SAFE FLOW · CLUTCH BUFFER · 4s</small></button></div></div>
    <div class="new-layer-recap"><div class="recap-title">RUN RECAP</div><div class="recap-row"><span>CHAIN PEAK</span><b data-recap="chain">0x</b></div><div class="recap-row"><span>NEAR MISS</span><b data-recap="near">0</b></div><div class="recap-row"><span>CLUTCH</span><b data-recap="clutch">0</b></div><div class="recap-row"><span>PEAK SPEED</span><b data-recap="speed">0</b></div></div>
    <div class="new-layer-ghost-label">PERSONAL GHOST</div>`;
  document.body.appendChild(root);
  root.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => choose(button.dataset.choice)));
  return root;
}

function hud() { return document.getElementById(ROOT_ID); }
function eventText(text) {
  const node = hud()?.querySelector('.new-layer-event');
  if (!node) return;
  node.textContent = text;
  node.classList.remove('show');
  void node.offsetWidth;
  node.classList.add('show');
  window.setTimeout(() => node.classList.remove('show'), 620);
}
function updateChainHud() {
  const node = hud()?.querySelector('.new-layer-chain');
  if (!node) return;
  node.querySelector('.chain-value').innerHTML = `${state.chain}<em>x FLOW</em>`;
  node.classList.toggle('active', state.chain > 0);
}
function updateRecap() {
  const root = hud();
  if (!root) return;
  root.querySelector('[data-recap="chain"]').textContent = `${state.chainPeak}x`;
  root.querySelector('[data-recap="near"]').textContent = String(state.nearMisses);
  root.querySelector('[data-recap="clutch"]').textContent = String(state.clutches);
  root.querySelector('[data-recap="speed"]').textContent = String(Math.round(state.peakSpeed));
}

function resetRun(scene) {
  state.scene = scene;
  state.player = findPlayer(scene);
  state.startedAt = now();
  state.lastSampleAt = state.startedAt;
  state.lastActionAt = 0;
  state.lastAction = '';
  state.chain = 0; state.chainScore = 0; state.chainPeak = 0;
  state.nearMisses = 0; state.clutches = 0; state.peakSpeed = 0;
  state.events = []; state.path = [];
  state.choice = null; state.choiceAt = 0; state.choiceCooldown = state.startedAt + 6500;
  state.clutchUntil = 0; state.lastX = null; state.lastY = null;
  state.lastVx = 0; state.lastVy = 0; state.lastNearMissAt = 0;
  state.lastCameraAt = 0; state.silentUntil = 0;
  state.ghost = loadGhost(getMissionId()); state.ghostIndex = 0; state.ghostElapsed = 0;
  mountHud(); updateChainHud(); updateRecap();
  showGhost(scene);
}

function findPlayer(scene) {
  return scene?.player || scene?.runner || scene?.courier || scene?.children?.list?.find(child => /runner|player/i.test(String(child?.texture?.key || '')));
}
function getMissionId() {
  return document.getElementById('finish')?.dataset?.missionId || document.body?.dataset?.missionId || 'current';
}
function ghostStorageKey() { return `${GHOST_KEY}.${getMissionId()}`; }
function loadGhost(missionId) {
  try { const raw = localStorage.getItem(`${GHOST_KEY}.${missionId}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveGhost() {
  if (state.path.length < 12) return;
  try { localStorage.setItem(ghostStorageKey(), JSON.stringify(state.path.slice(-MAX_GHOST_POINTS))); } catch {}
}

function showGhost(scene) {
  if (!state.ghost?.length || !scene?.add) return;
  state.ghostSprite?.destroy?.();
  const first = state.ghost[0];
  state.ghostSprite = scene.add.image(first.x, first.y, 'runner-idle');
  state.ghostSprite.setAlpha(.18); state.ghostSprite.setDepth(2); state.ghostSprite.setTint(0x8df4ff);
}
function updateGhost(scene, elapsed) {
  const ghost = state.ghost;
  const sprite = state.ghostSprite;
  if (!ghost?.length || !sprite) return;
  state.ghostElapsed = elapsed;
  while (state.ghostIndex < ghost.length - 2 && ghost[state.ghostIndex + 1].t <= elapsed) state.ghostIndex += 1;
  const point = ghost[state.ghostIndex];
  if (point) sprite.setPosition(point.x, point.y);
}

function registerAction(action) {
  const t = now();
  if (t - state.lastActionAt > CHAIN_TIMEOUT) state.chain = 0;
  if (state.lastAction !== action) state.chain += 1;
  state.lastAction = action; state.lastActionAt = t;
  state.chainPeak = Math.max(state.chainPeak, state.chain);
  state.chainScore += state.chain * 10;
  updateChainHud();
  if (state.chain >= 3 && state.chain % 3 === 0) eventText(`${state.chain}x FLOW`);
}

function registerClutch() {
  const t = now();
  if (t - state.lastNearMissAt < 260 || t > state.clutchUntil) return;
  state.clutches += 1;
  state.chain += 2;
  state.chainPeak = Math.max(state.chainPeak, state.chain);
  state.clutchUntil = 0;
  eventText('CLUTCH');
  pulseCamera(1.04, 110);
  updateChainHud(); updateRecap();
}

function choose(kind) {
  if (!state.choice || state.choice !== kind) return;
  state.choice = null;
  state.choiceAt = now();
  state.choiceCooldown = state.choiceAt + 10000;
  hud()?.querySelector('.new-layer-choice')?.classList.remove('show');
  if (kind === 'overdrive') {
    state.events.push({ type: 'overdrive', t: now() });
    state.scene?.__relayNewLayerOverdriveUntil = now() + 4000;
    eventText('OVERDRIVE');
  } else {
    state.events.push({ type: 'recovery', t: now() });
    state.scene?.__relayNewLayerRecoveryUntil = now() + 4000;
    eventText('RECOVERY LINE');
  }
}

function maybeChoice() {
  const t = now();
  if (state.choice || t < state.choiceCooldown || t - state.startedAt < 8000) return;
  if (Math.random() > .0025) return;
  state.choice = 'pending';
  hud()?.querySelector('.new-layer-choice')?.classList.add('show');
}

function pulseCamera(multiplier = 1.02, duration = 160) {
  const camera = state.scene?.cameras?.main;
  if (!camera || reducedMotion()) return;
  const base = camera.__relayNewLayerZoomBase ?? camera.zoom ?? 1;
  camera.__relayNewLayerZoomBase = base;
  camera.setZoom(base * multiplier);
  window.setTimeout(() => { if (camera.active) camera.setZoom(base); }, duration);
}

function updateCamera(scene, speed) {
  const camera = scene?.cameras?.main;
  if (!camera) return;
  const base = camera.__relayNewLayerZoomBase ?? camera.zoom ?? 1;
  camera.__relayNewLayerZoomBase = base;
  const target = base + clamp(Math.abs(speed) / 9000, 0, .055);
  if (now() - state.lastCameraAt > 90) {
    camera.setZoom(camera.zoom + (target - camera.zoom) * .18);
    state.lastCameraAt = now();
  }
}

function collectNearMissCandidates(scene) {
  const list = scene?.children?.list;
  if (!Array.isArray(list)) return [];
  return list.filter(object => {
    if (!object || object === state.player || object.active === false) return false;
    const key = String(object.texture?.key || object.name || object.type || '').toLowerCase();
    return /barrier|guard|security|turret|chaser|enemy|invader|dino|sentinel|storm|boss|goal/.test(key);
  });
}
function updateNearMiss(scene, player) {
  if (!player?.getBounds) return;
  const t = now();
  if (t - state.lastNearMissAt < 520) return;
  const bounds = player.getBounds();
  const candidates = collectNearMissCandidates(scene);
  for (const object of candidates) {
    if (!object.getBounds || object.body?.enable === false) continue;
    const box = object.getBounds();
    const gapX = Math.max(box.left - bounds.right, bounds.left - box.right, 0);
    const gapY = Math.max(box.top - bounds.bottom, bounds.top - box.bottom, 0);
    const gap = Math.hypot(gapX, gapY);
    const overlap = Phaser.Geom.Intersects.RectangleToRectangle(bounds, box);
    if (!overlap && gap > 0 && gap < 16 && Math.abs((player.body?.velocity?.x || 0)) > 180) {
      state.nearMisses += 1;
      state.lastNearMissAt = t;
      state.clutchUntil = t + CLUTCH_MS;
      state.chain += 1;
      state.chainPeak = Math.max(state.chainPeak, state.chain);
      state.events.push({ type: 'near-miss', t, x: player.x, y: player.y });
      eventText('NEAR MISS');
      pulseCamera(1.035, 120);
      updateChainHud(); updateRecap();
      break;
    }
  }
}

function samplePlayer(scene, player) {
  const t = now();
  const elapsed = t - state.startedAt;
  const vx = Number(player?.body?.velocity?.x || 0);
  const vy = Number(player?.body?.velocity?.y || 0);
  const speed = Math.hypot(vx, vy);
  state.peakSpeed = Math.max(state.peakSpeed, speed);
  if (t - state.lastSampleAt >= 80 && Number.isFinite(player?.x) && Number.isFinite(player?.y)) {
    state.path.push({ t: elapsed, x: Number(player.x), y: Number(player.y) });
    if (state.path.length > MAX_GHOST_POINTS) state.path.shift();
    state.lastSampleAt = t;
  }
  state.lastX = player?.x; state.lastY = player?.y; state.lastVx = vx; state.lastVy = vy;
  updateGhost(scene, elapsed);
  updateCamera(scene, speed);
  updateNearMiss(scene, player);
  maybeChoice();
  if (t - state.lastActionAt > CHAIN_TIMEOUT && state.chain) { state.chain = 0; updateChainHud(); }
  const root = hud();
  if (root) root.classList.toggle('silent', state.silentUntil > t);
}

function runRecap() {
  saveGhost();
  updateRecap();
  hud()?.querySelector('.new-layer-recap')?.classList.add('show');
  window.setTimeout(() => hud()?.querySelector('.new-layer-recap')?.classList.remove('show'), 5000);
}

function bindInputs() {
  if (window.__relayNewLayerInputs) return;
  window.__relayNewLayerInputs = true;
  document.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.code === 'Space' || /^ArrowUp$/i.test(event.key) || /^w$/i.test(event.key)) registerAction('jump');
    if (event.key === 'Shift') registerAction('dash');
    if (/^[ad]$/i.test(event.key) || /^Arrow(Left|Right)$/i.test(event.key)) registerAction('move');
    if (state.clutchUntil > now() && (event.code === 'Space' || event.key === 'Shift' || /^ArrowUp$/i.test(event.key))) registerClutch();
  }, true);
  document.addEventListener('pointerdown', event => {
    const action = event.target?.closest?.('[data-mobile-action]')?.dataset?.mobileAction;
    if (!action) return;
    registerAction(action);
    if (state.clutchUntil > now()) registerClutch();
  }, true);
  window.addEventListener('blur', () => { state.clutchUntil = 0; });
}

if (!window.__relayNewGameplayLayerV1) {
  window.__relayNewGameplayLayerV1 = true;
  bindInputs();
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function relayNewGameplayCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { resetRun(this); } catch (error) { console.error('[Relay New Gameplay] create:', error); }
    return result;
  };

  RunnerScene.prototype.update = function relayNewGameplayUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    try {
      if (state.scene !== this) resetRun(this);
      state.player ||= findPlayer(this);
      if (state.player) samplePlayer(this, state.player);
    } catch (error) { console.error('[Relay New Gameplay] update:', error); }
    return result;
  };

  window.addEventListener('relay:mission-complete', runRecap);
  window.addEventListener('relay:mission-performance-complete', updateRecap);
  window.addEventListener('relay:runner-scene-ready', event => { if (event.detail?.scene) resetRun(event.detail.scene); });

  window.addEventListener('relay:new-gameplay-silent-beat', event => {
    state.silentUntil = now() + Math.max(500, Number(event.detail?.duration) || 2200);
  });

  window.relayNewGameplay = {
    registerAction,
    triggerNearMiss: () => { state.nearMisses += 1; state.lastNearMissAt = now(); state.clutchUntil = now() + CLUTCH_MS; eventText('NEAR MISS'); updateRecap(); },
    triggerClutch: registerClutch,
    triggerSilentBeat: duration => { state.silentUntil = now() + Math.max(500, Number(duration) || 2200); },
    getRunSnapshot: () => ({ chainPeak: state.chainPeak, nearMisses: state.nearMisses, clutches: state.clutches, peakSpeed: Math.round(state.peakSpeed), chainScore: state.chainScore }),
  };
}
