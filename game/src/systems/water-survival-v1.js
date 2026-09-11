// Water survival: stylized water volumes, oxygen/death state, and dolphin hazard.
// Uses the existing RunnerScene fail/respawn flow; no new HUD or input owner.
const WATER_LEVEL = 700;
const WATER_DEPTH = 260;
const AIR_MS = 4200;
const DOLPHIN_DELAY_MS = 650;
const DOLPHIN_SPEED = 300;

function emitWaterEvent(scene, sharkEvent, dolphinEvent, payload) {
  try { scene?.events?.emit?.(sharkEvent, payload); } catch {}
  try { scene?.events?.emit?.(dolphinEvent, payload); } catch {}
}

function makeDolphin(scene, x, y) {
  try {
    const g = scene.add.graphics().setDepth(-18);
    g.fillStyle(0x6aa4bd, .92);
    g.fillEllipse(0, 0, 92, 30);
    g.fillStyle(0x93d4e8, .82);
    g.fillTriangle(28, -4, 52, -20, 43, 3);
    g.fillTriangle(28, 4, 53, 20, 43, -2);
    g.fillStyle(0x1d3044, .98);
    g.fillCircle(-27, -5, 3);
    g.lineStyle(2, 0x8df4ff, .65);
    g.strokeEllipse(0, 0, 92, 30);
    g.x = x;
    g.y = y;
    return g;
  } catch {
    return null;
  }
}

export function installWaterSurvival(RunnerScene) {
  if (RunnerScene.prototype.__relayWaterSurvivalInstalled) return;
  RunnerScene.prototype.__relayWaterSurvivalInstalled = true;
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function waterCreate(...args) {
    const result = originalCreate.apply(this, args);
    const width = Math.max(this.worldWidth || 6280, this.scale.width || 1280);
    this.__waterSurvival = { active: false, enteredAt: 0, lastCueAt: 0, dolphin: null };
    this.__waterVisual = this.add.rectangle(width / 2, WATER_LEVEL + WATER_DEPTH / 2, width + 1200, WATER_DEPTH, 0x123b62, 0.72).setDepth(-120);
    this.__waterLine = this.add.rectangle(width / 2, WATER_LEVEL, width + 1200, 5, 0x69d8ff, 0.55).setDepth(-119);
    return result;
  };

  RunnerScene.prototype.update = function waterUpdate(time, delta) {
    originalUpdate.call(this, time, delta);
    const p = this.player;
    const state = this.__waterSurvival;
    if (!p || !state || this.finished || this.respawning) return;

    const now = Number(time || performance.now());
    const inWater = p.y >= WATER_LEVEL && p.y < WATER_LEVEL + WATER_DEPTH;

    if (inWater && !state.active) {
      state.active = true;
      state.enteredAt = now;
      state.lastCueAt = now;
      emitWaterEvent(this, 'water:entered', 'water:entered', { x: p.x, y: p.y });
    } else if (!inWater && state.active && p.y < WATER_LEVEL - 30) {
      state.active = false;
      state.dolphin?.destroy?.();
      state.dolphin = null;
      emitWaterEvent(this, 'water:escaped', 'water:escaped', { x: p.x, y: p.y });
    }

    if (!state.active) return;

    if (now - state.lastCueAt > 650) {
      state.lastCueAt = now;
      emitWaterEvent(this, 'water:blood', 'water:splash', { x: p.x, y: p.y });
    }

    if (!state.dolphin && now - state.enteredAt >= DOLPHIN_DELAY_MS) {
      const direction = Number(p.body?.velocity?.x) >= 0 ? -1 : 1;
      const dolphinX = p.x + direction * 560;
      state.dolphin = makeDolphin(this, dolphinX, Math.min(WATER_LEVEL + 150, p.y + 48));
      emitWaterEvent(this, 'water:shark-spawn', 'water:dolphin-spawn', { x: dolphinX, y: p.y });
      try { this.playerCue?.('WATER // DOLPHIN CONTACT', '#8df4ff'); } catch {}
    }

    if (state.dolphin) {
      const d = state.dolphin;
      d.x += Math.sign(p.x - d.x) * DOLPHIN_SPEED * (delta / 1000);
      d.y += ((p.y + 40) - d.y) * Math.min(1, delta / 450);
      if (Math.hypot(d.x - p.x, d.y - p.y) < 58) {
        emitWaterEvent(this, 'water:shark-attack', 'water:dolphin-attack', { x: p.x, y: p.y });
        try { this.fail('DROWNED'); } catch {}
        d.destroy?.();
        state.dolphin = null;
        state.active = false;
        return;
      }
    }

    if (now - state.enteredAt >= AIR_MS) {
      emitWaterEvent(this, 'water:drowned', 'water:drowned', { x: p.x, y: p.y });
      try { this.fail('DROWNED'); } catch {}
      state.active = false;
      state.dolphin?.destroy?.();
      state.dolphin = null;
    }
  };

  RunnerScene.prototype.shutdown = function waterShutdown(...args) {
    this.__waterSurvival?.dolphin?.destroy?.();
    this.__waterVisual?.destroy?.();
    this.__waterLine?.destroy?.();
    this.__waterSurvival = null;
    return originalShutdown?.apply(this, args);
  };
}
