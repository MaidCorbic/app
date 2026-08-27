export function patchCheckpointCollectibles(code) {
  let transformed = code;
  const signalMarker = "const signal = this.signals.create(x, y, 'signal').setImmovable(true); signal.setData('id', index);";
  const signalReplacement = "const signal = this.signals.create(x, y, 'signal').setImmovable(true); signal.setData('id', index); signal.setData('spawnX', x); signal.setData('spawnY', y);";
  const secretMarker = "const secret = this.secrets.create(x, y, 'signal').setImmovable(true).setTint(0x8df4ff).setScale(.72).setData('id', index);";
  const secretReplacement = "const secret = this.secrets.create(x, y, 'signal').setImmovable(true).setTint(0x8df4ff).setScale(.72).setData('id', index).setData('spawnX', x).setData('spawnY', y);";
  transformed = transformed.replace(signalMarker, signalReplacement);
  transformed = transformed.replace(secretMarker, secretReplacement);

  transformed = transformed.replace(
    "signal.enableBody(true, signal.x, signal.y, true, true);",
    "signal.enableBody(true, signal.getData('spawnX'), signal.getData('spawnY'), true, true);"
  );
  transformed = transformed.replace(
    "secret.enableBody(true, secret.x, secret.y, true, true);",
    "secret.enableBody(true, secret.getData('spawnX'), secret.getData('spawnY'), true, true);"
  );

  return transformed;
}
