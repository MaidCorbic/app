import './unified-cinematic-ui-v1.css';
import './unified-cinematic-ui-v1.js';
import './unified-cinematic-ui-bridge-v1.js';
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
    const side = intro?.querySelector('.home-v3-side');
    if (!side) return;

    side.querySelectorAll('[data-v3-options],[data-v3-faq],[data-v3-update],[data-v3-exit],[data-unified-home],[data-final-home="faq"],[data-final-home="update"],[data-final-home="exit"],[data-final-home="options"]').forEach(node => node.remove());

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

    side.append(
      make('options', 'OPTIONS', 'SETTINGS · AUDIO · DISPLAY', () => call('options', () => window.relayUnifiedCinematicUI?.openOptions?.())),
      make('exit', 'EXIT', 'CLOSE SESSION', () => $('#exitTitle')?.click()),
    );

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
