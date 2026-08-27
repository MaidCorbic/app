// MOBILE INPUT SINGLE OWNER V1
// Bugfix only: preserve every existing mobile control while removing duplicate
// pointer listeners installed by main.js/core-stability and older touch modules.
// The cleanup works by replacing the controls DOM once; cloned nodes do not carry
// the old DOM event listeners. No mobile action is removed.

const ACTION_KEYS = {
  jump: ' ',
  fire: 'e',
  sword: 'q',
  dash: 'Shift',
  build1: '1',
  build2: '2',
  gadget1: '3',
  gadget2: '4'
};

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

function install() {
  if (window.__relayMobileInputSingleOwner) return;
  window.__relayMobileInputSingleOwner = true;
  // Also stop mobile-controls-controller.js from installing a second owner if it is
  // loaded indirectly by a future runtime module.
  window.__relayMobileControlsController = true;

  if (!isTouchDevice()) return;

  let controls = document.querySelector('.mobile-controls');
  if (!controls) return;

  const cleanControls = controls.cloneNode(true);
  cleanControls.dataset.mobileControlsOwner = 'single-owner-v1';
  controls.replaceWith(cleanControls);
  controls = cleanControls;

  const buttons = [...controls.querySelectorAll('[data-mobile-action]')];
  buttons.forEach(button => {
    const key = ACTION_KEYS[button.dataset.mobileAction];
    if (!key) return;
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      emitKey(key, 'keydown');
      button.classList.add('is-active');
      window.setTimeout(() => {
        emitKey(key, 'keyup');
        button.classList.remove('is-active');
      }, 90);
    }, { passive: false });
  });

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
    const dx = x - (rect.left + rect.width / 2);
    const dy = y - (rect.top + rect.height / 2);
    const distance = Math.min(Math.hypot(dx, dy), maxDrag);
    const angle = Math.atan2(dy, dx);
    thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
    setDirection(Math.abs(dx) < deadzone ? null : dx < 0 ? 'left' : 'right');
  };

  joystick.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', install, { once: true });
} else {
  install();
}
