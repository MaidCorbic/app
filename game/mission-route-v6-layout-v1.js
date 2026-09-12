/*
 * RUNNER RELAY — MISSION ROUTE V6 LAYOUT
 * Presentation-only command-center composition.
 * Reuses the existing real Phaser map/SVG and briefing data.
 * No gameplay, route, mission, or map-generation logic is changed.
 */
(() => {
  'use strict';

  const ROOT_ID = 'relayGameplayIntroFinalV5';
  const KEY = '__relayMissionRouteV6Mounted';

  const mount = () => {
    const root = document.getElementById(ROOT_ID);
    if (!(root instanceof HTMLElement) || root.dataset[KEY] === '1') return false;

    const main = root.querySelector('.rv5-main');
    const map = root.querySelector('.rv5-map');
    const stats = root.querySelector('.rv5-stats');
    if (!main || !map || !stats) return false;

    root.dataset[KEY] = '1';

    const makePanel = (side, label, html) => {
      const node = document.createElement('aside');
      node.className = `rv6-route-panel rv6-route-panel-${side}`;
      node.setAttribute('aria-label', label);
      node.innerHTML = html;
      return node;
    };

    const left = makePanel('left', 'Tactical route information', `
      <div class="rv6-panel-corner tl" aria-hidden="true"></div>
      <div class="rv6-panel-corner bl" aria-hidden="true"></div>
      <div class="rv6-panel-eyebrow">TACTICAL INFO</div>
      <div class="rv6-panel-title" data-rv6-title>RLY // 04 // SPINE</div>
      <div class="rv6-panel-divider"></div>
      <div class="rv6-panel-row"><span>ROUTE</span><strong data-rv6-route>LIVE</strong></div>
      <div class="rv6-panel-row"><span>THREAT</span><strong class="danger" data-rv6-threat>ACTIVE</strong></div>
      <div class="rv6-panel-row"><span>MAP</span><strong data-rv6-source>LIVE PHASER</strong></div>
      <div class="rv6-panel-live"><i></i>REAL LEVEL ROUTE</div>
    `);

    const right = makePanel('right', 'Route analysis', `
      <div class="rv6-panel-corner tr" aria-hidden="true"></div>
      <div class="rv6-panel-corner br" aria-hidden="true"></div>
      <div class="rv6-panel-eyebrow">ROUTE ANALYSIS</div>
      <div class="rv6-panel-title" data-rv6-analysis>LIVE PHASER WORLD</div>
      <div class="rv6-panel-divider"></div>
      <div class="rv6-panel-row"><span>ROUTE</span><strong data-rv6-route-state>CALCULATED</strong></div>
      <div class="rv6-panel-row"><span>CHECKPOINTS</span><strong data-rv6-checkpoints>--</strong></div>
      <div class="rv6-panel-row"><span>THREAT LEVEL</span><strong class="danger" data-rv6-analysis-threat>ACTIVE</strong></div>
      <div class="rv6-analysis-signal"><i></i><b>ROUTE CHANNEL</b><em>ONLINE</em></div>
    `);

    const center = document.createElement('div');
    center.className = 'rv6-route-map-frame';
    center.setAttribute('aria-label', 'Live tactical map');
    center.appendChild(map);

    const layout = document.createElement('div');
    layout.className = 'rv6-route-layout';
    layout.append(left, center, right);
    main.insertBefore(layout, stats);

    map.querySelectorAll('.rv5-map-label, .rv5-live-tag, .guide').forEach(node => {
      node.setAttribute('data-rv6-hidden', '1');
    });

    const read = node => node?.textContent?.trim() || '';
    const set = (selector, value) => {
      const node = root.querySelector(selector);
      if (node && value) node.textContent = value;
    };

    const sync = () => {
      const top = map.querySelector('.rv5-map-label.top strong');
      const bottom = map.querySelector('.rv5-map-label.bottom strong');
      const source = stats.querySelector('div:nth-child(1) strong');
      const route = stats.querySelector('div:nth-child(2) strong');
      const threat = stats.querySelector('div:nth-child(3) strong');
      const checkpointCount = map.querySelectorAll('.checkpoint').length;
      set('[data-rv6-title]', read(top) || 'RLY // 04 // SPINE');
      set('[data-rv6-analysis]', read(bottom) || 'LIVE PHASER WORLD');
      set('[data-rv6-source]', read(source) || 'LIVE PHASER');
      set('[data-rv6-route-state]', read(route) || 'CALCULATED');
      set('[data-rv6-route]', read(route) === 'CALCULATED' ? 'LIVE' : (read(route) || 'LIVE'));
      set('[data-rv6-threat]', read(threat) || 'ACTIVE');
      set('[data-rv6-analysis-threat]', read(threat) || 'ACTIVE');
      set('[data-rv6-checkpoints]', checkpointCount ? String(checkpointCount).padStart(2, '0') : '--');
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(map, { childList: true, subtree: true, characterData: true });
    root.__relayMissionRouteV6Observer = observer;
    return true;
  };

  const timer = window.setInterval(() => {
    if (mount()) window.clearInterval(timer);
  }, 100);
  window.setTimeout(() => window.clearInterval(timer), 12000);
  mount();
})();
