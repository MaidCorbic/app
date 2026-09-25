/*
 * ============================================================
 * RUNNER RELAY — PLAY NOW / MISSION DEPLOYMENT V4
 *
 * FLOW:
 * HOME
 *   ↓
 * DEPLOYMENT SCAN
 *   ↓
 * MISSION MAP
 *   ↓
 * MISSION BRIEFING
 *   ↓
 * GAMEPLAY
 *
 * V4:
 * - Cinematic mission presentation
 * - Stronger right-side mission intel
 * - High-contrast tactical panel
 * - Large mission typography
 * - Bottom deployment scanner
 * - Subtle scanlines
 * - Subtle scan sweep
 * - Micro glitch
 * - Dynamic mission artwork
 * - Responsive desktop/mobile layout
 * - No console output
 * - V1-compatible public API
 * ============================================================
 */

(() => {
  'use strict';

  if (window.__relayPlayDeploymentV4) return;
  window.__relayPlayDeploymentV4 = true;

  /* ============================================================
     UTILITIES
     ============================================================ */

  const WAIT = ms =>
    new Promise(resolve =>
      window.setTimeout(resolve, ms)
    );

  const NEXT_FRAME = callback => {
    if (
      typeof window.requestAnimationFrame === 'function'
    ) {
      return window.requestAnimationFrame(callback);
    }

    return window.setTimeout(
      () => callback(performance.now()),
      16
    );
  };

  const isCoarseDevice = () =>
    window.matchMedia?.(
      '(pointer: coarse)'
    ).matches === true ||
    Number(
      navigator.maxTouchPoints || 0
    ) > 0;

  const reducedMotion = () =>
    window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches === true;

  const runBounded = async (
    callback,
    timeoutMs
  ) => {
    if (
      typeof callback !== 'function'
    ) {
      return;
    }

    let timer;

    try {
      await Promise.race([
        Promise.resolve().then(callback),

        new Promise(resolve => {
          timer = window.setTimeout(
            resolve,
            timeoutMs
          );
        }),
      ]);
    } finally {
      window.clearTimeout(timer);
    }
  };


  /* ============================================================
     STATE
     ============================================================ */

  let active = false;
  let serial = 0;


  /* ============================================================
     DEFAULT ARTWORK
     ============================================================ */

  /*
   * Resolve assets from the actual game document directory.
   * The production bundle may live under /assets/, so plain
   * './assets/...' would incorrectly resolve to the site root.
   */
  const gameAsset = file =>
    new URL(
      `./assets/${file}`,
      window.location.href
    ).href;

  const DEFAULT_ASSETS = Object.freeze({
    desktop:
      gameAsset('loadplay.jpg'),

    mobile:
      gameAsset('loadplaymobile.jpg'),
  });


  /* ============================================================
     MISSION DATABASE
     ============================================================ */

  const MISSIONS = Object.freeze({

    1: {
      title:
        'ROOFTOP',

      titleAccent:
        'BREACH',

      subtitle:
        'EAST DISTRICT',

      location:
        'URBAN SECTOR 01',

      objective:
        'REACH EXTRACTION',

      threat:
        'HIGH',

      route:
        'ROOFTOP NETWORK',

      scanLabel:
        'TARGET ROUTE IDENTIFIED',

      desktop:
        gameAsset('loadplay.jpg'),

      mobile:
        gameAsset('loadplaymobile.jpg'),
    },

    2: {
      title:
        'NIGHT',

      titleAccent:
        'RUN',

      subtitle:
        'NORTH SECTOR',

      location:
        'INDUSTRIAL ZONE 02',

      objective:
        'SECURE PACKAGE',

      threat:
        'CRITICAL',

      route:
        'SERVICE ROOFTOPS',

      scanLabel:
        'PACKAGE SIGNAL DETECTED',

      desktop:
        gameAsset('loadplay2.jpg'),

      mobile:
        gameAsset('loadplay2mobile.jpg'),
    },

    3: {
      title:
        'DEAD',

      titleAccent:
        'DROP',

      subtitle:
        'WEST DISTRICT',

      location:
        'CONSTRUCTION SECTOR 03',

      objective:
        'RETRIEVE DATA',

      threat:
        'EXTREME',

      route:
        'HIGH-RISE GRID',

      scanLabel:
        'DATA NODE LOCATED',

      desktop:
        gameAsset('loadplay3.jpg'),

      mobile:
        gameAsset('loadplay3mobile.jpg'),
    },

    4: {
      title:
        'BLACK',

      titleAccent:
        'OUT',

      subtitle:
        'SOUTH SECTOR',

      location:
        'POWER GRID 04',

      objective:
        'RESTORE LINK',

      threat:
        'HIGH',

      route:
        'UTILITY ROOFTOPS',

      scanLabel:
        'NETWORK INTERRUPTION DETECTED',

      desktop:
        gameAsset('loadplay4.jpg'),

      mobile:
        gameAsset('loadplay4mobile.jpg'),
    },

  });


  /* ============================================================
     MISSION RESOLUTION
     ============================================================ */

  const getMission =
    missionNumber => {

      const number =
        Math.max(
          1,
          Number(
            missionNumber
          ) || 1
        );

      const existing =
        MISSIONS[number];

      if (existing) {
        return {
          ...existing,
          number,
        };
      }

      return {

        title:
          'UNKNOWN',

        titleAccent:
          'MISSION',

        subtitle:
          'UNCLASSIFIED SECTOR',

        location:
          `SECTOR ${String(number).padStart(2, '0')}`,

        objective:
          'REACH EXTRACTION',

        threat:
          'UNKNOWN',

        route:
          'ROOFTOP NETWORK',

        scanLabel:
          'ROUTE DATA AVAILABLE',

        desktop:
          DEFAULT_ASSETS.desktop,

        mobile:
          DEFAULT_ASSETS.mobile,

        number,

      };

    };


  const normalizeConfig =
    config => {

      const mission =
        getMission(
          config?.missionNumber
        );

      return {

        missionNumber:
          mission.number,

        mission,

        desktop:
          config?.desktop ||
          mission.desktop ||
          DEFAULT_ASSETS.desktop,

        mobile:
          config?.mobile ||
          mission.mobile ||
          DEFAULT_ASSETS.mobile,

        beforeRoute:
          typeof config?.beforeRoute === 'function'
            ? config.beforeRoute
            : null,

        /*
         * HOME PLAY uses the same cinematic scan, but it must
         * hand off directly to the real runner. Mission/replay
         * flows keep the tactical route briefing.
         */
        skipRoute:
          config?.skipRoute === true,

      };

    };


  /* ============================================================
     OVERLAY
     ============================================================ */

  const makeOverlay =
    config => {

      const {
        missionNumber,
        mission,
        desktop,
        mobile,
      } = config;

      const overlay =
        document.createElement(
          'section'
        );

      overlay.id =
        'relayPlayDeployment';

      overlay.className =
        'relay-splash relay-play-deployment';

      overlay.setAttribute(
        'role',
        'status'
      );

      overlay.setAttribute(
        'aria-live',
        'polite'
      );

      overlay.setAttribute(
        'aria-busy',
        'true'
      );

      overlay.innerHTML = `

        <!-- ==================================================
             MAP
             ================================================== -->

        <picture
          class="relay-deployment-map"
        >

          <source
            media="(pointer: coarse)"
            srcset="${mobile}"
          >

          <source
            media="(max-width:700px)"
            srcset="${mobile}"
          >

          <img
            class="relay-deployment-map-image"
            src="${desktop}"
            alt=""
            decoding="async"
            fetchpriority="high"
          >

        </picture>


        <!-- ==================================================
             ATMOSPHERE
             ================================================== -->

        <div
          class="relay-deployment-vignette"
          aria-hidden="true"
        ></div>

        <div
          class="relay-deployment-grid"
          aria-hidden="true"
        ></div>

        <div
          class="relay-deployment-scan"
          aria-hidden="true"
        ></div>

        <div
          class="relay-deployment-glitch"
          aria-hidden="true"
        ></div>


        <!-- ==================================================
             MAP FRAME
             ================================================== -->

        <div
          class="relay-map-frame"
          aria-hidden="true"
        >
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </div>


        <!-- ==================================================
             TOP BRAND
             ================================================== -->

        <div
          class="relay-deployment-brand"
        >

          <b>
            R/
          </b>

          <span>
            RELAY RUNNER
          </span>

        </div>


        <div
          class="relay-deployment-brand-sub"
        >
          DEPLOYMENT SYSTEM
        </div>


        <!-- ==================================================
             ONLINE STATUS
             ================================================== -->

        <div
          class="relay-deployment-status"
        >

          <span
            class="relay-status-dot"
          ></span>

          <span>
            RELAY ONLINE
          </span>

        </div>


        <!-- ==================================================
             MISSION WATERMARK
             ================================================== -->

        <div
          class="relay-mission-watermark"
          aria-hidden="true"
        >
          ${String(
            missionNumber
          ).padStart(2, '0')}
        </div>


        <!-- ==================================================
             MISSION HERO
             ================================================== -->

        <div
          class="relay-mission-hero"
        >

          <div
            class="relay-mission-index"
          >

            <span>
              MISSION
            </span>

            <b>
              ${String(
                missionNumber
              ).padStart(2, '0')}
            </b>

          </div>


          <h1>

            <span>
              ${mission.title}
            </span>

            <em>
              ${mission.titleAccent}
            </em>

          </h1>


          <div
            class="relay-mission-location"
          >

            <span></span>

            <strong>
              ${mission.subtitle}
            </strong>

            <small>
              ${mission.location}
            </small>

          </div>

        </div>


        <!-- ==================================================
             RIGHT MISSION INTEL
             ================================================== -->

        <aside
          class="relay-mission-intel"
          aria-label="Mission information"
        >

          <div
            class="relay-intel-top"
          >

            <span>
              MISSION INTEL
            </span>

            <b>
              0${missionNumber}
            </b>

          </div>


          <div
            class="relay-intel-title"
          >
            OPERATION DATA
          </div>


          <div
            class="relay-intel-list"
          >

            <div
              class="relay-intel-row"
            >

              <div
                class="relay-intel-label"
              >
                <span></span>
                <small>
                  OBJECTIVE
                </small>
              </div>

              <strong>
                ${mission.objective}
              </strong>

            </div>


            <div
              class="relay-intel-row"
            >

              <div
                class="relay-intel-label"
              >
                <span></span>
                <small>
                  THREAT LEVEL
                </small>
              </div>

              <strong
                class="relay-intel-threat"
              >
                ${mission.threat}
              </strong>

            </div>


            <div
              class="relay-intel-row"
            >

              <div
                class="relay-intel-label"
              >
                <span></span>
                <small>
                  ROUTE
                </small>
              </div>

              <strong>
                ${mission.route}
              </strong>

            </div>

          </div>


          <div
            class="relay-intel-separator"
          ></div>


          <div
            class="relay-intel-footer"
          >

            <div
              class="relay-target-indicator"
            >
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </div>

            <div>
              <small>
                TARGET
              </small>

              <strong>
                LOCKED
              </strong>
            </div>

            <span>
              ●
            </span>

          </div>

        </aside>


        <!-- ==================================================
             BOTTOM DEPLOYMENT SCANNER
             ================================================== -->

        <div
          class="relay-deployment-bottom"
        >

          <div
            class="relay-deployment-status-line"
          >

            <div>

              <span
                class="relay-scan-dot"
              ></span>

              <span
                class="relay-scan-status"
              >
                INITIALIZING IMAGE SCAN
              </span>

            </div>


            <strong
              class="relay-scan-percent"
            >
              00%
            </strong>

          </div>


          <div
            class="relay-deployment-track"
          >

            <i
              class="relay-splash-progress"
            ></i>

          </div>


          <div
            class="relay-deployment-bottom-meta"
          >

            <span>
              ${mission.scanLabel}
            </span>

            <b
              class="relay-scan-state"
            >
              INITIALIZING
            </b>

          </div>


          <div
            class="relay-boot-complete"
          >

            <span></span>

            <strong>
              ROUTE VERIFIED
            </strong>

            <small>
              MISSION
              ${String(
                missionNumber
              ).padStart(2, '0')}
              //
              ${mission.subtitle}
            </small>

          </div>

        </div>


        <!-- ==================================================
             FOOTER
             ================================================== -->

        <div
          class="relay-deployment-footer"
        >

          <span>
            RLY-DEP
          </span>

          <i></i>

          <span>
            MAP DATA
          </span>

          <i></i>

          <span>
            ROUTE SCAN
          </span>

        </div>

      `;

      return overlay;
    };


  /* ============================================================
     STYLE
     ============================================================ */

  const installStyle =
    () => {

      if (
        document.getElementById(
          'relay-play-deployment-v4-style'
        )
      ) {
        return;
      }


      const style =
        document.createElement(
          'style'
        );

      style.id =
        'relay-play-deployment-v4-style';


      style.textContent = `

        /* ========================================================
           ROOT OVERLAY
           ======================================================== */

        .relay-play-deployment {

          position:
            fixed !important;

          inset:
            0 !important;

          width:
            100vw !important;

          width:
            100dvw !important;

          height:
            100vh !important;

          height:
            100dvh !important;

          z-index:
            2147483647 !important;

          overflow:
            hidden !important;

          pointer-events:
            none !important;

          isolation:
            isolate !important;

          background:
            #020509 !important;

          color:
            #f5fbff !important;

          font-family:
            inherit;

        }


        /* ========================================================
           MAP
           ======================================================== */

        .relay-deployment-map {

          position:
            absolute;

          inset:
            0;

          z-index:
            0;

          display:
            block;

          overflow:
            hidden;

        }


        .relay-deployment-map-image {

          position:
            absolute;

          inset:
            0;

          width:
            100%;

          height:
            100%;

          min-width:
            100%;

          min-height:
            100%;

          object-fit:
            cover;

          object-position:
            center;

          transform:
            scale(1.025);

          filter:
            brightness(.76)
            contrast(1.10)
            saturate(.94);

          transition:
            transform 1.5s
            cubic-bezier(.16,1,.3,1);

        }


        /* ========================================================
           MAIN VIGNETTE
           ======================================================== */

        .relay-deployment-vignette {

          position:
            absolute;

          inset:
            0;

          z-index:
            2;

          pointer-events:
            none;

          background:

            linear-gradient(
              90deg,
              rgba(0,0,0,.72) 0%,
              rgba(0,0,0,.40) 24%,
              rgba(0,0,0,.08) 49%,
              rgba(0,0,0,.18) 67%,
              rgba(0,0,0,.66) 100%
            ),

            linear-gradient(
              180deg,
              rgba(0,0,0,.44) 0%,
              transparent 28%,
              transparent 60%,
              rgba(0,0,0,.80) 100%
            );

        }


        /* ========================================================
           LEFT CINEMATIC DEPTH
           ======================================================== */

        .relay-play-deployment::before {

          content:
            "";

          position:
            absolute;

          inset:
            0;

          z-index:
            4;

          pointer-events:
            none;

          background:
            radial-gradient(
              ellipse at 25% 50%,
              rgba(0,0,0,.40) 0%,
              rgba(0,0,0,.18) 28%,
              transparent 66%
            );

          mix-blend-mode:
            multiply;

        }


        /* ========================================================
           GRID
           ======================================================== */

        .relay-deployment-grid {

          position:
            absolute;

          inset:
            0;

          z-index:
            3;

          pointer-events:
            none;

          opacity:
            .055;

          background:

            linear-gradient(
              rgba(117,247,255,.20) 1px,
              transparent 1px
            ),

            linear-gradient(
              90deg,
              rgba(117,247,255,.20) 1px,
              transparent 1px
            );

          background-size:
            82px 82px;

          mask-image:
            linear-gradient(
              to bottom,
              transparent 5%,
              black 24%,
              black 72%,
              transparent 100%
            );

        }


        /* ========================================================
           SCANLINES
           ======================================================== */

        .relay-deployment-scan {

          position:
            absolute;

          inset:
            0;

          z-index:
            8;

          pointer-events:
            none;

          opacity:
            .22;

          background:
            repeating-linear-gradient(
              to bottom,
              transparent 0,
              transparent 6px,
              rgba(117,247,255,.026) 7px,
              transparent 8px
            );

          mix-blend-mode:
            screen;

        }


        /* ========================================================
           MOVING SCAN
           ======================================================== */

        .relay-deployment-scan::after {

          content:
            "";

          position:
            absolute;

          left:
            0;

          right:
            0;

          top:
            -12%;

          height:
            14%;

          background:
            linear-gradient(
              to bottom,
              transparent,
              rgba(0,234,255,.018),
              rgba(117,247,255,.07),
              rgba(0,234,255,.018),
              transparent
            );

          filter:
            blur(.8px);

          animation:
            relayDeploymentSweepV4
            6.8s
            cubic-bezier(.45,0,.55,1)
            infinite;

        }


        @keyframes relayDeploymentSweepV4 {

          0% {
            transform:
              translateY(-120%);
          }

          48% {
            transform:
              translateY(800%);
          }

          100% {
            transform:
              translateY(800%);
          }

        }


        /* ========================================================
           MICRO GLITCH
           ======================================================== */

        .relay-deployment-glitch {

          position:
            absolute;

          inset:
            0;

          z-index:
            15;

          pointer-events:
            none;

          opacity:
            0;

          background:
            linear-gradient(
              90deg,
              transparent 0%,
              transparent 42%,
              rgba(0,234,255,.08) 50%,
              transparent 58%,
              transparent 100%
            );

          mix-blend-mode:
            screen;

        }


        .relay-deployment-glitch.is-active {

          animation:
            relayDeploymentMicroGlitchV4
            .18s
            steps(2,end)
            both;

        }


        @keyframes relayDeploymentMicroGlitchV4 {

          0% {

            opacity:
              0;

            transform:
              translateX(0);

            clip-path:
              inset(0);

          }

          22% {

            opacity:
              .17;

            transform:
              translateX(-.32%);

            clip-path:
              inset(
                23% 0 59% 0
              );

          }

          48% {

            opacity:
              .05;

            transform:
              translateX(.24%);

            clip-path:
              inset(
                56% 0 28% 0
              );

          }

          72% {

            opacity:
              .14;

            transform:
              translateX(-.13%);

            clip-path:
              inset(
                74% 0 9% 0
              );

          }

          100% {

            opacity:
              0;

            transform:
              translateX(0);

            clip-path:
              inset(0);

          }

        }


        /* ========================================================
           MAP FRAME
           ======================================================== */

        .relay-map-frame {

          position:
            absolute;

          inset:
            8% 5%;

          z-index:
            10;

          pointer-events:
            none;

          opacity:
            .38;

        }


        .relay-map-frame i {

          position:
            absolute;

          width:
            46px;

          height:
            46px;

          border:
            0 solid
            rgba(117,247,255,.68);

        }


        .relay-map-frame i:nth-child(1) {

          top:
            0;

          left:
            0;

          border-top:
            1px solid
            rgba(117,247,255,.68);

          border-left:
            1px solid
            rgba(117,247,255,.68);

        }


        .relay-map-frame i:nth-child(2) {

          top:
            0;

          right:
            0;

          border-top:
            1px solid
            rgba(117,247,255,.68);

          border-right:
            1px solid
            rgba(117,247,255,.68);

        }


        .relay-map-frame i:nth-child(3) {

          bottom:
            0;

          left:
            0;

          border-bottom:
            1px solid
            rgba(117,247,255,.68);

          border-left:
            1px solid
            rgba(117,247,255,.68);

        }


        .relay-map-frame i:nth-child(4) {

          right:
            0;

          bottom:
            0;

          border-bottom:
            1px solid
            rgba(117,247,255,.68);

          border-right:
            1px solid
            rgba(117,247,255,.68);

        }


        /* ========================================================
           BRAND
           ======================================================== */

        .relay-deployment-brand {

          position:
            absolute;

          top:
            27px;

          left:
            34px;

          z-index:
            40;

          display:
            flex;

          align-items:
            center;

          gap:
            10px;

        }


        .relay-deployment-brand b {

          font-size:
            19px;

          font-weight:
            900;

          color:
            #75f7ff;

          text-shadow:
            0 0 13px
            rgba(0,234,255,.34);

        }


        .relay-deployment-brand span {

          font-size:
            9px;

          letter-spacing:
            .25em;

          color:
            rgba(245,250,255,.82);

        }


        .relay-deployment-brand-sub {

          position:
            absolute;

          left:
            35px;

          top:
            56px;

          z-index:
            40;

          font-size:
            6px;

          letter-spacing:
            .26em;

          color:
            rgba(117,247,255,.44);

        }


        /* ========================================================
           ONLINE
           ======================================================== */

        .relay-deployment-status {

          position:
            absolute;

          top:
            31px;

          right:
            36px;

          z-index:
            40;

          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          padding:
            7px 10px;

          border:
            1px solid
            rgba(117,247,255,.10);

          background:
            rgba(0,8,14,.24);

          backdrop-filter:
            blur(5px);

          font-size:
            7px;

          letter-spacing:
            .18em;

          color:
            rgba(222,246,251,.64);

        }


        .relay-status-dot {

          width:
            5px;

          height:
            5px;

          flex:
            0 0 auto;

          border-radius:
            50%;

          background:
            #00eaff;

          box-shadow:
            0 0 10px
            rgba(0,234,255,.95);

          animation:
            relayStatusPulseV4
            1.35s
            ease-in-out
            infinite;

        }


        @keyframes relayStatusPulseV4 {

          0%,
          100% {
            opacity:
              .35;
          }

          50% {
            opacity:
              1;
          }

        }


        /* ========================================================
           WATERMARK
           ======================================================== */

        .relay-mission-watermark {

          position:
            absolute;

          left:
            3.5%;

          top:
            20%;

          z-index:
            5;

          font-size:
            clamp(
              130px,
              20vw,
              300px
            );

          font-weight:
            900;

          line-height:
            .78;

          letter-spacing:
            -.075em;

          color:
            rgba(117,247,255,.043);

          pointer-events:
            none;

          user-select:
            none;

        }


        /* ========================================================
           MISSION HERO
           ======================================================== */

        .relay-mission-hero {

          position:
            absolute;

          left:
            clamp(
              32px,
              9vw,
              145px
            );

          top:
            48%;

          z-index:
            30;

          transform:
            translateY(-50%);

          width:
            min(
              720px,
              48vw
            );

          pointer-events:
            none;

          animation:
            relayHeroEnterV4
            .72s
            cubic-bezier(.16,1,.3,1)
            both;

        }


        @keyframes relayHeroEnterV4 {

          from {

            opacity:
              0;

            transform:
              translate(
                -24px,
                -50%
              );

          }

          to {

            opacity:
              1;

            transform:
              translate(
                0,
                -50%
              );

          }

        }


        .relay-mission-index {

          display:
            flex;

          align-items:
            center;

          gap:
            10px;

          margin-bottom:
            15px;

          font-size:
            8px;

          letter-spacing:
            .3em;

          color:
            rgba(186,235,245,.56);

        }


        .relay-mission-index b {

          padding:
            4px 8px;

          border:
            1px solid
            rgba(117,247,255,.35);

          background:
            rgba(0,234,255,.035);

          color:
            #75f7ff;

          font-size:
            8px;

          letter-spacing:
            .16em;

          box-shadow:
            0 0 16px
            rgba(0,234,255,.045);

        }


        .relay-mission-hero h1 {

          margin:
            0;

          display:
            grid;

          font-size:
            clamp(
              58px,
              7.7vw,
              118px
            );

          line-height:
            .82;

          font-weight:
            900;

          letter-spacing:
            -.055em;

          text-transform:
            uppercase;

          text-shadow:
            0 5px 24px
            rgba(0,0,0,.60),

            0 14px 42px
            rgba(0,0,0,.40);

        }


        .relay-mission-hero h1 span {

          color:
            #f7fcff;

        }


        .relay-mission-hero h1 em {

          margin-left:
            .055em;

          color:
            #75f7ff;

          font-style:
            normal;

          text-shadow:
            0 0 14px
            rgba(0,234,255,.24),

            0 0 30px
            rgba(0,140,255,.12);

        }


        .relay-mission-location {

          position:
            relative;

          display:
            flex;

          align-items:
            center;

          gap:
            11px;

          margin-top:
            21px;

        }


        .relay-mission-location::before {

          content:
            "";

          position:
            absolute;

          left:
            0;

          bottom:
            -9px;

          width:
            118px;

          height:
            1px;

          background:
            linear-gradient(
              90deg,
              rgba(0,234,255,.75),
              transparent
            );

          box-shadow:
            0 0 10px
            rgba(0,234,255,.22);

        }


        .relay-mission-location span {

          width:
            32px;

          height:
            1px;

          background:
            rgba(0,234,255,.72);

          box-shadow:
            0 0 9px
            rgba(0,234,255,.30);

        }


        .relay-mission-location strong {

          font-size:
            10px;

          letter-spacing:
            .24em;

          color:
            rgba(225,248,252,.84);

        }


        .relay-mission-location small {

          font-size:
            7px;

          letter-spacing:
            .18em;

          color:
            rgba(160,215,225,.48);

        }


        /* ========================================================
           RIGHT MISSION INTEL
           ======================================================== */

        .relay-mission-intel {

          position:
            absolute;

          right:
            clamp(
              34px,
              7.5vw,
              120px
            );

          top:
            50%;

          transform:
            translateY(-50%);

          z-index:
            35;

          width:
            min(
              330px,
              26vw
            );

          min-height:
            288px;

          padding:
            22px 22px 18px;

          border:
            1px solid
            rgba(117,247,255,.19);

          border-left:
            2px solid
            rgba(0,234,255,.68);

          background:
            linear-gradient(
              135deg,
              rgba(3,15,23,.80),
              rgba(1,7,12,.68)
            );

          box-shadow:

            0 28px 80px
            rgba(0,0,0,.52),

            0 0 38px
            rgba(0,140,255,.08),

            inset 0 0 32px
            rgba(0,234,255,.025);

          backdrop-filter:
            blur(11px);

          -webkit-backdrop-filter:
            blur(11px);

          animation:
            relayIntelEnterV4
            .8s
            .12s
            cubic-bezier(.16,1,.3,1)
            both;

        }


        @keyframes relayIntelEnterV4 {

          from {

            opacity:
              0;

            transform:
              translate(
                25px,
                -50%
              );

          }

          to {

            opacity:
              1;

            transform:
              translate(
                0,
                -50%
              );

          }

        }


        /* ========================================================
           INTEL CORNERS
           ======================================================== */

        .relay-mission-intel::before,
        .relay-mission-intel::after {

          content:
            "";

          position:
            absolute;

          width:
            26px;

          height:
            26px;

          pointer-events:
            none;

        }


        .relay-mission-intel::before {

          top:
            -1px;

          right:
            -1px;

          border-top:
            1px solid
            rgba(117,247,255,.65);

          border-right:
            1px solid
            rgba(117,247,255,.65);

        }


        .relay-mission-intel::after {

          left:
            -2px;

          bottom:
            -1px;

          border-left:
            2px solid
            rgba(0,234,255,.55);

          border-bottom:
            1px solid
            rgba(117,247,255,.35);

        }


        /* ========================================================
           INTEL TOP
           ======================================================== */

        .relay-intel-top {

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          padding-bottom:
            12px;

          border-bottom:
            1px solid
            rgba(117,247,255,.10);

        }


        .relay-intel-top span {

          font-size:
            7px;

          font-weight:
            700;

          letter-spacing:
            .26em;

          color:
            rgba(117,247,255,.65);

        }


        .relay-intel-top b {

          font-size:
            9px;

          font-weight:
            700;

          letter-spacing:
            .14em;

          color:
            rgba(117,247,255,.42);

        }


        /* ========================================================
           INTEL TITLE
           ======================================================== */

        .relay-intel-title {

          margin-top:
            16px;

          margin-bottom:
            20px;

          font-size:
            16px;

          font-weight:
            800;

          letter-spacing:
            .15em;

          color:
            #f2fbff;

          text-shadow:
            0 0 13px
            rgba(0,234,255,.10);

        }


        /* ========================================================
           INTEL ROWS
           ======================================================== */

        .relay-intel-list {

          display:
            grid;

          gap:
            18px;

        }


        .relay-intel-row {

          display:
            grid;

          gap:
            6px;

        }


        .relay-intel-label {

          display:
            flex;

          align-items:
            center;

          gap:
            8px;

        }


        .relay-intel-label span {

          width:
            5px;

          height:
            5px;

          flex:
            0 0 auto;

          border:
            1px solid
            rgba(117,247,255,.64);

          transform:
            rotate(45deg);

          box-shadow:
            0 0 7px
            rgba(0,234,255,.22);

        }


        .relay-intel-label small {

          font-size:
            7px;

          font-weight:
            700;

          letter-spacing:
            .24em;

          color:
            rgba(170,220,230,.45);

        }


        .relay-intel-row strong {

          padding-left:
            13px;

          font-size:
            12px;

          line-height:
            1.35;

          letter-spacing:
            .10em;

          color:
            #edf8fb;

          font-weight:
            650;

          text-shadow:
            0 2px 12px
            rgba(0,0,0,.4);

        }


        .relay-intel-threat {

          color:
            #75f7ff !important;

          text-shadow:
            0 0 12px
            rgba(0,234,255,.30) !important;

        }


        /* ========================================================
           INTEL SEPARATOR
           ======================================================== */

        .relay-intel-separator {

          width:
            100%;

          height:
            1px;

          margin:
            20px 0 15px;

          background:
            linear-gradient(
              90deg,
              rgba(117,247,255,.22),
              transparent
            );

        }


        /* ========================================================
           TARGET LOCK
           ======================================================== */

        .relay-intel-footer {

          display:
            flex;

          align-items:
            center;

          gap:
            11px;

        }


        .relay-target-indicator {

          position:
            relative;

          width:
            26px;

          height:
            26px;

          border:
            1px solid
            rgba(117,247,255,.32);

        }


        .relay-target-indicator::before {

          content:
            "";

          position:
            absolute;

          inset:
            6px;

          border:
            1px solid
            rgba(0,234,255,.70);

          border-radius:
            50%;

          box-shadow:
            0 0 9px
            rgba(0,234,255,.20);

        }


        .relay-target-indicator i {

          position:
            absolute;

          background:
            rgba(117,247,255,.78);

        }


        .relay-target-indicator i:nth-child(1) {

          width:
            5px;

          height:
            1px;

          left:
            -3px;

          top:
            12px;

        }


        .relay-target-indicator i:nth-child(2) {

          width:
            5px;

          height:
            1px;

          right:
            -3px;

          top:
            12px;

        }


        .relay-target-indicator i:nth-child(3) {

          width:
            1px;

          height:
            5px;

          top:
            -3px;

          left:
            12px;

        }


        .relay-target-indicator i:nth-child(4) {

          width:
            1px;

          height:
            5px;

          bottom:
            -3px;

          left:
            12px;

        }


        .relay-intel-footer > div:not(
          .relay-target-indicator
        ) {

          display:
            grid;

          gap:
            2px;

        }


        .relay-intel-footer small {

          font-size:
            6px;

          letter-spacing:
            .22em;

          color:
            rgba(170,220,230,.40);

        }


        .relay-intel-footer strong {

          font-size:
            9px;

          letter-spacing:
            .18em;

          color:
            rgba(117,247,255,.88);

        }


        .relay-intel-footer > span {

          margin-left:
            auto;

          font-size:
            7px;

          color:
            #00eaff;

          text-shadow:
            0 0 10px
            rgba(0,234,255,.70);

          animation:
            relayTargetPulseV4
            1.15s
            ease-in-out
            infinite;

        }


        @keyframes relayTargetPulseV4 {

          0%,
          100% {
            opacity:
              .35;
          }

          50% {
            opacity:
              1;
          }

        }


        /* ========================================================
           BOTTOM DEPLOYMENT
           ======================================================== */

        .relay-deployment-bottom {

          position:
            absolute;

          left:
            50%;

          bottom:
            max(
              32px,
              env(safe-area-inset-bottom)
            );

          transform:
            translateX(-50%);

          z-index:
            45;

          width:
            min(
              900px,
              calc(100vw - 72px)
            );

        }


        .relay-deployment-status-line {

          display:
            flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          margin-bottom:
            7px;

        }


        .relay-deployment-status-line > div {

          display:
            flex;

          align-items:
            center;

          gap:
            8px;

        }


        .relay-scan-dot {

          width:
            5px;

          height:
            5px;

          flex:
            0 0 auto;

          border-radius:
            50%;

          background:
            #00eaff;

          box-shadow:
            0 0 9px
            rgba(0,234,255,.95);

          animation:
            relayScanDotV4
            1s
            ease-in-out
            infinite;

        }


        @keyframes relayScanDotV4 {

          0%,
          100% {

            opacity:
              .35;

            transform:
              scale(.82);

          }

          50% {

            opacity:
              1;

            transform:
              scale(1.15);

          }

        }


        .relay-scan-status {

          font-size:
            7px;

          letter-spacing:
            .20em;

          color:
            rgba(229,249,253,.68);

        }


        .relay-scan-percent {

          font-size:
            18px;

          line-height:
            1;

          font-weight:
            700;

          letter-spacing:
            .08em;

          color:
            #75f7ff;

          text-shadow:
            0 0 12px
            rgba(0,234,255,.38);

        }


        /* ========================================================
           PROGRESS TRACK
           ======================================================== */

        .relay-deployment-track {

          position:
            relative;

          width:
            100%;

          height:
            4px;

          overflow:
            hidden;

          background:
            rgba(255,255,255,.065);

          border:
            1px solid
            rgba(117,247,255,.13);

          box-shadow:
            inset 0 0 10px
            rgba(0,0,0,.42);

        }


        .relay-deployment-track::after {

          content:
            "";

          position:
            absolute;

          inset:
            0;

          z-index:
            3;

          pointer-events:
            none;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.22),
              transparent
            );

          transform:
            translateX(-100%);

          animation:
            relayProgressShimmerV4
            2.5s
            linear
            infinite;

        }


        @keyframes relayProgressShimmerV4 {

          100% {

            transform:
              translateX(100%);

          }

        }


        .relay-splash-progress {

          position:
            relative;

          z-index:
            2;

          display:
            block;

          width:
            0%;

          height:
            100%;

          background:
            linear-gradient(
              90deg,
              #008cff 0%,
              #00eaff 68%,
              #b7fbff 100%
            );

          box-shadow:
            0 0 9px
            rgba(0,234,255,.80),

            0 0 24px
            rgba(0,140,255,.36);

          transition:
            width .24s
            cubic-bezier(.16,1,.3,1);

        }


        /* ========================================================
           BOTTOM META
           ======================================================== */

        .relay-deployment-bottom-meta {

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;

          margin-top:
            7px;

          font-size:
            6px;

          letter-spacing:
            .16em;

          color:
            rgba(175,220,230,.35);

        }


        .relay-scan-state {

          color:
            rgba(117,247,255,.76);

        }


        /* ========================================================
           COMPLETE
           ======================================================== */

        .relay-boot-complete {

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          margin-top:
            9px;

          opacity:
            0;

          transform:
            translateY(7px);

          transition:
            opacity .28s ease,
            transform .28s
            cubic-bezier(.16,1,.3,1);

        }


        .relay-boot-complete.is-visible {

          opacity:
            1;

          transform:
            translateY(0);

        }


        .relay-boot-complete > span {

          width:
            6px;

          height:
            6px;

          flex:
            0 0 auto;

          border-radius:
            50%;

          background:
            #75f7ff;

          box-shadow:
            0 0 10px
            #00eaff;

        }


        .relay-boot-complete strong {

          font-size:
            8px;

          letter-spacing:
            .20em;

          color:
            #f3fbff;

        }


        .relay-boot-complete small {

          font-size:
            6px;

          letter-spacing:
            .16em;

          color:
            rgba(117,247,255,.54);

        }


        /* ========================================================
           FOOTER
           ======================================================== */

        .relay-deployment-footer {

          position:
            absolute;

          left:
            34px;

          bottom:
            18px;

          z-index:
            35;

          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          font-size:
            5px;

          letter-spacing:
            .23em;

          color:
            rgba(180,220,230,.20);

        }


        .relay-deployment-footer i {

          width:
            18px;

          height:
            1px;

          background:
            rgba(117,247,255,.14);

        }


        /* ========================================================
           CLOSING
           ======================================================== */

        .relay-play-deployment.is-closing {

          opacity:
            0 !important;

          visibility:
            hidden !important;

          transition:
            opacity .40s
            cubic-bezier(.16,1,.3,1),
            visibility .40s;

        }


        /* ========================================================
           TABLET / SMALL DESKTOP
           ======================================================== */

        @media(
          max-width:1050px
        ) {

          .relay-mission-hero {

            left:
              7vw;

            width:
              min(
                600px,
                54vw
              );

          }


          .relay-mission-intel {

            right:
              5vw;

            width:
              290px;

          }


          .relay-mission-hero h1 {

            font-size:
              clamp(
                52px,
                8vw,
                92px
              );

          }

        }


        /* ========================================================
           MOBILE
           ======================================================== */

        @media(
          max-width:700px
        ) and (
          orientation:portrait
        ) {

          .relay-deployment-map-image {

            object-fit:
              cover;

            object-position:
              center;

            transform:
              scale(1.015);

            filter:
              brightness(.72)
              contrast(1.08)
              saturate(.92);

          }


          .relay-deployment-grid {

            opacity:
              .035;

            background-size:
              48px 48px;

          }


          .relay-deployment-brand {

            top:
              18px;

            left:
              18px;

          }


          .relay-deployment-brand b {

            font-size:
              15px;

          }


          .relay-deployment-brand span {

            font-size:
              7px;

            letter-spacing:
              .20em;

          }


          .relay-deployment-brand-sub {

            top:
              41px;

            left:
              19px;

            font-size:
              5px;

          }


          .relay-deployment-status {

            top:
              18px;

            right:
              18px;

            padding:
              5px 7px;

            font-size:
              5px;

            letter-spacing:
              .15em;

          }


          .relay-mission-watermark {

            left:
              -2%;

            top:
              17%;

            font-size:
              42vw;

          }


          .relay-map-frame {

            inset:
              7% 5%;

            opacity:
              .25;

          }


          .relay-map-frame i {

            width:
              25px;

            height:
              25px;

          }


          /* ------------------------------------------------------
             MOBILE HERO
             ------------------------------------------------------ */

          .relay-mission-hero {

            left:
              22px;

            right:
              22px;

            top:
              37%;

            width:
              auto;

            max-width:
              none;

            transform:
              translateY(-50%);

            animation:
              relayHeroEnterMobileV4
              .60s
              cubic-bezier(.16,1,.3,1)
              both;

          }


          @keyframes relayHeroEnterMobileV4 {

            from {

              opacity:
                0;

              transform:
                translate(
                  -16px,
                  -50%
                );

            }

            to {

              opacity:
                1;

              transform:
                translate(
                  0,
                  -50%
                );

            }

          }


          .relay-mission-index {

            margin-bottom:
              10px;

            font-size:
              6px;

            letter-spacing:
              .25em;

          }


          .relay-mission-index b {

            padding:
              3px 6px;

            font-size:
              7px;

          }


          .relay-mission-hero h1 {

            font-size:
              clamp(
                44px,
                13vw,
                72px
              );

            line-height:
              .85;

          }


          .relay-mission-location {

            flex-wrap:
              wrap;

            gap:
              7px;

            margin-top:
              15px;

          }


          .relay-mission-location::before {

            width:
              85px;

            bottom:
              -7px;

          }


          .relay-mission-location span {

            width:
              20px;

          }


          .relay-mission-location strong {

            font-size:
              8px;

          }


          .relay-mission-location small {

            width:
              100%;

            margin-left:
              27px;

            font-size:
              5px;

          }


          /* ------------------------------------------------------
             MOBILE INTEL
             ------------------------------------------------------ */

          .relay-mission-intel {

            left:
              18px;

            right:
              18px;

            top:
              auto;

            bottom:
              143px;

            width:
              auto;

            min-height:
              auto;

            padding:
              13px 14px 12px;

            transform:
              none;

            border-left:
              2px solid
              rgba(0,234,255,.70);

            animation:
              relayIntelMobileV4
              .65s
              .08s
              cubic-bezier(.16,1,.3,1)
              both;

          }


          @keyframes relayIntelMobileV4 {

            from {

              opacity:
                0;

              transform:
                translateY(
                  12px
                );

            }

            to {

              opacity:
                1;

              transform:
                translateY(
                  0
                );

            }

          }


          .relay-intel-top {

            padding-bottom:
              8px;

          }


          .relay-intel-top span {

            font-size:
              5px;

          }


          .relay-intel-top b {

            font-size:
              6px;

          }


          .relay-intel-title {

            margin-top:
              9px;

            margin-bottom:
              10px;

            font-size:
              9px;

            letter-spacing:
              .18em;

          }


          .relay-intel-list {

            display:
              grid;

            grid-template-columns:
              repeat(3, 1fr);

            gap:
              8px;

          }


          .relay-intel-row {

            min-width:
              0;

            gap:
              4px;

            margin:
              0;

          }


          .relay-intel-label {

            gap:
              5px;

          }


          .relay-intel-label span {

            width:
              4px;

            height:
              4px;

          }


          .relay-intel-label small {

            font-size:
              4px;

            letter-spacing:
              .13em;

          }


          .relay-intel-row strong {

            padding-left:
              9px;

            font-size:
              6px;

            line-height:
              1.25;

            letter-spacing:
              .07em;

            overflow-wrap:
              anywhere;

          }


          .relay-intel-separator {

            margin:
              10px 0 9px;

          }


          .relay-intel-footer {

            gap:
              7px;

          }


          .relay-target-indicator {

            width:
              18px;

            height:
              18px;

          }


          .relay-target-indicator::before {

            inset:
              5px;

          }


          .relay-target-indicator i:nth-child(1),
          .relay-target-indicator i:nth-child(2) {

            top:
              8px;

          }


          .relay-target-indicator i:nth-child(3),
          .relay-target-indicator i:nth-child(4) {

            left:
              8px;

          }


          .relay-intel-footer small {

            font-size:
              4px;

          }


          .relay-intel-footer strong {

            font-size:
              6px;

          }


          /* ------------------------------------------------------
             MOBILE BOTTOM SCAN
             ------------------------------------------------------ */

          .relay-deployment-bottom {

            left:
              18px;

            right:
              18px;

            bottom:
              max(
                19px,
                env(safe-area-inset-bottom)
              );

            width:
              auto;

            transform:
              none;

          }


          .relay-scan-status {

            font-size:
              5px;

            letter-spacing:
              .15em;

          }


          .relay-scan-percent {

            font-size:
              15px;

          }


          .relay-deployment-bottom-meta {

            font-size:
              4px;

            letter-spacing:
              .13em;

          }


          .relay-boot-complete {

            gap:
              6px;

            margin-top:
              7px;

          }


          .relay-boot-complete strong {

            font-size:
              6px;

          }


          .relay-boot-complete small {

            font-size:
              4px;

          }


          .relay-deployment-footer {

            display:
              none;

          }

        }


        /* ========================================================
           REDUCED MOTION
           ======================================================== */

        @media(
          prefers-reduced-motion: reduce
        ) {

          .relay-deployment-scan::after,
          .relay-deployment-glitch,
          .relay-mission-hero,
          .relay-mission-intel,
          .relay-status-dot,
          .relay-scan-dot,
          .relay-intel-footer > span,
          .relay-deployment-track::after {

            animation:
              none !important;

          }

        }

      `;


      document.head.appendChild(
        style
      );

    };


  /* ============================================================
     STAGE UPDATE
     ============================================================ */

  const setStage =
    (
      overlay,
      percent,
      label
    ) => {

      const pct =
        overlay.querySelector(
          '.relay-scan-percent'
        );

      const status =
        overlay.querySelector(
          '.relay-scan-status'
        );

      const state =
        overlay.querySelector(
          '.relay-scan-state'
        );

      const bar =
        overlay.querySelector(
          '.relay-splash-progress'
        );


      if (pct) {
        pct.textContent =
          `${Math.round(percent)}%`;
      }


      if (status) {
        status.textContent =
          label;
      }


      if (state) {
        state.textContent =
          label;
      }


      if (bar) {
        bar.style.width =
          `${Math.max(
            0,
            Math.min(
              100,
              percent
            )
          )}%`;
      }

    };


  /* ============================================================
     GLITCH LOOP
     ============================================================ */

  const startGlitchLoop =
    overlay => {

      if (
        reducedMotion()
      ) {
        return;
      }

      const glitch =
        overlay.querySelector(
          '.relay-deployment-glitch'
        );

      if (!glitch) {
        return;
      }


      const schedule =
        () => {

          const delay =
            3200 +
            Math.random() *
            4500;


          window.setTimeout(
            () => {

              if (
                !overlay.isConnected ||
                !active
              ) {
                return;
              }


              glitch.classList.remove(
                'is-active'
              );


              void glitch.offsetWidth;


              glitch.classList.add(
                'is-active'
              );


              window.setTimeout(
                () => {

                  glitch.classList.remove(
                    'is-active'
                  );

                },
                200
              );


              schedule();

            },
            delay
          );

        };


      schedule();

    };


  /* ============================================================
     MISSION BRIEFING
     ============================================================ */

  const getMissionReady = () => true;


  const revealMissionRoute =
    async overlay => {

      const api =
        window.relayGameplayIntroV5;


      if (
        api &&
        typeof api.close === 'function' &&
        typeof api.show === 'function'
      ) {

        if (
          typeof api.isVisible === 'function' &&
          api.isVisible()
        ) {

          api.close();

        }


        api.show();


        await new Promise(
          resolve =>
            NEXT_FRAME(
              () =>
                NEXT_FRAME(
                  resolve
                )
            )
        );

      }


      overlay.classList.add(
        'is-closing'
      );


      await WAIT(
        isCoarseDevice()
          ? 250
          : 400
      );


      overlay.remove();

      active = false;

    };


  /* ============================================================
     DEPLOYMENT
     ============================================================ */

  const runDeployment =
    async rawConfig => {

      if (active) {
        return false;
      }


      const config =
        normalizeConfig(
          rawConfig
        );


      active = true;

      const token =
        ++serial;


      let overlay;
      let watchdog;
      let handoffStarted =
        false;


      try {

        installStyle();


        overlay =
          makeOverlay(
            config
          );


        document.body.appendChild(
          overlay
        );


        /* ------------------------------------------------------
           IMAGE FALLBACK
           ------------------------------------------------------ */

        const image =
          overlay.querySelector(
            '.relay-deployment-map-image'
          );


        if (image) {

          image.addEventListener(
            'error',
            () => {

              if (
                image.dataset.fallbackApplied === '1'
              ) {
                return;
              }


              image.dataset.fallbackApplied =
                '1';


              image.src =
                isCoarseDevice()
                  ? DEFAULT_ASSETS.mobile
                  : DEFAULT_ASSETS.desktop;

            },
            {
              once:
                true
            }
          );

        }


        startGlitchLoop(
          overlay
        );


        /* ------------------------------------------------------
           WATCHDOG
           ------------------------------------------------------ */

        watchdog =
          window.setTimeout(
            async () => {

              if (
                !active ||
                handoffStarted ||
                !overlay?.isConnected
              ) {
                return;
              }


              handoffStarted =
                true;


              setStage(
                overlay,
                100,
                'DEPLOYMENT READY'
              );


              await runBounded(
                config.beforeRoute,
                1500
              );


              overlay.classList.add(
                'is-closing'
              );


              await WAIT(300);


              overlay.remove();

              active = false;

            },
            15000
          );


        /* ------------------------------------------------------
           INITIAL FRAMES
           ------------------------------------------------------ */

        await new Promise(
          resolve =>
            NEXT_FRAME(resolve)
        );


        await new Promise(
          resolve =>
            NEXT_FRAME(resolve)
        );


        if (
          !active ||
          token !== serial
        ) {
          return false;
        }


        /* ------------------------------------------------------
           SCAN 01
           ------------------------------------------------------ */

        setStage(
          overlay,
          7,
          'INITIALIZING IMAGE SCAN'
        );


        await WAIT(
          isCoarseDevice()
            ? 90
            : 230
        );


        if (
          !active ||
          token !== serial
        ) {
          return false;
        }


        /* ------------------------------------------------------
           SCAN 02
           ------------------------------------------------------ */

        setStage(
          overlay,
          21,
          'ANALYZING TERRAIN'
        );


        await WAIT(
          isCoarseDevice()
            ? 100
            : 260
        );


        if (
          !active ||
          token !== serial
        ) {
          return false;
        }


        /* ------------------------------------------------------
           SCAN 03
           ------------------------------------------------------ */

        setStage(
          overlay,
          39,
          'MAPPING ROUTE'
        );


        await WAIT(
          isCoarseDevice()
            ? 100
            : 270
        );


        if (
          !active ||
          token !== serial
        ) {
          return false;
        }


        /* ------------------------------------------------------
           SCAN 04
           ------------------------------------------------------ */

        setStage(
          overlay,
          57,
          'SCANNING MISSION AREA'
        );


        await WAIT(
          isCoarseDevice()
            ? 110
            : 290
        );


        if (
          !active ||
          token !== serial
        ) {
          return false;
        }


        /* ------------------------------------------------------
           SCAN 05
           ------------------------------------------------------ */

        setStage(
          overlay,
          74,
          'VERIFYING TARGET ZONE'
        );


        await WAIT(
          isCoarseDevice()
            ? 105
            : 290
        );


        if (
          !active ||
          token !== serial
        ) {
          return false;
        }


        /* ------------------------------------------------------
           SCAN 06
           ------------------------------------------------------ */

        setStage(
          overlay,
          89,
          'LOCKING MISSION ROUTE'
        );


        await WAIT(
          isCoarseDevice()
            ? 115
            : 320
        );


        /* ------------------------------------------------------
           WAIT FOR BRIEFING
           ------------------------------------------------------ */

        const readinessDeadline =
          performance.now() + 5000;


        while (
          !getMissionReady() &&
          performance.now() <
            readinessDeadline
        ) {

          await WAIT(50);


          if (
            !active ||
            token !== serial
          ) {
            return false;
          }

        }


        /* ------------------------------------------------------
           COMPLETE
           ------------------------------------------------------ */

        setStage(
          overlay,
          100,
          'SCAN COMPLETE'
        );


        overlay
          .querySelector(
            '.relay-boot-complete'
          )
          ?.classList.add(
            'is-visible'
          );


        overlay.setAttribute(
          'aria-busy',
          'false'
        );


        await WAIT(
          isCoarseDevice()
            ? 200
            : 520
        );


        if (
          !active ||
          token !== serial
        ) {
          return false;
        }


        /* ------------------------------------------------------
           ROUTE HANDOFF
           ------------------------------------------------------ */

        handoffStarted =
          true;


        await runBounded(
          config.beforeRoute,
          2500
        );


        if (
          !active ||
          token !== serial
        ) {
          return false;
        }


        /*
         * HOME PLAY: the splash is the complete presentation.
         * Do not open the tactical map afterwards.
         */
        if (config.skipRoute) {
          overlay.classList.add('is-closing');

          await WAIT(
            isCoarseDevice()
              ? 180
              : 300
          );

          overlay.remove();
          active = false;

          return true;
        }


        await revealMissionRoute(
          overlay
        );


        window.clearTimeout(
          watchdog
        );


        return true;

      } catch {

        window.clearTimeout(
          watchdog
        );


        overlay?.remove();

        active = false;

        return false;

      }

    };


  /* ============================================================
     PUBLIC API
     ============================================================ */

  window.relayPlayDeploymentV4 =
    Object.freeze({

      show:
        runDeployment,

      isActive:
        () => active,

      defaultAssets:
        DEFAULT_ASSETS,

      missions:
        MISSIONS,

    });


  /*
   * Compatibility layer.
   *
   * Existing scripts may still use V1.
   */

  window.relayPlayDeploymentV1 =
    window.relayPlayDeploymentV4;


  window.relayPlayDeploymentV3 =
    window.relayPlayDeploymentV4;


  /* ============================================================
     HOME START BUTTON
     ============================================================ */

  /*
   * IMPORTANT:
   * The HOME #start button is owned by the Play cinematic.
   * Do not intercept it here, otherwise this deployment loader
   * opens the tactical map before gameplay.
   *
   * The deployment API remains available for mission/route flows
   * that explicitly call relayPlayDeploymentV4.show().
   */

})();