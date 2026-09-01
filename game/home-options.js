// Unified bootstrap: one Options owner plus deterministic Home/gameplay presentation layers.
// Legacy home-navigation is not loaded here: the canonical home buttons use their
// native DOM handlers, while unified-options-ui-v1 owns the Options action.
import './options-polish-v2.css';
import './unified-options-ui-v1.js';
import './src/systems/audio-autoplay-guard-v1.js';
import './mobile-hud-options-cleanup-v1.css';
import './gameplay-feature-dock-v1.js';
import './gameplay-expansion-loader-v1.js';
