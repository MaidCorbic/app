/* UPDATE 11.7 — Finish Relay Tower cinematic visual upgrade */
import Phaser from 'phaser';
import { RunnerScene } from './src/scenes/RunnerScene.js';

const TOWER = {
  height: 250,
  baseHeight: 28,
  ladderWidth: 58,
  climbSpeed: 170,
  engageRadius: 72
};

if (!window.__relayFinishTowerV11) {
  window.__relayFinishTowerV11 = true;

  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.createGoal = function createFinishRelayTower() {
    const x = this.mission.goal.x;
    const topY = this.mission.goal.y;
    const baseY = Math.min(620, topY + TOWER.height);

    this.finishTower = {
      x,
      topY,
      baseY,
      climbing: false,
      completed: false,
      request: false,
      visualActive: false
    };

    // Existing goal remains available to the completion system.
    this.goal = this.physics.add
      .staticImage(x, topY, 'goal')
      .setVisible(false);

    this.goal.body.enable = false;

    /*
     * ============================================================
     * FINISH TOWER VISUALS
     * ============================================================
     */

    const towerDepth = 5;
    const fxDepth = 6;
    const coreDepth = 8;

    /*
     * Atmospheric glow.
     */
    const atmosphere = this.add
      .circle(
        x,
        topY + 18,
        76,
        0xffd06e,
        0.045
      )
      .setDepth(4);

    const atmosphere2 = this.add
      .circle(
        x,
        topY + 18,
        52,
        0xffe0a8,
        0.055
      )
      .setDepth(4);

    /*
     * Main tower.
     */
    const g = this.add
      .graphics()
      .setDepth(towerDepth);

    // Base.
    g.fillStyle(0x0b1422, 0.98);
    g.fillRoundedRect(
      x - 64,
      baseY - 6,
      128,
      TOWER.baseHeight + 8,
      8
    );

    g.lineStyle(
      2,
      0x6f879e,
      0.85
    );

    g.strokeRoundedRect(
      x - 64,
      baseY - 6,
      128,
      TOWER.baseHeight + 8,
      8
    );

    // Energy strip.
    g.fillStyle(
      0xffd06e,
      0.18
    );

    g.fillRect(
      x - 60,
      baseY - 4,
      120,
      5
    );

    g.fillStyle(
      0xffd06e,
      0.72
    );

    g.fillRect(
      x - 38,
      baseY - 4,
      76,
      2
    );

    /*
     * Main supports.
     */
    g.lineStyle(
      6,
      0x344b63,
      0.98
    );

    g.lineBetween(
      x - 54,
      baseY,
      x - 30,
      topY + 28
    );

    g.lineBetween(
      x + 54,
      baseY,
      x + 30,
      topY + 28
    );

    /*
     * Inner supports.
     */
    g.lineStyle(
      3,
      0x8fa4b7,
      0.78
    );

    g.lineBetween(
      x - 22,
      baseY - 4,
      x - 22,
      topY + 30
    );

    g.lineBetween(
      x + 22,
      baseY - 4,
      x + 22,
      topY + 30
    );

    /*
     * Cross braces.
     */
    g.lineStyle(
      2,
      0x8ba2b7,
      0.62
    );

    for (
      let y = baseY - 34;
      y > topY + 38;
      y -= 38
    ) {
      const t =
        (baseY - y) /
        TOWER.height;

      const half =
        Phaser.Math.Linear(
          49,
          27,
          t
        );

      g.lineBetween(
        x - half,
        y,
        x + half,
        y
      );

      g.lineBetween(
        x - half + 5,
        y - 12,
        x + half - 5,
        y + 12
      );
    }

    /*
     * Ladder.
     */
    g.lineStyle(
      4,
      0xb8c7d5,
      0.9
    );

    g.lineBetween(
      x - 22,
      baseY - 5,
      x - 22,
      topY + 28
    );

    g.lineBetween(
      x + 22,
      baseY - 5,
      x + 22,
      topY + 28
    );

    g.lineStyle(
      2,
      0xffd06e,
      0.75
    );

    for (
      let y = baseY - 14;
      y > topY + 30;
      y -= 22
    ) {
      g.lineBetween(
        x - 21,
        y,
        x + 21,
        y
      );
    }

    /*
     * Top housing.
     */
    g.fillStyle(
      0x101e31,
      0.99
    );

    g.fillRoundedRect(
      x - 38,
      topY - 8,
      76,
      34,
      8
    );

    g.lineStyle(
      2,
      0xffd06e,
      0.95
    );

    g.strokeRoundedRect(
      x - 38,
      topY - 8,
      76,
      34,
      8
    );

    g.lineStyle(
      2,
      0x9eb2c4,
      0.5
    );

    g.strokeRoundedRect(
      x - 29,
      topY - 1,
      58,
      20,
      5
    );

    /*
     * Antenna.
     */
    g.lineStyle(
      4,
      0xffe0a8,
      0.95
    );

    g.lineBetween(
      x,
      topY - 8,
      x,
      topY - 42
    );

    g.lineStyle(
      2,
      0xffd06e,
      0.85
    );

    g.lineBetween(
      x,
      topY - 37,
      x + 36,
      topY - 24
    );

    g.lineBetween(
      x,
      topY - 37,
      x - 25,
      topY - 27
    );

    /*
     * Energy rails.
     */
    g.lineStyle(
      3,
      0xffd06e,
      0.48
    );

    g.lineBetween(
      x - 30,
      topY + 28,
      x - 30,
      baseY - 6
    );

    g.lineBetween(
      x + 30,
      topY + 28,
      x + 30,
      baseY - 6
    );

    /*
     * ============================================================
     * ENERGY CORE
     * ============================================================
     */

    const coreGlow = this.add
      .circle(
        x,
        topY + 10,
        34,
        0xffd06e,
        0.09
      )
      .setDepth(fxDepth);

    const coreGlow2 = this.add
      .circle(
        x,
        topY + 10,
        23,
        0xffe0a8,
        0.13
      )
      .setDepth(fxDepth);

    const core = this.add
      .circle(
        x,
        topY + 10,
        9,
        0xfff1c7,
        1
      )
      .setDepth(coreDepth);

    const coreInner = this.add
      .circle(
        x,
        topY + 10,
        4,
        0xffffff,
        1
      )
      .setDepth(coreDepth + 1);

    /*
     * Rings.
     */
    const ringOuter = this.add
      .circle(
        x,
        topY + 10,
        30,
        0
      )
      .setStrokeStyle(
        2,
        0xffd06e,
        0.72
      )
      .setDepth(fxDepth);

    const ringMiddle = this.add
      .circle(
        x,
        topY + 10,
        21,
        0
      )
      .setStrokeStyle(
        2,
        0xffe0a8,
        0.64
      )
      .setDepth(fxDepth);

    const ringInner = this.add
      .circle(
        x,
        topY + 10,
        13,
        0
      )
      .setStrokeStyle(
        1,
        0xffffff,
        0.68
      )
      .setDepth(fxDepth);

    /*
     * Orbit graphics.
     */
    const orbit = this.add
      .graphics()
      .setDepth(fxDepth);

    orbit.lineStyle(
      2,
      0xffd06e,
      0.68
    );

    orbit.lineBetween(
      x - 39,
      topY + 10,
      x - 27,
      topY + 2
    );

    orbit.lineBetween(
      x + 27,
      topY + 18,
      x + 39,
      topY + 10
    );

    /*
     * Beacon.
     */
    const beaconGlow = this.add
      .circle(
        x,
        topY - 42,
        16,
        0xffd06e,
        0.10
      )
      .setDepth(fxDepth);

    const beacon = this.add
      .circle(
        x,
        topY - 42,
        5,
        0xfff1c7,
        1
      )
      .setDepth(coreDepth);

    /*
     * Scanning beam.
     */
    const scanBeam = this.add
      .rectangle(
        x,
        topY + 74,
        3,
        112,
        0xffd06e,
        0.10
      )
      .setDepth(fxDepth);

    /*
     * Side energy lights.
     */
    const sideLights = [];

    for (
      let i = 0;
      i < 5;
      i += 1
    ) {
      const y =
        topY +
        48 +
        i * 35;

      const left = this.add
        .circle(
          x - 27,
          y,
          3,
          0xffd06e,
          0.78
        )
        .setDepth(fxDepth);

      const right = this.add
        .circle(
          x + 27,
          y,
          3,
          0xffd06e,
          0.78
        )
        .setDepth(fxDepth);

      sideLights.push(
        left,
        right
      );
    }

    /*
     * Small floating energy particles.
     *
     * These are regular Phaser circles, so no external
     * texture or particle-manager dependency is required.
     */
    const particles = [];

    for (
      let i = 0;
      i < 12;
      i += 1
    ) {
      const particle = this.add
        .circle(
          x +
            Phaser.Math.Between(
              -34,
              34
            ),
          topY +
            Phaser.Math.Between(
              24,
              215
            ),
          Phaser.Math.Between(
            1,
            2
          ),
          0xffd06e,
          Phaser.Math.FloatBetween(
            0.18,
            0.55
          )
        )
        .setDepth(fxDepth);

      particles.push(
        particle
      );

      if (!this.motionReduced) {
        this.tweens.add({
          targets: particle,
          y: particle.y - Phaser.Math.Between(
            18,
            42
          ),
          alpha: 0,
          duration: Phaser.Math.Between(
            900,
            1600
          ),
          delay: Phaser.Math.Between(
            0,
            1000
          ),
          repeat: -1,
          onRepeat: () => {
            particle.y =
              topY +
              Phaser.Math.Between(
                40,
                220
              );

            particle.x =
              x +
              Phaser.Math.Between(
                -34,
                34
              );

            particle.alpha =
              Phaser.Math.FloatBetween(
                0.18,
                0.55
              );
          }
        });
      }
    }

    /*
     * Store visual references.
     */
    this.finishTowerVisuals = {
      graphics: g,
      atmosphere,
      atmosphere2,
      coreGlow,
      coreGlow2,
      core,
      coreInner,
      ringOuter,
      ringMiddle,
      ringInner,
      orbit,
      beaconGlow,
      beacon,
      scanBeam,
      sideLights,
      particles
    };

    /*
     * ============================================================
     * IDLE ANIMATION
     * ============================================================
     */

    if (!this.motionReduced) {
      this.tweens.add({
        targets: atmosphere,
        scale: 1.18,
        alpha: 0.02,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: atmosphere2,
        scale: 1.24,
        alpha: 0.025,
        duration: 950,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: core,
        scale: 1.34,
        alpha: 0.55,
        duration: 620,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: coreGlow,
        scale: 1.25,
        alpha: 0.035,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: coreGlow2,
        scale: 1.32,
        alpha: 0.055,
        duration: 760,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: ringOuter,
        scale: 1.32,
        alpha: 0.05,
        duration: 1050,
        repeat: -1,
        ease: 'Sine.easeOut'
      });

      this.tweens.add({
        targets: ringMiddle,
        scale: 1.24,
        alpha: 0.08,
        duration: 820,
        repeat: -1,
        ease: 'Sine.easeOut'
      });

      this.tweens.add({
        targets: ringInner,
        scale: 1.18,
        alpha: 0.16,
        duration: 560,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: beacon,
        alpha: 0.25,
        scale: 1.45,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: beaconGlow,
        alpha: 0.025,
        scale: 1.35,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: scanBeam,
        y: topY + 190,
        alpha: 0.025,
        duration: 1450,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });

      sideLights.forEach(
        (light, index) => {
          this.tweens.add({
            targets: light,
            alpha: 0.2,
            duration:
              420 +
              index * 70,
            delay:
              index * 90,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      );

      this.tweens.add({
        targets: orbit,
        angle: 360,
        duration: 4200,
        repeat: -1,
        ease: 'Linear'
      });
    }

    /*
     * Labels.
     */
    this.add
      .text(
        x,
        topY - 72,
        'RELAY TOWER',
        {
          fontFamily: 'DM Mono',
          fontSize: '11px',
          color: '#ffe0a8',
          stroke: '#08101c',
          strokeThickness: 4,
          letterSpacing: 1
        }
      )
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(
        x,
        topY - 55,
        'SECURE // TRANSMIT',
        {
          fontFamily: 'DM Mono',
          fontSize: '7px',
          color: '#9bb0c2',
          stroke: '#08101c',
          strokeThickness: 3,
          letterSpacing: 1
        }
      )
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0.72);

    this.add
      .text(
        x,
        baseY + 36,
        'CLIMB TO SECURE RELAY',
        {
          fontFamily: 'DM Mono',
          fontSize: '9px',
          color: '#9bb0c2',
          stroke: '#08101c',
          strokeThickness: 3,
          letterSpacing: 0.6
        }
      )
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0.82);

    this.add
      .text(
        x,
        baseY - 53,
        '↑ / JUMP',
        {
          fontFamily: 'DM Mono',
          fontSize: '8px',
          color: '#ffd06e',
          stroke: '#08101c',
          strokeThickness: 3,
          letterSpacing: 0.8
        }
      )
      .setOrigin(0.5)
      .setDepth(10)
      .setAlpha(0.74);

    /*
     * ============================================================
     * PHYSICS — UNCHANGED BEHAVIOUR
     * ============================================================
     */

    const base = this.add
      .rectangle(
        x,
        baseY + 10,
        116,
        TOWER.baseHeight,
        0x000000,
        0
      )
      .setVisible(false);

    this.physics.add.existing(
      base,
      true
    );

    this.finishTowerBase =
      base;

    this.physics.add.collider(
      this.player,
      base
    );

    this.finishTowerZone =
      this.add.zone(
        x,
        (topY + baseY) / 2,
        TOWER.ladderWidth,
        baseY - topY
      );

    this.physics.add.existing(
      this.finishTowerZone
    );

    this.finishTowerZone.body
      .setAllowGravity(false)
      .setImmovable(true);

    this.physics.add.overlap(
      this.player,
      this.finishTowerZone,
      () => {
        if (
          !this.finishTower.completed &&
          !this.cinematicActive
        ) {
          this.finishTower.request =
            true;
        }
      }
    );

    this.finishTowerTopZone =
      this.add.zone(
        x,
        topY + 8,
        72,
        42
      );

    this.physics.add.existing(
      this.finishTowerTopZone
    );

    this.finishTowerTopZone.body
      .setAllowGravity(false)
      .setImmovable(true);

    this.physics.add.overlap(
      this.player,
      this.finishTowerTopZone,
      () => {
        if (
          this.finishTower.completed ||
          !this.finishTower.climbing ||
          this.finished
        ) {
          return;
        }

        const wasFinished =
          this.finished;

        this.complete();

        if (
          this.finished &&
          !wasFinished
        ) {
          this.finishTower.completed =
            true;

          this.finishTower.climbing =
            false;

          this.player.body
            .setAllowGravity(true);

          this.dismissIntelCard?.();

          this.briefingProtected =
            false;

          this.cinematicActive =
            false;

          this.game.events.emit(
            'finish-tower',
            {
              missionId:
                this.mission.id,
              runId:
                this.runId
            }
          );

          this.game.events.emit(
            'finish-tower-climb',
            {
              active: false
            }
          );

          this.activateFinishTowerVisuals();
        }
      }
    );

    this.finishTowerKeys =
      this.keys;
  };

  /*
   * ============================================================
   * ACTIVATION EFFECT
   * ============================================================
   */

  RunnerScene.prototype.activateFinishTowerVisuals =
    function activateFinishTowerVisuals() {
      const tower =
        this.finishTower;

      const visuals =
        this.finishTowerVisuals;

      if (
        !tower ||
        !visuals ||
        tower.visualActive
      ) {
        return;
      }

      tower.visualActive =
        true;

      const {
        atmosphere,
        atmosphere2,
        coreGlow,
        coreGlow2,
        core,
        ringOuter,
        ringMiddle,
        ringInner,
        beaconGlow,
        beacon,
        scanBeam,
        sideLights,
        particles
      } = visuals;

      const x =
        tower.x;

      const y =
        tower.topY + 10;

      /*
       * Stop idle core animations.
       */
      this.tweens.killTweensOf([
        core,
        coreGlow,
        coreGlow2,
        ringOuter,
        ringMiddle,
        ringInner,
        beacon,
        beaconGlow
      ]);

      /*
       * Core activation.
       */
      this.tweens.add({
        targets: [
          core,
          coreGlow,
          coreGlow2
        ],
        scale: 2.2,
        alpha: 1,
        duration: 280,
        ease: 'Back.easeOut'
      });

      /*
       * Energy rings.
       */
      this.tweens.add({
        targets: ringOuter,
        scale: 3.8,
        alpha: 0,
        duration: 700,
        ease: 'Cubic.easeOut'
      });

      this.tweens.add({
        targets: ringMiddle,
        scale: 3,
        alpha: 0,
        duration: 560,
        ease: 'Cubic.easeOut'
      });

      this.tweens.add({
        targets: ringInner,
        scale: 2.5,
        alpha: 0,
        duration: 420,
        ease: 'Cubic.easeOut'
      });

      /*
       * Beacon.
       */
      this.tweens.add({
        targets: beacon,
        scale: 2.8,
        alpha: 1,
        duration: 220,
        yoyo: true,
        ease: 'Cubic.easeOut'
      });

      this.tweens.add({
        targets: beaconGlow,
        scale: 3.2,
        alpha: 0.35,
        duration: 280,
        yoyo: true,
        ease: 'Cubic.easeOut'
      });

      /*
       * Scan beam.
       */
      this.tweens.add({
        targets: scanBeam,
        scaleX: 8,
        scaleY: 1.35,
        alpha: 0.42,
        duration: 220,
        yoyo: true,
        ease: 'Cubic.easeOut'
      });

      /*
       * Side lights.
       */
      sideLights.forEach(
        (light, index) => {
          this.tweens.add({
            targets: light,
            scale: 2.6,
            alpha: 1,
            duration: 130,
            delay:
              index * 55,
            yoyo: true,
            ease: 'Quad.easeOut'
          });
        }
      );

      /*
       * Ambient particles fly upward.
       */
      particles.forEach(
        (particle, index) => {
          this.tweens.killTweensOf(
            particle
          );

          this.tweens.add({
            targets: particle,
            y:
              tower.topY -
              Phaser.Math.Between(
                30,
                100
              ),
            alpha: 0,
            scale: 2,
            duration:
              450 +
              index * 35,
            delay:
              index * 35,
            ease: 'Cubic.easeOut'
          });
        }
      );

      /*
       * Tower-wide flash.
       */
      const flash =
        this.add
          .rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.scale.width * 1.5,
            this.scale.height * 1.5,
            0xffe0a8,
            0
          )
          .setScrollFactor(0)
          .setDepth(999);

      this.tweens.add({
        targets: flash,
        alpha: 0.18,
        duration: 90,
        yoyo: true,
        hold: 70,
        onComplete: () => {
          flash.destroy();
        }
      });

      /*
       * Three expanding completion waves.
       */
      for (
        let i = 0;
        i < 3;
        i += 1
      ) {
        const burst =
          this.add
            .circle(
              x,
              y,
              10,
              0,
              0
            )
            .setStrokeStyle(
              2,
              0xffd06e,
              0.85
            )
            .setDepth(999);

        this.tweens.add({
          targets: burst,
          scale:
            8 + i * 2,
          alpha: 0,
          duration:
            850 +
            i * 170,
          delay:
            i * 100,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            burst.destroy();
          }
        });
      }

      /*
       * Small vertical energy columns.
       */
      for (
        let i = 0;
        i < 4;
        i += 1
      ) {
        const beam =
          this.add
            .rectangle(
              x +
                (i - 1.5) *
                  18,
              tower.topY + 90,
              2,
              90,
              0xffd06e,
              0.28
            )
            .setDepth(999);

        this.tweens.add({
          targets: beam,
          scaleY: 2.8,
          alpha: 0,
          duration:
            650 +
            i * 80,
          delay:
            i * 80,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            beam.destroy();
          }
        });
      }

      /*
       * Keep references valid.
       */
      atmosphere.setAlpha(0.08);
      atmosphere2.setAlpha(0.10);
    };

  /*
   * ============================================================
   * GAMEPLAY UPDATE
   * ============================================================
   */

  RunnerScene.prototype.update =
    function finishTowerUpdate(
      time,
      delta
    ) {
      const mobileJumpBeforeUpdate =
        Boolean(
          this.mobileActions?.jump
        );

      const jumpBeforeUpdate =
        Boolean(
          this.keys?.W?.isDown ||
          this.keys?.SPACE?.isDown ||
          this.cursors?.up?.isDown
        );

      const result =
        originalUpdate.apply(
          this,
          arguments
        );

      const tower =
        this.finishTower;

      if (
        !tower ||
        tower.completed ||
        !this.player?.body
      ) {
        return result;
      }

      if (
        this.cinematicActive
      ) {
        if (
          mobileJumpBeforeUpdate
        ) {
          this.mobileActions.jump =
            false;

          this.cinematicSkipHandler?.();
        }

        return result;
      }

      const keys =
        this.finishTowerKeys ||
        {};

      const down =
        keys.S?.isDown ||
        this.cursors?.down?.isDown;

      const near =
        Math.abs(
          this.player.x -
          tower.x
        ) <=
          TOWER.engageRadius &&
        this.player.y >=
          tower.topY - 35 &&
        this.player.y <=
          tower.baseY + 30;

      /*
       * Start climbing.
       */
      if (
        !tower.climbing &&
        near &&
        (
          tower.request ||
          mobileJumpBeforeUpdate ||
          jumpBeforeUpdate ||
          this.player.body.velocity.y <
            -120
        )
      ) {
        tower.climbing =
          true;

        tower.request =
          false;

        this.player.body
          .setAllowGravity(false)
          .setVelocity(0, 0);

        this.player.setTexture(
          'runner-wall'
        );

        this.game.events.emit(
          'finish-tower-climb',
          {
            active: true
          }
        );
      }

      if (
        !tower.climbing
      ) {
        return result;
      }

      /*
       * Climbing.
       */
      this.player.body
        .setAllowGravity(false)
        .setVelocity(0, 0);

      this.player.x =
        Phaser.Math.Linear(
          this.player.x,
          tower.x,
          0.28
        );

      const direction =
        down ? -1 : 1;

      this.player.y -=
        TOWER.climbSpeed *
        direction *
        delta /
        1000;

      this.player.y =
        Phaser.Math.Clamp(
          this.player.y,
          tower.topY + 12,
          tower.baseY - 28
        );

      /*
       * Top clamp.
       */
      if (
        this.player.y <=
        tower.topY + 18
      ) {
        this.player.y =
          tower.topY + 16;
      }

      /*
       * Return down.
       */
      if (
        this.player.y >=
          tower.baseY - 28 &&
        down
      ) {
        tower.climbing =
          false;

        this.player.body
          .setAllowGravity(true);

        this.player.setTexture(
          'runner-idle'
        );

        this.game.events.emit(
          'finish-tower-climb',
          {
            active: false
          }
        );
      }

      return result;
    };
  }
