/* Production splash V5. Single owner for first-load presentation; visible progress is fail-open. */
(() => {
  if (window.__relaySplashV5) return;
  window.__relaySplashV5 = true;

  const boot = () => {
    const splash = document.querySelector('.relay-splash') || document.getElementById('relaySplash');
    if (!splash) return;
    const image = splash.querySelector('.relay-splash-art, #relaySplashArt');
    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');
    if (!image || !bar || !pct || !label) return;

    const fit = () => {
      splash.style.width = '100dvw'; splash.style.height = '100dvh';
      image.style.display = 'block'; image.style.position = 'absolute'; image.style.inset = '0';
      image.style.width = '100dvw'; image.style.height = '100dvh';
      image.style.minWidth = '100%'; image.style.minHeight = '100%';
      image.style.maxWidth = 'none'; image.style.maxHeight = 'none';
      image.style.objectFit = 'cover'; image.style.objectPosition = 'center';
      image.style.transform = 'none'; image.style.animation = 'none'; image.style.opacity = '1';
    };
    fit();
    splash.setAttribute('aria-busy', 'true');

    let imageReady = image.complete && image.naturalWidth > 0;
    let pageReady = document.readyState === 'complete';
    let engineReady = !!document.querySelector('#phaser-game canvas');
    let released = false;
    let visualProgress = 0;
    const startedAt = performance.now();
    const MIN_SPLASH_MS = 700;
    const MAX_SPLASH_MS = 5000;

    const release = reason => {
      if (released) return;
      released = true;
      bar.style.width = '100%'; pct.textContent = '100%'; label.textContent = 'READY';
      splash.dataset.relaySplashReleaseReason = reason;
      splash.setAttribute('aria-busy', 'false'); splash.classList.add('is-hidden');
      window.setTimeout(() => splash.remove(), 420);
      window.dispatchEvent(new CustomEvent('relay:splash-released', { detail: { reason } }));
    };

    const tick = () => {
      if (released) return;
      engineReady = engineReady || !!document.querySelector('#phaser-game canvas');
      const realReady = imageReady && pageReady && engineReady;
      const elapsed = performance.now() - startedAt;
      const readiness = 25 * Number(imageReady) + 35 * Number(pageReady) + 40 * Number(engineReady);
      const target = realReady ? 100 : Math.min(92, Math.max(readiness, visualProgress + 0.35));
      visualProgress = Math.min(100, target);
      bar.style.width = `${visualProgress}%`;
      pct.textContent = `${Math.round(visualProgress)}%`;
      label.textContent = realReady ? 'READY' : visualProgress >= 60 ? 'CONNECTING WORLD' : visualProgress >= 25 ? 'LOADING GAME SYSTEMS' : 'INITIALIZING RELAY';
      if (realReady && elapsed >= MIN_SPLASH_MS) return release('ready');
      if (elapsed >= MAX_SPLASH_MS) return release('failsafe');
      window.setTimeout(tick, 50);
    };

    if (!imageReady) {
      image.addEventListener('load', () => { imageReady = true; tick(); }, { once: true });
      image.addEventListener('error', () => { imageReady = true; label.textContent = 'SAFE MODE'; tick(); }, { once: true });
    }
    if (!pageReady) window.addEventListener('load', () => { pageReady = true; tick(); }, { once: true });

    setTimeout(tick, 0);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
