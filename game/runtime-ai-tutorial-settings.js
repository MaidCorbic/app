import { loadState } from './src/state.js';
import { RunnerScene } from './src/scenes/RunnerScene.js';

(() => {
  if (window.__relayRuntimeAiTutorialSettingsV1) return;
  window.__relayRuntimeAiTutorialSettingsV1 = true;

  const settings = () => loadState();
  const tutorialEnabled = () => settings().tutorialEnabled !== false;
  const voiceEnabled = () => settings().aiVoice !== false;

  // The browser narrator is shared by the runtime. Keep the existing voice
  // selection/queue untouched, but make the Home toggle a real runtime gate.
  const speech = window.speechSynthesis;
  if (speech && !speech.__relayAiVoiceGateV1) {
    const originalSpeak = speech.speak.bind(speech);
    speech.speak = utterance => {
      if (!voiceEnabled()) return;
      originalSpeak(utterance);
    };
    speech.__relayAiVoiceGateV1 = true;
  }

  window.addEventListener('relay-settings-change', event => {
    if (event.detail?.key === 'aiVoice' && event.detail.value === false) speech?.cancel?.();
    if (event.detail?.reset) speech?.cancel?.();
  });

  const prototype = RunnerScene?.prototype;
  if (!prototype || prototype.__relayTutorialSettingsV1) return;

  const originalInit = prototype.init;
  const originalCreateGuides = prototype.createGuides;
  const originalCreateGuideCompanions = prototype.createGuideCompanions;
  const originalCollectGuideCompanion = prototype.collectGuideCompanion;
  const originalUpdateCombatTutorial = prototype.updateCombatTutorial;
  const originalUseGadget = prototype.useGadget;

  prototype.init = function relayTutorialAwareInit(config = {}) {
    return originalInit.call(this, {
      ...config,
      firstTimeTutorial: tutorialEnabled() && Boolean(config.firstTimeTutorial),
    });
  };

  prototype.createGuides = function relayTutorialAwareGuides(...args) {
    if (!tutorialEnabled()) return;
    return originalCreateGuides?.apply(this, args);
  };

  prototype.createGuideCompanions = function relayTutorialAwareCompanions(...args) {
    if (!tutorialEnabled()) return;
    return originalCreateGuideCompanions?.apply(this, args);
  };

  prototype.collectGuideCompanion = function relayTutorialAwareCompanion(...args) {
    if (!tutorialEnabled()) return;
    return originalCollectGuideCompanion?.apply(this, args);
  };

  prototype.updateCombatTutorial = function relayTutorialAwareCombatTutorial(...args) {
    if (!tutorialEnabled()) return;
    return originalUpdateCombatTutorial?.apply(this, args);
  };

  // Gadget lessons emit the generic `tutorial` event even outside the first-run
  // flow. Suppress only that event when the Home tutorial toggle is OFF; the
  // gadget mechanics themselves continue to execute normally.
  prototype.useGadget = function relayTutorialAwareGadget(...args) {
    if (tutorialEnabled() || !this.game?.events?.emit) return originalUseGadget?.apply(this, args);
    const events = this.game.events;
    const originalEmit = events.emit;
    events.emit = function gatedTutorialEmit(eventName, ...eventArgs) {
      if (eventName === 'tutorial') return this;
      return originalEmit.call(this, eventName, ...eventArgs);
    };
    try {
      return originalUseGadget?.apply(this, args);
    } finally {
      events.emit = originalEmit;
    }
  };

  prototype.__relayTutorialSettingsV1 = true;
})();
