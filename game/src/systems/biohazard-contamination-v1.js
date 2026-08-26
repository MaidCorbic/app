import Phaser from 'phaser';

const STAGES = Object.freeze({ CLEAN: 0, EXPOSED: 1, CONTAMINATED: 2, CRITICAL: 3 });
const EXPOSURE_MS = 1800;
const CRITICAL_MS = 7000;
const DECONTAMINATION_RANGE = 90;

function stageName(stage) {
  return stage === STAGES.CRITICAL ? 'CRITICAL' : stage === STAGES.CONTAMINATED ? 'CONTAMINATED' : stage === STAGES.EXPOSED ? 'EXPOSED' : 'CLEAN';
}

function drawZone(scene, x, y) { return scene.add.circle(x, y, 58, 0x76e07b, .10).setStrokeStyle(2, 0x8df4ff, .45).setDepth(4); }
function drawStation(scene, x, y) { return scene.add.rectangle(x, y, 34, 70, 0x14283a, 1).setStrokeStyle(2, 0x8df4ff, .85).setDepth(7); }

export function installBiohazardContamination(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__biohazardInstalled) return;
  RunnerScene.prototype.__biohazardInstalled = true;
  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    if (!this.isFeatureEnabled?.('biohazard')) return result;
    const player = this.player;
    if (!player || !this.add) return result;
    const state = this.__biohazard = { active: true, stage: STAGES.CLEAN, exposure: 0, contaminatedAt: 0, zones: [], station: null, pulse: 0 };
    state.zones.push(drawZone(this, player.x + 620, player.y + 18));
    state.station = drawStation(this, player.x + 980, player.y - 4);
    state.station.setData('decontaminationStation', true);
    const setStage = stage => {
      if (stage === state.stage) return;
      state.stage = stage;
      state.pulse = 0;
      this.events?.emit?.('biohazard:stage', { stage, name: stageName(stage) });
      this.playerCue?.(`BIOHAZARD ${stageName(stage)}`, 'WORLD');
    };
    const clean = () => { state.exposure = 0; state.contaminatedAt = 0; setStage(STAGES.CLEAN); this.events?.emit?.('biohazard:decontaminated'); };
    const onUpdate = (_time, delta = 16) => {
      if (!state.active || !player.active) return;
      const now = performance.now();
      const inside = state.zones.some(zone => Phaser.Math.Distance.Between(player.x, player.y, zone.x, zone.y) < 54);
      const nearStation = state.station && Phaser.Math.Distance.Between(player.x, player.y, state.station.x, state.station.y) < DECONTAMINATION_RANGE;
      if (nearStation && state.stage > STAGES.CLEAN) clean();
      if (inside && state.stage < STAGES.CONTAMINATED) {
        state.exposure += delta;
        if (state.exposure >= EXPOSURE_MS) { state.contaminatedAt = now; setStage(STAGES.CONTAMINATED); }
        else if (state.stage === STAGES.CLEAN) setStage(STAGES.EXPOSED);
      }
      if (state.stage === STAGES.CONTAMINATED && now - state.contaminatedAt >= CRITICAL_MS) setStage(STAGES.CRITICAL);
      if (state.stage >= STAGES.CONTAMINATED) { state.pulse += delta; player.setAlpha(.82 + Math.sin(state.pulse * .012) * .08); }
      else if (state.stage === STAGES.CLEAN) player.setAlpha(1);
      for (const zone of state.zones) zone.rotation += .0015 * delta;
      if (state.station) state.station.angle += .35;
    };
    this.events?.on?.('update', onUpdate);
    this.events?.once?.('shutdown', () => {
      state.active = false;
      player.setAlpha(1);
      this.events?.off?.('update', onUpdate);
      for (const zone of state.zones) zone?.destroy();
      state.station?.destroy();
      this.__biohazard = null;
    });
    return result;
  };
}
export { STAGES as BIOHAZARD_STAGES };
