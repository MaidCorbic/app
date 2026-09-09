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

  const esc = value =>
    String(value ?? '').replace(
      /[&<>"']/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c])
    );

  let lastMissionKey = '';
  let refreshQueued = false;

  function ensureShell() {
    const r = root();
    if (!r) return null;

    const shell =
      r.querySelector('.map-briefing-shell');

    if (!shell) return null;

    const mapWrap =
      shell.querySelector('.map-briefing-map-wrap');

    if (!mapWrap) return shell;

    if (!shell.querySelector('.aaa-map-chrome')) {
      const chrome =
        document.createElement('div');

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
      const card =
        document.createElement('aside');

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

    const difficulty =
      String(
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

    return {
      id: String(
        m.id || '01'
      ).toUpperCase(),

      title: String(
        m.title || 'CURRENT MISSION'
      ).trim(),

      district: String(
        m.district || 'CURRENT DISTRICT'
      ).trim(),

      objective: String(
        m.objective ||
        'FOLLOW THE RELAY'
      ).trim(),

      difficulty,

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
      d.signals,
      d.reward
    ].join('|');

    if (missionKey === lastMissionKey) {
      return;
    }

    lastMissionKey = missionKey;

    const set = (
      selector,
      value
    ) => {
      const el =
        r.querySelector(selector);

      if (el) {
        el.textContent = value;
      }
    };

    set(
      '.aaa-card-title',
      d.title
    );

    set(
      '.aaa-card-district',
      d.district.toUpperCase()
    );

    set(
      '[data-aaa-difficulty]',
      d.difficulty
    );

    set(
      '[data-aaa-signals]',
      d.signals
    );

    set(
      '[data-aaa-reward]',
      d.reward
    );

    set(
      '[data-aaa-objective]',
      d.objective
    );

    const badge =
      r.querySelector(
        '.aaa-card-status b'
      );

    if (badge) {
      badge.textContent = d.id;
    }
  }

  function promoteSvg() {
    const r = root();

    const svg =
      r?.querySelector(
        '.map-briefing-map'
      );

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
        const cls =
          circle.getAttribute(
            'class'
          ) || '';

        if (
          circle.dataset.aaaHex === '1'
        ) {
          return;
        }

        const cx =
          Number(
            circle.getAttribute('cx') || 0
          );

        const cy =
          Number(
            circle.getAttribute('cy') || 0
          );

        const radius =
          Number(
            circle.getAttribute('r') || 8
          );

        const points =
          Array.from(
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

        for (
          const attr of [
            'data-index',
            'aria-label'
          ]
        ) {
          if (
            circle.hasAttribute(attr)
          ) {
            polygon.setAttribute(
              attr,
              circle.getAttribute(attr)
            );
          }
        }

        circle.replaceWith(
          polygon
        );
      });
  }

  const style =
    document.createElement('style');

  style.textContent = `
    /* =========================================================
       RELAY RUNNER · AAA TACTICAL MAP
       PERFORMANCE + DESKTOP + MOBILE
       ========================================================= */

    #${ROOT_ID}{
      background:
        radial-gradient(
          circle at 50% 28%,
          rgba(207,169,74,.035),
          transparent 38%
        ),
        #010204!important;

      color:#f5f0df!important;

      overscroll-behavior:contain!important;
    }

    #${ROOT_ID},
    #${ROOT_ID} *{
      box-sizing:border-box;
    }

  #${ROOT_ID} .map-briefing-shell{
  position:relative!important;

  width:min(1400px,96vw)!important;
  height:min(900px,94dvh)!important;

  min-width:0!important;
  min-height:0!important;

  display:grid!important;

  grid-template-rows:
    auto
    minmax(0,1fr)
    auto!important;

  padding:20px!important;
  gap:16px!important;

  overflow:hidden!important;

  border:
    1px solid
    rgba(208,169,73,.42)!important;

  border-radius:10px!important;

  background:
    linear-gradient(
      145deg,
      #050607 0%,
      #0a0b0c 54%,
      #030405 100%
    )!important;

  box-shadow:
    0 28px 90px
      rgba(0,0,0,.78),

    0 0 55px
      rgba(208,169,73,.07),

    inset 0 0 0 1px
      rgba(255,255,255,.018)!important;
}

 #${ROOT_ID} .map-briefing-head{
  position:relative!important;
  z-index:8!important;

  width:100%!important;
  min-width:0!important;

  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;

  gap:18px!important;

  padding:6px 8px 4px!important;
}

    #${ROOT_ID} .map-briefing-kicker{
      color:#cfa94a!important;

      letter-spacing:.24em!important;

      font-weight:800!important;
    }

 #${ROOT_ID} .map-briefing-title{
  min-width:0!important;
  max-width:calc(100% - 92px)!important;

  color:#f6f1df!important;

  font-size:clamp(24px,3.6vw,42px)!important;
  line-height:1!important;

  letter-spacing:.085em!important;

  text-wrap:balance;
  overflow-wrap:anywhere!important;

  text-shadow:
    0 0 22px rgba(207,169,74,.12)!important;
}

    #${ROOT_ID} .map-briefing-meta{
      color:#687077!important;
    }

    #${ROOT_ID} .map-briefing-timer{
  width:70px!important;
  height:70px!important;

  min-width:70px!important;
  min-height:70px!important;

  flex:0 0 70px!important;

  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;

  border:1px solid rgba(207,169,74,.55)!important;
  border-radius:6px!important;

  background:
    linear-gradient(
      145deg,
      #08090a,
      #0d0e10
    )!important;

  box-shadow:
    inset 0 0 18px rgba(207,169,74,.025),
    0 0 22px rgba(207,169,74,.06)!important;
}

    #${ROOT_ID} .map-briefing-timer b{
      color:#e5c66b!important;
    }

    #${ROOT_ID} .map-briefing-timer span{
      color:#706957!important;
    }

  #${ROOT_ID} .map-briefing-map-wrap{
  position:relative!important;

  width:100%!important;
  height:100%!important;

  min-width:0!important;
  min-height:0!important;

  display:flex!important;
  align-items:center!important;
  justify-content:center!important;

  overflow:hidden!important;

  border:1px solid rgba(207,169,74,.34)!important;
  border-radius:6px!important;

  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(35,58,67,.12),
      transparent 55%
    ),
    #020506!important;

  box-shadow:
    inset 0 0 32px rgba(0,0,0,.66),
    inset 0 0 14px rgba(207,169,74,.025),
    0 0 0 1px rgba(255,255,255,.015)!important;
}
#${ROOT_ID} .map-briefing-map{
  display:block!important;

  width:100%!important;
  height:100%!important;

  min-width:0!important;
  min-height:0!important;

  max-width:100%!important;
  max-height:100%!important;

  object-fit:contain!important;
  object-position:center center!important;

  background:#020506!important;
}

    #${ROOT_ID} .map-briefing-map .bg{
      fill:#020506!important;
    }

    #${ROOT_ID} .map-briefing-map .grid{
      stroke:#4a3d20!important;

      opacity:.28!important;
    }

    #${ROOT_ID} .map-briefing-map .platform{
      fill:#111719!important;

      stroke:#5e553f!important;
    }

    #${ROOT_ID} .map-briefing-map .route{
      stroke:#d4ad4d!important;

      stroke-width:3!important;

      filter:none!important;

      stroke-dasharray:
        9 7!important;
    }

    #${ROOT_ID} .map-briefing-map .route-halo{
      stroke:#d4ad4d!important;

      opacity:.13!important;
    }

    #${ROOT_ID} .map-briefing-map .marker-start{
      fill:#6e9a61!important;

      stroke:#d9e9c8!important;
    }

    #${ROOT_ID} .map-briefing-map .marker-goal{
      fill:#d4ad4d!important;

      stroke:#fff0b0!important;

      filter:none!important;
    }

    #${ROOT_ID} .map-briefing-map .marker-player{
      fill:#e8d9a8!important;

      stroke:#8df4ff!important;

      filter:none!important;
    }

    #${ROOT_ID} .map-briefing-map .checkpoint-ring{
      stroke:#d4ad4d!important;

      stroke-width:2!important;
    }

    #${ROOT_ID} .map-briefing-map .checkpoint-dot{
      fill:#d4ad4d!important;
    }

    #${ROOT_ID} .map-briefing-map .signal{
      fill:#d4ad4d!important;

      stroke:#fff0b0!important;
    }

    #${ROOT_ID} .map-briefing-map .enemy{
      fill:#1c1111!important;

      stroke:#d76b5c!important;
    }

    #${ROOT_ID} .map-briefing-map .secret{
      stroke:#a78bd1!important;
    }

    #${ROOT_ID} .map-briefing-map .boost{
      fill:#0b252a!important;

      stroke:#79d5e6!important;
    }

    #${ROOT_ID} .map-briefing-map .boostmark{
      fill:#79d5e6!important;
    }

    #${ROOT_ID} .map-briefing-map .gate{
      fill:#241416!important;

      stroke:#d76b5c!important;
    }

    #${ROOT_ID} .map-briefing-map .label{
      fill:#b7a978!important;

      font-size:8px!important;
    }

    #${ROOT_ID} .map-briefing-map .legend{
      fill:#82775d!important;
    }

    #${ROOT_ID} .map-briefing-map .guide{
      fill:#8bd8e4!important;
    }

    #${ROOT_ID} .map-briefing-scan{
      background:
        linear-gradient(
          180deg,
          transparent 48%,
          rgba(207,169,74,.045) 50%,
          transparent 52%
        )!important;

      opacity:.32!important;

      pointer-events:none!important;
    }

    #${ROOT_ID} .map-briefing-vignette{
      background:
        radial-gradient(
          circle at 52% 48%,
          transparent 50%,
          rgba(0,0,0,.58) 100%
        )!important;

      pointer-events:none!important;
    }

    #${ROOT_ID} .map-briefing-tag{
      border-color:
        rgba(207,169,74,.3)!important;

      background:
        rgba(5,6,7,.86)!important;

      color:#d4ad4d!important;
    }

    #${ROOT_ID} .map-briefing-foot{
      color:#625c4e!important;
    }

    #${ROOT_ID} .map-briefing-objective{
      color:#cfc5ab!important;
    }

    /* =========================================================
       MAP CHROME
       ========================================================= */

    .aaa-map-chrome{
      position:absolute;

      inset:0;

      pointer-events:none;

      z-index:4;
    }

    .aaa-map-topline,
    .aaa-map-bottomline{
      position:absolute;

      left:14px;
      right:14px;

      display:flex;

      justify-content:space-between;
      align-items:center;

      gap:12px;

      color:#766b53;

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

    .aaa-map-topline{
      top:12px;
    }

    .aaa-map-bottomline{
      bottom:12px;
    }

    .aaa-map-topline > span,
    .aaa-map-bottomline > span{
      overflow:hidden;

      text-overflow:ellipsis;
    }

    .aaa-map-live{
      color:#a99a73;

      flex:0 0 auto;
    }

    .aaa-map-live i{
      display:inline-block;

      width:5px;
      height:5px;

      margin-right:5px;

      border-radius:50%;

      background:#d4ad4d;

      box-shadow:
        0 0 8px
        rgba(212,173,77,.6);

      animation:
        aaaLive
        1.8s
        ease-in-out
        infinite;
    }

    .aaa-map-corner{
      position:absolute;

      width:22px;
      height:22px;

      border-color:
        rgba(212,173,77,.62);

      border-style:solid;
    }

    .aaa-map-corner-tl{
      top:8px;
      left:8px;

      border-width:
        1px 0 0 1px;
    }

    .aaa-map-corner-tr{
      top:8px;
      right:8px;

      border-width:
        1px 1px 0 0;
    }

    .aaa-map-corner-bl{
      bottom:8px;
      left:8px;

      border-width:
        0 0 1px 1px;
    }

    .aaa-map-corner-br{
      bottom:8px;
      right:8px;

      border-width:
        0 1px 1px 0;
    }

    /* =========================================================
       MISSION CARD
       ========================================================= */

    .aaa-map-card{
      position:absolute;

      z-index:6;

      right:24px;
      bottom:24px;

      width:
        min(
          310px,
          34%
        );

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
        0 14px 38px
        rgba(0,0,0,.58),

        inset 0 0 20px
        rgba(212,173,77,.025);

      overflow:hidden;
    }

    .aaa-card-accent{
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

    .aaa-card-status{
      display:flex;

      align-items:center;

      gap:7px;

      color:#8c825f;

      font:
        900 7px/1
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      letter-spacing:.16em;
    }

    .aaa-card-status b{
      margin-left:auto;

      color:#d8b458;

      font-size:10px;

      letter-spacing:.08em;
    }

    .aaa-status-dot{
      width:6px;
      height:6px;

      flex:0 0 6px;

      border-radius:50%;

      background:#d8b458;

      box-shadow:
        0 0 8px
        rgba(216,180,88,.5);
    }

    .aaa-card-kicker{
      margin-top:16px;

      color:#8b805f;

      font:
        900 7px/1
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      letter-spacing:.2em;
    }

    .aaa-card-title{
      margin:
        7px
        0
        2px;

      color:#f0ead9;

      font:
        950 clamp(18px,2vw,25px)/1.08
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      letter-spacing:.04em;

      text-transform:uppercase;

      overflow-wrap:anywhere;

      text-wrap:balance;
    }

    .aaa-card-district{
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

    .aaa-card-grid{
      display:grid;

      grid-template-columns:
        1fr
        1fr;

      gap:1px;

      margin-top:14px;

      border-top:
        1px solid
        rgba(212,173,77,.14);

      border-bottom:
        1px solid
        rgba(212,173,77,.14);
    }

    .aaa-card-grid > div{
      min-width:0;

      padding:
        9px
        6px;
    }

    .aaa-card-grid > div:nth-child(odd){
      border-right:
        1px solid
        rgba(212,173,77,.14);
    }

    .aaa-card-grid small{
      display:block;

      color:#6e6757;

      font:
        800 6px/1
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      letter-spacing:.16em;

      white-space:nowrap;
    }

    .aaa-card-grid strong{
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

    .aaa-card-objective{
      margin-top:12px;

      padding:
        10px
        10px
        9px;

      background:
        linear-gradient(
          90deg,
          rgba(207,169,74,.05),
          rgba(7,8,7,.96)
        );

      border-left:
        2px solid
        #cfa94a;
    }

    .aaa-card-objective span{
      display:block;

      color:#6d6655;

      font:
        800 6px/1
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      letter-spacing:.15em;
    }

    .aaa-card-objective strong{
      display:block;

      margin-top:5px;

      color:#cfc5ad;

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
       DESKTOP LARGE
       ========================================================= */

    @media (min-width:1100px){

      .aaa-map-card{
        width:310px;
      }
    }

    /* =========================================================
       TABLET
       ========================================================= */

    @media (
      min-width:761px
    ) and (
      max-width:1050px
    ){

      #${ROOT_ID} .map-briefing-shell{
        width:97vw!important;

        padding:13px!important;

        gap:10px!important;
      }

      .aaa-map-card{
        width:285px;

        right:16px;
        bottom:16px;
      }
    }

    /* =========================================================
       MOBILE
       ========================================================= */

       /* =========================================================
       MOBILE · MAXIMUM READABILITY
       ========================================================= */

    @media (max-width:760px){

      #${ROOT_ID} .map-briefing-shell{
        width:98vw!important;
        height:96dvh!important;
        padding:9px!important;
        gap:8px!important;
        grid-template-rows:
          auto
          minmax(0,1fr)
          auto!important;
        border-radius:6px!important;
      }

      #${ROOT_ID} .map-briefing-head{
        padding:4px!important;
        gap:8px!important;
      }

      #${ROOT_ID} .map-briefing-kicker{
        font-size:8px!important;
        line-height:1.25!important;
        letter-spacing:.13em!important;
        font-weight:900!important;
      }

      #${ROOT_ID} .map-briefing-title{
        font-size:
          clamp(
            22px,
            6.5vw,
            30px
          )!important;
        line-height:1.05!important;
        letter-spacing:.055em!important;
      }

      #${ROOT_ID} .map-briefing-meta{
        font-size:8px!important;
        line-height:1.3!important;
      }

      #${ROOT_ID} .map-briefing-timer{
        width:60px!important;
        height:60px!important;
        flex:0 0 60px!important;
      }

      .aaa-map-topline,
      .aaa-map-bottomline{
        left:9px!important;
        right:9px!important;
        gap:8px!important;
        font-size:7px!important;
        line-height:1.25!important;
        letter-spacing:.06em!important;
        color:#b6aa8d!important;
        text-shadow:
          0 1px 3px rgba(0,0,0,.95);
      }

      .aaa-map-topline{
        top:9px!important;
      }

      .aaa-map-bottomline{
        bottom:9px!important;
      }

      #${ROOT_ID} .map-briefing-map .label{
        font-size:9px!important;
        font-weight:900!important;
        fill:#f0e5c7!important;
        paint-order:stroke!important;
        stroke:#010204!important;
        stroke-width:2px!important;
        stroke-linejoin:round!important;
      }

      #${ROOT_ID} .map-briefing-map .legend{
        font-size:8.5px!important;
        font-weight:800!important;
        fill:#d3c7a9!important;
        paint-order:stroke!important;
        stroke:#010204!important;
        stroke-width:1.6px!important;
      }

      #${ROOT_ID} .map-briefing-map .guide{
        font-size:9px!important;
        font-weight:900!important;
        fill:#bff1f7!important;
        paint-order:stroke!important;
        stroke:#010204!important;
        stroke-width:1.8px!important;
      }

      .aaa-map-card{
        left:9px!important;
        right:9px!important;
        bottom:9px!important;
        width:auto!important;
        max-width:none!important;
        padding:
          12px
          12px
          11px!important;
        border-radius:6px!important;
        background:
          linear-gradient(
            145deg,
            rgba(7,8,8,.99),
            rgba(18,17,13,.985)
          )!important;
        border:
          1px solid
          rgba(231,198,112,.62)!important;
      }

      .aaa-card-status{
        font-size:7px!important;
        line-height:1.25!important;
        letter-spacing:.13em!important;
      }

      .aaa-card-status b{
        font-size:10px!important;
      }

      .aaa-card-kicker{
        margin-top:10px!important;
        font-size:7px!important;
        line-height:1.25!important;
      }

      .aaa-card-title{
        margin:
          6px
          0
          3px!important;
        font-size:
          clamp(
            17px,
            4.8vw,
            21px
          )!important;
        line-height:1.12!important;
        letter-spacing:.025em!important;
        color:#fff8e7!important;
        overflow-wrap:anywhere!important;
      }

      .aaa-card-district{
        font-size:8px!important;
        line-height:1.35!important;
        letter-spacing:.10em!important;
        color:#e8c66d!important;
      }

      .aaa-card-grid{
        margin-top:10px!important;
      }

      .aaa-card-grid > div{
        min-width:0!important;
        padding:
          8px
          5px!important;
      }

      .aaa-card-grid small{
        font-size:6.5px!important;
        line-height:1.2!important;
        font-weight:900!important;
        letter-spacing:.10em!important;
        color:#a79c83!important;
      }

      .aaa-card-grid strong{
        margin-top:4px!important;
        font-size:9px!important;
        line-height:1.25!important;
        font-weight:950!important;
        color:#f5ecd9!important;
        overflow-wrap:anywhere!important;
      }

      .aaa-card-grid > div:nth-child(1) strong{
        padding:
          3px
          6px!important;
        border:
          1px solid
          rgba(255,213,111,.32)!important;
        border-radius:3px!important;
        background:
          rgba(255,198,76,.08)!important;
        color:#ffe08a!important;
      }

      .aaa-card-grid > div:nth-child(2) strong{
        color:#b9edf4!important;
      }

      .aaa-card-grid > div:nth-child(3) strong{
        color:#ffe39a!important;
      }

      .aaa-card-grid > div:nth-child(4) strong{
        color:#ffd66f!important;
      }

      .aaa-card-objective{
        margin-top:9px!important;
        padding:
          8px
          9px
          8px!important;
        border-left:
          3px solid
          #e0bd63!important;
      }

      .aaa-card-objective span{
        font-size:6.5px!important;
        line-height:1.2!important;
        letter-spacing:.11em!important;
        color:#a49a84!important;
      }

      .aaa-card-objective strong{
        margin-top:4px!important;
        font-size:8.5px!important;
        line-height:1.4!important;
        font-weight:950!important;
        color:#fff1c9!important;
        overflow-wrap:anywhere!important;
      }

      #${ROOT_ID} .map-briefing-foot{
        padding-bottom:2px!important;
        font-size:7px!important;
        line-height:1.25!important;
        color:#8f8775!important;
      }
    }

    /* =========================================================
       SMALL PHONES
       ========================================================= */

     /* =========================================================
       SMALL PHONES · READABILITY
       ========================================================= */

    @media (max-width:430px){

      #${ROOT_ID} .map-briefing-shell{
        width:99vw!important;
        height:97dvh!important;
        padding:7px!important;
        gap:6px!important;
      }

      #${ROOT_ID} .map-briefing-title{
        font-size:
          clamp(
            20px,
            6.8vw,
            25px
          )!important;

        line-height:1.05!important;
        letter-spacing:.045em!important;
      }

      .aaa-map-topline,
      .aaa-map-bottomline{
        font-size:6px!important;
        line-height:1.2!important;
        letter-spacing:.045em!important;
      }

      #${ROOT_ID} .map-briefing-map .label{
        font-size:8.5px!important;
        font-weight:900!important;

        fill:#f0e5c7!important;

        paint-order:stroke!important;
        stroke:#010204!important;
        stroke-width:1.8px!important;
        stroke-linejoin:round!important;
      }

      #${ROOT_ID} .map-briefing-map .legend{
        font-size:8px!important;
        font-weight:800!important;

        fill:#d3c7a9!important;

        paint-order:stroke!important;
        stroke:#010204!important;
        stroke-width:1.5px!important;
      }

      #${ROOT_ID} .map-briefing-map .guide{
        font-size:8.5px!important;
        font-weight:900!important;

        fill:#bff1f7!important;

        paint-order:stroke!important;
        stroke:#010204!important;
        stroke-width:1.6px!important;
      }

      .aaa-map-card{
        left:7px!important;
        right:7px!important;
        bottom:7px!important;

        padding:
          10px
          10px
          9px!important;

        border-radius:6px!important;
      }

      .aaa-card-status{
        font-size:6.5px!important;
        line-height:1.2!important;
        letter-spacing:.11em!important;
      }

      .aaa-card-status b{
        font-size:10px!important;
      }

      .aaa-card-kicker{
        margin-top:8px!important;
        font-size:6.5px!important;
        line-height:1.25!important;
      }

      .aaa-card-title{
        font-size:15px!important;
        line-height:1.12!important;
        letter-spacing:.02em!important;
      }

      .aaa-card-district{
        font-size:7.5px!important;
        line-height:1.35!important;
        letter-spacing:.08em!important;
      }

      .aaa-card-grid{
        margin-top:8px!important;
      }

      .aaa-card-grid > div{
        padding:
          7px
          4px!important;
      }

      .aaa-card-grid small{
        font-size:6px!important;
        line-height:1.2!important;
        letter-spacing:.08em!important;
      }

      .aaa-card-grid strong{
        font-size:8px!important;
        line-height:1.25!important;
        margin-top:4px!important;
      }

      .aaa-card-objective{
        margin-top:7px!important;
        padding:
          7px
          8px!important;
      }

      .aaa-card-objective span{
        font-size:6px!important;
        line-height:1.2!important;
      }

      .aaa-card-objective strong{
        font-size:7.5px!important;
        line-height:1.4!important;
      }
    }

    /* =========================================================
       LANDSCAPE PHONES
       ========================================================= */

    @media (
      max-height:620px
    ) and (
      orientation:landscape
    ){

      #${ROOT_ID} .map-briefing-shell{
        height:98dvh!important;

        grid-template-rows:
          auto
          minmax(0,1fr)!important;
      }

      #${ROOT_ID} .map-briefing-foot{
        display:none!important;
      }

      .aaa-map-card{
        left:auto;

        right:12px;
        bottom:12px;

        width:260px;

        padding:9px;
      }

      .aaa-card-kicker{
        margin-top:7px;
      }

      .aaa-card-grid{
        margin-top:7px;
      }

      .aaa-card-objective{
        margin-top:6px;

        padding:6px;
      }
    }

    /* =========================================================
       ACCESSIBILITY
       ========================================================= */

    @media (prefers-reduced-motion:reduce){

      .aaa-map-live i{
        animation:none!important;
      }

      #${ROOT_ID} *,
      #${ROOT_ID} *::before,
      #${ROOT_ID} *::after{
        scroll-behavior:auto!important;
      }
    }

    /* =========================================================
       TOUCH DEVICES
       ========================================================= */

    @media (pointer:coarse){

      .aaa-map-card{
        box-shadow:
          0 10px 26px
          rgba(0,0,0,.55),

          inset 0 0 18px
          rgba(212,173,77,.02);
      }

      .aaa-map-live i{
        animation-duration:2.2s;
      }
    }

    @keyframes aaaLive{
      0%,
      100%{
        opacity:.42;
      }

      50%{
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
  }

  function queueRefresh() {
    if (refreshQueued) return;

    refreshQueued = true;

    if (
      typeof window.requestAnimationFrame ===
      'function'
    ) {
      window.requestAnimationFrame(
        refresh
      );
    } else {
      refresh();
    }
  }

  if (
    document.readyState ===
    'loading'
  ) {
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

  /*
   * Keep live mission updates,
   * but reduce unnecessary work.
   */
  window.setInterval(
    queueRefresh,
    1000
  );

  /*
   * Re-run when another module
   * inserts the tactical intro/map.
   */
  const observer =
    new MutationObserver(
      mutations => {
        for (
          const mutation of mutations
        ) {
          if (
            mutation.addedNodes?.length
          ) {
            queueRefresh();

            break;
          }
        }
      }
    );

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );
})();
