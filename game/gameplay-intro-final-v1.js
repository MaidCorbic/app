(() => {
  'use strict';
  if (window.__relayGameplayIntroFinalV2) return;
  window.__relayGameplayIntroFinalV2 = true;

  const BUTTONS = '#start,#nextMission,#again,#retry,#launchJob';
  let active = false;
  let timerId = 0;
  let endId = 0;

  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  const canvas = () => document.querySelector('#phaser-game canvas');
  const mission = () => ({
    district: (document.getElementById('district')?.textContent || 'CURRENT DISTRICT').trim(),
    title: (document.getElementById('objective')?.textContent || 'CURRENT MISSION').trim(),
    objective: (document.getElementById('worldGoal')?.textContent || 'FOLLOW THE RELAY').trim(),
  });

  const root = document.createElement('section');
  root.id = 'relayGameplayIntroFinalV1';
  root.hidden = true;
  root.innerHTML = `
    <div class="map-briefing-shell" role="dialog" aria-modal="true" aria-label="Mission map briefing">
      <header class="map-briefing-head">
        <div>
          <p class="map-briefing-kicker">RELAY RUNNER // LIVE MAP</p>
          <h2 class="map-briefing-title">MISSION ROUTE</h2>
          <p class="map-briefing-meta"></p>
        </div>
        <div class="map-briefing-timer" aria-live="polite"><b>10</b><span>SEC</span></div>
      </header>
      <div class="map-briefing-map-wrap">
        <img class="map-briefing-map" alt="Current level map preview">
        <div class="map-briefing-scan"></div>
        <div class="map-briefing-vignette"></div>
        <div class="map-briefing-tag">LIVE LEVEL PREVIEW</div>
      </div>
      <footer class="map-briefing-foot">
        <span class="map-briefing-objective"></span>
        <span>BRIEFING · 10 SEC</span>
      </footer>
    </div>
  `;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.textContent = `
    #relayGameplayIntroFinalV1{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;overflow:hidden;background:#02060c;color:#eafcff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;pointer-events:auto}
    #relayGameplayIntroFinalV1[hidden]{display:none}
    #relayGameplayIntroFinalV1 .map-briefing-shell{position:relative;z-index:2;width:min(1160px,94vw);height:min(820px,90dvh);display:grid;grid-template-rows:auto 1fr auto;gap:14px;padding:18px;border:1px solid rgba(141,244,255,.18);border-radius:16px;background:rgba(3,11,19,.9);box-shadow:0 30px 120px rgba(0,0,0,.68),0 0 70px rgba(141,244,255,.06);box-sizing:border-box}
    #relayGameplayIntroFinalV1 .map-briefing-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
    #relayGameplayIntroFinalV1 .map-briefing-kicker{margin:0 0 6px;color:#8df4ff;font-size:8px;font-weight:900;letter-spacing:.22em}
    #relayGameplayIntroFinalV1 .map-briefing-title{margin:0;color:#f1f7fa;font-size:clamp(24px,4vw,38px);line-height:.95;letter-spacing:.08em}
    #relayGameplayIntroFinalV1 .map-briefing-meta{margin:7px 0 0;color:#7890a4;font-size:8px;letter-spacing:.1em}
    #relayGameplayIntroFinalV1 .map-briefing-timer{width:66px;height:66px;display:grid;place-items:center;align-content:center;border:1px solid rgba(255,208,110,.34);border-radius:14px;background:rgba(255,208,110,.04);box-shadow:0 0 28px rgba(255,208,110,.06)}
    #relayGameplayIntroFinalV1 .map-briefing-timer b{color:#ffd06e;font-size:26px;line-height:1}
    #relayGameplayIntroFinalV1 .map-briefing-timer span{margin-top:3px;color:#74889a;font-size:6px;letter-spacing:.16em}
    #relayGameplayIntroFinalV1 .map-briefing-map-wrap{position:relative;min-height:0;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(141,244,255,.12);border-radius:12px;background:#02070d}
    #relayGameplayIntroFinalV1 .map-briefing-map{display:block;width:100%;height:100%;object-fit:contain;image-rendering:auto;background:#02070d}
    #relayGameplayIntroFinalV1 .map-briefing-scan{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 49%,rgba(141,244,255,.05) 50%,transparent 51%);background-size:100% 8px;opacity:.45}
    #relayGameplayIntroFinalV1 .map-briefing-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 50%,transparent 54%,rgba(0,0,0,.34) 100%)}
    #relayGameplayIntroFinalV1 .map-briefing-tag{position:absolute;left:12px;bottom:12px;padding:7px 9px;border:1px solid rgba(141,244,255,.18);border-radius:7px;background:rgba(2,8,14,.7);color:#8df4ff;font-size:6px;font-weight:900;letter-spacing:.16em;backdrop-filter:blur(6px)}
    #relayGameplayIntroFinalV1 .map-briefing-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#60798a;font-size:6px;font-weight:800;letter-spacing:.12em}
    #relayGameplayIntroFinalV1 .map-briefing-objective{max-width:70%;color:#d8e9ef;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #play.relay-map-briefing-lock .hud,#play.relay-map-briefing-lock .world-marker,#play.relay-map-briefing-lock .input-guide,#play.relay-map-briefing-lock .mobile-controls,#play.relay-map-briefing-lock .rotate-prompt,#play.relay-map-briefing-lock #toast,#play.relay-map-briefing-lock #pause{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    @media(max-width:760px){#relayGameplayIntroFinalV1 .map-briefing-shell{width:96vw;height:92dvh;padding:12px;gap:10px;border-radius:14px}.map-briefing-title{font-size:24px!important}.map-briefing-meta{font-size:6px!important}.map-briefing-timer{width:54px!important;height:54px!important;border-radius:11px!important}.map-briefing-timer b{font-size:21px!important}.map-briefing-foot{font-size:5px!important}}
  `;
  document.head.appendChild(style);

  const lock = state => {
    window.__relayCinematicLock = state;
    document.getElementById('play')?.classList.toggle('relay-map-briefing-lock', state);
    window.dispatchEvent(new Event(state ? 'relay:cinematic-lock' : 'relay:cinematic-unlock'));
  };

  const updateTimer = ms => {
    const el = root.querySelector('.map-briefing-timer b');
    if (el) el.textContent = String(Math.max(0, Math.ceil(ms / 1000)));
  };

  const captureRealLevel = async target => {
    if (!target) return null;
    try {
      const source = document.createElement('canvas');
      const width = target.width || 1280;
      const height = target.height || 720;
      source.width = Math.min(width, 1400);
      source.height = Math.min(height, 900);
      source.getContext('2d').drawImage(target, 0, 0, source.width, source.height);
      return source.toDataURL('image/png');
    } catch {
      return null;
    }
  };

  const finish = () => {
    window.clearInterval(timerId);
    window.clearTimeout(endId);
    timerId = 0;
    endId = 0;
    active = false;
    lock(false);
    root.hidden = true;
  };

  const show = async () => {
    if (active) return;
    active = true;
    lock(true);
    root.hidden = false;

    const liveCanvas = await (async () => {
      const started = performance.now();
      while (performance.now() - started < 4500) {
        const found = canvas();
        if (found) return found;
        await wait(80);
      }
      return null;
    })();

    const data = mission();
    root.querySelector('.map-briefing-meta').textContent = `${data.district} // ${data.title}`;
    root.querySelector('.map-briefing-objective').textContent = data.objective;

    const image = root.querySelector('.map-briefing-map');
    const dataUrl = await captureRealLevel(liveCanvas);
    if (dataUrl) image.src = dataUrl;

    const started = performance.now();
    updateTimer(10000);
    timerId = window.setInterval(() => updateTimer(10000 - (performance.now() - started)), 250);
    endId = window.setTimeout(finish, 10000);
  };

  document.addEventListener('click', event => {
    if (!event.target.closest(BUTTONS)) return;
    if (active) return;
    window.setTimeout(show, 90);
  }, true);
})();
