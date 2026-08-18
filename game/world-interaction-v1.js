import { RunnerScene } from './src/scenes/RunnerScene.js';

// UPDATE 09 — WORLD INTERACTION V1 FINAL
// Reuses existing checkpoint/barrier systems. No duplicate save, mission, progression or combat systems.
(() => {
  if (window.__relayWorldInteractionV2) return;
  window.__relayWorldInteractionV2 = true;

  const INTERACT_DISTANCE = 150;
  const sceneTerminals = new WeakMap();
  let activeScene = null;

  const ensureUi = () => {
    let button = document.getElementById('worldInteractButton');
    if (button) return button;
    const style = document.createElement('style');
    style.dataset.worldInteractionV2 = 'true';
    style.textContent = `
      #worldInteractButton{position:fixed;left:50%;bottom:calc(118px + env(safe-area-inset-bottom,0px));transform:translateX(-50%) translateY(8px);z-index:3000;display:none;min-width:154px;padding:12px 20px;border:1px solid rgba(141,244,255,.95);border-radius:14px;background:linear-gradient(180deg,rgba(10,30,48,.98),rgba(3,12,24,.99));box-shadow:0 0 10px rgba(141,244,255,.38),0 0 28px rgba(25,200,245,.22),inset 0 0 16px rgba(141,244,255,.08);color:#e9fdff;font:900 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;pointer-events:auto;opacity:0;transition:opacity .15s ease,transform .15s ease}
      #worldInteractButton.is-visible{display:block;opacity:1;transform:translateX(-50%) translateY(0)}
      #worldInteractButton.is-active{border-color:#aee37f;box-shadow:0 0 12px rgba(174,227,127,.42),0 0 30px rgba(174,227,127,.2)}
      #worldInteractButton small{display:block;margin-top:6px;color:#8df4ff;font-size:9px;letter-spacing:.08em}
      @media(min-width:769px){#worldInteractButton{bottom:30px;min-width:136px}}
      @media(prefers-reduced-motion:reduce){#worldInteractButton{transition:none}}
    `;
    document.head.appendChild(style);
    button = document.createElement('button');
    button.id = 'worldInteractButton';
    button.type = 'button';
    button.innerHTML = 'INTERACT<small>E / TAP</small>';
    document.body.appendChild(button);
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      interact(activeScene);
    }, { passive:false });
    return button;
  };

  const distance = (a,b) => Math.hypot((a?.x || 0)-(b?.x || 0),(a?.y || 0)-(b?.y || 0));

  const pulse = (scene, terminal, color=0x8df4ff) => {
    if (!scene?.add || !terminal?.active) return;
    const ring = scene.add.circle(terminal.x, terminal.y, 14, color, .22).setDepth(100);
    scene.tweens?.add({targets:ring,scale:3.2,alpha:0,duration:380,onComplete:()=>ring.destroy()});
  };

  const activate = (scene, terminal) => {
    if (!scene || !terminal?.active || terminal.getData('activated')) return false;
    terminal.setData('activated', true);
    terminal.setData('interactable', false);
    terminal.setTint(0xaee37f);
    pulse(scene, terminal, 0xaee37f);

    const checkpoint = (scene.checkpoints?.getChildren?.() || [])
      .filter(item=>item?.active)
      .sort((a,b)=>distance(terminal,a)-distance(terminal,b))[0];
    if (checkpoint && typeof scene.activateCheckpoint === 'function') scene.activateCheckpoint(checkpoint);

    const barrier = (scene.barriers?.getChildren?.() || [])
      .filter(item=>item?.active)
      .sort((a,b)=>distance(terminal,a)-distance(terminal,b))[0];
    if (barrier && distance(terminal,barrier) < 220) {
      try { barrier.disableBody(true,true); } catch {}
      scene.playerCue?.('ACCESS GRANTED · ROUTE OPEN','#aee37f');
    } else {
      scene.playerCue?.('CHECKPOINT LINKED','#aee37f');
    }
    scene.game?.events?.emit('world-interaction',{type:'terminal',activated:true});
    update(scene);
    return true;
  };

  const addTerminal = (scene,x,y,index) => {
    const terminal = scene.add.container(x,y).setDepth(100).setSize(42,58);
    terminal.setDataEnabled();
    terminal.setData('activated',false);
    terminal.setData('interactable',true);
    terminal.setData('index',index);

    const shadow = scene.add.rectangle(0,4,42,58,0x000000,.24);
    const body = scene.add.rectangle(0,0,34,48,0x111e32,.98).setStrokeStyle(2,0x8df4ff,1);
    const screen = scene.add.rectangle(0,-9,21,12,0x19c8f5,.25).setStrokeStyle(1,0xc8fbff,1);
    const core = scene.add.circle(0,9,5,0xffd06e,1).setStrokeStyle(1,0xfff0b0,.9);
    const label = scene.add.text(0,38,`LINK ${String(index+1).padStart(2,'0')}`,{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#dffcff',stroke:'#02050d',strokeThickness:4}).setOrigin(.5);
    terminal.add([shadow,body,screen,core,label]);

    if (!scene.motionReduced) {
      scene.tweens?.add({targets:core,alpha:{from:.35,to:1},scale:{from:.9,to:1.15},duration:620,yoyo:true,repeat:-1});
      scene.tweens?.add({targets:screen,alpha:{from:.25,to:.8},duration:800,yoyo:true,repeat:-1});
    }
    return terminal;
  };

  const setup = scene => {
    if (!scene?.player || sceneTerminals.has(scene)) return;
    const terminals = [];
    const checkpoints = scene.checkpoints?.getChildren?.() || [];
    if (checkpoints.length) {
      checkpoints.forEach((checkpoint,index) => {
        // Put the terminal slightly above the checkpoint so it is clearly visible and reachable.
        terminals.push(addTerminal(scene,checkpoint.x + 46,checkpoint.y - 48,index));
      });
    } else if (scene.goal) {
      terminals.push(addTerminal(scene,scene.goal.x - 120,scene.goal.y - 55,0));
    }
    sceneTerminals.set(scene,terminals);
    scene.worldInteractionTerminals = terminals;
  };

  const update = scene => {
    const terminals = sceneTerminals.get(scene);
    if (!terminals || !scene?.player?.active) return;
    const button = ensureUi();
    const available = terminals.filter(t=>t.active && !t.getData('activated'));
    const nearest = available
      .filter(t=>distance(scene.player,t)<=INTERACT_DISTANCE)
      .sort((a,b)=>distance(scene.player,a)-distance(scene.player,b))[0];
    scene.worldInteractionTarget = nearest || null;
    if (!nearest) {
      button.classList.remove('is-visible','is-active');
      return;
    }
    button.innerHTML = 'INTERACT<small>E / TAP</small>';
    button.classList.add('is-visible');
    button.classList.remove('is-active');
  };

  const interact = scene => {
    const target = scene?.worldInteractionTarget;
    if (!target) return false;
    return activate(scene,target);
  };

  const originalCreate = RunnerScene.prototype.create;
  const originalUpdate = RunnerScene.prototype.update;
  if (typeof originalCreate === 'function') {
    RunnerScene.prototype.create = function worldInteractionCreate(...args) {
      activeScene = this;
      window.__relayRunnerScene = this;
      const result = originalCreate.apply(this,args);
      setup(this);
      return result;
    };
  }
  if (typeof originalUpdate === 'function') {
    RunnerScene.prototype.update = function worldInteractionUpdate(...args) {
      activeScene = this;
      window.__relayRunnerScene = this;
      const result = originalUpdate.apply(this,args);
      update(this);
      return result;
    };
  }

  document.addEventListener('keydown',event=>{
    if (event.key.toLowerCase() !== 'e' || event.repeat) return;
    if (interact(activeScene)) event.preventDefault();
  },true);

  document.addEventListener('visibilitychange',()=>{
    if (document.hidden) {
      const button=document.getElementById('worldInteractButton');
      button?.classList.remove('is-visible','is-active');
    }
  });

  ensureUi();
})();
