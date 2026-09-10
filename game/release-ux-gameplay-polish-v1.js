/* Relay Runner — release-candidate interaction + gameplay polish.
 * One additive layer: no second gameplay owner, no duplicate controls, no alternate mission state.
 */
(() => {
  'use strict';
  if (window.__relayReleaseUxGameplayPolishV1) return;
  window.__relayReleaseUxGameplayPolishV1 = true;

  const isTouch = () => document.body.classList.contains('is-touch');
  const visible = id => {
    const el = document.getElementById(id);
    return !!el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none';
  };

  const fitScrollHost = host => {
    if (!host) return;
    host.style.setProperty('overflow-y', 'auto', 'important');
    host.style.setProperty('overflow-x', 'hidden', 'important');
    host.style.setProperty('scroll-behavior', 'smooth', 'important');
    host.style.setProperty('overscroll-behavior', 'contain', 'important');
    host.style.setProperty('scrollbar-gutter', 'stable', 'important');
    host.style.setProperty('touch-action', 'pan-y', 'important');
    host.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
  };

  const rememberScroll = panel => {
    const body = panel?.querySelector('.relay-options-body');
    if (!body) return;
    const top = Number(panel.dataset.releaseScrollTop || 0);
    fitScrollHost(body);
    if (top > 0) body.scrollTop = Math.min(top, Math.max(0, body.scrollHeight - body.clientHeight));
    body.addEventListener('scroll', () => { panel.dataset.releaseScrollTop = String(body.scrollTop); }, { passive: true });
  };

  const hardenOpenOnce = () => {
    let optionsIntent = false;
    window.addEventListener('pointerdown', event => {
      const target = event.target instanceof Element ? event.target : null;
      optionsIntent = !!target?.closest('#intro [data-title-panel="controls"], #intro [data-v3-options], #intro [data-home-v4-action="options"]');
      if (!optionsIntent) return;
      window.setTimeout(() => {
        const panel = document.getElementById('titlePanel');
        if (!panel || !optionsIntent) return;
        panel.classList.remove('hidden');
        panel.removeAttribute('hidden');
        panel.setAttribute('aria-hidden', 'false');
        panel.classList.add('relay-options-unified');
        fitScrollHost(panel.querySelector('.relay-options-body'));
        rememberScroll(panel);
        window.dispatchEvent(new Event('relay-open-home-options'));
      }, 0);
    }, true);
  };

  const pauseBrief = () => {
    const menu = document.getElementById('pauseMenu');
    if (!menu) return;
    let card = menu.querySelector('#relayPauseBrief');
    if (!card) {
      card = document.createElement('div');
      card.id = 'relayPauseBrief';
      card.className = 'relay-pause-brief';
      card.innerHTML = '<span class="pause-badge">PAUSED</span><div class="pause-copy"><strong id="relayPauseHeadline">RUN STATE FROZEN</strong><span id="relayPauseMessage">Your route, timer and movement are safely paused.</span></div>';
      const footer = menu.querySelector('footer');
      const grid = menu.querySelector('.menu-grid');
      (grid || footer || menu).after(card);
    }

    const messages = [
      ['RUN STATE FROZEN', 'Your route, timer and movement are safely paused.'],
      ['CHECK YOUR LOADOUT', 'Resume when you are ready. Your mission state is preserved.'],
      ['SIGNAL LOCKED', 'No progress is lost while the run is paused.'],
      ['ROUTE ON HOLD', 'Take a breath, review the terminal, then return to the run.'],
    ];
    let index = Number(card.dataset.messageIndex || 0) % messages.length;
    let timer = Number(card.dataset.messageTimer || 0);
    const paint = () => {
      const [headline, message] = messages[index % messages.length];
      card.querySelector('#relayPauseHeadline').textContent = headline;
      card.querySelector('#relayPauseMessage').textContent = message;
      card.dataset.messageIndex = String(index % messages.length);
    };
    paint();
    if (!timer) {
      timer = window.setInterval(() => {
        if (!visible('pauseMenu')) return;
        index = (index + 1) % messages.length;
        paint();
      }, 30000);
      card.dataset.messageTimer = String(timer);
    }
  };

  const removeLegacyYellowRectangles = root => {
    if (!root) return;
    root.querySelectorAll('.gold-rect,.gold-bar,.gold-strip,.yellow-rect,.yellow-bar,.legacy-gold-block,[data-gold-rect]').forEach(el => {
      el.classList.add('release-hidden-yellow');
    });
  };

  const hardenEnemyIntelEnter = () => {
    document.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || isTouch()) return;
      const intel = document.getElementById('enemyDiscovery');
      if (!intel || intel.classList.contains('hidden') || getComputedStyle(intel).display === 'none') return;
      const scene = window.__relayRunnerScene || window.game?.scene?.getScene?.('runner');
      if (typeof scene?.dismissIntelCard !== 'function') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      scene.dismissIntelCard();
    }, true);
  };

  const hardenFinishFlow = () => {
    const finish = document.getElementById('finish');
    if (!finish) return;
    let lastRunKey = '';
    const sync = () => {
      if (!finish || finish.classList.contains('hidden')) return;
      const scene = window.__relayRunnerScene;
      if (!scene?.mission?.id) return;
      const key = String(scene.runId ?? scene.__webSceneStartedAt ?? `${scene.mission.id}:${scene.elapsedMs}`);
      if (key === lastRunKey) return;
      lastRunKey = key;
      finish.dataset.missionId = scene.mission.id;
      finish.dataset.runId = String(scene.runId ?? '');
      const performanceResult = window.__missionFlowPerformanceV1?.latest;
      if (performanceResult?.missionId === scene.mission.id) {
        const rating = document.getElementById('finishRating');
        const score = document.getElementById('finishScore');
        if (rating && !rating.textContent.trim()) rating.textContent = performanceResult.rating;
        if (score && !score.textContent.trim()) score.textContent = `RUN SCORE ${performanceResult.score}`;
      }
    };
    new MutationObserver(sync).observe(finish, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('relay:mission-performance-complete', sync, { passive: true });
    window.addEventListener('relay:mission-complete', () => window.setTimeout(sync, 0), { passive: true });
  };

  const mapPolish = () => {
    const root = document.getElementById('relayGameplayIntroFinalV3');
    if (!root) return;
    const map = root.querySelector('.map-briefing-map');
    if (!map) return;
    if (!root.querySelector('.release-map-legend')) {
      const legend = document.createElement('div');
      legend.className = 'release-map-legend';
      legend.innerHTML = '<span><i class="legend-start"></i>START</span><span><i class="legend-route"></i>SAFE ROUTE</span><span><i class="legend-goal"></i>RELAY</span><span><i class="legend-threat"></i>THREAT</span>';
      root.querySelector('.map-briefing-map-wrap')?.append(legend);
    }
    map.setAttribute('aria-label', 'Tactical mission route map');
  };

  const observeUi = () => {
    const sync = () => {
      const home = document.getElementById('titlePanel');
      if (home && !home.classList.contains('hidden')) {
        fitScrollHost(home.querySelector('.relay-options-body'));
        rememberScroll(home);
      }
      const pause = document.getElementById('pauseMenu');
      if (pause && !pause.classList.contains('hidden')) {
        pauseBrief();
        fitScrollHost(pause.querySelector('.relay-options-body'));
        rememberScroll(pause);
      }
      removeLegacyYellowRectangles(document.getElementById('intro'));
      removeLegacyYellowRectangles(document.getElementById('play'));
      mapPolish();
    };
    new MutationObserver(sync).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    sync();
  };

  const boot = () => {
    hardenOpenOnce();
    hardenEnemyIntelEnter();
    hardenFinishFlow();
    observeUi();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
