import { loadState } from '../state.js';

const RESULT_CLASS = 'mission-results-panel';
const style = `
@keyframes finishPanelIn{
  from{
    opacity:0;
    transform:translateY(10px) scale(.985);
    filter:brightness(.85);
  }
  to{
    opacity:1;
    transform:translateY(0) scale(1);
    filter:brightness(1);
  }
}

#finish:not(.hidden) .outcome{
  animation:finishPanelIn .32s ease-out both;
}
#finish{z-index:70!important;background:radial-gradient(circle at 50% 24%,rgba(255,208,110,.08),rgba(3,8,16,.96) 48%,rgba(1,4,9,.99))!important;overflow:auto!important}
#finish .outcome{position:relative;z-index:71;width:min(720px,calc(100vw - 28px));max-height:calc(100dvh - 28px);overflow:auto;padding:clamp(20px,4vw,34px)!important;border:1px solid rgba(255,208,110,.22);background:linear-gradient(145deg,rgba(8,18,32,.98),rgba(3,8,15,.98));box-shadow:0 28px 90px rgba(0,0,0,.55),0 0 55px rgba(255,208,110,.055);box-sizing:border-box}
#finish .outcome > h1,
#finish .outcome > h2,
#finish .outcome .title{
  color:#fff0b5!important;
  text-shadow:
    0 0 8px rgba(255,208,110,.18),
    0 0 22px rgba(255,208,110,.12);
  letter-spacing:.10em;
}
.${RESULT_CLASS}{margin:18px auto 14px;width:min(100%,620px);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;text-align:left}
.${RESULT_CLASS} .mission-result-card{padding:10px 12px;border:1px solid rgba(255,208,110,.16);background:rgba(8,12,18,.62);border-radius:10px;min-width:0}
.${RESULT_CLASS} .mission-result-label{display:block;font-size:9px;letter-spacing:.16em;opacity:.62;margin-bottom:4px}
.${RESULT_CLASS} .mission-result-value{display:block;font-size:16px;font-weight:800;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${RESULT_CLASS} .mission-result-sub{display:block;font-size:9px;opacity:.52;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${RESULT_CLASS} .mission-result-wide{grid-column:span 2}
.${RESULT_CLASS} .mission-result-total{border-color:rgba(255,208,110,.30);background:rgba(255,208,110,.055)}
.${RESULT_CLASS} .mission-result-performance{border-color:rgba(255,208,110,.28);background:linear-gradient(145deg,rgba(255,208,110,.075),rgba(8,18,38,.68))}
.${RESULT_CLASS} .mission-result-performance{
  box-shadow:
    0 0 18px rgba(255,208,110,.08),
    inset 0 1px 0 rgba(255,255,255,.04);
}
.${RESULT_CLASS} .mission-result-performance .mission-result-value{
  color:#fff0b5;
  text-shadow:
    0 0 10px rgba(255,208,110,.22),
    0 0 24px rgba(255,208,110,.12);
}

.${RESULT_CLASS} .mission-result-total{
  box-shadow:
    0 0 24px rgba(255,208,110,.12),
    inset 0 1px 0 rgba(255,255,255,.05);
}
.${RESULT_CLASS} .mission-result-total .mission-result-label{
  color:#f7d98a;
  opacity:.82;
}

.${RESULT_CLASS} .mission-result-total .mission-result-value{
  color:#fff0b5;
  text-shadow:
    0 0 10px rgba(255,208,110,.22),
    0 0 22px rgba(255,208,110,.10);
}

/* Finish actions: replay is secondary gold, progression is primary gold. */
#finish .outcome .primary{position:relative;z-index:72;touch-action:manipulation}
#finish #again,
#finish #nextMission{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:56px;padding:10px 18px!important;margin:5px 4px 0!important;border-radius:10px!important;border:1px solid transparent!important;font-family:inherit;font-weight:800;letter-spacing:.10em;text-transform:uppercase;line-height:1.05;vertical-align:middle;transition:transform .16s ease,box-shadow .16s ease,background .16s ease,border-color .16s ease,filter .16s ease}

#finish #again{width:min(190px,calc(50% - 12px));color:#f7d98a!important;border-color:rgba(255,208,110,.38)!important;background:linear-gradient(145deg,rgba(255,208,110,.10),rgba(255,208,110,.025))!important;box-shadow:0 0 18px rgba(255,208,110,.07),inset 0 1px 0 rgba(255,255,255,.04)!important}
#finish #again:hover{border-color:rgba(255,208,110,.68)!important;background:linear-gradient(145deg,rgba(255,208,110,.16),rgba(255,208,110,.045))!important;box-shadow:0 0 26px rgba(255,208,110,.14),inset 0 1px 0 rgba(255,255,255,.06)!important;transform:translateY(-1px)}
#finish #again:active{transform:scale(.985)}

#finish #nextMission{width:min(250px,calc(50% - 12px));color:#fff4cf!important;border-color:rgba(255,208,110,.72)!important;background:linear-gradient(145deg,rgba(255,208,110,.20),rgba(114,76,20,.18))!important;box-shadow:0 0 24px rgba(255,208,110,.14),inset 0 1px 0 rgba(255,255,255,.05)!important}
#finish #nextMission:hover{   border-color:#ffd06e!important;   background:linear-gradient(145deg,rgba(255,208,110,.32),rgba(114,76,20,.24))!important;   box-shadow:     0 0 34px rgba(255,208,110,.24),     0 0 58px rgba(255,208,110,.10),     inset 0 1px 0 rgba(255,255,255,.07)!important;   transform:translateY(-1px); }
#finish #nextMission:active{transform:scale(.985)}
#finish #again::before{content:'↻';font-size:18px;line-height:1;opacity:.95}
#finish #nextMission::after{content:'→';font-size:18px;line-height:1;opacity:.95}
#finish #again b,
#finish #nextMission b{display:none}

@media (max-width:700px){
  #finish .outcome{width:calc(100vw - 18px);max-height:calc(100dvh - 18px);padding:18px 14px!important}
  .${RESULT_CLASS}{grid-template-columns:repeat(2,minmax(0,1fr));width:100%;gap:6px;margin:12px auto}
  .${RESULT_CLASS} .mission-result-wide{grid-column:span 2}
  #finish #again,#finish #nextMission{width:calc(50% - 8px);min-height:54px;padding:9px 10px!important;font-size:11px;letter-spacing:.08em}
}

@media (max-width:430px){
  #finish #again,#finish #nextMission{width:100%;margin:4px 0 0!important}
}
`;

