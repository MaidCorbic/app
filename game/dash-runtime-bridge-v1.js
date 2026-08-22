/* UPDATE 29 — DASH RUNTIME BRIDGE FINAL
   Restores the actual physical dash response behind the gameplay dash event.
   Binding is lazy as well as lifecycle-driven so the runtime cannot miss scene boot order.
*/
const SPEED = 670;
const DURATION = 180;
const COOLDOWN = 620;
const STATE_KEY = '__relayDashRuntimeV1';

function currentScene() {
  return window.__relayRunnerScene || window.RelayRuntime?.scene?.() || null;
}

function validScene(scene) {
  const tutorialDash = scene?.firstTimeTutorial && scene?.mission?.id === 'first-delivery';
  return !!scene?.player && !scene.finished && !scene.respawning && !scene.cinematicActive && !window.__relayCinematicLock && (!scene.firstTimeTutorial || tutorialDash);
}

function directionFor(scene) {
  const vx = Number(scene.player?.body?.velocity?.x || 0);
  if (Math.abs(vx) > 20) return Math.sign(vx);
  if (typeof scene.player?.flipX === 'boolean') return scene.player.flipX ? -1 : 1;
  return 1;
}

function finishDash(scene, expectedRun) {
  const state = scene?.[STATE_KEY];
  if (!state || state.token !== expectedRun) return;
  state.active = false;
  if (scene.player?.body) {
    const vx = Number(scene.player.body.velocity.x || 0);
    const retained = Math.abs(vx) > SPEED * 0.2 ? Math.sign(vx) * Math.min(Math.abs(vx), 460) : 0;
    scene.player.body.setVelocityX(retained);
  }
  scene.player?.setTexture?.(scene.player.body?.velocity?.y < -40 ? 'runner-jump' : 'runner-idle');
  scene.events?.emit?.('relay:dash-complete');
  window.dispatchEvent(new CustomEvent('relay:dash-complete', { detail: { scene } }));
}

function performDash(scene) {
  if (!validScene(scene)) return false;
  const now = performance.now();
  const state = scene[STATE_KEY] || (scene[STATE_KEY] = { active: false, lastAt: -Infinity, token: 0 });
  if (state.active || now - state.lastAt < COOLDOWN) return false;

  const direction = directionFor(scene);
  state.active = true;
  state.lastAt = now;
  state.token += 1;
  const token = state.token;

  scene.player?.setTexture?.('runner-dash');
  scene.player?.body?.setVelocityX?.(direction * SPEED);
  scene.player?.body?.setMaxVelocity?.(SPEED, scene.player.body.maxVelocity?.y || 1120);
  scene.events?.emit?.('relay:dash-start', { direction, speed: SPEED, duration: DURATION });
  window.dispatchEvent(new CustomEvent('relay:dash-runtime-applied', { detail: { scene, direction, speed: SPEED, duration: DURATION } }));
  try { scene.playerCue?.('DASH', '#8df4ff'); } catch {}
  scene.time?.delayedCall?.(DURATION, () => finishDash(scene, token));
  return true;
}

function bind(scene) {
  if (!scene || scene.__relayDashRuntimeBound) return !!scene;
  scene.__relayDashRuntimeBound = true;
  scene[STATE_KEY] = scene[STATE_KEY] || { active: false, lastAt: -Infinity, token: 0 };
  const handler = () => {
    const activeScene = currentScene() || scene;
    if (activeScene !== scene && !activeScene.__relayDashRuntimeBound) bind(activeScene);
    performDash(activeScene);
  };
  scene.__relayDashRuntimeDashHandler = handler;
  window.addEventListener('relay:new-gameplay-dash', handler, { passive: true });
  scene.events?.once?.('shutdown', () => {
    window.removeEventListener('relay:new-gameplay-dash', handler);
    scene.__relayDashRuntimeBound = false;
    scene.__relayDashRuntimeDashHandler = null;
    const state = scene[STATE_KEY];
    if (state) state.active = false;
  });
  scene.events?.once?.('destroy', () => {
    window.removeEventListener('relay:new-gameplay-dash', handler);
    scene.__relayDashRuntimeBound = false;
    scene.__relayDashRuntimeDashHandler = null;
  });
  return true;
}

function ensureBound() {
  const scene = currentScene();
  if (!scene) return null;
  if (!scene.__relayDashRuntimeBound) bind(scene);
  return scene;
}

function dispatchKeyboardDash(event) {
  if (event.repeat || (event.code !== 'ShiftLeft' && event.code !== 'ShiftRight' && event.key !== 'Shift')) return;
  if (event.defaultPrevented || window.__relayKeyboardDashStamp === event.timeStamp) return;
  const scene = ensureBound();
  if (!validScene(scene)) return;
  window.__relayKeyboardDashStamp = event.timeStamp;
  window.dispatchEvent(new CustomEvent('relay:new-gameplay-dash', {
    detail: { source: 'keyboard-shift', direction: directionFor(scene), originalEvent: event }
  }));
}

if (typeof window !== 'undefined' && !window.__relayDashRuntimeBridgeV1) {
  window.__relayDashRuntimeBridgeV1 = true;
  window.addEventListener('relay:runner-scene-ready', event => bind(event.detail?.scene || currentScene()), { passive: true });
  window.addEventListener('relay:gameplay-core-ready', () => ensureBound(), { passive: true });
  window.addEventListener('relay:city-pulse-ready', () => ensureBound(), { passive: true });
  window.addEventListener('relay:new-gameplay-dash', () => ensureBound(), { passive: true });
  window.addEventListener('keydown', dispatchKeyboardDash, true);
  ensureBound();

  window.__relayDashRuntimeDebug = () => {
    const scene = ensureBound();
    const state = scene?.[STATE_KEY];
    const result = {
      runtimeLoaded: true,
      sceneLoaded: !!scene,
      mission: scene?.mission?.id ?? 'NONE',
      tutorial: !!scene?.firstTimeTutorial,
      tutorialDashAllowed: !!(scene?.firstTimeTutorial && scene?.mission?.id === 'first-delivery'),
      cinematic: !!scene?.cinematicActive,
      dashBound: !!scene?.__relayDashRuntimeBound,
      dashActive: !!state?.active,
      dashVelocityX: Math.round(scene?.player?.body?.velocity?.x ?? 0),
      dashCooldownMs: COOLDOWN,
      dashDurationMs: DURATION,
    };
    console.table(result);
    return result;
  };
}
