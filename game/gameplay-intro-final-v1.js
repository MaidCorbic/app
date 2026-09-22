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

      <div class="rv5-telemetry">

        <span>
          NODE
          <b>04</b>
        </span>

        <span>
          SIGNAL
          <b>98%</b>
        </span>

        <span>
          LINK
          <b>STABLE</b>
        </span>

      </div>

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

            <strong>15</strong>
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
            <strong>RELAY TACTICAL WORLD</strong>
          </div>

          <div class="rv5-map-legend">

  <span><i class="you"></i>YOU</span>
  <span><i class="start"></i>START</span>
  <span><i class="cp"></i>CP</span>
  <span><i class="objective"></i>GOAL</span>
  <span><i class="hostile"></i>HOSTILE</span>

</div>

<div class="rv5-live-tag">
            <i></i>
            REAL LEVEL ROUTE
          </div>

        </div>

        <div class="rv5-stats">

          <div>
            <small>MAP SOURCE</small>
           <strong>RELAY TACTICAL</strong>
          </div>

          <div>
          <small>ROUTE</small>
          <strong class="rv5-route-distance">CALCULATING</strong>
</div>
         <div>
  <small>THREAT</small>
  <strong class="danger rv5-threat-status">ACTIVE</strong>
</div>

<div class="rv5-eta-stat">
  <small>ETA</small>
  <strong class="rv5-eta">--</strong>
</div>

        </div>

      </main>

      <footer class="rv5-footer">

  <div class="rv5-route-progress">

    <div class="rv5-route-progress-head">
      <span>ROUTE PROGRESS</span>
      <strong class="rv5-route-progress-value">0%</strong>
    </div>

    <div class="rv5-route-progress-line">

      <i class="done"></i>
      <i></i>
      <i></i>
      <i></i>
      <i class="goal"></i>

    </div>

    <div class="rv5-route-progress-labels">
      <span>START</span>
      <span>CP1</span>
      <span>CP2</span>
      <span>CP3</span>
      <span>GOAL</span>
    </div>

  </div>

        <div class="rv5-objective">

          <div class="rv5-objective-icon">
            ◆
          </div>

          <div>
            <small>PRIMARY OBJECTIVE // <b class="rv5-objective-status">PENDING</b></small>
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
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800;900&display=swap');

/* ============================================================
   RELAY RUNNER V6 — PREMIUM TACTICAL MAP REDESIGN
   ============================================================ */

/* ---------- GLOBAL ORBITRON ---------- */

#${ROOT_ID},
#${ROOT_ID} *,
#${ROOT_ID} svg text{
  font-family:"Orbitron",sans-serif !important;
}


/* ---------- MAIN SHELL ---------- */

#${ROOT_ID} .rv5-shell{
  border:1px solid rgba(116,220,229,.22) !important;

  background:
    linear-gradient(
      145deg,
      rgba(4,11,15,.98),
      rgba(2,6,10,.99) 55%,
      rgba(1,4,7,1)
    ) !important;

  box-shadow:
    0 35px 110px rgba(0,0,0,.88),
    0 0 80px rgba(0,190,255,.06),
    inset 0 0 60px rgba(0,190,255,.025) !important;
}


/* ---------- HEADER ---------- */

#${ROOT_ID} .rv5-header{
  background:
    linear-gradient(
      180deg,
      rgba(4,13,19,.98),
      rgba(3,8,12,.96)
    ) !important;

  border-bottom:1px solid rgba(116,220,229,.16) !important;
}

#${ROOT_ID} .rv5-live{
  color:#8cecff !important;
}

#${ROOT_ID} .rv5-kicker{
  color:#55dff0 !important;
  font-size:10px !important;
  letter-spacing:.20em !important;
}

#${ROOT_ID} h1{
  font-family:"Orbitron",sans-serif !important;
  font-weight:800 !important;
  letter-spacing:.055em !important;
  text-shadow:
    0 0 18px rgba(0,220,255,.12),
    0 4px 14px rgba(0,0,0,.95) !important;
}

#${ROOT_ID} h1 strong{
  color:#7deaff !important;
}


/* ---------- ROUTE STATUS ---------- */

#${ROOT_ID} .rv5-status{
  border:1px solid rgba(116,220,229,.20) !important;
  border-top:2px solid #39ff88 !important;

  background:
    linear-gradient(
      145deg,
      rgba(5,18,22,.96),
      rgba(3,8,12,.98)
    ) !important;

  box-shadow:
    inset 0 0 24px rgba(0,220,255,.035),
    0 12px 30px rgba(0,0,0,.45) !important;
}

#${ROOT_ID} .rv5-status strong{
  color:#39ff88 !important;
  font-family:"Orbitron",sans-serif !important;
}


/* ---------- DEPLOYMENT TIMER ---------- */

#${ROOT_ID} .rv5-timer{
  border:1px solid rgba(255,205,76,.62) !important;

  background:
    radial-gradient(
      circle at center,
      rgba(255,205,76,.08),
      rgba(6,12,15,.98) 65%
    ) !important;

  box-shadow:
    0 0 25px rgba(255,205,76,.08),
    inset 0 0 30px rgba(255,205,76,.035) !important;
}

#${ROOT_ID} .rv5-timer strong{
  font-family:"Orbitron",sans-serif !important;
  font-weight:800 !important;
  color:#f7fbff !important;
  text-shadow:
    0 0 14px rgba(255,214,94,.25) !important;
}


/* ============================================================
   MAP — NEW PREMIUM DISPLAY
   ============================================================ */

#${ROOT_ID} .rv5-map{
  background:
    radial-gradient(
      ellipse at 50% 48%,
      rgba(20,76,86,.24),
      transparent 46%
    ),
    radial-gradient(
      ellipse at 20% 80%,
      rgba(0,160,190,.08),
      transparent 35%
    ),
    linear-gradient(
      145deg,
      #061016,
      #02080c 62%,
      #010508
    ) !important;

  border-top:1px solid rgba(100,220,235,.14) !important;
  border-bottom:1px solid rgba(100,220,235,.14) !important;

  box-shadow:
    inset 0 0 100px rgba(0,0,0,.82),
    inset 0 0 30px rgba(0,190,255,.035) !important;
}


/* ---------- MAP GRID ---------- */

#${ROOT_ID} .grid{
  stroke:#24515b !important;
  stroke-width:.8 !important;
  opacity:.34 !important;
}

#${ROOT_ID} .grid-major{
  stroke:#43818b !important;
  stroke-width:1.2 !important;
  opacity:.38 !important;
}


/* ---------- BUILDINGS ---------- */

#${ROOT_ID} .platform{
  fill:#102127 !important;
  stroke:#5c8990 !important;
  stroke-width:1.25 !important;

  filter:
    drop-shadow(0 2px 4px rgba(0,0,0,.65)) !important;
}

#${ROOT_ID} .building-inner{
  fill:#172d33 !important;
  stroke:#284a51 !important;
  stroke-width:1px !important;
  opacity:.98 !important;
}

#${ROOT_ID} .building-edge-bottom{
  stroke:#73a8ad !important;
  opacity:.22 !important;
}


/* ---------- BUILDING HIGHLIGHT ---------- */

#${ROOT_ID} .tactical-building:hover .platform{
  stroke:#7deaff !important;
  filter:
    drop-shadow(0 0 5px rgba(0,220,255,.25)) !important;
}


/* ---------- ROUTE ---------- */

#${ROOT_ID} .route-halo{
  stroke:#00d9ff !important;
  stroke-width:25 !important;
  opacity:.075 !important;

  filter:
    drop-shadow(0 0 12px rgba(0,220,255,.35)) !important;
}

#${ROOT_ID} .route{
  stroke:#ffd75c !important;
  stroke-width:4.5 !important;
  stroke-dasharray:12 7 !important;

  filter:
    drop-shadow(0 0 5px rgba(255,210,80,.72))
    drop-shadow(0 0 14px rgba(255,210,80,.18)) !important;
}

#${ROOT_ID} .route-core{
  stroke:#fff8d7 !important;

  stroke-width:1.15 !important;

  stroke-linecap:round !important;

  opacity:.82 !important;

  filter:
    drop-shadow(
      0 0 4px rgba(255,248,215,.35)
    ) !important;
}

/* ---------- START ---------- */

#${ROOT_ID} .start{
  fill:#39ff88 !important;
  stroke:#dffff0 !important;
  stroke-width:2.5 !important;

  filter:
    drop-shadow(0 0 7px rgba(57,255,136,.9))
    drop-shadow(0 0 18px rgba(57,255,136,.35)) !important;
}

#${ROOT_ID} .start-ring{
  stroke:#39ff88 !important;
  stroke-width:1.7 !important;
  opacity:.85 !important;
}


/* ---------- GOAL ---------- */

#${ROOT_ID} .goal{
  fill:#ffd34f !important;
  stroke:#fff7cf !important;
  stroke-width:2.5 !important;

  filter:
    drop-shadow(0 0 7px rgba(255,211,79,.95))
    drop-shadow(0 0 20px rgba(255,190,40,.35)) !important;
}

#${ROOT_ID} .goal-ring{
  stroke:#ffd34f !important;
  stroke-width:1.8 !important;
}


/* ---------- PLAYER ---------- */

#${ROOT_ID} .player{
  fill:#f8ffff !important;
  stroke:#00eaff !important;
  stroke-width:2.8 !important;

  filter:
    drop-shadow(0 0 7px rgba(0,234,255,.95))
    drop-shadow(0 0 18px rgba(0,180,255,.32)) !important;
}

#${ROOT_ID} .player-ring{
  stroke:#00eaff !important;
  stroke-width:2 !important;
}


/* ---------- CHECKPOINTS ---------- */

#${ROOT_ID} .checkpoint{
  fill:rgba(0,220,255,.075) !important;
  stroke:#5eeaff !important;
  stroke-width:2 !important;

  filter:
    drop-shadow(0 0 5px rgba(0,220,255,.42)) !important;
}

#${ROOT_ID} .checkpoint-dot{
  fill:#eaffff !important;

  filter:
    drop-shadow(0 0 7px rgba(0,234,255,.95)) !important;
}


/* ---------- HOSTILE AREAS ---------- */

#${ROOT_ID} .hostile-pulse{
  stroke:#ff4058 !important;
  stroke-width:1.5 !important;
  opacity:.40 !important;
}

#${ROOT_ID} .danger-object{
  fill:#32131a !important;
  stroke:#ff4058 !important;

  filter:
    drop-shadow(0 0 7px rgba(255,50,80,.42)) !important;
}

#${ROOT_ID} .hostile-cross,
#${ROOT_ID} .enemy-cross{
  stroke:#ff7283 !important;
}


/* ---------- MAP LABELS ---------- */

