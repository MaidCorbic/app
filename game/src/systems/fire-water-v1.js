const FIRE_STATE = Object.freeze({ BURNING: 'burning', EXTINGUISHED: 'extinguished' });

function installFireWater(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__fireWaterV1) return;
  RunnerScene.prototype.__fireWaterV1 = true;

  RunnerScene.prototype.createFireZone = function (config = {}) {
    return {
      id: config.id || `fire-${Date.now()}`,
      x: Number(config.x || 0), y: Number(config.y || 0),
      radius: Math.max(8, Number(config.radius || 72)),
      requiredWater: Math.max(1, Number(config.requiredWater || 3)),
      waterApplied: 0,
      state: FIRE_STATE.BURNING,
      blocked: true,
      onExtinguish: typeof config.onExtinguish === 'function' ? config.onExtinguish : null,
    };
  };

  RunnerScene.prototype.isFireActive = function (fire) {
    return Boolean(fire && fire.state === FIRE_STATE.BURNING);
  };

  RunnerScene.prototype.applyWaterToFire = function (fire, amount = 1) {
    if (!this.isFireActive?.(fire)) return { changed: false, extinguished: false, fire };
    fire.waterApplied = Math.min(fire.requiredWater, fire.waterApplied + Math.max(0, Number(amount) || 0));
    const extinguished = fire.waterApplied >= fire.requiredWater;
    if (extinguished) {
      fire.state = FIRE_STATE.EXTINGUISHED;
      fire.blocked = false;
      fire.onExtinguish?.(fire, this);
    }
    return { changed: true, extinguished, progress: fire.waterApplied / fire.requiredWater, fire };
  };

  RunnerScene.prototype.getFireWaterState = function (fire) {
    if (!fire) return null;
    return { id: fire.id, state: fire.state, blocked: fire.blocked, waterApplied: fire.waterApplied, requiredWater: fire.requiredWater, progress: fire.waterApplied / fire.requiredWater };
  };

  RunnerScene.prototype.canPassFireZone = function (fire) {
    return Boolean(fire && !fire.blocked && fire.state === FIRE_STATE.EXTINGUISHED);
  };
}

export { installFireWater, FIRE_STATE };
