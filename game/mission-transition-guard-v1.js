// Authoritative mission transition guard.
// Keeps Retry/Next Mission from launching multiple overlapping runs.

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
    await new Promise(resolve => requestAnimationFrame(resolve));
  }

  async function transitionTo(index) {
    if (transitioning) return false;
    const missions = getMissions();
    if (!Number.isInteger(index) || index < 0 || index >= missions.length) return false;
    transitioning = true;
    try {
      await stopRunner();
      launch(index);
      return true;
    } catch (error) {
      console.error('[mission-transition] launch failed', error);
      return false;
    } finally {
      // launch() is synchronous in the current runtime; release only after the
      // next frame so duplicate pointer/click events cannot start another run.
      requestAnimationFrame(() => { transitioning = false; });
    }
  }

  return {
    retry: index => transitionTo(index),
    next: index => transitionTo(index + 1),
    isTransitioning: () => transitioning
  };
}
