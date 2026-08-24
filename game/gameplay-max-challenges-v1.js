/* Replayable mission challenges. Reads existing mission/runtime events; never changes the main route. */
(() => {
  if (window.__relayGameplayMaxChallengesV1) return;
  window.__relayGameplayMaxChallengesV1 = true;
  const state = new WeakMap();
  const attach = scene => {
    if (!scene || scene.__relayMaxChallenges || !scene.mission) return;
    scene.__relayMaxChallenges = true;
    const data = { signals:0, damage:0, checkpoints:0, started:performance.now() };
    state.set(scene,data);
    const events=scene.game?.events; if(!events)return;
    const onSignal=()=>data.signals++;
    const onCheckpoint=()=>data.checkpoints++;
    const onFeedback=type=>{if(type==='hit'||type==='damage')data.damage++;};
    events.on('signal',onSignal); events.on('checkpoint',onCheckpoint); events.on('feedback',onFeedback);
    scene.events?.once('shutdown',()=>{events.off('signal',onSignal);events.off('checkpoint',onCheckpoint);events.off('feedback',onFeedback);state.delete(scene);});
  };
  const evaluate = scene => { const d=state.get(scene); if(!d)return; const seconds=Math.max(1,Math.round((performance.now()-d.started)/1000)); const challenges={signalHunt:d.signals>=12,noDamage:d.damage===0,checkpointMaster:d.checkpoints>=2,speedRun:seconds<=150}; window.dispatchEvent(new CustomEvent('relay:challenge-results',{detail:{missionId:scene.mission?.id,challenges,stats:{signals:d.signals,damage:d.damage,checkpoints:d.checkpoints,time:seconds}}})); };
  window.addEventListener('relay:gameplay-core-ready',e=>attach(e.detail?.scene||window.__relayRunnerScene),{passive:true}); window.addEventListener('relay:runner-scene-ready',e=>attach(e.detail?.scene||window.__relayRunnerScene),{passive:true}); window.addEventListener('relay:mission-complete',e=>evaluate(e.detail?.scene||window.__relayRunnerScene),{passive:true});
})();
