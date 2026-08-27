const SAFE_ROOM_STATE = Object.freeze({ LOCKED: 'locked', AVAILABLE: 'available', OCCUPIED: 'occupied', DISABLED: 'disabled' });

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function installSafeRoom(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__safeRoomV1) return;
  RunnerScene.prototype.__safeRoomV1 = true;

  RunnerScene.prototype.createSafeRoom = function (config = {}) {
    return {
      id: config.id || `safe-room-${Date.now()}`,
      name: config.name || 'SAFE ROOM',
      x: Number(config.x ?? 0),
      y: Number(config.y ?? 0),
      state: config.locked ? SAFE_ROOM_STATE.LOCKED : SAFE_ROOM_STATE.AVAILABLE,
      radius: Math.max(16, Number(config.radius ?? 96)),
      healRate: Math.max(0, Number(config.healRate ?? 8)),
      maxHealth: Math.max(1, Number(config.maxHealth ?? 100)),
      requiresPower: Boolean(config.requiresPower),
      requiredPowerState: config.requiredPowerState || 'on',
      powered: config.powered !== false,
      doorOpen: config.locked ? false : config.doorOpen !== false,
      enemyBlocked: true,
      occupant: null,
      visits: 0,
      unlockedAt: null,
      onEnter: typeof config.onEnter === 'function' ? config.onEnter : null,
      onExit: typeof config.onExit === 'function' ? config.onExit : null,
      onUnlock: typeof config.onUnlock === 'function' ? config.onUnlock : null,
      onStateChange: typeof config.onStateChange === 'function' ? config.onStateChange : null,
    };
  };

  RunnerScene.prototype.setSafeRoomPower = function (room, powered) {
    if (!room) return false;
    room.powered = Boolean(powered);
    if (!room.powered && room.requiresPower) {
      const previous = room.state;
      room.state = SAFE_ROOM_STATE.DISABLED;
      room.doorOpen = false;
      room.occupant = null;
      if (previous !== room.state) room.onStateChange?.(room.state, previous, room, this, { reason: 'power-lost' });
    } else if (room.powered && room.state === SAFE_ROOM_STATE.DISABLED) {
      room.state = SAFE_ROOM_STATE.AVAILABLE;
      room.doorOpen = true;
      room.onStateChange?.(room.state, SAFE_ROOM_STATE.DISABLED, room, this, { reason: 'power-restored' });
    }
    return room.powered;
  };

  RunnerScene.prototype.unlockSafeRoom = function (room) {
    if (!room || room.state === SAFE_ROOM_STATE.DISABLED) return false;
    const previous = room.state;
    room.state = SAFE_ROOM_STATE.AVAILABLE;
    room.doorOpen = true;
    room.unlockedAt = Date.now();
    room.onUnlock?.(room, this);
    room.onStateChange?.(room.state, previous, room, this, { reason: 'unlocked' });
    return true;
  };

  RunnerScene.prototype.canEnterSafeRoom = function (room, playerX, playerY) {
    if (!room || room.state !== SAFE_ROOM_STATE.AVAILABLE || !room.doorOpen) return false;
    if (room.requiresPower && !room.powered) return false;
    const x = Number(playerX ?? this?.player?.x);
    const y = Number(playerY ?? this?.player?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    return Phaser.Math.Distance.Between(x, y, room.x, room.y) <= room.radius;
  };

  RunnerScene.prototype.enterSafeRoom = function (room, player = this.player) {
    if (!room || !player || !this.canEnterSafeRoom?.(room)) return false;
    room.state = SAFE_ROOM_STATE.OCCUPIED;
    room.occupant = player;
    room.visits += 1;
    room.onEnter?.(room, player, this);
    room.onStateChange?.(room.state, SAFE_ROOM_STATE.AVAILABLE, room, this, { reason: 'entered' });
    return true;
  };

  RunnerScene.prototype.exitSafeRoom = function (room) {
    if (!room) return false;
    const previous = room.state;
    const player = room.occupant;
    room.occupant = null;
    room.state = room.doorOpen ? SAFE_ROOM_STATE.AVAILABLE : SAFE_ROOM_STATE.DISABLED;
    room.onExit?.(room, player, this);
    room.onStateChange?.(room.state, previous, room, this, { reason: 'exited' });
    return true;
  };

  RunnerScene.prototype.healInSafeRoom = function (room, player = room?.occupant, deltaMs = 0) {
    if (!room || room.state !== SAFE_ROOM_STATE.OCCUPIED || !player) return { changed: false, health: player?.health ?? 0, maxHealth: room?.maxHealth ?? 0 };
    const maxHealth = Number(player.maxHealth ?? room.maxHealth);
    const health = Number(player.health ?? 0);
    const amount = room.healRate * Math.max(0, Number(deltaMs) || 0) / 1000;
    const nextHealth = clamp(health + amount, 0, maxHealth);
    player.health = nextHealth;
    return { changed: nextHealth !== health, health: nextHealth, maxHealth };
  };

  RunnerScene.prototype.isPlayerProtectedBySafeRoom = function (room, player = this.player) {
    return Boolean(room && room.state === SAFE_ROOM_STATE.OCCUPIED && room.occupant === player && room.enemyBlocked);
  };

  RunnerScene.prototype.getSafeRoomState = function (room) {
    if (!room) return null;
    return {
      id: room.id,
      name: room.name,
      x: room.x,
      y: room.y,
      state: room.state,
      powered: room.powered,
      requiresPower: room.requiresPower,
      doorOpen: room.doorOpen,
      enemyBlocked: room.enemyBlocked,
      occupied: Boolean(room.occupant),
      visits: room.visits,
      radius: room.radius,
      healRate: room.healRate,
      unlockedAt: room.unlockedAt,
    };
  };
}

export { installSafeRoom, SAFE_ROOM_STATE };
