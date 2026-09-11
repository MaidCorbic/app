import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const LEGACY_TEXT_ASSETS = ['campaign-v2.css', 'gameplay-core-v1.css', 'world-atmosphere.css'];
const LEGACY_BINARY_ASSETS = [
  'assets/loading.jpg',
  'assets/loading-landscape.jpg',
  'assets/homescreen.jpg'
];
const FAVICON_ICO_BASE64 = 'AAABAAIAEBAAAAAAIACfAgAAJgAAACAgAAAAACAAMwIAAMUCAACJUE5HDQoaCgAAAA1JSERSAAAAEAAAABAIBgAAAB/z/2EAAAJmSURBVHicpZNNiE5hFMd/57nPfe97532HGVM+SrIQZYHksylZiaZkgyw0NqxkY+Nb+chGKcWCGqZGU0hJybAQJYkw1CiUIWY0MmPmfe+8H/fe51h4J5oZpZz9+Z3zP//zF7w6N6U+I3u2LByaNT38EccYESYtVfB9XP9AqeHs1Z7GkUJVZVpjg25bP+9Hvs7vrqYuEYdF9C8EQQ1JxjO2OBov7rzzvkEO7Fo9pMrLUxefLwfNwWTjxwMl2r9z6VMRltjZ03NDbz8NC2guV59NksSZ1Dm01uN5BusZnFMUsEZcVCznSpVE5s+ZOmQrsfPGRCeJGjHGTMmFGCMYIxQKJUaLZfxsBoC0toMRoRI7zxoZE2yolCusWLaAuzeOEscJcZwSJQlHjnXQee0hQQ3Cb4iaydROnT2T9s77LGrezbR8yJnjOwiyAc4pYuBPl+xEqxR1Kc45nHNEo2Xeve8nTRIQoVRyoO73FuMB1npoIWJX6zo+vG5j5owmDp28QlKtoKny4PJG1q6cy/eRCtbIREAcp6RhlvNtXazbZsI9Y4eDezYRhwOOOTeTrfF709NOQC0hVxwFU8X0PP9NEPhfQ/eod7e1dtLSs4uXNVtI4ZfnW6wwXKvhWUAXjVGXsfNa3fOn7zvET57h97zmeH3D63C34+oSBvm8077iJ9T1EPJwqTlVs4JvUqQJKNptx/V8HOXL4ApAhzGfp7e1j/fZLPHsziDGGwPdctVQ1TiHwTWo/D0SNYWA/gkTFQqn2ynWAo1QsA4auR721exsKcWJAojDw9PNA1PhPYTKeoOmvNE4I0//G+SfQTTV7agRoCQAAAABJRU5ErkJggolQTkcNChoKAAAADUlIRFIAAAAgAAAAIAgGAAAAc3p69AAAAfpJREFUeJxjZOXg+c8wgIAFXeDXiaTntLSQzWKeJE4H/DqR9JzNYp7krxNJlTSyvB1mB1yQlYPnPysHz///F/KeQekKmBi1McxsmF2sHDz/GehlOS5HMCEFfyWbxbx2WgQ9lmiARzETPsX0AKMOGHAHYBRE2EBYgBXDkhn5GOI/f/1meP7iPcOJM7cY+qZvZrhw+QHJDqAoBNJZWBkU5MQYIoJsGA5vbWEwN1aljwP45GMYuGSiGGy9axjeffgCd0xBhg99HMDAwMDw589fhpNnbzNs3HYKLqYoL0Y/B8AAIyMjnP3y9UeS9ROVCLFqZGFmMNZXYvDzNIWLLVi+nz4O+PRwCQr/2fN3DA1dqxjWbzmJVf2vE0kMbBbzsMpRpRxgYWVm+PzlO07LkWmqOIBPPoZBQiOZYcaCXQwMDAwMYiL8DIun5zGYGChjtZyBgYH6IfDuwxeGwur5DFeuP2JgYICkib6WBJIsp8gBDAwMDH///mNo7l0D51uYqDG42OsRbTnFDmBgYGDYsPUUw/VbT+D8bZ0mRFtOFQf8//+foX3CegjnwU6SLCfaAas2HGNgkwiH4x8/f6PIr1h3hCzLiXYAMQBmKSmWU9UB5FhOdQeQA+AOQG+t0gpgtL4HumPCiNw5HYiuGYoDYI6gheVIjkDpnGI4gN4AABdNJqORWz8sAAAAAElFTkSuQmCC';

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

