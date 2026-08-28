/* UI surface hardening V5.
 * One visible Home surface at a time, stable first-open geometry, real zipper PLAY reveal.
 */
(() => {
  'use strict';
  if (window.__relayUiSurfaceHardeningV5) return;
  window.__relayUiSurfaceHardeningV5 = true;

  const style = document.createElement('style');
  style.id = 'relay-ui-surface-hardening-v5';
  style.textContent = `
    #titlePanel.relay-options-stable,#titlePanel.relay-options-stable .title-panel-card,#titlePanel.relay-surface-pending,#titlePanel.relay-surface-pending .title-panel-card{transform:none!important;rotate:none!important;scale:1!important}
    #titlePanel.relay-surface-pending #titlePanelContent,#titlePanel.relay-surface-pending #titlePanelHeading,#titlePanel.relay-surface-pending #titlePanelEyebrow{visibility:hidden!important}
    #titlePanel.relay-surface-pending{background:rgba(2,7,13,.94)!important}
    #titlePanel .relay-stable-shell,#titlePanel .home-tutorial-content{visibility:visible!important}
    #titlePanel [data-final-toggle="tutorialHints"]{display:none!important}

    #relayPlayZip{position:fixed;inset:0;z-index:2147483000;display:block;pointer-events:none;overflow:hidden;background:#02070d;isolation:isolate}
    #relayPlayZip[hidden]{display:none}
    #relayPlayZip .zip-fabric{position:absolute;top:0;bottom:0;width:50%;background:linear-gradient(180deg,#071525 0%,#02070d 48%,#071525 100%);transition:transform .72s cubic-bezier(.77,0,.18,1);will-change:transform}
    #relayPlayZip .zip-left{left:0;border-right:1px solid rgba(141,244,255,.12)}
    #relayPlayZip .zip-right{right:0;border-left:1px solid rgba(141,244,255,.12)}
    #relayPlayZip.opening .zip-left{transform:translateX(-100%)}
    #relayPlayZip.opening .zip-right{transform:translateX(100%)}
    #relayPlayZip .zip-rail{position:absolute;top:0;bottom:0;width:30px;z-index:3;display:flex;flex-direction:column;justify-content:space-around;padding:2vh 0;box-sizing:border-box;transition:transform .72s cubic-bezier(.77,0,.18,1)}
    #relayPlayZip .zip-rail.left{left:calc(50% - 29px)}
    #relayPlayZip .zip-rail.right{right:calc(50% - 29px)}
    #relayPlayZip.opening .zip-rail.left{transform:translateX(calc(-50vw + 29px))}
    #relayPlayZip.opening .zip-rail.right{transform:translateX(calc(50vw - 29px))}
    #relayPlayZip .zip-tooth{display:block;width:24px;height:9px;margin:0 auto;background:linear-gradient(180deg,#f9fdff,#9caebb 45%,#465b6b);border:1px solid #d8e8f1;border-radius:2px;box-shadow:0 1px 5px rgba(0,0,0,.8),0 0 5px rgba(141,244,255,.14)}
    #relayPlayZip .zip-rail.left .zip-tooth{transform:skewX(-13deg)}
    #relayPlayZip .zip-rail.right .zip-tooth{transform:skewX(13deg)}
    #relayPlayZip .zip-slider{position:absolute;left:50%;top:50%;z-index:7;width:58px;height:76px;transform:translate(-50%,-50%);border:2px solid #e5f1f6;border-radius:13px 13px 17px 17px;background:linear-gradient(145deg,#ffffff 0%,#a9bac5 34%,#435968 72%,#d8e7ed 100%);box-shadow:0 0 0 2px rgba(2,7,13,.8),0 10px 34px rgba(0,0,0,.72),0 0 28px rgba(141,244,255,.38);transition:transform .72s cubic-bezier(.77,0,.18,1),opacity .35s ease}
    #relayPlayZip .zip-slider::before{content:"";position:absolute;left:50%;top:9px;width:23px;height:43px;transform:translateX(-50%);border-radius:8px;background:linear-gradient(180deg,#2d4556,#eef7fb 42%,#526a79);box-shadow:inset 0 1px 2px rgba(255,255,255,.7)}
    #relayPlayZip .zip-slider::after{content:"";position:absolute;left:50%;bottom:-16px;width:13px;height:20px;transform:translateX(-50%);border:2px solid #b8c9d3;border-top:0;border-radius:0 0 7px 7px;background:#647b8a}
    #relayPlayZip.opening .zip-slider{transform:translate(-50%,-50%) scale(.72);opacity:0}
    #relayPlayZip .zip-glow{position:absolute;left:50%;top:0;bottom:0;width:3px;z-index:6;transform:translateX(-50%);background:linear-gradient(180deg,transparent,#8df4ff 22%,#fff 50%,#ffd06e 78%,transparent);box-shadow:0 0 28px rgba(141,244,255,.7);opacity:.9;transition:opacity .2s ease}
    #relayPlayZip.opening .zip-glow{opacity:0}
    @media(max-width:768px){#relayPlayZip .zip-rail{width:24px}#relayPlayZip .zip-rail.left{left:calc(50% - 23px)}#relayPlayZip .zip-rail.right{right:calc(50% - 23px)}#relayPlayZip.opening .zip-rail.left{transform:translateX(calc(-50vw + 23px))}#relayPlayZip.opening .zip-rail.right{transform:translateX(calc(50vw - 23px))}#relayPlayZip .zip-tooth{width:18px;height:7px}#relayPlayZip .zip-slider{width:46px;height:62px}}
    @media(max-width:420px){#relayPlayZip .zip-slider{width:42px;height:56px}}
    @media(prefers-reduced-motion:reduce){#relayPlayZip .zip-fabric,#relayPlayZip .zip-rail,#relayPlayZip .zip-slider{transition-duration:.01ms}}

    #titlePanel:has(.home-tutorial-content) .title-panel-card{width:min(940px,92vw)!important;max-width:none!important;transform:none!important;rotate:none!important;scale:1!important;display:flex!important;flex-direction:column!important;box-sizing:border-box!important}
    #titlePanel:has(.home-tutorial-content) #titlePanelContent{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;scrollbar-gutter:stable!important}
    #titlePanel:has(.home-tutorial-content) .title-panel-close{z-index:20!important;display:grid!important;place-items:center!important;pointer-events:auto!important}
    @media(max-width:700px){#titlePanel:has(.home-tutorial-content){position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-height:100dvh!important;padding:10px!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;overscroll-behavior-y:contain!important;transform:none!important}#titlePanel:has(.home-tutorial-content) .title-panel-card{width:92vw!important;max-width:92vw!important;min-height:0!important;max-height:none!important;height:auto!important;overflow:visible!important;border-radius:16px!important;padding:34px 18px 18px!important}#titlePanel:has(.home-tutorial-content) .title-panel-close{top:8px!important;right:8px!important;width:40px!important;height:40px!important;font-size:26px!important;border-radius:10px!important;background:rgba(3,10,18,.94)!important;color:#eefbff!important}#titlePanel:has(.home-tutorial-content) #titlePanelContent{flex:none!important;height:auto!important;max-height:none!important;overflow:visible!important;touch-action:pan-y!important}}
  `;
  document.head.appendChild(style);

  const zip = document.createElement('div');
  zip.id = 'relayPlayZip';
  zip.hidden = true;
  zip.setAttribute('aria-hidden','true');
  const left = document.createElement('div'); left.className = 'zip-fabric zip-left';
  const right = document.createElement('div'); right.className = 'zip-fabric zip-right';
  zip.append(left,right);
  const rail = side => { const el=document.createElement('div'); el.className=`zip-rail ${side}`; for(let i=0;i<30;i++){const t=document.createElement('i');t.className='zip-tooth';el.appendChild(t)} return el; };
  zip.append(rail('left'),rail('right'));
  const glow=document.createElement('span'); glow.className='zip-glow';
  const slider=document.createElement('span'); slider.className='zip-slider';
  zip.append(glow,slider);
  document.body.appendChild(zip);

  const panel=()=>document.getElementById('titlePanel');
  const content=()=>document.getElementById('titlePanelContent');
  const markPending=expected=>{const p=panel();if(!p)return;p.classList.add('relay-surface-pending');const start=performance.now();const check=()=>{const c=content();const ready=expected==='options'?!!c?.querySelector('.relay-stable-shell'):!!c?.querySelector('.home-tutorial-content');if(ready||performance.now()-start>1800)p.classList.remove('relay-surface-pending');else requestAnimationFrame(check)};requestAnimationFrame(check)};
  document.addEventListener('click',event=>{const options=event.target.closest?.('[data-title-panel="controls"]');const tutorial=event.target.closest?.('[data-title-panel="tutorial"]');if(options)markPending('options');if(tutorial)markPending('tutorial')},true);

  const startPlay=()=>{if(window.__relayPlayZipActive)return;window.__relayPlayZipActive=true;zip.hidden=false;zip.classList.remove('opening');void zip.offsetWidth;window.setTimeout(()=>zip.classList.add('opening'),120);window.setTimeout(()=>{zip.hidden=true;zip.classList.remove('opening');window.__relayPlayZipActive=false},900)};
  const bindPlay=()=>{const play=document.getElementById('start');if(!play||play.dataset.relayZipBound)return;if(play.dataset.relayZipBound==='1')return;play.dataset.relayZipBound='1';play.addEventListener('click',startPlay,true)};
  bindPlay();
  const observer=new MutationObserver(bindPlay);observer.observe(document.body,{childList:true,subtree:true});
})();