#${ROOT_ID} .label,
#${ROOT_ID} .guide,
#${ROOT_ID} .goal-label,
#${ROOT_ID} #rv5-player text{
  font-family:"Orbitron",sans-serif !important;
  paint-order:stroke fill !important;
}

#${ROOT_ID} .label{
  fill:#dffaff !important;
  font-size:10px !important;
  font-weight:700 !important;
  letter-spacing:.055em !important;
}

#${ROOT_ID} .goal-label{
  fill:#ffd85c !important;
  font-weight:800 !important;
}

#${ROOT_ID} .guide{
  fill:#a8dce2 !important;
  font-size:9px !important;
  font-weight:600 !important;
}


/* ============================================================
   MAP HUD OVERLAY
   ============================================================ */

#${ROOT_ID} .rv5-map-label{
  border-left:2px solid #00dfff !important;

  background:
    linear-gradient(
      90deg,
      rgba(0,35,45,.82),
      rgba(2,10,14,.72)
    ) !important;

  box-shadow:
    0 8px 30px rgba(0,0,0,.48),
    inset 0 0 20px rgba(0,220,255,.035) !important;

  backdrop-filter:blur(8px) !important;
}

#${ROOT_ID} .rv5-map-label.bottom{
  border-left:0 !important;
  border-right:2px solid #00dfff !important;
}

#${ROOT_ID} .rv5-map-label small{
  color:#5f9da6 !important;
  font-family:"Orbitron",sans-serif !important;
}

#${ROOT_ID} .rv5-map-label strong{
  color:#dffaff !important;
  font-family:"Orbitron",sans-serif !important;
}


/* ---------- LIVE TAG ---------- */

#${ROOT_ID} .rv5-map-legend{
  position:absolute !important;
  right:20px !important;
  bottom:20px !important;
  z-index:24 !important;

  display:flex !important;
  align-items:center !important;
  gap:10px !important;

  padding:7px 10px !important;

  border:1px solid rgba(190,198,188,.12) !important;
  background:rgba(3,7,7,.78) !important;

  backdrop-filter:blur(7px) !important;

  font-family:"Orbitron",sans-serif !important;
  font-size:6px !important;
  font-weight:800 !important;
  letter-spacing:.10em !important;
  color:#7e8981 !important;
}

#${ROOT_ID} .rv5-map-legend span{
  display:flex !important;
  align-items:center !important;
  gap:4px !important;
}

#${ROOT_ID} .rv5-map-legend i{
  width:5px !important;
  height:5px !important;
  display:block !important;
  border-radius:50% !important;
}

#${ROOT_ID} .rv5-map-legend .you{
  background:#74dce5 !important;
}

#${ROOT_ID} .rv5-map-legend .start{
  background:#78c879 !important;
}

#${ROOT_ID} .rv5-map-legend .cp{
  background:#74dce5 !important;
}

#${ROOT_ID} .rv5-map-legend .objective{
  background:#f0cf69 !important;
}

#${ROOT_ID} .rv5-map-legend .hostile{
  background:#e45c63 !important;
}

#${ROOT_ID} .rv5-live-tag{
  border:1px solid rgba(57,255,136,.25) !important;

  background:
    linear-gradient(
      90deg,
      rgba(5,30,22,.88),
      rgba(3,11,10,.82)
    ) !important;

  color:#39ff88 !important;

  box-shadow:
    0 8px 28px rgba(0,0,0,.4),
    0 0 18px rgba(57,255,136,.05) !important;
}

/* ============================================================
   PREMIUM TACTICAL HUD — FINAL POLISH
   Does NOT change SVG / route / gameplay
   ============================================================ */


/* ============================================================
   01 — HEADER: CLEANER + MORE COMPACT
   ============================================================ */

#${ROOT_ID} .rv5-shell{
  grid-template-rows:
    150px
    minmax(0,1fr)
    auto !important;
}


/* Header */
#${ROOT_ID} .rv5-header{
  padding:16px 22px 14px !important;
  gap:20px !important;

  background:
    linear-gradient(
      180deg,
      rgba(7,13,15,.99),
      rgba(4,9,11,.97),
      rgba(2,6,8,.92)
    ) !important;

  border-bottom:
    1px solid
    rgba(116,220,229,.18) !important;

  box-shadow:
    inset 0 -1px 0 rgba(213,181,83,.05),
    0 12px 35px rgba(0,0,0,.35) !important;
}


/* Left header block */
#${ROOT_ID} .rv5-brand{
  gap:6px !important;
  max-width:calc(100% - 350px) !important;
}


/* LIVE */
#${ROOT_ID} .rv5-live{
  color:#91e9ee !important;
  font-size:8px !important;
  letter-spacing:.20em !important;
}

#${ROOT_ID} .rv5-live b{
  width:6px !important;
  height:6px !important;
  flex-basis:6px !important;

  box-shadow:
    0 0 7px rgba(57,255,136,.9),
    0 0 16px rgba(57,255,136,.35) !important;
}


/* Small tactical kicker */
#${ROOT_ID} .rv5-kicker{
  margin-top:6px !important;

  color:#63dbe6 !important;

  font-size:8px !important;
  letter-spacing:.22em !important;

  text-shadow:
    0 0 10px rgba(0,220,255,.16) !important;
}


/* ============================================================
   02 — MISSION ROUTE TITLE
   ============================================================ */

#${ROOT_ID} h1{
  margin:5px 0 0 !important;

  font-size:
    clamp(28px,3.1vw,42px) !important;

  line-height:.94 !important;

  letter-spacing:.075em !important;

  text-shadow:
    0 0 22px rgba(0,220,255,.08),
    0 5px 18px rgba(0,0,0,.95) !important;
}


#${ROOT_ID} h1 strong{
  color:#7deaff !important;

  text-shadow:
    0 0 16px rgba(0,220,255,.22),
    0 0 30px rgba(0,220,255,.08) !important;
}


/* Mission subtitle */
#${ROOT_ID} .rv5-meta{
  margin:8px 0 0 !important;

  color:#b7c4bd !important;

  font-size:9px !important;
  font-weight:800 !important;

  letter-spacing:.15em !important;

  text-shadow:
    0 2px 8px rgba(0,0,0,.8) !important;
}


/* ============================================================
   03 — RIGHT COMMAND HUD
   ============================================================ */

#${ROOT_ID} .rv5-right{
  gap:8px !important;
}


/* Route status */
#${ROOT_ID} .rv5-status{
  min-width:165px !important;
  min-height:76px !important;

  padding:11px 13px !important;

  border:
    1px solid
    rgba(116,220,229,.18) !important;

  border-top:
    2px solid
    #39ff88 !important;

  background:
    linear-gradient(
      145deg,
      rgba(8,19,21,.98),
      rgba(3,8,10,.99)
    ) !important;

  box-shadow:
    inset 0 0 25px rgba(0,220,255,.035),
    0 12px 30px rgba(0,0,0,.42) !important;
}


/* Status title */
#${ROOT_ID} .rv5-status small{
  font-size:6px !important;
  letter-spacing:.21em !important;
}


/* LOCKED */
#${ROOT_ID} .rv5-status strong{
  color:#7cff9c !important;
  font-size:16px !important;

  text-shadow:
    0 0 12px rgba(57,255,136,.20) !important;
}


/* ============================================================
   04 — MAP TOP BAR
   ============================================================ */

#${ROOT_ID} .rv5-mapbar{
  min-height:44px !important;

  padding:0 16px !important;

  background:
    linear-gradient(
      180deg,
      rgba(10,17,18,.99),
      rgba(4,9,10,1)
    ) !important;

  border-top:
    1px solid
    rgba(213,181,83,.16) !important;

  border-bottom:
    1px solid
    rgba(116,220,229,.20) !important;
}


/* MAP BAR BUTTONS */
#${ROOT_ID} .rv5-mapbar span{
  min-height:27px !important;

  padding:0 10px !important;

  font-size:7px !important;

  letter-spacing:.15em !important;

  border:
    1px solid
    rgba(190,200,190,.12) !important;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.025),
      rgba(255,255,255,.005)
    ) !important;
}


/* ACTIVE */
#${ROOT_ID} .rv5-mapbar span.active{
  color:#9ee7a1 !important;

  border-color:
    rgba(57,255,136,.38) !important;

  background:
    linear-gradient(
      180deg,
      rgba(57,255,136,.11),
      rgba(57,255,136,.018)
    ) !important;

  box-shadow:
    0 0 15px rgba(57,255,136,.06),
    inset 0 0 12px rgba(57,255,136,.035) !important;
}


/* ROUTE ACTIVE */
#${ROOT_ID} .rv5-mapbar b{
  min-height:27px !important;

  font-size:7px !important;

  letter-spacing:.16em !important;

  border-left:
    2px solid
    #e8c75e !important;

  color:#f0cf69 !important;
}


/* ============================================================
   05 — TACTICAL MAP LABELS
   ============================================================ */

#${ROOT_ID} .rv5-map-label{
  border-left:
    2px solid
    #00dfff !important;

  background:
    linear-gradient(
      90deg,
      rgba(0,32,42,.88),
      rgba(2,9,13,.74)
    ) !important;

  box-shadow:
    0 10px 30px rgba(0,0,0,.52),
    inset 0 0 18px rgba(0,220,255,.035) !important;

  backdrop-filter:blur(9px) !important;
}


/* Top label */
#${ROOT_ID} .rv5-map-label.top{
  padding:8px 11px !important;
}


/* Bottom label */
#${ROOT_ID} .rv5-map-label.bottom{
  padding:8px 11px !important;
}


/* Small label */
#${ROOT_ID} .rv5-map-label small{
  color:#5fa6b0 !important;

  font-size:6px !important;
  letter-spacing:.18em !important;
}


/* Main label */
#${ROOT_ID} .rv5-map-label strong{
  color:#e7fbff !important;

  font-size:8px !important;
  letter-spacing:.12em !important;
}


/* ============================================================
   06 — LEGEND
   YOU / START / CP / GOAL / HOSTILE
   ============================================================ */

#${ROOT_ID} .rv5-map-legend{
  position:absolute !important;

  right:16px !important;
  bottom:16px !important;

  z-index:24 !important;

  display:flex !important;

  align-items:center !important;
  justify-content:center !important;

  gap:6px !important;

  padding:7px 8px !important;

  border:
    1px solid
    rgba(116,220,229,.18) !important;

  background:
    linear-gradient(
      180deg,
      rgba(5,13,15,.94),
      rgba(2,7,9,.90)
    ) !important;

  box-shadow:
    0 12px 30px rgba(0,0,0,.55),
    inset 0 1px 0 rgba(255,255,255,.025),
    inset 0 0 18px rgba(0,220,255,.025) !important;

  backdrop-filter:blur(10px) !important;

  font-family:"Orbitron",sans-serif !important;
}


