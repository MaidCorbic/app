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

      text-shadow:0 1px 8px rgba(0,0,0,.95);
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
      circle at 50% 50%,
      rgba(85,220,255,.13) 0%,
      rgba(25,100,125,.055) 26%,
      transparent 58%
    ),
    linear-gradient(
      180deg,
      #041722 0%,
      #020a10 52%,
      #010509 100%
    );

  border-top:1px solid rgba(101,232,255,.16);
  border-bottom:1px solid rgba(101,232,255,.16);

  box-shadow:
    inset 0 0 45px rgba(101,232,255,.035),
    inset 0 0 100px rgba(0,0,0,.22);
}

#${ROOT_ID} .rv5-map::before{
  content:"";
  position:absolute;
  inset:0;

  pointer-events:none;
  z-index:4;

  background:
    linear-gradient(
      90deg,
      transparent 49.8%,
      rgba(101,232,255,.08) 50%,
      transparent 50.2%
    ),
    linear-gradient(
      0deg,
      transparent 49.8%,
      rgba(101,232,255,.08) 50%,
      transparent 50.2%
    );

  opacity:.65;
}

    #${ROOT_ID} .rv5-svg{
      width:100%;
      height:100%;
      display:block;
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
      fill:#0c2432;
      stroke:#49778a;
      stroke-width:1.5;
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
    drop-shadow(0 0 10px rgba(101,232,255,.30));
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
    drop-shadow(0 0 5px rgba(101,232,255,.95))
    drop-shadow(0 0 14px rgba(101,232,255,.40));
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
    drop-shadow(0 0 6px rgba(141,245,155,.95))
    drop-shadow(0 0 16px rgba(141,245,155,.38));

  transform-box:fill-box;
  transform-origin:center;
}

#${ROOT_ID} .goal{
  fill:#ffd76a;

  stroke:#fff8ce;
  stroke-width:3;

  filter:
    drop-shadow(0 0 8px rgba(255,215,106,.95))
    drop-shadow(0 0 20px rgba(255,215,106,.42));

  transform-box:fill-box;
  transform-origin:center;
}

  #${ROOT_ID} .player{
  fill:#ffffff;
  stroke:#64ebff;
  stroke-width:3;

  filter:
    drop-shadow(0 0 5px rgba(100,235,255,.8))
    drop-shadow(0 0 13px rgba(100,235,255,.28));
}

#${ROOT_ID} .player-ring{
  fill:none;

  stroke:#6ff3ff;
  stroke-width:2.8;

  stroke-dasharray:7 5;

  opacity:1;

  filter:
    drop-shadow(0 0 5px rgba(100,235,255,.9))
    drop-shadow(0 0 15px rgba(100,235,255,.32));

  animation:
    rv5ring 1.35s linear infinite;
}

    #${ROOT_ID} .checkpoint{
  fill:rgba(100,235,255,.035);

  stroke:#64ebff;
  stroke-width:2;

  filter:
    drop-shadow(0 0 5px rgba(100,235,255,.35));
}

#${ROOT_ID} .checkpoint-dot{
  fill:#ffffff;

  filter:
    drop-shadow(0 0 5px rgba(100,235,255,.80));
}

   #${ROOT_ID} .danger-object{
  fill:#3a1725;

  stroke:#ff6577;
  stroke-width:2;

  filter:
    drop-shadow(0 0 5px rgba(255,104,119,.32));
}

    #${ROOT_ID} .signal{
      fill:#ffd76a;

      filter:
        drop-shadow(0 0 6px rgba(255,215,106,.55));
    }

    /* MAP TEXT */

    #${ROOT_ID} .label{
      fill:#f2fbff;

      font-family:
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;

     font-size:13px;
