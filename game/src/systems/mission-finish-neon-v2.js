const FINISH_ID = 'missionFinishNeonV2';

const style = `
body.mission-terminal-active .hud,
body.mission-terminal-active .world-marker,
body.mission-terminal-active .input-guide,
body.mission-terminal-active .mobile-controls,
body.mission-terminal-active .gameplay-event-hud,
body.mission-terminal-active #phaser-game + .vignette{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
body.mission-terminal-active #play{pointer-events:none!important}
#finish{z-index:900!important;display:grid!important;place-items:center!important;isolation:isolate!important;overflow:auto!important;padding:max(18px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))!important;background:#02050b!important}
#finish::before{content:''!important;position:fixed!important;inset:0!important;z-index:-2!important;opacity:1!important;background:radial-gradient(circle at 50% 10%,rgba(0,239,255,.14),transparent 31%),radial-gradient(circle at 12% 90%,rgba(134,73,255,.16),transparent 36%),radial-gradient(circle at 88% 76%,rgba(0,130,255,.13),transparent 33%),linear-gradient(180deg,#050a14 0%,#02050b 100%)!important;mask:none!important}
#finish::after{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(rgba(102,241,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(102,241,255,.035) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(ellipse at center,black 0%,transparent 74%)}
#finish .outcome{position:relative!important;width:min(960px,100%)!important;max-height:none!important;min-height:0!important;margin:auto!important;padding:0!important;overflow:visible!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}
#finish .outcome::before{display:none!important}
#finish .outcome>.outcome-mark,#finish .outcome>.eyebrow,#finish .outcome>h2,#finish .outcome>#finishLine,#finish .outcome>.reward,#finish .outcome>.mission-results-panel{display:none!important}
#${FINISH_ID}{position:relative;isolation:isolate;box-sizing:border-box;width:100%;padding:clamp(24px,5vw,58px);border:1px solid rgba(105,238,255,.24);border-radius:30px;background:linear-gradient(145deg,rgba(9,18,33,.96),rgba(3,7,15,.985));box-shadow:0 36px 100px rgba(0,0,0,.58),0 0 0 1px rgba(255,255,255,.025) inset,0 0 70px rgba(0,220,255,.08);overflow:hidden;user-select:none;-webkit-user-select:none}
#${FINISH_ID}::before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,rgba(102,241,255,.07),transparent 20%,transparent 74%,rgba(157,108,255,.06));clip-path:polygon(0 0,100% 0,100% 100%,0 100%)}
#${FINISH_ID}::after{content:'';position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:repeating-linear-gradient(90deg,transparent 0 62px,rgba(102,241,255,.025) 63px,transparent 64px);opacity:.6}
.finish-neon-header,.finish-neon-grid,.finish-neon-actions,.finish-neon-return{position:relative;z-index:1}
.finish-neon-header{text-align:center;max-width:700px;margin:0 auto 30px}
.finish-neon-kicker{display:flex;align-items:center;justify-content:center;gap:10px;margin:0 0 14px;color:#77efff;font:800 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.28em;text-transform:uppercase}.finish-neon-kicker::before,.finish-neon-kicker::after{content:'';width:46px;height:1px;background:linear-gradient(90deg,transparent,#58eaff)}.finish-neon-kicker::after{transform:scaleX(-1)}
.finish-neon-title{margin:0;color:#f6fbff;font-size:clamp(42px,9vw,92px);line-height:.88;letter-spacing:-.055em;font-weight:950;text-transform:uppercase;text-shadow:0 0 38px rgba(89,235,255,.14)}
.finish-neon-title em{display:block;margin-top:9px;color:#67ecff;font-style:normal;font-size:.38em;letter-spacing:.42em;text-shadow:0 0 28px rgba(84,230,255,.44)}
.finish-neon-subtitle{max-width:620px;margin:18px auto 0;color:rgba(219,235,250,.68);font-size:clamp(13px,2vw,17px);line-height:1.55}
.finish-neon-grid{display:grid;grid-template-columns:1.15fr repeat(3,1fr);gap:12px;max-width:820px;margin:0 auto 18px}.finish-neon-card{min-width:0;padding:17px 16px;border:1px solid rgba(133,204,255,.14);border-radius:18px;background:linear-gradient(145deg,rgba(18,35,58,.82),rgba(6,13,26,.9));box-shadow:inset 0 1px 0 rgba(255,255,255,.04);overflow:hidden}.finish-neon-card--primary{border-color:rgba(101,237,255,.38);background:linear-gradient(145deg,rgba(11,90,120,.34),rgba(7,18,35,.96));box-shadow:0 0 34px rgba(74,223,255,.08),inset 0 1px 0 rgba(255,255,255,.06)}.finish-neon-card--wide{grid-column:span 2}.finish-neon-label{display:block;margin-bottom:8px;color:rgba(190,219,240,.55);font:800 9px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.19em;text-transform:uppercase}.finish-neon-value{display:block;color:#f4fbff;font-size:clamp(20px,3.4vw,34px);font-weight:900;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}.finish-neon-card--primary .finish-neon-value{color:#9af7ff;font-size:clamp(34px,6vw,58px)}.finish-neon-meta{display:block;margin-top:8px;color:rgba(193,214,235,.56);font-size:10px;line-height:1.35;letter-spacing:.08em;overflow-wrap:anywhere}
.finish-neon-actions{display:grid;grid-template-columns:1fr 1.18fr;gap:12px;max-width:820px;margin:22px auto 0}.finish-neon-actions #again,.finish-neon-actions #nextMission{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;min-height:70px!important;margin:0!important;padding:14px 20px!important;border-radius:17px!important;font:900 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace!important;letter-spacing:.15em!important;text-transform:uppercase!important;touch-action:manipulation!important;cursor:pointer!important;user-select:none!important;-webkit-user-select:none!important;transition:transform .16s ease,filter .16s ease,box-shadow .16s ease!important}.finish-neon-actions #again{border:1px solid rgba(168,123,255,.5)!important;background:linear-gradient(135deg,rgba(105,63,183,.55),rgba(31,20,67,.92))!important;color:#f3edff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 14px 30px rgba(0,0,0,.25)!important}.finish-neon-actions #nextMission{border:1px solid rgba(100,240,255,.72)!important;background:linear-gradient(135deg,rgba(8,176,206,.95),rgba(11,63,112,.98))!important;color:#f3feff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 14px 36px rgba(0,0,0,.3),0 0 34px rgba(63,224,255,.16)!important}.finish-neon-actions #again::before{content:'↻';font-size:20px;margin-right:9px}.finish-neon-actions #nextMission::after{content:'→';font-size:20px;margin-left:9px}.finish-neon-actions button:active{transform:scale(.985)!important}.finish-neon-actions button:focus-visible{outline:2px solid #d7fbff;outline-offset:3px}.finish-neon-return{display:flex;justify-content:center;margin-top:14px}.finish-neon-return #finishTitle{display:inline-flex!important;margin:0!important;padding:9px 12px!important;background:transparent!important;border:0!important;color:rgba(184,211,233,.55)!important;font:800 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace!important;letter-spacing:.15em!important;text-transform:uppercase!important;user-select:none!important}
@media (hover:hover){.finish-neon-actions button:hover{transform:translateY(-2px)!important;filter:brightness(1.1)}.finish-neon-actions #again:hover{box-shadow:0 20px 42px rgba(0,0,0,.35),0 0 30px rgba(165,116,255,.18)!important}.finish-neon-actions #nextMission:hover{box-shadow:0 20px 44px rgba(0,0,0,.35),0 0 48px rgba(73,229,255,.26)!important}}
@media(max-width:700px){#finish{place-items:start center!important;padding:10px max(10px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))!important}#${FINISH_ID}{padding:28px 14px 18px;border-radius:22px}.finish-neon-header{margin-bottom:20px}.finish-neon-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.finish-neon-card{padding:13px 11px;border-radius:14px}.finish-neon-card--wide{grid-column:span 2}.finish-neon-actions{grid-template-columns:1fr;gap:9px;margin-top:16px}.finish-neon-actions #again,.finish-neon-actions #nextMission{min-height:60px!important;font-size:11px!important}.finish-neon-return{margin-top:9px}}
@media(max-width:390px){.finish-neon-title{font-size:38px}.finish-neon-card{padding:11px 9px}.finish-neon-value{font-size:18px}.finish-neon-card--primary .finish-neon-value{font-size:34px}.finish-neon-meta{font-size:8px}.finish-neon-kicker{font-size:8px}}
@media(prefers-reduced-motion:reduce){#${FINISH_ID} *{transition:none!important;animation:none!important}}
`;

