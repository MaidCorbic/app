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

function relaySeasonalProgressionFix() {
  return { name: 'relay-seasonal-progression-fix', transform(code, id) {
    if (!id.endsWith('/src/state.js')) return null;
    const transformed = patchSeasonalProgression(code);
    return transformed === code ? null : { code: transformed, map: null };
  } };
}

function relayDeathReasonFix() {
  return { name: 'relay-death-reason-fix', transform(code, id) {
    if (!id.endsWith('/src/scenes/RunnerScene.js')) return null;
    const transformed = patchDeathReason(code);
    return transformed === code ? null : { code: transformed, map: null };
  } };
}

function relayInitialSpawnShieldFix() {
  return { name: 'relay-initial-spawn-shield-fix', transform(code, id) {
    if (!id.endsWith('/src/scenes/RunnerScene.js')) return null;
    const transformed = patchInitialSpawnShield(code);
    return transformed === code ? null : { code: transformed, map: null };
  } };
}

function relayCheckpointCollectiblesFix() {
  return { name: 'relay-checkpoint-collectibles-fix', transform(code, id) {
    if (!id.endsWith('/src/scenes/RunnerScene.js')) return null;
    const transformed = patchCheckpointCollectibles(code);
    return transformed === code ? null : { code: transformed, map: null };
  } };
}

function relayRespawnTransientStateFix() {
  return { name: 'relay-respawn-transient-state-fix', transform(code, id) {
    if (!id.endsWith('/src/scenes/RunnerScene.js')) return null;
    const transformed = patchRespawnTransientState(code);
    return transformed === code ? null : { code: transformed, map: null };
  } };
}

function relaySpecialEventCreditRewardFix() {
  return { name: 'relay-special-event-credit-reward-fix', transform(code, id) {
    if (!id.endsWith('/src/state.js')) return null;
    const transformed = patchSpecialEventCreditReward(code);
    return transformed === code ? null : { code: transformed, map: null };
  } };
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['.diploi.me'],
  },
  plugins: [
    relaySeasonalProgressionFix(),
    relayDeathReasonFix(),
    relayInitialSpawnShieldFix(),
    relayCheckpointCollectiblesFix(),
    relayRespawnTransientStateFix(),
    relaySpecialEventCreditRewardFix(),
    relayLegacyAssetAliases(),
  ],
});
