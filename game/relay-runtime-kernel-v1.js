/* UPDATE 22 — RELAY RUNTIME KERNEL V1
   Small additive lifecycle/event adapter.
   Existing gameplay systems remain authoritative.
   No polling, no gameplay ownership, no save/progression ownership.
*/
(() => {
  if (typeof window === 'undefined' || window.RelayRuntime) return;

  const modules = new Map();
  const sceneCleanups = new WeakMap();
  let currentScene = null;
  let currentGame = null;

  const safe = fn => {
    try { return fn(); } catch (error) {
      console.error('[RelayRuntime] callback failed', error);
      return undefined;
    }
  };

  function cleanupScene(scene) {
    if (!scene) return;
    const cleanups = sceneCleanups.get(scene);
    if (!cleanups) return;
    sceneCleanups.delete(scene);
    [...cleanups].reverse().forEach(fn => safe(fn));
  }

  function registerScene(scene) {
    if (!scene || currentScene === scene) return scene;
    if (currentScene && currentScene !== scene) cleanupScene(currentScene);
    currentScene = scene;
    currentGame = scene.game || null;

    const cleanups = new Set();
    sceneCleanups.set(scene, cleanups);

    const registerCleanup = fn => {
      if (typeof fn !== 'function') return () => {};
      cleanups.add(fn);
      return () => cleanups.delete(fn);
    };

    scene.events?.once?.('shutdown', () => {
      cleanupScene(scene);
      if (currentScene === scene) {
        currentScene = null;
        currentGame = null;
      }
    });
    scene.events?.once?.('destroy', () => {
      cleanupScene(scene);
      if (currentScene === scene) {
        currentScene = null;
        currentGame = null;
      }
    });

    modules.forEach(module => module.readyHandlers.forEach(handler => safe(() => handler(scene))));
    return scene;
  }

  function module(name) {
    if (!name) throw new TypeError('RelayRuntime.module(name) requires a name');
    let entry = modules.get(name);
    if (entry) return entry.api;

    entry = {
      name,
      readyHandlers: new Set(),
      eventHandlers: new Map(),
      api: null,
    };

    const api = {
      name,
      onSceneReady(handler) {
        if (typeof handler !== 'function') return () => {};
        entry.readyHandlers.add(handler);
        if (currentScene) safe(() => handler(currentScene));
        return () => entry.readyHandlers.delete(handler);
      },
      on(eventName, handler, options = {}) {
        if (typeof handler !== 'function') return () => {};
        const target = options.target === 'game' ? currentGame : currentScene;
        if (!target?.events?.on) return () => {};
        target.events.on(eventName, handler, options.context);
        const off = () => target.events?.off?.(eventName, handler, options.context);
        if (currentScene) {
          const cleanups = sceneCleanups.get(currentScene);
          cleanups?.add(off);
        }
        return off;
      },
      once(eventName, handler, options = {}) {
        if (typeof handler !== 'function') return () => {};
        const target = options.target === 'game' ? currentGame : currentScene;
        if (!target?.events?.once) return () => {};
        target.events.once(eventName, handler, options.context);
        const off = () => target.events?.off?.(eventName, handler, options.context);
        if (currentScene) sceneCleanups.get(currentScene)?.add(off);
        return off;
      },
      cleanup(handler) {
        if (typeof handler !== 'function' || !currentScene) return () => {};
        return sceneCleanups.get(currentScene)?.add(handler) || (() => {});
      },
    };
    entry.api = api;
    modules.set(name, entry);
    if (currentScene) safe(() => entry.readyHandlers.forEach(handler => handler(currentScene)));
    return api;
  }

  const RelayRuntime = Object.freeze({
    version: '1.0.0',
    scene: () => currentScene || window.__relayRunnerScene || null,
    game: () => currentGame || window.relayRunnerGame || currentScene?.game || null,
    module,
    registerScene,
    debug() {
      const scene = RelayRuntime.scene();
      const result = {
        version: '1.0.0',
        sceneLoaded: !!scene,
        mission: scene?.mission?.id ?? 'NONE',
        tutorial: !!scene?.firstTimeTutorial,
        cinematic: !!scene?.cinematicActive,
        modules: [...modules.keys()],
      };
      console.table(result);
      return result;
    },
  });

  window.RelayRuntime = RelayRuntime;

  window.addEventListener('relay:runner-scene-ready', event => {
    const scene = event.detail?.scene;
    if (scene) registerScene(scene);
  }, { passive: true });

  if (window.__relayRunnerScene) registerScene(window.__relayRunnerScene);
  window.dispatchEvent(new CustomEvent('relay:runtime-kernel-ready', { detail: { version: '1.0.0' } }));
})();
