/* COMMAND header: mobile-first tactical status + scroll progress. */
(() => {
  if (window.__relayCommandHeaderV1) return;
  window.__relayCommandHeaderV1 = true;

  const css = document.createElement('style');
  css.textContent = `
    #titlePanel .title-panel-card.relay-command-ui{--cmd-cyan:#8df4ff;--cmd-gold:#ffd06e}
    #titlePanel .relay-command-header{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 10px;margin:0 0 9px;padding:2px 2px 9px;border-bottom:1px solid rgba(141,244,255,.11)}
    #titlePanel .relay-command-title{min-width:0;color:#f2f8fb;font:900 clamp(15px,4.4vw,20px)/1.05 "DM Mono",monospace;letter-spacing:1.35px;text-transform:uppercase;text-shadow:0 0 14px rgba(141,244,255,.14)}
    #titlePanel .relay-command-id{align-self:start;color:var(--cmd-cyan);font:900 7px/1 "DM Mono",monospace;letter-spacing:1px;padding:6px 7px;border:1px solid rgba(141,244,255,.2);border-radius:5px;background:rgba(5,16,27,.88);box-shadow:inset 0 1px rgba(255,255,255,.04),0 0 12px rgba(56,189,248,.05)}
    #titlePanel .relay-command-sub{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:8px;color:#71879a;font:800 6.5px/1.2 "DM Mono",monospace;letter-spacing:1.15px;text-transform:uppercase}
    #titlePanel .relay-command-online{color:#68e7be;text-shadow:0 0 8px rgba(104,231,190,.3)}
    #titlePanel .relay-command-online::before{content:"";display:inline-block;width:5px;height:5px;margin-right:5px;border-radius:50%;background:#68e7be;box-shadow:0 0 8px rgba(104,231,190,.8);vertical-align:middle}
    #titlePanel .relay-command-progress{grid-column:1/-1;position:relative;height:2px;margin-top:3px;overflow:hidden;border-radius:99px;background:rgba(141,244,255,.08)}
    #titlePanel .relay-command-progress span{display:block;width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--cmd-cyan),rgba(141,244,255,.45));box-shadow:0 0 9px rgba(141,244,255,.7);transition:width .12s linear}
    #titlePanel .relay-command-progress i{position:absolute;inset:0;display:block;background:linear-gradient(90deg,transparent,rgba(255,208,110,.7),transparent);transform:translateX(-100%);opacity:0}
    #titlePanel .relay-command-header.is-scanning .relay-command-progress i{animation:relayCommandScan 650ms ease-out forwards}
    #titlePanel .relay-command-header.is-scanning::after{content:"";position:absolute;left:0;right:0;top:-3px;height:1px;background:linear-gradient(90deg,transparent,var(--cmd-cyan),#fff,var(--cmd-cyan),transparent);box-shadow:0 0 12px rgba(141,244,255,.8);animation:relayHeaderSweep 650ms ease-out forwards;pointer-events:none}
    @keyframes relayCommandScan{0%{opacity:0;transform:translateX(-100%)}25%{opacity:1}100%{opacity:0;transform:translateX(100%)}}
    @keyframes relayHeaderSweep{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(46px);opacity:0}}
    @media(max-width:700px){#titlePanel .relay-command-header{margin-bottom:8px;padding-bottom:8px}#titlePanel .relay-command-title{font-size:clamp(14px,4.8vw,18px)}#titlePanel .relay-command-id{font-size:6.5px;padding:6px}#titlePanel .relay-command-sub{font-size:6px}}
    @media(max-width:380px){#titlePanel .relay-command-header{gap:3px 7px}.relay-command-title{letter-spacing:1px!important}.relay-command-id{padding:5px!important}}
    @media(prefers-reduced-motion:reduce){#titlePanel .relay-command-header.is-scanning .relay-command-progress i,#titlePanel .relay-command-header.is-scanning::after{animation:none!important;opacity:0!important}}
  `;
  document.head.appendChild(css);

  const setup = () => {
    const card = document.querySelector('#titlePanel .title-panel-card');
    const content = document.getElementById('titlePanelContent');
    if (!card || !content || card.querySelector('.relay-command-header')) return;
    card.classList.add('relay-command-ui');
    const originalHeading = document.getElementById('titlePanelHeading');
    const headingText = originalHeading?.textContent?.trim() || 'RUN SETTINGS';
    const header = document.createElement('header');
    header.className = 'relay-command-header';
    header.innerHTML = `<div class="relay-command-title">${headingText}</div><div class="relay-command-id">RELAY // 07</div><div class="relay-command-sub"><span>SYSTEM CONFIGURATION</span><span class="relay-command-online">ONLINE</span></div><div class="relay-command-progress" aria-hidden="true"><span></span><i></i></div>`;
    originalHeading?.replaceWith(header);
    content.style.setProperty('scrollbar-width','none','important');
    content.addEventListener('scroll', () => {
      const max = Math.max(0, content.scrollHeight - content.clientHeight);
      const ratio = max ? content.scrollTop / max : 0;
      header.querySelector('.relay-command-progress span').style.width = `${Math.round(ratio * 100)}%`;
    }, {passive:true});
    header.classList.add('is-scanning');
    window.setTimeout(() => header.classList.remove('is-scanning'), 700);
  };

  const boot = () => {
    setup();
    const panel = document.getElementById('titlePanel');
    if (panel) new MutationObserver(() => setTimeout(setup, 25)).observe(panel, {childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
