import { RunnerScene } from '../scenes/RunnerScene.js';

/*
 * Stable keyboard/touch compatibility bridge.
 * RunnerScene remains the gameplay owner. This file only guarantees keyboard
 * references exist and normalizes WASD state for the existing movement path.
 */
(() => {
  'use strict';
  if (window.__relayWasdMobileInputBridgeV1) return;
  window.__relayWasdMobileInputBridgeV1 = true;

  const getScene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;

  const ensureKeys = scene => {
    const keyboard = scene?.input?.keyboard;
    if (!scene || !keyboard) return null;
    keyboard.enabled = true;
    if (!scene.cursors?.left || !scene.cursors?.right || !scene.cursors?.up || !scene.cursors?.down) {
      scene.cursors = keyboard.createCursorKeys();
    }
    if (!['A','D','W','S','SPACE','SHIFT','E','Q','ESC'].every(key => scene.keys?.[key])) {
      scene.keys = keyboard.addKeys('A,D,W,S,E,Q,SPACE,SHIFT,ONE,TWO,THREE,FOUR,ESC');
    }
    return scene;
  };

  const setState = (scene, key, down) => {
    const current = ensureKeys(scene);
    if (!current) return;
    if (current.keys?.[key]) current.keys[key].isDown = down;
    if (key === 'A' && current.cursors?.left) current.cursors.left.isDown = down;
    if (key === 'D' && current.cursors?.right) current.cursors.right.isDown = down;
    if (key === 'W' && current.cursors?.up) current.cursors.up.isDown = down;
    if (key === 'S' && current.cursors?.down) current.cursors.down.isDown = down;
  };

  const mapCode = code => ({ KeyA:'A', KeyD:'D', KeyW:'W', KeyS:'S' })[code] || null;

  document.addEventListener('keydown', event => {
    const key = mapCode(event.code);
    if (!key || event.repeat) return;
    const scene = getScene();
    if (!scene?.scene?.isActive?.() || scene.scene.isPaused?.()) return;
    setState(scene, key, true);
    if (key === 'W') {
      const space = ensureKeys(scene)?.keys?.SPACE;
      if (space) space.isDown = true;
    }
  }, true);

  document.addEventListener('keyup', event => {
    const key = mapCode(event.code);
    if (!key) return;
    const scene = getScene();
    if (!scene) return;
    setState(scene, key, false);
    if (key === 'W') {
      const space = ensureKeys(scene)?.keys?.SPACE;
      if (space) space.isDown = false;
    }
  }, true);

  const release = () => {
    const scene = getScene();
    if (!scene) return;
    ['A','D','W','S'].forEach(key => setState(scene, key, false));
    const space = ensureKeys(scene)?.keys?.SPACE;
    if (space) space.isDown = false;
  };

  window.addEventListener('blur', release);
  window.addEventListener('pagehide', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });

  const bind = scene => { if (scene) ensureKeys(scene); };
  window.addEventListener('relay:runner-scene-ready', event => bind(event?.detail?.scene || getScene()));
  bind(getScene());
})();
