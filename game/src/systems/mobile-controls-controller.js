const ACTION_LABELS = {
  jump: 'JUMP — SPACE',
  fire: 'FIRE — E',
  sword: 'SWORD — Q',
  dash: 'DASH — SHIFT',
  build1: 'BUILD — 1',
  build2: 'BUILD — 2',
  gadget1: 'GEAR — 3',
  gadget2: 'GEAR — 4'
};

const style = document.createElement('style');
style.id = 'relay-mobile-controls-controller-style';
style.textContent = `
  body.is-touch .mobile-controls {
    --relay-touch-size: clamp(46px, 12.5vw, 58px);
    left: max(10px, env(safe-area-inset-left, 0px) + 8px) !important;
    right: max(10px, env(safe-area-inset-right, 0px) + 8px) !important;
    bottom: max(12px, env(safe-area-inset-bottom, 0px) + 10px) !important;
    align-items: flex-end !important;
    gap: 10px !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: none !important;
    touch-action: none !important;
    user-select: none;
    -webkit-user-select: none;
  }
  body.is-touch .mobile-joystick,
  body.is-touch .mobile-controls button {
    pointer-events: auto !important;
    touch-action: none !important;
  }
  body.is-touch .mobile-joystick {
    flex: 0 0 clamp(76px, 20vw, 92px) !important;
    width: clamp(76px, 20vw, 92px) !important;
    height: clamp(76px, 20vw, 92px) !important;
    overflow: hidden !important;
  }
  body.is-touch .mobile-joystick-thumb {
    width: 42px !important;
    height: 42px !important;
    margin: -21px 0 0 -21px !important;
    will-change: transform;
  }
  body.is-touch .mobile-actions {
    flex: 0 1 auto !important;
    display: grid !important;
    grid-template-columns: repeat(4, var(--relay-touch-size)) !important;
    gap: 4px !important;
    width: calc(var(--relay-touch-size) * 4 + 12px) !important;
    max-width: calc(100vw - 110px) !important;
    pointer-events: none !important;
  }
  body.is-touch .mobile-controls button {
    width: var(--relay-touch-size) !important;
    height: var(--relay-touch-size) !important;
    min-width: 0 !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1 !important;
    font-size: clamp(8px, 2.15vw, 10px) !important;
  }
  body.is-touch .mobile-controls button small {
    display: block;
    font-size: clamp(5px, 1.35vw, 6px);
    line-height: 1;
  }
  @media (max-width: 380px) {
    body.is-touch .mobile-controls {
      --relay-touch-size: 43px;
      gap: 7px !important;
      left: 8px !important;
      right: 8px !important;
      bottom: max(10px, env(safe-area-inset-bottom, 0px) + 8px) !important;
    }
    body.is-touch .mobile-joystick { width: 72px !important; height: 72px !important; flex-basis: 72px !important; }
    body.is-touch .mobile-joystick-thumb { width: 38px !important; height: 38px !important; margin: -19px 0 0 -19px !important; }
    body.is-touch .mobile-actions { gap: 3px !important; width: calc(var(--relay-touch-size) * 4 + 9px) !important; max-width: calc(100vw - 88px) !important; }
  }
`;
document.head.appendChild(style);

function isTouchDevice() {
  return navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || matchMedia('(pointer: coarse)').matches
    || matchMedia('(hover: none)').matches;
}

function getRunner() {
  return window.__relayRunnerScene || null;
}

function isGameUsable() {
  const scene = getRunner();
  return !!scene?.player?.active && !scene.finished && !scene.respawning && !scene.cinematicActive;
}

function emitGameEvent(name, value) {
  const scene = getRunner();
  scene?.game?.events?.emit?.(name, value);
}

