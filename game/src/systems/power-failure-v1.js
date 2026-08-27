const POWER_STATE = Object.freeze({ ON: 'on', OFF: 'off', RESTORING: 'restoring', CRITICAL: 'critical' });

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function installPowerFailure(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__powerFailureV1) return;
  RunnerScene.prototype.__powerFailureV1 = true;

  RunnerScene.prototype.createPowerGrid = function (config = {}) {
    return {
      id: config.id || `grid-${Date.now()}`,
      state: config.powered === false ? POWER_STATE.OFF : POWER_STATE.ON,
      sectors: new Map(),
      faults: new Map(),
      history: [],
      restoreOrder: Array.isArray(config.restoreOrder) ? [...config.restoreOrder] : [],
      onStateChange: typeof config.onStateChange === 'function' ? config.onStateChange : null,
      onSectorRestored: typeof config.onSectorRestored === 'function' ? config.onSectorRestored : null,
      onFullyRestored: typeof config.onFullyRestored === 'function' ? config.onFullyRestored : null,
    };
  };

  RunnerScene.prototype.registerPowerSector = function (grid, sectorId, config = {}) {
    if (!grid || !sectorId || grid.sectors.has(sectorId)) return null;
    const sector = {
      id: sectorId,
      label: config.label || sectorId,
      powered: config.powered !== false,
      darkness: clamp(Number(config.darkness ?? 0.9), 0, 1),
      critical: Boolean(config.critical),
      restoreRequirements: Math.max(1, Number(config.restoreRequirements ?? 1)),
      repairs: 0,
      locked: Boolean(config.locked),
      dependencies: Array.isArray(config.dependencies) ? [...new Set(config.dependencies)] : [],
    };
    grid.sectors.set(sectorId, sector);
    return sector;
  };

  RunnerScene.prototype.registerPowerFault = function (grid, faultId, config = {}) {
    if (!grid || !faultId || grid.faults.has(faultId)) return null;
    const fault = {
      id: faultId,
      sectorId: config.sectorId || null,
      type: config.type || 'wire',
      severity: clamp(Number(config.severity ?? 1), 1, 5),
      resolved: false,
      requiredActions: Math.max(1, Number(config.requiredActions ?? 1)),
      actions: 0,
      hint: config.hint || null,
    };
    grid.faults.set(faultId, fault);
    return fault;
  };

  RunnerScene.prototype.setPowerState = function (grid, state, meta = {}) {
    if (!grid || !Object.values(POWER_STATE).includes(state)) return false;
    grid.state = state;
    grid.history.push({ state, at: Date.now(), reason: meta.reason || null });
    const powered = state === POWER_STATE.ON;
    if (state === POWER_STATE.ON || state === POWER_STATE.OFF) {
      grid.sectors.forEach(sector => { sector.powered = powered; });
    }
    grid.onStateChange?.(state, grid, this, meta);
    return true;
  };

  RunnerScene.prototype.failPower = function (grid, options = {}) {
    if (!grid) return false;
    const critical = Boolean(options.critical);
    const state = critical ? POWER_STATE.CRITICAL : POWER_STATE.OFF;
    return this.setPowerState(grid, state, { reason: options.reason || 'power-failure' });
  };

  RunnerScene.prototype.beginPowerRestore = function (grid) {
    if (!grid || grid.state === POWER_STATE.ON) return false;
    return this.setPowerState(grid, POWER_STATE.RESTORING, { reason: 'repair-started' });
  };

  RunnerScene.prototype.canRestorePowerSector = function (grid, sectorId) {
    const sector = grid?.sectors?.get(sectorId);
    if (!sector || sector.powered || sector.locked) return false;
    return sector.dependencies.every(id => grid.sectors.get(id)?.powered);
  };

  RunnerScene.prototype.resolvePowerFault = function (grid, faultId, amount = 1) {
    const fault = grid?.faults?.get(faultId);
    if (!fault || fault.resolved) return { changed: false, resolved: false, fault };
    fault.actions = Math.min(fault.requiredActions, fault.actions + Math.max(0, Number(amount) || 0));
    fault.resolved = fault.actions >= fault.requiredActions;
    return { changed: true, resolved: fault.resolved, progress: fault.actions / fault.requiredActions, fault };
  };

  RunnerScene.prototype.repairPowerSector = function (grid, sectorId, amount = 1) {
    const sector = grid?.sectors?.get(sectorId);
    if (!sector || sector.powered || !this.canRestorePowerSector?.(grid, sectorId)) {
      return { changed: false, restored: false, reason: 'unavailable', sector };
    }
    const unresolvedFault = [...grid.faults.values()].some(fault => fault.sectorId === sectorId && !fault.resolved);
    if (unresolvedFault) return { changed: false, restored: false, reason: 'fault-pending', sector };

    sector.repairs = Math.min(sector.restoreRequirements, sector.repairs + Math.max(0, Number(amount) || 0));
    const restored = sector.repairs >= sector.restoreRequirements;
    if (restored) {
      sector.powered = true;
      grid.onSectorRestored?.(sector, grid, this);
    }
    const allPowered = grid.sectors.size > 0 && [...grid.sectors.values()].every(item => item.powered);
    if (allPowered) {
      this.setPowerState?.(grid, POWER_STATE.ON, { reason: 'all-sectors-restored' });
      grid.onFullyRestored?.(grid, this);
    }
    return { changed: true, restored, allPowered, reason: null, sector };
  };

  RunnerScene.prototype.getNextPowerObjective = function (grid) {
    if (!grid) return null;
    const ordered = grid.restoreOrder.length ? grid.restoreOrder : [...grid.sectors.keys()];
    for (const sectorId of ordered) {
      const sector = grid.sectors.get(sectorId);
      if (!sector || sector.powered) continue;
      const faults = [...grid.faults.values()].filter(fault => fault.sectorId === sectorId && !fault.resolved);
      if (faults.length) return { type: 'fault', sectorId, faultId: faults[0].id, hint: faults[0].hint };
      if (this.canRestorePowerSector?.(grid, sectorId)) return { type: 'repair', sectorId, progress: sector.repairs / sector.restoreRequirements };
      return { type: 'dependency', sectorId, dependencies: sector.dependencies.filter(id => !grid.sectors.get(id)?.powered) };
    }
    return grid.state === POWER_STATE.ON ? { type: 'complete' } : null;
  };

  RunnerScene.prototype.getPowerDarkness = function (grid, sectorId = null) {
    if (!grid) return 0;
    if (!sectorId) return grid.state === POWER_STATE.ON ? 0 : 0.95;
    const sector = grid.sectors.get(sectorId);
    if (!sector) return grid.state === POWER_STATE.ON ? 0 : 0.95;
    return sector.powered ? 0 : sector.darkness;
  };

  RunnerScene.prototype.getPowerState = function (grid) {
    if (!grid) return null;
    return {
      id: grid.id,
      state: grid.state,
      objective: this.getNextPowerObjective?.(grid) || null,
      sectors: [...grid.sectors.values()].map(({ id, label, powered, darkness, critical, repairs, restoreRequirements, locked, dependencies }) => ({ id, label, powered, darkness, critical, repairs, restoreRequirements, locked, dependencies })),
      faults: [...grid.faults.values()].map(({ id, sectorId, type, severity, resolved, actions, requiredActions, hint }) => ({ id, sectorId, type, severity, resolved, actions, requiredActions, hint })),
      history: [...grid.history],
    };
  };
}

export { installPowerFailure, POWER_STATE };
