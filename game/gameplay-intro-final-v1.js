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

    #${ROOT_ID} .rv5-map {
      position:relative;
      min-height:0;
      overflow:hidden;
      background:#02080d;
    }

    #${ROOT_ID} .rv5-svg {
      position:absolute;
      inset:0;

      width:100%;
      height:100%;

      display:block;
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
          transparent 40%,
          rgba(0,0,0,.68)
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

    #${ROOT_ID} .rv5-objective {
      display:flex;
      align-items:center;
      gap:12px;

      min-width:0;
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

    #${ROOT_ID} .platform {
      fill:#102333;
      stroke:#42677b;
      stroke-width:1.3;
    }

    #${ROOT_ID} .edge {
      stroke:var(--cyan);
      opacity:.3;
    }

    #${ROOT_ID} .route-halo {
      fill:none;
      stroke:var(--cyan);
      stroke-width:15;
      opacity:.07;
    }

    #${ROOT_ID} .route {
      fill:none;
      stroke:var(--cyan);
      stroke-width:3.5;
      stroke-linecap:round;
      stroke-linejoin:round;
      stroke-dasharray:11 8;

      animation:rv5route 1.3s linear infinite;

      filter:
        drop-shadow(
          0 0 5px
          rgba(101,232,255,.8)
        );
    }

    @keyframes rv5route {
      to {
        stroke-dashoffset:-38;
      }
    }

    #${ROOT_ID} .route-core {
      fill:none;
      stroke:#effcff;
      stroke-width:1;
      opacity:.75;
    }

    #${ROOT_ID} .start {
      fill:var(--green);
      stroke:#efffd9;
      stroke-width:2;
    }

    #${ROOT_ID} .goal {
      fill:var(--yellow);
      stroke:#fff0c7;
      stroke-width:2;
    }

    #${ROOT_ID} .player {
      fill:#effcff;
      stroke:var(--cyan);
      stroke-width:2;
    }

    #${ROOT_ID} .player-ring {
      fill:none;
      stroke:var(--cyan);
      stroke-width:1.5;
      stroke-dasharray:4 5;

      animation:rv5ring 2s linear infinite;
      transform-origin:center;
    }

    @keyframes rv5ring {
      to {
        transform:rotate(360deg);
      }
    }

    #${ROOT_ID} .checkpoint {
      fill:none;
      stroke:var(--cyan);
      stroke-width:1.5;
    }

    #${ROOT_ID} .checkpoint-dot {
      fill:var(--cyan);
    }

    #${ROOT_ID} .danger-object {
      fill:#301a27;
      stroke:var(--red);
      stroke-width:1.5;
    }

    #${ROOT_ID} .signal {
      fill:var(--yellow);
    }

    #${ROOT_ID} .label {
      fill:#7895a4;
      font-family:ui-monospace,monospace;
      font-size:9px;
      font-weight:800;
      letter-spacing:.1em;
    }

    #${ROOT_ID} .guide {
      fill:var(--cyan);
      font-family:ui-monospace,monospace;
      font-size:8px;
      font-weight:900;
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

    @media(prefers-reduced-motion:reduce) {

      #${ROOT_ID} *,
      #${ROOT_ID} *::before,
      #${ROOT_ID} *::after {
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

    const sx = 920 / Math.max(width, 1);
    const sy = 430 / Math.max(height, 1);

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

    const point = item => {

      if (Array.isArray(item)) {
        return {
          x:X(item[0]),
          y:Y(item[1])
        };
      }

      return {
        x:X(item?.x),
        y:Y(item?.y)
      };
    };

    const rect = item => {

      if (Array.isArray(item)) {

        return {
          x:X(item[0]),
          y:Y(item[1]),
          w:Math.max(4, num(item[2],40) * sx),
          h:Math.max(3, num(item[3],20) * sy)
        };
      }

      return {
        x:X(item?.x),
        y:Y(item?.y),
        w:Math.max(4,num(item?.width ?? item?.w,40) * sx),
        h:Math.max(3,num(item?.height ?? item?.h,20) * sy)
      };
    };

    const arr = key =>
      Array.isArray(m?.[key])
        ? m[key]
        : [];

    return {

      X,
      Y,
      point,
      rect,

      points:{
        start:point(
          m?.spawn || {x:120,y:520}
        ),

        goal:point(
          m?.goal || {x:6100,y:500}
        ),

        player:point(
          scene?.player || m?.spawn || {x:120,y:520}
        )
      },

      platforms:arr('platforms'),
      obstacles:arr('obstacles'),
      movingGates:arr('movingGates'),
      enemies:arr('enemies'),
      signals:arr('signals'),
      secrets:arr('secrets'),
      checkpoints:arr('checkpoints'),
      boostPads:arr('boostPads'),
      guides:arr('guides')
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

    const routePoints = [
      d.points.start,
      ...d.checkpoints.map(d.point),
      d.points.goal
    ];

    const route =
      routePoints
        .map(
          (p,i) =>
            `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
        )
        .join(' ');

    const platforms =
      d.platforms
        .map(item => {

          const r = d.rect(item);

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

          const p = d.point(item);

          return `
            <path
              d="
                M ${p.x-9} ${p.y+8}
                L ${p.x} ${p.y-9}
                L ${p.x+9} ${p.y+8}
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

          const r = d.rect(item);

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
        .map((item,i) => {

          const p = d.point(item);

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
        })
        .join('');

    const signals =
      d.signals
        .map(item => {

          const p = d.point(item);

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

          const p = d.point(item);

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

          const p = d.point(item);

          return `
            <text
              x="${p.x}"
              y="${p.y-12}"
              class="guide">
              ${esc(item?.text || '')}
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
            stop-color="#06131e">
          </stop>

          <stop
            offset="55%"
            stop-color="#020a11">
          </stop>

          <stop
            offset="100%"
            stop-color="#010508">
          </stop>

        </linearGradient>

      </defs>

      <rect
        width="1000"
        height="560"
        fill="url(#rv5mapGradient)">
      </rect>

      ${grid()}

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

      ${platforms}
      ${gates}
      ${obstacles}
      ${signals}
      ${checkpoints}
      ${enemies}
      ${guides}

      <!-- START -->

      <g>

        <circle
          cx="${d.points.start.x}"
          cy="${d.points.start.y}"
          r="15"
          fill="none"
          stroke="#8df59b"
          opacity=".2">
        </circle>

        <circle
          cx="${d.points.start.x}"
          cy="${d.points.start.y}"
          r="8"
          class="start">
        </circle>

        <text
          x="${d.points.start.x+14}"
          y="${d.points.start.y+4}"
          class="label">
          START
        </text>

      </g>

      <!-- GOAL -->

      <g>

        <circle
          cx="${d.points.goal.x}"
          cy="${d.points.goal.y}"
          r="20"
          fill="none"
          stroke="#ffd76a"
          opacity=".2">
        </circle>

        <circle
          cx="${d.points.goal.x}"
          cy="${d.points.goal.y}"
          r="10"
          class="goal">
        </circle>

        <text
          x="${d.points.goal.x+18}"
          y="${d.points.goal.y+4}"
          class="label">
          OBJECTIVE
        </text>

      </g>

      <!-- PLAYER -->

      <g id="rv5-player">

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

        <text
          x="${d.points.player.x+13}"
          y="${d.points.player.y-12}"
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
