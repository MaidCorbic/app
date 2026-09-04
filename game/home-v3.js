/*
 * Relay Runner Home — Concept 6 presentation owner.
 *
 * Contract:
 * - Home owns presentation only.
 * - Existing gameplay entry points (#start / #continue) remain authoritative.
 * - Existing Options / FAQ / Update systems remain authoritative.
 * - No duplicate visible controls are created.
 */
(() => {
  'use strict';

  if (window.__relayHomeConcept6) return;
  window.__relayHomeConcept6 = true;

  const $ = id => document.getElementById(id);

  const isHomeVisible = () => {
    const intro = $('intro');
    return !!intro && !intro.classList.contains('hidden');
  };

  const clickExisting = selector => {
    const target = document.querySelector(selector);
    if (!(target instanceof HTMLElement) || target.disabled) return false;
    try {
      HTMLElement.prototype.click.call(target);
      return true;
    } catch {
      return false;
    }
  };

  const openOptions = () => {
    try {
      if (typeof window.relayUnifiedCinematicUI?.openOptions === 'function') {
        window.relayUnifiedCinematicUI.openOptions();
        return true;
      }
    } catch {}
    return clickExisting('[data-title-panel="controls"]');
  };

  const openFaq = () => {
    try {
      if (typeof window.relayUnifiedCinematicUI?.openFAQ === 'function') {
        window.relayUnifiedCinematicUI.openFAQ();
        return true;
      }
    } catch {}
    return clickExisting('[data-relay-info="faq"]');
  };

  const openUpdate = () => {
    try {
      if (typeof window.relayOpenInfo === 'function') {
        window.relayOpenInfo('update');
        return true;
      }
    } catch {}
    return clickExisting('[data-relay-info="update"]');
  };

  const syncHomeState = () => {
    const visible = isHomeVisible();
    document.body.classList.toggle('home-v3-active', visible);
    $('intro')?.classList.toggle('home-v3', visible);
  };

  const bindAction = (button, action) => {
    if (!(button instanceof HTMLElement) || button.dataset.bound === '1') return;
    button.dataset.bound = '1';

    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (action === 'options') openOptions();
      if (action === 'faq') openFaq();
      if (action === 'update') openUpdate();
    });
  };

  const build = () => {
    const intro = $('intro');
    if (!intro || intro.dataset.homeConcept6Built === '1') return;

    intro.dataset.homeConcept6Built = '1';
    intro.classList.add('home-v3');
    intro.replaceChildren();

    const bg = document.createElement('div');
    bg.className = 'home-v3-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = `
      <div class="home-v3-backdrop"></div>
      <div class="home-v3-moon"></div>
      <div class="home-v3-skyline home-v3-skyline-back"></div>
      <div class="home-v3-skyline home-v3-skyline-front"></div>
      <div class="home-v3-rooftop"></div>
      <div class="home-v3-atmosphere home-v3-atmosphere-one"></div>
      <div class="home-v3-atmosphere home-v3-atmosphere-two"></div>
      <div class="home-v3-rain"></div>
    `;

    const shell = document.createElement('div');
    shell.className = 'home-v3-shell';
    shell.innerHTML = `
      <header class="home-v3-header">
        <div class="home-v3-brand" aria-label="Relay Runner">
          <span class="home-v3-brand-mark">R/</span>
          <span>RELAY RUNNER</span>
        </div>
        <div class="home-v3-status" aria-label="System status">
          <span class="home-v3-status-dot"></span>
          <span>SYSTEM ONLINE</span>
        </div>
      </header>

      <main class="home-v3-stage">
        <section class="home-v3-copy-block" aria-labelledby="homeV3Title">
          <p class="home-v3-overline">NIGHT SHIFT</p>
          <h1 id="homeV3Title" class="home-v3-title">RELAY<span>RUNNER</span></h1>
          <p class="home-v3-subline">ROOFTOP RELAY // CHAPTER 01</p>

          <div class="home-v3-actions" aria-label="Main menu">
            <button id="start" class="home-v3-primary" type="button">
              <span>PLAY NOW</span>
              <b aria-hidden="true">→</b>
            </button>

            <button id="continue" class="home-v3-secondary home-v3-secondary-accent hidden" type="button">
              <span>CONTINUE</span>
              <b aria-hidden="true">→</b>
            </button>

            <button class="home-v3-secondary" type="button" data-home-action="options">
              <span>OPTIONS</span>
              <small>SETTINGS</small>
            </button>
          </div>
        </section>

        <section class="home-v3-hero" aria-hidden="true">
          <div class="home-v3-hero-glow"></div>
          <div class="home-v3-runner-shadow"></div>
          <div class="home-v3-runner">
            <svg viewBox="0 0 260 430" role="presentation" focusable="false">
              <defs>
                <linearGradient id="runnerSuit" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#f3fbff" stop-opacity=".98"/>
                  <stop offset=".42" stop-color="#86e8ff" stop-opacity=".9"/>
                  <stop offset="1" stop-color="#164b69" stop-opacity=".55"/>
                </linearGradient>
                <linearGradient id="runnerDark" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#0b1724"/>
                  <stop offset="1" stop-color="#02060c"/>
                </linearGradient>
                <filter id="runnerGlow" x="-70%" y="-30%" width="240%" height="180%">
                  <feGaussianBlur stdDeviation="7" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <g filter="url(#runnerGlow)" opacity=".98">
                <path d="M144 32c17 0 31 13 31 31s-14 31-31 31-31-13-31-31 14-31 31-31Z" fill="url(#runnerDark)" stroke="#9aefff" stroke-opacity=".62" stroke-width="3"/>
                <path d="M123 96 160 88l31 69-35 22-21-40-24 76-28 56-26-9 33-72 18-96Z" fill="url(#runnerDark)" stroke="#83e7ff" stroke-opacity=".55" stroke-width="3"/>
                <path d="m126 111-31 50-48 15 7 23 57-18 38-48Z" fill="url(#runnerSuit)" stroke="#aef3ff" stroke-opacity=".52" stroke-width="3"/>
                <path d="m173 112 42 54 31 8-7 24-45-10-42-43Z" fill="url(#runnerSuit)" stroke="#aef3ff" stroke-opacity=".5" stroke-width="3"/>
                <path d="m136 201-41 86-54 75 18 17 67-63 52-80Z" fill="url(#runnerDark)" stroke="#67dfff" stroke-opacity=".6" stroke-width="3"/>
                <path d="m166 190 34 68 42 44-15 19-64-41-42-63Z" fill="url(#runnerDark)" stroke="#67dfff" stroke-opacity=".6" stroke-width="3"/>
                <path d="m52 353-28 30 13 15 39-29Z" fill="#8ce9ff" fill-opacity=".82"/>
                <path d="m226 300 28 14-8 19-36-15Z" fill="#8ce9ff" fill-opacity=".82"/>
                <path d="M105 109h39l9 27-39 12Z" fill="#ffd06e" fill-opacity=".85"/>
                <path d="M114 160h48" stroke="#ffd06e" stroke-opacity=".65" stroke-width="4" stroke-linecap="round"/>
              </g>
            </svg>
          </div>
          <div class="home-v3-hero-label home-v3-hero-label-top">RUNNER // 01</div>
          <div class="home-v3-hero-label home-v3-hero-label-bottom">SIGNAL CARRIER</div>
        </section>
      </main>

      <footer class="home-v3-footer">
        <div class="home-v3-footer-left">
          <button class="home-v3-utility" type="button" data-home-action="faq">FAQ</button>
          <button class="home-v3-utility" type="button" data-home-action="update">UPDATE</button>
        </div>
        <div class="home-v3-footer-right">RELAY RUNNER · v1.1.0</div>
      </footer>

      <div class="home-v3-keyline" aria-hidden="true"></div>

      <!-- Compatibility anchor retained for systems that still query #exitTitle. -->
      <button id="exitTitle" type="button" aria-hidden="true" tabindex="-1" class="home-v3-compat-anchor">EXIT</button>
    `;

    intro.append(bg, shell);

    bindAction(shell.querySelector('[data-home-action="options"]'), 'options');
    bindAction(shell.querySelector('[data-home-action="faq"]'), 'faq');
    bindAction(shell.querySelector('[data-home-action="update"]'), 'update');
  };

  const boot = () => {
    build();
    syncHomeState();

    const intro = $('intro');
    if (intro && !intro.dataset.homeConcept6Observed) {
      intro.dataset.homeConcept6Observed = '1';
      new MutationObserver(syncHomeState).observe(intro, {
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden']
      });
    }

    document.addEventListener('keydown', event => {
      if (!isHomeVisible() || event.repeat) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        clickExisting('#start');
      }
      if (event.key === 'Escape') {
        const title = $('titlePanel');
        const info = $('relayInfoPanel');
        if (!title?.classList.contains('hidden')) title.classList.add('hidden');
        if (!info?.classList.contains('hidden')) info.classList.add('hidden');
      }
    });
  };

  // index.html loads this module at the end of <body>, so the Home DOM exists now.
  boot();
})();
