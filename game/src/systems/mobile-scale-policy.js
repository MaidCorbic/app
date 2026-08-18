import Phaser from 'phaser';

// Mobile gameplay must preserve its authored 16:9 world proportions.
// Phaser RESIZE intentionally changes the game size to the parent dimensions,
// which is useful for responsive UI but can make a 16:9 platformer look
// horizontally/vertically stretched on tall or ultra-wide phone viewports.
// Phaser 3.90 provides EXPAND specifically for filling the available parent
// while keeping the game canvas aspect ratio stable.
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
              mode: Phaser.Scale.EXPAND,
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
