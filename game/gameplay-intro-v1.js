import { missions } from './missions.js';

(() => {
  'use strict';

  const start = document.getElementById('start');
  if (!start || window.__relayGameplayIntroV1) return;
  window.__relayGameplayIntroV1 = true;

  const storageKey = 'relay.runner.gameplayIntro.v1.played';
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  const mission = missions?.[0] || { title: 'FIRST DELIVERY', district: 'OLD QUARTER', objective: 'Carry the signal across the rooftops.' };

  const style = document.createElement('style');
  style.id = 'relay-gameplay-intro-v1-style';
  style.textContent = `
    #relayGameplayIntroV1{position:fixed;inset:0;z-index:2147483640;background:#02050a;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow:hidden;isolation:isolate}
    #relayGameplayIntroV1[hidden]{display:none}
    #relayGameplayIntroV1 .scene{position:absolute;inset:0;opacity:0;transition:opacity 2.2s ease}
    #relayGameplayIntroV1 .scene.active{opacity:1}
    #relayGameplayIntroV1 .sky{position:absolute;inset:0;background:linear-gradient(180deg,#02050a 0%,#071723 58%,#0c2835 100%)}
    #relayGameplayIntroV1 .stars{position:absolute;inset:0;opacity:.42;background-image:radial-gradient(circle,#fff 0 1px,transparent 1.8px),radial-gradient(circle,#8deeff 0 1px,transparent 1.8px);background-size:150px 160px,230px 240px;background-position:20px 30px,90px 90px}
    #relayGameplayIntroV1 .planet{position:absolute;left:50%;top:37%;width:min(54vw,620px);aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 33% 27%,rgba(255,255,255,.82) 0 3%,transparent 16%),radial-gradient(circle at 34% 35%,#64b7ca 0 10%,#2f748a 25%,#13485e 49%,#071b2a 75%,#020914 100%);box-shadow:-50px -32px 100px rgba(117,239,255,.15),55px 48px 125px rgba(0,0,0,.95),inset -28px -16px 50px rgba(0,0,0,.62)}
    #relayGameplayIntroV1 .orbit{position:absolute;left:50%;top:37%;width:min(65vw,740px);aspect-ratio:1;border:1px solid rgba(141,244,255,.14);border-radius:50%;transform:translate(-50%,-50%) rotate(-17deg)}
    #relayGameplayIntroV1 .orbit::after{content:"";position:absolute;left:18%;top:7%;width:8px;height:8px;border-radius:50%;background:#8df4ff;box-shadow:0 0 18px #8df4ff}
    #relayGameplayIntroV1 .city{position:absolute;left:0;right:0;bottom:0;height:42%;overflow:hidden;background:linear-gradient(180deg,transparent,#010307 83%)}
    #relayGameplayIntroV1 .tower{position:absolute;bottom:0;background:linear-gradient(180deg,#0a2235,#02070d);border:1px solid rgba(141,244,255,.08)}
    #relayGameplayIntroV1 .tower::after{content:"";position:absolute;inset:12% 22%;background:repeating-linear-gradient(180deg,rgba(141,244,255,.3) 0 2px,transparent 2px 13px);opacity:.25}
    #relayGameplayIntroV1 .road{position:absolute;left:50%;bottom:-8%;width:56%;height:35%;transform:translateX(-50%) perspective(700px) rotateX(61deg);background:linear-gradient(180deg,rgba(8,17,27,.1),rgba(1,4,8,.96));opacity:.92}
    #relayGameplayIntroV1 .road::after{content:"";position:absolute;left:50%;top:0;width:2px;height:100%;transform:translateX(-50%);background:repeating-linear-gradient(180deg,rgba(141,244,255,.24) 0 18px,transparent 18px 42px)}
    #relayGameplayIntroV1 .haze{position:absolute;inset:40% 0 0;background:linear-gradient(180deg,transparent,rgba(66,183,218,.06) 35%,rgba(0,0,0,.78) 100%)}
    #relayGameplayIntroV1 .frame{position:absolute;inset:0;border-top:7vh solid rgba(0,0,0,.96);border-bottom:7vh solid rgba(0,0,0,.96);pointer-events:none;opacity:.9}
    #relayGameplayIntroV1 .copy{position:absolute;left:50%;top:72%;width:min(860px,90vw);transform:translate(-50%,-50%);text-align:center;opacity:0;transition:opacity 1.6s ease,transform 1.6s ease}
    #relayGameplayIntroV1 .copy.show{opacity:1;transform:translate(-50%,-50%)}
    #relayGameplayIntroV1 .eyebrow{margin:0 0 14px;color:#8df4ff;font-size:clamp(9px,1vw,12px);letter-spacing:.32em;text-transform:uppercase}
    #relayGameplayIntroV1 h1{margin:0;font-size:clamp(31px,5.2vw,76px);line-height:.95;letter-spacing:.08em;text-transform:uppercase;font-weight:900;text-shadow:0 0 34px rgba(141,244,255,.12)}
    #relayGameplayIntroV1 p{margin:16px 0 0;color:#cbdde3;font-size:clamp(12px,1.4vw,18px);line-height:1.6}
    #relayGameplayIntroV1 p em{display:block;margin-top:9px;color:#fff;font-style:normal;opacity:.76;font-size:.84em}
    #relayGameplayIntroV1 .tag{position:absolute;left:clamp(16px,4vw,52px);top:clamp(18px,4vh,38px);color:#94d9e7;font-size:clamp(9px,1vw,12px);letter-spacing:.15em;text-transform:uppercase;opacity:0;transition:opacity 1.3s ease}.tag.show{opacity:1}
    #relayGameplayIntroV1 .meta{position:absolute;left:50%;bottom:34px;transform:translateX(-50%);display:flex;gap:11px;color:#8ea7b5;font-size:9px;letter-spacing:.18em;text-transform:uppercase;opacity:0;transition:opacity 1.4s ease}.meta.show{opacity:1}.meta b{color:#eafcff}
    #relayGameplayIntroV1 .skip{position:absolute;right:max(14px,env(safe-area-inset-right,0px) + 12px);bottom:max(14px,env(safe-area-inset-bottom,0px) + 12px);border:1px solid rgba(141,244,255,.28);background:rgba(2,8,16,.82);color:#eafcff;padding:10px 13px;font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;cursor:pointer}
    #relayGameplayIntroV1 .scene1 .planet{animation:slowFloat 18s ease-in-out infinite alternate}.scene2 .planet{animation:slowDrift 22s ease-in-out infinite alternate}.scene3 .city{animation:slowCity 20s ease-in-out infinite alternate}.scene4 .city{animation:slowCity2 24s ease-in-out infinite alternate}
    @keyframes slowFloat{from{transform:translate(-50%,-50%) scale(1)}to{transform:translate(-49.2%,-50.6%) scale(1.015)}}
    @keyframes slowDrift{from{transform:translate(-50%,-50%) scale(1)}to{transform:translate(-50.7%,-49.5%) scale(1.02)}}
    @keyframes slowCity{from{transform:translateX(-.8%)}to{transform:translateX(.8%)}} 
    @keyframes slowCity2{from{transform:translateX(.7%)}to{transform:translateX(-.7%)}}
    @media(max-width:760px){#relayGameplayIntroV1 .planet{width:min(88vw,520px);top:34%}#relayGameplayIntroV1 .orbit{width:min(98vw,620px);top:34%}#relayGameplayIntroV1 .city{height:36%}#relayGameplayIntroV1 .copy{top:73%;width:91vw}#relayGameplayIntroV1 .meta{bottom:72px}#relayGameplayIntroV1 .frame{border-top-width:5vh;border-bottom-width:5vh}}
    @media(prefers-reduced-motion:reduce){#relayGameplayIntroV1 *{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('section');
  root.id = 'relayGameplayIntroV1';
  root.hidden = true;
  root.innerHTML = `
    <div class="scene scene1"><div class="sky"></div><div class="stars"></div><div class="planet"></div><div class="orbit"></div></div>
    <div class="scene scene2"><div class="sky"></div><div class="stars"></div><div class="planet"></div><div class="orbit"></div><div class="haze"></div></div>
    <div class="scene scene3"><div class="sky"></div><div class="city">${Array.from({length:10},()=>'<span class="tower"></span>').join('')}</div><div class="road"></div><div class="haze"></div></div>
    <div class="scene scene4"><div class="sky"></div><div class="city">${Array.from({length:10},()=>'<span class="tower"></span>').join('')}</div><div class="road"></div><div class="haze"></div></div>
    <div class="frame"></div>
    <div class="tag">RELAY NETWORK // INCOMING RUN</div>
    <div class="meta"><span>SECTOR</span><b>${String(mission.district || 'OLD QUARTER').toUpperCase()}</b><span>·</span><span>ROUTE</span><b>R-17</b></div>
    <div class="copy"></div>
    <button class="skip" type="button">SKIP INTRO · ENTER</button>
  `;
  document.body.appendChild(root);

  const $ = selector => root.querySelector(selector);
  const scenes = [...root.querySelectorAll('.scene')];
  let active = false;
  let savedClick = false;
  let timers = [];
  let voice;

  const wait = ms => new Promise(resolve => {
    const id = window.setTimeout(resolve, reducedMotion() ? Math.min(ms, 240) : ms);
    timers.push(id);
  });

  const showScene = index => scenes.forEach((scene, i) => scene.classList.toggle('active', i === index));
  const showCopy = (eyebrow, title, foreignLine, translation) => {
    const copy = $('.copy');
    copy.innerHTML = `<p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${foreignLine}<em>${translation}</em></p>`;
    copy.classList.add('show');
  };
  const hideCopy = async () => { $('.copy').classList.remove('show'); await wait(1500); };

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      voice = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices?.() || [];
      voice.voice = voices.find(v => /Daniel|George|David|Guy|James/i.test(v.name)) || null;
      voice.lang = 'en-US';
      voice.rate = .76;
      voice.pitch = .66;
      voice.volume = .78;
      window.speechSynthesis.speak(voice);
    } catch {}
  }

  function stopVoice() { try { window.speechSynthesis?.cancel(); } catch {} }

  function reset() {
    timers.forEach(clearTimeout); timers = []; stopVoice(); active = false; root.hidden = true;
    scenes.forEach(scene => scene.classList.remove('active'));
    $('.copy').classList.remove('show'); $('.tag').classList.remove('show'); $('.meta').classList.remove('show');
  }

  async function play() {
    if (active) return;
    active = true; savedClick = true; root.hidden = false; $('.skip').disabled = false;
    $('.tag').classList.add('show');

    // 00 — Opening silence: establish the world before any text appears.
    showScene(0);
    await wait(2600);
    if (!active) return;

    // 01 — The relay is the story hook.
    showCopy('UNKNOWN TRANSMISSION', 'VISOR LINK', 'Va-kora seith... nal ir ven.', 'THE RELAY IS STILL ACTIVE.');
    speak('The relay is still active.');
    await wait(5200);
    if (!active) return;
    await hideCopy();

    // 02 — The player learns why this world matters.
    showScene(1);
    showCopy('OLD QUARTER // NIGHT SHIFT', String(mission.title || 'FIRST DELIVERY').toUpperCase(), 'Asha ven tor. Kera il nath.', String(mission.objective || 'Carry the signal across the rooftops.'));
    speak('The Old Quarter is dark, but the relay still answers.');
    await wait(7200);
    if (!active) return;
    await hideCopy();

    // 03 — Long city establishing shot. No rapid movement; only soft 2D parallax.
    showScene(2);
    showCopy('ROUTE INCOMING', 'CITYSPINE', 'Nara ven sol... vara ten.', 'THE CITY IS WAITING FOR THE SIGNAL.');
    $('.meta').classList.add('show');
    await wait(8200);
    if (!active) return;
    await hideCopy();

    // 04 — Final gameplay handoff: the player has a reason to run.
    showScene(3);
    showCopy('COURIER CLEARANCE', 'YOUR RUN BEGINS', 'Kara ven, runner.', 'CARRY THE SIGNAL. KEEP THE CITY CONNECTED.');
    speak('Carry the signal. Keep the city connected.');
    await wait(6200);
    if (!active) return;

    $('.tag').classList.remove('show'); $('.meta').classList.remove('show');
    $('.copy').classList.remove('show');
    await wait(1600);

    root.hidden = true;
    active = false;
    sessionStorage.setItem(storageKey, '1');
    if (savedClick) { savedClick = false; start.click(); }
  }

  function skip() {
    if (!active) return;
    timers.forEach(clearTimeout); timers = []; stopVoice(); active = false; root.hidden = true;
    sessionStorage.setItem(storageKey, '1');
    if (savedClick) { savedClick = false; start.click(); }
  }

  start.addEventListener('click', event => {
    if (event.defaultPrevented || active || sessionStorage.getItem(storageKey) === '1') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    play();
  }, true);

  $('.skip').addEventListener('click', skip);
  document.addEventListener('keydown', event => {
    if (active && event.key === 'Enter') { event.preventDefault(); skip(); }
  }, { capture: true });
})();