/* Small LEGEND title using pseudo element */
#${ROOT_ID} .rv5-map-legend::before{
  content:"LEGEND" !important;

  display:inline-flex !important;
  align-items:center !important;

  margin-right:4px !important;
  padding-right:8px !important;

  border-right:
    1px solid
    rgba(190,198,188,.13) !important;

  color:#667d82 !important;

  font-size:5px !important;
  font-weight:900 !important;

  letter-spacing:.18em !important;
}


/* Individual items */
#${ROOT_ID} .rv5-map-legend span{
  display:flex !important;

  align-items:center !important;

  gap:5px !important;

  min-height:20px !important;

  padding:0 6px !important;

  color:#9ba9a5 !important;

  font-size:6px !important;
  font-weight:900 !important;

  letter-spacing:.10em !important;

  border:
    1px solid
    rgba(190,198,188,.07) !important;

  background:
    rgba(255,255,255,.018) !important;

  transition:
    border-color .18s ease,
    background .18s ease,
    color .18s ease !important;
}


/* Legend marker */
#${ROOT_ID} .rv5-map-legend i{
  width:6px !important;
  height:6px !important;

  min-width:6px !important;

  display:block !important;

  border-radius:50% !important;
}


/* YOU */
#${ROOT_ID} .rv5-map-legend .you{
  background:#00eaff !important;

  box-shadow:
    0 0 6px rgba(0,234,255,.85) !important;
}


/* START */
#${ROOT_ID} .rv5-map-legend .start{
  background:#39ff88 !important;

  box-shadow:
    0 0 6px rgba(57,255,136,.85) !important;
}


/* CP */
#${ROOT_ID} .rv5-map-legend .cp{
  background:#5eeaff !important;

  box-shadow:
    0 0 6px rgba(94,234,255,.75) !important;
}


/* GOAL */
#${ROOT_ID} .rv5-map-legend .objective{
  background:#ffd34f !important;

  box-shadow:
    0 0 7px rgba(255,211,79,.90) !important;
}


/* HOSTILE */
#${ROOT_ID} .rv5-map-legend .hostile{
  background:#ff4058 !important;

  box-shadow:
    0 0 7px rgba(255,64,88,.85) !important;
}


/* ============================================================
   07 — MAP CORNERS
   ============================================================ */

#${ROOT_ID} .rv5-corner{
  opacity:.85 !important;
}


/* ============================================================
   08 — BOTTOM STATS
   ============================================================ */

#${ROOT_ID} .rv5-stats{
  min-height:48px !important;

  background:
    linear-gradient(
      180deg,
      rgba(5,13,16,.99),
      rgba(2,7,9,1)
    ) !important;

  border-top:
    1px solid
    rgba(0,220,255,.15) !important;
}


#${ROOT_ID} .rv5-stats div{
  border-right:
    1px solid
    rgba(100,220,235,.09) !important;
}


#${ROOT_ID} .rv5-stats small{
  color:#568c95 !important;

  font-size:6px !important;
  letter-spacing:.15em !important;
}


#${ROOT_ID} .rv5-stats strong{
  color:#e2faff !important;

  font-size:9px !important;
  letter-spacing:.07em !important;
}


#${ROOT_ID} .rv5-stats .danger{
  color:#ff596c !important;

  text-shadow:
    0 0 8px rgba(255,64,88,.16) !important;
}


/* ============================================================
   09 — FOOTER
   ============================================================ */

#${ROOT_ID} .rv5-footer{
  min-height:74px !important;

  padding:
    10px 16px !important;

  background:
    linear-gradient(
      180deg,
      rgba(5,13,17,.99),
      rgba(2,7,10,1)
    ) !important;

  border-top:
    1px solid
    rgba(0,220,255,.14) !important;
}


/* Route progress */
#${ROOT_ID} .rv5-route-progress{
  min-width:240px !important;

  width:30% !important;
}


#${ROOT_ID} .rv5-route-progress-head span{
  color:#789098 !important;

  font-size:6px !important;
  letter-spacing:.18em !important;
}


#${ROOT_ID} .rv5-route-progress-head strong{
  color:#f0cf69 !important;

  font-size:8px !important;
}


/* Progress line */
#${ROOT_ID} .rv5-route-progress-line{
  gap:4px !important;
}


#${ROOT_ID} .rv5-route-progress-line i{
  height:4px !important;

  background:
    rgba(120,200,121,.13) !important;

  border:
    1px solid
    rgba(120,200,121,.18) !important;
}


/* Completed */
#${ROOT_ID} .rv5-route-progress-line i.done{
  background:#39ff88 !important;

  box-shadow:
    0 0 8px rgba(57,255,136,.45) !important;
}


/* Goal */
#${ROOT_ID} .rv5-route-progress-line i.goal{
  background:#ffd34f !important;

  border-color:#ffd34f !important;

  box-shadow:
    0 0 8px rgba(255,211,79,.50) !important;
}


/* Labels */
#${ROOT_ID} .rv5-route-progress-labels{
  color:#64747a !important;

  font-size:5px !important;
  letter-spacing:.12em !important;
}


/* ============================================================
   10 — PRIMARY OBJECTIVE
   ============================================================ */

#${ROOT_ID} .rv5-objective{
  border:
    1px solid
    rgba(0,220,255,.16) !important;

  border-left:
    3px solid
    #ffd34f !important;

  background:
    linear-gradient(
      90deg,
      rgba(12,28,32,.82),
      rgba(4,10,13,.68)
    ) !important;

  box-shadow:
    inset 0 0 18px rgba(0,220,255,.025),
    0 8px 22px rgba(0,0,0,.25) !important;
}


#${ROOT_ID} .rv5-objective-icon{
  color:#ffd34f !important;

  text-shadow:
    0 0 10px rgba(255,211,79,.45) !important;
}


#${ROOT_ID} .rv5-objective small{
  color:#68828a !important;

  font-size:6px !important;
  letter-spacing:.14em !important;
}


#${ROOT_ID} .rv5-objective strong{
  color:#ecfbff !important;

  font-size:9px !important;
  letter-spacing:.08em !important;
}


/* Deployment ready */
#${ROOT_ID} .rv5-ready{
  color:#39ff88 !important;

  font-size:7px !important;
  letter-spacing:.14em !important;

  text-shadow:
    0 0 9px rgba(57,255,136,.18) !important;
}


/* ============================================================
   11 — MOBILE
   ============================================================ */

@media(max-width:780px){

  #${ROOT_ID} .rv5-shell{
    grid-template-rows:
      125px
      minmax(0,1fr)
      auto !important;
  }

  #${ROOT_ID} .rv5-header{
    padding:12px !important;
    gap:10px !important;
  }

  #${ROOT_ID} .rv5-brand{
    max-width:calc(100% - 210px) !important;
  }

  #${ROOT_ID} .rv5-kicker{
    font-size:6px !important;
  }

  #${ROOT_ID} h1{
    font-size:
      clamp(22px,7vw,32px) !important;
  }

  #${ROOT_ID} .rv5-meta{
    font-size:7px !important;
  }

  #${ROOT_ID} .rv5-status{
    min-width:105px !important;
    min-height:58px !important;
  }

  #${ROOT_ID} .rv5-status strong{
    font-size:12px !important;
  }

  #${ROOT_ID} .rv5-map-legend{
    right:8px !important;
    bottom:8px !important;

    gap:3px !important;

    padding:5px 6px !important;
  }

  #${ROOT_ID} .rv5-map-legend::before{
    display:none !important;
  }

  #${ROOT_ID} .rv5-map-legend span{
    min-height:17px !important;

    padding:0 4px !important;

    font-size:5px !important;
  }

  #${ROOT_ID} .rv5-map-legend i{
    width:5px !important;
    height:5px !important;
    min-width:5px !important;
  }

  #${ROOT_ID} .rv5-footer{
    min-height:64px !important;

    padding:7px 10px !important;
  }
}


/* ============================================================
   12 — VERY SMALL MOBILE
   ============================================================ */

@media(max-width:520px){

  #${ROOT_ID} .rv5-shell{
    grid-template-rows:
      112px
      minmax(0,1fr)
      auto !important;
  }

  #${ROOT_ID} .rv5-right{
    gap:5px !important;
  }

  #${ROOT_ID} .rv5-timer{
    width:72px !important;
    height:58px !important;
    min-width:72px !important;
    min-height:58px !important;
    flex-basis:72px !important;
  }

  #${ROOT_ID} .rv5-timer strong{
    font-size:32px !important;
  }

  #${ROOT_ID} .rv5-mapbar{
    padding:0 8px !important;
  }

  #${ROOT_ID} .rv5-mapbar span{
    padding:0 6px !important;
    font-size:5px !important;
  }

  #${ROOT_ID} .rv5-mapbar b{
    font-size:5px !important;
    padding-left:8px !important;
  }

  #${ROOT_ID} .rv5-map-legend span{
    font-size:4.5px !important;
  }
}

/* ============================================================
   FINAL MAP REWORK
   FULL SVG / CLEAN TACTICAL FRAME / NO UGLY BACKGROUND
   ============================================================ */


/* ------------------------------------------------------------
   MAP CONTAINER
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-map{
  position:relative !important;

  width:100% !important;
  height:100% !important;

  min-width:0 !important;
  min-height:0 !important;

  overflow:hidden !important;

  display:flex !important;
  align-items:center !important;
  justify-content:center !important;

  isolation:isolate !important;

  /* CLEAN DARK TACTICAL BACKGROUND */
  background:
    radial-gradient(
      ellipse at center,
      rgba(12,42,49,.34) 0%,
      rgba(5,18,23,.18) 42%,
      rgba(1,5,8,.92) 100%
    ) !important;

  border:
    1px solid
    rgba(94,220,235,.18) !important;

  box-shadow:
    inset 0 0 80px rgba(0,0,0,.72),
    inset 0 0 2px rgba(100,230,245,.25),
    0 18px 45px rgba(0,0,0,.55) !important;
}


/* ------------------------------------------------------------
   SVG — FORCE FULL MAP TO BE VISIBLE
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-svg{
  position:relative !important;

  z-index:2 !important;

  display:block !important;

  width:100% !important;
  height:100% !important;

  max-width:100% !important;
  max-height:100% !important;

  min-width:0 !important;
  min-height:0 !important;

  margin:0 !important;

  overflow:visible !important;

  /*
     IMPORTANT:
     preserve complete 1000x560 map
     instead of cropping/stretching it
  */
  preserveAspectRatio:xMidYMid meet !important;

  background:transparent !important;

  filter:
    drop-shadow(0 0 18px rgba(0,210,235,.08))
    drop-shadow(0 12px 28px rgba(0,0,0,.42)) !important;
}


