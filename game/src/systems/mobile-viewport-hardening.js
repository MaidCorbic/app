// MOBILE VIEWPORT HARDENING V3
//
// Responsibility:
// - mobile/touch detection
// - viewport synchronization
// - portrait / landscape detection
// - rotation handling
// - settled viewport event
// - mobile splash fail-safe
//
// This file does NOT:
// - own joystick input
// - own mobile action buttons
// - change player physics
// - change velocity / acceleration / gravity
// - resize the Phaser canvas directly
//
// Mobile input owner:
//   mobile-input-single-owner-v1.js
//
// Gameplay authority:
//   RunnerScene.js
//
// Canvas scaling authority:
//   mobile-scale-policy.js


/* =========================================================
   MOBILE DETECTION
   ========================================================= */

const isMobileDevice = () => {
  const coarsePointer =
    window.matchMedia?.('(pointer: coarse)')?.matches === true;

  const touchPoints =
    Number(navigator.maxTouchPoints || 0) > 0;

  const mobileUserAgent =
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone|Silk|Kindle/i.test(
      navigator.userAgent || ''
    );

  return coarsePointer || touchPoints || mobileUserAgent;
};


/* =========================================================
   VIEWPORT MEASUREMENT
   ========================================================= */

const getViewport = () => {
  const root = document.documentElement;
  const vv = window.visualViewport;

  /*
   * Prefer visualViewport when available.
   * Fall back to the normal layout viewport.
   */
  const width = Math.max(
    1,
    Math.round(
      vv?.width ||
      window.innerWidth ||
      root.clientWidth ||
      1
    )
  );

  const height = Math.max(
    1,
    Math.round(
      vv?.height ||
      window.innerHeight ||
      root.clientHeight ||
      1
    )
  );

  return {
    width,
    height,
    orientation:
      width >= height
        ? 'landscape'
        : 'portrait'
  };
};


/* =========================================================
   CSS VIEWPORT SYNC
   ========================================================= */

const syncViewportNow = () => {
  const root = document.documentElement;

  const {
    width,
    height,
    orientation
  } = getViewport();

  root.style.setProperty(
    '--relay-viewport-width',
    `${width}px`
  );

  root.style.setProperty(
    '--relay-viewport-height',
    `${height}px`
  );

  root.style.setProperty(
    '--relay-vw',
    `${width}px`
  );

  root.style.setProperty(
    '--relay-vh',
    `${height}px`
  );

  root.dataset.relayOrientation =
    orientation;

  return {
    width,
    height,
    orientation
  };
};


/* =========================================================
   MOBILE VIEWPORT CONTROLLER
   ========================================================= */

if (isMobileDevice()) {
  const root = document.documentElement;

  let timer = 0;
  let raf1 = 0;
  let raf2 = 0;

  let syncing = false;
  let destroyed = false;

  let lastKey = '';

  /*
   * Keep the current viewport state in one place.
   */
  const getViewportKey = ({
    width,
    height,
    orientation
  }) => {
    return `${width}x${height}|${orientation}`;
  };


  /*
   * Apply a settled viewport state.
   */
  const applyViewport = (
    reason = 'resize'
  ) => {
    if (destroyed) return;

    const viewport =
      getViewport();

    const {
      width,
      height,
      orientation
    } = viewport;

    const key =
      getViewportKey(viewport);

    /*
     * Prevent unnecessary resize cycles.
     */
    if (
      key === lastKey &&
      reason !== 'orientationchange'
    ) {
      return;
    }

    lastKey = key;

    root.style.setProperty(
      '--relay-viewport-width',
      `${width}px`
    );

    root.style.setProperty(
      '--relay-viewport-height',
      `${height}px`
    );

    root.style.setProperty(
      '--relay-vw',
      `${width}px`
    );

    root.style.setProperty(
      '--relay-vh',
      `${height}px`
    );

    root.dataset.relayOrientation =
      orientation;


    /*
     * Notify existing systems that
     * the viewport has settled.
     */
    syncing = true;

    window.dispatchEvent(
      new Event('resize')
    );

    /*
     * Release the resize guard on
     * the next animation frame.
     */
    requestAnimationFrame(() => {
      syncing = false;
    });


    /*
     * Project-specific viewport event.
     */
    document.dispatchEvent(
      new CustomEvent(
        'relay:viewport-settled',
        {
          detail: {
            reason,
            width,
            height,
            orientation
          }
        }
      )
    );
  };


  /*
   * Debounced viewport update.
   */
  const scheduleViewportSync = (
    reason = 'resize'
  ) => {
    if (destroyed || syncing) {
      return;
    }

    window.clearTimeout(timer);

    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);

    timer = window.setTimeout(() => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          applyViewport(reason);
        });
      });
    }, 120);
  };


  /*
   * Initial synchronous measurement.
   *
   * This prevents the first mobile layout
   * from using stale viewport variables.
   */
  syncViewportNow();


  /* ---------------------------------------------------------
     ROTATION
     --------------------------------------------------------- */

  window.addEventListener(
    'orientationchange',
    () => {
      scheduleViewportSync(
        'orientationchange'
      );
    },
    { passive: true }
  );


  /* ---------------------------------------------------------
     NORMAL RESIZE
     --------------------------------------------------------- */

  window.addEventListener(
    'resize',
    () => {
      /*
       * Ignore the synthetic resize generated
       * by applyViewport().
       */
      if (syncing) return;

      scheduleViewportSync(
        'resize'
      );
    },
    { passive: true }
  );


  /* ---------------------------------------------------------
     VISUAL VIEWPORT
     --------------------------------------------------------- */

  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      'resize',
      () => {
        scheduleViewportSync(
          'visualViewport.resize'
        );
      },
      { passive: true }
    );
  }


  /* ---------------------------------------------------------
     PAGE RETURN
     --------------------------------------------------------- */

  window.addEventListener(
    'pageshow',
    () => {
      scheduleViewportSync(
        'pageshow'
      );
    },
    { passive: true }
  );


  /* ---------------------------------------------------------
     INITIAL SETTLED PASS
     --------------------------------------------------------- */

  const initialSync = () => {
    scheduleViewportSync(
      'initial'
    );
  };

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initialSync,
      { once: true }
    );
  } else {
    initialSync();
  }
}


