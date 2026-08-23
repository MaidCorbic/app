import { loadState } from './src/state.js';

(() => {
  if (window.__relayTutorialRuntimeGateV3) return;
  window.__relayTutorialRuntimeGateV3 = true;

  const enabled = () => loadState().tutorialEnabled !== false && !window.__relayCinematicLock;
  const trainingActive = () => document.body.classList.contains('relay-training-active');
  const tutorialText = value => /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE|CHECKPOINT/i.test(String(value || ''));
  const snapshots = new WeakMap();

  const installTrainingLayout = () => {
    if (document.getElementById('relayTutorialSourceLayoutV1')) return;
    const style = document.createElement('style');
    style.id = 'relayTutorialSourceLayoutV1';
    style.textContent = `
      body.relay-training-active #relayTimeIndicator{display:none!important;visibility:hidden!important;pointer-events:none!important}
      body.relay-training-active #relayTutorialOnboardingV3 .training-card{top:clamp(108px,16vh,180px)!important;bottom:auto!important;left:50%!important;width:min(500px,calc(100vw - 32px))!important;max-height:min(210px,calc(100vh - 300px))!important;padding:14px 18px!important;transform:translateX(-50%)!important;overflow:hidden!important}
      body.relay-training-active #relayTutorialOnboardingV3 .training-card h2{margin:6px 0!important;font-size:clamp(20px,3.2vw,31px)!important}
      body.relay-training-active #relayTutorialOnboardingV3 .training-card p{max-width:440px!important;font-size:11px!important;line-height:1.35!important}
      body.relay-training-active #relayTutorialOnboardingV3 .training-card kbd{margin-top:8px!important;padding:6px 9px!important}
      body.relay-training-active #relayTutorialOnboardingV3 .training-progress{margin-top:9px!important}
      @media(max-width:700px){body.relay-training-active #relayTutorialOnboardingV3 .training-card{width:min(88vw,500px)!important;top:clamp(106px,15vh,170px)!important;max-height:min(200px,calc(100vh - 280px))!important;padding:12px 14px!important}body.relay-training-active #relayTutorialOnboardingV3 .training-card p{font-size:10.5px!important}}
      @media(max-height:560px){body.relay-training-active #relayTutorialOnboardingV3 .training-card{top:96px!important;max-height:170px!important}body.relay-training-active #relayTutorialOnboardingV3 .training-card h2{font-size:20px!important}}
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
    document.getElementById('relayTimeIndicator')?.setAttribute('hidden','hidden');
  };

  const hideTutorialObjects = scene => {
    if (!scene) return;
    if (trainingActive()) { hideTrainingSourceObjects(scene); return; }

    if (window.__relayCinematicLock) {
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

    if (enabled()) return;
    scene.routeTutorials?.clear?.();
    scene.dismissIntelCard?.();
    scene.children?.list?.slice().forEach(child => { if (!child?.active || child.type !== 'Text') return; if (tutorialText(child.text)) child.setVisible?.(false); });
    scene.guides?.setVisible?.(false);
    scene.guideCompanions?.setVisible?.(false);
  };

  const patchScene = scene => {
    if (!scene || scene.__relayTutorialRuntimeGateV3Patched) return;
    scene.__relayTutorialRuntimeGateV3Patched = true;
    const originalEmit = scene.game?.events?.emit?.bind(scene.game.events);
    if (originalEmit) scene.game.events.emit = function tutorialGatedEmit(eventName,...args){ if ((!enabled() && eventName==='tutorial') || (window.__relayCinematicLock && /tutorial/i.test(String(eventName)))) return this; return originalEmit(eventName,...args); };
    const refresh = () => hideTutorialObjects(scene);
    window.addEventListener('relay:cinematic-lock', refresh);
    window.addEventListener('relay:cinematic-unlock', refresh);
    window.addEventListener('relay-settings-change', refresh);
    installTrainingLayout();
    hideTutorialObjects(scene);
    const observer = new MutationObserver(() => { if (trainingActive()) hideTrainingSourceObjects(scene); });
    observer.observe(document.body,{attributes:true,attributeFilter:['class']});
    scene.events?.once?.('shutdown', () => { observer.disconnect(); window.removeEventListener('relay:cinematic-lock',refresh); window.removeEventListener('relay:cinematic-unlock',refresh); window.removeEventListener('relay-settings-change',refresh); if (originalEmit && scene.game?.events) scene.game.events.emit=originalEmit; scene.__relayTutorialRuntimeGateV3Patched=false; snapshots.delete(scene); });
  };

  const ready = event => patchScene(event?.detail?.scene || window.__relayRunnerScene);
  window.addEventListener('relay:runner-scene-ready', ready);
  window.addEventListener('relay:cinematic-lock', () => window.__relayRunnerScene && hideTutorialObjects(window.__relayRunnerScene));
  window.addEventListener('relay:cinematic-unlock', () => { const scene=window.__relayRunnerScene; if(!scene)return; hideTutorialObjects(scene); if(scene.firstTimeTutorial && loadState().tutorialEnabled!==false){ if(!scene.guides || !scene.guides.active) scene.createGuides?.(); if(!scene.guideCompanions || !scene.guideCompanions.active) scene.createGuideCompanions?.(); scene.guides?.setVisible?.(true); scene.guideCompanions?.setVisible?.(true); } });
  if (window.__relayRunnerScene) patchScene(window.__relayRunnerScene);
})();
