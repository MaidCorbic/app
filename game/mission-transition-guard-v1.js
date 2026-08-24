// Authoritative mission transition guard.
// Keeps Retry/Next Mission from launching multiple overlapping runs.

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
    // Yield once without scheduling an additional render frame. Phaser scene.stop()
    // is synchronous for this transition path, while the microtask boundary still
    // lets current event handlers finish before launch.
    await Promise.resolve();
  }

  async function transitionTo(index) {
    if (transitioning) return false;
    const missions = getMissions?.();
    if (!Array.isArray(missions) || !Number.isInteger(index) || index < 0 || index >= missions.length) return false;
    if (typeof launch !== 'function') return false;

    transitioning = true;
    try {
      await stopRunner();
      await launch(index);
      return true;
    } catch (error) {
      console.error('[mission-transition] launch failed', error);
      return false;
    } finally {
      // Keep the lock through the current event turn to absorb duplicate clicks,
      // then release without creating an extra RAF handler.
      queueMicrotask(() => { transitioning = false; });
    }
  }

  return {
    retry: index => transitionTo(index),
    next: index => transitionTo(index + 1),
    isTransitioning: () => transitioning
  };
}
