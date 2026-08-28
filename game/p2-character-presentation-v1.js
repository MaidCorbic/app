import { RunnerScene } from './src/scenes/RunnerScene.js';

// P2 CHARACTER / PRESENTATION V2
// One player object. The authoritative flight system owns physics; this layer
// only renders character states, wings, and the presentation HUD.
(() => {
  'use strict';
  if (!RunnerScene?.prototype || window.__relayP2CharacterPresentationV2) return;
  window.__relayP2CharacterPresentationV2 = true;

  const states = new WeakMap();
  const RUN_TICKS = 7;
  const FLIGHT_STATES = new Set(['flying', 'hover']);

  const isGameplayVisible = scene => scene?.player?.active && !scene.finished && !scene.respawning && !scene.cinematicActive;
  const grounded = scene => {
    const body = scene?.player?.body;
    return Boolean(body?.blocked?.down || body?.touching?.down || body?.onFloor?.());
  };
  const getFlightState = scene => scene?.getFlightState?.() || null;
  const isFlying = scene => FLIGHT_STATES.has(String(getFlightState(scene)?.state || ''));

  function ensureUi() {
    let hud = document.getElementById('relayP2CharacterHud');
    if (hud) return hud;
    const style = document.createElement('style');
    style.id = 'relay-p2-character-style-v2';
    style.textContent = `
      #relayP2CharacterHud{position:fixed;left:50%;bottom:clamp(88px,11vh,118px);transform:translateX(-50%);z-index:960;pointer-events:none;display:flex;align-items:center;gap:8px;padding:7px 11px;border:1px solid rgba(141,244,255,.18);border-radius:999px;background:rgba(3,10,20,.72);backdrop-filter:blur(9px);opacity:0;transition:opacity .14s ease,transform .14s ease;box-shadow:0 10px 28px rgba(0,0,0,.28)}
      #relayP2CharacterHud.show{opacity:.94}
      #relayP2CharacterHud .p2-dot{width:6px;height:6px;border-radius:50%;background:#8df4ff;box-shadow:0 0 12px rgba(141,244,255,.72);flex:0 0 auto}
      #relayP2CharacterHud .p2-label{font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;color:#dffcff;white-space:nowrap}
      #relayP2CharacterHud .p2-hint{font:700 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;color:#6f879d;white-space:nowrap}
      #relayP2CharacterHud.flight .p2-dot{background:#aee37f;box-shadow:0 0 14px rgba(174,227,127,.85)}
      #relayP2CharacterHud.dash .p2-dot{background:#ffd06e;box-shadow:0 0 14px rgba(255,208,110,.9)}
      #relayP2CharacterHud.impact .p2-dot{background:#ff826e;box-shadow:0 0 14px rgba(255,130,110,.82)}
      .relay-p2-character-fly{display:none;position:fixed;right:16px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:965;width:60px;height:54px;border:1px solid rgba(174,227,127,.5);border-radius:15px;background:linear-gradient(145deg,rgba(14,32,18,.97),rgba(5,14,9,.99));color:#efffdc;font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;align-items:center;justify-content:center;box-shadow:0 0 18px rgba(174,227,127,.12),0 12px 28px rgba(0,0,0,.44);touch-action:manipulation;user-select:none}
      .relay-p2-character-fly.active{border-color:#aee37f;box-shadow:0 0 24px rgba(174,227,127,.3),0 12px 28px rgba(0,0,0,.44);transform:scale(.95)}
      @media(max-width:520px){#relayP2CharacterHud{bottom:162px}.relay-p2-character-fly{display:flex}}
      @media(max-width:380px){#relayP2CharacterHud{bottom:146px;padding:6px 8px}.relay-p2-character-fly{right:10px;width:54px;height:50px}.#relayP2CharacterHud .p2-hint{display:none}}
    `;
    document.head.appendChild(style);
    hud = document.createElement('div');
    hud.id = 'relayP2CharacterHud';
    hud.innerHTML = '<span class="p2-dot"></span><span class="p2-label">READY</span><span class="p2-hint">SHIFT=DASH · F=FLIGHT</span>';
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
    button.setAttribute('aria-label', 'Toggle flight');
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      button.classList.add('active');
      window.dispatchEvent(new CustomEvent('relay:toggle-flight', { detail:{ source:'mobile-p2' } }));
    }, { passive:false });
    const clear = () => button.classList.remove('active');
    button.addEventListener('pointerup', clear);
    button.addEventListener('pointercancel', clear);
    window.addEventListener('blur', clear);
    actions.appendChild(button);
    return button;
  }

  function makeWings(scene) {
    const left = scene.add.graphics().setDepth(14);
    const right = scene.add.graphics().setDepth(14);
    return { left, right, shown:false, pulse:0 };
  }

  function drawWing(graphics, side, pulse) {
    graphics.clear();
    const flap = Math.sin(pulse) * 2.4;
    const s = side < 0 ? -1 : 1;
    graphics.fillStyle(0x8df4ff, .18);
    graphics.lineStyle(1.5, 0xb9f5ff, .9);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(s * 13, -8 - flap);
    graphics.lineTo(s * 29, -1 - flap * .5);
    graphics.lineTo(s * 18, 8 + flap);
    graphics.lineTo(0, 4);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.lineStyle(1, 0xeaffff, .48);
    graphics.lineBetween(0, 1, s * 21, -2 - flap * .5);
  }

  function applyCharacterState(scene, state, delta) {
    const player = scene.player;
    const body = player?.body;
    if (!player?.active || !body) return;

    const vx = Number(body.velocity?.x) || 0;
    const vy = Number(body.velocity?.y) || 0;
    const speed = Math.abs(vx);
    const dashing = Boolean(scene.dashing || player.getData?.('dashing'));
    const onGround = grounded(scene);
    const hit = Boolean(player.getData?.('hit') || player.getData?.('hurt') || scene.playerHit);
    const flight = isFlying(scene) && !onGround;

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

    const textureKey = next === 'run'
      ? (state.runFrame ? 'runner-run-b' : 'runner-run-a')
      : next === 'jump' ? 'runner-jump'
      : next === 'fall' ? 'runner-fall'
      : next === 'dash' ? 'runner-dash'
      : next === 'hit' ? 'runner-hit'
      : 'runner-idle';
    const resolved = scene?.textures?.exists?.(textureKey) ? textureKey : null;
    if (resolved && player.texture?.key !== resolved) player.setTexture(resolved);

    player.setData?.('presentationState', next);
    player.setData?.('singleCharacterPresentation', true);

    const wingsOn = next === 'fly';
    state.wings.shown = wingsOn;
    state.wings.left.setVisible(wingsOn);
    state.wings.right.setVisible(wingsOn);
    if (wingsOn) {
      const x = player.x + (player.flipX ? -2 : 2);
      const y = player.y - 9;
      state.wings.left.setPosition(x, y);
      state.wings.right.setPosition(x, y);
      drawWing(state.wings.left, -1, state.flightPulse);
      drawWing(state.wings.right, 1, state.flightPulse + Math.PI * .08);
    }

    const hud = ensureUi();
    const labels = { idle:'READY', run:'RUN', jump:'JUMP', fall:'FALL', dash:'DASH', fly:'FLIGHT · WINGS', hit:'IMPACT' };
    hud.querySelector('.p2-label').textContent = labels[next] || 'READY';
    hud.querySelector('.p2-hint').textContent = next === 'fly' ? 'F = FLIGHT OFF' : 'SHIFT = DASH · F = FLIGHT';
    hud.classList.toggle('show', isGameplayVisible(scene));
    hud.classList.toggle('flight', next === 'fly');
    hud.classList.toggle('dash', next === 'dash');
    hud.classList.toggle('impact', next === 'hit');
    state.lastState = next;

    const mobileButton = document.getElementById('relayP2FlightButton');
    mobileButton?.classList.toggle('active', flight);
  }

  const baseCreate = RunnerScene.prototype.create;
  const baseUpdate = RunnerScene.prototype.update;
  const baseShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function p2CharacterCreate(...args) {
    const result = baseCreate.apply(this, args);
    states.set(this, { tick:0, runFrame:0, flightPulse:0, lastState:'idle', wings:makeWings(this) });
    window.__relayRunnerScene = this;
    ensureUi();
    ensureMobileFlightButton();
    return result;
  };

  RunnerScene.prototype.update = function p2CharacterUpdate(time, delta, ...args) {
    const result = baseUpdate.apply(this, [time, delta, ...args]);
    const state = states.get(this);
    if (state) {
      try { applyCharacterState(this, state, delta); } catch (error) { console.error('[P2Character] update failed', error); }
    }
    return result;
  };

  RunnerScene.prototype.shutdown = function p2CharacterShutdown(...args) {
    const state = states.get(this);
    state?.wings?.left?.destroy?.();
    state?.wings?.right?.destroy?.();
    document.getElementById('relayP2FlightButton')?.remove();
    document.getElementById('relayP2CharacterHud')?.classList.remove('show');
    const result = baseShutdown?.apply(this, args);
    states.delete(this);
    return result;
  };

  const forwardFlight = event => {
    if (event.code !== 'KeyF' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const scene = window.__relayRunnerScene;
    if (!scene || !isGameplayVisible(scene) || typeof scene.toggleFlightMode !== 'function') return;
    const target = event.target;
    if (target && typeof target.tagName === 'string' && /input|textarea|select|button/i.test(target.tagName)) return;
    event.preventDefault();
    scene.toggleFlightMode('keyboard-p2');
  };
  window.addEventListener('keydown', forwardFlight, true);
})();
