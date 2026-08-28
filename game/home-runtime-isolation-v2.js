/* Home runtime boundary. Keeps gameplay hidden and input-inert while Home/panels are active. */
(() => {
  if (window.__relayHomeRuntimeIsolationV2) return;
  window.__relayHomeRuntimeIsolationV2 = true;

  const HOME = '#intro';
  const GAMEPLAY_SELECTORS = [
    '#play', '#phaser-game', '.hud', '.world-marker', '.input-guide',
    '.mobile-controls', '.rotate-prompt', '#pauseMenu', '#finish', '#gameOver',
    '#levelUp', '#abilityUnlock'
  ];
  const BLOCKED_KEYS = new Set([
    ' ', 'Spacebar', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'w', 'a', 's', 'd', 'e', 'q', 'r', 'f', '1', '2', '3', '4',
    'Shift', 'Control', 'Alt', 'Tab'
  ]);

  const homeVisible = () => {
    const el = document.querySelector(HOME);
    return !!el && !el.classList.contains('hidden');
  };

  const apply = () => {
    const active = homeVisible();
    document.documentElement.toggleAttribute('data-home-active', active);
    document.body?.toggleAttribute('data-home-active', active);
    for (const selector of GAMEPLAY_SELECTORS) {
      document.querySelectorAll(selector).forEach(el => {
        if (active) {
          if (!el.dataset.homeIsolationDisplay) el.dataset.homeIsolationDisplay = el.style.display || '';
          el.style.setProperty('display', 'none', 'important');
          el.setAttribute('aria-hidden', 'true');
          el.inert = true;
        } else {
          const previous = el.dataset.homeIsolationDisplay;
          if (previous !== undefined) el.style.display = previous;
          else el.style.removeProperty('display');
          el.removeAttribute('aria-hidden');
          el.inert = false;
        }
      });
    }
  };

  document.addEventListener('keydown', event => {
    if (!homeVisible()) return;
    if (BLOCKED_KEYS.has(event.key) || BLOCKED_KEYS.has(String(event.key).toLowerCase())) {
      const target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  for (const type of ['touchstart', 'touchmove', 'touchend', 'pointerdown', 'pointermove', 'pointerup']) {
    document.addEventListener(type, event => {
      if (!homeVisible()) return;
      const target = event.target;
      if (target?.closest?.('#intro, #relayInfoPanel')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, {capture: true, passive: false});
  }

  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, {subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden']});
  window.addEventListener('load', apply, {once: true});
  apply();
})();
