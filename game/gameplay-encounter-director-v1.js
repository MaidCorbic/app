/* Dynamic encounter director: event-driven pressure only. Existing encounter systems remain authoritative. */
(() => {
  if (window.__relayEncounterDirectorV1) return;
  window.__relayEncounterDirectorV1 = true;
  const state=new WeakMap();
  const attach=scene=>{
    if(!scene||scene.__relayEncounterDirector||!scene.mission)return;
    scene.__relayEncounterDirector=true;
    const d={signals:0,checkpoints:0,lastPressure:0}; state.set(scene,d);
    const events=scene.game?.events;if(!events)return;
    const pressure=kind=>{
      const now=scene.time?.now||performance.now(); if(now-d.lastPressure<9000)return; d.lastPressure=now;
      window.dispatchEvent(new CustomEvent('relay:dynamic-encounter-request',{detail:{scene,missionId:scene.mission.id,kind}}));
    };
    const onSignal=()=>{d.signals++;if(d.signals%6===0)pressure('signal-surge');};
    const onCheckpoint=()=>{d.checkpoints++;if(d.checkpoints>=2)pressure('late-route');};
    const onFeedback=type=>{if(type==='damage')pressure('pressure-response');};
    events.on('signal',onSignal);events.on('checkpoint',onCheckpoint);events.on('feedback',onFeedback);
    scene.events?.once('shutdown',()=>{events.off('signal',onSignal);events.off('checkpoint',onCheckpoint);events.off('feedback',onFeedback);state.delete(scene);});
  };
  window.addEventListener('relay:gameplay-core-ready',e=>attach(e.detail?.scene||window.__relayRunnerScene),{passive:true});window.addEventListener('relay:runner-scene-ready',e=>attach(e.detail?.scene||window.__relayRunnerScene),{passive:true});
})();
