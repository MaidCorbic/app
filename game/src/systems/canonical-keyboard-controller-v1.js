import Phaser from 'phaser';

/**
 * CANONICAL KEYBOARD CONTROLLER V1
 *
 * Single control contract for desktop + touch landscape:
 * W = forward
 * S = backward
 * A = left
 * D = right
 * F = flight toggle
 * E = interact
 * SPACE = jump / flight hover
 * Q = sword
 * SHIFT = dash
 * 1/2 = build slots
 * 3/4 = gadget slots
 *
 * RunnerScene is a 2D horizontal runner. W/S are therefore projected onto
 * the existing horizontal physics axis: W => forward/right, S => back/left.
 * A/D retain left/right semantics. W/S are masked from legacy jump/flight
 * readers during RunnerScene.update so those systems cannot steal the input.
 *
 * The same contract owns touch controls. The mobile HUD is explicitly
 * landscape-first and uses safe-area insets so rotation does not break input.
 */

const KEY = Object.freeze({
  W: [87, 'w', 'KeyW'],
  S: [83, 's', 'KeyS'],
  A: [65, 'a', 'KeyA'],
  D: [68, 'd', 'KeyD'],
  E: [69, 'e', 'KeyE'],
  F: [70, 'f', 'KeyF'],
  SPACE: [32, ' ', 'Space'],
  Q: [81, 'q', 'KeyQ'],
  SHIFT: [16, 'Shift', 'ShiftLeft'],
  ONE: [49, '1', 'Digit1'],
  TWO: [50, '2', 'Digit2'],
  THREE: [51, '3', 'Digit3'],
  FOUR: [52, '4', 'Digit4'],
});

const TOUCH_ACTIONS = Object.freeze({
  jump: KEY.SPACE,
  interact: KEY.E,
  flight: KEY.F,
  sword: KEY.Q,
  dash: KEY.SHIFT,
  build1: KEY.ONE,
  build2: KEY.TWO,
  gadget1: KEY.THREE,
  gadget2: KEY.FOUR,
});

const isTouchDevice = () => Boolean(
  navigator.maxTouchPoints > 0 ||
  'ontouchstart' in window ||
  window.matchMedia?.('(pointer: coarse)').matches ||
  window.matchMedia?.('(hover: none)').matches
);

const makeKeyboardEvent = ([keyCode, key, code], type) => {
  const event = new KeyboardEvent(type, {
    key,
    code,
    bubbles: true,
    cancelable: true,
  });

  for (const [name, value] of [
    ['keyCode', keyCode],
    ['which', keyCode],
    ['charCode', keyCode],
  ]) {
    try {
      Object.defineProperty(event, name, {
        configurable: true,
        get: () => value,
      });
    } catch {}
  }

  return event;
};

const emitKey = (binding, type) => {
  window.dispatchEvent(makeKeyboardEvent(binding, type));
};

const getRunnerScene = () => window.__relayRunnerScene || null;

const setKeyState = (scene, name, down) => {
  if (scene?.keys?.[name]) scene.keys[name].isDown = Boolean(down);
};

const setCursorState = (scene, name, down) => {
  if (scene?.cursors?.[name]) scene.cursors[name].isDown = Boolean(down);
};

