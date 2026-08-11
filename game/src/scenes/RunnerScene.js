import Phaser from 'phaser';

export class RunnerScene extends Phaser.Scene {
  constructor() { super('runner'); }

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
    runner('runner-idle', 60, 60, 40); runner('runner-run-a', 56, 63, 50); runner('runner-run-b', 63, 56, 27); runner('runner-jump', 54, 54, 30); runner('runner-fall', 62, 62, 58); runner('runner-land', 55, 55, 42); runner('runner-hit', 62, 62, 62); runner('runner-finish', 50, 50, 18);
    make('signal', 48, 48, g => g.fillStyle(0xffd06e, .18).fillCircle(24, 24, 21).fillStyle(0xffd06e).fillCircle(24, 24, 7));
    make('barrier', 48, 64, g => g.fillStyle(0x202b39).fillRect(3, 3, 42, 58).lineStyle(3, 0xff826e).strokeRect(4, 4, 40, 56).lineBetween(7, 8, 41, 56).lineBetween(41, 8, 7, 56));
    make('goal', 56, 68, g => g.lineStyle(4, 0xe5ecf1).lineBetween(10, 66, 10, 4).fillStyle(0xffd06e).fillTriangle(12, 9, 48, 21, 12, 36));
    make('rain', 8, 14, g => g.lineStyle(2, 0xd9e9ff, .45).lineBetween(6, 0, 1, 13));
    make('dust', 10, 10, g => g.fillStyle(0xd6dbe2, .65).fillCircle(5, 5, 4));
  }

  createAnimations() {
    if (this.anims.exists('runner-run')) return;
    this.anims.create({ key: 'runner-idle', frames: [{ key: 'runner-idle' }], frameRate: 1 });
    this.anims.create({ key: 'runner-run', frames: [{ key: 'runner-run-a' }, { key: 'runner-run-b' }], frameRate: 11, repeat: -1 });
    this.anims.create({ key: 'runner-jump', frames: [{ key: 'runner-jump' }], frameRate: 1 });
    this.anims.create({ key: 'runner-fall', frames: [{ key: 'runner-fall' }], frameRate: 1 });
    this.anims.create({ key: 'runner-land', frames: [{ key: 'runner-land' }], frameRate: 1 });
    this.anims.create({ key: 'runner-hit', frames: [{ key: 'runner-hit' }], frameRate: 1 });
    this.anims.create({ key: 'runner-finish', frames: [{ key: 'runner-finish' }], frameRate: 1 });
  }

  init({ mission, rain }) {
    this.mission = mission; this.rainEnabled = rain; this.collected = 0; this.finished = false; this.coyote = 0; this.jumpBuffer = 0; this.dustTimer = 0; this.wasGrounded = false; this.fallSpeed = 0; this.cameraOffsetY = 65;
  }

  create() {
    if (!this.textures.exists('runner-idle')) this.createTextures();
    this.createAnimations();
    this.physics.world.setBounds(0, 0, 4100, 720);
    this.createEnvironment(); this.createPlatforms(); this.createWorldLandmarks(); this.createPlayer(); this.createSignals(); this.createHazards(); this.createGoal(); this.createAtmosphere(); this.createGuides();
    this.cameras.main.setBounds(0, 0, 4100, 720).startFollow(this.player, true, .08, .08, -145, this.cameraOffsetY).setDeadzone(200, 110);
    this.game.events.emit('runner-ready');
  }

  createEnvironment() {
    const sky = this.add.graphics().setScrollFactor(0);
    sky.fillGradientStyle(0x07101e, 0x07101e, 0x344766, 0x344766, 1).fillRect(0, 0, 1500, 720);
    sky.fillStyle(0xffe0a8, .14).fillCircle(975, 104, 104).fillStyle(0xffe0a8).fillCircle(975, 104, 58).fillStyle(0x10182a).fillCircle(1002, 87, 58);
    const distant = this.add.graphics().setScrollFactor(.12);
    for (let x = -200; x < 4500; x += 120) { const h = 105 + ((x / 120 + 7) % 5) * 27; distant.fillStyle(0x14213a).fillRect(x, 570 - h, 88, h).fillStyle(0xffd079, .25).fillRect(x + 17, 490 - h / 4, 7, 5); }
    const middle = this.add.graphics().setScrollFactor(.38);
    for (let x = -120; x < 4400; x += 280) {
      middle.fillStyle(0x1b2943).fillRect(x, 395, 210, 215).fillStyle(0x263653).fillRect(x + 24, 320, 132, 290);
      for (let y = 348; y < 570; y += 28) middle.fillStyle(0xffcd7a, .28).fillRect(x + 48, y, 12, 7).fillRect(x + 104, y, 12, 7);
      middle.lineStyle(2, 0x657b92, .45).lineBetween(x + 167, 390, x + 167, 590).lineBetween(x + 167, 430, x + 205, 430);
    }
    const foreground = this.add.graphics().setScrollFactor(.72);
    for (let x = -200; x < 4400; x += 390) {
      foreground.fillStyle(0x0a1220, .78).fillRect(x + 20, 475, 24, 245).fillRect(x + 105, 530, 15, 190).fillStyle(0x131f30).fillRect(x, 628, 270, 92);
      foreground.lineStyle(3, 0x52677d, .6).lineBetween(x + 44, 505, x + 130, 505).lineBetween(x + 44, 505, x + 44, 580);
    }
  }

  createPlatforms() {
    this.platforms = this.physics.add.staticGroup();
    this.mission.platforms.forEach(([x, y, width, height, type]) => {
      const platform = this.add.rectangle(x + width / 2, y + height / 2, width, height, type === 'roof' ? 0x293950 : 0x202d43).setStrokeStyle(3, 0x7c94a9);
      this.physics.add.existing(platform, true); this.platforms.add(platform);
      const detail = this.add.graphics(); detail.fillStyle(0x111a29); for (let mark = x + 18; mark < x + width; mark += 34) detail.fillRect(mark, y + 18, 16, 6); detail.fillStyle(0x9eb6c8, .18).fillRect(x, y + 5, width, 3);
      if (type === 'roof') detail.lineStyle(2, 0xaabccc).lineBetween(x + 14, y, x + 14, y - 18).lineBetween(x + 14, y - 18, x + width - 14, y - 18).lineBetween(x + width - 14, y - 18, x + width - 14, y);
    });
    const props = this.add.graphics();
    props.fillStyle(0x192238).fillRect(90, 508, 72, 102).fillStyle(0xffbd5b).fillRect(104, 523, 44, 20);
    props.lineStyle(4, 0x7e91a2).lineBetween(1070, 610, 1070, 430).lineBetween(1070, 430, 1180, 430).lineBetween(1180, 430, 1180, 610);
    props.fillStyle(0x34233a).fillRect(1770, 455, 140, 58).fillStyle(0xff7580).fillRect(1784, 470, 112, 25);
  }

  createWorldLandmarks() {
    const world = this.add.graphics();
    // Lamps, directional signs, and the distant relay tower make the route readable without UI text.
    [160, 870, 1515, 2410, 3270, 3860].forEach(x => {
      world.lineStyle(4, 0x566d80).lineBetween(x, 610, x, 510).lineBetween(x, 510, x + 26, 510);
      world.fillStyle(0xffd06e, .14).fillCircle(x + 26, 520, 34).fillStyle(0xffd06e).fillCircle(x + 26, 520, 5);
    });
    world.fillStyle(0x29334a).fillRect(535, 540, 102, 32).fillStyle(0xffd06e).fillTriangle(550, 548, 550, 565, 574, 556);
    world.fillStyle(0x29334a).fillRect(880, 540, 76, 28).fillStyle(0xff826e).fillRect(892, 548, 52, 4);
    world.fillStyle(0x172238).fillRect(3830, 370, 82, 240).fillStyle(0x2e4059).fillRect(3850, 315, 42, 300);
    world.lineStyle(4, 0xe2ebf0).lineBetween(3870, 315, 3870, 220).lineStyle(3, 0xffd06e, .8).lineBetween(3870, 225, 3925, 245);
    world.fillStyle(0xffd06e, .15).fillCircle(3870, 225, 65).fillStyle(0xffd06e).fillCircle(3870, 225, 9);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(this.mission.spawn.x, this.mission.spawn.y, 'runner-idle').setCollideWorldBounds(true).setDepth(10);
    this.player.body.setSize(28, 55).setOffset(10, 5).setMaxVelocityX(330).setDragX(1800);
    this.player.play('runner-idle'); this.physics.add.collider(this.player, this.platforms);
    this.cursors = this.input.keyboard.createCursorKeys(); this.keys = this.input.keyboard.addKeys('A,D,W,SPACE');
  }

  createSignals() {
    this.signals = this.physics.add.group();
    this.mission.signals.forEach(([x, y]) => {
      const signal = this.signals.create(x, y, 'signal').setImmovable(true); signal.body.setAllowGravity(false); this.tweens.add({ targets: signal, y: y - 7, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
    this.physics.add.overlap(this.player, this.signals, (_, signal) => this.collectSignal(signal), undefined, this);
  }

  createHazards() {
    this.barriers = this.physics.add.staticGroup();
    this.mission.obstacles.forEach(([x, y]) => { const barrier = this.barriers.create(x + 24, y + 32, 'barrier'); this.tweens.add({ targets: barrier, alpha: { from: 1, to: .62 }, duration: 360, yoyo: true, repeat: -1 }); });
    this.physics.add.overlap(this.player, this.barriers, () => this.fail('A live barrier cut the delivery short.'), undefined, this);
  }

  createGoal() {
    this.goal = this.physics.add.staticImage(this.mission.goal.x, this.mission.goal.y, 'goal').setOrigin(0, 0); this.goal.refreshBody();
    this.tweens.add({ targets: this.goal, scaleX: 1.06, scaleY: 1.06, duration: 680, yoyo: true, repeat: -1 });
    this.physics.add.overlap(this.player, this.goal, () => this.complete(), undefined, this);
  }

  createAtmosphere() {
    this.rain = this.add.particles(0, 0, 'rain', { x: { min: 0, max: 1350 }, y: -10, speedY: { min: 320, max: 470 }, speedX: -55, lifespan: 1700, frequency: 35, quantity: 1, scale: { start: .55, end: .55 }, alpha: { start: .5, end: 0 }, blendMode: 'ADD' }).setScrollFactor(.4).setVisible(this.rainEnabled);
    this.dust = this.add.particles(0, 0, 'dust', { speedX: { min: -45, max: 45 }, speedY: { min: -15, max: -70 }, lifespan: 350, quantity: 0, scale: { start: .7, end: 0 }, alpha: { start: .4, end: 0 } });
  }

  createGuides() {
    this.mission.guides?.forEach(({ x, y, text }) => {
      const guide = this.add.text(x, y, text, { fontFamily: 'DM Mono', fontSize: '11px', color: '#ffd06e', stroke: '#08101c', strokeThickness: 4 }).setDepth(2);
      this.tweens.add({ targets: guide, alpha: { from: .9, to: .25 }, y: y - 5, duration: 900, yoyo: true, repeat: -1 });
    });
  }

  collectSignal(signal) {
    if (!signal.active) return; this.dust.emitParticleAt(signal.x, signal.y, 9); signal.disableBody(true, true); this.collected++; this.game.events.emit('signal', this.collected);
    const label = this.add.text(signal.x, signal.y - 30, '+ SIGNAL', { fontFamily: 'DM Mono', fontSize: '10px', color: '#ffd06e', stroke: '#08101c', strokeThickness: 4 }).setOrigin(.5).setDepth(12);
    this.tweens.add({ targets: label, y: label.y - 26, alpha: 0, duration: 520, onComplete: () => label.destroy() });
    this.tweens.add({ targets: this.player, scaleX: 1.12, scaleY: 1.12, yoyo: true, duration: 90 });
  }
  complete() {
    if (this.finished) return; this.finished = true; this.physics.pause(); this.player.play('runner-finish', true); this.player.setTint(0xffefad); this.cameras.main.flash(220, 255, 208, 110);
    this.dust.emitParticleAt(this.goal.x + 20, this.goal.y + 25, 18); this.tweens.add({ targets: this.player, y: this.player.y - 12, duration: 130, yoyo: true, repeat: 1 });
    this.time.delayedCall(260, () => this.game.events.emit('complete', this.collected));
  }
  fail(message) {
    if (this.finished) return; this.finished = true; this.physics.pause(); this.player.play('runner-hit', true); this.player.setTint(0xff826e); this.cameras.main.shake(150, .012); this.cameras.main.flash(110, 255, 100, 90);
    this.time.delayedCall(180, () => this.game.events.emit('fail', message));
  }

  update(_, delta) {
    if (this.finished) return;
    const body = this.player.body; const left = this.cursors.left.isDown || this.keys.A.isDown; const right = this.cursors.right.isDown || this.keys.D.isDown;
    if (left) { body.setAccelerationX(-1900); this.player.setFlipX(true); } else if (right) { body.setAccelerationX(1900); this.player.setFlipX(false); } else body.setAccelerationX(0);
    const onGround = body.blocked.down;
    if (onGround) this.coyote = 105; else this.coyote = Math.max(0, this.coyote - delta);
    const pressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    if (pressed) this.jumpBuffer = 110; else this.jumpBuffer = Math.max(0, this.jumpBuffer - delta);
    if (this.jumpBuffer > 0 && this.coyote > 0) { body.setVelocityY(-660); this.coyote = 0; this.jumpBuffer = 0; this.dust.emitParticleAt(this.player.x, this.player.y + 27, 4); }
    if (!onGround) this.fallSpeed = Math.max(this.fallSpeed, body.velocity.y);
    if (onGround && !this.wasGrounded && this.fallSpeed > 260) { this.dust.emitParticleAt(this.player.x, this.player.y + 28, 7); this.cameras.main.shake(70, .002); this.tweens.add({ targets: this.player, scaleY: .9, yoyo: true, duration: 80 }); this.landingTimer = 110; }
    if (onGround) this.fallSpeed = 0;
    this.landingTimer = Math.max(0, (this.landingTimer || 0) - delta);
    if (!onGround) this.player.play(body.velocity.y < 0 ? 'runner-jump' : 'runner-fall', true); else if (this.landingTimer > 0) this.player.play('runner-land', true); else if (Math.abs(body.velocity.x) > 35) this.player.play('runner-run', true); else this.player.play('runner-idle', true);
    this.dustTimer -= delta; if (onGround && Math.abs(body.velocity.x) > 100 && this.dustTimer <= 0) { this.dust.emitParticleAt(this.player.x, this.player.y + 28, 1); this.dustTimer = 90; }
    const targetOffsetY = body.velocity.y < -80 ? 20 : body.velocity.y > 150 ? 95 : 65;
    this.cameraOffsetY = Phaser.Math.Linear(this.cameraOffsetY, targetOffsetY, Math.min(1, delta * .008)); this.cameras.main.setFollowOffset(-145, this.cameraOffsetY);
    this.wasGrounded = onGround;
    if (this.player.y > 760) this.fail('The rain swallowed the route below.');
    this.game.events.emit('progress', Math.min(100, Math.round(this.player.x / this.mission.goal.x * 100)));
  }
}
