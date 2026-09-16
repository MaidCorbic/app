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
   * Arrow movement remains available as an alias for the existing controls.
   * Relay Runner is a 2D side-scrolling runner, so W/S project onto the same
   * horizontal travel axis used by A/D.
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

  // Q is a discrete combat action. The existing RunnerScene already owns the
  // sword implementation; this listener guarantees the requested desktop key
  // reaches that canonical method once per physical press.
  if (!window.__relayDesktopSwordKeyV1) {
    window.__relayDesktopSwordKeyV1 = true;
    window.addEventListener('keydown', event => {
      if (String(event.code || '').toLowerCase() !== 'keyq') return;
      if (event.repeat) return;
      const target = event.target;
      const tag = String(target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable === true) return;

      const scene = window.__relayRunnerScene;
      if (!scene?.scene?.isActive?.() || scene.finished || scene.respawning || scene.cinematicActive) return;
      try {
        if (typeof scene.useSword === 'function') scene.useSword();
      } catch (error) {
        console.warn('[Relay Runner] Q sword command skipped:', error);
      }
    }, true);
  }

  const originalUpdate = RunnerScene.prototype.update;
  if (!RunnerScene.prototype.__relayPlayerMovementHotfixV5) {
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
        const leftArrow = down(cursors.left, 'arrowleft');
        const rightArrow = down(cursors.right, 'arrowright');

        // Preserve both control sets without allowing opposite aliases to fight.
        const forward = w || d || rightArrow;
        const backward = s || a || leftArrow;
        const axis = (forward ? 1 : 0) - (backward ? 1 : 0);

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

        applyMovementFeel({
          player,
          axis,
          jumpPressed: jumpJustPressed,
          jumpReleased: jumpJustReleased,
          now,
          delta: dt,
          state: movementState,
        });

        // Responsive running: prevent an active direction from getting stuck
        // at an almost-zero velocity after a landing, turn, or competing layer.
        if (axis !== 0) {
          const vx = Number(player.body.velocity.x) || 0;
          if (Math.abs(vx) < 90) player.body.setVelocityX(axis * 145);
        }

        /*
         * JUMP ARC V2
         *
         * The initial jump impulse remains centralized in MovementFeel. This
         * small phase-based shaping adds a softer take-off and stronger fall,
         * producing a visible game-like arc without replacing RunnerScene
         * physics or jump state.
         */
        if (jumpJustPressed) movementState.jumpStartedAt = now;

        const jumpStartedAt = Number(movementState.jumpStartedAt);
        const jumpAge = Number.isFinite(jumpStartedAt) ? now - jumpStartedAt : Infinity;
        const body = player.body;
        let vy = Number(body.velocity.y) || 0;

        if (Number.isFinite(jumpStartedAt) && jumpAge <= 185 && jumpDown && vy < 0) {
          vy = Math.max(-850, vy - (165 * dt / 1000));
          body.setVelocityY(vy);
        }

        if (Number.isFinite(jumpStartedAt) && vy > 0) {
          vy = Math.min(1180, vy + (105 * dt / 1000));
          body.setVelocityY(vy);
        }

        if (Number.isFinite(jumpStartedAt) && vy >= 0) movementState.jumpStartedAt = -Infinity;
      } catch (error) {
        console.warn('[Relay Runner] keyboard controls skipped:', error);
      }

      return result;
    };
    RunnerScene.prototype.__relayPlayerMovementHotfixV5 = true;
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
