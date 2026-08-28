(() => {
  'use strict';

  // SINGLE OPTIONS OWNER CONTRACT
  // This entrypoint is presentation-only. The existing unified Options controller
  // owns opening, closing and gameplay setting events. Keeping a second click
  // handler here was producing the old/new duplicated Options surface.
  if (window.__relayOptionsEntrypointV2) return;
  window.__relayOptionsEntrypointV2 = true;

  const installSurfacePolish = () => {
    if (document.getElementById('relay-options-surface-polish-v2')) return;

    const style = document.createElement('style');
    style.id = 'relay-options-surface-polish-v2';
    style.textContent = `
      #titlePanel:has(.home-tutorial-content){
        box-sizing:border-box!important;
      }
      #titlePanel:has(.home-tutorial-content) .title-panel-card{
        width:min(940px,92vw)!important;
        max-width:none!important;
        display:flex!important;
        flex-direction:column!important;
        box-sizing:border-box!important;
      }
      #titlePanel:has(.home-tutorial-content) #titlePanelContent{
        flex:1 1 auto!important;
        min-height:0!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        -webkit-overflow-scrolling:touch!important;
        overscroll-behavior:contain!important;
        scrollbar-gutter:stable!important;
      }
      #titlePanel:has(.home-tutorial-content) .tutorial-hero p,
      #titlePanel:has(.home-tutorial-content) .tutorial-step p,
      #titlePanel:has(.home-tutorial-content) .tutorial-foot{
        overflow-wrap:anywhere!important;
      }
      @media(max-width:700px){
        #titlePanel:has(.home-tutorial-content){
          position:fixed!important;
          inset:0!important;
          width:100vw!important;
          height:100dvh!important;
          max-height:100dvh!important;
          padding:6px!important;
          overflow-y:auto!important;
          overflow-x:hidden!important;
          -webkit-overflow-scrolling:touch!important;
          touch-action:pan-y!important;
          overscroll-behavior-y:contain!important;
        }
        #titlePanel:has(.home-tutorial-content) .title-panel-card{
          width:96vw!important;
          max-width:96vw!important;
          min-height:0!important;
          max-height:none!important;
          height:auto!important;
          overflow:visible!important;
          border-radius:16px!important;
        }
        #titlePanel:has(.home-tutorial-content) #titlePanelContent{
          flex:none!important;
          height:auto!important;
          max-height:none!important;
          overflow:visible!important;
          touch-action:pan-y!important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installSurfacePolish, { once:true });
  } else {
    installSurfacePolish();
  }
})();
