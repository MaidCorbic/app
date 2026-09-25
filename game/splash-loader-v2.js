/*
 * ============================================================
 * RELAY RUNNER — CINEMATIC SPLASH V9
 *
 * FIRST LOAD:
 *
 * SPLASH
 *   ↓
 * SYSTEM BOOT
 *   ↓
 * HOME
 *
 * V9:
 * - Removes legacy splash HUD before building new HUD
 * - Prevents duplicate logo / loading elements
 * - Background photo remains dominant
 * - Image-aware readability
 * - Bottom loading HUD
 * - Full-screen scan
 * - Slow sensor sweep
 * - Minimal micro glitch
 * - Cinematic vignette
 * - Clean frame markers
 * - Mobile optimized
 * - No custom console output
 * ============================================================
 */

(() => {
  'use strict';

  if (window.__relaySplashV9) return;
  window.__relaySplashV9 = true;


  /* ============================================================
     DEVICE
     ============================================================ */

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


  const isMobilePortrait = () =>
    isCoarseDevice() &&
    window.matchMedia?.(
      '(orientation: portrait)'
    ).matches === true;


  const waitForLandscape = () =>
    new Promise(resolve => {
      if (!isMobilePortrait()) {
        resolve();
        return;
      }

      const check = () => {
        if (!isMobilePortrait()) {
          window.removeEventListener('orientationchange', check);
          window.removeEventListener('resize', check);
          resolve();
        }
      };

      window.addEventListener('orientationchange', check, { passive: true });
      window.addEventListener('resize', check, { passive: true });
      check();
    });


  const sleep = ms =>
    new Promise(resolve =>
      window.setTimeout(
        resolve,
        isCoarseDevice()
          ? Math.max(40, ms * 0.28)
          : ms
      )
    );


  /* ============================================================
     HOME READINESS
     ============================================================ */

  const homeIsReady = () => {

    const home =
      document.getElementById(
        'intro'
      );

    const start =
      home?.querySelector(
        '#start'
      );

    return Boolean(
      home?.dataset.homeV4Built === '1' &&
      start
    );

  };


  const revealHomeForRecovery = () => {

    /*
     * Gameplay handoff has started. Splash recovery must not reopen Home
     * and race the canonical Home -> Gameplay transition.
     */
    if (window.__relayGameplayHandoffStarted) return;

    const home =
      document.getElementById(
        'intro'
      );

    if (!home) return;


    home.classList.remove(
      'hidden'
    );


    home.removeAttribute(
      'hidden'
    );


    home.style.setProperty(
      'visibility',
      'visible',
      'important'
    );


    home.style.setProperty(
      'opacity',
      '1',
      'important'
    );


    home.style.setProperty(
      'pointer-events',
      'auto',
      'important'
    );


    document
      .getElementById(
        'game'
      )
      ?.classList.add(
        'relay-boot-ready'
      );

  };


  const waitForHomeReady = ({
    timeoutMs
  } = {}) =>
    new Promise(resolve => {

      const effectiveTimeout =
        timeoutMs ??
        (
          window.matchMedia?.(
            '(pointer: coarse)'
          ).matches === true
            ? 1400
            : 4200
        );


      const startedAt =
        performance.now();


      const check = () => {

        if (
          homeIsReady()
        ) {

          resolve(true);

          return;

        }


        if (
          performance.now() -
          startedAt >=
          effectiveTimeout
        ) {

          revealHomeForRecovery();

          resolve(false);

          return;

        }


        window.setTimeout(
          check,
          50
        );

      };


      check();

    });


  /* ============================================================
     FIND SPLASH
     ============================================================ */

  const getSplash = () =>
    document.querySelector(
      '.relay-splash'
    ) ||
    document.getElementById(
      'relaySplash'
    );


  /* ============================================================
     FIND IMAGE
     ============================================================ */

  const getSplashImage = splash =>
    splash?.querySelector(
      '.relay-splash-art, #relaySplashArt'
    );


  /* ============================================================
     REMOVE LEGACY / DUPLICATE HUD
     
     IMPORTANT:
     Your original HTML already contains elements such as:
     - .relay-splash-brand
     - .relay-splash-ui
     
     We remove those before creating V9.
     ============================================================ */

  const cleanupLegacySplash =
    splash => {

      if (!splash) return;


      const legacySelectors = [

        '.relay-splash-brand',

        '.relay-splash-ui',

        '.relay-splash-network-status',

        '.relay-splash-meta',

        '.relay-splash-track',

        '.relay-v7-scan',

        '.relay-v7-grain',

        '.relay-v7-glitch',

        '.relay-v8-scan',

        '.relay-v8-frame',

        '.relay-v8-brand',

        '.relay-v8-brand-sub',

        '.relay-v8-online',

        '.relay-v8-marker',

        '.relay-v8-glitch',

        '.relay-v8-ui',

        '.relay-v8-confirm',

        '.relay-deployment-scanlines',

        '.relay-deployment-sweep',

        '.relay-deployment-glitch',

      ];


      for (
        const selector of legacySelectors
      ) {

        splash
          .querySelectorAll(
            selector
          )
          .forEach(
            element =>
              element.remove()
          );

      }

    };


  /* ============================================================
     FIRST PAINT
     ============================================================ */

  const hardenSplash =
    splash => {

      if (!splash) return;


      const image =
        getSplashImage(
          splash
        );


      splash.style.setProperty(
        '--relay-image-brightness',
        '1'
      );


      splash.style.setProperty(
        '--relay-vignette-strength',
        '.72'
      );


      splash.style.setProperty(
        '--relay-ui-opacity',
        '.96'
      );


      splash.style.position =
        'fixed';


      splash.style.inset =
        '0';


      splash.style.width =
        '100vw';


      splash.style.height =
        '100vh';


      splash.style.width =
        '100dvw';


      splash.style.height =
        '100dvh';


      splash.style.zIndex =
        '2147483647';


      splash.style.display =
        'block';


      splash.style.opacity =
        '1';


      splash.style.visibility =
        'visible';


      splash.style.pointerEvents =
        'auto';


      splash.style.transform =
        'scale(1)';


      splash.style.filter =
        'none';


      splash.classList.remove(
        'is-hidden'
      );


      if (image) {

        const portrait =
          window.matchMedia(
            '(max-width:700px) and (orientation:portrait)'
          ).matches;


        image.style.display =
          'block';


        image.style.position =
          'absolute';


        image.style.inset =
          '0';


        image.style.width =
          '100vw';


        image.style.height =
          '100vh';


        image.style.width =
          '100dvw';


        image.style.height =
          '100dvh';


        image.style.minWidth =
          '100%';


        image.style.minHeight =
          '100%';


        image.style.maxWidth =
          'none';


        image.style.maxHeight =
          'none';


        image.style.objectFit =
          'cover';


        image.style.objectPosition =
          'center';


        image.style.opacity =
          '1';


        image.style.transform =
          'none';


        image.style.animation =
          'none';

      }

    };


  /* ============================================================
     IMAGE READABILITY
     ============================================================ */

  const analyzeImage =
    (
      splash,
      image
    ) => {

      if (
        !splash ||
        !image
      ) {
        return;
      }


      const fallback =
        () => {

          splash.style.setProperty(
            '--relay-image-brightness',
            '1'
          );

          splash.style.setProperty(
            '--relay-vignette-strength',
            '.72'
          );

          splash.style.setProperty(
            '--relay-ui-opacity',
            '.96'
          );

        };


      const analyse =
        () => {

          try {

            if (
              !image.naturalWidth ||
              !image.naturalHeight
            ) {

              fallback();

              return;

            }


            const canvas =
              document.createElement(
                'canvas'
              );


            canvas.width = 32;
            canvas.height = 18;


            const ctx =
              canvas.getContext(
                '2d',
                {
                  willReadFrequently:
                    true
                }
              );


            if (!ctx) {

              fallback();

              return;

            }


            ctx.drawImage(
              image,
              0,
              0,
              32,
              18
            );


            const pixels =
              ctx.getImageData(
                0,
                0,
                32,
                18
              ).data;


            let total =
              0;

            let count =
              0;


            for (
              let i = 0;
              i < pixels.length;
              i += 4
            ) {

              const alpha =
                pixels[i + 3];


              if (
                alpha < 20
              ) {
                continue;
              }


              total +=
                (
                  0.2126 *
                  pixels[i] +
                  0.7152 *
                  pixels[i + 1] +
                  0.0722 *
                  pixels[i + 2]
                ) /
                255;


              count++;

            }


            if (!count) {

              fallback();

              return;

            }


            const luminance =
              total /
              count;


            const vignette =
              Math.min(
                .88,
                Math.max(
                  .58,
                  .58 +
                  luminance * .30
                )
              );


            const uiOpacity =
              Math.min(
                1,
                Math.max(
                  .88,
                  .88 +
                  luminance * .12
                )
              );


            const brightness =
              luminance > .74
                ? '.94'
                : luminance < .25
                  ? '1.04'
                  : '1';


            splash.style.setProperty(
              '--relay-image-brightness',
              brightness
            );


            splash.style.setProperty(
              '--relay-vignette-strength',
              vignette.toFixed(2)
            );


            splash.style.setProperty(
              '--relay-ui-opacity',
              uiOpacity.toFixed(2)
            );

          } catch {

            fallback();

          }

        };


      if (
        image.complete &&
        image.naturalWidth > 0
      ) {

        analyse();

      } else {

        image.addEventListener(
          'load',
          analyse,
          {
            once:
              true
          }
        );


        image.addEventListener(
          'error',
          fallback,
          {
            once:
              true
          }
        );

      }

    };


  /* ============================================================
     INSTALL V9 VISUAL SYSTEM
     ============================================================ */

  const installVisualSystem =
    splash => {

      if (
        document.getElementById(
          'relay-v9-style'
        )
      ) {

        return;

      }


      const style =
        document.createElement(
          'style'
        );


      style.id =
        'relay-v9-style';


      style.textContent = `

        /* ======================================================
           ROOT
           ====================================================== */

        .relay-splash {

          --relay-image-brightness: 1;
          --relay-vignette-strength: .72;
          --relay-ui-opacity: .96;

          isolation:
            isolate !important;

          overflow:
            hidden !important;

          background:
            #000 !important;

        }


        /* ======================================================
           IMAGE
           ====================================================== */

        .relay-splash
        .relay-splash-art {

          filter:
            brightness(
              var(--relay-image-brightness)
            )
            contrast(1.06)
            saturate(.94);

          transform:
            scale(1.012);

          transition:
            filter .8s ease,
            transform 8s
            cubic-bezier(.16,1,.3,1);

        }


        /* ======================================================
           CINEMATIC DARKENING
           ====================================================== */

        .relay-splash
        .relay-v9-vignette {

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
              rgba(0,0,0,.66) 0%,
              rgba(0,0,0,.28) 23%,
              transparent 50%,
              rgba(0,0,0,.16) 73%,
              rgba(0,0,0,.62) 100%
            ),

            linear-gradient(
              180deg,
              rgba(0,0,0,.34) 0%,
              transparent 28%,
              transparent 63%,
              rgba(
                0,
                0,
                0,
                var(--relay-vignette-strength)
              ) 100%
            );

        }


        /* ======================================================
           CENTRAL DEPTH
           ====================================================== */

        .relay-splash
        .relay-v9-depth {

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
              ellipse at 50% 43%,
              rgba(255,255,255,.035) 0%,
              rgba(255,255,255,.010) 23%,
              transparent 61%
            );

          mix-blend-mode:
            screen;

        }


        /* ======================================================
           SCANLINES
           ====================================================== */

        .relay-splash
        .relay-v9-scan {

          position:
            absolute;

          inset:
            0;

          z-index:
            10;

          pointer-events:
            none;

          opacity:
            .22;

          background:
            repeating-linear-gradient(
              to bottom,
              transparent 0,
              transparent 6px,
              rgba(105,225,255,.026) 7px,
              transparent 8px
            );

          mix-blend-mode:
            screen;

        }


        /* ======================================================
           SWEEP
           ====================================================== */

        .relay-splash
        .relay-v9-scan::before {

          content:
            "";

          position:
            absolute;

          left:
            0;

          right:
            0;

          top:
            -14%;

          height:
            17%;

          background:
            linear-gradient(
              to bottom,
              transparent,
              rgba(0,234,255,.014),
              rgba(117,247,255,.062),
              rgba(255,255,255,.016),
              transparent
            );

          filter:
            blur(.6px);

          opacity:
            .62;

          animation:
            relayV9Sweep
            6.4s
            cubic-bezier(.45,0,.55,1)
            infinite;

        }


        @keyframes relayV9Sweep {

          0% {

            transform:
              translateY(-120%);

          }

          50% {

            transform:
              translateY(735%);

          }

          100% {

            transform:
              translateY(735%);

          }

        }


        /* ======================================================
           THIN SENSOR LINE
           ====================================================== */

        .relay-splash
        .relay-v9-scan::after {

          content:
            "";

          position:
            absolute;

          left:
            0;

          right:
            0;

          top:
            0;

          height:
            1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(0,234,255,.10),
              rgba(255,255,255,.34),
              rgba(0,234,255,.10),
              transparent
            );

          box-shadow:
            0 0 10px
            rgba(0,234,255,.10);

          animation:
            relayV9Line
            8.5s
            linear
            infinite;

        }


        @keyframes relayV9Line {

          0% {

            transform:
              translateY(-8vh);

            opacity:
              0;

          }

          10% {

            opacity:
              .20;

          }

          58% {

            opacity:
              .12;

          }

          100% {

            transform:
              translateY(108vh);

            opacity:
              0;

          }

        }


        /* ======================================================
           FRAME
           ====================================================== */

        .relay-splash
        .relay-v9-frame {

          position:
            absolute;

          inset:
            7.5% 5.5%;

          z-index:
            15;

          pointer-events:
            none;

          opacity:
            .30;

        }


        .relay-splash
        .relay-v9-frame i {

          position:
            absolute;

          width:
            42px;

          height:
            42px;

          border:
            0 solid
            rgba(117,247,255,.64);

        }


        .relay-splash
        .relay-v9-frame i:nth-child(1) {

          left:
            0;

          top:
            0;

          border-top:
            1px solid
            rgba(117,247,255,.64);

          border-left:
            1px solid
            rgba(117,247,255,.64);

        }


        .relay-splash
        .relay-v9-frame i:nth-child(2) {

          right:
            0;

          top:
            0;

          border-top:
            1px solid
            rgba(117,247,255,.64);

          border-right:
            1px solid
            rgba(117,247,255,.64);

        }


        .relay-splash
        .relay-v9-frame i:nth-child(3) {

          left:
            0;

          bottom:
            0;

          border-bottom:
            1px solid
            rgba(117,247,255,.64);

          border-left:
            1px solid
            rgba(117,247,255,.64);

        }


        .relay-splash
        .relay-v9-frame i:nth-child(4) {

          right:
            0;

          bottom:
            0;

          border-bottom:
            1px solid
            rgba(117,247,255,.64);

          border-right:
            1px solid
            rgba(117,247,255,.64);

        }


        /* ======================================================
           BRAND
           ====================================================== */

        .relay-splash
        .relay-v9-brand {

          position:
            absolute;

          left:
            34px;

          top:
            27px;

          z-index:
            30;

          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          pointer-events:
            none;

        }


        .relay-splash
        .relay-v9-brand b {

          font-size:
            18px;

          font-weight:
            900;

          letter-spacing:
            -.04em;

          color:
            #75f7ff;

          text-shadow:
            0 0 12px
            rgba(0,234,255,.32);

        }


        .relay-splash
        .relay-v9-brand span {

          font-size:
            8px;

          font-weight:
            600;

          letter-spacing:
            .27em;

          color:
            rgba(244,250,255,.76);

        }


        .relay-splash
        .relay-v9-brand-sub {

          position:
            absolute;

          left:
            35px;

          top:
            53px;

          z-index:
            30;

          font-size:
            5px;

          letter-spacing:
            .27em;

          color:
            rgba(117,247,255,.38);

          pointer-events:
            none;

        }


        /* ======================================================
           SYSTEM STATUS
           ====================================================== */

        .relay-splash
        .relay-v9-status {

          position:
            absolute;

          right:
            34px;

          top:
            28px;

          z-index:
            30;

          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          padding:
            6px 9px;

          border:
            1px solid
            rgba(117,247,255,.10);

          background:
            rgba(0,7,12,.24);

          backdrop-filter:
            blur(5px);

          font-size:
            6px;

          letter-spacing:
            .19em;

          color:
            rgba(224,246,251,.56);

          pointer-events:
            none;

        }


        .relay-splash
        .relay-v9-status i {

          width:
            5px;

          height:
            5px;

          border-radius:
            50%;

          background:
            #00eaff;

          box-shadow:
            0 0 9px
            rgba(0,234,255,.90);

          animation:
            relayV9Pulse
            1.35s
            ease-in-out
            infinite;

        }


        @keyframes relayV9Pulse {

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


        /* ======================================================
           CENTER TARGET MARKER
           ====================================================== */

        .relay-splash
        .relay-v9-marker {

          position:
            absolute;

          left:
            50%;

          top:
            45%;

          z-index:
            17;

          width:
            48px;

          height:
            48px;

          transform:
            translate(
              -50%,
              -50%
            );

          opacity:
            .14;

          pointer-events:
            none;

        }


        .relay-splash
        .relay-v9-marker::before {

          content:
            "";

          position:
            absolute;

          inset:
            12px;

          border:
            1px solid
            rgba(117,247,255,.70);

          border-radius:
            50%;

        }


        .relay-splash
        .relay-v9-marker::after {

          content:
            "";

          position:
            absolute;

          left:
            50%;

          top:
            -8px;

          width:
            1px;

          height:
            64px;

          background:
            linear-gradient(
              to bottom,
              transparent,
              rgba(117,247,255,.42),
              transparent
            );

        }


        /* ======================================================
           GLITCH
           ====================================================== */

        .relay-splash
        .relay-v9-glitch {

          position:
            absolute;

          inset:
            0;

          z-index:
            20;

          pointer-events:
            none;

          opacity:
            0;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(0,234,255,.055),
              transparent
            );

          mix-blend-mode:
            screen;

        }


        .relay-splash
        .relay-v9-glitch.is-active {

          animation:
            relayV9Glitch
            .18s
            steps(2,end)
            both;

        }


        .relay-splash
        .relay-v9-glitch::before,
        .relay-splash
        .relay-v9-glitch::after {

          content:
            "";

          position:
            absolute;

          left:
            0;

          right:
            0;

          height:
            1px;

          background:
            rgba(117,247,255,.22);

          opacity:
            0;

        }


        .relay-splash
        .relay-v9-glitch::before {

          top:
            36%;

        }


        .relay-splash
        .relay-v9-glitch::after {

          top:
            64%;

        }


        .relay-splash
        .relay-v9-glitch.is-active::before {

          opacity:
            .50;

          transform:
            translateX(-.7%);

        }


        .relay-splash
        .relay-v9-glitch.is-active::after {

          opacity:
            .34;

          transform:
            translateX(.6%);

        }


        @keyframes relayV9Glitch {

          0% {

            opacity:
              0;

            transform:
              translateX(0);

            clip-path:
              inset(0);

          }

          18% {

            opacity:
              .10;

            transform:
              translateX(-.2%);

            clip-path:
              inset(
                25% 0 59% 0
              );

          }

          45% {

            opacity:
              .035;

            transform:
              translateX(.16%);

            clip-path:
              inset(
                55% 0 29% 0
              );

          }

          70% {

            opacity:
              .08;

            transform:
              translateX(-.10%);

            clip-path:
              inset(
                72% 0 11% 0
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


        /* ======================================================
           BOTTOM HUD
           ====================================================== */

        .relay-splash
        .relay-v9-ui {

          position:
            absolute;

          left:
            50%;

          bottom:
            max(
              30px,
              env(safe-area-inset-bottom)
            );

          transform:
            translateX(-50%);

          z-index:
            40;

          width:
            min(
              720px,
              calc(100vw - 52px)
            );

          opacity:
            var(--relay-ui-opacity);

          pointer-events:
            none;

        }


        .relay-splash
        .relay-v9-ui-top {

          display:
            flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap:
            15px;

          margin-bottom:
            7px;

        }


        .relay-splash
        .relay-v9-status-line {

          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          min-width:
            0;

        }


        .relay-splash
        .relay-v9-status-dot {

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
            rgba(0,234,255,.90);

          animation:
            relayV9Dot
            1s
            ease-in-out
            infinite;

        }


        @keyframes relayV9Dot {

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


        .relay-splash
        .relay-v9-status-text {

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;

          font-size:
            7px;

          letter-spacing:
            .19em;

          color:
            rgba(239,249,252,.70);

          text-shadow:
            0 1px 8px
            rgba(0,0,0,.55);

        }


        .relay-splash
        .relay-v9-percent {

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


        /* ======================================================
           TRACK
           ====================================================== */

        .relay-splash
        .relay-v9-track {

          position:
            relative;

          width:
            100%;

          height:
            4px;

          overflow:
            hidden;

          background:
            rgba(255,255,255,.07);

          border:
            1px solid
            rgba(117,247,255,.14);

          box-shadow:
            inset 0 0 9px
            rgba(0,0,0,.42);

        }


        .relay-splash
        .relay-v9-track::after {

          content:
            "";

          position:
            absolute;

          inset:
            0;

          z-index:
            3;

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
            relayV9Shimmer
            2.6s
            linear
            infinite;

        }


        @keyframes relayV9Shimmer {

          100% {
            transform:
              translateX(100%);
          }

        }


        .relay-splash
        .relay-v9-progress {

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
              #008cff,
              #00eaff 70%,
              #b8fbff
            );

          box-shadow:
            0 0 9px
            rgba(0,234,255,.78),

            0 0 23px
            rgba(0,140,255,.30);

          transition:
            width .24s
            cubic-bezier(.16,1,.3,1);

        }


        /* ======================================================
           META
           ====================================================== */

        .relay-splash
        .relay-v9-ui-bottom {

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            15px;

          margin-top:
            6px;

        }


        .relay-splash
        .relay-v9-meta-left,
        .relay-splash
        .relay-v9-meta-right {

          font-size:
            6px;

          letter-spacing:
            .17em;

        }


        .relay-splash
        .relay-v9-meta-left {

          color:
            rgba(185,225,232,.34);

        }


        .relay-splash
        .relay-v9-meta-right {

          color:
            rgba(117,247,255,.66);

        }


        /* ======================================================
           READY
           ====================================================== */

        .relay-splash
        .relay-v9-confirm {

          position:
            absolute;

          left:
            50%;

          bottom:
            calc(
              max(
                30px,
                env(safe-area-inset-bottom)
              ) + 38px
            );

          transform:
            translateX(-50%)
            translateY(5px);

          z-index:
            41;

          opacity:
            0;

          font-size:
            7px;

          letter-spacing:
            .28em;

          color:
            #f3fbff;

          text-shadow:
            0 0 13px
            rgba(0,234,255,.24);

          transition:
            opacity .25s ease,
            transform .25s
            cubic-bezier(.16,1,.3,1);

          pointer-events:
            none;

        }


        .relay-splash
        .relay-v9-confirm.is-visible {

          opacity:
            1;

          transform:
            translateX(-50%)
            translateY(0);

        }


        /* ======================================================
           MOBILE
           ====================================================== */

        @media(
          max-width:700px
        ) {

          .relay-splash
          .relay-v9-frame {

            inset:
              7% 5%;

            opacity:
              .24;

          }


          .relay-splash
          .relay-v9-frame i {

            width:
              25px;

            height:
              25px;

          }


          .relay-splash
          .relay-v9-brand {

            left:
              18px;

            top:
              18px;

          }


          .relay-splash
          .relay-v9-brand b {

            font-size:
              15px;

          }


          .relay-splash
          .relay-v9-brand span {

            font-size:
              6px;

            letter-spacing:
              .20em;

          }


          .relay-splash
          .relay-v9-brand-sub {

            left:
              19px;

            top:
              40px;

            font-size:
              4px;

          }


          .relay-splash
          .relay-v9-status {

            right:
              18px;

            top:
              18px;

            padding:
              5px 7px;

            font-size:
              5px;

          }


          .relay-splash
          .relay-v9-marker {

            width:
              35px;

            height:
              35px;

            top:
              44%;

            opacity:
              .10;

          }


          .relay-splash
          .relay-v9-ui {

            left:
              18px;

            right:
              18px;

            bottom:
              max(
                20px,
                env(safe-area-inset-bottom)
              );

            width:
              auto;

            transform:
              none;

          }


          .relay-splash
          .relay-v9-status-text {

            font-size:
              5px;

            letter-spacing:
              .14em;

          }


          .relay-splash
          .relay-v9-percent {

            font-size:
              15px;

          }


          .relay-splash
          .relay-v9-meta-left,
          .relay-splash
          .relay-v9-meta-right {

            font-size:
              4px;

            letter-spacing:
              .12em;

          }


          .relay-splash
          .relay-v9-confirm {

            bottom:
              calc(
                max(
                  20px,
                  env(safe-area-inset-bottom)
                ) + 36px
              );

            font-size:
              6px;

          }

        }


        /* ======================================================
           PORTRAIT
           ====================================================== */

        @media(
          max-width:700px
        ) and (
          orientation:portrait
        ) {

          .relay-splash
          .relay-splash-art {

            object-fit:
              contain;

            background:
              #000;

          }


          .relay-splash
          .relay-v9-vignette {

            background:

              linear-gradient(
                180deg,
                rgba(0,0,0,.34),
                transparent 28%,
                transparent 56%,
                rgba(0,0,0,.84)
              );

          }

        }


        /* ======================================================
           REDUCED MOTION
           ====================================================== */

        @media(
          prefers-reduced-motion: reduce
        ) {

          .relay-splash
          .relay-splash-art {

            transform:
              none !important;

            transition:
              none !important;

          }


          .relay-splash
          .relay-v9-scan::before,

          .relay-splash
          .relay-v9-scan::after,

          .relay-splash
          .relay-v9-track::after,

          .relay-splash
          .relay-v9-status i,

          .relay-splash
          .relay-v9-status-dot {

            animation:
              none !important;

          }


          .relay-splash
          .relay-v9-glitch {

            display:
              none !important;

          }

        }

      `;


      document.head.appendChild(
        style
      );


      /* ========================================================
         BUILD V9 VISUAL ELEMENTS
         ======================================================== */

      const create =
        (
          className,
          html = ''
        ) => {

          const element =
            document.createElement(
              'div'
            );

          element.className =
            className;

          if (html) {
            element.innerHTML =
              html;
          }

          splash.appendChild(
            element
          );

          return element;

        };


      /* ========================================================
         VIGNETTE
         ======================================================== */

      create(
        'relay-v9-vignette'
      );


      /* ========================================================
         DEPTH
         ======================================================== */

      create(
        'relay-v9-depth'
      );


      /* ========================================================
         SCAN
         ======================================================== */

      create(
        'relay-v9-scan'
      );


      /* ========================================================
         FRAME
         ======================================================== */

      create(
        'relay-v9-frame',
        `
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        `
      );


      /* ========================================================
         BRAND
         ======================================================== */

      create(
        'relay-v9-brand',
        `
          <b>R/</b>
          <span>RELAY RUNNER</span>
        `
      );


      create(
        'relay-v9-brand-sub',
        'SYSTEM INITIALIZATION'
      );


      /* ========================================================
         STATUS
         ======================================================== */

      create(
        'relay-v9-status',
        `
          <i></i>
          <span>SYSTEM ONLINE</span>
        `
      );


      /* ========================================================
         TARGET
         ======================================================== */

      create(
        'relay-v9-marker'
      );


      /* ========================================================
         GLITCH
         ======================================================== */

      const glitch =
        create(
          'relay-v9-glitch'
        );


      /* ========================================================
         BOTTOM UI
         ======================================================== */

      const ui =
        create(
          'relay-v9-ui',
          `
            <div
              class="relay-v9-ui-top"
            >

              <div
                class="relay-v9-status-line"
              >

                <span
                  class="relay-v9-status-dot"
                ></span>

                <span
                  class="relay-v9-status-text"
                >
                  INITIALIZING RELAY CORE
                </span>

              </div>


              <strong
                class="relay-v9-percent"
              >
                0%
              </strong>

            </div>


            <div
              class="relay-v9-track"
            >

              <i
                class="relay-v9-progress"
              ></i>

            </div>


            <div
              class="relay-v9-ui-bottom"
            >

              <span
                class="relay-v9-meta-left"
              >
                SECURE BOOT
              </span>

              <b
                class="relay-v9-meta-right"
              >
                CONNECTING
              </b>

            </div>
          `
        );


      /* ========================================================
         READY LABEL
         ======================================================== */

      const confirm =
        create(
          'relay-v9-confirm',
          'RELAY ONLINE'
        );


      /* ========================================================
         GLITCH LOOP
         ======================================================== */

      if (
        !reducedMotion()
      ) {

        const schedule =
          () => {

            const delay =
              3400 +
              Math.random() *
              5000;


            window.setTimeout(
              () => {

                if (
                  !document.body.contains(
                    splash
                  )
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
                  210
                );


                schedule();

              },
              delay
            );

          };


        schedule();

      }


      analyzeImage(
        splash,
        getSplashImage(
          splash
        )
      );


      return {
        ui,
        confirm,
        glitch
      };

    };


  /* ============================================================
     PROGRESS CONTROLLER
     ============================================================ */

  const createProgressController =
    splash => {

      const bar =
        splash.querySelector(
          '.relay-v9-progress'
        );


      const pct =
        splash.querySelector(
          '.relay-v9-percent'
        );


      const status =
        splash.querySelector(
          '.relay-v9-status-text'
        );


      const state =
        splash.querySelector(
          '.relay-v9-meta-right'
        );


      let progress =
        0;


      const setProgress =
        (
          value,
          statusText,
          stateText
        ) => {

          progress =
            Math.max(
              progress,
              Math.min(
                100,
                Math.round(
                  value
                )
              )
            );


          if (bar) {

            bar.style.width =
              `${progress}%`;

          }


          if (pct) {

            pct.textContent =
              `${progress}%`;

          }


          if (
            statusText &&
            status
          ) {

            status.textContent =
              statusText;

          }


          if (
            stateText &&
            state
          ) {

            state.textContent =
              stateText;

          }

        };


      const animateTo =
        (
          target,
          statusText,
          stateText,
          duration
        ) =>
          new Promise(
            resolve => {

              const from =
                progress;


              const to =
                Math.max(
                  from,
                  Math.min(
                    100,
                    target
                  )
                );


              const startedAt =
                performance.now();


              const effectiveDuration =
                duration;


              const frame =
                now => {

                  const t =
                    Math.min(
                      1,
                      (
                        now -
                        startedAt
                      ) /
                      effectiveDuration
                    );


                  const eased =
                    1 -
                    Math.pow(
                      1 - t,
                      3
                    );


                  setProgress(
                    from +
                    (
                      to -
                      from
                    ) *
                    eased,
                    statusText,
                    stateText
                  );


                  if (
                    t < 1
                  ) {

                    window.setTimeout(
                      () =>
                        frame(
                          performance.now()
                        ),
                      16
                    );

                  } else {

                    setProgress(
                      to,
                      statusText,
                      stateText
                    );


                    resolve();

                  }

                };


              window.setTimeout(
                () =>
                  frame(
                    performance.now()
                  ),
                16
              );

            }
          );


      return {
        setProgress,
        animateTo
      };

    };


  /* ============================================================
     RUN
     ============================================================ */

  const run =
    async () => {

      const splash =
        getSplash();


      if (!splash) {
        return;
      }


      /* ========================================================
         FAIL OPEN
         ======================================================== */

      const failOpenTimer =
        window.setTimeout(
          () => {

            if (
              !document.body.contains(
                splash
              ) ||
              isMobilePortrait()
            ) {
              return;
            }


            revealHomeForRecovery();


            splash.setAttribute(
              'aria-busy',
              'false'
            );


            splash.remove();

          },
          10000
        );


      const clearFailOpen =
        () =>
          window.clearTimeout(
            failOpenTimer
          );


      /* ========================================================
         CLEAN OLD SPLASH HUD
         ======================================================== */

      cleanupLegacySplash(
        splash
      );


      /* ========================================================
         HARDEN
         ======================================================== */

      hardenSplash(
        splash
      );


      /* ========================================================
         MOBILE PORTRAIT GATE
         Portrait intentionally stays on the loader.
         Gameplay boots after rotation to landscape.
         ======================================================== */

      await waitForLandscape();


      /* ========================================================
         INSTALL V9
         ======================================================== */

      const visual =
        installVisualSystem(
          splash
        );


      /* ========================================================
         IMAGE
         ======================================================== */

      const image =
        getSplashImage(
          splash
        );


      if (!image) {

        clearFailOpen();

        revealHomeForRecovery();

        splash.remove();

        return;

      }


      try {

        if (
          image.decode &&
          image.complete &&
          image.naturalWidth > 0
        ) {

          await image.decode();

        }

      } catch {
        /* Continue normally. */
      }


      /* ========================================================
         PROGRESS
         ======================================================== */

      const controller =
        createProgressController(
          splash
        );


      const set =
        controller.setProgress;


      const animate =
        controller.animateTo;


      /* ========================================================
         START
         ======================================================== */

      set(
        0,
        'INITIALIZING RELAY CORE',
        'SECURE BOOT'
      );


      await sleep(
        280
      );


      /* ========================================================
         08
         ======================================================== */

      await animate(
        8,
        'RELAY CORE INITIALIZING',
        'CORE START',
        650
      );


      await sleep(
        220
      );


      /* ========================================================
         24
         ======================================================== */

      await animate(
        24,
        'ESTABLISHING SYSTEM LINK',
        'LINK ESTABLISH',
        740
      );


      await sleep(
        300
      );


      /* ========================================================
         43
         ======================================================== */

      await animate(
        43,
        'LOADING INTERFACE CORE',
        'INTERFACE READY',
        800
      );


      await sleep(
        320
      );


      /* ========================================================
         62
         ======================================================== */

      await animate(
        62,
        'CONNECTING WORLD SYSTEMS',
        'WORLD LINK',
        800
      );


      await sleep(
        330
      );


      /* ========================================================
         81
         ======================================================== */

      await animate(
        81,
        'VERIFYING HOME SYSTEMS',
        'HOME VERIFY',
        750
      );


      await sleep(
        300
      );


      /* ========================================================
         94
         ======================================================== */

      await animate(
        94,
        'FINALIZING RELAY BOOT',
        'FINAL CHECK',
        600
      );


      await sleep(
        250
      );


      /* ========================================================
         HOME READY
         ======================================================== */

      await waitForHomeReady();


      /* ========================================================
         100
         ======================================================== */

      set(
        100,
        'RELAY ONLINE',
        'SYSTEM READY'
      );


      if (
        visual?.confirm
      ) {

        visual.confirm.classList.add(
          'is-visible'
        );

      }


      splash.setAttribute(
        'aria-busy',
        'false'
      );


      await sleep(
        900
      );


      /* ========================================================
         EXIT
         ======================================================== */

      const exitDuration =
        '1.15s';


      splash.style.transition =
        [
          `opacity ${exitDuration} cubic-bezier(.16,1,.3,1)`,
          `transform ${exitDuration} cubic-bezier(.16,1,.3,1)`,
          `filter ${exitDuration} ease`
        ].join(',');


      void splash.offsetWidth;


      splash.style.opacity =
        '0';


      splash.style.transform =
        'scale(1.025)';


      splash.style.filter =
        'brightness(1.08)';


      await sleep(
        1180
      );


      splash.remove();


      document
        .getElementById(
          'game'
        )
        ?.classList.add(
          'relay-boot-ready'
        );


      clearFailOpen();

    };


  /* ============================================================
     START
     ============================================================ */

  run().catch(() => {

    const splash =
      getSplash();


    if (splash) {

      document
        .getElementById(
          'game'
        )
        ?.classList.add(
          'relay-boot-ready'
        );


      splash.remove();

    }

  });

})();