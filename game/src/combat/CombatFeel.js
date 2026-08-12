import Phaser from 'phaser';

/**
 * G3 Combat Feel
 * Isolated helpers only. Existing RunnerScene combat remains the source of truth.
 */
export const COMBAT_FEEL = {
  damageFlashMs: 95,
  hitFlashMs: 75,
  hitPauseMs: 45,
  playerHitShakeMs: 105,
  enemyHitShakeMs: 35,
  projectileMaxLifetimeMs: 1200,
};

export function canAcceptCombatHit(scene, sourceId, now = 0, cooldownMs = 140) {
  if (!scene) return false;
  scene._combatHitGuard ||= new Map();
  const last = scene._combatHitGuard.get(sourceId) ?? -Infinity;
  if (now - last < cooldownMs) return false;
  scene._combatHitGuard.set(sourceId, now);
  return true;
}

export function flashSprite(scene, sprite, tint, duration = COMBAT_FEEL.hitFlashMs) {
  if (!sprite?.active) return;
  sprite.setTint(tint);
  scene?.time?.delayedCall(duration, () => {
    if (sprite.active) sprite.clearTint();
  });
}

export function combatHitFeedback(scene, { target = null, color = 0x8df4ff, shake = COMBAT_FEEL.enemyHitShakeMs, pause = COMBAT_FEEL.hitPauseMs } = {}) {
  if (!scene || scene.motionReduced) return;
  if (target?.active) {
    flashSprite(scene, target, color);
    const burst = scene.add.circle(target.x, target.y, 7, color, .5).setBlendMode(Phaser.BlendModes.ADD).setDepth(13);
    scene.tweens.add({
      targets: burst,
      scale: 2.4,
      alpha: 0,
      duration: 130,
      onComplete: () => burst.destroy(),
    });
  }
  if (shake > 0) scene.cameras.main.shake(shake, .0012);
  if (pause > 0 && scene.scene?.manager?.isActive?.(scene.scene.key)) {
    scene.time.timeScale = 0.12;
    scene.time.delayedCall(pause, () => {
      if (scene.sys?.isActive()) scene.time.timeScale = 1;
    });
  }
}

export function playerDamageFeedback(scene) {
  if (!scene || scene.motionReduced || !scene.player?.active) return;
  scene.player.setTint(0xff826e);
  scene.tweens.add({
    targets: scene.player,
    alpha: .42,
    yoyo: true,
    repeat: 2,
    duration: COMBAT_FEEL.damageFlashMs / 2,
    onComplete: () => scene.player?.active && scene.player.clearTint().setAlpha(1),
  });
  scene.cameras.main.shake(COMBAT_FEEL.playerHitShakeMs, .0025);
}
