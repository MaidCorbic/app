(() => {
  if (window.__relayHomeOptionsEnhancements) return;
  window.__relayHomeOptionsEnhancements = true;

  const KEY = 'relay-runner-home-ui-options';
  const defaults = { uiScale: 1, highContrast: false, autoPause: true, vibration: true, showFps: false };
  const read = () => { try { return { ...defaults, ...(JSON.parse(localStorage.getItem(KEY) || '{}')) }; } catch { return { ...defaults }; } };
  const write = patch => { const next = { ...read(), ...patch }; localStorage.setItem(KEY, JSON.stringify(next)); apply(next); window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { ...patch, source: 'home-options-enhancements' } })); };

  const style = document.createElement('style');
  style.textContent = `
    #titlePanel .home-enhancements{display:grid;gap:7px;margin-top:4px;padding-top:10px;border-top:1px solid rgba(141,244,255,.10)}
    #titlePanel .home-enhancements-title{color:#5f7287;font:800 8px/1 'DM Mono',monospace;letter-spacing:1.2px;margin:2px 2px 1px}
    #titlePanel .home-enhance-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:9px 11px;border:1px solid rgba(210,226,240,.09);border-radius:8px;background:linear-gradient(145deg,rgba(12,25,43,.76),rgba(5,12,23,.92));min-width:0}
    #titlePanel .home-enhance-copy{min-width:0}.home-enhance-copy b{display:block;color:#e9f2f8;font:800 8px/1.15 'DM Mono',monospace;letter-spacing:.65px}.home-enhance-copy small{display:block;margin-top:3px;color:#68798c;font:700 6.5px/1.35 'DM Mono',monospace}
    #titlePanel .home-enhance-row button{min-width:78px;height:31px;border:1px solid rgba(210,226,240,.18);border-radius:7px;background:#07111ff2;color:#e9f2f8;font:800 8px 'DM Mono',monospace;cursor:pointer}.home-enhance-row button.is-on{color:#68e7be;border-color:rgba(104,231,190,.55)}
    #titlePanel .home-enhance-row input[type=range]{width:120px;accent-color:#ffd06e;touch-action:pan-x}
    #titlePanel .home-enhance-reset{height:34px;border:1px solid rgba(255,208,110,.18);border-radius:7px;background:rgba(255,208,110,.04);color:#ffd06e;font:800 8px 'DM Mono',monospace;cursor:pointer}
    #relay-fps-counter{position:fixed;right:10px;top:10px;z-index:99999;padding:4px 7px;border:1px solid rgba(141,244,255,.22);border-radius:5px;background:rgba(3,10,20,.82);color:#8df4ff;font:800 9px 'DM Mono',monospace;pointer-events:none;display:none}
    html[data-relay-contrast="high"] #titlePanel .title-panel-card,html[data-relay-contrast="high"] .relay-info-card{border-color:rgba(255,255,255,.42)!important;box-shadow:0 0 0 1px rgba(141,244,255,.16),0 20px 60px rgba(0,0,0,.7)!important}
    html[data-relay-contrast="high"] #titlePanel .home-opt,html[data-relay-contrast="high"] #titlePanel .home-enhance-row{border-color:rgba(255,255,255,.22)!important}
    @media(max-width:700px){#titlePanel .home-enhance-row{padding:8px 9px}.home-enhance-copy small{font-size:6px}#titlePanel .home-enhance-row input[type=range]{width:105px}}
  `;
  document.head.appendChild(style);

  function apply(s = read()) {
    document.documentElement.style.setProperty('--relay-ui-scale', String(s.uiScale));
    document.documentElement.dataset.relayContrast = s.highContrast ? 'high' : 'normal';
    document.documentElement.dataset.relayAutoPause = s.autoPause ? 'on' : 'off';
    document.documentElement.dataset.relayVibration = s.vibration ? 'on' : 'off';
  }

  let fpsEl;
  let fpsFrames = 0, fpsLast = performance.now();
  function fpsLoop(t) {
    fpsFrames++;
    if (t - fpsLast >= 500) { if (fpsEl) fpsEl.textContent = `${Math.round(fpsFrames * 1000 / (t - fpsLast))} FPS`; fpsFrames = 0; fpsLast = t; }
    requestAnimationFrame(fpsLoop);
  }
  function vibration(){ if (read().vibration && navigator.vibrate) navigator.vibrate(8); }
  function installFps(){
    if (!fpsEl) { fpsEl = document.createElement('div'); fpsEl.id = 'relay-fps-counter'; fpsEl.setAttribute('aria-hidden','true'); document.body.appendChild(fpsEl); requestAnimationFrame(fpsLoop); }
    fpsEl.style.display = read().showFps ? 'block' : 'none';
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && read().autoPause && !document.querySelector('#intro:not(.hidden)')) window.dispatchEvent(new CustomEvent('relay-auto-pause'));
  });

  function row(label, detail, key, type='toggle') {
    const s = read();
    if (type === 'range') return `<label class="home-enhance-row"><span class="home-enhance-copy"><b>${label}</b><small>${detail}</small></span><input type="range" min="0.9" max="1.1" step="0.05" value="${s[key]}" data-enhance-range="${key}" aria-label="${label}"></label>`;
    const on = !!s[key]; return `<div class="home-enhance-row"><span class="home-enhance-copy"><b>${label}</b><small>${detail}</small></span><button type="button" class="${on?'is-on':''}" data-enhance-toggle="${key}" aria-pressed="${on}">${on?'ON':'OFF'}</button></div>`;
  }
  function render(){
    const panel=document.getElementById('titlePanel'), content=document.getElementById('titlePanelContent'), heading=document.getElementById('titlePanelHeading');
    if(!panel||!content||panel.classList.contains('hidden')||heading?.textContent.trim().toUpperCase()!=='OPTIONS') return;
    if(content.querySelector('.home-enhancements')) return;
    const box=document.createElement('section'); box.className='home-enhancements';
    box.innerHTML=`<div class="home-enhancements-title">ADVANCED / QUALITY OF LIFE</div>${row('UI SCALE','Make the Home and menus easier to read.','uiScale','range')}${row('HIGH CONTRAST','Increase borders and text separation.','highContrast')}${row('AUTO-PAUSE','Pause gameplay when the tab is backgrounded.','autoPause')}${row('HAPTIC FEEDBACK','Use short vibration on supported mobile devices.','vibration')}${row('PERFORMANCE HUD','Show a small live FPS counter.','showFps')}<button type="button" class="home-enhance-reset" data-enhance-reset>RESET ADVANCED OPTIONS</button>`;
    content.appendChild(box);
    box.querySelectorAll('[data-enhance-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.enhanceToggle;write({[key]:!read()[key]});vibration();render();installFps();}));
    box.querySelectorAll('[data-enhance-range]').forEach(input=>input.addEventListener('input',()=>write({[input.dataset.enhanceRange]:Number(input.value)})));
    box.querySelector('[data-enhance-reset]')?.addEventListener('click',()=>{localStorage.setItem(KEY,JSON.stringify(defaults));apply(defaults);window.dispatchEvent(new CustomEvent('relay-settings-change',{detail:{resetAdvanced:true}}));render();installFps();vibration();});
  }
  apply();
  const observer = new MutationObserver(() => { render(); installFps(); });
  const boot = () => { const panel=document.getElementById('titlePanel'); if(panel) observer.observe(panel,{attributes:true,childList:true,subtree:true}); render(); installFps(); };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
