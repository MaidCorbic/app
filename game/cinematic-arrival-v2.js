/* Cinematic Arrival V5 — non-blocking splash handoff. Presentation never gates gameplay. */
(() => {
  if (window.__relayCinematicArrivalV5) return;
  window.__relayCinematicArrivalV5 = true;

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

    const status = document.createElement('div');
    status.className = 'arrival-status';
    status.textContent = 'RELAY NETWORK // SECURE CHANNEL';

    const signal = document.createElement('div');
    signal.className = 'arrival-signal';
    signal.innerHTML = '<i></i><i></i><i></i><span>SYNC</span>';

    const particles = document.createElement('div');
    particles.className = 'arrival-particles';
    particles.innerHTML = '<i></i>'.repeat(10);

    const copy = document.createElement('div');
    copy.className = 'arrival-copy';
    copy.innerHTML = `
      <div class="arrival-center">
        <p class="arrival-kicker">CHAPTER 01 // NIGHT SHIFT</p>
        <h1 class="arrival-title"><span>THE NIGHT</span><br><em>IS ONLINE.</em></h1>
        <div class="arrival-line"></div>
        <p class="arrival-message">THE CITY IS SLEEPING. THE NETWORK IS NOT.<br>ONE RUNNER. ONE SIGNAL. NO SECOND CHANCE.</p>
        <div class="arrival-mission"><small>MISSION 01 // OLD QUARTER</small><b>ROOFTOP RELAY</b><span>FOLLOW THE RELAY · RESTORE THE SIGNAL</span></div>
      </div>`;

    const ui = splash.querySelector('.relay-splash-ui');
    splash.append(status, signal, particles, copy);
    const label = ui?.querySelector('.relay-splash-status');
    if (label) label.textContent = 'RELAY READY';

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      splash.dataset.cinematicReleased = 'true';
      splash.classList.add('is-leaving');
      splash.setAttribute('aria-busy', 'false');
      splash.setAttribute('aria-hidden', 'true');

      // Make the handoff observable immediately. Do not make tests or gameplay
      // wait for a CSS transition to finish before the splash is considered gone.
      splash.hidden = true;
      window.setTimeout(() => splash.remove(), 500);
    };

    // One short painted frame only. The title screen and Phaser runtime own
    // application flow; this presentation layer must never block either.
    window.setTimeout(release, 650);
    window.setTimeout(release, 1200);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
