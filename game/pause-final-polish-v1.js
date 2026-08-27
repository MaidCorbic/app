import { loadState, saveState } from './src/state.js';

(() => {
  if (window.__relayPauseFinalPolishV1) return;
  window.__relayPauseFinalPolishV1 = true;

  const LANGUAGES = [['en','ENGLISH'],['exyu','EX-YU'],['es','ESPAÑOL'],['de','DEUTSCH']];
  const LANGUAGE_KEY = 'relay-runner-language';
  const state = () => loadState();
  const save = patch => saveState({ ...state(), ...patch });
  const language = () => localStorage.getItem(LANGUAGE_KEY) || 'en';
  const setLanguage = code => {
    localStorage.setItem(LANGUAGE_KEY, code);
    document.documentElement.lang = code === 'exyu' ? 'bs' : code;
    document.documentElement.dataset.language = code;
    window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { code } }));
  };

  const runtimeRefresh = () => {
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { refresh: true, state: state() } }));
    }, 0);
  };

  const style = document.createElement('style');
  style.textContent = `
    #pauseMenu .menu>header .close{display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;gap:5px!important;white-space:nowrap!important;line-height:1!important}
    #pauseMenu .menu>header .close span,#pauseMenu .menu>header .close b{display:inline-flex;align-items:center;justify-content:center;line-height:1}
    #pauseMenu.pause-options-open #panelContent{overflow-y:auto!important}
    .pause-options-v1{display:grid;gap:8px;width:100%;max-width:760px;margin:0 auto;box-sizing:border-box;text-align:left}
    .pause-options-v1 .section{margin:4px 2px 0;color:#5f7287;font:800 8px/1 'DM Mono',monospace;letter-spacing:1.2px}
    .pause-options-v1 .row{display:grid;grid-template-columns:minmax(0,1fr) 92px;align-items:center;gap:12px;width:100%;min-width:0;padding:10px 12px;border:1px solid rgba(210,226,240,.10);border-radius:8px;background:linear-gradient(145deg,rgba(12,25,43,.86),rgba(5,12,23,.94));box-sizing:border-box}
    .pause-options-v1 .copy{min-width:0;overflow:hidden}.pause-options-v1 .copy b{display:block;color:#e9f2f8;font:800 9px/1.15 'DM Mono',monospace;letter-spacing:.7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pause-options-v1 .copy small{display:block;margin-top:3px;color:#68798c;font:700 7px/1.35 'DM Mono',monospace;overflow-wrap:anywhere}
    .pause-options-v1 .toggle{width:92px;min-width:92px;height:34px;border:1px solid rgba(210,226,240,.18);border-radius:7px;background:#07111ff2;color:#e9f2f8;font:800 8px 'DM Mono',monospace;letter-spacing:.6px;cursor:pointer;touch-action:manipulation}.pause-options-v1 .toggle.is-on{border-color:rgba(104,231,190,.55);color:#68e7be}.pause-options-v1 .toggle:hover,.pause-options-v1 .toggle:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none}
    .pause-options-v1 input[type=range]{width:100%;accent-color:#ffd06e;cursor:pointer;touch-action:pan-x}
    .pause-options-v1 .actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pause-options-v1 .actions button{height:36px;min-width:0;border:1px solid rgba(210,226,240,.15);border-radius:7px;background:#07111ff2;color:#aebdcc;font:800 8px 'DM Mono',monospace;letter-spacing:.6px;cursor:pointer}.pause-options-v1 .actions button:hover{color:#ffd06e;border-color:#ffd06e}
    .pause-options-v1 .language{position:relative}.pause-options-v1 .language-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:20;width:170px;padding:5px;border:1px solid rgba(210,226,240,.18);border-radius:8px;background:#07111ff8;box-shadow:0 14px 40px #000b}.pause-options-v1 .language-menu.hidden{display:none}.pause-options-v1 .language-menu button{display:block;width:100%;height:34px;border:0;background:transparent;color:#c9d5e0;text-align:left;font:800 8px 'DM Mono',monospace;cursor:pointer}.pause-options-v1 .language-menu button.active,.pause-options-v1 .language-menu button:hover{background:rgba(255,208,110,.08);color:#ffd06e}
    @media(max-width:760px){.pause-options-v1{gap:6px}.pause-options-v1 .row{grid-template-columns:minmax(0,1fr) 88px;gap:8px;padding:9px 10px}.pause-options-v1 .toggle{width:88px;min-width:88px;height:32px}.pause-options-v1 .copy b{font-size:8px}.pause-options-v1 .copy small{font-size:6.5px}.pause-options-v1 .actions{gap:6px}.pause-options-v1 .actions button{height:34px}.pause-options-v1 .language-menu{left:0;right:0;width:auto;max-height:190px;overflow:auto}}
    @media(max-width:390px){.pause-options-v1 .row{grid-template-columns:minmax(0,1fr) 82px;padding:8px}.pause-options-v1 .toggle{width:82px;min-width:82px}.pause-options-v1 .copy small{font-size:6px}}
  `;
  document.head.appendChild(style);

  const button = (label, key, enabled, detail) => `<div class="row"><div class="copy"><b>${label}</b><small>${detail}</small></div><button class="toggle ${enabled ? 'is-on' : ''}" type="button" data-pause-option="${key}" ${['muted','screenShake','reducedMotion','rain'].includes(key) ? `data-setting="${key}"` : ''} aria-pressed="${enabled}">${enabled ? 'ON' : 'OFF'}</button></div>`;

  function renderOptions() {
    const pause = document.getElementById('pauseMenu');
    const panel = document.getElementById('panelContent');
    if (!pause || !panel || pause.classList.contains('hidden')) return;
    pause.classList.add('pause-options-open');
    panel.classList.remove('pause-progress-compact');
    const s = state();
    const lang = LANGUAGES.find(x => x[0] === language()) || LANGUAGES[0];
    panel.innerHTML = `<div class="pause-options-v1"><div class="section">GAMEPLAY / GUIDANCE</div>${button('TUTORIAL','tutorialEnabled',s.tutorialEnabled !== false,'Mission guidance and contextual lessons')}${button('GAME AUDIO','muted',!s.muted,'Master game audio')}${button('SCREEN SHAKE','screenShake',!!s.screenShake,'Camera impact feedback')}${button('REDUCED MOTION','reducedMotion',!!s.reducedMotion,'Reduce movement effects')}${button('ATMOSPHERIC RAIN','rain',!!s.rain,'City weather ambience')}<div class="section">VOICE & AUDIO</div>${button('AI VOICE','aiVoice',s.aiVoice !== false,'NIA / MARA spoken game guidance')}<label class="row"><span class="copy"><b>MUSIC</b><small><span data-pause-volume="musicVolume">${Math.round((s.musicVolume ?? .55) * 100)}%</span> VOLUME</small></span><input data-volume="musicVolume" type="range" min="0" max="1" step=".05" value="${s.musicVolume ?? .55}"></label><label class="row"><span class="copy"><b>SFX</b><small><span data-pause-volume="sfxVolume">${Math.round((s.sfxVolume ?? .7) * 100)}%</span> VOLUME</small></span><input data-volume="sfxVolume" type="range" min="0" max="1" step=".05" value="${s.sfxVolume ?? .7}"></label><div class="section">LANGUAGE</div><div class="row language"><div class="copy"><b>GAME LANGUAGE</b><small>Choose your interface language</small></div><button class="toggle" type="button" data-pause-language>🌐 ${lang[1]}</button><div class="language-menu hidden" data-pause-language-menu>${LANGUAGES.map(([code,name]) => `<button type="button" data-pause-language-code="${code}" class="${code === lang[0] ? 'active' : ''}">${name}</button>`).join('')}</div></div><div class="section">DISPLAY</div><div class="actions"><button type="button" data-pause-fullscreen>FULLSCREEN</button><button type="button" data-pause-reset>RESET OPTIONS</button></div></div>`;

    panel.querySelectorAll('[data-pause-option="tutorialEnabled"],[data-pause-option="aiVoice"]').forEach(btn => btn.addEventListener('click', () => {
      const key = btn.dataset.pauseOption;
      const current = state();
      const value = !current[key];
      save({ [key]: value });
      if (key === 'aiVoice' && !value) window.speechSynthesis?.cancel?.();
      window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value } }));
      renderOptions();
    }));

    panel.querySelectorAll('[data-pause-range]').forEach(input => input.addEventListener('input', () => {
      const value = Number(input.value);
      save({ [input.dataset.pauseRange]: value });
      const label = panel.querySelector(`[data-pause-volume="${input.dataset.pauseRange}"]`);
      if (label) label.textContent = `${Math.round(value * 100)}%`;
      runtimeRefresh();
    }));

    const langButton = panel.querySelector('[data-pause-language]'); const langMenu = panel.querySelector('[data-pause-language-menu]'); langButton?.addEventListener('click', event => { event.stopPropagation(); langMenu?.classList.toggle('hidden'); });
    panel.querySelectorAll('[data-pause-language-code]').forEach(btn => btn.addEventListener('click', () => { setLanguage(btn.dataset.pauseLanguageCode); renderOptions(); }));
    panel.querySelector('[data-pause-fullscreen]')?.addEventListener('click', async () => { try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch {} });
    panel.querySelector('[data-pause-reset]')?.addEventListener('click', () => { save({ muted:false, musicVolume:.55, sfxVolume:.7, screenShake:true, reducedMotion:false, rain:true, aiVoice:true, tutorialEnabled:true }); setLanguage('en'); window.dispatchEvent(new CustomEvent('relay-settings-change', { detail:{ reset:true, state: state() } })); renderOptions(); });
  }

  function closePause() { const close = document.querySelector('#pauseMenu [data-close]'); if (close) close.click(); }

  function init() {
    document.addEventListener('click', event => {
      const tab = event.target.closest?.('#pauseMenu [data-tab="settings"]');
      if (!tab) return;
      event.preventDefault(); event.stopImmediatePropagation();
      document.querySelectorAll('#pauseMenu .tab').forEach(x => x.classList.remove('active'));
      tab.classList.add('active');
      renderOptions();
    }, true);

    document.addEventListener('click', event => {
      const option = event.target.closest?.('#pauseMenu [data-setting]');
      if (!option) return;
      window.setTimeout(renderOptions, 0);
    });

    document.addEventListener('click', event => {
      if (!event.target.closest?.('.pause-options-v1 .language')) document.querySelectorAll('.pause-options-v1 .language-menu').forEach(menu => menu.classList.add('hidden'));
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const pause = document.getElementById('pauseMenu');
      if (!pause || pause.classList.contains('hidden')) return;
      event.preventDefault(); event.stopImmediatePropagation();
      closePause();
    }, true);

    document.addEventListener('click', event => {
      const tab = event.target.closest?.('#pauseMenu [data-tab]');
      if (!tab) return;
      const panel = document.getElementById('panelContent');
      if (!panel) return;
      panel.classList.toggle('pause-progress-compact', tab.dataset.tab === 'progress');
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
