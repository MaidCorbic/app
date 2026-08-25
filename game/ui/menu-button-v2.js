import Phaser from 'phaser';

export class MenuButton extends Phaser.GameObjects.Container {
  constructor(scene, { label, detail, onActivate, audio }) {
    super(scene, 0, 0);
    this.onActivate = onActivate;
    this.audio = audio;
    this.focused = false;
    this.glow = scene.add.rectangle(0, 0, 320, 56, 0x19c8f5, 0).setStrokeStyle(1, 0x6aa6bf, 0.42);
    this.fill = scene.add.rectangle(0, 0, 320, 56, 0x07131f, 0.92);
    this.inner = scene.add.rectangle(0, 0, 310, 46, 0x0a1b29, 0.3).setStrokeStyle(1, 0x24465a, 0.4);
    this.accent = scene.add.rectangle(-158, 0, 4, 56, 0x19c8f5, 0.85);
    this.sweep = scene.add.rectangle(-190, 0, 28, 42, 0x8df4ff, 0.12).setVisible(false);
    this.label = scene.add.text(0, -7, label, { fontFamily: 'monospace', fontSize: '17px', fontStyle: 'bold', color: '#dce7ee', letterSpacing: 2 }).setOrigin(0.5);
    this.detail = scene.add.text(0, 15, detail, { fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#557088', letterSpacing: 1.1 }).setOrigin(0.5);
    this.marker = scene.add.text(-134, -7, '›', { fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color: '#557088' }).setOrigin(0.5);
    this.add([this.glow, this.fill, this.inner, this.accent, this.sweep, this.label, this.detail, this.marker]);
    this.setSize(320, 56).setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.setFocused(true, true));
    this.on('pointerout', () => this.setFocused(false, false));
    this.on('pointerdown', () => this.activate());
    scene.add.existing(this);
  }

  setFocused(focused, playSound = false) {
    this.focused = focused;
    this.fill.setFillStyle(focused ? 0x0c2639 : 0x07131f, focused ? 0.98 : 0.92);
    this.inner.setStrokeStyle(1, focused ? 0x3e829a : 0x24465a, focused ? 0.8 : 0.4);
    this.glow.setStrokeStyle(focused ? 1.8 : 1, focused ? 0x8df4ff : 0x6aa6bf, focused ? 1 : 0.42);
    this.accent.setFillStyle(focused ? 0x8df4ff : 0x19c8f5, focused ? 1 : 0.85);
    this.label.setColor(focused ? '#f6feff' : '#dce7ee').setScale(focused ? 1.035 : 1);
    this.detail.setColor(focused ? '#8df4ff' : '#557088');
    this.marker.setColor(focused ? '#8df4ff' : '#557088').setX(focused ? -130 : -134);
    if (focused && playSound) this.audio?.hover?.();
    if (focused) {
      this.sweep.setVisible(true).x = -188;
      this.scene.tweens.killTweensOf(this.sweep);
      this.scene.tweens.add({ targets: this.sweep, x: 188, duration: 260, ease: 'Cubic.easeOut', onComplete: () => this.sweep.setVisible(false) });
    } else {
      this.sweep.setVisible(false);
    }
  }

  activate() {
    this.audio?.select?.();
    this.scene.cameras.main.flash(90, 141, 244, 255, false, null, this.scene);
    this.scene.tweens.add({ targets: this, scaleX: this.scaleX * 0.975, scaleY: this.scaleY * 0.975, yoyo: true, duration: 70 });
    this.onActivate?.();
  }
}
