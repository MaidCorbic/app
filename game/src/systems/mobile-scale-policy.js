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

if (OriginalGame && !OriginalGame.__relayMobileScalePatched) {
  class RelayMobileGame extends OriginalGame {
    constructor(config = {}) {
      const mobile = isTouchViewport();
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
