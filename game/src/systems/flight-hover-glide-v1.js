const FLIGHT_STATE = Object.freeze({ GROUNDED: 'grounded', FLYING: 'flying', HOVER: 'hover', GLIDING: 'gliding', DEPLETED: 'depleted' });
const FLIGHT_KEY = 'KeyF';

function installFlightHoverGlide(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__flightHoverGlideV1) return;
  RunnerScene.prototype.__flightHoverGlideV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate?.apply(this, args);
    const enabled = this.mission?.id != null;
    this.__flightHVG = {
      enabled,
      state: FLIGHT_STATE.GROUNDED,
      keyDown: false,
      hoverHold: false,
      energyDrainPerSecond: 11,
      minEnergyToStart: 8,
      verticalSpeed: 260,
      horizontalAssist: 1,
      glideGravityScale: 0.16,
      glideMaxFallSpeed: 230,
      glideWindowMs: 850,
      glideUntil: 0,
      lastGrounded: true,
      lastToggleAt: 0,
      toggleCooldownMs: 180,
      depletedNoticeAt: 0,
    };

    this.__flightKeyDownHandler = event => {
      if (event.code !== FLIGHT_KEY || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && /input|textarea|select/i.test(event.target.tagName)) return;
      this.toggleFlightMode?.('keyboard');
    };
    window.addEventListener('keydown', this.__flightKeyDownHandler, true);

    this.__flightKeyUpHandler = event => {
      if (event.code === FLIGHT_KEY) this.__flightHVG && (this.__flightHVG.keyDown = false);
    };
    window.addEventListener('keyup', this.__flightKeyUpHandler, true);

    return result;
  };

  RunnerScene.prototype.toggleFlightMode = function (source = 'system') {
    const data = this.__flightHVG;
    if (!data?.enabled || this.finished || this.cinematicActive || this.respawning) return false;
    const now = performance.now();
    if (now - data.lastToggleAt < data.toggleCooldownMs) return false;
    data.lastToggleAt = now;

    if (data.state === FLIGHT_STATE.FLYING || data.state === FLIGHT_STATE.HOVER) {
      data.state = FLIGHT_STATE.GLIDING;
      data.glideUntil = now + data.glideWindowMs;
      this.game?.events?.emit('flight-state', data.state, { source });
      this.playerCue?.('FLIGHT OFF · GLIDE', '#b9f5ff');
      return true;
    }

    const energy = Number(this.energy);
    if (!Number.isFinite(energy) || energy < data.minEnergyToStart) {
      data.state = FLIGHT_STATE.DEPLETED;
      this.game?.events?.emit('flight-state', data.state, { source, reason: 'low-energy' });
      if (now - data.depletedNoticeAt > 1300) {
        data.depletedNoticeAt = now;
        this.playerCue?.('FLIGHT UNAVAILABLE · LOW ENERGY', '#ffcf82');
      }
      return false;
    }

    data.state = FLIGHT_STATE.FLYING;
    data.glideUntil = 0;
    this.player?.body?.setAllowGravity?.(false);
    this.player?.body?.setVelocityY?.(0);
    this.game?.events?.emit('flight-state', data.state, { source });
    this.game?.events?.emit('feedback', 'flight');
    this.playerCue?.('FLIGHT ONLINE · F / W S / SPACE', '#8df4ff');
    return true;
  };

  RunnerScene.prototype.setFlightHover = function (active, source = 'input') {
    const data = this.__flightHVG;
    if (!data || (data.state !== FLIGHT_STATE.FLYING && data.state !== FLIGHT_STATE.HOVER)) return false;
    data.hoverHold = Boolean(active);
    if (data.hoverHold) {
      data.state = FLIGHT_STATE.HOVER;
      this.player?.body?.setVelocityY?.(0);
    } else {
      data.state = FLIGHT_STATE.FLYING;
    }
    this.game?.events?.emit('flight-state', data.state, { source });
    return true;
  };

  RunnerScene.prototype.getFlightState = function () {
    const data = this.__flightHVG;
    if (!data) return null;
    return {
      enabled: data.enabled,
      state: data.state,
      energy: Number(this.energy) || 0,
      energyMax: Number(this.energyMax) || 0,
    };
  };

  RunnerScene.prototype.updateFlightHoverGlide = function (delta) {
    const data = this.__flightHVG;
    if (!data || !this.player?.body || !data.enabled) return;

    const body = this.player.body;
    const keyboard = this.input?.keyboard;
    const up = Boolean(keyboard?.addKey?.call(keyboard, Phaser.Input.Keyboard.KeyCodes.W)?.isDown) || keyboard?.checkDown?.(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP));
    const down = Boolean(keyboard?.addKey?.call(keyboard, Phaser.Input.Keyboard.KeyCodes.S)?.isDown) || keyboard?.checkDown?.(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN));
    const space = Boolean(keyboard?.addKey?.call(keyboard, Phaser.Input.Keyboard.KeyCodes.SPACE)?.isDown);
    const now = performance.now();

    if (data.state === FLIGHT_STATE.FLYING || data.state === FLIGHT_STATE.HOVER) {
      const drain = data.energyDrainPerSecond * Math.max(0, delta) / 1000;
      this.energy = Math.max(0, (Number(this.energy) || 0) - drain);
      this.game?.events?.emit('energy', (this.energy / Math.max(1, this.energyMax || 1)) * 100);
      if (space && !data.hoverHold) this.setFlightHover?.(true, 'keyboard');
      if (!space && data.hoverHold) this.setFlightHover?.(false, 'keyboard');

      const vertical = (up ? -1 : 0) + (down ? 1 : 0);
      body.setAllowGravity(false);
      body.setVelocityY(vertical * data.verticalSpeed);
      if (vertical === 0 || data.state === FLIGHT_STATE.HOVER) body.setVelocityY(0);
      if (this.energy <= 0) {
        data.state = FLIGHT_STATE.GLIDING;
        data.glideUntil = now + data.glideWindowMs;
        this.game?.events?.emit('flight-state', data.state, { reason: 'energy-depleted' });
        this.playerCue?.('FLIGHT ENERGY DEPLETED · GLIDE', '#ffcf82');
      }
      return;
    }

    if (data.state === FLIGHT_STATE.GLIDING) {
      body.setAllowGravity(true);
      body.gravity.y = (this.gravity ?? 720) * data.glideGravityScale;
      body.setVelocityY(Math.min(body.velocity.y, data.glideMaxFallSpeed));
      if (now >= data.glideUntil || body.blocked?.down) {
        data.state = FLIGHT_STATE.GROUNDED;
        body.setAllowGravity(true);
        this.game?.events?.emit('flight-state', data.state, { reason: 'glide-ended' });
      }
    }
  };

  RunnerScene.prototype.shutdownFlightHoverGlide = function () {
    if (this.__flightKeyDownHandler) window.removeEventListener('keydown', this.__flightKeyDownHandler, true);
    if (this.__flightKeyUpHandler) window.removeEventListener('keyup', this.__flightKeyUpHandler, true);
    this.__flightKeyDownHandler = null;
    this.__flightKeyUpHandler = null;
  };

  RunnerScene.prototype.update = function (time, delta) {
    const result = originalUpdate?.call(this, time, delta);
    this.updateFlightHoverGlide?.(delta);
    return result;
  };
}

export { installFlightHoverGlide, FLIGHT_STATE, FLIGHT_KEY };
