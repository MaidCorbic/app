const ALERT_STATE = Object.freeze({
  CLEAR: 'CLEAR',
  SUSPICIOUS: 'SUSPICIOUS',
  ALERT: 'ALERT'
});

const CONFIG = Object.freeze({
  suspiciousRange: 300,
  alertRange: 155,
  loseRange: 390,
  buildUpMs: 520,
  cooldownMs: 1800,
  alertHoldMs: 900
});

const STYLE_ID = 'enemy-alert-style';
const HUD_ID = 'enemyAlertHud';

const STYLE = `
.enemy-alert-hud{
  position:absolute;
  left:50%;
  top:74px;
  transform:translateX(-50%);
  z-index:25;
  display:flex;
  align-items:center;
  gap:8px;
  padding:7px 11px;
  border:1px solid rgba(150,190,255,.18);
  border-radius:999px;
  background:rgba(6,14,28,.78);
  backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);
  font:700 9px/1 "DM Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  letter-spacing:.14em;
  pointer-events:none;
  opacity:0;
  transition:
    opacity .18s ease,
    transform .18s ease,
    box-shadow .18s ease;
}

.enemy-alert-hud.is-visible{
  opacity:1;
}

.enemy-alert-hud.is-suspicious{
  border-color:rgba(255,208,110,.4);
  box-shadow:
    0 0 14px rgba(255,208,110,.08);
}

.enemy-alert-hud.is-alert{
  border-color:rgba(255,117,109,.6);
  box-shadow:
    0 0 18px rgba(255,117,109,.14),
    0 0 32px rgba(255,117,109,.06);
}

.enemy-alert-dot{
  width:7px;
  height:7px;
  flex:0 0 auto;
  border-radius:50%;
  background:#8df4ff;
  box-shadow:0 0 8px currentColor;
}

.enemy-alert-hud.is-suspicious .enemy-alert-dot{
  background:#ffd06e;
}

.enemy-alert-hud.is-alert .enemy-alert-dot{
  background:#ff756d;
  animation:enemyAlertDotPulse .8s ease-in-out infinite alternate;
}

.enemy-alert-label{
  white-space:nowrap;
}

.enemy-alert-detail{
  opacity:.58;
  font-size:8px;
  letter-spacing:.08em;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  max-width:220px;
}

@keyframes enemyAlertDotPulse{
  from{
    transform:scale(.9);
    opacity:.72;
  }

  to{
    transform:scale(1.2);
    opacity:1;
  }
}

@media(max-width:700px){
  .enemy-alert-hud{
    top:68px;
    max-width:calc(100vw - 24px);
    padding:7px 10px;
    font-size:8px;
  }

  .enemy-alert-detail{
    display:none;
  }
}

@media(prefers-reduced-motion:reduce){
  .enemy-alert-hud{
    transition:none;
  }

  .enemy-alert-hud.is-alert .enemy-alert-dot{
    animation:none;
  }
}
`;

function installStyle() {
  if (
    typeof document === 'undefined' ||
    document.getElementById(STYLE_ID)
  ) {
    return;
  }

  const style = document.createElement('style');

  style.id = STYLE_ID;
  style.textContent = STYLE;

  document.head.appendChild(style);
}

function createHud() {
  const play = document.getElementById('play');

  if (!play) {
    return null;
  }

  let hud = document.getElementById(HUD_ID);

  if (hud) {
    return hud;
  }

  hud = document.createElement('div');
  hud.id = HUD_ID;
  hud.className = 'enemy-alert-hud';

  hud.innerHTML = `
    <span class="enemy-alert-dot"></span>
    <span class="enemy-alert-label">CLEAR</span>
    <span class="enemy-alert-detail">NO THREATS DETECTED</span>
  `;

  play.appendChild(hud);

  return hud;
}

function setHud(hud, state, detail = '') {
  if (!hud) {
    return;
  }

  const isSuspicious =
    state === ALERT_STATE.SUSPICIOUS;

  const isAlert =
    state === ALERT_STATE.ALERT;

  hud.classList.toggle(
    'is-visible',
    state !== ALERT_STATE.CLEAR
  );

  hud.classList.toggle(
    'is-suspicious',
    isSuspicious
  );

  hud.classList.toggle(
    'is-alert',
    isAlert
  );

  const label =
    hud.querySelector('.enemy-alert-label');

  const sub =
    hud.querySelector('.enemy-alert-detail');

  if (label) {
    label.textContent = state;
  }

  if (sub) {
    sub.textContent =
      detail ||
      (
        isAlert
          ? 'ENEMY HAS YOUR POSITION'
          : isSuspicious
            ? 'THREAT NEARBY'
            : 'NO THREATS DETECTED'
      );
  }
}

