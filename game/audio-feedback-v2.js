import { RunnerScene } from './src/scenes/RunnerScene.js';

(() => {
  if (window.__relayAudioFeedbackV2) return;
  window.__relayAudioFeedbackV2 = true;

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
      master.gain.value = 0.20;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    unlocked = ctx.state === 'running';
    return unlocked;
  };

  const tone = (f, start, duration, volume = 0.08, type = 'sine', endF = f) => {
    if (!ctx || !master || !unlocked) return;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, f), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endF), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(master); osc.start(start); osc.stop(start + duration + 0.025);
  };

  const noise = (start, duration = .07, volume = .045, high = 1800) => {
    if (!ctx || !master || !unlocked) return;
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    filter.type = 'highpass'; filter.frequency.value = high;
    gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.buffer = buffer; source.connect(filter).connect(gain).connect(master); source.start(start);
  };

  const play = (kind = 'ui') => {
    if (!ctx || !unlocked) return;
    const t = ctx.currentTime + .006;
    if (kind === 'ui') return tone(740, t, .055, .065, 'sine', 920);
    if (kind === 'collect') return (tone(660, t, .08, .08), tone(990, t + .055, .12, .065));
    if (kind === 'checkpoint') return (tone(392, t, .12, .08), tone(587, t + .08, .16, .075), tone(784, t + .17, .22, .065));
    if (kind === 'combo') return (tone(520, t, .07, .07), tone(780, t + .05, .08, .065), tone(1040, t + .11, .12, .06));
    if (kind === 'dash') return (noise(t, .08, .04, 1200), tone(180, t, .11, .06, 'sine', 85));
    if (kind === 'hit') return (noise(t, .055, .055, 700), tone(115, t, .12, .075, 'triangle', 65));
    if (kind === 'death') return (tone(220, t, .22, .075, 'sine', 90), tone(130, t + .08, .3, .055, 'triangle', 55));
    if (kind === 'mission') return (tone(440, t, .11, .065), tone(660, t + .09, .12, .07), tone(880, t + .19, .2, .065));

    if (kind === 'gun') { noise(t, .028, .08, 1050); tone(145, t, .075, .09, 'triangle', 72); return; }
    if (kind === 'egg') { tone(470, t, .055, .065, 'triangle', 320); noise(t + .04, .085, .075, 1350); return; }
    if (kind === 'dino') { tone(125, t, .22, .08, 'sawtooth', 70); noise(t + .03, .1, .03, 500); return; }
    if (kind === 'invader') { tone(880, t, .11, .075, 'sine', 360); tone(1320, t + .02, .055, .04, 'triangle', 620); return; }
    if (kind === 'alien') { tone(245, t, .15, .075, 'triangle', 105); noise(t, .055, .03, 1000); return; }
    if (kind === 'boss') { tone(82, t, .25, .095, 'sine', 42); noise(t, .09, .045, 450); return; }
  };

  const startMusic = () => {
    if (musicActive || !unlocked) return;
    musicActive = true;
    const loop = () => {
      if (!musicActive || !ctx) return;
      const t = ctx.currentTime + .02;
      // Warm, modern menu bed; deliberately no sci-fi laser/bleep timbre.
      [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23].forEach((f, i) => tone(f, t + i * .38, .58, .022, 'triangle'));
      [130.81, 146.83, 164.81, 146.83].forEach((f, i) => tone(f, t + i * .76, .65, .015, 'sine'));
      musicTimer = setTimeout(loop, 3040);
    };
    loop();
  };
  const stopMusic = () => { musicActive = false; if (musicTimer) clearTimeout(musicTimer); musicTimer = null; };

  const gesture = () => ensure().then(() => { if (document.getElementById('intro')) startMusic(); });
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(type => document.addEventListener(type, gesture, { passive: true, capture: true }));
  window.addEventListener('blur', stopMusic);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); });

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
    if (/alien|plasma/.test(key)) return 'alien';
    if (/boss|titan|apex/.test(key)) return 'boss';
    if (/bullet|shot|projectile|bolt|laser|plasma|fire|comet|kinetic/.test(key)) return 'gun';
    return null;
  };
  const enemyType = enemy => String(enemy?.getData?.('route')?.type || enemy?.texture?.key || '').toLowerCase();
  const classifyEnemy = enemy => /chicken/.test(enemyType(enemy)) ? 'egg' : /dino/.test(enemyType(enemy)) ? 'dino' : /invader|sentinel|storm/.test(enemyType(enemy)) ? 'invader' : /alien/.test(enemyType(enemy)) ? 'alien' : /boss|titan|apex/.test(enemyType(enemy)) ? 'boss' : 'gun';

  const announceNewProjectiles = (scene, before) => {
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
      if (now - (lastShot.get(sound) || 0) > 110) { lastShot.set(sound, now); ensure().then(() => play(sound)); }
    }
  };

  const wrapAttackMethod = name => {
    const original = RunnerScene.prototype[name];
    if (typeof original !== 'function' || RunnerScene.prototype[`__relayAudioWrapped_${name}`]) return;
    RunnerScene.prototype[name] = function audioTrackedUpdate(...args) {
      const before = new Set(this.children?.list || []);
      const result = original.apply(this, args);
      announceNewProjectiles(this, before);
      return result;
    };
    RunnerScene.prototype[`__relayAudioWrapped_${name}`] = true;
  };
  wrapAttackMethod('updateEnemies');
  wrapAttackMethod('updateSciFiThreats');

  window.relayAudioV2 = { ensure, play, startMusic, stopMusic };
})();
