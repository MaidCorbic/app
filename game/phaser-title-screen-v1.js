import Phaser from 'phaser';

(() => {
  if (window.__relayPhaserTitleScreen) return;
  window.__relayPhaserTitleScreen = true;

  const click = (selector) => document.querySelector(selector)?.click();

  class RelayTitleScene extends Phaser.Scene {
    constructor() {
      super('relay-title');
      this.buttons = [];
    }

    create() {
      this.buildBackdrop();
      this.buildLogo();
      this.buildMenu();
      this.buildFooter();
      this.scale.on('resize', this.layout, this);
      this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
      this.layout();
    }

    buildBackdrop() {
      this.bg = this.add.graphics();
      this.grid = this.add.graphics();
      this.scan = this.add.graphics();
      this.particles = [];
      for (let i = 0; i < 34; i += 1) {
        const dot = this.add.circle(0, 0, Phaser.Math.Between(1, 2), 0x8df4ff, Phaser.Math.FloatBetween(0.06, 0.3));
        dot.setData('seed', Phaser.Math.FloatBetween(0, Math.PI * 2));
        dot.setData('speed', Phaser.Math.FloatBetween(0.12, 0.42));
        this.particles.push(dot);
      }
    }

    buildLogo() {
      this.logo = this.add.text(0, 0, 'RELAY', {
        fontFamily: 'Arial, sans-serif', fontSize: 92, fontStyle: 'bold', color: '#f4f7fa',
        stroke: '#03101b', strokeThickness: 9,
        shadow: { offsetX: 0, offsetY: 13, color: '#000000', blur: 24, fill: true },
      }).setOrigin(0.5, 1);
      this.logoAccent = this.add.text(0, 0, 'RUNNER', {
        fontFamily: 'Arial, sans-serif', fontSize: 86, fontStyle: 'bold', color: '#8df4ff',
        stroke: '#03101b', strokeThickness: 8,
        shadow: { offsetX: 0, offsetY: 11, color: '#19c8f5', blur: 28, fill: true },
      }).setOrigin(0.5, 0);
      this.tag = this.add.text(0, 0, 'CARRY THE SIGNAL. OUTRUN THE NIGHT.', {
        fontFamily: 'monospace', fontSize: '11px', fontStyle: 'bold', color: '#7f93a8', letterSpacing: 3,
      }).setOrigin(0.5);
      this.ruleLeft = this.add.rectangle(0, 0, 190, 1, 0x35556e, 0.72).setOrigin(1, 0.5);
      this.ruleRight = this.add.rectangle(0, 0, 190, 1, 0x35556e, 0.72).setOrigin(0, 0.5);
    }

    createButton(label, key, callback) {
      const container = this.add.container(0, 0);
      const glow = this.add.rectangle(0, 0, 300, 52, 0x19c8f5, 0).setStrokeStyle(1, 0x6aa6bf, 0.42);
      const fill = this.add.rectangle(0, 0, 300, 52, 0x07131f, 0.9);
      const accent = this.add.rectangle(-148, 0, 3, 52, 0x19c8f5, 0.8);
      const text = this.add.text(0, -6, label, {
        fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold', color: '#dce7ee', letterSpacing: 2,
      }).setOrigin(0.5);
      const state = this.add.text(0, 13, key, {
        fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#557088', letterSpacing: 1.2,
      }).setOrigin(0.5);
      container.add([glow, fill, accent, text, state]);
      container.setSize(300, 52).setInteractive({ useHandCursor: true });
      container.on('pointerover', () => {
        fill.setFillStyle(0x0b2334, 0.98);
        glow.setStrokeStyle(1.5, 0x8df4ff, 0.95);
        accent.setFillStyle(0x8df4ff, 1);
        text.setColor('#f6feff'); text.setScale(1.03); state.setColor('#8df4ff');
      });
      container.on('pointerout', () => {
        fill.setFillStyle(0x07131f, 0.9);
        glow.setStrokeStyle(1, 0x6aa6bf, 0.42);
        accent.setFillStyle(0x19c8f5, 0.8);
        text.setColor('#dce7ee'); text.setScale(1); state.setColor('#557088');
      });
      container.on('pointerdown', () => {
        this.cameras.main.flash(90, 141, 244, 255, false, null, this);
        callback();
      });
      container.setData('index', this.buttons.length);
      this.buttons.push(container);
      return container;
    }

    buildMenu() {
      this.menu = this.add.container(0, 0);
      this.menu.add(this.createButton('PLAY', 'START RUN', () => { click('#start'); this.close(); }));
      this.menu.add(this.createButton('OPTIONS', 'SETTINGS / CONTROLS', () => click('[data-title-panel="controls"]')));
      this.menu.add(this.createButton('UPDATE', 'LATEST BUILD / CHANGES', () => click('[data-relay-info="update"]')));
      this.menu.add(this.createButton('INFO', 'FIELD GUIDE / FAQ', () => click('[data-relay-info="faq"]')));
      this.menu.add(this.createButton('EXIT', 'CLOSE SESSION', () => click('#exitTitle')));
      this.status = this.add.text(0, 0, 'SYSTEM ONLINE  //  RELAY NETWORK STABLE', {
        fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#597389', letterSpacing: 1.7,
      }).setOrigin(0.5);
    }

    buildFooter() {
      this.footer = this.add.text(0, 0, '2D COMMAND INTERFACE  •  CLICK OR TAP', {
        fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold', color: '#40596f', letterSpacing: 2,
      }).setOrigin(0.5);
    }

    layout() {
      const w = this.scale.width || window.innerWidth;
      const h = this.scale.height || window.innerHeight;
      const compact = w < 700;
      const centerX = w / 2;

      this.bg.clear();
      this.bg.fillGradientStyle(0x02060d, 0x02060d, 0x071625, 0x01040a, 1);
      this.bg.fillRect(0, 0, w, h);
      this.bg.fillStyle(0x0b6b89, 0.055); this.bg.fillCircle(centerX, h * 0.34, Math.min(w, h) * 0.42);
      this.bg.fillStyle(0x19c8f5, 0.035); this.bg.fillCircle(centerX, h * 0.78, Math.min(w, h) * 0.65);

      this.grid.clear(); this.grid.lineStyle(1, 0x234458, 0.19);
      const step = compact ? 44 : 58;
      for (let x = 0; x <= w; x += step) this.grid.lineBetween(x, h * 0.5, x, h);
      for (let y = h * 0.5; y <= h; y += step) this.grid.lineBetween(0, y, w, y);
      this.grid.lineStyle(1, 0x8df4ff, 0.1); this.grid.lineBetween(0, h * 0.5, w, h * 0.5);

      this.logo.setPosition(centerX, h * (compact ? 0.12 : 0.13)).setFontSize(compact ? 48 : 92);
      this.logoAccent.setPosition(centerX, h * (compact ? 0.12 : 0.13)).setFontSize(compact ? 44 : 86);
      this.tag.setPosition(centerX, h * 0.235);
      this.ruleLeft.setPosition(centerX - 18, h * 0.235); this.ruleRight.setPosition(centerX + 18, h * 0.235);

      const rowGap = compact ? 57 : 61;
      const firstY = Math.max(h * 0.32, 248);
      const total = rowGap * (this.menu.length - 1) + 52;
      const adjustedFirstY = Math.min(firstY, h - total - 70);
      this.menu.setPosition(centerX, Math.max(230, adjustedFirstY));
      this.menu.list.forEach((child, index) => child.setPosition(0, index * rowGap).setScale(Math.min(1, (w - 40) / 320)));
      this.status.setPosition(centerX, this.menu.y + rowGap * this.menu.length + 18);
      this.footer.setPosition(centerX, h - 18);
    }

    update(time) {
      const t = time * 0.001;
      const w = this.scale.width || window.innerWidth;
      const h = this.scale.height || window.innerHeight;
      this.scan.clear(); this.scan.fillStyle(0x8df4ff, 0.028);
      const y = ((t * 22) % (h + 160)) - 80; this.scan.fillRect(0, y, w, 28);
      this.particles.forEach((dot, index) => {
        const seed = dot.getData('seed'); const speed = dot.getData('speed');
        dot.x = ((index * 97 + t * speed * 28) % (w + 40)) - 20;
        dot.y = h * 0.18 + ((index * 61 + Math.sin(t * speed + seed) * 35) % Math.max(80, h * 0.78));
      });
    }

    close() {
      this.cameras.main.fadeOut(260, 2, 6, 13);
      this.time.delayedCall(280, () => { window.__relayTitleGame?.destroy(true); document.getElementById('phaserTitleRoot')?.remove(); });
    }
  }

  const boot = () => {
    const root = document.getElementById('phaserTitleRoot');
    if (!root) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: root,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#02060d',
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [RelayTitleScene],
      render: { antialias: true, roundPixels: true },
    });
    window.__relayTitleGame = game;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
