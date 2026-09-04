(() => {
  'use strict';

  if (window.__relayGameplayIntroFinalV3) return;
  window.__relayGameplayIntroFinalV3 = true;

  /* ============================================================
   * RELAY RUNNER
   * MISSION ROUTE BRIEFING — AAA TACTICAL V4
   *
   * IMPORTANT:
   * - Uses the REAL Phaser runner scene.
   * - Uses the REAL mission data.
   * - Does NOT create another gameplay map.
   * - Presentation layer only.
   * - Responsive desktop / tablet / mobile.
   * ============================================================ */

  const BUTTONS = '#start,#nextMission,#again,#retry,#launchJob';
  const ROOT_ID = 'relayGameplayIntroFinalV3';

  const wait = ms =>
    new Promise(resolve => window.setTimeout(resolve, ms));

  const runner = () =>
    window.__relayRunnerScene ||
    window.game?.scene?.getScene?.('runner') ||
    null;

  const num = (value, fallback = 0) =>
    Number.isFinite(Number(value))
      ? Number(value)
      : fallback;

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  const esc = value =>
    String(value ?? '').replace(
      /[&<>"]/g,
      char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[char])
    );


  /* ============================================================
   * MISSION
   * ============================================================ */

  const mission = () => {

    const scene = runner();

    const m = scene?.mission || {};

    const id =
      m.id ||
      scene?.sys?.settings?.data?.missionId ||
      document.getElementById('missionId')?.value ||
      null;

    const title =
      m.title ||
      document.getElementById('objective')?.textContent ||
      'CURRENT MISSION';

    const district =
      m.district ||
      document.getElementById('district')?.textContent ||
      'CURRENT DISTRICT';

    const objective =
      m.objective ||
      document.getElementById('worldGoal')?.textContent ||
      'FOLLOW THE RELAY';

    return {
      scene,
      id,
      title: String(title).trim(),
      district: String(district).trim(),
      objective: String(objective).trim()
    };
  };


  /* ============================================================
   * ROOT
   * ============================================================ */

  const root = document.createElement('section');

  root.id = ROOT_ID;
  root.hidden = true;

  root.innerHTML = `
    <div
      class="relay-v4-backdrop"
      aria-hidden="true">
    </div>

    <div
      class="relay-v4-shell"
      role="dialog"
      aria-modal="true"
      aria-label="Mission route map briefing">

      <div class="relay-v4-topline">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>


      <!-- ======================================================
           HEADER
           ====================================================== -->

      <header class="relay-v4-header">

        <div class="relay-v4-header-left">

          <div class="relay-v4-status-line">

            <span class="relay-v4-live-dot"></span>

            <span>RELAY NETWORK</span>

            <i></i>

            <span>TACTICAL NAVIGATION</span>

          </div>

          <div class="relay-v4-title-row">

            <div>

              <p class="relay-v4-kicker">
                LIVE MISSION // ROUTE INTELLIGENCE
              </p>

              <h1 class="relay-v4-title">
                MISSION ROUTE
              </h1>

              <p class="relay-v4-meta"></p>

            </div>

          </div>

        </div>


        <div class="relay-v4-header-right">

          <div class="relay-v4-readout">

            <span class="relay-v4-readout-label">
              ROUTE STATUS
            </span>

            <b>LOCKED</b>

          </div>

          <div class="relay-v4-timer">

            <div class="relay-v4-timer-ring">

              <svg viewBox="0 0 48 48" aria-hidden="true">

                <circle
                  class="relay-v4-timer-track"
                  cx="24"
                  cy="24"
                  r="20">
                </circle>

                <circle
                  class="relay-v4-timer-progress"
                  cx="24"
                  cy="24"
                  r="20">
                </circle>

              </svg>

              <strong>10</strong>

            </div>

            <span>SEC</span>

          </div>

        </div>

      </header>


      <!-- ======================================================
           MAP
           ====================================================== -->

      <main class="relay-v4-map-frame">

        <div class="relay-v4-map-toolbar">

          <div class="relay-v4-toolbar-left">

            <span class="relay-v4-chip active">
              LIVE
            </span>

            <span class="relay-v4-chip">
              GRID 04
            </span>

            <span class="relay-v4-chip">
              NIGHT OPS
            </span>

          </div>

          <div class="relay-v4-coordinates">
            ROUTE // ACTIVE
          </div>

        </div>


        <div class="relay-v4-map-wrap">

          <svg
            class="map-briefing-map"
            viewBox="0 0 1000 560"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Actual level route map">
          </svg>


          <div class="relay-v4-map-noise"></div>

          <div class="relay-v4-map-scan"></div>

          <div class="relay-v4-map-vignette"></div>

          <div class="relay-v4-map-corners">

            <div class="corner tl"></div>
            <div class="corner tr"></div>
            <div class="corner bl"></div>
            <div class="corner br"></div>

          </div>


          <div class="relay-v4-map-label relay-v4-map-label-top">
            <span>TACTICAL GRID</span>
            <b>RLY // 04 // SPINE</b>
          </div>


          <div class="relay-v4-map-label relay-v4-map-label-bottom">
            <span>LIVE ROUTE</span>
            <b>MISSION PATH</b>
          </div>


          <div class="relay-v4-map-crosshair"></div>


          <div class="relay-v4-map-tag">

            <span class="relay-v4-tag-dot"></span>

            REAL LEVEL ROUTE

          </div>

        </div>


        <div class="relay-v4-map-footer">

          <div>
            <span>MAP SOURCE</span>
            <b>LIVE PHASER WORLD</b>
          </div>

          <div>
            <span>ROUTE</span>
            <b>CALCULATED</b>
          </div>

          <div>
            <span>THREAT</span>
            <b class="danger">ACTIVE</b>
          </div>

        </div>

      </main>


      <!-- ======================================================
           FOOTER
           ====================================================== -->

      <footer class="relay-v4-footer">

        <div class="relay-v4-objective">

          <span class="relay-v4-objective-label">
            PRIMARY OBJECTIVE
          </span>

          <strong class="relay-v4-objective-text">
          </strong>

        </div>


        <div class="relay-v4-footer-status">

          <span class="relay-v4-status-icon"></span>

          <span>
            DEPLOYMENT READY
          </span>

        </div>

      </footer>

    </div>
  `;

  document.body.appendChild(root);


  /* ============================================================
   * STYLE
   * ============================================================ */

  const style = document.createElement('style');

  style.id = 'relay-gameplay-intro-final-v4-style';

  style.textContent = `

  /* ============================================================
   * ROOT
   * ============================================================ */

  #relayGameplayIntroFinalV3 {

    --v4-bg:
      #02060a;

    --v4-panel:
      rgba(5,12,19,.97);

    --v4-panel-2:
      rgba(7,17,26,.94);

    --v4-cyan:
      #8df4ff;

    --v4-cyan-soft:
      rgba(141,244,255,.12);

    --v4-yellow:
      #ffd06e;

    --v4-yellow-soft:
      rgba(255,208,110,.12);

    --v4-red:
      #ff6e79;

    --v4-green:
      #a9ed83;

    --v4-white:
      #edf8fb;

    --v4-muted:
      #6c8495;

    --v4-line:
      rgba(141,244,255,.12);

    position: fixed !important;

    inset: 0 !important;

    z-index: 2147483647 !important;

    display: grid !important;

    place-items: center !important;

    padding:
      clamp(8px,2vw,28px) !important;

    box-sizing: border-box;

    overflow: hidden;

    background:
      radial-gradient(
        circle at 50% 50%,
        rgba(20,80,100,.12),
        transparent 48%
      ),
      #02060a;

    color:
      var(--v4-white);

    font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      monospace;

    isolation: isolate;

  }


  #relayGameplayIntroFinalV3[hidden] {

    display: none !important;

  }


  /* ============================================================
   * BACKDROP
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-backdrop {

    position: absolute;

    inset: 0;

    pointer-events: none;

    background:

      radial-gradient(
        circle at 50% 45%,
        rgba(141,244,255,.045),
        transparent 35%
      ),

      linear-gradient(
        180deg,
        rgba(0,0,0,.25),
        rgba(0,0,0,.72)
      );

  }


  #relayGameplayIntroFinalV3 .relay-v4-backdrop::before {

    content: "";

    position: absolute;

    inset: 0;

    opacity: .2;

    background-image:

      linear-gradient(
        rgba(141,244,255,.025) 1px,
        transparent 1px
      ),

      linear-gradient(
        90deg,
        rgba(141,244,255,.025) 1px,
        transparent 1px
      );

    background-size:
      44px 44px;

  }


  /* ============================================================
   * SHELL
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-shell {

    position: relative;

    width:
      min(1240px,96vw);

    height:
      min(850px,94dvh);

    min-height:
      min(560px,94dvh);

    display: grid;

    grid-template-rows:
      auto
      1fr
      auto;

    gap: 0;

    overflow: hidden;

    border:
      1px solid
      rgba(141,244,255,.18);

    background:
      linear-gradient(
        145deg,
        rgba(6,17,26,.98),
        rgba(2,7,12,.99)
      );

    box-shadow:

      0 45px 140px rgba(0,0,0,.78),

      0 0 90px
      rgba(141,244,255,.045),

      inset 0 1px
      rgba(255,255,255,.045);

    clip-path:
      polygon(
        0 0,
        calc(100% - 16px) 0,
        100% 16px,
        100% 100%,
        16px 100%,
        0 calc(100% - 16px)
      );

  }


  /* ============================================================
   * TOP LINE
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-topline {

    position: absolute;

    left: 0;

    right: 0;

    top: 0;

    height: 2px;

    display: flex;

    z-index: 20;

    pointer-events: none;

  }


  #relayGameplayIntroFinalV3 .relay-v4-topline span {

    flex: 1;

    border-right:
      1px solid
      rgba(141,244,255,.16);

  }


  #relayGameplayIntroFinalV3 .relay-v4-topline span:nth-child(1),
  #relayGameplayIntroFinalV3 .relay-v4-topline span:nth-child(5) {

    background:
      var(--v4-yellow);

  }


  #relayGameplayIntroFinalV3 .relay-v4-topline span:nth-child(2),
  #relayGameplayIntroFinalV3 .relay-v4-topline span:nth-child(4) {

    background:
      rgba(141,244,255,.5);

  }


  /* ============================================================
   * HEADER
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-header {

    position: relative;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 24px;

    padding:
      20px 24px;

    border-bottom:
      1px solid
      var(--v4-line);

    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,.025),
        transparent
      );

  }


  #relayGameplayIntroFinalV3 .relay-v4-status-line {

    display: flex;

    align-items: center;

    gap: 8px;

    margin-bottom: 8px;

    color:
      var(--v4-muted);

    font-size: 7px;

    font-weight: 900;

    letter-spacing:
      .18em;

    text-transform:
      uppercase;

  }


  #relayGameplayIntroFinalV3 .relay-v4-status-line i {

    width: 24px;

    height: 1px;

    background:
      rgba(141,244,255,.22);

  }


  #relayGameplayIntroFinalV3 .relay-v4-live-dot {

    width: 6px;

    height: 6px;

    border-radius: 50%;

    background:
      var(--v4-cyan);

    box-shadow:
      0 0 12px
      var(--v4-cyan);

    animation:
      relayV4LivePulse
      1.4s
      ease-in-out
      infinite;

  }


  @keyframes relayV4LivePulse {

    0%,100% {
      opacity: .45;
      transform: scale(.8);
    }

    50% {
      opacity: 1;
      transform: scale(1.15);
    }

  }


  #relayGameplayIntroFinalV3 .relay-v4-kicker {

    margin:
      0 0 5px;

    color:
      var(--v4-yellow);

    font-size: 7px;

    font-weight: 900;

    letter-spacing:
      .2em;

  }


  #relayGameplayIntroFinalV3 .relay-v4-title {

    margin: 0;

    color:
      #f5fbfd;

    font-size:
      clamp(25px,3.3vw,43px);

    line-height:
      .92;

    font-weight:
      950;

    letter-spacing:
      .06em;

  }


  #relayGameplayIntroFinalV3 .relay-v4-meta {

    margin:
      8px 0 0;

    color:
      #6d8697;

    font-size: 8px;

    font-weight: 800;

    letter-spacing:
      .12em;

    text-transform:
      uppercase;

  }


  /* ============================================================
   * HEADER RIGHT
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-header-right {

    display: flex;

    align-items: center;

    gap: 14px;

  }


  #relayGameplayIntroFinalV3 .relay-v4-readout {

    min-width: 100px;

    padding:
      10px 12px;

    border:
      1px solid
      rgba(141,244,255,.09);

    background:
      rgba(141,244,255,.025);

  }


  #relayGameplayIntroFinalV3 .relay-v4-readout-label {

    display: block;

    margin-bottom: 5px;

    color:
      #617888;

    font-size: 6px;

    font-weight: 900;

    letter-spacing:
      .16em;

  }


  #relayGameplayIntroFinalV3 .relay-v4-readout b {

    color:
      var(--v4-green);

    font-size: 9px;

    letter-spacing:
      .14em;

  }


  /* ============================================================
   * TIMER
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-timer {

    position: relative;

    width: 72px;

    height: 72px;

    display: grid;

    place-items: center;

  }


  #relayGameplayIntroFinalV3 .relay-v4-timer-ring {

    position: absolute;

    inset: 0;

  }


  #relayGameplayIntroFinalV3 .relay-v4-timer-ring svg {

    width: 100%;

    height: 100%;

    transform:
      rotate(-90deg);

  }


  #relayGameplayIntroFinalV3 .relay-v4-timer-track {

    fill: none;

    stroke:
      rgba(255,208,110,.08);

    stroke-width:
      2;

  }


  #relayGameplayIntroFinalV3 .relay-v4-timer-progress {

    fill: none;

    stroke:
      var(--v4-yellow);

    stroke-width:
      2.5;

    stroke-linecap:
      round;

    stroke-dasharray:
      125.66;

    stroke-dashoffset:
      0;

    filter:
      drop-shadow(
        0 0 4px
        rgba(255,208,110,.55)
      );

  }


  #relayGameplayIntroFinalV3 .relay-v4-timer strong {

    position: relative;

    z-index: 2;

    color:
      var(--v4-yellow);

    font-size:
      25px;

    line-height: 1;

  }


  #relayGameplayIntroFinalV3 .relay-v4-timer > span {

    position: absolute;

    bottom: 5px;

    color:
      #687d8b;

    font-size: 5px;

    font-weight: 900;

    letter-spacing:
      .16em;

  }


  /* ============================================================
   * MAP FRAME
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-frame {

    min-height: 0;

    display: grid;

    grid-template-rows:
      38px
      1fr
      38px;

    overflow: hidden;

  }


  /* ============================================================
   * TOOLBAR
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-toolbar {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 12px;

    padding:
      0 16px;

    border-bottom:
      1px solid
      rgba(141,244,255,.08);

    background:
      rgba(2,8,13,.7);

  }


  #relayGameplayIntroFinalV3 .relay-v4-toolbar-left {

    display: flex;

    align-items: center;

    gap: 6px;

    min-width: 0;

  }


  #relayGameplayIntroFinalV3 .relay-v4-chip {

    padding:
      5px 8px;

    border:
      1px solid
      rgba(141,244,255,.08);

    color:
      #607988;

    background:
      rgba(255,255,255,.015);

    font-size: 5px;

    font-weight: 900;

    letter-spacing:
      .14em;

    white-space:
      nowrap;

  }


  #relayGameplayIntroFinalV3 .relay-v4-chip.active {

    color:
      var(--v4-cyan);

    border-color:
      rgba(141,244,255,.25);

    background:
      rgba(141,244,255,.045);

  }


  #relayGameplayIntroFinalV3 .relay-v4-coordinates {

    color:
      #516977;

    font-size: 6px;

    font-weight: 900;

    letter-spacing:
      .14em;

  }


  /* ============================================================
   * MAP
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-wrap {

    position: relative;

    min-height: 0;

    overflow: hidden;

    background:
      #02070c;

    border-bottom:
      1px solid
      rgba(141,244,255,.08);

  }


  #relayGameplayIntroFinalV3 .map-briefing-map {

    position: absolute;

    inset: 0;

    width: 100%;

    height: 100%;

    display: block;

  }


  /* ============================================================
   * MAP FX
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-noise {

    position: absolute;

    inset: 0;

    pointer-events: none;

    opacity: .15;

    background-image:
      radial-gradient(
        rgba(255,255,255,.8) .5px,
        transparent .5px
      );

    background-size:
      5px 5px;

    mix-blend-mode:
      screen;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-scan {

    position: absolute;

    left: 0;

    right: 0;

    height: 70px;

    pointer-events: none;

    background:
      linear-gradient(
        180deg,
        transparent,
        rgba(141,244,255,.045),
        transparent
      );

    animation:
      relayV4Scan
      4.5s
      linear
      infinite;

  }


  @keyframes relayV4Scan {

    0% {
      transform:
        translateY(-90px);
      opacity: 0;
    }

    10% {
      opacity: .8;
    }

    90% {
      opacity: .55;
    }

    100% {
      transform:
        translateY(600px);
      opacity: 0;
    }

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-vignette {

    position: absolute;

    inset: 0;

    pointer-events: none;

    background:
      radial-gradient(
        ellipse at center,
        transparent 45%,
        rgba(0,0,0,.55) 100%
      );

  }


  /* ============================================================
   * CORNERS
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-corners {

    position: absolute;

    inset: 10px;

    pointer-events: none;

  }


  #relayGameplayIntroFinalV3 .corner {

    position: absolute;

    width: 30px;

    height: 30px;

    border-color:
      rgba(141,244,255,.22);

    border-style:
      solid;

  }


  #relayGameplayIntroFinalV3 .corner.tl {

    left: 0;
    top: 0;

    border-width:
      1px 0 0 1px;

  }


  #relayGameplayIntroFinalV3 .corner.tr {

    right: 0;
    top: 0;

    border-width:
      1px 1px 0 0;

  }


  #relayGameplayIntroFinalV3 .corner.bl {

    left: 0;
    bottom: 0;

    border-width:
      0 0 1px 1px;

  }


  #relayGameplayIntroFinalV3 .corner.br {

    right: 0;
    bottom: 0;

    border-width:
      0 1px 1px 0;

  }


  /* ============================================================
   * MAP LABELS
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-label {

    position: absolute;

    z-index: 5;

    pointer-events: none;

    display: grid;

    gap: 4px;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-label span {

    color:
      #526d7b;

    font-size: 6px;

    font-weight: 900;

    letter-spacing:
      .17em;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-label b {

    color:
      #a8c1cb;

    font-size: 8px;

    letter-spacing:
      .1em;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-label-top {

    left: 24px;

    top: 20px;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-label-bottom {

    right: 24px;

    bottom: 20px;

    text-align:
      right;

  }


  /* ============================================================
   * CROSSHAIR
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-crosshair {

    position: absolute;

    left: 50%;

    top: 50%;

    width: 46px;

    height: 46px;

    transform:
      translate(-50%,-50%);

    border:
      1px solid
      rgba(141,244,255,.05);

    border-radius:
      50%;

    pointer-events: none;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-crosshair::before,
  #relayGameplayIntroFinalV3 .relay-v4-map-crosshair::after {

    content: "";

    position: absolute;

    background:
      rgba(141,244,255,.12);

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-crosshair::before {

    width: 70px;

    height: 1px;

    left: -12px;

    top: 22px;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-crosshair::after {

    width: 1px;

    height: 70px;

    left: 22px;

    top: -12px;

  }


  /* ============================================================
   * TAG
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-tag {

    position: absolute;

    left: 18px;

    bottom: 18px;

    z-index: 8;

    display: flex;

    align-items: center;

    gap: 7px;

    padding:
      7px 9px;

    border:
      1px solid
      rgba(141,244,255,.16);

    background:
      rgba(2,8,13,.76);

    color:
      var(--v4-cyan);

    font-size: 6px;

    font-weight: 900;

    letter-spacing:
      .15em;

    backdrop-filter:
      blur(8px);

  }


  #relayGameplayIntroFinalV3 .relay-v4-tag-dot {

    width: 5px;

    height: 5px;

    border-radius: 50%;

    background:
      var(--v4-cyan);

    box-shadow:
      0 0 8px
      var(--v4-cyan);

  }


  /* ============================================================
   * MAP FOOTER
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-footer {

    display: grid;

    grid-template-columns:
      repeat(3,1fr);

    min-width: 0;

    background:
      rgba(2,7,11,.9);

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-footer > div {

    min-width: 0;

    display: flex;

    align-items: center;

    justify-content: center;

    flex-direction: column;

    gap: 3px;

    border-right:
      1px solid
      rgba(141,244,255,.07);

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-footer > div:last-child {

    border-right: 0;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-footer span {

    color:
      #4e6675;

    font-size: 5px;

    font-weight: 900;

    letter-spacing:
      .16em;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-footer b {

    color:
      #a5bac4;

    font-size: 6px;

    letter-spacing:
      .1em;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-footer b.danger {

    color:
      var(--v4-red);

  }


  /* ============================================================
   * FOOTER
   * ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-footer {

    min-height:
      70px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 20px;

    padding:
      12px 20px;

    border-top:
      1px solid
      rgba(141,244,255,.1);

    background:
      rgba(2,7,11,.96);

  }


  #relayGameplayIntroFinalV3 .relay-v4-objective {

    min-width: 0;

    display: grid;

    gap: 5px;

  }


  #relayGameplayIntroFinalV3 .relay-v4-objective-label {

    color:
      var(--v4-yellow);

    font-size: 6px;

    font-weight: 900;

    letter-spacing:
      .16em;

  }


  #relayGameplayIntroFinalV3 .relay-v4-objective-text {

    max-width:
      min(700px,70vw);

    overflow: hidden;

    text-overflow: ellipsis;

    white-space: nowrap;

    color:
      #dcebef;

    font-size:
      clamp(8px,1vw,10px);

    letter-spacing:
      .04em;

  }


  #relayGameplayIntroFinalV3 .relay-v4-footer-status {

    display: flex;

    align-items: center;

    gap: 8px;

    color:
      #77909d;

    font-size: 6px;

    font-weight: 900;

    letter-spacing:
      .14em;

    white-space:
      nowrap;

  }


  #relayGameplayIntroFinalV3 .relay-v4-status-icon {

    width: 7px;

    height: 7px;

    border-radius: 50%;

    background:
      var(--v4-green);

    box-shadow:
      0 0 10px
      rgba(169,237,131,.65);

  }


  /* ============================================================
   * SVG MAP
   * ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .bg {

    fill:
      #02080d;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .grid {

    stroke:
      #123044;

    stroke-width:
      1;

    opacity:
      .52;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .grid-major {

    stroke:
      #1c465b;

    stroke-width:
      1.4;

    opacity:
      .42;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .platform {

    fill:
      #102333;

    stroke:
      #42677b;

    stroke-width:
      1.3;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .platform-edge {

    stroke:
      #8df4ff;

    stroke-width:
      1;

    opacity:
      .2;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .danger {

    fill:
      #ff6e79;

    opacity:
      .9;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .boost {

    fill:
      #082d3b;

    stroke:
      #8df4ff;

    stroke-width:
      1.4;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .boostmark {

    fill:
      #8df4ff;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .checkpoint-ring {

    fill:
      none;

    stroke:
      #8df4ff;

    stroke-width:
      1.5;

    opacity:
      .65;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .checkpoint-ring-outer {

    fill:
      none;

    stroke:
      #8df4ff;

    stroke-width:
      1;

    stroke-dasharray:
      3 5;

    opacity:
      .3;

    animation:
      relayV4Checkpoint
      2.5s
      linear
      infinite;

  }


  @keyframes relayV4Checkpoint {

    to {
      transform:
        rotate(360deg);
      transform-origin:
        center;
    }

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .checkpoint-dot {

    fill:
      #8df4ff;

    filter:
      url(#relay-v4-glow);

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .signal {

    fill:
      #ffd06e;

    filter:
      url(#relay-v4-glow);

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .secret {

    fill:
      rgba(224,167,255,.08);

    stroke:
      #e0a7ff;

    stroke-width:
      1.5;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .gate {

    fill:
      #351e2a;

    stroke:
      #ff6e79;

    stroke-width:
      1.3;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .enemy {

    fill:
      #301a27;

    stroke:
      #ff6e79;

    stroke-width:
      2;

    filter:
      url(#relay-v4-glow-soft);

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .route-halo {

    fill:
      none;

    stroke:
      #8df4ff;

    stroke-width:
      13;

    opacity:
      .07;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .route {

    fill:
      none;

    stroke:
      #8df4ff;

    stroke-width:
      3.5;

    stroke-linecap:
      round;

    stroke-linejoin:
      round;

    stroke-dasharray:
      11 8;

    opacity:
      .9;

    filter:
      url(#relay-v4-glow);

    animation:
      relayV4Route
      1.4s
      linear
      infinite;

  }


  @keyframes relayV4Route {

    to {
      stroke-dashoffset:
        -38;
    }

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .route-core {

    fill:
      none;

    stroke:
      rgba(237,250,253,.9);

    stroke-width:
      1;

    stroke-linecap:
      round;

    opacity:
      .8;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .marker-start {

    fill:
      #a9ed83;

    stroke:
      #edffd9;

    stroke-width:
      2;

    filter:
      url(#relay-v4-glow-soft);

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .marker-goal {

    fill:
      #ffd06e;

    stroke:
      #fff0c7;

    stroke-width:
      2;

    filter:
      url(#relay-v4-glow);

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .marker-player {

    fill:
      #effcff;

    stroke:
      #8df4ff;

    stroke-width:
      2;

    filter:
      url(#relay-v4-glow);

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .player-ring {

    fill:
      none;

    stroke:
      #8df4ff;

    stroke-width:
      1.5;

    stroke-dasharray:
      4 5;

    opacity:
      .65;

    animation:
      relayV4PlayerRing
      2s
      linear
      infinite;

  }


  @keyframes relayV4PlayerRing {

    to {
      transform:
        rotate(360deg);

      transform-origin:
        center;
    }

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .label,
  #relayGameplayIntroFinalV3 .map-briefing-map .guide,
  #relayGameplayIntroFinalV3 .map-briefing-map .legend {

    font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;

    fill:
      #7895a4;

    font-size:
      9px;

    font-weight:
      800;

    letter-spacing:
      .1em;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .guide {

    fill:
      #8df4ff;

    font-size:
      8px;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .legend {

    fill:
      #b2c6ce;

  }


  /* ============================================================
   * OPEN ANIMATION
   * ============================================================ */

  #relayGameplayIntroFinalV3.relay-v4-opening
  .relay-v4-shell {

    animation:
      relayV4Open
      .42s
      cubic-bezier(.18,.82,.2,1)
      both;

  }


  @keyframes relayV4Open {

    from {

      opacity: 0;

      transform:
        translateY(18px)
        scale(.985);

      filter:
        blur(5px);

    }

    to {

      opacity: 1;

      transform:
        translateY(0)
        scale(1);

      filter:
        blur(0);

    }

  }


  /* ============================================================
   * MOBILE
   * ============================================================ */

  @media (max-width: 820px) {

    #relayGameplayIntroFinalV3 {

      padding:
        6px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-shell {

      width:
        98vw;

      height:
        96dvh;

      min-height:
        0;

      clip-path:
        none;

      border-radius:
        12px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-header {

      padding:
        14px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-readout {

      display:
        none;

    }


    #relayGameplayIntroFinalV3 .relay-v4-title {

      font-size:
        clamp(22px,7vw,30px);

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-frame {

      grid-template-rows:
        34px
        1fr
        34px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-chip:nth-child(3) {

      display:
        none;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-label-top {

      left:
        14px;

      top:
        14px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-label-bottom {

      right:
        14px;

      bottom:
        14px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-tag {

      left:
        12px;

      bottom:
        12px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-footer {

      min-height:
        58px;

      padding:
        10px 14px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-footer-status {

      display:
        none;

    }


    #relayGameplayIntroFinalV3 .relay-v4-objective-text {

      max-width:
        90vw;

    }

  }


  /* ============================================================
   * SMALL MOBILE
   * ============================================================ */

  @media (max-width: 520px) {

    #relayGameplayIntroFinalV3 .relay-v4-header {

      min-height:
        72px;

      padding:
        11px 12px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-status-line {

      font-size:
        5px;

      margin-bottom:
        6px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-status-line i {

      width:
        12px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-kicker {

      font-size:
        5px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-title {

      font-size:
        21px;

      letter-spacing:
        .045em;

    }


    #relayGameplayIntroFinalV3 .relay-v4-meta {

      margin-top:
        5px;

      font-size:
        6px;

      max-width:
        60vw;

      overflow:
        hidden;

      white-space:
        nowrap;

      text-overflow:
        ellipsis;

    }


    #relayGameplayIntroFinalV3 .relay-v4-timer {

      width:
        54px;

      height:
        54px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-timer strong {

      font-size:
        19px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-toolbar {

      padding:
        0 9px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-chip {

      padding:
        4px 6px;

      font-size:
        4px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-coordinates {

      display:
        none;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-footer {

      grid-template-columns:
        repeat(3,1fr);

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-footer span {

      font-size:
        4px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-footer b {

      font-size:
        5px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-objective-label {

      font-size:
        5px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-objective-text {

      font-size:
        7px;

    }

  }


  /* ============================================================
   * LANDSCAPE PHONE
   * ============================================================ */

  @media (
    max-height: 600px
  ) and (
    orientation: landscape
  ) {

    #relayGameplayIntroFinalV3 {

      padding:
        4px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-shell {

      height:
        98dvh;

    }


    #relayGameplayIntroFinalV3 .relay-v4-header {

      padding:
        8px 14px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-frame {

      grid-template-rows:
        30px
        1fr
        28px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-footer {

      min-height:
        42px;

      padding:
        6px 12px;

    }

  }


  /* ============================================================
   * REDUCED MOTION
   * ============================================================ */

  @media (
    prefers-reduced-motion: reduce
  ) {

    #relayGameplayIntroFinalV3 *,
    #relayGameplayIntroFinalV3 *::before,
    #relayGameplayIntroFinalV3 *::after {

      animation-duration:
        .001ms !important;

      animation-iteration-count:
        1 !important;

      scroll-behavior:
        auto !important;

    }

  }

  `;

  document.head.appendChild(style);


  /* ============================================================
   * MAP MODEL
   * ============================================================ */

  function mapModel(scene) {

    const m =
      scene?.mission || {};

    const width =
      num(
        scene?.physics?.world?.bounds?.width,
        num(
          m?.goal?.x,
          6100
        ) + 300
      );

    const height =
      num(
        scene?.physics?.world?.bounds?.height,
        720
      );


    const sx =
      920 /
      Math.max(width, 1);

    const sy =
      430 /
      Math.max(height, 1);


    const X = x =>
      40 +
      clamp(
        num(x) * sx,
        0,
        920
      );


    const Y = y =>
      50 +
      clamp(
        num(y) * sy,
        0,
        430
      );


    const p =
      scene?.player;


    const points = {

      start: {
        x:
          X(
            m?.spawn?.x ??
            120
          ),

        y:
          Y(
            m?.spawn?.y ??
            520
          )
      },

      goal: {
        x:
          X(
            m?.goal?.x ??
            6100
          ),

        y:
          Y(
            m?.goal?.y ??
            500
          )
      },

      player: {
        x:
          X(
            p?.x ??
            m?.spawn?.x ??
            120
          ),

        y:
          Y(
            p?.y ??
            m?.spawn?.y ??
            520
          )
      }

    };


    const arr = key =>
      Array.isArray(m?.[key])
        ? m[key]
        : [];


    const point = item => {

      if (
        Array.isArray(item)
      ) {

        return {
          x:
            X(item[0]),

          y:
            Y(item[1])

        };

      }


      return {

        x:
          X(item?.x),

        y:
          Y(item?.y)

      };

    };


    const rect = item => {

      const x =
        num(item?.[0]);

      const y =
        num(item?.[1]);

      const w =
        num(
          item?.[2],
          40
        );

      const h =
        num(
          item?.[3],
          20
        );


      return {

        x:
          X(x),

        y:
          Y(y),

        w:
          Math.max(
            4,
            w * sx
          ),

        h:
          Math.max(
            3,
            h * sy
          )

      };

    };


    return {

      width,
      height,

      X,
      Y,

      points,

      platforms:
        arr('platforms'),

      obstacles:
        arr('obstacles'),

      boostPads:
        arr('boostPads'),

      checkpoints:
        arr('checkpoints'),

      signals:
        arr('signals'),

      secrets:
        arr('secrets'),

      movingGates:
        arr('movingGates'),

      enemies:
        arr('enemies'),

      guides:
        arr('guides'),

      point,
      rect

    };

  }


  /* ============================================================
   * SVG HELPERS
   * ============================================================ */

  const createGrid = () => {

    let output = '';

    for (
      let x = 40;
      x <= 960;
      x += 40
    ) {

      output += `
        <line
          x1="${x}"
          y1="0"
          x2="${x}"
          y2="560"
          class="${
            x % 120 === 0
              ? 'grid-major'
              : 'grid'
          }">
        </line>
      `;

    }


    for (
      let y = 40;
      y <= 520;
      y += 40
    ) {

      output += `
        <line
          x1="0"
          y1="${y}"
          x2="1000"
          y2="${y}"
          class="${
            y % 120 === 0
              ? 'grid-major'
              : 'grid'
          }">
        </line>
      `;

    }

    return output;

  };


  /* ============================================================
   * RENDER MAP
   * ============================================================ */

  function renderMap(scene) {

    const svg =
      root.querySelector(
        '.map-briefing-map'
      );

    if (
      !svg ||
      !scene
    ) return;


    const d =
      mapModel(scene);


    const pathPoints = [

      d.points.start,

      ...d.checkpoints.map(
        d.point
      ),

      d.points.goal

    ];


    const routePath =
      pathPoints
        .map(
          (point, index) =>
            `${
              index
                ? 'L'
                : 'M'
            } ${
              point.x.toFixed(1)
            } ${
              point.y.toFixed(1)
            }`
        )
        .join(' ');


    const platforms =
      d.platforms
        .map(
          item => {

            const r =
              d.rect(item);

            return `
              <g>
                <rect
                  x="${r.x}"
                  y="${r.y}"
                  width="${r.w}"
                  height="${r.h}"
                  rx="3"
                  class="platform">
                </rect>

                <line
                  x1="${r.x}"
                  y1="${r.y}"
                  x2="${r.x + r.w}"
                  y2="${r.y}"
                  class="platform-edge">
                </line>
              </g>
            `;

          }
        )
        .join('');


    const obstacles =
      d.obstacles
        .map(
          item => {

            const p =
              d.point(item);

            return `
              <g>

                <path
                  d="
                    M ${p.x - 9} ${p.y + 8}
                    L ${p.x} ${p.y - 9}
                    L ${p.x + 9} ${p.y + 8}
                    Z
                  "
                  class="danger">
                </path>

                <line
                  x1="${p.x - 5}"
                  y1="${p.y + 4}"
                  x2="${p.x + 5}"
                  y2="${p.y + 4}"
                  stroke="#ffb0b6"
                  opacity=".4">
                </line>

              </g>
            `;

          }
        )
        .join('');


    const pads =
      d.boostPads
        .map(
          item => {

            const r =
              d.rect([
                item[0] - 28,
                item[1] - 8,
                56,
                16
              ]);


            return `
              <g>

                <rect
                  x="${r.x}"
                  y="${r.y}"
                  width="${r.w}"
                  height="${r.h}"
                  rx="4"
                  class="boost">
                </rect>

                <path
                  d="
                    M ${r.x + 7}
                      ${r.y + r.h / 2}

                    l 9 -6
                    v 12
                    z

                    M ${r.x + 20}
                      ${r.y + r.h / 2}

                    l 9 -6
                    v 12
                    z
                  "
                  class="boostmark">
                </path>

              </g>
            `;

          }
        )
        .join('');


    const cps =
      d.checkpoints
        .map(
          (item, index) => {

            const p =
              d.point(item);

            return `
              <g>

                <circle
                  cx="${p.x}"
                  cy="${p.y}"
                  r="18"
                  class="checkpoint-ring-outer">
                </circle>

                <circle
                  cx="${p.x}"
                  cy="${p.y}"
                  r="13"
                  class="checkpoint-ring">
                </circle>

                <circle
                  cx="${p.x}"
                  cy="${p.y}"
                  r="4"
                  class="checkpoint-dot">
                </circle>

                <text
                  x="${p.x}"
                  y="${p.y - 20}"
                  text-anchor="middle"
                  class="label">
                  CP ${index + 1}
                </text>

              </g>
            `;

          }
        )
        .join('');


    const signals =
      d.signals
        .map(
          item => {

            const p =
              d.point(item);

            return `
              <g>

                <circle
                  cx="${p.x}"
                  cy="${p.y}"
                  r="9"
                  fill="none"
                  stroke="#ffd06e"
                  opacity=".12">
                </circle>

                <circle
                  cx="${p.x}"
                  cy="${p.y}"
                  r="4.5"
                  class="signal">
                </circle>

              </g>
            `;

          }
        )
        .join('');


    const secrets =
      d.secrets
        .map(
          item => {

            const p =
              d.point(item);

            return `
              <path
                d="
                  M ${p.x} ${p.y - 7}
                  l 7 7
                  -7 7
                  -7 -7
                  Z
                "
                class="secret">
              </path>
            `;

          }
        )
        .join('');


    const gates =
      d.movingGates
        .map(
          item => {

            const r =
              d.rect(item);

            return `
              <g>

                <rect
                  x="${r.x}"
                  y="${r.y}"
                  width="${r.w}"
                  height="${r.h}"
                  rx="3"
                  class="gate">
                </rect>

                <line
                  x1="${r.x}"
                  y1="${r.y}"
                  x2="${r.x + r.w}"
                  y2="${r.y + r.h}"
                  stroke="#ff6e79"
                  opacity=".25">
                </line>

                <line
                  x1="${r.x + r.w}"
                  y1="${r.y}"
                  x2="${r.x}"
                  y2="${r.y + r.h}"
                  stroke="#ff6e79"
                  opacity=".25">
                </line>

              </g>
            `;

          }
        )
        .join('');


    const enemies =
      d.enemies
        .map(
          item => {

            const p =
              d.point(item);

            return `
              <g>

                <circle
                  cx="${p.x}"
                  cy="${p.y}"
                  r="12"
                  fill="none"
                  stroke="#ff6e79"
                  stroke-width="1"
                  opacity=".16">
                </circle>

                <circle
                  cx="${p.x}"
                  cy="${p.y}"
                  r="8"
                  class="enemy">
                </circle>

                <path
                  d="
                    M ${p.x - 3} ${p.y}
                    H ${p.x + 3}
                    M ${p.x} ${p.y - 3}
                    V ${p.y + 3}
                  "
                  stroke="#ffadb3"
                  opacity=".55">
                </path>

                <text
                  x="${p.x + 14}"
                  y="${p.y + 3}"
                  class="label">
                  HOSTILE
                </text>

              </g>
            `;

          }
        )
        .join('');


    const guides =
      d.guides
        .map(
          item => {

            const p =
              d.point(item);

            return `
              <text
                x="${p.x}"
                y="${p.y - 13}"
                class="guide">
                ${esc(item?.text || '')}
              </text>
            `;

          }
        )
        .join('');


    /* ==========================================================
     * SVG
     * ========================================================== */

    svg.innerHTML = `

      <defs>

        <filter
          id="relay-v4-glow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%">

          <feGaussianBlur
            stdDeviation="2.8"
            result="blur">
          </feGaussianBlur>

          <feMerge>

            <feMergeNode
              in="blur">
            </feMergeNode>

            <feMergeNode
              in="SourceGraphic">
            </feMergeNode>

          </feMerge>

        </filter>


        <filter
          id="relay-v4-glow-soft"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%">

          <feGaussianBlur
            stdDeviation="1.5"
            result="blur">
          </feGaussianBlur>

          <feMerge>

            <feMergeNode
              in="blur">
            </feMergeNode>

            <feMergeNode
              in="SourceGraphic">
            </feMergeNode>

          </feMerge>

        </filter>


        <linearGradient
          id="relay-v4-map-gradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1">

          <stop
            offset="0%"
            stop-color="#06131e">
          </stop>

          <stop
            offset="50%"
            stop-color="#020a11">
          </stop>

          <stop
            offset="100%"
            stop-color="#010508">
          </stop>

        </linearGradient>


        <radialGradient
          id="relay-v4-center-glow">

          <stop
            offset="0%"
            stop-color="#8df4ff"
            stop-opacity=".055">
          </stop>

          <stop
            offset="100%"
            stop-color="#8df4ff"
            stop-opacity="0">
          </stop>

        </radialGradient>

      </defs>


      <rect
        width="1000"
        height="560"
        fill="url(#relay-v4-map-gradient)">
      </rect>


      <rect
        width="1000"
        height="560"
        fill="url(#relay-v4-center-glow)">
      </rect>


      <!-- GRID -->

      ${createGrid()}


      <!-- ROUTE -->

      <path
        d="${routePath}"
        class="route-halo">
      </path>

      <path
        d="${routePath}"
        class="route">
      </path>

      <path
        d="${routePath}"
        class="route-core">
      </path>


      <!-- LEVEL OBJECTS -->

      ${platforms}

      ${gates}

      ${obstacles}

      ${pads}

      ${signals}

      ${secrets}

      ${cps}

      ${enemies}

      ${guides}


      <!-- START -->

      <g>

        <circle
          cx="${d.points.start.x}"
          cy="${d.points.start.y}"
          r="15"
          fill="none"
          stroke="#a9ed83"
          opacity=".16">
        </circle>

        <circle
          cx="${d.points.start.x}"
          cy="${d.points.start.y}"
          r="8"
          class="marker-start">
        </circle>

        <text
          x="${d.points.start.x + 15}"
          y="${d.points.start.y + 4}"
          class="legend">
          START
        </text>

      </g>


      <!-- OBJECTIVE -->

      <g>

        <circle
          cx="${d.points.goal.x}"
          cy="${d.points.goal.y}"
          r="20"
          fill="none"
          stroke="#ffd06e"
          opacity=".12">
        </circle>

        <circle
          cx="${d.points.goal.x}"
          cy="${d.points.goal.y}"
          r="10"
          class="marker-goal">
        </circle>

        <path
          d="
            M ${d.points.goal.x - 4}
              ${d.points.goal.y + 8}

            V ${d.points.goal.y - 9}

            l 15 5

            -15 6
          "
          fill="#ffd06e">
        </path>

        <text
          x="${d.points.goal.x + 18}"
          y="${d.points.goal.y + 4}"
          class="legend">
          OBJECTIVE
        </text>

      </g>


      <!-- PLAYER -->

      <g id="live-player">

        <circle
          cx="${d.points.player.x}"
          cy="${d.points.player.y}"
          r="15"
          class="player-ring">
        </circle>

        <circle
          cx="${d.points.player.x}"
          cy="${d.points.player.y}"
          r="7"
          class="marker-player">
        </circle>

        <text
          x="${d.points.player.x + 13}"
          y="${d.points.player.y - 12}"
          class="legend">
          YOU
        </text>

      </g>


      <!-- THREAT CORRIDOR -->

      <g opacity=".9">

        <path
          d="
            M 690 350
            L 900 300
            L 930 390
            L 720 445
            Z
          "
          fill="#ff6e79"
          fill-opacity=".025"
          stroke="#ff6e79"
          stroke-opacity=".16"
          stroke-dasharray="5 8">
        </path>

        <text
          x="730"
          y="375"
          fill="#ff6e79"
          opacity=".55"
          font-family="ui-monospace,monospace"
          font-size="8"
          font-weight="900"
          letter-spacing=".14em">
          THREAT CORRIDOR
        </text>

      </g>


      <!-- LEGEND -->

      <g
        transform="translate(28 528)">

        <circle
          cx="0"
          cy="0"
          r="4"
          class="signal">
        </circle>

        <text
          x="12"
          y="3"
          class="legend">
          SIGNAL
        </text>


        <circle
          cx="88"
          cy="0"
          r="4"
          class="enemy">
        </circle>

        <text
          x="100"
          y="3"
          class="legend">
          THREAT
        </text>


        <circle
          cx="178"
          cy="0"
          r="4"
          class="marker-goal">
        </circle>

        <text
          x="190"
          y="3"
          class="legend">
          TARGET
        </text>

      </g>

    `;

  }


  /* ============================================================
   * STATE
   * ============================================================ */

  let active = false;

  let timerId = 0;
  let endId = 0;
  let followId = 0;

  const lock = state => {

    window.__relayCinematicLock =
      state;

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

  };


  /* ============================================================
   * TIMER
   * ============================================================ */

  const updateTimer = ms => {

    const seconds =
      Math.max(
        0,
        Math.ceil(ms / 1000)
      );


    const number =
      root.querySelector(
        '.relay-v4-timer strong'
      );


    const progress =
      root.querySelector(
        '.relay-v4-timer-progress'
      );


    if (number) {

      number.textContent =
        String(seconds);

    }


    if (progress) {

      const circumference =
        125.66;

      const ratio =
        clamp(
          ms / 10000,
          0,
          1
        );

      progress.style.strokeDashoffset =
        String(
          circumference *
          (1 - ratio)
        );

    }

  };


  /* ============================================================
   * LIVE PLAYER
   * ============================================================ */

  const updatePlayer = () => {

    if (!active) return;


    const scene =
      runner();

    const svg =
      root.querySelector(
        '.map-briefing-map'
      );

    const group =
      svg?.querySelector(
        '#live-player'
      );


    if (
      !scene ||
      !group
    ) return;


    const d =
      mapModel(scene);


    const circle =
      group.querySelector(
        '.marker-player'
      );

    const ring =
      group.querySelector(
        '.player-ring'
      );

    const text =
      group.querySelector(
        'text'
      );


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


    text?.setAttribute(
      'x',
      d.points.player.x + 13
    );

    text?.setAttribute(
      'y',
      d.points.player.y - 12
    );

  };


  /* ============================================================
   * FINISH
   * ============================================================ */

  const finish = () => {

    clearInterval(timerId);

    clearTimeout(endId);

    clearInterval(followId);


    timerId =
      endId =
      followId =
      0;


    active =
      false;


    root.classList.remove(
      'relay-v4-opening'
    );


    lock(false);


    root.hidden =
      true;

  };


  /* ============================================================
   * SHOW
   * ============================================================ */

  const show = async () => {

    if (active) return;


    active =
      true;


    lock(true);


    root.hidden =
      false;


    root.classList.remove(
      'relay-v4-opening'
    );


    /*
     * Force animation restart.
     */

    void root.offsetWidth;


    root.classList.add(
      'relay-v4-opening'
    );


    const startedWait =
      performance.now();


    let data =
      mission();


    while (
      !data.scene &&
      performance.now() -
        startedWait <
        4500
    ) {

      await wait(80);

      data =
        mission();

    }


    data =
      mission();


    root.querySelector(
      '.relay-v4-meta'
    ).textContent =
      `${data.district} // ${data.title}`;


    root.querySelector(
      '.relay-v4-objective-text'
    ).textContent =
      data.objective;


    renderMap(
      data.scene
    );


    const started =
      performance.now();


    updateTimer(
      10000
    );


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


    followId =
      setInterval(
        updatePlayer,
        100
      );


    endId =
      setTimeout(
        finish,
        10000
      );

  };


  /* ============================================================
   * CLOSE WITH ESC
   * ============================================================ */

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


  /* ============================================================
   * PLAY DETECTION
   * ============================================================ */

  document.addEventListener(
    'click',
    event => {

      const button =
        event.target.closest(
          BUTTONS
        );


      if (
        !button ||
        active
      ) return;


      /*
       * Let the original game handler
       * initialize the Phaser scene first.
       */

      setTimeout(
        show,
        120
      );

    },
    true
  );


  /* ============================================================
   * CINEMATIC LOCK
   * ============================================================ */

  const lockStyle =
    document.createElement(
      'style'
    );


  lockStyle.textContent = `

    #play.relay-map-briefing-lock .hud,
    #play.relay-map-briefing-lock .world-marker,
    #play.relay-map-briefing-lock .input-guide,
    #play.relay-map-briefing-lock .mobile-controls,
    #play.relay-map-briefing-lock .rotate-prompt,
    #play.relay-map-briefing-lock #toast,
    #play.relay-map-briefing-lock #pause {

      visibility:
        hidden !important;

      opacity:
        0 !important;

      pointer-events:
        none !important;

    }

  `;


  document.head.appendChild(
    lockStyle
  );


  /* ============================================================
   * PUBLIC API
   * ============================================================ */

  window.relayGameplayIntroV4 = {

    show,

    close:
      finish,

    refresh() {

      if (!active) return;

      const data =
        mission();

      renderMap(
        data.scene
      );

    },

    getRoot() {

      return root;

    },

    isVisible() {

      return active;

    }

  };

})();
