/* Gameplay Music V6
 * Reliable procedural gameplay background music for desktop + mobile.
 *
 * IMPORTANT:
 * - Audio is created only after a real user gesture.
 * - Works with the existing autoplay guards.
 * - Owns only background music; gameplay/HUD/CSS/physics are untouched.
 * - Exposes the existing window.relayAdaptiveMusic API expected by the game.
 */
(() => {
  'use strict';

  if (window.__relayGameplayMusicV6) return;
  window.__relayGameplayMusicV6 = true;

  const state = {
    ctx: null,
    master: null,
    music: null,
    filter: null,
    compressor: null,
    delay: null,
    delayGain: null,
    feedbackGain: null,
    scene: null,
    sceneCleanup: null,
    running: false,
    unlocked: false,
    enabled: true,
    paused: false,
    volume: 0.58,
    intensity: 0,
    targetIntensity: 0,
    tension: 0,
    step: 0,
    nextTime: 0,
    timer: 0,
    watchdog: 0,
    dynamicsTimer: 0
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));

  const N = {
    C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
  };

  const progressions = [
    [[N.C3, N.E3, N.G3], [N.A2, N.C3, N.E3], [N.F2, N.A2, N.C3], [N.G2, N.B2, N.D3]],
    [[N.A2, N.C3, N.E3], [N.F2, N.A2, N.C3], [N.C3, N.E3, N.G3], [N.G2, N.B2, N.D3]]
  ];

  const melodies = [
    [N.C5, N.E5, N.G5, N.E5, N.D5, N.G4, N.A4, N.C5, N.E5, N.D5, N.C5, N.A4, N.G4, N.E4, N.G4, N.C5],
    [N.E5, N.G5, N.A5, N.G5, N.E5, N.D5, N.C5, N.E5, N.G5, N.A5, N.G5, N.E5, N.D5, N.C5, N.D5, N.G4]
  ];

  const getAudioContextCtor = () =>
    window.AudioContext || window.webkitAudioContext || null;

  const safeUnlockGuards = () => {
    try { window.relayAudioAutoplayGuard?.unlock?.(); } catch {}
    try { window.relayAudioGestureGate?.unlock?.(); } catch {}
  };

  const resetContextState = () => {
    state.ctx = null;
    state.master = null;
    state.music = null;
    state.filter = null;
    state.compressor = null;
    state.delay = null;
    state.delayGain = null;
    state.feedbackGain = null;
  };

  const createAudioGraph = () => {
    if (state.ctx && state.ctx.state !== 'closed') return state.ctx;

    if (!state.unlocked) return null;

    const AC = getAudioContextCtor();
    if (!AC) return null;

    try {
      const ctx = new AC();
      const music = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const compressor = ctx.createDynamicsCompressor();
      const master = ctx.createGain();
      const delay = ctx.createDelay(0.65);
      const delayGain = ctx.createGain();
      const feedbackGain = ctx.createGain();

      music.gain.value = 0.86;
      master.gain.value = 0.0001;

      filter.type = 'lowpass';
      filter.frequency.value = 3600;
      filter.Q.value = 0.55;

      compressor.threshold.value = -18;
      compressor.knee.value = 14;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.008;
      compressor.release.value = 0.20;

      delay.delayTime.value = 0.18;
      delayGain.gain.value = 0.11;
      feedbackGain.gain.value = 0.12;

      music.connect(filter).connect(compressor).connect(master).connect(ctx.destination);
      music.connect(delay).connect(delayGain).connect(master);
      delay.connect(feedbackGain).connect(delay);

      state.ctx = ctx;
      state.master = master;
      state.music = music;
      state.filter = filter;
      state.compressor = compressor;
      state.delay = delay;
      state.delayGain = delayGain;
      state.feedbackGain = feedbackGain;

      return ctx;
    } catch {
      resetContextState();
      return null;
    }
  };

  const rampMaster = (value, seconds = 0.25) => {
    if (!state.ctx || !state.master) return;
    try {
      const now = state.ctx.currentTime;
      state.master.gain.cancelScheduledValues(now);
      state.master.gain.setValueAtTime(Math.max(0.0001, state.master.gain.value), now);
      state.master.gain.linearRampToValueAtTime(clamp(value, 0.0001, 0.85), now + seconds);
    } catch {}
  };

  const tone = (freq, duration, gain, type, when, pan = 0) => {
    if (!state.ctx || !state.music || !state.running || state.paused || !state.enabled) return;

    try {
      const osc = state.ctx.createOscillator();
      const env = state.ctx.createGain();
      const panner = state.ctx.createStereoPanner?.();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(35, freq), when);

      env.gain.setValueAtTime(0.0001, when);
      env.gain.exponentialRampToValueAtTime(Math.max(0.00015, gain), when + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.045, duration));

      osc.connect(env);
      if (panner) {
        panner.pan.setValueAtTime(clamp(pan, -1, 1), when);
        env.connect(panner).connect(state.music);
      } else {
        env.connect(state.music);
      }

      osc.start(when);
      osc.stop(when + duration + 0.05);
    } catch {}
  };

  const kick = when => {
    if (!state.ctx || !state.music || !state.running || state.paused) return;
    try {
      const osc = state.ctx.createOscillator();
      const env = state.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, when);
      osc.frequency.exponentialRampToValueAtTime(48, when + 0.11);
      env.gain.setValueAtTime(0.0001, when);
      env.gain.exponentialRampToValueAtTime(0.13, when + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, when + 0.15);
      osc.connect(env).connect(state.music);
      osc.start(when);
      osc.stop(when + 0.18);
    } catch {}
  };

  const snare = when => {
    if (!state.ctx || !state.music || !state.running || state.paused) return;
    try {
      const buffer = state.ctx.createBuffer(1, Math.floor(state.ctx.sampleRate * 0.10), state.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = state.ctx.createBufferSource();
      const env = state.ctx.createGain();
      const hp = state.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1300;
      env.gain.setValueAtTime(0.0001, when);
      env.gain.exponentialRampToValueAtTime(0.055 + state.intensity * 0.008, when + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, when + 0.085);
      src.buffer = buffer;
      src.connect(hp).connect(env).connect(state.music);
      src.start(when);
      src.stop(when + 0.10);
    } catch {}
  };

  const schedule = () => {
    if (!state.ctx || !state.running || state.paused || !state.enabled) return;

    const bpm = 104 + Math.round(state.intensity * 8);
    const beat = 60 / bpm;
    const horizon = state.ctx.currentTime + 0.50;
    const progression = progressions[state.step % 32 < 16 ? 0 : 1];
    const bar = Math.floor((state.step % 64) / 16) % 4;
    const chord = progression[bar];

    while (state.nextTime < horizon) {
      const i = state.step % 16;
      const when = state.nextTime;
      const melody = melodies[Math.floor(state.step / 64) % melodies.length];

      tone(chord[0], beat * 0.74, 0.072, 'triangle', when, -0.12);
      if (i % 4 === 0) {
        tone(chord[1], beat * 0.85, 0.040, 'sine', when, -0.04);
        tone(chord[2], beat * 0.85, 0.034, 'sine', when, 0.04);
        kick(when);
      }
      if (i % 4 === 2) snare(when);

      if (i % 2 === 0) {
        const f = melody[(i / 2 + bar * 2) % melody.length];
        tone(f, beat * 0.42, 0.056 + state.intensity * 0.007, state.intensity >= 2 ? 'sawtooth' : 'square', when, i % 4 === 0 ? -0.18 : 0.18);
      }

      if (state.intensity >= 1 && i % 4 === 1) {
        tone(melody[(i + 3 + bar) % melody.length] * 0.5, beat * 0.40, 0.026, 'triangle', when, -0.24);
      }

      if (state.intensity >= 2 && i % 4 === 3) {
        tone(melody[(i + 7 + bar) % melody.length], beat * 0.20, 0.030, 'square', when, 0.28);
      }

      if (state.intensity >= 3 && i % 2 === 1) {
        tone(chord[(i / 2) % 3] * 2, beat * 0.16, 0.020, 'triangle', when, 0.30);
      }

      state.step++;
      state.nextTime += beat / 2;
    }
  };

  const start = () => {
    if (!state.enabled || !state.unlocked || !state.scene || state.paused) return false;

    const ctx = createAudioGraph();
    if (!ctx || ctx.state !== 'running') return false;

    if (!state.running) {
      state.running = true;
      state.step = 0;
      state.nextTime = ctx.currentTime + 0.06;
      rampMaster(state.volume, 0.35);
    }

    window.clearInterval(state.timer);
    state.timer = window.setInterval(schedule, 60);
    schedule();
    return true;
  };

  const stop = (fade = true) => {
    state.running = false;
    window.clearInterval(state.timer);
    state.timer = 0;
    if (fade) rampMaster(0.0001, 0.18);
  };

  const unlock = async () => {
    try {
      state.unlocked = true;
      safeUnlockGuards();

      let ctx = createAudioGraph();
      if (!ctx) {
        await new Promise(resolve => setTimeout(resolve, 0));
        safeUnlockGuards();
        ctx = createAudioGraph();
      }

      if (!ctx) {
        state.unlocked = false;
        return false;
      }

      if (ctx.state !== 'running') {
        try { await ctx.resume(); } catch {}
      }

      state.unlocked = ctx.state === 'running';
      if (state.unlocked && state.scene && !state.paused) start();
      return state.unlocked;
    } catch {
      state.unlocked = false;
      return false;
    }
  };

  const setIntensity = (value, hold = 0) => {
    state.targetIntensity = clamp(Math.round(Number(value) || 0), 0, 3);
    state.tension = Math.max(state.tension, Number(hold) || 0);
    if (state.filter && state.ctx) {
      try {
        const cutoffs = [2200, 3200, 4300, 5600];
        state.filter.frequency.linearRampToValueAtTime(cutoffs[state.targetIntensity], state.ctx.currentTime + 0.20);
      } catch {}
    }
  };

  const bind = scene => {
    if (!scene || !scene.game || state.scene === scene) return;
    state.sceneCleanup?.();
    state.scene = scene;

    const events = scene.game.events;
    if (!events || typeof events.on !== 'function') {
      if (state.unlocked && !state.paused) start();
      return;
    }

    const onFeedback = kind => {
      const map = { warning:[3,2600], chase:[3,6000], hit:[2,2200], death:[3,5000], dash:[2,900], jump:[1,650], checkpoint:[1,1200], complete:[1,3600], land:[1,500], wallJump:[2,900], vault:[1,650], slide:[1,550] };
      const v = map[kind];
      if (v) setIntensity(v[0], v[1]);
    };
    const onHealth = hp => { const n = Number(hp); if (n <= 1) setIntensity(3, 4200); else if (n <= 2) setIntensity(2, 2500); };
    const onEnergy = e => { if (Number(e) <= 18) setIntensity(2, 2200); };
    const onCombo = c => { if (Number(c) >= 4) setIntensity(2, 1600); };
    const onSector = () => setIntensity(1, 1800);
    const onComplete = () => setIntensity(1, 4000);
    const onGameOver = () => setIntensity(3, 5000);

    events.on('feedback', onFeedback);
    events.on('health', onHealth);
    events.on('energy', onEnergy);
    events.on('combo', onCombo);
    events.on('sector', onSector);
    events.on('complete', onComplete);
    events.on('game-over', onGameOver);

    state.sceneCleanup = () => {
      events.off?.('feedback', onFeedback);
      events.off?.('health', onHealth);
      events.off?.('energy', onEnergy);
      events.off?.('combo', onCombo);
      events.off?.('sector', onSector);
      events.off?.('complete', onComplete);
      events.off?.('game-over', onGameOver);
    };

    scene.events?.once?.('shutdown', () => {
      state.sceneCleanup?.();
      state.sceneCleanup = null;
      state.scene = null;
      stop(true);
    });

    if (state.unlocked && !state.paused) start();
  };

  const bindRunnerReady = event => {
    const scene = event?.detail?.scene || window.__relayRunnerScene || null;
    if (scene) {
      window.__relayRunnerScene = scene;
      bind(scene);
    }
    if (state.unlocked && state.scene && !state.paused) start();
  };

  const gesture = () => { unlock(); };
  document.addEventListener('pointerdown', gesture, { capture: true, passive: true });
  document.addEventListener('touchstart', gesture, { capture: true, passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.code === 'Space' || event.key === 'Shift') unlock();
  }, { capture: true, passive: true });

  window.addEventListener('relay:runner-scene-ready', bindRunnerReady, { passive: true });
  if (window.__relayRunnerScene) bind(window.__relayRunnerScene);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      state.paused = true;
      stop(true);
    } else {
      state.paused = false;
      if (state.unlocked && state.scene) {
        try { state.ctx?.resume?.(); } catch {}
        start();
      }
    }
  });

  window.setInterval(() => {
    if (!state.enabled || !state.unlocked || state.paused || document.hidden) return;

    if (state.scene?.sys?.isActive?.() && !state.running) start();

    const pauseMenu = document.querySelector('#pauseMenu');
    const pauseVisible = !!pauseMenu && !pauseMenu.classList.contains('hidden') && getComputedStyle(pauseMenu).display !== 'none';
    if (pauseVisible && !state.paused) {
      state.paused = true;
      stop(true);
    } else if (!pauseVisible && state.paused && !document.hidden) {
      state.paused = false;
      start();
    }

    const r = state.scene;
    if (r?.sys?.isActive?.() && r.player?.body) {
      const speed = Math.abs(r.player.body.velocity?.x || 0);
      const chase = !!(r.chaser?.visible && r.chaser?.active);
      if (chase) setIntensity(3, 900);
      else if (state.tension <= 0) setIntensity(speed > 390 ? 2 : speed > 240 ? 1 : 0);
      state.tension = Math.max(0, state.tension - 120);
      state.intensity += (state.targetIntensity - state.intensity) * 0.12;
      state.intensity = clamp(state.intensity, 0, 3);
    }
  }, 120);

  state.watchdog = window.setInterval(() => {
    if (!state.enabled || !state.unlocked || state.paused || document.hidden) return;
    if (state.ctx?.state === 'suspended') {
      try { state.ctx.resume(); } catch {}
    }
    if (state.scene?.sys?.isActive?.() && !state.running) start();
  }, 500);

  window.relayAdaptiveMusic = {
    unlock,
    start,
    stop,
    bind,
    setIntensity,
    setVolume(value) {
      state.volume = clamp(value, 0.05, 0.80);
      if (state.running) rampMaster(state.volume, 0.15);
    },
    setEnabled(value) {
      state.enabled = !!value;
      if (!state.enabled) stop(true);
      else if (state.unlocked && state.scene && !state.paused) start();
    },
    getState() {
      return {
        running: state.running,
        unlocked: state.unlocked,
        enabled: state.enabled,
        volume: state.volume,
        intensity: state.intensity,
        contextState: state.ctx?.state || 'none'
      };
    }
  };
})();
