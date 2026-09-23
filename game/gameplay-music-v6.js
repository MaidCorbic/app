/* Gameplay Music V7
 * Advanced procedural gameplay music.
 *
 * FEATURES:
 * - Deep bass
 * - Punchy kick
 * - Snare + hats
 * - Arpeggio
 * - Main melody
 * - Dynamic intensity 0-3
 * - Chase/tension layer
 * - Stereo movement
 * - Filter sweeps
 * - Delay/reverb-style ambience
 * - Smooth transitions
 * - Desktop + mobile
 *
 * IMPORTANT:
 * - Audio is created only after a real user gesture.
 * - Existing relayAdaptiveMusic API is preserved.
 * - Gameplay/HUD/CSS/physics are untouched.
 */

(() => {
  'use strict';

  if (window.__relayGameplayMusicV7) return;
  window.__relayGameplayMusicV7 = true;

  /* =========================================================
     STATE
  ========================================================= */

  const state = {
    ctx: null,

    master: null,
    music: null,
    filter: null,
    compressor: null,

    delay: null,
    delayGain: null,
    feedbackGain: null,

    bassBus: null,
    drumsBus: null,
    melodyBus: null,
    arpBus: null,
    fxBus: null,

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
    bar: 0,

    nextTime: 0,

    timer: 0,
    watchdog: 0,
    dynamicsTimer: 0,

    lastEventTime: 0
  };


  /* =========================================================
     UTILITIES
  ========================================================= */

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, Number(value) || 0));


  const safeNow = () =>
    state.ctx ? state.ctx.currentTime : 0;


  const getAudioContextCtor = () =>
    window.AudioContext ||
    window.webkitAudioContext ||
    null;


  const safeUnlockGuards = () => {
    try {
      window.relayAudioAutoplayGuard?.unlock?.();
    } catch {}

    try {
      window.relayAudioGestureGate?.unlock?.();
    } catch {}
  };


  /* =========================================================
     NOTES
  ========================================================= */

  const N = {

    C1: 32.70,
    D1: 36.71,
    E1: 41.20,
    F1: 43.65,
    G1: 49.00,
    A1: 55.00,
    B1: 61.74,

    C2: 65.41,
    D2: 73.42,
    E2: 82.41,
    F2: 87.31,
    G2: 98.00,
    A2: 110.00,
    B2: 123.47,

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
    F5: 698.46,
    G5: 783.99,
    A5: 880.00,

    B5: 987.77,
    C6: 1046.50
  };


  /* =========================================================
     MUSICAL MATERIAL
  ========================================================= */

  const progressions = [

    [
      [N.C3, N.E3, N.G3],
      [N.A2, N.C3, N.E3],
      [N.F2, N.A2, N.C3],
      [N.G2, N.B2, N.D3]
    ],

    [
      [N.A2, N.C3, N.E3],
      [N.F2, N.A2, N.C3],
      [N.C3, N.E3, N.G3],
      [N.G2, N.B2, N.D3]
    ],

    [
      [N.C3, N.G3, N.B3],
      [N.A2, N.E3, N.A3],
      [N.F2, N.C3, N.G3],
      [N.G2, N.D3, N.A3]
    ]
  ];


  const melodies = [

    [
      N.C5,
      N.E5,
      N.G5,
      N.E5,

      N.D5,
      N.G4,
      N.A4,
      N.C5,

      N.E5,
      N.D5,
      N.C5,
      N.A4,

      N.G4,
      N.E4,
      N.G4,
      N.C5
    ],

    [
      N.E5,
      N.G5,
      N.A5,
      N.G5,

      N.E5,
      N.D5,
      N.C5,
      N.E5,

      N.G5,
      N.A5,
      N.G5,
      N.E5,

      N.D5,
      N.C5,
      N.D5,
      N.G4
    ],

    [
      N.G5,
      N.E5,
      N.C5,
      N.E5,

      N.G5,
      N.A5,
      N.G5,
      N.E5,

      N.D5,
      N.E5,
      N.G5,
      N.B5,

      N.A5,
      N.G5,
      N.E5,
      N.C5
    ]
  ];


  const bassPatterns = [

    [
      N.C2,
      N.C2,
      N.G1,
      N.C2,

      N.A1,
      N.A1,
      N.E2,
      N.A1,

      N.F1,
      N.F1,
      N.C2,
      N.F1,

      N.G1,
      N.G1,
      N.D2,
      N.G1
    ],

    [
      N.A1,
      N.A1,
      N.E2,
      N.A1,

      N.F1,
      N.F1,
      N.C2,
      N.F1,

      N.C2,
      N.C2,
      N.G1,
      N.C2,

      N.G1,
      N.G1,
      N.D2,
      N.G1
    ]
  ];


  const arpPatterns = [

    [0, 1, 2, 1],
    [0, 2, 1, 2],
    [2, 1, 0, 1],
    [0, 1, 2, 2]
  ];


  /* =========================================================
     CONTEXT RESET
  ========================================================= */

  const resetContextState = () => {

    state.ctx = null;

    state.master = null;
    state.music = null;

    state.filter = null;
    state.compressor = null;

    state.delay = null;
    state.delayGain = null;
    state.feedbackGain = null;

    state.bassBus = null;
    state.drumsBus = null;
    state.melodyBus = null;
    state.arpBus = null;
    state.fxBus = null;
  };


  /* =========================================================
     AUDIO GRAPH
  ========================================================= */

  const createAudioGraph = () => {

    if (
      state.ctx &&
      state.ctx.state !== 'closed'
    ) {
      return state.ctx;
    }

    if (!state.unlocked) return null;

    const AC = getAudioContextCtor();

    if (!AC) return null;

    try {

      const ctx = new AC();

      const master = ctx.createGain();

      const music = ctx.createGain();

      const filter = ctx.createBiquadFilter();

      const compressor =
        ctx.createDynamicsCompressor();

      const delay =
        ctx.createDelay(0.8);

      const delayGain =
        ctx.createGain();

      const feedbackGain =
        ctx.createGain();


      const bassBus =
        ctx.createGain();

      const drumsBus =
        ctx.createGain();

      const melodyBus =
        ctx.createGain();

      const arpBus =
        ctx.createGain();

      const fxBus =
        ctx.createGain();


      /* MASTER */

      master.gain.value = 0.0001;


      /* MAIN FILTER */

      filter.type = 'lowpass';

      filter.frequency.value = 4200;

      filter.Q.value = 0.7;


      /* COMPRESSOR */

      compressor.threshold.value = -20;

      compressor.knee.value = 12;

      compressor.ratio.value = 4.5;

      compressor.attack.value = 0.006;

      compressor.release.value = 0.18;


      /* DELAY */

      delay.delayTime.value = 0.20;

      delayGain.gain.value = 0.075;

      feedbackGain.gain.value = 0.16;


      /* BUS LEVELS */

      bassBus.gain.value = 0.95;

      drumsBus.gain.value = 0.75;

      melodyBus.gain.value = 0.68;

      arpBus.gain.value = 0.32;

      fxBus.gain.value = 0.28;


      /* ROUTING */

      bassBus.connect(music);

      drumsBus.connect(music);

      melodyBus.connect(music);

      arpBus.connect(music);

      fxBus.connect(music);


      music
        .connect(filter)
        .connect(compressor)
        .connect(master)
        .connect(ctx.destination);


      music
        .connect(delay)
        .connect(delayGain)
        .connect(master);


      delay
        .connect(feedbackGain)
        .connect(delay);


      state.ctx = ctx;

      state.master = master;

      state.music = music;

      state.filter = filter;

      state.compressor = compressor;

      state.delay = delay;

      state.delayGain = delayGain;

      state.feedbackGain = feedbackGain;

      state.bassBus = bassBus;

      state.drumsBus = drumsBus;

      state.melodyBus = melodyBus;

      state.arpBus = arpBus;

      state.fxBus = fxBus;


      return ctx;

    } catch {

      resetContextState();

      return null;
    }
  };


  /* =========================================================
     MASTER FADE
  ========================================================= */

  const rampMaster = (
    value,
    seconds = 0.25
  ) => {

    if (
      !state.ctx ||
      !state.master
    ) return;

    try {

      const now =
        state.ctx.currentTime;

      const target =
        clamp(value, 0.0001, 0.85);

      state.master.gain.cancelScheduledValues(now);

      state.master.gain.setValueAtTime(
        Math.max(
          0.0001,
          state.master.gain.value
        ),
        now
      );

      state.master.gain.linearRampToValueAtTime(
        target,
        now + seconds
      );

    } catch {}
  };


  /* =========================================================
     GENERIC TONE
  ========================================================= */

  const tone = (
    freq,
    duration,
    gain,
    type,
    when,
    pan = 0,
    bus = null
  ) => {

    if (
      !state.ctx ||
      !state.running ||
      state.paused ||
      !state.enabled
    ) {
      return;
    }

    try {

      const osc =
        state.ctx.createOscillator();

      const env =
        state.ctx.createGain();

      const panner =
        state.ctx.createStereoPanner?.();


      osc.type = type;

      osc.frequency.setValueAtTime(
        Math.max(25, freq),
        when
      );


      env.gain.setValueAtTime(
        0.0001,
        when
      );

      env.gain.exponentialRampToValueAtTime(
        Math.max(0.00015, gain),
        when + 0.008
      );

      env.gain.exponentialRampToValueAtTime(
        0.0001,
        when + Math.max(0.035, duration)
      );


      osc.connect(env);


      const destination =
        bus ||
        state.music;


      if (panner) {

        panner.pan.setValueAtTime(
          clamp(pan, -1, 1),
          when
        );

        env
          .connect(panner)
          .connect(destination);

      } else {

        env.connect(destination);
      }


      osc.start(when);

      osc.stop(
        when +
        duration +
        0.05
      );

    } catch {}
  };


  /* =========================================================
     BASS
  ========================================================= */

  const bass = (
    freq,
    duration,
    when
  ) => {

    if (!state.bassBus) return;

    try {

      const osc =
        state.ctx.createOscillator();

      const sub =
        state.ctx.createOscillator();

      const env =
        state.ctx.createGain();

      const filter =
        state.ctx.createBiquadFilter();


      osc.type = 'sawtooth';

      sub.type = 'sine';


      osc.frequency.setValueAtTime(
        freq,
        when
      );

      sub.frequency.setValueAtTime(
        freq / 2,
        when
      );


      filter.type = 'lowpass';

      filter.frequency.value =
        520 +
        state.intensity * 120;

      filter.Q.value = 1.2;


      env.gain.setValueAtTime(
        0.0001,
        when
      );

      env.gain.exponentialRampToValueAtTime(
        0.085 +
        state.intensity * 0.012,
        when + 0.012
      );

      env.gain.exponentialRampToValueAtTime(
        0.0001,
        when + duration
      );


      osc
        .connect(filter)
        .connect(env);

      sub.connect(env);

      env.connect(state.bassBus);


      osc.start(when);

      sub.start(when);


      osc.stop(
        when +
        duration +
        0.04
      );

      sub.stop(
        when +
        duration +
        0.04
      );

    } catch {}
  };


  /* =========================================================
     KICK
  ========================================================= */

  const kick = (
    when,
    strength = 1
  ) => {

    if (
      !state.ctx ||
      !state.drumsBus
    ) return;

    try {

      const osc =
        state.ctx.createOscillator();

      const env =
        state.ctx.createGain();


      osc.type = 'sine';


      osc.frequency.setValueAtTime(
        145,
        when
      );

      osc.frequency.exponentialRampToValueAtTime(
        46,
        when + 0.115
      );


      env.gain.setValueAtTime(
        0.0001,
        when
      );

      env.gain.exponentialRampToValueAtTime(
        0.17 * strength,
        when + 0.005
      );

      env.gain.exponentialRampToValueAtTime(
        0.0001,
        when + 0.16
      );


      osc
        .connect(env)
        .connect(state.drumsBus);


      osc.start(when);

      osc.stop(
        when + 0.19
      );

    } catch {}
  };


  /* =========================================================
     SNARE
  ========================================================= */

  const snare = (
    when,
    strength = 1
  ) => {

    if (
      !state.ctx ||
      !state.drumsBus
    ) return;

    try {

      const length =
        Math.floor(
          state.ctx.sampleRate *
          0.12
        );

      const buffer =
        state.ctx.createBuffer(
          1,
          length,
          state.ctx.sampleRate
        );

      const data =
        buffer.getChannelData(0);


      for (
        let i = 0;
        i < data.length;
        i++
      ) {

        data[i] =
          (Math.random() * 2 - 1) *
          Math.pow(
            1 - i / data.length,
            1.5
          );
      }


      const src =
        state.ctx.createBufferSource();

      const env =
        state.ctx.createGain();

      const hp =
        state.ctx.createBiquadFilter();


      hp.type = 'highpass';

      hp.frequency.value =
        1200 +
        state.intensity * 250;


      env.gain.setValueAtTime(
        0.0001,
        when
      );

      env.gain.exponentialRampToValueAtTime(
        (0.075 +
          state.intensity * 0.012) *
          strength,
        when + 0.004
      );

      env.gain.exponentialRampToValueAtTime(
        0.0001,
        when + 0.09
      );


      src.buffer = buffer;

      src
        .connect(hp)
        .connect(env)
        .connect(state.drumsBus);


      src.start(when);

      src.stop(
        when + 0.12
      );

    } catch {}
  };


  /* =========================================================
     HI-HAT
  ========================================================= */

  const hat = (
    when,
    open = false
  ) => {

    if (
      !state.ctx ||
      !state.drumsBus
    ) return;

    try {

      const duration =
        open ? 0.16 : 0.045;

      const length =
        Math.floor(
          state.ctx.sampleRate *
          duration
        );

      const buffer =
        state.ctx.createBuffer(
          1,
          length,
          state.ctx.sampleRate
        );

      const data =
        buffer.getChannelData(0);


      for (
        let i = 0;
        i < data.length;
        i++
      ) {

        data[i] =
          (Math.random() * 2 - 1) *
          (1 - i / data.length);
      }


      const src =
        state.ctx.createBufferSource();

      const filter =
        state.ctx.createBiquadFilter();

      const env =
        state.ctx.createGain();


      filter.type =
        'highpass';

      filter.frequency.value =
        open ? 5200 : 6500;


      env.gain.setValueAtTime(
        0.0001,
        when
      );

      env.gain.exponentialRampToValueAtTime(
        open ? 0.035 : 0.024,
        when + 0.002
      );

      env.gain.exponentialRampToValueAtTime(
        0.0001,
        when + duration
      );


      src.buffer = buffer;


      src
        .connect(filter)
        .connect(env)
        .connect(state.drumsBus);


      src.start(when);

      src.stop(
        when + duration + 0.02
      );

    } catch {}
  };


  /* =========================================================
     ARPEGGIO
  ========================================================= */

  const arp = (
    chord,
    when,
    beat,
    index
  ) => {

    if (
      state.intensity < 1 ||
      !state.arpBus
    ) return;


    const pattern =
      arpPatterns[
        state.bar %
        arpPatterns.length
      ];


    const note =
      chord[
        pattern[index % 4]
      ] * 2;


    tone(
      note,
      beat * 0.18,
      0.018 +
      state.intensity * 0.004,
      'triangle',
      when,
      index % 2 === 0 ? -0.42 : 0.42,
      state.arpBus
    );
  };


  /* =========================================================
     MAIN MELODY
  ========================================================= */

  const melodyNote = (
    freq,
    when,
    beat,
    index
  ) => {

    if (!state.melodyBus) return;


    let waveform =
      'triangle';


    if (state.intensity >= 3) {

      waveform =
        index % 4 === 0
          ? 'sawtooth'
          : 'triangle';

    } else if (
      state.intensity >= 2
    ) {

      waveform =
        'triangle';
    }


    const octave =
      state.intensity >= 3 &&
      index % 8 === 7
        ? 2
        : 1;


    tone(
      freq * octave,
      beat * 0.38,
      0.038 +
      state.intensity * 0.009,
      waveform,
      when,
      index % 2 === 0 ? -0.24 : 0.24,
      state.melodyBus
    );
  };


  /* =========================================================
     TENSION SOUND
  ========================================================= */

  const tensionNote = (
    when,
    beat,
    amount
  ) => {

    if (
      !state.fxBus ||
      amount <= 0
    ) return;


    const notes = [
      N.C5,
      N.D5,
      N.E5,
      N.G5,
      N.A5
    ];


    const index =
      Math.floor(
        state.step / 2
      ) % notes.length;


    tone(
      notes[index],
      beat * 0.12,
      0.012 +
      amount * 0.012,
      'sawtooth',
      when,
      0.55,
      state.fxBus
    );
  };


  /* =========================================================
     IMPACT / SWEEP
  ========================================================= */

  const sweep = (
    when,
    amount = 1
  ) => {

    if (
      !state.ctx ||
      !state.fxBus
    ) return;

    try {

      const osc =
        state.ctx.createOscillator();

      const env =
        state.ctx.createGain();


      osc.type =
        state.intensity >= 2
          ? 'sawtooth'
          : 'triangle';


      osc.frequency.setValueAtTime(
        180,
        when
      );

      osc.frequency.exponentialRampToValueAtTime(
        900,
        when + 0.22
      );


      env.gain.setValueAtTime(
        0.0001,
        when
      );

      env.gain.exponentialRampToValueAtTime(
        0.018 * amount,
        when + 0.03
      );

      env.gain.exponentialRampToValueAtTime(
        0.0001,
        when + 0.26
      );


      osc
        .connect(env)
        .connect(state.fxBus);


      osc.start(when);

      osc.stop(
        when + 0.30
      );

    } catch {}
  };


  /* =========================================================
     SEQUENCER
  ========================================================= */

  const schedule = () => {

    if (
      !state.ctx ||
      !state.running ||
      state.paused ||
      !state.enabled
    ) {
      return;
    }


    const bpm =
      108 +
      Math.round(
        state.intensity * 7
      );


    const beat =
      60 / bpm;


    const horizon =
      state.ctx.currentTime +
      0.65;


    let scheduled =
      0;


    while (
      state.nextTime < horizon &&
      scheduled < 6
    ) {

      const when =
        state.nextTime;


      const step =
        state.step % 16;


      const progression =
        progressions[
          Math.floor(
            state.bar / 4
          ) %
          progressions.length
        ];


      const chord =
        progression[
          state.bar % 4
        ];


      const melody =
        melodies[
          Math.floor(
            state.bar / 2
          ) %
          melodies.length
        ];


      const bassPattern =
        bassPatterns[
          Math.floor(
            state.bar / 2
          ) %
          bassPatterns.length
        ];


      /* -----------------------------------------
         KICK
      ----------------------------------------- */

      if (
        step === 0 ||
        step === 4 ||
        (
          state.intensity >= 2 &&
          step === 10
        ) ||
        (
          state.intensity >= 3 &&
          step === 14
        )
      ) {

        kick(
          when,
          state.intensity >= 3
            ? 1.15
            : 1
        );
      }


      /* -----------------------------------------
         SNARE
      ----------------------------------------- */

      if (
        step === 4 ||
        step === 12
      ) {

        snare(
          when,
          state.intensity >= 2
            ? 1.15
            : 1
        );
      }


      /* -----------------------------------------
         HI-HATS
      ----------------------------------------- */

      if (
        state.intensity >= 1
      ) {

        if (
          step % 2 === 0
        ) {

          hat(
            when,
            false
          );

        } else if (
          state.intensity >= 2
        ) {

          hat(
            when,
            false
          );
        }


        if (
          state.intensity >= 3 &&
          step % 4 === 3
        ) {

          hat(
            when,
            true
          );
        }
      }


      /* -----------------------------------------
         BASS
      ----------------------------------------- */

      const bassFreq =
        bassPattern[step];


      if (
        bassFreq &&
        (
          step % 2 === 0 ||
          state.intensity >= 2
        )
      ) {

        bass(
          bassFreq,
          beat * 0.42,
          when
        );
      }


      /* -----------------------------------------
         CHORD PAD
      ----------------------------------------- */

      if (
        step === 0
      ) {

        tone(
          chord[0],
          beat * 3.6,
          0.032,
          'triangle',
          when,
          -0.10
        );

        tone(
          chord[1],
          beat * 3.6,
          0.022,
          'sine',
          when,
          0
        );

        tone(
          chord[2],
          beat * 3.6,
          0.020,
          'sine',
          when,
          0.10
        );
      }


      /* -----------------------------------------
         MELODY
      ----------------------------------------- */

      if (
        step % 2 === 0
      ) {

        const melodyIndex =
          (
            Math.floor(step / 2) +
            state.bar * 2
          ) %
          melody.length;


        melodyNote(
          melody[melodyIndex],
          when,
          beat,
          step
        );
      }


      /* -----------------------------------------
         ARPEGGIO
      ----------------------------------------- */

      if (
        state.intensity >= 1 &&
        step % 2 === 1
      ) {

        arp(
          chord,
          when,
          beat,
          step
        );
      }


      /* -----------------------------------------
         EXTRA HIGH LAYER
      ----------------------------------------- */

      if (
        state.intensity >= 2 &&
        step % 4 === 3
      ) {

        tone(
          chord[
            (step / 4) % 3
          ] * 2,
          beat * 0.15,
          0.018,
          'square',
          when,
          0.35,
          state.fxBus
        );
      }


      /* -----------------------------------------
         CHASE / TENSION
      ----------------------------------------- */

      if (
        state.intensity >= 3 &&
        step % 2 === 1
      ) {

        tensionNote(
          when,
          beat,
          1
        );
      }


      /* -----------------------------------------
         BAR TRANSITION
      ----------------------------------------- */

      if (
        step === 0
      ) {

        if (
          state.intensity >= 2
        ) {

          sweep(
            when,
            state.intensity >= 3
              ? 1.3
              : 0.75
          );
        }
      }


      state.step++;

      state.nextTime +=
        beat / 2;


      if (
        state.step % 16 === 0
      ) {

        state.bar++;
      }


      scheduled++;
    }
  };


  /* =========================================================
     START
  ========================================================= */

  const start = () => {

    if (state.running) {
      return true;
    }


    if (
      !state.enabled ||
      !state.unlocked ||
      !state.scene ||
      state.paused
    ) {

      return false;
    }


    const ctx =
      createAudioGraph();


    if (
      !ctx ||
      ctx.state !== 'running'
    ) {

      return false;
    }


    state.running = true;

    state.step = 0;

    state.bar = 0;

    state.nextTime =
      ctx.currentTime +
      0.08;


    rampMaster(
      state.volume,
      0.40
    );


    window.clearInterval(
      state.timer
    );


    state.timer =
      window.setInterval(
        schedule,
        70
      );


    window.setTimeout(
      schedule,
      0
    );


    return true;
  };


  /* =========================================================
     STOP
  ========================================================= */

  const stop = (
    fade = true
  ) => {

    state.running = false;


    window.clearInterval(
      state.timer
    );


    state.timer = 0;


    if (fade) {

      rampMaster(
        0.0001,
        0.20
      );
    }
  };


  /* =========================================================
     UNLOCK
  ========================================================= */

  const unlock = async () => {

    if (
      state.unlocked &&
      state.ctx?.state === 'running'
    ) {

      if (
        state.scene &&
        !state.paused &&
        !state.running
      ) {

        start();
      }


      return true;
    }


    try {

      state.unlocked = true;

      safeUnlockGuards();


      let ctx =
        createAudioGraph();


      if (!ctx) {

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              0
            )
        );


        safeUnlockGuards();

        ctx =
          createAudioGraph();
      }


      if (!ctx) {

        state.unlocked = false;

        return false;
      }


      if (
        ctx.state !== 'running'
      ) {

        try {

          await ctx.resume();

        } catch {}
      }


      state.unlocked =
        ctx.state === 'running';


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


  /* =========================================================
     INTENSITY
  ========================================================= */

  const setIntensity = (
    value,
    hold = 0
  ) => {

    state.targetIntensity =
      clamp(
        Math.round(
          Number(value) || 0
        ),
        0,
        3
      );


    state.tension =
      Math.max(
        state.tension,
        Number(hold) || 0
      );


    if (
      state.filter &&
      state.ctx
    ) {

      try {

        const cutoffs = [
          2400,
          3300,
          4700,
          6800
        ];


        const now =
          state.ctx.currentTime;


        state.filter.frequency.cancelScheduledValues(
          now
        );


        state.filter.frequency.linearRampToValueAtTime(
          cutoffs[
            state.targetIntensity
          ],
          now + 0.35
        );

      } catch {}
    }


    if (
      state.delayGain &&
      state.ctx
    ) {

      try {

        const target =
          state.targetIntensity >= 3
            ? 0.12
            : state.targetIntensity >= 2
              ? 0.095
              : 0.07;


        state.delayGain.gain.linearRampToValueAtTime(
          target,
          state.ctx.currentTime + 0.30
        );

      } catch {}
    }
  };


  /* =========================================================
     BIND GAME SCENE
  ========================================================= */

  const bind = (
    scene
  ) => {

    if (
      !scene ||
      !scene.game ||
      state.scene === scene
    ) {

      return;
    }


    state.sceneCleanup?.();


    state.scene = scene;


    const events =
      scene.game.events;


    if (
      !events ||
      typeof events.on !== 'function'
    ) {

      if (
        state.unlocked &&
        !state.paused
      ) {

        start();
      }


      return;
    }


    const onFeedback =
      kind => {

        const map = {

          warning: [
            3,
            2600
          ],

          chase: [
            3,
            6500
          ],

          hit: [
            2,
            2200
          ],

          death: [
            3,
            5000
          ],

          dash: [
            2,
            900
          ],

          jump: [
            1,
            650
          ],

          checkpoint: [
            1,
            1200
          ],

          complete: [
            1,
            3600
          ],

          land: [
            1,
            500
          ],

          wallJump: [
            2,
            900
          ],

          vault: [
            1,
            650
          ],

          slide: [
            1,
            550
          ]
        };


        const value =
          map[kind];


        if (value) {

          setIntensity(
            value[0],
            value[1]
          );
        }
      };


    const onHealth =
      hp => {

        const n =
          Number(hp);


        if (n <= 1) {

          setIntensity(
            3,
            4200
          );

        } else if (n <= 2) {

          setIntensity(
            2,
            2500
          );
        }
      };


    const onEnergy =
      energy => {

        if (
          Number(energy) <= 18
        ) {

          setIntensity(
            2,
            2200
          );
        }
      };


    const onCombo =
      combo => {

        if (
          Number(combo) >= 4
        ) {

          setIntensity(
            2,
            1600
          );
        }
      };


    const onSector =
      () => {

        setIntensity(
          1,
          1800
        );
      };


    const onComplete =
      () => {

        setIntensity(
          1,
          4000
        );
      };


    const onGameOver =
      () => {

        setIntensity(
          3,
          5000
        );
      };


    events.on(
      'feedback',
      onFeedback
    );

    events.on(
      'health',
      onHealth
    );

    events.on(
      'energy',
      onEnergy
    );

    events.on(
      'combo',
      onCombo
    );

    events.on(
      'sector',
      onSector
    );

    events.on(
      'complete',
      onComplete
    );

    events.on(
      'game-over',
      onGameOver
    );


    state.sceneCleanup =
      () => {

        events.off?.(
          'feedback',
          onFeedback
        );

        events.off?.(
          'health',
          onHealth
        );

        events.off?.(
          'energy',
          onEnergy
        );

        events.off?.(
          'combo',
          onCombo
        );

        events.off?.(
          'sector',
          onSector
        );

        events.off?.(
          'complete',
          onComplete
        );

        events.off?.(
          'game-over',
          onGameOver
        );
      };


    scene.events?.once?.(
      'shutdown',
      () => {

        state.sceneCleanup?.();

        state.sceneCleanup = null;

        state.scene = null;

        stop(true);
      }
    );


    if (
      state.unlocked &&
      !state.paused
    ) {

      start();
    }
  };


  /* =========================================================
     SCENE READY
  ========================================================= */

  const bindRunnerReady =
    event => {

      const scene =
        event?.detail?.scene ||
        window.__relayRunnerScene ||
        null;


      if (scene) {

        window.__relayRunnerScene =
          scene;


        bind(scene);
      }


      if (
        state.unlocked &&
        state.scene &&
        !state.paused
      ) {

        start();
      }
    };


  /* =========================================================
     USER GESTURE UNLOCK
  ========================================================= */

  let gestureUnlocked =
    false;


  const gesture = () => {

    if (gestureUnlocked) {
      return;
    }


    gestureUnlocked = true;


    unlock();
  };


  document.addEventListener(
    'pointerdown',
    gesture,
    {
      capture: true,
      passive: true,
      once: true
    }
  );


  document.addEventListener(
    'touchstart',
    gesture,
    {
      capture: true,
      passive: true,
      once: true
    }
  );


  document.addEventListener(
    'keydown',
    event => {

      if (gestureUnlocked) {
        return;
      }


      if (
        event.key === 'Enter' ||
        event.code === 'Space' ||
        event.key === 'Shift'
      ) {

        gestureUnlocked = true;

        unlock();
      }
    },
    {
      capture: true,
      passive: true,
      once: true
    }
  );


  /* =========================================================
     RUNNER EVENT
  ========================================================= */

  window.addEventListener(
    'relay:runner-scene-ready',
    bindRunnerReady,
    {
      passive: true
    }
  );


  if (
    window.__relayRunnerScene
  ) {

    bind(
      window.__relayRunnerScene
    );
  }


  /* =========================================================
     VISIBILITY
  ========================================================= */

  document.addEventListener(
    'visibilitychange',
    () => {

      if (document.hidden) {

        state.paused = true;

        stop(true);

      } else {

        state.paused = false;


        if (
          state.unlocked &&
          state.scene
        ) {

          try {

            state.ctx?.resume?.();

          } catch {}


          start();
        }
      }
    }
  );


  /* =========================================================
     DYNAMIC GAMEPLAY MONITOR
  ========================================================= */

  state.dynamicsTimer =
    window.setInterval(
      () => {

        if (
          !state.enabled ||
          !state.unlocked ||
          document.hidden
        ) {

          return;
        }


        const pauseMenu =
          document.getElementById(
            'pauseMenu'
          );


        const pauseVisible =
          !!pauseMenu &&
          !pauseMenu.classList.contains(
            'hidden'
          );


        if (
          pauseVisible &&
          !state.paused
        ) {

          state.paused = true;

          stop(true);

        } else if (
          !pauseVisible &&
          state.paused &&
          !document.hidden
        ) {

          state.paused = false;

          start();
        }


        const scene =
          state.scene;


        if (
          !scene ||
          !scene.sys?.isActive?.()
        ) {

          return;
        }


        if (
          !state.running
        ) {

          start();
        }


        const velocity =
          Math.abs(
            scene.player?.body?.velocity?.x ||
            0
          );


        const chaser =
          !!(
            scene.chaser?.visible &&
            scene.chaser?.active
          );


        /* CHASE */

        if (chaser) {

          setIntensity(
            3,
            1000
          );

        }

        /* TENSION EVENT STILL ACTIVE */

        else if (
          state.tension > 0
        ) {

          /* keep current target */
        }

        /* NORMAL MOVEMENT */

        else {

          if (
            velocity > 400
          ) {

            setIntensity(
              2
            );

          } else if (
            velocity > 250
          ) {

            setIntensity(
              1
            );

          } else {

            setIntensity(
              0
            );
          }
        }


        /* SMOOTH INTENSITY */

        state.intensity +=
          (
            state.targetIntensity -
            state.intensity
          ) *
          0.09;


        state.intensity =
          clamp(
            state.intensity,
            0,
            3
          );


        /* TENSION DECAY */

        state.tension =
          Math.max(
            0,
            state.tension - 120
          );


        /* FILTER FOLLOW */

        if (
          state.filter &&
          state.ctx
        ) {

          try {

            const base =
              2400 +
              state.intensity *
              1400;


            state.filter.frequency.linearRampToValueAtTime(
              base,
              state.ctx.currentTime +
              0.25
            );

          } catch {}
        }

      },
      120
    );


  /* =========================================================
     WATCHDOG
  ========================================================= */

  state.watchdog =
    window.setInterval(
      () => {

        if (
          !state.enabled ||
          !state.unlocked ||
          state.paused ||
          document.hidden
        ) {

          return;
        }


        if (
          state.ctx?.state ===
          'suspended'
        ) {

          try {

            state.ctx.resume();

          } catch {}
        }


        if (
          state.scene?.sys?.isActive?.() &&
          !state.running
        ) {

          start();
        }

      },
      500
    );


  /* =========================================================
     PUBLIC API
  ========================================================= */

  window.relayAdaptiveMusic = {

    unlock,

    start,

    stop,

    bind,

    setIntensity,

    setVolume(value) {

      state.volume =
        clamp(
          value,
          0.05,
          0.80
        );


      if (
        state.running
      ) {

        rampMaster(
          state.volume,
          0.18
        );
      }
    },


    setEnabled(value) {

      state.enabled =
        !!value;


      if (
        !state.enabled
      ) {

        stop(true);

      } else if (
        state.unlocked &&
        state.scene &&
        !state.paused
      ) {

        start();
      }
    },


    getState() {

      return {

        running:
          state.running,

        unlocked:
          state.unlocked,

        enabled:
          state.enabled,

        volume:
          state.volume,

        intensity:
          state.intensity,

        targetIntensity:
          state.targetIntensity,

        contextState:
          state.ctx?.state ||
          'none'
      };
    }
  };


})();