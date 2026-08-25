import Phaser from 'phaser';

const INTERACT_RANGE = 96;
const COOLDOWN_MS = 1200;
const EXIT_OFFSET = 52;

function drawGate(scene, x, y, tone) {
  const g = scene.add.graphics().setDepth(8);
  g.lineStyle(3, tone, .9).strokeEllipse(0, 0, 54, 86);
  g.lineStyle(1, tone, .35).strokeEllipse(0, 0, 72, 104);
  g.fillStyle(tone, .08).fillEllipse(0, 0, 46, 76);
  g.fillStyle(tone, .75).fillCircle(0, 0, 5);
  g.setPosition(x, y);
  return g;
}

export function installTeleportNetwork(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__teleportNetworkInstalled) return;
  RunnerScene.prototype.__teleportNetworkInstalled = true;

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    const player = this.player;
    if (!player || !this.add) return result;

    const state = this.__teleportNetwork = {
      active: true,
      busy: false,
      cooldownUntil: 0,
      gates: [],
      pairIndex: 0,
    };

    const createPair = () => {
      const left = { x: player.x + 360, y: player.y - 70 };
      const right = { x: left.x + 430, y: player.y - 70 };
      const a = drawGate(this, left.x, left.y, 0x8df4ff);
      const b = drawGate(this, right.x, right.y, 0xb993ff);
      a.setData('teleportGate', true); b.setData('teleportGate', true);
      a.setData('pair', b); b.setData('pair', a);
      state.gates.push(a, b);
      state.pairIndex += 1;
    };
    createPair();

    const nearest = () => {
      if (state.busy) return null;
      let best = null;
      let bestDistance = INTERACT_RANGE;
      for (const gate of state.gates) {
        if (!gate?.active || !gate.visible) continue;
        const distance = Phaser.Math.Distance.Between(player.x, player.y, gate.x, gate.y);
        if (distance <= bestDistance) { best = gate; bestDistance = distance; }
      }
      return best;
    };

    const teleport = () => {
      if (!state.active || state.busy || performance.now() < state.cooldownUntil) return;
      const gate = nearest();
      const destination = gate?.getData('pair');
      if (!gate || !destination?.active) return;
      state.busy = true;
      state.cooldownUntil = performance.now() + COOLDOWN_MS;
      const destinationX = destination.x + EXIT_OFFSET;
      const destinationY = destination.y + 42;
      this.playerCue?.('TELEPORT LINK', 'TRAVERSAL');
      this.events?.emit?.('teleport:begin', { from: gate, to: destination });
      const flash = this.add.circle(player.x, player.y, 12, 0x8df4ff, .22).setDepth(12);
      this.tweens.add({ targets: flash, radius: 48, alpha: 0, duration: 180, onComplete: () => flash.destroy() });
      player.body?.setVelocity?.(0, 0);
      player.body?.setAllowGravity?.(false);
      player.setAlpha(.15);
      this.time.delayedCall(170, () => {
        if (!state.active || !player.active) return;
        player.setPosition(destinationX, destinationY);
        player.body?.reset?.(destinationX, destinationY);
        player.setAlpha(1);
        player.body?.setAllowGravity?.(true);
        const exit = this.add.circle(destinationX, destinationY, 10, 0xb993ff, .24).setDepth(12);
        this.tweens.add({ targets: exit, radius: 52, alpha: 0, duration: 260, onComplete: () => exit.destroy() });
        this.events?.emit?.('teleport:complete', { from: gate, to: destination, x: destinationX, y: destinationY });
        state.busy = false;
        state.cooldownUntil = performance.now() + COOLDOWN_MS;
      });
    };

    const onKey = event => {
      if (event.code !== 'KeyT' || event.repeat) return;
      if (nearest()) { event.preventDefault(); teleport(); }
    };
    const onPointer = () => { if (nearest()) teleport(); };
    window.addEventListener('keydown', onKey, { passive: false });
    this.input?.on?.('pointerdown', onPointer);

    const onUpdate = () => {
      if (!state.active || !player.active) return;
      const target = nearest();
      for (const gate of state.gates) {
        if (!gate?.active) continue;
        const near = gate === target;
        gate.setAlpha(near ? 1 : .62);
        gate.rotation += near ? .018 : .006;
      }
    };
    this.events?.on?.('update', onUpdate);
    this.events?.once?.('shutdown', () => {
      state.active = false;
      window.removeEventListener('keydown', onKey);
      this.input?.off?.('pointerdown', onPointer);
      this.events?.off?.('update', onUpdate);
      for (const gate of state.gates) gate?.destroy();
      state.gates.length = 0;
      this.__teleportNetwork = null;
    });
    return result;
  };
}