export const formatResultTime = ms => {
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) return '--:--.--';
  return `${String(Math.floor(value / 60000)).padStart(2, '0')}:${String(Math.floor(value / 1000) % 60).padStart(2, '0')}.${Math.floor(value % 1000 / 100)}`;
};

export const resultGrade = ratingText => {
  const text = String(ratingText || '').toUpperCase();
  if (/\bS\+\b|\bS\b|★★★|3\/3|3 STARS/.test(text)) return text.includes('S+') ? 'S+' : 'S';
  if (/\bA\b|★★|2\/3|2 STARS/.test(text)) return 'A';
  if (/\bB\b|★|1\/3|1 STAR/.test(text)) return 'B';
  return 'C';
};

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const number = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : '0';
const integer = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;

function installStyle() {
  if (document.getElementById('mission-results-style')) return;
  const element = document.createElement('style');
  element.id = 'mission-results-style';
  element.textContent = style;
  document.head.appendChild(element);
}

function latestRouteAchievement(state) {
  return [...(state.achievements || [])].reverse().find(id => String(id).startsWith('route-'))?.slice(6) || null;
}

function getPerformanceResult() {
  const result = window.__missionFlowPerformanceV1?.latest;
  if (!result?.completed) return null;
  return result;
}

function polishFinishActions() {
  const again = document.getElementById('again');
  const next = document.getElementById('nextMission');
  if (again) {
    again.classList.add('finish-replay-action');
    again.setAttribute('aria-label', 'Replay this mission');
    again.innerHTML = 'REPLAY RUN <b aria-hidden="true">↻</b>';
  }
  if (next) {
    next.classList.add('finish-next-action');
    next.setAttribute('aria-label', 'Continue to the next mission');
    next.innerHTML = 'NEXT MISSION <b aria-hidden="true">→</b>';
  }
}

