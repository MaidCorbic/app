// RUNNER RELAY — GAMEPLAY VARIETY SAFE LAYER V1
// Additive orchestration only. Existing movement, combat, mission, enemy and
// progression systems remain authoritative. This layer adds visible choices,
// optional goals and feedback without replacing core gameplay physics/state.

export const GAMEPLAY_VARIETY_FLAGS = Object.freeze({
  enabled: true,
  routeChoice: true,
  optionalObjectives: true,
  momentum: true,
  liveEvents: true
});

export const GAMEPLAY_VARIETY_CONFIG = Object.freeze({
  'first-delivery': { event: 'SIGNAL ANOMALY', detail: 'Signal field unstable', objective: 'CLEAN FLOW' },
  'dead-drop': { event: 'AMBUSH WINDOW', detail: 'Hostiles moving through the relay lane', objective: 'FLOW x3' },
  blackout: { event: 'GRID SURGE', detail: 'Power fluctuation detected', objective: 'CLEAN FLOW' },
  pursuit: { event: 'INTERCEPTOR', detail: 'Pursuit pressure rising', objective: 'HOT ROUTE' },
  'signal-storm': { event: 'SIGNAL STORM', detail: 'Network instability detected', objective: 'FLOW x4' },
  'corporate-lockdown': { event: 'LOCKDOWN', detail: 'Security response elevated', objective: 'HOT ROUTE' },
  'final-relay': { event: 'FINAL INTERCEPT', detail: 'Maximum response detected', objective: 'NO HIT' }
});

const DEFAULT_CONFIG = Object.freeze({
  event: 'ROUTE CONDITION',
  detail: 'Adaptive route condition detected',
  objective: 'CLEAN FLOW'
});

const states = new WeakMap();
const ACTIONS = new Set(['dash', 'jump', 'vault', 'sword', 'fire', 'build']);

const missionIdOf = scene =>
  scene?.mission?.id ||
  scene?.sys?.settings?.data?.missionId ||
  scene?.registry?.get?.('missionId') ||
  scene?.registry?.get?.('activeMission')?.id ||
  document?.documentElement?.dataset?.missionId ||
  document?.body?.dataset?.missionId ||
  'active';

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, Number(v) || 0));

function progressOf(scene) {
  const mission = scene?.mission;
  const start = Number(mission?.spawn?.x ?? scene?.physics?.world?.bounds?.x ?? 0);
  const goal = Number(mission?.goal?.x ?? start + 3200);
  const player = Number(scene?.player?.x);
  if (!Number.isFinite(player) || goal <= start) return 0;
  return clamp((player - start) / (goal - start));
}

function styleRoot() {
  if (document.getElementById('relay-gameplay-variety-style')) return;
  const style = document.createElement('style');
  style.id = 'relay-gameplay-variety-style';
  style.textContent = `
#relayGameplayVariety{position:fixed;inset:0;z-index:9400;pointer-events:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
#relayGameplayVariety .rv-panel{position:absolute;top:calc(74px + env(safe-area-inset-top));right:clamp(12px,2vw,26px);width:min(332px,calc(100vw - 24px));padding:12px;background:linear-gradient(145deg,rgba(4,11,20,.97),rgba(9,24,40,.94));border:1px solid rgba(141,244,255,.42);box-shadow:0 10px 28px rgba(0,0,0,.28),0 0 24px rgba(56,189,248,.12);backdrop-filter:blur(10px);clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));opacity:0;transform:translateY(-8px);transition:opacity .2s ease,transform .2s ease}
#relayGameplayVariety.is-visible .rv-panel{opacity:1;transform:none}
#relayGameplayVariety .rv-kicker{font-size:8px;letter-spacing:1.8px;color:#78aebd}
#relayGameplayVariety .rv-title{margin-top:4px;font-size:14px;font-weight:900;letter-spacing:1px;color:#eefcff}
#relayGameplayVariety .rv-detail{margin-top:4px;font-size:9px;line-height:1.35;color:#8ba7b7;letter-spacing:.6px}
#relayGameplayVariety .rv-route{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px;pointer-events:auto}
#relayGameplayVariety .rv-route button{min-width:0;border:1px solid rgba(141,244,255,.22);background:rgba(7,18,30,.86);color:#dffcff;padding:9px 8px;font:800 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:1px;cursor:pointer;clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px));transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease,background .15s ease}
#relayGameplayVariety .rv-route button:hover{transform:translateY(-1px);border-color:rgba(141,244,255,.72);box-shadow:0 0 16px rgba(56,189,248,.15)}
#relayGameplayVariety .rv-route button.is-active{border-color:rgba(141,244,255,.95);background:linear-gradient(135deg,rgba(23,67,86,.9),rgba(8,27,43,.94));box-shadow:inset 0 0 18px rgba(56,189,248,.08),0 0 16px rgba(56,189,248,.14)}
#relayGameplayVariety .rv-route button:disabled{cursor:default;opacity:.72}
#relayGameplayVariety .rv-meta{display:flex;justify-content:space-between;gap:8px;margin-top:10px;font-size:8px;letter-spacing:1px;color:#6e8f9f}
#relayGameplayVariety .rv-objective{margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;gap:8px;font-size:8px;letter-spacing:1px;color:#9eb9c6}
#relayGameplayVariety .rv-objective strong{color:#dffcff}
#relayGameplayVariety .rv-toast{position:absolute;top:calc(151px + env(safe-area-inset-top));left:50%;width:min(310px,calc(100vw - 28px));padding:9px 12px;text-align:center;background:rgba(3,12,24,.95);border:1px solid rgba(141,244,255,.5);box-shadow:0 0 24px rgba(56,189,248,.12);opacity:0;transform:translate(-50%,-8px);transition:opacity .16s ease,transform .16s ease}
#relayGameplayVariety .rv-toast.is-visible{opacity:1;transform:translate(-50%,0)}
#relayGameplayVariety .rv-toast strong{display:block;font-size:10px;letter-spacing:1.4px;color:#e8fbff}
#relayGameplayVariety .rv-toast span{display:block;margin-top:3px;font-size:8px;color:#87a5b3;letter-spacing:.7px}
@media(max-width:760px){#relayGameplayVariety .rv-panel{top:calc(66px + env(safe-area-inset-top));right:10px;width:min(300px,calc(100vw - 20px));padding:10px}#relayGameplayVariety .rv-title{font-size:12px}#relayGameplayVariety .rv-route button{padding:10px 7px;font-size:8px}#relayGameplayVariety .rv-toast{top:calc(132px + env(safe-area-inset-top))}}
@media(max-width:380px){#relayGameplayVariety .rv-panel{width:calc(100vw - 16px);right:8px}#relayGameplayVariety .rv-meta,#relayGameplayVariety .rv-objective{font-size:7px}}
@media(prefers-reduced-motion:reduce){#relayGameplayVariety .rv-panel,#relayGameplayVariety .rv-toast,#relayGameplayVariety .rv-route button{transition:none}}
  `;
  document.head.appendChild(style);
}

