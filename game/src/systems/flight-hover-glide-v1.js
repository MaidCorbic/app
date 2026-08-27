import Phaser from 'phaser';

const FLIGHT_STATE = Object.freeze({ GROUNDED: 'grounded', FLYING: 'flying', HOVER: 'hover', GLIDING: 'gliding', DEPLETED: 'depleted' });
const FLIGHT_KEY = Phaser.Input.Keyboard.KeyCodes.F;

function installFlightHoverGlide(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__flightHoverGlideV1) return;
  RunnerScene.prototype.__flightHoverGlideV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate?.apply(this, args);
    const playerBody = this.player?.body;
    this.__flightHVG = {
      enabled: this.mission?.id != null,
      state: FLIGHT_STATE.GROUNDED,
      hoverHold: false,
      energyDrainPerSecond: 11,
      minEnergyToStart: 8,
      verticalSpeed: 260,
      glideGravityScale: 0.16,
      glideMaxFallSpeed: 230,
      glideWindowMs: 850,
      glideUntil: 0,
      baseGravityY: Number(playerBody?.gravity?.y) || 720,
      lastToggleAt: 0,
      toggleCooldownMs: 180,
      depletedNoticeAt: 0,
      keys: {
        up: this.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        space: this.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      },
    };

    this.__flightKeyDownHandler = event => {
      if (event.keyCode !== FLIGHT_KEY || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && /input|textarea|select/i.test(event.target.tagName)) return;
      this.toggleFlightMode?.('keyboard');
    };
    window.addEventListener('keydown', this.__flightKeyDownHandler, true);

    this.__flightPointerHandler = event => {
      if (event.type === 'relay:toggle-flight') this.toggleFlightMode?.(event.detail?.source || 'mobile');
    };
    window.addEventListener('relay:toggle-flight', this.__flightPointerHandler);
    return result;
  };

  RunnerScene.prototype.toggleFlightMode = function (source = 'system') {
    const data = this.__flightHVG;
    if (!data?.enabled || this.finished || this.cinematicActive || this.respawning) return false;
    const now = performance.now();
    if (now - data.lastToggleAt < data.toggleCooldownMs) return false;
    data.lastToggleAt = now;

    if (data.state === FLIGHT_STATE.FLYING || data.state === FLIGHT_STATE.HOVER) {
      data.hoverHold = false;
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
    data.hoverHold = false;
    data.glideUntil = 0;
    data.baseGravityY = Number(this.player?.body?.gravity?.y) || data.baseGravityY || 720;
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
    data.state = data.hoverHold ? FLIGHT_STATE.HOVER : FLIGHT_STATE.FLYING;
    if (data.hoverHold) this.player?.body?.setVelocityY?.(0);
    this.game?.events?.emit('flight-state', data.state, { source });
    return true;
  };

  RunnerScene.prototype.getFlightState = function () {
    const data = this.__flightHVG;
    if (!data) return null;
    return { enabled: data.enabled, state: data.state, energy: Number(this.energy) || 0, energyMax: Number(this.energyMax) || 0 };
  };

  RunnerScene.prototype.updateFlightHoverGlide = function (delta) {
    const data = this.__flightHVG;
    const body = this.player?.body;
    if (!data?.enabled || !body || this.finished || this.respawning) return;

    const now = performance.now();
    const keys = data.keys || {};

    if (data.state === FLIGHT_STATE.FLYING || data.state === FLIGHT_STATE.HOVER) {
      const drain = data.energyDrainPerSecond * Math.max(0, Number(delta) || 0) / 1000;
      this.energy = Math.max(0, (Number(this.energy) || 0) - drain);
      this.game?.events?.emit('energy', (this.energy / Math.max(1, Number(this.energyMax) || 1)) * 100);

      const up = Boolean(keys.up?.isDown);
      const down = Boolean(keys.down?.isDown);
      const space = Boolean(keys.space?.isDown);
      body.setAllowGravity(false);

      if (space && !data.hoverHold) this.setFlightHover?.(true, 'keyboard');
      else if (!space && data.hoverHold) this.setFlightHover?.(false, 'keyboard');

      const vertical = (up ? -1 : 0) + (down ? 1 : 0);
      body.setVelocityY(data.state === FLIGHT_STATE.HOVER || vertical === 0 ? 0 : vertical * data.verticalSpeed);

      if (this.energy <= 0) {
        data.hoverHold = false;
        data.state = FLIGHT_STATE.GLIDING;
        data.glideUntil = now + data.glideWindowMs;
        this.game?.events?.emit('flight-state', data.state, { reason: 'energy-depleted' });
        this.playerCue?.('FLIGHT ENERGY DEPLETED · GLIDE', '#ffcf82');
      }
      return;
    }

    if (data.state === FLIGHT_STATE.GLIDING) {
      body.setAllowGravity(true);
      body.setGravityY?.(data.baseGravityY * data.glideGravityScale);
      body.setVelocityY(Math.min(body.velocity.y, data.glideMaxFallSpeed));
      if (now >= data.glideUntil || body.blocked?.down || body.touching?.down) {
        data.state = FLIGHT_STATE.GROUNDED;
        body.setGravityY?.(data.baseGravityY);
        this.game?.events?.emit('flight-state', data.state, { reason: 'glide-ended' });
      }
    }
  };

  RunnerScene.prototype.shutdownFlightHoverGlide = function () {
    if (this.__flightKeyDownHandler) window.removeEventListener('keydown', this.__flightKeyDownHandler, true);
    if (this.__flightPointerHandler) window.removeEventListener('relay:toggle-flight', this.__flightPointerHandler);
    this.__flightKeyDownHandler = null;
    this.__flightPointerHandler = null;
  };

  RunnerScene.prototype.update = function (time, delta) {
    const result = originalUpdate?.call(this, time, delta);
    this.updateFlightHoverGlide?.(delta);
    return result;
  };
}

export { installFlightHoverGlide, FLIGHT_STATE, FLIGHT_KEY };
