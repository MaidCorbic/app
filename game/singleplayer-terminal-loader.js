(() => {
  'use strict';

  const loadSingleplayer = async event => {
    const trigger = event.target?.closest?.('[data-sp-open]');
    if (!trigger) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      await import('./singleplayer-terminal.js');

      const open = window.relayOpenSingleplayer;
      if (typeof open !== 'function') {
        console.error('[Singleplayer] terminal API missing');
        return;
      }

      open();
    } catch (error) {
      console.error('[Singleplayer] failed to load terminal', error);
    }
  };

  document.addEventListener('click', loadSingleplayer, true);
})();
