(() => {
  if (window.__relayMenuMusicInstalled) return;
  window.__relayMenuMusicInstalled = true;
  let context = null;
  let master = null;
  let timer = null;
  let active = false;
  let enabled = localStorage.getItem('relay_music_enabled') !== '0';
  let volume = Number(localStorage.getItem('relay_music_volume'));
  if (!Number.isFinite(volume)) volume = 0.09;
  volume = Math.max(0, Math.min(0.16, volume));

  const getContext = () => {
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    context ||= new AudioContext();
    return context;
  };

  const tone = (frequency, start, duration, level, type = 'triangle') => {
    if (!context || !master) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(level, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  };

  const stop = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    active = false;
    if (master) { try { master.disconnect(); } catch {} master = null; }
  };

  const playLoop = () => {
    if (!active || !context || !master || !enabled) return;
    const now = context.currentTime + 0.02;
    const beat = 0.24;
    const melody = [261.63,329.63,392,523.25,493.88,392,329.63,293.66,261.63,329.63,440,523.25,587.33,523.25,440,392];
    const bass = [130.81,164.81,196,220];
    melody.forEach((f,i) => tone(f, now+i*beat, beat*0.78, 0.22));
    bass.forEach((f,i) => tone(f, now+i*beat*4, beat*2.8, 0.13, 'sine'));
    [0,4,8,12].forEach(i => tone(melody[i]*2, now+i*beat, 0.07, 0.055, 'square'));
    timer = setTimeout(playLoop, melody.length*beat*1000-20);
  };

  const start = () => {
    const intro = document.getElementById('intro');
    if (!enabled || !intro || intro.classList.contains('hidden') || active) return;
    const ctx = getContext();
    if (!ctx) return;
    const begin = () => {
      if (!document.getElementById('intro') || document.getElementById('intro').classList.contains('hidden')) return;
      stop();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
      active = true;
      playLoop();
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(begin).catch(() => {});
      return;
    }
    begin();
  };

  const setEnabled = value => {
    enabled = Boolean(value);
    localStorage.setItem('relay_music_enabled', enabled ? '1' : '0');
    if (!enabled) stop();
    else start();
    return enabled;
  };

  const setVolume = value => {
    const next = Number(value);
    if (!Number.isFinite(next)) return volume;
    volume = Math.max(0, Math.min(0.16, next));
    localStorage.setItem('relay_music_volume', String(volume));
    if (master) master.gain.value = volume;
    return volume;
  };

  const boot = () => start();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  const gestureStart = () => start();
  ['pointerdown','touchend','click','keydown'].forEach(type => {
    document.addEventListener(type, gestureStart, { passive: true, capture: true });
  });

  window.addEventListener('blur', stop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });

  window.relayMenuMusic = { start, stop, setEnabled, setVolume, get enabled() { return enabled; }, get volume() { return volume; } };
})();