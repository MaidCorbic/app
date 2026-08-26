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
  const install = () => {
    const originalPad = document.querySelector('[data-mobile-joystick]');
    if (!originalPad || originalPad.dataset.relayMovementOwner === 'v2') return !!originalPad;

    // main.js/core-stability.js currently attach their own joystick listeners.
    // Replace only the joystick node after those modules have executed. The
    // visual DOM is cloned byte-for-byte, so no HUD/layout/design is changed.
    const pad = originalPad.cloneNode(true);
    pad.dataset.relayMovementOwner = 'v2';
    originalPad.replaceWith(pad);

    const thumb = pad.querySelector('.mobile-joystick-thumb');
    if (!thumb) return true;

    const maxDrag = 38;
    const deadzone = 10;
    let pointerId = null;
    let direction = null;

    const getRunnerNow = () => getRunner();

    const setDirection = next => {
      const normalized = next || null;
      if (normalized === direction) return;
      direction = normalized;
      const scene = getRunnerNow();
      if (scene) scene.mobileDirection = normalized;
    };

    const reset = event => {
      if (event && pointerId !== null && event.pointerId !== pointerId) return;
      pointerId = null;
      setDirection(null);
      pad.classList.remove('is-active');
      thumb.style.transform = 'translate(0px,0px)';
    };

    const move = (clientX, clientY) => {
      const rect = pad.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.min(Math.hypot(dx, dy), maxDrag);
      const angle = Math.atan2(dy, dx);

      thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
      setDirection(Math.abs(dx) <= deadzone ? null : dx < 0 ? 'left' : 'right');
    };

    pad.addEventListener('pointerdown', event => {
      if (pointerId !== null) return;
      event.preventDefault();
      pointerId = event.pointerId;
      pad.setPointerCapture?.(pointerId);
      pad.classList.add('is-active');
      move(event.clientX, event.clientY);
    }, { passive: false });

    pad.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      move(event.clientX, event.clientY);
    }, { passive: false });

    const end = event => {
      if (event && event.pointerId !== pointerId) return;
      reset(event);
    };

    pad.addEventListener('pointerup', end, { passive: true });
    pad.addEventListener('pointercancel', end, { passive: true });
    pad.addEventListener('lostpointercapture', () => reset(), { passive: true });
    window.addEventListener('blur', () => reset(), { passive: true });
    window.addEventListener('pagehide', () => reset(), { passive: true });

    return true;
  };

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
    install();
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

  // main.js and core-stability.js are loaded before this module. Delay the
  // clone by one task so their legacy joystick listeners are removed cleanly.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(boot, 0), { once: true });
  } else {
    window.setTimeout(boot, 0);
  }
})();