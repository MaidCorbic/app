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

    #${ROOT_ID} {
      --cyan:#65e8ff;
      --yellow:#ffd76a;
      --green:#8df59b;
      --red:#ff6877;
      --white:#eefcff;
      --muted:#647e8b;

      position:fixed !important;
      inset:0 !important;
      z-index:2147483647 !important;

      display:grid !important;
      place-items:center !important;

      padding:12px !important;
      box-sizing:border-box;

      overflow:hidden;

      background:
        radial-gradient(
          circle at 50% 45%,
          rgba(35,150,180,.13),
          transparent 42%
        ),
        #020609;

      color:var(--white);

      font-family:
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      isolation:isolate;
    }

    #${ROOT_ID}[hidden] {
      display:none !important;
    }

    #${ROOT_ID} .rv5-bg {
      position:absolute;
      inset:0;
      pointer-events:none;

      background:
        linear-gradient(
          90deg,
          rgba(0,0,0,.4),
          transparent 30%,
          transparent 70%,
          rgba(0,0,0,.4)
        );
    }

    #${ROOT_ID} .rv5-bg::before {
      content:"";
      position:absolute;
      inset:0;

      background-image:
        linear-gradient(
          rgba(101,232,255,.025) 1px,
          transparent 1px
        ),
        linear-gradient(
          90deg,
          rgba(101,232,255,.025) 1px,
          transparent 1px
        );

      background-size:40px 40px;
    }

    #${ROOT_ID} .rv5-noise {
      position:absolute;
      inset:0;
      opacity:.035;
      pointer-events:none;

      background-image:
        radial-gradient(
          white .5px,
          transparent .5px
        );

      background-size:4px 4px;
    }

    #${ROOT_ID} .rv5-shell {
      position:relative;

      width:min(1320px,97vw);
      height:min(900px,94dvh);

      min-height:520px;

      display:grid;
      grid-template-rows:auto minmax(0,1fr) auto;

      overflow:hidden;

      background:
        linear-gradient(
          145deg,
          rgba(7,20,29,.99),
          rgba(2,7,11,.99)
        );

      border:1px solid rgba(101,232,255,.2);

      box-shadow:
        0 35px 120px rgba(0,0,0,.85),
        0 0 100px rgba(40,180,215,.08),
        inset 0 1px rgba(255,255,255,.05);

      border-radius:10px;
    }

    #${ROOT_ID} .rv5-topline {
      position:absolute;
      top:0;
      left:0;
      right:0;
      height:3px;

      display:flex;
      z-index:20;
    }

    #${ROOT_ID} .rv5-topline i {
      flex:1;
      background:rgba(101,232,255,.2);
    }

    #${ROOT_ID} .rv5-topline i:first-child,
    #${ROOT_ID} .rv5-topline i:last-child {
      background:var(--yellow);
    }

    #${ROOT_ID} .rv5-topline i:nth-child(3) {
      background:var(--cyan);
    }

    #${ROOT_ID} .rv5-header {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:20px;

      padding:20px 24px;

      border-bottom:1px solid rgba(101,232,255,.1);
    }

    #${ROOT_ID} .rv5-live {
      display:flex;
      align-items:center;
      gap:7px;

      margin-bottom:8px;

      color:#607984;
      font-size:7px;
      font-weight:900;
      letter-spacing:.18em;
    }

    #${ROOT_ID} .rv5-live b {
      width:6px;
      height:6px;
      border-radius:50%;
      background:var(--cyan);

      box-shadow:0 0 12px var(--cyan);

      animation:rv5pulse 1.3s infinite;
    }

    #${ROOT_ID} .rv5-live span {
      color:#78919d;
    }

    @keyframes rv5pulse {
      50% {
        transform:scale(1.35);
        opacity:.55;
      }
    }

    #${ROOT_ID} .rv5-kicker {
      color:var(--yellow);
      font-size:7px;
      font-weight:900;
      letter-spacing:.2em;
      margin-bottom:5px;
    }

    #${ROOT_ID} h1 {
      margin:0;

      font-size:clamp(28px,4vw,50px);
      line-height:.9;
      letter-spacing:.05em;
      font-weight:950;
    }

    #${ROOT_ID} h1 strong {
      color:var(--cyan);
      text-shadow:0 0 20px rgba(101,232,255,.25);
    }

    #${ROOT_ID} .rv5-meta {
      margin-top:8px;

      color:#637d89;
      font-size:7px;
      font-weight:800;
      letter-spacing:.13em;

      max-width:65vw;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }

    #${ROOT_ID} .rv5-right {
      display:flex;
      align-items:center;
      gap:15px;
    }

    #${ROOT_ID} .rv5-status {
      position:relative;

      min-width:110px;
      padding:10px 12px;

      border:1px solid rgba(101,232,255,.1);
      background:rgba(101,232,255,.025);
    }

    #${ROOT_ID} .rv5-status small {
      display:block;
      margin-bottom:5px;

      color:#536c78;
      font-size:6px;
      letter-spacing:.15em;
    }

    #${ROOT_ID} .rv5-status strong {
      color:var(--green);
      font-size:9px;
      letter-spacing:.14em;
    }

    #${ROOT_ID} .rv5-status i {
      position:absolute;
      right:9px;
      bottom:9px;

      width:5px;
      height:5px;
      border-radius:50%;

      background:var(--green);
      box-shadow:0 0 8px var(--green);
    }

    #${ROOT_ID} .rv5-timer {
      position:relative;

      width:72px;
      height:72px;

      display:grid;
      place-items:center;
    }

    #${ROOT_ID} .rv5-timer svg {
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
      transform:rotate(-90deg);
    }

    #${ROOT_ID} .rv5-timer circle {
      fill:none;
      stroke-width:2.5;
    }

    #${ROOT_ID} .timer-track {
      stroke:rgba(255,215,106,.08);
    }

    #${ROOT_ID} .timer-progress {
      stroke:var(--yellow);
      stroke-linecap:round;

      stroke-dasharray:270.18;
      stroke-dashoffset:0;

      filter:
        drop-shadow(
          0 0 6px
          rgba(255,215,106,.7)
        );
    }

    #${ROOT_ID} .rv5-timer strong {
      position:relative;
      z-index:2;

      color:var(--yellow);
      font-size:24px;
    }

    #${ROOT_ID} .rv5-timer small {
      position:absolute;
      bottom:5px;

      color:#637983;
      font-size:5px;
      letter-spacing:.15em;
    }

    #${ROOT_ID} .rv5-main {
      min-height:0;

      display:grid;
      grid-template-rows:38px minmax(0,1fr) 40px;

      overflow:hidden;
    }

    #${ROOT_ID} .rv5-mapbar {
      display:flex;
      align-items:center;
      justify-content:space-between;

      padding:0 15px;

      border-bottom:1px solid rgba(101,232,255,.08);

      background:rgba(1,7,11,.9);
    }

    #${ROOT_ID} .rv5-mapbar > div {
      display:flex;
      gap:6px;
    }

    #${ROOT_ID} .rv5-mapbar span {
      padding:5px 8px;

      color:#506b78;
      font-size:5px;
      font-weight:900;
      letter-spacing:.14em;

      border:1px solid rgba(101,232,255,.07);
    }

    #${ROOT_ID} .rv5-mapbar span.active {
      color:var(--cyan);
      border-color:rgba(101,232,255,.25);
      background:rgba(101,232,255,.04);
    }

    #${ROOT_ID} .rv5-mapbar b {
      color:#4d6672;
      font-size:6px;
      letter-spacing:.14em;
    }

    #${ROOT_ID} .rv5-map{
      position:relative;
      min-height:0;
      overflow:hidden;

      background:
        radial-gradient(
          circle at 50% 48%,
          rgba(101,232,255,.08),
          transparent 52%
        ),
        linear-gradient(
          180deg,
          #061720 0%,
          #020b11 52%,
          #010508 100%
        );

      border-top:1px solid rgba(101,232,255,.18);
      border-bottom:1px solid rgba(101,232,255,.18);

      box-shadow:
        inset 0 0 55px rgba(101,232,255,.045),
        inset 0 0 120px rgba(0,0,0,.36),
        0 0 35px rgba(0,0,0,.25);
    }

    #${ROOT_ID} .rv5-map::after{
      content:"";
      position:absolute;
      inset:12px;
      pointer-events:none;
      z-index:5;

      border:1px solid rgba(255,255,255,.025);

      box-shadow:
        inset 0 0 28px rgba(0,0,0,.22);
    }

    #${ROOT_ID} .rv5-svg{
      position:absolute;
      inset:0;

      width:100%;
      height:100%;

      display:block;

      object-fit:contain;
      object-position:center center;
    }

    #${ROOT_ID} .rv5-scan {
      position:absolute;
      left:0;
      right:0;

      height:100px;

      pointer-events:none;

      background:
        linear-gradient(
          180deg,
          transparent,
          rgba(101,232,255,.05),
          transparent
        );

      animation:
        rv5scan 4s linear infinite;
    }

    @keyframes rv5scan {
      from {
        transform:translateY(-120px);
        opacity:0;
      }

      15% {
        opacity:1;
      }

      to {
        transform:translateY(650px);
        opacity:0;
      }
    }

    #${ROOT_ID} .rv5-vignette {
      position:absolute;
      inset:0;
      pointer-events:none;

      background:
        radial-gradient(
          ellipse at center,
          transparent 55%,
          rgba(0,0,0,.38) 100%
        ),
        linear-gradient(
          90deg,
          rgba(0,0,0,.12),
          transparent 18%,
          transparent 82%,
          rgba(0,0,0,.12)
        );
    }

    #${ROOT_ID} .rv5-corner {
      position:absolute;

      width:30px;
      height:30px;

      border-color:rgba(101,232,255,.3);
      border-style:solid;

      z-index:10;
    }

    #${ROOT_ID} .rv5-corner.tl {
      top:10px;
      left:10px;
      border-width:1px 0 0 1px;
    }

    #${ROOT_ID} .rv5-corner.tr {
      top:10px;
      right:10px;
      border-width:1px 1px 0 0;
    }

    #${ROOT_ID} .rv5-corner.bl {
      bottom:10px;
      left:10px;
      border-width:0 0 1px 1px;
    }

    #${ROOT_ID} .rv5-corner.br {
      bottom:10px;
      right:10px;
      border-width:0 1px 1px 0;
    }

    #${ROOT_ID} .rv5-map-label {
      position:absolute;
      z-index:12;

      display:grid;
      gap:4px;

      pointer-events:none;
    }

    #${ROOT_ID} .rv5-map-label.top {
      top:20px;
      left:24px;
    }

    #${ROOT_ID} .rv5-map-label.bottom {
      right:24px;
      bottom:20px;
      text-align:right;
    }

    #${ROOT_ID} .rv5-map-label small {
      color:#526b78;
      font-size:6px;
      letter-spacing:.16em;
    }

    #${ROOT_ID} .rv5-map-label strong {
      color:#a9c0c9;
      font-size:8px;
      letter-spacing:.1em;
    }

    #${ROOT_ID} .rv5-live-tag {
      position:absolute;

      left:16px;
      bottom:16px;

      z-index:15;

      display:flex;
      align-items:center;
      gap:7px;

      padding:8px 10px;

      color:var(--cyan);

      font-size:6px;
      font-weight:900;
      letter-spacing:.14em;

      border:1px solid rgba(101,232,255,.18);
      background:rgba(2,9,14,.82);
      backdrop-filter:blur(8px);
    }

    #${ROOT_ID} .rv5-live-tag i {
      width:5px;
      height:5px;
      border-radius:50%;

      background:var(--cyan);
      box-shadow:0 0 8px var(--cyan);
    }

    #${ROOT_ID} .rv5-stats {
      display:grid;
      grid-template-columns:repeat(3,1fr);

      background:rgba(1,6,10,.96);

      border-top:1px solid rgba(101,232,255,.07);
    }

    #${ROOT_ID} .rv5-stats div {
      min-width:0;

      display:flex;
      align-items:center;
      justify-content:center;
      flex-direction:column;
      gap:3px;

      border-right:1px solid rgba(101,232,255,.06);
    }

    #${ROOT_ID} .rv5-stats div:last-child {
      border-right:0;
    }

    #${ROOT_ID} .rv5-stats small {
      color:#465e69;
      font-size:5px;
      letter-spacing:.15em;
    }

    #${ROOT_ID} .rv5-stats strong {
      color:#a5bbc3;
      font-size:6px;
      letter-spacing:.1em;
    }

    #${ROOT_ID} .rv5-stats .danger {
      color:var(--red);
    }

    #${ROOT_ID} .rv5-footer {
      min-height:72px;

      display:flex;
      align-items:center;
      justify-content:space-between;

      gap:15px;

      padding:10px 20px;

      border-top:1px solid rgba(101,232,255,.1);

      background:rgba(1,6,10,.98);
    }

    #${ROOT_ID} .rv5-objective{
      display:flex;
      align-items:center;
      gap:14px;

      min-width:0;

      padding:9px 13px;

      border:1px solid rgba(101,232,255,.12);

      background:
        linear-gradient(
          135deg,
          rgba(101,232,255,.055),
          rgba(101,232,255,.012)
        );

      box-shadow:
        inset 0 0 20px rgba(101,232,255,.025);
    }

    #${ROOT_ID} .rv5-objective-icon {
      width:32px;
      height:32px;

      flex:0 0 auto;

      display:grid;
      place-items:center;

      color:var(--yellow);

      border:1px solid rgba(255,215,106,.25);
      background:rgba(255,215,106,.04);

      transform:rotate(45deg);
    }

    #${ROOT_ID} .rv5-objective-icon::first-letter {
      transform:rotate(-45deg);
    }

    #${ROOT_ID} .rv5-objective small {
      display:block;

      margin-bottom:4px;

      color:var(--yellow);

      font-size:6px;
      font-weight:900;
      letter-spacing:.16em;
    }

    #${ROOT_ID} .objective-text {
      display:block;

      max-width:65vw;

      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;

      color:#dcecef;

      font-size:9px;
      letter-spacing:.04em;
    }

    #${ROOT_ID} .rv5-ready {
      display:flex;
      align-items:center;
      gap:8px;

      color:#6d858f;

      font-size:6px;
      font-weight:900;
      letter-spacing:.14em;
      white-space:nowrap;
    }

    #${ROOT_ID} .rv5-ready i {
      width:7px;
      height:7px;
      border-radius:50%;

      background:var(--green);
      box-shadow:0 0 10px var(--green);
    }

    #${ROOT_ID} .rv5-svg text{
      pointer-events:none;
      user-select:none;
    }

    /* SVG */

    #${ROOT_ID} .grid {
      stroke:#123044;
      stroke-width:1;
      opacity:.5;
    }

    #${ROOT_ID} .grid-major {
      stroke:#1c465b;
      stroke-width:1.4;
      opacity:.4;
    }

    #${ROOT_ID} .platform{
      fill:#0d2837;
      stroke:#5c899b;
      stroke-width:1.25;
      filter:drop-shadow(0 0 4px rgba(77,210,235,.08));
    }

    #${ROOT_ID} .edge {
      stroke:var(--cyan);
      opacity:.3;
    }

    #${ROOT_ID} .route-halo{
      fill:none;
      stroke:#61e8ff;
      stroke-width:26;
      opacity:.14;

      filter:
        drop-shadow(
          0 0 10px
          rgba(101,232,255,.30)
        );
    }

    #${ROOT_ID} .route{
      fill:none;

      stroke:#6cf1ff;
      stroke-width:5;
      stroke-linecap:round;
      stroke-linejoin:round;

      stroke-dasharray:16 10;

      animation:
        rv5route 1.05s linear infinite;

      filter:
        drop-shadow(
          0 0 5px
          rgba(101,232,255,.95)
        )
        drop-shadow(
          0 0 14px
          rgba(101,232,255,.40)
        );
    }

    @keyframes rv5route {
      to {
        stroke-dashoffset:-38;
      }
    }

    #${ROOT_ID} .route-core{
      fill:none;

      stroke:#f4fdff;
      stroke-width:1.3;
      opacity:.86;
    }

    /* MAP MARKERS */

    #${ROOT_ID} .start{
      fill:#8df59b;

      stroke:#f4ffe7;
      stroke-width:3;

      filter:
        drop-shadow(
          0 0 6px
          rgba(141,245,155,.95)
        )
        drop-shadow(
          0 0 16px
          rgba(141,245,155,.38)
        );

      transform-box:fill-box;
      transform-origin:center;
    }

    #${ROOT_ID} .goal{
      fill:#ffd76a;

      stroke:#fff8ce;
      stroke-width:3;

      filter:
        drop-shadow(
          0 0 8px
          rgba(255,215,106,.95)
        )
        drop-shadow(
          0 0 20px
          rgba(255,215,106,.42)
        );

      transform-box:fill-box;
      transform-origin:center;
    }

    #${ROOT_ID} .player{
      fill:#ffffff;
      stroke:#64ebff;
      stroke-width:3;

      filter:
        drop-shadow(
          0 0 5px
          rgba(100,235,255,.8)
        )
        drop-shadow(
          0 0 13px
          rgba(100,235,255,.28)
        );
    }

    #${ROOT_ID} .player-ring{
      fill:none;

      stroke:#6ff3ff;
      stroke-width:2.8;

      stroke-dasharray:7 5;

      opacity:1;

      filter:
        drop-shadow(
          0 0 5px
          rgba(100,235,255,.9)
        )
        drop-shadow(
          0 0 15px
          rgba(100,235,255,.32)
        );

      animation:
        rv5ring 1.35s linear infinite;
    }

    @keyframes rv5ring {
      to {
        transform:rotate(360deg);
      }
    }

    #${ROOT_ID} .checkpoint{
      fill:rgba(100,235,255,.035);

      stroke:#64ebff;
      stroke-width:2;

      filter:
        drop-shadow(
          0 0 5px
          rgba(100,235,255,.35)
        );
    }

    #${ROOT_ID} .checkpoint-dot{
      fill:#ffffff;

      filter:
        drop-shadow(
          0 0 5px
          rgba(100,235,255,.80)
        );
    }

    #${ROOT_ID} .danger-object{
      fill:#3a1725;

      stroke:#ff6577;
      stroke-width:2;

      filter:
        drop-shadow(
          0 0 5px
          rgba(255,104,119,.32)
        );
    }

    #${ROOT_ID} .signal{
      fill:#ffd76a;

      filter:
        drop-shadow(
          0 0 6px
          rgba(255,215,106,.55)
        );
    }

    /* MAP TEXT */

    #${ROOT_ID} .label{
      fill:#e9fbff;

      font-family:
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      font-size:10px;
      font-weight:950;
      letter-spacing:.08em;

      paint-order:stroke;
      stroke:#02070b;
      stroke-width:3px;
      stroke-linejoin:round;

      text-shadow:
        0 2px 8px rgba(0,0,0,.95);

      pointer-events:none;
      user-select:none;
    }

    #${ROOT_ID} #rv5-player text{
      fill:#ffffff;

      font-size:14px;
      font-weight:950;
      letter-spacing:.04em;

      paint-order:stroke;
      stroke:#021018;
      stroke-width:4px;
      stroke-linejoin:round;

      filter:
        drop-shadow(
          0 0 6px
          rgba(101,232,255,.95)
        )
        drop-shadow(
          0 0 14px
          rgba(101,232,255,.38)
        );
    }

    #${ROOT_ID} .guide{
      fill:#72efff;

      font-family:
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      font-size:12px;
      font-weight:950;
      letter-spacing:.02em;

      paint-order:stroke;

      stroke:#02070b;
      stroke-width:3px;
      stroke-linejoin:round;
    }

    #${ROOT_ID}.opening .rv5-shell {
      animation:
        rv5open
        .45s
        cubic-bezier(.16,.84,.22,1)
        both;
    }

    @keyframes rv5open {
      from {
        opacity:0;
        transform:translateY(15px) scale(.985);
        filter:blur(5px);
      }

      to {
        opacity:1;
        transform:none;
        filter:none;
      }
    }

    @media(max-width:820px) {

      #${ROOT_ID} {
        padding:5px !important;
      }

      #${ROOT_ID} .rv5-shell {
        width:98vw;
        height:97dvh;
        min-height:0;
        border-radius:10px;
      }

      #${ROOT_ID} .rv5-header {
        padding:12px;
      }

      #${ROOT_ID} .rv5-status {
        display:none;
      }

      #${ROOT_ID} .rv5-main {
        grid-template-rows:34px minmax(0,1fr) 34px;
      }

      #${ROOT_ID} .rv5-footer {
        min-height:58px;
        padding:8px 11px;
      }

      #${ROOT_ID} .rv5-ready {
        display:none;
      }
    }

    @media(max-width:520px) {

      #${ROOT_ID} .rv5-header {
        min-height:70px;
        padding:9px 10px;
      }

      #${ROOT_ID} .rv5-live {
        font-size:5px;
        margin-bottom:5px;
      }

      #${ROOT_ID} .rv5-kicker {
        font-size:5px;
      }

      #${ROOT_ID} h1 {
        font-size:20px;
      }

      #${ROOT_ID} .rv5-meta {
        max-width:62vw;
        font-size:5px;
      }

      #${ROOT_ID} .rv5-timer {
        width:53px;
        height:53px;
      }

      #${ROOT_ID} .rv5-timer strong {
        font-size:17px;
      }

      #${ROOT_ID} .rv5-mapbar {
        padding:0 7px;
      }

      #${ROOT_ID} .rv5-mapbar span {
        padding:4px 5px;
        font-size:4px;
      }

      #${ROOT_ID} .rv5-mapbar span:nth-child(3) {
        display:none;
      }

      #${ROOT_ID} .rv5-mapbar b {
        display:none;
      }

      #${ROOT_ID} .rv5-map-label.top {
        top:12px;
        left:12px;
      }

      #${ROOT_ID} .rv5-map-label.bottom {
        right:12px;
        bottom:12px;
      }

      #${ROOT_ID} .rv5-map-label small {
        font-size:4px;
      }

      #${ROOT_ID} .rv5-map-label strong {
        font-size:5px;
      }

      #${ROOT_ID} .rv5-live-tag {
        left:8px;
        bottom:8px;
        padding:6px 7px;
        font-size:4px;
      }

      #${ROOT_ID} .rv5-stats small {
        font-size:4px;
      }

      #${ROOT_ID} .rv5-stats strong {
        font-size:5px;
      }

      #${ROOT_ID} .rv5-footer {
        min-height:55px;
      }

      #${ROOT_ID} .rv5-objective {
        gap:8px;
      }

      #${ROOT_ID} .rv5-objective-icon {
        width:24px;
        height:24px;
        font-size:8px;
      }

      #${ROOT_ID} .rv5-objective small {
        font-size:4px;
      }

      #${ROOT_ID} .objective-text {
        max-width:78vw;
        font-size:6px;
      }
    }

    /* ============================================================
       FINAL AAA READABILITY / MAP REDESIGN OVERRIDE
       ============================================================ */

    #${ROOT_ID} .rv5-shell{
      width:min(1440px,98vw);
      height:min(920px,96dvh);

      background:
        radial-gradient(
          circle at 50% 45%,
          rgba(55,190,225,.08),
          transparent 42%
        ),
        linear-gradient(
          145deg,
          #06131b 0%,
          #02080d 58%,
          #010407 100%
        );

      border:1px solid rgba(101,232,255,.28);

      box-shadow:
        0 35px 120px rgba(0,0,0,.88),
        0 0 80px rgba(65,205,235,.11),
        inset 0 0 60px rgba(101,232,255,.025);
    }

    #${ROOT_ID} .rv5-header{
      padding:22px 26px;
      gap:24px;

      background:
        linear-gradient(
          180deg,
          rgba(10,28,38,.72),
          rgba(2,9,14,.35)
        );

      border-bottom:1px solid rgba(101,232,255,.14);
    }

    #${ROOT_ID} .rv5-live{
      font-size:10px;
      line-height:1.2;
      letter-spacing:.13em;
      color:#9cc1cc;
      text-shadow:0 1px 8px rgba(0,0,0,.9);
    }

    #${ROOT_ID} .rv5-kicker{
      font-size:10px;
      line-height:1.25;
      letter-spacing:.13em;
      font-weight:950;
      color:var(--yellow);
      text-shadow:0 1px 8px rgba(0,0,0,.9);
    }

    #${ROOT_ID} h1{
      font-size:clamp(32px,4.8vw,56px);
      line-height:.95;
      letter-spacing:.055em;
      font-weight:950;

      text-shadow:
        0 0 20px rgba(255,255,255,.06),
        0 0 32px rgba(101,232,255,.10);
    }

    #${ROOT_ID} .rv5-meta{
      margin-top:10px;

      color:#b1d0d8;

      font-size:10px;
      line-height:1.25;
      font-weight:900;
      letter-spacing:.09em;

      text-shadow:
        0 1px 8px rgba(0,0,0,.95);
    }

    #${ROOT_ID} .rv5-timer{
      position:relative;

      width:92px;
      height:92px;

      display:grid;
      place-items:center;

      border-radius:50%;

      background:
        radial-gradient(
          circle,
          rgba(255,215,106,.09) 0%,
          rgba(255,215,106,.025) 42%,
          transparent 72%
        );

      box-shadow:
        0 0 24px rgba(255,215,106,.08),
        inset 0 0 20px rgba(255,215,106,.035);
    }

    #${ROOT_ID} .rv5-timer circle{
      stroke-width:3;
    }

    #${ROOT_ID} .rv5-timer strong{
      position:relative;
      z-index:3;

      font-size:31px;
      line-height:1;

      font-weight:950;

      color:#ffe28b;

      text-shadow:
        0 0 8px rgba(255,215,106,.75),
        0 0 22px rgba(255,215,106,.30);
    }

    #${ROOT_ID} .rv5-timer small{
      font-size:7px;
      font-weight:900;
      letter-spacing:.15em;
    }

    /* MAP BAR */

    #${ROOT_ID} .rv5-mapbar{
      min-height:42px;
      padding:0 16px;

      background:
        linear-gradient(
          180deg,
          rgba(5,20,29,.98),
          rgba(2,9,14,.98)
        );
    }

    #${ROOT_ID} .rv5-mapbar > div{
      gap:7px;
    }

    #${ROOT_ID} .rv5-mapbar span{
      padding:7px 10px;

      color:#91b0bb;
      font-size:9px;
      line-height:1.1;
      font-weight:950;
      letter-spacing:.09em;

      border:1px solid rgba(101,232,255,.13);
      background:rgba(101,232,255,.025);
    }

    #${ROOT_ID} .rv5-mapbar span.active{
      color:#72f1ff;

      border-color:rgba(101,232,255,.38);

      background:
        linear-gradient(
          90deg,
          rgba(101,232,255,.10),
          rgba(101,232,255,.025)
        );

      box-shadow:
        inset 0 0 12px rgba(101,232,255,.04),
        0 0 12px rgba(101,232,255,.05);
    }

    #${ROOT_ID} .rv5-mapbar b{
      color:#a1bdc6;
      font-size:9px;
      line-height:1.1;
      font-weight:950;
      letter-spacing:.09em;
    }

    /* MAP */

    #${ROOT_ID} .rv5-map{
      position:relative;
      overflow:hidden;

      background:
        radial-gradient(
          circle at 50% 48%,
          rgba(101,232,255,.08),
          transparent 52%
        ),
        linear-gradient(
          180deg,
          #061720 0%,
          #020b11 52%,
          #010508 100%
        );

      border-top:1px solid rgba(101,232,255,.18);
      border-bottom:1px solid rgba(101,232,255,.18);

      box-shadow:
        inset 0 0 55px rgba(101,232,255,.045),
        inset 0 0 120px rgba(0,0,0,.36),
        0 0 35px rgba(0,0,0,.25);
    }

    #${ROOT_ID} .rv5-map::after{
      content:"";
      position:absolute;
      inset:12px;
      pointer-events:none;
      z-index:5;

      border:1px solid rgba(255,255,255,.025);

      box-shadow:
        inset 0 0 28px rgba(0,0,0,.22);
    }

    #${ROOT_ID} .rv5-svg{
      position:absolute;
      inset:0;

      width:100%;
      height:100%;

      display:block;

      object-fit:contain;
      object-position:center center;
    }

    /* stronger tactical grid */

    #${ROOT_ID} .grid{
      stroke:#163c50;
      stroke-width:1;
      opacity:.58;
    }

    #${ROOT_ID} .grid-major{
      stroke:#286078;
      stroke-width:1.6;
      opacity:.48;
    }

    #${ROOT_ID} .platform{
      fill:#0d2837;
      stroke:#5c899b;
      stroke-width:1.25;

      filter:
        drop-shadow(
          0 0 4px
          rgba(77,210,235,.08)
        );
    }

    #${ROOT_ID} .edge{
      stroke:#70e9ff;
      opacity:.42;
    }

    /* ROUTE */

    #${ROOT_ID} .route-halo{
      fill:none;
      stroke:#61e8ff;
      stroke-width:26;
      opacity:.14;

      filter:
        drop-shadow(
          0 0 10px
          rgba(101,232,255,.30)
        );
    }

    #${ROOT_ID} .route{
      fill:none;

      stroke:#6cf1ff;
      stroke-width:5;
      stroke-linecap:round;
      stroke-linejoin:round;

      stroke-dasharray:16 10;

      animation:
        rv5route
        1.05s
        linear
        infinite;

      filter:
        drop-shadow(
          0 0 5px
          rgba(101,232,255,.95)
        )
        drop-shadow(
          0 0 14px
          rgba(101,232,255,.40)
        );
    }

    #${ROOT_ID} .route-core{
      stroke:#f4fdff;
      stroke-width:1.3;
      opacity:.86;
    }

    /* MAP MARKERS */

    #${ROOT_ID} .start{
      fill:#8df59b;

      stroke:#f4ffe7;
      stroke-width:3;

      filter:
        drop-shadow(
          0 0 6px
          rgba(141,245,155,.95)
        )
        drop-shadow(
          0 0 16px
          rgba(141,245,155,.38)
        );

      transform-box:fill-box;
      transform-origin:center;
    }

    #${ROOT_ID} .goal{
      fill:#ffd76a;

      stroke:#fff8ce;
      stroke-width:3;

      filter:
        drop-shadow(
          0 0 8px
          rgba(255,215,106,.95)
        )
        drop-shadow(
          0 0 20px
          rgba(255,215,106,.42)
        );

      transform-box:fill-box;
      transform-origin:center;
    }

    #${ROOT_ID} .player{
      fill:#ffffff;
      stroke:#64ebff;
      stroke-width:3;

      filter:
        drop-shadow(
          0 0 5px
          rgba(100,235,255,.8)
        )
        drop-shadow(
          0 0 13px
          rgba(100,235,255,.28)
        );
    }

    #${ROOT_ID} .player-ring{
      fill:none;

      stroke:#6ff3ff;
      stroke-width:2.8;

      stroke-dasharray:7 5;

      opacity:1;

      filter:
        drop-shadow(
          0 0 5px
          rgba(100,235,255,.9)
        )
        drop-shadow(
          0 0 15px
          rgba(100,235,255,.32)
        );

      animation:
        rv5ring
        1.35s
        linear
        infinite;
    }

    #${ROOT_ID} .checkpoint{
      fill:rgba(100,235,255,.035);

      stroke:#64ebff;
      stroke-width:2;

      filter:
        drop-shadow(
          0 0 5px
          rgba(100,235,255,.35)
        );
    }

    #${ROOT_ID} .checkpoint-dot{
      fill:#ffffff;

      filter:
        drop-shadow(
          0 0 5px
          rgba(100,235,255,.80)
        );
    }

    #${ROOT_ID} .danger-object{
      fill:#3a1725;

      stroke:#ff6577;
      stroke-width:2;

      filter:
        drop-shadow(
          0 0 5px
          rgba(255,104,119,.32)
        );
    }

    #${ROOT_ID} .signal{
      fill:#ffd76a;

      filter:
        drop-shadow(
          0 0 6px
          rgba(255,215,106,.55)
        );
    }

    /* MAP TEXT */

    #${ROOT_ID} .label{
      fill:#e9fbff;

      font-family:
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      font-size:10px;
      font-weight:950;
      letter-spacing:.08em;

      paint-order:stroke;

      stroke:#02070b;
      stroke-width:3px;
      stroke-linejoin:round;

      text-shadow:
        0 2px 8px
        rgba(0,0,0,.95);

      pointer-events:none;
      user-select:none;
    }

    #${ROOT_ID} #rv5-player text{
      fill:#ffffff;

      font-size:14px;
      font-weight:950;
      letter-spacing:.04em;

      paint-order:stroke;

      stroke:#021018;
      stroke-width:4px;
      stroke-linejoin:round;

      filter:
        drop-shadow(
          0 0 6px
          rgba(101,232,255,.95)
        )
        drop-shadow(
          0 0 14px
          rgba(101,232,255,.38)
        );
    }

    #${ROOT_ID} .guide{
      fill:#72efff;

      font-family:
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

      font-size:12px;
      font-weight:950;
      letter-spacing:.02em;

      paint-order:stroke;

      stroke:#02070b;
      stroke-width:3px;
      stroke-linejoin:round;
    }

    /* MAP OVERLAY LABELS */

    #${ROOT_ID} .rv5-map-label small{
      color:#9bb7c1;
      font-size:10px;
      line-height:1.2;
      font-weight:950;
      letter-spacing:.10em;

      text-shadow:
        0 2px 8px
        rgba(0,0,0,.95);
    }

    #${ROOT_ID} .rv5-map-label strong{
      color:#f2fbff;
      font-size:14px;
      line-height:1.15;
      font-weight:950;
      letter-spacing:.07em;

      text-shadow:
        0 2px 12px
        rgba(0,0,0,.95);
    }

    #${ROOT_ID} .rv5-live-tag{
      padding:9px 12px;

      color:#70efff;
      font-size:9px;
      line-height:1.1;
      font-weight:950;
      letter-spacing:.09em;

      border:1px solid rgba(101,232,255,.28);

      background:
        linear-gradient(
          135deg,
          rgba(3,19,28,.94),
          rgba(1,8,13,.90)
        );

      box-shadow:
        0 0 18px
        rgba(101,232,255,.06),
        inset 0 0 14px
        rgba(101,232,255,.03);
    }

    /* STATS */

    #${ROOT_ID} .rv5-stats{
      min-height:48px;
    }

    #${ROOT_ID} .rv5-stats small{
      color:#7899a5;
      font-size:8px;
      line-height:1.2;
      font-weight:900;
      letter-spacing:.10em;
    }

    #${ROOT_ID} .rv5-stats strong{
      color:#ecf9fc;
      font-size:10px;
      line-height:1.2;
      font-weight:950;
      letter-spacing:.07em;
    }

    #${ROOT_ID} .rv5-stats .danger{
      color:#ff7886;
      text-shadow:
        0 0 10px
        rgba(255,104,119,.20);
    }

    /* FOOTER */

    #${ROOT_ID} .rv5-footer{
      min-height:86px;
      padding:12px 20px;

      background:
        linear-gradient(
          180deg,
          rgba(3,14,20,.99),
          rgba(1,6,10,1)
        );

      border-top:1px solid rgba(101,232,255,.16);

      box-shadow:
        inset 0 10px 30px
        rgba(101,232,255,.025);
    }

    #${ROOT_ID} .rv5-objective small{
      font-size:8px;
      line-height:1.2;
      font-weight:950;
      letter-spacing:.11em;
    }

    #${ROOT_ID} .objective-text{
      max-width:65vw;

      color:#f1fbfd;

      font-size:13px;
      line-height:1.2;
      font-weight:950;
      letter-spacing:.025em;

      text-shadow:
        0 0 10px
        rgba(101,232,255,.08);
    }

    /* ============================================================
       MOBILE
       ============================================================ */

    @media(max-width:820px){

      #${ROOT_ID}{
        padding:4px !important;
      }

      #${ROOT_ID} .rv5-shell{
        width:99vw;
        height:98dvh;
        border-radius:8px;
      }

      #${ROOT_ID} .rv5-header{
        padding:12px 12px;
        gap:8px;
      }

      #${ROOT_ID} .rv5-live{
        font-size:8px;
      }

      #${ROOT_ID} .rv5-kicker{
        font-size:8px;
        letter-spacing:.09em;
      }

      #${ROOT_ID} h1{
        font-size:clamp(25px,7vw,38px);
      }

      #${ROOT_ID} .rv5-meta{
        max-width:67vw;
        font-size:8px;
      }

      #${ROOT_ID} .rv5-timer{
        width:66px;
        height:66px;
      }

      #${ROOT_ID} .rv5-timer strong{
        font-size:22px;
      }

      #${ROOT_ID} .rv5-timer small{
        font-size:6px;
      }

      #${ROOT_ID} .rv5-main{
        grid-template-rows:40px minmax(0,1fr) 48px;
      }

      #${ROOT_ID} .rv5-mapbar{
        padding:0 8px;
      }

      #${ROOT_ID} .rv5-mapbar span{
        padding:6px 7px;
        font-size:8px;
      }

      #${ROOT_ID} .rv5-mapbar b{
        font-size:8px;
      }

      #${ROOT_ID} .rv5-map-label.top{
        top:10px;
        left:10px;
      }

      #${ROOT_ID} .rv5-map-label.bottom{
        right:10px;
        bottom:10px;
      }

      #${ROOT_ID} .rv5-map-label small{
        font-size:8px;
      }

      #${ROOT_ID} .rv5-map-label strong{
        font-size:11px;
      }

      #${ROOT_ID} .rv5-live-tag{
        left:8px;
        bottom:8px;
        padding:7px 9px;
        font-size:8px;
      }

      #${ROOT_ID} .rv5-stats small{
        font-size:7px;
      }

      #${ROOT_ID} .rv5-stats strong{
        font-size:9px;
      }

      #${ROOT_ID} .rv5-footer{
        min-height:62px;
        padding:9px 10px;
      }

      #${ROOT_ID} .rv5-objective small{
        font-size:7px;
      }

      #${ROOT_ID} .objective-text{
        max-width:72vw;
        font-size:10px;
        line-height:1.3;

        white-space:normal;
        overflow:visible;
        text-overflow:clip;

        display:-webkit-box;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:2;

        word-break:normal;
        overflow-wrap:anywhere;
      }

      #${ROOT_ID} .label{
        font-size:11px;
        stroke-width:3px;
      }

      #${ROOT_ID} .guide{
        font-size:10px;
        stroke-width:2.5px;
      }
    }

    @media(max-width:520px){

      #${ROOT_ID} .rv5-header{
        min-height:80px;
        padding:9px 10px;
      }

      #${ROOT_ID} .rv5-live{
        font-size:7px;
      }

      #${ROOT_ID} .rv5-kicker{
        font-size:7px;
      }

      #${ROOT_ID} h1{
        font-size:clamp(23px,7.4vw,32px);
      }

      #${ROOT_ID} .rv5-meta{
        max-width:63vw;
        font-size:7px;
      }

      #${ROOT_ID} .rv5-timer{
        width:60px;
        height:60px;
      }

      #${ROOT_ID} .rv5-timer strong{
        font-size:20px;
      }

      #${ROOT_ID} .rv5-main{
        grid-template-rows:39px minmax(0,1fr) 48px;
      }

      #${ROOT_ID} .rv5-mapbar span{
        padding:6px;
        font-size:7px;
      }

      #${ROOT_ID} .rv5-mapbar b{
        font-size:7px;
      }

      #${ROOT_ID} .rv5-map-label small{
        font-size:7px;
      }

      #${ROOT_ID} .rv5-map-label strong{
        font-size:9px;
      }

      #${ROOT_ID} .rv5-live-tag{
        font-size:7px;
      }

      #${ROOT_ID} .rv5-stats small{
        font-size:6px;
      }

      #${ROOT_ID} .rv5-stats strong{
        font-size:8px;
      }

      #${ROOT_ID} .rv5-footer{
        min-height:58px;
      }

      #${ROOT_ID} .rv5-objective small{
        font-size:6.5px;
      }

      #${ROOT_ID} .objective-text{
        max-width:68vw;
        font-size:9px;
        line-height:1.25;

        white-space:normal;
        overflow:visible;
        text-overflow:clip;

        display:-webkit-box;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:2;

        word-break:normal;
        overflow-wrap:anywhere;
      }

      #${ROOT_ID} .label{
        font-size:10px;
      }

      #${ROOT_ID} .guide{
        font-size:9px;
      }
    }

    /* ============================================================
       FINAL MOBILE VISIBILITY LOCK
       ============================================================ */

    @media(max-width:520px){

      #${ROOT_ID} .rv5-map{
        min-height:0 !important;
      }

      #${ROOT_ID} .rv5-svg{
        width:100% !important;
        height:100% !important;
        display:block !important;
      }

      /* MAP BAR */

      #${ROOT_ID} .rv5-mapbar span{
        font-size:8px !important;
        line-height:1.1 !important;
        font-weight:950 !important;
        letter-spacing:.08em !important;
      }

      /* MAP */

      #${ROOT_ID} .rv5-map{
        min-height:0 !important;
        overflow:hidden !important;
      }

      #${ROOT_ID} .rv5-map::after{
        inset:8px !important;
      }

      /* LABELS */

      #${ROOT_ID} .rv5-map-label{
        gap:3px !important;
      }

      #${ROOT_ID} .rv5-map-label.top{
        top:8px !important;
        left:9px !important;
      }

      #${ROOT_ID} .rv5-map-label.bottom{
        right:9px !important;
        bottom:8px !important;
      }

      #${ROOT_ID} .rv5-map-label small{
        font-size:5px !important;
        letter-spacing:.10em !important;
      }

      #${ROOT_ID} .rv5-map-label strong{
        font-size:7px !important;
        letter-spacing:.045em !important;
      }

      #${ROOT_ID} .rv5-live-tag{
        left:7px !important;
        bottom:7px !important;
        padding:6px 7px !important;
        font-size:5px !important;
      }

      /* FOOTER */

      #${ROOT_ID} .rv5-footer{
        min-height:58px !important;
        padding:8px !important;
      }

      #${ROOT_ID} .rv5-objective{
        gap:7px !important;
        padding:7px 9px !important;
        max-width:100% !important;
      }

      #${ROOT_ID} .rv5-objective-icon{
        width:22px !important;
        height:22px !important;
        font-size:7px !important;
      }

      #${ROOT_ID} .rv5-objective small{
        font-size:5px !important;
        margin-bottom:3px !important;
      }

      #${ROOT_ID} .objective-text{
        max-width:70vw !important;
        font-size:8px !important;
        line-height:1.2 !important;
      }

      /* STATS */

      #${ROOT_ID} .rv5-stats{
        min-height:42px !important;
      }

      #${ROOT_ID} .rv5-stats small{
        font-size:5px !important;
      }

      #${ROOT_ID} .rv5-stats strong{
        font-size:7px !important;
      }
    }

    @media(prefers-reduced-motion:reduce){

      #${ROOT_ID} .rv5-live b,
      #${ROOT_ID} .rv5-scan,
      #${ROOT_ID} .route,
      #${ROOT_ID} .player-ring{
        animation:none !important;
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

    const mission =
      scene?.mission || {};

    const bounds =
      scene?.physics?.world?.bounds || {};

    const worldW =
      Math.max(
        1,
        num(
          bounds.width,
          num(mission.goal?.x, 6100) + 300
        )
      );

    const worldH =
      Math.max(
        1,
        num(
          bounds.height,
          720
        )
      );

    const W = 1000;
    const H = 560;

    const scaleX =
      880 /
      worldW;

    const scaleY =
      460 /
      worldH;

    const X =
      x =>
        60 +
        clamp(
          num(x),
          0,
          worldW
        ) *
        scaleX;

    const Y =
      y =>
        50 +
        clamp(
          num(y),
          0,
          worldH
        ) *
        scaleY;

    const arr =
      key =>
        Array.isArray(mission[key])
          ? mission[key]
          : [];

    const point =
      value => {

        if (Array.isArray(value)) {
          return {
            x:X(value[0]),
            y:Y(value[1])
          };
        }

        return {
          x:X(value?.x),
          y:Y(value?.y)
        };
      };

    const rect =
      value => {

        const a =
          Array.isArray(value)
            ? value
            : [
                value?.x,
                value?.y,
                value?.width ??
                  value?.w ??
                  50,
                value?.height ??
                  value?.h ??
                  20
              ];

        return {
          x:X(a[0]),
          y:Y(a[1]),
          w:Math.max(
            6,
            num(a[2],50) *
              scaleX
          ),
          h:Math.max(
            5,
            num(a[3],20) *
              scaleY
          )
        };
      };

    const player =
      scene?.player || {};

    return {

      worldW,
      worldH,
      W,
      H,

      points: {

        start:
          point(
            mission.spawn || {
              x:120,
              y:worldH - 120
            }
          ),

        goal:
          point(
            mission.goal || {
              x:worldW - 100,
              y:worldH - 110
            }
          ),

        player:
          point({
            x:
              num(
                player.x,
                mission.spawn?.x ??
                120
              ),

            y:
              num(
                player.y,
                mission.spawn?.y ??
                worldH - 120
              )
          })
      },

      checkpoints:
        arr('checkpoints'),

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

      boostPads:
        arr('boostPads'),

      guides:
        arr('guides'),

      point,
      rect
    };
  }

  /*
   * ============================================================
   * GRID
   * ============================================================
   */

  function grid() {

    let out = '';

    for (
      let x = 40;
      x <= 960;
      x += 40
    ) {

      out += `
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

      out += `
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

    return out;
  }

  /*
   * ============================================================
   * RENDER REAL MAP
   * ============================================================
   */

  function renderMap(scene) {

    const svg =
      root.querySelector(
        '.rv5-svg'
      );

    if (
      !svg ||
      !scene
    ) return;

    const d =
      mapModel(scene);

    const routePoints = [
      d.points.start,
      ...d.checkpoints.map(
        d.point
      ),
      d.points.goal
    ];

    const route =
      routePoints
        .map(
          (p,i) =>
            `${
              i ? 'L' : 'M'
            } ${
              p.x.toFixed(1)
            } ${
              p.y.toFixed(1)
            }`
        )
        .join(' ');

    const platforms =
      d.platforms
        .map(item => {

          const r =
            d.rect(item);

          return `
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
              x2="${r.x+r.w}"
              y2="${r.y}"
              class="edge">
            </line>
          `;
        })
        .join('');

    const obstacles =
      d.obstacles
        .map(item => {

          const p =
            d.point(item);

          return `
            <path
              d="
                M ${p.x-9}
                  ${p.y+8}

                L ${p.x}
                  ${p.y-9}

                L ${p.x+9}
                  ${p.y+8}

                Z
              "
              class="danger-object">
            </path>
          `;
        })
        .join('');

    const gates =
      d.movingGates
        .map(item => {

          const r =
            d.rect(item);

          return `
            <rect
              x="${r.x}"
              y="${r.y}"
              width="${r.w}"
              height="${r.h}"
              rx="3"
              class="danger-object">
            </rect>

            <line
              x1="${r.x}"
              y1="${r.y}"
              x2="${r.x+r.w}"
              y2="${r.y+r.h}"
              stroke="#ff6877"
              opacity=".3">
            </line>

            <line
              x1="${r.x+r.w}"
              y1="${r.y}"
              x2="${r.x}"
              y2="${r.y+r.h}"
              stroke="#ff6877"
              opacity=".3">
            </line>
          `;
        })
        .join('');

    const checkpoints =
      d.checkpoints
        .map(
          (item,i) => {

            const p =
              d.point(item);

            return `
              <g>

                <circle
                  cx="${p.x}"
                  cy="${p.y}"
                  r="17"
                  class="checkpoint">
                </circle>

                <circle
                  cx="${p.x}"
                  cy="${p.y}"
                  r="4"
                  class="checkpoint-dot">
                </circle>

                <text
                  x="${p.x}"
                  y="${p.y-21}"
                  text-anchor="middle"
                  class="label">
                  CP ${i+1}
                </text>

              </g>
            `;
          }
        )
        .join('');

    const signals =
      d.signals
        .map(item => {

          const p =
            d.point(item);

          return `
            <circle
              cx="${p.x}"
              cy="${p.y}"
              r="5"
              class="signal">
            </circle>
          `;
        })
        .join('');

    const enemies =
      d.enemies
        .map(item => {

          const p =
            d.point(item);

          return `
            <g>

              <circle
                cx="${p.x}"
                cy="${p.y}"
                r="11"
                fill="none"
                stroke="#ff6877"
                opacity=".25">
              </circle>

              <circle
                cx="${p.x}"
                cy="${p.y}"
                r="7"
                class="danger-object">
              </circle>

              <text
                x="${p.x+12}"
                y="${p.y+3}"
                class="label">
                HOSTILE
              </text>

            </g>
          `;
        })
        .join('');

    const guides =
      d.guides
        .map(item => {

          const p =
            d.point(item);

          return `
            <text
              x="${p.x}"
              y="${p.y-12}"
              class="guide">
              ${esc(
                item?.text ||
                ''
              )}
            </text>
          `;
        })
        .join('');

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
            stop-color="#071923">
          </stop>

          <stop
            offset="42%"
            stop-color="#03111a">
          </stop>

          <stop
            offset="100%"
            stop-color="#01060a">
          </stop>

        </linearGradient>

        <radialGradient
          id="rv5mapGlow"
          cx="50%"
          cy="48%"
          r="68%">

          <stop
            offset="0%"
            stop-color="#1e92ae"
            stop-opacity=".18">
          </stop>

          <stop
            offset="48%"
            stop-color="#0b4f62"
            stop-opacity=".08">
          </stop>

          <stop
            offset="100%"
            stop-color="#000000"
            stop-opacity="0">
          </stop>

        </radialGradient>

        <pattern
          id="rv5microGrid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse">

          <path
            d="M20 0H0V20"
            fill="none"
            stroke="#63dff5"
            stroke-opacity=".035"
            stroke-width="1">
          </path>

        </pattern>

        <filter
          id="rv5softGlow"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%">

          <feGaussianBlur
            stdDeviation="3"
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

      </defs>

      <!-- BASE -->

      <rect
        width="1000"
        height="560"
        fill="url(#rv5mapGradient)">
      </rect>

      <rect
        width="1000"
        height="560"
        fill="url(#rv5mapGlow)">
      </rect>

      <rect
        width="1000"
        height="560"
        fill="url(#rv5microGrid)">
      </rect>


      <!-- TACTICAL FRAME -->

      <rect
        x="18"
        y="18"
        width="964"
        height="524"
        rx="5"
        fill="none"
        stroke="#6cecff"
        stroke-opacity=".11">
      </rect>

      <rect
        x="28"
        y="28"
        width="944"
        height="504"
        rx="3"
        fill="none"
        stroke="#ffd76a"
        stroke-opacity=".055">
      </rect>


      <!-- DISTRICT ZONES -->

      <path
        d="M52 88H285L330 132V242H52Z"
        fill="#0a2632"
        fill-opacity=".48"
        stroke="#6cecff"
        stroke-opacity=".07">
      </path>

      <path
        d="M330 72H620L662 115V260H330Z"
        fill="#08202b"
        fill-opacity=".44"
        stroke="#6cecff"
        stroke-opacity=".065">
      </path>

      <path
        d="M640 92H948V275L905 311H662V238H640Z"
        fill="#0b222b"
        fill-opacity=".42"
        stroke="#6cecff"
        stroke-opacity=".06">
      </path>

      <path
        d="M54 284H314V468H54Z"
        fill="#071c25"
        fill-opacity=".5"
        stroke="#6cecff"
        stroke-opacity=".055">
      </path>

      <path
        d="M334 292H620V510H334Z"
        fill="#0a2029"
        fill-opacity=".43"
        stroke="#6cecff"
        stroke-opacity=".05">
      </path>

      <path
        d="M640 326H946V508H640Z"
        fill="#081a23"
        fill-opacity=".48"
        stroke="#6cecff"
        stroke-opacity=".055">
      </path>


      <!-- PRIMARY ARTERIES -->

      <path
        d="M60 455 Q190 398 305 371 T512 280 T710 184 T944 100"
        fill="none"
        stroke="#01070b"
        stroke-width="44"
        opacity=".9">
      </path>

      <path
        d="M60 455 Q190 398 305 371 T512 280 T710 184 T944 100"
        fill="none"
        stroke="#24434e"
        stroke-width="29"
        opacity=".9">
      </path>

      <path
        d="M60 455 Q190 398 305 371 T512 280 T710 184 T944 100"
        fill="none"
        stroke="#102932"
        stroke-width="21"
        opacity=".95">
      </path>

      <path
        d="M116 96L204 185L287 248L378 318L460 377L558 447"
        fill="none"
        stroke="#0b1d25"
        stroke-width="18"
        opacity=".9">
      </path>

      <path
        d="M116 96L204 185L287 248L378 318L460 377L558 447"
        fill="none"
        stroke="#1b3842"
        stroke-width="10"
        opacity=".85">
      </path>

      <path
        d="M612 76L585 162L570 254L624 354L692 478"
        fill="none"
        stroke="#0a2029"
        stroke-width="15"
        opacity=".9">
      </path>


      <!-- LIVE WORLD -->

      ${platforms}
      ${gates}
      ${obstacles}


      <!-- ROUTE -->

      <path
        d="${route}"
        class="route-halo">
      </path>

      <path
        d="${route}"
        class="route">
      </path>

      <path
        d="${route}"
        class="route-core">
      </path>


      <!-- MISSION DATA -->

      ${signals}
      ${checkpoints}
      ${enemies}
      ${guides}


      <!-- START -->

      <g
        filter="url(#rv5softGlow)">

        <circle
          cx="${d.points.start.x}"
          cy="${d.points.start.y}"
          r="24"
          fill="none"
          stroke="#8df59b"
          stroke-width="1"
          stroke-dasharray="4 6"
          opacity=".45">
        </circle>

        <circle
          cx="${d.points.start.x}"
          cy="${d.points.start.y}"
          r="15"
          fill="none"
          stroke="#8df59b"
          stroke-width="2"
          opacity=".22">
        </circle>

        <circle
          cx="${d.points.start.x}"
          cy="${d.points.start.y}"
          r="8"
          class="start">
        </circle>

        <text
          x="${d.points.start.x + 18}"
          y="${d.points.start.y + 4}"
          class="label">
          START
        </text>

      </g>


      <!-- OBJECTIVE -->

      <g
        filter="url(#rv5softGlow)">

        <circle
          cx="${d.points.goal.x}"
          cy="${d.points.goal.y}"
          r="31"
          fill="none"
          stroke="#ffd76a"
          stroke-width="1"
          stroke-dasharray="6 7"
          opacity=".38">
        </circle>

        <circle
          cx="${d.points.goal.x}"
          cy="${d.points.goal.y}"
          r="20"
          fill="none"
          stroke="#ffd76a"
          stroke-width="2"
          opacity=".25">
        </circle>

        <circle
          cx="${d.points.goal.x}"
          cy="${d.points.goal.y}"
          r="10"
          class="goal">
        </circle>

        <text
          x="${d.points.goal.x + 22}"
          y="${d.points.goal.y + 4}"
          class="label">
          OBJECTIVE
        </text>

      </g>


      <!-- PLAYER -->

      <g
        id="rv5-player"
        filter="url(#rv5softGlow)">

        <circle
          cx="${d.points.player.x}"
          cy="${d.points.player.y}"
          r="21"
          class="player-ring">
        </circle>

        <circle
          cx="${d.points.player.x}"
          cy="${d.points.player.y}"
          r="12"
          fill="none"
          stroke="#64ebff"
          stroke-width="1"
          opacity=".28">
        </circle>

        <circle
          cx="${d.points.player.x}"
          cy="${d.points.player.y}"
          r="7"
          class="player">
        </circle>

        <path
          d="
            M ${d.points.player.x}
              ${d.points.player.y-14}

            L ${d.points.player.x+4}
              ${d.points.player.y-7}

            L ${d.points.player.x-4}
              ${d.points.player.y-7}

            Z
          "
          fill="#64ebff"
          opacity=".9">
        </path>

        <text
          x="${d.points.player.x + 17}"
          y="${d.points.player.y - 15}"
          class="label">
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
      root.querySelector(
        '.rv5-svg'
      );

    const player =
      svg?.querySelector(
        '#rv5-player'
      );

    if (
      !scene ||
      !player
    ) return;

    const d =
      mapModel(scene);

    const circle =
      player.querySelector(
        '.player'
      );

    const ring =
      player.querySelector(
        '.player-ring'
      );

    const label =
      player.querySelector(
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
        Math.ceil(
          ms / 1000
        )
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

      const circumference =
        270.18;

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

    root.classList.remove(
      'opening'
    );

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

    root.classList.remove(
      'opening'
    );

    void root.offsetWidth;

    root.classList.add(
      'opening'
    );

    const startedWait =
      performance.now();

    let data =
      getMission();

    while (
      !data.scene &&
      performance.now() -
        startedWait <
        4500
    ) {

      await WAIT(80);

      data =
        getMission();
    }

    data =
      getMission();

    root
      .querySelector(
        '.rv5-meta'
      )
      .textContent =
      `${data.district} // ${data.title}`;

    root
      .querySelector(
        '.objective-text'
      )
      .textContent =
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

      if (
        !button ||
        active
      ) return;

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

      visibility:hidden !important;
      opacity:0 !important;
      pointer-events:none !important;

    }

  `;

  document.head.appendChild(
    lockStyle
  );

  /*
   * ============================================================
   * PUBLIC API
   * ============================================================
   */

  window.relayGameplayIntroV5 = {

    show,

    close:
      finish,

    refresh() {

      if (!active)
        return;

      const data =
        getMission();

      if (data.scene) {

        renderMap(
          data.scene
        );

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
