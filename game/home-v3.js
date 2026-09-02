/* Home V3: presentation shell only; gameplay remains owned by main.js. */
(() => {
  if (window.__relayHomeV3) return;
  window.__relayHomeV3 = true;

  const $ = id => document.getElementById(id);

  const homeVisible = () =>
    !!$('intro') &&
    !$('intro').classList.contains('hidden');

  /*
   * Trigger original game buttons without duplicating
   * their actual gameplay logic.
   */
  const nativeClick = selector => {
    const target = document.querySelector(selector);

    if (!target) return false;

    HTMLElement.prototype.click.call(target);
    return true;
  };

  /*
   * ============================================================
   * HOME V3 INTERACTION STYLES
   * ============================================================
   */
  const injectStyles = () => {
    if (document.getElementById('home-v3-interaction-style')) return;

    const style = document.createElement('style');

    style.id = 'home-v3-interaction-style';

    style.textContent = `
      /* --------------------------------------------------------
         Hide original gameplay canvas while HOME is visible.
         main.js still owns the real gameplay surface.
      -------------------------------------------------------- */

      body.home-v3-active #play {
        display: block !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: fixed !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 0 !important;
      }

      body.home-v3-active #phaser-game {
        display: block !important;
        visibility: hidden !important;
        opacity: 0 !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 1px !important;
        min-height: 1px !important;
      }

      /* --------------------------------------------------------
         PLAY BUTTON
      -------------------------------------------------------- */

      .home-v3-play {
        position: relative;
        overflow: hidden;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        cursor: grab;
      }

      .home-v3-play:active {
        cursor: grabbing;
      }

      .home-v3-play .home-v3-play-track {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: .46;
        background:
          linear-gradient(
            90deg,
            transparent 0 6%,
            rgba(255,255,255,.07) 48%,
            transparent 100%
          );
        animation: homeV3PlaySweep 2.8s ease-in-out infinite;
      }

      .home-v3-play .home-v3-play-fill {
        position: absolute;
        inset: 0 auto 0 0;
        width: 0;
        background:
          linear-gradient(
            90deg,
            rgba(255,255,255,.03),
            rgba(255,208,110,.34)
          );
        pointer-events: none;
        transition: width .08s linear;
      }

      .home-v3-play .home-v3-play-label {
        position: relative;
        z-index: 3;
        display: block;
        padding-left: 42px;
        pointer-events: none;
      }

      .home-v3-play .home-v3-play-hint {
        position: absolute;
        right: 18px;
        top: 50%;
        z-index: 3;
        transform: translateY(-50%);
        color: rgba(255,248,226,.72);
        font:
          800 8px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;
        letter-spacing: .16em;
        pointer-events: none;
        transition: opacity .18s ease;
      }

      .home-v3-play .home-v3-play-knob {
        position: absolute;
        left: 7px;
        top: 50%;
        z-index: 4;
        width: 42px;
        height: 42px;
        margin-top: -21px;
        border: 1px solid rgba(255,255,255,.62);
        border-radius: 12px;
        background:
          linear-gradient(
            145deg,
            #fff5d0,
            #ffd06e
          );
        color: #08111b;
        display: grid;
        place-items: center;
        font:
          950 15px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;
        box-shadow:
          0 0 22px rgba(255,208,110,.32),
          inset 0 1px rgba(255,255,255,.88);
        transform: translateX(0);
        transition:
          transform .08s linear,
          box-shadow .16s ease;
      }

      .home-v3-play .home-v3-play-knob::after {
        content: "";
        position: absolute;
        inset: -5px;
        border: 1px solid rgba(255,208,110,.17);
        border-radius: 15px;
        animation:
          homeV3PlayPulse
          1.8s
          ease-in-out
          infinite;
      }

      .home-v3-play.is-dragging .home-v3-play-knob {
        box-shadow:
          0 0 34px rgba(255,208,110,.74),
          inset 0 1px rgba(255,255,255,.95);
      }

      .home-v3-play.is-armed .home-v3-play-fill {
        width: 100% !important;
      }

      .home-v3-play.is-armed .home-v3-play-hint {
        opacity: 0;
      }

      .home-v3-play.is-armed {
        cursor: progress;
      }

      .home-v3-play.is-locked {
        pointer-events: none;
        filter: saturate(.9);
        opacity: .78;
      }

      .home-v3-play:focus-visible {
        outline: 2px solid rgba(255,208,110,.9);
        outline-offset: 3px;
      }

      /* --------------------------------------------------------
         HOME LEGACY SURFACES
         
         These are intentionally disabled.
         They are the source of duplicate HOME controls.
      -------------------------------------------------------- */

      #intro .main-menu,
      #intro .info-launcher,
      #intro [data-safe-home="faq"],
      #intro [data-safe-home="update"],
      #intro [data-v3-faq],
      #intro [data-v3-update],
      #intro [data-v3-options],
      #intro [data-v3-exit],
      #intro .relay-home-nav-card,
      #intro .relay-v4-home-btn {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      /* --------------------------------------------------------
         TUTORIAL SURFACES
      -------------------------------------------------------- */

      .home-v3-shell [data-v3-tutorial],
      #intro [data-title-panel="tutorial"],
      #intro .home-tutorial-button {
        display: none !important;
      }

      #titlePanelContent
        [data-unified-toggle="tutorialEnabled"],
      #titlePanelContent
        .relay-option-card:has(
          [data-unified-toggle="tutorialEnabled"]
        ) {
        display: none !important;
      }

      /* --------------------------------------------------------
         ANIMATIONS
      -------------------------------------------------------- */

      @keyframes homeV3PlaySweep {
        0%,
        100% {
          transform: translateX(-18%);
          opacity: .1;
        }

        50% {
          transform: translateX(18%);
          opacity: .38;
        }
      }

      @keyframes homeV3PlayPulse {
        0%,
        100% {
          transform: scale(.92);
          opacity: .25;
        }

        50% {
          transform: scale(1.05);
          opacity: .75;
        }
      }

      /* --------------------------------------------------------
         MOBILE
      -------------------------------------------------------- */

      @media (max-width: 700px) {
        .home-v3-play {
          min-height: 64px;
        }

        .home-v3-play .home-v3-play-knob {
          left: 6px;
          width: 40px;
          height: 40px;
          margin-top: -20px;
          border-radius: 11px;
        }

        .home-v3-play .home-v3-play-label {
          padding-left: 38px;
        }

        .home-v3-play .home-v3-play-hint {
          right: 13px;
          font-size: 7px;
          letter-spacing: .11em;
        }
      }

      /* --------------------------------------------------------
         REDUCED MOTION
      -------------------------------------------------------- */

      @media (prefers-reduced-motion: reduce) {
        .home-v3-play .home-v3-play-track,
        .home-v3-play .home-v3-play-knob::after {
          animation: none;
        }

        .home-v3-play .home-v3-play-knob {
          transition: none;
        }
      }
    `;

    document.head.appendChild(style);
  };

  /*
   * ============================================================
   * HOME SURFACE STATE
   * ============================================================
   */
  const syncSurface = () => {
    const visible = homeVisible();

    document.body.classList.toggle(
      'home-v3-active',
      visible
    );

    const intro = $('intro');

    if (intro) {
      intro.classList.toggle(
        'home-v3',
        visible
      );
    }
  };

  /*
   * ============================================================
   * REMOVE TUTORIAL / OLD HOME ELEMENTS
   * ============================================================
   */
  const removeTutorialSurface = () => {
    document
      .querySelectorAll(
        '#intro [data-title-panel="tutorial"],' +
        '#intro .home-tutorial-button,' +
        '#intro [data-v3-tutorial]'
      )
      .forEach(node => node.remove());

    document
      .querySelectorAll(
        '#titlePanelContent ' +
        '[data-unified-toggle="tutorialEnabled"]'
      )
      .forEach(node => {
        node
          .closest('.relay-option-card')
          ?.remove();
      });
  };

  /*
   * ============================================================
   * REMOVE LEGACY HOME NAV
   *
   * This is important.
   *
   * The old version found:
   *
   *   .main-menu
   *   .info-launcher
   *
   * and then inserted them again with:
   *
   *   intro.replaceChildren(
   *     bg,
   *     shell,
   *     legacyMenu,
   *     launcher
   *   );
   *
   * That reintroduced the old FAQ / UPDATE buttons.
   *
   * We now explicitly remove those surfaces.
   * ============================================================
   */
  const removeLegacyHomeSurfaces = intro => {
    if (!intro) return;

    intro
      .querySelectorAll(
        '.main-menu,' +
        '.info-launcher,' +
        '[data-safe-home="faq"],' +
        '[data-safe-home="update"],' +
        '[data-v3-faq],' +
        '[data-v3-update],' +
        '[data-v3-options],' +
        '[data-v3-exit],' +
        '.relay-home-nav-card,' +
        '.relay-v4-home-btn'
      )
      .forEach(node => node.remove());
  };

  /*
   * ============================================================
   * SWIPE PLAY
   * ============================================================
   */
  const installSwipePlay = button => {
    if (!button || button.dataset.swipeReady === '1') {
      return;
    }

    button.dataset.swipeReady = '1';

    button.setAttribute(
      'aria-label',
      'Swipe to deploy and start the game'
    );

    button.setAttribute(
      'aria-keyshortcuts',
      'Swipe'
    );

    button.innerHTML = `
      <span
        class="home-v3-play-track"
        aria-hidden="true"
      ></span>

      <span
        class="home-v3-play-fill"
        aria-hidden="true"
      ></span>

      <span class="home-v3-play-label">
        PLAY NOW
      </span>

      <span
        class="home-v3-play-hint"
      >
        SWIPE TO DEPLOY →
      </span>

      <span
        class="home-v3-play-knob"
        aria-hidden="true"
      >
        →
      </span>
    `;

    let pointerId = null;
    let startX = 0;
    let completed = false;
    let maxTravel = 0;

    /*
     * Calculate how far the knob can travel.
     */
    const updateMetrics = () => {
      const rect =
        button.getBoundingClientRect();

      const knob =
        button.querySelector(
          '.home-v3-play-knob'
        );

      const knobWidth =
        knob?.getBoundingClientRect().width ||
        42;

      maxTravel = Math.max(
        1,
        rect.width -
          knobWidth -
          14
      );

      return maxTravel;
    };

    /*
     * Reset unfinished swipe.
     */
    const reset = () => {
      if (completed) return;

      pointerId = null;

      button.classList.remove(
        'is-dragging'
      );

      const knob =
        button.querySelector(
          '.home-v3-play-knob'
        );

      const fill =
        button.querySelector(
          '.home-v3-play-fill'
        );

      if (knob) {
        knob.style.transform =
          'translateX(0)';
      }

      if (fill) {
        fill.style.width = '0%';
      }
    };

    /*
     * Complete PLAY.
     *
     * We DO NOT implement game start here.
     * We call the existing #start button.
     */
    const complete = () => {
      if (completed) return;

      completed = true;
      pointerId = null;

      button.classList.remove(
        'is-dragging'
      );

      button.classList.add(
        'is-armed',
        'is-locked'
      );

      const max =
        updateMetrics();

      const knob =
        button.querySelector(
          '.home-v3-play-knob'
        );

      const fill =
        button.querySelector(
          '.home-v3-play-fill'
        );

      if (fill) {
        fill.style.width = '100%';
      }

      if (knob) {
        knob.style.transform =
          `translateX(${max}px)`;
      }

      /*
       * Let the visual animation finish,
       * then trigger the original game start.
       */
      window.setTimeout(() => {
        nativeClick('#start');
      }, 180);
    };

    /*
     * Pointer down
     */
    button.addEventListener(
      'pointerdown',
      event => {
        if (completed) return;

        pointerId =
          event.pointerId;

        startX =
          event.clientX;

        updateMetrics();

        button.setPointerCapture?.(
          pointerId
        );

        button.classList.add(
          'is-dragging'
        );

        event.preventDefault();
        event.stopPropagation();
      },
      {
        passive: false
      }
    );

    /*
     * Pointer move
     */
    button.addEventListener(
      'pointermove',
      event => {
        if (
          event.pointerId !== pointerId ||
          completed
        ) {
          return;
        }

        const max =
          updateMetrics();

        const knob =
          button.querySelector(
            '.home-v3-play-knob'
          );

        const fill =
          button.querySelector(
            '.home-v3-play-fill'
          );

        const distance =
          Math.max(
            0,
            Math.min(
              max,
              event.clientX -
                startX
            )
          );

        const percent =
          distance / max;

        if (knob) {
          knob.style.transform =
            `translateX(${distance}px)`;
        }

        if (fill) {
          fill.style.width =
            `${percent * 100}%`;
        }

        /*
         * 84% = successful swipe.
         */
        if (percent >= 0.84) {
          complete();
        }

        event.preventDefault();
        event.stopPropagation();
      },
      {
        passive: false
      }
    );

    /*
     * Pointer up
     */
    button.addEventListener(
      'pointerup',
      event => {
        if (
          event.pointerId !== pointerId ||
          completed
        ) {
          return;
        }

        button.releasePointerCapture?.(
          event.pointerId
        );

        reset();

        event.preventDefault();
        event.stopPropagation();
      },
      {
        passive: false
      }
    );

    /*
     * Cancel / lost capture
     */
    button.addEventListener(
      'pointercancel',
      reset
    );

    button.addEventListener(
      'lostpointercapture',
      reset
    );

    /*
     * Prevent normal click from starting
     * the game accidentally.
     */
    button.addEventListener(
      'click',
      event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    );

    /*
     * Keyboard interaction is intentionally
     * blocked because this control is swipe-based.
     */
    button.addEventListener(
      'keydown',
      event => {
        if (
          event.key === 'Enter' ||
          event.code === 'Space'
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
    );
  };

  /*
   * ============================================================
   * BUILD HOME V3
   * ============================================================
   */
  const build = () => {
    const intro = $('intro');

    if (
      !intro ||
      intro.dataset.homeV3Built === '1'
    ) {
      return;
    }

    intro.dataset.homeV3Built = '1';

    intro.classList.add('home-v3');

    /*
     * IMPORTANT:
     *
     * Do NOT keep .main-menu or .info-launcher.
     *
     * Those were the legacy HOME surfaces
     * responsible for duplicate FAQ / UPDATE /
     * old navigation controls.
     */
    removeLegacyHomeSurfaces(intro);

    /*
     * ----------------------------------------------------------
     * Background
     * ----------------------------------------------------------
     */
    const bg =
      document.createElement('div');

    bg.className = 'home-v3-bg';

    bg.setAttribute(
      'aria-hidden',
      'true'
    );

    bg.innerHTML = `
      <i class="home-v3-grid"></i>
      <i class="home-v3-glow"></i>
      <i class="home-v3-scan"></i>
    `;

    /*
     * ----------------------------------------------------------
     * HOME shell
     *
     * ONLY PLAY + CONTINUE.
     *
     * No OPTIONS.
     * No FAQ.
     * No UPDATE.
     * No EXIT.
     * ----------------------------------------------------------
     */
    const shell =
      document.createElement('div');

    shell.className =
      'home-v3-shell';

    shell.innerHTML = `
      <header class="home-v3-header">

        <div class="home-v3-brand">
          <span class="home-v3-mark">
            R/
          </span>

          <span>
            RUNNER RELAY
          </span>
        </div>

        <div class="home-v3-status">
          <b>
            ● SYSTEM READY
          </b>

          <br>

          NIGHT SHIFT · ONLINE
        </div>

      </header>

      <main class="home-v3-main">

        <section>

          <p class="home-v3-kicker">
            ROOFTOP DELIVERY NETWORK · CHAPTER 01
          </p>

          <h1 class="home-v3-title">
            RUNNER<em>RELAY</em>
          </h1>

          <p class="home-v3-copy">
            Run the sleeping city.
            Carry the signal farther
            than anyone else can.
            Build your route,
            master the night
            and keep the line open.
          </p>

          <div class="home-v3-actions">

            <button
              class="home-v3-play"
              type="button"
              data-v3-play
            ></button>

            <button
              class="home-v3-continue"
              type="button"
              data-v3-continue
              hidden
            >
              CONTINUE
            </button>

          </div>

        </section>

      </main>

      <footer class="home-v3-footer">

        <span>
          RELAY RUNNER ·
          <b>VERSION 1.1.0</b>
        </span>

        <span>
          A / D MOVE ·
          SPACE JUMP ·
          ESC PAUSE
        </span>

      </footer>
    `;

    /*
     * ----------------------------------------------------------
     * CRITICAL:
     *
     * Only bg + shell are inserted.
     *
     * We DO NOT insert:
     *
     *   legacyMenu
     *   launcher
     *
     * This is what prevents the old FAQ / UPDATE buttons
     * from coming back.
     * ----------------------------------------------------------
     */
    intro.replaceChildren(
      bg,
      shell
    );

    /*
     * ----------------------------------------------------------
     * PLAY
     * ----------------------------------------------------------
     */
    installSwipePlay(
      shell.querySelector(
        '[data-v3-play]'
      )
    );

    /*
     * ----------------------------------------------------------
     * CONTINUE
     *
     * Continue still uses the original
     * #continue gameplay/save logic.
     * ----------------------------------------------------------
     */
    const continueButton =
      shell.querySelector(
        '[data-v3-continue]'
      );

    if (continueButton) {
      let handledAt = 0;

      const activateContinue = event => {
        const now =
          performance.now();

        if (
          now - handledAt < 260
        ) {
          return;
        }

        handledAt = now;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        nativeClick('#continue');
      };

      continueButton.addEventListener(
        'pointerup',
        activateContinue,
        {
          passive: false
        }
      );

      continueButton.addEventListener(
        'click',
        activateContinue
      );
    }

    /*
     * ----------------------------------------------------------
     * SYNC CONTINUE VISIBILITY
     *
     * The real #continue button remains owned by
     * the existing game code.
     * ----------------------------------------------------------
     */
    const syncContinue = () => {
      const legacy =
        $('continue');

      const button =
        shell.querySelector(
          '[data-v3-continue]'
        );

      if (
        !legacy ||
        !button
      ) {
        return;
      }

      button.hidden =
        legacy.classList.contains(
          'hidden'
        ) ||
        getComputedStyle(
          legacy
        ).display === 'none';
    };

    syncContinue();

    if ($('continue')) {
      new MutationObserver(
        syncContinue
      ).observe(
        $('continue'),
        {
          attributes: true,
          attributeFilter: [
            'class',
            'style',
            'hidden'
          ]
        }
      );
    }
  };

  /*
   * ============================================================
   * START
   * ============================================================
   */
  const start = () => {
    injectStyles();

    build();

    removeTutorialSurface();

    removeLegacyHomeSurfaces(
      $('intro')
    );

    syncSurface();

    /*
     * Watch for other scripts trying to recreate
     * old HOME controls.
     */
    const observer =
      new MutationObserver(() => {
        syncSurface();

        removeTutorialSurface();

        /*
         * If another script adds the old FAQ /
         * UPDATE / main-menu back, remove it again.
         */
        removeLegacyHomeSurfaces(
          $('intro')
        );
      });

    observer.observe(
      document.body,
      {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
          'class',
          'style',
          'hidden'
        ]
      }
    );
  };

  /*
   * ============================================================
   * BOOT
   * ============================================================
   */
  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      start,
      {
        once: true
      }
    );
  } else {
    start();
  }
})();
