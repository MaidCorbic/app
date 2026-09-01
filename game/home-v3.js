/* Home V3 compatibility entrypoint. Canonical Home is owned by index.html + main.js. */
(() => {
  'use strict';

  // The previous V3 layer mutated #intro with `home-v3` and `home-v3-active`.
  // That conflicted with the canonical Home markup and could hide the real menu.
  // Keep this entrypoint for compatibility, but make it presentation-neutral.
  if (window.__relayHomeV3) return;
  window.__relayHomeV3 = true;
})();
