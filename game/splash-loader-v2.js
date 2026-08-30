/* Relay Runner Home-first splash loader V8.
 * Home boot is independent from gameplay readiness.
 * `window.strideReady` belongs to mission/gameplay startup and must never block Home.
 */
(() => {
  'use strict';

  if (window.__relaySplashV8) return;
  window.__relaySplashV8 = true;

  const boot = () => {
    const splash = document.querySelector('.relay-splash') || document.getElementById('relaySplash');
    if (!splash) return;

    const image = splash.querySelector('.relay-splash-art, #relaySplashArt');
    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');
    if (!image || !bar || !pct || !label) return;

    const portrait = () => window.matchMedia('(max-width:700px) and (orientation:portrait)').matches;

    const applyArtworkSizing = () => {
      image.style.display = 'block';
      image.style.position = 'absolute';
      image.style.inset = '0';
      image.style.width = '100%';
      image.style.height = '100%';
      image.style.maxWidth = '100%';
      image.style.maxHeight = '100%';
      image.style.objectFit = portrait() ? 'contain' : 'cover';
      image.style.objectPosition = 'center';
      image.style.transform = 'none';
      image.style.animation = 'none';
      image.style.opacity = '1';
    };

    applyArtworkSizing();

    let progress = 0;
    let imageReady = image.complete && image.naturalWidth > 0;
    let homeReady = false;
    let finishing = false;
    let failed = false;
    let animationFrame = 0;
    let finishTimer = 0;
    let timeoutTimer = 0;

    const startedAt = performance.now();
    const MIN_VISIBLE_MS = 320;
    const MAX_HOME_BOOT_MS = 12000;

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
      const duration = Math.max(120, Math.min(420, (target - from) * 5));

      const frame = now => {
        if (finishing || failed) {
          resolve();
          return;
        }
        const t = Math.min(1, (now - started) / duration);
        const eased = t * (2 - t);
        setProgress(from + (target - from) * eased, text);
        if (t < 1) {
          animationFrame = requestAnimationFrame(frame);
        } else {
          animationFrame = 0;
          resolve();
        }
      };

      animationFrame = requestAnimationFrame(frame);
    });

    const cleanup = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (finishTimer) clearTimeout(finishTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      window.removeEventListener('resize', applyArtworkSizing);
      window.removeEventListener('relay:home-ready', markHomeReady);
      window.removeEventListener('error', onWindowError, true);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };

    const release = async reason => {
      if (finishing || failed || !document.body.contains(splash)) return;
      finishing = true;
      cleanup();

      await animateTo(100, 'READY');

      if (!document.body.contains(splash)) return;
      splash.setAttribute('aria-busy', 'false');
      splash.classList.add('is-hidden');
      finishTimer = window.setTimeout(() => splash.remove(), 450);
      window.dispatchEvent(new CustomEvent('relay:splash-released', {
        detail: { reason, homeReady: true }
      }));
    };

    const showFailure = reason => {
      if (finishing || failed || !document.body.contains(splash)) return;
      failed = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (finishTimer) clearTimeout(finishTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);

      setProgress(99, 'STARTUP INTERRUPTED');
      pct.textContent = '—';

      let message = splash.querySelector('[data-relay-loader-message]');
      if (!message) {
        message = document.createElement('p');
        message.dataset.relayLoaderMessage = '';
        Object.assign(message.style, {
          margin: '12px auto 0',
          maxWidth: '520px',
          padding: '0 18px',
          textAlign: 'center',
          fontSize: '12px',
          lineHeight: '1.5',
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          opacity: '.78'
        });
        splash.querySelector('.relay-splash-ui')?.appendChild(message);
      }

      message.textContent = reason === 'home-timeout'
        ? 'The Home interface did not finish starting.'
        : 'The game hit a startup error before Home was ready.';

      let retry = splash.querySelector('[data-relay-loader-retry]');
      if (!retry) {
        retry = document.createElement('button');
        retry.type = 'button';
        retry.dataset.relayLoaderRetry = '';
        retry.textContent = 'RETRY LOAD';
        Object.assign(retry.style, {
          display: 'block',
          margin: '16px auto 0',
          minWidth: '150px',
          padding: '10px 18px',
          border: '1px solid rgba(56,189,248,.8)',
          borderRadius: '8px',
          background: 'rgba(3,12,24,.95)',
          color: 'inherit',
          font: 'inherit',
          fontWeight: '800',
          letterSpacing: '.12em',
          cursor: 'pointer'
        });
        retry.addEventListener('click', () => window.location.reload());
        splash.querySelector('.relay-splash-ui')?.appendChild(retry);
      }

      console.error('[Relay Runner] Home startup failed:', reason, window.relayLastRuntimeError || 'unknown');
    };

    const onWindowError = event => {
      if (event.target === window || finishing || failed) return;
      // Resource errors are non-fatal here; Home can still boot.
    };

    const onUnhandledRejection = event => {
      if (finishing || failed) return;
      console.warn('[Relay Runner] Non-blocking startup rejection before Home:', event.reason);
    };

    const markImageReady = () => {
      if (imageReady || failed) return;
      imageReady = true;
      applyArtworkSizing();
      void animateTo(32, 'LOADING ARTWORK').then(checkHomeReady);
    };

    const markHomeReady = () => {
      if (homeReady || finishing || failed) return;
      homeReady = true;
      void animateTo(88, 'HOME READY').then(checkHomeReady);
    };

    const checkHomeReady = () => {
      if (finishing || failed || !imageReady || !homeReady) return;

      const elapsed = performance.now() - startedAt;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.clearTimeout(finishTimer);
      finishTimer = window.setTimeout(() => {
        void release('home-ready');
      }, wait);
    };

    const announceFromDom = () => {
      if (homeReady || finishing || failed) return;

      const intro = document.getElementById('intro');
      const game = document.getElementById('game');
      const phaserHost = document.getElementById('phaser-game');
      const hasHome = Boolean(intro || game || phaserHost);

      // Main application is a module; by the time DOMContentLoaded runs the Home
      // shell exists. We only require the shell, never RunnerScene/strideReady.
      if (hasHome) markHomeReady();
    };

    // Explicit integration point for main.js / future boot code.
    window.addEventListener('relay:home-ready', markHomeReady);
    window.addEventListener('resize', applyArtworkSizing, { passive: true });
    window.addEventListener('error', onWindowError, true);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    setProgress(8, 'INITIALIZING RELAY');

    if (imageReady) {
      setProgress(32, 'LOADING ARTWORK');
    } else {
      image.addEventListener('load', markImageReady, { once: true });
      image.addEventListener('error', markImageReady, { once: true });
    }

    const homePoll = () => {
      if (homeReady || finishing || failed) return;
      announceFromDom();
      if (!homeReady) window.setTimeout(homePoll, 50);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        announceFromDom();
        homePoll();
      }, { once: true });
    } else {
      announceFromDom();
      homePoll();
    }

    timeoutTimer = window.setTimeout(() => {
      if (finishing || failed || homeReady) return;
      announceFromDom();
      if (!homeReady) showFailure('home-timeout');
    }, MAX_HOME_BOOT_MS);

    checkHomeReady();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();