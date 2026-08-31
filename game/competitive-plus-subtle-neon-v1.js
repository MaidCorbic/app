/* Relay Runner — Competitive Plus / Subtle Neon runtime hooks. */
(() => {
  'use strict';
  const root = () => document.querySelector('#game #play');
  const pulse = (kind) => {
    const r = root(); if (!r) return;
    let el = r.querySelector('.cp-feedback-pulse');
    if (!el) { el = document.createElement('div'); el.className = 'cp-feedback-pulse'; r.appendChild(el); }
    el.className = `cp-feedback-pulse ${kind || 'is-cyan'}`;
    void el.offsetWidth;
    setTimeout(() => { if (el) el.className = 'cp-feedback-pulse'; }, 520);
  };
  const flashAction = (name) => {
    const r = root(); if (!r || !name) return;
    let b;
    try { b = r.querySelector(`[data-mobile-action="${CSS.escape(String(name))}"]`); } catch { return; }
    if (!b) return;
    b.classList.remove('cp-feedback'); void b.offsetWidth; b.classList.add('cp-feedback');
    setTimeout(() => b.classList.remove('cp-feedback'), 300);
  };
  document.addEventListener('relay:signal', () => { const r=root(); r?.querySelector('.hud-progress')?.classList.add('cp-active'); pulse('is-cyan'); setTimeout(() => r?.querySelector('.hud-progress')?.classList.remove('cp-active'),360); });
  document.addEventListener('relay:objective', () => { const r=root(); r?.querySelector('.world-marker')?.classList.add('cp-alert'); pulse('is-amber'); setTimeout(() => r?.querySelector('.world-marker')?.classList.remove('cp-alert'),500); });
  document.addEventListener('relay:damage', () => pulse('is-red'));
  document.addEventListener('relay:xp', () => { const r=root(); const x=r?.querySelector('.hud-xp'); if(!x)return; x.classList.add('cp-gain'); setTimeout(()=>x.classList.remove('cp-gain'),520); });
  document.addEventListener('relay:action', e => flashAction(e?.detail?.action));
})();
