import { RunnerScene } from '../scenes/RunnerScene.js';

// Deterministic mobile gameplay handoff. Only touches touch devices and only
// during the first seconds of a run; desktop/web gameplay remains unchanged.
(() => {
  'use strict';

  if (RunnerScene?.prototype?.__relayMobileGameplayStabilityV1) return;
  if (!RunnerScene?.prototype) return;
  RunnerScene.prototype.__relayMobileGameplayStabilityV1 = true;

  const isTouch = () => navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || window.matchMedia?.('(pointer: coarse)').matches
    || window.matchMedia?.('(hover: none)').matches
    || /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');

  if (!isTouch()) return;

  const safe = scene => {
    if (!scene?.player?.body) return false;
    const body = scene.player.body;
    try { scene.physics?.world?.resume?.(); } catch {}

    body.enable = true;
    body.moves = true;
    body.allowGravity = true;
    body.checkCollision.none = false;

    if (!Number.isFinite(scene.player.x) || !Number.isFinite(scene.player.y)) {
      const spawn = scene.safeCheckpointSpawn?.(Number(scene.mission?.spawn?.x) || 120) || scene.mission?.spawn || { x: 120, y: 520 };
      scene.player.setPosition?.(spawn.x, spawn.y);
    }
    return true;
  };

  const arm = scene => {
    if (!scene || scene.__relayMobileStabilityArmed) return;
    scene.__relayMobileStabilityArmed = true;
    scene.__relayMobileStabilityStartedAt = performance.now();
    scene.__relayMobileStabilityLastY = Number(scene.player?.y) || 0;
    scene.__relayMobileStabilitySettled = false;
  

    const settle = () => {
      if (!scene?.sys?.isActive?.() || scene.finished || scene.respawning) return true;
      const age = performance.now() - scene.__relayMobileStabilityStartedAt;
      if (age > 6000 || scene.__relayMobileStabilitySettled) return true;
      if (scene.cinematicActive || window.__relayCinematicLock) return false;

      const body = scene.player?.body;
      if (!body) return false;
      safe(scene);

      const currentY = Number(scene.player.y) || 0;
      const lastY = Number(scene.__relayMobileStabilityLastY) || currentY;
      const nearSpawn = Math.abs(currentY - (Number(scene.mission?.spawn?.y) || 520)) < 130;
      const stationary = Math.abs(currentY - lastY) < 0.5;
      const grounded = Boolean(body.blocked?.down || body.touching?.down || body.onFloor?.());

      // If the browser/scene lifecycle left the player suspended in the air at
      // spawn, snap once to the authored safe platform and let normal gravity
      // take over. Never apply this recovery after the initial spawn window.
      if (age > 850 && nearSpawn && stationary && !grounded) {
        const spawn = scene.safeCheckpointSpawn?.(Number(scene.mission?.spawn?.x) || 120) || scene.mission?.spawn || { x: 120, y: 520 };
        scene.player.setPosition?.(spawn.x, spawn.y);
        body.setVelocity?.(0, 0);
        safe(scene);
        scene.__relayMobileStabilitySettled = true;
      }

      scene.__relayMobileStabilityLastY = currentY;
      return false;
    };

    const onUnlock = () => {
      scene.__relayMobileStabilityStartedAt = performance.now();
      scene.__relayMobileStabilitySettled = false;
      safe(scene);
    };

    window.addEventListener('relay:cinematic-unlock', onUnlock);
    scene.events?.once?.('shutdown', () => {
      window.removeEventListener('relay:cinematic-unlock', onUnlock);
      scene.__relayMobileStabilityArmed = false;
    });

    const loop = () => {
      if (!settle()) window.setTimeout(loop, 180);
    };
    window.setTimeout(loop, 40);
  };

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function mobileGameplayStabilityCreate(...args) {
    const result = originalCreate.apply(this, args);
    window.__relayRunnerScene = this;
    arm(this);
    return result;
  };

  const originalUpdate = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function mobileGameplayStabilityUpdate(...args) {
    return originalUpdate?.apply(this, args);
  };
})();
