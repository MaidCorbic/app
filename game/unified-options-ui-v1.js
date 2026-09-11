import { loadState, saveState } from './src/state.js';

(() => {
  'use strict';

  if (window.__relayUnifiedOptionsUiV1) return;
  window.__relayUnifiedOptionsUiV1 = true;

  const LANGUAGE_KEY = 'relay-runner-language';
  const PRESENTATION_KEY = 'relay.runner.ui.preferences.v1';
  const LANGUAGES = [['en','ENGLISH'],['exyu','EX-YU'],['es','ESPAÑOL'],['de','DEUTSCH']];

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

  const PRESENTATION_KEYS = new Set(Object.keys(PRESENTATION_DEFAULTS));
  const boundRoots = new WeakSet();

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));

  const escapeHtml = value => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const getState = () => {
    try {
      return { ...STATE_DEFAULTS, ...(loadState() || {}) };
    } catch (error) {
      console.warn('[Relay Options] loadState failed', error);
      return { ...STATE_DEFAULTS };
    }
  };

  const savePatch = patch => {
    try {
      saveState({ ...getState(), ...patch });
    } catch (error) {
      console.warn('[Relay Options] saveState failed', error);
    }
  };

  const readPresentation = () => {
    try {
      const raw = localStorage.getItem(PRESENTATION_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return { ...PRESENTATION_DEFAULTS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
    } catch {
      return { ...PRESENTATION_DEFAULTS };
    }
  };

  const writePresentation = prefs => {
    try {
      localStorage.setItem(PRESENTATION_KEY, JSON.stringify({ ...PRESENTATION_DEFAULTS, ...prefs }));
    } catch {}
  };

  const getLanguage = () => {
    try {
      const value = localStorage.getItem(LANGUAGE_KEY);
      return LANGUAGES.some(([code]) => code === value) ? value : 'en';
    } catch {
      return 'en';
    }
  };

  const setLanguage = code => {
    const safeCode = LANGUAGES.some(([id]) => id === code) ? code : 'en';
    try { localStorage.setItem(LANGUAGE_KEY, safeCode); } catch {}
    document.documentElement.lang = safeCode === 'exyu' ? 'bs' : safeCode;
    document.documentElement.dataset.language = safeCode;
    window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { code: safeCode } }));
  };

  const syncPresentationClasses = prefs => {
    const safe = { ...PRESENTATION_DEFAULTS, ...(prefs || {}) };
    document.body?.classList.toggle('relay-hide-intel', safe.intelCards === false);
    document.body?.classList.toggle('relay-hide-ally', safe.allyIntel === false);
    document.body?.classList.toggle('relay-hide-events', safe.eventPopups === false);
    document.body?.classList.toggle('relay-hide-tutorials', safe.tutorialHints === false);
  };

  const emitSettingsChange = detail => {
    try { window.dispatchEvent(new CustomEvent('relay-settings-change', { detail })); } catch {}
  };

  const injectStyles = () => {
    if (document.getElementById('relay-unified-options-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-unified-options-style';
    style.textContent = `
      #titlePanel.relay-options-unified,#pauseMenu.relay-options-unified{isolation:isolate}
      #titlePanel.relay-options-unified{z-index:5000!important;pointer-events:auto!important}
      #titlePanel.relay-options-unified.hidden{pointer-events:none!important}
      #titlePanel.relay-options-unified .title-panel-card{position:relative;z-index:5001!important;pointer-events:auto!important}
      #titlePanel.relay-options-unified #titlePanelContent,#pauseMenu.relay-options-unified #panelContent{min-width:0;min-height:0;pointer-events:auto!important}
      #titlePanel.relay-options-unified .relay-options-shell,#pauseMenu.relay-options-unified .relay-options-shell{min-width:0;min-height:0;height:100%;display:grid;grid-template-rows:auto minmax(0,1fr);overflow:hidden}
      #titlePanel.relay-options-unified .relay-options-body,#pauseMenu.relay-options-unified .relay-options-body{min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y}
      #titlePanelContent.relay-legacy-cleared{display:block!important}
    `;
    document.head.appendChild(style);
  };

  const toggleMarkup = (key, label, detail, enabled) => {
    const active = Boolean(enabled);
    return `<article class="relay-option-card" data-option-key="${escapeHtml(key)}"><div class="relay-option-copy"><strong>${escapeHtml(label)}</strong><small>${escapeHtml(detail)}</small></div><button class="relay-toggle ${active ? 'is-on' : ''}" type="button" data-unified-toggle="${escapeHtml(key)}" aria-pressed="${active}" aria-label="${escapeHtml(label)}: ${active ? 'ON' : 'OFF'}">${active ? 'ON' : 'OFF'}</button></article>`;
  };

  const rangeMarkup = (key, label, value, detail) => {
    const safeValue = clamp(value);
    return `<article class="relay-option-card"><div class="relay-option-copy"><strong>${escapeHtml(label)}</strong><small>${escapeHtml(detail)}</small></div><div class="relay-range"><div class="relay-range-head"><span>LEVEL</span><span class="relay-range-value" data-range-value="${escapeHtml(key)}">${Math.round(safeValue * 100)}%</span></div><input data-unified-range="${escapeHtml(key)}" type="range" min="0" max="1" step="0.05" value="${safeValue}" aria-label="${escapeHtml(label)}"></div></article>`;
  };

  const buildContent = () => {
    const state = getState();
    const prefs = readPresentation();
    const current = LANGUAGES.find(([code]) => code === getLanguage()) || LANGUAGES[0];
    return `<div class="relay-options-shell">
      <header class="relay-options-head"><div><p class="relay-options-kicker">RELAY RUNNER // SYSTEM TERMINAL</p><h2 class="relay-options-title">OPTIONS</h2><p class="relay-options-subtitle">Configure the run without leaving the relay.</p></div><span class="relay-options-status"><i></i>SYSTEM READY</span></header>
      <div class="relay-options-body"><div class="relay-options-grid">
        <section class="relay-options-section"><div class="relay-section-title">GAMEPLAY</div>
          ${toggleMarkup('tutorialEnabled','TUTORIAL','Mission guidance and contextual lessons',state.tutorialEnabled !== false)}
          ${toggleMarkup('screenShake','SCREEN SHAKE','Impact and camera feedback',!!state.screenShake)}
          ${toggleMarkup('reducedMotion','REDUCED MOTION','Reduce presentation motion',!!state.reducedMotion)}
          ${toggleMarkup('rain','ATMOSPHERIC RAIN','City weather ambience',!!state.rain)}
        </section>
        <section class="relay-options-section"><div class="relay-section-title">AUDIO</div>
          ${toggleMarkup('muted','MASTER AUDIO','Global game sound',!state.muted)}
          ${toggleMarkup('aiVoice','AI VOICE','NIA / MARA spoken guidance',state.aiVoice !== false)}
          ${rangeMarkup('musicVolume','MUSIC',state.musicVolume,'Background music level')}
          ${rangeMarkup('sfxVolume','SFX',state.sfxVolume,'Gameplay sound effects')}
        </section>
        <section class="relay-options-section full"><div class="relay-section-title">INTERFACE</div><div class="relay-options-grid">
          ${toggleMarkup('intelCards','INTEL CARDS','Enemy discovery cards and briefings',prefs.intelCards)}
          ${toggleMarkup('allyIntel','ALLY INTEL','Side intel panels',prefs.allyIntel)}
          ${toggleMarkup('eventPopups','EVENT POPUPS','Transient gameplay notices',prefs.eventPopups)}
          ${toggleMarkup('tutorialHints','TUTORIAL HINTS','Contextual onboarding hints',prefs.tutorialHints)}
        </div></section>
        <section class="relay-options-section full"><div class="relay-section-title">SYSTEM</div>
          <div class="relay-option-card relay-select"><div class="relay-option-copy"><strong>GAME LANGUAGE</strong><small>Interface and supported system language</small></div><button class="relay-toggle" type="button" data-unified-language aria-expanded="false" aria-haspopup="listbox">🌐 ${escapeHtml(current[1])}</button><div class="relay-language-menu hidden" data-unified-language-menu role="listbox">${LANGUAGES.map(([code,name])=>`<button type="button" data-unified-language-code="${escapeHtml(code)}" class="${code===current[0]?'active':''}" role="option" aria-selected="${code===current[0]}">${escapeHtml(name)}</button>`).join('')}</div></div>
          <div class="relay-action-row"><button class="relay-action" type="button" data-unified-fullscreen>FULLSCREEN</button><button class="relay-action" type="button" data-unified-reset>RESET OPTIONS</button><button class="relay-action" type="button" data-unified-controls aria-expanded="false">CONTROL REFERENCE</button></div>
          <div class="relay-controls-strip" data-unified-controls-panel hidden><span class="relay-key"><kbd>A</kbd><span>MOVE LEFT</span></span><span class="relay-key"><kbd>D</kbd><span>MOVE RIGHT</span></span><span class="relay-key"><kbd>SPACE</kbd><span>JUMP</span></span><span class="relay-key"><kbd>E</kbd><span>ACTION</span></span><span class="relay-key"><kbd>Q</kbd><span>BLADE</span></span><span class="relay-key"><kbd>SHIFT</kbd><span>DASH</span></span><span class="relay-key"><kbd>ESC</kbd><span>PAUSE</span></span></div>
        </section>
      </div></div></div>`;
  };

  const updateToggleDom = (host, key, enabled) => {
    const button = [...host.querySelectorAll('[data-unified-toggle]')].find(item => item.dataset.unifiedToggle === key);
    if (!button) return;
    button.classList.toggle('is-on', enabled);
    button.classList.toggle('is-off', !enabled);
    button.setAttribute('aria-pressed', String(Boolean(enabled)));
    button.setAttribute('aria-label', `${key}: ${enabled ? 'ON' : 'OFF'}`);
    button.textContent = enabled ? 'ON' : 'OFF';
  };

  const mount = (root, kind) => {
    if (!root) return false;
    injectStyles();
    root.classList.add('relay-options-unified');
    root.removeAttribute('hidden');
    root.setAttribute('aria-hidden', 'false');
    const host = kind === 'home' ? root.querySelector('#titlePanelContent') : root.querySelector('#panelContent');
    if (!host) return false;

    if (!boundRoots.has(root)) {
      boundRoots.add(root);
      host.innerHTML = buildContent();
      host.classList.remove('relay-legacy-cleared');
    }
    return true;
  };

  const findOpenHome = () => {
    const panel = document.getElementById('titlePanel');
    if (!panel || panel.classList.contains('hidden')) return null;
    const heading = document.getElementById('titlePanelHeading');
    if (heading && /OPTIONS|RUN SETTINGS/i.test(heading.textContent || '')) return panel;
    return panel.classList.contains('relay-options-unified') ? panel : null;
  };

  const findOpenPause = () => {
    const pause = document.getElementById('pauseMenu');
    if (!pause || pause.classList.contains('hidden')) return null;
    const tab = pause.querySelector('[data-tab="settings"]');
    return tab?.classList.contains('active') ? pause : null;
  };

  const openHomeOptions = event => {
    const panel = document.getElementById('titlePanel');
    const heading = document.getElementById('titlePanelHeading');
    if (!panel) return false;
    event?.preventDefault?.();
    panel.classList.remove('hidden');
    panel.removeAttribute('hidden');
    panel.setAttribute('aria-hidden', 'false');
    if (heading) {
      heading.textContent = 'OPTIONS';
      heading.className = 'relay-options-title';
    }
    return mount(panel, 'home');
  };

  const openControls = host => {
    const panel = host.querySelector('[data-unified-controls-panel]');
    const button = host.querySelector('[data-unified-controls]');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    button?.setAttribute('aria-expanded', String(!panel.hidden));
  };

  const resetOptions = host => {
    saveState({ ...getState(), ...STATE_DEFAULTS });
    writePresentation(PRESENTATION_DEFAULTS);
    setLanguage('en');
    syncPresentationClasses(PRESENTATION_DEFAULTS);
    host.innerHTML = buildContent();
    emitSettingsChange({ reset: true });
  };

  const handleToggle = (host, button) => {
    const key = button.dataset.unifiedToggle;
    const state = getState();
    const prefs = readPresentation();
    const current = PRESENTATION_KEYS.has(key)
      ? prefs[key] !== false
      : key === 'muted'
        ? state.muted !== true
        : Boolean(state[key]);
    const next = !current;

    if (PRESENTATION_KEYS.has(key)) {
      prefs[key] = next;
      writePresentation(prefs);
      syncPresentationClasses(prefs);
      updateToggleDom(host, key, next);
      emitSettingsChange({ key, value: next, presentation: true });
      return;
    }

    savePatch(key === 'muted' ? { muted: !next } : { [key]: next });
    if (key === 'aiVoice' && !next) {
      try { window.speechSynthesis?.cancel?.(); } catch {}
    }
    updateToggleDom(host, key, next);
    emitSettingsChange({ key, value: next, presentation: false });
  };

  const handleRange = (host, range) => {
    const key = range.dataset.unifiedRange;
    const value = clamp(range.value);
    const label = [...host.querySelectorAll('[data-range-value]')].find(item => item.dataset.rangeValue === key);
    if (label) label.textContent = `${Math.round(value * 100)}%`;
    savePatch({ [key]: value });
    emitSettingsChange({ key, value });
  };

  const init = () => {
    injectStyles();
    syncPresentationClasses(readPresentation());

    document.addEventListener('relay-open-home-options', openHomeOptions);

    document.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const pauseSettings = target.closest('#pauseMenu [data-tab="settings"]');
      if (pauseSettings) {
        window.setTimeout(() => {
          const pause = findOpenPause();
          if (pause) mount(pause, 'pause');
        }, 0);
        return;
      }

      const homeControl = target.closest('#intro [data-title-panel="controls"]');
      if (homeControl) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openHomeOptions(event);
        return;
      }

      const host = target.closest('#titlePanelContent, #panelContent');
      if (!host) return;
      const root = host.closest('#titlePanel, #pauseMenu');
      if (!root?.classList.contains('relay-options-unified')) return;

      const toggle = target.closest('[data-unified-toggle]');
      if (toggle) {
        event.preventDefault();
        handleToggle(host, toggle);
        return;
      }

      const langButton = target.closest('[data-unified-language]');
      if (langButton) {
        event.preventDefault();
        const menu = host.querySelector('[data-unified-language-menu]');
        if (!menu) return;
        const open = !menu.classList.contains('hidden');
        menu.classList.toggle('hidden', open);
        langButton.setAttribute('aria-expanded', String(!open));
        return;
      }

      const langCode = target.closest('[data-unified-language-code]');
      if (langCode) {
        event.preventDefault();
        setLanguage(langCode.dataset.unifiedLanguageCode);
        host.innerHTML = buildContent();
        return;
      }

      const fullscreen = target.closest('[data-unified-fullscreen]');
      if (fullscreen) {
        event.preventDefault();
        (async () => {
          try {
            if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
            else await document.exitFullscreen?.();
            emitSettingsChange({ fullscreen: Boolean(document.fullscreenElement) });
          } catch {}
        })();
        return;
      }

      const reset = target.closest('[data-unified-reset]');
      if (reset) {
        event.preventDefault();
        resetOptions(host);
        return;
      }

      const controls = target.closest('[data-unified-controls]');
      if (controls) {
        event.preventDefault();
        openControls(host);
      }
    }, true);

    document.addEventListener('input', event => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.matches('[data-unified-range]')) return;
      const host = target.closest('#titlePanelContent, #panelContent');
      if (!host) return;
      const root = host.closest('#titlePanel, #pauseMenu');
      if (!root?.classList.contains('relay-options-unified')) return;
      handleRange(host, target);
    }, { capture: true });

    document.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.relay-select')) return;
      document.querySelectorAll('.relay-language-menu').forEach(menu => {
        menu.classList.add('hidden');
        menu.parentElement?.querySelector('[data-unified-language]')?.setAttribute('aria-expanded', 'false');
      });
    }, false);

    window.addEventListener('relay-settings-change', event => {
      syncPresentationClasses(readPresentation());
      if (event.detail?.reset === true) {
        const home = findOpenHome();
        const pause = findOpenPause();
        if (home) mount(home, 'home');
        if (pause) mount(pause, 'pause');
      }
    });

    window.setTimeout(() => {
      const home = findOpenHome();
      const pause = findOpenPause();
      if (home) mount(home, 'home');
      if (pause) mount(pause, 'pause');
    }, 0);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
