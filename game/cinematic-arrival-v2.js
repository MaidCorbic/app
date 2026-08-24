/* Cinematic Arrival V3 — lightweight presentation layer. Never drives Phaser. */
(() => {
  if (window.__relayCinematicArrivalV3) return;
  window.__relayCinematicArrivalV3 = true;

  const start = () => {
    const splash = document.getElementById('relaySplash');
    if (!splash || splash.dataset.cinematicBound === 'true') return;
    splash.dataset.cinematicBound = 'true';
    splash.classList.add('cinematic-arrival');
    splash.setAttribute('aria-busy', 'true');

    if (!document.querySelector('link[data-cinematic-arrival-v2]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = './cinematic-arrival-v2.css';
      css.dataset.cinematicArrivalV2 = 'true';
      css.addEventListener('error', () => {
        css.dataset.failed = 'true';
      }, { once: true });
      document.head.appendChild(css);
    }

    if (splash.querySelector('.arrival-copy')) return;

    const make = (tag, className, text) => {
      const el = document.createElement(tag);
      el.className = className;
      if (text) el.textContent = text;
      return el;
    };

    const status = make('div', 'arrival-status', 'RELAY NETWORK // SECURE CHANNEL');
    const signal = make('div', 'arrival-signal');
    signal.innerHTML = '<i></i><i></i><i></i><span>SYNC</span>';

    const particles = make('div', 'arrival-particles');
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 10; i += 1) fragment.appendChild(document.createElement('i'));
    particles.appendChild(fragment);

    const copy = make('div', 'arrival-copy');
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

    const label = ui?.querySelector('.relay-splash-status') || null;
    if (label) label.textContent = 'INITIALIZING RELAY';

    const timers = new Set();
    const later = (fn, delay) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, delay);
      timers.add(id);
      return id;
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

    let released = false;
    let removalTimer = 0;
    const release = () => {
      if (released) return;
      released = true;
      timers.forEach(id => window.clearTimeout(id));
      timers.clear();
      splash.dataset.cinematicReleased = 'true';
      splash.classList.add('is-leaving');
      splash.setAttribute('aria-busy', 'false');
      removalTimer = window.setTimeout(() => splash.remove(), 900);
    };

    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      stages.forEach(([delay, text]) => later(() => {
        if (!released && label) label.textContent = text;
      }, delay));
      later(release, 15800);
    } else {
      if (label) label.textContent = 'READY';
      later(release, 900);
    }

    window.addEventListener('pagehide', release, { once: true, passive: true });
    later(() => {
      if (!released) release();
    }, 18500);

    window.addEventListener('beforeunload', () => {
      timers.forEach(id => window.clearTimeout(id));
      timers.clear();
      if (removalTimer) window.clearTimeout(removalTimer);
    }, { once: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
