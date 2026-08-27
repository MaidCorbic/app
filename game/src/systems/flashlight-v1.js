const FLASHLIGHT_STATE = Object.freeze({ OFF: 'off', ON: 'on', LOW_BATTERY: 'low-battery', DEAD: 'dead' });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function installFlashlight(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__flashlightV1) return;
  RunnerScene.prototype.__flashlightV1 = true;

  RunnerScene.prototype.createFlashlight = function (config = {}) {
    const capacity = Math.max(1, Number(config.capacity ?? 100));
    const battery = clamp(Number(config.battery ?? capacity), 0, capacity);
    const lowBatteryThreshold = clamp(Number(config.lowBatteryThreshold ?? capacity * 0.2), 0, capacity);
    return {
      id: config.id || `flashlight-${Date.now()}`,
      state: battery <= 0 ? FLASHLIGHT_STATE.DEAD : FLASHLIGHT_STATE.OFF,
      battery,
      capacity,
      drainPerSecond: Math.max(0, Number(config.drainPerSecond ?? 1)),
      lowBatteryThreshold,
      baseRange: Math.max(1, Number(config.range ?? 220)),
      baseIntensity: clamp(Number(config.intensity ?? 1), 0, 1),
      enabled: config.enabled !== false,
      allowed: config.allowed !== false,
      autoActivateInDarkness: Boolean(config.autoActivateInDarkness),
      onStateChange: typeof config.onStateChange === 'function' ? config.onStateChange : null,
      onBatteryChange: typeof config.onBatteryChange === 'function' ? config.onBatteryChange : null,
      onDepleted: typeof config.onDepleted === 'function' ? config.onDepleted : null,
    };
  };

  RunnerScene.prototype.setFlashlightState = function (flashlight, state, meta = {}) {
    if (!flashlight || !Object.values(FLASHLIGHT_STATE).includes(state)) return false;
    if (!flashlight.enabled || !flashlight.allowed) state = FLASHLIGHT_STATE.OFF;
    if (flashlight.battery <= 0) state = FLASHLIGHT_STATE.DEAD;
    const previous = flashlight.state;
    flashlight.state = state;
    if (previous !== state) flashlight.onStateChange?.(state, previous, flashlight, this, meta);
    return flashlight.state;
  };

  RunnerScene.prototype.toggleFlashlight = function (flashlight, meta = {}) {
    if (!flashlight || !flashlight.enabled || !flashlight.allowed || flashlight.battery <= 0) return false;
    const next = flashlight.state === FLASHLIGHT_STATE.ON || flashlight.state === FLASHLIGHT_STATE.LOW_BATTERY
      ? FLASHLIGHT_STATE.OFF
      : (flashlight.battery <= flashlight.lowBatteryThreshold ? FLASHLIGHT_STATE.LOW_BATTERY : FLASHLIGHT_STATE.ON);
    this.setFlashlightState?.(flashlight, next, { reason: 'toggle', ...meta });
    return flashlight.state !== FLASHLIGHT_STATE.OFF;
  };

  RunnerScene.prototype.setFlashlightAllowed = function (flashlight, allowed, meta = {}) {
    if (!flashlight) return false;
    flashlight.allowed = Boolean(allowed);
    if (!flashlight.allowed) this.setFlashlightState?.(flashlight, FLASHLIGHT_STATE.OFF, { reason: 'restricted-zone', ...meta });
    return flashlight.allowed;
  };

  RunnerScene.prototype.rechargeFlashlight = function (flashlight, amount = flashlight?.capacity || 0) {
    if (!flashlight) return null;
    const previous = flashlight.battery;
    flashlight.battery = clamp(flashlight.battery + Math.max(0, Number(amount) || 0), 0, flashlight.capacity);
    if (flashlight.battery > 0 && flashlight.state === FLASHLIGHT_STATE.DEAD) this.setFlashlightState?.(flashlight, FLASHLIGHT_STATE.OFF, { reason: 'recharged' });
    flashlight.onBatteryChange?.(flashlight.battery, previous, flashlight, this);
    return this.getFlashlightState?.(flashlight);
  };

  RunnerScene.prototype.updateFlashlight = function (flashlight, deltaMs, context = {}) {
    if (!flashlight) return null;
    const seconds = Math.max(0, Number(deltaMs) || 0) / 1000;
    const darkness = clamp(Number(context.darkness ?? 0), 0, 1);
    const active = flashlight.state === FLASHLIGHT_STATE.ON || flashlight.state === FLASHLIGHT_STATE.LOW_BATTERY;

    if (flashlight.autoActivateInDarkness && darkness > 0.7 && !active && flashlight.battery > 0 && flashlight.allowed) {
      this.setFlashlightState?.(flashlight, flashlight.battery <= flashlight.lowBatteryThreshold ? FLASHLIGHT_STATE.LOW_BATTERY : FLASHLIGHT_STATE.ON, { reason: 'darkness' });
    }

    if (active && seconds > 0) {
      const previous = flashlight.battery;
      flashlight.battery = clamp(flashlight.battery - flashlight.drainPerSecond * seconds, 0, flashlight.capacity);
      if (flashlight.battery !== previous) flashlight.onBatteryChange?.(flashlight.battery, previous, flashlight, this);
      if (flashlight.battery <= 0) {
        this.setFlashlightState?.(flashlight, FLASHLIGHT_STATE.DEAD, { reason: 'depleted' });
        flashlight.onDepleted?.(flashlight, this);
      } else if (flashlight.battery <= flashlight.lowBatteryThreshold && flashlight.state === FLASHLIGHT_STATE.ON) {
        this.setFlashlightState?.(flashlight, FLASHLIGHT_STATE.LOW_BATTERY, { reason: 'low-battery' });
      }
    }
    return this.getFlashlightState?.(flashlight, context) || null;
  };

  RunnerScene.prototype.getFlashlightOutput = function (flashlight, context = {}) {
    if (!flashlight) return { active: false, range: 0, intensity: 0 };
    const darkness = clamp(Number(context.darkness ?? 0), 0, 1);
    const active = flashlight.state === FLASHLIGHT_STATE.ON || flashlight.state === FLASHLIGHT_STATE.LOW_BATTERY;
    if (!active) return { active: false, range: 0, intensity: 0, darkness };
    const batteryRatio = flashlight.capacity ? flashlight.battery / flashlight.capacity : 0;
    const lowPenalty = flashlight.state === FLASHLIGHT_STATE.LOW_BATTERY ? 0.65 : 1;
    const intensity = clamp(flashlight.baseIntensity * lowPenalty * (0.55 + batteryRatio * 0.45), 0, 1);
    return { active: true, range: flashlight.baseRange * lowPenalty, intensity, darkness };
  };

  RunnerScene.prototype.getFlashlightState = function (flashlight, context = {}) {
    if (!flashlight) return null;
    return {
      id: flashlight.id,
      state: flashlight.state,
      battery: flashlight.battery,
      capacity: flashlight.capacity,
      batteryRatio: flashlight.capacity ? flashlight.battery / flashlight.capacity : 0,
      lowBatteryThreshold: flashlight.lowBatteryThreshold,
      enabled: flashlight.enabled,
      allowed: flashlight.allowed,
      output: this.getFlashlightOutput?.(flashlight, context) || null,
    };
  };
}

export { installFlashlight, FLASHLIGHT_STATE };
