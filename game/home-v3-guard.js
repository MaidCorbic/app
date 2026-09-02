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
        border:1px solid rgba(255,208,110,.24);
        background:linear-gradient(145deg,rgba(4,13,25,.94),rgba(11,26,43,.82));
       box-shadow:
  inset 0 1px 0 rgba(255,255,255,.07),
  0 10px 26px rgba(0,0,0,.28),
  0 0 24px rgba(255,208,110,.06);
        backdrop-filter:blur(10px);
      }
      #play .hud-route { min-width:0; padding:9px 12px; border-radius:12px; display:flex; align-items:center; gap:9px; }
      #play .hud-route::after { content:""; position:absolute; inset:1px; border-radius:11px; box-shadow:inset 0 0 0 1px rgba(255,208,110,.04); pointer-events:none; }
      #play .hud-route .route-dot { width:7px; height:7px; flex:0 0 auto; box-shadow:0 0 14px rgba(255,208,110,.75); }
      #play .hud-route small { color:#ffd06e; letter-spacing:.18em; font-weight:800; }
      #play .hud-route b { display:block; margin-top:2px; letter-spacing:.06em; text-shadow:0 0 12px rgba(255,208,110,.08); }
      #play .hud-progress { min-width:0; padding:9px 12px; border-radius:12px; }
      #play .hud-progress > div { height:5px; margin-top:5px; border-radius:999px; background:rgba(220,232,241,.08); overflow:hidden; box-shadow:inset 0 0 7px rgba(0,0,0,.6); }
      #play .hud-progress i { border-radius:999px; box-shadow: 0 0 12px rgba(255,208,110,.85), 0 0 3px rgba(255,255,255,.32); transition:width .22s ease; }
      #play .hud-actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; pointer-events:auto; }
      #play .hud-xp { min-width:58px; padding:8px 10px; border-radius:11px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; line-height:1.05; }
      #play .hud-xp small { color:#8ba0b8; letter-spacing:.15em; }
      #play .hud-xp b { color:#f7d98a; text-shadow:0 0 12px rgba(247,217,138,.4); letter-spacing:.08em; }
      #play .hud-actions>button { width:46px; height:42px; border-radius:11px; color:#ffe7a6; transition:transform .12s ease,box-shadow:inset 0 1px 0 rgba(255,255,255,.08), 0 12px 28px rgba(0,0,0,.34), 0 0 26px rgba(255,208,110,.18); pointer-events:auto; }
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
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(
      90deg,
      rgba(255,208,110,.08),
      rgba(255,208,110,.42) 48%,
      rgba(141,244,255,.34) 78%,
      rgba(255,255,255,.22)
    ) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.22),
    inset 0 -1px 0 rgba(0,0,0,.18),
    0 0 20px rgba(255,208,110,.14);
  transition:
    width .12s linear,
    box-shadow .16s ease,
    filter .16s ease !important;
}

.home-v3-play .home-v3-play-fill::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,.08) 42%,
      rgba(255,255,255,.38) 50%,
      rgba(255,255,255,.08) 58%,
      transparent 100%
    );
  transform: translateX(-100%);
  animation: zipperFillEnergy 1.8s linear infinite;
  pointer-events: none;
}

@keyframes zipperFillEnergy {
  to {
    transform: translateX(100%);
  }
}

.home-v3-play.is-dragging .home-v3-play-fill {
  filter: brightness(1.12);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.30),
    inset 0 -1px 0 rgba(0,0,0,.16),
    0 0 28px rgba(255,208,110,.22),
    0 0 44px rgba(141,244,255,.10);
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
      .home-v3-play.is-dragging {
  background:
    linear-gradient(
      135deg,
      rgba(18,26,34,.99),
      rgba(10,38,52,.99) 52%,
      rgba(34,24,10,.99)
    ) !important;
  filter: brightness(1.04);
}

.home-v3-play.is-dragging .home-v3-play-label {
  color: #fff9df !important;
  text-shadow:
    0 0 16px rgba(255,208,110,.38),
    0 0 30px rgba(141,244,255,.14),
    0 1px 2px rgba(0,0,0,.6);
}

.home-v3-play.is-dragging .home-v3-play-hint {
  color: #effcff !important;
  opacity: 1;
}
.home-v3-play.is-dragging::before {
  border-color: rgba(255,208,110,.34);
  box-shadow:
    inset 0 0 18px rgba(255,208,110,.08),
    0 0 22px rgba(255,208,110,.12);
  animation: zipperChargePulse 1s ease-in-out infinite;
}

.home-v3-play.is-dragging::after {
  background:
    linear-gradient(
      90deg,
      rgba(255,208,110,.04),
      rgba(141,244,255,.08) 50%,
      rgba(255,208,110,.04)
    );
}

