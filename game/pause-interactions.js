/* ============================================================
   RELAY RUNNER — MOBILE IN-GAME HUD
   PAUSE + SETTINGS
   Safe pause routing / no synthetic tab clicks
   ============================================================ */

(() => {
  'use strict';

  const PORTRAIT_GUARD_STYLE_ID =
    'mobile-portrait-hud-rotate-style';

  const HUD_ID = 'mobileBottomHud';

  const isTouchDevice = () =>
    document.body?.classList.contains('is-touch') === true;

  const getElement = id =>
    document.getElementById(id);

  const isVisible = id => {
    const element = getElement(id);

    return !!element &&
      !element.classList.contains('hidden');
  };

  /* =========================================================
     PORTRAIT GUARD
     ========================================================= */

  const installPortraitGuardStyle = () => {
    if (getElement(PORTRAIT_GUARD_STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');

    style.id = PORTRAIT_GUARD_STYLE_ID;

    style.textContent = `
      /* =======================================================
         MOBILE PORTRAIT GUARD
         ======================================================= */

      @media (pointer: coarse) and (orientation: portrait) {

        html body.is-touch #cargoIntegrityV2,
        html body.is-touch #play .hud-xp,
        html body.is-touch #play #pause,
        html body.is-touch #mobileBottomHud .mobile-menu-pause {

          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        html body.is-touch .mobile-rotate-prompt.is-active {

          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      }


      /* =======================================================
         MOBILE CARGO GUARD
         ======================================================= */

      @media
        (pointer: coarse)
        and (max-width: 900px)
        and (max-height: 600px),
        (pointer: coarse)
        and (max-width: 600px)
        and (max-height: 900px) {

        html body.is-touch #cargoIntegrityV2 {

          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      }


      /* =======================================================
         ROTATE PROMPT
         ======================================================= */

      .mobile-rotate-prompt {

        position: fixed;
        inset: 0;

        z-index: 10000;

        display: none;

        align-items: center;
        justify-content: center;

        flex-direction: column;

        gap: 10px;

        padding: 24px;

        box-sizing: border-box;

        text-align: center;

        pointer-events: none;

        user-select: none;
        -webkit-user-select: none;

        color: #eaffff;

        font:
          950 clamp(16px, 4.4vw, 24px) / 1.05
          "DM Mono",
          ui-monospace,
          monospace;

        letter-spacing: .18em;

        text-shadow:
          0 0 8px rgba(141, 244, 255, .55),
          0 0 24px rgba(141, 244, 255, .28),
          0 0 40px rgba(255, 208, 110, .14);

        background:
          radial-gradient(
            circle at center,
            rgba(8, 28, 42, .34),
            rgba(1, 5, 10, .72) 60%,
            rgba(0, 0, 0, .86)
          );

        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);

        opacity: 0;
        visibility: hidden;
      }


      .mobile-rotate-prompt::before {

        content: "";

        width: 42px;
        height: 28px;

        border:
          2px solid
          rgba(141, 244, 255, .84);

        border-radius: 6px;

        box-shadow:
          0 0 14px rgba(141, 244, 255, .28),
          0 0 26px rgba(255, 208, 110, .10);

        transform: rotate(90deg);

        opacity: .92;
      }


      .mobile-rotate-prompt::after {

        content: "LANDSCAPE MODE";

        color: #ffd06e;

        font:
          900 8px / 1
          "DM Mono",
          ui-monospace,
          monospace;

        letter-spacing: .22em;

        opacity: .74;
      }


      /* =======================================================
         REDUCED MOTION
         ======================================================= */

      @media (prefers-reduced-motion: reduce) {

        .mobile-rotate-prompt {
          transition: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  };


  /* =========================================================
     SAFE PAUSE ROUTER
     ========================================================= */

  const getPauseApi = () => {

    const api =
      window.relayUnifiedCinematicUI;

    if (
      api &&
      typeof api.openPause === 'function'
    ) {
      return api;
    }

    return null;
  };


  const openPause = tabName => {

    const pauseMenu =
      getElement('pauseMenu');

    if (!pauseMenu) {
      console.warn(
        '[RelayRunner] pauseMenu not found'
      );

      return;
    }


    /*
     * IMPORTANT:
     *
     * Never use:
     *
     *   pause.click()
     *   tab.click()
     *
     * Those can trigger multiple global click
     * handlers and create duplicate pause routing.
     */


    const api = getPauseApi();

    if (api) {

      try {

        api.openPause(
          tabName || 'resume'
        );

        return;

      } catch (error) {

        console.error(
          '[RelayRunner] Unified pause UI failed:',
          error
        );

      }
    }


    /*
     * Minimal safe fallback.
     *
     * We only expose the pause menu.
     * Phaser pause/resume remains owned by
     * p1-gameplay-correctness-v1.js.
     */

    pauseMenu.classList.remove('hidden');

    pauseMenu.setAttribute(
      'aria-hidden',
      'false'
    );


    /*
     * Do not manually click a tab here.
     *
     * If the canonical UI is unavailable,
     * leaving the menu open is safer than
     * invoking another global click chain.
     */

  };


  /* =========================================================
     CLOSE PAUSE SAFELY
     ========================================================= */

  const closePause = () => {

    const pauseMenu =
      getElement('pauseMenu');

    if (!pauseMenu) {
      return;
    }


    /*
     * Prefer canonical API if available.
     */

    const api = getPauseApi();

    if (
      api &&
      typeof api.hidePause === 'function'
    ) {

      try {

        api.hidePause();

        return;

      } catch (error) {

        console.error(
          '[RelayRunner] Unified pause close failed:',
          error
        );

      }
    }


    /*
     * Safe DOM fallback.
     */

    pauseMenu.classList.add('hidden');

    pauseMenu.setAttribute(
      'aria-hidden',
      'true'
    );

  };


  /* =========================================================
     INSTALL MOBILE HUD
     ========================================================= */

  const install = () => {

    installPortraitGuardStyle();


    const pause =
      getElement('pause');

    const pauseMenu =
      getElement('pauseMenu');

    const panel =
      pauseMenu?.querySelector(
        '#panelContent'
      );


    /*
     * Do not create the mobile HUD until
     * the canonical game shell exists.
     */

    if (
      !pause ||
      !pauseMenu ||
      !panel
    ) {

      return false;

    }


    /*
     * Prevent gameplay pointer handlers from
     * receiving pointer events originating
     * inside pause controls.
     */

    if (
      !panel.dataset.mobilePausePointerGuard
    ) {

      panel.dataset.mobilePausePointerGuard =
        'true';

      panel.addEventListener(
        'pointerdown',
        event => {

          const target =
            event.target instanceof Element
              ? event.target
              : null;

          if (
            target?.closest(
              'button, input, select, textarea, a'
            )
          ) {

            event.stopPropagation();

          }

        }
      );

    }


    /*
     * Already installed.
     */

    if (
      getElement(HUD_ID)
    ) {

      return true;

    }


    /* =======================================================
       MOBILE BOTTOM HUD
       ======================================================= */

    const hud =
      document.createElement('div');

    hud.id =
      HUD_ID;

    hud.className =
      'mobile-bottom-hud';


    hud.innerHTML = `

      <button
        id="mobilePauseButton"
        class="mobile-menu-button mobile-menu-pause"
        type="button"
        aria-label="Pause"
      >
        <span aria-hidden="true">Ⅱ</span>
        <small>PAUSE</small>
      </button>


      <button
        id="mobileSettingsButton"
        class="mobile-menu-button mobile-menu-settings"
        type="button"
        aria-label="Settings"
      >
        <span aria-hidden="true">⚙</span>
        <small>SETTINGS</small>
      </button>

    `;


    document.body.appendChild(hud);


    /* =======================================================
       ROTATE PROMPT
       ======================================================= */

    let rotatePrompt =
      getElement('mobileRotatePrompt');


    if (!rotatePrompt) {

      rotatePrompt =
        document.createElement('div');

      rotatePrompt.id =
        'mobileRotatePrompt';

      rotatePrompt.className =
        'mobile-rotate-prompt';

      rotatePrompt.setAttribute(
        'role',
        'status'
      );

      rotatePrompt.setAttribute(
        'aria-live',
        'polite'
      );

      rotatePrompt.textContent =
        'ROTATE YOUR DEVICE';

      document.body.appendChild(
        rotatePrompt
      );

    }


    /* =======================================================
       PAUSE BUTTON
       ======================================================= */

    const mobilePauseButton =
      getElement('mobilePauseButton');


    mobilePauseButton?.addEventListener(
      'click',
      event => {

        event.preventDefault();
        event.stopPropagation();

        openPause('resume');

      },
      {
        passive: false
      }
    );


    /* =======================================================
       SETTINGS BUTTON
       ======================================================= */

    const mobileSettingsButton =
      getElement('mobileSettingsButton');


    mobileSettingsButton?.addEventListener(
      'click',
      event => {

        event.preventDefault();
        event.stopPropagation();

        openPause('settings');

      },
      {
        passive: false
      }
    );


    /* =======================================================
       ESC / BACK SUPPORT
       ======================================================= */

    document.addEventListener(
      'keydown',
      event => {

        if (
          event.key !== 'Escape'
        ) {

          return;

        }


        const pauseMenu =
          getElement('pauseMenu');


        if (
          !pauseMenu ||
          pauseMenu.classList.contains('hidden')
        ) {

          return;

        }


        event.preventDefault();

        closePause();

      }
    );


    /* =======================================================
       VISIBILITY
       ======================================================= */

    const sync = () => {

      const pauseMenu =
        getElement('pauseMenu');


      if (!pauseMenu) {
        return;
      }


      const active =
        isTouchDevice() &&
        isVisible('play') &&
        !isVisible('intro') &&
        !isVisible('finish') &&
        !isVisible('gameOver') &&
        pauseMenu.classList.contains('hidden');


      hud.classList.toggle(
        'is-active',
        active
      );


      rotatePrompt?.classList.toggle(
        'is-active',
        active
      );

    };


    /* =======================================================
       DOM STATE OBSERVER
       ======================================================= */

    const observer =
      new MutationObserver(
        sync
      );


    const observedElements = [

      document.body,

      getElement('intro'),

      getElement('play'),

      getElement('finish'),

      getElement('gameOver'),

      pauseMenu

    ].filter(Boolean);


    observedElements.forEach(
      element => {

        observer.observe(
          element,
          {
            attributes: true,
            attributeFilter: [
              'class'
            ]
          }
        );

      }
    );


    /* =======================================================
       RESIZE / ORIENTATION
       ======================================================= */

    window.addEventListener(
      'resize',
      sync,
      {
        passive: true
      }
    );


    window.addEventListener(
      'orientationchange',
      sync,
      {
        passive: true
      }
    );


    /* =======================================================
       INITIAL STATE
       ======================================================= */

    sync();

    return true;

  };


  /* =========================================================
     BOOT
     ========================================================= */

  const boot = () => {

    if (install()) {
      return;
    }


    const observer =
      new MutationObserver(
        () => {

          if (install()) {

            observer.disconnect();

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


    window.setTimeout(
      () => {

        observer.disconnect();

      },
      5000
    );

  };


  /* =========================================================
     DOM READY
     ========================================================= */

  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      boot,
      {
        once: true
      }
    );

  } else {

    boot();

  }

})();
