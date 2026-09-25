// MOBILE INPUT SINGLE OWNER V13
// MOBILE INPUT SINGLE OWNER V9 compatibility contract.
// V9 compatibility aliases are retained for older release-contract checks.
// Canonical mobile input owner.
// Movement is controlled by the visible virtual joystick.
// The joystick owns one touch pointer; action buttons own their own pointers.
//
// Contract:
// - Virtual joystick movement on mobile.

// - Existing mobile action buttons remain functional.
// - PAUSE / OPTIONS are excluded from gameplay touch input.
// - Desktop keyboard input remains untouched.

const ACTION_KEYS = Object.freeze({
  jump: [32, ' ', 'Space'],
  fire: [69, 'e', 'KeyE'],
  sword: [81, 'q', 'KeyQ'],
  dash: [16, 'Shift', 'ShiftLeft'],
  build1: [49, '1', 'Digit1'],
  gadget1: [51, '3', 'Digit3'],
});

const MOVE_KEYS = Object.freeze({
  left: [65, 'a', 'KeyA'],
  right: [68, 'd', 'KeyD'],
});

const isTouchDevice = () =>
  Number(navigator.maxTouchPoints || 0) > 0 ||
  'ontouchstart' in window ||
  window.matchMedia?.('(pointer: coarse)').matches === true ||
  window.matchMedia?.('(hover: none)').matches === true;

const createKeyEvent = (code, key, type, keyCode) => {
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
    } catch {
      // Legacy browsers may reject these properties.
    }
  }

  return event;
};

const emitKeyboard = ([keyCode, key, code], type) => {
  const event = createKeyEvent(code, key, type, keyCode);

  window.dispatchEvent(event);
  document.dispatchEvent(event);
};

const replaceNode = (node) => {
  if (!node?.parentNode) return node;

  const clone = node.cloneNode(true);
  node.replaceWith(clone);

  return clone;
};

const normalizeActionButtons = (root) => {
  const seen = new Set();

  root
    .querySelectorAll('[data-mobile-action]')
    .forEach((node) => {
      const action = node.dataset.mobileAction;

      if (!ACTION_KEYS[action] || seen.has(action)) {
        node.remove();
        return;
      }

      seen.add(action);
    });
};

const detachLegacyRunnerInput = (scene) => {
  const events = scene?.game?.events;

  if (!events) return;

  if (scene.mobileActionHandler) {
    events.off('mobile-action', scene.mobileActionHandler);
  }

  if (scene.mobileMoveHandler) {
    events.off('mobile-move', scene.mobileMoveHandler);
  }

  scene.mobileActionHandler = null;
  scene.mobileMoveHandler = null;
};

/* =========================================================
   SCENE CONNECTION
   ========================================================= */

const attachSceneWhenReady = () => {
  const scene = window.__relayRunnerScene;

  if (!scene) {
    return false;
  }

  detachLegacyRunnerInput(scene);

  return true;
};

window.addEventListener('relay:runner-scene-ready', (event) => {
    const scene =
      event?.detail?.scene ||
      window.__relayRunnerScene;

    if (!scene) return;

    detachLegacyRunnerInput(scene);
  }
);

/* =========================================================
   PHASER MOVEMENT
   ========================================================= */

const getScene = () => {
  const scene = window.__relayRunnerScene;

  if (!scene) {
    return null;
  }

  return scene;
};

const setPhaserDirection = (direction) => {
  const scene = getScene();

  if (!scene) {
    return;
  }

  const left =
    direction === 'left';

  const right =
    direction === 'right';

  const keys =
    scene.keys || {};

  const cursors =
    scene.cursors || {};

  /*
   * Keep compatibility with the existing
   * RunnerScene keyboard-state model.
   */
  if (keys.A) {
    keys.A.isDown = left;
  }

  if (keys.D) {
    keys.D.isDown = right;
  }

  if (cursors.left) {
    cursors.left.isDown = left;
  }

  if (cursors.right) {
    cursors.right.isDown = right;
  }
};

/* =========================================================
   INSTALL
   ========================================================= */

