const BG_ASSETS = import.meta.glob('../../assets/environment/bg-*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const getAsset = (name) => {
  return BG_ASSETS[`../../assets/environment/${name}`];
};

export function installEnvironment(RunnerScene) {
  const previousPreload = RunnerScene.prototype.preload;
  const previousCreate = RunnerScene.prototype.create;

  RunnerScene.prototype.preload = function () {
    if (typeof previousPreload === 'function') {
      previousPreload.call(this);
    }

    const bg1 = getAsset('bg-1.png');
    const bg2 = getAsset('bg-2.png');
    const bg3 = getAsset('bg-3.png');

    if (bg1) {
      this.load.image('environment-bg-1', bg1);
    }

    if (bg2) {
      this.load.image('environment-bg-2', bg2);
    }

    if (bg3) {
      this.load.image('environment-bg-3', bg3);
    }
  };

  RunnerScene.prototype.create = function (...args) {
    if (typeof previousCreate === 'function') {
      previousCreate.apply(this, args);
    }

    const viewportWidth = 1280;
    const viewportHeight = 720;
    const worldWidth = Math.max(viewportWidth, Number(this.worldWidth) || viewportWidth);
    const backgroundWidth = worldWidth + viewportWidth;

    this.environmentLayers = [];

    const layers = [
      {
        key: 'environment-bg-1',
        depth: -30,
        scrollFactor: 0.05,
      },
      {
        key: 'environment-bg-2',
        depth: -20,
        scrollFactor: 0.12,
      },
      {
        key: 'environment-bg-3',
        depth: -10,
        scrollFactor: 0.22,
      },
    ];

    for (const config of layers) {
      if (!this.textures.exists(config.key)) {
        continue;
      }

      const image = this.add
        .image(worldWidth / 2, viewportHeight / 2, config.key)
        .setDepth(config.depth)
        .setScrollFactor(config.scrollFactor);

      const scaleX = backgroundWidth / image.width;
      const scaleY = viewportHeight / image.height;
      const scale = Math.max(scaleX, scaleY);

      image.setScale(scale);

      this.environmentLayers.push(image);
    }
  };
}
