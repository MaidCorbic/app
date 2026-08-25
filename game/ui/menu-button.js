import Phaser from 'phaser';

/** A consistent interactive button for title and future Phaser menu scenes. */
export class MenuButton extends Phaser.GameObjects.Container {
  constructor(scene, { label, detail, onActivate }) {
    super(scene, 0, 0);
    this.onActivate = onActivate;
    this.glow = scene.add.rectangle(0, 0, 320, 56, 0x19c8f5, 0).setStrokeStyle(1, 0x6aa6bf, 0.45);
    this.fill = scene.add.rectangle(0, 0, 320, 56, 0x07131f, 0.92);
    this.accent = scene.add.rectangle(-158, 0, 4, 56, 0x19c8f5, 0.85);
    this.label = scene.add.text(0, -7, label, { fontFamily: 'monospace', fontSize: '17px', fontStyle: 'bold', color: '#dce7ee', letterSpacing: 2 }).setOrigin(0.5);
    this.detail = scene.add.text(0, 15, detail, { fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#557088', letterSpacing: 1.1 }).setOrigin(0.5);
    this.add([this.glow, this.fill, this.accent, this.label, this.detail]);
    this.setSize(320, 56).setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.setFocused(true));
    this.on('pointerout', () => this.setFocused(false));
    this.on('pointerdown', () => this.activate());
    scene.add.existing(this);
  }

  setFocused(focused) {
    this.fill.setFillStyle(focused ? 0x0b2334 : 0x07131f, focused ? 0.99 : 0.92);
    this.glow.setStrokeStyle(focused ? 1.8 : 1, focused ? 0x8df4ff : 0x6aa6bf, focused ? 1 : 0.45);
    this.accent.setFillStyle(focused ? 0x8df4ff : 0x19c8f5, focused ? 1 : 0.85);
    this.label.setColor(focused ? '#f6feff' : '#dce7ee').setScale(focused ? 1.035 : 1);
    this.detail.setColor(focused ? '#8df4ff' : '#557088');
  }

  activate() {
    this.scene.cameras.main.flash(90, 141, 244, 255, false, null, this.scene);
    this.scene.tweens.add({ targets: this, scaleX: this.scaleX * 0.975, scaleY: this.scaleY * 0.975, yoyo: true, duration: 70 });
    this.onActivate?.();
  }
}