/* ------------------------------------------------------------
   MAP INNER FRAME
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-map::before{
  content:"" !important;

  position:absolute !important;
  inset:12px !important;

  z-index:1 !important;

  pointer-events:none !important;

  border:
    1px solid
    rgba(83,210,225,.09) !important;

  background:
    linear-gradient(
      90deg,
      transparent 49.9%,
      rgba(0,220,255,.035) 50%,
      transparent 50.1%
    ),
    linear-gradient(
      0deg,
      transparent 49.9%,
      rgba(0,220,255,.035) 50%,
      transparent 50.1%
    ) !important;

  box-shadow:
    inset 0 0 45px rgba(0,180,210,.025) !important;
}


/* ------------------------------------------------------------
   OUTER MAP GLOW
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-map::after{
  content:"" !important;

  position:absolute !important;

  inset:0 !important;

  z-index:0 !important;

  pointer-events:none !important;

  background:
    radial-gradient(
      ellipse at 50% 50%,
      transparent 42%,
      rgba(0,220,255,.025) 65%,
      rgba(0,0,0,.28) 100%
    ) !important;

  box-shadow:
    inset 0 0 100px rgba(0,0,0,.55) !important;
}


/* ------------------------------------------------------------
   MAP SVG CONTENT
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-svg > *{
  vector-effect:non-scaling-stroke;
}


/* ------------------------------------------------------------
   GRID — CLEANER
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-svg .grid{
  stroke:#24535d !important;
  stroke-width:.65 !important;
  opacity:.24 !important;
}

#${ROOT_ID} .rv5-svg .grid-major{
  stroke:#4c8992 !important;
  stroke-width:1 !important;
  opacity:.34 !important;
}


/* ------------------------------------------------------------
   BUILDINGS — MORE DEPTH
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-svg .platform{
  fill:#0d2027 !important;

  stroke:#4b747c !important;

  stroke-width:1.1 !important;

  filter:
    drop-shadow(0 2px 3px rgba(0,0,0,.72)) !important;
}


#${ROOT_ID} .rv5-svg .building-inner{
  fill:#142c34 !important;

  stroke:#31535a !important;

  stroke-width:.8 !important;
}


#${ROOT_ID} .rv5-svg .building-edge-bottom{
  stroke:#7baeb3 !important;

  opacity:.18 !important;
}


/* ------------------------------------------------------------
   ROUTE — BRIGHTER / MORE PROFESSIONAL
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-svg .route-halo{
  stroke:#00d9ff !important;

  stroke-width:22 !important;

  opacity:.07 !important;

  filter:
    blur(.5px)
    drop-shadow(0 0 14px rgba(0,220,255,.35)) !important;
}


#${ROOT_ID} .rv5-svg .route{
  stroke:#ffd45a !important;

  stroke-width:4 !important;

  stroke-linecap:round !important;

  stroke-linejoin:round !important;

  stroke-dasharray:11 7 !important;

  filter:
    drop-shadow(0 0 5px rgba(255,210,80,.85))
    drop-shadow(0 0 15px rgba(255,190,40,.20)) !important;

  animation:
    rv5RouteFlow 2.4s linear infinite !important;
}


@keyframes rv5RouteFlow{
  to{
    stroke-dashoffset:-36;
  }
}


#${ROOT_ID} .rv5-svg .route-core{
  stroke:#fffbe5 !important;

  stroke-width:1.1 !important;

  opacity:.9 !important;

  stroke-linecap:round !important;
}


/* ------------------------------------------------------------
   PLAYER
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-svg .player{
  fill:#f7ffff !important;

  stroke:#00eaff !important;

  stroke-width:2.7 !important;

  filter:
    drop-shadow(0 0 6px rgba(0,234,255,1))
    drop-shadow(0 0 16px rgba(0,200,255,.38)) !important;
}


#${ROOT_ID} .rv5-svg .player-ring{
  stroke:#00eaff !important;

  stroke-width:1.8 !important;

  opacity:.85 !important;

  animation:
    rv5PlayerPulse 1.8s ease-in-out infinite !important;
}


@keyframes rv5PlayerPulse{
  0%,100%{
    opacity:.45;
    transform-origin:center;
  }

  50%{
    opacity:1;
  }
}


/* ------------------------------------------------------------
   START
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-svg .start{
  fill:#39ff88 !important;

  stroke:#eafff1 !important;

  stroke-width:2.4 !important;

  filter:
    drop-shadow(0 0 7px rgba(57,255,136,.95))
    drop-shadow(0 0 18px rgba(57,255,136,.35)) !important;
}


#${ROOT_ID} .rv5-svg .start-ring{
  stroke:#39ff88 !important;

  stroke-width:1.5 !important;

  opacity:.75 !important;
}


/* ------------------------------------------------------------
   CHECKPOINTS
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-svg .checkpoint{
  fill:rgba(0,225,255,.08) !important;

  stroke:#63edff !important;

  stroke-width:1.8 !important;

  filter:
    drop-shadow(0 0 5px rgba(0,225,255,.45)) !important;
}


#${ROOT_ID} .rv5-svg .checkpoint-dot{
  fill:#f1ffff !important;

  filter:
    drop-shadow(0 0 7px rgba(0,234,255,.95)) !important;
}


/* ------------------------------------------------------------
   GOAL
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-svg .goal{
  fill:#ffd34f !important;

  stroke:#fff7d1 !important;

  stroke-width:2.5 !important;

  filter:
    drop-shadow(0 0 8px rgba(255,211,79,1))
    drop-shadow(0 0 20px rgba(255,190,40,.42)) !important;
}


#${ROOT_ID} .rv5-svg .goal-ring{
  stroke:#ffd34f !important;

  stroke-width:1.7 !important;

  opacity:.9 !important;
}


/* ------------------------------------------------------------
   HOSTILE
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-svg .danger-object{
  fill:#281016 !important;

  stroke:#ff4058 !important;

  stroke-width:1.3 !important;

  filter:
    drop-shadow(0 0 7px rgba(255,50,80,.55)) !important;
}


#${ROOT_ID} .rv5-svg .hostile-cross,
#${ROOT_ID} .rv5-svg .enemy-cross{
  stroke:#ff5369 !important;

  stroke-width:1.4 !important;
}


/* ------------------------------------------------------------
   MAP TEXT
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-svg .label{
  fill:#e5fbff !important;

  font-size:10px !important;

  font-weight:800 !important;

  letter-spacing:.06em !important;

  paint-order:stroke fill !important;

  stroke:#020708 !important;

  stroke-width:2.5px !important;
}


#${ROOT_ID} .rv5-svg .goal-label{
  fill:#ffd65b !important;

  font-weight:900 !important;

  paint-order:stroke fill !important;

  stroke:#05090a !important;

  stroke-width:2.5px !important;
}


#${ROOT_ID} .rv5-svg .guide{
  fill:#83b8bf !important;

  font-size:8px !important;

  font-weight:600 !important;

  opacity:.78 !important;
}


/* ------------------------------------------------------------
   MAP CORNERS — STRONGER HUD
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-corner{
  z-index:20 !important;

  width:30px !important;
  height:30px !important;

  opacity:.95 !important;

  filter:
    drop-shadow(0 0 5px rgba(0,220,255,.20)) !important;
}


#${ROOT_ID} .rv5-corner::before,
#${ROOT_ID} .rv5-corner::after{
  background:#5cecff !important;
}


/* ------------------------------------------------------------
   MAP LABELS — FIT THEM TO MAP
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-map-label{
  z-index:20 !important;

  padding:7px 10px !important;

  border:
    1px solid
    rgba(93,220,235,.16) !important;

  border-left:
    2px solid
    #00eaff !important;

  background:
    linear-gradient(
      90deg,
      rgba(2,18,23,.92),
      rgba(2,8,11,.72)
    ) !important;

  box-shadow:
    0 8px 22px rgba(0,0,0,.45),
    inset 0 0 15px rgba(0,220,255,.025) !important;

  backdrop-filter:blur(8px) !important;
}


#${ROOT_ID} .rv5-map-label.bottom{
  border-left:1px solid rgba(93,220,235,.16) !important;

  border-right:
    2px solid
    #00eaff !important;
}


/* ------------------------------------------------------------
   LEGEND — NORMAL SIZE, NOT FLOATING UGLY
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-map-legend{
  z-index:30 !important;

  right:14px !important;
  bottom:14px !important;

  display:flex !important;

  align-items:center !important;

  gap:4px !important;

  padding:5px !important;

  border:
    1px solid
    rgba(91,214,229,.18) !important;

  background:
    rgba(2,8,10,.88) !important;

  box-shadow:
    0 10px 25px rgba(0,0,0,.55),
    inset 0 0 15px rgba(0,220,255,.025) !important;

  backdrop-filter:blur(10px) !important;
}


#${ROOT_ID} .rv5-map-legend span{
  min-height:18px !important;

  padding:0 5px !important;

  gap:4px !important;

  font-size:5.5px !important;

  border:
    1px solid
    rgba(190,220,220,.07) !important;
}


#${ROOT_ID} .rv5-map-legend i{
  width:5px !important;
  height:5px !important;

  min-width:5px !important;
}


/* ------------------------------------------------------------
   LIVE ROUTE TAG
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-live-tag{
  z-index:30 !important;

  padding:6px 9px !important;

  border:
    1px solid
    rgba(57,255,136,.24) !important;

  background:
    rgba(2,12,9,.88) !important;

  color:#6cff9a !important;

  box-shadow:
    0 8px 22px rgba(0,0,0,.45),
    0 0 18px rgba(57,255,136,.05) !important;

  backdrop-filter:blur(8px) !important;
}


/* ------------------------------------------------------------
   MAP SCAN
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-scan{
  z-index:8 !important;

  pointer-events:none !important;

  opacity:.55 !important;

  background:
    linear-gradient(
      180deg,
      transparent 0%,
      rgba(0,234,255,.00) 38%,
      rgba(0,234,255,.10) 50%,
      rgba(0,234,255,.00) 62%,
      transparent 100%
    ) !important;

  animation:
    rv5MapSweep 5.5s linear infinite !important;
}


@keyframes rv5MapSweep{
  from{
    transform:translateY(-100%);
  }

  to{
    transform:translateY(100%);
  }
}


/* ------------------------------------------------------------
   REMOVE ANY POSSIBLE PHOTO / IMAGE BACKGROUND
   ------------------------------------------------------------ */

#${ROOT_ID} .rv5-map,
#${ROOT_ID} .rv5-map-frame,
#${ROOT_ID} .rv5-map-container{
  background-image:none !important;
}


/* ------------------------------------------------------------
   DESKTOP — GIVE MAP MORE SPACE
   ------------------------------------------------------------ */

@media(min-width:900px){

  #${ROOT_ID} .rv5-main{
    grid-template-rows:
      42px
      minmax(0,1fr)
      52px !important;
  }


  #${ROOT_ID} .rv5-map{
    padding:10px !important;
  }


  #${ROOT_ID} .rv5-svg{
    width:100% !important;
    height:100% !important;
  }
}


/* ------------------------------------------------------------
   MOBILE
   ------------------------------------------------------------ */

