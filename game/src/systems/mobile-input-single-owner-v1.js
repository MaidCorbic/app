// MOBILE INPUT SINGLE OWNER V8
// Action buttons only. Movement is owned exclusively by mobile-controls-bridge-v2.
(() => {
  'use strict';

  if (window.__relayMobileInputSingleOwnerV8) return;

  const ACTION_KEYS = Object.freeze({
    jump: [32, ' ', 'Space'],
    fire: [69, 'e', 'KeyE'],
    sword: [81, 'q', 'KeyQ'],
    dash: [16, 'Shift', 'ShiftLeft'],
    build1: [49, '1', 'Digit1'],
    gadget1: [51, '3', 'Digit3'],
  });

  const isTouchDevice = () =>
    navigator.maxTouchPoints > 0 ||
    'ontouchstart' in window ||
    window.matchMedia?.('(pointer: coarse)').matches ||
    window.matchMedia?.('(hover: none)').matches;

  const keyEvent = (code, key, type, keyCode) => {
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

  const emit = ([keyCode, key, code], type) => {
    window.dispatchEvent(keyEvent(code, key, type, keyCode));
  };

  const install = () => {
    if (!isTouchDevice() || window.__relayMobileInputSingleOwnerV8) return;
    const root = document.querySelector('.mobile-controls');
    if (!root) return;

    // Do not touch [data-mobile-joystick]. It has one owner only:
    // mobile-controls-bridge-v2.js. Two pointer owners caused frozen movement.
    const buttons = [];
    const seen = new Set();

    root.querySelectorAll('[data-mobile-action]').forEach(node => {
      const action = node.dataset.mobileAction;
      if (!ACTION_KEYS[action] || seen.has(action)) {
        node.remove();
        return;
      }
      seen.add(action);
      const clone = node.cloneNode(true);
      node.replaceWith(clone);
      buttons.push(clone);
    });

    window.__relayMobileInputSingleOwnerV8 = true;
    root.dataset.mobileControlsOwner = 'buttons-v8';

    const activePointers = new Map();

    const release = (button, pointerId) => {
      if (!activePointers.has(pointerId)) return;
      activePointers.delete(pointerId);
      const action = button.dataset.mobileAction;
      if (ACTION_KEYS[action]) emit(ACTION_KEYS[action], 'keyup');
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    };

    buttons.forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('pointerdown', event => {
        event.preventDefault();
        event.stopPropagation();
        if (activePointers.has(event.pointerId)) return;
        const action = button.dataset.mobileAction;
        if (!ACTION_KEYS[action]) return;
        activePointers.set(event.pointerId, true);
        button.setPointerCapture?.(event.pointerId);
        emit(ACTION_KEYS[action], 'keydown');
        button.classList.add('is-active');
        button.setAttribute('aria-pressed', 'true');
      }, { passive: false });

      button.addEventListener('pointerup', event => release(button, event.pointerId));
      button.addEventListener('pointercancel', event => release(button, event.pointerId));
      button.addEventListener('lostpointercapture', event => release(button, event.pointerId));
    });

    const releaseAll = () => {
      buttons.forEach(button => {
        const key = ACTION_KEYS[button.dataset.mobileAction];
        if (key && button.classList.contains('is-active')) emit(key, 'keyup');
        button.classList.remove('is-active');
        button.setAttribute('aria-pressed', 'false');
      });
      activePointers.clear();
    };

    window.addEventListener('blur', releaseAll);
    window.addEventListener('pagehide', releaseAll);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) releaseAll();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
