(() => {
  if (window.__relayHomeOptionsInstalled) return;
  window.__relayHomeOptionsInstalled = true;

  const LANGUAGES = [
    ['en', 'ENGLISH'],
    ['exyu', 'EX-YU'],
    ['es', 'ESPAÑOL'],
    ['de', 'DEUTSCH']
  ];
  const LANGUAGE_KEY = 'relay-runner-language';
  const getLanguage = () => localStorage.getItem(LANGUAGE_KEY) || 'en';
  const setLanguage = code => {
    localStorage.setItem(LANGUAGE_KEY, code);
    document.documentElement.lang = code === 'exyu' ? 'bs' : code;
    document.documentElement.dataset.language = code;
    window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { code } }));
  };

  const css = document.createElement('style');
  css.textContent = `
    .relay-home-options{display:grid;gap:10px;width:100%;margin-top:2px}
    .relay-option-card{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;width:100%;padding:14px 15px;border:1px solid rgba(217,231,244,.12);border-radius:10px;background:linear-gradient(145deg,rgba(11,23,41,.96),rgba(5,12,24,.96));box-shadow:inset 0 1px rgba(255,255,255,.025),0 10px 28px rgba(0,0,0,.2);overflow:visible;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
    .relay-option-card::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,rgba(255,208,110,.06),transparent 55%);opacity:0;pointer-events:none;transition:opacity .18s ease}
    .relay-option-card:hover{transform:translateY(-1px);border-color:rgba(255,208,110,.32);box-shadow:0 0 0 1px rgba(255,208,110,.05),0 14px 34px rgba(0,0,0,.28)}
    .relay-option-card:hover::before{opacity:1}
    .relay-option-copy{min-width:0;display:grid;gap:4px}
    .relay-option-copy strong{color:#edf4fa;font:800 10px 'DM Mono',monospace;letter-spacing:1px;text-transform:uppercase}
    .relay-option-copy small{color:#718195;font:700 8px/1.45 'DM Mono',monospace;letter-spacing:.45px;text-transform:uppercase}
    .relay-option-control{display:flex;align-items:center;justify-content:flex-end;min-width:108px}
    .relay-toggle{position:relative;width:82px;height:34px;padding:0;border:1px solid rgba(217,231,244,.16);border-radius:999px;background:#07101d;color:#718195;cursor:pointer;font:800 9px 'DM Mono',monospace;letter-spacing:.8px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25);transition:.18s ease}
    .relay-toggle::before{content:"";position:absolute;top:5px;left:5px;width:22px;height:22px;border-radius:50%;background:#718195;box-shadow:0 2px 8px #0008;transition:.18s ease}
    .relay-toggle.is-on{border-color:rgba(255,208,110,.55);color:#ffd06e;background:rgba(255,208,110,.07);box-shadow:0 0 18px rgba(255,208,110,.09)}
    .relay-toggle.is-on::before{left:53px;background:#ffd06e;box-shadow:0 0 14px rgba(255,208,110,.45)}
    .relay-toggle span{display:block;margin-left:17px;transition:.18s ease}.relay-toggle.is-on span{margin-left:-17px}
    .relay-slider{width:118px;accent-color:#ffd06e;cursor:pointer}
    .relay-slider-value{display:block;width:48px;margin-left:8px;color:#ffd06e;text-align:right;font:800 9px 'DM Mono',monospace}
    .relay-slider-wrap{display:flex;align-items:center}
    .relay-language{position:relative;z-index:20}
    .relay-language-button{height:36px;min-width:136px;padding:0 12px;border:1px solid rgba(217,231,244,.16);border-radius:7px;background:linear-gradient(145deg,#0b1729,#07101d);color:#edf4fa;cursor:pointer;font:800 9px 'DM Mono',monospace;letter-spacing:.8px;box-shadow:0 8px 22px #0006;transition:.18s ease}
    .relay-language-button:hover,.relay-language-button:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none;box-shadow:0 0 18px rgba(255,208,110,.13),0 8px 22px #0007}
    .relay-language-menu{position:absolute;right:0;top:calc(100% + 8px);z-index:1000;width:190px;padding:7px;border:1px solid rgba(217,231,244,.16);border-radius:9px;background:rgba(5,12,24,.98);box-shadow:0 18px 50px #000b;backdrop-filter:blur(16px)}
    .relay-language-menu.hidden{display:none}
    .relay-language-option{display:block;width:100%;padding:11px 12px;border:0;border-radius:6px;background:transparent;color:#aebdcc;text-align:left;cursor:pointer;font:800 9px 'DM Mono',monospace;letter-spacing:.7px;transition:.15s ease}
    .relay-language-option:hover,.relay-language-option.active{background:rgba(255,208,110,.08);color:#ffd06e}
    .relay-extra-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:2px}
    .relay-extra{min-height:64px;padding:12px;border:1px solid rgba(217,231,244,.1);border-radius:9px;background:rgba(7,16,29,.72);color:#aebdcc;cursor:pointer;text-align:left;transition:.18s ease}
    .relay-extra:hover{border-color:rgba(255,208,110,.3);transform:translateY(-1px)}
    .relay-extra strong{display:block;color:#edf4fa;font:800 9px 'DM Mono',monospace;letter-spacing:.8px}
    .relay-extra small{display:block;margin-top:5px;color:#627287;font:700 7px/1.4 'DM Mono',monospace}
    .relay-options-status{padding:8px 2px 2px;color:#53657a;font:700 7px 'DM Mono',monospace;letter-spacing:.6px;text-transform:uppercase}
    @media(max-width:600px){
      .relay-option-card{grid-template-columns:1fr;gap:10px;padding:13px}
      .relay-option-control{justify-content:flex-start;min-width:0}
      .relay-language-button{width:100%;min-width:0}
      .relay-language-menu{left:0;right:auto;width:100%}
      .relay-extra-grid{grid-template-columns:1fr}
      .relay-slider{width:min(100%,180px)}
    }
  `;
  document.head.appendChild(css);

  const clickPauseSetting = (setting, desiredOn) => {
    const pause = document.getElementById('pauseMenu');
    const panel = document.getElementById('panelContent');
    const tab = pause?.querySelector('.tab[data-tab="settings"]');
    if (!pause || !panel || !tab) return false;
    tab.click();
    const button = panel.querySelector(`[data-setting="${setting}"]`);
    if (!button) return false;
    const currentOn = button.classList.contains('is-on') || button.getAttribute('aria-pressed') === 'true';
    if (currentOn !== desiredOn) button.click();
    return true;
  };

  const setPauseVolume = (name, value) => {
    const pause = document.getElementById('pauseMenu');
    const panel = document.getElementById('panelContent');
    const tab = pause?.querySelector('.tab[data-tab="settings"]');
    if (!pause || !panel || !tab) return false;
    tab.click();
    const input = panel.querySelector(`[data-volume="${name}"]`);
    if (!input) return false;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  };

  const getPauseState = () => {
    const pause = document.getElementById('pauseMenu');
    const panel = document.getElementById('panelContent');
    const tab = pause?.querySelector('.tab[data-tab="settings"]');
    if (!pause || !panel || !tab) return null;
    tab.click();
    const readToggle = name => panel.querySelector(`[data-setting="${name}"]`)?.classList.contains('is-on') || false;
    const music = Number(panel.querySelector('[data-volume="musicVolume"]')?.value ?? 0.55);
    const sfx = Number(panel.querySelector('[data-volume="sfxVolume"]')?.value ?? 0.7);
    const audioButton = panel.querySelector('[data-setting="muted"]');
    const audioOn = audioButton ? audioButton.getAttribute('aria-pressed') === 'true' : true;
    return { screenShake: readToggle('screenShake'), reducedMotion: readToggle('reducedMotion'), rain: readToggle('rain'), audioOn, music, sfx };
  };

  const makeToggle = (key, label, hint, state, onChange) => {
    const card = document.createElement('div');
    card.className = 'relay-option-card';
    const copy = document.createElement('div'); copy.className = 'relay-option-copy'; copy.innerHTML = `<strong>${label}</strong><small>${hint}</small>`;
    const control = document.createElement('div'); control.className = 'relay-option-control';
    const button = document.createElement('button'); button.type = 'button'; button.className = `relay-toggle${state ? ' is-on' : ''}`; button.dataset.option = key; button.setAttribute('aria-pressed', String(state));
    const text = document.createElement('span'); text.textContent = state ? 'ON' : 'OFF'; button.appendChild(text);
    button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); onChange(!button.classList.contains('is-on')); });
    control.appendChild(button); card.append(copy, control); return card;
  };

  const buildOptions = () => {
    const content = document.getElementById('titlePanelContent');
    if (!content) return;
    const state = getPauseState();
    if (!state) return;
    content.querySelector('.title-settings')?.remove();
    content.querySelector('.relay-home-options')?.remove();

    const root = document.createElement('div'); root.className = 'relay-home-options';
    root.appendChild(makeToggle('audio','GAME AUDIO','Master game sound and feedback.',state.audioOn,on => { clickPauseSetting('muted', !on); window.setTimeout(buildOptions, 0); }));
    root.appendChild(makeToggle('shake','SCREEN SHAKE','Impact camera feedback during gameplay.',state.screenShake,on => { clickPauseSetting('screenShake', on); window.setTimeout(buildOptions, 0); }));
    root.appendChild(makeToggle('motion','REDUCED MOTION','Reduce movement-heavy visual effects.',state.reducedMotion,on => { clickPauseSetting('reducedMotion', on); window.setTimeout(buildOptions, 0); }));
    root.appendChild(makeToggle('rain','ATMOSPHERIC RAIN','Toggle the rooftop weather layer.',state.rain,on => { clickPauseSetting('rain', on); window.setTimeout(buildOptions, 0); }));

    const musicCard = document.createElement('div'); musicCard.className = 'relay-option-card'; musicCard.innerHTML = '<div class="relay-option-copy"><strong>MUSIC VOLUME</strong><small>Ambient soundtrack level.</small></div>';
    const musicControl = document.createElement('div'); musicControl.className = 'relay-option-control relay-slider-wrap';
    const music = document.createElement('input'); music.className = 'relay-slider'; music.type = 'range'; music.min='0'; music.max='1'; music.step='.05'; music.value=state.music;
    const musicValue = document.createElement('b'); musicValue.className='relay-slider-value'; musicValue.textContent=`${Math.round(state.music*100)}%`;
    music.addEventListener('input',()=>{musicValue.textContent=`${Math.round(Number(music.value)*100)}%`;setPauseVolume('musicVolume',Number(music.value));});
    musicControl.append(music,musicValue); musicCard.appendChild(musicControl); root.appendChild(musicCard);

    const sfxCard = document.createElement('div'); sfxCard.className='relay-option-card'; sfxCard.innerHTML='<div class="relay-option-copy"><strong>SFX VOLUME</strong><small>Gameplay and interaction sounds.</small></div>';
    const sfxControl=document.createElement('div');sfxControl.className='relay-option-control relay-slider-wrap';
    const sfx=document.createElement('input');sfx.className='relay-slider';sfx.type='range';sfx.min='0';sfx.max='1';sfx.step='.05';sfx.value=state.sfx;
    const sfxValue=document.createElement('b');sfxValue.className='relay-slider-value';sfxValue.textContent=`${Math.round(state.sfx*100)}%`;
    sfx.addEventListener('input',()=>{sfxValue.textContent=`${Math.round(Number(sfx.value)*100)}%`;setPauseVolume('sfxVolume',Number(sfx.value));});
    sfxControl.append(sfx,sfxValue);sfxCard.appendChild(sfxControl);root.appendChild(sfxCard);

    const languageCard=document.createElement('div');languageCard.className='relay-option-card relay-language';
    const languageCopy=document.createElement('div');languageCopy.className='relay-option-copy';languageCopy.innerHTML='<strong>LANGUAGE</strong><small>Choose the interface language.</small>';
    const languageControl=document.createElement('div');languageControl.className='relay-option-control';const languageWrap=document.createElement('div');languageWrap.className='relay-language';
    const languageButton=document.createElement('button');languageButton.type='button';languageButton.className='relay-language-button';languageButton.setAttribute('aria-haspopup','listbox');
    const languageMenu=document.createElement('div');languageMenu.className='relay-language-menu hidden';languageMenu.setAttribute('role','listbox');
    const refreshLanguage=()=>{const current=LANGUAGES.find(([code])=>code===getLanguage())||LANGUAGES[0];languageButton.textContent=`🌐  ${current[1]}`;languageMenu.querySelectorAll('button').forEach(option=>{const active=option.dataset.lang===current[0];option.classList.toggle('active',active);option.setAttribute('aria-selected',String(active));});};
    LANGUAGES.forEach(([code,name])=>{const option=document.createElement('button');option.type='button';option.className='relay-language-option';option.dataset.lang=code;option.textContent=name;option.setAttribute('role','option');option.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setLanguage(code);languageMenu.classList.add('hidden');refreshLanguage();});languageMenu.appendChild(option);});
    languageButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();languageMenu.classList.toggle('hidden');refreshLanguage();});
    languageWrap.append(languageButton,languageMenu);languageControl.appendChild(languageWrap);languageCard.append(languageCopy,languageControl);root.appendChild(languageCard);

    const extras=document.createElement('div');extras.className='relay-extra-grid';
    const fullscreen=document.createElement('button');fullscreen.type='button';fullscreen.className='relay-extra';fullscreen.innerHTML='<strong>FULLSCREEN</strong><small>Expand the game to the available screen.</small>';fullscreen.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else await document.exitFullscreen?.();}catch{}});
    const reset=document.createElement('button');reset.type='button';reset.className='relay-extra';reset.innerHTML='<strong>RESET GAME OPTIONS</strong><small>Restore audio, motion, rain and shake defaults.</small>';
    reset.addEventListener('click',()=>{setLanguage('en');const defaults={audioOn:true,screenShake:true,reducedMotion:false,rain:true,music:.55,sfx:.7};clickPauseSetting('muted',!defaults.audioOn);clickPauseSetting('screenShake',defaults.screenShake);clickPauseSetting('reducedMotion',defaults.reducedMotion);clickPauseSetting('rain',defaults.rain);setPauseVolume('musicVolume',defaults.music);setPauseVolume('sfxVolume',defaults.sfx);window.setTimeout(buildOptions,20);});
    extras.append(fullscreen,reset);root.appendChild(extras);

    const status=document.createElement('div');status.className='relay-options-status';status.textContent='SETTINGS SAVE AUTOMATICALLY · TOUCH FRIENDLY · RESPONSIVE';root.appendChild(status);content.appendChild(root);
  };

  const mount=()=>{const panel=document.getElementById('titlePanel');const content=document.getElementById('titlePanelContent');const heading=document.getElementById('titlePanelHeading');if(!panel||!content||!heading||panel.classList.contains('hidden'))return;const title=heading.textContent.trim().toUpperCase();if(!title.startsWith('RUN SETTINGS'))return;if(content.querySelector('.relay-home-options'))return;window.setTimeout(buildOptions,0);};

  const init=()=>{setLanguage(getLanguage());const content=document.getElementById('titlePanelContent');const panel=document.getElementById('titlePanel');if(!content)return;new MutationObserver(mount).observe(content,{childList:true,subtree:true});if(panel)new MutationObserver(mount).observe(panel,{attributes:true,attributeFilter:['class']});document.querySelectorAll('[data-title-panel="controls"]').forEach(button=>button.addEventListener('click',()=>window.setTimeout(mount,30)));};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();