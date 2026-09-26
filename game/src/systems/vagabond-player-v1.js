import Phaser from 'phaser';
const VAGABOND_ASSETS = import.meta.glob('../../assets/player/vagabond-final/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

// ============================================================
// RUNNER RELAY — VAGABOND PLAYER PRESENTATION V2
// ============================================================
//
// Visual-only player presentation.
//
// IMPORTANT:
// - this.player remains the original physics/collision body.
// - No gameplay physics are changed.
// - No input is changed.
// - No missions are changed.
// - No collision sizes are changed.
// - The original player is made invisible.
// - Vagabond is the only visible player presentation.
//
// Asset location:
//   game/assets/player/vagabond-final/
//
// Every final frame is 128x128 PNG.
// ============================================================

// ------------------------------------------------------------
// Animation definitions
// ------------------------------------------------------------

const ANIMATIONS = {
  idle: {
    folder: 'vagabond-idle',
    frames: 2,
    frameRate: 3,
    repeat: -1,
  },

  run: {
    folder: 'vagabond-run',
    frames: 8,
    frameRate: 12,
    repeat: -1,
  },

  runEnd: {
    folder: 'vagabond-run-end',
    frames: 4,
    frameRate: 12,
    repeat: 0,
  },

  jump: {
    folder: 'vagabond-jump',
    frames: 3,
    frameRate: 8,
    repeat: 0,
  },

  jumpFlip: {
    folder: 'vagabond-jump-flip',
    frames: 3,
    frameRate: 8,
    repeat: 0,
  },

  dash: {
    folder: 'vagabond-dash',
    frames: 4,
    frameRate: 14,
    repeat: 0,
  },

  airDash: {
    folder: 'vagabond-air-dash',
    frames: 4,
    frameRate: 14,
    repeat: 0,
  },

  knockback: {
    folder: 'vagabond-knockback',
    frames: 4,
    frameRate: 10,
    repeat: 0,
  },

  death: {
    folder: 'vagabond-death',
    frames: 7,
    frameRate: 10,
    repeat: 0,
  },

  attack: {
    folder: 'vagabond-attack',
    frames: 30,
    frameRate: 18,
    repeat: 0,
  },

  heavyAttack: {
    folder: 'vagabond-heavy-attack',
    frames: 26,
    frameRate: 16,
    repeat: 0,
  },

  jumpAttack: {
    folder: 'vagabond-jump-attack',
    frames: 32,
    frameRate: 16,
    repeat: 0,
  },

  block: {
    folder: 'vagabond-block',
    frames: 2,
    frameRate: 5,
    repeat: -1,
  },
};

// ------------------------------------------------------------
// Texture key
// ------------------------------------------------------------

function frameKey(folder, index) {
  // Keep Phaser texture keys independent from the source filename.
  // Source files are named like:
  //   vagabond-idle_000.png
  //   vagabond-run_000.png
  //
  // The previous implementation incorrectly searched for:
  //   vagabond-vagabond-idle-000.png
  // which does not exist.
  return `vagabond-${folder}-${String(index).padStart(3, '0')}`;
}

// ------------------------------------------------------------
// Asset URL
// ------------------------------------------------------------

function folderAssets(folder) {
  return Object.entries(VAGABOND_ASSETS)
    .filter(([path]) => path.includes(`/vagabond-final/${folder}/`))
    .sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
}

function frameUrl(folder, index) {
  const assets = folderAssets(folder);
  const entry = assets[index];

  if (!entry) {
    console.error('[Vagabond] PNG not found:', folder, index);

    return null;
  }

  return entry[1];
}

// ============================================================
// PRELOAD
// ============================================================

function installPreload(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__vagabondPreloadV2Installed) {
    return;
  }

  RunnerScene.prototype.__vagabondPreloadV2Installed = true;

  const originalPreload = RunnerScene.prototype.preload;

  RunnerScene.prototype.preload = function (...args) {
    if (typeof originalPreload === 'function') {
      originalPreload.apply(this, args);
    }

    if (!this.load) {
      return;
    }

    Object.values(ANIMATIONS).forEach((animation) => {
      for (let index = 0; index < animation.frames; index += 1) {
        const key = frameKey(animation.folder, index);
        const url = frameUrl(animation.folder, index);

        if (!url) {
          console.error('[Vagabond] Missing asset URL:', key);

          return;
        }

        if (!this.textures.exists(key)) {
          this.load.image(key, url);
        }
      }
    });
  };
}

