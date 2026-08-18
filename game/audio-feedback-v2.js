import { RunnerScene } from './src/scenes/RunnerScene.js';

(() => {
  if (window.__relayAudioFeedbackV4) return;
  window.__relayAudioFeedbackV4 = true;

  let ctx = null, master = null, musicGain = null, musicTimer = null;
  let unlocked = false, musicActive = false;
  const seen = new WeakSet(), lastShot = new Map();
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  const ensure = async () => {
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.38;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    unlocked = ctx.state === 'running';
    return unlocked;
  };

  const tone = (f, start, duration, volume = .06, type = 'triangle', endF = f, destination = master) => {
    if (!ctx || !destination || !unlocked) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, f), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endF), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume), start + Math.min(.02, duration * .16));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain).connect(destination);
    osc.start(start);
    osc.stop(start + duration + .025);
  };

  const noise = (start, duration = .06, volume = .06, low = 700, high = 3600) => {
    if (!ctx || !master || !unlocked) return;
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    filter.type = 'bandpass'; filter.frequency.value = (low + high) / 2; filter.Q.value = .7;
    gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.buffer = buffer; source.connect(filter).connect(gain).connect(master); source.start(start);
  };

  const stopMusic = () => {
    musicActive = false;
    if (musicTimer) clearTimeout(musicTimer);
    musicTimer = null;
    if (musicGain) {
      const now = ctx?.currentTime || 0;
      try { musicGain.gain.cancelScheduledValues(now); musicGain.gain.setTargetAtTime(.0001, now, .035); } catch {}
      try { musicGain.disconnect(); } catch {}
      musicGain = null;
    }
  };

  // Calm modern Home bed: warm chords, no sci-fi square-wave/laser lead.
  const musicBar = () => {
    if (!musicActive || !ctx || !musicGain || !unlocked) return;
    const start = ctx.currentTime + .04;
    const chords = [
      [261.63, 329.63, 392.00],
      [220.00, 277.18, 329.63],
      [246.94, 293.66, 369.99],
      [196.00, 246.94, 293.66]
    ];
    chords.forEach((chord, bar) => {
      const t = start + bar * 1.15;
      chord.forEach((f, i) => tone(f, t + i * .025, .92, .032, 'sine', f * .997, musicGain));
      tone(chord[0] / 2, t, 1.05, .018, 'sine', chord[0] / 2, musicGain);
    });
    musicTimer = setTimeout(musicBar, 4520);
  };

  const startMusic = async () => {
    const intro = document.getElementById('intro');
    if (!intro || intro.classList.contains('hidden')) return;
    if (!(await ensure())) return;
    if (musicActive) return;
    musicActive = true;
    musicGain = ctx.createGain();
    musicGain.gain.value = .62;
    musicGain.connect(master);
    musicBar();
  };

  const play = kind => {
    if (!ctx || !unlocked) return;
    const t = ctx.currentTime + .006;
    if (kind === 'ui') return tone(520, t, .045, .055, 'triangle', 610);
    if (kind === 'signal') return (tone(523, t, .08, .065, 'triangle', 659), tone(784, t + .055, .09, .055, 'triangle', 988));
    if (kind === 'checkpoint') return (tone(330, t, .1, .07, 'triangle', 392), tone(494, t + .08, .13, .06, 'triangle', 587), tone(659, t + .17, .18, .055, 'triangle', 784));
    if (kind === 'combo') return (tone(440, t, .06, .055, 'triangle', 520), tone(660, t + .05, .07, .05, 'triangle', 780), tone(880, t + .11, .1, .045, 'triangle', 1040));
    if (kind === 'dash') return (noise(t, .065, .035, 900, 2500), tone(150, t, .1, .055, 'triangle', 75));
    if (kind === 'hit') return (noise(t, .05, .05, 500, 2200), tone(105, t, .1, .065, 'triangle', 58));
    if (kind === 'death') return (tone(190, t, .2, .065, 'triangle', 75), tone(110, t + .07, .24, .045, 'triangle', 45));
    if (kind === 'mission-complete') return (tone(392, t, .1, .06, 'triangle', 440), tone(523, t + .08, .11, .06, 'triangle', 587), tone(659, t + .18, .17, .055, 'triangle', 784));

    // Natural game-like enemy signatures. No sci-fi laser/plasma audio.
    if (kind === 'gun') return (noise(t, .035, .11, 650, 2800), tone(115, t, .07, .095, 'triangle', 52));
    if (kind === 'egg') return (tone(390, t, .045, .055, 'triangle', 250), noise(t + .025, .09, .10, 900, 2500));
    if (kind === 'dino') return (tone(105, t, .22, .085, 'sawtooth', 52), noise(t + .035, .1, .04, 300, 900));
    if (kind === 'invader') return (tone(210, t, .11, .055, 'triangle', 110), noise(t + .02, .055, .025, 500, 1400));
    if (kind === 'alien') return (tone(165, t, .15, .055, 'triangle', 75), noise(t, .05, .025, 500, 1300));
    if (kind === 'boss') return (tone(62, t, .26, .1, 'sawtooth', 35), noise(t, .1, .05, 250, 900));
  };

  const gesture = () => ensure();
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(type => document.addEventListener(type, gesture, { passive: true, capture: true }));

  const intro = document.getElementById('intro');
  if (intro) new MutationObserver(() => {
    if (intro.classList.contains('hidden')) stopMusic();
  }).observe(intro, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('pointerdown', event => {
    const target = event.target.closest?.('#pauseBtn,#settingsBtn,#resumeBtn,#restartBtn,[data-action="dash"],[data-action="jump"],[data-action="attack"],[data-control="dash"],[data-control="jump"],[data-control="attack"]');
    if (target) ensure().then(() => play('ui'));
    if (intro && !intro.classList.contains('hidden')) startMusic();
  }, { passive: true, capture: true });

  ['relay:signal', 'relay:checkpoint', 'relay:combo', 'relay:hit', 'relay:dash', 'relay:death', 'relay:mission-complete'].forEach(type => window.addEventListener(type, () => ensure().then(() => play(type.split(':')[1]))));

  const classify = obj => {
    const key = String(obj?.texture?.key || obj?.name || obj?.getData?.('type') || obj?.getData?.('route')?.type || '').toLowerCase();
    if (/egg/.test(key)) return 'egg';
    if (/dino/.test(key)) return 'dino';
    if (/invader|sentinel|storm/.test(key)) return 'invader';
    if (/alien/.test(key)) return 'alien';
    if (/boss|titan|apex/.test(key)) return 'boss';
    if (/bullet|shot|projectile|bolt|fire|comet|kinetic/.test(key)) return 'gun';
    return null;
  };
  const enemyType = enemy => String(enemy?.getData?.('route')?.type || enemy?.texture?.key || '').toLowerCase();
  const classifyEnemy = enemy => /chicken|egg/.test(enemyType(enemy)) ? 'egg' : /dino/.test(enemyType(enemy)) ? 'dino' : /invader|sentinel|storm/.test(enemyType(enemy)) ? 'invader' : /alien/.test(enemyType(enemy)) ? 'alien' : /boss|titan|apex/.test(enemyType(enemy)) ? 'boss' : 'gun';

  const announce = (scene, before) => {
    const enemies = scene.enemies?.getChildren?.() || [];
    for (const obj of scene.children?.list || []) {
      if (!obj?.active || before.has(obj) || seen.has(obj)) continue;
      const direct = classify(obj); if (!direct) continue;
      seen.add(obj);
      let sound = direct;
      if (direct === 'gun') {
        let nearest = null, best = Infinity;
        for (const enemy of enemies) {
          if (!enemy?.active) continue;
          const d = Math.hypot((enemy.x || 0) - (obj.x || 0), (enemy.y || 0) - (obj.y || 0));
          if (d < best) { best = d; nearest = enemy; }
        }
        if (nearest && best < 260) sound = classifyEnemy(nearest);
      }
      const now = performance.now();
      if (now - (lastShot.get(sound) || 0) > 110) { lastShot.set(sound, now); ensure().then(() => play(sound)); }
    }
  };

  const wrap = name => {
    const original = RunnerScene.prototype[name];
    if (typeof original !== 'function' || RunnerScene.prototype[`__relayAudioWrapped_${name}`]) return;
    RunnerScene.prototype[name] = function trackedAudioUpdate(...args) {
      const before = new Set(this.children?.list || []);
      const result = original.apply(this, args);
      announce(this, before);
      return result;
    };
    RunnerScene.prototype[`__relayAudioWrapped_${name}`] = true;
  };
  wrap('updateEnemies');
  wrap('updateSciFiThreats');

  window.relayAudioV2 = { ensure, play, startMusic, stopMusic };
})();