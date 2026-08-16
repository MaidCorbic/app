(() => {
  if (window.__relayHomeOptionsClickFixV2) return;
  window.__relayHomeOptionsClickFixV2 = true;

  const openNewOptions = event => {
    const trigger = event.target?.closest?.('[data-title-panel="controls"]');
    if (!trigger) return;

    // Own the click before the legacy Home controls handler. We intentionally
    // do not recreate or modify the Options UI here; home-options.js remains
    // the single renderer. This only guarantees that its target panel opens.
    event.preventDefault();
    event.stopImmediatePropagation();

    const panel = document.getElementById('titlePanel');
    const heading = document.getElementById('titlePanelHeading');
    const eyebrow = document.getElementById('titlePanelEyebrow');
    const overlay = document.getElementById('modalOverlay');
    if (!panel || !heading) return;

    panel.classList.remove('hidden');
    panel.classList.add('home-options-exclusive');
    heading.textContent = 'OPTIONS';
    if (eyebrow) eyebrow.textContent = 'RELAY RUNNER // SYSTEM SETTINGS';
    overlay?.classList.add('active');

    // home-options.js observes the panel/content and renders the exact
    // existing Options markup. These two frames cover both sync and deferred
    // legacy DOM updates without changing any of that markup.
    window.dispatchEvent(new CustomEvent('relay-open-options'));
    requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('relay-open-options')));
  };

  const bind = () => document.addEventListener('click', openNewOptions, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
