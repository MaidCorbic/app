// MOBILE INPUT SINGLE OWNER V2
// Single mobile input owner. Preserves the existing controls while guaranteeing
// one compact action row and clearing held input on lifecycle interruptions.

const ACTION_KEYS = {
  jump: ' ', fire: 'e', sword: 'q', dash: 'Shift', build1: '1', gadget1: '3'
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
  if (window.__relayMobileInputSingleOwnerV2) return;
  window.__relayMobileInputSingleOwnerV2 = true;
  window.__relayMobileControlsController = true;
  if (!isTouchDevice()) return;

  let controls = document.querySelector('.mobile-controls');
  if (!controls) return;

  const cleanControls = controls.cloneNode(true);
  cleanControls.dataset.mobileControlsOwner = 'single-owner-v2';
  controls.replaceWith(cleanControls);
  controls = cleanControls;

  // Keep the mobile HUD intentionally compact: six essential actions plus joystick.
  controls.querySelector('[data-mobile-action="build2"]')?.remove();
  controls.querySelector('[data-mobile-action="gadget2"]')?.remove();

  const buttons = [...controls.querySelectorAll('[data-mobile-action]')];
  buttons.forEach(button => {
    const key = ACTION_KEYS[button.dataset.mobileAction];
    if (!key) return;
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      emitKey(key, 'keydown');
      button.classList.add('is-active');
    }, { passive: false });
    const release = event => {
      if (event && event.pointerId !== undefined && event.pointerId !== button.__pointerId) return;
      if (button.classList.contains('is-active')) emitKey(key, 'keyup');
      button.classList.remove('is-active');
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });

  const releaseAll = () => buttons.forEach(button => {
    const key = ACTION_KEYS[button.dataset.mobileAction];
    if (key) emitKey(key, 'keyup');
    button.classList.remove('is-active');
  });
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

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
