(() => {
  'use strict';

  const loadSingleplayer = async event => {
    const trigger = event.target?.closest?.('[data-sp-open]');
    if (!trigger) return;

    event.preventDefault();
    event.stopPropagation();

    try {
      await import('./singleplayer-terminal.js');
      window.relayOpenSingleplayer?.();
    } catch (error) {
      console.error('[Singleplayer] failed to load terminal', error);
    }
  };

  document.addEventListener('click', loadSingleplayer, true);
})();