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

const style = document.createElement('style');
style.id = 'relay-mobile-controls-controller-style';
style.textContent = `
  /* Mobile-controls owns only the touch HUD. Viewport/canvas rules stay untouched. */
  body.relay-mobile-controls-hidden .mobile-controls {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  body.relay-mobile-controls-active .mobile-controls {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  body.relay-mobile-controls-active .mobile-actions {
    pointer-events: none;
  }

  /* Compact, deterministic touch layout. The existing viewport CSS is not changed. */
  body.is-touch .mobile-controls {
    --relay-touch-size: clamp(46px, 12.5vw, 58px);
    left: max(10px, env(safe-area-inset-left, 0px) + 8px) !important;
    right: max(10px, env(safe-area-inset-right, 0px) + 8px) !important;
    bottom: max(12px, env(safe-area-inset-bottom, 0px) + 10px) !important;
    align-items: flex-end !important;
    gap: 10px !important;
  }

  body.is-touch .mobile-joystick {
    flex: 0 0 clamp(76px, 20vw, 92px) !important;
    width: clamp(76px, 20vw, 92px) !important;
    height: clamp(76px, 20vw, 92px) !important;
  }

  body.is-touch .mobile-joystick-thumb {
    width: 42px !important;
    height: 42px !important;
    margin: -21px 0 0 -21px !important;
  }

  body.is-touch .mobile-actions {
    flex: 0 1 auto !important;
    display: grid !important;
    grid-template-columns: repeat(4, var(--relay-touch-size)) !important;
    grid-template-rows: repeat(2, var(--relay-touch-size)) !important;
    gap: 4px !important;
    width: calc(var(--relay-touch-size) * 4 + 12px) !important;
    max-width: calc(100vw - 110px) !important;
    pointer-events: none !important;
  }

  body.is-touch .mobile-controls button {
    width: var(--relay-touch-size) !important;
    height: var(--relay-touch-size) !important;
    min-width: 0 !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    gap: 1px !important;
    line-height: 1 !important;
    font-size: clamp(8px, 2.15vw, 10px) !important;
    letter-spacing: .2px !important;
  }

  body.is-touch .mobile-controls button small {
    display: block !important;
    margin: 0 !important;
    font-size: clamp(5px, 1.35vw, 6px) !important;
    line-height: 1 !important;
    letter-spacing: .55px !important;
  }

  @media (max-width: 380px) {
    body.is-touch .mobile-controls {
      --relay-touch-size: 43px;
      gap: 7px !important;
      left: 8px !important;
      right: 8px !important;
      bottom: max(10px, env(safe-area-inset-bottom, 0px) + 8px) !important;
    }
    body.is-touch .mobile-joystick {
      flex-basis: 72px !important;
      width: 72px !important;
      height: 72px !important;
    }
    body.is-touch .mobile-joystick-thumb {
      width: 38px !important;
      height: 38px !important;
      margin: -19px 0 0 -19px !important;
    }
    body.is-touch .mobile-actions {
      gap: 3px !important;
      width: calc(var(--relay-touch-size) * 4 + 9px) !important;
      max-width: calc(100vw - 88px) !important;
    }
  }

  @media (max-height: 480px) and (orientation: landscape) {
    body.is-touch .mobile-controls {
      --relay-touch-size: 46px;
      bottom: max(7px, env(safe-area-inset-bottom, 0px) + 5px) !important;
      gap: 8px !important;
    }
    body.is-touch .mobile-joystick {
      flex-basis: 76px !important;
      width: 76px !important;
      height: 76px !important;
    }
    body.is-touch .mobile-joystick-thumb {
      width: 40px !important;
      height: 40px !important;
      margin: -20px 0 0 -20px !important;
    }
    body.is-touch .mobile-actions {
      gap: 3px !important;
      width: calc(var(--relay-touch-size) * 4 + 9px) !important;
    }
  }

  @media (max-height: 360px) and (orientation: landscape) {
    body.is-touch .mobile-controls {
      --relay-touch-size: 40px;
      gap: 6px !important;
    }
    body.is-touch .mobile-joystick {
      flex-basis: 66px !important;
      width: 66px !important;
      height: 66px !important;
    }
    body.is-touch .mobile-joystick-thumb {
      width: 34px !important;
      height: 34px !important;
      margin: -17px 0 0 -17px !important;
    }
    body.is-touch .mobile-actions {
      gap: 2px !important;
      width: calc(var(--relay-touch-size) * 4 + 6px) !important;
    }
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

  // Remove listeners installed by older touch-control implementations while keeping
  // the DOM/CSS/viewport implementation intact. cloneNode() does not copy listeners.
  const cleanControls = controls.cloneNode(true);
  cleanControls.dataset.mobileControlsOwner = 'controller';
  controls.replaceWith(cleanControls);
  controls = cleanControls;

  // There is one BUILD button and one GEAR button in the mobile HUD.
  // BUILD 2 / GEAR 4 remain keyboard actions in the game, but their duplicate
  // touch buttons are removed from the HUD so the mobile layout has no duplicates.
  controls.querySelector('[data-mobile-action="build2"]')?.remove();
  controls.querySelector('[data-mobile-action="gadget2"]')?.remove();

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
    const distance = Math.min(Math.hypot(dx, dy), 32);
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
    const action = button.dataset.mobileAction;
    if (ACTION_LABELS[action]) button.setAttribute('aria-label', ACTION_LABELS[action]);
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const key = ACTION_KEYS[action];
      if (!key) return;
      emitKey(key, 'keydown');
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
    joystick.addEventListener('lostpointercapture', resetJoystick);
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
