import Phaser from 'phaser';

const CONFIG = {
  missionUnlock: ['first-delivery','dead-drop','blackout','pursuit','signal-storm','corporate-lockdown','final-relay'],
  maxActiveDrones: 1,
  droneDetectRadius: 560,
  lockMs: 1050,
  strikeCooldownMs: 5200,
  droneRetireMs: 1400,
  droneRespawnCooldownMs: 3200,
  spawnProtectionMs: 8000,
  zoneRadius: 92,
  zoneLifeMs: 2550,
  recoveryHoldMs: 900,
  recoveryRadius: 74,
};

function safeMission(scene) {
  const id = scene?.mission?.id;
  return CONFIG.missionUnlock.includes(id) ? id : null;
}

function emit(scene, name, detail = {}) {
  try { scene.events?.emit(name, { ...detail, source: 'drone-strike-recovery-v1' }); } catch { /* optional */ }
}

function spawnProtected(scene) {
  return Number(scene?.time?.now) < Number(scene?.__relaySpawnProtectionUntil || 0);
}

function killPlayer(scene, reason = 'ATOMIC STRIKE') {
  const player = scene?.player;
  if (!player || scene.__droneStrikeDeathLock || spawnProtected(scene)) return;
  scene.__droneStrikeDeathLock = true;
  try {
    player.setTint?.(0xff5a55);
    if (player.body) player.body.setVelocity(0, 0);
    if (Number.isFinite(scene.health)) scene.health = 0;
    scene.respawnGrace = 0;
    scene.healthInvulnerable = 0;
    emit(scene, 'drone:strike-hit', { reason });
    scene.cameras?.main?.shake?.(420, 0.018);
    scene.fail?.(reason);
  } finally {
    window.setTimeout(() => { scene.__droneStrikeDeathLock = false; }, 800);
  }
}

