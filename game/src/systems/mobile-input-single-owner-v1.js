// MOBILE INPUT SINGLE OWNER V12
// One canonical touch owner for movement + gameplay actions.

const ACTION_KEYS = Object.freeze({
  jump: [32, ' ', 'Space'],
  fire: [69, 'e', 'KeyE'],
  sword: [81, 'q', 'KeyQ'],
  dash: [16, 'Shift', 'ShiftLeft'],
  build1: [49, '1', 'Digit1'],
  gadget1: [51, '3', 'Digit3'],
});

const isTouchDevice = () =>
  Number(navigator.maxTouchPoints || 0) > 0 ||
  'ontouchstart' in window ||
  window.matchMedia?.('(pointer: coarse)').matches === true ||
  window.matchMedia?.('(hover: none)').matches === true;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

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
      // Older browsers may reject redefining legacy KeyboardEvent fields.
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
    events.off(
      'mobile-action',
      scene.mobileActionHandler
    );
  }

  if (scene.mobileMoveHandler) {
    events.off(
      'mobile-move',
      scene.mobileMoveHandler
    );
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

window.addEventListener(
  'relay:runner-scene-ready',
  (event) => {
    const scene =
      event?.detail?.scene ||
      window.__relayRunnerScene;

    if (!scene) return;

    detachLegacyRunnerInput(scene);
  }
);


/* =========================================================
   INSTALL
   ========================================================= */

const install = () => {
  const root =
    document.querySelector(
      '.mobile-controls'
    );

  if (!root) return;

  normalizeActionButtons(root);

  if (!isTouchDevice()) {
    return;
  }

  if (
    window.__relayMobileInputSingleOwnerV12
  ) {
    return;
  }

  const actionButtons = [];

  root
    .querySelectorAll('[data-mobile-action]')
    .forEach((node) => {
      actionButtons.push(
        replaceNode(node)
      );
    });

  const joystickNode =
    root.querySelector(
      '[data-mobile-joystick]'
    );

  const joystick =
    joystickNode
      ? replaceNode(joystickNode)
      : null;

  const thumb =
    joystick?.querySelector(
      '.mobile-joystick-thumb'
    );

  if (!joystick || !thumb) {
    return;
  }

  window.__relayMobileInputSingleOwnerV12 =
    true;

  root.dataset.mobileControlsOwner =
    'single-owner-v12';

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

    /*
     * Only release the keyboard action when
     * no remaining pointer still holds it.
     */
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
     JOYSTICK
     ========================================================= */

  const maxDrag = 44;
  const deadzone = 7;

  let joystickPointerId = null;
  let direction = null;


  const getScene = () => {
    const scene =
      window.__relayRunnerScene;

    if (
      !scene ||
      !scene.input?.keyboard
    ) {
      return null;
    }

    return scene;
  };


  const setPhaserDirection = (
    next
  ) => {
    const scene =
      getScene();

    if (!scene) {
      return;
    }

    const left =
      next === 'left';

    const right =
      next === 'right';

    const keys =
      scene.keys || {};

    const cursors =
      scene.cursors || {};

    /*
     * Preserve compatibility with existing
     * Phaser keyboard state.
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


  const setDirection = (
    next
  ) => {
    if (next === direction) {
      setPhaserDirection(next);
      return;
    }

    /*
     * Release the previous synthetic key.
     */
    if (direction === 'left') {
      emitKeyboard(
        [65, 'a', 'KeyA'],
        'keyup'
      );
    }

    if (direction === 'right') {
      emitKeyboard(
        [68, 'd', 'KeyD'],
        'keyup'
      );
    }


    direction = next;


    /*
     * Press the new synthetic key.
     */
    if (next === 'left') {
      emitKeyboard(
        [65, 'a', 'KeyA'],
        'keydown'
      );
    }

    if (next === 'right') {
      emitKeyboard(
        [68, 'd', 'KeyD'],
        'keydown'
      );
    }


    setPhaserDirection(
      next
    );
  };


  const resetJoystick = () => {
    setDirection(null);

    const scene =
      window.__relayRunnerScene;

    if (scene) {
      setPhaserDirection(null);
    }

    joystickPointerId =
      null;

    joystick.classList.remove(
      'is-active'
    );

    thumb.style.transform =
      'translate(0, 0)';
  };


  const moveJoystick = (
    clientX,
    clientY
  ) => {
    const rect =
      joystick.getBoundingClientRect();

    const centerX =
      rect.left +
      rect.width / 2;

    const centerY =
      rect.top +
      rect.height / 2;

    const dx =
      clientX - centerX;

    const dy =
      clientY - centerY;

    const rawDistance =
      Math.hypot(
        dx,
        dy
      );

    const distance =
      Math.min(
        rawDistance,
        maxDrag
      );

    const angle =
      Math.atan2(
        dy,
        dx
      );

    const thumbX =
      clamp(
        Math.cos(angle) *
          distance,
        -maxDrag,
        maxDrag
      );

    const thumbY =
      clamp(
        Math.sin(angle) *
          distance,
        -maxDrag,
        maxDrag
      );

    thumb.style.transform =
      `translate(${thumbX.toFixed(1)}px, ${thumbY.toFixed(1)}px)`;


    /*
     * Horizontal movement remains dominant
     * because this is a side-scrolling runner.
     */
    if (
      Math.abs(dx) <
      deadzone
    ) {
      setDirection(null);
      return;
    }

    setDirection(
      dx < 0
        ? 'left'
        : 'right'
    );
  };


  joystick.addEventListener(
    'pointerdown',
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (
        joystickPointerId !== null
      ) {
        return;
      }

      joystickPointerId =
        event.pointerId;

      joystick.setPointerCapture?.(
        event.pointerId
      );

      joystick.classList.add(
        'is-active'
      );

      moveJoystick(
        event.clientX,
        event.clientY
      );
    },
    { passive: false }
  );


  joystick.addEventListener(
    'pointermove',
    (event) => {
      if (
        event.pointerId !==
        joystickPointerId
      ) {
        return;
      }

      event.preventDefault();

      moveJoystick(
        event.clientX,
        event.clientY
      );
    },
    { passive: false }
  );


  const endJoystick =
    (event) => {
      if (
        event &&
        event.pointerId !==
          joystickPointerId
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


  /* =========================================================
     GLOBAL SAFETY RELEASES
     ========================================================= */

  const releaseEverything = () => {
    releaseAllActions();
    resetJoystick();
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
