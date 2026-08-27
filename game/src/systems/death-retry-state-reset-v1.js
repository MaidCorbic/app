import { RunnerScene } from '../scenes/RunnerScene.js';

// BUGFIX: death/retry must clear transient movement state without changing
// progression, checkpoints, unlocked content, or existing gameplay features.
(() => {
  if (window.__relayDeathRetryStateResetV1) return;
  window.__relayDeathRetryStateResetV1 = true;

  const originalRespawn = RunnerScene.prototype.respawnCheckpoint;
  const originalFail = RunnerScene.prototype.fail;

  const resetTransientState = scene => {
    scene.mobileDirection = null;
    Object.keys(scene.mobileActions || {}).forEach(key => { scene.mobileActions[key] = false; });

    for (const key of [
      'isCrouching', 'isSliding', 'isDashing', 'isWallSliding',
      'wallSliding', 'wallJumping', 'slideJumping', 'dashActive',
      'crouchHeld', 'slideHeld', 'dashHeld'
    ]) {
      if (key in scene) scene[key] = false;
    }

    const player = scene.player;
    if (!player) return;
    for (const key of [
      'crouching', 'sliding', 'dashing', 'wallSliding', 'wallJumping',
      'slideJumping', 'dashActive', 'crouchHeld', 'slideHeld', 'dashHeld'
    ]) player.setData?.(key, false);

    player.setAngle?.(0).setRotation?.(0).setScale?.(1).setAlpha?.(1).setFlipY?.(false).clearTint?.();
    player.body?.setAcceleration?.(0, 0).setVelocity?.(0, 0);
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
