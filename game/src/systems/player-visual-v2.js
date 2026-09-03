
import Phaser from 'phaser';

// Polished player presentation layer.
// Gameplay physics, collision and input remain on the original player body.
export function installPlayerVisualV2(RunnerScene) {
  if (
    !RunnerScene?.prototype ||
    RunnerScene.prototype.__playerVisualV2Installed
  ) {
    return;
  }

  RunnerScene.prototype.__playerVisualV2Installed = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function (...args) {
    originalCreate.apply(this, args);

    if (!this.player || this.playerVisualV2) return;

    const player = this.player;

    // Keep the original player body fully intact for gameplay.
    player.setAlpha(0);

    const root = this.add
      .container(player.x, player.y - 4)
      .setDepth(12)
      .setName('player-visual-v2');

    // ------------------------------------------------------------
    // VISUAL COMPONENTS
    // ------------------------------------------------------------

    const shadow = this.add.ellipse(
      0,
      33,
      30,
      7,
      0x02060c,
      0.42
    );

    const aura = this.add
      .circle(
        0,
        1,
        28,
        0x63e6ff,
        0.055
      )
      .setBlendMode(Phaser.BlendModes.ADD);

    const coat = this.add.polygon(
      0,
      7,
      [
        -14,
        -4,
        -24,
        14,
        -12,
        11,
        -6,
        26,
        3,
        13
      ],
      0x0b1628,
      1
    );

    const torso = this.add
      .rectangle(
        0,
        5,
        23,
        30,
        0x172b43,
        1
      )
      .setStrokeStyle(
        1,
        0x4c708c,
        0.8
      );

    const chest = this.add.rectangle(
      0,
      5,
      16,
      20,
      0x29455f,
      1
    );

    const coreGlow = this.add
      .circle(
        0,
        5,
        9,
        0x8df4ff,
        0.1
      )
      .setBlendMode(
        Phaser.BlendModes.ADD
      );

    const core = this.add
      .circle(
        0,
        5,
        4,
        0x9cf7ff,
        1
      )
      .setBlendMode(
        Phaser.BlendModes.ADD
      );

    const helmet = this.add
      .circle(
        0,
        -15,
        12,
        0x203b58,
        1
      )
      .setStrokeStyle(
        1,
        0x668aa4,
        0.9
      );

    const visor = this.add.rectangle(
      0,
      -14,
      22,
      8,
      0x07101d,
      1
    );

    const visorLine = this.add
      .rectangle(
        0,
        -14,
        14,
        2,
        0xd8fbff,
        0.95
      )
      .setBlendMode(
        Phaser.BlendModes.ADD
      );

    const shoulderL = this.add.circle(
      -12,
      -1,
      5,
      0x294761,
      1
    );

    const shoulderR = this.add.circle(
      12,
      -1,
      5,
      0x294761,
      1
    );

    const armL = this.add.rectangle(
      -15,
      10,
      5,
      20,
      0x152940,
      1
    );

    const armR = this.add.rectangle(
      15,
      10,
      5,
      20,
      0x152940,
      1
    );

    const gloveL = this.add
      .circle(
        -15,
        20,
        3,
        0x8df4ff,
        0.85
      )
      .setBlendMode(
        Phaser.BlendModes.ADD
      );

    const gloveR = this.add
      .circle(
        15,
        20,
        3,
        0x8df4ff,
        0.85
      )
      .setBlendMode(
        Phaser.BlendModes.ADD
      );

    const legL = this.add.rectangle(
      -6,
      23,
      7,
      16,
      0x0b1628,
      1
    );

    const legR = this.add.rectangle(
      6,
      23,
      7,
      16,
      0x0b1628,
      1
    );

    const bootL = this.add.rectangle(
      -7,
      31,
      11,
      4,
      0x2b4762,
      1
    );

    const bootR = this.add.rectangle(
      7,
      31,
      11,
      4,
      0x2b4762,
      1
    );

    const stripe = this.add
      .rectangle(
        0,
        0,
        2,
        22,
        0xffd06e,
        0.9
      )
      .setBlendMode(
        Phaser.BlendModes.ADD
      );

    const shoulderLightL = this.add
      .circle(
        -12,
        -1,
        2,
        0x8df4ff,
        0.8
      )
      .setBlendMode(
        Phaser.BlendModes.ADD
      );

    const shoulderLightR = this.add
      .circle(
        12,
        -1,
        2,
        0x8df4ff,
        0.8
      )
      .setBlendMode(
        Phaser.BlendModes.ADD
      );

    root.add([
      shadow,
      aura,
      coat,
      torso,
      chest,
      coreGlow,
      core,
      helmet,
      visor,
      visorLine,
      shoulderL,
      shoulderR,
      armL,
      armR,
      gloveL,
      gloveR,
      legL,
      legR,
      bootL,
      bootR,
      stripe,
      shoulderLightL,
      shoulderLightR
    ]);

    // ------------------------------------------------------------
    // AMBIENT PRESENTATION
    //
    // Alpha is owned by updateVisual().
    // Tweens only control scale / subtle pulse.
    // ------------------------------------------------------------

    if (!this.motionReduced) {
      this.tweens.add({
        targets: coreGlow,
        scale: {
          from: 0.9,
          to: 1.12
        },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });

      this.tweens.add({
        targets: aura,
        scale: {
          from: 0.96,
          to: 1.08
        },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });

      this.tweens.add({
        targets: visorLine,
        scaleX: {
          from: 0.88,
          to: 1.04
        },
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }

    // ------------------------------------------------------------
    // VISUAL STATE
    // ------------------------------------------------------------

    let wasAirborne = false;
    let landingPulse = 0;

    const updateVisual = (delta = 16.67) => {
      if (!this.playerVisualV2?.root) return;

      const currentPlayer = this.player;

      if (!currentPlayer) return;

      const key =
        currentPlayer.anims?.currentAnim?.key ||
        'runner-idle';

      const mode = key.replace(
        'runner-',
        ''
      );

      const body = currentPlayer.body;

      const vx =
        Number(body?.velocity?.x) || 0;

      const vy =
        Number(body?.velocity?.y) || 0;

      const absVx = Math.abs(vx);

      const airborne =
        mode === 'jump' ||
        mode === 'fall';

      const running =
        mode === 'run';

      const dash =
        mode === 'dash';

      const hit =
        mode === 'hit';

      const speed01 =
        Phaser.Math.Clamp(
          absVx / 320,
          0,
          1
        );

      // ----------------------------------------------------------
      // POSITION
      // ----------------------------------------------------------

      root.setPosition(
        currentPlayer.x,
        currentPlayer.y - 4
      );

      // ----------------------------------------------------------
      // HORIZONTAL LEAN
      // Purely visual.
      // ----------------------------------------------------------

      const velocityLean =
        Phaser.Math.Clamp(
          vx / 320,
          -1,
          1
        ) * 6;

      let stateLean = 0;

      if (mode === 'jump') {
        stateLean = -3;
      } else if (mode === 'fall') {
        stateLean = 3;
      } else if (hit) {
        stateLean = 7;
      }

      const targetAngle =
        Phaser.Math.Clamp(
          velocityLean + stateLean,
          -8,
          8
        );

      root.setAngle(
        targetAngle
      );

      // ----------------------------------------------------------
      // LANDING DETECTION
      // Delta-time based so the effect is not FPS dependent.
      // ----------------------------------------------------------

      if (
        wasAirborne &&
        !airborne
      ) {
        landingPulse = 1;
      }

      wasAirborne = airborne;

      if (landingPulse > 0) {
        const frameScale =
          Phaser.Math.Clamp(
            delta / 16.67,
            0.5,
            2
          );

        landingPulse = Math.max(
          0,
          landingPulse -
            0.16 * frameScale
        );
      }

      // ----------------------------------------------------------
      // SCALE / SQUASH / STRETCH
      // ----------------------------------------------------------

      let scaleX = 1;
      let scaleY = 1;

      if (dash) {
        scaleX = 1.16;
        scaleY = 0.86;
      } else if (running) {
        scaleX =
          1.02 +
          speed01 * 0.045;

        scaleY =
          1 -
          speed01 * 0.018;
      } else if (mode === 'jump') {
        scaleX = 0.97;
        scaleY = 1.045;
      } else if (mode === 'fall') {
        scaleX = 0.99;
        scaleY = 1.025;
      }

      // Landing compression.
      if (landingPulse > 0) {
        scaleX +=
          landingPulse * 0.065;

        scaleY -=
          landingPulse * 0.085;
      }

      const facingScaleX =
        currentPlayer.flipX
          ? -scaleX
          : scaleX;

      root.setScale(
        facingScaleX,
        scaleY
      );

      // ----------------------------------------------------------
      // SHADOW
      // ----------------------------------------------------------

      const shadowScale =
        airborne
          ? 0.7
          : 1 -
            landingPulse * 0.15;

      shadow.setScale(
        shadowScale,
        shadowScale
      );

      shadow.setAlpha(
        airborne
          ? 0.24
          : 0.42 +
            landingPulse * 0.12
      );

      // ----------------------------------------------------------
      // AURA
      // Alpha is controlled only here.
      // ----------------------------------------------------------

      let auraAlpha = 0.055;

      if (running) {
        auraAlpha =
          0.07 +
          speed01 * 0.025;
      }

      if (dash) {
        auraAlpha = 0.16;
      }

      if (hit) {
        auraAlpha = 0.13;
      }

      if (airborne) {
        auraAlpha += 0.012;
      }

      aura.setAlpha(
        auraAlpha
      );

      // ----------------------------------------------------------
      // AURA AIRBORNE SCALE
      // Only override the ambient tween while airborne.
      // ----------------------------------------------------------

      if (airborne) {
        const airborneScale =
          Phaser.Math.Clamp(
            1 +
              Math.abs(vy) / 2400,
            1,
            1.08
          );

        aura.setScale(
          airborneScale
        );
      } else if (
        this.motionReduced
      ) {
        // With reduced motion there is no scale tween,
        // so keep a stable neutral scale.
        aura.setScale(1);
      }

      // ----------------------------------------------------------
      // CORE COLOR
      // ----------------------------------------------------------

      if (dash) {
        core.setFillStyle(
          0xffd06e,
          1
        );

        coreGlow.setFillStyle(
          0xffd06e,
          0.12
        );
      } else if (hit) {
        core.setFillStyle(
          0xff826e,
          1
        );

        coreGlow.setFillStyle(
          0xff826e,
          0.14
        );
      } else {
        core.setFillStyle(
          0x9cf7ff,
          1
        );

        coreGlow.setFillStyle(
          0x8df4ff,
          0.10
        );
      }

      // ----------------------------------------------------------
      // CHARACTER LIGHTING
      // ----------------------------------------------------------

      stripe.setAlpha(
        dash
          ? 1
          : running
            ? 0.86
            : 0.78
      );

      visorLine.setAlpha(
        hit
          ? 0.35
          : dash
            ? 1
            : 0.95
      );

      coat.setAlpha(
        dash
          ? 0.72
          : 1
      );

      gloveL.setAlpha(
        dash
          ? 1
          : running
            ? 0.92
            : 0.85
      );

      gloveR.setAlpha(
        dash
          ? 1
          : running
            ? 0.92
            : 0.85
      );

      shoulderLightL.setAlpha(
        dash
          ? 1
          : running
            ? 0.9
            : 0.8
      );

      shoulderLightR.setAlpha(
        dash
          ? 1
          : running
            ? 0.9
            : 0.8
      );
    };

    this.playerVisualV2 = {
      root,
      update: updateVisual
    };

    updateVisual();

    // ------------------------------------------------------------
    // SAFE CLEANUP
    // ------------------------------------------------------------

    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      () => {
        // Restore original gameplay body's visual state
        // in case the scene instance is reused.
        if (this.player) {
          this.player.setAlpha(1);
        }

        this.playerVisualV2?.root?.destroy(true);
        this.playerVisualV2 = null;
      }
    );
  };

  RunnerScene.prototype.update = function (
    time,
    delta,
    ...args
  ) {
    originalUpdate.apply(
      this,
      [
        time,
        delta,
        ...args
      ]
    );

    this.playerVisualV2?.update(
      delta
    );
  };
}

