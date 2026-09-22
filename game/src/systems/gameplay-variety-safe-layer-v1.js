// RUNNER RELAY — GAMEPLAY VARIETY SAFE LAYER V1
// Additive orchestration only. Existing movement, combat, mission, enemy and
// progression systems remain authoritative. SAFE/HOT is mounted only during
// active gameplay and becomes a compact locked status after the one-time choice.

import { RunnerScene } from '../scenes/RunnerScene.js';
import { getMissionRouteConsequence } from './gameplay-route-choice-v2.js';

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
  detail: 'Adaptive route decision detected',
  objective: 'CLEAN FLOW'
});

export const ROUTE_DECISION_PROGRESS = 0.40;
const states = new WeakMap();
const ACTIONS = new Set(['dash', 'jump', 'vault', 'sword', 'fire', 'build']);

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, Number(v) || 0));

function missionIdOf(scene) {
  const candidates = [
    scene?.mission?.id,
    scene?.sys?.settings?.data?.missionId,
    scene?.registry?.get?.('missionId'),
    scene?.registry?.get?.('activeMission')?.id,
    typeof document !== 'undefined' ? document?.documentElement?.dataset?.missionId : null,
    typeof document !== 'undefined' ? document?.body?.dataset?.missionId : null
  ];
  return candidates.find(value => typeof value === 'string' && value.length > 0) || 'active';
}

function progressOf(scene) {
  const mission = scene?.mission;
  const start = Number(mission?.spawn?.x ?? scene?.physics?.world?.bounds?.x ?? 0);
  const goal = Number(mission?.goal?.x ?? start + 3200);
  const player = Number(scene?.player?.x);
  if (!Number.isFinite(player) || goal <= start) return 0;
  return clamp((player - start) / (goal - start));
}

function visible(selector) {
  if (typeof document === 'undefined') return false;
  const element = document.querySelector(selector);
  if (!element) return false;
  if (element.classList.contains('hidden')) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0;
}

