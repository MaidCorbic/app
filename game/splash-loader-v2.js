/* Production cinematic splash V4. Owns first-load presentation and fails open safely. */
(() => {
  if (window.__relaySplashV4) return;
  window.__relaySplashV4 = true;

  const boot = () => {
    document.getElementById('bootLoader')?.remove();
    const splash = document.querySelector('.relay-splash') || document.getElementById('relaySplash');
    if (!splash) return;

    if (!splash.classList.contains('relay-splash')) splash.classList.add('relay-splash');

    if (!document.querySelector('link[data-relay-cinematic-v4]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = './cinematic-splash.css';
      css.dataset.relayCinematicV4 = 'true';
      document.head.appendChild(css);
    }

    const image = splash.querySelector('.relay-splash-art, #relaySplashArt');
    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');
    if (!image || !bar || !pct || !label) return;

    let progress = 0;
    let imageReady = image.complete && image.naturalWidth > 0;
    let pageReady = document.readyState === 'complete';
    let engineReady = false;
    let finishing = false;
    const MIN_SPLASH_MS = 600;
    const startedAt = performance.now();

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
      const duration = Math.max(140, Math.min(500, (target - from) * 8));
      const frame = now => {
        const t = Math.min(1, (now - started) / duration);
        setProgress(from + (target - from) * (t * (2 - t)), text);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

    const finish = async () => {
      if (finishing || !imageReady || !pageReady || !engineReady) return;
      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_SPLASH_MS) {
        window.setTimeout(finish, MIN_SPLASH_MS - elapsed);
        return;
      }
      finishing = true;
      await animateTo(100, 'READY');
      splash.setAttribute('aria-busy', 'false');
      splash.classList.add('is-hidden');
      window.setTimeout(() => splash.remove(), 350);
    };

    const markImageReady = () => {
      if (imageReady) return;
      imageReady = true;
      animateTo(26, 'LOADING INTERFACE').then(finish);
    };

    if (imageReady) setProgress(26, 'LOADING INTERFACE');
    else {
      image.addEventListener('load', markImageReady, { once: true });
      image.addEventListener('error', () => {
        imageReady = true;
        setProgress(22, 'SAFE MODE');
        finish();
      }, { once: true });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => animateTo(48, 'LOADING GAME SYSTEMS'), { once: true });
    } else {
      animateTo(48, 'LOADING GAME SYSTEMS');
    }

    if (!pageReady) {
      window.addEventListener('load', () => {
        pageReady = true;
        animateTo(68, 'CONNECTING WORLD').then(finish);
      }, { once: true });
    } else {
      setProgress(68, 'CONNECTING WORLD');
    }

    const checkEngine = () => {
      const canvas = document.querySelector('#phaserTitleRoot canvas, #phaser-game canvas');
      if (canvas) {
        engineReady = true;
        animateTo(86, 'STARTING HOME').then(finish);
        return;
      }
      if (!finishing) window.setTimeout(checkEngine, 50);
    };
    checkEngine();

    window.setTimeout(() => {
      if (finishing) return;
      imageReady = true;
      pageReady = true;
      engineReady = true;
      finish();
    }, 5000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();