font-weight:950;
letter-spacing:.025em;

      paint-order:stroke;

      stroke:#02070b;
      stroke-width:3.5px;
      stroke-linejoin:round;

      text-shadow:
        0 2px 8px rgba(0,0,0,.95);
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
    drop-shadow(0 0 6px rgba(101,232,255,.95))
    drop-shadow(0 0 14px rgba(101,232,255,.38));
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

      text-shadow:0 2px 8px rgba(0,0,0,.95);
    }

    #${ROOT_ID} .rv5-map-label strong{
      color:#f2fbff;
      font-size:14px;
      line-height:1.15;
      font-weight:950;
      letter-spacing:.07em;

      text-shadow:0 2px 12px rgba(0,0,0,.95);
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
        0 0 18px rgba(101,232,255,.06),
        inset 0 0 14px rgba(101,232,255,.03);
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
      text-shadow:0 0 10px rgba(255,104,119,.20);
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
    inset 0 10px 30px rgba(101,232,255,.025);
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
        0 0 10px rgba(101,232,255,.08);
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
        letter-spacing:.06em !important;
      }

      /* MAP CORNER LABELS */

      #${ROOT_ID} .rv5-map-label small{
        font-size:8px !important;
        line-height:1.2 !important;
        font-weight:950 !important;
        letter-spacing:.06em !important;
      }

      #${ROOT_ID} .rv5-map-label strong{
        font-size:10px !important;
        line-height:1.15 !important;
        font-weight:950 !important;
        letter-spacing:.04em !important;
      }

      /* LIVE TAG */

      #${ROOT_ID} .rv5-live-tag{
        font-size:8px !important;
        line-height:1.1 !important;
        font-weight:950 !important;
        letter-spacing:.06em !important;
        padding:7px 9px !important;
      }

      /* STATS */

      #${ROOT_ID} .rv5-stats small{
        font-size:7px !important;
        line-height:1.15 !important;
        font-weight:900 !important;
        letter-spacing:.06em !important;
      }

      #${ROOT_ID} .rv5-stats strong{
        font-size:9px !important;
        line-height:1.15 !important;
        font-weight:950 !important;
        letter-spacing:.04em !important;
      }

      /* OBJECTIVE */

      #${ROOT_ID} .rv5-objective small{
        font-size:7px !important;
        line-height:1.15 !important;
        font-weight:950 !important;
      }

      #${ROOT_ID} .objective-text{
        font-size:10px !important;
        line-height:1.2 !important;
        font-weight:950 !important;
        letter-spacing:.02em !important;
      }

      /* REAL MAP LABELS */

      #${ROOT_ID} .label{
        font-size:11px !important;
        line-height:1 !important;
        font-weight:950 !important;
        letter-spacing:.015em !important;

        paint-order:stroke !important;
        stroke:#02070b !important;
        stroke-width:3.2px !important;
        stroke-linejoin:round !important;
      }

      #${ROOT_ID} .guide{
        font-size:10px !important;
        line-height:1 !important;
        font-weight:950 !important;
        letter-spacing:.01em !important;

        paint-order:stroke !important;
        stroke:#02070b !important;
        stroke-width:2.8px !important;
        stroke-linejoin:round !important;
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

    <!-- MAIN MAP BACKGROUND -->
    <linearGradient
      id="rv5MapBg"
      x1="0"
      y1="0"
      x2="0"
      y2="1">

      <stop
        offset="0%"
        stop-color="#08141d">
      </stop>

      <stop
        offset="48%"
        stop-color="#030a10">
      </stop>

      <stop
        offset="100%"
        stop-color="#010406">
      </stop>

    </linearGradient>

    <!-- VIGNETTE -->
    <radialGradient
      id="rv5MapVignette"
      cx="50%"
      cy="48%"
      r="75%">

      <stop
        offset="0%"
        stop-color="#173344"
        stop-opacity=".08">
      </stop>

      <stop
        offset="68%"
        stop-color="#000"
        stop-opacity=".12">
      </stop>

      <stop
        offset="100%"
        stop-color="#000"
        stop-opacity=".72">
      </stop>

    </radialGradient>

    <!-- PLAYER / ROUTE GLOW -->
    <filter
      id="rv5Glow"
      x="-100%"
      y="-100%"
      width="300%"
      height="300%">

      <feGaussianBlur
        stdDeviation="4"
        result="blur">
      </feGaussianBlur>

      <feMerge>
        <feMergeNode in="blur"></feMergeNode>
        <feMergeNode in="SourceGraphic"></feMergeNode>
      </feMerge>

    </filter>

    <!-- SOFT GLOW -->
    <filter
      id="rv5SoftGlow"
      x="-100%"
      y="-100%"
      width="300%"
      height="300%">

      <feGaussianBlur
        stdDeviation="8">
      </feGaussianBlur>

    </filter>

    <!-- CLIP -->
    <clipPath id="rv5MapClip">
      <rect
        x="0"
        y="0"
        width="1000"
        height="560"
        rx="10">
      </rect>
    </clipPath>

    <!-- GRID -->
    <pattern
      id="rv5GridSmall"
      width="20"
      height="20"
      patternUnits="userSpaceOnUse">

      <path
        d="M 20 0 L 0 0 0 20"
        fill="none"
        stroke="#2f5367"
        stroke-width=".6"
        opacity=".20">
      </path>

    </pattern>

    <pattern
      id="rv5GridLarge"
      width="100"
      height="100"
      patternUnits="userSpaceOnUse">

      <path
        d="M 100 0 L 0 0 0 100"
        fill="none"
        stroke="#3e657a"
        stroke-width="1"
        opacity=".18">
      </path>

    </pattern>

    <!-- AREA GLOW -->
    <radialGradient
      id="rv5DangerGlow">

      <stop
        offset="0%"
        stop-color="#ff4058"
        stop-opacity=".24">
      </stop>

      <stop
        offset="100%"
        stop-color="#ff4058"
        stop-opacity="0">
      </stop>

    </radialGradient>

  </defs>


  <!-- ===================================== -->
  <!-- MAP FOUNDATION -->
  <!-- ===================================== -->

  <g clip-path="url(#rv5MapClip)">

    <rect
      x="0"
      y="0"
      width="1000"
      height="560"
      fill="url(#rv5MapBg)">
    </rect>


    <!-- MICRO GRID -->

    <rect
      x="0"
      y="0"
      width="1000"
      height="560"
      fill="url(#rv5GridSmall)">
    </rect>


    <!-- MAJOR GRID -->

    <rect
      x="0"
      y="0"
      width="1000"
      height="560"
      fill="url(#rv5GridLarge)">
    </rect>


    <!-- TOP / BOTTOM MAP STRIPS -->

    <rect
      x="0"
      y="0"
      width="1000"
      height="30"
      fill="#02070b"
      opacity=".78">
    </rect>

    <rect
      x="0"
      y="530"
      width="1000"
      height="30"
      fill="#02070b"
      opacity=".82">
    </rect>


    <!-- MAP CORNER ACCENTS -->

    <path
      d="M 20 66 L 20 20 L 66 20"
      fill="none"
      stroke="#6de7ff"
      stroke-width="2"
      opacity=".65">
    </path>

    <path
      d="M 934 20 L 980 20 L 980 66"
      fill="none"
      stroke="#6de7ff"
      stroke-width="2"
      opacity=".65">
    </path>

    <path
      d="M 20 494 L 20 540 L 66 540"
      fill="none"
      stroke="#6de7ff"
      stroke-width="2"
      opacity=".42">
    </path>

    <path
      d="M 934 540 L 980 540 L 980 494"
      fill="none"
      stroke="#6de7ff"
      stroke-width="2"
      opacity=".42">
    </path>


    <!-- ===================================== -->
    <!-- TACTICAL SECTOR LINES -->
    <!-- ===================================== -->

    <g
      fill="none"
      stroke="#75b8d1"
      stroke-width="1"
      opacity=".13">

      <path d="M 120 30 L 120 530"></path>
      <path d="M 240 30 L 240 530"></path>
      <path d="M 360 30 L 360 530"></path>
      <path d="M 480 30 L 480 530"></path>
      <path d="M 600 30 L 600 530"></path>
      <path d="M 720 30 L 720 530"></path>
      <path d="M 840 30 L 840 530"></path>

      <path d="M 0 110 L 1000 110"></path>
      <path d="M 0 190 L 1000 190"></path>
      <path d="M 0 270 L 1000 270"></path>
      <path d="M 0 350 L 1000 350"></path>
      <path d="M 0 430 L 1000 430"></path>

    </g>


    <!-- ===================================== -->
    <!-- TACTICAL ROAD / BLOCK STRUCTURES -->
    <!-- ===================================== -->

    <g
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round">

      <!-- PRIMARY ROADS -->

      <path
        d="M 70 130
           L 205 155
           L 320 135
           L 460 180
           L 610 145
           L 755 185
           L 920 130"
        stroke="#304c59"
        stroke-width="18"
        opacity=".20">
      </path>

      <path
        d="M 95 440
           L 215 390
           L 350 420
           L 500 365
           L 655 405
           L 810 350
           L 930 400"
        stroke="#2e4a57"
        stroke-width="17"
        opacity=".18">
      </path>

      <!-- ROAD CENTERLINES -->

      <path
        d="M 70 130
           L 205 155
           L 320 135
           L 460 180
           L 610 145
           L 755 185
           L 920 130"
        stroke="#557888"
        stroke-width="1.5"
        stroke-dasharray="8 12"
        opacity=".26">
      </path>

      <path
        d="M 95 440
           L 215 390
           L 350 420
           L 500 365
           L 655 405
           L 810 350
           L 930 400"
        stroke="#557888"
        stroke-width="1.5"
        stroke-dasharray="8 12"
        opacity=".22">
      </path>

    </g>


    <!-- ===================================== -->
    <!-- WORLD BLOCKS -->
    <!-- ===================================== -->

    <g>

      <rect
        x="82"
        y="205"
        width="130"
        height="55"
        rx="3"
        fill="#0a1821"
        stroke="#2a5669"
        stroke-width="1"
        opacity=".88">
      </rect>

      <rect
        x="245"
        y="72"
        width="145"
        height="66"
        rx="3"
        fill="#0a1821"
        stroke="#2b586b"
        stroke-width="1"
        opacity=".86">
      </rect>

      <rect
        x="420"
        y="220"
        width="120"
        height="74"
        rx="3"
        fill="#09161f"
        stroke="#2e6174"
        stroke-width="1"
        opacity=".90">
      </rect>

      <rect
        x="590"
        y="76"
        width="155"
        height="60"
        rx="3"
        fill="#0a1821"
        stroke="#2b586b"
        stroke-width="1"
        opacity=".88">
      </rect>

      <rect
        x="760"
        y="235"
        width="150"
        height="82"
        rx="3"
        fill="#09161f"
        stroke="#315f70"
        stroke-width="1"
        opacity=".90">
      </rect>

      <rect
        x="250"
        y="350"
        width="130"
        height="65"
        rx="3"
        fill="#08151e"
        stroke="#2e5868"
        stroke-width="1"
        opacity=".88">
      </rect>

      <rect
        x="620"
        y="350"
        width="120"
        height="68"
        rx="3"
        fill="#08151e"
        stroke="#2d5869"
        stroke-width="1"
        opacity=".88">
      </rect>

    </g>


    <!-- ===================================== -->
    <!-- BLOCK DETAILS -->
    <!-- ===================================== -->

    <g
      stroke="#538095"
      stroke-width="1"
      opacity=".16">

      <path d="M 96 220 H 198"></path>
      <path d="M 96 238 H 198"></path>
      <path d="M 96 256 H 198"></path>

      <path d="M 262 88 H 375"></path>
      <path d="M 262 108 H 375"></path>
      <path d="M 262 126 H 375"></path>

      <path d="M 435 238 H 525"></path>
      <path d="M 435 258 H 525"></path>
      <path d="M 435 278 H 525"></path>

      <path d="M 606 92 H 732"></path>
      <path d="M 606 111 H 732"></path>

      <path d="M 775 255 H 895"></path>
      <path d="M 775 276 H 895"></path>
      <path d="M 775 298 H 895"></path>

      <path d="M 265 370 H 365"></path>
      <path d="M 265 392 H 365"></path>

      <path d="M 635 370 H 725"></path>
      <path d="M 635 392 H 725"></path>

    </g>


    <!-- ===================================== -->
    <!-- DANGER ZONE GLOW -->
    <!-- ===================================== -->

    <circle
      cx="${d.points.goal.x}"
      cy="${d.points.goal.y}"
      r="82"
      fill="url(#rv5DangerGlow)"
      opacity=".45">
    </circle>


    <!-- ===================================== -->
    <!-- ROUTE GLOW -->
    <!-- ===================================== -->

    <path
      d="${route}"
      class="route-halo"
      fill="none"
      stroke="#56ddff"
      stroke-width="20"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity=".09"
      filter="url(#rv5SoftGlow)">
    </path>

    <path
      d="${route}"
      class="route-halo"
      fill="none"
      stroke="#54ddff"
      stroke-width="10"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity=".14"
      filter="url(#rv5Glow)">
    </path>

    <path
      d="${route}"
      class="route"
      fill="none"
      stroke="#55dfff"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-dasharray="5 8"
      opacity=".88">
    </path>

    <path
      d="${route}"
      class="route-core"
      fill="none"
      stroke="#d9fbff"
      stroke-width="1"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity=".72">
    </path>


    <!-- ===================================== -->
    <!-- MAP OBJECTS -->
    <!-- ===================================== -->

    ${platforms}
    ${gates}
    ${obstacles}
    ${signals}


    <!-- ===================================== -->
    <!-- CHECKPOINTS -->
    <!-- ===================================== -->

    ${d.checkpoints.map((item, i) => {

      const p = d.point(item);

      return `

        <g>

          <circle
            cx="${p.x}"
            cy="${p.y}"
            r="23"
            fill="none"
            stroke="#58dbff"
            stroke-width="1"
            stroke-dasharray="3 5"
            opacity=".22">
          </circle>

          <circle
            cx="${p.x}"
            cy="${p.y}"
            r="17"
            class="checkpoint">
          </circle>

          <circle
            cx="${p.x}"
            cy="${p.y}"
            r="5"
            class="checkpoint-dot">
          </circle>

          <text
            x="${p.x}"
            y="${p.y - 27}"
            text-anchor="middle"
            class="label"
            style="font-size:10px;letter-spacing:1.5px;">
            CP ${i + 1}
          </text>

        </g>

      `;

    }).join('')}


    <!-- ===================================== -->
    <!-- HOSTILES -->
    <!-- ===================================== -->

    ${d.enemies.map(item => {

      const p = d.point(item);

      return `

        <g>

          <circle
            cx="${p.x}"
            cy="${p.y}"
            r="23"
            fill="none"
            stroke="#ff4359"
            stroke-width="1"
            stroke-dasharray="2 5"
            opacity=".22">
          </circle>

          <circle
            cx="${p.x}"
            cy="${p.y}"
            r="13"
            fill="#ff4056"
            opacity=".08">
          </circle>

          <circle
            cx="${p.x}"
            cy="${p.y}"
            r="8"
            fill="#071017"
            stroke="#ff5265"
            stroke-width="2"
            filter="url(#rv5Glow)">
          </circle>

          <path
            d="
              M ${p.x-5} ${p.y}
              L ${p.x+5} ${p.y}
              M ${p.x} ${p.y-5}
              L ${p.x} ${p.y+5}
            "
            stroke="#ff7080"
            stroke-width="1.5">
          </path>

          <text
            x="${p.x + 17}"
            y="${p.y + 4}"
            class="label"
            style="
              fill:#ff7282;
              font-size:9px;
              letter-spacing:1.4px;
            ">
            HOSTILE
          </text>

        </g>

      `;

    }).join('')}


    <!-- ===================================== -->
    <!-- SIGNALS -->
    <!-- ===================================== -->

    ${d.signals.map(item => {

      const p = d.point(item);

      return `

        <g>

          <circle
            cx="${p.x}"
            cy="${p.y}"
            r="13"
            fill="none"
            stroke="#ffd85c"
            stroke-width="1"
            stroke-dasharray="2 4"
            opacity=".22">
          </circle>

          <circle
            cx="${p.x}"
            cy="${p.y}"
            r="4"
            class="signal">
          </circle>

          <circle
            cx="${p.x}"
            cy="${p.y}"
            r="1.7"
            fill="#fff3ab">
          </circle>

        </g>

      `;

    }).join('')}


    <!-- ===================================== -->
    <!-- START -->
    <!-- ===================================== -->

    <g>

      <circle
        cx="${d.points.start.x}"
        cy="${d.points.start.y}"
        r="26"
        fill="none"
        stroke="#73ff9c"
        stroke-width="1"
        stroke-dasharray="2 6"
        opacity=".30">
      </circle>

      <circle
        cx="${d.points.start.x}"
        cy="${d.points.start.y}"
        r="16"
        fill="#69ff94"
        opacity=".07">
      </circle>

      <circle
        cx="${d.points.start.x}"
        cy="${d.points.start.y}"
        r="9"
        class="start"
        filter="url(#rv5Glow)">
      </circle>

      <circle
        cx="${d.points.start.x}"
        cy="${d.points.start.y}"
        r="3"
        fill="#e8fff0">
      </circle>

      <text
        x="${d.points.start.x + 20}"
        y="${d.points.start.y - 10}"
        class="label"
        style="
          fill:#9affb2;
          font-size:11px;
          font-weight:700;
          letter-spacing:2px;
        ">
        START
      </text>

      <text
        x="${d.points.start.x + 20}"
        y="${d.points.start.y + 7}"
        class="label"
        style="
          fill:#6d8995;
          font-size:7px;
          letter-spacing:1px;
        ">
        DEPLOY
      </text>

    </g>


    <!-- ===================================== -->
    <!-- OBJECTIVE -->
    <!-- ===================================== -->

    <g>

      <circle
        cx="${d.points.goal.x}"
        cy="${d.points.goal.y}"
        r="35"
        fill="none"
        stroke="#ffd45b"
        stroke-width="1"
        stroke-dasharray="2 7"
        opacity=".34">
      </circle>

      <circle
        cx="${d.points.goal.x}"
        cy="${d.points.goal.y}"
        r="24"
        fill="none"
        stroke="#ffd45b"
        stroke-width="1.5"
        opacity=".40">
      </circle>

      <circle
        cx="${d.points.goal.x}"
        cy="${d.points.goal.y}"
        r="12"
        fill="#ffd45b"
        opacity=".09">
      </circle>

      <circle
        cx="${d.points.goal.x}"
        cy="${d.points.goal.y}"
        r="9"
        class="goal"
        filter="url(#rv5Glow)">
      </circle>

      <path
        d="
          M ${d.points.goal.x-6} ${d.points.goal.y}
          L ${d.points.goal.x+6} ${d.points.goal.y}
          M ${d.points.goal.x} ${d.points.goal.y-6}
          L ${d.points.goal.x} ${d.points.goal.y+6}
        "
        stroke="#fff3b2"
        stroke-width="1.5">
      </path>

      <text
        x="${d.points.goal.x + 23}"
        y="${d.points.goal.y - 8}"
        class="label"
        style="
          fill:#ffe28a;
          font-size:11px;
          font-weight:700;
          letter-spacing:2px;
        ">
        OBJECTIVE
      </text>

      <text
        x="${d.points.goal.x + 23}"
        y="${d.points.goal.y + 9}"
        class="label"
        style="
          fill:#8b7d55;
          font-size:7px;
          letter-spacing:1.3px;
        ">
        PRIMARY TARGET
      </text>

    </g>


    <!-- ===================================== -->
    <!-- PLAYER -->
    <!-- ===================================== -->

    <g id="rv5-player">

      <circle
        cx="${d.points.player.x}"
        cy="${d.points.player.y}"
        r="29"
        fill="none"
        stroke="#63eaff"
        stroke-width="1"
        stroke-dasharray="2 6"
        opacity=".24">
      </circle>

      <circle
        cx="${d.points.player.x}"
        cy="${d.points.player.y}"
        r="18"
        fill="#5de4ff"
        opacity=".08">
      </circle>

      <circle
        cx="${d.points.player.x}"
        cy="${d.points.player.y}"
        r="11"
        class="player-ring"
        filter="url(#rv5Glow)">
      </circle>

      <circle
        cx="${d.points.player.x}"
        cy="${d.points.player.y}"
        r="6"
        class="player">
      </circle>

      <path
        d="
          M ${d.points.player.x} ${d.points.player.y-18}
          L ${d.points.player.x} ${d.points.player.y-11}
          M ${d.points.player.x} ${d.points.player.y+11}
          L ${d.points.player.x} ${d.points.player.y+18}
          M ${d.points.player.x-18} ${d.points.player.y}
          L ${d.points.player.x-11} ${d.points.player.y}
          M ${d.points.player.x+11} ${d.points.player.y}
          L ${d.points.player.x+18} ${d.points.player.y}
        "
        stroke="#8cefff"
        stroke-width="1.2"
        opacity=".75">
      </path>

      <text
        x="${d.points.player.x + 17}"
        y="${d.points.player.y - 15}"
        class="label"
        style="
          fill:#94edff;
          font-size:10px;
          font-weight:700;
          letter-spacing:1.8px;
        ">
        YOU
      </text>

      <text
        x="${d.points.player.x + 17}"
        y="${d.points.player.y + 1}"
        class="label"
        style="
          fill:#63818c;
          font-size:7px;
          letter-spacing:1px;
        ">
        OPERATOR
      </text>

    </g>


    <!-- ===================================== -->
    <!-- GUIDES -->
    <!-- ===================================== -->

    ${d.guides.map(item => {

      const p = d.point(item);

      return `

        <g>

          <line
            x1="${p.x}"
            y1="${p.y - 6}"
            x2="${p.x}"
            y2="${p.y - 18}"
            stroke="#81d9ea"
            stroke-width="1"
            opacity=".22">
          </line>

          <text
            x="${p.x}"
            y="${p.y - 23}"
            text-anchor="middle"
            class="guide">
            ${esc(item?.text || '')}
          </text>

        </g>

      `;

    }).join('')}


    <!-- ===================================== -->
    <!-- TACTICAL COORDINATES -->
    <!-- ===================================== -->

    <g
      fill="#7194a0"
      font-family="monospace"
      font-size="8"
      opacity=".40"
      letter-spacing="1">

      <text x="18" y="48">GRID 01</text>
      <text x="165" y="48">GRID 02</text>
      <text x="315" y="48">GRID 03</text>
      <text x="465" y="48">GRID 04</text>
      <text x="615" y="48">GRID 05</text>
      <text x="765" y="48">GRID 06</text>
      <text x="915" y="48">GRID 07</text>

    </g>


    <!-- ===================================== -->
    <!-- SCAN LINE -->
    <!-- ===================================== -->

    <rect
      x="0"
      y="0"
      width="1000"
      height="2"
      fill="#6ee7ff"
      opacity=".08">
    </rect>


    <!-- ===================================== -->
    <!-- VIGNETTE -->
    <!-- ===================================== -->

    <rect
      x="0"
      y="0"
      width="1000"
      height="560"
      fill="url(#rv5MapVignette)">
    </rect>

  </g>

`;

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
