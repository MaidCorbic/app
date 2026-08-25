// Player Visual V2 — polished procedural cyber-runner silhouette.
// Visual-only: no physics, collision, movement, score or save-state changes.
export function createPlayerVisualV2(scene, player) {
  if (!scene || !player) return null;
  const root = scene.add.container(player.x, player.y - 4).setName('player-visual-v2');
  root.setDepth((player.depth || 0) + 2);
  const shadow = scene.add.ellipse(0, 33, 30, 7, 0x02060c, .42);
  const aura = scene.add.circle(0, 1, 28, 0x63e6ff, .055);
  const coat = scene.add.polygon(0, 7, [-14,-4,-24,14,-12,11,-6,26,3,13], 0x0b1628, 1);
  const torso = scene.add.rectangle(0, 5, 23, 30, 0x172b43, 1);
  const chest = scene.add.rectangle(0, 5, 16, 20, 0x29455f, 1);
  const coreGlow = scene.add.circle(0, 5, 9, 0x8df4ff, .10);
  const core = scene.add.circle(0, 5, 4, 0x9cf7ff, 1);
  const helmet = scene.add.circle(0, -15, 12, 0x203b58, 1);
  const visor = scene.add.rectangle(0, -14, 22, 8, 0x07101d, 1);
  const visorLine = scene.add.rectangle(0, -14, 14, 2, 0xd8fbff, .95);
  const shoulderL = scene.add.circle(-12, -1, 5, 0x294761, 1);
  const shoulderR = scene.add.circle(12, -1, 5, 0x294761, 1);
  const armL = scene.add.rectangle(-15, 10, 5, 20, 0x152940, 1);
  const armR = scene.add.rectangle(15, 10, 5, 20, 0x152940, 1);
  const gloveL = scene.add.circle(-15, 20, 3, 0x8df4ff, .85);
  const gloveR = scene.add.circle(15, 20, 3, 0x8df4ff, .85);
  const legL = scene.add.rectangle(-6, 23, 7, 16, 0x0b1628, 1);
  const legR = scene.add.rectangle(6, 23, 7, 16, 0x0b1628, 1);
  const bootL = scene.add.rectangle(-7, 31, 11, 4, 0x2b4762, 1);
  const bootR = scene.add.rectangle(7, 31, 11, 4, 0x2b4762, 1);
  const stripe = scene.add.rectangle(0, 0, 2, 22, 0xffd06e, .9);
  root.add([shadow,aura,coat,torso,chest,coreGlow,core,helmet,visor,visorLine,shoulderL,shoulderR,armL,armR,gloveL,gloveR,legL,legR,bootL,bootR,stripe]);
  function update(mode='idle') {
    root.setPosition(player.x, player.y - 4);
    const air = mode === 'jump' || mode === 'fall';
    root.setScale(mode === 'dash' ? 1.15 : mode === 'run' ? 1.04 : 1, mode === 'dash' ? .9 : 1);
    root.setAngle(mode === 'jump' ? -3 : mode === 'fall' ? 3 : mode === 'hit' ? 7 : 0);
    shadow.setScale(air ? .72 : 1);
    aura.setAlpha(mode === 'dash' ? .14 : .055);
    core.setFillStyle(mode === 'dash' ? 0xffd06e : mode === 'hit' ? 0xff826e : 0x9cf7ff, 1);
    visorLine.setAlpha(mode === 'hit' ? .35 : .95);
  }
  return { root, update, sync: () => root.setPosition(player.x, player.y - 4), destroy: () => root.destroy(true) };
}
