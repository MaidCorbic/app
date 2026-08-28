import { RunnerScene } from './src/scenes/RunnerScene.js';

// P2 CHARACTER / PRESENTATION V1
// One player object, state-driven presentation. No replacement character overlay.
(() => {
  'use strict';
  if (!RunnerScene?.prototype || window.__relayP2CharacterPresentationV1) return;
  window.__relayP2CharacterPresentationV1 = true;

  const states = new WeakMap();
  const RUN_TICKS = 7;
  const FLIGHT_CODE = 'KeyF';
  const isGameplayVisible = scene => scene?.player?.active && !scene.finished && !scene.respawning && !scene.cinematicActive;
  const grounded = scene => {
    const body = scene?.player?.body;
    return Boolean(body?.blocked?.down || body?.touching?.down || body?.onFloor?.());
  };
  const flightRequested = scene => Boolean(scene?.__relayP2FlightHeld || scene?.flightActive || scene?.flying || scene?.isFlying || scene?.player?.getData?.('flightActive'));

  function ensureUi(scene) {
    if (document.getElementById('relayP2CharacterHud')) return document.getElementById('relayP2CharacterHud');
    const style = document.createElement('style');
    style.id = 'relay-p2-character-style';
    style.textContent = `
      #relayP2CharacterHud{position:fixed;left:50%;bottom:clamp(14px,3vh,30px);transform:translateX(-50%);z-index:935;pointer-events:none;display:flex;align-items:center;gap:8px;padding:6px 9px;border:1px solid rgba(141,244,255,.16);border-radius:999px;background:rgba(3,10,20,.58);backdrop-filter:blur(8px);opacity:0;transition:opacity .16s ease}
      #relayP2CharacterHud.show{opacity:.9}
      #relayP2CharacterHud .p2-dot{width:6px;height:6px;border-radius:50%;background:#8df4ff;box-shadow:0 0 12px rgba(141,244,255,.7)}
      #relayP2CharacterHud .p2-label{font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;color:#dffcff}
      #relayP2CharacterHud.flight .p2-dot{background:#aee37f;box-shadow:0 0 12px rgba(174,227,127,.8)}
      #relayP2CharacterHud.dash .p2-dot{background:#ffd06e;box-shadow:0 0 14px rgba(255,208,110,.9)}
      #relayP2CharacterHud.impact .p2-dot{background:#ff826e;box-shadow:0 0 14px rgba(255,130,110,.8)}
      @media(max-width:520px){#relayP2CharacterHud{bottom:88px}.relay-p2-character-fly{display:flex!important}}
      .relay-p2-character-fly{display:none;position:fixed;right:16px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:940;width:58px;height:58px;border:1px solid rgba(174,227,127,.52);border-radius:16px;background:linear-gradient(145deg,rgba(14,32,18,.96),rgba(5,14,9,.98));color:#efffdc;font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;align-items:center;justify-content:center;box-shadow:0 0 18px rgba(174,227,127,.12),0 12px 28px rgba(0,0,0,.42);touch-action:none;user-select:none}
      .relay-p2-character-fly.active{border-color:#aee37f;box-shadow:0 0 24px rgba(174,227,127,.3),0 12px 28px rgba(0,0,0,.42);transform:scale(.95)}
    `;
    document.head.appendChild(style);
    const hud = document.createElement('div');
    hud.id = 'relayP2CharacterHud';
    hud.innerHTML = '<span class="p2-dot"></span><span class="p2-label">RUN READY</span>';
    document.body.appendChild(hud);
    return hud;
  }

  function ensureMobileFlightButton() {
    if (!document.body.classList.contains('is-touch')) return null;
    let button = document.getElementById('relayP2FlightButton');
    if (button) return button;
    const actions = document.querySelector('.mobile-actions');
    if (!actions) return null;
    button = document.createElement('button');
    button.id = 'relayP2FlightButton';
    button.className = 'relay-p2-character-fly';
    button.type = 'button';
    button.textContent = 'FLY';
    button.setAttribute('aria-label', 'Hold to fly');
    const down = event => { event.preventDefault(); event.stopPropagation(); button.classList.add('active'); window.__relayRunnerScene && (window.__relayRunnerScene.__relayP2FlightHeld = true); };
    const up = event => { if (event) { event.preventDefault(); event.stopPropagation(); } button.classList.remove('active'); if (window.__relayRunnerScene) window.__relayRunnerScene.__relayP2FlightHeld = false; };
    button.addEventListener('pointerdown', down, { passive:false });
    button.addEventListener('pointerup', up, { passive:false });
    button.addEventListener('pointercancel', up, { passive:false });
    button.addEventListener('lostpointercapture', up, { passive:false });
    window.addEventListener('blur', up);
    document.addEventListener('visibilitychange', () => { if (document.hidden) up(); });
    actions.appendChild(button);
    return button;
  }

  function makeWings(scene) {
    const left = scene.add.graphics().setDepth(13);
    const right = scene.add.graphics().setDepth(13);
    return { left, right, shown: false };
  }

  function drawWing(graphics, side, pulse) {
    graphics.clear();
    const flap = Math.sin(pulse) * 2.2;
    const s = side < 0 ? -1 : 1;
    graphics.fillStyle(0x8df4ff, .18);
    graphics.lineStyle(1.5, 0xb9f5ff, .88);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(s * 12, -7 - flap);
    graphics.lineTo(s * 27, -1 - flap * .5);
    graphics.lineTo(s * 17, 7 + flap);
    graphics.lineTo(0, 4);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.lineStyle(1, 0xeaffff, .48);
    graphics.lineBetween(0, 1, s * 20, -2 - flap * .5);
  }

  function setFlightPhysics(scene, state, active) {
    const body = scene?.player?.body;
    if (!body) return;
    if (active && !state.flightActive) {
      state.flightActive = true;
      state.originalGravity = body.gravity?.y ?? 1600;
      if (grounded(scene)) body.setVelocityY?.(-430);
      body.setGravityY?.(0);
      scene.flightActive = true;
      scene.player?.setData?.('flightActive', true);
      scene.playerCue?.('FLIGHT · WINGS DEPLOYED', '#aee37f');
    } else if (!active && state.flightActive) {
      state.flightActive = false;
      body.setGravityY?.(state.originalGravity);
      scene.flightActive = false;
      scene.player?.setData?.('flightActive', false);
      body.setVelocityY?.(Math.min(Number(body.velocity?.y) || 0, 80));
    }
    if (active) {
      body.allowGravity = false;
      body.setGravityY?.(0);
      if (!grounded(scene)) body.setVelocityY?.(Math.max(-180, Math.min(180, Number(body.velocity?.y) || 0)));
    }
  }

  function resolveTexture(scene, key) {
    return scene?.textures?.exists?.(key) ? key : null;
  }

  function applyPresentation(scene, state, delta) {
    const player = scene.player;
    const body = player?.body;
    if (!player?.active || !body) return;

    const vx = Number(body.velocity?.x) || 0;
    const vy = Number(body.velocity?.y) || 0;
    const speed = Math.abs(vx);
    const dashing = Boolean(scene.dashing || player.getData?.('dashing'));
    const onGround = grounded(scene);
    const hit = Boolean(player.getData?.('hit') || player.getData?.('hurt') || scene.playerHit);
    const requested = flightRequested(scene) && !scene.respawning && !scene.finished;
    const flight = requested && !onGround;
    setFlightPhysics(scene, state, flight);

    let next = 'idle';
    if (dashing) next = 'dash';
    else if (hit) next = 'hit';
    else if (flight) next = 'fly';
    else if (!onGround && vy < -30) next = 'jump';
    else if (!onGround && vy >= -30) next = 'fall';
    else if (speed > 45) next = 'run';

    state.tick += Math.max(1, Math.round((delta || 16) / 16));
    if (next === 'run') state.runFrame = Math.floor(state.tick / RUN_TICKS) % 2;
    if (next === 'fly') state.flightPulse += (delta || 16) * .01;

    const textureKey = next === 'run' ? (state.runFrame ? 'runner-run-b' : 'runner-run-a') : next === 'jump' ? 'runner-jump' : next === 'fall' ? 'runner-fall' : next === 'dash' ? 'runner-dash' : next === 'hit' ? 'runner-hit' : 'runner-idle';
    player.setTexture?.(resolveTexture(scene, textureKey) || player.texture?.key);
    player.setData?.('presentationState', next);
    player.setData?.('singleCharacterPresentation', true);

    const wingsOn = next === 'fly';
    state.wings.shown = wingsOn;
    state.wings.left.setVisible(wingsOn);
    state.wings.right.setVisible(wingsOn);
    if (wingsOn) {
      const x = player.x + (player.flipX ? -2 : 2);
      const y = player.y - 10;
      state.wings.left.setPosition(x, y);
      state.wings.right.setPosition(x, y);
      drawWing(state.wings.left, -1, state.flightPulse);
      drawWing(state.wings.right, 1, state.flightPulse + Math.PI * .08);
    }

    const hud = ensureUi(scene);
    const label = { idle:'READY', run:'RUN', jump:'JUMP', fall:'FALL', dash:'DASH', fly:'FLIGHT · WINGS', hit:'IMPACT' }[next] || 'READY';
    hud.querySelector('.p2-label').textContent = label;
    hud.classList.toggle('show', isGameplayVisible(scene));
    hud.classList.toggle('flight', next === 'fly');
    hud.classList.toggle('dash', next === 'dash');
    hud.classList.toggle('impact', next === 'hit');
    state.lastState = next;
  }

  const baseCreate = RunnerScene.prototype.create;
  const baseUpdate = RunnerScene.prototype.update;
  const baseShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function p2CharacterCreate(...args) {
    const result = baseCreate.apply(this, args);
    states.set(this, { tick:0, runFrame:0, flightPulse:0, lastState:'idle', flightActive:false, originalGravity:1600, wings: makeWings(this) });
    window.__relayRunnerScene = this;
    ensureUi(this);
    ensureMobileFlightButton();
    return result;
  };

  RunnerScene.prototype.update = function p2CharacterUpdate(time, delta, ...args) {
    const result = baseUpdate.apply(this, [time, delta, ...args]);
    const state = states.get(this);
    if (state) {
      try { applyPresentation(this, state, delta); } catch (error) { console.error('[P2Character] update failed', error); }
    }
    return result;
  };

  RunnerScene.prototype.shutdown = function p2CharacterShutdown(...args) {
    const state = states.get(this);
    state?.wings?.left?.destroy?.();
    state?.wings?.right?.destroy?.();
    const result = baseShutdown?.apply(this, args);
    states.delete(this);
    return result;
  };

  const onFlightKey = event => {
    if (event.code !== FLIGHT_CODE || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const scene = window.__relayRunnerScene;
    if (!scene || !isGameplayVisible(scene)) return;
    scene.__relayP2FlightHeld = true;
    event.preventDefault();
  };
  const onFlightKeyUp = event => {
    if (event.code !== FLIGHT_CODE) return;
    const scene = window.__relayRunnerScene;
    if (scene) scene.__relayP2FlightHeld = false;
  };
  window.addEventListener('keydown', onFlightKey, true);
  window.addEventListener('keyup', onFlightKeyUp, true);
  window.addEventListener('blur', onFlightKeyUp, true);
})();
