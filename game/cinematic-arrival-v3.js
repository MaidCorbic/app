(() => {
  'use strict';

  const KEY = 'relay.runner.cinematicArrival.v3.played';
  const startButton = document.getElementById('start');
  if (!startButton || window.__relayCinematicArrivalV3) return;
  window.__relayCinematicArrivalV3 = true;

  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  let active = false;
  let timers = [];
  let savedClick = false;
  let narration = null;

  const css = `
    #relayCinematicArrivalV3{position:fixed;inset:0;z-index:2147483640;background:#01040a;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow:hidden;isolation:isolate;opacity:1}
    #relayCinematicArrivalV3[hidden]{display:none}
    #relayCinematicArrivalV3 .space{position:absolute;inset:-8%;background:radial-gradient(circle at 50% 42%,#17394f 0,#071725 28%,#020711 62%,#000 100%);transform:scale(1.02)}
    #relayCinematicArrivalV3 .stars{position:absolute;inset:0;background-image:radial-gradient(circle,#fff 0 1px,transparent 1.7px),radial-gradient(circle,#87efff 0 1px,transparent 1.7px),radial-gradient(circle,#fff 0 1px,transparent 1.5px);background-size:120px 140px,185px 210px,260px 240px;opacity:.5}
    #relayCinematicArrivalV3 .planet{position:absolute;left:50%;top:52%;width:min(56vw,620px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%) scale(.34);background:radial-gradient(circle at 32% 28%,rgba(255,255,255,.82) 0 3%,transparent 15%),radial-gradient(circle at 33% 34%,#63b6cc 0 10%,#2b718a 23%,#12465c 48%,#061a2a 73%,#020914 100%);box-shadow:-55px -34px 105px rgba(111,239,255,.18),55px 45px 130px rgba(0,0,0,.95),inset -30px -15px 55px rgba(0,0,0,.62),inset 22px 18px 48px rgba(135,239,255,.1);transition:transform 4.8s cubic-bezier(.16,.76,.2,1),filter 4.8s ease}
    #relayCinematicArrivalV3 .atmo{position:absolute;left:50%;top:52%;width:min(66vw,730px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%) scale(.38);border:1px solid rgba(135,239,255,.18);box-shadow:0 0 120px 30px rgba(25,200,245,.06),inset 0 0 90px rgba(135,239,255,.08);transition:transform 4.8s ease,opacity 4.8s ease}
    #relayCinematicArrivalV3 .city{position:absolute;left:50%;bottom:-4%;width:120%;height:45%;transform:translateX(-50%) scale(.28);opacity:0;transition:transform 4.2s cubic-bezier(.18,.75,.22,1),opacity 2.2s ease}
    #relayCinematicArrivalV3 .building{position:absolute;bottom:0;width:clamp(26px,5vw,85px);background:linear-gradient(180deg,#092033,#02070d);border:1px solid rgba(135,239,255,.08);box-shadow:0 -18px 40px rgba(25,200,245,.05)}
    #relayCinematicArrivalV3 .building:after{content:"";position:absolute;inset:10% 24%;background:repeating-linear-gradient(180deg,rgba(135,239,255,.33) 0 2px,transparent 2px 13px);opacity:.24}
    #relayCinematicArrivalV3 .building:nth-child(1){left:3%;height:56%}.building:nth-child(2){left:12%;height:84%}.building:nth-child(3){left:21%;height:46%}.building:nth-child(4){left:29%;height:72%}.building:nth-child(5){left:39%;height:96%}.building:nth-child(6){left:50%;height:62%}.building:nth-child(7){left:60%;height:79%}.building:nth-child(8){left:71%;height:52%}.building:nth-child(9){left:81%;height:90%}.building:nth-child(10){left:91%;height:44%}
    #relayCinematicArrivalV3 .horizon{position:absolute;left:-5%;right:-5%;bottom:0;height:38%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.24) 20%,#010307 88%);opacity:0;transition:opacity 2.4s ease}
    #relayCinematicArrivalV3 .fpv{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at 50% 56%,transparent 42%,rgba(0,0,0,.2) 67%,rgba(0,0,0,.82) 100%);transition:opacity 1.6s ease}
    #relayCinematicArrivalV3 .fpv:before{content:"";position:absolute;inset:6% 5%;border:1px solid rgba(135,239,255,.08);border-radius:36px 36px 48px 48px;box-shadow:inset 0 0 44px rgba(135,239,255,.03)}
    #relayCinematicArrivalV3 .scan{position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.024) 0 1px,transparent 1px 6px);opacity:.16;pointer-events:none}
    #relayCinematicArrivalV3 .vignette{position:absolute;inset:0;background:radial-gradient(circle at 50% 48%,transparent 30%,rgba(0,0,0,.16) 64%,rgba(0,0,0,.86) 100%);pointer-events:none}
    #relayCinematicArrivalV3 .top{position:absolute;left:max(16px,4vw);top:max(16px,4vh);display:flex;gap:12px;align-items:center;color:#9bdceb;letter-spacing:.16em;font-size:clamp(9px,1vw,12px);text-transform:uppercase;opacity:0;transition:opacity 1s ease}
    #relayCinematicArrivalV3 .top i{width:6px;height:6px;border-radius:50%;background:#19c8f5;box-shadow:0 0 16px #19c8f5;display:block}
    #relayCinematicArrivalV3 .copy{position:absolute;left:50%;top:66%;width:min(820px,88vw);transform:translate(-50%,-50%);text-align:center;opacity:0;transition:opacity 1s ease,transform 1s ease}
    #relayCinematicArrivalV3 .kicker{margin:0 0 13px;font-size:clamp(9px,1vw,12px);letter-spacing:.32em;color:#87efff;text-transform:uppercase}
    #relayCinematicArrivalV3 .title{margin:0;font-size:clamp(30px,5.4vw,76px);line-height:.94;letter-spacing:.08em;font-weight:900;text-transform:uppercase;text-shadow:0 0 34px rgba(135,239,255,.13)}
    #relayCinematicArrivalV3 .line{margin:16px 0 0;font-size:clamp(12px,1.45vw,18px);line-height:1.55;color:#c4d9df;letter-spacing:.04em}
    #relayCinematicArrivalV3 .line em{display:block;margin-top:9px;color:#fff;opacity:.78;font-style:normal;font-size:.82em}
    #relayCinematicArrivalV3 .bottom{position:absolute;left:50%;bottom:34px;transform:translateX(-50%);display:flex;gap:11px;align-items:center;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#8fa6bb;opacity:0;transition:opacity 1s ease}
    #relayCinematicArrivalV3 .bottom b{color:#eafcff}
    #relayCinematicArrivalV3 .radar{position:absolute;right:max(18px,4vw);top:max(20px,8vh);width:100px;height:100px;border:1px solid rgba(135,239,255,.12);border-radius:50%;opacity:0;transition:opacity 1s ease}
    #relayCinematicArrivalV3 .radar:before{content:"";position:absolute;left:50%;top:50%;width:44%;height:1px;background:#87efff66;transform-origin:0 50%;animation:arrivalSweep 2.5s linear infinite}
    #relayCinematicArrivalV3 .radar:after{content:"";position:absolute;inset:12px;border:1px dashed rgba(135,239,255,.09);border-radius:50%}
    #relayCinematicArrivalV3 .skip{position:absolute;right:max(14px,env(safe-area-inset-right,0px) + 12px);bottom:max(14px,env(safe-area-inset-bottom,0px) + 12px);border:1px solid rgba(135,239,255,.28);background:rgba(2,8,16,.78);color:#eafcff;padding:10px 13px;font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;cursor:pointer;opacity:0;transition:opacity .6s ease}
    #relayCinematicArrivalV3 .skip.show{opacity:1}
    @keyframes arrivalSweep{to{transform:rotate(360deg)}}
    @keyframes arrivalDrift{from{transform:scale(1.03) translate3d(-.35%,-.18%,0)}to{transform:scale(1.045) translate3d(.45%,.24%,0)}}
    #relayCinematicArrivalV3.is-descent .space{animation:arrivalDrift 3.5s ease-in-out infinite alternate}
    @media(max-width:760px){#relayCinematicArrivalV3 .planet{width:min(90vw,520px);top:46%}#relayCinematicArrivalV3 .atmo{width:min(100vw,600px);top:46%}#relayCinematicArrivalV3 .copy{top:69%;width:91vw}#relayCinematicArrivalV3 .bottom{bottom:74px}#relayCinematicArrivalV3 .radar{width:72px;height:72px;right:16px}}
    @media(prefers-reduced-motion:reduce){#relayCinematicArrivalV3 *{animation:none!important;transition:none!important}}
  `;

  const style = document.createElement('style');
  style.id = 'relay-cinematic-arrival-v3-style';
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.createElement('section');
  root.id = 'relayCinematicArrivalV3';
  root.hidden = true;
  root.setAttribute('aria-live','polite');
  root.innerHTML = `<div class="space"><div class="stars"></div><div class="atmo"></div><div class="planet"></div><div class="city">${Array.from({length:10},()=>'<span class="building"></span>').join('')}</div><div class="horizon"></div></div><div class="fpv"></div><div class="scan"></div><div class="vignette"></div><div class="top"><i></i><span>ARRIVAL CONTROL // ONLINE</span></div><div class="radar"></div><div class="copy"></div><div class="bottom"><span>SECTOR</span><b>OLD QUARTER</b><span>·</span><span>VECTOR</span><b>R-17</b></div><button class="skip" type="button">SKIP CINEMATIC · ENTER</button>`;
  document.body.appendChild(root);

  const $ = selector => root.querySelector(selector);
  const set = (el, props) => Object.assign(el.style, props);
  const wait = ms => new Promise(resolve => { const id = window.setTimeout(resolve, reduced() ? Math.min(ms,180) : ms); timers.push(id); });
  const showCopy = (kicker,title,foreign,translation) => { const node=$('.copy'); node.innerHTML=`<p class="kicker">${kicker}</p><h1 class="title">${title}</h1><p class="line">${foreign}${translation ? `<em>${translation}</em>` : ''}</p>`; set(node,{opacity:'1',transform:'translate(-50%,-50%)'}); };
  const hideCopy = async () => { set($('.copy'),{opacity:'0',transform:'translate(-50%,-46%)'}); await wait(700); };

  function speak(text){
    if(!('speechSynthesis' in window)) return;
    try{
      window.speechSynthesis.cancel();
      narration = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices?.() || [];
      narration.voice = voices.find(v=>/Daniel|George|David|Guy|James/i.test(v.name)) || null;
      narration.lang = 'en-US';
      narration.rate = .82;
      narration.pitch = .68;
      narration.volume = .78;
      window.speechSynthesis.speak(narration);
    }catch{}
  }

  function stopSpeech(){ try{ window.speechSynthesis?.cancel(); }catch{} }

  let audioContext;
  function tone(freq,duration=.2,type='sine',volume=.018){
    const C = window.AudioContext || window.webkitAudioContext;
    if(!C || document.body.classList.contains('audio-off')) return;
    try{
      audioContext ||= new C();
      if(audioContext.state === 'suspended') audioContext.resume();
      const now=audioContext.currentTime;
      const osc=audioContext.createOscillator();
      const gain=audioContext.createGain();
      osc.type=type;
      osc.frequency.setValueAtTime(freq,now);
      gain.gain.setValueAtTime(volume,now);
      gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(now);
      osc.stop(now+duration);
    }catch{}
  }

  function reset(){
    timers.forEach(clearTimeout);
    timers=[];
    stopSpeech();
    active=false;
    root.hidden=true;
    root.classList.remove('is-descent');
    set($('.space'),{transform:'scale(1.02)'});
    set($('.planet'),{transform:'translate(-50%,-50%) scale(.34)',opacity:'1'});
    set($('.atmo'),{transform:'translate(-50%,-50%) scale(.38)',opacity:'1'});
    set($('.city'),{transform:'translateX(-50%) scale(.28)',opacity:'0'});
    set($('.horizon'),{opacity:'0'});
    set($('.fpv'),{opacity:'0'});
    set($('.top'),{opacity:'0'});
    set($('.radar'),{opacity:'0'});
    set($('.bottom'),{opacity:'0'});
    set($('.copy'),{opacity:'0',transform:'translate(-50%,-46%)'});
  }

  async function play(){
    if(active) return;
    active=true;
    root.hidden=false;
    const skip=$('.skip');
    skip.classList.add('show');
    set($('.top'),{opacity:'1'});
    showCopy('UNKNOWN TRANSMISSION','VISOR BOOT','Va-kora seith... nal ir ven.','THE RELAY IS STILL ACTIVE.');
    speak('The relay is still active.');
    tone(92,.5,'sine',.032);
    await wait(2600);
    if(!active) return;
    await hideCopy();

    showCopy('ORBITAL APPROACH','NEW WORLD','Asha ven tor. Kera il nath.','DO NOT TRUST THE SIGNAL.');
    set($('.radar'),{opacity:'1'});
    set($('.planet'),{transform:'translate(-50%,-50%) scale(.72)'});
    set($('.atmo'),{transform:'translate(-50%,-50%) scale(.73)'});
    speak('Do not trust the signal.');
    tone(174,.9,'triangle',.024);
    await wait(4000);
    if(!active) return;
    await hideCopy();

    root.classList.add('is-descent');
    showCopy('ATMOSPHERIC ENTRY','DESCENT','Vel sha... ven.','DROP VECTOR R-17 CONFIRMED.');
    set($('.space'),{transform:'scale(1.13) translate3d(-1.3%,-1.2%,0)'});
    set($('.planet'),{transform:'translate(-50%,-50%) scale(1.12)'});
    set($('.atmo'),{transform:'translate(-50%,-50%) scale(1.14)'});
    set($('.fpv'),{opacity:'1'});
    speak('Drop vector R seventeen confirmed.');
    tone(68,1.4,'sawtooth',.014);
    await wait(4200);
    if(!active) return;
    await hideCopy();

    showCopy('VISUAL LOCK','CITYSPINE','Nara ven sol...','WELCOME TO THE OLD QUARTER.');
    set($('.planet'),{transform:'translate(-50%,-50%) scale(1.58)',opacity:'.35'});
    set($('.atmo'),{transform:'translate(-50%,-50%) scale(1.72)',opacity:'.28'});
    set($('.space'),{transform:'scale(1.31) translate3d(1.4%,-1.2%,0)'});
    set($('.city'),{transform:'translateX(-50%) scale(.9)',opacity:'1'});
    set($('.horizon'),{opacity:'1'});
    speak('Welcome to the Old Quarter.');
    tone(246,1,'triangle',.024);
    await wait(4400);
    if(!active) return;
    await hideCopy();

    showCopy('ARRIVAL CONFIRMED','RELAY RUNNER','Seith nal. Vara ten.','WALK THE LINE. KEEP IT ALIVE.');
    set($('.city'),{transform:'translateX(-50%) scale(1.18)',opacity:'1'});
    set($('.bottom'),{opacity:'1'});
    speak('Walk the line. Keep it alive.');
    tone(330,1.1,'triangle',.018);
    await wait(3500);
    if(!active) return;

    showCopy('RELAY NETWORK','YOUR RUN BEGINS','Kara ven, runner.','FOLLOW THE RELAY.');
    speak('Follow the relay.');
    await wait(1800);
    await hideCopy();
    set($('.top'),{opacity:'0'});
    set($('.radar'),{opacity:'0'});
    set($('.bottom'),{opacity:'0'});
    set(root,{transition:'opacity .7s ease',opacity:'0'});
    await wait(760);
    root.hidden=true;
    root.style.opacity='1';
    active=false;
    sessionStorage.setItem(KEY,'1');
    if(savedClick){
      savedClick=false;
      startButton.click();
    }
  }

  function intercept(event){
    if(event.defaultPrevented || active || sessionStorage.getItem(KEY) === '1') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    savedClick=true;
    play();
  }

  startButton.addEventListener('click',intercept,true);
  $('.skip').addEventListener('click',()=>{ if(!active) return; active=false; timers.forEach(clearTimeout); timers=[]; stopSpeech(); root.hidden=true; root.style.opacity='1'; sessionStorage.setItem(KEY,'1'); if(savedClick){savedClick=false;startButton.click();} });

  if(sessionStorage.getItem(KEY)==='1') window.__relayCinematicArrivalV3Completed=true;
})();
