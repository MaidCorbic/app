/* Hard input boundary for the title screen. Gameplay must never react while Home is active. */
(() => {
  if (window.__relayHomeInputGuard) return;
  window.__relayHomeInputGuard = true;

  const homeIsActive = () => {
    const intro = document.getElementById('intro');
    return !!intro && !intro.classList.contains('hidden');
  };

  const isHomeInteractive = target => !!target?.closest?.('#intro button, #intro a, #intro input, #intro select, #intro textarea, #intro [role="button"], #intro [role="slider"]');

  const blockKeyboard = event => {
    if (!homeIsActive()) return;
    const key = event.key;
    const blocked = key === ' ' || key === 'Spacebar' || key === 'Space' || key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'a' || key === 'A' || key === 'd' || key === 'D' || key === 'e' || key === 'E' || key === 'q' || key === 'Q' || key === 'w' || key === 'W' || key === 's' || key === 'S' || key === 'Shift' || key === 'Control' || key === 'Alt' || key === '1' || key === '2' || key === '3' || key === '4' || key === 'Enter' || key === 'Escape';
    if (!blocked) return;
    // Home owns navigation keys; gameplay listeners must never see them.
    if (isHomeInteractive(event.target) && (key === 'Enter' || key === 'Escape' || key === ' ' || key === 'Spacebar' || key === 'Space')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const blockTouch = event => {
    if (!homeIsActive() || isHomeInteractive(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  window.addEventListener('keydown', blockKeyboard, {capture:true});
  window.addEventListener('keypress', blockKeyboard, {capture:true});
  window.addEventListener('keyup', blockKeyboard, {capture:true});
  window.addEventListener('touchstart', blockTouch, {capture:true, passive:false});
  window.addEventListener('touchmove', blockTouch, {capture:true, passive:false});
  window.addEventListener('touchend', blockTouch, {capture:true, passive:false});
  window.addEventListener('pointerdown', event => {
    if (homeIsActive() && !isHomeInteractive(event.target)) event.stopImmediatePropagation();
  }, {capture:true});
})();
