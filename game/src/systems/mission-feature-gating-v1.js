const FEATURE_UNLOCKS = Object.freeze({
  grapple: new Set(['dead-drop', 'blackout', 'pursuit', 'signal-storm', 'corporate-lockdown', 'final-relay']),
  teleport: new Set(['blackout', 'pursuit', 'signal-storm', 'corporate-lockdown', 'final-relay']),
  biohazard: new Set(['pursuit', 'signal-storm', 'corporate-lockdown', 'final-relay']),
  autonomous: new Set(['signal-storm', 'corporate-lockdown', 'final-relay']),
  playerVisual: new Set(['first-delivery', 'dead-drop', 'blackout', 'pursuit', 'signal-storm', 'corporate-lockdown', 'final-relay']),
});

const FEATURE_ALIASES = Object.freeze({
  'grapple-traversal': 'grapple',
  'teleport-network': 'teleport',
  'biohazard-contamination': 'biohazard',
  'autonomous-character': 'autonomous',
  'player-visual-v2': 'playerVisual',
});

export function featureEnabled(feature, missionId) {
  const key = FEATURE_ALIASES[feature] || feature;
  return Boolean(missionId && FEATURE_UNLOCKS[key]?.has(missionId));
}

export function missionFeatureSet(missionId) {
  return Object.keys(FEATURE_UNLOCKS).filter(feature => featureEnabled(feature, missionId));
}

export function installMissionFeatureGating(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__missionFeatureGatingInstalled) return;
  RunnerScene.prototype.__missionFeatureGatingInstalled = true;

  const originalCreate = RunnerScene.prototype.create;
  RunnerScene.prototype.create = function (...args) {
    const result = originalCreate.apply(this, args);
    const missionId = this.mission?.id || this.activeMission?.id || this.package?.id || this.currentMissionId || this.scene?.settings?.missionId || null;
    this.__missionFeatureGating = { missionId, enabled: new Set(missionFeatureSet(missionId)) };
    return result;
  };

  RunnerScene.prototype.isFeatureEnabled = function (feature) {
    return this.__missionFeatureGating?.enabled?.has(FEATURE_ALIASES[feature] || feature) === true;
  };
}

export { FEATURE_UNLOCKS };
