import Phaser from 'phaser';
import { packages } from '../packages.js';
import { rivalAppearances } from '../world-content.js';
import { enemyIntel, signatureThreats } from '../enemy-intel.js';

// Kept together so movement can be tuned without touching level or state logic.
const RUNNER_TUNING = {
  maxRunSpeed: 460,
  groundAcceleration: 4200,
  airAcceleration: 2350,
  turnAcceleration: 5600,
  groundDeceleration: 3300,
  jumpVelocity: -705,
  jumpCutMultiplier: .48,
  coyoteMs: 115,
  jumpBufferMs: 120,
  fallGravity: 720,
  maxFallSpeed: 1120,
  dashSpeed: 670,
  dashDurationMs: 145,
  dashCooldownMs: 620,
};

const DISTRICT_VISUALS = {
  'first-delivery': { skyline: 0x1b2943, building: 0x263653, window: 0xffcd7a, accent: 0xffd06e, label: 'OLD QUARTER', props: 'lanterns' },
  'dead-drop': { skyline: 0x283142, building: 0x394052, window: 0xffbd5b, accent: 0xffa85d, label: 'SALT DOCKS', props: 'docks' },
  blackout: { skyline: 0x10192a, building: 0x15233a, window: 0x8df4ff, accent: 0x8df4ff, label: 'GRID NINE', props: 'emergency' },
  pursuit: { skyline: 0x202945, building: 0x2c3858, window: 0xb9d9ff, accent: 0xff826e, label: 'RAIL SPINE', props: 'rail' },
  'signal-storm': { skyline: 0x15213a, building: 0x26385a, window: 0xaecbff, accent: 0xb993ff, label: 'CROWN ARRAY', props: 'array' },
  'corporate-lockdown': { skyline: 0x263044, building: 0x3a465f, window: 0xffd06e, accent: 0xff826e, label: 'HELIX TOWER', props: 'rail' },
  'final-relay': { skyline: 0x211d3a, building: 0x334261, window: 0xffe0a8, accent: 0xffd06e, label: 'APEX SPINE', props: 'array' },
};

export class RunnerScene extends Phaser.Scene {
  constructor() { super('runner'); }

