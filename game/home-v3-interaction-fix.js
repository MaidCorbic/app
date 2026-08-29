// Home V3 interaction bridge.
// Safety fallback only: Home V3 already owns its own pointer/click routing.
// Do not attach a second document-level router when Home V3 is active.
(() => {
  'use strict';
  if (window.__relayHomeV3InteractionFix) return;
  window.__relayHomeV3InteractionFix = true;

  // home-v3.js is the single owner of V3 interactions.
  // Keeping this file as a guarded no-op preserves the existing script import
  // without creating duplicate pointerup/click activation.
  if (window.__relayHomeV3) return;

  const activate = selector => {
    const target = document.querySelector(selector);
    if (!target || target.disabled) return false;
    HTMLElement.prototype.click.call(target);
    return true;
  };

  const route = button => {
    if (!button) return;
    if (button.matches('[data-v3-continue]')) return activate('#continue');
    if (button.matches('[data-v3-options]')) return activate('[data-title-panel="controls"]');
    if (button.matches('[data-v3-faq]')) return activate('[data-relay-info="faq"]');
    if (button.matches('[data-v3-exit]')) return activate('#exitTitle');
  };

  document.addEventListener('pointerup', event => {
    if (window.__relayHomeV3) return;
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const button = event.target.closest?.('[data-v3-continue],[data-v3-options],[data-v3-faq],[data-v3-exit]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    route(button);
  }, true);
})();
