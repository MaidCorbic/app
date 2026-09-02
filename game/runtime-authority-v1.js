import { RunnerScene } from './src/scenes/RunnerScene.js';

/*
 * GAMEPLAY RUNTIME AUTHORITY V2
 *
 * This layer does not replace RunnerScene or any gameplay system. It only
 * establishes hard runtime invariants after the existing feature modules have
 * installed themselves:
 *   1) transient UI cannot accidentally resume a scene intentionally blocked
 *      by an active pause/intel overlay;
 *   2) legacy + mobile input adapters cannot emit the same one-shot action
 *      twice inside the same pointer gesture;
 *   3) the legacy main.js music bed remains the single music owner. The
 *      adaptive music module is kept loadable for compatibility, but it is
 *      prevented from starting a second WebAudio music graph;
 *   4) completion events from an older run cannot leak into a restarted run.
 *
 * The coordinator is intentionally defensive and scoped per live game/scene.
 */
(() => {
  'use strict';

  if (window.__relayRuntimeAuthorityV2) return;
  window.__relayRuntimeAuthorityV2 = true;

  const sceneState = new WeakMap();
  const gameState = new WeakMap();
  let adaptiveLocked = false;

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

  function lockAdaptiveMusicOwner() {
    if (adaptiveLocked) return true;
    const music = window.relayAdaptiveMusic;
    if (!music) return false;

    const original = {
      start: typeof music.start === 'function' ? music.start.bind(music) : null,
      stop: typeof music.stop === 'function' ? music.stop.bind(music) : null,
      setEnabled: typeof music.setEnabled === 'function' ? music.setEnabled.bind(music) : null,
    };

    try { original.stop?.(true); } catch {}
    try { original.setEnabled?.(false); } catch {}

    music.start = () => false;
    music.setEnabled = value => {
      if (value) {
        try { original.setEnabled?.(false); } catch {}
        return false;
      }
      try { return original.setEnabled?.(false); } catch { return false; }
    };
    music.stop = (...args) => {
      try { return original.stop?.(...args); } catch { return undefined; }
    };
    adaptiveLocked = true;
    window.__relayAdaptiveMusicOwner = 'main-audio-bed';
    return true;
  }

  function installResumeGuard(scene) {
    if (!scene?.scene || sceneState.has(scene)) return;

    const plugin = scene.scene;
    const originalResume = plugin.resume?.bind(plugin);
    const originalPause = plugin.pause?.bind(plugin);
    if (!originalResume || !originalPause) return;

    const state = { originalResume, originalPause, queuedResume: false, syncTimer: 0 };
    sceneState.set(scene, state);

    plugin.resume = function guardedResume(...args) {
      if (hasBlockingOverlay(scene)) {
        state.queuedResume = true;
        return scene;
      }
      state.queuedResume = false;
      return originalResume(...args);
    };

    plugin.pause = function guardedPause(...args) {
      return originalPause(...args);
    };

    const sync = () => {
      if (!scene.sys?.isActive?.() || scene.sys?.isSleeping?.()) return;
      if (!scene.scene?.isPaused?.() || !state.queuedResume) return;
      if (hasBlockingOverlay(scene)) return;
      state.queuedResume = false;
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
    gameState.set(game, { originalEmit });

    emitter.emit = function guardedEmit(eventName, ...args) {
      if (eventName === 'mobile-action') {
        const action = String(args[0] || '');
        const now = performance.now();
        const previous = lastActionAt.get(action || '__empty__') || -Infinity;
        if (now - previous < 90) return false;
        lastActionAt.set(action || '__empty__', now);
      }

      if (eventName === 'complete') {
        const activeScene = game.scene?.getScene?.('runner');
        const emittedRunId = args.length ? args[args.length - 1] : undefined;
        const activeRunId = activeScene?.runId;
        if (!activeScene || activeScene.finished === false && activeScene.respawning === true) return false;
        if (activeRunId != null && emittedRunId != null && String(activeRunId) !== String(emittedRunId)) return false;
        if (!activeScene?.sys?.isActive?.() && !activeScene?.sys?.isPaused?.()) return false;
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
    lockAdaptiveMusicOwner();
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

  window.setTimeout(lockAdaptiveMusicOwner, 0);
})();