function install() {
  if (window.__relayMobileControlsController || !isTouchDevice()) return;

  const controls = document.querySelector('.mobile-controls');
  if (!controls) {
    window.requestAnimationFrame(install);
    return;
  }

  window.__relayMobileControlsController = true;
  const cleanControls = controls.cloneNode(true);
  cleanControls.dataset.mobileControlsOwner = 'controller';
  controls.replaceWith(cleanControls);

  const joystick = cleanControls.querySelector('[data-mobile-joystick]');
  const thumb = joystick?.querySelector('.mobile-joystick-thumb');
  const buttons = [...cleanControls.querySelectorAll('[data-mobile-action]')];

  buttons.forEach(button => {
    const action = button.dataset.mobileAction;
    if (!ACTION_LABELS[action]) return;
    button.setAttribute('aria-label', ACTION_LABELS[action]);

    const press = event => {
      event.preventDefault();
      event.stopPropagation();
      if (!isGameUsable()) return;
      button.classList.add('is-active');
      emitGameEvent('mobile-action', action);
    };
    const release = () => button.classList.remove('is-active');

    button.addEventListener('pointerdown', press, { passive: false });
    button.addEventListener('pointerup', release, { passive: true });
    button.addEventListener('pointercancel', release, { passive: true });
    button.addEventListener('lostpointercapture', release, { passive: true });
  });

  if (!joystick || !thumb) return;

  let pointerId = null;
  let direction = null;

  // Precision tuning only: the visual joystick design is unchanged.
  // Travel is calculated from the actual rendered size so the thumb can never
  // visually poke through the ring, including on small Android screens.
  const getGeometry = () => {
    const rect = joystick.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxX = Math.max(0, rect.width / 2 - thumbRect.width / 2 - 3);
    const maxY = Math.max(0, rect.height / 2 - thumbRect.height / 2 - 3);
    return { rect, centerX, centerY, maxX, maxY };
  };

  // Small center deadzone prevents accidental walking from tiny finger shifts.
  // A slightly smaller release threshold gives stable left/right control near center.
  const deadzone = 6;
  const releaseZone = 4;

  const setDirection = next => {
    if (next === direction) return;
    direction = next;
    emitGameEvent('mobile-move', next);
    joystick.classList.toggle('is-driving', !!next);
  };

  const reset = () => {
    if (pointerId !== null) {
      try { joystick.releasePointerCapture?.(pointerId); } catch (_) {}
    }
    pointerId = null;
    direction = null;
    emitGameEvent('mobile-move', null);
    joystick.classList.remove('is-active', 'is-driving');
    thumb.style.transform = 'translate3d(0,0,0)';
  };

  const move = (x, y) => {
    const { centerX, centerY, maxX, maxY } = getGeometry();
    const rawX = x - centerX;
    const rawY = y - centerY;

    // Clamp X/Y independently so the thumb always remains fully inside the ring.
    const clampedX = Math.max(-maxX, Math.min(maxX, rawX));
    const clampedY = Math.max(-maxY, Math.min(maxY, rawY));
    thumb.style.transform = `translate3d(${clampedX.toFixed(1)}px,${clampedY.toFixed(1)}px,0)`;

    // Movement is intentionally horizontal because RunnerScene consumes
    // left/right directions. Vertical finger movement remains visual only.
    const absX = Math.abs(rawX);
    if (direction === null) {
      if (absX > deadzone) setDirection(rawX < 0 ? 'left' : 'right');
      return;
    }

    // Hysteresis stops rapid left/right flicker when the finger sits around center.
    if (absX <= releaseZone) setDirection(null);
    else if (rawX < 0) setDirection('left');
    else setDirection('right');
  };

  joystick.addEventListener('pointerdown', event => {
    if (!isGameUsable()) return;
    event.preventDefault();
    event.stopPropagation();
    if (pointerId !== null) reset();
    pointerId = event.pointerId;
    joystick.setPointerCapture?.(pointerId);
    joystick.classList.add('is-active');
    move(event.clientX, event.clientY);
  }, { passive: false });

  joystick.addEventListener('pointermove', event => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    move(event.clientX, event.clientY);
  }, { passive: false });

  const end = event => {
    if (event && event.pointerId !== pointerId) return;
    reset();
  };
  joystick.addEventListener('pointerup', end, { passive: true });
  joystick.addEventListener('pointercancel', end, { passive: true });
  joystick.addEventListener('lostpointercapture', reset, { passive: true });
  window.addEventListener('pointerup', end, { passive: true });
  window.addEventListener('pointercancel', end, { passive: true });
  window.addEventListener('blur', reset, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); }, { passive: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();