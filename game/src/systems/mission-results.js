import { loadState } from '../state.js';

const RESULT_CLASS = 'mission-results-panel';
const style = `
#finish{z-index:70!important;background:radial-gradient(circle at 50% 24%,rgba(255,208,110,.10),rgba(3,8,16,.96) 48%,rgba(1,4,9,.99))!important;overflow:auto!important}
#finish .outcome{position:relative;z-index:71;width:min(720px,calc(100vw - 28px));max-height:calc(100dvh - 28px);overflow:auto;padding:clamp(20px,4vw,34px)!important;border:1px solid rgba(255,208,110,.22);background:linear-gradient(145deg,rgba(8,18,32,.98),rgba(3,8,15,.98));box-shadow:0 28px 90px rgba(0,0,0,.55),0 0 55px rgba(255,208,110,.07);box-sizing:border-box}
.${RESULT_CLASS}{margin:18px auto 14px;width:min(100%,620px);display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;text-align:left}
.${RESULT_CLASS} .mission-result-card{padding:10px 12px;border:1px solid rgba(150,190,255,.18);background:rgba(8,18,38,.58);border-radius:10px;min-width:0}
.${RESULT_CLASS} .mission-result-label{display:block;font-size:9px;letter-spacing:.16em;opacity:.62;margin-bottom:4px}
.${RESULT_CLASS} .mission-result-value{display:block;font-size:16px;font-weight:800;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${RESULT_CLASS} .mission-result-sub{display:block;font-size:9px;opacity:.52;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${RESULT_CLASS} .mission-result-wide{grid-column:span 2}
.${RESULT_CLASS} .mission-result-total{border-color:rgba(255,208,110,.34);background:rgba(255,208,110,.07)}
#finish .outcome .primary{position:relative;z-index:72;touch-action:manipulation}
@media (max-width:700px){#finish .outcome{width:calc(100vw - 18px);max-height:calc(100dvh - 18px);padding:18px 14px!important}.${RESULT_CLASS}{grid-template-columns:repeat(2,minmax(0,1fr));width:100%;gap:6px;margin:12px auto}.${RESULT_CLASS} .mission-result-wide{grid-column:span 2}}
`;

export const formatResultTime = ms => {
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) return '--:--.--';
  return `${String(Math.floor(value / 60000)).padStart(2, '0')}:${String(Math.floor(value / 1000) % 60).padStart(2, '0')}.${Math.floor(value % 1000 / 100)}`;
};

export const resultGrade = ratingText => {
  const text = String(ratingText || '').toUpperCase();
  if (/\bS\b|★★★|3\/3|3 STARS/.test(text)) return 'S';
  if (/\bA\b|★★|2\/3|2 STARS/.test(text)) return 'A';
  if (/\bB\b|★|1\/3|1 STAR/.test(text)) return 'B';
  return 'C';
};

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const number = value => Number.isFinite(Number(value)) ? Number(value).toLocaleString() : '0';

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

export function buildMissionResults() {
  const finish = document.getElementById('finish');
  if (!finish || finish.classList.contains('hidden')) return;
  installStyle();
  const state = loadState();
  const breakdown = state.lastXpBreakdown || {};
  const ratingText = document.getElementById('finishRating')?.textContent || '';
  const grade = resultGrade(ratingText);
  const score = document.getElementById('runScore')?.textContent || document.getElementById('finishScore')?.textContent || '0';
  const time = document.getElementById('runTime')?.textContent || document.getElementById('finishTime')?.textContent || '';
  const signals = document.getElementById('signalTotal')?.textContent || document.getElementById('finishSignals')?.textContent || '0';
  const clean = latestRouteAchievement(state) && state.achievements?.includes(`clean-${latestRouteAchievement(state)}`);
  const bonusTotal = (breakdown.signals || 0) + (breakdown.secrets || 0) + (breakdown.optional || 0) + (breakdown.streak || 0) + (breakdown.package || 0) + (breakdown.modifier || 0) + (breakdown.contract || 0) + (breakdown.campaign || 0) + (breakdown.rival || 0);
  const existing = finish.querySelector(`.${RESULT_CLASS}`);
  if (existing) existing.remove();
  const panel = document.createElement('div');
  panel.className = RESULT_CLASS;
  panel.setAttribute('aria-label', 'Mission results');
  panel.innerHTML = `
    <div class="mission-result-card mission-result-total"><span class="mission-result-label">GRADE</span><b class="mission-result-value">${grade}</b><small class="mission-result-sub">RUN QUALITY</small></div>
    <div class="mission-result-card"><span class="mission-result-label">TIME</span><b class="mission-result-value">${escapeHtml(time || formatResultTime(breakdown.elapsedMs))}</b><small class="mission-result-sub">FINISH TIME</small></div>
    <div class="mission-result-card"><span class="mission-result-label">SIGNALS</span><b class="mission-result-value">${escapeHtml(signals)}</b><small class="mission-result-sub">COLLECTED</small></div>
    <div class="mission-result-card"><span class="mission-result-label">SCORE</span><b class="mission-result-value">${escapeHtml(score)}</b><small class="mission-result-sub">RUN SCORE</small></div>
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
}
