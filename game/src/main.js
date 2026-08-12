import Phaser from 'phaser';
import { missions } from './missions.js';
import { completeMission, loadState, saveState } from './state.js';
import { RunnerScene } from './scenes/RunnerScene.js';

const $ = id => document.getElementById(id);
document.querySelector('#intro .menu-brand')?.remove();
let state = loadState();
let missionIndex = 0;
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'phaser-game', width: 1280, height: 720, backgroundColor: '#091225', physics: { default: 'arcade', arcade: { gravity: { y: 1600 }, debug: false } }, scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [RunnerScene] });
game.events.once('runner-ready', () => window.setTimeout(() => $('bootLoader')?.classList.add('is-ready'), 100));
function toast(text) { const element = $('toast'); element.textContent = text; element.classList.add('show'); setTimeout(() => element.classList.remove('show'), 1700); }
function nextMissionIndex() { const index = missions.findIndex(mission => !state.completed.includes(mission.id)); return index === -1 ? missions.length - 1 : index; }
function renderMissionPreview() {
  const index = nextMissionIndex();
  const mission = missions[index];
  const allComplete = state.completed.length === missions.length;
  const hasProgress = state.xp || state.signals || state.completed.length;
  const preview = document.querySelector('.mission-preview');
  const route = preview.querySelector('.preview-route');
  let details = preview.querySelector('.preview-details');
  if (!route.querySelector('.route-map')) { const map = document.createElement('span'); map.className = 'route-map'; map.setAttribute('aria-hidden', 'true'); route.append(map); }
  if (!details) { details = document.createElement('small'); details.className = 'preview-details'; preview.insertBefore(details, preview.querySelector('.preview-status')); }
  preview.querySelector('small').textContent = `MISSION ${String(index + 1).padStart(2, '0')}`;
  preview.querySelector('strong').textContent = mission.title.toUpperCase();
  details.textContent = `${mission.district.toUpperCase()} · ${mission.reward} XP · ${mission.signals.length} SIGNALS`;
  preview.querySelector('.preview-status').textContent = allComplete ? 'ALL ROUTES COMPLETE' : hasProgress ? 'NEW ROUTE' : 'IN PROGRESS';
  preview.setAttribute('aria-label', `Current mission: ${mission.title}`);
}
function renderStreak() {
  const home = document.querySelector('.home-progress');
  let homeStreak = home.querySelector('.home-streak');
  if (!homeStreak) { homeStreak = document.createElement('p'); homeStreak.className = 'home-streak'; home.append(homeStreak); }
  homeStreak.textContent = state.streak ? `${state.streak} NIGHT STREAK${state.streak === 1 ? '' : 'S'}` : 'BEGIN YOUR NIGHT STREAK';

  const outcome = $('finish').querySelector('.outcome');
  let finishStreak = outcome.querySelector('.finish-streak');
  if (!finishStreak) { finishStreak = document.createElement('p'); finishStreak.className = 'finish-streak'; outcome.querySelector('.reward').after(finishStreak); }
  finishStreak.textContent = state.lastStreakBonus ? `NIGHT STREAK ${state.streak} · +${state.lastStreakBonus} BONUS XP` : `NIGHT STREAK ${state.streak} · RETURN TOMORROW FOR A BONUS`;
}
function renderHomeProgress() { $('homeXp').textContent = String(state.xp).padStart(4, '0'); $('homeCompleted').textContent = state.completed.length; $('homeSignals').textContent = state.signals; $('continue').classList.toggle('hidden', !(state.xp || state.signals || state.completed.length)); renderMissionPreview(); renderStreak(); }
function missionUnlocked(index) { return index === 0 || state.completed.includes(missions[index - 1].id); }
function launch(index = missionIndex, paused = false) { missionIndex = index; const mission = missions[index]; $('intro').classList.toggle('hidden', !paused); $('play').classList.remove('hidden'); $('signalCount').textContent = '00'; $('progress').style.width = '0%'; $('hudXp').textContent = String(state.xp).padStart(4, '0'); $('district').textContent = mission.district.toUpperCase(); $('objective').textContent = mission.title.toUpperCase(); $('worldGoal').textContent = `DELIVER: ${mission.title.toUpperCase()}`; game.scene.start('runner', { mission, rain: state.rain }); if (paused) game.scene.pause('runner'); }
function complete(signals) { const mission = missions[missionIndex]; state = completeMission(state, mission, signals); renderHomeProgress(); $('hudXp').textContent = String(state.xp).padStart(4, '0'); $('play').classList.add('hidden'); $('finishSignals').textContent = `${signals} / ${mission.signals.length} SIGNALS`; $('finishXp').textContent = `+${mission.reward + state.lastStreakBonus}`; $('finishLine').textContent = mission.unlocks ? `${mission.unlocks} is now available in the mission terminal.` : 'The last relay hums awake across the water.'; $('finish').classList.remove('hidden'); }
function fail(message) { $('play').classList.add('hidden'); $('failLine').textContent = message; $('gameOver').classList.remove('hidden'); }
function openMenu(tab = 'resume') { if (game.scene.isActive('runner')) game.scene.pause('runner'); $('pauseMenu').classList.remove('hidden'); renderPanel(tab); }
function closeMenu() { $('pauseMenu').classList.add('hidden'); if (game.scene.isPaused('runner')) game.scene.resume('runner'); }
function openTitlePanel(panel) {
  const content = panel === 'controls'
    ? { eyebrow: 'HOW TO RUN', title: 'KEEP MOVING.', body: '<p>Use <b>A</b> and <b>D</b> to run. Press <b>SPACE</b> to jump. Pause with <b>ESC</b>.</p>' }
    : { eyebrow: 'CREDITS', title: 'RELAY RUNNER', body: '<p>Created as a small night-runner prototype with Phaser 3.</p>' };
  $('titlePanelEyebrow').textContent = content.eyebrow; $('titlePanelHeading').textContent = content.title; $('titlePanelContent').innerHTML = content.body; $('titlePanel').classList.remove('hidden');
}
function closeTitlePanel() { $('titlePanel').classList.add('hidden'); }
function leaveHome(next) {
  const intro = $('intro');
  if (intro.classList.contains('is-leaving')) return;
  intro.classList.add('is-leaving');
  window.setTimeout(() => { intro.classList.add('hidden'); intro.classList.remove('is-leaving'); next(); }, 240);
}
function toggleSetting(name) {
  if (name === 'rain') state = { ...state, rain: !state.rain };
  if (name === 'muted') state = { ...state, muted: !state.muted };
  saveState(state);
  if (name === 'rain') game.scene.getScene('runner').rain?.setVisible(state.rain);
  const buttons = $('panelContent').querySelectorAll('.setting button');
  const audioEnabled = !state.muted;
  buttons[0]?.classList.toggle('is-on', state.rain);
  buttons[0]?.setAttribute('aria-pressed', String(state.rain));
  buttons[0] && (buttons[0].textContent = state.rain ? 'ON' : 'OFF');
  buttons[1]?.classList.toggle('is-on', audioEnabled);
  buttons[1]?.setAttribute('aria-pressed', String(audioEnabled));
  buttons[1] && (buttons[1].textContent = audioEnabled ? 'ON' : 'OFF');
  toast(`${name === 'rain' ? 'ATMOSPHERIC RAIN' : 'GAME AUDIO'} ${name === 'rain' ? state.rain : audioEnabled ? 'ON' : 'OFF'}`);
}
function renderPanel(tab) {
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  const area = $('panelContent');
  if (tab === 'resume') area.innerHTML = '<p class="panel-copy">Your boots are still on the roof. The relay is still lit. The city is waiting for the next step.</p><button id="resume" class="primary">RESUME RUN <b>→</b></button>';
  if (tab === 'missions') area.innerHTML = `<div class="journal">${missions.map((mission, index) => { const unlocked = missionUnlocked(index); const done = state.completed.includes(mission.id); return `<button class="entry mission-entry" data-mission="${index}" ${unlocked ? '' : 'disabled'}><span>0${index + 1} · ${done ? 'DONE' : unlocked ? 'READY' : 'LOCKED'}</span><div><b>${mission.title}</b><small>${unlocked ? `${mission.district} · ${mission.reward} XP reward` : 'Previous delivery required.'}</small><div class="entry-progress"><i style="width:${done ? 100 : 0}%"></i></div></div><span>${unlocked ? '→' : '—'}</span></button>`; }).join('')}</div>`;
  if (tab === 'progress') area.innerHTML = `<div class="journal"><article class="entry"><span>COURIER</span><div><b>Level ${state.level}</b><small>${state.xp} XP logged across the night shift.</small><div class="entry-progress"><i style="width:${state.xp % 250 / 2.5}%"></i></div></div><span>${state.signals}/18</span></article><article class="entry"><span>STATUS</span><div><b>${state.completed.length} deliveries complete</b><small>New routes appear as relays come online.</small></div><span>✓</span></article></div>`;
  if (tab === 'settings') area.innerHTML = `<div class="settings"><div class="setting"><span>Atmospheric rain</span><button class="setting-toggle ${state.rain ? 'is-on' : ''}" type="button" aria-pressed="${state.rain}">${state.rain ? 'ON' : 'OFF'}</button></div><div class="setting"><span>Game audio</span><button class="setting-toggle ${state.muted ? '' : 'is-on'}" type="button" aria-pressed="${!state.muted}">${state.muted ? 'OFF' : 'ON'}</button></div></div>`;
  $('resume')?.addEventListener('click', closeMenu);
  document.querySelectorAll('[data-mission]').forEach(button => button.addEventListener('click', () => launch(Number(button.dataset.mission))));
}
game.events.on('signal', count => toast(`SIGNAL CAPTURED · ${count}/18`)); game.events.on('progress', value => { $('progress').style.width = `${value}%`; }); game.events.on('complete', complete); game.events.on('fail', fail);
document.querySelectorAll('[data-title-panel]').forEach(button => { button.classList.add('play-button', 'utility-play-button'); button.addEventListener('click', () => openTitlePanel(button.dataset.titlePanel)); });
$('closeTitlePanel').addEventListener('click', closeTitlePanel);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('titlePanel').classList.contains('hidden')) { event.stopImmediatePropagation(); closeTitlePanel(); } }, true);
$('start').onclick = () => leaveHome(() => game.scene.resume('runner')); $('continue').onclick = () => leaveHome(() => launch(nextMissionIndex())); $('pause').onclick = () => openMenu(); $('returnTitle').onclick = () => { $('pauseMenu').classList.add('hidden'); launch(0, true); }; $('again').onclick = () => { $('finish').classList.add('hidden'); launch(missionIndex); }; $('finishTitle').onclick = () => { $('finish').classList.add('hidden'); launch(0, true); }; $('retry').onclick = () => { $('gameOver').classList.add('hidden'); launch(missionIndex); }; $('failTitle').onclick = () => { $('gameOver').classList.add('hidden'); launch(0, true); }; document.querySelectorAll('.tab').forEach(button => button.onclick = () => renderPanel(button.dataset.tab)); document.querySelectorAll('[data-close]').forEach(button => button.onclick = closeMenu); document.addEventListener('keydown', event => { if (event.key === 'Enter' && !$('intro').classList.contains('hidden')) $('start').click(); if (event.key === 'Escape' && game.scene.isActive('runner')) openMenu(); });
$('panelContent').addEventListener('click', event => { const button = event.target.closest('.setting button'); if (!button) return; toggleSetting(button.closest('.setting').firstElementChild.textContent === 'Atmospheric rain' ? 'rain' : 'muted'); });
renderHomeProgress();
launch(0, true);