function createDrone(scene, index) {
  const container = scene.add.container(scene.player.x + (index ? 220 : -220), scene.player.y - 180);
  container.setDepth(44);

  const glow = scene.add.circle(0, 0, 26, 0xff355e, .12).setBlendMode(Phaser.BlendModes.ADD);
  const body = scene.add.rectangle(0, 0, 38, 18, 0x111a2a, .98).setStrokeStyle(2, 0xff476b, .86);
  const wingL = scene.add.triangle(-22, 0, -5, -8, -22, 0, -5, 8, 0x283b57, 1);
  const wingR = scene.add.triangle(22, 0, 5, -8, 22, 0, 5, 8, 0x283b57, 1);
  const core = scene.add.circle(0, 0, 5, 0xffa2b3, 1).setBlendMode(Phaser.BlendModes.ADD);
  const sensor = scene.add.circle(0, 9, 3, 0xff335f, 1).setBlendMode(Phaser.BlendModes.ADD);
  const beam = scene.add.rectangle(0, 100, 2, 190, 0xff355e, .07).setBlendMode(Phaser.BlendModes.ADD);
  container.add([beam, glow, wingL, wingR, body, core, sensor]);

  const state = {
    index,
    root: container,
    glow,
    core,
    beam,
    phase: Math.random() * Math.PI * 2,
    lockedAt: 0,
    nextStrikeAt: 0,
    retireAt: 0,
    targetX: null,
    targetY: null,
    active: true,
  };

  scene.tweens.add({ targets: [glow, core], alpha: { from: .35, to: 1 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return state;
}

function retireDrone(scene, drone, now) {
  if (!drone || !drone.active) return;
  drone.active = false;
  drone.root?.destroy(true);
  scene.__droneNextSpawnAt = now + CONFIG.droneRespawnCooldownMs;
  emit(scene, 'drone:retired', { index: drone.index });
}

function createZone(scene, x, y) {
  const zone = scene.add.container(x, y).setDepth(18);
  const disc = scene.add.circle(0, 0, CONFIG.zoneRadius, 0xff213f, .11);
  const inner = scene.add.circle(0, 0, CONFIG.zoneRadius * .52, 0xff162d, .14);
  const ring = scene.add.circle(0, 0, CONFIG.zoneRadius, 0xff5872, .55).setStrokeStyle(3, 0xff5872, .95);
  const core = scene.add.circle(0, 0, 18, 0xffe0e6, .82).setBlendMode(Phaser.BlendModes.ADD);
  const label = scene.add.text(0, -CONFIG.zoneRadius - 20, spawnProtected(scene) ? 'STRIKE · BLOCKED' : 'STRIKE ZONE', {
    fontFamily: 'monospace', fontSize: '12px', color: '#ffd4db',
    stroke: '#080d16', strokeThickness: 4,
  }).setOrigin(.5);
  const cross = scene.add.text(0, 0, '×', {
    fontFamily: 'monospace', fontSize: '28px', color: '#ff7b92',
  }).setOrigin(.5);
  zone.add([disc, inner, ring, core, label, cross]);

  const pulse = scene.tweens.add({ targets: [ring, core], scale: { from: .72, to: 1.15 }, alpha: { from: .35, to: 1 }, duration: 360, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  const life = { zone, ring, pulse, bornAt: scene.time.now, detonated: false, x, y };
  scene.__droneZones.push(life);
  emit(scene, 'drone:strike-warning', { x, y, protected: spawnProtected(scene) });
  return life;
}

function detonateZone(scene, life) {
  if (!life || life.detonated) return;
  life.detonated = true;
  const player = scene.player;
  const dist = player ? Phaser.Math.Distance.Between(player.x, player.y, life.x, life.y) : Infinity;
  const protectedHit = spawnProtected(scene) || Number(scene?.healthInvulnerable) > 0 || Number(scene?.respawnGrace) > 0;
  const blast = scene.add.circle(life.x, life.y, 24, 0xffd9df, .72).setDepth(60).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: blast, radius: CONFIG.zoneRadius * 1.65, alpha: 0, duration: 420, ease: 'Cubic.Out', onComplete: () => blast.destroy() });
  scene.cameras?.main?.shake?.(420, .014);
  emit(scene, 'drone:strike-detonate', { x: life.x, y: life.y, hit: dist <= CONFIG.zoneRadius, protected: protectedHit });
  if (dist <= CONFIG.zoneRadius && !protectedHit) killPlayer(scene);
  life.zone.destroy(true);
  scene.__droneZones = scene.__droneZones.filter(z => z !== life);
}

function cleanup(scene) {
  scene.__droneRecovery?.station?.destroy(true);
  for (const drone of scene.__droneUnits || []) drone.root?.destroy(true);
  for (const zone of scene.__droneZones || []) zone.zone?.destroy(true);
  scene.__droneUnits = [];
  scene.__droneZones = [];
  scene.__droneRecovery = null;
  scene.__relaySpawnProtectionUntil = 0;
  scene.__droneNextSpawnAt = 0;
}

export function installDroneStrikeRecovery(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__droneStrikeRecoveryInstalled) return;
  RunnerScene.prototype.__droneStrikeRecoveryInstalled = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function (...args) {
    originalCreate.apply(this, args);
    if (!safeMission(this) || !this.player) return;

    this.__relaySpawnProtectionUntil = this.time.now + CONFIG.spawnProtectionMs;
    this.__droneUnits = [];
    this.__droneZones = [];
    this.__droneNextSpawnAt = this.time.now + 1600;
    this.__droneRecovery = { station: null, x: null, y: null, holdStarted: 0, cooldownUntil: 0 };

    emit(this, 'drone:spawn-protection', { durationMs: CONFIG.spawnProtectionMs });

    const worldWidth = Math.max(2600, Number(this.physics?.world?.bounds?.width || this.cameras?.main?.getBounds?.().width || 6280));
    const stationX = Math.max(this.player.x + 680, Math.min(worldWidth - 360, Math.round(worldWidth * .56)));
    const stationY = this.player.y;
    const station = this.add.container(stationX, stationY).setDepth(24);
    const outer = this.add.circle(0, 0, CONFIG.recoveryRadius, 0x56f3ca, .07);
    const ring = this.add.circle(0, 0, CONFIG.recoveryRadius, 0x83ffe3, .65).setStrokeStyle(2, 0x83ffe3, .95);
    const core = this.add.circle(0, 0, 16, 0x8affeb, .4).setBlendMode(Phaser.BlendModes.ADD);
    const beam = this.add.rectangle(0, -32, 3, 64, 0x8affeb, .18).setBlendMode(Phaser.BlendModes.ADD);
    const text = this.add.text(0, -CONFIG.recoveryRadius - 18, 'RECOVERY // SAFE', {
      fontFamily: 'monospace', fontSize: '12px', color: '#c8fff6',
      stroke: '#07101e', strokeThickness: 4,
    }).setOrigin(.5);
    station.add([outer, ring, core, beam, text]);
    this.__droneRecovery.station = station;
    this.__droneRecovery.x = stationX;
    this.__droneRecovery.y = stationY;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => cleanup(this));
    this.events.once(Phaser.Scenes.Events.DESTROY, () => cleanup(this));
  };

  RunnerScene.prototype.update = function (...args) {
    originalUpdate.apply(this, args);
    const player = this.player;
    if (!player || !this.__droneUnits || !this.__droneZones) return;

    const now = this.time.now;
    const active = this.__droneUnits.filter(drone => drone?.active && drone.root?.active);
    this.__droneUnits = active;

    if (!active.length && now >= Number(this.__droneNextSpawnAt || 0) && !this.finished && !this.respawning) {
      this.__droneUnits.push(createDrone(this, 0));
      emit(this, 'drone:spawn', { index: 0 });
    }

    for (const drone of [...this.__droneUnits]) {
      if (!drone.active) continue;
      const desiredX = player.x + 230;
      const desiredY = player.y - 210 - Math.sin(now / 430 + drone.phase) * 34;
      drone.root.x = Phaser.Math.Linear(drone.root.x, desiredX, .035);
      drone.root.y = Phaser.Math.Linear(drone.root.y, desiredY, .045);
      drone.root.rotation = Math.sin(now / 500 + drone.phase) * .06;
      drone.beam.alpha = Phaser.Math.Distance.Between(drone.root.x, drone.root.y, player.x, player.y) < CONFIG.droneDetectRadius ? .15 : .04;

      const dist = Phaser.Math.Distance.Between(drone.root.x, drone.root.y, player.x, player.y);
      if (dist < CONFIG.droneDetectRadius && !this.cinematicActive) {
        if (!drone.lockedAt) {
          drone.lockedAt = now;
          drone.targetX = player.x;
          drone.targetY = player.y;
          emit(this, 'drone:lock', { index: drone.index });
        }
        if (now - drone.lockedAt >= CONFIG.lockMs && now >= drone.nextStrikeAt) {
          const x = Phaser.Math.Clamp(player.x + Phaser.Math.Between(-110, 110), 90, Math.max(90, (this.physics?.world?.bounds?.width || 6280) - 90));
          const y = Phaser.Math.Clamp(player.y + Phaser.Math.Between(-12, 12), 430, 690);
          createZone(this, x, y);
          drone.nextStrikeAt = now + CONFIG.strikeCooldownMs;
          drone.retireAt = now + CONFIG.droneRetireMs;
          drone.lockedAt = 0;
        }
      } else if (drone.lockedAt && now - drone.lockedAt > 800) {
        drone.lockedAt = 0;
      }

      if (drone.retireAt && now >= drone.retireAt) retireDrone(this, drone, now);
    }

    for (const zone of [...(this.__droneZones || [])]) {
      if (now - zone.bornAt >= CONFIG.zoneLifeMs) detonateZone(this, zone);
    }

    const recovery = this.__droneRecovery;
    if (recovery?.station) {
      const inRange = Phaser.Math.Distance.Between(player.x, player.y, recovery.x, recovery.y) <= CONFIG.recoveryRadius;
      if (inRange && now >= recovery.cooldownUntil && !this.finished) {
        if (!recovery.holdStarted) recovery.holdStarted = now;
        const progress = Phaser.Math.Clamp((now - recovery.holdStarted) / CONFIG.recoveryHoldMs, 0, 1);
        recovery.station.list?.[1]?.setScale(.75 + progress * .45);
        recovery.station.list?.[2]?.setScale(.8 + progress * .6);
        if (progress >= 1) {
          if (Number.isFinite(this.health)) this.health = Math.max(this.health, 3);
          this.healthInvulnerable = Math.max(this.healthInvulnerable || 0, 1300);
          this.respawnGrace = Math.max(this.respawnGrace || 0, 1300);
          if (player.body) player.body.setVelocity(Math.min(player.body.velocity.x, 0), Math.min(player.body.velocity.y, 0));
          this.checkpoint = { x: recovery.x, y: recovery.y - 36, signals: new Set(), secrets: new Set() };
          recovery.cooldownUntil = now + 1800;
          recovery.holdStarted = 0;
          emit(this, 'drone:recovery-complete', { x: recovery.x, y: recovery.y });
          this.cameras?.main?.flash?.(220, 112, 255, 222);
        }
      } else {
        recovery.holdStarted = 0;
      }
    }
  };
}
