import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const LEGACY_TEXT_ASSETS = [
  'campaign-v2.css',
  'gameplay-core-v1.css',
  'world-atmosphere.css',
];

const LEGACY_BINARY_ASSETS = [
  'assets/loading.jpg',
  'assets/loading-landscape.jpg',
];

// The game is built by Vite from /game, while some existing production entry
// points still address these files through legacy /game/* URLs. Keep a
// compatibility copy in dist/game/* so those URLs resolve without touching
// gameplay, mission, input, save, or progression logic.
const FAVICON_ICO_BASE64 = 'AAABAAEAAQEAAAEAIABEAAAAFgAAAIlQTkcNChoKAAAADUlIRFIAAAABAAAAAQgGAAAAHxXEiQAAAAtJREFUeJxjYAACAAAFAAF6Xqs/AAAAAElFTkSuQmCC';

function relayLegacyAssetAliases() {
  let resolvedConfig;

  return {
    name: 'relay-legacy-asset-aliases',
    apply: 'build',
    configResolved(config) {
      resolvedConfig = config;
    },
    closeBundle() {
      const root = resolvedConfig.root;
      const outDir = path.resolve(root, resolvedConfig.build.outDir);
      const legacyDir = path.join(outDir, 'game');

      fs.mkdirSync(legacyDir, { recursive: true });

      for (const relativePath of LEGACY_TEXT_ASSETS) {
        const source = path.join(root, relativePath);
        const destination = path.join(legacyDir, relativePath);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(source, destination);
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

export default defineConfig({
  plugins: [relayLegacyAssetAliases()],
});
