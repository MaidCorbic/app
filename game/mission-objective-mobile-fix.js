import { RunnerScene } from './src/scenes/RunnerScene.js';

function isTouchLandscape() {
  const coarse = window.matchMedia?.('(hover:none) and (pointer:coarse)')?.matches === true;
  return coarse && window.innerWidth > window.innerHeight && window.innerHeight <= 820;
}

function compactMissionCard(scene) {
  if (!isTouchLandscape()) return;
  const state = scene?.__missionObjectiveState;
  const card = state?.c;
  if (!card?.active) return;

  const w = scene?.scale?.gameSize?.width || window.innerWidth;
  const h = scene?.scale?.gameSize?.height || window.innerHeight;
  const baseW = 426;
  const baseH = 166;
  const pw = Math.min(360, w - 28);
  const scale = pw / baseW;
  const actualH = baseH * scale;

  // Keep the objective panel in the safe middle lane. The right side belongs
  // to JUMP/FIRE/SWORD/DASH and the lower-left belongs to the joystick/cargo UI.
  const x = Math.max(14, Math.round((w - pw) / 2));
  const y = Math.max(120, Math.min(Math.round(h * 0.42), h - actualH - 145));

  card.setPosition(x, y).setScale(scale);
  state.x = x;
  state.y = y;
  state.scale = scale;
}

if (!RunnerScene.prototype.__missionObjectiveMobileFixPatched) {
  const originalUpdate = RunnerScene.prototype.update;
  RunnerScene.prototype.update = function (...args) {
    const result = originalUpdate.apply(this, args);
    try { compactMissionCard(this); } catch (error) { console.error('[MissionObjectiveMobileFix]', error); }
    return result;
  };

  const originalResize = RunnerScene.prototype.resize;
  if (typeof originalResize === 'function') {
    RunnerScene.prototype.resize = function (...args) {
      const result = originalResize.apply(this, args);
      try { compactMissionCard(this); } catch (error) { console.error('[MissionObjectiveMobileFix resize]', error); }
      return result;
    };
  }

  RunnerScene.prototype.__missionObjectiveMobileFixPatched = true;
}
