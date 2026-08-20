/* PLAY CINEMATIC V1 — runs after PLAY NOW and before gameplay */
(() => {
  if (window.__relayPlayCinematicV1) return;
  window.__relayPlayCinematicV1 = true;

  const build = () => {
    if (document.getElementById('playCinematic')) return document.getElementById('playCinematic');
    const el = document.createElement('section');
    el.id = 'playCinematic';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="pc-grid"></div><div class="pc-scan"></div><div class="pc-vignette"></div>
      <div class="pc-core">
        <div class="pc-status" data-pc-status>RELAY LINK // ESTABLISHING</div>
        <h2 class="pc-title">THE NIGHT<br><em>IS ONLINE.</em></h2>
        <p class="pc-sub" data-pc-copy>THE CITY IS SLEEPING. THE NETWORK IS NOT.<br>ONE RUNNER. ONE SIGNAL. NO SECOND CHANCE.</p>
        <div class="pc-mission"><small>CHAPTER 01 / MISSION 01</small><b>ROOFTOP RELAY</b><span>FOLLOW THE RELAY • RESTORE THE SIGNAL</span></div>
        <div class="pc-line"></div>
        <div class="pc-enter"><i></i>INITIALIZING RUN</div>
      </div><div class="pc-flash"></div>`;
    document.body.appendChild(el);
    return el;
  };

  const start = () => {
    const cinematic = build();
    cinematic.classList.add('is-active');
    cinematic.setAttribute('aria-hidden', 'false');

    const startButton = document.getElementById('start');
    if (startButton) startButton.disabled = true;

    const status = cinematic.querySelector('[data-pc-status]');
    const copy = cinematic.querySelector('[data-pc-copy]');
    const mission = cinematic.querySelector('.pc-mission');
    const enter = cinematic.querySelector('.pc-enter');
    const flash = cinematic.querySelector('.pc-flash');

    // Extended sequence: deliberately longer than the boot splash.
    const timeline = [
      [0,  () => { status.textContent = 'RELAY LINK // ESTABLISHING'; }],
      [1800, () => { status.textContent = 'SIGNAL ACQUIRED // OLD QUARTER'; }],
      [3500, () => { copy.innerHTML = 'THE CITY IS SLEEPING. THE NETWORK IS NOT.<br>ONE RUNNER. ONE SIGNAL. NO SECOND CHANCE.'; }],
      [5200, () => { mission.style.animation = 'pcIn .8s forwards'; }],
      [6900, () => { status.textContent = 'MISSION LINK // STABLE'; }],
      [8100, () => { enter.innerHTML = '<i></i>LAUNCHING INTO THE NIGHT'; }],
      [9300, () => {
        flash.classList.remove('fire'); void flash.offsetWidth; flash.classList.add('fire');
        cinematic.classList.add('is-leaving');
      }],
      [9900, () => {
        cinematic.classList.remove('is-active', 'is-leaving');
        cinematic.setAttribute('aria-hidden', 'true');
        cinematic.remove();
        document.getElementById('intro')?.classList.add('hidden');
        document.getElementById('play')?.classList.add('is-playing');
        startButton?.removeAttribute('disabled');
        document.dispatchEvent(new CustomEvent('relay:play-cinematic-complete'));
      }]
    ];
    timeline.forEach(([delay, fn]) => window.setTimeout(fn, delay));
  };

  const hook = () => {
    const button = document.getElementById('start');
    if (!button || button.dataset.cinematicBound) return false;
    button.dataset.cinematicBound = 'true';
    button.addEventListener('click', event => { event.preventDefault(); start(); });
    return true;
  };

  if (!hook()) {
    const observer = new MutationObserver(() => { if (hook()) observer.disconnect(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = './play-cinematic-v1.css'; css.dataset.playCinematicV1 = 'true';
  document.head.appendChild(css);
})();
