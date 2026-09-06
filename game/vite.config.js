import { defineConfig } from 'vite';

const RUNNER_SCENE = '/src/scenes/RunnerScene.js';

export default defineConfig({
  plugins: [
    {
      name: 'runner-scene-build-safety',
      enforce: 'pre',
      transform(code, id) {
        if (!id.endsWith(RUNNER_SCENE)) {
          return null;
        }

        const duplicateZoomBlock = "const targetZoom =\n  1 + speedZoom;";
        const replacementZoomBlock = "const speedZoomTarget =\n  1 + speedZoom;\n\ntargetZoom =\n  Math.max(\n    targetZoom,\n    speedZoomTarget\n  );";

        if (!code.includes(duplicateZoomBlock)) {
          return null;
        }

        const occurrences = code.split(duplicateZoomBlock).length - 1;
        if (occurrences !== 1) {
          throw new Error(
            `RunnerScene build guard expected exactly 1 duplicate targetZoom block, found ${occurrences}.`
          );
        }

        return {
          code: code.replace(
            duplicateZoomBlock,
            replacementZoomBlock
          ),
          map: null,
        };
      },
    },
  ],
});
