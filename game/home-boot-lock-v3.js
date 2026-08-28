/* Initial-state lock: the legacy runtime calls launch(0, true) during boot.
   Keep that paused compatibility state completely out of the user's Home surface. */
(() => {
  if (window.__relayHomeBootLockV3) return;
  window.__relayHomeBootLockV3 = true;

  const homeIsVisible = () => {
    const intro = document.getElementById('intro');
    return !!intro && !intro.classList.contains('hidden');
  };

  const lockHomeSurface = () => {
    if (!homeIsVisible()) return;
    const play = document.getElementById('play');
    if (play) {
      play.style.setProperty('display', 'none', 'important');
      play.setAttribute('aria-hidden', 'true');
      play.inert = true;
    }
    for (const id of ['pauseMenu','finish','gameOver','levelUp','abilityUnlock','worldMap','preflight']) {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('hidden');
        el.setAttribute('aria-hidden', 'true');
        el.inert = true;
      }
    }
  };

  const restoreAfterHome = () => {
    const play = document.getElementById('play');
    if (!play || homeIsVisible()) return;
    play.style.removeProperty('display');
    play.removeAttribute('aria-hidden');
    play.inert = false;
  };

  const sync = () => {
    if (homeIsVisible()) lockHomeSurface();
    else restoreAfterHome();
  };

  new MutationObserver(sync).observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class','style','hidden']
  });

  document.addEventListener('click', event => {
    if (!homeIsVisible()) return;
    const button = event.target.closest('[data-home-play],[data-home-continue]');
    if (button) {
      window.setTimeout(restoreAfterHome, 300);
    }
  }, true);

  sync();
  window.addEventListener('load', sync, {once: true});
})();
