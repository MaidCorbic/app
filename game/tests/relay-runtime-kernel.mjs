import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../relay-runtime-kernel-v1.js', import.meta.url), 'utf8');

const listeners = new Map();
const window = {
  __relayRunnerScene: null,
  addEventListener(name, handler) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(handler);
  },
  removeEventListener(name, handler) {
    listeners.get(name)?.delete(handler);
  },
  dispatchEvent(event) {
    listeners.get(event.type)?.forEach(handler => handler(event));
    return true;
  },
  CustomEvent: class CustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  },
  console,
};

const context = vm.createContext({ window, console });
vm.runInContext(source, context, { filename: 'relay-runtime-kernel-v1.js' });

assert.equal(typeof window.RelayRuntime, 'object');
assert.equal(window.RelayRuntime.version, '1.0.0');
assert.equal(window.RelayRuntime.scene(), null);

const sceneListeners = new Map();
const scene = {
  mission: { id: 'first-delivery' },
  game: { events: { on() {}, once() {}, off() {} } },
  events: {
    once(name, handler) {
      if (!sceneListeners.has(name)) sceneListeners.set(name, []);
      sceneListeners.get(name).push(handler);
    },
    on() {},
    off() {},
  },
};

let readyCount = 0;
const runtimeModule = window.RelayRuntime.module('kernel-test');
runtimeModule.onSceneReady(current => {
  readyCount += 1;
  assert.equal(current, scene);
});

window.dispatchEvent(new window.CustomEvent('relay:runner-scene-ready', { detail: { scene } }));
assert.equal(window.RelayRuntime.scene(), scene);
assert.equal(readyCount, 1);
assert.equal(window.RelayRuntime.debug().sceneLoaded, true);

sceneListeners.get('shutdown')?.forEach(handler => handler());
assert.equal(window.RelayRuntime.scene(), null);

console.log('Relay Runtime Kernel tests passed.');