function distance(a, b) {
  return Math.hypot(
    (a?.x || 0) - (b?.x || 0),
    (a?.y || 0) - (b?.y || 0)
  );
}

function facingPlayer(enemy, player) {
  if (!enemy || !player) {
    return false;
  }

  const dx =
    (player.x || 0) -
    (enemy.x || 0);

  const direction =
    enemy.flipX
      ? -1
      : 1;

  return dx * direction >= 35;
}

function getEnemies(scene) {
  try {
    return (
      scene?.enemies
        ?.getChildren?.()
        ?.filter(enemy => enemy?.active) ||
      []
    );
  } catch {
    return [];
  }
}

function nearestThreat(scene) {
  const player = scene?.player;

  if (!player?.active) {
    return null;
  }

  let best = null;
  let bestScore = Infinity;

  for (const enemy of getEnemies(scene)) {
    if (
      enemy.getData?.('boss') &&
      Number(enemy.getData?.('health')) <= 0
    ) {
      continue;
    }

    const d = distance(
      player,
      enemy
    );

    if (!Number.isFinite(d)) {
      continue;
    }

    if (d > CONFIG.loseRange) {
      continue;
    }

    const direction =
      enemy.flipX
        ? -1
        : 1;

    const dx =
      (player.x || 0) -
      (enemy.x || 0);

    const facing =
      dx * direction >= 35;

    const score =
      d -
      (facing ? 60 : 0) -
      (enemy.getData?.('boss') ? 20 : 0);

    if (score < bestScore) {
      bestScore = score;
      best = enemy;
    }
  }

  if (!best) {
    return null;
  }

  return {
    enemy: best,
    distance: distance(
      player,
      best
    )
  };
}

function calculateState(scene, threat) {
  if (
    !threat ||
    !scene?.player?.active
  ) {
    return ALERT_STATE.CLEAR;
  }

  const {
    enemy,
    distance: d
  } = threat;

  const looking =
    facingPlayer(
      enemy,
      scene.player
    );

  if (
    d <= CONFIG.alertRange &&
    looking
  ) {
    return ALERT_STATE.ALERT;
  }

  if (
    d <= CONFIG.suspiciousRange &&
    looking
  ) {
    return ALERT_STATE.SUSPICIOUS;
  }

  if (
    scene.enemyAlertState === ALERT_STATE.ALERT &&
    d <= CONFIG.loseRange
  ) {
    return ALERT_STATE.ALERT;
  }

  return ALERT_STATE.CLEAR;
}

function applyIndicator(enemy, state) {
  const indicator =
    enemy?.getData?.('indicator');

  if (!indicator?.active) {
    return;
  }

  const isAlert =
    state === ALERT_STATE.ALERT;

  const isSuspicious =
    state === ALERT_STATE.SUSPICIOUS;

  const radius =
    isAlert
      ? 9
      : isSuspicious
        ? 7
        : 5;

  const fillColor =
    isAlert
      ? 0xff756d
      : isSuspicious
        ? 0xffd06e
        : 0xff826e;

  const fillAlpha =
    isAlert
      ? .82
      : isSuspicious
        ? .55
        : .20;

  const strokeColor =
    isAlert
      ? 0xfff0e8
      : isSuspicious
        ? 0xffd5a0
        : 0xffb9a8;

  const strokeAlpha =
    isAlert
      ? 1
      : isSuspicious
        ? .9
        : .55;

  indicator.setRadius?.(
    radius
  );

  indicator.setFillStyle?.(
    fillColor,
    fillAlpha
  );

  indicator.setStrokeStyle?.(
    1,
    strokeColor,
    strokeAlpha
  );
}

