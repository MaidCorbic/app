import './i18n-extra-v1.css';

(() => {
  const LANG_KEY = 'relay.runner.language';
  const EXTRA = {
    de: {
      name: 'DEUTSCH',
      homeEyebrow: 'EIN SPIEL ÜBER DACHLIEFERUNGEN', tagline: 'Laufe durch die schlafende Stadt. Bringe das Signal weiter als alle vor dir.', play: 'SPIELEN', cont: 'FORTSETZEN', options: 'OPTIONEN', optionsSub: 'EINSTELLUNGEN & STEUERUNG', exit: 'BEENDEN', exitSub: 'SITZUNG SCHLIESSEN', faq: 'FAQ', latest: 'AKTUELLES UPDATE',
      pauseEyebrow: 'KURIER-TERMINAL', pauseTitle: 'HALTE DIE LEITUNG OFFEN.', resume: 'FORTSETZEN', missions: 'MISSIONEN', progress: 'FORTSCHRITT', settings: 'EINSTELLUNGEN', restart: 'ZURÜCK ZUM BRIEFING',
      completeEyebrow: 'LIEFERUNG ABGESCHLOSSEN', completeTitle: 'LEITUNG WIEDERHERGESTELLT.', nextRun: 'NÄCHSTER LAUF', nextMission: 'NÄCHSTE MISSION', returnBrief: 'ZURÜCK ZUM BRIEFING', gameOverEyebrow: 'SIGNAL VERLOREN', gameOverTitle: 'LAUF UNTERBROCHEN.', retry: 'ERNEUT VERSUCHEN',
      rotate: 'BILDSCHIRM DREHEN', rotateSub: 'Querformat bietet die beste Sicht und volle Steuerung.', rotateContinue: 'FORTSETZEN', signals: 'SIGNALE', xp: 'XP ERHALTEN', musicVolume: 'Musiklautstärke', sfxVolume: 'SFX-Lautstärke', screenShake: 'Bildschirmwackeln', reducedMotion: 'Weniger Bewegung', atmosphericRain: 'Atmosphärischer Regen', gameAudio: 'Spielton', replayTutorial: 'ERSTES TUTORIAL ERNEUT SPIELEN', controls: 'STEUERUNG', on: 'AN', off: 'AUS', fullscreen: 'VOLLBILD', menuOptions: 'RELAY OPTIONEN', menuOptionsSub: 'ZUSÄTZLICHE KONTROLLSYSTEME', lowEffects: 'WENIGER EFFEKTE', lowEffectsSub: 'Menübewegungen und Hintergrundanimationen reduzieren.', highContrast: 'HOHER KONTRAST', highContrastSub: 'Wichtige UI-Texte stärker hervorheben.', keyHints: 'TASTENHINWEISE', keyHintsSub: 'Tastaturhinweise während des Spiels anzeigen.', focusMode: 'FOKUS-MODUS', focusModeSub: 'Sekundäre Elemente abdunkeln.', glow: 'GLOW FX', glowSub: 'Cyber-Glühen und Texteffekte aktivieren.', testSound: 'SFX TESTEN', testSoundSub: 'Kurzen Bestätigungston abspielen.', language: 'SPRACHE', languageSub: 'Menü- und Systemsprache sofort ändern.', resetUi: 'UI-EINSTELLUNGEN ZURÜCKSETZEN', resetSub: 'Sprache und visuelle Einstellungen zurücksetzen.'
    },
    es: {
      name: 'ESPAÑOL',
      homeEyebrow: 'JUEGO DE ENTREGAS POR LOS TEJADOS', tagline: 'Corre por la ciudad dormida. Lleva la señal más lejos que nadie.', play: 'JUGAR', cont: 'CONTINUAR', options: 'OPCIONES', optionsSub: 'AJUSTES Y CONTROLES', exit: 'SALIR', exitSub: 'CERRAR SESIÓN', faq: 'FAQ', latest: 'ÚLTIMA ACTUALIZACIÓN',
      pauseEyebrow: 'TERMINAL DEL MENSAJERO', pauseTitle: 'MANTÉN LA LÍNEA ABIERTA.', resume: 'CONTINUAR', missions: 'MISIONES', progress: 'PROGRESO', settings: 'AJUSTES', restart: 'VOLVER AL BRIEFING',
      completeEyebrow: 'ENTREGA COMPLETADA', completeTitle: 'LÍNEA RESTAURADA.', nextRun: 'SIGUIENTE RUN', nextMission: 'SIGUIENTE MISIÓN', returnBrief: 'VOLVER AL BRIEFING', gameOverEyebrow: 'SEÑAL PERDIDA', gameOverTitle: 'RUN INTERRUMPIDA.', retry: 'REINTENTAR',
      rotate: 'GIRA LA PANTALLA', rotateSub: 'El modo horizontal ofrece la vista más clara y todos los controles.', rotateContinue: 'CONTINUAR', signals: 'SEÑALES', xp: 'XP OBTENIDA', musicVolume: 'Volumen de música', sfxVolume: 'Volumen SFX', screenShake: 'Sacudida de pantalla', reducedMotion: 'Movimiento reducido', atmosphericRain: 'Lluvia ambiental', gameAudio: 'Audio del juego', replayTutorial: 'REPETIR TUTORIAL INICIAL', controls: 'CONTROLES', on: 'ACT', off: 'DES', fullscreen: 'PANTALLA COMPLETA', menuOptions: 'OPCIONES RELAY', menuOptionsSub: 'SISTEMAS DE CONTROL EXTRA', lowEffects: 'MENOS EFECTOS', lowEffectsSub: 'Reducir movimiento del menú y animaciones de fondo.', highContrast: 'ALTO CONTRASTE', highContrastSub: 'Aumentar el contraste del texto importante.', keyHints: 'AYUDAS DE TECLAS', keyHintsSub: 'Mostrar atajos de teclado durante la partida.', focusMode: 'MODO ENFOQUE', focusModeSub: 'Atenuar elementos secundarios.', glow: 'GLOW FX', glowSub: 'Mantener brillo cyber y efectos de texto.', testSound: 'PROBAR SFX', testSoundSub: 'Reproducir un tono corto.', language: 'IDIOMA', languageSub: 'Cambiar al instante el idioma del menú y del sistema.', resetUi: 'RESTABLECER UI', resetSub: 'Restaurar idioma y preferencias visuales.'
    },
    fr: {
      name: 'FRANÇAIS',
      homeEyebrow: 'JEU DE LIVRAISON SUR LES TOITS', tagline: 'Cours dans la ville endormie. Porte le signal plus loin que quiconque.', play: 'JOUER', cont: 'CONTINUER', options: 'OPTIONS', optionsSub: 'RÉGLAGES & COMMANDES', exit: 'QUITTER', exitSub: 'FERMER LA SESSION', faq: 'FAQ', latest: 'DERNIÈRE MISE À JOUR',
      pauseEyebrow: 'TERMINAL DU COURSIER', pauseTitle: 'GARDE LA LIGNE OUVERTE.', resume: 'REPRENDRE', missions: 'MISSIONS', progress: 'PROGRESSION', settings: 'RÉGLAGES', restart: 'RETOUR AU BRIEFING',
      completeEyebrow: 'LIVRAISON TERMINÉE', completeTitle: 'LIGNE RESTAURÉE.', nextRun: 'PROCHAINE RUN', nextMission: 'PROCHAINE MISSION', returnBrief: 'RETOUR AU BRIEFING', gameOverEyebrow: 'SIGNAL PERDU', gameOverTitle: 'RUN INTERROMPUE.', retry: 'RÉESSAYER',
      rotate: 'PIVOTEZ L’ÉCRAN', rotateSub: 'Le mode paysage offre la meilleure vue et tous les contrôles.', rotateContinue: 'CONTINUER', signals: 'SIGNAUX', xp: 'XP GAGNÉE', musicVolume: 'Volume musique', sfxVolume: 'Volume SFX', screenShake: 'Tremblement écran', reducedMotion: 'Mouvements réduits', atmosphericRain: 'Pluie atmosphérique', gameAudio: 'Audio du jeu', replayTutorial: 'REJOUER LE TUTORIEL INITIAL', controls: 'COMMANDES', on: 'ON', off: 'OFF', fullscreen: 'PLEIN ÉCRAN', menuOptions: 'OPTIONS RELAY', menuOptionsSub: 'SYSTÈMES DE CONTRÔLE SUPPLÉMENTAIRES', lowEffects: 'MOINS D’EFFETS', lowEffectsSub: 'Réduire les animations du menu et du fond.', highContrast: 'CONTRASTE ÉLEVÉ', highContrastSub: 'Renforcer le contraste des textes importants.', keyHints: 'AIDES DE TOUCHES', keyHintsSub: 'Afficher les raccourcis clavier en jeu.', focusMode: 'MODE FOCUS', focusModeSub: 'Atténuer les éléments secondaires.', glow: 'GLOW FX', glowSub: 'Conserver le glow cyber et les effets de texte.', testSound: 'TEST SFX', testSoundSub: 'Jouer un court son de confirmation.', language: 'LANGUE', languageSub: 'Changer instantanément la langue du menu et du système.', resetUi: 'RÉINITIALISER L’UI', resetSub: 'Restaurer la langue et les préférences visuelles.'
    },
    it: {
      name: 'ITALIANO',
      homeEyebrow: 'GIOCO DI CONSEGNE SUI TETTI', tagline: 'Corri nella città addormentata. Porta il segnale più lontano di chiunque.', play: 'GIOCA', cont: 'CONTINUA', options: 'OPZIONI', optionsSub: 'IMPOSTAZIONI E COMANDI', exit: 'ESCI', exitSub: 'CHIUDI SESSIONE', faq: 'FAQ', latest: 'ULTIMO AGGIORNAMENTO',
      pauseEyebrow: 'TERMINALE DEL CORRIERE', pauseTitle: 'TIENI APERTA LA LINEA.', resume: 'RIPRENDI', missions: 'MISSIONI', progress: 'PROGRESSI', settings: 'IMPOSTAZIONI', restart: 'TORNA AL BRIEFING',
      completeEyebrow: 'CONSEGNA COMPLETATA', completeTitle: 'LINEA RIPRISTINATA.', nextRun: 'PROSSIMA RUN', nextMission: 'PROSSIMA MISSIONE', returnBrief: 'TORNA AL BRIEFING', gameOverEyebrow: 'SEGNALE PERSO', gameOverTitle: 'RUN INTERROTTA.', retry: 'RIPROVA',
      rotate: 'RUOTA LO SCHERMO', rotateSub: 'Il formato orizzontale offre la vista migliore e tutti i comandi.', rotateContinue: 'CONTINUA', signals: 'SEGNALI', xp: 'XP GUADAGNATA', musicVolume: 'Volume musica', sfxVolume: 'Volume SFX', screenShake: 'Scuotimento schermo', reducedMotion: 'Movimento ridotto', atmosphericRain: 'Pioggia atmosferica', gameAudio: 'Audio di gioco', replayTutorial: 'RIPETI TUTORIAL INIZIALE', controls: 'COMANDI', on: 'ON', off: 'OFF', fullscreen: 'SCHERMO INTERO', menuOptions: 'OPZIONI RELAY', menuOptionsSub: 'SISTEMI DI CONTROLLO EXTRA', lowEffects: 'MENO EFFETTI', lowEffectsSub: 'Riduci animazioni del menu e dello sfondo.', highContrast: 'ALTO CONTRASTO', highContrastSub: 'Aumenta il contrasto del testo importante.', keyHints: 'SUGGERIMENTI TASTI', keyHintsSub: 'Mostra le scorciatoie durante il gioco.', focusMode: 'MODALITÀ FOCUS', focusModeSub: 'Attenua gli elementi secondari.', glow: 'GLOW FX', glowSub: 'Mantieni bagliore cyber ed effetti di testo.', testSound: 'TEST SFX', testSoundSub: 'Riproduci un breve tono di conferma.', language: 'LINGUA', languageSub: 'Cambia subito la lingua del menu e del sistema.', resetUi: 'RESET UI', resetSub: 'Ripristina lingua e preferenze visive.'
    },
    sl: {
      name: 'SLOVENŠČINA',
      homeEyebrow: 'IGRA DOSTAVE PO STREHAH', tagline: 'Teči skozi speče mesto. Prenesi signal dlje kot kdorkoli prej.', play: 'IGRAJ', cont: 'NADALJUJ', options: 'MOŽNOSTI', optionsSub: 'NASTAVITVE IN KONTROLE', exit: 'IZHOD', exitSub: 'ZAPRI SEJO', faq: 'FAQ', latest: 'ZADNJA POSODOBITEV',
      pauseEyebrow: 'KURIRSKI TERMINAL', pauseTitle: 'OHRANI POVEZAVO ODPRTO.', resume: 'NADALJUJ', missions: 'MISIJE', progress: 'NAPREDEK', settings: 'NASTAVITVE', restart: 'NAZAJ NA UVOD',
      completeEyebrow: 'DOSTAVA KONČANA', completeTitle: 'POVEZAVA OBNOVLJENA.', nextRun: 'NASLEDNJI TEK', nextMission: 'NASLEDNJA MISIJA', returnBrief: 'NAZAJ NA UVOD', gameOverEyebrow: 'SIGNAL IZGUBLJEN', gameOverTitle: 'TEK PREKINJEN.', retry: 'POSKUSI ZNOVA',
      rotate: 'OBRNI ZASLON', rotateSub: 'Ležeči način ponuja najboljši pogled in vse kontrole.', rotateContinue: 'NADALJUJ', signals: 'SIGNALI', xp: 'PRIDOBLJEN XP', musicVolume: 'Glasnost glasbe', sfxVolume: 'Glasnost SFX', screenShake: 'Tresenje zaslona', reducedMotion: 'Zmanjšano gibanje', atmosphericRain: 'Atmosferski dež', gameAudio: 'Zvok igre', replayTutorial: 'PONOVI ZAČETNI VODNIK', controls: 'KONTROLE', on: 'VKLOP', off: 'IZKLOP', fullscreen: 'CELOTEN ZASLON', menuOptions: 'RELAY MOŽNOSTI', menuOptionsSub: 'DODATNI SISTEMI KONTROLE', lowEffects: 'MANJ UČINKOV', lowEffectsSub: 'Zmanjšaj animacije menija in ozadja.', highContrast: 'VISOK KONTRAST', highContrastSub: 'Povečaj kontrast pomembnega besedila.', keyHints: 'NAMIGI TIPK', keyHintsSub: 'Prikaži bližnjice med igro.', focusMode: 'NAČIN FOKUSA', focusModeSub: 'Zatemni sekundarne elemente.', glow: 'GLOW FX', glowSub: 'Ohrani cyber sijaj in učinke besedila.', testSound: 'PREIZKUS SFX', testSoundSub: 'Predvajaj kratek potrditveni zvok.', language: 'JEZIK', languageSub: 'Takoj spremeni jezik menija in sistema.', resetUi: 'PONASTAVI UI', resetSub: 'Obnovi jezik in vizualne nastavitve.'
    },
    mk: {
      name: 'МАКЕДОНСКИ',
      homeEyebrow: 'ИГРА ЗА ДОСТАВА НИЗ ПОКРИВИ', tagline: 'Трчај низ заспаниот град. Пренеси го сигналот подалеку од сите.', play: 'ИГРАЈ', cont: 'ПРОДОЛЖИ', options: 'ОПЦИИ', optionsSub: 'ПОСТАВКИ И КОНТРОЛИ', exit: 'ИЗЛЕЗ', exitSub: 'ЗАТВОРИ СЕСИЈА', faq: 'FAQ', latest: 'НАЈНОВО АЖУРИРАЊЕ',
      pauseEyebrow: 'КУРИРСКИ ТЕРМИНАЛ', pauseTitle: 'ОДРЖИ ЈА ЛИНИЈАТА ОТВОРЕНА.', resume: 'ПРОДОЛЖИ', missions: 'МИСИИ', progress: 'НАПРЕДОК', settings: 'ПОСТАВКИ', restart: 'НАЗАД КОН БРИФИНГОТ',
      completeEyebrow: 'ИСПОРАКАТА Е ЗАВРШЕНА', completeTitle: 'ЛИНИЈАТА Е ВРАТЕНА.', nextRun: 'СЛЕДЕН ТЕК', nextMission: 'СЛЕДНА МИСИЈА', returnBrief: 'НАЗАД КОН БРИФИНГОТ', gameOverEyebrow: 'СИГНАЛОТ Е ИЗГУБЕН', gameOverTitle: 'ТЕКОТ Е ПРЕКИНАТ.', retry: 'ОБИДИ СЕ ПОВТОРНО',
      rotate: 'ЗАВРТИ ГО ЕКРАНОТ', rotateSub: 'Хоризонталниот приказ нуди најдобар поглед и целосни контроли.', rotateContinue: 'ПРОДОЛЖИ', signals: 'СИГНАЛИ', xp: 'ДОБИЕН XP', musicVolume: 'Јачина на музика', sfxVolume: 'Јачина на SFX', screenShake: 'Тресење на екран', reducedMotion: 'Намалено движење', atmosphericRain: 'Атмосферски дожд', gameAudio: 'Звук на играта', replayTutorial: 'ПОВТОРИ ГО ВОВЕДНИОТ ТУТОРИЈАЛ', controls: 'КОНТРОЛИ', on: 'ВКЛ', off: 'ИСКЛ', fullscreen: 'ЦЕЛ ЕКРАН', menuOptions: 'RELAY ОПЦИИ', menuOptionsSub: 'ДОПОЛНИТЕЛНИ КОНТРОЛНИ СИСТЕМИ', lowEffects: 'ПОМИЛКУ ЕФЕКТИ', lowEffectsSub: 'Намали ги анимациите на менито и заднината.', highContrast: 'ВИСОК КОНТРАСТ', highContrastSub: 'Зголеми го контрастот на важниот текст.', keyHints: 'КРАТЕНКИ', keyHintsSub: 'Прикажи кратенки во текот на играта.', focusMode: 'ФОКУС МОД', focusModeSub: 'Затемни ги споредните елементи.', glow: 'GLOW FX', glowSub: 'Задржи го cyber сјајот и текстуалните ефекти.', testSound: 'ТЕСТ SFX', testSoundSub: 'Пушти краток звук за потврда.', language: 'ЈАЗИК', languageSub: 'Веднаш промени го јазикот на менито и системот.', resetUi: 'РЕСЕТИРАЈ UI', resetSub: 'Врати ги јазикот и визуелните поставки.'
    }
  };

  const labels = Object.fromEntries(Object.entries(EXTRA).map(([key, value]) => [key, value.name]));
  const supported = new Set(Object.keys(EXTRA));

  const currentLanguage = () => localStorage.getItem(LANG_KEY) || 'en';
  const selectedExtra = () => EXTRA[currentLanguage()] || null;

  function installFavicon() {
    let link = document.querySelector('link[data-relay-favicon]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; link.type = 'image/svg+xml'; link.dataset.relayFavicon = 'true'; document.head.appendChild(link); }
    link.href = './favicon.svg';
  }

  function setTitle(lang) {
    const name = labels[lang] || 'ENGLISH';
    document.title = `Relay Runner // Night Shift · ${name}`;
  }

  function translateExtra(lang) {
    const x = EXTRA[lang];
    if (!x) return;
    const text = (selector, value) => { const el = document.querySelector(selector); if (el && value) el.textContent = value; };
    document.documentElement.lang = lang;
    setTitle(lang);
    text('#intro .title-lockup .eyebrow', x.homeEyebrow); text('#intro .menu-tagline', x.tagline); text('#intro #start span', x.play); text('#intro #continue', x.cont + ' →'); text('#intro [data-title-panel="controls"] span', x.options); text('#intro [data-title-panel="controls"] small', x.optionsSub); text('#intro #exitTitle span', x.exit); text('#intro #exitTitle small', x.exitSub); text('#intro .faq-launcher', x.faq);
    text('#pauseMenu aside .eyebrow', x.pauseEyebrow); const ph = document.querySelector('#pauseMenu aside h2'); if (ph) ph.innerHTML = x.pauseTitle.replace('LINE', '<br><em>LINE</em>');
    const tabs = { resume: x.resume, missions: x.missions, progress: x.progress, settings: x.settings }; document.querySelectorAll('#pauseMenu [data-tab]').forEach(btn => { if (tabs[btn.dataset.tab]) btn.textContent = tabs[btn.dataset.tab]; }); text('#returnTitle', x.restart);
    text('#finish .eyebrow', x.completeEyebrow); text('#finish .reward span', x.xp); text('#again', x.nextRun + ' →'); text('#nextMission', x.nextMission); text('#finishTitle', x.returnBrief); text('#gameOver .eyebrow', x.gameOverEyebrow); text('#retry', x.retry); text('#failTitle', x.returnBrief); const rotate = document.querySelector('.rotate-prompt'); if (rotate) { const p = rotate.querySelector('p'); if (p) p.innerHTML = `${x.rotate}<br><small>${x.rotateSub}</small>`; text('.rotate-prompt button', x.rotateContinue); } text('.hud-progress small', x.signals);
    const settingsMap = new Map([['Music volume', x.musicVolume], ['SFX volume', x.sfxVolume], ['Screen shake', x.screenShake], ['Reduced motion', x.reducedMotion], ['Atmospheric rain', x.atmosphericRain], ['Game audio', x.gameAudio], ['REPLAY FIRST-TIME TUTORIAL', x.replayTutorial], ['CONTROLS', x.controls]]);
    document.querySelectorAll('#titlePanelContent .settings .setting > span:first-child, #titlePanelContent .settings .controls-card > small, #replayTutorial').forEach(el => { const raw = el.textContent.trim(); for (const [from, to] of settingsMap) if (raw.startsWith(from)) { el.firstChild.textContent = to + (raw.length > from.length ? raw.slice(from.length) : ''); break; } });
    const extra = document.querySelector('.relay-options-extra'); if (extra) { extra.querySelector('header p').textContent = x.menuOptions; extra.querySelector('header small').textContent = x.menuOptionsSub; const langCopy = extra.querySelector('[data-relay-language]')?.closest('.relay-option-row'); if (langCopy) { const strong = langCopy.querySelector('.relay-option-copy strong'); const small = langCopy.querySelector('.relay-option-copy small'); if (strong) strong.textContent = x.language; if (small) small.textContent = x.languageSub; } const map = { fullscreen: x.fullscreen, lowEffects: x.lowEffects, highContrast: x.highContrast, keyHints: x.keyHints, focusMode: x.focusMode, glow: x.glow, testSound: x.testSound, resetUi: x.resetUi }; Object.entries(map).forEach(([key, value]) => { const node = extra.querySelector(`[data-relay-ui-toggle="${key}"]`)?.closest('.relay-option-row') || (key === 'testSound' ? extra.querySelector('[data-relay-test-sound]')?.closest('.relay-option-row') : null); node?.querySelector('.relay-option-copy strong')?.replaceChildren(document.createTextNode(value)); }); }
  }

  function extraLanguageValue() { const lang = currentLanguage(); return supported.has(lang) ? lang : null; }

  function ensureLanguageControls() {
    const bar = document.getElementById('relayLanguageBar');
    if (bar) {
      Object.entries(labels).forEach(([lang, label]) => {
        if (!bar.querySelector(`[data-extra-relay-lang="${lang}"]`)) { const button = document.createElement('button'); button.type = 'button'; button.dataset.extraRelayLang = lang; button.textContent = lang.toUpperCase(); bar.appendChild(button); button.addEventListener('click', () => selectLanguage(lang)); }
      });
    }
    const select = document.querySelector('#titlePanelContent [data-relay-language]');
    if (select) Object.entries(labels).forEach(([lang, label]) => { if (!select.querySelector(`option[value="${lang}"]`)) { const option = document.createElement('option'); option.value = lang; option.textContent = label; select.appendChild(option); } });
    document.querySelectorAll('#titlePanelContent [data-relay-language] option').forEach(option => { option.selected = option.value === currentLanguage(); });
  }

  function selectLanguage(lang) { if (!supported.has(lang)) return; localStorage.setItem(LANG_KEY, lang); ensureLanguageControls(); translateExtra(lang); }

  function observe() {
    const observer = new MutationObserver(() => {
      ensureLanguageControls();
      const lang = extraLanguageValue();
      if (lang) window.requestAnimationFrame(() => translateExtra(lang));
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    document.addEventListener('change', event => { const select = event.target.closest('[data-relay-language]'); if (select && supported.has(select.value)) selectLanguage(select.value); });
  }

  function boot() {
    installFavicon();
    const lang = extraLanguageValue(); if (lang) translateExtra(lang); else setTitle(currentLanguage());
    ensureLanguageControls();
    observe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
