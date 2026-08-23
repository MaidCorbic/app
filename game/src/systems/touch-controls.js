// Reliable touch/gamepad-style controls. They translate directly to browser key
// events so Phaser's existing keyboard bindings remain the single control path.
const keyForAction = { jump: ' ', fire: 'e', sword: 'q', dash: 'Shift', build1: '1', build2: '2', gadget1: '3', gadget2: '4' };
const emitKey = (key, type) => window.dispatchEvent(new KeyboardEvent(type, { key, code: key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key, bubbles: true, cancelable: true }));

const mobileScene = () => window.__relayRunnerScene || window.RelayRuntime?.scene?.() || null;
const playerGrounded = scene => {
  const body = scene?.player?.body;
  return !!(body?.blocked?.down || body?.touching?.down);
};

function installModernJoystickStyle() {
  if (document.getElementById('relay-modern-mobile-controls-v2')) return;
  const style = document.createElement('style');
  style.id = 'relay-modern-mobile-controls-v2';
  style.textContent = `
    [data-mobile-joystick]{width:108px!important;height:108px!important;border-radius:50%!important;background:radial-gradient(circle at 50% 42%,rgba(82,211,255,.18),rgba(4,15,28,.94) 68%)!important;border:1px solid rgba(141,244,255,.42)!important;box-shadow:inset 0 0 24px rgba(141,244,255,.10),0 0 0 5px rgba(141,244,255,.035),0 10px 30px rgba(0,0,0,.38)!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important;}
    [data-mobile-joystick]::before{content:"";position:absolute;inset:16px;border-radius:50%;border:1px solid rgba(141,244,255,.13);pointer-events:none;}
    [data-mobile-joystick] .mobile-joystick-thumb{width:48px!important;height:48px!important;border-radius:50%!important;background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.25),rgba(62,154,185,.62) 38%,rgba(5,28,44,.98) 74%)!important;border:1px solid rgba(185,245,255,.72)!important;box-shadow:0 0 16px rgba(141,244,255,.30),inset 0 0 12px rgba(255,255,255,.08)!important;will-change:transform!important;transition:box-shadow .12s ease!important;}
    [data-mobile-joystick].is-active .mobile-joystick-thumb{box-shadow:0 0 22px rgba(141,244,255,.48),inset 0 0 12px rgba(255,255,255,.10)!important;}
  `;
  document.head.appendChild(style);
}

function install() {
  installModernJoystickStyle();
  const pad = document.querySelector('[data-mobile-joystick]');
  const thumb = pad?.querySelector('.mobile-joystick-thumb');
  if (!pad || !thumb || pad.dataset.touchControlsV2 === '1') return;
  pad.dataset.touchControlsV2 = '1';

  let pointerId = null;
  let direction = null;
  let lastGroundedAt = -Infinity;
  let jumpLockUntil = 0;
  const max = 38;
  const deadzone = 9;
  const COYOTE_MS = 135;
  const JUMP_LOCK_MS = 120;

  const updateGrounded = () => {
    const scene = mobileScene();
    if (playerGrounded(scene)) lastGroundedAt = performance.now();
    return scene;
  };

  const setDirection = next => {
    if (next === direction) return;
    if (direction === 'left') emitKey('a', 'keyup');
    if (direction === 'right') emitKey('d', 'keyup');
    direction = next;
    if (next === 'left') emitKey('a', 'keydown');
    if (next === 'right') emitKey('d', 'keydown');
  };

  const move = (x, y) => {
    const rect = pad.getBoundingClientRect();
    const dx = x - (rect.left + rect.width / 2);
    const dy = y - (rect.top + rect.height / 2);
    const distance = Math.min(Math.hypot(dx, dy), max);
    const angle = Math.atan2(dy, dx);
    thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px, ${(Math.sin(angle) * distance).toFixed(1)}px)`;
    setDirection(Math.abs(dx) < deadzone ? null : dx < 0 ? 'left' : 'right');
  };

  const reset = () => {
    if (direction === 'left') emitKey('a', 'keyup');
    if (direction === 'right') emitKey('d', 'keyup');
    direction = null;
    pointerId = null;
    pad.classList.remove('is-active');
    thumb.style.transform = 'translate(0,0)';
  };

  pad.addEventListener('pointerdown', event => {
    pointerId = event.pointerId;
    pad.setPointerCapture?.(pointerId);
    pad.classList.add('is-active');
    updateGrounded();
    move(event.clientX, event.clientY);
    event.preventDefault();
  }, { passive: false });
  pad.addEventListener('pointermove', event => {
    if (event.pointerId === pointerId) { updateGrounded(); move(event.clientX, event.clientY); event.preventDefault(); }
  }, { passive: false });
  pad.addEventListener('pointerup', event => { if (event.pointerId === pointerId) reset(); });
  pad.addEventListener('pointercancel', reset);
  window.addEventListener('blur', reset);

  document.querySelectorAll('[data-mobile-action]').forEach(button => button.addEventListener('pointerdown', event => {
    event.preventDefault();
    const action = button.dataset.mobileAction;
    const key = keyForAction[action];
    if (!key) return;

    const now = performance.now();
    const scene = updateGrounded();
    const grounded = playerGrounded(scene);
    const coyote = now - lastGroundedAt <= COYOTE_MS;
    if (action === 'jump') {
      if (!grounded && !coyote) return;
      if (now < jumpLockUntil) return;
      jumpLockUntil = now + JUMP_LOCK_MS;
      if (scene) scene.__relayLastMobileJumpAt = now;
    }

    emitKey(key, 'keydown');
    window.setTimeout(() => emitKey(key, 'keyup'), action === 'jump' ? 110 : 90);
    button.classList.add('is-active');
    window.setTimeout(() => button.classList.remove('is-active'), 120);
  }, { passive: false }));

  window.setInterval(updateGrounded, 50);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
