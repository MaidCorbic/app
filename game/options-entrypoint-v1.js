(() => {
  'use strict';
  if (window.__relayOptionsEntrypointV1) return;
  window.__relayOptionsEntrypointV1 = true;

  const open = () => {
    const panel = document.getElementById('titlePanel');
    const heading = document.getElementById('titlePanelHeading');
    if (!panel || !heading) return false;
    panel.classList.remove('hidden');
    panel.classList.add('relay-options-opening');
    heading.textContent = 'OPTIONS';
    heading.className = 'relay-stable-title';
    window.dispatchEvent(new CustomEvent('relay-options-open', { detail: { panel } }));
    requestAnimationFrame(() => panel.classList.remove('relay-options-opening'));
    return true;
  };

  const installSurfacePolish = () => {
    if (document.getElementById('relay-options-surface-polish-v1')) return;
    const style = document.createElement('style');
    style.id = 'relay-options-surface-polish-v1';
    style.textContent = `
      #titlePanel:has(.home-tutorial-content){padding:14px!important;box-sizing:border-box}
      #titlePanel:has(.home-tutorial-content) .title-panel-card{width:min(940px,92vw)!important;max-width:none!important;max-height:calc(100dvh - 28px)!important;min-height:min(680px,calc(100dvh - 28px))!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;border-radius:20px!important}
      #titlePanel:has(.home-tutorial-content) #titlePanelContent{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important}
      #titlePanel:has(.home-tutorial-content) .tutorial-hero b{font-size:18px!important}
      #titlePanel:has(.home-tutorial-content) .tutorial-hero p{font-size:11px!important;line-height:1.65!important}
      #titlePanel:has(.home-tutorial-content) .tutorial-step b{font-size:11px!important}
      #titlePanel:has(.home-tutorial-content) .tutorial-step p{font-size:10px!important;line-height:1.6!important}
      #titlePanel:has(.home-tutorial-content) .tutorial-category summary{font-size:12px!important;min-height:34px!important}
      #titlePanel:has(.home-tutorial-content) .tutorial-category ul{font-size:10.5px!important;line-height:1.72!important}
      #titlePanel:has(.home-tutorial-content) .tutorial-key{min-width:26px!important;min-height:28px!important;padding:4px 8px!important;font-size:9.5px!important}
      #titlePanel:has(.home-tutorial-content) .tutorial-foot{font-size:10.5px!important;line-height:1.65!important}
      @media(max-width:700px){#titlePanel:has(.home-tutorial-content){padding:6px!important}#titlePanel:has(.home-tutorial-content) .title-panel-card{width:96vw!important;max-width:96vw!important;max-height:calc(100dvh - 12px)!important;min-height:0!important;border-radius:16px!important}#titlePanel:has(.home-tutorial-content) .tutorial-hero b{font-size:14px!important}#titlePanel:has(.home-tutorial-content) .tutorial-hero p{font-size:9.5px!important;line-height:1.58!important}#titlePanel:has(.home-tutorial-content) .tutorial-step b{font-size:9.5px!important}#titlePanel:has(.home-tutorial-content) .tutorial-step p{font-size:9px!important;line-height:1.55!important}#titlePanel:has(.home-tutorial-content) .tutorial-category summary{font-size:10px!important}#titlePanel:has(.home-tutorial-content) .tutorial-category ul{font-size:9.5px!important;line-height:1.62!important}#titlePanel:has(.home-tutorial-content) .tutorial-key{min-width:22px!important;min-height:24px!important;font-size:8.5px!important}}
    `;
    document.head.appendChild(style);
  };

  const bind = () => {
    installSurfacePolish();
    document.addEventListener('click', event => {
      const target = event.target;
      const button = target instanceof Element ? target.closest('[data-title-panel="controls"]') : null;
      if (!button) return;
      event.preventDefault();
      const opened = open();
      if (opened) event.stopImmediatePropagation();
    }, true);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
