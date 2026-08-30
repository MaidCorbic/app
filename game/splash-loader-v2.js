/* Production gameplay boot splash — one owner, real readiness signals. */
(() => {
  'use strict';

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

    const isPortrait = () => window.matchMedia('(max-width:700px) and (orientation:portrait)').matches;
    const applyArtworkSizing = () => {
      image.style.display = 'block';
      image.style.position = 'absolute';
      image.style.inset = '0';
      image.style.width = '100%';
      image.style.height = '100%';
      image.style.maxWidth = '100%';
      image.style.maxHeight = '100%';
      image.style.objectFit = isPortrait() ? 'contain' : 'cover';
      image.style.objectPosition = 'center';
      image.style.transform = 'none';
      image.style.animation = 'none';
      image.style.opacity = '1';
    };

    applyArtworkSizing();

    let progress = 0;
    let imageReady = image.complete && image.naturalWidth > 0;
    let pageLoaded = document.readyState === 'complete';
    let gameplayReady = Boolean(window.strideReady);
    let finishing = false;
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
      const duration = Math.max(120, Math.min(420, (target - from) * 6));
      const frame = now => {
        const t = Math.min(1, (now - started) / duration);
        const eased = t * (2 - t);
        setProgress(from + (target - from) * eased, text);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
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

    const readiness = () => {
      // main.js sets strideReady only after RunnerScene emits runner-ready.
      // Because main.js calls launch(0, true) during boot, this means the
      // gameplay scene has completed its initial create/preparation pass
      // before the splash is allowed to disappear.
      gameplayReady = gameplayReady || Boolean(window.strideReady);
      return imageReady && pageLoaded && gameplayReady;
    };

    const tryRelease = () => {
      if (finishing || !readiness()) return;
      const elapsed = performance.now() - startedAt;
      const minVisibleMs = 220;
      if (elapsed < minVisibleMs) {
        window.setTimeout(tryRelease, minVisibleMs - elapsed);
        return;
      }
      release('gameplay-ready');
    };

    const markImageReady = () => {
      if (imageReady) return;
      imageReady = true;
      applyArtworkSizing();
      animateTo(25, 'LOADING ARTWORK').then(tryRelease);
    };

    if (imageReady) {
      setProgress(25, 'LOADING ARTWORK');
    } else {
      image.addEventListener('load', markImageReady, { once: true });
      image.addEventListener('error', () => {
        // Splash artwork is cosmetic. A missing image must never block gameplay.
        imageReady = true;
        setProgress(24, 'LOADING GAME');
        tryRelease();
      }, { once: true });
    }

    if (!pageLoaded) {
      window.addEventListener('load', () => {
        pageLoaded = true;
        animateTo(55, 'LOADING PAGE').then(tryRelease);
      }, { once: true, passive: true });
    } else {
      setProgress(55, 'LOADING PAGE');
    }

    const pollGameplayReady = () => {
      if (finishing) return;
      if (window.strideReady) {
        gameplayReady = true;
        animateTo(92, 'GAMEPLAY READY').then(tryRelease);
        return;
      }
      setProgress(Math.max(progress, 68), 'INITIALIZING GAMEPLAY');
      window.setTimeout(pollGameplayReady, 40);
    };

    if (gameplayReady) {
      animateTo(92, 'GAMEPLAY READY').then(tryRelease);
    } else {
      pollGameplayReady();
    }

    const updateSizing = () => {
      if (!finishing) applyArtworkSizing();
    };
    window.addEventListener('resize', updateSizing, { passive: true });
    window.matchMedia('(orientation: landscape)').addEventListener?.('change', updateSizing);

    // Emergency only: normal release always waits for the real gameplay signal.
    window.setTimeout(() => {
      if (finishing) return;
      if (window.strideReady) release('gameplay-ready-failsafe');
      else release('boot-failsafe');
    }, 10000);

    setProgress(8, 'INITIALIZING RELAY');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
