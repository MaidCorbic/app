(() => {
  'use strict';

  if (window.__relayGameplayIntroFinalV5) return;
  window.__relayGameplayIntroFinalV5 = true;

  /*
   * RELAY RUNNER
   * REAL MISSION ROUTE BRIEFING V5
   *
   * - koristi pravi Phaser runner
   * - koristi pravi scene.mission
   * - ne pravi novu gameplay mapu
   * - samo prikazuje tactical briefing prije igre
   * - 100% mobile responsive
   */

  const ROOT_ID = 'relayGameplayIntroFinalV5';

  const PLAY_BUTTONS =
    '#start,#nextMission,#again,#retry,#launchJob';

  const WAIT = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  const runner = () =>
    window.__relayRunnerScene ||
    window.game?.scene?.getScene?.('runner') ||
    null;

  const num = (v, fallback = 0) =>
    Number.isFinite(Number(v))
      ? Number(v)
      : fallback;

  const clamp = (v, min, max) =>
    Math.max(min, Math.min(max, v));

  const esc = v =>
    String(v ?? '').replace(
      /[&<>"]/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[c])
    );

  /*
   * ============================================================
   * MISSION
   * ============================================================
   */

  function getMission() {

    const scene = runner();
    const m = scene?.mission || {};

    return {
      scene,

      id:
        m.id ||
        scene?.sys?.settings?.data?.missionId ||
        document.getElementById('missionId')?.value ||
        null,

      title:
        String(
          m.title ||
          document.getElementById('objective')?.textContent ||
          'CURRENT MISSION'
        ).trim(),

      district:
        String(
          m.district ||
          document.getElementById('district')?.textContent ||
          'CURRENT DISTRICT'
        ).trim(),

      objective:
        String(
          m.objective ||
          document.getElementById('worldGoal')?.textContent ||
          'FOLLOW THE RELAY'
        ).trim()
    };
  }

  /*
   * ============================================================
   * ROOT
   * ============================================================
   */

  const root = document.createElement('section');

  root.id = ROOT_ID;
  root.hidden = true;

  root.innerHTML = `
    <div class="rv5-bg"></div>
    <div class="rv5-noise"></div>

    <div class="rv5-shell">

      <div class="rv5-topline">
        <i></i><i></i><i></i><i></i><i></i><i></i>
      </div>

      <header class="rv5-header">

        <div class="rv5-brand">

          <div class="rv5-live">
            <b></b>
            LIVE
            <span>RELAY NETWORK</span>
          </div>

          <div class="rv5-kicker">
            MISSION CONTROL / ROUTE INTELLIGENCE
          </div>

          <h1>
            MISSION <strong>ROUTE</strong>
          </h1>

          <div class="rv5-meta"></div>

        </div>

        <div class="rv5-right">

          <div class="rv5-status">
            <small>ROUTE STATUS</small>
            <strong>LOCKED</strong>
            <i></i>
          </div>

          <div class="rv5-timer">

            <svg viewBox="0 0 100 100">

              <circle
                class="timer-track"
                cx="50"
                cy="50"
                r="43">
              </circle>

              <circle
                class="timer-progress"
                cx="50"
                cy="50"
                r="43">
              </circle>

            </svg>

            <strong>10</strong>
            <small>SEC</small>

          </div>

        </div>

      </header>

      <main class="rv5-main">

        <div class="rv5-mapbar">

          <div>
            <span class="active">● LIVE</span>
            <span>GRID 04</span>
            <span>NIGHT OPS</span>
          </div>

          <b>RLY // ROUTE ACTIVE</b>

        </div>

        <div class="rv5-map">

          <svg
            class="rv5-svg"
            viewBox="0 0 1000 560"
            preserveAspectRatio="xMidYMid meet">
          </svg>

          <div class="rv5-scan"></div>
          <div class="rv5-vignette"></div>

          <div class="rv5-corner tl"></div>
          <div class="rv5-corner tr"></div>
          <div class="rv5-corner bl"></div>
          <div class="rv5-corner br"></div>

          <div class="rv5-map-label top">
            <small>TACTICAL GRID</small>
            <strong>RLY // 04 // SPINE</strong>
          </div>

          <div class="rv5-map-label bottom">
            <small>ROUTE ANALYSIS</small>
            <strong>LIVE PHASER WORLD</strong>
          </div>

          <div class="rv5-live-tag">
            <i></i>
            REAL LEVEL ROUTE
          </div>

        </div>

        <div class="rv5-stats">

          <div>
            <small>MAP SOURCE</small>
            <strong>LIVE PHASER</strong>
          </div>

          <div>
            <small>ROUTE</small>
            <strong>CALCULATED</strong>
          </div>

          <div>
            <small>THREAT</small>
            <strong class="danger">ACTIVE</strong>
          </div>

        </div>

      </main>

      <footer class="rv5-footer">

        <div class="rv5-objective">

          <div class="rv5-objective-icon">
            ◆
          </div>

          <div>
            <small>PRIMARY OBJECTIVE</small>
            <strong class="objective-text">
              FOLLOW THE RELAY
            </strong>
          </div>

        </div>

        <div class="rv5-ready">
          <i></i>
          DEPLOYMENT READY
        </div>

      </footer>

    </div>
  `;

  document.body.appendChild(root);

  /*
   * ============================================================
   * CSS
   * ============================================================
   */

  const style = document.createElement('style');

  style.id = 'relay-gameplay-intro-v5-style';

style.textContent = `

/* ============================================================
   RELAY RUNNER V5
   COD / WARZONE INSPIRED TACTICAL MISSION MAP
   VISUAL REDESIGN ONLY
   Existing SVG / route / gameplay remain untouched.
   ============================================================ */


/* ============================================================
   ROOT
   ============================================================ */

#${ROOT_ID}{
  --wz-bg:#030607;
  --wz-bg-2:#070b0b;

  --wz-panel:rgba(7,11,11,.90);
  --wz-panel-2:rgba(10,14,13,.96);

  --wz-white:#f2f2ea;
  --wz-soft:#bcc4bc;
  --wz-muted:#727b74;

  --wz-amber:#d5b553;
  --wz-amber-bright:#f0cf69;

  --wz-green:#78c879;
  --wz-red:#e45c63;

  --wz-cyan:#74dce5;

  position:fixed !important;
  inset:0 !important;

  z-index:2147483647 !important;

  display:grid !important;
  place-items:center !important;

  width:100% !important;
  height:100% !important;

  padding:10px !important;

  overflow:hidden !important;

  background:
    radial-gradient(
      circle at 50% 42%,
      rgba(109,126,112,.075),
      transparent 42%
    ),
    radial-gradient(
      circle at 50% 80%,
      rgba(213,181,83,.025),
      transparent 35%
    ),
    #030607 !important;

  color:var(--wz-white) !important;

  font-family:
    "Arial Narrow",
    "Roboto Condensed",
    "Segoe UI",
    Arial,
    sans-serif !important;

  isolation:isolate !important;

  overscroll-behavior:none !important;
}


#${ROOT_ID}[hidden]{
  display:none !important;
}


/* ============================================================
   BACKGROUND
   ============================================================ */

#${ROOT_ID} .rv5-bg{
  position:absolute !important;
  inset:0 !important;

  pointer-events:none !important;

  background:
    radial-gradient(
      ellipse at center,
      transparent 38%,
      rgba(0,0,0,.30) 100%
    ) !important;
}


#${ROOT_ID} .rv5-bg::before{
  content:"";

  position:absolute;
  inset:0;

  background:
    linear-gradient(
      rgba(170,180,170,.018) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(170,180,170,.018) 1px,
      transparent 1px
    );

  background-size:
    44px 44px;

  opacity:.9;
}


#${ROOT_ID} .rv5-bg::after{
  content:"";

  position:absolute;
  inset:0;

  background:
    linear-gradient(
      90deg,
      rgba(0,0,0,.45),
      transparent 16%,
      transparent 84%,
      rgba(0,0,0,.45)
    );
}


/* noise */

#${ROOT_ID} .rv5-noise{
  position:absolute !important;
  inset:0 !important;

  pointer-events:none !important;

  opacity:.025 !important;

  background-image:
    radial-gradient(
      #fff .45px,
      transparent .45px
    ) !important;

  background-size:
    4px 4px !important;

  mix-blend-mode:
    screen !important;
}


/* ============================================================
   MAIN SHELL
   ============================================================ */

#${ROOT_ID} .rv5-shell{
  position:relative !important;

  width:
    min(
      1520px,
      98vw
    ) !important;

  height:
    min(
      920px,
      96dvh
    ) !important;

  min-width:0 !important;
  min-height:0 !important;

  display:grid !important;

  grid-template-rows:
    auto
    minmax(0,1fr)
    auto !important;

  overflow:hidden !important;

  background:
    linear-gradient(
      150deg,
      rgba(13,16,15,.98),
      rgba(5,8,8,.985) 58%,
      rgba(2,4,5,.995)
    ) !important;

  border:
    1px solid
    rgba(191,197,184,.20) !important;

  border-radius:
    3px !important;

  box-shadow:
    0 35px 110px
      rgba(0,0,0,.82),

    0 0 60px
      rgba(213,181,83,.045),

    inset 0 1px
      rgba(255,255,255,.045) !important;
}


/* ============================================================
   TOP TACTICAL STRIP
   ============================================================ */

#${ROOT_ID} .rv5-topline{
  position:absolute !important;

  top:0 !important;
  left:0 !important;
  right:0 !important;

  height:3px !important;

  z-index:100 !important;

  display:flex !important;
}


#${ROOT_ID} .rv5-topline i{
  flex:1 !important;

  background:
    rgba(183,192,180,.18) !important;
}


#${ROOT_ID} .rv5-topline i:nth-child(1),
#${ROOT_ID} .rv5-topline i:nth-child(6){
  background:
    var(--wz-amber) !important;
}


#${ROOT_ID} .rv5-topline i:nth-child(3){
  background:
    var(--wz-cyan) !important;
}


/* ============================================================
   HEADER / COMMAND HUD
   ============================================================ */

#${ROOT_ID} .rv5-header{
  position:relative !important;

  z-index:50 !important;

  display:flex !important;

  align-items:flex-start !important;

  justify-content:space-between !important;

  gap:30px !important;

  padding:
    22px
    25px
    17px !important;

  border-bottom:
    1px solid
    rgba(185,193,183,.12) !important;

  background:
    linear-gradient(
      180deg,
      rgba(6,9,9,.98),
      rgba(6,9,9,.90),
      rgba(6,9,9,.55)
    ) !important;
}


/* left side */

#${ROOT_ID} .rv5-brand{
  min-width:0 !important;

  display:flex !important;

  flex-direction:column !important;

  align-items:flex-start !important;

  gap:5px !important;

  max-width:
    calc(
      100% - 210px
    ) !important;
}


/* live */

#${ROOT_ID} .rv5-live{
  display:flex !important;

  align-items:center !important;

  gap:8px !important;

  margin:0 !important;

  color:
    var(--wz-soft) !important;

  font-size:
    10px !important;

  line-height:
    1 !important;

  font-weight:
    900 !important;

  letter-spacing:
    .16em !important;

  text-transform:
    uppercase !important;
}


#${ROOT_ID} .rv5-live b{
  width:7px !important;
  height:7px !important;

  flex:
    0 0 7px !important;

  border-radius:50% !important;

  background:
    var(--wz-green) !important;

  box-shadow:
    0 0 10px
    rgba(120,200,121,.72) !important;

  animation:
    rv5wzLive
    1.4s
    ease-in-out
    infinite !important;
}


@keyframes rv5wzLive{

  0%,
  100%{
    opacity:1;
  }

  50%{
    opacity:.42;
  }
}


#${ROOT_ID} .rv5-live span{
  color:
    #828b84 !important;
}


/* kicker */

#${ROOT_ID} .rv5-kicker{
  margin:
    5px 0 0 !important;

  color:
    var(--wz-amber) !important;

  font-size:
    10px !important;

  line-height:
    1.1 !important;

  font-weight:
    900 !important;

  letter-spacing:
    .17em !important;

  text-transform:
    uppercase !important;
}


/* title */

#${ROOT_ID} h1{
  margin:
    2px
    0
    0 !important;

  color:
    var(--wz-white) !important;

  font-size:
    clamp(
      32px,
      4.4vw,
      54px
    ) !important;

  line-height:
    .90 !important;

  font-weight:
    950 !important;

  letter-spacing:
    .045em !important;

  text-transform:
    uppercase !important;

  text-shadow:
    0 3px 13px
    rgba(0,0,0,.9) !important;
}


#${ROOT_ID} h1 strong{
  color:
    #f0eee3 !important;

  text-shadow:
    none !important;
}


/* mission metadata */

#${ROOT_ID} .rv5-meta{
  margin:
    8px
    0
    0 !important;

  max-width:
    100% !important;

  overflow:hidden !important;

  text-overflow:ellipsis !important;

  white-space:nowrap !important;

  color:
    #a5aea6 !important;

  font-size:
    10px !important;

  line-height:
    1.2 !important;

  font-weight:
    800 !important;

  letter-spacing:
    .09em !important;

  text-transform:
    uppercase !important;
}


/* ============================================================
   RIGHT COMMAND HUD
   ============================================================ */

#${ROOT_ID} .rv5-right{
  display:flex !important;

  align-items:flex-start !important;

  gap:13px !important;

  flex:
    0 0 auto !important;
}


/* status */

#${ROOT_ID} .rv5-status{
  position:relative !important;

  min-width:
    156px !important;

  min-height:
    70px !important;

  padding:
    11px 13px !important;

  border:
    1px solid
    rgba(196,202,192,.17) !important;

  border-top:
    2px solid
    var(--wz-green) !important;

  border-radius:
    2px !important;

  background:
    linear-gradient(
      145deg,
      rgba(15,20,18,.95),
      rgba(5,9,8,.97)
    ) !important;

  box-shadow:
    inset 0 0 24px
      rgba(120,200,121,.02),

    0 12px 30px
      rgba(0,0,0,.36) !important;
}


#${ROOT_ID} .rv5-status small{
  display:block !important;

  margin-bottom:
    8px !important;

  color:
    #828a83 !important;

  font-size:
    8px !important;

  line-height:
    1 !important;

  font-weight:
    900 !important;

  letter-spacing:
    .17em !important;

  text-transform:
    uppercase !important;
}


#${ROOT_ID} .rv5-status strong{
  color:
    var(--wz-green) !important;

  font-size:
    17px !important;

  line-height:
    1 !important;

  font-weight:
    950 !important;

  letter-spacing:
    .13em !important;
}


#${ROOT_ID} .rv5-status i{
  position:absolute !important;

  right:
    11px !important;

  bottom:
    11px !important;

  width:7px !important;
  height:7px !important;

  border-radius:50% !important;

  background:
    var(--wz-green) !important;

  box-shadow:
    0 0 10px
    rgba(120,200,121,.72) !important;
}


/* ============================================================
   LARGE COUNTER
   ============================================================ */

#${ROOT_ID} .rv5-timer{
  position:relative !important;

  width:
    108px !important;

  height:
    108px !important;

  min-width:
    108px !important;

  min-height:
    108px !important;

  flex:
    0 0 108px !important;

  display:flex !important;

  flex-direction:
    column !important;

  align-items:center !important;

  justify-content:center !important;

  border:
    1px solid
    rgba(213,181,83,.58) !important;

  border-radius:
    2px !important;

  background:
    linear-gradient(
      145deg,
      rgba(32,29,17,.97),
      rgba(9,11,10,.98)
    ) !important;

  box-shadow:
    0 0 30px
      rgba(213,181,83,.07),

    inset 0 0 30px
      rgba(213,181,83,.035) !important;

  overflow:hidden !important;
}


/* hide old circular progress visually */

#${ROOT_ID} .rv5-timer svg{
  position:absolute !important;

  inset:0 !important;

  width:100% !important;
  height:100% !important;

  transform:none !important;

  opacity:.25 !important;
}


/* timer track */

#${ROOT_ID} .rv5-timer .timer-track{
  stroke:
    rgba(213,181,83,.11) !important;

  stroke-width:
    1.5 !important;
}


/* timer progress */

#${ROOT_ID} .rv5-timer .timer-progress{
  stroke:
    var(--wz-amber-bright) !important;

  stroke-width:
    2.5 !important;

  stroke-linecap:
    square !important;

  filter:
    drop-shadow(
      0 0 5px
      rgba(240,207,105,.55)
    ) !important;
}


/* top tactical label */

#${ROOT_ID} .rv5-timer::before{
  content:
    "DEPLOYMENT" !important;

  position:absolute !important;

  top:
    10px !important;

  left:
    0 !important;

  right:
    0 !important;

  z-index:
    4 !important;

  color:
    rgba(240,207,105,.80) !important;

  text-align:
    center !important;

  font-size:
    8px !important;

  line-height:
    1 !important;

  font-weight:
    900 !important;

  letter-spacing:
    .18em !important;
}


/* bottom tactical corner */

#${ROOT_ID} .rv5-timer::after{
  content:"";

  position:absolute !important;

  right:0 !important;
  bottom:0 !important;

  width:18px !important;
  height:18px !important;

  border-right:
    2px solid
    var(--wz-amber) !important;

  border-bottom:
    2px solid
    var(--wz-amber) !important;
}


/* BIG NUMBER */

#${ROOT_ID} .rv5-timer strong{
  position:relative !important;

  z-index:5 !important;

  margin:
    6px
    0
    0 !important;

  color:
    #f5f1df !important;

  font-family:
    "Arial Narrow",
    "Roboto Condensed",
    Arial,
    sans-serif !important;

  font-size:
    52px !important;

  line-height:
    .82 !important;

  font-weight:
    950 !important;

  letter-spacing:
    -.035em !important;

  text-shadow:
    0 0 15px
    rgba(240,207,105,.16) !important;
}


/* seconds */

#${ROOT_ID} .rv5-timer small{
  position:relative !important;

  z-index:5 !important;

  margin:
    10px
    0
    0 !important;

  color:
    var(--wz-amber-bright) !important;

  font-size:
    9px !important;

  line-height:
    1 !important;

  font-weight:
    950 !important;

  letter-spacing:
    .26em !important;

  text-transform:
    uppercase !important;
}


/* ============================================================
   MAP AREA
   ============================================================ */

#${ROOT_ID} .rv5-main{
  position:relative !important;

  min-width:0 !important;
  min-height:0 !important;

  display:grid !important;

  grid-template-rows:
    44px
    minmax(0,1fr)
    48px !important;

  overflow:hidden !important;
}


/* map top bar */

#${ROOT_ID} .rv5-mapbar{
  position:relative !important;

  z-index:30 !important;

  min-width:0 !important;

  display:flex !important;

  align-items:center !important;

  justify-content:space-between !important;

  gap:14px !important;

  padding:
    0
    16px !important;

  background:
    linear-gradient(
      180deg,
      rgba(8,12,12,.98),
      rgba(4,7,7,.98)
    ) !important;

  border-top:
    1px solid
    rgba(191,198,188,.08) !important;

  border-bottom:
    1px solid
    rgba(191,198,188,.12) !important;
}


#${ROOT_ID} .rv5-mapbar > div{
  display:flex !important;

  align-items:center !important;

  gap:
    7px !important;

  min-width:
    0 !important;
}


#${ROOT_ID} .rv5-mapbar span{
  display:inline-flex !important;

  align-items:center !important;

  min-height:
    28px !important;

  padding:
    5px 9px !important;

  color:
    #7f8982 !important;

  font-size:
    9px !important;

  line-height:
    1 !important;

  font-weight:
    900 !important;

  letter-spacing:
    .10em !important;

  border:
    1px solid
    rgba(180,189,179,.11) !important;

  background:
    rgba(255,255,255,.018) !important;

  white-space:
    nowrap !important;
}


#${ROOT_ID} .rv5-mapbar span.active{
  color:
    var(--wz-green) !important;

  border-color:
    rgba(120,200,121,.28) !important;

  background:
    rgba(120,200,121,.045) !important;
}


#${ROOT_ID} .rv5-mapbar b{
  flex:
    0 0 auto !important;

  color:
    var(--wz-amber) !important;

  font-size:
    9px !important;

  line-height:
    1 !important;

  font-weight:
    950 !important;

  letter-spacing:
    .13em !important;

  white-space:
    nowrap !important;
}


/* ============================================================
   MAP FRAME
   ============================================================ */

#${ROOT_ID} .rv5-map{
  position:relative !important;

  min-width:0 !important;
  min-height:0 !important;

  overflow:hidden !important;

  background:
    radial-gradient(
      ellipse at 50% 43%,
      rgba(64,84,74,.18),
      transparent 53%
    ),
    linear-gradient(
      180deg,
      #0a0f0f,
      #030707 70%
    ) !important;

  border-top:
    1px solid
    rgba(194,200,190,.10) !important;

  border-bottom:
    1px solid
    rgba(194,200,190,.10) !important;

  box-shadow:
    inset 0 0 90px
      rgba(0,0,0,.72) !important;
}


/* central crosshair */

#${ROOT_ID} .rv5-map::before{
  content:"";

  position:absolute;

  inset:0;

  z-index:4;

  pointer-events:none;

  background:
    linear-gradient(
      90deg,
      transparent 49.9%,
      rgba(214,186,91,.09) 50%,
      transparent 50.1%
    ),
    linear-gradient(
      0deg,
      transparent 49.9%,
      rgba(214,186,91,.07) 50%,
      transparent 50.1%
    );

  opacity:.7;
}


/* scan */

#${ROOT_ID} .rv5-scan{
  position:absolute !important;

  left:0 !important;
  right:0 !important;

  top:-130px !important;

  z-index:8 !important;

  height:
    120px !important;

  pointer-events:none !important;

  background:
    linear-gradient(
      180deg,
      transparent,
      rgba(213,181,83,.05),
      transparent
    ) !important;

  animation:
    rv5wzScan
    5s
    linear
    infinite !important;
}


@keyframes rv5wzScan{

  0%{
    transform:translateY(0);
    opacity:0;
  }

  12%{
    opacity:.9;
  }

  85%{
    opacity:.25;
  }

  100%{
    transform:translateY(760px);
    opacity:0;
  }
}


/* vignette */

#${ROOT_ID} .rv5-vignette{
  position:absolute !important;

  inset:0 !important;

  z-index:9 !important;

  pointer-events:none !important;

  background:
    radial-gradient(
      ellipse at center,
      transparent 48%,
      rgba(0,0,0,.15) 72%,
      rgba(0,0,0,.62) 100%
    ) !important;
}


/* actual SVG */

#${ROOT_ID} .rv5-svg{
  position:absolute !important;

  inset:0 !important;

  z-index:2 !important;

  width:
    100% !important;

  height:
    100% !important;

  display:block !important;

  max-width:
    100% !important;

  max-height:
    100% !important;
}


/* ============================================================
   MAP CORNERS
   ============================================================ */

#${ROOT_ID} .rv5-corner{
  position:absolute !important;

  z-index:20 !important;

  width:
    32px !important;

  height:
    32px !important;

  border-color:
    rgba(213,181,83,.62) !important;

  border-style:
    solid !important;

  pointer-events:
    none !important;
}


#${ROOT_ID} .rv5-corner.tl{
  top:12px;
  left:12px;

  border-width:
    2px
    0
    0
    2px;
}


#${ROOT_ID} .rv5-corner.tr{
  top:12px;
  right:12px;

  border-width:
    2px
    2px
    0
    0;
}


#${ROOT_ID} .rv5-corner.bl{
  bottom:12px;
  left:12px;

  border-width:
    0
    0
    2px
    2px;
}


#${ROOT_ID} .rv5-corner.br{
  right:12px;
  bottom:12px;

  border-width:
    0
    2px
    2px
    0;
}


/* ============================================================
   MAP OVERLAY LABELS
   ============================================================ */

#${ROOT_ID} .rv5-map-label{
  position:absolute !important;

  z-index:22 !important;

  display:grid !important;

  gap:5px !important;

  min-width:0 !important;

  padding:
    9px
    11px !important;

  border-left:
    3px solid
    var(--wz-amber) !important;

  background:
    rgba(4,8,8,.78) !important;

  box-shadow:
    0 8px 25px
      rgba(0,0,0,.34) !important;

  backdrop-filter:
    blur(8px) !important;

  pointer-events:
    none !important;
}


#${ROOT_ID} .rv5-map-label.top{
  top:
    20px !important;

  left:
    22px !important;
}


#${ROOT_ID} .rv5-map-label.bottom{
  right:
    22px !important;

  bottom:
    20px !important;

  text-align:
    right !important;

  border-left:
    0 !important;

  border-right:
    3px solid
    var(--wz-amber) !important;
}


#${ROOT_ID} .rv5-map-label small{
  color:
    #889189 !important;

  font-size:
    8px !important;

  line-height:
    1 !important;

  font-weight:
    900 !important;

  letter-spacing:
    .16em !important;

  text-transform:
    uppercase !important;
}


#${ROOT_ID} .rv5-map-label strong{
  color:
    #edf0e7 !important;

  font-size:
    12px !important;

  line-height:
    1.1 !important;

  font-weight:
    950 !important;

  letter-spacing:
    .07em !important;
}


/* live tag */

#${ROOT_ID} .rv5-live-tag{
  position:absolute !important;

  left:
    20px !important;

  bottom:
    20px !important;

  z-index:
    23 !important;

  display:flex !important;

  align-items:center !important;

  gap:
    8px !important;

  padding:
    9px
    11px !important;

  color:
    var(--wz-green) !important;

  font-size:
    8px !important;

  line-height:
    1 !important;

  font-weight:
    950 !important;

  letter-spacing:
    .11em !important;

  border:
    1px solid
    rgba(120,200,121,.22) !important;

  background:
    rgba(5,10,8,.82) !important;

  box-shadow:
    0 8px 25px
      rgba(0,0,0,.28) !important;

  backdrop-filter:
    blur(7px) !important;
}


#${ROOT_ID} .rv5-live-tag i{
  width:
    7px !important;

  height:
    7px !important;

  flex:
    0 0 7px !important;

  border-radius:
    50% !important;

  background:
    var(--wz-green) !important;

  box-shadow:
    0 0 9px
    rgba(120,200,121,.7) !important;
}


/* ============================================================
   SVG MAP STYLING
   ============================================================ */

#${ROOT_ID} .grid{
  stroke:
    #47514a !important;

  stroke-width:
    1 !important;

  opacity:
    .31 !important;
}


#${ROOT_ID} .grid-major{
  stroke:
    #697263 !important;

  stroke-width:
    1.35 !important;

  opacity:
    .30 !important;
}


/* buildings */

#${ROOT_ID} .platform{
  fill:
    #141a17 !important;

  stroke:
    #606a5f !important;

  stroke-width:
    1.35 !important;
}

#${ROOT_ID} .building-inner{
  fill:#1b231f !important;
  stroke:#303a33 !important;
  stroke-width:1px !important;
  opacity:.95 !important;
}

#${ROOT_ID} .building-edge-bottom{
  stroke:#8e9a88 !important;
  stroke-width:1 !important;
  opacity:.18 !important;
}

#${ROOT_ID} .hostile-pulse{
  fill:none !important;
  stroke:var(--wz-red) !important;
  stroke-width:1.5 !important;
  opacity:.35 !important;
  animation:rv5HostilePulse 1.4s ease-in-out infinite !important;
}

@keyframes rv5HostilePulse{
  0%,100%{
    opacity:.18;
    transform:scale(.92);
    transform-origin:center;
  }

  50%{
    opacity:.48;
    transform:scale(1.06);
  }
}

#${ROOT_ID} .hostile-cross{
  stroke:#ff9a9f !important;
  stroke-width:1.4 !important;
  opacity:.85 !important;
}

#${ROOT_ID} .gate-line{
  stroke:#ff6877 !important;
  stroke-width:1.5 !important;
  opacity:.42 !important;
}

#${ROOT_ID} .checkpoint-zone{
  fill:none !important;
  stroke:var(--wz-cyan) !important;
  stroke-width:1 !important;
  stroke-dasharray:4 5 !important;
  opacity:.28 !important;
}

#${ROOT_ID} .checkpoint-line{
  stroke:var(--wz-cyan) !important;
  stroke-width:1.5 !important;
  opacity:.75 !important;
}

#${ROOT_ID} .signal-ring{
  fill:none !important;
  stroke:var(--wz-amber-bright) !important;
  stroke-width:1 !important;
  stroke-dasharray:3 4 !important;
  opacity:.40 !important;
  animation:rv5SignalRing 1.8s linear infinite !important;
}

@keyframes rv5SignalRing{
  to{
    transform:rotate(360deg);
    transform-origin:center;
  }
}

#${ROOT_ID} .enemy-radius{
  fill:none !important;
  stroke:var(--wz-red) !important;
  stroke-width:1 !important;
  stroke-dasharray:3 5 !important;
  opacity:.30 !important;
}

#${ROOT_ID} .enemy-cross{
  stroke:#ff8d95 !important;
  stroke-width:1.2 !important;
  opacity:.80 !important;
}

#${ROOT_ID} .guide-stem{
  stroke:var(--wz-amber) !important;
  stroke-width:1 !important;
  opacity:.38 !important;
}

#${ROOT_ID} .start-radius{
  fill:none !important;
  stroke:var(--wz-green) !important;
  stroke-width:1 !important;
  stroke-dasharray:3 5 !important;
  opacity:.25 !important;
}

#${ROOT_ID} .start-ring{
  fill:none !important;
  stroke:var(--wz-green) !important;
  stroke-width:1.5 !important;
  opacity:.70 !important;
}

#${ROOT_ID} .goal-radius{
  fill:none !important;
  stroke:var(--wz-amber-bright) !important;
  stroke-width:1 !important;
  stroke-dasharray:4 6 !important;
  opacity:.30 !important;
}

#${ROOT_ID} .goal-ring{
  fill:none !important;
  stroke:var(--wz-amber-bright) !important;
  stroke-width:1.5 !important;
  opacity:.72 !important;
}

#${ROOT_ID} .player-radius{
  fill:none !important;
  stroke:var(--wz-cyan) !important;
  stroke-width:1 !important;
  stroke-dasharray:3 5 !important;
  opacity:.30 !important;
}

#${ROOT_ID} .player-cross{
  stroke:var(--wz-cyan) !important;
  stroke-width:1.5 !important;
  opacity:.90 !important;
}


#${ROOT_ID} .edge{
  stroke:
    #8e9a88 !important;

  opacity:
    .30 !important;
}


/* route halo */

#${ROOT_ID} .route-halo{
  fill:
    none !important;

  stroke:
    var(--wz-amber) !important;

  stroke-width:
    20 !important;

  opacity:
    .08 !important;

  filter:
    drop-shadow(
      0 0 8px
      rgba(213,181,83,.25)
    ) !important;
}


/* route */

#${ROOT_ID} .route{
  fill:
    none !important;

  stroke:
    var(--wz-amber-bright) !important;

  stroke-width:
    4 !important;

  stroke-linecap:
    round !important;

  stroke-linejoin:
    round !important;

  stroke-dasharray:
    14
    8 !important;

  animation:
    rv5wzRoute
    1.35s
    linear
    infinite !important;

  filter:
    drop-shadow(
      0 0 5px
      rgba(240,207,105,.60)
    ) !important;
}


@keyframes rv5wzRoute{

  to{
    stroke-dashoffset:-44;
  }
}


/* route core */

#${ROOT_ID} .route-core{
  fill:
    none !important;

  stroke:
    #fffbea !important;

  stroke-width:
    1.2 !important;

  opacity:
    .78 !important;
}


/* ============================================================
   MARKERS
   ============================================================ */

#${ROOT_ID} .start{
  fill:
    var(--wz-green) !important;

  stroke:
    #edffe8 !important;

  stroke-width:
    2.5 !important;

  filter:
    drop-shadow(
      0 0 7px
      rgba(120,200,121,.75)
    ) !important;
}


#${ROOT_ID} .goal{
  fill:
    var(--wz-amber-bright) !important;

  stroke:
    #fff4c9 !important;

  stroke-width:
    2.5 !important;

  filter:
    drop-shadow(
      0 0 8px
      rgba(240,207,105,.75)
    ) !important;
}


#${ROOT_ID} .player{
  fill:
    #ffffff !important;

  stroke:
    var(--wz-cyan) !important;

  stroke-width:
    2.7 !important;

  filter:
    drop-shadow(
      0 0 7px
      rgba(116,220,229,.78)
    ) !important;
}


#${ROOT_ID} .player-ring{
  fill:
    none !important;

  stroke:
    var(--wz-cyan) !important;

  stroke-width:
    2 !important;

  stroke-dasharray:
    7 5 !important;

  opacity:
    .95 !important;

  animation:
    rv5wzRing
    1.6s
    linear
    infinite !important;

  transform-origin:
    center !important;

  filter:
    drop-shadow(
      0 0 5px
      rgba(116,220,229,.55)
    ) !important;
}


@keyframes rv5wzRing{

  to{
    transform:
      rotate(360deg);
  }
}


/* checkpoints */

#${ROOT_ID} .checkpoint{
  fill:
    rgba(116,220,229,.045) !important;

  stroke:
    var(--wz-cyan) !important;

  stroke-width:
    2 !important;

  filter:
    drop-shadow(
      0 0 4px
      rgba(116,220,229,.38)
    ) !important;
}


#${ROOT_ID} .checkpoint-dot{
  fill:
    #eafcff !important;

  filter:
    drop-shadow(
      0 0 6px
      rgba(116,220,229,.85)
    ) !important;
}


/* hostile */

#${ROOT_ID} .danger-object{
  fill:
    #35191d !important;

  stroke:
    var(--wz-red) !important;

  stroke-width:
    1.8 !important;

  filter:
    drop-shadow(
      0 0 6px
      rgba(228,92,99,.35)
    ) !important;
}


/* signals */

#${ROOT_ID} .signal{
  fill:
    var(--wz-amber-bright) !important;

  filter:
    drop-shadow(
      0 0 5px
      rgba(240,207,105,.55)
    ) !important;
}


/* ============================================================
   MAP TEXT
   ============================================================ */

#${ROOT_ID} .label{
  fill:
    #f1f3ec !important;

  font-family:
    "Arial Narrow",
    "Roboto Condensed",
    Arial,
    sans-serif !important;

  font-size:
    11px !important;

  font-weight:
    950 !important;

  letter-spacing:
    .035em !important;

  paint-order:
    stroke !important;

  stroke:
    #030606 !important;

  stroke-width:
    4px !important;

  stroke-linejoin:
    round !important;

  text-shadow:
    0 2px 9px
    rgba(0,0,0,.96) !important;
}


/* YOU */

#${ROOT_ID} #rv5-player text{
  fill:
    #ffffff !important;

  font-size:
    14px !important;

  font-weight:
    950 !important;

  letter-spacing:
    .08em !important;

  paint-order:
    stroke !important;

  stroke:
    #020607 !important;

  stroke-width:
    4px !important;

  filter:
    drop-shadow(
      0 0 5px
      rgba(116,220,229,.65)
    ) !important;
}


/* instructional labels */

#${ROOT_ID} .guide{
  fill:
    #d9dfd8 !important;

  font-family:
    "Arial Narrow",
    "Roboto Condensed",
    Arial,
    sans-serif !important;

  font-size:
    10px !important;

  font-weight:
    900 !important;

  letter-spacing:
    .035em !important;

  paint-order:
    stroke !important;

  stroke:
    #020606 !important;

  stroke-width:
    3.5px !important;

  stroke-linejoin:
    round !important;
}


/* ============================================================
   BOTTOM STATS
   ============================================================ */

#${ROOT_ID} .rv5-stats{
  min-height:
    48px !important;

  display:grid !important;

  grid-template-columns:
    repeat(
      3,
      minmax(0,1fr)
    ) !important;

  background:
    rgba(4,7,7,.98) !important;

  border-top:
    1px solid
    rgba(190,198,188,.10) !important;
}


#${ROOT_ID} .rv5-stats div{
  min-width:
    0 !important;

  display:flex !important;

  flex-direction:
    column !important;

  align-items:
    center !important;

  justify-content:
    center !important;

  gap:
    4px !important;

  border-right:
    1px solid
    rgba(190,198,188,.08) !important;
}


#${ROOT_ID} .rv5-stats div:last-child{
  border-right:
    0 !important;
}


#${ROOT_ID} .rv5-stats small{
  color:
    #737d75 !important;

  font-size:
    7px !important;

  line-height:
    1 !important;

  font-weight:
    900 !important;

  letter-spacing:
    .13em !important;

  text-transform:
    uppercase !important;
}


#${ROOT_ID} .rv5-stats strong{
  color:
    #e4e9e2 !important;

  font-size:
    10px !important;

  line-height:
    1 !important;

  font-weight:
    950 !important;

  letter-spacing:
    .07em !important;
}


#${ROOT_ID} .rv5-stats .danger{
  color:
    var(--wz-red) !important;

  text-shadow:
    0 0 9px
    rgba(228,92,99,.16) !important;
}


/* ============================================================
   FOOTER
   ============================================================ */

#${ROOT_ID} .rv5-footer{
  min-height:
    78px !important;

  display:flex !important;

  align-items:center !important;

  justify-content:space-between !important;

  gap:
    18px !important;

  padding:
    11px
    20px !important;

  border-top:
    1px solid
    rgba(190,198,188,.13) !important;

  background:
    linear-gradient(
      180deg,
      rgba(7,10,10,.96),
      rgba(3,6,6,.995)
    ) !important;
}


/* objective */

#${ROOT_ID} .rv5-objective{
  min-width:
    0 !important;

  display:flex !important;

  align-items:center !important;

  gap:
    12px !important;

  padding:
    8px
    12px !important;

  border:
    1px solid
    rgba(190,198,188,.13) !important;

  border-left:
    3px solid
    var(--wz-amber) !important;

  background:
    rgba(255,255,255,.018) !important;

  box-shadow:
    inset 0 0 18px
    rgba(213,181,83,.02) !important;
}


#${ROOT_ID} .rv5-objective-icon{
  width:
    32px !important;

  height:
    32px !important;

  flex:
    0 0 32px !important;

  display:grid !important;

  place-items:center !important;

  color:
    var(--wz-amber-bright) !important;

  border:
    1px solid
    rgba(213,181,83,.35) !important;

  background:
    rgba(213,181,83,.045) !important;

  transform:
    rotate(45deg) !important;
}


#${ROOT_ID} .rv5-objective-icon::first-letter{
  transform:
    rotate(-45deg) !important;
}


#${ROOT_ID} .rv5-objective small{
  display:block !important;

  margin-bottom:
    5px !important;

  color:
    var(--wz-amber) !important;

  font-size:
    8px !important;

  line-height:
    1 !important;

  font-weight:
    950 !important;

  letter-spacing:
    .14em !important;
}


#${ROOT_ID} .objective-text{
  display:block !important;

  max-width:
    min(
      70vw,
      760px
    ) !important;

  overflow:hidden !important;

  text-overflow:ellipsis !important;

  white-space:nowrap !important;

  color:
    #f0f2ec !important;

  font-size:
    14px !important;

  line-height:
    1.15 !important;

  font-weight:
    950 !important;

  letter-spacing:
    .035em !important;
}


/* ready */

#${ROOT_ID} .rv5-ready{
  display:flex !important;

  align-items:center !important;

  gap:
    8px !important;

  flex:
    0 0 auto !important;

  color:
    var(--wz-green) !important;

  font-size:
    9px !important;

  line-height:
    1 !important;

  font-weight:
    950 !important;

  letter-spacing:
    .13em !important;

  white-space:
    nowrap !important;
}


#${ROOT_ID} .rv5-ready i{
  width:
    7px !important;

  height:
    7px !important;

  flex:
    0 0 7px !important;

  border-radius:
    50% !important;

  background:
    var(--wz-green) !important;

  box-shadow:
    0 0 10px
    rgba(120,200,121,.74) !important;
}


/* ============================================================
   OPEN ANIMATION
   ============================================================ */

#${ROOT_ID}.opening .rv5-shell{
  animation:
    rv5wzOpen
    .45s
    cubic-bezier(
      .16,
      .84,
      .22,
      1
    )
    both !important;
}


@keyframes rv5wzOpen{

  from{
    opacity:0;

    transform:
      translateY(12px)
      scale(.992);

    filter:
      brightness(.7)
      blur(4px);
  }

  to{
    opacity:1;

    transform:
      none;

    filter:
      none;
  }
}


/* ============================================================
   TABLET
   ============================================================ */

@media(max-width:900px){

  #${ROOT_ID}{
    padding:
      5px !important;
  }


  #${ROOT_ID} .rv5-shell{
    width:
      99vw !important;

    height:
      98dvh !important;

    border-radius:
      3px !important;
  }


  #${ROOT_ID} .rv5-header{
    padding:
      15px
      15px
      12px !important;

    gap:
      15px !important;
  }


  #${ROOT_ID} .rv5-brand{
    max-width:
      calc(
        100% - 105px
      ) !important;
  }


  #${ROOT_ID} .rv5-status{
    display:none !important;
  }


  #${ROOT_ID} .rv5-timer{
    width:
      88px !important;

    height:
      88px !important;

    min-width:
      88px !important;

    min-height:
      88px !important;

    flex-basis:
      88px !important;
  }


  #${ROOT_ID} .rv5-timer strong{
    font-size:
      41px !important;
  }


  #${ROOT_ID} .rv5-main{
    grid-template-rows:
      40px
      minmax(0,1fr)
      45px !important;
  }


  #${ROOT_ID} .rv5-footer{
    min-height:
      68px !important;
  }


  #${ROOT_ID} .objective-text{
    max-width:
      62vw !important;
  }
}


/* ============================================================
   MOBILE
   ============================================================ */

@media(max-width:600px){

  #${ROOT_ID}{
    padding:0 !important;
  }

  #${ROOT_ID} .rv5-shell{
    width:100vw !important;
    height:100dvh !important;
    min-width:0 !important;
    min-height:0 !important;
    border:0 !important;
    border-radius:0 !important;
    display:grid !important;
    grid-template-rows:auto minmax(0,1fr) auto !important;
  }

  #${ROOT_ID} .rv5-header{
    padding:12px 12px 10px !important;
    gap:10px !important;
    align-items:flex-start !important;
  }

  #${ROOT_ID} .rv5-brand{
    min-width:0 !important;
    max-width:calc(100% - 92px) !important;
    gap:4px !important;
  }

  #${ROOT_ID} .rv5-live{
    font-size:8px !important;
    line-height:1.05 !important;
    letter-spacing:.12em !important;
  }

  #${ROOT_ID} .rv5-live b{
    width:6px !important;
    height:6px !important;
    flex-basis:6px !important;
  }

  #${ROOT_ID} .rv5-kicker{
    margin-top:2px !important;
    font-size:7px !important;
    line-height:1.15 !important;
    letter-spacing:.10em !important;
  }

  #${ROOT_ID} h1{
    margin-top:2px !important;
    font-size:clamp(23px,7.3vw,32px) !important;
    line-height:.92 !important;
    letter-spacing:.035em !important;
  }

  #${ROOT_ID} .rv5-meta{
    margin-top:5px !important;
    max-width:100% !important;
    font-size:8px !important;
    line-height:1.2 !important;
    letter-spacing:.07em !important;
  }

  /* MOBILE BIG COUNTER */

  #${ROOT_ID} .rv5-timer{
    width:82px !important;
    height:82px !important;
    min-width:82px !important;
    min-height:82px !important;
    flex:0 0 82px !important;
    border-radius:2px !important;
  }

  #${ROOT_ID} .rv5-timer svg{
    opacity:.22 !important;
  }

  #${ROOT_ID} .rv5-timer::before{
    top:8px !important;
    font-size:7px !important;
    letter-spacing:.14em !important;
  }

  #${ROOT_ID} .rv5-timer strong{
    margin-top:5px !important;
    font-size:38px !important;
    line-height:.82 !important;
  }

  #${ROOT_ID} .rv5-timer small{
    margin-top:8px !important;
    font-size:7px !important;
    letter-spacing:.20em !important;
  }

  #${ROOT_ID} .rv5-main{
    min-height:0 !important;
    grid-template-rows:38px minmax(0,1fr) 44px !important;
  }

  #${ROOT_ID} .rv5-mapbar{
    min-width:0 !important;
    padding:0 8px !important;
    gap:8px !important;
  }

  #${ROOT_ID} .rv5-mapbar > div{
    min-width:0 !important;
    gap:5px !important;
    overflow:hidden !important;
  }

  #${ROOT_ID} .rv5-mapbar span{
    min-height:26px !important;
    padding:5px 7px !important;
    font-size:7px !important;
    letter-spacing:.08em !important;
  }

  #${ROOT_ID} .rv5-mapbar span:nth-child(3){
    display:none !important;
  }

  #${ROOT_ID} .rv5-mapbar b{
    flex:0 0 auto !important;
    font-size:7px !important;
    letter-spacing:.07em !important;
  }

  #${ROOT_ID} .rv5-map{
    min-width:0 !important;
    min-height:0 !important;
    width:100% !important;
    height:100% !important;
  }

  #${ROOT_ID} .rv5-svg{
    width:100% !important;
    height:100% !important;
    display:block !important;
    max-width:100% !important;
    max-height:100% !important;
  }

  #${ROOT_ID} .rv5-corner{
    width:24px !important;
    height:24px !important;
  }

  #${ROOT_ID} .rv5-corner.tl{
    top:7px !important;
    left:7px !important;
  }

  #${ROOT_ID} .rv5-corner.tr{
    top:7px !important;
    right:7px !important;
  }

  #${ROOT_ID} .rv5-corner.bl{
    bottom:7px !important;
    left:7px !important;
  }

  #${ROOT_ID} .rv5-corner.br{
    right:7px !important;
    bottom:7px !important;
  }

  #${ROOT_ID} .rv5-map-label{
    padding:6px 8px !important;
    gap:4px !important;
  }

  #${ROOT_ID} .rv5-map-label.top{
    top:10px !important;
    left:10px !important;
  }

  #${ROOT_ID} .rv5-map-label.bottom{
    right:10px !important;
    bottom:10px !important;
  }

  #${ROOT_ID} .rv5-map-label small{
    font-size:7px !important;
    line-height:1.1 !important;
  }

  #${ROOT_ID} .rv5-map-label strong{
    font-size:9px !important;
    line-height:1.1 !important;
  }

  #${ROOT_ID} .rv5-live-tag{
    left:9px !important;
    bottom:9px !important;
    padding:7px 9px !important;
    gap:6px !important;
    font-size:7px !important;
    letter-spacing:.08em !important;
  }

  #${ROOT_ID} .rv5-live-tag i{
    width:6px !important;
    height:6px !important;
    flex-basis:6px !important;
  }

  #${ROOT_ID} .rv5-stats{
    min-height:44px !important;
  }

  #${ROOT_ID} .rv5-stats small{
    font-size:6px !important;
    letter-spacing:.10em !important;
  }

  #${ROOT_ID} .rv5-stats strong{
    font-size:9px !important;
    letter-spacing:.05em !important;
  }

  #${ROOT_ID} .rv5-footer{
    min-height:62px !important;
    padding:8px 10px !important;
    gap:8px !important;
  }

  #${ROOT_ID} .rv5-objective{
    min-width:0 !important;
    gap:8px !important;
    padding:6px 8px !important;
    border-left-width:2px !important;
  }

  #${ROOT_ID} .rv5-objective-icon{
    width:26px !important;
    height:26px !important;
    flex:0 0 26px !important;
  }

  #${ROOT_ID} .rv5-objective small{
    margin-bottom:4px !important;
    font-size:6px !important;
    line-height:1 !important;
  }

  #${ROOT_ID} .objective-text{
    max-width:69vw !important;
    font-size:10px !important;
    line-height:1.25 !important;
    white-space:normal !important;
    overflow:hidden !important;
    text-overflow:clip !important;
    display:-webkit-box !important;
    -webkit-box-orient:vertical !important;
    -webkit-line-clamp:2 !important;
    overflow-wrap:anywhere !important;
  }

  #${ROOT_ID} .rv5-ready{
    display:none !important;
  }

  #${ROOT_ID} .label{
    font-size:10px !important;
    font-weight:950 !important;
    stroke-width:3px !important;
  }

  #${ROOT_ID} #rv5-player text{
    font-size:12px !important;
    font-weight:950 !important;
  }

  #${ROOT_ID} .guide{
    font-size:8px !important;
    font-weight:900 !important;
    stroke-width:2.5px !important;
  }
}


/* ============================================================
   VERY SMALL PHONES
   ============================================================ */

@media(max-width:400px){

  #${ROOT_ID} .rv5-header{
    padding:8px 9px !important;
  }

  #${ROOT_ID} .rv5-brand{
    max-width:calc(100% - 78px) !important;
  }

  #${ROOT_ID} .rv5-live{
    font-size:7px !important;
  }

  #${ROOT_ID} .rv5-kicker{
    font-size:6px !important;
  }

  #${ROOT_ID} h1{
    font-size:19px !important;
  }

  #${ROOT_ID} .rv5-meta{
    font-size:6px !important;
  }

  /* counter stays readable */

  #${ROOT_ID} .rv5-timer{
    width:72px !important;
    height:72px !important;
    min-width:72px !important;
    min-height:72px !important;
    flex-basis:72px !important;
  }

  #${ROOT_ID} .rv5-timer strong{
    font-size:32px !important;
  }

  #${ROOT_ID} .rv5-timer small{
    font-size:6px !important;
    margin-top:6px !important;
  }

  #${ROOT_ID} .rv5-timer::before{
    font-size:5px !important;
    top:7px !important;
  }

  #${ROOT_ID} .rv5-main{
    grid-template-rows:35px minmax(0,1fr) 41px !important;
  }

  #${ROOT_ID} .rv5-mapbar span{
    font-size:6px !important;
    padding:5px 6px !important;
  }

  #${ROOT_ID} .rv5-mapbar b{
    display:none !important;
  }

  #${ROOT_ID} .rv5-map-label.bottom{
    display:none !important;
  }

  #${ROOT_ID} .rv5-live-tag{
    font-size:6px !important;
  }

  #${ROOT_ID} .rv5-stats small{
    font-size:5px !important;
  }

  #${ROOT_ID} .rv5-stats strong{
    font-size:8px !important;
  }

  #${ROOT_ID} .rv5-footer{
    min-height:56px !important;
    padding:7px 8px !important;
  }

  #${ROOT_ID} .rv5-objective-icon{
    display:none !important;
  }

  #${ROOT_ID} .objective-text{
    max-width:82vw !important;
    font-size:9px !important;
  }

  #${ROOT_ID} .label{
    font-size:9px !important;
  }

  #${ROOT_ID} .guide{
    font-size:7px !important;
  }
}

/* ============================================================
   TOUCH / PORTRAIT SAFETY
   ============================================================ */

@media(orientation:portrait){

  body.is-touch
  #play
  .rotate-prompt:not(.hidden){
    display:flex !important;

    visibility:visible !important;

    opacity:1 !important;
  }


  body.is-touch
  #play
  .hud,

  body.is-touch
  #play
  .input-guide,

  body.is-touch
  #play
  .mobile-controls,

  body.is-touch
  #play
  #phaser-game{
    visibility:hidden !important;
  }
}


@media(orientation:landscape){

  body.is-touch
  #play
  .rotate-prompt{
    display:none !important;

    visibility:hidden !important;

    opacity:0 !important;

    pointer-events:none !important;
  }


  body.is-touch
  #play
  .hud,

  body.is-touch
  #play
  .input-guide,

  body.is-touch
  #play
  .mobile-controls,

  body.is-touch
  #play
  #phaser-game{
    visibility:visible !important;
  }
}


@media(orientation:landscape) and (max-height:700px){

  body.is-touch
  #play
  .hud{
    padding-top:
      max(
        6px,
        env(
          safe-area-inset-top,
          0px
        )
      ) !important;
  }
}

`;

  document.head.appendChild(style);

  /*
   * ============================================================
   * MAP MODEL
   * ============================================================
   */

  
    
function mapModel(scene) {

  const m = scene?.mission || {};

  const bounds =
    scene?.physics?.world?.bounds;

  const width =
    num(
      bounds?.width,
      num(m?.goal?.x, 6100) + 500
    );

  const height =
    num(
      bounds?.height,
      720
    );

  /*
   * ------------------------------------------------------------
   * HORIZONTAL SCALE
   * ------------------------------------------------------------
   */

  const sx =
    920 / Math.max(width, 1);

  const X = x =>
    40 +
    clamp(
      num(x) * sx,
      0,
      920
    );


  /*
   * ------------------------------------------------------------
   * FIND REAL LEVEL CONTENT VERTICAL RANGE
   *
   * Stari kod je koristio:
   *
   *   Y = 50 + y * sy
   *
   * zbog čega je sadržaj na mobilnom završavao prenisko.
   *
   * Sada prvo pronađemo gdje se stvarni level nalazi,
   * pa ga centriramo i povećamo u dostupnom prostoru.
   * ------------------------------------------------------------
   */

  const ys = [];

  const addPointY = item => {

    if (Array.isArray(item)) {

      if (Number.isFinite(Number(item[1]))) {
        ys.push(Number(item[1]));
      }

      return;
    }

    if (
      item &&
      Number.isFinite(Number(item.y))
    ) {
      ys.push(Number(item.y));
    }
  };


  const addRectY = item => {

    if (Array.isArray(item)) {

      const y =
        Number(item[1]);

      const h =
        Number(item[3]);

      if (Number.isFinite(y)) {
        ys.push(y);

        if (Number.isFinite(h)) {
          ys.push(y + h);
        }
      }

      return;
    }

    if (
      item &&
      Number.isFinite(Number(item.y))
    ) {

      const y =
        Number(item.y);

      const h =
        Number(
          item.height ??
          item.h ??
          0
        );

      ys.push(y);

      if (Number.isFinite(h)) {
        ys.push(y + h);
      }
    }
  };


  /*
   * Main mission points
   */

  addPointY(
    m?.spawn || {
      x:120,
      y:520
    }
  );

  addPointY(
    m?.goal || {
      x:6100,
      y:500
    }
  );


  /*
   * Real level objects
   */

  const pointArrays = [
    'enemies',
    'signals',
    'secrets',
    'checkpoints',
    'boostPads',
    'guides'
  ];

  pointArrays.forEach(key => {

    const list =
      Array.isArray(m?.[key])
        ? m[key]
        : [];

    list.forEach(addPointY);

  });


  const rectArrays = [
    'platforms',
    'obstacles',
    'movingGates'
  ];

  rectArrays.forEach(key => {

    const list =
      Array.isArray(m?.[key])
        ? m[key]
        : [];

    list.forEach(addRectY);

  });


  /*
   * Fallback ako level nema dovoljno podataka.
   */

  if (ys.length < 2) {

    ys.push(0);
    ys.push(height);

  }


  let minY =
    Math.min(...ys);

  let maxY =
    Math.max(...ys);


  /*
   * Ako je range premalen, dodajemo malo prostora
   * da mapa ne bude spljoštena.
   */

  if (
    !Number.isFinite(minY) ||
    !Number.isFinite(maxY)
  ) {

    minY = 0;
    maxY = height;

  }


  const contentRange =
    Math.max(
      1,
      maxY - minY
    );


  /*
   * ------------------------------------------------------------
   * MOBILE-FRIENDLY VERTICAL FIT
   * ------------------------------------------------------------
   *
   * Level dobija više vertikalnog prostora.
   *
   * 110 = gornji padding
   * 450 = donji padding
   *
   * Dakle stvarni level koristi približno 340px
   * od ukupnih 560px SVG prostora.
   */

 const targetTop = 70;
const targetBottom = 490;

  const targetHeight =
    targetBottom - targetTop;


  const sy =
    targetHeight /
    contentRange;


  const Y = y => {

    const value =
      num(y, minY);

    return targetTop +
      clamp(
        (value - minY) * sy,
        0,
        targetHeight
      );

  };


  /*
   * ------------------------------------------------------------
   * HELPERS
   * ------------------------------------------------------------
   */

  const point = item => {

    if (Array.isArray(item)) {

      return {
        x: X(item[0]),
        y: Y(item[1])
      };

    }

    return {
      x: X(item?.x),
      y: Y(item?.y)
    };

  };


  const rect = item => {

    if (Array.isArray(item)) {

      return {
        x: X(item[0]),
        y: Y(item[1]),
        w: Math.max(
          4,
          num(item[2], 40) * sx
        ),
        h: Math.max(
          3,
          num(item[3], 20) * sy
        )
      };

    }

    return {
      x: X(item?.x),
      y: Y(item?.y),
      w: Math.max(
        4,
        num(
          item?.width ?? item?.w,
          40
        ) * sx
      ),
      h: Math.max(
        3,
        num(
          item?.height ?? item?.h,
          20
        ) * sy
      )
    };

  };


  const arr = key =>
    Array.isArray(m?.[key])
      ? m[key]
      : [];


  /*
   * ------------------------------------------------------------
   * RETURN REAL LEVEL DATA
   * ------------------------------------------------------------
   */

  return {

    X,
    Y,
    point,
    rect,

    points: {

      start:
        point(
          m?.spawn || {
            x:120,
            y:520
          }
        ),

      goal:
        point(
          m?.goal || {
            x:6100,
            y:500
          }
        ),

      player:
        point(
          scene?.player ||
          m?.spawn || {
            x:120,
            y:520
          }
        )

    },

    platforms:
      arr('platforms'),

    obstacles:
      arr('obstacles'),

    movingGates:
      arr('movingGates'),

    enemies:
      arr('enemies'),

    signals:
      arr('signals'),

    secrets:
      arr('secrets'),

    checkpoints:
      arr('checkpoints'),

    boostPads:
      arr('boostPads'),

    guides:
      arr('guides')

  };

}
  /*
   * ============================================================
   * GRID
   * ============================================================
   */

  function grid() {

    let out = '';

    for (let x=40;x<=960;x+=40) {

      out += `
        <line
          x1="${x}"
          y1="0"
          x2="${x}"
          y2="560"
          class="${x % 120 === 0 ? 'grid-major' : 'grid'}">
        </line>
      `;
    }

    for (let y=40;y<=520;y+=40) {

      out += `
        <line
          x1="0"
          y1="${y}"
          x2="1000"
          y2="${y}"
          class="${y % 120 === 0 ? 'grid-major' : 'grid'}">
        </line>
      `;
    }

    return out;
  }

  /*
   * ============================================================
   * RENDER REAL MAP
   * ============================================================
   */

 function renderMap(scene) {

  const svg =
    root.querySelector('.rv5-svg');

  if (!svg || !scene) return;

  const d = mapModel(scene);


  /*
   * ============================================================
   * ROUTE
   * ============================================================
   */

  const routePoints = [
    d.points.start,
    ...d.checkpoints.map(d.point),
    d.points.goal
  ];

  const route =
    routePoints
      .map(
        (p, i) =>
          `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      )
      .join(' ');


  /*
   * ============================================================
   * TACTICAL BUILDINGS
   * ============================================================
   */

  const platforms =
    d.platforms
      .map(item => {

        const r = d.rect(item);

        return `
          <g class="tactical-building">

            <rect
              x="${r.x}"
              y="${r.y}"
              width="${r.w}"
              height="${r.h}"
              rx="2"
              class="platform">
            </rect>

            <rect
              x="${r.x + 3}"
              y="${r.y + 3}"
              width="${Math.max(3, r.w - 6)}"
              height="${Math.max(3, r.h - 6)}"
              class="building-inner">
            </rect>

            <line
              x1="${r.x}"
              y1="${r.y}"
              x2="${r.x+r.w}"
              y2="${r.y}"
              class="edge">
            </line>

            <line
              x1="${r.x}"
              y1="${r.y+r.h}"
              x2="${r.x+r.w}"
              y2="${r.y+r.h}"
              class="building-edge-bottom">
            </line>

          </g>
        `;

      })
      .join('');


  /*
   * ============================================================
   * HOSTILE OBJECTS
   * ============================================================
   */

  const obstacles =
    d.obstacles
      .map(item => {

        const p = d.point(item);

        return `
          <g class="hostile-marker">

            <circle
              cx="${p.x}"
              cy="${p.y}"
              r="14"
              class="hostile-pulse">
            </circle>

            <path
              d="
                M ${p.x-10} ${p.y+9}
                L ${p.x} ${p.y-10}
                L ${p.x+10} ${p.y+9}
                Z
              "
              class="danger-object">
            </path>

            <line
              x1="${p.x-5}"
              y1="${p.y}"
              x2="${p.x+5}"
              y2="${p.y}"
              class="hostile-cross">
            </line>

            <line
              x1="${p.x}"
              y1="${p.y-5}"
              x2="${p.x}"
              y2="${p.y+5}"
              class="hostile-cross">
            </line>

          </g>
        `;

      })
      .join('');


  /*
   * ============================================================
   * MOVING GATES
   * ============================================================
   */

  const gates =
    d.movingGates
      .map(item => {

        const r = d.rect(item);

        return `
          <g class="tactical-gate">

            <rect
              x="${r.x}"
              y="${r.y}"
              width="${r.w}"
              height="${r.h}"
              rx="2"
              class="danger-object">
            </rect>

            <line
              x1="${r.x}"
              y1="${r.y}"
              x2="${r.x+r.w}"
              y2="${r.y+r.h}"
              class="gate-line">
            </line>

            <line
              x1="${r.x+r.w}"
              y1="${r.y}"
              x2="${r.x}"
              y2="${r.y+r.h}"
              class="gate-line">
            </line>

          </g>
        `;

      })
      .join('');


  /*
   * ============================================================
   * CHECKPOINTS
   * ============================================================
   */

  const checkpoints =
    d.checkpoints
      .map((item, i) => {

        const p = d.point(item);

        return `
          <g class="checkpoint-group">

            <circle
              cx="${p.x}"
              cy="${p.y}"
              r="20"
              class="checkpoint-zone">
            </circle>

            <circle
              cx="${p.x}"
              cy="${p.y}"
              r="13"
              class="checkpoint">
            </circle>

            <circle
              cx="${p.x}"
              cy="${p.y}"
              r="4"
              class="checkpoint-dot">
            </circle>

            <line
              x1="${p.x-17}"
              y1="${p.y}"
              x2="${p.x-8}"
              y2="${p.y}"
              class="checkpoint-line">
            </line>

            <line
              x1="${p.x+8}"
              y1="${p.y}"
              x2="${p.x+17}"
              y2="${p.y}"
              class="checkpoint-line">
            </line>

            <text
              x="${p.x}"
              y="${p.y-25}"
              text-anchor="middle"
              class="label checkpoint-label">
              CP ${i+1}
            </text>

          </g>
        `;

      })
      .join('');


  /*
   * ============================================================
   * SIGNALS
   * ============================================================
   */

  const signals =
    d.signals
      .map(item => {

        const p = d.point(item);

        return `
          <g class="signal-group">

            <circle
              cx="${p.x}"
              cy="${p.y}"
              r="10"
              class="signal-ring">
            </circle>

            <circle
              cx="${p.x}"
              cy="${p.y}"
              r="4"
              class="signal">
            </circle>

          </g>
        `;

      })
      .join('');


  /*
   * ============================================================
   * ENEMIES
   * ============================================================
   */

  const enemies =
    d.enemies
      .map(item => {

        const p = d.point(item);

        return `
          <g class="enemy-group">

            <circle
              cx="${p.x}"
              cy="${p.y}"
              r="17"
              class="enemy-radius">
            </circle>

            <circle
              cx="${p.x}"
              cy="${p.y}"
              r="8"
              class="danger-object">
            </circle>

            <line
              x1="${p.x-13}"
              y1="${p.y}"
              x2="${p.x-7}"
              y2="${p.y}"
              class="enemy-cross">
            </line>

            <line
              x1="${p.x+7}"
              y1="${p.y}"
              x2="${p.x+13}"
              y2="${p.y}"
              class="enemy-cross">
            </line>

            <line
              x1="${p.x}"
              y1="${p.y-13}"
              x2="${p.x}"
              y2="${p.y-7}"
              class="enemy-cross">
            </line>

            <line
              x1="${p.x}"
              y1="${p.y+7}"
              x2="${p.x}"
              y2="${p.y+13}"
              class="enemy-cross">
            </line>

            <text
              x="${p.x+18}"
              y="${p.y+4}"
              class="label hostile-label">
              HOSTILE
            </text>

          </g>
        `;

      })
      .join('');


  /*
   * ============================================================
   * GUIDES
   * ============================================================
   */

  const guides =
    d.guides
      .map(item => {

        const p = d.point(item);

        return `
          <g class="guide-group">

            <line
              x1="${p.x}"
              y1="${p.y-5}"
              x2="${p.x}"
              y2="${p.y-16}"
              class="guide-stem">
            </line>

            <text
              x="${p.x}"
              y="${p.y-21}"
              text-anchor="middle"
              class="guide">
              ${esc(item?.text || '')}
            </text>

          </g>
        `;

      })
      .join('');


  /*
   * ============================================================
   * SVG
   * ============================================================
   */

  svg.innerHTML = `

    <defs>

      <linearGradient
        id="rv5mapGradient"
        x1="0"
        y1="0"
        x2="1"
        y2="1">

        <stop
          offset="0%"
          stop-color="#0c1512">
        </stop>

        <stop
          offset="45%"
          stop-color="#07100d">
        </stop>

        <stop
          offset="100%"
          stop-color="#020706">
        </stop>

      </linearGradient>


      <radialGradient
        id="rv5terrainGlow"
        cx="50%"
        cy="48%"
        r="60%">

        <stop
          offset="0%"
          stop-color="#26352c"
          stop-opacity=".24">
        </stop>

        <stop
          offset="100%"
          stop-color="#020706"
          stop-opacity="0">
        </stop>

      </radialGradient>


      <filter
        id="rv5SoftGlow"
        x="-100%"
        y="-100%"
        width="300%"
        height="300%">

        <feGaussianBlur
          stdDeviation="3">
        </feGaussianBlur>

      </filter>


      <filter
        id="rv5StrongGlow"
        x="-100%"
        y="-100%"
        width="300%"
        height="300%">

        <feGaussianBlur
          stdDeviation="5">
        </feGaussianBlur>

      </filter>

    </defs>


    <!-- TACTICAL TERRAIN -->

    <rect
      width="1000"
      height="560"
      fill="url(#rv5mapGradient)">
    </rect>

    <rect
      width="1000"
      height="560"
      fill="url(#rv5terrainGlow)">
    </rect>


    <!-- GRID -->

    ${grid()}


    <!-- ROUTE UNDERGLOW -->

    <path
      d="${route}"
      class="route-halo">
    </path>


    <!-- MAIN ROUTE -->

    <path
      d="${route}"
      class="route">
    </path>


    <!-- ROUTE CORE -->

    <path
      d="${route}"
      class="route-core">
    </path>


    <!-- LEVEL OBJECTS -->

    ${platforms}

    ${gates}

    ${obstacles}

    ${signals}

    ${checkpoints}

    ${enemies}

    ${guides}


    <!-- START -->

    <g class="start-group">

      <circle
        cx="${d.points.start.x}"
        cy="${d.points.start.y}"
        r="23"
        class="start-radius">
      </circle>

      <circle
        cx="${d.points.start.x}"
        cy="${d.points.start.y}"
        r="15"
        class="start-ring">
      </circle>

      <circle
        cx="${d.points.start.x}"
        cy="${d.points.start.y}"
        r="8"
        class="start">
      </circle>

      <text
        x="${d.points.start.x+18}"
        y="${d.points.start.y+4}"
        class="label start-label">
        START
      </text>

    </g>


    <!-- GOAL -->

    <g class="goal-group">

      <circle
        cx="${d.points.goal.x}"
        cy="${d.points.goal.y}"
        r="28"
        class="goal-radius">
      </circle>

      <circle
        cx="${d.points.goal.x}"
        cy="${d.points.goal.y}"
        r="20"
        class="goal-ring">
      </circle>

      <circle
        cx="${d.points.goal.x}"
        cy="${d.points.goal.y}"
        r="10"
        class="goal">
      </circle>

      <text
        x="${d.points.goal.x+22}"
        y="${d.points.goal.y+4}"
        class="label goal-label">
        OBJECTIVE
      </text>

    </g>


    <!-- PLAYER -->

    <g id="rv5-player">

      <circle
        cx="${d.points.player.x}"
        cy="${d.points.player.y}"
        r="23"
        class="player-radius">
      </circle>

      <circle
        cx="${d.points.player.x}"
        cy="${d.points.player.y}"
        r="16"
        class="player-ring">
      </circle>

      <circle
        cx="${d.points.player.x}"
        cy="${d.points.player.y}"
        r="7"
        class="player">
      </circle>

      <line
        x1="${d.points.player.x-23}"
        y1="${d.points.player.y}"
        x2="${d.points.player.x-12}"
        y2="${d.points.player.y}"
        class="player-cross">
      </line>

      <line
        x1="${d.points.player.x+12}"
        y1="${d.points.player.y}"
        x2="${d.points.player.x+23}"
        y2="${d.points.player.y}"
        class="player-cross">
      </line>

      <line
        x1="${d.points.player.x}"
        y1="${d.points.player.y-23}"
        x2="${d.points.player.x}"
        y2="${d.points.player.y-12}"
        class="player-cross">
      </line>

      <line
        x1="${d.points.player.x}"
        y1="${d.points.player.y+12}"
        x2="${d.points.player.x}"
        y2="${d.points.player.y+23}"
        class="player-cross">
      </line>

      <text
        x="${d.points.player.x+16}"
        y="${d.points.player.y-15}"
        class="label player-label">
        YOU
      </text>

    </g>

  `;
}

  /*
   * ============================================================
   * PLAYER UPDATE
   * ============================================================
   */

  function updatePlayer() {

    if (!active) return;

    const scene = runner();

    const svg =
      root.querySelector('.rv5-svg');

    const player =
      svg?.querySelector('#rv5-player');

    if (!scene || !player) return;

    const d = mapModel(scene);

    const circle =
      player.querySelector('.player');

    const ring =
      player.querySelector('.player-ring');

    const label =
      player.querySelector('text');

    circle?.setAttribute(
      'cx',
      d.points.player.x
    );

    circle?.setAttribute(
      'cy',
      d.points.player.y
    );

    ring?.setAttribute(
      'cx',
      d.points.player.x
    );

    ring?.setAttribute(
      'cy',
      d.points.player.y
    );

    label?.setAttribute(
      'x',
      d.points.player.x + 13
    );

    label?.setAttribute(
      'y',
      d.points.player.y - 12
    );
  }

  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  let active = false;
  let timerId = 0;
  let finishId = 0;
  let playerId = 0;

  function lockGame(state) {

    window.__relayCinematicLock = state;

    document
      .getElementById('play')
      ?.classList
      .toggle(
        'relay-map-briefing-lock',
        state
      );

    window.dispatchEvent(
      new Event(
        state
          ? 'relay:cinematic-lock'
          : 'relay:cinematic-unlock'
      )
    );
  }

  /*
   * ============================================================
   * TIMER
   * ============================================================
   */

  function updateTimer(ms) {

    const seconds =
      Math.max(
        0,
        Math.ceil(ms / 1000)
      );

    const number =
      root.querySelector(
        '.rv5-timer strong'
      );

    const progress =
      root.querySelector(
        '.timer-progress'
      );

    if (number) {
      number.textContent =
        String(seconds);
    }

    if (progress) {

      const circumference = 270.18;

      const ratio =
        clamp(
          ms / 10000,
          0,
          1
        );

      progress.style.strokeDashoffset =
        String(
          circumference *
          (1-ratio)
        );
    }
  }

  /*
   * ============================================================
   * FINISH
   * ============================================================
   */

  function finish() {

    clearInterval(timerId);
    clearTimeout(finishId);
    clearInterval(playerId);

    timerId = 0;
    finishId = 0;
    playerId = 0;

    active = false;

    root.classList.remove('opening');

    lockGame(false);

    root.hidden = true;
  }

  /*
   * ============================================================
   * SHOW
   * ============================================================
   */

  async function show() {

    if (active) return;

    active = true;

    lockGame(true);

    root.hidden = false;

    root.classList.remove('opening');

    void root.offsetWidth;

    root.classList.add('opening');

    const startedWait =
      performance.now();

    let data = getMission();

    while (
      !data.scene &&
      performance.now() - startedWait < 4500
    ) {

      await WAIT(80);

      data = getMission();
    }

    data = getMission();

    root.querySelector('.rv5-meta')
      .textContent =
      `${data.district} // ${data.title}`;

    root.querySelector('.objective-text')
      .textContent =
      data.objective;

    renderMap(data.scene);

    const started =
      performance.now();

    updateTimer(10000);

    timerId =
      setInterval(
        () => {

          updateTimer(
            10000 -
            (
              performance.now() -
              started
            )
          );

        },
        100
      );

    playerId =
      setInterval(
        updatePlayer,
        100
      );

    finishId =
      setTimeout(
        finish,
        10000
      );
  }

  /*
   * ============================================================
   * ESC
   * ============================================================
   */

  document.addEventListener(
    'keydown',
    event => {

      if (
        event.key === 'Escape' &&
        active
      ) {
        finish();
      }

    },
    true
  );

  /*
   * ============================================================
   * PLAY
   * ============================================================
   */

  document.addEventListener(
    'click',
    event => {

      const button =
        event.target.closest(
          PLAY_BUTTONS
        );

      if (!button || active) return;

      /*
       * VAŽNO:
       * originalni Play handler ide prvi.
       * Tek nakon toga čekamo Phaser runner.
       */

      setTimeout(
        show,
        180
      );

    },
    true
  );

  /*
   * ============================================================
   * HUD LOCK
   * ============================================================
   */

  const lockStyle =
    document.createElement('style');

  lockStyle.textContent = `

    #play.relay-map-briefing-lock .hud,
    #play.relay-map-briefing-lock .world-marker,
    #play.relay-map-briefing-lock .input-guide,
    #play.relay-map-briefing-lock .mobile-controls,
    #play.relay-map-briefing-lock .rotate-prompt,
    #play.relay-map-briefing-lock #toast,
    #play.relay-map-briefing-lock #pause {

      visibility:hidden !important;
      opacity:0 !important;
      pointer-events:none !important;

    }

  `;

  document.head.appendChild(lockStyle);

  /*
   * ============================================================
   * PUBLIC API
   * ============================================================
   */

  window.relayGameplayIntroV5 = {

    show,

    close:finish,

    refresh() {

      if (!active) return;

      const data = getMission();

      if (data.scene) {
        renderMap(data.scene);
      }
    },

    getRoot() {
      return root;
    },

    isVisible() {
      return active;
    }

  };

})();
