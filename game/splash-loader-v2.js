(() => {
  'use strict';

  const removeSplash = () => {
    const splash = document.getElementById('relaySplash') || document.querySelector('.relay-splash');
    const intro = document.getElementById('intro');

    // Splash has exactly one job: reveal the existing Home screen.
    if (intro) {
      intro.hidden = false;
      intro.classList.remove('hidden');
      intro.setAttribute('aria-hidden', 'false');
    }

    document.body.classList.remove('home-v3-active');

    if (!splash) return;
    splash.setAttribute('aria-busy', 'false');
    splash.classList.add('is-hidden');
    window.setTimeout(() => splash.remove(), 350);
  };

  const start = () => {
    const splash = document.getElementById('relaySplash') || document.querySelector('.relay-splash');
    if (!splash) return;

    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');

    if (bar) bar.style.width = '100%';
    if (pct) pct.textContent = '100%';
    if (label) label.textContent = 'READY';

    window.setTimeout(removeSplash, 1200);
  };

  start();
})();
