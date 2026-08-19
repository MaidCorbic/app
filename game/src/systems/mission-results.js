import { loadState } from '../state.js';

const RESULT_CLASS = 'mission-results-panel';
const style = `
/* UPDATE 13 — Mission Results UI Polish
   Visual-only layer. Existing result data, DOM IDs, buttons and gameplay ownership remain untouched. */
#finish{
  z-index:70!important;
  background:
    radial-gradient(circle at 50% 8%,rgba(255,208,110,.12),transparent 30%),
    radial-gradient(circle at 12% 70%,rgba(56,189,248,.055),transparent 28%),
    radial-gradient(circle at 88% 72%,rgba(168,85,247,.045),transparent 28%),
    linear-gradient(180deg,#050c17 0%,#020711 55%,#01040a 100%)!important;
  overflow:auto!important;
  scrollbar-width:thin;
  scrollbar-color:rgba(255,208,110,.35) transparent;
}
#finish::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity:.34;
  background:
    linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);
  background-size:42px 42px;
  mask-image:linear-gradient(to bottom,black,transparent 88%);
}
#finish .outcome{
  position:relative;
  z-index:71;
  width:min(900px,calc(100vw - 28px));
  max-height:calc(100dvh - 28px);
  overflow:auto;
  padding:clamp(22px,4vw,42px)!important;
  border:1px solid rgba(255,208,110,.20);
  border-radius:20px;
  background:
    linear-gradient(145deg,rgba(8,18,32,.985),rgba(3,8,15,.985)),
    radial-gradient(circle at 50% 0%,rgba(255,208,110,.08),transparent 42%);
  box-shadow:
    0 30px 100px rgba(0,0,0,.68),
    0 0 80px rgba(255,208,110,.055),
    inset 0 1px 0 rgba(255,255,255,.045);
  box-sizing:border-box;
  isolation:isolate;
}
#finish .outcome::before,
#finish .outcome::after{
  content:"";
  position:absolute;
  pointer-events:none;
  z-index:-1;
}
#finish .outcome::before{
  inset:12px;
  border:1px solid rgba(150,190,255,.055);
  border-radius:14px;
}
#finish .outcome::after{
  width:180px;
  height:180px;
  top:-80px;
  left:50%;
  transform:translateX(-50%);
  background:radial-gradient(circle,rgba(255,208,110,.12),transparent 68%);
  filter:blur(8px);
}

/* Existing headline/reward content — presentation only. */
#finish .outcome .eyebrow,
#finish .outcome .kicker,
#finish .outcome .label{
  letter-spacing:.24em;
}
#finish .outcome h1,
#finish .outcome h2{
  text-shadow:0 0 30px rgba(255,208,110,.10);
}
#finish .outcome .reward{
  position:relative;
  margin:clamp(18px,3vw,28px) auto 8px!important;
  padding:12px 16px!important;
  text-align:center;
  border:1px solid rgba(255,208,110,.14);
  border-radius:14px;
  background:linear-gradient(180deg,rgba(255,208,110,.055),rgba(255,208,110,.012));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
}

.${RESULT_CLASS}{
  position:relative;
  margin:22px auto 16px;
  width:min(100%,780px);
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:10px;
  text-align:left;
}
.${RESULT_CLASS} .mission-result-card{
  position:relative;
  min-width:0;
  overflow:hidden;
  padding:14px 15px;
  border:1px solid rgba(150,190,255,.15);
  border-radius:14px;
  background:linear-gradient(145deg,rgba(10,23,43,.82),rgba(5,12,25,.76));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.035),
    0 10px 28px rgba(0,0,0,.18);
  transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease;
}
.${RESULT_CLASS} .mission-result-card::before{
  content:"";
  position:absolute;
  top:0;
  left:14px;
  right:14px;
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(150,190,255,.28),transparent);
  opacity:.8;
}
.${RESULT_CLASS} .mission-result-card:hover{
  transform:translateY(-1px);
  border-color:rgba(150,190,255,.25);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 14px 32px rgba(0,0,0,.22);
}
.${RESULT_CLASS} .mission-result-label{
  display:block;
  color:rgba(210,224,244,.62);
  font-size:9px;
  line-height:1.2;
  font-weight:700;
  letter-spacing:.18em;
  margin-bottom:7px;
}
.${RESULT_CLASS} .mission-result-value{
  display:block;
  color:#f5f8fc;
  font-size:18px;
  font-weight:850;
  line-height:1.05;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  text-shadow:0 2px 14px rgba(0,0,0,.25);
}
.${RESULT_CLASS} .mission-result-sub{
  display:block;
  color:rgba(203,216,234,.50);
  font-size:9px;
  line-height:1.25;
  letter-spacing:.03em;
  margin-top:6px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.${RESULT_CLASS} .mission-result-wide{grid-column:span 2}

/* Grade card becomes the visual rank anchor without changing markup. */
.${RESULT_CLASS} .mission-result-card:first-child{
  grid-column:span 2;
  min-height:118px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:18px 22px;
  border-color:rgba(255,208,110,.32);
  background:
    radial-gradient(circle at 82% 50%,rgba(255,208,110,.12),transparent 42%),
    linear-gradient(145deg,rgba(255,208,110,.075),rgba(8,18,38,.76));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 0 34px rgba(255,208,110,.045),
    0 12px 34px rgba(0,0,0,.24);
}
.${RESULT_CLASS} .mission-result-card:first-child .mission-result-value{
  font-size:clamp(34px,5vw,54px);
  line-height:.9;
  color:#ffd06e;
  letter-spacing:.02em;
  text-shadow:0 0 24px rgba(255,208,110,.18);
}
.${RESULT_CLASS} .mission-result-card:first-child .mission-result-sub{
  margin-top:9px;
  color:rgba(255,224,158,.58);
}

/* Performance card is the hero metric. */
.${RESULT_CLASS} .mission-result-performance:nth-child(5){
  grid-column:span 2;
  min-height:118px;
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:18px 22px;
  border-color:rgba(255,208,110,.34);
  background:
    radial-gradient(circle at 90% 50%,rgba(255,208,110,.13),transparent 38%),
    linear-gradient(145deg,rgba(255,208,110,.09),rgba(8,18,38,.82));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 0 36px rgba(255,208,110,.055),
    0 12px 34px rgba(0,0,0,.24);
}
.${RESULT_CLASS} .mission-result-performance:nth-child(5) .mission-result-value{
  font-size:clamp(30px,4.5vw,46px);
  line-height:.95;
  color:#fff4d4;
  letter-spacing:.01em;
}
.${RESULT_CLASS} .mission-result-performance:nth-child(5) .mission-result-sub{
  color:rgba(255,224,158,.68);
  margin-top:9px;
  font-size:9px;
  letter-spacing:.05em;
}

.${RESULT_CLASS} .mission-result-total{
  grid-column:1/-1;
  min-height:72px;
  border-color:rgba(255,208,110,.28);
  background:
    linear-gradient(90deg,rgba(255,208,110,.085),rgba(255,208,110,.025) 50%,rgba(255,208,110,.07));
}
.${RESULT_CLASS} .mission-result-total .mission-result-value{
  color:#ffd06e;
}
.${RESULT_CLASS} .mission-result-total::after{
  content:"";
  position:absolute;
  right:-50px;
  bottom:-70px;
  width:180px;
  height:130px;
  background:radial-gradient(circle,rgba(255,208,110,.10),transparent 68%);
  pointer-events:none;
}

#finish .outcome .primary{
  position:relative;
  z-index:72;
  touch-action:manipulation;
  transition:transform .18s ease,box-shadow .18s ease,filter .18s ease;
}
#finish .outcome .primary:hover{
  transform:translateY(-2px);
  filter:brightness(1.04);
  box-shadow:0 10px 30px rgba(255,208,110,.16);
}
#finish .outcome .primary:active{transform:translateY(0) scale(.985)}

@media (max-width:700px){
  #finish .outcome{
    width:calc(100vw - 14px);
    max-height:calc(100dvh - 14px);
    padding:18px 12px!important;
    border-radius:16px;
  }
  #finish .outcome::before{inset:8px;border-radius:11px}
  #finish .outcome .reward{margin:14px auto 6px!important;padding:10px 12px!important}
  .${RESULT_CLASS}{
    grid-template-columns:repeat(2,minmax(0,1fr));
    width:100%;
    gap:7px;
    margin:14px auto 10px;
  }
  .${RESULT_CLASS} .mission-result-card{
    padding:11px 11px;
    border-radius:11px;
  }
  .${RESULT_CLASS} .mission-result-card:first-child,
  .${RESULT_CLASS} .mission-result-performance:nth-child(5),
  .${RESULT_CLASS} .mission-result-wide,
  .${RESULT_CLASS} .mission-result-total{
    grid-column:span 2;
  }
  .${RESULT_CLASS} .mission-result-card:first-child,
  .${RESULT_CLASS} .mission-result-performance:nth-child(5){
    min-height:92px;
    padding:14px 15px;
  }
  .${RESULT_CLASS} .mission-result-card:first-child .mission-result-value{
    font-size:42px;
  }
  .${RESULT_CLASS} .mission-result-performance:nth-child(5) .mission-result-value{
    font-size:34px;
  }
  .${RESULT_CLASS} .mission-result-value{font-size:16px}
  .${RESULT_CLASS} .mission-result-sub{font-size:8px}
  .${RESULT_CLASS} .mission-result-total{min-height:66px}
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
