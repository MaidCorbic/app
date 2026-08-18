// UPDATE 08 V2 — responsive game audio
// WebAudio-only, no external assets. Designed for mobile-safe user-gesture startup.
(() => {
  if (window.__relayAudioV2) return;
  window.__relayAudioV2 = true;

  let ctx = null;
  let master = null;
  let musicGain = null;
  let musicTimer = null;
  let musicActive = false;
  let lastProjectileSound = 0;
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const ensure = () => {
    if (ctx) return ctx;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.42;
    master.connect(ctx.destination);
    return ctx;
  };

  const resume = async () => {
    const audio = ensure();
    if (!audio) return null;
    if (audio.state === 'suspended') await audio.resume().catch(() => {});
    return audio.state === 'running' ? audio : null;
  };

  const tone = (freq, duration, volume = 0.035, type = 'sine', when = null, endFreq = null) => {
    if (!ctx || !master) return;
    const now = when ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(0.025, duration * .2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + duration + .02);
  };

  const noise = (duration = .08, volume = .018, cutoff = 1800) => {
    if (!ctx || !master) return;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(master);
    source.start();
  };

  const stopMusic = () => {
    if (musicTimer) clearTimeout(musicTimer);
    musicTimer = null;
    musicActive = false;
    if (musicGain) {
      try { musicGain.disconnect(); } catch {}
      musicGain = null;
    }
  };

  const musicBar = () => {
    if (!musicActive || !ctx || !musicGain) return;
    const now = ctx.currentTime + .04;
    const notes = [220, 261.63, 329.63, 392, 329.63, 293.66, 261.63, 329.63];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * .48;
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.linearRampToValueAtTime(.028, start + .08);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .40);
      osc.connect(gain).connect(musicGain);
      osc.start(start);
      osc.stop(start + .43);
    });
    // soft low pad, deliberately quiet so gameplay/UI remains clear
    tone(110, 3.4, .012, 'sine', now, 108);
    musicTimer = setTimeout(musicBar, 3800);
  };

  const startMusic = async () => {
    if (musicActive) return;
    const audio = await resume();
    if (!audio) return;
    stopMusic();
    musicGain = ctx.createGain();
    musicGain.gain.value = reduced() ? .012 : .028;
    musicGain.connect(master);
    musicActive = true;
    musicBar();
  };

  const play = async kind => {
    const audio = await resume();
    if (!audio) return;
    const now = ctx.currentTime;
    switch (kind) {
      case 'button': tone(620, .055, .028, 'sine', now, 760); break;
      case 'collect': tone(660, .08, .035, 'triangle', now, 990); tone(990, .10, .022, 'triangle', now + .055, 1320); break;
      case 'checkpoint': tone(392, .10, .03, 'sine', now); tone(523.25, .16, .025, 'sine', now + .08); break;
      case 'combo': tone(523.25, .07, .03, 'triangle', now, 784); tone(659.25, .10, .025, 'triangle', now + .06, 988); break;
      case 'dash': noise(.055, .014, 2600); tone(180, .09, .026, 'sine', now, 95); break;
      case 'hit': noise(.045, .022, 3200); tone(120, .08, .03, 'triangle', now, 75); break;
      case 'death': tone(220, .28, .035, 'sawtooth', now, 55); break;
      case 'mission': tone(392, .10, .025, 'sine', now); tone(523.25, .10, .025, 'sine', now + .08); tone(659.25, .18, .028, 'sine', now + .16); break;
      case 'enemy-shot': noise(.035, .014, 4200); tone(260, .09, .026, 'square', now, 145); break;
      default: break;
    }
  };

  const bind = (type, sound) => window.addEventListener(type, () => play(sound));
  bind('relay:signal', 'collect');
  bind('relay:checkpoint', 'checkpoint');
  bind('relay:combo', 'combo');
  bind('relay:dash', 'dash');
  bind('relay:hit', 'hit');
  bind('relay:death', 'death');
  bind('relay:mission-complete', 'mission');
  bind('relay:enemy-shot', 'enemy-shot');

  document.addEventListener('pointerdown', event => {
    const button = event.target.closest?.('button, [role="button"], [data-action], [data-control]');
    if (button) play('button');
    const intro = document.getElementById('intro');
    if (intro && !intro.classList.contains('hidden')) startMusic();
  }, { passive: true, capture: true });

  document.addEventListener('keydown', () => {
    const intro = document.getElementById('intro');
    if (intro && !intro.classList.contains('hidden')) startMusic();
  }, { passive: true, capture: true });

  const updateProjectileAudio = () => {
    const now = performance.now();
    if (now - lastProjectileSound < 180) return;
    const game = document.querySelector('#game');
    const canvas = game?.querySelector('canvas') || document.querySelector('canvas');
    if (!canvas) return;
    const scene = window.game?.scene?.getScenes?.(true)?.[0] || window.runnerGame?.scene?.getScenes?.(true)?.[0];
    const children = scene?.children?.list;
    if (!Array.isArray(children)) return;
    const projectile = children.find(obj => {
      if (!obj?.active || obj.getData?.('relayAudioProjectileSeen')) return false;
      const key = String(obj.texture?.key || obj.getData?.('type') || '').toLowerCase();
      return /(projectile|bullet|bolt|plasma|egg|comet|shot)/.test(key) && obj.body;
    });
    if (!projectile) return;
    projectile.setData?.('relayAudioProjectileSeen', true);
    lastProjectileSound = now;
    play('enemy-shot');
  };

  window.setInterval(updateProjectileAudio, 120);
  window.addEventListener('blur', stopMusic);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); });

  window.relayAudioV2 = { startMusic, stopMusic, play };
})();
