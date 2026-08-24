import './splash-loader.js';
import { loadState, saveState } from './src/state.js';

(() => {
  if (window.__relayHomeOptionsFinal) return;
  window.__relayHomeOptionsFinal = true;

  const LANGUAGES = [['en','ENGLISH'],['exyu','EX-YU'],['es','ESPAÑOL'],['de','DEUTSCH']];
  const LANGUAGE_KEY = 'relay-runner-language';
  const getState = () => loadState();
  const savePatch = patch => saveState({ ...getState(), ...patch });
  const getLanguage = () => localStorage.getItem(LANGUAGE_KEY) || 'en';
  const setLanguage = code => {
    localStorage.setItem(LANGUAGE_KEY, code);
    document.documentElement.lang = code === 'exyu' ? 'bs' : code;
    document.documentElement.dataset.language = code;
    window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { code } }));
  };

  const style = document.createElement('style');
  style.textContent = `
    /* HOME spacing: give MORE its own breathing room and keep its deck visually separate. */
    #homeV3Launch{margin-top:12px!important;margin-bottom:2px!important;min-height:40px!important;position:relative!important;z-index:2!important}
    #homeV3Deck{margin-top:8px!important;margin-bottom:5px!important}
    #homeV3Utility + #homeV3Launch{margin-top:12px!important}

    #titlePanel{box-sizing:border-box!important;padding:clamp(8px,2vw,24px)!important;overflow:hidden!important;background:rgba(1,5,12,.78)!important;backdrop-filter:blur(14px)!important}
    #titlePanel .title-panel-card{box-sizing:border-box!important;width:min(760px,92vw)!important;max-width:100%!important;max-height:calc(100dvh - 24px)!important;max-height:calc(100svh - 24px)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;padding:0!important;border:1px solid rgba(255,208,110,.24)!important;border-radius:16px!important;background:linear-gradient(145deg,#081523f7,#020811f9 72%)!important;box-shadow:0 30px 100px #000d,0 0 45px #ffd06e12!important}
    #titlePanel .title-panel-close{width:42px!important;height:42px!important;top:14px!important;right:14px!important;z-index:5!important;border:1px solid #65798d!important;border-radius:8px!important;background:#06111df2!important;color:#edf4f8!important;font-size:23px!important}
    #titlePanel .title-panel-close:hover{border-color:#ffd06e!important;color:#ffd06e!important}
    #titlePanelEyebrow{margin:0!important;padding:22px 24px 0!important;color:#7ed8ff!important;font:800 8px/1 'DM Mono',monospace!important;letter-spacing:2.2px!important;text-transform:uppercase!important}
    #titlePanelHeading{margin:6px 76px 0 24px!important;color:#f4f7fa!important;font:900 clamp(30px,7vw,48px)/.9 Manrope,sans-serif!important;letter-spacing:-.06em!important}
    #titlePanelHeading::after{content:' // COMMAND TERMINAL';color:#ffd06e;font:800 8px 'DM Mono',monospace;letter-spacing:1.6px;margin-left:8px;vertical-align:middle}
    #titlePanelContent{box-sizing:border-box!important;min-height:0!important;width:100%!important;max-height:calc(100dvh - 145px)!important;max-height:calc(100svh - 145px)!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important;padding:16px 24px 22px!important;scrollbar-width:none!important;-ms-overflow-style:none!important}
    #titlePanelContent::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}

    .home-options-final{display:grid;gap:10px;width:100%;box-sizing:border-box}
    .home-section{display:flex!important;align-items:center!important;gap:10px!important;margin:10px 2px 2px!important;color:#7c90a4!important;font:800 8px/1 'DM Mono',monospace!important;letter-spacing:1.7px!important}
    .home-section::after{content:'';height:1px;flex:1;background:linear-gradient(90deg,#40566a55,transparent)}
    .home-opt{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;min-width:0;box-sizing:border-box;padding:12px 13px;border:1px solid rgba(125,153,177,.16);border-radius:10px;background:linear-gradient(145deg,rgba(13,29,47,.92),rgba(4,11,20,.96));box-shadow:inset 0 1px rgba(255,255,255,.045),0 8px 24px rgba(0,0,0,.24);transition:border-color .16s,transform .16s,box-shadow .16s}
    .home-opt:focus-within,.home-opt:hover{border-color:#ffd06e44;box-shadow:inset 0 1px #ffffff0a,0 10px 28px #0007,0 0 20px #ffd06e0b;transform:translateY(-1px)}
    .home-opt-copy{min-width:0;overflow:hidden}.home-opt-copy b{display:block;color:#edf4f8;font:900 9px/1.15 'DM Mono',monospace;letter-spacing:.9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.home-opt-copy small{display:block;margin-top:4px;color:#778b9f;font:700 7px/1.45 'DM Mono',monospace;overflow-wrap:anywhere}
    .home-opt button{box-sizing:border-box;min-width:96px;height:36px;padding:0 12px;border:1px solid #61768a66;border-radius:8px;background:linear-gradient(180deg,#0b1a2a,#06101a);color:#dce7ee;font:900 8px 'DM Mono',monospace;letter-spacing:.8px;cursor:pointer;touch-action:manipulation;transition:.16s}
    .home-opt button.is-on{border-color:#68e7be88;color:#68e7be;background:linear-gradient(180deg,#0a211f,#061719)}
    .home-opt button:hover,.home-opt button:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none;box-shadow:0 0 18px #ffd06e14}
    .home-opt input[type=range]{width:clamp(150px,28vw,220px);max-width:100%;accent-color:#ffd06e;cursor:pointer;touch-action:pan-x}
    .home-range{grid-template-columns:1fr;gap:9px}.home-range .home-opt-copy{display:flex;align-items:end;justify-content:space-between;gap:12px}.home-range input{width:100%!important}
    .home-range-value{color:#ffd06e!important;font-variant-numeric:tabular-nums}
    .home-lang{position:relative}.home-lang-menu{position:absolute;right:0;top:calc(100% + 7px);z-index:50;width:190px;max-width:calc(100vw - 40px);padding:6px;border:1px solid #667c91;background:#07111ffb;border-radius:10px;box-shadow:0 18px 50px #000c}.home-lang-menu.hidden{display:none}.home-lang-menu button{display:block;width:100%;height:36px;border:0;border-radius:6px;background:transparent;color:#c9d5e0;text-align:left;padding:0 10px;font:900 8px 'DM Mono',monospace;cursor:pointer}.home-lang-menu button.active,.home-lang-menu button:hover{background:#ffd06e0d;color:#ffd06e}
    .home-options-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.home-options-actions button{height:40px;min-width:0;border:1px solid #5f748866;border-radius:8px;background:#07131ff2;color:#b9c7d3;font:900 8px 'DM Mono',monospace;letter-spacing:.8px;cursor:pointer}.home-options-actions button:hover{color:#ffd06e;border-color:#ffd06e}
    .home-controls{padding:13px!important;grid-template-columns:1fr!important}.home-controls small{display:block;color:#8295a8;font:800 7px/1.8 'DM Mono',monospace;overflow-wrap:anywhere}.home-controls b{color:#ffd06e}
    .home-option-hero{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:13px;border:1px solid #38bdf833;border-radius:11px;background:linear-gradient(135deg,#0a1b2b,#06101b);box-shadow:inset 0 1px #ffffff08,0 10px 28px #0005}.home-option-hero strong{display:block;color:#f4f7fa;font:900 12px 'Manrope',sans-serif}.home-option-hero small{display:block;margin-top:4px;color:#71869a;font:700 7px/1.5 'DM Mono',monospace}.home-option-hero .status{padding:7px 9px;border:1px solid #68e7be55;border-radius:99px;color:#68e7be;font:900 7px 'DM Mono',monospace;letter-spacing:1px}
    @media(max-width:700px){
      #homeV3Launch{margin-top:14px!important;margin-bottom:4px!important}
      #homeV3Deck{margin-top:7px!important;margin-bottom:8px!important}
      #titlePanel{padding:6px!important}
      #titlePanel .title-panel-card{width:min(94vw,430px)!important;max-height:calc(100dvh - 12px)!important;max-height:calc(100svh - 12px)!important;border-radius:14px!important}
      #titlePanelEyebrow{padding:17px 16px 0!important;font-size:7px!important}
      #titlePanelHeading{margin:6px 60px 0 16px!important;font-size:30px!important}
      #titlePanelHeading::after{display:block;margin:6px 0 0;font-size:7px}
      #titlePanelContent{max-height:calc(100dvh - 118px)!important;max-height:calc(100svh - 118px)!important;padding:13px 14px 18px!important}
      .home-options-final{gap:7px}.home-section{font-size:7px;margin-top:8px!important}.home-opt{gap:9px;padding:10px}.home-opt-copy b{font-size:8px}.home-opt-copy small{font-size:6.5px}.home-opt button{width:90px;min-width:90px;height:34px}.home-range{gap:6px}.home-range input{height:28px}.home-options-actions{gap:7px}.home-options-actions button{height:38px}.home-option-hero{padding:11px}.home-option-hero strong{font-size:11px}
    }
    @media(max-width:380px){#titlePanel .title-panel-card{width:96vw!important}.home-opt{padding:9px}.home-opt button{width:84px;min-width:84px}.home-opt-copy small{font-size:6px}#titlePanelContent{padding-left:11px!important;padding-right:11px!important}}
    @media(orientation:landscape) and (max-height:560px){#titlePanel .title-panel-card{max-height:calc(100dvh - 8px)!important;max-height:calc(100svh - 8px)!important}#titlePanelContent{max-height:calc(100dvh - 90px)!important;max-height:calc(100svh - 90px)!important;padding-top:8px!important}.home-options-final{gap:5px}.home-opt{padding:8px 9px}}
    @media(prefers-reduced-motion:reduce){.home-opt{transition:none!important;transform:none!important}}
  `;
  document.head.appendChild(style);

  const option = (label,key,on,detail) => `<div class="home-opt"><div class="home-opt-copy"><b>${label}</b><small>${detail}</small></div><button type="button" data-home-toggle="${key}" class="${on?'is-on':''}" aria-pressed="${on}">${on?'ON':'OFF'}</button></div>`;
  const range = (label,key,value,detail) => `<label class="home-opt home-range"><span class="home-opt-copy"><span><b>${label}</b><small>${detail}</small></span><strong class="home-range-value" data-volume-label="${key}">${Math.round((value??0)*100)}%</strong></span><input data-home-volume="${key}" type="range" min="0" max="1" step=".05" value="${value??0}"></label>`;

  function render(){
    const panel=document.getElementById('titlePanel');
    const content=document.getElementById('titlePanelContent');
    const heading=document.getElementById('titlePanelHeading');
    if(!panel||!content||!heading||panel.classList.contains('hidden'))return;
    const title=heading.textContent.trim().toUpperCase();
    if(!title.includes('RUN SETTINGS')&&title!=='OPTIONS')return;
    const s=getState();
    const lang=LANGUAGES.find(x=>x[0]===getLanguage())||LANGUAGES[0];
    const audioOn=!s.muted;
    content.innerHTML=`
      <div class="home-options-final">
        <div class="home-option-hero"><div><strong>RELAY CONFIGURATION</strong><small>YOUR SETTINGS ARE SAVED LOCALLY AND APPLY TO THE RUN.</small></div><span class="status">ONLINE</span></div>
        <div class="home-section">GAMEPLAY</div>
        ${option('TUTORIAL GUIDANCE','tutorialEnabled',s.tutorialEnabled!==false,'Mission guidance and contextual lessons')}
        ${option('SCREEN SHAKE','screenShake',!!s.screenShake,'Impact feedback during movement and combat')}
        ${option('ATMOSPHERIC RAIN','rain',!!s.rain,'City weather ambience on the title screen')}
        ${option('REDUCED MOTION','reducedMotion',!!s.reducedMotion,'Reduce interface and camera movement')}

        <div class="home-section">AUDIO</div>
        ${option('MASTER AUDIO','muted',audioOn,'Global game audio')}
        ${range('MUSIC VOLUME','musicVolume',s.musicVolume??.55,'Ambient music level')}
        ${range('SFX VOLUME','sfxVolume',s.sfxVolume??.7,'Interface and gameplay effects')}
        ${option('AI VOICE','aiVoice',s.aiVoice!==false,'NIA / MARA spoken game guidance')}

        <div class="home-section">PRESENTATION</div>
        <div class="home-opt home-lang"><div class="home-opt-copy"><b>GAME LANGUAGE</b><small>Interface language for the relay terminal</small></div><button type="button" data-home-language>🌐 ${lang[1]}</button><div class="home-lang-menu hidden" data-home-language-menu>${LANGUAGES.map(([code,name])=>`<button type="button" data-language="${code}" class="${code===lang[0]?'active':''}">${name}</button>`).join('')}</div></div>
        <div class="home-options-actions"><button type="button" data-home-fullscreen>FULLSCREEN</button><button type="button" data-home-reset>RESET OPTIONS</button></div>

        <div class="home-section">CONTROLS</div>
        <div class="home-opt home-controls"><small><b>MOVE</b> A / D &nbsp; · &nbsp; <b>JUMP</b> SPACE &nbsp; · &nbsp; <b>FIRE</b> E &nbsp; · &nbsp; <b>BLADE</b> Q &nbsp; · &nbsp; <b>DASH</b> SHIFT &nbsp; · &nbsp; <b>PAUSE</b> ESC</small></div>
      </div>`;

    content.querySelectorAll('[data-home-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
      const key=btn.dataset.homeToggle;
      const current=getState();
      const value=key==='muted'?!current.muted:!current[key];
      savePatch({[key]:value});
      if(key==='aiVoice'&&!value)window.speechSynthesis?.cancel?.();
      window.dispatchEvent(new CustomEvent('relay-settings-change',{detail:{key,value}}));
      render();
    }));

    content.querySelectorAll('[data-home-volume]').forEach(input=>input.addEventListener('input',()=>{
      const value=Number(input.value);
      savePatch({[input.dataset.homeVolume]:value});
      const label=content.querySelector(`[data-volume-label="${input.dataset.homeVolume}"]`);
      if(label)label.textContent=`${Math.round(value*100)}%`;
      window.dispatchEvent(new CustomEvent('relay-settings-change',{detail:{key:input.dataset.homeVolume,value}}));
    }));

    const langButton=content.querySelector('[data-home-language]');
    const langMenu=content.querySelector('[data-home-language-menu]');
    langButton?.addEventListener('click',e=>{e.stopPropagation();langMenu?.classList.toggle('hidden');});
    content.querySelectorAll('[data-language]').forEach(btn=>btn.addEventListener('click',()=>{setLanguage(btn.dataset.language);render();}));
    content.querySelector('[data-home-fullscreen]')?.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else await document.exitFullscreen?.();}catch{}});
    content.querySelector('[data-home-reset]')?.addEventListener('click',()=>{savePatch({muted:false,musicVolume:.55,sfxVolume:.7,screenShake:true,reducedMotion:false,rain:true,aiVoice:true,tutorialEnabled:true});localStorage.removeItem(LANGUAGE_KEY);setLanguage('en');window.dispatchEvent(new CustomEvent('relay-settings-change',{detail:{reset:true}}));render();});
  }

  const init=()=>{
    const panel=document.getElementById('titlePanel');
    if(!panel)return;
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('[data-title-panel="controls"]');
      if(!button)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      panel.classList.remove('hidden');
      const heading=document.getElementById('titlePanelHeading');
      if(heading)heading.textContent='OPTIONS';
      const eyebrow=document.getElementById('titlePanelEyebrow');
      if(eyebrow)eyebrow.textContent='COURIER TERMINAL // SYSTEM CONFIG';
      render();
    },true);
    new MutationObserver(()=>window.setTimeout(render,30)).observe(panel,{attributes:true,attributeFilter:['class']});
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
