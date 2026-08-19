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

const emitKey = (key, type) => {
  window.dispatchEvent(new KeyboardEvent(type, {
    key,
    code: key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key,
    bubbles: true,
    cancelable: true
  }));
};

const style = document.createElement('style');
style.id = 'relay-mobile-controls-controller-style';
style.textContent = `
  body.relay-mobile-controls-hidden .mobile-controls {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
  body.relay-mobile-controls-active .mobile-controls {
    visibility: visible;
    opacity: 1;
  }
  body.relay-mobile-controls-active .mobile-actions {
    pointer-events: none;
  }
`;
document.head.appendChild(style);

function isTouchDevice() {
  return navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || matchMedia('(pointer: coarse)').matches
    || matchMedia('(hover: none)').matches;
}

function isVisible(element) {
  return !!element && !element.classList.contains('hidden') && getComputedStyle(element).display !== 'none';
}

function install() {
  if (window.__relayMobileControlsController) return;
  window.__relayMobileControlsController = true;

  let controls = document.querySelector('.mobile-controls');
  if (!controls) return;

  // Replace the existing nodes once. This intentionally removes every listener
  // previously attached by main.js/core-stability.js without touching the viewport system.
  const cleanControls = controls.cloneNode(true);
  cleanControls.dataset.mobileControlsOwner = 'controller';
  controls.replaceWith(cleanControls);
  controls = cleanControls;

  const joystick = controls.querySelector('[data-mobile-joystick]');
  const thumb = joystick?.querySelector('.mobile-joystick-thumb');
  const buttons = [...controls.querySelectorAll('[data-mobile-action]')];
  const intro = document.getElementById('intro');
  const pause = document.getElementById('pauseMenu');
  const finish = document.getElementById('finish');
  const gameOver = document.getElementById('gameOver');
  const preflight = document.getElementById('preflight');
  const rotatePrompt = document.querySelector('.rotate-prompt');

  let pointerId = null;
  let direction = null;
  let hideTimer = 0;

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
    joystick?.classList.remove('is-active');
    if (thumb) thumb.style.transform = 'translate(0,0)';
  };

  const updateJoystick = (x, y) => {
    if (!joystick || !thumb) return;
    const rect = joystick.getBoundingClientRect();
    const dx = x - rect.left - rect.width / 2;
    const dy = y - rect.top - rect.height / 2;
    const distance = Math.min(Math.hypot(dx, dy), 38);
    const angle = Math.atan2(dy, dx);
    thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
    setDirection(Math.abs(dx) < 9 ? null : dx < 0 ? 'left' : 'right');
  };

  const syncVisibility = () => {
    const mobile = isTouchDevice();
    const gameplayActive = mobile
      && isVisible(document.getElementById('play'))
      && !isVisible(intro)
      && !isVisible(pause)
      && !isVisible(finish)
      && !isVisible(gameOver)
      && !isVisible(preflight)
      && !isVisible(rotatePrompt)
      && !document.body.classList.contains('rotate-prompt-visible');

    document.body.classList.toggle('relay-mobile-controls-active', gameplayActive);
    document.body.classList.toggle('relay-mobile-controls-hidden', !gameplayActive);
    if (!gameplayActive) resetJoystick();
  };

  buttons.forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const key = ACTION_KEYS[button.dataset.mobileAction];
      if (!key) return;
      emitKey(key, 'keydown');
      window.clearTimeout(hideTimer);
      button.classList.add('is-active');
      window.setTimeout(() => {
        emitKey(key, 'keyup');
        button.classList.remove('is-active');
      }, 90);
    }, { passive: false });
  });

  if (joystick && thumb) {
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
    window.addEventListener('blur', resetJoystick);
  }

  const observer = new MutationObserver(syncVisibility);
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  [intro, pause, finish, gameOver, preflight, rotatePrompt].filter(Boolean).forEach(element => {
    observer.observe(element, { attributes: true, attributeFilter: ['class', 'style'] });
  });

  window.addEventListener('resize', syncVisibility, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(syncVisibility, 80), { passive: true });
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
