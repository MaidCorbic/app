// MOBILE INPUT SINGLE OWNER V11
// One canonical touch owner for movement + gameplay actions.
const ACTION_KEYS = Object.freeze({
  jump: [32, ' ', 'Space'], fire: [69, 'e', 'KeyE'], sword: [81, 'q', 'KeyQ'],
  dash: [16, 'Shift', 'ShiftLeft'], build1: [49, '1', 'Digit1'], gadget1: [51, '3', 'Digit3'],
});

const isTouchDevice = () => navigator.maxTouchPoints > 0 || 'ontouchstart' in window || window.matchMedia?.('(pointer: coarse)').matches || window.matchMedia?.('(hover: none)').matches;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const keyEvent = (code, key, type, keyCode) => {
  const event = new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true });
  for (const [name, value] of [['keyCode', keyCode], ['which', keyCode], ['charCode', keyCode]]) {
    try { Object.defineProperty(event, name, { configurable: true, get: () => value }); } catch {}
  }
  return event;
};

// Phaser normally listens on the window/document keyboard target. Dispatch to both
// targets so every existing gameplay key handler receives the same mobile action.
const emit = ([keyCode, key, code], type) => {
  const event = keyEvent(code, key, type, keyCode);
  window.dispatchEvent(event);
  document.dispatchEvent(event);
};

const replaceNode = node => { const clone = node.cloneNode(true); node.replaceWith(clone); return clone; };

const detachLegacyRunnerInput = scene => {
  const events = scene?.game?.events;
  if (!events) return;
  if (scene.mobileActionHandler) events.off('mobile-action', scene.mobileActionHandler);
  if (scene.mobileMoveHandler) events.off('mobile-move', scene.mobileMoveHandler);
  scene.mobileActionHandler = null;
  scene.mobileMoveHandler = null;
};

const installRunnerMovementBridge = scene => {
  if (!scene?.events || scene.__relayMobileMovementBridgeV11) return;
  scene.__relayMobileMovementBridgeV11 = true;
  scene.__relayMobileAxis = 0;

  const apply = () => {
    const axis = Number(scene.__relayMobileAxis) || 0;
    if (!axis || !scene.player?.body || scene.finished || scene.respawning) return;
    const body = scene.player.body;
    if (body.enable === false || body.moves === false) return;

    // Mobile gets a lively but controllable run speed. The acceleration blend is
    // intentionally quick so the character responds immediately to the thumb.
    const maxSpeed = Number(scene.__relayMobileRunSpeed) > 0
      ? Number(scene.__relayMobileRunSpeed)
      : 600;
    const target = axis * maxSpeed;
    const current = Number(body.velocity?.x) || 0;
    const next = current + (target - current) * 0.72;
    body.setVelocityX?.(clamp(next, -maxSpeed, maxSpeed));
  };

  scene.events.on('postupdate', apply);
  scene.events.once('shutdown', () => {
    scene.events.off('postupdate', apply);
    scene.__relayMobileMovementBridgeV11 = false;
    scene.__relayMobileAxis = 0;
  });
};

const attachSceneWhenReady = () => {
  const scene = window.__relayRunnerScene;
  if (!scene) return false;
  detachLegacyRunnerInput(scene);
  installRunnerMovementBridge(scene);
  return true;
};

window.addEventListener('relay:runner-scene-ready', event => {
  const scene = event?.detail?.scene || window.__relayRunnerScene;
  if (!scene) return;
  detachLegacyRunnerInput(scene);
  installRunnerMovementBridge(scene);
});

const normalizeActionButtons = root => {
  const seen = new Set();
  root.querySelectorAll('[data-mobile-action]').forEach(node => {
    const action = node.dataset.mobileAction;
    if (!ACTION_KEYS[action] || seen.has(action)) node.remove();
    else seen.add(action);
  });
};

