// Mobile controls bridge V3.
// Lifecycle bridge only. The single-owner module owns the joystick DOM/input.
// This module releases the RunnerScene when a new scene instance is created.
// No polling, synthetic movement, or secondary input ownership.
(() => {
  'use strict';

  if (window.__relayMobileControlsBridgeV3) return;
  window.__relayMobileControlsBridgeV3 = true;

  const isTouch = () =>
    navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || window.matchMedia?.('(pointer: coarse)').matches
    || window.matchMedia?.('(hover: none)').matches;

  if (!isTouch()) return;

  let lastRunId = null;

  const releaseMobileGameplay = (scene) => {
    if (!scene) return;

    const runId = scene.runId ?? null;
    if (runId === lastRunId && scene.__relayMobileGameplayReleased) return;

    lastRunId = runId;
    scene.__relayMobileGameplayReleased = true;

    if (scene.cinematicActive) scene.cinematicActive = false;
    scene.finished = false;
    scene.respawning = false;
    scene.mobileAxis = 0;
    scene.mobileDirection = null;

    try {
      scene.physics?.world?.resume?.();
    } catch {
      // Phaser may already be running.
    }

    const body = scene.player?.body;
    if (!body) return;

    body.enable = true;
    body.moves = true;
    body.allowGravity = true;
    body.checkCollision.none = false;
    body.setAcceleration?.(0, 0);
    body.setVelocityX?.(0);
  };

  const attach = (scene) => {
    if (!scene) return;
    window.__relayRunnerScene = scene;
    releaseMobileGameplay(scene);
  };

  window.addEventListener('relay:runner-scene-ready', (event) => {
    attach(event.detail?.scene || window.__relayRunnerScene);
  });

  if (window.__relayRunnerScene) {
    attach(window.__relayRunnerScene);
  }
})();
