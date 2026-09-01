/* Home V3 compatibility guard. Canonical Home/runtime owns visibility. */
(() => {
  'use strict';

  // Intentionally no-op.
  // The former guard watched #intro and repeatedly applied `home-v3` /
  // `home-v3-active`, conflicting with the canonical Home state.
  if (window.__relayHomeV3Guard) return;
  window.__relayHomeV3Guard = true;
})();
