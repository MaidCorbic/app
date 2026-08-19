import { loadState } from '../state.js';

const RESULT_CLASS = 'mission-results-panel';
const style = `
/* UPDATE 13 — Mission Results UI Polish
   Visual-only layer. Existing result data, DOM IDs, buttons and gameplay ownership remain untouched. */
#finish{
  z-index:70!important;
  background:
    radial-gradient(circle at 50% 8%,rgba(255,208,110,.10),transparent 28%),
    linear-gradient(180deg,#050c17 0%,#020711 55%,#01040a 100%)!important;
  overflow:auto!important;
  scrollbar-width:thin;
  scrollbar-color:rgba(255,208,110,.30) transparent;
}
#finish::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity:.22;
  background:
    linear-gradient(rgba(255,255,255,.016) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.016) 1px,transparent 1px);
  background-size:42px 42px;
  mask-image:linear-gradient(to bottom,black,transparent 88%);
}
#finish .outcome{
  position:relative;
  z-index:71;
  width:min(760px,calc(100vw - 24px));
  max-height:calc(100dvh - 24px);
  overflow:auto;
  padding:24px 24px 22px!important;
  border:1px solid rgba(255,208,110,.18);
  border-radius:18px;
  background:linear-gradient(145deg,rgba(8,18,32,.985),rgba(3,8,15,.985));
  box-shadow:0 24px 70px rgba(0,0,0,.62),0 0 48px rgba(255,208,110,.045),inset 0 1px 0 rgba(255,255,255,.04);
  box-sizing:border-box;
  isolation:isolate;
}
#finish .outcome::before{
  content:"";
  position:absolute;
  inset:9px;
  pointer-events:none;
  border:1px solid rgba(150,190,255,.045);
  border-radius:13px;
}
#finish .outcome::after{
  content:"";
  position:absolute;
  width:150px;
  height:150px;
  top:-70px;
  left:50%;
  transform:translateX(-50%);
  pointer-events:none;
  background:radial-gradient(circle,rgba(255,208,110,.10),transparent 68%);
  filter:blur(7px);
}
#finish .outcome .eyebrow,
#finish .outcome .kicker,
#finish .outcome .label{letter-spacing:.22em}
#finish .outcome h1,
#finish .outcome h2{text-shadow:0 0 26px rgba(255,208,110,.08)}

/* Compact existing reward block — content and functionality unchanged. */
#finish .outcome .reward{
  position:relative;
  margin:12px auto 6px!important;
  padding:8px 12px!important;
  min-height:0!important;
  text-align:center;
  border:1px solid rgba(255,208,110,.12);
  border-radius:12px;
  background:linear-gradient(180deg,rgba(255,208,110,.045),rgba(255,208,110,.008));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.02);
}
#finish .outcome .reward h1,
#finish .outcome .reward h2,
#finish .outcome .reward h3{
  margin:0!important;
  font-size:clamp(28px,4vw,40px)!important;
  line-height:1!important;
}
#finish .outcome .reward p,
#finish .outcome .reward small{
  margin:2px 0!important;
  line-height:1.2!important;
}

.${RESULT_CLASS}{
  position:relative;
  margin:14px auto 10px;
  width:min(100%,700px);
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:8px;
  text-align:left;
}
.${RESULT_CLASS} .mission-result-card{
  position:relative;
  min-width:0;
  overflow:hidden;
  padding:10px 12px;
  border:1px solid rgba(150,190,255,.13);
  border-radius:11px;
  background:linear-gradient(145deg,rgba(10,23,43,.78),rgba(5,12,25,.72));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 8px 22px rgba(0,0,0,.15);
  transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease;
}
.${RESULT_CLASS} .mission-result-card::before{
  content:"";
  position:absolute;
  top:0;
  left:12px;
  right:12px;
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(150,190,255,.22),transparent);
}
.${RESULT_CLASS} .mission-result-card:hover{
  transform:translateY(-1px);
  border-color:rgba(150,190,255,.22);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 10px 24px rgba(0,0,0,.18);
}
.${RESULT_CLASS} .mission-result-label{
  display:block;
  color:rgba(210,224,244,.60);
  font-size:8px;
  line-height:1.15;
  font-weight:700;
  letter-spacing:.17em;
  margin-bottom:5px;
}
.${RESULT_CLASS} .mission-result-value{
  display:block;
  color:#f5f8fc;
  font-size:16px;
  font-weight:850;
  line-height:1.05;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  text-shadow:0 2px 12px rgba(0,0,0,.22);
}
.${RESULT_CLASS} .mission-result-sub{
  display:block;
  color:rgba(203,216,234,.48);
  font-size:8px;
  line-height:1.2;
  letter-spacing:.02em;
  margin-top:5px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.${RESULT_CLASS} .mission-result-wide{grid-column:span 2}

/* Grade remains the rank anchor, but no longer dominates the screen. */
.${RESULT_CLASS} .mission-result-card:first-child{
  grid-column:span 2;
  min-height:88px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:12px 16px;
  border-color:rgba(255,208,110,.28);
  background:radial-gradient(circle at 82% 50%,rgba(255,208,110,.09),transparent 42%),linear-gradient(145deg,rgba(255,208,110,.06),rgba(8,18,38,.74));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 0 24px rgba(255,208,110,.035),0 9px 25px rgba(0,0,0,.20);
}
.${RESULT_CLASS} .mission-result-card:first-child .mission-result-value{
  font-size:clamp(30px,4vw,42px);
  line-height:.92;
  color:#ffd06e;
  letter-spacing:.02em;
  text-shadow:0 0 20px rgba(255,208,110,.15);
}
.${RESULT_CLASS} .mission-result-card:first-child .mission-result-sub{margin-top:6px;color:rgba(255,224,158,.54)}

/* Performance remains the main metric, with a compact 3-column footprint. */
.${RESULT_CLASS} .mission-result-performance:nth-child(5){
  grid-column:span 3;
  min-height:88px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:12px 16px;
  border-color:rgba(255,208,110,.30);
  background:radial-gradient(circle at 90% 50%,rgba(255,208,110,.10),transparent 38%),linear-gradient(145deg,rgba(255,208,110,.07),rgba(8,18,38,.80));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 0 26px rgba(255,208,110,.04),0 9px 25px rgba(0,0,0,.20);
}
.${RESULT_CLASS} .mission-result-performance:nth-child(5) .mission-result-value{
  font-size:clamp(28px,3.7vw,40px);
  line-height:.95;
  color:#fff4d4;
}
.${RESULT_CLASS} .mission-result-performance:nth-child(5) .mission-result-sub{margin-top:6px;color:rgba(255,224,158,.62);font-size:8px;letter-spacing:.04em}

/* Bottom row stays compact instead of stretching across the panel. */
.${RESULT_CLASS} .mission-result-total{
  grid-column:span 2;
  min-height:58px;
  border-color:rgba(255,208,110,.24);
  background:linear-gradient(90deg,rgba(255,208,110,.07),rgba(255,208,110,.018) 55%,rgba(255,208,110,.055));
}
.${RESULT_CLASS} .mission-result-total .mission-result-value{color:#ffd06e}

#finish .outcome .primary{
  position:relative;
  z-index:72;
  touch-action:manipulation;
  transition:transform .16s ease,box-shadow .16s ease,filter .16s ease;
}
#finish .outcome .primary:hover{transform:translateY(-1px);filter:brightness(1.03);box-shadow:0 8px 24px rgba(255,208,110,.13)}
#finish .outcome .primary:active{transform:translateY(0) scale(.985)}

@media (max-width:700px){
  #finish .outcome{
    width:calc(100vw - 12px);
    max-height:calc(100dvh - 12px);
    padding:15px 10px 14px!important;
    border-radius:15px;
  }
  #finish .outcome::before{inset:7px;border-radius:10px}
  #finish .outcome .reward{margin:10px auto 4px!important;padding:7px 10px!important}
  #finish .outcome .reward h1,
  #finish .outcome .reward h2,
  #finish .outcome .reward h3{font-size:30px!important}
  .${RESULT_CLASS}{
    grid-template-columns:repeat(2,minmax(0,1fr));
    width:100%;
    gap:6px;
    margin:10px auto 8px;
  }
  .${RESULT_CLASS} .mission-result-card{padding:9px 10px;border-radius:10px}
  .${RESULT_CLASS} .mission-result-card:first-child,
  .${RESULT_CLASS} .mission-result-performance:nth-child(5),
  .${RESULT_CLASS} .mission-result-wide,
  .${RESULT_CLASS} .mission-result-total{grid-column:span 2}
  .${RESULT_CLASS} .mission-result-card:first-child,
  .${RESULT_CLASS} .mission-result-performance:nth-child(5){min-height:78px;padding:11px 13px}
  .${RESULT_CLASS} .mission-result-card:first-child .mission-result-value{font-size:36px}
  .${RESULT_CLASS} .mission-result-performance:nth-child(5) .mission-result-value{font-size:31px}
  .${RESULT_CLASS} .mission-result-value{font-size:15px}
  .${RESULT_CLASS} .mission-result-sub{font-size:7.5px}
  .${RESULT_CLASS} .mission-result-total{min-height:54px}
}

@media (prefers-reduced-motion:reduce){
  .${RESULT_CLASS} .mission-result-card,
  #finish .outcome .primary{transition:none}
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

export function buildMissionResults() {
  const finish = document.getElementById('finish');
  if (!finish || finish.classList.contains('hidden')) return;
  installStyle();

  const state = loadState();
  const breakdown = state.lastXpBreakdown || {};
  const performance = getPerformanceResult();

  // UPDATE 12: Performance V1 is authoritative for its own grade/metrics.
  // Existing Run Score remains untouched and continues to come from the existing Results flow.
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
  // Performance V1 publishes after mission completion; refresh once its authoritative result exists.
  window.addEventListener('relay:mission-performance-complete', () => window.requestAnimationFrame(buildMissionResults));
}
