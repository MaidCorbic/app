// Reliable touch/gamepad-style controls. They translate directly to browser key
// events so Phaser's existing keyboard bindings remain the single control path.
const keyForAction = { jump: ' ', fire: 'e', sword: 'q', dash: 'Shift', build1: '1', build2: '2', gadget1: '3', gadget2: '4' };
const emitKey = (key, type) => window.dispatchEvent(new KeyboardEvent(type, { key, code: key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key, bubbles: true, cancelable: true }));

function install() {
  const pad = document.querySelector('[data-mobile-joystick]');
  const thumb = pad?.querySelector('.mobile-joystick-thumb');
  if (!pad || !thumb) return;
  let pointerId = null;
  let direction = null;
  const max = 38;
  const deadzone = 9;
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
  const reset = () => { if (direction === 'left') emitKey('a', 'keyup'); if (direction === 'right') emitKey('d', 'keyup'); direction = null; pointerId = null; pad.classList.remove('is-active'); thumb.style.transform = 'translate(0,0)'; };
  pad.addEventListener('pointerdown', event => { pointerId = event.pointerId; pad.setPointerCapture?.(pointerId); pad.classList.add('is-active'); move(event.clientX, event.clientY); event.preventDefault(); });
  pad.addEventListener('pointermove', event => { if (event.pointerId === pointerId) { move(event.clientX, event.clientY); event.preventDefault(); } }, { passive: false });
  pad.addEventListener('pointerup', event => { if (event.pointerId === pointerId) reset(); });
  pad.addEventListener('pointercancel', reset);
  window.addEventListener('blur', reset);

  document.querySelectorAll('[data-mobile-action]').forEach(button => button.addEventListener('pointerdown', event => {
    event.preventDefault();
    const key = keyForAction[button.dataset.mobileAction];
    if (!key) return;
    emitKey(key, 'keydown');
    setTimeout(() => emitKey(key, 'keyup'), 90);
    button.classList.add('is-active');
    setTimeout(() => button.classList.remove('is-active'), 110);
  }, { passive: false }));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();
