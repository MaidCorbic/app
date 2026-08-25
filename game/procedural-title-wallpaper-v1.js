import Phaser from 'phaser';

const seeded = index => {
  const x = Math.sin(index * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export function installProceduralTitleWallpaper(TitleSceneClass) {
  if (!TitleSceneClass || TitleSceneClass.__proceduralWallpaperV1) return;
  TitleSceneClass.__proceduralWallpaperV1 = true;

  TitleSceneClass.prototype.preload = function () {};

  TitleSceneClass.prototype.createWorld = function () {
    this.__wallpaper = {
      sky: this.add.graphics(),
      moon: this.add.graphics(),
      clouds: this.add.graphics(),
      far: this.add.graphics(),
      mid: this.add.graphics(),
      near: this.add.graphics(),
      rooftops: this.add.graphics(),
      tower: this.add.graphics(),
      beacon: this.add.graphics(),
      haze: this.add.graphics(),
      grid: this.add.graphics(),
      rain: this.add.graphics(),
      particles: this.add.graphics(),
      signal: this.add.graphics(),
      shade: this.add.graphics(),
    };

    this.parallax = { x: 0, y: 0 };
    this.pointerTarget = { x: 0, y: 0 };
    this.relayBeacon = { x: 0, y: 0 };

    const makeBuildings = (count, widthMin, widthMax, heightMin, heightMax) => Array.from({ length: count }, (_, index) => ({
      width: Phaser.Math.Between(widthMin, widthMax),
      height: Phaser.Math.Between(heightMin, heightMax),
      antenna: seeded(index + 7) > 0.72,
      neon: seeded(index + 29) > 0.62,
      seed: index,
    }));

    this.wallpaperBuildingsFar = makeBuildings(70, 28, 76, 50, 130);
    this.wallpaperBuildingsMid = makeBuildings(52, 36, 96, 70, 190);
    this.wallpaperBuildingsNear = makeBuildings(38, 48, 118, 100, 250);
    this.wallpaperClouds = Array.from({ length: 7 }, (_, index) => ({
      x: index * 270,
      y: 0,
      width: Phaser.Math.Between(180, 320),
      height: Phaser.Math.Between(34, 80),
      speed: Phaser.Math.FloatBetween(3, 7),
      alpha: Phaser.Math.FloatBetween(0.035, 0.10),
    }));

    this.input?.on('pointermove', pointer => {
      this.pointerTarget.x = pointer.x;
      this.pointerTarget.y = pointer.y;
    });

    // Keep compatibility with the original scene methods that expect these fields.
    this.backdropFar = { width: 1920, height: 1080, x: 0, y: 0, setPosition() { return this; }, setScale() { return this; } };
    this.backdropNear = { width: 1920, height: 1080, x: 0, y: 0, setPosition() { return this; }, setScale() { return this; } };
  };

  TitleSceneClass.prototype.__drawWallpaperBuildings = function (graphics, buildings, width, height, baseY, parallax, bodyColor, lightColor) {
    graphics.clear();
    let cursor = -120 + this.parallax.x * parallax;
    buildings.forEach((building, index) => {
      const x = cursor;
      const y = baseY - building.height + this.parallax.y * parallax * 0.3;
      graphics.fillStyle(bodyColor, 0.96).fillRect(x, y, building.width, building.height);
      const cols = Math.max(1, Math.floor(building.width / 18));
      const rows = Math.max(2, Math.floor(building.height / 28));
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (((index * 7 + row * 5 + col * 3) % 11) < 4) {
            graphics.fillStyle(lightColor, 0.10 + ((index + row + col) % 3) * 0.05);
            graphics.fillRect(x + 7 + col * 15, y + 9 + row * 25, 4, 8);
          }
        }
      }
      if (building.neon) graphics.fillStyle(lightColor, 0.06).fillRect(x + 3, y + 6, 2, Math.max(8, building.height - 12));
      if (building.antenna) {
        graphics.lineStyle(1, lightColor, 0.20).lineBetween(x + building.width / 2, y, x + building.width / 2, y - 16);
        graphics.fillStyle(0xff4d73, 0.75).fillCircle(x + building.width / 2, y - 18, 2);
      }
      cursor += building.width + 10 + (building.seed % 13);
      if (cursor > width + 140) cursor = -120;
    });
  };

  TitleSceneClass.prototype.layout = function () {
    const w = this.scale.width || window.innerWidth;
    const h = this.scale.height || window.innerHeight;
    const portrait = h > w;
    const phone = Math.min(w, h) < 700;
    const compact = !portrait && h < 560;
    const x = w / 2;
    const wp = this.__wallpaper;

    const p = this.parallax || { x: 0, y: 0 };
    wp.sky.clear();
    wp.sky.fillGradientStyle(0x020611, 0x071b30, 0x02060c, 0x020b18, 1).fillRect(0, 0, w, h);

    const moonX = w * (portrait ? 0.76 : 0.20) + p.x * 0.16;
    const moonY = h * (portrait ? 0.15 : 0.19) + p.y * 0.10;
    wp.moon.clear();
    for (let i = 4; i >= 1; i -= 1) wp.moon.fillStyle(0x35cfff, 0.012 * i).fillCircle(moonX, moonY, 62 + i * 18);
    wp.moon.fillStyle(0xd8f7ff, 0.96).fillCircle(moonX, moonY, phone ? 44 : 56);
    wp.moon.fillStyle(0x6e9cb6, 0.11).fillCircle(moonX - 17, moonY - 10, 8).fillCircle(moonX + 13, moonY + 12, 11).fillCircle(moonX + 2, moonY - 19, 6);

    wp.clouds.clear();
    this.wallpaperClouds.forEach((cloud, index) => {
      const drift = this.reducedMotion ? 0 : (this.time.now * 0.001 * cloud.speed) % (w + 420);
      const cx = ((cloud.x + drift) % (w + 520)) - 260 + p.x * (0.08 + index * 0.01);
      const cy = h * (0.11 + (index % 4) * 0.075) + p.y * 0.08;
      wp.clouds.fillStyle(0x233d58, cloud.alpha).fillEllipse(cx, cy, cloud.width, cloud.height);
      wp.clouds.fillEllipse(cx - cloud.width * 0.22, cy + 5, cloud.width * 0.48, cloud.height * 0.75);
    });

    this.__drawWallpaperBuildings(wp.far, this.wallpaperBuildingsFar, w, h, h * 0.78, 0.16, 0x07111d, 0x1b88aa);
    this.__drawWallpaperBuildings(wp.mid, this.wallpaperBuildingsMid, w, h, h * 0.85, 0.34, 0x081623, 0x20cdec);
    this.__drawWallpaperBuildings(wp.near, this.wallpaperBuildingsNear, w, h, h * 0.92, 0.68, 0x040a12, 0x65ebff);

    wp.rooftops.clear().fillStyle(0x02070d, 0.98).fillRect(0, h * 0.91, w, h * 0.09);
    for (let index = 0; index < 14; index += 1) {
      const rx = ((index * 131) + p.x * 0.7) % w;
      const ry = h * 0.91 - (index % 4) * 8;
      wp.rooftops.lineStyle(2, 0x16394e, 0.82).lineBetween(rx, ry, rx + 36, ry);
      wp.rooftops.lineStyle(1, 0x61efff, 0.18).lineBetween(rx + 9, ry, rx + 9, ry - 18);
    }

    const towerX = w * (portrait ? 0.20 : 0.72) + p.x * 0.50;
    const towerBase = h * 0.85;
    const towerTop = h * (portrait ? 0.36 : 0.27) + p.y * 0.32;
    wp.tower.clear();
    wp.tower.lineStyle(4, 0x18364b, 0.96).lineBetween(towerX - 15, towerBase, towerX, towerTop).lineBetween(towerX + 15, towerBase, towerX, towerTop);
    wp.tower.lineStyle(2, 0x62e8ff, 0.44).lineBetween(towerX, towerTop, towerX, towerTop - 40);
    wp.tower.lineStyle(1, 0xff436b, 0.55).lineBetween(towerX - 8, towerBase, towerX + 8, towerBase);
    wp.tower.strokeCircle(towerX, towerTop + 42, 7);
    this.relayBeacon.x = towerX;
    this.relayBeacon.y = towerTop - 42;

    wp.beacon.clear();
    const beaconPulse = this.reducedMotion ? 0.28 : 0.20 + ((Math.sin(this.time.now * 0.003) + 1) * 0.5) * 0.35;
    for (let ring = 3; ring >= 1; ring -= 1) wp.beacon.fillStyle(0x19c8f5, beaconPulse * 0.08 * ring).fillCircle(towerX, towerTop - 42, 22 + ring * 16);
    wp.beacon.fillStyle(0x8df4ff, 0.96).fillCircle(towerX, towerTop - 42, 4);

    wp.haze.clear().fillStyle(0x1bc7ec, 0.025).fillEllipse(w * 0.50 + p.x, h * 0.76 + p.y, w * 0.92, h * 0.28).fillStyle(0x01040a, 0.36).fillRect(0, h * 0.49, w, h * 0.51);
    wp.grid.clear().lineStyle(1, 0x2b7a96, 0.12);
    const step = phone ? 48 : 64;
    for (let gx = 0; gx <= w; gx += step) wp.grid.lineBetween(gx, h * 0.63, gx, h);
    for (let gy = h * 0.63; gy <= h; gy += step) wp.grid.lineBetween(0, gy, w, gy);

    wp.shade.clear().fillStyle(0x01040a, 0.42).fillRect(w * 0.17, 0, w * 0.66, h);
    wp.shade.lineStyle(1, 0x72efff, 0.07).strokeRect(w * 0.17, h * 0.035, w * 0.66, h * 0.92);

    const titleScale = portrait ? (phone ? 0.52 : 0.70) : (compact ? 0.50 : 0.92);
    const titleY = compact ? 48 : portrait ? 76 : 72;
    this.logo.setPosition(x, titleY).setScale(titleScale);
    this.logoAccent.setPosition(x, titleY).setScale(titleScale);
    this.tag.setPosition(x, titleY + (compact ? 34 : portrait ? 56 : 74)).setScale(phone ? 0.72 : 1);
    this.status.setPosition(x, titleY + (compact ? 50 : portrait ? 76 : 96)).setScale(phone ? 0.78 : 1);

    const buttonScale = Math.min(1, (w - 34) / 340);
    const rowGap = compact ? 49 : portrait && phone ? 57 : 62;
    if (this.view === 'main') {
      const menuY = clamp(compact ? h * 0.34 : portrait ? h * 0.34 : h * 0.37, titleY + (phone ? 80 : 92), h - rowGap * 5 - 46);
      this.menu.setPosition(x, menuY);
      this.menu.list.forEach((button, index) => button.setPosition(0, index * rowGap).setScale(buttonScale));
    } else {
      this.panelDim.setSize(w, h);
      const cardW = Math.min(w - 28, 620);
      const cardH = Math.min(h - 80, 540);
      const cardX = x - cardW / 2;
      const cardY = Math.max(42, h * 0.11);
      this.panelCard.clear().fillStyle(0x06111c, 0.96).fillRoundedRect(cardX, cardY, cardW, cardH, 20).lineStyle(1.5, 0x2c7892, 0.7).strokeRoundedRect(cardX, cardY, cardW, cardH, 20);
      this.panel.setPosition(x, cardY + Math.min(55, h * 0.08));
      this.panelTitle?.setPosition(0, 0);
      this.panelHeading?.setPosition(0, 44).setScale(phone ? 0.88 : 1);
      this.panelCopy?.setPosition(0, 72).setScale(phone ? 0.82 : 1);
      const startY = this.panelCopy ? Math.min(h * 0.54 - this.panel.y, compact ? 138 : portrait ? 250 : 280) : 58;
      this.buttons.forEach((button, index) => button.setPosition(0, startY + index * rowGap).setScale(buttonScale));
    }

    this.footer.setPosition(x, h - 18).setVisible(!compact && !phone);
    this.version.setPosition(x, h - (compact || phone ? 8 : 30)).setVisible(true);
  };

  TitleSceneClass.prototype.update = function (time) {
    const w = this.scale.width || window.innerWidth;
    const h = this.scale.height || window.innerHeight;
    const t = time * 0.001;
    const wp = this.__wallpaper;
    const targetX = (this.pointerTarget.x / Math.max(1, w) - 0.5) * 2;
    const targetY = (this.pointerTarget.y / Math.max(1, h) - 0.5) * 2;
    if (!this.reducedMotion) {
      this.parallax.x += ((targetX * 24) - this.parallax.x) * 0.03;
      this.parallax.y += ((targetY * 15) - this.parallax.y) * 0.03;
    }

    wp.rain.clear();
    if (loadState().rain !== false && !this.reducedMotion) {
      wp.rain.lineStyle(1, 0x8df4ff, 0.10);
      for (let index = 0; index < 44; index += 1) {
        const x = (index * 83 + t * 34) % (w + 100) - 50;
        const y = (index * 41 + t * 135) % (h + 70) - 35;
        wp.rain.lineBetween(x, y, x - 6, y + 20);
      }
    }

    wp.particles.clear();
    for (let index = 0; index < 44; index += 1) {
      const x = (index * 71 + t * (8 + (index % 4) * 3) + this.parallax.x * ((index % 5) + 1) * 0.4) % (w + 30);
      const y = h * 0.26 + ((index * 31 + Math.sin(t * 0.8 + index) * 36) % Math.max(100, h * 0.56));
      const alpha = 0.06 + ((Math.sin(t * 2 + index) + 1) * 0.5) * 0.24;
      wp.particles.fillStyle(index % 7 === 0 ? 0xff4d73 : 0x8df4ff, alpha).fillCircle(x, y, index % 5 === 0 ? 2 : 1);
    }

    const pulse = this.reducedMotion ? 0 : (Math.sin(t * 2.5) + 1) * 0.5;
    const radius = 24 + pulse * 45;
    wp.signal.clear().lineStyle(2, 0x8df4ff, 0.15 + pulse * 0.12).strokeCircle(this.relayBeacon.x, this.relayBeacon.y, radius).lineStyle(1, 0xff4d73, 0.13).lineBetween(this.relayBeacon.x - 90 - pulse * 25, this.relayBeacon.y, this.relayBeacon.x + 90 + pulse * 25, this.relayBeacon.y);

    // A subtle atmospheric pulse behind the UI keeps the scene alive without fighting the menu.
    if (!this.reducedMotion) this.uiPulse = 0.96 + Math.sin(t * 0.9) * 0.02;
  };
}
