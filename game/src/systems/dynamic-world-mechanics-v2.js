import { RunnerScene } from '../scenes/RunnerScene.js';

// UPDATE 11 — DYNAMIC WORLD MECHANICS V2
// Safe campaign deployment: exactly ONE interactive world mechanic per mission.
// It reuses an existing barrier as the gameplay consequence, so no new physics
// bodies are introduced and existing platform/movement physics remain untouched.

const INTERACT_DISTANCE = 118;
const COOLDOWN_MS = 300;
const MISSION_IDS = [
  'first-delivery', 'dead-drop', 'blackout', 'pursuit',
  'signal-storm', 'corporate-lockdown', 'final-relay',
];

const stateByScene = new WeakMap();

const getMissionId = scene => {
  const candidates = [
    scene?.sys?.settings?.data?.missionId,
    scene?.sys?.settings?.data?.mission,
    scene?.registry?.get?.('missionId'),
    scene?.registry?.get?.('mission'),
    document.documentElement?.dataset?.missionId,
    document.body?.dataset?.missionId,
  ];
  const value = candidates.find(item => typeof item === 'string' && MISSION_IDS.includes(item));
  return value || null;
};

const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

const MISSION_COPY = {
  'first-delivery': ['POWER NODE', 'Activate to clear the route.'],
  'dead-drop': ['DOCK CONTROL', 'Activate to release the route barrier.'],
  blackout: ['GRID CONTROL', 'Restore access to the route.'],
  pursuit: ['RAIL CONTROL', 'Disable the security barrier.'],
  'signal-storm': ['ARRAY CONTROL', 'Open the storm route.'],
  'corporate-lockdown': ['HELIX CONTROL', 'Release the lockdown gate.'],
  'final-relay': ['APEX CONTROL', 'Open the final relay route.'],
};

function ensureUi() {
  let button = document.getElementById('dynamicWorldInteractButton');
  if (!button) {
    const style = document.createElement('style');
    style.id = 'dynamic-world-mechanics-v2-style';
    style.textContent = `
      #dynamicWorldInteractButton{position:fixed;left:50%;bottom:calc(112px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:100001;display:none;min-width:190px;padding:11px 16px;border:1px solid rgba(141,244,255,.92);border-radius:12px;background:rgba(4,15,28,.98);box-shadow:0 0 16px rgba(141,244,255,.30),inset 0 0 14px rgba(141,244,255,.06);color:#e9fdff;font:900 12px/1.15 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.10em;text-align:center;text-transform:uppercase;touch-action:manipulation;user-select:none;-webkit-user-select:none}
      #dynamicWorldInteractButton.is-visible{display:block}
      #dynamicWorldInteractButton.is-done{border-color:#aee37f;color:#efffdc;box-shadow:0 0 16px rgba(174,227,127,.38),inset 0 0 14px rgba(174,227,127,.08)}
      #dynamicWorldInteractButton small{display:block;margin-top:5px;color:#8df4ff;font-size:8px;letter-spacing:.08em}
      @media(min-width:769px){#dynamicWorldInteractButton{bottom:28px;min-width:166px}}
      @media(prefers-reduced-motion:reduce){#dynamicWorldInteractButton{transition:none}}
    `;
    document.head.appendChild(style);
    button = document.createElement('button');
    button.id = 'dynamicWorldInteractButton';
    button.type = 'button';
    document.body.appendChild(button);
  }
  if (!button.dataset.boundV2) {
    button.dataset.boundV2 = '1';
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const scene = window.__dynamicWorldSceneV2;
      const target = scene?.dynamicWorldTargetV2;
      if (scene && target) interact(scene, target);
    }, { passive:false });
  }
  return button;
}

function cue(scene, text, color = '#8df4ff') {
  scene?.playerCue?.(text, color);
}

function findSafeBarrier(scene, player) {
  const barriers = scene?.barriers?.getChildren?.() || [];
  const candidates = barriers.filter(barrier => {
    if (!barrier?.active || barrier.visible === false) return false;
    const dx = (barrier.x || 0) - (player?.x || 0);
    return dx > 180 && dx < 1100 && Math.abs((barrier.y || 0) - (player?.y || 0)) < 220;
  });
  return candidates.sort((a,b) => distance(player,a) - distance(player,b))[0] || null;
}

function makeControl(scene, x, y, missionId) {
  const [title, hint] = MISSION_COPY[missionId] || ['WORLD CONTROL', 'Activate to clear the route.'];
  const container = scene.add.container(x, y).setDepth(12).setSize(54, 64);
  const shadow = scene.add.ellipse(0, 28, 44, 9, 0x000000, .28);
  const body = scene.add.rectangle(0, 0, 34, 46, 0x0d1a2b, 1).setStrokeStyle(2, 0x8df4ff, .95);
  const core = scene.add.circle(0, -8, 8, 0xffd06e, 1).setStrokeStyle(1, 0xfff2bd, .9);
  const lever = scene.add.rectangle(0, 10, 4, 13, 0xd9faff, 1);
  const label = scene.add.text(0, 40, 'CONTROL', {fontFamily:'monospace',fontSize:'7px',fontStyle:'bold',color:'#dffcff',stroke:'#02050d',strokeThickness:3}).setOrigin(.5);
  const caption = scene.add.text(0, -42, title, {fontFamily:'monospace',fontSize:'7px',fontStyle:'bold',color:'#b9f5ff',stroke:'#02050d',strokeThickness:3}).setOrigin(.5);
  container.add([shadow, body, core, lever, label, caption]);
  container.setDataEnabled();
  container.setData('mechanicType','route-control');
  container.setData('missionId',missionId);
  container.setData('hint',hint);
  container.setData('used',false);
  container.setData('children',{body,core,lever,label,caption});
  return container;
}

