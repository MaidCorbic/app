export function patchInitialSpawnShield(code) {
  const importLine = "import { SPAWN_SHIELD_MS } from './src/config/gameplay-timing.js';\n";
  if (!code.includes(importLine)) code = importLine + code;

  const marker = 'this.createPlayer(); this.healthInvulnerable = 1600; const spawnShield = this.add.circle(this.player.x, this.player.y, 24, 0x8df4ff, .22).setDepth(11); this.tweens.add({ targets: spawnShield, scale: 2.6, alpha: 0, duration: 1600, onComplete: () => spawnShield.destroy() });';
  const replacement = 'this.createPlayer(); this.healthInvulnerable = SPAWN_SHIELD_MS; this.respawnGrace = SPAWN_SHIELD_MS; const spawnShield = this.add.circle(this.player.x, this.player.y, 24, 0x8df4ff, .22).setDepth(11); this.tweens.add({ targets: spawnShield, scale: 2.6, alpha: 0, duration: SPAWN_SHIELD_MS, onComplete: () => spawnShield.destroy() });';
  return code.includes(marker) ? code.replace(marker, replacement) : code;
}
