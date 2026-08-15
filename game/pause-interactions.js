/* Mobile-safe Pause navigation. Keeps the existing renderPanel() / tab logic intact. */
(() => {
  const bind = () => {
    const nav = document.querySelector('#pauseMenu nav');
    const panel = document.querySelector('#panelContent');
    if (!nav || !panel) return;

    const markAndClick = element => {
      element.dataset.mobileActivated = '1';
      element.click();
      window.setTimeout(() => delete element.dataset.mobileActivated, 0);
    };

    // Prevent the browser's follow-up synthetic click from firing a second time.
    document.addEventListener('click', event => {
      const element = event.target.closest('[data-mobile-activated]');
      if (!element) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      delete element.dataset.mobileActivated;
    }, true);

    // On touch devices, explicitly activate the existing tab handler on pointerup.
    // This keeps every button mapped to its original data-tab section.
    nav.addEventListener('pointerup', event => {
      if (event.pointerType === 'mouse') return;
      const tab = event.target.closest('.tab[data-tab]');
      if (!tab || tab.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      markAndClick(tab);
    }, { passive: false });

    // Make dynamically-rendered Settings and terminal controls deterministic on touch.
    panel.addEventListener('pointerup', event => {
      if (event.pointerType === 'mouse') return;
      const control = event.target.closest('[data-setting], [data-mission], [data-contract], [data-campaign-mission], [data-gadget], [data-upgrade], [data-build-item], [data-weapon], [data-modifier], [data-claim-challenge], [data-login-reward], #resume, #replayTutorial');
      if (!control || control.disabled) return;
      // Range inputs/selects need their native pointer behavior; do not synthesize clicks for them.
      if (control.matches('input, select')) return;
      event.preventDefault();
      event.stopPropagation();
      markAndClick(control);
    }, { passive: false });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
