import { RunnerScene } from '../scenes/RunnerScene.js';

// UPDATE 11 — DYNAMIC WORLD MECHANICS V4
// Exactly ONE authored world-control object per campaign mission.
// Each mechanic targets a named, authored barrier coordinate from the mission data.
// We intentionally do NOT use array indexes or nearest-object discovery.
// If the authored target is missing/moved, the mechanic refuses to spawn instead
// of silently attaching to the wrong gameplay object.
// Existing barrier bodies are reused. No new physics bodies are created.

const INTERACT_DISTANCE = 118;
const COOLDOWN_MS = 300;
const TARGET_TOLERANCE = 1;

const MISSION_CONFIG = {
  'first-delivery': {
    targetId: 'old-quarter-delivery-gate', targetX: 3570, targetY: 546,
    offsetX: -150, offsetY: -42,
    title: 'POWER NODE', hint: 'POWER ROUTE', message: 'POWER ROUTE ONLINE', color: '#aee37f',
  },
  'dead-drop': {
    targetId: 'salt-docks-final-gate', targetX: 3740, targetY: 546,
    offsetX: -150, offsetY: -42,
    title: 'DOCK CONTROL', hint: 'RELEASE DOCK GATE', message: 'DOCK ROUTE RELEASED', color: '#8df4ff',
  },
  blackout: {
    targetId: 'grid-nine-final-gate', targetX: 3830, targetY: 546,
    offsetX: -150, offsetY: -42,
    title: 'GRID CONTROL', hint: 'RESTORE GRID ACCESS', message: 'GRID ACCESS RESTORED', color: '#8df4ff',
  },
  pursuit: {
    targetId: 'rail-spine-exit-gate', targetX: 3790, targetY: 546,
    offsetX: -150, offsetY: -42,
    title: 'RAIL CONTROL', hint: 'DISABLE SECURITY', message: 'RAIL SECURITY DISABLED', color: '#ffbd7a',
  },
  'signal-storm': {
    targetId: 'crown-array-final-gate', targetX: 3900, targetY: 546,
    offsetX: -150, offsetY: -42,
    title: 'ARRAY CONTROL', hint: 'OPEN STORM ROUTE', message: 'STORM ROUTE OPEN', color: '#b993ff',
  },
  'corporate-lockdown': {
    targetId: 'helix-tower-final-gate', targetX: 3820, targetY: 546,
    offsetX: -150, offsetY: -42,
    title: 'HELIX CONTROL', hint: 'RELEASE LOCKDOWN', message: 'LOCKDOWN RELEASED', color: '#ff826e',
  },
  'final-relay': {
    targetId: 'apex-spine-final-gate', targetX: 3900, targetY: 546,
    offsetX: -150, offsetY: -42,
    title: 'APEX CONTROL', hint: 'OPEN FINAL ROUTE', message: 'FINAL RELAY ROUTE OPEN', color: '#ffd06e',
  },
};

const stateByScene = new WeakMap();

function getMissionId(scene) {
  const candidates = [
    scene?.sys?.settings?.data?.missionId,
    scene?.sys?.settings?.data?.mission,
    scene?.registry?.get?.('missionId'),
    scene?.registry?.get?.('mission'),
    scene?.mission?.id,
    document.documentElement?.dataset?.missionId,
    document.body?.dataset?.missionId,
  ];
  return candidates.find(value => typeof value === 'string' && MISSION_CONFIG[value]) || null;
}

const distance = (a, b) => Math.hypot(
  (a?.x || 0) - (b?.x || 0),
  (a?.y || 0) - (b?.y || 0),
);

