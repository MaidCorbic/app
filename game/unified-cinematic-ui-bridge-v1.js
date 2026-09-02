(() => {
  'use strict';
  if (window.__relayUnifiedCinematicUiBridgeV1) return;
  window.__relayUnifiedCinematicUiBridgeV1 = true;

  const visible = id => {
    const node = document.getElementById(id);
    return !!node && !node.classList.contains('hidden');
  };

  const isUnified = id => {
    const node = document.getElementById(id);
    return !!node?.classList.contains('relay-cinematic-overlay') && !!node.querySelector('.relay-cinematic-panel, .relay-pause-shell');
  };

  const reconcile = () => {
    const api = window.relayUnifiedCinematicUI;
    if (!api) return;
    const title = document.getElementById('titlePanel');
    const info = document.getElementById('relayInfoPanel');
    const pause = document.getElementById('pauseMenu');

    if (title && visible('titlePanel') && !isUnified('titlePanel')) {
      api.openOptions();
      return;
    }
    if (info && visible('relayInfoPanel') && !isUnified('relayInfoPanel')) {
      api.openFAQ();
      return;
    }
    if (pause && visible('pauseMenu') && !isUnified('pauseMenu')) {
      api.openPause('resume');
    }
  };

  const start = () => {
    const observer = new MutationObserver(reconcile);
    observer.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:['class','hidden','style'] });
    reconcile();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else window.setTimeout(start, 0);
})();
