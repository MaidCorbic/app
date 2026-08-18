// UPDATE 09 — WORLD INTERACTION V1 FINAL
// Uses the existing RunnerScene lifecycle through core-stability.js.
// No new save, mission, progression, combat, or checkpoint system is created.

const INTERACT_DISTANCE = 220;
const stateByScene = new WeakMap();

const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

function ensureUi() {
  let button = document.getElementById('worldInteractButton');
  if (!button) {
    const style = document.createElement('style');
    style.id = 'world-interaction-style';
    style.textContent = `
      #worldInteractButton{
        position:fixed;left:50%;top:55%;transform:translate(-50%,-50%);
        z-index:99999;display:none;min-width:176px;padding:12px 20px;
        border:2px solid #8df4ff;border-radius:14px;
        background:linear-gradient(180deg,rgba(10,30,48,.98),rgba(3,12,24,.99));
        box-shadow:0 0 14px rgba(141,244,255,.45),0 0 30px rgba(25,200,245,.22);
        color:#e9fdff;font:900 12px/1.1 ui-monospace,monospace;
        letter-spacing:.12em;text-align:center;text-transform:uppercase;
        pointer-events:auto;touch-action:manipulation;
      }
      #worldInteractButton.is-visible{display:block}
      #worldInteractButton.is-active{border-color:#aee37f;color:#efffdc}
      #worldInteractButton small{display:block;margin-top:6px;color:#8df4ff;font-size:9px}
      @media (min-width:769px){#worldInteractButton{top:auto;bottom:28px;transform:translateX(-50%)}}
    `;
    document.head.appendChild(style);
    button = document.createElement('button');
    button.id = 'worldInteractButton';
    button.type = 'button';
    button.innerHTML = 'INTERACT<small>E / TAP</small>';
    document.body.appendChild(button);
  }
  if (!button.dataset.worldInteractionBound) {
    button.dataset.worldInteractionBound = '1';
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const scene = window.__relayRunnerScene;
      if (scene) interact(scene);
    }, { passive:false });
  }
  return button;
}

function pulse(scene, x, y, color = 0x8df4ff) {
  if (!scene?.add) return;
  const ring = scene.add.circle(x, y, 12, color, .22).setDepth(200);
  scene.tweens?.add({ targets:ring, scale:3.2, alpha:0, duration:380, onComplete:()=>ring.destroy() });
}

function addTerminal(scene, x, y, index, checkpoint = null) {
  const terminal = scene.add.container(x, y).setDepth(110);
  terminal.setDataEnabled();
  terminal.setData('activated', false);
  terminal.setData('index', index);
  terminal.setData('checkpoint', checkpoint);

  const shadow = scene.add.rectangle(0, 5, 46, 62, 0x000000, .28);
  const body = scene.add.rectangle(0, 0, 36, 50, 0x111e32, .99).setStrokeStyle(2, 0x8df4ff, 1);
  const screen = scene.add.rectangle(0, -11, 22, 13, 0x19c8f5, .35).setStrokeStyle(1, 0xc8fbff, .95);
  const core = scene.add.circle(0, 10, 5, 0xffd06e, 1).setStrokeStyle(1, 0xfff0b0, .9);
  const label = scene.add.text(0, 39, `LINK ${String(index + 1).padStart(2,'0')}`, {
    fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#dffcff',stroke:'#02050d',strokeThickness:4
  }).setOrigin(.5);
  const prompt = scene.add.text(0, -44, 'INTERACT', {
    fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',color:'#8df4ff',stroke:'#02050d',strokeThickness:4
  }).setOrigin(.5);

  terminal.add([shadow, body, screen, core, label, prompt]);

  if (!scene.motionReduced) {
    scene.tweens?.add({targets:core,alpha:{from:.35,to:1},scale:{from:.9,to:1.18},duration:620,yoyo:true,repeat:-1});
    scene.tweens?.add({targets:screen,alpha:{from:.25,to:.85},duration:800,yoyo:true,repeat:-1});
    scene.tweens?.add({targets:prompt,alpha:{from:.45,to:1},duration:700,yoyo:true,repeat:-1});
  }
  return terminal;
}

