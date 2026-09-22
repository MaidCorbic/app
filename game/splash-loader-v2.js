/* =========================================================
   RELAY RUNNER — CINEMATIC SPLASH V9
   ---------------------------------------------------------
   BOOT FLOW:

   FIRST PAINT
       ↓
   SPLASH ONLY
       ↓
   0% → 8% → 26% → 48% → 68% → 86% → 100%
       ↓
   SOFT FADE
       ↓
   HOME ONLY
       ↓
   USER STARTS GAME
       ↓
   GAME

   IMPORTANT:
   - No black cinematic transition.
   - No zoom transition.
   - No brightness flash.
   - No heavy blur.
   - Splash gently fades into Home.
   ========================================================= */

(() => {

  /* =======================================================
     SINGLE INSTANCE GUARD
     ======================================================= */

  if (window.__relaySplashV9) {
    return;
  }

  window.__relaySplashV9 = true;


  /* =======================================================
     ROOT BOOT STATE
     ======================================================= */

  const html =
    document.documentElement;

  html.classList.add(
    'relay-booting'
  );

  html.classList.remove(
    'relay-boot-ready'
  );


  /* =======================================================
     DEVICE
     ======================================================= */

  const isCoarseDevice = () =>
    window.matchMedia?.(
      '(pointer: coarse)'
    ).matches === true ||
    Number(
      navigator.maxTouchPoints || 0
    ) > 0;


  /* =======================================================
     SLEEP
     ======================================================= */

  const sleep = ms =>
    new Promise(resolve => {

      setTimeout(
        resolve,
        isCoarseDevice()
          ? Math.max(
              40,
              ms * 0.3
            )
          : ms
      );

    });


  /* =======================================================
     SELECTORS
     ======================================================= */

  const getSplash = () =>
    document.querySelector(
      '.relay-splash'
    ) ||
    document.getElementById(
      'relaySplash'
    );


  const getHome = () =>
    document.getElementById(
      'intro'
    );


  const getGame = () =>
    document.getElementById(
      'game'
    );


  /* =======================================================
     FORCE NON-HOME SCREENS CLOSED
     ======================================================= */

  const closeNonHomeScreens = () => {

    const selectors = [

      '#play',
      '#pauseMenu',
      '#titlePanel',
      '#relayInfoPanel',
      '#finish',
      '#gameOver',
      '#levelUp',
      '#abilityUnlock'

    ];


    selectors.forEach(
      selector => {

        const element =
          document.querySelector(
            selector
          );


        if (!element) {
          return;
        }


        element.classList.add(
          'hidden'
        );


        element.setAttribute(
          'aria-hidden',
          'true'
        );


        element.style.setProperty(
          'visibility',
          'hidden',
          'important'
        );


        element.style.setProperty(
          'pointer-events',
          'none',
          'important'
        );

      }
    );

  };


  /* =======================================================
     OPEN HOME ONLY
     ======================================================= */

  const openHomeOnly = () => {

    const home =
      getHome();

    const game =
      getGame();


    /*
     * Close every game/modal screen.
     */
    closeNonHomeScreens();


    /* -----------------------------------------------------
       HOME
       ----------------------------------------------------- */

    if (home) {

      home.classList.remove(
        'hidden'
      );


      home.removeAttribute(
        'hidden'
      );


      home.removeAttribute(
        'aria-hidden'
      );


      home.classList.add(
        'relay-home-active'
      );


      home.style.setProperty(
        'display',
        'block',
        'important'
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
        'transform',
        'translateY(0) scale(1)',
        'important'
      );


      /*
       * IMPORTANT:
       * No blur after loader.
       */
      home.style.setProperty(
        'filter',
        'none',
        'important'
      );


      home.style.setProperty(
        'pointer-events',
        'auto',
        'important'
      );

    }


    /* -----------------------------------------------------
       GAME CONTAINER
       ----------------------------------------------------- */

    if (game) {

      game.classList.add(
        'relay-boot-ready'
      );


      game.style.setProperty(
        'visibility',
        'visible',
        'important'
      );


      game.style.setProperty(
        'opacity',
        '1',
        'important'
      );


      game.style.setProperty(
        'pointer-events',
        'auto',
        'important'
      );

    }


    /* -----------------------------------------------------
       RELEASE FIRST PAINT LOCK
       ----------------------------------------------------- */

    html.classList.remove(
      'relay-booting'
    );


    html.classList.add(
      'relay-boot-ready'
    );

  };


  /* =======================================================
     RECOVERY
     ======================================================= */

  const revealHomeForRecovery = () => {

    const splash =
      getSplash();


    /*
     * Kill any splash transition immediately.
     */
    if (splash) {

      splash.style.setProperty(
        'transition',
        'none',
        'important'
      );


      splash.style.setProperty(
        'animation',
        'none',
        'important'
      );

    }


    openHomeOnly();

  };


  /* =======================================================
     CINEMATIC EFFECTS
     ======================================================= */

  const installCinematicEffects =
    splash => {

      if (!splash) {
        return;
      }


      if (
        document.getElementById(
          'relay-v9-cinematic-style'
        )
      ) {
        return;
      }


      const style =
        document.createElement(
          'style'
        );


      style.id =
        'relay-v9-cinematic-style';


      style.textContent = `

        /* =================================================
           SPLASH BASE
           ================================================= */

        .relay-splash {

          isolation: isolate !important;

          overflow: hidden !important;

          /*
           * Keep the splash dark internally,
           * but NEVER create a separate black
           * transition layer over Home.
           */
          background: #02060a !important;

        }


        /* =================================================
           AMBIENT
           ================================================= */

        .relay-splash
        .relay-v9-ambient {

          position: absolute;

          inset: 0;

          z-index: 0;

          overflow: hidden;

          pointer-events: none;

          background:
            radial-gradient(
              circle at 50% 45%,
              rgba(0,220,255,.09),
              transparent 38%
            ),
            radial-gradient(
              circle at 20% 80%,
              rgba(0,130,255,.06),
              transparent 34%
            ),
            #02060a;

        }


        /* =================================================
           SPLASH ART
           ================================================= */

        .relay-splash
        .relay-splash-art,

        .relay-splash
        #relaySplashArt {

          position: absolute !important;

          z-index: 1 !important;

        }


        /* =================================================
           SOFT VEIL
           ================================================= */

        .relay-splash
        .relay-v9-veil {

          position: absolute;

          inset: -10%;

          z-index: 2;

          pointer-events: none;

          background:
            radial-gradient(
              circle at 50% 50%,
              transparent 0%,
              rgba(0,0,0,.06) 42%,
              rgba(0,0,0,.22) 100%
            );

          mix-blend-mode: screen;

          opacity: .35;

          animation:
            relayV9Veil
            5s
            ease-in-out
            infinite;

        }


        /* =================================================
           SCAN
           ================================================= */

        .relay-splash
        .relay-v9-scan {

          position: absolute;

          left: 0;
          right: 0;

          top: -18%;

          height: 18%;

          z-index: 3;

          pointer-events: none;

          background:
            linear-gradient(
              to bottom,
              transparent 0%,
              rgba(0,229,255,.025) 25%,
              rgba(0,229,255,.10) 50%,
              rgba(0,229,255,.025) 75%,
              transparent 100%
            );

          filter:
            blur(2px)
            drop-shadow(
              0 0 18px
              rgba(0,229,255,.10)
            );

          animation:
            relayV9Scan
            5.5s
            linear
            infinite;

        }


        /* =================================================
           ORBS
           ================================================= */

        .relay-splash
        .relay-v9-orb {

          position: absolute;

          border-radius: 50%;

          pointer-events: none;

          filter: blur(35px);

          mix-blend-mode: screen;

        }


        .relay-splash
        .relay-v9-orb-a {

          width: 38vw;
          height: 38vw;

          min-width: 220px;
          min-height: 220px;

          top: -12%;
          left: -8%;

          background:
            radial-gradient(
              circle,
              rgba(0,220,255,.16),
              rgba(0,220,255,0) 70%
            );

          animation:
            relayV9OrbA
            8s
            ease-in-out
            infinite;

        }


        .relay-splash
        .relay-v9-orb-b {

          width: 34vw;
          height: 34vw;

          min-width: 200px;
          min-height: 200px;

          right: -8%;
          bottom: -12%;

          background:
            radial-gradient(
              circle,
              rgba(0,120,255,.14),
              rgba(0,120,255,0) 70%
            );

          animation:
            relayV9OrbB
            10s
            ease-in-out
            infinite;

        }


        .relay-splash
        .relay-v9-orb-c {

          width: 24vw;
          height: 24vw;

          min-width: 160px;
          min-height: 160px;

          left: 38%;
          top: 32%;

          background:
            radial-gradient(
              circle,
              rgba(0,238,255,.07),
              rgba(0,238,255,0) 70%
            );

          animation:
            relayV9OrbC
            6s
            ease-in-out
            infinite;

        }


        /* =================================================
           GRID
           ================================================= */

        .relay-splash
        .relay-v9-grid {

          position: absolute;

          inset: 0;

          z-index: 2;

          pointer-events: none;

          opacity: .10;

          background-image:
            linear-gradient(
              rgba(0,220,255,.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(0,220,255,.08) 1px,
              transparent 1px
            );

          background-size:
            80px 80px,
            80px 80px;

          mask-image:
            radial-gradient(
              circle at center,
              black 20%,
              transparent 82%
            );

          animation:
            relayV9Grid
            16s
            linear
            infinite;

        }


        /* =================================================
           VIGNETTE
           ================================================= */

        .relay-splash::after {

          content: "";

          position: absolute;

          inset: 0;

          z-index: 4;

          pointer-events: none;

          background:
            radial-gradient(
              ellipse at center,
              transparent 42%,
              rgba(0,0,0,.06) 58%,
              rgba(0,0,0,.18) 78%,
              rgba(0,0,0,.32) 100%
            );

          box-shadow:
            inset
            0 0
            120px
            rgba(0,0,0,.25);

          opacity: .70;

        }


        /* =================================================
           ENERGY BORDER
           ================================================= */

        .relay-splash
        .relay-v9-energy {

          position: absolute;

          inset: 0;

          z-index: 3;

          pointer-events: none;

          border:
            1px solid
            rgba(0,225,255,.08);

          box-shadow:
            inset
            0 0
            80px
            rgba(0,190,255,.025);

          animation:
            relayV9Energy
            2.8s
            ease-in-out
            infinite;

        }


        /* =================================================
           SPLASH UI
           ================================================= */

        .relay-splash
        .relay-splash-ui {

          position: absolute !important;

          z-index: 10 !important;

          left: 50% !important;

          right: auto !important;

          bottom:
            max(
              28px,
              env(safe-area-inset-bottom) + 18px
            ) !important;

          width:
            min(
              520px,
              calc(100vw - 40px)
            ) !important;

          margin: 0 !important;

          transform:
            translateX(-50%) !important;

        }


        /* =================================================
           ANIMATIONS
           ================================================= */

        @keyframes relayV9Veil {

          0%,100% {
            opacity: .28;
          }

          50% {
            opacity: .42;
          }

        }


        @keyframes relayV9OrbA {

          0%,100% {
            transform:
              translate3d(0,0,0)
              scale(1);

            opacity: .50;
          }

          50% {
            transform:
              translate3d(10vw,8vh,0)
              scale(1.12);

            opacity: .72;
          }

        }


        @keyframes relayV9OrbB {

          0%,100% {
            transform:
              translate3d(0,0,0)
              scale(1);

            opacity: .40;
          }

          50% {
            transform:
              translate3d(-9vw,-7vh,0)
              scale(1.14);

            opacity: .65;
          }

        }


        @keyframes relayV9OrbC {

          0%,100% {
            transform:
              scale(.88);

            opacity: .20;
          }

          50% {
            transform:
              scale(1.20);

            opacity: .42;
          }

        }


        @keyframes relayV9Scan {

          0% {
            transform:
              translateY(-20vh);
          }

          100% {
            transform:
              translateY(720vh);
          }

        }


        @keyframes relayV9Grid {

          0% {
            transform:
              translate3d(0,0,0);
          }

          100% {
            transform:
              translate3d(80px,80px,0);
          }

        }


        @keyframes relayV9Energy {

          0%,100% {
            opacity: .35;
          }

          50% {
            opacity: .65;
          }

        }


        /* =================================================
           MOBILE
           ================================================= */

        @media(max-width:700px) {

          .relay-splash
          .relay-splash-ui {

            position: absolute !important;

            left: 50% !important;

            bottom:
              max(
                18px,
                env(safe-area-inset-bottom) + 12px
              ) !important;

            width:
              calc(
                100vw - 28px
              ) !important;

            margin: 0 !important;

            transform:
              translateX(-50%) !important;

          }


          .relay-splash
          .relay-v9-grid {

            background-size:
              55px 55px,
              55px 55px;

          }


          .relay-splash
          .relay-v9-orb-a {

            width: 60vw;
            height: 60vw;

          }


          .relay-splash
          .relay-v9-orb-b {

            width: 54vw;
            height: 54vw;

          }


          .relay-splash
          .relay-v9-orb-c {

            width: 42vw;
            height: 42vw;

          }


          .relay-splash
          .relay-v9-scan {

            animation-duration:
              4.5s;

          }

        }


        /* =================================================
           REDUCED MOTION
           ================================================= */

        @media(prefers-reduced-motion:reduce) {

          .relay-splash
          .relay-v9-orb,

          .relay-splash
          .relay-v9-scan,

          .relay-splash
          .relay-v9-grid,

          .relay-splash
          .relay-v9-veil,

          .relay-splash
          .relay-v9-energy {

            animation:
              none !important;

          }

        }

      `;


      document.head.appendChild(
        style
      );


      /* =================================================
         AMBIENT
         ================================================= */

      if (
        !splash.querySelector(
          '.relay-v9-ambient'
        )
      ) {

        const ambient =
          document.createElement(
            'div'
          );


        ambient.className =
          'relay-v9-ambient';


        ambient.innerHTML = `

          <div
            class="relay-v9-orb relay-v9-orb-a"
          ></div>

          <div
            class="relay-v9-orb relay-v9-orb-b"
          ></div>

          <div
            class="relay-v9-orb relay-v9-orb-c"
          ></div>

        `;


        splash.prepend(
          ambient
        );

      }


      /* =================================================
         GRID
         ================================================= */

      if (
        !splash.querySelector(
          '.relay-v9-grid'
        )
      ) {

        const grid =
          document.createElement(
            'div'
          );


        grid.className =
          'relay-v9-grid';


        splash.appendChild(
          grid
        );

      }


      /* =================================================
         VEIL
         ================================================= */

      if (
        !splash.querySelector(
          '.relay-v9-veil'
        )
      ) {

        const veil =
          document.createElement(
            'div'
          );


        veil.className =
          'relay-v9-veil';


        splash.appendChild(
          veil
        );

      }


      /* =================================================
         SCAN
         ================================================= */

      if (
        !splash.querySelector(
          '.relay-v9-scan'
        )
      ) {

        const scan =
          document.createElement(
            'div'
          );


        scan.className =
          'relay-v9-scan';


        splash.appendChild(
          scan
        );

      }


      /* =================================================
         ENERGY
         ================================================= */

      if (
        !splash.querySelector(
          '.relay-v9-energy'
        )
      ) {

        const energy =
          document.createElement(
            'div'
          );


        energy.className =
          'relay-v9-energy';


        splash.appendChild(
          energy
        );

      }

    };


  /* =======================================================
     HARDEN SPLASH
     ======================================================= */

  const hardenSplash =
    splash => {

      if (!splash) {
        return;
      }


      const image =
        splash.querySelector(
          '.relay-splash-art, #relaySplashArt'
        );


      splash.style.position =
        'fixed';


      splash.style.inset =
        '0';


      splash.style.width =
        '100dvw';


      splash.style.height =
        '100dvh';


      splash.style.zIndex =
        '2147483647';


      splash.style.display =
        'grid';


      splash.style.opacity =
        '1';


      splash.style.visibility =
        'visible';


      splash.style.pointerEvents =
        'auto';


      splash.style.transform =
        'none';


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
          portrait
            ? 'contain'
            : 'cover';


        image.style.objectPosition =
          'center';


        image.style.opacity =
          '1';


        image.style.transform =
          'none';


        image.style.animation =
          'none';


        image.style.zIndex =
          '1';

      }

    };


  /* =======================================================
     RUN
     ======================================================= */

  const run =
    async () => {

      const splash =
        getSplash();


      /* -----------------------------------------------------
         NO SPLASH
         ----------------------------------------------------- */

      if (!splash) {

        revealHomeForRecovery();

        return;

      }


      /* =====================================================
         FAIL SAFE
         ===================================================== */

      const failOpenTimer =
        window.setTimeout(
          () => {

            if (
              !document.body.contains(
                splash
              )
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
          20000
        );


      const clearFailOpenTimer =
        () =>
          window.clearTimeout(
            failOpenTimer
          );


      /* =====================================================
         INIT
         ===================================================== */

      hardenSplash(
        splash
      );


      installCinematicEffects(
        splash
      );


      const image =
        splash.querySelector(
          '.relay-splash-art, #relaySplashArt'
        );


      const bar =
        splash.querySelector(
          '.relay-splash-progress'
        );


      const pct =
        splash.querySelector(
          '.relay-splash-percent'
        );


      const label =
        splash.querySelector(
          '.relay-splash-status'
        );


      /* =====================================================
         REQUIRED ELEMENT CHECK
         ===================================================== */

      if (
        !image ||
        !bar ||
        !pct ||
        !label
      ) {

        clearFailOpenTimer();


        revealHomeForRecovery();


        splash.remove();


        return;

      }


      let progress = 0;


      /* =====================================================
         PROGRESS BAR
         ===================================================== */

      bar.style.transition =
        'none';


      bar.style.willChange =
        'width, transform';


      /* =====================================================
         SET PROGRESS
         ===================================================== */

      const setProgress =
        (value, text) => {

          progress =
            Math.max(
              progress,
              Math.min(
                100,
                Math.round(value)
              )
            );


          bar.style.width =
            `${progress}%`;


          bar.style.transform =
            'translateZ(0)';


          pct.textContent =
            `${progress}%`;


          if (text) {

            label.textContent =
              text;

          }

        };


      /* =====================================================
         FORCE 100%
         ===================================================== */

      const force100 =
        async () => {

          progress =
            100;


          bar.style.transition =
            'none';


          bar.style.width =
            '100%';


          bar.style.transform =
            'translateZ(0)';


          pct.textContent =
            '100%';


          label.textContent =
            'RELAY ONLINE';


          void bar.offsetWidth;


          await new Promise(
            resolve =>
              requestAnimationFrame(
                () =>
                  requestAnimationFrame(
                    resolve
                  )
              )
          );


          bar.style.width =
            '100%';


          pct.textContent =
            '100%';


          label.textContent =
            'RELAY ONLINE';

        };


      /* =====================================================
         ANIMATE PROGRESS
         ===================================================== */

      const animateTo =
        (
          target,
          text,
          duration
        ) => {

          return new Promise(
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


              const start =
                performance.now();


              const effectiveDuration =
                isCoarseDevice()
                  ? Math.max(
                      120,
                      duration * 0.3
                    )
                  : duration;


              const frame =
                now => {

                  const t =
                    Math.min(
                      1,
                      (
                        now - start
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
                        to - from
                      ) *
                      eased,
                    text
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

                    return;

                  }


                  setProgress(
                    to,
                    text
                  );


                  resolve();

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

        };


      /* =====================================================
         FORCE SPLASH VISIBLE
         ===================================================== */

      splash.classList.remove(
        'is-hidden'
      );


      splash.style.opacity =
        '1';


      splash.style.visibility =
        'visible';


      splash.style.pointerEvents =
        'auto';


      splash.style.transform =
        'none';


      splash.style.filter =
        'none';


      splash.setAttribute(
        'aria-busy',
        'true'
      );


      /* =====================================================
         BOOT SEQUENCE
         ===================================================== */

      setProgress(
        0,
        'INITIALIZING RELAY CORE'
      );


      await sleep(
        350
      );


      await animateTo(
        8,
        'RELAY CORE INITIALIZING',
        700
      );


      await sleep(
        300
      );


      await animateTo(
        26,
        'INTERFACE CORE ONLINE',
        850
      );


      await sleep(
        500
      );


      await animateTo(
        48,
        'GAME SYSTEMS LOADING',
        900
      );


      await sleep(
        500
      );


      await animateTo(
        68,
        'WORLD NETWORK CONNECTING',
        900
      );


      await sleep(
        500
      );


      await animateTo(
        86,
        'HOME SYSTEMS READY',
        800
      );


      await sleep(
        500
      );


      await animateTo(
        100,
        'RELAY ONLINE',
        1000
      );


      await force100();


      /* =====================================================
         HOLD 100%
         ===================================================== */

      const isMobileBoot =
        window.matchMedia?.(
          '(pointer: coarse)'
        ).matches === true;


      await sleep(
        isMobileBoot
          ? 500
          : 850
      );


      /* =====================================================
         PREPARE HOME
         ===================================================== */

      const home =
        getHome();


      if (home) {

        /*
         * Home sits underneath the splash.
         *
         * IMPORTANT:
         * We no longer use 12px blur.
         * We no longer move the page 18px.
         *
         * This creates a clean app-like fade.
         */

        home.classList.remove(
          'hidden'
        );


        home.removeAttribute(
          'hidden'
        );


        home.style.setProperty(
          'display',
          'block',
          'important'
        );


        home.style.setProperty(
          'visibility',
          'visible',
          'important'
        );


        home.style.setProperty(
          'pointer-events',
          'none',
          'important'
        );


        home.style.setProperty(
          'opacity',
          '0',
          'important'
        );


        home.style.setProperty(
          'transform',
          'none',
          'important'
        );


        home.style.setProperty(
          'filter',
          'none',
          'important'
        );

      }


      /* =====================================================
         SOFT HOME FADE
         ===================================================== */

      splash.setAttribute(
        'aria-busy',
        'false'
      );


      /*
       * Short and soft.
       *
       * Desktop:
       * 0.65s
       *
       * Mobile:
       * 0.45s
       */

      const exitDuration =
        isMobileBoot
          ? '0.45s'
          : '0.65s';


      /* =====================================================
         HOME TRANSITION
         ===================================================== */

      if (home) {

        home.style.setProperty(
          'transition',
          [
            `opacity ${exitDuration} ease-out`
          ].join(','),
          'important'
        );

      }


      /* =====================================================
         SPLASH TRANSITION
         ===================================================== */

      splash.style.transition =
        [
          `opacity ${exitDuration} ease-out`
        ].join(',');


      /*
       * Force browser to register the initial state.
       */
      void splash.offsetWidth;


      /* =====================================================
         START FADE
         ===================================================== */

      splash.style.opacity =
        '0';


      /*
       * IMPORTANT:
       *
       * NO:
       * scale()
       * brightness()
       * saturate()
       * blur()
       * black overlay
       *
       * Only opacity changes.
       */


      /* =====================================================
         REVEAL HOME
         ===================================================== */

      if (home) {

        requestAnimationFrame(
          () => {

            home.style.setProperty(
              'opacity',
              '1',
              'important'
            );

          }
        );

      }


      /* =====================================================
         WAIT FOR FADE
         ===================================================== */

      await sleep(
        isMobileBoot
          ? 500
          : 700
      );


      /* =====================================================
         REMOVE SPLASH
         ===================================================== */

      if (
        splash &&
        document.body.contains(
          splash
        )
      ) {

        splash.remove();

      }


      /* =====================================================
         FINAL STATE
         HOME ONLY
         ===================================================== */

      openHomeOnly();


      clearFailOpenTimer();

    };


  /* =======================================================
     START
     ======================================================= */

  run().catch(
    error => {

      console.error(
        '[Relay Runner] Splash boot failed:',
        error
      );


      const splash =
        getSplash();


      /*
       * Recovery:
       *
       * Immediately show Home.
       * No black transition.
       */

      revealHomeForRecovery();


      if (splash) {

        splash.setAttribute(
          'aria-busy',
          'false'
        );


        splash.style.setProperty(
          'transition',
          'none',
          'important'
        );


        splash.style.setProperty(
          'opacity',
          '0',
          'important'
        );


        splash.remove();

      }

    }
  );

})();