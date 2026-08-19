// Keeps the mobile viewport, Phaser canvas and DOM HUD synchronized after
// portrait/landscape rotation. Mobile browsers can emit resize/orientation
// events while the visual viewport is still settling; Phaser may otherwise
// capture an intermediate size and remain visually compressed until refresh.

const isMobileViewport = () => {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const narrow = Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 900;
  return coarse || narrow;
};

const getViewportSize = () => {
  const vv = window.visualViewport;
  const width = Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 0);
  const height = Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 0);
  return { width, height };
};

const getLayoutSize = () => {
  const play = document.getElementById('play');
  if (!play) return null;
  const rect = play.getBoundingClientRect();
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
};

let settleToken = 0;
let lastApplied = '';
let running = false;

const waitFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

async function waitForStableViewport(token) {
  let previous = null;
  let stableFrames = 0;

  for (let i = 0; i < 12; i += 1) {
    await waitFrame();
    if (token !== settleToken) return null;

    const viewport = getViewportSize();
    const layout = getLayoutSize();
    const current = `${viewport.width}x${viewport.height}|${layout?.width || 0}x${layout?.height || 0}`;

    if (current === previous) stableFrames += 1;
    else stableFrames = 0;

    previous = current;

    // Two consecutive identical frames means the browser layout has settled.
    if (stableFrames >= 2 && viewport.width > 0 && viewport.height > 0) {
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
    const key = `${width}x${height}|${layout?.width || 0}x${layout?.height || 0}`;

    // Avoid causing another resize loop when nothing actually changed.
    if (key === lastApplied && reason !== 'orientationchange') return;
    lastApplied = key;

    // Make the final viewport available to CSS without replacing its normal
    // responsive rules. This is useful for debugging and safe-area-aware UI.
    document.documentElement.style.setProperty('--relay-viewport-width', `${width}px`);
    document.documentElement.style.setProperty('--relay-viewport-height', `${height}px`);
    document.documentElement.dataset.relayOrientation = width >= height ? 'landscape' : 'portrait';

    // Phaser Scale.RESIZE listens to the browser resize event. Dispatch only
    // after the viewport has settled so Phaser receives the final dimensions,
    // not one of the transient rotation dimensions.
    window.dispatchEvent(new Event('resize'));

    // A second frame catches mobile browsers that finalize the visual viewport
    // immediately after the first resize notification.
    await waitFrame();
    if (token !== settleToken) return;
    window.dispatchEvent(new Event('resize'));

    document.dispatchEvent(new CustomEvent('relay:viewport-settled', {
      detail: {
        reason,
        width,
        height,
        orientation: width >= height ? 'landscape' : 'portrait',
      },
    }));
  } finally {
    if (token === settleToken) running = false;
  }
}

const schedule = reason => {
  requestAnimationFrame(() => syncViewport(reason));
};

window.addEventListener('orientationchange', () => schedule('orientationchange'), { passive: true });
window.addEventListener('resize', () => {
  // Ignore our own synthetic resize events while the controller is already
  // applying a settled size; real browser resize events still restart settling.
  if (!running) schedule('resize');
}, { passive: true });
window.visualViewport?.addEventListener('resize', () => schedule('visualViewport.resize'), { passive: true });

// Initial mobile boot: ensure the game gets one settled viewport pass even
// when it was loaded directly in landscape.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => schedule('initial'), { once: true });
} else {
  schedule('initial');
}
