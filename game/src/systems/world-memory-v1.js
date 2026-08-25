const STORAGE_KEY = 'relay.worldMemory.v1';
const DEFAULT_STATE = Object.freeze({ courierHelped: false });

function readState() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeState(state) {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is optional; gameplay must continue if storage is unavailable.
  }
}

export function getWorldMemory() {
  return readState();
}

export function setWorldMemory(key, value) {
  const next = { ...readState(), [key]: value };
  writeState(next);
  return next;
}

export function installWorldMemory(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__worldMemoryInstalled) return;
  RunnerScene.prototype.__worldMemoryInstalled = true;
  RunnerScene.prototype.getWorldMemory = getWorldMemory;
  RunnerScene.prototype.setWorldMemory = setWorldMemory;
}
