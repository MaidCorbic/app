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
        <div><p class="map-briefing-kicker">RELAY RUNNER // LIVE MAP</p><h2 class="map-briefing-title">MISSION ROUTE</h2><p class="map-briefing-meta"></p></div>
        <div class="map-briefing-timer" aria-live="polite"><b>10</b><span>SEC</span></div>
      </header>
      <div class="map-briefing-map-wrap">
        <svg class="map-briefing-map" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Actual level route map"></svg>
        <div class="map-briefing-scan"></div><div class="map-briefing-vignette"></div>
        <div class="map-briefing-tag">REAL LEVEL ROUTE</div>
      </div>
      <footer class="map-briefing-foot"><span class="map-briefing-objective"></span><span>LIVE ROUTE · 10 SEC</span></footer>
    </div>`;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.textContent = `
    #relayGameplayIntroFinalV3{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;overflow:hidden;background:#02060c;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;pointer-events:auto}
    #relayGameplayIntroFinalV3[hidden]{display:none}
    #relayGameplayIntroFinalV3 .map-briefing-shell{position:relative;z-index:2;width:min(1160px,94vw);height:min(820px,90dvh);display:grid;grid-template-rows:auto 1fr auto;gap:14px;padding:18px;border:1px solid rgba(141,244,255,.18);border-radius:16px;background:rgba(3,11,19,.94);box-shadow:0 30px 120px rgba(0,0,0,.68),0 0 70px rgba(141,244,255,.06);box-sizing:border-box}
    #relayGameplayIntroFinalV3 .map-briefing-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
    #relayGameplayIntroFinalV3 .map-briefing-kicker{margin:0 0 6px;color:#8df4ff;font-size:8px;font-weight:900;letter-spacing:.22em}
    #relayGameplayIntroFinalV3 .map-briefing-title{margin:0;color:#f1f7fa;font-size:clamp(24px,4vw,38px);line-height:.95;letter-spacing:.08em}
    #relayGameplayIntroFinalV3 .map-briefing-meta{margin:7px 0 0;color:#7890a4;font-size:8px;letter-spacing:.1em}
    #relayGameplayIntroFinalV3 .map-briefing-timer{width:66px;height:66px;display:grid;place-items:center;align-content:center;border:1px solid rgba(255,208,110,.34);border-radius:14px;background:rgba(255,208,110,.04);box-shadow:0 0 28px rgba(255,208,110,.06)}
    #relayGameplayIntroFinalV3 .map-briefing-timer b{color:#ffd06e;font-size:26px;line-height:1}.map-briefing-timer span{margin-top:3px;color:#74889a;font-size:6px;letter-spacing:.16em}
    #relayGameplayIntroFinalV3 .map-briefing-map-wrap{position:relative;min-height:0;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(141,244,255,.12);border-radius:12px;background:#02070d}
    #relayGameplayIntroFinalV3 .map-briefing-map{display:block;width:100%;height:100%;background:#02070d}
    #relayGameplayIntroFinalV3 .map-briefing-scan{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 49%,rgba(141,244,255,.05) 50%,transparent 51%);background-size:100% 8px;opacity:.35}
    #relayGameplayIntroFinalV3 .map-briefing-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 50%,transparent 54%,rgba(0,0,0,.34) 100%)}
    #relayGameplayIntroFinalV3 .map-briefing-tag{position:absolute;left:12px;bottom:12px;padding:7px 9px;border:1px solid rgba(141,244,255,.18);border-radius:7px;background:rgba(2,8,14,.72);color:#8df4ff;font-size:6px;font-weight:900;letter-spacing:.16em;backdrop-filter:blur(6px)}
    #relayGameplayIntroFinalV3 .map-briefing-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#60798a;font-size:6px;font-weight:800;letter-spacing:.12em}.map-briefing-objective{max-width:70%;color:#d8e9ef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #play.relay-map-briefing-lock .hud,#play.relay-map-briefing-lock .world-marker,#play.relay-map-briefing-lock .input-guide,#play.relay-map-briefing-lock .mobile-controls,#play.relay-map-briefing-lock .rotate-prompt,#play.relay-map-briefing-lock #toast,#play.relay-map-briefing-lock #pause{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    @media(max-width:760px){#relayGameplayIntroFinalV3 .map-briefing-shell{width:96vw;height:92dvh;padding:12px;gap:10px;border-radius:14px}#relayGameplayIntroFinalV3 .map-briefing-title{font-size:24px}.map-briefing-meta{font-size:6px!important}.map-briefing-timer{width:54px!important;height:54px!important;border-radius:11px!important}.map-briefing-timer b{font-size:21px!important}.map-briefing-foot{font-size:5px!important}}
  `;
  document.head.appendChild(style);

  const esc = value => String(value ?? '').replace(/[&<>\\\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
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
    const points = {
      start: {x:X(m?.spawn?.x ?? 120), y:Y(m?.spawn?.y ?? 520)},
      goal: {x:X(m?.goal?.x ?? 6100), y:Y(m?.goal?.y ?? 500)},
      player: {x:X(p?.x ?? m?.spawn?.x ?? 120), y:Y(p?.y ?? m?.spawn?.y ?? 520)},
    };
    const arr = key => Array.isArray(m?.[key]) ? m[key] : [];
    const point = item => Array.isArray(item) ? {x:X(item[0]), y:Y(item[1])} : {x:X(item?.x), y:Y(item?.y)};
    const rect = item => { const x=num(item?.[0]), y=num(item?.[1]), w=num(item?.[2],40), h=num(item?.[3],20); return {x:X(x), y:Y(y), w:Math.max(4,w*sx), h:Math.max(3,h*sy)}; };
    return { width, X, Y, points, platforms:arr('platforms'), obstacles:arr('obstacles'), boostPads:arr('boostPads'), checkpoints:arr('checkpoints'), signals:arr('signals'), secrets:arr('secrets'), movingGates:arr('movingGates'), enemies:arr('enemies'), guides:arr('guides'), point, rect };
  }

  function renderMap(scene) {
    const svg = root.querySelector('.map-briefing-map');
    if (!svg || !scene) return;
    const d = mapModel(scene);
    const pathPoints = [d.points.start, ...d.checkpoints.map(d.point), d.points.goal];
    const routePath = pathPoints.map((p,i) => `${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const platforms = d.platforms.map(item => { const r=d.rect(item); return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="4" class="platform"/>`; }).join('');
    const obstacles = d.obstacles.map(item => { const p=d.point(item); return `<path d="M ${p.x-9} ${p.y+8} L ${p.x} ${p.y-9} L ${p.x+9} ${p.y+8} Z" class="danger"/>`; }).join('');
    const pads = d.boostPads.map(item => { const r=d.rect([item[0]-28,item[1]-8,56,16]); return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="4" class="boost"/><path d="M ${r.x+7} ${r.y+r.h/2} l 9 -6 v 12 z M ${r.x+20} ${r.y+r.h/2} l 9 -6 v 12 z" class="boostmark"/>`; }).join('');
    const cps = d.checkpoints.map((item,i) => { const p=d.point(item); return `<g><circle cx="${p.x}" cy="${p.y}" r="13" class="checkpoint-ring"/><circle cx="${p.x}" cy="${p.y}" r="4" class="checkpoint-dot"/><text x="${p.x}" y="${p.y-18}" class="label">CP ${i+1}</text></g>`; }).join('');
    const signals = d.signals.map(item => { const p=d.point(item); return `<circle cx="${p.x}" cy="${p.y}" r="4.5" class="signal"/>`; }).join('');
    const secrets = d.secrets.map(item => { const p=d.point(item); return `<path d="M ${p.x} ${p.y-6} l 6 6 -6 6 -6 -6 Z" class="secret"/>`; }).join('');
    const gates = d.movingGates.map(item => { const r=d.rect(item); return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="3" class="gate"/>`; }).join('');
    const enemies = d.enemies.map(item => { const p=d.point(item); return `<g><circle cx="${p.x}" cy="${p.y}" r="8" class="enemy"/><text x="${p.x+11}" y="${p.y+3}" class="label">HOSTILE</text></g>`; }).join('');
    const guides = d.guides.map(item => { const p=d.point(item); return `<text x="${p.x}" y="${p.y-13}" class="guide">${esc(item?.text || '')}</text>`; }).join('');
    svg.innerHTML = `<defs><filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <style>.bg{fill:#030a12}.grid{stroke:#143044;stroke-width:1;opacity:.55}.platform{fill:#14283a;stroke:#52758b;stroke-width:1.2}.danger{fill:#ff826e;opacity:.88}.boost{fill:#0d3140;stroke:#8df4ff;stroke-width:1.2}.boostmark{fill:#8df4ff}.checkpoint-ring{fill:none;stroke:#8df4ff;stroke-width:1.5;opacity:.75}.checkpoint-dot{fill:#8df4ff}.signal{fill:#ffd06e;filter:url(#glow)}.secret{fill:none;stroke:#e0a7ff;stroke-width:1.5}.gate{fill:#3d1f2d;stroke:#ff826e;stroke-width:1.2;opacity:.9}.enemy{fill:#321d2b;stroke:#ff826e;stroke-width:2}.route{fill:none;stroke:#8df4ff;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:10 8;opacity:.82;filter:url(#glow)}.route-halo{fill:none;stroke:#8df4ff;stroke-width:10;opacity:.08}.marker-start{fill:#aee37f;stroke:#eaffd6;stroke-width:2}.marker-goal{fill:#ffd06e;stroke:#fff0c7;stroke-width:2}.marker-player{fill:#eafcff;stroke:#8df4ff;stroke-width:2;filter:url(#glow)}.label,.guide{font-family:ui-monospace,monospace;fill:#718b9e;font-size:9px;letter-spacing:.12em}.guide{fill:#8df4ff;font-size:8px}.legend{font-family:ui-monospace,monospace;fill:#9fb6c5;font-size:9px;letter-spacing:.1em}</style>
      <rect width="1000" height="560" class="bg"/><path d="M0 110H1000M0 220H1000M0 330H1000M0 440H1000" class="grid"/><path d="M120 0V560M240 0V560M360 0V560M480 0V560M600 0V560M720 0V560M840 0V560" class="grid"/>
      <path d="${routePath}" class="route-halo"/><path d="${routePath}" class="route"/>
      ${platforms}${gates}${obstacles}${pads}${signals}${secrets}${cps}${enemies}${guides}
      <g><circle cx="${d.points.start.x}" cy="${d.points.start.y}" r="8" class="marker-start"/><text x="${d.points.start.x+13}" y="${d.points.start.y+4}" class="legend">START</text></g>
      <g><circle cx="${d.points.goal.x}" cy="${d.points.goal.y}" r="10" class="marker-goal"/><path d="M ${d.points.goal.x-4} ${d.points.goal.y+8} V ${d.points.goal.y-9} l 15 5 -15 6" fill="#ffd06e"/><text x="${d.points.goal.x+15}" y="${d.points.goal.y+4}" class="legend">OBJECTIVE</text></g>
      <g id="live-player"><circle cx="${d.points.player.x}" cy="${d.points.player.y}" r="7" class="marker-player"/><text x="${d.points.player.x+12}" y="${d.points.player.y-10}" class="legend">YOU</text></g>
      <g transform="translate(28 528)"><circle cx="0" cy="0" r="4" class="signal"/><text x="12" y="3" class="legend">SIGNAL</text><circle cx="88" cy="0" r="4" class="enemy"/><text x="100" y="3" class="legend">THREAT</text><circle cx="178" cy="0" r="4" class="marker-goal"/><text x="190" y="3" class="legend">TARGET</text></g>`;
  }

  let active=false,timerId=0,endId=0,followId=0;
  const lock = state => { window.__relayCinematicLock=state; document.getElementById('play')?.classList.toggle('relay-map-briefing-lock',state); window.dispatchEvent(new Event(state?'relay:cinematic-lock':'relay:cinematic-unlock')); };
  const updateTimer = ms => { const el=root.querySelector('.map-briefing-timer b'); if(el) el.textContent=String(Math.max(0,Math.ceil(ms/1000))); };
  const updatePlayer = () => { if(!active)return; const scene=runner(); const svg=root.querySelector('.map-briefing-map'); const group=svg?.querySelector('#live-player'); if(!scene||!group)return; const d=mapModel(scene); const c=group.querySelector('circle'),t=group.querySelector('text'); c?.setAttribute('cx',d.points.player.x); c?.setAttribute('cy',d.points.player.y); t?.setAttribute('x',d.points.player.x+12); t?.setAttribute('y',d.points.player.y-10); };
  const finish=()=>{clearInterval(timerId);clearTimeout(endId);clearInterval(followId);timerId=endId=followId=0;active=false;lock(false);root.hidden=true;};
  const show=async()=>{if(active)return;active=true;lock(true);root.hidden=false;const startedWait=performance.now();let data=mission();while(!data.scene&&performance.now()-startedWait<4500){await wait(80);data=mission();}data=mission();root.querySelector('.map-briefing-meta').textContent=`${data.district} // ${data.title}`;root.querySelector('.map-briefing-objective').textContent=data.objective;renderMap(data.scene);const started=performance.now();updateTimer(10000);timerId=setInterval(()=>updateTimer(10000-(performance.now()-started)),250);followId=setInterval(updatePlayer,100);endId=setTimeout(finish,10000);};
  document.addEventListener('click',event=>{if(!event.target.closest(BUTTONS)||active)return;setTimeout(show,90);},true);
})();