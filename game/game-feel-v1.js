(() => {
  'use strict';

  if (window.__runnerRelayGameFeelV3) return;
  window.__runnerRelayGameFeelV3 = true;

  const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
  const OVERLAY_ID = 'relay-game-feel-overlay';
  const STYLE_ID = 'relay-game-feel-v3-style';

  const reducedMotion = () =>
    window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches === true;

  const getCanvas = () =>
    document.querySelector('#game canvas, canvas');

  /* =========================================================
     STYLE
     ========================================================= */

  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;

    style.textContent = `
      /* =====================================================
         MASTER OVERLAY
         ===================================================== */

      #${OVERLAY_ID}{
        position:fixed;
        inset:0;
        z-index:9990;
        pointer-events:none;
        overflow:hidden;
        opacity:0;
        visibility:hidden;
        mix-blend-mode:screen;
        transform:translateZ(0);
        contain:layout style paint;
      }

      #${OVERLAY_ID}.is-active{
        visibility:visible;
      }

      #${OVERLAY_ID}::before,
      #${OVERLAY_ID}::after{
        content:"";
        position:absolute;
        inset:-10%;
        pointer-events:none;
        opacity:0;
        transform:translateZ(0);
      }

      /* =====================================================
         BASE PULSE
         ===================================================== */

      #${OVERLAY_ID}.pulse{
        animation:relayGfPulseOverlay .30s ease-out both;
      }

      #${OVERLAY_ID}.pulse::before{
        background:
          radial-gradient(
            circle at 50% 50%,
            rgba(255,255,255,.18) 0%,
            rgba(141,244,255,.18) 10%,
            rgba(141,244,255,.08) 28%,
            transparent 62%
          );
        animation:relayGfPulseGlow .30s ease-out both;
      }

      #${OVERLAY_ID}.pulse::after{
        background:
          radial-gradient(
            circle at 50% 50%,
            transparent 30%,
            rgba(141,244,255,.10) 48%,
            transparent 70%
          );
        animation:relayGfPulseRing .30s ease-out both;
      }

      /* =====================================================
         DASH
         ===================================================== */

      #${OVERLAY_ID}.dash{
        animation:relayGfDashOverlay .28s
          cubic-bezier(.16,.82,.24,1) both;
      }

      #${OVERLAY_ID}.dash::before{
        background:
          linear-gradient(
            90deg,
            transparent 0%,
            rgba(141,244,255,.02) 12%,
            rgba(141,244,255,.08) 27%,
            rgba(255,255,255,.18) 50%,
            rgba(141,244,255,.08) 73%,
            rgba(141,244,255,.02) 88%,
            transparent 100%
          ),
          linear-gradient(
            96deg,
            transparent 0 28%,
            rgba(141,244,255,.10) 38%,
            transparent 47%
          ),
          linear-gradient(
            84deg,
            transparent 53%,
            rgba(141,244,255,.10) 62%,
            transparent 72%
          );
        animation:relayGfDashStreak .28s
          cubic-bezier(.16,.82,.24,1) both;
      }

      #${OVERLAY_ID}.dash::after{
        background:
          radial-gradient(
            ellipse at 50% 50%,
            rgba(141,244,255,.14) 0%,
            rgba(141,244,255,.06) 20%,
            transparent 55%
          );
        animation:relayGfDashCore .28s ease-out both;
      }

      /* =====================================================
         IMPACT / HIT
         ===================================================== */

      #${OVERLAY_ID}.impact{
        animation:relayGfImpactOverlay .30s
          cubic-bezier(.14,.82,.24,1) both;
      }

      #${OVERLAY_ID}.impact::before{
        background:
          radial-gradient(
            ellipse at 50% 50%,
            rgba(255,255,255,.28) 0%,
            rgba(141,244,255,.15) 11%,
            rgba(141,244,255,.06) 28%,
            transparent 55%
          ),
          conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            rgba(255,255,255,.14) 10deg,
            transparent 20deg,
            transparent 44deg,
            rgba(141,244,255,.12) 54deg,
            transparent 64deg,
            transparent 92deg,
            rgba(255,255,255,.10) 102deg,
            transparent 112deg,
            transparent 140deg,
            rgba(141,244,255,.12) 150deg,
            transparent 160deg,
            transparent 198deg,
            rgba(255,255,255,.11) 208deg,
            transparent 218deg,
            transparent 250deg,
            rgba(141,244,255,.10) 260deg,
            transparent 270deg,
            transparent 318deg,
            rgba(255,255,255,.11) 328deg,
            transparent 338deg,
            transparent
          );
        animation:relayGfImpactFlash .30s
          cubic-bezier(.14,.82,.24,1) both;
      }

      #${OVERLAY_ID}.impact::after{
        background:
          radial-gradient(
            ellipse at 50% 50%,
            transparent 0 9%,
            rgba(141,244,255,.08) 18%,
            transparent 42%
          );
        animation:relayGfImpactRing .30s ease-out both;
      }

      /* =====================================================
         DANGER / DEATH
         ===================================================== */

      #${OVERLAY_ID}.danger{
        mix-blend-mode:normal;
        animation:relayGfDangerOverlay .92s ease-out both;
      }

      #${OVERLAY_ID}.danger::before{
        background:
          radial-gradient(circle at 8% 12%,
            rgba(125,0,8,.72) 0 2.5%,
            transparent 2.8%),

          radial-gradient(circle at 17% 24%,
            rgba(165,0,10,.62) 0 1.8%,
            transparent 2.2%),

          radial-gradient(circle at 28% 8%,
            rgba(105,0,6,.68) 0 2.2%,
            transparent 2.6%),

          radial-gradient(circle at 41% 17%,
            rgba(178,0,12,.58) 0 1.4%,
            transparent 1.9%),

          radial-gradient(circle at 57% 7%,
            rgba(118,0,8,.66) 0 2.1%,
            transparent 2.5%),

          radial-gradient(circle at 73% 15%,
            rgba(163,0,10,.58) 0 1.7%,
            transparent 2.1%),

          radial-gradient(circle at 88% 10%,
            rgba(112,0,7,.70) 0 2.4%,
            transparent 2.8%),

          radial-gradient(circle at 4% 38%,
            rgba(145,0,9,.64) 0 2%,
            transparent 2.4%),

          radial-gradient(circle at 13% 53%,
            rgba(180,0,12,.58) 0 1.5%,
            transparent 1.9%),

          radial-gradient(circle at 24% 44%,
            rgba(120,0,8,.60) 0 2.8%,
            transparent 3.2%),

          radial-gradient(circle at 77% 46%,
            rgba(150,0,9,.64) 0 2.4%,
            transparent 2.8%),

          radial-gradient(circle at 91% 40%,
            rgba(175,0,11,.56) 0 1.7%,
            transparent 2.1%),

          radial-gradient(circle at 97% 59%,
            rgba(110,0,7,.68) 0 2.6%,
            transparent 3%),

          radial-gradient(circle at 9% 82%,
            rgba(138,0,8,.66) 0 2.7%,
            transparent 3.1%),

          radial-gradient(circle at 22% 91%,
            rgba(174,0,11,.58) 0 1.8%,
            transparent 2.2%),

          radial-gradient(circle at 39% 84%,
            rgba(112,0,7,.66) 0 2.2%,
            transparent 2.7%),

          radial-gradient(circle at 61% 92%,
            rgba(166,0,10,.60) 0 2.8%,
            transparent 3.2%),

          radial-gradient(circle at 78% 86%,
            rgba(121,0,7,.64) 0 1.9%,
            transparent 2.3%),

          radial-gradient(circle at 93% 81%,
            rgba(172,0,10,.58) 0 2.5%,
            transparent 3%),

          radial-gradient(
            ellipse at 50% 50%,
            transparent 34%,
            rgba(95,0,7,.12) 48%,
            rgba(125,0,8,.30) 72%,
            rgba(55,0,4,.62) 100%
          );

        animation:relayGfDangerVignette .92s ease-out both;
      }

      #${OVERLAY_ID}.danger::after{
        background:
          linear-gradient(
            28deg,
            transparent 0 46%,
            rgba(115,0,8,.18) 47%,
            rgba(170,0,12,.24) 48%,
            transparent 50%
          ),

          linear-gradient(
            -24deg,
            transparent 0 56%,
            rgba(120,0,8,.16) 57%,
            rgba(180,0,12,.22) 58%,
            transparent 60%
          ),

          radial-gradient(
            ellipse at 18% 42%,
            rgba(150,0,10,.28) 0 1.4%,
            transparent 3.8%
          ),

          radial-gradient(
            ellipse at 82% 58%,
            rgba(150,0,10,.28) 0 1.4%,
            transparent 3.8%
          ),

          linear-gradient(
            180deg,
            rgba(120,0,8,.08),
            transparent 18%,
            transparent 82%,
            rgba(120,0,8,.16)
          );

        animation:relayGfDangerSplatter .92s ease-out both;
      }

      /* =====================================================
         CHECKPOINT
         ===================================================== */

      #${OVERLAY_ID}.checkpoint{
        animation:relayGfCheckpointOverlay .54s
          cubic-bezier(.16,.82,.24,1) both;
      }

      #${OVERLAY_ID}.checkpoint::before{
        background:
          radial-gradient(
            circle at 50% 50%,
            rgba(255,255,255,.16) 0%,
            rgba(141,244,255,.18) 8%,
            rgba(141,244,255,.08) 22%,
            transparent 58%
          );
        animation:relayGfCheckpointGlow .54s
          cubic-bezier(.16,.82,.24,1) both;
      }

      #${OVERLAY_ID}.checkpoint::after{
        inset:18%;
        border:1px solid rgba(141,244,255,.28);
        border-radius:50%;
        background:
          radial-gradient(
            circle,
            transparent 48%,
            rgba(141,244,255,.05) 50%,
            transparent 53%
          );
        animation:relayGfCheckpointRing .54s ease-out both;
      }

      /* =====================================================
         COMBO
         ===================================================== */

      #${OVERLAY_ID}.combo{
        animation:relayGfComboOverlay .34s
          cubic-bezier(.16,.82,.24,1) both;
      }

      #${OVERLAY_ID}.combo::before{
        background:
          radial-gradient(
            ellipse at 50% 50%,
            rgba(255,208,110,.20) 0%,
            rgba(141,244,255,.13) 12%,
            rgba(141,244,255,.05) 28%,
            transparent 58%
          ),
          conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            rgba(255,208,110,.10) 12deg,
            transparent 24deg,
            transparent 58deg,
            rgba(141,244,255,.08) 70deg,
            transparent 82deg,
            transparent 118deg,
            rgba(255,208,110,.10) 130deg,
            transparent 142deg,
            transparent 188deg,
            rgba(141,244,255,.08) 200deg,
            transparent 212deg,
            transparent 256deg,
            rgba(255,208,110,.09) 268deg,
            transparent 280deg,
            transparent
          );

        animation:relayGfComboGlow .34s
          cubic-bezier(.16,.82,.24,1) both;
      }

      #${OVERLAY_ID}.combo::after{
        inset:25%;
        border:1px solid rgba(255,208,110,.20);
        border-radius:50%;
        background:
          radial-gradient(
            ellipse at 50% 50%,
            transparent 0 12%,
            rgba(255,208,110,.08) 18%,
            transparent 42%
          );
        animation:relayGfComboRing .34s ease-out both;
      }

      /* =====================================================
         MISSION COMPLETE
         ===================================================== */

      #${OVERLAY_ID}.complete{
        mix-blend-mode:screen;
        animation:relayGfCompleteOverlay .72s
          cubic-bezier(.14,.82,.24,1) both;
      }

      #${OVERLAY_ID}.complete::before{
        background:
          radial-gradient(
            ellipse at 50% 50%,
            rgba(255,255,255,.20) 0%,
            rgba(255,208,110,.22) 10%,
            rgba(141,244,255,.11) 24%,
            transparent 60%
          ),
          conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            rgba(255,208,110,.08) 16deg,
            transparent 32deg,
            transparent 66deg,
            rgba(141,244,255,.08) 78deg,
            transparent 94deg,
            transparent 138deg,
            rgba(255,208,110,.09) 150deg,
            transparent 168deg,
            transparent 214deg,
            rgba(141,244,255,.07) 228deg,
            transparent 244deg,
            transparent 292deg,
            rgba(255,208,110,.08) 306deg,
            transparent 322deg,
            transparent
          );

        animation:relayGfCompleteGlow .72s
          cubic-bezier(.14,.82,.24,1) both;
      }

      #${OVERLAY_ID}.complete::after{
        inset:-10% -20%;
        background:
          linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,208,110,.02) 32%,
            rgba(255,208,110,.14) 50%,
            rgba(141,244,255,.06) 55%,
            transparent 72%
          );

        animation:relayGfCompleteSweep .72s
          cubic-bezier(.16,.82,.24,1) both;
      }

      /* =====================================================
         CANVAS EFFECT CLASSES
         ===================================================== */

      .relay-gf-pulse{
        animation:relayGfCanvasPulse .22s ease-out both;
      }

      .relay-gf-dash{
        animation:relayGfCanvasDash .18s ease-out both;
      }

      .relay-gf-impact{
        animation:relayGfCanvasImpact .20s ease-out both;
      }

      .relay-gf-danger{
        animation:relayGfCanvasDanger .45s
          cubic-bezier(.22,.82,.25,1) both;
        transform-origin:center center;
      }

      .relay-gf-checkpoint{
        animation:relayGfCanvasCheckpoint .34s ease-out both;
      }

      .relay-gf-combo{
        animation:relayGfCanvasCombo .26s ease-out both;
      }

      .relay-gf-complete{
        animation:relayGfCanvasComplete .52s ease-out both;
      }

      /* =====================================================
         OVERLAY KEYFRAMES
         ===================================================== */

      @keyframes relayGfPulseOverlay{
        0%{opacity:0}
        20%{opacity:.20}
        42%{opacity:.10}
        100%{opacity:0}
      }

      @keyframes relayGfPulseGlow{
        0%{
          opacity:0;
          transform:scale(.94);
        }
        30%{
          opacity:1;
          transform:scale(1);
        }
        100%{
          opacity:0;
          transform:scale(1.06);
        }
      }

      @keyframes relayGfPulseRing{
        0%{
          opacity:0;
          transform:scale(.80);
        }
        28%{
          opacity:.80;
          transform:scale(1);
        }
        100%{
          opacity:0;
          transform:scale(1.16);
        }
      }

      @keyframes relayGfDashOverlay{
        0%{
          opacity:0;
          transform:scaleX(.94);
        }
        18%{
          opacity:.12;
          transform:scaleX(.98);
        }
        34%{
          opacity:.28;
          transform:scaleX(1);
        }
        58%{
          opacity:.14;
          transform:scaleX(1.01);
        }
        100%{
          opacity:0;
          transform:scaleX(1.035);
        }
      }

      @keyframes relayGfDashStreak{
        0%{
          opacity:0;
          transform:translateX(-18%) scaleX(.86);
        }
        18%{
          opacity:.48;
          transform:translateX(-7%) scaleX(.96);
        }
        34%{
          opacity:1;
          transform:translateX(0) scaleX(1);
        }
        62%{
          opacity:.54;
          transform:translateX(7%) scaleX(1.02);
        }
        100%{
          opacity:0;
          transform:translateX(18%) scaleX(1.05);
        }
      }

      @keyframes relayGfDashCore{
        0%{
          opacity:0;
          transform:scale(.72);
        }
        24%{
          opacity:1;
          transform:scale(1);
        }
        50%{
          opacity:.46;
          transform:scale(1.08);
        }
        100%{
          opacity:0;
          transform:scale(1.18);
        }
      }

      @keyframes relayGfImpactOverlay{
        0%{opacity:0}
        10%{opacity:.16}
        18%{opacity:.36}
        30%{opacity:.22}
        55%{opacity:.07}
        100%{opacity:0}
      }

      @keyframes relayGfImpactFlash{
        0%{
          opacity:0;
          transform:scale(.72);
        }
        12%{
          opacity:.72;
          transform:scale(.91);
        }
        24%{
          opacity:1;
          transform:scale(1);
        }
        42%{
          opacity:.42;
          transform:scale(1.05);
        }
        100%{
          opacity:0;
          transform:scale(1.12);
        }
      }

      @keyframes relayGfImpactRing{
        0%{
          opacity:0;
          transform:scale(.68);
        }
        18%{
          opacity:1;
          transform:scale(.92);
        }
        38%{
          opacity:.54;
          transform:scale(1);
        }
        100%{
          opacity:0;
          transform:scale(1.22);
        }
      }

      @keyframes relayGfDangerOverlay{
        0%{opacity:0}
        10%{opacity:.10}
        18%{opacity:.44}
        32%{opacity:.32}
        58%{opacity:.18}
        78%{opacity:.07}
        100%{opacity:0}
      }

      @keyframes relayGfDangerVignette{
        0%{
          opacity:0;
          transform:scale(.94);
        }
        14%{
          opacity:.28;
          transform:scale(1);
        }
        28%{
          opacity:1;
          transform:scale(1.02);
        }
        52%{
          opacity:.72;
          transform:scale(1.01);
        }
        76%{
          opacity:.38;
          transform:scale(1);
        }
        100%{
          opacity:0;
          transform:scale(1.04);
        }
      }

      @keyframes relayGfDangerSplatter{
        0%{
          opacity:0;
          transform:scale(.90);
        }
        12%{
          opacity:.12;
          transform:scale(.94);
        }
        24%{
          opacity:.58;
          transform:scale(.985);
        }
        36%{
          opacity:1;
          transform:scale(1);
        }
        52%{
          opacity:.88;
          transform:scale(1.008);
        }
        72%{
          opacity:.58;
          transform:scale(1.018);
        }
        100%{
          opacity:0;
          transform:scale(1.05);
        }
      }

      @keyframes relayGfCheckpointOverlay{
        0%{
          opacity:0;
          transform:scale(.96);
        }
        16%{
          opacity:.12;
          transform:scale(.985);
        }
        30%{
          opacity:.28;
          transform:scale(1);
        }
        56%{
          opacity:.14;
          transform:scale(1.008);
        }
        100%{
          opacity:0;
          transform:scale(1.025);
        }
      }

      @keyframes relayGfCheckpointGlow{
        0%{
          opacity:0;
          transform:scale(.66);
        }
        22%{
          opacity:.42;
          transform:scale(.84);
        }
        40%{
          opacity:1;
          transform:scale(1);
        }
        64%{
          opacity:.56;
          transform:scale(1.08);
        }
        100%{
          opacity:0;
          transform:scale(1.18);
        }
      }

      @keyframes relayGfCheckpointRing{
        0%{
          opacity:0;
          transform:scale(.48);
        }
        22%{
          opacity:.96;
          transform:scale(.72);
        }
        44%{
          opacity:.68;
          transform:scale(.96);
        }
        70%{
          opacity:.30;
          transform:scale(1.16);
        }
        100%{
          opacity:0;
          transform:scale(1.38);
        }
      }

      @keyframes relayGfComboOverlay{
        0%{
          opacity:0;
          transform:scale(.97);
        }
        16%{
          opacity:.10;
          transform:scale(.985);
        }
        30%{
          opacity:.28;
          transform:scale(1);
        }
        54%{
          opacity:.15;
          transform:scale(1.008);
        }
        100%{
          opacity:0;
          transform:scale(1.025);
        }
      }

      @keyframes relayGfComboGlow{
        0%{
          opacity:0;
          transform:scale(.70);
        }
        20%{
          opacity:.38;
          transform:scale(.86);
        }
        36%{
          opacity:1;
          transform:scale(1);
        }
        60%{
          opacity:.52;
          transform:scale(1.07);
        }
        100%{
          opacity:0;
          transform:scale(1.16);
        }
      }

      @keyframes relayGfComboRing{
        0%{
          opacity:0;
          transform:scale(.56);
        }
        24%{
          opacity:.90;
          transform:scale(.76);
        }
        44%{
          opacity:.58;
          transform:scale(1);
        }
        100%{
          opacity:0;
          transform:scale(1.30);
        }
      }

      @keyframes relayGfCompleteOverlay{
        0%{opacity:0}
        10%{opacity:.08}
        18%{opacity:.30}
        32%{opacity:.22}
        52%{opacity:.12}
        74%{opacity:.05}
        100%{opacity:0}
      }

      @keyframes relayGfCompleteGlow{
        0%{
          opacity:0;
          transform:scale(.68);
        }
        18%{
          opacity:.42;
          transform:scale(.84);
        }
        34%{
          opacity:1;
          transform:scale(1);
        }
        52%{
          opacity:.72;
          transform:scale(1.07);
        }
        74%{
          opacity:.28;
          transform:scale(1.13);
        }
        100%{
          opacity:0;
          transform:scale(1.20);
        }
      }

      @keyframes relayGfCompleteSweep{
        0%{
          opacity:0;
          transform:translateX(-55%) skewX(-8deg);
        }
        22%{
          opacity:.35;
          transform:translateX(-25%) skewX(-4deg);
        }
        40%{
          opacity:1;
          transform:translateX(0) skewX(0);
        }
        62%{
          opacity:.42;
          transform:translateX(24%) skewX(4deg);
        }
        100%{
          opacity:0;
          transform:translateX(55%) skewX(8deg);
        }
      }

      /* =====================================================
         CANVAS KEYFRAMES
         ===================================================== */

      @keyframes relayGfCanvasPulse{
        0%{
          filter:brightness(1) saturate(1);
        }
        34%{
          filter:brightness(1.14) saturate(1.08);
        }
        100%{
          filter:brightness(1) saturate(1);
        }
      }

      @keyframes relayGfCanvasDash{
        0%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
        16%{
          filter:brightness(1.24) saturate(1.12);
          transform:scale(1.004);
        }
        34%{
          filter:brightness(1.12) saturate(1.16);
          transform:scale(1.007);
        }
        58%{
          filter:brightness(1.05) saturate(1.06);
          transform:scale(1.003);
        }
        100%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
      }

      @keyframes relayGfCanvasImpact{
        0%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
        12%{
          filter:brightness(1.30) saturate(1.08);
          transform:scale(.996);
        }
        24%{
          filter:brightness(1.18) saturate(1.12);
          transform:scale(1.003);
        }
        42%{
          filter:brightness(1.07) saturate(1.05);
          transform:scale(1.001);
        }
        100%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
      }

      @keyframes relayGfCanvasDanger{
        0%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
        10%{
          filter:brightness(1.28) saturate(1.08);
          transform:scale(.997);
        }
        22%{
          filter:brightness(1.12) saturate(.92);
          transform:scale(1.004);
        }
        44%{
          filter:brightness(.94) saturate(.86);
          transform:scale(1.001);
        }
        70%{
          filter:brightness(.97) saturate(.92);
          transform:scale(1);
        }
        100%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
      }

      @keyframes relayGfCanvasCheckpoint{
        0%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
        18%{
          filter:brightness(1.12) saturate(1.06);
          transform:scale(1.002);
        }
        34%{
          filter:brightness(1.18) saturate(1.10);
          transform:scale(1.004);
        }
        58%{
          filter:brightness(1.06) saturate(1.04);
          transform:scale(1.002);
        }
        100%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
      }

      @keyframes relayGfCanvasCombo{
        0%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
        16%{
          filter:brightness(1.10) saturate(1.06);
          transform:scale(1.002);
        }
        32%{
          filter:brightness(1.18) saturate(1.12);
          transform:scale(1.004);
        }
        54%{
          filter:brightness(1.08) saturate(1.05);
          transform:scale(1.002);
        }
        100%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
      }

      @keyframes relayGfCanvasComplete{
        0%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
        16%{
          filter:brightness(1.16) saturate(1.04);
          transform:scale(1.002);
        }
        30%{
          filter:brightness(1.24) saturate(1.10);
          transform:scale(1.005);
        }
        48%{
          filter:brightness(1.14) saturate(1.07);
          transform:scale(1.003);
        }
        68%{
          filter:brightness(1.05) saturate(1.03);
          transform:scale(1.001);
        }
        100%{
          filter:brightness(1) saturate(1);
          transform:scale(1);
        }
      }

      /* =====================================================
         REDUCED MOTION
         ===================================================== */

      @media(prefers-reduced-motion:reduce){
        #${OVERLAY_ID},
        #${OVERLAY_ID}::before,
        #${OVERLAY_ID}::after,
        .relay-gf-pulse,
        .relay-gf-dash,
        .relay-gf-impact,
        .relay-gf-danger,
        .relay-gf-checkpoint,
        .relay-gf-combo,
        .relay-gf-complete{
          animation:none!important;
        }
      }

      /* =====================================================
         MOBILE
         ===================================================== */

      @media(max-width:700px){
        #${OVERLAY_ID}{
          z-index:9990;
        }
      }
    `;

    document.head.appendChild(style);
  };

  /* =========================================================
     OVERLAY
     ========================================================= */

  const ensureOverlay = () => {
    let overlay = document.getElementById(OVERLAY_ID);

    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('aria-hidden', 'true');

    (document.body || document.documentElement).appendChild(overlay);

    return overlay;
  };

  /* =========================================================
     CLEANUP
     ========================================================= */

  const removeCanvasEffects = canvas => {
    if (!canvas) return;

    canvas.classList.remove(
      'relay-gf-pulse',
      'relay-gf-dash',
      'relay-gf-impact',
      'relay-gf-danger',
      'relay-gf-checkpoint',
      'relay-gf-combo',
      'relay-gf-complete'
    );
  };

  const removeOverlayEffects = overlay => {
    if (!overlay) return;

    overlay.classList.remove(
      'is-active',
      'pulse',
      'dash',
      'impact',
      'danger',
      'checkpoint',
      'combo',
      'complete'
    );
  };

  /* =========================================================
     EFFECT ENGINE
     ========================================================= */

  let effectTimer = null;
  let lastEffect = '';
  let lastEffectAt = 0;

  const flash = (kind = 'pulse') => {
    if (reducedMotion()) return;

    const canvas = getCanvas();
    const overlay = ensureOverlay();

    if (!overlay) return;

    const allowedEffects = [
      'pulse',
      'dash',
      'impact',
      'danger',
      'checkpoint',
      'combo',
      'complete'
    ];

    const safeKind = allowedEffects.includes(kind)
      ? kind
      : 'pulse';

    const now = performance.now();

    /*
      Prevent duplicate spam.
      Same effect inside 70ms = ignore.
    */
    if (
      safeKind === lastEffect &&
      now - lastEffectAt < 70
    ) {
      return;
    }

    lastEffect = safeKind;
    lastEffectAt = now;

    if (effectTimer) {
      clearTimeout(effectTimer);
      effectTimer = null;
    }

    removeCanvasEffects(canvas);
    removeOverlayEffects(overlay);

    /*
      Force browser reflow so the same animation
      can restart reliably.
    */
    void overlay.offsetWidth;

    overlay.classList.add(
      'is-active',
      safeKind
    );

    if (canvas) {
      void canvas.offsetWidth;
      canvas.classList.add(
        `relay-gf-${safeKind}`
      );
    }

    const duration =
      safeKind === 'complete'
        ? 760
        : safeKind === 'danger'
          ? 920
          : safeKind === 'checkpoint'
            ? 540
            : safeKind === 'combo'
              ? 340
              : safeKind === 'dash'
                ? 280
                : safeKind === 'impact'
                  ? 300
                  : 360;

    effectTimer = window.setTimeout(() => {
      removeCanvasEffects(canvas);
      removeOverlayEffects(overlay);
      effectTimer = null;
    }, duration);
  };

  /* =========================================================
     EVENT ALIASES
     ========================================================= */

  const aliases = {
    'relay:signal': 'pulse',
    'relay:checkpoint': 'checkpoint',
    'relay:combo': 'combo',

    'relay:hit': 'impact',
    'relay:dash': 'dash',

    'relay:death': 'danger',

    'relay:mission-complete': 'complete'
  };

  /* =========================================================
     GAME EVENT BINDINGS
     ========================================================= */

  const bindComboFeedback = game => {
    if (
      !game?.events?.on ||
      game.__relayGameFeelComboBoundV3
    ) {
      return;
    }

    game.__relayGameFeelComboBoundV3 = true;

    game.events.on(
      'combo',
      (value, best) => {
        const combo = Number(value);

        if (
          !Number.isFinite(combo) ||
          combo < 2
        ) {
          return;
        }

        /*
          2-4  = pulse
          5-9  = combo
          10+  = complete
        */
        if (combo >= 10) {
          flash('complete');
        } else if (combo >= 5) {
          flash('combo');
        } else {
          flash('pulse');
        }
      }
    );
  };

  const bindSignalFeedback = game => {
    if (
      !game?.events?.on ||
      game.__relayGameFeelSignalBoundV3
    ) {
      return;
    }

    game.__relayGameFeelSignalBoundV3 = true;

    const onSignal = () => {
      flash('pulse');
    };

    game.events.on(
      'signal-collected',
      onSignal
    );

    game.events.on(
      'signalCollected',
      onSignal
    );
  };

  const bindGameFeelToRunner = () => {
    const game =
      window.relayRunnerGame ||
      window.__relayRunnerScene?.game ||
      null;

    bindComboFeedback(game);
    bindSignalFeedback(game);
  };

  /* =========================================================
     GLOBAL EVENTS
     ========================================================= */

  ensureStyles();

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      ensureOverlay,
      { once:true }
    );
  } else {
    ensureOverlay();
  }

  Object.entries(aliases).forEach(
    ([type, effect]) => {
      window.addEventListener(
        type,
        () => flash(effect),
        { passive:true }
      );
    }
  );

  /*
    Phaser / Runner scene ready.
  */
  window.addEventListener(
    'relay:runner-scene-ready',
    event => {
      const game =
        event.detail?.scene?.game ||
        null;

      bindComboFeedback(game);
      bindSignalFeedback(game);
    },
    { passive:true }
  );

  /*
    Try again shortly after boot.
    This handles cases where Phaser creates
    the game after this script runs.
  */
  window.setTimeout(
    bindGameFeelToRunner,
    250
  );

  window.setTimeout(
    bindGameFeelToRunner,
    1000
  );

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.relayGameFeelV1 = {
    flash
  };

  window.relayGameFeelV2 = {
    flash
  };

  window.relayGameFeelV3 = {
    flash
  };

})();