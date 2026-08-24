// NEW GAMEPLAY — Dynamic Camera Language V1
// Additive only. Uses the existing RunnerScene camera and Phaser event bus when available.
// Never creates a second game/scene and never changes player physics.
(() => {
  const state = {
    boundGame: null,
    boundScene: null,
    baseZoom: null,
    targetZoom: null,
    pulseUntil: 0,
    raf: 0,
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
    state.targetZoom = state.baseZoom;

    game.events.on('feedback', onFeedback);
    game.events.on('runner-ready', syncBaseZoom);
    return true;
  }

  function ensureBound() {
    if (state.disposed || bind()) return;
    clearTimeout(state.bindTimer);
    state.bindTimer = window.setTimeout(ensureBound, 500);
  }

  function syncBaseZoom() {
    const cam = camera();
    if (!cam) return;
    state.baseZoom = Number.isFinite(cam.zoom) && cam.zoom > 0 ? cam.zoom : 1;
    if (!state.raf) state.targetZoom = state.baseZoom;
  }

  function stopAnimation() {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function tick() {
    state.raf = 0;
    if (state.disposed) return;
    const cam = camera();
    if (!cam || !Number.isFinite(state.baseZoom)) return;

    if (now() >= state.pulseUntil) state.targetZoom = state.baseZoom;
    const current = Number.isFinite(cam.zoom) ? cam.zoom : state.baseZoom;
    const target = Number.isFinite(state.targetZoom) ? state.targetZoom : state.baseZoom;
    const next = current + (target - current) * 0.18;

    if (Math.abs(target - current) < 0.001) {
      if (Math.abs(cam.zoom - target) >= 0.0001) cam.setZoom?.(target);
      return;
    }

    cam.setZoom?.(next);
    state.raf = requestAnimationFrame(tick);
  }

  function pulse(amount, duration) {
    if (state.disposed || getReduced()) return;
    if (!bind()) {
      ensureBound();
      return;
    }
    const cam = camera();
    if (!cam || !Number.isFinite(state.baseZoom)) return;

    state.targetZoom = Math.max(0.92, Math.min(1.12, state.baseZoom + amount));
    state.pulseUntil = now() + duration;
    if (!state.raf) state.raf = requestAnimationFrame(tick);
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
    stopAnimation();
    const cam = camera();
    if (cam && Number.isFinite(state.baseZoom)) cam.setZoom?.(state.baseZoom);
    state.targetZoom = state.baseZoom;
    state.pulseUntil = 0;
  }

  function dispose() {
    if (state.disposed) return;
    state.disposed = true;
    clearTimeout(state.bindTimer);
    reset();
    unbind();
  }

  function init() {
    window.addEventListener('relay:runner-scene-ready', () => { bind(); syncBaseZoom(); }, { passive: true });
    window.addEventListener('blur', reset, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
    window.addEventListener('beforeunload', dispose, { once: true });
    ensureBound();
  }

  window.relayDynamicCamera = { reset, bind, dispose };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
