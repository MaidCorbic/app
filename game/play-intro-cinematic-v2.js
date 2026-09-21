/* =========================================================
   RELAY RUNNER
   ISOLATED PLAY CINEMATIC V5

   Presentation-only cinematic layer.

   Sequence:
   PLAY
   -> INPUT LOCK
   -> SIGNAL BOOT
   -> SIGNAL ACQUISITION
   -> TITLE REVEAL
   -> TRUE CHARACTER-BY-CHARACTER TYPEWRITER
   -> LIVE CARET / CURSOR
   -> GLITCH
   -> TITLE IMPACT
   -> COPY REVEAL
   -> MISSION CARD
   -> ROUTE LOCK
   -> LAUNCH
   -> RELEASE ORIGINAL PLAY EXACTLY ONCE

   Safety:
   - single instance
   - single listener
   - release lock
   - failsafe
   - cancellation checks
   - no recursive cinematic
   - no gameplay ownership
   ========================================================= */

import './play-intro-cinematic-v2.css';

(() => {
  'use strict';


  /* =========================================================
     SINGLE INSTANCE
     ========================================================= */

  if (window.__relayPlayIntroV5 === true) {
    return;
  }

  window.__relayPlayIntroV5 = true;



  /* =========================================================
     GLOBAL STATE
     ========================================================= */

  let running =
    false;

  let armed =
    false;

  let releasing =
    false;

  let releaseTimer =
    0;


  /* =========================================================
     SETTINGS
     ========================================================= */

  const INTRO_FAILSAFE =
    15000;


  const reducedMotion = () =>
    window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    )?.matches === true;


  /* =========================================================
     WAIT
     ========================================================= */

  const wait = (
    ms,
    isCancelled = () => false
  ) =>
    new Promise(resolve => {

      const duration =
        Math.max(
          0,
          Number(ms) || 0
        );

      if (
        duration === 0 ||
        isCancelled()
      ) {
        resolve();

        return;
      }

      let finished =
        false;

      const finish = () => {

        if (finished) {
          return;
        }

        finished =
          true;

        resolve();
      };

      const timer =
        window.setTimeout(
          finish,
          duration
        );

      if (isCancelled()) {

        window.clearTimeout(
          timer
        );

        finish();
      }

    });


  /* =========================================================
     CLASS RESTART
     ========================================================= */

  const restartClass = (
    element,
    className
  ) => {

    if (!element) {
      return;
    }

    element.classList.remove(
      className
    );

    void element.offsetWidth;

    element.classList.add(
      className
    );
  };


  /* =========================================================
     HTML SETTER
     ========================================================= */

  const setHtml = (
    root,
    selector,
    value
  ) => {

    if (!root) {
      return;
    }

    const node =
      root.querySelector(
        selector
      );

    if (!node) {
      return;
    }

    node.innerHTML =
      String(value ?? '');
  };


  /* =========================================================
     TEXT SETTER
     ========================================================= */

  const setText = (
    root,
    selector,
    value
  ) => {

    if (!root) {
      return;
    }

    const node =
      root.querySelector(
        selector
      );

    if (!node) {
      return;
    }

    node.textContent =
      String(value ?? '');
  };


  /* =========================================================
     MISSION DATA
     ========================================================= */

  const getMissionData = () => {

    const scene =
      window.__relayRunnerScene ||
      window.game?.scene?.getScene?.(
        'runner'
      ) ||
      null;

    const mission =
      scene?.mission ||
      {};

    const missionNumberText =
      document.getElementById(
        'missionNumber'
      )?.textContent || '';

    const missionMatch =
      missionNumberText.match(
        /(\d+)/
      );

    const missionNumber =
      Number(
        missionMatch?.[1] || 1
      );

    const title =
      String(
        mission.title ||
        document.getElementById(
          'objective'
        )?.textContent ||
        'ROOFTOP RELAY'
      ).trim();

    const district =
      String(
        mission.district ||
        document.getElementById(
          'district'
        )?.textContent ||
        'OLD QUARTER'
      ).trim();

    const objective =
      String(
        mission.objective ||
        document.getElementById(
          'worldGoal'
        )?.textContent ||
        'FOLLOW THE RELAY'
      ).trim();

    const signals =
      Array.isArray(
        mission.signals
      )
        ? mission.signals.length
        : Number(
            document.getElementById(
              'signalTotal'
            )?.textContent
          ) || 0;

    return {
      missionNumber,
      title,
      district,
      objective,
      signals
    };
  };


  /* =========================================================
     SIGNAL SYSTEM
     ========================================================= */

  const updateSignal = (
    root,
    status,
    progress
  ) => {

    if (!root) {
      return;
    }

    const statusNode =
      root.querySelector(
        '[data-ric-signal-status]'
      );

    const progressNode =
      root.querySelector(
        '[data-ric-signal-progress]'
      );

    if (statusNode) {

      statusNode.textContent =
        String(
          status ?? ''
        );

      restartClass(
        statusNode,
        'is-pulse'
      );
    }

    if (progressNode) {

      const safeProgress =
        Math.max(
          0,
          Math.min(
            100,
            Number(progress) || 0
          )
        );

      progressNode.style.width =
        `${safeProgress}%`;
    }
  };


  /* =========================================================
     MOVE CARET
     ========================================================= */

  const moveCaret = (
    caret,
    line
  ) => {

    if (
      !caret ||
      !line
    ) {
      return;
    }

    line.appendChild(
      caret
    );
  };


  /* =========================================================
     TRUE TYPEWRITER
     
     The caret physically moves after each
     character. This creates a real terminal-style
     typing effect instead of a static cursor.
     ========================================================= */

  const typewriter = async (
    root,
    lines,
    speed = 42,
    isCancelled = () => false
  ) => {

    const title =
      root.querySelector(
        '[data-ric-title]'
      );

    if (!title) {
      return true;
    }

    const lineNodes =
      [
        ...title.querySelectorAll(
          '[data-ric-line]'
        )
      ];

    const caret =
      title.querySelector(
        '.ric-cursor'
      );

    if (!lineNodes.length) {
      return true;
    }

    title.classList.add(
      'is-typing'
    );

    title.classList.remove(
      'typing-complete'
    );


    /*
     * Glitch positions are calculated
     * independently per line.
     */
    const glitchPositions =
      new Set([
        3,
        7,
        12,
        17,
        22
      ]);


    for (
      let lineIndex = 0;
      lineIndex < lines.length;
      lineIndex++
    ) {

      if (
        isCancelled()
      ) {
        return false;
      }

      const lineNode =
        lineNodes[
          lineIndex
        ];

      if (!lineNode) {
        continue;
      }


      /*
       * Clear old content.
       */
      lineNode.textContent =
        '';


      /*
       * Put cursor at the beginning
       * before typing starts.
       */
      moveCaret(
        caret,
        lineNode
      );


      const text =
        String(
          lines[lineIndex] ?? ''
        );


      for (
        let charIndex = 0;
        charIndex < text.length;
        charIndex++
      ) {

        if (
          isCancelled()
        ) {
          return false;
        }


        const character =
          text[charIndex];


        /*
         * Create actual character node.
         */
        const char =
          document.createElement(
            'span'
          );

        char.className =
          'ric-char';

        char.textContent =
          character === ' '
            ? '\u00A0'
            : character;


        /*
         * Controlled glitch
         * on selected characters.
         */
        if (
          !reducedMotion() &&
          character.trim() &&
          glitchPositions.has(
            charIndex
          )
        ) {

          char.classList.add(
            'ric-char-glitch'
          );
        }


        /*
         * Insert character immediately
         * before the caret.
         */
        lineNode.insertBefore(
          char,
          caret
        );


        /*
         * Move caret after the
         * newly generated character.
         *
         * This is the key difference:
         * the cursor is ALWAYS attached
         * to the typing position.
         */
        moveCaret(
          caret,
          lineNode
        );


        /*
         * Faster rhythm on spaces.
         * Slight variation prevents
         * robotic timing.
         */
        const baseDelay =
          character === ' '
            ? speed * .52
            : speed;

        const glitchDelay =
          char.classList.contains(
            'ric-char-glitch'
          )
            ? Math.min(
                18,
                speed * .28
              )
            : 0;

        await wait(
          Math.max(
            10,
            baseDelay - glitchDelay
          ),
          isCancelled
        );
      }


      /*
       * Hold cursor briefly at end
       * of each line.
       */
      if (
        lineIndex <
        lines.length - 1
      ) {

        await wait(
          reducedMotion()
            ? 20
            : 120,
          isCancelled
        );
      }
    }


    if (
      isCancelled()
    ) {
      return false;
    }


    title.classList.remove(
      'is-typing'
    );

    title.classList.add(
      'typing-complete'
    );


    /*
     * Final caret remains at the
     * very end of the final line.
     */
    const finalLine =
      lineNodes[
        lineNodes.length - 1
      ];

    if (
      finalLine &&
      caret
    ) {
      moveCaret(
        caret,
        finalLine
      );
    }


    return true;
  };


  /* =========================================================
     TITLE IMPACT
     ========================================================= */

  const titleImpact = async (
    root,
    isCancelled = () => false
  ) => {

    if (
      isCancelled()
    ) {
      return;
    }

    const title =
      root.querySelector(
        '[data-ric-title]'
      );

    const flash =
      root.querySelector(
        '[data-ric-flash]'
      );

    if (!title) {
      return;
    }


    restartClass(
      title,
      'ric-title-impact'
    );


    if (
      flash &&
      !reducedMotion()
    ) {

      restartClass(
        flash,
        'micro'
      );
    }


    await wait(
      reducedMotion()
        ? 20
        : 230,
      isCancelled
    );
  };


  /* =========================================================
     BUILD
     ========================================================= */

  const build = () => {

    const existing =
      document.getElementById(
        'relayPlayCinematic'
      );

    if (existing) {
      existing.remove();
    }


    const root =
      document.createElement(
        'section'
      );

    root.id =
      'relayPlayCinematic';

    root.className =
      'ric-root';

    root.setAttribute(
      'aria-hidden',
      'true'
    );

    root.dataset.ricVersion =
      '5.0.0';


    const mission =
      getMissionData();


    root.innerHTML = `
      <div
        class="ric-art"
        aria-hidden="true"
      ></div>

      <div
        class="ric-grid"
        aria-hidden="true"
      ></div>

      <div
        class="ric-scan"
        aria-hidden="true"
      ></div>

      <div
        class="ric-noise"
        aria-hidden="true"
      ></div>

      <div
        class="ric-signal-sweep"
        aria-hidden="true"
      ></div>


      <div
        class="ric-corners"
        aria-hidden="true"
      >
        <span class="ric-corner ric-corner-tl"></span>
        <span class="ric-corner ric-corner-tr"></span>
        <span class="ric-corner ric-corner-bl"></span>
        <span class="ric-corner ric-corner-br"></span>
      </div>


      <div
        class="ric-topbar"
        aria-hidden="true"
      >

        <span class="ric-topbar-left">
          RELAY NETWORK
        </span>

        <span class="ric-topbar-center">
          SECURE CHANNEL
        </span>

        <span class="ric-topbar-right">
          NODE 07
        </span>

      </div>


      <div
        class="ric-signal-panel"
        data-ric-signal-panel
        aria-hidden="true"
      >

        <div
          class="ric-signal-header"
        >

          <small>
            SIGNAL ACQUISITION
          </small>

          <strong>
            RELAY NODE // 07
          </strong>

        </div>


        <div
          class="ric-progress"
          aria-hidden="true"
        >

          <i
            data-ric-signal-progress
          ></i>

        </div>


        <span
          class="ric-signal-status"
          data-ric-signal-status
        >
          SEARCHING...
        </span>

      </div>


      <div
        class="ric-side-data ric-side-data-left"
        aria-hidden="true"
      >
        SYSTEM // RELAY NETWORK<br>
        CHANNEL // SECURE
      </div>


      <div
        class="ric-side-data ric-side-data-right"
        aria-hidden="true"
      >
        NODE // 07<br>
        LINK // STANDBY
      </div>


      <div
        class="ric-ui"
        aria-hidden="true"
      >

        <div
          class="ric-center"
        >

          <div
            class="ric-kicker"
            data-ric-kicker
          >
            RELAY RUNNER // NIGHT OPERATIONS
          </div>


          <h2
            class="ric-title"
            data-ric-title
          >

            <span
              class="ric-title-brand"
            >
              RELAY RUNNER
            </span>


            <span
              class="ric-title-line"
              data-ric-line
            ></span>


            <span
              class="ric-title-line ric-title-final"
              data-ric-line
            ></span>


            <span
              class="ric-cursor"
              aria-hidden="true"
            ></span>

          </h2>


          <p
            class="ric-copy"
            data-ric-copy
          ></p>


          <div
            class="ric-mission"
            data-ric-mission
          >

            <div
              class="ric-mission-header"
            >

              <small>
                MISSION ${String(
                  mission.missionNumber
                ).padStart(2,'0')}
              </small>

              <span>
                ACTIVE
              </span>

            </div>


            <b data-ric-mission-title>
              ${mission.title}
            </b>


            <span
              class="ric-mission-objective"
              data-ric-mission-objective
            >
              ${mission.objective}
            </span>


            <div
              class="ric-mission-data"
            >

              <div>
                <small>
                  ROUTE
                </small>

                <strong
                  data-ric-route
                >
                  ${mission.district}
                </strong>
              </div>


              <div>
                <small>
                  SIGNAL
                </small>

                <strong
                  data-ric-signals
                >
                  ${mission.signals > 0
                    ? `${mission.signals} CHANNELS`
                    : 'STABLE'}
                </strong>
              </div>


              <div>
                <small>
                  THREAT
                </small>

                <strong>
                  UNKNOWN
                </strong>
              </div>

            </div>

          </div>

        </div>

      </div>


      <div
        class="ric-flash"
        data-ric-flash
        aria-hidden="true"
      ></div>
    `;


    document.body.appendChild(
      root
    );


    return root;
  };


  /* =========================================================
     RELEASE GAMEPLAY
     ========================================================= */

  const releaseGameplay = (
    button,
    root,
    state
  ) => {

    if (
      !state ||
      state.released ||
      releasing
    ) {
      return;
    }


    if (!button) {

      console.error(
        '[Relay Play Cinematic V5] Start button missing.'
      );

      running =
        false;

      releasing =
        false;

      return;
    }


    state.released =
      true;

    releasing =
      true;


    if (releaseTimer) {

      window.clearTimeout(
        releaseTimer
      );

      releaseTimer =
        0;
    }


    /*
     * Cinematic exit.
     */
    if (root) {

      root.classList.add(
        'is-exiting'
      );

      window.setTimeout(
        () => {

          if (
            root &&
            root.isConnected
          ) {

            root.remove();
          }

        },
        reducedMotion()
          ? 0
          : 620
      );
    }


    button.removeAttribute(
      'aria-busy'
    );


    /*
     * One and only one original
     * gameplay click.
     */
    armed =
      true;

    try {

      button.click();

    } catch (error) {

      console.error(
        '[Relay Play Cinematic V5] Original Play failed:',
        error
      );

    } finally {

      armed =
        false;

      releasing =
        false;

      running =
        false;
    }
  };


  /* =========================================================
     MAIN CINEMATIC
     ========================================================= */

  const run = async button => {

    if (
      running ||
      releasing
    ) {
      return;
    }


    running =
      true;


    const state = {
      released:
        false
    };


    let root =
      null;


    const cancelled = () =>
      state.released;


    try {

      /* =====================================================
         BUILD
         ===================================================== */

      root =
        build();


      if (!root) {

        releaseGameplay(
          button,
          root,
          state
        );

        return;
      }


      const kicker =
        root.querySelector(
          '[data-ric-kicker]'
        );

      const title =
        root.querySelector(
          '[data-ric-title]'
        );

      const copy =
        root.querySelector(
          '[data-ric-copy]'
        );

      const mission =
        root.querySelector(
          '[data-ric-mission]'
        );

      const flash =
        root.querySelector(
          '[data-ric-flash]'
        );


      /* =====================================================
         FAILSAFE
         ===================================================== */

      releaseTimer =
        window.setTimeout(
          () => {

            if (
              !state.released &&
              running &&
              !releasing
            ) {

              console.warn(
                '[Relay Play Cinematic V5] Failsafe release.'
              );

              releaseGameplay(
                button,
                root,
                state
              );
            }

          },
          INTRO_FAILSAFE
        );


      /* =====================================================
         ACTIVATE
         ===================================================== */

      root.classList.add(
        'is-active'
      );

      root.setAttribute(
        'aria-hidden',
        'false'
      );

      button.setAttribute(
        'aria-busy',
        'true'
      );


      /* =====================================================
         PHASE 01
         SIGNAL BOOT
         ===================================================== */

      updateSignal(
        root,
        'SEARCHING...',
        5
      );

      await wait(
        reducedMotion()
          ? 40
          : 220,
        cancelled
      );

      if (cancelled()) {
        return;
      }


      if (kicker) {

        kicker.classList.add(
          'show'
        );
      }


      await wait(
        reducedMotion()
          ? 30
          : 250,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      updateSignal(
        root,
        'RELAY NODE DETECTED',
        24
      );


      await wait(
        reducedMotion()
          ? 30
          : 270,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      updateSignal(
        root,
        'AUTHENTICATING CHANNEL',
        48
      );


      await wait(
        reducedMotion()
          ? 30
          : 300,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      updateSignal(
        root,
        'SIGNAL LOCKED',
        76
      );


      await wait(
        reducedMotion()
          ? 30
          : 250,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      updateSignal(
        root,
        'SIGNAL ACQUIRED',
        100
      );


      await wait(
        reducedMotion()
          ? 30
          : 160,
        cancelled
      );


      /* =====================================================
         PHASE 02
         TITLE REVEAL
         ===================================================== */

      if (title) {

        title.classList.add(
          'show'
        );
      }


      await wait(
        reducedMotion()
          ? 20
          : 180,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      /* =====================================================
         PHASE 03
         TRUE TYPEWRITER
         ===================================================== */

      const typewriterOk =
        await typewriter(
          root,
          [
            'THE NIGHT',
            'IS ONLINE.'
          ],
          reducedMotion()
            ? 4
            : 43,
          cancelled
        );


      if (!typewriterOk) {
        return;
      }


      /* =====================================================
         PHASE 04
         TITLE IMPACT
         ===================================================== */

      await titleImpact(
        root,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      /* =====================================================
         PHASE 05
         COPY
         ===================================================== */

      setHtml(
        root,
        '[data-ric-copy]',
        'THE CITY IS SLEEPING.<br>' +
        'THE NETWORK IS NOT.<br>' +
        '<strong>ONE RUNNER. ONE SIGNAL. NO SECOND CHANCE.</strong>'
      );


      if (copy) {

        copy.classList.add(
          'show'
        );
      }


      updateSignal(
        root,
        'CHANNEL STABLE',
        100
      );


      await wait(
        reducedMotion()
          ? 40
          : 520,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      /* =====================================================
         PHASE 06
         MISSION CARD
         ===================================================== */

      if (mission) {

        mission.classList.add(
          'show'
        );
      }


      await wait(
        reducedMotion()
          ? 50
          : 600,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      /* =====================================================
         PHASE 07
         ROUTE LOCK
         ===================================================== */

      updateSignal(
        root,
        'ROUTE LOCKED',
        100
      );


      await wait(
        reducedMotion()
          ? 40
          : 340,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      setHtml(
        root,
        '[data-ric-copy]',
        'ROOFTOP ROUTE LOCKED.<br>' +
        '<strong>DELIVERY WINDOW OPEN.</strong>'
      );


      await wait(
        reducedMotion()
          ? 40
          : 450,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      /* =====================================================
         PHASE 08
         FINAL LINK
         ===================================================== */

      updateSignal(
        root,
        'MISSION LINK STABLE',
        100
      );


      await wait(
        reducedMotion()
          ? 40
          : 400,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      /* =====================================================
         PHASE 09
         LAUNCH FLASH
         ===================================================== */

      if (flash) {

        restartClass(
          flash,
          'fire'
        );
      }


      root.classList.add(
        'launch'
      );


      await wait(
        reducedMotion()
          ? 40
          : 190,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      root.classList.add(
        'is-exiting'
      );


      await wait(
        reducedMotion()
          ? 30
          : 540,
        cancelled
      );


      if (cancelled()) {
        return;
      }


      /* =====================================================
         PHASE 10
         RELEASE ORIGINAL GAMEPLAY
         ===================================================== */

      releaseGameplay(
        button,
        root,
        state
      );


    } catch (error) {

      console.error(
        '[Relay Play Cinematic V5]',
        error
      );


      releaseGameplay(
        button,
        root,
        state
      );
    }
  };


  /* =========================================================
     PLAY CAPTURE
     ========================================================= */

  const capturePlay = event => {

    const target =
      event.target;


    const button =
      target?.closest?.(
        '#start'
      );


    if (!button) {
      return;
    }


    /*
     * Do not intercept a deployment
     * loader handoff.
     */
    if (
      window.relayPlayDeploymentV1 &&
      typeof
        window.relayPlayDeploymentV1
          .isActive ===
        'function' &&
      window.relayPlayDeploymentV1
        .isActive()
    ) {
      return;
    }


    /*
     * Original gameplay release.
     */
    if (armed) {
      return;
    }


    /*
     * Prevent duplicate starts.
     */
    if (
      running ||
      releasing
    ) {

      event.preventDefault();
      event.stopImmediatePropagation();

      return;
    }


    /*
     * Take ownership of the
     * initial click.
     */
    event.preventDefault();
    event.stopImmediatePropagation();


    void run(
      button
    );
  };


  /* =========================================================
     LISTENER
     ========================================================= */

  document.addEventListener(
    'click',
    capturePlay,
    true
  );


  /* =========================================================
     DEBUG STATE
     ========================================================= */

  window.__relayPlayIntroV5State =
    () => ({

      running,

      armed,

      releasing,

      hasReleaseTimer:
        Boolean(
          releaseTimer
        ),

      cinematic:
        Boolean(
          document.getElementById(
            'relayPlayCinematic'
          )
        )
    });

})();