function setup(scene) {
  if (!scene?.add || !scene?.player) return;
  if (stateByScene.has(scene)) return;

  const missionId = getMissionId(scene);
  if (!missionId) {
    console.warn('[DynamicWorldV2] mission id unavailable; no mechanic spawned.');
    return;
  }

  const barriers = scene?.barriers?.getChildren?.() || [];
  const player = scene.player;
  const anchor = barriers
    .filter(item => item?.active && (item.x || 0) > (player.x || 0) + 320)
    .sort((a,b) => (a.x || 0) - (b.x || 0))[0];

  // No valid existing gameplay geometry = do not spawn an object in an unsafe position.
  if (!anchor) {
    console.warn(`[DynamicWorldV2] no safe barrier anchor for ${missionId}; mechanic skipped.`);
    return;
  }

  const control = makeControl(scene, anchor.x - 150, anchor.y - 42, missionId);
  const targetBarrier = findSafeBarrier(scene, control);
  if (!targetBarrier) {
    control.destroy(true);
    console.warn(`[DynamicWorldV2] no safe target barrier for ${missionId}; mechanic skipped.`);
    return;
  }

  const state = { missionId, control, targetBarrier, lastInteractAt:0 };
  stateByScene.set(scene, state);
  scene.dynamicWorldMechanicsV2 = state;
}

function releaseBarrier(scene, state) {
  const barrier = state?.targetBarrier;
  if (!barrier?.active) return false;

  // Reuse the existing barrier physics object if it exposes a Phaser body.
  // Otherwise only hide it; never invent a collision body or mutate platforms.
  try {
    if (typeof barrier.disableBody === 'function') barrier.disableBody(true, true);
    else if (barrier.body) barrier.body.enable = false;
  } catch (error) {
    console.warn('[DynamicWorldV2] barrier release fallback', error);
  }
  barrier.setVisible?.(false);
  barrier.setActive?.(false);

  const children = state.control.getData('children');
  children?.body?.setStrokeStyle?.(2, 0xaee37f, .95);
  children?.core?.setFillStyle?.(0xaee37f, 1);
  children?.lever?.setRotation?.(-0.65);
  state.control.setData('used', true);
  cue(scene, 'ROUTE UNLOCKED', '#aee37f');
  return true;
}

function interact(scene, target) {
  const state = stateByScene.get(scene);
  const now = performance.now();
  if (!state || target !== state.control || now - state.lastInteractAt < COOLDOWN_MS) return false;
  if (!target.active || target.getData('used') || distance(scene.player,target) > INTERACT_DISTANCE) return false;
  state.lastInteractAt = now;
  return releaseBarrier(scene, state);
}

function update(scene) {
  const state = stateByScene.get(scene);
  if (!state || !scene?.player?.active) return;
  window.__dynamicWorldSceneV2 = scene;
  const button = ensureUi();
  const control = state.control;
  if (!control?.active || control.getData('used') || distance(scene.player, control) > INTERACT_DISTANCE) {
    button.classList.remove('is-visible','is-done');
    scene.dynamicWorldTargetV2 = null;
    return;
  }
  scene.dynamicWorldTargetV2 = control;
  button.innerHTML = 'INTERACT <small>E / TAP · ' + control.getData('hint') + '</small>';
  button.classList.add('is-visible');
  button.classList.remove('is-done');
}

function teardown(scene) {
  const state = stateByScene.get(scene);
  if (state) {
    try { state.control?.destroy(true); } catch {}
    stateByScene.delete(scene);
  }
  if (window.__dynamicWorldSceneV2 === scene) window.__dynamicWorldSceneV2 = null;
  document.getElementById('dynamicWorldInteractButton')?.classList.remove('is-visible','is-done');
}

const originalCreate = RunnerScene.prototype.create;
const originalUpdate = RunnerScene.prototype.update;
const originalShutdown = RunnerScene.prototype.shutdown;

if (!RunnerScene.prototype.__dynamicWorldV2CreatePatched) {
  RunnerScene.prototype.create = function dynamicWorldV2Create(...args) {
    const result = originalCreate.apply(this, args);
    try { setup(this); } catch (error) { console.error('[DynamicWorldV2] setup failed', error); }
    return result;
  };
  RunnerScene.prototype.__dynamicWorldV2CreatePatched = true;
}
if (!RunnerScene.prototype.__dynamicWorldV2UpdatePatched) {
  RunnerScene.prototype.update = function dynamicWorldV2Update(...args) {
    const result = originalUpdate.apply(this, args);
    try { update(this); } catch (error) { console.error('[DynamicWorldV2] update failed', error); }
    return result;
  };
  RunnerScene.prototype.__dynamicWorldV2UpdatePatched = true;
}
if (!RunnerScene.prototype.__dynamicWorldV2ShutdownPatched) {
  RunnerScene.prototype.shutdown = function dynamicWorldV2Shutdown(...args) {
    try { teardown(this); } catch (error) { console.error('[DynamicWorldV2] teardown failed', error); }
    return originalShutdown.apply(this, args);
  };
  RunnerScene.prototype.__dynamicWorldV2ShutdownPatched = true;
}

document.addEventListener('keydown', event => {
  if (event.repeat || event.key.toLowerCase() !== 'e') return;
  const scene = window.__dynamicWorldSceneV2;
  const target = scene?.dynamicWorldTargetV2;
  if (scene && target && interact(scene, target)) event.preventDefault();
}, true);

ensureUi();
