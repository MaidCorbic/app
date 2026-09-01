/* Relay Runner Home V3 — presentation layer for the existing canonical Home. */
(() => {
  'use strict';

  const INTRO_ID = 'intro';
  const V3_CLASS = 'home-v3';
  const ROOT_ID = 'homeV3Root';

  function getIntro() {
    return document.getElementById(INTRO_ID);
  }

  function clickCanonical(selector) {
    const button = document.querySelector(selector);
    if (button instanceof HTMLElement) button.click();
  }

  function buildHome() {
    const intro = getIntro();
    if (!intro || document.getElementById(ROOT_ID)) return;

    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'home-v3-bg';
    root.setAttribute('aria-hidden', 'false');
    root.innerHTML = `
      <div class="home-v3-grid" aria-hidden="true"></div>
      <div class="home-v3-glow" aria-hidden="true"></div>
      <div class="home-v3-scan" aria-hidden="true"></div>

      <div class="home-v3-shell">
        <header class="home-v3-header">
          <div class="home-v3-brand">
            <span class="home-v3-mark">R/</span>
            <span>RELAY RUNNER</span>
          </div>
          <div class="home-v3-status">
            CHAPTER 01 / NIGHT SHIFT<br>
            STATUS <b>ONLINE</b>
          </div>
        </header>

        <main class="home-v3-main">
          <section>
            <p class="home-v3-kicker">A ROOFTOP DELIVERY GAME</p>
            <h1 class="home-v3-title">RELAY <em>RUNNER</em></h1>
            <p class="home-v3-copy">
              RUN THE SLEEPING CITY. CARRY THE SIGNAL FURTHER THAN ANYONE ELSE CAN.
            </p>

            <div class="home-v3-actions">
              <button class="home-v3-play" type="button" data-v3-play>
                PLAY NOW <span aria-hidden="true">→</span>
              </button>
              <button class="home-v3-continue" type="button" data-v3-continue hidden>
                CONTINUE <span aria-hidden="true">→</span>
              </button>
              <button class="home-v3-continue" type="button" data-v3-options>
                OPTIONS / CONTROLS
              </button>
            </div>
          </section>

          <aside class="home-v3-side" aria-label="Home menu">
            <button class="home-v3-card" type="button" data-v3-info="faq">
              <span>FAQ</span>
              <small>HOW TO PLAY / CONTROLS</small>
            </button>
            <button class="home-v3-card" type="button" data-v3-info="update">
              <span>LATEST UPDATE</span>
              <small>PATCH NOTES / NEW FEATURES</small>
            </button>
            <button class="home-v3-card" type="button" data-v3-options>
              <span>SETTINGS</span>
              <small>AUDIO / CONTROLS / GAME OPTIONS</small>
            </button>
          </aside>
        </main>

        <footer class="home-v3-footer">
          <span>RELAY SYSTEM <b>READY</b></span>
          <span>BUILD <b>LIVE</b></span>
        </footer>
      </div>
    `;

    intro.appendChild(root);

    const canonicalContinue = document.getElementById('continue');
    const v3Continue = root.querySelector('[data-v3-continue]');
    const syncContinue = () => {
      if (!(v3Continue instanceof HTMLElement)) return;
      const available = canonicalContinue instanceof HTMLElement && !canonicalContinue.classList.contains('hidden') && !canonicalContinue.hidden;
      v3Continue.hidden = !available;
    };

    root.querySelector('[data-v3-play]')?.addEventListener('click', () => clickCanonical('#start'));
    v3Continue?.addEventListener('click', () => clickCanonical('#continue'));

    root.querySelectorAll('[data-v3-options]').forEach(button => {
      button.addEventListener('click', () => clickCanonical('[data-title-panel="controls"]'));
    });

    root.querySelector('[data-v3-info="faq"]')?.addEventListener('click', () => {
      clickCanonical('.faq-launcher');
    });
    root.querySelector('[data-v3-info="update"]')?.addEventListener('click', () => {
      clickCanonical('.info-circle');
    });

    syncContinue();
    if (canonicalContinue) {
      new MutationObserver(syncContinue).observe(canonicalContinue, {
        attributes: true,
        attributeFilter: ['class', 'hidden']
      });
    }
  }

  function activate() {
    const intro = getIntro();
    if (!intro) return;
    intro.classList.add(V3_CLASS);
    intro.setAttribute('aria-hidden', 'false');
    buildHome();
  }

  function boot() {
    activate();
    const intro = getIntro();
    if (!intro) return;

    new MutationObserver(() => {
      if (!intro.classList.contains(V3_CLASS)) activate();
      if (!document.getElementById(ROOT_ID)) buildHome();
    }).observe(intro, {
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'hidden']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
