import { RunnerScene } from './src/scenes/RunnerScene.js';

function inputMode() {
  const touch = window.matchMedia?.('(hover:none) and (pointer:coarse)')?.matches === true;
  const landscape = window.innerWidth > window.innerHeight;
  return { touch, landscape };
}

function placeMissionCard(scene) {
  const state = scene?.__missionObjectiveState;
  const card = state?.c;
  if (!card?.active) return;

  const { touch, landscape } = inputMode();
  const w = scene?.scale?.gameSize?.width || window.innerWidth;
  const h = scene?.scale?.gameSize?.height || window.innerHeight;
  const baseW = 426;
  const baseH = 166;

  let scale;
  let pw;
  let x;
  let y;

  if (touch && landscape) {
    // PRIMARY PHONE MODE: mission stays centered above the play lane.
    // The bottom-right action deck and bottom-left cargo/joystick lanes remain clear.
    pw = Math.min(330, w * 0.40);
    scale = pw / baseW;
    const actualH = baseH * scale;
    x = Math.round((w - pw) / 2);
    y = Math.max(82, Math.min(Math.round(h * 0.28), h - actualH - 112));
  } else if (touch && !landscape) {
    // PORTRAIT: basic HUD. Keep the objective high enough to leave the
    // lower playfield and touch controls visually open.
    pw = Math.min(320, w - 36);
    scale = pw / baseW;
    const actualH = baseH * scale;
    x = Math.round((w - pw) / 2);
    y = Math.max(112, Math.min(Math.round(h * 0.19), h - actualH - 150));
  } else {
    // DESKTOP: cinematic center card, scaled down slightly so the world remains visible.
    pw = Math.min(400, w * 0.34);
    scale = pw / baseW;
    const actualH = baseH * scale;
    x = Math.round((w - pw) / 2);
    y = Math.max(92, Math.min(Math.round(h * 0.25), h - actualH - 80));
  }

  card.setPosition(x, y).setScale(scale);
  state.x = x;
  state.y = y;
  state.scale = scale;
}

if (!RunnerScene.prototype.__missionObjectiveResponsiveV5Patched) {
  const originalUpdate = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function (...args) {
    const result = originalUpdate.apply(this, args);
    try { placeMissionCard(this); } catch (error) { console.error('[MissionObjectiveResponsiveV5]', error); }
    return result;
  };

  const originalResize = RunnerScene.prototype.resize;
  if (typeof originalResize === 'function') {
    RunnerScene.prototype.resize = function (...args) {
      const result = originalResize.apply(this, args);
      try { placeMissionCard(this); } catch (error) { console.error('[MissionObjectiveResponsiveV5 resize]', error); }
      return result;
    };
  }

  window.addEventListener('resize', () => {
    try {
      const scene = window.__relayRunnerScene || window.game?.scene?.getScene?.('RunnerScene');
      if (scene) placeMissionCard(scene);
    } catch {}
  }, { passive: true });

  RunnerScene.prototype.__missionObjectiveResponsiveV5Patched = true;
}
