(() => {
  'use strict';

  if (window.__relayCinematicSplashV11) return;
  window.__relayCinematicSplashV11 = true;

  const start = () => {
    const splash = document.getElementById('relaySplash');
    if (!splash) return;

    const style = document.getElementById('relay-splash-critical');
    const image = document.getElementById('relaySplashArt');
    const picture = document.getElementById('relaySplashPicture');
    const landscapeSource = picture?.querySelector('source');
    const bar = splash.querySelector('.relay-splash-progress');
    const percent = splash.querySelector('.relay-splash-percent');
    const status = splash.querySelector('.relay-splash-status');
    if (!image || !bar || !percent || !status) return;

    const portraitUrl = new URL('./assets/loading.jpg', import.meta.url).href;
    const landscapeUrl = new URL('./assets/loading-landscape.jpg', import.meta.url).href;
    const isLandscape = () => window.matchMedia('(orientation: landscape)').matches;
    const isMobilePortrait = () => !isLandscape() && window.matchMedia('(max-width: 700px)').matches;

    const selectArtwork = () => {
      const targetUrl = isLandscape() ? landscapeUrl : portraitUrl;
      if (landscapeSource) landscapeSource.srcset = landscapeUrl;
      if (image.getAttribute('src') !== targetUrl) image.src = targetUrl;
      splash.style.setProperty('--relay-splash-bg', `url("${targetUrl}")`);
    };

    const sizeArtwork = () => {
      // Portrait mobile: size from the image's intrinsic ratio so the ENTIRE artwork
      // remains visible. Do not force 100% width/height, which can make the preview
      // feel cropped on tall phone viewports.
      if (isMobilePortrait()) {
        image.style.width = 'auto';
        image.style.height = 'auto';
        image.style.maxWidth = '100vw';
        image.style.maxHeight = '100dvh';
      } else {
        image.style.width = '100%';
        image.style.height = '100%';
        image.style.maxWidth = '100%';
        image.style.maxHeight = '100%';
      }
      image.style.objectFit = 'contain';
      image.style.objectPosition = 'center';
    };

    selectArtwork();
    sizeArtwork();

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
      sizeArtwork();
      await animateTo(25, 'LOADING INTERFACE');
      finish();
    };

    if (imageReady) {
      sizeArtwork();
      setProgress(25, 'LOADING INTERFACE');
    } else {
      image.addEventListener('load', onImageReady, { once: true });
      image.addEventListener('error', () => {
        imageReady = false;
        console.error('[Relay Runner] Splash image failed to load.');
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

    const orientationQuery = window.matchMedia('(orientation: landscape)');
    const onOrientationChange = () => {
      if (finishing) return;
      imageReady = false;
      selectArtwork();
      sizeArtwork();
      image.addEventListener('load', onImageReady, { once: true });
    };
    orientationQuery.addEventListener?.('change', onOrientationChange);
    window.addEventListener('resize', sizeArtwork, { passive: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
