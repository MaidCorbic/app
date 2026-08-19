import { RunnerScene } from '../scenes/RunnerScene.js';

// UPDATE 14 — DYNAMIC ENCOUNTER EVENTS V1
// Self-contained encounter layer. It reads existing RunnerScene/enemy state and
// never changes mission completion, scoring, Performance V1, or persistent state.
// One authored encounter per run; deterministic by mission id.

const CONFIG = {
  'first-delivery': { type: 'signal-anomaly', triggerX: 1780, radius: 210, title: 'SIGNAL ANOMALY', message: 'SIGNAL FIELD UNSTABLE', duration: 6500 },
  'dead-drop': { type: 'ambush', triggerX: 2050, radius: 230, title: 'AMBUSH', message: 'HOSTILES INBOUND', duration: 7000 },
  blackout: { type: 'power-surge', triggerX: 2280, radius: 230, title: 'POWER SURGE', message: 'GRID LOAD SPIKE', duration: 6500 },
  pursuit: { type: 'pursuit', triggerX: 2200, radius: 250, title: 'PURSUIT', message: 'INTERCEPTOR LOCKED ON', duration: 8500 },
  'signal-storm': { type: 'signal-anomaly', triggerX: 2350, radius: 250, title: 'SIGNAL STORM', message: 'SIGNAL FIELD DESTABILIZED', duration: 8000 },
  'corporate-lockdown': { type: 'ambush', triggerX: 2450, radius: 250, title: 'LOCKDOWN', message: 'SECURITY RESPONSE ACTIVE', duration: 8000 },
  'final-relay': { type: 'pursuit', triggerX: 2500, radius: 260, title: 'FINAL PURSUIT', message: 'INTERCEPTOR DEPLOYED', duration: 9000 },
};

const states = new WeakMap();
const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

function missionId(scene) {
  return [scene?.sys?.settings?.data?.missionId, scene?.sys?.settings?.data?.mission, scene?.registry?.get?.('missionId'), scene?.mission?.id, document.documentElement?.dataset?.missionId, document.body?.dataset?.missionId]
    .find(value => typeof value === 'string' && CONFIG[value]) || null;
}

function announce(scene, config) {
  try { scene.playerCue?.(config.message, '#8df4ff'); } catch {}
  let node = document.getElementById('dynamicEncounterEvent');
  if (!node) {
    node = document.createElement('div');
    node.id = 'dynamicEncounterEvent';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.innerHTML = '<strong></strong><small></small>';
    document.body.appendChild(node);
    const style = document.createElement('style');
    style.id = 'dynamic-encounter-events-v1-style';
    style.textContent = `#dynamicEncounterEvent{position:fixed;left:50%;top:calc(86px + env(safe-area-inset-top,0px));transform:translateX(-50%) translateY(-8px);z-index:100002;display:none;min-width:min(84vw,340px);padding:10px 14px;border:1px solid rgba(141,244,255,.72);border-radius:10px;background:rgba(4,12,24,.94);box-shadow:0 0 20px rgba(141,244,255,.18),inset 0 0 18px rgba(141,244,255,.04);text-align:center;color:#e9fdff;font:900 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.11em;text-transform:uppercase;pointer-events:none;opacity:0;transition:opacity .18s ease,transform .18s ease}#dynamicEncounterEvent.is-visible{display:block;opacity:1;transform:translateX(-50%) translateY(0)}#dynamicEncounterEvent small{display:block;margin-top:4px;font-size:8px;letter-spacing:.08em;color:#8df4ff;opacity:.78}@media(max-width:700px){#dynamicEncounterEvent{top:calc(72px + env(safe-area-inset-top,0px));min-width:76vw;padding:9px 11px;font-size:9px}}@media(prefers-reduced-motion:reduce){#dynamicEncounterEvent{transition:none}}`;
    document.head.appendChild(style);
  }
  node.querySelector('strong').textContent = config.title;
  node.querySelector('small').textContent = config.type.replaceAll('-', ' ').toUpperCase();
  node.classList.add('is-visible');
  clearTimeout(node.__hideTimer);
  node.__hideTimer = setTimeout(() => node.classList.remove('is-visible'), 2600);
}

function getEnemies(scene) {
  const groups = [scene.enemies, scene.hostiles, scene.enemyGroup, scene.physics?.world?.bodies];
  for (const group of groups) {
    const children = group?.getChildren?.() || (Array.isArray(group) ? group : null);
    if (children?.length) return children.filter(enemy => enemy && enemy.active !== false && enemy.body?.enable !== false);
  }
  return [];
}

