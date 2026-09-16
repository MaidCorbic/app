// Mobile black-screen recovery for the existing Relay Runner scene lifecycle.
import './mobile-cinematic-bypass-v1.js';
import { RunnerScene } from '../scenes/RunnerScene.js';
import { applyHorizontalMovementFeel } from '../movement/MovementFeel.js';

if (!window.__relayMobileBlackScreenFix) {
  window.__relayMobileBlackScreenFix = true;
  const isTouch = () => window.matchMedia?.('(pointer: coarse)').matches || Number(navigator.maxTouchPoints || 0) > 0 || /Android|iPhone|iPad|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');

  // The boot flow creates mission 01 paused underneath the title screen.
  // Stop that hidden instance before the title button's existing handler runs;
  // main.js will then take its normal launch(0) path and create a fresh run.
  document.addEventListener('click', event => {
    const start = event.target.closest?.('#start');
    if (!start) return;
    const runner = window.__relayRunnerScene;
    if (!runner?.scene?.isPaused?.()) return;
    try { runner.scene.stop(); } catch (error) { console.warn('[Relay Runner] Mobile boot scene stop failed', error); }
  }, true);

  const originalCreate = RunnerScene.prototype.create;
    RunnerScene.prototype.create = function mobileSafeCreate(...args) {
    const result = originalCreate.apply(this, args);

      if (isTouch()) {
      const width = Math.max(1, this.scale.width);
      const height = 860;

      this.__mobileWorldSurface = this.add
        .rectangle(
          width / 2,
          height / 2,
          width,
          height,
          0x07101e,
          1
        )
        .setScrollFactor(0)
        .setDepth(-1000);

      this.cameras.main.setBounds(
        0,
        0,
        this.worldWidth || 6280,
        height
      );

      this.cameras.main.setBackgroundColor('#07101e');
    }
    return result;
  };

  /*
   * RUNNER MOVEMENT HOTFIX
   *
   * This module is loaded by core-stability.js on every real gameplay boot.
   * The previous attempted fix lived in gameplay-feel-v3.js, but that module
   * is intentionally NOT loaded by the current UI bootstrap. Therefore it
   * could never affect the running game.
   *
   * RunnerScene already owns the keyboard state (A/D + arrow keys) and
   * MovementFeel already owns acceleration/deceleration. We connect those
   * two existing systems here instead of creating a second input owner.
   */
  const originalUpdate = RunnerScene.prototype.update;
  if (!RunnerScene.prototype.__relayPlayerMovementHotfixV2) {
    RunnerScene.prototype.update = function mobileMovementUpdate(time, delta, ...args) {
      const result = originalUpdate.apply(this, [time, delta, ...args]);

      try {
        const player = this.player;
        if (!player?.body || !this.scene?.isActive?.()) return result;
        if (this.finished || this.respawning || this.cinematicActive || this.relayPuzzleActive) return result;
        if (this.__relayIntentionalBlock === true || this.inputEnabled === false) return result;

        const keys = this.keys || {};
        const cursors = this.cursors || {};
        const left = Boolean(keys.A?.isDown || cursors.left?.isDown);
        const right = Boolean(keys.D?.isDown || cursors.right?.isDown);
        const axis = (right ? 1 : 0) - (left ? 1 : 0);
        const dt = Number.isFinite(Number(delta)) && Number(delta) > 0
          ? Math.min(Number(delta), 50)
          : 16.67;

        applyHorizontalMovementFeel({
          player,
          axis,
          delta: dt,
          maxSpeed: 475,
        });
      } catch (error) {
        console.warn('[Relay Runner] player movement hotfix skipped:', error);
      }

      return result;
    };
    RunnerScene.prototype.__relayPlayerMovementHotfixV2 = true;
  }

  let lastSurfaceWidth = 0;
  let lastSurfaceHeight = 0;

  window.addEventListener('resize', () => {
    const scene = window.__relayRunnerScene;
    if (!isTouch() || !scene?.scene?.isActive?.() || !scene.cameras?.main) return;

    const width = Math.max(1, scene.scale.width);
    const height = 860;
    if (width === lastSurfaceWidth && height === lastSurfaceHeight) {
      return;
    }

    lastSurfaceWidth = width;
    lastSurfaceHeight = height;

    scene.__mobileWorldSurface
      ?.setPosition(width / 2, height / 2)
      .setSize(width, height);

    scene.cameras.main.setBounds(
      0,
      0,
      scene.worldWidth || 6280,
      height
    );
  }, { passive: true });
}
