import Phaser from 'phaser';
import { packages } from '../packages.js';
import { rivalAppearances } from '../world-content.js';
import { enemyIntel, signatureThreats } from '../enemy-intel.js';
import titleBackdropUrl from '../../assets/title-city-backdrop-v2.png';

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

  preload() {
    if (!this.textures.exists('runner-city-backdrop')) this.load.image('runner-city-backdrop', titleBackdropUrl);
  }

  createTextures() {
    const make = (key, width, height, draw) => {
      const graphics = this.make.graphics({ add: false });
      draw(graphics); graphics.generateTexture(key, width, height); graphics.destroy();
    };
    const runner = (key, leftLeg, rightLeg, arm) => make(key, 48, 64, g => {
      g.fillStyle(0xf3eee4).fillCircle(24, 12, 10).fillStyle(0x202a3d).fillRect(14, 21, 20, 5);
      g.fillStyle(0xff756d).fillRoundedRect(14, 23, 20, 24, 5).fillStyle(0xffd06e).fillRect(14, 29, 20, 5);
      g.lineStyle(5, 0xf3eee4).lineBetween(15, 30, 8, arm).lineBetween(33, 30, 40, 42 - arm / 5);
      g.lineStyle(7, 0xaee37f).lineBetween(19, 45, 16, leftLeg).lineBetween(29, 45, 33, rightLeg);
    });
    // Generated textures are isolated here so authored sprite sheets can replace them later.
    runner('runner-idle', 60, 60, 40); runner('runner-run-a', 56, 63, 50); runner('runner-run-b', 63, 56, 27); runner('runner-jump', 54, 54, 30); runner('runner-fall', 62, 62, 58); runner('runner-land', 55, 55, 42); runner('runner-dash', 54, 54, 22); runner('runner-wall', 56, 62, 18); runner('runner-hit', 62, 62, 62); runner('runner-finish', 50, 50, 18);
    make('signal', 56, 56, g => {
      g.fillStyle(0xffd06e, .08).fillCircle(28, 28, 27).fillStyle(0xffd06e, .2).fillCircle(28, 28, 20);
      g.lineStyle(2, 0xffe6a6, .85).strokeCircle(28, 28, 15).lineBetween(28, 6, 28, 15).lineBetween(28, 41, 28, 50);
      g.fillStyle(0xffe7a6).fillCircle(28, 28, 8).fillStyle(0xff826e).fillCircle(28, 28, 3);
    });
    make('barrier', 48, 64, g => g.fillStyle(0x202b39).fillRect(3, 3, 42, 58).lineStyle(3, 0xff826e).strokeRect(4, 4, 40, 56).lineBetween(7, 8, 41, 56).lineBetween(41, 8, 7, 56));
    make('goal', 56, 68, g => g.lineStyle(4, 0xe5ecf1).lineBetween(10, 66, 10, 4).fillStyle(0xffd06e).fillTriangle(12, 9, 48, 21, 12, 36));
    make('rain', 8, 14, g => g.lineStyle(2, 0xd9e9ff, .45).lineBetween(6, 0, 1, 13));
    make('dust', 10, 10, g => g.fillStyle(0xd6dbe2, .65).fillCircle(5, 5, 4));
    make('speed-line', 32, 3, g => g.fillGradientStyle(0xb9e9ff, 0xb9e9ff, 0xb9e9ff, 0xb9e9ff, 0, .65, .65, 0).fillRect(0, 0, 32, 3));
    make('boost-pad', 58, 18, g => g.fillStyle(0x17263b).fillRoundedRect(0, 2, 58, 14, 4).fillStyle(0x8df4ff).fillTriangle(10, 13, 20, 5, 30, 13).fillTriangle(27, 13, 37, 5, 47, 13));
    make('chaser', 52, 60, g => g.fillStyle(0xff826e, .14).fillCircle(26, 28, 25).fillStyle(0x172238).fillRoundedRect(10, 8, 32, 42, 7).lineStyle(2, 0xff826e).strokeRoundedRect(10, 8, 32, 42, 7).fillStyle(0xff826e).fillRect(16, 20, 20, 5));
    make('checkpoint', 30, 54, g => g.lineStyle(3, 0x8df4ff).lineBetween(6, 52, 6, 4).fillStyle(0x8df4ff, .2).fillTriangle(8, 6, 27, 14, 8, 23).lineStyle(1, 0xdffcff).strokeTriangle(8, 6, 27, 14, 8, 23));
    make('security', 42, 34, g => g.fillStyle(0xff826e, .14).fillCircle(21, 17, 20).fillStyle(0x172238).fillRoundedRect(5, 8, 32, 20, 8).lineStyle(2, 0xff826e).strokeRoundedRect(5, 8, 32, 20, 8).fillStyle(0xff826e).fillCircle(28, 17, 4));
    make('guard', 32, 58, g => g.fillStyle(0x172238).fillRoundedRect(6, 7, 20, 44, 5).lineStyle(2, 0xff826e).strokeRoundedRect(6, 7, 20, 44, 5).fillStyle(0xffd06e).fillRect(10, 16, 12, 4));
    make('enemy-runner', 48, 64, g => { g.fillStyle(0xd5f0ff).fillCircle(24, 12, 10).fillStyle(0x241b35).fillRect(14, 21, 20, 5); g.fillStyle(0x6b3f83).fillRoundedRect(14, 23, 20, 24, 5).fillStyle(0xff826e).fillRect(14, 29, 20, 5); g.lineStyle(5, 0xd5f0ff).lineBetween(15, 30, 8, 42).lineBetween(33, 30, 40, 35); g.lineStyle(7, 0xff826e).lineBetween(19, 45, 16, 60).lineBetween(29, 45, 33, 60); });
    make('invader', 48, 38, g => g.fillStyle(0x5b3d82).fillRoundedRect(4, 9, 40, 23, 10).lineStyle(2, 0xe0a7ff).strokeRoundedRect(4, 9, 40, 23, 10).fillStyle(0xe0a7ff).fillCircle(17, 20, 4).fillCircle(31, 20, 4));
    make('chicken', 42, 38, g => g.fillStyle(0xf4f0e7).fillCircle(20, 22, 15).fillCircle(28, 10, 9).fillStyle(0xffd06e).fillTriangle(35, 11, 43, 15, 35, 19).fillStyle(0xff826e).fillCircle(26, 2, 4));
    make('dino', 68, 48, g => g.fillStyle(0x72a66a).fillRoundedRect(7, 16, 48, 24, 9).fillTriangle(0, 25, 14, 10, 14, 40).fillStyle(0xdff0b0).fillCircle(50, 17, 5).fillStyle(0x172238).fillCircle(51, 16, 2));
    make('dino-boss', 112, 82, g => g.fillStyle(0x4f855f).fillRoundedRect(12, 25, 80, 38, 13).fillTriangle(0, 43, 20, 12, 20, 70).lineStyle(3, 0xdff0b0).strokeRoundedRect(12, 25, 80, 38, 13).fillStyle(0xffd06e).fillCircle(82, 28, 8).fillStyle(0x172238).fillCircle(83, 28, 3));
    make('sentinel-boss', 90, 92, g => g.fillStyle(0x203d5a).fillRoundedRect(18, 18, 54, 62, 12).lineStyle(3, 0x8df4ff).strokeRoundedRect(18, 18, 54, 62, 12).fillStyle(0x8df4ff, .28).fillCircle(45, 42, 23).fillStyle(0xe2fbff).fillCircle(45, 42, 8).fillStyle(0xff826e).fillRect(30, 65, 30, 7));
    make('storm-boss', 104, 86, g => g.fillStyle(0x3f356e).fillTriangle(4, 46, 40, 8, 78, 46).fillTriangle(26, 48, 64, 12, 100, 48).fillStyle(0xb993ff, .32).fillCircle(52, 44, 35).lineStyle(3, 0xe0a7ff).strokeCircle(52, 44, 22).fillStyle(0xffd06e).fillCircle(52, 44, 8));
    make('apex-boss', 108, 96, g => g.fillStyle(0x382844).fillRoundedRect(14, 18, 80, 68, 16).lineStyle(3, 0xffd06e).strokeRoundedRect(14, 18, 80, 68, 16).fillStyle(0xff826e, .22).fillCircle(54, 43, 28).fillStyle(0xffe0a8).fillCircle(54, 43, 9).fillStyle(0x8df4ff).fillRect(30, 69, 48, 7));
    make('alien-ground', 54, 54, g => g.fillStyle(0x402d64).fillRoundedRect(7, 12, 40, 36, 12).lineStyle(2, 0xe0a7ff).strokeRoundedRect(7, 12, 40, 36, 12).fillStyle(0xe0a7ff).fillCircle(19, 26, 5).fillCircle(35, 26, 5).fillStyle(0x8df4ff).fillRect(17, 43, 20, 5));
    make('egg', 18, 24, g => g.fillStyle(0xfff3cf).fillEllipse(9, 12, 14, 21).lineStyle(1, 0xffd06e).strokeEllipse(9, 12, 14, 21));
    make('comet', 32, 32, g => g.fillStyle(0xff826e, .25).fillCircle(16, 16, 15).fillStyle(0xffd06e).fillCircle(16, 16, 8).fillStyle(0xfff3cf).fillCircle(13, 13, 3));
    make('kinetic-ball', 26, 26, g => g.fillStyle(0x8df4ff, .25).fillCircle(13, 13, 13).lineStyle(2, 0xdffcff).strokeCircle(13, 13, 10).fillStyle(0x8df4ff).fillCircle(13, 13, 5));
    make('shield', 46, 64, g => g.fillStyle(0x8df4ff, .18).fillRoundedRect(4, 2, 38, 60, 9).lineStyle(2, 0xb9f5ff).strokeRoundedRect(4, 2, 38, 60, 9));
    make('blaster', 34, 14, g => g.fillStyle(0x263853).fillRoundedRect(1, 3, 28, 8, 3).fillStyle(0x8df4ff).fillRect(21, 5, 12, 4).fillStyle(0xffd06e).fillRect(7, 11, 7, 3));
    make('sword', 52, 12, g => g.fillStyle(0xdffcff).fillTriangle(10, 6, 48, 1, 48, 11).fillStyle(0xffd06e).fillRect(3, 2, 10, 8));
    make('plasma', 18, 10, g => g.fillStyle(0x8df4ff, .25).fillEllipse(9, 5, 18, 10).fillStyle(0xe2fbff).fillEllipse(9, 5, 10, 5));
    make('turret', 42, 42, g => g.fillStyle(0x202d48).fillRoundedRect(5, 20, 32, 17, 5).fillStyle(0x8df4ff).fillRect(17, 5, 8, 20).fillStyle(0xdffcff).fillCircle(21, 13, 5));
    make('spring-pad', 56, 18, g => g.fillStyle(0x263853).fillRoundedRect(1, 3, 54, 14, 4).lineStyle(2, 0xaee37f).strokeRoundedRect(1, 3, 54, 14, 4).lineStyle(2, 0xaee37f).lineBetween(12, 13, 20, 7).lineBetween(20, 7, 28, 13).lineBetween(28, 13, 36, 7).lineBetween(36, 7, 44, 13));
    make('guide-drone', 42, 30, g => g.fillStyle(0x8df4ff, .18).fillCircle(21, 15, 19).fillStyle(0x203d5a).fillRoundedRect(6, 8, 30, 14, 7).lineStyle(2, 0x8df4ff).strokeRoundedRect(6, 8, 30, 14, 7).fillStyle(0xe2fbff).fillCircle(21, 15, 5));
    make('alien-guide', 38, 46, g => g.fillStyle(0x5b3d82).fillEllipse(19, 18, 28, 29).fillStyle(0xe0a7ff).fillCircle(13, 16, 4).fillCircle(25, 16, 4).fillStyle(0x8df4ff).fillRoundedRect(11, 29, 16, 12, 5));
  }

  createAnimations() {
    if (this.anims.exists('runner-run')) return;
    this.anims.create({ key: 'runner-idle', frames: [{ key: 'runner-idle' }], frameRate: 1 });
    this.anims.create({ key: 'runner-run', frames: [{ key: 'runner-run-a' }, { key: 'runner-run-b' }], frameRate: 11, repeat: -1 });
    this.anims.create({ key: 'runner-jump', frames: [{ key: 'runner-jump' }], frameRate: 1 });
    this.anims.create({ key: 'runner-fall', frames: [{ key: 'runner-fall' }], frameRate: 1 });
    this.anims.create({ key: 'runner-land', frames: [{ key: 'runner-land' }], frameRate: 1 });
    this.anims.create({ key: 'runner-dash', frames: [{ key: 'runner-dash' }], frameRate: 1 });
    this.anims.create({ key: 'runner-wall', frames: [{ key: 'runner-wall' }], frameRate: 1 });
    this.anims.create({ key: 'runner-hit', frames: [{ key: 'runner-hit' }], frameRate: 1 });
    this.anims.create({ key: 'runner-finish', frames: [{ key: 'runner-finish' }], frameRate: 1 });
  }

  init({ mission, runId, abilities = [], rain, screenShake = true, reducedMotion = false, firstTimeTutorial = false }) {
    this.mission = mission; this.runId = runId; this.abilities = new Set(abilities); this.rainEnabled = rain; this.screenShake = screenShake; this.motionReduced = reducedMotion; this.firstTimeTutorial = firstTimeTutorial; this.collected = 0; this.secretsCollected = 0; this.elapsedMs = 0; this.timeEmitTimer = 0; this.boostCooldown = 0; this.dashCooldown = 0; this.dashTimer = 0; this.wallJumpCooldown = 0; this.wallJumpTimer = 0; this.lowEnergyCueTimer = 0; this.health = 3; this.healthInvulnerable = 0; this.briefingProtected = false; this.ammo = 6; this.ammoMax = 6; this.ammoRecharge = 0; this.cometTimer = 3400; this.blasterCooldown = 0; this.swordCooldown = 0; this.buildCooldowns = [0, 0]; this.combatCombo = 0; this.comboTimer = 0; this.jumps = 0; this.collisions = 0; this.falls = 0; this.deaths = 0; this.deathLimit = mission.id === 'first-delivery' ? Infinity : 3; this.jumpsUsed = 0; this.finished = false; this.respawning = false; this.respawnGrace = 0; this.cinematicActive = mission.id === 'first-delivery' && firstTimeTutorial; this.coyote = 0; this.jumpBuffer = 0; this.dustTimer = 0; this.speedTimer = 0; this.lastProgress = -1; this.wasGrounded = false; this.fallSpeed = 0; this.cameraOffsetX = -85; this.cameraOffsetY = 65; this.cameraZoom = 1; this.jumpHeld = false; this.sectorTwoAnnounced = false; this.chaseWarnings = new Set(); this.checkpointHints = new Set(); this.routeTutorials = new Set(); this.storyBeatsSeen = new Set(); this.enemyIntelSeen = new Set(); this.goalHintShown = false; this.weatherTimer = 0; this.weatherPhase = 0; this.checkpoint = { x: mission.spawn.x, y: mission.spawn.y, signals: new Set(), secrets: new Set() };
  }

  shake(duration, intensity) { if (this.screenShake && !this.motionReduced) this.cameras.main.shake(duration, intensity); }
  playerCue(text, color = '#b9f5ff') {
    const label = this.add.text(this.player.x, this.player.y - 46, text, { fontFamily: 'DM Mono', fontSize: '10px', color, stroke: '#08101c', strokeThickness: 4 }).setOrigin(.5).setDepth(14);
    this.tweens.add({ targets: label, y: label.y - 20, alpha: 0, duration: 520, onComplete: () => label.destroy() });
  }
  showIntelCard(title, lines, color = '#8df4ff') {
    this.dismissIntelCard(); this.briefingProtected = true; const card = this.add.container(32, 382).setScrollFactor(0).setDepth(40).setSize(472, 210).setInteractive({ useHandCursor: true }); const plate = this.add.rectangle(236, 112, 472, 210, 0x07101f, .94).setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color, .8); const heading = this.add.text(28, 20, title, { fontFamily: 'DM Mono', fontSize: '13px', color }); const divider = this.add.rectangle(28, 47, 74, 2, Phaser.Display.Color.HexStringToColor(color).color); const copy = this.add.text(28, 65, lines.join('\n'), { fontFamily: 'DM Mono', fontSize: '11px', color: '#dffcff', lineSpacing: 9, wordWrap: { width: 410 } }); const dismiss = this.add.text(28, 174, 'TAP / CLICK / ESC TO DISMISS', { fontFamily: 'DM Mono', fontSize: '9px', color: '#8ba0b8' }); card.add([plate, heading, divider, copy, dismiss]); card.on('pointerdown', () => this.dismissIntelCard()); card.setAlpha(0); this.tweens.add({ targets: card, alpha: 1, x: 48, duration: 220 }); this.infoCard = card; this.time.delayedCall(4200, () => this.dismissIntelCard(card));
  }
  dismissIntelCard(card = this.infoCard) { if (!card || this.infoCard !== card) return; this.infoCard = null; this.briefingProtected = false; this.tweens.add({ targets: card, alpha: 0, duration: 160, onComplete: () => card.destroy() }); }
  showEnemyIntel(type) { const intel = enemyIntel[type]; if (!intel || this.enemyIntelSeen.has(type)) return; this.enemyIntelSeen.add(type); this.game.events.emit('enemy-discovered', type); this.showIntelCard(`TACTICAL READ · ${intel.name}`, [`ATTACK · ${intel.attack}`, `DEFENSE · ${intel.defense}`, `TACTIC · ${intel.tactic}`, 'READ THE TELL, THEN COMMIT.'], type.includes('boss') ? '#ffcf82' : '#ff826e'); this.game.events.emit('narration', `${intel.name}. ${intel.tactic}`); }
  leaveAfterimage(color = 0x8df4ff) {
    if (this.motionReduced) return;
    const image = this.add.sprite(this.player.x, this.player.y, this.player.texture.key).setFlipX(this.player.flipX).setTint(color).setAlpha(.42).setDepth(9);
    this.tweens.add({ targets: image, x: image.x - (this.player.flipX ? -1 : 1) * 24, alpha: 0, duration: 180, onComplete: () => image.destroy() });
  }
  gadgetPulse(color, radius = 16, duration = 360) {
    const pulse = this.add.circle(this.player.x, this.player.y, radius, color, .3).setDepth(11);
    this.tweens.add({ targets: pulse, scale: 3.4, alpha: 0, duration, onComplete: () => pulse.destroy() });
  }
  alarmDuration(duration) { return duration * (this.loadout.upgrades?.includes('escape') ? .85 : 1); }

  create() {
    if (!this.textures.exists('runner-idle')) this.createTextures();
    this.createAnimations();
    this.package = packages[this.mission.id]; this.packageCondition = 100;
    this.energy = 100; this.energyMax = 100; this.loadout = this.mission.loadout || { upgrades: [], equipment: [] }; this.gadgetCooldowns = [0, 0]; this.boostedSignals = 0; this.energyEmit = -1; this.tutorials = new Set(); this.slideTimer = 0; this.vaultCooldown = 0; this.airDashUsed = false; this.alarmTimer = 0; this.alarms = 0; this.chaseEscapes = 0; this.eventState = new Map();
    this.worldWidth = this.mission.goal.x + 180;
    this.physics.world.setBounds(0, 0, this.worldWidth, 860);
    this.createEnvironment(); this.createPlatforms(); this.createWorldLandmarks(); this.createRouteLighting(); this.createPlayer(); this.healthInvulnerable = 1600; const spawnShield = this.add.circle(this.player.x, this.player.y, 24, 0x8df4ff, .22).setDepth(11); this.tweens.add({ targets: spawnShield, scale: 2.6, alpha: 0, duration: 1600, onComplete: () => spawnShield.destroy() }); this.createRival(); this.createSignals(); this.createSecrets(); this.createCheckpoints(); this.createHazards(); this.createMovingGates(); this.createEnemies(); this.createSciFiThreats(); this.createBuildSystems(); this.createBoostPads(); this.createChaser(); this.createGoal(); this.createAtmosphere(); this.createGuides(); this.createGuideCompanions();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.tweens.killAll(); this.time.removeAllEvents(); this.input.keyboard.off('keydown-SPACE', this.cinematicSkipHandler); this.eventState.clear(); });
    this.cameras.main.setBounds(0, 0, this.worldWidth, 720).startFollow(this.player, true, .1, .1, this.cameraOffsetX, this.cameraOffsetY).setDeadzone(185, 100);
    this.game.events.emit('runner-ready'); this.game.events.emit('health', this.health); this.game.events.emit('ammo', this.ammo / this.ammoMax * 100); this.game.events.emit('energy', this.energy / this.energyMax * 100); if (this.package?.condition) this.game.events.emit('package', this.packageCondition);
  }

  createEnvironment() {
    const visual = DISTRICT_VISUALS[this.mission.id];
    const city = this.add.image(750, 360, 'runner-city-backdrop').setScrollFactor(.035).setOrigin(.5).setAlpha(.88);
    city.setScale(Math.max(1500 / city.width, 760 / city.height));
    const sky = this.add.graphics().setScrollFactor(0);
    const skyBottom = this.mission.blackout ? 0x10182a : visual.skyline;
    sky.fillStyle(0x02060d, .46).fillRect(0, 0, 1500, 720).fillStyle(skyBottom, .17).fillRect(0, 410, 1500, 310);
    if (this.mission.gravityMode === 'low') { for (let index = 0; index < 86; index++) { const x = (index * 137) % 1500; const y = (index * 71) % 500; sky.fillStyle(index % 4 ? 0x8df4ff : 0xffd06e, .45).fillCircle(x, y, index % 7 ? 1 : 2); } sky.fillStyle(0x5f4e96, .25).fillCircle(1200, 180, 140).fillStyle(0x1d2445).fillCircle(1245, 150, 120); }
    sky.fillStyle(0xffe0a8, .14).fillCircle(975, 104, 104).fillStyle(0xffe0a8).fillCircle(975, 104, 58).fillStyle(0x10182a).fillCircle(1002, 87, 58);
    const environment = { 'first-delivery': ['LANTERN ROOFS', 0xffd06e], 'dead-drop': ['HARBOR FOG', 0xffbd5b], blackout: ['EMERGENCY GRID', 0x8df4ff], pursuit: ['RAIL STORM', 0xff826e], 'signal-storm': ['CROWN TEMPEST', 0xb993ff], 'corporate-lockdown': ['HELIX SIEGE', 0xff826e], 'final-relay': ['APEX ORBIT', 0xffe0a8] }[this.mission.id];
    sky.fillStyle(environment[1], .08).fillRect(0, 510, 1500, 210); this.add.text(1120, 58, environment[0], { fontFamily: 'DM Mono', fontSize: '10px', color: '#dffcff' }).setScrollFactor(0).setAlpha(.45);
    const backdrop = { 'first-delivery': () => { for (let x = 110; x < 1500; x += 190) sky.fillStyle(0xffd06e, .12).fillCircle(x, 212 + (x % 3) * 34, 28); }, 'dead-drop': () => { for (let y = 118; y < 420; y += 64) sky.fillStyle(0xb5d9df, .045).fillRect(0, y, 1500, 28); }, blackout: () => { for (let x = 35; x < 1500; x += 92) sky.lineStyle(1, 0x8df4ff, .09).lineBetween(x, 80, x + 230, 520); }, pursuit: () => { for (let x = -120; x < 1500; x += 180) sky.lineStyle(3, 0xff826e, .12).lineBetween(x, 100, x + 250, 470); }, 'signal-storm': () => { for (let x = 80; x < 1500; x += 170) sky.fillStyle(0xb993ff, .08).fillTriangle(x, 100, x + 90, 470, x + 170, 100); }, 'corporate-lockdown': () => { for (let x = 0; x < 1500; x += 130) sky.fillStyle(0xff826e, .07).fillRect(x, 110, 68, 320); }, 'final-relay': () => { for (let x = 90; x < 1500; x += 210) sky.lineStyle(1, 0xffe0a8, .2).strokeCircle(x, 230, 72); } }[this.mission.id];
    backdrop?.();
    const distant = this.add.graphics().setScrollFactor(.12);
    const distantColor = this.mission.blackout ? 0x091222 : visual.skyline; const windowAlpha = this.mission.blackout ? .12 : .25;
    for (let x = -200; x < this.worldWidth + 300; x += 120) { const h = 105 + ((x / 120 + 7) % 5) * 27; distant.fillStyle(distantColor).fillRect(x, 570 - h, 88, h).fillStyle(visual.window, windowAlpha).fillRect(x + 17, 490 - h / 4, 7, 5); }
    const middle = this.add.graphics().setScrollFactor(.38);
    for (let x = -120; x < this.worldWidth + 300; x += 280) {
      middle.fillStyle(this.mission.blackout ? 0x10192a : visual.skyline).fillRect(x, 395, 210, 215).fillStyle(this.mission.blackout ? 0x15233a : visual.building).fillRect(x + 24, 320, 132, 290);
      for (let y = 348; y < 570; y += 28) middle.fillStyle(visual.window, .28).fillRect(x + 48, y, 12, 7).fillRect(x + 104, y, 12, 7);
      middle.lineStyle(2, 0x657b92, .45).lineBetween(x + 167, 390, x + 167, 590).lineBetween(x + 167, 430, x + 205, 430);
    }
    const foreground = this.add.graphics().setScrollFactor(.72);
    for (let x = -200; x < this.worldWidth + 300; x += 390) {
      foreground.fillStyle(0x0a1220, .78).fillRect(x + 20, 475, 24, 245).fillRect(x + 105, 530, 15, 190).fillStyle(0x131f30).fillRect(x, 628, 270, 92);
      foreground.lineStyle(3, 0x52677d, .6).lineBetween(x + 44, 505, x + 130, 505).lineBetween(x + 44, 505, x + 44, 580);
    }
    this.parallaxLayers = [{ layer: city, base: .035 }, { layer: distant, base: .12 }, { layer: middle, base: .38 }, { layer: foreground, base: .72 }];
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();
    this.mission.platforms.forEach(([x, y, width, height, type]) => {
      const isRoof = type === 'roof'; const blackout = this.mission.blackout;
      const platform = this.add.rectangle(x + width / 2, y + height / 2, width, height, isRoof ? blackout ? 0x17253a : 0x293950 : blackout ? 0x131d2f : 0x202d43).setStrokeStyle(3, isRoof ? blackout ? 0x537a94 : 0x93c6d4 : blackout ? 0x3e5870 : 0x607b99);
      this.physics.add.existing(platform, true); this.platforms.add(platform);
      const detail = this.add.graphics(); detail.fillStyle(0x111a29); for (let mark = x + 18; mark < x + width; mark += 34) detail.fillRect(mark, y + 18, 16, 6); detail.fillStyle(isRoof ? 0x94f5ff : 0x9eb6c8, blackout ? isRoof ? .32 : .1 : isRoof ? .55 : .18).fillRect(x, y + 4, width, isRoof ? 4 : 3);
      if (isRoof) detail.lineStyle(2, 0xaabccc, .8).lineBetween(x + 14, y, x + 14, y - 18).lineBetween(x + 14, y - 18, x + width - 14, y - 18).lineBetween(x + width - 14, y - 18, x + width - 14, y);
    });
    const props = this.add.graphics();
    props.fillStyle(0x192238).fillRect(90, 508, 72, 102).fillStyle(0xffbd5b).fillRect(104, 523, 44, 20);
    props.lineStyle(4, 0x7e91a2).lineBetween(1070, 610, 1070, 430).lineBetween(1070, 430, 1180, 430).lineBetween(1180, 430, 1180, 610);
    props.fillStyle(0x34233a).fillRect(1770, 455, 140, 58).fillStyle(0xff7580).fillRect(1784, 470, 112, 25);
  }

  createWorldLandmarks() {
    const visual = DISTRICT_VISUALS[this.mission.id];
    const world = this.add.graphics();
    // Lamps, directional signs, and the distant relay tower make the route readable without UI text.
    [160, 870, 1515, 2410, 3270, 3860].forEach(x => {
      world.lineStyle(4, 0x566d80).lineBetween(x, 610, x, 510).lineBetween(x, 510, x + 26, 510);
      world.fillStyle(visual.accent, this.mission.blackout ? .2 : .14).fillCircle(x + 26, 520, this.mission.blackout ? 44 : 34).fillStyle(visual.accent).fillCircle(x + 26, 520, 5);
    });
    world.fillStyle(0x29334a).fillRect(535, 540, 102, 32).fillStyle(0xffd06e).fillTriangle(550, 548, 550, 565, 574, 556);
    world.fillStyle(0x29334a).fillRect(880, 540, 76, 28).fillStyle(0xff826e).fillRect(892, 548, 52, 4);
    world.fillStyle(0x172238).fillRect(3830, 370, 82, 240).fillStyle(0x2e4059).fillRect(3850, 315, 42, 300);
    world.lineStyle(4, 0xe2ebf0).lineBetween(3870, 315, 3870, 220).lineStyle(3, 0xffd06e, .8).lineBetween(3870, 225, 3925, 245);
    world.fillStyle(0xffd06e, .15).fillCircle(3870, 225, 65).fillStyle(0xffd06e).fillCircle(3870, 225, 9);
    if (visual.props === 'lanterns') [720, 1650, 3000].forEach(x => world.fillStyle(0x4d3540).fillRect(x, 520, 18, 90).fillStyle(visual.accent, .2).fillCircle(x + 9, 510, 26).fillStyle(visual.accent).fillCircle(x + 9, 510, 5));
    if (visual.props === 'docks') [680, 2100, 3300].forEach(x => { world.lineStyle(5, 0x8496a3).lineBetween(x, 610, x, 420).lineBetween(x, 420, x + 125, 420); world.fillStyle(0xffbd5b).fillRect(x + 84, 452, 52, 32); });
    if (visual.props === 'emergency') [760, 1800, 3000].forEach(x => world.fillStyle(0x17334a).fillRect(x, 535, 112, 35).fillStyle(visual.accent, .65).fillRect(x + 14, 547, 84, 5));
    if (visual.props === 'rail') [710, 2300, 3400].forEach(x => world.lineStyle(4, 0x91a9c9).lineBetween(x, 475, x + 240, 475).lineBetween(x, 500, x + 240, 500).lineBetween(x + 20, 475, x + 20, 540).lineBetween(x + 210, 475, x + 210, 540));
    if (visual.props === 'array') [1450, 2550, 3450].forEach(x => { world.lineStyle(3, visual.accent, .75).lineBetween(x, 555, x + 36, 360).lineBetween(x + 72, 555, x + 36, 360).lineBetween(x, 555, x + 72, 555); world.fillStyle(visual.accent, .18).fillCircle(x + 36, 360, 36); });
    this.add.text(70, 82, `${visual.label} · NIGHT RELAY`, { fontFamily: 'DM Mono', fontSize: '10px', color: '#dce8f1', stroke: '#08101c', strokeThickness: 4 }).setScrollFactor(0).setDepth(2).setAlpha(.62);
  }

  createRouteLighting() {
    if (!this.mission.safeZones?.length) return;
    const lights = this.add.graphics();
    this.mission.safeZones.forEach(([x, y, width]) => { lights.fillStyle(0x8df4ff, .07).fillRect(x, y, width, 45); lights.fillStyle(0x8df4ff, .28).fillRect(x, y, width, 3); });
  }

  createPlayer() {
    this.player = this.physics.add.sprite(this.mission.spawn.x, this.mission.spawn.y, 'runner-idle').setDepth(10);
    this.player.body.setSize(28, 55).setOffset(10, 5).setMaxVelocity(RUNNER_TUNING.maxRunSpeed, RUNNER_TUNING.maxFallSpeed).setDragX(RUNNER_TUNING.groundDeceleration);
    this.player.setCollideWorldBounds(true).play('runner-idle'); this.physics.add.collider(this.player, this.platforms); this.blaster = this.add.sprite(this.player.x + 22, this.player.y + 4, 'blaster').setDepth(11);
    this.cursors = this.input.keyboard.createCursorKeys(); this.keys = this.input.keyboard.addKeys('A,D,W,S,E,Q,SPACE,SHIFT,ONE,TWO,THREE,FOUR,ESC'); this.mobileActions = { jump: false, fire: false, sword: false, dash: false, build1: false, build2: false, gadget1: false, gadget2: false }; this.mobileDirection = null; this.mobileActionHandler = action => { if (action === 'build1') return this.useBuild(0); if (action === 'build2') return this.useBuild(1); if (action === 'gadget1') return this.useGadget(0); if (action === 'gadget2') return this.useGadget(1); if (action in this.mobileActions) this.mobileActions[action] = true; }; this.mobileMoveHandler = direction => { this.mobileDirection = direction; }; this.game.events.on('mobile-action', this.mobileActionHandler); this.game.events.on('mobile-move', this.mobileMoveHandler); this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.game.events.off('mobile-action', this.mobileActionHandler); this.game.events.off('mobile-move', this.mobileMoveHandler); });
    if (this.cinematicActive) this.createOpeningCinematic(); else this.createMissionTransmission();
  }
  createRival() {
    const rival = rivalAppearances[this.mission.id]; if (!rival) return;
    const sprite = this.add.sprite(this.mission.spawn.x + 80, this.mission.spawn.y - 64, 'runner-run-a').setTint(0xb9f5ff).setAlpha(.8).setDepth(9);
    this.add.text(this.mission.spawn.x + 20, this.mission.spawn.y - 128, rival.cue, { fontFamily: 'DM Mono', fontSize: '10px', color: '#b9f5ff', stroke: '#08101c', strokeThickness: 4 }).setDepth(12);
    this.tweens.add({ targets: sprite, x: this.mission.spawn.x + 500, alpha: .2, duration: 1800, onComplete: () => sprite.destroy() });
    rival.radio?.forEach(({ delay, text }) => this.time.delayedCall(delay, () => { if (this.finished) return; const intel = this.add.text(this.player.x, this.player.y - 92, text, { fontFamily: 'DM Mono', fontSize: '10px', color: '#b9f5ff', stroke: '#08101c', strokeThickness: 4 }).setOrigin(.5).setDepth(14); this.tweens.add({ targets: intel, y: intel.y - 18, alpha: 0, delay: 1700, duration: 500, onComplete: () => intel.destroy() }); }));
    if (this.mission.id === 'signal-storm' || this.mission.id === 'final-relay') [135, 190].forEach((offset, index) => { const echo = this.add.sprite(this.mission.spawn.x + offset, this.mission.spawn.y - 64, 'runner-run-b').setTint(this.mission.id === 'final-relay' ? 0xffd06e : 0xb993ff).setAlpha(.45 - index * .12).setDepth(8); this.tweens.add({ targets: echo, x: echo.x + 400, alpha: 0, duration: 2100 + index * 220, onComplete: () => echo.destroy() }); });
  }

  createSignals() {
    this.signals = this.physics.add.group();
    this.mission.signals.forEach(([x, y], index) => {
      const signal = this.signals.create(x, y, 'signal').setImmovable(true); signal.setData('id', index); signal.body.setAllowGravity(false).setCircle(17, 11, 11); signal.setScale(.9);
      if (!this.motionReduced) this.tweens.add({ targets: signal, y: y - 9, scale: { from: .86, to: 1.02 }, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
    this.physics.add.overlap(this.player, this.signals, (_, signal) => this.collectSignal(signal), undefined, this);
  }

  createSecrets() {
    this.secrets = this.physics.add.group();
    this.mission.secrets.forEach(([x, y], index) => { const secret = this.secrets.create(x, y, 'signal').setImmovable(true).setTint(0x8df4ff).setScale(.72).setData('id', index); secret.body.setAllowGravity(false).setCircle(17, 11, 11); if (!this.motionReduced) this.tweens.add({ targets: secret, angle: 360, duration: 1800, repeat: -1 }); });
    this.physics.add.overlap(this.player, this.secrets, (_, secret) => this.collectSecret(secret), undefined, this);
  }

  createCheckpoints() {
    this.checkpoints = this.physics.add.staticGroup();
    this.mission.checkpoints.forEach(([x, y], index) => { const checkpoint = this.checkpoints.create(x, y, 'checkpoint').setOrigin(.5, 1).setData('index', index); checkpoint.refreshBody(); });
    this.physics.add.overlap(this.player, this.checkpoints, (_, checkpoint) => this.activateCheckpoint(checkpoint), undefined, this);
  }
  safeCheckpointSpawn(x) {
    const platforms = this.mission.platforms.map(([platformX, platformY, width, height]) => ({ x: platformX, y: platformY, width, height }));
    const containing = platforms.filter(platform => x >= platform.x + 26 && x <= platform.x + platform.width - 26).sort((left, right) => left.y - right.y)[0];
    const platform = containing || platforms.reduce((nearest, candidate) => Math.abs(candidate.x + candidate.width / 2 - x) < Math.abs(nearest.x + nearest.width / 2 - x) ? candidate : nearest, platforms[0]);
    return { x: Phaser.Math.Clamp(x, platform.x + 30, platform.x + platform.width - 30), y: platform.y - 46 };
  }
  updateRouteHints() {
    this.checkpoints?.getChildren().forEach(marker => { const index = marker.getData('index'); if (!this.checkpointHints.has(index) && Phaser.Math.Distance.Between(this.player.x, this.player.y, marker.x, marker.y) < 165) { this.checkpointHints.add(index); const pulse = this.add.circle(marker.x, marker.y - 20, 10, 0x8df4ff, .35).setDepth(6); this.tweens.add({ targets: pulse, scale: 3, alpha: 0, duration: 420, onComplete: () => pulse.destroy() }); this.playerCue('CHECKPOINT NEAR', '#b9f5ff'); } });
    if (!this.goalHintShown && this.player.x >= this.goal.x - 520) { this.goalHintShown = true; const pulse = this.add.circle(this.goal.x + 20, this.goal.y + 22, 18, 0xffd06e, .3).setDepth(11); this.tweens.add({ targets: pulse, scale: 4, alpha: 0, duration: 550, onComplete: () => pulse.destroy() }); this.playerCue('DELIVERY BEACON NEAR', '#ffd06e'); }
  }

  createHazards() {
    this.barriers = this.physics.add.staticGroup();
    this.mission.obstacles.forEach(([x, y]) => { const barrier = this.barriers.create(x + 24, y + 32, 'barrier'); const warning = this.add.text(x - 115, y - 42, 'BARRIER · VAULT', { fontFamily: 'DM Mono', fontSize: '9px', color: '#ffcf82', stroke: '#08101c', strokeThickness: 3 }).setDepth(3); if (!this.motionReduced) { this.tweens.add({ targets: barrier, alpha: { from: 1, to: .62 }, duration: 360, yoyo: true, repeat: -1 }); this.tweens.add({ targets: warning, alpha: { from: .9, to: .38 }, duration: 720, yoyo: true, repeat: -1 }); } });
    this.physics.add.overlap(this.player, this.barriers, () => this.tryVault() || this.fail('A live barrier cut the delivery short.'), undefined, this);
  }
  createMovingGates() {
    this.movingGates = this.physics.add.group();
    this.mission.movingGates.forEach(([x, y, upperY, lowerY], index) => { const gate = this.movingGates.create(x, y, 'barrier').setImmovable(true).setDepth(8); gate.body.setAllowGravity(false); gate.setData('homeY', y); this.tweens.add({ targets: gate, y: index % 2 ? lowerY : upperY, duration: 1600 + index * 240, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); });
    this.physics.add.overlap(this.player, this.movingGates, () => this.fail('A security gate sealed the relay route.'), undefined, this);
  }

  createEnemies() {
    this.enemies = this.physics.add.group();
    this.mission.enemies.forEach(data => { const enemy = this.enemies.create(data.x, data.y, data.type).setDepth(8).setImmovable(true); const indicator = this.add.circle(data.x, data.y - 30, 5, 0xff826e, .28).setStrokeStyle(1, 0xffd5c5, .7).setDepth(7); enemy.body.setAllowGravity(false); enemy.setData('route', data); enemy.setData('direction', 1); enemy.setData('indicator', indicator); });
  }
  createSciFiThreats() {
    const tier = Number(this.mission.difficulty?.split('/')[0]) || 1; this.eggs = this.physics.add.group(); this.comets = this.physics.add.group();
    const addThreat = (type, x, y) => { const enemy = this.enemies.create(x, y, type).setDepth(8).setImmovable(true); const indicator = this.add.circle(x, y - 34, 5, 0xff826e, .28).setStrokeStyle(1, 0xffd5c5, .7).setDepth(7); enemy.body.setAllowGravity(false); enemy.setData('route', { type, min: x - 90, max: x + 90 }); enemy.setData('direction', 1); enemy.setData('nextShot', 500); enemy.setData('indicator', indicator); return enemy; };
    const startX = this.mission.spawn.x;
    const firstRunner = addThreat('enemy-runner', startX + 430, this.mission.spawn.y);
    const firstChicken = addThreat('chicken', startX + 700, this.mission.spawn.y + 10);
    const routeLength = this.mission.goal.x - startX; const encounterTypes = tier >= 5 ? ['enemy-runner', 'alien-ground', 'dino', 'invader', 'chicken', 'dino', 'invader'] : tier >= 3 ? ['enemy-runner', 'alien-ground', 'dino', 'invader', 'enemy-runner'] : tier === 2 ? ['enemy-runner', 'chicken', 'dino', 'alien-ground'] : ['enemy-runner', 'chicken', 'dino', 'alien-ground']; encounterTypes.forEach((type, index) => { const x = startX + 1040 + index * (routeLength - 1240) / Math.max(1, encounterTypes.length - 1); if (x < this.mission.goal.x - 140) addThreat(type, x, type === 'invader' ? Math.max(180, this.mission.spawn.y - 120) : this.mission.spawn.y); });
    if (this.mission.boss) { const profile = this.mission.boss; this.boss = addThreat(profile.type, this.mission.goal.x - 250, this.mission.spawn.y - 12); this.boss.setTint(profile.color); this.boss.setData('health', profile.health); this.boss.setData('boss', true); this.boss.setData('bossName', profile.name); this.boss.setData('bossColor', profile.color); this.boss.setData('attackCooldown', profile.attackCooldown); const name = this.add.text(this.boss.x, this.boss.y - 72, `${profile.name} · CLEAR THE ROUTE`, { fontFamily: 'DM Mono', fontSize: '10px', color: '#ffcf82', stroke: '#08101c', strokeThickness: 4 }).setOrigin(.5).setDepth(13); this.boss.setData('label', name); }
    if (this.mission.id === 'first-delivery') { const label = (enemy, text) => this.add.text(enemy.x, enemy.y - 62, text, { fontFamily: 'DM Mono', fontSize: '10px', color: '#b9f5ff', stroke: '#08101c', strokeThickness: 4, align: 'center' }).setOrigin(.5).setDepth(13); firstRunner.setData('tutorialLabel', label(firstRunner, 'SCOUT RUNNER\nFIRES ONLY WHEN CLOSE\nE · FIRE OR STOMP')); firstChicken.setData('tutorialLabel', label(firstChicken, 'EGG HAZARD\nJUMP OR SHOOT')); }
    this.physics.add.overlap(this.player, this.eggs, (_, egg) => { egg.destroy(); this.takeSciFiHit('A chicken egg knocked the courier down.'); }, undefined, this);
    this.physics.add.overlap(this.player, this.comets, (_, comet) => { comet.destroy(); this.takeSciFiHit('A falling comet struck the relay route.'); }, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => { const stomp = player.body.velocity.y > 130 && player.y < enemy.y - 12; if (stomp) this.defeatEnemy(enemy, 'STOMP'); else this.takeSciFiHit('An enemy attack knocked the courier down.'); }, undefined, this);
  }
  createBuildSystems() {
    this.shields = this.physics.add.staticGroup(); this.kineticBalls = this.physics.add.group(); this.plasma = this.physics.add.group(); this.turrets = this.physics.add.group(); this.springPads = this.physics.add.staticGroup();
    const destroyBall = (_, ball) => ball.destroy();
    this.physics.add.overlap(this.kineticBalls, this.barriers, (ball, barrier) => { barrier.disableBody(true, true); this.playerCue('BARRIER DESTROYED', '#8df4ff'); destroyBall(null, ball); });
    this.physics.add.overlap(this.kineticBalls, this.movingGates, (ball, gate) => { gate.disableBody(true, true); this.playerCue('GATE DESTROYED', '#8df4ff'); destroyBall(null, ball); });
    this.physics.add.overlap(this.kineticBalls, this.enemies, (ball, enemy) => { this.defeatEnemy(enemy, 'KINETIC BALL', 2); destroyBall(null, ball); });
    this.physics.add.overlap(this.plasma, this.enemies, (plasma, enemy) => { const power = plasma.getData('power') || 1; plasma.destroy(); this.defeatEnemy(enemy, 'BLASTER', power); });
    this.physics.add.overlap(this.plasma, this.eggs, (plasma, egg) => { plasma.destroy(); egg.destroy(); this.playerCue('SHOT DEFLECTED', '#8df4ff'); });
    this.physics.add.overlap(this.plasma, this.comets, (plasma, comet) => { plasma.destroy(); comet.destroy(); this.playerCue('BOLT DEFLECTED', '#8df4ff'); });
    this.physics.add.overlap(this.eggs, this.shields, (egg) => egg.destroy()); this.physics.add.overlap(this.comets, this.shields, (comet) => comet.destroy());
    this.physics.add.overlap(this.player, this.springPads, () => { if (this.boostCooldown > 0) return; this.boostCooldown = 260; this.player.body.setVelocityY(-880); this.playerCue('SPRING PAD', '#aee37f'); });
  }
  takeSciFiHit(message) { if (this.briefingProtected || this.respawning || this.finished || this.healthInvulnerable > 0) return; this.health--; this.healthInvulnerable = 1100; this.game.events.emit('health', this.health); if (this.health <= 0) { this.fail('The courier collapsed. Checkpoint health restored.'); return; } this.player.setTint(0xff826e); this.time.delayedCall(180, () => this.player?.active && this.player.clearTint()); this.playerCue(`HIT · ${this.health} HEALTH`, '#ff9c91'); this.shake(80, .006); this.game.events.emit('feedback', 'hit'); }
  useBuild(slot) {
    const id = this.loadout.buildItems?.[slot]; if (!id || this.buildCooldowns[slot] > 0) return; const direction = this.player.flipX ? -1 : 1;
    if (id === 'shield') { const shield = this.shields.create(this.player.x + direction * 70, this.player.y + 10, 'shield'); shield.refreshBody(); this.time.delayedCall(4200, () => shield.destroy()); this.playerCue('RELAY SHIELD BUILT', '#b9f5ff'); this.buildCooldowns[slot] = 9000; }
    if (id === 'kinetic-ball') { const ball = this.kineticBalls.create(this.player.x + direction * 28, this.player.y, 'kinetic-ball').setDepth(12); ball.body.setAllowGravity(false).setCircle(11, 2, 2).setVelocityX(direction * 780); this.time.delayedCall(1400, () => ball.destroy()); this.playerCue('KINETIC BALL', '#8df4ff'); this.buildCooldowns[slot] = 7000; }
    if (id === 'turret') { const turret = this.turrets.create(this.player.x + direction * 90, this.player.y + 14, 'turret').setDepth(9).setImmovable(true); turret.body.setAllowGravity(false); turret.setData('expires', this.elapsedMs + 6500); turret.setData('nextShot', 0); this.playerCue('ARC TURRET DEPLOYED', '#8df4ff'); this.buildCooldowns[slot] = 12000; }
    if (id === 'spring-pad') { const pad = this.springPads.create(this.player.x + direction * 58, this.player.y + 32, 'spring-pad'); pad.refreshBody(); this.time.delayedCall(6000, () => pad.destroy()); this.playerCue('SPRING PAD BUILT', '#aee37f'); this.buildCooldowns[slot] = 8000; }
  }
  defeatEnemy(enemy, method, power = 1) { if (!enemy?.active) return; const health = enemy.getData('health'); if (health) { const remaining = health - power; enemy.setData('health', remaining); enemy.setTint(0xff826e); this.time.delayedCall(100, () => enemy.active && enemy.setTint(enemy.getData('bossColor') || 0xffffff)); if (remaining > 0) { enemy.getData('label')?.setText(`${enemy.getData('bossName') || 'ALPHA DINO'} · ${remaining} HITS LEFT`); this.playerCue(`${method} · BOSS HIT`, '#ffcf82'); return; } enemy.getData('label')?.destroy(); } enemy.getData('indicator')?.destroy(); enemy.getData('tutorialLabel')?.destroy(); const burst = this.add.circle(enemy.x, enemy.y, 12, 0x8df4ff, .65).setDepth(13); this.tweens.add({ targets: burst, scale: 3, alpha: 0, duration: 220, onComplete: () => burst.destroy() }); enemy.disableBody(true, true); this.enemyDefeats = (this.enemyDefeats || 0) + 1; this.combatCombo = this.comboTimer > 0 ? this.combatCombo + 1 : 1; this.comboTimer = 3000; if (this.combatCombo >= 3) this.energy = Math.min(this.energyMax, this.energy + 4); this.ammo = Math.min(this.ammoMax, this.ammo + 1); this.game.events.emit('ammo', this.ammo / this.ammoMax * 100); this.game.events.emit('combo', this.combatCombo, this.comboTimer); this.player.body.setVelocityY(method === 'STOMP' ? -360 : this.player.body.velocity.y); this.playerCue(`${method} · ${this.combatCombo > 1 ? `COMBO x${this.combatCombo}${this.combatCombo >= 3 ? ' · +4 ENERGY' : ''}` : 'THREAT CLEARED'}`, '#8df4ff'); }
  useBlaster() { if (this.blasterCooldown > 0 || this.cinematicActive) return; if (!this.ammo) { this.playerCue('PLASMA RECHARGING', '#ffcf82'); this.game.events.emit('feedback', 'empty'); return; } const direction = this.player.flipX ? -1 : 1; const weapon = this.loadout.weapon || 'sidearm'; const spread = weapon === 'scattergun' ? [-150, 0, 150] : [0]; spread.forEach(vertical => { const plasma = this.plasma.create(this.player.x + direction * 30, this.player.y - 4, 'plasma').setDepth(12).setFlipX(direction < 0); plasma.body.setAllowGravity(false).setVelocity(direction * (weapon === 'pulse-rifle' ? 980 : 840), vertical); plasma.setData('power', weapon === 'pulse-rifle' ? 2 : 1); this.time.delayedCall(900, () => plasma.destroy()); }); this.ammo--; this.game.events.emit('ammo', this.ammo / this.ammoMax * 100); this.blasterCooldown = weapon === 'scattergun' ? 420 : 240; this.playerCue(weapon === 'sidearm' ? 'PLASMA FIRE' : weapon.toUpperCase(), '#8df4ff'); this.game.events.emit('feedback', 'gadget'); }
  useSword() { if (this.swordCooldown > 0 || this.cinematicActive) return; const direction = this.player.flipX ? -1 : 1; const blade = this.add.sprite(this.player.x + direction * 38, this.player.y - 4, 'sword').setDepth(13).setFlipX(direction < 0).setAngle(direction * -18); this.tweens.add({ targets: blade, angle: direction * 48, alpha: 0, duration: 170, onComplete: () => blade.destroy() }); this.enemies.getChildren().filter(enemy => enemy.active && Math.abs(enemy.x - this.player.x) < 92 && Math.abs(enemy.y - this.player.y) < 78).forEach(enemy => this.defeatEnemy(enemy, 'SWORD', 2)); this.swordCooldown = 450; this.playerCue('SWORD ARC', '#ffd06e'); }
  createOpeningCinematic() {
    const finish = () => { if (!this.cinematicActive) return; this.cinematicActive = false; this.input.keyboard.off('keydown-SPACE', this.cinematicSkipHandler); overlay.destroy(true); this.playerCue('LANDING COMPLETE · E TO FIRE · STOMP FROM ABOVE', '#8df4ff'); };
    const story = this.mission.story;
    const width = this.scale.width;
    const height = this.scale.height;
    const compact = width < 700;
    const panelWidth = compact ? Math.min(width - 32, 420) : width - 44;
    const panelHeight = compact ? Math.min(height - 48, 340) : height - 64;
    const panelX = compact ? (width - panelWidth) / 2 : 22;
    const panelTop = (height - panelHeight) / 2;
    const textWidth = compact ? panelWidth - 62 : Math.min(panelWidth - 62, width * .5);
    const overlay = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    const veil = this.add.rectangle(width / 2, height / 2, width, height, 0x030711, compact ? .74 : .34);
    const panel = this.add.rectangle(panelX + panelWidth / 2, height / 2, panelWidth, panelHeight, 0x050914, compact ? .94 : .66).setStrokeStyle(1, 0x8df4ff, .55);
    const panelShade = this.add.rectangle(panelX + panelWidth / 2, height / 2, panelWidth - 20, panelHeight - 20, 0x0a1527, compact ? .45 : .24).setStrokeStyle(1, 0x8df4ff, .12);
    const topRail = this.add.rectangle(panelX + 30, panelTop + 24, 48, 3, 0x8df4ff, .95).setOrigin(0, .5);
    const scanLine = this.add.rectangle(panelX + panelWidth / 2, panelTop + 52, panelWidth - 56, 1, 0x8df4ff, .26);
    const planetX = compact ? width * .78 : width * .79;
    const planetY = height * .58;
    const planetRadius = Math.min(width, height) * (compact ? .2 : .3);
    const planetGlow = this.add.circle(planetX, planetY, planetRadius * 1.15, 0x167baf, .1);
    const planet = this.add.circle(planetX, planetY, planetRadius, 0x162f58, .9).setStrokeStyle(2, 0x8df4ff, .72);
    const atmosphere = this.add.circle(planetX, planetY, planetRadius * 1.08, 0x8df4ff, .08).setStrokeStyle(1, 0x8df4ff, .35);
    const earth = this.add.circle(width * .18, height * .18, Math.min(width, height) * .09, 0x1b5d91, .95).setStrokeStyle(2, 0xb9f5ff, .7);
    const earthCloud = this.add.circle(width * .18 - 12, height * .18 - 8, Math.min(width, height) * .072, 0xdffcff, .13);
    const subtitle = this.add.text(width / 2, height - (compact ? 34 : 42), 'EARTH ORBIT · RELAY DISTRESS SIGNAL RECEIVED', { fontFamily: 'DM Mono', fontSize: compact ? '8px' : '11px', color: '#dffcff', stroke: '#08101c', strokeThickness: 4 }).setOrigin(.5).setScrollFactor(0).setDepth(102);
    const stars = Array.from({ length: compact ? 12 : 22 }, (_, index) => this.add.circle(width * (.56 + (index * 37 % 42) / 100), 34 + (index * 71 % Math.max(80, height - 68)), index % 4 === 0 ? 1.8 : 1, 0xb9f5ff, .18 + (index % 3) * .12));
    const ship = this.add.triangle(-80, height * .31, 0, 20, 60, 38, 0, 56, 0x8df4ff).setStrokeStyle(2, 0xdffcff);
    const shipTrail = this.add.rectangle(-126, height * .31 + 38, 90, 2, 0x8df4ff, .35).setOrigin(0, .5);
    const eyebrow = this.add.text(panelX + 30, panelTop + (compact ? 52 : 76), 'RELAY // ORIENTATION', { fontFamily: 'DM Mono', fontSize: compact ? '9px' : '12px', color: '#8df4ff', letterSpacing: 2 });
    const title = this.add.text(panelX + 30, panelTop + (compact ? 78 : 108), story?.chapter || 'NIGHT SHIFT // ARRIVAL', { fontFamily: 'DM Mono', fontSize: compact ? '16px' : '27px', color: '#dffcff', wordWrap: { width: textWidth } });
    const copy = this.add.text(panelX + 30, panelTop + (compact ? 116 : 188), story?.arrival || 'The relay planet went dark.\nOne courier enters the storm zone.', { fontFamily: 'DM Mono', fontSize: compact ? '10px' : '15px', wordWrap: { width: textWidth }, lineSpacing: compact ? 5 : 11, color: '#b9d5ee' });
    const routeBrief = this.add.text(panelX + 30, panelTop + (compact ? 174 : 302), compact ? 'FOLLOW THE GOLD SIGNALS. THEY MARK THE SAFE LINE.' : 'The relay is weak, but the gold Signals still cut through the dark. Keep moving and let the route reveal itself one rooftop at a time.', { fontFamily: 'DM Mono', fontSize: compact ? '8px' : '12px', color: '#8df4ff', wordWrap: { width: textWidth }, lineSpacing: compact ? 3 : 7 });
    const runnerBrief = this.add.text(panelX + 30, panelTop + (compact ? 210 : 358), compact ? 'CHECKPOINTS SAVE YOUR RUN. MOMENTUM IS YOUR SHIELD.' : 'Checkpoint beacons remember your progress, so take the risky line, learn the rhythm and make the city answer back.', { fontFamily: 'DM Mono', fontSize: compact ? '8px' : '12px', color: '#ffd06e', wordWrap: { width: textWidth }, lineSpacing: compact ? 3 : 7 });
    const controlsY = panelTop + panelHeight - (compact ? 76 : 88);
    const controls = this.add.text(panelX + 30, controlsY, 'A / D  MOVE     SPACE  JUMP     E  PLASMA', { fontFamily: 'DM Mono', fontSize: compact ? '9px' : '11px', color: '#ffd06e', wordWrap: { width: textWidth }, lineSpacing: 6 });
    const skip = this.add.text(panelX + 30, panelTop + panelHeight - (compact ? 30 : 36), compact ? 'AUTO-CLOSE · 3 SEC' : 'SPACE · SKIP LANDING', { fontFamily: 'DM Mono', fontSize: compact ? '8px' : '11px', color: '#8df4ff' });
    const visuals = [earth, earthCloud, planetGlow, ...stars, atmosphere, planet];
    const panelElements = [panel, panelShade, topRail, scanLine, shipTrail, ship, eyebrow, title, copy, routeBrief, runnerBrief, controls, skip];
    overlay.add(compact ? [veil, ...visuals, ...panelElements] : [veil, ...panelElements, ...visuals]);
    this.tweens.add({ targets: [ship, shipTrail], x: compact ? width * .52 : width * .58, y: height * .43, duration: 2600, ease: 'Cubic.out' });
    const narration = [
      [120, 'Earth is behind you. The relay planet is calling.'],
      [2100, 'Descent corridor open. Follow the gold signals to the surface.'],
      [3900, 'Landing complete. Keep the line open.'],
    ];
    narration.forEach(([delay, text]) => this.time.delayedCall(delay, () => { if (!this.cinematicActive) return; subtitle.setText(text); this.game.events.emit('narration', text); }));
    if (!this.motionReduced) {
      this.tweens.add({ targets: [earth, earthCloud], alpha: 0, scale: .72, duration: 2500, ease: 'Cubic.in' });
      this.tweens.add({ targets: atmosphere, scale: 1.08, alpha: .3, yoyo: true, repeat: -1, duration: 900 });
      this.tweens.add({ targets: planetGlow, scale: 1.14, alpha: .03, yoyo: true, repeat: -1, duration: 1250 });
      this.tweens.add({ targets: scanLine, alpha: { from: .14, to: .5 }, yoyo: true, repeat: -1, duration: 680 });
      this.tweens.add({ targets: stars, alpha: { from: .12, to: .62 }, yoyo: true, repeat: -1, duration: 1100, delay: (_, target) => target.x % 240 });
    }
    this.time.delayedCall(compact ? 3600 : 5600, finish); this.cinematicSkipHandler = finish; this.input.keyboard.once('keydown-SPACE', this.cinematicSkipHandler);
  }
  createMissionTransmission() {
    const story = this.mission.story; const chapter = story?.chapter || 'RUNNER TRANSMISSION'; const objective = story?.arrival || 'Keep moving, read the route and protect the relay.'; const panel = this.add.container(36, 520).setScrollFactor(0).setDepth(30); const plate = this.add.rectangle(280, 68, 520, 112, 0x07101f, .88).setStrokeStyle(1, 0x8df4ff, .45); const label = this.add.text(40, 28, chapter, { fontFamily: 'DM Mono', fontSize: '12px', color: '#8df4ff' }); const copy = this.add.text(40, 54, objective, { fontFamily: 'DM Mono', fontSize: '12px', color: '#dffcff', wordWrap: { width: 440 }, lineSpacing: 5 }); panel.add([plate, label, copy]); panel.setAlpha(0); this.tweens.add({ targets: panel, alpha: 1, x: 58, duration: 340, ease: 'Cubic.out' }); this.tweens.add({ targets: panel, alpha: 0, delay: 3900, duration: 500, onComplete: () => panel.destroy() });
  }

  createBoostPads() {
    this.boostPads = this.physics.add.staticGroup();
    this.mission.boostPads.forEach(([x, y]) => { const pad = this.boostPads.create(x, y, 'boost-pad'); pad.refreshBody(); });
    this.physics.add.overlap(this.player, this.boostPads, () => { if (this.boostCooldown > 0 || this.player.body.velocity.y < -60) return; this.boostCooldown = 260; this.player.body.setVelocityY(-825); this.dust.emitParticleAt(this.player.x, this.player.y + 24, 7); this.game.events.emit('feedback', 'jump'); }, undefined, this);
  }

  createChaser() {
    if (!this.mission.chase && !this.mission.enemies.length) return;
    this.chaser = this.physics.add.sprite(this.mission.spawn.x - 220, this.mission.spawn.y, 'chaser').setDepth(9).setVisible(false); this.chaser.body.setAllowGravity(false).setSize(34, 52).setOffset(9, 4).setEnable(false); this.chaseSection = -1;
    this.physics.add.overlap(this.player, this.chaser, () => this.fail('The interceptor reclaimed the signal.'), undefined, this);
  }

  updateChaser(delta) {
    if (!this.chaser) return;
    const sections = this.mission.chase?.sections || [];
    sections.forEach((section, index) => { if (!this.chaseWarnings.has(index) && this.player.x >= section.start - 260 && this.player.x < section.start) { this.chaseWarnings.add(index); const cue = this.add.text(section.start - 235, 250, `CHASE AHEAD · ${section.end - section.start}m`, { fontFamily: 'DM Mono', fontSize: '11px', color: '#ffcf82', stroke: '#08101c', strokeThickness: 4 }).setDepth(13); this.tweens.add({ targets: cue, alpha: 0, delay: 1300, duration: 500, onComplete: () => cue.destroy() }); } });
    let sectionIndex = sections.findIndex(section => this.player.x >= section.start && this.player.x <= section.end);
    const alarmSection = sectionIndex === -1 && this.alarmTimer > 0 ? { start: 0, end: this.worldWidth, speed: 260 } : null;
    if (alarmSection) sectionIndex = -2;
    if (sectionIndex === -1) { if (this.chaseSection !== -1) { this.chaseEscapes++; this.chaser.setVisible(false); this.chaser.body.setEnable(false); this.chaseSection = -1; this.game.events.emit('chase', false); } return; }
    const section = alarmSection || sections[sectionIndex];
    if (sectionIndex !== this.chaseSection) {
      this.chaseSection = sectionIndex; this.chaser.setPosition(this.player.x - 210, this.player.y).setVisible(true); this.chaser.body.setEnable(true).updateFromGameObject();
      const cue = this.add.text(this.player.x, this.player.y - 78, 'INTERCEPTOR LOCK', { fontFamily: 'DM Mono', fontSize: '11px', color: '#ff9c91', stroke: '#08101c', strokeThickness: 4 }).setOrigin(.5).setDepth(13);
      this.tweens.add({ targets: cue, y: cue.y - 20, alpha: 0, duration: 620, onComplete: () => cue.destroy() }); this.game.events.emit('feedback', 'chase'); this.game.events.emit('chase', true);
    }
    const targetX = this.player.x - 38; this.chaser.x = Math.min(targetX, this.chaser.x + section.speed * delta / 1000); this.chaser.y = Phaser.Math.Linear(this.chaser.y, this.player.y, .12); this.chaser.body.updateFromGameObject();
  }

  createGoal() {
    this.goal = this.physics.add.staticImage(this.mission.goal.x, this.mission.goal.y, 'goal').setOrigin(0, 0); this.goal.refreshBody();
    if (!this.motionReduced) this.tweens.add({ targets: this.goal, scaleX: 1.06, scaleY: 1.06, duration: 680, yoyo: true, repeat: -1 });
    this.physics.add.overlap(this.player, this.goal, () => this.complete(), undefined, this);
  }

  createAtmosphere() {
    this.rain = this.add.particles(0, 0, 'rain', { x: { min: 0, max: 1350 }, y: -10, speedY: { min: 320, max: 470 }, speedX: -55, lifespan: 1700, frequency: 35, quantity: 1, scale: { start: .55, end: .55 }, alpha: { start: .5, end: 0 }, blendMode: 'ADD' }).setScrollFactor(.4).setVisible(this.rainEnabled);
    this.dust = this.add.particles(0, 0, 'dust', { speedX: { min: -45, max: 45 }, speedY: { min: -15, max: -70 }, lifespan: 350, quantity: 0, scale: { start: .7, end: 0 }, alpha: { start: .4, end: 0 } });
    this.speedLines = this.add.particles(0, 0, 'speed-line', { speedX: { min: -220, max: -130 }, speedY: { min: -12, max: 12 }, lifespan: 210, quantity: 0, scale: { start: .7, end: .15 }, alpha: { start: .42, end: 0 }, blendMode: 'ADD' });
    const weather = { 'first-delivery': ['NIGHT RAIN', 0x6d8faa], 'dead-drop': ['HARBOR FOG', 0xb7d4df], blackout: ['GRID FLICKER', 0x8df4ff], pursuit: ['CROSSWIND', 0x8ba2c4], 'signal-storm': ['SIGNAL STORM', 0xb993ff], 'corporate-lockdown': ['ASH FRONT', 0xff826e], 'final-relay': ['ORBITAL STATIC', 0xffe0a8] }[this.mission.id];
    this.weatherName = weather[0]; this.weatherOverlay = this.add.rectangle(640, 360, 1280, 720, weather[1], .045).setScrollFactor(0).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    this.weatherLabel = this.add.text(1120, 102, weather[0], { fontFamily: 'DM Mono', fontSize: '9px', color: '#dffcff' }).setScrollFactor(0).setDepth(19).setAlpha(.5);
  }
  updateWeather(delta) {
    this.weatherTimer += delta;
    if (this.weatherTimer < 6200) return;
    this.weatherTimer = 0; this.weatherPhase = (this.weatherPhase + 1) % 2;
    const intense = this.weatherPhase === 1;
    this.weatherOverlay?.setAlpha(intense ? .14 : .045);
    this.weatherLabel?.setText(`${this.weatherName} · ${intense ? 'FRONT ACTIVE' : 'CLEARING'}`);
    if (intense && this.mission.id === 'signal-storm') { this.cameras.main.flash(100, 160, 120, 255); this.game.events.emit('feedback', 'warning'); }
    if (intense && this.mission.id === 'pursuit') this.playerCue('CROSSWIND · HOLD YOUR LINE', '#b9f5ff');
  }

  createGuides() {
    this.mission.guides?.forEach(({ x, y, text }) => {
      const guide = this.add.text(x, y, text, { fontFamily: 'DM Mono', fontSize: '11px', color: '#ffd06e', stroke: '#08101c', strokeThickness: 4 }).setDepth(2);
      if (!this.motionReduced) this.tweens.add({ targets: guide, alpha: { from: .9, to: .25 }, y: y - 5, duration: 900, yoyo: true, repeat: -1 });
    });
  }
  createGuideCompanions() {
    const placements = this.mission.id === 'first-delivery'
      ? [[360, 470, 'alien-guide', 'ALIEN SCOUT · FOLLOW THE GOLD SIGNALS'], [1720, 470, 'guide-drone', 'GUIDE DRONE · CHECKPOINTS SAVE YOUR RUN']]
      : [[this.mission.spawn.x + 540, 470, 'guide-drone', 'ROUTE GUIDE · ENERGY AND HEALTH RESTORED'], [this.mission.goal.x - 620, 430, 'alien-guide', 'ALIEN SCOUT · THE RELAY IS CLOSE']];
    this.guideCompanions = this.physics.add.group();
    placements.forEach(([x, y, texture, lesson]) => {
      const guide = this.guideCompanions.create(x, y, texture).setDepth(9).setData('lesson', lesson);
      guide.body.setAllowGravity(false).setCircle(14, 6, 5);
      if (!this.motionReduced) this.tweens.add({ targets: guide, y: y - 12, duration: 760, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
    this.physics.add.overlap(this.player, this.guideCompanions, (_, guide) => this.collectGuideCompanion(guide), undefined, this);
  }
  collectGuideCompanion(guide) {
    if (!guide?.active) return;
    guide.disableBody(true, true);
    this.energy = Math.min(this.energyMax, this.energy + 30);
    this.health = Math.min(3, this.health + 1);
    this.game.events.emit('health', this.health);
    this.game.events.emit('tutorial', guide.getData('lesson'));
    this.game.events.emit('narration', guide.getData('lesson'));
    this.game.events.emit('character-response', 'Support received. Back in the run.');
    this.showIntelCard('ALLY INTEL', [guide.getData('lesson'), 'Allies restore energy and one health. Tap this card or press ESC whenever you are ready.'], '#aee37f');
    this.playerCue('ALLY SUPPORT · +30 ENERGY', '#aee37f');
    this.gadgetPulse(0xaee37f, 18, 420);
  }

  collectSignal(signal) {
    if (!signal.active) return; if (this.boosterTimer > 0) this.boostedSignals++; this.dust.emitParticleAt(signal.x, signal.y, 14); this.speedLines.emitParticleAt(signal.x, signal.y, 5); signal.disableBody(true, true); this.collected++; if (this.collected === this.mission.signals.length - 1) this.playerCue('ONE SIGNAL LEFT', '#ffd06e'); this.game.events.emit('signal', this.collected, this.mission.signals.length); this.game.events.emit('feedback', 'signal');
    const glow = this.add.circle(signal.x, signal.y, 12, 0xffd06e, .75).setBlendMode(Phaser.BlendModes.ADD).setDepth(11);
    this.tweens.add({ targets: glow, scale: 4.8, alpha: 0, duration: 360, ease: 'Quad.out', onComplete: () => glow.destroy() });
    const label = this.add.text(signal.x, signal.y - 30, '+5 XP', { fontFamily: 'DM Mono', fontSize: '12px', color: '#fff0b5', stroke: '#08101c', strokeThickness: 4 }).setOrigin(.5).setDepth(12);
    this.tweens.add({ targets: label, y: label.y - 26, alpha: 0, duration: 520, onComplete: () => label.destroy() });
    this.tweens.add({ targets: this.player, scaleX: 1.12, scaleY: 1.12, yoyo: true, duration: 90 });
  }
  collectSecret(secret) {
    if (!secret.active) return; secret.disableBody(true, true); this.secretsCollected++; this.game.events.emit('secret', this.collected, this.secretsCollected); this.game.events.emit('feedback', 'signal');
    const label = this.add.text(secret.x, secret.y - 26, 'SECRET · +25 XP', { fontFamily: 'DM Mono', fontSize: '11px', color: '#b9f5ff', stroke: '#08101c', strokeThickness: 4 }).setOrigin(.5).setDepth(12);
    this.tweens.add({ targets: label, y: label.y - 28, alpha: 0, duration: 650, onComplete: () => label.destroy() });
  }
  activateCheckpoint(marker) {
    const index = marker.getData('index'); if (index <= (this.checkpoint.index ?? -1)) return;
    const spawn = this.safeCheckpointSpawn(marker.x);
    this.checkpoint = { index, ...spawn, signals: new Set(this.signals.getChildren().filter(signal => !signal.active).map(signal => signal.getData('id'))), secrets: new Set(this.secrets.getChildren().filter(secret => !secret.active).map(secret => secret.getData('id'))) };
    marker.setTint(0xdffcff); this.game.events.emit('checkpoint', this.collected, this.secretsCollected, 0, index); this.game.events.emit('feedback', 'signal');
  }
  useEnergy(cost, ability) {
    if (!this.mission.energyEnabled) return true;
    if (this.loadout.upgrades?.includes('efficiency')) cost *= .9;
    if (ability === 'wallRun' && this.loadout.upgrades?.includes('wallEfficiency')) cost *= .8;
    if (this.energy < cost) { this.game.events.emit('feedback', 'empty'); if (this.lowEnergyCueTimer <= 0) { this.lowEnergyCueTimer = 700; this.playerCue('LOW ENERGY', '#ff9c91'); } return false; }
    this.energy -= cost; if (!this.tutorials.has(ability)) { this.tutorials.add(ability); const controls = { vault: 'VAULT · RUN INTO BARRIER', slide: 'SLIDE · HOLD S', wallRun: 'WALL RUN · HOLD INTO WALL', airDash: 'AIR DASH · SHIFT IN AIR', ledgeGrab: 'LEDGE GRAB · PRESS SPACE AT WALL', climb: 'CLIMB · W AT WALL' }; this.game.events.emit('tutorial', controls[ability]); } return true;
  }
  useGadget(slot) {
    const id = this.loadout.equipment?.[slot]; if (!id || this.gadgetCooldowns[slot] > 0) return; const bonuses = this.loadout.upgrades || [];
    if (id === 'scanner') { const range = bonuses.includes('signalSense') ? 680 : 500; const targets = this.signals.getChildren().filter(signal => signal.active && Math.abs(signal.x - this.player.x) < range); targets.forEach(signal => signal.setTint(0x8df4ff)); const nextSignal = targets.sort((left, right) => Phaser.Math.Distance.Between(this.player.x, this.player.y, left.x, left.y) - Phaser.Math.Distance.Between(this.player.x, this.player.y, right.x, right.y))[0]; if (nextSignal) { const marker = this.add.circle(nextSignal.x, nextSignal.y, 19, 0x8df4ff, .18).setStrokeStyle(2, 0xb9f5ff, .85).setDepth(10); this.tweens.add({ targets: marker, scale: 2.2, alpha: 0, duration: 850, onComplete: () => marker.destroy() }); } this.gadgetPulse(0x8df4ff, 14, 420); this.game.events.emit('tutorial', nextSignal ? 'SCANNER · NEXT SIGNAL MARKED' : 'SCANNER · NO SIGNAL IN RANGE'); }
    if (id === 'emp') { this.empTimer = 3500; this.gadgetPulse(0x8df4ff, 20, 620); this.enemies?.getChildren().forEach(enemy => enemy.setTint(0x8df4ff)); this.game.events.emit('tutorial', 'EMP · PATROLS DISABLED'); }
    if (id === 'decoy') { this.decoyTimer = 3200; this.alarmTimer = 0; this.decoyBeacon?.destroy(); this.decoyBeacon = this.add.circle(this.player.x, this.player.y + 18, 10, 0xffd06e, .8).setStrokeStyle(2, 0xfff0b5).setDepth(10); this.tweens.add({ targets: this.decoyBeacon, scale: { from: .75, to: 1.55 }, alpha: { from: .9, to: .25 }, duration: 420, yoyo: true, repeat: -1 }); this.game.events.emit('tutorial', 'DECOY · ATTENTION DIVERTED'); }
    if (id === 'booster') { this.boosterTimer = 8000; this.boosterAura?.destroy(); this.boosterAura = this.add.circle(this.player.x, this.player.y, 24, 0xffd06e, .14).setStrokeStyle(2, 0xffd06e, .65).setDepth(9); this.tweens.add({ targets: this.boosterAura, scale: { from: .9, to: 1.35 }, alpha: { from: .5, to: .12 }, duration: 520, yoyo: true, repeat: -1 }); this.game.events.emit('tutorial', 'SIGNAL BOOSTER · ACTIVE'); }
    if (id === 'cell') { this.energy = Math.min(this.energyMax, this.energy + 35); this.gadgetPulse(0xaee37f, 13, 300); this.game.events.emit('tutorial', 'ENERGY CELL · +35 ENERGY'); }
    this.gadgetCooldowns[slot] = id === 'scanner' ? 5500 : id === 'emp' ? 9000 : id === 'decoy' ? 8000 : id === 'booster' ? 12000 : 10000; this.playerCue(`${id.toUpperCase()} · READY`, '#ffd06e'); const pulse = this.add.circle(this.player.x, this.player.y, 12, 0xffd06e, .35).setDepth(11); this.tweens.add({ targets: pulse, scale: 2.8, alpha: 0, duration: 280, onComplete: () => pulse.destroy() }); this.game.events.emit('feedback', 'gadget');
  }
  tryVault() {
    const body = this.player.body;
    if (!this.abilities.has('vault') || this.vaultCooldown > 0 || !body.blocked.down || Math.abs(body.velocity.x) < 130 || !this.useEnergy(12, 'vault')) return false;
    this.vaultCooldown = 450; body.setVelocityY(-510); this.player.setTint(0xb9f5ff); this.time.delayedCall(180, () => this.player.clearTint()); this.game.events.emit('feedback', 'vault'); return true;
  }
  updateEnemies(delta) {
    if (!this.enemies) return;
    if (this.empTimer > 0 || this.decoyTimer > 0) { this.enemies.getChildren().forEach(enemy => enemy.getData('indicator')?.setAlpha(.1)); return; }
    this.enemies.getChildren().forEach(enemy => { if (!enemy.active) return; const route = enemy.getData('route'); const type = route.type; let direction = enemy.getData('direction'); const horizontalDistance = Math.abs(enemy.x - this.player.x); const verticalDistance = Math.abs(enemy.y - this.player.y); const speed = type === 'dino' ? 74 : type === 'enemy-runner' && horizontalDistance < 300 ? 118 : type === 'invader' ? 28 : type === 'security' ? 55 : 38; if (type === 'enemy-runner' && horizontalDistance < 300) direction = this.player.x < enemy.x ? -1 : 1; enemy.x += direction * speed * delta / 1000; if (enemy.x >= route.max || enemy.x <= route.min) { direction *= -1; enemy.setData('direction', direction); enemy.setFlipX(direction < 0); } enemy.body.updateFromGameObject();
      const patrol = type === 'security' || type === 'guard'; const detectionRange = this.mission.blackout && this.player.y < 470 ? 105 : type === 'security' ? 180 : 145; const indicator = enemy.getData('indicator'); const alerted = horizontalDistance < detectionRange && verticalDistance < 100; indicator?.setPosition(enemy.x, enemy.y - 30).setAlpha(horizontalDistance < Math.max(260, detectionRange * 1.6) && verticalDistance < 150 ? .92 : .28).setFillStyle(alerted ? 0xffd06e : 0xff826e); enemy.getData('tutorialLabel')?.setPosition(enemy.x, enemy.y - 62); if (alerted && !enemy.getData('alerted')) { enemy.setData('alerted', true); this.playerCue(`${type === 'security' ? 'SECURITY' : 'HOSTILE'} HAS EYES ON YOU`, '#ffcf82'); } if (!alerted) enemy.setData('alerted', false); if (patrol && alerted) { if (this.alarmTimer <= 0) { this.alarms++; this.game.events.emit('feedback', 'chase'); } this.alarmTimer = this.alarmDuration(3400); }
    });
    if (this.alarmTimer > 0) { this.alarmTimer = Math.max(0, this.alarmTimer - delta); this.game.events.emit('detection', Math.ceil(this.alarmTimer / 100)); }
    else this.game.events.emit('detection', 0);
  }
  updateSciFiThreats(delta) {
    const now = this.elapsedMs;
    if (this.boss?.active && Math.abs(this.boss.x - this.player.x) < 500 && now >= this.boss.getData('nextShot')) {
      const bolt = this.comets.create(this.boss.x, this.boss.y - 20, 'comet').setDepth(11).setTint(this.boss.getData('bossColor') || 0xff826e);
      bolt.body.setAllowGravity(false).setVelocity((this.player.x - this.boss.x) * .8, this.boss.getData('route')?.type === 'storm-boss' ? 250 : 100);
      this.boss.setData('nextShot', now + this.boss.getData('attackCooldown'));
      this.playerCue(`${this.boss.getData('bossName')} ATTACK`, '#ff826e');
      this.game.events.emit('feedback', 'warning');
    }
    this.enemies.getChildren().forEach(enemy => { if (!enemy.active) return; const type = enemy.getData('route')?.type; if (type === 'chicken' || type === 'invader' || type === 'enemy-runner') { const firingRange = type === 'chicken' ? 240 : type === 'invader' ? 320 : 280; if (Math.abs(this.player.x - enemy.x) < firingRange && Math.abs(this.player.y - enemy.y) < 190 && now >= enemy.getData('nextShot')) { const projectile = type === 'chicken' ? 'egg' : 'comet'; const egg = this.eggs.create(enemy.x, enemy.y + 12, projectile).setDepth(11); const predictedX = this.player.x + this.player.body.velocity.x * .22; egg.body.setAllowGravity(false).setVelocity((predictedX - enemy.x) * .72, type === 'chicken' ? 210 : 90); enemy.setData('nextShot', now + (type === 'enemy-runner' ? 1500 : type === 'invader' ? 1900 : 2400)); this.playerCue(type === 'chicken' ? 'EGG INCOMING' : 'ENEMY FIRE', '#ff826e'); this.game.events.emit('feedback', 'warning'); } } if (type === 'invader') { enemy.y += Math.sin((now + enemy.x) / 260) * .22; enemy.body.updateFromGameObject(); } if (type === 'dino' && Math.abs(enemy.x - this.player.x) < 240 && Math.abs(enemy.y - this.player.y) < 95 && now >= enemy.getData('nextShot')) { enemy.setData('nextShot', now + 1700); enemy.setTint(0xff826e); this.tweens.add({ targets: enemy, x: this.player.x + this.player.body.velocity.x * .12, duration: 340, onComplete: () => enemy.clearTint() }); if (Math.abs(enemy.x - this.player.x) < 66) this.takeSciFiHit('A dinosaur charge knocked the courier down.'); } });
    const signature = signatureThreats[this.mission.id]; const nearbyThreat = this.enemies.getChildren().find(enemy => enemy.active && Math.abs(enemy.x - this.player.x) < 250 && enemy.getData('route')?.type === signature) || this.enemies.getChildren().find(enemy => enemy.active && Math.abs(enemy.x - this.player.x) < 180 && enemyIntel[enemy.getData('route')?.type]); if (nearbyThreat) this.showEnemyIntel(nearbyThreat.getData('route')?.type);
    this.enemies.getChildren().forEach(enemy => { if (!enemy.active || enemy.getData('route')?.type !== 'alien-ground' || now < enemy.getData('nextShot') || Math.abs(enemy.x - this.player.x) > 360) return; const bolt = this.eggs.create(enemy.x, enemy.y, 'comet').setDepth(11); bolt.body.setAllowGravity(false).setVelocity((this.player.x - enemy.x) * .78, (this.player.y - enemy.y) * .35 - 45); enemy.setData('nextShot', now + 1650); this.playerCue('GROUND ALIEN FIRE', '#ff826e'); });
    this.enemies.getChildren().forEach(enemy => { if (!enemy.active) return; const type = enemy.getData('route')?.type; const direction = enemy.getData('direction') || 1; if (type === 'enemy-runner' || type === 'alien-ground') enemy.setAngle(direction * 7); else if (type === 'dino' || type === 'dino-boss') enemy.setAngle(direction * 4); else if (type === 'invader') enemy.setAngle(Math.sin((now + enemy.x) / 240) * 9); });
    const tier = Number(this.mission.difficulty?.split('/')[0]) || 1; this.cometTimer -= delta; if (tier >= 3 && this.cometTimer <= 0) { const comet = this.comets.create(Math.min(this.worldWidth - 80, this.player.x + 360), -30, 'comet').setDepth(11); comet.body.setAllowGravity(false).setVelocity(-80, 520); this.cometTimer = Math.max(2400, 5600 - tier * 420); this.game.events.emit('feedback', 'warning'); }
    this.eggs.getChildren().forEach(egg => { if (!egg.active || egg.y > 820 || egg.x < -30 || egg.x > this.worldWidth + 50) { egg.destroy(); return; } const drift = egg.texture.key === 'egg' ? 18 : 30; egg.body.velocity.y += Math.sin((now + egg.x) / 120) * drift * delta / 1000; egg.setAngle(Phaser.Math.Clamp(egg.body.velocity.y * .035, -28, 28)); }); this.comets.getChildren().forEach(comet => { if (!comet.active || comet.y > 820) comet.destroy(); });
  }
  updateBuilds() {
    this.turrets?.getChildren().forEach(turret => { if (!turret.active) return; if (this.elapsedMs >= turret.getData('expires')) { turret.destroy(); return; } const target = this.enemies.getChildren().filter(enemy => enemy.active && Math.abs(enemy.x - turret.x) < 360).sort((left, right) => Math.abs(left.x - turret.x) - Math.abs(right.x - turret.x))[0]; if (target && this.elapsedMs >= turret.getData('nextShot')) { const plasma = this.plasma.create(turret.x, turret.y - 10, 'plasma').setDepth(12); plasma.body.setAllowGravity(false).setVelocityX((target.x < turret.x ? -1 : 1) * 700); turret.setData('nextShot', this.elapsedMs + 700); } });
  }
  updateCombatTutorial() {
    if (!this.firstTimeTutorial) return; const steps = this.mission.story?.tutorial || []; steps.forEach(([x, text], index) => { if (!this.routeTutorials.has(index) && this.player.x >= this.mission.spawn.x + x) { this.routeTutorials.add(index); this.game.events.emit('tutorial', text); this.playerCue(text, '#b9f5ff'); this.showIntelCard(`RUNNER LESSON ${String(index + 1).padStart(2, '0')}`, [text, 'PRACTICE IT NOW · CHECKPOINTS KEEP THE ROUTE FORGIVING.']); } });
  }
  updateNarrative() {
    const beats = this.mission.story?.radio || []; beats.forEach(([x, text], index) => { if (!this.storyBeatsSeen.has(index) && this.player.x >= x) { this.storyBeatsSeen.add(index); const line = this.add.text(this.player.x, this.player.y - 96, text, { fontFamily: 'DM Mono', fontSize: '11px', color: '#dffcff', stroke: '#08101c', strokeThickness: 4, wordWrap: { width: 370 }, align: 'center' }).setOrigin(.5).setDepth(14); this.tweens.add({ targets: line, y: line.y - 22, alpha: 0, delay: 1900, duration: 520, onComplete: () => line.destroy() }); this.game.events.emit('narration', text); this.time.delayedCall(1150, () => this.game.events.emit('character-response', ['Copy that.', 'Relay runner moving.', 'I see it.', 'On the line.'][index % 4])); this.game.events.emit('feedback', 'signal'); } });
  }
  updateEvents() {
    this.mission.events.forEach((event, index) => { const state = this.eventState.get(index) || ''; if (!state && this.player.x >= event.x - 260) { this.eventState.set(index, 'warned'); const cue = this.add.text(event.x - 120, 250, event.warning, { fontFamily: 'DM Mono', fontSize: '11px', color: '#ffcf82', stroke: '#08101c', strokeThickness: 4 }).setDepth(13); this.tweens.add({ targets: cue, alpha: 0, delay: 1500, duration: 500, onComplete: () => cue.destroy() }); this.game.events.emit('feedback', 'warning'); } else if (state === 'warned' && this.player.x >= event.x) { this.eventState.set(index, 'active'); if (event.type === 'blackout') { this.cameras.main.flash(180, 30, 70, 110); this.game.events.emit('feedback', 'warning'); } else { this.alarmTimer = this.alarmDuration(event.type === 'chase' ? 5000 : 3000); this.alarms++; this.game.events.emit('feedback', 'chase'); } } });
  }
  complete() {
    if (this.finished) return; if (this.boss?.active) { this.playerCue(`${this.boss.getData('bossName') || 'ALPHA DINO'} BLOCKS THE RELAY · DEFEAT IT`, '#ffcf82'); this.player.body.setVelocityX(-260); return; } this.finished = true; this.physics.pause(); this.player.play('runner-finish', true); this.player.setTint(0xffefad); if (!this.motionReduced) this.cameras.main.flash(260, 255, 208, 110); this.game.events.emit('feedback', 'complete'); if (this.mission.story?.completion) { const epilogue = this.add.text(this.goal.x + 20, this.goal.y - 88, this.mission.story.completion, { fontFamily: 'DM Mono', fontSize: '11px', color: '#dffcff', stroke: '#08101c', strokeThickness: 4, wordWrap: { width: 380 }, align: 'center' }).setOrigin(.5).setDepth(14); this.tweens.add({ targets: epilogue, alpha: 0, delay: 2800, duration: 500, onComplete: () => epilogue.destroy() }); }
    this.dust.emitParticleAt(this.goal.x + 20, this.goal.y + 25, 34); this.speedLines.emitParticleAt(this.goal.x + 20, this.goal.y + 25, 10); this.tweens.add({ targets: this.player, y: this.player.y - 12, duration: 130, yoyo: true, repeat: 1 });
    const relayGlow = this.add.circle(this.goal.x + 22, this.goal.y + 22, 20, 0xffd06e, .75).setBlendMode(Phaser.BlendModes.ADD).setDepth(12);
    const completeLabel = this.add.text(this.goal.x + 22, this.goal.y - 34, 'RELAY LINKED', { fontFamily: 'DM Mono', fontSize: '16px', color: '#fff0b5', stroke: '#08101c', strokeThickness: 5 }).setOrigin(.5).setDepth(13).setScale(.65);
    this.tweens.add({ targets: relayGlow, scale: 8, alpha: 0, duration: 700, ease: 'Quad.out', onComplete: () => relayGlow.destroy() }); this.tweens.add({ targets: completeLabel, scale: 1, y: completeLabel.y - 20, duration: 320, ease: 'Back.out' });
    this.time.delayedCall(120, () => this.game.events.emit('complete', this.collected, this.elapsedMs, { jumps: this.jumps, collisions: this.collisions, falls: this.falls, secrets: this.secretsCollected, alarms: this.alarms, chaseEscapes: this.chaseEscapes, enemyDefeats: this.enemyDefeats || 0, bossDefeated: Boolean(this.boss && !this.boss.active), package: this.package, packageCondition: this.packageCondition, contract: this.mission.activeContract, modifier: this.loadout.modifier, signalBonusExtra: this.boostedSignals * 5 + (this.loadout.upgrades?.includes('signalXp') ? this.collected : 0), score: this.collected * 100 + this.secretsCollected * 250 + this.boostedSignals * 100 }, this.runId));
  }
  fail(message) {
    if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0) return; const collision = message.includes('barrier') || message.includes('interceptor'); if (collision) this.collisions++; else this.falls++; this.deaths++; if (this.package?.condition) { this.packageCondition = Math.max(0, this.packageCondition - (collision ? 25 : 35)); this.game.events.emit('package', this.packageCondition); } if (this.deaths >= this.deathLimit) { this.finished = true; this.physics.pause(); this.player.play('runner-hit', true); this.player.setTint(0xff826e); this.shake(170, .014); this.game.events.emit('game-over', `RUN ENDED · ${this.deathLimit} / ${this.deathLimit} RECOVERIES USED`, this.deaths, this.runId); return; } this.game.events.emit('deaths', this.deaths, this.deathLimit); this.respawning = true; this.physics.pause(); this.player.play('runner-hit', true); this.player.setTint(0xff826e); this.shake(170, .014); if (!this.motionReduced) this.cameras.main.flash(120, 255, 100, 90); this.game.events.emit('feedback', 'hit');
    this.dust.emitParticleAt(this.player.x, this.player.y + 10, 12); this.speedLines.emitParticleAt(this.player.x, this.player.y, 8); this.time.delayedCall(180, () => this.respawnCheckpoint());
  }
  respawnCheckpoint() {
    if (this.loadout.modifier?.id === 'noCheckpoints') this.checkpoint = { x: this.mission.spawn.x, y: this.mission.spawn.y, signals: new Set(), secrets: new Set() };
    let lostSignals = 0; let lostSecrets = 0;
    this.signals.getChildren().forEach(signal => { if (!signal.active && !this.checkpoint.signals.has(signal.getData('id'))) { signal.enableBody(true, signal.x, signal.y, true, true); lostSignals++; } });
    this.secrets.getChildren().forEach(secret => { if (!secret.active && !this.checkpoint.secrets.has(secret.getData('id'))) { secret.enableBody(true, secret.x, secret.y, true, true); lostSecrets++; } });
    this.collected = this.checkpoint.signals.size; this.secretsCollected = this.checkpoint.secrets.size; this.health = 3; this.game.events.emit('health', this.health); this.player.clearTint().setPosition(this.checkpoint.x, this.checkpoint.y).play('runner-idle', true); this.player.body.reset(this.checkpoint.x, this.checkpoint.y); this.player.body.setVelocity(0, 0); this.respawnGrace = 1100; this.healthInvulnerable = 2200;
    // Remove attacks already covering the checkpoint and make nearby enemies give the player room to recover.
    [this.eggs, this.comets].forEach(group => group?.getChildren().forEach(projectile => { if (projectile.active && Phaser.Math.Distance.Between(projectile.x, projectile.y, this.checkpoint.x, this.checkpoint.y) < 360) projectile.destroy(); }));
    this.enemies?.getChildren().forEach(enemy => { if (!enemy.active || Math.abs(enemy.x - this.checkpoint.x) > 180) return; const route = enemy.getData('route'); const direction = enemy.x < this.checkpoint.x ? -1 : 1; enemy.x = Phaser.Math.Clamp(this.checkpoint.x + direction * 210, route.min, route.max); enemy.setData('direction', direction); enemy.body.updateFromGameObject(); });
    if (this.loadout.upgrades?.includes('recovery')) { this.energy = Math.min(this.energyMax, this.energy + 20); this.playerCue('RECOVERY +20 ENERGY', '#aee37f'); } const shield = this.add.circle(this.player.x, this.player.y, 22, 0x8df4ff, .22).setDepth(11); this.tweens.add({ targets: shield, scale: 3.5, alpha: 0, duration: 900, onComplete: () => shield.destroy() }); this.player.setAlpha(.45); this.tweens.add({ targets: this.player, alpha: 1, duration: 260 }); this.playerCue('SAFE RESET · 2 SEC SHIELD', '#b9f5ff'); this.physics.resume(); this.respawning = false;
    const lost = lostSignals + lostSecrets; const label = this.add.text(this.checkpoint.x, this.checkpoint.y - 55, lost ? `CHECKPOINT · LOST ${lost} PICKUP${lost === 1 ? '' : 'S'}` : 'CHECKPOINT · ROUTE RESET', { fontFamily: 'DM Mono', fontSize: '11px', color: '#b9f5ff', stroke: '#08101c', strokeThickness: 4 }).setOrigin(.5).setDepth(13); this.tweens.add({ targets: label, y: label.y - 24, alpha: 0, duration: 900, onComplete: () => label.destroy() }); this.game.events.emit('checkpoint', this.collected, this.secretsCollected, lost);
  }

  update(_, delta) {
    if (this.finished || this.respawning || this.cinematicActive) return;
    this.elapsedMs += delta; this.timeEmitTimer += delta; if (this.timeEmitTimer >= 100) { this.timeEmitTimer = 0; this.game.events.emit('time', this.elapsedMs); } if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.dismissIntelCard(); this.respawnGrace = Math.max(0, this.respawnGrace - delta); if (!this.sectorTwoAnnounced && this.player.x >= 4080) { this.sectorTwoAnnounced = true; this.game.events.emit('sector', { number: 2, signals: this.mission.signals.length, checkpoints: this.mission.checkpoints.length }); this.playerCue('SECTOR TWO · RELAY SPIRE', '#ffd06e'); } this.lowEnergyCueTimer = Math.max(0, this.lowEnergyCueTimer - delta); this.boostCooldown = Math.max(0, this.boostCooldown - delta); this.blasterCooldown = Math.max(0, this.blasterCooldown - delta); const previousDashCooldown = this.dashCooldown; this.dashCooldown = Math.max(0, this.dashCooldown - delta); this.dashTimer = Math.max(0, this.dashTimer - delta); this.wallJumpTimer = Math.max(0, this.wallJumpTimer - delta); const packageSpeed = this.package?.speedMultiplier || 1; if (!this.dashTimer) this.player.body.setMaxVelocityX(RUNNER_TUNING.maxRunSpeed * packageSpeed); if (previousDashCooldown > 0 && !this.dashCooldown) { const readyPulse = this.add.circle(this.player.x, this.player.y, 8, 0x8df4ff, .45).setDepth(11); this.tweens.add({ targets: readyPulse, scale: 2.4, alpha: 0, duration: 180, onComplete: () => readyPulse.destroy() }); this.playerCue('DASH READY'); } this.wallJumpCooldown = Math.max(0, this.wallJumpCooldown - delta);
    const upgrades = this.loadout.upgrades || []; this.energyMax = upgrades.includes('energyCore') ? 115 : 100; this.energy = Math.min(this.energyMax, this.energy + delta * .018 * (upgrades.includes('recharge') ? 1.2 : 1)); this.vaultCooldown = Math.max(0, this.vaultCooldown - delta); const previousGadgetCooldowns = this.gadgetCooldowns; this.gadgetCooldowns = this.gadgetCooldowns.map(cooldown => Math.max(0, cooldown - delta)); this.buildCooldowns = this.buildCooldowns.map(cooldown => Math.max(0, cooldown - delta)); previousGadgetCooldowns.forEach((cooldown, slot) => { if (cooldown > 0 && this.gadgetCooldowns[slot] === 0 && this.loadout.equipment?.[slot]) { this.playerCue(`${slot + 3} READY`, '#ffd06e'); const readyPulse = this.add.circle(this.player.x, this.player.y, 7, 0xffd06e, .4).setDepth(11); this.tweens.add({ targets: readyPulse, scale: 2.1, alpha: 0, duration: 180, onComplete: () => readyPulse.destroy() }); } }); this.empTimer = Math.max(0, (this.empTimer || 0) - delta); this.decoyTimer = Math.max(0, (this.decoyTimer || 0) - delta); this.boosterTimer = Math.max(0, (this.boosterTimer || 0) - delta); if (!this.empTimer) this.enemies?.getChildren().forEach(enemy => enemy.clearTint()); if (!this.decoyTimer && this.decoyBeacon) { this.decoyBeacon.destroy(); this.decoyBeacon = null; } if (this.boosterAura) { if (this.boosterTimer) this.boosterAura.setPosition(this.player.x, this.player.y); else { this.boosterAura.destroy(); this.boosterAura = null; } } if (Math.round(this.energy) !== this.energyEmit) { this.energyEmit = Math.round(this.energy); this.game.events.emit('energy', this.energyEmit / this.energyMax * 100); } this.movingGates?.getChildren().forEach(gate => gate.body.updateFromGameObject()); this.updateWeather(delta); this.updateEvents(); this.updateEnemies(delta); this.updateSciFiThreats(delta); this.updateRouteHints(); if (Phaser.Input.Keyboard.JustDown(this.keys.ONE) || this.mobileActions.build1) this.useBuild(0); if (Phaser.Input.Keyboard.JustDown(this.keys.TWO) || this.mobileActions.build2) this.useBuild(1); if (Phaser.Input.Keyboard.JustDown(this.keys.THREE) || this.mobileActions.gadget1) this.useGadget(0); if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR) || this.mobileActions.gadget2) this.useGadget(1); this.mobileActions.build1 = false; this.mobileActions.build2 = false; this.mobileActions.gadget1 = false; this.mobileActions.gadget2 = false;
    this.healthInvulnerable = Math.max(0, this.healthInvulnerable - delta); this.swordCooldown = Math.max(0, this.swordCooldown - delta); this.comboTimer = Math.max(0, this.comboTimer - delta); if (!this.comboTimer && this.combatCombo) { this.combatCombo = 0; this.game.events.emit('combo', 0, 0); } this.ammoRecharge += delta; if (this.ammo < this.ammoMax && this.ammoRecharge >= 1050) { this.ammo++; this.ammoRecharge = 0; this.game.events.emit('ammo', this.ammo / this.ammoMax * 100); } this.updateBuilds(); this.updateCombatTutorial(); this.updateNarrative(); const swordPressed = Phaser.Input.Keyboard.JustDown(this.keys.Q) || this.mobileActions.sword; this.mobileActions.sword = false; if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.useBlaster(); if (this.mobileActions.fire) this.useBlaster(); this.mobileActions.fire = false; if (swordPressed) this.useSword();
    const modifier = this.loadout.modifier; if (modifier?.id === 'lowEnergy') { this.energyMax = 65; this.energy = Math.min(this.energy, this.energyMax); } const body = this.player.body; const left = this.cursors.left.isDown || this.keys.A.isDown || this.mobileDirection === 'left'; const right = this.cursors.right.isDown || this.keys.D.isDown || this.mobileDirection === 'right';
    const onGround = body.blocked.down || body.touching.down;
    const movingAgainstVelocity = (left && body.velocity.x > 20) || (right && body.velocity.x < -20);
    const acceleration = (movingAgainstVelocity ? RUNNER_TUNING.turnAcceleration : onGround ? RUNNER_TUNING.groundAcceleration : RUNNER_TUNING.airAcceleration) * (!onGround && upgrades.includes('airControl') ? 1.12 : 1);
    if (left) { body.setAccelerationX(-acceleration).setDragX(0); this.player.setFlipX(true); } else if (right) { body.setAccelerationX(acceleration).setDragX(0); this.player.setFlipX(false); } else body.setAccelerationX(0).setDragX(onGround ? RUNNER_TUNING.groundDeceleration : 420); if (onGround && (upgrades.includes('stride') || modifier?.id === 'highSpeed')) body.setMaxVelocityX(RUNNER_TUNING.maxRunSpeed * packageSpeed * (modifier?.id === 'highSpeed' ? 1.12 : 1.04));
    body.setGravityY((body.velocity.y > 0 ? RUNNER_TUNING.fallGravity : 0) * (this.mission.gravityMode === 'low' ? .55 : 1) - (this.mission.gravityMode === 'low' ? 700 : 0));
    if (onGround) { this.coyote = RUNNER_TUNING.coyoteMs; this.jumpsUsed = 0; this.airDashUsed = false; } else this.coyote = Math.max(0, this.coyote - delta);
    const pressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || this.mobileActions.jump; this.mobileActions.jump = false;
    const released = Phaser.Input.Keyboard.JustUp(this.cursors.up) || Phaser.Input.Keyboard.JustUp(this.keys.W) || Phaser.Input.Keyboard.JustUp(this.keys.SPACE);
    if (pressed) this.jumpBuffer = RUNNER_TUNING.jumpBufferMs; else this.jumpBuffer = Math.max(0, this.jumpBuffer - delta);
    const wallDirection = (body.blocked.left || body.touching.left) ? 1 : (body.blocked.right || body.touching.right) ? -1 : 0;
    const wallRunning = this.abilities.has('wallRun') && wallDirection && !onGround && ((wallDirection === 1 && left) || (wallDirection === -1 && right)) && this.useEnergy(delta * .018, 'wallRun');
    if (wallRunning) body.setVelocityY(Math.min(body.velocity.y, 35)); else if (wallDirection && !onGround && body.velocity.y > 120) body.setVelocityY(120);
    const grabPressed = Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && this.abilities.has('ledgeGrab') && wallDirection && !onGround && body.velocity.y > 0;
    if (grabPressed && this.useEnergy(8, 'ledgeGrab')) { body.setVelocityY(-120); this.game.events.emit('feedback', 'ledgeGrab'); }
    if (this.abilities.has('climb') && wallDirection && this.keys.W.isDown && !onGround && this.useEnergy(delta * .024, 'climb')) body.setVelocityY(-260);
    const canWallJump = this.abilities.has('wallJump') && wallDirection && !onGround && this.wallJumpCooldown <= 0;
    if (this.jumpBuffer > 0 && ((this.coyote > 0) || (this.abilities.has('doubleJump') && this.jumpsUsed < 2) || canWallJump)) { if (canWallJump) { body.setVelocityX(445 * wallDirection); this.wallJumpCooldown = 160; this.wallJumpTimer = 150; this.jumpsUsed = 1; const wallX = this.player.x - wallDirection * 16; this.dust.emitParticleAt(wallX, this.player.y + 12, 8); this.speedLines.emitParticleAt(wallX, this.player.y, 4); const burst = this.add.circle(wallX, this.player.y, 7, 0x8df4ff, .5).setBlendMode(Phaser.BlendModes.ADD).setDepth(11); this.tweens.add({ targets: burst, scale: 2.2, alpha: 0, duration: 150, onComplete: () => burst.destroy() }); this.leaveAfterimage(); this.playerCue('WALL JUMP'); this.shake(35, .001); this.game.events.emit('feedback', 'wallJump'); } else { this.jumpsUsed++; if (this.jumpsUsed === 2) { this.leaveAfterimage(0xffd06e); this.playerCue('DOUBLE JUMP', '#ffd06e'); } } body.setVelocityY(RUNNER_TUNING.jumpVelocity); this.jumps++; this.coyote = 0; this.jumpBuffer = 0; this.jumpHeld = true; this.dust.emitParticleAt(this.player.x, this.player.y + 27, 5); this.speedLines.emitParticleAt(this.player.x, this.player.y + 22, 2); if (!canWallJump) this.game.events.emit('feedback', 'jump'); }
    const slidePressed = this.keys.S.isDown && onGround && Math.abs(body.velocity.x) > 120 && this.abilities.has('slide') && this.slideTimer <= 0; if (slidePressed && this.useEnergy(10, 'slide')) { this.slideTimer = 360; body.setVelocityX(Math.sign(body.velocity.x) * 560); this.player.setScale(1.12, .82); this.tweens.add({ targets: this.player, scaleX: 1, scaleY: 1, duration: 220 }); this.playerCue('SLIDE', '#ffd06e'); this.game.events.emit('feedback', 'slide'); }
    this.slideTimer = Math.max(0, this.slideTimer - delta);
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) || this.mobileActions.dash; this.mobileActions.dash = false; const canDash = modifier?.id !== 'noDash' && (onGround || (this.abilities.has('airDash') && !this.airDashUsed)); if (dashPressed && canDash && this.abilities.has('dash') && this.dashCooldown <= 0 && this.useEnergy(onGround ? 8 : 25, onGround ? 'dash' : 'airDash')) { const direction = right ? 1 : left ? -1 : this.player.flipX ? -1 : 1; const dashSpeed = RUNNER_TUNING.dashSpeed * (upgrades.includes('dashDrive') ? 1.08 : 1); if (!onGround) { this.airDashUsed = true; body.setVelocityY(0); this.playerCue('AIR DASH'); } const afterimage = this.add.sprite(this.player.x, this.player.y, this.player.texture.key).setFlipX(this.player.flipX).setTint(0x8df4ff).setAlpha(.5).setDepth(9); body.setMaxVelocityX(dashSpeed).setVelocityX(dashSpeed * direction); this.dashCooldown = RUNNER_TUNING.dashCooldownMs; this.dashTimer = RUNNER_TUNING.dashDurationMs; this.tweens.add({ targets: afterimage, x: afterimage.x - direction * 30, alpha: 0, duration: 160, onComplete: () => afterimage.destroy() }); this.game.events.emit('feedback', 'dash'); }
    if (released && body.velocity.y < -180 && this.jumpHeld) { body.setVelocityY(body.velocity.y * RUNNER_TUNING.jumpCutMultiplier); this.jumpHeld = false; }
    if (body.velocity.y >= 0) this.jumpHeld = false;
    if (!onGround) this.fallSpeed = Math.max(this.fallSpeed, body.velocity.y);
    if (onGround && !this.wasGrounded && this.fallSpeed > 80) { const hardLanding = this.fallSpeed > 260; this.dust.emitParticleAt(this.player.x, this.player.y + 28, hardLanding ? 12 : 4); this.speedLines.emitParticleAt(this.player.x, this.player.y + 28, hardLanding ? 4 : 1); if (hardLanding) { this.shake(70, .002); this.playerCue('HARD LANDING', '#ffcf82'); } if (!this.motionReduced) this.tweens.add({ targets: this.player, scaleX: hardLanding ? 1.12 : 1.04, scaleY: hardLanding ? .82 : .94, yoyo: true, duration: hardLanding ? 110 : 80 }); this.landingTimer = 110; this.game.events.emit('feedback', 'land'); }
    if (onGround) this.fallSpeed = 0;
    this.landingTimer = Math.max(0, (this.landingTimer || 0) - delta);
    if (this.dashTimer > 0) this.player.play('runner-dash', true); else if (this.wallJumpTimer > 0) this.player.play('runner-wall', true); else if (!onGround) this.player.play(body.velocity.y < 0 ? 'runner-jump' : 'runner-fall', true); else if (this.landingTimer > 0) this.player.play('runner-land', true); else if (Math.abs(body.velocity.x) > 35) this.player.play('runner-run', true); else this.player.play('runner-idle', true);
    this.dustTimer -= delta; if (onGround && Math.abs(body.velocity.x) > 100 && this.dustTimer <= 0) { this.dust.emitParticleAt(this.player.x, this.player.y + 28, 1); this.dustTimer = 90; }
    this.speedTimer -= delta; if (!this.motionReduced && Math.abs(body.velocity.x) > 280 && this.speedTimer <= 0) { this.speedLines.emitParticleAt(this.player.x - Math.sign(body.velocity.x) * 12, this.player.y - 2, 1); this.speedTimer = 45; }
    const speed = Math.abs(body.velocity.x); const parallaxBoost = !this.motionReduced ? Math.min(.07, Math.max(0, speed - 280) / 2600) : 0; this.parallaxLayers.forEach(({ layer, base }) => layer.setScrollFactor(base + parallaxBoost)); const targetOffsetY = body.velocity.y < -80 ? 20 : body.velocity.y > 150 ? 95 : 65;
    const targetOffsetX = body.velocity.x > 65 ? -155 : body.velocity.x < -65 ? 95 : -55;
    const targetZoom = !this.motionReduced && speed > 330 ? 1.018 : 1;
    this.cameraOffsetX = Phaser.Math.Linear(this.cameraOffsetX, targetOffsetX, Math.min(1, delta * .005)); this.cameraOffsetY = Phaser.Math.Linear(this.cameraOffsetY, targetOffsetY, Math.min(1, delta * .008)); this.cameraZoom = Phaser.Math.Linear(this.cameraZoom, targetZoom, Math.min(1, delta * .004)); this.cameras.main.setFollowOffset(this.cameraOffsetX, this.cameraOffsetY).setZoom(this.cameraZoom);
    this.blaster.setPosition(this.player.x + (this.player.flipX ? -22 : 22), this.player.y + 4).setFlipX(this.player.flipX); this.updateChaser(delta);
    this.wasGrounded = onGround;
    if (this.player.y > 805) this.fail('The rain swallowed the route below.');
    const progress = Math.min(100, Math.round(this.player.x / this.mission.goal.x * 100));
    if (progress !== this.lastProgress) { this.lastProgress = progress; this.game.events.emit('progress', progress); }
  }
}
