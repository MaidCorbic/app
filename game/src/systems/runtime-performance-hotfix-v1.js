// Runtime performance hardening for the current V4 gameplay shell.
// This layer replaces the legacy main.js joystick pointer handlers without
// touching gameplay physics or the Phaser update loop.
(() => {
  if (window.__relayRuntimePerformanceHotfixV1) return;
  window.__relayRuntimePerformanceHotfixV1 = true;

  const pad = document.querySelector('[data-mobile-joystick]');
  const thumb = pad?.querySelector('.mobile-joystick-thumb');
  if (!pad || !thumb) return;

  let activePointerId = null;
  let direction = null;
  let rect = null;

  const invalidate = () => { rect = null; };
  const measure = () => {
    const box = pad.getBoundingClientRect();
    rect = {
      centerX: box.left + box.width / 2,
      centerY: box.top + box.height / 2,
    };
  };

  const emitKey = (key, type) => {
    window.dispatchEvent(new KeyboardEvent(type, {
      key,
      code: key === 'a' ? 'KeyA' : key === 'd' ? 'KeyD' : key,
      bubbles: true,
      cancelable: true,
    }));
  };

  const setDirection = next => {
    if (next === direction) return;
    if (direction === 'left') emitKey('a', 'keyup');
    if (direction === 'right') emitKey('d', 'keyup');
    direction = next;
    if (next === 'left') emitKey('a', 'keydown');
    if (next === 'right') emitKey('d', 'keydown');
  };

  const move = (clientX, clientY) => {
    if (!rect) measure();
    const dx = clientX - rect.centerX;
    const dy = clientY - rect.centerY;
    const max = 38;
    const deadzone = 10;
    const distance = Math.min(Math.hypot(dx, dy), max);
    const angle = Math.atan2(dy, dx);

    thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
    setDirection(Math.abs(dx) <= deadzone ? null : dx < 0 ? 'left' : 'right');
  };

  const reset = () => {
    if (direction === 'left') emitKey('a', 'keyup');
    if (direction === 'right') emitKey('d', 'keyup');
    direction = null;
    activePointerId = null;
    invalidate();
    pad.classList.remove('is-active');
    thumb.style.transform = 'translate(0,0)';
  };

  document.addEventListener('pointerdown', event => {
    if (!event.target?.closest?.('[data-mobile-joystick]')) return;
    activePointerId = event.pointerId;
    measure();
    pad.classList.add('is-active');
    move(event.clientX, event.clientY);
    event.preventDefault();
    event.stopPropagation();
  }, { capture: true, passive: false });

  document.addEventListener('pointermove', event => {
    if (event.pointerId !== activePointerId) return;
    move(event.clientX, event.clientY);
    event.preventDefault();
    event.stopPropagation();
  }, { capture: true, passive: false });

  document.addEventListener('pointerup', event => {
    if (event.pointerId === activePointerId) {
      reset();
      event.stopPropagation();
    }
  }, { capture: true, passive: true });

  document.addEventListener('pointercancel', event => {
    if (event.pointerId === activePointerId) {
      reset();
      event.stopPropagation();
    }
  }, { capture: true, passive: true });

  window.addEventListener('resize', invalidate, { passive: true });
  window.addEventListener('orientationchange', invalidate, { passive: true });
  window.addEventListener('blur', reset, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
})();
