/* UPDATE 25 — title/home polish, language wiring and panel redesign */
import './src/i18n.js';

(() => {
  if (window.__cityPulseTitleV1) return;
  const intro = document.getElementById('intro');
  if (!intro) return;

  intro.classList.add('city-pulse-title');

  const secondaryStatus = intro.querySelector('.title-secondary');
  if (secondaryStatus && !secondaryStatus.querySelector('.city-pulse-status')) {
    const status = document.createElement('div');
    status.className = 'city-pulse-status';
    status.innerHTML = '<i aria-hidden="true"></i><span>CITY NETWORK ONLINE // NIGHT SHIFT</span>';
    secondaryStatus.after(status);
  }

  const style = document.createElement('style');
  style.id = 'city-pulse-title-screen-v25-style';
  style.textContent = `
    #intro.home-copy-locked,
    #intro.home-copy-locked * { -webkit-user-select:none!important; user-select:none!important; -webkit-touch-callout:none!important; }
    #intro.home-copy-locked img { -webkit-user-drag:none!important; user-drag:none!important; }

    #intro .title-lockup > .eyebrow.home-rooftop-removed { display:none!important; }
    #intro .chapter-brief { display:none!important; }
    #play .hud-route,
    #play .world-marker,
    #play .input-guide { display:none!important; }

    #intro .title-secondary { position:relative; }
    #intro .home-language-button { position:relative; }
    #intro .beta-badge {
      display:inline-flex; align-items:center; justify-content:center;
      min-width:36px; height:18px; padding:0 7px; margin-left:8px;
      box-sizing:border-box; border:1px solid #ffd06e66; border-radius:999px;
      color:#ffd06e; background:#ffd06e0d; box-shadow:0 0 16px #ffd06e12;
      font:900 7px/1 'DM Mono',monospace; letter-spacing:1.2px;
      vertical-align:middle;
    }
    #intro .play-button .beta-badge { transform:translateY(-1px); }
    #intro .play-button .beta-badge::before { content:'•'; margin-right:4px; color:#68e7be; }

    #relayInfoPanel.relay-polished { padding:clamp(12px,3vw,28px)!important; }
    #relayInfoPanel.relay-polished .relay-info-card {
      position:relative!important; width:min(760px,94vw)!important; max-width:100%!important;
      max-height:min(82dvh,760px)!important; max-height:min(82svh,760px)!important;
      overflow:hidden!important; box-sizing:border-box!important;
      padding:clamp(22px,3vw,34px)!important;
      border:1px solid #8aa2ba2e!important; border-radius:16px!important;
      background:linear-gradient(145deg,#0c1726f7,#050b14f9)!important;
      box-shadow:0 28px 90px #000b, inset 0 1px #ffffff0b, 0 0 45px #ffd06e0b!important;
    }
    #relayInfoPanel.relay-polished .relay-info-card::before {
      content:''; position:absolute; inset:0 0 auto; height:2px;
      background:linear-gradient(90deg,transparent,#ffd06e,#8df4ff,transparent);
      opacity:.8;
    }
    #relayInfoPanel.relay-polished .relay-info-close {
      width:38px!important; height:38px!important; display:grid!important; place-items:center!important;
      border:1px solid #61728766!important; border-radius:8px!important;
      color:#dbe5ee!important; background:#07111de8!important;
      font:800 18px/1 Manrope,sans-serif!important; cursor:pointer!important;
      transition:.18s ease!important;
    }
    #relayInfoPanel.relay-polished .relay-info-close:hover,
    #relayInfoPanel.relay-polished .relay-info-close:focus-visible {
      color:#ffd06e!important; border-color:#ffd06e!important; transform:translateY(-1px)!important; outline:none!important;
      box-shadow:0 0 20px #ffd06e18!important;
    }
    #relayInfoPanel.relay-polished .relay-info-eyebrow {
      margin:2px 48px 8px 0!important; color:#ffd06e!important;
      font:800 8px/1.4 'DM Mono',monospace!important; letter-spacing:1.8px!important;
    }
    #relayInfoPanel.relay-polished h2 {
      margin:0 0 20px!important; color:#f4f7fa!important;
      font:900 clamp(30px,5vw,52px)/.95 Manrope,sans-serif!important;
      letter-spacing:-.055em!important;
    }
    #relayInfoPanel.relay-polished #relayInfoContent {
      max-height:calc(min(82dvh,760px) - 145px)!important; max-height:calc(min(82svh,760px) - 145px)!important;
      overflow:auto!important; padding-right:5px!important; scrollbar-width:thin!important;
    }
    #relayInfoPanel.relay-polished .relay-faq-list,
    #relayInfoPanel.relay-polished .relay-update-list { display:grid; gap:9px; }
    #relayInfoPanel.relay-polished .relay-faq-item,
    #relayInfoPanel.relay-polished .relay-update-item {
      border:1px solid #71869b24; border-radius:10px;
      background:linear-gradient(135deg,#0b1725d9,#07101bd9);
      box-shadow:inset 0 1px #ffffff05;
    }
    #relayInfoPanel.relay-polished .relay-faq-question {
      position:relative; width:100%; min-height:52px; padding:14px 42px 14px 15px;
      border:0; color:#e9f1f6; background:transparent; text-align:left; cursor:pointer;
      font:800 10px/1.45 'DM Mono',monospace; letter-spacing:.45px;
    }
    #relayInfoPanel.relay-polished .relay-faq-question::after {
      content:'+'; position:absolute; right:15px; top:50%; transform:translateY(-50%);
      color:#ffd06e; font:700 18px/1 Manrope,sans-serif; transition:transform .18s ease;
    }
    #relayInfoPanel.relay-polished .relay-faq-item.open .relay-faq-question { color:#ffd06e; }
    #relayInfoPanel.relay-polished .relay-faq-item.open .relay-faq-question::after { transform:translateY(-50%) rotate(45deg); }
    #relayInfoPanel.relay-polished .relay-faq-answer {
      display:none; padding:0 15px 15px; color:#aebdca;
      font:500 10px/1.7 'DM Mono',monospace;
    }
    #relayInfoPanel.relay-polished .relay-faq-item.open .relay-faq-answer { display:block; }
    #relayInfoPanel.relay-polished .relay-update-meta {
      margin:0 0 10px; color:#68e7be; font:800 8px/1.5 'DM Mono',monospace; letter-spacing:1.3px;
    }
    #relayInfoPanel.relay-polished .relay-update-item { padding:14px 15px; color:#c6d2dc; font:500 10px/1.65 'DM Mono',monospace; }
    #relayInfoPanel.relay-polished .relay-update-item::before {
      content:'//'; display:inline-block; margin-right:9px; color:#ffd06e; font-weight:900;
    }

    #relayLanguagePanel.relay-language-polished { position:fixed; inset:0; z-index:100000; display:grid; place-items:center; padding:18px; background:#02050db8; backdrop-filter:blur(10px); }
    #relayLanguagePanel.relay-language-polished.hidden { display:none!important; }
    #relayLanguagePanel.relay-language-polished .relay-language-card {
      position:relative; width:min(430px,92vw); box-sizing:border-box; padding:25px;
      border:1px solid #8aa2ba35; border-radius:15px;
      background:linear-gradient(145deg,#0d1928f8,#050b14fc); box-shadow:0 28px 90px #000c, inset 0 1px #ffffff08;
    }
    #relayLanguagePanel.relay-language-polished .relay-language-card::before { content:''; position:absolute; left:22px; right:22px; top:0; height:2px; background:linear-gradient(90deg,#ffd06e,transparent); }
    #relayLanguagePanel .relay-language-close { position:absolute; right:14px; top:14px; width:34px; height:34px; border:1px solid #61728766; border-radius:8px; background:#07111d; color:#dbe5ee; font-size:18px; cursor:pointer; }
    #relayLanguagePanel .relay-language-card h2 { margin:5px 0 18px; color:#f4f7fa; font:900 30px/1 Manrope,sans-serif; letter-spacing:-.04em; }
    #relayLanguagePanel .relay-language-list { display:grid; gap:7px; }
    #relayLanguagePanel .relay-language-list button { display:flex; align-items:center; justify-content:space-between; width:100%; min-height:48px; padding:0 14px; border:1px solid #71869b2e; border-radius:9px; background:#07111de8; color:#dbe5ee; cursor:pointer; font:800 9px 'DM Mono',monospace; letter-spacing:.8px; }
    #relayLanguagePanel .relay-language-list button:hover { border-color:#ffd06e; color:#ffd06e; transform:translateY(-1px); }
    #relayLanguagePanel .relay-language-list button b { color:#71869b; font-size:8px; }

    @media(max-width:700px){
      #intro .title-secondary { width:min(360px,94vw)!important; }
      #intro .beta-badge { min-width:32px; height:17px; font-size:6.5px; }
      #relayInfoPanel.relay-polished .relay-info-card { width:96vw!important; max-height:88dvh!important; max-height:88svh!important; padding:18px!important; border-radius:13px!important; }
      #relayInfoPanel.relay-polished #relayInfoContent { max-height:calc(88dvh - 120px)!important; max-height:calc(88svh - 120px)!important; }
      #relayInfoPanel.relay-polished h2 { font-size:34px!important; }
      #relayLanguagePanel.relay-language-polished .relay-language-card { width:96vw; padding:20px; }
    }
  `;
  document.head.appendChild(style);

  const removeRequestedHomeText = () => {
    intro.querySelectorAll('.title-lockup .eyebrow').forEach(el => {
      if (/A\s+ROOFTOP\s+DELIVERY\s+GAME/i.test(el.textContent || '')) el.classList.add('home-rooftop-removed');
    });
    intro.querySelector('.chapter-brief')?.remove();
  };

  const addBetaBadge = () => {
    const play = document.getElementById('start');
    if (play && !play.querySelector('.beta-badge')) {
      const badge = document.createElement('span');
      badge.className = 'beta-badge';
      badge.textContent = 'BETA';
      play.appendChild(badge);
    }
  };

  const addLanguageButtons = () => {
    const secondary = intro.querySelector('.title-secondary');
    if (secondary && !secondary.querySelector('[data-language-open]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'menu-option-button home-language-button';
      button.setAttribute('data-language-open', '');
      button.innerHTML = '<span data-i18n="language">LANGUAGE</span><small data-language-name>ENGLISH</small>';
      secondary.appendChild(button);
    }

    const pauseNav = document.querySelector('#pauseMenu .menu-grid aside nav');
    if (pauseNav && !pauseNav.querySelector('[data-language-open]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tab language-tab';
      button.setAttribute('data-language-open', '');
      button.innerHTML = '<span data-i18n="language">LANGUAGE</span>';
      pauseNav.appendChild(button);
    }
  };

  const annotateLanguageText = () => {
    const options = intro.querySelector('[data-title-panel="controls"]');
    if (options) {
      const label = options.querySelector('span');
      if (label) label.setAttribute('data-i18n', 'options');
    }
    const pauseSettings = document.querySelector('#pauseMenu .tab[data-tab="settings"]');
    if (pauseSettings) pauseSettings.setAttribute('data-i18n', 'settings');
    const faq = intro.querySelector('.faq-launcher');
    if (faq) faq.setAttribute('aria-label', 'FAQ');
  };

  const polishInfoPanel = () => {
    const panel = document.getElementById('relayInfoPanel');
    if (!panel) return;
    panel.classList.add('relay-polished');
    panel.querySelector('.relay-info-card')?.classList.add('relay-polished-card');
  };

  const polishLanguagePanel = () => {
    const panel = document.getElementById('relayLanguagePanel');
    if (!panel) return;
    panel.classList.add('relay-language-polished');
  };

  const translateKnownUI = () => {
    const i18n = window.relayI18n;
    if (!i18n) return;
    const set = (selector, key) => document.querySelectorAll(selector).forEach(el => { const next = i18n.text(key); if (el.textContent !== next) el.textContent = next; });
    set('#intro .play-button span', 'play');
    set('#intro .continue-button', 'continue');
    set('#intro [data-title-panel="controls"] span', 'options');
    set('#pauseMenu .tab[data-tab="settings"]', 'settings');
    set('#pauseMenu .language-tab [data-i18n="language"]', 'language');
    document.querySelectorAll('[data-language-name]').forEach(el => { const next = i18n.languages[i18n.getLang()] || i18n.languages.en; if (el.textContent !== next) el.textContent = next; });
  };

  const installHomeGuards = () => {
    intro.classList.add('home-copy-locked');
    const block = event => { event.preventDefault(); };
    ['contextmenu','copy','cut','dragstart','selectstart'].forEach(type => intro.addEventListener(type, block));
  };

  const sync = () => {
    removeRequestedHomeText();
    addBetaBadge();
    addLanguageButtons();
    annotateLanguageText();
    polishInfoPanel();
    polishLanguagePanel();
    translateKnownUI();
  };

  installHomeGuards();
  sync();

  let syncScheduled = false;
  const observer = new MutationObserver(mutations => {
    const relevant = mutations.some(m => [...m.addedNodes].some(node => node.nodeType === Node.ELEMENT_NODE));
    if (!relevant || syncScheduled) return;
    syncScheduled = true;
    window.requestAnimationFrame(() => { syncScheduled = false; sync(); });
  });
  observer.observe(document.body, { childList:true, subtree:true });

  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-language-open]')) window.setTimeout(polishLanguagePanel, 0);
    if (event.target.closest?.('[data-relay-info]')) window.setTimeout(polishInfoPanel, 0);
  }, true);

  window.addEventListener('relay-language-change', () => window.setTimeout(sync, 0));

  const options = intro.querySelector('[data-title-panel="controls"]');
  if (options) options.querySelector('small').textContent = 'CONTROLS & SETTINGS';

  const start = document.getElementById('start');
  const continueButton = document.getElementById('continue');
  const safeActivate = button => {
    if (!button || button.dataset.cpBound) return;
    button.dataset.cpBound = '1';
    button.addEventListener('pointerdown', () => button.classList.add('cp-pressed'), { passive: true });
    button.addEventListener('pointerup', () => button.classList.remove('cp-pressed'), { passive: true });
    button.addEventListener('pointercancel', () => button.classList.remove('cp-pressed'), { passive: true });
  };
  safeActivate(start);
  safeActivate(continueButton);

  intro.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.getElementById('titlePanel')?.classList.add('hidden');
      document.getElementById('relayInfoPanel')?.classList.add('hidden');
      document.getElementById('relayLanguagePanel')?.classList.add('hidden');
    }
  });

  window.__cityPulseTitleV1 = true;
  window.dispatchEvent(new CustomEvent('relay:city-pulse-title-ready', { detail: { version: '1.1.0' } }));
})();
