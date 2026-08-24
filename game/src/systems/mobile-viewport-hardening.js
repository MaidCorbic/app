// Compatibility shim only.
// Viewport synchronization is owned by viewport-sync.js.
// Keeping this module side-effect free prevents two resize/RAF pipelines from
// competing for Phaser's Scale.RESIZE lifecycle.
export {};
