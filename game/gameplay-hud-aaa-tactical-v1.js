(() => {
  'use strict';
  if (window.__relayAAAHudV1) return;
  window.__relayAAAHudV1 = true;

  const runner = () => window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  const root = document.createElement('section');
  root.className = 'relay-aaa-hud';
  root.hidden = true;
  root.setAttribute('aria-label','Gameplay tactical HUD');
  root.innerHTML = `
    <div class="relay-aaa-panel relay-aaa-mission">
      <p class="relay-aaa-kicker">RELAY // MISSION</p>
      <h2 class="relay-aaa-title" data-hud-title>MISSION</h2>
      <p class="relay-aaa-objective">OBJECTIVE <b data-hud-objective>FOLLOW THE RELAY</b></p>
    </div>
    <div class="relay-aaa-panel relay-aaa-intel">
      <div class="relay-aaa-row"><span>SIGNAL NETWORK</span><strong class="relay-aaa-value" data-hud-signals>—</strong></div>
      <div class="relay-aaa-row"><span>CARGO</span><strong data-hud-cargo>—</strong></div><div class="relay-aaa-bar"><i data-hud-cargo-bar></i></div>
      <div class="relay-aaa-row"><span>SHIELD</span><strong data-hud-shield>—</strong></div><div class="relay-aaa-bar"><i data-hud-shield-bar></i></div>
    </div>
    <div class="relay-aaa-target" data-hud-target>TARGET</div>
    <div class="relay-aaa-panel relay-aaa-alert" data-hud-alert></div>
    <div class="relay-aaa-controls">
      <button class="relay-aaa-control primary" type="button" data-hud-pause>PAUSE</button>
      <button class="relay-aaa-control" type="button" data-hud-settings>SETTINGS</button>
    </div>`;
  document.body.appendChild(root);

  const get = s => root.querySelector(s);
  const text = (s,v) => { const el=get(s); if(el) el.textContent=String(v ?? '—'); };
  const pct = (s,v) => { const el=get(s); if(el) el.style.transform=`scaleX(${Math.max(0,Math.min(1,Number(v)||0))})`; };

  get('[data-hud-pause]')?.addEventListener('click', e => { e.preventDefault(); document.getElementById('pauseBtn')?.click(); });
  get('[data-hud-settings]')?.addEventListener('click', e => { e.preventDefault(); document.querySelector('[data-title-panel="controls"]')?.click(); });

  function sync(){
    const play=document.getElementById('play');
    const scene=runner();
    const active=!!play && !play.classList.contains('hidden') && !!scene && !!scene.scene?.isActive?.();
    root.hidden=!active;
    if(!active) return;
    const m=scene.mission || {};
    text('[data-hud-title]',m.title || document.getElementById('objective')?.textContent || 'CURRENT MISSION');
    text('[data-hud-objective]',m.objective || document.getElementById('worldGoal')?.textContent || 'FOLLOW THE RELAY');
    const signals=scene.signalNetwork?.collected ?? scene.signalsCollected ?? scene.collectedSignals;
    const signalTotal=scene.signalNetwork?.total ?? scene.totalSignals ?? m.signalCount;
    if(signals != null || signalTotal != null) text('[data-hud-signals]',`${signals ?? 0} / ${signalTotal ?? '—'}`);
    const cargo=scene.cargoIntegrity ?? scene.cargo?.integrity ?? scene.cargo?.health;
    const shield=scene.playerShield ?? scene.shield?.value ?? scene.player?.shield;
    if(cargo != null){ const n=Math.max(0,Math.min(100,Number(cargo))); text('[data-hud-cargo]',`${Math.round(n)}%`); pct('[data-hud-cargo-bar]',n/100); }
    if(shield != null){ const n=Math.max(0,Math.min(100,Number(shield))); text('[data-hud-shield]',`${Math.round(n)}%`); pct('[data-hud-shield-bar]',n/100); }
  }

  const observer=new MutationObserver(sync);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','style']});
  window.setInterval(sync,500);
  sync();
})();
