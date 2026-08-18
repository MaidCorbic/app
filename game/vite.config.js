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

// Keep compatibility copies for every URL shape used by the existing runtime:
// - /game/* for legacy HTML/runtime references
// - /assets/* for CSS files requested relative to the Vite-generated JS bundle
// - /* for runtime scripts whose relative URLs resolve from the site root
// This build-only aliasing does not touch gameplay, mission, input, save, or
// progression logic.
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

        // /game/<file> — legacy HTML/runtime references.
        const legacyDestination = path.join(legacyDir, relativePath);
        fs.mkdirSync(path.dirname(legacyDestination), { recursive: true });
        fs.copyFileSync(source, legacyDestination);

        // /assets/<file> — requests relative to Vite's generated JS bundle.
        const bundleDestination = path.join(bundleAssetsDir, path.basename(relativePath));
        fs.copyFileSync(source, bundleDestination);

        // /<file> — the actual runtime request observed in production.
        // The browser resolves ./<file> relative to /assets/index-*.js to the
        // site root under the current deployment setup, so keep this explicit
        // compatibility copy as well.
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
});
