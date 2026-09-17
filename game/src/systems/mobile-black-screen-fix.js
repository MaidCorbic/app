// Mobile black-screen recovery for the existing Relay Runner scene lifecycle.
import './mobile-cinematic-bypass-v1.js';
import { RunnerScene } from '../scenes/RunnerScene.js';
import { applyHorizontalMovementFeel } from '../movement/MovementFeel.js';

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
      this.__mobileWorldSurface = this.add.rectangle(width / 2, height / 2, width, height, 0x07101e, 1).setScrollFactor(0).setDepth(-1000);
      this.cameras.main.setBounds(0, 0, this.worldWidth || 6280, height);
      this.cameras.main.setBackgroundColor('#07101e');
    }
    return result;
  };

  if (!window.__relayDesktopKeyboardBridge) {
    window.__relayDesktopKeyboardBridge = { down: new Set(), installed: true };
    const normalize = event => String(event.code || event.key || '').toLowerCase();
    const ignoredTarget = target => {
      const tag = String(target?.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable === true;
    };

    window.addEventListener('keydown', event => {
      if (ignoredTarget(event.target)) return;
      const code = normalize(event);
      const bridge = window.__relayDesktopKeyboardBridge;
      if (!bridge) return;

      // Keep E/Q in Phaser's native keyboard pipeline. The gameplay systems
      // already own fire/sword; intercepting them here caused missed actions.
      if ([
        'keyw', 'keys', 'keya', 'keyd',
        'space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'
      ].includes(code)) {
        bridge.down.add(code);
      }
    }, true);

    window.addEventListener('keyup', event => {
      bridge.down.delete(normalize(event));
    }, true);

    window.addEventListener('blur', () => bridge.down.clear(), { passive: true });
  }

  const originalUpdate = RunnerScene.prototype.update;
  if (!RunnerScene.prototype.__relayPlayerMovementHotfixV9) {
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

        // 2D runner layout: W/D drive forward/right, S/A drive backward/left.
        // Arrow keys remain native and are intentionally preserved.
        const w = down(keys.W, 'keyw');
        const s = down(keys.S, 'keys');
        const a = down(keys.A, 'keya');
        const d = down(keys.D, 'keyd');
        const right = w || d;
        const left = s || a;
        const axis = (right ? 1 : 0) - (left ? 1 : 0);
        const hasWASDMovement = axis !== 0;

        const dt = Number.isFinite(Number(delta)) && Number(delta) > 0 ? Math.min(Number(delta), 50) : 16.67;

        // Movement hotfix owns only horizontal WASD steering. Vertical jump
        // physics stays exclusively inside RunnerScene, preventing two jump
        // controllers from fighting over velocity.y.
        if (hasWASDMovement) {
          applyHorizontalMovementFeel({
            player,
            axis,
            delta: dt,
            maxSpeed: 475,
          });

          // Give a jump launched while moving a clean horizontal carry so the
          // player travels onto the next platform instead of hopping straight up.
          const jumpDown = down(keys.SPACE, 'space') || down(cursors.up, 'arrowup');
          const jumpJustPressed = jumpDown && !this.__relayJumpWasDown;
          if (jumpJustPressed) {
            const body = player.body;
            const carry = Math.max(Math.abs(Number(body.velocity.x) || 0), 300);
            body.setVelocityX(Math.sign(axis) * Math.min(carry, 475));
          }
        }

        // Track jump state only for the horizontal carry above. Do NOT write
        // velocity.y here; RunnerScene's native jump/coyote/buffer system is
        // the single source of truth for Space/Up.
        const jumpDown = down(keys.SPACE, 'space') || down(cursors.up, 'arrowup');
        this.__relayJumpWasDown = jumpDown;

        // Do not override flight velocities here. flight-hover-glide-v1 owns
        // F, vertical flight, hover, gravity restoration and landing. Likewise,
        // dash-dodge-v1 owns Shift/dash and must remain the sole dash authority.
      } catch (error) {
        console.warn('[Relay Runner] keyboard controls skipped:', error);
      }

      return result;
    };
    RunnerScene.prototype.__relayPlayerMovementHotfixV9 = true;
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
    scene.__mobileWorldSurface?.setPosition(width / 2, height / 2).setSize(width, height);
    scene.cameras.main.setBounds(0, 0, scene.worldWidth || 6280, height);
  }, { passive: true });
}
