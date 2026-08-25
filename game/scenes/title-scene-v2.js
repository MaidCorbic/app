import Phaser from 'phaser';
import { loadState, saveState } from '../src/state.js';
import { RELAY_FAQ, LATEST_UPDATE } from '../faq.js';
import titleBackdropUrl from '../assets/title-city-backdrop-v2.png';
import { MenuButton } from '../ui/menu-button-v2.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

class TitleAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.started = false;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return true;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.035;
      this.master.connect(this.ctx.destination);
      this.started = true;
      return true;
    } catch {
      this.ctx = null;
      return false;
    }
  }

  tone(frequency, duration = 0.08, type = 'sine', gain = 0.08) {
    if (!this.ensure() || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(gain, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(env).connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  hover() { this.tone(520, 0.045, 'triangle', 0.045); }
  select() {
    this.tone(680, 0.07, 'triangle', 0.065);
    window.setTimeout(() => this.tone(880, 0.11, 'sine', 0.05), 35);
  }
  back() { this.tone(260, 0.09, 'sine', 0.04); }
  launch() {
    if (!this.ensure() || !this.ctx) return;
    const now = this.ctx.currentTime;
    [220, 330, 495].forEach((frequency, index) => {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, now + index * 0.035);
      env.gain.setValueAtTime(0.0001, now + index * 0.035);
      env.gain.exponentialRampToValueAtTime(0.06, now + index * 0.035 + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      osc.connect(env).connect(this.master);
      osc.start(now + index * 0.035);
      osc.stop(now + 0.55);
    });
  }
}

export class TitleSceneV2 extends Phaser.Scene {
  constructor() {
    super('relay-title-v2');
    this.buttons = [];
    this.selectedIndex = 0;
    this.view = 'main';
    this.faqIndex = 0;
    this.audio = new TitleAudio();
    this.reducedMotion = false;
  }

  preload() {
    this.load.image('relay-title-city-v2', titleBackdropUrl);
  }

  create() {
    this.createWorld();
    this.createBrand();
    this.createMainMenu();
    this.createPanels();
    this.createFooter();
    this.scale.on('resize', this.layout, this);
    this.input.keyboard?.on('keydown', this.onKeyDown, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layout, this);
      this.input.keyboard?.off('keydown', this.onKeyDown, this);
      this.audio.ctx?.close?.().catch(() => {});
      document.body.classList.remove('phaser-title-active');
    });
    const state = loadState();
    this.reducedMotion = Boolean(state.reducedMotion);
    document.body.classList.add('phaser-title-active');
    this.layout();
    this.selectButton(0, false);
  }

  createWorld() {
    this.backdropFar = this.add.image(0, 0, 'relay-title-city-v2').setOrigin(0.5).setAlpha(0.78);
    this.backdropNear = this.add.image(0, 0, 'relay-title-city-v2').setOrigin(0.5).setAlpha(0.22);
    this.tone = this.add.graphics();
    this.grid = this.add.graphics();
    this.city = this.add.graphics();
    this.rain = this.add.graphics();
    this.signal = this.add.graphics();
    this.particles = Array.from({ length: 46 }, (_, index) => {
      const dot = this.add.circle(0, 0, Phaser.Math.Between(1, 2), 0x8df4ff, Phaser.Math.FloatBetween(0.08, 0.32));
      dot.setData('seed', Phaser.Math.FloatBetween(0, Math.PI * 2));
      dot.setData('speed', Phaser.Math.FloatBetween(0.08, 0.28));
      dot.setData('index', index);
      return dot;
    });
    this.cityLights = Array.from({ length: 30 }, (_, index) => {
      const light = this.add.rectangle(0, 0, Phaser.Math.Between(2, 5), Phaser.Math.Between(6, 13), 0x8df4ff, Phaser.Math.FloatBetween(0.12, 0.42));
      light.setData('phase', Phaser.Math.FloatBetween(0, Math.PI * 2));
      return light;
    });
    this.relayBeacon = this.add.circle(0, 0, 5, 0x8df4ff, 0.95);
    this.relayRing = this.add.circle(0, 0, 18, 0x19c8f5, 0.04).setStrokeStyle(1, 0x8df4ff, 0.55);
  }

  createBrand() {
    const titleStyle = {
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#02060d',
      shadow: { offsetX: 0, offsetY: 9, color: '#000000', blur: 22, fill: true },
    };
    this.logo = this.add.text(0, 0, 'RELAY', { ...titleStyle, fontSize: 86, color: '#f5f8fb', strokeThickness: 8 }).setOrigin(0.5, 1);
    this.logoAccent = this.add.text(0, 0, 'RUNNER', { ...titleStyle, fontSize: 80, color: '#8df4ff', strokeThickness: 7 }).setOrigin(0.5, 0);
    this.tag = this.add.text(0, 0, 'CARRY THE SIGNAL. OUTRUN THE NIGHT.', {
      fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#a8c6d7', letterSpacing: 2.8,
    }).setOrigin(0.5);
    this.status = this.add.text(0, 0, 'RELAY NETWORK  //  ONLINE  //  NIGHT SHIFT', {
      fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#8bc7df', letterSpacing: 1.7,
    }).setOrigin(0.5);
  }

  makeButton(label, detail, callback) {
    const button = new MenuButton(this, { label, detail, onActivate: callback, audio: this.audio });
    button.on('pointerover', () => {
      const index = this.buttons.indexOf(button);
      if (index >= 0) this.selectButton(index, true);
    });
    return button;
  }

  createMainMenu() {
    this.menu = this.add.container(0, 0);
    [
      ['PLAY', 'START RUN', () => this.launch()],
      ['OPTIONS', 'AUDIO / DISPLAY / MOTION', () => this.showPanel('options')],
      ['UPDATE', 'LATEST BUILD / PATCH NOTES', () => this.showPanel('update')],
      ['INFO', 'FIELD GUIDE / HOW TO PLAY', () => this.showPanel('info')],
      ['EXIT', 'CLOSE SESSION', () => this.showPanel('exit')],
    ].forEach(([label, detail, action]) => {
      const button = this.makeButton(label, detail, action);
      this.buttons.push(button);
      this.menu.add(button);
    });
  }

  createPanels() {
    this.panelDim = this.add.rectangle(0, 0, 20, 20, 0x01040a, 0.68).setOrigin(0).setVisible(false).setInteractive();
    this.panelCard = this.add.graphics().setVisible(false);
    this.panel = this.add.container(0, 0).setVisible(false);
    this.panelTitle = null;
    this.panelHeading = null;
    this.panelCopy = null;
  }

  createFooter() {
    this.footer = this.add.text(0, 0, '↑ ↓ / W S   ENTER / SPACE   ESC BACK   •   2D COMMAND INTERFACE', {
      fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#577187', letterSpacing: 1.4,
    }).setOrigin(0.5);
    this.version = this.add.text(0, 0, 'RELAY RUNNER // TITLE SYSTEM V2', {
      fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#3e586d', letterSpacing: 1.2,
    }).setOrigin(0.5);
  }

  clearPanel() {
    this.panel.removeAll(true);
    this.panelCard.clear();
    this.panelTitle = null;
    this.panelHeading = null;
    this.panelCopy = null;
  }

  showPanel(view) {
    this.audio.select();
    this.view = view;
    this.menu.setVisible(false);
    this.status.setVisible(false);
    this.clearPanel();
    this.panelDim.setVisible(true);
    this.panelCard.setVisible(true);
    this.panel.setVisible(true);
    this.buttons = [];
    const state = loadState();
    const add = (label, detail, action) => {
      const button = this.makeButton(label, detail, action);
      this.buttons.push(button);
      this.panel.add(button);
    };

    if (view === 'options') {
      this.panelTitle = this.add.text(0, 0, 'OPTIONS', { fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: 28, color: '#f4f8fb', letterSpacing: 2 }).setOrigin(0.5);
      this.panel.add(this.panelTitle);
      add(`MUSIC  ${state.muted ? 'OFF' : 'ON'}`, 'MASTER TITLE AUDIO', () => this.toggle('muted', !state.muted));
      add(`RAIN  ${state.rain === false ? 'OFF' : 'ON'}`, 'ATMOSPHERIC WEATHER', () => this.toggle('rain', state.rain === false));
      add(`MOTION  ${state.reducedMotion ? 'REDUCED' : 'FULL'}`, 'PARALLAX + UI ANIMATION', () => this.toggle('reducedMotion', !state.reducedMotion));
      add('FULLSCREEN', document.fullscreenElement ? 'EXIT FULLSCREEN' : 'ENTER FULLSCREEN', () => this.toggleFullscreen());
      add('BACK', 'RETURN TO TITLE', () => this.showMain(true));
    } else if (view === 'update') {
      this.panelTitle = this.add.text(0, 0, LATEST_UPDATE.version, { fontFamily: 'monospace', fontStyle: 'bold', fontSize: '17px', color: '#8df4ff', letterSpacing: 1.4 }).setOrigin(0.5);
      this.panel.add(this.panelTitle);
      this.addPanelCopy(LATEST_UPDATE.title, LATEST_UPDATE.items.slice(0, 6).map(item => `• ${item}`).join('\n\n'));
      add('BACK', 'RETURN TO TITLE', () => this.showMain(true));
    } else if (view === 'info') {
      const item = RELAY_FAQ[this.faqIndex] || RELAY_FAQ[0];
      this.panelTitle = this.add.text(0, 0, 'FIELD GUIDE', { fontFamily: 'monospace', fontStyle: 'bold', fontSize: 20, color: '#8df4ff', letterSpacing: 2 }).setOrigin(0.5);
      this.panel.add(this.panelTitle);
      this.addPanelCopy(item[0], item[1]);
      add('NEXT', 'NEXT GUIDE ENTRY', () => { this.faqIndex = (this.faqIndex + 1) % RELAY_FAQ.length; this.showPanel('info'); });
      add('BACK', 'RETURN TO TITLE', () => this.showMain(true));
    } else {
      this.panelTitle = this.add.text(0, 0, 'SESSION CLOSED', { fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: 22, color: '#f4f8fb', letterSpacing: 2 }).setOrigin(0.5);
      this.panel.add(this.panelTitle);
      this.addPanelCopy('RELAY OFFLINE', 'The network is waiting. Return to the title screen or close this tab.');
      add('RETURN', 'RETURN TO TITLE', () => this.showMain(true));
    }

    this.layout();
    this.selectButton(0, false);
  }

  addPanelCopy(heading, body) {
    this.panelHeading = this.add.text(0, 0, heading, {
      fontFamily: 'monospace', fontStyle: 'bold', fontSize: 15, color: '#f4f8fb', align: 'center', wordWrap: { width: 510 },
    }).setOrigin(0.5);
    this.panel.add(this.panelHeading);
    this.panelCopy = this.add.text(0, 0, body, {
      fontFamily: 'monospace', fontSize: 10, color: '#b7c8d4', align: 'center', lineSpacing: 5, wordWrap: { width: 540 },
    }).setOrigin(0.5, 0);
    this.panel.add(this.panelCopy);
  }

  toggle(key, value) {
    saveState({ ...loadState(), [key]: value });
    this.reducedMotion = key === 'reducedMotion' ? value : Boolean(loadState().reducedMotion);
    window.dispatchEvent(new CustomEvent('relay-settings-change', { detail: { key, value } }));
    this.showPanel('options');
  }

  toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.();
    } catch {}
    this.showPanel('options');
  }

  showMain(withSound = false) {
    if (withSound) this.audio.back();
    this.view = 'main';
    this.clearPanel();
    this.panelDim.setVisible(false);
    this.panelCard.setVisible(false);
    this.panel.setVisible(false);
    this.menu.setVisible(true);
    this.status.setVisible(true);
    this.buttons = this.menu.list.slice();
    this.layout();
    this.selectButton(0, false);
  }

  selectButton(index, playSound = true) {
    if (!this.buttons.length) return;
    const nextIndex = Phaser.Math.Wrap(index, 0, this.buttons.length);
    const changed = nextIndex !== this.selectedIndex;
    this.selectedIndex = nextIndex;
    this.buttons.forEach((button, buttonIndex) => button.setFocused(buttonIndex === this.selectedIndex));
    if (playSound && changed) this.audio.hover();
  }

  onKeyDown(event) {
    if (['ArrowDown', 's', 'S'].includes(event.key)) { event.preventDefault(); this.selectButton(this.selectedIndex + 1); }
    else if (['ArrowUp', 'w', 'W'].includes(event.key)) { event.preventDefault(); this.selectButton(this.selectedIndex - 1); }
    else if (['Enter', ' '].includes(event.key)) { event.preventDefault(); this.buttons[this.selectedIndex]?.activate(); }
    else if (event.key === 'Escape' && this.view !== 'main') this.showMain(true);
  }

  launch() {
    this.audio.launch();
    this.cameras.main.flash(180, 141, 244, 255);
    this.cameras.main.zoomTo(this.reducedMotion ? 1 : 1.045, this.reducedMotion ? 120 : 680, 'Cubic.easeInOut');
    this.tweens.add({ targets: [this.menu, this.logo, this.logoAccent, this.tag, this.status], alpha: 0, duration: this.reducedMotion ? 120 : 620, ease: 'Sine.easeIn' });
    this.time.delayedCall(this.reducedMotion ? 160 : 660, () => {
      document.querySelector('#start')?.click();
      this.close();
    });
  }

  layout() {
    const w = this.scale.width || window.innerWidth;
    const h = this.scale.height || window.innerHeight;
    const portrait = h > w;
    const phone = Math.min(w, h) < 700;
    const compact = !portrait && h < 560;
    const x = w / 2;
    const imageScale = Math.max(w / this.backdropFar.width, h / this.backdropFar.height);
    this.backdropFar.setPosition(x, h / 2).setScale(imageScale * 1.03);
    this.backdropNear.setPosition(x, h / 2).setScale(imageScale * 1.08);
    this.tone.clear().fillStyle(0x02060d, 0.38).fillRect(0, 0, w, h).fillStyle(0x01040a, 0.62).fillRect(w * 0.16, 0, w * 0.68, h);
    this.grid.clear().lineStyle(1, 0x234458, 0.16);
    const step = phone ? 42 : 58;
    for (let gx = 0; gx <= w; gx += step) this.grid.lineBetween(gx, h * 0.58, gx, h);
    for (let gy = h * 0.58; gy <= h; gy += step) this.grid.lineBetween(0, gy, w, gy);
    this.city.clear();
    const skylineBase = h * 0.86;
    let cursor = 0;
    while (cursor < w) {
      const width = Phaser.Math.Between(phone ? 26 : 36, phone ? 56 : 92);
      const height = Phaser.Math.Between(phone ? 55 : 80, phone ? 130 : 230);
      this.city.fillStyle(0x030a12, 0.88);
      this.city.fillRect(cursor, skylineBase - height, width, height);
      cursor += width + Phaser.Math.Between(6, 16);
    }
    const towerX = x + (portrait ? 0 : Math.min(260, w * 0.23));
    const towerY = skylineBase - (phone ? 118 : 165);
    this.city.fillStyle(0x071722, 0.95).fillRect(towerX - 7, towerY, 14, skylineBase - towerY);
    this.city.fillStyle(0x8df4ff, 0.95).fillRect(towerX - 1, towerY - 18, 2, 18);
    this.relayBeacon.setPosition(towerX, towerY - 22);
    this.relayRing.setPosition(towerX, towerY - 22);
    this.relayRing.setScale(1);
    this.relayBeacon.setScale(this.reducedMotion ? 1 : 1.15);

    const titleScale = portrait ? (phone ? 0.52 : 0.7) : (compact ? 0.5 : 1);
    const titleY = compact ? 48 : portrait ? 76 : 92;
    this.logo.setPosition(x, titleY).setScale(titleScale);
    this.logoAccent.setPosition(x, titleY).setScale(titleScale);
    this.tag.setPosition(x, titleY + (compact ? 34 : portrait ? 56 : 74)).setScale(phone ? 0.72 : 1);
    this.status.setPosition(x, titleY + (compact ? 50 : portrait ? 76 : 96)).setScale(phone ? 0.78 : 1);

    const buttonScale = Math.min(1, (w - 34) / 340);
    const rowGap = compact ? 49 : portrait && phone ? 57 : 62;
    if (this.view === 'main') {
      const menuY = clamp(compact ? h * 0.34 : portrait ? h * 0.34 : h * 0.36, titleY + (phone ? 80 : 98), h - rowGap * 5 - 46);
      this.menu.setPosition(x, menuY);
      this.menu.list.forEach((button, index) => button.setPosition(0, index * rowGap).setScale(buttonScale));
    } else {
      this.panelDim.setSize(w, h);
      this.panelCard.clear().fillStyle(0x06111c, 0.96).fillRoundedRect(Math.max(14, w * 0.08), Math.max(42, h * 0.11), Math.min(w - 28, 620), Math.min(h - 80, 540), 20).lineStyle(1.5, 0x2c7892, 0.7).strokeRoundedRect(Math.max(14, w * 0.08), Math.max(42, h * 0.11), Math.min(w - 28, 620), Math.min(h - 80, 540), 20);
      const panelY = Math.max(64, Math.min(108, h * 0.14));
      this.panel.setPosition(x, panelY);
      this.panelTitle?.setPosition(0, 0).setScale(phone ? 0.9 : 1);
      this.panelHeading?.setPosition(0, 44).setScale(phone ? 0.88 : 1);
      this.panelCopy?.setPosition(0, 72).setScale(phone ? 0.82 : 1);
      const startY = this.panelCopy ? Math.min(h * 0.54 - panelY, compact ? 138 : portrait ? 250 : 280) : 58;
      this.buttons.forEach((button, index) => button.setPosition(0, startY + index * rowGap).setScale(buttonScale));
    }
    this.footer.setPosition(x, h - 18).setVisible(!compact && !phone);
    this.version.setPosition(x, h - (compact || phone ? 8 : 30)).setVisible(true);
  }

  update(time) {
    const w = this.scale.width || window.innerWidth;
    const h = this.scale.height || window.innerHeight;
    const t = time * 0.001;
    this.rain.clear();
    if (loadState().rain !== false && !this.reducedMotion) {
      this.rain.lineStyle(1, 0x8df4ff, 0.09);
      for (let i = 0; i < 34; i += 1) {
        const x = (i * 83 + t * 26) % (w + 80) - 40;
        const y = (i * 41 + t * 120) % (h + 60) - 30;
        this.rain.lineBetween(x, y, x - 5, y + 18);
      }
    }
    this.signal.clear();
    this.signal.lineStyle(2, 0x8df4ff, 0.23);
    const pulse = this.reducedMotion ? 0 : (Math.sin(t * 2.5) + 1) * 0.5;
    const r = 15 + pulse * 18;
    this.signal.strokeCircle(this.relayBeacon.x, this.relayBeacon.y, r);
    this.relayRing.setAlpha(this.reducedMotion ? 0.45 : 0.25 + pulse * 0.4);
    if (!this.reducedMotion) {
      this.particles.forEach(dot => {
        const index = dot.getData('index');
        dot.x = ((index * 97 + t * dot.getData('speed') * 32) % (w + 40)) - 20;
        dot.y = h * 0.16 + ((index * 61 + Math.sin(t * dot.getData('speed') + dot.getData('seed')) * 34) % Math.max(100, h * 0.72));
        dot.alpha = 0.08 + ((Math.sin(t * 1.7 + dot.getData('seed')) + 1) * 0.5) * 0.22;
      });
      this.cityLights.forEach((light, index) => {
        light.x = (index * 127) % Math.max(1, w);
        light.y = h * 0.86 - (index * 31) % Math.max(50, h * 0.22);
        light.alpha = 0.08 + ((Math.sin(t * 1.3 + light.getData('phase')) + 1) * 0.5) * 0.32;
      });
      const mx = (this.input.activePointer?.x || w / 2) / Math.max(1, w) - 0.5;
      const my = (this.input.activePointer?.y || h / 2) / Math.max(1, h) - 0.5;
      this.backdropFar.x = w / 2 - mx * 8;
      this.backdropFar.y = h / 2 - my * 5;
      this.backdropNear.x = w / 2 - mx * 18;
      this.backdropNear.y = h / 2 - my * 11;
    }
  }

  close() {
    document.body.classList.remove('phaser-title-active');
    window.__relayTitleGame?.destroy(true);
    document.getElementById('phaserTitleRoot')?.remove();
  }
}
