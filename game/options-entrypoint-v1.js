(() => {
  'use strict';
  if (window.__relayOptionsEntrypointV1) return;
  window.__relayOptionsEntrypointV1 = true;

  const open = () => {
    const panel = document.getElementById('titlePanel');
    const heading = document.getElementById('titlePanelHeading');
    if (!panel || !heading) return false;
    panel.classList.remove('hidden');
    heading.textContent = 'OPTIONS';
    heading.className = 'relay-stable-title';
    window.dispatchEvent(new CustomEvent('relay-options-open', { detail: { panel } }));
    return true;
  };

  const bind = () => {
    document.addEventListener('click', event => {
      const target = event.target;
      const button = target instanceof Element ? target.closest('[data-title-panel="controls"]') : null;
      if (!button) return;
      event.preventDefault();
      open();
    }, true);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
