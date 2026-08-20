(() => {
  'use strict';

  const KEY = 'relay.runner.cinematicArrival.v3.played';
  const startButton = document.getElementById('start');
  if (!startButton || window.__relayCinematicArrivalV4) return;
  window.__relayCinematicArrivalV4 = true;

  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  let active = false;
  let savedClick = false;
  let timers = [];
  let narration;

  const css = `
    #relayCinematicArrivalV3{position:fixed;inset:0;z-index:2147483640;background:#02050a;color:#e9fbff;overflow:hidden;isolation:isolate;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    #relayCinematicArrivalV3[hidden]{display:none}
    #relayCinematicArrivalV3 .frame{position:absolute;inset:0;opacity:0;transition:opacity 1.8s ease}
    #relayCinematicArrivalV3 .frame.show{opacity:1}
    #relayCinematicArrivalV3 .space{position:absolute;inset:-5%;background:radial-gradient(circle at 50% 38%,#143246 0,#07131f 30%,#020812 70%,#000 100%)}
    #relayCinematicArrivalV3 .stars{position:absolute;inset:0;background-image:radial-gradient(circle,#fff 0 1px,transparent 1.8px),radial-gradient(circle,#77eaff 0 1px,transparent 1.8px);background-size:150px 160px,230px 240px;background-position:22px 26px,100px 90px;opacity:.42}
    #relayCinematicArrivalV3 .planet{position:absolute;left:50%;top:46%;width:min(58vw,620px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%) scale(.62);background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.78) 0 3%,transparent 15%),radial-gradient(circle at 33% 34%,#5fa9be 0 10%,#2b6f87 25%,#12465c 49%,#061a29 76%,#020913 100%);box-shadow:-40px -26px 80px rgba(111,239,255,.15),45px 42px 110px rgba(0,0,0,.94),inset -28px -18px 48px rgba(0,0,0,.62)}
    #relayCinematicArrivalV3 .planet-line{position:absolute;left:50%;top:46%;width:min(68vw,740px);aspect-ratio:1;transform:translate(-50%,-50%) scale(.66);border-radius:50%;border:1px solid rgba(125,235,255,.14);box-shadow:0 0 70px rgba(53,208,245,.07)}
    #relayCinematicArrivalV3 .city{position:absolute;inset:auto -5% 0;height:52%;opacity:.98;transform:translate3d(0,0,0)}
    #relayCinematicArrivalV3 .building{position:absolute;bottom:0;background:linear-gradient(#0a1e2e,#02070d);border:1px solid rgba(125,235,255,.1);box-shadow:0 -12px 35px rgba(40,198,235,.05)}
    #relayCinematicArrivalV3 .building:after{content:"";position:absolute;inset:11% 22%;background:repeating-linear-gradient(180deg,rgba(135,239,255,.3) 0 2px,transparent 2px 13px);opacity:.25}
    #relayCinematicArrivalV3 .building:nth-child(1){left:2%;width:8%;height:45%}.building:nth-child(2){left:11%;width:7%;height:72%}.building:nth-child(3){left:19%;width:8%;height:53%}.building:nth-child(4){left:29%;width:6%;height:83%}.building:nth-child(5){left:37%;width:10%;height:64%}.building:nth-child(6){left:49%;width:7%;height:90%}.building:nth-child(7){left:58%;width:9%;height:58%}.building:nth-child(8){left:69%;width:7%;height:78%}.building:nth-child(9){left:78%;width:10%;height:49%}.building:nth-child(10){left:90%;width:7%;height:70%}
    #relayCinematicArrivalV3 .road{position:absolute;left:50%;bottom:-12%;width:70%;height:35%;transform:translateX(-50%) perspective(500px) rotateX(58deg);background:linear-gradient(180deg,rgba(8,17,27,.2),rgba(1,4,8,.95));opacity:.9}
    #relayCinematicArrivalV3 .road-line{position:absolute;left:50%;bottom:0;width:3px;height:90%;background:repeating-linear-gradient(180deg,rgba(135,239,255,.22) 0 18px,transparent 18px 38px);transform:translateX(-50%) skewX(-9deg);opacity:.5}
    #relayCinematicArrivalV3 .haze{position:absolute;inset:30% -10% 0;background:linear-gradient(180deg,transparent,rgba(43,151,186,.08) 35%,rgba(0,0,0,.76) 100%);pointer-events:none}
    #relayCinematicArrivalV3 .vignette{position:absolute;inset:0;background:radial-gradient(circle,transparent 35%,rgba(0,0,0,.18) 67%,rgba(0,0,0,.84) 100%);pointer-events:none}
    #relayCinematicArrivalV3 .letterbox{position:absolute;left:0;right:0;height:8%;background:#000;z-index:4;opacity:0;transition:opacity 1.2s ease}.letterbox.top{top:0}.letterbox.bottom{bottom:0}
    #relayCinematicArrivalV3 .copy{position:absolute;left:50%;top:73%;width:min(860px,88vw);transform:translate(-50%,-50%);text-align:center;z-index:5;opacity:0;transition:opacity 1.2s ease,transform 1.2s ease}.copy.show{opacity:1;transform:translate(-50%,-50%)}
    #relayCinematicArrivalV3 .kicker{margin:0 0 12px;color:#8defff;font-size:clamp(9px,1vw,12px);letter-spacing:.3em;text-transform:uppercase}
    #relayCinematicArrivalV3 .title{margin:0;font-size:clamp(30px,5vw,72px);line-height:.95;letter-spacing:.08em;text-transform:uppercase;font-weight:900;text-shadow:0 0 30px rgba(141,244,255,.12)}
    #relayCinematicArrivalV3 .line{margin:15px 0 0;color:#c8dce2;font-size:clamp(12px,1.35vw,18px);line-height:1.6}.line em{display:block;margin-top:8px;color:#fff;opacity:.78;font-style:normal;font-size:.82em}
    #relayCinematicArrivalV3 .topline{position:absolute;z-index:5;left:clamp(16px,4vw,50px);top:clamp(18px,4vh,36px);display:flex;gap:11px;align-items:center;color:#91d9e7;font-size:clamp(9px,1vw,12px);letter-spacing:.15em;text-transform:uppercase;opacity:0;transition:opacity 1s ease}.topline.show{opacity:1}.dot{width:6px;height:6px;border-radius:50%;background:#19c8f5;box-shadow:0 0 16px #19c8f5}
    #relayCinematicArrivalV3 .meta{position:absolute;z-index:5;left:50%;bottom:34px;transform:translateX(-50%);display:flex;gap:12px;align-items:center;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#8ea7b5;opacity:0;transition:opacity 1s ease}.meta.show{opacity:1}.meta b{color:#ecfcff}
    #relayCinematicArrivalV3 .skip{position:absolute;z-index:7;right:max(14px,env(safe-area-inset-right,0px)+12px);bottom:max(14px,env(safe-area-inset-bottom,0px)+12px);background:rgba(3,10,18,.78);border:1px solid rgba(141,244,255,.3);color:#e9fbff;padding:10px 13px;font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;opacity:0;transition:opacity .8s ease;cursor:pointer}.skip.show{opacity:1}
    @keyframes softPanA{from{transform:translate3d(-.35%,-.2%,0) scale(1.035)}to{transform:translate3d(.35%,.2%,0) scale(1.045)}}
    @keyframes softPanB{from{transform:translate3d(.25%,0,0) scale(1.04)}to{transform:translate3d(-.25%,-.15%,0) scale(1.05)}}
    #relayCinematicArrivalV3 .pan-a{animation:softPanA 12s ease-in-out infinite alternate}.pan-b{animation:softPanB 14s ease-in-out infinite alternate}
    @media(max-width:760px){#relayCinematicArrivalV3 .planet{width:min(82vw,500px)}#relayCinematicArrivalV3 .planet-line{width:min(95vw,600px)}#relayCinematicArrivalV3 .copy{top:75%;width:90vw}#relayCinematicArrivalV3 .letterbox{height:6%}#relayCinematicArrivalV3 .meta{bottom:72px}}
    @media(prefers-reduced-motion:reduce){#relayCinematicArrivalV3 *{animation:none!important;transition:none!important}}
  `;

  const style=document.createElement('style');style.id='relay-cinematic-arrival-v3-style';style.textContent=css;document.head.appendChild(style);
  const root=document.createElement('section');root.id='relayCinematicArrivalV3';root.hidden=true;
  root.innerHTML=`<div class="frame"><div class="space pan-a"><div class="stars"></div></div><div class="planet"></div><div class="planet-line"></div></div><div class="frame"><div class="space pan-b"><div class="stars"></div></div><div class="planet" style="transform:translate(-50%,-50%) scale(.78)"></div><div class="planet-line" style="transform:translate(-50%,-50%) scale(.82)"></div></div><div class="frame"><div class="space pan-a"><div class="stars"></div></div><div class="planet" style="transform:translate(-50%,-50%) scale(1.05)"></div><div class="planet-line" style="transform:translate(-50%,-50%) scale(1.08)"></div><div class="haze"></div></div><div class="frame"><div class="space pan-b"><div class="stars"></div></div><div class="city">${Array.from({length:10},()=>'<span class="building"></span>').join('')}</div><div class="road"><div class="road-line"></div></div><div class="haze"></div></div><div class="frame"><div class="space pan-a"><div class="stars"></div></div><div class="city">${Array.from({length:10},()=>'<span class="building"></span>').join('')}</div><div class="road"><div class="road-line"></div></div><div class="haze"></div></div><div class="vignette"></div><div class="letterbox top"></div><div class="letterbox bottom"></div><div class="topline"><span class="dot"></span><span>ARRIVAL CONTROL // ONLINE</span></div><div class="meta"><span>SECTOR</span><b>OLD QUARTER</b><span>·</span><span>VECTOR</span><b>R-17</b></div><div class="copy"></div><button class="skip" type="button">SKIP CINEMATIC · ENTER</button>`;
  document.body.appendChild(root);

  const $=selector=>root.querySelector(selector);const frames=[...root.querySelectorAll('.frame')];
  const wait=ms=>new Promise(resolve=>{const id=setTimeout(resolve,reduced()?Math.min(ms,220):ms);timers.push(id)});
  const showFrame=async(index)=>{frames.forEach((frame,i)=>frame.classList.toggle('show',i===index));await wait(1900)};
  const showCopy=(kicker,title,foreign,translation)=>{const n=$('.copy');n.innerHTML=`<p class="kicker">${kicker}</p><h1 class="title">${title}</h1><p class="line">${foreign}${translation?`<em>${translation}</em>`:''}</p>`;n.classList.add('show')};
  const hideCopy=async()=>{$('.copy').classList.remove('show');await wait(1500)};
  function speak(text){if(!('speechSynthesis' in window))return;try{window.speechSynthesis.cancel();narration=new SpeechSynthesisUtterance(text);const voices=window.speechSynthesis.getVoices?.()||[];narration.voice=voices.find(v=>/Daniel|George|David|Guy|James/i.test(v.name))||null;narration.lang='en-US';narration.rate=.78;narration.pitch=.66;narration.volume=.78;window.speechSynthesis.speak(narration)}catch{}}
  function stopSpeech(){try{window.speechSynthesis?.cancel()}catch{}}

  async function play(){
    if(active)return;active=true;savedClick=true;root.hidden=false;timers=[];
    $('.skip').classList.add('show');$('.topline').classList.add('show');$('.meta').classList.remove('show');$('.letterbox').style.opacity='.92';
    await showFrame(0);showCopy('UNKNOWN TRANSMISSION','VISOR BOOT','Va-kora seith... nal ir ven.','THE RELAY IS STILL ACTIVE.');speak('The relay is still active.');await wait(5200);await hideCopy();
    await showFrame(1);showCopy('ORBITAL APPROACH','NEW WORLD','Asha ven tor. Kera il nath.','DO NOT TRUST THE SIGNAL.');speak('Do not trust the signal.');await wait(6800);await hideCopy();
    await showFrame(2);showCopy('ATMOSPHERIC ENTRY','THE DESCENT','Vel sha... ven.','DROP VECTOR R SEVENTEEN CONFIRMED.');speak('Drop vector R seventeen confirmed.');await wait(7200);await hideCopy();
    await showFrame(3);showCopy('VISUAL LOCK','CITYSPINE','Nara ven sol...','WELCOME TO THE OLD QUARTER.');speak('Welcome to the Old Quarter.');$('.meta').classList.add('show');await wait(7600);await hideCopy();
    await showFrame(4);showCopy('ARRIVAL CONFIRMED','RELAY RUNNER','Seith nal. Vara ten.','WALK THE LINE. KEEP IT ALIVE.');speak('Walk the line. Keep it alive.');await wait(6200);await hideCopy();
    $('.topline').classList.remove('show');$('.meta').classList.remove('show');$('.letterbox').style.opacity='0';$('.skip').classList.remove('show');await wait(1200);root.hidden=true;active=false;sessionStorage.setItem(KEY,'1');if(savedClick){savedClick=false;startButton.click()}
  }
  function skip(){if(!active)return;timers.forEach(clearTimeout);timers=[];stopSpeech();active=false;root.hidden=true;sessionStorage.setItem(KEY,'1');if(savedClick){savedClick=false;startButton.click()}}
  startButton.addEventListener('click',event=>{if(event.defaultPrevented||active||sessionStorage.getItem(KEY)==='1')return;event.preventDefault();event.stopImmediatePropagation();play()},true);
  $('.skip').addEventListener('click',skip);document.addEventListener('keydown',event=>{if(active&&event.key==='Enter'){event.preventDefault();skip()}},{capture:true});
})();
