(() => {
  'use strict';

  const KEY = 'relay.runner.cinematicArrival.v2.played';
  const startButton = document.getElementById('start');
  if (!startButton || window.__relayCinematicArrivalV2) return;
  window.__relayCinematicArrivalV2 = true;

  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  let active = false;
  let timers = [];
  let narration = null;

  const CSS = `
  #relayCinematicArrivalV2{position:fixed;inset:0;z-index:2147483640;background:#01040a;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow:hidden;isolation:isolate;cursor:default}
  #relayCinematicArrivalV2[hidden]{display:none}
  #relayCinematicArrivalV2 .ca2-space{position:absolute;inset:-8%;background:radial-gradient(circle at 50% 42%,#17394f 0,#071725 28%,#020711 62%,#000 100%);transform:scale(1.02);transition:transform 2s cubic-bezier(.2,.7,.2,1)}
  #relayCinematicArrivalV2 .ca2-stars,#relayCinematicArrivalV2 .ca2-stars:before,#relayCinematicArrivalV2 .ca2-stars:after{content:"";position:absolute;inset:0;background-repeat:repeat;background-image:radial-gradient(circle,#fff 0 1px,transparent 1.7px),radial-gradient(circle,#87efff 0 1px,transparent 1.7px),radial-gradient(circle,#fff 0 1px,transparent 1.5px);background-size:120px 140px,185px 210px,260px 240px;background-position:10px 25px,85px 60px,130px 120px;opacity:.5}
  #relayCinematicArrivalV2 .ca2-stars:before{opacity:.2;transform:scale(1.45)}
  #relayCinematicArrivalV2 .ca2-stars:after{opacity:.12;transform:scale(1.9)}
  #relayCinematicArrivalV2 .ca2-planet{position:absolute;left:50%;top:51%;width:min(55vw,620px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%) scale(.42);background:radial-gradient(circle at 32% 27%,rgba(255,255,255,.8) 0 3%,transparent 15%),radial-gradient(circle at 33% 34%,#63b6cc 0 10%,#2b718a 23%,#12465c 48%,#061a2a 73%,#020914 100%);box-shadow:-55px -34px 105px rgba(111,239,255,.17),55px 45px 130px rgba(0,0,0,.95),inset -30px -15px 55px rgba(0,0,0,.62),inset 22px 18px 48px rgba(135,239,255,.1);transition:transform 3.6s cubic-bezier(.16,.76,.2,1),filter 3.6s ease}
  #relayCinematicArrivalV2 .ca2-planet:before{content:"";position:absolute;inset:-5%;border-radius:50%;background:repeating-radial-gradient(circle at 42% 44%,transparent 0 7%,rgba(135,239,255,.055) 8% 8.5%,transparent 9% 15%);transform:rotate(-18deg) scale(1.15)}
  #relayCinematicArrivalV2 .ca2-atmo{position:absolute;left:50%;top:51%;width:min(65vw,730px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%) scale(.46);border:1px solid rgba(135,239,255,.18);box-shadow:0 0 120px 30px rgba(25,200,245,.06),inset 0 0 90px rgba(135,239,255,.08);transition:transform 3.6s ease,opacity 3.6s ease}
  #relayCinematicArrivalV2 .ca2-city{position:absolute;left:50%;bottom:-5%;width:120%;height:44%;transform:translateX(-50%) scale(.34);opacity:0;transition:transform 3.8s cubic-bezier(.18,.75,.22,1),opacity 2.8s ease;filter:contrast(1.08) saturate(.85)}
  #relayCinematicArrivalV2 .ca2-building{position:absolute;bottom:0;width:clamp(26px,5vw,85px);background:linear-gradient(180deg,#092033,#02070d);border:1px solid rgba(135,239,255,.08);box-shadow:0 -18px 40px rgba(25,200,245,.05)}
  #relayCinematicArrivalV2 .ca2-building:after{content:"";position:absolute;inset:10% 24%;background:repeating-linear-gradient(180deg,rgba(135,239,255,.33) 0 2px,transparent 2px 13px);opacity:.24}
  #relayCinematicArrivalV2 .ca2-building:nth-child(1){left:3%;height:56%}.ca2-building:nth-child(2){left:12%;height:84%}.ca2-building:nth-child(3){left:21%;height:46%}.ca2-building:nth-child(4){left:29%;height:72%}.ca2-building:nth-child(5){left:39%;height:96%}.ca2-building:nth-child(6){left:50%;height:62%}.ca2-building:nth-child(7){left:60%;height:79%}.ca2-building:nth-child(8){left:71%;height:52%}.ca2-building:nth-child(9){left:81%;height:90%}.ca2-building:nth-child(10){left:91%;height:44%}
  #relayCinematicArrivalV2 .ca2-horizon{position:absolute;left:-5%;right:-5%;bottom:0;height:38%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.24) 20%,#010307 88%);opacity:0;transition:opacity 2.4s ease}
  #relayCinematicArrivalV2 .ca2-scan{position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.024) 0 1px,transparent 1px 6px);mix-blend-mode:screen;opacity:.17;pointer-events:none}
  #relayCinematicArrivalV2 .ca2-vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 48%,transparent 30%,rgba(0,0,0,.16) 64%,rgba(0,0,0,.86) 100%);pointer-events:none}
  #relayCinematicArrivalV2 .ca2-fpv{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at 50% 56%,transparent 42%,rgba(0,0,0,.2) 67%,rgba(0,0,0,.82) 100%);transition:opacity 1.4s ease}
  #relayCinematicArrivalV2 .ca2-fpv:before{content:"";position:absolute;inset:6% 5%;border:1px solid rgba(135,239,255,.08);border-radius:36px 36px 48px 48px;box-shadow:inset 0 0 44px rgba(135,239,255,.03)}
  #relayCinematicArrivalV2 .ca2-ui{position:absolute;inset:0;pointer-events:none}
  #relayCinematicArrivalV2 .ca2-top{position:absolute;left:max(16px,4vw);top:max(16px,4vh);display:flex;gap:12px;align-items:center;color:#9bdceb;letter-spacing:.16em;font-size:clamp(9px,1vw,12px);text-transform:uppercase;opacity:0;transition:opacity 1s ease;text-shadow:0 0 18px rgba(25,200,245,.28)}
  #relayCinematicArrivalV2 .ca2-top i{width:6px;height:6px;border-radius:50%;background:#19c8f5;box-shadow:0 0 16px #19c8f5;display:block}
  #relayCinematicArrivalV2 .ca2-copy{position:absolute;left:50%;top:67%;width:min(820px,88vw);transform:translate(-50%,-50%);text-align:center;opacity:0;transition:opacity 1s ease,transform 1s ease}
  #relayCinematicArrivalV2 .ca2-kicker{margin:0 0 13px;font-size:clamp(9px,1vw,12px);letter-spacing:.32em;color:#87efff;text-transform:uppercase}
  #relayCinematicArrivalV2 .ca2-title{margin:0;font-size:clamp(30px,5.4vw,76px);line-height:.94;letter-spacing:.08em;font-weight:900;text-transform:uppercase;text-shadow:0 0 34px rgba(135,239,255,.13)}
  #relayCinematicArrivalV2 .ca2-line{margin:16px 0 0;font-size:clamp(12px,1.45vw,18px);line-height:1.55;color:#c4d9df;letter-spacing:.04em}
  #relayCinematicArrivalV2 .ca2-line em{display:block;margin-top:9px;color:#fff;opacity:.78;font-style:normal;font-size:.82em}
  #relayCinematicArrivalV2 .ca2-bottom{position:absolute;left:50%;bottom:34px;transform:translateX(-50%);display:flex;gap:11px;align-items:center;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#8fa6bb;opacity:0;transition:opacity 1s ease}
  #relayCinematicArrivalV2 .ca2-bottom b{color:#eafcff}
  #relayCinematicArrivalV2 .ca2-skip{position:absolute;right:max(14px,env(safe-area-inset-right,0px) + 12px);bottom:max(14px,env(safe-area-inset-bottom,0px) + 12px);border:1px solid rgba(135,239,255,.28);background:rgba(2,8,16,.76);color:#eafcff;padding:10px 13px;backdrop-filter:blur(10px);font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;cursor:pointer;opacity:0;transition:opacity .6s ease}
  #relayCinematicArrivalV2 .ca2-skip.show{opacity:1}
  #relayCinematicArrivalV2 .ca2-radar{position:absolute;right:max(18px,4vw);top:max(20px,8vh);width:100px;height:100px;border:1px solid rgba(135,239,255,.12);border-radius:50%;opacity:0;transition:opacity 1s ease}
  #relayCinematicArrivalV2 .ca2-radar:before{content:"";position:absolute;left:50%;top:50%;width:44%;height:1px;background:#87efff66;transform-origin:0 50%;animation:ca2Sweep 2.4s linear infinite}
  #relayCinematicArrivalV2 .ca2-radar:after{content:"";position:absolute;inset:12px;border:1px dashed rgba(135,239,255,.09);border-radius:50%}
  @keyframes ca2Sweep{to{transform:rotate(360deg)}}
  @keyframes ca2Handheld{from{transform:scale(1.03) translate3d(-.35%,-.18%,0)}to{transform:scale(1.045) translate3d(.45%,.24%,0)}}
  #relayCinematicArrivalV2.is-descent .ca2-space{animation:ca2Handheld 3.2s ease-in-out infinite alternate}
  @media(max-width:760px){#relayCinematicArrivalV2 .ca2-planet{width:min(90vw,520px);top:46%}#relayCinematicArrivalV2 .ca2-atmo{width:min(100vw,600px);top:46%}#relayCinematicArrivalV2 .ca2-copy{top:69%;width:91vw}#relayCinematicArrivalV2 .ca2-bottom{bottom:74px}#relayCinematicArrivalV2 .ca2-radar{width:72px;height:72px;right:16px}}
  @media(prefers-reduced-motion:reduce){#relayCinematicArrivalV2 *{animation:none!important;transition:none!important}}
  `;
  const style = document.createElement('style'); style.id='relay-cinematic-arrival-v2-style'; style.textContent=CSS; document.head.appendChild(style);

  const root = document.createElement('section'); root.id='relayCinematicArrivalV2'; root.hidden=true; root.setAttribute('aria-live','polite');
  root.innerHTML=`<div class="ca2-space"><div class="ca2-stars"></div><div class="ca2-atmo"></div><div class="ca2-planet"></div><div class="ca2-city">${Array.from({length:10},()=>'<span class="ca2-building"></span>').join('')}</div><div class="ca2-horizon"></div></div><div class="ca2-fpv"></div><div class="ca2-vignette"></div><div class="ca2-scan"></div><div class="ca2-ui"><div class="ca2-top"><i></i><span>ARRIVAL CONTROL // ONLINE</span></div><div class="ca2-radar"></div><div class="ca2-copy"></div><div class="ca2-bottom"><span>SECTOR</span><b>OLD QUARTER</b><span>·</span><span>VECTOR</span><b>R-17</b></div><button class="ca2-skip" type="button">SKIP CINEMATIC · ENTER</button></div>`;
  document.body.appendChild(root);

  const $ = s => root.querySelector(s);
  const wait = ms => new Promise(r=>{ const t=setTimeout(r,reduced()?Math.min(ms,160):ms); timers.push(t); });
  const set = (el, styles) => Object.assign(el.style, styles);
  const showCopy = (kicker,title,foreign,translation) => { const n=$('.ca2-copy'); n.innerHTML=`<p class="ca2-kicker">${kicker}</p><h1 class="ca2-title">${title}</h1><p class="ca2-line">${foreign}${translation?`<em>${translation}</em>`:''}</p>`; set(n,{opacity:'1',transform:'translate(-50%,-50%)'}); };
  const hideCopy = async () => { set($('.ca2-copy'),{opacity:'0',transform:'translate(-50%,-47%)'}); await wait(650); };

  function speak(text){
    if(!('speechSynthesis' in window))return;
    try{ window.speechSynthesis.cancel(); narration=new SpeechSynthesisUtterance(text); const voices=window.speechSynthesis.getVoices?.()||[]; narration.voice=voices.find(v=>/Daniel|George|David|Guy|James/i.test(v.name))||null; narration.lang='en-US'; narration.rate=.84; narration.pitch=.70; narration.volume=.78; window.speechSynthesis.speak(narration); }catch{}
  }
  function stopSpeech(){try{window.speechSynthesis?.cancel()}catch{}}

  let ac;
  function tone(freq,duration=.2,type='sine',volume=.018){const C=window.AudioContext||window.webkitAudioContext;if(!C||document.body.classList.contains('audio-off'))return;try{ac||=new C(); if(ac.state==='suspended')ac.resume(); const now=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(ac.destination);o.start(now);o.stop(now+duration)}catch{}}

  function resetScene(){
    timers.forEach(clearTimeout); timers=[]; stopSpeech(); root.classList.remove('is-descent'); root.hidden=true; active=false;
    const space=$('.ca2-space'), planet=$('.ca2-planet'), atmo=$('.ca2-atmo'), city=$('.ca2-city'), horizon=$('.ca2-horizon'), fpv=$('.ca2-fpv');
    set(space,{transform:'scale(1.02)'}); set(planet,{transform:'translate(-50%,-50%) scale(.42)',filter:'blur(0px)'}); set(atmo,{transform:'translate(-50%,-50%) scale(.46)',opacity:'1'}); set(city,{transform:'translateX(-50%) scale(.34)',opacity:'0'}); set(horizon,{opacity:'0'}); set(fpv,{opacity:'0'}); set($('.ca2-copy'),{opacity:'0',transform:'translate(-50%,-47%)'}); set($('.ca2-top'),{opacity:'0'}); set($('.ca2-bottom'),{opacity:'0'}); set($('.ca2-radar'),{opacity:'0'}); $('.ca2-skip').classList.remove('show');
  }

  async function play(){
    if(active)return; active=true; root.hidden=false; resetScene(); root.hidden=false;
    const skip=$('.ca2-skip'); skip.classList.add('show');
    if(reduced()){
      showCopy('ARRIVAL CONTROL','WELCOME TO THE OLD QUARTER','Kara ven, runner.','FOLLOW THE RELAY.'); await wait(1100); return finish();
    }

    // 00:00–00:03 — visor boots. Let the player settle into the shot.
    set($('.ca2-top'),{opacity:'1'}); showCopy('UNKNOWN TRANSMISSION','VISOR BOOT','Va\\'kora seith... nal ir ven.','THE RELAY IS STILL ACTIVE.'); tone(88,.45,'sine',.032); await wait(2600); if(!active)return;

    // 00:03–00:07 — planet reveal. Long enough to actually read and absorb the world.
    await hideCopy(); showCopy('ORBITAL APPROACH','NEW WORLD','Asha ven tor. Kera il nath.','DO NOT TRUST THE SIGNAL.'); set($('.ca2-radar'),{opacity:'1'}); tone(174,.8,'triangle',.02); await wait(700); set($('.ca2-planet'),{transform:'translate(-50%,-50%) scale(.72)'}); set($('.ca2-atmo'),{transform:'translate(-50%,-50%) scale(.76)'}); await wait(2800); if(!active)return;

    // 00:07–00:12 — descent. The world grows slowly instead of flashing past.
    await hideCopy(); root.classList.add('is-descent'); showCopy('ATMOSPHERIC ENTRY','DESCENT','Vel sha... ven.','DROP VECTOR R-17 CONFIRMED.'); speak('Drop vector R seventeen confirmed.'); tone(62,1.8,'sawtooth',.014); set($('.ca2-space'),{transform:'scale(1.15) translate3d(-1.4%,-1.8%,0)'}); set($('.ca2-planet'),{transform:'translate(-50%,-50%) scale(1.18)',filter:'blur(.8px)'}); set($('.ca2-atmo'),{transform:'translate(-50%,-50%) scale(1.20)',opacity:'.55'}); set($('.ca2-fpv'),{opacity:'1'}); await wait(4200); if(!active)return;

    // 00:12–00:16 — skyline reveal. Hold the frame so the player can actually see the city.
    await hideCopy(); showCopy('VISUAL LOCK','CITYSPINE','Nara ven sol...','WELCOME TO THE OLD QUARTER.'); speak('Welcome to the Old Quarter.'); tone(230,.7,'triangle',.022); set($('.ca2-space'),{transform:'scale(1.25) translate3d(1.4%,-1.2%,0)'}); set($('.ca2-city'),{transform:'translateX(-50%) scale(.82)',opacity:'1'}); set($('.ca2-horizon'),{opacity:'1'}); set($('.ca2-planet'),{transform:'translate(-50%,-54%) scale(1.95)',filter:'blur(2px)',opacity:'.18'}); set($('.ca2-atmo'),{transform:'translate(-50%,-54%) scale(2.0)',opacity:'.12'}); await wait(3200); if(!active)return;

    // 00:16–00:20 — street-level handoff. Slow camera settle and final voice line.
    await hideCopy(); showCopy('ARRIVAL CONFIRMED','RELAY RUNNER','Seith nal. Vara ten.','WALK THE LINE. KEEP IT ALIVE.'); speak('Walk the line. Keep it alive.'); set($('.ca2-space'),{transform:'scale(1.38) translate3d(-.8%,.5%,0)'}); set($('.ca2-city'),{transform:'translateX(-50%) scale(1.18)',opacity:'1'}); set($('.ca2-bottom'),{opacity:'1'}); await wait(3100); if(!active)return;

    // 00:20–00:22 — clean bridge to the real game, not a hard cut.
    await hideCopy(); set($('.ca2-top'),{opacity:'0'}); set($('.ca2-radar'),{opacity:'0'}); set($('.ca2-bottom'),{opacity:'0'}); set($('.ca2-fpv'),{opacity:'0'}); await wait(450); finish();
  }

  function finish(){
    if(!active)return; active=false; stopSpeech(); sessionStorage.setItem(KEY,'1'); const evt=new MouseEvent('click',{bubbles:true,cancelable:true,view:window}); replayGuard=true; startButton.dispatchEvent(evt); window.setTimeout(()=>{replayGuard=false; root.hidden=true},420);
  }

  function skip(){ if(!active)return; stopSpeech(); finish(); }
  $('.ca2-skip').addEventListener('click',skip); document.addEventListener('keydown',e=>{if(active&&(e.key==='Enter'||e.code==='Space'||e.key==='Escape')){e.preventDefault();skip()}});

  document.addEventListener('click',event=>{
    if(event.target.closest('#start')){
      if(replayGuard)return;
      if(sessionStorage.getItem(KEY)==='1')return;
      event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();
      play();
    }
  },true);

  window.relayCinematicArrivalReplay=()=>{sessionStorage.removeItem(KEY); play();};
})();