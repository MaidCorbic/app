/* Gameplay Audio Start Fix V5
 * Dedicated gameplay background-music owner.
 *
 * IMPORTANT:
 * - Does not change gameplay logic.
 * - Does not change HUD/CSS/design.
 * - Creates AudioContext only after a real user gesture.
 * - Reuses the existing relayAdaptiveMusic API expected by the repo.
 * - Binds to RunnerScene for adaptive intensity only.
 */
(() => {
  'use strict';

  if (window.__relayGameplayAudioStartV5) {
    return;
  }

  window.__relayGameplayAudioStartV5 = true;

  const AC_AVAILABLE = () =>
    window.AudioContext || window.webkitAudioContext || null;

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, Number(value) || 0));

  const state = {
    ctx: null,
    master: null,
    compressor: null,
    music: null,
    filter: null,
    scene: null,
    cleanup: null,
    timer: 0,
    watchdog: 0,
    running: false,
    unlocked: false,
    enabled: true,
    paused: false,
    volume: 0.55,
    intensity: 0,
    target: 0,
    tension: 0,
    step: 0,
    nextTime: 0
  };

  const notes = {
    C3: 130.81,
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    G3: 196.00,
    A3: 220.00,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.00,
    A4: 440.00,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    G5: 783.99,
    A5: 880.00
  };

  const chords = [
    [notes.C4, notes.E4, notes.G4],
    [notes.A3, notes.C4, notes.E4],
    [notes.F3, notes.A3, notes.C4],
    [notes.G3, notes.B3, notes.D4]
  ];

  const melody = [
    notes.C5,
    notes.E5,
    notes.G5,
    notes.E5,
    notes.D5,
    notes.G4,
    notes.A4,
    notes.C5,
    notes.E5,
    notes.D5,
    notes.C5,
    notes.A4,
    notes.G4,
    notes.E4,
    notes.G4,
    notes.C5
  ];

  const readSettings = () => {
    try {
      const value = JSON.parse(
        localStorage.getItem('relay-runner-state') || '{}'
      );

      return value && typeof value === 'object'
        ? value
        : {};
    } catch {
      return {};
    }
  };

  const gameplayVisible = () => {
    const play = document.getElementById('play');
    const intro = document.getElementById('intro');

    const playVisible =
      !!play &&
      !play.hidden &&
      !play.classList.contains('hidden') &&
      getComputedStyle(play).display !== 'none';

    const introVisible =
      !!intro &&
      !intro.hidden &&
      !intro.classList.contains('hidden') &&
      getComputedStyle(intro).display !== 'none';

    return playVisible && !introVisible;
  };

  const createContext = () => {
    if (state.ctx) {
      return state.ctx;
    }

    if (!state.unlocked) {
      return null;
    }

    const Context = AC_AVAILABLE();

    if (!Context) {
      return null;
    }

    try {
      const ctx = new Context();
      const master = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      const filter = ctx.createBiquadFilter();
      const music = ctx.createGain();

      master.gain.value = 0.0001;

      compressor.threshold.value = -18;
      compressor.knee.value = 15;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.008;
      compressor.release.value = 0.18;

      filter.type = 'lowpass';
      filter.frequency.value = 2600;
      filter.Q.value = 0.45;

      music.gain.value = 0.9;

      music
        .connect(filter)
        .connect(compressor)
        .connect(master)
        .connect(ctx.destination);

      state.ctx = ctx;
      state.master = master;
      state.compressor = compressor;
      state.filter = filter;
      state.music = music;

      return ctx;
    } catch {
      state.ctx = null;
      state.master = null;
      state.compressor = null;
      state.filter = null;
      state.music = null;
      return null;
    }
  };

  const setMaster = (value, fade = 0.2) => {
    if (!state.ctx || !state.master) {
      return;
    }

    const target = clamp(value, 0.0001, 0.8);
    const now = state.ctx.currentTime;

    try {
      state.master.gain.cancelScheduledValues(now);
      state.master.gain.setValueAtTime(
        Math.max(0.0001, state.master.gain.value),
        now
      );
      state.master.gain.linearRampToValueAtTime(
        target,
        now + fade
      );
    } catch {}
  };

  const tone = (
    frequency,
    duration,
    gain,
    type,
    when
  ) => {
    if (
      !state.running ||
      state.paused ||
      !state.enabled ||
      !state.ctx ||
      !state.music
    ) {
      return;
    }

    try {
      const oscillator = state.ctx.createOscillator();
      const envelope = state.ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(
        Math.max(40, frequency),
        when
      );

      envelope.gain.setValueAtTime(
        0.0001,
        when
      );

      envelope.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, gain),
        when + 0.012
      );

      envelope.gain.exponentialRampToValueAtTime(
        0.0001,
        when + Math.max(0.04, duration)
      );

      oscillator.connect(envelope).connect(state.music);

      oscillator.start(when);
      oscillator.stop(when + duration + 0.05);
    } catch {}
  };

  const bass = (frequency, duration, when) => {
    tone(
      frequency,
      duration,
      0.075,
      'triangle',
      when
    );
  };

  const kick = when => {
    if (
      !state.running ||
      state.paused ||
      !state.ctx ||
      !state.music
    ) {
      return;
    }

    try {
      const oscillator = state.ctx.createOscillator();
      const envelope = state.ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(
        105,
        when
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        50,
        when + 0.10
      );

      envelope.gain.setValueAtTime(
        0.0001,
        when
      );
      envelope.gain.exponentialRampToValueAtTime(
        0.08,
        when + 0.008
      );
      envelope.gain.exponentialRampToValueAtTime(
        0.0001,
        when + 0.14
      );

      oscillator.connect(envelope).connect(state.music);
      oscillator.start(when);
      oscillator.stop(when + 0.17);
    } catch {}
  };

  const schedule = () => {
    if (
      !state.running ||
      state.paused ||
      !state.enabled ||
      !state.ctx
    ) {
      return;
    }

    const bpm = 96 + state.intensity * 7;
    const beat = 60 / bpm;
    const horizon = state.ctx.currentTime + 0.40;

    while (state.nextTime < horizon) {
      const index = state.step % 16;
      const bar = Math.floor(state.step / 16) % 4;
      const when = state.nextTime;
      const chord = chords[bar];

      bass(
        chord[0] / 2,
        beat * 0.72,
        when
      );

      if (index % 4 === 0) {
        tone(
          chord[1],
          beat * 0.75,
          0.032,
          'sine',
          when
        );

        tone(
          chord[2],
          beat * 0.75,
          0.028,
          'sine',
          when
        );

        kick(when);
      }

      if (index % 2 === 0) {
        const melodyIndex =
          (index / 2 + bar * 3) % melody.length;

        tone(
          melody[melodyIndex],
          beat * 0.40,
          0.044 + state.intensity * 0.007,
          'square',
          when
        );
      }

      if (
        state.intensity >= 1 &&
        index % 4 === 2
      ) {
        const f =
          melody[(index + bar) % melody.length] * 0.5;

        tone(
          f,
          beat * 0.50,
          0.023,
          'triangle',
          when
        );
      }

      if (
        state.intensity >= 2 &&
        index % 4 === 3
      ) {
        tone(
          melody[(index + bar + 5) % melody.length],
          beat * 0.22,
          0.031,
          'square',
          when
        );
      }

      if (
        state.intensity >= 3 &&
        index % 2 === 1
      ) {
        tone(
          chord[(index / 2) % 3] * 2,
          beat * 0.16,
          0.019,
          'triangle',
          when
        );
      }

      state.step += 1;
      state.nextTime += beat / 2;
    }
  };

  const stop = (fade = true) => {
    state.running = false;

    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = 0;
    }

    if (fade) {
      setMaster(0.0001, 0.18);
    }
  };

  const start = () => {
    if (
      !state.enabled ||
      !state.unlocked ||
      !state.scene ||
      state.paused
    ) {
      return false;
    }

    const ctx = createContext();

    if (!ctx) {
      return false;
    }

    if (ctx.state !== 'running') {
      return false;
    }

    if (!state.running) {
      state.running = true;
      state.step = 0;
      state.nextTime = ctx.currentTime + 0.08;
      setMaster(state.volume, 0.45);
    }

    if (state.timer) {
      window.clearInterval(state.timer);
    }

    state.timer = window.setInterval(
      schedule,
      50
    );

    schedule();
    return true;
  };

  const unlock = async () => {
    try {
      state.unlocked = true;

      try {
        window.relayAudioAutoplayGuard?.unlock?.();
      } catch {}

      const ctx = createContext();

      if (!ctx) {
        state.unlocked = false;
        return false;
      }

      if (ctx.state !== 'running') {
        await ctx.resume();
      }

      state.unlocked = ctx.state === 'running';

      if (
        state.unlocked &&
        state.scene &&
        !state.paused
      ) {
        start();
      }

      return state.unlocked;
    } catch {
      state.unlocked = false;
      return false;
    }
  };

  const setVolume = value => {
    const numeric = Number(value);

    state.volume = Number.isFinite(numeric)
      ? clamp(numeric, 0.05, 0.8)
      : 0.55;

    if (state.running) {
      setMaster(state.volume, 0.18);
    }
  };

  const setEnabled = value => {
    state.enabled = !!value;

    if (!state.enabled) {
      stop(true);
      return;
    }

    if (
      state.unlocked &&
      state.scene &&
      !state.paused
    ) {
      start();
    }
  };

  const setIntensity = (
    value,
    hold = 0
  ) => {
    state.target = clamp(
      Math.round(Number(value) || 0),
      0,
      3
    );

    state.tension = Math.max(
      state.tension,
      Number(hold) || 0
    );

    if (state.filter && state.ctx) {
      try {
        const cutoff = [
          1500,
          2100,
          2800,
          3600
        ][state.target];

        state.filter.frequency.cancelScheduledValues(
          state.ctx.currentTime
        );

        state.filter.frequency.linearRampToValueAtTime(
          cutoff,
          state.ctx.currentTime + 0.25
        );
      } catch {}
    }
  };

  const feedback = kind => {
    const map = {
      warning: [3, 2800],
      chase: [3, 6500],
      hit: [2, 2200],
      death: [3, 4000],
      dash: [2, 900],
      jump: [1, 700],
      signal: [1, 900],
      checkpoint: [1, 1200],
      complete: [1, 3600],
      land: [1, 500],
      wallJump: [2, 800],
      vault: [1, 700],
      slide: [1, 600]
    };

    const entry = map[kind];

    if (entry) {
      setIntensity(
        entry[0],
        entry[1]
      );
    }
  };

  const bind = scene => {
    if (
      !scene?.game ||
      state.scene === scene
    ) {
      return false;
    }

    try {
      state.cleanup?.();

      state.scene = scene;

      const events = scene.game.events;

      const onFeedback = feedback;
      const onHealth = value => {
        const health = Number(value);

        if (health <= 1) {
          setIntensity(3, 4200);
        } else if (health <= 2) {
          setIntensity(2, 2600);
        }
      };

      const onEnergy = value => {
        if (Number(value) <= 18) {
          setIntensity(2, 2200);
        }
      };

      const onCombo = value => {
        if (Number(value) >= 4) {
          setIntensity(2, 1500);
        }
      };

      const onSector = () => {
        setIntensity(1, 1800);
      };

      const onComplete = () => {
        setIntensity(1, 4000);
      };

      const onGameOver = () => {
        setIntensity(3, 5000);
      };

      events.on('feedback', onFeedback);
      events.on('health', onHealth);
      events.on('energy', onEnergy);
      events.on('combo', onCombo);
      events.on('sector', onSector);
      events.on('complete', onComplete);
      events.on('game-over', onGameOver);

      state.cleanup = () => {
        events.off('feedback', onFeedback);
        events.off('health', onHealth);
        events.off('energy', onEnergy);
        events.off('combo', onCombo);
        events.off('sector', onSector);
        events.off('complete', onComplete);
        events.off('game-over', onGameOver);
      };

      scene.events?.once?.(
        'shutdown',
        () => {
          state.cleanup?.();
          state.cleanup = null;
          state.scene = null;
          state.tension = 0;
          stop(true);
        }
      );

      if (
        state.unlocked &&
        !state.paused
      ) {
        start();
      }

      return true;
    } catch {
      return false;
    }
  };

  const applySettings = () => {
    const settings = readSettings();

    if (settings.muted === true) {
      setEnabled(false);
      return false;
    }

    const volume = Number(
      settings.musicVolume
    );

    setEnabled(true);
    setVolume(
      Number.isFinite(volume)
        ? volume
        : 0.55
    );

    return true;
  };

  const bindReadyScene = event => {
    const scene =
      event?.detail?.scene ||
      window.__relayRunnerScene ||
      null;

    if (scene) {
      window.__relayRunnerScene = scene;
      bind(scene);
    }

    if (state.unlocked && !state.paused) {
      start();
    }
  };

  window.addEventListener(
    'relay:runner-scene-ready',
    bindReadyScene,
    { passive: true }
  );

  const handleGesture = event => {
    if (
      event.type === 'keydown' &&
      event.repeat
    ) {
      return;
    }

    const target =
      event.target instanceof Element
        ? event.target
        : null;

    const relevant =
      target?.closest?.(
        '#start,' +
        '#continue,' +
        '#launchJob,' +
        '#again,' +
        '#nextMission,' +
        '#retry,' +
        '[data-v3-play],' +
        '[data-v3-continue],' +
        '[data-action="play"],' +
        '[data-action="continue"],' +
        '[data-mobile-action]'
      );

    const keyboard =
      event.type === 'keydown' &&
      (
        event.key === 'Enter' ||
        event.code === 'Space'
      );

    if (!relevant && !keyboard) {
      return;
    }

    applySettings();

    bindReadyScene({
      detail: {
        scene:
          window.__relayRunnerScene
      }
    });

    unlock()
      .then(() => {
        if (gameplayVisible()) {
          bindReadyScene({
            detail: {
              scene:
                window.__relayRunnerScene
            }
          });
          start();
        }
      })
      .catch(() => {});
  };

  document.addEventListener(
    'pointerdown',
    handleGesture,
    {
      capture: true,
      passive: true
    }
  );

  document.addEventListener(
    'touchstart',
    handleGesture,
    {
      capture: true,
      passive: true
    }
  );

  document.addEventListener(
    'keydown',
    handleGesture,
    {
      capture: true,
      passive: true
    }
  );

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        state.paused = true;
        stop(true);
        return;
      }

      state.paused = false;

      if (
        state.unlocked &&
        state.scene &&
        gameplayVisible()
      ) {
        start();
      }
    }
  );

  window.setInterval(() => {
    if (
      !state.enabled ||
      !state.unlocked ||
      state.paused ||
      document.hidden
    ) {
      return;
    }

    const scene = state.scene;

    if (
      scene?.sys?.isActive?.() &&
      !state.running
    ) {
      start();
    }

    if (
      scene?.sys?.isActive?.() &&
      state.tension <= 0
    ) {
      const speed = Math.abs(
        Number(scene.player?.body?.velocity?.x || 0)
      );

      const chase = !!(
        scene.chaser?.visible &&
        scene.chaser?.active
      );

      if (chase) {
        setIntensity(3, 900);
      } else {
        setIntensity(
          speed > 390
            ? 2
            : speed > 240
              ? 1
              : 0
        );
      }
    }

    state.tension = Math.max(
      0,
      state.tension - 120
    );

    state.intensity +=
      (state.target - state.intensity) * 0.12;

    state.intensity = clamp(
      state.intensity,
      0,
      3
    );

    const pauseMenu =
      document.getElementById('pauseMenu');

    const menuPaused =
      !!pauseMenu &&
      !pauseMenu.classList.contains('hidden');

    if (menuPaused && !state.paused) {
      state.paused = true;
      stop(true);
    } else if (
      !menuPaused &&
      state.paused &&
      !document.hidden
    ) {
      state.paused = false;

      if (state.unlocked) {
        start();
      }
    }
  }, 300);

  window.relayAdaptiveMusic = {
    unlock,
    start,
    stop,
    bind,
    setIntensity,
    setVolume,
    setEnabled,
    getState: () => ({
      running: state.running,
      intensity: state.intensity,
      unlocked: state.unlocked,
      enabled: state.enabled,
      volume: state.volume
    })
  };

  window.relayGameplayAudioStartV3 = {
    start: async () => {
      applySettings();
      bindReadyScene({
        detail: {
          scene: window.__relayRunnerScene
        }
      });
      return unlock();
    },
    bindScene: () =>
      bindReadyScene({
        detail: {
          scene: window.__relayRunnerScene
        }
      })
  };

  window.relayGameplayAudioStartV4 =
    window.relayGameplayAudioStartV3;
})();