@media(max-width:780px){

  #${ROOT_ID} .rv5-map{
    padding:4px !important;
  }

  #${ROOT_ID} .rv5-svg{
    width:100% !important;
    height:100% !important;
  }

  #${ROOT_ID} .rv5-map-label{
    transform:scale(.82) !important;
    transform-origin:left center !important;
  }

  #${ROOT_ID} .rv5-map-label.bottom{
    transform-origin:right center !important;
  }

  #${ROOT_ID} .rv5-map-legend{
    right:7px !important;
    bottom:7px !important;

    gap:2px !important;
  }

  #${ROOT_ID} .rv5-map-legend span{
    padding:0 3px !important;

    font-size:4.5px !important;
  }

  #${ROOT_ID} .rv5-corner{
    width:22px !important;
    height:22px !important;
  }
}

/* ============================================================
   BOTTOM STATS
   ============================================================ */

#${ROOT_ID} .rv5-stats{
  background:
    linear-gradient(
      180deg,
      rgba(3,13,17,.98),
      rgba(2,7,10,.99)
    ) !important;

  border-top:1px solid rgba(0,220,255,.13) !important;
}

#${ROOT_ID} .rv5-stats div{
  border-right:1px solid rgba(100,220,235,.10) !important;
}

#${ROOT_ID} .rv5-stats small{
  font-family:"Orbitron",sans-serif !important;
  color:#56858d !important;
}

#${ROOT_ID} .rv5-stats strong{
  font-family:"Orbitron",sans-serif !important;
  color:#dffaff !important;
}

#${ROOT_ID} .rv5-stats .danger{
  color:#ff596c !important;
}


/* ============================================================
   FOOTER
   ============================================================ */

#${ROOT_ID} .rv5-route-progress{
  min-width:220px !important;
  width:28% !important;
  display:flex !important;
  flex-direction:column !important;
  gap:6px !important;
}

#${ROOT_ID} .rv5-route-progress-head{
  display:flex !important;
  justify-content:space-between !important;
  align-items:center !important;
}

#${ROOT_ID} .rv5-route-progress-head span{
  color:#7f8982 !important;
  font-size:7px !important;
  font-weight:800 !important;
  letter-spacing:.16em !important;
}

#${ROOT_ID} .rv5-route-progress-head strong{
  color:#f0cf69 !important;
  font-size:8px !important;
  font-weight:900 !important;
}

#${ROOT_ID} .rv5-route-progress-line{
  display:flex !important;
  align-items:center !important;
  gap:4px !important;
}

#${ROOT_ID} .rv5-route-progress-line i{
  width:10px !important;
  height:4px !important;
  flex:1 !important;
  background:rgba(120,200,121,.18) !important;
  border:1px solid rgba(120,200,121,.20) !important;
}

#${ROOT_ID} .rv5-route-progress-line i.done{
  background:#78c879 !important;
  box-shadow:
    0 0 7px rgba(120,200,121,.45),
    0 0 14px rgba(120,200,121,.18) !important;
}

#${ROOT_ID} .rv5-route-progress-line i.goal{
  background:#f0cf69 !important;
  border-color:#f0cf69 !important;
}

#${ROOT_ID} .rv5-route-progress-labels{
  display:flex !important;
  justify-content:space-between !important;
  color:#657068 !important;
  font-size:6px !important;
  font-weight:800 !important;
  letter-spacing:.08em !important;
}

#${ROOT_ID} .rv5-footer{
  background:
    linear-gradient(
      180deg,
      rgba(4,13,17,.98),
      rgba(2,7,10,1)
    ) !important;

  border-top:1px solid rgba(0,220,255,.13) !important;
}

#${ROOT_ID} .rv5-objective{
  border:1px solid rgba(0,220,255,.15) !important;
  border-left:3px solid #ffd34f !important;

  background:
    linear-gradient(
      90deg,
      rgba(12,27,31,.72),
      rgba(4,10,13,.65)
    ) !important;
}

#${ROOT_ID} .rv5-objective strong,
#${ROOT_ID} .rv5-objective small,
#${ROOT_ID} .rv5-ready{
  font-family:"Orbitron",sans-serif !important;
}

#${ROOT_ID} .rv5-ready{
  color:#39ff88 !important;
}


/* ============================================================
   SCAN / HUD EFFECT
   ============================================================ */

#${ROOT_ID} .rv5-scan{
  background:
    linear-gradient(
      180deg,
      transparent,
      rgba(0,225,255,.075),
      transparent
    ) !important;

  animation-duration:4.2s !important;
}


/* ============================================================
   MOBILE SAFETY
   ============================================================ */

@media(max-width:780px){

  #${ROOT_ID} .rv5-shell{
    width:100% !important;
    height:100dvh !important;
    max-height:none !important;
    border-radius:0 !important;
  }

  #${ROOT_ID} .rv5-header{
    padding:14px !important;
    gap:10px !important;
  }

  #${ROOT_ID} h1{
    font-size:clamp(24px,8vw,38px) !important;
  }

  #${ROOT_ID} .rv5-status{
    min-width:110px !important;
    min-height:58px !important;
  }

  #${ROOT_ID} .rv5-timer{
    width:82px !important;
    height:82px !important;
    min-width:82px !important;
    min-height:82px !important;
    flex-basis:82px !important;
  }

  #${ROOT_ID} .rv5-timer strong{
    font-size:38px !important;
  }

  #${ROOT_ID} .rv5-map-label{
    transform:scale(.82);
    transform-origin:top left;
  }

  #${ROOT_ID} .rv5-stats{
    min-height:42px !important;
  }

  #${ROOT_ID} .rv5-footer{
    min-height:64px !important;
    padding:8px 12px !important;
  }
}

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

  width:min(1560px,97vw) !important;
  height:min(900px,94dvh) !important;

  min-width:0 !important;
  min-height:0 !important;

  display:grid !important;

  grid-template-columns:1fr !important;

  grid-template-rows:
    178px
    minmax(0,1fr)
    auto !important;

  overflow:hidden !important;

  background:
    linear-gradient(
      145deg,
      rgba(16,21,20,.985) 0%,
      rgba(7,11,11,.99) 45%,
      rgba(2,5,6,1) 100%
    ) !important;
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

  align-items:center !important;

  justify-content:space-between !important;

  gap:24px !important;

  padding:
    18px
    22px
    16px !important;

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

  align-items:center !important;

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

  margin:3px 0 0 !important;

  width:100% !important;

  text-align:center !important;

  color:#f4f5ee !important;

  font-family:"Orbitron",sans-serif !important;

 font-size:
  clamp(
    30px,
    3.4vw,
    46px
  ) !important;

  line-height:.94 !important;

  font-weight:800 !important;

  letter-spacing:.055em !important;

  text-transform:uppercase !important;

  text-shadow:
    0 0 18px rgba(255,255,255,.035),
    0 5px 16px rgba(0,0,0,.92) !important;
}

#${ROOT_ID} h1 strong{
  color:#e8c75e !important;

  font-weight:900 !important;

  text-shadow:
    0 0 14px rgba(213,181,83,.16) !important;
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

  align-items:stretch !important;

  justify-content:flex-end !important;

  gap:10px !important;

  margin-left:auto !important;

  flex:
    0 0 auto !important;

  position:relative !important;
}


/* status */

#${ROOT_ID} .rv5-status{
  position:relative !important;

  min-width:
    174px !important;

  min-height:
    82px !important;

  padding:
    12px 14px !important;

  border:
    1px solid
    rgba(196,202,192,.15) !important;

  border-top:
    2px solid
    var(--wz-green) !important;

  border-radius:
    1px !important;

  background:
    linear-gradient(
      145deg,
      rgba(14,21,18,.98),
      rgba(4,8,7,.99)
    ) !important;

  box-shadow:
    inset 0 0 24px
      rgba(120,200,121,.035),

    inset 0 1px 0
      rgba(255,255,255,.025),

    0 10px 28px
      rgba(0,0,0,.38) !important;

  overflow:hidden !important;
}
#${ROOT_ID} .rv5-status::before{
  content:"COMMAND // ROUTE CONTROL";

  position:absolute !important;

  top:5px !important;
  left:12px !important;

  color:
    rgba(120,200,121,.34) !important;

  font-family:
    "Orbitron",
    sans-serif !important;

  font-size:
    6px !important;

  font-weight:
    800 !important;

  letter-spacing:
    .16em !important;

  pointer-events:none !important;
}

#${ROOT_ID} .rv5-status small{
  display:block !important;

  margin-top:
    9px !important;

  margin-bottom:
    8px !important;

  color:
    #7e8880 !important;

  font-family:
    "Orbitron",
    sans-serif !important;

  font-size:
    7px !important;

  line-height:
    1 !important;

  font-weight:
    800 !important;

  letter-spacing:
    .19em !important;

  text-transform:
    uppercase !important;
}


#${ROOT_ID} .rv5-status strong{
  position:relative !important;

  display:block !important;

  color:
    #9ee7a1 !important;

  font-family:
    "Orbitron",
    sans-serif !important;

  font-size:
    18px !important;

  line-height:
    1 !important;

  font-weight:
    800 !important;

  letter-spacing:
    .12em !important;

text-shadow:
    0 0 10px rgba(120,200,121,.22) !important;
}

#${ROOT_ID} .rv5-telemetry{
  display:grid !important;
  grid-template-columns:repeat(3,minmax(0,1fr)) !important;
  gap:5px !important;
  margin-top:9px !important;
}

#${ROOT_ID} .rv5-telemetry span{
  display:flex !important;
  flex-direction:column !important;
  gap:3px !important;
  color:#647169 !important;
  font-family:"Orbitron",sans-serif !important;
  font-size:5px !important;
  letter-spacing:.10em !important;
}

#${ROOT_ID} .rv5-telemetry b{
  color:#a9c4b0 !important;
  font-size:7px !important;
  letter-spacing:.06em !important;
}

#${ROOT_ID} .rv5-status i{
  position:absolute !important;

  right:
    12px !important;

  bottom:
    12px !important;

  width:
    7px !important;

  height:
    7px !important;

  border-radius:
    50% !important;

  background:
    var(--wz-green) !important;

  box-shadow:
    0 0 6px
      rgba(120,200,121,.95),

    0 0 15px
      rgba(120,200,121,.58) !important;

  animation:
    rv5StatusPulse
    1.8s
    ease-in-out
    infinite !important;
}

@keyframes rv5StatusPulse{
  0%,100%{
    opacity:.65;
    transform:scale(.9);
  }

  50%{
    opacity:1;
    transform:scale(1.15);
  }
}


/* ============================================================
   LARGE COUNTER
   ============================================================ */

