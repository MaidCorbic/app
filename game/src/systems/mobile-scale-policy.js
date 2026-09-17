// Mobile scale policy
//
// IMPORTANT:
// This file intentionally does NOT monkey-patch Phaser.Game.
// Phaser is configured directly in src/main.js.
//
// Keeping this module side-effect free prevents mobile viewport logic from
// replacing Phaser's Game constructor and breaking the production build.

const isTouchViewport = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const coarse =
    window.matchMedia?.('(pointer: coarse)').matches ||
    window.matchMedia?.('(hover: none)').matches;

  const touch =
    Number(navigator.maxTouchPoints || 0) > 0 ||
    Number(navigator.msMaxTouchPoints || 0) > 0;

  const mobileUA =
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(
      navigator.userAgent || ''
    );

  return Boolean(coarse || touch || mobileUA);
};

export { isTouchViewport };