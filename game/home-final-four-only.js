/* Final Home cleanup: keep only the first four canonical navigation cards. */
(() => {
  'use strict';
  if (window.__relayHomeFinalFourOnly) return;
  window.__relayHomeFinalFourOnly = true;

  const cleanup = () => {
    const intro = document.getElementById('intro');
    if (!intro) return;

    const side = intro.querySelector('.home-v3-side');
    const secondary = intro.querySelector('.title-secondary');

    if (side) {
      const cards = Array.from(side.querySelectorAll('.relay-home-nav-card, .home-v3-card, .relay-runtime-home-btn'));
      cards.slice(4).forEach(node => node.remove());
    }

    if (secondary) {
      secondary.querySelectorAll('[data-safe-home="faq"],[data-safe-home="update"]').forEach(node => node.remove());
      secondary.setAttribute('aria-hidden', 'true');
      secondary.style.display = 'none';
    }
  };

  const boot = () => {
    cleanup();
    const intro = document.getElementById('intro');
    if (!intro || intro.dataset.finalFourObserver === '1') return;
    intro.dataset.finalFourObserver = '1';
    new MutationObserver(cleanup).observe(intro, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
