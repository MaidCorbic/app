import Phaser from 'phaser';

const WARNING_MS = 1400;
const QUAKE_MS = 4200;
const AFTERSHOCK_MS = 1100;
const COOLDOWN_MS = 22000;
const MIN_DELAY_MS = 14000;
const MAX_DELAY_MS = 28000;

export function installEarthquakeEvents(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__earthquakeEventsInstalled) return;
  RunnerScene.prototype.__earthquakeEventsInstalled = true;

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    if (!this.isFeatureEnabled?.('earthquake')) return result;

    const player = this.player;
    const camera = this.cameras?.main;
    if (!player || !this.add || !camera) return result;

    const state = this.__earthquakeEvents = {
      active: true,
      phase: 'idle',
      until: performance.now() + Phaser.Math.Between(MIN_DELAY_MS, MAX_DELAY_MS),
      cooldownUntil: 0,
      warning: null,
      cracks: [],
      debris: [],
      dust: [],
      impacts: [],
      affected: [],
      baseX: camera.scrollX,
      baseY: camera.scrollY,
    };

    const destroyList = list => {
      for (const item of list) item?.destroy?.();
      list.length = 0;
    };

    const collectWorldObjects = () => {
      state.affected.length = 0;
      for (const object of this.children?.list || []) {
        if (!object || object === player || !object.active || object === state.warning) continue;
        if (typeof object.x !== 'number' || typeof object.y !== 'number') continue;
        if (object.scrollFactorX === 0) continue;
        if (object.__earthquakeOwned || object.__uiElement) continue;
        if (Phaser.Math.Distance.Between(object.x, object.y, player.x, player.y) > 520) continue;
        state.affected.push({ object, x: object.x, y: object.y, rotation: object.rotation || 0 });
        if (state.affected.length >= 40) break;
      }
    };

    const createCracks = () => {
      for (let i = 0; i < Phaser.Math.Between(3, 5); i += 1) {
        const x = player.x + Phaser.Math.Between(-190, 240);
        const y = player.y + Phaser.Math.Between(12, 58);
        const g = this.add.graphics().setDepth(4);
        g.__earthquakeOwned = true;
        g.lineStyle(2, 0x596273, .9);
        g.beginPath();
        g.moveTo(0, 0);
        let px = 0;
        let py = 0;
        for (let n = 0; n < 4; n += 1) {
          px += Phaser.Math.Between(-12, 30);
          py += Phaser.Math.Between(7, 16);
          g.lineTo(px, py);
          if (n === 1) {
            g.moveTo(px, py);
            g.lineTo(px + Phaser.Math.Between(12, 28), py + Phaser.Math.Between(8, 18));
            g.moveTo(px, py);
          }
        }
        g.strokePath().setPosition(x, y);
        state.cracks.push(g);
      }
    };

    const createDebris = () => {
      for (let i = 0; i < Phaser.Math.Between(8, 12); i += 1) {
        const size = Phaser.Math.Between(5, 13);
        const sprite = this.add.rectangle(
          player.x + Phaser.Math.Between(-260, 320),
          player.y - Phaser.Math.Between(40, 150),
          size,
          Phaser.Math.Between(5, 16),
          Phaser.Math.Between(0x65717d, 0x9aa2a9),
          .82,
        ).setDepth(8);
        sprite.__earthquakeOwned = true;
        state.debris.push({
          sprite,
          vx: Phaser.Math.FloatBetween(-.12, .12),
          vy: Phaser.Math.FloatBetween(.08, .22),
          spin: Phaser.Math.FloatBetween(-.04, .04),
        });
      }
    };

    const createDust = () => {
      for (let i = 0; i < 12; i += 1) {
        const dust = this.add.circle(
          player.x + Phaser.Math.Between(-90, 90),
          player.y + Phaser.Math.Between(-8, 25),
          Phaser.Math.Between(3, 8),
          0xc8c4ba,
          .28,
        ).setDepth(7);
        dust.__earthquakeOwned = true;
        state.dust.push(dust);
      }
    };

    const createImpact = () => {
      const ring = this.add.graphics().setDepth(3).setPosition(
        player.x + Phaser.Math.Between(-120, 150),
        player.y + Phaser.Math.Between(10, 40),
      );
      ring.__earthquakeOwned = true;
      ring.lineStyle(2, 0xff826e, .55).strokeCircle(0, 0, 12);
      state.impacts.push(ring);
    };

    const warning = () => {
      if (state.phase !== 'idle' || performance.now() < state.cooldownUntil) return;
      state.phase = 'warning';
      state.until = performance.now() + WARNING_MS;
      state.warning = this.add.graphics().setDepth(12).setPosition(player.x, player.y - 64);
      state.warning.__earthquakeOwned = true;
      state.warning.lineStyle(2, 0xffd06e, .8).strokeCircle(0, 0, 22);
      state.warning.lineStyle(1, 0xff826e, .55).strokeCircle(0, 0, 36);
      this.playerCue?.('GROUND INSTABILITY', 'WORLD');
      this.events?.emit?.('earthquake:warning');
    };

    const quake = () => {
      state.phase = 'quake';
      state.until = performance.now() + QUAKE_MS;
      collectWorldObjects();
      createCracks();
      createDebris();
      createDust();
      createImpact();
      this.playerCue?.('EARTHQUAKE — WORLD BREAKING', 'WORLD');
      this.events?.emit?.('earthquake:start');
    };

    const aftershock = () => {
      state.phase = 'aftershock';
      state.until = performance.now() + AFTERSHOCK_MS;
      createDust();
      createImpact();
      this.events?.emit?.('earthquake:aftershock');
    };

    const complete = () => {
      state.phase = 'idle';
      state.cooldownUntil = performance.now() + COOLDOWN_MS;
      state.until = performance.now() + Phaser.Math.Between(MIN_DELAY_MS, MAX_DELAY_MS);
      state.warning?.destroy();
      state.warning = null;
      destroyList(state.debris);
      destroyList(state.dust);
      destroyList(state.impacts);
      camera.setScroll(state.baseX, state.baseY);
      this.events?.emit?.('earthquake:complete');
    };

    const update = (_time, delta = 16) => {
      if (!state.active || !player.active) return;
      const now = performance.now();

      if (state.phase === 'idle' && now >= state.until) warning();

      if (state.phase === 'warning') {
        state.warning?.setPosition(player.x, player.y - 64);
        state.warning?.setAlpha(.45 + Math.sin(now * .02) * .35);
        if (now >= state.until) quake();
        return;
      }

      if (state.phase === 'quake' || state.phase === 'aftershock') {
        const duration = state.phase === 'quake' ? QUAKE_MS : AFTERSHOCK_MS;
        const strengthMultiplier = state.phase === 'quake' ? 1 : .38;
        const strength = 5.5 * strengthMultiplier * Math.max(.18, (state.until - now) / duration);
        camera.setScroll(
          state.baseX + Phaser.Math.FloatBetween(-strength, strength),
          state.baseY + Phaser.Math.FloatBetween(-strength, strength),
        );

        if (state.phase === 'quake') {
          for (const item of state.affected) {
            if (!item.object?.active) continue;
            item.object.x = item.x + Math.sin(now * .025 + item.x) * 5;
            item.object.y = item.y + Math.cos(now * .021 + item.y) * 3;
            item.object.rotation = item.rotation + Math.sin(now * .019 + item.x) * .045;
          }
        }

        for (const item of state.debris) {
          if (!item.sprite?.active) continue;
          item.sprite.x += item.vx * delta;
          item.sprite.y += item.vy * delta;
          item.vy += .012 * delta;
          item.sprite.rotation += item.spin * delta;
          if (item.sprite.y > player.y + 100) item.sprite.setAlpha(Math.max(0, item.sprite.alpha - .04));
        }

        for (const dust of state.dust) {
          if (!dust?.active) continue;
          dust.y -= .015 * delta;
          dust.x += Math.sin(now * .003 + dust.x) * .05 * delta;
          dust.alpha = Math.max(0, dust.alpha - .0006 * delta);
          dust.scale += .0008 * delta;
        }

        for (const ring of state.impacts) {
          if (!ring?.active) continue;
          ring.scale += .0018 * delta;
          ring.alpha = Math.max(0, ring.alpha - .0012 * delta);
        }

        if (state.phase === 'quake' && now >= state.until) aftershock();
        else if (state.phase === 'aftershock' && now >= state.until) complete();
      }
    };

    this.events?.on?.('update', update);
    this.events?.once?.('shutdown', () => {
      state.active = false;
      state.warning?.destroy();
      destroyList(state.debris);
      destroyList(state.dust);
      destroyList(state.impacts);
      destroyList(state.cracks);
      camera.setScroll(state.baseX, state.baseY);
      this.events?.off?.('update', update);
      this.__earthquakeEvents = null;
    });

    return result;
  };
}
