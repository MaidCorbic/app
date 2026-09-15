import './mobile-controls-bridge-v2.js';
import { RunnerScene } from '../scenes/RunnerScene.js';
import { installCharacterStateReactions } from './character-state-reactions-v1.js';

// Character reactions are a visual/state layer only. They observe the existing
// player physics state and never write velocity, acceleration, gravity, input,
// collision, or mobile/web movement values.
installCharacterStateReactions(RunnerScene);

// Mobile rotation hardening for Phaser + DOM layout.
//
// Phaser remains the only canvas-size authority via Phaser.Scale.RESIZE.
// CSS remains the DOM layout authority.
// This controller publishes settled viewport dimensions and triggers one
// synthetic resize after rotation. It never resizes #play or the canvas.

const mobile = () => {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const touch = Number(navigator.maxTouchPoints || 0) > 0;
  return coarse || touch || /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');
};

const syncViewportNow = () => {
  const root = document.documentElement;
  const vv = window.visualViewport;
  const width = Math.max(1, Math.round(vv?.width || window.innerWidth || root.clientWidth || 1));
  const height = Math.max(1, Math.round(vv?.height || window.innerHeight || root.clientHeight || 1));
  root.style.setProperty('--relay-viewport-width', width + 'px');
  root.style.setProperty('--relay-viewport-height', height + 'px');
  root.style.setProperty('--relay-vw', width + 'px');
  root.style.setProperty('--relay-vh', height + 'px');
  root.dataset.relayOrientation = width >= height ? 'landscape' : 'portrait';
  return { width, height };
};

if (mobile()) {
  const root = document.documentElement;
  let timer = 0;
  let raf1 = 0;
  let raf2 = 0;
  let syncing = false;
  let lastKey = '';

  // Do this synchronously instead of waiting for DOMContentLoaded. On mobile
  // browsers the first layout can otherwise happen with stale viewport units.
  syncViewportNow();

  const measure = () => {
    const vv = window.visualViewport;
    const width = Math.max(1, Math.round(window.innerWidth || root.clientWidth || vv?.width || 1));
    const height = Math.max(1, Math.round(window.innerHeight || root.clientHeight || vv?.height || 1));
    return { width, height };
  };

  const apply = (reason = 'resize') => {
    const { width, height } = measure();
    const orientation = width >= height ? 'landscape' : 'portrait';
    const key = width + 'x' + height + '|' + orientation;
    if (key === lastKey && reason !== 'orientationchange') return;
    lastKey = key;

    root.style.setProperty('--relay-viewport-width', width + 'px');
    root.style.setProperty('--relay-viewport-height', height + 'px');
    root.style.setProperty('--relay-vw', width + 'px');
    root.style.setProperty('--relay-vh', height + 'px');
    root.dataset.relayOrientation = orientation;

    syncing = true;
    window.dispatchEvent(new Event('resize'));
    requestAnimationFrame(() => { syncing = false; });

    document.dispatchEvent(new CustomEvent('relay:viewport-settled', {
      detail: { reason, width, height, orientation }
    }));
  };

  const schedule = (reason = 'resize') => {
    if (syncing) return;
    window.clearTimeout(timer);
    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);
    timer = window.setTimeout(() => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => apply(reason));
      });
    }, 120);
  };

  window.addEventListener('orientationchange', () => schedule('orientationchange'), { passive: true });
  window.addEventListener('resize', () => {
    if (!syncing) schedule('resize');
  }, { passive: true });
  window.visualViewport?.addEventListener('resize', () => schedule('visualViewport.resize'), { passive: true });
  window.addEventListener('pageshow', () => schedule('pageshow'), { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => schedule('initial'), { once: true });
  } else {
    schedule('initial');
  }
}

// Portrait boot safety net.
//
// splash-loader-v2.js normally closes the splash after image + page + Phaser
// readiness. Some mobile browsers can deliver viewport/load events in a
// different order, leaving the splash waiting even though Phaser already has
// a live canvas. Do not alter Phaser or its sizing here. We only fail open
// when a real Phaser canvas exists, so the game underneath is known to be
// mounted. This preserves the normal splash path and only repairs a stuck
// mobile presentation layer.
(() => {
  if (!mobile()) return;

  const bootStarted = performance.now();
  const MIN_SPLASH_MS = 2200;
  let closed = false;
  let timer = 0;

  const closeStuckSplash = (reason = 'mobile-canvas-ready') => {
    if (closed) return;
    const splash = document.getElementById('relaySplash') || document.querySelector('.relay-splash');
    const canvas = document.querySelector('#phaser-game canvas');
    if (!splash || !canvas) return false;

    const elapsed = performance.now() - bootStarted;
    if (elapsed < MIN_SPLASH_MS) return false;

    closed = true;
    splash.setAttribute('aria-busy', 'false');
    splash.dataset.relaySplashFailOpen = reason;
    splash.classList.add('is-hidden');
    window.clearTimeout(timer);
    window.setTimeout(() => splash.remove(), 700);
    return true;
  };

  const check = () => {
    if (closed) return;
    if (!closeStuckSplash()) timer = window.setTimeout(check, 120);
  };

  const start = () => {
    syncViewportNow();
    timer = window.setTimeout(check, MIN_SPLASH_MS);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
