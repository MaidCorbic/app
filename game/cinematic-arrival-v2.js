/* Cinematic Arrival V3 — presentation only, always fails open. */
(() => {
  if (window.__relayCinematicArrivalV3) return;
  window.__relayCinematicArrivalV3 = true;

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
    if (ui) ui.querySelector('.relay-splash-status')?.setAttribute('data-original-status', 'true');
    const label = ui?.querySelector('.relay-splash-status');
    if (label) label.textContent = 'INITIALIZING RELAY';

    const stages = [
      [350, 'INITIALIZING RELAY'],
      [900, 'SEARCHING FOR SIGNAL'],
      [1450, 'SIGNAL ACQUIRED // OLD QUARTER'],
      [2100, 'ROUTE LOCKED // ROOFTOP RELAY'],
      [2750, 'DELIVERY WINDOW OPEN'],
      [3350, 'MISSION LINK STABLE'],
      [3900, 'PREPARING RUN'],
    ];
    stages.forEach(([delay, text]) => window.setTimeout(() => {
      if (!splash.classList.contains('is-leaving') && label) label.textContent = text;
    }, delay));

    let released = false;
    const release = reason => {
      if (released || !document.body.contains(splash)) return;
      released = true;
      splash.dataset.cinematicReleased = 'true';
      splash.classList.add('is-leaving');
      splash.setAttribute('aria-busy', 'false');
      window.setTimeout(() => splash.remove(), 450);
      window.dispatchEvent(new CustomEvent('relay:splash-released', { detail: { reason } }));
    };

    const waitForCanvas = () => {
      if (released) return;
      if (document.querySelector('#phaser-game canvas')) {
        release('phaser-ready');
        return;
      }
      window.setTimeout(waitForCanvas, 100);
    };
    waitForCanvas();

    window.setTimeout(() => release('cinematic-max-time'), 4800);
    window.setTimeout(() => release('cinematic-hard-failsafe'), 6500);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();