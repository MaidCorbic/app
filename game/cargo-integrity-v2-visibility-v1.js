/* UPDATE 18 V2 — Cargo visibility gate.
   Cargo HUD stays completely hidden on Home, preflight and tutorial/cinematic presentation.
   It becomes visible only when the real post-tutorial run is active.
   On phones, both Cargo Integrity and Mission Route are completely hidden.
*/
(() => {
  if (window.__relayCargoVisibilityV1) return;
  window.__relayCargoVisibilityV1 = true;

  const ROOT_ID = 'cargoIntegrityV2';

  const getRoot = () => document.getElementById(ROOT_ID);
  const getScene = () => window.__relayRunnerScene || null;

  function isPhone() {
    const ua = String(navigator.userAgent || '');
    const mobileUa = /Android.*Mobile|iPhone|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua);

    const coarseTouch =
      navigator.maxTouchPoints > 0 &&
      window.matchMedia?.('(pointer: coarse)').matches;

    const shortSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    const longSide = Math.max(window.innerWidth || 0, window.innerHeight || 0);

    const phoneViewport =
      coarseTouch &&
      shortSide <= 600 &&
      longSide <= 1000;

    return mobileUa || phoneViewport;
  }

  function tutorialIsActive(scene) {
    if (!scene) return false;

    // firstTimeTutorial alone is not a reliable completion marker in the current
    // runtime because the tutorial state may remain true while its presentation
    // objects are already dismissed. Treat the visible tutorial presentation as
    // authoritative: while guides/companions/info card are visible, keep cargo hidden.
    const guidesVisible = Boolean(scene.guides?.visible);
    const companionsVisible = Boolean(scene.guideCompanions?.visible);
    const infoVisible = Boolean(scene.infoCard?.visible);
    const tutorialPresentationVisible = guidesVisible || companionsVisible || infoVisible;

    return Boolean(scene.firstTimeTutorial && tutorialPresentationVisible);
  }

  function shouldShow(scene) {
    if (!scene?.mission?.id) return false;
    if (scene.finished) return false;
    if (scene.cinematicActive || window.__relayCinematicLock) return false;
    if (tutorialIsActive(scene)) return false;

    const intro = document.getElementById('intro');
    if (intro && !intro.classList.contains('hidden')) return false;

    const preflight = document.getElementById('preflight');
    if (preflight && !preflight.classList.contains('hidden')) return false;

    return Boolean(scene.isActive?.() ?? true);
  }

  function sync() {
    const scene = getScene();
    const root = getRoot();
    const phone = isPhone();

    // PHONE HARD HIDE — Cargo Integrity.
    if (root) {
      if (phone) {
        root.classList.remove('cargo-visibility-ready', 'is-visible', 'is-critical', 'is-hit', 'is-warning', 'is-anomaly');
        root.style.setProperty('display', 'none', 'important');
        root.style.setProperty('visibility', 'hidden', 'important');
        root.style.setProperty('opacity', '0', 'important');
        root.style.setProperty('pointer-events', 'none', 'important');
        root.setAttribute('aria-hidden', 'true');
      } else {
        const visible = shouldShow(scene);
        root.classList.toggle('cargo-visibility-ready', visible);
        root.style.removeProperty('display');
        root.style.removeProperty('visibility');
        root.style.removeProperty('opacity');
        root.style.removeProperty('pointer-events');
        root.style.display = visible ? 'block' : 'none';
        root.setAttribute('aria-hidden', visible ? 'false' : 'true');
      }
    }

    // PHONE HARD HIDE — Phaser Mission Route panel.
    const missionState = scene?.__missionObjectiveState;
    const missionPanel = missionState?.c;

    if (missionPanel) {
      if (phone) {
        missionPanel.setVisible(false);
        missionPanel.setAlpha(0);
        missionPanel.setActive(false);
      } else if (shouldShow(scene)) {
        missionPanel.setActive(true);
        missionPanel.setAlpha(1);
        missionPanel.setVisible(true);
      }
    }
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
