(() => {
  if (window.__relayMenuSettingsInstalled) return;
  window.__relayMenuSettingsInstalled = true;

  const boot = () => {
    const intro = document.getElementById('intro');
    const options = intro?.querySelector('[data-title-panel="controls"]');
    if (!intro || !options) return;

    const panel = document.createElement('div');
    panel.className = 'relay-title-settings hidden';
    panel.innerHTML = `
      <div class="relay-title-settings-card" role="dialog" aria-modal="true" aria-label="Settings">
        <button type="button" class="relay-title-settings-close" aria-label="Close settings">×</button>
        <p class="relay-title-settings-eyebrow">RELAY RUNNER // SETTINGS</p>
        <h2>OPTIONS</h2>
        <label class="relay-setting-row relay-setting-toggle">
          <span><b>MUSIC</b><small>MENU THEME</small></span>
          <input id="relayMusicEnabled" type="checkbox">
        </label>
        <label class="relay-setting-row relay-setting-range">
          <span><b>VOLUME</b><small>MENU MUSIC LEVEL</small></span>
          <input id="relayMusicVolume" type="range" min="0" max="0.16" step="0.005">
          <output id="relayMusicVolumeValue">56%</output>
        </label>
        <p class="relay-settings-note">Your music setting is saved automatically on this device.</p>
      </div>`;
    intro.appendChild(panel);

    const enabled = panel.querySelector('#relayMusicEnabled');
    const volume = panel.querySelector('#relayMusicVolume');
    const value = panel.querySelector('#relayMusicVolumeValue');
    const close = () => panel.classList.add('hidden');
    const music = () => window.relayMenuMusic;

    const sync = () => {
      const api = music();
      enabled.checked = api ? api.enabled : localStorage.getItem('relay_music_enabled') !== '0';
      const current = api ? api.volume : Number(localStorage.getItem('relay_music_volume') || 0.09);
      volume.value = String(current);
      value.textContent = `${Math.round((current / 0.16) * 100)}%`;
    };

    options.addEventListener('click', event => {
      event.preventDefault();
      sync();
      panel.classList.remove('hidden');
    });
    enabled.addEventListener('change', () => music()?.setEnabled(enabled.checked));
    volume.addEventListener('input', () => {
      const current = music()?.setVolume(volume.value) ?? Number(volume.value);
      value.textContent = `${Math.round((current / 0.16) * 100)}%`;
    });
    close.addEventListener('click', close);
    panel.addEventListener('click', event => { if (event.target === panel) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();