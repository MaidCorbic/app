import './cinematic-arrival-v2.css';

// Cinematic Arrival V4: presentation-only. No fake progress bar; the splash/entry
// animation is released by runtime readiness or a short safety timeout.
(() => {
  if (window.__relayCinematicArrivalV4) return;
  window.__relayCinematicArrivalV4 = true;

  const cssClass = 'cinematic-arrival';
  const removeEntry = entry => {
    if (!entry || entry.dataset.released === '1') return;
    entry.dataset.released = '1';
    entry.classList.add('is-leaving');
    window.setTimeout(() => entry.remove(), 750);
  };

  const splashStart = splash => {
    if (!splash || splash.dataset.cinematicV4 === '1') return;
    splash.dataset.cinematicV4 = '1';
    splash.classList.add(cssClass);
    splash.querySelector('.relay-splash-ui')?.setAttribute('hidden', 'hidden');
    const copy = document.createElement('div');
    copy.className = 'arrival-copy v4-copy';
    copy.innerHTML = `<div class="arrival-center"><p class="arrival-kicker">CHAPTER 01 // NIGHT SHIFT</p><h1 class="arrival-title"><span>RELAY</span><br><em>RUNNER</em></h1><div class="arrival-line"></div><p class="arrival-message">THE CITY IS SLEEPING. THE NETWORK IS NOT.</p><div class="arrival-mission"><small>OLD QUARTER</small><b>ROOFTOP RELAY</b><span>SECURE THE SIGNAL</span></div></div>`;
    splash.appendChild(copy);
    const release = () => { splash.classList.add('is-leaving'); splash.setAttribute('aria-busy','false'); window.setTimeout(() => splash.remove(), 900); };
    window.addEventListener('relay:runner-scene-ready', release, { once:true, passive:true });
    window.setTimeout(release, 4200);
  };

  const homeStart = () => {
    const intro = document.getElementById('intro');
    if (!intro || intro.dataset.homeEntryV4 === '1') return;
    intro.dataset.homeEntryV4 = '1';
    intro.classList.add('relay-home-entrance-v4');
    const title = intro.querySelector('.title-lockup');
    if (title) title.classList.add('relay-home-title-enter');
    window.setTimeout(() => intro.classList.add('relay-home-entrance-done'), 1400);
  };

  const start = () => {
    const splash = document.getElementById('relaySplash');
    if (splash) splashStart(splash);
    homeStart();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();
