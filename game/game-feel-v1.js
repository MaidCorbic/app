(() => {
  if (window.__runnerRelayGameFeelV1) return;
  window.__runnerRelayGameFeelV1 = true;

  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const getCanvas = () => document.querySelector('#game canvas, canvas');
  const animations = new WeakMap();

  const pressTargets = [
    '#pauseBtn', '#settingsBtn', '#resumeBtn', '#restartBtn',
    '[data-action="dash"]', '[data-action="jump"]', '[data-action="attack"]',
    '[data-control="dash"]', '[data-control="jump"]', '[data-control="attack"]'
  ];

  const animatePress = target => {
    if (!target || reducedMotion()) return;
    animations.get(target)?.cancel?.();
    const animation = target.animate(
      [
        { transform: 'translateY(1px) scale(.985)', filter: 'brightness(1.08)' },
        { transform: 'translateY(0) scale(1)', filter: 'brightness(1)' }
      ],
      { duration: 120, easing: 'ease-out' }
    );
    animations.set(target, animation);
  };

  document.addEventListener('pointerdown', event => {
    const target = event.target?.closest?.(pressTargets.join(','));
    if (target) animatePress(target);
  }, { passive: true });

  const flash = (kind = 'pulse') => {
    const canvas = getCanvas();
    if (!canvas || reducedMotion()) return;
    animations.get(canvas)?.cancel?.();

    const isImpact = kind === 'impact';
    const animation = canvas.animate(
      isImpact
        ? [
            { opacity: .96, filter: 'brightness(1)' },
            { opacity: 1, filter: 'brightness(1.14)' },
            { opacity: 1, filter: 'brightness(1)' }
          ]
        : [
            { filter: 'brightness(1)' },
            { filter: 'brightness(1.12)' },
            { filter: 'brightness(1)' }
          ],
      { duration: isImpact ? 180 : 240, easing: 'ease-out' }
    );
    animations.set(canvas, animation);
  };

  const aliases = {
    'relay:signal': 'pulse',
    'relay:checkpoint': 'pulse',
    'relay:combo': 'pulse',
    'relay:hit': 'impact',
    'relay:dash': 'impact',
    'relay:death': 'impact',
    'relay:mission-complete': 'pulse'
  };

  Object.entries(aliases).forEach(([type, kind]) => {
    window.addEventListener(type, () => flash(kind));
  });

  window.relayGameFeelV1 = { flash };
})();
