// Compatibility shim: viewport-sync.js is the single mobile viewport owner.
// Keep this module importable for legacy boot order without creating a second
// resize/visualViewport/RAF pipeline.
export {};