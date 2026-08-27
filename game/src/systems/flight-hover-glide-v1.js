import Phaser from 'phaser';

const FLIGHT_STATE = Object.freeze({ GROUNDED: 'grounded', FLYING: 'flying', HOVER: 'hover', GLIDING: 'gliding', DEPLETED: 'depleted' });
const FLIGHT_KEY = Phaser.Input.Keyboard.KeyCodes.F;
const MAX_DELTA_MS = 50;
const MIN_GLIDE_GRAVITY_SCALE = 0.08;
const MAX_GLIDE_GRAVITY_SCALE = 0.35;
const DEFAULT_FLIGHT_DURATION_MS = 30000;

const isFlightState = state => state === FLIGHT_STATE.FLYING || state === FLIGHT_STATE.HOVER;
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function installFlightHoverGlide(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__flightHoverGlideV1) return;
  RunnerScene.prototype.__flightHoverGlideV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate?.apply(this, args);
    const body = this.player?.body;
    this.__flightHVG = {
      enabled: this.mission?.id != null,
      state: FLIGHT_STATE.GROUNDED,
      hoverHold: false,
      flightDurationMs: DEFAULT_FLIGHT_DURATION_MS,
      flightStartedAt: 0,
      flightEndsAt: 0,
      energyDrainPerSecond: 11,
      minEnergyToStart: 8,
      verticalSpeed: 260,
      glideGravityScale: 0.16,
      glideMaxFallSpeed: 230,
      glideWindowMs: 850,
      glideUntil: 0,
      baseGravityY: finite(body?.gravity?.y, 720),
      baseAllowGravity: body?.allowGravity !== false,
      lastToggleAt: 0,
      toggleCooldownMs: 180,
      depletedNoticeAt: 0,
      lastEnergyPercent: Math.round(finite(this.energy) / Math.max(1, finite(this.energyMax, 1)) * 100),
      lastFlightSeconds: -1,
      flightWarningSent: false,
      glideGravityApplied: false,
      paused: false,
      keys: {
        up: this.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        space: this.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      },
    };

    this.__flightKeyDownHandler = event => {
      if (event.code !== 'KeyF' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target && typeof target.tagName === 'string' && /input|textarea|select|button/i.test(target.tagName)) return;
      if (!this.__flightHVG?.enabled || this.finished || this.cinematicActive || this.respawning || this.__flightHVG?.paused) return;
      event.preventDefault();
      this.toggleFlightMode?.('keyboard');
    };
    window.addEventListener('keydown', this.__flightKeyDownHandler, true);

    this.__flightPointerHandler = event => {
      if (event?.type === 'relay:toggle-flight') this.toggleFlightMode?.(event.detail?.source || 'mobile');
    };
    window.addEventListener('relay:toggle-flight', this.__flightPointerHandler);

    this.__flightPauseHandler = event => {
      if (!this.__flightHVG) return;
      this.__flightHVG.paused = Boolean(event?.detail?.paused);
      if (this.__flightHVG.paused && isFlightState(this.__flightHVG.state)) {
        this.__flightHVG.hoverHold = false;
        this.player?.body?.setVelocityY?.(0);
      }
    };
    window.addEventListener('relay:flight-pause', this.__flightPauseHandler);
    return result;
  };

  RunnerScene.prototype.emitFlightState = function (state, meta = {}) {
    const data = this.__flightHVG;
    if (!data || (data.state === state && !meta.force)) return;
    data.state = state;
    this.game?.events?.emit('flight-state', state, {
      source: meta.source || 'system',
      reason: meta.reason || null,
      remainingMs: this.getFlightRemainingMs?.() ?? 0,
    });
  };

  RunnerScene.prototype.restoreFlightBody = function () {
    const data = this.__flightHVG;
    const body = this.player?.body;
    if (!data || !body) return false;
    body.setGravityY?.(data.baseGravityY);
    body.setAllowGravity?.(data.baseAllowGravity);
    data.glideGravityApplied = false;
    return true;
  };

  RunnerScene.prototype.getFlightRemainingMs = function () {
    const data = this.__flightHVG;
    if (!data || !isFlightState(data.state)) return 0;
    return Math.max(0, data.flightEndsAt - performance.now());
  };

  RunnerScene.prototype.resetFlightState = function (reason = 'reset') {
    const data = this.__flightHVG;
    if (!data) return false;
    data.hoverHold = false;
    data.flightStartedAt = 0;
    data.flightEndsAt = 0;
    data.glideUntil = 0;
    data.flightWarningSent = false;
    data.lastFlightSeconds = -1;
    this.restoreFlightBody?.();
    this.emitFlightState?.(FLIGHT_STATE.GROUNDED, { reason, force: true });
    return true;
  };

  RunnerScene.prototype.endFlight = function (reason = 'duration-ended') {
    const data = this.__flightHVG;
    if (!data || !isFlightState(data.state)) return false;
    data.hoverHold = false;
    data.flightEndsAt = 0;
    data.glideUntil = performance.now() + data.glideWindowMs;
    data.flightWarningSent = false;
    this.emitFlightState?.(FLIGHT_STATE.GLIDING, { reason });
    this.playerCue?.(reason === 'duration-ended' ? 'FLIGHT TIME EXPIRED · GLIDE' : 'FLIGHT OFF · GLIDE', '#ffcf82');
    return true;
  };

  RunnerScene.prototype.toggleFlightMode = function (source = 'system') {
    const data = this.__flightHVG;
    const body = this.player?.body;
    if (!data?.enabled || !body || data.paused || this.finished || this.cinematicActive || this.respawning || this.scene?.isPaused?.()) return false;
    const now = performance.now();
    if (now - data.lastToggleAt < data.toggleCooldownMs) return false;
    data.lastToggleAt = now;

    if (isFlightState(data.state)) {
      return this.endFlight?.('manual-off') ?? false;
    }

    const energy = finite(this.energy);
    if (energy < data.minEnergyToStart) {
      this.emitFlightState?.(FLIGHT_STATE.DEPLETED, { source, reason: 'low-energy' });
      if (now - data.depletedNoticeAt > 1300) {
        data.depletedNoticeAt = now;
        this.playerCue?.('FLIGHT UNAVAILABLE · LOW ENERGY', '#ffcf82');
      }
      return false;
    }

    data.baseGravityY = finite(body.gravity?.y, data.baseGravityY);
    data.baseAllowGravity = body.allowGravity !== false;
    data.flightStartedAt = now;
    data.flightEndsAt = now + data.flightDurationMs;
    data.lastFlightSeconds = Math.ceil(data.flightDurationMs / 1000);
    data.flightWarningSent = false;
    data.hoverHold = false;
    data.glideUntil = 0;
    body.setGravityY?.(data.baseGravityY);
    body.setAllowGravity?.(false);
    body.setVelocityY?.(0);
    this.emitFlightState?.(FLIGHT_STATE.FLYING, { source, reason: 'manual-on' });
    this.game?.events?.emit('feedback', 'flight');
    this.playerCue?.('FLIGHT ONLINE · 30 SEC · F / W S / SPACE', '#8df4ff');
    return true;
  };

  RunnerScene.prototype.setFlightHover = function (active, source = 'input') {
    const data = this.__flightHVG;
    const body = this.player?.body;
    if (!data || !body || data.paused || !isFlightState(data.state)) return false;
    const next = Boolean(active);
    if (next === data.hoverHold) return true;
    data.hoverHold = next;
    this.emitFlightState?.(next ? FLIGHT_STATE.HOVER : FLIGHT_STATE.FLYING, { source, reason: next ? 'hover-start' : 'hover-release' });
    if (next) body.setVelocityY?.(0);
    return true;
  };

  RunnerScene.prototype.getFlightState = function () {
    const data = this.__flightHVG;
    if (!data) return null;
    const energyMax = Math.max(0, finite(this.energyMax));
    const energy = Math.max(0, finite(this.energy));
    const remainingMs = this.getFlightRemainingMs?.() || 0;
    return {
      enabled: data.enabled,
      state: data.state,
      energy,
      energyMax,
      energyRatio: energyMax > 0 ? energy / energyMax : 0,
      remainingMs,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      durationMs: data.flightDurationMs,
      paused: Boolean(data.paused),
    };
  };

  RunnerScene.prototype.publishFlightEnergy = function () {
    const data = this.__flightHVG;
    if (!data) return;
    const maxEnergy = Math.max(1, finite(this.energyMax, 1));
    const percent = Math.max(0, Math.min(100, Math.round(finite(this.energy) / maxEnergy * 100)));
    if (data.lastEnergyPercent === percent) return;
    data.lastEnergyPercent = percent;
    this.game?.events?.emit('energy', percent);
    this.game?.events?.emit('flight-energy', { value: Math.max(0, finite(this.energy)), max: maxEnergy, percent });
  };

  RunnerScene.prototype.publishFlightTimer = function () {
    const data = this.__flightHVG;
    if (!data || !isFlightState(data.state)) return;
    const remainingMs = Math.max(0, data.flightEndsAt - performance.now());
    const seconds = Math.ceil(remainingMs / 1000);
    if (seconds === data.lastFlightSeconds) return;
    data.lastFlightSeconds = seconds;
    this.game?.events?.emit('flight-timer', { remainingMs, seconds, durationMs: data.flightDurationMs });
    if (seconds <= 5 && seconds > 0 && !data.flightWarningSent) {
      data.flightWarningSent = true;
      this.playerCue?.(`FLIGHT ${seconds} SEC`, '#ffcf82');
    }
  };

  RunnerScene.prototype.updateFlightHoverGlide = function (delta) {
    const data = this.__flightHVG;
    const body = this.player?.body;
    if (!data?.enabled || !body || data.paused || this.finished || this.respawning || this.scene?.isPaused?.()) return;

    const dt = Math.min(MAX_DELTA_MS, Math.max(0, finite(delta)));
    const now = performance.now();

    if (isFlightState(data.state)) {
      if (data.flightEndsAt > 0 && now >= data.flightEndsAt) {
        this.endFlight?.('duration-ended');
        return;
      }

      this.energy = Math.max(0, finite(this.energy) - data.energyDrainPerSecond * dt / 1000);
      this.publishFlightEnergy?.();
      this.publishFlightTimer?.();

      if (this.energy <= 0) {
        this.endFlight?.('energy-depleted');
        return;
      }

      const keys = data.keys || {};
      const up = Boolean(keys.up?.isDown);
      const down = Boolean(keys.down?.isDown);
      const space = Boolean(keys.space?.isDown);
      if (space !== data.hoverHold) this.setFlightHover?.(space, 'keyboard');

      body.setAllowGravity?.(false);
      const vertical = (up ? -1 : 0) + (down ? 1 : 0);
      body.setVelocityY?.(data.state === FLIGHT_STATE.HOVER || vertical === 0 ? 0 : vertical * data.verticalSpeed);
      return;
    }

    if (data.state === FLIGHT_STATE.GLIDING) {
      if (!data.glideGravityApplied) {
        body.setAllowGravity?.(true);
        const scale = Math.max(MIN_GLIDE_GRAVITY_SCALE, Math.min(MAX_GLIDE_GRAVITY_SCALE, finite(data.glideGravityScale, 0.16)));
        body.setGravityY?.(data.baseGravityY * scale);
        data.glideGravityApplied = true;
      }
      const maxFall = Math.max(0, finite(data.glideMaxFallSpeed, 230));
      body.setVelocityY?.(Math.min(finite(body.velocity?.y), maxFall));
      if (now >= data.glideUntil || body.blocked?.down || body.touching?.down) {
        this.emitFlightState?.(FLIGHT_STATE.GROUNDED, { reason: 'glide-ended' });
        this.restoreFlightBody?.();
      }
      return;
    }

    if (data.state === FLIGHT_STATE.DEPLETED && finite(this.energy) >= data.minEnergyToStart) {
      this.emitFlightState?.(FLIGHT_STATE.GROUNDED, { reason: 'energy-recovered' });
    }
  };

  RunnerScene.prototype.shutdownFlightHoverGlide = function () {
    this.restoreFlightBody?.();
    if (this.__flightKeyDownHandler) window.removeEventListener('keydown', this.__flightKeyDownHandler, true);
    if (this.__flightPointerHandler) window.removeEventListener('relay:toggle-flight', this.__flightPointerHandler);
    if (this.__flightPauseHandler) window.removeEventListener('relay:flight-pause', this.__flightPauseHandler);
    this.__flightKeyDownHandler = null;
    this.__flightPointerHandler = null;
    this.__flightPauseHandler = null;
  };

  RunnerScene.prototype.destroyFlightHoverGlide = function () {
    this.shutdownFlightHoverGlide?.();
    this.__flightHVG = null;
  };

  RunnerScene.prototype.update = function (time, delta) {
    const result = originalUpdate?.call(this, time, delta);
    this.updateFlightHoverGlide?.(delta);
    return result;
  };
}

export { installFlightHoverGlide, FLIGHT_STATE, FLIGHT_KEY, DEFAULT_FLIGHT_DURATION_MS };