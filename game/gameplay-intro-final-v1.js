(() => {
  'use strict';
  if (window.__relayGameplayIntroFinalV3) return;
  window.__relayGameplayIntroFinalV3 = true;

  const BUTTONS = '#start,#nextMission,#again,#retry,#launchJob';
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  const runner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const mission = () => {
    const scene = runner();
    const id = scene?.mission?.id || scene?.sys?.settings?.data?.missionId || document.getElementById('missionId')?.value || null;
    const title = scene?.mission?.title || document.getElementById('objective')?.textContent || 'CURRENT MISSION';
    const district = scene?.mission?.district || document.getElementById('district')?.textContent || 'CURRENT DISTRICT';
    const objective = scene?.mission?.objective || document.getElementById('worldGoal')?.textContent || 'FOLLOW THE RELAY';
    return { scene, id, title: String(title).trim(), district: String(district).trim(), objective: String(objective).trim() };
  };

  const root = document.createElement('section');
  root.id = 'relayGameplayIntroFinalV3';
  root.hidden = true;
  root.innerHTML = `
    <div class="map-briefing-shell" role="dialog" aria-modal="true" aria-label="Mission route map briefing">
      <header class="map-briefing-head">
        <div class="map-briefing-title-block">
          <p class="map-briefing-kicker">RELAY RUNNER // TACTICAL MAP</p>
          <h2 class="map-briefing-title">MISSION ROUTE</h2>
          <p class="map-briefing-meta"></p>
        </div>
        <div class="map-briefing-status"><span class="map-live-dot"></span><span>LIVE</span></div>
        <div class="map-briefing-timer" aria-live="polite"><b>10</b><span>SEC</span></div>
      </header>
      <div class="map-briefing-map-wrap">
        <div class="map-map-corner tl"></div><div class="map-map-corner tr"></div><div class="map-map-corner bl"></div><div class="map-map-corner br"></div>
        <div class="map-briefing-compass">N</div>
        <div class="map-briefing-side left"><span>MISSION</span><b class="map-briefing-side-mission">—</b><small>ROUTE ACTIVE</small></div>
        <svg class="map-briefing-map" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Actual level route map"></svg>
        <div class="map-briefing-scan"></div><div class="map-briefing-vignette"></div>
        <div class="map-briefing-tag">LIVE TACTICAL ROUTE</div>
        <div class="map-briefing-legend"><span><i class="lg-route"></i>ROUTE</span><span><i class="lg-cp"></i>CHECKPOINT</span><span><i class="lg-target"></i>TARGET</span><span><i class="lg-threat"></i>THREAT</span></div>
      </div>
      <footer class="map-briefing-foot"><span class="map-briefing-objective"></span><span>BRIEFING // 10 SEC</span></footer>
    </div>`;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.textContent = `
    #relayGameplayIntroFinalV3{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;overflow:hidden;background:#02060b;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;pointer-events:auto}
    #relayGameplayIntroFinalV3[hidden]{display:none}
    #relayGameplayIntroFinalV3 .map-briefing-shell{position:relative;z-index:2;width:min(1160px,94vw);height:min(820px,90dvh);display:grid;grid-template-rows:auto 1fr auto;gap:10px;padding:14px;border:1px solid rgba(141,244,255,.2);border-radius:4px;background:#030a12;box-shadow:0 30px 120px rgba(0,0,0,.72),0 0 80px rgba(40,190,240,.07);box-sizing:border-box}
    #relayGameplayIntroFinalV3 .map-briefing-head{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:16px;border-bottom:1px solid rgba(141,244,255,.14);padding:0 2px 10px}
    #relayGameplayIntroFinalV3 .map-briefing-kicker{margin:0 0 5px;color:#69d9ee;font-size:8px;font-weight:900;letter-spacing:.24em}
    #relayGameplayIntroFinalV3 .map-briefing-title{margin:0;color:#f1f7fa;font-size:clamp(24px,4vw,38px);line-height:.95;letter-spacing:.1em;font-weight:900}
    #relayGameplayIntroFinalV3 .map-briefing-meta{margin:6px 0 0;color:#70899b;font-size:8px;letter-spacing:.12em}
    #relayGameplayIntroFinalV3 .map-briefing-status{display:flex;align-items:center;gap:6px;color:#82e6a4;font-size:7px;font-weight:900;letter-spacing:.16em;border:1px solid rgba(130,230,164,.22);padding:7px 9px;background:rgba(130,230,164,.035)}
    #relayGameplayIntroFinalV3 .map-live-dot{width:5px;height:5px;border-radius:50%;background:#82e6a4;box-shadow:0 0 10px #82e6a4}
    #relayGameplayIntroFinalV3 .map-briefing-timer{width:58px;height:58px;display:grid;place-items:center;align-content:center;border:1px solid rgba(255,208,110,.4);background:rgba(255,208,110,.035)}
    #relayGameplayIntroFinalV3 .map-briefing-timer b{color:#ffd06e;font-size:23px;line-height:1}.map-briefing-timer span{margin-top:3px;color:#74889a;font-size:6px;letter-spacing:.16em}
    #relayGameplayIntroFinalV3 .map-briefing-map-wrap{position:relative;min-height:0;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(141,244,255,.16);background:#02070d}
    #relayGameplayIntroFinalV3 .map-briefing-map{display:block;width:100%;height:100%;background:#02070d}
    #relayGameplayIntroFinalV3 .map-briefing-scan{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 49%,rgba(141,244,255,.035) 50%,transparent 51%);background-size:100% 7px;opacity:.42}
    #relayGameplayIntroFinalV3 .map-briefing-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 50%,transparent 52%,rgba(0,0,0,.5) 100%)}
    #relayGameplayIntroFinalV3 .map-map-corner{position:absolute;width:18px;height:18px;border-color:#69d9ee;opacity:.75;z-index:3;pointer-events:none}.map-map-corner.tl{top:10px;left:10px;border-top:1px solid;border-left:1px solid}.map-map-corner.tr{top:10px;right:10px;border-top:1px solid;border-right:1px solid}.map-map-corner.bl{bottom:10px;left:10px;border-bottom:1px solid;border-left:1px solid}.map-map-corner.br{bottom:10px;right:10px;border-bottom:1px solid;border-right:1px solid}
    #relayGameplayIntroFinalV3 .map-briefing-compass{position:absolute;right:16px;top:14px;z-index:4;width:28px;height:28px;border:1px solid rgba(141,244,255,.3);display:grid;place-items:center;color:#8df4ff;font-size:8px;background:rgba(2,8,14,.68)}
    #relayGameplayIntroFinalV3 .map-briefing-side{position:absolute;left:14px;top:14px;z-index:4;display:grid;gap:3px;padding:8px 10px;border-left:2px solid #69d9ee;background:rgba(2,8,14,.76);backdrop-filter:blur(5px);min-width:100px}.map-briefing-side span{font-size:6px;color:#6f8798;letter-spacing:.16em}.map-briefing-side b{font-size:11px;color:#eafcff;letter-spacing:.08em}.map-briefing-side small{font-size:5px;color:#69d9ee;letter-spacing:.12em}
    #relayGameplayIntroFinalV3 .map-briefing-tag{position:absolute;left:14px;bottom:14px;z-index:4;padding:6px 8px;border:1px solid rgba(141,244,255,.18);background:rgba(2,8,14,.74);color:#8df4ff;font-size:6px;font-weight:900;letter-spacing:.16em}
    #relayGameplayIntroFinalV3 .map-briefing-legend{position:absolute;right:14px;bottom:14px;z-index:4;display:flex;gap:9px;padding:7px 8px;border:1px solid rgba(141,244,255,.14);background:rgba(2,8,14,.74);font-size:5px;color:#91a8b7;letter-spacing:.1em}.map-briefing-legend span{display:flex;align-items:center;gap:4px}.map-briefing-legend i{width:7px;height:3px;display:inline-block}.lg-route{background:#8df4ff}.lg-cp{border:1px solid #8df4ff;border-radius:50%;height:7px!important;width:7px!important;background:transparent}.lg-target{background:#ffd06e}.lg-threat{background:#ff826e}
    #relayGameplayIntroFinalV3 .map-briefing-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#60798a;font-size:6px;font-weight:800;letter-spacing:.12em;padding-top:2px}.map-briefing-objective{max-width:72%;color:#d8e9ef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #play.relay-map-briefing-lock .hud,#play.relay-map-briefing-lock .world-marker,#play.relay-map-briefing-lock .input-guide,#play.relay-map-briefing-lock .mobile-controls,#play.relay-map-briefing-lock .rotate-prompt,#play.relay-map-briefing-lock #toast,#play.relay-map-briefing-lock #pause{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    @media(max-width:760px){
      #relayGameplayIntroFinalV3{background:#02060b}
      #relayGameplayIntroFinalV3 .map-briefing-shell{width:100vw;height:100dvh;padding:8px;border:0;border-radius:0;gap:7px;background:#030a12;box-shadow:none}
      #relayGameplayIntroFinalV3 .map-briefing-head{grid-template-columns:1fr auto auto;gap:7px;padding:2px 3px 7px}
      #relayGameplayIntroFinalV3 .map-briefing-kicker{font-size:6px;letter-spacing:.18em;margin-bottom:4px}
      #relayGameplayIntroFinalV3 .map-briefing-title{font-size:21px;letter-spacing:.08em}
      #relayGameplayIntroFinalV3 .map-briefing-meta{font-size:6px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55vw}
      #relayGameplayIntroFinalV3 .map-briefing-status{font-size:5px;padding:6px 6px;gap:4px}.map-live-dot{width:4px;height:4px}
      #relayGameplayIntroFinalV3 .map-briefing-timer{width:43px;height:43px}.map-briefing-timer b{font-size:17px!important}.map-briefing-timer span{font-size:5px!important}
      #relayGameplayIntroFinalV3 .map-briefing-map-wrap{border-left:0;border-right:0;border-radius:0}
      #relayGameplayIntroFinalV3 .map-briefing-map{width:100%;height:100%}
      #relayGameplayIntroFinalV3 .map-briefing-side{left:9px;top:9px;min-width:88px;padding:6px 8px}.map-briefing-side b{font-size:9px}.map-briefing-side span,.map-briefing-side small{font-size:5px}
      #relayGameplayIntroFinalV3 .map-briefing-compass{right:9px;top:9px;width:24px;height:24px;font-size:7px}
      #relayGameplayIntroFinalV3 .map-briefing-legend{left:9px;right:auto;bottom:9px;gap:6px;font-size:4px;padding:5px 6px}
      #relayGameplayIntroFinalV3 .map-briefing-tag{left:auto;right:9px;bottom:9px;font-size:5px;padding:5px 6px}
      #relayGameplayIntroFinalV3 .map-briefing-foot{font-size:5px;padding:0 2px}.map-briefing-objective{max-width:68%}
    }
  `;
  document.head.appendChild(style);

  const esc = value => String(value ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const num = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function mapModel(scene) {
    const m = scene?.mission || {};
    const width = num(scene?.physics?.world?.bounds?.width, num(m?.goal?.x, 6100) + 300);
    const height = num(scene?.physics?.world?.bounds?.height, 720);
    const sx = 920 / Math.max(width, 1);
    const sy = 430 / Math.max(height, 1);
    const X = x => 40 + clamp(num(x) * sx, 0, 920);
    const Y = y => 50 + clamp(num(y) * sy, 0, 430);
    const p = scene?.player;
    const points = { start:{x:X(m?.spawn?.x ?? 120),y:Y(m?.spawn?.y ?? 520)}, goal:{x:X(m?.goal?.x ?? 6100),y:Y(m?.goal?.y ?? 500)}, player:{x:X(p?.x ?? m?.spawn?.x ?? 120),y:Y(p?.y ?? m?.spawn?.y ?? 520)} };
    const arr = key => Array.isArray(m?.[key]) ? m[key] : [];
    const point = item => Array.isArray(item) ? {x:X(item[0]),y:Y(item[1])} : {x:X(item?.x),y:Y(item?.y)};
    const rect = item => { const x=num(item?.[0]),y=num(item?.[1]),w=num(item?.[2],40),h=num(item?.[3],20); return {x:X(x),y:Y(y),w:Math.max(4,w*sx),h:Math.max(3,h*sy)}; };
    return {points,platforms:arr('platforms'),obstacles:arr('obstacles'),boostPads:arr('boostPads'),checkpoints:arr('checkpoints'),signals:arr('signals'),secrets:arr('secrets'),movingGates:arr('movingGates'),enemies:arr('enemies'),guides:arr('guides'),point,rect};
  }

  function renderMap(scene) {
    const svg = root.querySelector('.map-briefing-map');
    if (!svg || !scene) return;
    const d = mapModel(scene);
    const pathPoints = [d.points.start,...d.checkpoints.map(d.point),d.points.goal];
    const routePath = pathPoints.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const platforms=d.platforms.map(item=>{const r=d.rect(item);return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="2" class="platform"/>`;}).join('');
    const obstacles=d.obstacles.map(item=>{const p=d.point(item);return `<path d="M ${p.x-8} ${p.y+7} L ${p.x} ${p.y-8} L ${p.x+8} ${p.y+7} Z" class="danger"/>`;}).join('');
    const pads=d.boostPads.map(item=>{const r=d.rect([item[0]-28,item[1]-8,56,16]);return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="2" class="boost"/>`;}).join('');
    const cps=d.checkpoints.map((item,i)=>{const p=d.point(item);return `<g><circle cx="${p.x}" cy="${p.y}" r="11" class="checkpoint-ring"/><circle cx="${p.x}" cy="${p.y}" r="3" class="checkpoint-dot"/><text x="${p.x+15}" y="${p.y+3}" class="label">CP ${i+1}</text></g>`;}).join('');
    const signals=d.signals.map(item=>{const p=d.point(item);return `<circle cx="${p.x}" cy="${p.y}" r="4" class="signal"/>`;}).join('');
    const secrets=d.secrets.map(item=>{const p=d.point(item);return `<path d="M ${p.x} ${p.y-5} l 5 5 -5 5 -5 -5 Z" class="secret"/>`;}).join('');
    const gates=d.movingGates.map(item=>{const r=d.rect(item);return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="2" class="gate"/>`;}).join('');
    const enemies=d.enemies.map(item=>{const p=d.point(item);return `<g><circle cx="${p.x}" cy="${p.y}" r="7" class="enemy"/><text x="${p.x+10}" y="${p.y+3}" class="label danger-label">HOSTILE</text></g>`;}).join('');
    const guides=d.guides.map(item=>{const p=d.point(item);return `<text x="${p.x}" y="${p.y-12}" class="guide">${esc(item?.text||'')}</text>`;}).join('');
    svg.innerHTML=`<defs><filter id="relayMapGlow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <style>.bg{fill:#030a12}.grid{stroke:#153447;stroke-width:1;opacity:.52}.street{stroke:#1b3b4c;stroke-width:7;opacity:.32}.platform{fill:#102230;stroke:#476579;stroke-width:1}.danger{fill:#ff826e;opacity:.9}.boost{fill:#0d3040;stroke:#69d9ee;stroke-width:1}.checkpoint-ring{fill:none;stroke:#69d9ee;stroke-width:1.4}.checkpoint-dot{fill:#69d9ee}.signal{fill:#ffd06e;filter:url(#relayMapGlow)}.secret{fill:none;stroke:#d8a6ff;stroke-width:1.4}.gate{fill:#3a1c28;stroke:#ff826e;stroke-width:1}.enemy{fill:#321d2b;stroke:#ff826e;stroke-width:2}.route{fill:none;stroke:#69d9ee;stroke-width:4;stroke-linecap:square;stroke-linejoin:miter;stroke-dasharray:8 7;opacity:.9;filter:url(#relayMapGlow)}.route-halo{fill:none;stroke:#69d9ee;stroke-width:11;opacity:.07}.marker-start{fill:#82e6a4;stroke:#eaffd6;stroke-width:2}.marker-goal{fill:#ffd06e;stroke:#fff0c7;stroke-width:2}.marker-player{fill:#eafcff;stroke:#69d9ee;stroke-width:2;filter:url(#relayMapGlow)}.label,.guide{font-family:ui-monospace,monospace;fill:#718b9e;font-size:8px;letter-spacing:.1em}.guide{fill:#8df4ff}.danger-label{fill:#ff826e}.map-gridline{stroke:#244454;stroke-width:1;opacity:.3}</style>
      <rect width="1000" height="560" class="bg"/><path d="M0 90H1000M0 180H1000M0 270H1000M0 360H1000M0 450H1000" class="grid"/><path d="M100 0V560M200 0V560M300 0V560M400 0V560M500 0V560M600 0V560M700 0V560M800 0V560M900 0V560" class="grid"/>
      <path d="M0 140L250 60L520 160L760 80L1000 190M0 420L220 330L470 430L730 310L1000 400" class="street"/>
      <path d="${routePath}" class="route-halo"/><path d="${routePath}" class="route"/>
      ${platforms}${gates}${obstacles}${pads}${signals}${secrets}${cps}${enemies}${guides}
      <g><circle cx="${d.points.start.x}" cy="${d.points.start.y}" r="8" class="marker-start"/><text x="${d.points.start.x+13}" y="${d.points.start.y+4}" class="label">START</text></g>
      <g><circle cx="${d.points.goal.x}" cy="${d.points.goal.y}" r="10" class="marker-goal"/><path d="M ${d.points.goal.x-4} ${d.points.goal.y+8} V ${d.points.goal.y-9} l 15 5 -15 6" fill="#ffd06e"/><text x="${d.points.goal.x+15}" y="${d.points.goal.y+4}" class="label">TARGET</text></g>
      <g id="live-player"><circle cx="${d.points.player.x}" cy="${d.points.player.y}" r="7" class="marker-player"/><text x="${d.points.player.x+12}" y="${d.points.player.y-10}" class="label">YOU</text></g>`;
  }

  let active=false,timerId=0,endId=0,followId=0;
  const lock=state=>{window.__relayCinematicLock=state;document.getElementById('play')?.classList.toggle('relay-map-briefing-lock',state);window.dispatchEvent(new Event(state?'relay:cinematic-lock':'relay:cinematic-unlock'));};
  const updateTimer=ms=>{const el=root.querySelector('.map-briefing-timer b');if(el)el.textContent=String(Math.max(0,Math.ceil(ms/1000)));};
  const updatePlayer=()=>{if(!active)return;const scene=runner();const svg=root.querySelector('.map-briefing-map');const group=svg?.querySelector('#live-player');if(!scene||!group)return;const d=mapModel(scene);const c=group.querySelector('circle'),t=group.querySelector('text');c?.setAttribute('cx',d.points.player.x);c?.setAttribute('cy',d.points.player.y);t?.setAttribute('x',d.points.player.x+12);t?.setAttribute('y',d.points.player.y-10);};
  const finish=()=>{clearInterval(timerId);clearTimeout(endId);clearInterval(followId);timerId=endId=followId=0;active=false;lock(false);root.hidden=true;};
  const show=async()=>{if(active)return;active=true;lock(true);root.hidden=false;const startedWait=performance.now();let data=mission();while(!data.scene&&performance.now()-startedWait<4500){await wait(80);data=mission();}data=mission();root.querySelector('.map-briefing-meta').textContent=`${data.district} // ${data.title}`;root.querySelector('.map-briefing-objective').textContent=data.objective;root.querySelector('.map-briefing-side-mission').textContent=data.id?String(data.id).replace(/[-_]/g,' ').toUpperCase():'ACTIVE';renderMap(data.scene);const started=performance.now();updateTimer(10000);timerId=setInterval(()=>updateTimer(10000-(performance.now()-started)),250);followId=setInterval(updatePlayer,100);endId=setTimeout(finish,10000);};
  document.addEventListener('click',event=>{if(!event.target.closest(BUTTONS)||active)return;setTimeout(show,90);},true);
})();