import './options-scrollbar-final-v1.css';
import { loadState, saveState } from './src/state.js';

(() => {
  'use strict';
  if (window.__relayOptionsUiPolishV2) return;
  window.__relayOptionsUiPolishV2 = true;

  const PRESENTATION_KEY = 'relay.runner.ui.preferences.v1';
  const DEFAULT_PRESENTATION = Object.freeze({ intelCards: true, allyIntel: true, eventPopups: true, tutorialHints: true });
  const getState = () => loadState();
  const savePatch = patch => saveState({ ...getState(), ...patch });
  const readPresentation = () => { try { return { ...DEFAULT_PRESENTATION, ...JSON.parse(localStorage.getItem(PRESENTATION_KEY) || '{}') }; } catch { return { ...DEFAULT_PRESENTATION }; } };
  const writePresentation = prefs => { try { localStorage.setItem(PRESENTATION_KEY, JSON.stringify(prefs)); } catch {} };
  const syncPresentation = prefs => {
    document.body.classList.toggle('relay-hide-intel', !prefs.intelCards);
    document.body.classList.toggle('relay-hide-ally', !prefs.allyIntel);
    document.body.classList.toggle('relay-hide-events', !prefs.eventPopups);
    document.body.classList.toggle('relay-hide-tutorials', !prefs.tutorialHints);
  };

  const showToast = text => {
    let toast = document.getElementById('relayOptionToast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'relayOptionToast'; toast.className = 'relay-option-toast'; document.body.appendChild(toast); }
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 900);
  };

  const inject = () => {
    if (document.getElementById('relay-options-polish-v4-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-options-polish-v4-style';
    style.textContent = `
      /* One scroll owner per surface. The content host is clipped; the body scrolls. */
      #titlePanel #titlePanelContent,
      #pauseMenu #panelContent{overflow:hidden!important;min-height:0!important;height:100%!important;scrollbar-width:none!important;touch-action:auto!important}
      #titlePanel #titlePanelContent::-webkit-scrollbar,
      #pauseMenu #panelContent::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
      #titlePanel .home-options-final,
      #titlePanel .relay-options-shell,
      #titlePanel .relay-options-grid,
      #titlePanel .relay-options-section,
      #pauseMenu .pause-options-v1,
      #pauseMenu .relay-options-shell,
      #pauseMenu .relay-options-grid,
      #pauseMenu .relay-options-section{overflow:visible!important;min-height:0!important}
      #titlePanel .relay-options-body,#pauseMenu .relay-options-body{overflow-y:auto!important;overflow-x:hidden!important;height:100%!important;min-height:0!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:auto!important;scrollbar-color:rgba(141,244,255,.78) rgba(255,255,255,.06)!important;touch-action:pan-y!important}
      #titlePanel .relay-options-body::-webkit-scrollbar,#pauseMenu .relay-options-body::-webkit-scrollbar{display:block!important;width:11px!important}
      #titlePanel .relay-options-body::-webkit-scrollbar-track,#pauseMenu .relay-options-body::-webkit-scrollbar-track{background:rgba(255,255,255,.055)!important;border-radius:999px!important}
      #titlePanel .relay-options-body::-webkit-scrollbar-thumb,#pauseMenu .relay-options-body::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(141,244,255,.9),rgba(255,208,110,.9))!important;border:2px solid rgba(4,12,23,.82)!important;border-radius:999px!important;min-height:45px!important}
      #titlePanel:has(.home-options-final) .home-opt-copy b,#pauseMenu .pause-options-v1 .copy b{font-size:13px!important;line-height:1.2!important;letter-spacing:.07em!important}
      #titlePanel:has(.home-options-final) .home-opt-copy small,#pauseMenu .pause-options-v1 .copy small{font-size:9.5px!important;line-height:1.45!important;color:#8194a7!important}
      #titlePanel:has(.home-options-final) .home-section,#pauseMenu .pause-options-v1 .section{font-size:10px!important;line-height:1.2!important}
      #titlePanel:has(.home-options-final) .home-opt button,#pauseMenu .pause-options-v1 .toggle{font-size:10px!important;min-width:104px!important;height:40px!important}
      #titlePanel:has(.home-options-final) .home-options-actions button,#pauseMenu .pause-options-v1 .actions button{font-size:10px!important;min-height:44px!important}
      .relay-option-toast{position:fixed;left:50%;bottom:26px;z-index:10000;opacity:0;pointer-events:none;transform:translate(-50%,10px);padding:10px 14px;border:1px solid rgba(141,244,255,.22);border-radius:999px;background:rgba(3,10,20,.94);color:#effcff;font:900 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;box-shadow:0 12px 30px rgba(0,0,0,.45);transition:opacity .16s ease,transform .16s ease}
      .relay-option-toast.show{opacity:1;transform:translate(-50%,0)}
      @media(max-width:700px){
        #titlePanel .relay-options-body,#pauseMenu .relay-options-body{scrollbar-width:auto!important}
        #titlePanel .relay-options-body::-webkit-scrollbar,#pauseMenu .relay-options-body::-webkit-scrollbar{width:8px!important}
        #titlePanel:has(.home-options-final) .home-opt-copy b,#pauseMenu .pause-options-v1 .copy b{font-size:11px!important}
        #titlePanel:has(.home-options-final) .home-opt-copy small,#pauseMenu .pause-options-v1 .copy small{font-size:8.5px!important}
        #titlePanel:has(.home-options-final) .home-opt button,#pauseMenu .pause-options-v1 .toggle{font-size:9px!important;min-width:92px!important;height:38px!important}
      }
      @media(max-width:390px){#titlePanel .relay-options-body::-webkit-scrollbar,#pauseMenu .relay-options-body::-webkit-scrollbar{width:7px!important}.relay-option-toast{bottom:88px;font-size:8px}}
    `;
    document.head.appendChild(style);
  };

  const applyImmediateGameplayEffects = (key, value) => {
    if (key === 'reducedMotion') document.documentElement.classList.toggle('relay-reduced-motion', !!value);
    if (key === 'screenShake') document.documentElement.classList.toggle('relay-screen-shake-off', !value);
    if (key === 'rain') document.documentElement.classList.toggle('relay-rain-off', !value);
    if (key === 'muted') document.documentElement.classList.toggle('relay-audio-muted', !!value);
    window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value } }));
    showToast(`${key.replace(/([A-Z])/g, ' $1').toUpperCase()} · ${value ? 'ON' : 'OFF'}`);
  };

  const bindControls = () => {
    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-unified-toggle],[data-home-toggle],[data-pause-option],[data-setting]');
      if (!button) return;
      const key = button.dataset.unifiedToggle || button.dataset.homeToggle || button.dataset.pauseOption || button.dataset.setting;
      if (!key) return;
      const prefs = readPresentation();
      if (key in prefs) {
        prefs[key] = !prefs[key];
        writePresentation(prefs);
        syncPresentation(prefs);
        window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value: prefs[key] } }));
        showToast(`${key.replace(/([A-Z])/g, ' $1').toUpperCase()} · ${prefs[key] ? 'ON' : 'OFF'}`);
        return;
      }
      setTimeout(() => {
        const state = getState();
        const value = key === 'muted' ? !state.muted : state[key];
        applyImmediateGameplayEffects(key, value);
      }, 0);
    }, true);

    document.addEventListener('input', event => {
      const input = event.target.closest?.('[data-unified-range],[data-home-volume],[data-volume]');
      if (!input) return;
      const key = input.dataset.unifiedRange || input.dataset.homeVolume || input.dataset.volume;
      const value = Number(input.value);
      if (!key || !Number.isFinite(value)) return;
      savePatch({ [key]: value });
      window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value } }));
    }, true);
  };

  const applyScrollContract = () => {
    for (const body of document.querySelectorAll('#titlePanel .relay-options-body,#pauseMenu .relay-options-body')) {
      body.style.overflowY = 'auto';
      body.style.overflowX = 'hidden';
      body.style.touchAction = 'pan-y';
    }
    for (const host of document.querySelectorAll('#titlePanel #titlePanelContent,#pauseMenu #panelContent')) host.style.overflow = 'hidden';
  };

  const ensureReady = () => { inject(); bindControls(); syncPresentation(readPresentation()); applyScrollContract(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureReady, { once: true });
  else ensureReady();
})();
