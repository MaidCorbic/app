import Phaser from 'phaser';

const NS = '__relayGameplayFeatureVisibility';
const CATALOG = {
  V1: ['Train / Moving Object','Crane Traversal','Moving Traffic','Zipline','Throwable World Objects','Laser Sweep','Moving Relay','Courier Handoff','Elevator Routing','Sound Pressure'],
  V2: ['Magnetic Polarity','Conveyor Routing','Rotating Structure','Temporal Rewind','Phase Shift','Pressure Chamber','Signal Intercept Drone','Object Weight Interaction'],
  V3: ['Body Swap','Clone Position','Mass Transfer','Phase Split','Object Fusion','Scale Shift','Rule Injection'],
  V4: ['Echo Scan','Friction Control','Temperature State','Object Duplication','Surface Adhesion','Trajectory Preview','Sonic Push / Pull','Remote Camera','Object Rotation Tool','Surface Phase Marking','Impact Banking','Thermal Chain'],
  V5: ['Stamina / Endurance','Field Crafting','Vehicle Drive','Rescue Carry','Loot Extraction','Black Market Trade','Escort Target','Field Repair','Evidence Collection','Delivery Inspection','Vehicle Cargo Loading','Manual Refueling'],
  V6: ['Disguise Identity','Radio Frequency Tuning','Signal Triangulation','Witness Memory','Faction Access','Identity Credentials','Contraband Concealment','Negotiated Access','Crowd Influence','False Evidence Planting'],
};

const TOKENS = {
  'Train / Moving Object':['TRAIN','MOVING'], 'Crane Traversal':['CRANE'], 'Moving Traffic':['TRAFFIC'], Zipline:['ZIPLINE'], 'Throwable World Objects':['THROW','OBJECT'], 'Laser Sweep':['LASER'], 'Moving Relay':['RELAY'], 'Courier Handoff':['HANDOFF'], 'Elevator Routing':['ELEVATOR'], 'Sound Pressure':['SOUND','PRESSURE'],
  'Magnetic Polarity':['MAGNET'], 'Conveyor Routing':['CONVEYOR'], 'Rotating Structure':['ROTAT'], 'Temporal Rewind':['REWIND'], 'Phase Shift':['PHASE'], 'Pressure Chamber':['PRESSURE'], 'Signal Intercept Drone':['INTERCEPT','DRONE'], 'Object Weight Interaction':['WEIGHT'],
  'Body Swap':['BODY','SWAP'], 'Clone Position':['CLONE'], 'Mass Transfer':['MASS'], 'Phase Split':['PHASE','SPLIT'], 'Object Fusion':['FUSION'], 'Scale Shift':['SCALE'], 'Rule Injection':['RULE'],
  'Echo Scan':['ECHO','SCAN'], 'Friction Control':['FRICTION'], 'Temperature State':['TEMP'], 'Object Duplication':['DUPLIC'], 'Surface Adhesion':['ADHES'], 'Trajectory Preview':['TRAJECT'], 'Sonic Push / Pull':['SONIC'], 'Remote Camera':['CAMERA'], 'Object Rotation Tool':['ROTAT'], 'Surface Phase Marking':['PHASE','MARK'], 'Impact Banking':['IMPACT'], 'Thermal Chain':['THERM'],
  'Stamina / Endurance':['STAMINA'], 'Field Crafting':['CRAFT'], 'Vehicle Drive':['VEHICLE'], 'Rescue Carry':['RESCUE'], 'Loot Extraction':['LOOT','EXTRACT'], 'Black Market Trade':['BLACK','MARKET'], 'Escort Target':['ESCORT'], 'Field Repair':['REPAIR'], 'Evidence Collection':['EVIDENCE'], 'Delivery Inspection':['INSPECT'], 'Vehicle Cargo Loading':['CARGO','LOAD'], 'Manual Refueling':['REFUEL'],
  'Disguise Identity':['DISGUISE'], 'Radio Frequency Tuning':['RADIO'], 'Signal Triangulation':['MEASURE','TRIANG'], 'Witness Memory':['WITNESS'], 'Faction Access':['FACTION'], 'Identity Credentials':['CREDENTIAL','ID'], 'Contraband Concealment':['CONTRABAND'], 'Negotiated Access':['OFFER','NEGOT'], 'Crowd Influence':['CROWD'], 'False Evidence Planting':['EVIDENCE','PLANT'],
};

