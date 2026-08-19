import Phaser from 'phaser';

// Mobile gameplay uses an aspect-preserving cover policy. Phaser RESIZE fits
// the canvas to the parent regardless of aspect ratio, which stretches the
// authored 16:9 gameplay world on portrait and ultra-wide phone viewports.
// ENVELOP preserves the 16:9 world proportions, covers the full viewport, and
// crops only the excess world area outside the viewport.
const OriginalGame = Phaser.Game;
const isTouchViewport = () => {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const touch = Number(navigator.maxTouchPoints || 0) > 0;
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');
  return coarse || touch || mobileUA;
};

const installMobileCanvasPolicy = () => {
  if (document.getElementById('relay-mobile-canvas-policy')) return;

  // mobile-viewport.css predates the Phaser aspect-preserving policy and forced
  // canvas width/height to 100%, which defeats ENVELOP. Disable that legacy
  // sheet on touch devices and replace it with a shell-only layout sheet. The
  // Phaser Scale Manager remains the sole authority over the canvas size.
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    if (link.getAttribute('href')?.endsWith('/mobile-viewport.css') || link.getAttribute('href') === 'mobile-viewport.css') {
      link.disabled = true;
    }
  });

  const style = document.createElement('style');
  style.id = 'relay-mobile-canvas-policy';
  style.textContent = `
    html, body, #game, #play {
      width: 100%;
      min-width: 0;
      max-width: none;
    }
    html, body {
      width: 100%;
      height: 100%;
      min-height: 100%;
      margin: 0;
      overflow: hidden;
    }
    #game, #play {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 100dvh;
      overflow: hidden;
    }
    #phaser-game {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: none !important;
      max-height: none !important;
      overflow: hidden !important;
    }
    #phaser-game > canvas {
      display: block !important;
      max-width: none !important;
      max-height: none !important;
    }
  `;
  document.head.appendChild(style);
};

if (OriginalGame && !OriginalGame.__relayMobileScalePatched) {
  class RelayMobileGame extends OriginalGame {
    constructor(config = {}) {
      const mobile = isTouchViewport();
      if (mobile) installMobileCanvasPolicy();
      const scale = config.scale || {};
      super({
        ...config,
        scale: mobile
          ? {
              ...scale,
              mode: Phaser.Scale.ENVELOP,
              autoCenter: Phaser.Scale.CENTER_BOTH,
              zoom: 1,
            }
          : scale,
      });
    }
  }

  RelayMobileGame.__relayMobileScalePatched = true;
  Phaser.Game = RelayMobileGame;
}
