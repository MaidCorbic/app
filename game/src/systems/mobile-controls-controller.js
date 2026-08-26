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
  build2: 'BUILD 2 — 2',
  gadget1: 'GEAR — 3',
  gadget2: 'GEAR 2 — 4'
};

const style = document.createElement('style');
style.id = 'relay-mobile-controls-controller-style';
style.textContent = `
  body.is-touch .mobile-controls {
    --relay-touch-size: clamp(46px, 12.5vw, 58px);
    left: max(10px, env(safe-area-inset-left, 0px) + 8px) !important;
    right: max(10px, env(safe-area-inset-right, 0px) + 8px) !important;
    bottom: max(12px, env(safe-area-inset-bottom, 0px) + 10px) !important;
    align-items: flex-end !important;
    gap: 10px !important;
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  body.is-touch .mobile-joystick {
    flex: 0 0 clamp(76px, 20vw, 92px) !important;
    width: clamp(76px, 20vw, 92px) !important;
    height: clamp(76px, 20vw, 92px) !important;
    pointer-events: auto !important;
    touch-action: none !important;
  }

  body.is-touch .mobile-joystick-thumb {
    width: 42px !important;
    height: 42px !important;
    margin: -21px 0 0 -21px !important;
    will-change: transform;
  }

  body.is-touch .mobile-actions {
    flex: 0 1 auto !important;
    display: grid !important;
    grid-template-columns: repeat(4, var(--relay-touch-size)) !important;
    grid-template-rows: 1fr !important;
    gap: 4px !important;
    width: calc(var(--relay-touch-size) * 4 + 12px) !important;
    max-width: calc(100vw - 110px) !important;
    pointer-events: auto !important;
    touch-action: none !important;
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
    pointer-events: auto !important;
    touch-action: none !important;
  }

  body.is-touch .mobile-controls button small {
    display: block;
    margin: 0;
    font-size: clamp(5px, 1.35vw, 6px);
    line-height: 1;
    letter-spacing: .55px;
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

function install() {
  if (window.__relayMobileControlsController) return;
  window.__relayMobileControlsController = true;
  if (!isTouchDevice()) return;

  let controls = document.querySelector('.mobile-controls');
  if (!controls) return;

  const cleanControls = controls.cloneNode(true);
  cleanControls.dataset.mobileControlsOwner = 'controller';
  controls.replaceWith(cleanControls);
  controls = cleanControls;

  const getRunner = () => window.__relayRunnerScene || null;
  const isGameUsable = () => {
    const scene = getRunner();
    return !!scene?.player?.active && !scene.finished && !scene.respawning && !scene.cinematicActive;
  };

  const setMobileDirection = direction => {
    const scene = getRunner();
    if (scene) scene.mobileDirection = direction;
  };

  const clearMobileDirection = () => setMobileDirection(null);

  const joystick = controls.querySelector('[data-mobile-joystick]');
  const thumb = joystick?.querySelector('.mobile-joystick-thumb');
  const buttons = [...controls.querySelectorAll('[data-mobile-action]')];

  buttons.forEach(button => {
    const action = button.dataset.mobileAction;
    if (!ACTION_KEYS[action]) return;
    if (ACTION_LABELS[action]) button.setAttribute('aria-label', ACTION_LABELS[action]);

    let timer = null;
    const press = event => {
      event.preventDefault();
      event.stopPropagation();
      if (!isGameUsable()) return;

      button.classList.add('is-active');
      const key = ACTION_KEYS[action];
      const code = key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key;

      window.dispatchEvent(new KeyboardEvent('keydown', {
        key,
        code,
        bubbles: true,
        cancelable: true
      }));

      timer = window.setTimeout(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', {
          key,
          code,
          bubbles: true,
          cancelable: true
        }));
        timer = null;
        button.classList.remove('is-active');
      }, 120);
    };

    const release = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      button.classList.remove('is-active');
    };

    button.addEventListener('pointerdown', press, { passive: false });
    button.addEventListener('pointerup', release, { passive: true });
    button.addEventListener('pointercancel', release, { passive: true });
    button.addEventListener('lostpointercapture', release, { passive: true });
  });

  if (joystick && thumb) {
    let pointerId = null;
    let direction = null;
    const max = 34;
    const deadzone = 8;

    const setDirection = next => {
      if (next === direction) return;
      direction = next;
      setMobileDirection(next);
      joystick.classList.toggle('is-driving', !!next);
    };

    const resetJoystick = () => {
      pointerId = null;
      direction = null;
      clearMobileDirection();
      joystick.classList.remove('is-active', 'is-driving');
      thumb.style.transform = 'translate(0,0)';
    };

    const updateJoystick = (x, y) => {
      const rect = joystick.getBoundingClientRect();
      const dx = x - (rect.left + rect.width / 2);
      const dy = y - (rect.top + rect.height / 2);
      const distance = Math.min(Math.hypot(dx, dy), max);
      const angle = Math.atan2(dy, dx);
      thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
      setDirection(Math.abs(dx) <= deadzone ? null : dx < 0 ? 'left' : 'right');
    };

    joystick.addEventListener('pointerdown', event => {
      if (!isGameUsable()) return;
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

    joystick.addEventListener('pointerup', end, { passive: true });
    joystick.addEventListener('pointercancel', end, { passive: true });
    joystick.addEventListener('lostpointercapture', resetJoystick, { passive: true });
    window.addEventListener('pointerup', end, { passive: true });
    window.addEventListener('pointercancel', end, { passive: true });
    window.addEventListener('blur', resetJoystick, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) resetJoystick();
    }, { passive: true });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', install, { once: true });
} else {
  install();
}
