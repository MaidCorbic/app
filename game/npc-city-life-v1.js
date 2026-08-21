import { RunnerScene } from './src/scenes/RunnerScene.js';

const SCENES = new WeakMap();
const NPC_TYPES = [
  { name:'COURIER', color:'#8df4ff', lines:['Upper route is clear. Move while the signal holds.','Security sweep hit the lower rooftops.'] },
  { name:'MECHANIC', color:'#aee37f', lines:['That relay is unstable. Keep moving.','Cargo systems are still cycling tonight.'] },
  { name:'SCOUT', color:'#ffd06e', lines:['Signal noise spikes ahead.','Another runner crossed this district minutes ago.'] },
  { name:'CITIZEN', color:'#e5b8ff', lines:['Keep the line open. People still depend on it.','The city never really sleeps anymore.'] }
];
const rand=a=>a[Math.floor(Math.random()*a.length)];
const distance=(a,b)=>Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));

function ui(){
  if(document.getElementById('relayCityLife')) return;
  const style=document.createElement('style');
  style.textContent='#relayCityLife{position:fixed;z-index:10050;left:50%;bottom:28px;transform:translateX(-50%);width:min(520px,86vw);display:none;padding:13px 16px;background:rgba(3,12,22,.95);border:1px solid rgba(141,244,255,.65);box-shadow:0 0 28px rgba(25,200,245,.18);color:#effcff;font:700 12px/1.45 ui-monospace,monospace}#relayCityLife.show{display:block}#relayCityLife b{display:block;font-size:10px;letter-spacing:.14em;margin-bottom:4px}#relayCityLife small{display:block;margin-top:7px;color:#8df4ff;font-size:9px;letter-spacing:.1em}@media(max-width:768px){#relayCityLife{bottom:calc(145px + env(safe-area-inset-bottom));font-size:11px}}';
  document.head.append(style);
  const el=document.createElement('div');el.id='relayCityLife';document.body.append(el);
}

function spawn(scene,x,y,index){
  const type=NPC_TYPES[index%NPC_TYPES.length];
  const c=scene.add.container(x,y).setDepth(18).setSize(42,70).setDataEnabled();
  c.setData({type,spoken:false});
  const col=Phaser.Display.Color.HexStringToColor(type.color).color;
  const shadow=scene.add.ellipse(0,28,34,8,0x000000,.3);
  const body=scene.add.rectangle(0,4,22,38,col,.55).setStrokeStyle(1,0xdffcff,.7);
  const head=scene.add.circle(0,-22,11,0x17273a).setStrokeStyle(2,col,.9);
  const light=scene.add.circle(0,-44,4,col,.9);
  const label=scene.add.text(0,43,type.name,{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:type.color,stroke:'#02050d',strokeThickness:3}).setOrigin(.5);
  c.add([shadow,body,head,light,label]);
  scene.tweens?.add({targets:light,alpha:{from:.25,to:1},duration:700,yoyo:true,repeat:-1});
  return c;
}

function setup(scene){
  if(!scene?.player||SCENES.has(scene)) return;
  ui();
  const points=(scene.checkpoints?.getChildren?.()||[]).filter((p,i)=>i>0&&i%2===0).slice(0,4);
  const npcs=points.map((p,i)=>spawn(scene,p.x+(i%2?64:-64),p.y-48,i));
  SCENES.set(scene,{npcs,current:null});
}

function refresh(scene){
  const s=SCENES.get(scene); if(!s||!scene.player?.active) return;
  window.__relayCityLifeScene=scene;
  const next=s.npcs.filter(n=>n?.active&&!n.getData('spoken')&&distance(scene.player,n)<175).sort((a,b)=>distance(scene.player,a)-distance(scene.player,b))[0]||null;
  s.current=next;
  const el=document.getElementById('relayCityLife');
  if(!next){el?.classList.remove('show');return;}
  const t=next.getData('type');
  el.innerHTML=`<b style="color:${t.color}">${t.name} // CITY CHANNEL</b>${rand(t.lines)}<small>E / TAP · TALK</small>`;
  el.classList.add('show');
}

function talk(scene,npc){
  if(!npc||npc.getData('spoken')) return false;
  npc.setData('spoken',true);
  const t=npc.getData('type'); const line=rand(t.lines);
  if(typeof scene.playerCue==='function') scene.playerCue(`${t.name}: ${line}`,t.color);
  scene.game?.events?.emit('city-life-talk',{name:t.name,line});
  document.getElementById('relayCityLife')?.classList.remove('show');
  scene.tweens?.add({targets:npc,alpha:.35,duration:300});
  return true;
}

const create=RunnerScene.prototype.create;
const update=RunnerScene.prototype.update;
if(!RunnerScene.prototype.__update18CityLife){
  RunnerScene.prototype.create=function(...args){const out=create.apply(this,args);try{setup(this)}catch(err){console.warn('[Update18 CityLife]',err)}return out};
  RunnerScene.prototype.update=function(...args){const out=update.apply(this,args);try{refresh(this)}catch(err){}return out};
  RunnerScene.prototype.__update18CityLife=true;
}

document.addEventListener('keydown',e=>{if(e.repeat||e.key.toLowerCase()!=='e')return;const scene=window.__relayCityLifeScene;const s=SCENES.get(scene);if(s?.current&&talk(scene,s.current))e.preventDefault()},true);
document.addEventListener('pointerdown',e=>{const scene=window.__relayCityLifeScene;const s=SCENES.get(scene);if(s?.current&&talk(scene,s.current))e.preventDefault()},true);
ui();