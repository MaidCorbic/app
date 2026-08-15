/* Mobile-safe Pause navigation. Keeps the existing renderPanel() / tab logic intact. */
(() => {
  const bind = () => {
    const nav = document.querySelector('#pauseMenu nav');
    const panel = document.querySelector('#panelContent');
    if (!nav || !panel) return;

    // On touch devices, explicitly activate the existing button handler on pointerup.
    // This avoids relying on the browser's delayed synthetic click when overlays are present.
    nav.addEventListener('pointerup', event => {
      if (event.pointerType === 'mouse') return;
      const tab = event.target.closest('.tab[data-tab]');
      if (!tab || tab.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      tab.click();
    }, { passive: false });

    // Make dynamically-rendered Settings controls deterministic on touch.
    panel.addEventListener('pointerup', event => {
      if (event.pointerType === 'mouse') return;
      const control = event.target.closest('[data-setting], [data-mission], [data-contract], [data-campaign-mission], [data-gadget], [data-upgrade], [data-build-item], [data-weapon], [data-modifier], [data-claim-challenge], [data-login-reward], #resume, #replayTutorial');
      if (!control || control.disabled) return;
      // Range inputs/selects need their native pointer behavior; do not synthesize clicks for them.
      if (control.matches('input, select')) return;
      event.preventDefault();
      event.stopPropagation();
      control.click();
    }, { passive: false });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
