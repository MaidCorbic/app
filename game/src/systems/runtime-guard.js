import { missions } from '../missions.js';

const REQUIRED = ['id', 'goal', 'spawn', 'platforms', 'signals', 'checkpoints', 'obstacles', 'movingGates'];
const errors = missions.flatMap(mission => {
  const result = [];
  for (const field of REQUIRED) if (mission?.[field] == null) result.push(`${mission?.id || 'unknown'} missing ${field}`);
  if (!Number.isFinite(mission?.goal?.x) || mission.goal.x < 1000) result.push(`${mission?.id || 'unknown'} invalid goal`);
  if (!Number.isFinite(mission?.spawn?.x) || !Number.isFinite(mission?.spawn?.y)) result.push(`${mission?.id || 'unknown'} invalid spawn`);
  if (!Array.isArray(mission?.platforms) || !mission.platforms.length) result.push(`${mission?.id || 'unknown'} has no platforms`);
  if (!Array.isArray(mission?.signals) || mission.signals.length < 10) result.push(`${mission?.id || 'unknown'} has too few signals`);
  if (!Array.isArray(mission?.checkpoints) || mission.checkpoints.length < 2) result.push(`${mission?.id || 'unknown'} has insufficient checkpoints`);
  return result;
});

window.relayMissionValidation = { ok: errors.length === 0, errors, missionCount: missions.length };

function showError(error, title = 'GAME RUNTIME ERROR') {
  let panel = document.getElementById('runtimeErrorPanel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'runtimeErrorPanel';
    panel.innerHTML = `<div><p>RELAY RUNNER · RECOVERY</p><h2></h2><p>The game hit an unexpected runtime error. Reload to retry.</p><button type="button">RELOAD GAME</button><details><summary>TECHNICAL DETAILS</summary><pre></pre></details></div>`;
    const style = document.createElement('style');
    style.textContent = '#runtimeErrorPanel{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:24px;background:#030711;color:#dffcff;font-family:monospace}#runtimeErrorPanel>div{width:min(720px,100%);padding:28px;border:1px solid #8df4ff;background:#07101f}#runtimeErrorPanel button{padding:12px 18px;background:#8df4ff;color:#07101f;font:inherit;font-weight:700;cursor:pointer}#runtimeErrorPanel pre{white-space:pre-wrap;max-height:220px;overflow:auto}';
    document.head.appendChild(style);
    document.body.appendChild(panel);
    panel.querySelector('button').onclick = () => location.reload();
  }
  panel.querySelector('h2').textContent = title;
  panel.querySelector('pre').textContent = String(error?.stack || error?.reason?.stack || error?.reason || error || 'Unknown runtime error');
  document.getElementById('bootLoader')?.classList.add('is-ready');
}

if (errors.length) showError(errors.join('\n'), 'MISSION DATA ERROR');
window.addEventListener('error', event => showError(event.error || event.message));
window.addEventListener('unhandledrejection', event => showError(event.reason));

const start = document.getElementById('start');
start?.addEventListener('click', () => {
  const started = Date.now();
  const timer = setInterval(() => {
    if (window.strideReady) return clearInterval(timer);
    if (Date.now() - started > 10000) {
      clearInterval(timer);
      showError('RunnerScene did not report ready within 10 seconds.', 'MISSION FAILED TO BOOT');
    }
  }, 250);
}, { capture: true });

// Keep character speech serialized. NIA/MARA keep separate browser voices when available.
const speech = window.speechSynthesis;
if (speech && window.SpeechSynthesisUtterance) {
  const nativeSpeak = speech.speak.bind(speech);
  const nativeCancel = speech.cancel.bind(speech);
  const queue = [];
  let active = false;
  let lastText = '';
  let lastAt = 0;
  const getVoices = () => speech.getVoices?.() || [];
  const pickVoice = text => {
    const available = getVoices();
    const female = available.filter(voice => /female|zira|samantha|victoria|karen|hazel|aria|jenny/i.test(voice.name));
    const english = available.filter(voice => /^en[-_]/i.test(voice.lang));
    if (/^MARA:/i.test(text)) return female[1] || female[0] || english[1] || english[0] || available[0] || null;
    return female[0] || english[0] || available[0] || null;
  };
  const isNoise = text => /^(Boost engaged\.|Barrier cleared\.|Wall jump\.|Signal secured\.|Taking fire\.|Relay linked\.)$/i.test(text.trim());
  const pump = () => {
    if (active || !queue.length) return;
    const item = queue.shift();
    active = true;
    item.utterance.voice = pickVoice(item.utterance.text);
    item.utterance.onend = () => { active = false; setTimeout(pump, 90); };
    item.utterance.onerror = () => { active = false; setTimeout(pump, 90); };
    nativeSpeak(item.utterance);
  };
  speech.cancel = () => { nativeCancel(); for (let i = queue.length - 1; i >= 0; i--) if (queue[i].kind === 'narration') queue.splice(i, 1); active = false; };
  speech.speak = utterance => {
    const text = String(utterance?.text || '').trim();
    if (!text || isNoise(text)) return;
    const now = Date.now();
    if (text === lastText && now - lastAt < 900) return;
    lastText = text; lastAt = now;
    const kind = /^((NIA|MARA):)/i.test(text) || text.length > 24 ? 'narration' : 'response';
    queue.push({ utterance, kind });
    if (queue.length > 6) queue.splice(0, queue.length - 6);
    pump();
  };
}
