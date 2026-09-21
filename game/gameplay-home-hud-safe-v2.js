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
    if (!document.querySelector('link[data-relay-orbitron="true"]')) {
      const font = document.createElement('link');
      font.rel = 'stylesheet';
      font.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800;900&display=swap';
      font.dataset.relayOrbitron = 'true';
      document.head.appendChild(font);
    }
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #intro.home-v3,
      #game #play{
        --relay-cyan:#62eaff;
        --relay-blue:#2c9dff;
        --relay-gold:#ffd06e;
        --relay-ice:#e8fbff;
        --relay-panel:linear-gradient(145deg,rgba(7,16,27,.97),rgba(2,6,13,.985));
        --relay-font:'Orbitron',ui-sans-serif,sans-serif;
      }

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
        font:800 11px/1 var(--relay-font)!important;
        letter-spacing:1.35px!important;
        white-space:nowrap!important;
      }
      #intro.home-v3 .relay-home-nav-card small,
      #intro.home-v3 .home-v3-card small{
        display:block!important;
        margin:0!important;
        color:#84909d!important;
        font:600 7px/1.3 var(--relay-font)!important;
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
        display:grid!important;
        grid-template-columns:minmax(210px,360px) minmax(180px,1fr) auto!important;
        align-items:center!important;
        gap:clamp(10px,1.4vw,22px)!important;
        margin:clamp(12px,2.2vw,30px) clamp(12px,2.8vw,42px) 0!important;
        padding:0!important;
        width:calc(100% - clamp(24px,5.6vw,84px))!important;
        box-sizing:border-box!important;
      }
   #game #play .hud{
  display:grid!important;

  grid-template-columns:minmax(240px,360px) minmax(190px,1fr) auto!important;

  align-items:center!important;

  gap:clamp(12px,1.5vw,24px)!important;

  margin:clamp(12px,2.2vw,30px) clamp(12px,2.8vw,42px) 0!important;

  padding:0!important;

  width:calc(100% - clamp(24px,5.6vw,84px))!important;

  box-sizing:border-box!important;

  background:transparent!important;

  border:0!important;
  outline:0!important;

  box-shadow:none!important;

  filter:none!important;

  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
}

#game #play .hud::before,
#game #play .hud::after{
  display:none!important;
  content:none!important;
}
      #game #play .hud::before,
      #game #play .hud::after{display:none!important;content:none!important}
      #game #play .hud-route,
      #game #play .hud-progress,
      #game #play .hud-xp,
      #game #play .hud-actions>button{
        background:var(--relay-panel)!important;
        border:1px solid rgba(98,234,255,.34)!important;
        box-shadow:inset 0 1px rgba(232,251,255,.08),0 14px 34px rgba(0,0,0,.36),0 0 28px rgba(44,157,255,.10)!important;
        backdrop-filter:blur(7px)!important;
        -webkit-backdrop-filter:blur(7px)!important;
        font-family:var(--relay-font)!important;
        transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,filter .18s ease!important;
      }
    #game #play .hud-route{
  width:min(360px,100%)!important;
  max-width:360px!important;
  min-width:0!important;

  min-height:68px!important;

  justify-self:start!important;

  display:flex!important;
  align-items:center!important;

  padding:12px 16px!important;

  box-sizing:border-box!important;

  border:1px solid rgba(98,234,255,.42)!important;
  border-left:3px solid var(--relay-cyan)!important;

  border-radius:8px!important;

  background:
    linear-gradient(
      145deg,
      rgba(8,18,30,.99),
      rgba(2,7,14,.99)
    )!important;

  box-shadow:
    inset 0 1px 0 rgba(232,251,255,.10),
    inset 0 -1px 0 rgba(98,234,255,.05),
    0 16px 38px rgba(0,0,0,.44),
    0 0 26px rgba(44,157,255,.13),
    0 0 44px rgba(98,234,255,.06)!important;

  isolation:isolate!important;

  overflow:hidden!important;
}

#game #play .hud-route small{
  display:block!important;

  color:var(--relay-cyan)!important;

  font-family:var(--relay-font)!important;
  font-size:7px!important;
  font-weight:800!important;

  line-height:1!important;

  letter-spacing:.19em!important;

  text-transform:uppercase!important;
}

