import Phaser from 'phaser';
import { missions } from './missions.js';
import { contracts } from './contracts.js';
import { buildItems, gadgets, upgrades, weapons } from './upgrades.js';
import { modifiers } from './modifiers.js';
import { districts } from './districts.js';
import { packages } from './packages.js';
import { currentSpecialEvent, npcs, rivalAppearances, rivalOperations } from './world-content.js';
import { campaignChapters } from './campaign.js';
import { enemyIntel } from './enemy-intel.js';
import { achievementDefinitions, claimChallenge, claimLoginReward, completeMission, dailyChallenges, getCourierRank, getLevelProgress, loadState, monthlyChallenges, seasonalChallenges, weeklyChallenges, saveState } from './state.js';
import { RunnerScene } from './scenes/RunnerScene.js';

const $ = id => document.getElementById(id);
const formatTime = ms => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${Math.floor(ms % 1000 / 100)}`;
const detectTouchDevice = () => {
  const hasTouchPoints = navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  const hasTouchEvents = 'ontouchstart' in window;
  const coarsePointer = matchMedia('(pointer:coarse)').matches || matchMedia('(hover:none)').matches;
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');
  return hasTouchPoints || hasTouchEvents || coarsePointer || mobileUA;
};
const syncTouchClass = () => document.body.classList.toggle('is-touch', detectTouchDevice());
syncTouchClass();
window.addEventListener('resize', syncTouchClass);
document.querySelector('.input-guide').innerHTML = '<kbd>A</kbd><kbd>D</kbd> RUN <i></i><kbd>SPACE</kbd> JUMP <i></i><kbd>E</kbd> FIRE <i></i><kbd>Q</kbd> BLADE <i></i><kbd>SHIFT</kbd> DASH';
document.querySelector('#intro .menu-brand')?.remove();
document.querySelector('#intro .menu-tagline')?.insertAdjacentHTML('afterend', '<p class="chapter-brief">Old Quarter is dark, but the relay still answers. Carry the signal across the rooftops and keep the city connected.</p>');
document.querySelector('#intro .title-lockup')?.insertAdjacentHTML('beforeend', '<p class="game-version">RELAY RUNNER · VERSION 1.1.0</p>');
document.querySelector('#pauseMenu .logo')?.remove();
const pauseClose = document.querySelector('#pauseMenu [data-close]');
if (pauseClose) { pauseClose.innerHTML = '<span>ESC</span> CLOSE <b>×</b>'; pauseClose.setAttribute('aria-label', 'Close pause menu and resume with Escape'); }
document.querySelector('#game').insertAdjacentHTML('beforeend', '<section id="worldMap" class="world-map hidden" aria-label="City district map"><header><p class="eyebrow">CITY RELAY NETWORK</p><h2>CHOOSE A <em>DISTRICT.</em></h2><button id="worldMapTitle" class="text-button">RETURN TO BRIEFING</button></header><div id="districtGrid" class="district-grid"></div></section>');
document.querySelector('#worldMap header').insertAdjacentHTML('beforeend', '<nav class="board-tabs"><button data-board="districts">DISTRICTS</button><button data-board="missions">MAIN MISSIONS</button><button data-board="contracts">CONTRACTS</button><button data-board="challenges">CHALLENGES</button><button data-board="events">SPECIAL EVENTS</button><button data-board="npcs">CONTACTS</button></nav>');
document.querySelector('#game').insertAdjacentHTML('beforeend', '<section id="preflight" class="preflight hidden" aria-modal="true" role="dialog"><div class="preflight-card"><button id="closePreflight" class="close">×</button><p class="eyebrow">PRE-FLIGHT LOADOUT</p><h2 id="preflightTitle"></h2><p id="preflightBrief"></p><div id="preflightOptions"></div><button id="launchJob" class="primary">START DELIVERY <b>→</b></button></div></section>');
let state = loadState();
let missionIndex = 0;
let runScore = 0;
let toastTimer;
let activeRunId = 0;
let runSettled = false;
// RunnerScene must never auto-start: Phaser's SceneManager *hardcodes* `autoStart: true` for
// whichever scene is at index 0 of the initial `scene` config array, regardless of any `active`
// flag set on it (see Phaser.Scenes.SceneManager#bootQueue). So the only reliable way to keep the
// scene idle until a mission is chosen is to not list it in the initial `scene` config at all, and
// instead register it manually with `autoStart: false` via `game.scene.add()` right below. Without
// this, RunnerScene used to auto-start with no mission data and crash inside init()/create(),
// leaving the canvas blank behind the still-visible menu.
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'phaser-game', width: 1280, height: 720, backgroundColor: '#091225', physics: { default: 'arcade', arcade: { gravity: { y: 1600 }, debug: false } }, scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [] });
game.scene.add('runner', RunnerScene, false);
document.addEventListener('keydown', event => { if (event.key !== 'Escape') return; const runner = game.scene.getScene('runner'); if (runner?.infoCard) { event.preventDefault(); event.stopImmediatePropagation(); runner.dismissIntelCard(); } }, true);
// Mobile input ownership lives exclusively in src/systems/mobile-input-single-owner-v1.js.
// Do not create a second action dispatcher or inject duplicate buttons here.
document.querySelector('[data-rotate-dismiss]')?.addEventListener('click', () => document.body.classList.add('rotate-dismissed'));
window.addEventListener('orientationchange', () => document.body.classList.remove('rotate-dismissed'));
const joystick = document.querySelector('[data-mobile-joystick]');
const joystickThumb = joystick?.querySelector('.mobile-joystick-thumb');
if (joystick && joystickThumb) {
  const maxDrag = 38;
  const deadzone = 10;
  let activePointerId = null;
  let currentDirection = null;
  const setDirection = direction => {
    if (direction !== currentDirection) {
      currentDirection = direction;
      game.events.emit('mobile-move', direction);
    }
  };
  const moveThumb = (clientX, clientY) => {
    const rect = joystick.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const distance = Math.min(Math.hypot(dx, dy), maxDrag);
    const angle = Math.atan2(dy, dx);
    joystickThumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
    if (Math.abs(dx) <= deadzone) setDirection(null);
    else setDirection(dx < 0 ? 'left' : 'right');
  };
  const resetThumb = () => { joystickThumb.style.transform = 'translate(0px,0px)'; };
  const endDrag = event => {
    if (event && event.pointerId !== activePointerId) return;
    activePointerId = null;
    joystick.classList.remove('is-active');
    resetThumb();
    setDirection(null);
  };
  joystick.addEventListener('pointerdown', event => {
    if (activePointerId !== null) return;
    activePointerId = event.pointerId;
    joystick.setPointerCapture?.(activePointerId);
    joystick.classList.add('is-active');
    moveThumb(event.clientX, event.clientY);
    event.preventDefault();
  }, { passive: false });
  const trackDrag = event => { if (event.pointerId === activePointerId) { moveThumb(event.clientX, event.clientY); event.preventDefault(); } };
  joystick.addEventListener('pointermove', trackDrag, { passive: false });
  window.addEventListener('pointermove', trackDrag, { passive: false });
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  window.addEventListener('blur', () => endDrag());
  window.addEventListener('pagehide', () => endDrag());
  document.addEventListener('visibilitychange', () => { if (document.hidden) endDrag(); });
}
let audioContext;
let audioBed;
let musicTimer;
function getAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioContext ||= new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}
function playTone(frequency, duration, type = 'sine', volume = .03, rise = false) {
  const context = getAudioContext(); if (!context) return;
  const now = context.currentTime; const oscillator = context.createOscillator(); const gain = context.createGain();
  oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, now);
  if (rise) oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + duration);
  gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  oscillator.connect(gain).connect(context.destination); oscillator.start(now); oscillator.stop(now + duration);
}
function stopAudioBed() {
  window.clearInterval(musicTimer); musicTimer = undefined;
  if (!audioBed) return;
  audioBed.nodes.forEach(node => node.stop?.()); audioBed = undefined;
}
function startHomeAudio() {
  if (state.muted || audioBed?.missionId === 'home') return;
  stopAudioBed();
  const context = getAudioContext(); if (!context) return;
  const ambientGain = context.createGain(); ambientGain.gain.value = .014 * state.musicVolume; ambientGain.connect(context.destination);
  const drone = context.createOscillator(); drone.type = 'sine'; drone.frequency.value = 49; drone.connect(ambientGain); drone.start();
  const shimmerGain = context.createGain(); shimmerGain.gain.value = .007 * state.musicVolume; shimmerGain.connect(context.destination);
  const shimmer = context.createOscillator(); shimmer.type = 'triangle'; shimmer.frequency.value = 196; shimmer.detune.value = 7; shimmer.connect(shimmerGain); shimmer.start();
  audioBed = { nodes: [drone, shimmer], gains: [ambientGain, shimmerGain], missionId: 'home' };
  const notes = [146.83, 220, 293.66, 246.94]; let noteIndex = 0;
  musicTimer = window.setInterval(() => { if (!state.muted && !$('intro').classList.contains('hidden')) playTone(notes[noteIndex++ % notes.length], .9, 'sine', .009 * state.musicVolume, true); }, 1600);
}
function startAudioBed(mission = missions[missionIndex]) {
  if (state.muted || audioBed?.missionId === mission?.id) return;
  stopAudioBed();
  const context = getAudioContext(); if (!context) return;
  const ambientGain = context.createGain(); ambientGain.gain.value = .018 * state.musicVolume; ambientGain.connect(context.destination);
  const hum = context.createOscillator(); hum.type = 'sine'; hum.frequency.value = 55; hum.connect(ambientGain); hum.start();
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate); const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = (Math.random() * 2 - 1) * .16;
  const city = context.createBufferSource(); const cityFilter = context.createBiquadFilter(); const cityGain = context.createGain(); city.loop = true; city.buffer = buffer; cityFilter.type = 'lowpass'; cityFilter.frequency.value = 420; cityGain.gain.value = .035 * state.musicVolume; city.connect(cityFilter).connect(cityGain).connect(context.destination); city.start();
  audioBed = { nodes: [hum, city], gains: [ambientGain, cityGain], missionId: mission?.id };
  const notes = ({ 'first-delivery': [146.83, 220, 293.66, 349.23], 'dead-drop': [130.81, 196, 261.63, 329.63], blackout: [110, 164.81, 220, 246.94], pursuit: [164.81, 246.94, 329.63, 493.88], 'signal-storm': [146.83, 220, 329.63, 440], 'corporate-lockdown': [123.47, 185, 277.18, 369.99], 'final-relay': [196, 293.66, 392, 587.33] })[mission?.id] || [146.83, 220, 293.66, 349.23]; let noteIndex = 0;
  musicTimer = window.setInterval(() => { if (!state.muted) playTone(notes[noteIndex++ % notes.length], .42, 'triangle', .012 * state.musicVolume, true); }, 1220);
}
document.querySelector('#intro')?.addEventListener('pointerdown', () => { if (!$('intro').classList.contains('hidden')) startHomeAudio(); }, { once: true });
function playFeedback(kind) {
  if (state.muted) return;
  const notes = { jump: [250, 0.055, 'triangle'], wallJump: [310, 0.07, 'triangle'], vault: [285, 0.06, 'triangle'], slide: [145, 0.07, 'sawtooth'], ledgeGrab: [330, 0.06, 'triangle'], dash: [360, 0.07, 'sawtooth'], gadget: [610, 0.08, 'sine'], empty: [95, 0.11, 'square'], warning: [180, 0.11, 'square'], chase: [155, 0.12, 'sawtooth'], land: [105, 0.045, 'sine'], signal: [740, 0.09, 'sine'], hit: [92, 0.16, 'sawtooth'], complete: [520, 0.18, 'triangle'] };
  const [frequency, duration, type] = notes[kind] || notes.jump;
  playTone(frequency, duration, type, .035 * state.sfxVolume, kind === 'signal' || kind === 'complete');
  if (kind === 'gadget') playTone(910, .1, 'sine', .018 * state.sfxVolume, true);
  if (kind === 'warning') playTone(225, .09, 'square', .018 * state.sfxVolume);
  if (kind === 'empty') playTone(70, .09, 'square', .014 * state.sfxVolume);
  if (kind === 'wallJump' || kind === 'vault') playTone(470, .05, 'triangle', .016 * state.sfxVolume, true);
  if (kind === 'complete') { playTone(660, .16, 'triangle', .022 * state.sfxVolume, true); window.setTimeout(() => playTone(880, .22, 'triangle', .025 * state.sfxVolume, true), 140); window.setTimeout(() => playTone(1174.66, .34, 'sine', .022 * state.sfxVolume, true), 300); }
  if (kind === 'hit') playTone(45, .13, 'sawtooth', .018 * state.sfxVolume);
}
function speakNarration(text) {
  if (state.muted || !$('intro').classList.contains('hidden') || !game.scene.isActive('runner') || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
  if (Date.now() - (speakNarration.lastAt || 0) < 1100) return;
  try { speakNarration.lastAt = Date.now(); window.speechSynthesis.cancel(); const line = new SpeechSynthesisUtterance(text); const voices = window.speechSynthesis.getVoices(); line.voice = voices.find(voice => /David|Guy|Daniel|Male|George|James/i.test(voice.name)) || null; line.lang = 'en-US'; line.rate = .92; line.pitch = .82; line.volume = Math.min(1, state.sfxVolume); window.speechSynthesis.speak(line); } catch { /* Browser speech is optional and must not interrupt gameplay. */ }
}
function speakCharacterResponse(text) {
  if (state.muted || !$('intro').classList.contains('hidden') || !game.scene.isActive('runner') || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
  try { const line = new SpeechSynthesisUtterance(text); const voices = window.speechSynthesis.getVoices(); line.voice = voices.find(voice => /Zira|Samantha|Victoria|Female|Karen/i.test(voice.name)) || null; line.lang = 'en-US'; line.rate = 1; line.pitch = 1.08; line.volume = Math.min(.8, state.sfxVolume); window.speechSynthesis.speak(line); } catch { /* Browser speech is optional and must not interrupt gameplay. */ }
}
function applyRuntimeSettings() {
  document.body.classList.toggle('reduced-motion', state.reducedMotion);
  if (audioBed) { audioBed.gains[0].gain.value = .018 * state.musicVolume; audioBed.gains[1].gain.value = .035 * state.musicVolume; }
  const scene = game.scene.getScene('runner'); if (scene) { scene.screenShake = state.screenShake; scene.motionReduced = state.reducedMotion; }
}
game.events.once('runner-ready', () => { window.strideReady = true; $('startupError')?.classList.add('hidden'); window.setTimeout(() => $('bootLoader')?.classList.add('is-ready'), 100); });
game.events.on('runner-ready', () => { if ($('intro').classList.contains('hidden')) startAudioBed(game.scene.getScene('runner').mission); });
game.events.on('runner-ready', () => { window.runSecrets = 0; if (!$('energyBar')) document.querySelector('.hud-run').insertAdjacentHTML('beforeend', '<div class="hud-vital energy"><span><small>ENERGY</small><b id="energyValue">100%</b></span><div><i id="energyBar" style="width:100%"></i></div></div>'); if (!$('healthBar')) document.querySelector('.hud-actions').insertAdjacentHTML('afterbegin', '<div class="hud-vital health"><span><small>HEALTH</small><b id="healthValue">3 / 3</b></span><div><i id="healthBar" style="width:100%"></i></div></div>'); if (!$('ammoBar')) document.querySelector('.hud-actions').insertAdjacentHTML('afterbegin', '<div class="hud-vital plasma"><span><small>PLASMA</small><b id="ammoValue">READY</b></span><div><i id="ammoBar" style="width:100%"></i></div></div>'); if (!$('comboValue')) document.querySelector('.hud-actions').insertAdjacentHTML('afterbegin', '<div class="hud-vital combo"><span><small>FLOW</small><b id="comboValue">READY</b></span><div><i id="comboBar" style="width:0%"></i></div></div>'); if (!$('detectionStatus')) document.querySelector('.hud-route div').insertAdjacentHTML('beforeend', '<small id="detectionStatus">STEALTH · CLEAR</small>'); if (!$('routeIntel')) document.querySelector('.hud-route div').insertAdjacentHTML('beforeend', '<small id="routeIntel">ROUTE · ENTRY</small>'); const intel = $('routeIntel'); intel.textContent = `ROUTE · 0/${game.scene.getScene('runner').mission.checkpoints.length} CHECKPOINTS`; intel.classList.remove('is-chase'); });
game.events.on('runner-ready', () => { const scene = game.scene.getScene('runner'); const flight = scene.mission.loadout; scene.abilities = new Set(flight?.abilities || state.abilities); scene.loadout = { upgrades: flight?.upgrades || state.upgrades, equipment: flight?.equipment || state.equipment, buildItems: flight?.buildItems || state.buildLoadout, weapon: flight?.weapon || state.equippedWeapon, modifier: flight?.modifier || modifiers.find(modifier => modifier.id === state.activeModifier) || null }; if (scene.loadout.modifier?.id === 'darkCity') scene.add.rectangle(640, 360, 1280, 720, 0x020610, .3).setScrollFactor(0).setDepth(20); });
game.events.on('runner-ready', () => { const energy = $('energyBar')?.closest('.hud-vital'); if (energy) energy.hidden = !game.scene.getScene('runner').mission.energyEnabled; });
game.events.on('runner-ready', () => { const scene = game.scene.getScene('runner'); const packageMeter = $('packageCondition'); if (scene.package?.condition) { if (!packageMeter) document.querySelector('.hud-actions').insertAdjacentHTML('afterbegin', '<div class="hud-vital package"><span><small>PACKAGE</small><b id="packageValue">100%</b></span><div><i id="packageCondition" style="width:100%"></i></div></div>'); } else packageMeter?.closest('.hud-vital').remove(); });
game.events.on('narration', speakNarration);
game.events.on('character-response', speakCharacterResponse);
game.events.on('feedback', kind => { const lines = { dash: 'Boost engaged.', vault: 'Barrier cleared.', wallJump: 'Wall jump.', signal: 'Signal secured.', hit: 'Taking fire.', complete: 'Relay linked.' }; if (lines[kind]) speakNarration(lines[kind]); });
function toast(text) { const element = $('toast'); element.textContent = text; element.classList.add('show'); window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => element.classList.remove('show'), 1700); }
function nextMissionIndex() { const index = missions.findIndex(mission => !state.completed.includes(mission.id)); return index === -1 ? missions.length - 1 : index; }
function renderMissionPreview() {
  const preview = document.querySelector('.mission-preview');
  // The "Phase 1.2 cinematic home screen" redesign (menu-overrides.css) hides
  // .mission-preview entirely, and some layouts never render it in the DOM at
  // all. Bail out safely instead of throwing when it's missing.
  if (!preview) return;
  const index = nextMissionIndex();
  const mission = missions[index];
  const allComplete = state.completed.length === missions.length;
  const hasProgress = state.xp || state.signals || state.completed.length;
  const route = preview.querySelector('.preview-route');
  let details = preview.querySelector('.preview-details');
  if (!route.querySelector('.route-map')) { const map = document.createElement('span'); map.className = 'route-map'; map.setAttribute('aria-hidden', 'true'); route.append(map); }
  if (!details) { details = document.createElement('small'); details.className = 'preview-details'; preview.insertBefore(details, preview.querySelector('.preview-status')); }
  preview.querySelector('small').textContent = `MISSION ${String(index + 1).padStart(2, '0')}`;
  preview.querySelector('strong').textContent = mission.title.toUpperCase();
  details.textContent = `${mission.district.toUpperCase()} · ${mission.reward} XP · ${mission.signals.length} SIGNALS`;
  preview.querySelector('.preview-status').textContent = allComplete ? 'ALL ROUTES COMPLETE' : hasProgress ? 'NEW ROUTE' : 'IN PROGRESS';
  preview.setAttribute('aria-label', `Current mission: ${mission.title}`);
}
function renderStreak() {
  // Same as renderMissionPreview: .home-progress is intentionally hidden/absent
  // in the current cinematic home screen, so guard against it being missing.
  const home = document.querySelector('.home-progress');
  if (home) {
    let homeStreak = home.querySelector('.home-streak');
    if (!homeStreak) { homeStreak = document.createElement('p'); homeStreak.className = 'home-streak'; home.append(homeStreak); }
    homeStreak.textContent = state.streak ? `${state.streak} NIGHT STREAK${state.streak === 1 ? '' : 'S'}` : 'BEGIN YOUR NIGHT STREAK';
  }

  const outcome = $('finish').querySelector('.outcome');
  let finishStreak = outcome.querySelector('.finish-streak');
  if (!finishStreak) { finishStreak = document.createElement('p'); finishStreak.className = 'finish-streak'; outcome.querySelector('.reward').after(finishStreak); }
  finishStreak.textContent = state.lastStreakBonus ? `NIGHT STREAK ${state.streak} · +${state.lastStreakBonus} BONUS XP` : `NIGHT STREAK ${state.streak || 0}`;
}
function renderHomeProgress() { if ($('homeXp')) $('homeXp').textContent = state.xp; if ($('homeCompleted')) $('homeCompleted').textContent = state.completed.length; if ($('homeSignals')) $('homeSignals').textContent = state.signals; $('continue').classList.toggle('hidden', !(state.xp || state.signals || state.completed.length)); renderMissionPreview(); renderStreak(); }
function missionUnlocked(index) { const requirement = missions[index].unlockRequirement; return !requirement || state.completed.includes(requirement); }
function districtProgress(district) { const districtMissions = missions.filter(mission => district.missions.includes(mission.id)); const stats = districtMissions.map(mission => state.missionStats?.[mission.id] || {}); const contractsDone = contracts.filter(contract => district.missions.includes(contract.missionId) && state.contractStats?.[contract.id]?.completed).length; const signals = stats.reduce((total, stat) => total + (stat.bestSignals || 0), 0); const secrets = stats.reduce((total, stat) => total + (stat.bestSecrets || 0), 0); const completed = stats.filter(stat => stat.completed).length; const totalSignals = districtMissions.reduce((total, mission) => total + mission.signals.length, 0); const totalSecrets = districtMissions.reduce((total, mission) => total + mission.secrets.length, 0); const districtContracts = contracts.filter(contract => district.missions.includes(contract.missionId)).length; const percent = Math.round((completed / districtMissions.length * 45) + (signals / totalSignals * 25) + (secrets / Math.max(1, totalSecrets) * 15) + (contractsDone / Math.max(1, districtContracts) * 15)); return { completed, signals, secrets, contractsDone, percent }; }
function openWorldMap() { game.scene.stop('runner'); $('pauseMenu').classList.add('hidden'); const grid = $('districtGrid'); grid.innerHTML = districts.map(district => { const unlocked = !district.unlockMission || state.completed.includes(district.unlockMission); const progress = districtProgress(district); const missionCards = district.missions.map(id => { const index = missions.findIndex(mission => mission.id === id); const mission = missions[index]; const available = unlocked && missionUnlocked(index); return `<button class="district-mission" data-world-mission="${index}" ${available ? '' : 'disabled'}>${mission.title}<small>${available ? mission.difficulty : 'LOCKED'}</small></button>`; }).join(''); return `<article class="district-card ${district.id} ${unlocked ? '' : 'locked'}"><span>${unlocked ? `${progress.percent}% COMPLETE` : `UNLOCK: ${district.unlockMission.replaceAll('-', ' ')}`}</span><h3>${district.name}</h3><p>${district.identity}</p><small>HAZARDS · ${district.hazards}</small><small>ENEMIES · ${district.enemies}</small><div class="district-progress"><i style="width:${unlocked ? progress.percent : 0}%"></i></div><footer><b>${progress.completed}/${district.missions.length} MISSIONS</b><b>${progress.signals} SIGNALS · ${progress.secrets} SECRETS</b><b>${progress.contractsDone} CONTRACTS · BEST ${Math.max(0, ...district.missions.map(id => state.missionStats?.[id]?.bestScore || 0))}</b></footer>${missionCards}</article>`; }).join(''); grid.querySelectorAll('[data-world-mission]').forEach(button => button.onclick = () => { $('worldMap').classList.add('hidden'); launch(Number(button.dataset.worldMission)); }); $('worldMap').classList.remove('hidden'); }
let selectedJob;
 function openPreflight(job) { const mission = missions[job.missionIndex]; if (!missionUnlocked(job.missionIndex)) { toast(`ROUTE LOCKED · COMPLETE ${mission.unlockRequirement.toUpperCase()}`); return; } const required = mission.requiredAbilities || []; const missing = required.filter(ability => !state.abilities.includes(ability)); if (missing.length) { toast(`CLEARANCE REQUIRED · ${missing.join(', ').toUpperCase()}`); return; } selectedJob = job; const parcel = packages[mission.id]; $('preflightTitle').textContent = `${parcel.type} · ${mission.title}`; $('preflightBrief').textContent = `${parcel.objective} ${parcel.condition ? 'Package condition will drop on impacts.' : ''}`; const availableAbilities = state.abilities.length ? state.abilities : ['dash']; const passive = state.upgrades[0] || ''; let optionalAbilities = 0; $('preflightOptions').innerHTML = `<small>REQUIRED ABILITIES STAY EQUIPPED · SELECT UP TO 2 OPTIONAL</small><div class="preflight-options">${availableAbilities.map(ability => { const requiredAbility = required.includes(ability); const checked = requiredAbility || optionalAbilities++ < 2; return `<label><input type="checkbox" data-flight-ability="${ability}" ${checked ? 'checked' : ''} ${requiredAbility ? 'disabled' : ''}> ${ability}${requiredAbility ? ' · REQUIRED' : ''}</label>`; }).join('')}</div><small>SELECT 2 GADGETS</small><div class="preflight-options">${gadgets.map((gadget, index) => `<label><input type="checkbox" data-flight-gadget="${gadget.id}" ${state.equipment.includes(gadget.id) || (index < 2 && !state.equipment.length) ? 'checked' : ''}> ${gadget.label}</label>`).join('')}</div><small>SELECT 1 PASSIVE</small><select id="flightPassive"><option value="">NONE</option>${upgrades.filter(upgrade => state.upgrades.includes(upgrade.id)).map(upgrade => `<option value="${upgrade.id}" ${upgrade.id === passive ? 'selected' : ''}>${upgrade.label}</option>`).join('')}</select>`; const limitSelection = (selector, limit, label) => { document.querySelectorAll(selector).forEach(input => input.addEventListener('change', () => { if (input.checked && [...document.querySelectorAll(`${selector}:checked`)].filter(option => !option.disabled).length > limit) { input.checked = false; toast(`LOADOUT LIMIT · ${limit} ${label} MAX`); } })); }; limitSelection('[data-flight-ability]', 2, 'OPTIONAL ABILITIES'); limitSelection('[data-flight-gadget]', 2, 'GADGETS'); $('preflight').classList.remove('hidden'); }
function renderJobBoard(kind) { const grid = $('districtGrid'); const cards = kind === 'missions' ? missions.map((mission, index) => ({ missionIndex: index, title: mission.title, meta: `${mission.difficulty} · ${packages[mission.id].type}`, body: packages[mission.id].objective, reward: `${mission.reward} XP · ${Math.floor(mission.reward / 10)} CREDITS` })) : kind === 'contracts' ? contracts.map(contract => ({ missionIndex: missions.findIndex(mission => mission.id === contract.missionId), title: contract.label, meta: `${contract.type} · CONTRACT`, body: `District job · ${contract.xp} XP`, reward: `${contract.credits} CREDITS`, contract })) : kind === 'challenges' ? dailyChallenges.map(challenge => ({ title: challenge.label, meta: 'LOCAL DAILY', body: `${state.daily?.progress?.[challenge.id] || 0}/${challenge.target}`, reward: `${challenge.xp} XP · ${challenge.credits} CREDITS` })) : modifiers.map(modifier => ({ title: modifier.label, meta: 'SPECIAL EVENT MODIFIER', body: modifier.detail, reward: `+${modifier.xp} XP · +${modifier.credits} CREDITS`, modifier })); grid.innerHTML = cards.map((card, index) => { const available = card.missionIndex === undefined || (missionUnlocked(card.missionIndex) && (!card.contract || !state.contractStats?.[card.contract.id]?.completed)); return `<article class="job-card"><span>${card.meta}</span><h3>${card.title}</h3><p>${card.body}</p><b>${card.reward}</b>${card.missionIndex !== undefined ? `<button data-job="${index}" ${available ? '' : 'disabled'}>${available ? 'PREPARE JOB →' : card.contract ? 'CONTRACT CLOSED' : 'ROUTE LOCKED'}</button>` : card.modifier ? `<button data-modifier-job="${card.modifier.id}">ACTIVATE →</button>` : ''}</article>`; }).join(''); grid.querySelectorAll('[data-job]').forEach(button => button.onclick = () => openPreflight(cards[Number(button.dataset.job)])); grid.querySelectorAll('[data-modifier-job]').forEach(button => button.onclick = () => { state = { ...state, activeModifier: button.dataset.modifierJob }; saveState(state); renderJobBoard('events'); }); }
function renderSpecialEvent() { const event = currentSpecialEvent(); const district = districts.find(district => district.id === event.district); const missionIndex = missions.findIndex(mission => district.missions.includes(mission.id)); $('districtGrid').innerHTML = `<article class="job-card special-event"><span>ROTATING EVENT · ${event.availability}</span><h3>${event.name}</h3><p>${district.name} · ${event.weather}<br>Special modifier: ${event.modifier.replace(/([A-Z])/g, ' $1').toUpperCase()}.</p><b>${event.reward}</b><button id="acceptSpecial">ACCEPT EVENT →</button></article>`; $('acceptSpecial').onclick = () => { state = { ...state, activeModifier: event.modifier }; saveState(state); openPreflight({ missionIndex }); }; }
function renderContacts() { $('districtGrid').innerHTML = npcs.map(npc => { const claimed = state.npcClaims.includes(npc.id); return `<article class="job-card"><span>${npc.type} · ${npc.district.toUpperCase()}</span><h3>${npc.name}</h3><p>“${npc.dialogue}”</p><small>OBJECTIVE · ${npc.objective}</small><b>${npc.reward}</b><button data-npc="${npc.id}" ${claimed ? 'disabled' : ''}>${claimed ? 'CONTACT LOGGED' : 'ACCEPT LEAD →'}</button></article>`; }).join(''); document.querySelectorAll('[data-npc]').forEach(button => button.onclick = () => { const npc = npcs.find(npc => npc.id === button.dataset.npc); state = { ...state, credits: state.credits + 15, npcClaims: [...state.npcClaims, npc.id], worldStory: { ...state.worldStory, lore: [...(state.worldStory?.lore || []), npc.story] } }; saveState(state); toast(`CONTACT LOGGED · ${npc.name}`); renderContacts(); }); }
function launch(index = missionIndex, paused = false, runConfig = {}) { if (!paused && !missionUnlocked(index)) { toast(`ROUTE LOCKED · COMPLETE ${missions[index].unlockRequirement.toUpperCase()}`); return; } missionIndex = index; const mission = missions[index]; const runMission = { ...mission, ...runConfig }; const runId = ++activeRunId; runSettled = false; runScore = 0; $('pauseMenu').classList.add('hidden'); $('intro').classList.toggle('hidden', !paused); $('play').classList.remove('hidden'); $('signalCount').textContent = '0'; $('signalTotal').textContent = mission.signals.length; $('signalProgress').style.width = '0%'; $('runScore').textContent = '0'; $('runTime').textContent = '00:00.0'; $('progress').style.width = '0%'; $('progressValue').textContent = '0'; $('hudXp').textContent = state.xp; $('district').textContent = mission.district.toUpperCase(); $('objective').textContent = mission.title.toUpperCase(); $('missionNumber').textContent = `MISSION ${String(index + 1).padStart(2, '0')}`; $('worldGoal').textContent = mission.objective.toUpperCase(); applyRuntimeSettings(); game.scene.start('runner', { mission: runMission, runId, abilities: state.abilities, rain: state.rain, screenShake: state.screenShake, reducedMotion: state.reducedMotion, firstTimeTutorial: !state.tutorialSeen }); if (paused) game.scene.pause('runner'); }
function complete(signals, elapsedMs, runStats) { const mission = missions[missionIndex]; state = completeMission(state, mission, signals, elapsedMs, runStats); state = { ...state, unlockedMissions: missions.filter((_, index) => missionUnlocked(index)).map(route => route.id) }; saveState(state); const missionStat = state.missionStats[mission.id]; const breakdown = state.lastXpBreakdown; renderHomeProgress(); $('hudXp').textContent = state.xp; $('play').classList.add('hidden'); $('finishRating').textContent = '★'.repeat(missionStat.bestRating); $('finishSignals').textContent = `${signals} / ${mission.signals.length} SIGNALS`; $('finishXp').textContent = `+${breakdown.total} XP`; $('finishScore').textContent = `RUN SCORE ${runScore} · BEST ${missionStat.bestScore}`; $('finishTime').textContent = `TIME ${formatTime(elapsedMs)} · BEST ${formatTime(missionStat.bestTime)}`; $('finishLine').textContent = mission.unlocks ? `${mission.unlocks} is now available in the mission terminal.` : 'The final relay hums awake across the city.'; const hasNext = missionIndex + 1 < missions.length && missionUnlocked(missionIndex + 1); $('nextMission').classList.toggle('hidden', !hasNext); $('finish').classList.remove('hidden'); if (state.lastRankUp) { $('levelUpRank').textContent = state.lastRankUp.name; $('levelUpUnlock').textContent = state.lastRankUp.unlock; window.setTimeout(() => $('levelUp').classList.remove('hidden'), 360); } if (state.lastAbilityUnlock) { const ability = { dash: ['DASH', 'Press SHIFT while moving to dash.', 'Short burst · 650 ms cooldown'], doubleJump: ['DOUBLE JUMP', 'Press SPACE again while airborne.', 'One extra jump per airtime'], wallJump: ['WALL JUMP', 'Press SPACE while against a wall.', 'Kick away from rooftop walls'] }[state.lastAbilityUnlock]; $('abilityName').textContent = ability[0]; $('abilityControl').textContent = ability[1]; $('abilityDetail').textContent = ability[2]; window.setTimeout(() => $('abilityUnlock').classList.remove('hidden'), state.lastRankUp ? 750 : 360); } }
function fail(message) { $('play').classList.add('hidden'); $('failLine').textContent = message; $('gameOver').classList.remove('hidden'); }
function openMenu(tab = 'resume') { if (game.scene.isActive('runner')) game.scene.pause('runner'); $('pauseMenu').classList.remove('hidden'); renderPanel(tab); }
function closeMenu() { $('pauseMenu').classList.add('hidden'); if (game.scene.isPaused('runner')) game.scene.resume('runner'); }
function openTitlePanel(panel) {
  const content = panel === 'controls'
    ? { eyebrow: 'OPTIONS', title: 'RUN SETTINGS.', body: `<div class="title-settings"><label>GAME AUDIO <button data-title-setting="muted">${state.muted ? 'OFF' : 'ON'}</button></label><label>REDUCED MOTION <button data-title-setting="reducedMotion">${state.reducedMotion ? 'ON' : 'OFF'}</button></label><label>ATMOSPHERIC RAIN <button data-title-setting="rain">${state.rain ? 'ON' : 'OFF'}</button></label><label>MUSIC <input data-title-volume="musicVolume" type="range" min="0" max="1" step=".05" value="${state.musicVolume}"></label><p><b>KEYBOARD</b> A / D run, SPACE jump, E fire, Q blade.<br><b>TOUCH</b> drag left control to move, then tap FIRE, JUMP, BLADE, or DASH.</p></div>` }
    : { eyebrow: 'CREDITS', title: 'RELAY RUNNER', body: '<p>Created as a small night-runner prototype with Phaser 3.</p>' };
  $('titlePanelEyebrow').textContent = content.eyebrow; $('titlePanelHeading').textContent = content.title; $('titlePanelContent').innerHTML = content.body; $('titlePanel').classList.remove('hidden'); document.querySelectorAll('[data-title-setting]').forEach(button => button.onclick = () => { toggleSetting(button.dataset.titleSetting); openTitlePanel('controls'); }); document.querySelectorAll('[data-title-volume]').forEach(input => input.oninput = () => { state = { ...state, [input.dataset.titleVolume]: Number(input.value) }; saveState(state); applyRuntimeSettings(); });
}
function closeTitlePanel() { $('titlePanel').classList.add('hidden'); }
function leaveHome(next) {
  const intro = $('intro');
  if (intro.classList.contains('is-leaving')) return;
  intro.classList.add('is-leaving');
  window.setTimeout(() => { intro.classList.add('hidden'); intro.classList.remove('is-leaving'); next(); }, 240);
}
function toggleSetting(name) {
  if (name === 'rain') state = { ...state, rain: !state.rain };
  if (name === 'muted') { state = { ...state, muted: !state.muted }; if (state.muted) stopAudioBed(); else if (!$('intro').classList.contains('hidden')) startHomeAudio(); else if (game.scene.isActive('runner')) startAudioBed(); }
  if (name === 'screenShake') state = { ...state, screenShake: !state.screenShake };
  if (name === 'reducedMotion') state = { ...state, reducedMotion: !state.reducedMotion };
  saveState(state);
  applyRuntimeSettings();
  const runner = game.scene.getScene('runner');
  if (name === 'rain') runner.rain?.setVisible(state.rain);
  if (name === 'screenShake') runner.screenShake = state.screenShake;
  if (name === 'reducedMotion') runner.motionReduced = state.reducedMotion;
  renderPanel('settings');
  const labels = { rain: 'ATMOSPHERIC RAIN', muted: 'GAME AUDIO', screenShake: 'SCREEN SHAKE', reducedMotion: 'REDUCED MOTION' };
  const enabled = name === 'muted' ? !state.muted : state[name]; toast(`${labels[name]} ${enabled ? 'ON' : 'OFF'}`);
}
function appendCourierArchive() {
  const journal = $('#panelContent .journal'); if (!journal) return;
  const campaignCleared = state.campaign?.claimedChapters?.length || 0;
  const masteryCount = Object.values(state.mastery || {}).reduce((total, badges) => total + badges.length, 0);
  const contractsComplete = Object.values(state.contractStats || {}).filter(contract => contract.completed).length;
  journal.insertAdjacentHTML('beforeend', `<article class="entry"><span>ARCHIVE</span><div><b>COURIER SYSTEMS ONLINE</b><small>CAMPAIGN ${campaignCleared}/${campaignChapters.length} · RIVAL ${state.rivalProgress?.wins || 0}/3 · MASTERY ${masteryCount}</small><small>CONTRACTS ${contractsComplete}/${contracts.length} · SECRETS ${state.discoveredSecrets} · DISTRICTS ${state.unlockedDistricts.length}/${districts.length}</small></div><span>¤</span></article>`);
}
function appendAchievements() { const journal = $('#panelContent .journal'); if (!journal) return; const badges = state.achievements || []; const cards = missions.map(mission => ({ id: `route-${mission.id}`, label: mission.title, detail: 'COMPLETE ROUTE' })).concat(achievementDefinitions).map(badge => `<div class="badge-card ${badges.includes(badge.id) ? 'earned' : ''}"><b>${badges.includes(badge.id) ? '★' : '○'}</b><span>${badge.label}</span><small>${badge.detail}</small></div>`).join(''); journal.insertAdjacentHTML('beforeend', `<article class="entry achievement-entry"><span>BADGES</span><div><b>${badges.length} ACHIEVEMENTS LOGGED</b><small>${state.completed.length}/${missions.length} ROUTES COMPLETE · ${badges.filter(badge => badge.startsWith('boss-')).length} BOSSES DOWN</small><div class="badge-grid">${cards}</div></div><span>★</span></article>`); }
function appendEnemyCodex() { const journal = $('#panelContent .journal'); if (!journal) return; const discovered = state.discoveredEnemies || []; const cards = Object.entries(enemyIntel).map(([id, intel]) => { const known = discovered.includes(id); return `<div class="codex-card ${known ? 'known' : ''}"><b>${known ? intel.name : 'UNKNOWN SIGNAL'}</b><small>${known ? `ATTACK · ${intel.attack}` : 'Meet this threat in a route to decode it.'}</small><small>${known ? `DEFENSE · ${intel.defense}` : 'LOCKED'}</small><small>${known ? `TACTIC · ${intel.tactic}` : ''}</small></div>`; }).join(''); journal.insertAdjacentHTML('beforeend', `<article class="entry codex-entry"><span>CODEX</span><div><b>${discovered.length}/${Object.keys(enemyIntel).length} THREATS DECODED</b><div class="codex-grid">${cards}</div></div><span>⌁</span></article>`); }
function renderPanel(tab) {
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  const area = $('panelContent');
  if (tab === 'resume') area.innerHTML = '<p class="panel-copy">Your boots are still on the roof. The relay is still lit. The city is waiting for the next step.</p><button id="resume" class="primary">RESUME RUN <b>→</b></button>';
  if (tab === 'missions') area.innerHTML = `<div class="journal">${missions.map((mission, index) => { const unlocked = missionUnlocked(index); const stat = state.missionStats?.[mission.id]; const status = stat?.completed ? 'COMPLETED' : unlocked ? 'AVAILABLE' : 'LOCKED'; return `<button class="entry mission-entry" data-mission="${index}" ${unlocked ? '' : 'disabled'}><span>0${index + 1} · ${status}</span><div><b>${mission.title} · ${mission.difficulty}</b><small>${unlocked ? `${mission.signals.length} SIGNALS · ${mission.objective}` : `UNLOCK: Complete ${mission.unlockRequirement.replaceAll('-', ' ')}.`}</small><small>${stat?.completed ? `RATING ${'★'.repeat(stat.bestRating || 0)} · BEST ${stat.bestScore} · ${formatTime(stat.bestTime)}` : mission.description}</small><small>OPTIONAL: ${mission.optionalObjectives.map(objective => objective.label).join(' · ')}</small><div class="entry-progress"><i style="width:${stat?.completed ? 100 : 0}%"></i></div></div><span>${unlocked ? '→' : '—'}</span></button>`; }).join('')}</div>`;
  if (tab === 'progress') { const rank = getCourierRank(state.xp); const level = getLevelProgress(state.xp); const masteryCount = Object.values(state.mastery || {}).reduce((total, badges) => total + badges.length, 0); area.innerHTML = `<div class="journal"><article class="entry"><span>LEVEL</span><div><b>LEVEL ${level.level} / 100</b><small>${level.level === 100 ? 'Maximum courier level reached.' : `${level.next - state.xp} XP to level ${level.level + 1}.`}</small><div class="entry-progress"><i style="width:${Math.max(0, Math.min(100, level.progress * 100))}%"></i></div></div><span>${level.level === 100 ? 'MAX' : `${Math.round(level.progress * 100)}%`}</span></article><article class="entry"><span>RANK</span><div><b>${rank.name}</b><small>${state.xp} XP · ${rank.next ? `${rank.next.threshold - state.xp} XP to ${rank.next.name}` : 'Maximum courier rank.'}</small><div class="entry-progress"><i style="width:${Math.max(0, Math.min(100, rank.progress * 100))}%"></i></div></div><span>${rank.next ? `${Math.round(rank.progress * 100)}%` : 'MAX'}</span></article><article class="entry"><span>RUNS</span><div><b>${state.totalRuns} completed runs</b><small>Best run score: ${state.bestRun}. ${state.signals} total signals.</small></div><span>${state.completed.length}/${missions.length}</span></article><article class="entry"><span>MASTERY</span><div><b>${masteryCount} route badges</b><small>${missions.map(mission => `${mission.title}: ${(state.mastery?.[mission.id] || []).join(' · ') || 'UNCLAIMED'}`).join('<br>')}</small></div><span>${Object.keys(state.mastery || {}).length}/${missions.length}</span></article></div>`; }
  if (tab === 'settings') area.innerHTML = `<div class="settings"><label class="setting volume-setting"><span>Music volume <b>${Math.round(state.musicVolume * 100)}%</b></span><input data-volume="musicVolume" type="range" min="0" max="1" step=".05" value="${state.musicVolume}"></label><label class="setting volume-setting"><span>SFX volume <b>${Math.round(state.sfxVolume * 100)}%</b></span><input data-volume="sfxVolume" type="range" min="0" max="1" step=".05" value="${state.sfxVolume}"></label><div class="setting"><span>Screen shake</span><button data-setting="screenShake" class="setting-toggle ${state.screenShake ? 'is-on' : ''}" type="button" aria-pressed="${state.screenShake}">${state.screenShake ? 'ON' : 'OFF'}</button></div><div class="setting"><span>Reduced motion</span><button data-setting="reducedMotion" class="setting-toggle ${state.reducedMotion ? 'is-on' : ''}" type="button" aria-pressed="${state.reducedMotion}">${state.reducedMotion ? 'ON' : 'OFF'}</button></div><div class="setting"><span>Atmospheric rain</span><button data-setting="rain" class="setting-toggle ${state.rain ? 'is-on' : ''}" type="button" aria-pressed="${state.rain}">${state.rain ? 'ON' : 'OFF'}</button></div><div class="setting"><span>Game audio</span><button data-setting="muted" class="setting-toggle ${state.muted ? '' : 'is-on'}" type="button" aria-pressed="${!state.muted}">${state.muted ? 'OFF' : 'ON'}</button></div><div class="controls-card"><small>CONTROLS</small><span><b>A / D</b> MOVE</span><span><b>SPACE</b> JUMP</span><span><b>ESC</b> PAUSE</span></div></div>`;
  if (tab === 'settings') area.insertAdjacentHTML('beforeend', '<button id="replayTutorial" class="secondary">REPLAY FIRST-TIME TUTORIAL</button>');
  if (tab === 'contracts') renderContracts();
  if (tab === 'campaign') { renderCampaign(); renderRivalDossier(); }
  if (tab === 'loadout') { renderLoadout(); renderBuildShop(); renderWeaponShop(); }
  if (tab === 'challenges') renderChallenges();
  if (tab === 'progress') { appendCourierArchive(); appendAchievements(); appendEnemyCodex(); }
  $('resume')?.addEventListener('click', closeMenu);
  $('replayTutorial')?.addEventListener('click', () => { state = { ...state, tutorialSeen: false }; saveState(state); toast('TUTORIAL WILL PLAY ON THE NEXT RUN'); });
  document.querySelectorAll('[data-mission]').forEach(button => button.addEventListener('click', () => launch(Number(button.dataset.mission))));
}
game.events.on('signal', (count, total) => { runScore = count * 100 + (window.runSecrets || 0) * 250; $('signalCount').textContent = count; $('runScore').textContent = runScore; $('hudXp').textContent = state.xp + count * 5 + (window.runSecrets || 0) * 25; $('signalProgress').style.width = `${count / total * 100}%`; toast(`SIGNAL CAPTURED · ${count}/${total}`); }); game.events.on('secret', (signals, secrets) => { window.runSecrets = secrets; runScore = signals * 100 + secrets * 250; $('runScore').textContent = runScore; $('hudXp').textContent = state.xp + signals * 5 + secrets * 25; toast(`SECRET FOUND · +25 XP`); }); game.events.on('checkpoint', (signals, secrets, lost, index) => { window.runSecrets = secrets; runScore = signals * 100 + secrets * 250; $('signalCount').textContent = signals; $('runScore').textContent = runScore; $('hudXp').textContent = state.xp + signals * 5 + secrets * 25; $('signalProgress').style.width = `${signals / missions[missionIndex].signals.length * 100}%`; const intel = $('routeIntel'); if (intel && index !== undefined) intel.textContent = `ROUTE · ${index + 1}/${missions[missionIndex].checkpoints.length} CHECKPOINTS`; toast(lost ? `CHECKPOINT RESTORED · ${lost} PICKUP${lost === 1 ? '' : 'S'} LOST` : 'CHECKPOINT SECURED'); }); game.events.on('chase', active => { const intel = $('routeIntel'); if (!intel) return; intel.textContent = active ? 'ROUTE · CHASE ACTIVE' : `ROUTE · ${missions[missionIndex].checkpoints.length} CHECKPOINTS SECURED`; intel.classList.toggle('is-chase', active); }); game.events.on('feedback', playFeedback); game.events.on('progress', value => { $('progress').style.width = `${value}%`; $('progressValue').textContent = value; }); game.events.on('time', elapsedMs => { $('runTime').textContent = formatTime(elapsedMs); }); game.events.on('complete', (signals, elapsedMs, runStats, runId) => { if (runSettled || runId !== activeRunId) return; runSettled = true; stopAudioBed(); complete(signals, elapsedMs, runStats); }); game.events.on('fail', (message, runId) => { if (runSettled || runId !== activeRunId) return; runSettled = true; stopAudioBed(); fail(message); });
function renderLoadout() { const area = $('panelContent'); area.innerHTML = `<div class="journal"><article class="entry"><span>CREDITS</span><div><b>${state.credits}</b><small>Spend on optional, capped upgrades.</small></div><span>¤</span></article>${['MOBILITY', 'ENERGY', 'SIGNAL', 'SURVIVAL'].map(category => `<article class="entry"><span>${category}</span><div>${upgrades.filter(upgrade => upgrade.category === category).map(upgrade => `<button class="loadout-item" data-upgrade="${upgrade.id}" ${state.upgrades.includes(upgrade.id) || state.credits < upgrade.cost ? 'disabled' : ''}><b>${state.upgrades.includes(upgrade.id) ? 'OWNED · ' : ''}${upgrade.label}</b><small>${upgrade.detail} · ${upgrade.cost} CREDITS</small></button>`).join('')}</div></article>`).join('')}<article class="entry"><span>2 SLOTS</span><div>${gadgets.map(gadget => `<button class="loadout-item" data-gadget="${gadget.id}"><b>${state.equipment.includes(gadget.id) ? 'EQUIPPED · ' : ''}${gadget.label}</b><small>${gadget.detail}</small></button>`).join('')}</div></article></div>`; document.querySelectorAll('[data-upgrade]').forEach(button => button.onclick = () => { const upgrade = upgrades.find(item => item.id === button.dataset.upgrade); if (state.credits < upgrade.cost || state.upgrades.includes(upgrade.id)) return; state = { ...state, credits: state.credits - upgrade.cost, upgrades: [...state.upgrades, upgrade.id] }; saveState(state); renderLoadout(); }); document.querySelectorAll('[data-gadget]').forEach(button => button.onclick = () => { const id = button.dataset.gadget; const equipment = state.equipment.includes(id) ? state.equipment.filter(item => item !== id) : [...state.equipment, id].slice(-2); state = { ...state, equipment }; saveState(state); renderLoadout(); }); }
function renderBuildShop() { const journal = $('#panelContent .journal'); if (!journal) return; journal.insertAdjacentHTML('beforeend', `<article class="entry"><span>BUILD 1 / 2</span><div>${buildItems.map(item => { const owned = state.ownedBuildItems.includes(item.id); const equipped = state.buildLoadout.includes(item.id); return `<button class="loadout-item" data-build-item="${item.id}" ${!owned && state.credits < item.cost ? 'disabled' : ''}><b>${equipped ? 'EQUIPPED · ' : owned ? 'OWNED · ' : ''}${item.label}</b><small>${item.detail} · ${owned ? 'SELECT SLOT' : `${item.cost} CREDITS`}</small></button>`; }).join('')}<small>BUILD WITH <b>1</b> AND <b>2</b> · GADGETS MOVE TO <b>3</b> AND <b>4</b></small></div></article>`); document.querySelectorAll('[data-build-item]').forEach(button => button.onclick = () => { const item = buildItems.find(entry => entry.id === button.dataset.buildItem); const owned = state.ownedBuildItems.includes(item.id); if (!owned && state.credits < item.cost) return; const ownedBuildItems = owned ? state.ownedBuildItems : [...state.ownedBuildItems, item.id]; const buildLoadout = state.buildLoadout.includes(item.id) ? state.buildLoadout.map(id => id === item.id ? null : id) : [...state.buildLoadout.filter(Boolean), item.id].slice(-2); state = { ...state, credits: owned ? state.credits : state.credits - item.cost, ownedBuildItems, buildLoadout }; saveState(state); renderLoadout(); renderBuildShop(); }); }
function renderWeaponShop() { const journal = $('#panelContent .journal'); if (!journal) return; journal.insertAdjacentHTML('beforeend', `<article class="entry"><span>WEAPON · E</span><div>${weapons.map(weapon => { const owned = state.ownedWeapons.includes(weapon.id); return `<button class="loadout-item" data-weapon="${weapon.id}" ${!owned && state.credits < weapon.cost ? 'disabled' : ''}><b>${state.equippedWeapon === weapon.id ? 'EQUIPPED · ' : owned ? 'OWNED · ' : ''}${weapon.label}</b><small>${weapon.detail} · ${owned ? 'SELECT' : `${weapon.cost} CREDITS`}</small></button>`; }).join('')}<small>MELEE SWORD IS ALWAYS AVAILABLE WITH <b>Q</b>.</small></div></article>`); document.querySelectorAll('[data-weapon]').forEach(button => button.onclick = () => { const weapon = weapons.find(entry => entry.id === button.dataset.weapon); const owned = state.ownedWeapons.includes(weapon.id); if (!owned && state.credits < weapon.cost) return; state = { ...state, credits: owned ? state.credits : state.credits - weapon.cost, ownedWeapons: owned ? state.ownedWeapons : [...state.ownedWeapons, weapon.id], equippedWeapon: weapon.id }; saveState(state); renderLoadout(); renderBuildShop(); renderWeaponShop(); }); }
function renderContracts() { const area = $('panelContent'); area.innerHTML = `<div class="journal">${contracts.map(contract => { const done = state.contractStats?.[contract.id]?.completed; const index = missions.findIndex(mission => mission.id === contract.missionId); const mission = missions[index]; const available = !done && missionUnlocked(index); return `<button class="entry contract-entry" data-contract="${contract.id}" ${available ? '' : 'disabled'}><span>${done ? 'DONE' : available ? contract.type : 'LOCKED'}</span><div><b>${contract.label}</b><small>${mission.title} · +${contract.xp} XP · +${contract.credits} CREDITS</small></div><span>${available ? '→' : '—'}</span></button>`; }).join('')}</div>`; document.querySelectorAll('[data-contract]').forEach(button => button.onclick = () => { const contract = contracts.find(item => item.id === button.dataset.contract); const index = missions.findIndex(mission => mission.id === contract.missionId); openPreflight({ missionIndex: index, contract }); }); }
function renderCampaign() { const area = $('panelContent'); area.innerHTML = `<div class="journal">${campaignChapters.map((chapter, chapterIndex) => { const unlocked = chapterIndex === 0 || campaignChapters[chapterIndex - 1].missionIds.every(id => state.completed.includes(id)); const completed = chapter.missionIds.every(id => state.completed.includes(id)); const claimed = state.campaign?.claimedChapters?.includes(chapter.id); const jobs = chapter.missionIds.map(id => { const missionIndex = missions.findIndex(mission => mission.id === id); const mission = missions[missionIndex]; const done = state.completed.includes(id); return `<button class="loadout-item" data-campaign-mission="${missionIndex}" ${unlocked ? '' : 'disabled'}><b>${done ? 'COMPLETE · ' : ''}${mission.title}</b><small>${mission.difficulty} · ${done ? 'ROUTE SECURED' : mission.objective}</small></button>`; }).join(''); return `<article class="entry"><span>${completed ? 'CLEARED' : unlocked ? chapter.number : 'LOCKED'}</span><div><b>${chapter.title}</b><small>${chapter.briefing}</small>${chapter.rival ? `<small>RIVAL · ${chapter.rival}</small>` : ''}${jobs}<small>${claimed ? 'CHAPTER REWARD CLAIMED' : completed ? `CHAPTER REWARD · +${chapter.reward.xp} XP · +${chapter.reward.credits} CREDITS` : `REWARD · +${chapter.reward.xp} XP · +${chapter.reward.credits} CREDITS`}</small></div><span>${chapter.missionIds.filter(id => state.completed.includes(id)).length}/${chapter.missionIds.length}</span></article>`; }).join('')}</div>`; document.querySelectorAll('[data-campaign-mission]').forEach(button => button.onclick = () => { $('pauseMenu').classList.add('hidden'); launch(Number(button.dataset.campaignMission)); }); }
function renderRivalDossier() { const wins = state.rivalProgress?.wins || 0; const encounters = state.rivalProgress?.encounters?.length || 0; const victories = state.rivalProgress?.victories || []; document.querySelector('#panelContent .journal')?.insertAdjacentHTML('afterbegin', `<article class="entry"><span>RIVAL</span><div><b>${rivalOperations.name} · ${rivalOperations.title}</b><small>${rivalOperations.dossier}</small><small>OPERATIONS ${encounters}/${rivalOperations.missions.length} · VICTORIES ${wins}/${rivalOperations.missions.length}</small><small>${rivalOperations.missions.map(id => `${missions.find(mission => mission.id === id).title}: ${victories.includes(id) ? 'WON' : 'OPEN'}`).join(' · ')}</small></div><span>${wins}/3</span></article>`); }
const contractTab = document.createElement('button'); contractTab.className = 'tab'; contractTab.dataset.tab = 'contracts'; contractTab.textContent = 'CONTRACTS'; document.querySelector('#pauseMenu nav').append(contractTab);
const campaignTab = document.createElement('button'); campaignTab.className = 'tab'; campaignTab.dataset.tab = 'campaign'; campaignTab.textContent = 'CAMPAIGN'; document.querySelector('#pauseMenu nav').append(campaignTab);
const loadoutTab = document.createElement('button'); loadoutTab.className = 'tab'; loadoutTab.dataset.tab = 'loadout'; loadoutTab.textContent = 'LOADOUT'; document.querySelector('#pauseMenu nav').append(loadoutTab);
function renderChallenges() { const area = $('panelContent'); const challengeGroup = (scope, title, entries, progress) => `<article class="entry"><span>${title}</span><div>${entries.map(challenge => { const value = progress?.progress?.[challenge.id] || 0; const claimed = progress?.claimed?.includes(challenge.id); const ready = value >= challenge.target && !claimed; return `<button class="loadout-item" data-claim-scope="${scope}" data-claim-challenge="${challenge.id}" ${ready ? '' : 'disabled'}><b>${claimed ? 'CLAIMED · ' : ready ? 'READY · ' : ''}${challenge.label}</b><small>${Math.min(value, challenge.target)}/${challenge.target} · +${challenge.xp} XP · +${challenge.credits} RELAY GELS</small></button>`; }).join('')}</div></article>`; const login = state.login || { streak: 0, claimed: false }; area.innerHTML = `<div class="journal"><article class="entry login-reward"><span>LOGIN</span><div><b>DAY ${Math.max(1, login.streak)} RELAY DROP</b><small>Claim a daily login reward. Consecutive days increase Relay Gels.</small><button class="loadout-item" data-login-reward ${login.claimed ? 'disabled' : ''}><b>${login.claimed ? 'CLAIMED TODAY' : 'CLAIM LOGIN REWARD'}</b><small>+XP and Relay Gels</small></button></div></article><article class="entry"><span>MODIFIER</span><div>${modifiers.map(modifier => `<button class="loadout-item" data-modifier="${modifier.id}"><b>${state.activeModifier === modifier.id ? 'ACTIVE · ' : ''}${modifier.label}</b><small>${modifier.detail} · +${modifier.xp} XP · +${modifier.credits} RELAY GELS</small></button>`).join('')}</div></article>${challengeGroup('daily', 'DAILY', dailyChallenges, state.daily)}${challengeGroup('weekly', `WEEKLY · ${state.weekly.period}`, weeklyChallenges, state.weekly)}${challengeGroup('monthly', `MONTHLY · ${state.monthly.period}`, monthlyChallenges, state.monthly)}${challengeGroup('seasonal', `SEASON · ${state.seasonal.period}`, seasonalChallenges, state.seasonal)}</div>`; document.querySelectorAll('[data-modifier]').forEach(button => button.onclick = () => { state = { ...state, activeModifier: state.activeModifier === button.dataset.modifier ? null : button.dataset.modifier }; saveState(state); renderChallenges(); }); document.querySelectorAll('[data-claim-challenge]').forEach(button => button.onclick = () => { const before = state; state = claimChallenge(state, button.dataset.claimScope, button.dataset.claimChallenge); if (state !== before) toast('CHALLENGE REWARD CLAIMED · RELAY GELS SECURED'); renderChallenges(); }); document.querySelector('[data-login-reward]')?.addEventListener('click', () => { const before = state; state = claimLoginReward(state); if (state !== before) toast('LOGIN REWARD CLAIMED · RELAY GELS SECURED'); renderChallenges(); }); }
const challengeTab = document.createElement('button'); challengeTab.className = 'tab'; challengeTab.dataset.tab = 'challenges'; challengeTab.textContent = 'CHALLENGES'; document.querySelector('#pauseMenu nav').append(challengeTab);
game.events.on('energy', energy => { const bar = $('energyBar'); if (bar) bar.style.width = `${energy}%`; const value = $('energyValue'); if (value) value.textContent = `${Math.round(energy)}%`; });
game.events.on('deaths', (deaths, limit) => toast(limit === Infinity ? `RECOVERY ${deaths} · CHECKPOINT READY` : `RECOVERY ${deaths} / ${limit} · NEXT FAILURE ENDS THE RUN`));
game.events.on('game-over', (message, deaths, runId) => { if (runId !== activeRunId) return; runSettled = true; stopAudioBed(); fail(message || `RUN ENDED · ${deaths} RECOVERIES USED`); });
game.events.on('combo', (count, duration) => { const value = $('comboValue'); const bar = $('comboBar'); if (value) value.textContent = count ? `x${count}${count >= 3 ? ' · CHARGED' : ''}` : 'READY'; if (bar) bar.style.width = `${count ? Math.min(100, duration / 3000 * 100) : 0}%`; });
game.events.on('health', health => { const bar = $('healthBar'); if (bar) bar.style.width = `${health / 3 * 100}%`; const value = $('healthValue'); if (value) value.textContent = `${health} / 3`; });
game.events.on('ammo', ammo => { const bar = $('ammoBar'); if (bar) bar.style.width = `${ammo}%`; const value = $('ammoValue'); if (value) value.textContent = ammo > 55 ? 'READY' : 'CHARGE'; });
game.events.on('package', condition => { const meter = $('packageCondition'); if (meter) meter.style.width = `${condition}%`; const value = $('packageValue'); if (value) value.textContent = `${Math.round(condition)}%`; });
game.events.on('detection', timer => { const indicator = $('detectionStatus'); if (indicator) { indicator.textContent = timer ? `ALARM · ESCAPE ${timer}` : 'STEALTH · CLEAR'; indicator.classList.toggle('is-alarm', Boolean(timer)); } });
game.events.on('tutorial', text => { if (text) toast(text); });
game.events.on('sector', sector => { const intel = $('routeIntel'); if (intel) intel.textContent = `SECTOR ${sector.number} · ${sector.checkpoints} CHECKPOINTS · ${sector.signals} SIGNALS`; toast(`SECTOR ${sector.number} ONLINE · RELAY SPIRE AHEAD`); });
game.events.on('enemy-discovered', type => { if (state.discoveredEnemies.includes(type)) return; state = { ...state, discoveredEnemies: [...state.discoveredEnemies, type] }; saveState(state); toast(`CODEX UPDATED · ${enemyIntel[type].name}`); });
document.querySelectorAll('[data-title-panel]').forEach(button => button.addEventListener('click', () => openTitlePanel(button.dataset.titlePanel)));
$('closeTitlePanel').addEventListener('click', closeTitlePanel);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('titlePanel').classList.contains('hidden')) { event.stopImmediatePropagation(); closeTitlePanel(); } }, true);
$('start').onclick = () => { startAudioBed(); leaveHome(game.scene.isPaused('runner') ? () => game.scene.resume('runner') : () => launch(0)); }; $('continue').onclick = () => { startAudioBed(); leaveHome(() => launch(nextMissionIndex())); }; $('pause').onclick = () => openMenu(); $('returnTitle').onclick = () => { stopAudioBed(); $('pauseMenu').classList.add('hidden'); launch(0, true); }; $('again').onclick = () => { startAudioBed(); $('finish').classList.add('hidden'); launch(missionIndex); }; $('nextMission').onclick = () => { startAudioBed(); $('finish').classList.add('hidden'); launch(missionIndex + 1); }; $('finishTitle').onclick = () => { stopAudioBed(); $('finish').classList.add('hidden'); launch(0, true); }; $('retry').onclick = () => { startAudioBed(); $('gameOver').classList.add('hidden'); launch(missionIndex); }; $('failTitle').onclick = () => { stopAudioBed(); $('gameOver').classList.add('hidden'); launch(0, true); }; document.querySelectorAll('.tab').forEach(button => button.onclick = () => renderPanel(button.dataset.tab)); document.querySelectorAll('[data-close]').forEach(button => button.onclick = closeMenu); document.addEventListener('keydown', event => { if (event.repeat) return; if ((event.key === 'Enter' || event.code === 'Space') && !$('gameOver').classList.contains('hidden')) { event.preventDefault(); $('retry').click(); } if (event.key === 'Enter' && !$('intro').classList.contains('hidden')) $('start').click(); if (event.key === 'Escape' && game.scene.isActive('runner') && $('intro').classList.contains('hidden') && $('finish').classList.contains('hidden') && $('gameOver').classList.contains('hidden')) { if ($('pauseMenu').classList.contains('hidden')) openMenu(); else closeMenu(); } });
$('panelContent').addEventListener('click', event => { const button = event.target.closest('[data-setting]'); if (button) toggleSetting(button.dataset.setting); });
document.querySelector('#pauseMenu nav').addEventListener('click', event => { const tab = event.target.closest('.tab[data-tab]'); if (!tab) return; event.preventDefault(); renderPanel(tab.dataset.tab); });
$('panelContent').addEventListener('input', event => { const input = event.target.closest('[data-volume]'); if (!input) return; state = { ...state, [input.dataset.volume]: Number(input.value) }; saveState(state); applyRuntimeSettings(); input.previousElementSibling.querySelector('b').textContent = `${Math.round(Number(input.value) * 100)}%`; });
$('closeLevelUp').onclick = () => $('levelUp').classList.add('hidden');
$('closeAbilityUnlock').onclick = () => $('abilityUnlock').classList.add('hidden');
applyRuntimeSettings(); renderHomeProgress();
launch(0, true);
function openWorldMapSafe() {
  game.scene.stop('runner'); $('pauseMenu').classList.add('hidden');
  const grid = $('districtGrid'); grid.replaceChildren();
  try {
    districts.forEach(district => {
      const unlocked = !district.unlockMission || state.completed.includes(district.unlockMission);
      const progress = districtProgress(district); const card = document.createElement('article'); card.className = `district-card ${district.id}${unlocked ? '' : ' locked'}`;
      card.innerHTML = `<span>${unlocked ? `${progress.percent}% COMPLETE` : `LOCKED · COMPLETE ${district.unlockMission}`}</span><h3>${district.name}</h3><p>${district.identity}</p><small>HAZARDS · ${district.hazards}</small><small>ENEMIES · ${district.enemies}</small><div class="district-progress"><i style="width:${unlocked ? progress.percent : 0}%"></i></div><footer><b>${progress.completed}/${district.missions.length} MISSIONS</b><b>${progress.signals} SIGNALS · ${progress.secrets} SECRETS</b><b>${progress.contractsDone} CONTRACTS</b></footer>`;
      district.missions.forEach(id => { const index = missions.findIndex(mission => mission.id === id); const mission = missions[index]; const button = document.createElement('button'); button.className = 'district-mission'; button.dataset.worldMission = index; button.disabled = !unlocked || !missionUnlocked(index); button.innerHTML = `${mission.title}<small>${button.disabled ? 'LOCKED' : mission.difficulty}</small>`; card.append(button); }); grid.append(card);
    });
  } catch (error) {
    console.error('World Map render failed', error); grid.innerHTML = '<article class="job-card"><span>CITY RELAY NETWORK</span><h3>MAP RECOVERY</h3><p>The map data could not load. Restart the briefing to retry.</p></article>';
  }
  $('worldMap').classList.remove('hidden');
}
$('worldMapTitle').onclick = () => { $('worldMap').classList.add('hidden'); $('intro').classList.remove('hidden'); };
$('finishTitle').onclick = () => { stopAudioBed(); $('finish').classList.add('hidden'); launch(0, true); };
$('failTitle').onclick = () => { stopAudioBed(); $('gameOver').classList.add('hidden'); launch(0, true); };
document.querySelectorAll('[data-board]').forEach(button => button.onclick = () => { if (button.dataset.board === 'districts') return openWorldMap(); if (button.dataset.board === 'events') return renderSpecialEvent(); if (button.dataset.board === 'npcs') return renderContacts(); renderJobBoard(button.dataset.board); });
document.addEventListener('click', event => { const button = event.target.closest('[data-world-mission]'); if (!button || button.disabled) return; event.preventDefault(); event.stopImmediatePropagation(); openPreflight({ missionIndex: Number(button.dataset.worldMission) }); }, true);
$('closePreflight').onclick = () => $('preflight').classList.add('hidden');
 $('launchJob').onclick = () => { if (!selectedJob) return; const mission = missions[selectedJob.missionIndex]; const required = mission.requiredAbilities || []; const selected = [...document.querySelectorAll('[data-flight-ability]:checked')].map(input => input.dataset.flightAbility).filter(ability => !required.includes(ability)).slice(0, 2); const abilities = [...new Set([...required, ...selected])]; const equipment = [...document.querySelectorAll('[data-flight-gadget]:checked')].map(input => input.dataset.flightGadget).slice(0, 2); const passive = $('flightPassive').value || null; state = { ...state, loadout: { abilities, equipment, passive } }; saveState(state); const loadout = { abilities, equipment, upgrades: passive ? [passive] : [], buildItems: state.buildLoadout, weapon: state.equippedWeapon, modifier: modifiers.find(modifier => modifier.id === state.activeModifier) || null }; $('preflight').classList.add('hidden'); $('worldMap').classList.add('hidden'); launch(selectedJob.missionIndex, false, { loadout, activeContract: selectedJob.contract || null }); selectedJob = null; };