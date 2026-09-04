/* Relay Runner — AAA tactical mission-map presentation layer V2.
 * Presentation only: does not own Home, mission selection, countdown, or gameplay state.
 */
(() => {
  'use strict';
  if (window.__relayMapAAATacticalUpgradeV2) return;
  window.__relayMapAAATacticalUpgradeV2 = true;

  const root = () => document.getElementById('relayGameplayIntroFinalV3');
  const scene = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  function ensureShell() {
    const r = root();
    if (!r) return null;
    const shell = r.querySelector('.map-briefing-shell');
    if (!shell || shell.querySelector('.aaa-map-chrome')) return shell;
    const mapWrap = shell.querySelector('.map-briefing-map-wrap');
    if (!mapWrap) return shell;

    const chrome = document.createElement('div');
    chrome.className = 'aaa-map-chrome';
    chrome.innerHTML = `
      <div class="aaa-map-corner aaa-map-corner-tl"></div><div class="aaa-map-corner aaa-map-corner-tr"></div>
      <div class="aaa-map-corner aaa-map-corner-bl"></div><div class="aaa-map-corner aaa-map-corner-br"></div>
      <div class="aaa-map-topline"><span>RELAY NETWORK / TACTICAL OVERVIEW</span><span class="aaa-map-live"><i></i> LIVE INTEL</span></div>
      <div class="aaa-map-bottomline"><span>ROUTE DATA // ENCRYPTED</span><span>SCAN · ACTIVE</span></div>`;
    mapWrap.appendChild(chrome);

    const card = document.createElement('aside');
    card.className = 'aaa-map-card';
    card.setAttribute('aria-label', 'Current mission details');
    card.innerHTML = `
      <div class="aaa-card-status"><span class="aaa-status-dot"></span><span>MISSION READY</span><b>01</b></div>
      <div class="aaa-card-kicker">CURRENT OPERATION</div>
      <h3 class="aaa-card-title">CURRENT MISSION</h3>
      <p class="aaa-card-district">CURRENT DISTRICT</p>
      <div class="aaa-card-grid">
        <div><small>DIFFICULTY</small><strong data-aaa-difficulty>—</strong></div>
        <div><small>ROUTE</small><strong data-aaa-route>ACTIVE</strong></div>
        <div><small>SIGNALS</small><strong data-aaa-signals>—</strong></div>
        <div><small>REWARD</small><strong data-aaa-reward>XP</strong></div>
      </div>
      <div class="aaa-card-objective"><span>OBJECTIVE</span><strong data-aaa-objective>FOLLOW THE RELAY</strong></div>`;
    shell.appendChild(card);
    return shell;
  }

  function missionData(s) {
    const m = s?.mission || {};
    const difficulty = String(m.difficulty || s?.sys?.settings?.data?.difficulty || 'STANDARD').replace(/[_-]+/g, ' ').toUpperCase();
    const signals = Array.isArray(m.signals) ? m.signals.length : (Array.isArray(s?.signals?.getChildren?.()) ? s.signals.getChildren().length : null);
    const reward = Number.isFinite(Number(m.reward)) ? `${Number(m.reward)} XP` : 'RELAY XP';
    return {
      id: String(m.id || '01').toUpperCase(),
      title: String(m.title || 'CURRENT MISSION').trim(),
      district: String(m.district || 'CURRENT DISTRICT').trim(),
      objective: String(m.objective || 'FOLLOW THE RELAY').trim(),
      difficulty,
      signals: signals == null ? '—' : String(signals).padStart(2, '0'),
      reward,
    };
  }

  function updateCard() {
    const r = root();
    const s = scene();
    if (!r || !s || r.hidden) return;
    ensureShell();
    const d = missionData(s);
    const set = (selector, value) => { const el = r.querySelector(selector); if (el) el.textContent = value; };
    set('.aaa-card-title', d.title);
    set('.aaa-card-district', d.district.toUpperCase());
    set('[data-aaa-difficulty]', d.difficulty);
    set('[data-aaa-signals]', d.signals);
    set('[data-aaa-reward]', d.reward);
    set('[data-aaa-objective]', d.objective);
    const badge = r.querySelector('.aaa-card-status b');
    if (badge) badge.textContent = d.id;
  }

  function promoteSvg() {
    const r = root();
    const svg = r?.querySelector('.map-briefing-map');
    if (!svg) return;
    svg.querySelectorAll('circle.marker-start,circle.marker-goal,circle.marker-player,circle.enemy,circle.checkpoint-ring').forEach(circle => {
      const cls = circle.getAttribute('class') || '';
      if (circle.dataset.aaaHex === '1') return;
      const cx = Number(circle.getAttribute('cx') || 0), cy = Number(circle.getAttribute('cy') || 0), radius = Number(circle.getAttribute('r') || 8);
      const points = Array.from({length:6}, (_, i) => {
        const angle = Math.PI / 6 + i * Math.PI / 3;
        return `${(cx + Math.cos(angle) * radius * 1.42).toFixed(1)},${(cy + Math.sin(angle) * radius * 1.42).toFixed(1)}`;
      }).join(' ');
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', points);
      polygon.setAttribute('class', cls);
      polygon.dataset.aaaHex = '1';
      for (const attr of ['data-index','aria-label']) if (circle.hasAttribute(attr)) polygon.setAttribute(attr, circle.getAttribute(attr));
      circle.replaceWith(polygon);
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    #relayGameplayIntroFinalV3{background:#010204!important;color:#f5f0df!important}
    #relayGameplayIntroFinalV3 .map-briefing-shell{width:min(1280px,96vw)!important;height:min(840px,94dvh)!important;padding:16px!important;gap:12px!important;border:1px solid rgba(208,169,73,.42)!important;border-radius:5px!important;background:linear-gradient(145deg,#050607 0%,#0a0b0c 55%,#030405 100%)!important;box-shadow:0 30px 120px rgba(0,0,0,.86),0 0 80px rgba(208,169,73,.08),inset 0 0 0 1px rgba(255,255,255,.025)!important}
    #relayGameplayIntroFinalV3 .map-briefing-head{align-items:center!important;padding:4px 4px 2px!important}
    #relayGameplayIntroFinalV3 .map-briefing-kicker{color:#cfa94a!important;letter-spacing:.26em!important}
    #relayGameplayIntroFinalV3 .map-briefing-title{color:#f6f1df!important;font-size:clamp(27px,4vw,42px)!important;letter-spacing:.12em!important;text-shadow:0 0 26px rgba(207,169,74,.13)!important}
    #relayGameplayIntroFinalV3 .map-briefing-meta{color:#687077!important}
    #relayGameplayIntroFinalV3 .map-briefing-timer{width:70px!important;height:70px!important;border-color:rgba(207,169,74,.55)!important;border-radius:4px!important;background:#08090a!important;box-shadow:inset 0 0 20px rgba(207,169,74,.035),0 0 26px rgba(207,169,74,.08)!important}
    #relayGameplayIntroFinalV3 .map-briefing-timer b{color:#e5c66b!important}
    #relayGameplayIntroFinalV3 .map-briefing-timer span{color:#706957!important}
    #relayGameplayIntroFinalV3 .map-briefing-map-wrap{border:1px solid rgba(207,169,74,.34)!important;border-radius:3px!important;background:#020506!important;box-shadow:inset 0 0 80px rgba(0,0,0,.8),inset 0 0 28px rgba(207,169,74,.035)!important}
    #relayGameplayIntroFinalV3 .map-briefing-map{background:#020506!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .bg{fill:#020506!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .grid{stroke:#4a3d20!important;opacity:.34!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .platform{fill:#111719!important;stroke:#5e553f!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .route{stroke:#d4ad4d!important;stroke-width:3!important;filter:url(#glow)!important;stroke-dasharray:9 7!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .route-halo{stroke:#d4ad4d!important;opacity:.14!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .marker-start{fill:#6e9a61!important;stroke:#d9e9c8!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .marker-goal{fill:#d4ad4d!important;stroke:#fff0b0!important;filter:url(#glow)!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .marker-player{fill:#e8d9a8!important;stroke:#8df4ff!important;filter:url(#glow)!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .checkpoint-ring{stroke:#d4ad4d!important;stroke-width:2!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .checkpoint-dot{fill:#d4ad4d!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .signal{fill:#d4ad4d!important;stroke:#fff0b0!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .enemy{fill:#1c1111!important;stroke:#d76b5c!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .secret{stroke:#a78bd1!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .boost{fill:#0b252a!important;stroke:#79d5e6!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .boostmark{fill:#79d5e6!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .gate{fill:#241416!important;stroke:#d76b5c!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .label{fill:#b7a978!important;font-size:8px!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .legend{fill:#82775d!important}
    #relayGameplayIntroFinalV3 .map-briefing-map .guide{fill:#8bd8e4!important}
    #relayGameplayIntroFinalV3 .map-briefing-scan{background:linear-gradient(180deg,transparent 49%,rgba(207,169,74,.055) 50%,transparent 51%)!important;opacity:.5!important}
    #relayGameplayIntroFinalV3 .map-briefing-vignette{background:radial-gradient(circle at 52% 48%,transparent 48%,rgba(0,0,0,.62) 100%)!important}
    #relayGameplayIntroFinalV3 .map-briefing-tag{border-color:rgba(207,169,74,.3)!important;background:rgba(5,6,7,.82)!important;color:#d4ad4d!important}
    #relayGameplayIntroFinalV3 .map-briefing-foot{color:#625c4e!important}
    #relayGameplayIntroFinalV3 .map-briefing-objective{color:#cfc5ab!important}
    .aaa-map-chrome{position:absolute;inset:0;pointer-events:none;z-index:4}
    .aaa-map-topline,.aaa-map-bottomline{position:absolute;left:14px;right:14px;display:flex;justify-content:space-between;align-items:center;color:#766b53;font:800 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.17em;text-transform:uppercase}
    .aaa-map-topline{top:12px}.aaa-map-bottomline{bottom:12px}
    .aaa-map-live{color:#a99a73}.aaa-map-live i{display:inline-block;width:5px;height:5px;margin-right:5px;border-radius:50%;background:#d4ad4d;box-shadow:0 0 10px rgba(212,173,77,.8);animation:aaaLive 1.4s ease-in-out infinite}
    .aaa-map-corner{position:absolute;width:22px;height:22px;border-color:rgba(212,173,77,.62);border-style:solid}.aaa-map-corner-tl{top:8px;left:8px;border-width:1px 0 0 1px}.aaa-map-corner-tr{top:8px;right:8px;border-width:1px 1px 0 0}.aaa-map-corner-bl{bottom:8px;left:8px;border-width:0 0 1px 1px}.aaa-map-corner-br{bottom:8px;right:8px;border-width:0 1px 1px 0}
    .aaa-map-card{position:absolute;z-index:6;right:24px;bottom:24px;width:min(310px,34%);box-sizing:border-box;padding:16px;border:1px solid rgba(212,173,77,.48);border-radius:4px;background:linear-gradient(145deg,rgba(10,10,9,.97),rgba(17,16,13,.95));box-shadow:0 18px 55px rgba(0,0,0,.65),inset 0 0 28px rgba(212,173,77,.035);backdrop-filter:blur(7px)}
    .aaa-card-status{display:flex;align-items:center;gap:7px;color:#8c825f;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em}.aaa-card-status b{margin-left:auto;color:#d8b458;font-size:10px}.aaa-status-dot{width:6px;height:6px;border-radius:50%;background:#d8b458;box-shadow:0 0 12px rgba(216,180,88,.75)}
    .aaa-card-kicker{margin-top:15px;color:#8b805f;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.2em}.aaa-card-title{margin:6px 0 2px;color:#f0ead9;font:950 clamp(17px,2vw,24px)/1.05 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.05em;text-transform:uppercase}.aaa-card-district{margin:0;color:#c6aa64;font:800 8px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;text-transform:uppercase}
    .aaa-card-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;margin-top:14px;border-top:1px solid rgba(212,173,77,.14);border-bottom:1px solid rgba(212,173,77,.14)}.aaa-card-grid>div{padding:9px 5px}.aaa-card-grid>div:nth-child(odd){border-right:1px solid rgba(212,173,77,.14)}.aaa-card-grid small{display:block;color:#6e6757;font:800 6px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em}.aaa-card-grid strong{display:block;margin-top:4px;color:#ddd2b7;font:900 8px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.aaa-card-objective{margin-top:11px;padding:9px;background:#070807;border-left:2px solid #cfa94a}.aaa-card-objective span{display:block;color:#6d6655;font:800 6px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.15em}.aaa-card-objective strong{display:block;margin-top:5px;color:#cfc5ad;font:800 8px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}
    @keyframes aaaLive{0%,100%{opacity:.4}50%{opacity:1}}
    @media(max-width:760px){
      #relayGameplayIntroFinalV3 .map-briefing-shell{width:98vw!important;height:96dvh!important;padding:9px!important;gap:8px!important}
      #relayGameplayIntroFinalV3 .map-briefing-head{padding:3px!important}.aaa-map-topline,.aaa-map-bottomline{left:8px;right:8px;font-size:5px;letter-spacing:.1em}.aaa-map-corner{width:15px;height:15px}
      .aaa-map-card{left:9px;right:9px;bottom:9px;width:auto;padding:11px}.aaa-card-kicker{margin-top:9px}.aaa-card-title{font-size:15px}.aaa-card-grid{margin-top:9px}.aaa-card-grid>div{padding:7px 4px}.aaa-card-objective{margin-top:7px;padding:7px}.aaa-card-objective strong{font-size:7px}
      #relayGameplayIntroFinalV3 .map-briefing-foot{padding-bottom:1px}.aaa-map-chrome{z-index:4}
    }
    @media(max-height:620px) and (orientation:landscape){.aaa-map-card{width:260px;padding:9px}.aaa-card-kicker{margin-top:6px}.aaa-card-grid{margin-top:7px}.aaa-card-objective{margin-top:6px;padding:6px}}
    @media(prefers-reduced-motion:reduce){.aaa-map-live i{animation:none}}
  `;
  document.head.appendChild(style);

  const refresh = () => { ensureShell(); updateCard(); promoteSvg(); };
  window.dispatchEvent(new CustomEvent('relay:map-v2-ready', { detail: { root: root() } }));
  document.addEventListener('DOMContentLoaded', refresh, { once:true });
  window.addEventListener('resize', refresh, { passive:true });
  window.setInterval(refresh, 300);
})();
