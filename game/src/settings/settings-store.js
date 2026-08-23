import { loadState, saveState } from '../state.js';

export const DEFAULT_SETTINGS = Object.freeze({
  muted: false,
  musicVolume: 0.55,
  sfxVolume: 0.7,
  screenShake: true,
  reducedMotion: false,
  rain: true,
  aiVoice: true,
  tutorialEnabled: true,
});

let current = { ...DEFAULT_SETTINGS };
let initialized = false;

export function normalizeSettings(value = {}) {
  return {
    muted: Boolean(value.muted),
    musicVolume: Math.max(0, Math.min(1, Number(value.musicVolume ?? DEFAULT_SETTINGS.musicVolume))),
    sfxVolume: Math.max(0, Math.min(1, Number(value.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume))),
    screenShake: value.screenShake !== false,
    reducedMotion: Boolean(value.reducedMotion),
    rain: value.rain !== false,
    aiVoice: value.aiVoice !== false,
    tutorialEnabled: value.tutorialEnabled !== false,
  };
}

export function initSettings(state = loadState()) {
  current = normalizeSettings({ ...DEFAULT_SETTINGS, ...state });
  initialized = true;
  return getSettings();
}

export function getSettings() {
  if (!initialized) initSettings();
  return { ...current };
}

export function updateSettings(patch = {}) {
  const next = normalizeSettings({ ...getSettings(), ...patch });
  current = next;

  const state = loadState();
  saveState({ ...state, ...next });

  window.dispatchEvent(new CustomEvent('relay-settings-change', {
    detail: { ...next },
  }));

  return getSettings();
}

export function subscribeSettings(listener) {
  if (typeof listener !== 'function') return () => {};
  const handler = event => listener(getSettings(), event.detail || {});
  window.addEventListener('relay-settings-change', handler);
  return () => window.removeEventListener('relay-settings-change', handler);
}

if (typeof window !== 'undefined') {
  initSettings();
}
