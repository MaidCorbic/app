/* Production gameplay boot splash V7 — one owner, real gameplay readiness, safe recovery. */
(() => {
  'use strict';

  if (window.__relaySplashV7) return;
  window.__relaySplashV7 = true;

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
    let gameplayReady = Boolean(window.strideReady);
    let finishing = false;
    let failed = false;
    let pollTimer = 0;
    let timeoutTimer = 0;
    let animationFrame = 0;
    const startedAt = performance.now();
    const MIN_VISIBLE_MS = 220;
    const MAX_BOOT_MS = 20000;
    const RETRY_KEY = 'relay-runner-loader-retried';

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
      const duration = Math.max(140, Math.min(420, (target - from) * 6));
      const frame = now => {
        if (finishing || failed) return resolve();
        const t = Math.min(1, (now - started) / duration);
        const eased = t * (2 - t);
        setProgress(from + (target - from) * eased, text);
        if (t < 1) animationFrame = requestAnimationFrame(frame);
        else {
          animationFrame = 0;
          resolve();
        }
      };
      animationFrame = requestAnimationFrame(frame);
    });

    const updateSizing = () => {
      if (!finishing && !failed) applyArtworkSizing();
    };
    const mediaQuery = window.matchMedia('(orientation: landscape)');

    const cleanup = () => {
      if (pollTimer) window.clearTimeout(pollTimer);
      if (timeoutTimer) window.clearTimeout(timeoutTimer);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', updateSizing);
      mediaQuery.removeEventListener?.('change', updateSizing);
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
      window.setTimeout(() => splash.remove(), 450);
      window.dispatchEvent(new CustomEvent('relay:splash-released', { detail: { reason } }));
      try { sessionStorage.removeItem(RETRY_KEY); } catch {}
    };

    const showFailure = reason => {
      if (finishing || failed || !document.body.contains(splash)) return;
      failed = true;
      if (pollTimer) window.clearTimeout(pollTimer);
      if (timeoutTimer) window.clearTimeout(timeoutTimer);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      setProgress(99, 'STARTUP INTERRUPTED');
      pct.textContent = '—';
      splash.setAttribute('aria-busy', 'true');

      let message = splash.querySelector('[data-relay-loader-message]');
      if (!message) {
        message = document.createElement('p');
        message.dataset.relayLoaderMessage = '';
        Object.assign(message.style, {
          margin: '12px auto 0', maxWidth: '520px', padding: '0 18px', textAlign: 'center',
          fontSize: '12px', lineHeight: '1.5', letterSpacing: '.12em', textTransform: 'uppercase', opacity: '.78'
        });
        splash.querySelector('.relay-splash-ui')?.appendChild(message);
      }
      message.textContent = reason === 'boot-timeout'
        ? 'The gameplay engine did not finish starting.'
        : 'The game hit a startup error before gameplay was ready.';

      let retry = splash.querySelector('[data-relay-loader-retry]');
      if (!retry) {
        retry = document.createElement('button');
        retry.type = 'button';
        retry.dataset.relayLoaderRetry = '';
        retry.textContent = 'RETRY LOAD';
        Object.assign(retry.style, {
          display: 'block', margin: '16px auto 0', minWidth: '150px', padding: '10px 18px',
          border: '1px solid rgba(56,189,248,.8)', borderRadius: '8px', background: 'rgba(3,12,24,.95)',
          color: 'inherit', font: 'inherit', fontWeight: '800', letterSpacing: '.12em', cursor: 'pointer'
        });
        retry.addEventListener('click', () => {
          try { sessionStorage.removeItem(RETRY_KEY); } catch {}
          window.location.reload();
        });
        splash.querySelector('.relay-splash-ui')?.appendChild(retry);
      }

      console.error('[Relay Runner] Startup failed:', reason, window.relayLastRuntimeError || 'unknown');
    };

    const onWindowError = event => {
      if (event.target !== window || finishing || failed || gameplayReady) return;
      showFailure('runtime-error');
    };

    const onUnhandledRejection = event => {
      if (finishing || failed || gameplayReady) return;
      showFailure('unhandled-rejection');
    };

    const tryRelease = () => {
      if (finishing || failed) return;
      gameplayReady = gameplayReady || Boolean(window.strideReady);
      if (!imageReady || !gameplayReady) return;
      const elapsed = performance.now() - startedAt;
      if (elapsed < MIN_VISIBLE_MS) {
        window.setTimeout(tryRelease, MIN_VISIBLE_MS - elapsed);
        return;
      }
      void release('gameplay-ready');
    };

    const markImageReady = () => {
      if (imageReady || failed) return;
      imageReady = true;
      applyArtworkSizing();
      void animateTo(30, 'LOADING ARTWORK').then(tryRelease);
    };

    window.addEventListener('resize', updateSizing, { passive: true });
    mediaQuery.addEventListener?.('change', updateSizing);
    window.addEventListener('error', onWindowError, true);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    setProgress(8, 'INITIALIZING RELAY');

    if (imageReady) {
      setProgress(30, 'LOADING ARTWORK');
    } else {
      image.addEventListener('load', markImageReady, { once: true });
      image.addEventListener('error', markImageReady, { once: true });
    }

    const initialRuntimeError = window.relayLastRuntimeError;
    if (initialRuntimeError && !gameplayReady) {
      showFailure('runtime-error');
      return;
    }

    const pollGameplayReady = () => {
      if (finishing || failed) return;
      if (window.relayLastRuntimeError && !window.strideReady) {
        showFailure('runtime-error');
        return;
      }
      if (window.strideReady) {
        gameplayReady = true;
        void animateTo(92, 'GAMEPLAY READY').then(tryRelease);
        return;
      }
      setProgress(Math.max(progress, 65), 'LOADING GAMEPLAY');
      pollTimer = window.setTimeout(pollGameplayReady, 80);
    };

    if (gameplayReady) {
      void animateTo(92, 'GAMEPLAY READY').then(tryRelease);
    } else {
      pollGameplayReady();
    }

    timeoutTimer = window.setTimeout(() => {
      if (finishing || failed) return;
      if (window.strideReady) {
        gameplayReady = true;
        tryRelease();
        return;
      }
      let retried = false;
      try { retried = sessionStorage.getItem(RETRY_KEY) === '1'; } catch {}
      if (!retried) {
        try { sessionStorage.setItem(RETRY_KEY, '1'); } catch {}
        window.location.reload();
        return;
      }
      showFailure('boot-timeout');
    }, MAX_BOOT_MS);

    tryRelease();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
