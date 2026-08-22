/* UPDATE 23 — CITY PULSE // FULL IMPLEMENTATION
   Additive environment timing layer.
   Existing player physics, missions, barriers, score and save state remain authoritative.
   City Pulse creates non-physical timing gates that reward reading the city's rhythm.
*/
(() => {
  if (typeof window === 'undefined' || window.__relayCityPulseV1) return;
  if (!window.RelayRuntime?.module) {
    console.warn('[CityPulse] RelayRuntime kernel unavailable; feature disabled safely.');
    return;
  }

  const CONFIG = Object.freeze({
    version: '1.0.0',
    periodMs: 3600,
    warningMs: 650,
    openMs: 1050,
    gateHalfWidth: 30,
    flowWindowMs: 420,
    gatesPerMission: 3,
  });

  const MISSION_TARGET_X = Object.freeze({
    'first-delivery': 3570,
    'dead-drop': 3740,
    blackout: 3830,
    pursuit: 3790,
    'signal-storm': 3900,
    'corporate-lockdown': 3820,
    'final-relay': 3900,
  });

  const stateByScene = new WeakMap();
  const runtimeModule = window.RelayRuntime.module('city-pulse');

  const missionIdOf = scene => {
    const candidates = [
      scene?.mission?.id,
      scene?.sys?.settings?.data?.missionId,
      scene?.sys?.settings?.data?.mission,
      scene?.registry?.get?.('missionId'),
      document.documentElement?.dataset?.missionId,
      document.body?.dataset?.missionId,
    ];
    return candidates.find(value => Object.prototype.hasOwnProperty.call(MISSION_TARGET_X, value)) || null;
  };

  const gameplayEnabled = scene => !!scene?.player?.active
    && !scene?.firstTimeTutorial
    && !scene?.cinematicActive;

  const makeGate = (scene, x, index) => {
    const y = 558;
    const c = scene.add.container(x, y).setDepth(9);
    const glow = scene.add.rectangle(0, -26, 6, 76, 0x8df4ff, .12)
      .setStrokeStyle(1, 0x8df4ff, .45);
    const beam = scene.add.rectangle(0, -26, 3, 68, 0xdffcff, .45);
    const left = scene.add.rectangle(-26, 0, 4, 58, 0x8df4ff, .7);
    const right = scene.add.rectangle(26, 0, 4, 58, 0x8df4ff, .7);
    const cap = scene.add.rectangle(0, -55, 58, 3, 0x8df4ff, .75);
    const label = scene.add.text(0, -70, `PULSE ${String(index + 1).padStart(2, '0')}`, {
      fontFamily: 'monospace', fontSize: '7px', fontStyle: 'bold',
      color: '#dffcff', stroke: '#02050d', strokeThickness: 3,
    }).setOrigin(.5);
    const stateText = scene.add.text(0, 18, 'SYNC', {
      fontFamily: 'monospace', fontSize: '6px', fontStyle: 'bold',
      color: '#8df4ff', stroke: '#02050d', strokeThickness: 2,
    }).setOrigin(.5);
    c.add([glow, beam, left, right, cap, label, stateText]);
    c.setDataEnabled();
    c.setData('index', index);
    c.setData('triggered', false);
    c.setData('triggerX', x);
    c.setData('stateText', stateText);
    c.setData('parts', { glow, beam, left, right, cap, label });
    return c;
  };

  const applyVisualState = (gate, phase, reducedMotion) => {
    const parts = gate.getData('parts');
    const stateText = gate.getData('stateText');
    if (!parts || !stateText) return;

    const open = phase === 'OPEN';
    const warning = phase === 'WARNING';
    const alpha = open ? .95 : warning ? .48 : .18;
    const beamAlpha = open ? 1 : warning ? .58 : .14;
    const color = open ? 0xaee37f : warning ? 0xffd06e : 0x8df4ff;

    parts.left.setFillStyle(color, alpha);
    parts.right.setFillStyle(color, alpha);
    parts.cap.setFillStyle(color, alpha);
    parts.glow.setFillStyle(color, reducedMotion ? .08 : open ? .22 : warning ? .13 : .05);
    parts.beam.setFillStyle(color, beamAlpha);
    stateText.setColor(open ? '#aee37f' : warning ? '#ffd06e' : '#8df4ff');
    stateText.setText(open ? 'OPEN' : warning ? 'SYNC' : 'CLOSED');

    if (!reducedMotion && open) {
      parts.beam.setScaleX(1.25);
    } else {
      parts.beam.setScaleX(1);
    }
  };

  const phaseAt = elapsed => {
    const t = ((elapsed % CONFIG.periodMs) + CONFIG.periodMs) % CONFIG.periodMs;
    if (t < CONFIG.warningMs) return 'WARNING';
    if (t < CONFIG.warningMs + CONFIG.openMs) return 'OPEN';
    return 'CLOSED';
  };

  const openStartAt = elapsed => {
    const t = ((elapsed % CONFIG.periodMs) + CONFIG.periodMs) % CONFIG.periodMs;
    return elapsed - t + CONFIG.warningMs;
  };

  const showCue = (scene, title, detail, success = false) => {
    const color = success ? '#aee37f' : '#ffd06e';
    const id = 'cityPulseCueV1';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    }
    el.innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
    el.style.setProperty('--city-pulse-color', color);
    el.classList.remove('is-visible');
    void el.offsetWidth;
    el.classList.add('is-visible');
    window.setTimeout(() => el.classList.remove('is-visible'), 1050);
    scene?.playerCue?.(title, success ? '#aee37f' : '#ffd06e');
  };

  const emit = (scene, name, detail) => {
    try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {}
    try { scene?.events?.emit?.(name, detail); } catch {}
  };

  const setup = scene => {
    if (!scene?.add || !scene?.player || stateByScene.has(scene)) return;
    const missionId = missionIdOf(scene);
    const targetX = missionId ? MISSION_TARGET_X[missionId] : null;
    if (!missionId || !Number.isFinite(targetX)) return;

    const offsets = [-900, -600, -300];
    const gates = offsets.map((offset, index) => makeGate(scene, targetX + offset, index));
    const state = {
      missionId,
      gates,
      elapsed: 0,
      previousX: scene.player.x,
      flowStreak: 0,
      lastFlowAt: -Infinity,
      lastCueAt: -Infinity,
    };
    stateByScene.set(scene, state);
    scene.cityPulseV1 = state;
    gates.forEach(gate => gate.setVisible(false));
  };

  const update = (scene, delta = 16.67) => {
    const state = stateByScene.get(scene);
    if (!state) return;

    const active = gameplayEnabled(scene);
    state.elapsed += Math.max(0, Math.min(Number(delta) || 16.67, 100));
    const reducedMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    state.gates.forEach(gate => {
      gate.setVisible(active);
      if (!active || gate.getData('triggered')) return;
      const phase = phaseAt(state.elapsed + gate.getData('index') * 420);
      applyVisualState(gate, phase, reducedMotion);

      const x = gate.getData('triggerX');
      const crossed = state.previousX < x && scene.player.x >= x;
      if (!crossed) return;

      gate.setData('triggered', true);
      const elapsedToOpen = Math.max(0, openStartAt(state.elapsed + gate.getData('index') * 420) - (state.elapsed + gate.getData('index') * 420));
      const phaseNow = phaseAt(state.elapsed + gate.getData('index') * 420);
      const perfect = phaseNow === 'OPEN' && elapsedToOpen <= CONFIG.flowWindowMs;

      if (perfect) {
        state.flowStreak += 1;
        state.lastFlowAt = state.elapsed;
        const streak = state.flowStreak;
        showCue(scene, streak >= 3 ? 'PERFECT FLOW' : 'FLOW SYNC', `CITY PULSE ×${streak}`, true);
        emit(scene, 'relay:city-pulse-flow', {
          version: CONFIG.version,
          missionId: state.missionId,
          gateIndex: gate.getData('index'),
          streak,
          quality: streak >= 3 ? 'perfect' : 'clean',
        });
      } else {
        state.flowStreak = 0;
        showCue(scene, 'WINDOW MISSED', 'READ THE CITY RHYTHM', false);
        emit(scene, 'relay:city-pulse-missed', {
          version: CONFIG.version,
          missionId: state.missionId,
          gateIndex: gate.getData('index'),
        });
      }
    });

    state.previousX = scene.player.x;
  };

  const teardown = scene => {
    const state = stateByScene.get(scene);
    if (!state) return;
    state.gates.forEach(gate => { try { gate.destroy(true); } catch {} });
    stateByScene.delete(scene);
    if (scene.cityPulseV1 === state) delete scene.cityPulseV1;
    if (window.__relayCityPulseScene === scene) window.__relayCityPulseScene = null;
  };

  runtimeModule.onSceneReady(scene => {
    setup(scene);
    const state = stateByScene.get(scene);
    if (!state) return;

    window.__relayCityPulseScene = scene;
    const onUpdate = (_time, delta) => update(scene, delta);
    scene.events?.on?.('update', onUpdate);
    runtimeModule.cleanup(() => scene.events?.off?.('update', onUpdate));
    runtimeModule.cleanup(() => teardown(scene));
  });

  window.__relayCityPulseV1 = true;
  window.__relayCityPulseConfig = CONFIG;
  window.__relayCityPulseDebug = () => {
    const scene = window.__relayCityPulseScene || window.RelayRuntime.scene();
    const state = scene ? stateByScene.get(scene) : null;
    const result = {
      runtimeLoaded: true,
      sceneLoaded: !!scene,
      mission: state?.missionId ?? scene?.mission?.id ?? 'NONE',
      tutorial: !!scene?.firstTimeTutorial,
      cinematic: !!scene?.cinematicActive,
      gates: state?.gates?.length ?? 0,
      triggered: state?.gates?.filter(g => g.getData('triggered')).length ?? 0,
      flowStreak: state?.flowStreak ?? 0,
    };
    console.table(result);
    return result;
  };
  window.__relayCityPulseReset = () => {
    const scene = window.__relayCityPulseScene || window.RelayRuntime.scene();
    const state = scene ? stateByScene.get(scene) : null;
    if (!state) return false;
    state.gates.forEach(gate => gate.setData('triggered', false));
    state.flowStreak = 0;
    state.previousX = scene.player?.x ?? state.previousX;
    return true;
  };

  window.dispatchEvent(new CustomEvent('relay:city-pulse-ready', { detail: { version: CONFIG.version } }));
})();