function install() {
  if (document.getElementById('mission-finish-neon-v2-style')) return;
  const node = document.createElement('style');
  node.id = 'mission-finish-neon-v2-style';
  node.textContent = style;
  document.head.appendChild(node);
}

const text = id => document.getElementById(id)?.textContent?.trim() || '';
const stripPrefix = (value, prefix) => String(value || '').replace(prefix, '').trim();

function shell() {
  const outcome = document.querySelector('#finish .outcome');
  if (!outcome) return null;
  let root = outcome.querySelector(`#${FINISH_ID}`);
  if (root) return root;
  root = document.createElement('section');
  root.id = FINISH_ID;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Mission completion');
  root.innerHTML = '<header class="finish-neon-header"><p class="finish-neon-kicker">MISSION COMPLETE</p><h1 class="finish-neon-title">DELIVERY<em>SECURED</em></h1><p class="finish-neon-subtitle"></p></header><div class="finish-neon-grid"></div><div class="finish-neon-actions"></div><div class="finish-neon-return"></div>';
  outcome.appendChild(root);
  return root;
}

function render() {
  const finish = document.getElementById('finish');
  if (!finish || finish.classList.contains('hidden')) return;
  const root = shell();
  if (!root) return;
  document.body.classList.add('mission-terminal-active');
  const subtitle = text('finishLine') || 'Delivery data synchronized with the relay network.';
  const xp = text('finishXp') || '+0 XP';
  const signals = text('finishSignals') || '0 / 0 SIGNALS';
  const score = stripPrefix(text('finishScore'), 'RUN SCORE') || '0';
  const time = stripPrefix(text('finishTime'), 'TIME').split('·')[0].trim() || '--:--.--';
  const grade = text('finishRating') || '—';
  root.querySelector('.finish-neon-subtitle').textContent = subtitle;
  root.querySelector('.finish-neon-grid').innerHTML = `
    <article class="finish-neon-card finish-neon-card--primary"><span class="finish-neon-label">MISSION GRADE</span><strong class="finish-neon-value">${grade}</strong><small class="finish-neon-meta">RUN QUALITY LOCKED</small></article>
    <article class="finish-neon-card"><span class="finish-neon-label">TIME</span><strong class="finish-neon-value">${time}</strong><small class="finish-neon-meta">FINAL SPLIT</small></article>
    <article class="finish-neon-card"><span class="finish-neon-label">SIGNALS</span><strong class="finish-neon-value">${signals.replace(' SIGNALS','')}</strong><small class="finish-neon-meta">RELAY CAPTURED</small></article>
    <article class="finish-neon-card"><span class="finish-neon-label">RUN SCORE</span><strong class="finish-neon-value">${score}</strong><small class="finish-neon-meta">MISSION TOTAL</small></article>
    <article class="finish-neon-card finish-neon-card--wide"><span class="finish-neon-label">REWARD</span><strong class="finish-neon-value">${xp}</strong><small class="finish-neon-meta">XP COMMITTED TO COURIER PROFILE</small></article>
    <article class="finish-neon-card finish-neon-card--wide"><span class="finish-neon-label">STATUS</span><strong class="finish-neon-value">ROUTE CLEARED</strong><small class="finish-neon-meta">READY FOR THE NEXT DELIVERY</small></article>`;
  const actions = root.querySelector('.finish-neon-actions');
  const again = document.getElementById('again');
  const next = document.getElementById('nextMission');
  const title = document.getElementById('finishTitle');
  if (again && again.parentElement !== actions) actions.appendChild(again);
  if (next && !next.classList.contains('hidden') && next.parentElement !== actions) actions.appendChild(next);
  if (title && title.parentElement !== root.querySelector('.finish-neon-return')) root.querySelector('.finish-neon-return').appendChild(title);
}

function syncTerminal() {
  const finish = document.getElementById('finish');
  const active = Boolean(finish && !finish.classList.contains('hidden'));
  document.body.classList.toggle('mission-terminal-active', active);
  if (active) requestAnimationFrame(render);
}

function bind() {
  install();
  const finish = document.getElementById('finish');
  if (!finish) return;
  new MutationObserver(syncTerminal).observe(finish, { attributes:true, attributeFilter:['class'], childList:true, subtree:true });
  window.addEventListener('relay:mission-complete', () => requestAnimationFrame(render));
  window.addEventListener('relay:mission-performance-complete', () => requestAnimationFrame(render));
  document.addEventListener('click', event => {
    if (event.target.closest('#again,#nextMission,#finishTitle')) document.body.classList.remove('mission-terminal-active');
  }, true);
  syncTerminal();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once:true }); else bind();
