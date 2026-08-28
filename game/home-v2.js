import './home-v2.css';

(() => {
  if (window.__relayHomeV2) return;
  window.__relayHomeV2 = true;

  const boot = () => {
    const intro = document.getElementById('intro');
    if (!intro || intro.dataset.homeV2Built === '1') return;
    intro.dataset.homeV2Built = '1';
    intro.classList.add('home-v2');

    const legacy = intro.querySelector('.main-menu');
    if (legacy) legacy.hidden = true;

    const bg = document.createElement('div');
    bg.className = 'home-v2-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = '<i class="home-v2-grid"></i><i class="home-v2-scan"></i><i class="home-v2-city"></i><i class="home-v2-zipper"></i>';

    const header = document.createElement('header');
    header.className = 'home-v2-header';
    header.innerHTML = '<div class="home-v2-brand"><span class="home-v2-mark">R/</span><span>RELAY RUNNER</span></div><div class="home-v2-chapter">CHAPTER 01<br>NIGHT SHIFT</div>';

    const content = document.createElement('div');
    content.className = 'home-v2-content';
    content.innerHTML = `
      <div class="home-v2-hero">
        <section>
          <p class="home-v2-kicker">A ROOFTOP DELIVERY GAME · SYSTEM ONLINE</p>
          <h1 class="home-v2-title">RELAY<em>RUNNER</em></h1>
          <p class="home-v2-tag">Run the sleeping city. Carry the signal farther than anyone else can. Build your route, master the night and keep the line open.</p>
          <div class="home-v2-actions">
            <button class="home-v2-play" type="button" data-home-play>▶ &nbsp; PLAY NOW</button>
            <button class="home-v2-continue" type="button" data-home-continue>CONTINUE →</button>
          </div>
        </section>
        <nav class="home-v2-secondary" aria-label="Main menu">
          <button type="button" data-home-options><span>OPTIONS</span><small>SETTINGS · AUDIO · DISPLAY</small></button>
          <button type="button" data-home-tutorial><span>TUTORIAL</span><small>QUICK START · FIELD GUIDE</small></button>
          <button type="button" data-home-faq><span>FAQ</span><small>HELP · GAME SYSTEMS</small></button>
          <button type="button" data-home-exit><span>EXIT</span><small>CLOSE SESSION</small></button>
        </nav>
      </div>`;

    const status = document.createElement('div');
    status.className = 'home-v2-status';
    status.innerHTML = '<span><strong>●</strong> SYSTEM READY · NIGHT SHIFT</span><span>A / D MOVE · SPACE JUMP · ESC PAUSE</span>';

    intro.prepend(bg, header, content, status);

    const click = (selector, action) => content.querySelector(selector)?.addEventListener('click', e => { e.preventDefault(); action(); });
    const legacyClick = id => document.getElementById(id)?.click();

    click('[data-home-play]', () => legacyClick('start'));
    click('[data-home-continue]', () => legacyClick('continue'));
    click('[data-home-exit]', () => legacyClick('exitTitle'));
    click('[data-home-options]', () => document.querySelector('[data-title-panel="controls"]')?.click());
    click('[data-home-tutorial]', () => document.querySelector('[data-title-panel="tutorial"]')?.click());
    click('[data-home-faq]', () => document.querySelector('[data-relay-info="faq"]')?.click());

    const syncContinue = () => {
      const legacyContinue = document.getElementById('continue');
      const button = content.querySelector('[data-home-continue]');
      if (!legacyContinue || !button) return;
      const hidden = legacyContinue.classList.contains('hidden') || getComputedStyle(legacyContinue).display === 'none';
      button.hidden = hidden;
      button.setAttribute('aria-hidden', String(hidden));
      button.tabIndex = hidden ? -1 : 0;
    };
    syncContinue();
    new MutationObserver(syncContinue).observe(document.getElementById('continue') || intro, {attributes:true,attributeFilter:['class','style']});

    document.addEventListener('keydown', event => {
      if (!intro || intro.classList.contains('hidden')) return;
      const target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (event.key === 'Enter' && !document.querySelector('#titlePanel:not(.hidden),#relayInfoPanel:not(.hidden)')) {
        const legacyContinue = document.getElementById('continue');
        if (legacyContinue && !legacyContinue.classList.contains('hidden')) legacyClick('continue');
        else legacyClick('start');
      }
      if (event.key === 'Escape') {
        document.getElementById('closeTitlePanel')?.click();
        document.querySelector('[data-relay-close]')?.click();
      }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
