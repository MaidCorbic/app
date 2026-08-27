const WIRE_ROOM_STATE = Object.freeze({ IDLE: 'idle', ACTIVE: 'active', SOLVED: 'solved', FAILED: 'failed' });

function dedupe(values = []) {
  return [...new Set(values.map(Number).filter(Number.isFinite))];
}

function installWireRepairRoom(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__wireRepairRoomV1) return;
  RunnerScene.prototype.__wireRepairRoomV1 = true;

  RunnerScene.prototype.createWireRepairRoom = function (config = {}) {
    const pairs = Array.isArray(config.pairs) && config.pairs.length
      ? config.pairs.map((pair, index) => ({
          id: pair.id ?? index + 1,
          from: Number(pair.from),
          to: Number(pair.to),
          color: pair.color || null,
        }))
      : [
          { id: 1, from: 1, to: 4, color: 'red' },
          { id: 2, from: 2, to: 6, color: 'blue' },
          { id: 3, from: 3, to: 5, color: 'yellow' },
        ];

    const room = {
      id: config.id || `wire-room-${Date.now()}`,
      title: config.title || 'POWER CONTROL ROOM',
      state: WIRE_ROOM_STATE.IDLE,
      maxAttempts: Math.max(1, Number(config.maxAttempts ?? 3)),
      attempts: 0,
      connections: [],
      connected: new Set(),
      pairs,
      mistakes: [],
      requiredConnections: pairs.length,
      onComplete: typeof config.onComplete === 'function' ? config.onComplete : null,
      onFail: typeof config.onFail === 'function' ? config.onFail : null,
      onStateChange: typeof config.onStateChange === 'function' ? config.onStateChange : null,
    };

    return room;
  };

  RunnerScene.prototype.openWireRepairRoom = function (room) {
    if (!room || room.state === WIRE_ROOM_STATE.SOLVED) return false;
    const previous = room.state;
    room.state = WIRE_ROOM_STATE.ACTIVE;
    if (previous !== room.state) room.onStateChange?.(room.state, previous, room, this);
    return true;
  };

  RunnerScene.prototype.connectWire = function (room, from, to) {
    if (!room || room.state !== WIRE_ROOM_STATE.ACTIVE) return { changed: false, correct: false, solved: false, reason: 'inactive' };

    const source = Number(from);
    const target = Number(to);
    const expected = room.pairs.find(pair => pair.from === source);
    const existing = room.connections.some(pair => pair.from === source || pair.to === target);
    if (!expected || existing) return { changed: false, correct: false, solved: false, reason: 'invalid-connection' };

    room.attempts += 1;
    const correct = expected.to === target;
    if (correct) {
      const id = expected.id;
      if (!room.connected.has(id)) {
        room.connected.add(id);
        room.connections.push({ id, from: source, to: target });
      }
    } else {
      room.mistakes.push({ from: source, to: target, attempt: room.attempts });
    }

    const solved = room.connected.size === room.requiredConnections;
    if (solved) {
      room.state = WIRE_ROOM_STATE.SOLVED;
      room.onStateChange?.(room.state, WIRE_ROOM_STATE.ACTIVE, room, this);
      room.onComplete?.(room, this);
    } else if (!correct && room.attempts >= room.maxAttempts) {
      room.state = WIRE_ROOM_STATE.FAILED;
      room.onStateChange?.(room.state, WIRE_ROOM_STATE.ACTIVE, room, this);
      room.onFail?.(room, this);
    }

    return { changed: true, correct, solved, failed: room.state === WIRE_ROOM_STATE.FAILED, progress: room.connected.size / room.requiredConnections, room };
  };

  RunnerScene.prototype.resetWireRepairRoom = function (room) {
    if (!room) return;
    room.state = WIRE_ROOM_STATE.ACTIVE;
    room.attempts = 0;
    room.connections = [];
    room.connected = new Set();
    room.mistakes = [];
  };

  RunnerScene.prototype.getWireRepairHint = function (room) {
    if (!room || room.state === WIRE_ROOM_STATE.SOLVED) return null;
    const remaining = room.pairs.filter(pair => !room.connected.has(pair.id));
    if (!remaining.length) return null;
    const pair = remaining[0];
    return { source: pair.from, target: pair.to, text: `Route terminal ${pair.from} to ${pair.to}.` };
  };

  RunnerScene.prototype.getWireRepairState = function (room) {
    if (!room) return null;
    return {
      id: room.id,
      title: room.title,
      state: room.state,
      attempts: room.attempts,
      maxAttempts: room.maxAttempts,
      progress: room.requiredConnections ? room.connected.size / room.requiredConnections : 1,
      connections: room.connections.map(connection => ({ ...connection })),
      mistakes: room.mistakes.map(mistake => ({ ...mistake })),
      remaining: room.requiredConnections - room.connected.size,
    };
  };

  RunnerScene.prototype.applyWireRepairToPower = function (room, grid, sectorId) {
    if (!room || !grid || room.state !== WIRE_ROOM_STATE.SOLVED || !sectorId) return false;
    return Boolean(this.resolvePowerFault?.(grid, sectorId, Number.POSITIVE_INFINITY)?.resolved ?? false);
  };
}

export { installWireRepairRoom, WIRE_ROOM_STATE };
