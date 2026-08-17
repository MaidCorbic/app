// UPDATE 07 FINAL — visible dynamic day/night cycle.
// This module is intentionally DOM-driven so it does not depend on RunnerScene
// prototype timing and cannot interfere with gameplay, combat, respawn or input.
(() => {
  if (window.__relayDynamicTimeCycleV3) return;
  window.__relayDynamicTimeCycleV3 = true;

  const CYCLE_MS = 90000;
  const PHASES = [
    { at: 0.00, name: 'NIGHT', color: [6, 17, 38], alpha: 0.34 },
    { at: 0.14, name: 'DAWN', color: [122, 80, 111], alpha: 0.24 },
    { at: 0.28, name: 'MORNING', color: [185, 130, 93], alpha: 0.15 },
    { at: 0.46, name: 'MIDDAY', color: [246, 223, 176], alpha: 0.045 },
    { at: 0.64, name: 'DUSK', color: [166, 93, 103], alpha: 0.22 },
    { at: 0.82, name: 'NIGHT', color: [6, 17, 38], alpha: 0.34 },
  ];

  const css = document.createElement('style');
  css.dataset.relayTimeCycle = 'v3';
  css.textContent = `
    #relayTimeShade {
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      background: rgba(6,17,38,.34);
      transition: background-color .45s linear;
      mix-blend-mode: multiply;
    }
    #relayTimeIndicator {
      position: absolute;
      top: 88px;
      right: 18px;
      z-index: 80;
      min-width: 158px;
      padding: 8px 11px;
      box-sizing: border-box;
      border: 1px solid rgba(141,244,255,.38);
      border-radius: 9px;
      background: rgba(5,12,24,.88);
      box-shadow: 0 0 18px rgba(25,200,245,.08), inset 0 0 14px rgba(141,244,255,.04);
      color: #f4fbff;
      font: 700 10px/1.1 "DM Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
      letter-spacing: .11em;
      text-align: right;
      pointer-events: none;
      text-transform: uppercase;
      backdrop-filter: blur(7px);
    }
    #relayTimeIndicator .relay-time-name { display:block; font-size:11px; letter-spacing:.16em; }
    #relayTimeIndicator .relay-time-clock { display:block; margin-top:4px; opacity:.78; font-size:9px; }
    #relayTimeIndicator .relay-time-icon { display:inline-block; margin-right:7px; font-size:13px; vertical-align:-1px; }
    @media (max-width: 900px) {
      #relayTimeIndicator { top: 82px; right: 12px; min-width: 142px; padding: 7px 9px; }
    }
    @media (max-width: 700px) and (orientation: portrait) {
      #relayTimeIndicator { top: 78px; right: 10px; min-width: 132px; }
    }
  `;
  document.head.appendChild(css);

  const play = document.getElementById('play');
  if (!play) return;
  if (getComputedStyle(play).position === 'static') play.style.position = 'relative';

  const shade = document.createElement('div');
  shade.id = 'relayTimeShade';
  shade.setAttribute('aria-hidden', 'true');

  const indicator = document.createElement('div');
  indicator.id = 'relayTimeIndicator';
  indicator.setAttribute('aria-hidden', 'true');
  indicator.innerHTML = '<span class="relay-time-name"><span class="relay-time-icon">☾</span><span data-relay-time-name>NIGHT</span></span><span class="relay-time-clock" data-relay-time-clock>00:00 · CYCLE 01</span>';

  const hud = play.querySelector('.hud');
  play.insertBefore(shade, play.firstChild);
  if (hud?.parentNode === play) play.insertBefore(indicator, hud.nextSibling);
  else play.appendChild(indicator);

  const mix = (a, b, t) => a.map((value, index) => Math.round(value * (1 - t) + b[index] * t));
  const sample = progress => {
    const p = ((progress % 1) + 1) % 1;
    for (let index = 0; index < PHASES.length - 1; index += 1) {
      const a = PHASES[index];
      const b = PHASES[index + 1];
      if (p >= a.at && p <= b.at) {
        const t = (p - a.at) / Math.max(.0001, b.at - a.at);
        return {
          name: t < .5 ? a.name : b.name,
          color: mix(a.color, b.color, t),
          alpha: a.alpha * (1 - t) + b.alpha * t,
        };
      }
    }
    return PHASES[0];
  };

  const intro = document.getElementById('intro');
  let elapsed = 0;
  let lastTimestamp = performance.now();
  let started = false;
  let cycleNumber = 1;

  const setPhase = progress => {
    const phase = sample(progress);
    const [red, green, blue] = phase.color;
    shade.style.backgroundColor = `rgba(${red},${green},${blue},${phase.alpha.toFixed(3)})`;

    const totalMinutes = Math.floor(progress * 1440);
    const hours = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    const icon = phase.name === 'MIDDAY' || phase.name === 'MORNING' ? '☀' : (phase.name === 'DAWN' || phase.name === 'DUSK' ? '◐' : '☾');
    indicator.querySelector('[data-relay-time-name]')?.replaceChildren(document.createTextNode(phase.name));
    const iconNode = indicator.querySelector('.relay-time-icon');
    if (iconNode) iconNode.textContent = icon;
    indicator.querySelector('[data-relay-time-clock]')?.replaceChildren(document.createTextNode(`${hours}:${minutes} · CYCLE ${String(cycleNumber).padStart(2, '0')}`));
    indicator.dataset.phase = phase.name;
  };

  const isGameRunning = () => !intro || intro.classList.contains('hidden');

  const frame = timestamp => {
    const delta = Math.min(100, Math.max(0, timestamp - lastTimestamp));
    lastTimestamp = timestamp;
    if (isGameRunning()) {
      if (!started) {
        started = true;
        elapsed = 0;
        cycleNumber = 1;
      }
      const previousCycle = Math.floor(elapsed / CYCLE_MS);
      elapsed += delta;
      const currentCycle = Math.floor(elapsed / CYCLE_MS);
      if (currentCycle !== previousCycle) cycleNumber = currentCycle + 1;
      setPhase((elapsed % CYCLE_MS) / CYCLE_MS);
    } else {
      started = false;
    }
    requestAnimationFrame(frame);
  };

  setPhase(0);
  requestAnimationFrame(frame);
})();
