// Forward-only pressure: after a grace period, the trailing zone advances faster
// as the run progresses. It has no HUD and delegates death to the existing fail flow.
const START_DELAY_MS = 60000;
const BASE_SPEED = 34;
const SPEED_PER_MINUTE = 24;
const LEVEL_MULTIPLIERS = [1, 1.12, 1.28, 1.48, 1.72, 2.0];

export function installForwardCollapseZone(RunnerScene) {
  if (RunnerScene.prototype.__relayForwardCollapseInstalled) return;
  RunnerScene.prototype.__relayForwardCollapseInstalled = true;
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function collapseCreate(...args) {
    const result = originalCreate.apply(this, args);
    const spawnX = Number(this.mission?.spawn?.x ?? this.player?.x ?? 120);
    this.__forwardCollapse = { originX: spawnX - 520, x: spawnX - 520, startedAt: performance.now(), active: false, lastX: spawnX - 520 };
    this.__collapseVisual = this.add.rectangle(this.__forwardCollapse.x, 430, 18, 760, 0xff3558, 0.22)
      .setDepth(30).setScrollFactor(0.98);
    return result;
  };

  RunnerScene.prototype.update = function collapseUpdate(time, delta) {
    originalUpdate.call(this, time, delta);
    const p = this.player; const c = this.__forwardCollapse;
    if (!p || !c || this.finished || this.respawning) return;
    const elapsed = Number(time || performance.now()) - c.startedAt;
    if (elapsed < START_DELAY_MS) return;
    c.active = true;
    const minutes = Math.max(0, (elapsed - START_DELAY_MS) / 60000);
    const level = Math.max(1, Math.min(LEVEL_MULTIPLIERS.length, Number(this.missionIndex || 0) + 1));
    const speed = (BASE_SPEED + minutes * SPEED_PER_MINUTE) * LEVEL_MULTIPLIERS[level - 1];
    c.x += speed * (delta / 1000);
    c.lastX = c.x;
    if (this.__collapseVisual) this.__collapseVisual.x = c.x;
    if (p.x <= c.x + 34) {
      this.events?.emit('collapse-zone:hit', { x: p.x, level, elapsed });
      try { this.fail('OVERTAKEN'); } catch { /* existing fail flow */ }
    }
  };

  RunnerScene.prototype.shutdown = function collapseShutdown(...args) {
    this.__collapseVisual?.destroy(); this.__collapseVisual = null; this.__forwardCollapse = null;
    return originalShutdown?.apply(this, args);
  };
}
