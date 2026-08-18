(() => {
  if (window.__runnerRelayGameFeelV1) return;
  window.__runnerRelayGameFeelV1 = true;

  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const getCanvas = () => document.querySelector('#game canvas, canvas');

  const style = document.createElement('style');
  style.textContent = `
    .relay-gf-press { transform: translateY(1px) scale(.985) !important; filter: brightness(1.08) !important; }
    .relay-gf-flash { animation: relayGfFlash .18s ease-out both; }
    .relay-gf-pulse { animation: relayGfPulse .24s ease-out both; }
    @keyframes relayGfFlash { 0% { opacity: .96; } 100% { opacity: 1; } }
    @keyframes relayGfPulse { 0% { filter: brightness(1); } 35% { filter: brightness(1.12); } 100% { filter: brightness(1); } }
  `;
  document.head.appendChild(style);

  const pressTargets = [
    '#pauseBtn', '#settingsBtn', '#resumeBtn', '#restartBtn',
    '[data-action="dash"]', '[data-action="jump"]', '[data-action="attack"]',
    '[data-control="dash"]', '[data-control="jump"]', '[data-control="attack"]'
  ];

  const markPress = target => {
    target?.classList.add('relay-gf-press');
    if (target) window.setTimeout(() => target.classList.remove('relay-gf-press'), 120);
  };

  document.addEventListener('pointerdown', event => {
    const target = event.target.closest?.(pressTargets.join(','));
    if (target) markPress(target);
  }, { passive: true });

  const flash = (kind = 'pulse') => {
    const canvas = getCanvas();
    if (!canvas || reducedMotion()) return;
    canvas.classList.remove('relay-gf-flash', 'relay-gf-pulse');
    void canvas.offsetWidth;
    canvas.classList.add(kind === 'impact' ? 'relay-gf-flash' : 'relay-gf-pulse');
    window.setTimeout(() => canvas.classList.remove('relay-gf-flash', 'relay-gf-pulse'), 280);
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

  Object.keys(aliases).forEach(type => window.addEventListener(type, () => flash(aliases[type])));

  window.relayGameFeelV1 = { flash };
})();
