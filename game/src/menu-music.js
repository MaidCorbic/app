(() => {
  if (window.__relayMenuMusicInstalled) return;
  window.__relayMenuMusicInstalled = true;
  let context = null;
  let master = null;
  let timer = null;
  let active = false;
  let unlockShown = false;

  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
  const intro = () => document.getElementById('intro');

  const getContext = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context ||= new AudioContext();
    return context;
  };

  const tone = (frequency, start, duration, volume, type = 'triangle') => {
    if (!context || !master) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.015);
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
    if (!active || !context || !master || intro()?.classList.contains('hidden')) return;
    const now = context.currentTime + 0.04;
    const beat = 0.24;
    const melody = [261.63,329.63,392,523.25,493.88,392,329.63,293.66,261.63,329.63,440,523.25,587.33,523.25,440,392];
    const bass = [130.81,164.81,196,220];
    melody.forEach((f,i)=>tone(f,now+i*beat,beat*.78,.22));
    bass.forEach((f,i)=>tone(f,now+i*beat*4,beat*2.8,.13,'sine'));
    [0,4,8,12].forEach(i=>tone(melody[i]*2,now+i*beat,.07,.055,'square'));
    timer = setTimeout(playLoop, melody.length * beat * 1000 - 20);
  };

  const start = async () => {
    const screen = intro();
    if (!screen || screen.classList.contains('hidden') || active) return false;
    const audio = getContext();
    if (!audio) return false;
    try {
      if (audio.state !== 'running') await audio.resume();
    } catch { return false; }
    if (audio.state !== 'running') return false;
    stop();
    master = audio.createGain();
    master.gain.value = 0.045;
    master.connect(audio.destination);
    active = true;
    playLoop();
    hideUnlock();
    return true;
  };

  const hideUnlock = () => {
    document.getElementById('menuAudioUnlock')?.remove();
    unlockShown = false;
  };

  const showUnlock = () => {
    if (!mobile || unlockShown || !intro() || intro().classList.contains('hidden')) return;
    unlockShown = true;
    const style = document.createElement('style');
    style.id = 'menuAudioUnlockStyle';
    style.textContent = '#menuAudioUnlock{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(3,8,18,.28);backdrop-filter:blur(2px);touch-action:manipulation}#menuAudioUnlock button{border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:15px 24px;background:rgba(8,18,35,.9);color:#fff;font:700 13px/1 system-ui;letter-spacing:.12em;box-shadow:0 8px 30px rgba(0,0,0,.3)}';
    document.head.appendChild(style);
    const overlay = document.createElement('div');
    overlay.id = 'menuAudioUnlock';
    overlay.innerHTML = '<button type="button">TAP TO START</button>';
    document.body.appendChild(overlay);
    const unlock = async event => {
      event.preventDefault();
      const ok = await start();
      if (ok) { overlay.remove(); style.remove(); }
    };
    overlay.addEventListener('pointerdown', unlock, { passive:false, once:true });
    overlay.addEventListener('touchstart', unlock, { passive:false, once:true });
  };

  const boot = async () => {
    const ok = await start();
    if (!ok) showUnlock();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();

  // If mobile autoplay is blocked, this is the first and only required interaction.
  document.addEventListener('pointerdown', () => { if (!active) start().catch?.(()=>{}); }, { passive:true });
  document.addEventListener('keydown', () => { if (!active) start().catch?.(()=>{}); }, { passive:true });
  window.addEventListener('blur', stop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!intro()?.classList.contains('hidden')) boot();
  });
  window.relayMenuMusic = { start, stop };
})();