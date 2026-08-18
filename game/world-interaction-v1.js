import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 09 — WORLD INTERACTION V1
// Additive layer only: reuses existing checkpoints/barriers/playerCue and never creates a second save,
// mission, progression, combat, or checkpoint system.
(() => {
  if (window.__relayWorldInteractionV1) return;
  window.__relayWorldInteractionV1 = true;

  const INTERACT_DISTANCE = 112;
  const terminalsByScene = new WeakMap();

  const ensureUi = () => {
    if (document.getElementById('worldInteractButton')) return document.getElementById('worldInteractButton');
    const style = document.createElement('style');
    style.dataset.worldInteractionV1 = 'true';
    style.textContent = `
      #worldInteractButton{position:fixed;left:50%;bottom:calc(104px + env(safe-area-inset-bottom,0px));transform:translateX(-50%) scale(.96);z-index:1200;display:none;min-width:148px;padding:11px 18px;border:1px solid rgba(141,244,255,.8);border-radius:12px;background:linear-gradient(180deg,rgba(11,30,49,.96),rgba(4,14,26,.98));box-shadow:0 0 24px rgba(25,200,245,.24),inset 0 0 14px rgba(141,244,255,.08);color:#dffcff;font:800 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;pointer-events:auto;opacity:0;transition:opacity .14s ease,transform .14s ease}
      #worldInteractButton.is-visible{display:block;opacity:1;transform:translateX(-50%) scale(1)}
      #worldInteractButton small{display:block;margin-top:5px;color:#8df4ff;font-size:8px;letter-spacing:.08em}
      @media(min-width:769px){#worldInteractButton{bottom:28px;min-width:132px;padding:9px 15px}}
      @media(prefers-reduced-motion:reduce){#worldInteractButton{transition:none}}
    `;
    document.head.appendChild(style);
    const button = document.createElement('button');
    button.id = 'worldInteractButton';
    button.type = 'button';
    button.innerHTML = 'INTERACT<small>E / TAP</small>';
    document.body.appendChild(button);
    return button;
  };

  const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

  const pulse = (scene, terminal, color = 0x8df4ff) => {
    const ring = scene.add.circle(terminal.x, terminal.y, 12, color, .18).setDepth(14).setScale(.7);
    scene.tweens.add({ targets:ring, scale:3.4, alpha:0, duration:360, onComplete:()=>ring.destroy() });
  };

  const activate = (scene, terminal) => {
    if (!terminal?.active || terminal.getData('activated')) return;
    terminal.setData('activated', true);
    terminal.setTint(0xaee37f);
    pulse(scene, terminal, 0xaee37f);

    // Reuse the existing checkpoint system instead of creating another checkpoint/save path.
    const checkpoint = scene.checkpoints?.getChildren?.()
      .filter(item => item?.active)
      .sort((a,b) => distance(terminal,a) - distance(terminal,b))[0];
    if (checkpoint && typeof scene.activateCheckpoint === 'function') scene.activateCheckpoint(checkpoint);

    // If an existing barrier is close enough, use its current physics body and disable it.
    // This is intentionally opt-in per terminal and never creates a new collision system.
    const barrier = scene.barriers?.getChildren?.()
      .filter(item => item?.active)
      .sort((a,b) => distance(terminal,a) - distance(terminal,b))[0];
    if (barrier && distance(terminal, barrier) < 210) {
      barrier.disableBody(true, true);
      scene.playerCue?.('ACCESS GRANTED · ROUTE OPEN', '#aee37f');
    } else {
      scene.playerCue?.('CHECKPOINT LINKED', '#aee37f');
    }
    scene.game?.events?.emit('world-interaction', { type:'terminal', activated:true });
  };

  const addTerminal = (scene, x, y, index) => {
    const terminal = scene.add.container(x, y).setDepth(12).setSize(34, 48);
    const body = scene.add.rectangle(0, 0, 30, 42, 0x172238, .96).setStrokeStyle(2, 0x8df4ff, .9);
    const screen = scene.add.rectangle(0, -7, 18, 10, 0x8df4ff, .18).setStrokeStyle(1, 0xb9f5ff, .8);
    const light = scene.add.circle(0, 11, 3, 0xffd06e, .9);
    const label = scene.add.text(0, 34, `LINK ${String(index + 1).padStart(2,'0')}`, { fontFamily:'DM Mono', fontSize:'8px', color:'#b9f5ff', stroke:'#08101c', strokeThickness:3 }).setOrigin(.5);
    terminal.add([body, screen, light, label]);
    terminal.setDataEnabled();
    terminal.setData('activated', false);
    terminal.setData('index', index);
    terminal.setData('hint', 'ACCESS TERMINAL');
    if (!scene.motionReduced) {
      scene.tweens.add({ targets:light, alpha:{from:.35,to:1}, duration:620, yoyo:true, repeat:-1 });
      scene.tweens.add({ targets:screen, alpha:{from:.35,to:.8}, duration:900, yoyo:true, repeat:-1 });
    }
    return terminal;
  };

  const setup = scene => {
    if (!scene?.player || !scene.mission || terminalsByScene.has(scene)) return;
    const terminals = [];
    const checkpoints = scene.checkpoints?.getChildren?.() || [];
    // One terminal per existing checkpoint. If a mission has no checkpoints, use a safe point
    // just before the existing delivery beacon. This keeps every mission interactable without
    // inventing a second level/progression system.
    if (checkpoints.length) {
      checkpoints.forEach((checkpoint, index) => terminals.push(addTerminal(scene, checkpoint.x + 52, checkpoint.y - 2, index)));
    } else if (scene.goal) {
      const point = scene.safeCheckpointSpawn?.(scene.goal.x - 150) || { x: scene.goal.x - 150, y: scene.goal.y - 48 };
      terminals.push(addTerminal(scene, point.x, point.y, 0));
    }
    terminalsByScene.set(scene, terminals);
    scene.worldInteractionTerminals = terminals;
  };

  const update = scene => {
    const terminals = terminalsByScene.get(scene);
    if (!terminals || !scene.player?.active) return;
    const button = ensureUi();
    const nearest = terminals.filter(t => t.active && distance(scene.player, t) <= INTERACT_DISTANCE)
      .sort((a,b)=>distance(scene.player,a)-distance(scene.player,b))[0];
    if (!nearest) {
      button.classList.remove('is-visible');
      scene.worldInteractionTarget = null;
      return;
    }
    scene.worldInteractionTarget = nearest;
    const active = nearest.getData('activated');
    button.innerHTML = active ? 'LINK ACTIVE<small>CHECKPOINT READY</small>' : 'INTERACT<small>E / TAP</small>';
    button.classList.add('is-visible');
  };

  const interact = scene => {
    const target = scene?.worldInteractionTarget;
    if (!target || target.getData('activated')) return false;
    activate(scene, target);
    return true;
  };

  // The scene is added to Phaser before this module is imported, but mission scenes are started
  // later by the existing main flow. Wrapping lifecycle methods here therefore attaches cleanly
  // without changing the existing RunnerScene implementation.
  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  if (typeof originalCreate === 'function') {
    RunnerScene.prototype.create = function worldInteractionCreate(...args) {
      const result = originalCreate.apply(this, args);
      setup(this);
      return result;
    };
  }
  if (typeof originalUpdate === 'function') {
    RunnerScene.prototype.update = function worldInteractionUpdate(...args) {
      const result = originalUpdate.apply(this, args);
      update(this);
      return result;
    };
  }

  const button = ensureUi();
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    const scene = window.__relayRunnerScene;
    if (scene) interact(scene);
  }, { passive:false });

  // Keyboard interaction is intentionally scoped to the active runner scene.
  document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() !== 'e' || event.repeat) return;
    const scene = window.__relayRunnerScene;
    if (scene && interact(scene)) event.preventDefault();
  }, true);

  // Expose only the active scene reference; no duplicate game/state instance is created.
  const originalBoot = RunnerScene.prototype.create;
  if (originalBoot) {
    // The wrapper above is already installed; capture the scene whenever create is called.
    const wrapped = RunnerScene.prototype.create;
    RunnerScene.prototype.create = function captureWorldInteractionScene(...args) {
      window.__relayRunnerScene = this;
      return wrapped.apply(this, args);
    };
  }
})();
