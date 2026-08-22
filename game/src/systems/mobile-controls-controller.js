const ACTION_KEYS = { jump:' ', fire:'e', sword:'q', dash:'Shift', build1:'1', gadget1:'3' };
const ACTION_LABELS = { jump:'JUMP — SPACE', fire:'FIRE — E', sword:'SWORD — Q', dash:'DASH — SHIFT', build1:'BUILD — 1', gadget1:'GEAR — 3' };
const emitKey = (key,type) => window.dispatchEvent(new KeyboardEvent(type,{key,code:key===' '?'Space':key.length===1?`Key${key.toUpperCase()}`:key,bubbles:true,cancelable:true}));

const style=document.createElement('style'); style.id='relay-mobile-controls-controller-style'; style.textContent=`
body.is-touch .mobile-controls{--relay-touch-size:clamp(46px,12.5vw,58px);left:max(10px,env(safe-area-inset-left,0px) + 8px)!important;right:max(10px,env(safe-area-inset-right,0px) + 8px)!important;bottom:max(12px,env(safe-area-inset-bottom,0px) + 10px)!important;align-items:flex-end!important;gap:10px!important;visibility:visible;opacity:1;pointer-events:auto}
body.is-touch .mobile-joystick{flex:0 0 clamp(76px,20vw,92px)!important;width:clamp(76px,20vw,92px)!important;height:clamp(76px,20vw,92px)!important;pointer-events:auto!important}
body.is-touch .mobile-joystick-thumb{width:42px!important;height:42px!important;margin:-21px 0 0 -21px!important}
body.is-touch .mobile-actions{flex:0 1 auto!important;pointer-events:auto!important}
body.is-touch .mobile-controls button{margin:0!important;padding:0!important;line-height:1!important;pointer-events:auto!important;touch-action:none!important}
body.is-touch .mobile-controls button small{display:block;margin:0;font-size:clamp(5px,1.35vw,6px);line-height:1;letter-spacing:.55px}
@media(max-width:380px){body.is-touch .mobile-controls{--relay-touch-size:43px;gap:7px!important;left:8px!important;right:8px!important;bottom:max(10px,env(safe-area-inset-bottom,0px) + 8px)!important}body.is-touch .mobile-joystick{flex-basis:72px!important;width:72px!important;height:72px!important}.mobile-joystick-thumb{width:38px!important;height:38px!important;margin:-19px 0 0 -19px!important}}
@media(max-height:480px) and (orientation:landscape){body.is-touch .mobile-controls{--relay-touch-size:46px;bottom:max(7px,env(safe-area-inset-bottom,0px) + 5px)!important;gap:8px!important}body.is-touch .mobile-joystick{flex-basis:76px!important;width:76px!important;height:76px!important}}
@media(max-height:360px) and (orientation:landscape){body.is-touch .mobile-controls{--relay-touch-size:40px;gap:6px!important}body.is-touch .mobile-joystick{flex-basis:66px!important;width:66px!important;height:66px!important}}
`;
document.head.appendChild(style);

function isTouchDevice(){return navigator.maxTouchPoints>0||'ontouchstart' in window||matchMedia('(pointer: coarse)').matches||matchMedia('(hover: none)').matches;}
function install(){
  if(!isTouchDevice()||window.__relayMobileControlsController)return;
  const existing=document.querySelector('.mobile-controls');
  if(!existing)return;
  window.__relayMobileControlsController=true;
  let controls=existing.cloneNode(true); controls.dataset.mobileControlsOwner='controller'; existing.replaceWith(controls);
  controls.querySelector('[data-mobile-action="build2"]')?.remove(); controls.querySelector('[data-mobile-action="gadget2"]')?.remove();
  const joystick=controls.querySelector('[data-mobile-joystick]'); const thumb=joystick?.querySelector('.mobile-joystick-thumb'); const buttons=[...controls.querySelectorAll('[data-mobile-action]')];
  buttons.forEach(button=>{const action=button.dataset.mobileAction,key=ACTION_KEYS[action];if(!key)return;if(ACTION_LABELS[action])button.setAttribute('aria-label',ACTION_LABELS[action]);button.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();emitKey(key,'keydown');button.classList.add('is-active');window.setTimeout(()=>{emitKey(key,'keyup');button.classList.remove('is-active');},90);},{passive:false});});
  if(joystick&&thumb){let pointerId=null,direction=null;const setDirection=next=>{if(next===direction)return;if(direction==='left')emitKey('a','keyup');if(direction==='right')emitKey('d','keyup');direction=next;if(next==='left')emitKey('a','keydown');if(next==='right')emitKey('d','keydown');};const resetJoystick=()=>{setDirection(null);pointerId=null;joystick.classList.remove('is-active');thumb.style.transform='translate(0,0)';};const updateJoystick=(x,y)=>{const rect=joystick.getBoundingClientRect(),dx=x-rect.left-rect.width/2,dy=y-rect.top-rect.height/2,distance=Math.min(Math.hypot(dx,dy),32),angle=Math.atan2(dy,dx);thumb.style.transform=`translate(${(Math.cos(angle)*distance).toFixed(1)}px,${(Math.sin(angle)*distance).toFixed(1)}px)`;setDirection(Math.abs(dx)<9?null:dx<0?'left':'right');};joystick.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();pointerId=event.pointerId;joystick.setPointerCapture?.(pointerId);joystick.classList.add('is-active');updateJoystick(event.clientX,event.clientY);},{passive:false});joystick.addEventListener('pointermove',event=>{if(event.pointerId!==pointerId)return;event.preventDefault();updateJoystick(event.clientX,event.clientY);},{passive:false});const end=event=>{if(event&&event.pointerId!==pointerId)return;resetJoystick();};joystick.addEventListener('pointerup',end);joystick.addEventListener('pointercancel',end);joystick.addEventListener('lostpointercapture',resetJoystick);window.addEventListener('blur',resetJoystick);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
