const ROOM_COLORS = Object.freeze({ bg: 0x071019, panel: 0x0d1c29, line: 0x4fd1ff, good: 0x48e08a, bad: 0xff5f66, text: 0xe8f4ff, muted: 0x7893a8 });

function installWireRepairRoomVisual(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__wireRepairRoomVisualV1) return;
  RunnerScene.prototype.__wireRepairRoomVisualV1 = true;

  RunnerScene.prototype.openWireRepairOverlay = function (room, config = {}) {
    if (!room || room.state === 'solved') return null;
    this.closeWireRepairOverlay?.();

    const width = this.scale?.width || 960;
    const height = this.scale?.height || 540;
    const root = this.add?.container(width / 2, height / 2);
    if (!root) return null;
    root.setDepth?.(10000);

    const backdrop = this.add.rectangle(0, 0, width, height, ROOM_COLORS.bg, 0.94);
    const panel = this.add.rectangle(0, 0, Math.min(760, width - 32), Math.min(500, height - 32), ROOM_COLORS.panel, 0.98);
    panel.setStrokeStyle?.(2, ROOM_COLORS.line, 0.9);
    root.add([backdrop, panel]);

    const title = this.add.text(-panel.width * 0.42, -panel.height * 0.42, room.title || 'POWER CONTROL ROOM', { fontFamily: 'Arial', fontSize: '22px', color: '#e8f4ff', fontStyle: 'bold' });
    const subtitle = this.add.text(-panel.width * 0.42, -panel.height * 0.33, 'CONNECT MATCHING TERMINALS', { fontFamily: 'Arial', fontSize: '12px', color: '#7893a8' });
    root.add([title, subtitle]);

    const leftX = -panel.width * 0.25;
    const rightX = panel.width * 0.25;
    const startY = -panel.height * 0.18;
    const gap = Math.max(54, Math.min(82, panel.height / Math.max(4, room.pairs.length + 1)));
    const nodes = new Map();
    const lines = this.add.graphics();
    root.add(lines);

    const makeNode = (x, y, value, label, side) => {
      const circle = this.add.circle(x, y, 18, ROOM_COLORS.panel, 1);
      circle.setStrokeStyle?.(2, ROOM_COLORS.line, 1);
      circle.setInteractive?.({ useHandCursor: true });
      const text = this.add.text(x + (side === 'left' ? -34 : 34), y - 8, label, { fontFamily: 'Arial', fontSize: '14px', color: '#e8f4ff' }).setOrigin?.(side === 'left' ? 1 : 0, 0);
      root.add([circle, text]);
      circle.on?.('pointerdown', () => {
        const selected = this.__wireRepairVisualSelection;
        if (!selected) {
          this.__wireRepairVisualSelection = { side, value, circle };
          circle.setStrokeStyle?.(3, ROOM_COLORS.good, 1);
          return;
        }
        if (selected.side === side) {
          this.__wireRepairVisualSelection?.circle?.setStrokeStyle?.(2, ROOM_COLORS.line, 1);
          this.__wireRepairVisualSelection = null;
          return;
        }
        const from = selected.side === 'left' ? selected.value : value;
        const to = selected.side === 'left' ? value : selected.value;
        const result = this.connectWire?.(room, from, to);
        selected.circle?.setStrokeStyle?.(2, result?.correct ? ROOM_COLORS.good : ROOM_COLORS.bad, 1);
        circle.setStrokeStyle?.(2, result?.correct ? ROOM_COLORS.good : ROOM_COLORS.bad, 1);
        if (result?.correct) {
          lines.lineStyle?.(4, ROOM_COLORS.good, 0.9);
          lines.lineBetween?.(selected.circle.x, selected.circle.y, circle.x, circle.y);
        }
        this.__wireRepairVisualSelection = null;
        this.__refreshWireRepairOverlay?.();
      });
      return circle;
    };

    room.pairs.forEach((pair, index) => {
      nodes.set(`l:${pair.from}`, makeNode(leftX, startY + index * gap, pair.from, `T${pair.from}`, 'left'));
      nodes.set(`r:${pair.to}`, makeNode(rightX, startY + index * gap, pair.to, `T${pair.to}`, 'right'));
    });

    const close = this.add.text(panel.width * 0.42, -panel.height * 0.43, '✕', { fontFamily: 'Arial', fontSize: '22px', color: '#e8f4ff' }).setOrigin?.(0.5);
    close.setInteractive?.({ useHandCursor: true });
    close.on?.('pointerdown', () => this.closeWireRepairOverlay?.());
    root.add(close);

    this.__wireRepairOverlay = { root, room, lines, nodes, panel };
    this.__refreshWireRepairOverlay = () => {
      if (!this.__wireRepairOverlay) return;
      const state = this.getWireRepairState?.(room);
      if (!state) return;
    };

    return root;
  };

  RunnerScene.prototype.closeWireRepairOverlay = function () {
    this.__wireRepairVisualSelection?.circle?.setStrokeStyle?.(2, ROOM_COLORS.line, 1);
    this.__wireRepairVisualSelection = null;
    this.__wireRepairOverlay?.root?.destroy?.(true);
    this.__wireRepairOverlay = null;
    this.__refreshWireRepairOverlay = null;
  };
}

export { installWireRepairRoomVisual };
