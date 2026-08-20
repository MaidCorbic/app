/* Cinematic Arrival V2 — presentation-only. It never starts, pauses or changes Phaser gameplay. */
(() => {
  if (window.__relayCinematicArrivalV2) return;
  window.__relayCinematicArrivalV2 = true;

  const start = () => {
    const splash = document.getElementById('relaySplash');
    if (!splash) return;
    splash.classList.add('cinematic-arrival');
    splash.setAttribute('aria-busy', 'true');

    if (!document.querySelector('link[data-cinematic-arrival-v2]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = './cinematic-arrival-v2.css';
      css.dataset.cinematicArrivalV2 = 'true';
      document.head.appendChild(css);
    }

    if (splash.querySelector('.arrival-copy')) return;

    const status = document.createElement('div');
    status.className = 'arrival-status';
    status.textContent = 'RELAY NETWORK // SECURE CHANNEL';

    const particles = document.createElement('div');
    particles.className = 'arrival-particles';
    particles.innerHTML = '<i></i>'.repeat(6);

    const copy = document.createElement('div');
    copy.className = 'arrival-copy';
    copy.innerHTML = `
      <div class="arrival-center">
        <p class="arrival-kicker">CHAPTER 01 // NIGHT SHIFT</p>
        <h1 class="arrival-title">THE NIGHT<br><em>IS ONLINE.</em></h1>
        <div class="arrival-line"></div>
        <p class="arrival-message">THE CITY IS SLEEPING. THE NETWORK IS NOT.<br>ONE RUNNER. ONE SIGNAL. NO SECOND CHANCE.</p>
        <div class="arrival-mission">
          <small>MISSION 01 // OLD QUARTER</small>
          <b>ROOFTOP RELAY</b>
          <span>FOLLOW THE RELAY · RESTORE THE SIGNAL</span>
        </div>
      </div>`;

    const ui = splash.querySelector('.relay-splash-ui');
    splash.append(status, particles, copy);

    // Keep the existing loader's progress bar. This layer only makes its pacing cinematic.
    if (ui) {
      ui.querySelector('.relay-splash-status')?.setAttribute('data-original-status', 'true');
      ui.querySelector('.relay-splash-status').textContent = 'ESTABLISHING RELAY';
    }

    const stages = [
      [700, 'ESTABLISHING RELAY'],
      [2200, 'SIGNAL ACQUIRED // OLD QUARTER'],
      [3900, 'ROUTE LOCKED // ROOFTOP RELAY'],
      [5400, 'DELIVERY WINDOW OPEN'],
      [6800, 'MISSION LINK STABLE'],
      [8200, 'PREPARING RUN'],
    ];
    const label = ui?.querySelector('.relay-splash-status');
    stages.forEach(([delay, text]) => window.setTimeout(() => { if (!splash.classList.contains('is-leaving')) { if (label) label.textContent = text; } }, delay));

    // Never interfere with the engine. Only release the existing splash after the cinematic has had time to play.
    const release = () => {
      if (splash.dataset.cinematicReleased === 'true') return;
      splash.dataset.cinematicReleased = 'true';
      splash.classList.add('is-leaving');
      splash.setAttribute('aria-busy', 'false');
      window.setTimeout(() => splash.remove(), 850);
    };

    window.setTimeout(release, 9200);
    window.setTimeout(() => {
      if (!splash.dataset.cinematicReleased) release();
    }, 12000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
