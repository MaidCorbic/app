import { RunnerScene } from './src/scenes/RunnerScene.js';

/*
 * GAMEPLAY RUNTIME AUTHORITY V1
 *
 * This layer does not replace RunnerScene or any gameplay system. It only
 * establishes two hard runtime invariants after the existing feature modules
 * have installed themselves:
 *   1) transient UI cannot accidentally resume a scene that is intentionally
 *      blocked by an active pause/intel overlay;
 *   2) legacy + mobile input adapters cannot emit the same one-shot action
 *      twice inside the same pointer gesture.
 *
 * The coordinator is intentionally defensive and scoped per live game/scene.
 */
(() => {
  'use strict';

  if (window.__relayRuntimeAuthorityV1) return;
  window.__relayRuntimeAuthorityV1 = true;

  const sceneState = new WeakMap();
  const gameState = new WeakMap();

  function isElementVisible(node) {
    return !!node && !node.classList.contains('hidden') && !node.hidden;
  }

  function hasBlockingOverlay(scene) {
    if (!scene) return false;

    const pauseMenu = document.getElementById('pauseMenu');
    if (isElementVisible(pauseMenu)) return true;

    if (scene.infoCard?.active || scene.__enemyDiscoveryActiveKey) return true;

    const intel = document.getElementById('enemyDiscovery');
    if (isElementVisible(intel)) return true;

    const gameplayIntro = document.getElementById('relayGameplayIntroFinalV1');
    if (isElementVisible(gameplayIntro)) return true;

    return false;
  }

  function installResumeGuard(scene) {
    if (!scene?.scene || sceneState.has(scene)) return;

    const plugin = scene.scene;
    const originalResume = plugin.resume?.bind(plugin);
    const originalPause = plugin.pause?.bind(plugin);
    if (!originalResume || !originalPause) return;

    const state = {
      originalResume,
      originalPause,
      guarded: false,
      queuedResume: false,
      syncTimer: 0,
    };
    sceneState.set(scene, state);

    plugin.resume = function guardedResume(...args) {
      if (hasBlockingOverlay(scene)) {
        state.queuedResume = true;
        return scene;
      }
      state.queuedResume = false;
      state.guarded = false;
      return originalResume(...args);
    };

    plugin.pause = function guardedPause(...args) {
      state.guarded = true;
      return originalPause(...args);
    };

    const sync = () => {
      if (!scene.sys?.isActive?.() || scene.sys?.isSleeping?.()) return;
      if (!scene.scene?.isPaused?.()) return;
      if (!state.queuedResume) return;
      if (hasBlockingOverlay(scene)) return;
      state.queuedResume = false;
      state.guarded = false;
      originalResume();
    };

    state.syncTimer = window.setInterval(sync, 180);

    scene.events?.once?.('shutdown', () => {
      window.clearInterval(state.syncTimer);
      plugin.resume = originalResume;
      plugin.pause = originalPause;
      sceneState.delete(scene);
    });
  }

  function installInputDeduper(game) {
    if (!game?.events || gameState.has(game)) return;

    const emitter = game.events;
    const originalEmit = emitter.emit.bind(emitter);
    const lastActionAt = new Map();
    const state = { originalEmit };
    gameState.set(game, state);

    emitter.emit = function guardedEmit(eventName, ...args) {
      if (eventName === 'mobile-action') {
        const action = String(args[0] || '');
        const now = performance.now();
        const key = action || '__empty__';
        const previous = lastActionAt.get(key) || -Infinity;
        if (now - previous < 90) return false;
        lastActionAt.set(key, now);
      }
      return originalEmit(eventName, ...args);
    };

    const scene = game.scene?.getScene?.('runner');
    scene?.events?.once?.('shutdown', () => {
      emitter.emit = originalEmit;
      gameState.delete(game);
    });
  }

  function attach(scene) {
    if (!scene?.game) return;
    installResumeGuard(scene);
    installInputDeduper(scene.game);
  }

  const originalCreate = RunnerScene?.prototype?.create;
  if (typeof originalCreate === 'function' && !RunnerScene.prototype.__relayRuntimeAuthorityCreateWrapped) {
    RunnerScene.prototype.create = function runtimeAuthorityCreate(...args) {
      const result = originalCreate.apply(this, args);
      try {
        attach(this);
        window.__relayRunnerScene = this;
        window.relayRunnerGame = this.game;
        window.dispatchEvent(new CustomEvent('relay:runner-scene-ready', { detail: { scene: this } }));
      } catch (error) {
        console.error('[Relay Runtime Authority] scene attach failed', error);
      }
      return result;
    };
    RunnerScene.prototype.__relayRuntimeAuthorityCreateWrapped = true;
  }
})();
