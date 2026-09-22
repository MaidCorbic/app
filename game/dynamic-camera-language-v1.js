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
    reduced: false,
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

  function camera(scene) {
    return scene?.cameras?.main || null;
  }

  function bind() {
    const game = getGame();
    const scene = getScene(game);
    const cam = camera(scene);
    if (!game?.events?.on || !scene || !cam) return false;
    if (state.boundGame === game && state.boundScene === scene) return true;

    state.boundGame = game;
    state.boundScene = scene;
    state.baseZoom = Number.isFinite(cam.zoom) && cam.zoom > 0 ? cam.zoom : 1;
    state.targetZoom = state.baseZoom;

    game.events.on('feedback', onFeedback);
    game.events.on('runner-ready', syncBaseZoom);
    return true;
  }

  function syncBaseZoom() {
    const cam = camera(state.boundScene);
    if (!cam) return;
    if (!Number.isFinite(state.baseZoom) || state.baseZoom <= 0) state.baseZoom = Number.isFinite(cam.zoom) && cam.zoom > 0 ? cam.zoom : 1;
    state.targetZoom = state.baseZoom;
  }

  function pulse(amount, duration) {
    if (getReduced()) return;
    const cam = camera(state.boundScene);
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

  function tick() {
    if (state.disposed) return;
    bind();
    const cam = camera(state.boundScene);
    if (cam && Number.isFinite(state.baseZoom)) {
      if (now() >= state.pulseUntil) state.targetZoom = state.baseZoom;
      const current = Number.isFinite(cam.zoom) ? cam.zoom : state.baseZoom;
      const next = current + (state.targetZoom - current) * 0.14;
      cam.setZoom?.(next);
    }
    state.raf = requestAnimationFrame(tick);
  }

  function reset() {
    const cam = camera(state.boundScene);
    if (cam && Number.isFinite(state.baseZoom)) cam.setZoom?.(state.baseZoom);
    state.targetZoom = state.baseZoom;
    state.pulseUntil = 0;
  }

  function init() {
    if (state.raf) return;
    state.reduced = getReduced();
    window.addEventListener('relay:runner-scene-ready', () => { bind(); syncBaseZoom(); }, { passive: true });
    window.addEventListener('blur', reset, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
    window.addEventListener('beforeunload', () => { state.disposed = true; cancelAnimationFrame(state.raf); reset(); }, { once: true });
    state.raf = requestAnimationFrame(tick);
  }

  window.relayDynamicCamera = { reset, bind };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
