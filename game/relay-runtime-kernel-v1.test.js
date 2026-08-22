/* Lightweight browser smoke checks for UPDATE 22.
   Not loaded by gameplay. Run manually in a test page/console when needed.
*/
export function relayRuntimeKernelSmokeTest(runtime = window.RelayRuntime) {
  if (!runtime) throw new Error('RelayRuntime is not loaded');
  const scene = runtime.scene();
  return {
    version: runtime.version,
    sceneLoaded: !!scene,
    sceneAccessor: typeof runtime.scene === 'function',
    gameAccessor: typeof runtime.game === 'function',
    moduleFactory: typeof runtime.module === 'function',
    debug: typeof runtime.debug === 'function',
  };
}
