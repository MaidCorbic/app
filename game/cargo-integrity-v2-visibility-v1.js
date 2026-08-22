/* UPDATE 18 V2 — Cargo visibility gate.
   Cargo HUD exists as a reusable runtime, but it must only be visible during the active post-tutorial run.
   This layer owns presentation visibility only; it does not change cargo/gameplay state.
*/
(() => {
  if (window.__relayCargoVisibilityV1) return;
  window.__relayCargoVisibilityV1 = true;

  const ROOT_ID = 'cargoIntegrityV2';

  const getRoot = () => document.getElementById(ROOT_ID);
  const getScene = () => window.__relayRunnerScene || null;

  function shouldShow(scene) {
    if (!scene?.mission?.id) return false;
    if (scene.finished) return false;
    if (scene.cinematicActive || window.__relayCinematicLock) return false;
    if (scene.firstTimeTutorial) return false;
    const intro = document.getElementById('intro');
    if (intro && !intro.classList.contains('hidden')) return false;
    const preflight = document.getElementById('preflight');
    if (preflight && !preflight.classList.contains('hidden')) return false;
    return Boolean(scene.isActive?.() ?? true);
  }

  function sync() {
    const root = getRoot();
    if (!root) return;
    const visible = shouldShow(getScene());
    root.classList.toggle('cargo-visibility-ready', visible);
    root.style.display = visible ? 'block' : 'none';
    root.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  const bind = () => {
    sync();
    window.addEventListener('relay:runner-scene-ready', sync, { passive: true });
    window.addEventListener('relay:cinematic-lock', sync, { passive: true });
    window.addEventListener('relay:cinematic-unlock', sync, { passive: true });
    window.addEventListener('orientationchange', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    window.setInterval(sync, 250);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