function isGameplayReady(scene) {
  if (!scene?.sys?.isActive?.()) return false;
  if (scene.finished || !scene.player || scene.player.active === false) return false;
  if (visible('#intro') || visible('#finish') || visible('#gameOver') || visible('#pauseMenu')) return false;
  if (visible('#relayGameplayIntroFinalV5')) return false;
  const play = typeof document !== 'undefined' ? document.querySelector('#play') : null;
  if (!play) return true;
  if (play.classList.contains('relay-map-briefing-lock')) return false;
  const style = window.getComputedStyle(play);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function styleRoot() {
  if (document.getElementById('relay-gameplay-variety-style')) return;
  const style = document.createElement('style');
  style.id = 'relay-gameplay-variety-style';
  style.textContent = `
#relayGameplayVariety{position:fixed;inset:0;z-index:9400;pointer-events:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;opacity:0;visibility:hidden;transition:opacity .18s ease,visibility .18s ease}
#relayGameplayVariety.is-visible{opacity:1;visibility:visible}
#relayGameplayVariety.is-hidden{opacity:0;visibility:hidden}
#relayGameplayVariety .rv-panel{position:absolute;top:calc(74px + env(safe-area-inset-top));right:clamp(12px,2vw,26px);width:min(350px,calc(100vw - 24px));padding:13px;background:linear-gradient(145deg,rgba(4,11,20,.97),rgba(9,24,40,.94));border:1px solid rgba(141,244,255,.42);box-shadow:0 10px 28px rgba(0,0,0,.28),0 0 24px rgba(56,189,248,.12);backdrop-filter:blur(10px);clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));transition:padding .18s ease,transform .18s ease,box-shadow .18s ease}
#relayGameplayVariety .rv-kicker{font-size:8px;letter-spacing:1.8px;color:#78aebd}
#relayGameplayVariety .rv-title{margin-top:4px;font-size:14px;font-weight:900;letter-spacing:1px;color:#eefcff;line-height:1.15}
#relayGameplayVariety .rv-detail{margin-top:5px;font-size:9px;line-height:1.4;color:#8ba7b7;letter-spacing:.55px}
#relayGameplayVariety .rv-decision{margin-top:10px;padding:8px 9px;border:1px solid rgba(141,244,255,.14);background:rgba(2,9,17,.35);display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
#relayGameplayVariety .rv-decision strong{display:block;font-size:8px;letter-spacing:1.2px;color:#bfeaf4}
#relayGameplayVariety .rv-decision span{display:block;margin-top:3px;font-size:8px;line-height:1.3;color:#6f929f}
#relayGameplayVariety .rv-state{font-size:9px;font-weight:900;letter-spacing:1.2px;color:#dffcff;text-align:right}
#relayGameplayVariety .rv-route{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px;pointer-events:auto}
#relayGameplayVariety .rv-route button{min-width:0;border:1px solid rgba(141,244,255,.25);background:linear-gradient(145deg,rgba(7,18,30,.92),rgba(4,13,23,.92));color:#dffcff;padding:10px 8px;font:900 9px/1.15 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:1px;cursor:pointer;clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease,background .15s ease}
#relayGameplayVariety .rv-route button span{font-size:10px;letter-spacing:1.4px}
#relayGameplayVariety .rv-route button small{font-size:7px;letter-spacing:1px;opacity:.75}
#relayGameplayVariety .rv-route button:hover{transform:translateY(-1px);border-color:rgba(141,244,255,.8);box-shadow:0 0 17px rgba(56,189,248,.16)}
#relayGameplayVariety .rv-route button:focus-visible{outline:2px solid rgba(141,244,255,.9);outline-offset:2px}
#relayGameplayVariety .rv-route button[data-route="safe"]{border-color:rgba(91,197,222,.36)}
#relayGameplayVariety .rv-route button[data-route="hot"]{border-color:rgba(255,107,107,.4)}
#relayGameplayVariety .rv-route button.is-active{border-color:rgba(141,244,255,.95);background:linear-gradient(135deg,rgba(23,67,86,.92),rgba(8,27,43,.94));box-shadow:inset 0 0 18px rgba(56,189,248,.08),0 0 16px rgba(56,189,248,.14)}
#relayGameplayVariety .rv-route button[data-route="hot"].is-active{border-color:rgba(255,107,107,.95);background:linear-gradient(135deg,rgba(92,36,43,.92),rgba(35,14,21,.94));box-shadow:inset 0 0 18px rgba(255,107,107,.08),0 0 17px rgba(255,107,107,.15)}
#relayGameplayVariety .rv-route button:disabled{cursor:default;opacity:.78}
#relayGameplayVariety .rv-meta{display:flex;justify-content:space-between;gap:8px;margin-top:10px;font-size:8px;letter-spacing:1px;color:#6e8f9f;flex-wrap:wrap}
#relayGameplayVariety .rv-meta b{color:#c7edf5}
#relayGameplayVariety .rv-objective{margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;gap:10px;font-size:8px;line-height:1.25;letter-spacing:1px;color:#9eb9c6}
#relayGameplayVariety .rv-objective strong{color:#dffcff;text-align:right}
#relayGameplayVariety .rv-toast{position:absolute;top:calc(166px + env(safe-area-inset-top));left:50%;width:min(330px,calc(100vw - 28px));padding:10px 12px;text-align:center;background:rgba(3,12,24,.96);border:1px solid rgba(141,244,255,.5);box-shadow:0 0 24px rgba(56,189,248,.12);opacity:0;transform:translate(-50%,-8px);transition:opacity .16s ease,transform .16s ease}
#relayGameplayVariety .rv-toast.is-visible{opacity:1;transform:translate(-50%,0)}
#relayGameplayVariety .rv-toast strong{display:block;font-size:10px;letter-spacing:1.4px;color:#e8fbff}
#relayGameplayVariety .rv-toast span{display:block;margin-top:3px;font-size:8px;line-height:1.25;color:#87a5b3;letter-spacing:.7px}
#relayGameplayVariety.is-locked .rv-panel{width:min(260px,calc(100vw - 24px));padding:8px 10px}
#relayGameplayVariety.is-locked .rv-detail,#relayGameplayVariety.is-locked .rv-decision,#relayGameplayVariety.is-locked .rv-route,#relayGameplayVariety.is-locked .rv-objective{display:none}
#relayGameplayVariety.is-locked .rv-title{margin-top:2px;font-size:10px;letter-spacing:1.3px;display:flex;justify-content:space-between;gap:8px;align-items:center}
#relayGameplayVariety.is-locked .rv-title::after{content:'LOCKED';font-size:7px;letter-spacing:1px;color:#79aebb}
#relayGameplayVariety.is-locked .rv-meta{margin-top:6px}
@media(max-width:760px){#relayGameplayVariety .rv-panel{top:calc(66px + env(safe-area-inset-top));right:10px;width:min(312px,calc(100vw - 20px));padding:10px}#relayGameplayVariety .rv-title{font-size:12px}#relayGameplayVariety .rv-route button{padding:10px 7px;font-size:8px}#relayGameplayVariety .rv-toast{top:calc(146px + env(safe-area-inset-top))}}
@media(max-width:380px){#relayGameplayVariety .rv-panel{width:calc(100vw - 16px);right:8px}#relayGameplayVariety .rv-meta,#relayGameplayVariety .rv-objective{font-size:7px}#relayGameplayVariety .rv-title{font-size:11px}}
@media(max-width:340px){#relayGameplayVariety .rv-meta{gap:5px;font-size:6.5px}#relayGameplayVariety .rv-route{gap:6px}}
@media(prefers-reduced-motion:reduce){#relayGameplayVariety,#relayGameplayVariety .rv-panel,#relayGameplayVariety .rv-toast,#relayGameplayVariety .rv-route button{transition:none}}
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
  state.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

function setLockedPresentation(state, route, config) {
  if (!state.root) return;
  state.root.classList.add('is-locked');
  state.root.querySelector('[data-state]')?.replaceChildren(document.createTextNode(route === 'hot' ? 'HOT' : 'SAFE'));
  const title = state.root.querySelector('.rv-title');
  if (title) title.firstChild?.replaceWith(document.createTextNode(config.label || (route === 'hot' ? 'HOT ROUTE' : 'SAFE ROUTE')));
  const reward = state.root.querySelector('[data-reward]');
  if (reward) reward.textContent = config.reward || (route === 'hot' ? '+VARIETY' : 'CLEAN RUN');
}

function chooseRoute(scene, state, route) {
  if (!GAMEPLAY_VARIETY_FLAGS.routeChoice || !['safe', 'hot'].includes(route) || state.routeChoices > 0) return;
  const config = getMissionRouteConsequence(scene, route);
  state.route = route;
  state.multiplier = Number(config.multiplier) || 1;
  state.routeChoices += 1;

  state.root?.querySelectorAll('[data-route]')?.forEach(button => {
    const active = button.dataset.route === route;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
    button.disabled = true;
  });

  setLockedPresentation(state, route, config);
  showToast(state, `${route === 'hot' ? 'HOT' : 'SAFE'} ROUTE // ${config.label}`, `${config.risk} // ${config.reward}`);

  try {
    scene?.game?.events?.emit?.('relay:variety-route', {
      route,
      multiplier: state.multiplier,
      missionId: state.missionId,
      label: config.label,
      risk: config.risk,
      reward: config.reward,
      missionConsequence: config.encounter || (route === 'safe' ? 'threat-disengaged' : 'pressure-targeted'),
      gameplayIntegrated: true,
      source: 'in-game-tactical-event'
    });
  } catch {}
}

function buildUI(scene, state) {
  if (state.root) return state.root;
  styleRoot();
  const info = GAMEPLAY_VARIETY_CONFIG[state.missionId] || DEFAULT_CONFIG;
  const root = document.createElement('div');
  root.id = 'relayGameplayVariety';
  root.setAttribute('data-ui-scope', 'gameplay');
  root.setAttribute('aria-hidden', 'false');
  root.classList.add('is-visible');
  root.innerHTML = `
    <section class="rv-panel" aria-label="In-game tactical route decision">
      <div class="rv-kicker">TACTICAL DECISION // LIVE</div>
      <div class="rv-title">${info.event}</div>
      <div class="rv-detail">${info.detail}</div>
      <div class="rv-decision">
        <div><strong>ROUTE SPLIT DETECTED</strong><span>Choose once. The level branch and pressure profile will lock.</span></div>
        <div class="rv-state" data-state>OPEN</div>
      </div>
      <div class="rv-route" aria-label="Route choice">
        <button type="button" data-route="safe" aria-pressed="false"><span>SAFE</span><br><small>STABLE LINE</small></button>
        <button type="button" data-route="hot" aria-pressed="false"><span>HOT</span><br><small>HIGH PRESSURE</small></button>
      </div>
      <div class="rv-meta"><span>FLOW <b data-flow>0</b></span><span>PROGRESS <b data-progress>40%</b></span><span>MULT <b data-mult>1.0x</b></span><span>REWARD <b data-reward>CLEAN RUN</b></span></div>
      <div class="rv-objective"><span>OPTIONAL GOAL</span><strong data-objective>${info.objective}</strong></div>
    </section>
    <div class="rv-toast" role="status" aria-live="polite"><strong data-toast-title></strong><span data-toast-detail></span></div>`;
  document.body.appendChild(root);
  root.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => chooseRoute(scene, state, button.dataset.route)));
  state.root = root;
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

