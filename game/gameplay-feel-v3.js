import { RunnerScene } from './src/scenes/RunnerScene.js';

(() => {
  'use strict';
  if (window.__relayGameplayFeelV3) return;
  window.__relayGameplayFeelV3 = true;

  const ROOT_ID = 'relay-gameplay-feel-v3';
  const state = new WeakMap();

  const css = () => {
    if (document.getElementById(`${ROOT_ID}-style`)) return;
    const style = document.createElement('style');
    style.id = `${ROOT_ID}-style`;
    style.textContent = `
#${ROOT_ID}{position:fixed;inset:0;z-index:248;pointer-events:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#eafcff}
#${ROOT_ID}.hidden{display:none}
#${ROOT_ID} .gf-strip{position:absolute;left:50%;top:clamp(122px,15vh,158px);transform:translateX(-50%) translateY(-6px);display:flex;align-items:center;gap:9px;padding:7px 10px;border:1px solid rgba(141,244,255,.18);border-radius:999px;background:rgba(2,10,18,.72);backdrop-filter:blur(10px);box-shadow:0 12px 30px rgba(0,0,0,.28);opacity:0;transition:opacity .18s,transform .18s}
#${ROOT_ID}.active .gf-strip{opacity:1;transform:translateX(-50%) translateY(0)}
#${ROOT_ID} .gf-chip{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-size:7px;font-weight:900;letter-spacing:.14em}
#${ROOT_ID} .gf-dot{width:6px;height:6px;border-radius:50%;background:#8df4ff;box-shadow:0 0 12px rgba(141,244,255,.9)}
#${ROOT_ID} .gf-value{color:#f7d98a}
#${ROOT_ID} .gf-meter{width:86px;height:4px;border-radius:999px;overflow:hidden;background:rgba(220,232,241,.08)}
#${ROOT_ID} .gf-meter i{display:block;width:0;height:100%;border-radius:999px;background:linear-gradient(90deg,#8df4ff,#ffd06e);box-shadow:0 0 12px rgba(141,244,255,.65);transition:width .12s linear}
#${ROOT_ID} .gf-event{position:absolute;left:50%;top:36%;transform:translate(-50%,-50%) scale(.9);opacity:0;font-size:clamp(13px,2vw,20px);font-weight:950;letter-spacing:.18em;text-shadow:0 0 20px rgba(141,244,255,.75);transition:opacity .12s,transform .16s;white-space:nowrap}
#${ROOT_ID} .gf-event.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
#${ROOT_ID} .gf-threat{position:absolute;right:16px;top:50%;transform:translateY(-50%) translateX(8px);min-width:112px;padding:8px 10px;border:1px solid rgba(255,130,110,.18);border-radius:10px;background:rgba(5,10,18,.72);backdrop-filter:blur(9px);box-shadow:0 10px 28px rgba(0,0,0,.3);opacity:0;transition:opacity .16s,transform .16s}
#${ROOT_ID}.threat .gf-threat{opacity:1;transform:translateY(-50%) translateX(0)}
#${ROOT_ID} .gf-threat small{display:block;color:#ffb6ab;font-size:6px;letter-spacing:.18em}.gf-threat b{display:block;margin-top:3px;font-size:8px;letter-spacing:.11em}
@media(max-width:700px){
 #${ROOT_ID} .gf-strip{top:116px;max-width:calc(100vw - 20px);gap:6px;padding:6px 8px}
 #${ROOT_ID} .gf-chip{font-size:6px}.gf-meter{width:58px!important}
 #${ROOT_ID} .gf-threat{right:8px;top:42%;min-width:98px;padding:7px 8px}
 #${ROOT_ID} .gf-event{top:31%;font-size:12px;letter-spacing:.12em}
}
@media(prefers-reduced-motion:reduce){#${ROOT_ID} .gf-strip,#${ROOT_ID} .gf-event,#${ROOT_ID} .gf-threat{transition:none!important}}
`;
    document.head.appendChild(style);
  };

  const getRoot = () => document.getElementById(ROOT_ID);
  const ensureRoot = () => {
    let root = getRoot();
    if (root) return root;
    css();
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'hidden';
    root.innerHTML = '<div class="gf-strip"><span class="gf-chip"><i class="gf-dot"></i>FLOW <b class="gf-value">0%</b></span><span class="gf-meter"><i></i></span><span class="gf-chip">SIGNALS <b class="gf-value" data-signals>00</b></span></div><div class="gf-event" aria-live="polite"></div><div class="gf-threat"><small>PROXIMITY SCAN</small><b>ALL CLEAR</b></div>';
    document.body.appendChild(root);
    return root;
  };

  const showEvent = (text) => {
    const root = ensureRoot();
    const event = root.querySelector('.gf-event');
    if (!event) return;
    event.textContent = text;
    event.classList.remove('show');
    void event.offsetWidth;
    event.classList.add('show');
    window.setTimeout(() => event.classList.remove('show'), 780);
  };

  const update = (scene) => {
    const root = ensureRoot();
    const intro = document.getElementById('intro');
    const cinematic = document.getElementById('relayGameplayIntroFinalV1');
    const gameplayVisible = !intro?.classList.contains('hidden') === false && !cinematic?.hidden;
    const active = !!scene?.scene?.isActive?.() && !scene.finished && !scene.respawning && !scene.cinematicActive && !intro?.classList.contains('hidden') === false;
    root.classList.toggle('hidden', !active);
    root.classList.toggle('active', active);
    if (!active) return;

    const body = scene.player?.body;
    const speed = Math.abs(Number(body?.velocity?.x || 0));
    const flow = Math.max(0, Math.min(100, Math.round((speed / 460) * 100)));
    root.querySelector('.gf-meter i').style.width = `${flow}%`;
    root.querySelector('.gf-value').textContent = `${flow}%`;
    const signal = document.getElementById('signalCount');
    root.querySelector('[data-signals]').textContent = signal?.textContent?.trim() || '00';

    let threats = 0;
    const px = Number(scene.player?.x || 0), py = Number(scene.player?.y || 0);
    for (const enemy of scene.enemies?.getChildren?.() || []) {
      if (!enemy?.active) continue;
      const dx = Number(enemy.x || 0) - px;
      const dy = Number(enemy.y || 0) - py;
      if (Math.hypot(dx, dy) < 190) threats += 1;
    }
    root.classList.toggle('threat', threats > 0);
    const threatText = root.querySelector('.gf-threat b');
    if (threatText) threatText.textContent = threats ? `${threats} HOSTILE ${threats === 1 ? 'SIGNAL' : 'SIGNALS'}` : 'ALL CLEAR';
  };

  const attach = (scene) => {
    if (!scene || state.has(scene)) return;
    state.set(scene, { wasAirborne:false, lastSignal:0, hotUntil:0, lastFlowEvent:0 });
  };

  const baseCreate = RunnerScene.prototype.create;
  const baseUpdate = RunnerScene.prototype.update;
  if (!RunnerScene.prototype.__relayGameplayFeelV3Create) {
    RunnerScene.prototype.create = function gameplayFeelV3Create(...args) {
      const result = baseCreate.apply(this, args);
      attach(this);
      return result;
    };
    RunnerScene.prototype.__relayGameplayFeelV3Create = true;
  }
  if (!RunnerScene.prototype.__relayGameplayFeelV3Update) {
    RunnerScene.prototype.update = function gameplayFeelV3Update(time, delta, ...args) {
      const result = baseUpdate.apply(this, [time, delta, ...args]);
      try {
        attach(this);
        const st = state.get(this);
        const body = this.player?.body;
        const grounded = !!body?.blocked?.down || !!body?.touching?.down;
        const speed = Math.abs(Number(body?.velocity?.x || 0));
        if (st.wasAirborne && grounded) {
          if (speed > 360) showEvent('PERFECT LANDING');
          st.wasAirborne = false;
        } else if (!grounded && Number(body?.velocity?.y || 0) > 60) {
          st.wasAirborne = true;
        }
        if (speed > 430 && performance.now() > st.lastFlowEvent + 1800) {
          st.lastFlowEvent = performance.now();
          showEvent('OVERDRIVE');
        }
        update(this);
      } catch (error) {
        console.warn('[Relay Runner] gameplay feel presentation skipped:', error);
      }
      return result;
    };
    RunnerScene.prototype.__relayGameplayFeelV3Update = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureRoot, { once: true });
  else ensureRoot();
})();