// ============================================================
// CREATE ANIMATIONS
// ============================================================

function createAnimations(scene) {
  if (!scene?.anims) {
    return;
  }

  Object.entries(ANIMATIONS).forEach(([name, config]) => {
    const key = `vagabond-${name}`;

    if (scene.anims.exists(key)) {
      return;
    }

    const frames = [];

    for (let index = 0; index < config.frames; index += 1) {
      const texture = frameKey(config.folder, index);

      if (scene.textures.exists(texture)) {
        frames.push({
          key: texture,
        });
      }
    }

    if (!frames.length) {
      console.error(`[Vagabond] No frames loaded for animation: ${key}`);
      return;
    }

    scene.anims.create({
      key,
      frames,
      frameRate: config.frameRate,
      repeat: config.repeat,
    });
  });
}

// ============================================================
// SAFE ANIMATION PLAY
// ============================================================

function playAnimation(sprite, animation, force = false) {
  if (!sprite || !sprite.scene || !sprite.scene.anims || !sprite.scene.anims.exists(animation)) {
    return;
  }

  if (!force && sprite.anims?.currentAnim?.key === animation) {
    return;
  }

  sprite.play(animation, true);
}

// ============================================================
// MAP EXISTING PLAYER STATE → VAGABOND
// ============================================================

function getVisualAnimation(player) {
  if (!player) {
    return 'vagabond-idle';
  }

  const currentKey = player.anims?.currentAnim?.key || '';

  const mode = currentKey.replace(/^runner-/, '').toLowerCase();

  const body = player.body;

  const vx = Number(body?.velocity?.x) || 0;
  const vy = Number(body?.velocity?.y) || 0;

  const speed = Math.abs(vx);

  // Death
  if (mode === 'death' || mode === 'dead') {
    return 'vagabond-death';
  }

  // Hit
  if (mode === 'hit' || mode === 'hurt') {
    return 'vagabond-knockback';
  }

  // Dash
  if (mode === 'dash') {
    return 'vagabond-dash';
  }

  // Air dash
  if (mode === 'air-dash' || mode === 'airdash') {
    return 'vagabond-airDash';
  }

  // Jump
  if (mode === 'jump') {
    return 'vagabond-jump';
  }

  // Fall
  if (mode === 'fall') {
    if (vy > 100) {
      return 'vagabond-jump';
    }

    return 'vagabond-jumpFlip';
  }

  // Attack
  if (mode === 'attack' || mode === 'attack-1' || mode === 'attack1') {
    return 'vagabond-attack';
  }

  // Heavy attack
  if (mode === 'heavy-attack' || mode === 'heavyattack') {
    return 'vagabond-heavyAttack';
  }

  // Jump attack
  if (mode === 'jump-attack' || mode === 'jumpattack') {
    return 'vagabond-jumpAttack';
  }

  // Block
  if (mode === 'block') {
    return 'vagabond-block';
  }

  // Run
  if (mode === 'run' || speed > 25) {
    return 'vagabond-run';
  }

  // Idle
  return 'vagabond-idle';
}

// ============================================================
// INSTALL
// ============================================================

