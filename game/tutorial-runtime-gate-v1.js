import { loadState } from './src/state.js';

(() => {
  if (window.__relayTutorialRuntimeGateV4) return;
  window.__relayTutorialRuntimeGateV4 = true;

  const COMPLETE_KEY = 'relay.runner.tutorial.onboarding-v3.complete';
  const isComplete = () => {
    try { return localStorage.getItem(COMPLETE_KEY) === '1'; } catch { return false; }
  };
  const trainingActive = () => document.body.classList.contains('relay-training-active');
  const cinematicLocked = () => Boolean(window.__relayCinematicLock || document.body.classList.contains('relay-cinematic-active'));
  const tutorialEnabled = () => loadState().tutorialEnabled !== false && !isComplete();
  const tutorialText = value => /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE|CHECKPOINT/i.test(String(value || ''));
  const snapshots = new WeakMap();

  const installTrainingLayout = () => {
    if (document.getElementById('relayTutorialSourceLayoutV2')) return;
    const style = document.createElement('style');
    style.id = 'relayTutorialSourceLayoutV2';
    style.textContent = `
      body.relay-training-active #intro,
      body.relay-training-active .hud,
      body.relay-training-active .world-marker,
      body.relay-training-active .input-guide,
      body.relay-training-active .mobile-controls,
      body.relay-training-active #pauseMenu,
      body.relay-training-active #finish,
      body.relay-training-active #gameOver,
      body.relay-training-active #toast,
      body.relay-training-active #relayTimeIndicator,
      body.relay-training-active #relayCityUpdateV1,
      body.relay-training-active #gameplayEventHud,
      body.relay-training-active #signalNetworkV1,
      body.relay-training-active #cityResponseV1,
      body.relay-training-active #cityPulseCueV1,
      body.relay-training-active .mission-objective,
      body.relay-training-active [data-mission-objective],
      body.relay-training-active [data-objective-panel]{display:none!important;visibility:hidden!important;pointer-events:none!important}
      body.relay-cinematic-active .hud,
      body.relay-cinematic-active .world-marker,
      body.relay-cinematic-active .input-guide,
      body.relay-cinematic-active .mobile-controls,
      body.relay-cinematic-active #pauseMenu,
      body.relay-cinematic-active #finish,
      body.relay-cinematic-active #gameOver,
      body.relay-cinematic-active #toast,
      body.relay-cinematic-active #relayCityUpdateV1,
      body.relay-cinematic-active #gameplayEventHud{display:none!important;visibility:hidden!important;pointer-events:none!important}
      body.relay-training-active #relayTutorialOnboardingV3 .training-card{top:clamp(108px,16vh,180px)!important;bottom:auto!important;left:50%!important;width:min(500px,calc(100vw - 32px))!important;max-height:min(210px,calc(100vh - 300px))!important;padding:14px 18px!important;transform:translateX(-50%)!important;overflow:hidden!important}
      @media(max-width:700px){body.relay-training-active #relayTutorialOnboardingV3 .training-card{width:min(88vw,500px)!important;top:clamp(106px,15vh,170px)!important;max-height:min(200px,calc(100vh - 280px))!important;padding:12px 14px!important}}
      @media(max-height:560px){body.relay-training-active #relayTutorialOnboardingV3 .training-card{top:96px!important;max-height:170px!important}}
    `;
    document.head.appendChild(style);
  };

  const hideTrainingSourceObjects = scene => {
    if (!scene || !trainingActive()) return;
    scene.routeTutorials?.forEach?.(item => item?.setVisible?.(false));
    scene.guides?.setVisible?.(false);
    scene.guideCompanions?.setVisible?.(false);
    scene.infoCard?.setVisible?.(false);
    scene.children?.list?.slice().forEach(child => {
      if (!child?.active || child.type !== 'Text') return;
      if (/RUNNER\s+LESSON|ORIENTATION\s*[·•-]|STEP\s*0[1-9]/i.test(String(child.text || ''))) child.setVisible?.(false);
    });
  };

  const forceRegularModeAfterCompletion = scene => {
    if (!scene || !isComplete()) return;
    scene.firstTimeTutorial = false;
    scene.routeTutorials?.clear?.();
    scene.guides?.setVisible?.(false);
    scene.guideCompanions?.setVisible?.(false);
    scene.infoCard?.setVisible?.(false);
  };

  const hideTutorialObjects = scene => {
    if (!scene) return;
    if (isComplete()) { forceRegularModeAfterCompletion(scene); return; }
    if (trainingActive()) { hideTrainingSourceObjects(scene); return; }

    if (cinematicLocked()) {
      if (!snapshots.has(scene)) snapshots.set(scene,{firstTimeTutorial:scene.firstTimeTutorial,guidesVisible:scene.guides?.visible,companionsVisible:scene.guideCompanions?.visible,infoVisible:scene.infoCard?.visible});
      scene.firstTimeTutorial = false;
      scene.routeTutorials?.forEach?.(item => item?.setVisible?.(false));
      scene.guides?.setVisible?.(false);
      scene.guideCompanions?.setVisible?.(false);
      scene.infoCard?.setVisible?.(false);
      scene.children?.list?.slice().forEach(child => { if (!child?.active || child.type !== 'Text') return; if (tutorialText(child.text)) child.setVisible?.(false); });
      return;
    }

    const snap = snapshots.get(scene);
    if (snap) {
      scene.firstTimeTutorial = snap.firstTimeTutorial;
      if (scene.guides) scene.guides.setVisible(snap.guidesVisible);
      if (scene.guideCompanions) scene.guideCompanions.setVisible(snap.companionsVisible);
      if (scene.infoCard) scene.infoCard.setVisible(snap.infoVisible);
      snapshots.delete(scene);
    }

    if (tutorialEnabled()) return;
    scene.routeTutorials?.clear?.();
    scene.dismissIntelCard?.();
    scene.children?.list?.slice().forEach(child => { if (!child?.active || child.type !== 'Text') return; if (tutorialText(child.text)) child.setVisible?.(false); });
    scene.guides?.setVisible?.(false);
    scene.guideCompanions?.setVisible?.(false);
  };

  const patchScene = scene => {
    if (!scene || scene.__relayTutorialRuntimeGateV4Patched) return;
    scene.__relayTutorialRuntimeGateV4Patched = true;
    const originalEmit = scene.game?.events?.emit?.bind(scene.game.events);
    if (originalEmit) scene.game.events.emit = function tutorialGatedEmit(eventName,...args){ if ((!tutorialEnabled() && eventName==='tutorial') || (cinematicLocked() && /tutorial/i.test(String(eventName)))) return this; return originalEmit(eventName,...args); };
    const refresh = () => hideTutorialObjects(scene);
    window.addEventListener('relay:cinematic-lock', refresh);
    window.addEventListener('relay:cinematic-unlock', refresh);
    window.addEventListener('relay:tutorial-complete', refresh);
    window.addEventListener('relay-settings-change', refresh);
    installTrainingLayout();
    forceRegularModeAfterCompletion(scene);
    hideTutorialObjects(scene);
    const observer = new MutationObserver(() => { if (trainingActive()) hideTrainingSourceObjects(scene); else if (isComplete()) forceRegularModeAfterCompletion(scene); });
    observer.observe(document.body,{attributes:true,attributeFilter:['class']});
    scene.events?.once?.('shutdown', () => { observer.disconnect(); window.removeEventListener('relay:cinematic-lock',refresh); window.removeEventListener('relay:cinematic-unlock',refresh); window.removeEventListener('relay:tutorial-complete',refresh); window.removeEventListener('relay-settings-change',refresh); if (originalEmit && scene.game?.events) scene.game.events.emit=originalEmit; scene.__relayTutorialRuntimeGateV4Patched=false; snapshots.delete(scene); });
  };

  const ready = event => {
    const scene=event?.detail?.scene || window.__relayRunnerScene;
    if (!scene) return;
    if (scene.mission?.id === 'first-delivery' && isComplete()) scene.firstTimeTutorial=false;
    patchScene(scene);
  };

  window.addEventListener('relay:runner-scene-ready',ready,{passive:true});
  window.addEventListener('relay:cinematic-lock',()=>window.__relayRunnerScene&&hideTutorialObjects(window.__relayRunnerScene),{passive:true});
  window.addEventListener('relay:cinematic-unlock',()=>window.__relayRunnerScene&&hideTutorialObjects(window.__relayRunnerScene),{passive:true});
  if (window.__relayRunnerScene) ready({detail:{scene:window.__relayRunnerScene}});
})();