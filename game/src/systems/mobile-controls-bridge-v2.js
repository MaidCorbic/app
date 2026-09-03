// Mobile controls bridge V2.
// The existing joystick DOM/design stays untouched. This module only owns
// the movement signal on touch devices and writes directly to RunnerScene.
(() => {
  'use strict';

  if (window.__relayMobileControlsBridgeV2) return;
  window.__relayMobileControlsBridgeV2 = true;

  const isTouch = () => navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || window.matchMedia?.('(pointer: coarse)').matches
    || window.matchMedia?.('(hover: none)').matches;

  if (!isTouch()) return;

  const getRunner = () => window.__relayRunnerScene || null;


  const releaseMobileGameplay = scene => {
    if (!scene || scene.__relayMobileGameplayReleased) return;
    scene.__relayMobileGameplayReleased = true;

    // Mobile must enter real gameplay, not remain in a presentation-only
    // state. Desktop/web is never touched by this path.
    if (scene.cinematicActive) scene.cinematicActive = false;
    scene.finished = false;
    scene.respawning = false;

    try { scene.physics?.world?.resume?.(); } catch { /* Phaser may already be running */ }

    const body = scene.player?.body;
    if (body) {
      body.enable = true;
      body.moves = true;
      body.allowGravity = true;
      body.checkCollision.none = false;
      body.setAcceleration?.(0, 0);
      body.setVelocityX?.(0);
    }

    scene.mobileDirection = null;
  };

  const boot = () => {
    let lastRunId = null;

    const tick = () => {
      const scene = getRunner();

      if (scene?.player?.body && scene.runId !== lastRunId) {
        lastRunId = scene.runId;
        releaseMobileGameplay(scene);
        scene.mobileDirection = null;
      }

      window.setTimeout(tick, 250);
    };

    tick();
  };
  // main.js and core-stability.js are loaded before this module.
  // The single-owner mobile input module owns the joystick DOM/input.
  // This bridge waits one task before starting its gameplay-state lifecycle
  // check so the RunnerScene is fully initialized first.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(boot, 0), { once: true });
  } else {
    window.setTimeout(boot, 0);
  }
})();
