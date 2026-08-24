// Keeps the mobile viewport, Phaser canvas and DOM HUD synchronized after
// portrait/landscape rotation without feeding synthetic resize events back into
// another resize loop.

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

const getLayoutSize = () => {
  const play = document.getElementById('play');
  if (!play) return null;
  const rect = play.getBoundingClientRect();
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
};

let settleToken = 0;
let lastApplied = '';
let scheduled = false;
let running = false;
let pendingReason = '';

const waitFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

async function waitForStableViewport(token) {
  let previous = null;
  let stableFrames = 0;

  for (let i = 0; i < 8; i += 1) {
    await waitFrame();
    if (token !== settleToken) return null;

    const viewport = getViewportSize();
    const layout = getLayoutSize();
    const current = `${viewport.width}x${viewport.height}|${layout?.width || 0}x${layout?.height || 0}`;

    stableFrames = current === previous ? stableFrames + 1 : 0;
    previous = current;

    if (stableFrames >= 1 && viewport.width > 0 && viewport.height > 0) {
      return { viewport, layout };
    }
  }

  if (token !== settleToken) return null;
  return { viewport: getViewportSize(), layout: getLayoutSize() };
}

async function syncViewport(reason = 'resize') {
  if (!isMobileViewport()) return;

  const token = ++settleToken;
  running = true;

  try {
    const settled = await waitForStableViewport(token);
    if (!settled || token !== settleToken) return;

    const { width, height } = settled.viewport;
    const layout = settled.layout;
    if (width <= 0 || height <= 0) return;

    const key = `${width}x${height}|${layout?.width || 0}x${layout?.height || 0}`;
    if (key === lastApplied) return;
    lastApplied = key;

    document.documentElement.style.setProperty('--relay-viewport-width', `${width}px`);
    document.documentElement.style.setProperty('--relay-viewport-height', `${height}px`);
    document.documentElement.dataset.relayOrientation = width >= height ? 'landscape' : 'portrait';

    document.dispatchEvent(new CustomEvent('relay:viewport-settled', {
      detail: {
        reason,
        width,
        height,
        orientation: width >= height ? 'landscape' : 'portrait',
      },
    }));
  } finally {
    if (token === settleToken) {
      running = false;
      if (pendingReason) {
        const nextReason = pendingReason;
        pendingReason = '';
        schedule(nextReason);
      }
    }
  }
}

function schedule(reason) {
  if (running) {
    pendingReason = reason;
    return;
  }
  if (scheduled) {
    pendingReason = reason;
    return;
  }
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    const nextReason = pendingReason || reason;
    pendingReason = '';
    syncViewport(nextReason);
  });
}

window.addEventListener('orientationchange', () => schedule('orientationchange'), { passive: true });
window.addEventListener('resize', () => schedule('resize'), { passive: true });
window.visualViewport?.addEventListener('resize', () => schedule('visualViewport.resize'), { passive: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => schedule('initial'), { once: true });
} else {
  schedule('initial');
}
