// UPDATE 09 — WORLD INTERACTION V1
// Uses the real RunnerScene checkpoints. No duplicate save, mission, progression,
// combat, or checkpoint system is created here.
const INTERACT_DISTANCE = 150;
const MIN_SPAWN_DISTANCE = 220;
const sceneState = new WeakMap();

const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));

function ensureUi() {
  let button = document.getElementById('worldInteractButton');
  if (!button) {
    if (!document.getElementById('world-interaction-style')) {
      const style = document.createElement('style');
      style.id = 'world-interaction-style';
      style.textContent = `
        #worldInteractButton{position:fixed;left:50%;bottom:calc(150px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:100000;display:none;min-width:180px;padding:13px 22px;border:2px solid #8df4ff;border-radius:14px;background:rgba(4,15,28,.98);box-shadow:0 0 14px rgba(141,244,255,.48),0 0 30px rgba(25,200,245,.22),inset 0 0 15px rgba(141,244,255,.08);color:#e9fdff;font:900 13px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-align:center;text-transform:uppercase;pointer-events:auto;touch-action:manipulation}
        #worldInteractButton.is-visible{display:block;animation:relayInteractPulse 1s ease-in-out infinite alternate}
        #worldInteractButton.is-active{border-color:#aee37f;color:#efffdc}
        #worldInteractButton small{display:block;margin-top:6px;color:#8df4ff;font-size:9px;letter-spacing:.08em}
        @keyframes relayInteractPulse{from{transform:translateX(-50%) scale(1)}to{transform:translateX(-50%) scale(1.035)}}
        @media(min-width:769px){#worldInteractButton{bottom:30px;min-width:160px}}
        @media(prefers-reduced-motion:reduce){#worldInteractButton{animation:none}}
      `;
      document.head.appendChild(style);
    }
    button = document.createElement('button');
    button.id = 'worldInteractButton';
    button.type = 'button';
    button.innerHTML = 'INTERACT<small>E / TAP</small>';
    document.body.appendChild(button);
  }
  if (!button.dataset.bound) {
    button.dataset.bound = '1';
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      const scene = window.__relayRunnerScene;
      const target = scene?.worldInteractionTarget;
      if (scene && target) activate(scene, target);
    }, { passive:false });
  }
  return button;
}

function showCheckpointSecured(scene, checkpoint) {
  if (!scene?.add || !checkpoint?.active) return;
  checkpoint.setTint?.(0xaee37f);
  const ring = scene.add.circle(checkpoint.x, checkpoint.y - 30, 15, 0xaee37f, .16).setStrokeStyle(2, 0xdfffc2, .95).setDepth(13);
  const label = scene.add.text(checkpoint.x, checkpoint.y - 78, 'CHECKPOINT SECURED', { fontFamily:'DM Mono', fontSize:'12px', fontStyle:'bold', color:'#dfffc2', stroke:'#08101c', strokeThickness:4, align:'center' }).setOrigin(.5).setDepth(14);
  const sub = scene.add.text(checkpoint.x, checkpoint.y - 58, 'RESPAWN LINK ACTIVE', { fontFamily:'DM Mono', fontSize:'8px', color:'#b9f5ff', stroke:'#08101c', strokeThickness:3, align:'center' }).setOrigin(.5).setDepth(14);
  scene.tweens?.add({targets:ring,scale:2.8,alpha:0,duration:520,ease:'Quad.out',onComplete:()=>ring.destroy()});
  scene.tweens?.add({targets:label,y:label.y-18,alpha:0,delay:900,duration:520,onComplete:()=>label.destroy()});
  scene.tweens?.add({targets:sub,y:sub.y-14,alpha:0,delay:900,duration:520,onComplete:()=>sub.destroy()});
}

function markCheckpointSecured(scene, checkpoint) {
  if (!scene || !checkpoint) return;
  checkpoint.setData('worldInteractionSecured', true);
  checkpoint.setTint?.(0xaee37f);
  showCheckpointSecured(scene, checkpoint);
}