function own(scene, obj) { if (obj) (scene[NS] ||= { objects:new Set(), active:false }).objects.add(obj); return obj; }
function norm(v) { return String(v ?? '').toUpperCase().replace(/[^A-Z0-9]+/g,' '); }
function sceneText(obj) { return norm([obj?.name, obj?.text, obj?.getData?.('label'), obj?.getData?.('feature'), obj?.getData?.('key')].filter(Boolean).join(' ')); }
function findNode(scene, feature) {
  const tokens = TOKENS[feature] || [];
  const children = scene.children?.list || [];
  let best = null, bestScore = 0;
  for (const obj of children) {
    if (!obj?.active || obj === scene.player) continue;
    const hay = sceneText(obj);
    if (!hay) continue;
    const score = tokens.reduce((n,t)=>n+(hay.includes(norm(t))?1:0),0);
    if (score > bestScore) { bestScore=score; best=obj; }
  }
  return bestScore ? best : null;
}
function destroyObject(obj) { try { obj?.off?.('pointerdown'); obj?.destroy?.(); } catch {} }
function install(scene) {
  if (scene[NS]?.installed || !scene.add) return;
  const state = scene[NS] = { installed:true, objects:new Set(), active:false, tab:'V1', highlight:null };
  const open = own(scene, scene.add.circle(scene.scale?.width ? scene.scale.width-34 : 686, scene.scale?.height ? scene.scale.height-34 : 706, 20, 0x0b2235, .96).setDepth(120).setScrollFactor(0).setStrokeStyle(2,0x67e8f9,.8));
  own(scene, scene.add.text(open.x,open.y,'SYS',{fontFamily:'DM Mono',fontSize:'8px',color:'#9ff7ff',fontStyle:'bold'}).setOrigin(.5).setDepth(121).setScrollFactor(0));
  open.setInteractive({useHandCursor:false}).on('pointerdown',()=>toggle(scene));
  state.open=open;
}
function toggle(scene) {
  const s=scene[NS]; if(!s) return;
  s.active=!s.active;
  if(s.active) buildPanel(scene); else closePanel(scene);
}
function closePanel(scene) {
  const s=scene[NS]; if(!s) return;
  for(const o of s.objects) destroyObject(o); s.objects.clear();
  if(s.highlight) { destroyObject(s.highlight); s.highlight=null; }
}
function buildPanel(scene) {
  closePanel(scene);
  const s=scene[NS], w=Math.min(350,(scene.scale?.width||720)-28), h=Math.min(520,(scene.scale?.height||760)-72), x=14, y=58;
  own(scene, scene.add.rectangle(x,y,w,h,0x06111d,.97).setOrigin(0).setDepth(118).setScrollFactor(0).setStrokeStyle(2,0x67e8f9,.45));
  own(scene, scene.add.text(x+14,y+12,'GAMEPLAY SYSTEMS',{fontFamily:'DM Mono',fontSize:'12px',color:'#b8fbff',fontStyle:'bold'}).setDepth(119).setScrollFactor(0));
  ['V1','V2','V3','V4','V5','V6'].forEach((tab,i)=>{
    const tx=x+34+i*48, b=own(scene,scene.add.rectangle(tx,y+44,40,24,tab===s.tab?0x16465a:0x0e2232,.98).setDepth(119).setScrollFactor(0).setStrokeStyle(1,0x67e8f9,.45));
    own(scene,scene.add.text(tx,y+44,tab,{fontFamily:'DM Mono',fontSize:'9px',color:'#d9ffff'}).setOrigin(.5).setDepth(120).setScrollFactor(0));
    b.setInteractive({useHandCursor:false}).on('pointerdown',()=>{s.tab=tab;buildPanel(scene);});
  });
  const list=CATALOG[s.tab]||[];
  list.forEach((feature,i)=>{
    const by=y+82+i*30;
    const node=findNode(scene,feature), exists=!!node;
    const row=own(scene,scene.add.rectangle(x+10,by,w-20,25,exists?0x102d36:0x151b24,.96).setOrigin(0).setDepth(119).setScrollFactor(0).setStrokeStyle(1,exists?0x55d6d0:0x394454,.32));
    own(scene,scene.add.text(x+20,by+12,`${exists?'●':'○'} ${feature}`,{fontFamily:'DM Mono',fontSize:'7px',color:exists?'#a9fff4':'#8491a3'}).setOrigin(0,.5).setDepth(120).setScrollFactor(0));
    row.setInteractive({useHandCursor:false}).on('pointerdown',()=>focusFeature(scene,feature));
  });
}
function focusFeature(scene,feature) {
  const node=findNode(scene,feature);
  if(!node) { try { scene.playerCue?.(`${feature.toUpperCase()} · NOT IN THIS MISSION`,'#ff826e'); } catch {} return; }
  const s=scene[NS]; if(s.highlight) destroyObject(s.highlight);
  s.highlight=own(scene,scene.add.circle(node.x,node.y,32,0x67e8f9,.08).setDepth(117));
  s.highlight.setStrokeStyle(3,0x67e8f9,.95);
  scene.tweens?.add({targets:s.highlight,scale:1.45,alpha:.05,duration:700,yoyo:true,repeat:2});
  try { scene.playerCue?.(`${feature.toUpperCase()} · INTERACT WITH HIGHLIGHTED OBJECT`,'#67e8f9'); } catch {}
  if(scene.cameras?.main && node.x != null && node.y != null) scene.cameras.main.pan(node.x,node.y,450,'Sine.easeInOut');
}
export function installGameplayFeatureVisibility(RunnerScene) {
  if(!RunnerScene || RunnerScene.prototype.__relayFeatureVisibilityInstalled) return;
  RunnerScene.prototype.__relayFeatureVisibilityInstalled=true;
  const originalCreate=RunnerScene.prototype.create, originalShutdown=RunnerScene.prototype.shutdown;
  RunnerScene.prototype.create=function featureVisibilityCreate(...args){ const result=originalCreate?.apply(this,args); install(this); return result; };
  RunnerScene.prototype.shutdown=function featureVisibilityShutdown(...args){ closePanel(this); const s=this[NS]; if(s?.open) destroyObject(s.open); try { for(const o of s?.objects||[]) destroyObject(o); } catch {} return originalShutdown?.apply(this,args); };
}
export { CATALOG };
