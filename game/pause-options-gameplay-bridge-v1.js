/* Relay Runner — pause/options interaction bridge.
   Presentation-only bindings: update the existing state/UI immediately without rebuilding gameplay. */
(() => {
  'use strict';
  if (window.__relayPauseOptionsGameplayBridgeV1) return;
  window.__relayPauseOptionsGameplayBridgeV1 = true;

  const boot = () => {
    const menu = document.getElementById('pauseMenu');
    if (!menu) return;

    const stop = event => {
      const el = event.target instanceof Element ? event.target : null;
      if (el?.matches('button,input,select,a')) event.stopPropagation();
    };
    menu.addEventListener('pointerdown', stop, true);
    menu.addEventListener('click', stop, true);

    const notify = message => {
      let node = menu.querySelector('.relay-options-feedback');
      if (!node) {
        node = document.createElement('div');
        node.className = 'relay-options-feedback';
        menu.appendChild(node);
      }
      node.textContent = message;
      node.classList.add('is-visible');
      clearTimeout(node._timer);
      node._timer = setTimeout(() => node.classList.remove('is-visible'), 1100);
    };

    const sync = () => window.dispatchEvent(new CustomEvent('relay-options-sync'));

    menu.addEventListener('click', event => {
      const el = event.target instanceof Element ? event.target.closest('[data-unified-toggle],[data-unified-action]') : null;
      if (!el) return;
      if (el.dataset.unifiedAction) {
        const action = el.dataset.unifiedAction;
        if (action === 'resume') menu.querySelector('[data-tab="resume"]')?.click();
        if (action === 'restart') document.querySelector('#restart')?.click();
        if (action === 'exit') document.querySelector('#exitTitle')?.click();
        notify(action.toUpperCase());
      }
      sync();
    }, true);

    menu.addEventListener('input', event => {
      const input = event.target instanceof HTMLInputElement ? event.target : null;
      if (!input?.dataset.unifiedRange) return;
      const value = Number(input.value);
      if (!Number.isFinite(value)) return;
      input.closest('.relay-option-card')?.querySelector('.relay-range-value')?.replaceChildren(document.createTextNode(`${Math.round(value * 100)}%`));
      sync();
    }, true);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
