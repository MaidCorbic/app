/* Relay Runner final presentation hardening V3
 * Presentation-only. Does not own gameplay state, progression, input mapping or audio.
 * Keeps the canonical Home V3 cards visible and makes gameplay surfaces use one gold language.
 */
(() => {
  'use strict';
  const STYLE_ID = 'relay-home-hud-safe-v3-style';
  const POLL_MS = 250;
  let timer = 0;

  const byId = id => document.getElementById(id);
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const installStyles = () => {
    if (byId(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* ==================== HOME ==================== */
      #intro.home-v3 .home-v3-side,
      #intro.home-v3 .relay-home-nav-card,
      #intro.home-v3 .home-v3-card{
        display:grid!important;
        visibility:visible!important;
        opacity:1!important;
        pointer-events:auto!important;
      }
      #intro.home-v3 .home-v3-side{
        grid-template-columns:1fr!important;
        align-items:stretch!important;
        gap:10px!important;
        width:min(420px,100%)!important;
        position:relative!important;
        z-index:80!important;
      }
      #intro.home-v3 .relay-home-nav-card,
      #intro.home-v3 .home-v3-card{
        position:relative!important;
        isolation:isolate!important;
        min-height:58px!important;
        height:auto!important;
        width:100%!important;
        box-sizing:border-box!important;
        padding:14px 16px!important;
        margin:0!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:18px!important;
        border:1px solid rgba(255,208,110,.28)!important;
        border-left:2px solid rgba(255,208,110,.82)!important;
        border-radius:11px!important;
        background:linear-gradient(145deg,rgba(7,10,15,.97),rgba(2,3,5,.985))!important;
        color:#f4f7fa!important;
        box-shadow:inset 0 1px rgba(255,255,255,.05),0 14px 30px rgba(0,0,0,.30),0 0 24px rgba(255,208,110,.055)!important;
        text-align:left!important;
        cursor:pointer!important;
        touch-action:manipulation!important;
        user-select:none!important;
        -webkit-user-select:none!important;
        transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease,background .16s ease!important;
      }
      #intro.home-v3 .relay-home-nav-card::after,
      #intro.home-v3 .home-v3-card::after{
        content:"";
        position:absolute!important;
        inset:1px!important;
        border-radius:10px!important;
        background:linear-gradient(90deg,rgba(255,208,110,.045),transparent 36%,transparent 76%,rgba(255,208,110,.035))!important;
        pointer-events:none!important;
        z-index:-1!important;
      }
      #intro.home-v3 .relay-home-nav-card:hover,
      #intro.home-v3 .relay-home-nav-card:focus-visible,
      #intro.home-v3 .home-v3-card:hover,
      #intro.home-v3 .home-v3-card:focus-visible{
        transform:translateX(3px)!important;
        border-color:rgba(255,208,110,.72)!important;
        background:linear-gradient(145deg,rgba(12,16,21,.98),rgba(4,7,10,.99))!important;
        box-shadow:inset 0 1px rgba(255,255,255,.08),0 18px 38px rgba(0,0,0,.36),0 0 32px rgba(255,208,110,.13)!important;
        outline:none!important;
      }
      #intro.home-v3 .relay-home-nav-card:active,
      #intro.home-v3 .home-v3-card:active{transform:translateX(1px) scale(.995)!important}
      #intro.home-v3 .relay-home-nav-card span,
      #intro.home-v3 .home-v3-card span{
        display:block!important;
        color:#f6f8fa!important;
        font:950 11px/1 'DM Mono',ui-monospace,monospace!important;
        letter-spacing:1.35px!important;
        white-space:nowrap!important;
      }
      #intro.home-v3 .relay-home-nav-card small,
      #intro.home-v3 .home-v3-card small{
        display:block!important;
        margin:0!important;
        color:#84909d!important;
        font:750 7px/1.3 'DM Mono',ui-monospace,monospace!important;
        letter-spacing:.9px!important;
        text-align:right!important;
        white-space:nowrap!important;
      }
      #intro.home-v3 .relay-home-nav-card[data-final-home="options"],
      #intro.home-v3 .relay-home-nav-card[data-v4="options"],
      #intro.home-v3 .home-v3-card[data-v3-options]{border-left-color:#ffe7a6!important}
      #intro.home-v3 .relay-home-nav-card[data-final-home="faq"],
      #intro.home-v3 .relay-home-nav-card[data-v4="faq"],
      #intro.home-v3 .home-v3-card[data-v3-faq]{border-left-color:#fff0b5!important}
      #intro.home-v3 .relay-home-nav-card[data-final-home="update"],
      #intro.home-v3 .relay-home-nav-card[data-v4="update"]{border-left-color:#ffd06e!important}
      #intro.home-v3 .relay-home-nav-card[data-final-home="exit"],
      #intro.home-v3 .relay-home-nav-card[data-v4="exit"],
      #intro.home-v3 .home-v3-card[data-v3-exit]{border-left-color:#b47a1e!important}

      /* ==================== GAMEPLAY TOP HUD ==================== */
      #game #play .hud{
        background:transparent!important;
        border:0!important;
        outline:0!important;
        box-shadow:none!important;
        filter:none!important;
        backdrop-filter:none!important;
        -webkit-backdrop-filter:none!important;
      }
      #game #play .hud::before,
      #game #play .hud::after{display:none!important;content:none!important}
      #game #play .hud-route,
      #game #play .hud-progress,
      #game #play .hud-xp,
      #game #play .hud-actions>button{
        background:linear-gradient(145deg,rgba(7,10,15,.97),rgba(2,3,5,.985))!important;
        border:1px solid rgba(255,208,110,.28)!important;
        box-shadow:inset 0 1px rgba(255,255,255,.05),0 14px 34px rgba(0,0,0,.30),0 0 28px rgba(255,208,110,.055)!important;
        backdrop-filter:blur(7px)!important;
        -webkit-backdrop-filter:blur(7px)!important;
      }
      #game #play .hud-route small,
      #game #play .hud-progress>small{color:#ffd06e!important}
      #game #play .hud-progress>div{background:rgba(255,255,255,.045)!important;border-color:rgba(255,208,110,.16)!important}
      #game #play .hud-progress i{background:linear-gradient(90deg,#b47a1e,#ffd06e,#fff0b5)!important;box-shadow:0 0 12px rgba(255,208,110,.32)!important}
      #game #play .hud-xp b{color:#ffe7a6!important;text-shadow:0 0 12px rgba(255,208,110,.28)!important}
      #game #play #pause{color:#ffe7a6!important;border-color:rgba(255,208,110,.48)!important}

      /* ==================== MISSION 01 MARKER ==================== */
      #game .world-marker{
        position:absolute!important;
        left:max(14px,calc(50% - 580px))!important;
        right:auto!important;
        top:72px!important;
        bottom:auto!important;
        transform:none!important;
        width:min(286px,26vw)!important;
        max-width:286px!important;
        min-height:44px!important;
        padding:8px 11px!important;
        box-sizing:border-box!important;
        z-index:290!important;
        pointer-events:none!important;
        overflow:hidden!important;
        border:1px solid rgba(255,208,110,.30)!important;
        border-left:2px solid #ffd06e!important;
        border-radius:10px!important;
        background:linear-gradient(145deg,rgba(7,10,15,.97),rgba(2,3,5,.94))!important;
        box-shadow:inset 0 1px rgba(255,255,255,.05),0 14px 30px rgba(0,0,0,.28),0 0 26px rgba(255,208,110,.06)!important;
      }
      #game .world-marker::before{
        content:"";
        position:absolute!important;
        left:0!important;
        top:0!important;
        bottom:0!important;
        width:2px!important;
        background:linear-gradient(180deg,#fff0b5,#ffd06e,#b47a1e)!important;
        box-shadow:0 0 14px rgba(255,208,110,.65)!important;
      }
      #game .world-marker::after{
        content:"";
        position:absolute!important;
        left:-55%!important;
        top:0!important;
        width:42%!important;
        height:100%!important;
        background:linear-gradient(90deg,transparent,rgba(255,208,110,.12),transparent)!important;
        transform:skewX(-18deg)!important;
        animation:relayMissionSweep 3.8s linear infinite!important;
        pointer-events:none!important;
      }
      #game .world-marker span{
        display:block!important;
        color:#ffd06e!important;
        font:900 6px/1 'DM Mono',monospace!important;
        letter-spacing:1.55px!important;
        text-transform:uppercase!important;
      }
      #game .world-marker b{
        display:block!important;
        margin-top:5px!important;
        color:#f6f8fa!important;
        font:950 9px/1.15 'DM Mono',monospace!important;
        letter-spacing:.48px!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        text-shadow:0 0 12px rgba(255,208,110,.10)!important;
      }
      #game .world-marker.is-typing b::after{
        content:"_";
        display:inline-block!important;
        margin-left:2px!important;
        color:#ffd06e!important;
        animation:relayCursor .72s steps(1,end) infinite!important;
      }
      @keyframes relayMissionSweep{0%{transform:translateX(0) skewX(-18deg);opacity:0}12%{opacity:1}45%{opacity:1}100%{transform:translateX(330%) skewX(-18deg);opacity:0}}
      @keyframes relayCursor{0%,48%{opacity:1}49%,100%{opacity:0}}

      /* ==================== PHASER MISSION OBJECTIVE FALLBACK ==================== */
      /* The mission objective is rendered by Phaser, so its gold skin lives in the source module.
         This DOM guard only controls ordering against overlays created elsewhere. */
      #game #mission-objective-dom,#game [data-mission-objective-dom]{z-index:292!important}

      /* ==================== RETIRED LIVE MISSION INTEL ==================== */
      #game .relay-gameplay-intel,
      #game #relayGameplayIntel,
      #game [data-relay-mission-intelligence],
      #game [data-mission-intelligence],
      #game .relay-debug-hud,
      #game [data-relay-debug-hud],
      #game [data-debug-hud]{
        display:none!important;
        visibility:hidden!important;
        opacity:0!important;
        pointer-events:none!important;
      }

      @media(max-width:1190px){#game .world-marker{left:14px!important;width:min(286px,31vw)!important}}
      @media(max-width:900px){
        #intro.home-v3 .home-v3-side{gap:8px!important}
        #game .world-marker{left:10px!important;top:64px!important;width:min(250px,42vw)!important}
      }
      @media(max-width:760px){
        #intro.home-v3 .relay-home-nav-card,
        #intro.home-v3 .home-v3-card{min-height:54px!important;padding:12px 13px!important}
        #intro.home-v3 .relay-home-nav-card span,
        #intro.home-v3 .home-v3-card span{font-size:10px!important}
        #intro.home-v3 .relay-home-nav-card small,
        #intro.home-v3 .home-v3-card small{font-size:6.5px!important}
        #game .world-marker{left:8px!important;top:56px!important;width:min(222px,49vw)!important;padding:7px 9px!important}
        #game .world-marker b{font-size:8px!important}
      }
      @media(max-width:520px){
        #game .world-marker{left:8px!important;top:54px!important;width:min(204px,54vw)!important}
      }
      @media(prefers-reduced-motion:reduce){
        #game .world-marker::after,
        #game .world-marker.is-typing b::after{animation:none!important}
      }
    `;
    document.head.appendChild(style);
  };

  const typeMissionGoal = node => {
    if (!node || node.dataset.v3Typed === node.textContent) return;
    const target = node.textContent.trim();
    node.dataset.v3Typed = target;
    if (!target) return;
    node.closest('.world-marker')?.classList.add('is-typing');
    node.textContent = '';
    let index = 0;
    const step = () => {
      if (!node.isConnected) return;
      node.textContent = target.slice(0, index);
      index += 1;
      if (index <= target.length) window.setTimeout(step, 24);
      else window.setTimeout(() => node.closest('.world-marker')?.classList.remove('is-typing'), 700);
    };
    step();
  };

  const ensureHome = () => {
    const intro = byId('intro');
    if (!intro || intro.classList.contains('hidden')) return;
    const side = intro.querySelector('.home-v3-side');
    if (!side) return;
    side.style.setProperty('display','grid','important');
    side.style.setProperty('visibility','visible','important');
    side.style.setProperty('opacity','1','important');
    side.style.setProperty('pointer-events','auto','important');
    all('.relay-home-nav-card,.home-v3-card', side).forEach(button => {
      button.style.setProperty('display','grid','important');
      button.style.setProperty('visibility','visible','important');
      button.style.setProperty('opacity','1','important');
      button.style.setProperty('pointer-events','auto','important');
      button.disabled = false;
      button.removeAttribute('aria-hidden');
    });
  };

  const hideLiveIntel = () => {
    const scene = window.__relayRunnerScene;
    const list = scene?.children?.list;
    if (!Array.isArray(list)) return;
    for (const root of list) {
      if (!(root?.depth >= 700 && root?.depth <= 702)) continue;
      const text = typeof root.text === 'string' ? root.text.trim().toUpperCase() : '';
      const children = Array.isArray(root.list) ? root.list : [];
      const childText = children.map(item => typeof item?.text === 'string' ? item.text.trim().toUpperCase() : '').filter(Boolean).join(' ');
      if (/LIVE MISSION INTEL|MISSION INTELLIGENCE|V9\s*\/\//.test(`${text} ${childText}`) || (root.type === 'Rectangle' && root.width >= 300 && root.height >= 180 && root.height <= 230)) {
        try { root.setVisible?.(false); root.setAlpha?.(0); root.setActive?.(false); } catch {}
        children.forEach(item => { try { item.setVisible?.(false); item.setAlpha?.(0); item.setActive?.(false); item.disableInteractive?.(); } catch {} });
      }
    }
  };

  const boot = () => {
    installStyles();
    ensureHome();
    const marker = byId('worldGoal');
    if (marker && !marker.dataset.v3Observer) {
      marker.dataset.v3Observer = '1';
      new MutationObserver(() => typeMissionGoal(marker)).observe(marker, { childList:true, characterData:true, subtree:true });
      typeMissionGoal(marker);
    }
    hideLiveIntel();
    if (!timer) timer = window.setInterval(() => {
      try { ensureHome(); hideLiveIntel(); } catch {}
    }, POLL_MS);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