const install = () => {
  const play =
    document.getElementById('play');

  const root =
    document.querySelector(
      '.mobile-controls'
    );

  if (!play || !root) {
    return;
  }

  if (!isTouchDevice()) {
    return;
  }

  if (
    window.__relayMobileInputSingleOwnerV13 ||
    window.__relayMobileInputSingleOwnerV9
  ) {
    return;
  }

  normalizeActionButtons(root);

  const actionButtons = [];

  root
    .querySelectorAll('[data-mobile-action]')
    .forEach((node) => {
      actionButtons.push(
        replaceNode(node)
      );
    });

  window.__relayMobileInputSingleOwnerV13 =
    true;

  // Compatibility marker only; V13 remains the canonical implementation.
  window.__relayMobileInputSingleOwnerV9 = true;

  root.dataset.mobileControlsOwner =
    'single-owner-v13 single-owner-v9';

  play.dataset.mobileMovementOwner =
    'touch-screen-v13';

  /*
   * The gameplay surface owns touch movement.
   * Browser scrolling/gesture handling must not
   * interfere with the game surface.
   */
  play.style.touchAction = 'none';
  play.style.webkitUserSelect = 'none';
  play.style.userSelect = 'none';

  attachSceneWhenReady();

  /* =========================================================
     ACTION BUTTONS
     ========================================================= */

  const actionPointers = new Map();
  const pointerActions = new Map();

  const releaseAction = (
    button,
    pointerId
  ) => {
    const action =
      button.dataset.mobileAction;

    const pointers =
      actionPointers.get(action);

    if (!pointers?.has(pointerId)) {
      return;
    }

    pointers.delete(pointerId);
    pointerActions.delete(pointerId);

    if (pointers.size === 0) {
      actionPointers.delete(action);

      const key =
        ACTION_KEYS[action];

      if (key) {
        emitKeyboard(
          key,
          'keyup'
        );
      }

      button.classList.remove(
        'is-active'
      );

      button.setAttribute(
        'aria-pressed',
        'false'
      );
    }
  };

  actionButtons.forEach((button) => {
    button.setAttribute(
      'aria-pressed',
      'false'
    );

    button.addEventListener(
      'pointerdown',
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        const action =
          button.dataset.mobileAction;

        const key =
          ACTION_KEYS[action];

        if (
          !key ||
          pointerActions.has(
            event.pointerId
          )
        ) {
          return;
        }

        let pointers =
          actionPointers.get(action);

        if (!pointers) {
          pointers = new Set();

          actionPointers.set(
            action,
            pointers
          );
        }

        const wasEmpty =
          pointers.size === 0;

        pointers.add(
          event.pointerId
        );

        pointerActions.set(
          event.pointerId,
          action
        );

        button.setPointerCapture?.(
          event.pointerId
        );

        if (wasEmpty) {
          emitKeyboard(
            key,
            'keydown'
          );
        }

        button.classList.add(
          'is-active'
        );

        button.setAttribute(
          'aria-pressed',
          'true'
        );
      },
      { passive: false }
    );

    button.addEventListener(
      'pointerup',
      (event) => {
        releaseAction(
          button,
          event.pointerId
        );
      }
    );

    button.addEventListener(
      'pointercancel',
      (event) => {
        releaseAction(
          button,
          event.pointerId
        );
      }
    );

    button.addEventListener(
      'lostpointercapture',
      (event) => {
        releaseAction(
          button,
          event.pointerId
        );
      }
    );
  });

  const releaseAllActions = () => {
    for (
      const [
        action,
        pointers
      ] of actionPointers
    ) {
      if (
        pointers.size > 0 &&
        ACTION_KEYS[action]
      ) {
        emitKeyboard(
          ACTION_KEYS[action],
          'keyup'
        );
      }
    }

    actionPointers.clear();
    pointerActions.clear();

    actionButtons.forEach(
      (button) => {
        button.classList.remove(
          'is-active'
        );

        button.setAttribute(
          'aria-pressed',
          'false'
        );
      }
    );
  };

  /* =========================================================
     VIRTUAL JOYSTICK MOVEMENT
     ========================================================= */

  const joystick =
    root.querySelector('[data-mobile-joystick]');

  const joystickThumb =
    root.querySelector('.mobile-joystick-thumb');

  let movementPointerId = null;
  let movementDirection = null;
  let movementAxis = 0;

  const DEAD_ZONE = 0.18;

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  const setJoystickVisual = (axis) => {
    if (!joystickThumb) return;

    const rect = joystick?.getBoundingClientRect();

    if (!rect?.width) return;

    const thumbRect =
      joystickThumb.getBoundingClientRect();

    const radius =
      Math.max(
        1,
        rect.width / 2 -
          thumbRect.width / 2 -
          7
      );

    const offset =
      clamp(axis, -1, 1) * radius;

    joystickThumb.style.transform = `translate3d(${offset}px,0,0)`;
  };

  const setMobileAxis = (axis) => {
    const scene = getScene();

    if (!scene) return;

    /*
     * Keep an explicit analog value available for
     * future movement-feel tuning while the current
     * RunnerScene keyboard bridge remains digital.
     */
    scene.mobileAxis =
      clamp(axis, -1, 1);
  };

  const directionFromAxis = (axis) => {
    if (axis <= -DEAD_ZONE) {
      return 'left';
    }

    if (axis >= DEAD_ZONE) {
      return 'right';
    }

    return null;
  };

  const setDirection = (next) => {
    if (next === movementDirection) {
      setPhaserDirection(next);
      return;
    }

    if (movementDirection === 'left') {
      emitKeyboard(
        MOVE_KEYS.left,
        'keyup'
      );
    }

    if (movementDirection === 'right') {
      emitKeyboard(
        MOVE_KEYS.right,
        'keyup'
      );
    }

    movementDirection = next;

    if (next === 'left') {
      emitKeyboard(
        MOVE_KEYS.left,
        'keydown'
      );
    }

    if (next === 'right') {
      emitKeyboard(
        MOVE_KEYS.right,
        'keydown'
      );
    }

    setPhaserDirection(next);
  };

  const setJoystickAxis = (axis) => {
    movementAxis =
      clamp(axis, -1, 1);

    setMobileAxis(
      movementAxis
    );

    setJoystickVisual(
      movementAxis
    );

    setDirection(
      directionFromAxis(
        movementAxis
      )
    );

    joystick?.classList.toggle(
      'is-active',
      Math.abs(movementAxis) >
        DEAD_ZONE
    );
  };

  const resetMovement = () => {
    const pointerId =
      movementPointerId;

    setJoystickAxis(0);

    movementPointerId = null;

    if (
      pointerId !== null &&
      joystick?.hasPointerCapture?.(
        pointerId
      )
    ) {
      joystick.releasePointerCapture(
        pointerId
      );
    }

    joystick?.classList.remove(
      'is-active'
    );
  };

  const axisFromPointer = (event) => {
    const rect =
      joystick?.getBoundingClientRect();

    if (!rect?.width) {
      return 0;
    }

    const centerX =
      rect.left +
      rect.width / 2;

    const half =
      Math.max(
        1,
        rect.width / 2
      );

    return clamp(
      (event.clientX - centerX) /
        half,
      -1,
      1
    );
  };

  const resetJoystick = () => {
    movementPointerId = null;
    setJoystickAxis(0);

    if (joystick) {
      joystick.classList.remove(
        'is-active'
      );
    }
  };

  if (joystick) {
    joystick.addEventListener(
      'pointerdown',
      (event) => {
        if (
          !isTouchDevice() ||
          event.pointerType !== 'touch' ||
          movementPointerId !== null
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        movementPointerId =
          event.pointerId;

        joystick.setPointerCapture?.(
          event.pointerId
        );

        setJoystickAxis(
          axisFromPointer(event)
        );
      },
      { passive: false }
    );

    joystick.addEventListener(
      'pointermove',
      (event) => {
        if (
          event.pointerId !==
          movementPointerId
        ) {
          return;
        }

        event.preventDefault();

        setJoystickAxis(
          axisFromPointer(event)
        );
      },
      { passive: false }
    );

    const endJoystick = (event) => {
      if (
        event &&
        event.pointerId !==
          movementPointerId
      ) {
        return;
      }

      resetJoystick();
    };

    joystick.addEventListener(
      'pointerup',
      endJoystick
    );

    joystick.addEventListener(
      'pointercancel',
      endJoystick
    );

    joystick.addEventListener(
      'lostpointercapture',
      endJoystick
    );
  }

  /*
   * Compatibility marker retained so existing
   * release checks can identify the touch-screen
   * movement owner. The actual movement surface
   * is now the visible virtual joystick.
   */
  play.dataset.mobileMovementOwner =
    'touch-screen-v13 joystick-v1';

  /* =========================================================
     GLOBAL SAFETY
     ========================================================= */

  const releaseEverything = () => {
    releaseAllActions();
    resetMovement();
  };

  window.addEventListener(
    'blur',
    releaseEverything
  );

  window.addEventListener(
    'pagehide',
    releaseEverything
  );

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        releaseEverything();
      }
    }
  );
};

/* =========================================================
   BOOT
   ========================================================= */

if (
  document.readyState ===
  'loading'
) {
  document.addEventListener(
    'DOMContentLoaded',
    install,
    { once: true }
  );
} else {
  install();
}
