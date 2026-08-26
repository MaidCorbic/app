const MAX_PUZZLE_LEVEL = 3;

function missionLevel(scene) {
  return Math.max(0, Number(scene?.mission?.level ?? scene?.mission?.index ?? 0));
}

function installPuzzleProgression(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__puzzleProgressionV1) return;
  RunnerScene.prototype.__puzzleProgressionV1 = true;

  RunnerScene.prototype.getPuzzleDifficulty = function (explicitLevel = null) {
    if (explicitLevel != null) return Math.max(1, Math.min(MAX_PUZZLE_LEVEL, Number(explicitLevel)));
    return Math.min(MAX_PUZZLE_LEVEL, 1 + Math.floor(missionLevel(this) / 2));
  };

  const originalCreatePuzzle = RunnerScene.prototype.createPuzzle;
  RunnerScene.prototype.createPuzzle = function (config = {}) {
    return originalCreatePuzzle.call(this, {
      ...config,
      level: this.getPuzzleDifficulty(config.level),
    });
  };

  RunnerScene.prototype.getPuzzleProgressionInfo = function () {
    const level = this.getPuzzleDifficulty();
    return {
      level,
      label: `PUZZLE LEVEL ${level}`,
      nextLevelAtMission: level >= MAX_PUZZLE_LEVEL ? null : level * 2,
    };
  };
}

export { installPuzzleProgression };
