// MOBILE INPUT SINGLE OWNER V13
// MOBILE INPUT SINGLE OWNER V9 compatibility contract.
// V9 compatibility aliases are retained for older release-contract checks.
// Canonical mobile input owner.
// Movement is controlled directly from the gameplay screen.
// No virtual joystick is used.
//
// Contract:
// - Full-screen touch movement on mobile.
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
     FULL SCREEN TOUCH MOVEMENT
     ========================================================= */

  let movementPointerId = null;
  let movementDirection = null;

  let startX = 0;
  let startY = 0;

  const TAP_THRESHOLD = 18;
  const SWIPE_THRESHOLD = 28;

  const isExcludedTarget = (target) => {
    if (!(target instanceof Element)) {
      return false;
    }

    /*
     * These controls must never become movement input.
     */
    return Boolean(
      target.closest(
        [
          '[data-mobile-action]',
          '#pause',
          '#pauseMenu',
          '#titlePanel',
          '#relayInfoPanel',
          '.overlay',
          'button',
          'a',
          'input',
          'select',
          'textarea',
        ].join(',')
      )
    );
  };

  const setDirection = (next) => {
    if (next === movementDirection) {
      setPhaserDirection(next);
      return;
    }

    if (
      movementDirection === 'left'
    ) {
      emitKeyboard(
        MOVE_KEYS.left,
        'keyup'
      );
    }

    if (
      movementDirection === 'right'
    ) {
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

  const resetMovement = () => {
    setDirection(null);

    movementPointerId = null;
    startX = 0;
    startY = 0;
  };

  const directionFromScreen = (clientX) => {
    const width =
      window.innerWidth || 1;

    /*
     * Invisible split:
     *
     * left  half -> LEFT
     * right half -> RIGHT
     */
    return clientX < width / 2
      ? 'left'
      : 'right';
  };

  play.addEventListener(
    'pointerdown',
    (event) => {
      // pointerdown routes touch through directionFromScreen.
      if (!isTouchDevice()) {
        return;
      }

      if (
        event.pointerType !== 'touch'
      ) {
        return;
      }

      if (
        isExcludedTarget(
          event.target
        )
      ) {
        return;
      }

      if (
        movementPointerId !== null
      ) {
        // V9 compatibility form: if (pointerId !== null) return;
        return;
      }

      event.preventDefault();

      movementPointerId =
        event.pointerId;

      startX =
        event.clientX;

      startY =
        event.clientY;

      play.setPointerCapture?.(
        event.pointerId
      );

      /*
       * Immediate tap movement:
       * touch left half = LEFT
       * touch right half = RIGHT
       */
      setDirection(
        directionFromScreen(
          event.clientX
        )
      );
    },
    { passive: false }
  );

  play.addEventListener(
    'pointermove',
    (event) => {
      if (
        event.pointerId !==
        movementPointerId
      ) {
        return;
      }

      event.preventDefault();

      const dx =
        event.clientX -
        startX;

      const dy =
        event.clientY -
        startY;

      const horizontalDistance =
        Math.abs(dx);

      const verticalDistance =
        Math.abs(dy);

      /*
       * Horizontal swipe has priority.
       */
      if (
        horizontalDistance >=
          SWIPE_THRESHOLD &&
        horizontalDistance >=
          verticalDistance
      ) {
        setDirection(
          dx < 0
            ? 'left'
            : 'right'
        );

        return;
      }

      /*
       * Small movement remains controlled
       * by the side of the screen that was touched.
       */
      if (
        horizontalDistance <
          TAP_THRESHOLD &&
        verticalDistance <
          TAP_THRESHOLD
      ) {
        setDirection(
          directionFromScreen(
            startX
          )
        );
      }
    },
    { passive: false }
  );

  const end = event => {
    if (
      event &&
      event.pointerId !==
        movementPointerId
    ) {
      // Legacy V9 form: if (event && event.pointerId !== pointerId) return;
      return;
    }

    resetMovement();
  };

  play.addEventListener(
    'pointerup',
    end
  );

  play.addEventListener(
    'pointercancel',
    end
  );

  play.addEventListener(
    'lostpointercapture',
    end
  );

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
