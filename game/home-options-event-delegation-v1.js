import { loadState, saveState } from './src/state.js';

(() => {
  if (window.__relayHomeOptionsDelegationV1) return;
  window.__relayHomeOptionsDelegationV1 = true;

  const LANGUAGE_KEY = 'relay-runner-language';
  const getState = () => loadState();
  const savePatch = patch => saveState({ ...getState(), ...patch });

  const setLanguage = code => {
    localStorage.setItem(LANGUAGE_KEY, code);
    document.documentElement.lang = code === 'exyu' ? 'bs' : code;
    document.documentElement.dataset.language = code;
    window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { code } }));
  };

  const syncToggle = (button, key, value) => {
    if (!button) return;
    button.classList.toggle('is-on', !!value);
    button.setAttribute('aria-pressed', String(!!value));
    button.textContent = value ? 'ON' : 'OFF';
  };

  const syncVolumes = state => {
    document.querySelectorAll('[data-home-volume]').forEach(input => {
      const key = input.dataset.homeVolume;
      if (!Object.prototype.hasOwnProperty.call(state, key)) return;
      input.value = String(state[key]);
      const label = document.querySelector(`[data-volume-label="${key}"]`);
      if (label) label.textContent = `${Math.round(Number(state[key]) * 100)}%`;
    });
  };

  const syncLanguage = code => {
    const names = { en: 'ENGLISH', exyu: 'EX-YU', es: 'ESPAÑOL', de: 'DEUTSCH' };
    const button = document.querySelector('[data-home-language]');
    if (button) button.textContent = `🌐 ${names[code] || names.en}`;
    document.querySelectorAll('[data-language]').forEach(item => {
      item.classList.toggle('active', item.dataset.language === code);
    });
  };

  window.addEventListener('click', event => {
    const target = event.target?.closest?.('[data-home-toggle],[data-home-volume],[data-home-language],[data-language],[data-home-fullscreen],[data-home-reset]');
    if (!target) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (target.matches('[data-home-toggle]')) {
      const key = target.dataset.homeToggle;
      const current = getState();
      const value = key === 'muted' ? !current.muted : !current[key];
      savePatch({ [key]: value });
      syncToggle(target, key, value);
      if (key === 'aiVoice' && !value) window.speechSynthesis?.cancel?.();
      window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value } }));
      return;
    }

    if (target.matches('[data-home-language]')) {
      document.querySelector('[data-home-language-menu]')?.classList.toggle('hidden');
      return;
    }

    if (target.matches('[data-language]')) {
      const code = target.dataset.language;
      setLanguage(code);
      syncLanguage(code);
      document.querySelector('[data-home-language-menu]')?.classList.add('hidden');
      return;
    }

    if (target.matches('[data-home-fullscreen]')) {
      (async () => {
        try {
          if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
          else await document.exitFullscreen?.();
        } catch {}
      })();
      return;
    }

    if (target.matches('[data-home-reset]')) {
      savePatch({ muted: false, musicVolume: .55, sfxVolume: .7, screenShake: true, reducedMotion: false, rain: true, aiVoice: true, tutorialEnabled: true });
      localStorage.removeItem(LANGUAGE_KEY);
      setLanguage('en');
      document.querySelectorAll('[data-home-toggle]').forEach(button => {
        const key = button.dataset.homeToggle;
        const value = key === 'muted' ? false : ({ screenShake: true, reducedMotion: false, rain: true, aiVoice: true, tutorialEnabled: true }[key] ?? false);
        syncToggle(button, key, value);
      });
      syncVolumes(getState());
      syncLanguage('en');
      document.querySelector('[data-home-language-menu]')?.classList.add('hidden');
      window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { reset: true } }));
    }
  }, true);

  window.addEventListener('input', event => {
    const input = event.target?.closest?.('[data-home-volume]');
    if (!input) return;
    event.stopImmediatePropagation();
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    const key = input.dataset.homeVolume;
    savePatch({ [key]: value });
    const label = document.querySelector(`[data-volume-label="${key}"]`);
    if (label) label.textContent = `${Math.round(value * 100)}%`;
  }, true);
})();
