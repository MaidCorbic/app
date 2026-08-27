function installFlightHudBridge(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__flightHudBridgeV1) return;
  RunnerScene.prototype.__flightHudBridgeV1 = true;

  const dispatch = scene => {
    const current = scene?.getFlightState?.();
    if (!current) return;
    const max = Math.max(1, Number(current.energyMax) || 1);
    window.dispatchEvent(new CustomEvent('relay:flight-state', {
      detail: {
        state: current.state || 'off',
        energy: Number(current.energy) || 0,
        energyRatio: Math.max(0, Math.min(1, (Number(current.energy) || 0) / max)),
        remainingMs: Math.max(0, Number(current.remainingMs) || 0),
        remainingSeconds: Math.max(0, Number(current.remainingSeconds) || 0),
        durationMs: Math.max(0, Number(current.durationMs) || 0),
      },
    }));
  };

  const bind = scene => {
    const events = scene?.game?.events;
    if (!events?.on || scene.__flightHudBound) return;
    scene.__flightHudBound = true;
    scene.__flightHudStateHandler = () => dispatch(scene);
    scene.__flightHudEnergyHandler = () => dispatch(scene);
    scene.__flightHudTimerHandler = () => dispatch(scene);
    events.on('flight-state', scene.__flightHudStateHandler);
    events.on('flight-energy', scene.__flightHudEnergyHandler);
    events.on('flight-timer', scene.__flightHudTimerHandler);
    dispatch(scene);
  };

  const originalCreate = RunnerScene.prototype.create;
  if (typeof originalCreate === 'function' && !originalCreate.__flightHudBridgeWrapped) {
    const wrapped = function (...args) {
      const result = originalCreate.apply(this, args);
      bind(this);
      return result;
    };
    wrapped.__flightHudBridgeWrapped = true;
    RunnerScene.prototype.create = wrapped;
  }

  const originalShutdown = RunnerScene.prototype.shutdown;
  if (typeof originalShutdown === 'function' && !originalShutdown.__flightHudBridgeWrapped) {
    const wrappedShutdown = function (...args) {
      const events = this.game?.events;
      if (events?.off && this.__flightHudBound) {
        events.off('flight-state', this.__flightHudStateHandler);
        events.off('flight-energy', this.__flightHudEnergyHandler);
        events.off('flight-timer', this.__flightHudTimerHandler);
      }
      this.__flightHudBound = false;
      this.__flightHudStateHandler = null;
      this.__flightHudEnergyHandler = null;
      this.__flightHudTimerHandler = null;
      return originalShutdown.apply(this, args);
    };
    wrappedShutdown.__flightHudBridgeWrapped = true;
    RunnerScene.prototype.shutdown = wrappedShutdown;
  }
}

export { installFlightHudBridge };