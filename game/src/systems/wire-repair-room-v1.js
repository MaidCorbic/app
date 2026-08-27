const WIRE_ROOM_STATE = Object.freeze({ IDLE: 'idle', ACTIVE: 'active', SOLVED: 'solved', FAILED: 'failed' });

function normalizePair(pair, index) {
  return {
    id: pair.id ?? index + 1,
    from: Number(pair.from),
    to: Number(pair.to),
    color: pair.color || null,
    label: pair.label || `Terminal ${Number(pair.from)}`,
  };
}

function uniqueFinite(values = []) {
  return [...new Set(values.map(Number).filter(Number.isFinite))];
}

function installWireRepairRoom(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__wireRepairRoomV1) return;
  RunnerScene.prototype.__wireRepairRoomV1 = true;

  RunnerScene.prototype.createWireRepairRoom = function (config = {}) {
    const pairs = Array.isArray(config.pairs) && config.pairs.length
      ? config.pairs.map(normalizePair)
      : [
          { id: 1, from: 1, to: 4, color: 'red', label: 'RED FEED' },
          { id: 2, from: 2, to: 6, color: 'blue', label: 'BLUE FEED' },
          { id: 3, from: 3, to: 5, color: 'yellow', label: 'AUX FEED' },
        ];

    const starts = uniqueFinite(pairs.map(pair => pair.from));
    const targets = uniqueFinite(pairs.map(pair => pair.to));
    const room = {
      id: config.id || `wire-room-${Date.now()}`,
      title: config.title || 'POWER CONTROL ROOM',
      subtitle: config.subtitle || 'Reconnect the grid to restore power.',
      state: WIRE_ROOM_STATE.IDLE,
      difficulty: Math.max(1, Number(config.difficulty ?? Math.min(3, pairs.length))),
      maxAttempts: Math.max(1, Number(config.maxAttempts ?? Math.max(4, pairs.length + 1))),
      attempts: 0,
      score: 0,
      connections: [],
      connected: new Set(),
      pairs,
      starts,
      targets,
      mistakes: [],
      selectedSource: null,
      requiredConnections: pairs.length,
      faultId: config.faultId || null,
      sectorId: config.sectorId || null,
      hintUses: Math.max(0, Number(config.hintUses ?? 2)),
      hintsUsed: 0,
      onComplete: typeof config.onComplete === 'function' ? config.onComplete : null,
      onFail: typeof config.onFail === 'function' ? config.onFail : null,
      onStateChange: typeof config.onStateChange === 'function' ? config.onStateChange : null,
      onConnection: typeof config.onConnection === 'function' ? config.onConnection : null,
      onMistake: typeof config.onMistake === 'function' ? config.onMistake : null,
    };

    return room;
  };

  RunnerScene.prototype.openWireRepairRoom = function (room) {
    if (!room || room.state === WIRE_ROOM_STATE.SOLVED) return false;
    const previous = room.state;
    room.state = WIRE_ROOM_STATE.ACTIVE;
    room.selectedSource = null;
    if (previous !== room.state) room.onStateChange?.(room.state, previous, room, this);
    return true;
  };

  RunnerScene.prototype.selectWireSource = function (room, from) {
    if (!room || room.state !== WIRE_ROOM_STATE.ACTIVE) return false;
    const source = Number(from);
    if (!room.starts.includes(source)) return false;
    if (room.connections.some(connection => connection.from === source)) return false;
    room.selectedSource = source;
    return true;
  };

  RunnerScene.prototype.connectWire = function (room, from, to) {
    if (!room || room.state !== WIRE_ROOM_STATE.ACTIVE) return { changed: false, correct: false, solved: false, reason: 'inactive' };

    const source = Number(from ?? room.selectedSource);
    const target = Number(to);
    const expected = room.pairs.find(pair => pair.from === source);
    const sourceUsed = room.connections.some(pair => pair.from === source);
    const targetUsed = room.connections.some(pair => pair.to === target);

    if (!expected || !room.targets.includes(target) || sourceUsed || targetUsed) {
      return { changed: false, correct: false, solved: false, failed: false, reason: 'invalid-connection', room };
    }

    room.attempts += 1;
    room.selectedSource = null;
    const correct = expected.to === target;

    if (correct) {
      const id = expected.id;
      room.connected.add(id);
      room.connections.push({ id, from: source, to: target, color: expected.color || null });
      room.score += Math.max(10, 100 - ((room.attempts - room.connected.size) * 10));
      room.onConnection?.(expected, room, this);
    } else {
      const mistake = { from: source, to: target, expected: expected.to, attempt: room.attempts };
      room.mistakes.push(mistake);
      room.score = Math.max(0, room.score - 15);
      room.onMistake?.(mistake, room, this);
    }

    const solved = room.connected.size === room.requiredConnections;
    if (solved) {
      const previous = room.state;
      room.state = WIRE_ROOM_STATE.SOLVED;
      room.onStateChange?.(room.state, previous, room, this);
      room.onComplete?.(room, this);
    } else if (room.attempts >= room.maxAttempts) {
      const previous = room.state;
      room.state = WIRE_ROOM_STATE.FAILED;
      room.onStateChange?.(room.state, previous, room, this);
      room.onFail?.(room, this);
    }

    return {
      changed: true,
      correct,
      solved,
      failed: room.state === WIRE_ROOM_STATE.FAILED,
      progress: room.requiredConnections ? room.connected.size / room.requiredConnections : 1,
      attemptsRemaining: Math.max(0, room.maxAttempts - room.attempts),
      room,
    };
  };

  RunnerScene.prototype.useWireRepairHint = function (room) {
    if (!room || room.state !== WIRE_ROOM_STATE.ACTIVE || room.hintsUsed >= room.hintUses) return null;
    const remaining = room.pairs.find(pair => !room.connected.has(pair.id));
    if (!remaining) return null;
    room.hintsUsed += 1;
    return {
      source: remaining.from,
      target: remaining.to,
      text: `Route ${remaining.label} to terminal ${remaining.to}.`,
      remainingHints: Math.max(0, room.hintUses - room.hintsUsed),
    };
  };

  RunnerScene.prototype.resetWireRepairRoom = function (room) {
    if (!room) return;
    room.state = WIRE_ROOM_STATE.ACTIVE;
    room.attempts = 0;
    room.score = 0;
    room.connections = [];
    room.connected = new Set();
    room.mistakes = [];
    room.selectedSource = null;
    room.hintsUsed = 0;
  };

  RunnerScene.prototype.getWireRepairHint = function (room) {
    if (!room || room.state === WIRE_ROOM_STATE.SOLVED) return null;
    const remaining = room.pairs.filter(pair => !room.connected.has(pair.id));
    if (!remaining.length) return null;
    const pair = remaining[0];
    return { source: pair.from, target: pair.to, text: `Route ${pair.label} to terminal ${pair.to}.` };
  };

  RunnerScene.prototype.getWireRepairState = function (room) {
    if (!room) return null;
    return {
      id: room.id,
      title: room.title,
      subtitle: room.subtitle,
      state: room.state,
      difficulty: room.difficulty,
      attempts: room.attempts,
      maxAttempts: room.maxAttempts,
      attemptsRemaining: Math.max(0, room.maxAttempts - room.attempts),
      score: room.score,
      progress: room.requiredConnections ? room.connected.size / room.requiredConnections : 1,
      connections: room.connections.map(connection => ({ ...connection })),
      mistakes: room.mistakes.map(mistake => ({ ...mistake })),
      remaining: room.requiredConnections - room.connected.size,
      selectedSource: room.selectedSource,
      hintUses: room.hintUses,
      hintsUsed: room.hintsUsed,
    };
  };

  RunnerScene.prototype.applyWireRepairToPower = function (room, grid, faultId = null) {
    if (!room || !grid || room.state !== WIRE_ROOM_STATE.SOLVED) return false;
    const resolvedFaultId = faultId || room.faultId;
    if (!resolvedFaultId || typeof this.resolvePowerFault !== 'function') return false;
    return Boolean(this.resolvePowerFault(grid, resolvedFaultId, Number.POSITIVE_INFINITY)?.resolved ?? false);
  };
}

export { installWireRepairRoom, WIRE_ROOM_STATE };
