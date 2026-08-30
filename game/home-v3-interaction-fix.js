import './unified-cinematic-ui-v1.css';
import './unified-cinematic-ui-v1.js';
import './unified-cinematic-ui-bridge-v1.js';
import './unified-gameplay-ui-v1.css';
import './unified-gameplay-ui-v1-polish.css';
import './unified-gameplay-ui-v1.js';
import './unified-gameplay-ui-v1-mobile.css';
import './presentation-final-v1.css';
import './update-center-v1.js';

/* Single Home navigation owner. Existing gameplay, Options, FAQ and Exit systems remain authoritative. */
(() => {
  'use strict';
  if (window.__relayHomeFinalV2) return;
  window.__relayHomeFinalV2 = true;

  const $ = sel => document.querySelector(sel);

  const openOptions = () => {
    try { window.relayUnifiedCinematicUI?.openOptions?.(); } catch (error) { console.warn('[Relay Home] options open failed', error); }
  };
  const openFaq = () => {
    try { window.relayUnifiedCinematicUI?.openFAQ?.(); } catch (error) { console.warn('[Relay Home] FAQ open failed', error); }
  };
  const openUpdate = () => {
    try { window.relayUpdateCenter?.open?.(); } catch (error) { console.warn('[Relay Home] update open failed', error); }
  };

  const install = () => {
    const intro = $('#intro');
    const side = intro?.querySelector('.home-v3-side');
    if (!intro || !side || intro.dataset.homeFinalV2Installed === '1') return;
    intro.dataset.homeFinalV2Installed = '1';

    /* Remove only duplicated/legacy Home launchers. The underlying panels remain intact. */
    intro.querySelector('.info-launcher')?.remove();
    side.querySelectorAll('[data-v3-options],[data-v3-faq],[data-v3-exit],[data-unified-home],.relay-home-nav-card').forEach(node => node.remove());

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
      make('options', 'OPTIONS', 'SETTINGS · AUDIO · DISPLAY', openOptions),
      make('faq', 'FAQ', 'HELP · GAME SYSTEMS', openFaq),
      make('update', 'UPDATE', 'VERSION HISTORY · LIVE', openUpdate),
      make('exit', 'EXIT', 'CLOSE SESSION', () => $('#exitTitle')?.click()),
    );
  };

  const start = () => {
    install();
    const intro = $('#intro');
    if (!intro || intro.dataset.homeFinalV2Observer === '1') return;
    intro.dataset.homeFinalV2Observer = '1';
    new MutationObserver(() => {
      if (!intro.querySelector('.home-v3-side .relay-home-nav-card')) install();
    }).observe(intro, { childList:true, subtree:true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else window.setTimeout(start, 0);
})();
