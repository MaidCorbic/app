/* Mobile in-game HUD: PAUSE + SETTINGS only during active gameplay. */
(() => {
  const PORTRAIT_GUARD_STYLE_ID = 'mobile-portrait-hud-rotate-style';

  const isTouchDevice = () =>
    document.body.classList.contains('is-touch') ||
    matchMedia('(pointer: coarse)').matches;

  const installPortraitGuardStyle = () => {
    if (document.getElementById(PORTRAIT_GUARD_STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');

    style.id = PORTRAIT_GUARD_STYLE_ID;

    style.textContent = `
      /* =========================================================
         MOBILE PORTRAIT GUARD
         ========================================================= */

      @media (pointer: coarse) and (orientation: portrait) {
        /* Portrait is supported. Never replace gameplay with a desktop/rotate gate. */
        html body.is-touch .mobile-rotate-prompt {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        html body.is-touch #play #pause,
        html body.is-touch #mobileBottomHud .mobile-menu-pause {
          display: grid !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }

        html body.is-touch #play .hud-xp {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      }


      /* =========================================================
         MOBILE CARGO INTEGRITY GUARD
         ========================================================= */

      @media (pointer: coarse) and (max-width: 900px) and (max-height: 600px),
             (pointer: coarse) and (max-width: 600px) and (max-height: 900px) {
        html body.is-touch #cargoIntegrityV2 {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      }


      /* =========================================================
         ROTATE DEVICE PROMPT
         ========================================================= */

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


      /* =========================================================
         REDUCED MOTION
         ========================================================= */

      @media (prefers-reduced-motion: reduce) {
        .mobile-rotate-prompt {
          transition: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  };


  /* ===========================================================
     INSTALL MOBILE HUD
     =========================================================== */

  const install = () => {
    installPortraitGuardStyle();

    const pause = document.querySelector('#pause');
    const pauseMenu = document.querySelector('#pauseMenu');
    const panel = pauseMenu?.querySelector('#panelContent');

    /*
     * Do not create the mobile HUD until the canonical pause
     * elements exist.
     */
    if (
      !pause ||
      document.getElementById('mobileBottomHud')
    ) {
      return false;
    }


    /* =========================================================
       PREVENT GAMEPLAY POINTER PROPAGATION INSIDE PAUSE MENU
       ========================================================= */

    panel?.addEventListener('pointerdown', event => {
      const target =
        event.target instanceof Element
          ? event.target
          : null;

      if (
        target?.matches(
          'input[type="range"], select, button, a'
        )
      ) {
        event.stopPropagation();
      }
    });

    /* =========================================================
       MOBILE BOTTOM HUD
       ========================================================= */

    const hud = document.createElement('div');

    hud.id = 'mobileBottomHud';
    hud.className = 'mobile-bottom-hud';

    /*
     * Mobile PAUSE + SETTINGS buttons removed.
     *
     * Keep the HUD container alive because the rest of this
     * module uses it for gameplay-state synchronisation.
     */
    hud.innerHTML = `
      <button id="mobilePauseButton" class="mobile-hud-action mobile-menu-pause" type="button" aria-label="Open pause menu">
        <span class="mobile-hud-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
        </span>
        <span class="mobile-hud-label">PAUSE</span>
      </button>
      <button id="mobileSettingsButton" class="mobile-hud-action mobile-menu-settings" type="button" aria-label="Open settings">
        <span class="mobile-hud-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false"><path d="M12 8.1a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8Z"></path><path d="m19.1 13.1 1.4 1.1-1.8 3.1-1.7-.7a7.9 7.9 0 0 1-1.7 1l-.2 1.8h-3.6l-.2-1.8a7.9 7.9 0 0 1-1.7-1l-1.7.7-1.8-3.1 1.4-1.1a7.9 7.9 0 0 1 0-2.2L6.1 9.8l1.8-3.1 1.7.7a7.9 7.9 0 0 1 1.7-1l.2-1.8h3.6l.2 1.8a7.9 7.9 0 0 1 1.7 1l1.7-.7 1.8 3.1-1.4 1.1a7.9 7.9 0 0 1 0 2.2Z"></path></svg>
        </span>
        <span class="mobile-hud-label">SETTINGS</span>
      </button>
    `;

    const mobilePauseButton = hud.querySelector('#mobilePauseButton');
    const mobileSettingsButton = hud.querySelector('#mobileSettingsButton');

    document.body.append(hud);


    /* =========================================================
       ROTATE PROMPT
       ========================================================= */

    const rotatePrompt = document.createElement('div');

    rotatePrompt.id = 'mobileRotatePrompt';
    rotatePrompt.className = 'mobile-rotate-prompt';

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

    document.body.append(rotatePrompt);


    /* =========================================================
       VISIBILITY HELPER
       ========================================================= */

    const visible = id => {
      const element =
        document.getElementById(id);

      return (
        !!element &&
        !element.classList.contains('hidden')
      );
    };


    /* =========================================================
       MOBILE HUD STATE
       ========================================================= */

    const sync = () => {
      const active =
        isTouchDevice() &&
        visible('play') &&
        !visible('intro') &&
        !visible('finish') &&
        !visible('gameOver') &&
        !pauseMenu || pauseMenu.classList.contains('hidden');


      /*
       * HUD is visible only during active gameplay.
       */
      hud.classList.toggle(
        'is-active',
        active
      );


      /*
       * Rotate prompt uses the same gameplay state.
       *
       * CSS decides whether it is visible in portrait.
       */
      rotatePrompt.classList.toggle(
        'is-active',
        active
      );
    };


    /* =========================================================
       DOM STATE OBSERVER
       ========================================================= */

    const observer =
      new MutationObserver(sync);


    [
      document.body,

      ...[
        'intro',
        'play',
        'finish',
        'gameOver'
      ]
        .map(id =>
          document.getElementById(id)
        ),

      pauseMenu
    ]
      .filter(Boolean)
      .forEach(element => {
        observer.observe(
          element,
          {
            attributes: true,
            attributeFilter: ['class']
          }
        );
      });


    /* =========================================================
       RESIZE / ORIENTATION
       ========================================================= */

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


    /* =========================================================
       INITIAL STATE
       ========================================================= */

    sync();

    return true;
  };


  /* ===========================================================
     BOOT
     =========================================================== */

  const boot = () => {
    /*
     * If everything already exists, install immediately.
     */
    if (install()) {
      return;
    }


    /*
     * Otherwise wait for the game shell / pause menu
     * to be created dynamically.
     */
    const observer =
      new MutationObserver(() => {
        if (install()) {
          observer.disconnect();
        }
      });


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );


    /*
     * Safety timeout.
     */
    window.setTimeout(() => {
      observer.disconnect();
    }, 5000);
  };


  /* ===========================================================
     DOM READY
     =========================================================== */

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      { once: true }
    );
  } else {
    boot();
  }

})();
