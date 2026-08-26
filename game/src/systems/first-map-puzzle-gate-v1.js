const FIRST_MAP_ID = 'first-delivery';
const PUZZLE_SEQUENCE = [1, 2, 3];
const PUZZLE_X = 2240;
const GATE_X = 2620;
const GROUND_Y = 548;

function safeDestroy(value) {
  value?.destroy?.(true);
}

function createNode(scene, x, value, index, puzzle) {
  const glow = scene.add.circle(x, GROUND_Y - 28, 24, 0x8df4ff, .12)
    .setStrokeStyle(2, 0x8df4ff, .72)
    .setDepth(901)
    .setInteractive({ useHandCursor: true });
  const label = scene.add.text(x, GROUND_Y - 28, String(value), {
    fontFamily: 'DM Mono', fontSize: '15px', color: '#eafcff', stroke: '#08101c', strokeThickness: 4,
  }).setOrigin(.5).setDepth(902);
  const caption = scene.add.text(x, GROUND_Y - 72, `NODE ${index + 1}`, {
    fontFamily: 'DM Mono', fontSize: '8px', color: '#b9f5ff', letterSpacing: 1,
  }).setOrigin(.5).setDepth(902);

  const activate = () => {
    if (puzzle.solved || puzzle.locked) return;
    const solved = scene.solvePuzzleStep?.(puzzle, value) ?? false;
    const correct = puzzle.progress[puzzle.progress.length - 1] === value;
    glow.setFillStyle(correct ? 0xb9f5ff : 0xff826e, correct ? .22 : .16);
    glow.setStrokeStyle(2, correct ? 0xb9f5ff : 0xff826e, .9);
    if (!correct) {
      puzzle.failedAttempts = (puzzle.failedAttempts || 0) + 1;
      puzzle.progress = [];
      scene.playerCue?.('SEQUENCE RESET · TRY AGAIN', '#ff9b8b');
    } else if (solved) {
      scene.playerCue?.('SEQUENCE CORRECT · GATE OPEN', '#b9f5ff');
      scene.openLockedGate?.(puzzle.zone, puzzle);
    } else {
      scene.playerCue?.(`NODE ${puzzle.progress.length}/${puzzle.sequence.length}`, '#b9f5ff');
    }
  };

  glow.on('pointerdown', activate);
  return { glow, label, caption };
}

function installFirstMapPuzzleGate(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__firstMapPuzzleGateV1) return;
  RunnerScene.prototype.__firstMapPuzzleGateV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;

  RunnerScene.prototype.create = function firstMapPuzzleGateCreate(...args) {
    const result = originalCreate.apply(this, args);
    if (this.mission?.id !== FIRST_MAP_ID || this.__firstMapPuzzleGate) return result;

    const puzzle = this.createPuzzle?.({ id: 'first-map-sequence-lock', level: 1 });
    if (!puzzle) return result;
    puzzle.zone = this.createLockedZone?.({ id: 'first-map-gate-zone', x: GATE_X, y: GROUND_Y, width: 76, height: 116, puzzle });
    const gate = this.createLockedGate?.(puzzle.zone, { x: GATE_X, y: GROUND_Y, width: 76, height: 116, depth: 900 });
    if (!gate) return result;

    const group = this.add.container(0, 0).setDepth(899).setName('first-map-puzzle-gate-v1');
    const title = this.add.text(PUZZLE_X, GROUND_Y - 118, 'SEQUENCE LOCK', {
      fontFamily: 'DM Mono', fontSize: '12px', color: '#eafcff', stroke: '#08101c', strokeThickness: 5,
    }).setOrigin(.5);
    const hint = this.add.text(PUZZLE_X, GROUND_Y - 94, 'TAP NODES 1 → 2 → 3  ·  E NEAR NODE', {
      fontFamily: 'DM Mono', fontSize: '8px', color: '#b9f5ff', stroke: '#08101c', strokeThickness: 3,
    }).setOrigin(.5);
    group.add([title, hint]);

    const nodes = PUZZLE_SEQUENCE.map((value, index) => createNode(this, PUZZLE_X + (index - 1) * 72, value, index, puzzle));
    nodes.forEach(node => group.add([node.glow, node.label, node.caption]));

    const gateLabel = this.add.text(GATE_X, GROUND_Y - 94, 'LOCKED GATE', {
      fontFamily: 'DM Mono', fontSize: '9px', color: '#ffcf82', stroke: '#08101c', strokeThickness: 4,
    }).setOrigin(.5).setDepth(902);

    puzzle.locked = false;
    this.__firstMapPuzzleGate = { puzzle, gate, group, nodes, gateLabel, interactRadius: 150 };
    this.playerCue?.('NEW ROUTE OBJECTIVE · SOLVE THE SEQUENCE LOCK', '#b9f5ff');
    return result;
  };

  RunnerScene.prototype.update = function firstMapPuzzleGateUpdate(...args) {
    const result = originalUpdate.apply(this, args);
    const state = this.__firstMapPuzzleGate;
    if (!state || this.mission?.id !== FIRST_MAP_ID || state.puzzle.solved || this.finished || this.respawning) return result;

    const nodeIndex = state.puzzle.progress.length;
    const node = state.nodes[nodeIndex];
    const near = node && this.player ? Phaser.Math.Distance.Between(this.player.x, this.player.y, node.glow.x, node.glow.y) <= state.interactRadius : false;
    if (near && this.keys?.E?.isDown && !state.puzzle.__eLatch) {
      state.puzzle.__eLatch = true;
      node.glow.emit('pointerdown');
    }
    if (!this.keys?.E?.isDown) state.puzzle.__eLatch = false;
    state.gateLabel?.setText(state.puzzle.progress.length ? `LOCKED · ${state.puzzle.progress.length}/3` : 'LOCKED GATE');
    return result;
  };

  RunnerScene.prototype.shutdown = function firstMapPuzzleGateShutdown(...args) {
    const state = this.__firstMapPuzzleGate;
    if (state) {
      safeDestroy(state.group);
      safeDestroy(state.gateLabel);
      this.__firstMapPuzzleGate = null;
    }
    return this.__firstMapPuzzleGateOriginalShutdown?.apply(this, args);
  };
}

export { installFirstMapPuzzleGate };
