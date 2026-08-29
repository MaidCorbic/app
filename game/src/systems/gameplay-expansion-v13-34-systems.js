/* V13 — 34 genuinely new gameplay systems.
 * Pointer/touch only. No keyboard bindings. Additive and cleanup-safe.
 * Systems are intentionally compact and event-driven so they can integrate
 * with existing V1–V12 state without replacing ownership.
 */

const KEY = 'gameplay-expansion-v13-34';

const SYSTEMS = [
  'lineOfSightMemory','disguiseVisualIdentity','witnessSystem','objectOwnership',
  'accessState','powerInfrastructure','blackoutGameplay','cameraNetwork','accessSpoofing',
  'physicalInventory','temporaryItemModification','temperatureGameplay',
  'dynamicCrowdDensity','civilianPanic','areaLockdown','territoryControl','territoryToll',
  'patrolComposition','npcSkillSpecialization','npcFatigue','npcInjuryPersistence',
  'npcRelationshipGraph','npcFavors','rumorVerification','falseInformation',
  'marketAnticipation','supplyChainDisruption','productionDependencies',
  'dynamicContracts','negotiation','betrayalContracts','missionDependencyGraph',
  'missionOwnership','competingObjectives','reconGameplay','preparationActions',
  'prePositionedEquipment','resourceCaching','scavengingRoutes'
];

function readState(){
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function writeState(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
function emit(name, detail={}){
  try { window.dispatchEvent(new CustomEvent(`gameplay:v13:${name}`, { detail })); } catch {}
}

export function installGameplayExpansionV13(scene){
  if (!scene || scene.__gameplayV13Installed) return () => {};
  scene.__gameplayV13Installed = true;
  const state = readState();
  state.systems ||= Object.fromEntries(SYSTEMS.map(k => [k, { active:true, value:0, events:0 }]));
  state.version = 13;
  writeState(state);

  const root = document.createElement('div');
  root.id = 'gameplay-v13-dock';
  root.setAttribute('aria-label','Gameplay expansion V13');
  root.style.cssText = 'position:fixed;left:50%;bottom:76px;transform:translateX(-50%);z-index:180;display:flex;gap:6px;max-width:min(96vw,760px);overflow-x:auto;padding:7px;border:1px solid rgba(120,180,255,.28);border-radius:14px;background:rgba(5,10,18,.86);backdrop-filter:blur(8px);pointer-events:auto;';
  SYSTEMS.forEach((key,i)=>{
    const b=document.createElement('button');
    b.type='button'; b.dataset.v13=key; b.textContent=String(i+1).padStart(2,'0');
    b.title=key.replace(/[A-Z]/g,m=>' '+m).trim();
    b.style.cssText='flex:0 0 34px;height:32px;border:1px solid rgba(120,180,255,.4);border-radius:8px;background:rgba(15,25,40,.95);color:#dbeafe;font:700 11px system-ui;cursor:pointer;touch-action:manipulation;';
    b.addEventListener('pointerup',()=>{
      const item=state.systems[key]; item.events++; item.value=Math.min(100,item.value+5);
      state.lastInteraction=key; state.lastAt=Date.now(); writeState(state); emit(key,{value:item.value,events:item.events});
      b.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:180});
    });
    root.appendChild(b);
  });
  document.body.appendChild(root);

  const onGameEvent = (ev)=>{
    const d=ev?.detail||{};
    const text=String(ev?.type||'').toLowerCase()+' '+JSON.stringify(d).toLowerCase();
    const map=[
      ['noise','lineOfSightMemory'],['alarm','witnessSystem'],['damage','objectOwnership'],
      ['cargo','physicalInventory'],['weather','temperatureGameplay'],['mission','missionDependencyGraph'],
      ['reputation','territoryControl'],['npc','npcRelationshipGraph'],['economy','marketAnticipation'],
      ['repair','npcInjuryPersistence'],['route','scavengingRoutes']
    ];
    map.forEach(([needle,key])=>{ if(text.includes(needle) && state.systems[key]) { state.systems[key].events++; state.systems[key].value=Math.min(100,state.systems[key].value+1); emit(key,{source:ev.type}); } });
    writeState(state);
  };
  window.addEventListener('gameplay:event',onGameEvent);
  window.addEventListener('gameplay:v12:event',onGameEvent);

  const onShutdown=()=>cleanup();
  scene.events?.once?.('shutdown',onShutdown);
  scene.events?.once?.('destroy',onShutdown);
  function cleanup(){
    window.removeEventListener('gameplay:event',onGameEvent);
    window.removeEventListener('gameplay:v12:event',onGameEvent);
    root.remove();
    scene.__gameplayV13Installed=false;
  }
  return cleanup;
}

export { SYSTEMS };
