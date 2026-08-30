import './unified-cinematic-ui-v1.css';
import './unified-cinematic-ui-v1.js';
import './unified-cinematic-ui-bridge-v1.js';
import './unified-gameplay-ui-v1.css';
import './unified-gameplay-ui-v1-polish.css';
import './unified-gameplay-ui-v1.js';
import './unified-gameplay-ui-v1-mobile.css';
import './presentation-final-v1.css';
import './update-center-v1.js';

/* Single Home owner. Keep existing progress/loading markup untouched. */
(() => {
  'use strict';
  if (window.__relayHomeFinalV4) return;
  window.__relayHomeFinalV4 = true;

  const intro = () => document.getElementById('intro');
  const side = () => intro()?.querySelector('.home-v3-side');
  const isHomeVisible = () => {
    const el = intro();
    return !!el && !el.classList.contains('hidden');
  };

  const openOptions = () => {
    try { window.relayUnifiedCinematicUI?.openOptions?.(); } catch (error) { console.warn('[Relay Home] Options failed', error); }
  };
  const openUpdate = () => {
    try { window.relayUpdateCenter?.open?.(); } catch (error) { console.warn('[Relay Home] Update failed', error); }
  };
  const openExit = () => document.getElementById('exitTitle')?.click();

  const normalizeExistingUpdateLauncher = root => {
    const launcher = root?.querySelector('.info-launcher');
    if (!launcher) return;

    launcher.querySelector('.faq-launcher')?.remove();

    const update = launcher.querySelector('.info-circle');
    if (update) {
      update.removeAttribute('data-relay-info');
      update.setAttribute('data-update-open', '');
      update.setAttribute('aria-label', 'Open update history');
      update.title = 'Update history';
    }
  };

  const makeButton = (id, label, detail, handler) => {
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

  const install = () => {
    const root = intro();
    const menu = side();
    if (!root || !menu || !isHomeVisible()) return;

    normalizeExistingUpdateLauncher(root);

    menu.querySelectorAll('[data-v3-options],[data-v3-faq],[data-v3-exit],[data-unified-home],.relay-home-nav-card').forEach(node => node.remove());
    root.querySelectorAll('#intro .relay-home-nav-card[data-final-home="faq"],#intro .relay-home-nav-card[data-final-home="update"]').forEach(node => node.remove());

    menu.replaceChildren(
      makeButton('options', 'OPTIONS', 'SETTINGS · AUDIO · DISPLAY', openOptions),
      makeButton('exit', 'EXIT', 'CLOSE SESSION', openExit),
    );
  };

  const reconcile = () => {
    const root = intro();
    const menu = side();
    if (!root || !menu || !isHomeVisible()) return;

    normalizeExistingUpdateLauncher(root);

    const cards = [...menu.querySelectorAll('.relay-home-nav-card')];
    const expected = ['options', 'exit'];
    const ids = cards.map(card => card.dataset.finalHome);
    const valid = cards.length === 2 && expected.every((id, index) => ids[index] === id);
    const legacy = !!root.querySelector(
      '.faq-launcher,[data-relay-info],[data-v3-options],[data-v3-faq],[data-v3-exit],[data-unified-home],'
      +'.relay-home-nav-card[data-final-home="faq"],.relay-home-nav-card[data-final-home="update"]'
    );
    if (!valid || legacy) install();
  };

  const start = () => {
    install();
    const root = intro();
    if (!root || root.dataset.homeFinalV4Observer === '1') return;
    root.dataset.homeFinalV4Observer = '1';
    new MutationObserver(reconcile).observe(root, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else window.setTimeout(start, 0);
})();
