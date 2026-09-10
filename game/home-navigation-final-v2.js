(() => {
  'use strict';
  if (window.__relayHomeNavigationFinalV2) return;
  window.__relayHomeNavigationFinalV2 = true;

  const homeVisible = () => {
    const intro = document.getElementById('intro');
    return !!intro && !intro.classList.contains('hidden');
  };

  const focusHome = () => document.querySelector('#intro [data-v3-options], #intro [data-v3-faq], #intro [data-v3-exit]');

  const activateLegacy = selector => {
    const target = document.querySelector(selector);
    if (!(target instanceof HTMLElement) || target.disabled) return false;
    try {
      HTMLElement.prototype.click.call(target);
      return true;
    } catch {
      return false;
    }
  };

  let lastAction = '';
  let lastAt = 0;

 const route = (event) => {
  if (!homeVisible()) return;

  const button = event.target?.closest?.(
    '[data-v3-options],[data-v3-faq],[data-v3-exit]'
  );

  if (!button) return;

  const action = button.matches('[data-v3-options]')
    ? 'options'
    : button.matches('[data-v3-faq]')
      ? 'faq'
      : 'exit';

  const now = performance.now();

  if (action === lastAction && now - lastAt < 300) {
    event.preventDefault();
    event.stopImmediatePropagation?.();
    return;
  }

  lastAction = action;
  lastAt = now;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();

  if (action === 'options') {
    const panel = document.getElementById('titlePanel');
    const content = document.getElementById('titlePanelContent');

    if (!panel || !content) return;

    panel.classList.remove('hidden');
    panel.removeAttribute('hidden');
    panel.setAttribute('aria-hidden', 'false');

    /*
     * Let unified-options-ui-v1 render the canonical Options UI.
     * The legacy menu must not be used as the visible surface.
     */
    queueMicrotask(() => {
      document.dispatchEvent(
        new CustomEvent('relay-open-home-options', {
          detail: {
            panel,
            content,
            source: 'home',
          },
        })
      );
    });

    return;
  }

  if (action === 'faq') {
    activateLegacy('[data-relay-info="faq"]');
    return;
  }

  activateLegacy('#exitTitle');
};

  document.addEventListener('pointerup', route, { capture: true, passive: false });
  document.addEventListener('click', route, { capture: true, passive: false });

  document.addEventListener('keydown', event => {
    if (!homeVisible()) return;
    if (event.key === 'Escape') {
      const title = document.getElementById('titlePanel');
      const faq = document.getElementById('relayInfoPanel');
      if (!title?.classList.contains('hidden')) title.classList.add('hidden');
      if (!faq?.classList.contains('hidden')) faq.classList.add('hidden');
    }
  }, { capture: true });

  window.relayHomeNavigationV2 = {
    focusHome,
    options: () => activateLegacy('[data-title-panel="controls"]'),
    faq: () => activateLegacy('[data-relay-info="faq"]'),
    exit: () => activateLegacy('#exitTitle'),
  };
})();
