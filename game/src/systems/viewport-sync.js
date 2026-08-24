// Lightweight mobile viewport synchronization.
// Phaser owns canvas sizing; this module only publishes the settled viewport
// dimensions and emits one final resize notification per browser change.

const isMobileViewport = () => {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const narrow = Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 900;
  return coarse || narrow;
};

const getViewportSize = () => {
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 0),
    height: Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 0),
  };
};

let frameId = 0;
let timerId = 0;
let applying = false;
let lastApplied = '';

const applyViewport = reason => {
  frameId = 0;
  if (!isMobileViewport()) return;

  const { width, height } = getViewportSize();
  if (!width || !height) return;

  const key = `${width}x${height}`;
  if (key === lastApplied && reason !== 'orientationchange') return;
  lastApplied = key;

  document.documentElement.style.setProperty('--relay-viewport-width', `${width}px`);
  document.documentElement.style.setProperty('--relay-viewport-height', `${height}px`);
  document.documentElement.dataset.relayOrientation = width >= height ? 'landscape' : 'portrait';

  applying = true;
  window.dispatchEvent(new Event('resize'));
  applying = false;

  document.dispatchEvent(new CustomEvent('relay:viewport-settled', {
    detail: { reason, width, height, orientation: width >= height ? 'landscape' : 'portrait' },
  }));
};

const schedule = (reason = 'resize') => {
  window.clearTimeout(timerId);
  timerId = window.setTimeout(() => {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => applyViewport(reason));
  }, 60);
};

window.addEventListener('orientationchange', () => schedule('orientationchange'), { passive: true });
window.addEventListener('resize', () => {
  if (!applying) schedule('resize');
}, { passive: true });
window.visualViewport?.addEventListener('resize', () => schedule('visualViewport.resize'), { passive: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => schedule('initial'), { once: true });
} else {
  schedule('initial');
}
