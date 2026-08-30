/* Production cinematic splash V4 — single owner, never waits for Phaser. */
(() => {
  if (window.__relaySplashV4) return;
  window.__relaySplashV4 = true;

  const boot = () => {
    const splash = document.querySelector('.relay-splash') || document.getElementById('relaySplash');
    if (!splash) return;
    const image = splash.querySelector('.relay-splash-art, #relaySplashArt');
    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');
    if (!image || !bar || !pct || !label) return;

    const setVisualSize = () => {
      const portrait = window.matchMedia('(max-width:700px) and (orientation:portrait)').matches;
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
      image.style.objectFit = portrait ? 'contain' : 'cover';
      image.style.objectPosition = 'center';
      image.style.transform = 'none';
      image.style.animation = 'none';
      image.style.opacity = '1';
    };
    setVisualSize();

    let progress = 0;
    let imageReady = image.complete && image.naturalWidth > 0;
    let domReady = document.readyState !== 'loading';
    let finishing = false;
    const startedAt = performance.now();
    const MIN_MS = 900;
    const MAX_MS = 3500;

    const setProgress = (value, text) => {
      progress = Math.max(progress, Math.min(100, Math.round(value)));
      bar.style.width = `${progress}%`;
      pct.textContent = `${progress}%`;
      if (text) label.textContent = text;
    };

    const animateTo = (target, text) => new Promise(resolve => {
      if (target <= progress) {
        setProgress(target, text);
        resolve();
        return;
      }
      const from = progress;
      const started = performance.now();
      const duration = Math.max(160, Math.min(500, (target - from) * 8));
      const step = () => {
        const t = Math.min(1, (performance.now() - started) / duration);
        const eased = t * (2 - t);
        setProgress(from + (target - from) * eased, text);
        if (t < 1) window.setTimeout(step, 32);
        else resolve();
      };
      window.setTimeout(step, 0);
    });

    const release = async reason => {
      if (finishing || !document.body.contains(splash)) return;
      finishing = true;
      await animateTo(100, 'READY');
      splash.setAttribute('aria-busy', 'false');
      splash.classList.add('is-hidden');
      window.setTimeout(() => splash.remove(), 450);
      window.dispatchEvent(new CustomEvent('relay:splash-released', { detail: { reason } }));
    };

    const tryRelease = reason => {
      if (finishing || !domReady || !imageReady) return;
      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_MS) {
        window.setTimeout(() => tryRelease(reason), MIN_MS - elapsed);
        return;
      }
      release(reason);
    };

    const markImageReady = () => {
      if (imageReady) return;
      imageReady = true;
      animateTo(42, 'LOADING INTERFACE').then(() => tryRelease('image-and-dom-ready'));
    };

    if (imageReady) setProgress(34, 'LOADING INTERFACE');
    else {
      image.addEventListener('load', markImageReady, { once: true });
      image.addEventListener('error', () => {
        imageReady = true;
        setProgress(30, 'SAFE MODE');
        tryRelease('image-error-safe-mode');
      }, { once: true });
    }

    if (!domReady) {
      document.addEventListener('DOMContentLoaded', () => {
        domReady = true;
        animateTo(68, 'STARTING HOME').then(() => tryRelease('dom-ready'));
      }, { once: true });
    } else {
      animateTo(68, 'STARTING HOME');
    }

    window.setTimeout(() => {
      if (finishing) return;
      release('hard-failsafe');
    }, MAX_MS);

    const updateSizing = () => {
      if (!finishing) setVisualSize();
    };
    window.addEventListener('resize', updateSizing, { passive: true });
    window.matchMedia('(orientation: landscape)').addEventListener?.('change', updateSizing);

    setProgress(8, 'INITIALIZING RELAY');
    window.setTimeout(() => { if (!finishing) setProgress(20, 'LOADING INTERFACE'); }, 180);
    window.setTimeout(() => { if (!finishing) setProgress(42, 'LOADING GAME SYSTEMS'); }, 420);
    window.setTimeout(() => { if (!finishing) setProgress(68, 'STARTING HOME'); }, 680);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
