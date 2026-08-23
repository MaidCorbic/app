import { loadState, saveState } from './src/state.js';

/*
 * Pause/settings controller.
 * Owns behaviour only; visual styling lives in pause-ui-v1.css.
 */
(() => {
  if (window.__relayPauseFinalPolishV1) return;
  window.__relayPauseFinalPolishV1 = true;

  const LANGUAGES = [
    ['en', 'ENGLISH'],
    ['exyu', 'EX-YU'],
    ['es', 'ESPAÑOL'],
    ['de', 'DEUTSCH'],
  ];
  const LANGUAGE_KEY = 'relay-runner-language';

  const getState = () => loadState();
  const save = patch => saveState({ ...getState(), ...patch });
  const getLanguage = () => localStorage.getItem(LANGUAGE_KEY) || 'en';

  const setLanguage = code => {
    localStorage.setItem(LANGUAGE_KEY, code);
    document.documentElement.lang = code === 'exyu' ? 'bs' : code;
    document.documentElement.dataset.language = code;
    window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { code } }));
  };

  const optionButton = (label, key, enabled, detail) => `
    <div class="setting">
      <span class="copy"><b>${label}</b><small>${detail}</small></span>
      <button class="setting-toggle ${enabled ? 'is-on' : ''}" type="button"
        data-pause-option="${key}" aria-pressed="${enabled}">
        ${enabled ? 'ON' : 'OFF'}
      </button>
    </div>`;

  function renderOptions() {
    const pause = document.getElementById('pauseMenu');
    const panel = document.getElementById('panelContent');
    if (!pause || !panel || pause.classList.contains('hidden')) return;

    pause.classList.add('pause-options-open');
    panel.classList.remove('pause-progress-compact');

    const state = getState();
    const selectedLanguage = LANGUAGES.find(([code]) => code === getLanguage()) || LANGUAGES[0];

    panel.innerHTML = `
      <div class="settings">
        <div class="section">GAMEPLAY / GUIDANCE</div>
        ${optionButton('TUTORIAL', 'tutorialEnabled', state.tutorialEnabled !== false, 'Mission guidance and contextual lessons')}
        ${optionButton('GAME AUDIO', 'muted', !state.muted, 'Master game audio')}
        ${optionButton('SCREEN SHAKE', 'screenShake', !!state.screenShake, 'Camera impact feedback')}
        ${optionButton('REDUCED MOTION', 'reducedMotion', !!state.reducedMotion, 'Reduce movement effects')}
        ${optionButton('ATMOSPHERIC RAIN', 'rain', !!state.rain, 'City weather ambience')}

        <div class="section">VOICE &amp; AUDIO</div>
        ${optionButton('AI VOICE', 'aiVoice', state.aiVoice !== false, 'NIA / MARA spoken game guidance')}
        <label class="setting volume-setting">
          <span class="copy"><b>MUSIC</b><small><span data-pause-volume="musicVolume">${Math.round((state.musicVolume ?? .55) * 100)}%</span> VOLUME</small></span>
          <input data-pause-range="musicVolume" type="range" min="0" max="1" step=".05" value="${state.musicVolume ?? .55}">
        </label>
        <label class="setting volume-setting">
          <span class="copy"><b>SFX</b><small><span data-pause-volume="sfxVolume">${Math.round((state.sfxVolume ?? .7) * 100)}%</span> VOLUME</small></span>
          <input data-pause-range="sfxVolume" type="range" min="0" max="1" step=".05" value="${state.sfxVolume ?? .7}">
        </label>

        <div class="section">LANGUAGE</div>
        <div class="setting language">
          <span class="copy"><b>GAME LANGUAGE</b><small>Choose your interface language</small></span>
          <button class="setting-toggle" type="button" data-pause-language>🌐 ${selectedLanguage[1]}</button>
          <div class="language-menu hidden" data-pause-language-menu>
            ${LANGUAGES.map(([code, name]) => `
              <button type="button" data-pause-language-code="${code}" class="${code === selectedLanguage[0] ? 'active' : ''}">${name}</button>
            `).join('')}
          </div>
        </div>

        <div class="section">DISPLAY</div>
        <div class="actions">
          <button type="button" data-pause-fullscreen>FULLSCREEN</button>
          <button type="button" data-pause-reset>RESET OPTIONS</button>
        </div>
      </div>`;
  }

  function closePause() {
    document.querySelector('#pauseMenu [data-close]')?.click();
  }

  function toggleOption(button) {
    const key = button.dataset.pauseOption;
    if (!key) return;

    const current = getState();
    const value = key === 'muted' ? !current.muted : !current[key];
    save({ [key]: value });

    if (key === 'aiVoice' && !value) window.speechSynthesis?.cancel?.();

    window.dispatchEvent(new CustomEvent('relay-settings-change', {
      detail: { key, value },
    }));

    renderOptions();
  }

  function updateRange(input) {
    const key = input.dataset.pauseRange;
    if (!key) return;

    const value = Number(input.value);
    if (!Number.isFinite(value)) return;

    save({ [key]: value });
    const label = document.querySelector(`[data-pause-volume="${key}"]`);
    if (label) label.textContent = `${Math.round(value * 100)}%`;

    window.dispatchEvent(new CustomEvent('relay-settings-change', {
      detail: { key, value },
    }));
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch {
      // Fullscreen can be denied by the browser; keep the game usable.
    }
  }

  function resetOptions() {
    save({
      muted: false,
      musicVolume: .55,
      sfxVolume: .7,
      screenShake: true,
      reducedMotion: false,
      rain: true,
      aiVoice: true,
      tutorialEnabled: true,
    });
    setLanguage('en');
    window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { reset: true } }));
    renderOptions();
  }

  function handleClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const settingsTab = target.closest('#pauseMenu [data-tab="settings"]');
    if (settingsTab) {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelectorAll('#pauseMenu .tab').forEach(tab => tab.classList.remove('active'));
      settingsTab.classList.add('active');
      renderOptions();
      return;
    }

    const option = target.closest('#pauseMenu [data-pause-option]');
    if (option) {
      event.preventDefault();
      toggleOption(option);
      return;
    }

    const languageButton = target.closest('#pauseMenu [data-pause-language]');
    if (languageButton) {
      event.preventDefault();
      event.stopPropagation();
      document.querySelector('#pauseMenu [data-pause-language-menu]')?.classList.toggle('hidden');
      return;
    }

    const languageOption = target.closest('#pauseMenu [data-pause-language-code]');
    if (languageOption) {
      event.preventDefault();
      setLanguage(languageOption.dataset.pauseLanguageCode);
      renderOptions();
      return;
    }

    if (target.closest('#pauseMenu [data-pause-fullscreen]')) {
      event.preventDefault();
      void toggleFullscreen();
      return;
    }

    if (target.closest('#pauseMenu [data-pause-reset]')) {
      event.preventDefault();
      resetOptions();
      return;
    }

    if (!target.closest('#pauseMenu .language')) {
      document.querySelectorAll('#pauseMenu [data-pause-language-menu]').forEach(menu => menu.classList.add('hidden'));
    }

    const tab = target.closest('#pauseMenu [data-tab]');
    if (tab) {
      const panel = document.getElementById('panelContent');
      panel?.classList.toggle('pause-progress-compact', tab.dataset.tab === 'progress');
    }
  }

  function handleInput(event) {
    const target = event.target instanceof HTMLInputElement ? event.target : null;
    if (!target?.matches('[data-pause-range]')) return;
    updateRange(target);
  }

  function handleKeydown(event) {
    if (event.key !== 'Escape') return;

    const pause = document.getElementById('pauseMenu');
    if (!pause || pause.classList.contains('hidden')) return;

    const languageMenu = pause.querySelector('[data-pause-language-menu]:not(.hidden)');
    if (languageMenu) {
      languageMenu.classList.add('hidden');
      event.preventDefault();
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    closePause();
  }

  function init() {
    document.addEventListener('click', handleClick, true);
    document.addEventListener('input', handleInput);
    document.addEventListener('keydown', handleKeydown, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
