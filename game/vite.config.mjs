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
const LEGACY_BINARY_ASSETS = ['assets/loading.jpg', 'assets/loading-landscape.jpg'];
const FAVICON_ICO_BASE64 = 'AAABAAEAAQEAAAEAIABEAAAAFgAAAIlQTkcNChoKAAAADUlIRIAAAABAAAAAQgGAAAAHxXEiQAAAAtJREFUeJxjYAACAAAFAAF6Xqs/AAAAAElFTkSuQmCC';

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
