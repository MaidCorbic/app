(() => {
  'use strict';
  if (window.__relayRunnerLessonSuppressorV1) return;
  window.__relayRunnerLessonSuppressorV1 = true;

  const snapshots = new WeakMap();
  const isTraining = () => {
    if (document.body.classList.contains('relay-training-active')) return true;
    const onboarding = document.getElementById('relayTutorialOnboardingV3');
    if (onboarding && !onboarding.hidden && !onboarding.querySelector('.training-cinema:not([hidden])')) return true;
    return window.__relayRunnerScene?.mission?.id === 'first-delivery' && window.__relayRunnerScene?.firstTimeTutorial === true;
  };
  const isRunnerLesson = value => /\bRUNNER\s+LESSON\b/i.test(String(value || ''));
  const domSnapshot = { timeIndicator: null };

  const syncDom = training => {
    const node = document.getElementById('relayTimeIndicator');
    if (!node) return;
    if (training) {
      if (!domSnapshot.timeIndicator) domSnapshot.timeIndicator = {
        display: node.style.display,
        visibility: node.style.visibility,
        pointerEvents: node.style.pointerEvents,
      };
      node.style.setProperty('display', 'none', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.style.setProperty('pointer-events', 'none', 'important');
    } else if (domSnapshot.timeIndicator) {
      node.style.display = domSnapshot.timeIndicator.display;
      node.style.visibility = domSnapshot.timeIndicator.visibility;
      node.style.pointerEvents = domSnapshot.timeIndicator.pointerEvents;
      domSnapshot.timeIndicator = null;
    }
  };

  const sync = scene => {
    if (!scene?.children?.list) return;
    const training = isTraining();
    syncDom(training);

    scene.children.list.forEach(child => {
      if (!child || child.active === false || child.type !== 'Text' || !isRunnerLesson(child.text)) return;

      if (training) {
        if (!snapshots.has(child)) snapshots.set(child, child.visible !== false);
        child.setVisible?.(false);
      } else if (snapshots.has(child)) {
        child.setVisible?.(snapshots.get(child));
        snapshots.delete(child);
      }
    });
  };

  const attach = scene => {
    if (!scene || scene.__relayRunnerLessonSuppressorV1) return;
    scene.__relayRunnerLessonSuppressorV1 = true;

    const tick = () => {
      if (!scene.scene?.isActive?.() && !window.__relayRunnerScene) return;
      sync(scene);
      if (scene.__relayRunnerLessonSuppressorV1) scene.__relayRunnerLessonSuppressorTimer = window.setTimeout(tick, 180);
    };

    tick();
    scene.events?.once?.('shutdown', () => {
      if (scene.__relayRunnerLessonSuppressorTimer) window.clearTimeout(scene.__relayRunnerLessonSuppressorTimer);
      scene.children?.list?.forEach(child => {
        if (snapshots.has(child)) child.setVisible?.(snapshots.get(child));
      });
      syncDom(false);
      scene.__relayRunnerLessonSuppressorV1 = false;
      snapshots.clear?.();
    });
  };

  window.addEventListener('relay:runner-scene-ready', event => attach(event.detail?.scene || window.__relayRunnerScene));
  window.addEventListener('relay:tutorial-step', () => sync(window.__relayRunnerScene));
  window.addEventListener('relay:tutorial-complete', () => sync(window.__relayRunnerScene));
  window.addEventListener('relay:cinematic-unlock', () => sync(window.__relayRunnerScene));
  if (window.__relayRunnerScene) attach(window.__relayRunnerScene);
})();
