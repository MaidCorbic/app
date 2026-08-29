/* Production splash V7. Never block game entry on Phaser/auth/runtime readiness. */
(() => {
  if (window.__relaySplashLoaderV7) return;
  window.__relaySplashLoaderV7 = true;

  const boot = () => {
    const splash = document.getElementById('relaySplash') || document.querySelector('.relay-splash');
    if (!splash) return;
    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');
    const image = splash.querySelector('#relaySplashArt, .relay-splash-art');
    if (!bar || !pct || !label) {
      window.setTimeout(() => splash.classList.add('is-hidden'), 1200);
      return;
    }
    let released = false;
    let progress = 0;
    const startedAt = performance.now();
    const MIN_MS = 900;
    const MAX_MS = 3000;
    splash.setAttribute('aria-busy', 'true');
    splash.classList.remove('is-hidden', 'is-leaving');
    const paint = value => {
      if (released) return;
      progress = Math.max(progress, Math.min(96, value));
      bar.style.width = `${progress}%`;
      pct.textContent = `${Math.round(progress)}%`;
      label.textContent = progress >= 70 ? 'CONNECTING WORLD' : progress >= 35 ? 'LOADING GAME SYSTEMS' : 'INITIALIZING RELAY';
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
    const tick = () => {
      if (released) return;
      const elapsed = performance.now() - startedAt;
      const pageReady = document.readyState === 'complete';
      const imageReady = !image || image.complete || image.naturalWidth > 0;
      paint(progress + (pageReady || imageReady ? 1.7 : 1.15));
      if (elapsed >= MIN_MS && (pageReady || imageReady)) return release('ready');
      if (elapsed >= MAX_MS) return release('failsafe');
      window.setTimeout(tick, 50);
    };
    if (image && !image.complete) image.addEventListener('load', tick, { once: true });
    tick();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
