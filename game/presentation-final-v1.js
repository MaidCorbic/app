import { RunnerScene } from './src/scenes/RunnerScene.js';

/* Final presentation-only cleanup. Gameplay state, progress and ability logic stay authoritative elsewhere. */
(() => {
  'use strict';

  if (window.__relayPresentationFinalV1) return;
  window.__relayPresentationFinalV1 = true;

  const viewport = scene => ({
    w: Number(
      scene?.scale?.gameSize?.width ||
      scene?.scale?.width ||
      window.innerWidth ||
      1280
    ),
    h: Number(
      scene?.scale?.gameSize?.height ||
      scene?.scale?.height ||
      window.innerHeight ||
      720
    ),
  });

  const hideLegacyBodySwapHud = scene => {
    const list = scene?.children?.list || [];

    for (const child of list) {
      if (child?.type !== 'Text' || typeof child.text !== 'string') continue;

      const text = child.text.trim().toUpperCase();

      if (
        /^(BODY SWAP|SWAP BODY|HOST BODY)(?:\s*[·•-]\s*B)?$/.test(text) ||
        text.startsWith('BODY SWAP ·')
      ) {
        child.setVisible(false);
        child.setAlpha?.(0);
        child.disableInteractive?.();
      }
    }

    const bodySwap =
      scene?.__relayGameplayExpansionV3Safe?.entities?.bodySwap;

    bodySwap?.badge?.setVisible?.(false);
  };

  const styleObjective = state => {
    if (!state) return;

    state.bg?.setStrokeStyle?.(
      1,
      0xffd06e,
      0.72
    );

    state.accent?.setFillStyle?.(
      0xffd06e,
      0.95
    );

    state.track?.setFillStyle?.(
      0x17130b,
      1
    );

    state.fill?.setFillStyle?.(
      0xffd06e,
      1
    );

    state.kicker?.setColor?.(
      '#ffd06e'
    );

    state.label?.setColor?.(
      '#a79772'
    );

    state.progress?.setColor?.(
      '#f4f7fa'
    );

    state.status?.setColor?.(
      '#c9a95f'
    );
  };

  /*
   * FINAL MISSION OBJECTIVE LAYOUT
   *
   * MOBILE LANDSCAPE:
   * - compact
   * - upper/center area
   * - never placed over bottom-right controls
   * - never placed over Cargo
   *
   * MOBILE PORTRAIT:
   * - existing portrait behaviour preserved
   *
   * DESKTOP:
   * - existing desktop behaviour preserved
   */
  const layoutObjective = scene => {
    const state = scene?.__missionObjectiveState;

    if (!state?.c) return;

    const { w, h } = viewport(scene);

    const mobile = w <= 760;
    const landscape = mobile && w > h;

    /*
     * =========================================================
     * MOBILE LANDSCAPE
     * =========================================================
     */
    if (landscape) {
      const baseW = 426;

      /*
       * Keep the Mission Objective compact.
       * Maximum width: 250px.
       */
      const targetW = Math.min(
        250,
        Math.max(210, w - 360)
      );

      const scale = targetW / baseW;

      /*
       * Center horizontally.
       */
      const x = Math.max(
        12,
        Math.round((w - targetW) / 2)
      );

      /*
       * Keep it under the top HUD,
       * but well above the bottom controls.
       */
      const y = Math.max(
        64,
        Math.min(118, h * 0.12)
      );

      const key =
        `landscape:${w}x${h}:${targetW}:${x}:${y}`;

      if (
        scene.__relayFinalObjectiveLayout === key
      ) {
        return;
      }

      scene.__relayFinalObjectiveLayout = key;

      state.c
        .setPosition(x, y)
        .setScale(scale);

      styleObjective(state);

      return;
    }

    /*
     * =========================================================
     * MOBILE PORTRAIT
     * =========================================================
     */
    if (mobile) {
      const baseW = 426;

      const targetW = Math.min(
        270,
        Math.max(214, w - 28)
      );

      const scale = targetW / baseW;

      const x = Math.max(
        10,
        (w - targetW) / 2
      );

      const y = Math.max(
        76,
        Math.min(102, h * 0.14)
      );

      const key =
        `portrait:${w}x${h}:${targetW}:${x}:${y}`;

      if (
        scene.__relayFinalObjectiveLayout === key
      ) {
        return;
      }

      scene.__relayFinalObjectiveLayout = key;

      state.c
        .setPosition(x, y)
        .setScale(scale);

      styleObjective(state);

      return;
    }

    /*
     * =========================================================
     * DESKTOP
     * =========================================================
     *
     * Desktop layout intentionally remains unchanged.
     */
    const baseW = 426;

    const targetW = Math.min(
      342,
      Math.max(292, w * 0.30)
    );

    const scale = targetW / baseW;

    const x = Math.max(
      10,
      (w - targetW) / 2
    );

    const y = 88;

    const key =
      `desktop:${w}x${h}:${targetW}:${x}:${y}`;

    if (
      scene.__relayFinalObjectiveLayout === key
    ) {
      return;
    }

    scene.__relayFinalObjectiveLayout = key;

    state.c
      .setPosition(x, y)
      .setScale(scale);

    styleObjective(state);
  };

  /*
   * ===========================================================
   * CLOSE ELEMENT
   * ===========================================================
   */
  const closeElement = element => {
    if (!element) return false;

    const button = element.querySelector?.(
      '[data-close], .close, #closeTitlePanel, #closeAbilityUnlock, [data-relay-close]'
    );

    if (
      button &&
      typeof button.click === 'function'
    ) {
      button.click();
      return true;
    }

    element.classList.add('hidden');
    element.classList.remove('relay-update-mode');

    return true;
  };

  /*
   * ===========================================================
   * CLOSE TOP OVERLAY
   * ===========================================================
   */
  const closeTopOverlay = () => {
    const selectors = [
      '#abilityUnlock:not(.hidden)',
      '#levelUp:not(.hidden)',
      '#titlePanel:not(.hidden)',
      '#relayInfoPanel:not(.hidden)',
      '#pauseMenu:not(.hidden)'
    ];

    for (const selector of selectors) {
      const element =
        document.querySelector(selector);

      if (element) {
        return closeElement(element);
      }
    }

    return false;
  };

  /*
   * ===========================================================
   * DOM HARDENING
   * ===========================================================
   */
  const installDomHardening = () => {
    document.documentElement.dataset.relayFinalUi = '1';

    /*
     * Favicon
     */
    let icon =
      document.head.querySelector(
        'link[data-relay-favicon]'
      );

    if (!icon) {
      icon = document.createElement('link');

      icon.rel = 'icon';
      icon.type = 'image/x-icon';
      icon.href = './favicon.ico';

      icon.dataset.relayFavicon = '1';

      document.head.appendChild(icon);
    }

    /*
     * Document title
     */
    document.title = 'Relay Runner';

    /*
     * Escape closes the active overlay.
     */
    document.addEventListener(
      'keydown',
      event => {
        if (
          event.key !== 'Escape' ||
          event.defaultPrevented
        ) {
          return;
        }

        if (closeTopOverlay()) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      {
        capture: true
      }
    );
  };

  /*
   * ===========================================================
   * RUNNER SCENE CREATE
   * ===========================================================
   */
  const originalCreate =
    RunnerScene.prototype.create;

  RunnerScene.prototype.create =
    function finalPresentationCreate(...args) {
      const result =
        originalCreate.apply(this, args);

      try {
        hideLegacyBodySwapHud(this);
        layoutObjective(this);
      } catch (error) {
        console.warn(
          '[Relay Presentation] create cleanup skipped',
          error
        );
      }

      return result;
    };

  /*
   * ===========================================================
   * RUNNER SCENE UPDATE
   * ===========================================================
   */
  const originalUpdate =
    RunnerScene.prototype.update;

  RunnerScene.prototype.update =
    function finalPresentationUpdate(...args) {
      const result =
        originalUpdate.apply(this, args);

      try {
        layoutObjective(this);
      } catch {}

      return result;
    };

  /*
   * ===========================================================
   * DOM READY
   * ===========================================================
   */
  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      installDomHardening,
      {
        once: true
      }
    );
  } else {
    installDomHardening();
  }
})();
