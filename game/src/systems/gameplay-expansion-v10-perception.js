import Phaser from 'phaser';

const KEY='relay.gameplay.v10.perception';
const fresh=()=>({mirror:{angle:0,solved:false,hits:0},symbols:{sequence:[2,0,1],progress:0,solved:false},memory:{marks:[],revealed:false},camera:{captures:0,valid:0}});
const load=()=>{try{return {...fresh(),...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{return fresh();}};
const save=s=>{try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}};
const txt=(scene,x,y,t,size='9px',color='#e9fbff')=>scene.add.text(x,y,t,{fontFamily:'monospace',fontSize:size,fontStyle:'bold',color}).setOrigin(.5);

export function installGameplayExpansionV10(RunnerScene){
 if(!RunnerScene?.prototype||RunnerScene.prototype.__v10Installed)return;
 RunnerScene.prototype.__v10Installed=true;
 const originalCreate=RunnerScene.prototype.create, originalUpdate=RunnerScene.prototype.update;
 RunnerScene.prototype.create=function(...args){
  const result=originalCreate.apply(this,args),scene=this,state=load();
  scene.__v10={state,objects:[],destroyed:false};
  const w=scene.scale.width,h=scene.scale.height,ui=scene.add.container(0,0).setScrollFactor(0).setDepth(900);
  const pw=Math.min(w-20,430),px=w-pw-10,py=12;
  ui.add(scene.add.rectangle(px+pw/2,py+46,pw,76,0x06111e,.94).setStrokeStyle(1,0x7ee7ff,.7));
  ui.add(txt(scene,px+14,py+17,'V10 // PERCEPTION','11px','#7ee7ff').setOrigin(0));
  ui.add(txt(scene,px+14,py+34,'M MIRROR   Y SYMBOLS   U MEMORY   P PHOTO','7px','#7896a4').setOrigin(0));
  const status=txt(scene,px+14,py+57,'READY','8px','#a7dbe8').setOrigin(0);ui.add(status);
  const setStatus=t=>status.setText(t);
  const world=[];const add=o=>(world.push(o),o);
  const baseX=Math.max(170,w*.35),baseY=Math.max(220,h*.45);
  const mirror=add(scene.add.rectangle(baseX,baseY,58,12,0x9eeaff,.9).setStrokeStyle(2,0x7ee7ff,1).setInteractive({useHandCursor:true}));
  const receiver=add(scene.add.circle(baseX+170,baseY,18,0x15283a,1).setStrokeStyle(2,0x7ee7ff,.8));
  const gate=add(scene.add.rectangle(baseX+250,baseY,22,100,0xff826e,.45).setStrokeStyle(2,0xff826e,.8));
  const beam=add(scene.add.graphics());add(txt(scene,baseX,baseY-30,'MIRROR // ROTATE','8px','#bfefff'));add(txt(scene,baseX+170,baseY+32,'RECEIVER','7px','#9ec6d6'));
  const renderMirror=()=>{beam.clear();beam.lineStyle(3,state.mirror.solved?0x8df4ff:0x49697a,state.mirror.solved?1:.65);beam.beginPath();beam.moveTo(baseX+30,baseY);beam.lineTo(baseX+170,baseY);beam.strokePath();receiver.setFillStyle(state.mirror.solved?0x2b6a78:0x15283a,1);gate.setAlpha(state.mirror.solved?.18:.65);mirror.angle=state.mirror.angle;};
  const rotateMirror=()=>{state.mirror.angle=(state.mirror.angle+90)%360;state.mirror.hits++;state.mirror.solved=state.mirror.angle===180;save(state);renderMirror();setStatus(state.mirror.solved?'MIRROR ROUTE CONNECTED — GATE OPEN':'MIRROR ROTATED — ALIGN TO 180°');};mirror.on('pointerdown',rotateMirror);
  const glyphs=['△','○','□'];
  const symbols=[2,0,1].map((id,i)=>{const x=baseX+i*62,c=add(scene.add.circle(x,baseY+120,22,0x0b1b2a,.98).setStrokeStyle(2,0xc4a0ff,.8).setInteractive({useHandCursor:true}));add(txt(scene,x,baseY+120,glyphs[id],'13px','#e9ddff'));c.on('pointerdown',()=>solveSymbol(id));return c;});
  add(txt(scene,baseX+62,baseY+156,'SYMBOL SEQUENCE','7px','#c8b8e8'));
  const solveSymbol=id=>{if(state.symbols.solved)return;const expected=state.symbols.sequence[state.symbols.progress];if(id===expected){state.symbols.progress++;if(state.symbols.progress===3)state.symbols.solved=true;save(state);symbols.forEach((c,n)=>c.setStrokeStyle(2,0xc4a0ff,n===state.symbols.progress?1:.8));setStatus(state.symbols.solved?'SYMBOLS VERIFIED — ROUTE UNLOCKED':`SYMBOL ${state.symbols.progress}/3 VERIFIED`);}else{state.symbols.progress=0;save(state);setStatus('WRONG SYMBOL — SEQUENCE RESET');}};
  const landmarkDefs=[['L1',baseX-150,baseY+210],['L2',baseX+30,baseY+250],['L3',baseX+210,baseY+205]];
  const landmarks=landmarkDefs.map(([id,x,y])=>{const c=add(scene.add.circle(x,y,14,0x12202e,.95).setStrokeStyle(2,0x65d9ff,.8).setInteractive({useHandCursor:true}));add(txt(scene,x,y+27,id,'7px','#9edcf0'));c.on('pointerdown',()=>{if(!state.memory.marks.includes(id))state.memory.marks.push(id);save(state);c.setFillStyle(0x1e5062,1);setStatus(`MEMORY MARK ${id} SAVED — ${state.memory.marks.length}/3`);});return c;});
  const memoryLine=add(scene.add.graphics());const renderMemory=()=>{memoryLine.clear();memoryLine.lineStyle(2,0x65d9ff,.55);state.memory.marks.forEach(id=>{const d=landmarkDefs.find(v=>v[0]===id);if(d)memoryLine.strokeCircle(d[1],d[2],18);});};
  const target=add(scene.add.rectangle(baseX+360,baseY+170,74,74,0xffd27a,.12).setStrokeStyle(2,0xffd27a,.9).setInteractive({useHandCursor:true}));add(txt(scene,baseX+360,baseY+220,'PHOTO TARGET','7px','#f3d89d'));
  const frame=add(scene.add.rectangle(w/2,h/2,220,150,0xffd27a,0).setStrokeStyle(2,0xffd27a,.65).setVisible(false).setScrollFactor(0).setDepth(905));
  const capture=()=>{const p=scene.player;if(!p){setStatus('PHOTO: PLAYER UNAVAILABLE');return;}const d=Phaser.Math.Distance.Between(p.x,p.y,target.x,target.y);state.camera.captures++;if(d<=115){state.camera.valid++;save(state);frame.setVisible(true);scene.tweens.add({targets:frame,alpha:{from:.2,to:1},duration:120,yoyo:true});setStatus(`PHOTO VALID — ${state.camera.valid} CAPTURE${state.camera.valid===1?'':'S'}`);}else setStatus(`PHOTO INVALID — MOVE CLOSER (${Math.round(d)}px)`);};target.on('pointerdown',capture);
  const key=e=>{if(e.repeat)return;switch(e.code){case'KeyM':rotateMirror();break;case'KeyY':solveSymbol(state.symbols.sequence[state.symbols.progress]??0);break;case'KeyU':state.memory.revealed=!state.memory.revealed;landmarks.forEach(c=>c.setAlpha(state.memory.revealed?1:.3));setStatus(state.memory.revealed?'MEMORY LANDMARKS REVEALED':'MEMORY LANDMARKS HIDDEN');break;case'KeyP':capture();break;}};
  scene.input.keyboard?.on('keydown',key);renderMirror();renderMemory();
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{scene.__v10.destroyed=true;scene.input.keyboard?.off('keydown',key);[ui,...world].forEach(o=>o?.destroy?.());});
  return result;
 };
 RunnerScene.prototype.update=function(...args){const result=originalUpdate.apply(this,args);return result;};
}
