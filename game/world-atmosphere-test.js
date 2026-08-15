(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') !== 'atmosphere') return;
  if (window.__relayAtmosphereTestInstalled) return;
  window.__relayAtmosphereTestInstalled = true;

  const root = document.getElementById('intro');
  if (!root) return;

  const themes = [
    ['dawn', 'DAWN', '05:00–08:00', 6.5],
    ['day', 'DAY', '08:00–18:00', 12],
    ['dusk', 'DUSK', '18:00–20:00', 19],
    ['night', 'NIGHT', '20:00–23:00', 21.5],
    ['deep-night', 'DEEP NIGHT', '23:00–05:00', 1.5]
  ];

  const panel = document.createElement('aside');
  panel.className = 'relay-atmosphere-test';
  panel.setAttribute('aria-label', 'Atmosphere development tester');
  panel.innerHTML = `
    <div class="relay-atmosphere-test__head">
      <div><strong>ATMOSPHERE TEST</strong><small>DEVELOPMENT ONLY · SIMULATED TIME</small></div>
      <button type="button" data-atm-close aria-label="Close tester">×</button>
    </div>
    <div class="relay-atmosphere-test__buttons"></div>
    <div class="relay-atmosphere-test__status" aria-live="polite"></div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .relay-atmosphere-test{position:fixed;z-index:9999;top:18px;left:18px;width:min(270px,calc(100vw - 36px));box-sizing:border-box;padding:12px;border:1px solid rgba(255,208,110,.3);border-radius:10px;background:rgba(4,10,19,.95);box-shadow:0 18px 50px rgba(0,0,0,.55),0 0 24px rgba(255,208,110,.08);backdrop-filter:blur(14px);color:#eef2f6;font-family:'DM Mono',monospace}
    .relay-atmosphere-test__head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}.relay-atmosphere-test__head strong{display:block;color:#ffd06e;font-size:9px;letter-spacing:1px}.relay-atmosphere-test__head small{display:block;margin-top:3px;color:#65758a;font-size:6.5px;letter-spacing:.55px}.relay-atmosphere-test__head button{width:26px;height:26px;border:1px solid rgba(255,255,255,.14);border-radius:5px;background:#08111f;color:#aeb9c8;cursor:pointer;font-size:16px;line-height:1}.relay-atmosphere-test__buttons{display:grid;grid-template-columns:1fr 1fr;gap:6px}.relay-atmosphere-test__buttons button{min-height:40px;padding:7px 8px;border:1px solid rgba(217,231,244,.12);border-radius:6px;background:#08111f;color:#aeb9c8;cursor:pointer;text-align:left;font:800 8px 'DM Mono',monospace;letter-spacing:.5px;touch-action:manipulation}.relay-atmosphere-test__buttons button:hover,.relay-atmosphere-test__buttons button.is-active{border-color:rgba(255,208,110,.55);background:rgba(255,208,110,.08);color:#ffd06e}.relay-atmosphere-test__buttons button span{display:block;margin-top:3px;color:#5f7085;font-size:6px;font-weight:700}.relay-atmosphere-test__status{margin-top:9px;padding-top:8px;border-top:1px solid rgba(255,255,255,.07);color:#708197;font-size:7px;letter-spacing:.4px;line-height:1.45}.relay-atmosphere-test__status b{color:#dbe5ed}.relay-atmosphere-test__status i{color:#ffd06e;font-style:normal}@media(max-width:480px){.relay-atmosphere-test{top:10px;left:10px;width:min(230px,calc(100vw - 20px));padding:10px}.relay-atmosphere-test__buttons button{min-height:38px}}
  `;
  document.head.appendChild(style);
  document.body.appendChild(panel);

  const buttons = panel.querySelector('.relay-atmosphere-test__buttons');
  const status = panel.querySelector('.relay-atmosphere-test__status');
  const setTheme = (theme, hour) => {
    if (typeof window.__relaySetAtmosphereDebugHour === 'function') {
      window.__relaySetAtmosphereDebugHour(hour);
    } else {
      root.dataset.atmosphere = theme;
    }
    root.classList.remove('atmosphere-shift');
    void root.offsetWidth;
    root.classList.add('atmosphere-shift');
    buttons.querySelectorAll('button').forEach(button => button.classList.toggle('is-active', button.dataset.theme === theme));
    const meta = themes.find(item => item[0] === theme);
    const displayTime = `${String(Math.floor(hour)).padStart(2,'0')}:${String(Math.round((hour % 1) * 60) % 60).padStart(2,'0')}`;
    status.innerHTML = `SIMULATED TIME <b>${displayTime}</b> · <i>${meta?.[1] ?? theme}</i>`;
  };

  themes.forEach(([theme, label, hours, hour]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.theme = theme;
    button.innerHTML = `${label}<span>${hours}</span>`;
    button.addEventListener('click', () => setTheme(theme, hour));
    buttons.appendChild(button);
  });

  const auto = document.createElement('button');
  auto.type = 'button';
  auto.textContent = 'AUTO TIME';
  auto.addEventListener('click', () => {
    if (typeof window.__relayClearAtmosphereDebug === 'function') window.__relayClearAtmosphereDebug();
    buttons.querySelectorAll('button').forEach(button => button.classList.remove('is-active'));
    const now = new Date();
    status.innerHTML = `REAL TIME <b>${now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</b> · <i>AUTO</i>`;
  });
  buttons.appendChild(auto);

  panel.querySelector('[data-atm-close]').addEventListener('click', () => panel.remove());
  const initial = root.dataset.atmosphere || 'night';
  const initialMeta = themes.find(item => item[0] === initial) || themes[3];
  setTheme(initialMeta[0], initialMeta[3]);
})();