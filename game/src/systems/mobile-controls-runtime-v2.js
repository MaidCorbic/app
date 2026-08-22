(() => {
  'use strict';
  if (window.__relayMobileControlsRuntimeV2) return;
  window.__relayMobileControlsRuntimeV2 = true;

  const touch = () => navigator.maxTouchPoints > 0 || 'ontouchstart' in window || matchMedia('(pointer:coarse)').matches || matchMedia('(hover:none)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner');
  const emit = (name, detail) => { try { scene()?.game?.events?.emit?.(name, detail); } catch {} };
  const key = (value, type) => { const e = new KeyboardEvent(type, { key:value, code:value === ' ' ? 'Space' : value.length === 1 ? `Key${value.toUpperCase()}` : value, bubbles:true, cancelable:true }); window.dispatchEvent(e); document.dispatchEvent(e); };

  const css = document.createElement('style');
  css.id = 'relay-mobile-controls-runtime-v2-style';
  css.textContent = `
    body.is-touch .mobile-controls{z-index:2147483001!important;display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;position:fixed!important;touch-action:none!important}
    body.is-touch.relay-training-active .mobile-controls{z-index:2147483001!important;display:flex!important;visibility:visible!important;opacity:1!important}
    body.is-touch.relay-cinematic-active .mobile-controls{display:none!important;visibility:hidden!important;pointer-events:none!important}
    body.is-touch .mobile-controls,.mobile-controls,.mobile-controls *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}
    body.is-touch .mobile-controls button{cursor:pointer!important;touch-action:manipulation!important}
  `;
  document.head.appendChild(css);

  const build = () => {
    if (!touch() || document.querySelector('.mobile-controls')) return document.querySelector('.mobile-controls');
    const root = document.createElement('div');
    root.className = 'mobile-controls';
    root.setAttribute('aria-label','Touch game controls');
    root.innerHTML = `<div class="mobile-joystick" data-mobile-joystick aria-label="Movement joystick"><div class="mobile-joystick-thumb"></div></div><div class="mobile-actions"><button type="button" data-mobile-action="jump">JUMP<small>SPACE</small></button><button type="button" data-mobile-action="fire">FIRE<small>E</small></button><button type="button" data-mobile-action="sword">BLADE<small>Q</small></button><button type="button" data-mobile-action="dash">DASH<small>SHIFT</small></button><button type="button" data-mobile-action="build1">BUILD<small>1</small></button><button type="button" data-mobile-action="gadget1">GEAR<small>3</small></button></div>`;
    (document.getElementById('play') || document.getElementById('game') || document.body).appendChild(root);
    return root;
  };

  const bind = root => {
    if (!root || root.dataset.runtimeV2 === '1') return;
    root.dataset.runtimeV2 = '1';
    root.querySelectorAll('[data-mobile-action]').forEach(button => {
      button.addEventListener('pointerdown', event => {
        event.preventDefault(); event.stopPropagation();
        const action = button.dataset.mobileAction;
        if (action === 'dash') {
          window.dispatchEvent(new CustomEvent('relay:new-gameplay-dash',{detail:{source:'mobile-runtime-v2'}}));
          window.dispatchEvent(new CustomEvent('relay:dash-start',{detail:{source:'mobile-runtime-v2',scene:scene()}}));
        } else {
          emit('mobile-action', action);
          const keys = {jump:' ',fire:'e',sword:'q',build1:'1',gadget1:'3'};
          if (keys[action]) { key(keys[action],'keydown'); setTimeout(()=>key(keys[action],'keyup'),110); }
        }
        button.classList.add('is-active'); setTimeout(()=>button.classList.remove('is-active'),120);
      }, {passive:false});
    });
    const pad=root.querySelector('[data-mobile-joystick]'); const thumb=pad?.querySelector('.mobile-joystick-thumb'); if(!pad||!thumb) return;
    let id=null; let direction=null;
    const directionSet = next => { if(next===direction)return; direction=next; emit('mobile-move',next); if(next==='left') key('a','keydown'); if(next==='right') key('d','keydown'); if(next===null){ key('a','keyup'); key('d','keyup'); } };
    const update=(x,y)=>{ const r=pad.getBoundingClientRect(); const dx=x-r.left-r.width/2; const dy=y-r.top-r.height/2; const max=Math.max(24,r.width*.42); const d=Math.min(Math.hypot(dx,dy),max); const a=Math.atan2(dy,dx); thumb.style.transform=`translate(${(Math.cos(a)*d).toFixed(1)}px,${(Math.sin(a)*d).toFixed(1)}px)`; directionSet(Math.abs(dx)<Math.max(8,r.width*.12)?null:dx<0?'left':'right'); };
    const reset=()=>{id=null;directionSet(null);pad.classList.remove('is-active');thumb.style.transform='translate(0,0)';};
    pad.addEventListener('pointerdown',e=>{e.preventDefault();id=e.pointerId;pad.setPointerCapture?.(id);pad.classList.add('is-active');update(e.clientX,e.clientY)},{passive:false});
    pad.addEventListener('pointermove',e=>{if(e.pointerId===id){e.preventDefault();update(e.clientX,e.clientY)}},{passive:false});
    pad.addEventListener('pointerup',e=>{if(e.pointerId===id)reset()}); pad.addEventListener('pointercancel',reset); window.addEventListener('blur',reset);
  };

  const install=()=>{ if(!touch())return; document.body.classList.add('is-touch'); const root=build(); bind(root); };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  new MutationObserver(install).observe(document.body,{childList:true,subtree:true});
})();