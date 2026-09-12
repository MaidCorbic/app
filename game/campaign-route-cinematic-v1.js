import './campaign-route-cinematic-v1.css';
import { missions } from './src/missions.js';
import { loadState } from './src/state.js';

(() => {
  'use strict';
  if (window.__relayCampaignRouteCinematicV1) return;
  window.__relayCampaignRouteCinematicV1 = true;

  const ART = Object.freeze(['homescreen.jpg', 'loading-landscape.jpg', 'loading.jpg']);
  const ACCENTS = Object.freeze({
    'first-delivery': '#7feaff', 'dead-drop': '#ffb454', blackout: '#66f4ff',
    pursuit: '#ff5364', 'signal-storm': '#b8a0ff', 'corporate-lockdown': '#ff5a4f', 'final-relay': '#ffd06e',
  });

  const $ = id => document.getElementById(id);
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  let artTimer = 0;
  let countdownInFlight = false;
  let selectedMissionId = null;

  const stateSnapshot = () => {
    try { return loadState(); }
    catch { return { completed: [], unlockedMissions: ['first-delivery'], missionStats: {} }; }
  };

  const completedIds = state => new Set(Array.isArray(state?.completed) ? state.completed : []);
  const isUnlocked = (mission, state) => !!mission && (state?.unlockedMissions?.includes?.(mission.id) || !mission.unlockRequirement || completedIds(state).has(mission.unlockRequirement));
  const statsFor = (mission, state) => {
    const raw = state?.missionStats?.[mission.id] || {};
    return { bestTime: Number.isFinite(Number(raw.bestTime)) ? Number(raw.bestTime) : null, bestRating: Number.isFinite(Number(raw.bestRating)) ? Number(raw.bestRating) : 0, runs: Number.isFinite(Number(raw.runs)) ? Number(raw.runs) : 0 };
  };
  const formatTime = value => {
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) return '--:--';
    const seconds = Math.floor(Number(value) / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  };
  const missionIdIndex = mission => missions.findIndex(item => item.id === mission?.id);

  const normalizeMissionBounds = mission => {
    const goalX = Math.max(Number(mission?.goal?.x) || 6100, 1);
    const xs = [Number(mission?.spawn?.x) || 0, goalX];
    (mission?.platforms || []).forEach(item => { if (Array.isArray(item)) { xs.push(Number(item[0]) || 0, (Number(item[0]) || 0) + (Number(item[2]) || 0)); } });
    (mission?.signals || []).forEach(item => xs.push(Number(item?.[0]) || 0));
    const minX = Math.min(...xs, 0), maxX = Math.max(...xs, goalX, 1);
    const ys = [Number(mission?.spawn?.y) || 520, Number(mission?.goal?.y) || 500, 610];
    (mission?.platforms || []).forEach(item => { if (Array.isArray(item)) { ys.push(Number(item[1]) || 0, (Number(item[1]) || 0) + (Number(item[3]) || 0)); } });
    (mission?.signals || []).forEach(item => ys.push(Number(item?.[1]) || 0));
    const minY = Math.min(...ys, 230), maxY = Math.max(...ys, 650);
    return { minX, maxX, minY, maxY };
  };

  const point = (mission, x, y, bounds) => ({
    rawX: Number(x) || 0,
    rawY: Number(y) || 0,
    x: 4 + ((Number(x) - bounds.minX) / Math.max(bounds.maxX - bounds.minX, 1)) * 92,
    y: 12 + (1 - ((Number(y) - bounds.minY) / Math.max(bounds.maxY - bounds.minY, 1))) * 76,
  });

  const routeData = mission => {
    const bounds = normalizeMissionBounds(mission);
    const start = point(mission, mission?.spawn?.x ?? 120, mission?.spawn?.y ?? 520, bounds);
    const guides = [...(mission?.guides || [])].sort((a,b) => (Number(a?.x)||0) - (Number(b?.x)||0));
    const cps = [...(mission?.checkpoints || [])].sort((a,b) => (Number(a?.[0])||0) - (Number(b?.[0])||0));
    const rawRoute = [
      start,
      ...guides.map(g => point(mission,g.x,g.y,bounds)),
      ...cps.map(([x,y]) => point(mission,x,y,bounds)),
      point(mission, mission?.goal?.x ?? 6100, mission?.goal?.y ?? 500, bounds),
    ];
    const route = rawRoute.sort((a,b) => a.rawX - b.rawX || a.rawY - b.rawY).filter((item,index,array) => index === 0 || Math.abs(item.x-array[index-1].x) > .18 || Math.abs(item.y-array[index-1].y) > .18);
    return { bounds, start, goal: route[route.length - 1], route };
  };

  const pathFrom = route => route.map((p,i) => `${i ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

  const buildMapSvg = mission => {
    const data = routeData(mission);
    const { bounds } = data;
    const platformMarkup = (mission?.platforms || []).map(item => {
      if (!Array.isArray(item)) return '';
      const p1 = point(mission,item[0],item[1],bounds);
      const p2 = point(mission,(Number(item[0])+Number(item[2])),(Number(item[1])+Number(item[3])),bounds);
      const x=Math.min(p1.x,p2.x), y=Math.min(p1.y,p2.y), w=Math.max(.7,Math.abs(p2.x-p1.x)), h=Math.max(.9,Math.abs(p2.y-p1.y));
      return `<rect class="map-platform ${item[4] === 'roof' ? 'roof' : ''}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx=".5"/>`;
    }).join('');
    const hazardMarkup = (mission?.obstacles || []).map(item => { if (!Array.isArray(item)) return ''; const p=point(mission,item[0],item[1],bounds); return `<rect class="map-hazard" x="${(p.x-1.5).toFixed(2)}" y="${(p.y-1.1).toFixed(2)}" width="3" height="2.2" rx=".3"/>`; }).join('');
    const signalMarkup = (mission?.signals || []).map(item => { const p=point(mission,item[0],item[1],bounds); return `<circle class="map-signal" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r=".8"/>`; }).join('');
    const secretMarkup = (mission?.secrets || []).slice(0,12).map(item => { const p=point(mission,item[0],item[1],bounds); return `<rect class="map-secret" x="${(p.x-.8).toFixed(2)}" y="${(p.y-.8).toFixed(2)}" width="1.6" height="1.6" transform="rotate(45 ${p.x.toFixed(2)} ${p.y.toFixed(2)})"/>`; }).join('');
    const checkpointMarkup = (mission?.checkpoints || []).map((item,index) => { const p=point(mission,item[0],item[1],bounds); return `<circle class="map-checkpoint" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="1.5"/><text class="map-point-label" x="${(p.x+2).toFixed(2)}" y="${(p.y-2).toFixed(2)}">CP${index+1}</text>`; }).join('');
    const guideDots = (mission?.guides || []).slice(0,16).map(g => { const p=point(mission,g.x,g.y,bounds); return `<circle class="map-guide-dot" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r=".55"/>`; }).join('');
    const arrowMarkup = data.route.slice(1).map((p,index) => { const prev=data.route[index]; const angle=Math.atan2(p.y-prev.y,p.x-prev.x)*180/Math.PI; return `<path class="map-route-arrow" d="M ${p.x.toFixed(2)} ${p.y.toFixed(2)} l -2.2 -1.1 l .5 1.1 l -.5 1.1 Z" transform="rotate(${angle.toFixed(2)} ${p.x.toFixed(2)} ${p.y.toFixed(2)})"/>`; }).join('');
    return `<svg class="relay-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      ${[18,39,60,81].map(y=>`<line class="map-grid-line" x1="4" x2="96" y1="${y}" y2="${y}"/>`).join('')}${[20,40,60,80].map(x=>`<line class="map-grid-line" x1="${x}" x2="${x}" y1="10" y2="90"/>`).join('')}
      <path class="map-sector" d="M4 10 H35 V40 H4 Z"/><path class="map-sector" d="M36 10 H67 V40 H36 Z"/><path class="map-sector" d="M68 10 H96 V40 H68 Z"/><path class="map-sector" d="M4 41 H47 V90 H4 Z"/><path class="map-sector" d="M48 41 H96 V90 H48 Z"/>
      <text class="map-sector-text" x="6" y="16">SECTOR A</text><text class="map-sector-text" x="38" y="16">SECTOR B</text><text class="map-sector-text" x="70" y="16">SECTOR C</text><text class="map-sector-text" x="6" y="47">SECTOR D</text><text class="map-sector-text" x="50" y="47">SECTOR E</text>
      ${platformMarkup}${hazardMarkup}${signalMarkup}${secretMarkup}${checkpointMarkup}${guideDots}
      <path class="map-route-glow" d="${pathFrom(data.route)}"/><path class="map-route-line" d="${pathFrom(data.route)}"/>${arrowMarkup}
      <circle class="map-origin" cx="${data.start.x.toFixed(2)}" cy="${data.start.y.toFixed(2)}" r="2.2"/><circle class="map-goal" cx="${data.goal.x.toFixed(2)}" cy="${data.goal.y.toFixed(2)}" r="2.5"/>
      <text class="map-point-label" x="${(data.start.x+2).toFixed(2)}" y="${(data.start.y-2).toFixed(2)}">START</text><text class="map-point-label goal-label" x="${(data.goal.x-2).toFixed(2)}" y="${(data.goal.y-3).toFixed(2)}">GOAL</text>
    </svg>`;
  };

  const rotateArt = host => {
    const art = host.querySelector('.relay-tactical-art');
    if (!art) return;
    window.clearInterval(artTimer);
    let index = Math.floor(Math.random() * ART.length);
    const apply = () => { art.style.backgroundImage = `url('./assets/${ART[index]}')`; index = (index + 1) % ART.length; };
    apply();
    artTimer = window.setInterval(apply, 6500);
  };

  const closeMap = host => { window.clearInterval(artTimer); host?.classList.add('hidden'); document.body.classList.remove('relay-route-active','relay-mission-launching'); $('intro')?.classList.remove('hidden'); };

  const deploy = async mission => {
    if (countdownInFlight) return;
    countdownInFlight = true;
    const button = $('relayDeploy'), overlay = $('relayDeployCountdown'), number = $('relayCountdownNumber'), stateText = $('relayCountdownState');
    button?.setAttribute('disabled','disabled'); overlay?.classList.add('is-visible'); document.body.classList.add('relay-mission-launching');
    const steps = [['3','ROUTE LOCKED'],['2','CHECKPOINTS SYNCED'],['1','LINK ESTABLISHED']];
    try {
      for (const [value,label] of steps) {
        if (!overlay || !number || !stateText) throw new Error('Countdown UI missing');
        number.textContent=value; number.classList.toggle('is-final',value==='1'); stateText.textContent=label; await wait(760);
      }
      stateText.textContent='DEPLOYING'; await wait(230);
      const index=missionIdIndex(mission);
      if(index<0 || typeof window.relayLaunchRun!=='function') throw new Error('Canonical run launcher is unavailable');
      const result=await window.relayLaunchRun(index);
      if(result===false) throw new Error('Canonical run launcher reported failure');
      overlay.classList.remove('is-visible'); $('worldMap')?.classList.add('hidden'); $('intro')?.classList.add('hidden');
      ['preflight','titlePanel','relayInfoPanel','finish','gameOver','levelUp','abilityUnlock'].forEach(id => $(id)?.classList.add('hidden'));
      document.body.classList.add('relay-run-active'); document.body.classList.remove('relay-route-active','relay-mission-launching');
      window.dispatchEvent(new CustomEvent('relay:campaign-mission-launched',{detail:{mission,index}}));
    } catch(error) {
      console.error('[RelayRunner] tactical deploy failed',error); overlay?.classList.remove('is-visible'); button?.removeAttribute('disabled'); document.body.classList.remove('relay-mission-launching');
    } finally { countdownInFlight=false; }
  };

  const renderMap = missionId => {
    const host=$('worldMap'); if(!host) return false;
    const state=stateSnapshot();
    const available=missions.filter(mission=>isUnlocked(mission,state));
    const completed=completedIds(state);
    const fallback=available.find(mission=>!completed.has(mission.id))||available[0]||missions[0];
    const mission=missions.find(item=>item.id===missionId&&isUnlocked(item,state))||fallback; if(!mission) return false;
    selectedMissionId=mission.id;
    const stats=statsFor(mission,state), accent=ACCENTS[mission.id]||'#7feaff', index=missionIdIndex(mission), done=completed.has(mission.id);
    host.innerHTML=`
      <div class="relay-tactical-art"></div><div class="relay-tactical-overlay"></div><div class="relay-tactical-grid"></div>
      <header class="relay-tactical-top"><div class="relay-tactical-brand"><p class="relay-tactical-kicker">R/ // TACTICAL OPERATIONS</p><h1 class="relay-tactical-title">MISSION <em>${String(index+1).padStart(2,'0')}</em> · ${String(mission.district||'').toUpperCase()}</h1></div><div class="relay-tactical-status"><i class="relay-live-dot"></i>MAP DATA LINKED · LIVE</div><div class="relay-tactical-actions"><button id="relayRouteMapBack" class="relay-tactical-btn" type="button">ESC · BRIEFING</button></div></header>
      <section class="relay-tactical-layout">
        <section class="relay-tactical-map" style="--route-accent:${accent}" aria-label="Tactical mission map"><div class="scanline"></div><div class="relay-map-meta"><span>AREA OF OPERATION · ${String(mission.district||'').toUpperCase()}</span><b>MISSION ${String(index+1).padStart(2,'0')} · ROUTE MASTER</b></div>${buildMapSvg(mission)}<div class="relay-map-legend"><span class="relay-legend-item"><i class="relay-legend-dot route"></i>ROUTE</span><span class="relay-legend-item"><i class="relay-legend-dot cp"></i>CHECKPOINT</span><span class="relay-legend-item"><i class="relay-legend-dot signal"></i>SIGNAL</span><span class="relay-legend-item"><i class="relay-legend-dot hazard"></i>HAZARD</span><span class="relay-legend-item"><i class="relay-legend-dot secret"></i>SECRET</span></div><div class="relay-coordinates">X 000—${Math.round(Number(mission.goal?.x)||6100)}<br>Y ${Math.round(Number(mission.spawn?.y)||520)}—${Math.round(Number(mission.goal?.y)||500)}</div></section>
        <aside class="relay-side"><div class="relay-side-head"><small>ROUTE INTELLIGENCE</small><b>${mission.title}</b><span>${mission.objective||''}</span></div><div id="relayMissionList" class="relay-mission-list"></div><div class="relay-side-detail" style="--route-accent:${accent}"><div class="relay-detail-kicker">MISSION STATUS</div><div class="relay-detail-title">${done?'ROUTE SECURED':'ROUTE READY'}</div><div class="relay-detail-sub">${mission.routeProfile?.normal||'Follow the marked route.'}</div><div class="relay-detail-stats"><div class="relay-detail-stat"><span>DIFFICULTY</span><b>${mission.difficulty||'--'}</b></div><div class="relay-detail-stat"><span>SIGNALS</span><b>${mission.signals?.length||0}</b></div><div class="relay-detail-stat"><span>BEST</span><b>${formatTime(stats.bestTime)}</b></div></div><button id="relayDeploy" class="relay-deploy" type="button">${done?'REDEPLOY ROUTE':'DEPLOY MISSION'} · ${String(index+1).padStart(2,'0')}</button></div></aside>
      </section>
      <div id="relayDeployCountdown" class="relay-deploy-countdown" aria-live="assertive"><div class="relay-countdown-card"><small>TACTICAL DEPLOY</small><strong id="relayCountdownNumber" class="relay-countdown-number">3</strong><div id="relayCountdownState" class="relay-countdown-state">ROUTE LOCKED</div></div></div>`;

    const list=$('relayMissionList');
    if(list) list.innerHTML=missions.map((item,itemIndex)=>{const unlocked=isUnlocked(item,state),complete=completed.has(item.id),selected=item.id===mission.id,s=statsFor(item,state);return `<button type="button" class="relay-mission-row ${selected?'is-selected':''} ${complete?'is-done':''} ${unlocked?'':'is-locked'}" style="--route-accent:${ACCENTS[item.id]||'#7feaff'}" data-route-mission="${item.id}" ${unlocked?'':'disabled'}><span class="relay-row-index">${String(itemIndex+1).padStart(2,'0')}</span><span class="relay-row-copy"><b>${item.title}</b><small>${item.district} · ${item.difficulty||''}</small></span><span class="relay-row-status">${complete?'✓':unlocked?(s.bestRating?'★'.repeat(s.bestRating):'LIVE'):'LOCK'}</span></button>`;}).join('');
    host.querySelectorAll('[data-route-mission]').forEach(button=>button.addEventListener('click',()=>renderMap(button.dataset.routeMission)));
    $('relayRouteMapBack')?.addEventListener('click',()=>closeMap(host)); $('relayDeploy')?.addEventListener('click',()=>void deploy(mission));
    rotateArt(host); closeLegacyPanels(); host.classList.remove('hidden'); document.body.classList.add('relay-route-active'); document.body.classList.remove('relay-mission-launching');
    return true;
  };

  const closeLegacyPanels = () => ['preflight','titlePanel','relayInfoPanel'].forEach(id=>$(id)?.classList.add('hidden'));
  window.relayOpenCampaignMap = () => renderMap(selectedMissionId);
  window.relayCampaignLaunchMission = deploy;

  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape') return;
    const host=$('worldMap'); if(!host || host.classList.contains('hidden')) return;
    if($('relayDeployCountdown')?.classList.contains('is-visible')) return;
    event.preventDefault(); closeMap(host);
  },true);
})();
