(() => {
  if (window.__relayWorldAtmosphereInstalled) return;
  window.__relayWorldAtmosphereInstalled = true;

  const root = document.getElementById('intro');
  if (!root) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './world-atmosphere.css';
  document.head.appendChild(stylesheet);

  const getTheme = () => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
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
  };

  update();
  window.setInterval(update, 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) update();
  });
})();