import { loadState, saveState } from './src/state.js';
import './options-polish-v2.css';

(() => {
  'use strict';
  if (window.__relayUnifiedOptionsUiV1) return;
  window.__relayUnifiedOptionsUiV1 = true;

  const LANGUAGE_KEY = 'relay-runner-language';
  const PRESENTATION_KEY = 'relay.runner.ui.preferences.v1';
  const LANGUAGES = [
    ['en', 'ENGLISH'],
    ['exyu', 'EX-YU'],
    ['es', 'ESPAÑOL'],
    ['de', 'DEUTSCH'],
  ];
  const defaults = Object.freeze({
    intelCards: true,
    allyIntel: true,
    eventPopups: true,
    tutorialHints: true,
  });

  const readPresentation = () => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(PRESENTATION_KEY) || '{}') };
    } catch {
      return { ...defaults };
    }
  };
  const writePresentation = value => {
    try { localStorage.setItem(PRESENTATION_KEY, JSON.stringify(value)); } catch {}
  };
  const getState = () => loadState();
  const savePatch = patch => saveState({ ...getState(), ...patch });
  const getLanguage = () => localStorage.getItem(LANGUAGE_KEY) || 'en';
  const setLanguage = code => {
    localStorage.setItem(LANGUAGE_KEY, code);
    document.documentElement.lang = code === 'exyu' ? 'bs' : code;
    document.documentElement.dataset.language = code;
    window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { code } }));
  };

  const syncPresentationClasses = prefs => {
    document.body.classList.toggle('relay-hide-intel', !prefs.intelCards);
    document.body.classList.toggle('relay-hide-ally', !prefs.allyIntel);
    document.body.classList.toggle('relay-hide-events', !prefs.eventPopups);
    document.body.classList.toggle('relay-hide-tutorials', !prefs.tutorialHints);
  };

  const injectStyles = () => {
    if (document.getElementById('relay-unified-options-style')) return;
    const style = document.createElement('style');
    style.id = 'relay-unified-options-style';
    style.textContent = `
      :root{--relay-cyan:#8df4ff;--relay-green:#aee37f;--relay-amber:#ffd06e;--relay-ink:#dffcff;--relay-muted:#70879b;--relay-panel:rgba(4,12,23,.96)}
      #titlePanel.relay-options-unified,#pauseMenu.relay-options-unified{isolation:isolate}
      #titlePanel.relay-options-unified{box-sizing:border-box;padding:12px;overflow:hidden}
      #titlePanel.relay-options-unified .title-panel-card{position:relative;box-sizing:border-box;width:min(820px,94vw);max-width:100%;max-height:calc(100dvh - 24px);display:flex;flex-direction:column;overflow:hidden;padding:0;border:1px solid rgba(141,244,255,.2);border-radius:20px;background:linear-gradient(155deg,rgba(7,19,33,.98),rgba(2,8,17,.98));box-shadow:0 28px 80px rgba(0,0,0,.58),0 0 50px rgba(141,244,255,.07),inset 0 1px rgba(255,255,255,.06)}
      #titlePanel.relay-options-unified .title-panel-close{z-index:3;top:14px;right:14px;width:38px;height:38px;border:1px solid rgba(141,244,255,.2);border-radius:12px;background:rgba(255,255,255,.04);color:var(--relay-ink);font-size:24px;cursor:pointer}
      #titlePanel.relay-options-unified .title-panel-close:hover{border-color:var(--relay-amber);color:var(--relay-amber);transform:translateY(-1px)}
      .relay-options-shell{display:grid;grid-template-rows:auto 1fr auto;min-height:0;height:100%;background:radial-gradient(circle at 100% 0,rgba(141,244,255,.06),transparent 35%)}
      .relay-options-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:22px 68px 16px 24px;border-bottom:1px solid rgba(255,255,255,.06)}
      .relay-options-kicker{margin:0 0 5px;color:var(--relay-cyan);font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em}
      .relay-options-title{margin:0;color:#f4fcff;font:900 clamp(23px,4vw,34px)/.95 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}
      .relay-options-subtitle{margin:7px 0 0;color:var(--relay-muted);font:600 8px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em}
      .relay-options-status{display:inline-flex;align-items:center;gap:7px;padding:7px 9px;border:1px solid rgba(174,227,127,.18);border-radius:999px;background:rgba(174,227,127,.05);color:#dfffc9;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;white-space:nowrap}
      .relay-options-status i{width:6px;height:6px;border-radius:50%;background:var(--relay-green);box-shadow:0 0 12px rgba(174,227,127,.8)}
      .relay-options-body{min-height:0;overflow:auto;padding:15px 20px 18px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:rgba(141,244,255,.22) transparent}
      .relay-options-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .relay-options-section{display:grid;gap:9px;align-content:start}
      .relay-options-section.full{grid-column:1/-1}
      .relay-section-title{display:flex;align-items:center;gap:8px;margin:2px 2px 0;color:#7f96aa;font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em}
      .relay-section-title:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,rgba(141,244,255,.16),transparent)}
      .relay-option-card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:12px 13px;border:1px solid rgba(255,255,255,.07);border-radius:13px;background:linear-gradient(145deg,rgba(11,27,44,.9),rgba(4,11,20,.95));box-shadow:inset 0 1px rgba(255,255,255,.035),0 8px 24px rgba(0,0,0,.2);transition:border-color .14s,transform .14s,box-shadow .14s}
      .relay-option-card:hover{border-color:rgba(141,244,255,.18);transform:translateY(-1px);box-shadow:inset 0 1px rgba(255,255,255,.04),0 12px 28px rgba(0,0,0,.25),0 0 22px rgba(141,244,255,.05)}
      .relay-option-copy{min-width:0}.relay-option-copy strong{display:block;color:#edf9ff;font:900 9px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}.relay-option-copy small{display:block;margin-top:4px;color:#698095;font:600 7px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.03em}
      .relay-toggle{position:relative;display:inline-flex;align-items:center;justify-content:space-between;gap:7px;min-width:76px;height:34px;padding:0 8px;border:1px solid rgba(141,244,255,.22);border-radius:999px;background:rgba(5,14,24,.96);color:#7890a4;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;cursor:pointer;touch-action:manipulation;transition:.14s}.relay-toggle:before{content:"";width:8px;height:8px;border-radius:50%;background:#415466;transition:.14s;order:2}.relay-toggle.is-on{border-color:rgba(174,227,127,.45);color:#dfffc9;box-shadow:0 0 17px rgba(174,227,127,.08)}.relay-toggle.is-on:before{background:var(--relay-green);box-shadow:0 0 12px rgba(174,227,127,.8)}.relay-toggle:hover,.relay-toggle:focus-visible{border-color:var(--relay-amber);color:var(--relay-amber);outline:none}.relay-toggle:active{transform:scale(.96)}
      .relay-range{display:grid;gap:8px;min-width:180px}.relay-range-head{display:flex;justify-content:space-between;gap:10px;color:#8399ab;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em}.relay-range-value{color:var(--relay-amber)}.relay-range input{width:100%;accent-color:var(--relay-amber);cursor:pointer;touch-action:pan-x}
      .relay-select{position:relative}.relay-select>button{min-width:145px}.relay-language-menu{position:absolute;right:0;top:calc(100% + 7px);z-index:40;display:grid;gap:3px;min-width:180px;padding:6px;border:1px solid rgba(141,244,255,.18);border-radius:12px;background:rgba(4,12,23,.99);box-shadow:0 20px 50px rgba(0,0,0,.55)}.relay-language-menu.hidden{display:none}.relay-language-menu button{height:34px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:#c7d6e1;text-align:left;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;cursor:pointer}.relay-language-menu button:hover,.relay-language-menu button.active{background:rgba(141,244,255,.07);color:var(--relay-cyan)}
      .relay-action-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.relay-action{min-height:42px;border:1px solid rgba(141,244,255,.16);border-radius:11px;background:linear-gradient(145deg,rgba(10,24,40,.96),rgba(3,9,17,.98));color:#cfe1ed;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;cursor:pointer;touch-action:manipulation;transition:.14s}.relay-action:hover,.relay-action:focus-visible{border-color:var(--relay-amber);color:var(--relay-amber);outline:none;transform:translateY(-1px);box-shadow:0 0 22px rgba(255,208,110,.08)}.relay-action:active{transform:scale(.97)}
      .relay-controls-strip{display:flex;flex-wrap:wrap;gap:7px;padding:11px 12px;border:1px solid rgba(255,255,255,.06);border-radius:13px;background:rgba(255,255,255,.018)}.relay-key{display:inline-flex;align-items:center;gap:5px;color:#6f879b;font:700 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em}.relay-key kbd{min-width:24px;padding:5px 6px;border:1px solid rgba(141,244,255,.16);border-bottom-color:rgba(141,244,255,.3);border-radius:6px;background:#07131f;color:#e7fbff;text-align:center;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace}
      #pauseMenu.relay-options-unified .menu-grid{min-height:0}#pauseMenu.relay-options-unified #panelContent{min-height:0;overflow:hidden!important;padding:0!important}#pauseMenu.relay-options-unified .relay-options-shell{height:100%}
      #pauseMenu.relay-options-unified .menu-grid>aside{border-right:1px solid rgba(255,255,255,.06)}
      #pauseMenu.relay-options-unified .tab{transition:.14s}.relay-options-home-link{color:#6f879b;font:700 7px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}
      #titlePanelContent.relay-legacy-cleared{display:none!important}
      @media(max-width:760px){#titlePanel.relay-options-unified{padding:6px}#titlePanel.relay-options-unified .title-panel-card{width:96vw;max-height:calc(100dvh - 12px);border-radius:16px}.relay-options-head{padding:17px 54px 13px 16px}.relay-options-title{font-size:23px}.relay-options-subtitle{font-size:7px}.relay-options-status{display:none}.relay-options-body{padding:12px 11px 14px}.relay-options-grid{grid-template-columns:1fr;gap:11px}.relay-options-section.full{grid-column:auto}.relay-option-card{padding:11px 10px}.relay-range{min-width:0;width:100%}.relay-action-row{grid-template-columns:1fr 1fr}.relay-action-row .relay-action:last-child{grid-column:1/-1}.relay-toggle{min-width:72px}.relay-select>button{min-width:125px}}
      @media(max-width:390px){.relay-options-head{padding:14px 50px 11px 13px}.relay-options-title{font-size:20px}.relay-options-body{padding:10px 8px 12px}.relay-option-card{grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:9px}.relay-option-copy strong{font-size:8px}.relay-option-copy small{font-size:6.3px}.relay-toggle{min-width:68px;height:32px}.relay-language-menu{left:0;right:0;min-width:0}}
    `;
    document.head.appendChild(style);
  };

  const toggleMarkup = (key, label, detail, enabled) => `<article class="relay-option-card"><div class="relay-option-copy"><strong>${label}</strong><small>${detail}</small></div><button class="relay-toggle ${enabled ? 'is-on' : ''}" type="button" data-unified-toggle="${key}" aria-pressed="${enabled}">${enabled ? 'ON' : 'OFF'}</button></article>`;
  const rangeMarkup = (key, label, value, detail) => `<article class="relay-option-card"><div class="relay-option-copy"><strong>${label}</strong><small>${detail}</small></div><div class="relay-range"><div class="relay-range-head"><span>LEVEL</span><span class="relay-range-value" data-range-value="${key}">${Math.round(value * 100)}%</span></div><input data-unified-range="${key}" type="range" min="0" max="1" step=".05" value="${value}"></div></article>`;

  const buildContent = () => {
    const state = getState();
    const prefs = readPresentation();
    const lang = LANGUAGES.find(x => x[0] === getLanguage()) || LANGUAGES[0];
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
          ${rangeMarkup('musicVolume','MUSIC',state.musicVolume ?? .55,'Background music level')}
          ${rangeMarkup('sfxVolume','SFX',state.sfxVolume ?? .7,'Gameplay sound effects')}
        </section>
        <section class="relay-options-section full"><div class="relay-section-title">INTERFACE</div>
          <div class="relay-options-grid">
            ${toggleMarkup('intelCards','INTEL CARDS','Enemy discovery cards and briefings',prefs.intelCards)}
            ${toggleMarkup('allyIntel','ALLY INTEL','Side intel panels',prefs.allyIntel)}
            ${toggleMarkup('eventPopups','EVENT POPUPS','Transient gameplay notices',prefs.eventPopups)}
            ${toggleMarkup('tutorialHints','TUTORIAL HINTS','Contextual onboarding hints',prefs.tutorialHints)}
          </div>
        </section>
        <section class="relay-options-section full"><div class="relay-section-title">SYSTEM</div>
          <div class="relay-option-card relay-select"><div class="relay-option-copy"><strong>GAME LANGUAGE</strong><small>Interface and supported system language</small></div><button class="relay-toggle" type="button" data-unified-language>🌐 ${lang[1]}</button><div class="relay-language-menu hidden" data-unified-language-menu>${LANGUAGES.map(([code,name])=>`<button type="button" data-unified-language-code="${code}" class="${code===lang[0]?'active':''}">${name}</button>`).join('')}</div></div>
          <div class="relay-action-row"><button class="relay-action" type="button" data-unified-fullscreen>FULLSCREEN</button><button class="relay-action" type="button" data-unified-reset>RESET OPTIONS</button><button class="relay-action" type="button" data-unified-controls>CONTROL REFERENCE</button></div>
          <div class="relay-controls-strip" data-unified-controls-panel>
            <span class="relay-key"><kbd>A</kbd><span>MOVE</span></span><span class="relay-key"><kbd>D</kbd><span>MOVE</span></span><span class="relay-key"><kbd>SPACE</kbd><span>JUMP</span></span><span class="relay-key"><kbd>E</kbd><span>FIRE</span></span><span class="relay-key"><kbd>Q</kbd><span>BLADE</span></span><span class="relay-key"><kbd>SHIFT</kbd><span>DASH</span></span><span class="relay-key"><kbd>F</kbd><span>FLIGHT</span></span><span class="relay-key"><kbd>ESC</kbd><span>PAUSE</span></span>
          </div>
        </section>
      </div></div></div>`;
  };

  const mount = (root, kind) => {
    if (!root) return false;
    injectStyles();
    root.classList.add('relay-options-unified');
    const host = kind === 'home' ? root.querySelector('#titlePanelContent') : root.querySelector('#panelContent');
    if (!host) return false;
    host.innerHTML = buildContent();
    host.classList.remove('relay-legacy-cleared');
    const controls = host.querySelector('[data-unified-controls-panel]');
    if (controls) controls.hidden = true;

    if (host.dataset.unifiedOptionsBound !== '1') {
      host.dataset.unifiedOptionsBound = '1';
      host.addEventListener('click', event => {
        const action = event.target.closest('[data-unified-toggle],[data-unified-range],[data-unified-language],[data-unified-language-code],[data-unified-fullscreen],[data-unified-reset],[data-unified-controls]');
        if (!action || !host.contains(action)) return;

        if (action.matches('[data-unified-toggle]')) {
          event.preventDefault();
          const key = action.dataset.unifiedToggle;
          if (['intelCards','allyIntel','eventPopups','tutorialHints'].includes(key)) {
            const prefs = readPresentation();
            prefs[key] = !prefs[key];
            writePresentation(prefs);
            syncPresentationClasses(prefs);
          } else {
            const current = getState();
            const value = key === 'muted' ? !current.muted : !(current[key] ?? false);
            savePatch({ [key]: value });
            if (key === 'aiVoice' && !value) window.speechSynthesis?.cancel?.();
            window.dispatchEvent(new CustomEvent('relay-settings-change', { detail:{ key, value } }));
          }
          renderOpenPanels();
          return;
        }

        if (action.matches('[data-unified-range]')) {
          const value = Number(action.value);
          if (!Number.isFinite(value)) return;
          savePatch({ [action.dataset.unifiedRange]: value });
          window.dispatchEvent(new CustomEvent('relay-settings-change', { detail:{ key:action.dataset.unifiedRange, value } }));
          const label = host.querySelector(`[data-range-value="${action.dataset.unifiedRange}"]`);
          if (label) label.textContent = `${Math.round(value * 100)}%`;
          return;
        }

        if (action.matches('[data-unified-language]')) {
          event.preventDefault();
          event.stopPropagation();
          host.querySelector('[data-unified-language-menu]')?.classList.toggle('hidden');
          return;
        }

        if (action.matches('[data-unified-language-code]')) {
          event.preventDefault();
          setLanguage(action.dataset.unifiedLanguageCode);
          renderOpenPanels();
          return;
        }

        if (action.matches('[data-unified-fullscreen]')) {
          event.preventDefault();
          (async()=>{ try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch {} })();
          return;
        }

        if (action.matches('[data-unified-reset]')) {
          event.preventDefault();
          savePatch({ muted:false,musicVolume:.55,sfxVolume:.7,screenShake:true,reducedMotion:false,rain:true,aiVoice:true,tutorialEnabled:true });
          writePresentation({ ...defaults });
          setLanguage('en');
          window.dispatchEvent(new CustomEvent('relay-settings-change',{detail:{reset:true}}));
          renderOpenPanels();
          return;
        }

        if (action.matches('[data-unified-controls]')) {
          event.preventDefault();
          const panel = host.querySelector('[data-unified-controls-panel]');
          if (panel) panel.hidden = !panel.hidden;
        }
      }, { capture:false });
    }
    return true;
  };

  const renderHome = () => {
    const panel = document.getElementById('titlePanel');
    if (!panel || panel.classList.contains('hidden')) return false;
    const heading = document.getElementById('titlePanelHeading');
    if (!heading) return false;
    if (!/OPTIONS|RUN SETTINGS/i.test(heading.textContent || '')) return false;
    return mount(panel, 'home');
  };

  const renderPause = () => {
    const pause = document.getElementById('pauseMenu');
    if (!pause || pause.classList.contains('hidden')) return false;
    const active = pause.querySelector('#panelContent');
    const settingsTab = pause.querySelector('[data-tab="settings"]');
    if (!active || !settingsTab?.classList.contains('active')) return false;
    return mount(pause, 'pause');
  };

  const renderOpenPanels = () => { renderHome(); renderPause(); syncPresentationClasses(readPresentation()); };

  const init = () => {
    injectStyles();
    syncPresentationClasses(readPresentation());
    document.addEventListener('click', event => {
      const homeButton = event.target.closest('[data-title-panel="controls"]');
      if (homeButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const panel = document.getElementById('titlePanel');
        const heading = document.getElementById('titlePanelHeading');
        panel?.classList.remove('hidden');
        if (heading) { heading.textContent = 'OPTIONS'; heading.className = 'relay-options-title'; }
        renderHome();
      }
      const pauseSettings = event.target.closest('#pauseMenu [data-tab="settings"]');
      if (pauseSettings) window.setTimeout(() => renderPause(), 0);
    }, true);
    document.addEventListener('click', event => {
      if (!event.target.closest('.relay-select')) document.querySelectorAll('.relay-language-menu').forEach(menu => menu.classList.add('hidden'));
    });
    const titlePanel = document.getElementById('titlePanel');
    const pauseMenu = document.getElementById('pauseMenu');
    if (titlePanel) new MutationObserver(() => window.setTimeout(renderHome, 0)).observe(titlePanel,{attributes:true,attributeFilter:['class']});
    if (pauseMenu) new MutationObserver(() => window.setTimeout(renderPause, 0)).observe(pauseMenu,{attributes:true,attributeFilter:['class']});
    window.addEventListener('relay-settings-change', () => window.setTimeout(renderOpenPanels, 0));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
