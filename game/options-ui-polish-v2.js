import { loadState, saveState } from './src/state.js';

(() => {
  'use strict';
  if (window.__relayOptionsUiPolishV2) return;
  window.__relayOptionsUiPolishV2 = true;

  const LANGUAGE_KEY = 'relay-runner-language';
  const PRESENTATION_KEY = 'relay.runner.ui.preferences.v1';
  const DEFAULT_PRESENTATION = Object.freeze({ intelCards: true, allyIntel: true, eventPopups: true, tutorialHints: true });
  const getState = () => loadState();
  const savePatch = patch => saveState({ ...getState(), ...patch });

  const readPresentation = () => {
    try { return { ...DEFAULT_PRESENTATION, ...JSON.parse(localStorage.getItem(PRESENTATION_KEY) || '{}') }; }
    catch { return { ...DEFAULT_PRESENTATION }; }
  };
  const writePresentation = prefs => { try { localStorage.setItem(PRESENTATION_KEY, JSON.stringify(prefs)); } catch {} };
  const syncPresentation = prefs => {
    document.body.classList.toggle('relay-hide-intel', !prefs.intelCards);
    document.body.classList.toggle('relay-hide-ally', !prefs.allyIntel);
    document.body.classList.toggle('relay-hide-events', !prefs.eventPopups);
    document.body.classList.toggle('relay-hide-tutorials', !prefs.tutorialHints);
  };

  const inject = () => {
    if (document.getElementById('relay-options-polish-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-options-polish-v2-style';
    style.textContent = `
      #titlePanel:has(.home-options-final),#pauseMenu{--rp-cyan:#8df4ff;--rp-green:#aee37f;--rp-amber:#ffd06e;--rp-ink:#edfaff;--rp-muted:#8498aa}
      #titlePanel:has(.home-options-final) .home-options-final,#pauseMenu .pause-options-v1{font-size:1em}
      #titlePanel:has(.home-options-final) .home-section,#pauseMenu .pause-options-v1 .section{font-size:10px!important;letter-spacing:.16em!important}
      #titlePanel:has(.home-options-final) .home-opt-copy b,#pauseMenu .pause-options-v1 .copy b{font-size:12px!important;line-height:1.2!important;letter-spacing:.075em!important}
      #titlePanel:has(.home-options-final) .home-opt-copy small,#pauseMenu .pause-options-v1 .copy small{font-size:9px!important;line-height:1.45!important;color:#8194a7!important}
      #titlePanel:has(.home-options-final) .home-opt,#pauseMenu .pause-options-v1 .row{min-height:50px!important;padding:12px 14px!important;border-radius:12px!important;border-color:rgba(141,244,255,.11)!important}
      #titlePanel:has(.home-options-final) .home-opt button,#pauseMenu .pause-options-v1 .toggle{min-width:104px!important;height:38px!important;border-radius:10px!important;font-size:10px!important;font-weight:900!important;letter-spacing:.12em!important}
      #titlePanel:has(.home-options-final) .home-opt button.is-on,#pauseMenu .pause-options-v1 .toggle.is-on{background:rgba(174,227,127,.08)!important;box-shadow:0 0 18px rgba(174,227,127,.10),inset 0 0 18px rgba(174,227,127,.03)!important}
      #titlePanel:has(.home-options-final) .home-options-actions button,#pauseMenu .pause-options-v1 .actions button{min-height:44px!important;font-size:10px!important;border-radius:11px!important;font-weight:900!important;letter-spacing:.1em!important}
      #titlePanel:has(.home-options-final) .home-opt input[type=range],#pauseMenu .pause-options-v1 input[type=range]{height:10px!important;accent-color:#ffd06e}
      #titlePanel:has(.home-options-final) .home-controls small{font-size:9px!important;line-height:1.7!important}
      #titlePanel:has(.home-options-final) #titlePanelContent{scrollbar-width:thin!important;scrollbar-color:rgba(141,244,255,.45) rgba(255,255,255,.04)!important;overscroll-behavior:contain!important;touch-action:pan-y!important}
      #titlePanel:has(.home-options-final) #titlePanelContent::-webkit-scrollbar{display:block!important;width:8px!important}
      #titlePanel:has(.home-options-final) #titlePanelContent::-webkit-scrollbar-track{background:rgba(255,255,255,.04);border-radius:999px}
      #titlePanel:has(.home-options-final) #titlePanelContent::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(141,244,255,.55),rgba(255,208,110,.55));border-radius:999px}
      #pauseMenu .pause-options-v1{scrollbar-width:thin!important;scrollbar-color:rgba(141,244,255,.45) rgba(255,255,255,.04)!important}
      #pauseMenu .pause-options-v1::-webkit-scrollbar{display:block!important;width:8px!important}
      #pauseMenu .pause-options-v1::-webkit-scrollbar-track{background:rgba(255,255,255,.04);border-radius:999px}
      #pauseMenu .pause-options-v1::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(141,244,255,.55),rgba(255,208,110,.55));border-radius:999px}
      .relay-option-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,10px);z-index:5000;pointer-events:none;opacity:0;padding:9px 12px;border:1px solid rgba(141,244,255,.2);border-radius:999px;background:rgba(3,10,20,.92);box-shadow:0 12px 30px rgba(0,0,0,.45),0 0 22px rgba(141,244,255,.08);color:#e9fbff;font:900 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;transition:opacity .16s ease,transform .16s ease}
      .relay-option-toast.show{opacity:1;transform:translate(-50%,0)}
      @media(max-width:700px){
        #titlePanel:has(.home-options-final){padding:5px!important}
        #titlePanel:has(.home-options-final) .title-panel-card{width:96vw!important;max-height:calc(100dvh - 10px)!important;border-radius:16px!important}
        #titlePanel:has(.home-options-final) #titlePanelContent{max-height:calc(100dvh - 108px)!important;overflow-y:auto!important}
        #titlePanel:has(.home-options-final) .home-section,#pauseMenu .pause-options-v1 .section{font-size:9px!important}
        #titlePanel:has(.home-options-final) .home-opt-copy b,#pauseMenu .pause-options-v1 .copy b{font-size:10px!important}
        #titlePanel:has(.home-options-final) .home-opt-copy small,#pauseMenu .pause-options-v1 .copy small{font-size:8px!important}
        #titlePanel:has(.home-options-final) .home-opt,#pauseMenu .pause-options-v1 .row{min-height:48px!important;padding:10px!important}
        #titlePanel:has(.home-options-final) .home-opt button,#pauseMenu .pause-options-v1 .toggle{min-width:92px!important;width:92px!important;height:36px!important;font-size:9px!important}
      }
      @media(max-width:390px){#titlePanel:has(.home-options-final) #titlePanelContent{max-height:calc(100dvh - 96px)!important}.relay-option-toast{bottom:88px;font-size:8px}}
    `;
    document.head.appendChild(style);
  };

  const showToast = text => {
    let toast = document.getElementById('relayOptionToast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'relayOptionToast'; toast.className = 'relay-option-toast'; document.body.appendChild(toast); }
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 900);
  };

  const applyImmediateGameplayEffects = (key, value) => {
    if (key === 'reducedMotion') document.documentElement.classList.toggle('relay-reduced-motion', !!value);
    if (key === 'screenShake') document.documentElement.classList.toggle('relay-screen-shake-off', !value);
    if (key === 'rain') document.documentElement.classList.toggle('relay-rain-off', !value);
    if (key === 'muted') document.documentElement.classList.toggle('relay-audio-muted', !!value);
    window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value } }));
    showToast(`${key.replace(/([A-Z])/g, ' $1').toUpperCase()} · ${value ? 'ON' : 'OFF'}`);
  };

  const bindPresentationControls = () => {
    const prefs = readPresentation();
    syncPresentation(prefs);
    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-p2-toggle]');
      if (!button) return;
      const key = button.dataset.p2Toggle;
      if (!(key in prefs)) return;
      prefs[key] = !prefs[key];
      writePresentation(prefs);
      syncPresentation(prefs);
      button.classList.toggle('on', prefs[key]);
      button.setAttribute('aria-pressed', String(prefs[key]));
      button.textContent = prefs[key] ? 'ON' : 'OFF';
      window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value: prefs[key] } }));
      showToast(`${key.replace(/([A-Z])/g, ' $1').toUpperCase()} · ${prefs[key] ? 'ON' : 'OFF'}`);
    }, true);
  };

  const bindExistingStateControls = () => {
    document.addEventListener('click', event => {
      const button = event.target.closest?.('[data-home-toggle],[data-pause-option],[data-setting]');
      if (!button) return;
      const key = button.dataset.homeToggle || button.dataset.pauseOption || button.dataset.setting;
      if (!key || key === 'intelCards' || key === 'allyIntel' || key === 'eventPopups' || key === 'tutorialHints') return;
      setTimeout(() => {
        const value = key === 'muted' ? !getState().muted : getState()[key];
        applyImmediateGameplayEffects(key, value);
      }, 0);
    }, true);

    document.addEventListener('input', event => {
      const input = event.target.closest?.('[data-home-volume],[data-volume]');
      if (!input) return;
      const key = input.dataset.homeVolume || input.dataset.volume;
      const value = Number(input.value);
      savePatch({ [key]: value });
      window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value } }));
    }, true);
  };

  const ensureReady = () => {
    inject();
    bindPresentationControls();
    bindExistingStateControls();
    syncPresentation(readPresentation());
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureReady, { once: true });
  else ensureReady();
})();
