// Safe bootstrap shim: Options and presentation extras must never block game startup.
(() => {
  'use strict';
  if (window.__relayOptionsDeferred) return;
  window.__relayOptionsDeferred = true;

  const load = () => import('./home-options-runtime.js').catch(error => {
    console.error('[Relay] deferred Options bundle failed:', error);
    window.dispatchEvent(new CustomEvent('relay:options-unavailable', { detail: { error } }));
  });

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(load, { timeout: 1500 });
  } else {
    window.setTimeout(load, 0);
  }
})();
