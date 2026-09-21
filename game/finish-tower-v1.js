/* =========================================================
   UPDATE 12.0 — BRUTAL RELAY TOWER
   CINEMATIC TACTICAL RELAY / MOBILE / STABLE

   - Premium tactical relay tower
   - Stronger structural geometry
   - Cyan + amber energy system
   - Reactor core with layered rings
   - Signal antenna
   - Animated energy rails
   - Particle field
   - Activation cinematic
   - Screen flash + camera shake
   - Stable climbing
   - Duplicate protection
   - Proper cleanup
   - Original gameplay update preserved
   ========================================================= */

import Phaser from 'phaser';
import { RunnerScene } from './src/scenes/RunnerScene.js';


/* =========================================================
   TOWER CONFIG
   ========================================================= */

const TOWER = Object.freeze({

  height: 330,

  baseHeight: 38,

  towerWidth: 172,

  ladderWidth: 72,

  climbSpeed: 170,

  engageRadius: 88,

  topZoneWidth: 88,

  topZoneHeight: 48,

  baseColliderWidth: 150,

  supportHalfWidth: 74,

  innerSupportHalfWidth: 27,

  particles: 22,

  sideLights: 8,

  energyRails: 4

});


/* =========================================================
   PREVENT DOUBLE PATCH
   ========================================================= */

