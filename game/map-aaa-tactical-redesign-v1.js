/* Relay Runner — AAA tactical mission-map presentation layer.
 * Presentation only: does not own mission selection, countdown, or gameplay state.
 * UI polish + responsive/performance pass.
 */
(() => {
  'use strict';

  if (window.__relayMapAAATacticalV1) return;
  window.__relayMapAAATacticalV1 = true;

  const ROOT_ID = 'relayGameplayIntroFinalV3';

  const root = () =>
    document.getElementById(ROOT_ID);

  const scene = () =>
    window.__relayRunnerScene ||
    window.game?.scene?.getScene?.('runner') ||
    null;

   let lastMissionKey = '';
  let refreshQueued = false;

  function ensureShell() {
    const r = root();
    if (!r) return null;

    const shell = r.querySelector('.map-briefing-shell');
    if (!shell) return null;

    const mapWrap = shell.querySelector('.map-briefing-map-wrap');
    if (!mapWrap) return shell;

    if (!shell.querySelector('.aaa-map-chrome')) {
      const chrome = document.createElement('div');

      chrome.className = 'aaa-map-chrome';

      chrome.innerHTML = `
        <div class="aaa-map-corner aaa-map-corner-tl"></div>
        <div class="aaa-map-corner aaa-map-corner-tr"></div>
        <div class="aaa-map-corner aaa-map-corner-bl"></div>
        <div class="aaa-map-corner aaa-map-corner-br"></div>

        <div class="aaa-map-topline">
          <span>RELAY NETWORK / TACTICAL OVERVIEW</span>

          <span class="aaa-map-live">
            <i></i>
            LIVE INTEL
          </span>
        </div>

        <div class="aaa-map-bottomline">
          <span>ROUTE DATA // ENCRYPTED</span>
          <span>SCAN · ACTIVE</span>
        </div>
      `;

      mapWrap.appendChild(chrome);
    }

    if (!shell.querySelector('.aaa-map-card')) {
      const card = document.createElement('aside');

      card.className = 'aaa-map-card';

      card.setAttribute(
        'aria-label',
        'Current mission details'
      );

      card.innerHTML = `
        <div class="aaa-card-accent"></div>

        <div class="aaa-card-status">
          <span class="aaa-status-dot"></span>
          <span>MISSION READY</span>
          <b>01</b>
        </div>

        <div class="aaa-card-kicker">
          CURRENT OPERATION
        </div>

        <h3 class="aaa-card-title">
          CURRENT MISSION
        </h3>

        <p class="aaa-card-district">
          CURRENT DISTRICT
        </p>

        <div class="aaa-card-grid">
          <div>
            <small>DIFFICULTY</small>
            <strong data-aaa-difficulty>—</strong>
          </div>

          <div>
            <small>THREAT</small>
            <strong data-aaa-threat>—</strong>
          </div>

          <div>
            <small>ROUTE</small>
            <strong data-aaa-route>ACTIVE</strong>
          </div>

          <div>
            <small>SIGNALS</small>
            <strong data-aaa-signals>—</strong>
          </div>

          <div>
            <small>REWARD</small>
            <strong data-aaa-reward>XP</strong>
          </div>
        </div>

        <div class="aaa-card-objective">
          <span>OBJECTIVE</span>

          <strong data-aaa-objective>
            FOLLOW THE RELAY
          </strong>
        </div>
      `;

      shell.appendChild(card);
    }

    return shell;
  }

  function missionData(s) {
    const m = s?.mission || {};

    const difficulty = String(
      m.difficulty ||
      s?.sys?.settings?.data?.difficulty ||
      'STANDARD'
    )
      .replace(/[_-]+/g, ' ')
      .toUpperCase();

    const signals =
      Array.isArray(m.signals)
        ? m.signals.length
        : (
            Array.isArray(
              s?.signals?.getChildren?.()
            )
              ? s.signals.getChildren().length
              : null
          );

    const reward =
      Number.isFinite(Number(m.reward))
        ? `${Number(m.reward)} XP`
        : 'RELAY XP';

    const enemyCount =
      Array.isArray(m.enemies)
        ? m.enemies.length
        : 0;

    const hasBoss = Boolean(m.boss);
    const hasChase = Boolean(m.chase);
    const hasBlackout = Boolean(m.blackout);

    let threatLevel = 1;

    if (difficulty.includes('4/5') || difficulty.includes('5/5')) {
      threatLevel += 2;
    } else if (difficulty.includes('3/5')) {
      threatLevel += 1;
    }

    if (enemyCount >= 3) {
      threatLevel += 1;
    } else if (enemyCount >= 1) {
      threatLevel += 0.5;
    }

    if (hasBoss) {
      threatLevel += 2;
    }

    if (hasChase) {
      threatLevel += 1;
    }

    if (hasBlackout) {
      threatLevel += 0.5;
    }

    threatLevel = Math.min(
      5,
      Math.max(1, Math.round(threatLevel))
    );

    const threat =
      threatLevel >= 5
        ? 'CRITICAL'
        : threatLevel === 4
          ? 'HIGH'
          : threatLevel === 3
            ? 'ELEVATED'
            : threatLevel === 2
              ? 'MODERATE'
              : 'LOW';

    return {
      id: String(m.id || '01').toUpperCase(),

      title: String(
        m.title || 'CURRENT MISSION'
      ).trim(),

      district: String(
        m.district || 'CURRENT DISTRICT'
      ).trim(),

      objective: String(
        m.objective || 'FOLLOW THE RELAY'
      ).trim(),

      difficulty,

      threat,

      threatLevel,

      signals:
        signals == null
          ? '—'
          : String(signals).padStart(2, '0'),

      reward
    };
  }

  function updateCard() {
    const r = root();
    const s = scene();

    if (!r || !s || r.hidden) return;

    ensureShell();

    const d = missionData(s);

    const missionKey = [
      d.id,
      d.title,
      d.district,
      d.objective,
      d.difficulty,
      d.threat,
      d.threatLevel,
      d.signals,
      d.reward
    ].join('|');

    if (missionKey === lastMissionKey) {
      return;
    }

    lastMissionKey = missionKey;

    const set = (selector, value) => {
      const el = r.querySelector(selector);

      if (el) {
        el.textContent = value;
      }
    };

    set('.aaa-card-title', d.title);
    set('.aaa-card-district', d.district.toUpperCase());
    set('[data-aaa-difficulty]', d.difficulty);
    set('[data-aaa-threat]', `${d.threat} · ${d.threatLevel}/5`);
    set('[data-aaa-route]', 'ACTIVE');
    set('[data-aaa-signals]', d.signals);
    set('[data-aaa-reward]', d.reward);
    set('[data-aaa-objective]', d.objective);

    const badge = r.querySelector('.aaa-card-status b');

    if (badge) {
      badge.textContent = d.id;
    }
  }

  function promoteSvg() {
    const r = root();

    const svg = r?.querySelector('.map-briefing-map');

    if (!svg) return;

    svg
      .querySelectorAll(
        'circle.marker-start,' +
        'circle.marker-goal,' +
        'circle.marker-player,' +
        'circle.enemy,' +
        'circle.checkpoint-ring'
      )
      .forEach(circle => {
        if (circle.dataset.aaaHex === '1') {
          return;
        }

        const cls =
          circle.getAttribute('class') || '';

        const cx = Number(
          circle.getAttribute('cx') || 0
        );

        const cy = Number(
          circle.getAttribute('cy') || 0
        );

        const radius = Number(
          circle.getAttribute('r') || 8
        );

        const points = Array.from(
          { length: 6 },
          (_, i) => {
            const angle =
              Math.PI / 6 +
              i * Math.PI / 3;

            return (
              `${(
                cx +
                Math.cos(angle) *
                radius *
                1.42
              ).toFixed(1)},` +
              `${(
                cy +
                Math.sin(angle) *
                radius *
                1.42
              ).toFixed(1)}`
            );
          }
        ).join(' ');

        const polygon =
          document.createElementNS(
            'http://www.w3.org/2000/svg',
            'polygon'
          );

        polygon.setAttribute(
          'points',
          points
        );

        polygon.setAttribute(
          'class',
          cls
        );

        polygon.dataset.aaaHex = '1';

        for (const attr of [
          'data-index',
          'aria-label'
        ]) {
          if (circle.hasAttribute(attr)) {
            polygon.setAttribute(
              attr,
              circle.getAttribute(attr)
            );
          }
        }

        circle.replaceWith(polygon);
      });
  }

  function installGameplayClick() {
  const r = root();
  if (!r) return;

  const shell = r.querySelector('.map-briefing-shell');
  if (!shell) return;

  if (shell.dataset.gameplayClickInstalled === '1') {
    return;
  }

  shell.dataset.gameplayClickInstalled = '1';

  shell.style.cursor = 'pointer';

  shell.addEventListener('click', event => {
    const target = event.target;

    if (
      target instanceof HTMLElement &&
      target.closest('button, a, input, select, textarea')
    ) {
      return;
    }

    const start = document.getElementById('start');

    if (start instanceof HTMLButtonElement) {
      start.click();
    }
  });
}

  const style = document.createElement('style');

  style.textContent = `
    /* =========================================================
       RELAY RUNNER · AAA TACTICAL MAP
       ========================================================= */

    #${ROOT_ID} {
      background:
        radial-gradient(
          circle at 50% 28%,
          rgba(207,169,74,.035),
          transparent 38%
        ),
        #010204 !important;

      color:#f5f0df !important;
      overscroll-behavior:contain !important;
    }

#${ROOT_ID} .map-briefing-title{
  position:relative;
}

#${ROOT_ID},
#${ROOT_ID} * {
  font-family:"Orbitron",sans-serif !important;
}

#${ROOT_ID} .map-briefing-title::after{
  content:"";
  display:block;

 width:min(140px,34%);
  height:2px;

  margin-top:9px;

  background:
    linear-gradient(
      90deg,
      #63ddff,
      rgba(99,221,255,.18),
      transparent
    );

  box-shadow:
    0 0 8px rgba(99,221,255,.28);
}
  #${ROOT_ID},
    #${ROOT_ID} .map-briefing-shell {
    font-family:"Orbitron",sans-serif !important;
      position:relative !important;

      width:min(1400px,96vw) !important;
      height:min(900px,94dvh) !important;

      min-width:0 !important;
      min-height:0 !important;

      display:grid !important;

      grid-template-rows:
        auto
        minmax(0,1fr)
        auto !important;

      padding:20px !important;
      gap:16px !important;

      overflow:hidden !important;

      border:1px solid rgba(208,169,73,.42) !important;
      border-radius:10px !important;

      background:
        linear-gradient(
          145deg,
          #050607 0%,
          #0a0b0c 54%,
          #030405 100%
        ) !important;

      box-shadow:
        0 28px 90px rgba(0,0,0,.78),
        0 0 55px rgba(208,169,73,.07),
        inset 0 0 0 1px rgba(255,255,255,.018) !important;
    }

    #${ROOT_ID} .map-briefing-head {
      position:relative !important;
      z-index:8 !important;

      width:100% !important;
      min-width:0 !important;

      display:flex !important;
      align-items:center !important;
      justify-content:space-between !important;

      gap:18px !important;

      padding:6px 8px 4px !important;
    }

    #${ROOT_ID} .map-briefing-kicker {
      color:#cfa94a !important;
      letter-spacing:.24em !important;
      font-weight:800 !important;
    }

    #${ROOT_ID} .map-briefing-title {
      min-width:0 !important;
      max-width:calc(100% - 92px) !important;

      color:#f6f1df !important;

      font-size:clamp(24px,3.6vw,42px) !important;
      line-height:1 !important;

      letter-spacing:.085em !important;

      text-wrap:balance;
      overflow-wrap:anywhere !important;

      text-shadow:
        0 0 22px rgba(207,169,74,.12) !important;
    }

    #${ROOT_ID} .map-briefing-meta {
      color:#687077 !important;
    }

    #${ROOT_ID} .map-briefing-timer {
      width:70px !important;
      height:70px !important;

      min-width:70px !important;
      min-height:70px !important;

      flex:0 0 70px !important;

      display:flex !important;
      flex-direction:column !important;
      align-items:center !important;
      justify-content:center !important;

      border:1px solid rgba(207,169,74,.55) !important;
      border-radius:6px !important;

      background:
        linear-gradient(
          145deg,
          #08090a,
          #0d0e10
        ) !important;

      box-shadow:
        inset 0 0 18px rgba(207,169,74,.025),
        0 0 22px rgba(207,169,74,.06) !important;
    }

    #${ROOT_ID} .map-briefing-timer b {
      color:#e5c66b !important;
    }

    #${ROOT_ID} .map-briefing-timer span {
      color:#706957 !important;
    }

    #${ROOT_ID} .map-briefing-map-wrap {
      position:relative !important;

      width:100% !important;
      height:100% !important;

      min-width:0 !important;
      min-height:0 !important;

      display:flex !important;
      align-items:center !important;
      justify-content:center !important;

      overflow:hidden !important;

      border:1px solid rgba(207,169,74,.34) !important;
      border-radius:6px !important;

      background:
        radial-gradient(
          circle at 50% 50%,
          rgba(35,58,67,.12),
          transparent 55%
        ),
        #020506 !important;

      box-shadow:
  inset 0 0 32px rgba(0,0,0,.66),
  inset 0 0 14px rgba(207,169,74,.025),
  inset 0 0 70px rgba(0,0,0,.48),
  0 0 0 1px rgba(255,255,255,.015),
  0 0 35px rgba(99,221,255,.035) !important;
      }

    #${ROOT_ID} .map-briefing-map {
      display:block !important;

      width:100% !important;
      height:100% !important;

      min-width:0 !important;
      min-height:0 !important;

      max-width:100% !important;
      max-height:100% !important;

      object-fit:contain !important;
      object-position:center center !important;

      background:#020506 !important;
    }

    #${ROOT_ID} .map-briefing-map .bg {
      fill:#020506 !important;
    }

    #${ROOT_ID} .map-briefing-map .grid {
  stroke:#31515a !important;
  opacity:.34 !important;
  stroke-width:1 !important;
}

    #${ROOT_ID} .map-briefing-map .platform {
      fill:#111719 !important;
      stroke:#5e553f !important;
    }

#${ROOT_ID} .map-briefing-map .route {
  stroke:#d4ad4d !important;

  stroke-width:2.5 !important;

  paint-order:stroke !important;

 filter:
  drop-shadow(0 0 3px rgba(212,173,77,.45))
  drop-shadow(0 0 10px rgba(99,221,255,.12)) !important;

  stroke-dasharray:12 9 !important;

  animation:
    aaaRouteFlow
    1.8s
    linear
    infinite;
}

@keyframes aaaRouteFlow{
  to{
    stroke-dashoffset:-42;
  }
}
    #${ROOT_ID} .map-briefing-map .route-halo {
      stroke:#d4ad4d !important;
      opacity:.13 !important;
    }

    #${ROOT_ID} .map-briefing-map .marker-start {
      fill:#6e9a61 !important;
      stroke:#d9e9c8 !important;
    }

    #${ROOT_ID} .map-briefing-map .marker-goal {
      fill:#d4ad4d !important;
      stroke:#fff0b0 !important;
      filter:none !important;
    }

   #${ROOT_ID} .map-briefing-map .marker-player {
  fill:#e8d9a8 !important;
  stroke:#8df4ff !important;

  filter:
    drop-shadow(0 0 4px rgba(141,244,255,.65))
    drop-shadow(0 0 12px rgba(99,221,255,.25)) !important;
}

    #${ROOT_ID} .map-briefing-map .checkpoint-ring {
      stroke:#d4ad4d !important;
      stroke-width:2 !important;
    }

    #${ROOT_ID} .map-briefing-map .checkpoint-dot {
      fill:#d4ad4d !important;
    }

    #${ROOT_ID} .map-briefing-map .signal {
      fill:#d4ad4d !important;
      stroke:#fff0b0 !important;
    }

    #${ROOT_ID} .map-briefing-map .enemy {
      fill:#1c1111 !important;
      stroke:#d76b5c !important;
    }

    #${ROOT_ID} .map-briefing-map .secret {
      stroke:#a78bd1 !important;
    }

    #${ROOT_ID} .map-briefing-map .boost {
      fill:#0b252a !important;
      stroke:#79d5e6 !important;
    }

    #${ROOT_ID} .map-briefing-map .boostmark {
      fill:#79d5e6 !important;
    }

    #${ROOT_ID} .map-briefing-map .gate {
      fill:#241416 !important;
      stroke:#d76b5c !important;
    }

    #${ROOT_ID} .map-briefing-map .label {
      fill:#b7a978 !important;
      font-size:8px !important;
    }

    #${ROOT_ID} .map-briefing-map .legend {
      fill:#82775d !important;
    }

    #${ROOT_ID} .map-briefing-map .guide {
      fill:#8bd8e4 !important;
    }

    #${ROOT_ID} .map-briefing-scan {
      background:
        linear-gradient(
          180deg,
          transparent 48%,
          rgba(207,169,74,.045) 50%,
          transparent 52%
        ) !important;

      opacity:.32 !important;
      pointer-events:none !important;
    }

    #${ROOT_ID} .map-briefing-vignette {
      background:
        radial-gradient(
          circle at 52% 48%,
          transparent 50%,
          rgba(0,0,0,.58) 100%
        ) !important;

      pointer-events:none !important;
    }

    #${ROOT_ID} .map-briefing-tag {
      border-color:rgba(207,169,74,.3) !important;
      background:rgba(5,6,7,.86) !important;
      color:#d4ad4d !important;
    }

    #${ROOT_ID} .map-briefing-foot {
      color:#625c4e !important;
    }

    #${ROOT_ID} .map-briefing-objective {
      color:#cfc5ab !important;
    }

   /* =========================================================
   MAP SCAN SYSTEM
   ========================================================= */

#${ROOT_ID} .map-briefing-map-wrap::after{
  content:"";

  position:absolute;

  left:0;
  right:0;

  top:-22%;

  height:22%;

  pointer-events:none;

  z-index:5;

  background:
    linear-gradient(
      180deg,
      transparent 0%,
      rgba(99,221,255,.00) 18%,
      rgba(99,221,255,.10) 50%,
      rgba(99,221,255,.00) 82%,
      transparent 100%
    );

  filter:blur(.5px);

  animation:
    aaaMapScan
    6s
    linear
    infinite;
}

@keyframes aaaMapScan{
  0%{
    transform:translateY(-110%);
    opacity:0;
  }

  12%{
    opacity:.65;
  }

  50%{
    opacity:1;
  }

  88%{
    opacity:.55;
  }

  100%{
    transform:translateY(620%);
    opacity:0;
  }
}

/* =========================================================
   MAP CHROME
   ========================================================= */

    .aaa-map-chrome {
      position:absolute;
      inset:0;
      pointer-events:none;
      z-index:4;
    }

    .aaa-map-topline,
    .aaa-map-bottomline {
      position:absolute;

      left:14px;
      right:14px;

      display:flex;
      justify-content:space-between;
      align-items:center;

      gap:12px;

     color:#71848b;

      font:
        800 7px/1
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      letter-spacing:.17em;
      text-transform:uppercase;

      white-space:nowrap;
      overflow:hidden;
    }
.aaa-map-bottomline span:last-child{
  color:#63ddff;
  text-shadow:
    0 0 8px rgba(99,221,255,.25);
}
    .aaa-map-topline {
      top:12px;
    }

    .aaa-map-bottomline {
      bottom:12px;
    }

    .aaa-map-topline > span,
    .aaa-map-bottomline > span {
      overflow:hidden;
      text-overflow:ellipsis;
    }

.aaa-map-live {
  color:#63ddff;
  flex:0 0 auto;

  text-shadow:
    0 0 8px rgba(99,221,255,.28);

  animation:aaaIntelPulse 2.4s ease-in-out infinite;
}

@keyframes aaaIntelPulse{
  0%,100%{
    opacity:.72;
  }

  50%{
    opacity:1;
  }
}

.aaa-map-live i {
  display:inline-block;

  position:relative;

  width:6px;
  height:6px;

  margin-right:5px;

  border-radius:50%;

  background:#39ff88;

  box-shadow:
    0 0 5px #39ff88,
    0 0 12px rgba(57,255,136,.75);

  animation:
    aaaLive
    1.5s
    ease-in-out
    infinite;
}

.aaa-map-live i::after{
  content:"";

  position:absolute;

  inset:-5px;

  border:
    1px solid
    rgba(57,255,136,.55);

  border-radius:50%;

  animation:
    aaaLiveRing
    1.5s
    ease-out
    infinite;
}

@keyframes aaaLiveRing{
  0%{
    opacity:.75;
    transform:scale(.5);
  }

  100%{
    opacity:0;
    transform:scale(2.4);
  }
}

    .aaa-map-corner {
      position:absolute;

      width:22px;
      height:22px;

      border-color:rgba(212,173,77,.62);
      border-style:solid;
    }

    .aaa-map-corner-tl {
      top:8px;
      left:8px;
      border-width:1px 0 0 1px;
    }

    .aaa-map-corner-tr {
      top:8px;
      right:8px;
      border-width:1px 1px 0 0;
    }

    .aaa-map-corner-bl {
      bottom:8px;
      left:8px;
      border-width:0 0 1px 1px;
    }

    .aaa-map-corner-br {
      bottom:8px;
      right:8px;
      border-width:0 1px 1px 0;
    }

    /* =========================================================
       MISSION CARD
       ========================================================= */

    .aaa-map-card {
      position:absolute;

      z-index:6;

      right:24px;
      bottom:24px;

      width:min(310px,34%);

      max-width:calc(100% - 48px);

      box-sizing:border-box;

      padding:16px;

      border:
        1px solid
        rgba(212,173,77,.48);

      border-radius:5px;

      background:
        linear-gradient(
          145deg,
          rgba(10,10,9,.97),
          rgba(17,16,13,.97)
        );

    box-shadow:
  0 18px 48px rgba(0,0,0,.68),
  0 0 30px rgba(99,221,255,.045),
  inset 0 0 24px rgba(212,173,77,.025);

      overflow:hidden;
    }
.aaa-map-card::before{
  content:"";

  position:absolute;

  top:0;
  right:0;

  width:42px;
  height:42px;

  border-top:
    1px solid
    rgba(99,221,255,.48);

  border-right:
    1px solid
    rgba(99,221,255,.48);

  pointer-events:none;
}

.aaa-map-card::after{
  content:"";

  position:absolute;

  left:0;
  bottom:0;

  width:42px;
  height:42px;

  border-left:
    1px solid
    rgba(99,221,255,.20);

  border-bottom:
    1px solid
    rgba(99,221,255,.20);

  pointer-events:none;
}
  .aaa-map-card{
  isolation:isolate;
}

.aaa-map-card::before,
.aaa-map-card::after{
  z-index:3;
}

.aaa-map-card > *{
  position:relative;
  z-index:4;
}

  .aaa-map-card {
  backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
}

    .aaa-card-accent {
      position:absolute;

      top:0;
      left:14px;
      right:14px;

      height:2px;

      background:
        linear-gradient(
          90deg,
          transparent,
          rgba(212,173,77,.9),
          transparent
        );

      opacity:.8;
    }

    .aaa-card-status {
      display:flex;
      align-items:center;
      gap:7px;

     color:#63ddff;

      font:
        900 7px/1
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      letter-spacing:.16em;
    }

    .aaa-card-status b {
      margin-left:auto;
      color:#d8b458;
      font-size:10px;
      letter-spacing:.08em;
    }
.aaa-status-dot {
  width:6px;
  height:6px;

  flex:0 0 6px;

  border-radius:50%;

  background:#39ff88;

  box-shadow:
    0 0 6px #39ff88,
    0 0 14px rgba(57,255,136,.65);

  animation:
    aaaReadyPulse
    1.6s
    ease-in-out
    infinite;
}
.aaa-map-card .aaa-card-accent{
  animation:aaaCardSweep 3.8s ease-in-out infinite;
}

@keyframes aaaCardSweep{
  0%,100%{
    opacity:.35;
    transform:scaleX(.55);
  }

  50%{
    opacity:1;
    transform:scaleX(1);
  }
}
@keyframes aaaReadyPulse{
  0%,100%{
    opacity:.55;
    transform:scale(.85);
  }

  50%{
    opacity:1;
    transform:scale(1);
  }
}

    .aaa-card-kicker {
      margin-top:16px;

   color:#63ddff;

      font:
        900 7px/1
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

     letter-spacing:.24em;
    }

    .aaa-card-title {
      margin:7px 0 2px;

      color:#f7fbff;

   font:
  800 clamp(18px,2vw,25px)/1.08
  "Orbitron",
  sans-serif;

      letter-spacing:.04em;
      text-transform:uppercase;
      overflow-wrap:anywhere;
      text-wrap:balance;
    }

    .aaa-card-district {
      margin:0;

      color:#c6aa64;

      font:
        800 8px/1.35
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      letter-spacing:.13em;
      text-transform:uppercase;
      overflow-wrap:anywhere;
    }

    .aaa-card-grid {
      display:grid;

      grid-template-columns:1fr 1fr;

      gap:1px;

      margin-top:14px;

      border-top:1px solid rgba(212,173,77,.14);
      border-bottom:1px solid rgba(212,173,77,.14);
    }

    .aaa-card-grid > div {
      min-width:0;
      padding:9px 6px;
    }

    .aaa-card-grid > div:nth-child(odd) {
      border-right:1px solid rgba(212,173,77,.14);
    }

  .aaa-card-grid small {
  display:block;

  color:#6e6757;

  font:
    700 7px/1.2
    "Orbitron",
    sans-serif;

  letter-spacing:.16em;
  white-space:nowrap;
}
    .aaa-card-grid strong {
      display:block;

      margin-top:5px;

      color:#ddd2b7;

      font:
        900 8px/1.2
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      text-transform:uppercase;
      overflow-wrap:anywhere;
    }

    /* DIFFICULTY */

    .aaa-card-grid > div:nth-child(1) strong {
      padding:3px 6px;

      border:
        1px solid
        rgba(255,213,111,.32);

      border-radius:3px;

      background:
        rgba(255,198,76,.08);

      color:#ffe08a;
      box-shadow:
  0 0 12px rgba(255,213,111,.06);
    }

    /* THREAT */

    .aaa-card-grid > div:nth-child(2) strong {
      color:#ff9b82;
      letter-spacing:.08em;
    }

    .aaa-card-grid > div:nth-child(2)
    strong[data-aaa-threat*="CRITICAL"] {
      color:#ff5f61;
      text-shadow:
        0 0 12px rgba(255,95,97,.28);
    }

    .aaa-card-grid > div:nth-child(2)
    strong[data-aaa-threat*="HIGH"] {
      color:#ff8a68;
    }

    .aaa-card-grid > div:nth-child(2)
    strong[data-aaa-threat*="ELEVATED"] {
      color:#f0c56a;
    }

    .aaa-card-grid > div:nth-child(2)
    strong[data-aaa-threat*="MODERATE"] {
      color:#d6d09f;
    }

    .aaa-card-grid > div:nth-child(2)
    strong[data-aaa-threat*="LOW"] {
      color:#9fca9a;
    }

    /* ROUTE */

    .aaa-card-grid > div:nth-child(3) strong {
      color:#b9edf4;
    }

    /* SIGNALS */

    .aaa-card-grid > div:nth-child(4) strong {
      color:#ffe39a;
    }

    /* REWARD */

    .aaa-card-grid > div:nth-child(5) strong {
      color:#ffd66f;
    }

    .aaa-card-objective {
      margin-top:12px;

      padding:10px 10px 9px;

      background:
        linear-gradient(
          90deg,
          rgba(207,169,74,.05),
          rgba(7,8,7,.96)
        );

      border-left:2px solid #cfa94a;
    }

    .aaa-card-objective span {
      display:block;

      color:#6d6655;

     font:
  700 7px/1.1
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      letter-spacing:.15em;
    }

    .aaa-card-objective strong {
      display:block;

      margin-top:5px;
text-shadow:
  0 0 10px rgba(99,221,255,.10);
      color:#f5faff;

      font:
        800 8px/1.4
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      text-transform:uppercase;
      overflow-wrap:anywhere;
    }

    /* =========================================================
       DESKTOP
       ========================================================= */

    @media (min-width:1100px) {
      .aaa-map-card {
        width:310px;
      }
    }

    /* =========================================================
       TABLET
       ========================================================= */

    @media (min-width:761px) and (max-width:1050px) {
      #${ROOT_ID} .map-briefing-shell {
        width:97vw !important;
        padding:13px !important;
        gap:10px !important;
        
      }

      .aaa-map-card {
        width:285px;
        right:16px;
        bottom:16px;
      }
    }

    /* =========================================================
       MOBILE
       ========================================================= */

    @media (max-width:760px) {
      #${ROOT_ID} .map-briefing-shell {
        width:98vw !important;
        height:96dvh !important;

        padding:9px !important;
        gap:8px !important;

        grid-template-rows:
          auto
          minmax(0,1fr)
          auto !important;

        border-radius:6px !important;
      }

      #${ROOT_ID} .map-briefing-head {
        padding:4px !important;
        gap:8px !important;
      }

      #${ROOT_ID} .map-briefing-kicker {
        font-size:8px !important;
        line-height:1.25 !important;
        letter-spacing:.13em !important;
        font-weight:900 !important;
      }

      #${ROOT_ID} .map-briefing-title {
        font-size:clamp(22px,6.5vw,30px) !important;
        line-height:1.05 !important;
        letter-spacing:.055em !important;
      }

      #${ROOT_ID} .map-briefing-meta {
        font-size:8px !important;
        line-height:1.3 !important;
      }

      #${ROOT_ID} .map-briefing-timer {
        width:60px !important;
        height:60px !important;
        flex:0 0 60px !important;
      }

      .aaa-map-topline,
      .aaa-map-bottomline {
        left:9px !important;
        right:9px !important;

        gap:8px !important;

        font-size:7px !important;
        line-height:1.25 !important;

        letter-spacing:.06em !important;

        color:#b6aa8d !important;

        text-shadow:
          0 1px 3px rgba(0,0,0,.95);
      }

      .aaa-map-topline {
        top:9px !important;
      }

      .aaa-map-bottomline {
        bottom:9px !important;
      }

      #${ROOT_ID} .map-briefing-map .label {
        font-size:9px !important;
        font-weight:900 !important;
        fill:#f0e5c7 !important;

        paint-order:stroke !important;

        stroke:#010204 !important;
        stroke-width:2px !important;
        stroke-linejoin:round !important;
      }

      #${ROOT_ID} .map-briefing-map .legend {
        font-size:8.5px !important;
        font-weight:800 !important;
        fill:#d3c7a9 !important;

        paint-order:stroke !important;

        stroke:#010204 !important;
        stroke-width:1.6px !important;
      }

      #${ROOT_ID} .map-briefing-map .guide {
        font-size:9px !important;
        font-weight:900 !important;
        fill:#bff1f7 !important;

        paint-order:stroke !important;

        stroke:#010204 !important;
        stroke-width:1.8px !important;
      }

      .aaa-map-card {
        left:9px !important;
        right:9px !important;
        bottom:9px !important;

        width:auto !important;
        max-width:none !important;

        padding:12px 12px 11px !important;

        border-radius:6px !important;

        background:
          linear-gradient(
            145deg,
            rgba(7,8,8,.99),
            rgba(18,17,13,.985)
          ) !important;

        border:
          1px solid
          rgba(231,198,112,.62) !important;
      }

      .aaa-card-status {
        font-size:7px !important;
        line-height:1.25 !important;
        letter-spacing:.13em !important;
      }

      .aaa-card-status b {
        font-size:10px !important;
      }

      .aaa-card-kicker {
        margin-top:10px !important;
        font-size:7px !important;
        line-height:1.25 !important;
      }

      .aaa-card-title {
        margin:6px 0 3px !important;

        font-size:
          clamp(17px,4.8vw,21px) !important;

        line-height:1.12 !important;
        letter-spacing:.025em !important;

        color:#fff8e7 !important;

        overflow-wrap:anywhere !important;
      }

      .aaa-card-district {
        font-size:8px !important;
        line-height:1.35 !important;
        letter-spacing:.10em !important;
        color:#e8c66d !important;
      }

      .aaa-card-grid {
        margin-top:10px !important;
      }

      .aaa-card-grid > div {
        min-width:0 !important;
        padding:8px 5px !important;
      }

      .aaa-card-grid small {
        font-size:6.5px !important;
        line-height:1.2 !important;
        font-weight:900 !important;
        letter-spacing:.10em !important;
        color:#a79c83 !important;
      }

      .aaa-card-grid strong {
        margin-top:4px !important;
        font-size:9px !important;
        line-height:1.25 !important;
        font-weight:800 !important;
        color:#f5ecd9 !important;
        overflow-wrap:anywhere !important;
      }

      .aaa-card-grid > div:nth-child(1) strong {
        padding:3px 6px !important;

        border:
          1px solid
          rgba(255,213,111,.32) !important;

        border-radius:3px !important;

        background:
          rgba(255,198,76,.08) !important;

        color:#ffe08a !important;
      }

      .aaa-card-grid > div:nth-child(2) strong {
        color:#ff9b82 !important;
        letter-spacing:.08em !important;
      }

      .aaa-card-grid > div:nth-child(3) strong {
        color:#b9edf4 !important;
      }

      .aaa-card-grid > div:nth-child(4) strong {
        color:#ffe39a !important;
      }

      .aaa-card-grid > div:nth-child(5) strong {
        color:#ffd66f !important;
      }

      .aaa-card-objective {
        margin-top:9px !important;
        padding:8px 9px 8px !important;

        border-left:
          3px solid
          #e0bd63 !important;
      }

      .aaa-card-objective span {
        font-size:6.5px !important;
        line-height:1.2 !important;
        letter-spacing:.11em !important;
        color:#a49a84 !important;
      }

      .aaa-card-objective strong {
        margin-top:4px !important;
        font-size:8.5px !important;
        line-height:1.4 !important;
        font-weight:800 !important;
        color:#fff1c9 !important;
        overflow-wrap:anywhere !important;
      }
    }

    /* =========================================================
       SMALL PHONES
       ========================================================= */

    @media (max-width:430px) {
      #${ROOT_ID} .map-briefing-title {
        font-size:clamp(17px,5vw,23px) !important;
        line-height:1.05 !important;
        letter-spacing:.055em !important;
      }
.aaa-map-card{
  padding:10px !important;
}

.aaa-card-grid > div{
  padding:6px 5px !important;
}

.aaa-card-objective{
  margin-top:7px !important;
  padding:7px 8px !important;
}

      #${ROOT_ID} .aaa-map-card {
        display:block !important;
        left:8px !important;
        right:8px !important;
        bottom:8px !important;
        width:auto !important;
        max-width:none !important;
      }

      .aaa-card-grid {
        grid-template-columns:1fr 1fr !important;
      }
    }

    /* =========================================================
       LANDSCAPE PHONES
       ========================================================= */

    @media (max-height:620px) and (orientation:landscape) {
      #${ROOT_ID} .map-briefing-shell {
        height:98dvh !important;

        grid-template-rows:
          auto
          minmax(0,1fr) !important;
      }

      #${ROOT_ID} .map-briefing-foot {
        display:none !important;
      }

      .aaa-map-card {
        left:auto;
        right:12px;
        bottom:12px;

        width:260px;

        padding:9px;
      }

      .aaa-card-kicker {
        margin-top:7px;
      }

      .aaa-card-grid {
        margin-top:7px;
      }

      .aaa-card-objective {
        margin-top:6px;
        padding:6px;
      }
    }

    /* =========================================================
       ACCESSIBILITY
       ========================================================= */

   @media (prefers-reduced-motion:reduce) {
   .aaa-map-card .aaa-card-accent{
  animation:none !important;
}
  .aaa-map-live i,
  .aaa-map-live i::after,
  .aaa-map-card,
  
  #${ROOT_ID} .map-briefing-map-wrap::after,
  #${ROOT_ID} .map-briefing-map .route,
  .aaa-status-dot {
    animation:none !important;
  }
      #${ROOT_ID} *,
      #${ROOT_ID} *::before,
      #${ROOT_ID} *::after {
        scroll-behavior:auto !important;
      }
    }

    /* =========================================================
       TOUCH
       ========================================================= */

    @media (pointer:coarse) {
      .aaa-map-card {
        box-shadow:
          0 10px 26px rgba(0,0,0,.55),
          inset 0 0 18px rgba(212,173,77,.02);
      }

      .aaa-map-live i {
        animation-duration:2.2s;
      }
    }

    @keyframes aaaLive {
      0%,
      100% {
        opacity:.42;
      }

      50% {
        opacity:1;
      }
    }
  `;

  document.head.appendChild(style);

function refresh() {
  refreshQueued = false;

  ensureShell();
  updateCard();
  promoteSvg();
  installGameplayClick();
}

  function queueRefresh() {
    if (refreshQueued) return;

    refreshQueued = true;

    if (
      typeof window.requestAnimationFrame === 'function'
    ) {
      window.requestAnimationFrame(refresh);
    } else {
      refresh();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      queueRefresh,
      { once: true }
    );
  } else {
    queueRefresh();
  }

  window.addEventListener(
    'resize',
    queueRefresh,
    { passive: true }
  );

  window.setInterval(
    queueRefresh,
    2000
  );

const observer =
  new MutationObserver(
    mutations => {
      for (const mutation of mutations) {
        if (
          mutation.addedNodes?.length ||
          mutation.removedNodes?.length
        ) {
          queueRefresh();
          break;
        }
      }
    }
  );

const observedRoot =
  document.getElementById(ROOT_ID) ||
  document.body;

observer.observe(
  observedRoot,
  {
    childList:true,
    subtree:true
  }
);
})();
