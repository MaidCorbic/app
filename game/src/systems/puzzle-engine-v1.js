const PUZZLE_RADIUS = 180;

const PUZZLE_TYPES = {
  sequence: {
    title: 'SEQUENCE LOCK',
    description: 'Activate the symbols in the correct order.',
    levels: [
      { sequence: [1, 2, 3] },
      { sequence: [2, 1, 3, 4] },
      { sequence: [3, 1, 4, 2, 5] },
    ],
  },
};

function installPuzzleEngine(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__puzzleEngineV1) return;
  RunnerScene.prototype.__puzzleEngineV1 = true;

  RunnerScene.prototype.createPuzzle = function (config = {}) {
    const type = config.type || 'sequence';
    const definition = PUZZLE_TYPES[type] || PUZZLE_TYPES.sequence;
    const difficulty = Math.max(1, Math.min(definition.levels.length, Number(config.level || 1)));
    const level = definition.levels[difficulty - 1];

    return {
      id: config.id || `puzzle-${Date.now()}`,
      type,
      title: definition.title,
      description: definition.description,
      difficulty,
      sequence: [...level.sequence],
      progress: [],
      solved: false,
      radius: PUZZLE_RADIUS,
    };
  };

  RunnerScene.prototype.solvePuzzleStep = function (puzzle, value) {
    if (!puzzle || puzzle.solved) return false;

    const expected = puzzle.sequence[puzzle.progress.length];
    if (Number(value) !== expected) {
      puzzle.progress = [];
      return false;
    }

    puzzle.progress.push(Number(value));
    puzzle.solved = puzzle.progress.length === puzzle.sequence.length;
    return puzzle.solved;
  };

  RunnerScene.prototype.resetPuzzle = function (puzzle) {
    if (!puzzle) return;
    puzzle.progress = [];
    puzzle.solved = false;
  };

  RunnerScene.prototype.isPuzzleSolved = function (puzzle) {
    return Boolean(puzzle?.solved);
  };
}

export { installPuzzleEngine };
