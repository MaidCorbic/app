import { loadState } from '../state.js';

const RESULT_CLASS = 'mission-results-panel';
const style = `
#finish{
  --finish-cyan:#5ee9ff;--finish-cyan-deep:#157eaa;--finish-violet:#a98cff;--finish-ink:#050a12;
  z-index:70!important;isolation:isolate;overflow:auto!important;overscroll-behavior:contain;
  background:
    radial-gradient(80% 58% at 50% 0%,rgba(41,202,255,.18),transparent 66%),
    radial-gradient(48% 42% at 100% 100%,rgba(115,72,255,.13),transparent 72%),
    linear-gradient(180deg,rgba(4,9,18,.94),rgba(1,4,10,.985))!important;
  padding:max(18px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left));
}
#finish::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.34;background-image:linear-gradient(rgba(94,233,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(94,233,255,.025) 1px,transparent 1px);background-size:38px 38px;mask-image:linear-gradient(to bottom,black,transparent 88%)}
#finish .outcome{
  position:relative;z-index:71;box-sizing:border-box;width:min(860px,100%);max-height:calc(100dvh - max(28px,env(safe-area-inset-top)) - max(28px,env(safe-area-inset-bottom));overflow:auto;
  margin:auto;padding:clamp(22px,4vw,44px)!important;border:1px solid rgba(123,224,255,.22)!important;border-radius:28px!important;
  background:linear-gradient(145deg,rgba(12,22,38,.97),rgba(3,8,16,.985) 58%,rgba(7,12,25,.98))!important;
  box-shadow:0 40px 120px rgba(0,0,0,.62),0 0 0 1px rgba(255,255,255,.025) inset,0 0 80px rgba(44,193,255,.08)!important;
  scrollbar-width:thin;scrollbar-color:rgba(94,233,255,.38) transparent;
}
#finish .outcome::before{content:'';position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,.045),transparent 25%,transparent 74%,rgba(94,233,255,.035));}
#finish .outcome > :not(.${RESULT_CLASS}){position:relative;z-index:1}
#finish #finishTitle,#finish .outcome h1,#finish .outcome h2{max-width:100%;margin:0 auto 8px!important;text-align:center;font-size:clamp(26px,5vw,48px)!important;line-height:1.02!important;letter-spacing:.055em!important;text-transform:uppercase;color:#effcff!important;text-shadow:0 0 32px rgba(94,233,255,.16)}
#finish #finishTitle::after,#finish .outcome h1::after{content:'';display:block;width:clamp(70px,14vw,120px);height:2px;margin:14px auto 0;background:linear-gradient(90deg,transparent,var(--finish-cyan),transparent);box-shadow:0 0 18px rgba(94,233,255,.65)}
#finish #finishRating{display:inline-flex;align-items:center;justify-content:center;min-width:58px;min-height:58px;margin:8px auto 2px;padding:4px 14px;border:1px solid rgba(94,233,255,.38);border-radius:18px;background:linear-gradient(145deg,rgba(94,233,255,.13),rgba(94,233,255,.025));font-size:clamp(22px,4vw,34px)!important;font-weight:900;line-height:1;color:var(--finish-cyan);box-shadow:0 0 28px rgba(94,233,255,.12),inset 0 1px 0 rgba(255,255,255,.08)}
#finish .reward{position:relative;z-index:2;display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin:16px auto 4px!important;padding:10px 14px!important;border:1px solid rgba(94,233,255,.14);border-radius:16px;background:rgba(94,233,255,.035)}
.${RESULT_CLASS}{position:relative;z-index:2;width:min(100%,760px);margin:18px auto 20px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;text-align:left;contain:layout paint}
.${RESULT_CLASS} .mission-result-card{position:relative;min-width:0;padding:14px;border:1px solid rgba(164,196,255,.14);border-radius:16px;background:linear-gradient(145deg,rgba(17,30,52,.82),rgba(7,14,28,.76));box-shadow:inset 0 1px 0 rgba(255,255,255,.035);overflow:hidden}
.${RESULT_CLASS} .mission-result-card::before{content:'';position:absolute;inset:0 0 auto;height:1px;background:linear-gradient(90deg,transparent,rgba(94,233,255,.55),transparent);opacity:.55}
.${RESULT_CLASS} .mission-result-label{display:block;margin-bottom:7px;font-size:9px;font-weight:800;letter-spacing:.2em;line-height:1.15;color:rgba(208,229,255,.58);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${RESULT_CLASS} .mission-result-value{display:block;min-width:0;font-size:clamp(17px,2.5vw,24px);font-weight:900;line-height:1.08;color:#f4f9ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.${RESULT_CLASS} .mission-result-sub{display:block;margin-top:7px;font-size:9px;line-height:1.25;letter-spacing:.06em;color:rgba(192,211,237,.52);white-space:normal;overflow-wrap:anywhere}
.${RESULT_CLASS} .mission-result-wide{grid-column:span 2}
.${RESULT_CLASS} .mission-result-total{border-color:rgba(94,233,255,.34);background:linear-gradient(145deg,rgba(20,111,145,.22),rgba(8,22,42,.84));box-shadow:0 0 28px rgba(94,233,255,.07),inset 0 1px 0 rgba(255,255,255,.06)}
.${RESULT_CLASS} .mission-result-total .mission-result-value{color:#bdf8ff}
.${RESULT_CLASS} .mission-result-performance{border-color:rgba(94,233,255,.27);background:linear-gradient(145deg,rgba(19,88,120,.25),rgba(10,22,42,.8))}
.${RESULT_CLASS} .mission-result-performance .mission-result-value{color:var(--finish-cyan)}
#finish .finish-actions{position:relative;z-index:3;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:10px;width:min(100%,760px);margin:4px auto 0}
#finish #again,#finish #nextMission{position:relative;isolation:isolate;box-sizing:border-box;width:100%;min-height:64px;margin:0!important;padding:12px 18px!important;display:flex;align-items:center;justify-content:center;gap:10px;border-radius:16px!important;font-family:inherit;font-size:12px!important;font-weight:900!important;letter-spacing:.13em!important;line-height:1.1;text-transform:uppercase;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;transition:transform .16s ease,filter .16s ease,box-shadow .16s ease,border-color .16s ease}
#finish #again{color:#f1ecff!important;border:1px solid rgba(169,140,255,.48)!important;background:linear-gradient(135deg,rgba(120,86,210,.34),rgba(41,29,84,.74))!important;box-shadow:0 12px 30px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.07)!important}
#finish #nextMission{color:#edfdff!important;border:1px solid rgba(94,233,255,.7)!important;background:linear-gradient(135deg,rgba(22,136,181,.88),rgba(13,58,97,.96))!important;box-shadow:0 14px 34px rgba(0,0,0,.28),0 0 30px rgba(94,233,255,.12),inset 0 1px 0 rgba(255,255,255,.12)!important}
#finish #again::before{content:'↻';font-size:20px;line-height:1;color:var(--finish-violet)}
#finish #nextMission::after{content:'➜';font-size:19px;line-height:1;color:var(--finish-cyan)}
#finish #again b,#finish #nextMission b{display:none}
@media (hover:hover){#finish #again:hover,#finish #nextMission:hover{transform:translateY(-2px);filter:brightness(1.1)}#finish #again:hover{border-color:rgba(197,176,255,.86)!important;box-shadow:0 18px 38px rgba(0,0,0,.32),0 0 28px rgba(169,140,255,.16)!important}#finish #nextMission:hover{border-color:#baf7ff!important;box-shadow:0 18px 40px rgba(0,0,0,.34),0 0 42px rgba(94,233,255,.22)!important}}
#finish #again:active,#finish #nextMission:active{transform:scale(.985);filter:brightness(.96)}
@media (max-width:720px){#finish{padding:10px max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}#finish .outcome{width:100%;max-height:calc(100dvh - 20px);padding:20px 14px 16px!important;border-radius:22px!important}.${RESULT_CLASS}{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:14px auto 16px}.${RESULT_CLASS} .mission-result-card{padding:12px}.${RESULT_CLASS} .mission-result-wide{grid-column:span 2}.${RESULT_CLASS} .mission-result-value{font-size:clamp(16px,5vw,21px)}#finish .finish-actions{grid-template-columns:1fr;gap:8px}#finish #again,#finish #nextMission{min-height:58px;font-size:11px!important}}
@media (max-width:390px){#finish .outcome{padding:18px 11px 13px!important;border-radius:18px!important}.${RESULT_CLASS}{gap:6px}.${RESULT_CLASS} .mission-result-card{padding:10px;border-radius:13px}.${RESULT_CLASS} .mission-result-label{font-size:8px;letter-spacing:.15em}.${RESULT_CLASS} .mission-result-sub{font-size:8px}.${RESULT_CLASS} .mission-result-value{font-size:15px}#finish #finishTitle{font-size:25px!important}}
@media (prefers-reduced-motion:reduce){#finish *,#finish *::before,#finish *::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
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
  return result?.completed ? result : null;
}

function polishFinishActions() {
  const outcome = document.querySelector('#finish .outcome');
  const again = document.getElementById('again');
  const next = document.getElementById('nextMission');
  if (!outcome) return;
  let actions = outcome.querySelector('.finish-actions');
  if (!actions && (again || next)) {
    actions = document.createElement('div');
    actions.className = 'finish-actions';
    (next || again)?.parentElement?.insertBefore(actions, (next || again));
  }
  if (again) {
    again.classList.add('finish-replay-action');
    again.setAttribute('aria-label', 'Replay this mission');
    again.innerHTML = 'REPLAY RUN <b aria-hidden="true">↻</b>';
    if (actions && again.parentElement !== actions) actions.appendChild(again);
  }
  if (next) {
    next.classList.add('finish-next-action');
    next.setAttribute('aria-label', 'Continue to the next mission');
    next.innerHTML = 'NEXT MISSION <b aria-hidden="true">➜</b>';
    if (actions && next.parentElement !== actions) actions.appendChild(next);
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
  const time = performance?.raw?.elapsedMs > 0 ? formatResultTime(performance.raw.elapsedMs) : (document.getElementById('runTime')?.textContent || document.getElementById('finishTime')?.textContent || '');
  const collectedSignals = performance?.raw ? integer(performance.raw.signals) : integer(document.getElementById('signalTotal')?.textContent?.match(/\d+/)?.[0]);
  const totalSignals = performance?.raw?.totalSignals || 0;
  const signalText = totalSignals > 0 ? `${collectedSignals} / ${totalSignals}` : (document.getElementById('finishSignals')?.textContent || '0');
  const cleanRoute = latestRouteAchievement(state);
  const clean = cleanRoute && state.achievements?.includes(`clean-${cleanRoute}`);
  const bonusTotal = ['signals','secrets','optional','streak','package','modifier','contract','campaign','rival'].reduce((sum, key) => sum + Number(breakdown[key] || 0), 0);

  finish.querySelector(`.${RESULT_CLASS}`)?.remove();
  const panel = document.createElement('div');
  panel.className = RESULT_CLASS;
  panel.setAttribute('aria-label', 'Mission results');
  panel.innerHTML = `
    <div class="mission-result-card mission-result-performance"><span class="mission-result-label">GRADE</span><b class="mission-result-value">${escapeHtml(grade)}</b><small class="mission-result-sub">PERFORMANCE QUALITY</small></div>
    <div class="mission-result-card"><span class="mission-result-label">TIME</span><b class="mission-result-value">${escapeHtml(time || '--:--.--')}</b><small class="mission-result-sub">FINISH TIME</small></div>
    <div class="mission-result-card"><span class="mission-result-label">SIGNALS</span><b class="mission-result-value">${escapeHtml(signalText)}</b><small class="mission-result-sub">COLLECTED</small></div>
    <div class="mission-result-card"><span class="mission-result-label">RUN SCORE</span><b class="mission-result-value">${escapeHtml(score)}</b><small class="mission-result-sub">RUN TOTAL</small></div>
    <div class="mission-result-card mission-result-performance mission-result-wide"><span class="mission-result-label">PERFORMANCE SCORE</span><b class="mission-result-value">${performance ? `${performance.score} / 100` : '--'}</b><small class="mission-result-sub">${performance ? `SPEED ${performance.metrics.speed} · SIGNALS ${performance.metrics.signals} · ROUTE ${performance.metrics.route} · SURVIVAL ${performance.metrics.survival}` : 'PERFORMANCE DATA NOT AVAILABLE'}</small></div>
    <div class="mission-result-card mission-result-wide"><span class="mission-result-label">BONUSES</span><b class="mission-result-value">+${number(bonusTotal)} XP</b><small class="mission-result-sub">${clean ? 'CLEAN RUN BONUS INCLUDED' : 'BONUSES FROM THIS RUN'}</small></div>
    <div class="mission-result-card mission-result-total mission-result-wide"><span class="mission-result-label">TOTAL REWARD</span><b class="mission-result-value">+${number(breakdown.total || 0)} XP · +${number(breakdown.credits || 0)} CREDITS</b><small class="mission-result-sub">PERSISTED TO COURIER PROFILE</small></div>`;
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
