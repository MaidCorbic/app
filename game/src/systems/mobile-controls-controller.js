const ACTION_KEYS = {
  jump: ' ',
  fire: 'e',
  sword: 'q',
  dash: 'Shift',
  build1: '1',
  gadget1: '3'
};

const ACTION_LABELS = {
  jump: 'JUMP — SPACE',
  fire: 'FIRE — E',
  sword: 'SWORD — Q',
  dash: 'DASH — SHIFT',
  build1: 'BUILD — 1',
  gadget1: 'GEAR — 3'
};

// Phaser's keyboard manager listens on the document target. Dispatching only on
// window makes a synthetic mobile key invisible to the real gameplay input path.
const emitKey = (key, type) => {
  const event = new KeyboardEvent(type, {
    key,
    code: key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key,
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(event);
};

if (!document.getElementById('relay-mobile-controls-controller-style')) {
  const style = document.createElement('style');
  style.id = 'relay-mobile-controls-controller-style';
  style.textContent = `
    body.is-touch .mobile-controls {
      --relay-touch-size: clamp(44px, 11.5vw, 54px);
      left: max(8px, env(safe-area-inset-left, 0px) + 6px) !important;
      right: max(8px, env(safe-area-inset-right, 0px) + 6px) !important;
      bottom: max(10px, env(safe-area-inset-bottom, 0px) + 8px) !important;
      align-items: flex-end !important;
      gap: 8px !important;
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
      touch-action: none;
    }
    body.is-touch .mobile-joystick {
      flex: 0 0 clamp(68px, 18vw, 82px) !important;
      width: clamp(68px, 18vw, 82px) !important;
      height: clamp(68px, 18vw, 82px) !important;
      pointer-events: auto !important;
      touch-action: none;
    }
    body.is-touch .mobile-joystick-thumb {
      width: 38px !important;
      height: 38px !important;
      margin: -19px 0 0 -19px !important;
    }
    body.is-touch .mobile-actions {
      flex: 0 1 auto !important;
      display: grid !important;
      grid-template-columns: repeat(3, var(--relay-touch-size)) !important;
      grid-auto-rows: var(--relay-touch-size) !important;
      gap: 4px !important;
      width: calc(var(--relay-touch-size) * 3 + 8px) !important;
      max-width: calc(100vw - 92px) !important;
      pointer-events: auto !important;
      touch-action: none;
    }
    body.is-touch .mobile-controls button {
      width: var(--relay-touch-size) !important;
      height: var(--relay-touch-size) !important;
      min-width: 0 !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 3px !important;
      line-height: 1 !important;
      font-size: clamp(7px, 1.8vw, 9px) !important;
      letter-spacing: .15px !important;
      pointer-events: auto !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    body.is-touch .mobile-controls button small {
      display: block;
      margin: 3px 0 0;
      font-size: clamp(4.5px, 1.15vw, 5.5px);
      line-height: 1;
      letter-spacing: .45px;
    }
    #relayMobileSettings {
      position: fixed !important;
      z-index: 205 !important;
      right: max(10px, env(safe-area-inset-right, 0px) + 8px) !important;
      bottom: max(86px, env(safe-area-inset-bottom, 0px) + 82px) !important;
      width: 52px !important;
      height: 38px !important;
      padding: 0 !important;
      border: 1px solid rgba(141,244,255,.55) !important;
      border-radius: 9px !important;
      background: linear-gradient(145deg,rgba(8,24,42,.97),rgba(3,10,19,.98)) !important;
      color: #8df4ff !important;
      box-shadow: 0 0 18px rgba(25,200,245,.18), inset 0 1px rgba(255,255,255,.05) !important;
      font: 900 7px/1 'DM Mono',monospace !important;
      letter-spacing: .5px !important;
      pointer-events: auto !important;
      touch-action: manipulation !important;
    }
    #relayMobileSettings:active { transform: translateY(1px) scale(.98); }
    @media (max-width: 380px) {
      body.is-touch .mobile-controls {
        --relay-touch-size: 40px;
        gap: 6px !important;
        left: 6px !important;
        right: 6px !important;
        bottom: max(8px, env(safe-area-inset-bottom, 0px) + 6px) !important;
      }
      body.is-touch .mobile-joystick {
        flex-basis: 64px !important;
        width: 64px !important;
        height: 64px !important;
      }
      body.is-touch .mobile-joystick-thumb {
        width: 34px !important;
        height: 34px !important;
        margin: -17px 0 0 -17px !important;
      }
      body.is-touch .mobile-actions {
        gap: 3px !important;
        width: calc(var(--relay-touch-size) * 3 + 6px) !important;
        max-width: calc(100vw - 80px) !important;
      }
      #relayMobileSettings { bottom: max(76px, env(safe-area-inset-bottom, 0px) + 72px) !important; }
    }
    @media (orientation: landscape) {
      body.is-touch .mobile-actions {
        grid-template-columns: repeat(6, var(--relay-touch-size)) !important;
        grid-auto-rows: var(--relay-touch-size) !important;
        width: calc(var(--relay-touch-size) * 6 + 20px) !important;
        max-width: calc(100vw - 96px) !important;
      }
      #relayMobileSettings { bottom: max(66px, env(safe-area-inset-bottom, 0px) + 62px) !important; }
    }
    @media (max-height: 480px) and (orientation: landscape) {
      body.is-touch .mobile-controls {
        --relay-touch-size: 42px;
        bottom: max(6px, env(safe-area-inset-bottom, 0px) + 4px) !important;
        gap: 7px !important;
      }
      body.is-touch .mobile-joystick {
        flex-basis: 68px !important;
        width: 68px !important;
        height: 68px !important;
      }
      body.is-touch .mobile-joystick-thumb {
        width: 36px !important;
        height: 36px !important;
        margin: -18px 0 0 -18px !important;
      }
      #relayMobileSettings { bottom: max(58px, env(safe-area-inset-bottom, 0px) + 54px) !important; }
    }
    @media (max-height: 360px) and (orientation: landscape) {
      body.is-touch .mobile-controls {
        --relay-touch-size: 36px;
        gap: 5px !important;
      }
      body.is-touch .mobile-joystick {
        flex-basis: 60px !important;
        width: 60px !important;
        height: 60px !important;
      }
      body.is-touch .mobile-joystick-thumb {
        width: 32px !important;
        height: 32px !important;
        margin: -16px 0 0 -16px !important;
      }
      #relayMobileSettings { bottom: max(50px, env(safe-area-inset-bottom, 0px) + 46px) !important; }
    }
  `;
  document.head.appendChild(style);
}

function isTouchDevice() {
  return navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || matchMedia('(pointer: coarse)').matches
    || matchMedia('(hover: none)').matches;
}

function openMobileSettings() {
  const pause = document.getElementById('pauseMenu');
  const pauseButton = document.getElementById('pause');
  const settingsTab = document.querySelector('#pauseMenu [data-tab="settings"]');
  if (!pause || !pauseButton || !settingsTab) return;
  if (pause.classList.contains('hidden')) pauseButton.click();
  window.setTimeout(() => settingsTab.click(), 0);
}

function ensureSettingsButton() {
  if (!isTouchDevice() || document.getElementById('relayMobileSettings')) return;
  const game = document.getElementById('game');
  if (!game) return;
  const button = document.createElement('button');
  button.id = 'relayMobileSettings';
  button.type = 'button';
  button.setAttribute('aria-label', 'Open mobile settings');
  button.textContent = 'SETTINGS';
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    openMobileSettings();
  }, { passive: false });
  game.appendChild(button);
}

