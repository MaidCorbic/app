import { missions } from './src/missions.js';
import { RELAY_FAQ, LATEST_UPDATE } from './faq.js';

(() => {
  'use strict';
  if (window.__relayUnifiedGameplayUiV1) return;
  window.__relayUnifiedGameplayUiV1 = true;

  const $ = id => document.getElementById(id);
  const UPDATE_KEY = 'relay.runner.live.updates.v1';
  const PREFS_KEY = 'relay.runner.ui.preferences.v1';
  const latestUpdates = [
    { id:'menu-unification', version:'1.1.0', date:'2026-08-30', title:'Unified cinematic menus', detail:'Options, FAQ and Pause share one responsive tactical presentation.' },
    { id:'gameplay-hud', version:'1.1.0', date:'2026-08-30', title:'Gameplay HUD refinement', detail:'Mission, Signals and control panels are compact and aligned for web and mobile.' },
    { id:'mission-intelligence', version:'1.1.0', date:'2026-08-30', title:'Mission Intelligence', detail:'Contextual intelligence is shown only when the current route needs it.' },
    { id:'orientation', version:'1.1.0', date:'2026-08-30', title:'Landscape guidance', detail:'Mobile gameplay controls remain hidden until the active landscape layout is ready.' },
  ];

  const readUpdates = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(UPDATE_KEY) || '[]');
      return Array.isArray(parsed) && parsed.length ? parsed.slice(0, 12) : latestUpdates.slice();
    } catch {
      return latestUpdates.slice();
    }
  };

  const writeUpdates = value => {
    try { localStorage.setItem(UPDATE_KEY, JSON.stringify(value.slice(0, 12))); } catch {}
  };

  const readPrefs = () => {
    try { return { ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; } catch { return {}; }
  };

  const announce = text => {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(announce._timer);
    announce._timer = setTimeout(() => toast.classList.remove('show'), 1800);
  };

  const closeInfoPanel = () => {
    const panel = $('relayInfoPanel');
    panel?.classList.add('hidden');
    panel?.classList.remove('relay-update-mode');
    panel?.setAttribute('aria-hidden', 'true');
  };

  const closeAllOverlays = () => {
    closeInfoPanel();
    $('relayUpdateCenter')?.classList.add('hidden');
    $('titlePanel')?.classList.add('hidden');
    $('preflight')?.classList.add('hidden');
  };

  const safeText = value => String(value ?? '');
  const faqMarkup = () => `
    <div class="relay-faq-grid">
      ${RELAY_FAQ.map(([question, answer], index) => `
        <article class="relay-faq-item${index === 0 ? ' is-open' : ''}">
          <button class="relay-faq-question" type="button" data-faq-question aria-expanded="${index === 0 ? 'true' : 'false'}">
            <span>${safeText(question)}</span>
            <b aria-hidden="true">${index === 0 ? '−' : '+'}</b>
          </button>
          <div class="relay-faq-answer"${index === 0 ? '' : ' hidden'}>${safeText(answer)}</div>
        </article>
      `).join('')}
    </div>
  `;

  const updateMarkup = () => `
    <div class="relay-update-terminal">
      <div class="relay-update-meta">LIVE CHANNEL · ${safeText(LATEST_UPDATE.version || 'GAMEPLAY')}</div>
      <div class="relay-update-list">
        ${readUpdates().map((item, index) => `
          <article class="relay-update-item" data-update-index="${index}">
            <div class="relay-update-item-main">
              <span class="relay-update-item-kicker">${safeText(item.version || 'LIVE')} · ${safeText(item.date || '')}</span>
              <strong>${safeText(item.title || 'SYSTEM UPDATE')}</strong>
              <small>${safeText(item.detail || '')}</small>
            </div>
          </article>
        `).join('')}
      </div>
    </div>
  `;

  const openInfoPanel = kind => {
    const panel = $('relayInfoPanel');
    const eyebrow = $('relayInfoEyebrow');
    const heading = $('relayInfoHeading');
    const content = $('relayInfoContent');
    if (!panel || !eyebrow || !heading || !content) return false;

    $('relayUpdateCenter')?.classList.add('hidden');
    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('relay-update-mode', kind === 'update');

    if (kind === 'faq') {
      eyebrow.textContent = 'RELAY RUNNER // FIELD GUIDE';
      heading.textContent = 'FAQ';
      content.innerHTML = faqMarkup();
    } else {
      eyebrow.textContent = LATEST_UPDATE.version || 'LATEST UPDATE';
      heading.textContent = 'UPDATE';
      content.innerHTML = updateMarkup();
    }

    return true;
  };

  const openOptions = () => {
    const panel = $('titlePanel');
    const content = $('titlePanelContent');
    if (!panel || !content) return false;
    panel.classList.remove('hidden');
    panel.removeAttribute('hidden');
    panel.setAttribute('aria-hidden', 'false');
    document.dispatchEvent(new CustomEvent('relay-open-home-options', { detail: { panel, content, source: 'unified-gameplay-ui' } }));
    return true;
  };

  const refreshUpdates = () => {
    const custom = window.__relayLiveUpdates;
    const next = Array.isArray(custom) && custom.length ? custom : latestUpdates;
    writeUpdates(next);
    openInfoPanel('update');
    announce('UPDATE CHANNEL REFRESHED');
  };

  const renderUpdateCenter = () => {
    const host = $('relayUpdateCenter');
    if (!host) return;
    host.className = 'relay-update-center relay-cinematic-overlay';
    host.innerHTML = `
      <div class="relay-cinematic-panel relay-update-panel">
        <button class="relay-cinematic-close" type="button" data-relay-update-close aria-label="Close updates">×</button>
        <header class="relay-cinematic-head">
          <div>
            <p class="relay-cinematic-kicker">RELAY RUNNER // LIVE CHANNEL</p>
            <h2 class="relay-cinematic-title">UPDATE</h2>
            <p class="relay-cinematic-subtitle">Recent changes, gameplay improvements and live system refresh.</p>
          </div>
          <span class="relay-cinematic-status"><i></i>REALTIME</span>
        </header>
        <div class="relay-cinematic-body">
          ${updateMarkup()}
          <div class="relay-update-actions">
            <button type="button" class="relay-ui-button primary" data-relay-update-refresh>REFRESH NOW</button>
            <button type="button" class="relay-ui-button" data-relay-update-close>DONE</button>
          </div>
        </div>
      </div>
    `;
    host.classList.remove('hidden');
  };

  const addLiveUpdate = update => {
    if (!update || typeof update !== 'object') return;
    const incoming = {
      id: update.id || `live-${Date.now()}`,
      version: update.version || 'LIVE',
      date: update.date || new Date().toISOString().slice(0, 10),
      title: update.title || 'LIVE UPDATE',
      detail: update.detail || update.message || '',
    };
    writeUpdates([incoming, ...readUpdates().filter(item => item.id !== incoming.id)]);
    if (!$('relayUpdateCenter')?.classList.contains('hidden')) renderUpdateCenter();
    announce(`NEW UPDATE · ${incoming.title}`);
  };

  const injectHomeLinks = () => {
    const intro = $('intro');
    if (!intro) return;
    // Home V4 owns the visible utility buttons. Do not add a second FAQ/Update row.
    if (intro.querySelector('[data-home-v4-action]')) return;
    const side = intro.querySelector('.home-v3-side');
    if (!side) return;
    const ensureCard = (id, text, small) => {
      let button = side.querySelector(`[data-unified-home="${id}"]`);
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'home-v3-card relay-home-nav-card';
        button.dataset.unifiedHome = id;
        button.innerHTML = `<span>${text}</span><small>${small}</small>`;
        side.appendChild(button);
      }
      button.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        if (id === 'faq') openInfoPanel('faq');
        else openInfoPanel('update');
      };
    };
    ensureCard('faq', 'FAQ', 'HELP · GAME SYSTEMS');
    ensureCard('update', 'UPDATE', 'LATEST PATCHES · LIVE');
  };

  const missionIntel = mission => ({
    'first-delivery':['ROUTE ONLINE','Follow the low line, collect Signals and make the first relay handoff.',['LEVEL 01','SAFE ROUTE']],
    'dead-drop':['BOOST ROUTE DETECTED','Boost pads reward momentum. The high line is faster but narrower.',['LEVEL 02','HIGH LINE']],
    blackout:['BLACKOUT SECTOR','Follow safe lights through the dark. High routes expose extra Signals and Secrets.',['LEVEL 03','SAFE LIGHT']],
    pursuit:['INTERCEPTOR DETECTED','Keep momentum through the chase sectors. Checkpoints are your recovery line.',['LEVEL 04','CHASE ACTIVE']],
    'signal-storm':['STORM SIGNAL','Watch the sky and combine movement tools with combat to protect the route.',['LEVEL 05','STORM']],
    'corporate-lockdown':['CORPORATE LOCKDOWN','Security systems are hostile. Clear gates quickly and protect the package.',['LEVEL 06','HIGH THREAT']],
    'final-relay':['FINAL RELAY','Everything converges here. Read the route, clear threats and complete the handoff.',['FINAL','APEX SPINE']],
  }[mission?.id] || ['MISSION INTELLIGENCE','Stay focused on the current objective and read the route cues.',['LIVE']]);

  const ensureGameplayElements = () => {
    const play = $('play');
    if (!play || $('relayGameplayIntel')) return;
    const intel = document.createElement('section');
    intel.id = 'relayGameplayIntel';
    intel.className = 'relay-gameplay-intel';
    intel.setAttribute('aria-live', 'polite');
    intel.innerHTML = '<p class="intel-kicker">MISSION INTELLIGENCE</p><h3 class="intel-title"></h3><p class="intel-detail"></p><div class="intel-meta"></div>';
    play.append(intel);
  };

  const getMission = () => {
    const number = Number(($('missionNumber')?.textContent || '').replace(/\D/g, ''));
    if (number >= 1 && missions[number - 1]) return missions[number - 1];
    const objective = ($('objective')?.textContent || '').trim().toLowerCase();
    return missions.find(mission => mission.title.toLowerCase() === objective) || missions[0];
  };

  let intelTimer = 0;
  const showIntel = reason => {
    ensureGameplayElements();
    const play = $('play');
    const intro = $('intro');
    const intel = $('relayGameplayIntel');
    const mission = getMission();
    if (!intel || !mission || !play || (intro && !intro.classList.contains('hidden'))) return;
    const [title, detail, meta] = missionIntel(mission);
    intel.querySelector('.intel-title').textContent = title;
    intel.querySelector('.intel-detail').textContent = detail;
    intel.querySelector('.intel-meta').innerHTML = meta.map(item => `<span class="intel-pill">${safeText(item)}</span>`).join('') + `<span class="intel-pill">${safeText(reason || 'MISSION').toUpperCase()}</span>`;
    intel.classList.add('is-active');
    clearTimeout(intelTimer);
    intelTimer = setTimeout(() => intel.classList.remove('is-active'), 4200);
  };

  const install = () => {
    injectHomeLinks();
    ensureGameplayElements();

    if (!$('relayUpdateCenter')) {
      const host = document.createElement('section');
      host.id = 'relayUpdateCenter';
      host.className = 'relay-update-center hidden';
      host.setAttribute('aria-label', 'Live updates');
      document.body.append(host);
    }

    window.relayOpenInfo = openInfoPanel;
    window.relayHomeInfoV1 = Object.freeze({ open: openInfoPanel });
    window.relayUpdateCenter = Object.freeze({ open: renderUpdateCenter, refresh: refreshUpdates, publish: addLiveUpdate });
    window.relayGameplayUI = Object.freeze({ showIntel });

    document.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const homeAction = target.closest('[data-home-v4-action]');
      if (homeAction && homeVisible()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const action = homeAction.dataset.homeV4Action;
        if (action === 'faq') openInfoPanel('faq');
        else if (action === 'update') openInfoPanel('update');
        else if (action === 'options') openOptions();
        return;
      }

      const infoButton = target.closest('[data-relay-info]');
      if (infoButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openInfoPanel(infoButton.dataset.relayInfo === 'update' ? 'update' : 'faq');
        return;
      }

      const faqQuestion = target.closest('[data-faq-question]');
      if (faqQuestion) {
        event.preventDefault();
        const item = faqQuestion.closest('.relay-faq-item');
        if (!item) return;
        const answer = item.querySelector('.relay-faq-answer');
        const willOpen = !item.classList.contains('is-open');
        item.classList.toggle('is-open', willOpen);
        faqQuestion.setAttribute('aria-expanded', String(willOpen));
        const icon = faqQuestion.querySelector('b');
        if (icon) icon.textContent = willOpen ? '−' : '+';
        if (answer) answer.hidden = !willOpen;
        return;
      }

      if (target.closest('[data-relay-close]')) {
        event.preventDefault();
        closeInfoPanel();
        return;
      }

      if (target.closest('[data-relay-update-close]')) {
        event.preventDefault();
        $('relayUpdateCenter')?.classList.add('hidden');
        return;
      }

      if (target.closest('[data-relay-update-refresh]')) {
        event.preventDefault();
        refreshUpdates();
        renderUpdateCenter();
      }
    }, true);

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      closeInfoPanel();
      $('relayUpdateCenter')?.classList.add('hidden');
    }, true);

    window.addEventListener('relay:update', event => addLiveUpdate(event.detail));
    window.addEventListener('relay:live-update', event => addLiveUpdate(event.detail));

    new MutationObserver(() => injectHomeLinks()).observe($('intro') || document.body, { subtree:true, childList:true });
    ['missionNumber','objective','routeIntel'].map(id => $(id)).filter(Boolean).forEach(node => {
      new MutationObserver(() => showIntel('ROUTE UPDATE')).observe(node, { childList:true, characterData:true, subtree:true });
    });
    window.addEventListener('gameplay:v12:event', event => showIntel(event.detail?.type || 'EVENT'));
    window.addEventListener('relay:mission-intelligence', event => showIntel(event.detail?.reason || 'INTEL'));
  };

  const homeVisible = () => {
    const intro = $('intro');
    return !!intro && !intro.classList.contains('hidden');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
