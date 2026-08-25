import Phaser from 'phaser';
import { loadState, saveState } from '../src/state.js';
import { RELAY_FAQ, LATEST_UPDATE } from '../faq.js';
import titleBackdropUrl from '../assets/title-city-backdrop-v2.png';
import { MenuButton } from '../ui/menu-button.js';

const click = selector => document.querySelector(selector)?.click();
const textStyle = { fontFamily: 'monospace', fontStyle: 'bold', color: '#dce7ee' };

export class TitleScene extends Phaser.Scene {
  constructor() { super('relay-title'); this.buttons = []; this.selectedIndex = 0; this.view = 'main'; this.faqIndex = 0; }

  preload() { this.load.image('relay-title-city', titleBackdropUrl); }

  create() {
    this.backdrop = this.add.image(0, 0, 'relay-title-city').setOrigin(0.5);
    this.shade = this.add.graphics(); this.scan = this.add.graphics();
    this.buildBrand(); this.buildMainMenu(); this.panel = this.add.container(); this.panel.setVisible(false);
    this.footer = this.add.text(0, 0, 'ARROWS + ENTER / TAP', { ...textStyle, fontSize: '7px', color: '#86a6bb', letterSpacing: 2 }).setOrigin(0.5);
    this.scale.on('resize', this.layout, this); this.input.keyboard?.on('keydown', this.onKeyDown, this);
    this.events.once('shutdown', () => { this.scale.off('resize', this.layout, this); this.input.keyboard?.off('keydown', this.onKeyDown, this); });
    document.body.classList.add('phaser-title-active'); this.layout(); this.selectButton(0);
  }

  buildBrand() {
    const style = { fontFamily: 'Arial, sans-serif', fontStyle: 'bold', stroke: '#02060d', shadow: { offsetX: 0, offsetY: 8, color: '#000000', blur: 20, fill: true } };
    this.logo = this.add.text(0, 0, 'RELAY', { ...style, fontSize: 86, color: '#f5f8fb', strokeThickness: 8 }).setOrigin(0.5, 1);
    this.logoAccent = this.add.text(0, 0, 'RUNNER', { ...style, fontSize: 80, color: '#8df4ff', strokeThickness: 7 }).setOrigin(0.5, 0);
    this.tag = this.add.text(0, 0, 'CARRY THE SIGNAL. OUTRUN THE NIGHT.', { ...textStyle, fontSize: '10px', color: '#a8c6d7', letterSpacing: 2.8 }).setOrigin(0.5);
  }

  makeButton(label, detail, callback) {
    const button = new MenuButton(this, { label, detail, onActivate: callback });
    button.on('pointerover', () => this.selectButton(this.buttons.indexOf(button))); return button;
  }

  buildMainMenu() {
    this.menu = this.add.container();
    [['PLAY', 'START RUN', () => { click('#start'); this.close(); }], ['OPTIONS', 'GAME SETTINGS', () => this.showPanel('options')], ['UPDATE', 'LATEST BUILD NOTES', () => this.showPanel('update')], ['INFO', 'FIELD GUIDE / FAQ', () => this.showPanel('info')], ['EXIT', 'CLOSE SESSION', () => this.exit()]].forEach(([label, detail, action]) => {
      const button = this.makeButton(label, detail, action); this.buttons.push(button); this.menu.add(button);
    });
    this.status = this.add.text(0, 0, 'RELAY NETWORK ONLINE', { ...textStyle, fontSize: '8px', color: '#8bc7df', letterSpacing: 1.8 }).setOrigin(0.5);
  }

  exit() {
    this.showPanel('exit');
  }

  showPanel(view) {
    this.view = view; this.menu.setVisible(false); this.status.setVisible(false); this.panel.removeAll(true); this.panelTitle = undefined; this.panelHeading = undefined; this.panelCopy = undefined; this.panel.setVisible(true); this.buttons = [];
    const state = loadState();
    const add = (label, detail, action) => { const button = this.makeButton(label, detail, action); this.buttons.push(button); this.panel.add(button); };
    if (view === 'options') {
      this.panelTitle = this.add.text(0, 0, 'OPTIONS', { ...textStyle, fontSize: '28px', color: '#f4f8fb', letterSpacing: 2 }).setOrigin(0.5); this.panel.add(this.panelTitle);
      add(`MUSIC  ${state.muted ? 'OFF' : 'ON'}`, 'TOGGLE MASTER AUDIO', () => this.toggle('muted', !state.muted));
      add(`RAIN  ${state.rain === false ? 'OFF' : 'ON'}`, 'ATMOSPHERIC WEATHER', () => this.toggle('rain', state.rain === false));
      add(`MOTION  ${state.reducedMotion ? 'REDUCED' : 'FULL'}`, 'CAMERA + UI MOTION', () => this.toggle('reducedMotion', !state.reducedMotion));
      add('FULLSCREEN', 'EXPAND THE GAME VIEW', () => document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.().catch(() => {}));
      add('BACK', 'RETURN TO TITLE', () => this.showMain());
    } else if (view === 'update') {
      this.panelTitle = this.add.text(0, 0, LATEST_UPDATE.version, { ...textStyle, fontSize: '17px', color: '#8df4ff', letterSpacing: 1.4 }).setOrigin(0.5); this.panel.add(this.panelTitle);
      this.addPanelCopy(LATEST_UPDATE.title, LATEST_UPDATE.items.slice(0, 4).map(item => `• ${item}`).join('\n\n'));
      add('BACK', 'RETURN TO TITLE', () => this.showMain());
    } else if (view === 'info') {
      const item = RELAY_FAQ[this.faqIndex];
      this.panelTitle = this.add.text(0, 0, 'FIELD GUIDE', { ...textStyle, fontSize: '20px', color: '#8df4ff', letterSpacing: 2 }).setOrigin(0.5); this.panel.add(this.panelTitle);
      this.addPanelCopy(item[0], item[1]);
      add('NEXT', 'NEXT GUIDE ENTRY', () => { this.faqIndex = (this.faqIndex + 1) % RELAY_FAQ.length; this.showPanel('info'); });
      add('BACK', 'RETURN TO TITLE', () => this.showMain());
    } else {
      this.panelTitle = this.add.text(0, 0, 'SESSION CLOSED', { ...textStyle, fontSize: '22px', color: '#f4f8fb', letterSpacing: 2 }).setOrigin(0.5); this.panel.add(this.panelTitle);
      this.addPanelCopy('THANKS FOR RUNNING', 'The relay is offline. You can safely close this tab, or return to the title screen.');
      add('RETURN', 'RETURN TO TITLE', () => this.showMain());
    }
    this.layout(); this.selectButton(0);
  }

