import './cinematic-arrival-v2.css';

/*
 * Legacy cinematic-arrival controller disabled.
 * splash-loader-v2.js is the single owner of the first-load splash.
 * Keeping two controllers on #relaySplash caused mobile/portrait boot
 * to race and could leave the loading screen stuck over the Home UI.
 */
(() => {
  'use strict';

  // Intentionally do nothing during first boot.
  // Mission/gameplay presentation is owned by the current runtime layers.
})();