@keyframes zipperChargePulse {
  0%, 100% {
    opacity: .65;
  }

  50% {
    opacity: 1;
  }
}

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

  .home-v3-play .home-v3-play-fill::after {
    animation:none!important;
  }

  .home-v3-play.is-dragging::before {
    animation:none!important;
  }

  #play .hud-route .route-dot,
  .home-v3-play .home-v3-play-track,
  .home-v3-play .home-v3-play-knob::after {
    animation:none!important;
  }

  #play .hud-progress i,
  #play .hud-actions>button {
    transition:none!important;
  }

  .home-v3-play .home-v3-play-track::after {
    animation:none!important;
  }
}

      /* ZIPPER POLISH V1 */
.home-v3-play {
  position: relative;
  min-height: 74px !important;
  border-radius: 14px !important;
  overflow: hidden !important;
  isolation: isolate;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transform: translateZ(0);
}

.home-v3-play::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(
      90deg,
      rgba(255,208,110,.02),
      rgba(141,244,255,.035) 50%,
      rgba(255,208,110,.02)
    );
  pointer-events: none;
  z-index: 0;
}

.home-v3-play .home-v3-play-track {
  position: relative;
  z-index: 1;
  height: 8px !important;
  margin-inline: 18px !important;
  border-radius: 999px !important;
  overflow: hidden;
  box-shadow:
    inset 0 0 8px rgba(0,0,0,.65),
    0 0 14px rgba(141,244,255,.08);
}

.home-v3-play .home-v3-play-track::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -35%;
  width: 35%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,.12),
    rgba(255,208,110,.38),
    rgba(141,244,255,.16),
    transparent
  );
  filter: blur(1px);
  animation: zipperEnergyScan 3.2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes zipperEnergyScan {
  0% {
    transform: translateX(0);
    opacity: 0;
  }

  15% {
    opacity: .15;
  }

  45% {
    opacity: .9;
  }

  70% {
    opacity: .35;
  }

  100% {
    transform: translateX(390%);
    opacity: 0;
  }
}

.home-v3-play .home-v3-play-label {
  position: relative;
  z-index: 3;
  font-size: clamp(12px, 1.15vw, 15px) !important;
  line-height: 1.1 !important;
  letter-spacing: .16em !important;
  font-weight: 950 !important;
  white-space: nowrap;
  text-shadow:
    0 0 14px rgba(255,208,110,.28),
    0 1px 2px rgba(0,0,0,.55);
}

.home-v3-play .home-v3-play-hint {
  position: relative;
  z-index: 3;
  font-size: clamp(7px, .7vw, 9px) !important;
  line-height: 1.2 !important;
  letter-spacing: .18em !important;
  white-space: nowrap;
  opacity: .9;
}

.home-v3-play .home-v3-play-knob {
  position: relative;
  z-index: 4;
  width: 50px !important;
  height: 50px !important;
  margin-top: -25px !important;
  border-radius: 14px !important;
  border: 1px solid rgba(255,247,211,.96) !important;
  background:
    linear-gradient(
      145deg,
      #fff9e3 0%,
      #ffe39a 38%,
      #ffd06e 68%,
      #ffb83f 100%
    ) !important;
  color: #07121d !important;
  box-shadow:
    0 0 18px rgba(255,208,110,.45),
    0 0 36px rgba(255,208,110,.20),
    inset 0 2px 0 rgba(255,255,255,.96),
    inset 0 -3px 8px rgba(150,91,18,.16) !important;
  transition:
    transform .16s ease,
    box-shadow .16s ease,
    filter .16s ease !important;
}

.home-v3-play .home-v3-play-knob::before {
  content: "";
  position: absolute;
  inset: 7px;
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,.42);
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.28),
      rgba(255,255,255,0)
    );
  pointer-events: none;
}

.home-v3-play:hover .home-v3-play-knob {
  transform: scale(1.05);
  filter: brightness(1.04);
  box-shadow:
    0 0 24px rgba(255,208,110,.56),
    0 0 46px rgba(255,208,110,.24),
    inset 0 2px 0 rgba(255,255,255,.98),
    inset 0 -3px 8px rgba(150,91,18,.16) !important;
}

.home-v3-play.is-dragging .home-v3-play-knob {
  transform: scale(1.08);
  filter: brightness(1.08);
  box-shadow:
    0 0 28px rgba(141,244,255,.55),
    0 0 52px rgba(255,208,110,.25),
    0 0 80px rgba(255,208,110,.10),
    inset 0 2px 0 rgba(255,255,255,.98),
    inset 0 -3px 8px rgba(150,91,18,.14) !important;
}

