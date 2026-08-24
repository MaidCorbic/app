/* Cinematic Arrival V3 — presentation-only. Keeps the current gameplay/HUD branch intact. */
(() => {
  if (window.__relayCinematicArrivalV3) return;
  window.__relayCinematicArrivalV3 = true;

  const start = () => {
    const splash = document.getElementById('relaySplash');
    if (!splash) return;

    splash.classList.add('cinematic-arrival');
    splash.setAttribute('aria-busy', 'true');

    // Resolve through the module URL so Vite/Vercel emits the CSS asset correctly.
    if (!document.querySelector('link[data-cinematic-arrival-v2]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = new URL('./cinematic-arrival-v2.css', import.meta.url).href;
      css.dataset.cinematicArrivalV2 = 'true';
      css.addEventListener('error', () => {
        // The cinematic remains presentation-only and must never block Home.
        splash.classList.add('cinematic-style-fallback');
      }, { once: true });
      document.head.appendChild(css);
    }

    if (splash.querySelector('.arrival-copy')) return;

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
        <div class="arrival-mission">
          <small>MISSION 01 // OLD QUARTER</small>
          <b>ROOFTOP RELAY</b>
          <span>FOLLOW THE RELAY · RESTORE THE SIGNAL</span>
        </div>
      </div>`;

    const ui = splash.querySelector('.relay-splash-ui');
    splash.append(status, signal, particles, copy);

    const label = ui?.querySelector('.relay-splash-status');
    label?.setAttribute('data-original-status', 'true');
    if (label) label.textContent = 'INITIALIZING RELAY';

    const timers = new Set();
    const later = (callback, delay) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        callback();
      }, delay);
      timers.add(id);
      return id;
    };

    let released = false;
    const release = () => {
      if (released || !splash.isConnected) return;
      released = true;
      timers.forEach(id => window.clearTimeout(id));
      timers.clear();
      splash.dataset.cinematicReleased = 'true';
      splash.classList.add('is-leaving');
      splash.setAttribute('aria-busy', 'false');
      later(() => splash.remove(), 1100);
    };

    const stages = [
      [900, 'INITIALIZING RELAY'],
      [2600, 'SEARCHING FOR SIGNAL'],
      [4400, 'SIGNAL ACQUIRED // OLD QUARTER'],
      [6500, 'ROUTE LOCKED // ROOFTOP RELAY'],
      [8400, 'DELIVERY WINDOW OPEN'],
      [10600, 'MISSION LINK STABLE'],
      [12800, 'PREPARING RUN'],
      [14500, 'LAUNCHING INTO THE NIGHT'],
    ];

    stages.forEach(([delay, text]) => later(() => {
      if (!released && label) label.textContent = text;
    }, delay));

    later(release, 15800);
    later(release, 18500);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
