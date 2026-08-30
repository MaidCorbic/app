import './unified-cinematic-ui-v1.css';
import './unified-cinematic-ui-v1.js';
import './unified-cinematic-ui-bridge-v1.js';
import './unified-gameplay-ui-v1.css';
import './unified-gameplay-ui-v1-polish.css';
import './unified-gameplay-ui-v1.js';
import './unified-gameplay-ui-v1-mobile.css';
import './src/systems/gameplay-body-swap-presentation-v1.js';

// Compatibility module kept for the existing script order. Unified UI owns
// Options, FAQ, Pause and gameplay presentation; no second interaction router runs here.
(() => {
  'use strict';
  if (window.__relayHomeV3InteractionFix) return;
  window.__relayHomeV3InteractionFix = true;
})();
