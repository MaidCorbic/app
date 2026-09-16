// Mobile black-screen recovery for the existing Relay Runner scene lifecycle.
import './mobile-cinematic-bypass-v1.js';
import { RunnerScene } from '../scenes/RunnerScene.js';
import { applyMovementFeel, createMovementFeelState } from '../movement/MovementFeel.js';

if (!window.__relayMobileBlackScreenFix) {
  window.__relayMobileBlackScreenFix = true;
  const isTouch = () => window.matchMedia?.('(pointer: coarse)').matches || Number(navigator.maxTouchPoints || 0) > 0 || /Android|iPhone|iPad|Mobile|Windows Phone|Silk|Kindle/i.test(navigator.userAgent || '');

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
        .rectangle(width / 2, height / 2, width, height, 0x07101e, 1)
        .setScrollFactor(0)
        .setDepth(-1000);

      this.cameras.main.setBounds(0, 0, this.worldWidth || 6280, height);
      this.cameras.main.setBackgroundColor('#07101e');
    }
    return result;
  };

  /*
   * RUNNER KEYBOARD CONTROL OWNER
   *
   * Desktop:
   *   W = forward/right travel
   *   S = backward/left travel
   *   A = left
   *   D = right
   *   SPACE / Up Arrow = jump
   *   E = existing fire + interaction command
   *   Q = sword
   *
   * Arrow movement remains available through the existing RunnerScene input
   * owner. The custom movement feel is applied only while WASD is actually
   * pressed, so it cannot continuously decelerate or fight arrow movement.
   */

  if (!window.__relayDesktopKeyboardBridge) {
    window.__relayDesktopKeyboardBridge = {
      down: new Set(),
      installed: true,
    };

    const normalize = event => String(event.code || event.key || '').toLowerCase();
    const ignoredTarget = target => {
      const tag = String(target?.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable === true;
    };

    window.addEventListener('keydown', event => {
      if (ignoredTarget(event.target)) return;
      const code = normalize(event);
      if ([
        'keyw', 'keys', 'keya', 'keyd',
        'space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
        'keye', 'keyq'
      ].includes(code)) {
        window.__relayDesktopKeyboardBridge.down.add(code);
      }
    }, true);

    window.addEventListener('keyup', event => {
      window.__relayDesktopKeyboardBridge.down.delete(normalize(event));
    }, true);

    window.addEventListener('blur', () => {
      window.__relayDesktopKeyboardBridge.down.clear();
    }, { passive: true });
  }

  // Q/E already have canonical action bindings in the existing input owner.
  // The bridge only tracks them; it does not fire duplicate sword/fire actions.

  const originalUpdate = RunnerScene.prototype.update;
  if (!RunnerScene.prototype.__relayPlayerMovementHotfixV7) {
    RunnerScene.prototype.update = function relayKeyboardControlUpdate(time, delta, ...args) {
      const result = originalUpdate.apply(this, [time, delta, ...args]);

      try {
        const player = this.player;
        if (!player?.body || !this.scene?.isActive?.()) return result;
        if (this.finished || this.respawning || this.cinematicActive || this.relayPuzzleActive) return result;
        if (this.__relayIntentionalBlock === true || this.inputEnabled === false) return result;

        const keys = this.keys || {};
        const cursors = this.cursors || {};
        const bridge = window.__relayDesktopKeyboardBridge?.down;
        const down = (key, ...codes) => Boolean(key?.isDown) || Boolean(bridge && codes.some(code => bridge.has(code)));

        const w = down(keys.W, 'keyw');
        const s = down(keys.S, 'keys');
        const a = down(keys.A, 'keya');
        const d = down(keys.D, 'keyd');

        // WASD owns custom movement feel. Arrow keys stay with the existing
        // RunnerScene movement owner and are intentionally not re-applied here.
        const forward = w || d;
        const backward = s || a;
        const axis = (forward ? 1 : 0) - (backward ? 1 : 0);
        const hasWASDMovement = axis !== 0;

        const dt = Number.isFinite(Number(delta)) && Number(delta) > 0
          ? Math.min(Number(delta), 50)
          : 16.67;
        const now = Number.isFinite(Number(time)) ? Number(time) : (this.time?.now || performance.now());

        const spaceDown = down(keys.SPACE, 'space');
        const upDown = down(cursors.up, 'arrowup');
        const jumpDown = spaceDown || upDown;
        const jumpJustPressed = jumpDown && !this.__relayJumpWasDown;
        const jumpJustReleased = !jumpDown && Boolean(this.__relayJumpWasDown);
        this.__relayJumpWasDown = jumpDown;

        if (!this.__relayKeyboardMovementState) {
          this.__relayKeyboardMovementState = createMovementFeelState(now);
        }

        const movementState = this.__relayKeyboardMovementState;

        // Never pass axis=0 into the feel helper: that would intentionally
        // decelerate the player every frame and can cause the reported stalls.
        // Jump is still handled here even when there is no WASD input.
        if (hasWASDMovement || jumpJustPressed || jumpJustReleased) {
          applyMovementFeel({
            player,
            axis: hasWASDMovement ? axis : 0,
            jumpPressed: jumpJustPressed,
            jumpReleased: jumpJustReleased,
            now,
            delta: dt,
            state: movementState,
          });
        }

        // If WASD is actively pressed but another gameplay layer briefly leaves
        // velocity almost zero, restore a small amount of momentum. This is a
        // one-time floor, not a second acceleration loop.
        if (hasWASDMovement) {
          const vx = Number(player.body.velocity.x) || 0;
          if (Math.abs(vx) < 90) player.body.setVelocityX(axis * 145);
        }

        /*
         * NATURAL JUMP ARC
         *
         * Do not manually rewrite velocity.y after the jump impulse. Phaser's
         * normal gravity is responsible for the rise -> apex -> fall curve.
         * The previous frame-by-frame Y shaping could make the jump feel like
         * a vertical snap and could also fight the scene's own air physics.
         * MovementFeel supplies the single jump impulse, coyote time, buffer,
         * and jump-cut behavior.
         */
        if (jumpJustPressed && !hasWASDMovement) {
          // Preserve the player's existing horizontal momentum for a jump
          // instead of forcing a vertical-only movement state.
          const vx = Number(player.body.velocity.x) || 0;
          if (Math.abs(vx) > 1) player.body.setVelocityX(vx);
        }
      } catch (error) {
        console.warn('[Relay Runner] keyboard controls skipped:', error);
      }

      return result;
    };
    RunnerScene.prototype.__relayPlayerMovementHotfixV7 = true;
  }

  let lastSurfaceWidth = 0;
  let lastSurfaceHeight = 0;

  window.addEventListener('resize', () => {
    const scene = window.__relayRunnerScene;
    if (!isTouch() || !scene?.scene?.isActive?.() || !scene.cameras?.main) return;

    const width = Math.max(1, scene.scale.width);
    const height = 860;
    if (width === lastSurfaceWidth && height === lastSurfaceHeight) return;

    lastSurfaceWidth = width;
    lastSurfaceHeight = height;

    scene.__mobileWorldSurface
      ?.setPosition(width / 2, height / 2)
      .setSize(width, height);

    scene.cameras.main.setBounds(0, 0, scene.worldWidth || 6280, height);
  }, { passive: true });
}
