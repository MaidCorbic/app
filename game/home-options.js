import './splash-loader.js';
import { loadState, saveState } from './src/state.js';

(function () {
  if (window.__relayHomeOptionsFinal) return;
  window.__relayHomeOptionsFinal = true;

  var LANGUAGES = [['en','ENGLISH'],['exyu','EX-YU'],['es','ESPAÑOL'],['de','DEUTSCH']];
  var LANGUAGE_KEY = 'relay-runner-language';
  var getState = function () { return loadState(); };
  var savePatch = function (patch) { saveState(Object.assign({}, getState(), patch)); };
  var getLanguage = function () { return localStorage.getItem(LANGUAGE_KEY) || 'en'; };
  var setLanguage = function (code) {
    localStorage.setItem(LANGUAGE_KEY, code);
    document.documentElement.lang = code === 'exyu' ? 'bs' : code;
    document.documentElement.dataset.language = code;
    window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { code: code } }));
  };

  var style = document.createElement('style');
  style.textContent = `
    #homeV3Launch{margin-top:14px!important;margin-bottom:5px!important;min-height:40px!important;position:relative!important;z-index:2!important}
    #homeV3Deck{margin-top:8px!important;margin-bottom:8px!important}
    #titlePanel{box-sizing:border-box!important;padding:clamp(8px,2vw,24px)!important;overflow:hidden!important;background:rgba(1,5,12,.78)!important;backdrop-filter:blur(14px)!important}
    #titlePanel .title-panel-card{box-sizing:border-box!important;width:min(760px,92vw)!important;max-width:100%!important;max-height:calc(100dvh - 24px)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;padding:0!important;border:1px solid rgba(255,208,110,.24)!important;border-radius:16px!important;background:linear-gradient(145deg,#081523f7,#020811f9 72%)!important;box-shadow:0 30px 100px #000d,0 0 45px #ffd06e12!important}
    #titlePanel .title-panel-close{width:42px!important;height:42px!important;top:14px!important;right:14px!important;z-index:5!important;border:1px solid #65798d!important;border-radius:8px!important;background:#06111df2!important;color:#edf4f8!important;font-size:23px!important}
    #titlePanelEyebrow{margin:0!important;padding:22px 24px 0!important;color:#7ed8ff!important;font:800 8px/1 'DM Mono',monospace!important;letter-spacing:2.2px!important}
    #titlePanelHeading{margin:6px 76px 0 24px!important;color:#f4f7fa!important;font:900 clamp(30px,7vw,48px)/.9 Manrope,sans-serif!important;letter-spacing:-.06em!important}
    #titlePanelHeading:after{content:' // COMMAND TERMINAL';color:#ffd06e;font:800 8px 'DM Mono',monospace;letter-spacing:1.6px;margin-left:8px}
    #titlePanelContent{box-sizing:border-box!important;min-height:0!important;width:100%!important;max-height:calc(100dvh - 145px)!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding:16px 24px 22px!important;scrollbar-width:none!important}
    #titlePanelContent::-webkit-scrollbar{display:none!important}
    .home-options-final{display:grid;gap:10px;width:100%;box-sizing:border-box}
    .home-section{display:flex!important;align-items:center!important;gap:10px!important;margin:10px 2px 2px!important;color:#7c90a4!important;font:800 8px/1 'DM Mono',monospace!important;letter-spacing:1.7px!important}.home-section:after{content:'';height:1px;flex:1;background:linear-gradient(90deg,#40566a55,transparent)}
    .home-opt{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;min-width:0;box-sizing:border-box;padding:12px 13px;border:1px solid rgba(125,153,177,.16);border-radius:10px;background:linear-gradient(145deg,rgba(13,29,47,.92),rgba(4,11,20,.96));box-shadow:inset 0 1px rgba(255,255,255,.045),0 8px 24px rgba(0,0,0,.24);transition:border-color .16s,transform .16s}.home-opt:hover,.home-opt:focus-within{border-color:#ffd06e44;transform:translateY(-1px)}
    .home-opt-copy{min-width:0;overflow:hidden}.home-opt-copy b{display:block;color:#edf4f8;font:900 9px/1.15 'DM Mono',monospace;letter-spacing:.9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.home-opt-copy small{display:block;margin-top:4px;color:#778b9f;font:700 7px/1.45 'DM Mono',monospace;overflow-wrap:anywhere}
    .home-opt button{box-sizing:border-box;min-width:96px;height:36px;padding:0 12px;border:1px solid #61768a66;border-radius:8px;background:linear-gradient(180deg,#0b1a2a,#06101a);color:#dce7ee;font:900 8px 'DM Mono',monospace;letter-spacing:.8px;cursor:pointer;touch-action:manipulation}.home-opt button.is-on{border-color:#68e7be88;color:#68e7be;background:linear-gradient(180deg,#0a211f,#061719)}.home-opt button:hover,.home-opt button:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none}
    .home-range{grid-template-columns:1fr;gap:9px}.home-range .home-opt-copy{display:flex;align-items:end;justify-content:space-between;gap:12px}.home-range input{width:100%!important}.home-range-value{color:#ffd06e!important;font-variant-numeric:tabular-nums}.home-opt input[type=range]{accent-color:#ffd06e;cursor:pointer}
    .home-lang{position:relative}.home-lang-menu{position:absolute;right:0;top:calc(100% + 7px);z-index:50;width:190px;max-width:calc(100vw - 40px);padding:6px;border:1px solid #667c91;background:#07111ffb;border-radius:10px;box-shadow:0 18px 50px #000c}.home-lang-menu.hidden{display:none}.home-lang-menu button{display:block;width:100%;height:36px;border:0;border-radius:6px;background:transparent;color:#c9d5e0;text-align:left;padding:0 10px;font:900 8px 'DM Mono',monospace;cursor:pointer}.home-lang-menu button.active,.home-lang-menu button:hover{background:#ffd06e0d;color:#ffd06e}
    .home-options-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px}.home-options-actions button{height:40px;border:1px solid #5f748866;border-radius:8px;background:#07131ff2;color:#b9c7d3;font:900 8px 'DM Mono',monospace;cursor:pointer}.home-options-actions button:hover{color:#ffd06e;border-color:#ffd06e}.home-controls{padding:13px!important;grid-template-columns:1fr!important}.home-controls small{display:block;color:#8295a8;font:800 7px/1.8 'DM Mono',monospace;overflow-wrap:anywhere}.home-controls b{color:#ffd06e}.home-option-hero{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:13px;border:1px solid #38bdf833;border-radius:11px;background:linear-gradient(135deg,#0a1b2b,#06101b)}.home-option-hero strong{display:block;color:#f4f7fa;font:900 12px Manrope,sans-serif}.home-option-hero small{display:block;margin-top:4px;color:#71869a;font:700 7px/1.5 'DM Mono',monospace}.home-option-hero .status{padding:7px 9px;border:1px solid #68e7be55;border-radius:99px;color:#68e7be;font:900 7px 'DM Mono',monospace}
    @media(max-width:700px){#homeV3Launch{margin-top:14px!important;margin-bottom:5px!important}#homeV3Deck{margin-top:7px!important;margin-bottom:9px!important}#titlePanel{padding:6px!important}#titlePanel .title-panel-card{width:min(94vw,430px)!important;max-height:calc(100dvh - 12px)!important;border-radius:14px!important}#titlePanelEyebrow{padding:17px 16px 0!important;font-size:7px!important}#titlePanelHeading{margin:6px 60px 0 16px!important;font-size:30px!important}#titlePanelHeading:after{display:block;margin:6px 0 0;font-size:7px}.home-options-final{gap:7px}.home-section{font-size:7px;margin-top:8px!important}.home-opt{gap:9px;padding:10px}.home-opt-copy b{font-size:8px}.home-opt-copy small{font-size:6.5px}.home-opt button{width:90px;min-width:90px;height:34px}.home-range{gap:6px}.home-range input{height:28px}.home-options-actions{gap:7px}.home-options-actions button{height:38px}.home-option-hero{padding:11px}.home-option-hero strong{font-size:11px}}
    @media(max-width:380px){#titlePanel .title-panel-card{width:96vw!important}.home-opt{padding:9px}.home-opt button{width:84px;min-width:84px}.home-opt-copy small{font-size:6px}#titlePanelContent{padding-left:11px!important;padding-right:11px!important}}
    body.relay-reduced-motion *,body.relay-reduced-motion *:before,body.relay-reduced-motion *:after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.001ms!important}
    body.relay-screen-shake-disabled [data-screen-shake]{transform:none!important}
    body.relay-rain-disabled .rain,body.relay-rain-disabled [data-rain],body.relay-rain-disabled .rain-layer{display:none!important}
  `;
  document.head.appendChild(style);

  function applyAudio(state) {
    var music = state.musicVolume == null ? .55 : state.musicVolume;
    var sfx = state.sfxVolume == null ? .7 : state.sfxVolume;
    var muted = !!state.muted;
    document.querySelectorAll('audio,video').forEach(function (media) {
      var role = String(media.dataset.audioRole || media.dataset.soundRole || '').toLowerCase();
      media.muted = muted;
      media.volume = role === 'sfx' ? sfx : music;
    });
    var manager = window.__relayRunnerScene && window.__relayRunnerScene.sound;
    if (!manager) return;
    if (typeof manager.setMute === 'function') manager.setMute(muted); else manager.mute = muted;
    if (manager.sounds && manager.sounds.forEach) manager.sounds.forEach(function (sound) {
      var key = String(sound && sound.key || '').toLowerCase();
      var isMusic = /music|bgm|theme|ambient|menu/.test(key);
      if ('volume' in sound) sound.volume = isMusic ? music : sfx;
      if ('mute' in sound) sound.mute = muted;
    });
  }

  function patchScene(scene) {
    if (!scene || scene.__relayOptionsScenePatched) return;
    scene.__relayOptionsScenePatched = true;
    var camera = scene.cameras && scene.cameras.main;
    if (camera && camera.shake) {
      var originalShake = camera.shake.bind(camera);
      camera.shake = function () {
        var state = getState();
        if (state.screenShake === false || state.reducedMotion) return this;
        return originalShake.apply(null, arguments);
      };
      if (scene.events && scene.events.once) scene.events.once('shutdown', function () { camera.shake = originalShake; scene.__relayOptionsScenePatched = false; });
    }
    applyAudio(getState());
  }

  function applyRuntime() {
    var state = getState();
    document.body.classList.toggle('relay-reduced-motion', !!state.reducedMotion);
    document.body.classList.toggle('relay-screen-shake-disabled', state.screenShake === false);
    document.body.classList.toggle('relay-rain-disabled', state.rain === false);
    document.documentElement.dataset.relayAudio = state.muted ? 'muted' : 'on';
    var intro = document.getElementById('intro');
    if (intro) intro.style.setProperty('--atm-rain', state.rain === false ? '0' : '');
    applyAudio(state);
    patchScene(window.__relayRunnerScene);
  }

  if (window.speechSynthesis && window.speechSynthesis.speak && !window.__relaySpeechSettingsPatched) {
    window.__relaySpeechSettingsPatched = true;
    var originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = function (utterance) { if (getState().aiVoice === false) return; originalSpeak(utterance); };
  }

  window.addEventListener('relay-settings-change', applyRuntime);
  window.addEventListener('relay:runner-scene-ready', function (event) { patchScene((event.detail && event.detail.scene) || window.__relayRunnerScene); });
  window.addEventListener('relay-language-change', function (event) { document.documentElement.dataset.language = (event.detail && event.detail.code) || getLanguage(); });
  applyRuntime();

  function option(label, key, on, detail) {
    return '<div class="home-opt"><div class="home-opt-copy"><b>' + label + '</b><small>' + detail + '</small></div><button type="button" data-home-toggle="' + key + '" class="' + (on ? 'is-on' : '') + '" aria-pressed="' + on + '">' + (on ? 'ON' : 'OFF') + '</button></div>';
  }
  function range(label, key, value, detail) {
    return '<label class="home-opt home-range"><span class="home-opt-copy"><span><b>' + label + '</b><small>' + detail + '</small></span><strong class="home-range-value" data-volume-label="' + key + '">' + Math.round(value * 100) + '%</strong></span><input data-home-volume="' + key + '" type="range" min="0" max="1" step=".05" value="' + value + '"></label>';
  }

  function render() {
    var panel = document.getElementById('titlePanel');
    var content = document.getElementById('titlePanelContent');
    var heading = document.getElementById('titlePanelHeading');
    if (!panel || !content || !heading || panel.classList.contains('hidden')) return;
    var title = heading.textContent.trim().toUpperCase();
    if (title.indexOf('RUN SETTINGS') === -1 && title !== 'OPTIONS') return;
    var state = getState();
    var language = LANGUAGES.find(function (item) { return item[0] === getLanguage(); }) || LANGUAGES[0];
    var languageButtons = LANGUAGES.map(function (item) { return '<button type="button" data-language="' + item[0] + '" class="' + (item[0] === language[0] ? 'active' : '') + '">' + item[1] + '</button>'; }).join('');
    content.innerHTML = '<div class="home-options-final">' +
      '<div class="home-option-hero"><div><strong>RELAY CONFIGURATION</strong><small>LIVE SETTINGS · SAVED LOCALLY · APPLIED TO THE RUN</small></div><span class="status">ONLINE</span></div>' +
      '<div class="home-section">GAMEPLAY</div>' +
      option('TUTORIAL GUIDANCE','tutorialEnabled',state.tutorialEnabled !== false,'Controls mission guidance and tutorial prompts') +
      option('SCREEN SHAKE','screenShake',!!state.screenShake,'Enables camera impact feedback') +
      option('ATMOSPHERIC RAIN','rain',!!state.rain,'Enables rain/weather ambience') +
      option('REDUCED MOTION','reducedMotion',!!state.reducedMotion,'Removes camera and interface motion') +
      '<div class="home-section">AUDIO</div>' +
      option('MASTER AUDIO','muted',!state.muted,'Global audio mute switch') +
      range('MUSIC VOLUME','musicVolume',state.musicVolume == null ? .55 : state.musicVolume,'Music / ambient level') +
      range('SFX VOLUME','sfxVolume',state.sfxVolume == null ? .7 : state.sfxVolume,'Gameplay / interface effects') +
      option('AI VOICE','aiVoice',state.aiVoice !== false,'Enables spoken NIA / MARA guidance') +
      '<div class="home-section">PRESENTATION</div>' +
      '<div class="home-opt home-lang"><div class="home-opt-copy"><b>GAME LANGUAGE</b><small>Changes the active interface language</small></div><button type="button" data-home-language>🌐 ' + language[1] + '</button><div class="home-lang-menu hidden" data-home-language-menu>' + languageButtons + '</div></div>' +
      '<div class="home-options-actions"><button type="button" data-home-fullscreen>FULLSCREEN</button><button type="button" data-home-reset>RESET OPTIONS</button></div>' +
      '<div class="home-section">CONTROLS</div><div class="home-opt home-controls"><small><b>MOVE</b> A / D · <b>JUMP</b> SPACE · <b>FIRE</b> E · <b>BLADE</b> Q · <b>DASH</b> SHIFT · <b>PAUSE</b> ESC</small></div>' +
      '</div>';

    content.querySelectorAll('[data-home-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        var key = button.dataset.homeToggle;
        var current = getState();
        var value = key === 'muted' ? !current.muted : !current[key];
        var patch = {}; patch[key] = value; savePatch(patch);
        if (key === 'aiVoice' && !value && window.speechSynthesis) window.speechSynthesis.cancel();
        window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key: key, value: value } }));
        render();
      });
    });
    content.querySelectorAll('[data-home-volume]').forEach(function (input) {
      input.addEventListener('input', function () {
        var key = input.dataset.homeVolume;
        var value = Number(input.value);
        if (!Number.isFinite(value)) return;
        var patch = {}; patch[key] = value; savePatch(patch);
        var label = content.querySelector('[data-volume-label="' + key + '"]');
        if (label) label.textContent = Math.round(value * 100) + '%';
        window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key: key, value: value } }));
      });
    });
    var languageButton = content.querySelector('[data-home-language]');
    if (languageButton) languageButton.addEventListener('click', function (event) { event.stopPropagation(); var menu = content.querySelector('[data-home-language-menu]'); if (menu) menu.classList.toggle('hidden'); });
    content.querySelectorAll('[data-language]').forEach(function (button) { button.addEventListener('click', function () { setLanguage(button.dataset.language); render(); }); });
    var fullscreen = content.querySelector('[data-home-fullscreen]');
    if (fullscreen) fullscreen.addEventListener('click', function () { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {}); else if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {}); });
    var reset = content.querySelector('[data-home-reset]');
    if (reset) reset.addEventListener('click', function () { savePatch({ muted:false,musicVolume:.55,sfxVolume:.7,screenShake:true,reducedMotion:false,rain:true,aiVoice:true,tutorialEnabled:true }); localStorage.removeItem(LANGUAGE_KEY); setLanguage('en'); window.dispatchEvent(new CustomEvent('relay-settings-change',{detail:{reset:true}})); render(); });
  }

  function init() {
    var panel = document.getElementById('titlePanel');
    if (!panel) return;
    document.addEventListener('click', function (event) {
      var button = event.target.closest ? event.target.closest('[data-title-panel="controls"]') : null;
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      panel.classList.remove('hidden');
      var heading = document.getElementById('titlePanelHeading');
      if (heading) heading.textContent = 'OPTIONS';
      render();
    }, true);
    new MutationObserver(function () { window.setTimeout(render, 20); }).observe(panel, { attributes:true, attributeFilter:['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
