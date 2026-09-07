(() => {
  'use strict';

  /* ============================================================
   * RELAY RUNNER
   * MISSION ROUTE — ELITE HUD DESIGN OVERRIDE v2
   *
   * DESIGN ONLY
   * - Does NOT replace Phaser
   * - Does NOT create another map
   * - Does NOT modify mission logic
   * - Does NOT modify renderMap()
   * - Mobile + Desktop
   * - Anti-overlap protection
   * - Premium tactical HUD
   * ============================================================ */

  const STYLE_ID = 'relay-elite-route-design-v2';

  /* Remove previous version if it exists */
  document.getElementById('relay-elite-route-design-v1')?.remove();

  /* Prevent duplicate injection */
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `

  /* ============================================================
     ROOT / GLOBAL
     ============================================================ */

  #relayGameplayIntroFinalV3 {

    --elite-bg: #010307;
    --elite-panel: rgba(3,9,15,.985);
    --elite-panel-2: rgba(5,14,22,.97);
    --elite-panel-soft: rgba(7,17,27,.92);

    --elite-cyan: #65f3ff;
    --elite-cyan-2: #19b9d1;
    --elite-blue: #438cff;

    --elite-yellow: #ffd166;
    --elite-green: #8cff9a;
    --elite-red: #ff5366;

    --elite-white: #f2fdff;
    --elite-text: #e8f8fb;
    --elite-muted: #66818f;
    --elite-dark-muted: #3d5661;

    --elite-line: rgba(101,243,255,.14);
    --elite-line-strong: rgba(101,243,255,.28);

    position: relative;

    width: 100%;
    min-width: 0;

    padding:
      clamp(6px, 1.5vw, 24px) !important;

    overflow: hidden !important;

    background:
      radial-gradient(
        circle at 50% 35%,
        rgba(25,185,209,.11),
        transparent 38%
      ),
      radial-gradient(
        circle at 15% 90%,
        rgba(67,140,255,.055),
        transparent 32%
      ),
      #010307 !important;

    color: var(--elite-text);

    box-sizing: border-box;

    isolation: isolate;
  }


  #relayGameplayIntroFinalV3,
  #relayGameplayIntroFinalV3 *,
  #relayGameplayIntroFinalV3 *::before,
  #relayGameplayIntroFinalV3 *::after {

    box-sizing: border-box;

    -webkit-tap-highlight-color: transparent;
  }


  #relayGameplayIntroFinalV3 * {

    min-width: 0;

    text-rendering:
      geometricPrecision;
  }


  /* ============================================================
     GLOBAL SCAN EFFECT
     ============================================================ */

  #relayGameplayIntroFinalV3::before {

    content: "";

    position: absolute;

    inset: 0;

    pointer-events: none;

    z-index: 20;

    opacity: .16;

    background:
      repeating-linear-gradient(
        180deg,
        transparent 0,
        transparent 3px,
        rgba(101,243,255,.018) 4px,
        transparent 5px
      );

    mix-blend-mode: screen;
  }


  #relayGameplayIntroFinalV3::after {

    content: "";

    position: absolute;

    inset: 0;

    pointer-events: none;

    z-index: 21;

    background:
      radial-gradient(
        ellipse at center,
        transparent 48%,
        rgba(0,0,0,.42) 100%
      );

  }


  /* ============================================================
     BACKDROP
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-backdrop {

    background:

      radial-gradient(
        ellipse at center,
        rgba(0,180,220,.095),
        transparent 45%
      ),

      radial-gradient(
        ellipse at 18% 82%,
        rgba(20,70,120,.09),
        transparent 36%
      ),

      radial-gradient(
        ellipse at 90% 15%,
        rgba(255,209,102,.025),
        transparent 30%
      ),

      linear-gradient(
        180deg,
        rgba(0,0,0,.22),
        rgba(0,0,0,.9)
      ) !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-backdrop::before {

    opacity: .38 !important;

    background-size:
      32px 32px !important;

    background-image:

      linear-gradient(
        rgba(101,243,255,.038) 1px,
        transparent 1px
      ),

      linear-gradient(
        90deg,
        rgba(101,243,255,.038) 1px,
        transparent 1px
      ) !important;

  }


  /* ============================================================
     MAIN SHELL
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-shell {

    position: relative;

    width:
      min(1380px, 96vw) !important;

    height:
      min(900px, 94dvh) !important;

    min-height:
      560px !important;

    overflow: hidden !important;

    border:
      1px solid
      rgba(101,243,255,.24) !important;

    border-radius:
      5px !important;

    background:

      linear-gradient(
        135deg,
        rgba(8,20,30,.995),
        rgba(2,7,12,.995)
      ) !important;

    box-shadow:

      0 40px 120px
      rgba(0,0,0,.92),

      0 0 90px
      rgba(50,200,230,.075),

      0 0 2px
      rgba(101,243,255,.45),

      inset 0 1px
      rgba(255,255,255,.065),

      inset 0 0 80px
      rgba(30,150,180,.028) !important;

    clip-path:
      polygon(
        0 0,
        calc(100% - 18px) 0,
        100% 18px,
        100% calc(100% - 18px),
        calc(100% - 18px) 100%,
        18px 100%,
        0 calc(100% - 18px)
      ) !important;

    contain:
      layout paint;
  }


  /* ============================================================
     SHELL EDGE LIGHT
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-shell::before {

    content: "";

    position: absolute;

    inset: 0;

    pointer-events: none;

    z-index: 30;

    border:
      1px solid rgba(101,243,255,.07);

    background:

      linear-gradient(
        90deg,
        rgba(101,243,255,.06),
        transparent 18%,
        transparent 82%,
        rgba(255,209,102,.035)
      );

  }


  /* ============================================================
     TOP SCANNER
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-topline {

    position: relative;

    height:
      3px !important;

    overflow: hidden;

    background:
      rgba(101,243,255,.025);
  }


  #relayGameplayIntroFinalV3 .relay-v4-topline::after {

    content: "";

    position: absolute;

    top: 0;
    left: -30%;

    width: 30%;
    height: 100%;

    background:
      linear-gradient(
        90deg,
        transparent,
        rgba(101,243,255,.8),
        transparent
      );

    animation:
      relayEliteScanner
      3.8s
      linear
      infinite;
  }


  @keyframes relayEliteScanner {

    from {
      transform: translateX(0);
    }

    to {
      transform: translateX(440%);
    }

  }


  #relayGameplayIntroFinalV3 .relay-v4-topline span {

    border-right:
      1px solid rgba(101,243,255,.18) !important;

    box-shadow:
      0 0 10px rgba(101,243,255,.12);

  }


  #relayGameplayIntroFinalV3 .relay-v4-topline span:nth-child(1),
  #relayGameplayIntroFinalV3 .relay-v4-topline span:nth-child(5) {

    background:
      var(--elite-yellow) !important;

    box-shadow:
      0 0 14px
      rgba(255,209,102,.55);

  }


  #relayGameplayIntroFinalV3 .relay-v4-topline span:nth-child(2),
  #relayGameplayIntroFinalV3 .relay-v4-topline span:nth-child(4) {

    background:
      var(--elite-cyan) !important;

    box-shadow:
      0 0 14px
      rgba(101,243,255,.5);

  }


  /* ============================================================
     HEADER
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-header {

    position: relative;

    min-height:
      92px;

    padding:
      20px 28px !important;

    gap:
      18px;

    border-bottom:
      1px solid
      rgba(101,243,255,.14) !important;

    background:

      linear-gradient(
        90deg,
        rgba(101,243,255,.04),
        transparent 45%,
        rgba(255,209,102,.027)
      ) !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-header::after {

    content: "";

    position: absolute;

    left: 28px;
    right: 28px;
    bottom: -1px;

    height: 1px;

    background:
      linear-gradient(
        90deg,
        var(--elite-cyan),
        transparent 22%,
        transparent 78%,
        var(--elite-yellow)
      );

    opacity: .42;

  }


  /* ============================================================
     HEADER LEFT — OVERLAP PROTECTION
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-header > :first-child {

    min-width: 0;

    flex:
      1 1 auto;

    overflow: hidden;
  }


  #relayGameplayIntroFinalV3 .relay-v4-kicker,
  #relayGameplayIntroFinalV3 .relay-v4-title,
  #relayGameplayIntroFinalV3 .relay-v4-meta,
  #relayGameplayIntroFinalV3 .relay-v4-status-line {

    max-width: 100%;

    overflow: hidden;

    text-overflow: ellipsis;

    white-space: nowrap;
  }


  /* ============================================================
     STATUS
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-status-line {

    color:
      #668594 !important;

    font-size:
      7px !important;

    letter-spacing:
      .22em !important;

    line-height:
      1.4 !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-live-dot {

    flex:
      0 0 auto;

    width:
      7px !important;

    height:
      7px !important;

    background:
      var(--elite-cyan) !important;

    box-shadow:
      0 0 7px var(--elite-cyan),
      0 0 18px rgba(101,243,255,.7) !important;

    animation:
      relayLivePulse
      1.7s
      ease-in-out
      infinite;
  }


  @keyframes relayLivePulse {

    0%,
    100% {
      opacity: .7;
      transform: scale(.92);
    }

    50% {
      opacity: 1;
      transform: scale(1.08);
    }

  }


  /* ============================================================
     TITLE
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-kicker {

    color:
      var(--elite-yellow) !important;

    font-size:
      7px !important;

    line-height:
      1.2 !important;

    letter-spacing:
      .24em !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-title {

    color:
      #f2fdff !important;

    font-size:
      clamp(28px,3.4vw,48px) !important;

    font-weight:
      950 !important;

    line-height:
      .98 !important;

    letter-spacing:
      .075em !important;

    text-shadow:
      0 0 24px rgba(101,243,255,.13);

  }


  #relayGameplayIntroFinalV3 .relay-v4-meta {

    color:
      #6f8997 !important;

    font-size:
      8px !important;

    line-height:
      1.35 !important;

    letter-spacing:
      .16em !important;

  }


  /* ============================================================
     RIGHT HUD
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-header-right {

    flex:
      0 0 auto;

    gap:
      18px !important;

    min-width:
      0;

    display:
      flex;

    align-items:
      center;

  }


  #relayGameplayIntroFinalV3 .relay-v4-readout {

    min-width:
      122px !important;

    max-width:
      180px;

    padding:
      11px 14px !important;

    border:
      1px solid
      rgba(101,243,255,.16) !important;

    background:
      rgba(101,243,255,.025) !important;

    box-shadow:
      inset 0 0 20px rgba(101,243,255,.025);

    overflow:
      hidden;

  }


  #relayGameplayIntroFinalV3 .relay-v4-readout-label {

    color:
      #55707d !important;

    font-size:
      6px !important;

    line-height:
      1.2;

    letter-spacing:
      .2em !important;

    white-space:
      nowrap;

  }


  #relayGameplayIntroFinalV3 .relay-v4-readout b {

    color:
      var(--elite-green) !important;

    font-size:
      9px !important;

    line-height:
      1.3;

    text-shadow:
      0 0 10px rgba(140,255,154,.25);

    white-space:
      nowrap;

  }


  /* ============================================================
     TIMER
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-timer {

    position: relative;

    flex:
      0 0 auto;

    width:
      78px !important;

    height:
      78px !important;

    filter:
      drop-shadow(
        0 0 12px rgba(255,209,102,.14)
      );

  }


  #relayGameplayIntroFinalV3 .relay-v4-timer-track {

    stroke:
      rgba(255,209,102,.08) !important;

    stroke-width:
      2 !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-timer-progress {

    stroke:
      var(--elite-yellow) !important;

    stroke-width:
      2.8 !important;

    filter:
      drop-shadow(
        0 0 5px rgba(255,209,102,.8)
      ) !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-timer strong {

    color:
      #fff2bd !important;

    font-size:
      27px !important;

    line-height:
      1 !important;

    text-shadow:
      0 0 15px rgba(255,209,102,.45);

  }


  #relayGameplayIntroFinalV3 .relay-v4-timer > span {

    color:
      #718894 !important;

    line-height:
      1 !important;

  }


  /* ============================================================
     MAP FRAME
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-frame {

    position: relative;

    min-height: 0;

    overflow: hidden !important;

    background:
      #01070b !important;

  }


  /* ============================================================
     MAP TOOLBAR
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-toolbar {

    min-height:
      40px;

    padding:
      0 18px !important;

    gap:
      10px;

    background:

      linear-gradient(
        90deg,
        rgba(4,15,23,.99),
        rgba(2,8,13,.97)
      ) !important;

    border-bottom:
      1px solid
      rgba(101,243,255,.11) !important;

    overflow:
      hidden;

  }


  #relayGameplayIntroFinalV3 .relay-v4-toolbar-left {

    display:
      flex;

    align-items:
      center;

    gap:
      7px !important;

    min-width:
      0;

    overflow:
      hidden;
  }


  #relayGameplayIntroFinalV3 .relay-v4-chip {

    flex:
      0 0 auto;

    min-height:
      20px;

    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      center;

    padding:
      4px 9px !important;

    border:
      1px solid
      rgba(101,243,255,.12) !important;

    color:
      #55717e !important;

    background:
      rgba(255,255,255,.018) !important;

    font-size:
      5px !important;

    line-height:
      1 !important;

    letter-spacing:
      .17em !important;

    white-space:
      nowrap;

  }


  #relayGameplayIntroFinalV3 .relay-v4-chip.active {

    color:
      var(--elite-cyan) !important;

    border-color:
      rgba(101,243,255,.35) !important;

    background:
      rgba(101,243,255,.055) !important;

    box-shadow:
      0 0 12px rgba(101,243,255,.07),
      inset 0 0 10px rgba(101,243,255,.035);

  }


  #relayGameplayIntroFinalV3 .relay-v4-coordinates {

    margin-left:
      auto;

    flex:
      0 1 auto;

    max-width:
      42%;

    overflow:
      hidden;

    text-overflow:
      ellipsis;

    white-space:
      nowrap;

    color:
      #55727f !important;

    font-size:
      6px !important;

    letter-spacing:
      .2em !important;

  }


  /* ============================================================
     MAP WRAP
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-wrap {

    position: relative;

    min-height: 0;

    overflow: hidden !important;

    background:
      #01070b !important;

    box-shadow:
      inset 0 0 80px rgba(0,0,0,.45);

    transform:
      translateZ(0);

    backface-visibility:
      hidden;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map {

    filter:
      saturate(1.12)
      contrast(1.06);

    transform:
      translateZ(0);
  }


  /* ============================================================
     MAP GRID
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .grid {

    stroke:
      #113445 !important;

    opacity:
      .42 !important;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .grid-major {

    stroke:
      #1d5267 !important;

    opacity:
      .48 !important;

  }


  /* ============================================================
     PLATFORMS
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .platform {

    fill:
      #0b1d2a !important;

    stroke:
      #31566a !important;

    stroke-width:
      1.3 !important;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .platform-edge {

    stroke:
      var(--elite-cyan) !important;

    opacity:
      .27 !important;

  }


  /* ============================================================
     ROUTE
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .route-halo {

    stroke:
      var(--elite-cyan) !important;

    stroke-width:
      18 !important;

    opacity:
      .045 !important;

    filter:
      blur(3px);

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .route {

    stroke:
      var(--elite-cyan) !important;

    stroke-width:
      3.8 !important;

    opacity:
      .95 !important;

    filter:
      url(#relay-v4-glow);

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .route-core {

    stroke:
      #e9fdff !important;

    stroke-width:
      1 !important;

    opacity:
      .72 !important;

  }


  /* ============================================================
     PLAYER
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .marker-player {

    fill:
      #ffffff !important;

    stroke:
      var(--elite-cyan) !important;

    stroke-width:
      2 !important;

    filter:
      url(#relay-v4-glow);

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .player-ring {

    stroke:
      var(--elite-cyan) !important;

    opacity:
      .85 !important;

    filter:
      drop-shadow(
        0 0 5px rgba(101,243,255,.5)
      );

    animation:
      relayPlayerRing
      2s
      ease-out
      infinite;
  }


  @keyframes relayPlayerRing {

    0% {
      opacity: .85;
      stroke-width: 1;
    }

    70% {
      opacity: .18;
      stroke-width: 2.5;
    }

    100% {
      opacity: .85;
      stroke-width: 1;
    }

  }


  /* ============================================================
     CHECKPOINT
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .checkpoint-ring {

    stroke:
      var(--elite-cyan) !important;

    opacity:
      .75 !important;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .checkpoint-dot {

    fill:
      var(--elite-cyan) !important;

    filter:
      drop-shadow(
        0 0 5px rgba(101,243,255,.7)
      );

  }


  /* ============================================================
     DANGER
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .danger {

    fill:
      var(--elite-red) !important;

    filter:
      drop-shadow(
        0 0 4px rgba(255,83,102,.45)
      );

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .enemy {

    fill:
      #29121a !important;

    stroke:
      var(--elite-red) !important;

    filter:
      url(#relay-v4-glow-soft);

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .gate {

    fill:
      #26131b !important;

    stroke:
      var(--elite-red) !important;

  }


  /* ============================================================
     BOOST
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .boost {

    fill:
      #062b38 !important;

    stroke:
      var(--elite-cyan) !important;

    filter:
      drop-shadow(
        0 0 4px rgba(101,243,255,.22)
      );

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .boostmark {

    fill:
      #9cfcff !important;

  }


  /* ============================================================
     MAP TEXT — ANTI OVERLAP
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map text {

    paint-order:
      stroke fill;

    stroke:
      rgba(1,7,11,.75);

    stroke-width:
      2px;

    stroke-linejoin:
      round;
  }


  #relayGameplayIntroFinalV3 .map-briefing-map .label,
  #relayGameplayIntroFinalV3 .map-briefing-map .legend {

    fill:
      #91aeba !important;

    font-size:
      8px !important;

    font-weight:
      850 !important;

    letter-spacing:
      .12em !important;

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .guide {

    fill:
      var(--elite-cyan) !important;

    font-size:
      8px !important;

    letter-spacing:
      .12em !important;

  }


  /* ============================================================
     MAP FX
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-noise {

    opacity:
      .08 !important;

    pointer-events:
      none !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-vignette {

    background:
      radial-gradient(
        ellipse at center,
        transparent 42%,
        rgba(0,0,0,.68) 100%
      ) !important;

    pointer-events:
      none !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-scan {

    height:
      90px !important;

    background:
      linear-gradient(
        180deg,
        transparent,
        rgba(101,243,255,.055),
        transparent
      ) !important;

    pointer-events:
      none !important;

    animation:
      relayMapScan
      5s
      linear
      infinite;
  }


  @keyframes relayMapScan {

    0% {
      transform: translateY(-120%);
      opacity: 0;
    }

    15% {
      opacity: .8;
    }

    70% {
      opacity: .45;
    }

    100% {
      transform: translateY(500%);
      opacity: 0;
    }

  }


  /* ============================================================
     MAP CORNERS
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-corners {

    inset:
      12px !important;

    pointer-events:
      none !important;

  }


  #relayGameplayIntroFinalV3 .corner {

    width:
      36px !important;

    height:
      36px !important;

    border-color:
      rgba(101,243,255,.28) !important;

    filter:
      drop-shadow(
        0 0 4px rgba(101,243,255,.12)
      );

  }


  /* ============================================================
     MAP LABELS
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-label {

    max-width:
      min(220px, 38vw);

    padding:
      8px 10px;

    overflow:
      hidden;

    border-left:
      2px solid
      rgba(101,243,255,.35);

    background:
      linear-gradient(
        90deg,
        rgba(3,12,19,.78),
        transparent
      );

    pointer-events:
      none;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-label span,
  #relayGameplayIntroFinalV3 .relay-v4-map-label b {

    display:
      block;

    overflow:
      hidden;

    text-overflow:
      ellipsis;

    white-space:
      nowrap;
  }


  #relayGameplayIntroFinalV3 .relay-v4-map-label span {

    color:
      #55727f !important;

    font-size:
      5px !important;

    letter-spacing:
      .2em !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-label b {

    color:
      #b3cbd3 !important;

    font-size:
      7px !important;

    line-height:
      1.35 !important;

    letter-spacing:
      .14em !important;

  }


  /* ============================================================
     CROSSHAIR
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-crosshair {

    width:
      54px !important;

    height:
      54px !important;

    border-color:
      rgba(101,243,255,.09) !important;

    pointer-events:
      none !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-crosshair::before {

    background:
      rgba(101,243,255,.17) !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-crosshair::after {

    background:
      rgba(101,243,255,.17) !important;

  }


  /* ============================================================
     LEVEL ROUTE TAG
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-tag {

    left:
      18px !important;

    bottom:
      18px !important;

    min-height:
      28px;

    max-width:
      min(280px, 50vw);

    padding:
      7px 11px !important;

    border:
      1px solid
      rgba(101,243,255,.25) !important;

    background:
      rgba(2,10,16,.9) !important;

    color:
      var(--elite-cyan) !important;

    font-size:
      6px !important;

    line-height:
      1.25 !important;

    letter-spacing:
      .18em !important;

    white-space:
      nowrap;

    overflow:
      hidden;

    text-overflow:
      ellipsis;

    box-shadow:
      0 8px 25px rgba(0,0,0,.4),
      inset 0 0 15px rgba(101,243,255,.025);

    backdrop-filter:
      blur(5px);

  }


  #relayGameplayIntroFinalV3 .relay-v4-tag-dot {

    flex:
      0 0 auto;

    background:
      var(--elite-cyan) !important;

    box-shadow:
      0 0 7px var(--elite-cyan),
      0 0 14px rgba(101,243,255,.6) !important;

    animation:
      relayTagPulse
      1.4s
      ease-in-out
      infinite;
  }


  @keyframes relayTagPulse {

    0%,
    100% {
      opacity: .55;
    }

    50% {
      opacity: 1;
    }

  }


  /* ============================================================
     MAP FOOTER
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-footer {

    background:
      #02090f !important;

    border-top:
      1px solid
      rgba(101,243,255,.04);

    overflow:
      hidden;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-footer > div {

    min-width:
      0;

    overflow:
      hidden;

    border-right:
      1px solid
      rgba(101,243,255,.08) !important;

    position:
      relative;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-footer > div::before {

    content: "";

    position: absolute;

    top: 0;
    left: 20%;
    right: 20%;

    height: 1px;

    background:
      var(--elite-cyan);

    opacity:
      .12;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-footer span,
  #relayGameplayIntroFinalV3 .relay-v4-map-footer b {

    display:
      block;

    overflow:
      hidden;

    text-overflow:
      ellipsis;

    white-space:
      nowrap;
  }


  #relayGameplayIntroFinalV3 .relay-v4-map-footer span {

    color:
      #4c6775 !important;

    font-size:
      5px !important;

    letter-spacing:
      .19em !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-footer b {

    color:
      #a8c0c8 !important;

    font-size:
      6px !important;

    line-height:
      1.35 !important;

    letter-spacing:
      .12em !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-footer b.danger {

    color:
      var(--elite-red) !important;

    text-shadow:
      0 0 8px rgba(255,83,102,.25);

  }


  /* ============================================================
     BOTTOM OBJECTIVE PANEL
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-footer {

    min-height:
      82px !important;

    padding:
      14px 24px !important;

    gap:
      15px;

    background:

      linear-gradient(
        90deg,
        rgba(5,15,23,.99),
        rgba(2,8,13,.99)
      ) !important;

    border-top:
      1px solid
      rgba(101,243,255,.15) !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-objective {

    position:
      relative;

    min-width:
      0;

    padding-left:
      12px;

    overflow:
      hidden;

  }


  #relayGameplayIntroFinalV3 .relay-v4-objective::before {

    content: "";

    position: absolute;

    left: 0;
    top: 2px;
    bottom: 2px;

    width:
      2px;

    background:
      var(--elite-yellow);

    box-shadow:
      0 0 9px rgba(255,209,102,.45);

  }


  #relayGameplayIntroFinalV3 .relay-v4-objective-label {

    color:
      var(--elite-yellow) !important;

    font-size:
      6px !important;

    line-height:
      1.3;

    letter-spacing:
      .2em !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-objective-text {

    color:
      #e7f5f8 !important;

    font-size:
      clamp(8px,1vw,11px) !important;

    font-weight:
      800 !important;

    line-height:
      1.35 !important;

    letter-spacing:
      .055em !important;

    overflow:
      hidden;

    text-overflow:
      ellipsis;

    white-space:
      nowrap;

  }


  /* ============================================================
     DEPLOYMENT READY
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-footer-status {

    flex:
      0 0 auto;

    min-height:
      28px;

    max-width:
      230px;

    padding:
      0 12px;

    border:
      1px solid
      rgba(140,255,154,.12);

    background:
      rgba(140,255,154,.025);

    color:
      #71917b !important;

    font-size:
      6px !important;

    line-height:
      1 !important;

    letter-spacing:
      .18em !important;

    white-space:
      nowrap;

    overflow:
      hidden;

    text-overflow:
      ellipsis;

    box-shadow:
      inset 0 0 14px rgba(140,255,154,.018);
  }


  #relayGameplayIntroFinalV3 .relay-v4-status-icon {

    flex:
      0 0 auto;

    width:
      7px !important;

    height:
      7px !important;

    background:
      var(--elite-green) !important;

    box-shadow:
      0 0 8px var(--elite-green),
      0 0 15px rgba(140,255,154,.45) !important;

    animation:
      relayStatusPulse
      1.8s
      ease-in-out
      infinite;
  }


  @keyframes relayStatusPulse {

    0%,
    100% {
      opacity: .55;
    }

    50% {
      opacity: 1;
    }

  }


  /* ============================================================
     OPEN ANIMATION
     ============================================================ */

  #relayGameplayIntroFinalV3.relay-v4-opening
  .relay-v4-shell {

    animation:
      relayEliteOpen
      .48s
      cubic-bezier(.16,.82,.22,1)
      both !important;

  }


  @keyframes relayEliteOpen {

    0% {

      opacity:
        0;

      transform:
        translateY(20px)
        scale(.975);

      filter:
        brightness(.4)
        blur(7px);

    }

    55% {

      filter:
        brightness(1.18)
        blur(1px);

    }

    100% {

      opacity:
        1;

      transform:
        translateY(0)
        scale(1);

      filter:
        brightness(1)
        blur(0);

    }

  }


  /* ============================================================
     TABLET / MOBILE
     ============================================================ */

  @media (max-width: 820px) {

    #relayGameplayIntroFinalV3 {

      padding:
        5px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-shell {

      width:
        99vw !important;

      height:
        97dvh !important;

      min-height:
        0 !important;

      border-radius:
        8px !important;

      clip-path:
        none !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-header {

      min-height:
        82px !important;

      padding:
        12px 14px !important;

      gap:
        10px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-header::after {

      left:
        14px;

      right:
        14px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-header-right {

      gap:
        9px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-readout {

      min-width:
        78px !important;

      padding:
        8px 9px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-readout-label {

      font-size:
        5px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-readout b {

      font-size:
        7px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-title {

      font-size:
        clamp(21px,7vw,30px) !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-kicker {

      font-size:
        5px !important;

      letter-spacing:
        .19em !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-status-line {

      font-size:
        5px !important;

      gap:
        6px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-meta {

      max-width:
        55vw !important;

      font-size:
        6px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-timer {

      width:
        58px !important;

      height:
        58px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-timer strong {

      font-size:
        20px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-frame {

      grid-template-rows:
        35px
        1fr
        35px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-toolbar {

      padding:
        0 9px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-chip {

      min-height:
        19px;

      padding:
        3px 7px !important;

      font-size:
        4px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-coordinates {

      max-width:
        38%;

      font-size:
        5px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-label-top {

      left:
        10px !important;

      top:
        10px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-label-bottom {

      right:
        10px !important;

      bottom:
        10px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-label {

      max-width:
        42vw;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-tag {

      left:
        9px !important;

      bottom:
        9px !important;

      max-width:
        48vw;

      padding:
        6px 8px !important;

      font-size:
        5px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-footer {

      min-height:
        62px !important;

      padding:
        9px 12px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-objective {

      padding-left:
        9px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-objective-text {

      max-width:
        76vw !important;

      font-size:
        7px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-footer-status {

      display:
        none !important;

    }

  }


  /* ============================================================
     SMALL PHONE
     ============================================================ */

  @media (max-width: 520px) {

    #relayGameplayIntroFinalV3 {

      padding:
        0 !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-shell {

      width:
        100vw !important;

      height:
        100dvh !important;

      border-radius:
        0 !important;

      border-left:
        0 !important;

      border-right:
        0 !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-header {

      min-height:
        70px !important;

      padding:
        9px 10px !important;

      gap:
        6px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-header-right {

      gap:
        5px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-readout {

      display:
        none !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-title {

      font-size:
        19px !important;

      letter-spacing:
        .055em !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-kicker {

      margin-bottom:
        4px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-meta {

      margin-top:
        4px !important;

      max-width:
        57vw !important;

      font-size:
        5px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-timer {

      width:
        50px !important;

      height:
        50px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-timer strong {

      font-size:
        18px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-timer > span {

      bottom:
        2px !important;

      font-size:
        4px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-frame {

      grid-template-rows:
        31px
        1fr
        31px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-chip:nth-child(2) {

      display:
        none !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-coordinates {

      max-width:
        46%;

      font-size:
        4px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-label {

      padding:
        5px 7px;

      max-width:
        44vw;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-label span {

      font-size:
        4px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-label b {

      font-size:
        5px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-corners {

      inset:
        7px !important;

    }


    #relayGameplayIntroFinalV3 .corner {

      width:
        24px !important;

      height:
        24px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-crosshair {

      width:
        40px !important;

      height:
        40px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-tag {

      bottom:
        7px !important;

      left:
        7px !important;

      max-width:
        52vw;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-footer span {

      font-size:
        3.5px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-footer b {

      font-size:
        4.5px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-footer {

      min-height:
        54px !important;

      padding:
        7px 10px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-objective-label {

      font-size:
        4.5px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-objective-text {

      max-width:
        90vw !important;

      font-size:
        6px !important;

    }

  }


  /* ============================================================
     VERY SMALL PHONES
     ============================================================ */

  @media (max-width: 380px) {

    #relayGameplayIntroFinalV3 .relay-v4-header {

      min-height:
        64px !important;

      padding:
        7px 8px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-title {

      font-size:
        17px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-timer {

      width:
        44px !important;

      height:
        44px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-timer strong {

      font-size:
        15px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-frame {

      grid-template-rows:
        29px
        1fr
        29px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-footer {

      min-height:
        50px !important;

      padding:
        6px 8px !important;

    }

  }


  /* ============================================================
     LANDSCAPE MOBILE
     ============================================================ */

  @media (
    max-height: 600px
  ) and (
    orientation: landscape
  ) {

    #relayGameplayIntroFinalV3 .relay-v4-header {

      min-height:
        58px !important;

      padding:
        7px 13px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-title {

      font-size:
        20px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-frame {

      grid-template-rows:
        27px
        1fr
        27px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-footer {

      min-height:
        42px !important;

      padding:
        5px 12px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-objective-text {

      font-size:
        6px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-footer-status {

      display:
        none !important;

    }

  }


  /* ============================================================
     TOUCH / PERFORMANCE
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-wrap,
  #relayGameplayIntroFinalV3 .relay-v4-shell {

    transform:
      translateZ(0);

    backface-visibility:
      hidden;

    -webkit-backface-visibility:
      hidden;
  }


  #relayGameplayIntroFinalV3 .relay-v4-map-noise,
  #relayGameplayIntroFinalV3 .relay-v4-map-vignette,
  #relayGameplayIntroFinalV3 .relay-v4-map-scan,
  #relayGameplayIntroFinalV3 .relay-v4-map-corners {

    user-select:
      none;

    -webkit-user-select:
      none;
  }


  /* ============================================================
     NO TEXT SELECTION DURING HUD
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-shell {

    user-select:
      none;

    -webkit-user-select:
      none;
  }


  /* ============================================================
     REDUCED MOTION
     ============================================================ */

  @media (prefers-reduced-motion: reduce) {

    #relayGameplayIntroFinalV3 *,
    #relayGameplayIntroFinalV3 *::before,
    #relayGameplayIntroFinalV3 *::after {

      animation:
        none !important;

      transition:
        none !important;

    }

  }


  /* ============================================================
     SAFE AREA — MOBILE
     ============================================================ */

  @supports (padding: env(safe-area-inset-bottom)) {

    @media (max-width: 820px) {

      #relayGameplayIntroFinalV3 {

        padding-bottom:
          max(
            5px,
            env(safe-area-inset-bottom)
          ) !important;

      }

    }

  }

  `;

  document.head.appendChild(style);

})();

