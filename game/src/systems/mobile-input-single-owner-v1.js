// MOBILE INPUT SINGLE OWNER V4
// Final mobile control owner. It intentionally runs after main.js so it can
// replace the boot-time control subtree and detach element-bound legacy handlers.

const ACTION_KEYS = Object.freeze({
  jump: ' ',
  fire: 'e',
  sword: 'q',
  dash: 'Shift',
  build1: '1',
  gadget1: '3'
});

const emitKey = (key, type) => window.dispatchEvent(new KeyboardEvent(type, {
  key,
  code: key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key,
  bubbles: true,
  cancelable: true
}));

const isTouchDevice = () => navigator.maxTouchPoints > 0
  || 'ontouchstart' in window
  || window.matchMedia?.('(pointer: coarse)').matches
  || window.matchMedia?.('(hover: none)').matches;

function installCompactStyle() {
  if (document.getElementById('mobile-input-single-owner-style')) return;
  const style = document.createElement('style');
  style.id = 'mobile-input-single-owner-style';
  style.textContent = `
    @media (max-width: 768px) {
      .mobile-controls { touch-action: none !important; }
      .mobile-actions {
        display: grid !important;
        grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
        grid-auto-flow: column !important;
        gap: clamp(4px, 1.2vw, 8px) !important;
        min-width: 0 !important;
        width: min(100%, 560px) !important;
      }
      .mobile-actions > button {
        min-width: 0 !important;
        width: 100% !important;
        max-width: none !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: clip !important;
      }
      .mobile-actions > button small { display: block !important; }
    }
    @media (max-width: 380px) {
      .mobile-actions { gap: 3px !important; }
      .mobile-actions > button { font-size: clamp(8px, 2.4vw, 11px) !important; }
      .mobile-actions > button small { font-size: clamp(7px, 2vw, 9px) !important; }
    }
  `;
  document.head.appendChild(style);
}

function install() {
  if (window.__relayMobileInputSingleOwnerV4) return;
  window.__relayMobileInputSingleOwnerV4 = true;
  window.__relayMobileControlsController = true;
  if (!isTouchDevice()) return;

  const current = document.querySelector('.mobile-controls');
  if (!current) return;
  installCompactStyle();

  // main.js historically adds a second FIRE button at boot. Clone first, then
  // normalize by action name so every mobile action exists exactly once.
  const controls = current.cloneNode(true);
  controls.dataset.mobileControlsOwner = 'single-owner-v4';
  const seen = new Set();
  controls.querySelectorAll('[data-mobile-action]').forEach(button => {
    const action = button.dataset.mobileAction;
    if (!ACTION_KEYS[action] || seen.has(action)) button.remove();
    else seen.add(action);
  });
  current.replaceWith(controls);

  const buttons = [...controls.querySelectorAll('[data-mobile-action]')];
  const activePointers = new Map();

  buttons.forEach(button => {
    const key = ACTION_KEYS[button.dataset.mobileAction];
    if (!key) return;

    const release = pointerId => {
      if (!activePointers.has(pointerId)) return;
      activePointers.delete(pointerId);
      emitKey(key, 'keyup');
      button.classList.remove('is-active');
      try { button.releasePointerCapture?.(pointerId); } catch {}
    };

    button.addEventListener('pointerdown', event => {
      if (activePointers.has(event.pointerId)) return;
      event.preventDefault();
      event.stopPropagation();
      activePointers.set(event.pointerId, true);
      button.setPointerCapture?.(event.pointerId);
      emitKey(key, 'keydown');
      button.classList.add('is-active');
    }, { passive: false });
    button.addEventListener('pointerup', event => release(event.pointerId));
    button.addEventListener('pointercancel', event => release(event.pointerId));
    button.addEventListener('lostpointercapture', event => release(event.pointerId));
  });

  const releaseAll = () => {
    buttons.forEach(button => {
      const key = ACTION_KEYS[button.dataset.mobileAction];
      if (key && button.classList.contains('is-active')) emitKey(key, 'keyup');
      button.classList.remove('is-active');
    });
    activePointers.clear();
  };
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

  const joystick = controls.querySelector('[data-mobile-joystick]');
  const thumb = joystick?.querySelector('.mobile-joystick-thumb');
  if (!joystick || !thumb) return;

  let pointerId = null;
  let direction = null;
  const maxDrag = 38;
  const deadzone = 9;

  const setDirection = next => {
    if (next === direction) return;
    if (direction === 'left') emitKey('a', 'keyup');
    if (direction === 'right') emitKey('d', 'keyup');
    direction = next;
    if (next === 'left') emitKey('a', 'keydown');
    if (next === 'right') emitKey('d', 'keydown');
  };

  const reset = () => {
    setDirection(null);
    pointerId = null;
    joystick.classList.remove('is-active');
    thumb.style.transform = 'translate(0,0)';
  };

  const move = (x, y) => {
    const rect = joystick.getBoundingClientRect();
    const dx = x - rect.left - rect.width / 2;
    const dy = y - rect.top - rect.height / 2;
    const distance = Math.min(Math.hypot(dx, dy), maxDrag);
    const angle = Math.atan2(dy, dx);
    thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
    setDirection(Math.abs(dx) < deadzone ? null : dx < 0 ? 'left' : 'right');
  };

  joystick.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    if (pointerId !== null) reset();
    pointerId = event.pointerId;
    joystick.setPointerCapture?.(pointerId);
    joystick.classList.add('is-active');
    move(event.clientX, event.clientY);
  }, { passive: false });
  joystick.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    move(event.clientX, event.clientY);
  }, { passive: false });

  const end = event => {
    if (event && event.pointerId !== pointerId) return;
    reset();
  };
  joystick.addEventListener('pointerup', end);
  joystick.addEventListener('pointercancel', end);
  joystick.addEventListener('lostpointercapture', reset);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
