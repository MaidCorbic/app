/* Mobile HUD navigation: PAUSE left + SETTINGS right.
   Behaviour only opens the existing pause terminal; gameplay state is untouched. */
(() => {
  const STYLE_ID = 'relay-mobile-hud-nav-style';
  const NAV_ID = 'relay-mobile-hud-nav';

  const mount = () => {
    const play = document.getElementById('play');
    const pause = document.getElementById('pause');
    const pauseMenu = document.getElementById('pauseMenu');
    if (!play || !pause || !pauseMenu || document.getElementById(NAV_ID)) return;

    if (!document.getElementById(STYLE_ID)) {
      const link = document.createElement('link');
      link.id = STYLE_ID;
      link.rel = 'stylesheet';
      link.href = './mobile-hud-nav-v1.css';
      document.head.appendChild(link);
    }

    const nav = document.createElement('nav');
    nav.id = NAV_ID;
    nav.className = 'mobile-hud-nav';
    nav.setAttribute('aria-label', 'Game navigation');
    nav.innerHTML = `
      <button type="button" class="mobile-nav-button" data-mobile-nav="pause" aria-label="Open pause menu">
        PAUSE<small>MENU</small>
      </button>
      <button type="button" class="mobile-nav-button" data-mobile-nav="settings" aria-label="Open game settings">
        SETTINGS<small>OPTIONS</small>
      </button>`;
    play.appendChild(nav);

    const openPause = () => {
      if (!pauseMenu.classList.contains('hidden')) return;
      pause.click();
    };

    nav.querySelector('[data-mobile-nav="pause"]')?.addEventListener('click', event => {
      event.preventDefault();
      openPause();
    });

    nav.querySelector('[data-mobile-nav="settings"]')?.addEventListener('click', event => {
      event.preventDefault();
      openPause();
      window.setTimeout(() => {
        const tab = pauseMenu.querySelector('[data-tab="settings"]');
        tab?.click();
      }, 0);
    });

    nav.addEventListener('pointerdown', event => {
      if (event.target instanceof Element && event.target.closest('button')) event.stopPropagation();
    }, { passive: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
