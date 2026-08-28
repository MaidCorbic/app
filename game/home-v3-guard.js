(() => {
  'use strict';

  const STYLE_ID = 'relay-ui-presentation-v2';

  const installPresentationStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* HOME / PHASER SAFETY
         Keep the Phaser surface laid out while Home is visible so WebGL never
         receives a zero-size or detached framebuffer target. */
      body.home-v3-active #play {
        display:block!important;
        visibility:hidden!important;
        opacity:0!important;
        pointer-events:none!important;
        position:fixed!important;
        inset:0!important;
        width:100%!important;
        height:100%!important;
        min-width:1px!important;
        min-height:1px!important;
        z-index:0!important;
      }
      body.home-v3-active #phaser-game {
        display:block!important;
        visibility:hidden!important;
        opacity:0!important;
        width:100%!important;
        height:100%!important;
        min-width:1px!important;
        min-height:1px!important;
      }

      /* Retired / gameplay-only telemetry must never leak into Home. */
      body.home-v3-active #relay-gameplay-new-layer,
      body.home-v3-active #relayP1Momentum,
      body.home-v3-active #relayP1DashStatus,
      body.home-v3-active .relay-p1-momentum,
      body.home-v3-active .relay-p1-dash-status { display:none!important; }

      /* The old Dash Ready badge is redundant with the actual action button. */
      #relayP1DashStatus,
      .relay-p1-dash-status { display:none!important; }

      /* MODERN GAMEPLAY HUD — presentation only. */
      #play .hud {
        isolation:isolate;
        display:grid;
        grid-template-columns:minmax(150px,1.05fr) minmax(150px,.9fr) auto;
        align-items:start;
        gap:10px;
        padding:12px 14px;
        pointer-events:none;
        filter:drop-shadow(0 14px 34px rgba(0,0,0,.3));
      }
      #play .hud::before {
        content:"";
        position:absolute;
        left:14px; right:14px; top:10px;
        height:1px;
        background:linear-gradient(90deg,transparent,rgba(141,244,255,.4),rgba(247,217,138,.34),transparent);
        opacity:.55;
        pointer-events:none;
      }
      #play .hud-route,
      #play .hud-progress,
      #play .hud-xp,
      #play .hud-actions>button {
        position:relative;
        border:1px solid rgba(141,244,255,.24);
        background:linear-gradient(145deg,rgba(4,13,25,.94),rgba(11,26,43,.82));
        box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 10px 26px rgba(0,0,0,.28),0 0 24px rgba(25,200,245,.06);
        backdrop-filter:blur(10px);
      }
      #play .hud-route { min-width:0; padding:9px 12px; border-radius:12px; display:flex; align-items:center; gap:9px; }
      #play .hud-route::after { content:""; position:absolute; inset:1px; border-radius:11px; box-shadow:inset 0 0 0 1px rgba(255,208,110,.04); pointer-events:none; }
      #play .hud-route .route-dot { width:7px; height:7px; flex:0 0 auto; box-shadow:0 0 14px rgba(141,244,255,.95); }
      #play .hud-route small { color:#8df4ff; letter-spacing:.18em; font-weight:800; }
      #play .hud-route b { display:block; margin-top:2px; letter-spacing:.06em; text-shadow:0 0 12px rgba(141,244,255,.08); }
      #play .hud-progress { min-width:0; padding:9px 12px; border-radius:12px; }
      #play .hud-progress > div { height:5px; margin-top:5px; border-radius:999px; background:rgba(220,232,241,.08); overflow:hidden; box-shadow:inset 0 0 7px rgba(0,0,0,.6); }
      #play .hud-progress i { border-radius:999px; box-shadow:0 0 12px rgba(141,244,255,.85),0 0 3px rgba(255,255,255,.32); transition:width .22s ease; }
      #play .hud-actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; pointer-events:auto; }
      #play .hud-xp { min-width:58px; padding:8px 10px; border-radius:11px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; line-height:1.05; }
      #play .hud-xp small { color:#8ba0b8; letter-spacing:.15em; }
      #play .hud-xp b { color:#f7d98a; text-shadow:0 0 12px rgba(247,217,138,.4); letter-spacing:.08em; }
      #play .hud-actions>button { width:46px; height:42px; border-radius:11px; color:#e6fbff; transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease; flex:0 0 auto; pointer-events:auto; }
      #play .hud-actions>button:hover,
      #play .hud-actions>button:focus-visible { transform:translateY(-1px); border-color:rgba(141,244,255,.72); box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 12px 28px rgba(0,0,0,.34),0 0 26px rgba(141,244,255,.18); }
      #play .world-marker { padding:8px 12px; border:1px solid rgba(247,217,138,.24); border-radius:9px; background:linear-gradient(90deg,rgba(7,14,24,.9),rgba(7,14,24,.48)); box-shadow:0 10px 26px rgba(0,0,0,.25),0 0 20px rgba(247,217,138,.04); }
      #play .world-marker span { color:#f7d98a; letter-spacing:.14em; }
      #play .world-marker b { letter-spacing:.05em; text-shadow:0 0 12px rgba(141,244,255,.16); }

      /* Stronger PLAY zipper while preserving the existing swipe-only logic. */
      .home-v3-play {
        border:1px solid rgba(255,208,110,.68)!important;
        background:linear-gradient(135deg,rgba(20,24,30,.98),rgba(12,35,49,.98) 52%,rgba(27,20,11,.98))!important;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.11),0 14px 34px rgba(0,0,0,.42),0 0 32px rgba(255,208,110,.13),0 0 70px rgba(25,200,245,.05)!important;
        min-height:66px;
      }
      .home-v3-play::before {
        content:"";
        position:absolute;
        inset:1px;
        border-radius:inherit;
        border:1px solid rgba(255,255,255,.05);
        pointer-events:none;
      }
      .home-v3-play .home-v3-play-track {
        opacity:.9!important;
        background:repeating-linear-gradient(90deg,transparent 0 10%,rgba(141,244,255,.07) 10.5% 10.8%,transparent 11% 20%),linear-gradient(90deg,rgba(255,208,110,.05),rgba(141,244,255,.12),rgba(255,208,110,.05))!important;
      }
      .home-v3-play .home-v3-play-label {
        color:#fff4cf!important;
        font-weight:950!important;
        text-shadow:0 0 14px rgba(255,208,110,.28),0 1px 2px rgba(0,0,0,.55);
        letter-spacing:.11em;
      }
      .home-v3-play .home-v3-play-hint {
        color:#dffcff!important;
        text-shadow:0 0 12px rgba(141,244,255,.32);
        letter-spacing:.19em!important;
      }
      .home-v3-play .home-v3-play-fill {
        background:linear-gradient(90deg,rgba(255,208,110,.1),rgba(255,208,110,.38) 58%,rgba(141,244,255,.24))!important;
        box-shadow:inset -2px 0 0 rgba(255,255,255,.24),0 0 28px rgba(255,208,110,.14);
      }
      .home-v3-play .home-v3-play-knob {
        width:46px!important;
        height:46px!important;
        margin-top:-23px!important;
        left:8px!important;
        border:1px solid rgba(255,247,211,.92)!important;
        border-radius:13px!important;
        background:linear-gradient(145deg,#fff7d8 0%,#ffd06e 55%,#ffb83f 100%)!important;
        color:#07121d!important;
        box-shadow:0 0 24px rgba(255,208,110,.48),0 0 54px rgba(255,185,63,.2),inset 0 2px 0 rgba(255,255,255,.92)!important;
      }
      .home-v3-play .home-v3-play-knob::after {
        inset:-7px!important;
        border-color:rgba(255,208,110,.3)!important;
        box-shadow:0 0 20px rgba(141,244,255,.08);
      }
      .home-v3-play.is-dragging { border-color:rgba(141,244,255,.82)!important; box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 16px 38px rgba(0,0,0,.46),0 0 42px rgba(141,244,255,.22),0 0 72px rgba(255,208,110,.08)!important; }
      .home-v3-play.is-dragging .home-v3-play-fill { box-shadow:inset -2px 0 0 rgba(255,255,255,.34),0 0 32px rgba(255,208,110,.22); }

      @media (max-width:880px),(hover:none) and (pointer:coarse) {
        #play .hud { grid-template-columns:minmax(0,1fr) auto; gap:8px; padding:10px 12px; }
        #play .hud-progress { grid-column:1; }
        #play .hud-actions { grid-column:2; grid-row:1 / span 2; }
        #play .hud-route { grid-column:1; }
      }
      @media(max-width:430px) {
        #play .hud { padding:8px 9px; gap:6px; }
        #play .hud-route { padding:7px 9px; border-radius:10px; }
        #play .hud-route small { font-size:8px; }
        #play .hud-route b { font-size:10px; max-width:44vw; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #play .hud-progress { padding:7px 9px; border-radius:10px; }
        #play .hud-progress>div { height:4px; margin-top:4px; }
        #play .hud-xp { min-width:48px; padding:6px 7px; border-radius:9px; }
        #play .hud-actions>button { width:42px; height:38px; border-radius:10px; }
        .home-v3-play { min-height:68px; }
        .home-v3-play .home-v3-play-hint { right:10px!important; font-size:7px!important; letter-spacing:.1em!important; }
      }
      @media(max-width:360px) {
        .home-v3-play .home-v3-play-hint { display:none!important; }
        .home-v3-play .home-v3-play-label { padding-left:44px!important; }
      }
      @media(prefers-reduced-motion:reduce) {
        #play .hud-route .route-dot,
        .home-v3-play .home-v3-play-track,
        .home-v3-play .home-v3-play-knob::after { animation:none!important; }
        #play .hud-progress i,
        #play .hud-actions>button { transition:none!important; }
      }
    `;
    document.head.appendChild(style);
  };

  const sync = () => {
    const intro = document.getElementById('intro');
    const play = document.getElementById('play');
    if (!intro || !play) return;
    const home = !intro.classList.contains('hidden');
    document.body.classList.toggle('home-v3-active', home);
    intro.classList.toggle('home-v3', home);
    if (!home) {
      play.style.removeProperty('display');
      play.style.removeProperty('visibility');
      play.style.removeProperty('opacity');
      play.style.removeProperty('pointer-events');
    } else {
      play.style.removeProperty('display');
      play.style.removeProperty('visibility');
      play.style.removeProperty('opacity');
      play.style.removeProperty('pointer-events');
    }
  };

  const boot = () => {
    installPresentationStyle();
    sync();
    new MutationObserver(sync).observe(document.body, {
      subtree:true,
      childList:true,
      attributes:true,
      attributeFilter:['class','style','hidden']
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