function bindControls(controls) {
  if (!controls || !isTouchDevice() || controls.dataset.mobileControlsOwner === 'controller') return false;

  const cleanControls = controls.cloneNode(true);
  cleanControls.dataset.mobileControlsOwner = 'controller';
  controls.replaceWith(cleanControls);

  cleanControls.querySelector('[data-mobile-action="build2"]')?.remove();
  cleanControls.querySelector('[data-mobile-action="gadget2"]')?.remove();

  const joystick = cleanControls.querySelector('[data-mobile-joystick]');
  const thumb = joystick?.querySelector('.mobile-joystick-thumb');
  const buttons = [...cleanControls.querySelectorAll('[data-mobile-action]')];

  buttons.forEach(button => {
    const action = button.dataset.mobileAction;
    const key = ACTION_KEYS[action];
    if (!key) return;
    button.setAttribute('aria-label', ACTION_LABELS[action] || action.toUpperCase());
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      emitKey(key, 'keydown');
      button.classList.add('is-active');
      window.setTimeout(() => {
        emitKey(key, 'keyup');
        button.classList.remove('is-active');
      }, 110);
    }, { passive: false });
  });

  if (!joystick || !thumb) return true;

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
    const distance = Math.min(Math.hypot(dx, dy), Math.max(24, rect.width * .42));
    const angle = Math.atan2(dy, dx);
    thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
    setDirection(Math.abs(dx) < Math.max(8, rect.width * .12) ? null : dx < 0 ? 'left' : 'right');
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
  return true;
}

function install() {
  if (!isTouchDevice()) return;
  ensureSettingsButton();
  const existing = document.querySelector('.mobile-controls');
  if (existing?.dataset.mobileControlsOwner === 'controller') return;
  if (bindControls(existing)) {
    window.__relayMobileControlsController = {
      version: '2.2.0',
      root: document.querySelector('.mobile-controls'),
      rebind: () => bindControls(document.querySelector('.mobile-controls'))
    };
  }
}

const observe = () => {
  install();
  if (window.__relayMobileControlsObserver) return;
  window.__relayMobileControlsObserver = new MutationObserver(() => install());
  window.__relayMobileControlsObserver.observe(document.body, { childList: true, subtree: true });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observe, { once: true });
} else {
  observe();
}