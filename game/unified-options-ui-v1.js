import { loadState, saveState } from './src/state.js';

(() => {
  'use strict';

  /*
   * RELAY RUNNER — UNIFIED OPTIONS UI V1
   *
   * Responsibilities:
   * - Settings state + persistence
   * - Settings markup
   * - Settings interactions
   * - Presentation visibility classes
   * - Home Options adapter
   * - Pause Settings adapter
   *
   * Visual authority:
   * - game/gameplay-ui-v8-settings-polish.css
   *
   * IMPORTANT:
   * Keep the V1 contract identifiers intact.
   */

  if (window.__relayUnifiedOptionsUiV1) return;
  window.__relayUnifiedOptionsUiV1 = true;

  const LANGUAGE_KEY = 'relay-runner-language';
  const PRESENTATION_KEY = 'relay.runner.ui.preferences.v1';

  const LANGUAGES = [
    ['en', 'ENGLISH'],
    ['exyu', 'EX-YU'],
    ['es', 'ESPAÑOL'],
    ['de', 'DEUTSCH'],
  ];

  const defaults = Object.freeze({
    intelCards: true,
    allyIntel: true,
    eventPopups: true,
    tutorialHints: true,
  });

  /*
   * Prevent duplicate delegated listeners when the same host
   * gets mounted/rerendered multiple times.
   */
  const boundHosts = new WeakSet();

  /* ==========================================================================
     PRESENTATION STATE
     ========================================================================== */

  const readPresentation = () => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(PRESENTATION_KEY) || '{}'
      );

      return {
        ...defaults,
        ...(stored && typeof stored === 'object' ? stored : {}),
      };
    } catch {
      return { ...defaults };
    }
  };

  const writePresentation = value => {
    try {
      localStorage.setItem(
        PRESENTATION_KEY,
        JSON.stringify({
          ...defaults,
          ...value,
        })
      );
    } catch {
      /* Storage may be unavailable in restricted environments. */
    }
  };

  /* ==========================================================================
     GAME STATE
     ========================================================================== */

  const getState = () => loadState();

  const savePatch = patch => {
    saveState({
      ...getState(),
      ...patch,
    });
  };

  /* ==========================================================================
     LANGUAGE
     ========================================================================== */

  const getLanguage = () => {
    const value = localStorage.getItem(LANGUAGE_KEY);

    return LANGUAGES.some(([code]) => code === value)
      ? value
      : 'en';
  };

  const setLanguage = code => {
    const validCode = LANGUAGES.some(([candidate]) => candidate === code)
      ? code
      : 'en';

    try {
      localStorage.setItem(LANGUAGE_KEY, validCode);
    } catch {
      /* Storage may be unavailable. */
    }

    document.documentElement.lang =
      validCode === 'exyu'
        ? 'bs'
        : validCode;

    document.documentElement.dataset.language = validCode;

    window.dispatchEvent(
      new CustomEvent('relay-language-change', {
        detail: {
          code: validCode,
        },
      })
    );
  };

  /* ==========================================================================
     PRESENTATION VISIBILITY
     ========================================================================== */

  const syncPresentationClasses = prefs => {
    const safePrefs = {
      ...defaults,
      ...(prefs || {}),
    };

    document.body.classList.toggle(
      'relay-hide-intel',
      !safePrefs.intelCards
    );

    document.body.classList.toggle(
      'relay-hide-ally',
      !safePrefs.allyIntel
    );

    document.body.classList.toggle(
      'relay-hide-events',
      !safePrefs.eventPopups
    );

    document.body.classList.toggle(
      'relay-hide-tutorials',
      !safePrefs.tutorialHints
    );
  };

  /* ==========================================================================
     MINIMAL RUNTIME CSS
     --------------------------------------------------------------------------
     The main visual styling is intentionally NOT defined here.
     It belongs to gameplay-ui-v8-settings-polish.css.
     ========================================================================== */

  const injectStyles = () => {
    if (document.getElementById('relay-unified-options-style')) return;

    const style = document.createElement('style');

    style.id = 'relay-unified-options-style';

    style.textContent = `
      /*
       * Runtime compatibility layer for unified-options-ui-v1.
       * Visual authority remains gameplay-ui-v8-settings-polish.css.
       */

      #titlePanel.relay-options-unified,
      #pauseMenu.relay-options-unified{
        isolation:isolate;
      }

      #titlePanel.relay-options-unified .title-panel-card{
        min-width:0;
      }

      #pauseMenu.relay-options-unified #panelContent,
      #titlePanel.relay-options-unified #titlePanelContent{
        min-width:0;
        min-height:0;
      }

      #titlePanelContent.relay-legacy-cleared{
        display:none !important;
      }

      /*
       * Never allow hidden legacy options blocks to become visible
       * beside the canonical unified options UI.
       */
      .relay-options-shell [data-legacy-option],
      .relay-options-shell .legacy-option,
      .relay-options-shell .legacy-options-actions{
        display:none !important;
      }
    `;

    document.head.appendChild(style);
  };

  /* ==========================================================================
     MARKUP HELPERS
     ========================================================================== */

  const toggleMarkup = (
    key,
    label,
    detail,
    enabled
  ) => `
    <article class="relay-option-card">
      <div class="relay-option-copy">
        <strong>${label}</strong>
        <small>${detail}</small>
      </div>

      <button
        class="relay-toggle ${enabled ? 'is-on' : ''}"
        type="button"
        data-unified-toggle="${key}"
        aria-pressed="${enabled}"
      >
        ${enabled ? 'ON' : 'OFF'}
      </button>
    </article>
  `;

  const rangeMarkup = (
    key,
    label,
    value,
    detail
  ) => `
    <article class="relay-option-card">
      <div class="relay-option-copy">
        <strong>${label}</strong>
        <small>${detail}</small>
      </div>

      <div class="relay-range">
        <div class="relay-range-head">
          <span>LEVEL</span>
          <span
            class="relay-range-value"
            data-range-value="${key}"
          >
            ${Math.round(value * 100)}%
          </span>
        </div>

        <input
          data-unified-range="${key}"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value="${value}"
          aria-label="${label}"
        >
      </div>
    </article>
  `;

  /* ==========================================================================
     SETTINGS CONTENT
     ========================================================================== */

  const buildContent = () => {
    const state = getState();
    const prefs = readPresentation();

    const language =
      LANGUAGES.find(([code]) => code === getLanguage()) ||
      LANGUAGES[0];

    const musicVolume = Number.isFinite(Number(state.musicVolume))
      ? Number(state.musicVolume)
      : 0.55;

    const sfxVolume = Number.isFinite(Number(state.sfxVolume))
      ? Number(state.sfxVolume)
      : 0.7;

    return `
      <div class="relay-options-shell">

        <header class="relay-options-head">

          <div>
            <p class="relay-options-kicker">
              RELAY RUNNER // SYSTEM TERMINAL
            </p>

            <h2 class="relay-options-title">
              OPTIONS
            </h2>

            <p class="relay-options-subtitle">
              Configure the run without leaving the relay.
            </p>
          </div>

          <span class="relay-options-status">
            <i></i>
            SYSTEM READY
          </span>

        </header>

        <div class="relay-options-body">

          <div class="relay-options-grid">

            <!-- ==========================================================
                 GAMEPLAY
                 ========================================================== -->

            <section class="relay-options-section">

              <div class="relay-section-title">
                GAMEPLAY
              </div>

              ${toggleMarkup(
                'tutorialEnabled',
                'TUTORIAL',
                'Mission guidance and contextual lessons',
                state.tutorialEnabled !== false
              )}

              ${toggleMarkup(
                'screenShake',
                'SCREEN SHAKE',
                'Impact and camera feedback',
                !!state.screenShake
              )}

              ${toggleMarkup(
                'reducedMotion',
                'REDUCED MOTION',
                'Reduce presentation motion',
                !!state.reducedMotion
              )}

              ${toggleMarkup(
                'rain',
                'ATMOSPHERIC RAIN',
                'City weather ambience',
                !!state.rain
              )}

            </section>


            <!-- ==========================================================
                 AUDIO
                 ========================================================== -->

            <section class="relay-options-section">

              <div class="relay-section-title">
                AUDIO
              </div>

              ${toggleMarkup(
                'muted',
                'MASTER AUDIO',
                'Global game sound',
                !state.muted
              )}

              ${toggleMarkup(
                'aiVoice',
                'AI VOICE',
                'NIA / MARA spoken guidance',
                state.aiVoice !== false
              )}

              ${rangeMarkup(
                'musicVolume',
                'MUSIC',
                Math.max(0, Math.min(1, musicVolume)),
                'Background music level'
              )}

              ${rangeMarkup(
                'sfxVolume',
                'SFX',
                Math.max(0, Math.min(1, sfxVolume)),
                'Gameplay sound effects'
              )}

            </section>


            <!-- ==========================================================
                 INTERFACE
                 ========================================================== -->

            <section class="relay-options-section full">

              <div class="relay-section-title">
                INTERFACE
              </div>

              <div class="relay-options-grid">

                ${toggleMarkup(
                  'intelCards',
                  'INTEL CARDS',
                  'Enemy discovery cards and briefings',
                  prefs.intelCards
                )}

                ${toggleMarkup(
                  'allyIntel',
                  'ALLY INTEL',
                  'Side intel panels',
                  prefs.allyIntel
                )}

                ${toggleMarkup(
                  'eventPopups',
                  'EVENT POPUPS',
                  'Transient gameplay notices',
                  prefs.eventPopups
                )}

                ${toggleMarkup(
                  'tutorialHints',
                  'TUTORIAL HINTS',
                  'Contextual onboarding hints',
                  prefs.tutorialHints
                )}

              </div>

            </section>


            <!-- ==========================================================
                 SYSTEM
                 ========================================================== -->

            <section class="relay-options-section full">

              <div class="relay-section-title">
                SYSTEM
              </div>

              <!-- Language -->

              <div class="relay-option-card relay-select">

                <div class="relay-option-copy">
                  <strong>
                    GAME LANGUAGE
                  </strong>

                  <small>
                    Interface and supported system language
                  </small>
                </div>

                <button
                  class="relay-toggle"
                  type="button"
                  data-unified-language
                  aria-expanded="false"
                  aria-haspopup="listbox"
                >
                  🌐 ${language[1]}
                </button>

                <div
                  class="relay-language-menu hidden"
                  data-unified-language-menu
                  role="listbox"
                >
                  ${LANGUAGES.map(
                    ([code, name]) => `
                      <button
                        type="button"
                        data-unified-language-code="${code}"
                        class="${code === language[0] ? 'active' : ''}"
                        role="option"
                        aria-selected="${code === language[0]}"
                      >
                        ${name}
                      </button>
                    `
                  ).join('')}
                </div>

              </div>


              <!-- System actions -->

              <div class="relay-action-row">

                <button
                  class="relay-action"
                  type="button"
                  data-unified-fullscreen
                >
                  FULLSCREEN
                </button>

                <button
                  class="relay-action"
                  type="button"
                  data-unified-reset
                >
                  RESET OPTIONS
                </button>

                <button
                  class="relay-action"
                  type="button"
                  data-unified-controls
                  aria-expanded="false"
                >
                  CONTROL REFERENCE
                </button>

              </div>


              <!-- Controls -->

              <div
                class="relay-controls-strip"
                data-unified-controls-panel
                hidden
              >

                <span class="relay-key">
                  <kbd>A</kbd>
                  <span>MOVE</span>
                </span>

                <span class="relay-key">
                  <kbd>D</kbd>
                  <span>MOVE</span>
                </span>

                <span class="relay-key">
                  <kbd>SPACE</kbd>
                  <span>JUMP</span>
                </span>

                <span class="relay-key">
                  <kbd>E</kbd>
                  <span>FIRE</span>
                </span>

                <span class="relay-key">
                  <kbd>Q</kbd>
                  <span>BLADE</span>
                </span>

                <span class="relay-key">
                  <kbd>SHIFT</kbd>
                  <span>DASH</span>
                </span>

                <span class="relay-key">
                  <kbd>F</kbd>
                  <span>FLIGHT</span>
                </span>

                <span class="relay-key">
                  <kbd>ESC</kbd>
                  <span>PAUSE</span>
                </span>

              </div>

            </section>

          </div>
        </div>
      </div>
    `;
  };

  /* ==========================================================================
     EVENT HANDLER
     ========================================================================== */

  const bindHostEvents = host => {
    if (!host || boundHosts.has(host)) return;

    boundHosts.add(host);

    host.addEventListener('click', event => {

      const target = event.target;

      if (!(target instanceof Element)) return;


      /* ================================================================
         TOGGLE
         ================================================================ */

      const toggle = target.closest('[data-unified-toggle]');

      if (toggle) {

        const key = toggle.dataset.unifiedToggle;

        /*
         * Interface preferences live separately in PRESENTATION_KEY.
         */
        if (
          [
            'intelCards',
            'allyIntel',
            'eventPopups',
            'tutorialHints',
          ].includes(key)
        ) {

          const prefs = readPresentation();

          prefs[key] = !prefs[key];

          writePresentation(prefs);

          syncPresentationClasses(prefs);

          /*
           * Update only the current button where possible.
           * The full render is still used to keep both Home/Pause
           * Settings panels synchronized.
           */
        } else {

          const current = getState();

          const value =
            key === 'muted'
              ? !current.muted
              : !(current[key] ?? false);

          savePatch({
            [key]:
              key === 'muted'
                ? !value
                : value,
          });

          if (
            key === 'aiVoice' &&
            !value
          ) {
            window.speechSynthesis?.cancel?.();
          }

          window.dispatchEvent(
            new CustomEvent('relay-settings-change', {
              detail: {
                key,
                value,
              },
            })
          );
        }

        refreshOpenPanels();

        return;
      }


      /* ================================================================
         RANGE
         ================================================================ */

      const range = target.closest('[data-unified-range]');

      if (range) {

        const key = range.dataset.unifiedRange;

        const value = Number(range.value);

        if (!Number.isFinite(value)) return;

        savePatch({
          [key]: value,
        });

        window.dispatchEvent(
          new CustomEvent('relay-settings-change', {
            detail: {
              key,
              value,
            },
          })
        );

        const label = host.querySelector(
          `[data-range-value="${CSS.escape(key)}"]`
        );

        if (label) {
          label.textContent =
            `${Math.round(value * 100)}%`;
        }

        return;
      }


      /* ================================================================
         LANGUAGE MENU
         ================================================================ */

      const langButton =
        target.closest('[data-unified-language]');

      if (langButton) {

        event.stopPropagation();

        const menu =
          host.querySelector(
            '[data-unified-language-menu]'
          );

        if (!menu) return;

        const opened =
          menu.classList.toggle('hidden');

        langButton.setAttribute(
          'aria-expanded',
          String(!opened)
        );

        return;
      }


      /* ================================================================
         LANGUAGE ITEM
         ================================================================ */

      const langCode =
        target.closest(
          '[data-unified-language-code]'
        );

      if (langCode) {

        const code =
          langCode.dataset.unifiedLanguageCode;

        setLanguage(code);

        refreshOpenPanels();

        return;
      }


      /* ================================================================
         FULLSCREEN
         ================================================================ */

      const fullscreen =
        target.closest(
          '[data-unified-fullscreen]'
        );

      if (fullscreen) {

        (async () => {
          try {

            if (!document.fullscreenElement) {

              await document
                .documentElement
                .requestFullscreen?.();

            } else {

              await document
                .exitFullscreen?.();

            }

          } catch {
            /*
             * Fullscreen can be blocked by browser policy.
             */
          }
        })();

        return;
      }


      /* ================================================================
         RESET OPTIONS
         ================================================================ */

      const reset =
        target.closest(
          '[data-unified-reset]'
        );

      if (reset) {

        savePatch({
          muted:false,
          musicVolume:0.55,
          sfxVolume:0.7,
          screenShake:true,
          reducedMotion:false,
          rain:true,
          aiVoice:true,
          tutorialEnabled:true,
        });

        writePresentation({
          ...defaults,
        });

        setLanguage('en');

        syncPresentationClasses(
          readPresentation()
        );

        window.dispatchEvent(
          new CustomEvent(
            'relay-settings-change',
            {
              detail:{
                reset:true,
              },
            }
          )
        );

        refreshOpenPanels();

        return;
      }


      /* ================================================================
         CONTROL REFERENCE
         ================================================================ */

      const controlsButton =
        target.closest(
          '[data-unified-controls]'
        );

      if (controlsButton) {

        const panel =
          host.querySelector(
            '[data-unified-controls-panel]'
          );

        if (!panel) return;

        panel.hidden = !panel.hidden;

        controlsButton.setAttribute(
          'aria-expanded',
          String(!panel.hidden)
        );

        return;
      }

    }, {
      capture:false,
    });
  };

  /* ==========================================================================
     MOUNT
     ========================================================================== */

  const mount = (root, kind) => {

    if (!root) return false;

    injectStyles();

    root.classList.add(
      'relay-options-unified'
    );

    const host =
      kind === 'home'
        ? root.querySelector('#titlePanelContent')
        : root.querySelector('#panelContent');

    if (!host) return false;

    host.innerHTML = buildContent();

    /*
     * The legacy-cleared class belongs to the old
     * options implementation. Remove it so canonical
     * unified content is allowed to render.
     */
    host.classList.remove(
      'relay-legacy-cleared'
    );

    const controls =
      host.querySelector(
        '[data-unified-controls-panel]'
      );

    if (controls) {
      controls.hidden = true;
    }

    bindHostEvents(host);

    return true;
  };

  /* ==========================================================================
     HOME OPTIONS
     ========================================================================== */

  const renderHome = () => {

    const panel =
      document.getElementById(
        'titlePanel'
      );

    if (
      !panel ||
      panel.classList.contains('hidden')
    ) {
      return false;
    }

    const heading =
      document.getElementById(
        'titlePanelHeading'
      );

    if (!heading) return false;

    if (
      !/OPTIONS|RUN SETTINGS/i.test(
        heading.textContent || ''
      )
    ) {
      return false;
    }

    return mount(
      panel,
      'home'
    );
  };

  /* ==========================================================================
     PAUSE OPTIONS
     ========================================================================== */

  const renderPause = () => {

    const pause =
      document.getElementById(
        'pauseMenu'
      );

    if (
      !pause ||
      pause.classList.contains('hidden')
    ) {
      return false;
    }

    const active =
      pause.querySelector(
        '#panelContent'
      );

    const settingsTab =
      pause.querySelector(
        '[data-tab="settings"]'
      );

    if (!active) return false;

    if (
      !settingsTab ||
      !settingsTab.classList.contains('active')
    ) {
      return false;
    }

    return mount(
      pause,
      'pause'
    );
  };

  /* ==========================================================================
     REFRESH OPEN PANELS
     ========================================================================== */

  const refreshOpenPanels = () => {

    renderHome();

    renderPause();

    syncPresentationClasses(
      readPresentation()
    );
  };

  /* ==========================================================================
     INITIALIZATION
     ========================================================================== */

  const init = () => {

    injectStyles();

    syncPresentationClasses(
      readPresentation()
    );


    /* ================================================================
       OPEN HOME OPTIONS
       ================================================================ */

    document.addEventListener(
      'click',
      event => {

        const target = event.target;

        if (!(target instanceof Element)) {
          return;
        }

        const homeButton =
          target.closest(
            '[data-title-panel="controls"]'
          );

        if (homeButton) {

          event.preventDefault();

          event.stopImmediatePropagation();

          const panel =
            document.getElementById(
              'titlePanel'
            );

          const heading =
            document.getElementById(
              'titlePanelHeading'
            );

          panel?.classList.remove(
            'hidden'
          );

          if (heading) {

            heading.textContent =
              'OPTIONS';

            heading.className =
              'relay-options-title';
          }

          renderHome();

          return;
        }


        /* ============================================================
           OPEN PAUSE SETTINGS
           ============================================================ */

        const pauseSettings =
          target.closest(
            '#pauseMenu [data-tab="settings"]'
          );

        if (pauseSettings) {

          window.setTimeout(
            () => {
              renderPause();
            },
            0
          );
        }

      },
      true
    );


    /* ================================================================
       CLOSE LANGUAGE MENUS
       ================================================================ */

    document.addEventListener(
      'click',
      event => {

        const target = event.target;

        if (!(target instanceof Element)) {
          return;
        }

        if (
          !target.closest(
            '.relay-select'
          )
        ) {

          document
            .querySelectorAll(
              '.relay-language-menu'
            )
            .forEach(menu => {

              menu.classList.add(
                'hidden'
              );

              const owner =
                menu.parentElement?.querySelector(
                  '[data-unified-language]'
                );

              owner?.setAttribute(
                'aria-expanded',
                'false'
              );
            });
        }

      }
    );


    /* ================================================================
       MUTATION OBSERVERS
       ================================================================ */

    const titlePanel =
      document.getElementById(
        'titlePanel'
      );

    const pauseMenu =
      document.getElementById(
        'pauseMenu'
      );

    if (titlePanel) {

      new MutationObserver(
        () => {
          window.setTimeout(
            renderHome,
            0
          );
        }
      ).observe(
        titlePanel,
        {
          attributes:true,
          attributeFilter:['class'],
        }
      );
    }

    if (pauseMenu) {

      new MutationObserver(
        () => {
          window.setTimeout(
            renderPause,
            0
          );
        }
      ).observe(
        pauseMenu,
        {
          attributes:true,
          attributeFilter:['class'],
        }
      );
    }


    /* ================================================================
       EXTERNAL SETTINGS CHANGES
       ================================================================ */

    window.addEventListener(
      'relay-settings-change',
      () => {
        window.setTimeout(
          refreshOpenPanels,
          0
        );
      }
    );
  };


  /* ==========================================================================
     START
     ========================================================================== */

  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once:true,
      }
    );

  } else {

    init();

  }

})();