function showToast(state, title, detail) {
  const toast = state.root?.querySelector('.rv-toast');
  if (!toast) return;
  toast.querySelector('[data-toast-title]')?.replaceChildren(document.createTextNode(title));
  toast.querySelector('[data-toast-detail]')?.replaceChildren(document.createTextNode(detail));
  toast.classList.add('is-visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1700);
}

function chooseRoute(scene, state, route) {
  if (!GAMEPLAY_VARIETY_FLAGS.routeChoice || !['safe', 'hot'].includes(route) || state.routeChoices > 0) return;
  state.route = route;
  state.multiplier = route === 'hot' ? 1.5 : 1;
  state.routeChoices += 1;
  state.root?.querySelectorAll('[data-route]')?.forEach(button => {
    const active = button.dataset.route === route;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
    button.disabled = true;
  });
  showToast(state, route === 'hot' ? 'HOT ROUTE ARMED' : 'SAFE ROUTE SELECTED', route === 'hot' ? 'Higher variety reward // higher pressure' : 'Stable route // clean run focus');
  try { scene?.game?.events?.emit?.('relay:variety-route', { route, multiplier: state.multiplier }); } catch {}
}

function buildUI(scene, state) {
  if (document.getElementById('relayGameplayVariety')) return document.getElementById('relayGameplayVariety');
  styleRoot();
  const info = GAMEPLAY_VARIETY_CONFIG[state.missionId] || DEFAULT_CONFIG;
  const root = document.createElement('div');
  root.id = 'relayGameplayVariety';
  root.innerHTML = `
    <section class="rv-panel" aria-label="Gameplay variety">
      <div class="rv-kicker">RUN VARIETY // LIVE</div>
      <div class="rv-title">${info.event}</div>
      <div class="rv-detail">${info.detail}</div>
      <div class="rv-route" aria-label="Route choice">
        <button type="button" data-route="safe" aria-pressed="false">SAFE ROUTE</button>
        <button type="button" data-route="hot" aria-pressed="false">HOT ROUTE</button>
      </div>
      <div class="rv-meta"><span>FLOW <b data-flow>0</b></span><span>PROGRESS <b data-progress>0%</b></span><span>MULT <b data-mult>1.0x</b></span></div>
      <div class="rv-objective"><span>OPTIONAL</span><strong data-objective>${info.objective}</strong></div>
    </section>
    <div class="rv-toast" role="status" aria-live="polite"><strong data-toast-title></strong><span data-toast-detail></span></div>`;
  document.body.appendChild(root);
  root.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => chooseRoute(scene, state, button.dataset.route)));
  requestAnimationFrame(() => root.classList.add('is-visible'));
  return root;
}

