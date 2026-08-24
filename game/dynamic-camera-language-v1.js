// NEW GAMEPLAY — Dynamic Camera Language V1
// Performance-safe additive camera feedback. Never creates a second game/scene.
(() => {
  if (window.__relayDynamicCameraV1) return;
  window.__relayDynamicCameraV1 = true;

  const state = {
    boundGame: null,
    boundScene: null,
    baseZoom: null,
    targetZoom: null,
    pulseUntil: 0,
    raf: 0,
    disposed: false,
    lastFrame: 0,
    perfScore: 60,
    sampleCounter: 0,
    feedback: [],
  };

  const now = () => performance.now();
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  function getGame() {
    return window.relayRunnerGame || window.__relayRunnerGame || window.__RUNNER_GAME__ || window.__relayRunnerScene?.game || null;
  }

  function getScene(game) {
    if (!game?.scene) return null;
    try {
      return game.scene.getScene('runner') || window.__relayRunnerScene || null;
    } catch {
      return window.__relayRunnerScene || null;
    }
  }

  function getCamera(scene) {
    return scene?.cameras?.main || null;
  }

  function syncBaseZoom() {
    const cam = getCamera(state.boundScene);
    if (!cam) return false;
    const zoom = Number(cam.zoom);
    if (!Number.isFinite(zoom) || zoom <= 0) return false;
    state.baseZoom = zoom;
    state.targetZoom = zoom;
    return true;
  }

  function unbindGame() {
    if (state.boundGame?.events?.off) {
      try {
        state.boundGame.events.off('feedback', onFeedback);
        state.boundGame.events.off('runner-ready', syncBaseZoom);
      } catch {
        // Event emitter implementations differ; dropping references remains safe.
      }
    }
    state.boundGame = null;
    state.boundScene = null;
    state.baseZoom = null;
    state.targetZoom = null;
  }

  function bind() {
    const game = getGame();
    const scene = getScene(game);
    const cam = getCamera(scene);
    if (!game?.events?.on || !scene || !cam) return false;
    if (state.boundGame === game && state.boundScene === scene) return true;

    unbindGame();
    state.boundGame = game;
    state.boundScene = scene;
    syncBaseZoom();
    game.events.on('feedback', onFeedback);
    game.events.on('runner-ready', syncBaseZoom);
    return true;
  }

  function pulse(amount, duration) {
    if (reducedMotion()) return;
    const cam = getCamera(state.boundScene);
    if (!cam || !Number.isFinite(state.baseZoom)) return;
    state.targetZoom = Math.max(0.92, Math.min(1.12, state.baseZoom + amount));
    state.pulseUntil = now() + duration;
  }

  function onFeedback(kind) {
    if (state.disposed) return;
    switch (kind) {
      case 'dash': pulse(0.035, 180); break;
      case 'jump': pulse(0.018, 130); break;
      case 'wallJump': pulse(0.022, 140); break;
      case 'vault': pulse(0.018, 130); break;
      case 'slide': pulse(-0.018, 150); break;
      case 'chase': pulse(0.045, 420); break;
      case 'warning': pulse(0.028, 280); break;
      case 'hit': pulse(-0.028, 220); break;
      case 'complete': pulse(0.04, 520); break;
      default: break;
    }
  }

  function tick(timestamp) {
    if (state.disposed) return;

    const dt = state.lastFrame ? timestamp - state.lastFrame : 16.7;
    state.lastFrame = timestamp;
    state.sampleCounter += 1;

    // Avoid repeated scene graph traversal when the engine is under load.
    if (state.sampleCounter % 4 === 0 || !state.boundScene) bind();

    const observedFps = 1000 / Math.max(8, dt);
    state.perfScore = state.perfScore * 0.94 + Math.min(60, observedFps) * 0.06;

    if (state.perfScore < 42) {
      // Back off to every other frame under sustained load. Do not disable feedback.
      if (state.sampleCounter % 2 !== 0) {
        state.raf = requestAnimationFrame(tick);
        return;
      }
    }

    const cam = getCamera(state.boundScene);
    if (cam && Number.isFinite(state.baseZoom)) {
      if (now() >= state.pulseUntil) state.targetZoom = state.baseZoom;
      const current = Number.isFinite(cam.zoom) ? cam.zoom : state.baseZoom;
      const alpha = state.perfScore < 48 ? 0.22 : 0.14;
      const next = current + (state.targetZoom - current) * alpha;
      if (Math.abs(next - current) > 0.0005) cam.setZoom?.(next);
    }

    state.raf = requestAnimationFrame(tick);
  }

  function reset() {
    const cam = getCamera(state.boundScene);
    if (cam && Number.isFinite(state.baseZoom)) cam.setZoom?.(state.baseZoom);
    state.targetZoom = state.baseZoom;
    state.pulseUntil = 0;
  }

  function init() {
    if (state.raf) return;

    window.addEventListener('relay:runner-scene-ready', () => {
      bind();
      syncBaseZoom();
    }, { passive: true });

    window.addEventListener('blur', reset, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) reset();
    });

    window.addEventListener('beforeunload', () => {
      state.disposed = true;
      cancelAnimationFrame(state.raf);
      unbindGame();
      state.raf = 0;
    }, { once: true });

    state.raf = requestAnimationFrame(tick);
  }

  window.relayDynamicCamera = { reset, bind };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
