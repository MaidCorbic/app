// Mobile controls bridge V2.
// Preserve the existing HUD/buttons. main.js remains the primary touch-control owner.
// This is only a movement recovery path for RunnerScene.mobileDirection.
(() => {
  'use strict';
  if (window.__relayMobileControlsBridgeV2) return;
  window.__relayMobileControlsBridgeV2 = true;

  const isTouch = () => navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || window.matchMedia?.('(pointer: coarse)').matches
    || window.matchMedia?.('(hover: none)').matches;

  if (!isTouch()) return;

  const runner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const pad = document.querySelector('[data-mobile-joystick]');
  if (!pad) return;

  let pointerId = null;
  let direction = null;

  const setDirection = next => {
    direction = next || null;
    const scene = runner();
    if (scene) scene.mobileDirection = direction;
  };

  const reset = event => {
    if (event && pointerId !== null && event.pointerId !== pointerId) return;
    pointerId = null;
    setDirection(null);
    pad.classList.remove('is-active');
  };

  pad.addEventListener('pointerdown', event => {
    pointerId = event.pointerId;
    pad.classList.add('is-active');
    const rect = pad.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    setDirection(Math.abs(dx) < 10 ? null : dx < 0 ? 'left' : 'right');
  }, { passive: true });

  pad.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId) return;
    const rect = pad.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    setDirection(Math.abs(dx) < 10 ? null : dx < 0 ? 'left' : 'right');
  }, { passive: true });

  pad.addEventListener('pointerup', reset, { passive: true });
  pad.addEventListener('pointercancel', reset, { passive: true });
  pad.addEventListener('lostpointercapture', reset, { passive: true });
  window.addEventListener('blur', () => reset(), { passive: true });
  window.addEventListener('pagehide', () => reset(), { passive: true });

  window.addEventListener('relay:runner-scene-ready', () => setDirection(null), { passive: true });
  window.addEventListener('relay:cinematic-unlock', () => setDirection(null), { passive: true });
})();
