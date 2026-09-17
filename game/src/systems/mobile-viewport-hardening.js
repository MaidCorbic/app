//
// Responsibility:
// - mobile/touch detection
// - viewport synchronization
// - portrait / landscape detection
// - rotation handling
// - settled viewport event
//
// IMPORTANT:
// - Never dispatch a synthetic window.resize event.
// - Never create a resize feedback loop.
// - Do not resize the Phaser canvas directly.
// - Do not control or remove the splash loader here.
// - Splash lifecycle is owned by splash-loader-v2.js.
// - Mobile gameplay input remains owned by
//   mobile-input-single-owner-v1.js.
//

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
     * Do nothing if the viewport
     * has not actually changed.
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
     * Never dispatch a synthetic
     * window.resize event here.
     *
     * Other systems can listen to the
     * native resize event independently.
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
          if (destroyed) {
            return;
          }

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
   END
   ========================================================= */

/*
 * IMPORTANT:
 *
 * Splash loader is intentionally NOT handled here.
 *
 * splash-loader-v2.js is the single owner of:
 *
 *   loader image
 *   loader progress
 *   Phaser readiness
 *   splash completion
 *   splash fade-out
 *   splash removal
 *
 * This prevents two independent systems from trying
 * to close/remove #relaySplash at the same time.
 */