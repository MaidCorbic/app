import './i18n-options-v1.css';
import { loadState } from './src/state.js';

(() => {
  const LANG_KEY = 'relay.runner.language';
  const UI_KEY = 'relay.runner.ui-options';
  const LANGUAGES = ['en', 'bs', 'hr', 'sr'];
  const labels = { en: 'ENGLISH', bs: 'BOSANSKI', hr: 'HRVATSKI', sr: 'SRPSKI' };

  const t = {
    en: {
      language: 'LANGUAGE', homeEyebrow: 'A ROOFTOP DELIVERY GAME', tagline: 'Run the sleeping city. Carry the signal farther than anyone else can.', play: 'PLAY NOW', continue: 'CONTINUE', pressEnter: 'PRESS ENTER TO BEGIN', options: 'OPTIONS', optionsSub: 'SETTINGS & CONTROLS', exit: 'EXIT', exitSub: 'CLOSE SESSION', faq: 'FAQ', latest: 'LATEST UPDATE',
      pauseEyebrow: 'COURIER TERMINAL', pauseTitle: 'KEEP THE LINE OPEN.', resume: 'RESUME', missions: 'MISSIONS', progress: 'PROGRESS', settings: 'SETTINGS', restart: 'RESTART BRIEFING',
      completeEyebrow: 'DELIVERY COMPLETE', completeTitle: 'LINE RESTORED.', nextRun: 'NEXT RUN', nextMission: 'NEXT MISSION', returnBrief: 'RETURN TO BRIEFING', gameOverEyebrow: 'SIGNAL LOST', gameOverTitle: 'RUN INTERRUPTED.', retry: 'TRY AGAIN',
      rotate: 'ROTATE SCREEN', rotateSub: 'Landscape gives the clearest view and full controls.', rotateContinue: 'CONTINUE',
      signals: 'SIGNALS', xp: 'XP EARNED', chapter: 'CHAPTER 01 / NIGHT SHIFT', intel: 'ROUTE INTEL', close: 'CLOSE',
      menuOptions: 'RELAY OPTIONS', menuOptionsSub: 'EXTRA CONTROL SYSTEMS', fullscreen: 'FULLSCREEN', fullscreenSub: 'Use the whole display when supported.', lowEffects: 'LOW VISUAL EFFECTS', lowEffectsSub: 'Reduce menu motion and background animation.', highContrast: 'HIGH CONTRAST', highContrastSub: 'Increase important interface text contrast.', keyHints: 'KEY HINTS', keyHintsSub: 'Show keyboard hints during gameplay.', focusMode: 'FOCUS MODE', focusModeSub: 'Dim secondary menu elements for a cleaner start screen.', glow: 'GLOW FX', glowSub: 'Keep cyber glow and text effects enabled.', testSound: 'TEST SFX', testSoundSub: 'Play a short confirmation tone.', languageSub: 'Change menu and system language instantly.', resetUi: 'RESET UI PREFERENCES', resetSub: 'Restore language and visual preferences.', on: 'ON', off: 'OFF', enabled: 'ENABLED', disabled: 'DISABLED', yes: 'YES', no: 'NO', resetConfirm: 'Reset language and visual preferences?', soundTest: 'SOUND TEST', fullscreenOn: 'EXIT FULLSCREEN', fullscreenOff: 'ENTER FULLSCREEN',
      musicVolume: 'Music volume', sfxVolume: 'SFX volume', screenShake: 'Screen shake', reducedMotion: 'Reduced motion', atmosphericRain: 'Atmospheric rain', gameAudio: 'Game audio', replayTutorial: 'REPLAY FIRST-TIME TUTORIAL', controls: 'CONTROLS'
    },
    bs: {
      language: 'JEZIK', homeEyebrow: 'IGRA DOSTAVE PREKO KROVOVA', tagline: 'Trči kroz usnuli grad. Prenesi signal dalje nego iko prije tebe.', play: 'IGRAJ', continue: 'NASTAVI', pressEnter: 'PRITISNI ENTER ZA POČETAK', options: 'POSTAVKE', optionsSub: 'POSTAVKE I KONTROLE', exit: 'IZLAZ', exitSub: 'ZATVORI SESIJU', faq: 'PITANJA', latest: 'NOVI UPDATE',
      pauseEyebrow: 'KURIROV TERMINAL', pauseTitle: 'ODRŽI LINIJU OTVORENOM.', resume: 'NASTAVI', missions: 'MISIJE', progress: 'NAPREDAK', settings: 'POSTAVKE', restart: 'PONOVO OTVORI UVOD',
      completeEyebrow: 'DOSTAVA ZAVRŠENA', completeTitle: 'VEZA OBNOVLJENA.', nextRun: 'NOVA RUNDA', nextMission: 'SLJEDEĆA MISIJA', returnBrief: 'NAZAD NA UVOD', gameOverEyebrow: 'SIGNAL IZGUBLJEN', gameOverTitle: 'RUNDA PREKINUTA.', retry: 'PONOVI',
      rotate: 'OKRENI EKRAN', rotateSub: 'Landscape prikaz daje najjasniji pogled i pune kontrole.', rotateContinue: 'NASTAVI',
      signals: 'SIGNALI', xp: 'OSVOJENI XP', chapter: 'POGLAVLJE 01 / NOĆNA SMJENA', intel: 'INFORMACIJE O RUTI', close: 'ZATVORI',
      menuOptions: 'RELAY POSTAVKE', menuOptionsSub: 'DODATNI SISTEMI KONTROLE', fullscreen: 'CIJELI EKRAN', fullscreenSub: 'Koristi cijeli ekran kada je podržano.', lowEffects: 'MANJE EFEKATA', lowEffectsSub: 'Smanji animacije menija i pozadinske efekte.', highContrast: 'VISOK KONTRAST', highContrastSub: 'Pojačaj kontrast važnog teksta interfejsa.', keyHints: 'TIPKE', keyHintsSub: 'Prikaži tastaturne prečice tokom igre.', focusMode: 'FOKUS MOD', focusModeSub: 'Zatamni sporedne elemente za čišći početni ekran.', glow: 'GLOW EFEKTI', glowSub: 'Zadrži cyber sjaj i tekstualne efekte.', testSound: 'TEST ZVUKA', testSoundSub: 'Pusti kratki zvuk potvrde.', languageSub: 'Odmah promijeni jezik menija i sistema.', resetUi: 'RESETUJ UI POSTAVKE', resetSub: 'Vrati jezik i vizuelne postavke na početno stanje.', on: 'UKLJ', off: 'ISKLJ', enabled: 'UKLJUČENO', disabled: 'ISKLJUČENO', yes: 'DA', no: 'NE', resetConfirm: 'Resetovati jezik i vizuelne postavke?', soundTest: 'TEST ZVUKA', fullscreenOn: 'IZAĐI IZ CIJELOG EKRANA', fullscreenOff: 'CIJELI EKRAN',
      musicVolume: 'Glasnoća muzike', sfxVolume: 'Glasnoća efekata', screenShake: 'Tresenje ekrana', reducedMotion: 'Smanjene animacije', atmosphericRain: 'Atmosferska kiša', gameAudio: 'Zvuk igre', replayTutorial: 'PONOVI UVODNI TUTORIJAL', controls: 'KONTROLE'
    },
    hr: {
      language: 'JEZIK', homeEyebrow: 'IGRA DOSTAVE PREKO KROVOVA', tagline: 'Trči kroz usnuli grad. Prenesi signal dalje nego itko prije tebe.', play: 'IGRAJ', continue: 'NASTAVI', pressEnter: 'PRITISNI ENTER ZA POČETAK', options: 'POSTAVKE', optionsSub: 'POSTAVKE I KONTROLE', exit: 'IZLAZ', exitSub: 'ZATVORI SESIJU', faq: 'FAQ', latest: 'NOVI UPDATE',
      pauseEyebrow: 'KURIROV TERMINAL', pauseTitle: 'ODRŽI LINIJU OTVORENOM.', resume: 'NASTAVI', missions: 'MISIJE', progress: 'NAPREDAK', settings: 'POSTAVKE', restart: 'PONOVNO OTVORI UVOD',
      completeEyebrow: 'DOSTAVA ZAVRŠENA', completeTitle: 'VEZA OBNOVLJENA.', nextRun: 'NOVA RUNDA', nextMission: 'SLJEDEĆA MISIJA', returnBrief: 'NATRAG NA UVOD', gameOverEyebrow: 'SIGNAL IZGUBLJEN', gameOverTitle: 'RUNDA PREKINUTA.', retry: 'PONOVI',
      rotate: 'OKRENI ZASLON', rotateSub: 'Landscape prikaz daje najjasniji pogled i pune kontrole.', rotateContinue: 'NASTAVI',
      signals: 'SIGNALI', xp: 'OSVOJENI XP', chapter: 'POGLAVLJE 01 / NOĆNA SMJENA', intel: 'INFORMACIJE O RUTI', close: 'ZATVORI',
      menuOptions: 'RELAY POSTAVKE', menuOptionsSub: 'DODATNI SUSTAVI KONTROLE', fullscreen: 'CIJELI ZASLON', fullscreenSub: 'Koristi cijeli zaslon kada je podržano.', lowEffects: 'MANJE EFEKATA', lowEffectsSub: 'Smanji animacije izbornika i pozadinske efekte.', highContrast: 'VISOK KONTRAST', highContrastSub: 'Pojačaj kontrast važnog teksta sučelja.', keyHints: 'TIPKE', keyHintsSub: 'Prikaži tipkovničke prečace tijekom igre.', focusMode: 'FOKUS MOD', focusModeSub: 'Zatamni sporedne elemente za čišći početni zaslon.', glow: 'GLOW EFEKTI', glowSub: 'Zadrži cyber sjaj i tekstualne efekte.', testSound: 'TEST ZVUKA', testSoundSub: 'Pusti kratki zvuk potvrde.', languageSub: 'Odmah promijeni jezik izbornika i sustava.', resetUi: 'RESETIRAJ UI POSTAVKE', resetSub: 'Vrati jezik i vizualne postavke na početno stanje.', on: 'UKLJ', off: 'ISKLJ', enabled: 'UKLJUČENO', disabled: 'ISKLJUČENO', yes: 'DA', no: 'NE', resetConfirm: 'Resetirati jezik i vizualne postavke?', soundTest: 'TEST ZVUKA', fullscreenOn: 'IZAĐI IZ CIJELOG ZASLONA', fullscreenOff: 'CIJELI ZASLON',
      musicVolume: 'Glasnoća glazbe', sfxVolume: 'Glasnoća efekata', screenShake: 'Tresenje zaslona', reducedMotion: 'Smanjene animacije', atmosphericRain: 'Atmosferska kiša', gameAudio: 'Zvuk igre', replayTutorial: 'PONOVI UVODNI TUTORIJAL', controls: 'KONTROLE'
    },
    sr: {
      language: 'JEЗИК', homeEyebrow: 'ИГРА ДОСТАВЕ ПРЕКО КРОВОВА', tagline: 'Трчи кроз успавани град. Пренеси сигнал даље него ико пре тебе.', play: 'ИГРАЈ', continue: 'НАСТАВИ', pressEnter: 'ПРИТИСНИ ENTER ЗА ПОЧЕТАК', options: 'ПОДЕШАВАЊА', optionsSub: 'ПОДЕШАВАЊА И КОНТРОЛЕ', exit: 'ИЗЛАЗ', exitSub: 'ЗАТВОРИ СЕСИЈУ', faq: 'FAQ', latest: 'НОВИ UPDATE',
      pauseEyebrow: 'КУРИРОВ ТЕРМИНАЛ', pauseTitle: 'ОДРЖИ ЛИНИЈУ ОТВОРЕНОМ.', resume: 'НАСТАВИ', missions: 'МИСИЈЕ', progress: 'НАПРЕДАК', settings: 'ПОДЕШАВАЊА', restart: 'ПОНОВО ОТВОРИ УВОД',
      completeEyebrow: 'ИСПОРУКА ЗАВРШЕНА', completeTitle: 'ВЕЗА ОБНОВЉЕНА.', nextRun: 'НОВА РУНДА', nextMission: 'СЛЕДЕЋА МИСИЈА', returnBrief: 'НАЗАД НА УВОД', gameOverEyebrow: 'СИГНАЛ ИЗГУБЉЕН', gameOverTitle: 'РУНДА ПРЕКИНУТА.', retry: 'ПОНОВИ',
      rotate: 'ОКРЕНИ ЕКРАН', rotateSub: 'Landscape приказ даје најјаснији поглед и пуне контроле.', rotateContinue: 'НАСТАВИ',
      signals: 'СИГНАЛИ', xp: 'ОСВОЈЕНИ XP', chapter: 'ПОГЛАВЉЕ 01 / НОЋНА СМЕНА', intel: 'ИНФОРМАЦИЈЕ О РУТИ', close: 'ЗАТВОРИ',
      menuOptions: 'RELAY ПОДЕШАВАЊА', menuOptionsSub: 'ДОДАТНИ СИСТЕМИ КОНТРОЛЕ', fullscreen: 'ЦЕО ЕКРАН', fullscreenSub: 'Користи цео екран када је подржано.', lowEffects: 'МАЊЕ ЕФЕКАТА', lowEffectsSub: 'Смањи анимације менија и позадинске ефекте.', highContrast: 'ВИСОК КОНТРАСТ', highContrastSub: 'Појачај контраст важног текста интерфејса.', keyHints: 'ТАСТЕРИ', keyHintsSub: 'Прикажи пречице током игре.', focusMode: 'ФОКУС МОД', focusModeSub: 'Затамни споредне елементе за чистији почетни екран.', glow: 'GLOW ЕФЕКТИ', glowSub: 'Задржи cyber сјај и текстуалне ефекте.', testSound: 'ТЕСТ ЗВУКА', testSoundSub: 'Пусти кратак звук потврде.', languageSub: 'Одмах промени језик менија и система.', resetUi: 'РЕСЕТУЈ UI ПОДЕШАВАЊА', resetSub: 'Врати језик и визуелна подешавања на почетно стање.', on: 'УКЉ', off: 'ИСКЉ', enabled: 'УКЉУЧЕНО', disabled: 'ИСКЉУЧЕНО', yes: 'ДА', no: 'НЕ', resetConfirm: 'Ресетовати језик и визуелна подешавања?', soundTest: 'ТЕСТ ЗВУКА', fullscreenOn: 'ИЗАЂИ ИЗ ЦЕЛОГ ЕКРАНА', fullscreenOff: 'ЦЕО ЕКРАН',
      musicVolume: 'Јачина музике', sfxVolume: 'Јачина ефеката', screenShake: 'Тресење екрана', reducedMotion: 'Смањене анимације', atmosphericRain: 'Атмосферска киша', gameAudio: 'Звук игре', replayTutorial: 'ПОНОВИ ПОЧЕТНИ ТУТОРИЈАЛ', controls: 'КОНТРОЛЕ'
    }
  };

  const readUi = () => {
    try { return { lowEffects: false, highContrast: false, keyHints: true, focusMode: false, glow: true, ...JSON.parse(localStorage.getItem(UI_KEY) || '{}') }; }
    catch { return { lowEffects: false, highContrast: false, keyHints: true, focusMode: false, glow: true }; }
  };
  const saveUi = value => localStorage.setItem(UI_KEY, JSON.stringify(value));
  const getLanguage = () => LANGUAGES.includes(localStorage.getItem(LANG_KEY)) ? localStorage.getItem(LANG_KEY) : 'en';
  const setLanguage = lang => { if (!LANGUAGES.includes(lang)) return; localStorage.setItem(LANG_KEY, lang); applyLanguage(); };
  const current = () => t[getLanguage()];

  const text = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value) element.textContent = value;
  };

  function injectLanguageBar() {
    const intro = document.getElementById('intro');
    if (!intro || document.getElementById('relayLanguageBar')) return;
    const bar = document.createElement('div');
    bar.id = 'relayLanguageBar';
    bar.innerHTML = `<span class="relay-lang-label"></span>${LANGUAGES.map(lang => `<button type="button" data-relay-lang="${lang}">${lang.toUpperCase()}</button>`).join('')}`;
    intro.appendChild(bar);
    bar.addEventListener('click', event => {
      const button = event.target.closest('[data-relay-lang]');
      if (button) setLanguage(button.dataset.relayLang);
    });
  }

  function applyLanguage() {
    const lang = getLanguage();
    const x = current();
    document.documentElement.lang = lang === 'en' ? 'en' : lang;
    document.title = `Relay Runner — ${labels[lang]}`;
    injectLanguageBar();
    text('#relayLanguageBar .relay-lang-label', x.language);
    document.querySelectorAll('#relayLanguageBar [data-relay-lang]').forEach(button => button.classList.toggle('is-active', button.dataset.relayLang === lang));

    text('#intro .title-lockup .eyebrow', x.homeEyebrow);
    text('#intro .menu-tagline', x.tagline);
    text('#intro #start span', x.play);
    text('#intro #continue', x.continue + ' →');
    const enter = document.querySelector('#intro .menu-actions p'); if (enter) enter.innerHTML = `${x.pressEnter.split(' ENTER ')[0]} <b>ENTER</b> ${x.pressEnter.includes(' ENTER ') ? x.pressEnter.split(' ENTER ')[1] : ''}`.trim();
    text('#intro [data-title-panel="controls"] span', x.options);
    text('#intro [data-title-panel="controls"] small', x.optionsSub);
    text('#intro #exitTitle span', x.exit);
    text('#intro #exitTitle small', x.exitSub);
    text('#intro .faq-launcher', x.faq);
    document.querySelector('#intro .faq-launcher')?.setAttribute('aria-label', x.faq);
    document.querySelector('#intro .info-circle')?.setAttribute('aria-label', x.latest);

    text('#pauseMenu aside .eyebrow', x.pauseEyebrow);
    const pauseH2 = document.querySelector('#pauseMenu aside h2'); if (pauseH2) pauseH2.innerHTML = x.pauseTitle.replace('LINE', '<br><em>LINE</em>');
    const tabs = { resume: x.resume, missions: x.missions, progress: x.progress, settings: x.settings };
    document.querySelectorAll('#pauseMenu [data-tab]').forEach(button => { const value = tabs[button.dataset.tab]; if (value) button.textContent = value; });
    text('#returnTitle', x.restart);

    text('#finish .eyebrow', x.completeEyebrow); const finishH2 = document.querySelector('#finish h2'); if (finishH2) finishH2.innerHTML = x.completeTitle.replace('RESTORED.', '<br><em>RESTORED.</em>').replace('OBNOVLJENA.', '<br><em>OBNOVLJENA.</em>').replace('ОБНОВЉЕНА.', '<br><em>ОБНОВЉЕНА.</em>');
    text('#finish .reward span', x.xp); text('#again', x.nextRun + ' →'); text('#nextMission', x.nextMission); text('#finishTitle', x.returnBrief);
    text('#gameOver .eyebrow', x.gameOverEyebrow); const failH2 = document.querySelector('#gameOver h2'); if (failH2) failH2.innerHTML = x.gameOverTitle.replace('INTERRUPTED.', '<br><em>INTERRUPTED.</em>').replace('PREKINUTA.', '<br><em>PREKINUTA.</em>').replace('ПРЕКИНУТА.', '<br><em>ПРЕКИНУТА.</em>'); text('#retry', x.retry); text('#failTitle', x.returnBrief);
    const rotate = document.querySelector('.rotate-prompt'); if (rotate) { const p = rotate.querySelector('p'); if (p) p.innerHTML = `${x.rotate}<br><small>${x.rotateSub}</small>`; text('.rotate-prompt button', x.rotateContinue); }
    document.querySelector('.hud-progress small')?.replaceChildren(document.createTextNode(x.signals));

    translateCoreSettings();
    decorateOptionsPanel();
    applyUiClasses();
  }

  function translateCoreSettings() {
    const x = current();
    const map = new Map([
      ['Music volume', x.musicVolume], ['SFX volume', x.sfxVolume], ['Screen shake', x.screenShake], ['Reduced motion', x.reducedMotion], ['Atmospheric rain', x.atmosphericRain], ['Game audio', x.gameAudio], ['REPLAY FIRST-TIME TUTORIAL', x.replayTutorial], ['CONTROLS', x.controls]
    ]);
    document.querySelectorAll('#titlePanelContent .settings .setting > span:first-child, #titlePanelContent .settings .controls-card > small, #replayTutorial').forEach(element => {
      const raw = element.firstChild?.nodeType === Node.TEXT_NODE ? element.firstChild.textContent.trim() : element.textContent.trim();
      for (const [source, target] of map) { if (raw.startsWith(source)) { if (element.firstChild?.nodeType === Node.TEXT_NODE) element.firstChild.textContent = target + (raw.length > source.length ? raw.slice(source.length) : ''); else element.textContent = target; break; } }
    });
  }

  function applyUiClasses() {
    const ui = readUi();
    document.body.classList.toggle('relay-low-effects', !!ui.lowEffects);
    document.body.classList.toggle('relay-high-contrast', !!ui.highContrast);
    document.body.classList.toggle('relay-hide-key-hints', !ui.keyHints);
    document.body.classList.toggle('relay-focus-mode', !!ui.focusMode);
    document.body.classList.toggle('relay-no-glow', !ui.glow);
  }

  function setUi(key, value) { const ui = readUi(); ui[key] = value; saveUi(ui); applyUiClasses(); decorateOptionsPanel(); }

  function playTestSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return;
      const ctx = new AudioContext(); const gain = ctx.createGain(); const osc = ctx.createOscillator();
      gain.gain.value = .035; osc.type = 'triangle'; osc.frequency.value = 660; osc.connect(gain).connect(ctx.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .18); osc.stop(ctx.currentTime + .2);
    } catch { /* audio is optional */ }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* Browser may deny fullscreen. */ }
    decorateOptionsPanel();
  }

  function buttonState(key, fallback = false) { return !!readUi()[key] === true ? true : fallback; }

  function decorateOptionsPanel() {
    const content = document.getElementById('titlePanelContent'); if (!content) return;
    const host = content.querySelector('.settings');
    if (!host || content.querySelector('.relay-options-extra')) return;
    const ui = readUi(); const x = current();
    const isFullscreen = !!document.fullscreenElement;
    const toggleCard = (key, title, subtitle, active) => `<article class="relay-option-card"><div class="relay-option-row"><div class="relay-option-copy"><strong>${title}</strong><small>${subtitle}</small></div><button type="button" class="relay-option-button ${active ? 'is-on' : ''}" data-relay-ui-toggle="${key}" aria-pressed="${active}">${active ? x.on : x.off}</button></div></article>`;
    const extra = document.createElement('section'); extra.className = 'relay-options-extra';
    extra.innerHTML = `<header><p>${x.menuOptions}</p><small>${x.menuOptionsSub}</small></header><div class="relay-option-grid"><article class="relay-option-card relay-option-card--wide"><div class="relay-option-row"><div class="relay-option-copy"><strong>${x.language}</strong><small>${x.languageSub}</small></div><select class="relay-select" data-relay-language>${LANGUAGES.map(lang => `<option value="${lang}" ${lang === getLanguage() ? 'selected' : ''}>${labels[lang]}</option>`).join('')}</select></div></article><article class="relay-option-card"><div class="relay-option-row"><div class="relay-option-copy"><strong>${x.fullscreen}</strong><small>${x.fullscreenSub}</small></div><button type="button" class="relay-option-button" data-relay-fullscreen>${isFullscreen ? x.fullscreenOn : x.fullscreenOff}</button></div></article>${toggleCard('lowEffects', x.lowEffects, x.lowEffectsSub, ui.lowEffects)}${toggleCard('highContrast', x.highContrast, x.highContrastSub, ui.highContrast)}${toggleCard('keyHints', x.keyHints, x.keyHintsSub, ui.keyHints)}${toggleCard('focusMode', x.focusMode, x.focusModeSub, ui.focusMode)}${toggleCard('glow', x.glow, x.glowSub, ui.glow)}<article class="relay-option-card"><div class="relay-option-row"><div class="relay-option-copy"><strong>${x.testSound}</strong><small>${x.testSoundSub}</small></div><button type="button" class="relay-option-button" data-relay-test-sound>${x.soundTest}</button></div></article><article class="relay-option-card relay-option-card--wide"><div class="relay-option-actions"><button type="button" class="relay-option-button relay-reset" data-relay-reset-ui>${x.resetUi}</button><button type="button" class="relay-option-button" data-relay-close-options>${x.close}</button></div><small style="display:block;margin-top:6px;color:#829aa7;font:700 7px/1.4 'DM Mono',monospace">${x.resetSub}</small></article></div>`;
    content.appendChild(extra);

    extra.querySelector('[data-relay-language]').addEventListener('change', event => setLanguage(event.target.value));
    extra.querySelector('[data-relay-fullscreen]').addEventListener('click', toggleFullscreen);
    extra.querySelectorAll('[data-relay-ui-toggle]').forEach(button => button.addEventListener('click', () => setUi(button.dataset.relayUiToggle, !readUi()[button.dataset.relayUiToggle])));
    extra.querySelector('[data-relay-test-sound]').addEventListener('click', playTestSound);
    extra.querySelector('[data-relay-reset-ui]').addEventListener('click', () => {
      if (!window.confirm(current().resetConfirm)) return;
      localStorage.removeItem(LANG_KEY); localStorage.removeItem(UI_KEY); applyLanguage();
    });
    extra.querySelector('[data-relay-close-options]').addEventListener('click', () => document.getElementById('closeTitlePanel')?.click());
  }

  function watchTitlePanel() {
    const panel = document.getElementById('titlePanel'); if (!panel) return;
    const observer = new MutationObserver(() => { translateCoreSettings(); decorateOptionsPanel(); });
    observer.observe(panel, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    document.addEventListener('click', event => {
      const optionsButton = event.target.closest('#intro [data-title-panel="controls"]');
      if (optionsButton) window.setTimeout(() => { decorateOptionsPanel(); translateCoreSettings(); applyLanguage(); }, 0);
    });
    document.addEventListener('fullscreenchange', decorateOptionsPanel);
  }

  function boot() {
    injectLanguageBar();
    applyLanguage();
    watchTitlePanel();
    window.addEventListener('pageshow', applyLanguage);
    window.addEventListener('orientationchange', applyLanguage);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
