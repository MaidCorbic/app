import { RunnerScene } from './src/scenes/RunnerScene.js';

// P2 CHARACTER / PRESENTATION V4
// Presentation only: the existing flight system owns physics and F input.
// This layer owns one player visual state, wings, and a compact visible HUD.
(() => {
  'use strict';
  if (!RunnerScene.prototype || window.__relayP2CharacterPresentationV4) return;
  window.__relayP2CharacterPresentationV4 = true;

  const states = new WeakMap();
  const FLIGHT_STATES = new Set(['flying', 'hover']);
  const gameplayVisible = scene => scene?.player?.active && !scene.finished && !scene.respawning && !scene.cinematicActive;
  const grounded = scene => Boolean(scene?.player?.body?.blocked?.down || scene?.player?.body?.touching?.down || scene?.player?.body?.onFloor?.());

  function ensureHud() {
    let hud = document.getElementById('relayP2CharacterHud');
    if (hud) return hud;
    const style = document.createElement('style');
    style.id = 'relay-p2-character-v4-style';
    style.textContent = `
#relayP2CharacterHud{position:fixed;left:50%;bottom:clamp(92px,11vh,124px);z-index:960;display:grid;grid-template-columns:auto auto;gap:4px 8px;align-items:center;padding:7px 11px;border:1px solid rgba(174,227,127,.35);border-radius:8px;background:rgba(23,35,51,.96);opacity:0;transform:translateX(-50%) translateY(8px);transition:opacity .3s ease,transform .3s ease;pointer-events:none}
#relayP2CharacterHud.show{opacity:.96;transform:translateX(-50%) translateY(0)}
#relayP2CharacterHud .dot{grid-row:1/span 2;width:6px;height:6px;border-radius:50%;background:#8df4ff;box-shadow:0 0 12px rgba(141,244,255,.75)}
#relayP2CharacterHud.flight .dot{background:#aee37f;box-shadow:0 0 14px rgba(174,227,127,.85)}
#relayP2CharacterHud.dash .dot{background:#ffd06e;box-shadow:0 0 14px rgba(255,208,110,.9)}
#relayP2CharacterHud .label{font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;color:#e7fbff;white-space:nowrap}
#relayP2CharacterHud .detail{font:700 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;color:#7892a8;white-space:nowrap}
.relay-p2-flight-button{display:none;position:fixed;right:14px;bottom:calc(90px + env(safe-area-inset-bottom,0px));z-index:965;width:60px;height:54px;border:1px solid rgba(174,227,127,.55);border-radius:6px;background:rgba(23,35,51,.92);cursor:pointer;transition:all .2s ease;font:600 11px ui-system-ui,-apple-system,sans-serif;color:#e7fbff;text-transform:uppercase;letter-spacing:.08em}
.relay-p2-flight-button:hover{border-color:rgba(174,227,127,.75);background:rgba(23,35,51,.98)}
.relay-p2-flight-button.active{border-color:#aee37f;box-shadow:0 0 26px rgba(174,227,127,.35),0 12px 28px rgba(0,0,0,.42);transform:scale(.95)}
@media(max-width:520px){#relayP2CharacterHud{bottom:158px}.relay-p2-flight-button{display:block}}
@media(max-width:380px){#relayP2CharacterHud{bottom:143px;padding:6px 8px}.#relayP2CharacterHud .detail{font-size:6px}.relay-p2-flight-button{right:9px;width:54px;height:50px}}
`;
    document.head.appendChild(style);
    hud = document.createElement('div');
    hud.id = 'relayP2CharacterHud';
    hud.innerHTML = '<span class="dot"></span><span class="label">READY</span><span class="detail">SHIFT = DASH · F = FLIGHT</span>';
    document.body.appendChild(hud);
    return hud;
  }

  function ensureMobileFlightButton() {
    if (!document.body.classList.contains('is-touch') || document.getElementById('relayP2FlightButton')) return document.getElementById('relayP2FlightButton');
    const actions = document.querySelector('.mobile-actions');
    if (!actions) return null;
    const button = document.createElement('button');
    button.id = 'relayP2FlightButton';
    button.className = 'relay-p2-flight-button';
    button.type = 'button';
    button.textContent = 'FLY';
    button.setAttribute('aria-label', 'Toggle flight');
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const scene = window.__relayRunnerScene;
      if (scene?.toggleFlightMode) scene.toggleFlightMode('mobile-p2');
    }, { passive:false });
    actions.appendChild(button);
    return button;
  }

  const flightState = scene => String(scene?.getFlightState?.()?.state || '');

  const mount = scene => {
    if (states.has(scene)) return;
    const wings = {
      left: scene.add.graphics().setDepth(14),
      right: scene.add.graphics().setDepth(14),
    };
    states.set(scene, { tick:0, runFrame:0, pulse:0, wings });
    ensureHud();
    ensureMobileFlightButton();
  };

  const drawWing = (graphics, side, pulse) => {
    graphics.clear();
    const s = side < 0 ? -1 : 1;
    const flap = Math.sin(pulse) * 2.5;
    graphics.fillStyle(0x8df4ff, .19);
    graphics.lineStyle(1.5, 0xb9f5ff, .9);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(s * 14, -8 - flap);
    graphics.lineTo(s * 29, -1 - flap * .5);
    graphics.lineTo(s * 18, 8 + flap);
    graphics.lineTo(0, 4);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  };

  const updatePresentation = (scene, state, delta) => {
    const player = scene.player;
    const body = player?.body;
    if (!player?.active || !body) return;
    const onGround = grounded(scene);
    const vx = Number(body.velocity?.x) || 0;
    const vy = Number(body.velocity?.y) || 0;
    const dashing = Boolean(scene.dashing || player.getData?.('dashing'));
    const hit = Boolean(player.getData?.('hit') || player.getData?.('hurt') || scene.playerHit);
    const flying = FLIGHT_STATES.has(flightState(scene)) && !onGround;
    let current = 'idle';
    if (dashing) current = 'dash';
    else if (hit) current = 'hit';
    else if (flying) current = 'fly';
    else if (!onGround && vy < -30) current = 'jump';
    else if (!onGround) current = 'fall';
    else if (Math.abs(vx) > 45) current = 'run';

    state.tick += Math.max(1, Math.round((delta || 16) / 16));
    if (current === 'run') state.runFrame = Math.floor(state.tick / 7) % 2;
    if (current === 'fly') state.pulse += (delta || 16) * .012;

    const texture = current === 'run' ? (state.runFrame ? 'runner-run-b' : 'runner-run-a')
      : current === 'jump' ? 'runner-jump'
      : current === 'fall' ? 'runner-fall'
      : current === 'dash' ? 'runner-dash'
      : current === 'hit' ? 'runner-hit'
      : 'runner-idle';
    if (scene.textures?.exists?.(texture) && player.texture?.key !== texture) player.setTexture(texture);

    player.setData?.('presentationState', current);
    player.setData?.('singleCharacterPresentation', true);

    const wingsOn = current === 'fly';
    state.wings.left.setVisible(wingsOn);
    state.wings.right.setVisible(wingsOn);
    if (wingsOn) {
      const x = player.x + (player.flipX ? -2 : 2);
      const y = player.y - 9;
      state.wings.left.setPosition(x, y);
      state.wings.right.setPosition(x, y);
      drawWing(state.wings.left, -1, state.pulse);
      drawWing(state.wings.right, 1, state.pulse + .25);
    }

    const hud = ensureHud();
    const info = scene.getFlightState?.();
    const label = { idle:'READY', run:'RUN', jump:'JUMP', fall:'FALL', dash:'DASH', fly:'FLIGHT · WINGS', hit:'IMPACT' }[current] || 'READY';
    hud.querySelector('.label').textContent = label;
    if (current === 'fly') {
      hud.querySelector('.detail').textContent = `F = FLIGHT OFF · ${info?.remainingSeconds ?? 0}s · ENERGY ${Math.round((info?.energyRatio || 0) * 100)}%`;
    } else if (current === 'dash') {
      hud.querySelector('.detail').textContent = 'BREAK WINDOW ACTIVE';
    } else {
      hud.querySelector('.detail').textContent = 'SHIFT = DASH · F = FLIGHT';
    }
    hud.classList.toggle('show', gameplayVisible(scene));
    hud.classList.toggle('flight', current === 'fly');
    hud.classList.toggle('dash', current === 'dash');
    const flyButton = document.getElementById('relayP2FlightButton');
    const flyActive = FLIGHT_STATES.has(flightState(scene));
    flyButton?.classList.toggle('active', flyActive);
    flyButton?.setAttribute('aria-pressed', String(flyActive));
  };

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  const originalShutdown = RunnerScene.prototype.shutdown;

  RunnerScene.prototype.create = function p2V4Create(...args) {
    const result = originalCreate.apply(this, args);
    mount(this);
    window.__relayRunnerScene = this;
    return result;
  };
  RunnerScene.prototype.update = function p2V4Update(time, delta, ...args) {
    const result = originalUpdate.apply(this, [time, delta, ...args]);
    const state = states.get(this);
    if (state) {
      try { updatePresentation(this, state, delta); } catch (error) { console.error('[P2CharacterV4] update failed', error); }
    }
    return result;
  };
  RunnerScene.prototype.shutdown = function p2V4Shutdown(...args) {
    const state = states.get(this);
    state?.wings?.left?.destroy?.();
    state?.wings?.right?.destroy?.();
    document.getElementById('relayP2FlightButton')?.remove();
    document.getElementById('relayP2CharacterHud')?.classList.remove('show');
    states.delete(this);
    return originalShutdown?.apply(this, args);
  };
})();
