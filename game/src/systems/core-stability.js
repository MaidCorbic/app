import '../feature-runtime.js';
import './mobile-black-screen-fix.js';
import { RunnerScene } from '../scenes/RunnerScene.js';
import { SPAWN_SHIELD_MS } from '../src/config/gameplay-timing.js';

function keepPhaserSurfaceMounted() {
  if (window.__relaySurfaceGuardInstalled) return;
  window.__relaySurfaceGuardInstalled = true;
  const style = document.createElement('style');
  style.id = 'relay-phaser-surface-guard';
  style.textContent = '#play.hidden{display:block!important} #phaser-game{min-width:1px;min-height:1px}';
  document.head.appendChild(style);
}
keepPhaserSurfaceMounted();

function installAudioResume() {
  if (window.__relayAudioResumeInstalled) return;
  window.__relayAudioResumeInstalled = true;
  const resume = () => { try { window.__relayAudioContext?.resume?.(); } catch { /* optional */ } };
  window.addEventListener('pointerdown', resume, { passive: true });
  window.addEventListener('keydown', resume, { passive: true });
}
installAudioResume();

const originalCreate = RunnerScene.prototype.create;
const fail = RunnerScene.prototype.fail;
const respawn = RunnerScene.prototype.respawnCheckpoint;
const hit = RunnerScene.prototype.takeSciFiHit;
const update = RunnerScene.prototype.update;
const stop = scene => scene.player?.body?.setVelocity(0, 0);

function isPrimaryTouchDevice() {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const fine = window.matchMedia?.('(pointer: fine)').matches ?? false;
  const touchPoints = Number(navigator.maxTouchPoints || 0);
  return coarse && !fine && touchPoints > 0;
}

function ensureWebKeyboardRefs(scene) {
  if (!scene || isPrimaryTouchDevice() || !scene.input?.keyboard) return;
  const keyboard = scene.input.keyboard;
  keyboard.enabled = true;
  const cursorsReady = Boolean(scene.cursors?.left && scene.cursors?.right && scene.cursors?.up && scene.cursors?.down);
  if (!cursorsReady) scene.cursors = keyboard.createCursorKeys();
  const keysReady = Boolean(scene.keys?.A && scene.keys?.D && scene.keys?.W && scene.keys?.S && scene.keys?.SPACE && scene.keys?.SHIFT && scene.keys?.E && scene.keys?.Q && scene.keys?.ESC);
  if (!keysReady) scene.keys = keyboard.addKeys('A,D,W,S,E,Q,SPACE,SHIFT,ONE,TWO,THREE,FOUR,ESC');
}

function recoverWebPresentationState(scene) {
  if (!scene || isPrimaryTouchDevice() || !scene.player?.body || scene.finished || scene.respawning) return;
  const intro = document.getElementById('relayGameplayIntroFinalV1');
  const title = document.getElementById('titlePanel');
  const introVisible = Boolean(intro && !intro.hidden && !intro.classList.contains('hidden'));
  const titleVisible = Boolean(title && !title.classList.contains('hidden'));
  if (introVisible || titleVisible) return;
  const age = performance.now() - Number(scene.__webSceneStartedAt || performance.now());
  if (age < 450) return;
  if (scene.cinematicActive || scene.inputEnabled === false) {
    scene.cinematicActive = false;
    scene.inputEnabled = true;
    try { scene.physics?.world?.resume?.(); } catch { /* already running */ }
    scene.player.body.enable = true;
    scene.player.body.moves = true;
    scene.player.body.allowGravity = true;
    scene.cameras?.main?.startFollow?.(scene.player, true, .08, .08);
  }
}

function recoverWebFallState(scene) {
  if (!scene || isPrimaryTouchDevice() || !scene.player?.active || !scene.player.body || scene.finished || scene.respawning) return;
  if (scene.cinematicActive) return;
  const body = scene.player.body;
  const boundsBottom = Number(scene.physics?.world?.bounds?.bottom);
  const fellThroughWorld = Number(scene.player.y) >= 760;
  const hitWorldBottom = Number.isFinite(boundsBottom) && Number(body.bottom) >= boundsBottom + 16;
  if (!fellThroughWorld && !hitWorldBottom) return;
  if (scene.__webFallRecoveryPending) return;
  scene.__webFallRecoveryPending = true;
  try {
    scene.falls = Math.max(0, Number(scene.falls || 0)) + 1;
    if (scene.game?.events) scene.game.events.emit('deaths', scene.deaths || 0, scene.deathLimit || 0);
    if (typeof scene.fail === 'function') scene.fail('The courier fell into the relay void.');
  } finally {
    scene.time?.delayedCall?.(600, () => { scene.__webFallRecoveryPending = false; });
  }
}

function installSafeRunnerStart(game) {
  if (!game || game.__relaySafeRunnerStart) return;
  const manager = game.scene;
  const originalStart = manager.start.bind(manager);
  let restarting = false;
  manager.start = function safeRunnerStart(key, data, clear) {
    if (key !== 'runner') return originalStart(key, data, clear);
    const runner = manager.getScene('runner');
    const active = runner?.scene?.isActive?.() || runner?.scene?.isPaused?.();
    if (!active) return originalStart(key, data, clear);
    if (restarting) return;
    restarting = true;
    try { runner.scene.restart(data); }
    finally { window.queueMicrotask(() => { restarting = false; }); }
  };
  game.__relaySafeRunnerStart = true;
}

RunnerScene.prototype.create = function stableCreate(...args) {
  const mission = this.mission;
  if (!mission?.id || !mission.spawn || !mission.goal) {
    console.error('[Relay Runner] Invalid mission data; scene will not start.', mission);
    return;
  }
  installSafeRunnerStart(this.game);
  this.__webSceneStartedAt = performance.now();
  this.__webFallRecoveryPending = false;
  try {
    const result = originalCreate.apply(this, args);
    ensureWebKeyboardRefs(this);
    recoverWebPresentationState(this);
    window.__relayRunnerScene = this;
    return result;
  } catch (error) {
    console.error('[Relay Runner] Mission scene creation failed:', error);
    throw error;
  }
};

RunnerScene.prototype.fail = function stableFail(message) {
  if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0) return;
  stop(this); return fail.call(this, message);
};

RunnerScene.prototype.takeSciFiHit = function stableHit(message) {
  if (this.briefingProtected || this.respawning || this.finished || this.respawnGrace > 0 || this.healthInvulnerable > 0) return;
  stop(this); return hit.call(this, message);
};

RunnerScene.prototype.respawnCheckpoint = function stableRespawn() {
  const spawn = this.mission?.spawn;
  if ((!this.checkpoint || !Number.isFinite(this.checkpoint.x) || !Number.isFinite(this.checkpoint.y) || this.checkpoint.y > 760) && spawn) {
    this.checkpoint = { x: Number.isFinite(spawn.x) ? spawn.x : 120, y: Number.isFinite(spawn.y) ? spawn.y : 520, signals: new Set(), secrets: new Set() };
  }
  respawn.call(this);
  if (this.player?.body) { this.player.body.enable = true; this.player.body.checkCollision.none = false; }
  this.respawnGrace = SPAWN_SHIELD_MS;
  this.healthInvulnerable = SPAWN_SHIELD_MS;
};

RunnerScene.prototype.update = function stableUpdate(time, delta) {
  ensureWebKeyboardRefs(this);
  recoverWebPresentationState(this);
  update.call(this, time, delta);
  recoverWebFallState(this);
};
