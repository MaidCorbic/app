/* Relay Runner — SINGLE HOME OWNER LOCK V1
 * Final presentation guard.
 * Keeps relay-final-layout-v2.js as the only visible Home navigation owner.
 * Removes legacy/competing Home buttons before they can remain visible.
 */
(() => {
  'use strict';

  if (window.__relaySingleHomeOwnerLockV1) return;
  window.__relaySingleHomeOwnerLockV1 = true;

  const HOME_SELECTOR = '#intro.home-v3 .home-v3-side';
  let running = false;

  const homeVisible = () => {
    const intro = document.getElementById('intro');
    return !!intro && !intro.classList.contains('hidden');
  };

  const isCanonical = node =>
    !!node?.matches?.('.relay-home-nav-card[data-final-home]');

  const purgeCompetingHome = () => {
    if (running || !homeVisible()) return;

    const side = document.querySelector(HOME_SELECTOR);
    if (!side) return;

    running = true;

    try {
      side.querySelectorAll([
        '.relay-v4-home-btn',
        '.relay-runtime-home-btn',
        '[data-safe-home]',
        '[data-runtime-home]',
        '[data-unified-home]',
        '[data-unified-home-v3]',
        '[data-final-home-v3]',
        '[data-v3-options]',
        '[data-v3-update]',
        '[data-v3-faq]',
        '[data-v3-exit]',
        '.relay-v3-nav'
      ].join(',')).forEach(node => node.remove());

      Array.from(side.children).forEach(node => {
        if (node.tagName === 'BUTTON' && !isCanonical(node)) {
          node.remove();
        }
      });

      const canonical = Array.from(
        side.querySelectorAll('.relay-home-nav-card[data-final-home]')
      );

      const keys = canonical.map(node => node.dataset.finalHome);
      const correct =
        canonical.length === 4 &&
        keys[0] === 'options' &&
        keys[1] === 'update' &&
        keys[2] === 'faq' &&
        keys[3] === 'exit';

      if (!correct) {
        window.relayFinalLayoutV2?.enforceFinalHome?.();
      }
    } finally {
      running = false;
    }
  };

  const boot = () => {
    purgeCompetingHome();

    const observer = new MutationObserver(() => {
      purgeCompetingHome();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden']
    });

    window.setInterval(purgeCompetingHome, 1000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
