(() => {
  'use strict';

  const play = document.getElementById('play');

  if (!play || play.dataset.gameplayCoreV2 === 'ready') {
    return;
  }

  play.dataset.gameplayCoreV2 = 'ready';

  /* =========================================================
     LOAD GAMEPLAY CORE CSS ONCE
     ========================================================= */

  const CSS_HREF = './gameplay-core-v1.css';

  if (!document.querySelector(`link[href="${CSS_HREF}"]`)) {
    const styleLink = document.createElement('link');

    styleLink.rel = 'stylesheet';
    styleLink.href = CSS_HREF;

    document.head.appendChild(styleLink);
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  const reducedMotion = () =>
    window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    )?.matches === true;

  let pulseTimer = null;
  let movingKeys = new Set();

  /* =========================================================
     CLEANUP
     ========================================================= */

  const clearPulse = () => {
    play.classList.remove(
      'gameplay-dash',
      'gameplay-jump',
      'gameplay-hit'
    );

    play
      .querySelectorAll('.gameplay-pulse')
      .forEach(element => {
        element.classList.remove('gameplay-pulse');
      });

    if (pulseTimer) {
      clearTimeout(pulseTimer);
      pulseTimer = null;
    }
  };

  const clearMovement = () => {
    movingKeys.clear();
    play.classList.remove('gameplay-moving');
  };

  /* =========================================================
     MAIN GAMEPLAY PULSE
     ========================================================= */

  const pulse = (
    kind,
    element = null,
    duration = 180
  ) => {
    if (pulseTimer) {
      clearTimeout(pulseTimer);
      pulseTimer = null;
    }

    play.classList.remove(
      'gameplay-dash',
      'gameplay-jump',
      'gameplay-hit'
    );

    if (!reducedMotion()) {
      void play.offsetWidth;

      play.classList.add(
        `gameplay-${kind}`
      );
    }

    /* -----------------------------------------
       Mobile button feedback
       ----------------------------------------- */

    if (element) {
      element.classList.remove(
        'gameplay-pulse'
      );

      void element.offsetWidth;

      if (!reducedMotion()) {
        element.classList.add(
          'gameplay-pulse'
        );
      }

      window.setTimeout(() => {
        element.classList.remove(
          'gameplay-pulse'
        );
      }, duration);
    }

    /* -----------------------------------------
       Remove screen effect
       ----------------------------------------- */

    pulseTimer = window.setTimeout(() => {
      play.classList.remove(
        `gameplay-${kind}`
      );

      pulseTimer = null;
    }, duration + 40);
  };

  /* =========================================================
     MOBILE ACTION FEEDBACK
     ========================================================= */

  const actionPulse = action => {
    if (!action) return;

    const button = play.querySelector(
      `[data-mobile-action="${action}"]`
    );

    switch (action) {

      case 'dash':
        pulse(
          'dash',
          button,
          190
        );
        break;

      case 'jump':
        pulse(
          'jump',
          button,
          150
        );
        break;

      case 'fire':
        pulse(
          'hit',
          button,
          120
        );
        break;

      case 'sword':
        pulse(
          'hit',
          button,
          120
        );
        break;

      default:
        if (button) {
          button.classList.remove(
            'gameplay-pulse'
          );

          void button.offsetWidth;

          if (!reducedMotion()) {
            button.classList.add(
              'gameplay-pulse'
            );
          }

          window.setTimeout(() => {
            button.classList.remove(
              'gameplay-pulse'
            );
          }, 120);
        }

        break;
    }
  };

  /* =========================================================
     KEY NORMALIZATION
     ========================================================= */

  const getMovementKey = event => {
    const key = event.key;

    if (
      key === 'a' ||
      key === 'A' ||
      key === 'ArrowLeft'
    ) {
      return 'left';
    }

    if (
      key === 'd' ||
      key === 'D' ||
      key === 'ArrowRight'
    ) {
      return 'right';
    }

    return null;
  };

  /* =========================================================
     KEYBOARD DOWN
     ========================================================= */

  document.addEventListener(
    'keydown',
    event => {

      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      /* -----------------------------------------
         MOVEMENT
         ----------------------------------------- */

      const movementKey =
        getMovementKey(event);

      if (movementKey) {
        movingKeys.add(
          movementKey
        );

        play.classList.add(
          'gameplay-moving'
        );

        return;
      }

      /* -----------------------------------------
         JUMP
         ----------------------------------------- */

      if (
        event.code === 'Space' ||
        event.key === 'w' ||
        event.key === 'W' ||
        event.key === 'ArrowUp'
      ) {
        actionPulse('jump');
        return;
      }

      /* -----------------------------------------
         DASH
         ----------------------------------------- */

      if (
        event.key === 'Shift'
      ) {
        actionPulse('dash');
        return;
      }
    },
    true
  );

  /* =========================================================
     KEYBOARD UP
     ========================================================= */

  document.addEventListener(
    'keyup',
    event => {

      const movementKey =
        getMovementKey(event);

      if (!movementKey) {
        return;
      }

      movingKeys.delete(
        movementKey
      );

      if (
        movingKeys.size === 0
      ) {
        play.classList.remove(
          'gameplay-moving'
        );
      }
    },
    true
  );

  /* =========================================================
     MOBILE CONTROLS
     ========================================================= */

  const bindMobileControls = () => {
    const buttons =
      play.querySelectorAll(
        '[data-mobile-action]'
      );

    buttons.forEach(button => {

      if (
        button.dataset.gameplayCoreBound === '1'
      ) {
        return;
      }

      button.dataset.gameplayCoreBound = '1';

      button.addEventListener(
        'pointerdown',
        event => {
          event.preventDefault();
          event.stopPropagation();

          actionPulse(
            button.dataset.mobileAction
          );
        },
        {
          passive: false
        }
      );
    });
  };

  bindMobileControls();

  /* =========================================================
     HANDLE DYNAMIC MOBILE BUTTONS
     ========================================================= */

  const observer =
    new MutationObserver(() => {
      bindMobileControls();
    });

  observer.observe(
    play,
    {
      childList: true,
      subtree: true
    }
  );

  /* =========================================================
     WINDOW / TAB SAFETY
     ========================================================= */

  window.addEventListener(
    'blur',
    () => {
      clearMovement();
      clearPulse();
    }
  );

  document.addEventListener(
    'visibilitychange',
    () => {

      if (!document.hidden) {
        return;
      }

      clearMovement();
      clearPulse();
    }
  );

  /* =========================================================
     TOUCH / POINTER SAFETY
     ========================================================= */

  document.addEventListener(
    'pointerup',
    () => {

      /*
       * Do not cancel movement here.
       * Phaser/gameplay may still be using keyboard state.
       */
    },
    {
      passive: true
    }
  );

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.relayGameplayCore = {
    pulse,
    actionPulse,
    clearPulse,
    clearMovement
  };

  /* =========================================================
     READY EVENT
     ========================================================= */

  window.dispatchEvent(
    new CustomEvent(
      'relay:gameplay-core-ready',
      {
        detail: {
          version: '2.0.0',
          source: 'gameplay-core-v1.js'
        }
      }
    )
  );

})();