/* =========================================================
   RELAY FINAL LAYOUT V2
   FINAL HOME OWNER

   FINAL ORDER:
   1. OPTIONS
   2. UPDATE
   3. FAQ
   4. EXIT

   ONE HOME MENU ONLY.
   ========================================================= */

(() => {
  'use strict';

  const STYLE_ID = 'relay-final-layout-v2-style';
  const HOME_SELECTOR = '#intro.home-v3 .home-v3-side';

  /* =========================================================
     HELPERS
     ========================================================= */

  const qs = (selector, root = document) => {
    try {
      return root.querySelector(selector);
    } catch {
      return null;
    }
  };

  const qsa = (selector, root = document) => {
    try {
      return [...root.querySelectorAll(selector)];
    } catch {
      return [];
    }
  };

  const nativeClick = (selector) => {
    const node = qs(selector);

    if (!node) {
      console.warn(
        `[relay-final-layout-v2] Target not found: ${selector}`
      );
      return false;
    }

    try {
      HTMLElement.prototype.click.call(node);
      return true;
    } catch {
      try {
        node.click();
        return true;
      } catch {
        return false;
      }
    }
  };

  /* =========================================================
     CREATE FINAL HOME BUTTON
     ========================================================= */

  const makeHomeButton = (
    side,
    key,
    title,
    subtitle,
    action
  ) => {
    const button = document.createElement('button');

    button.type = 'button';

    button.className =
      'home-v3-card relay-home-nav-card';

    button.dataset.finalHome = key;
    button.dataset.finalHomeButton = key;

    button.innerHTML = `
      <span>${title}</span>
      <small>${subtitle}</small>
    `;

    button.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        try {
          action?.();
        } catch (error) {
          console.error(
            `[relay-final-layout-v2] ${key} action failed`,
            error
          );
        }
      },
      {
        capture: true
      }
    );

    side.appendChild(button);

    return button;
  };

  /* =========================================================
     REMOVE ALL LEGACY HOME CONTENT
     ========================================================= */

  const cleanHome = (intro, side) => {
    /* -------------------------------------------------------
       REMOVE OLD TOP LAUNCHER
       ------------------------------------------------------- */

    intro
      .querySelectorAll('.info-launcher')
      .forEach((node) => node.remove());

    /* -------------------------------------------------------
       REMOVE OLD TITLE SECONDARY MENU
       ------------------------------------------------------- */

    intro
      .querySelectorAll('.title-secondary')
      .forEach((node) => node.remove());

    /* -------------------------------------------------------
       REMOVE EVERY KNOWN HOME BUTTON TYPE
       ------------------------------------------------------- */

    const legacySelectors = [
      '[data-v3-options]',
      '[data-v3-update]',
      '[data-v3-faq]',
      '[data-v3-exit]',

      '[data-final-home]',
      '[data-final-home-button]',

      '[data-unified-home]',

      '[data-runtime-home]',
      '[data-safe-home]',

      '.relay-home-nav-card',
      '.relay-v4-home-btn',
      '.relay-runtime-home-btn',

      '[data-home-button]',
      '[data-home-action]',

      '.home-nav-card',
      '.home-action-card'
    ];

    qsa(
      legacySelectors.join(','),
      side
    ).forEach((node) => {
      node.remove();
    });
  };

  /* =========================================================
     INSTALL FINAL HOME
     ========================================================= */

  const installHome = () => {
    const intro =
      document.getElementById('intro');

    if (!intro) return;

    const side =
      intro.querySelector('.home-v3-side');

    if (!side) {
      console.warn(
        '[relay-final-layout-v2] .home-v3-side not found.'
      );
      return;
    }

    /* Clean everything first. */
    cleanHome(intro, side);

    /* =====================================================
       FINAL ORDER
       ===================================================== */

    makeHomeButton(
      side,
      'options',
      'OPTIONS',
      'SETTINGS · AUDIO · DISPLAY',
      () => {
        if (
          window.relayUnifiedCinematicUI
            ?.openOptions
        ) {
          window.relayUnifiedCinematicUI.openOptions();
          return;
        }

        nativeClick(
          '[data-title-panel="controls"]'
        );
      }
    );

    makeHomeButton(
      side,
      'update',
      'UPDATE',
      'LATEST PATCHES · LIVE',
      () => {
        if (
          window.relayOpenInfo
        ) {
          window.relayOpenInfo('update');
          return;
        }

        nativeClick(
          '[data-relay-info="update"]'
        );
      }
    );

    makeHomeButton(
      side,
      'faq',
      'FAQ',
      'HELP · GAME SYSTEMS',
      () => {
        if (
          window.relayUnifiedCinematicUI
            ?.openFAQ
        ) {
          window.relayUnifiedCinematicUI.openFAQ();
          return;
        }

        if (
          window.relayOpenInfo
        ) {
          window.relayOpenInfo('faq');
          return;
        }

        nativeClick(
          '[data-relay-info="faq"]'
        );
      }
    );

    makeHomeButton(
      side,
      'exit',
      'EXIT',
      'CLOSE SESSION',
      () => {
        nativeClick('#exitTitle');
      }
    );

    console.info(
      '[relay-final-layout-v2] FINAL:',
      'OPTIONS → UPDATE → FAQ → EXIT'
    );
  };

  /* =========================================================
     FINAL CSS
     ========================================================= */

  const injectStyle = () => {
    let style =
      document.getElementById(STYLE_ID);

    if (style) return;

    style =
      document.createElement('style');

    style.id = STYLE_ID;

    style.textContent = `
      /* =====================================================
         REMOVE COMPETING HOME UI
         ===================================================== */

      #intro.home-v3 .info-launcher,
      #intro.home-v3 .title-secondary {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* =====================================================
         FINAL HOME
         ===================================================== */

      #intro.home-v3 .home-v3-side {
        display: flex !important;

        flex-direction: column !important;

        align-items: stretch !important;

        justify-content: center !important;

        gap: 10px !important;

        width: min(
          420px,
          calc(100vw - 32px)
        ) !important;

        margin-left: auto !important;
        margin-right: auto !important;

        box-sizing: border-box !important;

        position: relative !important;

        z-index: 300 !important;

        visibility: visible !important;
        opacity: 1 !important;

        pointer-events: auto !important;
      }

      /* =====================================================
         FINAL BUTTONS
         ===================================================== */

      #intro.home-v3
      .home-v3-side
      .relay-home-nav-card {
        position: relative !important;

        display: flex !important;

        flex-direction: column !important;

        align-items: flex-start !important;

        justify-content: center !important;

        width: 100% !important;

        min-height: 62px !important;

        box-sizing: border-box !important;

        padding: 11px 18px !important;

        margin: 0 !important;

        overflow: hidden !important;

        border-radius: 10px !important;

        cursor: pointer !important;

        touch-action: manipulation !important;

        user-select: none !important;

        -webkit-tap-highlight-color: transparent !important;

        text-align: left !important;

        transition:
          transform .16s ease,
          filter .16s ease,
          box-shadow .16s ease !important;
      }

      /* =====================================================
         TITLE
         ===================================================== */

      #intro.home-v3
      .home-v3-side
      .relay-home-nav-card > span {
        display: block !important;

        width: 100% !important;

        min-width: 0 !important;

        overflow: hidden !important;

        white-space: nowrap !important;

        text-overflow: ellipsis !important;

        line-height: 1.15 !important;

        font-size: 15px !important;

        font-weight: 800 !important;

        letter-spacing: .12em !important;
      }

      /* =====================================================
         SUBTITLE
         ===================================================== */

      #intro.home-v3
      .home-v3-side
      .relay-home-nav-card > small {
        display: block !important;

        width: 100% !important;

        min-width: 0 !important;

        margin-top: 5px !important;

        overflow: hidden !important;

        white-space: nowrap !important;

        text-overflow: ellipsis !important;

        line-height: 1.15 !important;

        font-size: 9px !important;

        letter-spacing: .07em !important;

        opacity: .72 !important;
      }

      /* =====================================================
         INTERACTION
         ===================================================== */

      #intro.home-v3
      .home-v3-side
      .relay-home-nav-card:hover {
        transform: translateX(4px) !important;

        filter: brightness(1.12) !important;
      }

      #intro.home-v3
      .home-v3-side
      .relay-home-nav-card:active {
        transform:
          translateX(2px)
          scale(.985) !important;

        filter: brightness(.94) !important;
      }

      #intro.home-v3
      .home-v3-side
      .relay-home-nav-card:focus-visible {
        outline: 2px solid currentColor !important;

        outline-offset: 3px !important;
      }

      /* =====================================================
         MOBILE
         ===================================================== */

      @media (max-width: 768px) {

        #intro.home-v3 .home-v3-side {
          width: min(
            360px,
            calc(100vw - 24px)
          ) !important;

          gap: 9px !important;
        }

        #intro.home-v3
        .home-v3-side
        .relay-home-nav-card {
          min-height: 58px !important;

          padding:
            10px 16px !important;
        }

        #intro.home-v3
        .home-v3-side
        .relay-home-nav-card > span {
          font-size: 14px !important;

          letter-spacing: .10em !important;
        }

        #intro.home-v3
        .home-v3-side
        .relay-home-nav-card > small {
          font-size: 8px !important;

          letter-spacing: .06em !important;
        }
      }

      /* =====================================================
         SMALL PHONES
         ===================================================== */

      @media (max-width: 380px) {

        #intro.home-v3 .home-v3-side {
          width: calc(100vw - 20px) !important;

          gap: 7px !important;
        }

        #intro.home-v3
        .home-v3-side
        .relay-home-nav-card {
          min-height: 54px !important;

          padding:
            9px 14px !important;
        }

        #intro.home-v3
        .home-v3-side
        .relay-home-nav-card > span {
          font-size: 13px !important;
        }

        #intro.home-v3
        .home-v3-side
        .relay-home-nav-card > small {
          font-size: 7px !important;
        }
      }
    `;

    document.head.appendChild(style);
  };

  /* =========================================================
     VERIFY FINAL HOME
     ========================================================= */

  const enforceFinalHome = () => {
    const intro =
      document.getElementById('intro');

    const side =
      intro?.querySelector('.home-v3-side');

    if (!intro || !side) return;

    /* Kill competing menus again. */
    intro
      .querySelectorAll(
        '.title-secondary, .info-launcher'
      )
      .forEach((node) => node.remove());

    /*
      Remove anything that is not one of
      our four FINAL buttons.
    */

    qsa(
      [
        '[data-v3-options]',
        '[data-v3-update]',
        '[data-v3-faq]',
        '[data-v3-exit]',
        '[data-unified-home]',
        '[data-runtime-home]',
        '[data-safe-home]',
        '.relay-v4-home-btn',
        '.relay-runtime-home-btn'
      ].join(','),
      side
    ).forEach((node) => {
      node.remove();
    });

    const buttons =
      qsa(
        '.relay-home-nav-card',
        side
      );

    const correct =
      buttons.length === 4 &&
      buttons[0]?.dataset.finalHome === 'options' &&
      buttons[1]?.dataset.finalHome === 'update' &&
      buttons[2]?.dataset.finalHome === 'faq' &&
      buttons[3]?.dataset.finalHome === 'exit';

    if (!correct) {
      installHome();
    }
  };

  /* =========================================================
     BOOT
     ========================================================= */

  const boot = () => {
    injectStyle();
    installHome();

    /*
      Legacy scripts can execute later.
      Re-check periodically and restore
      the exact FINAL four-button structure.
    */

    window.setInterval(
      enforceFinalHome,
      500
    );
  };

  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  ) {
    queueMicrotask(boot);
  } else {
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      { once: true }
    );
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.relayFinalLayoutV2 = {
    installHome,
    injectStyle,
    enforceFinalHome
  };

})();