if (!window.__relayFinishTowerV12) {

  window.__relayFinishTowerV12 = true;


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

      const list =
        Array.isArray(targets)
          ? targets
          : [targets];

      list
        .filter(Boolean)
        .forEach(target => {

          try {

            scene.tweens.killTweensOf(
              target
            );

          } catch {}

        });

    } catch {}

  };


  const stopPlayerMovement = scene => {

    try {

      scene.player?.body?.setVelocity?.(
        0,
        0
      );

    } catch {}

  };


  const setPlayerGravity = (
    scene,
    enabled
  ) => {

    try {

      scene.player?.body
        ?.setAllowGravity?.(
          enabled
        );

    } catch {}

  };


  const restorePlayerTexture = scene => {

    try {

      if (
        scene.player?.texture &&
        scene.textures?.exists?.(
          'runner-idle'
        )
      ) {

        scene.player.setTexture(
          'runner-idle'
        );

      }

    } catch {}

  };


  const emitClimbState = (
    scene,
    active
  ) => {

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


    tower.climbing =
      false;

    tower.request =
      false;


    setPlayerGravity(
      scene,
      true
    );


    stopPlayerMovement(
      scene
    );


    restorePlayerTexture(
      scene
    );


    emitClimbState(
      scene,
      false
    );

  };


  /* =======================================================
     DESTROY TOWER
     ======================================================= */

  const destroyTower = scene => {

    if (!scene) return;


    const visuals =
      scene.finishTowerVisuals;


    if (visuals) {

      safeKillTweens(
        scene,

        Object.values(
          visuals
        )
        .flatMap(value =>
          Array.isArray(value)
            ? value
            : [value]
        )
      );


      [

        visuals.graphics,

        visuals.atmosphere,
        visuals.atmosphere2,
        visuals.atmosphere3,

        visuals.coreGlow,
        visuals.coreGlow2,
        visuals.coreGlow3,

        visuals.core,
        visuals.coreInner,

        visuals.ringOuter,
        visuals.ringMiddle,
        visuals.ringInner,

        visuals.orbit,

        visuals.beaconGlow,
        visuals.beacon,

        visuals.signalPulse,

        visuals.scanBeam,

        visuals.energyRails,

        ...(visuals.sideLights || []),

        ...(visuals.particles || []),

        ...(visuals.labels || [])

      ].flat().forEach(
        safeDestroy
      );

    }


    safeDestroy(
      scene.finishTowerBase
    );

    safeDestroy(
      scene.finishTowerZone
    );

    safeDestroy(
      scene.finishTowerTopZone
    );


    scene.finishTowerVisuals =
      null;

    scene.finishTowerBase =
      null;

    scene.finishTowerZone =
      null;

    scene.finishTowerTopZone =
      null;

    scene.finishTower =
      null;

    scene.finishTowerKeys =
      null;

  };


  /* =======================================================
     FINISH
     ======================================================= */

  const activateTopFinish =
    scene => {

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
        Boolean(
          scene.finished
        );


      scene.complete?.();


      if (
        !scene.finished ||
        wasFinished
      ) {

        return;

      }


      tower.completed =
        true;

      tower.climbing =
        false;

      tower.request =
        false;


      setPlayerGravity(
        scene,
        true
      );


      try {

        scene.dismissIntelCard?.();

      } catch {}


      scene.briefingProtected =
        false;

      scene.cinematicActive =
        false;


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
     CREATE RELAY TOWER
     ======================================================= */

  RunnerScene.prototype.createGoal =
    function createFinishRelayTower() {


      /* ---------------------------------------------------
         DUPLICATE PROTECTION
         --------------------------------------------------- */

      if (this.finishTower) {

        destroyTower(
          this
        );

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


      const x =
        goal.x;


      const topY =
        goal.y;


      const baseY =
        topY +
        TOWER.height;


      this.finishTower = {

        x,

        topY,

        baseY,

        climbing: false,

        completed: false,

        request: false,

        visualActive: false

      };


      /* ===================================================
         LEGACY GOAL
         =================================================== */

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


        if (
          this.goal.body
        ) {

          this.goal.body.enable =
            false;

        }

      } catch {

        this.goal =
          null;

      }


      /* ===================================================
         DEPTH
         =================================================== */

      const DEPTH =
        Object.freeze({

          atmosphere: 4,

          tower: 5,

          fx: 6,

          core: 8,

          labels: 10,

          burst: 999

        });


      /* ===================================================
         ATMOSPHERE
         =================================================== */

      const atmosphere =
        this.add
          .circle(
            x,
            topY + 18,
            104,
            0x00eaff,
            0.035
          )
          .setDepth(
            DEPTH.atmosphere
          );


      const atmosphere2 =
        this.add
          .circle(
            x,
            topY + 18,
            76,
            0xffd06e,
            0.045
          )
          .setDepth(
            DEPTH.atmosphere
          );


      const atmosphere3 =
        this.add
          .circle(
            x,
            topY + 18,
            48,
            0xffffff,
            0.025
          )
          .setDepth(
            DEPTH.atmosphere
          );


      /* ===================================================
         MAIN GRAPHICS
         =================================================== */

      const graphics =
        this.add
          .graphics()
          .setDepth(
            DEPTH.tower
          );


      const baseWidth =
        TOWER.towerWidth;


      /* ===================================================
         BASE SHADOW
         =================================================== */

      graphics.fillStyle(
        0x02070d,
        0.72
      );


      graphics.fillEllipse(
        x,
        baseY + 26,
        baseWidth + 50,
        24
      );


      /* ===================================================
         BASE
         =================================================== */

      graphics.fillStyle(
        0x08121e,
        0.99
      );


      graphics.fillRoundedRect(
        x - baseWidth / 2,
        baseY - 8,
        baseWidth,
        TOWER.baseHeight + 12,
        10
      );


      graphics.lineStyle(
        2,
        0x657d92,
        0.95
      );


      graphics.strokeRoundedRect(
        x - baseWidth / 2,
        baseY - 8,
        baseWidth,
        TOWER.baseHeight + 12,
        10
      );


      /* ===================================================
         BASE INNER PANEL
         =================================================== */

      graphics.fillStyle(
        0x102235,
        0.94
      );


      graphics.fillRoundedRect(
        x - 66,
        baseY + 1,
        132,
        21,
        5
      );


      graphics.lineStyle(
        1,
        0x2d536a,
        0.9
      );


      graphics.strokeRoundedRect(
        x - 66,
        baseY + 1,
        132,
        21,
        5
      );


      /* ===================================================
         ENERGY STRIP
         =================================================== */

      graphics.fillStyle(
        0x00eaff,
        0.16
      );


      graphics.fillRect(
        x - 78,
        baseY - 6,
        156,
        6
      );


      graphics.fillStyle(
        0xffd06e,
        0.88
      );


      graphics.fillRect(
        x - 51,
        baseY - 6,
        102,
        2
      );


      graphics.fillStyle(
        0x00eaff,
        0.72
      );


      graphics.fillRect(
        x - 22,
        baseY - 4,
        44,
        2
      );


      /* ===================================================
         MAIN SUPPORTS
         =================================================== */

      graphics.lineStyle(
        8,
        0x2b4057,
        1
      );


      graphics.lineBetween(
        x - TOWER.supportHalfWidth,
        baseY,
        x - 39,
        topY + 37
      );


      graphics.lineBetween(
        x + TOWER.supportHalfWidth,
        baseY,
        x + 39,
        topY + 37
      );


      /* ===================================================
         SUPPORT HIGHLIGHTS
         =================================================== */

      graphics.lineStyle(
        2,
        0x7c9aae,
        0.72
      );


      graphics.lineBetween(
        x - 69,
        baseY - 3,
        x - 38,
        topY + 40
      );


      graphics.lineBetween(
        x + 69,
        baseY - 3,
        x + 38,
        topY + 40
      );


      /* ===================================================
         INNER SUPPORTS
         =================================================== */

      graphics.lineStyle(
        4,
        0x7892a8,
        0.72
      );


      graphics.lineBetween(
        x - TOWER.innerSupportHalfWidth,
        baseY - 4,
        x - TOWER.innerSupportHalfWidth,
        topY + 38
      );


      graphics.lineBetween(
        x + TOWER.innerSupportHalfWidth,
        baseY - 4,
        x + TOWER.innerSupportHalfWidth,
        topY + 38
      );


      /* ===================================================
         CROSS BRACING
         =================================================== */

      for (
        let y =
          baseY - 32;

        y >
          topY + 46;

        y -= 38
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
            65,
            36,
            progress
          );


        graphics.lineStyle(
          2,
          0x8097aa,
          0.62
        );


        graphics.lineBetween(
          x - half,
          y,
          x + half,
          y
        );


        graphics.lineBetween(
          x - half + 5,
          y - 15,
          x + half - 5,
          y + 15
        );


        graphics.lineStyle(
          1,
          0x00d9ee,
          0.24
        );


        graphics.lineBetween(
          x - half,
          y + 3,
          x + half,
          y + 3
        );

      }


      /* ===================================================
         LADDER
         =================================================== */

      graphics.lineStyle(
        5,
        0xb7c9d7,
        0.92
      );


      graphics.lineBetween(
        x - 25,
        baseY - 6,
        x - 25,
        topY + 38
      );


      graphics.lineBetween(
        x + 25,
        baseY - 6,
        x + 25,
        topY + 38
      );


      graphics.lineStyle(
        2,
        0xffd06e,
        0.86
      );


      for (
        let y =
          baseY - 14;

        y >
          topY + 38;

        y -= 22
      ) {

        graphics.lineBetween(
          x - 24,
          y,
          x + 24,
          y
        );

      }


      /* ===================================================
         ENERGY RAILS
         =================================================== */

      for (
        let i = 0;

        i < TOWER.energyRails;

        i += 1
      ) {

        const railX =
          x +
          (
            i -
            (TOWER.energyRails - 1) / 2
          ) *
          22;


        graphics.lineStyle(
          2,
          i % 2 === 0
            ? 0x00eaff
            : 0xffd06e,
          0.48
        );


        graphics.lineBetween(
          railX,
          topY + 39,
          railX,
          baseY - 8
        );

      }


      /* ===================================================
         TOP PLATFORM
         =================================================== */

      graphics.fillStyle(
        0x0c1a2b,
        1
      );


      graphics.fillRoundedRect(
        x - 47,
        topY - 10,
        94,
        40,
        9
      );


      graphics.lineStyle(
        2,
        0xffd06e,
        0.98
      );


      graphics.strokeRoundedRect(
        x - 47,
        topY - 10,
        94,
        40,
        9
      );


      graphics.lineStyle(
        1,
        0x00eaff,
        0.75
      );


      graphics.strokeRoundedRect(
        x - 37,
        topY - 2,
        74,
        24,
        5
      );


      /* ===================================================
         TOP PANEL DETAILS
         =================================================== */

      graphics.fillStyle(
        0x00eaff,
        0.65
      );


      graphics.fillRect(
        x - 26,
        topY + 4,
        16,
        2
      );


      graphics.fillRect(
        x + 10,
        topY + 4,
        16,
        2
      );


      graphics.fillStyle(
        0xffd06e,
        0.78
      );


      graphics.fillRect(
        x - 13,
        topY + 12,
        26,
        2
      );


      /* ===================================================
         ANTENNA MAST
         =================================================== */

      graphics.lineStyle(
        5,
        0xbfd0db,
        0.96
      );


      graphics.lineBetween(
        x,
        topY - 10,
        x,
        topY - 58
      );


      graphics.lineStyle(
        2,
        0xffd06e,
        0.9
      );


      graphics.lineBetween(
        x,
        topY - 49,
        x + 42,
        topY - 31
      );


      graphics.lineBetween(
        x,
        topY - 49,
        x - 32,
        topY - 34
      );


      /* ===================================================
         ANTENNA CROSSBAR
         =================================================== */

      graphics.lineStyle(
        2,
        0x7e96aa,
        0.7
      );


      graphics.lineBetween(
        x - 28,
        topY - 39,
        x + 28,
        topY - 39
      );


      /* ===================================================
         CORE GLOW
         =================================================== */

      const coreX =
        x;


      const coreY =
        topY + 12;


      const coreGlow =
        this.add
          .circle(
            coreX,
            coreY,
            50,
            0x00eaff,
            0.055
          )
          .setDepth(
            DEPTH.fx
          );


      const coreGlow2 =
        this.add
          .circle(
            coreX,
            coreY,
            35,
            0xffd06e,
            0.075
          )
          .setDepth(
            DEPTH.fx
          );


      const coreGlow3 =
        this.add
          .circle(
            coreX,
            coreY,
            21,
            0xffffff,
            0.035
          )
          .setDepth(
            DEPTH.fx
          );


      /* ===================================================
         CORE
         =================================================== */

      const core =
        this.add
          .circle(
            coreX,
            coreY,
            12,
            0xffe5ad,
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


      /* ===================================================
         CORE RINGS
         =================================================== */

      const ringOuter =
        this.add
          .circle(
            coreX,
            coreY,
            40,
            0
          )
          .setStrokeStyle(
            2,
            0x00eaff,
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
            29,
            0
          )
          .setStrokeStyle(
            2,
            0xffd06e,
            0.78
          )
          .setDepth(
            DEPTH.fx
          );


      const ringInner =
        this.add
          .circle(
            coreX,
            coreY,
            17,
            0
          )
          .setStrokeStyle(
            1,
            0xffffff,
            0.72
          )
          .setDepth(
            DEPTH.fx
          );


      /* ===================================================
         ORBIT
         =================================================== */

      const orbit =
        this.add
          .graphics()
          .setDepth(
            DEPTH.fx
          );


      orbit.lineStyle(
        2,
        0x00eaff,
        0.72
      );


      orbit.lineBetween(
        x - 48,
        coreY,
        x - 31,
        coreY - 12
      );


      orbit.lineBetween(
        x + 31,
        coreY + 12,
        x + 48,
        coreY
      );


      /* ===================================================
         BEACON
         =================================================== */

      const beaconY =
        topY - 58;


      const beaconGlow =
        this.add
          .circle(
            x,
            beaconY,
            25,
            0x00eaff,
            0.075
          )
          .setDepth(
            DEPTH.fx
          );


      const beacon =
        this.add
          .circle(
            x,
            beaconY,
            7,
            0xfff1c7,
            1
          )
          .setDepth(
            DEPTH.core
          );


      /* ===================================================
         SIGNAL PULSE
         =================================================== */

      const signalPulse =
        this.add
          .circle(
            x,
            beaconY,
            10,
            0,
            0
          )
          .setStrokeStyle(
            1,
            0x00eaff,
            0.7
          )
          .setDepth(
            DEPTH.fx
          );


      /* ===================================================
         SCAN BEAM
         =================================================== */

      const scanBeam =
        this.add
          .rectangle(
            x,
            topY + 90,
            4,
            142,
            0x00eaff,
            0.075
          )
          .setDepth(
            DEPTH.fx
          );


      /* ===================================================
         SIDE LIGHTS
         =================================================== */

      const sideLights =
        [];


      for (
        let i = 0;

        i < TOWER.sideLights;

        i += 1
      ) {

        const y =
          topY +
          50 +
          i * 34;


        const color =
          i % 2 === 0
            ? 0x00eaff
            : 0xffd06e;


        const left =
          this.add
            .circle(
              x - 34,
              y,
              3,
              color,
              0.86
            )
            .setDepth(
              DEPTH.fx
            );


        const right =
          this.add
            .circle(
              x + 34,
              y,
              3,
              color,
              0.86
            )
            .setDepth(
              DEPTH.fx
            );


        sideLights.push(
          left,
          right
        );

      }


      /* ===================================================
         PARTICLES
         =================================================== */

      const particles =
        [];


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
                  -48,
                  48
                ),

              topY +
                Phaser.Math.Between(
                  28,
                  286
                ),

              Phaser.Math.Between(
                1,
                2
              ),

              i % 3 === 0
                ? 0x00eaff
                : 0xffd06e,

              Phaser.Math.FloatBetween(
                0.16,
                0.52
              )
            )
            .setDepth(
              DEPTH.fx
            );


        particles.push(
          particle
        );


        if (
          !this.motionReduced
        ) {

          this.tweens.add({

            targets:
              particle,

            y:
              particle.y -
              Phaser.Math.Between(
                28,
                58
              ),

            alpha:
              0,

            duration:
              Phaser.Math.Between(
                900,
                1700
              ),

            delay:
              Phaser.Math.Between(
                0,
                1000
              ),

            repeat:
              -1,

            onRepeat: () => {

              if (
                !particle.active
              ) {

                return;

              }


              particle.y =
                topY +
                Phaser.Math.Between(
                  40,
                  290
                );


              particle.x =
                x +
                Phaser.Math.Between(
                  -48,
                  48
                );


              particle.alpha =
                Phaser.Math.FloatBetween(
                  0.16,
                  0.52
                );

            }

          });

        }

      }


      /* ===================================================
         LABELS
         =================================================== */

      const labels =
        [];


      labels.push(

        this.add
          .text(
            x,
            topY - 91,
            'RELAY // TOWER',
            {
              fontFamily:
                'DM Mono',

              fontSize:
                '12px',

              color:
                '#ffe0a8',

              stroke:
                '#050b12',

              strokeThickness:
                5,

              letterSpacing:
                1.3

            }
          )

          .setOrigin(
            0.5
          )

          .setDepth(
            DEPTH.labels
          )

      );


      labels.push(

        this.add
          .text(
            x,
            topY - 73,
            'SECURE // TRANSMIT // NODE-01',
            {
              fontFamily:
                'DM Mono',

              fontSize:
                '7px',

              color:
                '#8fa9bb',

              stroke:
                '#050b12',

              strokeThickness:
                3,

              letterSpacing:
                0.8

            }
          )

          .setOrigin(
            0.5
          )

          .setDepth(
            DEPTH.labels
          )

          .setAlpha(
            0.78
          )

      );


      labels.push(

        this.add
          .text(
            x,
            baseY + 45,
            'CLIMB // SECURE RELAY',
            {
              fontFamily:
                'DM Mono',

              fontSize:
                '9px',

              color:
                '#9eb2c4',

              stroke:
                '#050b12',

              strokeThickness:
                4,

              letterSpacing:
                0.7

            }
          )

          .setOrigin(
            0.5
          )

          .setDepth(
            DEPTH.labels
          )

          .setAlpha(
            0.84
          )

      );


      labels.push(

        this.add
          .text(
            x,
            baseY - 63,
            '↑  JUMP TO CONNECT',
            {
              fontFamily:
                'DM Mono',

              fontSize:
                '8px',

              color:
                '#ffd06e',

              stroke:
                '#050b12',

              strokeThickness:
                4,

              letterSpacing:
                0.8

            }
          )

          .setOrigin(
            0.5
          )

          .setDepth(
            DEPTH.labels
          )

          .setAlpha(
            0.82
          )

      );


      /* ===================================================
         STORE VISUALS
         =================================================== */

      this.finishTowerVisuals = {

        graphics,

        atmosphere,
        atmosphere2,
        atmosphere3,

        coreGlow,
        coreGlow2,
        coreGlow3,

        core,
        coreInner,

        ringOuter,
        ringMiddle,
        ringInner,

        orbit,

        beaconGlow,
        beacon,

        signalPulse,

        scanBeam,

        sideLights,

        particles,

        labels

      };


      /* ===================================================
         IDLE ANIMATION
         =================================================== */

      if (
        !this.motionReduced
      ) {


        this.tweens.add({

          targets:
            atmosphere,

          scale:
            1.22,

          alpha:
            0.015,

          duration:
            1700,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'

        });


        this.tweens.add({

          targets:
            atmosphere2,

          scale:
            1.28,

          alpha:
            0.02,

          duration:
            1100,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'

        });


        this.tweens.add({

          targets:
            atmosphere3,

          scale:
            1.38,

          alpha:
            0.01,

          duration:
            800,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'

        });


        this.tweens.add({

          targets:
            core,

          scale:
            1.35,

          alpha:
            0.58,

          duration:
            620,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'

        });


        this.tweens.add({

          targets:
            coreGlow,

          scale:
            1.28,

          alpha:
            0.025,

          duration:
            900,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'

        });


        this.tweens.add({

          targets:
            coreGlow2,

          scale:
            1.34,

          alpha:
            0.045,

          duration:
            760,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'

        });


        this.tweens.add({

          targets:
            coreGlow3,

          scale:
            1.5,

          alpha:
            0.012,

          duration:
            560,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'

        });


        this.tweens.add({

          targets:
            ringOuter,

          scale:
            1.34,

          alpha:
            0.04,

          duration:
            1100,

          repeat:
            -1,

          ease:
            'Sine.easeOut'

        });


        this.tweens.add({

          targets:
            ringMiddle,

          scale:
            1.26,

          alpha:
            0.06,

          duration:
            900,

          repeat:
            -1,

          ease:
            'Sine.easeOut'

        });


        this.tweens.add({

          targets:
            ringInner,

          scale:
            1.18,

          alpha:
            0.15,

          duration:
            620,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'

        });


        this.tweens.add({

          targets:
            beacon,

          alpha:
            0.25,

          scale:
            1.55,

          duration:
            520,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'

        });


        this.tweens.add({

          targets:
            beaconGlow,

          alpha:
            0.018,

          scale:
            1.42,

          duration:
            720,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'

        });


        this.tweens.add({

          targets:
            signalPulse,

          scale:
            4.4,

          alpha:
            0,

          duration:
            1700,

          repeat:
            -1,

          ease:
            'Cubic.easeOut'

        });


        this.tweens.add({

          targets:
            scanBeam,

          y:
            topY + 215,

          alpha:
            0.018,

          duration:
            1500,

          repeat:
            -1,

          yoyo:
            true,

          ease:
            'Sine.easeInOut'

        });


        sideLights.forEach(
          (light, index) => {

            this.tweens.add({

              targets:
                light,

              alpha:
                0.16,

              duration:
                420 +
                index * 55,

              delay:
                index * 75,

              yoyo:
                true,

              repeat:
                -1,

              ease:
                'Sine.easeInOut'

            });

          }
        );


        this.tweens.add({

          targets:
            orbit,

          angle:
            360,

          duration:
            4000,

          repeat:
            -1,

          ease:
            'Linear'

        });

      }


      /* ===================================================
         BASE COLLIDER
         =================================================== */

      const base =
        this.add
          .rectangle(
            x,
            baseY + 11,
            TOWER.baseColliderWidth,
            TOWER.baseHeight,
            0x000000,
            0
          )
          .setVisible(
            false
          );


      this.physics.add.existing(
        base,
        true
      );


      this.finishTowerBase =
        base;


      if (
        this.player
      ) {

        this.physics.add.collider(
          this.player,
          base
        );

      }


      /* ===================================================
         CLIMB ZONE
         =================================================== */

      const climbHeight =
        Math.max(
          1,
          baseY -
          topY
        );


      this.finishTowerZone =
        this.add.zone(
          x,
          topY +
            climbHeight / 2,
          TOWER.ladderWidth,
          climbHeight
        );


      this.physics.add.existing(
        this.finishTowerZone
      );


      this.finishTowerZone.body
        .setAllowGravity(
          false
        )
        .setImmovable(
          true
        );


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


          tower.request =
            true;

        }

      );


      /* ===================================================
         TOP ZONE
         =================================================== */

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
        .setAllowGravity(
          false
        )
        .setImmovable(
          true
        );


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


          activateTopFinish(
            this
          );

        }

      );


      this.finishTowerKeys =
        this.keys;

    };


  /* =======================================================
     ACTIVATION VISUALS
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


      tower.visualActive =
        true;


      const {

        atmosphere,
        atmosphere2,
        atmosphere3,

        coreGlow,
        coreGlow2,
        coreGlow3,

        core,

        ringOuter,
        ringMiddle,
        ringInner,

        beaconGlow,
        beacon,

        signalPulse,

        scanBeam,

        sideLights,
        particles

      } = visuals;


      const x =
        tower.x;


      const y =
        tower.topY + 12;


      /* ===================================================
         STOP IDLE
         =================================================== */

      safeKillTweens(

        this,

        [

          atmosphere,
          atmosphere2,
          atmosphere3,

          coreGlow,
          coreGlow2,
          coreGlow3,

          core,

          ringOuter,
          ringMiddle,
          ringInner,

          beaconGlow,
          beacon,

          signalPulse,

          scanBeam,

          ...sideLights,

          ...particles

        ]

      );


      /* ===================================================
         CORE SURGE
         =================================================== */

      this.tweens.add({

        targets:
          [
            core,
            coreGlow,
            coreGlow2,
            coreGlow3
          ],

        scale:
          2.35,

        alpha:
          1,

        duration:
          300,

        ease:
          'Back.easeOut'

      });


      /* ===================================================
         RINGS
         =================================================== */

      [

        [ringOuter, 4.2, 760],

        [ringMiddle, 3.3, 620],

        [ringInner, 2.7, 470]

      ].forEach(
        ([target, scale, duration]) => {

          this.tweens.add({

            targets:
              target,

            scale,

            alpha:
              0,

            duration,

            ease:
              'Cubic.easeOut'

          });

        }
      );


      /* ===================================================
         BEACON FLASH
         =================================================== */

      this.tweens.add({

        targets:
          beacon,

        scale:
          3,

        alpha:
          1,

        duration:
          220,

        yoyo:
          true,

        ease:
          'Cubic.easeOut'

      });


      this.tweens.add({

        targets:
          beaconGlow,

        scale:
          3.8,

        alpha:
          0.42,

        duration:
          300,

        yoyo:
          true,

        ease:
          'Cubic.easeOut'

      });


      /* ===================================================
         SIGNAL PULSE
         =================================================== */

      this.tweens.add({

        targets:
          signalPulse,

        scale:
          10,

        alpha:
          0,

        duration:
          900,

        ease:
          'Cubic.easeOut'

      });


      /* ===================================================
         SCAN BEAM
         =================================================== */

      this.tweens.add({

        targets:
          scanBeam,

        scaleX:
          10,

        scaleY:
          1.4,

        alpha:
          0.48,

        duration:
          240,

        yoyo:
          true,

        ease:
          'Cubic.easeOut'

      });


      /* ===================================================
         SIDE LIGHT BURST
         =================================================== */

      sideLights.forEach(
        (light, index) => {

          this.tweens.add({

            targets:
              light,

            scale:
              3,

            alpha:
              1,

            duration:
              140,

            delay:
              index * 45,

            yoyo:
              true,

            ease:
              'Quad.easeOut'

          });

        }
      );


      /* ===================================================
         PARTICLE BURST
         =================================================== */

      particles.forEach(
        (particle, index) => {

          safeKillTweens(
            this,
            particle
          );


          this.tweens.add({

            targets:
              particle,

            y:
              tower.topY -
              Phaser.Math.Between(
                35,
                120
              ),

            alpha:
              0,

            scale:
              2.4,

            duration:
              480 +
              index * 28,

            delay:
              index * 28,

            ease:
              'Cubic.easeOut'

          });

        }
      );


      /* ===================================================
         CAMERA IMPACT
         =================================================== */

      try {

        if (
          !this.motionReduced &&
          this.cameras?.main
        ) {

          this.cameras.main.shake(
            180,
            0.004
          );

        }

      } catch {}


      /* ===================================================
         SCREEN FLASH
         =================================================== */

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
          .setScrollFactor(
            0
          )
          .setDepth(
            999
          );


      this.tweens.add({

        targets:
          flash,

        alpha:
          0.20,

        duration:
          85,

        yoyo:
          true,

        hold:
          80,

        onComplete: () => {

          safeDestroy(
            flash
          );

        }

      });


      /* ===================================================
         COMPLETION WAVES
         =================================================== */

      for (
        let i = 0;

        i < 4;

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
              i % 2 === 0
                ? 0x00eaff
                : 0xffd06e,
              0.86
            )
            .setDepth(
              999
            );


        this.tweens.add({

          targets:
            burst,

          scale:
            7 +
            i * 2.2,

          alpha:
            0,

          duration:
            800 +
            i * 130,

          delay:
            i * 90,

          ease:
            'Cubic.easeOut',

          onComplete: () => {

            safeDestroy(
              burst
            );

          }

        });

      }


      /* ===================================================
         VERTICAL ENERGY
         =================================================== */

      for (
        let i = 0;

        i < 5;

        i += 1
      ) {

        const beam =
          this.add
            .rectangle(
              x +
                (i - 2) * 22,

              tower.topY + 100,

              i % 2 === 0
                ? 2
                : 3,

              110,

              i % 2 === 0
                ? 0x00eaff
                : 0xffd06e,

              0.30
            )
            .setDepth(
              999
            );


        this.tweens.add({

          targets:
            beam,

          scaleY:
            3,

          alpha:
            0,

          duration:
            650 +
            i * 75,

          delay:
            i * 70,

          ease:
            'Cubic.easeOut',

          onComplete: () => {

            safeDestroy(
              beam
            );

          }

        });

      }


      atmosphere.setAlpha(
        0.08
      );


      atmosphere2.setAlpha(
        0.10
      );


      atmosphere3.setAlpha(
        0.06
      );

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


      /* ---------------------------------------------------
         PRESERVE ORIGINAL GAMEPLAY
         --------------------------------------------------- */

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


      /* ===================================================
         CINEMATIC LOCK
         =================================================== */

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


      /* ===================================================
         INPUT
         =================================================== */

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


      /* ===================================================
         PROXIMITY
         =================================================== */

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


      /* ===================================================
         START CLIMB
         =================================================== */

      if (

        !tower.climbing &&

        near &&

        (

          tower.request ||

          jumpPressed ||

          scene.player.body.velocity.y < -120

        )

      ) {


        tower.climbing =
          true;


        tower.request =
          false;


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


      /* ===================================================
         CLIMB MOTION
         =================================================== */

      setPlayerGravity(
        scene,
        false
      );


      stopPlayerMovement(
        scene
      );


      scene.player.x =
        Phaser.Math.Linear(

          scene.player.x,

          tower.x,

          0.28

        );


      const climbDirection =
        movingDown
          ? 1
          : -1;


      scene.player.y +=

        TOWER.climbSpeed *

        climbDirection *

        delta /

        1000;


      /* ===================================================
         CLAMP
         =================================================== */

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


      /* ===================================================
         TOP
         =================================================== */

      if (

        scene.player.y <=
        minY

      ) {

        scene.player.y =
          minY;

      }


      /* ===================================================
         RETURN DOWN
         =================================================== */

      if (

        scene.player.y >=
          maxY &&

        movingDown

      ) {

        stopClimbing(
          scene
        );

      }


      return result;

    };


  /* =======================================================
     SHUTDOWN
     ======================================================= */

  const originalShutdown =
    RunnerScene.prototype.shutdown;


  if (
    typeof originalShutdown ===
    'function'
  ) {

    RunnerScene.prototype.shutdown =
      function finishTowerShutdown() {

        destroyTower(
          this
        );


        return originalShutdown.apply(
          this,
          arguments
        );

      };

  }


  /* =======================================================
     DESTROY
     ======================================================= */

  const originalDestroy =
    RunnerScene.prototype.destroy;


  if (
    typeof originalDestroy ===
    'function'
  ) {

    RunnerScene.prototype.destroy =
      function finishTowerDestroy() {

        destroyTower(
          this
        );


        return originalDestroy.apply(
          this,
          arguments
        );

      };

  }

}