function spawnAmbush(scene, state) {
  const enemies = getEnemies(scene);
  const player = scene.player;
  if (!player || !enemies.length) return false;
  const candidates = enemies.filter(enemy => distance(enemy, player) > 280 && distance(enemy, player) < 1200);
  candidates.slice(0, Math.min(2, candidates.length)).forEach(enemy => {
    enemy.setActive?.(true); enemy.setVisible?.(true);
    if (enemy.body) enemy.body.enable = true;
    enemy.setData?.('dynamicEncounter', state.config.type);
  });
  return candidates.length > 0;
}

function triggerPursuit(scene, state) {
  const enemies = getEnemies(scene);
  if (!enemies.length) return false;
  const player = scene.player;
  const target = enemies.find(enemy => distance(enemy, player) > 240 && distance(enemy, player) < 1000);
  if (!target) return false;
  target.setData?.('dynamicEncounter', 'pursuit');
  target.setData?.('dynamicEncounterTarget', player);
  target.setData?.('dynamicEncounterUntil', performance.now() + state.config.duration);
  return true;
}

function activate(scene, state) {
  if (state.triggered || state.completed) return;
  const config = state.config;
  let applied = true;
  if (config.type === 'ambush') applied = spawnAmbush(scene, state);
  else if (config.type === 'pursuit') applied = triggerPursuit(scene, state);
  // Signal anomaly / power surge are presentation + world-state cues only.
  // They deliberately do not mutate existing physics, score, or mission state.
  if (!applied && (config.type === 'ambush' || config.type === 'pursuit')) return;
  state.triggered = true;
  state.expiresAt = performance.now() + config.duration;
  announce(scene, config);
}

function setup(scene) {
  if (!scene || states.has(scene)) return;
  const id = missionId(scene); const config = id ? CONFIG[id] : null;
  if (!config || !scene.player) return;
  states.set(scene, { missionId: id, config, triggered: false, completed: false, expiresAt: 0 });
}

function update(scene) {
  const state = states.get(scene);
  if (!state || state.completed || !scene.player?.active) return;
  if (!state.triggered && Math.abs((scene.player.x || 0) - state.config.triggerX) <= state.config.radius) activate(scene, state);
  if (state.triggered && state.expiresAt && performance.now() >= state.expiresAt) state.completed = true;

  if (state.triggered && state.config.type === 'pursuit') {
    const now = performance.now();
    getEnemies(scene).forEach(enemy => {
      if (enemy.getData?.('dynamicEncounter') !== 'pursuit') return;
      const until = enemy.getData?.('dynamicEncounterUntil') || 0;
      if (now >= until) { enemy.setData?.('dynamicEncounter', null); enemy.setData?.('dynamicEncounterTarget', null); return; }
      const target = enemy.getData?.('dynamicEncounterTarget');
      const dx = (target?.x || 0) - (enemy.x || 0);
      const dy = (target?.y || 0) - (enemy.y || 0);
      if (Math.abs(dx) + Math.abs(dy) > 0) {
        const body = enemy.body;
        if (body?.velocity) { body.velocity.x += Math.sign(dx) * 7; body.velocity.y += Math.sign(dy) * 2; }
      }
    });
  }
}

function teardown(scene) {
  const state = states.get(scene);
  if (!state) return;
  getEnemies(scene).forEach(enemy => {
    if (enemy.getData?.('dynamicEncounter')) {
      enemy.setData('dynamicEncounter', null); enemy.setData('dynamicEncounterTarget', null); enemy.setData('dynamicEncounterUntil', 0);
    }
  });
  document.getElementById('dynamicEncounterEvent')?.classList.remove('is-visible');
  states.delete(scene);
}

const originalCreate = RunnerScene.prototype.create;
const originalUpdate = RunnerScene.prototype.update;
const originalShutdown = RunnerScene.prototype.shutdown;

if (!RunnerScene.prototype.__dynamicEncounterV1CreatePatched) {
  RunnerScene.prototype.create = function dynamicEncounterCreate(...args) { const result = originalCreate.apply(this, args); try { setup(this); } catch (error) { console.error('[DynamicEncounterV1] setup failed', error); } return result; };
  RunnerScene.prototype.__dynamicEncounterV1CreatePatched = true;
}
if (!RunnerScene.prototype.__dynamicEncounterV1UpdatePatched) {
  RunnerScene.prototype.update = function dynamicEncounterUpdate(...args) { const result = originalUpdate.apply(this, args); try { update(this); } catch (error) { console.error('[DynamicEncounterV1] update failed', error); } return result; };
  RunnerScene.prototype.__dynamicEncounterV1UpdatePatched = true;
}
if (!RunnerScene.prototype.__dynamicEncounterV1ShutdownPatched) {
  RunnerScene.prototype.shutdown = function dynamicEncounterShutdown(...args) { try { teardown(this); } catch (error) { console.error('[DynamicEncounterV1] teardown failed', error); } return originalShutdown.apply(this, args); };
  RunnerScene.prototype.__dynamicEncounterV1ShutdownPatched = true;
}
