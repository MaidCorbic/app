(() => {
  'use strict';

  const KEY = 'relay.runner.cinematicArrival.v1.played';
  const startButton = document.getElementById('start');
  if (!startButton || window.__relayCinematicArrivalV1) return;

  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  const touch = () => document.body.classList.contains('is-touch') || window.matchMedia?.('(pointer:coarse)')?.matches;
  let active = false;
  let replayGuard = false;

  const CSS = `
    #relayCinematicArrival {
      --cyan:#19c8f5;
      --ice:#8df4ff;
      --ink:#02050d;
      --panel:rgba(3,10,20,.78);
      position:fixed; inset:0; z-index:2147483640; overflow:hidden;
      background:radial-gradient(circle at 50% 55%,#0b2940 0,#030b17 36%,#010308 76%);
      color:#e9fdff; font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
      opacity:1; visibility:visible; pointer-events:auto;
      isolation:isolate;
    }
    #relayCinematicArrival[hidden]{display:none}
    #relayCinematicArrival .ca-space{position:absolute;inset:-10%;transform:scale(1.04);will-change:transform,filter}
    #relayCinematicArrival .ca-stars,
    #relayCinematicArrival .ca-stars::before,
    #relayCinematicArrival .ca-stars::after{
      position:absolute;inset:0;content:"";background-repeat:repeat;
      background-image:radial-gradient(circle,#fff 0 1px,transparent 1.8px),radial-gradient(circle,#8df4ff 0 1px,transparent 1.8px),radial-gradient(circle,#fff 0 1px,transparent 1.5px);
      background-size:110px 130px,170px 190px,250px 220px;
      background-position:20px 34px,70px 100px,120px 42px;opacity:.55;
    }
    #relayCinematicArrival .ca-stars::before{opacity:.32;transform:scale(1.35)}
    #relayCinematicArrival .ca-stars::after{opacity:.18;transform:scale(1.8)}
    #relayCinematicArrival .ca-planet{
      position:absolute;left:50%;top:54%;width:min(52vw,560px);aspect-ratio:1;border-radius:50%;
      transform:translate(-50%,-50%) scale(.7);background:
      radial-gradient(circle at 34% 28%,rgba(255,255,255,.72) 0 4%,transparent 15%),
      radial-gradient(circle at 34% 32%,#4d9dbb 0 12%,#1f6685 30%,#0c3049 54%,#05121f 78%);
      box-shadow:-42px -30px 90px rgba(141,244,255,.18),45px 35px 110px rgba(0,0,0,.92),inset -22px -12px 45px rgba(0,0,0,.58),inset 20px 14px 45px rgba(141,244,255,.12);
      will-change:transform,filter;overflow:hidden;
    }
    #relayCinematicArrival .ca-planet::before{
      content:"";position:absolute;inset:-8%;border-radius:50%;
      background:repeating-radial-gradient(circle at 41% 44%,transparent 0 7%,rgba(141,244,255,.05) 8% 8.6%,transparent 9% 14%);
      transform:rotate(-22deg) scale(1.15);mix-blend-mode:screen;
    }
    #relayCinematicArrival .ca-atmo{
      position:absolute;left:50%;top:54%;width:min(60vw,650px);aspect-ratio:1;border-radius:50%;
      transform:translate(-50%,-50%) scale(.72);border:1px solid rgba(141,244,255,.14);
      box-shadow:0 0 110px 28px rgba(25,200,245,.08),inset 0 0 100px rgba(141,244,255,.08);filter:blur(1px);
    }
    #relayCinematicArrival .ca-city{
      position:absolute;left:50%;bottom:-10%;width:120%;height:40%;transform:translateX(-50%) scale(.58);transform-origin:50% 100%;
      opacity:0;will-change:transform,opacity;filter:contrast(1.08) saturate(.86);
    }
    #relayCinematicArrival .ca-city span{position:absolute;bottom:0;width:clamp(26px,5vw,80px);border:1px solid rgba(141,244,255,.1);background:linear-gradient(#071421,#02070d);box-shadow:0 -12px 30px rgba(25,200,245,.045)}
    #relayCinematicArrival .ca-city span::after{content:"";position:absolute;left:25%;right:25%;top:15%;bottom:15%;background:repeating-linear-gradient(180deg,rgba(141,244,255,.32) 0 2px,transparent 2px 12px);opacity:.32}
    #relayCinematicArrival .ca-city span:nth-child(1){left:2%;height:58%}.ca-city span:nth-child(2){left:11%;height:88%}.ca-city span:nth-child(3){left:21%;height:48%}.ca-city span:nth-child(4){left:28%;height:72%}.ca-city span:nth-child(5){left:39%;height:96%}.ca-city span:nth-child(6){left:49%;height:62%}.ca-city span:nth-child(7){left:60%;height:82%}.ca-city span:nth-child(8){left:71%;height:54%}.ca-city span:nth-child(9){left:81%;height:92%}.ca-city span:nth-child(10){left:91%;height:46%}
    #relayCinematicArrival .ca-horizon{position:absolute;left:-5%;right:-5%;bottom:0;height:34%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.32) 25%,#010306 90%);opacity:0}
    #relayCinematicArrival .ca-vignette{position:absolute;inset:0;background:radial-gradient(circle,transparent 36%,rgba(0,0,0,.16) 68%,rgba(0,0,0,.82) 100%);pointer-events:none}
    #relayCinematicArrival .ca-scan{position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.025) 0 1px,transparent 1px 5px);mix-blend-mode:screen;opacity:.22;pointer-events:none}
    #relayCinematicArrival .ca-flash{position:absolute;inset:0;background:#dffcff;opacity:0;pointer-events:none}
    #relayCinematicArrival .ca-fpv{
      position:absolute;inset:0;opacity:0;pointer-events:none;will-change:transform,opacity;transform-origin:50% 55%;
      background:radial-gradient(ellipse at 50% 54%,transparent 44%,rgba(0,0,0,.18) 65%,rgba(0,0,0,.78) 100%);
    }
    #relayCinematicArrival .ca-fpv::before{content:"";position:absolute;inset:7% 6%;border:1px solid rgba(141,244,255,.09);border-radius:34px 34px 48px 48px;box-shadow:inset 0 0 34px rgba(141,244,255,.035)}
    #relayCinematicArrival .ca-ui{position:absolute;inset:0;pointer-events:none}
    #relayCinematicArrival .ca-topline{position:absolute;left:clamp(16px,4vw,52px);top:clamp(16px,4vh,34px);display:flex;gap:12px;align-items:center;opacity:0;font-size:clamp(9px,1vw,12px);letter-spacing:.14em;text-transform:uppercase;color:#9ad8e9;text-shadow:0 0 15px #19c8f544}
    #relayCinematicArrival .ca-topline i{display:block;width:6px;height:6px;border-radius:50%;background:var(--cyan);box-shadow:0 0 14px var(--cyan)}
    #relayCinematicArrival .ca-copy{position:absolute;left:50%;top:63%;width:min(760px,88vw);transform:translate(-50%,-50%);text-align:center;opacity:0;will-change:transform,opacity}
    #relayCinematicArrival .ca-eyebrow{font-size:clamp(9px,1.1vw,12px);letter-spacing:.3em;color:#8df4ff;text-transform:uppercase;margin:0 0 14px}
    #relayCinematicArrival .ca-title{font-size:clamp(28px,5vw,72px);line-height:.94;letter-spacing:.08em;margin:0;font-weight:900;text-transform:uppercase;text-shadow:0 0 30px rgba(141,244,255,.11)}
    #relayCinematicArrival .ca-sub{margin:14px 0 0;font-size:clamp(12px,1.4vw,18px);line-height:1.55;color:#bfd7df;letter-spacing:.05em}
    #relayCinematicArrival .ca-sub em{display:block;font-style:normal;color:#fff;font-size:.82em;opacity:.76;margin-top:8px}
    #relayCinematicArrival .ca-bottom{position:absolute;left:50%;bottom:clamp(18px,4vh,36px);transform:translateX(-50%);display:flex;gap:10px;align-items:center;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#8fa6bb;opacity:0}
    #relayCinematicArrival .ca-bottom b{color:#e9fdff}
    #relayCinematicArrival .ca-skip{position:absolute;right:max(14px,env(safe-area-inset-right,0px) + 12px);bottom:max(14px,env(safe-area-inset-bottom,0px) + 12px);pointer-events:auto;opacity:0;border:1px solid rgba(141,244,255,.28);background:rgba(3,10,20,.7);color:#dffcff;padding:9px 12px;font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;backdrop-filter:blur(8px);cursor:pointer}
    #relayCinematicArrival .ca-radar{position:absolute;right:clamp(18px,4vw,56px);top:clamp(18px,7vh,72px);width:96px;height:96px;border:1px solid rgba(141,244,255,.12);border-radius:50%;opacity:0}
    #relayCinematicArrival .ca-radar::before{content:"";position:absolute;inset:50% auto auto 50%;width:45%;height:1px;background:#8df4ff66;transform-origin:0 50%;animation:caSweep 2.1s linear infinite}
    #relayCinematicArrival .ca-radar::after{content:"";position:absolute;inset:12px;border:1px dashed rgba(141,244,255,.09);border-radius:50%}
    @keyframes caSweep{to{transform:rotate(360deg)}}
    #relayCinematicArrival.is-landing .ca-space{animation:caHandheld 1.8s ease-in-out infinite alternate}
    @keyframes caHandheld{from{transform:translate3d(-.6%,-.3%,0) scale(1.025)}to{transform:translate3d(.7%,.4%,0) scale(1.035)}}
    @media(max-width:760px){
      #relayCinematicArrival .ca-planet{width:min(88vw,520px);top:48%}
      #relayCinematicArrival .ca-atmo{width:min(98vw,590px);top:48%}
      #relayCinematicArrival .ca-city{height:34%}
      #relayCinematicArrival .ca-copy{top:66%;width:90vw}
      #relayCinematicArrival .ca-bottom{bottom:76px}
      #relayCinematicArrival .ca-skip{bottom:calc(12px + env(safe-area-inset-bottom,0px))}
      #relayCinematicArrival .ca-radar{width:74px;height:74px;right:16px}
    }
    @media(prefers-reduced-motion:reduce){
      #relayCinematicArrival *{animation:none!important;transition:none!important}
    }
  `;

  const style = document.createElement('style');
  style.id = 'relay-cinematic-arrival-v1-style';
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('section');
  root.id = 'relayCinematicArrival';
  root.hidden = true;
  root.setAttribute('aria-live', 'polite');
  root.innerHTML = `
    <div class="ca-space">
      <div class="ca-stars"></div>
      <div class="ca-atmo"></div>
      <div class="ca-planet"></div>
      <div class="ca-city">${Array.from({length:10},(_,i)=>`<span aria-hidden="true"></span>`).join('')}</div>
      <div class="ca-horizon"></div>
    </div>
    <div class="ca-fpv"></div>
    <div class="ca-vignette"></div>
    <div class="ca-scan"></div>
    <div class="ca-flash"></div>
    <div class="ca-ui">
      <div class="ca-topline"><i></i><span>RELAY ARRIVAL SYSTEM // ONLINE</span></div>
      <div class="ca-radar"></div>
      <div class="ca-copy"></div>
      <div class="ca-bottom"><span>SECTOR</span><b>OLD QUARTER</b><span>·</span><span>VECTOR</span><b>R-17</b></div>
      <button class="ca-skip" type="button">SKIP CINEMATIC · ENTER</button>
    </div>
  `;
  document.body.appendChild(root);

  const qs = selector => root.querySelector(selector);
  const copy = (eyebrow, title, foreign, translation = '') => {
    const node = qs('.ca-copy');
    node.innerHTML = `<p class="ca-eyebrow">${eyebrow}</p><h1 class="ca-title">${title}</h1><p class="ca-sub">${foreign}${translation ? `<em>${translation}</em>` : ''}</p>`;
    return node;
  };
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, reducedMotion() ? Math.min(ms, 140) : ms));

  function narrate(text, lang = 'en-US') {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const line = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices?.() || [];
      line.voice = voices.find(v => /Daniel|George|James|David|Guy|Male/i.test(v.name)) || null;
      line.lang = lang;
      line.rate = .88;
      line.pitch = .72;
      line.volume = .75;
      window.speechSynthesis.speak(line);
    } catch {}
  }

  let audioContext;
  const tone = (frequency, duration, type='sine', gain=.028) => {
    if (reducedMotion() && frequency > 500) return;
    if (document.body.classList.contains('audio-off')) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      audioContext ||= new AudioContext();
      if (audioContext.state === 'suspended') audioContext.resume();
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      volume.gain.setValueAtTime(gain, now);
      volume.gain.exponentialRampToValueAtTime(.0001, now + duration);
      oscillator.connect(volume).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch {}
  };

  async function runCinematic() {
    if (active) return;
    active = true;
    root.hidden = false;
    root.classList.remove('is-landing');
    const skip = qs('.ca-skip');
    const space = qs('.ca-space');
    const planet = qs('.ca-planet');
    const atmo = qs('.ca-atmo');
    const city = qs('.ca-city');
    const horizon = qs('.ca-horizon');
    const copyNode = qs('.ca-copy');
    const top = qs('.ca-topline');
    const bottom = qs('.ca-bottom');
    const radar = qs('.ca-radar');
    const flash = qs('.ca-flash');
    const fpv = qs('.ca-fpv');
    const animate = (node, properties, duration = 700) => node?.animate?.(properties, { duration: reducedMotion() ? 1 : duration, fill:'forwards', easing:'cubic-bezier(.22,.76,.22,1)' });
    const set = (node, properties) => { if (!node) return; Object.assign(node.style, properties); };
    const showSkip = () => set(skip, { opacity:'1' });
    const hideSkip = () => set(skip, { opacity:'0' });

    set(top,{opacity:'0'}); set(bottom,{opacity:'0'}); set(radar,{opacity:'0'}); set(copyNode,{opacity:'0'});
    set(planet,{transform:'translate(-50%,-50%) scale(.48)'}); set(atmo,{transform:'translate(-50%,-50%) scale(.5)'});
    set(city,{opacity:'0',transform:'translateX(-50%) scale(.42)'}); set(horizon,{opacity:'0'});
    set(fpv,{opacity:'0',transform:'scale(.98)'}); set(flash,{opacity:'0'});
    showSkip();

    // SHOT 01 — visor boot / black space.
    copy('UNKNOWN TRANSMISSION', 'VISOR BOOT', 'Va\'kora seith... nal ir ven.', 'THE RELAY IS STILL ACTIVE.');
    set(copyNode,{opacity:'1'}); set(top,{opacity:'1'}); tone(110,.22,'sine',.04); await wait(950);
    if (!active) return;

    // SHOT 02 — planet reveal.
    copy('ORBITAL APPROACH', 'NEW WORLD', 'Asha ven tor. Kera il nath.', 'DO NOT TRUST THE SIGNAL.');
    animate(copyNode,[{opacity:0,transform:'translate(-50%,-46%) scale(.98)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],520);
    animate(planet,[{transform:'translate(-50%,-50%) scale(.48)'},{transform:'translate(-50%,-50%) scale(.78)'}],1500);
    animate(atmo,[{transform:'translate(-50%,-50%) scale(.5)'},{transform:'translate(-50%,-50%) scale(.84)'}],1500);
    set(radar,{opacity:'1'}); tone(196,.65,'triangle',.022); await wait(1500);

    // SHOT 03 — first-person camera drift, entering atmosphere.
    root.classList.add('is-landing');
    copy('ATMOSPHERIC ENTRY', 'DESCENT', 'Vel sha... ven.', 'DROP VECTOR R-17 CONFIRMED.');
    animate(space,[{transform:'scale(1.04) translate3d(0,0,0)'},{transform:'scale(1.18) translate3d(-1.8%,-2.2%,0)'}],1650);
    animate(planet,[{transform:'translate(-50%,-50%) scale(.78)'},{transform:'translate(-50%,-50%) scale(1.35)'}],1650);
    animate(atmo,[{transform:'translate(-50%,-50%) scale(.84)'},{transform:'translate(-50%,-50%) scale(1.42)'}],1650);
    animate(fpv,[{opacity:0,transform:'scale(.98)'},{opacity:1,transform:'scale(1.02)'}],900);
    tone(74,1.2,'sawtooth',.016); await wait(1650);

    // SHOT 04 — atmosphere break / city reveal.
    copy('VISUAL LOCK', 'CITYSPINE', 'Nara ven sol...', 'WELCOME TO THE OLD QUARTER.');
    animate(flash,[{opacity:0},{opacity:.22},{opacity:0}],700);
    animate(space,[{transform:'scale(1.18) translate3d(-1.8%,-2.2%,0)'},{transform:'scale(1.34) translate3d(1.8%,-1.8%,0)'}],1400);
    animate(city,[{opacity:0,transform:'translateX(-50%) scale(.42)'},{opacity:1,transform:'translateX(-50%) scale(.95)'}],1500);
    animate(horizon,[{opacity:0},{opacity:1}],1000);
    animate(copyNode,[{opacity:1},{opacity:.92}],500); tone(248,.8,'triangle',.024); await wait(1450);

    // SHOT 05 — handheld street-level landing.
    copy('ARRIVAL CONFIRMED', 'RELAY RUNNER', 'Seith nal. Vara ten.', 'WALK THE LINE. KEEP IT ALIVE.');
    animate(space,[{transform:'scale(1.34) translate3d(1.8%,-1.8%,0)'},{transform:'scale(1.5) translate3d(-1.2%,.7%,0)'}],1200);
    animate(city,[{transform:'translateX(-50%) scale(.95)'},{transform:'translateX(-50%) scale(1.18)'}],1200);
    set(bottom,{opacity:'1'});
    await wait(1150);

    // SHOT 06 — convert cinematic HUD to gameplay briefing.
    copy('RELAY NETWORK', 'YOUR RUN BEGINS', 'Kara ven, runner.', 'FOLLOW THE RELAY.');
    animate(copyNode,[{opacity:1,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-54%) scale(1.06)'}],900);
    animate(top,[{opacity:1},{opacity:0}],800); animate(radar,[{opacity:1},{opacity:0}],600);
    animate(city,[{opacity:1,transform:'translateX(-50%) scale(1.18)'},{opacity:.28,transform:'translateX(-50%) scale(1.36)'}],950);
    animate(flash,[{opacity:0},{opacity:.12},{opacity:0}],600);
    await wait(750);

    hideSkip();
    root.animate?.([{opacity:1},{opacity:0}], {duration:reducedMotion()?1:620, fill:'forwards', easing:'ease-in-out'});
    await wait(640);
    root.hidden = true;
    window.sessionStorage?.setItem(KEY,'1');
    window.__relayCinematicArrivalV1Completed = true;
    active = false;
  }

  function stop() {
    active = false;
    try { window.speechSynthesis?.cancel?.(); } catch {}
    root.hidden = true;
  }

  const onStart = event => {
    if (replayGuard || active) return;
    const alreadyPlayed = window.sessionStorage?.getItem(KEY) === '1';
    if (alreadyPlayed) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    runCinematic().then(() => {
      replayGuard = true;
      startButton.click();
      window.setTimeout(() => { replayGuard = false; }, 80);
    }).catch(() => {
      stop();
      replayGuard = true;
      startButton.click();
      window.setTimeout(() => { replayGuard = false; }, 80);
    });
  };

  startButton.addEventListener('click', onStart, true);
  qs('.ca-skip')?.addEventListener('click', () => {
    if (!active) return;
    active = false;
    try { window.speechSynthesis?.cancel?.(); } catch {}
    root.hidden = true;
    window.sessionStorage?.setItem(KEY,'1');
    replayGuard = true;
    startButton.click();
    window.setTimeout(() => { replayGuard = false; }, 80);
  });

  window.__relayCinematicArrivalV1 = {
    replay() { window.sessionStorage?.removeItem(KEY); replayGuard = false; startButton.focus(); },
    skip() { if (active) qs('.ca-skip')?.click(); },
    stop,
  };
})();