function installTouchHud() {
  if (!isTouchDevice() || window.__relayCanonicalTouchHudV1) return;

  const root = document.querySelector('.mobile-controls');
  const actions = root?.querySelector('.mobile-actions');
  const joystick = root?.querySelector('[data-mobile-joystick]');
  const thumb = joystick?.querySelector('.mobile-joystick-thumb');
  if (!root || !actions || !joystick || !thumb) return;

  window.__relayCanonicalTouchHudV1 = true;

  // Stop the legacy mobile input owner before it installs its own listeners.
  window.__relayMobileInputSingleOwnerV9 = true;

  const styleId = 'relay-canonical-keyboard-controller-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @media (pointer: coarse) {
        html body.is-touch #play .mobile-controls {
          position: fixed !important;
          inset: auto max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left)) !important;
          width: auto !important;
          height: auto !important;
          display: flex !important;
          align-items: flex-end !important;
          justify-content: space-between !important;
          gap: clamp(10px, 3vw, 28px) !important;
          pointer-events: none !important;
          z-index: 5000 !important;
        }

        html body.is-touch #play .mobile-joystick {
          flex: 0 0 auto !important;
          width: clamp(68px, 17vh, 94px) !important;
          height: clamp(68px, 17vh, 94px) !important;
          pointer-events: auto !important;
          touch-action: none !important;
        }

        html body.is-touch #play .mobile-actions {
          flex: 0 0 auto !important;
          display: grid !important;
          grid-template-columns: repeat(5, clamp(34px, 7.2vh, 46px)) !important;
          grid-auto-rows: clamp(34px, 7.2vh, 46px) !important;
          gap: clamp(3px, .7vh, 5px) !important;
          width: max-content !important;
          height: max-content !important;
          pointer-events: auto !important;
        }

        html body.is-touch #play .mobile-actions > button {
          width: clamp(34px, 7.2vh, 46px) !important;
          height: clamp(34px, 7.2vh, 46px) !important;
          min-width: clamp(34px, 7.2vh, 46px) !important;
          min-height: clamp(34px, 7.2vh, 46px) !important;
          max-width: clamp(34px, 7.2vh, 46px) !important;
          max-height: clamp(34px, 7.2vh, 46px) !important;
          padding: 0 2px !important;
          border-radius: 50% !important;
          font-size: clamp(6px, 1.15vh, 9px) !important;
          letter-spacing: .03em !important;
          line-height: 1 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
        }

        html body.is-touch #play .mobile-actions > button small {
          font-size: clamp(4px, .78vh, 6px) !important;
          line-height: 1 !important;
        }

        html body.is-touch #play .mobile-actions > [data-mobile-action="jump"] { grid-column: 1; grid-row: 1; }
        html body.is-touch #play .mobile-actions > [data-mobile-action="interact"] { grid-column: 2; grid-row: 1; }
        html body.is-touch #play .mobile-actions > [data-mobile-action="sword"] { grid-column: 3; grid-row: 1; }
        html body.is-touch #play .mobile-actions > [data-mobile-action="dash"] { grid-column: 4; grid-row: 1; }
        html body.is-touch #play .mobile-actions > [data-mobile-action="flight"] { grid-column: 5; grid-row: 1; }
        html body.is-touch #play .mobile-actions > [data-mobile-action="build1"] { grid-column: 1; grid-row: 2; }
        html body.is-touch #play .mobile-actions > [data-mobile-action="build2"] { grid-column: 2; grid-row: 2; }
        html body.is-touch #play .mobile-actions > [data-mobile-action="gadget1"] { grid-column: 3; grid-row: 2; }
        html body.is-touch #play .mobile-actions > [data-mobile-action="gadget2"] { grid-column: 4; grid-row: 2; }
        html body.is-touch #play .mobile-actions > button[data-mobile-action="__empty"] { visibility: hidden; }

        html body.is-touch #play .mobile-actions > [data-mobile-action="flight"] {
          --button-border: rgba(141,244,255,.80) !important;
          --button-glow: rgba(56,189,248,.28) !important;
          color: #e9fdff !important;
        }

        html body.is-touch #play .mobile-actions > [data-mobile-action="interact"] {
          --button-border: rgba(174,227,127,.78) !important;
          --button-glow: rgba(174,227,127,.24) !important;
          color: #efffdc !important;
        }

        @media (orientation: portrait) {
          html body.is-touch #play .mobile-controls { display: none !important; }
        }

        @media (orientation: landscape) and (max-height: 520px) {
          html body.is-touch #play .mobile-controls {
            gap: 8px !important;
          }
        }
      }
    `;
    document.head.appendChild(style);
  }

  const desired = [
    ['jump', 'JUMP', 'SPACE'],
    ['interact', 'INTERACT', 'E'],
    ['sword', 'SWORD', 'Q'],
    ['dash', 'DASH', 'SHIFT'],
    ['flight', 'FLIGHT', 'F'],
    ['build1', 'BUILD 1', '1'],
    ['build2', 'BUILD 2', '2'],
    ['gadget1', 'GEAR 1', '3'],
    ['gadget2', 'GEAR 2', '4'],
  ];

  // Convert the old FIRE/E button into INTERACT/E.
  const oldFire = actions.querySelector('[data-mobile-action="fire"]');
  if (oldFire) oldFire.dataset.mobileAction = 'interact';

  const supported = new Set(desired.map(([action]) => action));
  const existing = new Map(
    Array.from(actions.querySelectorAll('[data-mobile-action]'))
      .map(node => [node.dataset.mobileAction, node])
  );

  for (const [action, label, hint] of desired) {
    let button = existing.get(action);
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.dataset.mobileAction = action;
      actions.appendChild(button);
    }
    button.innerHTML = `${label}<small>${hint}</small>`;
  }

  actions.querySelectorAll('[data-mobile-action]').forEach(node => {
    if (!supported.has(node.dataset.mobileAction)) node.remove();
  });

  // Legacy dynamically injected duplicates are not needed; our canonical grid owns them.
  document.getElementById('mobileDashButton')?.remove();
  document.getElementById('mobileCrouchButton')?.remove();

  const activePointers = new Map();
  const buttonPointers = new Map();

  const releaseAction = (button, pointerId) => {
    const action = button.dataset.mobileAction;
    const pointers = buttonPointers.get(action);
    if (!pointers?.has(pointerId)) return;

    pointers.delete(pointerId);
    activePointers.delete(pointerId);

    if (pointers.size === 0) {
      buttonPointers.delete(action);
      emitKey(TOUCH_ACTIONS[action], 'keyup');
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    }
  };

  actions.querySelectorAll('[data-mobile-action]').forEach(button => {
    button.setAttribute('aria-pressed', 'false');

    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();

      const action = button.dataset.mobileAction;
      const binding = TOUCH_ACTIONS[action];
      if (!binding || activePointers.has(event.pointerId)) return;

      let pointers = buttonPointers.get(action);
      if (!pointers) {
        pointers = new Set();
        buttonPointers.set(action, pointers);
      }

      const first = pointers.size === 0;
      pointers.add(event.pointerId);
      activePointers.set(event.pointerId, action);
      button.setPointerCapture?.(event.pointerId);

      if (first) emitKey(binding, 'keydown');
      button.classList.add('is-active');
      button.setAttribute('aria-pressed', 'true');
    }, { passive: false });

    button.addEventListener('pointerup', event => releaseAction(button, event.pointerId));
    button.addEventListener('pointercancel', event => releaseAction(button, event.pointerId));
    button.addEventListener('lostpointercapture', event => releaseAction(button, event.pointerId));
  });

  const releaseAll = () => {
    for (const [action, pointers] of buttonPointers) {
      if (pointers.size && TOUCH_ACTIONS[action]) emitKey(TOUCH_ACTIONS[action], 'keyup');
    }

    activePointers.clear();
    buttonPointers.clear();

    actions.querySelectorAll('[data-mobile-action]').forEach(button => {
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    });
  };

  window.addEventListener('blur', releaseAll);
  window.addEventListener('pagehide', releaseAll);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseAll();
  });

  let joystickPointerId = null;
  let last = { left: false, right: false, forward: false, backward: false };
  const maxDrag = 38;
  const deadzone = 9;

  const setJoystickKeys = (left, right, forward, backward) => {
    const current = getRunnerScene();
    if (!current) return;

    setKeyState(current, 'A', left);
    setKeyState(current, 'D', right);
    setKeyState(current, 'W', forward);
    setKeyState(current, 'S', backward);
    setCursorState(current, 'left', left);
    setCursorState(current, 'right', right);
    setCursorState(current, 'up', forward);
    setCursorState(current, 'down', backward);

    const next = { left, right, forward, backward };
    for (const direction of Object.keys(next)) {
      if (next[direction] !== last[direction]) {
        const binding = direction === 'left' ? KEY.A
          : direction === 'right' ? KEY.D
          : direction === 'forward' ? KEY.W
          : KEY.S;
        emitKey(binding, next[direction] ? 'keydown' : 'keyup');
      }
    }
    last = next;
  };

  const resetJoystick = () => {
    setJoystickKeys(false, false, false, false);
    joystickPointerId = null;
    thumb.style.transform = 'translate(0,0)';
    joystick.classList.remove('is-active');
  };

  const moveJoystick = (clientX, clientY) => {
    const rect = joystick.getBoundingClientRect();
    const dx = clientX - rect.left - rect.width / 2;
    const dy = clientY - rect.top - rect.height / 2;
    const distance = Math.min(Math.hypot(dx, dy), maxDrag);
    const angle = Math.atan2(dy, dx);

    thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;

    const horizontal = Math.abs(dx) < deadzone ? 0 : dx < 0 ? -1 : 1;
    const vertical = Math.abs(dy) < deadzone ? 0 : dy < 0 ? -1 : 1;

    setJoystickKeys(
      horizontal < 0,
      horizontal > 0,
      vertical < 0,
      vertical > 0,
    );
  };

  joystick.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    if (joystickPointerId !== null) return;
    joystickPointerId = event.pointerId;
    joystick.setPointerCapture?.(joystickPointerId);
    joystick.classList.add('is-active');
    moveJoystick(event.clientX, event.clientY);
  }, { passive: false });

  joystick.addEventListener('pointermove', event => {
    if (event.pointerId !== joystickPointerId) return;
    event.preventDefault();
    moveJoystick(event.clientX, event.clientY);
  }, { passive: false });

  const endJoystick = event => {
    if (event?.pointerId != null && event.pointerId !== joystickPointerId) return;
    resetJoystick();
  };

  joystick.addEventListener('pointerup', endJoystick);
  joystick.addEventListener('pointercancel', endJoystick);
  joystick.addEventListener('lostpointercapture', endJoystick);
  window.addEventListener('blur', resetJoystick);
  window.addEventListener('pagehide', resetJoystick);

  const guide = document.querySelector('.input-guide');
  if (guide) {
    guide.innerHTML = '<kbd>W</kbd><kbd>S</kbd> MOVE <i></i><kbd>A</kbd><kbd>D</kbd> LEFT / RIGHT <i></i><kbd>F</kbd> FLIGHT <i></i><kbd>E</kbd> INTERACT <i></i><kbd>SPACE</kbd> JUMP';
  }
}

export function installCanonicalKeyboardController(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__canonicalKeyboardControllerV1) return;
  RunnerScene.prototype.__canonicalKeyboardControllerV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalUseBlaster = RunnerScene.prototype.useBlaster;

  RunnerScene.prototype.create = function canonicalKeyboardCreate(...args) {
    const result = originalCreate.apply(this, args);

    this.__canonicalKeyboard = {
      eHeld: false,
      installed: true,
    };

    if (this.input?.keyboard) {
      this.keys ??= {};
      for (const name of ['W','S','A','D','E','F','SPACE','Q','SHIFT','ONE','TWO','THREE','FOUR']) {
        const code = Phaser.Input.Keyboard.KeyCodes[name];
        if (code != null) this.keys[name] ||= this.input.keyboard.addKey(code);
      }
    }

    window.__relayRunnerScene = this;
    return result;
  };

  if (typeof originalUseBlaster === 'function' && !RunnerScene.prototype.__canonicalUseBlasterWrapped) {
    RunnerScene.prototype.useBlaster = function canonicalUseBlaster(...args) {
      if (this.__canonicalKeyboard?.eHeld) return false;
      return originalUseBlaster.apply(this, args);
    };
    RunnerScene.prototype.__canonicalUseBlasterWrapped = true;
  }

  RunnerScene.prototype.update = function canonicalKeyboardUpdate(time, delta) {
    const keys = this.keys || {};
    const actual = {
      W: Boolean(keys.W?.isDown),
      S: Boolean(keys.S?.isDown),
      A: Boolean(keys.A?.isDown),
      D: Boolean(keys.D?.isDown),
      E: Boolean(keys.E?.isDown),
      left: Boolean(this.cursors?.left?.isDown),
      right: Boolean(this.cursors?.right?.isDown),
    };

    // In the existing 2D runner, forward/back are projected onto the run axis.
    const left = actual.A || actual.S;
    const right = actual.D || actual.W;

    const restore = {
      A: keys.A?.isDown,
      D: keys.D?.isDown,
      W: keys.W?.isDown,
      S: keys.S?.isDown,
      left: this.cursors?.left?.isDown,
      right: this.cursors?.right?.isDown,
      flightUp: this.__flightHVG?.keys?.up?.isDown,
      flightDown: this.__flightHVG?.keys?.down?.isDown,
    };

    // Keep legacy runner movement working while presenting the canonical WASD contract.
    if (keys.A) keys.A.isDown = left && !right;
    if (keys.D) keys.D.isDown = right && !left;
    if (this.cursors?.left) this.cursors.left.isDown = left && !right;
    if (this.cursors?.right) this.cursors.right.isDown = right && !left;

    // W/S must not also trigger legacy jump code or flight vertical steering.
    if (keys.W) keys.W.isDown = false;
    if (keys.S) keys.S.isDown = false;

    if (this.__flightHVG?.keys) {
      if (this.__flightHVG.keys.up) this.__flightHVG.keys.up.isDown = false;
      if (this.__flightHVG.keys.down) this.__flightHVG.keys.down.isDown = false;
    }

    if (this.__canonicalKeyboard) {
      this.__canonicalKeyboard.eHeld = actual.E;
    }

    try {
      return originalUpdate.call(this, time, delta);
    } finally {
      if (keys.A) keys.A.isDown = restore.A;
      if (keys.D) keys.D.isDown = restore.D;
      if (keys.W) keys.W.isDown = restore.W;
      if (keys.S) keys.S.isDown = restore.S;
      if (this.cursors?.left) this.cursors.left.isDown = restore.left;
      if (this.cursors?.right) this.cursors.right.isDown = restore.right;
      if (this.__flightHVG?.keys?.up) this.__flightHVG.keys.up.isDown = restore.flightUp;
      if (this.__flightHVG?.keys?.down) this.__flightHVG.keys.down.isDown = restore.flightDown;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installTouchHud, { once: true });
  } else {
    installTouchHud();
  }
}

export { KEY, TOUCH_ACTIONS };
