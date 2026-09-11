(() => {
  'use strict';
  if (window.__relayHomeNavigationFinalV2) return;
  window.__relayHomeNavigationFinalV2 = true;

  const homeVisible = () => {
    const intro = document.getElementById('intro');
    return !!intro && !intro.classList.contains('hidden');
  };

  const getAction = button => {
    if (!button) return null;
    if (button.matches('[data-home-v4-action="options"],[data-v3-options]')) return 'options';
    if (button.matches('[data-home-v4-action="faq"],[data-v3-faq]')) return 'faq';
    if (button.matches('[data-home-v4-action="update"],[data-relay-info="update"],[data-v3-update]')) return 'update';
    if (button.matches('[data-home-v4-action="exit"],[data-v3-exit]')) return 'exit';
    return null;
  };

  const callRouter = (action, event) => {
    if (typeof window.relayHomeInfoV1?.open === 'function' && (action === 'faq' || action === 'update')) {
      return window.relayHomeInfoV1.open(action);
    }

    if (action === 'options') {
      const panel = document.getElementById('titlePanel');
      const content = document.getElementById('titlePanelContent');
      if (!panel || !content) return false;
      panel.classList.remove('hidden');
      panel.removeAttribute('hidden');
      panel.setAttribute('aria-hidden', 'false');
      document.dispatchEvent(new CustomEvent('relay-open-home-options', { detail: { panel, content, source: 'home-router' } }));
      return true;
    }

    const selector = action === 'faq' ? '[data-relay-info="faq"]' : action === 'update' ? '[data-relay-info="update"]' : '#exitTitle';
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

  const route = event => {
    if (!homeVisible()) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('[data-home-v4-action],[data-v3-options],[data-v3-faq],[data-v3-update],[data-v3-exit]');
    const action = getAction(button);
    if (!action) return;

    const now = performance.now();
    if (action === lastAction && now - lastAt < 350) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      return;
    }
    lastAction = action;
    lastAt = now;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    callRouter(action, event);
  };

  document.addEventListener('pointerup', route, { capture: true, passive: false });
  document.addEventListener('click', route, { capture: true, passive: false });

  document.addEventListener('keydown', event => {
    if (!homeVisible() || event.key !== 'Escape') return;
    document.getElementById('titlePanel')?.classList.add('hidden');
    document.getElementById('relayInfoPanel')?.classList.add('hidden');
  }, { capture: true });

  window.relayHomeNavigationV2 = Object.freeze({
    focusHome: () => document.querySelector('#intro [data-home-v4-action], #intro [data-v3-options], #intro [data-v3-faq], #intro [data-v3-exit]'),
    options: () => callRouter('options'),
    faq: () => callRouter('faq'),
    update: () => callRouter('update'),
    exit: () => callRouter('exit'),
  });
})();
