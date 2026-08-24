// Authoritative mission transition guard.
// Prevents overlapping Retry/Next Mission launches without forcing an extra frame loop.

export function createMissionTransitionGuard({ getGame, getMissions, launch }) {
  let transitioning = false;

  async function stopRunner() {
    const game = getGame();
    if (!game?.scene) return;

    const key = 'runner';
    try {
      if (game.scene.isActive?.(key) || game.scene.isPaused?.(key) || game.scene.isSleeping?.(key)) {
        game.scene.stop(key);
      }
    } catch (error) {
      console.warn('[mission-transition] runner cleanup failed', error);
    }

    // A microtask lets Phaser finish its scene-stop bookkeeping without adding
    // another requestAnimationFrame callback to every transition.
    await Promise.resolve();
  }

  async function transitionTo(index) {
    if (transitioning) return false;

    const missions = getMissions?.();
    if (!Array.isArray(missions) || !Number.isInteger(index) || index < 0 || index >= missions.length) return false;

    transitioning = true;
    try {
      await stopRunner();
      await Promise.resolve(launch(index));
      return true;
    } catch (error) {
      console.error('[mission-transition] launch failed', error);
      return false;
    } finally {
      // Hold the guard through the current event turn. This blocks duplicate
      // click/pointer events without creating a persistent animation callback.
      queueMicrotask(() => { transitioning = false; });
    }
  }

  return {
    retry: index => transitionTo(index),
    next: index => transitionTo(index + 1),
    isTransitioning: () => transitioning,
  };
}
