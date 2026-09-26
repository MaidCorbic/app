/* Gameplay Keyboard HUD V5
 * Mechanical keyboard visual monitor.
 * Presentation only — never owns gameplay input.
 */
(() => {
  'use strict';

  const HUD_ID = 'relay-gameplay-keyboard-hud';

  const KEY_DEFINITIONS = Object.freeze([
    ['ESC', 'SYSTEM', 'Escape'],
    ['Q', 'ABILITY', 'KeyQ'],
    ['W', 'JUMP', 'KeyW'],
    ['E', 'ACTION', 'KeyE'],
    ['R', 'RELOAD', 'KeyR'],
    ['A', 'LEFT', 'KeyA'],
    ['S', 'BACK', 'KeyS'],
    ['D', 'RIGHT', 'KeyD'],
    ['F', 'FLIGHT', 'KeyF'],
    ['SHIFT', 'SPRINT', 'ShiftLeft'],
    ['CTRL', 'CROUCH', 'ControlLeft'],
    ['SPACE', 'JUMP', 'Space'],
  ]);

  const trackedCodes = new Set(KEY_DEFINITIONS.map(([, , code]) => code));

  let hud = null;
  let scene = null;
  let shutdownHandler = null;

  const keyNodes = new Map();

  /* =========================================================
     GAMEPLAY STATE
     ========================================================= */

  const isGameplaySceneActive = () => {
    const current = window.__relayRunnerScene;

    if (!current) return false;

    if (typeof current.scene?.isActive !== 'function') {
      return false;
    }

    return Boolean(current.scene.isActive('runner'));
  };

  /* =========================================================
     TYPING TARGET
     ========================================================= */

  const isTypingTarget = (target) => {
    if (!target) return false;

    const tag = target.tagName;

    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  };

  /* =========================================================
     CREATE KEY
     ========================================================= */

  const createKey = (key, label, code) => {
    const item = document.createElement('div');

    item.className = 'relay-mech-key';

    item.dataset.key = key;
    item.dataset.code = code;

    const cap = document.createElement('div');

    cap.className = 'relay-mech-keycap';

    cap.textContent = key;

    cap.setAttribute('aria-hidden', 'true');

    const labelNode = document.createElement('span');

    labelNode.className = 'relay-mech-key-label';

    labelNode.textContent = label;

    item.append(cap, labelNode);

    keyNodes.set(code, item);

    return item;
  };

  /* =========================================================
     BUILD MINI MECHANICAL KEYBOARD
     ========================================================= */

  const buildHud = () => {
    const existing = document.getElementById(HUD_ID);

    if (existing) {
      return existing;
    }

    const root = document.createElement('div');

    root.id = HUD_ID;

    root.hidden = true;

    root.setAttribute('aria-label', 'Mechanical keyboard controls');

    /* =======================================================
       KEYBOARD OUTER BODY
       ======================================================= */

    const keyboard = document.createElement('div');

    keyboard.className = 'relay-mech-keyboard';

    /* =======================================================
       TOP STATUS BAR
       ======================================================= */

    const top = document.createElement('div');

    top.className = 'relay-mech-topbar';

    top.innerHTML = `
      <span class="relay-mech-brand">
        RELAY
      </span>

      <span class="relay-mech-status">
        INPUT // ONLINE
      </span>

      <span class="relay-mech-led"></span>
    `;

    keyboard.appendChild(top);

    /* =======================================================
       FUNCTION / NUMBER STYLE ROW
       ======================================================= */

    const functionRow = document.createElement('div');

    functionRow.className = 'relay-mech-row relay-mech-function-row';

    functionRow.append(
      createKey('ESC', 'SYSTEM', 'Escape'),
      createKey('Q', 'ABILITY', 'KeyQ'),
      createKey('W', 'JUMP', 'KeyW'),
      createKey('E', 'ACTION', 'KeyE'),
      createKey('R', 'RELOAD', 'KeyR'),
    );

    keyboard.appendChild(functionRow);

    /* =======================================================
       MOVEMENT ROW
       ======================================================= */

    const movementRow = document.createElement('div');

    movementRow.className = 'relay-mech-row relay-mech-movement-row';

    movementRow.append(
      createKey('A', 'LEFT', 'KeyA'),
      createKey('S', 'BACK', 'KeyS'),
      createKey('D', 'RIGHT', 'KeyD'),
      createKey('F', 'FLIGHT', 'KeyF'),
    );

    keyboard.appendChild(movementRow);

    /* =======================================================
       BOTTOM CONTROL ROW
       ======================================================= */

    const bottomRow = document.createElement('div');

    bottomRow.className = 'relay-mech-row relay-mech-bottom-row';

    bottomRow.append(
      createKey('CTRL', 'CROUCH', 'ControlLeft'),
      createKey('SHIFT', 'SPRINT', 'ShiftLeft'),
      createKey('SPACE', 'JUMP', 'Space'),
    );

    keyboard.appendChild(bottomRow);

    /* =======================================================
       UNDERGLOW
       ======================================================= */

    const underglow = document.createElement('div');

    underglow.className = 'relay-mech-underglow';

    keyboard.appendChild(underglow);

    root.appendChild(keyboard);

    document.body.appendChild(root);

    return root;
  };

  /* =========================================================
     ACTIVE KEY
     ========================================================= */

  const setActive = (code, active) => {
    const node = keyNodes.get(code);

    if (!node) return;

    node.classList.toggle('is-active', active);
  };

  /* =========================================================
     CLEAR
     ========================================================= */

  const clearActive = () => {
    keyNodes.forEach((node) => {
      node.classList.remove('is-active');
    });
  };

  /* =========================================================
     SHOW / HIDE
     ========================================================= */

  const show = () => {
    if (!hud) {
      hud = buildHud();
    }

    hud.hidden = !isGameplaySceneActive();
  };

  const hide = () => {
    if (!hud) return;

    hud.hidden = true;

    clearActive();
  };

  /* =========================================================
     KEYBOARD MONITOR
     ========================================================= */

  const installKeyboardMonitor = () => {
    if (window.__relayGameplayKeyboardHudMonitorV5) {
      return;
    }

    window.__relayGameplayKeyboardHudMonitorV5 = true;

    const onKeyDown = (event) => {
      if (!trackedCodes.has(event.code)) {
        return;
      }

      if (!isGameplaySceneActive() || isTypingTarget(event.target)) {
        return;
      }

      show();

      setActive(event.code, true);
    };

    const onKeyUp = (event) => {
      if (!trackedCodes.has(event.code)) {
        return;
      }

      setActive(event.code, false);
    };

    const onBlur = () => {
      clearActive();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        clearActive();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    document.addEventListener('keyup', onKeyUp, true);

    window.addEventListener('blur', onBlur);

    document.addEventListener('visibilitychange', onVisibilityChange);

    window.__relayGameplayKeyboardHudCleanupV5 = () => {
      document.removeEventListener('keydown', onKeyDown, true);

      document.removeEventListener('keyup', onKeyUp, true);

      window.removeEventListener('blur', onBlur);

      document.removeEventListener('visibilitychange', onVisibilityChange);

      window.__relayGameplayKeyboardHudMonitorV5 = false;
    };
  };

  /* =========================================================
     SCENE LIFECYCLE
     ========================================================= */

  const wireSceneLifecycle = () => {
    const current = window.__relayRunnerScene;

    if (!current || scene === current) {
      return;
    }

    scene = current;

    if (shutdownHandler && typeof shutdownHandler.off === 'function') {
      shutdownHandler.off('shutdown');
    }

    if (current.events?.once) {
      current.events.once('shutdown', hide);

      shutdownHandler = current.events;
    }
  };

  /* =========================================================
     INSTALL
     ========================================================= */

  const install = () => {
    hud = buildHud();

    installKeyboardMonitor();

    wireSceneLifecycle();

    const tick = () => {
      wireSceneLifecycle();

      if (isGameplaySceneActive()) {
        show();
      } else {
        hide();
      }
    };

    window.setInterval(tick, 250);

    tick();
  };

  /* =========================================================
     START
     ========================================================= */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
