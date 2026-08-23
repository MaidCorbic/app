(() => {
  'use strict';
  if (window.__relayMobileDirectInputV1) return;
  window.__relayMobileDirectInputV1 = true;

  const isTouch = () => navigator.maxTouchPoints > 0 || 'ontouchstart' in window || matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
  if (!isTouch()) return;

  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || window.game?.scene?.getScenes?.(true)?.find?.(s => s?.scene?.key === 'runner');
  const activeScene = () => { const s = scene(); return s?.scene?.isActive?.() === false ? null : s; };

  const action = name => {
    const s = activeScene();
    if (!s || s.cinematicActive || s.finished || s.respawning) return false;
    let handled = false;
    try {
      if (!s.mobileActions) s.mobileActions = {};
      // Always queue the action even when RunnerScene exposes a handler. update() is
      // the authoritative consumer and must see the same state as keyboard input.
      s.mobileActions[name] = true;
      handled = true;
    } catch {}
    try {
      if (typeof s.mobileActionHandler === 'function') s.mobileActionHandler(name);
    } catch {}
    try {
      const payload = { action: name, source: 'mobile-direct-v2', tutorial: !!s.firstTimeTutorial };
      s.game?.events?.emit?.('mobile-action', payload);
      s.events?.emit?.('mobile-action', payload);
      if (name === 'dash') {
        window.dispatchEvent(new CustomEvent('relay:new-gameplay-dash', { detail: payload }));
      }
    } catch {}
    return handled;
  };

  const move = direction => {
    const s = activeScene();
    if (!s || s.cinematicActive || s.finished || s.respawning) return;
    try {
      if (typeof s.mobileMoveHandler === 'function') s.mobileMoveHandler(direction);
    } catch {}
    try {
      s.mobileDirection = direction || null;
      s.game?.events?.emit?.('mobile-move', { direction, source: 'mobile-direct-v2' });
      s.events?.emit?.('mobile-move', { direction, source: 'mobile-direct-v2' });
    } catch {}
  };

  const root = () => document.querySelector('.mobile-controls');
  let pointerId = null;
  let joystick = null;
  let thumb = null;

  const reset = () => {
    pointerId = null;
    joystick = null;
    if (thumb) thumb.style.transform = 'translate(0,0)';
    move(null);
    document.body.classList.remove('relay-mobile-direct-active');
  };

  const updateJoystick = (x, y) => {
    if (!joystick || !thumb) return;
    const r = joystick.getBoundingClientRect();
    const dx = x - r.left - r.width / 2;
    const dy = y - r.top - r.height / 2;
    const deadzone = Math.max(8, r.width * .12);
    const max = Math.max(24, r.width * .42);
    const distance = Math.min(Math.hypot(dx, dy), max);
    const angle = Math.atan2(dy, dx);
    thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
    move(Math.abs(dx) < deadzone ? null : dx < 0 ? 'left' : 'right');
  };

  document.addEventListener('pointerdown', event => {
    const target = event.target?.closest?.('[data-mobile-action], [data-mobile-joystick]');
    if (!target || !root()?.contains(target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const button = target.closest('[data-mobile-action]');
    if (button) {
      action(button.dataset.mobileAction);
      button.classList.add('is-active');
      window.setTimeout(() => button.classList.remove('is-active'), 130);
      return;
    }

    joystick = target.closest('[data-mobile-joystick]');
    thumb = joystick?.querySelector('.mobile-joystick-thumb') || null;
    pointerId = event.pointerId;
    joystick?.setPointerCapture?.(pointerId);
    document.body.classList.add('relay-mobile-direct-active');
    updateJoystick(event.clientX, event.clientY);
  }, { capture: true, passive: false });

  document.addEventListener('pointermove', event => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    updateJoystick(event.clientX, event.clientY);
  }, { capture: true, passive: false });

  document.addEventListener('pointerup', event => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    reset();
  }, { capture: true, passive: false });

  document.addEventListener('pointercancel', event => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    reset();
  }, { capture: true, passive: false });

  window.addEventListener('blur', reset, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); }, { passive: true });
})();