export function setupWorldInteraction(scene) {
  if (!scene?.player || stateByScene.has(scene)) return;

  const terminals = [];
  const checkpoints = scene.checkpoints?.getChildren?.() || [];

  // Guaranteed first interaction point: visible shortly after spawn and linked to
  // the first real checkpoint. This makes UPDATE 09 testable in every mission.
  const firstCheckpoint = checkpoints.find(item => item?.active) || null;
  const spawn = scene.mission?.spawn || { x: scene.player.x, y: scene.player.y };
  terminals.push(addTerminal(
    scene,
    Number.isFinite(spawn.x) ? spawn.x + 120 : scene.player.x + 120,
    Number.isFinite(spawn.y) ? spawn.y - 54 : scene.player.y - 54,
    0,
    firstCheckpoint
  ));

  // Existing checkpoints get their own linked interaction terminal.
  checkpoints.forEach((checkpoint, index) => {
    terminals.push(addTerminal(scene, checkpoint.x + 58, checkpoint.y - 52, index + 1, checkpoint));
  });

  scene.worldInteractionTerminals = terminals;
  scene.worldInteractionTarget = null;
  stateByScene.set(scene, terminals);
  window.__relayRunnerScene = scene;
  ensureUi();
}

export function updateWorldInteraction(scene) {
  if (!scene?.player?.active) return;
  const terminals = stateByScene.get(scene);
  if (!terminals) return;

  window.__relayRunnerScene = scene;
  const button = ensureUi();

  const nearest = terminals
    .filter(t => t?.active && !t.getData('activated'))
    .sort((a,b) => distance(scene.player,a) - distance(scene.player,b))[0] || null;

  scene.worldInteractionTarget = nearest && distance(scene.player, nearest) <= INTERACT_DISTANCE ? nearest : null;

  if (!scene.worldInteractionTarget) {
    button.classList.remove('is-visible','is-active');
    return;
  }

  button.innerHTML = 'INTERACT<small>E / TAP</small>';
  button.classList.add('is-visible');
  button.classList.remove('is-active');
}

export function activate(scene, terminal = scene?.worldInteractionTarget) {
  if (!scene || !terminal?.active || terminal.getData('activated')) return false;
  if (distance(scene.player, terminal) > INTERACT_DISTANCE) return false;

  terminal.setData('activated', true);
  terminal.list?.forEach(child => child.setTint?.(0xaee37f));
  pulse(scene, terminal.x, terminal.y, 0xaee37f);

  const linkedCheckpoint = terminal.getData('checkpoint') || null;
  const checkpoint = linkedCheckpoint?.active
    ? linkedCheckpoint
    : (scene.checkpoints?.getChildren?.() || [])
        .filter(item => item?.active)
        .sort((a,b) => distance(terminal,a) - distance(terminal,b))[0] || null;

  if (checkpoint && typeof scene.activateCheckpoint === 'function') {
    scene.activateCheckpoint(checkpoint);
  }

  const nearbyBarrier = (scene.barriers?.getChildren?.() || [])
    .filter(item => item?.active)
    .sort((a,b) => distance(terminal,a) - distance(terminal,b))[0] || null;

  if (nearbyBarrier && distance(terminal, nearbyBarrier) < 220) {
    try { nearbyBarrier.disableBody(true, true); } catch {}
    scene.playerCue?.('ACCESS GRANTED · ROUTE OPEN', '#aee37f');
  } else {
    scene.playerCue?.('CHECKPOINT LINKED', '#aee37f');
  }

  const button = ensureUi();
  button.classList.remove('is-visible');
  button.classList.add('is-active');
  scene.game?.events?.emit('world-interaction', {
    type:'terminal', index:terminal.getData('index'), activated:true
  });
  return true;
}

function interact(scene) {
  const target = scene?.worldInteractionTarget;
  if (!target) return false;
  return activate(scene, target);
}

document.addEventListener('keydown', event => {
  if (event.repeat || String(event.key).toLowerCase() !== 'e') return;
  const scene = window.__relayRunnerScene;
  if (scene && interact(scene)) event.preventDefault();
}, true);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) document.getElementById('worldInteractButton')?.classList.remove('is-visible','is-active');
});

ensureUi();
