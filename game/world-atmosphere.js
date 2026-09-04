(() => {
  if (window.__relayWorldAtmosphereInstalled) return;
  window.__relayWorldAtmosphereInstalled = true;

  const root = document.getElementById('intro');
  if (!root) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './world-atmosphere.css';
  document.head.appendChild(stylesheet);

  const backdrop = root.querySelector('.menu-backdrop');
  const moon = root.querySelector('.backdrop-moon');

  const sun = document.createElement('div');
  sun.className = 'backdrop-sun';
  sun.setAttribute('aria-hidden', 'true');
  root.appendChild(sun);

  const sunStyle = document.createElement('style');

  sunStyle.textContent = `
    #intro.intro .backdrop-sun{
      position:absolute;
      z-index:1;
      width:clamp(70px,9vw,130px);
      aspect-ratio:1;
      border-radius:50%;
      left:var(--relay-sun-x,50%);
      top:var(--relay-sun-y,20%);
      transform:translate(-50%,-50%);
      background:
        radial-gradient(
          circle at 42% 38%,
          #fffdf0 0 20%,
          #ffe8a6 45%,
          #ffc45f 72%,
          rgba(255,174,62,0) 100%
        );
      box-shadow:
        0 0 35px 12px rgba(255,194,92,.28),
        0 0 110px 38px rgba(255,154,63,.16);
      opacity:0;
      pointer-events:none;
      transition:
        left 1.8s ease,
        top 1.8s ease,
        opacity 1.8s ease,
        filter 1.8s ease,
        background 1.8s ease,
        box-shadow 1.8s ease;
      animation:
        relay-sun-pulse 6s ease-in-out infinite;
    }

    #intro.intro .backdrop-sun::after{
      content:"";
      position:absolute;
      inset:-30%;
      border-radius:50%;
      background:
        radial-gradient(
          circle,
          rgba(255,220,140,.16),
          transparent 68%
        );
      filter:blur(8px);
    }

    @keyframes relay-sun-pulse{
      0%,100%{
        filter:brightness(1);
      }

      50%{
        filter:brightness(1.04);
      }
    }

    @media(max-width:700px){
      #intro.intro .backdrop-sun{
        width:clamp(58px,15vw,94px);

        box-shadow:
          0 0 28px 9px rgba(255,194,92,.24),
          0 0 75px 24px rgba(255,154,63,.13);
      }
    }

    @media(max-width:420px){
      #intro.intro .backdrop-sun{
        width:60px;
      }
    }

    @media(prefers-reduced-motion:reduce){
      #intro.intro .backdrop-sun{
        animation:none!important;
        transition:none!important;
      }
    }
  `;

  document.head.appendChild(sunStyle);


  const getHour = () => {
    const override = window.__relayAtmosphereDebugHour;

    if (Number.isFinite(override)) {
      return override;
    }

    const now = new Date();

    return (
      now.getHours() +
      now.getMinutes() / 60
    );
  };


  const getTheme = () => {
    const hour = getHour();

    if (hour >= 5 && hour < 8) {
      return 'dawn';
    }

    if (hour >= 8 && hour < 18) {
      return 'day';
    }

    if (hour >= 18 && hour < 20) {
      return 'dusk';
    }

    if (hour >= 20 && hour < 23) {
      return 'night';
    }

    return 'deep-night';
  };


  const hexToRgb = hex => {
    const value = hex.replace('#', '');

    const normalized =
      value.length === 3
        ? value
            .split('')
            .map(char => char + char)
            .join('')
        : value;

    const number = Number.parseInt(normalized, 16);

    return {
      r: (number >> 16) & 255,
      g: (number >> 8) & 255,
      b: number & 255
    };
  };


  const rgbToHex = ({ r, g, b }) => {
    const channel = value =>
      Math.max(
        0,
        Math.min(255, Math.round(value))
      )
        .toString(16)
        .padStart(2, '0');

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
    {
      hour:5,
      skyTop:'#10172d',
      skyMid:'#4c526b',
      horizon:'#e08a70',
      glow:'#ff9b68',
      cityBack:'#35445a',
      cityFront:'#1d2d40',
      window:'#d8ad73',
      fog:'#d9a18e'
    },

    {
      hour:7,
      skyTop:'#385a78',
      skyMid:'#a17f88',
      horizon:'#f0c092',
      glow:'#ffd49b',
      cityBack:'#596d7b',
      cityFront:'#394e5d',
      window:'#d8bd91',
      fog:'#ddd6cf'
    },

    {
      hour:10,
      skyTop:'#4f8fb7',
      skyMid:'#9ec3cf',
      horizon:'#d9ded6',
      glow:'#fff0c8',
      cityBack:'#647c89',
      cityFront:'#435b69',
      window:'#c9b995',
      fog:'#e3e9e7'
    },

    {
      hour:13,
      skyTop:'#72acd0',
      skyMid:'#b8d3dc',
      horizon:'#e7e7df',
      glow:'#fff8df',
      cityBack:'#788f9b',
      cityFront:'#586f7c',
      window:'#b9a98c',
      fog:'#edf2ef'
    },

    {
      hour:16,
      skyTop:'#659bbd',
      skyMid:'#b0c3c7',
      horizon:'#e2d0b9',
      glow:'#ffe0a6',
      cityBack:'#667d89',
      cityFront:'#485f6d',
      window:'#cdb48b',
      fog:'#e4e6df'
    },

    {
      hour:18,
      skyTop:'#352c47',
      skyMid:'#805263',
      horizon:'#e18461',
      glow:'#ff9a5d',
      cityBack:'#35465a',
      cityFront:'#1d2d42',
      window:'#e9ae62',
      fog:'#d9a092'
    },

    {
      hour:20,
      skyTop:'#040b17',
      skyMid:'#0a1a2d',
      horizon:'#173b58',
      glow:'#56aae4',
      cityBack:'#0d2338',
      cityFront:'#081628',
      window:'#ffcf70',
      fog:'#6f9cc2'
    }
  ];


  const interpolateStop = hour => {
    const clamped =
      Math.min(20, Math.max(5, hour));

    for (
      let index = 0;
      index < DAYLIGHT_STOPS.length - 1;
      index += 1
    ) {
      const from = DAYLIGHT_STOPS[index];
      const to = DAYLIGHT_STOPS[index + 1];

      if (
        clamped >= from.hour &&
        clamped <= to.hour
      ) {
        const amount =
          (clamped - from.hour) /
          (to.hour - from.hour);

        return Object.fromEntries(
          Object.keys(from)
            .filter(key => key !== 'hour')
            .map(key => [
              key,
              mixHex(
                from[key],
                to[key],
                amount
              )
            ])
        );
      }
    }

    return DAYLIGHT_STOPS[
      DAYLIGHT_STOPS.length - 1
    ];
  };


  const applySceneDirect = (
    hour,
    palette,
    theme
  ) => {
    if (!backdrop) return;

    let scene;

    if (theme === 'night') {
      scene = {
        top:'#040b17',
        mid:'#0a1a2d',
        horizon:'#173b58',
        ground:'#04080f',
        glow:'rgba(86,170,228,.18)'
      };
    }

    else if (theme === 'deep-night') {
      scene = {
        top:'#01050d',
        mid:'#040c18',
        horizon:'#0b263e',
        ground:'#02050a',
        glow:'rgba(69,133,187,.12)'
      };
    }

    else {
      scene = {
        top:palette.skyTop,
        mid:palette.skyMid,
        horizon:palette.horizon,
        ground:
          hour < 7
            ? '#17121b'
            : hour < 18
              ? '#38484b'
              : '#120b14',
        glow:
          `rgb(
            ${hexToRgb(palette.glow).r}
            ${hexToRgb(palette.glow).g}
            ${hexToRgb(palette.glow).b}
            / .28
          )`
      };
    }


    const sunX =
      root.style
        .getPropertyValue('--relay-sun-x')
        .trim() || '50%';

    const sunY =
      root.style
        .getPropertyValue('--relay-sun-y')
        .trim() || '20%';


    const sunGlow =
      theme === 'dawn' ||
      theme === 'dusk' ||
      theme === 'day'
        ? `radial-gradient(
            circle at ${sunX} ${sunY},
            ${scene.glow},
            transparent 25%
          )`
        : 'none';


    const nightGlow =
      theme === 'night' ||
      theme === 'deep-night'
        ? `radial-gradient(
            circle at 82% 14%,
            ${
              theme === 'night'
                ? 'rgba(249,201,121,.18)'
                : 'rgba(119,168,205,.12)'
            },
            transparent 19%
          )`
        : 'none';


    backdrop.style.background =
      `${sunGlow},
       ${nightGlow},
       radial-gradient(
         ellipse at 50% 67%,
         ${scene.glow},
         transparent 48%
       ),
       linear-gradient(
         180deg,
         ${scene.top} 0%,
         ${scene.mid} 48%,
         ${scene.horizon} 76%,
         ${scene.ground} 100%
       )`;

    root.style.backgroundColor =
      scene.ground;
  };


  const applyRealisticDaylight = hour => {
    const theme = getTheme();

    if (hour < 5 || hour >= 20) {
      [
        '--atm-sky-top',
        '--atm-sky-mid',
        '--atm-horizon',
        '--atm-glow',
        '--atm-city-back',
        '--atm-city-front',
        '--atm-window',
        '--atm-fog',
        '--atm-city-light',
        '--atm-rain'
      ].forEach(variable => {
        root.style.removeProperty(variable);
      });

      return;
    }


    const palette =
      interpolateStop(hour);

    root.style.setProperty(
      '--atm-sky-top',
      palette.skyTop
    );

    root.style.setProperty(
      '--atm-sky-mid',
      palette.skyMid
    );

    root.style.setProperty(
      '--atm-horizon',
      palette.horizon
    );

    root.style.setProperty(
      '--atm-glow',
      palette.glow
    );

    root.style.setProperty(
      '--atm-city-back',
      palette.cityBack
    );

    root.style.setProperty(
      '--atm-city-front',
      palette.cityFront
    );

    root.style.setProperty(
      '--atm-window',
      palette.window
    );

    root.style.setProperty(
      '--atm-fog',
      palette.fog
    );

    root.style.setProperty(
      '--atm-vignette',
      hour < 7
        ? 'rgba(24,15,15,.22)'
        : hour < 18
          ? 'rgba(8,15,20,.12)'
          : 'rgba(15,8,14,.3)'
    );


    const noonDistance =
      Math.abs(hour - 12) / 7;

    const daylight =
      Math.max(
        0,
        1 - noonDistance * 0.22
      );


    root.style.setProperty(
      '--atm-city-light',
      `${(
        0.04 +
        (1 - daylight) * 0.16
      ).toFixed(3)}`
    );


    root.style.setProperty(
      '--atm-rain',
      `${Math.max(
        0.01,
        0.06 - daylight * 0.045
      ).toFixed(3)}`
    );


    applySceneDirect(
      hour,
      palette,
      theme
    );
  };


  const updateCelestialBodies = (
    hour,
    theme
  ) => {
    const sunVisible =
      hour >= 5 && hour < 20;

    const moonVisible =
      hour >= 20 || hour < 5;


    if (moon) {
      moon.style.opacity =
        moonVisible ? '' : '0';
    }


    if (!sunVisible) {
      sun.style.opacity = '0';

      if (
        backdrop &&
        (
          theme === 'night' ||
          theme === 'deep-night'
        )
      ) {
        applySceneDirect(
          hour,
          interpolateStop(
            Math.max(
              5,
              Math.min(20, hour)
            )
          ),
          theme
        );
      }

      return;
    }


    const progress =
      Math.min(
        1,
        Math.max(
          0,
          (hour - 5) / 15
        )
      );


    const x =
      9 + progress * 82;

    const y =
      72 -
      Math.sin(
        progress * Math.PI
      ) * 61;


    root.style.setProperty(
      '--relay-sun-x',
      `${x}%`
    );

    root.style.setProperty(
      '--relay-sun-y',
      `${y}%`
    );


    const daylightPalette =
      interpolateStop(hour);


    const sunWarmth =
      hour < 8
        ? 0.85
        : hour < 16
          ? 0.05
          : hour < 19
            ? 0.72
            : 1;


    const core =
      sunWarmth > 0.5
        ? '#fff1cf'
        : '#fffdf5';

    const edge =
      sunWarmth > 0.5
        ? '#ffad57'
        : '#ffd978';


    sun.style.background =
      `radial-gradient(
        circle at 42% 38%,
        ${core} 0 20%,
        #ffe9a7 45%,
        ${edge} 72%,
        rgba(255,174,62,0) 100%
      )`;


    sun.style.boxShadow =
      `0 0 35px 12px ${daylightPalette.glow}66,
       0 0 110px 38px ${daylightPalette.glow}33`;


    sun.style.opacity = '1';

    sun.dataset.theme = theme;


    applySceneDirect(
      hour,
      daylightPalette,
      theme
    );
  };


  const update = () => {
    const hour = getHour();
    const next = getTheme();

    const previous =
      root.dataset.atmosphere;

    root.dataset.atmosphere =
      next;

    applyRealisticDaylight(hour);

    updateCelestialBodies(
      hour,
      next
    );


    if (
      previous &&
      previous !== next
    ) {
      root.classList.remove(
        'atmosphere-shift'
      );

      void root.offsetWidth;

      root.classList.add(
        'atmosphere-shift'
      );

      window.setTimeout(
        () => {
          root.classList.remove(
            'atmosphere-shift'
          );
        },
        1400
      );
    }


    window.dispatchEvent(
      new CustomEvent(
        'relay-atmosphere-change',
        {
          detail:{
            theme:next,
            hour
          }
        }
      )
    );
  };


  window.__relayUpdateAtmosphere =
    update;


  window.__relaySetAtmosphereDebugHour =
    hour => {
      if (!Number.isFinite(hour)) return;

      window.__relayAtmosphereDebugHour =
        hour;

      update();
    };


  window.__relayClearAtmosphereDebug =
    () => {
      delete window.__relayAtmosphereDebugHour;
      update();
    };


  update();

  window.setInterval(
    update,
    60 * 1000
  );


  document.addEventListener(
    'visibilitychange',
    () => {
      if (!document.hidden) {
        update();
      }
    }
  );
})();
