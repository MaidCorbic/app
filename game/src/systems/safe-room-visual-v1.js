const SAFE_ROOM_VISUALS = Object.freeze({
  active: 0x48e08a,
  locked: 0xffb84d,
  disabled: 0xff5f66,
  panel: 0x08121b,
  line: 0x55d8ff,
  text: '#e8f4ff',
  muted: '#7d94a7',
});

function installSafeRoomVisual(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__safeRoomVisualV1) return;
  RunnerScene.prototype.__safeRoomVisualV1 = true;

  RunnerScene.prototype.createSafeRoomMarker = function (room, config = {}) {
    if (!room || !this.add) return null;
    const radius = Math.max(16, Number(room.radius ?? 96));
    const zone = this.add.circle(room.x, room.y, radius, SAFE_ROOM_VISUALS.panel, 0.16);
    zone.setStrokeStyle?.(2, SAFE_ROOM_VISUALS.line, 0.8);
    zone.setDepth?.((config.depth ?? 20));
    room.__visualZone = zone;

    const label = this.add.text(room.x, room.y - radius - 18, room.name || 'SAFE ROOM', {
      fontFamily: 'Arial', fontSize: '13px', color: SAFE_ROOM_VISUALS.text, fontStyle: 'bold',
    }).setOrigin?.(0.5, 1);
    label.setDepth?.((config.depth ?? 20) + 1);
    room.__visualLabel = label;
    this.updateSafeRoomVisual?.(room);
    return { zone, label };
  };

  RunnerScene.prototype.updateSafeRoomVisual = function (room) {
    if (!room) return null;
    const color = room.state === 'available' || room.state === 'occupied'
      ? SAFE_ROOM_VISUALS.active
      : room.state === 'locked'
        ? SAFE_ROOM_VISUALS.locked
        : SAFE_ROOM_VISUALS.disabled;
    room.__visualZone?.setStrokeStyle?.(room.state === 'occupied' ? 3 : 2, color, room.state === 'disabled' ? 0.55 : 0.9);
    room.__visualLabel?.setText?.(room.state === 'occupied' ? `${room.name} • SAFE` : room.name);
    return color;
  };

  RunnerScene.prototype.destroySafeRoomMarker = function (room) {
    if (!room) return;
    room.__visualZone?.destroy?.();
    room.__visualLabel?.destroy?.();
    delete room.__visualZone;
    delete room.__visualLabel;
  };

  RunnerScene.prototype.openSafeRoomStatus = function (room) {
    if (!room || !this.add) return null;
    this.closeSafeRoomStatus?.();
    const width = this.scale?.width || 960;
    const height = this.scale?.height || 540;
    const root = this.add.container(width / 2, height / 2).setDepth?.(12000);
    if (!root) return null;

    const panel = this.add.rectangle(0, 0, Math.min(420, width - 28), 210, SAFE_ROOM_VISUALS.panel, 0.98);
    panel.setStrokeStyle?.(2, SAFE_ROOM_VISUALS.line, 0.9);
    const title = this.add.text(0, -74, room.name || 'SAFE ROOM', { fontFamily: 'Arial', fontSize: '22px', color: SAFE_ROOM_VISUALS.text, fontStyle: 'bold' }).setOrigin?.(0.5);
    const status = this.add.text(0, -28, '', { fontFamily: 'Arial', fontSize: '14px', color: SAFE_ROOM_VISUALS.text }).setOrigin?.(0.5);
    const info = this.add.text(0, 12, '', { fontFamily: 'Arial', fontSize: '12px', color: SAFE_ROOM_VISUALS.muted, align: 'center' }).setOrigin?.(0.5);
    const close = this.add.text(0, 68, 'CLOSE', { fontFamily: 'Arial', fontSize: '13px', color: SAFE_ROOM_VISUALS.line, fontStyle: 'bold' }).setOrigin?.(0.5);
    close.setInteractive?.({ useHandCursor: true });
    close.on?.('pointerdown', () => this.closeSafeRoomStatus?.());

    root.add([panel, title, status, info, close]);
    this.__safeRoomStatus = { root, room, status, info };
    this.__refreshSafeRoomStatus = () => {
      const state = this.getSafeRoomState?.(room);
      if (!state) return;
      status.setText?.(`${String(state.state).toUpperCase()} • ${state.powered ? 'POWERED' : 'NO POWER'}`);
      info.setText?.(state.state === 'occupied' ? 'ENEMIES CANNOT ENTER • HEALING ACTIVE' : state.state === 'locked' ? 'ROOM LOCKED' : state.state === 'disabled' ? 'POWER REQUIRED' : 'SAFE ZONE AVAILABLE');
    };
    this.__refreshSafeRoomStatus();
    return root;
  };

  RunnerScene.prototype.closeSafeRoomStatus = function () {
    this.__safeRoomStatus?.root?.destroy?.(true);
    this.__safeRoomStatus = null;
    this.__refreshSafeRoomStatus = null;
  };
}

export { installSafeRoomVisual };
