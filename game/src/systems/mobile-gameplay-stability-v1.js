import { RunnerScene } from '../scenes/RunnerScene.js';

// Mobile gameplay handoff. This module only repairs an invalid player state at
// scene creation/unlock. It deliberately does NOT run a delayed spawn loop or
// teleport a valid player after gameplay has started. HUD and input UI remain
// untouched.
(() => {
  'use strict';

  if (!RunnerScene?.prototype || RunnerScene.prototype.__relayMobileGameplayStabilityV1) return;
  RunnerScene.prototype.__relayMobileGameplayStabilityV1 = true;

  const isTouch = () => navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || window.matchMedia?.('(pointer: coarse)').matches
    || window.matchMedia?.('(hover: none)').matches
    || /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');

  if (!isTouch()) return;

  const resolveSpawn = scene => {
    const authoredX = Number(scene?.mission?.spawn?.x);
    const fallbackX = Number.isFinite(authoredX) ? authoredX : 120;
    const safe = scene?.safeCheckpointSpawn?.(fallbackX);
    if (safe && Number.isFinite(Number(safe.x)) && Number.isFinite(Number(safe.y))) {
      return { x: Number(safe.x), y: Number(safe.y) };
    }
    const authored = scene?.mission?.spawn;
    if (authored && Number.isFinite(Number(authored.x)) && Number.isFinite(Number(authored.y))) {
      return { x: Number(authored.x), y: Number(authored.y) };
    }
    return { x: 120, y: 520 };
  };

  const repairPlayer = (scene, forceSpawn = false) => {
    const player = scene?.player;
    const body = player?.body;
    if (!player || !body) return false;

    const invalidPosition = !Number.isFinite(Number(player.x)) || !Number.isFinite(Number(player.y));
    if (forceSpawn || invalidPosition) {
      const spawn = resolveSpawn(scene);
      player.setPosition?.(spawn.x, spawn.y);
    }

    try { scene.physics?.world?.resume?.(); } catch {}

    body.enable = true;
    body.moves = true;
    body.allowGravity = true;
    if (body.checkCollision) body.checkCollision.none = false;
    body.setAcceleration?.(0, 0);
    body.setVelocity?.(0, 0);

    return true;
  };

  const unlock = scene => {
    if (!scene?.player?.body || scene.finished || scene.respawning) return;
    if (scene.cinematicActive || window.__relayCinematicLock) return;
    repairPlayer(scene, false);
  };

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function mobileGameplayStabilityCreate(...args) {
    const result = originalCreate.apply(this, args);
    window.__relayRunnerScene = this;

    // RunnerScene owns authored spawn placement. Only repair an invalid state;
    // never overwrite a valid spawn with a hard-coded coordinate.
    repairPlayer(this, false);

    const onUnlock = () => unlock(this);
    this.__relayMobileSpawnUnlockHandler = onUnlock;
    window.addEventListener('relay:cinematic-unlock', onUnlock);

    this.events?.once?.('shutdown', () => {
      window.removeEventListener('relay:cinematic-unlock', onUnlock);
      this.__relayMobileSpawnUnlockHandler = null;
    });

    return result;
  };
})();
