const GATE_COLOR = 0x142b45;
const GATE_STROKE = 0x8df4ff;

function installLockedGate(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__lockedGateV1) return;
  RunnerScene.prototype.__lockedGateV1 = true;

  RunnerScene.prototype.createLockedGate = function (zone, config = {}) {
    if (!zone || !this.add) return null;

    const width = Number(config.width || zone.width || 64);
    const height = Number(config.height || zone.height || 120);
    const gate = this.add.rectangle(
      Number(config.x ?? zone.x ?? 0),
      Number(config.y ?? zone.y ?? 0),
      width,
      height,
      GATE_COLOR,
      0.96,
    );

    gate.setStrokeStyle(3, GATE_STROKE, 0.9);
    gate.setDepth(Number(config.depth ?? 900));
    gate.__relayLockedGate = true;
    gate.__relayZone = zone;

    if (this.physics?.add?.existing) {
      this.physics.add.existing(gate, true);
      gate.body.setSize(width, height, true);
    }

    zone.gate = gate;
    zone.gateOpen = false;
    return gate;
  };

  RunnerScene.prototype.openLockedGate = function (zone, puzzle) {
    if (!zone || !zone.gate || !this.isPuzzleSolved?.(puzzle)) return false;
    if (!this.unlockZoneWithPuzzle?.(zone, puzzle)) return false;

    const gate = zone.gate;
    gate.body?.checkCollision && (gate.body.checkCollision.none = true);
    gate.body?.enable && (gate.body.enable = false);
    gate.disableInteractive?.();
    gate.setVisible(false);
    zone.gateOpen = true;
    return true;
  };

  RunnerScene.prototype.closeLockedGate = function (zone) {
    if (!zone?.gate || zone.gateOpen) return false;
    zone.gate.setVisible(true);
    if (zone.gate.body) {
      zone.gate.body.enable = true;
      zone.gate.body.checkCollision.none = false;
    }
    return true;
  };
}

export { installLockedGate };
