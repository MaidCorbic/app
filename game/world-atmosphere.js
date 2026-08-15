(() => {
  if (window.__relayWorldAtmosphereInstalled) return;
  window.__relayWorldAtmosphereInstalled = true;

  const start = () => {
    const root = document.getElementById('intro');
    const backdrop = root?.querySelector('.menu-backdrop');
    if (!root || !backdrop) return;

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = './world-atmosphere.css';
    document.head.appendChild(stylesheet);

    const make = (tag, className) => {
      const element = document.createElement(tag);
      element.className = className;
      element.setAttribute('aria-hidden', 'true');
      return element;
    };

    if (!backdrop.querySelector('.world-stars')) {
      backdrop.append(
        make('span', 'world-stars'),
        make('span', 'world-sun'),
        make('span', 'world-moon')
      );
    }

    const points = [
      [5, ['#100f2a', '#352548', '#d8785a', '#0b0a12', '#ffb86b', 'rgba(255,143,87,.30)', '#19253c', '#0d1523', 'rgba(214,168,150,.13)', .18, .34]],
      [7, ['#27426a', '#6289a5', '#f2a56e', '#101722', '#ffd08a', 'rgba(255,190,108,.32)', '#28435a', '#142235', 'rgba(220,190,165,.14)', .12, .24]],
      [10, ['#5a9fd1', '#8fc6e3', '#c7d9e0', '#182534', '#ffe1a1', 'rgba(255,211,133,.25)', '#35566b', '#1b2d3c', 'rgba(205,218,222,.12)', .06, .16]],
      [13, ['#70b5e0', '#a9d9ed', '#d5e7ea', '#1b2a34', '#fff0bd', 'rgba(255,224,154,.22)', '#3c6071', '#213846', 'rgba(220,225,220,.10)', .04, .14]],
      [16, ['#4c89b8', '#9ebbc8', '#e6b47d', '#1b2730', '#ffd38a', 'rgba(255,187,100,.28)', '#3d5968', '#202f3a', 'rgba(210,190,170,.11)', .07, .18]],
      [18, ['#4c476b', '#b56e5e', '#f2a45e', '#171624', '#ffbd70', 'rgba(255,135,72,.34)', '#423849', '#201d2a', 'rgba(226,158,128,.16)', .12, .28]],
      [19, ['#241d43', '#6b4964', '#e28b65', '#0d0d18', '#ff9e61', 'rgba(255,110,68,.30)', '#30263a', '#171521', 'rgba(205,130,125,.14)', .16, .34]],
      [20, ['#07101d', '#16243b', '#39415b', '#050912', '#ffd27a', 'rgba(255,190,92,.18)', '#172b43', '#0b1729', 'rgba(130,155,180,.10)', .28, .48]],
      [23, ['#02050d', '#08101e', '#17223b', '#02040a', '#c9d7ed', 'rgba(125,155,205,.10)', '#0d1a2b', '#07101b', 'rgba(90,120,155,.08)', .38, .62]],
      [29, ['#100f2a', '#352548', '#d8785a', '#0b0a12', '#ffb86b', 'rgba(255,143,87,.30)', '#19253c', '#0d1523', 'rgba(214,168,150,.13)', .18, .34]]
    ];

    const lerp = (a, b, t) => a + (b - a) * t;
    const hex = (value) => {
      const h = value.replace('#', '');
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    };
    const mix = (a, b, t) => {
      const x = hex(a);
      const y = hex(b);
      return `rgb(${Math.round(lerp(x[0], y[0], t))},${Math.round(lerp(x[1], y[1], t))},${Math.round(lerp(x[2], y[2], t))})`;
    };

    const getTime = () => {
      if (Number.isFinite(window.__relayAtmosphereDebugHour)) {
        return window.__relayAtmosphereDebugHour;
      }
      const now = new Date();
      return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    };

    const normalizeHour = (hour) => (hour < 5 ? hour + 24 : hour);

    const sample = (hour) => {
      const h = normalizeHour(hour);
      let left = points[0];
      let right = points[1];

      for (let i = 0; i < points.length - 1; i += 1) {
        if (h >= points[i][0] && h <= points[i + 1][0]) {
          left = points[i];
          right = points[i + 1];
          break;
        }
      }

      const t = Math.max(0, Math.min(1, (h - left[0]) / (right[0] - left[0])));
      return {
        hour: h,
        values: left[1].map((value, index) => index < 9 ? mix(value, right[1][index], t) : lerp(value, right[1][index], t))
      };
    };

    const themeFor = (hour) => {
      const h = normalizeHour(hour);
      if (h < 8) return 'dawn';
      if (h < 18) return 'day';
      if (h < 20) return 'dusk';
      if (h < 23) return 'night';
      return 'deep-night';
    };

    const apply = () => {
      const sampled = sample(getTime());
      const h = sampled.hour;
      const [skyTop, skyMid, horizon, ground, sunColor, sunGlow, cityFar, cityNear, fog, rain, overlay] = sampled.values;
      const style = backdrop.style;

      [
        ['--sky-top', skyTop], ['--sky-mid', skyMid], ['--sky-horizon', horizon], ['--ground', ground],
        ['--sun-color', sunColor], ['--sun-glow', sunGlow], ['--city-far', cityFar], ['--city-near', cityNear],
        ['--fog', fog], ['--rain-opacity', rain], ['--overlay-opacity', overlay]
      ].forEach(([property, value]) => style.setProperty(property, value));

      const daylightProgress = Math.max(0, Math.min(1, (h - 5) / 15));
      const sunVisible = h >= 5 && h < 20;
      style.setProperty('--sun-x', `${15 + 70 * daylightProgress}%`);
      style.setProperty('--sun-y', `${72 - 60 * Math.sin(Math.PI * daylightProgress)}%`);
      style.setProperty('--sun-opacity', sunVisible ? String(Math.max(.12, Math.sin(Math.PI * daylightProgress) * 1.08)) : '0');

      const moonProgress = h >= 20 ? (h - 20) / 9 : h < 5 ? (h + 4) / 9 : 0;
      style.setProperty('--moon-x', `${84 - 68 * Math.min(1, moonProgress)}%`);
      style.setProperty('--moon-y', `${36 - 18 * Math.sin(Math.PI * Math.min(1, moonProgress))}%`);
      style.setProperty('--moon-opacity', h >= 20 || h < 5 ? '.95' : '0');

      const theme = themeFor(h);
      if (root.dataset.atmosphere !== theme) {
        root.classList.remove('atmosphere-shift');
        void root.offsetWidth;
        root.classList.add('atmosphere-shift');
        window.setTimeout(() => root.classList.remove('atmosphere-shift'), 1400);
      }
      root.dataset.atmosphere = theme;
      root.dataset.atmosphereHour = h.toFixed(2);

      const readout = document.querySelector('[data-atmosphere-readout]');
      if (readout) {
        readout.textContent = `TIME ${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')} · ${theme.toUpperCase()}`;
      }
    };

    if (new URLSearchParams(window.location.search).get('debug') === 'atmosphere' && !document.querySelector('.atmosphere-debug')) {
      const panel = document.createElement('aside');
      panel.className = 'atmosphere-debug';
      panel.innerHTML = '<b>ATMOSPHERE TEST</b><output data-atmosphere-readout></output><div class="atmosphere-debug-grid"></div>';
      const grid = panel.querySelector('.atmosphere-debug-grid');
      [['DAWN', 6.5], ['DAY', 12], ['DUSK', 19], ['NIGHT', 21.5], ['DEEP NIGHT', 1.5], ['AUTO TIME', null]].forEach(([label, value]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', () => {
          if (value === null) delete window.__relayAtmosphereDebugHour;
          else window.__relayAtmosphereDebugHour = value;
          apply();
        });
        grid.append(button);
      });
      document.body.append(panel);
    }

    apply();
    window.setInterval(apply, 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) apply();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
