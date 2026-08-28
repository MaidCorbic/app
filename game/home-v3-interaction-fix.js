// Home V3 interaction bridge: touch-safe routing without changing the Home V3 visual surface.
(() => {
  'use strict';
  if (window.__relayHomeV3InteractionFix) return;
  window.__relayHomeV3InteractionFix = true;

  const activate = selector => {
    const target = document.querySelector(selector);
    if (!target || target.disabled) return false;
    target.click();
    return true;
  };

  const route = button => {
    if (!button) return;
    if (button.matches('[data-v3-play]')) return activate('#start');
    if (button.matches('[data-v3-continue]')) return activate('#continue');
    if (button.matches('[data-v3-options]')) return activate('[data-title-panel="controls"]');
    if (button.matches('[data-v3-tutorial]')) return activate('[data-title-panel="tutorial"]');
    if (button.matches('[data-v3-faq]')) return activate('[data-relay-info="faq"]');
    if (button.matches('[data-v3-exit]')) return activate('#exitTitle');
  };

  document.addEventListener('pointerup', event => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const button = event.target.closest?.('[data-v3-play],[data-v3-continue],[data-v3-options],[data-v3-tutorial],[data-v3-faq],[data-v3-exit]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    route(button);
  }, true);

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-v3-play],[data-v3-continue],[data-v3-options],[data-v3-tutorial],[data-v3-faq],[data-v3-exit]');
    if (!button) return;
    route(button);
  }, true);
})();
