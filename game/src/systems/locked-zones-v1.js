const LOCKED_ZONE_DISTANCE = 110;

function installLockedZones(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__lockedZonesV1) return;
  RunnerScene.prototype.__lockedZonesV1 = true;

  RunnerScene.prototype.createLockedZone = function (config = {}) {
    return {
      id: config.id || `zone-${Date.now()}`,
      x: Number(config.x || 0),
      y: Number(config.y || 0),
      width: Number(config.width || 64),
      height: Number(config.height || 120),
      puzzle: config.puzzle || null,
      locked: config.locked !== false,
      opened: false,
    };
  };

  RunnerScene.prototype.isLockedZoneOpen = function (zone) {
    return Boolean(zone?.opened);
  };

  RunnerScene.prototype.unlockZoneWithPuzzle = function (zone, puzzle) {
    if (!zone || !puzzle || !this.isPuzzleSolved?.(puzzle)) return false;
    if (zone.puzzle && zone.puzzle.id && zone.puzzle.id !== puzzle.id) return false;
    zone.opened = true;
    zone.locked = false;
    return true;
  };

  RunnerScene.prototype.canEnterLockedZone = function (zone) {
    return Boolean(zone && !zone.locked && zone.opened);
  };

  RunnerScene.prototype.getLockedZoneDistance = function (zone) {
    if (!zone || !this.player) return Infinity;
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
  };

  RunnerScene.prototype.isNearLockedZone = function (zone) {
    return this.getLockedZoneDistance(zone) <= LOCKED_ZONE_DISTANCE;
  };
}

export { installLockedZones };
