import './unified-cinematic-ui-v1.css';
import './unified-cinematic-ui-v1.js';
import './unified-cinematic-ui-bridge-v1.js';

// Compatibility module kept for the existing script order. Unified UI owns
// Options, FAQ and Pause interactions; no second home interaction router runs here.
(() => {
  'use strict';
  if (window.__relayHomeV3InteractionFix) return;
  window.__relayHomeV3InteractionFix = true;
})();