function bindFeedback(scene, state) {
  const events = scene?.game?.events;
  if (!GAMEPLAY_VARIETY_FLAGS.momentum || !events || state.feedbackBound) return;
  state.feedbackBound = true;
  state.feedbackHandler = kind => {
    const value = String(kind || '').toLowerCase();
    if (value === 'hit') { state.hit = true; state.flow = 0; return; }
    if (!ACTIONS.has(value)) return;
    state.flow = Math.min(8, state.flow + 1);
    state.bestFlow = Math.max(state.bestFlow, state.flow);
    state.lastActionAt = performance.now();
    if (state.flow >= 3 && state.flow % 3 === 0) {
      const award = Math.round(10 * state.multiplier);
      state.varietyScore += award;
      showToast(state, `FLOW x${state.flow}`, `Traversal chain // +${award} variety score`);
      try { events.emit('relay:variety-flow', { flow: state.flow, score: state.varietyScore }); } catch {}
    }
  };
  events.on('feedback', state.feedbackHandler);
}

function updateUI(scene, state, now) {
  const root = state.root;
  if (!root) return;
  const progress = progressOf(scene);
  if (state.flow > 0 && now - state.lastActionAt > 1900) state.flow = 0;
  if (GAMEPLAY_VARIETY_FLAGS.liveEvents && !state.eventShown && progress >= 0.46) {
    state.eventShown = true;
    const info = GAMEPLAY_VARIETY_CONFIG[state.missionId] || DEFAULT_CONFIG;
    showToast(state, info.event, info.detail);
    try { scene?.game?.events?.emit?.('relay:variety-event', { id: info.event, missionId: state.missionId }); } catch {}
  }
  root.querySelector('[data-flow]')?.replaceChildren(document.createTextNode(String(state.flow)));
  root.querySelector('[data-progress]')?.replaceChildren(document.createTextNode(`${Math.round(progress * 100)}%`));
  root.querySelector('[data-mult]')?.replaceChildren(document.createTextNode(`${state.multiplier.toFixed(1)}x`));
  const objective = root.querySelector('[data-objective]');
  if (objective) {
    if (state.hit) objective.textContent = 'RECOVER FLOW';
    else if (state.route === 'hot') objective.textContent = 'HOT ROUTE';
  }
}

function cleanup(scene, state) {
  if (!state) return;
  if (state.raf) cancelAnimationFrame(state.raf);
  if (state.feedbackBound) {
    try { scene?.game?.events?.off?.('feedback', state.feedbackHandler); } catch {}
  }
  clearTimeout(state.toastTimer);
  state.root?.remove();
  states.delete(scene);
  if (scene) scene.__relayGameplayVariety = null;
}

function init(scene) {
  if (!GAMEPLAY_VARIETY_FLAGS.enabled || !scene?.add || states.has(scene)) return;
  const state = {
    missionId: missionIdOf(scene), root: null, route: null, multiplier: 1,
    flow: 0, bestFlow: 0, lastActionAt: 0, hit: false, eventShown: false,
    routeChoices: 0, varietyScore: 0, feedbackBound: false, feedbackHandler: null,
    toastTimer: null, raf: 0
  };
  states.set(scene, state);
  scene.__relayGameplayVariety = state;
  try { state.root = buildUI(scene, state); bindFeedback(scene, state); } catch (error) {
    console.warn('[GameplayVarietySafeLayer] init skipped', error);
    cleanup(scene, state);
    return;
  }
  const loop = now => {
    if (!states.has(scene)) return;
    try {
      if (scene.finished || scene.sys?.isActive?.() === false) { cleanup(scene, state); return; }
      updateUI(scene, state, now);
    } catch (error) {
      console.warn('[GameplayVarietySafeLayer] update skipped', error);
    }
    state.raf = requestAnimationFrame(loop);
  };
  state.raf = requestAnimationFrame(loop);
  scene.events?.once?.('shutdown', () => cleanup(scene, state));
}

// Import the canonical RunnerScene directly and patch only create/shutdown.
// There is no update wrapper, so the core gameplay update loop remains untouched.
import('../scenes/RunnerScene.js')
  .then(({ RunnerScene }) => {
    if (!RunnerScene?.prototype || RunnerScene.prototype.__relayGameplayVarietySafeLayer) return;
    const originalCreate = RunnerScene.prototype.create;
    const originalShutdown = RunnerScene.prototype.shutdown;
    RunnerScene.prototype.create = function gameplayVarietyCreate(...args) {
      const result = originalCreate.apply(this, args);
      try { init(this); } catch (error) { console.warn('[GameplayVarietySafeLayer] create failed', error); }
      return result;
    };
    if (typeof originalShutdown === 'function') {
      RunnerScene.prototype.shutdown = function gameplayVarietyShutdown(...args) {
        try { cleanup(this, states.get(this)); } catch {}
        return originalShutdown.apply(this, args);
      };
    }
    RunnerScene.prototype.__relayGameplayVarietySafeLayer = true;
  })
  .catch(error => console.warn('[GameplayVarietySafeLayer] RunnerScene hook unavailable', error));
