(() => {
  'use strict';

  // Presentation-only entrypoint. Unified Options owns the actual settings state.
  if (window.__relayOptionsEntrypointV3) return;
  window.__relayOptionsEntrypointV3 = true;

  const installSurfacePolish = () => {
    if (document.getElementById('relay-options-surface-polish-v3')) return;
    const style = document.createElement('style');
    style.id = 'relay-options-surface-polish-v3';
    style.textContent = `
      /* Kill the old title-panel entrance transform. It caused the first-open
         Options frame to tilt/settle repeatedly on mobile. */
      #titlePanel.relay-options-stable,
      #titlePanel.relay-options-stable .title-panel-card,
      #titlePanel.relay-options-stable .relay-stable-shell{
        transform:none!important;
        rotate:none!important;
        scale:1!important;
        animation:none!important;
      }
      #titlePanel.relay-options-stable #titlePanelContent{
        overflow:hidden!important;
        min-height:0!important;
        transform:none!important;
      }
      #titlePanel.relay-options-stable .title-panel-close{
        z-index:100!important;
        display:grid!important;
        place-items:center!important;
        pointer-events:auto!important;
      }
      @media(max-width:700px){
        #titlePanel.relay-options-stable{
          position:fixed!important;
          inset:0!important;
          width:100vw!important;
          height:100dvh!important;
          max-height:100dvh!important;
          padding:8px!important;
          overflow:hidden!important;
          transform:none!important;
        }
        #titlePanel.relay-options-stable .title-panel-card{
          width:96vw!important;
          max-width:96vw!important;
          height:min(96dvh,760px)!important;
          max-height:96dvh!important;
          min-height:0!important;
          padding:0!important;
          overflow:hidden!important;
          transform:none!important;
          animation:none!important;
        }
        #titlePanel.relay-options-stable .relay-stable-head{
          padding-right:58px!important;
        }
        #titlePanel.relay-options-stable .title-panel-close{
          top:8px!important;
          right:8px!important;
          width:42px!important;
          height:42px!important;
          min-width:42px!important;
          border-radius:10px!important;
          background:rgba(3,10,18,.96)!important;
          color:#eefbff!important;
          border-color:rgba(141,244,255,.3)!important;
          font-size:26px!important;
        }
        #titlePanel.relay-options-stable .relay-stable-scroll{
          min-height:0!important;
          height:100%!important;
          overflow-y:auto!important;
          overflow-x:hidden!important;
          -webkit-overflow-scrolling:touch!important;
          touch-action:pan-y!important;
          overscroll-behavior:contain!important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installSurfacePolish, { once:true });
  else installSurfacePolish();
})();
