// V10 Perception Gameplay — four audited, distinct gameplay loops.
// Self-contained, pointer/touch + keyboard, no ownership of existing movement keys.

export function installGameplayExpansionV10({ root = document, gameState = {}, onEvent } = {}) {
  if (!root || root.__gameplayV10) return root?.__gameplayV10;

  const state = gameState.v10Perception ||= {
    mirror: { angle: 0, hits: 0 },
    symbols: { progress: 0, solved: false },
    memory: { revealed: false, marks: 0 },
    camera: { composition: 0, captures: 0 },
  };

  const emit = (type, data = {}) => onEvent?.({ type, version: 'v10', ...data });
  const q = (s) => root.querySelector?.(s);
  const mk = (tag, cls, text) => { const e = root.createElement ? root.createElement(tag) : document.createElement(tag); e.className = cls; e.textContent = text; return e; };

  const panel = mk('section', 'gameplay-v10-perception', '');
  panel.setAttribute('aria-label', 'V10 Perception Gameplay');
  panel.innerHTML = `
    <div class="v10-title">PERCEPTION // FIELD MODULE</div>
    <div class="v10-grid">
      <button data-v10="mirror">MIRROR ROUTING <span>↻</span></button>
      <button data-v10="symbols">SYMBOL TRANSLATION <span>◈</span></button>
      <button data-v10="memory">MEMORY MAP <span>⌖</span></button>
      <button data-v10="camera">PHOTO COMPOSITION <span>◎</span></button>
    </div>
    <div class="v10-readout" aria-live="polite">Select a field interaction.</div>`;

  const style = root.createElement ? root.createElement('style') : document.createElement('style');
  style.textContent = `.gameplay-v10-perception{position:fixed;left:16px;bottom:84px;z-index:4100;max-width:min(520px,calc(100vw - 32px));padding:12px;border:1px solid rgba(56,189,248,.55);border-radius:14px;background:rgba(3,10,20,.94);box-shadow:0 0 24px rgba(56,189,248,.18);font:600 12px/1.25 system-ui,sans-serif;color:#e5f6ff}.v10-title{letter-spacing:.14em;margin-bottom:9px}.v10-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.v10-grid button{min-height:44px;border:1px solid rgba(148,163,184,.35);border-radius:10px;background:rgba(15,23,42,.92);color:#e2e8f0;font-weight:800;cursor:pointer}.v10-grid button:hover,.v10-grid button:focus-visible{border-color:rgba(56,189,248,.9);box-shadow:0 0 14px rgba(56,189,248,.25);outline:none}.v10-grid span{opacity:.8;margin-left:5px}.v10-readout{margin-top:9px;min-height:30px;color:#bae6fd}@media(max-width:600px){.gameplay-v10-perception{left:10px;right:10px;bottom:76px;max-width:none}.v10-grid{grid-template-columns:1fr 1fr}.v10-grid button{min-height:48px;font-size:11px}}`;
  root.head?.appendChild(style) || document.head.appendChild(style);
  root.body?.appendChild(panel) || document.body.appendChild(panel);

  const readout = panel.querySelector('.v10-readout');
  const action = (name) => {
    if (name === 'mirror') { state.mirror.angle = (state.mirror.angle + 90) % 360; state.mirror.hits++; readout.textContent = `Mirror aligned ${state.mirror.angle}° — reflection route updated.`; emit('mirror-route-updated', state.mirror); }
    if (name === 'symbols') { state.symbols.progress = Math.min(3, state.symbols.progress + 1); state.symbols.solved = state.symbols.progress === 3; readout.textContent = state.symbols.solved ? 'Symbol translation verified — encoded route unlocked.' : `Translation ${state.symbols.progress}/3 — identify the next symbol.`; emit('symbol-translation', state.symbols); }
    if (name === 'memory') { state.memory.revealed = !state.memory.revealed; if (state.memory.revealed) state.memory.marks++; readout.textContent = state.memory.revealed ? 'Memory map revealed — mark the landmark before leaving.' : `Memory map hidden — ${state.memory.marks} landmark(s) retained.`; emit('memory-map-toggle', state.memory); }
    if (name === 'camera') { state.camera.composition = (state.camera.composition + 1) % 4; state.camera.captures++; readout.textContent = `Composition frame ${state.camera.composition + 1}/4 — ${state.camera.composition === 3 ? 'valid frame.' : 'reposition for a valid frame.'}`; emit('photo-composition', state.camera); }
  };
  panel.addEventListener('pointerdown', (e) => { const b = e.target.closest?.('[data-v10]'); if (b) { e.preventDefault(); action(b.dataset.v10); } });
  const keys = { m: 'mirror', y: 'symbols', u: 'memory', p: 'camera' };
  const keyHandler = (e) => { if (e.ctrlKey || e.metaKey || e.altKey) return; const target = e.target; if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return; const n = keys[e.key.toLowerCase()]; if (n) { e.preventDefault(); action(n); } };
  root.addEventListener?.('keydown', keyHandler);

  root.__gameplayV10 = { state, panel, destroy() { panel.remove(); style.remove(); root.removeEventListener?.('keydown', keyHandler); delete root.__gameplayV10; } };
  emit('v10-installed');
  return root.__gameplayV10;
}
