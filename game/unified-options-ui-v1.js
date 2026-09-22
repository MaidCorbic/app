import { loadState, saveState } from './src/state.js';

(() => {
  'use strict';

  if (window.__relayUnifiedOptionsUiV1) return;
  window.__relayUnifiedOptionsUiV1 = true;

  const LANGUAGE_KEY =
    'relay-runner-language';

  const PRESENTATION_KEY =
    'relay.runner.ui.preferences.v1';

  const LANGUAGES = [
    ['en', 'ENGLISH'],
    ['exyu', 'EX-YU'],
    ['es', 'ESPAÑOL'],
    ['de', 'DEUTSCH']
  ];

  const PRESENTATION_DEFAULTS = Object.freeze({
    intelCards: true,
    allyIntel: true,
    eventPopups: true,
    tutorialHints: true
  });

  const STATE_DEFAULTS = Object.freeze({
    muted: false,
    musicVolume: 0.55,
    sfxVolume: 0.70,
    screenShake: true,
    reducedMotion: false,
    rain: true,
    aiVoice: true,
    tutorialEnabled: true
  });

  const PRESENTATION_KEYS =
    new Set(
      Object.keys(PRESENTATION_DEFAULTS)
    );

  const clamp = (
    value,
    min = 0,
    max = 1
  ) =>
    Math.max(
      min,
      Math.min(
        max,
        Number(value) || 0
      )
    );

  const escapeHtml = value =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  /* =========================================================
     STATE
  ========================================================= */

  const getState = () => {
    try {
      return {
        ...STATE_DEFAULTS,
        ...(loadState() || {})
      };
    } catch (error) {
      console.warn(
        '[Relay Options] loadState failed',
        error
      );

      return {
        ...STATE_DEFAULTS
      };
    }
  };

  const savePatch = patch => {
    try {
      saveState({
        ...getState(),
        ...patch
      });
    } catch (error) {
      console.warn(
        '[Relay Options] saveState failed',
        error
      );
    }
  };

  /* =========================================================
     PRESENTATION
  ========================================================= */

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
        ...PRESENTATION_DEFAULTS,
        ...(
          parsed &&
          typeof parsed === 'object'
            ? parsed
            : {}
        )
      };
    } catch {
      return {
        ...PRESENTATION_DEFAULTS
      };
    }
  };

  const writePresentation = prefs => {
    try {
      localStorage.setItem(
        PRESENTATION_KEY,
        JSON.stringify({
          ...PRESENTATION_DEFAULTS,
          ...prefs
        })
      );
    } catch {}
  };

  /* =========================================================
     LANGUAGE
  ========================================================= */

  const getLanguage = () => {
    try {
      const value =
        localStorage.getItem(
          LANGUAGE_KEY
        );

      return LANGUAGES.some(
        ([code]) => code === value
      )
        ? value
        : 'en';
    } catch {
      return 'en';
    }
  };

  const setLanguage = code => {
    const safeCode =
      LANGUAGES.some(
        ([id]) => id === code
      )
        ? code
        : 'en';

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
            code: safeCode
          }
        }
      )
    );
  };

  /* =========================================================
     PRESENTATION CLASSES
  ========================================================= */

  const syncPresentationClasses = prefs => {
    const safe = {
      ...PRESENTATION_DEFAULTS,
      ...(prefs || {})
    };

    document.body?.classList.toggle(
      'relay-hide-intel',
      safe.intelCards === false
    );

    document.body?.classList.toggle(
      'relay-hide-ally',
      safe.allyIntel === false
    );

    document.body?.classList.toggle(
      'relay-hide-events',
      safe.eventPopups === false
    );

    document.body?.classList.toggle(
      'relay-hide-tutorials',
      safe.tutorialHints === false
    );
  };

  /* =========================================================
     SETTINGS EVENT
  ========================================================= */

  const emitSettingsChange = detail => {
    try {
      window.dispatchEvent(
        new CustomEvent(
          'relay-settings-change',
          {
            detail
          }
        )
      );
    } catch {}
  };

  /* =========================================================
     VOICE SETTINGS
  ========================================================= */

  const getRunnerVoiceSettings = () => {
    const scene =
      window.__relayRunnerScene;

    try {
      if (
        scene &&
        typeof scene.getVoiceSettings ===
          'function'
      ) {
        return scene.getVoiceSettings();
      }
    } catch {}

    let enabled = true;
    let volume = 0.82;
    let voiceName = '';

    try {
      const savedEnabled =
        localStorage.getItem(
          'runner_voice_enabled'
        );

      if (
        savedEnabled === '0' ||
        savedEnabled === 'false'
      ) {
        enabled = false;
      } else if (
        savedEnabled === '1' ||
        savedEnabled === 'true'
      ) {
        enabled = true;
      }
    } catch {}

    try {
      const savedVolume =
        Number(
          localStorage.getItem(
            'runner_voice_volume'
          )
        );

      if (
        Number.isFinite(
          savedVolume
        )
      ) {
        volume =
          Math.max(
            0,
            Math.min(
              1,
              savedVolume
            )
          );
      }
    } catch {}

    try {
      const savedName =
        localStorage.getItem(
          'runner_voice_name'
        );

      if (
        typeof savedName === 'string'
      ) {
        voiceName = savedName;
      }
    } catch {}

    return {
      enabled,
      volume,
      voiceName
    };
  };

  const getRunnerVoices = () => {
    const scene =
      window.__relayRunnerScene;

    try {
      if (
        scene &&
        Array.isArray(
          scene.voiceVoices
        ) &&
        scene.voiceVoices.length
      ) {
        return scene.voiceVoices;
      }
    } catch {}

    try {
      if (
        'speechSynthesis' in window &&
        typeof window.speechSynthesis.getVoices ===
          'function'
      ) {
        return window.speechSynthesis.getVoices();
      }
    } catch {}

    return [];
  };

  /* =========================================================
     GRAPHICS SETTINGS
  ========================================================= */

  const getRunnerGraphicsSettings = () => {
    const scene =
      window.__relayRunnerScene;

    try {
      if (
        scene &&
        typeof scene.getGraphicsSettings ===
          'function'
      ) {
        return scene.getGraphicsSettings();
      }
    } catch {}

    let quality =
      'HIGH';

    try {
      quality =
        localStorage.getItem(
          'runner_graphics_quality'
        ) ||
        'HIGH';
    } catch {}

    quality =
      String(
        quality
      ).toUpperCase();

    const levelMap = {
      LOW: 0,
      MEDIUM: 1,
      HIGH: 2,
      ULTRA: 3
    };

    if (
      !Object.prototype.hasOwnProperty.call(
        levelMap,
        quality
      )
    ) {
      quality = 'HIGH';
    }

    const level =
      levelMap[quality];

    return {
      quality,
      level,
      effects: true,
      particles: level >= 1,
      lighting: level >= 2,
      weather: level >= 1
    };
  };

  const syncRunnerGraphicsDom = host => {
    if (!host) return;

    const settings =
      getRunnerGraphicsSettings();

    const quality =
      String(
        settings.quality ||
          'HIGH'
      ).toUpperCase();

    host
      .querySelectorAll(
        '[data-runner-graphics-quality]'
      )
      .forEach(button => {
        const active =
          button.dataset
            .runnerGraphicsQuality ===
          quality;

        button.classList.toggle(
          'is-active',
          active
        );

        button.setAttribute(
          'aria-pressed',
          String(active)
        );
      });

    const current =
      host.querySelector(
        '[data-runner-graphics-current]'
      );

    if (current) {
      current.textContent =
        quality;
    }

    const effects =
      host.querySelector(
        '[data-runner-graphics-effects]'
      );

    const particles =
      host.querySelector(
        '[data-runner-graphics-particles]'
      );

    const lighting =
      host.querySelector(
        '[data-runner-graphics-lighting]'
      );

    const weather =
      host.querySelector(
        '[data-runner-graphics-weather]'
      );

    if (effects) {
      effects.textContent =
        settings.effects === false
          ? 'OFF'
          : 'ON';
    }

    if (particles) {
      particles.textContent =
        settings.particles === false
          ? 'OFF'
          : 'ON';
    }

    if (lighting) {
      lighting.textContent =
        settings.lighting === false
          ? 'OFF'
          : 'ON';
    }

    if (weather) {
      weather.textContent =
        settings.weather === false
          ? 'OFF'
          : 'ON';
    }
  };

  const setRunnerGraphicsQuality = (
    host,
    quality
  ) => {
    const safeQuality =
      String(
        quality || ''
      )
        .trim()
        .toUpperCase();

    if (
      ![
        'LOW',
        'MEDIUM',
        'HIGH',
        'ULTRA'
      ].includes(
        safeQuality
      )
    ) {
      return;
    }

    const scene =
      window.__relayRunnerScene;

    if (
      scene &&
      typeof scene.setGraphicsQuality ===
        'function'
    ) {
      try {
        const result =
          scene.setGraphicsQuality(
            safeQuality
          );

        if (result === false) {
          return;
        }
      } catch (error) {
        console.warn(
          '[Relay Options] setGraphicsQuality failed',
          error
        );

        return;
      }
    } else {
      try {
        localStorage.setItem(
          'runner_graphics_quality',
          safeQuality
        );
      } catch {}
    }

    syncRunnerGraphicsDom(
      host
    );

    emitSettingsChange({
      key: 'graphicsQuality',
      value: safeQuality
    });
  };

  /* =========================================================
     CSS
  ========================================================= */

  const injectStyles = () => {
    if (
      document.getElementById(
        'relay-unified-options-style'
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        'style'
      );

    style.id =
      'relay-unified-options-style';

    style.textContent = `
      #titlePanel.relay-options-unified,
      #pauseMenu.relay-options-unified{
        isolation:isolate;
      }

      #titlePanel.relay-options-unified{
        z-index:5000 !important;
        pointer-events:auto !important;
      }

      #titlePanel.relay-options-unified.hidden{
        pointer-events:none !important;
      }

      #titlePanel.relay-options-unified .title-panel-card{
        position:relative;
        z-index:5001 !important;
        pointer-events:auto !important;
      }

      #titlePanelContent.relay-legacy-cleared{
        display:block !important;
      }

      #titlePanel.relay-options-unified #titlePanelContent,
      #pauseMenu.relay-options-unified #panelContent{
        min-width:0;
        min-height:0;
        pointer-events:auto !important;
      }

      #titlePanel.relay-options-unified .relay-options-shell,
      #pauseMenu.relay-options-unified .relay-options-shell{
        min-width:0;
        min-height:0;
        height:100%;
        display:grid;
        grid-template-rows:auto minmax(0,1fr);
        overflow:hidden;
      }

      #titlePanel.relay-options-unified .relay-options-body,
      #pauseMenu.relay-options-unified .relay-options-body{
        min-width:0;
        min-height:0;
        overflow:auto;
        overscroll-behavior:contain;
        -webkit-overflow-scrolling:touch;
        touch-action:pan-y;
      }

      #titlePanel.relay-options-unified .relay-options-section.full,
      #pauseMenu.relay-options-unified .relay-options-section.full{
        margin-top:14px;
      }

      #titlePanel.relay-options-unified .relay-options-section.full .relay-section-title,
      #pauseMenu.relay-options-unified .relay-options-section.full .relay-section-title{
        margin-bottom:10px;
      }

      #titlePanel.relay-options-unified .relay-select,
      #pauseMenu.relay-options-unified .relay-select{
        position:relative;
        margin-bottom:0;
        padding-bottom:12px;
      }

      .relay-graphics-section{
        position:relative;
      }

      .relay-graphics-card{
        position:relative;
        overflow:hidden;
      }

      .relay-graphics-quality{
        display:grid;
        grid-template-columns:repeat(
          4,
          minmax(0,1fr)
        );
        gap:8px;
        margin-top:14px;
      }

      .relay-graphics-button{
        min-height:42px;
        border:1px solid rgba(
          56,
          189,
          248,
          .28
        );
        background:linear-gradient(
          180deg,
          rgba(10,28,45,.96),
          rgba(4,12,22,.98)
        );
        color:rgba(
          210,
          240,
          255,
          .72
        );
        font:
          800 10px/1
          Arial,
          sans-serif;
        letter-spacing:.12em;
        cursor:pointer;
        transition:
          border-color .18s ease,
          background .18s ease,
          color .18s ease,
          box-shadow .18s ease,
          transform .18s ease;
      }

      .relay-graphics-button:hover{
        border-color:rgba(
          56,
          189,
          248,
          .72
        );
        color:#dff8ff;
        transform:translateY(-1px);
      }

      .relay-graphics-button.is-active{
        border-color:rgba(
          56,
          189,
          248,
          .95
        );
        background:linear-gradient(
          180deg,
          rgba(13,61,88,.98),
          rgba(5,24,39,.98)
        );
        color:#e8fbff;
        box-shadow:
          inset 0 0 20px
            rgba(56,189,248,.10),
          0 0 16px
            rgba(56,189,248,.14);
      }

      .relay-graphics-current{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-top:12px;
        padding-top:11px;
        border-top:1px solid
          rgba(255,255,255,.07);
      }

      .relay-graphics-current span{
        font-size:8px;
        font-weight:800;
        letter-spacing:.14em;
        color:rgba(
          203,
          213,
          225,
          .48
        );
      }

      .relay-graphics-current strong{
        font-size:11px;
        font-weight:900;
        letter-spacing:.12em;
        color:#7dd3fc;
      }

      .relay-graphics-info{
        display:grid;
        grid-template-columns:repeat(
          4,
          minmax(0,1fr)
        );
        gap:7px;
        margin-top:9px;
      }

      .relay-graphics-info span{
        display:flex;
        justify-content:space-between;
        gap:6px;
        padding:8px 9px;
        border:1px solid
          rgba(255,255,255,.055);
        background:
          rgba(255,255,255,.018);
        font-size:7px;
        font-weight:800;
        letter-spacing:.08em;
        color:rgba(
          203,
          213,
          225,
          .48
        );
      }

      .relay-graphics-info b{
        color:#7dd3fc;
      }

      .relay-voice-select{
        display:grid;
        grid-template-columns:
          minmax(0,1fr)
          220px;
        align-items:center;
        gap:14px;
        margin-top:10px;
        padding:12px;
        border:1px solid
          rgba(255,255,255,.055);
        background:
          rgba(255,255,255,.018);
      }

      .relay-voice-select select{
        width:100%;
        min-width:0;
        min-height:42px;
        padding:10px 12px;
        border:1px solid
          rgba(56,189,248,.28);
        border-radius:3px;
        background:#071421;
        color:#dff8ff;
        font:
          800 10px/1.2
          Arial,
          sans-serif;
        letter-spacing:.06em;
        cursor:pointer;
        outline:none;
      }

      .relay-voice-select select:hover,
      .relay-voice-select select:focus{
        border-color:
          rgba(56,189,248,.72);
        box-shadow:
          0 0 15px
          rgba(56,189,248,.10);
      }

      .relay-voice-actions{
        margin-top:10px;
      }

      .relay-voice-actions .relay-action{
        width:100%;
      }

      #titlePanel.relay-options-unified .relay-action-row,
      #pauseMenu.relay-options-unified .relay-action-row{
        display:grid;
        grid-template-columns:
          repeat(
            3,
            minmax(0,1fr)
          );
        gap:10px;
        margin-top:15px;
        padding-top:14px;
        border-top:1px solid
          rgba(255,255,255,.07);
      }

      #titlePanel.relay-options-unified .relay-action,
      #pauseMenu.relay-options-unified .relay-action{
        position:relative;
        min-width:0;
        min-height:44px;
        padding:10px 12px;
        border:1px solid
          rgba(56,189,248,.26);
        border-radius:3px;
        background:linear-gradient(
          180deg,
          rgba(12,31,48,.98),
          rgba(4,13,23,.98)
        );
        color:rgba(
          214,
          241,
          255,
          .74
        );
        font:
          800 9px/1.25
          Arial,
          sans-serif;
        letter-spacing:.11em;
        text-align:center;
        white-space:normal;
        cursor:pointer;
        transition:
          border-color .18s ease,
          background .18s ease,
          color .18s ease,
          box-shadow .18s ease,
          transform .18s ease;
      }

      #titlePanel.relay-options-unified .relay-action:hover,
      #pauseMenu.relay-options-unified .relay-action:hover{
        border-color:
          rgba(56,189,248,.72);
        color:#e8fbff;
        background:linear-gradient(
          180deg,
          rgba(14,51,72,.98),
          rgba(5,20,32,.98)
        );
        box-shadow:
          inset 0 0 18px
            rgba(56,189,248,.08),
          0 0 15px
            rgba(56,189,248,.12);
        transform:translateY(-1px);
      }

      #titlePanel.relay-options-unified .relay-action:active,
      #pauseMenu.relay-options-unified .relay-action:active{
        transform:translateY(0);
      }

      #titlePanel.relay-options-unified .relay-controls-strip,
      #pauseMenu.relay-options-unified .relay-controls-strip{
        margin-top:10px;
        padding-top:10px;
        border-top:1px solid
          rgba(255,255,255,.045);
      }

      @media (max-width:780px){

        .relay-graphics-quality{
          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );
        }

        .relay-graphics-info{
          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );
        }

        .relay-voice-select{
          grid-template-columns:1fr;
          gap:9px;
        }

        #titlePanel.relay-options-unified .relay-action-row,
        #pauseMenu.relay-options-unified .relay-action-row{
          grid-template-columns:1fr;
          gap:8px;
          margin-top:13px;
          padding-top:13px;
        }

        #titlePanel.relay-options-unified .relay-action,
        #pauseMenu.relay-options-unified .relay-action{
          min-height:44px;
          padding:11px 12px;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  };

  /* =========================================================
     MARKUP HELPERS
  ========================================================= */

  const toggleMarkup = (
    key,
    label,
    detail,
    enabled
  ) => {
    const active =
      Boolean(enabled);

    return `
      <article
        class="relay-option-card"
        data-option-key="${escapeHtml(key)}"
      >
        <div class="relay-option-copy">
          <strong>
            ${escapeHtml(label)}
          </strong>

          <small>
            ${escapeHtml(detail)}
          </small>
        </div>

        <button
          class="relay-toggle ${
            active
              ? 'is-on'
              : ''
          }"
          type="button"
          data-unified-toggle="${escapeHtml(key)}"
          aria-pressed="${active}"
          aria-label="${escapeHtml(label)}: ${
            active
              ? 'ON'
              : 'OFF'
          }"
        >
          ${active ? 'ON' : 'OFF'}
        </button>
      </article>
    `;
  };

  const rangeMarkup = (
    key,
    label,
    value,
    detail
  ) => {
    const safeValue =
      clamp(value);

    return `
      <article class="relay-option-card">
        <div class="relay-option-copy">
          <strong>
            ${escapeHtml(label)}
          </strong>

          <small>
            ${escapeHtml(detail)}
          </small>
        </div>

        <div class="relay-range">
          <div class="relay-range-head">
            <span>LEVEL</span>

            <span
              class="relay-range-value"
              data-range-value="${escapeHtml(key)}"
            >
              ${Math.round(
                safeValue * 100
              )}%
            </span>
          </div>

          <input
            data-unified-range="${escapeHtml(key)}"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value="${safeValue}"
            aria-label="${escapeHtml(label)}"
          >
        </div>
      </article>
    `;
  };

  /* =========================================================
     BUILD CONTENT
  ========================================================= */

  const buildContent = () => {
    const state =
      getState();

    const prefs =
      readPresentation();

    const voice =
      getRunnerVoiceSettings();

    const voices =
      getRunnerVoices();

    const current =
      LANGUAGES.find(
        ([code]) =>
          code === getLanguage()
      ) ||
      LANGUAGES[0];

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

            <!-- =================================================
                 GAMEPLAY
            ================================================== -->

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

            <!-- =================================================
                 AUDIO
            ================================================== -->

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
                voice.enabled
              )}

              ${rangeMarkup(
                'voiceVolume',
                'VOICE',
                voice.volume,
                'AI narration volume'
              )}

              <div class="relay-voice-select">

                <div class="relay-option-copy">
                  <strong>
                    VOICE PROFILE
                  </strong>

                  <small>
                    Select the browser voice used for AI narration
                  </small>
                </div>

                <select
                  data-unified-voice
                  aria-label="AI voice profile"
                >

                  <option
                    value=""
                    ${
                      !voice.voiceName
                        ? 'selected'
                        : ''
                    }
                  >
                    AUTO / DEFAULT
                  </option>

                  ${voices
                    .filter(
                      item =>
                        item &&
                        item.name
                    )
                    .map(
                      item => `
                        <option
                          value="${escapeHtml(
                            item.name
                          )}"
                          ${
                            item.name ===
                            voice.voiceName
                              ? 'selected'
                              : ''
                          }
                        >
                          ${escapeHtml(
                            item.name
                          )}
                          ${
                            item.lang
                              ? ` · ${escapeHtml(
                                  item.lang
                                )}`
                              : ''
                          }
                        </option>
                      `
                    )
                    .join('')}

                </select>

              </div>

              <div class="relay-voice-actions">

                <button
                  type="button"
                  class="relay-action"
                  data-unified-voice-test
                >
                  TEST VOICE
                </button>

              </div>

              ${rangeMarkup(
                'musicVolume',
                'MUSIC',
                state.musicVolume,
                'Background music level'
              )}

              ${rangeMarkup(
                'sfxVolume',
                'SFX',
                state.sfxVolume,
                'Gameplay sound effects'
              )}

            </section>

            <!-- =================================================
                 INTERFACE
            ================================================== -->

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

            <!-- =================================================
                 GRAPHICS
            ================================================== -->

            <section
              class="relay-options-section full relay-graphics-section"
            >

              <div class="relay-section-title">
                GRAPHICS
              </div>

              <article
                class="relay-option-card relay-graphics-card"
              >

                <div class="relay-option-copy">

                  <strong>
                    RENDER QUALITY
                  </strong>

                  <small>
                    Runner Scene visual quality, particles, lighting and weather effects.
                  </small>

                </div>

                <div class="relay-graphics-quality">

                  <button
                    type="button"
                    class="relay-graphics-button"
                    data-runner-graphics-quality="LOW"
                    aria-pressed="false"
                  >
                    LOW
                  </button>

                  <button
                    type="button"
                    class="relay-graphics-button"
                    data-runner-graphics-quality="MEDIUM"
                    aria-pressed="false"
                  >
                    MEDIUM
                  </button>

                  <button
                    type="button"
                    class="relay-graphics-button"
                    data-runner-graphics-quality="HIGH"
                    aria-pressed="false"
                  >
                    HIGH
                  </button>

                  <button
                    type="button"
                    class="relay-graphics-button"
                    data-runner-graphics-quality="ULTRA"
                    aria-pressed="false"
                  >
                    ULTRA
                  </button>

                </div>

                <div class="relay-graphics-current">

                  <span>
                    CURRENT QUALITY
                  </span>

                  <strong
                    data-runner-graphics-current
                  >
                    HIGH
                  </strong>

                </div>

                <div class="relay-graphics-info">

                  <span>
                    EFFECTS
                    <b data-runner-graphics-effects>
                      ON
                    </b>
                  </span>

                  <span>
                    PARTICLES
                    <b data-runner-graphics-particles>
                      ON
                    </b>
                  </span>

                  <span>
                    LIGHTING
                    <b data-runner-graphics-lighting>
                      ON
                    </b>
                  </span>

                  <span>
                    WEATHER
                    <b data-runner-graphics-weather>
                      ON
                    </b>
                  </span>

                </div>

              </article>

            </section>

            <!-- =================================================
                 SYSTEM
            ================================================== -->

            <section class="relay-options-section full">

              <div class="relay-section-title">
                SYSTEM
              </div>

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
                  🌐
                  ${escapeHtml(
                    current[1]
                  )}
                </button>

                <div
                  class="relay-language-menu hidden"
                  data-unified-language-menu
                  role="listbox"
                >

                  ${LANGUAGES
                    .map(
                      ([code, name]) => `
                        <button
                          type="button"
                          data-unified-language-code="${escapeHtml(
                            code
                          )}"
                          class="${
                            code ===
                            current[0]
                              ? 'active'
                              : ''
                          }"
                          role="option"
                          aria-selected="${
                            code ===
                            current[0]
                          }"
                        >
                          ${escapeHtml(
                            name
                          )}
                        </button>
                      `
                    )
                    .join('')}

                </div>

              </div>

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

              <div
                class="relay-controls-strip"
                data-unified-controls-panel
                hidden
              >

                <span class="relay-key">
                  <kbd>A</kbd>
                  <span>MOVE LEFT</span>
                </span>

                <span class="relay-key">
                  <kbd>D</kbd>
                  <span>MOVE RIGHT</span>
                </span>

                <span class="relay-key">
                  <kbd>SPACE</kbd>
                  <span>JUMP</span>
                </span>

                <span class="relay-key">
                  <kbd>E</kbd>
                  <span>ACTION</span>
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

  /* =========================================================
     TOGGLE DOM
  ========================================================= */

  const updateToggleDom = (
    host,
    key,
    enabled
  ) => {
    const button =
      [
        ...host.querySelectorAll(
          '[data-unified-toggle]'
        )
      ].find(
        item =>
          item.dataset
            .unifiedToggle ===
          key
      );

    if (!button) {
      return;
    }

    button.classList.toggle(
      'is-on',
      enabled
    );

    button.classList.toggle(
      'is-off',
      !enabled
    );

    button.setAttribute(
      'aria-pressed',
      String(
        Boolean(enabled)
      )
    );

    button.setAttribute(
      'aria-label',
      `${key}: ${
        enabled
          ? 'ON'
          : 'OFF'
      }`
    );

    button.textContent =
      enabled
        ? 'ON'
        : 'OFF';
  };

  /* =========================================================
     MOUNT
  ========================================================= */

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

    root.removeAttribute(
      'hidden'
    );

    root.setAttribute(
      'aria-hidden',
      'false'
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
     * Always rebuild the body when Options opens.
     * This guarantees the UI reflects the latest
     * persisted/runtime values.
     */
    host.innerHTML =
      buildContent();

    host.classList.remove(
      'relay-legacy-cleared'
    );

    syncRunnerGraphicsDom(
      host
    );

    return true;
  };

  /* =========================================================
     REFRESH OPEN OPTIONS
  ========================================================= */

  const refreshOpenOptions = () => {
    const home =
      findOpenHome();

    const pause =
      findOpenPause();

    if (home) {
      const host =
        home.querySelector(
          '#titlePanelContent'
        );

      if (host) {
        host.innerHTML =
          buildContent();

        syncRunnerGraphicsDom(
          host
        );
      }
    }

    if (pause) {
      const host =
        pause.querySelector(
          '#panelContent'
        );

      if (host) {
        host.innerHTML =
          buildContent();

        syncRunnerGraphicsDom(
          host
        );
      }
    }
  };

  /* =========================================================
     FIND OPEN HOME
  ========================================================= */

  const findOpenHome = () => {
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
      return null;
    }

    const heading =
      document.getElementById(
        'titlePanelHeading'
      );

    if (
      heading &&
      /OPTIONS|RUN SETTINGS/i.test(
        heading.textContent || ''
      )
    ) {
      return panel;
    }

    return panel.classList.contains(
      'relay-options-unified'
    )
      ? panel
      : null;
  };

  /* =========================================================
     FIND OPEN PAUSE
  ========================================================= */

  const findOpenPause = () => {
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
      return null;
    }

    const tab =
      pause.querySelector(
        '[data-tab="settings"]'
      );

    return tab?.classList.contains(
      'active'
    )
      ? pause
      : null;
  };

  /* =========================================================
     OPEN HOME OPTIONS
  ========================================================= */

  const openHomeOptions = event => {
    const panel =
      document.getElementById(
        'titlePanel'
      );

    const heading =
      document.getElementById(
        'titlePanelHeading'
      );

    if (!panel) {
      return false;
    }

    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();

    panel.classList.remove(
      'hidden'
    );

    panel.removeAttribute(
      'hidden'
    );

    panel.setAttribute(
      'aria-hidden',
      'false'
    );

    if (heading) {
      heading.textContent =
        'OPTIONS';

      heading.className =
        'relay-options-title';
    }

    return mount(
      panel,
      'home'
    );
  };

  /* =========================================================
     CONTROLS
  ========================================================= */

  const openControls = host => {
    const panel =
      host.querySelector(
        '[data-unified-controls-panel]'
      );

    const button =
      host.querySelector(
        '[data-unified-controls]'
      );

    if (!panel) {
      return;
    }

    panel.hidden =
      !panel.hidden;

    button?.setAttribute(
      'aria-expanded',
      String(
        !panel.hidden
      )
    );
  };

  /* =========================================================
     RESET OPTIONS
  ========================================================= */

  const resetOptions = host => {
    saveState({
      ...getState(),
      ...STATE_DEFAULTS
    });

    writePresentation(
      PRESENTATION_DEFAULTS
    );

    try {
      localStorage.setItem(
        'runner_graphics_quality',
        'HIGH'
      );

      localStorage.setItem(
        'runner_voice_enabled',
        '1'
      );

      localStorage.setItem(
        'runner_voice_volume',
        '0.82'
      );

      localStorage.setItem(
        'runner_voice_name',
        ''
      );
    } catch {}

    const scene =
      window.__relayRunnerScene;

    if (scene) {
      try {
        scene.setVoiceEnabled(
          true
        );
      } catch {}

      try {
        scene.setVoiceVolume(
          0.82
        );
      } catch {}

      try {
        scene.setVoiceByName(
          ''
        );
      } catch {}

      try {
        scene.setGraphicsQuality(
          'HIGH'
        );
      } catch {}

      try {
        scene.screenShake = true;
        scene.motionReduced = false;
      } catch {}

      try {
        scene.rain?.setVisible?.(
          true
        );
      } catch {}
    }

    setLanguage(
      'en'
    );

    syncPresentationClasses(
      PRESENTATION_DEFAULTS
    );

    host.innerHTML =
      buildContent();

    syncRunnerGraphicsDom(
      host
    );

    emitSettingsChange({
      reset: true
    });
  };

  /* =========================================================
     TOGGLE
  ========================================================= */

  const handleToggle = (
    host,
    button
  ) => {
    const key =
      button.dataset
        .unifiedToggle;

    const state =
      getState();

    const prefs =
      readPresentation();

    const current =
      PRESENTATION_KEYS.has(
        key
      )
        ? prefs[key] !== false
        : key === 'muted'
          ? state.muted !== true
          : key === 'aiVoice'
            ? getRunnerVoiceSettings()
                .enabled
            : Boolean(
                state[key]
              );

    const next =
      !current;

    /* -----------------------------------------
       PRESENTATION
    ----------------------------------------- */

    if (
      PRESENTATION_KEYS.has(
        key
      )
    ) {
      prefs[key] =
        next;

      writePresentation(
        prefs
      );

      syncPresentationClasses(
        prefs
      );

      updateToggleDom(
        host,
        key,
        next
      );

      emitSettingsChange({
        key,
        value: next,
        presentation: true
      });

      return;
    }

    /* -----------------------------------------
       AI VOICE
       RunnerScene = runtime owner
    ----------------------------------------- */

    if (
      key === 'aiVoice'
    ) {
      const scene =
        window.__relayRunnerScene;

      if (
        scene &&
        typeof scene.setVoiceEnabled ===
          'function'
      ) {
        try {
          scene.setVoiceEnabled(
            next
          );
        } catch (error) {
          console.warn(
            '[Relay Options] setVoiceEnabled failed',
            error
          );
        }
      } else {
        try {
          localStorage.setItem(
            'runner_voice_enabled',
            next
              ? '1'
              : '0'
          );
        } catch {}
      }

      savePatch({
        aiVoice: next
      });

      updateToggleDom(
        host,
        key,
        next
      );

      emitSettingsChange({
        key,
        value: next,
        runnerScene: true
      });

      return;
    }

    /* -----------------------------------------
       NORMAL STATE TOGGLES
    ----------------------------------------- */

    savePatch(
      key === 'muted'
        ? {
            muted: !next
          }
        : {
            [key]: next
          }
    );

    /*
     * Apply the settings that have direct
     * RunnerScene/runtime hooks immediately.
     * The main runtime still remains the
     * persistence owner for core state.
     */
    const scene =
      window.__relayRunnerScene;

    try {
      if (key === 'screenShake' && scene) {
        scene.screenShake = Boolean(next);
      }

      if (key === 'reducedMotion' && scene) {
        scene.motionReduced = Boolean(next);
      }

      if (key === 'rain' && scene) {
        scene.rain?.setVisible?.(
          Boolean(next)
        );
      }

      if (key === 'muted' && next === false) {
        window.speechSynthesis?.cancel?.();
      }
    } catch (error) {
      console.warn(
        '[Relay Options] runtime toggle apply failed',
        error
      );
    }

    updateToggleDom(
      host,
      key,
      next
    );

    emitSettingsChange({
      key,
      value: next,
      presentation: false
    });
  };

  /* =========================================================
     RANGE / SLIDERS
  ========================================================= */

  const handleRange = (
    host,
    range
  ) => {
    const key =
      range.dataset
        .unifiedRange;

    const value =
      clamp(
        range.value
      );

    const label =
      [
        ...host.querySelectorAll(
          '[data-range-value]'
        )
      ].find(
        item =>
          item.dataset
            .rangeValue ===
          key
      );

    if (label) {
      label.textContent =
        `${Math.round(
          value * 100
        )}%`;
    }

    /* -----------------------------------------
       AI VOICE VOLUME
    ----------------------------------------- */

    if (
      key === 'voiceVolume'
    ) {
      const scene =
        window.__relayRunnerScene;

      if (
        scene &&
        typeof scene.setVoiceVolume ===
          'function'
      ) {
        try {
          scene.setVoiceVolume(
            value
          );
        } catch (error) {
          console.warn(
            '[Relay Options] setVoiceVolume failed',
            error
          );
        }
      } else {
        try {
          localStorage.setItem(
            'runner_voice_volume',
            String(value)
          );
        } catch {}
      }

      emitSettingsChange({
        key,
        value,
        runnerScene: true
      });

      return;
    }

    /* -----------------------------------------
       NORMAL STATE SLIDERS
    ----------------------------------------- */

    savePatch({
      [key]: value
    });

    emitSettingsChange({
      key,
      value,
      runtime: true
    });
  };

  /* =========================================================
     INIT
  ========================================================= */

  const init = () => {
    injectStyles();

    syncPresentationClasses(
      readPresentation()
    );

    /* -----------------------------------------
       OPEN HOME OPTIONS
    ----------------------------------------- */

    document.addEventListener(
      'relay-open-home-options',
      openHomeOptions
    );

    /* -----------------------------------------
       MAIN CLICK DELEGATION
    ----------------------------------------- */

    document.addEventListener(
      'click',
      event => {
        const target =
          event.target;

        if (
          !(
            target instanceof
            Element
          )
        ) {
          return;
        }

        /* -----------------------------------
           PAUSE SETTINGS
        ----------------------------------- */

        const pauseSettings =
          target.closest(
            '#pauseMenu [data-tab="settings"]'
          );

        if (
          pauseSettings
        ) {
          window.setTimeout(
            () => {
              const pause =
                findOpenPause();

              if (pause) {
                mount(
                  pause,
                  'pause'
                );
              }
            },
            0
          );

          return;
        }

        /* -----------------------------------
           HOME OPTIONS
        ----------------------------------- */

        const homeControl =
          target.closest(
            '#intro [data-title-panel="controls"],' +
            '#intro [data-home-v4-action="options"],' +
            '#intro [data-final-home="options"],' +
            '#intro [data-final-home-button="options"]'
          );

        if (
          homeControl
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();

          openHomeOptions(
            event
          );

          return;
        }

        /* -----------------------------------
           OPTIONS HOST
        ----------------------------------- */

        const host =
          target.closest(
            '#titlePanelContent, #panelContent'
          );

        if (!host) {
          return;
        }

        const root =
          host.closest(
            '#titlePanel, #pauseMenu'
          );

        if (
          !root?.classList.contains(
            'relay-options-unified'
          )
        ) {
          return;
        }

        /* -----------------------------------
           GRAPHICS
        ----------------------------------- */

        const graphicsButton =
          target.closest(
            '[data-runner-graphics-quality]'
          );

        if (
          graphicsButton
        ) {
          event.preventDefault();
          event.stopPropagation();

          setRunnerGraphicsQuality(
            host,
            graphicsButton.dataset
              .runnerGraphicsQuality
          );

          return;
        }

        /* -----------------------------------
           TEST VOICE
        ----------------------------------- */

        const voiceTestButton =
          target.closest(
            '[data-unified-voice-test]'
          );

        if (
          voiceTestButton
        ) {
          event.preventDefault();
          event.stopPropagation();

          const scene =
            window.__relayRunnerScene;

          if (
            scene &&
            typeof scene.testVoice ===
              'function'
          ) {
            try {
              scene.testVoice();
            } catch (error) {
              console.warn(
                '[Relay Options] testVoice failed',
                error
              );
            }
          }

          return;
        }

        /* -----------------------------------
           TOGGLE
        ----------------------------------- */

        const toggle =
          target.closest(
            '[data-unified-toggle]'
          );

        if (toggle) {
          event.preventDefault();

          handleToggle(
            host,
            toggle
          );

          return;
        }

        /* -----------------------------------
           LANGUAGE BUTTON
        ----------------------------------- */

        const langButton =
          target.closest(
            '[data-unified-language]'
          );

        if (
          langButton
        ) {
          event.preventDefault();

          const menu =
            host.querySelector(
              '[data-unified-language-menu]'
            );

          if (!menu) {
            return;
          }

          const open =
            !menu.classList.contains(
              'hidden'
            );

          menu.classList.toggle(
            'hidden',
            open
          );

          langButton.setAttribute(
            'aria-expanded',
            String(
              !open
            )
          );

          return;
        }

        /* -----------------------------------
           LANGUAGE CODE
        ----------------------------------- */

        const langCode =
          target.closest(
            '[data-unified-language-code]'
          );

        if (
          langCode
        ) {
          event.preventDefault();
          event.stopPropagation();

          const code =
            langCode.dataset
              .unifiedLanguageCode;

          setLanguage(
            code
          );

          host.innerHTML =
            buildContent();

          syncRunnerGraphicsDom(
            host
          );

          return;
        }

        /* -----------------------------------
           FULLSCREEN
        ----------------------------------- */

        const fullscreen =
          target.closest(
            '[data-unified-fullscreen]'
          );

        if (
          fullscreen
        ) {
          event.preventDefault();

          (async () => {
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
                  )
              });
            } catch {}
          })();

          return;
        }

        /* -----------------------------------
           RESET
        ----------------------------------- */

        const reset =
          target.closest(
            '[data-unified-reset]'
          );

        if (
          reset
        ) {
          event.preventDefault();

          resetOptions(
            host
          );

          return;
        }

        /* -----------------------------------
           CONTROL REFERENCE
        ----------------------------------- */

        const controls =
          target.closest(
            '[data-unified-controls]'
          );

        if (
          controls
        ) {
          event.preventDefault();

          openControls(
            host
          );
        }
      },
      true
    );

    /* -----------------------------------------
       SLIDERS
    ----------------------------------------- */

    document.addEventListener(
      'input',
      event => {
        const target =
          event.target;

        if (
          !(
            target instanceof
            HTMLInputElement
          )
        ) {
          return;
        }

        if (
          !target.matches(
            '[data-unified-range]'
          )
        ) {
          return;
        }

        const host =
          target.closest(
            '#titlePanelContent, #panelContent'
          );

        if (!host) {
          return;
        }

        const root =
          host.closest(
            '#titlePanel, #pauseMenu'
          );

        if (
          !root?.classList.contains(
            'relay-options-unified'
          )
        ) {
          return;
        }

        handleRange(
          host,
          target
        );
      },
      {
        capture: true
      }
    );

    /* -----------------------------------------
       VOICE PROFILE
    ----------------------------------------- */

    document.addEventListener(
      'change',
      event => {
        const target =
          event.target;

        if (
          !(
            target instanceof
            HTMLSelectElement
          )
        ) {
          return;
        }

        if (
          !target.matches(
            '[data-unified-voice]'
          )
        ) {
          return;
        }

        const voiceName =
          target.value;

        const scene =
          window.__relayRunnerScene;

        if (
          scene &&
          typeof scene.setVoiceByName ===
            'function'
        ) {
          try {
            scene.setVoiceByName(
              voiceName
            );
          } catch (error) {
            console.warn(
              '[Relay Options] setVoiceByName failed',
              error
            );
          }
        } else {
          try {
            localStorage.setItem(
              'runner_voice_name',
              voiceName
            );
          } catch {}
        }

        emitSettingsChange({
          key: 'voiceName',
          value: voiceName,
          runnerScene: true
        });
      },
      {
        capture: true
      }
    );

    /* -----------------------------------------
       CLOSE LANGUAGE MENU
    ----------------------------------------- */

    document.addEventListener(
      'click',
      event => {
        const target =
          event.target;

        if (
          !(
            target instanceof
            Element
          )
        ) {
          return;
        }

        if (
          target.closest(
            '.relay-select'
          )
        ) {
          return;
        }

        document
          .querySelectorAll(
            '.relay-language-menu'
          )
          .forEach(
            menu => {
              menu.classList.add(
                'hidden'
              );

              menu.parentElement
                ?.querySelector(
                  '[data-unified-language]'
                )
                ?.setAttribute(
                  'aria-expanded',
                  'false'
                );
            }
          );
      },
      false
    );

    /* -----------------------------------------
       SETTINGS CHANGES
    ----------------------------------------- */

    window.addEventListener(
      'relay-settings-change',
      event => {
        const detail =
          event.detail || {};

        const scene =
          window.__relayRunnerScene;

        try {
          if (
            scene &&
            detail.key === 'screenShake'
          ) {
            scene.screenShake =
              Boolean(detail.value);
          }

          if (
            scene &&
            detail.key === 'reducedMotion'
          ) {
            scene.motionReduced =
              Boolean(detail.value);
          }

          if (
            scene &&
            detail.key === 'rain'
          ) {
            scene.rain?.setVisible?.(
              Boolean(detail.value)
            );
          }

          if (
            detail.key === 'aiVoice' &&
            detail.value === false
          ) {
            window.speechSynthesis?.cancel?.();
          }
        } catch (error) {
          console.warn(
            '[Relay Options] settings sync failed',
            error
          );
        }

        syncPresentationClasses(
          readPresentation()
        );

        if (
          event.detail?.reset ===
          true
        ) {
          const home =
            findOpenHome();

          const pause =
            findOpenPause();

          if (home) {
            const host =
              home.querySelector(
                '#titlePanelContent'
              );

            if (host) {
              host.innerHTML =
                buildContent();

              syncRunnerGraphicsDom(
                host
              );
            }
          }

          if (pause) {
            const host =
              pause.querySelector(
                '#panelContent'
              );

            if (host) {
              host.innerHTML =
                buildContent();

              syncRunnerGraphicsDom(
                host
              );
            }
          }
        }
      }
    );

    /* -----------------------------------------
       BROWSER VOICES LOAD ASYNCHRONOUSLY
    ----------------------------------------- */

    try {
      if (
        'speechSynthesis' in window &&
        typeof window.speechSynthesis
          .addEventListener ===
          'function'
      ) {
        window.speechSynthesis.addEventListener(
          'voiceschanged',
          () => {
            window.setTimeout(
              () => {
                refreshOpenOptions();
              },
              0
            );
          }
        );
      }
    } catch (error) {
      console.warn(
        '[Relay Options] voiceschanged listener failed',
        error
      );
    }

    /* -----------------------------------------
       INITIAL MOUNT
    ----------------------------------------- */

    window.setTimeout(
      () => {
        const home =
          findOpenHome();

        const pause =
          findOpenPause();

        if (home) {
          mount(
            home,
            'home'
          );
        }

        if (pause) {
          mount(
            pause,
            'pause'
          );
        }
      },
      0
    );
  };

  /* =========================================================
     START
  ========================================================= */

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once: true
      }
    );
  } else {
    init();
  }

})();
