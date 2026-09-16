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
   * Desktop aliases:
   *   W / D / Right Arrow = forward/right travel
   *   S / A / Left Arrow  = backward/left travel
   *   SPACE / Up Arrow    = jump
   *   E                   = fire + existing interaction systems
   *
   * Relay Runner is a 2D side-scrolling runner. "Forward/backward" therefore
   * resolve to the horizontal travel axis. W/S are the requested forward /
   * backward controls, while A/D are the requested left/right controls.
   * Arrow controls remain available as aliases, so existing players do not
   * lose the established keyboard scheme.
   */

  // Phaser's keyboard objects are normally enough, but keep a tiny browser
  // level key-state bridge as a reliability fallback. This prevents another
  // input owner from replacing scene.keys and makes WASD deterministic on
  // desktop without changing the mobile input owner.
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
      if (['keyw', 'keys', 'keya', 'keyd', 'space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'keye'].includes(code)) {
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

  const originalUpdate = RunnerScene.prototype.update;
  if (!RunnerScene.prototype.__relayPlayerMovementHotfixV4) {
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

        // Requested desktop layout + the existing arrow aliases.
        const w = down(keys.W, 'keyw');
        const s = down(keys.S, 'keys');
        const a = down(keys.A, 'keya');
        const d = down(keys.D, 'keyd');
        const leftArrow = down(cursors.left, 'arrowleft');
        const rightArrow = down(cursors.right, 'arrowright');

        // 2D runner travel axis:
        //   W / D / Right = forward/right
        //   S / A / Left  = backward/left
        const forward = w || d || rightArrow;
        const backward = s || a || leftArrow;
        const axis = (forward ? 1 : 0) - (backward ? 1 : 0);

        const dt = Number.isFinite(Number(delta)) && Number(delta) > 0
          ? Math.min(Number(delta), 50)
          : 16.67;
        const now = Number.isFinite(Number(time)) ? Number(time) : (this.time?.now || performance.now());

        // Space and Up Arrow are both jump. Up Arrow remains an alias for the
        // existing arrow scheme; Space is the new primary jump key.
        const spaceDown = down(keys.SPACE, 'space');
        const upDown = down(cursors.up, 'arrowup');
        const jumpDown = spaceDown || upDown;
        const jumpJustPressed = jumpDown && !this.__relayJumpWasDown;
        const jumpJustReleased = !jumpDown && Boolean(this.__relayJumpWasDown);
        this.__relayJumpWasDown = jumpDown;

        if (!this.__relayKeyboardMovementState) {
          this.__relayKeyboardMovementState = createMovementFeelState(now);
        }

        applyMovementFeel({
          player,
          axis,
          jumpPressed: jumpJustPressed,
          jumpReleased: jumpJustReleased,
          now,
          delta: dt,
          state: this.__relayKeyboardMovementState,
        });
      } catch (error) {
        console.warn('[Relay Runner] keyboard controls skipped:', error);
      }

      return result;
    };
    RunnerScene.prototype.__relayPlayerMovementHotfixV4 = true;
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
