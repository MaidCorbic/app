(() => {
  'use strict';

  if (window.__relayCinematicSplashV9) return;
  window.__relayCinematicSplashV9 = true;

  const start = () => {
    const splash = document.getElementById('relaySplash');
    if (!splash) return;

    const style = document.getElementById('relay-splash-critical');
    const image = document.getElementById('relaySplashArt');
    const bar = splash.querySelector('.relay-splash-progress');
    const percent = splash.querySelector('.relay-splash-percent');
    const status = splash.querySelector('.relay-splash-status');
    if (!image || !bar || !percent || !status) return;

    // Full artwork stays visible on every aspect ratio. Never stretch or crop it.
    image.style.setProperty('width', 'auto', 'important');
    image.style.setProperty('height', 'auto', 'important');
    image.style.setProperty('max-width', '100%', 'important');
    image.style.setProperty('max-height', '100%', 'important');
    image.style.setProperty('object-fit', 'contain', 'important');
    image.style.setProperty('object-position', 'center', 'important');
    image.style.setProperty('aspect-ratio', 'auto', 'important');
    image.style.setProperty('position', 'relative', 'important');
    image.style.setProperty('z-index', '1', 'important');

    // On wide screens, fill the unused area with a subtle darkened version of
    // the same artwork. The foreground artwork remains completely visible.
    splash.style.setProperty('--relay-splash-image', "url('/game/assets/loading.jpg')");
    if (style && !style.textContent.includes('relay-splash-backdrop')) {
      style.textContent += `
        /* relay-splash-backdrop */
        #relaySplash::before{content:"";position:absolute;inset:-6%;z-index:0;background-image:var(--relay-splash-image);background-position:center;background-size:cover;background-repeat:no-repeat;filter:blur(22px);transform:scale(1.08);opacity:.28}
        #relaySplash::after{content:"";position:absolute;inset:0;z-index:0;background:radial-gradient(ellipse at center,transparent 28%,rgba(2,5,13,.62) 100%);pointer-events:none}
        #relaySplash .relay-splash-ui{z-index:3}
      `;
    }

    // Keep the known-good asset resolution unchanged.
    const imageUrl = new URL('./assets/loading.jpg', import.meta.url).href;
    if (image.getAttribute('src') !== imageUrl) image.src = imageUrl;

    let progress = 0;
    let imageReady = image.complete && image.naturalWidth > 0;
    let engineReady = false;
    let pageReady = document.readyState === 'complete';
    let finishing = false;
    const MIN_SPLASH_MS = 3000;
    const startedAt = performance.now();

    const setProgress = (value, label) => {
      progress = Math.max(progress, Math.min(100, Math.round(value)));
      bar.style.width = `${progress}%`;
      percent.textContent = `${progress}%`;
      if (label) status.textContent = label;
    };

    const animateTo = (target, label) => new Promise(resolve => {
      if (target <= progress) {
        setProgress(target, label);
        resolve();
        return;
      }
      const from = progress;
      const startTime = performance.now();
      const duration = Math.max(320, Math.min(1000, (target - from) * 15));
      const frame = now => {
        const t = Math.min(1, (now - startTime) / duration);
        setProgress(from + (target - from) * (t * (2 - t)), label);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

    const finish = async () => {
      if (finishing || !imageReady || !engineReady || !pageReady) return;
      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_SPLASH_MS) {
        window.setTimeout(finish, MIN_SPLASH_MS - elapsed);
        return;
      }
      finishing = true;
      await animateTo(100, 'READY');
      splash.setAttribute('aria-busy', 'false');
      splash.classList.add('is-leaving');
      window.setTimeout(() => {
        splash.remove();
        style?.remove();
      }, 550);
    };

    const onImageReady = async () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      imageReady = true;
      await animateTo(25, 'LOADING INTERFACE');
      finish();
    };

    if (imageReady) {
      setProgress(25, 'LOADING INTERFACE');
    } else {
      image.addEventListener('load', onImageReady, { once: true });
      image.addEventListener('error', () => {
        imageReady = false;
        status.textContent = 'SPLASH IMAGE FAILED';
        console.error('[Relay Runner] Splash image failed to load:', imageUrl);
      }, { once: true });
    }

    const onDomReady = () => animateTo(45, 'LOADING GAME SYSTEMS');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDomReady, { once: true });
    } else {
      onDomReady();
    }

    if (!pageReady) {
      window.addEventListener('load', () => {
        pageReady = true;
        animateTo(65, 'STARTING WORLD').then(finish);
      }, { once: true });
    } else {
      setProgress(65, 'STARTING WORLD');
    }

    const checkEngine = () => {
      const canvas = document.querySelector('#phaser-game canvas');
      if (canvas) {
        engineReady = true;
        animateTo(92, 'PREPARING HOME').then(finish);
        return;
      }
      window.setTimeout(checkEngine, 50);
    };
    checkEngine();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
