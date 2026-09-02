/* =========================================================
   HOME CANONICAL OWNER V1

   One visible Home menu only.
   Canonical order:
   1. OPTIONS
   2. UPDATE
   3. FAQ
   4. EXIT

   This module owns only the visible Home navigation surface.
   Gameplay/runtime systems remain untouched.
   ========================================================= */

(() => {
  'use strict';

  if (window.__relayHomeCanonicalOwnerV1) return;
  window.__relayHomeCanonicalOwnerV1 = true;

  const SELECTORS = [
    '[data-v3-options]',
    '[data-v3-update]',
    '[data-v3-faq]',
    '[data-v3-exit]',
    '[data-final-home]',
    '[data-final-home-button]',
    '[data-unified-home]',
    '[data-unified-home-v3]',
    '[data-final-home-v3]',
    '[data-runtime-home]',
    '[data-safe-home]',
    '.relay-home-nav-card',
    '.relay-v4-home-btn',
    '.relay-runtime-home-btn',
    '.relay-v3-nav',
    '[data-home-button]',
    '[data-home-action]'
  ].join(',');

  const waitForSide = (callback) => {
    const find = () => document.querySelector('#intro.home-v3 .home-v3-side');

    const side = find();
    if (side) {
      callback(side);
      return;
    }

    if (!document.body || typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver(() => {
      const ready = find();
      if (!ready) return;
      observer.disconnect();
      callback(ready);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.setTimeout(() => {
      const ready = find();
      if (!ready) return;
      observer.disconnect();
      callback(ready);
    }, 2000);
  };

  const nativeClick = (selector) => {
    const node = document.querySelector(selector);
    if (!(node instanceof HTMLElement)) return false;

    try {
      HTMLElement.prototype.click.call(node);
      return true;
    } catch {
      try {
        node.click();
        return true;
      } catch {
        return false;
      }
    }
  };

  const action = (key) => {
    if (key === 'options') {
      if (window.relayUnifiedCinematicUI?.openOptions) {
        window.relayUnifiedCinematicUI.openOptions();
        return;
      }
      nativeClick('[data-title-panel="controls"]');
      return;
    }

    if (key === 'update') {
      if (window.relayOpenInfo) {
        window.relayOpenInfo('update');
        return;
      }
      nativeClick('[data-relay-info="update"]');
      return;
    }

    if (key === 'faq') {
      if (window.relayUnifiedCinematicUI?.openFAQ) {
        window.relayUnifiedCinematicUI.openFAQ();
        return;
      }
      if (window.relayOpenInfo) {
        window.relayOpenInfo('faq');
        return;
      }
      nativeClick('[data-relay-info="faq"]');
      return;
    }

    nativeClick('#exitTitle');
  };

  const makeButton = (side, key, title, subtitle) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'home-v3-card relay-home-nav-card';
    button.dataset.homeCanonical = key;
    button.dataset.finalHome = key;
    button.dataset.finalHomeButton = key;
    button.innerHTML = `<span>${title}</span><small>${subtitle}</small>`;

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      action(key);
    }, { capture: true });

    return button;
  };

  const install = (side) => {
    if (!side || side.dataset.homeCanonicalInstalled === '1') return;

    side.dataset.homeCanonicalInstalled = '1';

    side.querySelectorAll(SELECTORS).forEach(node => node.remove());

    const buttons = [
      makeButton(side, 'options', 'OPTIONS', 'SETTINGS · AUDIO · DISPLAY'),
      makeButton(side, 'update', 'UPDATE', 'LATEST PATCHES · LIVE'),
      makeButton(side, 'faq', 'FAQ', 'HELP · GAME SYSTEMS'),
      makeButton(side, 'exit', 'EXIT', 'CLOSE SESSION')
    ];

    buttons.forEach(button => side.appendChild(button));
  };

  const boot = () => waitForSide(install);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
