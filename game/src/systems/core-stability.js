import '../feature-runtime.js';
import './mobile-black-screen-fix.js';
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

const originalCreate = RunnerScene.prototype.create;
const fail = RunnerScene.prototype.fail;
const respawn = RunnerScene.prototype.respawnCheckpoint;
const hit = RunnerScene.prototype.takeSciFiHit;
const update = RunnerScene.prototype.update;
const stop = scene => scene.player?.body?.setVelocity(0, 0);

const isTouchDevice = () => navigator.maxTouchPoints > 0
  || 'ontouchstart' in window
  || window.matchMedia?.('(pointer: coarse)').matches
  || window.matchMedia?.('(hover: none)').matches;

function ensureWebKeyboardRefs(scene) {
  // This is deliberately web-only. Mobile keeps its existing input path intact.
  if (!scene || isTouchDevice() || !scene.input?.keyboard) return;
  if (!scene.cursors) scene.cursors = scene.input.keyboard.createCursorKeys();
  if (!scene.keys) {
    scene.keys = scene.input.keyboard.addKeys({ A:'A', D:'D', W:'W', S:'S', SPACE:'SPACE', SHIFT:'SHIFT', E:'E', Q:'Q' });
  }
}

function recoverWebPresentationLock(scene) {
  if (!scene || isTouchDevice() || !scene.player?.body) return;
  const intro = document.getElementById('relayGameplayIntroFinalV1');
  const title = document.getElementById('titlePanel');
  const introVisible = intro && !intro.hidden && !intro.classList.contains('hidden');
  const titleVisible = title && !title.classList.contains('hidden');
  if (introVisible || titleVisible) return;
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
    ensureWebKeyboardRefs(this);
    recoverWebPresentationLock(this);
    setupWorldInteraction(this);
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
};

function installTouchControls() {
  if (window.__relayTouchInstalled) return;
  window.__relayTouchInstalled = true;
  const emit = (key, type) => window.dispatchEvent(new KeyboardEvent(type, { key, code: key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key, bubbles: true }));
  const pad = document.querySelector('[data-mobile-joystick]');
  const thumb = pad?.querySelector('.mobile-joystick-thumb');
  if (pad && thumb) {
    let id = null; let dir = null;
    const setDir = next => { if (next === dir) return; if (dir) emit(dir === 'left' ? 'a' : 'd', 'keyup'); dir = next; if (dir) emit(dir === 'left' ? 'a' : 'd', 'keydown'); };
    const move = (x, y) => { const r = pad.getBoundingClientRect(); const dx = x - r.left - r.width / 2; const dy = y - r.top - r.height / 2; const d = Math.min(Math.hypot(dx, dy), 38); const a = Math.atan2(dy, dx); thumb.style.transform = `translate(${(Math.cos(a) * d).toFixed(1)}px,${(Math.sin(a) * d).toFixed(1)}px)`; setDir(Math.abs(dx) < 9 ? null : dx < 0 ? 'left' : 'right'); };
    const reset = () => { setDir(null); id = null; thumb.style.transform = 'translate(0,0)'; pad.classList.remove('is-active'); };
    pad.addEventListener('pointerdown', e => { id = e.pointerId; pad.setPointerCapture?.(id); pad.classList.add('is-active'); move(e.clientX, e.clientY); e.preventDefault(); });
    pad.addEventListener('pointermove', e => { if (e.pointerId === id) { move(e.clientX, e.clientY); e.preventDefault(); } }, { passive: false });
    pad.addEventListener('pointerup', e => { if (e.pointerId === id) reset(); }); pad.addEventListener('pointercancel', reset); window.addEventListener('blur', reset);
  }
  const keys = { jump: ' ', fire: 'e', sword: 'q', dash: 'Shift', build1: '1', build2: '2', gadget1: '3', gadget2: '4' };
  document.querySelectorAll('[data-mobile-action]').forEach(button => button.addEventListener('pointerdown', e => { e.preventDefault(); const key = keys[button.dataset.mobileAction]; if (!key) return; emit(key, 'keydown'); setTimeout(() => emit(key, 'keyup'), 90); }, { passive: false }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installTouchControls, { once: true }); else installTouchControls();

RunnerScene.prototype.update = function stableUpdate(time, delta) {
  ensureWebKeyboardRefs(this);
  recoverWebPresentationLock(this);
  update.call(this, time, delta);
  updateWorldInteraction(this);
  if (this.finished || this.respawning || this.cinematicActive || this.dashTimer > 0 || !this.player?.body || !this.cursors || !this.keys) return;
  const left = this.cursors.left.isDown || this.keys.A.isDown || this.mobileDirection === 'left';
  const right = this.cursors.right.isDown || this.keys.D.isDown || this.mobileDirection === 'right';
  applyHorizontalMovementFeel({ player: this.player, axis: (right ? 1 : 0) - (left ? 1 : 0), delta });
};
