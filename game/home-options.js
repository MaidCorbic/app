import { loadState, saveState } from './src/state.js';

(() => {
  if (window.__relayHomeOptionsV5) return;
  window.__relayHomeOptionsV5 = true;

  const LANGUAGES = [['en','ENGLISH'],['exyu','EX-YU'],['es','ESPAÑOL'],['de','DEUTSCH']];
  const LANGUAGE_KEY = 'relay-runner-language';
  const language = () => localStorage.getItem(LANGUAGE_KEY) || 'en';
  const setLanguage = code => { localStorage.setItem(LANGUAGE_KEY, code); document.documentElement.lang = code === 'exyu' ? 'bs' : code; document.documentElement.dataset.language = code; window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { code } })); };
  const getState = () => loadState();
  const savePatch = patch => { const next = { ...getState(), ...patch }; saveState(next); return next; };

  const style = document.createElement('style');
  style.textContent = `
    #titlePanel.home-options-exclusive{box-sizing:border-box!important;padding:clamp(8px,2vw,24px)!important;overflow:hidden!important}
    #titlePanel.home-options-exclusive .title-panel-card{box-sizing:border-box!important;width:min(720px,92vw)!important;max-width:100%!important;max-height:calc(100dvh - 24px)!important;max-height:calc(100svh - 24px)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;padding:clamp(18px,2.4vw,28px)!important}
    #titlePanel.home-options-exclusive #titlePanelContent{box-sizing:border-box!important;min-height:0!important;width:100%!important;max-height:calc(100dvh - 175px)!important;max-height:calc(100svh - 175px)!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important;padding:0 4px 6px 0!important}
    #titlePanel.home-options-exclusive .home-options-v3{display:grid;gap:8px;width:100%;max-width:100%;box-sizing:border-box}
    #titlePanel.home-options-exclusive .home-section{margin:4px 2px 0;color:#5f7287;font:800 8px 'DM Mono',monospace;letter-spacing:1.2px}
    #titlePanel.home-options-exclusive .home-opt{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;width:100%;min-width:0;box-sizing:border-box;padding:10px 12px;border:1px solid rgba(210,226,240,.10);border-radius:8px;background:linear-gradient(145deg,rgba(12,25,43,.86),rgba(5,12,23,.94));box-shadow:inset 0 1px rgba(255,255,255,.035),0 6px 18px rgba(0,0,0,.20)}
    #titlePanel.home-options-exclusive .home-opt-copy{min-width:0;overflow:hidden}
    #titlePanel.home-options-exclusive .home-opt-copy b{display:block;color:#e9f2f8;font:800 9px 'DM Mono',monospace;letter-spacing:.7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #titlePanel.home-options-exclusive .home-opt-copy small{display:block;margin-top:3px;color:#68798c;font:700 7px/1.35 'DM Mono',monospace;letter-spacing:.25px;overflow-wrap:anywhere}
    #titlePanel.home-options-exclusive .home-opt button{box-sizing:border-box;width:92px;min-width:92px;max-width:92px;height:34px;padding:0 8px;border:1px solid rgba(210,226,240,.18);border-radius:7px;background:#07111ff2;color:#e9f2f8;font:800 8px 'DM Mono',monospace;letter-spacing:.6px;cursor:pointer;touch-action:manipulation}
    #titlePanel.home-options-exclusive .home-opt button.is-on{border-color:rgba(104,231,190,.55);color:#68e7be}
    #titlePanel.home-options-exclusive .home-opt button:focus-visible,#titlePanel.home-options-exclusive .home-opt button:hover{border-color:#ffd06e;color:#ffd06e;outline:none;box-shadow:0 0 14px rgba(255,208,110,.10)}
    #titlePanel.home-options-exclusive .home-opt input[type=range]{width:clamp(130px,22vw,180px);max-width:100%;accent-color:#ffd06e;cursor:pointer;touch-action:pan-x}
    #titlePanel.home-options-exclusive .home-lang{position:relative}
    #titlePanel.home-options-exclusive .home-lang-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:50;width:170px;max-width:calc(100vw - 32px);padding:5px;border:1px solid rgba(210,226,240,.18);border-radius:8px;background:#07111ff8;box-shadow:0 14px 40px #000b;backdrop-filter:blur(14px)}
    #titlePanel.home-options-exclusive .home-lang-menu.hidden{display:none}
    #titlePanel.home-options-exclusive .home-lang-menu button{display:block;width:100%;max-width:none;min-width:0;height:34px;text-align:left;border:0;background:transparent}
    #titlePanel.home-options-exclusive .home-lang-menu button.active,#titlePanel.home-options-exclusive .home-lang-menu button:hover{background:rgba(255,208,110,.08);color:#ffd06e}
    #titlePanel.home-options-exclusive .home-options-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
    #titlePanel.home-options-exclusive .home-options-actions button{width:100%;min-width:0;height:36px;border:1px solid rgba(210,226,240,.15);border-radius:7px;background:#07111ff2;color:#aebdcc;font:800 8px 'DM Mono',monospace;letter-spacing:.6px;cursor:pointer;touch-action:manipulation}
    #titlePanel.home-options-exclusive .home-options-actions button:hover{color:#ffd06e;border-color:#ffd06e}
    #titlePanel.home-options-exclusive .home-controls{padding:10px 12px}
    #titlePanel.home-options-exclusive .home-controls small{display:block;color:#68798c;font:700 7px/1.6 'DM Mono',monospace;overflow-wrap:anywhere}
    @media(max-width:700px){#titlePanel.home-options-exclusive{padding:6px!important}#titlePanel.home-options-exclusive .title-panel-card{width:min(94vw,430px)!important;max-height:calc(100dvh - 12px)!important;max-height:calc(100svh - 12px)!important;padding:13px!important;border-radius:12px!important}#titlePanel.home-options-exclusive #titlePanelContent{max-height:calc(100dvh - 100px)!important;max-height:calc(100svh - 100px)!important;padding-right:2px!important}#titlePanel.home-options-exclusive .home-options-v3{gap:6px}#titlePanel.home-options-exclusive .home-section{margin-top:3px;font-size:7px;letter-spacing:1px}#titlePanel.home-options-exclusive .home-opt{grid-template-columns:minmax(0,1fr) 88px;gap:8px;padding:9px 10px;border-radius:7px}#titlePanel.home-options-exclusive .home-opt-copy b{font-size:8px}#titlePanel.home-options-exclusive .home-opt-copy small{font-size:6.5px}#titlePanel.home-options-exclusive .home-opt button{width:88px;min-width:88px;max-width:88px;height:32px}#titlePanel.home-options-exclusive .home-opt input[type=range]{width:100%;height:28px;grid-column:1 / -1}#titlePanel.home-options-exclusive .home-options-actions{grid-template-columns:1fr 1fr;gap:6px}#titlePanel.home-options-exclusive .home-options-actions button{height:34px}#titlePanel.home-options-exclusive .home-lang-menu{left:0;right:0;width:auto;max-width:none;max-height:190px;overflow-y:auto}#titlePanel.home-options-exclusive .home-lang-menu button{width:100%;height:36px}}
    @media(max-width:380px){#titlePanel.home-options-exclusive .title-panel-card{width:96vw!important;padding:10px!important}#titlePanel.home-options-exclusive #titlePanelContent{max-height:calc(100dvh - 84px)!important;max-height:calc(100svh - 84px)!important}#titlePanel.home-options-exclusive .home-options-v3{gap:5px}#titlePanel.home-options-exclusive .home-opt{grid-template-columns:minmax(0,1fr) 82px;padding:8px}#titlePanel.home-options-exclusive .home-opt button{width:82px;min-width:82px;max-width:82px}#titlePanel.home-options-exclusive .home-opt-copy small{font-size:6px}}
    @media(min-width:701px) and (max-width:1000px){#titlePanel.home-options-exclusive .title-panel-card{width:min(88vw,620px)!important}}
    @media(orientation:landscape) and (max-height:560px){#titlePanel.home-options-exclusive .title-panel-card{max-height:calc(100dvh - 8px)!important;max-height:calc(100svh - 8px)!important;padding:10px!important}#titlePanel.home-options-exclusive #titlePanelContent{max-height:calc(100dvh - 72px)!important;max-height:calc(100svh - 72px)!important}}
  `;
  document.head.appendChild(style);

  const optionButton = (label, name, on, detail) => `<div class="home-opt"><div class="home-opt-copy"><b>${label}</b><small>${detail}</small></div><button type="button" data-home-toggle="${name}" class="${on ? 'is-on' : ''}" aria-pressed="${on}">${on ? 'ON' : 'OFF'}</button></div>`;
  let rendering = false;
  const panel = () => document.getElementById('titlePanel');
  const content = () => document.getElementById('titlePanelContent');
  const heading = () => document.getElementById('titlePanelHeading');

  function render() {
    if (rendering || !panel() || !content() || !heading()) return;
    rendering = true;
    const p = panel();
    p.classList.remove('hidden');
    p.classList.add('home-options-exclusive');
    heading().textContent = 'OPTIONS';
    const eyebrow = document.getElementById('titlePanelEyebrow');
    if (eyebrow) eyebrow.textContent = 'RELAY RUNNER // SYSTEM SETTINGS';
    content().replaceChildren();
    const s = getState();
    const lang = LANGUAGES.find(x => x[0] === language()) || LANGUAGES[0];
    content().innerHTML = `<div class="home-options-v3"><div class="home-section">GAMEPLAY</div>${optionButton('TUTORIAL','tutorialEnabled',s.tutorialEnabled !== false,'Mission guidance and contextual lessons')}${optionButton('GAME AUDIO','muted',!s.muted,'Master game audio')}${optionButton('SCREEN SHAKE','screenShake',!!s.screenShake,'Camera impact feedback')}${optionButton('REDUCED MOTION','reducedMotion',!!s.reducedMotion,'Reduce movement effects')}<div class="home-section">VOICE & AUDIO</div>${optionButton('AI VOICE','aiVoice',s.aiVoice !== false,'NIA / MARA spoken game guidance')}<label class="home-opt"><span class="home-opt-copy"><b>MUSIC</b><small><span data-music-value>${Math.round((s.musicVolume ?? .55) * 100)}%</span> VOLUME</small></span><input data-home-volume="musicVolume" type="range" min="0" max="1" step=".05" value="${s.musicVolume ?? .55}"></label><label class="home-opt"><span class="home-opt-copy"><b>SFX</b><small><span data-sfx-value>${Math.round((s.sfxVolume ?? .7) * 100)}%</span> VOLUME</small></span><input data-home-volume="sfxVolume" type="range" min="0" max="1" step=".05" value="${s.sfxVolume ?? .7}"></label><div class="home-section">LANGUAGE</div><div class="home-opt home-lang"><div class="home-opt-copy"><b>GAME LANGUAGE</b><small>Choose your interface language</small></div><button type="button" data-home-language>🌐 ${lang[1]}</button><div class="home-lang-menu hidden" data-home-language-menu>${LANGUAGES.map(([code,name]) => `<button type="button" data-language="${code}" class="${code === lang[0] ? 'active' : ''}">${name}</button>`).join('')}</div></div><div class="home-section">DISPLAY</div><div class="home-options-actions"><button type="button" data-home-fullscreen>FULLSCREEN</button><button type="button" data-home-reset>RESET OPTIONS</button></div><div class="home-section">CONTROLS</div><div class="home-opt home-controls"><small>A / D MOVE · SPACE JUMP · E FIRE · Q BLADE · SHIFT DASH</small></div></div>`;

    content().querySelectorAll('[data-home-toggle]').forEach(btn => btn.addEventListener('click', () => { const name = btn.dataset.homeToggle; const previous = getState(); const nextValue = name === 'muted' ? !previous.muted : !previous[name]; savePatch({ [name]: nextValue }); window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key:name, value:nextValue } })); render(); }));
    content().querySelectorAll('[data-home-volume]').forEach(input => input.addEventListener('input', () => { const value = Number(input.value); savePatch({ [input.dataset.homeVolume]: value }); const label = content().querySelector(input.dataset.homeVolume === 'musicVolume' ? '[data-music-value]' : '[data-sfx-value]'); if (label) label.textContent = `${Math.round(value * 100)}%`; }));
    const langButton = content().querySelector('[data-home-language]'); const langMenu = content().querySelector('[data-home-language-menu]');
    langButton?.addEventListener('click', e => { e.stopPropagation(); langMenu?.classList.toggle('hidden'); });
    content().querySelectorAll('[data-language]').forEach(btn => btn.addEventListener('click', () => { setLanguage(btn.dataset.language); render(); }));
    content().querySelector('[data-home-fullscreen]')?.addEventListener('click', async () => { try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch {} });
    content().querySelector('[data-home-reset]')?.addEventListener('click', () => { savePatch({ muted:false, musicVolume:.55, sfxVolume:.7, screenShake:true, reducedMotion:false, rain:true, aiVoice:true, tutorialEnabled:true }); localStorage.removeItem(LANGUAGE_KEY); setLanguage('en'); window.dispatchEvent(new CustomEvent('relay-settings-change', { detail:{reset:true} })); render(); });
    rendering = false;
  }

  function openOptions(event) {
    const p = panel();
    if (!p) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    p.classList.remove('hidden');
    p.setAttribute('aria-hidden','false');
    render();
  }

  function closeOptions() {
    const p = panel();
    if (!p) return;
    p.classList.add('hidden');
    p.classList.remove('home-options-exclusive');
    p.setAttribute('aria-hidden','true');
  }

  function init() {
    const p = panel();
    if (!p) return;

    // Capture-phase delegation guarantees that the Options button opens this
    // panel before any legacy title-menu click handler can render old settings.
    document.addEventListener('click', event => {
      const button = event.target?.closest?.('[data-title-panel="controls"]');
      if (button) openOptions(event);
    }, true);

    document.addEventListener('pointerup', event => {
      const button = event.target?.closest?.('[data-title-panel="controls"]');
      if (button) openOptions(event);
    }, true);

    document.addEventListener('click', event => {
      if (event.target?.closest?.('#closeTitlePanel')) closeOptions();
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
