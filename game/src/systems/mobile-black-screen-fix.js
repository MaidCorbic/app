// Mobile black-screen recovery for the existing Relay Runner scene lifecycle.
import './mobile-cinematic-bypass-v1.js';
import { RunnerScene } from '../scenes/RunnerScene.js';
import { applyMovementFeel, createMovementFeelState } from '../movement/MovementFeel.js';

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
   * RUNNER KEYBOARD CONTROL OWNER
   *
   * Desktop controls:
   *   W / D = forward/right
   *   S / A = backward/left
   *   SPACE = jump
   *   E = fire + existing interaction systems
   *
   * Relay Runner is a 2D side-scrolling runner, so W/S are mapped to the
   * forward/backward horizontal direction while A/D remain left/right.
   * E is intentionally not replaced: existing interaction/combat listeners
   * already use the E keyboard event, so one E press can service either the
   * nearest interaction or the existing fire system.
   */
  const originalUpdate = RunnerScene.prototype.update;
  if (!RunnerScene.prototype.__relayPlayerMovementHotfixV3) {
    RunnerScene.prototype.update = function relayKeyboardControlUpdate(time, delta, ...args) {
      const result = originalUpdate.apply(this, [time, delta, ...args]);

      try {
        const player = this.player;
        if (!player?.body || !this.scene?.isActive?.()) return result;
        if (this.finished || this.respawning || this.cinematicActive || this.relayPuzzleActive) return result;
        if (this.__relayIntentionalBlock === true || this.inputEnabled === false) return result;

        const keys = this.keys || {};
        const cursors = this.cursors || {};
        const down = key => Boolean(key?.isDown);

        // W = forward, S = backward, A = left, D = right.
        // In the current 2D runner world, forward/backward resolve to the
        // horizontal travel axis; A/D remain the explicit left/right pair.
        const forward = down(keys.W) || down(keys.D) || down(cursors.right);
        const backward = down(keys.S) || down(keys.A) || down(cursors.left);
        const axis = (forward ? 1 : 0) - (backward ? 1 : 0);

        const dt = Number.isFinite(Number(delta)) && Number(delta) > 0
          ? Math.min(Number(delta), 50)
          : 16.67;
        const now = Number.isFinite(Number(time)) ? Number(time) : (this.time?.now || performance.now());

        const spaceDown = down(keys.SPACE);
        const spaceJustPressed = spaceDown && !this.__relaySpaceWasDown;
        const spaceJustReleased = !spaceDown && Boolean(this.__relaySpaceWasDown);
        this.__relaySpaceWasDown = spaceDown;

        if (!this.__relayKeyboardMovementState) {
          this.__relayKeyboardMovementState = createMovementFeelState(now);
        }

        // Use the existing MovementFeel jump implementation so coyote time,
        // jump buffering and fall-speed limits stay centralized.
        applyMovementFeel({
          player,
          axis,
          jumpPressed: spaceJustPressed,
          jumpReleased: spaceJustReleased,
          now,
          delta: dt,
          state: this.__relayKeyboardMovementState,
        });
      } catch (error) {
        console.warn('[Relay Runner] keyboard controls skipped:', error);
      }

      return result;
    };
    RunnerScene.prototype.__relayPlayerMovementHotfixV3 = true;
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
