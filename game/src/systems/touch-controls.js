// Touch controls use browser Pointer Events and dispatch small, semantic events.
// RunnerScene can consume these without creating a second game/physics instance.
export function installTouchControls(game) {
  const pad = document.querySelector('[data-mobile-joystick]');
  const thumb = pad?.querySelector('.mobile-joystick-thumb');
  if (!pad || !thumb || !game) return;
  let pointerId = null;
  let direction = null;
  const max = 38;
  const deadzone = 9;
  const emitMove = next => {
    if (next === direction) return;
    direction = next;
    window.dispatchEvent(new CustomEvent('relay-mobile-move', { detail: { direction: next } }));
  };
  const move = (x, y) => {
    const rect = pad.getBoundingClientRect();
    const dx = x - (rect.left + rect.width / 2);
    const dy = y - (rect.top + rect.height / 2);
    const distance = Math.min(Math.hypot(dx, dy), max);
    const angle = Math.atan2(dy, dx);
    thumb.style.transform = `translate(${(Math.cos(angle) * distance).toFixed(1)}px, ${(Math.sin(angle) * distance).toFixed(1)}px)`;
    emitMove(Math.abs(dx) < deadzone ? null : dx < 0 ? 'left' : 'right');
  };
  const reset = () => { pointerId = null; pad.classList.remove('is-active'); thumb.style.transform = 'translate(0,0)'; emitMove(null); };
  pad.addEventListener('pointerdown', event => { pointerId = event.pointerId; pad.setPointerCapture?.(pointerId); pad.classList.add('is-active'); move(event.clientX, event.clientY); event.preventDefault(); });
  pad.addEventListener('pointermove', event => { if (event.pointerId === pointerId) { move(event.clientX, event.clientY); event.preventDefault(); } }, { passive: false });
  pad.addEventListener('pointerup', event => { if (event.pointerId === pointerId) reset(); });
  pad.addEventListener('pointercancel', reset);
  window.addEventListener('blur', reset);

  document.querySelectorAll('[data-mobile-action]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      const action = button.dataset.mobileAction;
      window.dispatchEvent(new CustomEvent('relay-mobile-action', { detail: { action } }));
      button.classList.add('is-active');
      setTimeout(() => button.classList.remove('is-active'), 110);
    }, { passive: false });
  });
}
