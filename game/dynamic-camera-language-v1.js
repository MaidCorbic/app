// NEW GAMEPLAY — Dynamic Camera Language V1
// Additive presentation layer. No per-frame RAF loop.
(() => {
  const state = {
    boundGame: null,
    boundScene: null,
    baseZoom: null,
    restoreTimer: 0,
    bindTimer: 0,
    disposed: false,
  };

  const now = () => performance.now();
  const getReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

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

  function camera(scene = state.boundScene) {
    return scene?.cameras?.main || null;
  }

  function unbind() {
    const events = state.boundGame?.events;
    events?.off?.('feedback', onFeedback);
    events?.off?.('runner-ready', syncBaseZoom);
    state.boundGame = null;
    state.boundScene = null;
  }

  function bind() {
    const game = getGame();
    const scene = getScene(game);
    const cam = camera(scene);
    if (!game?.events?.on || !scene || !cam) return false;
    if (state.boundGame === game && state.boundScene === scene) return true;

    unbind();
    state.boundGame = game;
    state.boundScene = scene;
    state.baseZoom = Number.isFinite(cam.zoom) && cam.zoom > 0 ? cam.zoom : 1;
    return true;
  }

  function ensureBound() {
    if (state.disposed || bind()) return;
    clearTimeout(state.bindTimer);
    state.bindTimer = window.setTimeout(ensureBound, 750);
  }

  function syncBaseZoom() {
    const cam = camera();
    if (!cam) return;
    state.baseZoom = Number.isFinite(cam.zoom) && cam.zoom > 0 ? cam.zoom : 1;
  }

  function restore() {
    clearTimeout(state.restoreTimer);
    const cam = camera();
    if (cam && Number.isFinite(state.baseZoom)) cam.setZoom?.(state.baseZoom);
  }

  function pulse(amount, duration) {
    if (state.disposed || getReduced()) return;
    if (!bind()) {
      ensureBound();
      return;
    }

    const cam = camera();
    if (!cam || !Number.isFinite(state.baseZoom)) return;

    const target = Math.max(0.92, Math.min(1.12, state.baseZoom + amount));
    cam.setZoom?.(target);

    clearTimeout(state.restoreTimer);
    state.restoreTimer = window.setTimeout(() => {
      if (state.disposed) return;
      restore();
    }, Math.max(60, duration));
  }

  function onFeedback(kind) {
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

  function reset() {
    clearTimeout(state.restoreTimer);
    restore();
  }

  function dispose() {
    if (state.disposed) return;
    state.disposed = true;
    clearTimeout(state.bindTimer);
    reset();
    unbind();
  }

  function init() {
    window.addEventListener('relay:runner-scene-ready', () => {
      if (!bind()) return;
      syncBaseZoom();
    }, { passive: true });
    window.addEventListener('blur', reset, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
    window.addEventListener('beforeunload', dispose, { once: true });
    ensureBound();
  }

  window.relayDynamicCamera = { reset, bind, dispose };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
