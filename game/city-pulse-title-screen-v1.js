/* UPDATE 24 — CITY PULSE TITLE SCREEN FUNCTIONALITY */
(() => {
  if (window.__cityPulseTitleV1) return;
  const intro = document.getElementById('intro');
  if (!intro) return;

  intro.classList.add('city-pulse-title');

  const secondary = intro.querySelector('.title-secondary');
  if (secondary && !secondary.querySelector('.city-pulse-status')) {
    const status = document.createElement('div');
    status.className = 'city-pulse-status';
    status.innerHTML = '<i aria-hidden="true"></i><span>CITY NETWORK ONLINE // NIGHT SHIFT</span>';
    secondary.after(status);
  }

  const options = intro.querySelector('[data-title-panel="controls"]');
  if (options) {
    options.querySelector('span').textContent = 'OPTIONS';
    options.querySelector('small').textContent = 'CONTROLS & SETTINGS';
  }

  const start = document.getElementById('start');
  const continueButton = document.getElementById('continue');
  const safeActivate = button => {
    if (!button) return;
    button.addEventListener('pointerdown', () => button.classList.add('cp-pressed'), { passive: true });
    button.addEventListener('pointerup', () => button.classList.remove('cp-pressed'), { passive: true });
    button.addEventListener('pointercancel', () => button.classList.remove('cp-pressed'), { passive: true });
  };
  safeActivate(start);
  safeActivate(continueButton);

  // Keep existing gameplay ownership: this layer only decorates the title screen.
  intro.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.getElementById('titlePanel')?.classList.add('hidden');
      document.getElementById('relayInfoPanel')?.classList.add('hidden');
    }
  });

  window.__cityPulseTitleV1 = true;
  window.dispatchEvent(new CustomEvent('relay:city-pulse-title-ready', { detail: { version: '1.0.0' } }));
})();
