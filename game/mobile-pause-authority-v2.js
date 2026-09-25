/* Mobile compatibility facade.
 * Pause ownership belongs exclusively to pause-authority-v3.js.
 */
(() => {
  'use strict';

  if (window.__relayMobilePauseAuthorityV2) return;
  window.__relayMobilePauseAuthorityV2 = true;

  const openCanonicalPause = tab => {
    const owner = window.relayPauseAuthorityV3;

    if (owner && typeof owner.open === 'function') {
      return owner.open(tab || 'resume');
    }

    const api = window.relayUnifiedCinematicUI;

    if (api && typeof api.openPause === 'function') {
      return api.openPause(tab || 'resume');
    }

    return false;
  };

  window.relayMobilePauseV2 = Object.freeze({
    open: () => openCanonicalPause('resume'),
    openSettings: () => openCanonicalPause('settings')
  });
})();
