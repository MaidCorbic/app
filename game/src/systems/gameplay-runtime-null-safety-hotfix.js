// Final runtime hardening for legacy V2/V4 gameplay systems.
// The guard runs before the legacy update chain and fail-closes only the
// affected legacy subsystem when Phaser has already destroyed its objects.
// No keyboard bindings are introduced or changed.
const V2 = '__relayGameplayExpansionV2Safe';
const V4 = '__relayGameplayExpansionV4Safe';
const NS = '__relayGameplayRuntimeNullSafety';

function isLive(node) {
  return !!node && node.active !== false && node.destroyed !== true;
}

function hasV2InvalidState(scene) {
  const state = scene?.[V2];
  if (!state || state.destroyed || !state.entities) return false;

  const belts = state.entities?.conveyor?.belts;
  if (Array.isArray(belts)) {
    for (const entry of belts) {
      const belt = entry?.belt;
      if (!isLive(belt) || !belt?.data?.values) return true;
    }
  }

  const sources = state.entities?.magnetic?.sources;
  if (Array.isArray(sources)) {
    for (const entry of sources) {
      if (!isLive(entry?.source)) return true;
    }
  }

  const cargo = state.entities?.magnetic?.cargo;
  if (Array.isArray(cargo)) {
    for (const item of cargo) {
      if (!isLive(item)) return true;
    }
  }

  return false;
}

function hasV4InvalidState(scene) {
  const state = scene?.[V4];
  if (!state || state.destroyed || !state.entities) return false;

  const echo = state.entities.echoScan;
  if (echo && (!isLive(echo.pulse) || !echo.pulse.geom || !isLive(echo.node))) return true;

  const sonic = state.entities.sonicPushPull;
  if (sonic && (!isLive(sonic.ring) || !sonic.ring.geom || !isLive(sonic.node))) return true;

  const keys = [
    'surfacePhysics',
    'temperatureSystem',
    'objectDuplication',
    'trajectoryPreview',
    'remoteCamera',
    'objectRotation',
    'surfacePhaseMarking',
    'impactBanking',
  ];

  for (const key of keys) {
    const entry = state.entities[key];
    if (!entry) continue;
    const values = Object.values(entry);
    for (const value of values) {
      const nodes = Array.isArray(value) ? value : [value];
      for (const node of nodes) {
        if (node && typeof node === 'object' && 'active' in node && !isLive(node)) return true;
        if (node && typeof node === 'object' && 'geom' in node && !node.geom) return true;
      }
    }
  }

  return false;
}

function failClosed(state) {
  if (!state) return;
  state.destroyed = true;
  if (state.enabled && typeof state.enabled === 'object') {
    for (const key of Object.keys(state.enabled)) state.enabled[key] = false;
  }
  state.entities = {};
}

function sanitize(scene) {
  if (!scene) return;
  if (hasV2InvalidState(scene)) failClosed(scene[V2]);
  if (hasV4InvalidState(scene)) failClosed(scene[V4]);
}

export function installGameplayRuntimeNullSafety(SceneClass) {
  if (!SceneClass?.prototype || SceneClass.prototype[NS]) return;
  SceneClass.prototype[NS] = true;

  const originalUpdate = SceneClass.prototype.update;
  SceneClass.prototype.update = function gameplayRuntimeNullSafetyUpdate(time, delta, ...args) {
    sanitize(this);
    return originalUpdate.apply(this, [time, delta, ...args]);
  };
}
