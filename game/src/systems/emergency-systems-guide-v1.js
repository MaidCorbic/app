const EMERGENCY_FEATURES = Object.freeze([
  { id: 'fire-water', title: 'FIRE + WATER', icon: '🔥', details: 'Find the water source, apply enough water, and clear the burning route.' },
  { id: 'power-failure', title: 'POWER FAILURE', icon: '⚡', details: 'Blackouts disable sectors. Follow the active repair objective to restore power.' },
  { id: 'flashlight', title: 'FLASHLIGHT', icon: '🔦', details: 'Use the flashlight in dark sectors. Battery drains while the beam is active.' },
  { id: 'wire-repair', title: 'WIRE REPAIR', icon: '🔌', details: 'Select a source terminal, then its matching target. Correct links repair the power fault.' },
  { id: 'safe-room', title: 'SAFE ROOM', icon: '🛡️', details: 'Enter a powered safe room to block enemy pressure and recover health.' },
]);

function installEmergencySystemsGuide(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__emergencySystemsGuideV1) return;
  RunnerScene.prototype.__emergencySystemsGuideV1 = true;

  const originalCreate = RunnerScene.prototype.create;
  if (typeof originalCreate === 'function' && !originalCreate.__emergencySystemsGuideWrapped) {
    const wrappedCreate = function (...args) {
      const result = originalCreate.apply(this, args);
      this.time?.delayedCall?.(0, () => this.installEmergencySystemsGuideButton?.());
      return result;
    };
    wrappedCreate.__emergencySystemsGuideWrapped = true;
    RunnerScene.prototype.create = wrappedCreate;
  }

  RunnerScene.prototype.openEmergencySystemsGuide = function () {
    this.closeEmergencySystemsGuide?.();
    const w = this.scale?.width || 960;
    const h = this.scale?.height || 540;
    const pw = Math.min(720, w - 24);
    const ph = Math.min(500, h - 24);
    const root = this.add?.container(w / 2, h / 2);
    if (!root) return null;
    root.setDepth?.(12000);

    const shade = this.add.rectangle(0, 0, w, h, 0x03070d, 0.9);
    const panel = this.add.rectangle(0, 0, pw, ph, 0x0b1622, 0.98);
    panel.setStrokeStyle?.(2, 0x55dfff, 0.9);
    root.add([shade, panel]);

    const title = this.add.text(-pw / 2 + 18, -ph / 2 + 16, 'GAMEPLAY SYSTEMS', {
      fontFamily: 'Arial', fontSize: w < 560 ? '18px' : '22px', color: '#e8f4ff', fontStyle: 'bold'
    });
    const subtitle = this.add.text(-pw / 2 + 18, -ph / 2 + 46, 'Tap a system for an explanation.', {
      fontFamily: 'Arial', fontSize: '11px', color: '#7893a8'
    });
    root.add([title, subtitle]);

    const close = this.add.text(pw / 2 - 22, -ph / 2 + 18, '✕', {
      fontFamily: 'Arial', fontSize: '20px', color: '#e8f4ff'
    }).setOrigin?.(0.5);
    close.setInteractive?.({ useHandCursor: true });
    close.on?.('pointerdown', () => this.closeEmergencySystemsGuide?.());
    root.add(close);

    const cw = pw - 28;
    const cardH = Math.max(58, Math.min(72, (ph - 92) / EMERGENCY_FEATURES.length));
    const firstY = -ph / 2 + 84;

    EMERGENCY_FEATURES.forEach((feature, index) => {
      const y = firstY + index * (cardH + 6);
      const card = this.add.rectangle(0, y, cw, cardH, 0x101f2d, 0.98);
      card.setStrokeStyle?.(1, 0x29485e, 1);
      card.setInteractive?.({ useHandCursor: true });
      const label = this.add.text(-cw / 2 + 16, y, `${feature.icon}  ${feature.title}`, {
        fontFamily: 'Arial', fontSize: w < 560 ? '11px' : '13px', color: '#e8f4ff', fontStyle: 'bold'
      }).setOrigin?.(0, 0.5);
      const action = this.add.text(cw / 2 - 16, y, 'INFO', {
        fontFamily: 'Arial', fontSize: '10px', color: '#55dfff', fontStyle: 'bold'
      }).setOrigin?.(1, 0.5);
      root.add([card, label, action]);

      const show = () => {
        this.__emergencyGuideDetail?.destroy?.(true);
        const dh = Math.min(124, ph - 86);
        const detail = this.add.container(0, ph / 2 - dh / 2 - 10);
        const bg = this.add.rectangle(0, 0, cw, dh, 0x071019, 0.99);
        bg.setStrokeStyle?.(2, 0x48e08a, 0.88);
        const text = this.add.text(-cw / 2 + 16, -dh / 2 + 14, `${feature.icon} ${feature.title}\n\n${feature.details}`, {
          fontFamily: 'Arial', fontSize: w < 560 ? '10px' : '12px', color: '#e8f4ff',
          wordWrap: { width: cw - 32 }
        });
        detail.add([bg, text]);
        root.add(detail);
        this.__emergencyGuideDetail = detail;
      };
      card.on?.('pointerdown', show);
      action.setInteractive?.({ useHandCursor: true });
      action.on?.('pointerdown', show);
    });

    this.__emergencySystemsGuideRoot = root;
    return root;
  };

  RunnerScene.prototype.closeEmergencySystemsGuide = function () {
    this.__emergencyGuideDetail?.destroy?.(true);
    this.__emergencySystemsGuideRoot?.destroy?.(true);
    this.__emergencyGuideDetail = null;
    this.__emergencySystemsGuideRoot = null;
  };

  RunnerScene.prototype.installEmergencySystemsGuideButton = function () {
    if (this.__emergencySystemsGuideButton || !this.add) return null;
    const width = this.scale?.width || 960;
    const button = this.add.container(width / 2, 26);
    button.setDepth?.(11000);
    const bg = this.add.rectangle(0, 0, Math.min(170, width - 24), 34, 0x0b1622, 0.97);
    bg.setStrokeStyle?.(1, 0x55dfff, 0.85);
    bg.setInteractive?.({ useHandCursor: true });
    const label = this.add.text(0, 0, '⚙ SYSTEMS', {
      fontFamily: 'Arial', fontSize: '12px', color: '#e8f4ff', fontStyle: 'bold'
    }).setOrigin?.(0.5);
    button.add([bg, label]);
    bg.on?.('pointerdown', () => this.openEmergencySystemsGuide?.());
    this.__emergencySystemsGuideButton = button;
    this.scale?.on?.('resize', () => button.setX?.((this.scale?.width || 960) / 2));
    return button;
  };
}

export { installEmergencySystemsGuide, EMERGENCY_FEATURES };
