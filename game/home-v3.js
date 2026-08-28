/* Home V3: replaces the legacy Home presentation without replacing gameplay systems. */
(() => {
  if (window.__relayHomeV3) return;
  window.__relayHomeV3 = true;

  const $ = id => document.getElementById(id);
  const click = id => $(id)?.click();
  const homeVisible = () => {
    const intro = $('intro');
    return !!intro && !intro.classList.contains('hidden');
  };

  const syncSurface = () => {
    document.body.classList.toggle('home-v3-active', homeVisible());
    const intro = $('intro');
    if (intro) intro.classList.toggle('home-v3', homeVisible());
  };

  const build = () => {
    const intro = $('intro');
    if (!intro || intro.dataset.homeV3Built === '1') return;
    intro.dataset.homeV3Built = '1';
    intro.classList.add('home-v3');

    const legacyMenu = intro.querySelector('.main-menu');
    const launcher = intro.querySelector('.info-launcher');

    const bg = document.createElement('div');
    bg.className = 'home-v3-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = '<i class="home-v3-grid"></i><i class="home-v3-glow"></i><i class="home-v3-scan"></i>';

    const shell = document.createElement('div');
    shell.className = 'home-v3-shell';
    shell.innerHTML = `
      <header class="home-v3-header">
        <div class="home-v3-brand"><span class="home-v3-mark">R/</span><span>RELAY RUNNER</span></div>
        <div class="home-v3-status"><b>● SYSTEM READY</b><br>NIGHT SHIFT · ONLINE</div>
      </header>
      <main class="home-v3-main">
        <section>
          <p class="home-v3-kicker">ROOFTOP DELIVERY NETWORK · CHAPTER 01</p>
          <h1 class="home-v3-title">RELAY<em>RUNNER</em></h1>
          <p class="home-v3-copy">Run the sleeping city. Carry the signal farther than anyone else can. Build your route, master the night and keep the line open.</p>
          <div class="home-v3-actions">
            <button class="home-v3-play" type="button" data-v3-play>PLAY NOW</button>
            <button class="home-v3-continue" type="button" data-v3-continue hidden>CONTINUE</button>
          </div>
        </section>
        <nav class="home-v3-side" aria-label="Main menu">
          <button class="home-v3-card" type="button" data-v3-options><span>OPTIONS</span><small>SETTINGS · AUDIO · DISPLAY</small></button>
          <button class="home-v3-card" type="button" data-v3-tutorial><span>TUTORIAL</span><small>QUICK START · FIELD GUIDE</small></button>
          <button class="home-v3-card" type="button" data-v3-faq><span>FAQ</span><small>HELP · GAME SYSTEMS</small></button>
          <button class="home-v3-card" type="button" data-v3-exit><span>EXIT</span><small>CLOSE SESSION</small></button>
        </nav>
      </main>
      <footer class="home-v3-footer"><span>RELAY RUNNER · <b>VERSION 1.1.0</b></span><span>A / D MOVE · SPACE JUMP · ESC PAUSE</span></footer>`;

    intro.replaceChildren(bg, shell, legacyMenu, launcher);

    shell.querySelector('[data-v3-play]')?.addEventListener('click', e => { e.preventDefault(); click('start'); });
    shell.querySelector('[data-v3-continue]')?.addEventListener('click', e => { e.preventDefault(); click('continue'); });
    shell.querySelector('[data-v3-options]')?.addEventListener('click', e => { e.preventDefault(); document.querySelector('[data-title-panel="controls"]')?.click(); });
    shell.querySelector('[data-v3-tutorial]')?.addEventListener('click', e => { e.preventDefault(); document.querySelector('[data-title-panel="tutorial"]')?.click(); });
    shell.querySelector('[data-v3-faq]')?.addEventListener('click', e => { e.preventDefault(); document.querySelector('[data-relay-info="faq"]')?.click(); });
    shell.querySelector('[data-v3-exit]')?.addEventListener('click', e => { e.preventDefault(); click('exitTitle'); });

    const syncContinue = () => {
      const legacy = $('continue');
      const button = shell.querySelector('[data-v3-continue]');
      if (!legacy || !button) return;
      button.hidden = legacy.classList.contains('hidden') || getComputedStyle(legacy).display === 'none';
    };
    syncContinue();
    if ($('continue')) new MutationObserver(syncContinue).observe($('continue'), {attributes:true,attributeFilter:['class','style','hidden']});
  };

  const start = () => {
    build();
    syncSurface();
    new MutationObserver(syncSurface).observe(document.body, {subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