@media (max-width: 700px) {
  .home-v3-play {
    min-height: 70px !important;
  }

  .home-v3-play .home-v3-play-track {
    height: 7px !important;
    margin-inline: 14px !important;
  }

  .home-v3-play .home-v3-play-label {
    font-size: 11px !important;
  }

  .home-v3-play .home-v3-play-knob {
    width: 46px !important;
    height: 46px !important;
    margin-top: -23px !important;
  }
}
/* HOME LAYOUT POLISH V1 */
@media (min-width: 881px) {
  #intro .main-menu-body {
    justify-content: center;
    padding: 40px 32px 70px;
  }

  #intro .title-lockup {
    width: min(620px, 88vw);
    gap: 0;
    transform: translateY(-2vh);
  }

  #intro .menu-tagline {
    max-width: 470px;
    margin: 24px auto 30px;
    font-size: 14px;
    line-height: 1.65;
  }

  #intro .home-v3-play {
    width: min(560px, 100%);
    margin-inline: auto;
  }

  #intro .title-secondary {
    width: min(430px, 100%);
    margin: 20px auto 0;
  }
}
/* HOME BACKGROUND POLISH V1 */
#intro .menu-backdrop {
  filter: brightness(.82) saturate(.84) contrast(1.08);
}

#intro .menu-backdrop::after {
  background:
    radial-gradient(
      circle at 50% 42%,
      transparent 0%,
      rgba(2,6,15,.08) 38%,
      rgba(2,6,15,.48) 76%,
      rgba(1,4,10,.82) 100%
    ),
    linear-gradient(
      180deg,
      rgba(2,5,10,.18) 0%,
      rgba(2,6,14,.24) 48%,
      rgba(1,4,10,.74) 100%
    ) !important;
}

#intro .backdrop-moon {
  filter: brightness(1.04);
  opacity: .94;
}

#intro .backdrop-rain {
  opacity: .34;
}

#intro .backdrop-city {
  filter: brightness(.82) contrast(1.08);
}
/* HOME SECONDARY ACTIONS POLISH V1 */
#intro .title-secondary {
  gap: 10px;
  width: min(430px, 100%);
}

#intro .title-secondary .menu-option-button {
  min-height: 54px;
  padding: 11px 14px;
  border: 1px solid rgba(141,244,255,.18) !important;
  border-radius: 10px;
  background:
    linear-gradient(
      180deg,
      rgba(8,18,31,.82),
      rgba(4,10,18,.92)
    ) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.035),
    0 8px 22px rgba(0,0,0,.22);
  transition:
    transform .16s ease,
    border-color .16s ease,
    background .16s ease,
    box-shadow .16s ease,
    color .16s ease;
}

#intro .title-secondary .menu-option-button span {
  font-size: 10px;
  letter-spacing: .14em;
}

#intro .title-secondary .menu-option-button small {
  margin-top: 6px;
  font-size: 7px;
  letter-spacing: .08em;
  opacity: .62;
}

#intro .title-secondary .menu-option-button:hover,
#intro .title-secondary .menu-option-button:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(255,208,110,.48) !important;
  background:
    linear-gradient(
      180deg,
      rgba(12,27,43,.92),
      rgba(6,14,23,.96)
    ) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 12px 28px rgba(0,0,0,.3),
    0 0 20px rgba(255,208,110,.06);
  outline: none;
}

#intro .title-secondary .exit-button:hover,
#intro .title-secondary .exit-button:focus-visible {
  border-color: rgba(255,130,110,.42) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 12px 28px rgba(0,0,0,.3),
    0 0 18px rgba(255,130,110,.05);
}
/* HOME CARD POLISH V1 */
#intro .title-lockup {
  width: min(640px, 88vw) !important;
  padding: 42px 40px 36px !important;
  border: 1px solid rgba(255,208,110,.16) !important;
  border-radius: 16px !important;
  background:
    linear-gradient(
      145deg,
      rgba(8,18,31,.95),
      rgba(3,9,17,.97) 58%,
      rgba(9,17,28,.94)
    ) !important;
  box-shadow:
    0 30px 100px rgba(0,0,0,.58),
    0 0 60px rgba(255,208,110,.045),
    inset 0 1px 0 rgba(255,255,255,.045) !important;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

#intro .title-lockup::before {
  background:
    linear-gradient(
      115deg,
      transparent 0%,
      rgba(255,255,255,.02) 42%,
      rgba(255,208,110,.055) 50%,
      transparent 58%
    ) !important;
}

#intro .title-lockup h1 {
  margin-bottom: 2px !important;
}

#intro .menu-tagline {
  max-width: 470px !important;
  margin: 25px auto 30px !important;
  color: #aebdca !important;
  line-height: 1.65 !important;
}

#intro .home-v3-play {
  margin-top: 2px;
}

@media (max-width:700px) {
  #intro .title-lockup {
    width: min(390px, 94vw) !important;
    padding: 32px 20px 28px !important;
    border-radius: 14px !important;
  }

  #intro .menu-tagline {
    margin: 20px auto 24px !important;
  }
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
