/* Final gameplay presentation/runtime compatibility layer. */
(() => {
  'use strict';
  if (window.__relayGameplayRuntimeStabilityV3) return;
  window.__relayGameplayRuntimeStabilityV3 = true;

  const q = s => document.querySelector(s);
  const visible = n => !!n && !n.classList.contains('hidden') && !n.hidden && getComputedStyle(n).display !== 'none';
  const gameplay = () => visible(q('#play')) && !visible(q('#intro'));

  const style = document.createElement('style');
  style.id = 'relay-runtime-stability-v3-style';
  style.textContent = `
    #intro .info-launcher{display:none!important;visibility:hidden!important;pointer-events:none!important}
    #intro .home-v3-side{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:relative!important;z-index:90!important}
    #intro .home-v3-side .relay-runtime-home-btn{display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:relative!important;z-index:91!important;min-height:58px!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;padding:14px 16px!important;border:1px solid rgba(255,208,110,.25)!important;border-left:2px solid rgba(255,208,110,.78)!important;border-radius:10px!important;background:linear-gradient(145deg,rgba(7,10,15,.97),rgba(2,3,5,.99))!important;color:#f4f7fa!important;font:900 11px/1 'DM Mono',ui-monospace,monospace!important;letter-spacing:1.25px!important;text-align:left!important;cursor:pointer!important;touch-action:manipulation!important}
    #intro .home-v3-side .relay-runtime-home-btn small{margin:0!important;color:#87939f!important;font:750 7px/1.25 'DM Mono',ui-monospace,monospace!important;letter-spacing:.85px!important;text-align:right!important}
    #intro .home-v3-side .relay-runtime-home-btn:hover,#intro .home-v3-side .relay-runtime-home-btn:focus-visible{transform:translateX(3px)!important;border-color:rgba(255,208,110,.64)!important;outline:none!important}

    #game .world-marker{position:absolute!important;left:50%!important;right:auto!important;top:78px!important;bottom:auto!important;transform:translateX(-50%)!important;width:min(290px,calc(100vw - 28px))!important;min-height:46px!important;padding:8px 12px!important;box-sizing:border-box!important;border:1px solid rgba(255,208,110,.24)!important;border-left:2px solid #ffd06e!important;border-radius:10px!important;background:linear-gradient(145deg,rgba(7,10,15,.97),rgba(2,3,5,.98))!important;box-shadow:0 14px 30px rgba(0,0,0,.26),0 0 25px rgba(255,208,110,.05)!important;z-index:125!important;text-align:center!important;pointer-events:none!important}
    #game .world-marker span{display:block!important;color:#ffd06e!important;font:900 7px/1 'DM Mono',monospace!important;letter-spacing:1.65px!important;text-transform:uppercase!important}
    #game .world-marker b{display:block!important;margin-top:5px!important;color:#f4f7fa!important;font:950 10px/1.15 'DM Mono',monospace!important;letter-spacing:.5px!important;text-transform:uppercase!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    #game .world-marker.is-runtime-typing b{border-right:1px solid #ffd06e!important;animation:relayRuntimeCaret .7s steps(1,end) infinite!important;padding-right:2px!important}
    @keyframes relayRuntimeCaret{0%,49%{border-color:#ffd06e}50%,100%{border-color:transparent}}

    #play .relay-gameplay-intel,#play .gameplay-intel-v9,#play [data-relay-mission-intel],#play .live-mission-intel,#play .mission-intelligence-overlay,#play [data-dynamic-crowd],#play [data-debug-hud],#play [data-relay-debug-hud],#play .relay-debug-hud,#play .gameplay-debug-hud,#play [class*="dynamic-crowd"],#play [id*="dynamic-crowd"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    #play .legacy-bottom-hud,#play .hud-bottom,#play .gameplay-bottom-hud,#play [data-bottom-hud]{display:none!important;visibility:hidden!important}

    /* Actual Enemy Discovery owner */
    #game .relay-enemy-discovery{background:rgba(2,5,13,.48)!important;backdrop-filter:blur(6px)!important}
    #game .relay-enemy-card{border:1px solid rgba(255,208,110,.42)!important;border-left:2px solid #ffd06e!important;background:linear-gradient(145deg,rgba(7,10,15,.98),rgba(2,3,5,.99))!important;box-shadow:0 0 38px rgba(255,208,110,.10),0 24px 65px rgba(0,0,0,.52),inset 0 1px rgba(255,255,255,.05)!important;color:#f4f7fa!important}
    #game .relay-enemy-card .eyebrow{color:#ffd06e!important}
    #game .relay-enemy-card h2{color:#f4f7fa!important}
    #game .relay-enemy-card .enemy-level{border-color:rgba(255,208,110,.58)!important;background:rgba(255,208,110,.045)!important;color:#ffd06e!important}
    #game .relay-enemy-card dt{color:#8896a4!important}
    #game .relay-enemy-card dd{color:#edf1f3!important}
    #game .relay-enemy-card button{border-color:rgba(255,208,110,.5)!important;background:linear-gradient(135deg,rgba(255,208,110,.12),rgba(255,208,110,.035))!important;color:#ffe7a6!important;box-shadow:0 0 22px rgba(255,208,110,.06)!important}
    #game .relay-enemy-card button:hover,#game .relay-enemy-card button:focus-visible{border-color:#ffd06e!important;background:linear-gradient(135deg,rgba(255,208,110,.18),rgba(255,208,110,.055))!important;outline:none!important}

    @media(max-width:760px){
      #intro .home-v3-side{gap:8px!important}
      #intro .home-v3-side .relay-runtime-home-btn{min-height:54px!important;padding:12px 13px!important;font-size:10px!important}
      #intro .home-v3-side .relay-runtime-home-btn small{font-size:6px!important}
      #game .world-marker{top:60px!important;width:min(230px,calc(100vw - 24px))!important;min-height:42px!important;padding:7px 9px!important}
      #game .world-marker span{font-size:6px!important}
      #game .world-marker b{font-size:8px!important;margin-top:4px!important}
      #game .relay-enemy-card{padding:18px!important}
      #game .relay-enemy-card h2{font-size:23px!important}
    }
  `;
  document.head.appendChild(style);

  const closePanels = () => {
    q('#relayInfoPanel')?.classList.add('hidden');
    q('#relayInfoPanel')?.classList.remove('relay-update-mode');
    q('#titlePanel')?.classList.add('hidden');
  };

 

  function hideLegacy(scene) {
    const list=scene?.children?.list||[];
    for(const child of list){
      const text=typeof child?.text==='string'?child.text.trim().toUpperCase():'';
      if(/DYNAMIC\s+CROWD/.test(text)||/^V10\b/.test(text)||/^ALT\+Q\s*\/\s*W\s*\/\s*E/.test(text)){
        const node=child.parentContainer?.setVisible?child.parentContainer:child;
        node.setVisible(false); child.setAlpha?.(0); child.disableInteractive?.();
      }
    }
    for(const child of list){
      if(child?.type!=='Container'||!Array.isArray(child.list))continue;
      const texts=child.list.filter(n=>typeof n?.text==='string').map(n=>n.text.toUpperCase());
      if(texts.some(t=>t.includes('LIVE MISSION INTEL')||t.includes('MISSION INTELLIGENCE'))){child.setVisible(false);child.setAlpha?.(0);child.disableInteractive?.();}
    }
  }

  function typeMission() {
    if(!gameplay())return;
    const badge=q('#game .world-marker'),target=q('#worldGoal');if(!badge||!target)return;
    if(badge.__runtimeTypeTimer)return;
    const current=String(target.textContent||'').trim().toUpperCase();if(!current)return;
    if(badge.dataset.runtimeTyped===current)return;
    badge.dataset.runtimeTyped=current;badge.classList.add('is-runtime-typing');
    clearInterval(badge.__runtimeTypeTimer); target.textContent='';let i=0;
    badge.__runtimeTypeTimer=setInterval(()=>{if(!gameplay()){clearInterval(badge.__runtimeTypeTimer);badge.__runtimeTypeTimer=0;return;}target.textContent=current.slice(0,++i);if(i>=current.length){clearInterval(badge.__runtimeTypeTimer);badge.__runtimeTypeTimer=0;badge.classList.remove('is-runtime-typing');}},24);
  }

  function smoothCountdown(){
    const root=q('#relayGameplayIntroFinalV3'); if(!root||root.__runtimeCountdownV3)return;
    root.__runtimeCountdownV3=true;
    let active=false,startAt=0;
    const timer=q=>q?.querySelector?.('.map-briefing-timer b');
    const observer=new MutationObserver(()=>{
      const open=!root.hidden&&getComputedStyle(root).display!=='none';
      if(open&&!active){active=true;startAt=performance.now();}
      else if(!open&&active){active=false;}
    });
    observer.observe(root,{attributes:true,attributeFilter:['hidden','style','class']});
    const frame=()=>{
      if(active){const remaining=Math.max(0,10000-(performance.now()-startAt));const el=timer(root);if(el)el.textContent=String(Math.ceil(remaining/1000));}
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function startMusic(){
    let settings={};try{settings=JSON.parse(localStorage.getItem('relay-runner-state')||'{}')||{};}catch{}
    if(settings.muted===true)return;
    const volume=Number.isFinite(Number(settings.musicVolume))?Math.max(.05,Math.min(.85,Number(settings.musicVolume))):.55;
    const music=window.relayAdaptiveMusic;
    if(!music)return;
    try{music.setEnabled?.(true);music.setVolume?.(volume);Promise.resolve(music.unlock?.()).then(ok=>{if(ok!==false&&gameplay())music.start?.();}).catch(()=>{});}catch{}
  }

  function bindAudio(){
    const handler=e=>{if(e.type==='keydown'&&e.repeat)return;const t=e.target instanceof Element?e.target:null;if(t?.closest?.('#start,#continue,#launchJob,#again,#nextMission,#retry,[data-mobile-action]')||(e.type==='keydown'&&(e.key==='Enter'||e.code==='Space')))startMusic();};
    document.addEventListener('pointerdown',handler,{capture:true,passive:true});
    document.addEventListener('touchstart',handler,{capture:true,passive:true});
    document.addEventListener('keydown',handler,{capture:true,passive:true});
    window.addEventListener('relay:runner-scene-ready',()=>{if(gameplay())startMusic();},{passive:true});
  }

  function boot(){
    bindAudio(); smoothCountdown();
    window.setInterval(()=>{if(gameplay()){hideLegacy(window.__relayRunnerScene);typeMission()}},180);
  }
  boot();
})();
