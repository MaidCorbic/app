import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 23 — SECRET CACHE ROUTE INTERACTIONS
// Extends the existing secret collectible system only.
// Selected authored secrets reveal a nearby shortcut by reusing existing barriers.
// No new HUD, save owner, mission owner, or progression owner.

const BARRIER_RANGE = 260;
const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

function findRouteBarrier(scene, secret) {
  return (scene?.barriers?.getChildren?.() || [])
    .filter(barrier => barrier?.active !== false)
    .map(barrier => ({ barrier, distance: distance(secret, barrier) }))
    .filter(entry => entry.distance <= BARRIER_RANGE)
    .sort((a, b) => a.distance - b.distance)[0]?.barrier || null;
}

function revealCache(scene, secret, secretId) {
  const barrier = findRouteBarrier(scene, secret);
  if (!barrier || scene.__secretCacheOpened?.has(secretId)) return false;
  scene.__secretCacheOpened ||= new Set();
  scene.__secretCacheOpened.add(secretId);

  const cache = scene.add.container(secret.x, secret.y - 28).setDepth(12);
  const shell = scene.add.rectangle(0, 0, 30, 22, 0x10243a, 1).setStrokeStyle(2, 0x8df4ff, 1);
  const core = scene.add.circle(0, 0, 5, 0xffd06e, 1).setStrokeStyle(1, 0xfff0b0, .9);
  cache.add([shell, core]);
  scene.tweens?.add({ targets: core, alpha: { from: .35, to: 1 }, scale: { from: .8, to: 1.25 }, duration: 520, yoyo: true, repeat: -1 });

  try { barrier.disableBody(true, true); } catch {}
  scene.game?.events?.emit('feedback', 'secret-cache');
  scene.playerCue?.('HIDDEN ROUTE UNLOCKED', '#8df4ff');
  scene.tweens?.add({ targets: cache, alpha: 0, y: cache.y - 12, delay: 850, duration: 420, onComplete: () => cache.destroy() });
  return true;
}

if (!RunnerScene.prototype.__secretCacheCollectPatched) {
  const originalCollectSecret = RunnerScene.prototype.collectSecret;
  if (typeof originalCollectSecret === 'function') {
    RunnerScene.prototype.collectSecret = function secretCacheCollectSecret(secret, ...args) {
      const result = originalCollectSecret.call(this, secret, ...args);
      const secretId = Number(secret?.getData?.('id'));
      if (Number.isFinite(secretId) && secretId % 2 === 1) {
        try { revealCache(this, secret, secretId); } catch (error) { console.warn('[SecretCache] reveal skipped', error); }
      }
      return result;
    };
    RunnerScene.prototype.__secretCacheCollectPatched = true;
  }
}
