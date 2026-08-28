(() => {
  'use strict';

  const STORAGE_KEY = 'relay-runner-state';
  const defaults = {
    muted: false,
    musicVolume: 0.55,
    sfxVolume: 0.7,
    screenShake: true,
    reducedMotion: false,
    rain: true,
    aiVoice: true,
    tutorialEnabled: true,
  };

  const clamp01 = value => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : null;
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;

    const next = { ...saved };
    let changed = false;

    for (const [key, fallback] of Object.entries(defaults)) {
      if (typeof next[key] === 'undefined') {
        next[key] = fallback;
        changed = true;
      }
    }

    for (const key of ['musicVolume', 'sfxVolume']) {
      const value = clamp01(next[key]);
      if (value === null) {
        next[key] = defaults[key];
        changed = true;
      } else if (value !== next[key]) {
        next[key] = value;
        changed = true;
      }
    }

    for (const key of ['muted', 'screenShake', 'reducedMotion', 'rain', 'aiVoice', 'tutorialEnabled']) {
      if (typeof next[key] !== 'boolean') {
        next[key] = defaults[key];
        changed = true;
      }
    }

    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('[Relay Runner] Options normalization skipped:', error);
  }
})();
