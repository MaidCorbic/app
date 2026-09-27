// Striker enemy visual replacement.
// Keeps the logical enemy type as "enemy-runner" and only changes presentation.

const STRIKER_KEY = 'striker';

const STRIKER_ANIMS = Object.freeze({
  idle: {
    key: 'striker-idle',
    texture: 'striker-idle',
    frameRate: 8,
    repeat: -1,
  },
  run: {
    key: 'striker-run',
    texture: 'striker-run',
    frameRate: 12,
    repeat: -1,
  },
  jump: {
    key: 'striker-jump',
    texture: 'striker-jump',
    frameRate: 12,
    repeat: 0,
  },
  dash: {
    key: 'striker-dash',
    texture: 'striker-dash',
    frameRate: 16,
    repeat: 0,
  },
  getHit: {
    key: 'striker-get-hit',
    texture: 'striker-get-hit',
    frameRate: 12,
    repeat: 0,
  },
  death: {
    key: 'striker-death',
    texture: 'striker-death',
    frameRate: 12,
    repeat: 0,
  },
  slash: {
    key: 'striker-slash',
    texture: 'striker-slash',
    frameRate: 18,
    repeat: 0,
  },
});

function createAnimation(scene, config, frameCount) {
  if (!scene.anims.exists(config.key)) {
    scene.anims.create({
      key: config.key,
      frames: scene.anims.generateFrameNumbers(config.texture, {
        start: 0,
        end: frameCount - 1,
      }),
      frameRate: config.frameRate,
      repeat: config.repeat,
    });
  }
}

function ensureStrikerAnimations(scene) {
  createAnimation(scene, STRIKER_ANIMS.idle, 8);
  createAnimation(scene, STRIKER_ANIMS.run, 8);
  createAnimation(scene, STRIKER_ANIMS.jump, 12);
  createAnimation(scene, STRIKER_ANIMS.dash, 12);
  createAnimation(scene, STRIKER_ANIMS.getHit, 4);
  createAnimation(scene, STRIKER_ANIMS.death, 16);
  createAnimation(scene, STRIKER_ANIMS.slash, 21);
}

function getEnemyType(enemy) {
  return enemy?.getData?.('route')?.type || enemy?.texture?.key || '';
}

function getEnemyDirection(enemy) {
  const direction = enemy?.getData?.('direction');

  if (direction === -1 || direction === 1) {
    return direction;
  }

  if (enemy?.body?.velocity?.x < -1) {
    return -1;
  }

  return 1;
}

function getStrikerState(enemy) {
  if (!enemy || !enemy.active) {
    return 'idle';
  }

  if (enemy.getData('strikerDead')) {
    return 'death';
  }

  if (enemy.getData('strikerHit')) {
    return 'getHit';
  }

  if (enemy.getData('strikerSlash')) {
    return 'slash';
  }

  if (enemy.getData('strikerDash')) {
    return 'dash';
  }

  if (enemy.getData('strikerJump')) {
    return 'jump';
  }

  const velocityX = Math.abs(enemy.body?.velocity?.x || 0);
  const velocityY = Math.abs(enemy.body?.velocity?.y || 0);

  if (velocityY > 12) {
    return 'jump';
  }

  if (velocityX > 8) {
    return 'run';
  }

  return 'idle';
}

function applyStrikerVisual(enemy) {
  if (!enemy || !enemy.active) {
    return;
  }

  if (getEnemyType(enemy) !== 'enemy-runner') {
    return;
  }

  const direction = getEnemyDirection(enemy);

  enemy.setFlipX(direction < 0);

  const state = getStrikerState(enemy);
  const anim = STRIKER_ANIMS[state] || STRIKER_ANIMS.idle;

  if (enemy.anims?.currentAnim?.key !== anim.key) {
    enemy.play(anim.key, true);
  }
}

function installEnemyVisualHooks(scene) {
  if (scene.__strikerVisualInstalled) {
    return;
  }

  scene.__strikerVisualInstalled = true;

  ensureStrikerAnimations(scene);

  scene.events.on('update', () => {
    const enemies = scene.enemies;

    if (!enemies?.getChildren) {
      return;
    }

    for (const enemy of enemies.getChildren()) {
      applyStrikerVisual(enemy);
    }
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

  const originalCreate = RunnerScene.prototype.create;

  if (typeof originalCreate !== 'function') {
    return;
  }

  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);

    installEnemyVisualHooks(this);

    return result;
  };
}
