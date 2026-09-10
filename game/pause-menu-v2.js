/* Relay Runner — Pause Menu V2 runtime. Keeps existing pause/resume ownership. */
(() => {
  'use strict';
  if (window.__relayPauseMenuV2) return;
  window.__relayPauseMenuV2 = true;
  const MESSAGES=[['MISSION HOLD','Route execution suspended. Awaiting player input.'],['SIGNAL STABLE','Relay connection secured. No gameplay events are advancing.'],['TACTICAL HOLD','World simulation is paused until the run resumes.'],['RUN FROZEN','Current mission state is preserved.'],['SYSTEM READY','Resume when you are ready to continue the run.']];
  const state={index:0,timer:0,observer:null};
  const menu=()=>document.getElementById('pauseMenu');
  const open=m=>!!m&&!m.classList.contains('hidden');
  const update=header=>{if(!header)return;const [label,message]=MESSAGES[state.index%MESSAGES.length];const a=header.querySelector('.pause-v2-status-label');const b=header.querySelector('.pause-v2-status-message');if(a)a.textContent=label;if(b)b.textContent=message;};
  const mount=m=>{const panel=m?.querySelector('#panelContent');if(!panel)return;panel.classList.add('pause-v2-content');let h=panel.querySelector(':scope > .pause-v2-header');if(!h){h=document.createElement('div');h.className='pause-v2-header';h.setAttribute('role','status');h.setAttribute('aria-live','polite');h.innerHTML='<div class="pause-v2-title-block"><span class="pause-v2-kicker">RELAY RUNNER // GAME STATE</span><h2>PAUSED</h2><p>GAMEPLAY SUSPENDED</p></div><div class="pause-v2-state"><i aria-hidden="true"></i><span>SESSION HOLD</span></div><div class="pause-v2-status-card"><span class="pause-v2-status-label"></span><strong class="pause-v2-status-message"></strong></div>';panel.prepend(h);}update(h);const settings=m.querySelector('[data-tab="settings"]');if(settings){settings.hidden=true;settings.setAttribute('aria-hidden','true');settings.tabIndex=-1;}};
  const sync=()=>{const m=menu();if(!m)return;m.classList.add('pause-menu-v2');if(open(m)){mount(m);if(!state.timer)state.timer=window.setInterval(()=>{if(!open(m))return;state.index=(state.index+1)%MESSAGES.length;update(m.querySelector('.pause-v2-header'));},30000);}else if(state.timer){clearInterval(state.timer);state.timer=0;}};
  const boot=()=>{const m=menu();if(!m)return;state.observer=new MutationObserver(sync);state.observer.observe(m,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});sync();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
