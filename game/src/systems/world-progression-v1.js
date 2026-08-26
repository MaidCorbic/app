const WORLD_ZONES = [
  { id: 'zone-1', order: 1, requires: null },
  { id: 'zone-2', order: 2, requires: 'zone-1' },
  { id: 'zone-3', order: 3, requires: 'zone-2' },
  { id: 'zone-4', order: 4, requires: 'zone-3' },
];

function installWorldProgression(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__worldProgressionV1) return;
  RunnerScene.prototype.__worldProgressionV1 = true;

  RunnerScene.prototype.getWorldProgression = function () {
    if (!this.__worldProgression) {
      this.__worldProgression = {
        completed: new Set(),
        unlocked: new Set(['zone-1']),
      };
    }
    return this.__worldProgression;
  };

  RunnerScene.prototype.isWorldZoneUnlocked = function (zoneId) {
    return this.getWorldProgression().unlocked.has(zoneId);
  };

  RunnerScene.prototype.completeWorldZone = function (zoneId) {
    const zone = WORLD_ZONES.find(item => item.id === zoneId);
    if (!zone || !this.isWorldZoneUnlocked(zoneId)) return false;

    const state = this.getWorldProgression();
    state.completed.add(zoneId);

    const next = WORLD_ZONES.find(item => item.requires === zoneId);
    if (next) state.unlocked.add(next.id);
    return true;
  };

  RunnerScene.prototype.getNextWorldZone = function (zoneId) {
    return WORLD_ZONES.find(item => item.requires === zoneId) || null;
  };

  RunnerScene.prototype.getWorldZoneState = function (zoneId) {
    const state = this.getWorldProgression();
    return {
      zoneId,
      unlocked: state.unlocked.has(zoneId),
      completed: state.completed.has(zoneId),
    };
  };
}

export { installWorldProgression };
