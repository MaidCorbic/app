(() => {
  if (window.__relayMobileOptionsTacticalV1) return;
  window.__relayMobileOptionsTacticalV1 = true;

  const style = document.createElement('style');
  style.textContent = `
    #titlePanel .title-panel-card.tactical-scan::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;z-index:90;pointer-events:none;background:linear-gradient(90deg,transparent,#8df4ff 18%,#fff 50%,#8df4ff 82%,transparent);box-shadow:0 0 12px #8df4ff,0 0 28px rgba(56,189,248,.55);animation:tacticalScan 620ms cubic-bezier(.2,.75,.2,1) forwards}
    #titlePanel .title-panel-card.tactical-scan{animation:tacticalPanelIn 420ms cubic-bezier(.2,.8,.2,1)}
    #homeOptionsScrollbar.tactical-locked .home-scroll-track{border-color:rgba(141,244,255,.42);box-shadow:inset 0 0 10px rgba(0,0,0,.5),0 0 18px rgba(56,189,248,.22)}
    #homeOptionsScrollbar.tactical-locked .home-scroll-thumb{filter:brightness(1.3);box-shadow:0 0 18px rgba(141,244,255,.85),0 0 38px rgba(56,189,248,.42),inset 0 1px rgba(255,255,255,.95)}
    #homeOptionsScrollbar .tactical-lock-label{position:absolute;right:14px;top:50%;transform:translateY(-50%) translateX(5px);white-space:nowrap;opacity:0;pointer-events:none;color:#dffcff;font:800 7px/1 'DM Mono',monospace;letter-spacing:1px;text-shadow:0 0 8px #8df4ff;background:rgba(2,10,18,.92);border:1px solid rgba(141,244,255,.28);border-radius:5px;padding:6px 7px;transition:opacity .12s ease,transform .12s ease}
    #homeOptionsScrollbar.tactical-locked .tactical-lock-label{opacity:1;transform:translateY(-50%) translateX(0)}
    #homeOptionsScrollbar .tactical-particle{position:absolute;width:2px;height:2px;border-radius:50%;background:#dffcff;box-shadow:0 0 6px #8df4ff;pointer-events:none;opacity:0}
    #homeOptionsScrollbar.tactical-locked .tactical-particle{animation:tacticalParticle 460ms ease-out forwards}
    @keyframes tacticalScan{from{transform:translateY(-2px);opacity:0}20%{opacity:1}to{transform:translateY(calc(var(--scan-distance, 280px)));opacity:0}}
    @keyframes tacticalPanelIn{from{opacity:.72;transform:translateY(7px) scale(.985)}to{opacity:1;transform:none}}
    @keyframes tacticalParticle{0%{opacity:0;transform:translate(0,0) scale(.4)}25%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(0)}}
    @media(max-width:700px){#titlePanel .title-panel-card.tactical-scan{box-shadow:0 0 0 1px rgba(141,244,255,.05),0 20px 60px rgba(0,0,0,.62),0 0 38px rgba(56,189,248,.10)!important}}
    @media(prefers-reduced-motion:reduce){#titlePanel .title-panel-card.tactical-scan{animation:none!important}#titlePanel .title-panel-card.tactical-scan::before{display:none!important}#homeOptionsScrollbar .tactical-particle{display:none!important}}
  `;
  document.head.appendChild(style);

  let panel, card, bar, content, timer;
  const setup = () => {
    panel = document.getElementById('titlePanel');
    card = panel?.querySelector('.title-panel-card');
    content = document.getElementById('titlePanelContent');
    bar = document.getElementById('homeOptionsScrollbar');
    if (!panel || !card || !content || !bar) return;

    if (!bar.querySelector('.tactical-lock-label')) {
      const label = document.createElement('span');
      label.className = 'tactical-lock-label';
      label.textContent = 'LOCKED // 00%';
      bar.appendChild(label);
      for (let i = 0; i < 6; i++) {
        const p = document.createElement('i');
        p.className = 'tactical-particle';
        p.style.left = `${18 + i * 12}%`;
        p.style.top = `${35 + (i % 3) * 12}%`;
        p.style.setProperty('--dx', `${i % 2 ? 14 : -14}px`);
        p.style.setProperty('--dy', `${i % 3 === 0 ? -18 : i % 3 === 1 ? 4 : 20}px`);
        bar.appendChild(p);
      }
    }
  };

  const lock = () => {
    setup();
    if (!bar || !content) return;
    const max = Math.max(0, content.scrollHeight - content.clientHeight);
    const pct = max ? Math.round((content.scrollTop / max) * 100) : 0;
    const label = bar.querySelector('.tactical-lock-label');
    if (label) label.textContent = `LOCKED // ${String(pct).padStart(2, '0')}%`;
    bar.classList.add('tactical-locked');
    clearTimeout(timer);
    timer = window.setTimeout(() => bar?.classList.remove('tactical-locked'), 520);
  };

  const scan = () => {
    setup();
    if (!card) return;
    card.classList.remove('tactical-scan');
    void card.offsetWidth;
    card.style.setProperty('--scan-distance', `${Math.max(220, card.clientHeight - 2)}px`);
    card.classList.add('tactical-scan');
    window.setTimeout(() => card?.classList.remove('tactical-scan'), 700);
  };

  document.addEventListener('pointerdown', event => {
    if (event.target.closest?.('#homeOptionsScrollbar .home-scroll-thumb')) lock();
  }, { passive:true });
  document.addEventListener('pointerup', event => {
    if (event.target.closest?.('#homeOptionsScrollbar .home-scroll-thumb')) lock();
  }, { passive:true });

  const observer = new MutationObserver(() => {
    setup();
    if (panel && !panel.classList.contains('hidden')) {
      const heading = document.getElementById('titlePanelHeading');
      const title = heading?.textContent?.trim().toUpperCase() || '';
      if (title === 'OPTIONS' || title.includes('RUN SETTINGS')) scan();
    }
  });

  const init = () => {
    setup();
    if (panel) observer.observe(panel, { attributes:true, attributeFilter:['class'], childList:true, subtree:true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