function makeTerminal(scene, checkpoint, index) {
  const terminal = scene.add.container(checkpoint.x + 42, checkpoint.y - 58).setDepth(20).setSize(46, 62);
  terminal.setDataEnabled();
  terminal.setData('checkpoint', checkpoint);
  terminal.setData('index', index);
  terminal.setData('activated', false);

  const shadow = scene.add.ellipse(0, 27, 40, 9, 0x000000, .34);
  const body = scene.add.rectangle(0, 0, 34, 46, 0x101d31, 1).setStrokeStyle(2, 0x8df4ff, 1);
  const screen = scene.add.rectangle(0, -11, 22, 12, 0x19c8f5, .42).setStrokeStyle(1, 0xc8fbff, 1);
  const core = scene.add.circle(0, 9, 6, 0xffd06e, 1).setStrokeStyle(1, 0xfff0b0, .95);
  const label = scene.add.text(0, 39, `LINK ${String(index + 1).padStart(2,'0')}`, { fontFamily:'monospace', fontSize:'9px', fontStyle:'bold', color:'#dffcff', stroke:'#02050d', strokeThickness:4 }).setOrigin(.5);
  terminal.add([shadow, body, screen, core, label]);
  terminal.setData('children', {body, screen, core, label});
  scene.tweens?.add({targets:core,alpha:{from:.35,to:1},scale:{from:.9,to:1.15},duration:620,yoyo:true,repeat:-1});
  scene.tweens?.add({targets:screen,alpha:{from:.25,to:.8},duration:800,yoyo:true,repeat:-1});
  return terminal;
}

export function setupWorldInteraction(scene) {
  if (!scene?.player || sceneState.has(scene)) return;
  const checkpoints = scene.checkpoints?.getChildren?.() || [];
  if (!checkpoints.length) return;

  const spawn = scene.mission?.spawn || scene.player;
  const ordered = checkpoints
    .map((checkpoint,index)=>({checkpoint,index,spawnDistance:distance(spawn,checkpoint)}))
    .sort((a,b)=>a.checkpoint.x-b.checkpoint.x);

  const eligible = ordered.filter(item => item.spawnDistance >= MIN_SPAWN_DISTANCE);
  const source = eligible.length ? eligible : ordered;
  const terminals = source.map(item => makeTerminal(scene,item.checkpoint,item.index));

  sceneState.set(scene,{terminals});
  scene.worldInteractionTerminals = terminals;
  window.__relayRunnerScene = scene;
  ensureUi();
}

function activate(scene, terminal) {
  const checkpoint = terminal?.getData('checkpoint');
  if (!scene || !terminal?.active || !checkpoint?.active || terminal.getData('activated')) return false;

  terminal.setData('activated', true);
  const children = terminal.getData('children');
  children?.body?.setStrokeStyle?.(2,0xaee37f,1);
  children?.screen?.setFillStyle?.(0xaee37f,.42);
  children?.core?.setFillStyle?.(0xaee37f,1);
  children?.label?.setText?.('SECURED');

  scene.activateCheckpoint?.(checkpoint);
  markCheckpointSecured(scene, checkpoint);

  const barrier = (scene.barriers?.getChildren?.() || [])
    .filter(item=>item?.active)
    .sort((a,b)=>distance(terminal,a)-distance(terminal,b))[0];
  if (barrier && distance(terminal,barrier) < 220) {
    try { barrier.disableBody(true,true); } catch {}
    scene.playerCue?.('ACCESS GRANTED · ROUTE OPEN','#aee37f');
  } else {
    scene.playerCue?.('CHECKPOINT SECURED','#aee37f');
  }

  const button = ensureUi();
  button.classList.remove('is-visible');
  button.classList.add('is-active');
  window.setTimeout(()=>button.classList.remove('is-active'),900);
  scene.game?.events?.emit('world-interaction',{type:'checkpoint-terminal',index:terminal.getData('index'),secured:true});
  return true;
}

export function updateWorldInteraction(scene) {
  const state = sceneState.get(scene);
  if (!scene?.player?.active || !state) return;
  window.__relayRunnerScene = scene;
  const button = ensureUi();
  const candidates = state.terminals
    .filter(terminal=>terminal?.active && !terminal.getData('activated'))
    .filter(terminal=>distance(scene.player,terminal)<=INTERACT_DISTANCE)
    .sort((a,b)=>distance(scene.player,a)-distance(scene.player,b));
  const nearest = candidates[0] || null;
  scene.worldInteractionTarget = nearest;

  if (!nearest) {
    button.classList.remove('is-visible','is-active');
    return;
  }
  button.innerHTML = 'INTERACT<small>E / TAP · CHECKPOINT</small>';
  button.classList.add('is-visible');
  button.classList.remove('is-active');
}

document.addEventListener('keydown',event=>{
  if (event.repeat || event.key.toLowerCase()!=='e') return;
  const scene = window.__relayRunnerScene;
  const target = scene?.worldInteractionTarget;
  if (scene && target && activate(scene,target)) event.preventDefault();
},true);

document.addEventListener('visibilitychange',()=>{
  if (document.hidden) document.getElementById('worldInteractButton')?.classList.remove('is-visible','is-active');
});

ensureUi();
