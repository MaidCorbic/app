// Loads the Play cinematic after the title/menu DOM exists.
(() => {
  if (document.querySelector('script[data-play-cinematic-v1]')) return;
  const s = document.createElement('script');
  s.src = './play-cinematic-v1.js';
  s.defer = true;
  s.dataset.playCinematicV1 = 'true';
  document.head.appendChild(s);
})();
