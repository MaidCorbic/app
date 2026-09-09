(() => {
  'use strict';

  if (window.__relayMobileCsgoFullMapV1) return;
  window.__relayMobileCsgoFullMapV1 = true;

  const isMobile = () => matchMedia('(max-width: 760px)').matches;

  const scene = () =>
    window.__relayRunnerScene ||
    window.game?.scene?.getScene?.('runner') ||
    null;

  const intro = () =>
    document.getElementById('relayGameplayIntroFinalV3');

  const svg = () =>
    intro()?.querySelector('.map-briefing-map');

  const n = (v, d = 0) =>
    Number.isFinite(Number(v)) ? Number(v) : d;

  const clamp = (v, a, b) =>
    Math.max(a, Math.min(b, v));


  /* =========================================================
     POINT
     ========================================================= */

  function point(v, sx, sy) {
    if (Array.isArray(v)) {
      return {
        x: n(v[0]) * sx,
        y: n(v[1]) * sy
      };
    }

    return {
      x: n(v?.x) * sx,
      y: n(v?.y) * sy
    };
  }


  /* =========================================================
     DRAW MAP
     ========================================================= */

  function draw() {

    if (!isMobile()) return;

    const root = intro();
    const el = svg();
    const s = scene();

    if (!root || !el || !s) return;

    const m = s.mission || {};

    const worldW =
      n(
        s.physics?.world?.bounds?.width,
        n(m.goal?.x, 6100) + 300
      );

    const worldH =
      n(
        s.physics?.world?.bounds?.height,
        720
      );

const W = 1000;
const H = 560;

el.setAttribute(
  'viewBox',
  `0 0 ${W} ${H}`
);

el.setAttribute(
  'preserveAspectRatio',
  'xMidYMid meet'
);

el.setAttribute('width', '100%');
el.setAttribute('height', '100%');

const sx =
  900 / Math.max(worldW, 1);

    const sy =
      430 / Math.max(worldH, 1);

    const X = x =>
      50 + clamp(
        n(x) * sx,
        0,
        900
      );

    const Y = y =>
      55 + clamp(
        n(y) * sy,
        0,
        430
      );

 const labelX = (x, width = 90, gap = 12) =>
  x > W - width
    ? Math.max(8, x - gap)
    : Math.min(W - 8, x + gap);

const labelAnchor = (x, width = 90) =>
  x > W - width
    ? 'end'
    : 'start';

const labelY = (y, offset = 3) => {
  if (y < 26) return y + 20;
  if (y > H - 26) return y - 14;
  return y + offset;
};

    const arr = k =>
      Array.isArray(m[k])
        ? m[k]
        : [];

    const p = s.player || {};


    /* =======================================================
       POSITIONS
       ======================================================= */

    const start = {
      x: X(m.spawn?.x ?? 120),
      y: Y(m.spawn?.y ?? 520)
    };

    const goal = {
      x: X(m.goal?.x ?? worldW - 100),
      y: Y(m.goal?.y ?? 500)
    };

    const you = {
      x: X(p.x ?? m.spawn?.x ?? 120),
      y: Y(p.y ?? m.spawn?.y ?? 520)
    };


    /* =======================================================
       CHECKPOINTS
       ======================================================= */

    const cps =
      arr('checkpoints')
        .map(v => point(v, sx, sy));


    /* =======================================================
       ROUTE
       ======================================================= */

    const route = [
      start,
      ...cps,
      goal
    ];

const path =
  route
    .map((v, i) =>
      `${i ? 'L' : 'M'}${v.x} ${v.y}`
    )
    .join(' ');


    /* =======================================================
       MAP BLOCKS
       ======================================================= */

    const rects = k =>
      arr(k)
        .map(v => {

          const a =
            Array.isArray(v)
              ? v
              : [
                  v?.x,
                  v?.y,
                  v?.width ?? v?.w ?? 50,
                  v?.height ?? v?.h ?? 20
                ];

          const x = X(a[0]);

          const y = Y(a[1]);

          const w =
            Math.max(
              5,
              n(a[2], 50) * sx
            );

          const h =
            Math.max(
              4,
              n(a[3], 20) * sy
            );

          return `
            <rect
              x="${x}"
              y="${y}"
              width="${w}"
              height="${h}"
              class="world-block"
            />
          `;
        })
        .join('');


    /* =======================================================
       DOTS
       ======================================================= */

    const dots = (
      k,
      cls,
      label = ''
    ) =>
      arr(k)
        .map((v, i) => {

          const q =
            point(v, sx, sy);

          const cx =
            X(q.x / sx - 50);

          const cy =
            Y(q.y / sy - 55);

          const radius =
            cls === 'hostile'
              ? 7
              : 5;

          return `
            <g class="${cls}">
              <circle
                cx="${cx}"
                cy="${cy}"
                r="${radius}"
              />

 <text
  x="${labelX(cx, 90)}"
  y="${labelY(cy)}"
  text-anchor="${labelAnchor(cx, 90)}"
>
                ${
                  label ||
                  (
                    cls === 'checkpoint'
                      ? 'CP ' + (i + 1)
                      : ''
                  )
                }
              </text>
            </g>
          `;
        })
        .join('');


    /* =======================================================
       CHECKPOINT MARKERS
       ======================================================= */

    const cpMarkup =
      cps
        .map((q, i) => {

          const cx =
            X(q.x / sx - 50);

          const cy =
            Y(q.y / sy - 55);

          return `
            <g class="checkpoint">

              <circle
                cx="${cx}"
                cy="${cy}"
                r="13"
              />

              <circle
                cx="${cx}"
                cy="${cy}"
                r="3"
              />

          <text
  x="${labelX(cx, 70)}"
  y="${labelY(cy)}"
  text-anchor="${labelAnchor(cx, 70)}"
>
                CP ${i + 1}
              </text>

            </g>
          `;
        })
        .join('');


    /* =======================================================
       GRID
       ======================================================= */

    const grid =
      Array.from(
        { length: 10 },
        (_, i) => `
          <path d="M${i * 100} 0V560"/>
          <path d="M0 ${i * 56}H1000"/>
        `
      )
      .join('');


    /* =======================================================
       SVG
       ======================================================= */

    el.innerHTML = `

      <style>

        /* =====================================================
           BASE
           ===================================================== */

        .bg {
          fill: #030405;
        }

        .grid {
          stroke: #24282a;
          stroke-width: 1;
          opacity: .72;
        }


        /* =====================================================
           MAP STRUCTURES
           ===================================================== */

        .world-block {
          fill: #111416;
          stroke: #4a4f52;
          stroke-width: 2;
        }


        /* =====================================================
           ROADS
           ===================================================== */

        .road {
          stroke: #252a2d;
          stroke-width: 19;
          opacity: .85;
        }

        .road2 {
          stroke: #0b0d0e;
          stroke-width: 11;
        }


        /* =====================================================
           ROUTE
           ===================================================== */

        .routeGlow {
          fill: none;
          stroke: #f2c94c;
          stroke-width: 14;
          opacity: .08;
        }

        .route {
          fill: none;
          stroke: #f2c94c;
          stroke-width: 5;
          stroke-linecap: round;
          stroke-linejoin: round;

          filter:
            drop-shadow(
              0 0 5px
              rgba(242,201,76,.5)
            );

          animation:
            tacticalRoute 2.8s
            ease-in-out
            infinite;
        }


        /* =====================================================
           CHECKPOINT
           ===================================================== */

        .checkpoint circle:first-child {
          fill: #07090a;
          stroke: #f2c94c;
          stroke-width: 2;

          filter:
            drop-shadow(
              0 0 5px
              rgba(242,201,76,.35)
            );
        }

        .checkpoint circle:nth-child(2) {
          fill: #f2c94c;

          filter:
            drop-shadow(
              0 0 5px
              rgba(242,201,76,.7)
            );
        }

 .checkpoint text {
  fill: #f2c94c;

  font:
    900 11px/1.2
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;

  letter-spacing: .08em;

  paint-order: stroke;
  stroke: #030405;
  stroke-width: 2.5px;
  stroke-linejoin: round;
  pointer-events: none;
user-select: none;
}


        /* =====================================================
           START
           ===================================================== */

        .start circle {
          fill: #4fd889;
          stroke: #e1ffeb;
          stroke-width: 2;

          filter:
            drop-shadow(
              0 0 7px
              rgba(79,216,137,.55)
            );
        }

       .start text {
  fill: #75eba1;

  font:
    900 11px/1.2
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;

  letter-spacing: .08em;

  paint-order: stroke;
  stroke: #030405;
  stroke-width: 2.5px;
  stroke-linejoin: round;
  pointer-events: none;
user-select: none;
}


        /* =====================================================
           PLAYER
           ===================================================== */

        .you circle {
          fill: #4dd8ff;
          stroke: #ffffff;
          stroke-width: 2;

          filter:
            drop-shadow(
              0 0 9px
              rgba(77,216,255,.85)
            );

          animation:
            playerPulse 1.5s
            ease-in-out
            infinite;
        }

       .you text {
  fill: #55dcff;

  font:
    900 11px/1.2
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;

  letter-spacing: .08em;

  paint-order: stroke;
  stroke: #030405;
  stroke-width: 2.5px;
  stroke-linejoin: round;

  filter:
    drop-shadow(
      0 0 4px
      rgba(77,216,255,.5)
    );
    pointer-events: none;
user-select: none;
}

        /* =====================================================
           TARGET
           ===================================================== */

        .goal circle {
          fill: #f2c94c;
          stroke: #fff3b5;
          stroke-width: 2;

          filter:
            drop-shadow(
              0 0 10px
              rgba(242,201,76,.7)
            );

          transform-box: fill-box;
          transform-origin: center;

          animation:
            targetPulse 1.8s
            ease-in-out
            infinite;
        }

        .goal text {
  fill: #f2c94c;

  font:
    900 11px/1.2
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;

  letter-spacing: .08em;

  paint-order: stroke;
  stroke: #030405;
  stroke-width: 2.5px;
  stroke-linejoin: round;
  pointer-events: none;
user-select: none;
}


        /* =====================================================
           HOSTILES
           ===================================================== */

        .hostile circle {
          fill: #b82f38;
          stroke: #ff9a9a;
          stroke-width: 2;

          filter:
            drop-shadow(
              0 0 7px
              rgba(210,45,55,.6)
            );

          animation:
            hostilePulse 2s
            ease-in-out
            infinite;
        }

    .hostile text {
  fill: #ff8585;

  font:
    900 10px/1.2
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;

  letter-spacing: .06em;

  paint-order: stroke;
  stroke: #030405;
  stroke-width: 2.5px;
  stroke-linejoin: round;

  filter:
    drop-shadow(
      0 0 4px
      rgba(210,45,55,.45)
    );
    pointer-events: none;
user-select: none;
}


        /* =====================================================
           SIGNAL / BOOST
           ===================================================== */

        .signal circle {
          fill: #79ddff;
          stroke: #ecfbff;
          stroke-width: 1.5;

          filter:
            drop-shadow(
              0 0 6px
              rgba(121,221,255,.55)
            );
        }

     .signal text {
  fill: #79ddff;

  font:
    900 10px/1.2
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;

  letter-spacing: .06em;

  paint-order: stroke;
  stroke: #030405;
  stroke-width: 2.5px;
  stroke-linejoin: round;

  filter:
    drop-shadow(
      0 0 4px
      rgba(121,221,255,.45)
    );

  pointer-events: none;
  user-select: none;
}

        /* =====================================================
           DISTRICT
           ===================================================== */

      .district {
  fill: #f2c94c;

  font:
    900 13px/1.15
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;

  letter-spacing: .12em;

  paint-order: stroke;

  stroke: #030405;
  stroke-width: 4px;
  stroke-linejoin: round;

  text-anchor: start;
  dominant-baseline: middle;

  filter:
    drop-shadow(
      0 0 5px
      rgba(242,201,76,.22)
    );

  pointer-events: none;
  user-select: none;
}


        /* =====================================================
           LEGEND
           ===================================================== */

     .legend {
  fill: rgba(235,235,235,.82);

  font:
    800 9px/1.2
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;

  letter-spacing: .07em;

  paint-order: stroke;
  stroke: #030405;
  stroke-width: 2px;
  stroke-linejoin: round;
  pointer-events: none;
user-select: none;
text-anchor: end;
dominant-baseline: middle;
}


        /* =====================================================
           BORDER
           ===================================================== */

        .border {
          fill: none;

          stroke:
            rgba(242,201,76,.5);

          stroke-width: 2;
        }


        /* =====================================================
           SCAN
           ===================================================== */

        .scan {
          fill: url(#scan);
          opacity: .055;

          pointer-events: none;
        }


        /* =====================================================
           ANIMATIONS
           ===================================================== */

        @keyframes tacticalRoute {

          0%,
          100% {
            opacity: .75;
          }

          50% {
            opacity: 1;
          }
        }


        @keyframes playerPulse {

          0%,
          100% {
            opacity: 1;

            filter:
              drop-shadow(
                0 0 5px
                rgba(77,216,255,.5)
              );
          }

          50% {
            opacity: .72;

            filter:
              drop-shadow(
                0 0 13px
                rgba(77,216,255,1)
              );
          }
        }


        @keyframes targetPulse {

          0%,
          100% {
            opacity: .82;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.13);
          }
        }


        @keyframes hostilePulse {

          0%,
          100% {
            opacity: .75;
          }

          50% {
            opacity: 1;
          }
        }

      </style>


      <defs>

        <pattern
          id="scan"
          width="1"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <rect
            width="1"
            height="1"
            fill="#ffffff"
          />
        </pattern>

      </defs>


      <!-- BACKGROUND -->

      <rect
        width="1000"
        height="560"
        class="bg"
      />


      <!-- GRID -->

      <g class="grid">
        ${grid}
      </g>


      <!-- ROAD -->

      <path
        d="M40 470 Q280 400 470 300 T960 80"
        class="road"
      />

      <path
        d="M40 470 Q280 400 470 300 T960 80"
        class="road2"
      />


      <!-- WORLD -->

      ${rects('platforms')}

      ${rects('obstacles')}

      ${rects('movingGates')}


      <!-- ROUTE -->

      <path
        d="${path}"
        class="routeGlow"
      />

      <path
        d="${path}"
        class="route"
      />


      <!-- CHECKPOINTS -->

      ${cpMarkup}


      <!-- HOSTILES -->

      ${dots(
        'enemies',
        'hostile',
        'HOSTILE'
      )}


      <!-- SIGNALS -->

      ${dots(
        'signals',
        'signal',
        'SIGNAL'
      )}


      <!-- BOOST -->

      ${dots(
        'boostPads',
        'signal',
        'BOOST'
      )}


      <!-- START -->

      <g class="start">

        <circle
          cx="${start.x}"
          cy="${start.y}"
          r="8"
        />

       <text
  x="${labelX(start.x, 70)}"
  y="${labelY(start.y, 3)}"
  text-anchor="${labelAnchor(start.x, 70)}"
>
  START
</text>

      </g>


      <!-- TARGET -->

      <g class="goal">

        <circle
          cx="${goal.x}"
          cy="${goal.y}"
          r="9"
        />

      <text
  x="${labelX(goal.x, 80)}"
  y="${labelY(goal.y, 3)}"
  text-anchor="${labelAnchor(goal.x, 80)}"
>
  TARGET
</text>

      </g>


      <!-- PLAYER -->

      <g class="you">

        <circle
          cx="${you.x}"
          cy="${you.y}"
          r="7"
        />

       <text
  x="${labelX(you.x, 55)}"
  y="${labelY(you.y, -10)}"
  text-anchor="${labelAnchor(you.x, 55)}"
>
  YOU
</text>
      </g>


      <!-- DISTRICT -->

      <text
        x="34"
        y="34"
        class="district"
      >
        ${String(
          m.district ||
          'CURRENT DISTRICT'
        ).toUpperCase()}
      </text>


      <!-- LEGEND -->

      <text
        x="970"
        y="530"
        text-anchor="end"
        class="legend"
      >
        ROUTE  CHECKPOINT  TARGET  HOSTILE  SIGNAL  YOU
      </text>


      <!-- BORDER -->

      <rect
        x="10"
        y="10"
        width="980"
        height="540"
        class="border"
      />


      <!-- SCAN -->

      <rect
        width="1000"
        height="560"
        class="scan"
      />

    </svg>`;
  }


  /* =========================================================
     NEW MOBILE HUD CSS
     ========================================================= */

  const css =
    document.createElement('style');

  css.textContent = `

    /* =======================================================
       FULLSCREEN ROOT
       ======================================================= */

    @media (max-width: 760px) {

      #relayGameplayIntroFinalV3 {

        position: fixed !important;

        inset: 0 !important;

        width: 100vw !important;

        height: 100dvh !important;

        margin: 0 !important;

        padding: 0 !important;

        overflow: hidden !important;

        background:
          #020304 !important;

        color: #f4f4f4 !important;

        isolation: isolate !important;

        z-index: 500 !important;
      }


      /* =====================================================
         SHELL
         ===================================================== */

   #relayGameplayIntroFinalV3
.map-briefing-shell {

  position: absolute !important;

  inset: 0 !important;

  width: 100% !important;

  height: 100% !important;

  min-width: 0 !important;

  min-height: 0 !important;

  display: grid !important;

  gap: 0 !important;

        padding:
          max(7px, env(safe-area-inset-top))
          7px
          max(7px, env(safe-area-inset-bottom))
          7px !important;

        border: 0 !important;

        border-radius: 0 !important;

        background:
          linear-gradient(
            180deg,
            #07090a 0%,
            #020304 100%
          ) !important;

        box-shadow: none !important;

        overflow: hidden !important;
      }


      /* =====================================================
         HEADER
         ===================================================== */

      #relayGameplayIntroFinalV3
      .map-briefing-head {

        position: relative !important;

        display: flex !important;

        grid-template-columns:
          minmax(0, 1fr)
          auto !important;

        align-items: center !important;
        justify-content: space-between !important;
        min-height: 61px !important;

        margin:
          0 0 7px !important;

        padding:
          8px 10px 9px 13px !important;

        border:
          1px solid
          rgba(242,201,76,.32) !important;

        background:
          linear-gradient(
            135deg,
            rgba(19,22,24,.98),
            rgba(5,7,8,.99)
          ) !important;

        box-shadow:
          inset 0 1px
          rgba(255,255,255,.035),
          0 8px 28px
          rgba(0,0,0,.5) !important;

        overflow: hidden !important;
      }


      /* LEFT TACTICAL STRIPE */

      #relayGameplayIntroFinalV3
      .map-briefing-head::before {

        content: "" !important;

        position: absolute !important;

        top: 0 !important;

        left: 0 !important;

        width: 4px !important;

        height: 100% !important;

        background:
          #f2c94c !important;

        box-shadow:
          0 0 13px
          rgba(242,201,76,.6) !important;
      }


      /* TOP RIGHT STATUS */

      #relayGameplayIntroFinalV3
      .map-briefing-head::after {

        content:
          "TACTICAL // LIVE" !important;

        position: absolute !important;

        right: 9px !important;

        bottom: 4px !important;

        color:
          rgba(242,201,76,.45) !important;

        font:
          800 7px
          ui-monospace,
          monospace !important;

        letter-spacing:
          .18em !important;

        pointer-events: none !important;
      }


      /* =====================================================
         KICKER
         ===================================================== */

      #relayGameplayIntroFinalV3
      .map-briefing-kicker {

        margin: 0 0 3px !important;

        color:
          #f2c94c !important;

        font:
          900 8px
          ui-monospace,
          monospace !important;

        letter-spacing:
          .22em !important;

        text-transform:
          uppercase !important;
      }


      /* =====================================================
         TITLE
         ===================================================== */

      #relayGameplayIntroFinalV3
      .map-briefing-title {

        margin: 0 !important;

        max-width:
          calc(100vw - 105px) !important;

        color:
          #f5f5f5 !important;

        font:
          900 clamp(17px, 5vw, 23px)
          ui-monospace,
          SFMono-Regular,
          Menlo,
          Monaco,
          Consolas,
          monospace !important;

        line-height: 1.05 !important;

        letter-spacing:
          .055em !important;

        text-transform:
          uppercase !important;

        white-space:
          nowrap !important;

        overflow:
          hidden !important;

        text-overflow:
          ellipsis !important;
      }


      /* =====================================================
         TIMER
         ===================================================== */

      #relayGameplayIntroFinalV3
      .map-briefing-timer {

        min-width: 69px !important;

        padding:
          7px 8px !important;

        border:
          1px solid
          rgba(242,201,76,.48) !important;

        background:
          #090b0b !important;

        box-shadow:
          inset 0 0 15px
          rgba(242,201,76,.05),
          0 0 16px
          rgba(242,201,76,.08) !important;

        text-align:
          center !important;
      }


      #relayGameplayIntroFinalV3
      .map-briefing-timer b {

        display: block !important;

        color:
          #f2c94c !important;

        font:
          900 18px
          ui-monospace,
          monospace !important;

        line-height:
          1 !important;

        letter-spacing:
          .08em !important;

        text-shadow:
          0 0 9px
          rgba(242,201,76,.35) !important;
      }


      /* =====================================================
         MAP CONTAINER
         ===================================================== */

    #relayGameplayIntroFinalV3
.map-briefing-map-wrap {

  position: relative !important;

  display: flex !important;

  align-items: center !important;

  justify-content: center !important;

  width: 100% !important;

        height: 100% !important;

        min-width: 0 !important;

        min-height: 0 !important;

        margin: 0 !important;

        border:
          1px solid
          rgba(242,201,76,.35) !important;

        border-radius:
          3px !important;

        background:
          #020304 !important;

        box-shadow:
          inset 0 0 0 1px
          rgba(255,255,255,.018),
          inset 0 0 70px
          rgba(0,0,0,.8),
          0 10px 35px
          rgba(0,0,0,.55) !important;

        overflow:
          hidden !important;
      }


      /* =====================================================
         SVG
         ===================================================== */

      #relayGameplayIntroFinalV3
      .map-briefing-map {

        display:
          block !important;

        width:
          100% !important;

        height:
          100% !important;

                  max-width:
          100% !important;

        max-height:
          100% !important;

        object-fit:
          contain !important;

        object-position:
          center center !important;

        min-width:
          0 !important;

        min-height:
          0 !important;

        background:
          #020304 !important;

       overflow:
  visible !important;

    touch-action:
  manipulation !important;
  }


      /* =====================================================
         FOOTER
         ===================================================== */

      #relayGameplayIntroFinalV3
      .map-briefing-foot {

        display:
          flex !important;

        align-items:
          center !important;

        justify-content:
          space-between !important;

        min-height:
          27px !important;

        margin:
          7px 0 0 !important;

        padding:
          5px 7px !important;

        border-top:
          1px solid
          rgba(255,255,255,.07) !important;

        color:
          rgba(210,210,210,.5) !important;

        font:
          800 7px
          ui-monospace,
          monospace !important;

        letter-spacing:
          .1em !important;

        text-transform:
          uppercase !important;

        white-space:
          nowrap !important;

        overflow:
          hidden !important;
      }


      /* =====================================================
         OLD DECORATIVE OVERLAYS
         ===================================================== */

      #relayGameplayIntroFinalV3
      .map-briefing-scan,

      #relayGameplayIntroFinalV3
      .map-briefing-vignette,

      #relayGameplayIntroFinalV3
      .map-briefing-tag {

        pointer-events:
          none !important;
      }


      /* =====================================================
         SMALL PHONES
         ===================================================== */

      @media (max-width: 390px) {

        #relayGameplayIntroFinalV3
        .map-briefing-shell {

          padding-left:
            5px !important;

          padding-right:
            5px !important;
        }


        #relayGameplayIntroFinalV3
        .map-briefing-head {

          min-height:
            55px !important;

          padding:
            7px 8px 8px 11px !important;
        }


        #relayGameplayIntroFinalV3
        .map-briefing-title {

          font-size:
            15px !important;

          max-width:
            calc(100vw - 94px) !important;
        }


        #relayGameplayIntroFinalV3
        .map-briefing-timer {

          min-width:
            61px !important;

          padding:
            6px !important;
        }


        #relayGameplayIntroFinalV3
        .map-briefing-timer b {

          font-size:
            16px !important;
        }
      }


      /* =====================================================
         SHORT SCREEN
         ===================================================== */

      @media (max-height: 620px) {

        #relayGameplayIntroFinalV3
        .map-briefing-head {

          min-height:
            49px !important;

          margin-bottom:
            5px !important;
        }


        #relayGameplayIntroFinalV3
        .map-briefing-foot {

          min-height:
            21px !important;

          margin-top:
            5px !important;
        }
      }


      /* =====================================================
         REDUCE MOTION
         ===================================================== */

      @media (prefers-reduced-motion: reduce) {

        #relayGameplayIntroFinalV3
        .route,

        #relayGameplayIntroFinalV3
        .you circle,

        #relayGameplayIntroFinalV3
        .goal circle,

        #relayGameplayIntroFinalV3
        .hostile circle {

          animation:
            none !important;
        }
      }

    }

  `;

  document.head.appendChild(css);


  /* =========================================================
     REFRESH
     ========================================================= */

  const tick = () => {

    if (
      intro()?.hidden === false
    ) {
      draw();
    }
  };


  new MutationObserver(
    tick
  ).observe(
    document.body,
    {
      subtree: true,
      attributes: true,
      attributeFilter: [
        'hidden',
        'class'
      ]
    }
  );


  window.addEventListener(
    'resize',
    draw,
    {
      passive: true
    }
  );


  setInterval(
    tick,
    500
  );

})();
