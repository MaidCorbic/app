(() => {
  if (window.__runnerRelayGameFeelV1) return;
  window.__runnerRelayGameFeelV1 = true;

  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const getCanvas = () => document.querySelector('#game canvas, canvas');

 const style = document.createElement('style');

style.id = 'relay-game-feel-v1-style';

style.textContent = `
  .relay-gf-pulse {
    animation: relayGfPulse .20s ease-out both;
  }

  .relay-gf-impact {
    animation: relayGfImpact .16s ease-out both;
  }

  .relay-gf-danger {
    animation: relayGfDanger .26s ease-out both;
  }

  .relay-gf-complete {
    animation: relayGfComplete .42s ease-out both;
  }

  @keyframes relayGfPulse {
    0%   { filter: brightness(1); }
    35%  { filter: brightness(1.14); }
    100% { filter: brightness(1); }
  }

  @keyframes relayGfImpact {
    0%   {
      filter: brightness(1);
      transform: scale(1);
    }

    35% {
      filter: brightness(1.18);
      transform: scale(1.003);
    }

    100% {
      filter: brightness(1);
      transform: scale(1);
    }
  }

  @keyframes relayGfDanger {
    0%   { filter: brightness(1); }
    25%  { filter: brightness(1.20); }
    55%  { filter: brightness(.96); }
    100% { filter: brightness(1); }
  }

  @keyframes relayGfComplete {
    0%   { filter: brightness(1); }
    35%  { filter: brightness(1.22); }
    70%  { filter: brightness(1.08); }
    100% { filter: brightness(1); }
  }
`;

document.head.appendChild(style);



 const flash = (kind = 'pulse') => {
  const canvas = getCanvas();

  if (!canvas || reducedMotion()) return;

  canvas.classList.remove(
    'relay-gf-pulse',
    'relay-gf-impact',
    'relay-gf-danger',
    'relay-gf-complete'
  );

  void canvas.offsetWidth;

  const className =
    kind === 'impact'
      ? 'relay-gf-impact'
      : kind === 'danger'
        ? 'relay-gf-danger'
        : kind === 'complete'
          ? 'relay-gf-complete'
          : 'relay-gf-pulse';

  canvas.classList.add(className);

  window.setTimeout(() => {
    canvas.classList.remove(
      'relay-gf-pulse',
      'relay-gf-impact',
      'relay-gf-danger',
      'relay-gf-complete'
    );
  }, kind === 'complete' ? 500 : 300);
};

const aliases = {
  'relay:signal': 'pulse',
  'relay:checkpoint': 'pulse',
  'relay:combo': 'pulse',

  'relay:hit': 'impact',
  'relay:dash': 'impact',

  'relay:death': 'danger',

  'relay:mission-complete': 'complete'
};

  Object.keys(aliases).forEach(type => window.addEventListener(type, () => flash(aliases[type])));
  window.relayGameFeelV1 = { flash };
})();
