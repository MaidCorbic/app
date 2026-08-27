const HEALTH_ZONE_STATE = Object.freeze({ IDLE: 'idle', ACTIVE: 'active' });
const DEFAULT_RADIUS = 82;
const DEFAULT_HEAL_RATE = 1.6;

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function installHealthRestoreZones(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__healthRestoreZonesV1) return;
  RunnerScene.prototype.__healthRestoreZonesV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalHit = RunnerScene.prototype.takeSciFiHit;

  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate?.apply(this, args);
    const mission = this.mission;
    const checkpoints = Array.isArray(mission?.checkpoints) ? mission.checkpoints : [];
    const authoredZones = Array.isArray(mission?.healthRestoreZones) ? mission.healthRestoreZones : [];
    const fallbackZones = checkpoints.map(([x, y]) => [x, y + 18, DEFAULT_RADIUS]);
    const zoneDefs = authoredZones.length ? authoredZones : fallbackZones;

    this.__healthRestore = {
      enabled: zoneDefs.length > 0,
      zones: zoneDefs.map(([x, y, radius = DEFAULT_RADIUS, healRate = DEFAULT_HEAL_RATE]) => ({
        x: finite(x),
        y: finite(y),
        radius: Math.max(32, finite(radius, DEFAULT_RADIUS)),
        healRate: Math.max(.25, finite(healRate, DEFAULT_HEAL_RATE)),
        state: HEALTH_ZONE_STATE.IDLE,
        active: false,
        visual: null,
        pulse: null,
        label: null,
      })),
      activeIndex: -1,
      lastCueAt: 0,
      lastHealthEmit: this.health,
    };

    this.createHealthRestoreZones?.();
    this.game?.events?.emit('health-restore-zones-ready', this.__healthRestore.zones.length);
    return result;
  };

  RunnerScene.prototype.createHealthRestoreZones = function () {
    const data = this.__healthRestore;
    if (!data?.enabled || !this.add) return;

    data.zones.forEach((zone, index) => {
      const ring = this.add.circle(zone.x, zone.y, zone.radius, 0x081b25, .18)
        .setStrokeStyle?.(2, 0x55d8ff, .62)
        .setDepth?.(5);
      const core = this.add.circle(zone.x, zone.y, Math.max(10, zone.radius * .18), 0x55d8ff, .14)
        .setDepth?.(5);
      const label = this.add.text(zone.x, zone.y - zone.radius - 10, 'RESTORE', {
        fontFamily: 'DM Mono', fontSize: '9px', color: '#8df4ff', fontStyle: 'bold',
      }).setOrigin?.(.5, 1).setDepth?.(6);
      zone.visual = ring;
      zone.pulse = core;
      zone.label = label;
      if (!this.motionReduced) {
        this.tweens.add({ targets: ring, alpha: { from: .16, to: .32 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.tweens.add({ targets: core, scale: { from: .8, to: 1.35 }, alpha: { from: .12, to: .26 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      zone.label.setData?.('zone-index', index);
    });
  };

  RunnerScene.prototype.getHealthRestoreZone = function () {
    const data = this.__healthRestore;
    if (!data?.enabled || !this.player) return null;
    const playerX = Number(this.player.x);
    const playerY = Number(this.player.y);
    if (!Number.isFinite(playerX) || !Number.isFinite(playerY)) return null;
    for (let index = 0; index < data.zones.length; index += 1) {
      const zone = data.zones[index];
      if (Phaser.Math.Distance.Between(playerX, playerY, zone.x, zone.y) <= zone.radius) return { zone, index };
    }
    return null;
  };

  RunnerScene.prototype.isInHealthRestoreZone = function () {
    return Boolean(this.getHealthRestoreZone?.());
  };

  RunnerScene.prototype.updateHealthRestoreZones = function (delta) {
    const data = this.__healthRestore;
    if (!data?.enabled || !this.player || this.finished || this.respawning || this.cinematicActive) return;
    const current = this.getHealthRestoreZone?.();
    const previousIndex = data.activeIndex;
    data.activeIndex = current ? current.index : -1;

    if (previousIndex !== data.activeIndex) {
      data.zones.forEach((zone, index) => {
        zone.active = index === data.activeIndex;
        zone.state = zone.active ? HEALTH_ZONE_STATE.ACTIVE : HEALTH_ZONE_STATE.IDLE;
        zone.visual?.setStrokeStyle?.(zone.active ? 3 : 2, zone.active ? 0xaeefff : 0x55d8ff, zone.active ? .95 : .62);
        zone.label?.setText?.(zone.active ? 'RESTORE · SAFE' : 'RESTORE');
      });
      if (current && performance.now() - data.lastCueAt > 900) {
        data.lastCueAt = performance.now();
        this.playerCue?.('HEALTH RESTORE · SAFE ZONE', '#8df4ff');
      }
    }

    if (!current) return;
    const before = Math.max(0, Math.min(3, Number(this.health) || 0));
    const amount = current.zone.healRate * Math.max(0, Number(delta) || 0) / 1000;
    const next = Math.min(3, before + amount);
    this.health = next;
    if (next !== before && Math.abs(next - Number(data.lastHealthEmit ?? before)) >= .01) {
      data.lastHealthEmit = next;
      this.game?.events?.emit('health', this.health);
      this.game?.events?.emit('health-restore', { health: this.health, maxHealth: 3, zoneIndex: current.index });
    }
  };

  RunnerScene.prototype.takeSciFiHit = function (...args) {
    if (this.isInHealthRestoreZone?.()) {
      this.playerCue?.('SAFE RESTORE ACTIVE', '#8df4ff');
      return false;
    }
    return originalHit?.apply(this, args);
  };

  RunnerScene.prototype.update = function (time, delta) {
    const result = originalUpdate?.call(this, time, delta);
    this.updateHealthRestoreZones?.(delta);
    return result;
  };

  RunnerScene.prototype.shutdownHealthRestoreZones = function () {
    const data = this.__healthRestore;
    if (!data) return;
    data.zones.forEach(zone => {
      zone.visual?.destroy?.();
      zone.pulse?.destroy?.();
      zone.label?.destroy?.();
    });
    this.__healthRestore = null;
  };
}

export { installHealthRestoreZones, HEALTH_ZONE_STATE };
