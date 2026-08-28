// Mobile controls bridge V3.
// Movement has exactly one owner on touch devices and writes directly to RunnerScene.
(() => {
  'use strict';

  if (window.__relayMobileControlsBridgeV3) return;
  window.__relayMobileControlsBridgeV3 = true;

  const isTouch = () => navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || window.matchMedia?.('(pointer: coarse)').matches
    || window.matchMedia?.('(hover: none)').matches;

  if (!isTouch()) return;

  const getRunner = () => window.__relayRunnerScene || null;

  const releaseMobileGameplay = scene => {
    if (!scene) return;

    // Never leave a mobile run in a presentation/frozen state.
    scene.cinematicActive = false;
    scene.finished = false;
    scene.respawning = false;

    try { scene.physics?.world?.resume?.(); } catch {}

    const body = scene.player?.body;
    if (body) {
      body.enable = true;
      body.moves = true;
      body.allowGravity = true;
      if (body.checkCollision) body.checkCollision.none = false;
      body.setAcceleration?.(0, 0);
    }

    scene.mobileDirection = null;
  };

  const install = () => {
    const originalPad = document.querySelector('[data-mobile-joystick]');
    if (!originalPad || originalPad.dataset.relayMovementOwner === 'v3') return !!originalPad;

    // Clone once so legacy listeners are discarded. No other module is allowed
    // to clone or bind this node after this point.
    const pad = originalPad.cloneNode(true);
    pad.dataset.relayMovementOwner = 'v3';
    originalPad.replaceWith(pad);

    const thumb = pad.querySelector('.mobile-joystick-thumb');
    if (!thumb) return true;

    const maxDrag = 40;
    const deadzone = 8;
    let pointerId = null;
    let direction = null;

    const setDirection = next => {
      const normalized = next || null;
      if (normalized === direction) return;
      direction = normalized;
      const scene = getRunner();
      if (scene) {
        scene.mobileDirection = normalized;
        scene.mobileInputActive = normalized !== null;
      }
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
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const distance = Math.min(Math.hypot(dx, dy), maxDrag);
      const angle = Math.atan2(dy, dx);
      thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
      setDirection(Math.abs(dx) <= deadzone ? null : dx < 0 ? 'left' : 'right');
    };

    pad.addEventListener('pointerdown', event => {
      if (pointerId !== null) return;
      event.preventDefault();
      event.stopPropagation();
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

    const end = event => reset(event);
    pad.addEventListener('pointerup', end, { passive: true });
    pad.addEventListener('pointercancel', end, { passive: true });
    pad.addEventListener('lostpointercapture', () => reset(), { passive: true });
    window.addEventListener('blur', () => reset(), { passive: true });
    window.addEventListener('pagehide', () => reset(), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) reset();
    });

    return true;
  };

  const boot = () => {
    install();
    let lastRunId = null;

    const tick = () => {
      const scene = getRunner();
      if (scene?.player?.body && scene.runId !== lastRunId) {
        lastRunId = scene.runId;
        releaseMobileGameplay(scene);
      }
      // Also recover if another gameplay layer accidentally pauses the scene.
      if (scene?.player?.body) {
        scene.cinematicActive = false;
        scene.finished = false;
        if (scene.physics?.world?.isPaused) {
          try { scene.physics.world.resume(); } catch {}
        }
        scene.player.body.enable = true;
        scene.player.body.moves = true;
      }
      window.setTimeout(tick, 250);
    };

    tick();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(boot, 0), { once: true });
  } else {
    window.setTimeout(boot, 0);
  }
})();
