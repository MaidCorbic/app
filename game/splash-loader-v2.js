/* Production splash V4. Single owner for first-load presentation; always fails open. */
(() => {
  if (window.__relaySplashV4) return;
  window.__relaySplashV4 = true;

  const applyFirstPaintHardening = () => {
    const splash = document.querySelector('.relay-splash') || document.getElementById('relaySplash');
    const image = splash?.querySelector('.relay-splash-art, #relaySplashArt');
    if (!splash || !image) return;
    splash.style.width = '100dvw';
    splash.style.height = '100dvh';
    image.style.display = 'block';
    image.style.position = 'absolute';
    image.style.inset = '0';
    image.style.width = '100dvw';
    image.style.height = '100dvh';
    image.style.minWidth = '100%';
    image.style.minHeight = '100%';
    image.style.maxWidth = 'none';
    image.style.maxHeight = 'none';
    image.style.objectFit = 'cover';
    image.style.objectPosition = 'center';
    image.style.transform = 'none';
    image.style.animation = 'none';
    image.style.opacity = '1';
  };

  const boot = () => {
    const splash = document.querySelector('.relay-splash') || document.getElementById('relaySplash');
    if (!splash) return;
    applyFirstPaintHardening();
    const image = splash.querySelector('.relay-splash-art, #relaySplashArt');
    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');
    if (!image || !bar || !pct || !label) return;

    splash.setAttribute('aria-busy', 'true');
    let progress = 0;
    let imageReady = image.complete && image.naturalWidth > 0;
    let pageReady = document.readyState === 'complete';
    let engineReady = !!document.querySelector('#phaser-game canvas');
    let released = false;
    const startedAt = performance.now();
    const MIN_SPLASH_MS = 1600;
    const MAX_SPLASH_MS = 5000;

    const setProgress = (value, text) => {
      if (released) return;
      progress = Math.max(progress, Math.min(100, Math.round(value)));
      bar.style.width = `${progress}%`;
      pct.textContent = `${progress}%`;
      if (text) label.textContent = text;
    };
    const readiness = () => 25 * Number(imageReady) + 35 * Number(pageReady) + 40 * Number(engineReady);
    const status = value => value >= 100 ? 'READY' : value >= 60 ? 'CONNECTING WORLD' : value >= 25 ? 'LOADING GAME SYSTEMS' : 'INITIALIZING RELAY';
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
      const value = readiness();
      setProgress(value, status(value));
      const elapsed = performance.now() - startedAt;
      if (elapsed >= MAX_SPLASH_MS) return release('failsafe');
      if (imageReady && pageReady && engineReady && elapsed >= MIN_SPLASH_MS) return release('ready');
      window.setTimeout(tick, 50);
    };

    if (!imageReady) {
      image.addEventListener('load', () => { imageReady = true; tick(); }, { once: true });
      image.addEventListener('error', () => { imageReady = true; setProgress(25, 'SAFE MODE'); tick(); }, { once: true });
    }
    if (!pageReady) window.addEventListener('load', () => { pageReady = true; tick(); }, { once: true });
    const engineTimer = window.setInterval(() => {
      engineReady = !!document.querySelector('#phaser-game canvas');
      if (engineReady) window.clearInterval(engineTimer);
      tick();
    }, 50);

    setProgress(readiness(), status(readiness()));
    tick();
  };

  applyFirstPaintHardening();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
