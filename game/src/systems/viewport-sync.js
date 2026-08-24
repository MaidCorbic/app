// Lightweight mobile viewport sync.
// It coalesces resize/orientation bursts and performs at most one measurement per burst.
const isMobileViewport = () => {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const narrow = Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 900;
  return coarse || narrow;
};

const readViewport = () => {
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 0),
    height: Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 0),
  };
};

let scheduled = false;
let lastApplied = '';
let timer = 0;

const applyViewport = reason => {
  scheduled = false;
  if (!isMobileViewport()) return;

  const { width, height } = readViewport();
  if (width <= 0 || height <= 0) return;

  const orientation = width >= height ? 'landscape' : 'portrait';
  const key = `${width}x${height}|${orientation}`;
  if (key === lastApplied) return;
  lastApplied = key;

  document.documentElement.style.setProperty('--relay-viewport-width', `${width}px`);
  document.documentElement.style.setProperty('--relay-viewport-height', `${height}px`);
  document.documentElement.dataset.relayOrientation = orientation;

  document.dispatchEvent(new CustomEvent('relay:viewport-settled', {
    detail: { reason, width, height, orientation },
  }));
};

const schedule = reason => {
  if (scheduled) return;
  scheduled = true;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => applyViewport(reason), 80);
};

window.addEventListener('orientationchange', () => schedule('orientationchange'), { passive: true });
window.addEventListener('resize', () => schedule('resize'), { passive: true });
window.visualViewport?.addEventListener('resize', () => schedule('visualViewport.resize'), { passive: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => applyViewport('initial'), { once: true });
} else {
  applyViewport('initial');
}
