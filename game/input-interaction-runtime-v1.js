// Contextual input bridge for gameplay systems that already expose an action.
(() => {
  const KEY = 'relayInteractionRuntimeV1';
  if (window[KEY]) return;
  window[KEY] = true;
  let active = true;
  let lastAction = 0;
  const onKey = event => {
    if (!active || event.repeat || event.code !== 'KeyF') return;
    const scene = window.__relayRunnerScene;
    if (!scene?.scene?.isActive?.() || typeof scene.__relayFieldPulse !== 'function') return;
    const now = performance.now();
    if (now - lastAction < 180) return;
    if (scene.__relayFieldPulse()) { lastAction = now; event.preventDefault(); }
  };
  window.addEventListener('keydown', onKey, { passive: false });
  window.addEventListener('beforeunload', () => {
    active = false;
    window.removeEventListener('keydown', onKey);
    window[KEY] = false;
  }, { once: true });
})();
