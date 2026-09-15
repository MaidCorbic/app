/*
 * RUNNER RELAY — SPLASH V6
 * Single owner. Passive presentation. Never blocks gameplay.
 */
(() => {
  'use strict';
  if (window.__relaySplashV6) return;

  const runtime = {
    splash: null, image: null, bar: null, percent: null, status: null,
    startedAt: performance.now(), progress: 0,
    imageReady: false, pageReady: document.readyState !== 'loading',
    engineReady: false, releasing: false, done: false,
    raf: 0, finishTimer: 0, pollTimer: 0,
  };

  const LIMITS = Object.freeze({ minimumMs: 1800, maximumMs: 6500, pollMs: 60, fadeMs: 520 });
  const qs = (root, selector) => {
    if (!root || typeof root.querySelector !== 'function') return null;
    try { return root.querySelector(selector); } catch { return null; }
  };
  const setStatus = text => { if (runtime.status) runtime.status.textContent = String(text || 'LOADING'); };
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
  const stopAnimation = () => { if (runtime.raf) { cancelAnimationFrame(runtime.raf); runtime.raf = 0; } };
  const animateTo = target => {
    if (runtime.done) return Promise.resolve();
    const end = Math.max(runtime.progress, Math.min(100, Number(target) || 0));
    if (end <= runtime.progress) { setProgress(end); return Promise.resolve(); }
    stopAnimation();
    const from = runtime.progress, started = performance.now();
    const duration = Math.max(180, Math.min(720, (end - from) * 10));
    return new Promise(resolve => {
      const frame = now => {
        if (runtime.done) { runtime.raf = 0; resolve(); return; }
        const t = Math.min(1, (now - started) / duration);
        setProgress(from + (end - from) * (t * (2 - t)));
        if (t < 1) runtime.raf = requestAnimationFrame(frame);
        else { runtime.raf = 0; resolve(); }
      };
      runtime.raf = requestAnimationFrame(frame);
    });
  };
  const release = async reason => {
    if (runtime.done || runtime.releasing) return;
    runtime.releasing = true;
    const elapsed = performance.now() - runtime.startedAt;
    if (elapsed < LIMITS.minimumMs && reason !== 'timeout' && reason !== 'error') {
      window.clearTimeout(runtime.finishTimer);
      runtime.finishTimer = window.setTimeout(() => { runtime.releasing = false; void release(reason); }, LIMITS.minimumMs - elapsed);
      return;
    }
    window.clearTimeout(runtime.finishTimer);
    window.clearTimeout(runtime.pollTimer);
    stopAnimation();
    try { await animateTo(100); } catch { setProgress(100); }
    runtime.done = true;
    runtime.releasing = false;
    stopAnimation();
    const splash = runtime.splash;
    if (!splash) return;
    splash.classList.add('is-hidden');
    splash.setAttribute('aria-hidden', 'true');
    splash.setAttribute('aria-busy', 'false');
    splash.dataset.relaySplashRelease = reason || 'ready';
    window.setTimeout(() => { try { splash.remove(); } catch {} }, LIMITS.fadeMs);
  };
  const updateReadiness = () => {
    if (runtime.done || runtime.releasing) return;
    if (qs(document, '#phaser-game canvas')) runtime.engineReady = true;
    let target = 6;
    if (runtime.imageReady) target = 24;
    if (runtime.pageReady) target = 48;
    if (runtime.engineReady) target = 88;
    setProgress(target);
    if (runtime.imageReady && runtime.pageReady && runtime.engineReady) { void release('ready'); return; }
    if (performance.now() - runtime.startedAt >= LIMITS.maximumMs) { void release('timeout'); return; }
    runtime.pollTimer = window.setTimeout(updateReadiness, LIMITS.pollMs);
  };
  const markPageReady = () => { if (runtime.done) return; runtime.pageReady = true; setProgress(48); updateReadiness(); };
  const init = () => {
    const splash = document.getElementById('relaySplash') || document.querySelector('.relay-splash');
    if (!splash) return;
    runtime.splash = splash;
    runtime.image = qs(splash, '#relaySplashArt, .relay-splash-art');
    runtime.bar = qs(splash, '.relay-splash-progress');
    runtime.percent = qs(splash, '.relay-splash-percent');
    runtime.status = qs(splash, '.relay-splash-status');
    if (!runtime.image || !runtime.bar || !runtime.percent || !runtime.status) { try { splash.remove(); } catch {} return; }
    splash.classList.remove('is-hidden');
    splash.setAttribute('aria-hidden', 'false');
    splash.setAttribute('aria-busy', 'true');
    const resizeArtwork = () => {
      if (!runtime.image) return;
      let portrait = false;
      try { portrait = window.matchMedia('(max-width:700px) and (orientation:portrait)').matches; } catch {}
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
      setProgress(24);
      updateReadiness();
    };
    if (runtime.image.complete && runtime.image.naturalWidth > 0) onImageReady();
    else runtime.image.addEventListener('load', onImageReady, { once: true });
    runtime.image.addEventListener('error', () => {
      console.warn('[Relay Runner] Splash artwork failed; continuing boot.');
      runtime.imageReady = true;
      setProgress(18);
      updateReadiness();
    }, { once: true });
    if (runtime.pageReady) setProgress(48);
    else {
      document.addEventListener('DOMContentLoaded', markPageReady, { once: true });
      window.addEventListener('load', markPageReady, { once: true });
    }
    window.addEventListener('error', event => {
      if (event?.target === runtime.image) return;
      void release('error');
    }, { once: true, capture: true });
    window.addEventListener('unhandledrejection', () => void release('error'), { once: true });
    setProgress(6);
    updateReadiness();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
