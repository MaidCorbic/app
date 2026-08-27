const POWER_STATE = Object.freeze({ ON: 'on', OFF: 'off', RESTORING: 'restoring' });

function installPowerFailure(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__powerFailureV1) return;
  RunnerScene.prototype.__powerFailureV1 = true;

  RunnerScene.prototype.createPowerGrid = function (config = {}) {
    return {
      id: config.id || `grid-${Date.now()}`,
      state: config.powered === false ? POWER_STATE.OFF : POWER_STATE.ON,
      sectors: new Map(),
      onStateChange: typeof config.onStateChange === 'function' ? config.onStateChange : null,
    };
  };

  RunnerScene.prototype.registerPowerSector = function (grid, sectorId, config = {}) {
    if (!grid || !sectorId) return null;
    const sector = {
      id: sectorId,
      powered: config.powered !== false,
      darkness: Math.max(0, Math.min(1, Number(config.darkness ?? 0.9))),
      restoreRequirements: Math.max(1, Number(config.restoreRequirements ?? 1)),
      repairs: 0,
    };
    grid.sectors.set(sectorId, sector);
    return sector;
  };

  RunnerScene.prototype.setPowerState = function (grid, state) {
    if (!grid || !Object.values(POWER_STATE).includes(state)) return false;
    grid.state = state;
    const powered = state === POWER_STATE.ON;
    if (state !== POWER_STATE.RESTORING) {
      grid.sectors.forEach(sector => { sector.powered = powered; });
    }
    grid.onStateChange?.(state, grid, this);
    return true;
  };

  RunnerScene.prototype.failPower = function (grid) {
    return this.setPowerState?.(grid, POWER_STATE.OFF) ?? false;
  };

  RunnerScene.prototype.beginPowerRestore = function (grid) {
    return this.setPowerState?.(grid, POWER_STATE.RESTORING) ?? false;
  };

  RunnerScene.prototype.repairPowerSector = function (grid, sectorId, amount = 1) {
    const sector = grid?.sectors?.get(sectorId);
    if (!sector || sector.powered) return { changed: false, restored: false, sector };
    sector.repairs = Math.min(sector.restoreRequirements, sector.repairs + Math.max(0, Number(amount) || 0));
    const restored = sector.repairs >= sector.restoreRequirements;
    if (restored) sector.powered = true;
    const allPowered = [...grid.sectors.values()].every(item => item.powered);
    if (allPowered) this.setPowerState?.(grid, POWER_STATE.ON);
    return { changed: true, restored, allPowered, sector };
  };

  RunnerScene.prototype.getPowerState = function (grid) {
    if (!grid) return null;
    return {
      id: grid.id,
      state: grid.state,
      sectors: [...grid.sectors.values()].map(({ id, powered, darkness, repairs, restoreRequirements }) => ({ id, powered, darkness, repairs, restoreRequirements })),
    };
  };
}

export { installPowerFailure, POWER_STATE };
