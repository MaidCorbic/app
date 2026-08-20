(() => {
  'use strict';

  const start = document.getElementById('start');
  if (!start || window.__relayCinematicArrivalV4) return;
  window.__relayCinematicArrivalV4 = true;

  const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  const wait = ms => new Promise(resolve => setTimeout(resolve, reduceMotion() ? Math.min(ms, 220) : ms));
  let playing = false;
  let savedClick = false;

  const style = document.createElement('style');
  style.id = 'relay-cinematic-arrival-v4-style';
  style.textContent = `
    #relayCinematicArrivalV4{position:fixed;inset:0;z-index:2147483640;overflow:hidden;background:#01030a;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    #relayCinematicArrivalV4[hidden]{display:none}
    #relayCinematicArrivalV4 .space{position:absolute;inset:-10%;background:radial-gradient(circle at 50% 42%,#153a52 0,#071725 27%,#020711 61%,#000 100%);transform:scale(1.02);transition:transform 11s cubic-bezier(.22,.72,.18,1)}
    #relayCinematicArrivalV4 .stars{position:absolute;inset:0;opacity:.52;background-image:radial-gradient(circle,#fff 0 1px,transparent 1.8px),radial-gradient(circle,#8deeff 0 1px,transparent 1.8px),radial-gradient(circle,#fff 0 1px,transparent 1.5px);background-size:125px 145px,190px 215px,270px 250px;background-position:20px 30px,80px 90px,130px 120px}
    #relayCinematicArrivalV4 .planet{position:absolute;left:50%;top:51%;width:min(58vw,650px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%) scale(.22);background:radial-gradient(circle at 32% 27%,rgba(255,255,255,.85) 0 3%,transparent 16%),radial-gradient(circle at 34% 35%,#65b6ca 0 10%,#2c7188 23%,#13475e 48%,#061b2b 73%,#020914 100%);box-shadow:-60px -40px 120px rgba(117,239,255,.19),60px 45px 140px rgba(0,0,0,.94),inset -35px -18px 58px rgba(0,0,0,.64),inset 25px 18px 52px rgba(141,244,255,.11);transition:transform 10s cubic-bezier(.17,.75,.19,1)}
    #relayCinematicArrivalV4 .atmo{position:absolute;left:50%;top:51%;width:min(70vw,780px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%) scale(.25);border:1px solid rgba(141,244,255,.16);box-shadow:0 0 140px 32px rgba(25,200,245,.07),inset 0 0 110px rgba(141,244,255,.08);transition:transform 10s ease,opacity 10s ease}
    #relayCinematicArrivalV4 .city{position:absolute;left:50%;bottom:-5%;width:122%;height:48%;transform:translateX(-50%) scale(.18);opacity:0;transition:transform 8s cubic-bezier(.15,.78,.2,1),opacity 5s ease}
    #relayCinematicArrivalV4 .building{position:absolute;bottom:0;width:clamp(28px,5vw,90px);background:linear-gradient(180deg,#0a2235,#02070d);border:1px solid rgba(141,244,255,.08);box-shadow:0 -22px 45px rgba(25,200,245,.06)}
    #relayCinematicArrivalV4 .building:after{content:"";position:absolute;inset:10% 23%;background:repeating-linear-gradient(180deg,rgba(141,244,255,.35) 0 2px,transparent 2px 13px);opacity:.25}
    #relayCinematicArrivalV4 .building:nth-child(1){left:2%;height:58%}.building:nth-child(2){left:11%;height:88%}.building:nth-child(3){left:20%;height:46%}.building:nth-child(4){left:29%;height:73%}.building:nth-child(5){left:39%;height:97%}.building:nth-child(6){left:50%;height:62%}.building:nth-child(7){left:60%;height:82%}.building:nth-child(8){left:70%;height:55%}.building:nth-child(9){left:81%;height:91%}.building:nth-child(10){left:91%;height:45%}
    #relayCinematicArrivalV4 .horizon{position:absolute;left:-5%;right:-5%;bottom:0;height:40%;opacity:0;background:linear-gradient(180deg,transparent,rgba(0,0,0,.24) 20%,#010307 88%);transition:opacity 4s ease}
    #relayCinematicArrivalV4 .fpv{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at 50% 56%,transparent 40%,rgba(0,0,0,.18) 65%,rgba(0,0,0,.86) 100%);transition:opacity 3s ease}
    #relayCinematicArrivalV4 .fpv:before{content:"";position:absolute;inset:5% 4%;border:1px solid rgba(141,244,255,.07);border-radius:40px 40px 52px 52px;box-shadow:inset 0 0 46px rgba(141,244,255,.035)}
    #relayCinematicArrivalV4 .scan{position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.02) 0 1px,transparent 1px 6px);opacity:.18;pointer-events:none}
    #relayCinematicArrivalV4 .vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 48%,transparent 28%,rgba(0,0,0,.18) 63%,rgba(0,0,0,.9) 100%);pointer-events:none}
    #relayCinematicArrivalV4 .hud{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 1.8s ease}
    #relayCinematicArrivalV4 .hud-top{position:absolute;left:clamp(16px,4vw,54px);top:clamp(16px,4vh,38px);display:flex;align-items:center;gap:12px;font-size:clamp(9px,1vw,12px);letter-spacing:.16em;color:#9bdceb;text-transform:uppercase}
    #relayCinematicArrivalV4 .hud-top i{width:6px;height:6px;border-radius:50%;background:#19c8f5;box-shadow:0 0 18px #19c8f5}
    #relayCinematicArrivalV4 .hud-radar{position:absolute;right:clamp(18px,4vw,58px);top:clamp(18px,8vh,76px);width:104px;height:104px;border:1px solid rgba(141,244,255,.13);border-radius:50%}
    #relayCinematicArrivalV4 .hud-radar:before{content:"";position:absolute;left:50%;top:50%;width:44%;height:1px;background:#8df4ff66;transform-origin:0 50%;animation:arrivalRadar 2.6s linear infinite}
    #relayCinematicArrivalV4 .hud-radar:after{content:"";position:absolute;inset:12px;border:1px dashed rgba(141,244,255,.08);border-radius:50%}
    #relayCinematicArrivalV4 .copy{position:absolute;left:50%;top:67%;width:min(880px,90vw);transform:translate(-50%,-50%) translateY(14px);opacity:0;text-align:center;transition:opacity 1.8s ease,transform 1.8s cubic-bezier(.2,.7,.2,1)}
    #relayCinematicArrivalV4 .kicker{margin:0 0 15px;color:#8df4ff;font-size:clamp(9px,1vw,12px);letter-spacing:.34em;text-transform:uppercase}
    #relayCinematicArrivalV4 .title{margin:0;font-size:clamp(32px,5.7vw,80px);line-height:.92;letter-spacing:.085em;font-weight:900;text-transform:uppercase;text-shadow:0 0 40px rgba(141,244,255,.14)}
    #relayCinematicArrivalV4 .line{margin:18px 0 0;color:#c8dce2;font-size:clamp(12px,1.45vw,18px);line-height:1.6;letter-spacing:.04em}
    #relayCinematicArrivalV4 .line em{display:block;margin-top:10px;color:#fff;font-style:normal;opacity:.76;font-size:.82em}
    #relayCinematicArrivalV4 .black{position:absolute;inset:0;background:#01030a;opacity:1;pointer-events:none;transition:opacity 2.2s ease}
    #relayCinematicArrivalV4 .bottom{position:absolute;left:50%;bottom:34px;transform:translateX(-50%);display:flex;gap:11px;align-items:center;opacity:0;color:#8fa6bb;font-size:9px;letter-spacing:.18em;text-transform:uppercase;transition:opacity 1.6s ease}.bottom b{color:#eafcff}
    #relayCinematicArrivalV4 .skip{position:absolute;right:max(14px,env(safe-area-inset-right,0px) + 12px);bottom:max(14px,env(safe-area-inset-bottom,0px) + 12px);padding:10px 13px;border:1px solid rgba(141,244,255,.28);background:rgba(2,8,16,.8);color:#eafcff;font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;opacity:.68;cursor:pointer;pointer-events:auto}
    @keyframes arrivalRadar{to{transform:rotate(360deg)}}
    @keyframes arrivalFloat{from{transform:translate3d(-.4%,-.25%,0) scale(1.035)}to{transform:translate3d(.45%,.28%,0) scale(1.05)}}
    #relayCinematicArrivalV4.is-descent .space{animation:arrivalFloat 5.5s ease-in-out infinite alternate}
    @media(max-width:760px){#relayCinematicArrivalV4 .planet{width:min(92vw,520px);top:46%}#relayCinematicArrivalV4 .atmo{width:min(102vw,610px);top:46%}#relayCinematicArrivalV4 .copy{top:70%;width:92vw}#relayCinematicArrivalV4 .bottom{bottom:74px}#relayCinematicArrivalV4 .hud-radar{width:74px;height:74px;right:16px}}
    @media(prefers-reduced-motion:reduce){#relayCinematicArrivalV4 *{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('section');
  root.id='relayCinematicArrivalV4';
  root.hidden=true;
  root.innerHTML=`<div class="space"><div class="stars"></div><div class="atmo"></div><div class="planet"></div><div class="city">${Array.from({length:10},()=>'<span class="building"></span>').join('')}</div><div class="horizon"></div></div><div class="fpv"></div><div class="scan"></div><div class="vignette"></div><div class="black"></div><div class="hud"><div class="hud-top"><i></i><span>ARRIVAL CONTROL // ONLINE</span></div><div class="hud-radar"></div></div><div class="copy"></div><div class="bottom"><span>SECTOR</span><b>OLD QUARTER</b><span>·</span><span>VECTOR</span><b>R-17</b></div><button class="skip" type="button">SKIP CINEMATIC · ENTER</button>`;
  document.body.appendChild(root);

  const $ = selector => root.querySelector(selector);
  const set = (el, props) => Object.assign(el.style, props);
  const showCopy = (kicker,title,foreign,translation) => { const node=$('.copy'); node.innerHTML=`<p class="kicker">${kicker}</p><h1 class="title">${title}</h1><p class="line">${foreign}${translation ? `<em>${translation}</em>` : ''}</p>`; set(node,{opacity:'1',transform:'translate(-50%,-50%)'}); };
  const hideCopy = async () => { set($('.copy'),{opacity:'0',transform:'translate(-50%,-50%) translateY(-8px)'}); await wait(1200); };

  function speak(text){
    if(!('speechSynthesis' in window)) return;
    try{ window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); const voices=window.speechSynthesis.getVoices?.()||[]; u.voice=voices.find(v=>/Daniel|George|David|Guy|James/i.test(v.name))||null; u.lang='en-US'; u.rate=.78; u.pitch=.66; u.volume=.8; window.speechSynthesis.speak(u); }catch{}
  }
  function stopVoice(){try{window.speechSynthesis?.cancel()}catch{}}

  let audio;
  function tone(freq,duration=.35,type='sine',volume=.02){const C=window.AudioContext||window.webkitAudioContext;if(!C||document.body.classList.contains('audio-off'))return;try{audio ||= new C(); if(audio.state==='suspended')audio.resume(); const now=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(volume,now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(audio.destination);o.start(now);o.stop(now+duration)}catch{}}

  function reset(){
    stopVoice(); playing=false; set($('.black'),{opacity:'1'}); root.classList.remove('is-descent'); root.hidden=true;
    set($('.space'),{transform:'scale(1.02)'});set($('.planet'),{transform:'translate(-50%,-50%) scale(.22)'});set($('.atmo'),{transform:'translate(-50%,-50%) scale(.25)',opacity:'1'});set($('.city'),{transform:'translateX(-50%) scale(.18)',opacity:'0'});set($('.horizon'),{opacity:'0'});set($('.fpv'),{opacity:'0'});set($('.hud'),{opacity:'0'});set($('.copy'),{opacity:'0',transform:'translate(-50%,-50%) translateY(14px)'});set($('.bottom'),{opacity:'0'});
  }

  async function play(){
    if(playing)return;
    playing=true;root.hidden=false;
    const skip=$('.skip');skip.style.display='block';
    // SHOT 00 — blackout hold.
    await wait(1800);
    if(!playing)return;
    set($('.black'),{opacity:'0'}); set($('.hud'),{opacity:'1'}); set($('.copy'),{opacity:'1',transform:'translate(-50%,-50%)'}); set($('.bottom'),{opacity:'1'});
    showCopy('UNKNOWN TRANSMISSION','VISOR BOOT','Va-kora seith... nal ir ven.','THE RELAY IS STILL ACTIVE.');
    speak('The relay is still active.'); tone(82,.8,'sine',.032);
    await wait(4300);
    if(!playing)return;
    // SHOT 01 — long orbital hold: planet reveal, then a deliberate pause.
    await hideCopy();
    showCopy('ORBITAL APPROACH','NEW WORLD','Asha ven tor. Kera il nath.','DO NOT TRUST THE SIGNAL.');
    set($('.planet'),{transform:'translate(-50%,-50%) scale(.68)'});set($('.atmo'),{transform:'translate(-50%,-50%) scale(.62)'});
    tone(146,1.1,'triangle',.024);
    await wait(7200);
    if(!playing)return;
    // SHOT 02 — controlled camera move into atmosphere.
    showCopy('NAVIGATION LOCK','DROP VECTOR R-17','Vel sha... kor an.', 'ATMOSPHERIC ENTRY CONFIRMED.');
    root.classList.add('is-descent'); set($('.fpv'),{opacity:'1'});
    set($('.space'),{transform:'scale(1.22) translate3d(-1.2%,-1.5%,0)'});set($('.planet'),{transform:'translate(-50%,-50%) scale(1.18)'});set($('.atmo'),{transform:'translate(-50%,-50%) scale(1.2)'});
    tone(70,2.3,'sawtooth',.013);
    await wait(7200);
    if(!playing)return;
    // SHOT 03 — atmosphere break and wide city reveal, with a real hold.
    await hideCopy();
    showCopy('VISUAL LOCK','CITYSPINE','Nara ven sol...', 'WELCOME TO THE OLD QUARTER.');
    set($('.city'),{transform:'translateX(-50%) scale(.9)',opacity:'1'});set($('.horizon'),{opacity:'1'});set($('.space'),{transform:'scale(1.34) translate3d(1.4%,-1.2%,0)'});
    tone(220,.9,'triangle',.024);
    await wait(7600);
    if(!playing)return;
    // SHOT 04 — street-level first-person arrival.
    showCopy('ARRIVAL CONFIRMED','RELAY RUNNER','Seith nal. Vara ten.','WALK THE LINE. KEEP IT ALIVE.');
    set($('.city'),{transform:'translateX(-50%) scale(1.28)',opacity:'1'});set($('.space'),{transform:'scale(1.48) translate3d(-1%,.7%,0)'});
    set($('.fpv'),{opacity:'.88'});tone(110,1.4,'sine',.022);
    speak('Welcome to the Old Quarter. Walk the line. Keep it alive.');
    await wait(6200);
    if(!playing)return;
    // SHOT 05 — final still frame before the handoff.
    await hideCopy();
    showCopy('RELAY NETWORK','YOUR RUN BEGINS','Kara ven, runner.','FOLLOW THE RELAY.');
    await wait(3800);
    if(!playing)return;
    set($('.black'),{opacity:'1'});await wait(1200);reset();
    savedClick=true;
    start.click();
  }

  function stop(){ if(!playing)return; playing=false; stopVoice(); root.hidden=true; }

  const originalAdd=start.addEventListener.bind(start);
  start.addEventListener('click', event => {
    if(savedClick){savedClick=false;return;}
    if(playing)return;
    event.preventDefault();event.stopImmediatePropagation();
    play().catch(()=>{reset();savedClick=true;start.click();});
  },true);
  $('.skip').addEventListener('click', event => { event.stopPropagation(); stop(); savedClick=true; start.click(); });
  window.addEventListener('keydown', event => { if(playing && event.key === 'Enter'){event.preventDefault();$('.skip').click();} });
})();
