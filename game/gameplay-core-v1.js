const play = document.getElementById('play');

if (play && !play.dataset.gameplayCoreV1) {
  play.dataset.gameplayCoreV1 = 'ready';

  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = './gameplay-core-v1.css';
  document.head.appendChild(styleLink);

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const actionButtons = new Map(
    [...play.querySelectorAll('[data-mobile-action]')]
      .map(button => [button.dataset.mobileAction, button])
  );

  let pulseTimer = 0;
  let pulseElementTimer = 0;
  let activePulseElement = null;
  let movingKeys = 0;

  const clearPulse = () => {
    play.classList.remove('gameplay-dash', 'gameplay-jump', 'gameplay-hit');
    if (activePulseElement) {
      activePulseElement.classList.remove('gameplay-pulse');
      activePulseElement = null;
    }
  };

  const pulse = (kind, element = null, duration = 180) => {
    window.clearTimeout(pulseTimer);
    window.clearTimeout(pulseElementTimer);
    clearPulse();

    if (!reducedMotion()) play.classList.add(`gameplay-${kind}`);

    if (element) {
      activePulseElement = element;
      element.classList.add('gameplay-pulse');
      pulseElementTimer = window.setTimeout(() => {
        if (activePulseElement === element) {
          element.classList.remove('gameplay-pulse');
          activePulseElement = null;
        }
      }, duration);
    }

    pulseTimer = window.setTimeout(() => {
      play.classList.remove(`gameplay-${kind}`);
    }, duration + 40);
  };

  const actionPulse = action => {
    const button = actionButtons.get(action) || null;
    if (action === 'dash') return pulse('dash', button, 190);
    if (action === 'jump') return pulse('jump', button, 150);
    if (action === 'fire' || action === 'sword') return pulse('jump', button, 120);
    if (button) {
      window.clearTimeout(pulseElementTimer);
      if (activePulseElement && activePulseElement !== button) activePulseElement.classList.remove('gameplay-pulse');
      activePulseElement = button;
      button.classList.add('gameplay-pulse');
      pulseElementTimer = window.setTimeout(() => {
        if (activePulseElement === button) {
          button.classList.remove('gameplay-pulse');
          activePulseElement = null;
        }
      }, 120);
    }
  };

  document.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft' || event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') {
      movingKeys += 1;
      play.classList.add('gameplay-moving');
      return;
    }
    if (event.code === 'Space' || event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') return actionPulse('jump');
    if (event.key === 'Shift') return actionPulse('dash');
  }, true);

  document.addEventListener('keyup', event => {
    if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft' || event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') {
      movingKeys = Math.max(0, movingKeys - 1);
      if (!movingKeys) play.classList.remove('gameplay-moving');
    }
  }, true);

  actionButtons.forEach(button => {
    button.addEventListener('pointerdown', () => actionPulse(button.dataset.mobileAction), { passive: true });
  });

  const joystick = play.querySelector('[data-mobile-joystick]');
  joystick?.addEventListener('pointerdown', () => play.classList.add('gameplay-moving'), { passive: true });
  window.addEventListener('pointerup', () => play.classList.remove('gameplay-moving'), { passive: true });
  window.addEventListener('pointercancel', () => play.classList.remove('gameplay-moving'), { passive: true });
  window.addEventListener('blur', () => {
    movingKeys = 0;
    clearPulse();
    play.classList.remove('gameplay-moving');
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      movingKeys = 0;
      clearPulse();
      play.classList.remove('gameplay-moving');
    }
  });

  window.dispatchEvent(new CustomEvent('relay:gameplay-core-ready', { detail: { version: '1.0.2' } }));
}
