// UPDATE 07 — realistic solar cycle + responsive world atmosphere.
// Safe presentation layer: no gameplay/physics/state ownership is changed.
(() => {
  if (window.__relayDynamicTimeCycleV4) return;
  window.__relayDynamicTimeCycleV4 = true;

  const CYCLE_MS = 90000;
  const DAY_START_MINUTES = 6 * 60;
  const MINUTES_PER_CYCLE = 24 * 60;
  const play = document.getElementById('play');
  if (!play) return;

  const oldNodes = [
    'relayTimeShade',
    'relayTimeIndicator',
    'relaySkyAtmosphere',
    'relaySkyCelestial',
    'relaySkyStars',
    'relaySkyClouds',
  ];
  oldNodes.forEach(id => document.getElementById(id)?.remove());

  if (getComputedStyle(play).position === 'static') play.style.position = 'relative';

  const css = document.createElement('style');
  css.dataset.relayTimeCycle = 'v4';
  css.textContent = `
    #relaySkyAtmosphere {
      position:absolute;
      inset:0;
      z-index:2;
      pointer-events:none;
      overflow:hidden;
      background:linear-gradient(180deg,#061126 0%,#0b1a2e 48%,#17344d 76%,transparent 100%);
      transition:background 1.2s ease,opacity 1.2s ease;
      isolation:isolate;
    }
    #relaySkyAtmosphere::before {
      content:"";
      position:absolute;
      inset:0 0 42%;
      background:radial-gradient(ellipse at 50% 68%,var(--relay-horizon-glow,rgba(255,179,110,.20)) 0%,transparent 52%);
      opacity:.95;
      transition:background 1.2s ease;
    }
    #relaySkyAtmosphere::after {
      content:"";
      position:absolute;
      left:0;right:0;bottom:38%;height:16%;
      background:linear-gradient(180deg,transparent,rgba(220,235,232,.11),transparent);
      filter:blur(9px);
      opacity:var(--relay-haze,.35);
      transition:opacity 1.2s ease;
    }
    #relaySkyCelestial { position:absolute; inset:0; z-index:3; pointer-events:none; overflow:hidden; }
    #relaySkySun,
    #relaySkyMoon {
      position:absolute;
      left:50%;top:50%;
      width:clamp(58px,8.4vw,108px);
      aspect-ratio:1;
      border-radius:50%;
      transform:translate(-50%,-50%);
      pointer-events:none;
      transition:left 1.4s ease,top 1.4s ease,opacity 1.2s ease,filter 1.2s ease,box-shadow 1.2s ease,background 1.2s ease;
    }
    #relaySkySun {
      background:radial-gradient(circle at 40% 37%,#fffdf1 0 18%,#ffe9aa 43%,#ffc15d 74%,rgba(255,170,60,0) 100%);
      box-shadow:0 0 28px 9px rgba(255,204,116,.28),0 0 110px 34px rgba(255,171,73,.16);
      opacity:0;
    }
    #relaySkySun::after {
      content:"";
      position:absolute;
      inset:-36%;
      border-radius:50%;
      background:radial-gradient(circle,rgba(255,225,159,.16),transparent 68%);
      filter:blur(8px);
    }
    #relaySkyMoon {
      width:clamp(48px,6.8vw,94px);
      background:radial-gradient(circle at 36% 34%,#fff9e8 0 13%,#f1e2bf 47%,#d5c29d 78%,#b8aa8d 100%);
      box-shadow:0 0 18px 6px rgba(226,215,189,.18),0 0 55px 18px rgba(130,159,194,.10);
      opacity:0;
    }
    #relaySkyMoon::before,
    #relaySkyMoon::after {
      content:"";
      position:absolute;
      border-radius:50%;
      background:rgba(135,120,100,.10);
    }
    #relaySkyMoon::before { width:18%;height:18%;left:20%;top:54%; }
    #relaySkyMoon::after { width:11%;height:11%;left:54%;top:28%; }
    #relaySkyStars { position:absolute; inset:0; z-index:2; pointer-events:none; overflow:hidden; opacity:0; transition:opacity 1.2s ease; }
    .relay-sky-star {
      position:absolute;
      width:2px;height:2px;border-radius:50%;
      background:#dff4ff;
      box-shadow:0 0 6px rgba(183,226,255,.55);
    }
    #relaySkyClouds { position:absolute; inset:0; z-index:2; pointer-events:none; overflow:hidden; opacity:.62; transition:opacity 1.2s ease; }
    .relay-sky-cloud {
      position:absolute;
      width:clamp(120px,15vw,260px);
      height:28px;
      border-radius:999px;
      background:linear-gradient(180deg,rgba(244,250,248,.18),rgba(184,210,213,.05));
      filter:blur(1px);
      box-shadow:-38px 8px 0 -8px rgba(244,250,248,.12),28px 6px 0 -10px rgba(244,250,248,.10);
      animation:relay-sky-cloud-drift 38s linear infinite;
    }
    .relay-sky-cloud:nth-child(2){animation-duration:52s;transform:scale(.78)}
    .relay-sky-cloud:nth-child(3){animation-duration:44s;transform:scale(1.18)}
    @keyframes relay-sky-cloud-drift { from{margin-left:-14vw} to{margin-left:116vw} }

    #relayTimeIndicator {
      position:absolute;
      top:88px;
      right:18px;
      z-index:80;
      min-width:164px;
      padding:8px 11px;
      box-sizing:border-box;
      border:1px solid rgba(141,244,255,.38);
      border-radius:9px;
      background:rgba(5,12,24,.88);
      box-shadow:0 0 18px rgba(25,200,245,.08),inset 0 0 14px rgba(141,244,255,.04);
      color:#f4fbff;
      font:700 10px/1.1 "DM Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
      letter-spacing:.11em;
      text-align:right;
      pointer-events:none;
      text-transform:uppercase;
      backdrop-filter:blur(7px);
    }
    #relayTimeIndicator .relay-time-name{display:block;font-size:11px;letter-spacing:.16em}
    #relayTimeIndicator .relay-time-clock{display:block;margin-top:4px;opacity:.78;font-size:9px}
    #relayTimeIndicator .relay-time-local{display:block;margin-top:4px;color:#8df4ff;font-size:9px;letter-spacing:.12em}
    #relayTimeIndicator .relay-time-icon{display:inline-block;margin-right:7px;font-size:13px;vertical-align:-1px}
    @media(max-width:900px){
      #relayTimeIndicator{top:82px;right:12px;min-width:148px;padding:7px 9px}
    }
    @media(max-width:700px) and (orientation:portrait){
      #relayTimeIndicator{top:74px;right:10px;min-width:132px;padding:6px 8px}
      #relaySkySun{width:56px}
      #relaySkyMoon{width:50px}
      .relay-sky-cloud{width:120px}
    }
    @media(max-width:420px){
      #relayTimeIndicator{top:70px;right:8px;min-width:124px;font-size:9px}
      #relaySkyAtmosphere::after{bottom:34%}
    }
    @media(prefers-reduced-motion:reduce){
      #relaySkySun,#relaySkyMoon,#relaySkyAtmosphere{transition:none!important}
      .relay-sky-cloud{animation:none!important}
    }
  `;
  document.head.appendChild(css);

  const atmosphere = document.createElement('div');
  atmosphere.id = 'relaySkyAtmosphere';
  atmosphere.setAttribute('aria-hidden','true');

  const stars = document.createElement('div');
  stars.id = 'relaySkyStars';
  stars.setAttribute('aria-hidden','true');
  for (let index = 0; index < 34; index += 1) {
    const star = document.createElement('i');
    star.className = 'relay-sky-star';
    star.style.left = `${(index * 29) % 100}%`;
    star.style.top = `${8 + ((index * 17) % 46)}%`;
    star.style.opacity = `${0.26 + ((index * 13) % 45) / 100}`;
    stars.appendChild(star);
  }

  const clouds = document.createElement('div');
  clouds.id = 'relaySkyClouds';
  clouds.setAttribute('aria-hidden','true');
  ['16%','33%','48%'].forEach((top, index) => {
    const cloud = document.createElement('div');
    cloud.className = 'relay-sky-cloud';
    cloud.style.top = top;
    cloud.style.left = `${-12 - index * 12}%`;
    cloud.style.opacity = `${0.48 - index * 0.08}`;
    clouds.appendChild(cloud);
  });

  const celestial = document.createElement('div');
  celestial.id = 'relaySkyCelestial';
  celestial.setAttribute('aria-hidden','true');
  const sun = document.createElement('div'); sun.id = 'relaySkySun';
  const moon = document.createElement('div'); moon.id = 'relaySkyMoon';
  celestial.append(sun, moon);

  const indicator = document.createElement('div');
  indicator.id = 'relayTimeIndicator';
  indicator.setAttribute('aria-hidden','true');
  indicator.innerHTML = '<span class="relay-time-name"><span class="relay-time-icon">◐</span><span data-relay-time-name>DAWN</span></span><span class="relay-time-clock" data-relay-time-clock>00:00 · CYCLE 01</span><span class="relay-time-local" data-relay-time-local>06:00</span>';

  play.insertBefore(atmosphere, play.firstChild);
  play.insertBefore(stars, atmosphere.nextSibling);
  play.insertBefore(clouds, stars.nextSibling);
  play.insertBefore(celestial, clouds.nextSibling);
  const hud = play.querySelector('.hud');
  if (hud?.parentNode === play) play.insertBefore(indicator, hud.nextSibling); else play.appendChild(indicator);

  const THEMES = [
    { hour:0, name:'NIGHT', top:'#020713', mid:'#061426', horizon:'#0d2942', ground:'#07101a', glow:'rgba(73,139,192,.10)' },
    { hour:5, name:'DAWN', top:'#11182b', mid:'#43546d', horizon:'#cf826d', ground:'#1b1720', glow:'rgba(255,144,103,.28)' },
    { hour:6, name:'SUNRISE', top:'#2f5270', mid:'#7f7883', horizon:'#e8a279', ground:'#24212a', glow:'rgba(255,173,107,.34)' },
    { hour:7, name:'SUNRISE', top:'#486f8c', mid:'#a49599', horizon:'#efc19b', ground:'#2e353c', glow:'rgba(255,197,132,.31)' },
    { hour:10, name:'MORNING', top:'#67a3c2', mid:'#b5d1d7', horizon:'#e7e2d6', ground:'#3a474c', glow:'rgba(255,231,183,.24)' },
    { hour:12, name:'MIDDAY', top:'#79b4d3', mid:'#c3dde3', horizon:'#f0ecd9', ground:'#42565c', glow:'rgba(255,243,202,.22)' },
    { hour:15, name:'AFTERNOON', top:'#6fa8c9', mid:'#bdd0d3', horizon:'#ead9c1', ground:'#45535a', glow:'rgba(255,220,169,.20)' },
    { hour:18, name:'SUNSET', top:'#60445c', mid:'#ae6e72', horizon:'#ef9a6a', ground:'#24171f', glow:'rgba(255,148,91,.34)' },
    { hour:19, name:'DUSK', top:'#2b2640', mid:'#684866', horizon:'#a95b6a', ground:'#14101a', glow:'rgba(197,117,119,.22)' },
    { hour:20, name:'NIGHT', top:'#050b18', mid:'#0a1a2f', horizon:'#163b56', ground:'#06101a', glow:'rgba(94,159,208,.10)' },
    { hour:24, name:'NIGHT', top:'#020713', mid:'#061426', horizon:'#0d2942', ground:'#07101a', glow:'rgba(73,139,192,.10)' },
  ];

  const hexRgb = hex => {
    const value = hex.replace('#','');
    const n = Number.parseInt(value,16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  };
  const mixHex = (a,b,t) => {
    const x=hexRgb(a), y=hexRgb(b);
    const f=v=>Math.round(v);
    return `rgb(${f(x.r+(y.r-x.r)*t)} ${f(x.g+(y.g-x.g)*t)} ${f(x.b+(y.b-x.b)*t)})`;
  };
  const colorAt = hour => {
    const h = ((hour % 24) + 24) % 24;
    for (let i=0; i<THEMES.length-1; i+=1) {
      const a=THEMES[i], b=THEMES[i+1];
      if (h >= a.hour && h <= b.hour) {
        const t=(h-a.hour)/Math.max(.001,b.hour-a.hour);
        return {
          name: t < .5 ? a.name : b.name,
          top:mixHex(a.top,b.top,t), mid:mixHex(a.mid,b.mid,t), horizon:mixHex(a.horizon,b.horizon,t), ground:mixHex(a.ground,b.ground,t), glow:mixHex(a.glow.replace('rgba','rgb').replace(/,?\.?\d+\)?$/,''),b.glow.replace('rgba','rgb').replace(/,?\.?\d+\)?$/,''),t)
        };
      }
    }
    return THEMES[0];
  };
  const themeFor = h => h >= 5 && h < 8 ? 'SUNRISE' : h >= 8 && h < 11 ? 'MORNING' : h >= 11 && h < 15 ? 'MIDDAY' : h >= 15 && h < 18 ? 'AFTERNOON' : h >= 18 && h < 20 ? 'SUNSET' : 'NIGHT';
  const solarPosition = hour => {
    const p = Math.max(0,Math.min(1,(hour-6)/12.5));
    return { x:4 + p*92, y:72 - Math.sin(p*Math.PI)*63 };
  };
  const cycleLocal = progress => ((DAY_START_MINUTES + progress * MINUTES_PER_CYCLE) % MINUTES_PER_CYCLE + MINUTES_PER_CYCLE) % MINUTES_PER_CYCLE;

  let elapsed = 0;
  let lastTimestamp = performance.now();
  let started = false;
  let cycleNumber = 1;

  const updateVisuals = progress => {
    const localMinutes = cycleLocal(progress);
    const hour = localMinutes / 60;
    const next = colorAt(hour);
    const name = themeFor(hour);
    const localHours = String(Math.floor(localMinutes/60)%24).padStart(2,'0');
    const localMinutesOnly = String(Math.floor(localMinutes%60)).padStart(2,'0');

    atmosphere.style.background = `linear-gradient(180deg,${next.top} 0%,${next.mid} 46%,${next.horizon} 78%,rgba(0,0,0,0) 100%)`;
    atmosphere.style.setProperty('--relay-horizon-glow',next.glow.replace('rgb','rgba').replace(')',',.26)'));
    atmosphere.style.setProperty('--relay-haze',name === 'NIGHT' ? '.18' : name === 'SUNRISE' || name === 'SUNSET' ? '.48' : '.28');

    const { x, y } = solarPosition(hour);
    const sunVisible = hour >= 5.6 && hour < 19.7;
    sun.style.left = `${x}%`;
    sun.style.top = `${y}%`;
    sun.style.opacity = sunVisible ? String(name === 'SUNRISE' || name === 'SUNSET' ? .96 : 1) : '0';
    sun.style.filter = name === 'MIDDAY' ? 'brightness(1.08)' : name === 'SUNRISE' || name === 'SUNSET' ? 'sepia(.12) saturate(1.08)' : 'none';
    sun.style.background = name === 'SUNRISE' || name === 'SUNSET'
      ? 'radial-gradient(circle at 40% 37%,#fff9dc 0 18%,#ffd693 46%,#ff9f55 76%,rgba(255,150,70,0) 100%)'
      : 'radial-gradient(circle at 40% 37%,#fffef4 0 18%,#fff1b8 45%,#ffd15e 74%,rgba(255,181,66,0) 100%)';
    sun.style.boxShadow = name === 'MIDDAY'
      ? '0 0 32px 10px rgba(255,222,129,.24),0 0 120px 42px rgba(255,214,119,.14)'
      : '0 0 30px 8px rgba(255,195,111,.28),0 0 100px 32px rgba(255,164,78,.16)';

    const moonVisible = hour >= 20 || hour < 5.5;
    const moonProgress = hour >= 20 ? (hour - 20) / 9.5 : (hour + 4) / 9.5;
    const moonX = 8 + Math.min(1,Math.max(0,moonProgress))*84;
    const moonY = 68 - Math.sin(Math.min(1,Math.max(0,moonProgress))*Math.PI)*48;
    moon.style.left = `${moonX}%`;
    moon.style.top = `${moonY}%`;
    moon.style.opacity = moonVisible ? '.88' : '0';

    stars.style.opacity = name === 'NIGHT' ? '.92' : hour < 6.5 || hour >= 19.3 ? '.30' : '0';
    clouds.style.opacity = name === 'NIGHT' ? '.22' : name === 'SUNRISE' || name === 'SUNSET' ? '.58' : '.44';

    const icon = name === 'MIDDAY' || name === 'MORNING' || name === 'AFTERNOON' ? '☀' : name === 'SUNRISE' || name === 'SUNSET' ? '◐' : '☾';
    indicator.querySelector('[data-relay-time-name]').textContent = name;
    indicator.querySelector('.relay-time-icon').textContent = icon;
    indicator.querySelector('[data-relay-time-clock]').textContent = `${String(Math.floor((elapsed % CYCLE_MS)/60000)).padStart(2,'0')}:${String(Math.floor((elapsed % 60000)/1000)).padStart(2,'0')} · CYCLE ${String(cycleNumber).padStart(2,'0')}`;
    indicator.querySelector('[data-relay-time-local]').textContent = `${localHours}:${localMinutesOnly}`;
    indicator.dataset.phase = name;
  };

  const intro = document.getElementById('intro');
  const isGameRunning = () => !intro || intro.classList.contains('hidden');

  const frame = timestamp => {
    const delta = Math.min(100,Math.max(0,timestamp-lastTimestamp));
    lastTimestamp = timestamp;
    if (isGameRunning()) {
      if (!started) { started=true; elapsed=0; cycleNumber=1; }
      const previousCycle = Math.floor(elapsed/CYCLE_MS);
      elapsed += delta;
      const currentCycle = Math.floor(elapsed/CYCLE_MS);
      if (currentCycle !== previousCycle) cycleNumber=currentCycle+1;
      updateVisuals((elapsed % CYCLE_MS)/CYCLE_MS);
    } else {
      started=false;
      updateVisuals(0);
    }
    requestAnimationFrame(frame);
  };

  window.addEventListener('resize', () => updateVisuals((elapsed % CYCLE_MS)/CYCLE_MS));
  updateVisuals(0);
  requestAnimationFrame(frame);
})();
