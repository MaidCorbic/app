(() => {
  'use strict';

  const HOME_READY_CLASS = 'relay-home-ready';
  const HOME_READY_STYLE_ID = 'relay-home-ready-style';

  function installHomeReadyStyle() {
    if (document.getElementById(HOME_READY_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = HOME_READY_STYLE_ID;
    style.textContent = `
      #intro.${HOME_READY_CLASS}{
        display:block!important;
        visibility:visible!important;
        opacity:1!important;
        pointer-events:auto!important;
        z-index:500!important;
      }
      #intro.${HOME_READY_CLASS}.hidden{display:block!important;}
      #relaySplash.relay-splash-done{display:none!important;visibility:hidden!important;pointer-events:none!important;}
    `;
    document.head.appendChild(style);
  }

  function revealHome() {
    const intro = document.getElementById('intro');
    if (!intro) return false;
    installHomeReadyStyle();
    intro.hidden = false;
    intro.classList.remove('hidden');
    intro.classList.add(HOME_READY_CLASS);
    intro.setAttribute('aria-hidden', 'false');
    return true;
  }

  function finishSplash() {
    const splash = document.getElementById('relaySplash') || document.querySelector('.relay-splash');
    revealHome();
    document.body.classList.remove('home-v3-active');
    if (!splash) return;

    splash.setAttribute('aria-busy', 'false');
    splash.classList.add('is-hidden', 'relay-splash-done');
    splash.hidden = true;
    splash.style.display = 'none';
    splash.style.visibility = 'hidden';
    splash.style.pointerEvents = 'none';
  }

  function start() {
    const splash = document.getElementById('relaySplash') || document.querySelector('.relay-splash');
    if (!splash) {
      revealHome();
      return;
    }

    const bar = splash.querySelector('.relay-splash-progress');
    const pct = splash.querySelector('.relay-splash-percent');
    const label = splash.querySelector('.relay-splash-status');

    if (bar) bar.style.width = '100%';
    if (pct) pct.textContent = '100%';
    if (label) label.textContent = 'READY';

    // Do not wait for another timer/animation after 100%.
    // The previous handoff could stall here when the main thread was busy.
    finishSplash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
