import { RunnerScene } from '../scenes/RunnerScene.js';

// UPDATE 11 — DYNAMIC WORLD MECHANICS V3
// Exactly ONE authored world-control object per campaign mission.
// Placement is deterministic per mission: each mission has its own manually
// selected barrier index and fixed local offset. No nearest-object discovery.
// Existing barrier bodies are reused for the gameplay consequence.
// No new physics bodies, platform mutation, movement changes, or checkpoint changes.

const INTERACT_DISTANCE = 118;
const COOLDOWN_MS = 300;

const MISSION_CONFIG = {
  'first-delivery': {
    barrierIndex: 0,
    offsetX: -150,
    offsetY: -42,
    title: 'POWER NODE',
    hint: 'POWER ROUTE',
    message: 'POWER ROUTE ONLINE',
    color: '#aee37f',
  },
  'dead-drop': {
    barrierIndex: 1,
    offsetX: -150,
    offsetY: -42,
    title: 'DOCK CONTROL',
    hint: 'RELEASE DOCK GATE',
    message: 'DOCK ROUTE RELEASED',
    color: '#8df4ff',
  },
  blackout: {
    barrierIndex: 2,
    offsetX: -150,
    offsetY: -42,
    title: 'GRID CONTROL',
    hint: 'RESTORE GRID ACCESS',
    message: 'GRID ACCESS RESTORED',
    color: '#8df4ff',
  },
  pursuit: {
    barrierIndex: 1,
    offsetX: -150,
    offsetY: -42,
    title: 'RAIL CONTROL',
    hint: 'DISABLE SECURITY',
    message: 'RAIL SECURITY DISABLED',
    color: '#ffbd7a',
  },
  'signal-storm': {
    barrierIndex: 2,
    offsetX: -150,
    offsetY: -42,
    title: 'ARRAY CONTROL',
    hint: 'OPEN STORM ROUTE',
    message: 'STORM ROUTE OPEN',
    color: '#b993ff',
  },
  'corporate-lockdown': {
    barrierIndex: 1,
    offsetX: -150,
    offsetY: -42,
    title: 'HELIX CONTROL',
    hint: 'RELEASE LOCKDOWN',
    message: 'LOCKDOWN RELEASED',
    color: '#ff826e',
  },
  'final-relay': {
    barrierIndex: 2,
    offsetX: -150,
    offsetY: -42,
    title: 'APEX CONTROL',
    hint: 'OPEN FINAL ROUTE',
    message: 'FINAL RELAY ROUTE OPEN',
    color: '#ffd06e',
  },
};

const stateByScene = new WeakMap();

function getMissionId(scene) {
  const candidates = [
    scene?.sys?.settings?.data?.missionId,
    scene?.sys?.settings?.data?.mission,
    scene?.registry?.get?.('missionId'),
    scene?.registry?.get?.('mission'),
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
    let style = document.getElementById('dynamic-world-mechanics-v3-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-world-mechanics-v3-style';
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
        #dynamicWorldInteractButton.is-done {
          border-color: #aee37f;
          color: #efffdc;
          box-shadow: 0 0 16px rgba(174,227,127,.38), inset 0 0 14px rgba(174,227,127,.08);
        }
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

  if (!button.dataset.boundV3) {
    button.dataset.boundV3 = '1';
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const scene = window.__dynamicWorldSceneV3;
      const target = scene?.dynamicWorldTargetV3;
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
    fontFamily: 'monospace',
    fontSize: '7px',
    fontStyle: 'bold',
    color: '#dffcff',
    stroke: '#02050d',
    strokeThickness: 3,
  }).setOrigin(.5);
  const caption = scene.add.text(0, -42, config.title, {
    fontFamily: 'monospace',
    fontSize: '7px',
    fontStyle: 'bold',
    color: '#b9f5ff',
    stroke: '#02050d',
    strokeThickness: 3,
  }).setOrigin(.5);

  container.add([shadow, body, core, lever, label, caption]);
  container.setDataEnabled();
  container.setData('mechanicType', 'route-control');
  container.setData('missionId', missionId);
  container.setData('hint', config.hint);
  container.setData('used', false);
  container.setData('children', { body, core, lever, label, caption });
  return container;
}

