import Phaser from 'phaser';

const IDLE_DELAY_MS = 4200;
const ROUTINE_MS = 5200;
const SCAN_INTERVAL_MS = 900;

export function installAutonomousCharacter(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__autonomousCharacterInstalled) return;
  RunnerScene.prototype.__autonomousCharacterInstalled = true;
  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    if (!this.isFeatureEnabled?.('autonomous')) return result;
    const player = this.player;
    if (!player || !this.add || !this.input) return result;
    const state = this.__autonomousCharacter = { active: true, idleSince: performance.now(), routineUntil: 0, nextScanAt: 0, scanIndex: 0, routine: null, lastX: player.x, lastY: player.y, marker: null, scanLine: null, baseRotation: player.rotation || 0 };
    const makeMarker = () => {
      if (state.marker?.active) return state.marker;
      const marker = this.add.graphics().setDepth(7);
      marker.lineStyle(2, 0x8df4ff, .55); marker.strokeCircle(0, 0, 14); marker.lineStyle(1, 0x8df4ff, .35); marker.lineBetween(-7, 0, 7, 0); marker.lineBetween(0, -7, 0, 7); state.marker = marker; return marker;
    };
    const makeScanLine = () => { if (state.scanLine?.active) return state.scanLine; const line = this.add.graphics().setDepth(6); line.lineStyle(2, 0x8df4ff, .28); state.scanLine = line; return line; };
    const drawScan = angle => { const line = makeScanLine(); line.clear(); line.lineStyle(2, 0x8df4ff, .28); line.lineBetween(player.x, player.y - 20, player.x + Math.cos(angle) * 92, player.y - 20 + Math.sin(angle) * 92); };
    const beginRoutine = () => {
      if (state.routineUntil || !state.active) return;
      state.routine = 'observe'; state.routineUntil = performance.now() + ROUTINE_MS; state.nextScanAt = performance.now(); state.scanIndex = 0; state.baseRotation = player.rotation || 0;
      makeMarker().setPosition(player.x, player.y - 46).setAlpha(0); makeScanLine(); this.playerCue?.('AUTO OBSERVE', 'SYSTEM'); this.events?.emit?.('character:idle-routine', { routine: state.routine }); this.events?.emit?.('character:idle-observe', { phase: 'start' });
    };
    const resetIdle = () => { state.idleSince = performance.now(); state.routineUntil = 0; state.nextScanAt = 0; state.routine = null; state.scanIndex = 0; player.rotation = state.baseRotation; state.marker?.setAlpha(0); state.scanLine?.clear(); };
    const onInput = () => resetIdle();
    this.input.keyboard?.on('keydown', onInput); this.input.on('pointerdown', onInput);
    const onUpdate = (_time, delta = 16) => {
      if (!state.active || !player.active) return;
      const moved = Phaser.Math.Distance.Between(state.lastX, state.lastY, player.x, player.y) > 3;
      if (moved) resetIdle(); state.lastX = player.x; state.lastY = player.y;
      if (!state.routine && performance.now() - state.idleSince >= IDLE_DELAY_MS) beginRoutine();
      if (!state.routineUntil) return;
      const now = performance.now(); const remaining = state.routineUntil - now; const elapsed = ROUTINE_MS - remaining; const marker = makeMarker();
      marker.setPosition(player.x, player.y - 46); marker.setAlpha(Math.min(.65, Math.max(0, elapsed / 700))); marker.rotation += delta * .0015;
      if (now >= state.nextScanAt) { const scanAngles = [-0.48, 0, 0.48, 0]; const angle = scanAngles[state.scanIndex % scanAngles.length]; state.scanIndex += 1; state.nextScanAt = now + SCAN_INTERVAL_MS; player.rotation = state.baseRotation + angle * .08; drawScan(angle); this.events?.emit?.('character:idle-observe', { phase: 'scan', direction: angle < 0 ? 'left' : angle > 0 ? 'right' : 'center' }); }
      if (remaining <= 0) { this.events?.emit?.('character:idle-observe', { phase: 'complete' }); resetIdle(); }
    };
    this.events?.on?.('update', onUpdate);
    this.events?.once?.('shutdown', () => { state.active = false; player.rotation = state.baseRotation; this.input.keyboard?.off('keydown', onInput); this.input.off('pointerdown', onInput); this.events?.off?.('update', onUpdate); state.marker?.destroy(); state.scanLine?.destroy(); this.__autonomousCharacter = null; });
    return result;
  };
}
