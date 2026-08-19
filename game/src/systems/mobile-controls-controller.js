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

const ACTION_LABELS = {
  jump: 'JUMP — SPACE',
  fire: 'FIRE — E',
  sword: 'SWORD — Q',
  dash: 'DASH — SHIFT',
  build1: 'BUILD — 1',
  build2: 'BUILD — 2',
  gadget1: 'GEAR — 3',
  gadget2: 'GEAR — 4'
};

const emitKey = (key, type) => {
  window.dispatchEvent(new KeyboardEvent(type, {
    key,
    code: key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key,
    bubbles: true,
    cancelable: true
  }));
};

function install() {
  if (window.__relayMobileControlsController) return;
  window.__relayMobileControlsController = true;

  let controls = document.querySelector('.mobile-controls');
  if (!controls) return;

  // Make one clean copy so listeners installed by the older touch-control paths
  // cannot fire twice. This does not change viewport/canvas behavior or visibility.
  const cleanControls = controls.cloneNode(true);
  cleanControls.dataset.mobileControlsOwner = 'controller';
  controls.replaceWith(cleanControls);
  controls = cleanControls;

  // Remove only exact duplicate action nodes. BUILD 1/2 and GEAR 3/4 are distinct
  // controls and are intentionally kept; a second node with the same action is not.
  const seenActions = new Set();
  controls.querySelectorAll('[data-mobile-action]').forEach(button => {
    const action = button.dataset.mobileAction;
    if (!action) return;
    if (seenActions.has(action)) {
      button.remove();
      return;
    }
    seenActions.add(action);
    button.setAttribute('aria-label', ACTION_LABELS[action] || action);
  });

  const joystick = controls.querySelector('[data-mobile-joystick]');
  const thumb = joystick?.querySelector('.mobile-joystick-thumb');
  const buttons = [...controls.querySelectorAll('[data-mobile-action]')];

  buttons.forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const key = ACTION_KEYS[button.dataset.mobileAction];
      if (!key) return;
      emitKey(key, 'keydown');
      button.classList.add('is-active');
      window.setTimeout(() => {
        emitKey(key, 'keyup');
        button.classList.remove('is-active');
      }, 90);
    }, { passive: false });
  });

  if (!joystick || !thumb) return;

  let pointerId = null;
  let direction = null;

  const setDirection = next => {
    if (next === direction) return;
    if (direction === 'left') emitKey('a', 'keyup');
    if (direction === 'right') emitKey('d', 'keyup');
    direction = next;
    if (next === 'left') emitKey('a', 'keydown');
    if (next === 'right') emitKey('d', 'keydown');
  };

  const resetJoystick = () => {
    setDirection(null);
    pointerId = null;
    joystick.classList.remove('is-active');
    thumb.style.transform = 'translate(0,0)';
  };

  const updateJoystick = (x, y) => {
    const rect = joystick.getBoundingClientRect();
    const dx = x - rect.left - rect.width / 2;
    const dy = y - rect.top - rect.height / 2;
    const distance = Math.min(Math.hypot(dx, dy), 38);
    const angle = Math.atan2(dy, dx);
    thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
    setDirection(Math.abs(dx) < 9 ? null : dx < 0 ? 'left' : 'right');
  };

  joystick.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    pointerId = event.pointerId;
    joystick.setPointerCapture?.(pointerId);
    joystick.classList.add('is-active');
    updateJoystick(event.clientX, event.clientY);
  }, { passive: false });

  joystick.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    updateJoystick(event.clientX, event.clientY);
  }, { passive: false });

  const end = event => {
    if (event && event.pointerId !== pointerId) return;
    resetJoystick();
  };

  joystick.addEventListener('pointerup', end);
  joystick.addEventListener('pointercancel', end);
  joystick.addEventListener('lostpointercapture', resetJoystick);
  window.addEventListener('blur', resetJoystick);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', install, { once: true });
} else {
  install();
}
