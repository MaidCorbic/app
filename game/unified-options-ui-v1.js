```js
import { loadState, saveState } from './src/state.js';

(() => {
  'use strict';

  /* ============================================================
     RELAY RUNNER
     NEON TACTICAL / AAA GAME TERMINAL
     SETTINGS SYSTEM V2

     - Existing gameplay state remains authoritative.
     - Existing save/load remains authoritative.
     - Existing settings events remain supported.
     - Existing data-tab="settings" hook remains supported.
     - Desktop + mobile responsive.
     - No duplicate event listeners after rerenders.
     ============================================================ */

  if (window.__relayUnifiedOptionsUiV2) return;
  window.__relayUnifiedOptionsUiV2 = true;

  const LANGUAGE_KEY = 'relay-runner-language';
  const PRESENTATION_KEY = 'relay.runner.ui.preferences.v1';

  const LANGUAGES = [
    ['en', 'ENGLISH'],
    ['exyu', 'EX-YU'],
    ['es', 'ESPAÑOL'],
    ['de', 'DEUTSCH'],
  ];

  const PRESENTATION_DEFAULTS = Object.freeze({
    intelCards: true,
    allyIntel: true,
    eventPopups: true,
    tutorialHints: true,
  });

  const STATE_DEFAULTS = Object.freeze({
    muted: false,
    musicVolume: 0.55,
    sfxVolume: 0.70,
    screenShake: true,
    reducedMotion: false,
    rain: true,
    aiVoice: true,
    tutorialEnabled: true,
  });

  const PRESENTATION_KEYS = new Set(
    Object.keys(PRESENTATION_DEFAULTS)
  );

  /* ============================================================
     STATE
     ============================================================ */

  const getState = () => {
    try {
      return {
        ...STATE_DEFAULTS,
        ...(loadState() || {}),
      };
    } catch (error) {
      console.warn('[Relay Settings] loadState failed', error);

      return {
        ...STATE_DEFAULTS,
      };
    }
  };

  const savePatch = patch => {
    try {
      saveState({
        ...getState(),
        ...patch,
      });
    } catch (error) {
      console.warn('[Relay Settings] saveState failed', error);
    }
  };

  /* ============================================================
     PRESENTATION PREFERENCES
     ============================================================ */

  const readPresentation = () => {
    try {
      const raw = localStorage.getItem(
        PRESENTATION_KEY
      );

      const parsed = raw
        ? JSON.parse(raw)
        : {};

      return {
        ...PRESENTATION_DEFAULTS,
        ...(parsed && typeof parsed === 'object'
          ? parsed
          : {}),
      };
    } catch {
      return {
        ...PRESENTATION_DEFAULTS,
      };
    }
  };

  const writePresentation = value => {
    try {
      localStorage.setItem(
        PRESENTATION_KEY,
        JSON.stringify({
          ...PRESENTATION_DEFAULTS,
          ...value,
        })
      );
    } catch (error) {
      console.warn(
        '[Relay Settings] presentation save failed',
        error
      );
    }
  };

  /* ============================================================
     LANGUAGE
     ============================================================ */

  const getLanguage = () => {
    try {
      return (
        localStorage.getItem(LANGUAGE_KEY) ||
        'en'
      );
    } catch {
      return 'en';
    }
  };

  const setLanguage = code => {
    const valid = LANGUAGES.some(
      ([id]) => id === code
    );

    const safeCode = valid ? code : 'en';

    try {
      localStorage.setItem(
        LANGUAGE_KEY,
        safeCode
      );
    } catch {}

    document.documentElement.lang =
      safeCode === 'exyu'
        ? 'bs'
        : safeCode;

    document.documentElement.dataset.language =
      safeCode;

    window.dispatchEvent(
      new CustomEvent(
        'relay-language-change',
        {
          detail: {
            code: safeCode,
          },
        }
      )
    );
  };

  /* ============================================================
     PRESENTATION VISIBILITY
     ============================================================ */

  const syncPresentationClasses = prefs => {
    const body = document.body;

    if (!body) return;

    body.classList.toggle(
      'relay-hide-intel',
      prefs.intelCards === false
    );

    body.classList.toggle(
      'relay-hide-ally',
      prefs.allyIntel === false
    );

    body.classList.toggle(
      'relay-hide-events',
      prefs.eventPopups === false
    );

    body.classList.toggle(
      'relay-hide-tutorials',
      prefs.tutorialHints === false
    );
  };

  /* ============================================================
     EVENT DISPATCH
     ============================================================ */

  const emitSettingsChange = detail => {
    window.dispatchEvent(
      new CustomEvent(
        'relay-settings-change',
        {
          detail,
        }
      )
    );
  };

  /* ============================================================
     SAFE HELPERS
     ============================================================ */

  const escapeHtml = value =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const cssEscape = value => {
    try {
      return CSS.escape(String(value));
    } catch {
      return String(value).replace(
        /["\\]/g,
        '\\$&'
      );
    }
  };

  const clamp = (
    value,
    min,
    max
  ) =>
    Math.min(
      max,
      Math.max(min, value)
    );

  const normaliseVolume = value => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return 0.55;
    }

    return clamp(
      numeric,
      0,
      1
    );
  };

  /* ============================================================
     SETTING VALUE HELPERS
     ============================================================ */

  const getToggleState = (
    key,
    state,
    prefs
  ) => {
    if (
      PRESENTATION_KEYS.has(key)
    ) {
      return prefs[key] !== false;
    }

    if (key === 'muted') {
      return state.muted !== true;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        STATE_DEFAULTS,
        key
      )
    ) {
      return Boolean(
        state[key]
      );
    }

    return false;
  };

  const setToggleState = (
    key,
    nextValue
  ) => {
    if (
      PRESENTATION_KEYS.has(key)
    ) {
      const prefs =
        readPresentation();

      prefs[key] =
        Boolean(nextValue);

      writePresentation(prefs);

      syncPresentationClasses(
        prefs
      );

      emitSettingsChange({
        key,
        value: Boolean(nextValue),
        presentation: true,
      });

      return;
    }

    if (key === 'muted') {
      savePatch({
        muted:
          !Boolean(nextValue),
      });
    } else {
      savePatch({
        [key]:
          Boolean(nextValue),
      });
    }

    if (
      key === 'aiVoice' &&
      !Boolean(nextValue)
    ) {
      try {
        window.speechSynthesis?.cancel?.();
      } catch {}
    }

    emitSettingsChange({
      key,
      value:
        Boolean(nextValue),
      presentation: false,
    });
  };

  /* ============================================================
     TOGGLE MARKUP
     ============================================================ */

  const toggleMarkup = ({
    key,
    label,
    detail,
    enabled,
    tag = 'SYSTEM',
  }) => {
    const active =
      Boolean(enabled);

    return `
      <article
        class="nt-option-card"
        data-option-card="${escapeHtml(key)}"
      >

        <div class="nt-option-copy">

          <div class="nt-option-topline">
            <span class="nt-option-tag">
              ${escapeHtml(tag)}
            </span>
          </div>

          <strong>
            ${escapeHtml(label)}
          </strong>

          <small>
            ${escapeHtml(detail)}
          </small>

        </div>

        <button
          class="nt-toggle ${
            active
              ? 'is-on'
              : 'is-off'
          }"
          type="button"
          data-nt-toggle="${escapeHtml(key)}"
          aria-pressed="${active}"
          aria-label="${escapeHtml(
            `${label}: ${
              active
                ? 'ON'
                : 'OFF'
            }`
          )}"
        >

          <span class="nt-toggle-label">
            ${active ? 'ON' : 'OFF'}
          </span>

          <i aria-hidden="true"></i>

        </button>

      </article>
    `;
  };

  /* ============================================================
     RANGE MARKUP
     ============================================================ */

  const rangeMarkup = ({
    key,
    label,
    detail,
    value,
    tag = 'LEVEL',
  }) => {
    const safeValue =
      normaliseVolume(value);

    return `
      <article
        class="nt-option-card nt-option-card-range"
        data-option-card="${escapeHtml(key)}"
      >

        <div class="nt-option-copy">

          <div class="nt-option-topline">
            <span class="nt-option-tag">
              ${escapeHtml(tag)}
            </span>
          </div>

          <strong>
            ${escapeHtml(label)}
          </strong>

          <small>
            ${escapeHtml(detail)}
          </small>

        </div>

        <div class="nt-range-control">

          <div class="nt-range-head">
            <span>OUTPUT</span>

            <strong
              class="nt-range-value"
              data-nt-range-value="${escapeHtml(key)}"
            >
              ${Math.round(
                safeValue * 100
              )}%
            </strong>
          </div>

          <input
            class="nt-range"
            data-nt-range="${escapeHtml(key)}"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value="${safeValue}"
            aria-label="${escapeHtml(label)}"
          />

        </div>

      </article>
    `;
  };

  /* ============================================================
     LANGUAGE
     ============================================================ */

  const languageMarkup =
    currentLanguage => {
      const current =
        LANGUAGES.find(
          ([code]) =>
            code === currentLanguage
        ) ||
        LANGUAGES[0];

      return `
        <article
          class="nt-option-card nt-language-card"
          data-option-card="language"
        >

          <div class="nt-option-copy">

            <div class="nt-option-topline">
              <span class="nt-option-tag">
                SYSTEM
              </span>
            </div>

            <strong>
              GAME LANGUAGE
            </strong>

            <small>
              Interface and supported system language.
            </small>

          </div>

          <div class="nt-language-control">

            <button
              class="nt-select-button"
              type="button"
              data-nt-language-toggle
              aria-expanded="false"
              aria-haspopup="listbox"
            >

              <span class="nt-select-icon">
                ◎
              </span>

              <span
                data-nt-current-language
              >
                ${escapeHtml(
                  current[1]
                )}
              </span>

              <b aria-hidden="true">
                ⌄
              </b>

            </button>

            <div
              class="nt-language-menu"
              data-nt-language-menu
              role="listbox"
              hidden
            >

              ${LANGUAGES.map(
                ([code, name]) => `
                  <button
                    type="button"
                    role="option"
                    aria-selected="${
                      code === current[0]
                    }"
                    data-nt-language-code="${escapeHtml(
                      code
                    )}"
                    class="${
                      code ===
                      current[0]
                        ? 'active'
                        : ''
                    }"
                  >

                    <span>
                      ${escapeHtml(
                        name
                      )}
                    </span>

                    ${
                      code ===
                      current[0]
                        ? `
                          <i>
                            ACTIVE
                          </i>
                        `
                        : ''
                    }

                  </button>
                `
              ).join('')}

            </div>

          </div>

        </article>
      `;
    };

  /* ============================================================
     ACTION BUTTON
     ============================================================ */

  const actionMarkup = ({
    key,
    label,
    detail,
    primary = false,
  }) => `
    <button
      class="nt-action ${
        primary
          ? 'is-primary'
          : ''
      }"
      type="button"
      data-nt-action="${escapeHtml(key)}"
    >

      <span>
        ${escapeHtml(label)}
      </span>

      <small>
        ${escapeHtml(detail)}
      </small>

      <b aria-hidden="true">
        →
      </b>

    </button>
  `;

  /* ============================================================
     CONTROL REFERENCE
     ============================================================ */

  const controlsReferenceMarkup =
    () => `
      <div
        class="nt-controls-reference"
        data-nt-controls-panel
        hidden
      >

        <div class="nt-reference-head">

          <div>

            <span class="nt-section-kicker">
              INPUT MATRIX
            </span>

            <strong>
              CONTROL REFERENCE
            </strong>

          </div>

          <span class="nt-reference-state">
            LIVE
          </span>

        </div>

        <div class="nt-key-grid">

          ${[
            ['A', 'MOVE LEFT'],
            ['D', 'MOVE RIGHT'],
            ['SPACE', 'JUMP'],
            ['E', 'FIRE'],
            ['Q', 'BLADE'],
            ['SHIFT', 'DASH'],
            ['F', 'FLIGHT'],
            ['ESC', 'PAUSE'],
          ]
            .map(
              ([key, label]) => `
                <div class="nt-key">

                  <kbd>
                    ${escapeHtml(key)}
                  </kbd>

                  <span>
                    ${escapeHtml(label)}
                  </span>

                </div>
              `
            )
            .join('')}

        </div>

      </div>
    `;

  /* ============================================================
     FULL SETTINGS CONTENT
     ============================================================ */

  const buildContent = () => {
    const state = getState();
    const prefs =
      readPresentation();

    const currentLanguage =
      getLanguage();

    return `
      <div class="nt-settings-shell">

        <!-- HEADER -->
        <header
          class="nt-settings-header"
        >

          <div class="nt-brand-lockup">

            <span
              class="nt-brand-mark"
              aria-hidden="true"
            >
              R/
            </span>

            <div>

              <span
                class="nt-system-kicker"
              >
                RELAY RUNNER // SYSTEM TERMINAL
              </span>

              <h2>
                SETTINGS
              </h2>

              <p>
                Configure the run. Every change is applied live.
              </p>

            </div>

          </div>

          <div class="nt-status-block">

            <span
              class="nt-status-dot"
              aria-hidden="true"
            ></span>

            <div>

              <small>
                SYSTEM STATUS
              </small>

              <strong>
                ONLINE
              </strong>

            </div>

          </div>

        </header>

        <!-- SCROLL AREA -->
        <div
          class="nt-settings-scroll"
        >

          <div
            class="nt-settings-grid"
          >

            <!-- GAMEPLAY -->
            <section
              class="nt-section"
            >

              <div
                class="nt-section-heading"
              >

                <span
                  class="nt-section-number"
                >
                  01
                </span>

                <div>

                  <span
                    class="nt-section-kicker"
                  >
                    GAMEPLAY
                  </span>

                  <h3>
                    RUN SYSTEMS
                  </h3>

                </div>

              </div>

              <div
                class="nt-option-list"
              >

                ${toggleMarkup({
                  key:
                    'tutorialEnabled',
                  label:
                    'TUTORIAL',
                  detail:
                    'Mission guidance and contextual lessons.',
                  enabled:
                    state.tutorialEnabled !==
                    false,
                  tag:
                    'GAMEPLAY',
                })}

                ${toggleMarkup({
                  key:
                    'screenShake',
                  label:
                    'SCREEN SHAKE',
                  detail:
                    'Impact and camera feedback during movement.',
                  enabled:
                    Boolean(
                      state.screenShake
                    ),
                  tag:
                    'FEEDBACK',
                })}

                ${toggleMarkup({
                  key:
                    'reducedMotion',
                  label:
                    'REDUCED MOTION',
                  detail:
                    'Reduce presentation movement and transitions.',
                  enabled:
                    Boolean(
                      state.reducedMotion
                    ),
                  tag:
                    'ACCESS',
                })}

                ${toggleMarkup({
                  key:
                    'rain',
                  label:
                    'ATMOSPHERIC RAIN',
                  detail:
                    'Enable the live city weather presentation.',
                  enabled:
                    Boolean(
                      state.rain
                    ),
                  tag:
                    'WORLD',
                })}

              </div>

            </section>

            <!-- AUDIO -->
            <section
              class="nt-section"
            >

              <div
                class="nt-section-heading"
              >

                <span
                  class="nt-section-number"
                >
                  02
                </span>

                <div>

                  <span
                    class="nt-section-kicker"
                  >
                    AUDIO
                  </span>

                  <h3>
                    SOUND SYSTEM
                  </h3>

                </div>

              </div>

              <div
                class="nt-option-list"
              >

                ${toggleMarkup({
                  key:
                    'muted',
                  label:
                    'MASTER AUDIO',
                  detail:
                    'Global game sound output.',
                  enabled:
                    state.muted !==
                    true,
                  tag:
                    'MASTER',
                })}

                ${toggleMarkup({
                  key:
                    'aiVoice',
                  label:
                    'AI VOICE',
                  detail:
                    'Enable NIA / MARA spoken guidance.',
                  enabled:
                    state.aiVoice !==
                    false,
                  tag:
                    'VOICE',
                })}

                ${rangeMarkup({
                  key:
                    'musicVolume',
                  label:
                    'MUSIC',
                  detail:
                    'Background music output level.',
                  value:
                    state.musicVolume,
                  tag:
                    'MUSIC',
                })}

                ${rangeMarkup({
                  key:
                    'sfxVolume',
                  label:
                    'SFX',
                  detail:
                    'Gameplay sound effect output.',
                  value:
                    state.sfxVolume,
                  tag:
                    'SFX',
                })}

              </div>

            </section>

            <!-- INTERFACE -->
            <section
              class="nt-section nt-section-wide"
            >

              <div
                class="nt-section-heading"
              >

                <span
                  class="nt-section-number"
                >
                  03
                </span>

                <div>

                  <span
                    class="nt-section-kicker"
                  >
                    INTERFACE
                  </span>

                  <h3>
                    VISUAL INTELLIGENCE
                  </h3>

                </div>

              </div>

              <div
                class="nt-interface-grid"
              >

                ${toggleMarkup({
                  key:
                    'intelCards',
                  label:
                    'INTEL CARDS',
                  detail:
                    'Enemy discovery cards and briefings.',
                  enabled:
                    prefs.intelCards !==
                    false,
                  tag:
                    'HUD',
                })}

                ${toggleMarkup({
                  key:
                    'allyIntel',
                  label:
                    'ALLY INTEL',
                  detail:
                    'Side intelligence and ally panels.',
                  enabled:
                    prefs.allyIntel !==
                    false,
                  tag:
                    'HUD',
                })}

                ${toggleMarkup({
                  key:
                    'eventPopups',
                  label:
                    'EVENT POPUPS',
                  detail:
                    'Transient notices during gameplay.',
                  enabled:
                    prefs.eventPopups !==
                    false,
                  tag:
                    'HUD',
                })}

                ${toggleMarkup({
                  key:
                    'tutorialHints',
                  label:
                    'TUTORIAL HINTS',
                  detail:
                    'Contextual onboarding hints.',
                  enabled:
                    prefs.tutorialHints !==
                    false,
                  tag:
                    'HUD',
                })}

              </div>

            </section>

            <!-- SYSTEM -->
            <section
              class="nt-section nt-section-wide"
            >

              <div
                class="nt-section-heading"
              >

                <span
                  class="nt-section-number"
                >
                  04
                </span>

                <div>

                  <span
                    class="nt-section-kicker"
                  >
                    SYSTEM
                  </span>

                  <h3>
                    TERMINAL
                  </h3>

                </div>

              </div>

              <div
                class="nt-system-stack"
              >

                ${languageMarkup(
                  currentLanguage
                )}

                <div
                  class="nt-action-grid"
                >

                  ${actionMarkup({
                    key:
                      'fullscreen',
                    label:
                      'FULLSCREEN',
                    detail:
                      'DISPLAY MODE',
                    primary:
                      true,
                  })}

                  ${actionMarkup({
                    key:
                      'controls',
                    label:
                      'CONTROLS',
                    detail:
                      'OPEN INPUT MATRIX',
                  })}

                  ${actionMarkup({
                    key:
                      'reset',
                    label:
                      'RESET OPTIONS',
                    detail:
                      'RESTORE DEFAULTS',
                  })}

                </div>

                ${controlsReferenceMarkup()}

              </div>

            </section>

          </div>

        </div>

        <!-- FOOTER -->
        <footer
          class="nt-settings-footer"
        >

          <div
            class="nt-footer-left"
          >

            <span
              class="nt-footer-dot"
              aria-hidden="true"
            ></span>

            <span>
              CHANGES APPLY LIVE
            </span>

          </div>

          <div
            class="nt-footer-right"
          >

            <span>
              RELAY OS
            </span>

            <b>
              NT / 02
            </b>

          </div>

        </footer>

      </div>
    `;
  };

  /* ============================================================
     CSS
     ============================================================ */

  const injectStyles = () => {
    if (
      document.getElementById(
        'relay-neon-tactical-settings-style'
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        'style'
      );

    style.id =
      'relay-neon-tactical-settings-style';

    style.textContent = `

      /* ========================================================
         CORE VARIABLES
         ======================================================== */

      #pauseMenu.relay-options-unified,
      #titlePanel.relay-options-unified {

        --nt-bg: #02060b;
        --nt-bg-2: #07121d;

        --nt-panel: #091925;
        --nt-panel-2: #0c2231;

        --nt-cyan: #67e8f9;
        --nt-cyan-2: #22d3ee;
        --nt-blue: #38bdf8;

        --nt-lime: #a3ff76;

        --nt-white: #f4fcff;
        --nt-text: #d8eaf3;
        --nt-muted: #91a8b8;
        --nt-dim: #607a8c;

        --nt-line:
          rgba(103,232,249,.16);

        --nt-line-strong:
          rgba(103,232,249,.38);

        --nt-shadow:
          0 35px 100px rgba(0,0,0,.75),
          0 0 50px rgba(34,211,238,.07);

        --nt-cut:
          polygon(
            0 14px,
            14px 0,
            calc(100% - 14px) 0,
            100% 14px,
            100% calc(100% - 14px),
            calc(100% - 14px) 100%,
            14px 100%,
            0 calc(100% - 14px)
          );

        --nt-cut-small:
          polygon(
            0 9px,
            9px 0,
            calc(100% - 9px) 0,
            100% 9px,
            100% calc(100% - 9px),
            calc(100% - 9px) 100%,
            9px 100%,
            0 calc(100% - 9px)
          );
      }

      /* ========================================================
         GLOBAL SETTINGS ISOLATION
         ======================================================== */

      #pauseMenu.relay-options-unified *,
      #titlePanel.relay-options-unified * {
        box-sizing: border-box;
      }

      #pauseMenu.relay-options-unified,
      #titlePanel.relay-options-unified {
        isolation: isolate !important;
      }

      /* ========================================================
         SETTINGS SHELL
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-settings-shell,
      #titlePanel.relay-options-unified
      .nt-settings-shell {

        position: relative;

        width: 100%;
        min-width: 0;
        min-height: 0;

        display: grid;

        grid-template-rows:
          auto
          minmax(0,1fr)
          auto;

        overflow: hidden;

        background:
          radial-gradient(
            circle at 90% 0%,
            rgba(56,189,248,.10),
            transparent 28%
          ),
          radial-gradient(
            circle at 0% 100%,
            rgba(34,211,238,.045),
            transparent 31%
          ),
          linear-gradient(
            145deg,
            #081723 0%,
            #030910 62%,
            #02050a 100%
          );

        color:
          var(--nt-white);

        isolation: isolate;
      }

      #pauseMenu.relay-options-unified
      .nt-settings-shell::before,
      #titlePanel.relay-options-unified
      .nt-settings-shell::before {

        content: "";

        position: absolute;

        inset: 0;

        pointer-events: none;

        background:
          repeating-linear-gradient(
            180deg,
            rgba(255,255,255,.012) 0,
            rgba(255,255,255,.012) 1px,
            transparent 1px,
            transparent 5px
          );

        opacity: .22;

        mix-blend-mode: screen;
      }

      #pauseMenu.relay-options-unified
      .nt-settings-shell::after,
      #titlePanel.relay-options-unified
      .nt-settings-shell::after {

        content: "";

        position: absolute;

        left: 0;
        top: 0;

        width: 38%;
        height: 2px;

        background:
          linear-gradient(
            90deg,
            transparent,
            var(--nt-cyan),
            transparent
          );

        box-shadow:
          0 0 12px
          rgba(103,232,249,.45);

        opacity: .8;

        pointer-events: none;
      }

      /* ========================================================
         HEADER
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-settings-header,
      #titlePanel.relay-options-unified
      .nt-settings-header {

        min-width: 0;

        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 28px;

        padding:
          25px 29px 21px;

        border-bottom:
          1px solid
          rgba(103,232,249,.10);

        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.027),
            transparent
          );
      }

      #pauseMenu.relay-options-unified
      .nt-brand-lockup,
      #titlePanel.relay-options-unified
      .nt-brand-lockup {

        min-width: 0;

        display: flex;

        align-items: center;

        gap: 16px;
      }

      #pauseMenu.relay-options-unified
      .nt-brand-mark,
      #titlePanel.relay-options-unified
      .nt-brand-mark {

        flex: 0 0 auto;

        width: 58px;
        height: 58px;

        display: grid;

        place-items: center;

        color:
          var(--nt-cyan);

        background:
          linear-gradient(
            145deg,
            rgba(34,211,238,.12),
            rgba(56,189,248,.025)
          );

        border:
          1px solid
          rgba(103,232,249,.36);

        clip-path:
          var(--nt-cut);

        box-shadow:
          inset 0 0 18px
          rgba(34,211,238,.05),
          0 0 28px
          rgba(34,211,238,.08);

        font:
          950 21px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;
      }

      #pauseMenu.relay-options-unified
      .nt-system-kicker,
      #titlePanel.relay-options-unified
      .nt-system-kicker {

        display: block;

        margin: 0 0 8px;

        color:
          var(--nt-cyan);

        font:
          900 10px/1.1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .20em;
      }

      #pauseMenu.relay-options-unified
      .nt-settings-header h2,
      #titlePanel.relay-options-unified
      .nt-settings-header h2 {

        margin: 0;

        color:
          var(--nt-white);

        font:
          950 clamp(27px, 3.3vw, 40px)/.95
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .075em;

        text-shadow:
          0 0 22px
          rgba(103,232,249,.08);
      }

      #pauseMenu.relay-options-unified
      .nt-settings-header p,
      #titlePanel.relay-options-unified
      .nt-settings-header p {

        margin:
          8px 0 0;

        color:
          var(--nt-muted);

        font:
          650 12px/1.45
          system-ui,
          sans-serif;
      }

      /* ========================================================
         STATUS
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-status-block,
      #titlePanel.relay-options-unified
      .nt-status-block {

        flex: 0 0 auto;

        display: flex;

        align-items: center;

        gap: 10px;

        padding:
          10px 12px;

        background:
          rgba(163,255,118,.035);

        border:
          1px solid
          rgba(163,255,118,.24);

        clip-path:
          var(--nt-cut-small);
      }

      #pauseMenu.relay-options-unified
      .nt-status-dot,
      #titlePanel.relay-options-unified
      .nt-status-dot {

        width: 9px;
        height: 9px;

        border-radius: 50%;

        background:
          var(--nt-lime);

        box-shadow:
          0 0 5px
          var(--nt-lime),
          0 0 19px
          rgba(163,255,118,.62);

        animation:
          nt-status-pulse 1.8s
          ease-in-out infinite;
      }

      #pauseMenu.relay-options-unified
      .nt-status-block small,
      #titlePanel.relay-options-unified
      .nt-status-block small {

        display: block;

        color:
          var(--nt-dim);

        font:
          800 8px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .16em;
      }

      #pauseMenu.relay-options-unified
      .nt-status-block strong,
      #titlePanel.relay-options-unified
      .nt-status-block strong {

        display: block;

        margin-top: 4px;

        color:
          var(--nt-lime);

        font:
          950 10px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .14em;
      }

      @keyframes nt-status-pulse {
        0%,100% {
          opacity: .55;
          transform: scale(.9);
        }

        50% {
          opacity: 1;
          transform: scale(1);
        }
      }

      /* ========================================================
         SCROLL
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-settings-scroll,
      #titlePanel.relay-options-unified
      .nt-settings-scroll {

        min-height: 0;

        overflow:
          auto;

        padding:
          22px 24px 25px;

        -webkit-overflow-scrolling:
          touch;

        overscroll-behavior:
          contain;

        scrollbar-width:
          thin;

        scrollbar-color:
          rgba(103,232,249,.34)
          transparent;
      }

      #pauseMenu.relay-options-unified
      .nt-settings-scroll::-webkit-scrollbar,
      #titlePanel.relay-options-unified
      .nt-settings-scroll::-webkit-scrollbar {
        width: 6px;
      }

      #pauseMenu.relay-options-unified
      .nt-settings-scroll::-webkit-scrollbar-track,
      #titlePanel.relay-options-unified
      .nt-settings-scroll::-webkit-scrollbar-track {
        background:
          transparent;
      }

      #pauseMenu.relay-options-unified
      .nt-settings-scroll::-webkit-scrollbar-thumb,
      #titlePanel.relay-options-unified
      .nt-settings-scroll::-webkit-scrollbar-thumb {
        background:
          rgba(103,232,249,.24);

        border-radius:
          999px;
      }

      /* ========================================================
         GRID
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-settings-grid,
      #titlePanel.relay-options-unified
      .nt-settings-grid {

        display: grid;

        grid-template-columns:
          repeat(2,minmax(0,1fr));

        align-items: start;

        gap: 18px;
      }

      #pauseMenu.relay-options-unified
      .nt-section,
      #titlePanel.relay-options-unified
      .nt-section {

        min-width: 0;

        display: grid;

        gap: 14px;

        padding: 17px;

        background:
          linear-gradient(
            150deg,
            rgba(10,28,43,.96),
            rgba(3,10,17,.985)
          );

        border:
          1px solid
          rgba(103,232,249,.11);

        clip-path:
          var(--nt-cut);

        box-shadow:
          inset 0 1px
          rgba(255,255,255,.035),
          0 15px 34px
          rgba(0,0,0,.22);
      }

      #pauseMenu.relay-options-unified
      .nt-section-wide,
      #titlePanel.relay-options-unified
      .nt-section-wide {
        grid-column:
          1 / -1;
      }

      /* ========================================================
         SECTION HEADING
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-section-heading,
      #titlePanel.relay-options-unified
      .nt-section-heading {

        min-width: 0;

        display: flex;

        align-items: center;

        gap: 12px;

        padding-bottom: 11px;

        border-bottom:
          1px solid
          rgba(103,232,249,.08);
      }

      #pauseMenu.relay-options-unified
      .nt-section-number,
      #titlePanel.relay-options-unified
      .nt-section-number {

        flex: 0 0 auto;

        width: 34px;
        height: 34px;

        display: grid;

        place-items: center;

        color:
          var(--nt-cyan);

        background:
          rgba(34,211,238,.045);

        border:
          1px solid
          rgba(103,232,249,.28);

        clip-path:
          var(--nt-cut-small);

        font:
          900 10px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;
      }

      #pauseMenu.relay-options-unified
      .nt-section-kicker,
      #titlePanel.relay-options-unified
      .nt-section-kicker {

        display: block;

        margin-bottom: 4px;

        color:
          var(--nt-cyan);

        font:
          900 8px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .18em;
      }

      #pauseMenu.relay-options-unified
      .nt-section-heading h3,
      #titlePanel.relay-options-unified
      .nt-section-heading h3 {

        margin: 0;

        color:
          var(--nt-white);

        font:
          900 15px/1.05
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .08em;
      }

      /* ========================================================
         OPTION LIST
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-option-list,
      #titlePanel.relay-options-unified
      .nt-option-list {

        display: grid;

        gap: 9px;
      }

      #pauseMenu.relay-options-unified
      .nt-interface-grid,
      #titlePanel.relay-options-unified
      .nt-interface-grid {

        display: grid;

        grid-template-columns:
          repeat(4,minmax(0,1fr));

        gap: 9px;
      }

      /* ========================================================
         OPTION CARD
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-option-card,
      #titlePanel.relay-options-unified
      .nt-option-card {

        position: relative;

        min-width: 0;

        display: grid;

        grid-template-columns:
          minmax(0,1fr)
          auto;

        align-items: center;

        gap: 15px;

        min-height:
          82px;

        padding:
          13px 14px;

        background:
          linear-gradient(
            150deg,
            rgba(12,32,49,.92),
            rgba(3,10,17,.99)
          );

        border:
          1px solid
          rgba(103,232,249,.09);

        clip-path:
          var(--nt-cut-small);

        transition:
          border-color .15s ease,
          transform .15s ease,
          box-shadow .15s ease,
          background .15s ease;
      }

      #pauseMenu.relay-options-unified
      .nt-option-card::before,
      #titlePanel.relay-options-unified
      .nt-option-card::before {

        content: "";

        position: absolute;

        left: 0;
        top: 0;
        bottom: 0;

        width: 2px;

        background:
          linear-gradient(
            180deg,
            transparent,
            var(--nt-cyan),
            transparent
          );

        opacity: .18;

        pointer-events: none;
      }

      #pauseMenu.relay-options-unified
      .nt-option-card:hover,
      #titlePanel.relay-options-unified
      .nt-option-card:hover {

        border-color:
          rgba(103,232,249,.25);

        background:
          linear-gradient(
            150deg,
            rgba(13,38,58,.96),
            rgba(4,12,20,.995)
          );

        transform:
          translateY(-1px);

        box-shadow:
          0 12px 26px
          rgba(0,0,0,.25),
          0 0 20px
          rgba(34,211,238,.04);
      }

      /* ========================================================
         TEXT
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-option-copy,
      #titlePanel.relay-options-unified
      .nt-option-copy {

        min-width: 0;
      }

      #pauseMenu.relay-options-unified
      .nt-option-topline,
      #titlePanel.relay-options-unified
      .nt-option-topline {

        min-height:
          12px;

        margin-bottom:
          5px;
      }

      #pauseMenu.relay-options-unified
      .nt-option-tag,
      #titlePanel.relay-options-unified
      .nt-option-tag {

        color:
          var(--nt-dim);

        font:
          850 8px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .13em;
      }

      #pauseMenu.relay-options-unified
      .nt-option-copy strong,
      #titlePanel.relay-options-unified
      .nt-option-copy strong {

        display: block;

        min-width: 0;

        color:
          var(--nt-white);

        font:
          950 12px/1.18
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .07em;

        white-space:
          normal;

        overflow-wrap:
          anywhere;
      }

      #pauseMenu.relay-options-unified
      .nt-option-copy small,
      #titlePanel.relay-options-unified
      .nt-option-copy small {

        display: block;

        margin-top:
          5px;

        color:
          var(--nt-muted);

        font:
          650 11px/1.38
          system-ui,
          sans-serif;

        white-space:
          normal;

        overflow-wrap:
          anywhere;
      }

      /* ========================================================
         TOGGLE
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-toggle,
      #titlePanel.relay-options-unified
      .nt-toggle {

        flex:
          0 0 auto;

        width:
          96px;

        height:
          39px;

        display: grid;

        grid-template-columns:
          1fr 10px;

        align-items:
          center;

        gap:
          8px;

        padding:
          0 10px;

        color:
          var(--nt-muted);

        background:
          rgba(2,8,14,.96);

        border:
          1px solid
          rgba(103,232,249,.19);

        clip-path:
          var(--nt-cut-small);

        cursor:
          pointer;

        font:
          950 10px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .12em;

        touch-action:
          manipulation;

        transition:
          border-color .14s ease,
          color .14s ease,
          background .14s ease,
          transform .12s ease,
          box-shadow .14s ease;
      }

      #pauseMenu.relay-options-unified
      .nt-toggle:hover,
      #titlePanel.relay-options-unified
      .nt-toggle:hover,
      #pauseMenu.relay-options-unified
      .nt-toggle:focus-visible,
      #titlePanel.relay-options-unified
      .nt-toggle:focus-visible {

        outline:
          none;

        border-color:
          var(--nt-cyan);

        color:
          var(--nt-cyan);

        box-shadow:
          0 0 17px
          rgba(103,232,249,.07);
      }

      #pauseMenu.relay-options-unified
      .nt-toggle:active,
      #titlePanel.relay-options-unified
      .nt-toggle:active {

        transform:
          scale(.97);
      }

      #pauseMenu.relay-options-unified
      .nt-toggle i,
      #titlePanel.relay-options-unified
      .nt-toggle i {

        width:
          9px;

        height:
          9px;

        display:
          block;

        border-radius:
          50%;

        background:
          #425568;

        transition:
          background .15s ease,
          box-shadow .15s ease;
      }

      #pauseMenu.relay-options-unified
      .nt-toggle.is-on,
      #titlePanel.relay-options-unified
      .nt-toggle.is-on {

        color:
          var(--nt-lime);

        border-color:
          rgba(163,255,118,.38);

        background:
          rgba(163,255,118,.035);
      }

      #pauseMenu.relay-options-unified
      .nt-toggle.is-on i,
      #titlePanel.relay-options-unified
      .nt-toggle.is-on i {

        background:
          var(--nt-lime);

        box-shadow:
          0 0 7px
          var(--nt-lime),
          0 0 15px
          rgba(163,255,118,.55);
      }

      /* ========================================================
         RANGE
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-option-card-range,
      #titlePanel.relay-options-unified
      .nt-option-card-range {

        grid-template-columns:
          minmax(145px,.8fr)
          minmax(145px,1.2fr);
      }

      #pauseMenu.relay-options-unified
      .nt-range-control,
      #titlePanel.relay-options-unified
      .nt-range-control {

        min-width:
          0;

        display:
          grid;

        gap:
          7px;
      }

      #pauseMenu.relay-options-unified
      .nt-range-head,
      #titlePanel.relay-options-unified
      .nt-range-head {

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        gap:
          10px;

        color:
          var(--nt-dim);

        font:
          800 8px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .12em;
      }

      #pauseMenu.relay-options-unified
      .nt-range-value,
      #titlePanel.relay-options-unified
      .nt-range-value {

        color:
          var(--nt-cyan);

        font:
          950 10px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;
      }

      #pauseMenu.relay-options-unified
      .nt-range,
      #titlePanel.relay-options-unified
      .nt-range {

        width:
          100%;

        height:
          24px;

        margin:
          0;

        accent-color:
          var(--nt-cyan);

        cursor:
          pointer;

        touch-action:
          pan-x;
      }

      /* ========================================================
         LANGUAGE
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-language-card,
      #titlePanel.relay-options-unified
      .nt-language-card {

        overflow:
          visible;
      }

      #pauseMenu.relay-options-unified
      .nt-language-control,
      #titlePanel.relay-options-unified
      .nt-language-control {

        position:
          relative;

        min-width:
          180px;
      }

      #pauseMenu.relay-options-unified
      .nt-select-button,
      #titlePanel.relay-options-unified
      .nt-select-button {

        width:
          100%;

        min-height:
          42px;

        display:
          grid;

        grid-template-columns:
          auto minmax(0,1fr) auto;

        align-items:
          center;

        gap:
          8px;

        padding:
          0 12px;

        color:
          var(--nt-white);

        background:
          rgba(2,8,14,.97);

        border:
          1px solid
          rgba(103,232,249,.18);

        clip-path:
          var(--nt-cut-small);

        cursor:
          pointer;

        font:
          900 10px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .08em;
      }

      #pauseMenu.relay-options-unified
      .nt-select-button:hover,
      #titlePanel.relay-options-unified
      .nt-select-button:hover {

        border-color:
          var(--nt-cyan);

        color:
          var(--nt-cyan);
      }

      #pauseMenu.relay-options-unified
      .nt-select-icon,
      #titlePanel.relay-options-unified
      .nt-select-icon {

        color:
          var(--nt-cyan);

        font-size:
          14px;
      }

      #pauseMenu.relay-options-unified
      .nt-select-button b,
      #titlePanel.relay-options-unified
      .nt-select-button b {

        color:
          var(--nt-cyan);

        font-size:
          13px;
      }

      #pauseMenu.relay-options-unified
      .nt-language-menu,
      #titlePanel.relay-options-unified
      .nt-language-menu {

        position:
          absolute;

        right:
          0;

        top:
          calc(100% + 8px);

        z-index:
          150;

        width:
          225px;

        display:
          grid;

        gap:
          4px;

        padding:
          7px;

        background:
          rgba(3,9,16,.995);

        border:
          1px solid
          rgba(103,232,249,.23);

        clip-path:
          var(--nt-cut-small);

        box-shadow:
          0 25px 55px
          rgba(0,0,0,.7),
          0 0 25px
          rgba(34,211,238,.045);
      }

      #pauseMenu.relay-options-unified
      .nt-language-menu[hidden],
      #titlePanel.relay-options-unified
      .nt-language-menu[hidden] {

        display:
          none;
      }

      #pauseMenu.relay-options-unified
      .nt-language-menu button,
      #titlePanel.relay-options-unified
      .nt-language-menu button {

        min-height:
          39px;

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        gap:
          10px;

        padding:
          0 10px;

        color:
          var(--nt-text);

        background:
          rgba(255,255,255,.014);

        border:
          1px solid
          transparent;

        clip-path:
          var(--nt-cut-small);

        cursor:
          pointer;

        text-align:
          left;

        font:
          850 9px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .08em;
      }

      #pauseMenu.relay-options-unified
      .nt-language-menu button:hover,
      #pauseMenu.relay-options-unified
      .nt-language-menu button.active,
      #titlePanel.relay-options-unified
      .nt-language-menu button:hover,
      #titlePanel.relay-options-unified
      .nt-language-menu button.active {

        color:
          var(--nt-cyan);

        background:
          rgba(103,232,249,.05);

        border-color:
          rgba(103,232,249,.18);
      }

      #pauseMenu.relay-options-unified
      .nt-language-menu button i,
      #titlePanel.relay-options-unified
      .nt-language-menu button i {

        color:
          var(--nt-lime);

        font:
          850 7px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        font-style:
          normal;
      }

      /* ========================================================
         ACTIONS
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-action-grid,
      #titlePanel.relay-options-unified
      .nt-action-grid {

        display:
          grid;

        grid-template-columns:
          repeat(3,minmax(0,1fr));

        gap:
          10px;
      }

      #pauseMenu.relay-options-unified
      .nt-action,
      #titlePanel.relay-options-unified
      .nt-action {

        min-width:
          0;

        min-height:
          66px;

        display:
          grid;

        grid-template-columns:
          minmax(0,1fr) auto;

        align-items:
          center;

        gap:
          10px;

        padding:
          10px 13px;

        color:
          var(--nt-white);

        background:
          linear-gradient(
            145deg,
            rgba(10,27,43,.96),
            rgba(3,9,15,.99)
          );

        border:
          1px solid
          rgba(103,232,249,.12);

        clip-path:
          var(--nt-cut-small);

        cursor:
          pointer;

        text-align:
          left;
      }

      #pauseMenu.relay-options-unified
      .nt-action:hover,
      #titlePanel.relay-options-unified
      .nt-action:hover,
      #pauseMenu.relay-options-unified
      .nt-action:focus-visible,
      #titlePanel.relay-options-unified
      .nt-action:focus-visible {

        outline:
          none;

        border-color:
          var(--nt-cyan);

        box-shadow:
          0 12px 25px
          rgba(0,0,0,.25),
          0 0 20px
          rgba(34,211,238,.05);

        transform:
          translateY(-1px);
      }

      #pauseMenu.relay-options-unified
      .nt-action:active,
      #titlePanel.relay-options-unified
      .nt-action:active {

        transform:
          scale(.985);
      }

      #pauseMenu.relay-options-unified
      .nt-action span,
      #titlePanel.relay-options-unified
      .nt-action span {

        display:
          block;

        color:
          var(--nt-white);

        font:
          950 10px/1.1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .08em;
      }

      #pauseMenu.relay-options-unified
      .nt-action small,
      #titlePanel.relay-options-unified
      .nt-action small {

        display:
          block;

        margin-top:
          5px;

        color:
          var(--nt-muted);

        font:
          650 9px/1.25
          system-ui,
          sans-serif;
      }

      #pauseMenu.relay-options-unified
      .nt-action b,
      #titlePanel.relay-options-unified
      .nt-action b {

        color:
          var(--nt-cyan);

        font:
          950 19px/1
          system-ui,
          sans-serif;
      }

      #pauseMenu.relay-options-unified
      .nt-action.is-primary,
      #titlePanel.relay-options-unified
      .nt-action.is-primary {

        border-color:
          rgba(103,232,249,.28);

        background:
          linear-gradient(
            145deg,
            rgba(19,58,79,.92),
            rgba(4,16,25,.99)
          );
      }

      /* ========================================================
         CONTROL REFERENCE
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-controls-reference,
      #titlePanel.relay-options-unified
      .nt-controls-reference {

        display:
          grid;

        gap:
          12px;

        padding:
          14px;

        background:
          rgba(2,8,14,.74);

        border:
          1px solid
          rgba(103,232,249,.10);

        clip-path:
          var(--nt-cut-small);
      }

      #pauseMenu.relay-options-unified
      .nt-controls-reference[hidden],
      #titlePanel.relay-options-unified
      .nt-controls-reference[hidden] {

        display:
          none;
      }

      #pauseMenu.relay-options-unified
      .nt-reference-head,
      #titlePanel.relay-options-unified
      .nt-reference-head {

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        gap:
          10px;
      }

      #pauseMenu.relay-options-unified
      .nt-reference-head strong,
      #titlePanel.relay-options-unified
      .nt-reference-head strong {

        display:
          block;

        color:
          var(--nt-white);

        font:
          900 10px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .1em;
      }

      #pauseMenu.relay-options-unified
      .nt-reference-state,
      #titlePanel.relay-options-unified
      .nt-reference-state {

        padding:
          6px 8px;

        color:
          var(--nt-lime);

        background:
          rgba(163,255,118,.025);

        border:
          1px solid
          rgba(163,255,118,.20);

        clip-path:
          var(--nt-cut-small);

        font:
          850 7px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .12em;
      }

      #pauseMenu.relay-options-unified
      .nt-key-grid,
      #titlePanel.relay-options-unified
      .nt-key-grid {

        display:
          grid;

        grid-template-columns:
          repeat(4,minmax(0,1fr));

        gap:
          8px;
      }

      #pauseMenu.relay-options-unified
      .nt-key,
      #titlePanel.relay-options-unified
      .nt-key {

        min-width:
          0;

        min-height:
          42px;

        display:
          flex;

        align-items:
          center;

        gap:
          8px;

        padding:
          7px 8px;

        color:
          var(--nt-muted);

        background:
          rgba(255,255,255,.014);

        border:
          1px solid
          rgba(103,232,249,.07);

        clip-path:
          var(--nt-cut-small);
      }

      #pauseMenu.relay-options-unified
      .nt-key kbd,
      #titlePanel.relay-options-unified
      .nt-key kbd {

        min-width:
          32px;

        display:
          grid;

        place-items:
          center;

        padding:
          6px 7px;

        color:
          var(--nt-white);

        background:
          #071622;

        border:
          1px solid
          rgba(103,232,249,.17);

        clip-path:
          var(--nt-cut-small);

        font:
          950 8px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;
      }

      #pauseMenu.relay-options-unified
      .nt-key span,
      #titlePanel.relay-options-unified
      .nt-key span {

        min-width:
          0;

        color:
          var(--nt-muted);

        font:
          800 8px/1.15
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        overflow-wrap:
          anywhere;
      }

      /* ========================================================
         FOOTER
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-settings-footer,
      #titlePanel.relay-options-unified
      .nt-settings-footer {

        min-width:
          0;

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        gap:
          15px;

        padding:
          10px 20px;

        border-top:
          1px solid
          rgba(103,232,249,.08);

        background:
          rgba(0,0,0,.18);
      }

      #pauseMenu.relay-options-unified
      .nt-footer-left,
      #pauseMenu.relay-options-unified
      .nt-footer-right,
      #titlePanel.relay-options-unified
      .nt-footer-left,
      #titlePanel.relay-options-unified
      .nt-footer-right {

        min-width:
          0;

        display:
          flex;

        align-items:
          center;

        gap:
          8px;

        color:
          var(--nt-dim);

        font:
          800 7px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .10em;
      }

      #pauseMenu.relay-options-unified
      .nt-footer-right,
      #titlePanel.relay-options-unified
      .nt-footer-right {

        color:
          var(--nt-muted);
      }

      #pauseMenu.relay-options-unified
      .nt-footer-right b,
      #titlePanel.relay-options-unified
      .nt-footer-right b {

        color:
          var(--nt-cyan);
      }

      #pauseMenu.relay-options-unified
      .nt-footer-dot,
      #titlePanel.relay-options-unified
      .nt-footer-dot {

        width:
          6px;

        height:
          6px;

        border-radius:
          50%;

        background:
          var(--nt-cyan);

        box-shadow:
          0 0 8px
          rgba(103,232,249,.7);
      }

      /* ========================================================
         PAUSE MENU SHELL
         ======================================================== */

      #pauseMenu.relay-options-unified
      .menu-grid {

        min-height:
          0 !important;

        grid-template-columns:
          205px
          minmax(0,1fr) !important;

        gap:
          0 !important;
      }

      #pauseMenu.relay-options-unified
      .menu-grid > aside {

        min-width:
          0;

        padding:
          20px 14px !important;

        background:
          linear-gradient(
            180deg,
            rgba(8,25,39,.84),
            rgba(3,9,15,.80)
          ) !important;

        border-right:
          1px solid
          rgba(103,232,249,.09) !important;
      }

      #pauseMenu.relay-options-unified
      .menu-grid > section {

        min-width:
          0 !important;

        min-height:
          0 !important;

        overflow:
          hidden !important;
      }

      #pauseMenu.relay-options-unified
      #panelContent {

        width:
          100% !important;

        min-width:
          0 !important;

        min-height:
          0 !important;

        height:
          100% !important;

        padding:
          0 !important;

        overflow:
          hidden !important;
      }

      /* ========================================================
         PAUSE NAV
         ======================================================== */

      #pauseMenu.relay-options-unified
      .tab {

        position:
          relative !important;

        width:
          100% !important;

        min-height:
          44px !important;

        margin:
          4px 0 !important;

        padding:
          0 12px !important;

        display:
          flex !important;

        align-items:
          center !important;

        color:
          var(--nt-muted) !important;

        background:
          rgba(255,255,255,.012) !important;

        border:
          1px solid
          transparent !important;

        clip-path:
          var(--nt-cut-small);

        text-align:
          left !important;

        font:
          900 9px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace !important;

        letter-spacing:
          .11em !important;

        transition:
          color .14s ease,
          border-color .14s ease,
          background .14s ease,
          transform .14s ease;
      }

      #pauseMenu.relay-options-unified
      .tab:hover,
      #pauseMenu.relay-options-unified
      .tab:focus-visible {

        outline:
          none !important;

        color:
          var(--nt-cyan) !important;

        background:
          rgba(103,232,249,.035) !important;

        border-color:
          rgba(103,232,249,.15) !important;

        transform:
          translateX(2px);
      }

      #pauseMenu.relay-options-unified
      .tab.active {

        color:
          var(--nt-white) !important;

        background:
          linear-gradient(
            90deg,
            rgba(34,211,238,.10),
            rgba(34,211,238,.022)
          ) !important;

        border-color:
          rgba(103,232,249,.23) !important;

        box-shadow:
          inset 3px 0
          var(--nt-cyan),
          0 0 20px
          rgba(34,211,238,.03);
      }

      /* ========================================================
         TITLE PANEL
         ======================================================== */

      #titlePanel.relay-options-unified {

        padding:
          12px !important;

        overflow:
          hidden !important;
      }

      #titlePanel.relay-options-unified
      .title-panel-card {

        position:
          relative !important;

        width:
          min(1080px,94vw) !important;

        max-width:
          100% !important;

        height:
          min(780px,calc(100dvh - 24px)) !important;

        max-height:
          calc(100dvh - 24px) !important;

        display:
          grid !important;

        padding:
          0 !important;

        border:
          1px solid
          rgba(103,232,249,.20) !important;

        border-radius:
          0 !important;

        overflow:
          hidden !important;

        background:
          #03080e !important;

        clip-path:
          var(--nt-cut) !important;

        box-shadow:
          var(--nt-shadow) !important;
      }

      #titlePanel.relay-options-unified
      .title-panel-close {

        position:
          absolute !important;

        z-index:
          250 !important;

        top:
          14px !important;

        right:
          14px !important;

        width:
          43px !important;

        height:
          43px !important;

        display:
          grid !important;

        place-items:
          center !important;

        padding:
          0 !important;

        color:
          var(--nt-white) !important;

        background:
          rgba(2,8,14,.90) !important;

        border:
          1px solid
          rgba(103,232,249,.22) !important;

        clip-path:
          var(--nt-cut-small) !important;

        cursor:
          pointer !important;

        font:
          700 24px/1
          system-ui,
          sans-serif !important;

        transition:
          color .14s ease,
          border-color .14s ease,
          transform .14s ease;
      }

      #titlePanel.relay-options-unified
      .title-panel-close:hover {

        color:
          var(--nt-cyan) !important;

        border-color:
          var(--nt-cyan) !important;

        transform:
          rotate(4deg);
      }

      #titlePanel.relay-options-unified
      #titlePanelEyebrow,
      #titlePanel.relay-options-unified
      #titlePanelHeading {

        display:
          none !important;
      }

      #titlePanel.relay-options-unified
      #titlePanelContent {

        width:
          100% !important;

        height:
          100% !important;

        min-width:
          0 !important;

        min-height:
          0 !important;

        padding:
          0 !important;

        overflow:
          hidden !important;
      }

      #titlePanel.relay-options-unified
      #titlePanelContent.relay-legacy-cleared {

        display:
          block !important;
      }

      /* ========================================================
         TABLET
         ======================================================== */

      @media (max-width: 899px) {

        #pauseMenu.relay-options-unified
        .nt-interface-grid,
        #titlePanel.relay-options-unified
        .nt-interface-grid {

          grid-template-columns:
            repeat(2,minmax(0,1fr));
        }

        #pauseMenu.relay-options-unified
        .nt-key-grid,
        #titlePanel.relay-options-unified
        .nt-key-grid {

          grid-template-columns:
            repeat(2,minmax(0,1fr));
        }
      }

      /* ========================================================
         MOBILE
         ======================================================== */

      @media (max-width: 760px) {

        #pauseMenu.relay-options-unified
        .menu-grid {

          grid-template-columns:
            1fr !important;
        }

        #pauseMenu.relay-options-unified
        .menu-grid > aside {

          padding:
            8px !important;

          border-right:
            0 !important;

          border-bottom:
            1px solid
            rgba(103,232,249,.09) !important;
        }

        #pauseMenu.relay-options-unified
        .menu-grid > aside .eyebrow,
        #pauseMenu.relay-options-unified
        .menu-grid > aside h2 {

          display:
            none !important;
        }

        #pauseMenu.relay-options-unified
        .menu-grid > aside nav {

          display:
            grid !important;

          grid-template-columns:
            repeat(4,minmax(0,1fr));

          gap:
            5px;
        }

        #pauseMenu.relay-options-unified
        .menu-grid > aside .tab {

          min-height:
            39px !important;

          margin:
            0 !important;

          justify-content:
            center !important;

          padding:
            0 3px !important;

          text-align:
            center !important;

          font-size:
            7px !important;

          letter-spacing:
            .045em !important;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header,
        #titlePanel.relay-options-unified
        .nt-settings-header {

          align-items:
            flex-start;

          padding:
            17px 58px 15px 14px;

          gap:
            12px;
        }

        #pauseMenu.relay-options-unified
        .nt-brand-lockup,
        #titlePanel.relay-options-unified
        .nt-brand-lockup {

          align-items:
            flex-start;

          gap:
            10px;
        }

        #pauseMenu.relay-options-unified
        .nt-brand-mark,
        #titlePanel.relay-options-unified
        .nt-brand-mark {

          width:
            43px;

          height:
            43px;

          font-size:
            16px;
        }

        #pauseMenu.relay-options-unified
        .nt-system-kicker,
        #titlePanel.relay-options-unified
        .nt-system-kicker {

          font-size:
            7px;

          letter-spacing:
            .12em;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header h2,
        #titlePanel.relay-options-unified
        .nt-settings-header h2 {

          font-size:
            25px;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header p,
        #titlePanel.relay-options-unified
        .nt-settings-header p {

          font-size:
            10px;
        }

        #pauseMenu.relay-options-unified
        .nt-status-block,
        #titlePanel.relay-options-unified
        .nt-status-block {

          display:
            none;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-scroll,
        #titlePanel.relay-options-unified
        .nt-settings-scroll {

          padding:
            12px 10px 15px;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-grid,
        #titlePanel.relay-options-unified
        .nt-settings-grid {

          grid-template-columns:
            1fr;

          gap:
            10px;
        }

        #pauseMenu.relay-options-unified
        .nt-section,
        #titlePanel.relay-options-unified
        .nt-section {

          grid-column:
            1 / -1;

          padding:
            12px;

          gap:
            10px;
        }

        #pauseMenu.relay-options-unified
        .nt-section-number,
        #titlePanel.relay-options-unified
        .nt-section-number {

          width:
            29px;

          height:
            29px;

          font-size:
            9px;
        }

        #pauseMenu.relay-options-unified
        .nt-section-heading h3,
        #titlePanel.relay-options-unified
        .nt-section-heading h3 {

          font-size:
            12px;
        }

        #pauseMenu.relay-options-unified
        .nt-option-card,
        #titlePanel.relay-options-unified
        .nt-option-card {

          min-height:
            76px;

          grid-template-columns:
            minmax(0,1fr)
            auto;

          gap:
            8px;

          padding:
            11px;
        }

        #pauseMenu.relay-options-unified
        .nt-option-copy strong,
        #titlePanel.relay-options-unified
        .nt-option-copy strong {

          font-size:
            10px;
        }

        #pauseMenu.relay-options-unified
        .nt-option-copy small,
        #titlePanel.relay-options-unified
        .nt-option-copy small {

          font-size:
            9px;

          line-height:
            1.32;
        }

        #pauseMenu.relay-options-unified
        .nt-toggle,
        #titlePanel.relay-options-unified
        .nt-toggle {

          width:
            79px;

          height:
            35px;

          padding:
            0 8px;

          font-size:
            8px;
        }

        #pauseMenu.relay-options-unified
        .nt-option-card-range,
        #titlePanel.relay-options-unified
        .nt-option-card-range {

          grid-template-columns:
            1fr;
        }

        #pauseMenu.relay-options-unified
        .nt-range-control,
        #titlePanel.relay-options-unified
        .nt-range-control {

          width:
            100%;
        }

        #pauseMenu.relay-options-unified
        .nt-interface-grid,
        #titlePanel.relay-options-unified
        .nt-interface-grid {

          grid-template-columns:
            1fr;
        }

        #pauseMenu.relay-options-unified
        .nt-language-card,
        #titlePanel.relay-options-unified
        .nt-language-card {

          grid-template-columns:
            1fr;
        }

        #pauseMenu.relay-options-unified
        .nt-language-control,
        #titlePanel.relay-options-unified
        .nt-language-control {

          width:
            100%;

          min-width:
            0;
        }

        #pauseMenu.relay-options-unified
        .nt-action-grid,
        #titlePanel.relay-options-unified
        .nt-action-grid {

          grid-template-columns:
            1fr;
        }

        #pauseMenu.relay-options-unified
        .nt-action,
        #titlePanel.relay-options-unified
        .nt-action {

          min-height:
            56px;
        }

        #pauseMenu.relay-options-unified
        .nt-key-grid,
        #titlePanel.relay-options-unified
        .nt-key-grid {

          grid-template-columns:
            repeat(2,minmax(0,1fr));
        }

        #pauseMenu.relay-options-unified
        .nt-settings-footer,
        #titlePanel.relay-options-unified
        .nt-settings-footer {

          padding:
            9px 11px;
        }

        #pauseMenu.relay-options-unified
        .nt-footer-left,
        #pauseMenu.relay-options-unified
        .nt-footer-right,
        #titlePanel.relay-options-unified
        .nt-footer-left,
        #titlePanel.relay-options-unified
        .nt-footer-right {

          font-size:
            6.5px;
        }

        #titlePanel.relay-options-unified {

          padding:
            5px !important;
        }

        #titlePanel.relay-options-unified
        .title-panel-card {

          width:
            97vw !important;

          height:
            calc(100dvh - 10px) !important;

          max-height:
            calc(100dvh - 10px) !important;

          clip-path:
            var(--nt-cut) !important;
        }

        #titlePanel.relay-options-unified
        .title-panel-close {

          top:
            9px !important;

          right:
            9px !important;

          width:
            37px !important;

          height:
            37px !important;

          font-size:
            21px !important;
        }

        #pauseMenu.relay-options-unified
        .nt-language-menu,
        #titlePanel.relay-options-unified
        .nt-language-menu {

          left:
            0;

          right:
            0;

          width:
            auto;
        }
      }

      /* ========================================================
         SMALL MOBILE
         ======================================================== */

      @media (max-width: 390px) {

        #pauseMenu.relay-options-unified
        .menu-grid > aside nav {

          grid-template-columns:
            repeat(2,minmax(0,1fr));
        }

        #pauseMenu.relay-options-unified
        .menu-grid > aside .tab {

          min-height:
            36px !important;

          font-size:
            7px !important;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header,
        #titlePanel.relay-options-unified
        .nt-settings-header {

          padding:
            14px 51px 12px 11px;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header h2,
        #titlePanel.relay-options-unified
        .nt-settings-header h2 {

          font-size:
            22px;
        }

        #pauseMenu.relay-options-unified
        .nt-system-kicker,
        #titlePanel.relay-options-unified
        .nt-system-kicker {

          font-size:
            6.5px;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header p,
        #titlePanel.relay-options-unified
        .nt-settings-header p {

          font-size:
            8.5px;
        }

        #pauseMenu.relay-options-unified
        .nt-option-card,
        #titlePanel.relay-options-unified
        .nt-option-card {

          min-height:
            70px;

          padding:
            9px;
        }

        #pauseMenu.relay-options-unified
        .nt-option-copy strong,
        #titlePanel.relay-options-unified
        .nt-option-copy strong {

          font-size:
            9px;
        }

        #pauseMenu.relay-options-unified
        .nt-option-copy small,
        #titlePanel.relay-options-unified
        .nt-option-copy small {

          font-size:
            8.5px;
        }

        #pauseMenu.relay-options-unified
        .nt-toggle,
        #titlePanel.relay-options-unified
        .nt-toggle {

          width:
            71px;

          height:
            33px;

          font-size:
            7.5px;
        }

        #pauseMenu.relay-options-unified
        .nt-key-grid,
        #titlePanel.relay-options-unified
        .nt-key-grid {

          grid-template-columns:
            1fr;
        }

        #pauseMenu.relay-options-unified
        .nt-footer-right,
        #titlePanel.relay-options-unified
        .nt-footer-right {

          display:
            none;
        }
      }

    `;

    document.head.appendChild(
      style
    );
  };

  /* ============================================================
     UPDATE TOGGLE IN PLACE
     ============================================================ */

  const updateMountedToggle = (
    host,
    key,
    enabled
  ) => {
    if (!host) return;

    const button =
      host.querySelector(
        `[data-nt-toggle="${cssEscape(
          key
        )}"]`
      );

    if (!button) return;

    button.classList.toggle(
      'is-on',
      Boolean(enabled)
    );

    button.classList.toggle(
      'is-off',
      !Boolean(enabled)
    );

    button.setAttribute(
      'aria-pressed',
      String(
        Boolean(enabled)
      )
    );

    button.setAttribute(
      'aria-label',
      `${
        key
      }: ${
        enabled
          ? 'ON'
          : 'OFF'
      }`
    );

    const label =
      button.querySelector(
        '.nt-toggle-label'
      );

    if (label) {
      label.textContent =
        enabled
          ? 'ON'
          : 'OFF';
    }
  };

  /* ============================================================
     RENDER HOST WITHOUT NEW LISTENERS
     ============================================================ */

  const renderHostContent = (
    host
  ) => {
    if (!host) return;

    const controls =
      host.querySelector(
        '[data-nt-controls-panel]'
      );

    const controlsOpen =
      controls
        ? controls.hidden === false
        : false;

    host.innerHTML =
      buildContent();

    const nextControls =
      host.querySelector(
        '[data-nt-controls-panel]'
      );

    if (nextControls) {
      nextControls.hidden =
        !controlsOpen;
    }

    host.dataset.ntMounted =
      'true';
  };

  /* ============================================================
     FULLSCREEN
     ============================================================ */

  const toggleFullscreen =
    async () => {
      try {
        if (
          !document.fullscreenElement
        ) {
          await document
            .documentElement
            .requestFullscreen?.();
        } else {
          await document
            .exitFullscreen?.();
        }

        emitSettingsChange({
          fullscreen:
            Boolean(
              document.fullscreenElement
            ),
        });
      } catch (error) {
        console.warn(
          '[Relay Settings] fullscreen unavailable',
          error
        );
      }
    };

  /* ============================================================
     CONTROLS PANEL
     ============================================================ */

  const toggleControlsReference =
    host => {
      const panel =
        host?.querySelector(
          '[data-nt-controls-panel]'
        );

      if (!panel) return;

      panel.hidden =
        !panel.hidden;
    };

  /* ============================================================
     RESET
     ============================================================ */

  const resetOptions =
    host => {
      savePatch({
        ...STATE_DEFAULTS,
      });

      writePresentation({
        ...PRESENTATION_DEFAULTS,
      });

      setLanguage('en');

      syncPresentationClasses(
        PRESENTATION_DEFAULTS
      );

      emitSettingsChange({
        reset: true,
      });

      renderHostContent(
        host
      );
    };

  /* ============================================================
     MOUNT
     ============================================================ */

  const mount = (
    root,
    kind
  ) => {
    if (!root) {
      return false;
    }

    injectStyles();

    root.classList.add(
      'relay-options-unified'
    );

    const host =
      kind === 'home'
        ? root.querySelector(
            '#titlePanelContent'
          )
        : root.querySelector(
            '#panelContent'
          );

    if (!host) {
      return false;
    }

    /*
     * IMPORTANT:
     * The event listener is attached only once.
     * The content can be rebuilt safely.
     */

    if (
      host.dataset.ntListenerAttached !==
      'true'
    ) {
      host.dataset.ntListenerAttached =
        'true';

      host.addEventListener(
        'click',
        event => {
          /* ----------------------------------------
             TOGGLES
             ---------------------------------------- */

          const toggle =
            event.target.closest(
              '[data-nt-toggle]'
            );

          if (toggle) {
            const key =
              toggle.dataset.ntToggle;

            const state =
              getState();

            const prefs =
              readPresentation();

            const current =
              getToggleState(
                key,
                state,
                prefs
              );

            const next =
              !current;

            setToggleState(
              key,
              next
            );

            updateMountedToggle(
              host,
              key,
              next
            );

            return;
          }

          /* ----------------------------------------
             LANGUAGE TOGGLE
             ---------------------------------------- */

          const languageToggle =
            event.target.closest(
              '[data-nt-language-toggle]'
            );

          if (
            languageToggle
          ) {
            event.stopPropagation();

            const menu =
              host.querySelector(
                '[data-nt-language-menu]'
              );

            if (!menu) {
              return;
            }

            const open =
              menu.hidden === false;

            menu.hidden =
              open;

            languageToggle.setAttribute(
              'aria-expanded',
              String(!open)
            );

            return;
          }

          /* ----------------------------------------
             LANGUAGE CHOICE
             ---------------------------------------- */

          const languageCode =
            event.target.closest(
              '[data-nt-language-code]'
            );

          if (
            languageCode
          ) {
            setLanguage(
              languageCode.dataset
                .ntLanguageCode
            );

            renderHostContent(
              host
            );

            return;
          }

          /* ----------------------------------------
             ACTIONS
             ---------------------------------------- */

          const action =
            event.target.closest(
              '[data-nt-action]'
            );

          if (!action) {
            return;
          }

          const actionKey =
            action.dataset.ntAction;

          if (
            actionKey ===
            'fullscreen'
          ) {
            toggleFullscreen();
            return;
          }

          if (
            actionKey ===
            'controls'
          ) {
            toggleControlsReference(
              host
            );
            return;
          }

          if (
            actionKey ===
            'reset'
          ) {
            resetOptions(
              host
            );
          }
        },
        false
      );

      host.addEventListener(
        'input',
        event => {
          const range =
            event.target.closest(
              '[data-nt-range]'
            );

          if (!range) {
            return;
          }

          const key =
            range.dataset.ntRange;

          const value =
            normaliseVolume(
              range.value
            );

          const label =
            host.querySelector(
              `[data-nt-range-value="${cssEscape(
                key
              )}"]`
            );

          if (label) {
            label.textContent =
              `${Math.round(
                value * 100
              )}%`;
          }
        },
        false
      );
    }

    /*
     * Rebuild only when actual markup
     * is not already mounted.
     */
    if (
      host.dataset.ntContentVersion !==
      '2'
    ) {
      host.innerHTML =
        buildContent();

      const controls =
        host.querySelector(
          '[data-nt-controls-panel]'
        );

      if (controls) {
        controls.hidden = true;
      }

      host.classList.remove(
        'relay-legacy-cleared'
      );

      host.dataset.ntContentVersion =
        '2';
    }

    host.classList.remove(
      'relay-legacy-cleared'
    );

    return true;
  };

  /* ============================================================
     HOME OPTIONS
     ============================================================ */

  const renderHome = () => {
    const panel =
      document.getElementById(
        'titlePanel'
      );

    if (
      !panel ||
      panel.classList.contains(
        'hidden'
      )
    ) {
      return false;
    }

    const heading =
      document.getElementById(
        'titlePanelHeading'
      );

    if (!heading) {
      return false;
    }

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

  /* ============================================================
     PAUSE SETTINGS
     ============================================================ */

  const renderPause = () => {
    const pause =
      document.getElementById(
        'pauseMenu'
      );

    if (
      !pause ||
      pause.classList.contains(
        'hidden'
      )
    ) {
      return false;
    }

    const settingsTab =
      pause.querySelector(
        '[data-tab="settings"]'
      );

    if (
      !settingsTab ||
      !settingsTab.classList.contains(
        'active'
      )
    ) {
      return false;
    }

    return mount(
      pause,
      'pause'
    );
  };

  /* ============================================================
     RENDER ACTIVE PANELS
     ============================================================ */

  const renderOpenPanels = () => {
    renderHome();
    renderPause();

    syncPresentationClasses(
      readPresentation()
    );
  };

  /* ============================================================
     INITIALISATION
     ============================================================ */

  const init = () => {
    injectStyles();

    syncPresentationClasses(
      readPresentation()
    );

    /* ----------------------------------------
       HOME OPTIONS BUTTON
       ---------------------------------------- */

    document.addEventListener(
      'click',
      event => {
        const homeButton =
          event.target.closest(
            '[data-title-panel="controls"]'
          );

        if (!homeButton) {
          return;
        }

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

        window.setTimeout(
          renderHome,
          0
        );
      },
      true
    );

    /* ----------------------------------------
       PAUSE SETTINGS TAB
       ---------------------------------------- */

    document.addEventListener(
      'click',
      event => {
        const pauseSettings =
          event.target.closest(
            '#pauseMenu [data-tab="settings"]'
          );

        if (!pauseSettings) {
          return;
        }

        window.setTimeout(
          renderPause,
          0
        );
      },
      true
    );

    /* ----------------------------------------
       CLOSE LANGUAGE MENUS
       ---------------------------------------- */

    document.addEventListener(
      'click',
      event => {
        if (
          event.target.closest(
            '.nt-language-control'
          )
        ) {
          return;
        }

        document
          .querySelectorAll(
            '.nt-language-menu'
          )
          .forEach(menu => {
            menu.hidden =
              true;
          });

        document
          .querySelectorAll(
            '[data-nt-language-toggle]'
          )
          .forEach(button => {
            button.setAttribute(
              'aria-expanded',
              'false'
            );
          });
      },
      false
    );

    /* ----------------------------------------
       OBSERVE TITLE PANEL
       ---------------------------------------- */

    const titlePanel =
      document.getElementById(
        'titlePanel'
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
          attributes: true,
          attributeFilter: [
            'class',
          ],
        }
      );
    }

    /* ----------------------------------------
       OBSERVE PAUSE MENU
       ---------------------------------------- */

    const pauseMenu =
      document.getElementById(
        'pauseMenu'
      );

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
          attributes: true,
          attributeFilter: [
            'class',
          ],
        }
      );
    }

    /* ----------------------------------------
       EXTERNAL SETTINGS CHANGES
       ---------------------------------------- */

    window.addEventListener(
      'relay-settings-change',
      event => {
        syncPresentationClasses(
          readPresentation()
        );

        /*
         * Do NOT blindly remount every time.
         * This prevents duplicate listeners,
         * visual flashing and unnecessary DOM
         * reconstruction.
         */
        if (
          event.detail?.reset ===
          true
        ) {
          window.setTimeout(
            renderOpenPanels,
            0
          );
        }
      }
    );

    /* ----------------------------------------
       INITIAL PAINT
       ---------------------------------------- */

    window.setTimeout(
      renderOpenPanels,
      0
    );
  };

  /* ============================================================
     START
     ============================================================ */

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once: true,
      }
    );
  } else {
    init();
  }
})();
```
