const BG_ASSETS = import.meta.glob('../../assets/environment/bg-*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const getAsset = (name) => BG_ASSETS[`../../assets/environment/${name}`];

const MAP_THEMES = {
  'first-delivery': { order: ['bg-1.png','bg-2.png','bg-3.png'], tint: 0x8defff, alpha: 0.02 },
  'dead-drop': { order: ['bg-2.png','bg-3.png','bg-1.png'], tint: 0xffb36b, alpha: 0.035 },
  blackout: { order: ['bg-3.png','bg-1.png','bg-2.png'], tint: 0x5478ff, alpha: 0.05 },
  pursuit: { order: ['bg-2.png','bg-1.png','bg-3.png'], tint: 0xff5364, alpha: 0.025 },
  'signal-storm': { order: ['bg-3.png','bg-2.png','bg-1.png'], tint: 0x9b7cff, alpha: 0.045 },
  'corporate-lockdown': { order: ['bg-1.png','bg-3.png','bg-2.png'], tint: 0xffcf82, alpha: 0.035 },
  'final-relay': { order: ['bg-2.png','bg-1.png','bg-3.png'], tint: 0x5ddcff, alpha: 0.04 },
  'mission-08': { order: ['bg-3.png','bg-1.png','bg-2.png'], tint: 0x7dffcc, alpha: 0.035 },
};

export function installEnvironment(RunnerScene) {
  const previousPreload = RunnerScene.prototype.preload;
  const previousCreate = RunnerScene.prototype.create;

  RunnerScene.prototype.preload = function () {
    if (typeof previousPreload === 'function') previousPreload.call(this);

    for (const name of ['bg-1.png','bg-2.png','bg-3.png']) {
      const asset = getAsset(name);
      if (asset) this.load.image(`environment-${name.replace('.png','')}`, asset);
    }
  };

  RunnerScene.prototype.create = function (...args) {
    if (typeof previousCreate === 'function') previousCreate.apply(this, args);

    const theme = MAP_THEMES[this.mission?.id] || MAP_THEMES['first-delivery'];
    const width = Math.max(1280, Number(this.worldWidth) || 5200);
    const height = 860;

    this.environmentLayers?.forEach((layer) => layer?.destroy());
    this.environmentLayers = [];

    theme.order.forEach((name, index) => {
      const key = `environment-${name.replace('.png','')}`;
      if (!this.textures.exists(key)) return;

      const image = this.add.image(width / 2, height / 2, key)
        .setDepth(-40 + index * 5)
        .setScrollFactor([0.045, 0.09, 0.16][index]);

      const scale = Math.max((width + 1280) / image.width, height / image.height);
      image.setScale(scale);

      // Each mission gets a distinct visual treatment while keeping the original
      // environment artwork intact.
      if (index === 0) image.setAlpha(0.98);
      if (index === 1) image.setAlpha(0.72);
      if (index === 2) image.setAlpha(0.48);

      this.environmentLayers.push(image);
    });

    const wash = this.add.rectangle(width / 2, height / 2, width + 1400, height, theme.tint, theme.alpha)
      .setDepth(-24)
      .setScrollFactor(0.35);
    this.environmentLayers.push(wash);

    // Hide the synthetic fallback skyline when the authored environment artwork exists.
    this.coreBackgroundObjects?.forEach((object) => object?.destroy?.());
    this.coreBackgroundObjects = [];
  };
}
