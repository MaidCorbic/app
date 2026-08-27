import { RunnerScene } from '../scenes/RunnerScene.js';

// BUGFIX ONLY: death -> retry -> checkpoint reset integrity.
(() => {
  if (window.__relayDeathRetryResetIntegrityV1) return;
  window.__relayDeathRetryResetIntegrityV1 = true;
  const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;
  if (typeof originalRespawnCheckpoint !== 'function') return;
  const clearTransientState = scene => {
    if (!scene) return;
    scene.mobileDirection = null;
    if (scene.mobileActions && typeof scene.mobileActions === 'object') Object.keys(scene.mobileActions).forEach(key => { scene.mobileActions[key] = false; });
    ['dashing','wallSliding','wallJumping','sliding','crouching','slideJumping'].forEach(key => { scene[key] = false; scene.player?.setData?.(key, false); });
    scene.player?.body?.setAcceleration?.(0, 0);
    scene.player?.body?.setVelocity?.(0, 0);
  };
  RunnerScene.prototype.respawnCheckpoint = function deathRetryResetIntegrity(...args) {
    const result = originalRespawnCheckpoint.apply(this, args);
    clearTransientState(this);
    return result;
  };
})();
