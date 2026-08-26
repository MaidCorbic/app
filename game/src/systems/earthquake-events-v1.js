import Phaser from 'phaser';

const WARNING_MS = 1400;
const QUAKE_MS = 3200;
const COOLDOWN_MS = 18000;
const MIN_DELAY_MS = 12000;
const MAX_DELAY_MS = 26000;
const RUBBLE_COUNT = 12;
const WORLD_SHAKE = 7;

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
      debris: [],
      cracks: [],
      damaged: [],
      baseX: camera.scrollX,
      baseY: camera.scrollY,
      worldObjects: [],
    };

    const clearGroup = group => {
      for (const item of group) item?.destroy?.();
      group.length = 0;
    };

    const addCrack = (x, y, scale = 1) => {
      const crack = this.add.graphics().setDepth(4).setPosition(x, y);
      crack.lineStyle(2, 0x111827, .72);
      crack.beginPath();
      crack.moveTo(-30 * scale, 0);
      crack.lineTo(-12 * scale, 5 * scale);
      crack.lineTo(-3 * scale, -9 * scale);
      crack.lineTo(12 * scale, 8 * scale);
      crack.lineTo(31 * scale, -2 * scale);
      crack.strokePath();
      state.cracks.push(crack);
    };

    const captureWorldObjects = () => {
      state.worldObjects.length = 0;
      const children = this.children?.getArray?.() || [];
      for (const child of children) {
        if (!child || child === player || !child.active) continue;
        if (typeof child.x !== 'number' || typeof child.y !== 'number') continue;
        if (child.depth >= 10) continue;
        if (state.worldObjects.length >= 35) break;
        state.worldObjects.push({ child, x: child.x, y: child.y, rotation: child.rotation || 0 });
      }
    };

    const createWorldDamage = () => {
      clearGroup(state.debris);
      clearGroup(state.cracks);
      captureWorldObjects();

      const baseX = player.x + 160;
      const groundY = player.y + 20;

      for (let i = 0; i < RUBBLE_COUNT; i++) {
        const x = baseX + Phaser.Math.Between(-260, 360);
        const y = groundY + Phaser.Math.Between(-30, 12);
        const size = Phaser.Math.Between(5, 13);
        const rock = this.add.rectangle(x, y, size, Phaser.Math.Between(5, 14), 0x697586, .88)
          .setDepth(6)
          .setRotation(Phaser.Math.FloatBetween(-1, 1));
        rock.setVelocity?.(Phaser.Math.Between(-55, 55), Phaser.Math.Between(-110, -25));
        state.debris.push(rock);
      }

      for (let i = 0; i < 5; i++) {
        addCrack(
          player.x + Phaser.Math.Between(-180, 420),
          groundY + Phaser.Math.Between(12, 35),
          Phaser.Math.FloatBetween(.7, 1.35),
        );
      }

      for (const entry of state.worldObjects) {
        const { child } = entry;
        child.__earthquakeOffset = {
          x: Phaser.Math.Between(-10, 10),
          y: Phaser.Math.Between(-4, 7),
          r: Phaser.Math.FloatBetween(-.08, .08),
        };
      }
    };

    const startQuake = () => {
      const now = performance.now();
      if (!state.active || state.phase !== 'idle' || now < state.cooldownUntil) return;
      state.phase = 'warning';
      state.until = now + WARNING_MS;
      state.warning = this.add.graphics().setDepth(12).setPosition(player.x, player.y - 62);
      state.warning.lineStyle(3, 0xff826e, .8).strokeCircle(0, 0, 24);
      state.warning.lineStyle(1, 0xffd06e, .35).strokeCircle(0, 0, 40);
      this.playerCue?.('GROUND INSTABILITY', 'WORLD');
      this.events?.emit?.('earthquake:warning');
    };

    const beginShake = () => {
      state.phase = 'quake';
      state.until = performance.now() + QUAKE_MS;
      state.baseX = camera.scrollX;
      state.baseY = camera.scrollY;
      createWorldDamage();
      this.playerCue?.('EARTHQUAKE — WORLD BREAKING', 'WORLD');
      this.events?.emit?.('earthquake:start');
    };

    const finishQuake = () => {
      state.phase = 'idle';
      state.cooldownUntil = performance.now() + COOLDOWN_MS;
      state.until = performance.now() + Phaser.Math.Between(MIN_DELAY_MS, MAX_DELAY_MS);
      state.warning?.destroy();
      state.warning = null;

      for (const entry of state.worldObjects) {
        const child = entry.child;
        if (!child?.active) continue;
        const offset = child.__earthquakeOffset;
        if (offset) {
          child.x = entry.x + offset.x;
          child.y = entry.y + offset.y;
          child.rotation = entry.rotation + offset.r;
        }
        delete child.__earthquakeOffset;
      }

      clearGroup(state.debris);
      camera.setScroll(state.baseX, state.baseY);
      this.events?.emit?.('earthquake:complete');
    };

    const onUpdate = (_time, delta = 16) => {
      if (!state.active || !player.active) return;
      const now = performance.now();

      if (state.phase === 'idle' && now >= state.until) startQuake();

      if (state.phase === 'warning') {
        state.warning?.setPosition(player.x, player.y - 62);
        state.warning?.setAlpha(.5 + Math.sin(now * .022) * .35);
        if (now >= state.until) beginShake();
        return;
      }

      if (state.phase !== 'quake') return;

      const remaining = Math.max(0, state.until - now);
      const intensity = WORLD_SHAKE * Math.max(.25, remaining / QUAKE_MS);
      camera.setScroll(
        state.baseX + Phaser.Math.FloatBetween(-intensity, intensity),
        state.baseY + Phaser.Math.FloatBetween(-intensity, intensity),
      );

      for (const entry of state.worldObjects) {
        const child = entry.child;
        if (!child?.active || !child.__earthquakeOffset) continue;
        const jolt = Math.sin(now * .055 + entry.x) * 2.5;
        child.x = entry.x + child.__earthquakeOffset.x + jolt;
        child.y = entry.y + child.__earthquakeOffset.y + Math.sin(now * .041 + entry.y) * 2;
        child.rotation = entry.rotation + child.__earthquakeOffset.r + Math.sin(now * .047) * .025;
      }

      for (const rock of state.debris) {
        if (!rock?.active) continue;
        rock.y += delta * .18;
        rock.rotation += delta * .0015;
      }

      if (now >= state.until) finishQuake();
    };

    this.events?.on?.('update', onUpdate);
    this.events?.once?.('shutdown', () => {
      state.active = false;
      state.warning?.destroy();
      clearGroup(state.debris);
      clearGroup(state.cracks);
      for (const entry of state.worldObjects) {
        const child = entry.child;
        if (!child?.active) continue;
        child.x = entry.x;
        child.y = entry.y;
        child.rotation = entry.rotation;
        delete child.__earthquakeOffset;
      }
      camera.setScroll(state.baseX, state.baseY);
      this.events?.off?.('update', onUpdate);
      this.__earthquakeEvents = null;
    });

    return result;
  };
}