function bindRouteApplied(scene, state) {
  const events = scene?.game?.events;
  if (!events || state.routeAppliedBound) return;
  state.routeAppliedBound = true;
  state.routeAppliedHandler = payload => {
    if (!payload || payload.route !== state.route) return;
    state.multiplier = Number(payload.multiplier) || state.multiplier;
    state.root?.querySelector('[data-mult]')?.replaceChildren(document.createTextNode(`${state.multiplier.toFixed(2).replace(/0$/, '')}x`));
    if (payload.reward) state.root?.querySelector('[data-reward]')?.replaceChildren(document.createTextNode(payload.reward));
  };
  events.on('relay:variety-route-applied', state.routeAppliedHandler);
}

function updateUI(scene, state, now) {
  const gameplayReady = isGameplayReady(scene);
  if (!gameplayReady) {
    state.root?.classList.add('is-hidden');
    state.root?.setAttribute('aria-hidden', 'true');
    return;
  }

  const progress = progressOf(scene);
  if (!state.routeChoices && !state.root && progress >= ROUTE_DECISION_PROGRESS) buildUI(scene, state);
  if (!state.root) return;

  state.root.classList.remove('is-hidden');
  state.root.setAttribute('aria-hidden', 'false');
  if (state.flow > 0 && now - state.lastActionAt > 1900) state.flow = 0;

  if (GAMEPLAY_VARIETY_FLAGS.liveEvents && !state.eventShown && progress >= ROUTE_DECISION_PROGRESS) {
    state.eventShown = true;
    const info = GAMEPLAY_VARIETY_CONFIG[state.missionId] || DEFAULT_CONFIG;
    showToast(state, 'ROUTE DECISION ONLINE', `${info.event} // choose SAFE or HOT`);
    try { scene?.game?.events?.emit?.('relay:variety-event', { id: 'ROUTE_DECISION', missionId: state.missionId }); } catch {}
  }

  state.root.querySelector('[data-flow]')?.replaceChildren(document.createTextNode(String(state.flow)));
  state.root.querySelector('[data-progress]')?.replaceChildren(document.createTextNode(`${Math.round(progress * 100)}%`));
  state.root.querySelector('[data-mult]')?.replaceChildren(document.createTextNode(`${state.multiplier.toFixed(2).replace(/0$/, '')}x`));
  const objective = state.root.querySelector('[data-objective]');
  if (objective && state.hit && !state.route) objective.textContent = 'RECOVER FLOW';
}

