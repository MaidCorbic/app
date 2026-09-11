import { missions } from './src/missions.js';
import { achievementDefinitions, getCourierRank, getLevelProgress, loadState, saveState } from './src/state.js';

(() => {
  'use strict';
  if (window.__relayUnifiedCinematicUiV1) return;
  window.__relayUnifiedCinematicUiV1 = true;

  const PRESENTATION_KEY = 'relay.runner.ui.preferences.v1';
  const defaults = Object.freeze({ intelCards:true, allyIntel:true, eventPopups:true, tutorialHints:true });
  const $ = id => document.getElementById(id);
  const readPrefs = () => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(PRESENTATION_KEY) || '{}') }; }
    catch { return { ...defaults }; }
  };
  const writePrefs = prefs => {
    try { localStorage.setItem(PRESENTATION_KEY, JSON.stringify({ ...defaults, ...prefs })); } catch {}
  };
  const syncPrefs = prefs => {
    const safe = { ...defaults, ...(prefs || {}) };
    document.body?.classList.toggle('relay-hide-intel', !safe.intelCards);
    document.body?.classList.toggle('relay-hide-ally', !safe.allyIntel);
    document.body?.classList.toggle('relay-hide-events', !safe.eventPopups);
    document.body?.classList.toggle('relay-hide-tutorials', !safe.tutorialHints);
  };

  const closeAllOverlays = () => {
    ['titlePanel','relayInfoPanel','preflight','relayUpdateCenter'].forEach(id => $(id)?.classList.add('hidden'));
  };

  const resumeRunner = () => {
    const scene = window.__relayRunnerScene;
    try { scene?.scene?.resume?.(); } catch {}
  };

  const hidePause = (resume = false) => {
    const pause = $('pauseMenu');
    pause?.classList.add('hidden');
    if (resume) resumeRunner();
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      else await document.documentElement.requestFullscreen?.();
    } catch {}
  };

  const settingMeta = [
    ['screenShake','SCREEN SHAKE','Impact and camera feedback.'],
    ['reducedMotion','REDUCED MOTION','Reduce menu and gameplay motion.'],
    ['rain','ATMOSPHERIC RAIN','City weather and ambience layer.'],
    ['muted','GAME AUDIO','Master gameplay and menu audio.'],
  ];
  const presentationMeta = [
    ['tutorialHints','TUTORIAL HINTS','Contextual mission guidance.'],
    ['intelCards','INTEL CARDS','Mission intelligence panels.'],
    ['allyIntel','ALLY INTEL','Ally and contact callouts.'],
    ['eventPopups','EVENT POPUPS','Gameplay event feedback panels.'],
  ];

  const toggleCard = (key, label, detail, enabled) => `<article class="relay-ui-card"><div class="relay-ui-copy"><strong>${label}</strong><small>${detail}</small></div><button type="button" class="relay-ui-toggle ${enabled ? 'is-on' : ''}" data-unified-setting="${key}" aria-pressed="${enabled}">${enabled ? 'ON' : 'OFF'}</button></article>`;
  const rangeCard = (key, label, detail, value) => `<article class="relay-ui-card"><div class="relay-ui-copy"><strong>${label}</strong><small>${detail}</small></div><div class="relay-ui-range"><div class="relay-ui-range-head"><span>LEVEL</span><b data-unified-range-value="${key}">${Math.round(value * 100)}%</b></div><input type="range" min="0" max="1" step=".05" value="${value}" data-unified-range="${key}" aria-label="${label}"></div></article>`;

  const updateRuntimeFallback = (key, value) => {
    const scene = window.__relayRunnerScene;
    if (key === 'rain') scene?.rain?.setVisible?.(Boolean(value));
    if (key === 'screenShake' && scene) scene.screenShake = Boolean(value);
    if (key === 'reducedMotion' && scene) scene.motionReduced = Boolean(value);
    if (key === 'muted' && value) {
      try { window.speechSynthesis?.cancel?.(); } catch {}
    }
  };

  const readCoreState = () => ({ ...loadState() });
  const setCoreSetting = (key, value) => {
    const next = { ...readCoreState(), [key]: value };
    saveState(next);
    updateRuntimeFallback(key, value);
    window.dispatchEvent(new CustomEvent('relay-settings-change', { detail:{ key, value } }));
  };

  const renderOptionsBody = () => {
    const state = readCoreState();
    const prefs = readPrefs();
    const lang = localStorage.getItem('relay-runner-language') || 'en';
    return `<div class="relay-section-grid">
      <section class="relay-ui-section"><div class="relay-ui-section-title">GAMEPLAY</div>${settingMeta.map(([key,label,detail]) => toggleCard(key,label,detail,key === 'muted' ? !state.muted : !!state[key])).join('')}</section>
      <section class="relay-ui-section"><div class="relay-ui-section-title">AUDIO</div>${rangeCard('musicVolume','MUSIC VOLUME','Menu and gameplay music.',Number(state.musicVolume ?? .55))}${rangeCard('sfxVolume','SFX VOLUME','Impacts, actions and alerts.',Number(state.sfxVolume ?? .7))}</section>
      <section class="relay-ui-section wide"><div class="relay-ui-section-title">PRESENTATION</div><div class="relay-section-grid">${presentationMeta.map(([key,label,detail]) => toggleCard(key,label,detail,!!prefs[key])).join('')}</div></section>
      <section class="relay-ui-section"><div class="relay-ui-section-title">LANGUAGE</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>LANGUAGE</strong><small>Choose the menu language used by the relay.</small></div><div class="relay-ui-choice-row">${[['en','EN'],['exyu','EX-YU'],['es','ES'],['de','DE']].map(([id,label]) => `<button class="relay-ui-choice ${lang === id ? 'is-active' : ''}" type="button" data-unified-language="${id}">${label}</button>`).join('')}</div></article></section>
      <section class="relay-ui-section"><div class="relay-ui-section-title">DISPLAY</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>FULLSCREEN</strong><small>Use the browser's native fullscreen mode when supported.</small></div><button class="relay-ui-button" type="button" data-unified-fullscreen>TOGGLE</button></article><article class="relay-ui-card"><div class="relay-ui-copy"><strong>INTERFACE</strong><small>Responsive layout is shared between web and mobile.</small></div><span class="relay-cinematic-status"><i></i>RESPONSIVE</span></article></section>
      <section class="relay-ui-section wide"><div class="relay-ui-section-title">CONTROLS</div><div class="relay-ui-controls"><span class="relay-ui-key"><kbd>A</kbd><b>/</b><kbd>D</kbd> MOVE</span><span class="relay-ui-key"><kbd>SPACE</kbd> JUMP</span><span class="relay-ui-key"><kbd>E</kbd> ACTION</span><span class="relay-ui-key"><kbd>Q</kbd> BLADE</span><span class="relay-ui-key"><kbd>SHIFT</kbd> DASH</span><span class="relay-ui-key"><kbd>ESC</kbd> PAUSE</span><span class="relay-ui-key">TOUCH · JOYSTICK + ACTIONS</span></div></section>
      <section class="relay-ui-section wide"><div class="relay-ui-actions"><button class="relay-ui-button primary" type="button" data-unified-close>DONE</button><button class="relay-ui-button" type="button" data-unified-reset-preferences>RESET UI PREFS</button><button class="relay-ui-button danger" type="button" data-unified-reset-save>RESET LOCAL SAVE</button></div></section>
    </div>`;
  };

  const renderOverlay = (host, { kicker, title, subtitle, body, footer = '' }) => {
    if (!host) return;
    host.classList.add('relay-cinematic-overlay');
    host.classList.remove('hidden');
    host.setAttribute('aria-hidden', 'false');
    host.innerHTML = `<div class="relay-cinematic-panel"><button class="relay-cinematic-close" type="button" data-unified-close aria-label="Close">×</button><header class="relay-cinematic-head"><div><p class="relay-cinematic-kicker">${kicker}</p><h2 class="relay-cinematic-title">${title}</h2><p class="relay-cinematic-subtitle">${subtitle}</p></div><span class="relay-cinematic-status"><i></i>ONLINE</span></header><div class="relay-cinematic-body">${body}</div><footer>${footer}</footer></div>`;
  };

  const renderOptions = (host, mode = 'overlay') => {
    const body = renderOptionsBody();
    const html = `<div class="relay-cinematic-panel"><button class="relay-cinematic-close" type="button" data-unified-close aria-label="Close options">×</button><header class="relay-cinematic-head"><div><p class="relay-cinematic-kicker">RELAY RUNNER // SYSTEM TERMINAL</p><h2 class="relay-cinematic-title">OPTIONS</h2><p class="relay-cinematic-subtitle">Configure audio, gameplay, presentation and controls without leaving the relay.</p></div><span class="relay-cinematic-status"><i></i>ONLINE</span></header><div class="relay-cinematic-body">${body}</div></div>`;
    if (!host) return;
    host.innerHTML = html;
    if (mode === 'overlay') host.classList.add('relay-cinematic-overlay');
    host.classList.remove('hidden');
    host.setAttribute('aria-hidden','false');
  };

  const faqData = [
    ['HOW TO PLAY','Start a route, follow the objective, collect Signals and reach the delivery beacon. Checkpoints protect your run and unlock progression.'],
    ['MOVEMENT','Use A/D on keyboard. On touch devices, drag the left joystick. Jump with SPACE or JUMP and use DASH when available.'],
    ['COMBAT','E performs the contextual action when a relay/world target is in range. Q uses the melee blade.'],
    ['ABILITIES','Abilities unlock through campaign progression. Required abilities are enforced for later routes.'],
    ['MISSIONS','Complete a route to unlock its next mission. Signals, Secrets, performance and clean runs feed progression.'],
    ['CHECKPOINTS','A checkpoint becomes your recovery line after a fall or death.'],
    ['PROGRESSION','XP, levels, ranks, mastery and achievements are persisted locally for this browser profile.'],
    ['MOBILE','Touch controls are shown during landscape gameplay and use dedicated pointer ownership.'],
  ];
  const renderFaq = host => renderOverlay(host, {
    kicker:'RELAY RUNNER // KNOWLEDGE BASE',
    title:'FAQ',
    subtitle:'Route intelligence, controls and system guidance.',
    body:`<div class="relay-faq-grid">${faqData.map(([q,a],index) => `<article class="relay-faq-item${index === 0 ? ' is-open' : ''}"><button class="relay-faq-question" type="button" data-faq-question aria-expanded="${index === 0 ? 'true' : 'false'}"><span>${q}</span><b>${index === 0 ? '−' : '+'}</b></button><div class="relay-faq-answer"${index === 0 ? '' : ' hidden'}>${a}</div></article>`).join('')}</div>`
  });

  const missionCard = (mission, index, state) => {
    const completed = Array.isArray(state.completed) && state.completed.includes(mission.id);
    const unlocked = !mission.unlockRequirement || completed || state.completed?.includes?.(mission.unlockRequirement);
    return `<article class="relay-ui-card"><div class="relay-ui-copy"><strong>${String(index+1).padStart(2,'0')} · ${mission.title.toUpperCase()}</strong><small>${unlocked ? `${mission.difficulty} · ${mission.signals.length} SIGNALS · ${mission.objective}` : `LOCKED · COMPLETE ${String(mission.unlockRequirement || '').replaceAll('-',' ').toUpperCase()}`}</small></div><button class="relay-ui-button ${unlocked ? '' : 'is-locked'}" type="button" data-pause-launch="${index}" ${unlocked ? '' : 'disabled'}>${unlocked ? (completed ? 'REPLAY' : 'DEPLOY') : 'LOCKED'}</button></article>`;
  };

  const ensurePauseShell = () => {
    const pause = $('pauseMenu');
    if (!pause || pause.querySelector('.relay-pause-shell')) return;
    const shell = document.createElement('section');
    shell.className = 'relay-pause-shell';
    shell.innerHTML = `<header class="relay-pause-head"><div class="relay-pause-brand"><span class="relay-pause-mark">R/</span><span>COURIER TERMINAL</span></div><div class="relay-pause-state">GAME PAUSED · SYSTEM STANDBY</div><button class="relay-cinematic-close" type="button" data-unified-close aria-label="Close pause menu">×</button></header><div class="relay-pause-layout"><nav class="relay-pause-nav" aria-label="Pause navigation"><button type="button" data-pause-tab="resume">RESUME</button><button type="button" data-pause-tab="missions">MISSION NETWORK</button><button type="button" data-pause-tab="progress">PROGRESS</button><button type="button" data-pause-tab="settings">SETTINGS</button><button type="button" data-pause-tab="faq">FAQ</button></nav><section class="relay-pause-content"></section></div>`;
    pause.appendChild(shell);
  };

  const renderPause = tab => {
    const pause = $('pauseMenu');
    const shell = pause?.querySelector('.relay-pause-shell');
    const content = shell?.querySelector('.relay-pause-content');
    if (!shell || !content) return;
    shell.querySelectorAll('[data-pause-tab]').forEach(button => button.classList.toggle('is-active', button.dataset.pauseTab === tab));
    const state = loadState();

    if (tab === 'resume') {
      content.innerHTML = `<div class="relay-cinematic-panel"><div class="relay-cinematic-body"><div class="relay-ui-section wide"><div class="relay-ui-section-title">RUN STATUS</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>ROUTE ACTIVE</strong><small>Your current run is paused safely. Resume returns control immediately.</small></div><button class="relay-ui-button primary" type="button" data-unified-resume>RESUME RUN</button></article></div></div></div>`;
    } else if (tab === 'missions') {
      content.innerHTML = `<div class="relay-cinematic-panel"><div class="relay-cinematic-body"><div class="relay-ui-section wide"><div class="relay-ui-section-title">MISSION NETWORK</div>${missions.map((mission,index)=>missionCard(mission,index,state)).join('')}</div></div></div>`;
    } else if (tab === 'progress') {
      const rank = getCourierRank(state.xp || 0);
      const level = getLevelProgress(state.xp || 0);
      const mastery = Object.values(state.mastery || {}).reduce((n,b) => n + (Array.isArray(b) ? b.length : 0), 0);
      content.innerHTML = `<div class="relay-cinematic-panel"><div class="relay-cinematic-body"><div class="relay-section-grid three"><section class="relay-ui-section"><div class="relay-ui-section-title">LEVEL</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>LEVEL ${level.level} / 100</strong><small>${level.level === 100 ? 'MAXIMUM LEVEL' : `${Math.max(0, level.next - state.xp)} XP TO NEXT LEVEL`}</small></div><b class="relay-cinematic-status">${Math.round(level.progress * 100)}%</b></article></section><section class="relay-ui-section"><div class="relay-ui-section-title">RANK</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>${rank.name}</strong><small>${state.xp || 0} XP · ${rank.next ? `${Math.max(0, rank.next.threshold - (state.xp || 0))} XP TO ${rank.next.name}` : 'MAXIMUM RANK'}</small></div></article></section><section class="relay-ui-section"><div class="relay-ui-section-title">RUNS</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>${state.totalRuns || 0} RUNS</strong><small>${state.completed?.length || 0}/${missions.length} ROUTES COMPLETE · ${state.signals || 0} SIGNALS</small></div></article></section></div><div class="relay-ui-section wide"><div class="relay-ui-section-title">ACHIEVEMENTS</div><div class="relay-section-grid">${achievementDefinitions.map(a=>`<article class="relay-ui-card"><div class="relay-ui-copy"><strong>${(state.achievements||[]).includes(a.id) ? '★ ' : '○ '}${a.label}</strong><small>${a.detail}</small></div></article>`).join('')}</div></div><div class="relay-ui-section wide"><div class="relay-ui-section-title">MASTERY</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>${mastery} BADGES EARNED</strong><small>${missions.map(m=>`${m.title}: ${(state.mastery?.[m.id] || []).join(' · ') || 'UNCLAIMED'}`).join(' · ')}</small></div></article></div></div></div>`;
    } else if (tab === 'settings') {
      renderOptions(content, 'embedded');
    } else if (tab === 'faq') {
      renderFaq(content);
    }
  };

  const openPause = tab => {
    closeAllOverlays();
    ensurePauseShell();
    const pause = $('pauseMenu');
    if (!pause) return;
    pause.classList.remove('hidden');
    pause.classList.add('relay-cinematic-overlay');
    pause.setAttribute('aria-hidden','false');
    try { window.__relayRunnerScene?.scene?.pause?.(); } catch {}
    renderPause(tab || 'resume');
  };

  const openTitleOptions = () => {
    closeAllOverlays();
    const panel = $('titlePanel');
    const content = $('titlePanelContent');
    if (!panel || !content) return false;
    renderOptions(panel);
    panel.classList.remove('hidden');
    panel.removeAttribute('hidden');
    panel.setAttribute('aria-hidden','false');
    return true;
  };

  const openFaq = () => {
    closeAllOverlays();
    renderFaq($('relayInfoPanel'));
    return true;
  };

  const launchMissionViaLegacy = index => {
    const pause = $('pauseMenu');
    const oldTab = pause?.querySelector('.menu .tab[data-tab="missions"]');
    if (!oldTab) return false;
    try {
      HTMLElement.prototype.click.call(oldTab);
      const button = pause.querySelector(`.menu #panelContent [data-mission="${index}"]`);
      if (button && !button.disabled) HTMLElement.prototype.click.call(button);
      return true;
    } catch { return false; }
  };

  const updateToggleDom = (button, enabled) => {
    button.classList.toggle('is-on', Boolean(enabled));
    button.classList.toggle('is-off', !Boolean(enabled));
    button.setAttribute('aria-pressed', String(Boolean(enabled)));
    button.textContent = enabled ? 'ON' : 'OFF';
  };

  const handleClick = event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const homeAction = target.closest('[data-home-v4-action]');
    if (homeAction) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const action = homeAction.dataset.homeV4Action;
      if (action === 'options') openTitleOptions();
      else if (action === 'faq') window.relayHomeInfoV1?.open?.('faq') || openFaq();
      else if (action === 'update') window.relayHomeInfoV1?.open?.('update');
      return;
    }

    const option = target.closest('[data-v3-options]');
    if (option) { event.preventDefault(); event.stopImmediatePropagation(); openTitleOptions(); return; }
    const faq = target.closest('[data-v3-faq], [data-relay-info="faq"]');
    if (faq) { event.preventDefault(); event.stopImmediatePropagation(); openFaq(); return; }

    const pauseButton = target.closest('#pause, #mobilePauseButton');
    if (pauseButton) { event.preventDefault(); event.stopImmediatePropagation(); openPause('resume'); return; }
    const settingsMobile = target.closest('#mobileSettingsButton');
    if (settingsMobile) { event.preventDefault(); event.stopImmediatePropagation(); openPause('settings'); return; }

    const close = target.closest('[data-unified-close]');
    if (close) { event.preventDefault(); if (close.closest('#pauseMenu')) hidePause(true); else closeAllOverlays(); return; }

    const pauseTab = target.closest('[data-pause-tab]');
    if (pauseTab) { event.preventDefault(); renderPause(pauseTab.dataset.pauseTab); return; }
    if (target.closest('[data-unified-resume]')) { event.preventDefault(); hidePause(true); return; }

    const launch = target.closest('[data-pause-launch]');
    if (launch && !launch.disabled) { event.preventDefault(); launchMissionViaLegacy(Number(launch.dataset.pauseLaunch)); return; }

    const faqQuestion = target.closest('[data-faq-question]');
    if (faqQuestion) {
      event.preventDefault();
      const item = faqQuestion.closest('.relay-faq-item');
      const answer = item?.querySelector('.relay-faq-answer');
      const open = !item?.classList.contains('is-open');
      item?.classList.toggle('is-open', open);
      faqQuestion.setAttribute('aria-expanded', String(open));
      const icon = faqQuestion.querySelector('b');
      if (icon) icon.textContent = open ? '−' : '+';
      if (answer) answer.hidden = !open;
      return;
    }

    const setting = target.closest('[data-unified-setting]');
    if (setting) {
      event.preventDefault();
      const key = setting.dataset.unifiedSetting;
      const prefs = readPrefs();
      const state = readCoreState();
      if (Object.prototype.hasOwnProperty.call(defaults, key)) {
        const next = !Boolean(prefs[key]);
        prefs[key] = next;
        writePrefs(prefs);
        syncPrefs(prefs);
        updateToggleDom(setting, next);
      } else {
        const current = key === 'muted' ? !Boolean(state.muted) : Boolean(state[key]);
        const next = !current;
        setCoreSetting(key === 'muted' ? 'muted' : key, key === 'muted' ? !next : next);
        updateToggleDom(setting, next);
      }
      return;
    }

    const language = target.closest('[data-unified-language]');
    if (language) {
      event.preventDefault();
      const code = language.dataset.unifiedLanguage;
      try { localStorage.setItem('relay-runner-language', code); } catch {}
      document.documentElement.lang = code === 'exyu' ? 'bs' : code;
      window.dispatchEvent(new CustomEvent('relay-language-change', { detail:{ code } }));
      const root = language.closest('#pauseMenu') || $('titlePanel');
      const activeTab = root?.querySelector('[data-pause-tab].is-active')?.dataset.pauseTab;
      if (root?.id === 'pauseMenu') renderPause(activeTab || 'settings');
      else renderOptions(root);
      return;
    }

    const fullscreen = target.closest('[data-unified-fullscreen]');
    if (fullscreen) { event.preventDefault(); toggleFullscreen(); return; }

    const resetPrefs = target.closest('[data-unified-reset-preferences]');
    if (resetPrefs) {
      event.preventDefault();
      writePrefs(defaults);
      syncPrefs(defaults);
      const root = resetPrefs.closest('#pauseMenu') || $('titlePanel');
      const activeTab = root?.querySelector('[data-pause-tab].is-active')?.dataset.pauseTab;
      if (root?.id === 'pauseMenu') renderPause(activeTab || 'settings'); else renderOptions(root);
      return;
    }

    const resetSave = target.closest('[data-unified-reset-save]');
    if (resetSave) {
      event.preventDefault();
      try { localStorage.removeItem('relay-runner-state'); } catch {}
      window.location.reload();
    }
  };

  const handleInput = event => {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    if (!input?.matches('[data-unified-range]')) return;
    const key = input.dataset.unifiedRange;
    const value = Math.max(0, Math.min(1, Number(input.value) || 0));
    const label = input.closest('.relay-ui-range')?.querySelector(`[data-unified-range-value="${key}"]`);
    if (label) label.textContent = `${Math.round(value * 100)}%`;
    setCoreSetting(key, value);
  };

  const start = () => {
    ensurePauseShell();
    syncPrefs(readPrefs());
    document.addEventListener('click', handleClick, true);
    document.addEventListener('input', handleInput, true);
    window.addEventListener('resize', ensurePauseShell, { passive:true });
    window.relayUnifiedCinematicUI = Object.freeze({ openOptions:openTitleOptions, openFAQ:openFaq, openPause, renderPause });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else window.setTimeout(start, 0);
})();