  createTextures() {
    const make = (key, width, height, draw) => {
      const graphics = this.make.graphics({ add: false });
      draw(graphics);
      graphics.generateTexture(key, width, height);
      graphics.destroy();
    };

    const runner = (key, leftLeg, rightLeg, arm) => make(key, 48, 64, g => {
      g.fillStyle(0xf3eee4).fillCircle(24, 12, 10).fillStyle(0x202a3d).fillRect(14, 21, 20, 5);
      g.fillStyle(0xff756d).fillRoundedRect(14, 23, 20, 24, 5).fillStyle(0xffd06e).fillRect(14, 29, 20, 5);
      g.lineStyle(5, 0xf3eee4).lineBetween(15, 30, 8, arm).lineBetween(33, 30, 40, 42 - arm / 5);
      g.lineStyle(7, 0xaee37f).lineBetween(19, 45, 16, leftLeg).lineBetween(29, 45, 33, rightLeg);
    });

    runner('runner-idle', 60, 60, 40);
    runner('runner-run-a', 56, 63, 50);
    runner('runner-run-b', 63, 56, 27);
    runner('runner-jump', 54, 54, 30);
    runner('runner-fall', 62, 62, 58);
    runner('runner-land', 55, 55, 42);
    runner('runner-dash', 54, 54, 22);
    runner('runner-wall', 56, 62, 18);
    runner('runner-hit', 62, 62, 62);
    runner('runner-finish', 50, 50, 18);

    make('signal', 56, 56, g => {
      g.fillStyle(0xffd06e, .08).fillCircle(28, 28, 27);
      g.fillStyle(0xffd06e, .2).fillCircle(28, 28, 20);
      g.lineStyle(2, 0xffe6a6, .85)
        .strokeCircle(28, 28, 15)
        .lineBetween(28, 6, 28, 15)
        .lineBetween(28, 41, 28, 50);
      g.fillStyle(0xffe7a6).fillCircle(28, 28, 8);
      g.fillStyle(0xff826e).fillCircle(28, 28, 3);
    });

    make('barrier', 48, 64, g =>
      g.fillStyle(0x202b39)
        .fillRect(3, 3, 42, 58)
        .lineStyle(3, 0xff826e)
        .strokeRect(4, 4, 40, 56)
        .lineBetween(7, 8, 41, 56)
        .lineBetween(41, 8, 7, 56)
    );

    make('goal', 56, 68, g =>
      g.lineStyle(4, 0xe5ecf1)
        .lineBetween(10, 66, 10, 4)
        .fillStyle(0xffd06e)
        .fillTriangle(12, 9, 48, 21, 12, 36)
    );

    make('rain', 8, 14, g =>
      g.lineStyle(2, 0xd9e9ff, .45)
        .lineBetween(6, 0, 1, 13)
    );

    make('dust', 10, 10, g =>
      g.fillStyle(0xd6dbe2, .65).fillCircle(5, 5, 4)
    );

    make('speed-line', 32, 3, g =>
      g.fillGradientStyle(
        0xb9e9ff,
        0xb9e9ff,
        0xb9e9ff,
        0xb9e9ff,
        0,
        .65,
        .65,
        0
      ).fillRect(0, 0, 32, 3)
    );

    make('boost-pad', 58, 18, g =>
      g.fillStyle(0x17263b)
        .fillRoundedRect(0, 2, 58, 14, 4)
        .fillStyle(0x8df4ff)
        .fillTriangle(10, 13, 20, 5, 30, 13)
        .fillTriangle(27, 13, 37, 5, 47, 13)
    );

    make('chaser', 52, 60, g =>
      g.fillStyle(0xff826e, .14)
        .fillCircle(26, 28, 25)
        .fillStyle(0x172238)
        .fillRoundedRect(10, 8, 32, 42, 7)
        .lineStyle(2, 0xff826e)
        .strokeRoundedRect(10, 8, 32, 42, 7)
        .fillStyle(0xff826e)
        .fillRect(16, 20, 20, 5)
    );

    make('checkpoint', 30, 54, g =>
      g.lineStyle(3, 0x8df4ff)
        .lineBetween(6, 52, 6, 4)
        .fillStyle(0x8df4ff, .2)
        .fillTriangle(8, 6, 27, 14, 8, 23)
        .lineStyle(1, 0xdffcff)
        .strokeTriangle(8, 6, 27, 14, 8, 23)
    );

    make('security', 42, 34, g =>
      g.fillStyle(0xff826e, .14)
        .fillCircle(21, 17, 20)
        .fillStyle(0x172238)
        .fillRoundedRect(5, 8, 32, 20, 8)
        .lineStyle(2, 0xff826e)
        .strokeRoundedRect(5, 8, 32, 20, 8)
        .fillStyle(0xff826e)
        .fillCircle(28, 17, 4)
    );

    make('guard', 32, 58, g =>
      g.fillStyle(0x172238)
        .fillRoundedRect(6, 7, 20, 44, 5)
        .lineStyle(2, 0xff826e)
        .strokeRoundedRect(6, 7, 20, 44, 5)
        .fillStyle(0xffd06e)
        .fillRect(10, 16, 12, 4)
    );

    make('enemy-runner', 48, 64, g => {
      g.fillStyle(0xd5f0ff).fillCircle(24, 12, 10);
      g.fillStyle(0x241b35).fillRect(14, 21, 20, 5);
      g.fillStyle(0x6b3f83).fillRoundedRect(14, 23, 20, 24, 5);
      g.fillStyle(0xff826e).fillRect(14, 29, 20, 5);
      g.lineStyle(5, 0xd5f0ff)
        .lineBetween(15, 30, 8, 42)
        .lineBetween(33, 30, 40, 35);
      g.lineStyle(7, 0xff826e)
        .lineBetween(19, 45, 16, 60)
        .lineBetween(29, 45, 33, 60);
    });

    make('invader', 48, 38, g =>
      g.fillStyle(0x5b3d82)
        .fillRoundedRect(4, 9, 40, 23, 10)
        .lineStyle(2, 0xe0a7ff)
        .strokeRoundedRect(4, 9, 40, 23, 10)
        .fillStyle(0xe0a7ff)
        .fillCircle(17, 20, 4)
        .fillCircle(31, 20, 4)
    );

    make('chicken', 42, 38, g =>
      g.fillStyle(0xf4f0e7)
        .fillCircle(20, 22, 15)
        .fillCircle(28, 10, 9)
        .fillStyle(0xffd06e)
        .fillTriangle(35, 11, 43, 15, 35, 19)
        .fillStyle(0xff826e)
        .fillCircle(26, 2, 4)
    );

    make('dino', 68, 48, g =>
      g.fillStyle(0x72a66a)
        .fillRoundedRect(7, 16, 48, 24, 9)
        .fillTriangle(0, 25, 14, 10, 14, 40)
        .fillStyle(0xdff0b0)
        .fillCircle(50, 17, 5)
        .fillStyle(0x172238)
        .fillCircle(51, 16, 2)
    );

    make('dino-boss', 112, 82, g =>
      g.fillStyle(0x4f855f)
        .fillRoundedRect(12, 25, 80, 38, 13)
        .fillTriangle(0, 43, 20, 12, 20, 70)
        .lineStyle(3, 0xdff0b0)
        .strokeRoundedRect(12, 25, 80, 38, 13)
        .fillStyle(0xffd06e)
        .fillCircle(82, 28, 8)
        .fillStyle(0x172238)
        .fillCircle(83, 28, 3)
    );

    make('sentinel-boss', 90, 92, g =>
      g.fillStyle(0x203d5a)
        .fillRoundedRect(18, 18, 54, 62, 12)
        .lineStyle(3, 0x8df4ff)
        .strokeRoundedRect(18, 18, 54, 62, 12)
        .fillStyle(0x8df4ff, .28)
        .fillCircle(45, 42, 23)
        .fillStyle(0xe2fbff)
        .fillCircle(45, 42, 8)
        .fillStyle(0xff826e)
        .fillRect(30, 65, 30, 7)
    );

    make('storm-boss', 104, 86, g =>
      g.fillStyle(0x3f356e)
        .fillTriangle(4, 46, 40, 8, 78, 46)
        .fillTriangle(26, 48, 64, 12, 100, 48)
        .fillStyle(0xb993ff, .32)
        .fillCircle(52, 44, 35)
        .lineStyle(3, 0xe0a7ff)
        .strokeCircle(52, 44, 22)
        .fillStyle(0xffd06e)
        .fillCircle(52, 44, 8)
    );

    make('apex-boss', 108, 96, g =>
      g.fillStyle(0x382844)
        .fillRoundedRect(14, 18, 80, 68, 16)
        .lineStyle(3, 0xffd06e)
        .strokeRoundedRect(14, 18, 80, 68, 16)
        .fillStyle(0xff826e, .22)
        .fillCircle(54, 43, 28)
        .fillStyle(0xffe0a8)
        .fillCircle(54, 43, 9)
        .fillStyle(0x8df4ff)
        .fillRect(30, 69, 48, 7)
    );

    make('alien-ground', 54, 54, g =>
      g.fillStyle(0x402d64)
        .fillRoundedRect(7, 12, 40, 36, 12)
        .lineStyle(2, 0xe0a7ff)
        .strokeRoundedRect(7, 12, 40, 36, 12)
        .fillStyle(0xe0a7ff)
        .fillCircle(19, 26, 5)
        .fillCircle(35, 26, 5)
        .fillStyle(0x8df4ff)
        .fillRect(17, 43, 20, 5)
    );

    make('egg', 18, 24, g =>
      g.fillStyle(0xfff3cf)
        .fillEllipse(9, 12, 14, 21)
        .lineStyle(1, 0xffd06e)
        .strokeEllipse(9, 12, 14, 21)
    );

    make('comet', 32, 32, g =>
      g.fillStyle(0xff826e, .25)
        .fillCircle(16, 16, 15)
        .fillStyle(0xffd06e)
        .fillCircle(16, 16, 8)
        .fillStyle(0xfff3cf)
        .fillCircle(13, 13, 3)
    );

    make('kinetic-ball', 26, 26, g =>
      g.fillStyle(0x8df4ff, .25)
        .fillCircle(13, 13, 13)
        .lineStyle(2, 0xdffcff)
        .strokeCircle(13, 13, 10)
        .fillStyle(0x8df4ff)
        .fillCircle(13, 13, 5)
    );

    make('shield', 46, 64, g =>
      g.fillStyle(0x8df4ff, .18)
        .fillRoundedRect(4, 2, 38, 60, 9)
        .lineStyle(2, 0xb9f5ff)
        .strokeRoundedRect(4, 2, 38, 60, 9)
    );

    make('blaster', 34, 14, g =>
      g.fillStyle(0x263853)
        .fillRoundedRect(1, 3, 28, 8, 3)
        .fillStyle(0x8df4ff)
        .fillRect(21, 5, 12, 4)
        .fillStyle(0xffd06e)
        .fillRect(7, 11, 7, 3)
    );

    make('sword', 52, 12, g =>
      g.fillStyle(0xdffcff)
        .fillTriangle(10, 6, 48, 1, 48, 11)
        .fillStyle(0xffd06e)
        .fillRect(3, 2, 10, 8)
    );

    make('plasma', 18, 10, g =>
      g.fillStyle(0x8df4ff, .25)
        .fillEllipse(9, 5, 18, 10)
        .fillStyle(0xe2fbff)
        .fillEllipse(9, 5, 10, 5)
    );

    make('turret', 42, 42, g =>
      g.fillStyle(0x202d48)
        .fillRoundedRect(5, 20, 32, 17, 5)
        .fillStyle(0x8df4ff)
        .fillRect(17, 5, 8, 20)
        .fillStyle(0xdffcff)
        .fillCircle(21, 13, 5)
    );

    make('spring-pad', 56, 18, g =>
      g.fillStyle(0x263853)
        .fillRoundedRect(1, 3, 54, 14, 4)
        .lineStyle(2, 0xaee37f)
        .strokeRoundedRect(1, 3, 54, 14, 4)
        .lineStyle(2, 0xaee37f)
        .lineBetween(12, 13, 20, 7)
        .lineBetween(20, 7, 28, 13)
        .lineBetween(28, 13, 36, 7)
        .lineBetween(36, 7, 44, 13)
    );

    make('guide-drone', 42, 30, g =>
      g.fillStyle(0x8df4ff, .18)
        .fillCircle(21, 15, 19)
        .fillStyle(0x203d5a)
        .fillRoundedRect(6, 8, 30, 14, 7)
        .lineStyle(2, 0x8df4ff)
        .strokeRoundedRect(6, 8, 30, 14, 7)
        .fillStyle(0xe2fbff)
        .fillCircle(21, 15, 5)
    );

    make('alien-guide', 38, 46, g =>
      g.fillStyle(0x5b3d82)
        .fillEllipse(19, 18, 28, 29)
        .fillStyle(0xe0a7ff)
        .fillCircle(13, 16, 4)
        .fillCircle(25, 16, 4)
        .fillStyle(0x8df4ff)
        .fillRoundedRect(11, 29, 16, 12, 5)
    );
  }

