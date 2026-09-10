/* Death / respawn / retry guard V1.
 * Narrow stability patch only. No audio, progression, mission or input ownership.
 */
(() => {
  'use strict';

  if (window.__relayDeathRespawnRetryGuardV1) return;
  window.__relayDeathRespawnRetryGuardV1 = true;

  const originalRespawnCheckpoint = RunnerScene.prototype.respawnCheckpoint;

  const RESPAWN_DEBOUNCE_MS = 850;
  const RETRY_FALLBACK_MS = 260;

  RunnerScene.prototype.respawnCheckpoint = function guardedRespawnCheckpoint(...args) {
    if (this.finished) return;

    const now = performance.now();
    const lockedUntil = Number(this.__relayRespawnGuardUntil || 0);

    if (lockedUntil > now) return;

    this.__relayRespawnGuardUntil = now + RESPAWN_DEBOUNCE_MS;

    try {
      return originalRespawnCheckpoint.apply(this, args);
    } catch (error) {
      this.__relayRespawnGuardUntil = 0;
      throw error;
    }
  };

  const getRunnerScene = () => {
    const scene = window.__relayRunnerScene;
    return scene?.scene ? scene : null;
  };

  const restartRunnerSafely = scene => {
    if (!scene || scene.scene?.isActive?.('runner') !== true) return false;
    if (scene.respawning || scene.__relayRespawnInProgress) return false;

    try {
      scene.scene.restart();
      return true;
    } catch (error) {
      console.error('[Relay Runner] Retry restart failed:', error);
      return false;
    }
  };

  document.addEventListener('click', event => {
    const retry = event.target?.closest?.('#retry');
    if (!retry) return;

    const scene = getRunnerScene();
    if (!scene) return;

    window.setTimeout(() => {
      const current = getRunnerScene();
      if (!current) return;

      const gameOver = document.getElementById('gameOver');
      const gameOverVisible = Boolean(
        gameOver &&
        !gameOver.hidden &&
        !gameOver.classList.contains('hidden') &&
        getComputedStyle(gameOver).display !== 'none'
      );

      if (!gameOverVisible && current.scene?.isActive?.('runner') === true) return;

      restartRunnerSafely(current);
    }, RETRY_FALLBACK_MS);
  }, true);
})();
