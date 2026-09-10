```js
import { loadState, saveState } from './src/state.js';

(() => {
  'use strict';

  /*
   * RELAY RUNNER
   * Unified Options UI — Neon Tactical / AAA Terminal
   *
   * IMPORTANT CONTRACT:
   * - Keep __relayUnifiedOptionsUiV1
   * - Keep data-unified-toggle
   * - Keep data-unified-range
   * - Keep relay-hide-* presentation classes
   * - Keep relay-settings-change event
   * - Keep loadState / saveState
   */

  if (window.__relayUnifiedOptionsUiV1) return;
  window.__relayUnifiedOptionsUiV1 = true;

  const LANGUAGE_KEY = 'relay-runner-language';
  const PRESENTATION_KEY =
    'relay.runner.ui.preferences.v1';

  const LANGUAGES = [
    ['en', 'ENGLISH'],
    ['exyu', 'EX-YU'],
    ['es', 'ESPAÑOL'],
    ['de', 'DEUTSCH'],
  ];

  const presentationDefaults = Object.freeze({
    intelCards: true,
    allyIntel: true,
    eventPopups: true,
    tutorialHints: true,
  });

  const stateDefaults = Object.freeze({
    muted: false,
    musicVolume: 0.55,
    sfxVolume: 0.70,
    screenShake: true,
    reducedMotion: false,
    rain: true,
    aiVoice: true,
    tutorialEnabled: true,
  });

  const presentationKeys = new Set(
    Object.keys(presentationDefaults)
  );

  /* ============================================================
     SAFE HELPERS
     ============================================================ */

  const safeCssEscape = value => {
    try {
      return CSS.escape(String(value));
    } catch {
      return String(value).replace(
        /[^a-zA-Z0-9_-]/g,
        '\\$&'
      );
    }
  };

  const escapeHtml = value =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const clamp = (
    value,
    min,
    max
  ) =>
    Math.min(
      max,
      Math.max(min, value)
    );

  const normaliseNumber = (
    value,
    fallback = 0
  ) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  };

  const normaliseVolume = value =>
    clamp(
      normaliseNumber(value, 0.55),
      0,
      1
    );

  /* ============================================================
     STATE
     ============================================================ */

  const getState = () => {
    try {
      return {
        ...stateDefaults,
        ...(loadState() || {}),
      };
    } catch (error) {
      console.warn(
        '[Relay Options] loadState failed',
        error
      );

      return {
        ...stateDefaults,
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
      console.warn(
        '[Relay Options] saveState failed',
        error
      );
    }
  };

  /* ============================================================
     PRESENTATION PREFERENCES
     ============================================================ */

  const readPresentation = () => {
    try {
      const raw =
        localStorage.getItem(
          PRESENTATION_KEY
        );

      const parsed =
        raw
          ? JSON.parse(raw)
          : {};

      return {
        ...presentationDefaults,
        ...(parsed &&
        typeof parsed === 'object'
          ? parsed
          : {}),
      };
    } catch {
      return {
        ...presentationDefaults,
      };
    }
  };

  const writePresentation = value => {
    try {
      localStorage.setItem(
        PRESENTATION_KEY,
        JSON.stringify({
          ...presentationDefaults,
          ...value,
        })
      );
    } catch (error) {
      console.warn(
        '[Relay Options] presentation save failed',
        error
      );
    }
  };

  const syncPresentationClasses = prefs => {
    if (!document.body) return;

    document.body.classList.toggle(
      'relay-hide-intel',
      prefs.intelCards === false
    );

    document.body.classList.toggle(
      'relay-hide-ally',
      prefs.allyIntel === false
    );

    document.body.classList.toggle(
      'relay-hide-events',
      prefs.eventPopups === false
    );

    document.body.classList.toggle(
      'relay-hide-tutorials',
      prefs.tutorialHints === false
    );
  };

  /* ============================================================
     LANGUAGE
     ============================================================ */

  const getLanguage = () => {
    try {
      return (
        localStorage.getItem(
          LANGUAGE_KEY
        ) || 'en'
      );
    } catch {
      return 'en';
    }
  };

  const setLanguage = code => {
    const valid = LANGUAGES.some(
      ([id]) => id === code
    );

    const safeCode =
      valid ? code : 'en';

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
     EVENT
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
     TOGGLE STATE
     ============================================================ */

  const getToggleState = (
    key,
    state,
    prefs
  ) => {
    if (presentationKeys.has(key)) {
      return prefs[key] !== false;
    }

    if (key === 'muted') {
      return state.muted !== true;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        stateDefaults,
        key
      )
    ) {
      return Boolean(
        state[key]
      );
    }

    return false;
  };

  const applyToggle = (
    key,
    nextValue
  ) => {
    const enabled =
      Boolean(nextValue);

    if (
      presentationKeys.has(key)
    ) {
      const prefs =
        readPresentation();

      prefs[key] = enabled;

      writePresentation(
        prefs
      );

      syncPresentationClasses(
        prefs
      );

      emitSettingsChange({
        key,
        value: enabled,
        presentation: true,
      });

      return;
    }

    if (key === 'muted') {
      savePatch({
        muted: !enabled,
      });
    } else {
      savePatch({
        [key]: enabled,
      });
    }

    if (
      key === 'aiVoice' &&
      !enabled
    ) {
      try {
        window.speechSynthesis?.cancel?.();
      } catch {}
    }

    emitSettingsChange({
      key,
      value: enabled,
      presentation: false,
    });
  };

  /* ============================================================
     MARKUP — TOGGLE
     ============================================================ */

  const toggleMarkup = ({
    key,
    label,
    detail,
    enabled,
    tag,
  }) => {
    const active =
      Boolean(enabled);

    return `
      <article
        class="nt-option-card"
        data-option-card="${escapeHtml(key)}"
      >
        <div class="nt-option-copy">

          <span class="nt-option-tag">
            ${escapeHtml(tag)}
          </span>

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
          data-unified-toggle="${escapeHtml(key)}"
          aria-pressed="${active}"
          aria-label="${escapeHtml(
            label
          )}: ${
            active
              ? 'ON'
              : 'OFF'
          }"
        >
          <span class="nt-toggle-label">
            ${
              active
                ? 'ON'
                : 'OFF'
            }
          </span>

          <i aria-hidden="true"></i>
        </button>
      </article>
    `;
  };

  /* ============================================================
     MARKUP — RANGE
     ============================================================ */

  const rangeMarkup = ({
    key,
    label,
    detail,
    value,
    tag,
  }) => {
    const safeValue =
      normaliseVolume(value);

    return `
      <article
        class="nt-option-card nt-range-card"
        data-option-card="${escapeHtml(key)}"
      >
        <div class="nt-option-copy">

          <span class="nt-option-tag">
            ${escapeHtml(tag)}
          </span>

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
              data-range-value="${escapeHtml(key)}"
            >
              ${Math.round(
                safeValue * 100
              )}%
            </strong>
          </div>

          <input
            class="nt-range"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value="${safeValue}"
            data-unified-range="${escapeHtml(key)}"
            aria-label="${escapeHtml(label)}"
          />

        </div>
      </article>
    `;
  };

  /* ============================================================
     MARKUP — LANGUAGE
     ============================================================ */

  const languageMarkup =
    currentCode => {
      const current =
        LANGUAGES.find(
          ([code]) =>
            code === currentCode
        ) ||
        LANGUAGES[0];

      return `
        <article
          class="nt-option-card nt-language-card"
        >

          <div class="nt-option-copy">

            <span class="nt-option-tag">
              SYSTEM
            </span>

            <strong>
              GAME LANGUAGE
            </strong>

            <small>
              Interface and supported system language.
            </small>

          </div>

          <div
            class="nt-language-control"
          >

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

              <span>
                ${escapeHtml(
                  current[1]
                )}
              </span>

              <b aria-hidden="true">
                ▾
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
                      code ===
                      current[0]
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
     MARKUP — ACTIONS
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
     MARKUP — CONTROL REFERENCE
     ============================================================ */

  const controlsMarkup = () => `
    <section
      class="nt-controls-reference"
      data-unified-controls-panel
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

        <span
          class="nt-reference-state"
        >
          LIVE
        </span>

      </div>

      <div class="nt-key-grid">

        <div class="nt-key">
          <kbd>A</kbd>
          <span>MOVE LEFT</span>
        </div>

        <div class="nt-key">
          <kbd>D</kbd>
          <span>MOVE RIGHT</span>
        </div>

        <div class="nt-key">
          <kbd>SPACE</kbd>
          <span>JUMP</span>
        </div>

        <div class="nt-key">
          <kbd>E</kbd>
          <span>FIRE</span>
        </div>

        <div class="nt-key">
          <kbd>Q</kbd>
          <span>BLADE</span>
        </div>

        <div class="nt-key">
          <kbd>SHIFT</kbd>
          <span>DASH</span>
        </div>

        <div class="nt-key">
          <kbd>F</kbd>
          <span>FLIGHT</span>
        </div>

        <div class="nt-key">
          <kbd>ESC</kbd>
          <span>PAUSE</span>
        </div>

      </div>
    </section>
  `;

  /* ============================================================
     CONTENT
     ============================================================ */

  const buildContent = () => {
    const state = getState();
    const prefs =
      readPresentation();

    const language =
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
                Configure the run. Changes apply live.
              </p>

            </div>

          </div>

          <div
            class="nt-status-block"
          >

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

        <!-- SCROLL BODY -->
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
                    'Impact and camera feedback.',
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
                    'Reduce presentation movement.',
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
                    'Live city weather presentation.',
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
                    'NIA / MARA spoken guidance.',
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
                    'Background music output.',
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
                    'Gameplay sound effects.',
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
                    'Enemy discovery and briefings.',
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
                    'Side intelligence panels.',
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
                    'Transient gameplay notices.',
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
                  language
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

                ${controlsMarkup()}

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
     CSS INJECTION
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
         THEME
         ======================================================== */

      #pauseMenu.relay-options-unified,
      #titlePanel.relay-options-unified {

        --nt-bg: #02060b;
        --nt-bg-soft: #07131e;

        --nt-panel: #091a27;
        --nt-panel-2: #0d2333;

        --nt-cyan: #67e8f9;
        --nt-cyan-strong: #22d3ee;
        --nt-blue: #38bdf8;

        --nt-lime: #a3ff76;

        --nt-white: #f4fcff;
        --nt-text: #d7eaf3;
        --nt-muted: #8da6b7;
        --nt-dim: #607b8d;

        --nt-line: rgba(103,232,249,.15);
        --nt-line-strong: rgba(103,232,249,.36);

        --nt-cut: polygon(
          0 14px,
          14px 0,
          calc(100% - 14px) 0,
          100% 14px,
          100% calc(100% - 14px),
          calc(100% - 14px) 100%,
          14px 100%,
          0 calc(100% - 14px)
        );

        --nt-cut-small: polygon(
          0 9px,
          9px 0,
          calc(100% - 9px) 0,
          100% 9px,
          100% calc(100% - 9px),
          calc(100% - 9px) 100%,
          9px 100%,
          0 calc(100% - 9px)
        );

        --nt-shadow:
          0 35px 95px rgba(0,0,0,.75),
          0 0 50px rgba(34,211,238,.065);
      }

      /* ========================================================
         ROOT
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
         MAIN SHELL
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-settings-shell,
      #titlePanel.relay-options-unified
      .nt-settings-shell {

        position: relative;

        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;

        display: grid;

        grid-template-rows:
          auto
          minmax(0,1fr)
          auto;

        overflow: hidden;

        color:
          var(--nt-white);

        background:
          radial-gradient(
            circle at 92% 0%,
            rgba(56,189,248,.105),
            transparent 29%
          ),
          radial-gradient(
            circle at 0% 100%,
            rgba(34,211,238,.045),
            transparent 30%
          ),
          linear-gradient(
            145deg,
            #081723,
            #030a10 62%,
            #02050a
          );

        clip-path:
          var(--nt-cut);

        box-shadow:
          var(--nt-shadow);

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
            rgba(255,255,255,.011) 0,
            rgba(255,255,255,.011) 1px,
            transparent 1px,
            transparent 5px
          );

        opacity: .20;

        mix-blend-mode:
          screen;
      }

      #pauseMenu.relay-options-unified
      .nt-settings-shell::after,
      #titlePanel.relay-options-unified
      .nt-settings-shell::after {

        content: "";

        position: absolute;

        top: 0;
        left: 0;

        width: 42%;
        height: 2px;

        pointer-events: none;

        background:
          linear-gradient(
            90deg,
            transparent,
            var(--nt-cyan),
            transparent
          );

        box-shadow:
          0 0 14px
          rgba(103,232,249,.5);
      }

      /* ========================================================
         HEADER
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-settings-header,
      #titlePanel.relay-options-unified
      .nt-settings-header {

        position: relative;

        z-index: 2;

        min-width: 0;

        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 25px;

        padding:
          24px 28px 20px;

        border-bottom:
          1px solid
          rgba(103,232,249,.10);

        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.025),
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

        gap: 15px;
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
          inset 0 0 20px
          rgba(34,211,238,.05),
          0 0 26px
          rgba(34,211,238,.08);

        font:
          950 20px/1
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

        margin: 0 0 7px;

        color:
          var(--nt-cyan);

        font:
          900 9px/1.1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .19em;
      }

      #pauseMenu.relay-options-unified
      .nt-settings-header h2,
      #titlePanel.relay-options-unified
      .nt-settings-header h2 {

        margin: 0;

        color:
          var(--nt-white);

        font:
          950 clamp(27px,3.4vw,40px)/.95
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .08em;

        text-shadow:
          0 0 24px
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
          650 12px/1.4
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

        display:
          flex;

        align-items:
          center;

        gap:
          10px;

        padding:
          10px 12px;

        background:
          rgba(163,255,118,.03);

        border:
          1px solid
          rgba(163,255,118,.23);

        clip-path:
          var(--nt-cut-small);
      }

      #pauseMenu.relay-options-unified
      .nt-status-dot,
      #titlePanel.relay-options-unified
      .nt-status-dot {

        width: 9px;
        height: 9px;

        flex: 0 0 auto;

        border-radius:
          50%;

        background:
          var(--nt-lime);

        box-shadow:
          0 0 6px
          var(--nt-lime),
          0 0 17px
          rgba(163,255,118,.60);

        animation:
          nt-status-pulse
          1.8s
          ease-in-out
          infinite;
      }

      #pauseMenu.relay-options-unified
      .nt-status-block small,
      #titlePanel.relay-options-unified
      .nt-status-block small {

        display:
          block;

        color:
          var(--nt-dim);

        font:
          800 8px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .14em;
      }

      #pauseMenu.relay-options-unified
      .nt-status-block strong,
      #titlePanel.relay-options-unified
      .nt-status-block strong {

        display:
          block;

        margin-top:
          4px;

        color:
          var(--nt-lime);

        font:
          950 10px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .13em;
      }

      @keyframes nt-status-pulse {
        0%,100% {
          opacity: .55;
          transform: scale(.90);
        }

        50% {
          opacity: 1;
          transform: scale(1);
        }
      }

      /* ========================================================
         SCROLL AREA
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-settings-scroll,
      #titlePanel.relay-options-unified
      .nt-settings-scroll {

        min-width: 0;
        min-height: 0;

        overflow:
          auto;

        padding:
          21px 23px 24px;

        -webkit-overflow-scrolling:
          touch;

        overscroll-behavior:
          contain;

        scrollbar-width:
          thin;

        scrollbar-color:
          rgba(103,232,249,.30)
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
          rgba(103,232,249,.22);

        border-radius:
          999px;
      }

      /* ========================================================
         MAIN GRID
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-settings-grid,
      #titlePanel.relay-options-unified
      .nt-settings-grid {

        display: grid;

        grid-template-columns:
          repeat(2,minmax(0,1fr));

        gap:
          17px;
      }

      #pauseMenu.relay-options-unified
      .nt-section,
      #titlePanel.relay-options-unified
      .nt-section {

        min-width: 0;

        display: grid;

        gap:
          13px;

        padding:
          16px;

        background:
          linear-gradient(
            150deg,
            rgba(10,29,44,.96),
            rgba(3,10,17,.985)
          );

        border:
          1px solid
          rgba(103,232,249,.10);

        clip-path:
          var(--nt-cut);

        box-shadow:
          inset 0 1px
          rgba(255,255,255,.03),
          0 14px 32px
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
         SECTION HEADER
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-section-heading,
      #titlePanel.relay-options-unified
      .nt-section-heading {

        min-width: 0;

        display: flex;

        align-items: center;

        gap:
          11px;

        padding-bottom:
          11px;

        border-bottom:
          1px solid
          rgba(103,232,249,.08);
      }

      #pauseMenu.relay-options-unified
      .nt-section-number,
      #titlePanel.relay-options-unified
      .nt-section-number {

        flex:
          0 0 auto;

        width:
          33px;

        height:
          33px;

        display:
          grid;

        place-items:
          center;

        color:
          var(--nt-cyan);

        background:
          rgba(34,211,238,.045);

        border:
          1px solid
          rgba(103,232,249,.26);

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

        display:
          block;

        margin-bottom:
          4px;

        color:
          var(--nt-cyan);

        font:
          900 8px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .16em;
      }

      #pauseMenu.relay-options-unified
      .nt-section-heading h3,
      #titlePanel.relay-options-unified
      .nt-section-heading h3 {

        margin:
          0;

        color:
          var(--nt-white);

        font:
          900 14px/1.05
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .075em;
      }

      /* ========================================================
         OPTION LISTS
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-option-list,
      #titlePanel.relay-options-unified
      .nt-option-list {

        display:
          grid;

        gap:
          9px;
      }

      #pauseMenu.relay-options-unified
      .nt-interface-grid,
      #titlePanel.relay-options-unified
      .nt-interface-grid {

        display:
          grid;

        grid-template-columns:
          repeat(4,minmax(0,1fr));

        gap:
          9px;
      }

      /* ========================================================
         OPTION CARD
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-option-card,
      #titlePanel.relay-options-unified
      .nt-option-card {

        position:
          relative;

        min-width:
          0;

        display:
          grid;

        grid-template-columns:
          minmax(0,1fr)
          auto;

        align-items:
          center;

        gap:
          14px;

        min-height:
          82px;

        padding:
          13px 14px;

        background:
          linear-gradient(
            150deg,
            rgba(12,34,51,.93),
            rgba(3,10,17,.99)
          );

        border:
          1px solid
          rgba(103,232,249,.085);

        clip-path:
          var(--nt-cut-small);

        transition:
          border-color .15s ease,
          background .15s ease,
          transform .15s ease,
          box-shadow .15s ease;
      }

      #pauseMenu.relay-options-unified
      .nt-option-card::before,
      #titlePanel.relay-options-unified
      .nt-option-card::before {

        content:
          "";

        position:
          absolute;

        left:
          0;

        top:
          0;

        bottom:
          0;

        width:
          2px;

        background:
          linear-gradient(
            180deg,
            transparent,
            var(--nt-cyan),
            transparent
          );

        opacity:
          .18;

        pointer-events:
          none;
      }

      #pauseMenu.relay-options-unified
      .nt-option-card:hover,
      #titlePanel.relay-options-unified
      .nt-option-card:hover {

        transform:
          translateY(-1px);

        border-color:
          rgba(103,232,249,.23);

        background:
          linear-gradient(
            150deg,
            rgba(13,39,59,.97),
            rgba(4,12,20,.995)
          );

        box-shadow:
          0 12px 25px
          rgba(0,0,0,.25),
          0 0 19px
          rgba(34,211,238,.04);
      }

      /* ========================================================
         TEXT
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-option-copy,
      #titlePanel.relay-options-unified
      .nt-option-copy {

        min-width:
          0;
      }

      #pauseMenu.relay-options-unified
      .nt-option-tag,
      #titlePanel.relay-options-unified
      .nt-option-tag {

        display:
          block;

        margin-bottom:
          5px;

        color:
          var(--nt-dim);

        font:
          850 8px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .12em;
      }

      #pauseMenu.relay-options-unified
      .nt-option-copy strong,
      #titlePanel.relay-options-unified
      .nt-option-copy strong {

        display:
          block;

        min-width:
          0;

        color:
          var(--nt-white);

        font:
          950 12px/1.18
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .06em;

        white-space:
          normal;

        overflow-wrap:
          anywhere;
      }

      #pauseMenu.relay-options-unified
      .nt-option-copy small,
      #titlePanel.relay-options-unified
      .nt-option-copy small {

        display:
          block;

        margin-top:
          5px;

        color:
          var(--nt-muted);

        font:
          650 10px/1.38
          system-ui,
          sans-serif;

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
          94px;

        height:
          39px;

        display:
          grid;

        grid-template-columns:
          1fr
          10px;

        align-items:
          center;

        gap:
          8px;

        padding:
          0 10px;

        color:
          var(--nt-muted);

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
          950 10px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .10em;

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
          rgba(103,232,249,.075);
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

        border-radius:
          50%;

        background:
          #435769;

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
          rgba(163,255,118,.35);

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
          0 0 6px
          var(--nt-lime),
          0 0 15px
          rgba(163,255,118,.55);
      }

      /* ========================================================
         RANGE
         ======================================================== */

      #pauseMenu.relay-options-unified
      .nt-range-card,
      #titlePanel.relay-options-unified
      .nt-range-card {

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
          .10em;
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
          185px;
      }

      #pauseMenu.relay-options-unified
      .nt-select-button,
      #titlePanel.relay-options-unified
      .nt-select-button {

        width:
          100%;

        min-height:
          43px;

        display:
          grid;

        grid-template-columns:
          auto
          minmax(0,1fr)
          auto;

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
          900 9px/1
          ui-monospace,
          SFMono-Regular,
          Menlo,
          monospace;

        letter-spacing:
          .07em;
      }

      #pauseMenu.relay-options-unified
      .nt-select-button:hover,
      #titlePanel.relay-options-unified
      .nt-select-button:hover {

        color:
          var(--nt-cyan);

        border-color:
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
          12px;
      }

      #pauseMenu.relay-options-unified
      .nt-language-menu,
      #titlePanel.relay-options-unified
      .nt-language-menu {

        position:
          absolute;

        top:
          calc(100% + 8px);

        right:
          0;

        z-index:
          200;

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
          rgba(0,0,0,.72),
          0 0 25px
          rgba(34,211,238,.04);
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
          38px;

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
          .07em;
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
          rgba(103,232,249,.17);
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
          65px;

        display:
          grid;

        grid-template-columns:
          minmax(0,1fr)
          auto;

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
            rgba(10,29,44,.96),
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

        transition:
          border-color .14s ease,
          transform .14s ease,
          box-shadow .14s ease,
          background .14s ease;
      }

      #pauseMenu.relay-options-unified
      .nt-action:hover,
      #pauseMenu.relay-options-unified
      .nt-action:focus-visible,
      #titlePanel.relay-options-unified
      .nt-action:hover,
      #titlePanel.relay-options-unified
      .nt-action:focus-visible {

        outline:
          none;

        border-color:
          var(--nt-cyan);

        transform:
          translateY(-1px);

        box-shadow:
          0 10px 23px
          rgba(0,0,0,.25),
          0 0 18px
          rgba(34,211,238,.04);
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
            rgba(18,57,77,.92),
            rgba(4,16,25,.99)
          );
      }

      /* ========================================================
         CONTROLS REFERENCE
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
          .09em;
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
          .11em;
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
          6px;

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
          10px 19px;

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
          .09em;
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

        flex:
          0 0 auto;

        border-radius:
          50%;

        background:
          var(--nt-cyan);

        box-shadow:
          0 0 8px
          rgba(103,232,249,.7);
      }

      /* ========================================================
         PAUSE NAV
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
          19px 13px !important;

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
          .10em !important;

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
      }

      #pauseMenu.relay-options-unified
      .tab.active {

        color:
          var(--nt-white) !important;

        background:
          linear-gradient(
            90deg,
            rgba(34,211,238,.10),
            rgba(34,211,238,.02)
          ) !important;

        border-color:
          rgba(103,232,249,.22) !important;

        box-shadow:
          inset 3px 0
          var(--nt-cyan),
          0 0 19px
          rgba(34,211,238,.03);
      }

      /* ========================================================
         TITLE PANEL
         ======================================================== */

      #titlePanel.relay-options-unified {

        padding:
          11px !important;

        overflow:
          hidden !important;
      }

      #titlePanel.relay-options-unified
      .title-panel-card {

        position:
          relative !important;

        width:
          min(1080px,94vw) !important;

        height:
          min(780px,calc(100dvh - 22px)) !important;

        max-width:
          100% !important;

        max-height:
          calc(100dvh - 22px) !important;

        display:
          grid !important;

        padding:
          0 !important;

        border:
          1px solid
          rgba(103,232,249,.20) !important;

        border-radius:
          0 !important;

        background:
          #03080e !important;

        clip-path:
          var(--nt-cut) !important;

        overflow:
          hidden !important;

        box-shadow:
          var(--nt-shadow) !important;
      }

      #titlePanel.relay-options-unified
      .title-panel-close {

        position:
          absolute !important;

        z-index:
          300 !important;

        top:
          13px !important;

        right:
          13px !important;

        width:
          42px !important;

        height:
          42px !important;

        display:
          grid !important;

        place-items:
          center !important;

        padding:
          0 !important;

        color:
          var(--nt-white) !important;

        background:
          rgba(2,8,14,.92) !important;

        border:
          1px solid
          rgba(103,232,249,.22) !important;

        clip-path:
          var(--nt-cut-small) !important;

        cursor:
          pointer !important;

        font:
          700 23px/1
          system-ui,
          sans-serif !important;
      }

      #titlePanel.relay-options-unified
      .title-panel-close:hover {

        color:
          var(--nt-cyan) !important;

        border-color:
          var(--nt-cyan) !important;
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
            38px !important;

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
            .04em !important;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header,
        #titlePanel.relay-options-unified
        .nt-settings-header {

          padding:
            16px 57px 14px 13px;

          align-items:
            flex-start;

          gap:
            10px;
        }

        #pauseMenu.relay-options-unified
        .nt-brand-lockup,
        #titlePanel.relay-options-unified
        .nt-brand-lockup {

          align-items:
            flex-start;

          gap:
            9px;
        }

        #pauseMenu.relay-options-unified
        .nt-brand-mark,
        #titlePanel.relay-options-unified
        .nt-brand-mark {

          width:
            42px;

          height:
            42px;

          font-size:
            15px;
        }

        #pauseMenu.relay-options-unified
        .nt-system-kicker,
        #titlePanel.relay-options-unified
        .nt-system-kicker {

          font-size:
            6.5px;

          letter-spacing:
            .11em;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header h2,
        #titlePanel.relay-options-unified
        .nt-settings-header h2 {

          font-size:
            24px;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header p,
        #titlePanel.relay-options-unified
        .nt-settings-header p {

          font-size:
            9px;
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
            11px 9px 14px;
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
            11px;

          gap:
            10px;
        }

        #pauseMenu.relay-options-unified
        .nt-section-number,
        #titlePanel.relay-options-unified
        .nt-section-number {

          width:
            28px;

          height:
            28px;

          font-size:
            8px;
        }

        #pauseMenu.relay-options-unified
        .nt-section-heading h3,
        #titlePanel.relay-options-unified
        .nt-section-heading h3 {

          font-size:
            11px;
        }

        #pauseMenu.relay-options-unified
        .nt-option-card,
        #titlePanel.relay-options-unified
        .nt-option-card {

          min-height:
            74px;

          gap:
            8px;

          padding:
            10px;
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
            9px;

          line-height:
            1.30;
        }

        #pauseMenu.relay-options-unified
        .nt-toggle,
        #titlePanel.relay-options-unified
        .nt-toggle {

          width:
            78px;

          height:
            35px;

          font-size:
            8px;
        }

        #pauseMenu.relay-options-unified
        .nt-range-card,
        #titlePanel.relay-options-unified
        .nt-range-card {

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

          min-width:
            0;

          width:
            100%;
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
            55px;
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
            8px 10px;
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
            6px;
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
        }

        #titlePanel.relay-options-unified
        .title-panel-close {

          top:
            8px !important;

          right:
            8px !important;

          width:
            36px !important;

          height:
            36px !important;

          font-size:
            20px !important;
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
            35px !important;

          font-size:
            7px !important;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header,
        #titlePanel.relay-options-unified
        .nt-settings-header {

          padding:
            13px 50px 11px 10px;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header h2,
        #titlePanel.relay-options-unified
        .nt-settings-header h2 {

          font-size:
            21px;
        }

        #pauseMenu.relay-options-unified
        .nt-system-kicker,
        #titlePanel.relay-options-unified
        .nt-system-kicker {

          font-size:
            6px;
        }

        #pauseMenu.relay-options-unified
        .nt-settings-header p,
        #titlePanel.relay-options-unified
        .nt-settings-header p {

          font-size:
            8px;
        }

        #pauseMenu.relay-options-unified
        .nt-option-card,
        #titlePanel.relay-options-unified
        .nt-option-card {

          min-height:
            69px;

          padding:
            9px;
        }

        #pauseMenu.relay-options-unified
        .nt-option-copy strong,
        #titlePanel.relay-options-unified
        .nt-option-copy strong {

          font-size:
            8.5px;
        }

        #pauseMenu.relay-options-unified
        .nt-option-copy small,
        #titlePanel.relay-options-unified
        .nt-option-copy small {

          font-size:
            8px;
        }

        #pauseMenu.relay-options-unified
        .nt-toggle,
        #titlePanel.relay-options-unified
        .nt-toggle {

          width:
            69px;

          height:
            32px;

          font-size:
            7px;
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
     REFRESH
     ============================================================ */

  const refreshHost = host => {
    if (!host) return;

    const oldControls =
      host.querySelector(
        '[data-unified-controls-panel]'
      );

    const controlsOpen =
      oldControls
        ? oldControls.hidden === false
        : false;

    host.innerHTML =
      buildContent();

    const newControls =
      host.querySelector(
        '[data-unified-controls-panel]'
      );

    if (newControls) {
      newControls.hidden =
        !controlsOpen;
    }

    host.classList.remove(
      'relay-legacy-cleared'
    );
  };

  /* ============================================================
     MOUNT
     ============================================================ */

  const mount = (
    root,
    kind
  ) => {
    if (!root) return false;

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
     * One listener only per host.
     * This is important because Settings
     * can be opened many times.
     */

    if (
      host.dataset.ntSettingsBound !==
      'true'
    ) {
      host.dataset.ntSettingsBound =
        'true';

      /* ------------------------------------------
         CLICK
         ------------------------------------------ */

      host.addEventListener(
        'click',
        event => {
          if (
            !(event.target instanceof
              Element)
          ) {
            return;
          }

          /* TOGGLE */

          const toggle =
            event.target.closest(
              '[data-unified-toggle]'
            );

          if (toggle) {
            const key =
              toggle.dataset
                .unifiedToggle;

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

            applyToggle(
              key,
              next
            );

            updateToggleDom(
              host,
              key,
              next
            );

            return;
          }

          /* LANGUAGE */

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

          const languageOption =
            event.target.closest(
              '[data-nt-language-code]'
            );

          if (
            languageOption
          ) {
            setLanguage(
              languageOption.dataset
                .ntLanguageCode
            );

            refreshHost(
              host
            );

            return;
          }

          /* ACTION */

          const action =
            event.target.closest(
              '[data-nt-action]'
            );

          if (!action) {
            return;
          }

          const actionKey =
            action.dataset
              .ntAction;

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
            toggleControls(
              host
            );
            return;
          }

          if (
            actionKey ===
            'reset'
          ) {
            resetSettings(
              host
            );
          }
        },
        false
      );

      /* ------------------------------------------
         RANGE LIVE LABEL
         ------------------------------------------ */

      host.addEventListener(
        'input',
        event => {
          if (
            !(event.target instanceof
              HTMLInputElement)
          ) {
            return;
          }

          if (
            !event.target.matches(
              '[data-unified-range]'
            )
          ) {
            return;
          }

          const key =
            event.target.dataset
              .unifiedRange;

          const value =
            normaliseVolume(
              event.target.value
            );

          const valueLabel =
            host.querySelector(
              `[data-range-value="${safeCssEscape(
                key
              )}"]`
            );

          if (valueLabel) {
            valueLabel.textContent =
              `${Math.round(
                value * 100
              )}%`;
          }

          savePatch({
            [key]: value,
          });

          emitSettingsChange({
            key,
            value,
          });
        },
        false
      );
    }

    refreshHost(
      host
    );

    host.dataset.ntSettingsMounted =
      'true';

    return true;
  };

  /* ============================================================
     TOGGLE DOM UPDATE
     ============================================================ */

  const updateToggleDom = (
    host,
    key,
    enabled
  ) => {
    const selector =
      `[data-unified-toggle="${safeCssEscape(
        key
      )}"]`;

    const button =
      host.querySelector(
        selector
      );

    if (!button) {
      return;
    }

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
          '[Relay Options] fullscreen unavailable',
          error
        );
      }
    };

  /* ============================================================
     CONTROL REFERENCE
     ============================================================ */

  const toggleControls =
    host => {
      const panel =
        host.querySelector(
          '[data-unified-controls-panel]'
        );

      if (!panel) {
        return;
      }

      panel.hidden =
        !panel.hidden;
    };

  /* ============================================================
     RESET
     ============================================================ */

  const resetSettings =
    host => {
      savePatch({
        muted:
          stateDefaults.muted,

        musicVolume:
          stateDefaults.musicVolume,

        sfxVolume:
          stateDefaults.sfxVolume,

        screenShake:
          stateDefaults.screenShake,

        reducedMotion:
          stateDefaults.reducedMotion,

        rain:
          stateDefaults.rain,

        aiVoice:
          stateDefaults.aiVoice,

        tutorialEnabled:
          stateDefaults.tutorialEnabled,
      });

      writePresentation({
        ...presentationDefaults,
      });

      setLanguage('en');

      syncPresentationClasses(
        presentationDefaults
      );

      emitSettingsChange({
        reset: true,
      });

      refreshHost(
        host
      );
    };

  /* ============================================================
     HOME PANEL
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
        heading.textContent ||
          ''
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
     PAUSE PANEL
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
     OPEN PANELS
     ============================================================ */

  const renderOpenPanels = () => {
    renderHome();
    renderPause();

    syncPresentationClasses(
      readPresentation()
    );
  };

  /* ============================================================
     INIT
     ============================================================ */

  const init = () => {
    injectStyles();

    syncPresentationClasses(
      readPresentation()
    );

    /* HOME OPTIONS */

    document.addEventListener(
      'click',
      event => {
        if (
          !(event.target instanceof
            Element)
        ) {
          return;
        }

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

    /* PAUSE SETTINGS */

    document.addEventListener(
      'click',
      event => {
        if (
          !(event.target instanceof
            Element)
        ) {
          return;
        }

        const settingsTab =
          event.target.closest(
            '#pauseMenu [data-tab="settings"]'
          );

        if (!settingsTab) {
          return;
        }

        window.setTimeout(
          renderPause,
          0
        );
      },
      true
    );

    /* CLOSE LANGUAGE MENUS */

    document.addEventListener(
      'click',
      event => {
        if (
          !(event.target instanceof
            Element)
        ) {
          return;
        }

        if (
          event.target.closest(
            '.nt-language-control'
          )
        ) {
          return;
        }

        document
          .querySelectorAll(
            '[data-nt-language-menu]'
          )
          .forEach(menu => {
            menu.hidden = true;
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

    /* TITLE OBSERVER */

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
          attributes:
            true,
          attributeFilter: [
            'class',
          ],
        }
      );
    }

    /* PAUSE OBSERVER */

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
          attributes:
            true,
          attributeFilter: [
            'class',
          ],
        }
      );
    }

    /* EXTERNAL STATE CHANGES */

    window.addEventListener(
      'relay-settings-change',
      event => {
        syncPresentationClasses(
          readPresentation()
        );

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

    /* INITIAL RENDER */

    window.setTimeout(
      renderOpenPanels,
      0
    );
  };

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
