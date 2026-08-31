import { RunnerScene } from '../scenes/RunnerScene.js';

// BUGFIX: death/retry must clear transient movement/physics state without
// changing progression, checkpoints, unlocked content, or mission state.
(() => {
  if (window.__relayDeathRetryStateResetV2) return;
  window.__relayDeathRetryStateResetV2 = true;

  const originalRespawn = RunnerScene.prototype.respawnCheckpoint;
  const originalFail = RunnerScene.prototype.fail;

  const clearKeyState = scene => {
    const keys = scene?.keys || {};
    const cursors = scene?.cursors || {};
    for (const key of Object.values(keys)) {
      if (key && typeof key === 'object' && 'isDown' in key) key.isDown = false;
    }
    for (const key of Object.values(cursors)) {
      if (key && typeof key === 'object' && 'isDown' in key) key.isDown = false;
    }
  };

  const resetTransientState = scene => {
    scene.mobileDirection = null;
    Object.keys(scene.mobileActions || {}).forEach(key => { scene.mobileActions[key] = false; });
    clearKeyState(scene);

    for (const key of [
      'isCrouching', 'isSliding', 'isDashing', 'isWallSliding',
      'wallSliding', 'wallJumping', 'slideJumping', 'dashActive',
      'crouchHeld', 'slideHeld', 'dashHeld', 'dashing',
      'wallJumpTimer', 'wallSlideTimer', 'slideTimer', 'dashTimer'
    ]) {
      if (key in scene) scene[key] = typeof scene[key] === 'number' ? 0 : false;
    }

    const player = scene.player;
    if (!player) return;
    for (const key of [
      'crouching', 'sliding', 'dashing', 'wallSliding', 'wallJumping',
      'slideJumping', 'dashActive', 'crouchHeld', 'slideHeld', 'dashHeld',
      'invulnerable'
    ]) player.setData?.(key, false);

    player.setAngle?.(0);
    player.setRotation?.(0);
    player.setScale?.(1);
    player.setAlpha?.(1);
    player.setFlipY?.(false);
    player.clearTint?.();

    const body = player.body;
    body?.setAcceleration?.(0, 0);
    body?.setVelocity?.(0, 0);
    body?.setAngularVelocity?.(0);
    if (body) body.allowRotation = false;

    // Give authoritative feature systems a lifecycle boundary. Dash owns a
    // WeakMap state, so clearing RunnerScene fields alone is insufficient.
    try { window.dispatchEvent(new CustomEvent('relay:runner-transient-reset', { detail: { scene } })); } catch {}
  };

  RunnerScene.prototype.respawnCheckpoint = function deathRetryStateResetRespawn(...args) {
    const result = originalRespawn.apply(this, args);
    resetTransientState(this);
    return result;
  };

  RunnerScene.prototype.fail = function deathRetryStateResetFail(...args) {
    if (!this.finished && !this.respawning) resetTransientState(this);
    return originalFail.apply(this, args);
  };
})();
