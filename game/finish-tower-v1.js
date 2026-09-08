/* =========================================================
   UPDATE 11.8 — FINISH RELAY TOWER
   CINEMATIC / MOBILE-FRIENDLY VISUAL UPGRADE

   - Tower ~28% taller
   - Slightly wider structure
   - Stronger core / beacon
   - Better proportions
   - Mobile friendly
   - Gameplay logic preserved
   ========================================================= */

import Phaser from 'phaser';
import { RunnerScene } from './src/scenes/RunnerScene.js';


/* =========================================================
   TOWER CONFIG
   ========================================================= */

const TOWER = {
  /* Visual / gameplay proportions */
  height: 315,
  baseHeight: 34,
  ladderWidth: 68,

  /* Gameplay intentionally preserved */
  climbSpeed: 170,

  /* Slightly wider interaction zone for larger tower */
  engageRadius: 84
};


/* =========================================================
   PREVENT DOUBLE PATCH
   ========================================================= */

if (!window.__relayFinishTowerV11_8) {

  window.__relayFinishTowerV11_8 = true;

  const originalUpdate =
    RunnerScene.prototype.update;


  /* =======================================================
     CREATE FINISH RELAY TOWER
     ======================================================= */

  RunnerScene.prototype.createGoal =
    function createFinishRelayTower() {

      const x =
        this.mission.goal.x;

      const topY =
        this.mission.goal.y;

      /*
       * Do not artificially cap the tower height.
       * The level itself determines where the base sits.
       */
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


      /* ===================================================
         EXISTING GOAL
         =================================================== */

      this.goal =
        this.physics.add
          .staticImage(
            x,
            topY,
            'goal'
          )
          .setVisible(false);

      this.goal.body.enable = false;


      /* ===================================================
         DEPTH
         =================================================== */

      const towerDepth = 5;
      const fxDepth = 6;
      const coreDepth = 8;


      /* ===================================================
         ATMOSPHERE
         =================================================== */

      const atmosphere =
        this.add
          .circle(
            x,
            topY + 20,
            88,
            0xffd06e,
            0.042
          )
          .setDepth(4);


      const atmosphere2 =
        this.add
          .circle(
            x,
            topY + 20,
            61,
            0xffe0a8,
            0.052
          )
          .setDepth(4);


      /* ===================================================
         MAIN TOWER GRAPHICS
         =================================================== */

      const g =
        this.add
          .graphics()
          .setDepth(towerDepth);


      /* ===================================================
         BASE
         =================================================== */

      const baseWidth = 158;

      g.fillStyle(
        0x0b1422,
        0.98
      );

      g.fillRoundedRect(
        x - baseWidth / 2,
        baseY - 7,
        baseWidth,
        TOWER.baseHeight + 9,
        9
      );


      g.lineStyle(
        2,
        0x6f879e,
        0.9
      );

      g.strokeRoundedRect(
        x - baseWidth / 2,
        baseY - 7,
        baseWidth,
        TOWER.baseHeight + 9,
        9
      );


      /* ===================================================
         BASE ENERGY STRIP
         =================================================== */

      g.fillStyle(
        0xffd06e,
        0.18
      );

      g.fillRect(
        x - 75,
        baseY - 5,
        150,
        5
      );


      g.fillStyle(
        0xffd06e,
        0.78
      );

      g.fillRect(
        x - 48,
        baseY - 5,
        96,
        2
      );


      /* ===================================================
         MAIN SUPPORTS
         =================================================== */

      g.lineStyle(
        7,
        0x344b63,
        0.98
      );


      g.lineBetween(
        x - 68,
        baseY,
        x - 36,
        topY + 34
      );


      g.lineBetween(
        x + 68,
        baseY,
        x + 36,
        topY + 34
      );


      /* ===================================================
         INNER SUPPORTS
         =================================================== */

      g.lineStyle(
        3,
        0x8fa4b7,
        0.78
      );


      g.lineBetween(
        x - 24,
        baseY - 5,
        x - 24,
        topY + 35
      );


      g.lineBetween(
        x + 24,
        baseY - 5,
        x + 24,
        topY + 35
      );


      /* ===================================================
         CROSS BRACES
         =================================================== */

      g.lineStyle(
        2,
        0x8ba2b7,
        0.62
      );


      for (
        let y = baseY - 38;
        y > topY + 44;
        y -= 42
      ) {

        const t =
          (baseY - y) /
          TOWER.height;


        const half =
          Phaser.Math.Linear(
            61,
            33,
            t
          );


        g.lineBetween(
          x - half,
          y,
          x + half,
          y
        );


        g.lineBetween(
          x - half + 6,
          y - 13,
          x + half - 6,
          y + 13
        );
      }


      /* ===================================================
         LADDER
         =================================================== */

      g.lineStyle(
        4,
        0xb8c7d5,
        0.92
      );


      g.lineBetween(
        x - 24,
        baseY - 6,
        x - 24,
        topY + 34
      );


      g.lineBetween(
        x + 24,
        baseY - 6,
        x + 24,
        topY + 34
      );


      g.lineStyle(
        2,
        0xffd06e,
        0.78
      );


      for (
        let y = baseY - 15;
        y > topY + 35;
        y -= 24
      ) {

        g.lineBetween(
          x - 23,
          y,
          x + 23,
          y
        );
      }


      /* ===================================================
         TOP HOUSING
         =================================================== */

      g.fillStyle(
        0x101e31,
        0.99
      );


      g.fillRoundedRect(
        x - 42,
        topY - 9,
        84,
        37,
        9
      );


      g.lineStyle(
        2,
        0xffd06e,
        0.96
      );


      g.strokeRoundedRect(
        x - 42,
        topY - 9,
        84,
        37,
        9
      );


      g.lineStyle(
        2,
        0x9eb2c4,
        0.52
      );


      g.strokeRoundedRect(
        x - 32,
        topY - 1,
        64,
        22,
        5
      );


      /* ===================================================
         ANTENNA
         =================================================== */

      g.lineStyle(
        4,
        0xffe0a8,
        0.96
      );


      g.lineBetween(
        x,
        topY - 9,
        x,
        topY - 49
      );


      g.lineStyle(
        2,
        0xffd06e,
        0.86
      );


      g.lineBetween(
        x,
        topY - 43,
        x + 40,
        topY - 28
      );


      g.lineBetween(
        x,
        topY - 43,
        x - 29,
        topY - 31
      );


      /* ===================================================
         ENERGY RAILS
         =================================================== */

      g.lineStyle(
        3,
        0xffd06e,
        0.5
      );


      g.lineBetween(
        x - 34,
        topY + 30,
        x - 34,
        baseY - 7
      );


      g.lineBetween(
        x + 34,
        topY + 30,
        x + 34,
        baseY - 7
      );


      /* ===================================================
         ENERGY CORE
         =================================================== */

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
          .setDepth(fxDepth);


      const coreGlow2 =
        this.add
          .circle(
            coreX,
            coreY,
            28,
            0xffe0a8,
            0.125
          )
          .setDepth(fxDepth);


      const core =
        this.add
          .circle(
            coreX,
            coreY,
            11,
            0xfff1c7,
            1
          )
          .setDepth(coreDepth);


      const coreInner =
        this.add
          .circle(
            coreX,
            coreY,
            5,
            0xffffff,
            1
          )
          .setDepth(coreDepth + 1);


      /* ===================================================
         CORE RINGS
         =================================================== */

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
          .setDepth(fxDepth);


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
          .setDepth(fxDepth);


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
          .setDepth(fxDepth);


      /* ===================================================
         ORBIT
         =================================================== */

      const orbit =
        this.add
          .graphics()
          .setDepth(fxDepth);


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


      /* ===================================================
         BEACON
         =================================================== */

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
          .setDepth(fxDepth);


      const beacon =
        this.add
          .circle(
            x,
            beaconY,
            6,
            0xfff1c7,
            1
          )
          .setDepth(coreDepth);


      /* ===================================================
         SCAN BEAM
         =================================================== */

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
          .setDepth(fxDepth);


      /* ===================================================
         SIDE ENERGY LIGHTS
         =================================================== */

      const sideLights = [];


      for (
        let i = 0;
        i < 6;
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
            .setDepth(fxDepth);


        const right =
          this.add
            .circle(
              x + 31,
              y,
              3,
              0xffd06e,
              0.8
            )
            .setDepth(fxDepth);


        sideLights.push(
          left,
          right
        );
      }


      /* ===================================================
         FLOATING PARTICLES
         =================================================== */

      const particles = [];


      for (
        let i = 0;
        i < 14;
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
            .setDepth(fxDepth);


        particles.push(
          particle
        );


        if (!this.motionReduced) {

          this.tweens.add({

            targets:
              particle,

            y:
              particle.y -
              Phaser.Math.Between(
                20,
                46
              ),

            alpha:0,

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

            repeat:-1,

            onRepeat:() => {

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


      /* ===================================================
         STORE VISUAL REFERENCES
         =================================================== */

      this.finishTowerVisuals = {

        graphics:g,

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


      /* ===================================================
         IDLE ANIMATION
         =================================================== */

      if (!this.motionReduced) {

        this.tweens.add({

          targets:
            atmosphere,

          scale:1.18,
          alpha:0.02,

          duration:1500,

          yoyo:true,
          repeat:-1,

          ease:'Sine.easeInOut'
        });


        this.tweens.add({

          targets:
            atmosphere2,

          scale:1.24,
          alpha:0.025,

          duration:950,

          yoyo:true,
          repeat:-1,

          ease:'Sine.easeInOut'
        });


        this.tweens.add({

          targets:
            core,

          scale:1.34,
          alpha:0.55,

          duration:620,

          yoyo:true,
          repeat:-1,

          ease:'Sine.easeInOut'
        });


        this.tweens.add({

          targets:
            coreGlow,

          scale:1.25,
          alpha:0.035,

          duration:900,

          yoyo:true,
          repeat:-1,

          ease:'Sine.easeInOut'
        });


        this.tweens.add({

          targets:
            coreGlow2,

          scale:1.32,
          alpha:0.055,

          duration:760,

          yoyo:true,
          repeat:-1,

          ease:'Sine.easeInOut'
        });


        this.tweens.add({

          targets:
            ringOuter,

          scale:1.32,
          alpha:0.05,

          duration:1050,

          repeat:-1,

          ease:'Sine.easeOut'
        });


        this.tweens.add({

          targets:
            ringMiddle,

          scale:1.24,
          alpha:0.08,

          duration:820,

          repeat:-1,

          ease:'Sine.easeOut'
        });


        this.tweens.add({

          targets:
            ringInner,

          scale:1.18,
          alpha:0.16,

          duration:560,

          yoyo:true,
          repeat:-1,

          ease:'Sine.easeInOut'
        });


        this.tweens.add({

          targets:
            beacon,

          alpha:0.25,
          scale:1.45,

          duration:500,

          yoyo:true,
          repeat:-1,

          ease:'Sine.easeInOut'
        });


        this.tweens.add({

          targets:
            beaconGlow,

          alpha:0.025,
          scale:1.35,

          duration:700,

          yoyo:true,
          repeat:-1,

          ease:'Sine.easeInOut'
        });


        this.tweens.add({

          targets:
            scanBeam,

          y:
            topY + 205,

          alpha:0.025,

          duration:1450,

          repeat:-1,
          yoyo:true,

          ease:'Sine.easeInOut'
        });


        sideLights.forEach(
          (light,index) => {

            this.tweens.add({

              targets:
                light,

              alpha:0.2,

              duration:
                420 +
                index * 70,

              delay:
                index * 90,

              yoyo:true,
              repeat:-1,

              ease:'Sine.easeInOut'
            });
          }
        );


        this.tweens.add({

          targets:
            orbit,

          angle:360,

          duration:4200,

          repeat:-1,

          ease:'Linear'
        });
      }


      /* ===================================================
         LABELS
         =================================================== */

      this.add
        .text(
          x,
          topY - 80,
          'RELAY TOWER',
          {
            fontFamily:'DM Mono',
            fontSize:'12px',
            color:'#ffe0a8',
            stroke:'#08101c',
            strokeThickness:4,
            letterSpacing:1.1
          }
        )
        .setOrigin(0.5)
        .setDepth(10);


      this.add
        .text(
          x,
          topY - 61,
          'SECURE // TRANSMIT',
          {
            fontFamily:'DM Mono',
            fontSize:'7px',
            color:'#9bb0c2',
            stroke:'#08101c',
            strokeThickness:3,
            letterSpacing:1
          }
        )
        .setOrigin(0.5)
        .setDepth(10)
        .setAlpha(0.72);


      this.add
        .text(
          x,
          baseY + 40,
          'CLIMB TO SECURE RELAY',
          {
            fontFamily:'DM Mono',
            fontSize:'9px',
            color:'#9bb0c2',
            stroke:'#08101c',
            strokeThickness:3,
            letterSpacing:0.6
          }
        )
        .setOrigin(0.5)
        .setDepth(10)
        .setAlpha(0.82);


      this.add
        .text(
          x,
          baseY - 58,
          '↑ / JUMP',
          {
            fontFamily:'DM Mono',
            fontSize:'8px',
            color:'#ffd06e',
            stroke:'#08101c',
            strokeThickness:3,
            letterSpacing:0.8
          }
        )
        .setOrigin(0.5)
        .setDepth(10)
        .setAlpha(0.74);


      /* ===================================================
         PHYSICS
         =================================================== */

      const base =
        this.add
          .rectangle(
            x,
            baseY + 10,
            140,
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


      /* ===================================================
         CLIMB ZONE
         =================================================== */

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


      /* ===================================================
         TOP ZONE
         =================================================== */

      this.finishTowerTopZone =
        this.add.zone(
          x,
          topY + 8,
          82,
          44
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
                active:false
              }
            );


            this.activateFinishTowerVisuals();
          }
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
        tower.topY + 11;


      /* ===================================================
         STOP IDLE CORE ANIMATION
         =================================================== */

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


      /* ===================================================
         CORE ACTIVATION
         =================================================== */

      this.tweens.add({

        targets:[
          core,
          coreGlow,
          coreGlow2
        ],

        scale:2.2,
        alpha:1,

        duration:280,

        ease:'Back.easeOut'
      });


      /* ===================================================
         ENERGY RINGS
         =================================================== */

      this.tweens.add({

        targets:
          ringOuter,

        scale:3.8,
        alpha:0,

        duration:700,

        ease:'Cubic.easeOut'
      });


      this.tweens.add({

        targets:
          ringMiddle,

        scale:3,

        alpha:0,

        duration:560,

        ease:'Cubic.easeOut'
      });


      this.tweens.add({

        targets:
          ringInner,

        scale:2.5,

        alpha:0,

        duration:420,

        ease:'Cubic.easeOut'
      });


      /* ===================================================
         BEACON
         =================================================== */

      this.tweens.add({

        targets:
          beacon,

        scale:2.8,
        alpha:1,

        duration:220,

        yoyo:true,

        ease:'Cubic.easeOut'
      });


      this.tweens.add({

        targets:
          beaconGlow,

        scale:3.2,
        alpha:0.35,

        duration:280,

        yoyo:true,

        ease:'Cubic.easeOut'
      });


      /* ===================================================
         SCAN BEAM
         =================================================== */

      this.tweens.add({

        targets:
          scanBeam,

        scaleX:8,
        scaleY:1.35,

        alpha:0.42,

        duration:220,

        yoyo:true,

        ease:'Cubic.easeOut'
      });


      /* ===================================================
         SIDE LIGHTS
         =================================================== */

      sideLights.forEach(
        (light,index) => {

          this.tweens.add({

            targets:
              light,

            scale:2.6,
            alpha:1,

            duration:130,

            delay:
              index * 55,

            yoyo:true,

            ease:'Quad.easeOut'
          });
        }
      );


      /* ===================================================
         PARTICLE BURST
         =================================================== */

      particles.forEach(
        (particle,index) => {

          this.tweens.killTweensOf(
            particle
          );


          this.tweens.add({

            targets:
              particle,

            y:
              tower.topY -
              Phaser.Math.Between(
                35,
                110
              ),

            alpha:0,

            scale:2,

            duration:
              450 +
              index * 35,

            delay:
              index * 35,

            ease:'Cubic.easeOut'
          });
        }
      );


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
          .setScrollFactor(0)
          .setDepth(999);


      this.tweens.add({

        targets:
          flash,

        alpha:0.18,

        duration:90,

        yoyo:true,

        hold:70,

        onComplete:() => {

          flash.destroy();
        }
      });


      /* ===================================================
         COMPLETION WAVES
         =================================================== */

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

          targets:
            burst,

          scale:
            8 +
            i * 2,

          alpha:0,

          duration:
            850 +
            i * 170,

          delay:
            i * 100,

          ease:'Cubic.easeOut',

          onComplete:() => {

            burst.destroy();
          }
        });
      }


      /* ===================================================
         VERTICAL ENERGY COLUMNS
         =================================================== */

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
                20,
              tower.topY + 100,
              2,
              100,
              0xffd06e,
              0.28
            )
            .setDepth(999);


        this.tweens.add({

          targets:
            beam,

          scaleY:2.8,

          alpha:0,

          duration:
            650 +
            i * 80,

          delay:
            i * 80,

          ease:'Cubic.easeOut',

          onComplete:() => {

            beam.destroy();
          }
        });
      }


      atmosphere.setAlpha(
        0.08
      );

      atmosphere2.setAlpha(
        0.10
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


      /* ===================================================
         START CLIMB
         =================================================== */

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
          .setVelocity(0,0);


        this.player.setTexture(
          'runner-wall'
        );


        this.game.events.emit(
          'finish-tower-climb',
          {
            active:true
          }
        );
      }


      if (
        !tower.climbing
      ) {

        return result;
      }


      /* ===================================================
         CLIMBING
         =================================================== */

      this.player.body
        .setAllowGravity(false)
        .setVelocity(0,0);


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


      /* ===================================================
         TOP CLAMP
         =================================================== */

      if (
        this.player.y <=
        tower.topY + 18
      ) {

        this.player.y =
          tower.topY + 16;
      }


      /* ===================================================
         RETURN DOWN
         =================================================== */

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
            active:false
          }
        );
      }


      return result;
    };
}
