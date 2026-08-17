import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 06 is an adapter only. Enemy movement/AI remains owned by the existing
// enemy-runtime-v2 + enemy-ai-awareness-v1 systems. Mission/save/settings/mobile
// input remain owned by their existing systems.
(() => {
  if (window.__relayCombatEnemyIntegrationV1) return;
  window.__relayCombatEnemyIntegrationV1 = true;

  const originalCreate = RunnerScene.prototype.create;

  const syncEnemyCombatState = scene => {
    scene.enemies?.getChildren().forEach(enemy => {
      if (!enemy?.active) return;
      const configured = Number(enemy.getData('health'));
      const maxHealth = Number(enemy.getData('maxHealth')) || (Number.isFinite(configured) && configured > 0 ? configured : 1);
      enemy.setData('maxHealth', maxHealth);
      if (!Number.isFinite(Number(enemy.getData('health'))) || Number(enemy.getData('health')) <= 0) enemy.setData('health', maxHealth);
      if (enemy.getData('boss')) enemy.setData('combatRole', 'boss');
      else enemy.setData('combatRole', 'enemy');
      enemy.setData('combatReady', true);
    });
  };

  const installSceneIntegration = scene => {
    if (scene.__combatEnemyIntegrationV1) return;
    scene.__combatEnemyIntegrationV1 = true;

    syncEnemyCombatState(scene);

    const onHit = payload => {
      scene.combatHits = (scene.combatHits || 0) + 1;
      scene.lastCombatHit = payload || null;
      scene.game.events.emit('combat-state', {
        phase: 'hit',
        hits: scene.combatHits,
        enemy: payload?.type || 'hostile',
        remaining: payload?.remaining,
        maxHealth: payload?.maxHealth,
      });
    };

    const onDefeat = payload => {
      scene.combatDefeats = (scene.combatDefeats || 0) + 1;
      scene.lastCombatDefeat = payload || null;
      scene.game.events.emit('combat-state', {
        phase: 'defeat',
        defeats: scene.combatDefeats,
        enemy: payload?.type || 'hostile',
        combo: payload?.combo || scene.combatCombo || 1,
      });
    };

    scene.game.events.on('combat-hit', onHit);
    scene.game.events.on('combat-defeat', onDefeat);

    // Scene-local cleanup prevents listeners from surviving Phaser restarts.
    scene.events.once('shutdown', () => {
      scene.game.events.off('combat-hit', onHit);
      scene.game.events.off('combat-defeat', onDefeat);
      scene.__combatEnemyIntegrationV1 = false;
    });
  };

  RunnerScene.prototype.create = function combatEnemyIntegrationCreate(...args) {
    const result = originalCreate.apply(this, args);
    installSceneIntegration(this);
    return result;
  };

  RunnerScene.prototype.__combatEnemyIntegrationV1 = true;
})();