function cleanup(scene, state) {
  if (!state) return;
  if (state.raf) cancelAnimationFrame(state.raf);
  if (state.feedbackBound) {
    try { scene?.game?.events?.off?.('feedback', state.feedbackHandler); } catch {}
  }
  if (state.routeAppliedBound) {
    try { scene?.game?.events?.off?.('relay:variety-route-applied', state.routeAppliedHandler); } catch {}
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
    routeAppliedBound: false, routeAppliedHandler: null, toastTimer: null, raf: 0
  };
  states.set(scene, state);
  scene.__relayGameplayVariety = state;
  try { bindFeedback(scene, state); bindRouteApplied(scene, state); } catch (error) {
    console.warn('[GameplayVarietySafeLayer] event binding skipped', error);
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
if (!RunnerScene.prototype.__relayGameplayVarietySafeLayer) {
  const originalCreate = RunnerScene.prototype.create;
  const originalShutdown = RunnerScene.prototype.shutdown;
  RunnerScene.prototype.create = function gameplayVarietyCreate(...args) {
    const result = originalCreate.apply(this, args);
    try { init(this); } catch (error) { console.warn('[GameplayVarietySafeLayer] create failed', error); }
    return result;
  };
  RunnerScene.prototype.shutdown = function gameplayVarietyShutdown(...args) {
    const state = states.get(this);
    if (state) cleanup(this, state);
    return originalShutdown?.apply(this, args);
  };
  RunnerScene.prototype.__relayGameplayVarietySafeLayer = true;
}
