(() => {
  'use strict';
  if (window.__relayHomeWorldUiPolishV1) return;
  window.__relayHomeWorldUiPolishV1 = true;

  const STYLE_ID = 'relay-home-world-ui-polish-v1';
  const byId = id => document.getElementById(id);

  function installStyles() {
    if (byId(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* HOME: one canonical button surface; legacy menu stays hidden. */
      #intro.home-v3 .main-menu{display:none!important;visibility:hidden!important;pointer-events:none!important}
      #intro.home-v3 .home-v3-side{z-index:90!important}
      #intro.home-v3 .home-v3-card{pointer-events:auto!important;touch-action:manipulation!important}
      #intro.home-v3 .home-v3-card:focus-visible{outline:2px solid rgba(255,208,110,.88)!important;outline-offset:3px}
      #intro.home-v3 .home-v3-card::before{content:"";position:absolute;left:12px;top:50%;width:3px;height:3px;border-radius:50%;background:#ffd06e;box-shadow:0 0 10px rgba(255,208,110,.8);transform:translateY(-50%);opacity:.8}
      #intro.home-v3 .home-v3-card span{padding-left:12px}

      /* Home clock / live system status. */
      #intro.home-v3 .relay-home-clock{display:flex;align-items:center;gap:8px;min-width:112px;justify-content:flex-end;color:#b9c9d4;font:800 8px/1.1 'DM Mono',ui-monospace,monospace;letter-spacing:.11em;text-align:right}
      #intro.home-v3 .relay-home-clock i{width:6px;height:6px;border-radius:50%;background:#aee37f;box-shadow:0 0 12px rgba(174,227,127,.75);animation:relayClockPulse 1.8s ease-in-out infinite}
      #intro.home-v3 .relay-home-clock b{display:block;color:#f4e6bd;font-size:10px;letter-spacing:.08em}
      #intro.home-v3 .relay-home-clock small{display:block;margin-top:4px;color:#708493;font-size:6px;letter-spacing:.14em}
      @keyframes relayClockPulse{0%,100%{opacity:.65;transform:scale(.9)}50%{opacity:1;transform:scale(1.12)}}

      /* More natural layered clouds. */
      #intro.home-v3 .relay-clouds{position:absolute;inset:0;z-index:3;overflow:hidden;pointer-events:none;opacity:.72;transition:opacity 1.8s ease,filter 1.8s ease}
      #intro.home-v3 .relay-cloud{position:absolute;width:clamp(220px,30vw,520px);height:clamp(52px,6vw,110px);border-radius:999px;filter:blur(7px);opacity:.32;background:radial-gradient(ellipse at 18% 62%,rgba(255,255,255,.72) 0 14%,transparent 36%),radial-gradient(ellipse at 38% 43%,rgba(255,255,255,.78) 0 19%,transparent 42%),radial-gradient(ellipse at 58% 54%,rgba(255,255,255,.64) 0 17%,transparent 40%),radial-gradient(ellipse at 76% 62%,rgba(255,255,255,.52) 0 14%,transparent 36%),linear-gradient(180deg,rgba(255,255,255,.38),rgba(196,214,224,.08));mix-blend-mode:screen;animation:relayCloudDrift linear infinite}
      #intro.home-v3 .relay-cloud::after{content:"";position:absolute;inset:22% 5% 0;border-radius:50%;background:linear-gradient(180deg,rgba(255,255,255,.12),transparent);filter:blur(8px)}
      #intro.home-v3 .relay-cloud.cloud-a{left:-12%;top:19%;animation-duration:78s}
      #intro.home-v3 .relay-cloud.cloud-b{left:44%;top:28%;width:clamp(180px,24vw,430px);opacity:.22;animation-duration:96s;animation-delay:-31s;transform:scale(.72)}
      #intro.home-v3 .relay-cloud.cloud-c{left:68%;top:12%;width:clamp(240px,28vw,480px);opacity:.18;animation-duration:112s;animation-delay:-62s;transform:scale(.58)}
      @keyframes relayCloudDrift{from{translate:-18vw 0}to{translate:120vw 0}}
      #intro.home-v3[data-atmosphere=night] .relay-clouds,#intro.home-v3[data-atmosphere=deep-night] .relay-clouds{opacity:.18;filter:saturate(.55) brightness(.58)}
      #intro.home-v3[data-atmosphere=dawn] .relay-clouds,#intro.home-v3[data-atmosphere=dusk] .relay-clouds{opacity:.62;filter:sepia(.08)}
      #intro.home-v3[data-atmosphere=day] .relay-clouds{opacity:.82}

      /* Gameplay: landscape XP + pause are anchored to the safe top-right cluster. */
      @media (orientation:landscape) and (max-height:760px){
        #play .hud{padding:8px 12px!important;gap:7px!important}
        #play .hud-actions{gap:6px!important;align-items:center!important}
        #play .hud-xp{min-width:64px!important;height:40px!important;padding:5px 9px!important;box-sizing:border-box!important}
        #play .hud-actions>button,#play #pause{width:44px!important;height:40px!important;min-width:44px!important;border-radius:10px!important;display:grid!important;place-items:center!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
        #play .hud-xp b{font-size:11px!important}
        #play .hud-xp small{font-size:6px!important}
      }
      @media (orientation:landscape) and (max-height:560px){
        #play .hud{padding:6px 10px!important}
        #play .hud-route{padding:6px 9px!important}
        #play .hud-progress{padding:6px 9px!important}
        #play .hud-xp{min-width:58px!important;height:36px!important}
        #play .hud-actions>button,#play #pause{width:40px!important;height:36px!important;min-width:40px!important}
      }

      /* Hide non-essential flow/telemetry HUD on phone and web; canonical HUD remains. */
      body #relayP1Momentum,body #relayP1DashStatus,body .relay-p1-momentum,body .relay-p1-dash-status,
      body #relayGameplayIntel,body .relay-gameplay-intel,body [data-relay-debug-hud],body [data-mission-intelligence],
      body #relay-gameplay-new-layer{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      @media (max-width:1100px),(hover:hover) and (pointer:fine){
        #play .input-guide{display:none!important}
      }

      /* Mission type/erase loop. */
      #play .world-marker.is-typing{border-color:rgba(255,208,110,.58)!important;box-shadow:0 0 28px rgba(255,208,110,.10),inset 0 1px rgba(255,255,255,.06)!important}
      #play .world-marker.is-typing b{min-height:1.15em!important}
      #play .world-marker.is-typing b::after{content:'_';margin-left:2px;color:#ffd06e;animation:relayMissionCursor .65s steps(1,end) infinite}
      @keyframes relayMissionCursor{0%,48%{opacity:1}49%,100%{opacity:0}}

      /* Map polish is active only after PLAY reveals the mission map. */
      body:not(.home-v3-active) #relayGameplayIntroFinalV3 .map-briefing-shell{border-color:rgba(255,208,110,.42)!important;box-shadow:0 26px 100px rgba(0,0,0,.82),0 0 55px rgba(255,208,110,.08)!important}
      body:not(.home-v3-active) #relayGameplayIntroFinalV3 .map-briefing-map-wrap{background:radial-gradient(circle at 52% 42%,rgba(42,76,86,.16),transparent 42%),#020506!important}
      body:not(.home-v3-active) #relayGameplayIntroFinalV3 .map-briefing-map{filter:contrast(1.06) saturate(.92)!important}
      body:not(.home-v3-active) #relayGameplayIntroFinalV3 .map-briefing-timer{box-shadow:0 0 24px rgba(255,208,110,.10),inset 0 0 18px rgba(255,208,110,.04)!important}

      /* Landscape settings/pause: dense, legible, no clipped cards. */
      @media (orientation:landscape) and (max-height:700px){
        #titlePanel .title-panel-card,#relayInfoPanel .relay-info-card{width:min(900px,94vw)!important;max-height:92dvh!important;padding:18px 20px!important;border-radius:14px!important}
        #titlePanelContent,#relayInfoContent{max-height:calc(92dvh - 126px)!important;overflow:auto!important}
        #pauseMenu{padding:8px!important}
        #pauseMenu .menu{width:min(1080px,96vw)!important;max-height:94dvh!important;overflow:hidden!important}
        #pauseMenu .menu-grid{grid-template-columns:210px minmax(0,1fr)!important;min-height:0!important}
        #pauseMenu aside{padding:14px!important;min-width:0!important}
        #pauseMenu aside nav{gap:6px!important}
        #pauseMenu .tab{min-height:42px!important;padding:9px 10px!important;font-size:9px!important;visibility:visible!important;opacity:1!important}
        #pauseMenu #panelContent{min-width:0!important;max-height:66dvh!important;overflow:auto!important;padding:14px!important}
        #pauseMenu .menu footer{padding:8px 14px!important}
        #pauseMenu .menu footer button{min-height:38px!important}
      }
      @media (max-width:760px) and (orientation:portrait){
        #titlePanel .title-panel-card,#relayInfoPanel .relay-info-card{width:calc(100vw - 18px)!important;max-height:94dvh!important}
        #titlePanelContent,#relayInfoContent{max-height:calc(94dvh - 116px)!important;overflow:auto!important}
      }
      @media(prefers-reduced-motion:reduce){#intro.home-v3 .relay-cloud{animation:none!important}#intro.home-v3 .relay-home-clock i,#play .world-marker.is-typing b::after{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function ensureHomeClock() {
    const intro = byId('intro');
    const header = intro?.querySelector('.home-v3-header');
    if (!header || header.querySelector('.relay-home-clock')) return;
    const clock = document.createElement('div');
    clock.className = 'relay-home-clock';
    clock.innerHTML = '<i aria-hidden="true"></i><span><b data-home-clock-time>--:--:--</b><small data-home-clock-date>LOCAL SYSTEM TIME</small></span>';
    header.appendChild(clock);
    const update = () => {
      const now = new Date();
      const time = new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);
      const date = new Intl.DateTimeFormat(undefined,{weekday:'short',day:'2-digit',month:'short'}).format(now).toUpperCase();
      clock.querySelector('[data-home-clock-time]').textContent = time;
      clock.querySelector('[data-home-clock-date]').textContent = `${date} · LOCAL`;
    };
    update();
    window.setInterval(update,1000);
  }

  function ensureClouds() {
    const backdrop = document.querySelector('#intro .menu-backdrop');
    if (!backdrop || backdrop.querySelector('.relay-clouds')) return;
    const clouds = document.createElement('div');
    clouds.className = 'relay-clouds';
    clouds.setAttribute('aria-hidden','true');
    clouds.innerHTML = '<span class="relay-cloud cloud-a"></span><span class="relay-cloud cloud-b"></span><span class="relay-cloud cloud-c"></span>';
    backdrop.appendChild(clouds);
  }

  function dedupeHomeButtons() {
    const intro = byId('intro');
    if (!intro) return;
    const seen = new Set();
    intro.querySelectorAll('.home-v3-card,[data-v3-options],[data-v3-faq],[data-v3-exit]').forEach(button => {
      const key = button.dataset.v3Options ? 'options' : button.dataset.v3Faq ? 'faq' : button.dataset.v3Exit ? 'exit' : (button.textContent || '').trim().toLowerCase();
      if (!key) return;
      if (seen.has(key)) button.remove();
      else seen.add(key);
    });
  }

  function startMusic() {
    try { window.relayGameplayAudioStartV3?.start?.(); } catch {}
    try {
      const music = window.relayAdaptiveMusic;
      if (music) { music.setEnabled?.(true); music.unlock?.().then?.(() => music.start?.()).catch?.(() => {}); }
    } catch {}
  }

  const sleep = ms => new Promise(resolve => window.setTimeout(resolve,ms));
  let typingToken = 0;
  async function typeErase(node, token) {
    if (!node?.isConnected || token !== typingToken) return;
    const marker = node.closest('.world-marker');
    const getTarget = () => String(node.dataset.relayTypeTarget || node.textContent || '').trim();
    let target = getTarget();
    if (!target) return;
    node.textContent = '';
    marker?.classList.add('is-typing');
    for (let i=1;i<=target.length && token===typingToken;i++) { node.textContent=target.slice(0,i); await sleep(34); }
    await sleep(1100);
    for (let i=target.length-1;i>=0 && token===typingToken;i--) { node.textContent=target.slice(0,i); await sleep(22); }
    await sleep(260);
    if (token===typingToken) typeErase(node,token);
  }
  function startMissionTyping() {
    const nodes = [document.getElementById('worldGoal')].filter(Boolean);
    nodes.forEach(node => {
      const target = node.textContent.trim();
      if (!target || node.dataset.relayTypingInstalled==='1') return;
      node.dataset.relayTypingInstalled='1';
      node.dataset.relayTypeTarget=target;
      typingToken += 1;
      typeErase(node,typingToken);
    });
  }

  function observeMissionChanges() {
    const goal = byId('worldGoal');
    if (!goal || goal.dataset.relayTypingObserver==='1') return;
    goal.dataset.relayTypingObserver='1';
    const observer = new MutationObserver(() => {
      const next = goal.textContent.trim();
      if (!next) return;
      goal.dataset.relayTypeTarget=next;
      typingToken += 1;
      typeErase(goal,typingToken);
    });
    observer.observe(goal,{childList:true,characterData:true,subtree:true});
  }

  function boot() {
    installStyles();
    ensureHomeClock();
    ensureClouds();
    dedupeHomeButtons();
    startMissionTyping();
    observeMissionChanges();
    const intro = byId('intro');
    const sync = () => {
      const homeVisible = !!intro && !intro.classList.contains('hidden');
      document.body.classList.toggle('home-v3-active',homeVisible);
      if (homeVisible) { ensureHomeClock(); ensureClouds(); dedupeHomeButtons(); }
      else { startMusic(); }
    };
    sync();
    new MutationObserver(sync).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']});
    document.addEventListener('click',event => {
      if (event.target.closest('#start,#continue,[data-v3-play],[data-v3-continue]')) startMusic();
    },{capture:true,passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden && !intro?.classList.contains('hidden')){ensureHomeClock();ensureClouds();}});
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
