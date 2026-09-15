/* =========================================================
   UPDATE 11.9 — FINISH RELAY TOWER
   CINEMATIC / MOBILE-FRIENDLY / STABLE VERSION

   - Taller relay tower
   - Wider structure
   - Stronger core / beacon
   - Stable climb state
   - Mobile friendly
   - Prevents duplicate tower creation
   - Proper cleanup support
   - Gameplay logic preserved
   ========================================================= */

import Phaser from 'phaser';
import { RunnerScene } from './src/scenes/RunnerScene.js';

/* =========================================================
   TOWER CONFIG
   ========================================================= */

const TOWER = Object.freeze({
  height: 315,
  baseHeight: 34,

  towerWidth: 158,
  ladderWidth: 68,

  climbSpeed: 170,
  engageRadius: 84,

  topZoneWidth: 82,
  topZoneHeight: 44,

  baseColliderWidth: 140,

  supportHalfWidth: 68,
  innerSupportHalfWidth: 24,

  particles: 14,
  sideLights: 6
});

/* =========================================================
   PREVENT DOUBLE PATCH
   ========================================================= */

if (!window.__relayFinishTowerV11_9) {
  window.__relayFinishTowerV11_9 = true;

  const originalUpdate =
    RunnerScene.prototype.update;

  /* =======================================================
     HELPERS
     ======================================================= */

  const safeDestroy = object => {
    try {
      object?.destroy?.();
    } catch {}
  };

  const safeKillTweens = (scene, targets) => {
    try {
      if (!scene?.tweens) return;

      const list = Array.isArray(targets)
        ? targets
        : [targets];

      list
        .filter(Boolean)
        .forEach(target => {
          try {
            scene.tweens.killTweensOf(target);
          } catch {}
        });
    } catch {}
  };

  const destroyTower = scene => {
    if (!scene) return;

    const visuals =
      scene.finishTowerVisuals;

    if (visuals) {
      safeKillTweens(
        scene,
        Object.values(visuals)
          .flatMap(value =>
            Array.isArray(value)
              ? value
              : [value]
          )
      );

      [
        visuals.atmosphere,
        visuals.atmosphere2,

        visuals.coreGlow,
        visuals.coreGlow2,

        visuals.core,
        visuals.coreInner,

        visuals.ringOuter,
        visuals.ringMiddle,
        visuals.ringInner,

        visuals.orbit,

        visuals.beaconGlow,
        visuals.beacon,

        visuals.scanBeam,

        ...(visuals.sideLights || []),
        ...(visuals.particles || []),

        ...(visuals.labels || [])
      ].forEach(safeDestroy);
    }

    safeDestroy(scene.finishTowerBase);
    safeDestroy(scene.finishTowerZone);
    safeDestroy(scene.finishTowerTopZone);

    scene.finishTowerVisuals = null;
    scene.finishTowerBase = null;
    scene.finishTowerZone = null;
    scene.finishTowerTopZone = null;
    scene.finishTower = null;
    scene.finishTowerKeys = null;
  };

  const setPlayerGravity = (scene, enabled) => {
    try {
      scene.player?.body
        ?.setAllowGravity?.(enabled);
    } catch {}
  };

  const stopPlayerMovement = scene => {
    try {
      scene.player?.body?.setVelocity?.(0, 0);
    } catch {}
  };

  const restorePlayerTexture = scene => {
    try {
      if (
        scene.player?.texture &&
        scene.textures?.exists?.('runner-idle')
      ) {
        scene.player.setTexture('runner-idle');
      }
    } catch {}
  };

  const emitClimbState = (scene, active) => {
    try {
      scene.game?.events?.emit(
        'finish-tower-climb',
        {
          active
        }
      );
    } catch {}
  };

  const stopClimbing = scene => {
    const tower =
      scene.finishTower;

    if (!tower) {
      return;
    }

    tower.climbing = false;
    tower.request = false;

    setPlayerGravity(scene, true);
    stopPlayerMovement(scene);
    restorePlayerTexture(scene);

    emitClimbState(scene, false);
  };

  const activateTopFinish = scene => {
    const tower =
      scene.finishTower;

    if (
      !tower ||
      tower.completed ||
      scene.finished
    ) {
      return;
    }

    const wasFinished =
      Boolean(scene.finished);

    scene.complete?.();

    if (
      !scene.finished ||
      wasFinished
    ) {
      return;
    }

    tower.completed = true;
    tower.climbing = false;
    tower.request = false;

    setPlayerGravity(scene, true);

    try {
      scene.dismissIntelCard?.();
    } catch {}

    scene.briefingProtected = false;
    scene.cinematicActive = false;

    try {
      scene.game?.events?.emit(
        'finish-tower',
        {
          missionId:
            scene.mission?.id,

          runId:
            scene.runId
        }
      );

      scene.game?.events?.emit(
        'finish-tower-climb',
        {
          active: false
        }
      );
    } catch {}

    scene.activateFinishTowerVisuals?.();
  };

  /* =======================================================
     CREATE FINISH RELAY TOWER
     ======================================================= */

  RunnerScene.prototype.createGoal =
    function createFinishRelayTower() {

      /*
       * Prevent duplicate tower instances.
       */
      if (this.finishTower) {
        destroyTower(this);
      }

      const goal =
        this.mission?.goal;

      if (
        !goal ||
        !Number.isFinite(goal.x) ||
        !Number.isFinite(goal.y)
      ) {
        return;
      }

      const x = goal.x;
      const topY = goal.y;
      const baseY =
        topY + TOWER.height;

      this.finishTower = {
        x,
        topY,
        baseY,

        climbing: false,
        completed: false,
        request: false,
        visualActive: false
      };

      /* =====================================================
         LEGACY GOAL
         ===================================================== */

      try {
        this.goal =
          this.physics.add.staticImage(
            x,
            topY,
            'goal'
          );

        this.goal
          .setVisible(false)
          .setActive(false);

        if (this.goal.body) {
          this.goal.body.enable = false;
        }
      } catch {
        this.goal = null;
      }

      /* =====================================================
         DEPTH
         ===================================================== */

      const DEPTH = Object.freeze({
        atmosphere: 4,
        tower: 5,
        fx: 6,
        core: 8,
        labels: 10,
        burst: 999
      });

      /* =====================================================
         ATMOSPHERE
         ===================================================== */

      const atmosphere =
        this.add
          .circle(
            x,
            topY + 20,
            88,
            0xffd06e,
            0.042
          )
          .setDepth(
            DEPTH.atmosphere
          );

      const atmosphere2 =
        this.add
          .circle(
            x,
            topY + 20,
            61,
            0xffe0a8,
            0.052
          )
          .setDepth(
            DEPTH.atmosphere
          );

      /* =====================================================
         MAIN TOWER
         ===================================================== */

      const graphics =
        this.add
          .graphics()
          .setDepth(
            DEPTH.tower
          );

      const baseWidth =
        TOWER.towerWidth;

      /* =====================================================
         BASE
         ===================================================== */

      graphics.fillStyle(
        0x0b1422,
        0.98
      );

      graphics.fillRoundedRect(
        x - baseWidth / 2,
        baseY - 7,
        baseWidth,
        TOWER.baseHeight + 9,
        9
      );

      graphics.lineStyle(
        2,
        0x6f879e,
        0.9
      );

      graphics.strokeRoundedRect(
        x - baseWidth / 2,
        baseY - 7,
        baseWidth,
        TOWER.baseHeight + 9,
        9
      );

      /* =====================================================
         ENERGY STRIP
         ===================================================== */

      graphics.fillStyle(
        0xffd06e,
        0.18
      );

      graphics.fillRect(
        x - 75,
        baseY - 5,
        150,
        5
      );

      graphics.fillStyle(
        0xffd06e,
        0.78
      );

      graphics.fillRect(
        x - 48,
        baseY - 5,
        96,
        2
      );

      /* =====================================================
         MAIN SUPPORTS
         ===================================================== */

      graphics.lineStyle(
        7,
        0x344b63,
        0.98
      );

      graphics.lineBetween(
        x - TOWER.supportHalfWidth,
        baseY,
        x - 36,
        topY + 34
      );

      graphics.lineBetween(
        x + TOWER.supportHalfWidth,
        baseY,
        x + 36,
        topY + 34
      );

      /* =====================================================
         INNER SUPPORTS
         ===================================================== */

      graphics.lineStyle(
        3,
        0x8fa4b7,
        0.78
      );

      graphics.lineBetween(
        x - TOWER.innerSupportHalfWidth,
        baseY - 5,
        x - TOWER.innerSupportHalfWidth,
        topY + 35
      );

      graphics.lineBetween(
        x + TOWER.innerSupportHalfWidth,
        baseY - 5,
        x + TOWER.innerSupportHalfWidth,
        topY + 35
      );

      /* =====================================================
         CROSS BRACES
         ===================================================== */

      graphics.lineStyle(
        2,
        0x8ba2b7,
        0.62
      );

      for (
        let y = baseY - 38;
        y > topY + 44;
        y -= 42
      ) {
        const progress =
          Phaser.Math.Clamp(
            (baseY - y) /
              TOWER.height,
            0,
            1
          );

        const half =
          Phaser.Math.Linear(
            61,
            33,
            progress
          );

        graphics.lineBetween(
          x - half,
          y,
          x + half,
          y
        );

        graphics.lineBetween(
          x - half + 6,
          y - 13,
          x + half - 6,
          y + 13
        );
      }

      /* =====================================================
         LADDER
         ===================================================== */

      graphics.lineStyle(
        4,
        0xb8c7d5,
        0.92
      );

      graphics.lineBetween(
        x - 24,
        baseY - 6,
        x - 24,
        topY + 34
      );

      graphics.lineBetween(
        x + 24,
        baseY - 6,
        x + 24,
        topY + 34
      );

      graphics.lineStyle(
        2,
        0xffd06e,
        0.78
      );

      for (
        let y = baseY - 15;
        y > topY + 35;
        y -= 24
      ) {
        graphics.lineBetween(
          x - 23,
          y,
          x + 23,
          y
        );
      }

      /* =====================================================
         TOP HOUSING
         ===================================================== */

      graphics.fillStyle(
        0x101e31,
        0.99
      );

      graphics.fillRoundedRect(
        x - 42,
        topY - 9,
        84,
        37,
        9
      );

      graphics.lineStyle(
        2,
        0xffd06e,
        0.96
      );

      graphics.strokeRoundedRect(
        x - 42,
        topY - 9,
        84,
        37,
        9
      );

      graphics.lineStyle(
        2,
        0x9eb2c4,
        0.52
      );

      graphics.strokeRoundedRect(
        x - 32,
        topY - 1,
        64,
        22,
        5
      );

      /* =====================================================
         ANTENNA
         ===================================================== */

      graphics.lineStyle(
        4,
        0xffe0a8,
        0.96
      );

      graphics.lineBetween(
        x,
        topY - 9,
        x,
        topY - 49
      );

      graphics.lineStyle(
        2,
        0xffd06e,
        0.86
      );

      graphics.lineBetween(
        x,
        topY - 43,
        x + 40,
        topY - 28
      );

      graphics.lineBetween(
        x,
        topY - 43,
        x - 29,
        topY - 31
      );

      /* =====================================================
         ENERGY RAILS
         ===================================================== */

      graphics.lineStyle(
        3,
        0xffd06e,
        0.5
      );

      graphics.lineBetween(
        x - 34,
        topY + 30,
        x - 34,
        baseY - 7
      );

      graphics.lineBetween(
        x + 34,
        topY + 30,
        x + 34,
        baseY - 7
      );

      /* =====================================================
         CORE
         ===================================================== */

      const coreX = x;
      const coreY = topY + 11;

      const coreGlow =
        this.add
          .circle(
            coreX,
            coreY,
            42,
            0xffd06e,
            0.085
          )
          .setDepth(
            DEPTH.fx
          );

      const coreGlow2 =
        this.add
          .circle(
            coreX,
            coreY,
            28,
            0xffe0a8,
            0.125
          )
          .setDepth(
            DEPTH.fx
          );

      const core =
        this.add
          .circle(
            coreX,
            coreY,
            11,
            0xfff1c7,
            1
          )
          .setDepth(
            DEPTH.core
          );

      const coreInner =
        this.add
          .circle(
            coreX,
            coreY,
            5,
            0xffffff,
            1
          )
          .setDepth(
            DEPTH.core + 1
          );

      /* =====================================================
         CORE RINGS
         ===================================================== */

      const ringOuter =
        this.add
          .circle(
            coreX,
            coreY,
            35,
            0
          )
          .setStrokeStyle(
            2,
            0xffd06e,
            0.72
          )
          .setDepth(
            DEPTH.fx
          );

      const ringMiddle =
        this.add
          .circle(
            coreX,
            coreY,
            25,
            0
          )
          .setStrokeStyle(
            2,
            0xffe0a8,
            0.64
          )
          .setDepth(
            DEPTH.fx
          );

      const ringInner =
        this.add
          .circle(
            coreX,
            coreY,
            15,
            0
          )
          .setStrokeStyle(
            1,
            0xffffff,
            0.68
          )
          .setDepth(
            DEPTH.fx
          );

      /* =====================================================
         ORBIT
         ===================================================== */

      const orbit =
        this.add
          .graphics()
          .setDepth(
            DEPTH.fx
          );

      orbit.lineStyle(
        2,
        0xffd06e,
        0.68
      );

      orbit.lineBetween(
        x - 45,
        coreY,
        x - 31,
        coreY - 10
      );

      orbit.lineBetween(
        x + 31,
        coreY + 10,
        x + 45,
        coreY
      );

      /* =====================================================
         BEACON
         ===================================================== */

      const beaconY =
        topY - 49;

      const beaconGlow =
        this.add
          .circle(
            x,
            beaconY,
            20,
            0xffd06e,
            0.095
          )
          .setDepth(
            DEPTH.fx
          );

      const beacon =
        this.add
          .circle(
            x,
            beaconY,
            6,
            0xfff1c7,
            1
          )
          .setDepth(
            DEPTH.core
          );

      /* =====================================================
         SCAN BEAM
         ===================================================== */

      const scanBeam =
        this.add
          .rectangle(
            x,
            topY + 82,
            4,
            128,
            0xffd06e,
            0.095
          )
          .setDepth(
            DEPTH.fx
          );

      /* =====================================================
         SIDE LIGHTS
         ===================================================== */

      const sideLights = [];

      for (
        let i = 0;
        i < TOWER.sideLights;
        i += 1
      ) {
        const y =
          topY +
          50 +
          i * 40;

        const left =
          this.add
            .circle(
              x - 31,
              y,
              3,
              0xffd06e,
              0.8
            )
            .setDepth(
              DEPTH.fx
            );

        const right =
          this.add
            .circle(
              x + 31,
              y,
              3,
              0xffd06e,
              0.8
            )
            .setDepth(
              DEPTH.fx
            );

        sideLights.push(
          left,
          right
        );
      }

      /* =====================================================
         PARTICLES
         ===================================================== */

      const particles = [];

      for (
        let i = 0;
        i < TOWER.particles;
        i += 1
      ) {
        const particle =
          this.add
            .circle(
              x +
                Phaser.Math.Between(
                  -42,
                  42
                ),
              topY +
                Phaser.Math.Between(
                  26,
                  270
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
            .setDepth(
              DEPTH.fx
            );

        particles.push(
          particle
        );

        if (!this.motionReduced) {
          this.tweens.add({
            targets: particle,

            y:
              particle.y -
              Phaser.Math.Between(
                20,
                46
              ),

            alpha: 0,

            duration:
              Phaser.Math.Between(
                950,
                1700
              ),

            delay:
              Phaser.Math.Between(
                0,
                1000
              ),

            repeat: -1,

            onRepeat: () => {
              if (
                !particle.active
              ) {
                return;
              }

              particle.y =
                topY +
                Phaser.Math.Between(
                  45,
                  275
                );

              particle.x =
                x +
                Phaser.Math.Between(
                  -42,
                  42
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

      /* =====================================================
         LABELS
         ===================================================== */

      const labels = [];

      labels.push(
        this.add
          .text(
            x,
            topY - 80,
            'RELAY TOWER',
            {
              fontFamily: 'DM Mono',
              fontSize: '12px',
              color: '#ffe0a8',
              stroke: '#08101c',
              strokeThickness: 4,
              letterSpacing: 1.1
            }
          )
          .setOrigin(0.5)
          .setDepth(
            DEPTH.labels
          )
      );

      labels.push(
        this.add
          .text(
            x,
            topY - 61,
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
          .setDepth(
            DEPTH.labels
          )
          .setAlpha(0.72)
      );

      labels.push(
        this.add
          .text(
            x,
            baseY + 40,
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
          .setDepth(
            DEPTH.labels
          )
          .setAlpha(0.82)
      );

      labels.push(
        this.add
          .text(
            x,
            baseY - 58,
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
          .setDepth(
            DEPTH.labels
          )
          .setAlpha(0.74)
      );

      /* =====================================================
         STORE VISUALS
         ===================================================== */

      this.finishTowerVisuals = {
        graphics,

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
        particles,

        labels
      };

      /* =====================================================
         IDLE ANIMATION
         ===================================================== */

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
          y: topY + 205,
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

      /* =====================================================
         BASE COLLIDER
         ===================================================== */

      const base =
        this.add
          .rectangle(
            x,
            baseY + 10,
            TOWER.baseColliderWidth,
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

      if (this.player) {
        this.physics.add.collider(
          this.player,
          base
        );
      }

      /* =====================================================
         CLIMB ZONE
         ===================================================== */

      const climbHeight =
        Math.max(
          1,
          baseY - topY
        );

      this.finishTowerZone =
        this.add.zone(
          x,
          topY + climbHeight / 2,
          TOWER.ladderWidth,
          climbHeight
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
          const tower =
            this.finishTower;

          if (
            !tower ||
            tower.completed ||
            tower.climbing ||
            this.cinematicActive
          ) {
            return;
          }

          tower.request = true;
        }
      );

      /* =====================================================
         TOP ZONE
         ===================================================== */

      this.finishTowerTopZone =
        this.add.zone(
          x,
          topY + 8,
          TOWER.topZoneWidth,
          TOWER.topZoneHeight
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
          const tower =
            this.finishTower;

          if (
            !tower ||
            tower.completed ||
            !tower.climbing ||
            this.finished
          ) {
            return;
          }

          activateTopFinish(this);
        }
      );

      this.finishTowerKeys =
        this.keys;
    };

  /* =======================================================
     ACTIVATION EFFECT
     ======================================================= */

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

      tower.visualActive = true;

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
        tower.topY + 11;

      /* =====================================================
         STOP IDLE ANIMATION
         ===================================================== */

      safeKillTweens(
        this,
        [
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

          ...sideLights,
          ...particles
        ]
      );

      /* =====================================================
         CORE ACTIVATION
         ===================================================== */

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

      /* =====================================================
         RINGS
         ===================================================== */

      [
        [ringOuter, 3.8, 700],
        [ringMiddle, 3, 560],
        [ringInner, 2.5, 420]
      ].forEach(
        ([target, scale, duration]) => {
          this.tweens.add({
            targets: target,

            scale,
            alpha: 0,

            duration,

            ease: 'Cubic.easeOut'
          });
        }
      );

      /* =====================================================
         BEACON
         ===================================================== */

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

      /* =====================================================
         SCAN BEAM
         ===================================================== */

      this.tweens.add({
        targets: scanBeam,

        scaleX: 8,
        scaleY: 1.35,

        alpha: 0.42,

        duration: 220,

        yoyo: true,

        ease: 'Cubic.easeOut'
      });

      /* =====================================================
         SIDE LIGHTS
         ===================================================== */

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

      /* =====================================================
         PARTICLE BURST
         ===================================================== */

      particles.forEach(
        (particle, index) => {

          safeKillTweens(
            this,
            particle
          );

          this.tweens.add({
            targets: particle,

            y:
              tower.topY -
              Phaser.Math.Between(
                35,
                110
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

      /* =====================================================
         SCREEN FLASH
         ===================================================== */

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
          .setDepth(
            DEPTH_BURST
          );

      this.tweens.add({
        targets: flash,

        alpha: 0.18,

        duration: 90,

        yoyo: true,

        hold: 70,

        onComplete: () => {
          safeDestroy(flash);
        }
      });

      /* =====================================================
         COMPLETION WAVES
         ===================================================== */

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
            .setDepth(
              DEPTH_BURST
            );

        this.tweens.add({
          targets: burst,

          scale:
            8 +
            i * 2,

          alpha: 0,

          duration:
            850 +
            i * 170,

          delay:
            i * 100,

          ease: 'Cubic.easeOut',

          onComplete: () => {
            safeDestroy(burst);
          }
        });
      }

      /* =====================================================
         VERTICAL ENERGY
         ===================================================== */

      for (
        let i = 0;
        i < 4;
        i += 1
      ) {
        const beam =
          this.add
            .rectangle(
              x +
                (i - 1.5) * 20,
              tower.topY + 100,
              2,
              100,
              0xffd06e,
              0.28
            )
            .setDepth(
              DEPTH_BURST
            );

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
            safeDestroy(beam);
          }
        });
      }

      atmosphere.setAlpha(0.08);
      atmosphere2.setAlpha(0.10);
    };

  /* =======================================================
     GAMEPLAY UPDATE
     ======================================================= */

  RunnerScene.prototype.update =
    function finishTowerUpdate(
      time,
      delta
    ) {

      const scene =
        this;

      const tower =
        scene.finishTower;

      /*
       * Always preserve the original RunnerScene update.
       */
      const result =
        originalUpdate.apply(
          scene,
          arguments
        );

      if (
        !tower ||
        tower.completed ||
        !scene.player?.body
      ) {
        return result;
      }

      /* =====================================================
         CINEMATIC LOCK
         ===================================================== */

      if (
        scene.cinematicActive
      ) {
        if (
          scene.mobileActions?.jump
        ) {
          scene.mobileActions.jump =
            false;

          try {
            scene.cinematicSkipHandler?.();
          } catch {}
        }

        return result;
      }

      /* =====================================================
         INPUT
         ===================================================== */

      const keys =
        scene.finishTowerKeys ||
        scene.keys ||
        {};

      const jumpPressed =
        Boolean(
          scene.mobileActions?.jump ||
          scene.keys?.W?.isDown ||
          scene.keys?.SPACE?.isDown ||
          scene.cursors?.up?.isDown
        );

      const movingDown =
        Boolean(
          keys.S?.isDown ||
          scene.cursors?.down?.isDown
        );

      /* =====================================================
         PROXIMITY
         ===================================================== */

      const distanceX =
        Math.abs(
          scene.player.x -
          tower.x
        );

      const near =
        distanceX <=
          TOWER.engageRadius &&
        scene.player.y >=
          tower.topY - 35 &&
        scene.player.y <=
          tower.baseY + 30;

      /* =====================================================
         START CLIMB
         ===================================================== */

      if (
        !tower.climbing &&
        near &&
        (
          tower.request ||
          jumpPressed ||
          scene.player.body.velocity.y < -120
        )
      ) {
        tower.climbing = true;
        tower.request = false;

        setPlayerGravity(
          scene,
          false
        );

        stopPlayerMovement(
          scene
        );

        try {
          if (
            scene.textures?.exists?.(
              'runner-wall'
            )
          ) {
            scene.player.setTexture(
              'runner-wall'
            );
          }
        } catch {}

        emitClimbState(
          scene,
          true
        );
      }

      if (
        !tower.climbing
      ) {
        return result;
      }

      /* =====================================================
         CLIMB MOTION
         ===================================================== */

      setPlayerGravity(
        scene,
        false
      );

      stopPlayerMovement(
        scene
      );

      /*
       * Pull the player toward the center
       * of the ladder smoothly.
       */
      scene.player.x =
        Phaser.Math.Linear(
          scene.player.x,
          tower.x,
          0.28
        );

      /*
       * Default movement is UP.
       * Holding DOWN reverses to DOWN.
       */
      const climbDirection =
        movingDown
          ? 1
          : -1;

      scene.player.y +=
        TOWER.climbSpeed *
        climbDirection *
        delta /
        1000;

      /* =====================================================
         CLAMP
         ===================================================== */

      const minY =
        tower.topY + 16;

      const maxY =
        tower.baseY - 28;

      scene.player.y =
        Phaser.Math.Clamp(
          scene.player.y,
          minY,
          maxY
        );

      /* =====================================================
         REACHED TOP
         ===================================================== */

      if (
        scene.player.y <=
        minY
      ) {
        scene.player.y =
          minY;
      }

      /* =====================================================
         RETURN TO BOTTOM
         ===================================================== */

      if (
        scene.player.y >= maxY &&
        movingDown
      ) {
        stopClimbing(
          scene
        );
      }

      return result;
    };

  /* =======================================================
     SCENE CLEANUP
     ======================================================= */

  const originalShutdown =
    RunnerScene.prototype.shutdown;

  if (
    typeof originalShutdown ===
    'function'
  ) {
    RunnerScene.prototype.shutdown =
      function finishTowerShutdown() {

        destroyTower(this);

        return originalShutdown.apply(
          this,
          arguments
        );
      };
  }

  const originalDestroy =
    RunnerScene.prototype.destroy;

  if (
    typeof originalDestroy ===
    'function'
  ) {
    RunnerScene.prototype.destroy =
      function finishTowerDestroy() {

        destroyTower(this);

        return originalDestroy.apply(
          this,
          arguments
        );
      };
  }
}
