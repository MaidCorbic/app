// Final runtime hardening for legacy V2/V4/V5 gameplay systems.
// The guard runs before the legacy update chain and fail-closes only the
// affected legacy subsystem when Phaser has already destroyed its objects.
// No keyboard bindings are introduced or changed.
const V2 = '__relayGameplayExpansionV2Safe';
const V4 = '__relayGameplayExpansionV4Safe';
const V5 = '__relayGameplayExpansionV5Safe';
const NS = '__relayGameplayRuntimeNullSafety';

function isLive(node) {
  return !!node && node.active !== false && node.destroyed !== true;
}

function isRenderSafe(node) {
  if (!node || typeof node !== 'object') return true;
  if (!isLive(node)) return false;

  // Phaser Text/RenderTexture objects can remain active after their WebGL
  // texture source has been torn down during a scene restart/shutdown.
  // Calling setText() on those stale objects triggers the observed
  // "Cannot read properties of null (reading glTexture)" error.
  const texture = node.texture;
  const source = texture?.source;
  if (Array.isArray(source) && source.length) {
    for (const entry of source) {
      if (!entry) return false;
      if ('glTexture' in entry && entry.glTexture == null) return false;
    }
  }

  return true;
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

function hasV5InvalidState(scene) {
  const state = scene?.[V5];
  if (!state || state.destroyed || !state.entities) return false;

  const inspect = value => {
    if (!value) return false;
    if (Array.isArray(value)) return value.some(inspect);
    if (value instanceof Set) {
      for (const entry of value) if (inspect(entry)) return true;
      return false;
    }
    if (typeof value !== 'object') return false;

    // Phaser GameObjects are the only values we need to reject here.
    if ('active' in value || 'destroyed' in value || 'texture' in value) {
      return !isRenderSafe(value);
    }

    return false;
  };

  for (const entity of Object.values(state.entities)) {
    if (inspect(entity)) return true;
  }

  for (const resource of state.resources || []) {
    if (!isRenderSafe(resource)) return true;
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
  if (hasV5InvalidState(scene)) failClosed(scene[V5]);
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