export function installVagabondPlayerV1(RunnerScene) {
  console.log('%c[VAGABOND V1] SYSTEM LOADED', 'color:#00ffff;font-size:20px;font-weight:bold');
  if (!RunnerScene?.prototype || RunnerScene.prototype.__vagabondPlayerV2Installed) {
    return;
  }

  // ----------------------------------------------------------
  // Install preload hook first.
  // ----------------------------------------------------------

  installPreload(RunnerScene);

  RunnerScene.prototype.__vagabondPlayerV2Installed = true;

  const originalCreate = RunnerScene.prototype.create;

  const originalUpdate = RunnerScene.prototype.update;

  // ==========================================================
  // CREATE
  // ==========================================================

  RunnerScene.prototype.create = function (...args) {
    originalCreate.apply(this, args);

    if (!this.player || this.vagabondPlayerV1) {
      return;
    }

    const player = this.player;

    // --------------------------------------------------------
    // Create Vagabond animations.
    // --------------------------------------------------------

    createAnimations(this);

    const idleTexture = frameKey('vagabond-idle', 0);

    // --------------------------------------------------------
    // Safety check.
    // --------------------------------------------------------

    if (!this.textures.exists(idleTexture)) {
      console.error('[Vagabond] Idle texture was not loaded:', idleTexture);

      console.error('[Vagabond] Expected URL:', frameUrl('vagabond-idle', 0));

      return;
    }

    // ========================================================
    // HIDE ORIGINAL PLAYER
    // ========================================================
    //
    // The original object remains alive.
    //
    // It continues to handle:
    // - physics
    // - collision
    // - input
    // - movement
    // - jump
    // - dash
    // - missions
    //
    // But it is NOT rendered.
    // ========================================================

    player.setAlpha(0);
    player.setVisible(false);

    // ========================================================
    // VAGABOND SPRITE
    // ========================================================

    const sprite = this.add
      .sprite(player.x, player.y - 4, idleTexture)
      .setDepth(12)
      .setOrigin(0.5, 0.5)
      .setName('vagabond-player-v1')
      .setVisible(true)
      .setAlpha(1);

    // --------------------------------------------------------
    // Character scale
    // --------------------------------------------------------

    const baseScale = 0.72;

    sprite.setScale(baseScale);

    // ========================================================
    // AURA
    // ========================================================

    const aura = this.add
      .circle(player.x, player.y - 2, 38, 0x63e6ff, 0.055)
      .setDepth(11)
      .setBlendMode(Phaser.BlendModes.ADD);

    // ========================================================
    // GROUND SHADOW
    // ========================================================

    const shadow = this.add.ellipse(player.x, player.y + 35, 34, 8, 0x02060c, 0.42).setDepth(10);

    // ========================================================
    // AURA ANIMATION
    // ========================================================

    if (!this.motionReduced) {
      this.tweens.add({
        targets: aura,
        scale: {
          from: 0.94,
          to: 1.08,
        },
        alpha: {
          from: 0.045,
          to: 0.075,
        },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }

    // ========================================================
    // STATE
    // ========================================================

    let lastAnimation = '';

    let wasAirborne = false;

    let landingPulse = 0;

    // ========================================================
    // VISUAL UPDATE
    // ========================================================

    const updateVisual = (delta = 16.67) => {
      const state = this.vagabondPlayerV1;

      if (!state?.sprite) {
        return;
      }

      const currentPlayer = this.player;

      if (!currentPlayer?.active) {
        return;
      }

      // ------------------------------------------------------
      // HARD VISIBILITY LOCK
      // ------------------------------------------------------
      //
      // Other old systems may call:
      //
      // player.setAlpha(1)
      // player.setVisible(true)
      //
      // We intentionally force the original player invisible.
      // ------------------------------------------------------

      if (currentPlayer.alpha !== 0 || currentPlayer.visible !== false) {
        currentPlayer.setAlpha(0);
        currentPlayer.setVisible(false);
      }

      const body = currentPlayer.body;

      const vx = Number(body?.velocity?.x) || 0;

      const vy = Number(body?.velocity?.y) || 0;

      const absVx = Math.abs(vx);

      // ------------------------------------------------------
      // Position
      // ------------------------------------------------------

      sprite.setPosition(currentPlayer.x, currentPlayer.y - 4);

      aura.setPosition(currentPlayer.x, currentPlayer.y - 2);

      shadow.setPosition(currentPlayer.x, currentPlayer.y + 35);

      // ------------------------------------------------------
      // Current old player state
      // ------------------------------------------------------

      const currentKey = currentPlayer.anims?.currentAnim?.key || '';

      const mode = currentKey.replace(/^runner-/, '').toLowerCase();

      const airborne = mode === 'jump' || mode === 'fall';

      const running = mode === 'run' || absVx > 25;

      const dash = mode === 'dash' || mode === 'air-dash' || mode === 'airdash';

      const hit = mode === 'hit' || mode === 'hurt';

      // ------------------------------------------------------
      // Select Vagabond animation
      // ------------------------------------------------------

      const nextAnimation = getVisualAnimation(currentPlayer);

      if (nextAnimation !== lastAnimation) {
        playAnimation(sprite, nextAnimation);

        lastAnimation = nextAnimation;
      }

      // ------------------------------------------------------
      // Facing
      // ------------------------------------------------------

      sprite.setFlipX(Boolean(currentPlayer.flipX));

      // ------------------------------------------------------
      // Lean
      // ------------------------------------------------------

      const velocityLean = Phaser.Math.Clamp(vx / 320, -1, 1) * 5;

      let stateLean = 0;

      if (mode === 'jump') {
        stateLean = -2;
      } else if (mode === 'fall') {
        stateLean = 2;
      } else if (hit) {
        stateLean = 6;
      }

      sprite.setAngle(Phaser.Math.Clamp(velocityLean + stateLean, -7, 7));

      // ------------------------------------------------------
      // Landing
      // ------------------------------------------------------

      if (wasAirborne && !airborne) {
        landingPulse = 1;
      }

      wasAirborne = airborne;

      if (landingPulse > 0) {
        const frameScale = Phaser.Math.Clamp(delta / 16.67, 0.5, 2);

        landingPulse = Math.max(0, landingPulse - 0.16 * frameScale);
      }

      // ------------------------------------------------------
      // Scale
      // ------------------------------------------------------

      let scaleX = baseScale;
      let scaleY = baseScale;

      if (dash) {
        scaleX *= 1.08;
        scaleY *= 0.92;
      } else if (running) {
        const speed01 = Phaser.Math.Clamp(absVx / 320, 0, 1);

        scaleX *= 1.015 + speed01 * 0.035;

        scaleY *= 0.99 - speed01 * 0.015;
      } else if (mode === 'jump') {
        scaleX *= 0.98;
        scaleY *= 1.035;
      } else if (mode === 'fall') {
        scaleY *= 1.02;
      }

      // Landing compression

      if (landingPulse > 0) {
        scaleX += baseScale * landingPulse * 0.055;

        scaleY -= baseScale * landingPulse * 0.07;
      }

      // ------------------------------------------------------
      // Do NOT use negative scaleX.
      // FlipX handles direction.
      // ------------------------------------------------------

      sprite.setScale(scaleX, scaleY);

      // ------------------------------------------------------
      // Shadow
      // ------------------------------------------------------

      const shadowScale = airborne ? 0.7 : 1 - landingPulse * 0.15;

      shadow.setScale(shadowScale, shadowScale);

      shadow.setAlpha(airborne ? 0.22 : 0.42 + landingPulse * 0.12);

      // ------------------------------------------------------
      // Aura
      // ------------------------------------------------------

      let auraAlpha = 0.055;

      if (running) {
        auraAlpha = 0.065 + Phaser.Math.Clamp(absVx / 320, 0, 1) * 0.025;
      }

      if (dash) {
        auraAlpha = 0.15;
      }

      if (hit) {
        auraAlpha = 0.13;
      }

      if (airborne) {
        auraAlpha += 0.012;
      }

      aura.setAlpha(auraAlpha);

      // ------------------------------------------------------
      // Airborne aura
      // ------------------------------------------------------

      if (airborne) {
        const airborneScale = Phaser.Math.Clamp(1 + Math.abs(vy) / 2400, 1, 1.08);

        aura.setScale(airborneScale);
      } else if (this.motionReduced) {
        aura.setScale(1);
      }
    };

    // ========================================================
    // PUBLIC STATE
    // ========================================================

    this.vagabondPlayerV1 = {
      sprite,
      aura,
      shadow,
      update: updateVisual,
    };

    // Initial update.
    updateVisual();

    // ========================================================
    // CLEANUP
    // ========================================================

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      // Do NOT restore old player visibility.
      // Vagabond is intended to be the sole presentation.

      this.vagabondPlayerV1?.sprite?.destroy();

      this.vagabondPlayerV1?.aura?.destroy();

      this.vagabondPlayerV1?.shadow?.destroy();

      this.vagabondPlayerV1 = null;
    });
  };

  // ==========================================================
  // UPDATE HOOK
  // ==========================================================

  RunnerScene.prototype.update = function (time, delta, ...args) {
    originalUpdate.apply(this, [time, delta, ...args]);

    this.vagabondPlayerV1?.update(delta);
  };
}
