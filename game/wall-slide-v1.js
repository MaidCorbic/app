import { RunnerScene } from './src/scenes/RunnerScene.js';

// WALL SLIDE V1 — additive movement feature.
// Detects lateral wall contact while airborne, reduces fall speed and allows one wall jump.
// Intentionally isolated from save/progression systems.

const states = new WeakMap();
const JUMP_CODES = new Set(['Space', 'ArrowUp', 'KeyW']);
const MAX_FALL = 155;
const WALL_JUMP_X = 390;
const WALL_JUMP_Y = 470;
const WALL_LOCK_MS = 140;

function activeScene() { return window.__relayRunnerScene || null; }
function install(scene) {
  if (!scene?.player || states.has(scene)) return;
  states.set(scene, { jumpHeld:false, sliding:false, side:0, lock:0, jumped:false });
}
function airborne(body) {
  return !!body && !(body.blocked?.down || body.touching?.down);
}
function detectWall(body) {
  if (body?.blocked?.left || body?.touching?.left) return -1;
  if (body?.blocked?.right || body?.touching?.right) return 1;
  return 0;
}
function wallJump(scene, state) {
  const body = scene?.player?.body;
  if (!body || !state.sliding || state.jumped || state.lock > 0) return false;
  const direction = -state.side;
  body.setVelocityX?.(direction * WALL_JUMP_X);
  body.setVelocityY?.(-WALL_JUMP_Y);
  state.jumped = true;
  state.lock = WALL_LOCK_MS;
  state.sliding = false;
  scene.wallSliding = false;
  scene.player.setData?.('wallSliding', false);
  scene.player.setData?.('wallJumping', true);
  scene.game?.events?.emit('wall-jump', { direction });
  if (!scene.motionReduced) {
    scene.cameras?.main?.shake?.(75, .002);
    scene.leaveAfterimage?.(0x8df4ff);
  }
  return true;
}
function update(scene, delta) {
  const state = states.get(scene);
  const body = scene?.player?.body;
  const player = scene?.player;
  if (!state || !body || !player?.active) return;
  state.lock = Math.max(0, state.lock - (delta || 16.67));
  const side = detectWall(body);
  const nextSliding = airborne(body) && side !== 0 && !scene.finished && !scene.respawning;
  state.sliding = nextSliding;
  state.side = side;
  if (nextSliding) {
    const vy = body.velocity?.y || 0;
    if (vy > MAX_FALL) body.setVelocityY?.(MAX_FALL);
    player.setData?.('wallSliding', true);
    scene.wallSliding = true;
    if (state.jumpHeld) wallJump(scene, state);
  } else {
    player.setData?.('wallSliding', false);
    scene.wallSliding = false;
    if (side === 0) state.jumped = false;
  }
  if (!airborne(body)) state.jumped = false;
  player.setData?.('wallJumping', state.jumped);
}

const baseCreate = RunnerScene.prototype.create;
const baseUpdate = RunnerScene.prototype.update;
if (!RunnerScene.prototype.__wallSlideV1CreatePatched) {
  RunnerScene.prototype.create = function wallSlideCreate(...args) {
    const result = baseCreate.apply(this,args);
    try { install(this); window.__relayRunnerScene = this; } catch(error) { console.error('[WallSlide] create failed',error); }
    return result;
  };
  RunnerScene.prototype.__wallSlideV1CreatePatched = true;
}
if (!RunnerScene.prototype.__wallSlideV1UpdatePatched) {
  RunnerScene.prototype.update = function wallSlideUpdate(time,delta,...args) {
    const result = baseUpdate.apply(this,[time,delta,...args]);
    try { update(this,delta); } catch(error) { console.error('[WallSlide] update failed',error); }
    return result;
  };
  RunnerScene.prototype.__wallSlideV1UpdatePatched = true;
}
document.addEventListener('keydown', event => {
  if (!JUMP_CODES.has(event.code)) return;
  const state = states.get(activeScene());
  if (state) state.jumpHeld = true;
}, true);
document.addEventListener('keyup', event => {
  if (!JUMP_CODES.has(event.code)) return;
  const state = states.get(activeScene());
  if (state) state.jumpHeld = false;
}, true);
window.addEventListener('blur', () => {
  const state = states.get(activeScene());
  if (state) { state.jumpHeld=false; state.jumped=false; }
});
