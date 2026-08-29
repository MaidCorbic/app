/* Production splash V6 — loader starts before the app and never depends on gameplay to animate. */
(() => {
  if (window.__relaySplashV6) return;
  window.__relaySplashV6 = true;

  const boot = () => {
    const splash = document.getElementById('relaySplash') || document.querySelector('.relay-splash');
    if (!splash) return;
    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');
    const image = splash.querySelector('#relaySplashArt, .relay-splash-art');
    if (!bar || !pct || !label) return;

    let released = false;
    let progress = 0;
    const startedAt = performance.now();
    const MIN_MS = 900;
    const MAX_MS = 5000;

    splash.setAttribute('aria-busy', 'true');
    splash.classList.remove('is-hidden', 'is-leaving');
    bar.style.width = '0%';
    pct.textContent = '0%';

    const setProgress = value => {
      progress = Math.max(progress, Math.min(99, value));
      bar.style.width = `${progress}%`;
      pct.textContent = `${Math.round(progress)}%`;
      label.textContent = progress >= 72 ? 'CONNECTING WORLD' : progress >= 35 ? 'LOADING GAME SYSTEMS' : 'INITIALIZING RELAY';
    };

    const release = reason => {
      if (released) return;
      released = true;
      bar.style.width = '100%';
      pct.textContent = '100%';
      label.textContent = 'READY';
      splash.dataset.relaySplashReleaseReason = reason;
      splash.setAttribute('aria-busy', 'false');
      splash.classList.add('is-hidden');
      window.setTimeout(() => splash.remove(), 420);
      window.dispatchEvent(new CustomEvent('relay:splash-released', { detail: { reason } }));
    };

    const imageReady = () => !image || image.complete || image.naturalWidth > 0;
    const tick = () => {
      if (released) return;
      const elapsed = performance.now() - startedAt;
      const engineReady = !!document.querySelector('#phaser-game canvas');
      const pageReady = document.readyState === 'complete';
      const target = Math.min(92, progress + (engineReady ? 1.8 : pageReady ? 1.0 : 0.7));
      setProgress(target);
      if (elapsed >= MIN_MS && (engineReady || elapsed >= MAX_MS)) return release(engineReady ? 'ready' : 'failsafe');
      window.setTimeout(tick, 50);
    };

    if (image && !imageReady()) {
      image.addEventListener('error', () => { label.textContent = 'SAFE MODE'; }, { once: true });
    }
    tick();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
