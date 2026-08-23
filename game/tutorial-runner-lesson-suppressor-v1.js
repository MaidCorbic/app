(() => {
  'use strict';
  if (window.__relayRunnerLessonSuppressorV1) return;
  window.__relayRunnerLessonSuppressorV1 = true;

  const snapshots = new WeakMap();
  const isTraining = () => document.body.classList.contains('relay-training-active');
  const isRunnerLesson = value => /\bRUNNER\s+LESSON\b/i.test(String(value || ''));

  const sync = scene => {
    if (!scene?.children?.list) return;
    const training = isTraining();

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
      scene.__relayRunnerLessonSuppressorV1 = false;
      snapshots.clear?.();
    });
  };

  window.addEventListener('relay:runner-scene-ready', event => attach(event.detail?.scene || window.__relayRunnerScene));
  if (window.__relayRunnerScene) attach(window.__relayRunnerScene);
})();
