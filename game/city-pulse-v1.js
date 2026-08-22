import { CITY_PULSE_CONFIG, CITY_PULSE_MISSION_TARGET_X, phaseAt, isPerfectWindow } from './city-pulse-core-v1.js';

/* UPDATE 23 — CITY PULSE // FULL IMPLEMENTATION
   Additive timing layer. No player physics, mission, save or existing barrier ownership changes.
*/
(() => {
  if (typeof window === 'undefined' || window.__relayCityPulseV1) return;
  if (!window.RelayRuntime?.module) return;

  const CONFIG = CITY_PULSE_CONFIG;
  const TARGETS = CITY_PULSE_MISSION_TARGET_X;
  const states = new WeakMap();
  const runtime = window.RelayRuntime.module('city-pulse');

  const missionIdOf = scene => {
    const values = [
      scene?.mission?.id,
      scene?.sys?.settings?.data?.missionId,
      scene?.sys?.settings?.data?.mission,
      scene?.registry?.get?.('missionId'),
      scene?.registry?.get?.('mission'),
      document.documentElement?.dataset?.missionId,
      document.body?.dataset?.missionId,
    ];
    return values.find(v => typeof v === 'string' && Object.prototype.hasOwnProperty.call(TARGETS, v)) || null;
  };

  const activeGameplay = scene => !!scene?.player?.active
    && !scene?.firstTimeTutorial
    && !scene?.cinematicActive
    && !scene?.finished;

  const makeGate = (scene, x, index) => {
    // Fixed world-space presentation keeps gates aligned with the authored route and
    // prevents a gate from jumping vertically when the player is airborne.
    const y = 520;
    const gate = scene.add.container(x, y).setDepth(8);
    const glow = scene.add.rectangle(0, -34, 10, 118, 0x8df4ff, .10).setStrokeStyle(1, 0x8df4ff, .35);
    const beam = scene.add.rectangle(0, -34, 4, 112, 0xdffcff, .35);
    const left = scene.add.rectangle(-30, 0, 6, 86, 0x8df4ff, .65);
    const right = scene.add.rectangle(30, 0, 6, 86, 0x8df4ff, .65);
    const cap = scene.add.rectangle(0, -78, 68, 4, 0x8df4ff, .70);
    const label = scene.add.text(0, -96, `PULSE ${String(index + 1).padStart(2, '0')}`, {
      fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#dffcff', stroke: '#02050d', strokeThickness: 3,
    }).setOrigin(.5);
    const phaseText = scene.add.text(0, 31, 'SYNC', {
      fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#8df4ff', stroke: '#02050d', strokeThickness: 2,
    }).setOrigin(.5);
    gate.add([glow, beam, left, right, cap, label, phaseText]);
    gate.setDataEnabled();
    gate.setData('index', index);
    gate.setData('triggered', false);
    gate.setData('triggerX', x);
    gate.setData('phaseText', phaseText);
    gate.setData('parts', { glow, beam, left, right, cap, label });
    return gate;
  };

  const applyVisual = (gate, phase, reducedMotion) => {
    const p = gate.getData('parts');
    const text = gate.getData('phaseText');
    if (!p || !text) return;
    const open = phase === 'OPEN';
    const warning = phase === 'WARNING';
    const color = open ? 0xaee37f : warning ? 0xffd06e : 0x8df4ff;
    const alpha = open ? .95 : warning ? .52 : .20;
    p.left.setFillStyle(color, alpha);
    p.right.setFillStyle(color, alpha);
    p.cap.setFillStyle(color, alpha);
    p.glow.setFillStyle(color, reducedMotion ? .08 : open ? .25 : warning ? .14 : .06);
    p.beam.setFillStyle(color, open ? 1 : warning ? .60 : .16);
    text.setColor(open ? '#aee37f' : warning ? '#ffd06e' : '#8df4ff');
    text.setText(open ? 'OPEN' : warning ? 'WARNING' : 'CLOSED');
    p.beam.setScaleX(!reducedMotion && open ? 1.35 : 1);
  };

  const cue = (scene, title, detail, success) => {
    const color = success ? '#aee37f' : '#ffd06e';
    let el = document.getElementById('cityPulseCueV1');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cityPulseCueV1';
      document.body.appendChild(el);
    }
    el.innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
    el.style.setProperty('--city-pulse-color', color);
    el.classList.remove('is-visible');
    void el.offsetWidth;
    el.classList.add('is-visible');
    window.clearTimeout(Number(el.dataset.cityPulseTimer) || 0);
    el.dataset.cityPulseTimer = String(window.setTimeout(() => el.classList.remove('is-visible'), 900));
    scene?.playerCue?.(title, color);
  };

  const emit = (scene, name, detail) => {
    try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {}
    try { scene?.events?.emit?.(name, detail); } catch {}
  };

  const destroy = scene => {
    const state = states.get(scene);
    if (!state) return;
    state.gates.forEach(gate => { try { gate.destroy(true); } catch {} });
    states.delete(scene);
    if (scene.cityPulseV1 === state) delete scene.cityPulseV1;
    if (window.__relayCityPulseScene === scene) window.__relayCityPulseScene = null;
    const cueEl = document.getElementById('cityPulseCueV1');
    if (cueEl) {
      window.clearTimeout(Number(cueEl.dataset.cityPulseTimer) || 0);
      cueEl.classList.remove('is-visible');
    }
  };

  const setup = scene => {
    if (!scene?.add || !scene?.player || states.has(scene) || !activeGameplay(scene)) return false;
    const missionId = missionIdOf(scene);
    const targetX = missionId ? TARGETS[missionId] : null;
    if (!missionId || !Number.isFinite(targetX)) return false;

    const gates = [-900, -600, -300].map((offset, index) => makeGate(scene, targetX + offset, index));
    const state = { missionId, gates, elapsed: 0, previousX: scene.player.x, flowStreak: 0 };
    states.set(scene, state);
    scene.cityPulseV1 = state;
    return true;
  };

  const update = (scene, delta = 16.67) => {
    if (scene?.finished) {
      destroy(scene);
      return;
    }

    let state = states.get(scene);
    // Do not allocate City Pulse objects during tutorial/cinematic boot. This removes
    // the first-entry frame spike and starts the pulse clock exactly when gameplay opens.
    if (!state) {
      if (!activeGameplay(scene)) return;
      if (!setup(scene)) return;
      state = states.get(scene);
      if (!state) return;
    }

    const reducedMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    state.elapsed += Math.max(0, Math.min(Number(delta) || 16.67, 50));
    const currentX = Number(scene.player?.x);
    if (!Number.isFinite(currentX)) return;

    for (const gate of state.gates) {
      if (!gate?.active || gate.getData('triggered')) continue;
      const localElapsed = state.elapsed + gate.getData('index') * 420;
      const phase = phaseAt(localElapsed);
      applyVisual(gate, phase, reducedMotion);

      const x = gate.getData('triggerX');
      const tolerance = CONFIG.gateHalfWidth;
      const crossed = state.previousX < x - tolerance && currentX >= x - tolerance;
      if (!crossed) continue;

      gate.setData('triggered', true);
      const perfect = phase === 'OPEN' && isPerfectWindow(localElapsed);
      if (perfect) {
        state.flowStreak += 1;
        const streak = state.flowStreak;
        cue(scene, streak >= 3 ? 'PERFECT FLOW' : 'FLOW SYNC', `CITY PULSE ×${streak}`, true);
        emit(scene, 'relay:city-pulse-flow', { version: CONFIG.version, missionId: state.missionId, gateIndex: gate.getData('index'), streak, quality: streak >= 3 ? 'perfect' : 'clean' });
      } else {
        state.flowStreak = 0;
        cue(scene, 'WINDOW MISSED', 'READ THE CITY RHYTHM', false);
        emit(scene, 'relay:city-pulse-missed', { version: CONFIG.version, missionId: state.missionId, gateIndex: gate.getData('index') });
      }
    }
    state.previousX = currentX;
  };

  runtime.onSceneReady(scene => {
    // Scene may be booting into tutorial; update() will create the system only when
    // the authoritative gameplay state becomes active.
    if (activeGameplay(scene)) setup(scene);
    if (!states.has(scene)) return;
    window.__relayCityPulseScene = scene;
    const onUpdate = (_time, delta) => update(scene, delta);
    scene.events?.on?.('update', onUpdate);
    runtime.cleanup(() => scene.events?.off?.('update', onUpdate));
    runtime.cleanup(() => destroy(scene));
  });

  // Completion must tear City Pulse down before finish/replay/next-mission UI takes over.
  window.addEventListener('relay:mission-complete', event => {
    const scene = event.detail?.scene || window.__relayCityPulseScene;
    if (scene) destroy(scene);
  }, { passive: true });

  window.__relayCityPulseV1 = true;
  window.__relayCityPulseConfig = CONFIG;
  window.__relayCityPulseDebug = () => {
    const scene = window.__relayCityPulseScene || window.RelayRuntime.scene();
    const state = scene ? states.get(scene) : null;
    const result = {
      runtimeLoaded: true,
      sceneLoaded: !!scene,
      mission: state?.missionId ?? missionIdOf(scene) ?? scene?.mission?.id ?? 'NONE',
      tutorial: !!scene?.firstTimeTutorial,
      cinematic: !!scene?.cinematicActive,
      finished: !!scene?.finished,
      gates: state?.gates?.length ?? 0,
      visible: state?.gates?.filter(g => g.visible).length ?? 0,
      triggered: state?.gates?.filter(g => g.getData('triggered')).length ?? 0,
      flowStreak: state?.flowStreak ?? 0,
      playerX: Number.isFinite(scene?.player?.x) ? Math.round(scene.player.x) : null,
    };
    console.table(result);
    return result;
  };
  window.__relayCityPulseReset = () => {
    const scene = window.__relayCityPulseScene || window.RelayRuntime.scene();
    const state = scene ? states.get(scene) : null;
    if (!state) return false;
    state.gates.forEach(gate => gate.setData('triggered', false));
    state.flowStreak = 0;
    state.previousX = Number(scene.player?.x) || state.previousX;
    return true;
  };
  window.dispatchEvent(new CustomEvent('relay:city-pulse-ready', { detail: { version: CONFIG.version } }));
})();
