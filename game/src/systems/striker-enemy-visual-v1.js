// Striker enemy visual replacement.
// Keeps the logical enemy type as "enemy-runner" and changes only its
// presentation. All other legacy enemy types remain untouched.
//
// Striker source:
//   game/assets/enemies/striker/*.png
//
// Every Striker frame is 96x96.

const STRIKER_ASSETS = import.meta.glob(
  '../../assets/enemies/striker/*.png',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
);

const FRAME_WIDTH = 96;
const FRAME_HEIGHT = 96;
const VISUAL_SCALE = 1.0;

const STRIKER_ANIMS = Object.freeze({
  idle: {
    key: 'striker-idle',
    file: 'spr_StrikerIdle_strip.png',
    frames: 8,
    frameRate: 8,
    repeat: -1,
  },
  run: {
    key: 'striker-run',
    file: 'spr_StrikerRun_strip.png',
    frames: 8,
    frameRate: 12,
    repeat: -1,
  },
  jump: {
    key: 'striker-jump',
    file: 'spr_StrikerJump_strip.png',
    frames: 12,
    frameRate: 12,
    repeat: 0,
  },
  dash: {
    key: 'striker-dash',
    file: 'spr_StrikerDash_strip.png',
    frames: 12,
    frameRate: 16,
    repeat: 0,
  },
  getHit: {
    key: 'striker-get-hit',
    file: 'spr_StrikerGetHit_strip.png',
    frames: 4,
    frameRate: 12,
    repeat: 0,
  },
  death: {
    key: 'striker-death',
    file: 'spr_StrikerDeath_strip.png',
    frames: 16,
    frameRate: 12,
    repeat: 0,
  },
  slash: {
    key: 'striker-slash',
    file: 'spr_StrikerSlash_stripNoEffect.png',
    frames: 21,
    frameRate: 18,
    repeat: 0,
  },
});

function assetUrl(fileName) {
  const entry = Object.entries(STRIKER_ASSETS).find(
    ([path]) => path.endsWith('/striker/' + fileName),
  );

  return entry?.[1] || null;
}

function installPreload(RunnerScene) {
  if (
    !RunnerScene?.prototype ||
    RunnerScene.prototype.__strikerPreloadV1Installed
  ) {
    return;
  }

  RunnerScene.prototype.__strikerPreloadV1Installed = true;

  const originalPreload = RunnerScene.prototype.preload;

  RunnerScene.prototype.preload = function (...args) {
    if (typeof originalPreload === 'function') {
      originalPreload.apply(this, args);
    }

    if (!this.load) {
      return;
    }

    Object.values(STRIKER_ANIMS).forEach((config) => {
      const url = assetUrl(config.file);

      if (!url) {
        console.error('[Striker] Missing asset:', config.file);
        return;
      }

      if (this.textures.exists(config.key)) {
        return;
      }

      this.load.spritesheet(config.key, url, {
        frameWidth: FRAME_WIDTH,
        frameHeight: FRAME_HEIGHT,
      });
    });
  };
}

function ensureStrikerAnimations(scene) {
  if (!scene?.anims || !scene?.textures) {
    return;
  }

  Object.values(STRIKER_ANIMS).forEach((config) => {
    if (scene.anims.exists(config.key)) {
      return;
    }

    if (!scene.textures.exists(config.key)) {
      console.error('[Striker] Texture not loaded:', config.key);
      return;
    }

    scene.anims.create({
      key: config.key,
      frames: scene.anims.generateFrameNumbers(config.key, {
        start: 0,
        end: config.frames - 1,
      }),
      frameRate: config.frameRate,
      repeat: config.repeat,
    });
  });
}

function getEnemyType(enemy) {
  return enemy?.getData?.('route')?.type || '';
}

function getEnemyDirection(enemy) {
  const direction = enemy?.getData?.('direction');

  if (direction === -1 || direction === 1) {
    return direction;
  }

  const velocityX = Number(enemy?.body?.velocity?.x) || 0;

  return velocityX < -1 ? -1 : 1;
}

function getStrikerState(enemy) {
  if (!enemy?.active) {
    return 'idle';
  }

  if (
    enemy.getData('strikerDead') ||
    enemy.getData('dead') ||
    enemy.getData('dying')
  ) {
    return 'death';
  }

  if (
    enemy.getData('strikerHit') ||
    enemy.getData('getHit') ||
    enemy.getData('hit')
  ) {
    return 'getHit';
  }

  if (
    enemy.getData('strikerSlash') ||
    enemy.getData('slash') ||
    enemy.getData('attacking') ||
    enemy.getData('attack')
  ) {
    return 'slash';
  }

  if (
    enemy.getData('strikerDash') ||
    enemy.getData('dash') ||
    enemy.getData('dashing')
  ) {
    return 'dash';
  }

  if (
    enemy.getData('strikerJump') ||
    enemy.getData('jump')
  ) {
    return 'jump';
  }

  const velocityX = Math.abs(Number(enemy?.body?.velocity?.x) || 0);
  const velocityY = Math.abs(Number(enemy?.body?.velocity?.y) || 0);

  if (velocityY > 12) {
    return 'jump';
  }

  if (velocityX > 8) {
    return 'run';
  }

  return 'idle';
}

function applyStrikerVisual(enemy) {
  if (!enemy?.active) {
    return;
  }

  // Only the logical enemy-runner becomes Striker.
  // All legacy enemy types keep their original textures/animations.
  if (getEnemyType(enemy) !== 'enemy-runner') {
    return;
  }

  const direction = getEnemyDirection(enemy);
  enemy.setFlipX(direction < 0);

  // Keep the original gameplay sprite/body object.
  // Only its visual animation/texture is replaced.
  enemy.setScale(VISUAL_SCALE);

  const state = getStrikerState(enemy);
  const animation = STRIKER_ANIMS[state] || STRIKER_ANIMS.idle;

  if (!enemy.scene?.anims?.exists(animation.key)) {
    return;
  }

  if (enemy.anims?.currentAnim?.key !== animation.key) {
    enemy.play(animation.key, true);
  }
}

function installEnemyVisualHooks(scene) {
  if (!scene || scene.__strikerVisualInstalled) {
    return;
  }

  scene.__strikerVisualInstalled = true;

  ensureStrikerAnimations(scene);

  // Newly spawned enemies are handled automatically on every update.
  scene.events.on('update', () => {
    const enemies = scene.enemies;

    if (!enemies?.getChildren) {
      return;
    }

    for (const enemy of enemies.getChildren()) {
      applyStrikerVisual(enemy);
    }
  });

  scene.events.once('shutdown', () => {
    scene.__strikerVisualInstalled = false;
  });
}

export function installStrikerEnemyVisual(RunnerScene) {
  if (!RunnerScene?.prototype) {
    return;
  }

  if (RunnerScene.prototype.__strikerEnemyVisualInstalled) {
    return;
  }

  RunnerScene.prototype.__strikerEnemyVisualInstalled = true;

  // Load Striker sheets before RunnerScene.create().
  installPreload(RunnerScene);

  const originalCreate = RunnerScene.prototype.create;

  if (typeof originalCreate !== 'function') {
    return;
  }

  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);

    ensureStrikerAnimations(this);
    installEnemyVisualHooks(this);

    return result;
  };
}
