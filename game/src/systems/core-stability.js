import { RunnerScene } from '../scenes/RunnerScene.js';
import { applyHorizontalMovementFeel } from '../movement/MovementFeel.js';

const fail = RunnerScene.prototype.fail;
const respawn = RunnerScene.prototype.respawnCheckpoint;
const hit = RunnerScene.prototype.takeSciFiHit;
const update = RunnerScene.prototype.update;
const stop = scene => scene.player?.body?.setVelocity(0, 0);

RunnerScene.prototype.fail = function stableFail(message) {
  if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0) return;
  stop(this); fail.call(this, message);
};
RunnerScene.prototype.takeSciFiHit = function stableHit(message) {
  if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0 || this.healthInvulnerable > 0) return;
  stop(this); hit.call(this, message);
};
RunnerScene.prototype.respawnCheckpoint = function stableRespawn() {
  const spawn = this.mission?.spawn;
  if ((!this.checkpoint || !Number.isFinite(this.checkpoint.x) || !Number.isFinite(this.checkpoint.y)) && spawn) this.checkpoint = { x: spawn.x, y: spawn.y, signals: new Set(), secrets: new Set() };
  respawn.call(this);
  if (this.player?.body) { this.player.body.enable = true; this.player.body.checkCollision.none = false; }
  this.respawnGrace = Math.max(this.respawnGrace || 0, 1100);
  this.healthInvulnerable = Math.max(this.healthInvulnerable || 0, 1100);
};

// Mobile joystick: use the same A/D path as desktop, avoiding a second physics system.
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

// Bounded enemy behavior: patrol, chase, turn, and light evasive movement without
// creating extra timers/tweens for every enemy.
function enemyAI(scene, time) {
  if (!scene.enemies || !scene.player || scene.cinematicActive || scene.respawning || scene.finished || time - (scene._aiAt || 0) < 100) return;
  scene._aiAt = time;
  const list = scene.enemies.getChildren().filter(e => e.active);
  for (let i = 0; i < Math.min(list.length, 14); i++) {
    const enemy = list[i]; const route = enemy.getData('route') || {}; const type = route.type || enemy.texture?.key || '';
    let dir = enemy.getData('aiDir') || enemy.getData('direction') || 1; const min = Number.isFinite(route.min) ? route.min : enemy.x - 110; const max = Number.isFinite(route.max) ? route.max : enemy.x + 110; const distance = Math.abs(scene.player.x - enemy.x);
    if (distance < 330 && type !== 'chicken') dir = Math.sign(scene.player.x - enemy.x) || dir; else if (enemy.x <= min) dir = 1; else if (enemy.x >= max) dir = -1;
    enemy.setData('aiDir', dir); enemy.setFlipX?.(dir < 0); enemy.body?.setVelocityX(dir * (type === 'enemy-runner' ? 135 : type === 'dino' ? 95 : type === 'chicken' ? 72 : type === 'invader' ? 60 : 48));
    if (type === 'invader') { const base = enemy.getData('aiBaseY') ?? enemy.y; enemy.setData('aiBaseY', base); enemy.y = base + Math.sin(time / 330 + i) * 24; }
  }
}

RunnerScene.prototype.update = function stableUpdate(time, delta) {
  update.call(this, time, delta); enemyAI(this, time);
  if (this.finished || this.respawning || this.cinematicActive || this.dashTimer > 0 || !this.player?.body || !this.cursors || !this.keys) return;
  const left = this.cursors.left.isDown || this.keys.A.isDown || this.mobileDirection === 'left';
  const right = this.cursors.right.isDown || this.keys.D.isDown || this.mobileDirection === 'right';
  applyHorizontalMovementFeel({ player: this.player, axis: (right ? 1 : 0) - (left ? 1 : 0), delta });
};
