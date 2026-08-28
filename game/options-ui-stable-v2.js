import { loadState, saveState } from './src/state.js';

(() => {
  'use strict';
  if (window.__relayOptionsStableV2) return;
  window.__relayOptionsStableV2 = true;

  const LANGUAGE_KEY = 'relay-runner-language';
  const PRESENTATION_KEY = 'relay.runner.ui.preferences.v1';
  const presentationDefaults = Object.freeze({ intelCards: true, allyIntel: true, eventPopups: true, tutorialHints: true });
  const state = () => loadState();
  const save = patch => saveState({ ...state(), ...patch });
  const readPresentation = () => {
    try { return { ...presentationDefaults, ...JSON.parse(localStorage.getItem(PRESENTATION_KEY) || '{}') }; }
    catch { return { ...presentationDefaults }; }
  };
  const writePresentation = prefs => {
    try { localStorage.setItem(PRESENTATION_KEY, JSON.stringify(prefs)); } catch {}
  };
  const language = () => localStorage.getItem(LANGUAGE_KEY) || 'en';
  const setLanguage = code => {
    localStorage.setItem(LANGUAGE_KEY, code);
    document.documentElement.lang = code === 'exyu' ? 'bs' : code;
    document.documentElement.dataset.language = code;
    window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { code } }));
  };
  const syncPresentation = prefs => {
    document.body.classList.toggle('relay-hide-intel', !prefs.intelCards);
    document.body.classList.toggle('relay-hide-ally', !prefs.allyIntel);
    document.body.classList.toggle('relay-hide-events', !prefs.eventPopups);
    document.body.classList.toggle('relay-hide-tutorials', !prefs.tutorialHints);
  };

  const injectStyles = () => {
    if (document.getElementById('relay-options-stable-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-options-stable-v2-style';
    style.textContent = `
      #titlePanel.relay-options-stable,#pauseMenu.relay-options-stable{isolation:isolate}
      #titlePanel.relay-options-stable #titlePanelContent,#pauseMenu.relay-options-stable #panelContent{overflow:hidden!important;min-height:0!important}
      #titlePanel.relay-options-stable .title-panel-card{display:flex!important;flex-direction:column!important;overflow:hidden!important;min-height:0!important}
      .relay-stable-shell{display:grid;grid-template-rows:auto minmax(0,1fr);height:100%;min-height:0;overflow:hidden;background:radial-gradient(circle at 100% 0,rgba(141,244,255,.055),transparent 34%),linear-gradient(155deg,rgba(7,19,33,.985),rgba(2,8,17,.99))}
      .relay-stable-head{display:flex;justify-content:space-between;gap:18px;padding:22px 64px 16px 24px;border-bottom:1px solid rgba(255,255,255,.07)}
      .relay-stable-kicker{margin:0 0 6px;color:#8df4ff;font:900 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.17em}
      .relay-stable-title{margin:0;color:#f4fcff;font:900 clamp(28px,4vw,38px)/.95 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.07em}
      .relay-stable-subtitle{margin:8px 0 0;color:#8196a8;font:700 10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}
      .relay-stable-ready{align-self:center;display:inline-flex;align-items:center;gap:7px;padding:8px 10px;border:1px solid rgba(174,227,127,.2);border-radius:999px;background:rgba(174,227,127,.055);color:#dfffc9;font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;white-space:nowrap}
      .relay-stable-ready i{width:7px;height:7px;border-radius:50%;background:#aee37f;box-shadow:0 0 13px rgba(174,227,127,.8)}
      .relay-stable-scroll{min-height:0;overflow-y:auto;overflow-x:hidden;padding:16px 20px 22px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(141,244,255,.68) rgba(255,255,255,.05);touch-action:pan-y}
      .relay-stable-scroll::-webkit-scrollbar{display:block;width:10px;height:10px}
      .relay-stable-scroll::-webkit-scrollbar-track{background:rgba(255,255,255,.045);border-radius:999px}
      .relay-stable-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(141,244,255,.82),rgba(255,208,110,.82));border:2px solid rgba(4,12,23,.8);border-radius:999px;min-height:44px}
      .relay-stable-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-content:start}
      .relay-stable-section{display:grid;gap:9px;align-content:start;min-width:0}.relay-stable-section.full{grid-column:1/-1}
      .relay-stable-section-title{display:flex;align-items:center;gap:8px;margin:2px;color:#8398aa;font:900 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.17em}
      .relay-stable-section-title:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,rgba(141,244,255,.18),transparent)}
      .relay-stable-card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;padding:14px;border:1px solid rgba(255,255,255,.075);border-radius:14px;background:linear-gradient(145deg,rgba(12,28,46,.92),rgba(4,11,20,.97));box-shadow:inset 0 1px rgba(255,255,255,.035),0 8px 26px rgba(0,0,0,.2);transition:border-color .14s,transform .14s,box-shadow .14s}
      .relay-stable-card:hover{border-color:rgba(141,244,255,.2);transform:translateY(-1px);box-shadow:inset 0 1px rgba(255,255,255,.04),0 12px 32px rgba(0,0,0,.28),0 0 24px rgba(141,244,255,.05)}
      .relay-stable-copy{min-width:0}.relay-stable-copy strong{display:block;color:#edf9ff;font:900 13px/1.25 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.075em}.relay-stable-copy small{display:block;margin-top:5px;color:#7890a3;font:650 9.5px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}
      .relay-stable-toggle{min-width:104px;height:40px;padding:0 13px;border:1px solid rgba(141,244,255,.22);border-radius:999px;background:rgba(5,14,24,.98);color:#8da2b4;font:900 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:.14s}.relay-stable-toggle:before{content:"";display:inline-block;width:9px;height:9px;margin-right:7px;border-radius:50%;background:#405262;vertical-align:-1px}.relay-stable-toggle.is-on{border-color:rgba(174,227,127,.48);color:#dfffc9;box-shadow:0 0 20px rgba(174,227,127,.09)}.relay-stable-toggle.is-on:before{background:#aee37f;box-shadow:0 0 12px rgba(174,227,127,.8)}.relay-stable-toggle:hover,.relay-stable-toggle:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none}.relay-stable-toggle:active{transform:scale(.96)}
      .relay-stable-range{display:grid;gap:8px;min-width:210px}.relay-stable-range-head{display:flex;justify-content:space-between;gap:10px;color:#8599aa;font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em}.relay-stable-range-head b{color:#ffd06e;font-weight:900}.relay-stable-range input{width:100%;height:10px;accent-color:#ffd06e;cursor:pointer;touch-action:pan-x}
      .relay-stable-language{position:relative}.relay-stable-language-menu{position:absolute;right:0;top:calc(100% + 8px);z-index:50;display:grid;gap:3px;min-width:190px;padding:6px;border:1px solid rgba(141,244,255,.2);border-radius:12px;background:rgba(4,12,23,.99);box-shadow:0 20px 55px rgba(0,0,0,.62)}.relay-stable-language-menu.hidden{display:none}.relay-stable-language-menu button{height:36px;padding:0 11px;border:0;border-radius:8px;background:transparent;color:#c9d8e3;text-align:left;font:900 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;cursor:pointer}.relay-stable-language-menu button:hover,.relay-stable-language-menu button.active{background:rgba(141,244,255,.07);color:#8df4ff}
      .relay-stable-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.relay-stable-action{min-height:46px;border:1px solid rgba(141,244,255,.17);border-radius:12px;background:linear-gradient(145deg,rgba(10,24,40,.98),rgba(3,9,17,.99));color:#d4e4ee;font:900 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;cursor:pointer;touch-action:manipulation;transition:.14s}.relay-stable-action:hover,.relay-stable-action:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none;transform:translateY(-1px);box-shadow:0 0 22px rgba(255,208,110,.08)}.relay-stable-action:active{transform:scale(.97)}
      .relay-stable-controls{display:flex;flex-wrap:wrap;gap:8px;padding:12px;border:1px solid rgba(255,255,255,.07);border-radius:13px;background:rgba(255,255,255,.02)}.relay-stable-key{display:inline-flex;align-items:center;gap:6px;color:#8196a8;font:800 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace}.relay-stable-key kbd{min-width:26px;padding:6px 7px;border:1px solid rgba(141,244,255,.18);border-bottom-color:rgba(141,244,255,.3);border-radius:7px;background:#07131f;color:#e7fbff;text-align:center;font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace}
      .relay-stable-toast{position:fixed;left:50%;bottom:26px;z-index:10000;pointer-events:none;opacity:0;transform:translate(-50%,10px);padding:10px 14px;border:1px solid rgba(141,244,255,.23);border-radius:999px;background:rgba(3,10,20,.96);color:#effcff;font:900 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;box-shadow:0 14px 34px rgba(0,0,0,.5);transition:opacity .16s ease,transform .16s ease}.relay-stable-toast.show{opacity:1;transform:translate(-50%,0)}
      @media(max-width:760px){
        #titlePanel.relay-options-stable .title-panel-card{width:96vw!important;max-height:calc(100dvh - 10px)!important;border-radius:16px!important}
        .relay-stable-head{padding:16px 53px 13px 15px}.relay-stable-title{font-size:24px}.relay-stable-kicker{font-size:8px}.relay-stable-subtitle{font-size:8px}.relay-stable-ready{display:none}.relay-stable-scroll{padding:12px 10px 18px}.relay-stable-grid{grid-template-columns:1fr;gap:11px}.relay-stable-section.full{grid-column:auto}.relay-stable-card{padding:12px 11px;gap:10px}.relay-stable-copy strong{font-size:11px}.relay-stable-copy small{font-size:8.5px}.relay-stable-toggle{min-width:92px;height:38px;font-size:9px}.relay-stable-range{min-width:0;width:100%}.relay-stable-actions{grid-template-columns:1fr 1fr}.relay-stable-actions .relay-stable-action:last-child{grid-column:1/-1}.relay-stable-language-menu{left:0;right:0;min-width:0}.relay-stable-toast{bottom:88px;font-size:9px}}
      @media(max-width:390px){.relay-stable-head{padding:13px 49px 11px 12px}.relay-stable-title{font-size:21px}.relay-stable-scroll{padding:9px 8px 15px}.relay-stable-card{padding:10px 9px}.relay-stable-copy strong{font-size:10px}.relay-stable-copy small{font-size:8px}.relay-stable-toggle{min-width:84px;height:36px;font-size:8px}.relay-stable-action{min-height:43px;font-size:8px}}
    `;
    document.head.appendChild(style);
  };

  const showToast = text => {
    let toast = document.getElementById('relayStableToast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'relayStableToast'; toast.className = 'relay-stable-toast'; document.body.appendChild(toast); }
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 900);
  };

  const toggle = (key, presentation = false) => {
    if (presentation) {
      const prefs = readPresentation(); prefs[key] = !prefs[key]; writePresentation(prefs); syncPresentation(prefs); showToast(`${key.replace(/([A-Z])/g,' $1').toUpperCase()} · ${prefs[key] ? 'ON' : 'OFF'}`); return;
    }
    const current = state();
    const value = key === 'muted' ? !current.muted : !(current[key] ?? false);
    save({ [key]: value });
    applyImmediate(key, value);
  };

  const applyImmediate = (key, value) => {
    document.documentElement.classList.toggle('relay-reduced-motion', key === 'reducedMotion' && value);
    if (key === 'screenShake') document.documentElement.classList.toggle('relay-screen-shake-off', !value);
    if (key === 'rain') document.documentElement.classList.toggle('relay-rain-off', !value);
    if (key === 'muted') document.documentElement.classList.toggle('relay-audio-muted', !!value);
    window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value, source: 'options-ui-stable-v2' } }));
    showToast(`${key.replace(/([A-Z])/g,' $1').toUpperCase()} · ${value ? 'ON' : 'OFF'}`);
  };

  const build = () => {
    const s = state();
    const p = readPresentation();
    const lang = ([['en','ENGLISH'],['exyu','EX-YU'],['es','ESPAÑOL'],['de','DEUTSCH']].find(x => x[0] === language()) || ['en','ENGLISH']);
    const toggleCard = (key, label, detail, enabled, extra = '') => `<article class="relay-stable-card"><div class="relay-stable-copy"><strong>${label}</strong><small>${detail}</small></div><button class="relay-stable-toggle ${enabled ? 'is-on' : ''}" type="button" data-final-toggle="${key}" aria-pressed="${enabled}" ${extra}>${enabled ? 'ON' : 'OFF'}</button></article>`;
    const rangeCard = (key, label, value, detail) => `<article class="relay-stable-card"><div class="relay-stable-copy"><strong>${label}</strong><small>${detail}</small></div><div class="relay-stable-range"><div class="relay-stable-range-head"><span>LEVEL</span><b data-final-range-value="${key}">${Math.round(value * 100)}%</b></div><input data-final-range="${key}" type="range" min="0" max="1" step=".05" value="${value}"></div></article>`;
    return `<div class="relay-stable-shell"><header class="relay-stable-head"><div><p class="relay-stable-kicker">RELAY RUNNER // SYSTEM TERMINAL</p><h2 class="relay-stable-title">OPTIONS</h2><p class="relay-stable-subtitle">Configure the run without leaving the relay.</p></div><span class="relay-stable-ready"><i></i>SYSTEM READY</span></header><div class="relay-stable-scroll"><div class="relay-stable-grid">
      <section class="relay-stable-section"><div class="relay-stable-section-title">GAMEPLAY</div>${toggleCard('tutorialEnabled','TUTORIAL','Mission guidance and contextual lessons',s.tutorialEnabled !== false)}${toggleCard('screenShake','SCREEN SHAKE','Impact and camera feedback',!!s.screenShake)}${toggleCard('reducedMotion','REDUCED MOTION','Reduce presentation motion',!!s.reducedMotion)}${toggleCard('rain','ATMOSPHERIC RAIN','City weather ambience',!!s.rain)}</section>
      <section class="relay-stable-section"><div class="relay-stable-section-title">AUDIO</div>${toggleCard('muted','MASTER AUDIO','Global game sound',!s.muted)}${toggleCard('aiVoice','AI VOICE','NIA / MARA spoken guidance',s.aiVoice !== false)}${rangeCard('musicVolume','MUSIC',s.musicVolume ?? .55,'Background music level')}${rangeCard('sfxVolume','SFX',s.sfxVolume ?? .7,'Gameplay sound effects')}</section>
      <section class="relay-stable-section full"><div class="relay-stable-section-title">INTERFACE</div><div class="relay-stable-grid">${toggleCard('intelCards','INTEL CARDS','Enemy discovery cards and briefings',p.intelCards)}${toggleCard('allyIntel','ALLY INTEL','Side intel panels',p.allyIntel)}${toggleCard('eventPopups','EVENT POPUPS','Transient gameplay notices',p.eventPopups)}${toggleCard('tutorialHints','TUTORIAL HINTS','Contextual onboarding hints',p.tutorialHints)}</div></section>
      <section class="relay-stable-section full"><div class="relay-stable-section-title">SYSTEM</div><article class="relay-stable-card relay-stable-language"><div class="relay-stable-copy"><strong>GAME LANGUAGE</strong><small>Interface and supported system language</small></div><button class="relay-stable-toggle" type="button" data-final-language>🌐 ${lang[1]}</button><div class="relay-stable-language-menu hidden" data-final-language-menu>${[['en','ENGLISH'],['exyu','EX-YU'],['es','ESPAÑOL'],['de','DEUTSCH']].map(([code,name])=>`<button type="button" data-final-language-code="${code}" class="${code===lang[0]?'active':''}">${name}</button>`).join('')}</div></article><div class="relay-stable-actions"><button class="relay-stable-action" type="button" data-final-fullscreen>FULLSCREEN</button><button class="relay-stable-action" type="button" data-final-reset>RESET OPTIONS</button><button class="relay-stable-action" type="button" data-final-controls>CONTROL REFERENCE</button></div><div class="relay-stable-controls" data-final-controls-panel hidden><span class="relay-stable-key"><kbd>A</kbd><span>MOVE</span></span><span class="relay-stable-key"><kbd>D</kbd><span>MOVE</span></span><span class="relay-stable-key"><kbd>SPACE</kbd><span>JUMP</span></span><span class="relay-stable-key"><kbd>E</kbd><span>FIRE</span></span><span class="relay-stable-key"><kbd>Q</kbd><span>BLADE</span></span><span class="relay-stable-key"><kbd>SHIFT</kbd><span>DASH</span></span><span class="relay-stable-key"><kbd>F</kbd><span>FLIGHT</span></span><span class="relay-stable-key"><kbd>ESC</kbd><span>PAUSE</span></span></div></section>
    </div></div></div>`;
  };

  const mount = (root, kind) => {
    if (!root) return false;
    injectStyles();
    root.classList.add('relay-options-stable');
    const host = kind === 'home' ? root.querySelector('#titlePanelContent') : root.querySelector('#panelContent');
    if (!host) return false;
    host.innerHTML = build();
    if (kind === 'pause') root.classList.add('relay-options-stable');
    return true;
  };

  const homeOpen = () => {
    const panel = document.getElementById('titlePanel');
    if (!panel || panel.classList.contains('hidden')) return;
    const heading = document.getElementById('titlePanelHeading');
    if (!heading || !/OPTIONS|RUN SETTINGS/i.test(heading.textContent || '')) return;
    mount(panel, 'home');
  };
  const pauseOpen = () => {
    const pause = document.getElementById('pauseMenu');
    if (!pause || pause.classList.contains('hidden')) return;
    const tab = pause.querySelector('[data-tab="settings"]');
    if (!tab?.classList.contains('active')) return;
    mount(pause, 'pause');
  };
  const rerender = () => { homeOpen(); pauseOpen(); syncPresentation(readPresentation()); };

  const bind = () => {
    injectStyles();
    syncPresentation(readPresentation());

    document.addEventListener('click', event => {
      const homeButton = event.target.closest?.('[data-title-panel="controls"]');
      if (homeButton) window.setTimeout(homeOpen, 0);
      const pauseSettings = event.target.closest?.('#pauseMenu [data-tab="settings"]');
      if (pauseSettings) window.setTimeout(pauseOpen, 0);

      const toggleButton = event.target.closest?.('[data-final-toggle]');
      if (toggleButton) {
        const key = toggleButton.dataset.finalToggle;
        const presentation = ['intelCards','allyIntel','eventPopups','tutorialHints'].includes(key);
        // Pause settings already have the native main.js handler via data-setting when present;
        // these final controls use the stable owner directly for deterministic feedback.
        toggle(key, presentation);
        rerender();
        return;
      }
      const langButton = event.target.closest?.('[data-final-language]');
      if (langButton) { event.stopPropagation(); langButton.closest('.relay-stable-language')?.querySelector('[data-final-language-menu]')?.classList.toggle('hidden'); return; }
      const langCode = event.target.closest?.('[data-final-language-code]');
      if (langCode) { setLanguage(langCode.dataset.finalLanguageCode); rerender(); return; }
      const full = event.target.closest?.('[data-final-fullscreen]');
      if (full) { (async()=>{ try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch {} })(); return; }
      const reset = event.target.closest?.('[data-final-reset]');
      if (reset) { save({ muted:false,musicVolume:.55,sfxVolume:.7,screenShake:true,reducedMotion:false,rain:true,aiVoice:true,tutorialEnabled:true }); writePresentation({ ...presentationDefaults }); setLanguage('en'); window.dispatchEvent(new CustomEvent('relay-settings-change',{detail:{reset:true,source:'options-ui-stable-v2'}})); showToast('OPTIONS · RESET'); rerender(); return; }
      const controls = event.target.closest?.('[data-final-controls]');
      if (controls) { const panel = controls.closest('.relay-stable-section')?.querySelector('[data-final-controls-panel]'); if (panel) panel.hidden = !panel.hidden; return; }
    });

    document.addEventListener('input', event => {
      const range = event.target.closest?.('[data-final-range]');
      if (!range) return;
      const key = range.dataset.finalRange;
      const value = Number(range.value);
      if (!Number.isFinite(value)) return;
      save({ [key]: value });
      window.dispatchEvent(new CustomEvent('relay-settings-change',{detail:{key,value,source:'options-ui-stable-v2'}}));
      const label = range.closest('.relay-stable-card')?.querySelector(`[data-final-range-value="${key}"]`);
      if (label) label.textContent = `${Math.round(value*100)}%`;
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('.relay-stable-language')) document.querySelectorAll('.relay-stable-language-menu').forEach(menu => menu.classList.add('hidden'));
    });

    const titlePanel = document.getElementById('titlePanel');
    const pauseMenu = document.getElementById('pauseMenu');
    if (titlePanel) new MutationObserver(() => window.setTimeout(homeOpen, 0)).observe(titlePanel,{attributes:true,attributeFilter:['class']});
    if (pauseMenu) new MutationObserver(() => window.setTimeout(pauseOpen, 0)).observe(pauseMenu,{attributes:true,attributeFilter:['class']});
    window.addEventListener('relay-settings-change', () => window.setTimeout(rerender, 0));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once:true });
  else bind();
})();
