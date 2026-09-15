// Legacy compatibility shim.
//
// Mobile gameplay input has exactly one owner:
//   src/systems/mobile-input-single-owner-v1.js
//
// This file intentionally installs no listeners. It remains present so stale
// imports cannot silently reintroduce a second joystick/action dispatcher.
(() => {
  'use strict';
  if (window.__relayLegacyTouchControlsShim) return;
  window.__relayLegacyTouchControlsShim = true;
  window.__relayTouchControlsLegacy = true;
})();
