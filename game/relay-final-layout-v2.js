/* =========================================================
   RELAY FINAL LAYOUT V2
   FINAL HOME STRUCTURE

   HOME:
   - OPTIONS
   - EXIT

   TOP INFO:
   - FAQ
   - UPDATE

   IMPORTANT:
   .info-launcher is intentionally preserved.
   FAQ + UPDATE are NOT duplicated inside .home-v3-side.
   ========================================================= */

(() => {
  'use strict';

  const STYLE_ID = 'relay-final-layout-v2-style';

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

    node.click();
    return true;
  };

  /* =========================================================
     FINAL HOME BUTTON CREATOR
     ========================================================= */

  const makeHomeButton = (
    side,
    key,
    title,
    subtitle,
    action
  ) => {
    if (!side) return null;

    const button = document.createElement('button');

    button.type = 'button';
    button.className = 'home-v3-card';
    button.dataset.finalHome = key;
    button.setAttribute('data-final-home', key);

    button.innerHTML = `
      <span>${title}</span>
      <small>${subtitle}</small>
    `;

    button.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
          action?.();
        } catch (error) {
          console.error(
            `[relay-final-layout-v2] ${key} action failed`,
            error
          );
        }
      },
      false
    );

    side.appendChild(button);

    return button;
  };

  /* =========================================================
     INSTALL FINAL HOME
     ========================================================= */

  const installHome = () => {
    const intro = document.getElementById('intro');
    const side = intro?.querySelector('.home-v3-side');

    if (!intro || !side) {
      console.warn(
        '[relay-final-layout-v2] Home container not found.'
      );
      return;
    }

    /*
      IMPORTANT:

      DO NOT REMOVE .info-launcher.

      FAQ + UPDATE belong to the top launcher in index.html.
      Removing it would destroy the intended FINAL layout.
    */

    /* -------------------------------------------------------
       REMOVE OLD / DUPLICATE HOME BUTTONS
       ------------------------------------------------------- */

    side
      .querySelectorAll(
        [
          '[data-v3-faq]',
          '[data-v3-update]',
          '[data-v3-options]',
          '[data-v3-exit]',
          '[data-final-home]'
        ].join(',')
      )
      .forEach((node) => node.remove());

    /* -------------------------------------------------------
       FINAL HOME BUTTONS

       ONLY:
       OPTIONS
       EXIT
       ------------------------------------------------------- */

    makeHomeButton(
      side,
      'options',
      'OPTIONS',
      'SETTINGS · AUDIO · DISPLAY',
      () => {
        if (
          window.relayUnifiedCinematicUI?.openOptions
        ) {
          window.relayUnifiedCinematicUI.openOptions();
          return;
        }

        nativeClick('[data-title-panel="controls"]');
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

    /*
      FINAL RESULT:

      .home-v3-side
      ├── OPTIONS
      └── EXIT

      .info-launcher
      ├── FAQ
      └── UPDATE
    */
  };

  /* =========================================================
     FINAL CSS
     ========================================================= */

  const injectStyle = () => {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');

    style.id = STYLE_ID;

    style.textContent = `
      /* =====================================================
         RELAY FINAL LAYOUT V2
         HOME BUTTON SAFETY
         ===================================================== */

      #intro.home-v3 .home-v3-side {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 12px !important;
      }

      #intro.home-v3 .home-v3-side .home-v3-card {
        width: 100% !important;
        min-height: 64px !important;

        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: flex-start !important;

        box-sizing: border-box !important;

        overflow: hidden !important;

        text-align: left !important;
      }

      #intro.home-v3 .home-v3-side .home-v3-card > span {
        display: block !important;

        width: 100% !important;

        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;

        line-height: 1.1 !important;
      }

      #intro.home-v3 .home-v3-side .home-v3-card > small {
        display: block !important;

        width: 100% !important;

        margin-top: 5px !important;

        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;

        line-height: 1.2 !important;
      }

      /* -----------------------------------------------------
         FAQ / UPDATE TOP LAUNCHER

         Keep these visible and independent from Home cards.
         ----------------------------------------------------- */

      #intro.home-v3 .info-launcher {
        position: relative !important;
        z-index: 20 !important;
      }

      #intro.home-v3 .info-launcher button {
        box-sizing: border-box !important;
      }

      /* -----------------------------------------------------
         MOBILE SAFETY
         ----------------------------------------------------- */

      @media (max-width: 768px) {

        #intro.home-v3 .home-v3-side {
          width: min(
            360px,
            calc(100vw - 32px)
          ) !important;

          margin-left: auto !important;
          margin-right: auto !important;

          gap: 10px !important;
        }

        #intro.home-v3 .home-v3-side .home-v3-card {
          min-height: 60px !important;
        }

        #intro.home-v3 .home-v3-side .home-v3-card > span {
          font-size: 15px !important;
          letter-spacing: .08em !important;
        }

        #intro.home-v3 .home-v3-side .home-v3-card > small {
          font-size: 9px !important;
          letter-spacing: .06em !important;
        }
      }

      /* -----------------------------------------------------
         EXTRA SMALL PHONES
         ----------------------------------------------------- */

      @media (max-width: 380px) {

        #intro.home-v3 .home-v3-side {
          width: calc(100vw - 24px) !important;
          gap: 8px !important;
        }

        #intro.home-v3 .home-v3-side .home-v3-card {
          min-height: 56px !important;
        }

        #intro.home-v3 .home-v3-side .home-v3-card > span {
          font-size: 14px !important;
        }

        #intro.home-v3 .home-v3-side .home-v3-card > small {
          font-size: 8px !important;
        }
      }
    `;

    document.head.appendChild(style);
  };

  /* =========================================================
     BOOT
     ========================================================= */

  const boot = () => {
    injectStyle();
    installHome();
  };

  /* =========================================================
     INITIAL LOAD
     ========================================================= */

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
    injectStyle
  };

})();
