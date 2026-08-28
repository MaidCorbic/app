/* Isolated Play cinematic. It does not replace or modify gameplay logic. */
(() => {
  if (window.__relayPlayIntroV2) return;
  window.__relayPlayIntroV2 = true;
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = './play-intro-cinematic-v2.css';
  css.dataset.relayPlayIntroV2 = 'true';
  document.head.appendChild(css);
  let running = false;
  let armed = false;
  const build = () => {
    const root = document.createElement('section');
    root.id = 'relayPlayCinematic';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `<div class="ric-art"></div><div class="ric-grid"></div><div class="ric-scan"></div><div class="ric-noise"></div><div class="ric-ui"><div class="ric-center"><div class="ric-kicker" data-ric-kicker>RELAY NETWORK // SECURE CHANNEL</div><h2 class="ric-title" data-ric-title>THE NIGHT<br><em>IS ONLINE.</em></h2><p class="ric-copy" data-ric-copy></p><div class="ric-mission" data-ric-mission><small>CHAPTER 01 // MISSION 01</small><b>ROOFTOP RELAY</b><span>FOLLOW THE RELAY • RESTORE THE SIGNAL</span><i aria-hidden="true"></i></div></div></div><div class="ric-footer" data-ric-footer><i></i>INITIALIZING RUN</div><div class="ric-flash" data-ric-flash></div>`;
    document.body.appendChild(root);
    return root;
  };
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  const run = async button => {
    if (running) return;
    running = true;
    const root=build();
    const kicker=root.querySelector('[data-ric-kicker]'), title=root.querySelector('[data-ric-title]'), copy=root.querySelector('[data-ric-copy]'), mission=root.querySelector('[data-ric-mission]'), footer=root.querySelector('[data-ric-footer]'), flash=root.querySelector('[data-ric-flash]');
    root.classList.add('is-active'); root.setAttribute('aria-hidden','false'); button.setAttribute('aria-busy','true');
    await wait(220); kicker.classList.add('show');
    await wait(420); title.classList.add('show');
    await wait(560); copy.innerHTML='THE CITY IS SLEEPING. THE NETWORK IS NOT.<br>ONE RUNNER. ONE SIGNAL.'; copy.classList.add('show');
    await wait(620); mission.classList.add('show');
    await wait(850); kicker.textContent='SIGNAL ACQUIRED // OLD QUARTER';
    await wait(420); footer.innerHTML='<i></i>MISSION LINK STABLE // LAUNCHING'; footer.classList.add('show');
    await wait(720); flash.classList.add('fire');
    await wait(140); root.classList.add('is-exiting');
    await wait(430); root.remove();
    armed=true; button.removeAttribute('aria-busy'); running=false; button.click(); armed=false;
  };
  const capturePlay = event => {
    const button=event.target.closest?.('#start');
    if(!button||armed||running)return;
    event.preventDefault(); event.stopImmediatePropagation(); run(button);
  };
  document.addEventListener('click',capturePlay,true);
})();
