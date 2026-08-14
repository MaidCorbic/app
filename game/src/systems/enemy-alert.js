const ALERT_STATE = Object.freeze({ CLEAR: 'CLEAR', SUSPICIOUS: 'SUSPICIOUS', ALERT: 'ALERT' });
const CONFIG = Object.freeze({
  suspiciousRange: 300,
  alertRange: 155,
  loseRange: 390,
  buildUpMs: 520,
  cooldownMs: 1800,
});

const STYLE_ID = 'enemy-alert-style';
const HUD_ID = 'enemyAlertHud';
const STYLE = `
.enemy-alert-hud{position:absolute;left:50%;top:74px;transform:translateX(-50%);z-index:25;display:flex;align-items:center;gap:8px;padding:7px 11px;border:1px solid rgba(150,190,255,.18);border-radius:999px;background:rgba(6,14,28,.78);backdrop-filter:blur(8px);font:700 9px/1 DM Mono,monospace;letter-spacing:.14em;pointer-events:none;opacity:0;transition:opacity .18s ease,transform .18s ease}
.enemy-alert-hud.is-visible{opacity:1}.enemy-alert-hud.is-suspicious{border-color:rgba(255,208,110,.4)}.enemy-alert-hud.is-alert{border-color:rgba(255,117,109,.55);box-shadow:0 0 18px rgba(255,117,109,.12)}
.enemy-alert-dot{width:7px;height:7px;border-radius:50%;background:#8df4ff;box-shadow:0 0 8px currentColor}.enemy-alert-hud.is-suspicious .enemy-alert-dot{background:#ffd06e}.enemy-alert-hud.is-alert .enemy-alert-dot{background:#ff756d}
.enemy-alert-label{white-space:nowrap}.enemy-alert-detail{opacity:.55;font-size:8px;letter-spacing:.08em}
@media(max-width:700px){.enemy-alert-hud{top:68px;font-size:8px}.enemy-alert-detail{display:none}}
`;

function installStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLE;
  document.head.appendChild(style);
}

function createHud() {
  const play = document.getElementById('play');
  if (!play) return null;
  let hud = document.getElementById(HUD_ID);
  if (hud) return hud;
  hud = document.createElement('div');
  hud.id = HUD_ID;
  hud.className = 'enemy-alert-hud';
  hud.innerHTML = '<span class="enemy-alert-dot"></span><span class="enemy-alert-label">CLEAR</span><span class="enemy-alert-detail">NO THREATS DETECTED</span>';
  play.appendChild(hud);
  return hud;
}

function setHud(hud, state, detail = '') {
  if (!hud) return;
  hud.classList.toggle('is-visible', state !== ALERT_STATE.CLEAR);
  hud.classList.toggle('is-suspicious', state === ALERT_STATE.SUSPICIOUS);
  hud.classList.toggle('is-alert', state === ALERT_STATE.ALERT);
  hud.querySelector('.enemy-alert-label')?.replaceChildren(document.createTextNode(state));
  hud.querySelector('.enemy-alert-detail')?.replaceChildren(document.createTextNode(detail || (state === ALERT_STATE.ALERT ? 'ENEMY HAS YOUR POSITION' : state === ALERT_STATE.SUSPICIOUS ? 'THREAT NEARBY' : 'NO THREATS DETECTED')));
}

function distance(a, b) {
  return Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));
}

function facingPlayer(enemy, player) {
  const direction = enemy?.flipX ? -1 : 1;
  return ((player?.x || 0) - (enemy?.x || 0)) * direction >= -35;
}

function getEnemies(scene) {
  try {
    return scene?.enemies?.getChildren?.().filter(enemy => enemy?.active) || [];
  } catch {
    return [];
  }
}

function nearestThreat(scene) {
  const player = scene?.player;
  if (!player?.active) return null;
  let closest = null;
  let closestDistance = Infinity;
  for (const enemy of getEnemies(scene)) {
    if (enemy.getData?.('boss') && Number(enemy.getData?.('health')) <= 0) continue;
    const d = distance(player, enemy);
    if (d < closestDistance) {
      closestDistance = d;
      closest = enemy;
    }
  }
  return closest ? { enemy: closest, distance: closestDistance } : null;
}

