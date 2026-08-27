export function patchRespawnTransientState(code) {
  const marker = '  respawnCheckpoint() {';
  if (!code.includes(marker) || code.includes('resetTransientRespawnState() {')) return code;

  const resetMethod = `  resetTransientRespawnState() {
    this.alarmTimer = 0;
    this.empTimer = 0;
    this.decoyTimer = 0;
    this.boosterTimer = 0;
    this.comboTimer = 0;
    this.combatCombo = 0;
    this.blasterCooldown = 0;
    this.swordCooldown = 0;
    this.vaultCooldown = 0;
    this.boostCooldown = 0;
    this.lowEnergyCueTimer = 0;
    this.slideTimer = 0;
    this.airDashUsed = false;
    this.gadgetCooldowns = [0, 0];
    this.buildCooldowns = [0, 0];
    this.chaseSection = -1;
    if (this.chaser) {
      this.chaser.setVisible(false);
      this.chaser.body?.setEnable(false);
    }
    [this.eggs, this.comets, this.kineticBalls, this.plasma, this.turrets, this.shields, this.springPads]
      .forEach(group => group?.getChildren?.().forEach(entity => entity.active && entity.destroy()));
    this.decoyBeacon?.destroy();
    this.decoyBeacon = null;
    this.boosterAura?.destroy();
    this.boosterAura = null;
  }

`;

  let transformed = code.replace(marker, resetMethod + marker.replace('{', '{\n    this.resetTransientRespawnState();'));
  return transformed;
}
