function installEnemyPuzzleIntegration(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__enemyPuzzleIntegrationV1) return;
  RunnerScene.prototype.__enemyPuzzleIntegrationV1 = true;

  RunnerScene.prototype.createEnemyPuzzleHint = function (enemyOrKey, puzzle) {
    const key = typeof enemyOrKey === 'string' ? enemyOrKey : enemyOrKey?.texture?.key;
    if (!key || !puzzle) return null;

    const progression = this.getEnemyProgression?.(key);
    const level = progression?.level ?? 1;
    const intel = this.__enemyIntel?.[key];

    return {
      enemyKey: key,
      enemyLevel: level,
      puzzleId: puzzle.id,
      hint: level >= 4
        ? 'Watch the final sequence carefully.'
        : level >= 2
          ? 'The order matters. Observe before activating.'
          : 'Start with the simplest sequence.',
      source: intel?.name || key,
    };
  };

  RunnerScene.prototype.bindEnemyToPuzzle = function (enemy, puzzle) {
    if (!enemy || !puzzle) return null;
    const hint = this.createEnemyPuzzleHint(enemy, puzzle);
    enemy.__relayPuzzleHint = hint;
    return hint;
  };

  RunnerScene.prototype.getEnemyPuzzleHint = function (enemy) {
    return enemy?.__relayPuzzleHint || null;
  };
}

export { installEnemyPuzzleIntegration };
