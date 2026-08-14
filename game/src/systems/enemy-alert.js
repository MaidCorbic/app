import Phaser from 'phaser';

const ALERT_STATE = Object.freeze({ CLEAR: 'CLEAR', SUSPICIOUS: 'SUSPICIOUS', ALERT: 'ALERT' });
const CONFIG = Object.freeze({
  suspiciousRange: 300,
  alertRange: 155,
  loseRange: 390,
  buildUpMs: 520,
  cooldownMs: 1800,
  pulseMs: 360,
});

const STYLE_ID = 'enemy-alert-style';
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
  if (!play || document.getElementById('enemyAlertHud')) return document.getElementById('enemyAlertHud');
  const hud = document.createElement('div');
  hud.id = 'enemyAlertHud';
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
  const label = hud.querySelector('.enemy-alert-label');
  const sub = hud.querySelector('.enemy-alert-detail');
  if (label) label.textContent = state;
  if (sub) sub.textContent = detail || (state === ALERT_STATE.ALERT ? 'ENEMY HAS YOUR POSITION' : 'THREAT NEARBY');
}

function distance(a, b) {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

function facingPlayer(enemy, player) {
  const direction = enemy.flipX ? -1 : 1;
  return (player.x - enemy.x) * direction >= -35;
}

function nearestThreat(scene) {
  const enemies = scene.enemies?.getChildren?.() || [];
  const player = scene.player;
  if (!player?.active) return null;
  let closest = null;
  let closestDistance = Infinity;
  enemies.forEach(enemy => {
    if (!enemy.active || enemy.getData('boss') && enemy.getData('health') <= 0) return;
    const d = distance(player, enemy);
    if (d < closestDistance) { closestDistance = d; closest = enemy; }
  });
  return closest ? { enemy: closest, distance: closestDistance } : null;
}

function stateFor(scene, threat, elapsed) {
  if (!threat) return ALERT_STATE.CLEAR;
  const { enemy, distance: d } = threat;
  if (d <= CONFIG.alertRange && facingPlayer(enemy, scene.player)) return ALERT_STATE.ALERT;
  if (d <= CONFIG.suspiciousRange && facingPlayer(enemy, scene.player)) return ALERT_STATE.SUSPICIOUS;
  if (scene.enemyAlertState === ALERT_STATE.ALERT && d <= CONFIG.loseRange) return ALERT_STATE.ALERT;
  if (scene.enemyAlertState === ALERT_STATE.SUSPICIOUS && d <= CONFIG.loseRange) return ALERT_STATE.SUSPICIOUS;
  return ALERT_STATE.CLEAR;
}

function applyIndicator(enemy, state) {
  const indicator = enemy.getData('indicator');
  if (!indicator?.active) return;
  indicator.setRadius(state === ALERT_STATE.ALERT ? 8 : state === ALERT_STATE.SUSPICIOUS ? 7 : 5);
  indicator.setFillStyle(state === ALERT_STATE.ALERT ? 0xff756d : state === ALERT_STATE.SUSPICIOUS ? 0xffd06e : 0xff826e, state === ALERT_STATE.ALERT ? .72 : state === ALERT_STATE.SUSPICIOUS ? .55 : .28);
  indicator.setStrokeStyle(1, state === ALERT_STATE.ALERT ? 0xfff0e8 : 0xffd5c5, state === ALERT_STATE.CLEAR ? .7 : .95);
}

function installOnScene(scene) {
  if (!scene || scene.__enemyAlertInstalled) return;
  scene.__enemyAlertInstalled = true;
  scene.enemyAlertState = ALERT_STATE.CLEAR;
  scene.enemyAlertStartedAt = 0;
  scene.enemyAlertLastCue = 0;
  const hud = createHud();
  scene.events?.on('update', (time) => {
    if (!scene.player?.active || scene.finished || scene.respawning) return;
    const threat = nearestThreat(scene);
    const next = stateFor(scene, threat, time);
    if (next === ALERT_STATE.SUSPICIOUS && scene.enemyAlertState === ALERT_STATE.CLEAR) {
      scene.enemyAlertStartedAt = time;
    }
    const suspiciousReady = next === ALERT_STATE.SUSPICIOUS && time - scene.enemyAlertStartedAt >= CONFIG.buildUpMs;
    const resolved = next === ALERT_STATE.SUSPICIOUS && !suspiciousReady ? ALERT_STATE.CLEAR : next;
    if (resolved !== scene.enemyAlertState) {
      scene.enemyAlertState = resolved;
      const detail = threat ? `${Math.round(threat.distance)}m · ${threat.enemy.getData('route')?.type || 'THREAT'}` : '';
      setHud(hud, resolved, detail);
      scene.game?.events?.emit('enemy-alert', resolved, threat?.enemy || null);
      if (resolved === ALERT_STATE.ALERT && time - scene.enemyAlertLastCue > CONFIG.cooldownMs) {
        scene.enemyAlertLastCue = time;
        scene.playerCue?.('ALERT · ENEMY HAS YOUR POSITION', '#ff9c91');
        scene.game?.events?.emit('feedback', 'warning');
      }
    }
    const enemies = scene.enemies?.getChildren?.() || [];
    enemies.forEach(enemy => {
      if (!enemy.active) return;
      let localState = ALERT_STATE.CLEAR;
      const d = distance(scene.player, enemy);
      if (d <= CONFIG.alertRange && facingPlayer(enemy, scene.player)) localState = ALERT_STATE.ALERT;
      else if (d <= CONFIG.suspiciousRange && facingPlayer(enemy, scene.player)) localState = ALERT_STATE.SUSPICIOUS;
      applyIndicator(enemy, localState);
    });
  });
  scene.events?.once('shutdown', () => { scene.__enemyAlertInstalled = false; scene.enemyAlertState = ALERT_STATE.CLEAR; setHud(hud, ALERT_STATE.CLEAR); });
}

function boot() {
  if (typeof document === 'undefined') return;
  installStyle();
  createHud();
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const game = Phaser.GAMES?.[0];
    const runner = game?.scene?.getScene?.('runner');
    if (runner) installOnScene(runner);
    if (attempts > 120) window.clearInterval(timer);
  }, 250);
}

boot();
