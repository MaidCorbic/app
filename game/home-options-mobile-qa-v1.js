/* Mobile QA guard: keep native panel scrolling reliable while isolating zipper drag. */
(() => {
  if (window.__relayHomeOptionsMobileQAV1) return;
  window.__relayHomeOptionsMobileQAV1 = true;

  const style = document.createElement('style');
  style.textContent = `
    @media (max-width:700px){
      #titlePanelContent{overflow-x:hidden!important;overflow-y:auto!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-y:contain!important;min-height:0!important}
      #homeOptionsScrollbar{touch-action:none!important;-webkit-user-select:none!important;user-select:none!important}
      #homeOptionsScrollbar .home-scroll-thumb{touch-action:none!important;-webkit-user-select:none!important;user-select:none!important}
      #titlePanelContent *{max-width:100%}
      #titlePanelContent .home-opt{min-width:0!important}
      #titlePanelContent .home-opt-copy{min-width:0!important}
      #titlePanelContent .home-opt-copy b{max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      #titlePanelContent .home-opt-copy small{max-width:100%!important;overflow-wrap:anywhere!important}
      #titlePanelContent input[type="range"]{touch-action:pan-x!important}
    }
    @media (max-width:380px){
      #titlePanelContent .home-opt{grid-template-columns:minmax(0,1fr) 78px!important;gap:7px!important}
      #titlePanelContent .home-opt button{width:78px!important;min-width:78px!important}
    }
  `;
  document.head.appendChild(style);

  const sync = () => {
    const panel = document.getElementById('titlePanel');
    const content = document.getElementById('titlePanelContent');
    const rail = document.getElementById('homeOptionsScrollbar');
    if (!panel || !content) return;
    const mobile = matchMedia('(max-width:700px)').matches;
    if (!mobile) return;
    content.style.setProperty('touch-action','pan-y','important');
    content.style.setProperty('overflow-y','auto','important');
    content.style.setProperty('overflow-x','hidden','important');
    content.style.setProperty('-webkit-overflow-scrolling','touch','important');
    if (rail) {
      rail.style.setProperty('touch-action','none','important');
      rail.querySelector('.home-scroll-thumb')?.style.setProperty('touch-action','none','important');
    }
  };

  const boot = () => {
    sync();
    const panel = document.getElementById('titlePanel');
    if (panel) new MutationObserver(sync).observe(panel,{attributes:true,childList:true,subtree:true});
    addEventListener('resize',sync,{passive:true});
    addEventListener('orientationchange',sync,{passive:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
