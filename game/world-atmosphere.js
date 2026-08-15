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
    #intro.intro .backdrop-sun{position:absolute;z-index:1;width:clamp(70px,9vw,130px);aspect-ratio:1;border-radius:50%;left:var(--relay-sun-x,50%);top:var(--relay-sun-y,20%);transform:translate(-50%,-50%);background:radial-gradient(circle at 42% 38%,#fffdf0 0 20%,#ffe8a6 45%,#ffc45f 72%,rgba(255,174,62,0) 100%);box-shadow:0 0 35px 12px rgba(255,194,92,.28),0 0 110px 38px rgba(255,154,63,.16);opacity:0;pointer-events:none;transition:left 1.8s ease,top 1.8s ease,opacity 1.8s ease,filter 1.8s ease,background 1.8s ease,box-shadow 1.8s ease;animation:relay-sun-pulse 6s ease-in-out infinite}
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

  const hexToRgb = hex => {
    const value = hex.replace('#', '');
    const normalized = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
    const number = Number.parseInt(normalized, 16);
    return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
  };

  const rgbToHex = ({ r, g, b }) => {
    const channel = value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
    return `#${channel(r)}${channel(g)}${channel(b)}`;
  };

  const mixHex = (from, to, amount) => {
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    return rgbToHex({
      r: a.r + (b.r - a.r) * amount,
      g: a.g + (b.g - a.g) * amount,
      b: a.b + (b.b - a.b) * amount
    });
  };

  const DAYLIGHT_STOPS = [
    { hour: 5,  skyTop: '#101b31', skyMid: '#3e5267', horizon: '#c87868', glow: '#f2a36f', cityBack: '#304258', cityFront: '#1b2d41', window: '#d9b37a', fog: '#d9a78f' },
    { hour: 7,  skyTop: '#315878', skyMid: '#7797a8', horizon: '#d8b28d', glow: '#ffd29a', cityBack: '#536a7b', cityFront: '#344b5e', window: '#d9bc91', fog: '#d8d7d0' },
    { hour: 10, skyTop: '#4384ad', skyMid: '#8fb5c4', horizon: '#cdd9d4', glow: '#fff0c8', cityBack: '#607a88', cityFront: '#405968', window: '#c9b995', fog: '#e2e9e8' },
    { hour: 13, skyTop: '#5c98bf', skyMid: '#a6c8d4', horizon: '#dbe1db', glow: '#fff7dd', cityBack: '#708794', cityFront: '#526a78', window: '#b9a98c', fog: '#edf2ef' },
    { hour: 16, skyTop: '#4e86aa', skyMid: '#9ab5bf', horizon: '#d8c9b9', glow: '#ffe1ad', cityBack: '#5f7685', cityFront: '#435b6b', window: '#cbb58e', fog: '#e1e5df' },
    { hour: 18, skyTop: '#29243b', skyMid: '#6f4a5a', horizon: '#d47a60', glow: '#ff9a62', cityBack: '#304056', cityFront: '#1b2d42', window: '#e7ad64', fog: '#d9a095' },
    { hour: 20, skyTop: '#040b17', skyMid: '#0a1a2d', horizon: '#173b58', glow: '#56aae4', cityBack: '#0d2338', cityFront: '#081628', window: '#ffcf70', fog: '#6f9cc2' }
  ];

  const interpolateStop = hour => {
    const clamped = Math.min(20, Math.max(5, hour));
    for (let index = 0; index < DAYLIGHT_STOPS.length - 1; index += 1) {
      const from = DAYLIGHT_STOPS[index];
      const to = DAYLIGHT_STOPS[index + 1];
      if (clamped >= from.hour && clamped <= to.hour) {
        const amount = (clamped - from.hour) / (to.hour - from.hour);
        return Object.fromEntries(Object.keys(from).filter(key => key !== 'hour').map(key => [key, mixHex(from[key], to[key], amount)]));
      }
    }
    return DAYLIGHT_STOPS[DAYLIGHT_STOPS.length - 1];
  };

  const applyRealisticDaylight = hour => {
    if (hour < 5 || hour >= 20) {
      ['--atm-sky-top', '--atm-sky-mid', '--atm-horizon', '--atm-glow', '--atm-city-back', '--atm-city-front', '--atm-window', '--atm-fog'].forEach(variable => root.style.removeProperty(variable));
      return;
    }

    const palette = interpolateStop(hour);
    root.style.setProperty('--atm-sky-top', palette.skyTop);
    root.style.setProperty('--atm-sky-mid', palette.skyMid);
    root.style.setProperty('--atm-horizon', palette.horizon);
    root.style.setProperty('--atm-glow', palette.glow);
    root.style.setProperty('--atm-city-back', palette.cityBack);
    root.style.setProperty('--atm-city-front', palette.cityFront);
    root.style.setProperty('--atm-window', palette.window);
    root.style.setProperty('--atm-fog', palette.fog);

    const noonDistance = Math.abs(hour - 12) / 7;
    const daylight = Math.max(0, 1 - noonDistance * 0.22);
    root.style.setProperty('--atm-city-light', `${(0.05 + (1 - daylight) * 0.12).toFixed(3)}`);
    root.style.setProperty('--atm-rain', `${Math.max(0.01, 0.06 - daylight * 0.045).toFixed(3)}`);
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

    const daylightPalette = interpolateStop(hour);
    const sunWarmth = hour < 8 ? 0.8 : hour < 16 ? 0.05 : hour < 19 ? 0.7 : 1;
    const core = sunWarmth > 0.5 ? '#fff1cf' : '#fffdf5';
    const edge = sunWarmth > 0.5 ? '#ffb45f' : '#ffd978';
    sun.style.background = `radial-gradient(circle at 42% 38%,${core} 0 20%,#ffe9a7 45%,${edge} 72%,rgba(255,174,62,0) 100%)`;
    sun.style.boxShadow = `0 0 35px 12px ${daylightPalette.glow}66,0 0 110px 38px ${daylightPalette.glow}33`;
    sun.style.opacity = '1';
    sun.dataset.theme = theme;
  };

  const update = () => {
    const hour = getHour();
    const next = getTheme();
    const previous = root.dataset.atmosphere;
    root.dataset.atmosphere = next;
    applyRealisticDaylight(hour);
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
