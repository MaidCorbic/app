/* Gameplay Keyboard HUD V1
 * Visual input monitor only. It never emits or owns gameplay input.
 */
(() => {
  'use strict';

  const HUD_ID = 'relay-gameplay-keyboard-hud';
  const KEY_DEFINITIONS = Object.freeze([
    ['W', 'JUMP'],
    ['A', 'MOVE LEFT'],
    ['D', 'MOVE RIGHT'],
    ['E', 'ACTION'],
    ['F', 'FLIGHT'],
  ]);
  const trackedCodes = new Set(KEY_DEFINITIONS.map(([key]) => `Key${key}`));

  let hud = null;
  let scene = null;
  let shutdownHandler = null;
  const keyNodes = new Map();

  const isGameplaySceneActive = () => {
    const current = window.__relayRunnerScene;
    if (!current) return false;
    if (typeof current.scene?.isActive !== 'function') return false;
    return Boolean(current.scene.isActive('runner'));
  };

  const isTypingTarget = target => {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  };

  const setActive = (code, active) => {
    const key = code.slice(-1).toUpperCase();
    const node = keyNodes.get(key);
    if (!node) return;
    node.classList.toggle('is-active', active);
    const cap = node.querySelector('.relay-keycap');
    if (cap) cap.setAttribute('aria-pressed', active ? 'true' : 'false');
  };

  const clearActive = () => {
    keyNodes.forEach(node => node.classList.remove('is-active'));
  };

  const buildHud = () => {
    if (document.getElementById(HUD_ID)) return document.getElementById(HUD_ID);

    const root = document.createElement('div');
    root.id = HUD_ID;
    root.hidden = true;
    root.setAttribute('aria-label', 'Keyboard controls');

    KEY_DEFINITIONS.forEach(([key, label]) => {
      const item = document.createElement('div');
      item.className = 'relay-keyboard-key';
      item.dataset.key = key;

      const cap = document.createElement('div');
      cap.className = 'relay-keycap';
      cap.textContent = key;
      cap.setAttribute('aria-hidden', 'true');
      cap.setAttribute('aria-pressed', 'false');

      const labelNode = document.createElement('div');
      labelNode.className = 'relay-key-label';
      labelNode.textContent = label;

      item.append(cap, labelNode);
      root.appendChild(item);
      keyNodes.set(key, item);
    });

    document.body.appendChild(root);
    return root;
  };

  const show = () => {
    if (!hud) hud = buildHud();
    if (!hud) return;
    hud.hidden = !isGameplaySceneActive();
  };

  const hide = () => {
    if (!hud) return;
    hud.hidden = true;
    clearActive();
  };

  const installKeyboardMonitor = () => {
    if (window.__relayGameplayKeyboardHudMonitorV1) return;
    window.__relayGameplayKeyboardHudMonitorV1 = true;

    const onKeyDown = event => {
      if (!trackedCodes.has(event.code)) return;
      if (!isGameplaySceneActive() || isTypingTarget(event.target)) return;
      show();
      setActive(event.code, true);
    };

    const onKeyUp = event => {
      if (!trackedCodes.has(event.code)) return;
      setActive(event.code, false);
    };

    const onBlur = clearActive;
    const onVisibilityChange = () => {
      if (document.hidden) clearActive();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    window.__relayGameplayKeyboardHudCleanupV1 = () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.__relayGameplayKeyboardHudMonitorV1 = false;
    };
  };

  const wireSceneLifecycle = () => {
    const current = window.__relayRunnerScene;
    if (!current || scene === current) return;

    scene = current;
    if (shutdownHandler && typeof shutdownHandler.off === 'function') {
      shutdownHandler.off('shutdown');
    }

    if (current.events?.once) {
      current.events.once('shutdown', hide);
      shutdownHandler = current.events;
    }
  };

  const install = () => {
    hud = buildHud();
    installKeyboardMonitor();
    wireSceneLifecycle();

    const tick = () => {
      wireSceneLifecycle();
      if (isGameplaySceneActive()) show();
      else hide();
    };

    window.setInterval(tick, 350);
    tick();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
