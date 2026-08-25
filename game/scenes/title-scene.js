import Phaser from 'phaser';
import { MenuButton } from '../ui/menu-button.js';

const click = selector => document.querySelector(selector)?.click();

export class TitleScene extends Phaser.Scene {
  constructor() { super('relay-title'); this.buttons = []; this.selectedIndex = 0; }

  create() {
    this.buildBackdrop(); this.buildLogo(); this.buildMenu();
    this.footer = this.add.text(0, 0, '2D COMMAND INTERFACE  •  ARROWS + ENTER / TAP', { fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#40596f', letterSpacing: 1.8 }).setOrigin(0.5);
    this.scale.on('resize', this.layout, this);
    this.input.keyboard?.on('keydown', this.onKeyDown, this);
    this.events.once('shutdown', () => { this.scale.off('resize', this.layout, this); this.input.keyboard?.off('keydown', this.onKeyDown, this); });
    document.body.classList.add('phaser-title-active'); this.layout(); this.selectButton(0);
  }

  buildBackdrop() {
    this.bg = this.add.graphics(); this.grid = this.add.graphics(); this.scan = this.add.graphics();
    this.particles = Array.from({ length: 34 }, () => { const dot = this.add.circle(0, 0, Phaser.Math.Between(1, 2), 0x8df4ff, Phaser.Math.FloatBetween(0.06, 0.3)); dot.setData('seed', Phaser.Math.FloatBetween(0, Math.PI * 2)); dot.setData('speed', Phaser.Math.FloatBetween(0.12, 0.42)); return dot; });
  }

  buildLogo() {
    const shared = { fontFamily: 'Arial, sans-serif', fontStyle: 'bold', stroke: '#03101b', shadow: { offsetX: 0, offsetY: 11, color: '#000000', blur: 24, fill: true } };
    this.logo = this.add.text(0, 0, 'RELAY', { ...shared, fontSize: 92, color: '#f4f7fa', strokeThickness: 9 }).setOrigin(0.5, 1);
    this.logoAccent = this.add.text(0, 0, 'RUNNER', { ...shared, fontSize: 86, color: '#8df4ff', strokeThickness: 8 }).setOrigin(0.5, 0);
    this.tag = this.add.text(0, 0, 'CARRY THE SIGNAL. OUTRUN THE NIGHT.', { fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#7f93a8', letterSpacing: 3 }).setOrigin(0.5);
    this.ruleLeft = this.add.rectangle(0, 0, 190, 1, 0x35556e, 0.72).setOrigin(1, 0.5); this.ruleRight = this.add.rectangle(0, 0, 190, 1, 0x35556e, 0.72).setOrigin(0, 0.5);
  }

  buildMenu() {
    this.menu = this.add.container();
    [['PLAY', 'START RUN', () => { click('#start'); this.close(); }], ['OPTIONS', 'SETTINGS / CONTROLS', () => click('[data-title-panel="controls"]')], ['UPDATE', 'LATEST BUILD / CHANGES', () => click('[data-relay-info="update"]')], ['INFO', 'FIELD GUIDE / FAQ', () => click('[data-relay-info="faq"]')], ['EXIT', 'CLOSE SESSION', () => click('#exitTitle')]].forEach(([label, detail, onActivate]) => {
      const button = new MenuButton(this, { label, detail, onActivate }); button.on('pointerover', () => this.selectButton(this.buttons.indexOf(button))); this.buttons.push(button); this.menu.add(button);
    });
    this.status = this.add.text(0, 0, 'SYSTEM ONLINE  //  RELAY NETWORK STABLE', { fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#597389', letterSpacing: 1.5 }).setOrigin(0.5);
  }

  onKeyDown(event) {
    if (['ArrowDown', 's', 'S'].includes(event.key)) { event.preventDefault(); this.selectButton(this.selectedIndex + 1); }
    if (['ArrowUp', 'w', 'W'].includes(event.key)) { event.preventDefault(); this.selectButton(this.selectedIndex - 1); }
    if (['Enter', ' '].includes(event.key)) { event.preventDefault(); this.buttons[this.selectedIndex]?.activate(); }
  }

  selectButton(index) { this.selectedIndex = Phaser.Math.Wrap(index, 0, this.buttons.length); this.buttons.forEach((button, buttonIndex) => button.setFocused(buttonIndex === this.selectedIndex)); }

  layout() {
    const w = this.scale.width || window.innerWidth; const h = this.scale.height || window.innerHeight; const portrait = h > w; const phone = Math.min(w, h) < 700; const compactLandscape = !portrait && h < 560; const centerX = w / 2;
    const safeTop = portrait ? 24 : 16; const scale = portrait ? Math.min(1, (w - 32) / 344) : Math.min(1, (w - 48) / 360);
    this.bg.clear().fillGradientStyle(0x02060d, 0x02060d, 0x071625, 0x01040a, 1).fillRect(0, 0, w, h); this.bg.fillStyle(0x0b6b89, 0.055).fillCircle(centerX, h * 0.34, Math.min(w, h) * 0.42); this.bg.fillStyle(0x19c8f5, 0.035).fillCircle(centerX, h * 0.78, Math.min(w, h) * 0.65);
    this.grid.clear().lineStyle(1, 0x234458, 0.19); const step = phone ? 42 : 58; for (let x = 0; x <= w; x += step) this.grid.lineBetween(x, h * 0.5, x, h); for (let y = h * 0.5; y <= h; y += step) this.grid.lineBetween(0, y, w, y); this.grid.lineStyle(1, 0x8df4ff, 0.1).lineBetween(0, h * 0.5, w, h * 0.5);
    const titleScale = portrait ? (phone ? 0.52 : 0.7) : (compactLandscape ? 0.48 : 1); const titleY = safeTop + (compactLandscape ? 43 : portrait ? 70 : 86); this.logo.setPosition(centerX, titleY).setScale(titleScale); this.logoAccent.setPosition(centerX, titleY).setScale(titleScale);
    const tagY = titleY + (compactLandscape ? 34 : portrait ? 56 : 72); this.tag.setPosition(centerX, tagY).setScale(portrait && phone ? 0.76 : 1); this.ruleLeft.setPosition(centerX - 16, tagY); this.ruleRight.setPosition(centerX + 16, tagY);
    const rowGap = compactLandscape ? 46 : portrait && phone ? 52 : 62; const menuHeight = rowGap * (this.buttons.length - 1) + 56 * scale; const preferredY = compactLandscape ? h * 0.37 : portrait ? h * 0.35 : h * 0.34; const minY = tagY + (compactLandscape ? 40 : 54); const maxY = h - menuHeight - 48;
    this.menu.setPosition(centerX, Phaser.Math.Clamp(preferredY, minY, Math.max(minY, maxY))); this.buttons.forEach((button, index) => button.setPosition(0, index * rowGap).setScale(scale)); this.status.setPosition(centerX, Math.min(h - 33, this.menu.y + rowGap * this.buttons.length + 9)).setScale(portrait && phone ? 0.8 : 1); this.footer.setPosition(centerX, h - (portrait ? 16 : 12)).setVisible(!compactLandscape);
  }

  update(time) { const t = time * 0.001; const w = this.scale.width || window.innerWidth; const h = this.scale.height || window.innerHeight; this.scan.clear().fillStyle(0x8df4ff, 0.028).fillRect(0, ((t * 22) % (h + 160)) - 80, w, 28); this.particles.forEach((dot, index) => { const seed = dot.getData('seed'); const speed = dot.getData('speed'); dot.x = ((index * 97 + t * speed * 28) % (w + 40)) - 20; dot.y = h * 0.18 + ((index * 61 + Math.sin(t * speed + seed) * 35) % Math.max(80, h * 0.78)); }); }

  close() { this.cameras.main.fadeOut(260, 2, 6, 13); this.time.delayedCall(280, () => { document.body.classList.remove('phaser-title-active'); window.__relayTitleGame?.destroy(true); document.getElementById('phaserTitleRoot')?.remove(); }); }
}
