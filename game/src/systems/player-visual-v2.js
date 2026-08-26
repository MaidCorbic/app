import Phaser from 'phaser';

// Polished player presentation layer. Gameplay physics and collision remain on the original player body.
export function installPlayerVisualV2(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__playerVisualV2Installed) return;
  RunnerScene.prototype.__playerVisualV2Installed = true;
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function (...args) {
    originalCreate.apply(this, args);
    if (!this.player || this.playerVisualV2) return;
    this.player.setAlpha(0);
    const root = this.add.container(this.player.x, this.player.y - 4).setDepth(12).setName('player-visual-v2');
    const shadow = this.add.ellipse(0, 33, 30, 7, 0x02060c, .42);
    const aura = this.add.circle(0, 1, 28, 0x63e6ff, .055).setBlendMode(Phaser.BlendModes.ADD);
    const coat = this.add.polygon(0, 7, [-14,-4,-24,14,-12,11,-6,26,3,13], 0x0b1628, 1);
    const torso = this.add.rectangle(0, 5, 23, 30, 0x172b43, 1).setStrokeStyle(1, 0x4c708c, .8);
    const chest = this.add.rectangle(0, 5, 16, 20, 0x29455f, 1);
    const coreGlow = this.add.circle(0, 5, 9, 0x8df4ff, .10).setBlendMode(Phaser.BlendModes.ADD);
    const core = this.add.circle(0, 5, 4, 0x9cf7ff, 1).setBlendMode(Phaser.BlendModes.ADD);
    const helmet = this.add.circle(0, -15, 12, 0x203b58, 1).setStrokeStyle(1, 0x668aa4, .9);
    const visor = this.add.rectangle(0, -14, 22, 8, 0x07101d, 1);
    const visorLine = this.add.rectangle(0, -14, 14, 2, 0xd8fbff, .95).setBlendMode(Phaser.BlendModes.ADD);
    const shoulderL = this.add.circle(-12, -1, 5, 0x294761, 1);
    const shoulderR = this.add.circle(12, -1, 5, 0x294761, 1);
    const armL = this.add.rectangle(-15, 10, 5, 20, 0x152940, 1);
    const armR = this.add.rectangle(15, 10, 5, 20, 0x152940, 1);
    const gloveL = this.add.circle(-15, 20, 3, 0x8df4ff, .85).setBlendMode(Phaser.BlendModes.ADD);
    const gloveR = this.add.circle(15, 20, 3, 0x8df4ff, .85).setBlendMode(Phaser.BlendModes.ADD);
    const legL = this.add.rectangle(-6, 23, 7, 16, 0x0b1628, 1);
    const legR = this.add.rectangle(6, 23, 7, 16, 0x0b1628, 1);
    const bootL = this.add.rectangle(-7, 31, 11, 4, 0x2b4762, 1);
    const bootR = this.add.rectangle(7, 31, 11, 4, 0x2b4762, 1);
    const stripe = this.add.rectangle(0, 0, 2, 22, 0xffd06e, .9).setBlendMode(Phaser.BlendModes.ADD);
    const shoulderLightL = this.add.circle(-12, -1, 2, 0x8df4ff, .8).setBlendMode(Phaser.BlendModes.ADD);
    const shoulderLightR = this.add.circle(12, -1, 2, 0x8df4ff, .8).setBlendMode(Phaser.BlendModes.ADD);
    root.add([shadow,aura,coat,torso,chest,coreGlow,core,helmet,visor,visorLine,shoulderL,shoulderR,armL,armR,gloveL,gloveR,legL,legR,bootL,bootR,stripe,shoulderLightL,shoulderLightR]);
    if (!this.motionReduced) {
      this.tweens.add({ targets: [coreGlow, aura], scale: { from: .9, to: 1.12 }, alpha: { from: .08, to: .18 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.tweens.add({ targets: visorLine, alpha: { from: .55, to: 1 }, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    const updateVisual = () => {
      const player = this.player;
      if (!player || !this.playerVisualV2) return;
      const key = player.anims?.currentAnim?.key || 'runner-idle';
      const mode = key.replace('runner-', '');
      root.setPosition(player.x, player.y - 4);
      const airborne = mode === 'jump' || mode === 'fall';
      const running = mode === 'run';
      const dash = mode === 'dash';
      const hit = mode === 'hit';
      const baseScaleX = dash ? 1.14 : running ? 1.035 : 1;
      root.setScale(player.flipX ? -baseScaleX : baseScaleX, dash ? .88 : 1);
      root.setAngle(mode === 'jump' ? -3 : mode === 'fall' ? 3 : hit ? 7 : 0);
      shadow.setScale(airborne ? .7 : 1, airborne ? .7 : 1);
      aura.setAlpha(dash ? .16 : running ? .075 : .055);
      core.setFillStyle(dash ? 0xffd06e : hit ? 0xff826e : 0x9cf7ff, 1);
      stripe.setAlpha(dash ? 1 : .78);
      visorLine.setAlpha(hit ? .35 : .95);
      coat.setAlpha(dash ? .7 : 1);
    };
    this.playerVisualV2 = { root, update: updateVisual };
    updateVisual();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.playerVisualV2?.root?.destroy(true);
      this.playerVisualV2 = null;
    });
  };

  RunnerScene.prototype.update = function (...args) {
    originalUpdate.apply(this, args);
    this.playerVisualV2?.update();
  };
}
