// MOBILE INPUT SINGLE OWNER V8
// Replace legacy-bound DOM nodes before attaching the single mobile input owner.
const ACTION_KEYS = Object.freeze({
  jump: [32, ' ', 'Space'], fire: [69, 'e', 'KeyE'], sword: [81, 'q', 'KeyQ'],
  dash: [16, 'Shift', 'ShiftLeft'], build1: [49, '1', 'Digit1'], gadget1: [51, '3', 'Digit3'],
});

const isTouchDevice = () => navigator.maxTouchPoints > 0 || 'ontouchstart' in window || window.matchMedia?.('(pointer: coarse)').matches || window.matchMedia?.('(hover: none)').matches;

const keyEvent = (code, key, type, keyCode) => {
  const event = new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true });
  for (const [name, value] of [['keyCode', keyCode], ['which', keyCode], ['charCode', keyCode]]) {
    try { Object.defineProperty(event, name, { configurable: true, get: () => value }); } catch {}
  }
  return event;
};
const emit = ([keyCode, key, code], type) => window.dispatchEvent(keyEvent(code, key, type, keyCode));
const replaceNode = node => { const clone = node.cloneNode(true); node.replaceWith(clone); return clone; };

const install = () => {
  if (!isTouchDevice() || window.__relayMobileInputSingleOwnerV8) return;
  const root = document.querySelector('.mobile-controls');
  if (!root) return;

  const seen = new Set();
  const actionButtons = [];
  root.querySelectorAll('[data-mobile-action]').forEach(node => {
    const action = node.dataset.mobileAction;
    if (!ACTION_KEYS[action] || seen.has(action)) { node.remove(); return; }
    seen.add(action); actionButtons.push(replaceNode(node));
  });

  const joystickNode = root.querySelector('[data-mobile-joystick]');
  const joystick = joystickNode ? replaceNode(joystickNode) : null;
  const thumb = joystick?.querySelector('.mobile-joystick-thumb');
  if (!joystick || !thumb) return;

  window.__relayMobileInputSingleOwnerV8 = true;
  root.dataset.mobileControlsOwner = 'single-owner-v8';

  // One logical key state per action, regardless of how many fingers/pointers
  // temporarily touch the same button. This prevents pointer A releasing a
  // key that pointer B is still holding.
  const actionPointers = new Map();
  const pointerActions = new Map();
  const release = (button, pointerId) => {
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
      event.preventDefault(); event.stopPropagation();
      const action = button.dataset.mobileAction;
      if (!ACTION_KEYS[action] || pointerActions.has(event.pointerId)) return;
      let pointers = actionPointers.get(action);
      if (!pointers) { pointers = new Set(); actionPointers.set(action, pointers); }
      const wasEmpty = pointers.size === 0;
      pointers.add(event.pointerId);
      pointerActions.set(event.pointerId, action);
      button.setPointerCapture?.(event.pointerId);
      if (wasEmpty) emit(ACTION_KEYS[action], 'keydown');
      button.classList.add('is-active'); button.setAttribute('aria-pressed', 'true');
    }, { passive: false });
    button.addEventListener('pointerup', event => release(button, event.pointerId));
    button.addEventListener('pointercancel', event => release(button, event.pointerId));
    button.addEventListener('lostpointercapture', event => release(button, event.pointerId));
  });

  const releaseAll = () => {
    for (const [action, pointers] of actionPointers) {
      if (pointers.size && ACTION_KEYS[action]) emit(ACTION_KEYS[action], 'keyup');
    }
    actionPointers.clear(); pointerActions.clear();
    actionButtons.forEach(button => { button.classList.remove('is-active'); button.setAttribute('aria-pressed', 'false'); });
  };
  window.addEventListener('blur', releaseAll); window.addEventListener('pagehide', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

  const maxDrag = 38;
  const deadzone = 9;
  let pointerId = null;
  let direction = null;

  // Keep the existing keyboard path as a fallback, but also drive Phaser's
  // actual Key objects. Synthetic DOM KeyboardEvents do not reliably update
  // Phaser's internal isDown state on mobile/WebView browsers.
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
    setDirection(null); pointerId = null; joystick.classList.remove('is-active'); thumb.style.transform = 'translate(0,0)';
    setPhaserDirection(null);
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
    event.preventDefault(); event.stopPropagation();
    if (pointerId !== null) return;
    pointerId = event.pointerId; joystick.setPointerCapture?.(pointerId); joystick.classList.add('is-active'); move(event.clientX, event.clientY);
  }, { passive: false });
  joystick.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault(); move(event.clientX, event.clientY);
  }, { passive: false });
  const end = event => { if (event && event.pointerId !== pointerId) return; reset(); };
  joystick.addEventListener('pointerup', end); joystick.addEventListener('pointercancel', end); joystick.addEventListener('lostpointercapture', end);
  window.addEventListener('blur', reset); window.addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
