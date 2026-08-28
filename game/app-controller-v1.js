/* Relay Runner application controller — single boundary between Home and gameplay. */
(() => {
  if (window.RelayApp?.controller) return;

  const get = id => document.getElementById(id);
  const isHome = () => { const el = get('intro'); return !!el && !el.classList.contains('hidden'); };
  const isOpen = id => { const el = get(id); return !!el && !el.classList.contains('hidden'); };
  const click = id => get(id)?.click();

  const controller = {
    state: () => ({ home: isHome(), options: isOpen('titlePanel'), info: isOpen('relayInfoPanel'), gameplay: !isHome() }),
    home: {
      play: () => click('start'),
      continue: () => click('continue'),
      exit: () => click('exitTitle'),
      options: () => document.querySelector('[data-title-panel="controls"]')?.click(),
      tutorial: () => document.querySelector('[data-title-panel="tutorial"]')?.click(),
      faq: () => document.querySelector('[data-relay-info="faq"]')?.click()
    },
    closePanels: () => {
      get('closeTitlePanel')?.click();
      document.querySelector('[data-relay-close]')?.click();
    },
    gameplay: {
      pause: () => click('pause'),
      returnHome: () => click('returnTitle'),
      retry: () => click('retry'),
      nextRun: () => click('again'),
      nextMission: () => click('nextMission')
    }
  };

  window.RelayApp = Object.freeze({controller});
  window.dispatchEvent(new CustomEvent('relay-app-controller-ready', {detail: controller}));
})();
