(() => {
  'use strict';

  const loadSingleplayer = async event => {
    const trigger = event.target?.closest?.('[data-sp-open]');
    if (!trigger) return;

    event.preventDefault();
    event.stopPropagation();

    try {
      await import('./singleplayer-terminal.js');
      window.dispatchEvent(new CustomEvent('relay-singleplayer-open'));
    } catch (error) {
      console.error('[Singleplayer] failed to load terminal', error);
    }
  };

  document.addEventListener('click', loadSingleplayer, true);
})();