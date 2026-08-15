(() => {
  if (window.__relayWorldAtmosphereInstalled) return;
  window.__relayWorldAtmosphereInstalled = true;

  const root = document.getElementById('intro');
  if (!root) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './world-atmosphere.css';
  document.head.appendChild(stylesheet);

  const moon = root.querySelector('.backdrop-moon');
  const sun = document.createElement('div');
  sun.className = 'backdrop-sun';
  sun.setAttribute('aria-hidden', 'true');
  root.appendChild(sun);

  const sunStyle = document.createElement('style');
  sunStyle.textContent = `
    #intro.intro .backdrop-sun{position:absolute;z-index:1;width:clamp(70px,9vw,130px);aspect-ratio:1;border-radius:50%;left:var(--relay-sun-x,50%);top:var(--relay-sun-y,20%);transform:translate(-50%,-50%);background:radial-gradient(circle at 42% 38%,#fffdf0 0 20%,#ffe8a6 45%,#ffc45f 72%,rgba(255,174,62,0) 100%);box-shadow:0 0 35px 12px rgba(255,194,92,.28),0 0 110px 38px rgba(255,154,63,.16);opacity:0;pointer-events:none;transition:left 1.8s ease,top 1.8s ease,opacity 1.8s ease,filter 1.8s ease;animation:relay-sun-pulse 6s ease-in-out infinite}
    #intro.intro .backdrop-sun::after{content:"";position:absolute;inset:-30%;border-radius:50%;background:radial-gradient(circle,rgba(255,220,140,.16),transparent 68%);filter:blur(8px)}
    @keyframes relay-sun-pulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.04)}}
    @media(max-width:700px){#intro.intro .backdrop-sun{width:clamp(58px,15vw,94px);box-shadow:0 0 28px 9px rgba(255,194,92,.24),0 0 75px 24px rgba(255,154,63,.13)}}
    @media(max-width:420px){#intro.intro .backdrop-sun{width:60px}}
    @media(prefers-reduced-motion:reduce){#intro.intro .backdrop-sun{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(sunStyle);

  const getHour = () => {
    const override = window.__relayAtmosphereDebugHour;
    if (Number.isFinite(override)) return override;
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  };

  const getTheme = () => {
    const hour = getHour();
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 18) return 'day';
    if (hour >= 18 && hour < 20) return 'dusk';
    if (hour >= 20 && hour < 23) return 'night';
    return 'deep-night';
  };

  const updateCelestialBodies = (hour, theme) => {
    const sunVisible = hour >= 5 && hour < 20;
    const moonVisible = hour >= 20 || hour < 5;

    if (moon) {
      moon.style.opacity = moonVisible ? '' : '0';
    }

    if (!sunVisible) {
      sun.style.opacity = '0';
      return;
    }

    // Continuous sun arc: sunrise 05:00, highest point at noon, sunset 20:00.
    const progress = Math.min(1, Math.max(0, (hour - 5) / 15));
    const x = 9 + progress * 82;
    const y = 72 - Math.sin(progress * Math.PI) * 61;
    root.style.setProperty('--relay-sun-x', `${x}%`);
    root.style.setProperty('--relay-sun-y', `${y}%`);
    sun.style.opacity = '1';
    sun.dataset.theme = theme;
  };

  const update = () => {
    const hour = getHour();
    const next = getTheme();
    const previous = root.dataset.atmosphere;
    root.dataset.atmosphere = next;
    updateCelestialBodies(hour, next);

    if (previous && previous !== next) {
      root.classList.remove('atmosphere-shift');
      void root.offsetWidth;
      root.classList.add('atmosphere-shift');
      window.setTimeout(() => root.classList.remove('atmosphere-shift'), 1400);
    }

    window.dispatchEvent(new CustomEvent('relay-atmosphere-change', {
      detail: { theme: next, hour }
    }));
  };

  window.__relayUpdateAtmosphere = update;
  window.__relaySetAtmosphereDebugHour = hour => {
    if (!Number.isFinite(hour)) return;
    window.__relayAtmosphereDebugHour = hour;
    update();
  };
  window.__relayClearAtmosphereDebug = () => {
    delete window.__relayAtmosphereDebugHour;
    update();
  };

  update();
  window.setInterval(update, 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) update();
  });
})();
