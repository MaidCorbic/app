import '../feature-runtime.js';
import './mobile-black-screen-fix.js';
import { RunnerScene } from '../scenes/RunnerScene.js';
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
    pad.addEventListener('pointerup', e => { if (e.pointerId === id) reset(); });
    pad.addEventListener('pointercancel', reset);
    window.addEventListener('blur', reset);
  }
  const keys = { jump: ' ', fire: 'e', sword: 'q', dash: 'Shift', build1: '1', build2: '2', gadget1: '3', gadget2: '4' };
  document.querySelectorAll('[data-mobile-action]').forEach(button => button.addEventListener('pointerdown', e => {
    e.preventDefault();
    const key = keys[button.dataset.mobileAction];
    if (!key) return;
    emit(key, 'keydown');
    setTimeout(() => emit(key, 'keyup'), 90);
  }, { passive: false }));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installTouchControls, { once: true }); else installTouchControls();

RunnerScene.prototype.update = function stableUpdate(time, delta) {
  update.call(this, time, delta);
  updateWorldInteraction(this);
};
