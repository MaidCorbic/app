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

const FAVICON_ICO_BASE64 = 'AAABAAEAAQEAAAEAIABEAAAAFgAAAIlQTkcNChoKAAAADUlIRIAAAABAAAAAQgGAAAAHxXEiQAAAAtJREFUeJxjYAACAAAFAAF6Xqs/AAAAAElFTkSuQmCC';

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
      const bundleAssetsDir = path.join(outDir, resolvedConfig.build.assetsDir || 'assets');

      fs.mkdirSync(outDir, { recursive: true });
      fs.mkdirSync(legacyDir, { recursive: true });
      fs.mkdirSync(bundleAssetsDir, { recursive: true });

      for (const relativePath of LEGACY_TEXT_ASSETS) {
        const source = path.join(root, relativePath);
        const legacyDestination = path.join(legacyDir, relativePath);
        fs.mkdirSync(path.dirname(legacyDestination), { recursive: true });
        fs.copyFileSync(source, legacyDestination);

        const bundleDestination = path.join(bundleAssetsDir, path.basename(relativePath));
        fs.copyFileSync(source, bundleDestination);

        const rootDestination = path.join(outDir, path.basename(relativePath));
        fs.copyFileSync(source, rootDestination);
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
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['.diploi.me'],
  },
});
