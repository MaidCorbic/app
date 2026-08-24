import { loadState, saveState, getCourierRank, getLevelProgress, dailyChallenges, achievementDefinitions } from './src/state.js';

(() => {
  if (window.__relayHomeV3) return;
  window.__relayHomeV3 = true;

  const style = document.createElement('style');
  style.textContent = `
    #intro .info-launcher{display:none!important}
    #homeV3Utility{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;width:min(300px,100%);margin-top:8px}
    .home-v3-btn{min-height:38px;border:1px solid #61758a;border-radius:3px;background:linear-gradient(180deg,#0a1726,#06101b);color:#e9f2f8;font:800 8px 'DM Mono',monospace;letter-spacing:1px;cursor:pointer;box-shadow:inset 0 1px #ffffff08,0 7px 18px #0005;transition:transform .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease}
    .home-v3-btn:hover,.home-v3-btn:focus-visible{transform:translateY(-2px);border-color:#ffd06e;color:#ffd06e;box-shadow:0 10px 26px #0008,0 0 18px #ffd06e14;outline:none}
    #homeV3Deck{display:none!important;width:min(300px,100%);grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}
    #homeV3Deck.open{display:grid!important;animation:homeV3DeckIn .22s ease both}
    #homeV3Deck .home-v3-btn{min-height:34px;font-size:7px}
    #homeV3Launch{grid-column:1/-1}
    #homeV3Audio{grid-column:auto}
    #homeV3Panel{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:12px;background:#02050ad9;backdrop-filter:blur(12px);opacity:1;transition:opacity .18s ease}
    #homeV3Panel.hidden{display:none}
    .home-v3-card{width:min(760px,94vw);max-height:calc(100dvh - 24px);overflow:auto;border:1px solid #667a90;background:linear-gradient(155deg,#091827f7,#020812f8);border-radius:14px;box-shadow:0 30px 100px #000d,0 0 50px #ffd06e0b;padding:18px;color:#eaf2f8;box-sizing:border-box}
    .home-v3-card::-webkit-scrollbar{width:5px}.home-v3-card::-webkit-scrollbar-thumb{background:#3a5065;border-radius:10px}
    .home-v3-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-bottom:12px;border-bottom:1px solid #71839933}.home-v3-kicker{margin:0 0 4px;color:#7ed8ff;font:800 7px 'DM Mono',monospace;letter-spacing:2px}.home-v3-title{margin:0;font:900 clamp(24px,6vw,42px)/.9 Manrope,sans-serif;letter-spacing:-.06em}.home-v3-title em{font-style:normal;color:#ffd06e}.home-v3-close{width:40px;height:40px;border:1px solid #687b8f;background:#07111d;color:#dce7ef;border-radius:4px;font-size:22px;cursor:pointer}.home-v3-close:hover{border-color:#ffd06e;color:#ffd06e}
    .home-v3-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.home-v3-stat,.home-v3-cardlet{padding:12px;border:1px solid #5c718522;border-radius:10px;background:linear-gradient(145deg,#0a1725e8,#040b14e8)}.home-v3-stat small,.home-v3-cardlet small{display:block;color:#72859a;font:800 7px 'DM Mono',monospace;letter-spacing:1.2px}.home-v3-stat strong{display:block;margin-top:6px;font:900 21px Manrope,sans-serif}.home-v3-cardlet b{display:block;margin-top:5px;font:800 10px 'DM Mono',monospace}.home-v3-cardlet p{margin:5px 0 0;color:#8293a5;font:700 8px/1.5 'DM Mono',monospace}.home-v3-progress{height:7px;margin-top:8px;border:1px solid #4b617533;background:#02070d;border-radius:99px;overflow:hidden}.home-v3-progress i{display:block;height:100%;background:linear-gradient(90deg,#38bdf8,#ffd06e);box-shadow:0 0 14px #38bdf844}
    .home-v3-section{margin:14px 0 7px;color:#ffd06e;font:800 8px 'DM Mono',monospace;letter-spacing:1.6px}.home-v3-list{display:grid;gap:7px}.home-v3-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px;border:1px solid #5c718522;border-radius:8px;background:#06101be8}.home-v3-row b{display:block;font:800 9px 'DM Mono',monospace}.home-v3-row small{display:block;margin-top:3px;color:#75879a;font:700 7px/1.4 'DM Mono',monospace}.home-v3-pill{padding:5px 7px;border:1px solid #ffd06e55;color:#ffd06e;border-radius:99px;font:800 7px 'DM Mono',monospace;white-space:nowrap}
    #homeV3Panel[data-theme='day']{background:#0a111bcc}.home-v3-cinematic{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;background:radial-gradient(circle at 50% 44%,#1b3855 0,#050a13 55%,#010309 100%);animation:homeV3CinemaOut .8s 2.6s ease forwards;pointer-events:none}.home-v3-cinematic>div{text-align:center}.home-v3-cinematic small{display:block;color:#7ed8ff;font:800 8px 'DM Mono',monospace;letter-spacing:3px}.home-v3-cinematic h2{margin:13px 0;color:#f4f7fa;font:900 clamp(46px,13vw,100px)/.8 Manrope,sans-serif;letter-spacing:-.09em}.home-v3-cinematic h2 em{font-style:normal;color:#ffd06e}.home-v3-cinematic p{margin:0;color:#8394a7;font:700 8px 'DM Mono',monospace;letter-spacing:1.5px}.home-v3-scan{width:180px;height:1px;margin:18px auto;background:#ffd06e;box-shadow:0 0 16px #ffd06e;animation:homeV3Scan 1.2s ease-in-out infinite}
    #intro .title-lockup{--home-accent:#ffd06e}
    #intro .menu-backdrop::after{animation:homeV3Sky 8s ease-in-out infinite alternate}
    #intro .backdrop-rain{animation-duration:2.2s!important}
    #intro .city-one,#intro .city-two{animation:homeV3CityLights 3.8s steps(3,end) infinite alternate}
    #intro .play-button{animation:homeV3PlayPulse 2.8s ease-in-out infinite}
    @keyframes homeV3DeckIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
    @keyframes homeV3PlayPulse{50%{box-shadow:0 16px 46px #ffcf6a45,inset 0 1px #fff}}
    @keyframes homeV3CityLights{0%{filter:brightness(.78)}48%{filter:brightness(1)}53%{filter:brightness(.72)}100%{filter:brightness(1.08)}}
    @keyframes homeV3Sky{from{opacity:.75}to{opacity:1}}
    @keyframes homeV3Scan{50%{transform:scaleX(.55);opacity:.55}}
    @keyframes homeV3CinemaOut{to{opacity:0;visibility:hidden}}
    @media(max-width:700px){#homeV3Utility{width:min(280px,100%);grid-template-columns:repeat(3,1fr)}#homeV3Deck{width:min(280px,100%)}.home-v3-card{width:96vw;max-height:calc(100dvh - 12px);padding:13px;border-radius:12px}.home-v3-grid{grid-template-columns:1fr 1fr;gap:6px}.home-v3-stat,.home-v3-cardlet{padding:9px}.home-v3-stat strong{font-size:18px}.home-v3-row{padding:9px}.home-v3-title{font-size:27px}}
    @media(prefers-reduced-motion:reduce){#intro .play-button,#intro .menu-backdrop::after,#intro .city-one,#intro .city-two,#intro .backdrop-rain{animation:none!important}.home-v3-cinematic{animation:none;display:none}.home-v3-card,.home-v3-btn{transition:none}}
  `;
  document.head.appendChild(style);

  const fmt = n => Number(n || 0).toLocaleString();
  const pct = n => Math.max(0, Math.min(100, Math.round((Number(n) || 0) * 100)));
  const savePatch = patch => saveState({ ...loadState(), ...patch });

  function ensureHomeControls(){
    const lock = document.querySelector('#intro .title-lockup');
    const actions = lock?.querySelector('.menu-actions');
    if(!lock || !actions || document.getElementById('homeV3Utility')) return;
    const launcher = document.querySelector('#intro .info-launcher');
    const faq = launcher?.querySelector('[data-relay-info="faq"]');
    const info = launcher?.querySelector('[data-relay-info="update"]');
    const utility = document.createElement('div'); utility.id='homeV3Utility';
    const mk = (text, cls='') => { const b=document.createElement('button'); b.type='button'; b.className=`home-v3-btn ${cls}`; b.textContent=text; return b; };
    if(faq){ faq.className='home-v3-btn'; faq.innerHTML='<span>?</span> FAQ'; utility.appendChild(faq); }
    if(info){ info.className='home-v3-btn'; info.removeAttribute('aria-label'); info.innerHTML='<span>ⓘ</span> INFO'; utility.appendChild(info); }
    const audio=mk(loadState().muted?'🔇 AUDIO':'🔊 AUDIO'); audio.id='homeV3Audio'; utility.appendChild(audio);
    actions.insertAdjacentElement('afterend',utility);

    const deckLaunch=mk('COMMAND DECK'); deckLaunch.id='homeV3Launch'; deckLaunch.setAttribute('aria-expanded','false'); deckLaunch.setAttribute('aria-controls','homeV3Deck');
    const deck=document.createElement('div'); deck.id='homeV3Deck'; deck.hidden=true;
    ['PROFILE','STATS','MISSIONS','DAILY','ACHIEVEMENTS','THEMES'].forEach(key=>{ const b=mk(key); b.dataset.homeDeck=key.toLowerCase(); deck.appendChild(b); });
    utility.insertAdjacentElement('afterend',deckLaunch); utility.insertAdjacentElement('afterend',deck);
    deckLaunch.addEventListener('click',()=>{ const open=!deck.classList.contains('open'); deck.classList.toggle('open',open); deck.hidden=!open; deckLaunch.setAttribute('aria-expanded',String(open)); });
    audio.addEventListener('click',()=>toggleMute(audio));

    const cont=document.getElementById('continue');
    const state=loadState();
    if(cont && (state.totalRuns>0 || state.completed?.length)){ cont.classList.remove('hidden'); cont.textContent='CONTINUE →'; cont.addEventListener('click',()=>document.getElementById('start')?.click(),{once:true}); }
  }

  let audioCtx;
  function unlockAudio(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==='suspended')audioCtx.resume(); }
  function sfx(freq=520,dur=.045){ const s=loadState(); if(s.muted || !(s.sfxVolume>0))return; try{unlockAudio();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;o.type='triangle';g.gain.setValueAtTime(.0001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.035*s.sfxVolume,audioCtx.currentTime+.006);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur+.01)}catch{}}
  function toggleMute(button){ const muted=!loadState().muted; savePatch({muted}); button.textContent=muted?'🔇 AUDIO':'🔊 AUDIO'; window.dispatchEvent(new CustomEvent('relay-settings-change',{detail:{key:'muted',value:muted}})); sfx(240); }
  function startAmbient(){ const s=loadState(); if(s.muted || !(s.musicVolume>0))return; try{unlockAudio(); if(window.__relayHomeAmbient)return; const master=audioCtx.createGain(); master.gain.value=.018*s.musicVolume; master.connect(audioCtx.destination); const notes=[110,146.83,164.81]; notes.forEach((f,i)=>{const o=audioCtx.createOscillator();o.type='sine';o.frequency.value=f;o.detune.value=i*3;const g=audioCtx.createGain();g.gain.value=.18;o.connect(g).connect(master);o.start();}); window.__relayHomeAmbient=master;}catch{} }

  const data = {
    profile: {title:'COURIER PROFILE', kicker:'PROFILE // LIVE SAVE'},
    stats: {title:'RUN STATS', kicker:'PERFORMANCE // LIFETIME'},
    missions: {title:'MISSIONS // CHAPTERS', kicker:'CAMPAIGN // ROUTE CLEARANCE'},
    daily: {title:'DAILY CHALLENGE', kicker:'TODAY // LIVE OBJECTIVE'},
    achievements: {title:'ACHIEVEMENTS', kicker:'MILESTONES // UNLOCKS'},
    themes: {title:'THEMES // COURIER', kicker:'PRESENTATION // LOADOUT'},
  };

  function openFeature(kind){
    const s=loadState(), rank=getCourierRank(s.xp||0), level=getLevelProgress(s.xp||0);
    let body='';
    if(kind==='profile') body=`<div class="home-v3-grid"><div class="home-v3-stat"><small>RANK</small><strong>${rank.name}</strong></div><div class="home-v3-stat"><small>LEVEL</small><strong>${level.level}</strong></div><div class="home-v3-stat"><small>TOTAL XP</small><strong>${fmt(s.xp)}</strong></div><div class="home-v3-stat"><small>CREDITS</small><strong>${fmt(s.credits)}</strong></div></div><div class="home-v3-section">XP PROGRESS</div><div class="home-v3-progress"><i style="width:${pct(level.progress)}%"></i></div><div class="home-v3-cardlet" style="margin-top:8px"><small>NEXT RANK</small><b>${rank.next?rank.next.name:'RELAY MASTER'}</b><p>${rank.next?rank.next.unlock:'Maximum clearance reached.'}</p></div>`;
    if(kind==='stats') body=`<div class="home-v3-grid"><div class="home-v3-stat"><small>RUNS</small><strong>${fmt(s.totalRuns)}</strong></div><div class="home-v3-stat"><small>BEST SCORE</small><strong>${fmt(s.bestRun)}</strong></div><div class="home-v3-stat"><small>SIGNALS</small><strong>${fmt(s.signals)}</strong></div><div class="home-v3-stat"><small>STREAK</small><strong>${fmt(s.streak)}</strong></div><div class="home-v3-stat"><small>LONGEST STREAK</small><strong>${fmt(s.longestStreak)}</strong></div><div class="home-v3-stat"><small>ACHIEVEMENTS</small><strong>${fmt(s.achievements?.length)}</strong></div></div>`;
    if(kind==='missions') { const chapters=[['CHAPTER 01','OLD QUARTER','first-delivery','Rooftop Relay'],['CHAPTER 02','INDUSTRIAL','dead-drop','Dead Drop'],['CHAPTER 03','DOWNTOWN','blackout','Blackout'],['CHAPTER 04','CORPORATE','pursuit','Pursuit'],['CHAPTER 05','RESIDENTIAL','signal-storm','Signal Storm'],['CHAPTER 06','APEX','final-relay','Final Relay']]; body=`<div class="home-v3-list">${chapters.map(([c,d,id,label],i)=>{const done=s.completed?.includes(id),unlocked=s.unlockedMissions?.includes(id)||i===0;return `<div class="home-v3-row"><div><b>${c} // ${label}</b><small>${d} · ${done?'COMPLETED':unlocked?'READY':'LOCKED'}</small></div><span class="home-v3-pill">${done?'✓':unlocked?'OPEN':'LOCKED'}</span></div>`}).join('')}</div>`; }
    if(kind==='daily'){ const ch=dailyChallenges[(new Date().getDate()-1)%dailyChallenges.length]; const p=s.daily?.progress?.[ch.id]||0; body=`<div class="home-v3-cardlet"><small>TODAY'S TARGET</small><b>${ch.label}</b><p>${p} / ${ch.target} · REWARD ${ch.xp} XP + ${ch.credits} CREDITS</p><div class="home-v3-progress"><i style="width:${Math.min(100,Math.round(p/ch.target*100))}%"></i></div></div><div class="home-v3-section">STREAK</div><div class="home-v3-grid"><div class="home-v3-stat"><small>CURRENT</small><strong>${fmt(s.streak)}</strong></div><div class="home-v3-stat"><small>BEST</small><strong>${fmt(s.longestStreak)}</strong></div></div>`; }
    if(kind==='achievements') body=`<div class="home-v3-list">${achievementDefinitions.map(a=>{const done=s.achievements?.includes(a.id);return `<div class="home-v3-row"><div><b>${a.label}</b><small>${a.detail}</small></div><span class="home-v3-pill">${done?'UNLOCKED':'LOCKED'}</span></div>`}).join('')}</div>`;
    if(kind==='themes') body=`<div class="home-v3-section">DAY / NIGHT</div><div class="home-v3-grid"><button class="home-v3-btn" data-home-theme="night">NIGHT SHIFT</button><button class="home-v3-btn" data-home-theme="day">DAY RUN</button></div><div class="home-v3-section">COURIER SKINS</div><div class="home-v3-list">${[['night-runner','NIGHT RUNNER','Default relay black'],['ghostline','GHOSTLINE','Unlock at GHOST rank'],['goldline','GOLDLINE','Premium presentation skin']].map(([id,n,d])=>`<div class="home-v3-row"><div><b>${n}</b><small>${d}</small></div><button class="home-v3-btn" data-home-skin="${id}">${localStorage.getItem('relay-courier-skin')===id?'EQUIPPED':'EQUIP'}</button></div>`).join('')}</div><p style="color:#6f8193;font:700 7px/1.5 'DM Mono',monospace;margin-top:10px">SKINS/THEMES are saved locally and emit a relay-skin-change event for the gameplay presentation layer.</p>`;
    const panel=document.createElement('div'); panel.id='homeV3Panel'; panel.innerHTML=`<div class="home-v3-card"><header class="home-v3-head"><div><p class="home-v3-kicker">${data[kind].kicker}</p><h2 class="home-v3-title">${data[kind].title.replace(' // ','<em> // </em>')}</h2></div><button class="home-v3-close" type="button" aria-label="Close">×</button></header>${body}</div>`; document.body.appendChild(panel);
    panel.querySelector('.home-v3-close').addEventListener('click',()=>panel.remove()); panel.addEventListener('click',e=>{if(e.target===panel)panel.remove()}); panel.querySelectorAll('[data-home-theme]').forEach(b=>b.addEventListener('click',()=>applyTheme(b.dataset.homeTheme,panel))); panel.querySelectorAll('[data-home-skin]').forEach(b=>b.addEventListener('click',()=>{localStorage.setItem('relay-courier-skin',b.dataset.homeSkin);document.documentElement.dataset.courierSkin=b.dataset.homeSkin;window.dispatchEvent(new CustomEvent('relay-skin-change',{detail:{skin:b.dataset.homeSkin}}));openFeature('themes');panel.remove();}));
  }

  function applyTheme(theme,panel){ document.documentElement.dataset.homeTheme=theme; localStorage.setItem('relay-home-theme',theme); panel.remove(); }

  function init(){
    ensureHomeControls();
    document.querySelectorAll('[data-home-deck]').forEach(b=>b.addEventListener('click',()=>openFeature(b.dataset.homeDeck)));
    document.addEventListener('click',e=>{ if(e.target.closest('button'))sfx(); if(e.target.closest('#start')){sfx(740,.08);startAmbient();} },true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('homeV3Panel')?.remove()});
    document.addEventListener('pointerdown',()=>startAmbient(),{once:true,passive:true});
    document.documentElement.dataset.homeTheme=localStorage.getItem('relay-home-theme')||'night';
    document.documentElement.dataset.courierSkin=localStorage.getItem('relay-courier-skin')||'night-runner';
    if(!sessionStorage.getItem('relay-home-cinematic-v3')&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){sessionStorage.setItem('relay-home-cinematic-v3','1');const c=document.createElement('div');c.className='home-v3-cinematic';c.innerHTML='<div><small>RELAY NETWORK // SECURE CHANNEL</small><h2>THE NIGHT<br><em>IS ONLINE.</em></h2><div class="home-v3-scan"></div><p>OLD QUARTER · SIGNAL LINK STABLE · CHAPTER 01</p></div>';document.body.appendChild(c);setTimeout(()=>c.remove(),3500)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