function relayRunnerRuntimeStability() {
  return {
    name: 'relay-runner-runtime-stability',
    enforce: 'post',
    transform(code, id) {
      if (!id.endsWith('/src/scenes/RunnerScene.js')) return null;

      const hasHardLandingTdzSignature =
        /const hardLanding\s*=\s*this\.fallSpeed\s*>\s*260\s*;/.test(code) &&
        /this\.game\.events\.emit\(\s*['"]feedback['"]\s*,\s*hardLanding/.test(code) &&
        /const hardLanding\s*=\s*this\.landingTimer\s*>\s*0\s*&&\s*this\.fallSpeed\s*>\s*260\s*;/.test(code);

      if (!hasHardLandingTdzSignature) return null;

      let transformed = code;
      transformed = transformed.replace(
        /\n\s*const hardLanding\s*=\s*this\.landingTimer\s*>\s*0\s*&&\s*this\.fallSpeed\s*>\s*260\s*;/,
        ''
      );
      transformed = transformed.replace(
        /(if\s*\(\s*onGround\s*&&\s*!this\.wasGrounded\s*&&\s*this\.fallSpeed\s*>\s*80\s*\)\s*\{)/,
        'let hardLanding = false;\n\n$1'
      );
      transformed = transformed.replace(
        /\bconst hardLanding\s*=\s*this\.fallSpeed\s*>\s*260\s*;/,
        'hardLanding = this.fallSpeed > 260;'
      );

      if (!/let hardLanding\s*=\s*false;/.test(transformed)) {
        throw new Error(`relay-runner-runtime-stability: hardLanding declaration was not normalized in ${id}`);
      }
      if (/const hardLanding\s*=\s*this\.landingTimer\s*>\s*0/.test(transformed)) {
        throw new Error(`relay-runner-runtime-stability: duplicate hardLanding declaration remains in ${id}`);
      }

      return { code: transformed, map: null };
    },
  };
}

function relayExplicitRunnerSceneBinding() {
  let projectRoot = process.cwd();
  return {
    name: 'relay-explicit-runner-scene-binding',
    enforce: 'post',
    configResolved(config) { projectRoot = config.root; },
    transform(code, id) {
      if (!id.endsWith('.js') || id.endsWith('/src/scenes/RunnerScene.js')) return null;
      if (!/\bRunnerScene\b/.test(code)) return null;
      if (/import\s*\{[^}]*\bRunnerScene\b[^}]*\}\s*from\s*['"][^'"]*scenes\/RunnerScene\.js['"]/.test(code)) return null;
      if (/function\s+\w+\s*\(\s*RunnerScene\b/.test(code)) return null;
      if (/\b(?:const|let|var)\s+RunnerScene\s*=/.test(code)) return null;
      if (!/\bRunnerScene\.prototype\b/.test(code)) return null;

      const runnerPath = path.join(projectRoot, 'src', 'scenes', 'RunnerScene.js');
      let importPath = path.relative(path.dirname(id), runnerPath).replace(/\\/g, '/');
      if (!importPath.startsWith('.')) importPath = `./${importPath}`;

      return {
        code: `import { RunnerScene as RelayRunnerScene } from '${importPath}';\nconst RunnerScene = RelayRunnerScene;\n${code}`,
        map: null,
      };
    },
  };
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['.diploi.me'],
  },
  plugins: [
    relayLegacyAssetAliases(),
    relayRunnerRuntimeStability(),
    relayExplicitRunnerSceneBinding(),
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
