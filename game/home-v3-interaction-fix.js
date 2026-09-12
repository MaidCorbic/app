import './unified-cinematic-ui-v1.js';
import './unified-cinematic-ui-bridge-v1.js';
import './unified-options-ui-v1.js';
import './unified-gameplay-ui-v1.js';
import './presentation-final-v1.js';

(() => {
  'use strict';
  if (window.__relayHomeFinalV1) return;
  window.__relayHomeFinalV1 = true;

  const openCanonicalOptions = () => {
    const panel = document.getElementById('titlePanel');
    const heading = document.getElementById('titlePanelHeading');
    const content = document.getElementById('titlePanelContent');

    if (!(panel instanceof HTMLElement) || !(heading instanceof HTMLElement) || !(content instanceof HTMLElement)) return false;

    try {
      panel.classList.remove('hidden');
      panel.removeAttribute('hidden');
      panel.setAttribute('aria-hidden', 'false');
      heading.textContent = 'OPTIONS';
      heading.className = 'relay-options-title';

      // Use the canonical Options owner directly. Do not synthesize a hidden
      // click, which can re-enter the Home/Settings event chain.
      document.dispatchEvent(new CustomEvent('relay-open-home-options', {
        detail: { panel, content, source: 'canonical-home-router' },
      }));
      return true;
    } catch {
      return false;
    }
  };

  const installHomeOptionsGuard = () => {
    if (document.documentElement.dataset.canonicalHomeOptionsGuard === '1') return;
    document.documentElement.dataset.canonicalHomeOptionsGuard = '1';

    document.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const optionsButton = target.closest('[data-final-home="options"],[data-final-home-button="options"],[data-home-v4-action="options"]');
      if (!optionsButton) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openCanonicalOptions();
    }, true);
  };

  const installLegacyOptionsGuard = () => {
    if (document.getElementById('relay-canonical-options-guard-v2')) return;
    const style = document.createElement('style');
    style.id = 'relay-canonical-options-guard-v2';
    style.textContent = `
      #titlePanel > .relay-cinematic-panel,
      #titlePanel.relay-options-unified > .relay-cinematic-panel { display:none !important; visibility:hidden !important; pointer-events:none !important; }
    `;
    document.head.appendChild(style);
  };

  const boot = () => {
    installHomeOptionsGuard();
    installLegacyOptionsGuard();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
