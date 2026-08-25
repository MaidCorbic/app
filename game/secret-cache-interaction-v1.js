import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 23 — SECRET CACHE REWARD INTERACTION
// Extends the existing secret collectible system only.
// Selected authored secrets grant a short burst using the existing booster mechanic.
// No new HUD, save owner, mission owner, progression owner, or movement system.

function revealCache(scene, secret, secretId) {
  if (!scene || !secret || scene.__secretCacheOpened?.has(secretId)) return false;
  scene.__secretCacheOpened ||= new Set();
  scene.__secretCacheOpened.add(secretId);

  // Reuse the real booster runtime instead of introducing another speed system.
  scene.boosterTimer = Math.max(Number(scene.boosterTimer) || 0, 3600);
  scene.boostedSignals ||= 0;

  const cache = scene.add.container(secret.x, secret.y - 28).setDepth(12);
  const shell = scene.add.rectangle(0, 0, 30, 22, 0x10243a, 1).setStrokeStyle(2, 0x8df4ff, 1);
  const core = scene.add.circle(0, 0, 5, 0xffd06e, 1).setStrokeStyle(1, 0xfff0b0, .9);
  const ring = scene.add.circle(0, 0, 15, 0x8df4ff, .08).setStrokeStyle(1, 0x8df4ff, .55);
  cache.add([ring, shell, core]);

  scene.tweens?.add({ targets: core, alpha: { from: .35, to: 1 }, scale: { from: .8, to: 1.25 }, duration: 420, yoyo: true, repeat: -1 });
  scene.tweens?.add({ targets: ring, scale: { from: .7, to: 1.8 }, alpha: { from: .42, to: 0 }, duration: 520, repeat: 2 });
  scene.tweens?.add({ targets: cache, alpha: 0, y: cache.y - 14, delay: 1100, duration: 380, onComplete: () => cache.destroy() });

  scene.game?.events?.emit('feedback', 'secret-cache');
  scene.playerCue?.('HIDDEN CACHE · SIGNAL BOOST', '#8df4ff');
  return true;
}

if (!RunnerScene.prototype.__secretCacheCollectPatched) {
  const originalCollectSecret = RunnerScene.prototype.collectSecret;
  if (typeof originalCollectSecret === 'function') {
    RunnerScene.prototype.collectSecret = function secretCacheCollectSecret(secret, ...args) {
      const result = originalCollectSecret.call(this, secret, ...args);
      const secretId = Number(secret?.getData?.('id'));
      if (Number.isFinite(secretId) && secretId % 2 === 1) {
        try { revealCache(this, secret, secretId); } catch (error) { console.warn('[SecretCache] reward skipped', error); }
      }
      return result;
    };
    RunnerScene.prototype.__secretCacheCollectPatched = true;
  }
}
