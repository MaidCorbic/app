// Water survival: stylized water volumes, oxygen/death state, and shark hazard.
// Uses the existing RunnerScene fail/respawn flow; no HUD is added.
const WATER_LEVEL = 700;
const AIR_MS = 4200;
const SHARK_DELAY_MS = 900;
const SHARK_SPEED = 260;

export function installWaterSurvival(RunnerScene) {
  if (RunnerScene.prototype.__relayWaterSurvivalInstalled) return;
  RunnerScene.prototype.__relayWaterSurvivalInstalled = true;
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function waterCreate(...args) {
    const result = originalCreate.apply(this, args);
    this.__waterSurvival = { active: false, enteredAt: 0, lastCueAt: 0, shark: null };
    const width = Math.max(this.worldWidth || 6280, this.scale.width || 1280);
    this.__waterVisual = this.add.rectangle(width / 2, WATER_LEVEL + 150, width + 1200, 300, 0x123b62, 0.72).setDepth(-120);
    this.__waterLine = this.add.rectangle(width / 2, WATER_LEVEL, width + 1200, 5, 0x69d8ff, 0.55).setDepth(-119);
    return result;
  };

  RunnerScene.prototype.update = function waterUpdate(time, delta) {
    originalUpdate.call(this, time, delta);
    const p = this.player, state = this.__waterSurvival;
    if (!p || !state || this.finished || this.respawning) return;
    const now = Number(time || performance.now());
    const inWater = p.y >= WATER_LEVEL && p.y < WATER_LEVEL + 260;
    if (inWater && !state.active) {
      state.active = true; state.enteredAt = now; state.lastCueAt = now;
      this.events?.emit('water:entered', { x: p.x, y: p.y });
    } else if (!inWater && state.active && p.y < WATER_LEVEL - 30) {
      state.active = false;
      state.shark?.destroy(); state.shark = null;
      this.events?.emit('water:escaped');
    }
    if (!state.active) return;
    if (now - state.lastCueAt > 650) {
      state.lastCueAt = now;
      this.events?.emit('water:blood', { x: p.x, y: p.y });
    }
    if (!state.shark && now - state.enteredAt >= SHARK_DELAY_MS) {
      const sharkX = p.x + (p.body?.velocity?.x >= 0 ? -520 : 520);
      state.shark = this.add.ellipse(sharkX, Math.min(WATER_LEVEL + 150, p.y + 55), 110, 38, 0x172238, 0.95).setStrokeStyle(3, 0x8db5c9, 0.8).setDepth(-20);
      this.events?.emit('water:shark-spawn', { x: sharkX, y: p.y });
    }
    if (state.shark) {
      const s = state.shark;
      s.x += Math.sign(p.x - s.x) * SHARK_SPEED * (delta / 1000);
      s.y += ((p.y + 45) - s.y) * Math.min(1, delta / 500);
      if (Math.hypot(s.x - p.x, s.y - p.y) < 62) {
        this.events?.emit('water:shark-attack', { x: p.x, y: p.y });
        try { this.fail('DROWNED'); } catch { /* existing fail flow */ }
        s.destroy(); state.shark = null; state.active = false;
        return;
      }
    }
    if (now - state.enteredAt >= AIR_MS) {
      this.events?.emit('water:drowned', { x: p.x, y: p.y });
      try { this.fail('DROWNED'); } catch { /* existing fail flow */ }
      state.active = false; state.shark?.destroy(); state.shark = null;
    }
  };

  RunnerScene.prototype.shutdown = function waterShutdown(...args) {
    this.__waterSurvival?.shark?.destroy();
    this.__waterVisual?.destroy(); this.__waterLine?.destroy();
    this.__waterSurvival = null;
    return originalShutdown?.apply(this, args);
  };
}
