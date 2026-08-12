import Phaser from 'phaser';

/**
 * G2 Movement Feel
 * Safe helpers only. RunnerScene remains the source of truth for jumps, dash,
 * abilities, checkpoints, combat, and mission/state logic.
 */
export const MOVEMENT_FEEL = {
  maxRunSpeed: 475,
  groundAcceleration: 5000,
  airAcceleration: 2900,
  turnAcceleration: 7200,
  groundDeceleration: 3900,
  airDeceleration: 900,
  coyoteMs: 135,
  jumpBufferMs: 145,
  jumpVelocity: -735,
  jumpCutMultiplier: 0.42,
  maxFallSpeed: 1180,
};

export function createMovementFeelState(now = 0) {
  return {
    jumpPressedAt: -Infinity,
    coyoteUntil: -Infinity,
    wasGrounded: false,
    lastLandingAt: -Infinity,
    lastUpdateAt: now,
  };
}

export function applyHorizontalMovementFeel({ player, axis = 0, delta = 16, maxSpeed = null }) {
  if (!player?.body) return false;

  const body = player.body;
  const grounded = !!(body.blocked?.down || body.touching?.down);
  const configuredMax = Number.isFinite(maxSpeed) && maxSpeed > 0 ? maxSpeed : MOVEMENT_FEEL.maxRunSpeed;
  const target = Phaser.Math.Clamp(axis, -1, 1) * configuredMax;
  const changingDirection = axis !== 0 && Math.sign(body.velocity.x || axis) !== Math.sign(axis);
  const rate = axis === 0
    ? (grounded ? MOVEMENT_FEEL.groundDeceleration : MOVEMENT_FEEL.airDeceleration)
    : (changingDirection
      ? MOVEMENT_FEEL.turnAcceleration
      : (grounded ? MOVEMENT_FEEL.groundAcceleration : MOVEMENT_FEEL.airAcceleration));

  body.setVelocityX(Phaser.Math.MoveTowards(body.velocity.x, target, rate * (delta / 1000)));
  body.setVelocityX(Phaser.Math.Clamp(body.velocity.x, -configuredMax, configuredMax));
  if (Math.abs(body.velocity.x) > 30 && player.setFlipX) player.setFlipX(body.velocity.x < 0);
  return true;
}

export function applyMovementFeel({ player, axis = 0, jumpPressed = false, jumpReleased = false, now = 0, delta = 16, state }) {
  if (!player?.body) return false;
  const body = player.body;
  const grounded = !!(body.blocked?.down || body.touching?.down);
  const s = state || createMovementFeelState(now);

  if (jumpPressed) s.jumpPressedAt = now;
  if (grounded) {
    s.coyoteUntil = now + MOVEMENT_FEEL.coyoteMs;
    if (!s.wasGrounded && body.velocity.y >= 0) s.lastLandingAt = now;
  }

  applyHorizontalMovementFeel({ player, axis, delta, maxSpeed: MOVEMENT_FEEL.maxRunSpeed });

  const bufferedJump = now <= s.jumpPressedAt + MOVEMENT_FEEL.jumpBufferMs;
  const coyoteJump = now <= s.coyoteUntil;
  if (bufferedJump && (grounded || coyoteJump)) {
    body.setVelocityY(MOVEMENT_FEEL.jumpVelocity);
    s.jumpPressedAt = -Infinity;
    s.coyoteUntil = -Infinity;
  }

  if (jumpReleased && body.velocity.y < 0) body.setVelocityY(body.velocity.y * MOVEMENT_FEEL.jumpCutMultiplier);
  if (body.velocity.y > MOVEMENT_FEEL.maxFallSpeed) body.setVelocityY(MOVEMENT_FEEL.maxFallSpeed);

  s.wasGrounded = grounded;
  s.lastUpdateAt = now;
  return true;
}
