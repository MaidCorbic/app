import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 08 FINAL — Audio isolation / no procedural sci-fi menu music.
// Gameplay audio remains procedural and is intentionally isolated from the Home intro.
(() => {
  if (window.__relayAudioFeedbackV3) return;
  window.__relayAudioFeedbackV3 = true;

  let ctx = null;
  let master = null;
  let unlocked = false;
  let musicTimer = null;
  let musicActive = false;
  const seen = new WeakSet();
  const lastShot = new Map();
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  const ensure = async () => {
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.28;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    unlocked = ctx.state === 'running';
    return unlocked;
  };

  const tone = (f, start, duration, volume = 0.08, type = 'sine', endF = f) => {
    if (!ctx || !master || !unlocked) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, f), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endF), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume), start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + duration + .025);
  };

  const noise = (start, duration = .07, volume = .045, high = 1800) => {
    if (!ctx || !master || !unlocked) return;
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'highpass';
    filter.frequency.value = high;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(master);
    source.start(start);
  };

  const play = kind => {
    if (!ctx || !unlocked) return;
    const t = ctx.currentTime + .006;
    if (kind === 'ui') return tone(520, t, .045, .055, 'triangle', 610);
    if (kind === 'signal') return (tone(520, t, .08, .06, 'triangle', 660), tone(780, t + .055, .08, .05, 'triangle', 920));
    if (kind === 'checkpoint') return (tone(330, t, .11, .07, 'triangle', 392), tone(494, t + .08, .13, .06, 'triangle', 587), tone(659, t + .17, .18, .055, 'triangle', 784));
    if (kind === 'combo') return (tone(440, t, .06, .055, 'triangle', 520), tone(660, t + .05, .07, .05, 'triangle', 780), tone(880, t + .11, .1, .045, 'triangle', 1040));
    if (kind === 'dash') return (noise(t, .07, .035, 1200), tone(160, t, .1, .055, 'triangle', 80));
    if (kind === 'hit') return (noise(t, .05, .05, 650), tone(105, t, .1, .065, 'triangle', 58));
    if (kind === 'death') return (tone(190, t, .2, .065, 'triangle', 75), tone(110, t + .07, .24, .045, 'triangle', 45));
    if (kind === 'mission-complete') return (tone(392, t, .1, .06, 'triangle', 440), tone(523, t + .08, .11, .06, 'triangle', 587), tone(659, t + .18, .17, .055, 'triangle', 784));

    // Enemy signatures — deliberately non-sci-fi and clearly separated by enemy.
    if (kind === 'gun') return (noise(t, .022, .095, 900), tone(105, t, .065, .09, 'triangle', 58));
    if (kind === 'egg') return (tone(360, t, .045, .055, 'triangle', 240), noise(t + .025, .075, .09, 1200));
    if (kind === 'dino') return (tone(105, t, .24, .085, 'sawtooth', 55), noise(t + .035, .11, .035, 420));
    if (kind === 'invader') return (tone(320, t, .12, .06, 'triangle', 150), noise(t + .015, .05, .025, 700));
    if (kind === 'alien') return (tone(180, t, .16, .065, 'triangle', 70), noise(t, .05, .025, 650));
    if (kind === 'boss') return (tone(62, t, .26, .1, 'sawtooth', 35), noise(t, .1, .05, 360));
  };

  // IMPORTANT: no oscillator-based Home music. This function is intentionally a no-op.
  // It prevents old callers from reintroducing the sci-fi procedural menu loop.
  const startMusic = () => {
    stopMusic();
  };
  const stopMusic = () => {
    musicActive = false;
    if (musicTimer) clearTimeout(musicTimer);
    musicTimer = null;
  };

  // Never start audio merely because a key/click occurred on Home.
  // The gesture only unlocks the AudioContext for gameplay sounds.
  const gesture = () => ensure();
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(type => document.addEventListener(type, gesture, { passive: true, capture: true }));
  window.addEventListener('blur', stopMusic);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); });

  const intro = document.getElementById('intro');
  if (intro) new MutationObserver(() => { if (intro.classList.contains('hidden')) stopMusic(); }).observe(intro, { attributes: true, attributeFilter: ['class'] });

  const buttonSelectors = '#pauseBtn,#settingsBtn,#resumeBtn,#restartBtn,[data-action="dash"],[data-action="jump"],[data-action="attack"],[data-control="dash"],[data-control="jump"],[data-control="attack"]';
  document.addEventListener('pointerdown', event => {
    if (event.target.closest?.(buttonSelectors)) ensure().then(() => play('ui'));
  }, { passive: true, capture: true });

  ['relay:signal', 'relay:checkpoint', 'relay:combo', 'relay:hit', 'relay:dash', 'relay:death', 'relay:mission-complete'].forEach(type => {
    window.addEventListener(type, () => ensure().then(() => play(type.split(':')[1])));
  });

  const classify = obj => {
    const key = String(obj?.texture?.key || obj?.name || obj?.getData?.('type') || obj?.getData?.('route')?.type || '').toLowerCase();
    if (/egg/.test(key)) return 'egg';
    if (/dino/.test(key)) return 'dino';
    if (/invader|sentinel|storm/.test(key)) return 'invader';
    if (/alien/.test(key)) return 'alien';
    if (/boss|titan|apex/.test(key)) return 'boss';
    if (/bullet|shot|projectile|bolt|laser|plasma|fire|comet|kinetic/.test(key)) return 'gun';
    return null;
  };

  const enemyType = enemy => String(enemy?.getData?.('route')?.type || enemy?.texture?.key || '').toLowerCase();
  const classifyEnemy = enemy => {
    const type = enemyType(enemy);
    if (/chicken|egg/.test(type)) return 'egg';
    if (/dino/.test(type)) return 'dino';
    if (/invader|sentinel|storm/.test(type)) return 'invader';
    if (/alien/.test(type)) return 'alien';
    if (/boss|titan|apex/.test(type)) return 'boss';
    return 'gun';
  };

  const announce = (scene, before) => {
    const enemies = scene.enemies?.getChildren?.() || [];
    for (const obj of scene.children?.list || []) {
      if (!obj?.active || before.has(obj) || seen.has(obj)) continue;
      const direct = classify(obj);
      if (!direct) continue;
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
      if (now - (lastShot.get(sound) || 0) > 110) {
        lastShot.set(sound, now);
        ensure().then(() => play(sound));
      }
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
