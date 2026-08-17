const play = document.getElementById('play');

if (play && !play.dataset.signalSystemV1) {
  play.dataset.signalSystemV1 = 'ready';

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = './signal-system-v1.css';
  document.head.appendChild(style);

  const system = document.createElement('section');
  system.className = 'signal-system-v1';
  system.setAttribute('aria-live', 'polite');
  system.innerHTML = `
    <div class="signal-system-card">
      <div class="signal-system-head">
        <span>RELAY SIGNAL NETWORK</span>
        <b id="signalSystemCount">00 / 00</b>
      </div>
      <div class="signal-system-rail" aria-hidden="true">
        <i></i><i></i><i></i><i></i><i></i><i></i>
      </div>
      <div class="signal-system-meta">
        <span>ROUTE PROGRESS <strong id="signalSystemProgress">0%</strong></span>
        <span>CHECKPOINT <strong id="signalSystemCheckpoint">01</strong></span>
      </div>
      <div class="signal-system-combo" id="signalSystemCombo">
        <span>RELAY FLOW</span><b id="signalSystemComboValue">x2</b><span><i id="signalSystemComboBar"></i></span>
      </div>
      <b class="signal-system-pop" id="signalSystemPop">SIGNAL SECURED</b>
    </div>`;
  play.appendChild(system);

  const countEl = system.querySelector('#signalSystemCount');
  const progressEl = system.querySelector('#signalSystemProgress');
  const checkpointEl = system.querySelector('#signalSystemCheckpoint');
  const comboEl = system.querySelector('#signalSystemCombo');
  const comboValueEl = system.querySelector('#signalSystemComboValue');
  const comboBarEl = system.querySelector('#signalSystemComboBar');
  const popEl = system.querySelector('#signalSystemPop');
  const segments = [...system.querySelectorAll('.signal-system-rail i')];

  let count = 0;
  let total = 0;
  let combo = 0;
  let comboDeadline = 0;
  let checkpoint = 0;
  let lastSignalAt = 0;
  let comboTimer;
  let activeRun = false;
  const comboWindow = 2600;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const show = () => play.classList.add('signal-system-active');
  const hide = () => play.classList.remove('signal-system-active');

  const render = () => {
    countEl.textContent = `${String(count).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    const percent = total ? Math.round((count / total) * 100) : 0;
    progressEl.textContent = `${percent}%`;
    const visibleSegments = total ? Math.min(6, Math.max(1, Math.ceil(total / 6))) : 6;
    segments.forEach((segment, index) => {
      const threshold = Math.ceil(total * ((index + 1) / visibleSegments));
      segment.classList.toggle('is-collected', total > 0 && count >= threshold);
      segment.classList.toggle('is-final', total > 0 && count >= total && index === visibleSegments - 1);
    });
    checkpointEl.textContent = String(checkpoint + 1).padStart(2, '0');
  };

  const clearCombo = () => {
    window.clearTimeout(comboTimer);
    combo = 0;
    comboDeadline = 0;
    comboEl.classList.remove('is-visible');
    comboBarEl.style.width = '0%';
  };

  const renderCombo = () => {
    if (combo < 2 || !comboDeadline) {
      clearCombo();
      return;
    }
    comboValueEl.textContent = `x${combo}`;
    comboEl.classList.add('is-visible');
    const remaining = Math.max(0, comboDeadline - performance.now());
    comboBarEl.style.width = `${Math.min(100, remaining / comboWindow * 100)}%`;
    if (remaining > 0) comboTimer = window.setTimeout(renderCombo, 50);
    else clearCombo();
  };

  const pop = text => {
    popEl.textContent = text;
    popEl.classList.remove('is-showing');
    void popEl.offsetWidth;
    popEl.classList.add('is-showing');
  };

  const onSignalCountChange = () => {
    const signalCount = document.getElementById('signalCount');
    const signalTotal = document.getElementById('signalTotal');
    if (!signalCount || !signalTotal) return;
    const nextCount = Number(signalCount.textContent) || 0;
    const nextTotal = Number(signalTotal.textContent) || 0;
    if (!activeRun || nextTotal !== total || nextCount < count) {
      count = nextCount;
      total = nextTotal;
      combo = 0;
      checkpoint = 0;
      lastSignalAt = 0;
      clearCombo();
      activeRun = true;
      show();
      render();
      return;
    }
    if (nextCount === count) return;
    const now = performance.now();
    combo = now - lastSignalAt <= comboWindow ? combo + 1 : 1;
    lastSignalAt = now;
    count = nextCount;
    total = nextTotal;
    comboDeadline = now + comboWindow;
    show();
    render();
    renderCombo();
    pop(combo >= 2 ? `RELAY FLOW x${combo}` : 'SIGNAL SECURED');
    if (combo >= 4) pop(`PERFECT RELAY x${combo}`);
  };

  const observer = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.target?.id === 'signalCount' || mutation.target?.id === 'signalTotal')) onSignalCountChange();
    if (mutations.some(mutation => mutation.target?.id === 'progress')) {
      const progress = document.getElementById('progress');
      const width = progress?.style.width || '0%';
      progressEl.textContent = width;
    }
    if (mutations.some(mutation => mutation.target?.id === 'routeIntel')) {
      const intel = document.getElementById('routeIntel');
      const match = intel?.textContent?.match(/(\d+)\/(\d+) CHECKPOINTS/);
      if (match) {
        checkpoint = Math.max(0, Number(match[1]) - 1);
        render();
        if (/CHECKPOINTS SECURED/.test(intel.textContent || '')) pop('CHECKPOINT SECURED');
      }
    }
  });

  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class'] });

  const reset = () => {
    activeRun = false;
    count = 0;
    total = 0;
    combo = 0;
    checkpoint = 0;
    lastSignalAt = 0;
    clearCombo();
    hide();
    render();
  };

  const startWatcher = () => {
    const signalTotal = document.getElementById('signalTotal');
    if (signalTotal?.textContent) {
      total = Number(signalTotal.textContent) || 0;
      activeRun = total > 0;
      if (activeRun) {
        show();
        render();
      }
    }
  };

  document.addEventListener('visibilitychange', () => { if (document.hidden) clearCombo(); });
  window.addEventListener('blur', clearCombo);
  window.addEventListener('resize', render);
  window.setTimeout(startWatcher, 0);
  window.setTimeout(startWatcher, 250);
  window.dispatchEvent(new CustomEvent('relay:signal-system-ready', { detail: { version: '1.0.0' } }));
}
