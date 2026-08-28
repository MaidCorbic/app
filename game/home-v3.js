/* Home V3: replaces the legacy Home presentation without replacing gameplay systems. */
(() => {
  if (window.__relayHomeV3) return;
  window.__relayHomeV3 = true;
  const $ = id => document.getElementById(id);
  const click = id => $(id)?.click();
  const homeVisible = () => !!$('intro') && !$('intro').classList.contains('hidden');
  const injectStyles = () => {
    if (document.getElementById('home-v3-interaction-style')) return;
    const style = document.createElement('style');
    style.id = 'home-v3-interaction-style';
    style.textContent = `.home-v3-play{position:relative;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}.home-v3-play .home-v3-play-fill{position:absolute;inset:0 auto 0 0;width:0;background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,208,110,.28));pointer-events:none}.home-v3-play .home-v3-play-label{position:relative;z-index:2;pointer-events:none}.home-v3-play .home-v3-play-knob{position:absolute;left:7px;top:50%;z-index:3;width:42px;height:42px;margin-top:-21px;border:1px solid rgba(255,255,255,.55);border-radius:12px;background:linear-gradient(145deg,#fff3c7,#ffd06e);color:#08111b;display:grid;place-items:center;font:900 15px/1 ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 0 22px rgba(255,208,110,.35),inset 0 1px rgba(255,255,255,.8);transform:translateX(0);transition:transform .08s linear,box-shadow .16s ease}.home-v3-play .home-v3-play-hint{position:absolute;right:18px;top:50%;z-index:2;transform:translateY(-50%);color:rgba(255,248,226,.68);font:800 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;pointer-events:none}.home-v3-play.is-dragging .home-v3-play-knob{box-shadow:0 0 32px rgba(255,208,110,.7),inset 0 1px rgba(255,255,255,.9)}.home-v3-play.is-armed .home-v3-play-fill{width:100%!important}.home-v3-play.is-armed .home-v3-play-hint{opacity:0}.home-v3-play.is-locked{pointer-events:none;opacity:.72}.home-v3-play:focus-visible{outline:2px solid rgba(255,208,110,.9);outline-offset:3px}.home-v3-shell [data-v3-tutorial],#intro [data-title-panel="tutorial"],#intro .home-tutorial-button{display:none!important}#titlePanelContent [data-unified-toggle="tutorialEnabled"]{display:none!important}#titlePanelContent .relay-option-card:has([data-unified-toggle="tutorialEnabled"]){display:none!important}@media(max-width:700px){.home-v3-play{min-height:64px}.home-v3-play .home-v3-play-knob{left:6px;width:40px;height:40px;margin-top:-20px;border-radius:11px}.home-v3-play .home-v3-play-hint{right:13px;font-size:7px;letter-spacing:.11em}}@media(prefers-reduced-motion:reduce){.home-v3-play .home-v3-play-knob{transition:none}}`;
    document.head.appendChild(style);
  };
  const syncSurface = () => {
    document.body.classList.toggle('home-v3-active', homeVisible());
    const intro = $('intro');
    if (intro) intro.classList.toggle('home-v3', homeVisible());
  };
  const removeTutorialSurface = () => {
    document.querySelectorAll('#intro [data-title-panel="tutorial"],#intro .home-tutorial-button,#intro [data-v3-tutorial]').forEach(node => node.remove());
    document.querySelectorAll('#titlePanelContent [data-unified-toggle="tutorialEnabled"]').forEach(node => node.closest('.relay-option-card')?.remove());
  };
  const installSwipePlay = button => {
    if (!button || button.dataset.swipeReady === '1') return;
    button.dataset.swipeReady = '1';
    button.setAttribute('aria-label','Swipe to start the game');
    button.innerHTML = '<span class="home-v3-play-fill" aria-hidden="true"></span><span class="home-v3-play-label">PLAY NOW</span><span class="home-v3-play-hint">SWIPE TO DEPLOY →</span><span class="home-v3-play-knob" aria-hidden="true">→</span>';
    let pointerId = null, startX = 0, current = 0, completed = false;
    const reset = () => { if (completed) return; current = 0; pointerId = null; button.classList.remove('is-dragging'); const knob = button.querySelector('.home-v3-play-knob'); if (knob) knob.style.transform='translateX(0)'; const fill=button.querySelector('.home-v3-play-fill'); if(fill) fill.style.width='0%'; };
    const complete = () => { if(completed) return; completed=true; pointerId=null; button.classList.remove('is-dragging'); button.classList.add('is-armed','is-locked'); const fill=button.querySelector('.home-v3-play-fill'); const knob=button.querySelector('.home-v3-play-knob'); if(fill) fill.style.width='100%'; if(knob) knob.style.transform='translateX(calc(100% - 56px))'; window.setTimeout(()=>click('start'),180); };
    button.addEventListener('pointerdown', event => { if(completed)return; pointerId=event.pointerId; startX=event.clientX; button.setPointerCapture?.(pointerId); button.classList.add('is-dragging'); event.preventDefault(); });
    button.addEventListener('pointermove', event => { if(event.pointerId!==pointerId||completed)return; const rect=button.getBoundingClientRect(); const knob=button.querySelector('.home-v3-play-knob'); const max=Math.max(1,rect.width-(knob?.getBoundingClientRect().width||42)-14); current=Math.max(0,Math.min(max,event.clientX-startX)); const percent=current/max; if(knob) knob.style.transform=`translateX(${current}px)`; const fill=button.querySelector('.home-v3-play-fill'); if(fill) fill.style.width=`${percent*100}%`; if(percent>=.82) complete(); event.preventDefault(); },{passive:false});
    button.addEventListener('pointerup', event => { if(event.pointerId!==pointerId||completed)return; button.releasePointerCapture?.(event.pointerId); reset(); event.preventDefault(); });
    button.addEventListener('pointercancel',reset);
    button.addEventListener('click',event=>{if(!completed)event.preventDefault();});
  };
  const build = () => {
    const intro=$('intro'); if(!intro||intro.dataset.homeV3Built==='1')return;
    intro.dataset.homeV3Built='1'; intro.classList.add('home-v3');
    const legacyMenu=intro.querySelector('.main-menu'), launcher=intro.querySelector('.info-launcher');
    const bg=document.createElement('div'); bg.className='home-v3-bg'; bg.setAttribute('aria-hidden','true'); bg.innerHTML='<i class="home-v3-grid"></i><i class="home-v3-glow"></i><i class="home-v3-scan"></i>';
    const shell=document.createElement('div'); shell.className='home-v3-shell'; shell.innerHTML=`<header class="home-v3-header"><div class="home-v3-brand"><span class="home-v3-mark">R/</span><span>RELAY RUNNER</span></div><div class="home-v3-status"><b>● SYSTEM READY</b><br>NIGHT SHIFT · ONLINE</div></header><main class="home-v3-main"><section><p class="home-v3-kicker">ROOFTOP DELIVERY NETWORK · CHAPTER 01</p><h1 class="home-v3-title">RELAY<em>RUNNER</em></h1><p class="home-v3-copy">Run the sleeping city. Carry the signal farther than anyone else can. Build your route, master the night and keep the line open.</p><div class="home-v3-actions"><button class="home-v3-play" type="button" data-v3-play></button><button class="home-v3-continue" type="button" data-v3-continue hidden>CONTINUE</button></div></section><nav class="home-v3-side" aria-label="Main menu"><button class="home-v3-card" type="button" data-v3-options><span>OPTIONS</span><small>SETTINGS · AUDIO · DISPLAY</small></button><button class="home-v3-card" type="button" data-v3-faq><span>FAQ</span><small>HELP · GAME SYSTEMS</small></button><button class="home-v3-card" type="button" data-v3-exit><span>EXIT</span><small>CLOSE SESSION</small></button></nav></main><footer class="home-v3-footer"><span>RELAY RUNNER · <b>VERSION 1.1.0</b></span><span>A / D MOVE · SPACE JUMP · ESC PAUSE</span></footer>`;
    intro.replaceChildren(bg,shell,legacyMenu,launcher);
    installSwipePlay(shell.querySelector('[data-v3-play]'));
    shell.querySelector('[data-v3-continue]')?.addEventListener('click',e=>{e.preventDefault();click('continue');});
    shell.querySelector('[data-v3-options]')?.addEventListener('click',e=>{e.preventDefault();document.querySelector('[data-title-panel="controls"]')?.click();});
    shell.querySelector('[data-v3-faq]')?.addEventListener('click',e=>{e.preventDefault();document.querySelector('[data-relay-info="faq"]')?.click();});
    shell.querySelector('[data-v3-exit]')?.addEventListener('click',e=>{e.preventDefault();click('exitTitle');});
    const syncContinue=()=>{const legacy=$('continue'),button=shell.querySelector('[data-v3-continue]');if(!legacy||!button)return;button.hidden=legacy.classList.contains('hidden')||getComputedStyle(legacy).display==='none';};
    syncContinue(); if($('continue'))new MutationObserver(syncContinue).observe($('continue'),{attributes:true,attributeFilter:['class','style','hidden']});
  };
  const start=()=>{injectStyles();build();removeTutorialSurface();syncSurface();const observer=new MutationObserver(()=>{syncSurface();removeTutorialSurface();});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
