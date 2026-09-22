// NEW GAMEPLAY — Dynamic Camera Language V1
// Optimized camera feedback runtime.
// Uses the existing RunnerScene camera and Phaser event bus when available.
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

  const getReduced = () =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  function getGame() {
    return (
      window.relayRunnerGame ||
      window.__relayRunnerGame ||
      window.__RUNNER_GAME__ ||
      window.__relayRunnerScene?.game ||
      null
    );
  }

  function getScene(game) {
    if (!game?.scene) return null;

    try {
      return (
        game.scene.getScene('runner') ||
        window.__relayRunnerScene ||
        null
      );
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

    if (!game?.events?.on || !scene || !cam) {
      return false;
    }

    if (state.boundGame === game && state.boundScene === scene) {
      return true;
    }

    // Remove listeners from a previous game instance if one existed.
    if (state.boundGame?.events?.off) {
      try {
        state.boundGame.events.off('feedback', onFeedback);
        state.boundGame.events.off('runner-ready', syncBaseZoom);
      } catch {}
    }

    state.boundGame = game;
    state.boundScene = scene;

    state.baseZoom =
      Number.isFinite(cam.zoom) && cam.zoom > 0
        ? cam.zoom
        : 1;

    state.targetZoom = state.baseZoom;

    game.events.on('feedback', onFeedback);
    game.events.on('runner-ready', syncBaseZoom);

    return true;
  }

  function syncBaseZoom() {
    const cam = camera(state.boundScene);

    if (!cam) return;

    if (
      !Number.isFinite(state.baseZoom) ||
      state.baseZoom <= 0
    ) {
      state.baseZoom =
        Number.isFinite(cam.zoom) && cam.zoom > 0
          ? cam.zoom
          : 1;
    }

    state.targetZoom = state.baseZoom;
  }

  function pulse(amount, duration) {
    if (state.disposed) return;
    if (getReduced()) return;

    const cam = camera(state.boundScene);

    if (
      !cam ||
      !Number.isFinite(state.baseZoom)
    ) {
      return;
    }

    state.targetZoom = Math.max(
      0.92,
      Math.min(
        1.12,
        state.baseZoom + amount
      )
    );

    state.pulseUntil = now() + duration;

    // Start the animation only when a pulse actually exists.
    startAnimation();
  }

  function onFeedback(kind) {
    if (state.disposed) return;

    switch (kind) {
      case 'dash':
        pulse(0.035, 180);
        break;

      case 'jump':
        pulse(0.018, 130);
        break;

      case 'wallJump':
        pulse(0.022, 140);
        break;

      case 'vault':
        pulse(0.018, 130);
        break;

      case 'slide':
        pulse(-0.018, 150);
        break;

      case 'chase':
        pulse(0.045, 420);
        break;

      case 'warning':
        pulse(0.028, 280);
        break;

      case 'hit':
        pulse(-0.028, 220);
        break;

      case 'complete':
        pulse(0.04, 520);
        break;

      default:
        break;
    }
  }

  function stopAnimation() {
    if (!state.raf) return;

    cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  function startAnimation() {
    if (state.disposed) return;
    if (state.raf) return;

    state.raf = requestAnimationFrame(tick);
  }

  function tick() {
    state.raf = 0;

    if (state.disposed) {
      return;
    }

    const cam = camera(state.boundScene);

    if (
      !cam ||
      !Number.isFinite(state.baseZoom)
    ) {
      bind();
      return;
    }

    const current =
      Number.isFinite(cam.zoom)
        ? cam.zoom
        : state.baseZoom;

    const currentTime = now();

    // Pulse expired: smoothly return to the normal camera zoom.
    if (currentTime >= state.pulseUntil) {
      state.targetZoom = state.baseZoom;
    }

    const difference =
      state.targetZoom - current;

    // If the camera is already effectively at the target,
    // stop the RAF completely.
    if (Math.abs(difference) < 0.0005) {
      if (Math.abs(current - state.baseZoom) < 0.0005) {
        if (current !== state.baseZoom) {
          cam.setZoom?.(state.baseZoom);
        }
      } else {
        cam.setZoom?.(state.targetZoom);
      }

      return;
    }

    const next =
      current + difference * 0.14;

    cam.setZoom?.(next);

    // Continue only while the camera still needs animation.
    state.raf = requestAnimationFrame(tick);
  }

  function reset() {
    stopAnimation();

    const cam = camera(state.boundScene);

    if (
      cam &&
      Number.isFinite(state.baseZoom)
    ) {
      cam.setZoom?.(state.baseZoom);
    }

    state.targetZoom = state.baseZoom;
    state.pulseUntil = 0;
  }

  function init() {
    if (state.disposed) return;

    state.reduced = getReduced();

    window.addEventListener(
      'relay:runner-scene-ready',
      () => {
        if (state.disposed) return;

        bind();
        syncBaseZoom();
      },
      { passive: true }
    );

    window.addEventListener(
      'blur',
      reset,
      { passive: true }
    );

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) {
          reset();
        }
      }
    );

    window.addEventListener(
      'beforeunload',
      () => {
        state.disposed = true;

        stopAnimation();

        if (state.boundGame?.events?.off) {
          try {
            state.boundGame.events.off(
              'feedback',
              onFeedback
            );

            state.boundGame.events.off(
              'runner-ready',
              syncBaseZoom
            );
          } catch {}
        }

        reset();
      },
      { once: true }
    );

    // Bind once during startup.
    bind();
  }

  window.relayDynamicCamera = {
    reset,
    bind,
  };

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      init,
      { once: true }
    );
  } else {
    init();
  }
})();