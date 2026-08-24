// Authoritative mission transition guard.
// Prevents overlapping Retry/Next Mission launches without adding a frame barrier.

export function createMissionTransitionGuard({ getGame, getMissions, launch }) {
  let transitioning = false;

  async function stopRunner() {
    const game = getGame?.();
    if (!game?.scene) return;

    const key = 'runner';
    try {
      if (game.scene.isActive?.(key) || game.scene.isPaused?.(key) || game.scene.isSleeping?.(key)) {
        game.scene.stop(key);
      }
    } catch (error) {
      console.warn('[mission-transition] runner cleanup failed', error);
    }

    // Let Phaser finish synchronous scene bookkeeping without scheduling a
    // requestAnimationFrame callback for every transition.
    await Promise.resolve();
  }

  async function transitionTo(index) {
    if (transitioning) return false;

    const missions = getMissions?.();
    if (!Array.isArray(missions) || !Number.isInteger(index) || index < 0 || index >= missions.length) return false;

    transitioning = true;
    try {
      await stopRunner();
      const result = launch?.(index);
      if (result && typeof result.then === 'function') await result;
      return true;
    } catch (error) {
      console.error('[mission-transition] launch failed', error);
      return false;
    } finally {
      // Keep the guard closed through the current event turn so duplicate
      // pointer/click events cannot start another transition immediately.
      queueMicrotask(() => { transitioning = false; });
    }
  }

  return {
    retry: index => transitionTo(index),
    next: index => transitionTo(index + 1),
    isTransitioning: () => transitioning,
  };
}
