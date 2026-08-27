function installFlightHudBridge(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__flightHudBridgeV1) return;
  RunnerScene.prototype.__flightHudBridgeV1 = true;

  const bind = scene => {
    const game = scene?.game;
    if (!game?.events?.on || scene.__flightHudBound) return;
    scene.__flightHudBound = true;
    game.events.on('flight-state', state => {
      const current = scene.getFlightState?.() || {};
      window.dispatchEvent(new CustomEvent('relay:flight-state', {
        detail: {
          state,
          energy: Number(current.energy) || 0,
          energyRatio: Number(current.energyMax) > 0 ? Number(current.energy) / Number(current.energyMax) : 0,
        },
      }));
    });
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
}

export { installFlightHudBridge };
