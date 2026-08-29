(() => {
  'use strict';
  if (window.__relayMobileCsgoFullMapV1) return;
  window.__relayMobileCsgoFullMapV1 = true;

  const isMobile = () => matchMedia('(max-width: 760px)').matches;
  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const intro = () => document.getElementById('relayGameplayIntroFinalV3');
  const svg = () => intro()?.querySelector('.map-briefing-map');
  const n = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function point(v, sx, sy) {
    if (Array.isArray(v)) return { x: n(v[0]) * sx, y: n(v[1]) * sy };
    return { x: n(v?.x) * sx, y: n(v?.y) * sy };
  }

  function draw() {
    if (!isMobile()) return;
    const root = intro(), el = svg(), s = scene();
    if (!root || !el || !s) return;
    const m = s.mission || {};
    const worldW = n(s.physics?.world?.bounds?.width, n(m.goal?.x, 6100) + 300);
    const worldH = n(s.physics?.world?.bounds?.height, 720);
    const W = 1000, H = 560, sx = 900 / Math.max(worldW, 1), sy = 430 / Math.max(worldH, 1);
    const X = x => 50 + clamp(n(x) * sx, 0, 900), Y = y => 55 + clamp(n(y) * sy, 0, 430);
    const arr = k => Array.isArray(m[k]) ? m[k] : [];
    const p = s.player || {};
    const start = { x: X(m.spawn?.x ?? 120), y: Y(m.spawn?.y ?? 520) };
    const goal = { x: X(m.goal?.x ?? worldW - 100), y: Y(m.goal?.y ?? 500) };
    const you = { x: X(p.x ?? m.spawn?.x ?? 120), y: Y(p.y ?? m.spawn?.y ?? 520) };
    const cps = arr('checkpoints').map(v => point(v, sx, sy));
    const route = [start, ...cps, goal];
    const path = route.map((v,i) => `${i?'L':'M'}${X(v.x/sx-50)/1} ${Y(v.y/sy-55)/1}`).join(' ');
    const rects = k => arr(k).map(v => {
      const a = Array.isArray(v) ? v : [v?.x, v?.y, v?.width ?? v?.w ?? 50, v?.height ?? v?.h ?? 20];
      const x = X(a[0]), y = Y(a[1]), w = Math.max(5, n(a[2],50)*sx), h = Math.max(4,n(a[3],20)*sy);
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="world-block"/>`;
    }).join('');
    const dots = (k, cls, label='') => arr(k).map((v,i) => { const q=point(v,sx,sy); return `<g class="${cls}"><circle cx="${X(q.x/sx-50)}" cy="${Y(q.y/sy-55)}" r="${cls==='hostile'?7:5}"/><text x="${X(q.x/sx-50)+10}" y="${Y(q.y/sy-55)+3}">${label || (cls==='checkpoint' ? 'CP '+(i+1) : '')}</text></g>`; }).join('');
    const cpMarkup = cps.map((q,i)=>`<g class="checkpoint"><circle cx="${X(q.x/sx-50)}" cy="${Y(q.y/sy-55)}" r="12"/><circle cx="${X(q.x/sx-50)}" cy="${Y(q.y/sy-55)}" r="3"/><text x="${X(q.x/sx-50)+15}" y="${Y(q.y/sy-55)+3}">CP ${i+1}</text></g>`).join('');
    const grid = Array.from({length:10},(_,i)=>`<path d="M${i*100} 0V560"/><path d="M0 ${i*56}H1000"/>`).join('');
    el.innerHTML = `<style>
      .bg{fill:#050505}.grid{stroke:#242424;stroke-width:1;opacity:.7}.world-block{fill:#161616;stroke:#4d4d4d;stroke-width:2}.route{fill:none;stroke:#f2c94c;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.routeGlow{fill:none;stroke:#f2c94c;stroke-width:12;opacity:.08}.checkpoint circle:first-child{fill:#101010;stroke:#f2c94c;stroke-width:2}.checkpoint circle:nth-child(2){fill:#f2c94c}.checkpoint text{fill:#f2c94c;font:700 10px ui-monospace,monospace}.start circle{fill:#68d391;stroke:#d8ffe7;stroke-width:2}.start text{fill:#8ff0ae;font:700 10px ui-monospace,monospace}.goal circle{fill:#f2c94c;stroke:#fff0b0;stroke-width:2}.goal text{fill:#f2c94c;font:700 10px ui-monospace,monospace}.you circle{fill:#63d9ff;stroke:#fff;stroke-width:2}.you text{fill:#63d9ff;font:700 10px ui-monospace,monospace}.hostile circle{fill:#d64c4c;stroke:#ffb0b0;stroke-width:2}.hostile text{fill:#ff8f8f;font:700 8px ui-monospace,monospace}.signal circle{fill:#9ee6ff;stroke:#fff;stroke-width:1}.signal text{fill:#9ee6ff;font:700 8px ui-monospace,monospace}.legend{fill:#a9a9a9;font:700 9px ui-monospace,monospace;letter-spacing:.08em}.district{fill:#6d6d6d;font:700 12px ui-monospace,monospace;letter-spacing:.16em}.road{stroke:#303030;stroke-width:18;opacity:.8}.road2{stroke:#171717;stroke-width:10}.border{fill:none;stroke:#555;stroke-width:2}.scan{fill:url(#scan);opacity:.14}</style>
      <defs><pattern id="scan" width="1" height="8" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#fff"/></pattern></defs>
      <rect width="1000" height="560" class="bg"/><g class="grid">${grid}</g>
      <path d="M40 470 Q280 400 470 300 T960 80" class="road"/><path d="M40 470 Q280 400 470 300 T960 80" class="road2"/>
      ${rects('platforms')}${rects('obstacles')}${rects('movingGates')}
      <path d="${path}" class="routeGlow"/><path d="${path}" class="route"/>
      ${cpMarkup}${dots('enemies','hostile','HOSTILE')}${dots('signals','signal','SIGNAL')}${dots('boostPads','signal','BOOST')}
      <g class="start"><circle cx="${start.x}" cy="${start.y}" r="8"/><text x="${start.x+14}" y="${start.y+4}">START</text></g>
      <g class="goal"><circle cx="${goal.x}" cy="${goal.y}" r="9"/><text x="${goal.x+14}" y="${goal.y+4}">TARGET</text></g>
      <g class="you"><circle cx="${you.x}" cy="${you.y}" r="7"/><text x="${you.x+12}" y="${you.y-10}">YOU</text></g>
      <text x="30" y="30" class="district">${String(m.district || 'CURRENT DISTRICT').toUpperCase()}</text>
      <text x="970" y="530" text-anchor="end" class="legend">ROUTE  CHECKPOINT  TARGET  HOSTILE  SIGNAL  YOU</text>
      <rect x="10" y="10" width="980" height="540" class="border"/><rect width="1000" height="560" class="scan"/>
    </svg>`;
  }

  const css = document.createElement('style');
  css.textContent = `
    @media(max-width:760px){
      #relayGameplayIntroFinalV3 .map-briefing-shell{width:100vw!important;height:100dvh!important;padding:8px!important;gap:8px!important;border:0!important;border-radius:0!important;background:#050505!important;box-shadow:none!important}
      #relayGameplayIntroFinalV3 .map-briefing-head{padding:5px 6px!important}
      #relayGameplayIntroFinalV3 .map-briefing-kicker{color:#f2c94c!important}
      #relayGameplayIntroFinalV3 .map-briefing-title{color:#f5f5f5!important;font-size:22px!important}
      #relayGameplayIntroFinalV3 .map-briefing-timer{border-color:rgba(242,201,76,.5)!important;background:#0b0b0b!important}
      #relayGameplayIntroFinalV3 .map-briefing-timer b{color:#f2c94c!important}
      #relayGameplayIntroFinalV3 .map-briefing-map-wrap{border:1px solid #3c3c3c!important;border-radius:4px!important;background:#050505!important}
      #relayGameplayIntroFinalV3 .map-briefing-map{background:#050505!important}
      #relayGameplayIntroFinalV3 .map-briefing-scan,#relayGameplayIntroFinalV3 .map-briefing-vignette,#relayGameplayIntroFinalV3 .map-briefing-tag{display:none!important}
      #relayGameplayIntroFinalV3 .map-briefing-foot{padding:4px 6px!important;color:#777!important}
    }
  `;
  document.head.appendChild(css);

  const tick = () => { if (intro()?.hidden === false) draw(); };
  new MutationObserver(tick).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden','class']});
  window.addEventListener('resize',draw,{passive:true});
  setInterval(tick,500);
})();
