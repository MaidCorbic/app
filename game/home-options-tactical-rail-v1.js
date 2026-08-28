/* AAA dark-tactical mobile options rail: 8 segments + drag/snap feedback. */
(() => {
  if (window.__relayHomeTacticalRailV1) return;
  window.__relayHomeTacticalRailV1 = true;

  const style = document.createElement('style');
  style.textContent = `
    #homeOptionsScrollbar.tactical-rail{width:22px!important;right:0!important;display:none;pointer-events:auto;touch-action:none}
    #homeOptionsScrollbar.tactical-rail.is-visible{display:block}
    #homeOptionsScrollbar.tactical-rail .home-scroll-track{inset:0 7px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
    #homeOptionsScrollbar.tactical-rail .home-scroll-track::before{content:"";position:absolute;left:50%;top:2px;bottom:2px;width:2px;transform:translateX(-50%);background:linear-gradient(180deg,transparent,rgba(141,244,255,.22) 8%,rgba(141,244,255,.22) 92%,transparent);box-shadow:0 0 9px rgba(56,189,248,.12)}
    #homeOptionsScrollbar.tactical-rail .home-scroll-track::after{content:"";position:absolute;left:50%;top:0;bottom:0;width:18px;transform:translateX(-50%);background:repeating-linear-gradient(180deg,transparent 0 8%,rgba(141,244,255,.25) 8% 8.8%,transparent 8.8% 12.5%);opacity:.75}
    #homeOptionsScrollbar.tactical-rail .tactical-segment{position:absolute;left:3px;width:16px;height:12px;display:grid;place-items:center;color:rgba(112,133,154,.7);font:800 6px/1 "DM Mono",monospace;letter-spacing:.4px;border:1px solid rgba(141,244,255,.12);border-radius:3px;background:rgba(4,12,21,.82);box-shadow:inset 0 1px rgba(255,255,255,.03);transition:color .14s ease,border-color .14s ease,box-shadow .14s ease,transform .14s ease,background .14s ease}
    #homeOptionsScrollbar.tactical-rail .tactical-segment.is-active{color:#e9fdff;border-color:rgba(141,244,255,.72);background:rgba(16,46,63,.92);box-shadow:0 0 9px rgba(141,244,255,.38),inset 0 0 7px rgba(141,244,255,.1);transform:scale(1.08)}
    #homeOptionsScrollbar.tactical-rail .tactical-segment.is-passed{color:rgba(141,244,255,.72);border-color:rgba(141,244,255,.28)}
    #homeOptionsScrollbar.tactical-rail .home-scroll-thumb{left:2px;right:2px;min-height:46px!important;border:1px solid rgba(141,244,255,.9);background:linear-gradient(180deg,#eaffff,rgba(141,244,255,.82) 45%,rgba(48,151,190,.82));box-shadow:0 0 12px rgba(141,244,255,.65),0 0 28px rgba(56,189,248,.2),inset 0 1px rgba(255,255,255,.95);z-index:3}
    #homeOptionsScrollbar.tactical-rail .home-scroll-thumb::before{height:2px;box-shadow:0 -5px rgba(255,255,255,.3),0 5px rgba(255,255,255,.3)}
    #homeOptionsScrollbar.tactical-rail.is-dragging .home-scroll-thumb{filter:brightness(1.25);box-shadow:0 0 16px rgba(141,244,255,.9),0 0 34px rgba(56,189,248,.3),inset 0 1px rgba(255,255,255,1)}
    #homeOptionsScrollbar.tactical-rail .tactical-readout{position:absolute;right:25px;top:50%;transform:translateY(-50%);padding:4px 6px;color:#8df4ff;background:rgba(3,10,18,.94);border:1px solid rgba(141,244,255,.24);border-radius:4px;font:900 6px/1 "DM Mono",monospace;letter-spacing:.8px;opacity:0;pointer-events:none;white-space:nowrap;transition:opacity .14s ease,transform .14s ease}
    #homeOptionsScrollbar.tactical-rail.is-dragging .tactical-readout{opacity:1;transform:translate(-2px,-50%)}
    @media(max-width:700px){#homeOptionsScrollbar.tactical-rail{right:-1px!important;width:25px!important}.home-options-final{padding-right:9px!important}.home-opt{margin-right:3px!important}.home-section{padding-right:4px!important}}
    @media(max-width:380px){#homeOptionsScrollbar.tactical-rail{width:22px!important}.tactical-segment{transform:scale(.92)}}
    @media(prefers-reduced-motion:reduce){#homeOptionsScrollbar.tactical-rail .tactical-segment,#homeOptionsScrollbar.tactical-rail .tactical-readout{transition:none!important}}
  `;
  document.head.appendChild(style);

  let rail, thumb, track, content, card, segments, readout;
  let lastActive = -1;
  let observer;

  const install = () => {
    content = document.getElementById('titlePanelContent');
    card = document.querySelector('#titlePanel .title-panel-card');
    rail = document.getElementById('homeOptionsScrollbar');
    if (!content || !card || !rail || rail.dataset.tacticalReady === '1') return;
    rail.dataset.tacticalReady = '1';
    rail.classList.add('tactical-rail');
    track = rail.querySelector('.home-scroll-track');
    thumb = rail.querySelector('.home-scroll-thumb');
    if (!track || !thumb) return;

    segments = Array.from({length:8}, (_, i) => {
      const el = document.createElement('span');
      el.className = 'tactical-segment';
      el.textContent = String(i + 1).padStart(2, '0');
      el.dataset.segment = String(i);
      track.appendChild(el);
      return el;
    });
    readout = document.createElement('span');
    readout.className = 'tactical-readout';
    readout.textContent = 'SCROLL 01 / 08';
    rail.appendChild(readout);

    content.addEventListener('scroll', sync, {passive:true});
    rail.addEventListener('pointerdown', onRailDown, {passive:false});
    window.addEventListener('resize', sync, {passive:true});
    window.addEventListener('orientationchange', () => setTimeout(sync, 120), {passive:true});
    observer = new MutationObserver(() => requestAnimationFrame(sync));
    observer.observe(content, {childList:true,subtree:true});
    sync();
  };

  const sync = () => {
    if (!content || !rail || !thumb || !segments?.length) return;
    const max = Math.max(0, content.scrollHeight - content.clientHeight);
    const trackHeight = rail.clientHeight;
    const ratio = max ? content.scrollTop / max : 0;
    const thumbHeight = thumb.offsetHeight || Math.max(46, Math.min(trackHeight * .34, trackHeight * (content.clientHeight / Math.max(1, content.scrollHeight))));
    const travel = Math.max(1, trackHeight - thumbHeight);
    const active = Math.min(7, Math.max(0, Math.round(ratio * 7)));
    segments.forEach((segment, i) => {
      segment.classList.toggle('is-active', i === active);
      segment.classList.toggle('is-passed', i < active);
      const usable = Math.max(0, trackHeight - 24);
      segment.style.top = `${12 + usable * (i / 7) - 6}px`;
    });
    readout.textContent = `SCROLL ${String(active + 1).padStart(2,'0')} / 08`;
    if (active !== lastActive && lastActive >= 0) {
      rail.classList.remove('tactical-pulse');
      void rail.offsetWidth;
      rail.classList.add('tactical-pulse');
    }
    lastActive = active;
    rail.classList.toggle('has-overflow', max > 2);
  };

  const onRailDown = event => {
    if (!content || !rail || !thumb) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = rail.getBoundingClientRect();
    const max = Math.max(0, content.scrollHeight - content.clientHeight);
    if (max <= 2) return;
    const thumbRect = thumb.getBoundingClientRect();
    const onThumb = event.target === thumb || thumb.contains(event.target);
    if (!onThumb) {
      const ratio = Math.max(0, Math.min(1, (event.clientY - rect.top - thumbRect.height / 2) / Math.max(1, rect.height - thumbRect.height)));
      content.scrollTop = ratio * max;
    }
    let startY = event.clientY;
    let startScroll = content.scrollTop;
    let activeDrag = true;
    rail.classList.add('is-dragging');
    thumb.classList.add('is-dragging');
    const move = e => {
      if (!activeDrag) return;
      e.preventDefault();
      const travel = Math.max(1, rail.clientHeight - thumb.offsetHeight);
      const ratioDelta = (e.clientY - startY) / travel;
      content.scrollTop = Math.max(0, Math.min(max, startScroll + ratioDelta * max));
      sync();
    };
    const end = () => {
      activeDrag = false;
      rail.classList.remove('is-dragging');
      thumb.classList.remove('is-dragging');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
    window.addEventListener('pointermove', move, {passive:false});
    window.addEventListener('pointerup', end, {passive:true});
    window.addEventListener('pointercancel', end, {passive:true});
  };

  const boot = () => {
    install();
    const panel = document.getElementById('titlePanel');
    if (panel) new MutationObserver(() => setTimeout(install, 20)).observe(panel, {attributes:true,attributeFilter:['class']});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
