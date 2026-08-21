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

function ui(){if(document.getElementById('relayCityLife'))return;const style=document.createElement('style');style.textContent='#relayCityLife{position:fixed;z-index:10050;left:50%;bottom:28px;transform:translateX(-50%);width:min(520px,86vw);display:none;padding:13px 16px;background:rgba(3,12,22,.95);border:1px solid rgba(141,244,255,.65);box-shadow:0 0 28px rgba(25,200,245,.18);color:#effcff;font:700 12px/1.45 ui-monospace,monospace}#relayCityLife.show{display:block}#relayCityLife b{display:block;font-size:10px;letter-spacing:.14em;margin-bottom:4px}#relayCityLife small{display:block;margin-top:7px;color:#8df4ff;font-size:9px;letter-spacing:.1em}@media(max-width:768px){#relayCityLife{bottom:calc(145px + env(safe-area-inset-bottom));font-size:11px}}';document.head.append(style);const el=document.createElement('div');el.id='relayCityLife';document.body.append(el)}

function spawn(scene,x,y,index){const type=NPC_TYPES[index%NPC_TYPES.length];const c=scene.add.container(x,y).setDepth(999).setSize(44,74).setDataEnabled();c.setData({type,spoken:false,index});const col=Phaser.Display.Color.HexStringToColor(type.color).color;const shadow=scene.add.ellipse(0,29,38,9,0x000000,.35);const body=scene.add.rectangle(0,5,24,40,col,.72).setStrokeStyle(2,0xffffff,.7);const head=scene.add.circle(0,-23,12,0x17273a).setStrokeStyle(2,col,1);const light=scene.add.circle(0,-47,5,col,1);const label=scene.add.text(0,45,type.name,{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:type.color,stroke:'#02050d',strokeThickness:4}).setOrigin(.5);c.add([shadow,body,head,light,label]);scene.tweens?.add({targets:[light,label],alpha:{from:.35,to:1},duration:700,yoyo:true,repeat:-1});return c}

function anchors(scene){
  const p=scene.player;const out=[];const add=(x,y)=>{if(Number.isFinite(x)&&Number.isFinite(y)&&!out.some(a=>Math.abs(a.x-x)<80))out.push({x,y})};
  const groups=['platforms','ground','solids','worldPlatforms','rooftops'];
  for(const key of groups){const g=scene[key];for(const o of (g?.getChildren?.()||[])){if(out.length>=4)break;add(o.x,(o.y||0)-70)}}
  if(!out.length&&p){const baseY=p.y+40;[260,520,820,1180].forEach(dx=>add(p.x+dx,baseY))}
  if(p&&out.length<4){[180,360,540,720].forEach((dx,i)=>add(p.x+dx,p.y+(i%2?20:0)))}
  return out.slice(0,4);
}

function setup(scene){if(!scene?.player||SCENES.has(scene))return;ui();const points=anchors(scene);const npcs=points.map((p,i)=>spawn(scene,p.x,p.y,i));SCENES.set(scene,{npcs,current:null,ready:true});window.__relayCityLifeScene=scene;console.info('[Update18 CityLife] spawned',npcs.length,npcs.map(n=>({x:n.x,y:n.y,type:n.getData('type').name})))}

function refresh(scene){const s=SCENES.get(scene);if(!s||!scene.player?.active)return;const next=s.npcs.filter(n=>n?.active&&!n.getData('spoken')&&distance(scene.player,n)<190).sort((a,b)=>distance(scene.player,a)-distance(scene.player,b))[0]||null;s.current=next;const el=document.getElementById('relayCityLife');if(!next){el?.classList.remove('show');return}const t=next.getData('type');el.innerHTML=`<b style="color:${t.color}">${t.name} // CITY CHANNEL</b>${rand(t.lines)}<small>E / TAP · TALK</small>`;el.classList.add('show')}

function talk(scene,npc){if(!npc||npc.getData('spoken'))return false;npc.setData('spoken',true);const t=npc.getData('type'),line=rand(t.lines);if(typeof scene.playerCue==='function')scene.playerCue(`${t.name}: ${line}`,t.color);scene.game?.events?.emit('city-life-talk',{name:t.name,line,index:npc.getData('index')});document.getElementById('relayCityLife')?.classList.remove('show');scene.tweens?.add({targets:npc,alpha:.35,duration:300});return true}

const create=RunnerScene.prototype.create,update=RunnerScene.prototype.update;if(!RunnerScene.prototype.__update18CityLife){RunnerScene.prototype.create=function(...args){const out=create.apply(this,args);this.time?.delayedCall?.(150,()=>{try{setup(this)}catch(err){console.warn('[Update18 CityLife]',err)}});return out};RunnerScene.prototype.update=function(...args){const out=update.apply(this,args);try{refresh(this)}catch(err){}return out};RunnerScene.prototype.__update18CityLife=true}
document.addEventListener('keydown',e=>{if(e.repeat||e.key.toLowerCase()!=='e')return;const scene=window.__relayCityLifeScene,s=SCENES.get(scene);if(s?.current&&talk(scene,s.current))e.preventDefault()},true);document.addEventListener('pointerdown',e=>{const scene=window.__relayCityLifeScene,s=SCENES.get(scene);if(s?.current&&talk(scene,s.current))e.preventDefault()},true);ui();