function installOnScene(scene, hud) {
  if (
    !scene ||
    scene.__enemyAlertInstalled ||
    !scene.events?.on
  ) {
    return;
  }

  scene.__enemyAlertInstalled = true;

  scene.enemyAlertState =
    ALERT_STATE.CLEAR;

  scene.enemyAlertStartedAt =
    0;

  scene.enemyAlertLastCue =
    0;

  scene.enemyAlertLastSeenAt =
    0;

  const onUpdate = time => {
    if (
      !scene.player?.active ||
      scene.finished ||
      scene.respawning
    ) {
      return;
    }

    const threat =
      nearestThreat(scene);

    const next =
      calculateState(
        scene,
        threat
      );

    if (
      next === ALERT_STATE.SUSPICIOUS &&
      scene.enemyAlertState === ALERT_STATE.CLEAR
    ) {
      scene.enemyAlertStartedAt =
        time;
    }

    if (
      next === ALERT_STATE.CLEAR
    ) {
      scene.enemyAlertStartedAt =
        0;
    }

    const suspiciousReady =
      next === ALERT_STATE.SUSPICIOUS &&
      time - scene.enemyAlertStartedAt >=
        CONFIG.buildUpMs;

    if (
      next === ALERT_STATE.ALERT ||
      next === ALERT_STATE.SUSPICIOUS
    ) {
      scene.enemyAlertLastSeenAt =
        time;
    }

    let resolved =
      next;

    if (
      next === ALERT_STATE.SUSPICIOUS &&
      !suspiciousReady
    ) {
      resolved =
        ALERT_STATE.CLEAR;
    }

    if (
      next === ALERT_STATE.CLEAR &&
      scene.enemyAlertState === ALERT_STATE.ALERT &&
      time - scene.enemyAlertLastSeenAt <
        CONFIG.alertHoldMs
    ) {
      resolved =
        ALERT_STATE.ALERT;
    }

    if (
      resolved !== scene.enemyAlertState
    ) {
      scene.enemyAlertState =
        resolved;

      if (
        resolved === ALERT_STATE.CLEAR
      ) {
        scene.enemyAlertLastSeenAt =
          0;

        scene.enemyAlertLastCue =
          0;
      }

      const detail =
        threat
          ? `${Math.max(
              0,
              Math.round(
                threat.distance
              )
            )}m · ${
              threat.enemy.getData?.(
                'route'
              )?.type || 'THREAT'
            }`
          : 'CONTACT LOST · SEARCHING';

      setHud(
        hud,
        resolved,
        detail
      );

      scene.game?.events?.emit?.(
        'enemy-alert',
        resolved,
        threat?.enemy || null
      );

      if (
        resolved === ALERT_STATE.ALERT &&
        time - scene.enemyAlertLastCue >=
          CONFIG.cooldownMs
      ) {
        scene.enemyAlertLastCue =
          time;

        scene.playerCue?.(
          'DETECTED · ENEMY HAS YOUR POSITION',
          '#ff9c91'
        );

        scene.game?.events?.emit?.(
          'feedback',
          'warning'
        );
      }
    }

    for (const enemy of getEnemies(scene)) {
      const d =
        distance(
          scene.player,
          enemy
        );

      const looking =
        facingPlayer(
          enemy,
          scene.player
        );

      const state =
        d <= CONFIG.alertRange &&
        looking
          ? ALERT_STATE.ALERT
          : d <= CONFIG.suspiciousRange &&
            looking
            ? ALERT_STATE.SUSPICIOUS
            : ALERT_STATE.CLEAR;

      const previousState =
        enemy.getData?.(
          'enemyAlertVisualState'
        );

      if (
        previousState !== state
      ) {
        enemy.setData?.(
          'enemyAlertVisualState',
          state
        );

        applyIndicator(
          enemy,
          state
        );
      }
    }
  };

  scene.events.on(
    'update',
    onUpdate
  );

  scene.events.once(
    'shutdown',
    () => {
      scene.events.off?.(
        'update',
        onUpdate
      );

      scene.__enemyAlertInstalled =
        false;

      scene.enemyAlertState =
        ALERT_STATE.CLEAR;

      scene.enemyAlertStartedAt =
        0;

      scene.enemyAlertLastCue =
        0;

      scene.enemyAlertLastSeenAt =
        0;

      setHud(
        hud,
        ALERT_STATE.CLEAR
      );
    }
  );
}

function findRunner() {
  const game =
    window.relayGame;

  return (
    game?.scene
      ?.getScene?.('runner') ||
    null
  );
}

function boot() {
  installStyle();

  let attempts = 0;

  const timer =
    window.setInterval(() => {
      attempts += 1;

      const runner =
        findRunner();

      const hud =
        createHud();

      if (
        runner &&
        hud
      ) {
        installOnScene(
          runner,
          hud
        );

        if (
          runner.__enemyAlertInstalled
        ) {
          window.clearInterval(
            timer
          );
        }
      }

      if (attempts >= 100) {
        window.clearInterval(
          timer
        );
      }
    }, 100);
}

if (
  typeof window !== 'undefined'
) {
  boot();
}
