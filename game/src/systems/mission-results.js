
import { loadState } from '../state.js';

const RESULT_CLASS = 'mission-results-panel';

const style = `
/* ============================================================
   MISSION RESULTS — FINAL
   ============================================================ */

@keyframes finishPanelIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(.985);
    filter: brightness(.85);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: brightness(1);
  }
}

/* ============================================================
   FINISH SCREEN
   ============================================================ */

#finish {
  z-index: 70 !important;
  background:
    radial-gradient(
      circle at 50% 24%,
      rgba(255,208,110,.08),
      rgba(3,8,16,.96) 48%,
      rgba(1,4,9,.99)
    ) !important;

  overflow: auto !important;
  box-sizing: border-box;
}

#finish:not(.hidden) .outcome {
  position: relative;
  z-index: 71;

  width: min(820px, calc(100vw - 28px)) !important;
  max-height: calc(100dvh - 28px) !important;

  margin: auto;

  padding: clamp(20px, 4vw, 34px) !important;

  box-sizing: border-box;

  overflow: auto;

  border: 1px solid rgba(255,208,110,.24) !important;
  border-radius: 16px !important;

  background:
    linear-gradient(
      145deg,
      rgba(9,18,30,.985),
      rgba(3,8,15,.99) 62%,
      rgba(10,14,20,.985)
    ) !important;

  box-shadow:
    0 30px 90px rgba(0,0,0,.60),
    0 0 55px rgba(255,208,110,.065),
    inset 0 1px 0 rgba(255,255,255,.045) !important;

  animation:
    finishPanelIn .32s ease-out both;
}

/* ============================================================
   FINISH TITLE / EYEBROW
   ============================================================ */

#finish .outcome-mark {
  display: grid !important;
  place-items: center !important;

  width: 46px !important;
  height: 46px !important;

  margin: 0 auto 12px !important;

  border: 1px solid rgba(255,208,110,.42) !important;
  border-radius: 12px !important;

  background:
    linear-gradient(
      145deg,
      rgba(255,208,110,.14),
      rgba(255,208,110,.04)
    ) !important;

  color: #fff0b5 !important;

  font-size: 22px !important;
  line-height: 1 !important;

  box-shadow:
    0 0 22px rgba(255,208,110,.10),
    inset 0 1px 0 rgba(255,255,255,.06) !important;
}

#finish .outcome > h1,
#finish .outcome > h2,
#finish .outcome .title {
  margin: 8px 0 14px !important;

  color: #fff0b5 !important;

  text-align: center !important;

  font-size: clamp(38px, 5vw, 64px) !important;
  line-height: .94 !important;

  letter-spacing: .10em !important;

  text-shadow:
    0 0 8px rgba(255,208,110,.18),
    0 0 22px rgba(255,208,110,.12);

  overflow-wrap: anywhere;
}

#finish .outcome > .eyebrow {
  margin: 0 0 10px !important;

  text-align: center !important;

  font-size: 13px;
  line-height: 1.2;
  font-weight: 800;

  letter-spacing: .22em;
  text-transform: uppercase;

  opacity: .82;
}

/* ============================================================
   FINISH DESCRIPTION
   ============================================================ */

#finish #finishLine {
  width: min(100%, 600px) !important;

  margin: 0 auto 18px !important;

  color: #9eabb8 !important;

  text-align: center !important;

  font-size: 13px !important;
  line-height: 1.5 !important;

  letter-spacing: .035em !important;

  overflow-wrap: anywhere;
}

/* ============================================================
   XP REWARD
   ============================================================ */

#finish .reward {
  width: min(100%, 600px);

  margin: 12px auto 18px !important;

  padding: 12px 14px 14px !important;

  box-sizing: border-box;

  border-top: 1px solid rgba(255,208,110,.10);
  border-bottom: 1px solid rgba(255,208,110,.10);

  text-align: center;
}

#finish .reward > b {
  display: block;

  margin: 0 0 5px !important;

  color: #fff0b5 !important;

  font-size: clamp(34px, 4vw, 52px) !important;
  line-height: 1 !important;

  font-weight: 900;

  letter-spacing: .04em;

  text-shadow:
    0 0 14px rgba(255,208,110,.20),
    0 0 30px rgba(255,208,110,.08);
}

#finish .reward > span {
  display: block;

  margin: 0 !important;

  color: #8c99a7 !important;

  font-size: 10px !important;
  line-height: 1.2 !important;

  font-weight: 800;

  letter-spacing: .18em;

  text-transform: uppercase;
}

/* ============================================================
   LEGACY SUMMARY
   ============================================================ */

#finish .finish-summary {
  display: none !important;
}

/* Preserve the class structure without rendering the legacy block. */
#finish .finish-summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 24px;

  min-height: 30px;
}

#finish .finish-summary-line strong {
  flex: 0 0 auto;

  font-size: 11px;
  line-height: 1.2;

  font-weight: 800;

  letter-spacing: .14em;

  white-space: nowrap;

  opacity: .72;
}

#finish .finish-summary-line i,
#finish .finish-summary-line small {
  flex: 1 1 auto;

  min-width: 0;

  font-size: 12px;
  line-height: 1.35;

  text-align: right;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============================================================
   MISSION RESULTS GRID
   ============================================================ */

#finish .${RESULT_CLASS} {
  width: min(100%, 680px);

  margin: 16px auto 18px;

  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 10px;

  text-align: left;
}

/* ============================================================
   RESULT CARD
   ============================================================ */

#finish .${RESULT_CLASS} .mission-result-card {
  position: relative;

  min-width: 0;
  min-height: 76px;

  padding: 13px 14px;

  box-sizing: border-box;

  border: 1px solid rgba(255,208,110,.16);
  border-radius: 12px;

  background:
    linear-gradient(
      145deg,
      rgba(10,18,29,.92),
      rgba(4,10,17,.96)
    );

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 10px 24px rgba(0,0,0,.22);

  overflow: hidden;
}

#finish .${RESULT_CLASS} .mission-result-card::after {
  content: "";

  position: absolute;

  left: 0;
  top: 0;
  bottom: 0;

  width: 2px;

  background: rgba(255,208,110,.42);

  box-shadow:
    0 0 12px rgba(255,208,110,.12);

  pointer-events: none;
}

#finish .${RESULT_CLASS} .mission-result-label {
  display: block;

  margin-bottom: 7px;

  color: #8d98a3;

  font-size: 8px;
  line-height: 1;

  font-weight: 800;

  letter-spacing: .16em;

  text-transform: uppercase;
}

#finish .${RESULT_CLASS} .mission-result-value {
  display: block;

  min-width: 0;

  color: #f4f7fa;

  font-size: 20px;
  line-height: 1;

  font-weight: 900;

  letter-spacing: .03em;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#finish .${RESULT_CLASS} .mission-result-sub {
  display: block;

  margin-top: 6px;

  min-width: 0;

  color: #687684;

  font-size: 8px;
  line-height: 1.2;

  letter-spacing: .08em;

  text-transform: uppercase;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#finish .${RESULT_CLASS} .mission-result-wide {
  grid-column: span 2;
}

/* ============================================================
   PERFORMANCE CARD
   ============================================================ */

#finish .${RESULT_CLASS} .mission-result-performance {
  border-color: rgba(255,208,110,.34);

  background:
    linear-gradient(
      145deg,
      rgba(255,208,110,.09),
      rgba(8,18,31,.94) 55%,
      rgba(4,10,17,.96)
    );

  box-shadow:
    0 0 22px rgba(255,208,110,.08),
    inset 0 1px 0 rgba(255,255,255,.05);
}

#finish .${RESULT_CLASS} .mission-result-performance::after {
  background: #ffd06e;

  box-shadow:
    0 0 14px rgba(255,208,110,.24),
    0 0 28px rgba(255,208,110,.08);
}

#finish .${RESULT_CLASS} .mission-result-performance .mission-result-label {
  color: #d5b568;
}

#finish .${RESULT_CLASS} .mission-result-performance .mission-result-value {
  color: #fff0b5;

  text-shadow:
    0 0 10px rgba(255,208,110,.24),
    0 0 24px rgba(255,208,110,.10);
}

/* ============================================================
   TOTAL CARD
   ============================================================ */

#finish .${RESULT_CLASS} .mission-result-total {
  border-color: rgba(255,208,110,.30);

  background:
    linear-gradient(
      145deg,
      rgba(255,208,110,.07),
      rgba(8,18,31,.92)
    );

  box-shadow:
    0 0 24px rgba(255,208,110,.12),
    inset 0 1px 0 rgba(255,255,255,.05);
}

#finish .${RESULT_CLASS} .mission-result-total .mission-result-label {
  color: #f7d98a;

  opacity: .82;
}

#finish .${RESULT_CLASS} .mission-result-total .mission-result-value {
  color: #fff0b5;

  text-shadow:
    0 0 10px rgba(255,208,110,.22),
    0 0 22px rgba(255,208,110,.10);
}

/* ============================================================
   FINISH ACTIONS
   ============================================================ */

#finish .finish-actions {
  width: min(680px, 100%);

  margin: 18px auto 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1.15fr);

  gap: 10px;

  align-items: stretch;
}

#finish .outcome .primary {
  position: relative;
  z-index: 72;

  touch-action: manipulation;
}

#finish #again,
#finish #nextMission {
  position: relative;
  z-index: 72;

  box-sizing: border-box;

  width: 100% !important;
  min-height: 54px;

  margin: 0 !important;

  padding: 11px 18px !important;

  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 9px;

  border-radius: 11px !important;

  font-family: inherit;

  font-size: 11px;
  line-height: 1;

  font-weight: 900;

  letter-spacing: .10em;

  text-transform: uppercase;

  cursor: pointer;

  touch-action: manipulation;

  user-select: none;

  transition:
    transform .14s ease,
    border-color .14s ease,
    background .14s ease,
    box-shadow .14s ease,
    filter .14s ease;
}

#finish #again {
  color: #f7d98a !important;

  border: 1px solid rgba(255,208,110,.34) !important;

  background:
    linear-gradient(
      145deg,
      rgba(255,208,110,.09),
      rgba(255,208,110,.025)
    ) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 10px 24px rgba(0,0,0,.22);
}

#finish #again::before {
  content: "↻";

  position: static;

  font-size: 18px;
  line-height: 1;

  opacity: .95;
}

#finish #nextMission {
  color: #fff4cf !important;

  border: 1px solid rgba(255,208,110,.72) !important;

  background:
    linear-gradient(
      145deg,
      rgba(255,208,110,.22),
      rgba(114,76,20,.18)
    ) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 12px 28px rgba(0,0,0,.28),
    0 0 22px rgba(255,208,110,.10);
}

#finish #nextMission::after {
  content: "→";

  font-size: 19px;
  line-height: 1;

  opacity: .95;
}

/* ============================================================
   ACTION HOVER / FOCUS
   ============================================================ */

#finish #again:hover,
#finish #again:focus-visible {
  transform: translateY(-2px);

  border-color:
    rgba(255,208,110,.66) !important;

  background:
    linear-gradient(
      145deg,
      rgba(255,208,110,.16),
      rgba(255,208,110,.045)
    ) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    0 14px 30px rgba(0,0,0,.30),
    0 0 24px rgba(255,208,110,.10);

  outline: none;
}

#finish #nextMission:hover,
#finish #nextMission:focus-visible {
  transform: translateY(-2px);

  border-color: #ffd06e !important;

  background:
    linear-gradient(
      145deg,
      rgba(255,208,110,.32),
      rgba(114,76,20,.24)
    ) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.07),
    0 16px 34px rgba(0,0,0,.34),
    0 0 32px rgba(255,208,110,.20),
    0 0 56px rgba(255,208,110,.08);

  outline: none;
}

#finish #again:active,
#finish #nextMission:active {
  transform: translateY(0) scale(.985);
}

#finish #again b,
#finish #nextMission b {
  display: none;
}

/* ============================================================
   RETURN TO TERMINAL
   ============================================================ */

#finish #finishTitle {
  display: block;

  margin: 12px auto 0 !important;
  padding: 7px 12px !important;

  border: 0 !important;

  background: transparent !important;

  color: #7f8b98 !important;

  font-family: inherit;

  font-size: 8px;
  line-height: 1;

  font-weight: 800;

  letter-spacing: .16em;

  text-transform: uppercase;

  cursor: pointer;

  touch-action: manipulation;

  transition:
    color .14s ease,
    transform .14s ease;
}

#finish #finishTitle:hover,
#finish #finishTitle:focus-visible {
  color: #d8e3eb !important;

  transform: translateY(-1px);

  outline: none;
}

/* ============================================================
   MOBILE
   ============================================================ */

@media (max-width: 700px) {

  #finish:not(.hidden) .outcome {
    width: calc(100vw - 18px) !important;
    max-height: calc(100dvh - 18px) !important;

    padding: 18px 14px !important;

    border-radius: 14px !important;
  }

  #finish .outcome-mark {
    width: 42px !important;
    height: 42px !important;

    margin-bottom: 10px !important;

    border-radius: 11px !important;

    font-size: 20px !important;
  }

  #finish .outcome > h1,
  #finish .outcome > h2,
  #finish .outcome .title {
    font-size:
      clamp(32px, 10vw, 46px) !important;

    margin-bottom: 10px !important;

    letter-spacing: .07em !important;
  }

  #finish .outcome > .eyebrow {
    font-size: 10px;

    letter-spacing: .18em;
  }

  #finish #finishLine {
    width: 100% !important;

    margin-bottom: 10px !important;

    font-size: 12px !important;

    line-height: 1.45 !important;
  }

  #finish .reward {
    margin-top: 8px !important;
    margin-bottom: 12px !important;

    padding: 10px 10px 12px !important;
  }

  #finish .reward > b {
    font-size:
      clamp(32px, 9vw, 44px) !important;
  }

  #finish .reward > span {
    font-size: 9px !important;

    letter-spacing: .14em;
  }

  #finish .${RESULT_CLASS} {
    width: 100%;

    margin: 12px auto;

    gap: 7px;
  }

  #finish .${RESULT_CLASS} .mission-result-card {
    min-height: 70px;

    padding: 11px 10px;

    border-radius: 10px;
  }

  #finish .${RESULT_CLASS} .mission-result-label {
    margin-bottom: 6px;

    font-size: 7px;

    letter-spacing: .13em;
  }

  #finish .${RESULT_CLASS} .mission-result-value {
    font-size: 17px;
  }

  #finish .${RESULT_CLASS} .mission-result-sub {
    margin-top: 5px;

    font-size: 7px;

    letter-spacing: .06em;
  }

  #finish .finish-actions {
    width: 100%;

    margin-top: 14px;

    grid-template-columns:
      repeat(2, minmax(0, 1fr));

    gap: 8px;
  }

  #finish #again,
  #finish #nextMission {
    min-height: 52px;

    padding: 10px 11px !important;

    font-size: 10px;

    letter-spacing: .07em;
  }

  #finish #again::before,
  #finish #nextMission::after {
    font-size: 16px;
  }

  #finish #finishTitle {
    margin-top: 9px !important;
  }
}

/* ============================================================
   VERY SMALL MOBILE
   ============================================================ */

@media (max-width: 430px) {

  #finish:not(.hidden) .outcome {
    width: calc(100vw - 12px) !important;

    max-height: calc(100dvh - 12px) !important;

    padding:
      16px 10px 14px !important;

    border-radius: 12px !important;
  }

  #finish .outcome > h1,
  #finish .outcome > h2,
  #finish .outcome .title {
    font-size:
      clamp(29px, 11vw, 40px) !important;

    letter-spacing: .055em !important;
  }

  #finish .${RESULT_CLASS} {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  #finish .${RESULT_CLASS} .mission-result-wide {
    grid-column: span 1;
  }

  #finish .${RESULT_CLASS} .mission-result-card {
    min-height: 66px;
  }

  #finish .finish-actions {
    grid-template-columns: 1fr;

    gap: 7px;
  }

  #finish #again,
  #finish #nextMission {
    width: 100% !important;

    min-height: 50px;

    padding:
      10px 12px !important;
  }

  #finish #finishTitle {
    margin-top: 8px !important;
  }
}
`;

