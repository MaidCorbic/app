import { RunnerScene } from './src/scenes/RunnerScene.js';

// P2 CHARACTER / PRESENTATION V1
// One player object, state-driven presentation. No replacement character overlay.
(() => {
  'use strict';
  if (!RunnerScene?.prototype || window.__relayP2CharacterPresentationV1) return;
  window.__relayP2CharacterPresentationV1 = true;

  const states = new WeakMap();
  const RUN_TICKS = 7;
  const DEFAULT_WINGS = { width: 20, height: 9 };

  const isGameplayVisible = scene => scene?.player?.active && !scene.finished && !scene.respawning && !scene.cinematicActive;
  const grounded = scene => {
    const body = scene?.player?.body;
    return Boolean(body?.blocked?.down || body?.touching?.down || body?.onFloor?.());
  };
  const getFlightActive = scene => Boolean(
    scene?.flightActive || scene?.flying || scene?.isFlying || scene?.player?.getData?.('flying') ||
    scene?.player?.getData?.('flightActive') || scene?.player?.getData?.('gliding')
  );

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
      @media(max-width:520px){#relayP2CharacterHud{bottom:88px}.#relayP2CharacterHud .p2-label{font-size:7px}}
    `;
    document.head.appendChild(style);
    const hud = document.createElement('div');
    hud.id = 'relayP2CharacterHud';
    hud.innerHTML = '<span class="p2-dot"></span><span class="p2-label">RUN READY</span>';
    document.body.appendChild(hud);
    return hud;
  }

  function makeWings(scene) {
    const left = scene.add.graphics().setDepth(13);
    const right = scene.add.graphics().setDepth(13);
    return { left, right, shown: false, pulse: 0 };
  }

  function drawWing(graphics, side, pulse) {
    graphics.clear();
    const flap = Math.sin(pulse) * 2.2;
    graphics.fillStyle(0x8df4ff, .18);
    graphics.lineStyle(1.5, 0xb9f5ff, .88);
    const s = side < 0 ? -1 : 1;
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

  function setWingsVisible(scene, state, visible) {
    state.wings.shown = visible;
    state.wings.left.setVisible(visible);
    state.wings.right.setVisible(visible);
    if (visible && !state.flightAnnounced) {
      scene.playerCue?.('FLIGHT · WINGS DEPLOYED', '#aee37f');
      state.flightAnnounced = true;
    }
    if (!visible) state.flightAnnounced = false;
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
    const flight = getFlightActive(scene) && !grounded(scene);
    const onGround = grounded(scene);
    const hit = Boolean(player.getData?.('hit') || player.getData?.('hurt') || scene.playerHit);

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

    if (next === 'run') {
      player.setTexture?.(resolveTexture(scene, state.runFrame ? 'runner-run-b' : 'runner-run-a') || player.texture?.key);
    } else if (next === 'jump') {
      player.setTexture?.(resolveTexture(scene, 'runner-jump') || player.texture?.key);
    } else if (next === 'fall') {
      player.setTexture?.(resolveTexture(scene, 'runner-fall') || player.texture?.key);
    } else if (next === 'dash') {
      player.setTexture?.(resolveTexture(scene, 'runner-dash') || player.texture?.key);
    } else if (next === 'hit') {
      player.setTexture?.(resolveTexture(scene, 'runner-hit') || player.texture?.key);
    } else if (next === 'fly') {
      player.setTexture?.(resolveTexture(scene, 'runner-jump') || player.texture?.key);
    } else if (next === 'idle' && speed < 20 && Math.abs(vy) < 20) {
      player.setTexture?.(resolveTexture(scene, 'runner-idle') || player.texture?.key);
    }

    player.setData?.('presentationState', next);
    player.setData?.('singleCharacterPresentation', true);

    const wingsOn = next === 'fly';
    setWingsVisible(scene, state, wingsOn);
    if (wingsOn) {
      const x = player.x + (player.flipX ? -2 : 2);
      const y = player.y - 10;
      state.wings.left.setPosition(x, y);
      state.wings.right.setPosition(x, y);
      drawWing(state.wings.left, -1, state.flightPulse);
      drawWing(state.wings.right, 1, state.flightPulse + Math.PI * .08);
    }

    const hud = ensureUi(scene);
    const label = { idle:'READY', run:'RUN', jump:'JUMP', fall:'FALL', dash:'DASH', fly:'FLIGHT', hit:'IMPACT' }[next] || 'READY';
    hud.querySelector('.p2-label').textContent = next === 'fly' ? 'FLIGHT · WINGS' : label;
    hud.classList.toggle('show', isGameplayVisible(scene));
    hud.classList.toggle('flight', next === 'fly');
    hud.classList.toggle('dash', next === 'dash');
    state.lastState = next;
  }

  const baseCreate = RunnerScene.prototype.create;
  const baseUpdate = RunnerScene.prototype.update;
  const baseShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function p2CharacterCreate(...args) {
    const result = baseCreate.apply(this, args);
    if (!states.has(this)) states.set(this, { tick:0, runFrame:0, flightPulse:0, lastState:'idle', flightAnnounced:false, wings: makeWings(this) });
    window.__relayRunnerScene = this;
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
})();