(() => {
  'use strict';

  /* ============================================================
   * RELAY RUNNER
   * ELITE HUD DESIGN OVERRIDE — V2
   *
   * COPY-PASTE BELOW V1
   * DESIGN ONLY
   * - Does NOT replace Phaser
   * - Does NOT create another map
   * - Does NOT modify mission logic
   * - Does NOT modify renderMap()
   * ============================================================ */

  const STYLE_ID = 'relay-elite-route-design-v2';

  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;

  style.textContent = `

  /* ============================================================
     ELITE V2 VARIABLES
     ============================================================ */

  #relayGameplayIntroFinalV3 {

    --v2-cyan: #65f3ff;
    --v2-cyan-soft: rgba(101,243,255,.16);

    --v2-blue: #438cff;
    --v2-yellow: #ffd166;
    --v2-green: #8cff9a;
    --v2-red: #ff5366;

    --v2-white: #effcff;
    --v2-muted: #6b8996;

  }


  /* ============================================================
     GLOBAL HUD ENERGY
     ============================================================ */

  #relayGameplayIntroFinalV3 {

    isolation: isolate;

  }


  #relayGameplayIntroFinalV3::before {

    content: "";

    position: absolute;

    inset: 0;

    pointer-events: none;

    z-index: 0;

    background:

      radial-gradient(
        circle at 50% 0%,
        rgba(101,243,255,.08),
        transparent 30%
      ),

      radial-gradient(
        circle at 100% 100%,
        rgba(67,140,255,.045),
        transparent 35%
      );

    animation:
      relayV2Atmosphere
      8s ease-in-out infinite alternate;

  }


  @keyframes relayV2Atmosphere {

    from {
      opacity: .55;
    }

    to {
      opacity: 1;
    }

  }


  /* ============================================================
     SHELL — EXTRA DEPTH
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-shell {

    position: relative;

    overflow: hidden;

    box-shadow:

      0 35px 100px rgba(0,0,0,.95),

      0 0 0 1px rgba(101,243,255,.035),

      0 0 90px rgba(101,243,255,.045),

      inset 0 1px rgba(255,255,255,.06),

      inset 0 -30px 80px rgba(0,0,0,.28) !important;

  }


  /* ============================================================
     SHELL SCANLINES
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-shell::before {

    content: "";

    position: absolute;

    inset: 0;

    pointer-events: none;

    z-index: 50;

    opacity: .045;

    background:

      repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 3px,
        rgba(101,243,255,.12) 4px
      );

    mix-blend-mode: screen;

  }


  /* ============================================================
     MOVING TOP ENERGY LINE
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-topline {

    position: relative;

    overflow: hidden;

  }


  #relayGameplayIntroFinalV3 .relay-v4-topline::after {

    content: "";

    position: absolute;

    top: 0;

    bottom: 0;

    width: 180px;

    left: -200px;

    background:

      linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,.85),
        transparent
      );

    filter:
      blur(2px);

    animation:
      relayV2Scanner
      3.8s
      linear
      infinite;

  }


  @keyframes relayV2Scanner {

    0% {
      left: -220px;
    }

    100% {
      left: 110%;
    }

  }


  /* ============================================================
     HEADER — PREMIUM SEPARATION
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-header {

    position: relative;

    overflow: hidden;

  }


  #relayGameplayIntroFinalV3 .relay-v4-header::before {

    content: "";

    position: absolute;

    top: 0;

    left: 0;

    width: 170px;

    height: 100%;

    pointer-events: none;

    background:

      linear-gradient(
        90deg,
        rgba(101,243,255,.045),
        transparent
      );

  }


  /* ============================================================
     TITLE GLOW
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-title {

    position: relative;

    text-shadow:

      0 0 8px rgba(101,243,255,.08),

      0 0 22px rgba(101,243,255,.12),

      0 2px 0 rgba(0,0,0,.9) !important;

  }


  #relayGameplayIntroFinalV3 .relay-v4-title::after {

    content: "";

    display: block;

    width: 42px;

    height: 2px;

    margin-top: 7px;

    background:

      linear-gradient(
        90deg,
        var(--v2-cyan),
        transparent
      );

    box-shadow:
      0 0 10px rgba(101,243,255,.45);

  }


  /* ============================================================
     LIVE STATUS
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-live-dot {

    position: relative;

    animation:
      relayV2LivePulse
      1.5s
      ease-in-out
      infinite;

  }


  @keyframes relayV2LivePulse {

    0%,
    100% {
      opacity: .65;
      transform: scale(.85);
    }

    50% {
      opacity: 1;
      transform: scale(1.15);
    }

  }


  /* ============================================================
     READOUT CARDS
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-readout {

    position: relative;

    overflow: hidden;

    transition:
      border-color .2s ease,
      background .2s ease,
      transform .2s ease;

  }


  #relayGameplayIntroFinalV3 .relay-v4-readout::before {

    content: "";

    position: absolute;

    top: 0;

    left: -100%;

    width: 60%;

    height: 100%;

    background:

      linear-gradient(
        90deg,
        transparent,
        rgba(101,243,255,.08),
        transparent
      );

    animation:
      relayV2ReadoutScan
      5s
      linear
      infinite;

  }


  @keyframes relayV2ReadoutScan {

    0% {
      left: -100%;
    }

    30%,
    100% {
      left: 160%;
    }

  }


  /* ============================================================
     TIMER — COMBAT CORE
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-timer {

    position: relative;

  }


  #relayGameplayIntroFinalV3 .relay-v4-timer::before {

    content: "";

    position: absolute;

    inset: -5px;

    border-radius: 50%;

    border:
      1px solid rgba(255,209,102,.08);

    box-shadow:
      0 0 20px rgba(255,209,102,.04);

    animation:
      relayV2TimerPulse
      2s
      ease-in-out
      infinite;

  }


  @keyframes relayV2TimerPulse {

    0%,
    100% {
      opacity: .35;
      transform: scale(.96);
    }

    50% {
      opacity: .9;
      transform: scale(1.04);
    }

  }


  /* ============================================================
     MAP FRAME — COMMAND CENTER
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-frame {

    position: relative;

    overflow: hidden;

    box-shadow:

      inset 0 0 0 1px rgba(101,243,255,.025),

      inset 0 0 100px rgba(0,0,0,.55);

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-frame::before {

    content: "";

    position: absolute;

    inset: 0;

    pointer-events: none;

    z-index: 20;

    border:

      1px solid rgba(101,243,255,.055);

  }


  /* ============================================================
     MAP TOOLBAR — ACTIVE CONSOLE
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-toolbar {

    position: relative;

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-toolbar::after {

    content: "";

    position: absolute;

    left: 0;

    bottom: 0;

    width: 22%;

    height: 1px;

    background:
      var(--v2-cyan);

    box-shadow:
      0 0 8px rgba(101,243,255,.5);

    opacity: .55;

  }


  /* ============================================================
     CHIPS — GAME BUTTON FEEL
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-chip {

    position: relative;

    overflow: hidden;

    cursor: default;

    transition:

      color .18s ease,
      border-color .18s ease,
      background .18s ease,
      box-shadow .18s ease,
      transform .18s ease;

  }


  #relayGameplayIntroFinalV3 .relay-v4-chip::before {

    content: "";

    position: absolute;

    inset: 0;

    background:
      linear-gradient(
        120deg,
        transparent 35%,
        rgba(101,243,255,.12),
        transparent 65%
      );

    transform:
      translateX(-120%);

    transition:
      transform .35s ease;

  }


  #relayGameplayIntroFinalV3 .relay-v4-chip:hover::before {

    transform:
      translateX(120%);

  }


  #relayGameplayIntroFinalV3 .relay-v4-chip.active {

    box-shadow:

      0 0 14px rgba(101,243,255,.08),

      inset 0 0 14px rgba(101,243,255,.045);

  }


  /* ============================================================
     MAP ROUTE — ENERGY FLOW
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .route {

    stroke-linecap: round;

    stroke-linejoin: round;

    animation:
      relayV2RouteGlow
      2.2s
      ease-in-out
      infinite alternate;

  }


  @keyframes relayV2RouteGlow {

    from {
      opacity: .72;
    }

    to {
      opacity: 1;
    }

  }


  /* ============================================================
     PLAYER MARKER — TARGET LOCK
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .marker-player {

    animation:
      relayV2PlayerPulse
      1.7s
      ease-in-out
      infinite;

  }


  @keyframes relayV2PlayerPulse {

    0%,
    100% {
      opacity: .82;
    }

    50% {
      opacity: 1;
    }

  }


  #relayGameplayIntroFinalV3 .map-briefing-map .player-ring {

    transform-box:
      fill-box;

    transform-origin:
      center;

    animation:
      relayV2PlayerRing
      2s
      ease-out
      infinite;

  }


  @keyframes relayV2PlayerRing {

    0% {
      transform: scale(.75);
      opacity: .8;
    }

    100% {
      transform: scale(1.45);
      opacity: 0;
    }

  }


  /* ============================================================
     CHECKPOINT PULSE
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .checkpoint-ring {

    transform-box:
      fill-box;

    transform-origin:
      center;

    animation:
      relayV2Checkpoint
      2.4s
      ease-in-out
      infinite;

  }


  @keyframes relayV2Checkpoint {

    0%,
    100% {
      opacity: .4;
    }

    50% {
      opacity: 1;
    }

  }


  /* ============================================================
     DANGER — RED WARNING
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .danger,
  #relayGameplayIntroFinalV3 .map-briefing-map .enemy {

    animation:
      relayV2Danger
      1.35s
      ease-in-out
      infinite;

  }


  @keyframes relayV2Danger {

    0%,
    100% {
      opacity: .65;
    }

    50% {
      opacity: 1;
    }

  }


  /* ============================================================
     BOOST — ENERGY PULSE
     ============================================================ */

  #relayGameplayIntroFinalV3 .map-briefing-map .boost {

    animation:
      relayV2Boost
      1.8s
      ease-in-out
      infinite;

  }


  @keyframes relayV2Boost {

    0%,
    100% {
      opacity: .72;
    }

    50% {
      opacity: 1;
    }

  }


  /* ============================================================
     MAP SCAN
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-scan {

    pointer-events: none;

    animation:
      relayV2MapScan
      5s
      linear
      infinite;

  }


  @keyframes relayV2MapScan {

    0% {
      transform:
        translateY(-120px);
      opacity: 0;
    }

    15% {
      opacity: .55;
    }

    70% {
      opacity: .3;
    }

    100% {
      transform:
        translateY(520px);
      opacity: 0;
    }

  }


  /* ============================================================
     CORNERS — TACTICAL BRACKETS
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-corners {

    pointer-events: none;

  }


  #relayGameplayIntroFinalV3 .corner {

    transition:
      width .25s ease,
      height .25s ease,
      opacity .25s ease;

  }


  /* ============================================================
     MAP TAG
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-map-tag {

    position: relative;

    overflow: hidden;

    backdrop-filter:
      blur(8px);

  }


  #relayGameplayIntroFinalV3 .relay-v4-map-tag::after {

    content: "";

    position: absolute;

    top: 0;

    left: -100%;

    width: 70%;

    height: 100%;

    background:

      linear-gradient(
        90deg,
        transparent,
        rgba(101,243,255,.14),
        transparent
      );

    animation:
      relayV2TagScan
      4s
      linear
      infinite;

  }


  @keyframes relayV2TagScan {

    0%,
    35% {
      left: -100%;
    }

    70%,
    100% {
      left: 150%;
    }

  }


  /* ============================================================
     FOOTER — MISSION COMMAND
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-footer {

    position: relative;

    overflow: hidden;

  }


  #relayGameplayIntroFinalV3 .relay-v4-footer::before {

    content: "";

    position: absolute;

    left: 0;

    top: 0;

    width: 28%;

    height: 1px;

    background:
      linear-gradient(
        90deg,
        var(--v2-yellow),
        transparent
      );

    box-shadow:
      0 0 9px rgba(255,209,102,.3);

  }


  /* ============================================================
     OBJECTIVE TEXT
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-objective-text {

    text-shadow:
      0 1px 0 rgba(0,0,0,.9);

  }


  #relayGameplayIntroFinalV3 .relay-v4-objective-label {

    display:
      inline-flex;

    align-items:
      center;

    gap:
      7px;

  }


  #relayGameplayIntroFinalV3 .relay-v4-objective-label::before {

    content: "";

    width: 5px;

    height: 5px;

    background:
      var(--v2-yellow);

    box-shadow:
      0 0 7px rgba(255,209,102,.65);

    animation:
      relayV2Objective
      1.3s
      ease-in-out
      infinite;

  }


  @keyframes relayV2Objective {

    0%,
    100% {
      opacity: .5;
    }

    50% {
      opacity: 1;
    }

  }


  /* ============================================================
     READY STATUS
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-footer-status {

    position: relative;

    overflow: hidden;

    transition:
      border-color .2s ease,
      box-shadow .2s ease;

  }


  #relayGameplayIntroFinalV3 .relay-v4-footer-status::after {

    content: "";

    position: absolute;

    inset: 0;

    background:

      linear-gradient(
        90deg,
        transparent,
        rgba(140,255,154,.08),
        transparent
      );

    transform:
      translateX(-100%);

    animation:
      relayV2ReadyScan
      3.5s
      linear
      infinite;

  }


  @keyframes relayV2ReadyScan {

    0% {
      transform:
        translateX(-100%);
    }

    55%,
    100% {
      transform:
        translateX(100%);
    }

  }


  #relayGameplayIntroFinalV3 .relay-v4-status-icon {

    animation:
      relayV2ReadyPulse
      1.6s
      ease-in-out
      infinite;

  }


  @keyframes relayV2ReadyPulse {

    0%,
    100% {
      transform: scale(.8);
      opacity: .65;
    }

    50% {
      transform: scale(1.1);
      opacity: 1;
    }

  }


  /* ============================================================
     TOUCH FEEDBACK
     ============================================================ */

  @media (hover: none) {

    #relayGameplayIntroFinalV3 .relay-v4-chip:active {

      transform:
        scale(.96);

      border-color:
        rgba(101,243,255,.5) !important;

      box-shadow:
        0 0 18px rgba(101,243,255,.12);

    }

  }


  /* ============================================================
     MOBILE — REMOVE VISUAL OVERLOAD
     ============================================================ */

  @media (max-width: 820px) {

    #relayGameplayIntroFinalV3 .relay-v4-shell::before {

      opacity:
        .025;

    }


    #relayGameplayIntroFinalV3 .relay-v4-title::after {

      width:
        28px;

      margin-top:
        5px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-readout {

      min-width:
        92px !important;

      padding:
        7px 9px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-scan {

      animation-duration:
        6s;

    }


    #relayGameplayIntroFinalV3 .relay-v4-footer-status {

      backdrop-filter:
        none;

    }

  }


  /* ============================================================
     SMALL PHONE — CLEAN HUD
     ============================================================ */

  @media (max-width: 520px) {

    #relayGameplayIntroFinalV3 .relay-v4-header {

      overflow:
        hidden;

    }


    #relayGameplayIntroFinalV3 .relay-v4-title::after {

      width:
        22px;

      height:
        1px;

    }


    #relayGameplayIntroFinalV3 .relay-v4-readout {

      min-width:
        76px !important;

      padding:
        5px 7px !important;

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-frame::before {

      border-color:
        rgba(101,243,255,.035);

    }


    #relayGameplayIntroFinalV3 .relay-v4-map-tag {

      backdrop-filter:
        blur(5px);

    }

  }


  /* ============================================================
     LANDSCAPE — KEEP MAP DOMINANT
     ============================================================ */

  @media (
    max-height: 600px
  ) and (
    orientation: landscape
  ) {

    #relayGameplayIntroFinalV3 .relay-v4-header {

      overflow:
        hidden;

    }


    #relayGameplayIntroFinalV3 .relay-v4-title::after {

      display:
        none;

    }


    #relayGameplayIntroFinalV3 .relay-v4-shell::before {

      opacity:
        .018;

    }

  }


  /* ============================================================
     ACCESSIBILITY / PERFORMANCE
     ============================================================ */

  @media (prefers-reduced-motion: reduce) {

    #relayGameplayIntroFinalV3::before,
    #relayGameplayIntroFinalV3 *,
    #relayGameplayIntroFinalV3 *::before,
    #relayGameplayIntroFinalV3 *::after {

      animation:
        none !important;

    }

  }


  /* ============================================================
     GPU COMPOSITING
     ============================================================ */

  #relayGameplayIntroFinalV3 .relay-v4-shell,
  #relayGameplayIntroFinalV3 .relay-v4-map-wrap,
  #relayGameplayIntroFinalV3 .relay-v4-timer,
  #relayGameplayIntroFinalV3 .relay-v4-map-scan {

    will-change:
      transform;

  }

  `;

  document.head.appendChild(style);

})();
