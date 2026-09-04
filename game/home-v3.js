/*
 * Runner Relay — Home V4 presentation owner.
 *
 * Contract:
 * - Home owns presentation only.
 * - #start / #continue remain the authoritative gameplay entry points.
 * - Options / FAQ / Update remain owned by existing systems.
 * - The intro surface is rebuilt once, without duplicating gameplay UI.
 */
(() => {
  'use strict';

  if (window.__relayHomeV4) return;
  window.__relayHomeV4 = true;

  const $ = id => document.getElementById(id);
  const introVisible = () => {
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

  const setHomeState = () => {
    const visible = introVisible();
    document.body.classList.toggle('home-v3-active', visible);
    $('intro')?.classList.toggle('home-v3', visible);
  };

  const bindOnce = (node, event, handler) => {
    if (!(node instanceof HTMLElement)) return;
    const key = `homeV4Bound${event}`;
    if (node.dataset[key] === '1') return;
    node.dataset[key] = '1';
    node.addEventListener(event, handler);
  };

  const buildHome = () => {
    const intro = $('intro');
    if (!intro || intro.dataset.homeV4Built === '1') return;

    intro.dataset.homeV4Built = '1';
    intro.classList.add('home-v3');
    intro.replaceChildren();

    const scene = document.createElement('div');
    scene.className = 'home-v4-scene';
    scene.setAttribute('aria-hidden', 'true');
    scene.innerHTML = `
      <div class="home-v4-art"></div>
      <div class="home-v4-sky"></div>
      <div class="home-v4-vignette"></div>
      <div class="home-v4-grid"></div>
      <div class="home-v4-scan"></div>
      <div class="home-v4-signal"></div>
      <div class="home-v4-float-line"></div>
      <div class="home-v4-badge">LIVE RELAY CHANNEL // 01</div>
    `;

    const shell = document.createElement('div');
    shell.className = 'home-v4-shell';
    shell.innerHTML = `
      <header class="home-v4-topbar">
        <div class="home-v4-brand" aria-label="Relay Runner">
          <span class="home-v4-brand-mark">R/</span>
          <span>RELAY RUNNER</span>
        </div>
        <div class="home-v4-status" aria-label="System status">
          <span class="home-v4-status-dot"></span>
          <b>SYSTEM ONLINE</b>
          <span>NIGHT SHIFT</span>
        </div>
      </header>

      <main class="home-v4-main">
        <section class="home-v4-copy" aria-labelledby="homeV4Title">
          <p class="home-v4-kicker">CHAPTER 01 / OLD QUARTER</p>
          <h1 id="homeV4Title" class="home-v4-title">RELAY<span>RUNNER</span></h1>
          <p class="home-v4-subline">ROOFTOP RELAY // LIVE NETWORK</p>
          <p class="home-v4-description">Run the sleeping city. Carry the signal farther than anyone else can. Keep the line open.</p>

          <div class="home-v4-actions" aria-label="Main menu">
            <button id="start" class="home-v4-primary" type="button">
              <span class="home-v4-primary-content">
                <span>START RUN</span>
                <span class="home-v4-arrow-key" aria-hidden="true">ENTER</span>
                <span class="home-v4-primary-arrow" aria-hidden="true">→</span>
              </span>
            </button>

            <button id="continue" class="home-v4-secondary hidden" type="button">
              <span>CONTINUE</span>
              <small>RESUME LAST RUN</small>
            </button>
          </div>
          <p class="home-v4-micro"><b>DEPLOYMENT READY</b> · PRESS ENTER TO BEGIN</p>
        </section>

        <section class="home-v4-mission-wrap" aria-label="Current mission">
          <article class="home-v4-mission">
            <div class="home-v4-mission-head">
              <span class="home-v4-mission-label">ACTIVE MISSION</span>
              <span class="home-v4-mission-code">RR-01 / NIGHT</span>
            </div>
            <h2 class="home-v4-mission-title">FOLLOW<br>THE RELAY</h2>
            <p class="home-v4-mission-sub">RECONNECT THE SIGNAL CHAIN ACROSS OLD QUARTER.</p>

            <div class="home-v4-mission-progress">
              <div class="home-v4-progress-meta">
                <span>SIGNAL RECOVERY</span>
                <strong id="homeV4SignalValue">02 / 08</strong>
              </div>
              <div class="home-v4-progress-bar" aria-hidden="true"><div id="homeV4SignalFill" class="home-v4-progress-fill"></div></div>
            </div>

            <div class="home-v4-stat-grid">
              <div class="home-v4-stat"><small>MISSION XP</small><b>+120</b></div>
              <div class="home-v4-stat"><small>BEST RATING</small><b>A</b></div>
            </div>
          </article>
        </section>
      </main>

      <footer class="home-v4-bottom">
        <div class="home-v4-bottom-left">
          <button class="home-v4-utility" type="button" data-home-v4-action="faq">? &nbsp;FAQ</button>
          <button class="home-v4-utility" type="button" data-home-v4-action="update">↗ &nbsp;UPDATE</button>
          <button class="home-v4-utility" type="button" data-home-v4-action="options">⚙ &nbsp;OPTIONS</button>
        </div>
        <div class="home-v4-bottom-meta">RELAY NETWORK <b>ONLINE</b> · V1.1.0</div>
      </footer>

      <!-- Compatibility anchor retained for systems that still query #exitTitle. -->
      <button id="exitTitle" type="button" aria-hidden="true" tabindex="-1" class="home-v4-compat-anchor">EXIT</button>
    `;

    intro.append(scene, shell);

    bindOnce(shell.querySelector('[data-home-v4-action="faq"]'), 'click', event => {
      event.preventDefault();
      openFaq();
    });
    bindOnce(shell.querySelector('[data-home-v4-action="update"]'), 'click', event => {
      event.preventDefault();
      openUpdate();
    });
    bindOnce(shell.querySelector('[data-home-v4-action="options"]'), 'click', event => {
      event.preventDefault();
      openOptions();
    });

    const start = shell.querySelector('#start');
    bindOnce(start, 'keydown', event => {
      if (event.key === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        clickExisting('#start');
      }
    });

    const continueButton = shell.querySelector('#continue');
    const sourceContinue = $('continue');
    const syncContinue = () => {
      if (!continueButton || !sourceContinue || continueButton === sourceContinue) return;
      continueButton.classList.toggle('hidden', sourceContinue.classList.contains('hidden') || getComputedStyle(sourceContinue).display === 'none');
    };
    syncContinue();
    if (sourceContinue && sourceContinue !== continueButton && !sourceContinue.dataset.homeV4Observed) {
      sourceContinue.dataset.homeV4Observed = '1';
      new MutationObserver(syncContinue).observe(sourceContinue, {attributes:true, attributeFilter:['class','style','hidden']});
    }

    bindOnce(continueButton, 'click', event => {
      event.preventDefault();
      clickExisting('#continue');
    });
  };

  const installKeyboard = () => {
    if (document.documentElement.dataset.homeV4Keys === '1') return;
    document.documentElement.dataset.homeV4Keys = '1';
    document.addEventListener('keydown', event => {
      if (!introVisible() || event.repeat) return;
      if (event.key === 'Enter') {
        const active = document.activeElement;
        const tag = active?.tagName;
        if (tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
          event.preventDefault();
          clickExisting('#start');
        }
      }
      if (event.key === 'Escape') {
        const title = $('titlePanel');
        const info = $('relayInfoPanel');
        if (!title?.classList.contains('hidden')) title.classList.add('hidden');
        if (!info?.classList.contains('hidden')) info.classList.add('hidden');
      }
    });
  };

  const boot = () => {
    buildHome();
    setHomeState();
    installKeyboard();

    const intro = $('intro');
    if (intro && intro.dataset.homeV4Observed !== '1') {
      intro.dataset.homeV4Observed = '1';
      new MutationObserver(setHomeState).observe(intro, {
        attributes:true,
        attributeFilter:['class','style','hidden']
      });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