function getAuthoredBarrier(scene, missionId) {
  const config = MISSION_CONFIG[missionId];
  const barriers = (scene?.barriers?.getChildren?.() || [])
    .filter(item => item?.active && item.visible !== false)
    .sort((a, b) => (a.x || 0) - (b.x || 0));

  // The barrier index is authored per mission. There is intentionally no
  // nearest-barrier fallback: if the level layout changes, the mechanic does
  // not silently attach itself to an unrelated gameplay object.
  return barriers[config.barrierIndex] || null;
}

function setup(scene) {
  if (!scene?.add || !scene?.player || stateByScene.has(scene)) return;

  const missionId = getMissionId(scene);
  const config = missionId ? MISSION_CONFIG[missionId] : null;
  if (!missionId || !config) {
    console.warn('[DynamicWorldV3] mission id unavailable; mechanic not spawned.');
    return;
  }

  const targetBarrier = getAuthoredBarrier(scene, missionId);
  if (!targetBarrier) {
    console.error(`[DynamicWorldV3] authored barrier ${config.barrierIndex} missing for ${missionId}; mechanic not spawned.`);
    return;
  }

  // Fixed, authored placement relative to the selected level barrier.
  // This remains deterministic and does not search for another object.
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
  scene.dynamicWorldMechanicsV3 = state;
}

function releaseBarrier(scene, state) {
  const barrier = state?.targetBarrier;
  if (!barrier?.active || barrier.visible === false) return false;

  // Reuse the existing barrier body. No new collision body is created.
  try {
    if (typeof barrier.disableBody === 'function') {
      barrier.disableBody(true, true);
    } else if (barrier.body) {
      barrier.body.enable = false;
    }
  } catch (error) {
    console.warn('[DynamicWorldV3] barrier release fallback', error);
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

  window.__dynamicWorldSceneV3 = scene;
  const button = ensureUi();
  const control = state.control;

  if (!control?.active || control.getData('used') || distance(scene.player, control) > INTERACT_DISTANCE) {
    button.classList.remove('is-visible', 'is-done');
    scene.dynamicWorldTargetV3 = null;
    return;
  }

  scene.dynamicWorldTargetV3 = control;
  button.innerHTML = `INTERACT <small>E / TAP · ${state.config.hint}</small>`;
  button.classList.add('is-visible');
  button.classList.remove('is-done');
}

function teardown(scene) {
  const state = stateByScene.get(scene);
  if (state) {
    try { state.control?.destroy(true); } catch {}
    stateByScene.delete(scene);
  }

  if (window.__dynamicWorldSceneV3 === scene) window.__dynamicWorldSceneV3 = null;
  document.getElementById('dynamicWorldInteractButton')?.classList.remove('is-visible', 'is-done');
}

const originalCreate = RunnerScene.prototype.create;
const originalUpdate = RunnerScene.prototype.update;
const originalShutdown = RunnerScene.prototype.shutdown;

if (!RunnerScene.prototype.__dynamicWorldV3CreatePatched) {
  RunnerScene.prototype.create = function dynamicWorldV3Create(...args) {
    const result = originalCreate.apply(this, args);
    try { setup(this); } catch (error) { console.error('[DynamicWorldV3] setup failed', error); }
    return result;
  };
  RunnerScene.prototype.__dynamicWorldV3CreatePatched = true;
}

if (!RunnerScene.prototype.__dynamicWorldV3UpdatePatched) {
  RunnerScene.prototype.update = function dynamicWorldV3Update(...args) {
    const result = originalUpdate.apply(this, args);
    try { update(this); } catch (error) { console.error('[DynamicWorldV3] update failed', error); }
    return result;
  };
  RunnerScene.prototype.__dynamicWorldV3UpdatePatched = true;
}

if (!RunnerScene.prototype.__dynamicWorldV3ShutdownPatched) {
  RunnerScene.prototype.shutdown = function dynamicWorldV3Shutdown(...args) {
    try { teardown(this); } catch (error) { console.error('[DynamicWorldV3] teardown failed', error); }
    return originalShutdown.apply(this, args);
  };
  RunnerScene.prototype.__dynamicWorldV3ShutdownPatched = true;
}

document.addEventListener('keydown', event => {
  if (event.repeat || event.key.toLowerCase() !== 'e') return;
  const scene = window.__dynamicWorldSceneV3;
  const target = scene?.dynamicWorldTargetV3;
  if (scene && target && interact(scene, target)) event.preventDefault();
}, true);

ensureUi();
