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

const report = (error, title = 'GAME RUNTIME ERROR') => {
  console.error(`[Relay Runner] ${title}`, error);
  window.relayLastRuntimeError = { title, error: String(error?.stack || error?.reason?.stack || error?.reason || error || 'Unknown runtime error'), at: Date.now() };
};

if (errors.length) report(errors.join('\n'), 'MISSION DATA ERROR');
window.addEventListener('error', event => report(event.error || event.message));
window.addEventListener('unhandledrejection', event => report(event.reason));

const start = document.getElementById('start');
let bootTimer = 0;
start?.addEventListener('click', () => {
  // Multiple fast clicks must not create overlapping watchdog intervals.
  if (bootTimer) clearInterval(bootTimer);
  const started = Date.now();
  bootTimer = setInterval(() => {
    if (window.strideReady || !document.getElementById('start')) {
      clearInterval(bootTimer);
      bootTimer = 0;
      return;
    }
    if (Date.now() - started > 10000) {
      clearInterval(bootTimer);
      bootTimer = 0;
      report('RunnerScene did not report ready within 10 seconds.', 'MISSION FAILED TO BOOT');
    }
  }, 250);
}, { capture: true });

const speech = window.speechSynthesis;
if (speech && window.SpeechSynthesisUtterance && !window.__relaySpeechGuardInstalled) {
  window.__relaySpeechGuardInstalled = true;
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
    const item = queue.shift(); active = true; item.utterance.voice = pickVoice(item.utterance.text);
    item.utterance.onend = () => { active = false; setTimeout(pump, 90); };
    item.utterance.onerror = () => { active = false; setTimeout(pump, 90); };
    nativeSpeak(item.utterance);
  };
  speech.cancel = () => { nativeCancel(); queue.length = 0; active = false; };
  speech.speak = utterance => {
    const text = String(utterance?.text || '').trim(); if (!text || isNoise(text)) return;
    const now = Date.now(); if (text === lastText && now - lastAt < 900) return;
    lastText = text; lastAt = now; queue.push({ utterance }); if (queue.length > 6) queue.splice(0, queue.length - 6); pump();
  };
}
