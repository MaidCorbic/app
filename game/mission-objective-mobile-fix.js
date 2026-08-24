import { RunnerScene } from './src/scenes/RunnerScene.js';

function inputMode() {
  const touch = window.matchMedia?.('(hover:none) and (pointer:coarse)')?.matches === true;
  const landscape = window.innerWidth >= window.innerHeight;
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
  const safeLeft = Math.max(18, Number(window.getComputedStyle(document.getElementById('play') || document.body).getPropertyValue('--hud-safe-x').replace('px','')) || 18);

  let pw;
  let x;
  let y;

  if (landscape) {
    // Primary gameplay layout: mission is a left utility card directly below OLD QUARTER.
    // Keep the centre of the world open for the character and gameplay effects.
    pw = Math.min(touch ? 315 : 360, Math.max(270, w * (touch ? 0.29 : 0.27)));
    x = Math.round(safeLeft);
    y = Math.round(Math.max(82, Math.min(118, h * 0.16)));
  } else {
    // Portrait: same hierarchy, compact enough to preserve the playfield.
    pw = Math.min(300, w - 32);
    x = Math.round((w - pw) / 2);
    y = Math.max(92, Math.min(Math.round(h * 0.16), h - 330));
  }

  const scale = pw / baseW;
  card.setPosition(x, y).setScale(scale);
  state.x = x;
  state.y = y;
  state.scale = scale;
  state.width = pw;
  state.height = baseH * scale;
}

if (!RunnerScene.prototype.__missionObjectiveResponsiveV6Patched) {
  const originalUpdate = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function (...args) {
    const result = originalUpdate.apply(this, args);
    try { placeMissionCard(this); } catch (error) { console.error('[MissionObjectiveResponsiveV6]', error); }
    return result;
  };

  const originalResize = RunnerScene.prototype.resize;
  if (typeof originalResize === 'function') {
    RunnerScene.prototype.resize = function (...args) {
      const result = originalResize.apply(this, args);
      try { placeMissionCard(this); } catch (error) { console.error('[MissionObjectiveResponsiveV6 resize]', error); }
      return result;
    };
  }

  window.addEventListener('resize', () => {
    try {
      const scene = window.__relayRunnerScene || window.game?.scene?.getScene?.('RunnerScene');
      if (scene) placeMissionCard(scene);
    } catch {}
  }, { passive: true });

  window.addEventListener('orientationchange', () => {
    window.setTimeout(() => {
      try {
        const scene = window.__relayRunnerScene || window.game?.scene?.getScene?.('RunnerScene');
        if (scene) placeMissionCard(scene);
      } catch {}
    }, 80);
  }, { passive: true });

  RunnerScene.prototype.__missionObjectiveResponsiveV6Patched = true;
}
