import Phaser from 'phaser';
import { RunnerScene } from '../scenes/RunnerScene.js';

function installWebMovementRecovery() {
  if (RunnerScene.prototype.__webMovementRecoveryV1) return;
  RunnerScene.prototype.__webMovementRecoveryV1 = true;

  const isTouchDevice = () => navigator.maxTouchPoints > 0
    || 'ontouchstart' in window
    || window.matchMedia?.('(pointer: coarse)').matches
    || window.matchMedia?.('(hover: none)').matches;

  const ensureKeyboardRefs = scene => {
    if (!scene?.input?.keyboard) return;
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
  };

  const recoverPresentationLock = scene => {
    if (!scene || isTouchDevice()) return;
    const intro = document.getElementById('relayGameplayIntroFinalV1');
    const introVisible = intro && !intro.hidden && !intro.classList.contains('hidden');
    const title = document.getElementById('titlePanel');
    const titleVisible = title && !title.classList.contains('hidden');
    if (!scene.player?.body || introVisible || titleVisible) return;

    if (scene.cinematicActive || scene.inputEnabled === false) {
      scene.cinematicActive = false;
      scene.inputEnabled = true;
      try { scene.physics?.world?.resume?.(); } catch { /* already running */ }
      scene.player.body.enable = true;
      scene.player.body.moves = true;
      scene.player.body.allowGravity = true;
      scene.cameras?.main?.startFollow?.(scene.player, true, .08, .08);
    }
  };

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function webMovementRecoveryCreate(...args) {
    const result = originalCreate.apply(this, args);
    ensureKeyboardRefs(this);
    window.__relayRunnerScene = this;
    return result;
  };

  RunnerScene.prototype.update = function webMovementRecoveryUpdate(time, delta) {
    ensureKeyboardRefs(this);
    recoverPresentationLock(this);
    return originalUpdate.call(this, time, delta);
  };
}

export { installWebMovementRecovery };
