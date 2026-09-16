// MOBILE VIEWPORT HARDENING V4
//
// Responsibility:
// - mobile/touch detection
// - viewport synchronization
// - portrait / landscape detection
// - rotation handling
// - settled viewport event
// - mobile splash fail-safe
//
// IMPORTANT:
// - Never dispatch a synthetic window.resize event.
// - Never create a resize feedback loop.
// - Do not resize the Phaser canvas directly.
// - Mobile gameplay input remains owned by
//   mobile-input-single-owner-v1.js.

'use strict';


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

  return (
    coarsePointer ||
    touchPoints ||
    mobileUserAgent
  );
};


/* =========================================================
   VIEWPORT MEASUREMENT
   ========================================================= */

const getViewport = () => {
  const root = document.documentElement;
  const vv = window.visualViewport;

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

  let destroyed = false;
  let lastKey = '';


  /* ---------------------------------------------------------
     VIEWPORT KEY
     --------------------------------------------------------- */

  const getViewportKey = ({
    width,
    height,
    orientation
  }) => {
    return `${width}x${height}|${orientation}`;
  };


  /* ---------------------------------------------------------
     APPLY VIEWPORT
     --------------------------------------------------------- */

  const applyViewport = (
    reason = 'resize'
  ) => {
    if (destroyed) {
      return;
    }

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
     * Do nothing if the viewport has
     * not actually changed.
     */
    if (key === lastKey) {
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
     * IMPORTANT:
     *
     * Do NOT dispatch window.resize here.
     *
     * The previous implementation did:
     *
     *   window.dispatchEvent(new Event('resize'))
     *
     * That can feed the viewport controller back
     * into itself through other resize listeners.
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


  /* ---------------------------------------------------------
     DEBOUNCED VIEWPORT UPDATE
     * --------------------------------------------------------- */

  const scheduleViewportSync = (
    reason = 'resize'
  ) => {
    if (destroyed) {
      return;
    }

    window.clearTimeout(timer);

    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);

    timer = window.setTimeout(() => {
      if (destroyed) {
        return;
      }

      raf1 = requestAnimationFrame(() => {
        if (destroyed) {
          return;
        }

        raf2 = requestAnimationFrame(() => {
          applyViewport(reason);
        });
      });
    }, 120);
  };


  /* ---------------------------------------------------------
     INITIAL SYNCHRONOUS MEASUREMENT
     --------------------------------------------------------- */

  /*
   * Establish CSS variables immediately.
   *
   * This happens before the first settled event.
   */
  const initialViewport =
    syncViewportNow();

  lastKey =
    getViewportKey(initialViewport);


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
    {
      passive: true
    }
  );


  /* ---------------------------------------------------------
     NORMAL RESIZE
     --------------------------------------------------------- */

  window.addEventListener(
    'resize',
    () => {
      scheduleViewportSync(
        'resize'
      );
    },
    {
      passive: true
    }
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
      {
        passive: true
      }
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
    {
      passive: true
    }
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
      {
        once: true
      }
    );
  } else {
    initialSync();
  }
}


/* =========================================================
   MOBILE SPLASH FAIL-SAFE
   ========================================================= */

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
     * Never remove the splash until
     * Phaser has actually mounted.
     */
    if (!splash || !canvas) {
      return false;
    }

    const elapsed =
      performance.now() -
      bootStarted;

    if (
      elapsed <
      MIN_SPLASH_MS
    ) {
      return false;
    }

    closed = true;

    splash.setAttribute(
      'aria-busy',
      'false'
    );

    splash.dataset.relaySplashFailOpen =
      reason;

    splash.classList.add(
      'is-hidden'
    );

    window.clearTimeout(
      timer
    );

    timer = window.setTimeout(
      () => {
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
      timer =
        window.setTimeout(
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
     * Refresh CSS viewport state.
     *
     * This does NOT emit resize.
     */
    syncViewportNow();

    window.clearTimeout(
      timer
    );

    timer =
      window.setTimeout(
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
      {
        once: true
      }
    );
  } else {
    startSplashSafetyNet();
  }
})();