function calculateState(scene, threat) {
  if (!threat || !scene?.player?.active) return ALERT_STATE.CLEAR;
  const { enemy, distance: d } = threat;
  const looking = facingPlayer(enemy, scene.player);
  if (d <= CONFIG.alertRange && looking) return ALERT_STATE.ALERT;
  if (d <= CONFIG.suspiciousRange && looking) return ALERT_STATE.SUSPICIOUS;
  if (scene.enemyAlertState === ALERT_STATE.ALERT && d <= CONFIG.loseRange) return ALERT_STATE.ALERT;
  if (scene.enemyAlertState === ALERT_STATE.SUSPICIOUS && d <= CONFIG.loseRange) return ALERT_STATE.SUSPICIOUS;
  return ALERT_STATE.CLEAR;
}

function applyIndicator(enemy, state) {
  const indicator = enemy?.getData?.('indicator');
  if (!indicator?.active) return;
  indicator.setRadius?.(state === ALERT_STATE.ALERT ? 8 : state === ALERT_STATE.SUSPICIOUS ? 7 : 5);
  indicator.setFillStyle?.(state === ALERT_STATE.ALERT ? 0xff756d : state === ALERT_STATE.SUSPICIOUS ? 0xffd06e : 0xff826e, state === ALERT_STATE.ALERT ? .72 : state === ALERT_STATE.SUSPICIOUS ? .55 : .28);
  indicator.setStrokeStyle?.(1, state === ALERT_STATE.ALERT ? 0xfff0e8 : 0xffd5c5, state === ALERT_STATE.CLEAR ? .7 : .95);
}

function installOnScene(scene, hud) {
  if (!scene || scene.__enemyAlertInstalled || !scene.events?.on) return;
  scene.__enemyAlertInstalled = true;
  scene.enemyAlertState = ALERT_STATE.CLEAR;
  scene.enemyAlertStartedAt = 0;
  scene.enemyAlertLastCue = 0;

  const onUpdate = time => {
    if (!scene.player?.active || scene.finished || scene.respawning) return;
    const threat = nearestThreat(scene);
    const next = calculateState(scene, threat);

    if (next === ALERT_STATE.SUSPICIOUS && scene.enemyAlertState === ALERT_STATE.CLEAR) scene.enemyAlertStartedAt = time;
    const suspiciousReady = next === ALERT_STATE.SUSPICIOUS && time - scene.enemyAlertStartedAt >= CONFIG.buildUpMs;
    const resolved = next === ALERT_STATE.SUSPICIOUS && !suspiciousReady ? ALERT_STATE.CLEAR : next;

    if (resolved !== scene.enemyAlertState) {
      scene.enemyAlertState = resolved;
      const detail = threat ? `${Math.round(threat.distance)}m · ${threat.enemy.getData?.('route')?.type || 'THREAT'}` : '';
      setHud(hud, resolved, detail);
      scene.game?.events?.emit?.('enemy-alert', resolved, threat?.enemy || null);
      if (resolved === ALERT_STATE.ALERT && time - scene.enemyAlertLastCue > CONFIG.cooldownMs) {
        scene.enemyAlertLastCue = time;
        scene.playerCue?.('ALERT · ENEMY HAS YOUR POSITION', '#ff9c91');
        scene.game?.events?.emit?.('feedback', 'warning');
      }
    }

    for (const enemy of getEnemies(scene)) {
      const d = distance(scene.player, enemy);
      const state = d <= CONFIG.alertRange && facingPlayer(enemy, scene.player)
        ? ALERT_STATE.ALERT
        : d <= CONFIG.suspiciousRange && facingPlayer(enemy, scene.player)
          ? ALERT_STATE.SUSPICIOUS
          : ALERT_STATE.CLEAR;
      applyIndicator(enemy, state);
    }
  };

  scene.events.on('update', onUpdate);
  scene.events.once('shutdown', () => {
    scene.events.off?.('update', onUpdate);
    scene.__enemyAlertInstalled = false;
    scene.enemyAlertState = ALERT_STATE.CLEAR;
    scene.enemyAlertStartedAt = 0;
    scene.enemyAlertLastCue = 0;
    setHud(hud, ALERT_STATE.CLEAR);
  });
}

function findRunner() {
  // main.js owns the Phaser instance. We intentionally discover the already-created runner
  // instead of importing Phaser or creating a second game instance.
  const games = globalThis?.Phaser?.GAMES;
  if (Array.isArray(games)) return games[0]?.scene?.getScene?.('runner') || null;
  return null;
}

function boot() {
  installStyle();
  const hud = createHud();
  let lastRunner = null;
  const timer = window.setInterval(() => {
    const runner = findRunner();
    if (runner && runner !== lastRunner) {
      lastRunner = runner;
      installOnScene(runner, hud);
    }
    if (runner && runner.__enemyAlertInstalled) window.clearInterval(timer);
  }, 100);
}

if (typeof window !== 'undefined') boot();