export function buildMissionResults() {
  const finish = document.getElementById('finish');
  if (!finish || finish.classList.contains('hidden')) return;
  installStyle();
  polishFinishActions();

  const state = loadState();
  const breakdown = state.lastXpBreakdown || {};
  const performance = getPerformanceResult();

  const existingRatingText = document.getElementById('finishRating')?.textContent || '';
  const grade = performance?.rating || resultGrade(existingRatingText);

  const score = document.getElementById('runScore')?.textContent || '0';
  const time = performance?.raw?.elapsedMs > 0
    ? formatResultTime(performance.raw.elapsedMs)
    : (document.getElementById('runTime')?.textContent || document.getElementById('finishTime')?.textContent || '');

  const collectedSignals = performance?.raw
    ? integer(performance.raw.signals)
    : integer(document.getElementById('signalTotal')?.textContent?.match(/\d+/)?.[0]);
  const totalSignals = performance?.raw?.totalSignals || 0;
  const signalText = totalSignals > 0
    ? `${collectedSignals} / ${totalSignals}`
    : (document.getElementById('finishSignals')?.textContent || '0');

  const cleanRoute = latestRouteAchievement(state);
  const clean = cleanRoute && state.achievements?.includes(`clean-${cleanRoute}`);
  const bonusTotal = (breakdown.signals || 0) + (breakdown.secrets || 0) + (breakdown.optional || 0) + (breakdown.streak || 0) + (breakdown.package || 0) + (breakdown.modifier || 0) + (breakdown.contract || 0) + (breakdown.campaign || 0) + (breakdown.rival || 0);

  const existing = finish.querySelector(`.${RESULT_CLASS}`);
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.className = RESULT_CLASS;
  panel.setAttribute('aria-label', 'Mission results');
  panel.innerHTML = `
    <div class="mission-result-card mission-result-performance"><span class="mission-result-label">GRADE</span><b class="mission-result-value">${escapeHtml(grade)}</b><small class="mission-result-sub">PERFORMANCE QUALITY</small></div>
    <div class="mission-result-card"><span class="mission-result-label">TIME</span><b class="mission-result-value">${escapeHtml(time || '--:--.--')}</b><small class="mission-result-sub">FINISH TIME</small></div>
    <div class="mission-result-card"><span class="mission-result-label">SIGNALS</span><b class="mission-result-value">${escapeHtml(signalText)}</b><small class="mission-result-sub">COLLECTED</small></div>
    <div class="mission-result-card"><span class="mission-result-label">RUN SCORE</span><b class="mission-result-value">${escapeHtml(score)}</b><small class="mission-result-sub">EXISTING GAME SCORE</small></div>
    <div class="mission-result-card mission-result-performance mission-result-wide"><span class="mission-result-label">PERFORMANCE SCORE</span><b class="mission-result-value">${performance ? `${performance.score} / 100` : '--'}</b><small class="mission-result-sub">${performance ? `SPEED ${performance.metrics.speed} · SIGNALS ${performance.metrics.signals} · ROUTE ${performance.metrics.route} · SURVIVAL ${performance.metrics.survival}` : 'PERFORMANCE DATA NOT AVAILABLE'}</small></div>
    <div class="mission-result-card mission-result-wide"><span class="mission-result-label">BONUSES</span><b class="mission-result-value">+${number(bonusTotal)} XP</b><small class="mission-result-sub">${clean ? 'CLEAN RUN BONUS INCLUDED' : 'BONUSES FROM THIS RUN'}</small></div>
    <div class="mission-result-card mission-result-total mission-result-wide"><span class="mission-result-label">TOTAL REWARD</span><b class="mission-result-value">+${number(breakdown.total || 0)} XP · +${number(breakdown.credits || 0)} CREDITS</b><small class="mission-result-sub">PERSISTED TO COURIER PROFILE</small></div>
  `;

  const reward = finish.querySelector('.reward');
  if (reward) reward.insertAdjacentElement('afterend', panel);
  else finish.querySelector('.outcome')?.appendChild(panel);
}

export function refreshIfVisible() { buildMissionResults(); }

if (typeof document !== 'undefined') {
  installStyle();
  const finish = document.getElementById('finish');
  if (finish) {
    new MutationObserver(() => window.requestAnimationFrame(buildMissionResults)).observe(finish, { attributes: true, attributeFilter: ['class'] });
    refreshIfVisible();
  }
  window.addEventListener('relay:mission-complete', () => window.requestAnimationFrame(buildMissionResults));
  window.addEventListener('relay:mission-performance-complete', () => window.requestAnimationFrame(buildMissionResults));
}