export const formatResultTime = ms => {
  const value = Number(ms);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return '--:--.--';
  }

  const minutes =
    Math.floor(value / 60000);

  const seconds =
    Math.floor(value / 1000) % 60;

  const tenths =
    Math.floor(
      (value % 1000) / 100
    );

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
};

export const resultGrade = ratingText => {
  const text =
    String(
      ratingText || ''
    ).toUpperCase();

  if (
    /\bS\+\b|\bS\b|★★★|3\/3|3 STARS/.test(
      text
    )
  ) {
    return text.includes('S+')
      ? 'S+'
      : 'S';
  }

  if (
    /\bA\b|★★|2\/3|2 STARS/.test(
      text
    )
  ) {
    return 'A';
  }

  if (
    /\bB\b|★|1\/3|1 STAR/.test(
      text
    )
  ) {
    return 'B';
  }

  return 'C';
};

const escapeHtml = value =>
  String(value ?? '').replace(
    /[&<>"']/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]
  );

const number = value =>
  Number.isFinite(Number(value))
    ? Number(value).toLocaleString()
    : '0';

const integer = value =>
  Number.isFinite(Number(value))
    ? Math.max(
        0,
        Math.floor(Number(value))
      )
    : 0;

function installStyle() {
  if (
    document.getElementById(
      'mission-results-style'
    )
  ) {
    return;
  }

  const element =
    document.createElement(
      'style'
    );

  element.id =
    'mission-results-style';

  element.textContent =
    style;

  document.head.appendChild(
    element
  );
}

function latestRouteAchievement(
  state
) {
  return [
    ...(state.achievements || [])
  ]
    .reverse()
    .find(id =>
      String(id).startsWith(
        'route-'
      )
    )
    ?.slice(6) || null;
}

function getPerformanceResult() {
  const result =
    window
      .__missionFlowPerformanceV1
      ?.latest;

  if (
    !result?.completed
  ) {
    return null;
  }

  return result;
}

function polishFinishActions() {
  const again =
    document.getElementById(
      'again'
    );

  const next =
    document.getElementById(
      'nextMission'
    );

  if (again) {
    again.classList.add(
      'finish-replay-action'
    );

    again.setAttribute(
      'aria-label',
      'Replay this mission'
    );

    again.innerHTML =
      'REPLAY RUN <b aria-hidden="true">↻</b>';
  }

  if (next) {
    next.classList.add(
      'finish-next-action'
    );

    next.setAttribute(
      'aria-label',
      'Continue to the next mission'
    );

    next.innerHTML =
      'NEXT MISSION <b aria-hidden="true">→</b>';
  }
}

export function buildMissionResults() {
  const finish =
    document.getElementById(
      'finish'
    );

  if (
    !finish ||
    finish.classList.contains(
      'hidden'
    )
  ) {
    return;
  }

  installStyle();
  polishFinishActions();

  const state =
    loadState() || {};

  const breakdown =
    state.lastXpBreakdown || {};

  const performance =
    getPerformanceResult();

  const existingRatingText =
    document.getElementById(
      'finishRating'
    )?.textContent || '';

  const grade =
    performance?.rating ||
    resultGrade(
      existingRatingText
    );

  const score =
    document.getElementById(
      'runScore'
    )?.textContent || '0';

  const time =
    performance?.raw?.elapsedMs > 0
      ? formatResultTime(
          performance.raw.elapsedMs
        )
      : (
          document.getElementById(
            'runTime'
          )?.textContent ||
          document.getElementById(
            'finishTime'
          )?.textContent ||
          ''
        );

  const collectedSignals =
    performance?.raw
      ? integer(
          performance.raw.signals
        )
      : integer(
          document
            .getElementById(
              'signalTotal'
            )
            ?.textContent
            ?.match(/\d+/)
            ?.[0]
        );

  const totalSignals =
    integer(
      performance?.raw
        ?.totalSignals
    );

  const signalText =
    totalSignals > 0
      ? `${collectedSignals} / ${totalSignals}`
      : (
          document.getElementById(
            'finishSignals'
          )?.textContent ||
          '0'
        );

  const cleanRoute =
    latestRouteAchievement(
      state
    );

  const clean =
    Boolean(
      cleanRoute &&
      state.achievements?.includes(
        `clean-${cleanRoute}`
      )
    );

  const bonusTotal =
    integer(
      breakdown.signals
    ) +
    integer(
      breakdown.secrets
    ) +
    integer(
      breakdown.optional
    ) +
    integer(
      breakdown.streak
    ) +
    integer(
      breakdown.package
    ) +
    integer(
      breakdown.modifier
    ) +
    integer(
      breakdown.contract
    ) +
    integer(
      breakdown.campaign
    ) +
    integer(
      breakdown.rival
    );

  const existing =
    finish.querySelector(
      `.${RESULT_CLASS}`
    );

  if (existing) {
    existing.remove();
  }

  const panel =
    document.createElement(
      'div'
    );

  panel.className =
    RESULT_CLASS;

  panel.setAttribute(
    'aria-label',
    'Mission results'
  );

  const performanceScore =
    performance
      ? `${integer(performance.score)} / 100`
      : '--';

  const performanceSub =
    performance?.metrics
      ? [
          `SPEED ${performance.metrics.speed}`,
          `SIGNALS ${performance.metrics.signals}`,
          `ROUTE ${performance.metrics.route}`,
          `SURVIVAL ${performance.metrics.survival}`
        ].join(' · ')
      : 'PERFORMANCE DATA NOT AVAILABLE';

  const totalXp =
    integer(
      breakdown.total
    );

  const credits =
    integer(
      breakdown.credits
    );

  panel.innerHTML = `
    <div class="mission-result-card mission-result-performance">
      <span class="mission-result-label">
        GRADE
      </span>

      <b class="mission-result-value">
        ${escapeHtml(grade)}
      </b>

      <small class="mission-result-sub">
        PERFORMANCE QUALITY
      </small>
    </div>

    <div class="mission-result-card">
      <span class="mission-result-label">
        TIME
      </span>

      <b class="mission-result-value">
        ${escapeHtml(
          time || '--:--.--'
        )}
      </b>

      <small class="mission-result-sub">
        FINISH TIME
      </small>
    </div>

    <div class="mission-result-card">
      <span class="mission-result-label">
        SIGNALS
      </span>

      <b class="mission-result-value">
        ${escapeHtml(
          signalText
        )}
      </b>

      <small class="mission-result-sub">
        COLLECTED
      </small>
    </div>

    <div class="mission-result-card">
      <span class="mission-result-label">
        RUN SCORE
      </span>

      <b class="mission-result-value">
        ${escapeHtml(score)}
      </b>

      <small class="mission-result-sub">
        EXISTING GAME SCORE
      </small>
    </div>

    <div class="mission-result-card mission-result-performance mission-result-wide">
      <span class="mission-result-label">
        PERFORMANCE SCORE
      </span>

      <b class="mission-result-value">
        ${escapeHtml(
          performanceScore
        )}
      </b>

      <small class="mission-result-sub">
        ${escapeHtml(
          performanceSub
        )}
      </small>
    </div>

    <div class="mission-result-card mission-result-wide">
      <span class="mission-result-label">
        BONUSES
      </span>

      <b class="mission-result-value">
        +${number(
          bonusTotal
        )} XP
      </b>

      <small class="mission-result-sub">
        ${
          clean
            ? 'CLEAN RUN BONUS INCLUDED'
            : 'BONUSES FROM THIS RUN'
        }
      </small>
    </div>

    <div class="mission-result-card mission-result-total mission-result-wide">
      <span class="mission-result-label">
        TOTAL REWARD
      </span>

      <b class="mission-result-value">
        +${number(
          totalXp
        )} XP · +${number(
          credits
        )} CREDITS
      </b>

      <small class="mission-result-sub">
        PERSISTED TO COURIER PROFILE
      </small>
    </div>
  `;

  const reward =
    finish.querySelector(
      '.reward'
    );

  if (reward) {
    reward.insertAdjacentElement(
      'afterend',
      panel
    );
  } else {
    finish
      .querySelector(
        '.outcome'
      )
      ?.appendChild(
        panel
      );
  }
}

export function refreshIfVisible() {
  buildMissionResults();
}

if (
  typeof document !==
  'undefined'
) {
  installStyle();

  const finish =
    document.getElementById(
      'finish'
    );

  if (finish) {
    new MutationObserver(
      () =>
        window.requestAnimationFrame(
          buildMissionResults
        )
    ).observe(
      finish,
      {
        attributes: true,
        attributeFilter: [
          'class'
        ]
      }
    );

    refreshIfVisible();
  }

  window.addEventListener(
    'relay:mission-complete',
    () =>
      window.requestAnimationFrame(
        buildMissionResults
      )
  );

  window.addEventListener(
    'relay:mission-performance-complete',
    () =>
      window.requestAnimationFrame(
        buildMissionResults
      )
  );
}