#game #play .hud-route b{
  display:block!important;

  margin-top:7px!important;

  color:#f4fbff!important;

  font-family:var(--relay-font)!important;
  font-size:13px!important;
  font-weight:900!important;

  line-height:1.1!important;

  letter-spacing:.045em!important;

  text-transform:uppercase!important;

  text-shadow:
    0 0 10px rgba(98,234,255,.13)!important;

  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
      #game #play .hud-route::after{
        content:"";
        position:absolute!important;
        inset:1px!important;
        pointer-events:none!important;
        background:linear-gradient(100deg,transparent 0%,rgba(98,234,255,.08) 46%,transparent 58%)!important;
        transform:translateX(-125%)!important;
        animation:relayHudScan 4.6s ease-in-out infinite!important;
        z-index:-1!important;
      }
      #game #play .hud-route::before{
        box-shadow:0 0 8px rgba(98,234,255,.85),0 0 20px rgba(44,157,255,.38)!important;
      }
      #game #play .hud-route:hover,
      #game #play .hud-progress:hover,
      #game #play .hud-xp:hover,
      #game #play .hud-actions>button:hover,
      #game #play .hud-actions>button:focus-visible{
        transform:translateY(-2px)!important;
        border-color:rgba(98,234,255,.88)!important;
        box-shadow:inset 0 1px rgba(232,251,255,.14),0 18px 38px rgba(0,0,0,.42),0 0 28px rgba(44,157,255,.25),0 0 52px rgba(98,234,255,.10)!important;
        filter:brightness(1.08)!important;
        outline:none!important;
      }
      #game #play .hud-route:focus-within,
      #game #play .hud-progress:focus-within,
      #game #play .hud-xp:focus-within{border-color:rgba(255,208,110,.88)!important}
      #game #play .hud-route small,
      #game #play .hud-progress>small,
      #game #play .hud-xp small{color:var(--relay-cyan)!important;font-family:var(--relay-font)!important;letter-spacing:.12em!important}
      #game #play .hud-route b,
      #game #play .hud-progress>span,
      #game #play .hud-xp b{font-family:var(--relay-font)!important}
     #game #play .hud-progress{
  position:relative!important;

  min-width:0!important;
  min-height:68px!important;

  display:flex!important;
  flex-direction:column!important;
  justify-content:center!important;

  padding:12px 16px 13px!important;

  box-sizing:border-box!important;

  border:1px solid rgba(98,234,255,.34)!important;
  border-top:2px solid var(--relay-gold)!important;

  border-radius:8px!important;

  background:
    linear-gradient(
      145deg,
      rgba(7,16,27,.98),
      rgba(2,6,13,.99)
    )!important;

  box-shadow:
    inset 0 1px 0 rgba(232,251,255,.08),
    0 16px 36px rgba(0,0,0,.40),
    0 0 28px rgba(44,157,255,.10)!important;

  overflow:hidden!important;
}

#game #play .hud-progress>span{
  display:block!important;

  color:#fff0b5!important;

  font-family:var(--relay-font)!important;
  font-size:19px!important;
  font-weight:900!important;

  line-height:1!important;

  letter-spacing:.08em!important;

  text-shadow:
    0 0 8px rgba(255,208,110,.40),
    0 0 18px rgba(255,208,110,.18)!important;

  font-variant-numeric:tabular-nums!important;
}

#game #play .hud-progress>small{
  margin-top:5px!important;

  color:var(--relay-cyan)!important;

  font-family:var(--relay-font)!important;
  font-size:6px!important;
  font-weight:800!important;

  line-height:1!important;

  letter-spacing:.18em!important;

  text-transform:uppercase!important;
}

#game #play .hud-progress>div{
  width:100%!important;

  height:6px!important;

  margin-top:8px!important;

  border:1px solid rgba(98,234,255,.16)!important;

  border-radius:999px!important;

  background:rgba(255,255,255,.045)!important;

  overflow:hidden!important;

  box-shadow:
    inset 0 0 8px rgba(0,0,0,.65)!important;
}

#game #play .hud-progress i{
  display:block!important;

  height:100%!important;

  border-radius:999px!important;

  background:
    linear-gradient(
      90deg,
      #1477c9,
      var(--relay-cyan),
      var(--relay-gold),
      #fff0b5
    )!important;

  box-shadow:
    0 0 10px rgba(98,234,255,.50),
    0 0 22px rgba(255,208,110,.22)!important;

  transition:
    width .18s ease,
    filter .18s ease!important;
}

      #game #play .hud-xp{
  position:relative!important;

  width:140px!important;
  min-width:140px!important;

  height:86px!important;
  min-height:86px!important;

  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;

  padding:12px 14px 10px!important;

  box-sizing:border-box!important;

  border:1px solid rgba(98,234,255,.58)!important;
  border-top:3px solid var(--relay-gold)!important;
  border-bottom:1px solid rgba(98,234,255,.34)!important;

  border-radius:9px!important;

  background:
    linear-gradient(
      145deg,
      rgba(10,21,35,1),
      rgba(2,7,14,1)
    )!important;

  box-shadow:
    inset 0 1px 0 rgba(232,251,255,.15),
    inset 0 -1px 0 rgba(255,208,110,.10),
    0 20px 46px rgba(0,0,0,.52),
    0 0 30px rgba(44,157,255,.18),
    0 0 54px rgba(255,208,110,.12)!important;

  overflow:hidden!important;

  isolation:isolate!important;
}


/* TOP LABEL */
#game #play .hud-xp::before{
  content:"";

  position:absolute!important;

  top:7px!important;
  left:10px!important;
  right:10px!important;

  color:var(--relay-cyan)!important;

  font-family:var(--relay-font),"Orbitron",sans-serif!important;
  font-size:6px!important;
  font-weight:800!important;

  line-height:1!important;
  letter-spacing:.16em!important;

  text-align:left!important;

  opacity:.9!important;

  text-transform:uppercase!important;

  text-shadow:
    0 0 8px rgba(98,234,255,.32)!important;
}


