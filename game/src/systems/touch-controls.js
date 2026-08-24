// Reliable touch controls for the existing mobile joystick. The joystick drives
// the same A/D movement path used by the desktop controls; Phaser remains the
// authoritative gameplay/input owner.
const keyCodeFor = key => ({ a:65, d:68, s:83, ' ':32, shift:16 })[String(key).toLowerCase()] || String(key).toUpperCase().charCodeAt(0);
const activeScene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || window.game?.scene?.getScenes?.(true)?.find?.(scene => scene?.scene?.key === 'runner');
const emitKey = (key, type) => {
  const code = key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : String(key).toUpperCase();
  try { window.dispatchEvent(new KeyboardEvent(type, { key, code, bubbles:true, cancelable:true })); } catch {}
  try { document.dispatchEvent(new KeyboardEvent(type, { key, code, bubbles:true, cancelable:true })); } catch {}
  try {
    const keyboard = activeScene()?.input?.keyboard;
    if (!keyboard) return;
    const keyCode = keyCodeFor(key);
    const phaserKey = keyboard.keys?.[keyCode] || keyboard.addKey?.(keyCode, false, false);
    if (phaserKey) { phaserKey.isDown = type === 'keydown'; phaserKey.isUp = !phaserKey.isDown; }
  } catch {}
};

function install() {
  const pad = document.querySelector('[data-mobile-joystick]');
  const thumb = pad?.querySelector('.mobile-joystick-thumb');
  if (!pad || !thumb || pad.dataset.touchControlsBound === '1') return;
  pad.dataset.touchControlsBound = '1';
  pad.style.touchAction = 'none';
  pad.style.webkitUserSelect = 'none';
  let pointerId = null;
  let direction = null;
  let rect = null;
  const max = 38;
  const deadzone = 9;

  const refreshRect = () => {
    const next = pad.getBoundingClientRect();
    rect = { left:next.left, top:next.top, width:next.width, height:next.height, centerX:next.left + next.width / 2, centerY:next.top + next.height / 2 };
  };
  const setDirection = next => {
    if (next === direction) return;
    if (direction === 'left') emitKey('a', 'keyup');
    if (direction === 'right') emitKey('d', 'keyup');
    direction = next;
    if (next === 'left') emitKey('a', 'keydown');
    if (next === 'right') emitKey('d', 'keydown');
  };
  const move = (x,y) => {
    if (!rect) refreshRect();
    const dx=x-rect.centerX, dy=y-rect.centerY;
    const distance=Math.min(Math.hypot(dx,dy),max);
    const angle=Math.atan2(dy,dx);
    thumb.style.transform=`translate(${(Math.cos(angle)*distance).toFixed(1)}px, ${(Math.sin(angle)*distance).toFixed(1)}px)`;
    setDirection(Math.abs(dx)<deadzone ? null : dx<0 ? 'left' : 'right');
  };
  const reset = () => {
    if (direction === 'left') emitKey('a','keyup');
    if (direction === 'right') emitKey('d','keyup');
    direction=null; pointerId=null; rect=null;
    pad.classList.remove('is-active'); thumb.style.transform='translate(0,0)';
  };
  const invalidateLayout=()=>{rect=null;};
  const begin = event => {
    if (pointerId !== null) return;
    pointerId=event.pointerId;
    pad.setPointerCapture?.(pointerId);
    pad.classList.add('is-active');
    refreshRect(); move(event.clientX,event.clientY); event.preventDefault();
  };
  pad.addEventListener('pointerdown',begin,{passive:false});
  pad.addEventListener('pointermove',event=>{if(event.pointerId!==pointerId)return;move(event.clientX,event.clientY);event.preventDefault();},{passive:false});
  pad.addEventListener('pointerup',event=>{if(event.pointerId===pointerId)reset();},{passive:true});
  pad.addEventListener('pointercancel',reset,{passive:true});
  pad.addEventListener('lostpointercapture',reset,{passive:true});
  window.addEventListener('blur',reset,{passive:true});
  window.addEventListener('resize',invalidateLayout,{passive:true});
  window.addEventListener('orientationchange',invalidateLayout,{passive:true});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
window.addEventListener('relay:runner-scene-ready',install,{passive:true});