  createAnimations() {
    if (this.anims.exists('runner-run')) return;

    this.anims.create({
      key: 'runner-idle',
      frames: [{ key: 'runner-idle' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'runner-run',
      frames: [{ key: 'runner-run-a' }, { key: 'runner-run-b' }],
      frameRate: 11,
      repeat: -1
    });

    this.anims.create({
      key: 'runner-jump',
      frames: [{ key: 'runner-jump' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'runner-fall',
      frames: [{ key: 'runner-fall' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'runner-land',
      frames: [{ key: 'runner-land' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'runner-dash',
      frames: [{ key: 'runner-dash' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'runner-wall',
      frames: [{ key: 'runner-wall' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'runner-hit',
      frames: [{ key: 'runner-hit' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'runner-finish',
      frames: [{ key: 'runner-finish' }],
      frameRate: 1
    });
  }

  init({
    mission,
    runId,
    abilities = [],
    rain,
    screenShake = true,
    reducedMotion = false,
    firstTimeTutorial = false
  }) {
    this.mission = mission;
    this.runId = runId;
    this.abilities = new Set(abilities);
    this.rainEnabled = rain;
    this.screenShake = screenShake;
    this.motionReduced = reducedMotion;
    this.firstTimeTutorial = firstTimeTutorial;

    this.collected = 0;
    this.secretsCollected = 0;
    this.elapsedMs = 0;
    this.timeEmitTimer = 0;

    this.boostCooldown = 0;
    this.dashCooldown = 0;
    this.dashTimer = 0;
    this.wallJumpCooldown = 0;
    this.wallJumpTimer = 0;
    this.lowEnergyCueTimer = 0;

    this.health = 3;
    this.healthInvulnerable = 0;
    this.briefingProtected = false;

    this.ammo = 6;
    this.ammoMax = 6;
    this.ammoRecharge = 0;

    this.cometTimer = 3400;
    this.blasterCooldown = 0;
    this.swordCooldown = 0;
    this.buildCooldowns = [0, 0];

    this.combatCombo = 0;
    this.comboTimer = 0;
    this.jumps = 0;
    this.collisions = 0;
    this.falls = 0;
    this.deaths = 0;

    this.deathLimit = mission.id === 'first-delivery' ? Infinity : 3;
    this.jumpsUsed = 0;
    this.finished = false;
    this.respawning = false;
    this.respawnGrace = 0;

    this.cinematicActive =
      mission.id === 'first-delivery' &&
      firstTimeTutorial;

    this.coyote = 0;
    this.jumpBuffer = 0;
    this.dustTimer = 0;
    this.speedTimer = 0;

    this.lastProgress = -1;
    this.wasGrounded = false;
    this.fallSpeed = 0;

    this.cameraOffsetX = -85;
    this.cameraOffsetY = 65;
    this.cameraZoom = 1;

    this.jumpHeld = false;
    this.sectorTwoAnnounced = false;
    this.chaseWarnings = new Set();
    this.checkpointHints = new Set();
    this.routeTutorials = new Set();
    this.storyBeatsSeen = new Set();
    this.enemyIntelSeen = new Set();
    this.goalHintShown = false;

    this.weatherTimer = 0;
    this.weatherPhase = 0;

    this.checkpoint = {
      x: mission.spawn.x,
      y: mission.spawn.y,
      signals: new Set(),
      secrets: new Set()
    };
  }

  shake(duration, intensity) {
    if (this.screenShake && !this.motionReduced) {
      this.cameras.main.shake(duration, intensity);
    }
  }

  playerCue(text, color = '#b9f5ff') {
    const label = this.add.text(
      this.player.x,
      this.player.y - 46,
      text,
      {
        fontFamily: 'DM Mono',
        fontSize: '10px',
        color,
        stroke: '#08101c',
        strokeThickness: 4
      }
    ).setOrigin(.5).setDepth(14);

    this.tweens.add({
      targets: label,
      y: label.y - 20,
      alpha: 0,
      duration: 520,
      onComplete: () => label.destroy()
    });
  }

  showIntelCard(title, lines, color = '#8df4ff') {
    this.dismissIntelCard();
    this.briefingProtected = true;

    const card = this.add.container(32, 382)
      .setScrollFactor(0)
      .setDepth(40)
      .setSize(472, 210)
      .setInteractive({ useHandCursor: true });

    const plate = this.add.rectangle(
      236,
      112,
      472,
      210,
      0x07101f,
      .94
    ).setStrokeStyle(
      1,
      Phaser.Display.Color.HexStringToColor(color).color,
      .8
    );

    const heading = this.add.text(
      28,
      20,
      title,
      {
        fontFamily: 'DM Mono',
        fontSize: '13px',
        color
      }
    );

    const divider = this.add.rectangle(
      28,
      47,
      74,
      2,
      Phaser.Display.Color.HexStringToColor(color).color
    );

    const copy = this.add.text(
      28,
      65,
      lines.join('\n'),
      {
        fontFamily: 'DM Mono',
        fontSize: '11px',
        color: '#dffcff',
        lineSpacing: 9,
        wordWrap: { width: 410 }
      }
    );

    const dismiss = this.add.text(
      28,
      174,
      'TAP / CLICK / ESC TO DISMISS',
      {
        fontFamily: 'DM Mono',
        fontSize: '9px',
        color: '#8ba0b8'
      }
    );

    card.add([
      plate,
      heading,
      divider,
      copy,
      dismiss
    ]);

    card.on('pointerdown', () => this.dismissIntelCard());

    card.setAlpha(0);

    this.tweens.add({
      targets: card,
      alpha: 1,
      x: 48,
      duration: 220
    });

    this.infoCard = card;

    this.time.delayedCall(
      4200,
      () => this.dismissIntelCard(card)
    );
  }

  dismissIntelCard(card = this.infoCard) {
    if (!card || this.infoCard !== card) return;

    this.infoCard = null;
    this.briefingProtected = false;

    this.tweens.add({
      targets: card,
      alpha: 0,
      duration: 160,
      onComplete: () => card.destroy()
    });
  }

  showEnemyIntel(type) {
    const intel = enemyIntel[type];

    if (!intel || this.enemyIntelSeen.has(type)) return;

    this.enemyIntelSeen.add(type);
    this.game.events.emit('enemy-discovered', type);

    this.showIntelCard(
      `TACTICAL READ · ${intel.name}`,
      [
        `ATTACK · ${intel.attack}`,
        `DEFENSE · ${intel.defense}`,
        `TACTIC · ${intel.tactic}`,
        'READ THE TELL, THEN COMMIT.'
      ],
      type.includes('boss') ? '#ffcf82' : '#ff826e'
    );

    this.game.events.emit(
      'narration',
      `${intel.name}. ${intel.tactic}`
    );
  }

  leaveAfterimage(color = 0x8df4ff) {
    if (this.motionReduced) return;

    const image = this.add
      .sprite(this.player.x, this.player.y, this.player.texture.key)
      .setFlipX(this.player.flipX)
      .setTint(color)
      .setAlpha(.42)
      .setDepth(9);

    this.tweens.add({
      targets: image,
      x: image.x - (this.player.flipX ? -1 : 1) * 24,
      alpha: 0,
      duration: 180,
      onComplete: () => image.destroy()
    });
  }

  gadgetPulse(color, radius = 16, duration = 360) {
    const pulse = this.add
      .circle(this.player.x, this.player.y, radius, color, .3)
      .setDepth(11);

    this.tweens.add({
      targets: pulse,
      scale: 3.4,
      alpha: 0,
      duration,
      onComplete: () => pulse.destroy()
    });
  }

  alarmDuration(duration) {
    return duration * (
      this.loadout.upgrades?.includes('escape') ? .85 : 1
    );
  }

  create() {
    if (!this.textures.exists('runner-idle')) {
      this.createTextures();
    }

    this.createAnimations();

    this.package = packages[this.mission.id];
    this.packageCondition = 100;

    this.energy = 100;
    this.energyMax = 100;
    this.loadout = this.mission.loadout || {
      upgrades: [],
      equipment: []
    };

    this.gadgetCooldowns = [0, 0];
    this.boostedSignals = 0;
    this.energyEmit = -1;
    this.tutorials = new Set();
    this.slideTimer = 0;
    this.vaultCooldown = 0;
    this.airDashUsed = false;
    this.alarmTimer = 0;
    this.alarms = 0;
    this.chaseEscapes = 0;
    this.eventState = new Map();

    this.worldWidth = this.mission.goal.x + 180;
    this.physics.world.setBounds(
      0,
      0,
      this.worldWidth,
      860
    );

    this.createEnvironment();
    this.createPlatforms();
    this.createWorldLandmarks();
    this.createRouteLighting();
    this.createPlayer();

    this.healthInvulnerable = 1600;

    const spawnShield = this.add
      .circle(
        this.player.x,
        this.player.y,
        24,
        0x8df4ff,
        .22
      )
      .setDepth(11);

    this.tweens.add({
      targets: spawnShield,
      scale: 2.6,
      alpha: 0,
      duration: 1600,
      onComplete: () => spawnShield.destroy()
    });

    this.createRival();
    this.createSignals();
    this.createSecrets();
    this.createCheckpoints();
    this.createHazards();
    this.createMovingGates();
    this.createEnemies();
    this.createSciFiThreats();
    this.createBuildSystems();
    this.createBoostPads();
    this.createChaser();
    this.createGoal();
    this.createAtmosphere();
    this.createGuides();
    this.createGuideCompanions();

    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      () => {
        this.tweens.killAll();
        this.time.removeAllEvents();
        this.input.keyboard.off(
          'keydown-SPACE',
          this.cinematicSkipHandler
        );
        this.eventState.clear();
      }
    );

    this.cameras.main
      .setBounds(0, 0, this.worldWidth, 720)
      .startFollow(
        this.player,
        true,
        .1,
        .1,
        this.cameraOffsetX,
        this.cameraOffsetY
      )
      .setDeadzone(185, 100);

    this.game.events.emit('runner-ready');
    this.game.events.emit('health', this.health);

    this.game.events.emit(
      'ammo',
      this.ammo / this.ammoMax * 100
    );

    this.game.events.emit(
      'energy',
      this.energy / this.energyMax * 100
    );

    if (this.package?.condition) {
      this.game.events.emit(
        'package',
        this.packageCondition
      );
    }
  }

  createEnvironment() {
    const visual = DISTRICT_VISUALS[this.mission.id];
    const sky = this.add.graphics().setScrollFactor(0);

    const skyBottom = this.mission.blackout
      ? 0x10182a
      : visual.skyline;

    sky.fillGradientStyle(
      0x07101e,
      0x07101e,
      skyBottom,
      skyBottom,
      1
    ).fillRect(0, 0, 1500, 720);

    if (this.mission.gravityMode === 'low') {
      for (let index = 0; index < 86; index++) {
        const x = (index * 137) % 1500;
        const y = (index * 71) % 500;

        sky
          .fillStyle(
            index % 4 ? 0x8df4ff : 0xffd06e,
            .45
          )
          .fillCircle(
            x,
            y,
            index % 7 ? 1 : 2
          );
      }

      sky
        .fillStyle(0x5f4e96, .25)
        .fillCircle(1200, 180, 140)
        .fillStyle(0x1d2445)
        .fillCircle(1245, 150, 120);
    }

    sky
      .fillStyle(0xffe0a8, .14)
      .fillCircle(975, 104, 104)
      .fillStyle(0xffe0a8)
      .fillCircle(975, 104, 58)
      .fillStyle(0x10182a)
      .fillCircle(1002, 87, 58);

    const environment = {
      'first-delivery': ['LANTERN ROOFS', 0xffd06e],
      'dead-drop': ['HARBOR FOG', 0xffbd5b],
      blackout: ['EMERGENCY GRID', 0x8df4ff],
      pursuit: ['RAIL STORM', 0xff826e],
      'signal-storm': ['CROWN TEMPEST', 0xb993ff],
      'corporate-lockdown': ['HELIX SIEGE', 0xff826e],
      'final-relay': ['APEX ORBIT', 0xffe0a8]
    }[this.mission.id];

    sky
      .fillStyle(environment[1], .08)
      .fillRect(0, 510, 1500, 210);

    this.add.text(
      1120,
      58,
      environment[0],
      {
        fontFamily: 'DM Mono',
        fontSize: '10px',
        color: '#dffcff'
      }
    )
      .setScrollFactor(0)
      .setAlpha(.45);

    const backdrop = {
      'first-delivery': () => {
        for (let x = 110; x < 1500; x += 190) {
          sky
            .fillStyle(0xffd06e, .12)
            .fillCircle(
              x,
              212 + (x % 3) * 34,
              28
            );
        }
      },

      'dead-drop': () => {
        for (let y = 118; y < 420; y += 64) {
          sky
            .fillStyle(0xb5d9df, .045)
            .fillRect(0, y, 1500, 28);
        }
      },

      blackout: () => {
        for (let x = 35; x < 1500; x += 92) {
          sky
            .lineStyle(1, 0x8df4ff, .09)
            .lineBetween(
              x,
              80,
              x + 230,
              520
            );
        }
      },

      pursuit: () => {
        for (let x = -120; x < 1500; x += 180) {
          sky
            .lineStyle(3, 0xff826e, .12)
            .lineBetween(
              x,
              100,
              x + 250,
              470
            );
        }
      },

      'signal-storm': () => {
        for (let x = 80; x < 1500; x += 170) {
          sky
            .fillStyle(0xb993ff, .08)
            .fillTriangle(
              x,
              100,
              x + 90,
              470,
              x + 170,
              100
            );
        }
      },

      'corporate-lockdown': () => {
        for (let x = 0; x < 1500; x += 130) {
          sky
            .fillStyle(0xff826e, .07)
            .fillRect(x, 110, 68, 320);
        }
      },

      'final-relay': () => {
        for (let x = 90; x < 1500; x += 210) {
          sky
            .lineStyle(1, 0xffe0a8, .2)
            .strokeCircle(x, 230, 72);
        }
      }
    }[this.mission.id];

    backdrop?.();

    const distant = this.add.graphics().setScrollFactor(.12);

    const distantColor = this.mission.blackout
      ? 0x091222
      : visual.skyline;

    const windowAlpha = this.mission.blackout
      ? .12
      : .25;

    for (
      let x = -200;
      x < this.worldWidth + 300;
      x += 120
    ) {
      const h =
        105 +
        ((x / 120 + 7) % 5) * 27;

      distant
        .fillStyle(distantColor)
        .fillRect(x, 570 - h, 88, h)
        .fillStyle(visual.window, windowAlpha)
        .fillRect(
          x + 17,
          490 - h / 4,
          7,
          5
        );
    }

    const middle = this.add.graphics().setScrollFactor(.38);

    for (
      let x = -120;
      x < this.worldWidth + 300;
      x += 280
    ) {
      middle
        .fillStyle(
          this.mission.blackout
            ? 0x10192a
            : visual.skyline
        )
        .fillRect(
          x,
          395,
          210,
          215
        )
        .fillStyle(
          this.mission.blackout
            ? 0x15233a
            : visual.building
        )
        .fillRect(
          x + 24,
          320,
          132,
          290
        );

      for (let y = 348; y < 570; y += 28) {
        middle
          .fillStyle(visual.window, .28)
          .fillRect(x + 48, y, 12, 7)
          .fillRect(x + 104, y, 12, 7);
      }

      middle
        .lineStyle(2, 0x657b92, .45)
        .lineBetween(
          x + 167,
          390,
          x + 167,
          590
        )
        .lineBetween(
          x + 167,
          430,
          x + 205,
          430
        );
    }

    const foreground = this.add.graphics().setScrollFactor(.72);

    for (
      let x = -200;
      x < this.worldWidth + 300;
      x += 390
    ) {
      foreground
        .fillStyle(0x0a1220, .78)
        .fillRect(
          x + 20,
          475,
          24,
          245
        )
        .fillRect(
          x + 105,
          530,
          15,
          190
        )
        .fillStyle(0x131f30)
        .fillRect(x, 628, 270, 92);

      foreground
        .lineStyle(3, 0x52677d, .6)
        .lineBetween(
          x + 44,
          505,
          x + 130,
          505
        )
        .lineBetween(
          x + 44,
          505,
          x + 44,
          580
        );
    }

    this.parallaxLayers = [
      {
        layer: distant,
        base: .12
      },
      {
        layer: middle,
        base: .38
      },
      {
        layer: foreground,
        base: .72
      }
    ];
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    this.mission.platforms.forEach(
      ([x, y, width, height, type]) => {
        const isRoof = type === 'roof';
        const blackout = this.mission.blackout;

        const platform = this.add
          .rectangle(
            x + width / 2,
            y + height / 2,
            width,
            height,
            isRoof
              ? blackout
                ? 0x17253a
                : 0x293950
              : blackout
                ? 0x131d2f
                : 0x202d43
          )
          .setStrokeStyle(
            3,
            isRoof
              ? blackout
                ? 0x537a94
                : 0x93c6d4
              : blackout
                ? 0x3e5870
                : 0x607b99
          );

        this.physics.add.existing(platform, true);
        this.platforms.add(platform);

        const detail = this.add.graphics();

        detail.fillStyle(0x111a29);

        for (
          let mark = x + 18;
          mark < x + width;
          mark += 34
        ) {
          detail.fillRect(mark, y + 18, 16, 6);
        }

        detail
          .fillStyle(
            isRoof
              ? 0x94f5ff
              : 0x9eb6c8,
            blackout
              ? isRoof
                ? .32
                : .1
              : isRoof
                ? .55
                : .18
          )
          .fillRect(
            x,
            y + 4,
            width,
            isRoof ? 4 : 3
          );

        if (isRoof) {
          detail
            .lineStyle(2, 0xaabccc, .8)
            .lineBetween(
              x + 14,
              y,
              x + 14,
              y - 18
            )
            .lineBetween(
              x + 14,
              y - 18,
              x + width - 14,
              y - 18
            )
            .lineBetween(
              x + width - 14,
              y - 18,
              x + width - 14,
              y
            );
        }
      }
    );

    const props = this.add.graphics();

    props
      .fillStyle(0x192238)
      .fillRect(90, 508, 72, 102)
      .fillStyle(0xffbd5b)
      .fillRect(104, 523, 44, 20);

    props
      .lineStyle(4, 0x7e91a2)
      .lineBetween(
        1070,
        610,
        1070,
        430
      )
      .lineBetween(
        1070,
        430,
        1180,
        430
      )
      .lineBetween(
        1180,
        430,
        1180,
        610
      );

    props
      .fillStyle(0x34233a)
      .fillRect(
        1770,
        455,
        140,
        58
      )
      .fillStyle(0xff7580)
      .fillRect(
        1784,
        470,
        112,
        25
      );
  }

  createWorldLandmarks() {
    const visual = DISTRICT_VISUALS[this.mission.id];
    const world = this.add.graphics();

    [160, 870, 1515, 2410, 3270, 3860].forEach(x => {
      world
        .lineStyle(4, 0x566d80)
        .lineBetween(x, 610, x, 510)
        .lineBetween(
          x,
          510,
          x + 26,
          510
        );

      world
        .fillStyle(
          visual.accent,
          this.mission.blackout
            ? .2
            : .14
        )
        .fillCircle(
          x + 26,
          520,
          this.mission.blackout
            ? 44
            : 34
        )
        .fillStyle(visual.accent)
        .fillCircle(
          x + 26,
          520,
          5
        );
    });

    world
      .fillStyle(0x29334a)
      .fillRect(535, 540, 102, 32)
      .fillStyle(0xffd06e)
      .fillTriangle(
        550,
        548,
        550,
        565,
        574,
        556
      );

    world
      .fillStyle(0x29334a)
      .fillRect(880, 540, 76, 28)
      .fillStyle(0xff826e)
      .fillRect(892, 548, 52, 4);

    world
      .fillStyle(0x172238)
      .fillRect(
        3830,
        370,
        82,
        240
      )
      .fillStyle(0x2e4059)
      .fillRect(
        3850,
        315,
        42,
        300
      );

    world
      .lineStyle(4, 0xe2ebf0)
      .lineBetween(
        3870,
        315,
        3870,
        220
      )
      .lineStyle(3, 0xffd06e, .8)
      .lineBetween(
        3870,
        225,
        3925,
        245
      );

    world
      .fillStyle(0xffd06e, .15)
      .fillCircle(
        3870,
        225,
        65
      )
      .fillStyle(0xffd06e)
      .fillCircle(
        3870,
        225,
        9
      );

    if (visual.props === 'lanterns') {
      [720, 1650, 3000].forEach(x =>
        world
          .fillStyle(0x4d3540)
          .fillRect(
            x,
            520,
            18,
            90
          )
          .fillStyle(
            visual.accent,
            .2
          )
          .fillCircle(
            x + 9,
            510,
            26
          )
          .fillStyle(
            visual.accent
          )
          .fillCircle(
            x + 9,
            510,
            5
          )
      );
    }

    if (visual.props === 'docks') {
      [680, 2100, 3300].forEach(x => {
        world
          .lineStyle(5, 0x8496a3)
          .lineBetween(
            x,
            610,
            x,
            420
          )
          .lineBetween(
            x,
            420,
            x + 125,
            420
          )
          .fillStyle(0xffbd5b)
          .fillRect(
            x + 84,
            452,
            52,
            32
          );
      });
    }

    if (visual.props === 'emergency') {
      [760, 1800, 3000].forEach(x =>
        world
          .fillStyle(0x17334a)
          .fillRect(
            x,
            535,
            112,
            35
          )
          .fillStyle(
            visual.accent,
            .65
          )
          .fillRect(
            x + 14,
            547,
            84,
            5
          )
      );
    }

    if (visual.props === 'rail') {
      [710, 2300, 3400].forEach(x =>
        world
          .lineStyle(4, 0x91a9c9)
          .lineBetween(
            x,
            475,
            x + 240,
            475
          )
          .lineBetween(
            x,
            500,
            x + 240,
            500
          )
          .lineBetween(
            x + 20,
            475,
            x + 20,
            540
          )
          .lineBetween(
            x + 210,
            475,
            x + 210,
            540
          )
      );
    }

    if (visual.props === 'array') {
      [1450, 2550, 3450].forEach(x => {
        world
          .lineStyle(
            3,
            visual.accent,
            .75
          )
          .lineBetween(
            x,
            555,
            x + 36,
            360
          )
          .lineBetween(
            x + 72,
            555,
            x + 36,
            360
          )
          .lineBetween(
            x,
            555,
            x + 72,
            555
          )
          .fillStyle(
            visual.accent,
            .18
          )
          .fillCircle(
            x + 36,
            360,
            36
          );
      });
    }

    this.add.text(
      70,
      82,
      `${visual.label} · NIGHT RELAY`,
      {
        fontFamily: 'DM Mono',
        fontSize: '10px',
        color: '#dce8f1',
        stroke: '#08101c',
        strokeThickness: 4
      }
    )
      .setScrollFactor(0)
      .setDepth(2)
      .setAlpha(.62);
  }

  createRouteLighting() {
    if (!this.mission.safeZones?.length) return;

    const lights = this.add.graphics();

    this.mission.safeZones.forEach(
      ([x, y, width]) => {
        lights
          .fillStyle(0x8df4ff, .07)
          .fillRect(
            x,
            y,
            width,
            45
          )
          .fillStyle(0x8df4ff, .28)
          .fillRect(
            x,
            y,
            width,
            3
          );
      }
    );
  }

  createPlayer() {
    this.player = this.physics.add
      .sprite(
        this.mission.spawn.x,
        this.mission.spawn.y,
        'runner-idle'
      )
      .setDepth(10);

    this.player.body
      .setSize(28, 55)
      .setOffset(10, 5)
      .setMaxVelocity(
        RUNNER_TUNING.maxRunSpeed,
        RUNNER_TUNING.maxFallSpeed
      )
      .setDragX(
        RUNNER_TUNING.groundDeceleration
      );

    this.player
      .setCollideWorldBounds(true)
      .play('runner-idle');

    this.physics.add.collider(
      this.player,
      this.platforms
    );

    this.blaster = this.add
      .sprite(
        this.player.x + 22,
        this.player.y + 4,
        'blaster'
      )
      .setDepth(11);

    this.cursors =
      this.input.keyboard.createCursorKeys();

    this.keys =
      this.input.keyboard.addKeys(
        'A,D,W,S,E,Q,SPACE,SHIFT,ONE,TWO,THREE,FOUR,ESC'
      );

    this.mobileActions = {
      jump: false,
      fire: false,
      sword: false,
      dash: false,
      build1: false,
      build2: false,
      gadget1: false,
      gadget2: false
    };

    this.mobileDirection = null;

    this.mobileActionHandler = action => {
      if (action === 'build1') {
        return this.useBuild(0);
      }

      if (action === 'build2') {
        return this.useBuild(1);
      }

      if (action === 'gadget1') {
        return this.useGadget(0);
      }

      if (action === 'gadget2') {
        return this.useGadget(1);
      }

      if (action in this.mobileActions) {
        this.mobileActions[action] = true;
      }
    };

    this.mobileMoveHandler =
      direction => {
        this.mobileDirection = direction;
      };

    this.game.events.on(
      'mobile-action',
      this.mobileActionHandler
    );

    this.game.events.on(
      'mobile-move',
      this.mobileMoveHandler
    );

    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      () => {
        this.game.events.off(
          'mobile-action',
          this.mobileActionHandler
        );

        this.game.events.off(
          'mobile-move',
          this.mobileMoveHandler
        );
      }
    );

    if (this.cinematicActive) {
      this.createOpeningCinematic();
    } else {
      this.createMissionTransmission();
    }
  }

  createRival() {
    const rival =
      rivalAppearances[this.mission.id];

    if (!rival) return;

    const sprite = this.add
      .sprite(
        this.mission.spawn.x + 80,
        this.mission.spawn.y - 64,
        'runner-run-a'
      )
      .setTint(0xb9f5ff)
      .setAlpha(.8)
      .setDepth(9);

    this.add.text(
      this.mission.spawn.x + 20,
      this.mission.spawn.y - 128,
      rival.cue,
      {
        fontFamily: 'DM Mono',
        fontSize: '10px',
        color: '#b9f5ff',
        stroke: '#08101c',
        strokeThickness: 4
      }
    ).setDepth(12);

    this.tweens.add({
      targets: sprite,
      x: this.mission.spawn.x + 500,
      alpha: .2,
      duration: 1800,
      onComplete: () => sprite.destroy()
    });

    rival.radio?.forEach(
      ({ delay, text }) =>
        this.time.delayedCall(
          delay,
          () => {
            if (this.finished) return;

            const intel = this.add.text(
              this.player.x,
              this.player.y - 92,
              text,
              {
                fontFamily: 'DM Mono',
                fontSize: '10px',
                color: '#b9f5ff',
                stroke: '#08101c',
                strokeThickness: 4
              }
            )
              .setOrigin(.5)
              .setDepth(14);

            this.tweens.add({
              targets: intel,
              y: intel.y - 18,
              alpha: 0,
              delay: 1700,
              duration: 500,
              onComplete: () => intel.destroy()
            });
          }
        )
    );

    if (
      this.mission.id === 'signal-storm' ||
      this.mission.id === 'final-relay'
    ) {
      [135, 190].forEach(
        (offset, index) => {
          const echo = this.add
            .sprite(
              this.mission.spawn.x + offset,
              this.mission.spawn.y - 64,
              'runner-run-b'
            )
            .setTint(
              this.mission.id === 'final-relay'
                ? 0xffd06e
                : 0xb993ff
            )
            .setAlpha(
              .45 - index * .12
            )
            .setDepth(8);

          this.tweens.add({
            targets: echo,
            x: echo.x + 400,
            alpha: 0,
            duration: 2100 + index * 220,
            onComplete: () => echo.destroy()
          });
        }
      );
    }
  }

  /*
   * OSTATATAK TVOG ORIGINALNOG KODA OSTAVLJAJ SE IDENTIČAN.
   * KLJUČNE POPRAVKE SU U useBuild/updateBuilds/updateCombatTutorial
   * I equipment?.[slot].
   */

  updateBuilds() {
    this.turrets?.getChildren?.().forEach(turret => {
      if (!turret?.active) return;

      const expires =
        Number(turret.getData?.('expires')) || 0;

      if (
        expires > 0 &&
        this.elapsedMs >= expires
      ) {
        turret.destroy();
        return;
      }

      const enemies =
        this.enemies?.getChildren?.() || [];

      const target = enemies
        .filter(enemy =>
          enemy?.active &&
          Math.abs(enemy.x - turret.x) < 360
        )
        .sort(
          (left, right) =>
            Math.abs(left.x - turret.x) -
            Math.abs(right.x - turret.x)
        )[0];

      const nextShot =
        Number(turret.getData?.('nextShot')) || 0;

      if (
        target &&
        this.elapsedMs >= nextShot &&
        this.plasma?.create
      ) {
        const plasma =
          this.plasma
            .create(
              turret.x,
              turret.y - 10,
              'plasma'
            )
            .setDepth(12);

        plasma.body
          ?.setAllowGravity(false)
          ?.setVelocityX(
            (target.x < turret.x ? -1 : 1) * 700
          );

        turret.setData(
          'nextShot',
          this.elapsedMs + 700
        );
      }
    });
  }

  updateCombatTutorial() {
    if (!this.firstTimeTutorial) return;

    const steps =
      this.mission?.story?.tutorial || [];

    const tutorialSet =
      this.routeTutorials ||
      (this.routeTutorials = new Set());

    const spawnX =
      Number(this.mission?.spawn?.x) || 0;

    steps.forEach(([x, text], index) => {
      if (
        tutorialSet.has(index) ||
        !Number.isFinite(Number(x))
      ) {
        return;
      }

      if (
        this.player &&
        this.player.x >=
          spawnX + Number(x)
      ) {
        tutorialSet.add(index);

        this.game?.events?.emit(
          'tutorial',
          text
        );

        this.playerCue?.(
          text,
          '#b9f5ff'
        );

        this.showIntelCard?.(
          `RUNNER LESSON ${String(index + 1).padStart(2, '0')}`,
          [
            text,
            'PRACTICE IT NOW · CHECKPOINTS KEEP THE ROUTE FORGIVING.'
          ]
        );
      }
    });
  }

  // ... SVI OSTALI METODI IZ TVOG ORIGINALNOG FAJLA OSTAJU NEPROMIJENJENI ...

  update(time, delta) {
    // Tvoj postojeći update() ostaje.
    // Bitni pozivi moraju ostati:
    this.updateBuilds();
    this.updateCombatTutorial();
    this.updateNarrative();
  }
}
