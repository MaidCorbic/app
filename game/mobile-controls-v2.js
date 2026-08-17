(() => {
  const play = document.getElementById('play');
  if (!play || play.dataset.mobileControlsV2) return;
  play.dataset.mobileControlsV2 = 'ready';

  const controls = play.querySelector('.mobile-controls');
  const joystick = play.querySelector('[data-mobile-joystick]');
  const buttons = [...play.querySelectorAll('[data-mobile-action]')];
  if (!controls || !joystick || !buttons.length) return;

  const clearActive = () => {
    buttons.forEach(button => button.classList.remove('is-active'));
    joystick.classList.remove('is-active');
  };

  buttons.forEach(button => {
    button.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && !matchMedia('(pointer:coarse)').matches) return;
      button.classList.add('is-active');
      button.setPointerCapture?.(event.pointerId);
    }, { passive: true });

    const release = event => {
      if (event.pointerId != null && button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
      button.classList.remove('is-active');
    };
    button.addEventListener('pointerup', release, { passive: true });
    button.addEventListener('pointercancel', release, { passive: true });
    button.addEventListener('lostpointercapture', () => button.classList.remove('is-active'), { passive: true });
  });

  joystick.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && !matchMedia('(pointer:coarse)').matches) return;
    joystick.classList.add('is-active');
  }, { passive: true });

  window.addEventListener('pointerup', clearActive, { passive: true });
  window.addEventListener('pointercancel', clearActive, { passive: true });
  window.addEventListener('blur', clearActive);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearActive(); });
  window.addEventListener('orientationchange', clearActive, { passive: true });

  // Prevent accidental page scrolling/selection when a touch starts on the control tray.
  controls.addEventListener('contextmenu', event => event.preventDefault());
})();
