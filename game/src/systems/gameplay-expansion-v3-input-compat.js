import { RunnerScene } from '../scenes/RunnerScene.js';

const NS = '__relayGameplayExpansionV3Safe';
const REMAPS = [
  ['keydown-C', 'keydown-J', 'clonePosition'],
  ['keydown-V', 'keydown-H', 'phaseSplit'],
  ['keydown-Z', 'keydown-Y', 'scaleShift'],
  ['keydown-Q', 'keydown-K', 'ruleInjection'],
];

export function installGameplayExpansionV3InputCompat(SceneClass = RunnerScene) {
  if (!SceneClass?.prototype || SceneClass.prototype.__gameplayExpansionV3InputCompatInstalled) return;
  SceneClass.prototype.__gameplayExpansionV3InputCompatInstalled = true;
  const create = SceneClass.prototype.create;
  SceneClass.prototype.create = function gameplayExpansionV3InputCompatCreate(...args) {
    const result = create.apply(this, args);
    try {
      const st = this[NS];
      if (!st || st.compatRemapped) return result;
      st.compatRemapped = true;
      for (const [oldEvent, newEvent, feature] of REMAPS) {
        const binding = st.bindings?.find?.(([eventName]) => eventName === oldEvent);
        if (!binding) continue;
        const [, handler] = binding;
        this.input.keyboard?.off?.(oldEvent, handler);
        this.input.keyboard?.on?.(newEvent, handler);
        st.bindings.push([newEvent, handler]);
        const entity = st.entities?.[feature];
        if (feature === 'clonePosition') entity?.badge?.setText('CLONE POSITION · J');
        if (feature === 'phaseSplit') entity?.badge?.setText('PHASE SPLIT · H');
        if (feature === 'scaleShift') entity?.badge?.setText('SCALE SHIFT · Y');
        if (feature === 'ruleInjection') entity?.badge?.setText('RULE INJECTION · K');
      }
    } catch (error) {
      console.warn('[Relay] V3 input compatibility layer skipped:', error);
    }
    return result;
  };
}

export const gameplayExpansionV3InputRemaps = REMAPS.map(([oldEvent, newEvent]) => ({ oldEvent, newEvent }));
