import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { patchSeasonalProgression } from './seasonal-progression-patch.mjs';
import { patchDeathReason } from './death-reason-patch.mjs';
import { patchInitialSpawnShield } from './initial-spawn-shield-patch.mjs';
import { patchCheckpointCollectibles } from './checkpoint-collectible-patch.mjs';
import { patchRespawnTransientState } from './respawn-transient-state-patch.mjs';
import { patchSpecialEventCreditReward } from './special-event-credit-reward-patch.mjs';

const LEGACY_TEXT_ASSETS = ['campaign-v2.css', 'gameplay-core-v1.css', 'world-atmosphere.css'];
const LEGACY_BINARY_ASSETS = [
  'assets/loading.jpg',
  'assets/loading-landscape.jpg',
  'assets/homescreen.jpg'
];
const FAVICON_ICO_BASE64 = 'AAABAAIAEBAAAAAAIACfAgAAJgAAACAgAAAAACAAMwIAAMUCAACJUE5HDQoaCgAAAA1JSERSAAAAEAAAABAIBgAAAB/z/2EAAAJmSURBVHicpZNNiE5hFMd/57nPfe97532HGVM+SrIQZYHksylZiaZkgyw0NqxkY+Nb+chGKcWCGqZGU0hJybAQJYkw1CiUIWY0MmPmfe+8H/fe51h4J5oZpZz9+Z3zP//zF7w6N6U+I3u2LByaNT38EccYESYtVfB9XP9AqeHs1Z7GkUJVZVpjg25bP+9Hvs7vrqYuEYdF9C8EQQ1JxjO2OBov7rzzvkEO7Fo9pMrLUxefLwfNwWTjxwMl2r9z6VMRltjZ03NDbz8NC2guV59NksSZ1Dm01uN5BusZnFMUsEZcVCznSpVE5s+ZOmQrsfPGRCeJGjHGTMmFGCMYIxQKJUaLZfxsBoC0toMRoRI7zxoZE2yolCusWLaAuzeOEscJcZwSJQlHjnXQee0hQQ3Cb4iaydROnT2T9s77LGrezbR8yJnjOwiyAc4pYuBPl+xEqxR1Kc45nHNEo2Xeve8nTRIQoVRyoO73FuMB1npoIWJX6zo+vG5j5owmDp28QlKtoKny4PJG1q6cy/eRCtbIREAcp6RhlvNtXazZsI9Y4eDezYRhwOOOTeTrfF709NOQC0hVxwFU8X0PP9NEPhfQ/eod7e1dtLSs4uXNVtI4ZfnW6wwXKvhWUAXjVGXsfNa3fOn7zvET57h97zmeH3D63C34+oSBvm8077iJ9T1EPJwqTlVs4JvUqQJKNptx/V8HOXL4ApAhzGfp7e1j/fZLPHsziDGGwPdctVQ1TiHwTWo/D0SNYWA/gkTFQqn2ynWAo1QsA4auR721exsKcWJAojDw9PNA1PhPYTKeoOmvNE4I0//G+SfQTTV7agRoCQAAAABJRU5ErkJggolQTkcNChoKAAAADUlIRFIAAAAgAAAAIAgGAAAAc3p69AAAAfpJREFUeJxjZOXg+c8wgIAFXeDXiaTntLSQzWKeJE4H/DqR9JzNYp7krxNJlTSyvB1mB1yQlYPnPysHz///F/KeQekKmBi1McxsmF2sHDz/GehlOS5HMCEFfyWbxbx2WgQ9lmiARzETPsX0AKMOGHAHYBRE2EBYgBXDkhn5GOI/f/1meP7iPcOJM7cY+qZvZrhw+QHJDqAoBNjZWBkU5MQYIoJsGA5vbWEwN1aljwP45GMYuGSiGGy9axjeffgCd0xBhg99HMDAwMDw589fhpNnbzNs3HYKLqYoL0Y/B8AAIyMjnP3y9UeS9ROVCLFqZGFmMNZXYvDzNIWLLVi+nz4O+PRwCQr/2fN3DA1dqxjWbzmJVf2vE0kMbBbzsMpRpRxgYWVm+PzlO07LkWmqOIBPPoZBQiOZYcaCXQwMDAwMYiL8DIun5zGYGChjtZyBgYH6IfDuwxeGwur5DFeuP2JgYICkib6WBJIsp8gBDAwMDH///mNo7l0D51uYqDG42OsRbTnFDmBgYGDYsPUUw/VbT+D8bZ0mRFtOFQf8//+foX3CegjnwU6SLCfaAas2HGNgkwiH4x8/f6PIr1h3hCzLiXYAMQBmKSmWU9UB5FhOdQeQA+AOQG+t0gpgtL4HumPCiNw5HYiuGYoDYI6gheVIjkDpnGI4gN4AABdNJqORWz8sAAAAAElFTkSuQmCC';

