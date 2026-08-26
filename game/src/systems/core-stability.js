import '../feature-runtime.js';
import './mobile-black-screen-fix.js';
import './mobile-controls-controller.js';
import { RunnerScene } from '../scenes/RunnerScene.js';
import { applyHorizontalMovementFeel } from '../movement/MovementFeel.js';
import { setupWorldInteraction, updateWorldInteraction } from '../../world-interaction-v1.js';

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

function isTouchDevice() {
  return navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || matchMedia('(pointer: coarse)').matches
    || matchMedia('(hover: none)').matches;
}

const originalCreate = RunnerScene.prototype.create;
const fail = RunnerScene.prototype.fail;
const respawn = RunnerScene.prototype.respawnCheckpoint;
const hit = RunnerScene.prototype.takeSciFiHit;
const update = RunnerScene.prototype.update;
const stop = scene => scene.player?.body?.setVelocity(0, 0);

function restoreMobileGameplay(scene) {
  if (!scene || !isTouchDevice()) return;
  const body = scene.player?.body;
  if (!body) return;

  // The opening cinematic may pause Arcade Physics before it creates its overlay.
  // Ending the presentation must restore the complete gameplay state, not just
  // flip cinematicActive. Otherwise the player renders at spawn height and
  // appears frozen in the air while touch input is correctly reaching the scene.
  scene.cinematicActive = false;
  scene.inputEnabled = true;
  scene.physics?.resume?.();
  scene.physics?.world?.resume?.();
  scene.scene?.resume?.();

  body.enable = true;
  body.moves = true;
  body.allowGravity = true;
  body.checkCollision.none = false;
  body.setAcceleration(0, 0);
  body.setVelocity(0, 0);
  body.setGravityY(0);
  body.reset(scene.player.x, scene.player.y);

  scene.mobileDirection = null;
  scene.mobileActions && Object.keys(scene.mobileActions).forEach(action => { scene.mobileActions[action] = false; });
  scene.cameras?.main?.startFollow?.(scene.player, true, .08, .08);
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
  try {
    const result = originalCreate.apply(this, args);

    // MOBILE ONLY: finish the opening presentation and restore the complete
    // Arcade Physics/player state. Desktop keeps the cinematic untouched.
    if (isTouchDevice() && this.cinematicActive) {
      try { this.cinematicSkipHandler?.(); } catch (error) { console.warn('[Relay Mobile] Could not close opening cinematic cleanly:', error); }
    }
    if (isTouchDevice()) {
      restoreMobileGameplay(this);
      window.setTimeout(() => restoreMobileGameplay(this), 0);
      window.setTimeout(() => restoreMobileGameplay(this), 80);
    }

    setupWorldInteraction(this);
    this.mobileDirection = null;
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
  this.respawnGrace = Math.max(this.respawnGrace || 0, 1100);
  this.healthInvulnerable = Math.max(this.healthInvulnerable || 0, 1100);
  this.mobileDirection = null;
};

RunnerScene.prototype.update = function stableUpdate(time, delta) {
  update.call(this, time, delta);
  updateWorldInteraction(this);
  if (this.finished || this.respawning || this.cinematicActive || this.dashTimer > 0 || !this.player?.body || !this.cursors || !this.keys) return;
  const left = this.cursors.left.isDown || this.keys.A.isDown || this.mobileDirection === 'left';
  const right = this.cursors.right.isDown || this.keys.D.isDown || this.mobileDirection === 'right';
  applyHorizontalMovementFeel({ player: this.player, axis: (right ? 1 : 0) - (left ? 1 : 0), delta });
};
