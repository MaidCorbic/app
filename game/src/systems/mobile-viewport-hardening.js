// RELAY RUNNER — MOBILE VIEWPORT HARDENING V5
//
// Single responsibility:
// - detect real touch devices
// - keep the DOM game shell tied to the layout viewport
// - publish stable viewport CSS variables
// - recover Phaser RESIZE after Android rotation
// - publish relay:viewport-settled for existing UI listeners
//
// The previous version preferred visualViewport dimensions and deliberately
// avoided the resize notification Phaser needs after some Android rotations.
// V5 measures the actual game shell with ResizeObserver, waits for two stable
// animation frames, then asks Phaser's normal RESIZE listener to refresh.
// It never writes a canvas width/height and never uses 100dvw/100dvh as the
// application's primary shell size.

'use strict';

const isMobileDevice = () => {
  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches === true;
  const touchPoints = Number(navigator.maxTouchPoints || 0) > 0;
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(
    navigator.userAgent || ''
  );
  return coarsePointer || touchPoints || mobileUserAgent;
};

const getLayoutViewport = () => {
  const root = document.documentElement;
  const width = Math.max(1, Math.round(root.clientWidth || window.innerWidth || 1));
  const height = Math.max(1, Math.round(root.clientHeight || window.innerHeight || 1));
  return {
    width,
    height,
    orientation: width >= height ? 'landscape' : 'portrait',
  };
};

const getGameShellSize = () => {
  const game = document.getElementById('game');
  const play = document.getElementById('play');
  const host = document.getElementById('phaser-game');
  const element = host || play || game;
  if (!element) return { width: 0, height: 0 };
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
  };
};

const applyShellContract = () => {
  const root = document.documentElement;
  const body = document.body;
  const game = document.getElementById('game');
  const play = document.getElementById('play');
  const host = document.getElementById('phaser-game');

  root.style.width = '100%';
  root.style.height = '100%';

  body.style.width = '100%';
  body.style.height = '100%';
  body.style.minWidth = '0';
  body.style.minHeight = '0';
  body.style.margin = '0';
  body.style.overflow = 'hidden';
  body.style.overscrollBehavior = 'none';

  if (game) {
    game.style.position = 'fixed';
    game.style.inset = '0';
    game.style.width = '100%';
    game.style.height = '100%';
    game.style.minWidth = '0';
    game.style.minHeight = '0';
    game.style.maxWidth = 'none';
    game.style.maxHeight = 'none';
    game.style.overflow = 'hidden';
  }

  if (play) {
    play.style.position = 'absolute';
    play.style.inset = '0';
    play.style.width = '100%';
    play.style.height = '100%';
    play.style.minWidth = '0';
    play.style.minHeight = '0';
    play.style.maxWidth = 'none';
    play.style.maxHeight = 'none';
    play.style.overflow = 'hidden';
  }

  if (host) {
    host.style.position = 'absolute';
    host.style.inset = '0';
    host.style.width = '100%';
    host.style.height = '100%';
    host.style.minWidth = '0';
    host.style.minHeight = '0';
    host.style.maxWidth = 'none';
    host.style.maxHeight = 'none';
    host.style.overflow = 'hidden';
    host.style.touchAction = 'none';
  }
};

const publishViewport = reason => {
  const root = document.documentElement;
  const viewport = getLayoutViewport();
  const shell = getGameShellSize();

  root.style.setProperty('--relay-viewport-width', `${viewport.width}px`);
  root.style.setProperty('--relay-viewport-height', `${viewport.height}px`);
  root.style.setProperty('--relay-vw', `${viewport.width}px`);
  root.style.setProperty('--relay-vh', `${viewport.height}px`);
  root.dataset.relayOrientation = viewport.orientation;

  document.dispatchEvent(new CustomEvent('relay:viewport-settled', {
    detail: {
      reason,
      width: viewport.width,
      height: viewport.height,
      orientation: viewport.orientation,
      shellWidth: shell.width,
      shellHeight: shell.height,
    },
  }));

  return `${viewport.width}x${viewport.height}|${shell.width}x${shell.height}`;
};

if (isMobileDevice()) {
  applyShellContract();

  let settleFrame = 0;
  let settleTimer = 0;
  let lastKey = '';
  let orientationEpoch = 0;

  const settle = (reason = 'resize') => {
    cancelAnimationFrame(settleFrame);
    window.clearTimeout(settleTimer);

    settleFrame = requestAnimationFrame(() => {
      applyShellContract();

      requestAnimationFrame(() => {
        applyShellContract();
        const key = publishViewport(reason);

        if (key !== lastKey || reason === 'orientationchange') {
          lastKey = key;
          // Phaser.Scale.RESIZE owns the canvas. Its documented browser resize
          // listener is the correct authority; we only trigger it after the
          // parent has settled instead of manually resizing the canvas.
          window.dispatchEvent(new Event('resize'));
        }
      });
    });
  };

  const settleAfterRotation = () => {
    orientationEpoch += 1;
    const epoch = orientationEpoch;
    settle('orientationchange');

    for (const delay of [180, 360, 600]) {
      window.setTimeout(() => {
        if (epoch === orientationEpoch) settle('orientationchange');
      }, delay);
    }
  };

  const observer = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => settle('container-resize'))
    : null;

  const observe = element => {
    if (element) observer?.observe(element);
  };

  observe(document.documentElement);
  observe(document.body);
  observe(document.getElementById('game'));
  observe(document.getElementById('play'));
  observe(document.getElementById('phaser-game'));

  window.addEventListener('resize', () => settle('resize'), { passive: true });
  window.addEventListener('orientationchange', settleAfterRotation, { passive: true });
  window.addEventListener('pageshow', () => settle('pageshow'), { passive: true });
  window.visualViewport?.addEventListener('resize', () => settle('visual-viewport'), { passive: true });

  // Initial pass plus a delayed pass for the first browser layout commit.
  settle('boot');
  settleTimer = window.setTimeout(() => settle('boot-settled'), 250);
}
