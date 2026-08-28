(() => {
  'use strict';
  const sync = () => {
    const intro = document.getElementById('intro');
    const play = document.getElementById('play');
    if (!intro || !play) return;
    const home = !intro.classList.contains('hidden');
    document.body.classList.toggle('home-v3-active', home);
    play.style.display = home ? 'none' : '';
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync, { once: true });
  else sync();
  new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
})();
