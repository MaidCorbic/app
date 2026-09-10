import './unified-cinematic-ui-v1.css';
import './unified-cinematic-ui-v1.js';
import './unified-cinematic-ui-bridge-v1.js';
import './unified-options-ui-v1.js';
import './unified-gameplay-ui-v1.css';
import './unified-gameplay-ui-v1-polish.css';
import './unified-gameplay-ui-v1.js';
import './unified-gameplay-ui-v1-mobile.css';
import './presentation-final-v1.css';
import './presentation-final-v1.js';

/* Final Home interaction owner. Existing gameplay/UI systems remain authoritative. */
(() => {
  'use strict';
  if (window.__relayHomeFinalV1) return;
  window.__relayHomeFinalV1 = true;

  const $ = sel => document.querySelector(sel);

  /*
   * Canonical Options router.
   *
   * unified-options-ui-v1 is the only Settings/Options renderer.
   * unified-cinematic-ui-v1 remains loaded for FAQ/pause compatibility, but its
   * legacy Options renderer must never be used as a fallback.
   */
  const openCanonicalOptions = () => {
    const button = document.querySelector('[data-title-panel="controls"]');
    if (!(button instanceof HTMLElement) || button.disabled) return false;

    try {
      HTMLElement.prototype.click.call(button);
      return true;
    } catch {
      return false;
    }
  };

  const installCanonicalOptionsRouter = () => {
    const api = window.relayUnifiedCinematicUI;
    if (!api || typeof api.openOptions !== 'function') return;
    if (api.__canonicalOptionsRouterV2) return;

    /*
     * Preserve FAQ/pause on the cinematic owner, but hard-route Options to the
     * canonical unified trigger. There is intentionally NO legacy fallback:
     * showing the old Gold/Cinematic Settings panel is a functional regression.
     */
    api.openOptions = () => openCanonicalOptions();

    Object.defineProperty(api, '__canonicalOptionsRouterV2', {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  };

  /*
   * The legacy cinematic renderer can still exist for FAQ/pause compatibility.
   * This guard makes the title-panel boundary explicit: the cinematic Options
   * card can never become a visible Settings surface under #titlePanel.
   */
  const installLegacyOptionsVisualGuard = () => {
    if (document.getElementById('relay-canonical-options-guard-v1')) return;

    const style = document.createElement('style');
    style.id = 'relay-canonical-options-guard-v1';
    style.textContent = `
      #titlePanel > .relay-cinematic-panel{
        display:none !important;
      }

      #titlePanel.relay-options-unified > .relay-cinematic-panel{
        display:none !important;
      }
    `;

    document.head.appendChild(style);
  };

  installCanonicalOptionsRouter();
  installLegacyOptionsVisualGuard();

  const call = (name, fallback) => {
    try {
      if (name === 'options' && window.relayUnifiedCinematicUI?.openOptions) return window.relayUnifiedCinematicUI.openOptions();
      if (name === 'faq' && window.relayUnifiedCinematicUI?.openFAQ) return window.relayUnifiedCinematicUI.openFAQ();
      if (name === 'update' && window.relayOpenInfo) return window.relayOpenInfo('update');
    } catch {}
    if (typeof fallback === 'function') window.setTimeout(fallback, 0);
  };

  const install = () => {
    const intro = $('#intro');
    if (!intro) return;

    const launcher = intro.querySelector('.info-launcher');
    launcher?.querySelector('[data-relay-info="faq"]')?.setAttribute('aria-label', 'Open FAQ');
    launcher?.querySelector('[data-relay-info="update"]')?.setAttribute('aria-label', 'Open latest updates');

    const make = (id, label, detail, handler) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'home-v3-card relay-home-nav-card';
      button.dataset.finalHome = id;
      button.innerHTML = `<span>${label}</span><small>${detail}</small>`;
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        handler();
      });
      return button;
    };

    const update = launcher?.querySelector('[data-relay-info="update"]');
    update?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      call('update');
    }, { capture: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else window.setTimeout(install, 0);
})();