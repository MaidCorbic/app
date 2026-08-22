/* UPDATE 25 — DASH MOBILE INPUT COMPATIBILITY
   The authoritative mobile-controls-controller owns DASH. This module remains
   as a compatibility fallback for legacy, non-owned control trees only.
*/
(() => {
  if (typeof window === 'undefined' || window.__relayDashMobileInputV1) return;
  window.__relayDashMobileInputV1 = true;

  const dispatchDash = () => {
    window.dispatchEvent(new CustomEvent('relay:new-gameplay-dash', { detail: { source: 'legacy-mobile' } }));
  };

  const bind = root => {
    if (!root || root.__relayDashMobileBound) return;
    root.__relayDashMobileBound = true;
    root.addEventListener('pointerdown', event => {
      const button = event.target.closest?.('[data-mobile-action="dash"]');
      if (!button) return;
      // New controls are cloned and explicitly owned by the authoritative
      // controller, so never dispatch a second dash for the same tap.
      if (button.closest('.mobile-controls')?.dataset.mobileControlsOwner === 'controller') return;
      event.preventDefault();
      dispatchDash();
    }, { passive: false });
  };

  const ready = () => bind(document.getElementById('play'));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
  window.addEventListener('relay:gameplay-core-ready', ready, { passive: true });
})();