const install = () => {
  const root = document.querySelector('.mobile-controls');
  if (!root) return;
  normalizeActionButtons(root);
  if (!isTouchDevice() || window.__relayMobileInputSingleOwnerV11) return;

  const actionButtons = [];
  root.querySelectorAll('[data-mobile-action]').forEach(node => actionButtons.push(replaceNode(node)));
  const joystickNode = root.querySelector('[data-mobile-joystick]');
  const joystick = joystickNode ? replaceNode(joystickNode) : null;
  const thumb = joystick?.querySelector('.mobile-joystick-thumb');
  if (!joystick || !thumb) return;

  window.__relayMobileInputSingleOwnerV11 = true;
  root.dataset.mobileControlsOwner = 'single-owner-v11';
  attachSceneWhenReady();

  let readyRaf = 0;
  const waitForScene = () => {
    if (attachSceneWhenReady()) return;
    readyRaf = requestAnimationFrame(waitForScene);
  };
  waitForScene();

  const actionPointers = new Map();
  const pointerActions = new Map();

  const releaseAction = (button, pointerId) => {
    const action = button.dataset.mobileAction;
    const pointers = actionPointers.get(action);
    if (!pointers?.has(pointerId)) return;
    pointers.delete(pointerId);
    pointerActions.delete(pointerId);
    if (pointers.size === 0) {
      actionPointers.delete(action);
      if (ACTION_KEYS[action]) emit(ACTION_KEYS[action], 'keyup');
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    }
  };

  actionButtons.forEach(button => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const action = button.dataset.mobileAction;
      if (!ACTION_KEYS[action] || pointerActions.has(event.pointerId)) return;
      let pointers = actionPointers.get(action);
      if (!pointers) { pointers = new Set(); actionPointers.set(action, pointers); }
      const wasEmpty = pointers.size === 0;
      pointers.add(event.pointerId);
      pointerActions.set(event.pointerId, action);
      button.setPointerCapture?.(event.pointerId);
      if (wasEmpty) emit(ACTION_KEYS[action], 'keydown');
      button.classList.add('is-active');
      button.setAttribute('aria-pressed', 'true');
    }, { passive: false });
    button.addEventListener('pointerup', event => releaseAction(button, event.pointerId));
    button.addEventListener('pointercancel', event => releaseAction(button, event.pointerId));
    button.addEventListener('lostpointercapture', event => releaseAction(button, event.pointerId));
  });

  const releaseAll = () => {
    for (const [action, pointers] of actionPointers) {
      if (pointers.size && ACTION_KEYS[action]) emit(ACTION_KEYS[action], 'keyup');
    }
    actionPointers.clear();
    pointerActions.clear();
    actionButtons.forEach(button => {
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    });
  };
  window.addEventListener('blur', releaseAll);
  window.addEventListener('pagehide', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

  // Larger thumb travel gives better fine control without requiring the player to
  // drag outside the visible joystick. Horizontal input is intentionally weighted.
  const maxDrag = 44;
  const deadzone = 7;
  let pointerId = null;
  let direction = null;

  const getScene = () => window.__relayRunnerScene?.input?.keyboard ? window.__relayRunnerScene : null;
  const setPhaserDirection = next => {
    const scene = getScene();
    if (!scene) return;
    const down = next === 'left';
    const right = next === 'right';
    const keys = scene.keys || {};
    const cursors = scene.cursors || {};
    if (keys.A) keys.A.isDown = down;
    if (keys.D) keys.D.isDown = right;
    if (cursors.left) cursors.left.isDown = down;
    if (cursors.right) cursors.right.isDown = right;
    scene.__relayMobileAxis = next === 'left' ? -1 : next === 'right' ? 1 : 0;
  };

  const setDirection = next => {
    if (next === direction) { setPhaserDirection(next); return; }
    if (direction === 'left') emit([65, 'a', 'KeyA'], 'keyup');
    if (direction === 'right') emit([68, 'd', 'KeyD'], 'keyup');
    direction = next;
    if (next === 'left') emit([65, 'a', 'KeyA'], 'keydown');
    if (next === 'right') emit([68, 'd', 'KeyD'], 'keydown');
    setPhaserDirection(next);
  };

  const reset = () => {
    setDirection(null);
    const scene = window.__relayRunnerScene;
    if (scene) {
      scene.__relayMobileAxis = 0;
      const body = scene.player?.body;
      if (body?.enable !== false && body?.moves !== false) body.setVelocityX?.(0);
    }
    pointerId = null;
    joystick.classList.remove('is-active');
    thumb.style.transform = 'translate(0,0)';
  };

  const move = (clientX, clientY) => {
    const rect = joystick.getBoundingClientRect();
    const dx = clientX - rect.left - rect.width / 2;
    const dy = clientY - rect.top - rect.height / 2;
    const distance = Math.min(Math.hypot(dx, dy), maxDrag);
    const angle = Math.atan2(dy, dx);
    thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px,${(Math.sin(angle) * distance).toFixed(1)}px)`;
    setDirection(Math.abs(dx) < deadzone ? null : dx < 0 ? 'left' : 'right');
  };

  joystick.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    if (pointerId !== null) return;
    pointerId = event.pointerId;
    joystick.setPointerCapture?.(pointerId);
    joystick.classList.add('is-active');
    move(event.clientX, event.clientY);
  }, { passive: false });
  joystick.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    move(event.clientX, event.clientY);
  }, { passive: false });
  const end = event => { if (event && event.pointerId !== pointerId) return; reset(); };
  joystick.addEventListener('pointerup', end);
  joystick.addEventListener('pointercancel', end);
  joystick.addEventListener('lostpointercapture', end);
  window.addEventListener('blur', reset);
  window.addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