  addPanelCopy(heading, body) {
    this.panelHeading = this.add.text(0, 0, heading, { ...textStyle, fontSize: '16px', color: '#f4f8fb', align: 'center', wordWrap: { width: 520 } }).setOrigin(0.5); this.panel.add(this.panelHeading);
    this.panelCopy = this.add.text(0, 0, body, { ...textStyle, fontSize: '11px', color: '#b7c8d4', align: 'center', lineSpacing: 6, wordWrap: { width: 540 } }).setOrigin(0.5, 0); this.panel.add(this.panelCopy);
  }

  toggle(key, value) { saveState({ ...loadState(), [key]: value }); window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value } })); this.showPanel('options'); }

  showMain() { this.view = 'main'; this.panel.removeAll(true); this.panelTitle = undefined; this.panelHeading = undefined; this.panelCopy = undefined; this.panel.setVisible(false); this.menu.setVisible(true); this.status.setVisible(true); this.buttons = this.menu.list; this.layout(); this.selectButton(0); }

  onKeyDown(event) {
    if (['ArrowDown', 's', 'S'].includes(event.key)) { event.preventDefault(); this.selectButton(this.selectedIndex + 1); }
    else if (['ArrowUp', 'w', 'W'].includes(event.key)) { event.preventDefault(); this.selectButton(this.selectedIndex - 1); }
    else if (['Enter', ' '].includes(event.key)) { event.preventDefault(); this.buttons[this.selectedIndex]?.activate(); }
    else if (event.key === 'Escape' && this.view !== 'main') this.showMain();
  }

  selectButton(index) { if (!this.buttons.length) return; this.selectedIndex = Phaser.Math.Wrap(index, 0, this.buttons.length); this.buttons.forEach((button, buttonIndex) => button.setFocused(buttonIndex === this.selectedIndex)); }

  layout() {
    const w = this.scale.width || window.innerWidth; const h = this.scale.height || window.innerHeight; const portrait = h > w; const phone = Math.min(w, h) < 700; const compact = !portrait && h < 560; const x = w / 2;
    const imageScale = Math.max(w / this.backdrop.width, h / this.backdrop.height); this.backdrop.setPosition(x, h / 2).setScale(imageScale);
    this.shade.clear().fillStyle(0x02060d, 0.42).fillRect(0, 0, w, h).fillStyle(0x02060d, 0.7).fillRect(w * 0.18, 0, w * 0.64, h);
    const titleScale = portrait ? (phone ? .52 : .7) : (compact ? .5 : 1); const titleY = compact ? 52 : portrait ? 90 : 105;
    this.logo.setPosition(x, titleY).setScale(titleScale); this.logoAccent.setPosition(x, titleY).setScale(titleScale); this.tag.setPosition(x, titleY + (compact ? 36 : portrait ? 58 : 76)).setScale(phone ? .75 : 1);
    const scale = Math.min(1, (w - 38) / 350); const rowGap = compact ? 46 : portrait && phone ? 54 : 62;
    if (this.view === 'main') {
      const menuY = Phaser.Math.Clamp(compact ? h * .35 : portrait ? h * .34 : h * .36, titleY + 60, h - rowGap * 5 - 48); this.menu.setPosition(x, menuY);
      this.menu.list.forEach((button, index) => button.setPosition(0, index * rowGap).setScale(scale)); this.status.setPosition(x, Math.min(h - 28, menuY + rowGap * 5 + 4));
    } else {
      const panelY = compact ? 80 : portrait ? 150 : 145; this.panel.setPosition(x, panelY); this.panelTitle?.setPosition(0, 0).setScale(phone ? .88 : 1);
      if (this.panelHeading) this.panelHeading.setPosition(0, 48).setScale(phone ? .88 : 1); if (this.panelCopy) this.panelCopy.setPosition(0, 78).setScale(phone ? .83 : 1);
      const startY = this.panelCopy ? Math.min(h * .53, compact ? 140 : portrait ? h * .49 : 250) : 55; this.buttons.forEach((button, index) => button.setPosition(0, startY + index * rowGap).setScale(scale));
    }
    this.footer.setPosition(x, h - 14).setVisible(!compact);
  }

  update(time) { const h = this.scale.height || window.innerHeight; this.scan.clear().fillStyle(0x8df4ff, .045).fillRect(0, ((time * .022) % (h + 180)) - 90, this.scale.width || window.innerWidth, 28); }

  close() { this.cameras.main.fadeOut(240, 2, 6, 13); this.time.delayedCall(260, () => { document.body.classList.remove('phaser-title-active'); window.__relayTitleGame?.destroy(true); document.getElementById('phaserTitleRoot')?.remove(); }); }
}
