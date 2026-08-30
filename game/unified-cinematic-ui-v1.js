import { missions } from './missions.js';
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
    try { localStorage.setItem(PRESENTATION_KEY, JSON.stringify(prefs)); } catch {}
  };
  const syncPrefs = prefs => {
    document.body.classList.toggle('relay-hide-intel', !prefs.intelCards);
    document.body.classList.toggle('relay-hide-ally', !prefs.allyIntel);
    document.body.classList.toggle('relay-hide-events', !prefs.eventPopups);
    document.body.classList.toggle('relay-hide-tutorials', !prefs.tutorialHints);
  };

  const closeAllOverlays = () => {
    ['titlePanel','relayInfoPanel','preflight'].forEach(id => $(id)?.classList.add('hidden'));
  };

  const resumeRunner = () => {
    const scene = window.__relayRunnerScene;
    try { scene?.scene?.resume?.(); } catch {}
  };

  const hidePause = (resume = false) => {
    const pause = $('pauseMenu');
    if (pause) pause.classList.add('hidden');
    if (resume) resumeRunner();
  };

  const openPause = tab => {
    closeAllOverlays();
    const pause = $('pauseMenu');
    if (!pause) return;
    pause.classList.remove('hidden');
    pause.classList.add('relay-cinematic-overlay');
    const shell = pause.querySelector('.relay-pause-shell');
    if (!shell) return;
    renderPause(tab || 'resume');
  };

  const renderOverlay = (host, { kicker, title, subtitle, body, footer = '', closeLabel = 'Close' }) => {
    if (!host) return;
    host.classList.add('relay-cinematic-overlay');
    host.innerHTML = `<div class="relay-cinematic-panel">
      <button class="relay-cinematic-close" type="button" data-unified-close aria-label="${closeLabel}">×</button>
      <header class="relay-cinematic-head">
        <div><p class="relay-cinematic-kicker">${kicker}</p><h2 class="relay-cinematic-title">${title}</h2><p class="relay-cinematic-subtitle">${subtitle}</p></div>
        <span class="relay-cinematic-status"><i></i>ONLINE</span>
      </header>
      <div class="relay-cinematic-body">${body}</div>
      <footer>${footer}</footer>
    </div>`;
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

  const legacySettingsBridge = (key, value) => {
    const pause = $('pauseMenu');
    const legacyTab = pause?.querySelector('.menu .tab[data-tab="settings"]');
    if (!legacyTab) return false;
    try { legacyTab.click(); } catch { return false; }
    if (typeof value === 'boolean') {
      const button = pause.querySelector(`.menu #panelContent [data-setting="${key}"]`);
      if (!button) return false;
      try { button.click(); return true; } catch { return false; }
    }
    const input = pause.querySelector(`.menu #panelContent [data-volume="${key}"]`);
    if (!input) return false;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles:true }));
    return true;
  };

  const updateRuntimeFallback = (key, value) => {
    const scene = window.__relayRunnerScene;
    if (key === 'rain') scene?.rain?.setVisible?.(Boolean(value));
    if (key === 'screenShake' && scene) scene.screenShake = Boolean(value);
    if (key === 'reducedMotion' && scene) scene.motionReduced = Boolean(value);
    if (key === 'muted') window.speechSynthesis?.cancel?.();
  };

  const setCoreSetting = (key, value) => {
    const usedBridge = legacySettingsBridge(key, value);
    if (!usedBridge) {
      const state = loadState();
      saveState({ ...state, [key]: value });
      updateRuntimeFallback(key, value);
    }
    return loadState();
  };

  const toggleCoreSetting = key => {
    const state = loadState();
    const current = key === 'muted' ? !!state.muted : !!state[key];
    setCoreSetting(key, !current);
  };

  const setVolume = (key, value) => {
    if (!legacySettingsBridge(key, value)) {
      const state = loadState();
      saveState({ ...state, [key]: Number(value) });
    }
    window.dispatchEvent(new CustomEvent('relay:unified-volume-change', { detail:{ key, value:Number(value) } }));
  };

  const renderOptionsBody = () => {
    const state = loadState();
    const prefs = readPrefs();
    const lang = localStorage.getItem('relay-runner-language') || 'en';
    return `<div class="relay-section-grid">
      <section class="relay-ui-section"><div class="relay-ui-section-title">GAMEPLAY</div>${settingMeta.map(([key,label,detail]) => toggleCard(key,label,detail,key === 'muted' ? !state.muted : !!state[key])).join('')}</section>
      <section class="relay-ui-section"><div class="relay-ui-section-title">AUDIO</div>${rangeCard('musicVolume','MUSIC VOLUME','Menu and gameplay music.',Number(state.musicVolume ?? .55))}${rangeCard('sfxVolume','SFX VOLUME','Impacts, actions and alerts.',Number(state.sfxVolume ?? .7))}</section>
      <section class="relay-ui-section wide"><div class="relay-ui-section-title">PRESENTATION</div><div class="relay-section-grid">${presentationMeta.map(([key,label,detail]) => toggleCard(key,label,detail,!!prefs[key])).join('')}</div></section>
      <section class="relay-ui-section"><div class="relay-ui-section-title">LANGUAGE</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>LANGUAGE</strong><small>Choose the menu language used by the relay.</small></div><div class="relay-ui-choice-row">${[['en','EN'],['exyu','EX-YU'],['es','ES'],['de','DE']].map(([id,label]) => `<button class="relay-ui-choice ${lang === id ? 'is-active' : ''}" type="button" data-unified-language="${id}">${label}</button>`).join('')}</div></article></section>
      <section class="relay-ui-section"><div class="relay-ui-section-title">DISPLAY</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>FULLSCREEN</strong><small>Use the browser's native fullscreen mode when supported.</small></div><button class="relay-ui-button" type="button" data-unified-fullscreen>TOGGLE</button></article><article class="relay-ui-card"><div class="relay-ui-copy"><strong>INTERFACE</strong><small>Responsive layout is shared between web and mobile.</small></div><span class="relay-cinematic-status"><i></i>RESPONSIVE</span></article></section>
      <section class="relay-ui-section wide"><div class="relay-ui-section-title">CONTROLS</div><div class="relay-ui-controls"><span class="relay-ui-key"><kbd>A</kbd><b>/</b><kbd>D</kbd> MOVE</span><span class="relay-ui-key"><kbd>SPACE</kbd> JUMP</span><span class="relay-ui-key"><kbd>E</kbd> FIRE</span><span class="relay-ui-key"><kbd>Q</kbd> BLADE</span><span class="relay-ui-key"><kbd>SHIFT</kbd> DASH</span><span class="relay-ui-key"><kbd>ESC</kbd> PAUSE</span><span class="relay-ui-key">TOUCH · JOYSTICK + ACTIONS</span></div></section>
      <section class="relay-ui-section wide"><div class="relay-ui-actions"><button class="relay-ui-button primary" type="button" data-unified-close>DONE</button><button class="relay-ui-button" type="button" data-unified-reset-preferences>RESET UI PREFS</button><button class="relay-ui-button danger" type="button" data-unified-reset-save>RESET LOCAL SAVE</button></div></section>
    </div>`;
  };

  const renderOptions = (host, mode = 'overlay') => {
    const content = `<div class="relay-cinematic-panel"><button class="relay-cinematic-close" type="button" data-unified-close aria-label="Close options">×</button><header class="relay-cinematic-head"><div><p class="relay-cinematic-kicker">RELAY RUNNER // SYSTEM TERMINAL</p><h2 class="relay-cinematic-title">OPTIONS</h2><p class="relay-cinematic-subtitle">Configure audio, gameplay, presentation and controls without leaving the relay.</p></div><span class="relay-cinematic-status"><i></i>ONLINE</span></header><div class="relay-cinematic-body">${renderOptionsBody()}</div></div>`;
    if (mode === 'overlay') {
      if (!host) return;
      host.classList.add('relay-cinematic-overlay');
      host.innerHTML = content;
    } else {
      host.innerHTML = content;
    }
  };

  const faqData = [
    ['HOW TO PLAY','Start a route, follow the objective, collect Signals and reach the delivery beacon. Checkpoints protect your run and unlock progression.'],
    ['MOVEMENT','Use A/D on keyboard. On touch devices, drag the left joystick. Jump with SPACE or JUMP and use DASH when available.'],
    ['COMBAT','E fires your equipped ranged weapon and Q uses the melee blade. Some routes introduce enemies, bosses and environmental hazards.'],
    ['ABILITIES','Abilities unlock through campaign progression. Required abilities are enforced for later routes; optional abilities can be selected in pre-flight.'],
    ['MISSIONS','Complete a route to unlock its next mission. Mission performance, Signals, Secrets, contracts and clean runs feed your progression systems.'],
    ['CHECKPOINTS','A checkpoint becomes your recovery line after a fall or death. Some pickups can reset when you respawn.'],
    ['PROGRESSION','XP, levels, ranks, mastery, achievements, contracts, challenges and credits are persisted locally for this browser profile.'],
    ['MOBILE','The game uses the same visual menu system on mobile and web. Touch controls are shown only during gameplay and use dedicated pointer ownership.'],
  ];
  const renderFaq = host => renderOverlay(host, { kicker:'RELAY RUNNER // KNOWLEDGE BASE', title:'FAQ', subtitle:'Route intelligence, controls and system guidance.', body:`<div class="relay-faq-grid">${faqData.map(([q,a]) => `<article class="relay-faq-item"><button class="relay-faq-question" type="button" data-faq-question><span>${q}</span><b>＋</b></button><div class="relay-faq-answer">${a}</div></article>`).join('')}</div>` });

  const missionCard = (mission, index, state) => {
    const unlocked = !mission.unlockRequirement || state.completed.includes(mission.unlockRequirement);
    const stat = state.missionStats?.[mission.id];
    return `<article class="relay-ui-card" data-pause-mission-card="${index}"><div class="relay-ui-copy"><strong>${String(index + 1).padStart(2,'0')} · ${mission.title.toUpperCase()}</strong><small>${unlocked ? `${mission.difficulty} · ${mission.signals.length} SIGNALS · ${mission.objective}` : `LOCKED · COMPLETE ${String(mission.unlockRequirement || '').replaceAll('-',' ').toUpperCase()}`}${stat?.completed ? ` · BEST ${stat.bestScore || 0}` : ''}</small></div><button class="relay-ui-button ${unlocked ? '' : 'is-locked'}" type="button" data-pause-launch="${index}" ${unlocked ? '' : 'disabled'}>${unlocked ? (stat?.completed ? 'REPLAY' : 'DEPLOY') : 'LOCKED'}</button></article>`;
  };

  const renderPause = tab => {
    const pause = $('pauseMenu');
    const shell = pause?.querySelector('.relay-pause-shell');
    if (!shell) return;
    shell.querySelectorAll('[data-pause-tab]').forEach(button => button.classList.toggle('is-active', button.dataset.pauseTab === tab));
    const content = shell.querySelector('.relay-pause-content');
    const state = loadState();
    if (!content) return;
    if (tab === 'resume') {
      content.innerHTML = `<div class="relay-cinematic-panel"><div class="relay-cinematic-body"><div class="relay-ui-section wide"><div class="relay-ui-section-title">RUN STATUS</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>ROUTE ACTIVE</strong><small>Your current run is paused safely. Resume returns control to the courier immediately.</small></div><button class="relay-ui-button primary" type="button" data-unified-resume>RESUME RUN</button></article></div></div></div>`;
      return;
    }
    if (tab === 'missions') {
      content.innerHTML = `<div class="relay-cinematic-panel"><div class="relay-cinematic-body"><div class="relay-ui-section wide"><div class="relay-ui-section-title">MISSION NETWORK</div>${missions.map((mission,index)=>missionCard(mission,index,state)).join('')}</div></div></div>`;
      return;
    }
    if (tab === 'progress') {
      const rank = getCourierRank(state.xp || 0); const level = getLevelProgress(state.xp || 0);
      const mastery = Object.values(state.mastery || {}).reduce((n,b) => n + (Array.isArray(b) ? b.length : 0), 0);
      content.innerHTML = `<div class="relay-cinematic-panel"><div class="relay-cinematic-body"><div class="relay-section-grid three"><section class="relay-ui-section"><div class="relay-ui-section-title">LEVEL</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>LEVEL ${level.level} / 100</strong><small>${level.level === 100 ? 'MAXIMUM LEVEL' : `${Math.max(0, level.next - state.xp)} XP TO NEXT LEVEL`}</small></div><b class="relay-cinematic-status">${Math.round(level.progress * 100)}%</b></article></section><section class="relay-ui-section"><div class="relay-ui-section-title">RANK</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>${rank.name}</strong><small>${state.xp} XP · ${rank.next ? `${Math.max(0, rank.next.threshold - state.xp)} XP TO ${rank.next.name}` : 'MAXIMUM RANK'}</small></div></article></section><section class="relay-ui-section"><div class="relay-ui-section-title">RUNS</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>${state.totalRuns || 0} RUNS</strong><small>${state.completed?.length || 0}/${missions.length} ROUTES COMPLETE · ${state.signals || 0} SIGNALS</small></div></article></section></div><div class="relay-ui-section wide"><div class="relay-ui-section-title">ACHIEVEMENTS</div><div class="relay-section-grid">${achievementDefinitions.map(a=>`<article class="relay-ui-card"><div class="relay-ui-copy"><strong>${(state.achievements||[]).includes(a.id) ? '★ ' : '○ '}${a.label}</strong><small>${a.detail}</small></div></article>`).join('')}</div></div><div class="relay-ui-section wide"><div class="relay-ui-section-title">MASTERY</div><article class="relay-ui-card"><div class="relay-ui-copy"><strong>${mastery} BADGES EARNED</strong><small>${missions.map(m=>`${m.title}: ${(state.mastery?.[m.id] || []).join(' · ') || 'UNCLAIMED'}`).join(' · ')}</small></div></article></div></div></div>`;
      return;
    }
    if (tab === 'settings') {
      renderOptions(content, 'embedded');
      return;
    }
    if (tab === 'faq') {
      renderFaq(content);
      return;
    }
  };

  const ensurePauseShell = () => {
    const pause = $('pauseMenu');
    if (!pause || pause.querySelector('.relay-pause-shell')) return;
    const shell = document.createElement('section');
    shell.className = 'relay-pause-shell';
    shell.innerHTML = `<header class="relay-pause-head"><div class="relay-pause-brand"><span class="relay-pause-mark">R/</span><span>COURIER TERMINAL</span></div><div class="relay-pause-state">GAME PAUSED · SYSTEM STANDBY</div><button class="relay-cinematic-close" type="button" data-unified-close aria-label="Close pause menu">×</button></header><div class="relay-pause-layout"><nav class="relay-pause-nav" aria-label="Pause navigation"><button type="button" data-pause-tab="resume">RESUME</button><button type="button" data-pause-tab="missions">MISSION NETWORK</button><button type="button" data-pause-tab="progress">PROGRESS</button><button type="button" data-pause-tab="settings">SETTINGS</button><button type="button" data-pause-tab="faq">FAQ</button></nav><section class="relay-pause-content"></section></div>`;
    pause.appendChild(shell);
  };

  const openTitleOptions = () => { closeAllOverlays(); renderOptions($('titlePanel')); $('titlePanel').classList.remove('hidden'); };
  const openFaq = () => { closeAllOverlays(); renderFaq($('relayInfoPanel')); $('relayInfoPanel').classList.remove('hidden'); };

  const launchMissionViaLegacy = index => {
    const pause = $('pauseMenu');
    const oldTab = pause?.querySelector('.menu .tab[data-tab="missions"]');
    if (!oldTab) return;
    try {
      oldTab.click();
      const button = pause.querySelector(`.menu #panelContent [data-mission="${index}"]`);
      if (button && !button.disabled) button.click();
    } catch (error) {
      console.warn('[Relay Runner] unified mission launch bridge failed', error);
    }
  };

  const resetLocalSave = () => {
    const ok = window.confirm('RESET LOCAL SAVE? This removes local progression for Relay Runner.');
    if (!ok) return;
    try { localStorage.removeItem('relay-runner-state'); } catch {}
    window.location.reload();
  };

  const handleClick = event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const option = target.closest('[data-v3-options]');
    if (option) { event.preventDefault(); event.stopPropagation(); openTitleOptions(); return; }
    const faq = target.closest('[data-v3-faq], [data-relay-info="faq"]');
    if (faq) { event.preventDefault(); event.stopPropagation(); openFaq(); return; }
    const pauseButton = target.closest('#pause, #mobilePauseButton');
    if (pauseButton) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.();
      openPause('resume'); return;
    }
    const settingsMobile = target.closest('#mobileSettingsButton');
    if (settingsMobile) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); openPause('settings'); return; }

    const close = target.closest('[data-unified-close]');
    if (close) { event.preventDefault(); event.stopPropagation(); if (close.closest('#pauseMenu')) hidePause(true); else closeAllOverlays(); return; }

    const pauseTab = target.closest('[data-pause-tab]');
    if (pauseTab) { event.preventDefault(); renderPause(pauseTab.dataset.pauseTab); return; }
    if (target.closest('[data-unified-resume]')) { event.preventDefault(); hidePause(true); return; }

    const launch = target.closest('[data-pause-launch]');
    if (launch && !launch.disabled) { event.preventDefault(); launchMissionViaLegacy(Number(launch.dataset.pauseLaunch)); return; }

    const faqQuestion = target.closest('[data-faq-question]');
    if (faqQuestion) { event.preventDefault(); const item = faqQuestion.closest('.relay-faq-item'); item?.classList.toggle('is-open'); faqQuestion.setAttribute('aria-expanded', String(item?.classList.contains('is-open'))); return; }

    const setting = target.closest('[data-unified-setting]');
    if (setting) {
      event.preventDefault();
      const key = setting.dataset.unifiedSetting;
      if (presentationMeta.some(([id]) => id === key)) {
        const prefs = readPrefs(); prefs[key] = !prefs[key]; writePrefs(prefs); syncPrefs(prefs);
        const inPause = setting.closest('#pauseMenu'); inPause ? renderPause('settings') : renderOptions($('titlePanel'));
      } else {
        toggleCoreSetting(key);
        const inPause = setting.closest('#pauseMenu'); inPause ? renderPause('settings') : renderOptions($('titlePanel'));
      }
      return;
    }

    const language = target.closest('[data-unified-language]');
    if (language) {
      event.preventDefault();
      const code = language.dataset.unifiedLanguage;
      localStorage.setItem('relay-runner-language', code);
      if (window.relayI18n?.applyLanguage) window.relayI18n.applyLanguage(code);
      else document.documentElement.lang = code === 'exyu' ? 'bs' : code;
      const inPause = language.closest('#pauseMenu'); inPause ? renderPause('settings') : renderOptions($('titlePanel'));
      return;
    }

    const fullscreen = target.closest('[data-unified-fullscreen]');
    if (fullscreen) {
      event.preventDefault();
      if (document.fullscreenElement) document.exitFullscreen?.().catch?.(() => {});
      else document.documentElement.requestFullscreen?.().catch?.(() => {});
      return;
    }

    const resetPrefs = target.closest('[data-unified-reset-preferences]');
    if (resetPrefs) { event.preventDefault(); writePrefs({ ...defaults }); syncPrefs({ ...defaults }); const inPause = resetPrefs.closest('#pauseMenu'); inPause ? renderPause('settings') : renderOptions($('titlePanel')); return; }
    const resetSave = target.closest('[data-unified-reset-save]');
    if (resetSave) { event.preventDefault(); resetLocalSave(); return; }
  };

  const handleInput = event => {
    const input = event.target instanceof HTMLInputElement ? event.target : null;
    if (!input?.matches('[data-unified-range]')) return;
    const key = input.dataset.unifiedRange; const value = Number(input.value);
    setVolume(key, value);
    input.closest('.relay-ui-range')?.querySelector(`[data-unified-range-value="${key}"]`)?.replaceChildren(`${Math.round(value * 100)}%`);
  };

  const start = () => {
    ensurePauseShell();
    syncPrefs(readPrefs());
    document.addEventListener('click', handleClick, true);
    document.addEventListener('input', handleInput, true);
    window.addEventListener('resize', ensurePauseShell, { passive:true });
    window.relayUnifiedCinematicUI = { openOptions:openTitleOptions, openFAQ:openFaq, openPause, renderPause };
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else window.setTimeout(start, 0);
})();