/* ENERGY LINE */
#game #play .hud-xp::after{
  content:"";

  position:absolute!important;

  left:8px!important;
  right:8px!important;
  bottom:6px!important;

  height:2px!important;

  background:
    linear-gradient(
      90deg,
      transparent,
      var(--relay-cyan) 18%,
      var(--relay-gold) 50%,
      var(--relay-cyan) 82%,
      transparent
    )!important;

  box-shadow:
    0 0 8px rgba(98,234,255,.38),
    0 0 16px rgba(255,208,110,.18)!important;

  opacity:.95!important;
}


/* LARGE XP VALUE */
#game #play .hud-xp b{
  display:block!important;

  margin-top:10px!important;

  color:#fff2bf!important;

  font-family:var(--relay-font),"Orbitron",sans-serif!important;

  font-size:21px!important;
  font-weight:900!important;

  line-height:1!important;

  letter-spacing:.08em!important;

  text-align:center!important;

  white-space:nowrap!important;

  font-variant-numeric:tabular-nums!important;

  text-shadow:
    0 0 6px rgba(255,255,255,.24),
    0 0 12px rgba(255,208,110,.58),
    0 0 26px rgba(255,208,110,.28),
    0 0 42px rgba(98,234,255,.12)!important;

  transform:scale(1)!important;

  transition:
    transform .16s ease,
    filter .16s ease,
    text-shadow .16s ease!important;
}


/* XP VALUE MICRO PULSE */
#game #play .hud-xp:hover b{
  transform:scale(1.06)!important;

  filter:brightness(1.12)!important;

  text-shadow:
    0 0 8px rgba(255,255,255,.28),
    0 0 16px rgba(255,208,110,.68),
    0 0 30px rgba(255,208,110,.34),
    0 0 48px rgba(98,234,255,.16)!important;
}


/* LOW HEIGHT LANDSCAPE */
@media (orientation:landscape) and (max-height:760px){

  #game #play .hud-xp{
    width:96px!important;
    min-width:96px!important;
    height:60px!important;
    min-height:60px!important;

    padding:8px 9px 7px!important;
  }

  #game #play .hud-xp::before{
    top:6px!important;
    left:8px!important;
    right:8px!important;
    font-size:5px!important;
  }

  #game #play .hud-xp b{
    margin-top:8px!important;
    font-size:16px!important;
  }

}


/* MOBILE */
@media (max-width:700px){

  #game #play .hud-xp{
    width:88px!important;
    min-width:88px!important;
    height:56px!important;
    min-height:56px!important;

    padding:7px 8px 6px!important;

    border-top-width:2px!important;
  }

  #game #play .hud-xp::before{
    top:5px!important;
    left:7px!important;
    font-size:5px!important;
  }

  #game #play .hud-xp b{
    margin-top:7px!important;
    font-size:14px!important;
  }

}


/* VERY SMALL MOBILE */
@media (max-width:420px){

  #game #play .hud-xp{
    width:80px!important;
    min-width:80px!important;
    height:52px!important;
    min-height:52px!important;
  }

  #game #play .hud-xp b{
    font-size:12px!important;
  }

}
      #game #play #pause{color:var(--relay-ice)!important;border-color:rgba(98,234,255,.48)!important;font-family:var(--relay-font)!important}

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
        font:700 6px/1 var(--relay-font)!important;
        letter-spacing:1.55px!important;
        text-transform:uppercase!important;
      }
      #game .world-marker b{
        display:block!important;
        margin-top:5px!important;
        color:#f6f8fa!important;
        font:800 9px/1.15 var(--relay-font)!important;
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
      @keyframes relayHudScan{0%,18%{transform:translateX(-125%);opacity:0}32%{opacity:1}58%{opacity:.7}76%,100%{transform:translateX(125%);opacity:0}}

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
        #game #play .hud{grid-template-columns:minmax(190px,300px) minmax(150px,1fr) auto!important;gap:10px!important;margin-left:10px!important;margin-right:10px!important;width:calc(100% - 20px)!important}
        #game #play .hud-route{width:min(300px,100%)!important;max-width:300px!important}
      }
      @media(max-width:900px){
        #intro.home-v3 .home-v3-side{gap:8px!important}
        #game .world-marker{left:10px!important;top:64px!important;width:min(250px,42vw)!important}
      }
      @media(max-width:760px){
        #game #play .hud{grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important;margin:8px!important;width:calc(100% - 16px)!important}
        #game #play .hud-route{width:100%!important;max-width:none!important}
        #game #play .hud-progress{grid-column:1 / -1!important;grid-row:2!important}
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
        #game #play .hud-route::after{animation:none!important}
        #game #play .hud-route,
        #game #play .hud-progress,
        #game #play .hud-xp,
        #game #play .hud-actions>button{transition:none!important}
      }
    `;
    document.head.appendChild(style);
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
  
    hideLiveIntel();
    if (!timer) timer = window.setInterval(() => {
      try { ensureHome(); hideLiveIntel(); } catch {}
    }, POLL_MS);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
