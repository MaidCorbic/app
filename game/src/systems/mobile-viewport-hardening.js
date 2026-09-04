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

if (mobile()) {
  const root = document.documentElement;
  let timer = 0;
  let raf1 = 0;
  let raf2 = 0;
  let syncing = false;
  let lastKey = '';

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