function ensureUi() {
  let button = document.getElementById('dynamicWorldInteractButton');

  if (!button) {
    let style = document.getElementById('dynamic-world-mechanics-v4-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-world-mechanics-v4-style';
      style.textContent = `
        #dynamicWorldInteractButton {
          position: fixed;
          left: 50%;
          bottom: calc(112px + env(safe-area-inset-bottom, 0px));
          transform: translateX(-50%);
          z-index: 100001;
          display: none;
          min-width: 196px;
          max-width: min(86vw, 360px);
          padding: 11px 16px;
          border: 1px solid rgba(141,244,255,.92);
          border-radius: 12px;
          background: rgba(4,15,28,.98);
          box-shadow: 0 0 16px rgba(141,244,255,.30), inset 0 0 14px rgba(141,244,255,.06);
          color: #e9fdff;
          font: 900 12px/1.15 ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: .09em;
          text-align: center;
          text-transform: uppercase;
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
        }
        #dynamicWorldInteractButton.is-visible { display: block; }
        #dynamicWorldInteractButton small {
          display: block;
          margin-top: 5px;
          color: #8df4ff;
          font-size: 8px;
          line-height: 1.25;
          letter-spacing: .07em;
        }
        @media (min-width: 769px) {
          #dynamicWorldInteractButton { bottom: 28px; min-width: 166px; }
        }
        @media (prefers-reduced-motion: reduce) {
          #dynamicWorldInteractButton { transition: none; }
        }
      `;
      document.head.appendChild(style);
    }

    button = document.createElement('button');
    button.id = 'dynamicWorldInteractButton';
    button.type = 'button';
    document.body.appendChild(button);
  }

  if (!button.dataset.boundV4) {
    button.dataset.boundV4 = '1';
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const scene = window.__dynamicWorldSceneV4;
      const target = scene?.dynamicWorldTargetV4;
      if (scene && target) interact(scene, target);
    }, { passive: false });
  }

  return button;
}

function cue(scene, text, color) {
  scene?.playerCue?.(text, color);
}

function makeControl(scene, x, y, config, missionId) {
  const container = scene.add.container(x, y).setDepth(12).setSize(54, 64);
  const shadow = scene.add.ellipse(0, 28, 44, 9, 0x000000, .28);
  const body = scene.add.rectangle(0, 0, 34, 46, 0x0d1a2b, 1)
    .setStrokeStyle(2, 0x8df4ff, .95);
  const core = scene.add.circle(0, -8, 8, 0xffd06e, 1)
    .setStrokeStyle(1, 0xfff2bd, .9);
  const lever = scene.add.rectangle(0, 10, 4, 13, 0xd9faff, 1);
  const label = scene.add.text(0, 40, 'CONTROL', {
    fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold',
    color: '#dffcff', stroke: '#02050d', strokeThickness: 3,
  }).setOrigin(.5);
  const caption = scene.add.text(0, -42, config.title, {
    fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold',
    color: '#b9f5ff', stroke: '#02050d', strokeThickness: 3,
  }).setOrigin(.5);

  container.add([shadow, body, core, lever, label, caption]);
  container.setDataEnabled();
  container.setData('mechanicType', 'route-control');
  container.setData('missionId', missionId);
  container.setData('targetId', config.targetId);
  container.setData('hint', config.hint);
  container.setData('used', false);
  container.setData('children', { body, core, lever, label, caption });
  return container;
}

function getAuthoredBarrier(scene, config) {
  const barriers = scene?.barriers?.getChildren?.() || [];
  const target = barriers.find(barrier => {
    if (!barrier?.active || barrier.visible === false) return false;
    return Math.abs((barrier.x || 0) - (config.targetX + 24)) <= TARGET_TOLERANCE
      && Math.abs((barrier.y || 0) - (config.targetY + 32)) <= TARGET_TOLERANCE;
  });

  if (target) target.setData?.('dynamicWorldTargetId', config.targetId);
  return target || null;
}

function setup(scene) {
  if (!scene?.add || !scene?.player || stateByScene.has(scene)) return;

  const missionId = getMissionId(scene);
  const config = missionId ? MISSION_CONFIG[missionId] : null;
  if (!missionId || !config) {
    console.warn('[DynamicWorldV4] mission id unavailable; mechanic not spawned.');
    return;
  }

  const targetBarrier = getAuthoredBarrier(scene, config);
  if (!targetBarrier) {
    console.error(`[DynamicWorldV4] authored target ${config.targetId} missing at ${config.targetX},${config.targetY}; mechanic not spawned.`);
    return;
  }

  const control = makeControl(
    scene,
    targetBarrier.x + config.offsetX,
    targetBarrier.y + config.offsetY,
    config,
    missionId,
  );

  const state = {
    missionId,
    config,
    control,
    targetBarrier,
    lastInteractAt: 0,
  };

  stateByScene.set(scene, state);
  scene.dynamicWorldMechanicsV4 = state;
}

