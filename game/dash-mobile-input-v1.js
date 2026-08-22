/* UPDATE 25 — DASH MOBILE INPUT
   Makes the visible DASH touch control feed the authoritative dash runtime event.
   The physics/velocity implementation remains owned by dash-runtime-bridge-v1.js.
*/
(() => {
  if (typeof window === 'undefined' || window.__relayDashMobileInputV1) return;
  window.__relayDashMobileInputV1 = true;

  const dispatchDash = () => {
    try { window.dispatchEvent(new CustomEvent('relay:new-gameplay-dash', { detail: { source: 'mobile' } })); } catch {}
  };

  const bind = root => {
    if (!root || root.__relayDashMobileBound) return;
    root.__relayDashMobileBound = true;
    root.addEventListener('pointerdown', event => {
      const button = event.target.closest?.('[data-mobile-action="dash"]');
      if (!button) return;
      event.preventDefault();
      dispatchDash();
    }, { passive: false });
  };

  const ready = () => bind(document.getElementById('play'));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
  window.addEventListener('relay:gameplay-core-ready', ready, { passive: true });
})();
