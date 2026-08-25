import Phaser from 'phaser';

const STORAGE_KEY = 'relay-runner-ghost-v1';
const SAMPLE_MS = 80;
const MAX_SAMPLES = 4500;
const GHOST_ALPHA = 0.24;

function readBest() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Number.isFinite(data.durationMs) || !Array.isArray(data.samples) || data.samples.length < 2) return null;
    return data;
  } catch { return null; }
}

function writeBest(record) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch { /* storage is optional */ }
}

function makeGhost(scene) {
  if (!scene?.add || !scene.textures?.exists?.('runner-idle')) return null;
  const ghost = scene.add.image(scene.player?.x || 0, scene.player?.y || 0, 'runner-idle');
  ghost.setAlpha(GHOST_ALPHA);
  ghost.setDepth(5);
  ghost.setTint(0x8df4ff);
  ghost.setBlendMode(Phaser.BlendModes.ADD);
  ghost.setData('relayGhost', true);
  return ghost;
}

function sample(scene, state) {
  const player = scene?.player;
  if (!player?.active || !state.recording || scene.finished || scene.respawning) return;
  const now = performance.now();
  if (now - state.lastSample < SAMPLE_MS) return;
  state.lastSample = now;
  if (state.samples.length >= MAX_SAMPLES) return;
  state.samples.push({
    t: now - state.startedAt,
    x: Math.round(player.x * 10) / 10,
    y: Math.round(player.y * 10) / 10,
    flipX: !!player.flipX,
  });
}

function playback(scene, state) {
  const ghost = state.ghost;
  const samples = state.best?.samples;
  if (!ghost?.active || !samples?.length) return;
  const elapsed = performance.now() - state.startedAt;
  if (elapsed >= state.best.durationMs) {
    ghost.setVisible(false);
    return;
  }
  let hi = 0;
  while (hi < samples.length && samples[hi].t < elapsed) hi += 1;
  if (hi <= 0) hi = 1;
  if (hi >= samples.length) hi = samples.length - 1;
  const a = samples[hi - 1];
  const b = samples[hi];
  const span = Math.max(1, b.t - a.t);
  const p = Phaser.Math.Clamp((elapsed - a.t) / span, 0, 1);
  ghost.x = Phaser.Math.Linear(a.x, b.x, p);
  ghost.y = Phaser.Math.Linear(a.y, b.y, p);
  ghost.flipX = p < .5 ? a.flipX : b.flipX;
  ghost.setVisible(true);
}

export function installGhostRun(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__ghostRunInstalled) return;
  RunnerScene.prototype.__ghostRunInstalled = true;

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    const best = readBest();
    const state = this.__ghostRun = {
      best,
      ghost: best ? makeGhost(this) : null,
      samples: [],
      recording: true,
      startedAt: performance.now(),
      lastSample: 0,
      saved: false,
    };

    const onUpdate = () => {
      if (!this.__ghostRun) return;
      sample(this, state);
      playback(this, state);
      if (this.finished && !state.saved) {
        state.saved = true;
        state.recording = false;
        const durationMs = Math.max(1, performance.now() - state.startedAt);
        if (state.samples.length >= 2 && (!state.best || durationMs < state.best.durationMs)) {
          writeBest({ durationMs, samples: state.samples });
        }
      }
    };

    this.events?.on?.('update', onUpdate);
    this.events?.once?.('shutdown', () => {
      state.recording = false;
      this.events?.off?.('update', onUpdate);
      state.ghost?.destroy?.();
      this.__ghostRun = null;
    });
    return result;
  };
}
