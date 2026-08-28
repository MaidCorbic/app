(() => {
  'use strict';
  const apply = () => {
    const intro = document.getElementById('intro');
    const play = document.getElementById('play');
    if (!intro || !play) return;
    const homeVisible = !intro.classList.contains('hidden');
    document.body.classList.toggle('home-v3-active', homeVisible);
    play.style.display = homeVisible ? 'none' : '';
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
  new MutationObserver(apply).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
})();