function relayLegacyAssetAliases() {
  let resolvedConfig;
  return {
    name: 'relay-legacy-asset-aliases',
    apply: 'build',
    configResolved(config) { resolvedConfig = config; },
    closeBundle() {
      const root = resolvedConfig.root;
      const outDir = path.resolve(root, resolvedConfig.build.outDir);
      const legacyDir = path.join(outDir, 'game');
      const bundleAssetsDir = path.join(outDir, resolvedConfig.build.assetsDir || 'assets');
      fs.mkdirSync(outDir, { recursive: true });
      fs.mkdirSync(legacyDir, { recursive: true });
      fs.mkdirSync(bundleAssetsDir, { recursive: true });
      for (const relativePath of LEGACY_TEXT_ASSETS) {
        const source = path.join(root, relativePath);
        const legacyDestination = path.join(legacyDir, relativePath);
        fs.mkdirSync(path.dirname(legacyDestination), { recursive: true });
        fs.copyFileSync(source, legacyDestination);
        fs.copyFileSync(source, path.join(bundleAssetsDir, path.basename(relativePath)));
        fs.copyFileSync(source, path.join(outDir, path.basename(relativePath)));
      }
      for (const relativePath of LEGACY_BINARY_ASSETS) {
        const source = path.join(root, relativePath);
        const destination = path.join(legacyDir, relativePath);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(source, destination);
      }
      const favicon = Buffer.from(FAVICON_ICO_BASE64, 'base64');
      fs.writeFileSync(path.join(outDir, 'favicon.ico'), favicon);
      fs.writeFileSync(path.join(legacyDir, 'favicon.ico'), favicon);
    },
  };
}

function relayTransform(name, predicate, transform) {
  return { name, transform(code, id) {
    if (!predicate(id)) return null;
    const transformed = transform(code);
    return transformed === code ? null : { code: transformed, map: null };
  } };
}

function relayCargoStateImportFix() {
  return relayTransform(
    'relay-cargo-state-import-fix',
    id => id.endsWith('/cargo-integrity-v2.js'),
    code => code
      .replace("import { packages } from './src/packages.js';", "import { packages } from './src/packages.js';\nimport { loadState, saveState } from './src/state.js';")
      .replace("import('./src/state.js').then(({ loadState, saveState }) => {", "Promise.resolve().then(() => ({ loadState, saveState })).then(({ loadState, saveState }) => {")
  );
}

function relaySeasonalProgressionFix() {
  return relayTransform('relay-seasonal-progression-fix', id => id.endsWith('/src/state.js'), patchSeasonalProgression);
}
function relayDeathReasonFix() {
  return relayTransform('relay-death-reason-fix', id => id.endsWith('/src/scenes/RunnerScene.js'), patchDeathReason);
}
function relayInitialSpawnShieldFix() {
  return relayTransform('relay-initial-spawn-shield-fix', id => id.endsWith('/src/scenes/RunnerScene.js'), patchInitialSpawnShield);
}
function relayCheckpointCollectiblesFix() {
  return relayTransform('relay-checkpoint-collectibles-fix', id => id.endsWith('/src/scenes/RunnerScene.js'), patchCheckpointCollectibles);
}
function relayRespawnTransientStateFix() {
  return relayTransform('relay-respawn-transient-state-fix', id => id.endsWith('/src/scenes/RunnerScene.js'), patchRespawnTransientState);
}
function relaySpecialEventCreditRewardFix() {
  return relayTransform('relay-special-event-credit-reward-fix', id => id.endsWith('/src/state.js'), patchSpecialEventCreditReward);
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['.diploi.me'],
  },
  plugins: [
    relayCargoStateImportFix(),
    relaySeasonalProgressionFix(),
    relayDeathReasonFix(),
    relayInitialSpawnShieldFix(),
    relayCheckpointCollectiblesFix(),
    relayRespawnTransientStateFix(),
    relaySpecialEventCreditRewardFix(),
    relayLegacyAssetAliases(),
  ],
  build: {
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          minSize: 20000,
          groups: [
            { name: 'phaser-vendor', test: /node_modules[\\/]phaser[\\/]/, priority: 20 },
            { name: 'vendor', test: /node_modules[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
});