function releaseBarrier(scene, state) {
  const barrier = state?.targetBarrier;
  if (!barrier?.active || barrier.visible === false) return false;

  try {
    if (typeof barrier.disableBody === 'function') {
      barrier.disableBody(true, true);
    } else if (barrier.body) {
      barrier.body.enable = false;
    }
  } catch (error) {
    console.warn('[DynamicWorldV4] barrier release fallback', error);
  }

  barrier.setVisible?.(false);
  barrier.setActive?.(false);

  const children = state.control.getData('children');
  children?.body?.setStrokeStyle?.(2, 0xaee37f, .95);
  children?.core?.setFillStyle?.(0xaee37f, 1);
  children?.lever?.setRotation?.(-0.65);
  state.control.setData('used', true);

  cue(scene, state.config.message, state.config.color);
  return true;
}

function interact(scene, target) {
  const state = stateByScene.get(scene);
  const now = performance.now();

  if (!state || target !== state.control) return false;
  if (now - state.lastInteractAt < COOLDOWN_MS) return false;
  if (!target.active || target.getData('used')) return false;
  if (distance(scene.player, target) > INTERACT_DISTANCE) return false;

  state.lastInteractAt = now;
  return releaseBarrier(scene, state);
}

function update(scene) {
  const state = stateByScene.get(scene);
  if (!state || !scene?.player?.active) return;

  window.__dynamicWorldSceneV4 = scene;
  const button = ensureUi();
  const control = state.control;

  if (!control?.active || control.getData('used') || distance(scene.player, control) > INTERACT_DISTANCE) {
    button.classList.remove('is-visible');
    scene.dynamicWorldTargetV4 = null;
    return;
  }

  scene.dynamicWorldTargetV4 = control;
  button.innerHTML = `INTERACT <small>E / TAP · ${state.config.hint}</small>`;
  button.classList.add('is-visible');
}

function teardown(scene) {
  const state = stateByScene.get(scene);
  if (state) {
    try { state.control?.destroy(true); } catch {}
    stateByScene.delete(scene);
  }

  if (window.__dynamicWorldSceneV4 === scene) window.__dynamicWorldSceneV4 = null;
  document.getElementById('dynamicWorldInteractButton')?.classList.remove('is-visible');
}

const originalCreate = RunnerScene.prototype.create;
const originalUpdate = RunnerScene.prototype.update;
const originalShutdown = RunnerScene.prototype.shutdown;

if (!RunnerScene.prototype.__dynamicWorldV4CreatePatched) {
  RunnerScene.prototype.create = function dynamicWorldV4Create(...args) {
    const result = originalCreate.apply(this, args);
    try { setup(this); } catch (error) { console.error('[DynamicWorldV4] setup failed', error); }
    return result;
  };
  RunnerScene.prototype.__dynamicWorldV4CreatePatched = true;
}

if (!RunnerScene.prototype.__dynamicWorldV4UpdatePatched) {
  RunnerScene.prototype.update = function dynamicWorldV4Update(...args) {
    const result = originalUpdate.apply(this, args);
    try { update(this); } catch (error) { console.error('[DynamicWorldV4] update failed', error); }
    return result;
  };
  RunnerScene.prototype.__dynamicWorldV4UpdatePatched = true;
}

if (!RunnerScene.prototype.__dynamicWorldV4ShutdownPatched) {
  RunnerScene.prototype.shutdown = function dynamicWorldV4Shutdown(...args) {
    try { teardown(this); } catch (error) { console.error('[DynamicWorldV4] teardown failed', error); }
    return originalShutdown.apply(this, args);
  };
  RunnerScene.prototype.__dynamicWorldV4ShutdownPatched = true;
}

document.addEventListener('keydown', event => {
  if (event.repeat || event.key.toLowerCase() !== 'e') return;
  const scene = window.__dynamicWorldSceneV4;
  const target = scene?.dynamicWorldTargetV4;
  if (scene && target && interact(scene, target)) event.preventDefault();
}, true);

ensureUi();
