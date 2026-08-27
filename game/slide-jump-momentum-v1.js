import { RunnerScene } from './src/scenes/RunnerScene.js';

// Slide Jump + Momentum V1 — additive movement layer.
// Builds on crouch/slide without touching save/progression.
// Hold jump during a slide to convert slide momentum into a controlled jump.

const stateByScene = new WeakMap();
const JUMP_CODES = new Set(['Space', 'ArrowUp', 'KeyW']);
const MAX_MOMENTUM = 520;
const BASE_SLIDE_JUMP = 430;
const MOMENTUM_TRANSFER = 0.42;
const AIR_CONTROL = 0.085;
const MOMENTUM_DECAY = 0.992;
const PERFECT_WINDOW_MS = 180;

function getScene() { return window.__relayRunnerScene || null; }

function install(scene) {
  if (!scene?.player || stateByScene.has(scene)) return;
  const body = scene.player.body;
  stateByScene.set(scene, {
    jumpHeld: false,
    wasSliding: false,
    momentum: Math.abs(body?.velocity?.x || 0),
    lastSlideStart: 0,
    slideJumped: false,
    chain: 0,
  });
}

function grounded(scene) {
  const body = scene?.player?.body;
  if (!body) return false;
  if (typeof body.blocked?.down === 'boolean') return body.blocked.down;
  if (typeof body.touching?.down === 'boolean') return body.touching.down;
  return false;
}

function startSlideJump(scene, state) {
  const player = scene.player;
  const body = player.body;
  if (!body || !grounded(scene) || state.slideJumped) return false;

  const vx = body.velocity?.x || 0;
  const speed = Math.min(MAX_MOMENTUM, Math.max(Math.abs(vx), state.momentum));
  const direction = Math.sign(vx || (player.flipX ? -1 : 1)) || 1;
  const now = performance.now();
  const perfect = now - state.lastSlideStart <= PERFECT_WINDOW_MS;
  const bonus = perfect ? 1.12 : 1;
  const horizontal = Math.min(MAX_MOMENTUM, Math.max(260, speed + speed * MOMENTUM_TRANSFER)) * direction;

  body.setVelocityX?.(horizontal);
  body.setVelocityY?.(-BASE_SLIDE_JUMP * bonus);
  if (!body.setVelocityX) body.velocity.x = horizontal;
  if (!body.setVelocityY) body.velocity.y = -BASE_SLIDE_JUMP * bonus;

  state.slideJumped = true;
  state.chain = Math.min(5, state.chain + 1);
  state.momentum = Math.abs(horizontal);
  scene.slideJumping = true;
  player.setData?.('slideJumping', true);
  player.setData?.('movementChain', state.chain);
  scene.game?.events?.emit('slide-jump', { perfect, momentum: Math.round(state.momentum), chain: state.chain });
  return true;
}

function update(scene) {
  const state = stateByScene.get(scene);
  const player = scene?.player;
  const body = player?.body;
  if (!state || !body || !player.active) return;

  const sliding = !!scene.sliding || !!player.getData?.('sliding');
  const speed = Math.abs(body.velocity?.x || 0);
  if (speed > state.momentum) state.momentum = speed;
  state.momentum = Math.min(MAX_MOMENTUM, state.momentum * MOMENTUM_DECAY);

  if (sliding && !state.wasSliding) {
    state.lastSlideStart = performance.now();
    state.slideJumped = false;
  }
  if (!sliding && state.wasSliding && !state.slideJumped) state.chain = 0;
  state.wasSliding = sliding;

  if (sliding && state.jumpHeld) startSlideJump(scene, state);

  if (!grounded(scene) && !sliding) {
    const current = body.velocity?.x || 0;
    const target = current + Math.sign(current || 1) * AIR_CONTROL;
    const limited = Math.max(-MAX_MOMENTUM, Math.min(MAX_MOMENTUM, target));
    body.setVelocityX?.(limited);
    if (!body.setVelocityX) body.velocity.x = limited;
  }

  if (grounded(scene) && Math.abs(body.velocity?.y || 0) < 20) {
    scene.slideJumping = false;
    player.setData?.('slideJumping', false);
  }
}

const originalCreate = RunnerScene.prototype.create;
const originalUpdate = RunnerScene.prototype.update;
if (!RunnerScene.prototype.__slideJumpMomentumV1CreatePatched) {
  RunnerScene.prototype.create = function slideJumpMomentumCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { install(this); window.__relayRunnerScene = this; } catch (error) { console.error('[SlideJump] create failed', error); }
    return result;
  };
  RunnerScene.prototype.__slideJumpMomentumV1CreatePatched = true;
}
if (!RunnerScene.prototype.__slideJumpMomentumV1UpdatePatched) {
  RunnerScene.prototype.update = function slideJumpMomentumUpdate(time, delta, ...args) {
    const result = originalUpdate.apply(this, [time, delta, ...args]);
    try { update(this); } catch (error) { console.error('[SlideJump] update failed', error); }
    return result;
  };
  RunnerScene.prototype.__slideJumpMomentumV1UpdatePatched = true;
}

document.addEventListener('keydown', event => {
  if (!JUMP_CODES.has(event.code)) return;
  const state = stateByScene.get(getScene());
  if (state) state.jumpHeld = true;
}, true);
document.addEventListener('keyup', event => {
  if (!JUMP_CODES.has(event.code)) return;
  const state = stateByScene.get(getScene());
  if (state) state.jumpHeld = false;
}, true);
window.addEventListener('blur', () => {
  const state = stateByScene.get(getScene());
  if (state) state.jumpHeld = false;
});
