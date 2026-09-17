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

      // E/Q are routed through RunnerScene.mobileActions when Phaser's native
      // keyboard state is not receiving the physical desktop event. This keeps
      // one action owner and avoids double fire/sword calls.
      if ((code === 'keye' || code === 'keyq') && !event.__relaySyntheticAction) {
        const scene = window.__relayRunnerScene;
        const gameplayActive = !!scene?.scene?.isActive?.() && !scene.finished && !scene.respawning && !scene.cinematicActive;
        if (gameplayActive) {
          const nativeKey = code === 'keye' ? scene.keys?.E : scene.keys?.Q;
          if (!nativeKey?.isDown) {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (scene.mobileActions) {
              if (code === 'keye') scene.mobileActions.fire = true;
              if (code === 'keyq') scene.mobileActions.sword = true;
            }
          }
        }
      }

      if ([
        'keyw', 'keys', 'keya', 'keyd',
        'space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
        'keye', 'keyq'
      ].includes(code)) bridge.down.add(code);
    }, true);

    window.addEventListener('keyup', event => {
      bridge.down.delete(normalize(event));
    }, true);

    window.addEventListener('blur', () => bridge.down.clear(), { passive: true });
  }

  const originalUpdate = RunnerScene.prototype.update;
  if (!RunnerScene.prototype.__relayPlayerMovementHotfixV8) {
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
        const forward = w || d;
        const backward = s || a;
        const axis = (forward ? 1 : 0) - (backward ? 1 : 0);
        const hasWASDMovement = axis !== 0;

        const dt = Number.isFinite(Number(delta)) && Number(delta) > 0 ? Math.min(Number(delta), 50) : 16.67;
        const now = Number.isFinite(Number(time)) ? Number(time) : (this.time?.now || performance.now());

        const spaceDown = down(keys.SPACE, 'space');
        const upDown = down(cursors.up, 'arrowup');
        const jumpDown = spaceDown || upDown;
        const jumpJustPressed = jumpDown && !this.__relayJumpWasDown;
        const jumpJustReleased = !jumpDown && Boolean(this.__relayJumpWasDown);
        this.__relayJumpWasDown = jumpDown;

        if (!this.__relayKeyboardMovementState) this.__relayKeyboardMovementState = createMovementFeelState(now);
        const movementState = this.__relayKeyboardMovementState;

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

        if (hasWASDMovement) {
          const vx = Number(player.body.velocity.x) || 0;
          if (Math.abs(vx) < 90) player.body.setVelocityX(axis * 145);
        }

        // Flight was already activating with F, but its old vertical speed was
        // too weak. While flying, strengthen the actual flight controller and
        // keep A/D as horizontal steering while W/S control vertical travel.
        const flight = this.__flightHVG;
        if (flight && (flight.state === 'flying' || flight.state === 'hover')) {
          flight.verticalSpeed = 440;
          if (flight.state === 'hover') {
            player.body.setVelocityY(0);
          } else {
            const vertical = (w ? -1 : 0) + (s ? 1 : 0);
            if (vertical !== 0) player.body.setVelocityY(vertical * flight.verticalSpeed);
          }
          const horizontal = (d ? 1 : 0) - (a ? 1 : 0);
          if (horizontal !== 0) player.body.setVelocityX(horizontal * 560);
        }
      } catch (error) {
        console.warn('[Relay Runner] keyboard controls skipped:', error);
      }

      return result;
    };
    RunnerScene.prototype.__relayPlayerMovementHotfixV8 = true;
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