#${ROOT_ID} .rv5-timer{
  position:relative !important;

  width:
    118px !important;

  height:
    82px !important;

  min-width:
    118px !important;

  min-height:
    82px !important;

  flex:
    0 0 118px !important;

  display:flex !important;

  flex-direction:
    column !important;

  align-items:center !important;

  justify-content:center !important;

  border:
    1px solid
    rgba(213,181,83,.48) !important;

  border-radius:
    1px !important;

  background:
    linear-gradient(
      145deg,
      rgba(29,27,16,.98),
      rgba(7,10,9,.99)
    ) !important;

  box-shadow:
    0 0 24px
      rgba(213,181,83,.065),

    inset 0 0 28px
      rgba(213,181,83,.045),

    inset 0 1px 0
      rgba(255,255,255,.025) !important;

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
    7px
    0
    0 !important;

  color:
    #fff8dc !important;

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

  min-height:52px !important;

  display:flex !important;

  align-items:center !important;

  justify-content:space-between !important;

  gap:18px !important;

  padding:0 18px !important;

  background:
    linear-gradient(
      180deg,
      rgba(14,19,18,.99),
      rgba(5,9,9,1)
    ) !important;

  border-top:
    1px solid
    rgba(213,181,83,.14) !important;

  border-bottom:
    1px solid
    rgba(116,220,229,.18) !important;

  box-shadow:
    inset 0 1px
      rgba(255,255,255,.035),
    inset 0 -10px 24px
      rgba(0,0,0,.24),
    0 5px 18px
      rgba(0,0,0,.22) !important;

  overflow:hidden !important;
}


#${ROOT_ID} .rv5-mapbar > div{
  position:relative !important;

  display:flex !important;

  align-items:center !important;

  gap:6px !important;

  min-width:0 !important;

  height:100% !important;

  overflow:hidden !important;
}


#${ROOT_ID} .rv5-mapbar span{
  position:relative !important;
  display:inline-flex !important;
  align-items:center !important;
  justify-content:center !important;
  min-height:30px !important;
  padding:0 11px !important;
  color:#7d8881 !important;
  font-family:"Orbitron",sans-serif !important;
  font-size:8px !important;
  line-height:1 !important;
  font-weight:700 !important;
  letter-spacing:.13em !important;
  border:
    1px solid
    rgba(190,200,190,.13) !important;
  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.028),
      rgba(255,255,255,.006)
    ) !important;
  box-shadow:
    inset 0 1px
      rgba(255,255,255,.025),
    inset 0 -5px 10px
      rgba(0,0,0,.10) !important;

  white-space:nowrap !important;
  cursor:default !important;
  transition:
    border-color .2s ease,
    background .2s ease,
    color .2s ease,
    box-shadow .2s ease !important;
}

#${ROOT_ID} .rv5-mapbar span:hover{
  color:#b9c9c0 !important;

  border-color:
    rgba(116,220,229,.28) !important;

  background:
    linear-gradient(
      180deg,
      rgba(116,220,229,.055),
      rgba(116,220,229,.012)
    ) !important;

  box-shadow:
    0 0 10px rgba(116,220,229,.045),
    inset 0 0 10px rgba(116,220,229,.025) !important;
}

#${ROOT_ID} .rv5-mapbar span.active{
  color:#a5e9a7 !important;

  border-color:
    rgba(120,200,121,.42) !important;

  background:
    linear-gradient(
      180deg,
      rgba(120,200,121,.12),
      rgba(120,200,121,.025)
    ) !important;

  box-shadow:
    0 0 14px
      rgba(120,200,121,.075),
    inset 0 0 14px
      rgba(120,200,121,.04) !important;

  text-shadow:
    0 0 9px
      rgba(120,200,121,.30) !important;
}


#${ROOT_ID} .rv5-mapbar b{
  position:relative !important;

  flex:0 0 auto !important;

  display:inline-flex !important;

  align-items:center !important;

  min-height:30px !important;

  padding:0 12px 0 18px !important;

  color:#f0cf69 !important;

  font-family:"Orbitron",sans-serif !important;

  font-size:8px !important;

  line-height:1 !important;

  font-weight:800 !important;

  letter-spacing:.14em !important;

  white-space:nowrap !important;

  border-left:
    2px solid
    #d5b553 !important;

  background:
    linear-gradient(
      90deg,
      rgba(213,181,83,.095),
      rgba(213,181,83,.018),
      transparent
    ) !important;

  text-shadow:
    0 0 10px
      rgba(213,181,83,.22) !important;

  box-shadow:
    inset 0 1px
      rgba(255,255,255,.02) !important;
}

#${ROOT_ID} .rv5-mapbar b::before{
  content:"" !important;

  position:absolute !important;

  left:7px !important;

  top:50% !important;

  width:5px !important;

  height:5px !important;

  transform:translateY(-50%) !important;

  border-radius:50% !important;

  background:#f0cf69 !important;

  box-shadow:
    0 0 5px
      rgba(240,207,105,.95),
    0 0 12px
      rgba(213,181,83,.55) !important;

  animation:
    rv5RouteStatusPulse
    1.8s
    ease-in-out
    infinite !important;
}

@keyframes rv5RouteStatusPulse{
  0%,100%{
    opacity:.65;
  }

  50%{
    opacity:1;
  }
}
#${ROOT_ID} .rv5-mapbar::after{
  content:"TACTICAL ROUTE FEED" !important;

  position:absolute !important;
  right:18px !important;
  bottom:-1px !important;

  width:92px !important;
  height:1px !important;

  padding:0 !important;

  color:transparent !important;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(116,220,229,.42),
      transparent
    ) !important;

  box-shadow:
    0 0 8px rgba(116,220,229,.16) !important;

  animation:rv5MapbarScan 3.2s linear infinite !important;
}

@keyframes rv5MapbarScan{
  0%{
    opacity:.25;
    transform:translateX(-35px);
  }

  50%{
    opacity:.9;
  }

  100%{
    opacity:.25;
    transform:translateX(35px);
  }
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
      ellipse at 50% 45%,
      rgba(62,104,104,.24),
      rgba(16,32,32,.10) 34%,
      transparent 62%
    ),
    linear-gradient(
      180deg,
      #0b1415 0%,
      #071011 42%,
      #030708 100%
    ) !important;

  border-top:
    1px solid
    rgba(116,220,229,.20) !important;

  border-bottom:
    1px solid
    rgba(116,220,229,.16) !important;

  box-shadow:
    inset 0 0 100px rgba(0,0,0,.82),
    inset 0 0 35px rgba(40,150,160,.06),
    0 0 30px rgba(0,0,0,.32) !important;
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
      transparent 49.94%,
      rgba(116,220,229,.055) 50%,
      transparent 50.06%
    ),
    linear-gradient(
      0deg,
      transparent 49.94%,
      rgba(116,220,229,.045) 50%,
      transparent 50.06%
    );

  opacity:.45;
}

/* scan */

#${ROOT_ID} .rv5-scan{
  position:absolute !important;

  inset:-20% 0 !important;

  z-index:8 !important;

  pointer-events:none !important;

  background:
    linear-gradient(
      180deg,
      transparent 0%,
      rgba(116,220,229,.00) 40%,
      rgba(116,220,229,.045) 50%,
      rgba(116,220,229,.00) 60%,
      transparent 100%
    ) !important;

  opacity:.72 !important;

  mix-blend-mode:screen !important;

  animation:
    rv5PremiumScan 5.5s
    linear infinite !important;
}

@keyframes rv5PremiumScan{
  0%{
    transform:translateY(-35%);
  }

  100%{
    transform:translateY(35%);
  }
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

  stroke:#78c879 !important;

  stroke-width:1 !important;

  stroke-dasharray:4 6 !important;

  opacity:.28 !important;

  filter:
    drop-shadow(
      0 0 4px rgba(120,200,121,.25)
    ) !important;
}

#${ROOT_ID} .start-ring{
  fill:rgba(120,200,121,.035) !important;

  stroke:#8bdd8b !important;

  stroke-width:2 !important;

  opacity:.88 !important;

  filter:
    drop-shadow(
      0 0 5px rgba(120,200,121,.55)
    ) !important;
}

#${ROOT_ID} .goal-radius{
  fill:none !important;

  stroke:#f0cf69 !important;

  stroke-width:1 !important;

  stroke-dasharray:5 7 !important;

  opacity:.34 !important;

  filter:
    drop-shadow(
      0 0 5px rgba(240,207,105,.20)
    ) !important;
}

#${ROOT_ID} .goal-ring{
  fill:rgba(240,207,105,.045) !important;

  stroke:#f5d86f !important;

  stroke-width:2 !important;

  opacity:.95 !important;

  filter:
    drop-shadow(
      0 0 5px rgba(240,207,105,.65)
    )
    drop-shadow(
      0 0 15px rgba(240,207,105,.22)
    ) !important;
}

#${ROOT_ID} .player-radius{
  fill:none !important;

  stroke:#74dce5 !important;

  stroke-width:1 !important;

  stroke-dasharray:4 6 !important;

  opacity:.34 !important;

  animation:
    rv5PlayerPulse
    2.2s
    ease-in-out
    infinite !important;
}

#${ROOT_ID} .player-cross{
  stroke:#b9f8ff !important;

  stroke-width:1.5 !important;

  opacity:.92 !important;

  filter:
    drop-shadow(
      0 0 4px rgba(116,220,229,.65)
    ) !important;
}

@keyframes rv5PlayerPulse{
  0%,100%{
    opacity:.24;
  }

  50%{
    opacity:.55;
  }
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
  fill:none !important;

  stroke:#f0cf69 !important;

  stroke-width:3.8 !important;

  stroke-linecap:round !important;
  stroke-linejoin:round !important;

  stroke-dasharray:16 10 !important;

  animation:
    rv5wzRoute
    1.35s
    linear
    infinite !important;

  filter:
    drop-shadow(
      0 0 4px rgba(240,207,105,.62)
    )
    drop-shadow(
      0 0 11px rgba(240,207,105,.20)
    ) !important;

  opacity:.96 !important;
}


@keyframes rv5wzRoute{

  to{
    stroke-dashoffset:-44;
  }
}


/* route core */

#${ROOT_ID} .route-core{
  fill:none !important;

  stroke:#fff9dc !important;

  stroke-width:1.25 !important;

  stroke-linecap:round !important;
  stroke-linejoin:round !important;

  opacity:.82 !important;

  filter:
    drop-shadow(
      0 0 3px rgba(255,249,220,.42)
    ) !important;

  pointer-events:none !important;
}


/* ============================================================
   MARKERS
   ============================================================ */

#${ROOT_ID} .start{
  fill:
    #78c879 !important;

  stroke:
    #eaffea !important;

  stroke-width:
    2.2 !important;

  filter:
    drop-shadow(
      0 0 6px
      rgba(120,200,121,.82)
    )
    drop-shadow(
      0 0 14px
      rgba(120,200,121,.28)
    ) !important;

  opacity:.96 !important;
}

