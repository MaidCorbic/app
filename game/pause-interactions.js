/* Reliable touch interaction layer for the in-game pause terminal. */
(() => {
  const bind = () => {
    const pause = document.querySelector('#pauseMenu');
    const nav = pause?.querySelector('nav');
    const panel = pause?.querySelector('#panelContent');
    if (!pause || !nav || !panel) return;

    // Mobile browsers can emit pointerup + a later synthetic click. Execute
    // the real DOM click ourselves, then ignore only that later trusted click.
    const suppressSynthetic = new WeakSet();

    document.addEventListener('click', event => {
      if (!event.isTrusted) return;
      const target = event.target instanceof Element ? event.target.closest('button, [role="button"]') : null;
      if (!target || !suppressSynthetic.has(target)) return;
      suppressSynthetic.delete(target);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    const activate = button => {
      if (!button || button.disabled) return;
      suppressSynthetic.add(button);
      // .click() is synchronous, so existing onclick/delegated click handlers
      // run normally before the browser can deliver the synthetic click.
      button.click();
      window.setTimeout(() => suppressSynthetic.delete(button), 500);
    };

    const isTouchPointer = event => event.pointerType === 'touch' || event.pointerType === 'pen';

    // Pause tabs, including dynamically-added Contracts/Campaign/Loadout/Challenges.
    nav.addEventListener('pointerup', event => {
      if (!isTouchPointer(event)) return;
      const tab = event.target instanceof Element ? event.target.closest('.tab[data-tab]') : null;
      if (!tab || tab.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      activate(tab);
    }, { passive: false });

    // Delegated handler for every button rendered inside renderPanel(). This
    // remains valid when #panelContent is replaced with innerHTML.
    panel.addEventListener('pointerup', event => {
      if (!isTouchPointer(event)) return;
      const target = event.target instanceof Element ? event.target : null;
      const control = target?.closest('button, [role="button"]');
      if (!control || control.disabled || control.matches('.tab[data-tab]')) return;
      event.preventDefault();
      event.stopPropagation();
      activate(control);
    }, { passive: false });

    // Keep range sliders/selects native and touch-friendly.
    panel.addEventListener('pointerdown', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.matches('input[type="range"], select')) event.stopPropagation();
    }, { passive: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
