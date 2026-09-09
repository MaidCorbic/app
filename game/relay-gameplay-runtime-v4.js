import { RunnerScene } from './src/scenes/RunnerScene.js';

/* Relay Gameplay Runtime V4
 * Single presentation/runtime hardening owner.
 * No ownership of gameplay state, progression, input mappings or audio settings.
 */
(() => {
  'use strict';

  if (window.__relayGameplayRuntimeV4) return;
  window.__relayGameplayRuntimeV4 = true;

  const $ = id => document.getElementById(id);
  const q = selector => document.querySelector(selector);
  const qa = selector => Array.from(document.querySelectorAll(selector));

  const state = {
    scene: null,
    sceneTimer: 0,
    observer: null,
    booted: false,
  };

  const nativeClick = selector => {
    const node = q(selector);

    if (!node || typeof HTMLElement === 'undefined') {
      return false;
    }

    try {
      HTMLElement.prototype.click.call(node);
      return true;
    } catch {
      return false;
    }
  };

  const audioUnlock = () => {
    try {
      window.relayAdaptiveMusic?.setEnabled?.(true);

      const result = window.relayAdaptiveMusic?.unlock?.();

      if (result?.then) {
        result
          .then(ok => {
            if (
              ok &&
              $('intro')?.classList.contains('hidden')
            ) {
              window.relayAdaptiveMusic?.start?.();
            }
          })
          .catch(() => {});
      }
    } catch {}
  };

  const installCss = () => {
    if ($('relay-gameplay-runtime-v4-style')) {
      return;
    }

    const style = document.createElement('style');

    style.id = 'relay-gameplay-runtime-v4-style';

    style.textContent = `
      /* =========================================================
         HOME
         V4 owns the canonical Home navigation.
         ========================================================= */

      #intro.home-v3 .info-launcher{
        display:none!important;
        visibility:hidden!important;
        pointer-events:none!important;
      }

      #intro.home-v3 .home-v3-side{
        display:grid!important;
        grid-template-columns:1fr!important;
        gap:9px!important;
        width:min(420px,100%)!important;
      }

      #intro.home-v3 .relay-v4-home-btn{
        width:100%!important;
        min-height:56px!important;
        padding:13px 15px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:space-between!important;
        gap:18px!important;
        border:1px solid rgba(255,208,110,.24)!important;
        border-left:2px solid rgba(255,208,110,.72)!important;
        border-radius:11px!important;
        background:linear-gradient(
          145deg,
          rgba(7,10,15,.97),
          rgba(2,3,5,.985)
        )!important;
        color:#f4f7fa!important;
        box-shadow:
          inset 0 1px rgba(255,255,255,.05),
          0 14px 30px rgba(0,0,0,.28),
          0 0 24px rgba(255,208,110,.035)!important;
        cursor:pointer!important;
        touch-action:manipulation!important;
        user-select:none!important;
        -webkit-user-select:none!important;
      }

      #intro.home-v3 .relay-v4-home-btn:hover,
      #intro.home-v3 .relay-v4-home-btn:focus-visible{
        transform:translateY(-1px)!important;
        border-color:rgba(255,208,110,.66)!important;
        box-shadow:
          inset 0 1px rgba(255,255,255,.07),
          0 18px 38px rgba(0,0,0,.34),
          0 0 28px rgba(255,208,110,.11)!important;
        outline:none!important;
      }

      #intro.home-v3 .relay-v4-home-btn:active{
        transform:translateY(0)!important;
      }

      #intro.home-v3 .relay-v4-home-btn span{
        font:
          950 11px/1
          'DM Mono',
          ui-monospace,
          monospace!important;
        letter-spacing:1.25px!important;
        color:#f4f7fa!important;
      }

      #intro.home-v3 .relay-v4-home-btn small{
        font:
          750 7px/1.3
          'DM Mono',
          ui-monospace,
          monospace!important;
        letter-spacing:.9px!important;
        color:#84909d!important;
        text-align:right!important;
      }

      #intro.home-v3 .relay-v4-home-btn[data-v4='faq']{
        border-left-color:#fff0b5!important;
      }

      #intro.home-v3 .relay-v4-home-btn[data-v4='update']{
        border-left-color:#ffd06e!important;
      }

      #intro.home-v3 .relay-v4-home-btn[data-v4='options']{
        border-left-color:#ffe7a6!important;
      }

      #intro.home-v3 .relay-v4-home-btn[data-v4='exit']{
        border-left-color:#b47a1e!important;
      }


      /* =========================================================
         GAMEPLAY TOP HUD
         ========================================================= */

   #play .hud{
    position:absolute!important;
    top:10px!important;
    left:50%!important;
    right:auto!important;
    transform:translateX(-50%)!important;

    width:min(1180px,calc(100vw - 24px))!important;
    max-width:none!important;

    padding:0!important;
    margin:0!important;

    display:grid!important;

    /*
      DESKTOP:
      ROUTE | SIGNALS | XP + PAUSE
    */
    grid-template-columns:
        minmax(300px, 1.10fr)
        minmax(250px, .95fr)
        minmax(210px, .55fr)!important;

    gap:12px!important;

    align-items:start!important;

    z-index:300!important;
    pointer-events:none!important;
}

      #play .hud>*{
        pointer-events:auto!important;
        min-width:0!important;
      }

      #play .hud-route,
      #play .hud-progress,
      #play .hud-xp,
      #play .hud-actions>button{
        box-sizing:border-box!important;
        border:1px solid rgba(255,208,110,.25)!important;
        background:linear-gradient(
          145deg,
          rgba(7,10,15,.96),
          rgba(2,3,5,.985)
        )!important;
        box-shadow:
          inset 0 1px rgba(255,255,255,.05),
          0 14px 34px rgba(0,0,0,.28),
          0 0 24px rgba(255,208,110,.035)!important;
        backdrop-filter:blur(7px)!important;
      }

      #play .hud-route{
        min-height:49px!important;
        padding:8px 12px!important;
        border-radius:12px!important;
        display:flex!important;
        align-items:center!important;
        gap:9px!important;
      }

      #play .hud-route small{
        color:#ffd06e!important;
        font:900 7px/1 'DM Mono',monospace!important;
        letter-spacing:1.25px!important;
      }

      #play .hud-route b{
        color:#f4f7fa!important;
        font:950 11px/1.1 'DM Mono',monospace!important;
        letter-spacing:.45px!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }

      #play .hud-progress{
        min-height:49px!important;
        padding:8px 10px!important;
        border-radius:12px!important;
        display:grid!important;
        grid-template-columns:auto 1fr!important;
        grid-template-rows:auto 5px!important;
        grid-template-areas:
          'count label'
          'bar bar'!important;
        align-items:center!important;
        column-gap:8px!important;
      }

      #play .hud-progress>span{
        grid-area:count!important;
        color:#fff3bf!important;
        font:950 13px/1 'DM Mono',monospace!important;
        min-width:30px!important;
        text-align:left!important;
      }

      #play .hud-progress>small{
        grid-area:label!important;
        justify-self:end!important;
        color:#ffd06e!important;
        font:900 7px/1 'DM Mono',monospace!important;
        letter-spacing:1px!important;
      }

      #play .hud-progress>div{
        grid-area:bar!important;
        width:100%!important;
        height:5px!important;
        background:rgba(255,255,255,.05)!important;
        border:1px solid rgba(255,208,110,.14)!important;
        border-radius:99px!important;
        overflow:hidden!important;
      }

      #play .hud-progress i{
        display:block!important;
        height:100%!important;
        border-radius:99px!important;
        background:
          linear-gradient(
            90deg,
            #b47a1e,
            #ffd06e,
            #fff0b5
          )!important;
        box-shadow:
          0 0 12px rgba(255,208,110,.32)!important;
      }

      #play .hud-actions{
        display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    gap:8px!important;
      }

      @media(min-width:901px){
    #play .hud-actions{
        transform:translateX(-28px)!important;
    }
}

      #play .hud-xp{
        min-width:82px!important;
        min-height:49px!important;
        padding:7px 10px!important;
        border-radius:12px!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
      }

      #play .hud-xp small{
        color:#89949f!important;
        font:900 7px/1 'DM Mono',monospace!important;
        letter-spacing:1px!important;
        text-align:center!important;
      }

      #play .hud-xp b{
        margin-top:5px!important;
        color:#ffe7a6!important;
        font:950 14px/1 'DM Mono',monospace!important;
        letter-spacing:.4px!important;
        text-align:center!important;
      }

      #play #pause{
        width:49px!important;
        min-width:49px!important;
        height:49px!important;
        padding:0!important;
        border-radius:12px!important;
        color:#ffe7a6!important;
        border-color:rgba(255,208,110,.46)!important;
        font:900 19px/1 'DM Mono',monospace!important;
        display:grid!important;
        place-items:center!important;
        cursor:pointer!important;
        touch-action:manipulation!important;
      }

      /* =========================================================
         CARGO INTEGRITY
         FINAL AAA TACTICAL HUD V3
         VISUAL / PRESENTATION OWNER ONLY
         ========================================================= */

      #play #cargoIntegrityV2{
        position:fixed!important;

        left:18px!important;
        right:auto!important;
        top:auto!important;
        bottom:84px!important;

        width:min(332px,calc(100vw - 36px))!important;
        max-width:332px!important;

        margin:0!important;
        padding:0!important;

        box-sizing:border-box!important;

        z-index:940!important;

        pointer-events:none!important;

        isolation:isolate!important;

        contain:layout paint style!important;

        font-family:
          'DM Mono',
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace!important;

        transform:translate3d(0,0,0)!important;

        filter:
          drop-shadow(
            0 24px 52px rgba(0,0,0,.60)
          )
          drop-shadow(
            0 0 36px rgba(255,208,110,.08)
          )!important;

        transition:
          transform 180ms cubic-bezier(.22,.61,.36,1),
          filter 180ms ease,
          opacity 180ms ease!important;
      }


      /* =========================================================
         MAIN HUD FRAME
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-card{
        position:relative!important;

        width:100%!important;
        min-width:0!important;

        box-sizing:border-box!important;

        padding:
          14px 14px 12px
          !important;

        border:
          1px solid
          rgba(255,214,137,.30)!important;

        border-left:
          2px solid
          rgba(255,208,110,.98)!important;

        border-top-color:
          rgba(255,235,181,.36)!important;

        border-radius:
          8px!important;

        background:
          linear-gradient(
            145deg,
            rgba(18,24,34,.985) 0%,
            rgba(10,14,22,.992) 44%,
            rgba(4,7,13,.998) 100%
          )!important;

        box-shadow:
          inset 0 1px 0
            rgba(255,255,255,.085),

          inset 0 -1px 0
            rgba(0,0,0,.92),

          inset 12px 0 28px
            rgba(255,208,110,.018),

          0 24px 56px
            rgba(0,0,0,.54),

          0 0 0 1px
            rgba(255,208,110,.012),

          0 0 36px
            rgba(255,208,110,.075)!important;

        overflow:hidden!important;

        clip-path:
          polygon(
            0 0,
            calc(100% - 12px) 0,
            100% 12px,
            100% 100%,
            11px 100%,
            0 calc(100% - 11px)
          )!important;

        backdrop-filter:
          blur(18px)
          saturate(150%)!important;

        -webkit-backdrop-filter:
          blur(18px)
          saturate(150%)!important;

        transform:translateZ(0)!important;

        transition:
          border-color 180ms ease,
          box-shadow 180ms ease,
          transform 180ms cubic-bezier(.22,.61,.36,1),
          filter 180ms ease!important;
      }


      /* =========================================================
         TOP ENERGY BAR
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-card::before{
        content:""!important;

        position:absolute!important;

        top:0!important;
        left:0!important;
        right:0!important;

        height:2px!important;

        pointer-events:none!important;

        z-index:20!important;

        background:
          linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,208,110,.18) 6%,
            #a76914 19%,
            #ffd06e 38%,
            #fff3c4 54%,
            #ffd06e 70%,
            rgba(255,208,110,.16) 91%,
            transparent 100%
          )!important;

        box-shadow:
          0 0 8px
            rgba(255,208,110,.34),

          0 0 18px
            rgba(255,208,110,.12)!important;
      }


      /* =========================================================
         GLASS / TECH GRID / SCAN LAYER
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-card::after{
        content:""!important;

        position:absolute!important;

        inset:0!important;

        pointer-events:none!important;

        z-index:2!important;

        background:
          linear-gradient(
            90deg,
            rgba(255,208,110,.020) 1px,
            transparent 1px
          ),

          linear-gradient(
            0deg,
            rgba(255,208,110,.018) 1px,
            transparent 1px
          ),

          repeating-linear-gradient(
            180deg,
            rgba(255,255,255,.010) 0,
            rgba(255,255,255,.010) 1px,
            transparent 1px,
            transparent 4px
          ),

          radial-gradient(
            circle at 93% 7%,
            rgba(255,208,110,.095),
            transparent 27%
          ),

          linear-gradient(
            116deg,
            transparent 34%,
            rgba(255,255,255,.016) 43%,
            rgba(255,255,255,.052) 49%,
            rgba(255,255,255,.018) 55%,
            transparent 67%
          )!important;

        background-size:
          18px 18px,
          18px 18px,
          auto,
          auto,
          190% 100%!important;

        background-position:
          0 0,
          0 0,
          0 0,
          0 0,
          -75% 0!important;

        opacity:.46!important;

        mix-blend-mode:screen!important;

        animation:
          cargoHudScan
          6.5s
          ease-in-out
          infinite!important;
      }


      /* =========================================================
         HUD CORNER DETAILS
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-card > *{
        position:relative!important;
        z-index:10!important;
      }


      #play #cargoIntegrityV2 .cargo-head,
      #play #cargoIntegrityV2 .cargo-row,
      #play #cargoIntegrityV2 .cargo-foot{
        position:relative!important;
        z-index:10!important;
      }


      /* =========================================================
         HEADER
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-head{
        display:flex!important;

        align-items:center!important;
        justify-content:space-between!important;

        gap:12px!important;

        min-width:0!important;

        margin:
          0 0 10px
          !important;
      }


      /* =========================================================
         LEFT LABEL
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-label{
        display:flex!important;

        align-items:center!important;

        flex:
          1 1 auto!important;

        min-width:0!important;

        overflow:hidden!important;

        white-space:nowrap!important;

        text-overflow:ellipsis!important;

        margin:0!important;

        font:
          900 7px/1.2
          'DM Mono',
          ui-monospace,
          monospace!important;

        letter-spacing:
          .205em!important;

        text-transform:uppercase!important;

        color:
          rgba(255,225,177,.74)!important;

        text-shadow:
          0 0 10px
          rgba(255,208,110,.13)!important;
      }


      /* =========================================================
         LIVE STATUS LED
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-label::before{
        content:""!important;

        flex:
          0 0 auto!important;

        width:5px!important;
        height:5px!important;

        margin-right:7px!important;

        border-radius:50%!important;

        background:
          #ffd06e!important;

        box-shadow:
          0 0 5px
            rgba(255,208,110,.72),

          0 0 11px
            rgba(255,208,110,.38),

          0 0 18px
            rgba(255,208,110,.15)!important;

        animation:
          cargoStatusPulse
          1.8s
          ease-in-out
          infinite!important;
      }


      /* =========================================================
         CARGO TYPE
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-type{
        flex:
          0 1 auto!important;

        max-width:
          45%!important;

        min-width:0!important;

        overflow:hidden!important;

        white-space:nowrap!important;

        text-overflow:ellipsis!important;

        margin:0!important;

        font:
          950 8px/1.2
          'DM Mono',
          ui-monospace,
          monospace!important;

        letter-spacing:
          .105em!important;

        text-align:right!important;

        text-transform:uppercase!important;

        color:
          #fff0c4!important;

        text-shadow:
          0 0 9px
          rgba(255,208,110,.18)!important;
      }


      /* =========================================================
         MAIN ROW
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-row{
        display:flex!important;

        align-items:center!important;

        gap:12px!important;

        min-width:0!important;
      }


      /* =========================================================
         PROGRESS TRACK
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-track{
        position:relative!important;

        flex:
          1 1 auto!important;

        min-width:0!important;

        height:9px!important;

        overflow:hidden!important;

        border:
          1px solid
          rgba(255,208,110,.19)!important;

        border-radius:
          999px!important;

        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.065),
            rgba(255,255,255,.022) 44%,
            rgba(0,0,0,.56) 100%
          )!important;

        box-shadow:
          inset 0 0 11px
            rgba(0,0,0,.84),

          inset 0 1px 0
            rgba(255,255,255,.030),

          0 0 0 1px
            rgba(255,208,110,.010),

          0 0 9px
            rgba(255,208,110,.025)!important;
      }


      /* =========================================================
         PROGRESS SEGMENTS
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-track::before{
        content:""!important;

        position:absolute!important;

        inset:1px!important;

        pointer-events:none!important;

        z-index:5!important;

        background:
          repeating-linear-gradient(
            90deg,
            rgba(255,255,255,.028) 0,
            rgba(255,255,255,.028) 1px,
            transparent 1px,
            transparent 13px
          )!important;

        opacity:.66!important;
      }


      /* =========================================================
         PROGRESS HIGHLIGHT LINE
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-track::after{
        content:""!important;

        position:absolute!important;

        top:1px!important;
        left:1px!important;
        right:1px!important;

        height:1px!important;

        pointer-events:none!important;

        z-index:7!important;

        background:
          linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.17) 30%,
            rgba(255,255,255,.23) 55%,
            transparent
          )!important;

        opacity:.42!important;
      }


      /* =========================================================
         FILL
         IMPORTANT:
         DO NOT SET WIDTH HERE.
         GAME RUNTIME OWNS THE VALUE.
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-fill{
        position:relative!important;

        display:block!important;

        height:100%!important;

        min-width:0!important;

        border-radius:
          999px!important;

        background:
          linear-gradient(
            90deg,
            #593004 0%,
            #7f4707 12%,
            #a8610e 26%,
            #c97d19 42%,
            #df9d30 58%,
            #efb94f 72%,
            #ffd06e 85%,
            #fff5d2 100%
          )!important;

        box-shadow:
          0 0 8px
            rgba(255,208,110,.46),

          0 0 20px
            rgba(255,208,110,.20),

          0 0 34px
            rgba(255,208,110,.07),

          inset 0 1px 0
            rgba(255,255,255,.42),

          inset 0 -1px 0
            rgba(95,45,0,.35)!important;

        transition:
          width 180ms
            cubic-bezier(.16,1,.3,1),

          filter 180ms ease,

          box-shadow 180ms ease!important;

        z-index:2!important;
      }


      /* =========================================================
         FILL ENERGY SWEEP
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-fill::before{
        content:""!important;

        position:absolute!important;

        top:-2px!important;
        bottom:-2px!important;

        left:-34%!important;

        width:25%!important;

        pointer-events:none!important;

        background:
          linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,.08) 18%,
            rgba(255,255,255,.22) 34%,
            rgba(255,255,255,.68) 50%,
            rgba(255,255,255,.20) 66%,
            rgba(255,255,255,.06) 82%,
            transparent 100%
          )!important;

        transform:
          translateX(-180%)
          skewX(-18deg)!important;

        animation:
          cargoEnergySweep
          3.35s
          cubic-bezier(.4,0,.2,1)
          infinite!important;

        filter:
          blur(.25px)!important;
      }


      /* =========================================================
         LIVE EDGE
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-fill::after{
        content:""!important;

        position:absolute!important;

        top:0!important;
        right:0!important;
        bottom:0!important;

        width:44px!important;

        pointer-events:none!important;

        background:
          radial-gradient(
            ellipse at right center,
            rgba(255,255,255,.72),
            rgba(255,255,255,.24) 25%,
            rgba(255,255,255,.06) 43%,
            transparent 75%
          )!important;

        opacity:.64!important;

        filter:
          blur(.25px)!important;
      }


      /* =========================================================
         VALUE
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-value{
        flex:
          0 0 auto!important;

        min-width:
          54px!important;

        margin:0!important;

        text-align:right!important;

        white-space:nowrap!important;

        font:
          950 13px/1
          'DM Mono',
          ui-monospace,
          monospace!important;

        font-variant-numeric:
          tabular-nums!important;

        letter-spacing:
          .015em!important;

        color:
          #fff7df!important;

        text-shadow:
          0 0 8px
            rgba(255,208,110,.34),

          0 0 18px
            rgba(255,208,110,.14)!important;
      }


      /* =========================================================
         FOOTER
         ========================================================= */

      #play #cargoIntegrityV2 .cargo-foot{
        display:flex!important;

        align-items:center!important;

        justify-content:space-between!important;

        gap:12px!important;

        min-width:0!important;

        margin:
          9px 0 0
          !important;

        font:
          700 6.3px/1.25
          'DM Mono',
          ui-monospace,
          monospace!important;

        letter-spacing:
          .070em!important;

        text-transform:uppercase!important;

        color:
          #7e8995!important;
      }


      #play #cargoIntegrityV2 .cargo-effect{
        flex:
          1 1 auto!important;

        min-width:0!important;

        overflow:hidden!important;

        white-space:nowrap!important;

        text-overflow:ellipsis!important;
      }


      #play #cargoIntegrityV2 .cargo-state{
        flex:
          0 0 auto!important;

        white-space:nowrap!important;

        font-weight:
          950!important;

        color:
          #ffd06e!important;

        text-shadow:
          0 0 9px
            rgba(255,208,110,.20)!important;
      }


      /* =========================================================
         HIT
         ========================================================= */

      #play #cargoIntegrityV2.is-hit .cargo-card{
        animation:
          cargoImpact
          300ms
          cubic-bezier(.18,.89,.32,1.28)
          both!important;
      }

      #play #cargoIntegrityV2.is-hit .cargo-fill{
        filter:
          brightness(1.42)
          saturate(1.30)!important;

        box-shadow:
          0 0 13px
            rgba(255,235,170,.68),

          0 0 28px
            rgba(255,208,110,.30),

          0 0 44px
            rgba(255,208,110,.10),

          inset 0 1px 0
            rgba(255,255,255,.48)!important;
      }


      /* =========================================================
         WARNING
         ========================================================= */

      #play #cargoIntegrityV2.is-warning .cargo-card{
        border-color:
          rgba(255,174,78,.72)!important;

        box-shadow:
          inset 0 1px 0
            rgba(255,255,255,.075),

          0 24px 56px
            rgba(0,0,0,.56),

          0 0 38px
            rgba(255,156,68,.20)!important;
      }

      #play #cargoIntegrityV2.is-warning .cargo-label::before{
        background:
          #ffb347!important;

        box-shadow:
          0 0 7px
            rgba(255,179,71,.90),

          0 0 16px
            rgba(255,159,71,.40)!important;
      }

      #play #cargoIntegrityV2.is-warning .cargo-state{
        color:
          #ffb347!important;

        text-shadow:
          0 0 10px
            rgba(255,159,71,.28)!important;
      }


      /* =========================================================
         CRITICAL
         ========================================================= */

      #play #cargoIntegrityV2.is-critical .cargo-card{
        border-color:
          rgba(255,88,66,.80)!important;

        animation:
          cargoCritical
          720ms
          ease-in-out
          infinite
          alternate!important;

        box-shadow:
          inset 0 1px 0
            rgba(255,255,255,.075),

          0 25px 58px
            rgba(0,0,0,.58),

          0 0 40px
            rgba(255,68,51,.23)!important;
      }

      #play #cargoIntegrityV2.is-critical .cargo-label::before{
        background:
          #ff604d!important;

        box-shadow:
          0 0 7px
            rgba(255,96,77,.96),

          0 0 17px
            rgba(255,68,51,.46)!important;
      }

      #play #cargoIntegrityV2.is-critical .cargo-state{
        color:
          #ff705d!important;

        text-shadow:
          0 0 10px
            rgba(255,68,51,.32)!important;
      }

      #play #cargoIntegrityV2.is-critical .cargo-fill{
        filter:
          brightness(1.25)
          saturate(1.32)!important;

        box-shadow:
          0 0 14px
            rgba(255,117,86,.55),

          0 0 32px
            rgba(255,70,53,.25),

          0 0 46px
            rgba(255,70,53,.08),

          inset 0 1px 0
            rgba(255,255,255,.37)!important;
      }


      /* =========================================================
         ANIMATIONS
         ========================================================= */

      @keyframes cargoEnergySweep{

        0%{
          transform:
            translateX(-180%)
            skewX(-18deg);
        }

        42%{
          transform:
            translateX(510%)
            skewX(-18deg);
        }

        100%{
          transform:
            translateX(510%)
            skewX(-18deg);
        }
      }


      @keyframes cargoHudScan{

        0%{
          background-position:
            0 0,
            0 0,
            0 0,
            0 0,
            -75% 0;
        }

        50%{
          background-position:
            8px 0,
            0 8px,
            0 0,
            0 0,
            15% 0;
        }

        100%{
          background-position:
            0 0,
            0 0,
            0 0,
            0 0,
            -75% 0;
        }
      }


      @keyframes cargoStatusPulse{

        0%,
        100%{
          opacity:.70;
          transform:scale(.90);
        }

        50%{
          opacity:1;
          transform:scale(1.10);
        }
      }


      @keyframes cargoImpact{

        0%{
          transform:
            scale(1);
        }

        22%{
          transform:
            scale(1.020);
        }

        46%{
          transform:
            scale(.997);
        }

        100%{
          transform:
            scale(1);
        }
      }


      @keyframes cargoCritical{

        from{
          transform:
            translateY(0);

          filter:
            brightness(1);
        }

        to{
          transform:
            translateY(-1px);

          filter:
            brightness(1.085);
        }
      }


      /* =========================================================
         DESKTOP
         ========================================================= */

      @media(min-width:901px){

        #play #cargoIntegrityV2{
          left:18px!important;
          right:auto!important;

          bottom:84px!important;

          width:332px!important;
          max-width:
            calc(100vw - 36px)!important;
        }
      }


      /* =========================================================
         TABLET
         ========================================================= */

      @media(max-width:900px){

        #play #cargoIntegrityV2{
          left:12px!important;
          right:auto!important;

          top:auto!important;

          bottom:72px!important;

          width:
            min(
              304px,
              calc(100vw - 24px)
            )!important;

          max-width:
            304px!important;
        }

        #play #cargoIntegrityV2 .cargo-card{
          padding:
            11px 12px 10px
            !important;
        }

        #play #cargoIntegrityV2 .cargo-value{
          min-width:
            46px!important;

          font-size:
            11.5px!important;
        }
      }


      /* =========================================================
         MOBILE
         ========================================================= */

      @media(max-width:760px){

        #play #cargoIntegrityV2{
          left:10px!important;
          right:auto!important;

          bottom:
            calc(
              58px +
              env(safe-area-inset-bottom,0px)
            )!important;

          width:
            min(
              286px,
              calc(100vw - 20px)
            )!important;

          max-width:
            286px!important;
        }

        #play #cargoIntegrityV2 .cargo-card{
          padding:
            9px 10px 9px
            !important;

          border-radius:
            7px!important;
        }

        #play #cargoIntegrityV2 .cargo-head{
          gap:
            8px!important;

          margin-bottom:
            7px!important;
        }

        #play #cargoIntegrityV2 .cargo-label{
          font-size:
            6.15px!important;

          letter-spacing:
            .125em!important;
        }

        #play #cargoIntegrityV2 .cargo-label::before{
          width:
            4px!important;

          height:
            4px!important;

          margin-right:
            6px!important;
        }

        #play #cargoIntegrityV2 .cargo-type{
          font-size:
            6.8px!important;

          letter-spacing:
            .065em!important;
        }

        #play #cargoIntegrityV2 .cargo-row{
          gap:
            9px!important;
        }

        #play #cargoIntegrityV2 .cargo-track{
          height:
            7px!important;
        }

        #play #cargoIntegrityV2 .cargo-value{
          min-width:
            42px!important;

          font-size:
            10.5px!important;
        }

        #play #cargoIntegrityV2 .cargo-foot{
          margin-top:
            7px!important;

          font-size:
            5.75px!important;

          letter-spacing:
            .040em!important;
        }
      }


      /* =========================================================
         SMALL PHONE
         ========================================================= */

      @media(max-width:520px){

        #play #cargoIntegrityV2{
          left:8px!important;
          right:8px!important;

          bottom:
            calc(
              12px +
              env(safe-area-inset-bottom,0px)
            )!important;

          width:auto!important;

          max-width:none!important;
        }

        #play #cargoIntegrityV2 .cargo-card{
          padding:
            9px 10px
            !important;
        }

        #play #cargoIntegrityV2 .cargo-head,
        #play #cargoIntegrityV2 .cargo-row,
        #play #cargoIntegrityV2 .cargo-foot{
          gap:
            7px!important;
        }

        #play #cargoIntegrityV2 .cargo-label{
          font-size:
            5.9px!important;

          letter-spacing:
            .115em!important;
        }

        #play #cargoIntegrityV2 .cargo-type{
          max-width:
            42%!important;

          font-size:
            6.35px!important;
        }

        #play #cargoIntegrityV2 .cargo-track{
          height:
            6px!important;
        }

        #play #cargoIntegrityV2 .cargo-value{
          min-width:
            39px!important;

          font-size:
            10px!important;
        }

        #play #cargoIntegrityV2 .cargo-foot{
          font-size:
            5.4px!important;

          letter-spacing:
            .035em!important;
        }
      }


      /* =========================================================
         LANDSCAPE MOBILE
         ========================================================= */

      @media(
        orientation:landscape
      ) and (max-height:560px){

        #play #cargoIntegrityV2{
          left:10px!important;

          right:auto!important;

          bottom:58px!important;

          width:
            min(
              278px,
              calc(100vw - 20px)
            )!important;

          max-width:
            278px!important;
        }
      }


      /* =========================================================
         REDUCED MOTION
         ========================================================= */

      @media(prefers-reduced-motion:reduce){

        #play #cargoIntegrityV2 .cargo-card::after,
        #play #cargoIntegrityV2 .cargo-label::before,
        #play #cargoIntegrityV2 .cargo-fill::before{
          animation:none!important;
        }

        #play #cargoIntegrityV2 .cargo-card,
        #play #cargoIntegrityV2.is-hit .cargo-card,
        #play #cargoIntegrityV2.is-critical .cargo-card{
          animation:none!important;
        }
      }

      /* =========================================================
         FLOW / SIGNALS
         ========================================================= */

      #relay-gameplay-feel-v3 .gf-strip{
        left:auto!important;
        right:84px!important;
        top:68px!important;
        transform:translateY(-6px)!important;
      }

      #relay-gameplay-feel-v3.active .gf-strip{
        transform:translateY(0)!important;
      }

      #relay-gameplay-feel-v3 .gf-event{
        display:none!important;
      }


      /* =========================================================
         MISSION OBJECTIVE
         ========================================================= */

      #play .world-marker{
        left:14px!important;
        right:auto!important;
        bottom:78px!important;
        top:auto!important;
        transform:none!important;
        width:min(286px,34vw)!important;
        max-width:286px!important;
        padding:8px 11px!important;
        border:1px solid rgba(255,208,110,.24)!important;
        border-left:2px solid #ffd06e!important;
        border-radius:11px!important;
        background:linear-gradient(
          145deg,
          rgba(7,10,15,.95),
          rgba(2,3,5,.94)
        )!important;
        box-shadow:
          0 14px 32px rgba(0,0,0,.30),
          0 0 24px rgba(255,208,110,.035)!important;
        text-align:left!important;
        z-index:290!important;
      }

      #play .world-marker span{
        color:#ffd06e!important;
        font:900 6px/1 'DM Mono',monospace!important;
        letter-spacing:1.45px!important;
      }

      #play .world-marker b{
        display:block!important;
        margin-top:4px!important;
        color:#f4f7fa!important;
        font:900 9px/1.15 'DM Mono',monospace!important;
        letter-spacing:.5px!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }


    


      /* =========================================================
         DIAGNOSTICS / DEBUG
         ========================================================= */

      #relayGameplayIntel,
      .relay-gameplay-intel,
      [data-relay-mission-intelligence],
      [data-mission-intelligence]{
        display:none!important;
        visibility:hidden!important;
        pointer-events:none!important;
      }

      #game .relay-debug-hud,
      #game [data-relay-debug-hud],
      #game [data-debug-hud],
      [id*='dynamic-crowd'],
      [class*='dynamic-crowd']{
        display:none!important;
        visibility:hidden!important;
        pointer-events:none!important;
      }


         /* =========================================================
         RESPONSIVE
         ========================================================= */

      @media(max-width:900px){

        #play .hud{
          width:calc(100vw - 14px)!important;
          grid-template-columns:
            minmax(0,1fr)
            minmax(154px,190px)
            auto!important;
          gap:6px!important;
        }

        #play .world-marker{
          width:min(260px,42vw)!important;
        }
      }


      @media(max-width:760px){

        #intro.home-v3 .relay-v4-home-btn{
          min-height:54px!important;
          padding:12px 13px!important;
        }

        #play .hud{
          top:7px!important;
          width:calc(100vw - 10px)!important;
          grid-template-columns:
            minmax(0,1fr)
            minmax(106px,124px)
            auto!important;
          gap:5px!important;
        }

        #play .hud-route{
          min-height:43px!important;
          padding:6px 8px!important;
        }

        #play .hud-route small{
          font-size:6px!important;
        }

        #play .hud-route b{
          font-size:8px!important;
        }

        #play .hud-progress{
          min-height:43px!important;
          padding:6px 7px!important;
        }

        #play .hud-progress>span{
          font-size:11px!important;
        }

        #play .hud-progress>small{
          font-size:6px!important;
        }

        #play .hud-xp{
          min-width:61px!important;
          min-height:43px!important;
          padding:6px 7px!important;
        }

        #play .hud-xp small{
          font-size:6px!important;
        }

        #play .hud-xp b{
          font-size:11px!important;
          margin-top:4px!important;
        }

        #play #pause{
          width:42px!important;
          min-width:42px!important;
          height:43px!important;
          border-radius:10px!important;
          font-size:17px!important;
        }

        #play .world-marker{
          left:8px!important;
          bottom:84px!important;
          width:min(216px,48vw)!important;
          padding:6px 8px!important;
        }

        #relay-gameplay-feel-v3 .gf-strip{
          right:7px!important;
          top:56px!important;
          max-width:calc(100vw - 14px)!important;
        }
      }


      @media(max-width:520px){

        #play .hud{
          grid-template-columns:
            minmax(0,1fr)
            96px
            auto!important;
        }

        #play .hud-xp{
          min-width:53px!important;
          width:53px!important;
        }

        #play .world-marker{
          width:min(202px,53vw)!important;
        }
      }


      @media(orientation:landscape) and (max-height:560px){

        #play .hud{
          top:6px!important;
        }

        #play .world-marker{
          bottom:70px!important;
        }
      }
          `;

    document.head.appendChild(style);
  };

  /* =========================================================
     CANONICAL HOME BUTTON
     ========================================================= */

  const homeButton = (id, label, detail, handler) => {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'relay-v4-home-btn';
    button.dataset.v4 = id;

    button.innerHTML = `
      <span>${label}</span>
      <small>${detail}</small>
    `;

    const activate = event => {
      event.preventDefault();
      event.stopPropagation();

      try {
        handler();
      } catch {}
    };

    button.addEventListener(
      'pointerup',
      activate,
      { passive:false }
    );

    button.addEventListener(
      'click',
      activate
    );

    return button;
  };


  /* =========================================================
     CANONICAL HOME NAVIGATION
     ========================================================= */
function canonicalHomeButtons() {
  const intro = $('intro');
  const side = intro?.querySelector('.home-v3-side');

  if (!intro || !side) {
    return;
  }

  // Remove the legacy Home navigation FIRST.
  // Do this before checking whether the V4 navigation already exists.
  side.querySelectorAll(
    [
      '[data-v3-faq]',
      '[data-v3-update]',
      '[data-v3-options]',
      '[data-v3-exit]',
      '[data-final-home]',
      '[data-unified-home]',
      '[data-unified-home-v3]',
      '[data-final-home-v3]',
      '[data-runtime-home]',
      '.relay-v3-nav',
      '.relay-home-nav-card'
    ].join(',')
  ).forEach(node => node.remove());

  // The info launcher is not part of the canonical Home navigation.
  intro.querySelector('.info-launcher')?.remove();

  // Keep the V4 navigation intact if it is already correct.
  const canonical = qa(
    '#intro .relay-v4-home-btn'
  );

  const uniqueTypes = new Set(
    canonical.map(
      node => node.dataset.v4
    )
  );

  if (
    canonical.length === 4 &&
    uniqueTypes.size === 4 &&
    ['options', 'faq', 'update', 'exit'].every(
      type => uniqueTypes.has(type)
    )
  ) {
    return;
  }

  // If V4 is incomplete/corrupt, rebuild it cleanly.
  qa('#intro .relay-v4-home-btn')
    .forEach(node => node.remove());

  side.append(
    homeButton(
      'options',
      'OPTIONS',
      'SETTINGS · AUDIO · DISPLAY',
      () =>
        window.relayUnifiedCinematicUI?.openOptions?.() ||
        nativeClick(
          '[data-title-panel="controls"]'
        )
    ),

    homeButton(
      'faq',
      'FAQ',
      'HELP · GAME SYSTEMS',
      () =>
        window.relayOpenInfo?.('faq')
    ),

    homeButton(
      'update',
      'UPDATE',
      'LATEST PATCHES · LIVE',
      () =>
        window.relayOpenInfo?.('update')
    ),

    homeButton(
      'exit',
      'EXIT',
      'CLOSE SESSION',
      () =>
        nativeClick('#exitTitle')
    )
  );
}


  /* =========================================================
     PLAY BUTTON
     ========================================================= */

  let playLock = false;
  let playTimer = 0;

  function reliablePlay(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }

    if (playLock) {
      return;
    }

    playLock = true;

    audioUnlock();

    nativeClick('#start');

    window.clearTimeout(playTimer);

    playTimer = window.setTimeout(() => {
      const intro = $('intro');

      const homeStillVisible =
        !!intro &&
        !intro.classList.contains('hidden');

      if (homeStillVisible) {
        nativeClick('#start');
      }

      playLock = false;

      audioUnlock();
    }, 420);
  }


  function bindPlay() {
    const play = q(
      '#intro .home-v3-play'
    );

    if (
      !play ||
      play.dataset.relayV4Play === '1'
    ) {
      return;
    }

    play.dataset.relayV4Play = '1';

    play.addEventListener(
      'pointerup',
      reliablePlay,
      {
        capture:true,
        passive:false
      }
    );

    play.addEventListener(
      'click',
      reliablePlay,
      {
        capture:true,
        passive:false
      }
    );

    play.addEventListener(
      'keydown',
      event => {
        if (
          event.key === 'Enter' ||
          event.code === 'Space'
        ) {
          reliablePlay(event);
        }
      },
      {
        capture:true
      }
    );
  }


  /* =========================================================
     PHASER DIAGNOSTICS
     ========================================================= */

  function hidePhaserDiagnostics(scene) {
    const list =
      scene?.children?.list || [];

    for (const node of list) {

      if (typeof node?.text === 'string') {
        const text =
          node.text
            .trim()
            .toUpperCase();

        if (
          /DYNAMIC\s+CROWD/.test(text) ||
          /^V10\b/.test(text) ||
          /MISSION\s+INTELLIGENCE/.test(text)
        ) {
          node.setVisible?.(false);
          node.setAlpha?.(0);
          node.disableInteractive?.();
          node.parentContainer?.setVisible?.(false);
        }
      }

      if (
        node?.list?.some?.(
          child =>
            typeof child?.text === 'string' &&
            (
              /DYNAMIC\s+CROWD/i.test(child.text) ||
              /^V10\b/i.test(child.text) ||
              /MISSION\s+INTELLIGENCE/i.test(child.text)
            )
        )
      ) {
        node.setVisible?.(false);
        node.setAlpha?.(0);
        node.disableInteractive?.();
      }
    }
  }


  /* =========================================================
     DOM DIAGNOSTICS
     ========================================================= */

  function hideDomDiagnostics() {
    qa(
      [
        '.relay-gameplay-intel',
        '#relayGameplayIntel',
        '[data-relay-mission-intelligence]',
        '[data-mission-intelligence]',
        '.relay-debug-hud',
        '[data-relay-debug-hud]',
        '[data-debug-hud]'
      ].join(',')
    ).forEach(node => {
      node.style.setProperty(
        'display',
        'none',
        'important'
      );

      node.style.setProperty(
        'visibility',
        'hidden',
        'important'
      );

      node.style.setProperty(
        'pointer-events',
        'none',
        'important'
      );
    });
  }


  /* =========================================================
     SCENE INSTALL
     ========================================================= */

  function installScene(scene) {
    if (
      !scene ||
      state.scene === scene
    ) {
      return;
    }

    state.scene = scene;

    window.clearInterval(
      state.sceneTimer
    );

    const tick = () => {
      hidePhaserDiagnostics(scene);
      hideDomDiagnostics();

      if (
        $('intro')?.classList.contains('hidden')
      ) {
        audioUnlock();
      }
    };

    tick();

    state.sceneTimer =
      window.setInterval(
        tick,
        700
      );
  }


  /* =========================================================
     RUNNER SCENE CREATE HOOK
     ========================================================= */

  const originalCreate =
    RunnerScene.prototype.create;

  if (
    typeof originalCreate === 'function' &&
    !RunnerScene.prototype
      .__relayGameplayRuntimeV4Create
  ) {
    RunnerScene.prototype.create =
      function runtimeV4Create(...args) {
        const result =
          originalCreate.apply(
            this,
            args
          );

        installScene(this);

        return result;
      };

    RunnerScene.prototype
      .__relayGameplayRuntimeV4Create = true;
  }


  /* =========================================================
     BOOT
     ========================================================= */

  function boot() {
    if (state.booted) {
      return;
    }

    state.booted = true;

    installCss();
    canonicalHomeButtons();
    bindPlay();
    hideDomDiagnostics();

    state.observer =
      new MutationObserver(() => {
        const intro = $('intro');

        if (
          intro &&
          !intro.classList.contains('home-v3')
        ) {
          return;
        }

        canonicalHomeButtons();
        bindPlay();
        hideDomDiagnostics();
      });

    state.observer.observe(
      document.body,
      {
        subtree:true,
        childList:true,
        attributes:true,
        attributeFilter:[
          'class',
          'hidden'
        ]
      }
    );

    document.addEventListener(
      'pointerdown',
      audioUnlock,
      {
        capture:true,
        passive:true
      }
    );

    document.addEventListener(
      'keydown',
      event => {
        if (
          event.code === 'Space' ||
          event.code === 'Enter'
        ) {
          audioUnlock();
        }
      },
      {
        capture:true,
        passive:true
      }
    );
  }


  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      {
        once:true
      }
    );
  } else {
    boot();
  }

})();