#${ROOT_ID} .start-ring{
  fill:none !important;

  stroke:#78c879 !important;

  stroke-width:1.35 !important;

  opacity:.72 !important;

  filter:
    drop-shadow(
      0 0 6px
      rgba(120,200,121,.42)
    ) !important;

  animation:
    rv5StartPulse
    2s
    ease-in-out
    infinite !important;
}

@keyframes rv5StartPulse{
  0%,100%{
    opacity:.42;
    transform:scale(.96);
    transform-origin:center;
  }

  50%{
    opacity:.9;
    transform:scale(1.04);
    transform-origin:center;
  }
}


#${ROOT_ID} .goal{
  fill:
    #f0cf69 !important;

  stroke:
    #fff1b8 !important;

  stroke-width:
    2.2 !important;

  filter:
    drop-shadow(
      0 0 6px
      rgba(240,207,105,.78)
    )
    drop-shadow(
      0 0 15px
      rgba(240,207,105,.25)
    ) !important;

  opacity:.97 !important;
}

#${ROOT_ID} .goal-ring{
  fill:none !important;

  stroke:#f0cf69 !important;

  stroke-width:1.35 !important;

  opacity:.68 !important;

  filter:
    drop-shadow(
      0 0 6px
      rgba(240,207,105,.42)
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
  fill:rgba(116,220,229,.025) !important;
  stroke:#74dce5 !important;
  stroke-width:1.55 !important;
  opacity:.88 !important;
  filter:
    drop-shadow(
      0 0 4px rgba(116,220,229,.42)
    )
    drop-shadow(
      0 0 10px rgba(116,220,229,.14)
    ) !important;
}


#${ROOT_ID} .checkpoint-dot{
  fill:#f3ffff !important;
  stroke:#74dce5 !important;
  stroke-width:1.2 !important;
  filter:
    drop-shadow(
      0 0 5px rgba(116,220,229,.85)
    )
    drop-shadow(
      0 0 12px rgba(116,220,229,.30)
    ) !important;

  opacity:.96 !important;
}

#${ROOT_ID} .checkpoint-dot{
  animation:
    rv5CheckpointPulse
    2.4s
    ease-in-out
    infinite !important;
}

@keyframes rv5CheckpointPulse{
  0%,100%{
    opacity:.72;
    filter:
      drop-shadow(0 0 4px rgba(116,220,229,.55))
      drop-shadow(0 0 9px rgba(116,220,229,.16));
  }

  50%{
    opacity:1;
    filter:
      drop-shadow(0 0 7px rgba(116,220,229,.95))
      drop-shadow(0 0 15px rgba(116,220,229,.32));
  }
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

#${ROOT_ID} .checkpoint-label{
  paint-order:stroke fill !important;
  stroke-linejoin:round !important;
  stroke-width:3px !important;
  letter-spacing:.08em !important;
  pointer-events:none !important;
}

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
#${ROOT_ID} .goal-label{
  fill:
    var(--wz-amber-bright) !important;

  font-size:
    11px !important;

  font-weight:
    950 !important;

  letter-spacing:
    .10em !important;

  paint-order:
    stroke fill !important;

  stroke:
    #030606 !important;

  stroke-width:
    4px !important;

  pointer-events:
    none !important;

  filter:
    drop-shadow(
      0 0 5px
      rgba(240,207,105,.55)
    ) !important;
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
  paint-order:stroke fill !important;
  stroke-linejoin:round !important;
  stroke-width:2.5px !important;
  letter-spacing:.045em !important;
  pointer-events:none !important;
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
  position:relative !important;

  min-height:
    56px !important;

  display:grid !important;

 grid-template-columns:
    repeat(
      4,
      minmax(0,1fr)
    ) !important;

  background:
    linear-gradient(
      180deg,
      rgba(10,15,15,.98),
      rgba(3,6,6,1)
    ) !important;

  border-top:
    1px solid
    rgba(213,181,83,.16) !important;

  border-bottom:
    1px solid
    rgba(190,198,188,.08) !important;

  box-shadow:
    inset 0 1px 0
      rgba(255,255,255,.025),
    inset 0 -10px 24px
      rgba(0,0,0,.30) !important;

  overflow:hidden !important;
}

#${ROOT_ID} .rv5-stats div{
  position:relative !important;

  min-width:0 !important;

  display:flex !important;

  flex-direction:column !important;

  align-items:center !important;

  justify-content:center !important;

  gap:5px !important;

  padding:6px 12px !important;

  border-right:
    1px solid
    rgba(190,198,188,.08) !important;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.018),
      transparent
    ) !important;

  overflow:hidden !important;
}

#${ROOT_ID} .rv5-stats div::before{
  content:"";

  position:absolute !important;

  left:14px !important;
  right:14px !important;
  top:0 !important;

  height:1px !important;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(213,181,83,.30),
      transparent
    ) !important;

  opacity:.7 !important;
}

#${ROOT_ID} .rv5-stats div::after{
  content:"";

  position:absolute !important;

  width:3px !important;
  height:3px !important;

  right:10px !important;
  bottom:8px !important;

  border-radius:50% !important;

  background:
    var(--wz-green) !important;

  box-shadow:
    0 0 7px
    rgba(120,200,121,.65) !important;

  opacity:.8 !important;
}


#${ROOT_ID} .rv5-stats div:last-child{
  border-right:
    0 !important;
}


#${ROOT_ID} .rv5-stats small{
  display:block !important;

  color:
    #7f8982 !important;

  font-size:
    8px !important;

  line-height:
    1 !important;

  font-weight:
    900 !important;

  letter-spacing:
    .18em !important;

  text-transform:
    uppercase !important;

  text-shadow:
    0 0 8px
    rgba(255,255,255,.04) !important;
}

#${ROOT_ID} .rv5-stats strong{
  color:
    #edf2ec !important;

  font-family:
    "Orbitron",
    sans-serif !important;

  font-size:
    11px !important;

  line-height:
    1 !important;

  font-weight:
    800 !important;

  letter-spacing:
    .10em !important;

  text-transform:
    uppercase !important;

  text-shadow:
    0 0 10px
    rgba(255,255,255,.06) !important;
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
  position:relative !important;

  min-height:
    86px !important;

  display:flex !important;

  align-items:center !important;

  justify-content:space-between !important;

  gap:
    20px !important;

  padding:
    12px
    20px !important;

  border-top:
    1px solid
    rgba(213,181,83,.18) !important;

  background:
    linear-gradient(
      180deg,
      rgba(10,14,13,.99),
      rgba(3,6,6,1)
    ) !important;

  box-shadow:
    inset 0 1px 0
      rgba(255,255,255,.025),
    inset 0 12px 30px
      rgba(0,0,0,.20) !important;

  overflow:hidden !important;
}

/* objective */

#${ROOT_ID} .rv5-objective{
  position:relative !important;

  min-width:0 !important;

  display:flex !important;

  text-align:center !important;

  align-items:center !important;

  gap:
    14px !important;

  padding:
    10px
    15px !important;

  border:
    1px solid
    rgba(190,198,188,.14) !important;

  border-left:
    3px solid
    var(--wz-amber) !important;

  background:
    linear-gradient(
      90deg,
      rgba(213,181,83,.055),
      rgba(255,255,255,.018) 35%,
      rgba(255,255,255,.008)
    ) !important;

  box-shadow:
    inset 0 0 24px
      rgba(213,181,83,.035),
    0 0 18px
      rgba(0,0,0,.20) !important;

  overflow:hidden !important;
}
#${ROOT_ID} .rv5-objective::before{
  content:"";

  position:absolute !important;

  top:0 !important;
  left:12px !important;
  right:12px !important;

  height:1px !important;

  background:
    linear-gradient(
      90deg,
      var(--wz-amber),
      rgba(240,207,105,.18),
      transparent
    ) !important;

  opacity:.65 !important;
}
  
#${ROOT_ID} .rv5-objective::after{
  content:none !important;

  position:absolute !important;

  right:10px !important;
  top:5px !important;

  color:
    rgba(240,207,105,.38) !important;

  font-family:
    "Orbitron",
    sans-serif !important;

  font-size:
    6px !important;

  font-weight:
    800 !important;

  letter-spacing:
    .16em !important;

  pointer-events:none !important;
}

#${ROOT_ID} .rv5-objective-icon{
  position:relative !important;

  width:
    36px !important;

  height:
    36px !important;

  flex:
    0 0 36px !important;

  display:grid !important;

  place-items:center !important;

  color:
    var(--wz-amber-bright) !important;

  border:
    1px solid
    rgba(213,181,83,.42) !important;

  background:
    linear-gradient(
      135deg,
      rgba(213,181,83,.10),
      rgba(213,181,83,.025)
    ) !important;

  transform:
    rotate(45deg) !important;

  box-shadow:
    0 0 14px
      rgba(213,181,83,.10),
    inset 0 0 12px
      rgba(213,181,83,.04) !important;
}


#${ROOT_ID} .rv5-objective-icon::first-letter{
  transform:
    rotate(-45deg) !important;
}


#${ROOT_ID} .rv5-objective small{
  display:block !important;

  margin-bottom:
    6px !important;

  color:
    var(--wz-amber) !important;

  font-family:
    "Orbitron",
    sans-serif !important;

  font-size:
    8px !important;

  line-height:
    1 !important;

  font-weight:
    800 !important;

  letter-spacing:
    .19em !important;

  text-transform:
    uppercase !important;

  text-shadow:
    0 0 9px
    rgba(240,207,105,.12) !important;
}


#${ROOT_ID} .objective-text{
  display:block !important;

  min-width:0 !important;

  max-width:
    min(
      70vw,
      760px
    ) !important;

  overflow:hidden !important;

  overflow-wrap:anywhere !important;

  word-break:break-word !important;

  text-overflow:ellipsis !important;

  white-space:normal !important;

  color:
    #f4f7f2 !important;

  font-family:
    "Orbitron",
    sans-serif !important;

  font-size:
    15px !important;

  line-height:
    1.25 !important;

  font-weight:
    700 !important;

  letter-spacing:
    .055em !important;

  text-shadow:
    0 0 12px
    rgba(255,255,255,.07) !important;
}

#${ROOT_ID} .rv5-objective > div:last-child{
  min-width:0 !important;
  max-width:100% !important;
}

/* ready */

#${ROOT_ID} .rv5-ready{
  position:relative !important;

  display:flex !important;

  align-items:center !important;

  gap:
    9px !important;

  flex:
    0 0 auto !important;

  min-height:
    34px !important;

  padding:
    0 12px !important;

  color:
    var(--wz-green) !important;

  font-family:
    "Orbitron",
    sans-serif !important;

  font-size:
    9px !important;

  line-height:
    1 !important;

  font-weight:
    800 !important;

  letter-spacing:
    .16em !important;

  white-space:
    nowrap !important;

  border:
    1px solid
    rgba(120,200,121,.20) !important;

  background:
    rgba(120,200,121,.035) !important;

  box-shadow:
    inset 0 0 12px
      rgba(120,200,121,.025),
    0 0 12px
      rgba(120,200,121,.05) !important;
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
    0 0 6px
      rgba(120,200,121,.90),
    0 0 14px
      rgba(120,200,121,.55) !important;

  animation:
    rv5ReadyPulse
    1.6s
    ease-in-out
    infinite !important;
}

