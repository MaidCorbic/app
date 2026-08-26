import Phaser from 'phaser';
import { RunnerScene } from '../scenes/RunnerScene.js';

// Web-only movement safety net. It does not change movement tuning or mobile input.
// It guarantees keyboard references exist and only removes a stale presentation lock
// after the gameplay intro/title is no longer visible.
export function installWebMovementPermanentGuard(RunnerSceneClass = RunnerScene) {
  if (!RunnerSceneClass?.prototype || RunnerSceneClass.prototype.__webMovementPermanentGuardV2) return;
  RunnerSceneClass.prototype.__webMovementPermanentGuardV2 = true;

  const isTouchDevice = () => (
    typeof navigator !== 'undefined' && (
      navigator.maxTouchPoints > 0
      || 'ontouchstart' in window
      || window.matchMedia?.('(pointer: coarse)').matches
      || window.matchMedia?.('(hover: none)').matches
    )
  );

  const ensureKeyboard = scene => {
    if (!scene || isTouchDevice() || !scene.input?.keyboard) return;
    try {
      if (!scene.cursors) scene.cursors = scene.input.keyboard.createCursorKeys();
      if (!scene.keys) {
        scene.keys = scene.input.keyboard.addKeys({
          A: Phaser.Input.Keyboard.KeyCodes.A,
          D: Phaser.Input.Keyboard.KeyCodes.D,
          W: Phaser.Input.Keyboard.KeyCodes.W,
          S: Phaser.Input.Keyboard.KeyCodes.S,
          SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
          SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
          E: Phaser.Input.Keyboard.KeyCodes.E,
          Q: Phaser.Input.Keyboard.KeyCodes.Q,
        });
      }
    } catch (error) {
      console.warn('[WebMovementGuard] keyboard recovery skipped', error);
    }
  };

  const clearStaleLock = scene => {
    if (!scene || isTouchDevice() || !scene.player?.body) return;
    const intro = document.getElementById('relayGameplayIntroFinalV1');
    const title = document.getElementById('titlePanel');
    const introVisible = !!(intro && !intro.hidden && !intro.classList.contains('hidden'));
    const titleVisible = !!(title && !title.classList.contains('hidden'));
    if (introVisible || titleVisible) return;

    if (scene.cinematicActive === true) scene.cinematicActive = false;
    if (scene.inputEnabled === false) scene.inputEnabled = true;

    try { scene.physics?.world?.resume?.(); } catch {}
    scene.player.body.enable = true;
    scene.player.body.moves = true;
    scene.player.body.allowGravity = true;
  };

  const originalCreate = RunnerSceneClass.prototype.create;
  const originalUpdate = RunnerSceneClass.prototype.update;

  RunnerSceneClass.prototype.create = function webMovementPermanentGuardCreate(...args) {
    const result = originalCreate.apply(this, args);
    ensureKeyboard(this);
    clearStaleLock(this);
    window.__relayRunnerScene = this;
    return result;
  };

  RunnerSceneClass.prototype.update = function webMovementPermanentGuardUpdate(time, delta) {
    ensureKeyboard(this);
    clearStaleLock(this);
    return originalUpdate.call(this, time, delta);
  };
}