/* =========================================================
   MOBILE SPLASH FAIL-SAFE
   ========================================================= */

/*
 * splash-loader-v2.js remains the
 * normal splash owner.
 *
 * This is ONLY a recovery mechanism.
 *
 * Conditions:
 *
 *   mobile device
 *   +
 *   splash exists
 *   +
 *   real Phaser canvas exists
 *   +
 *   minimum splash time elapsed
 *
 * Then the splash is safely released.
 */

(() => {
  if (!isMobileDevice()) {
    return;
  }

  const bootStarted =
    performance.now();

  const MIN_SPLASH_MS = 2200;
  const SPLASH_REMOVE_DELAY = 700;
  const CHECK_INTERVAL = 120;

  let closed = false;
  let timer = 0;


  /* ---------------------------------------------------------
     FIND SPLASH
     --------------------------------------------------------- */

  const findSplash = () => {
    return (
      document.getElementById(
        'relaySplash'
      ) ||
      document.querySelector(
        '.relay-splash'
      )
    );
  };


  /* ---------------------------------------------------------
     FIND PHASER CANVAS
     --------------------------------------------------------- */

  const findPhaserCanvas = () => {
    return document.querySelector(
      '#phaser-game canvas'
    );
  };


  /* ---------------------------------------------------------
     CLOSE STUCK SPLASH
     --------------------------------------------------------- */

  const closeStuckSplash = (
    reason = 'mobile-canvas-ready'
  ) => {
    if (closed) {
      return true;
    }

    const splash =
      findSplash();

    const canvas =
      findPhaserCanvas();


    /*
     * Never hide the splash unless
     * Phaser has actually mounted.
     */
    if (!splash || !canvas) {
      return false;
    }


    const elapsed =
      performance.now() -
      bootStarted;


    /*
     * Preserve minimum splash time.
     */
    if (
      elapsed <
      MIN_SPLASH_MS
    ) {
      return false;
    }


    closed = true;


    /*
     * Accessibility state.
     */
    splash.setAttribute(
      'aria-busy',
      'false'
    );


    /*
     * Debug information.
     */
    splash.dataset.relaySplashFailOpen =
      reason;


    /*
     * Start the normal visual
     * hide transition.
     */
    splash.classList.add(
      'is-hidden'
    );


    /*
     * Cancel polling.
     */
    window.clearTimeout(
      timer
    );


    /*
     * Remove after transition.
     */
    timer = window.setTimeout(
      () => {
        /*
         * Make sure the same splash
         * element is still in the DOM.
         */
        if (
          splash.isConnected
        ) {
          splash.remove();
        }
      },
      SPLASH_REMOVE_DELAY
    );


    return true;
  };


  /* ---------------------------------------------------------
     SPLASH CHECK LOOP
     --------------------------------------------------------- */

  const checkSplash = () => {
    if (closed) {
      return;
    }

    const closedNow =
      closeStuckSplash();

    if (!closedNow) {
      timer = window.setTimeout(
        checkSplash,
        CHECK_INTERVAL
      );
    }
  };


  /* ---------------------------------------------------------
     START SAFETY NET
     --------------------------------------------------------- */

  const startSplashSafetyNet = () => {
    /*
     * Refresh viewport before
     * starting splash checks.
     */
    syncViewportNow();

    window.clearTimeout(
      timer
    );

    timer = window.setTimeout(
      checkSplash,
      MIN_SPLASH_MS
    );
  };


  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      startSplashSafetyNet,
      { once: true }
    );
  } else {
    startSplashSafetyNet();
  }
})();
