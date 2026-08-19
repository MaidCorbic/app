// Mobile scaling is intentionally handled by Phaser.Scale.RESIZE in main.js.
// Do not monkey-patch Phaser.Game here: changing RESIZE to EXPAND after boot can
// leave the canvas on a stale intermediate size after repeated orientation changes.
// This module remains as a compatibility no-op for older imports.
export {};