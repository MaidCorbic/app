import { missions } from './src/missions.js';

(() => {
  'use strict';
  if (window.__relayUnifiedGameplayUiV1) return;

  const $ = id => document.getElementById(id);
  const UPDATE_KEY = 'relay.runner.live.updates.v1';
  const latestUpdates = [
    { id:'menu-unification', version:'1.1.0', date:'2026-08-30', title:'Unified cinematic menus', detail:'Options, FAQ and Pause now share the same ultra-cinematic gold UI system across web and mobile.' },
    { id:'gameplay-hud', version:'1.1.0', date:'2026-08-30', title:'Gameplay HUD refinement', detail:'Mission and Signals panels are now compact, aligned and optimized for desktop and mobile gameplay.' },
    { id:'mission-intelligence', version:'1.1.0', date:'2026-08-30', title:'Mission Intelligence', detail:'Contextual intelligence now appears only when the current mission introduces a mechanic, threat or route change.' },
    { id:'orientation', version:'1.1.0', date:'2026-08-30', title:'Landscape guidance', detail:'Mobile portrait mode now presents a dedicated cinematic rotation card before full gameplay controls are shown.' },
  ];

  const readUpdates = () => { try { const parsed = JSON.parse(localStorage.getItem(UPDATE_KEY) || '[]'); return Array.isArray(parsed) && parsed.length ? parsed.slice(0,12) : latestUpdates.slice(); } catch { return latestUpdates.slice(); } };
  const writeUpdates = value => { try { localStorage.setItem(UPDATE_KEY, JSON.stringify(value.slice(0,12))); } catch {} };
  const announce = text => { const toast = $('toast'); if (!toast) return; toast.textContent = text; toast.classList.add('show'); window.clearTimeout(announce._timer); announce._timer = window.setTimeout(() => toast.classList.remove('show'), 1800); };

  const injectHomeUpdate = () => {
    const launcher = document.querySelector('#intro .info-launcher');
    if (!launcher) return;
    launcher.querySelector('[data-relay-info="faq"]')?.remove();
    launcher.querySelector('[data-relay-info="update"]')?.remove();
    if (launcher.querySelector('[data-relay-update-open]')) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'relay-home-update'; button.dataset.relayUpdateOpen = '1';
    button.innerHTML = '<span class="relay-home-update-dot" aria-hidden="true"></span><span>UPDATE</span><small>LIVE</small>';
    launcher.replaceChildren(button);
  };

  const closeUpdate = () => $('relayUpdateCenter')?.classList.add('hidden');
  const refreshUpdates = () => { const custom = window.__relayLiveUpdates; writeUpdates(Array.isArray(custom) && custom.length ? custom : latestUpdates); renderUpdateCenter(); announce('UPDATE CHANNEL REFRESHED'); };
  const renderUpdateCenter = () => {
    const host = $('relayUpdateCenter'); if (!host) return;
    const items = readUpdates();
    host.className = 'relay-update-center relay-cinematic-overlay';
    host.innerHTML = `<div class="relay-cinematic-panel relay-update-panel"><button class="relay-cinematic-close" type="button" data-relay-update-close aria-label="Close updates">×</button><header class="relay-cinematic-head"><div><p class="relay-cinematic-kicker">RELAY RUNNER // LIVE CHANNEL</p><h2 class="relay-cinematic-title">UPDATE</h2><p class="relay-cinematic-subtitle">Recent changes, gameplay improvements and live system refresh.</p></div><span class="relay-cinematic-status"><i></i>REALTIME</span></header><div class="relay-cinematic-body"><section class="relay-ui-section wide"><div class="relay-ui-section-title">LATEST CHANGES</div><div class="relay-update-list">${items.map(item => `<article class="relay-update-entry"><div><span>${item.version || 'LIVE'} · ${item.date || ''}</span><strong>${item.title || 'SYSTEM UPDATE'}</strong><small>${item.detail || ''}</small></div><b>+</b></article>`).join('')}</div></section><section class="relay-ui-section wide"><div class="relay-update-actions"><button type="button" class="relay-ui-button primary" data-relay-update-refresh>REFRESH NOW</button><button type="button" class="relay-ui-button" data-relay-update-close>DONE</button></div><p class="relay-update-live-status"><i></i> LIVE REFRESH CHANNEL ACTIVE · CHANGES APPEAR WITHOUT A PAGE RELOAD.</p></section></div></div>`;
    host.querySelectorAll('[data-relay-update-close]').forEach(button => button.addEventListener('click', closeUpdate));
    host.querySelector('[data-relay-update-refresh]')?.addEventListener('click', refreshUpdates);
    host.classList.remove('hidden');
  };
  const bindUpdateButton = () => {
    injectHomeUpdate();
    const button = document.querySelector('[data-relay-update-open]');
    if (!button || button.dataset.bound === '1') return;
    button.dataset.bound = '1'; button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); renderUpdateCenter(); });
  };
  const addLiveUpdate = update => {
    if (!update || typeof update !== 'object') return;
    const incoming = { id:update.id || `live-${Date.now()}`, version:update.version || 'LIVE', date:update.date || new Date().toISOString().slice(0,10), title:update.title || 'LIVE UPDATE', detail:update.detail || update.message || '' };
    writeUpdates([incoming, ...readUpdates().filter(item => item.id !== incoming.id)]);
    if ($('relayUpdateCenter') && !$('relayUpdateCenter').classList.contains('hidden')) renderUpdateCenter();
    announce(`NEW UPDATE · ${incoming.title}`);
  };

  const ensureGameplayElements = () => {
    const play = $('play'); if (!play) return;
    let intel = $('relayGameplayIntel');
    if (!intel) { intel = document.createElement('section'); intel.id = 'relayGameplayIntel'; intel.className = 'relay-gameplay-intel'; intel.setAttribute('aria-live','polite'); intel.innerHTML = '<p class="intel-kicker">MISSION INTELLIGENCE</p><h3 class="intel-title"></h3><p class="intel-detail"></p><div class="intel-meta"></div>'; play.append(intel); }
    let rotate = $('relayRotateCard');
    if (!rotate) { rotate = document.createElement('section'); rotate.id = 'relayRotateCard'; rotate.className = 'relay-rotate-card'; rotate.setAttribute('role','status'); rotate.innerHTML = '<div class="rotate-icon" aria-hidden="true">↻</div><h3>ROTATE YOUR DEVICE</h3><p>LANDSCAPE MODE RECOMMENDED<br>More space. Better control. Better run.</p><button type="button" data-relay-rotate-dismiss>CONTINUE</button>'; document.body.append(rotate); rotate.querySelector('[data-relay-rotate-dismiss]')?.addEventListener('click', () => { document.body.classList.add('rotate-dismissed'); rotate.classList.remove('is-visible'); }); }
  };
  const getMission = () => { const number = Number(($('missionNumber')?.textContent || '').replace(/\D/g,'')); if (number >= 1 && missions[number - 1]) return missions[number - 1]; const title = ($('objective')?.textContent || '').trim().toLowerCase(); return missions.find(mission => mission.title.toLowerCase() === title) || missions[0]; };
  const missionIntel = mission => ({
    'first-delivery':['ROUTE ONLINE','Follow the low line, collect Signals and make the first relay handoff.',['LEVEL 01','SAFE ROUTE']],
    'dead-drop':['BOOST ROUTE DETECTED','Boost pads reward momentum. The high line is faster but narrower.',['LEVEL 02','HIGH LINE']],
    blackout:['BLACKOUT SECTOR','Follow safe lights through the dark. High routes expose extra Signals and Secrets.',['LEVEL 03','SAFE LIGHT']],
    pursuit:['INTERCEPTOR DETECTED','Keep momentum through the chase sectors. Checkpoints are your recovery line.',['LEVEL 04','CHASE ACTIVE']],
    'signal-storm':['STORM SIGNAL','Watch the sky and combine movement tools with combat to protect the route.',['LEVEL 05','STORM']],
    'corporate-lockdown':['CORPORATE LOCKDOWN','Security systems are hostile. Clear gates quickly and protect the package.',['LEVEL 06','HIGH THREAT']],
    'final-relay':['FINAL RELAY','Everything converges here. Read the route, clear threats and complete the handoff.',['FINAL','APEX SPINE']],
  }[mission?.id] || ['MISSION INTELLIGENCE','Stay focused on the current objective and read the route cues.',[`LEVEL ${Math.max(1,missions.indexOf(mission)+1)}`,'LIVE']]);
  let intelTimer;
  const showIntel = reason => {
    ensureGameplayElements(); const play = $('play'); const intro = $('intro'); const intel = $('relayGameplayIntel'); const mission = getMission();
    if (!intel || !mission || !play || intro && !intro.classList.contains('hidden')) return;
    const [title,detail,meta] = missionIntel(mission); intel.querySelector('.intel-title').textContent = title; intel.querySelector('.intel-detail').textContent = detail; intel.querySelector('.intel-meta').innerHTML = meta.map(item=>`<span class="intel-pill">${item}</span>`).join('') + `<span class="intel-pill">${String(reason || 'MISSION').toUpperCase()}</span>`; intel.classList.add('is-active'); window.clearTimeout(intelTimer); intelTimer = window.setTimeout(()=>intel.classList.remove('is-active'),4200);
  };
  const syncRotateCard = () => {
    ensureGameplayElements(); const rotate=$('relayRotateCard'), play=$('play'), intro=$('intro'), finish=$('finish'), gameOver=$('gameOver'); if (!rotate || !play) return;
    const gameplayVisible=!play.classList.contains('hidden') && !!intro?.classList.contains('hidden') && !!finish?.classList.contains('hidden') && !!gameOver?.classList.contains('hidden');
    const shouldShow=!!(window.innerWidth<=760 || document.body.classList.contains('is-touch')) && window.matchMedia('(orientation: portrait)').matches && gameplayVisible && !document.body.classList.contains('rotate-dismissed'); rotate.classList.toggle('is-visible',shouldShow);
  };
  const bindGameplayObservers = () => {
    ensureGameplayElements();
    ['missionNumber','objective','routeIntel'].map(id=>$(id)).filter(Boolean).forEach(node=>new MutationObserver(()=>{showIntel('ROUTE UPDATE');syncRotateCard();}).observe(node,{childList:true,characterData:true,subtree:true}));
    window.addEventListener('resize',syncRotateCard,{passive:true});
    window.addEventListener('orientationchange',()=>{document.body.classList.remove('rotate-dismissed');window.setTimeout(syncRotateCard,120)},{passive:true});
    window.addEventListener('gameplay:v12:event',event=>showIntel(event.detail?.type || 'EVENT'));
    window.addEventListener('relay:mission-intelligence',event=>showIntel(event.detail?.reason || 'INTEL'));
  };
  const install = () => {
    if (!document.querySelector('link[href="./unified-gameplay-ui-v1.css"]')) { const link=document.createElement('link'); link.rel='stylesheet'; link.href='./unified-gameplay-ui-v1.css'; document.head.append(link); }
    if (!$('relayUpdateCenter')) { const host=document.createElement('section'); host.id='relayUpdateCenter'; host.className='relay-update-center hidden'; host.setAttribute('aria-label','Live updates'); document.body.append(host); }
    bindUpdateButton(); bindGameplayObservers(); syncRotateCard();
    window.relayUpdateCenter=Object.freeze({open:renderUpdateCenter,refresh:refreshUpdates,publish:addLiveUpdate});
    window.relayGameplayUI=Object.freeze({showIntel,syncRotate:syncRotateCard});
    window.addEventListener('relay:update',event=>addLiveUpdate(event.detail));
    window.addEventListener('relay:live-update',event=>addLiveUpdate(event.detail));
    window.addEventListener('storage',event=>{if(event.key===UPDATE_KEY && $('relayUpdateCenter') && !$('relayUpdateCenter').classList.contains('hidden')) renderUpdateCenter();});
    new MutationObserver(bindUpdateButton).observe($('intro') || document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();