@keyframes rv5ReadyPulse{
  0%,100%{
    opacity:.65;
    transform:scale(.90);
  }

  50%{
    opacity:1;
    transform:scale(1.12);
  }
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

  #${ROOT_ID} .rv5-objective-status{
  color:#78c879 !important;
  font-weight:900 !important;
   text-shadow:0 0 8px rgba(120,200,121,.22) !important;
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

/* ============================================================
   TACTICAL MARKER PANEL
   ============================================================ */

#${ROOT_ID} .rv5-tactical-panel{
  position:absolute !important;
  right:24px !important;
  top:120px !important;
  z-index:100 !important;
  width:260px !important;
  padding:14px !important;

  border:1px solid rgba(116,220,229,.22) !important;
  border-left:2px solid var(--wz-amber) !important;

  background:
    linear-gradient(
      145deg,
      rgba(8,14,13,.97),
      rgba(2,6,6,.98)
    ) !important;

  box-shadow:
    0 18px 45px rgba(0,0,0,.65),
    inset 0 0 24px rgba(116,220,229,.025) !important;

  backdrop-filter:blur(10px) !important;

  opacity:0 !important;
  visibility:hidden !important;
  transform:translateX(12px) !important;
  pointer-events:none !important;

  transition:
    opacity .22s ease,
    transform .22s ease,
    visibility .22s ease !important;
}

#${ROOT_ID} .rv5-tactical-panel.visible{
  opacity:1 !important;
  visibility:visible !important;
  transform:translateX(0) !important;
  pointer-events:auto !important;
}

#${ROOT_ID} .rv5-tactical-panel-head{
  display:flex !important;
  align-items:center !important;
  justify-content:space-between !important;
  margin-bottom:12px !important;
}

#${ROOT_ID} .rv5-tactical-panel-head span{
  color:#6e8580 !important;
  font-family:"Orbitron",sans-serif !important;
  font-size:6px !important;
  font-weight:800 !important;
  letter-spacing:.16em !important;
}

#${ROOT_ID} .rv5-tactical-close{
  width:22px !important;
  height:22px !important;

  border:1px solid rgba(190,198,188,.16) !important;
  background:rgba(255,255,255,.025) !important;

  color:#9da9a0 !important;
  font-size:15px !important;
  line-height:1 !important;

  cursor:pointer !important;
}

#${ROOT_ID} .rv5-tactical-panel > strong{
  display:block !important;

  color:#f0f3ec !important;

  font-family:"Orbitron",sans-serif !important;
  font-size:15px !important;
  font-weight:900 !important;
  letter-spacing:.06em !important;
}

#${ROOT_ID} .rv5-tactical-panel > b{
  display:block !important;

  margin-top:7px !important;

  color:#78c879 !important;

  font-family:"Orbitron",sans-serif !important;
  font-size:8px !important;
  letter-spacing:.13em !important;
}

#${ROOT_ID} .rv5-tactical-panel > p{
  margin:10px 0 0 !important;

  color:#8e9b92 !important;

  font-family:"Orbitron",sans-serif !important;
  font-size:7px !important;
  line-height:1.55 !important;
  letter-spacing:.06em !important;
}

#${ROOT_ID} .rv5-marker-hit{
  pointer-events:auto !important;
}

@media(max-width:600px){

  #${ROOT_ID} .rv5-tactical-panel{
    left:10px !important;
    right:10px !important;
    top:auto !important;
    bottom:72px !important;
    width:auto !important;
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
  y="${p.y-28}"
  text-anchor="middle"
  class="label checkpoint-label">
  CP ${i+1}
</text>

<g
  class="rv5-marker-hit"
  data-marker-type="checkpoint"
  data-marker-index="${i+1}"
  style="cursor:pointer">

  <circle
    cx="${p.x}"
    cy="${p.y}"
    r="25"
    fill="transparent">
  </circle>

</g>

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
  x="${p.x+23}"
  y="${p.y+4}"
  class="label hostile-label">
  HOSTILE
</text>

<g
  class="rv5-marker-hit"
  data-marker-type="hostile"
  data-marker-index="${d.enemies.indexOf(item)+1}"
  style="cursor:pointer">

  <circle
    cx="${p.x}"
    cy="${p.y}"
    r="25"
    fill="transparent">
  </circle>

</g>
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
  y2="${p.y-18}"
  class="guide-stem">
</line>

<text
  x="${p.x}"
  y="${p.y-24}"
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
  x="${d.points.start.x+21}"
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
  x="${d.points.goal.x+25}"
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
  x="${d.points.player.x+19}"
  y="${d.points.player.y-17}"
  class="label player-label">
  YOU
</text>

    </g>

  `;

  installMarkerInteractions();
}


function installMarkerInteractions() {

  const svg =
    root.querySelector('.rv5-svg');

  if (!svg) return;

  if (
    svg.dataset.markerInteractions === '1'
  ) {
    return;
  }

  svg.dataset.markerInteractions = '1';

  svg.addEventListener(
    'click',
    event => {

      const target =
        event.target instanceof Element
          ? event.target.closest(
              '.rv5-marker-hit'
            )
          : null;

      if (!target) return;

      const type =
        target.dataset.markerType || '';

      const index =
        target.dataset.markerIndex || '';

      let title = 'TACTICAL NODE';
      let status = 'LOCKED';
      let detail = 'ROUTE INFORMATION';

      if (type === 'checkpoint') {

        title =
          `CHECKPOINT ${index}`;

        status =
          'ROUTE NODE';

        detail =
          'CHECKPOINT AHEAD // SYNC REQUIRED';

      }

      if (type === 'hostile') {

        title =
          `HOSTILE ZONE ${index}`;

        status =
          'THREAT ACTIVE';

        detail =
          'HIGH RISK AREA // AVOID EXPOSURE';

      }

      showTacticalPanel(
        title,
        status,
        detail
      );

    }
  );
}


function showTacticalPanel(
  title,
  status,
  detail
) {

  let panel =
    root.querySelector(
      '.rv5-tactical-panel'
    );

  if (!panel) {

    panel =
      document.createElement('div');

    panel.className =
      'rv5-tactical-panel';

    root.querySelector(
      '.rv5-shell'
    )?.appendChild(panel);
  }

  panel.innerHTML = `

    <div class="rv5-tactical-panel-head">

      <span>TACTICAL INTELLIGENCE</span>

      <button
        type="button"
        class="rv5-tactical-close">
        ×
      </button>

    </div>

    <strong>${esc(title)}</strong>

    <b>${esc(status)}</b>

    <p>${esc(detail)}</p>

   `;

  panel.classList.add('visible');

  panel
    .querySelector(
      '.rv5-tactical-close'
    )
    ?.addEventListener(
      'click',
      () => {

        panel.classList.remove(
          'visible'
        );

      }
    );
}
  /*
   * ============================================================
   * PLAYER UPDATE
   * ============================================================
   */

  function updateThreatStatus(scene) {

  if (!scene) return;

  const d = mapModel(scene);

  const threatEl =
    root.querySelector('.rv5-threat-status');

  if (!threatEl) return;

  const enemies =
    d.enemies.length;

  const hostile =
    d.obstacles.length;

  const total =
    enemies + hostile;

  let status = 'LOW';

  if (total >= 6) {
    status = 'CRITICAL';
  } else if (total >= 4) {
    status = 'HIGH';
  } else if (total >= 2) {
    status = 'MEDIUM';
  }

  threatEl.textContent = status;

  threatEl.dataset.threat = status;
}


function updateRouteTelemetry(scene) {

  if (!scene) return;

  const d = mapModel(scene);

  const routePoints = [
    d.points.start,
    ...d.checkpoints.map(d.point),
    d.points.goal
  ];

  let distance = 0;

  for (let i = 1; i < routePoints.length; i++) {

    const a = routePoints[i - 1];
    const b = routePoints[i];

    distance += Math.hypot(
      b.x - a.x,
      b.y - a.y
    );
  }

  const distanceEl =
    root.querySelector('.rv5-route-distance');

  if (distanceEl) {
    distanceEl.textContent =
      `${Math.round(distance)}M`;
  }
}


function updatePlayer() {

  if (!active) return;

  const scene = runner();

  const svg =
    root.querySelector('.rv5-svg');

  const player =
    svg?.querySelector('#rv5-player');

  if (!scene || !player) return;

  const d = mapModel(scene);

  const px = d.points.player.x;
  const py = d.points.player.y;

  const circle =
    player.querySelector('.player');

  const ring =
    player.querySelector('.player-ring');

  const radius =
    player.querySelector('.player-radius');

  const label =
    player.querySelector('text');

  circle?.setAttribute('cx', px);
  circle?.setAttribute('cy', py);

  ring?.setAttribute('cx', px);
  ring?.setAttribute('cy', py);

  radius?.setAttribute('cx', px);
  radius?.setAttribute('cy', py);

  label?.setAttribute('x', px + 19);
  label?.setAttribute('y', py - 17);

  player.querySelectorAll('.player-cross').forEach(line => {

    const x1 = Number(line.getAttribute('data-x1'));
    const y1 = Number(line.getAttribute('data-y1'));
    const x2 = Number(line.getAttribute('data-x2'));
    const y2 = Number(line.getAttribute('data-y2'));

    if (
      Number.isFinite(x1) &&
      Number.isFinite(y1) &&
      Number.isFinite(x2) &&
      Number.isFinite(y2)
    ) {
      line.setAttribute(
        'x1',
        px + (x1 - 500)
      );

      line.setAttribute(
        'y1',
        py + (y1 - 300)
      );

      line.setAttribute(
        'x2',
        px + (x2 - 500)
      );

      line.setAttribute(
        'y2',
        py + (y2 - 300)
      );
    }

  });

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

const BRIEFING_MS = 15000;

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
    ms / BRIEFING_MS,
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

updateTimer(BRIEFING_MS);

timerId =
  setInterval(
    () => {
      updateTimer(
        BRIEFING_MS -
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
    () => {

      updatePlayer();

      updateRouteTelemetry(
        runner()
      );

      updateThreatStatus(
        runner()
      );

    },
    100
  );

finishId =
  setTimeout(
    finish,
    BRIEFING_MS
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
       * Home Start is the direct entry into the runner.  Do not cover it
       * with the full-screen route briefing; the briefing is reserved for
       * in-game transitions such as retry and next mission.
       */
      if (
        button.matches(
          '#intro #start'
        )
      ) {
        return;
      }

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
