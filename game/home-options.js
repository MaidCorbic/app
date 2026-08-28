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
    #titlePanel{box-sizing:border-box!important;padding:clamp(8px,2vw,24px)!important;overflow:hidden!important}
    #titlePanel .title-panel-card{box-sizing:border-box!important;width:min(760px,92vw)!important;max-width:100%!important;max-height:calc(100dvh - 24px)!important;max-height:calc(100svh - 24px)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;padding:clamp(18px,2.4vw,28px)!important}
    #titlePanelContent{box-sizing:border-box!important;min-height:0!important;width:100%!important;max-height:calc(100dvh - 175px)!important;max-height:calc(100svh - 175px)!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;touch-action:pan-y!important;padding:0 4px 6px 0!important;scrollbar-width:none!important;-ms-overflow-style:none!important}
    #titlePanelContent::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}
    .home-options-final{display:grid;gap:8px;width:100%;box-sizing:border-box}.home-section{margin:4px 2px 0;color:#5f7287;font:800 8px/1 'DM Mono',monospace;letter-spacing:1.2px}.home-opt{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;min-width:0;box-sizing:border-box;padding:10px 12px;border:1px solid rgba(210,226,240,.10);border-radius:8px;background:linear-gradient(145deg,rgba(12,25,43,.86),rgba(5,12,23,.94));box-shadow:inset 0 1px rgba(255,255,255,.035),0 6px 18px rgba(0,0,0,.20)}.home-opt-copy{min-width:0;overflow:hidden}.home-opt-copy b{display:block;color:#e9f2f8;font:800 9px/1.15 'DM Mono',monospace;letter-spacing:.7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.home-opt-copy small{display:block;margin-top:3px;color:#68798c;font:700 7px/1.35 'DM Mono',monospace;overflow-wrap:anywhere}.home-opt button{box-sizing:border-box;min-width:92px;height:34px;padding:0 10px;border:1px solid rgba(210,226,240,.18);border-radius:7px;background:#07111ff2;color:#e9f2f8;font:800 8px 'DM Mono',monospace;letter-spacing:.6px;cursor:pointer;touch-action:manipulation}.home-opt button.is-on{border-color:rgba(104,231,190,.55);color:#68e7be}.home-opt button:hover,.home-opt button:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none}.home-opt input[type=range]{width:clamp(120px,24vw,190px);max-width:100%;accent-color:#ffd06e;cursor:pointer;touch-action:pan-x}.home-lang{position:relative}.home-lang-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:50;width:170px;max-width:calc(100vw - 32px);padding:5px;border:1px solid rgba(210,226,240,.18);border-radius:8px;background:#07111ff8;box-shadow:0 14px 40px #000b}.home-lang-menu.hidden{display:none}.home-lang-menu button{display:block;width:100%;height:34px;border:0;background:transparent;color:#c9d5e0;text-align:left;font:800 8px 'DM Mono',monospace;cursor:pointer}.home-lang-menu button.active,.home-lang-menu button:hover{background:rgba(255,208,110,.08);color:#ffd06e}.home-options-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.home-options-actions button{height:36px;min-width:0;border:1px solid rgba(210,226,240,.15);border-radius:7px;background:#07111ff2;color:#aebdcc;font:800 8px 'DM Mono',monospace;letter-spacing:.6px;cursor:pointer}.home-options-actions button:hover{color:#ffd06e;border-color:#ffd06e}.home-controls{padding:10px 12px}.home-controls small{display:block;color:#68798c;font:700 7px/1.6 'DM Mono',monospace;overflow-wrap:anywhere}
    @media(max-width:700px){#titlePanel{padding:6px!important}#titlePanel .title-panel-card{width:min(94vw,430px)!important;max-height:calc(100dvh - 12px)!important;max-height:calc(100svh - 12px)!important;padding:13px!important;border-radius:12px!important}#titlePanelContent{max-height:calc(100dvh - 100px)!important;max-height:calc(100svh - 100px)!important;padding-right:2px!important}.home-options-final{gap:6px}.home-section{font-size:7px}.home-opt{grid-template-columns:minmax(0,1fr) 88px;gap:8px;padding:9px 10px}.home-opt-copy b{font-size:8px}.home-opt-copy small{font-size:6.5px}.home-opt button{width:88px;min-width:88px;height:32px}.home-opt input[type=range]{width:100%;height:28px;grid-column:1 / -1}.home-options-actions{gap:6px}.home-options-actions button{height:34px}.home-lang-menu{left:0;right:0;width:auto;max-height:190px;overflow:auto}}
    @media(max-width:380px){#titlePanel .title-panel-card{width:96vw!important;padding:10px!important}#titlePanelContent{max-height:calc(100dvh - 84px)!important;max-height:calc(100svh - 84px)!important}.home-opt{grid-template-columns:minmax(0,1fr) 82px;padding:8px}.home-opt button{width:82px;min-width:82px}.home-opt-copy small{font-size:6px}}
    @media(orientation:landscape) and (max-height:560px){#titlePanel .title-panel-card{max-height:calc(100dvh - 8px)!important;max-height:calc(100svh - 8px)!important;padding:10px!important}#titlePanelContent{max-height:calc(100dvh - 72px)!important;max-height:calc(100svh - 72px)!important}.home-options-final{gap:5px}.home-opt{padding:7px 9px}}
  `;
  document.head.appendChild(style);
  const option = (label,key,on,detail) => `<div class="home-opt"><div class="home-opt-copy"><b>${label}</b><small>${detail}</small></div><button type="button" data-home-toggle="${key}" class="${on?'is-on':''}" aria-pressed="${on}">${on?'ON':'OFF'}</button></div>`;
  function render(){
    const panel=document.getElementById('titlePanel'); const content=document.getElementById('titlePanelContent'); const heading=document.getElementById('titlePanelHeading');
    if(!panel||!content||!heading||panel.classList.contains('hidden'))return;
    const title=heading.textContent.trim().toUpperCase(); if(!title.includes('RUN SETTINGS')&&title!=='OPTIONS')return;
    const s=getState(); const lang=LANGUAGES.find(x=>x[0]===getLanguage())||LANGUAGES[0];
    content.innerHTML=`<div class="home-options-final"><div class="home-section">GAMEPLAY / GUIDANCE</div>${option('TUTORIAL','tutorialEnabled',s.tutorialEnabled!==false,'Mission guidance and contextual lessons')}${option('GAME AUDIO','muted',!s.muted,'Master game audio')}${option('SCREEN SHAKE','screenShake',!!s.screenShake,'Camera impact feedback')}${option('REDUCED MOTION','reducedMotion',!!s.reducedMotion,'Reduce presentation motion')}${option('ATMOSPHERIC RAIN','rain',!!s.rain,'City weather ambience')}<div class="home-section">VOICE & AUDIO</div>${option('AI VOICE','aiVoice',s.aiVoice!==false,'NIA / MARA spoken guidance')}<label class="home-opt"><span class="home-opt-copy"><b>MUSIC</b><small><span data-volume-label="musicVolume">${Math.round((s.musicVolume??.55)*100)}%</span> VOLUME</small></span><input data-home-volume="musicVolume" type="range" min="0" max="1" step=".05" value="${s.musicVolume??.55}"></label><label class="home-opt"><span class="home-opt-copy"><b>SFX</b><small><span data-volume-label="sfxVolume">${Math.round((s.sfxVolume??.7)*100)}%</span> VOLUME</small></span><input data-home-volume="sfxVolume" type="range" min="0" max="1" step=".05" value="${s.sfxVolume??.7}"></label><div class="home-section">LANGUAGE</div><div class="home-opt home-lang"><div class="home-opt-copy"><b>GAME LANGUAGE</b><small>Choose your interface language</small></div><button type="button" data-home-language>🌐 ${lang[1]}</button><div class="home-lang-menu hidden" data-home-language-menu>${LANGUAGES.map(([code,name])=>`<button type="button" data-language="${code}" class="${code===lang[0]?'active':''}">${name}</button>`).join('')}</div></div><div class="home-section">DISPLAY</div><div class="home-options-actions"><button type="button" data-home-fullscreen>FULLSCREEN</button><button type="button" data-home-reset>RESET OPTIONS</button></div><div class="home-section">CONTROLS</div><div class="home-opt home-controls"><small>A / D MOVE · SPACE JUMP · E FIRE · Q BLADE · SHIFT DASH · ESC PAUSE</small></div></div>`;
    content.querySelectorAll('[data-home-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.homeToggle;const current=getState();const value=key==='muted'?!current.muted:!current[key];savePatch({[key]:value});if(key==='aiVoice'&&!value)window.speechSynthesis?.cancel?.();window.dispatchEvent(new CustomEvent('relay-settings-change',{detail:{key,value}}));render();}));
    content.querySelectorAll('[data-home-volume]').forEach(input=>input.addEventListener('input',()=>{const value=Number(input.value);savePatch({[input.dataset.homeVolume]:value});const label=content.querySelector(`[data-volume-label="${input.dataset.homeVolume}"]`);if(label)label.textContent=`${Math.round(value*100)}%`;}));
    const langButton=content.querySelector('[data-home-language]'); const langMenu=content.querySelector('[data-home-language-menu]'); langButton?.addEventListener('click',e=>{e.stopPropagation();langMenu?.classList.toggle('hidden');}); content.querySelectorAll('[data-language]').forEach(btn=>btn.addEventListener('click',()=>{setLanguage(btn.dataset.language);render();}));
    content.querySelector('[data-home-fullscreen]')?.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else await document.exitFullscreen?.();}catch{}});
    content.querySelector('[data-home-reset]')?.addEventListener('click',()=>{savePatch({muted:false,musicVolume:.55,sfxVolume:.7,screenShake:true,reducedMotion:false,rain:true,aiVoice:true,tutorialEnabled:true});localStorage.removeItem(LANGUAGE_KEY);setLanguage('en');window.dispatchEvent(new CustomEvent('relay-settings-change',{detail:{reset:true}}));render();});
  }
  const init=()=>{
    const panel=document.getElementById('titlePanel'); if(!panel)return;
    document.addEventListener('click',event=>{const button=event.target.closest?.('[data-title-panel="controls"]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();panel.classList.remove('hidden');const heading=document.getElementById('titlePanelHeading');if(heading)heading.textContent='OPTIONS';render();},true);
    new MutationObserver(()=>window.setTimeout(render,30)).observe(panel,{attributes:true,attributeFilter:['class']});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* Mobile options: reliable touch scrolling + a draggable animated "zipper" scrollbar. */
(() => {
  if (window.__relayHomeOptionsScrollerV1) return;
  window.__relayHomeOptionsScrollerV1 = true;

  const css = document.createElement('style');
  css.textContent = `
    #titlePanel .title-panel-card{position:relative!important}
    #titlePanelContent{scroll-behavior:smooth!important;overscroll-behavior-y:contain!important;touch-action:pan-y!important}
    #titlePanelContent.home-drag-scroll{cursor:grabbing!important;scroll-behavior:auto!important}
    #homeOptionsScrollbar{position:absolute;z-index:80;right:5px;width:8px;display:none;pointer-events:auto;touch-action:none}
    #homeOptionsScrollbar.is-visible{display:block}
    #homeOptionsScrollbar .home-scroll-track{position:absolute;inset:0;border:1px solid rgba(141,244,255,.12);border-radius:99px;background:linear-gradient(180deg,rgba(8,24,40,.9),rgba(2,9,17,.92));box-shadow:inset 0 0 8px rgba(0,0,0,.45),0 0 12px rgba(56,189,248,.06)}
    #homeOptionsScrollbar .home-scroll-thumb{position:absolute;left:1px;right:1px;top:0;min-height:54px;border:1px solid rgba(141,244,255,.72);border-radius:99px;background:linear-gradient(180deg,rgba(141,244,255,.95),rgba(62,180,220,.68));box-shadow:0 0 10px rgba(141,244,255,.45),0 0 24px rgba(56,189,248,.18),inset 0 1px rgba(255,255,255,.7);cursor:grab;transition:box-shadow .16s ease,filter .16s ease,transform .16s ease}
    #homeOptionsScrollbar .home-scroll-thumb::before{content:"";position:absolute;left:2px;right:2px;top:50%;height:1px;transform:translateY(-50%);background:rgba(255,255,255,.8);box-shadow:0 -5px rgba(255,255,255,.22),0 5px rgba(255,255,255,.22)}
    #homeOptionsScrollbar .home-scroll-thumb::after{content:"";position:absolute;inset:-5px -4px;border-radius:99px;border:1px solid rgba(141,244,255,.0);animation:homeScrollPulse 1.8s ease-in-out infinite}
    #homeOptionsScrollbar .home-scroll-thumb:hover,#homeOptionsScrollbar .home-scroll-thumb.is-dragging{filter:brightness(1.18);box-shadow:0 0 14px rgba(141,244,255,.7),0 0 30px rgba(56,189,248,.25),inset 0 1px rgba(255,255,255,.9);transform:scaleX(1.12);cursor:grabbing}
    #homeOptionsScrollbar .home-scroll-track::after{content:"";position:absolute;left:50%;top:4px;bottom:4px;width:1px;transform:translateX(-50%);background:linear-gradient(180deg,transparent,rgba(141,244,255,.18),transparent)}
    @keyframes homeScrollPulse{0%,100%{opacity:.15;transform:scale(.9)}50%{opacity:.8;transform:scale(1.08)}}
    @media(max-width:700px){#homeOptionsScrollbar{right:3px;width:9px}.home-options-final{padding-right:4px!important}.home-opt{min-height:58px!important;border-radius:14px!important;background:linear-gradient(145deg,rgba(10,27,45,.94),rgba(3,11,21,.98))!important;box-shadow:inset 0 1px rgba(255,255,255,.045),0 8px 22px rgba(0,0,0,.24),0 0 18px rgba(56,189,248,.035)!important}.home-opt:active{border-color:rgba(141,244,255,.36)!important}.home-section{margin-top:9px!important;padding-left:3px}.home-opt-copy b{letter-spacing:.8px!important}.home-opt-copy small{line-height:1.45!important}.home-opt button{border-radius:999px!important;background:linear-gradient(145deg,rgba(8,22,37,.98),rgba(2,10,18,.99))!important;box-shadow:inset 0 1px rgba(255,255,255,.06),0 0 16px rgba(141,244,255,.06)!important}.home-opt button.is-on{box-shadow:0 0 16px rgba(104,231,190,.11),inset 0 1px rgba(255,255,255,.06)!important}}
    @media(max-width:380px){#homeOptionsScrollbar{right:2px;width:8px}.home-opt{min-height:54px!important}.home-opt-copy b{font-size:7.8px!important}}
    @media(prefers-reduced-motion:reduce){#homeOptionsScrollbar .home-scroll-thumb::after{animation:none!important}}
  `;
  document.head.appendChild(css);

  let panel, content, card, bar, thumb, track;
  let dragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;
  let hideTimer = 0;

  const ensureBar = () => {
    panel = document.getElementById('titlePanel');
    content = document.getElementById('titlePanelContent');
    card = panel?.querySelector('.title-panel-card');
    if (!panel || !content || !card) return false;
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'homeOptionsScrollbar';
      track = document.createElement('div');
      track.className = 'home-scroll-track';
      thumb = document.createElement('div');
      thumb.className = 'home-scroll-thumb';
      thumb.setAttribute('role','scrollbar');
      thumb.setAttribute('aria-label','Options scroll position');
      thumb.setAttribute('aria-orientation','vertical');
      bar.append(track, thumb);
      card.appendChild(bar);

      thumb.addEventListener('pointerdown', startThumbDrag, { passive:false });
      track.addEventListener('pointerdown', event => {
        if (event.target === thumb) return;
        const rect = track.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        setScrollRatio(ratio, true);
        startThumbDrag(event);
      }, { passive:false });
      content.addEventListener('scroll', sync, { passive:true });
      content.addEventListener('pointerdown', startContentDrag, { passive:false });
      content.addEventListener('wheel', () => { showBar(); }, { passive:true });
    }
    syncLayout();
    return true;
  };

  const showBar = () => {
    if (!bar) return;
    bar.classList.add('is-visible');
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      if (!dragging) bar.classList.remove('is-visible');
    }, 1800);
  };

  const syncLayout = () => {
    if (!ensureBar()) return;
    const c = content.getBoundingClientRect();
    const k = card.getBoundingClientRect();
    const top = Math.max(4, c.top - k.top);
    const height = Math.max(42, c.height);
    bar.style.top = `${top}px`;
    bar.style.height = `${height}px`;
    sync();
  };

  const sync = () => {
    if (!content || !thumb || !bar) return;
    const max = Math.max(0, content.scrollHeight - content.clientHeight);
    const visible = max > 2 && content.clientHeight > 20;
    bar.classList.toggle('is-visible', visible || dragging);
    if (!visible) return;
    const ratio = max ? content.scrollTop / max : 0;
    const trackHeight = bar.clientHeight;
    const thumbHeight = Math.max(54, Math.min(trackHeight * 0.34, trackHeight * (content.clientHeight / content.scrollHeight)));
    const travel = Math.max(0, trackHeight - thumbHeight);
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = dragging ? 'scaleX(1.12)' : '';
    thumb.style.top = `${travel * ratio}px`;
    thumb.setAttribute('aria-valuemin','0');
    thumb.setAttribute('aria-valuemax','100');
    thumb.setAttribute('aria-valuenow',String(Math.round(ratio * 100)));
  };

  const setScrollRatio = (ratio, smooth = false) => {
    if (!content) return;
    const max = Math.max(0, content.scrollHeight - content.clientHeight);
    content.scrollTo({ top: Math.max(0, Math.min(max, ratio * max)), behavior: smooth ? 'smooth' : 'auto' });
    showBar();
  };

  const startThumbDrag = event => {
    if (!content || !thumb) return;
    event.preventDefault();
    event.stopPropagation();
    dragging = true;
    dragStartY = event.clientY;
    dragStartScroll = content.scrollTop;
    thumb.classList.add('is-dragging');
    content.classList.add('home-drag-scroll');
    showBar();
    thumb.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', moveThumbDrag, { passive:false });
    window.addEventListener('pointerup', endDrag, { once:true });
    window.addEventListener('pointercancel', endDrag, { once:true });
  };

  const moveThumbDrag = event => {
    if (!dragging || !content || !bar || !thumb) return;
    event.preventDefault();
    const trackHeight = bar.clientHeight;
    const thumbHeight = thumb.offsetHeight;
    const travel = Math.max(1, trackHeight - thumbHeight);
    const max = Math.max(0, content.scrollHeight - content.clientHeight);
    const ratioDelta = (event.clientY - dragStartY) / travel;
    content.scrollTop = Math.max(0, Math.min(max, dragStartScroll + ratioDelta * max));
    sync();
  };

  const endDrag = () => {
    dragging = false;
    thumb?.classList.remove('is-dragging');
    content?.classList.remove('home-drag-scroll');
    showBar();
  };

  const startContentDrag = event => {
    if (!content || event.pointerType === 'mouse') return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('button,input,select,label,a,[role="button"]')) return;
    const max = content.scrollHeight - content.clientHeight;
    if (max <= 2) return;
    const startY = event.clientY;
    const startScroll = content.scrollTop;
    let moved = false;
    const move = e => {
      const delta = startY - e.clientY;
      if (!moved && Math.abs(delta) < 4) return;
      moved = true;
      content.scrollTop = Math.max(0, Math.min(max, startScroll + delta));
      showBar();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move, { passive:false });
    window.addEventListener('pointerup', up, { once:true });
    window.addEventListener('pointercancel', up, { once:true });
    showBar();
  };

  const refresh = () => window.requestAnimationFrame(syncLayout);
  window.addEventListener('resize', refresh, { passive:true });
  window.addEventListener('orientationchange', () => window.setTimeout(refresh, 120), { passive:true });

  const init = () => {
    ensureBar();
    const panelNode = document.getElementById('titlePanel');
    if (!panelNode) return;
    new MutationObserver(() => window.setTimeout(() => { ensureBar(); refresh(); }, 20)).observe(panelNode, { attributes:true, attributeFilter:['class'] });
    const contentObserver = new MutationObserver(refresh);
    const contentNode = document.getElementById('titlePanelContent');
    if (contentNode) contentObserver.observe(contentNode, { childList:true, subtree:true, attributes:true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
