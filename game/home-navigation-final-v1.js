(() => {
  'use strict';
  if (window.__relayHomeNavigationFinalV1) return;
  window.__relayHomeNavigationFinalV1 = true;

  const homeVisible = () => !document.getElementById('intro')?.classList.contains('hidden');
  const clickLegacy = selector => {
    const target = document.querySelector(selector);
    if (!target || target.disabled) return false;
    HTMLElement.prototype.click.call(target);
    return true;
  };

  const route = event => {
    const button = event.target?.closest?.('[data-v3-options],[data-v3-faq],[data-v3-exit]');
    if (!button || !homeVisible()) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (button.matches('[data-v3-options]')) clickLegacy('[data-title-panel="controls"]');
    else if (button.matches('[data-v3-faq]')) clickLegacy('[data-relay-info="faq"]');
    else if (button.matches('[data-v3-exit]')) clickLegacy('#exitTitle');
  };

  document.addEventListener('pointerup', route, { capture: true, passive: false });
  document.addEventListener('click', route, { capture: true });

  const recoverHome = () => {
    const intro = document.getElementById('intro');
    const titlePanel = document.getElementById('titlePanel');
    const faqPanel = document.getElementById('relayInfoPanel');
    if (!intro || !titlePanel || !faqPanel) return;
    if (!intro.classList.contains('hidden')) return;
    if (!titlePanel.classList.contains('hidden') || !faqPanel.classList.contains('hidden')) return;
  };
  new MutationObserver(recoverHome).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden'] });
})();
