/*
 * RUNNER RELAY — SPLASH V5
 *
 * Single-owner, fail-open boot presentation.
 * It never blocks gameplay startup: the splash waits for the image,
 * page load and Phaser canvas when available, but always releases itself
 * after a hard timeout.
 */
(() => {
  'use strict';

  if (window.__relaySplashV5) return;
  window.__relaySplashV5 = true;

  const runtime = {
    splash: null,
    image: null,
    bar: null,
    percent: null,
    status: null,
    startedAt: performance.now(),
    progress: 0,
    imageReady: false,
    pageReady: document.readyState === 'complete',
    engineReady: false,
    done: false,
    raf: 0,
    finishTimer: 0,
    pollTimer: 0,
  };

  const LIMITS = Object.freeze({
    minimumMs: 1800,
    maximumMs: 6500,
    pollMs: 60,
    fadeMs: 520,
  });

  const qs = (root, selector) => {
    if (!root || typeof root.querySelector !== 'function') return null;
    try {
      return root.querySelector(selector);
    } catch {
      return null;
    }
  };

  const setStatus = text => {
    if (runtime.status) runtime.status.textContent = String(text || 'LOADING');
  };

  const setProgress = value => {
    const next = Math.max(runtime.progress, Math.min(100, Math.round(Number(value) || 0)));
    runtime.progress = next;
    if (runtime.bar) runtime.bar.style.width = `${next}%`;
    if (runtime.percent) runtime.percent.textContent = `${next}%`;

    if (next >= 100) setStatus('READY');
    else if (next >= 88) setStatus('FINALIZING RELAY');
    else if (next >= 72) setStatus('PREPARING HOME');
    else if (next >= 52) setStatus('STARTING WORLD');
    else if (next >= 32) setStatus('LOADING GAME SYSTEMS');
    else if (next >= 14) setStatus('LOADING INTERFACE');
    else setStatus('INITIALIZING RELAY');
  };

  const animateTo = target => {
    if (runtime.done) return Promise.resolve();
    const end = Math.max(runtime.progress, Math.min(100, Number(target) || 0));
    if (end <= runtime.progress) {
      setProgress(end);
      return Promise.resolve();
    }

    const from = runtime.progress;
    const started = performance.now();
    const duration = Math.max(180, Math.min(720, (end - from) * 10));

    return new Promise(resolve => {
      const frame = now => {
        if (runtime.done) {
          resolve();
          return;
        }
        const t = Math.min(1, (now - started) / duration);
        const eased = t * (2 - t);
        setProgress(from + (end - from) * eased);
        if (t < 1) runtime.raf = requestAnimationFrame(frame);
        else resolve();
      };
      runtime.raf = requestAnimationFrame(frame);
    });
  };

  const release = async reason => {
    if (runtime.done) return;
    const elapsed = performance.now() - runtime.startedAt;
    if (elapsed < LIMITS.minimumMs && reason !== 'timeout') {
      window.clearTimeout(runtime.finishTimer);
      runtime.finishTimer = window.setTimeout(() => release(reason), LIMITS.minimumMs - elapsed);
      return;
    }

    runtime.done = true;
    window.clearTimeout(runtime.finishTimer);
    window.clearTimeout(runtime.pollTimer);
    if (runtime.raf) cancelAnimationFrame(runtime.raf);

    try {
      await animateTo(100);
    } catch {}

    const splash = runtime.splash;
    if (!splash) return;

    splash.classList.add('is-hidden');
    splash.setAttribute('aria-hidden', 'true');
    splash.setAttribute('aria-busy', 'false');
    splash.dataset.relaySplashRelease = reason || 'ready';

    window.setTimeout(() => {
      try { splash.remove(); } catch {}
    }, LIMITS.fadeMs);
  };

  const checkReady = () => {
    if (runtime.done) return;

    const canvas = qs(document, '#phaser-game canvas');
    if (canvas) runtime.engineReady = true;

    if (runtime.imageReady) animateTo(24);
    if (runtime.pageReady) animateTo(48);
    if (runtime.engineReady) animateTo(88);

    if (runtime.imageReady && runtime.pageReady && runtime.engineReady) {
      release('ready');
      return;
    }

    if (performance.now() - runtime.startedAt >= LIMITS.maximumMs) {
      setStatus('READY');
      setProgress(100);
      release('timeout');
      return;
    }

    runtime.pollTimer = window.setTimeout(checkReady, LIMITS.pollMs);
  };

  const init = () => {
    const splash = document.getElementById('relaySplash') || document.querySelector('.relay-splash');
    if (!splash) return;

    runtime.splash = splash;
    runtime.image = qs(splash, '#relaySplashArt, .relay-splash-art');
    runtime.bar = qs(splash, '.relay-splash-progress');
    runtime.percent = qs(splash, '.relay-splash-percent');
    runtime.status = qs(splash, '.relay-splash-status');

    if (!runtime.image || !runtime.bar || !runtime.percent || !runtime.status) {
      try { splash.remove(); } catch {}
      return;
    }

    splash.classList.remove('is-hidden');
    splash.setAttribute('aria-hidden', 'false');
    splash.setAttribute('aria-busy', 'true');

    const resizeArtwork = () => {
      if (!runtime.image) return;
      const portrait = window.matchMedia('(max-width:700px) and (orientation:portrait)').matches;
      runtime.image.style.width = '100dvw';
      runtime.image.style.height = '100dvh';
      runtime.image.style.maxWidth = 'none';
      runtime.image.style.maxHeight = 'none';
      runtime.image.style.objectFit = portrait ? 'contain' : 'cover';
      runtime.image.style.objectPosition = 'center';
    };

    resizeArtwork();
    window.addEventListener('resize', resizeArtwork, { passive: true });

    const onImageReady = () => {
      if (!runtime.image?.naturalWidth) return;
      runtime.imageReady = true;
      resizeArtwork();
      animateTo(24);
    };

    if (runtime.image.complete && runtime.image.naturalWidth > 0) onImageReady();
    else runtime.image.addEventListener('load', onImageReady, { once: true });

    runtime.image.addEventListener('error', () => {
      console.warn('[Relay Runner] Splash artwork failed; continuing boot.');
      runtime.imageReady = true;
      animateTo(18);
    }, { once: true });

    const markPageReady = () => {
      runtime.pageReady = true;
      animateTo(48);
    };

    if (document.readyState === 'complete') markPageReady();
    else window.addEventListener('load', markPageReady, { once: true });

    setProgress(6);
    checkReady();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
