import './campaign-route-cinematic-v1.css';
import { missions } from './src/missions.js';
import { loadState } from './src/state.js';

(() => {
  'use strict';

  if (window.__relayCampaignRouteCinematicV1) return;
  window.__relayCampaignRouteCinematicV1 = true;

  const ART = Object.freeze({
    'first-delivery': 'homescreen.jpg',
    'dead-drop': 'homescreen.jpg',
    blackout: 'homescreen.jpg',
    pursuit: 'homescreen.jpg',
    'signal-storm': 'homescreen.jpg',
    'corporate-lockdown': 'homescreen.jpg',
    'final-relay': 'homescreen.jpg',
  });

  const ACCENTS = Object.freeze({
    'first-delivery': '#8df4ff',
    'dead-drop': '#ffb454',
    blackout: '#66f4ff',
    pursuit: '#ff5364',
    'signal-storm': '#b8a0ff',
    'corporate-lockdown': '#ff5a4f',
    'final-relay': '#ffd06e',
  });

  const $id = id => document.getElementById(id);
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  const stateSnapshot = () => {
    try {
      return loadState();
    } catch {
      return { completed: [], unlockedMissions: ['first-delivery'], missionStats: {} };
    }
  };

  const completedIds = state => new Set(Array.isArray(state?.completed) ? state.completed : []);

  const isUnlocked = (mission, state) => {
    if (!mission) return false;
    if (state?.unlockedMissions?.includes?.(mission.id)) return true;
    return !mission.unlockRequirement || completedIds(state).has(mission.unlockRequirement);
  };

  const statsFor = (mission, state) => {
    const raw = state?.missionStats?.[mission.id] || {};
    return {
      bestTime: Number.isFinite(Number(raw.bestTime)) ? Number(raw.bestTime) : null,
      bestRating: Number.isFinite(Number(raw.bestRating)) ? Number(raw.bestRating) : 0,
      runs: Number.isFinite(Number(raw.runs)) ? Number(raw.runs) : 0,
    };
  };

  const formatBestTime = value => {
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) return '--:--';
    const seconds = Math.floor(Number(value) / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const routePoints = mission => {
    const raw = [
      mission?.spawn || { x: 120, y: 520 },
      ...(mission?.checkpoints || []).map(([x, y]) => ({ x, y })),
      mission?.goal || { x: 6100, y: 500 },
    ];
    const maxX = Math.max(...raw.map(point => Number(point.x) || 0), 1);
    const ys = raw.map(point => Number(point.y) || 0);
    const minY = Math.min(...ys, 0);
    const maxY = Math.max(...ys, 720);
    const spanY = Math.max(maxY - minY, 1);
    return raw.map(point => ({
      x: 5 + ((Number(point.x) || 0) / maxX) * 90,
      y: 18 + (1 - (((Number(point.y) || 0) - minY) / spanY)) * 62,
    }));
  };

  const svgPath = points => points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');

  const routeBranches = mission => {
    const secrets = Array.isArray(mission?.secrets) ? mission.secrets : [];
    const checkpoints = Array.isArray(mission?.checkpoints) ? mission.checkpoints : [];
    if (!secrets.length) return '';
    const maxX = Math.max(Number(mission?.goal?.x) || 6100, 1);
    return secrets.slice(0, 3).map(([x, y], index) => {
      const anchor = checkpoints[Math.min(index, Math.max(checkpoints.length - 1, 0))] || [mission?.spawn?.x || 120, mission?.spawn?.y || 520];
      const ax = 5 + (Number(anchor[0]) / maxX) * 90;
      const ay = 18 + (1 - (Number(anchor[1]) / 720)) * 62;
      const sx = 5 + (Number(x) / maxX) * 90;
      const sy = 18 + (1 - (Number(y) / 720)) * 62;
      const cx = (ax + sx) / 2;
      const cy = (ay + sy) / 2 - 7;
      return `<path class="route-branch" d="M ${ax.toFixed(2)} ${ay.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${sx.toFixed(2)} ${sy.toFixed(2)}"/>`;
    }).join('');
  };

  const ensureShell = () => {
    const existing = $id('worldMap');
    if (existing) {
      existing.classList.add('relay-route-map');
      return existing;
    }
    const host = document.createElement('section');
    host.id = 'worldMap';
    host.className = 'world-map relay-route-map hidden';
    host.setAttribute('aria-label', 'City relay campaign map');
    $id('game')?.appendChild(host);
    return host;
  };

  const closeLegacyPanels = () => {
    ['preflight', 'titlePanel', 'relayInfoPanel'].forEach(id => $id(id)?.classList.add('hidden'));
  };

  const backToBriefing = host => {
    host?.classList.add('hidden');
    $id('intro')?.classList.remove('hidden');
    document.body.classList.remove('relay-route-active');
    document.body.classList.remove('relay-mission-launching');
  };

  const renderMission = mission => {
    const host = ensureShell();
    const state = stateSnapshot();
    if (!isUnlocked(mission, state)) return;

    const completed = completedIds(state).has(mission.id);
    const stats = statsFor(mission, state);
    const points = routePoints(mission);
    const path = svgPath(points);
    const accent = ACCENTS[mission.id] || '#8df4ff';
    const art = ART[mission.id] || 'homescreen.jpg';
    const index = missions.findIndex(item => item.id === mission.id);

    host.innerHTML = `
      <div class="relay-mission-bg" style="--mission-accent:${accent};background-image:linear-gradient(90deg,rgba(3,8,16,.97) 0%,rgba(3,8,16,.72) 50%,rgba(3,8,16,.28) 100%),url('./assets/${art}')"></div>
      <div class="relay-mission-noise"></div>
      <button class="relay-mission-close" id="relayMissionClose" type="button">← <span>ROUTE MAP</span></button>
      <div class="relay-mission-shell">
        <div class="relay-mission-copy">
          <p class="relay-route-kicker">${mission.story?.chapter || 'CITY RELAY NETWORK'}</p>
          <p class="relay-mission-number">MISSION ${String(index + 1).padStart(2, '0')} / ${String(missions.length).padStart(2, '0')}</p>
          <h2>${String(mission.title || '').toUpperCase()}</h2>
          <p class="relay-mission-district">${String(mission.district || '').toUpperCase()}</p>
          <p class="relay-mission-description">${mission.description || ''}</p>
          <div class="relay-mission-objective"><span>OBJECTIVE</span><b>${mission.objective || ''}</b></div>
          <div class="relay-mission-stats">
            <div><span>DIFFICULTY</span><b>${mission.difficulty || '--'}</b></div>
            <div><span>SIGNALS</span><b>${mission.signals?.length || 0}</b></div>
            <div><span>REWARD</span><b>+${mission.reward || 0} XP</b></div>
            <div><span>BEST</span><b>${formatBestTime(stats.bestTime)}</b></div>
          </div>
          <div class="relay-mission-actions">
            <button class="relay-route-primary" id="relayMissionStart" type="button">${completed ? 'REPLAY MISSION' : 'START MISSION'} <b>→</b></button>
            <span>${completed ? `SECURED · ${stats.bestRating ? '★'.repeat(stats.bestRating) : 'ROUTE COMPLETE'}` : 'ROUTE READY · LIVE DATA LINKED'}</span>
          </div>
        </div>
        <div class="relay-mission-route-panel">
          <div class="relay-mission-route-head"><span>LIVE ROUTE TRACE</span><b>${String(mission.district || '').toUpperCase()}</b></div>
          <div class="relay-mission-route-map">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path class="mission-route-grid" d="M 5 18 H 95 M 5 39 H 95 M 5 60 H 95 M 5 81 H 95 M 5 18 V 81 M 28 18 V 81 M 50 18 V 81 M 72 18 V 81 M 95 18 V 81"/>
              ${routeBranches(mission)}
              <path class="mission-route-glow" d="${path}"/>
              <path class="mission-route-line" d="${path}"/>
              ${points.map((point, pointIndex) => `<circle class="mission-route-point ${pointIndex === 0 ? 'origin' : pointIndex === points.length - 1 ? 'goal' : ''}" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="${pointIndex === 0 || pointIndex === points.length - 1 ? '2.8' : '2.2'}"/>`).join('')}
            </svg>
            <span class="route-panel-label start">START</span><span class="route-panel-label finish">GOAL</span>
          </div>
          <div class="relay-route-profile"><span>SAFE LINE</span><p>${mission.routeProfile?.normal || 'Follow the marked route and preserve momentum.'}</p><span>SKILL LINE</span><p>${mission.routeProfile?.skill || 'Use elevated routes for faster clears and secrets.'}</p></div>
        </div>
      </div>`;

    $id('relayMissionClose')?.addEventListener('click', renderMap);
    $id('relayMissionStart')?.addEventListener('click', () => void launchMission(mission));
    host.classList.remove('hidden');
    host.removeAttribute('aria-hidden');
  };

  const renderMap = () => {
    const host = ensureShell();
    const state = stateSnapshot();
    const completed = completedIds(state);
    const firstPlayable = missions.find(mission => isUnlocked(mission, state) && !completed.has(mission.id)) || missions.find(mission => isUnlocked(mission, state)) || missions[0];

    host.innerHTML = `
      <div class="relay-route-map-bg"></div>
      <div class="relay-route-map-grid"></div>
      <header class="relay-route-map-header">
        <div>
          <p class="relay-route-kicker">CITY RELAY NETWORK // LIVE CAMPAIGN</p>
          <h2>TRACE THE <em>LINE.</em></h2>
          <p class="relay-route-sub">Every node is tied to a playable route. The trace follows the level's real spawn, checkpoint and goal coordinates.</p>
        </div>
        <button id="relayRouteMapBack" class="relay-route-back" type="button">ESC <span>BRIEFING</span></button>
      </header>
      <section class="relay-route-layout">
        <div class="relay-route-canvas" aria-label="Playable route network">
          <div class="relay-route-cityline cityline-a"></div>
          <div class="relay-route-cityline cityline-b"></div>
          <div class="relay-route-cityline cityline-c"></div>
          <svg class="relay-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="routeTraceGradient" x1="0" x2="1"><stop offset="0" stop-color="#8df4ff"/><stop offset="1" stop-color="#ffd06e"/></linearGradient></defs>
            <path class="relay-route-glow" d="M 4 82 L 18 72 L 31 62 L 45 52 L 58 43 L 72 31 L 90 20" />
            <path class="relay-route-trunk" d="M 4 82 L 18 72 L 31 62 L 45 52 L 58 43 L 72 31 L 90 20" />
          </svg>
          ${missions.map((mission, missionIndex) => {
            const available = isUnlocked(mission, state);
            const done = completed.has(mission.id);
            const selected = mission.id === firstPlayable?.id;
            const x = 4 + (missionIndex / Math.max(missions.length - 1, 1)) * 86;
            const y = 82 - missionIndex * 10.2 + (missionIndex % 2 ? 2 : 0);
            return `<button class="relay-route-node ${done ? 'is-complete' : ''} ${available ? 'is-unlocked' : 'is-locked'} ${selected ? 'is-current' : ''}" type="button" data-route-mission="${mission.id}" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--mission-accent:${ACCENTS[mission.id] || '#8df4ff'}" ${available ? '' : 'disabled'} aria-label="${mission.title} — ${available ? 'available' : 'locked'}">
              <span class="relay-node-ring"></span><span class="relay-node-core">${done ? '✓' : String(missionIndex + 1).padStart(2, '0')}</span>
              <span class="relay-node-label"><small>${mission.district}</small><b>${mission.title}</b></span>
              ${available ? '<span class="relay-node-pulse"></span>' : ''}
            </button>`;
          }).join('')}
          <div class="relay-route-start"><i></i><span>ORIGIN<br><b>COURIER HUB</b></span></div>
          <div class="relay-route-finish"><i></i><span>DESTINATION<br><b>APEX RELAY</b></span></div>
          <div class="relay-route-compass"><b>N</b><span></span><small>GRID</small></div>
        </div>

        <aside class="relay-route-intel">
          <div class="relay-route-intel-top"><span>ROUTE INTELLIGENCE</span><i></i></div>
          <div id="relayRouteMissionList" class="relay-route-mission-list"></div>
          <footer><span><i class="legend-dot live"></i>ONLINE</span><span><i class="legend-dot done"></i>SECURED</span><span><i class="legend-dot locked"></i>LOCKED</span></footer>
        </aside>
      </section>`;

    $id('relayRouteMapBack')?.addEventListener('click', () => backToBriefing(host));

    const list = $id('relayRouteMissionList');
    if (list) {
      list.innerHTML = missions.map((mission, missionIndex) => {
        const available = isUnlocked(mission, state);
        const done = completed.has(mission.id);
        const stats = statsFor(mission, state);
        return `<button type="button" class="relay-route-list-row ${available ? '' : 'is-locked'} ${done ? 'is-complete' : ''}" data-route-mission="${mission.id}" ${available ? '' : 'disabled'}>
          <span class="route-list-index">${String(missionIndex + 1).padStart(2, '0')}</span>
          <span class="route-list-copy"><b>${mission.title}</b><small>${mission.district} · ${mission.difficulty}</small></span>
          <span class="route-list-status">${done ? '✓' : available ? (stats.bestRating ? '★'.repeat(stats.bestRating) : 'LIVE') : 'LOCK'}</span>
        </button>`;
      }).join('');
    }

    host.querySelectorAll('[data-route-mission]').forEach(button => button.addEventListener('click', () => {
      const mission = missions.find(item => item.id === button.dataset.routeMission);
      if (mission && isUnlocked(mission, state)) renderMission(mission);
    }));

    closeLegacyPanels();
    host.classList.remove('hidden');
    document.body.classList.add('relay-route-active');
    document.body.classList.remove('relay-mission-launching');
  };

  const launchMission = async mission => {
    const index = missions.findIndex(item => item.id === mission?.id);
    if (index < 0 || !isUnlocked(mission, stateSnapshot())) return false;

    const button = $id('relayMissionStart');
    button?.classList.add('is-loading');
    button?.setAttribute('disabled', 'disabled');
    document.body.classList.add('relay-mission-launching');
    await wait(110);

    try {
      if (typeof window.relayLaunchRun !== 'function') throw new Error('Canonical run launcher is unavailable');
      const result = await window.relayLaunchRun(index);
      if (result === false) throw new Error('Canonical run launcher reported failure');
      $id('worldMap')?.classList.add('hidden');
      $id('intro')?.classList.add('hidden');
      ['preflight', 'titlePanel', 'relayInfoPanel', 'finish', 'gameOver', 'levelUp', 'abilityUnlock'].forEach(id => $id(id)?.classList.add('hidden'));
      document.body.classList.add('relay-run-active');
      document.body.classList.remove('relay-route-active', 'relay-mission-launching');
      window.dispatchEvent(new CustomEvent('relay:campaign-mission-launched', { detail: { mission, index } }));
      return true;
    } catch (error) {
      button?.classList.remove('is-loading');
      button?.removeAttribute('disabled');
      document.body.classList.remove('relay-mission-launching');
      console.error('[RelayRunner] campaign mission launch failed', error);
      return false;
    }
  };

  const open = () => {
    renderMap();
    $id('intro')?.classList.add('hidden');
  };

  window.relayOpenCampaignMap = open;
  window.relayCampaignLaunchMission = launchMission;

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const map = $id('worldMap');
    if (!map || map.classList.contains('hidden')) return;
    const missionClose = $id('relayMissionClose');
    if (missionClose) {
      event.preventDefault();
      renderMap();
      return;
    }
    event.preventDefault();
    backToBriefing(map);
  }, true);
})();
