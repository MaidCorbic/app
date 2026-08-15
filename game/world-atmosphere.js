(() => {
  if (window.__relayWorldAtmosphereInstalled) return;
  window.__relayWorldAtmosphereInstalled = true;

  const root = document.getElementById('intro');
  if (!root) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './world-atmosphere.css';
  document.head.appendChild(stylesheet);

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

  const update = () => {
    const next = getTheme();
    const previous = root.dataset.atmosphere;
    root.dataset.atmosphere = next;
    if (previous && previous !== next) {
      root.classList.remove('atmosphere-shift');
      void root.offsetWidth;
      root.classList.add('atmosphere-shift');
      window.setTimeout(() => root.classList.remove('atmosphere-shift'), 1400);
    }
    window.dispatchEvent(new CustomEvent('relay-atmosphere-change', {
      detail: { theme: next, hour: getHour() }
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