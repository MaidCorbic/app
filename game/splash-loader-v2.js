(() => {
  'use strict';

  const removeSplash = () => {
    const splash =
      document.getElementById('relaySplash') ||
      document.querySelector('.relay-splash');

    if (!splash) return;

    splash.setAttribute('aria-busy', 'false');
    splash.classList.add('is-hidden');

    window.setTimeout(() => {
      splash.remove();
    }, 350);
  };

  const start = () => {
    const splash =
      document.getElementById('relaySplash') ||
      document.querySelector('.relay-splash');

    if (!splash) return;

    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');

    if (bar) bar.style.width = '100%';
    if (pct) pct.textContent = '100%';
    if (label) label.textContent = 'READY';

    /*
     * Deliberately independent of:
     * - image loading
     * - window.load
     * - DOMContentLoaded
     * - Phaser
     * - gameplay modules
     * - readiness checks
     */

    window.setTimeout(removeSplash, 2000);
  };

  /*
   * This file is loaded at the end of index.html,
   * so the splash DOM already exists.
   */
  start();
})();
