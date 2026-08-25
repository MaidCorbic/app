// Contextual input bridge for gameplay systems that already expose an action.
// E/TAP remains owned by the existing world-interaction runtime. F is reserved here
// for the contextual field action and does nothing when no valid action is available.
(() => {
  const KEY = 'relayInteractionRuntimeV1';
  if (window[KEY]) return;
  window[KEY] = true;
  let active = true;
  let lastAction = 0;
  const getScene = () => window.__relayRunnerScene;
  const onKey = event => {
    if (!active || event.repeat || event.code !== 'KeyF') return;
    const scene = getScene();
    if (!scene?.scene?.isActive?.() || typeof scene.__relayFieldPulse !== 'function') return;
    const now = performance.now();
    if (now - lastAction < 180) return;
    if (scene.__relayFieldPulse()) {
      lastAction = now;
      event.preventDefault();
    }
  };
  window.addEventListener('keydown', onKey, { passive: false });
  const cleanup = () => {
    active = false;
    window.removeEventListener('keydown', onKey);
    window[KEY] = false;
  };
  window.addEventListener('beforeunload', cleanup, { once: true });
})();
