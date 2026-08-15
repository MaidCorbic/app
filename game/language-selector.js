(() => {
  if (window.__relayLanguageSelectorInstalled) return;
  window.__relayLanguageSelectorInstalled = true;

  const LANGUAGES = [
    ['en', 'ENGLISH'],
    ['exyu', 'EX-YU'],
    ['es', 'ESPAÑOL'],
    ['de', 'DEUTSCH']
  ];
  const KEY = 'relay-runner-language';
  const get = () => localStorage.getItem(KEY) || 'en';
  const set = code => {
    localStorage.setItem(KEY, code);
    document.documentElement.dataset.language = code;
    window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { code } }));
  };

  const css = document.createElement('style');
  css.textContent = `
    .home-language-setting{position:relative;display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;margin-top:18px;padding:14px 0;border-top:1px solid #d9e7f41c}
    .home-language-copy{display:flex;flex-direction:column;gap:5px;min-width:0}
    .home-language-copy strong{color:#eaf2f8;font:800 11px 'DM Mono',monospace;letter-spacing:.9px;text-transform:uppercase}
    .home-language-copy small{color:#718195;font:700 9px 'DM Mono',monospace;letter-spacing:.45px}
    .relay-language-button{height:40px;min-width:132px;padding:0 14px;border:1px solid #d9e7f433;border-radius:7px;background:linear-gradient(145deg,#0b1729ee,#07101dea);color:#eaf2f8;box-shadow:0 8px 24px #0007;cursor:pointer;font:800 10px 'DM Mono',monospace;letter-spacing:1px}
    .relay-language-button:hover,.relay-language-button:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none;box-shadow:0 0 0 1px #ffd06e22,0 8px 28px #0009}
    .relay-language-menu{position:absolute;right:0;bottom:52px;z-index:500;width:190px;padding:7px;border:1px solid #d9e7f433;border-radius:8px;background:#07101df8;box-shadow:0 18px 50px #000b;backdrop-filter:blur(14px)}
    .relay-language-menu.hidden{display:none}
    .relay-language-option{display:block;width:100%;padding:11px 12px;border:0;border-radius:5px;background:transparent;color:#aebdcc;text-align:left;font:800 10px 'DM Mono',monospace;letter-spacing:.7px;cursor:pointer}
    .relay-language-option:hover,.relay-language-option.active{background:#ffd06e12;color:#ffd06e}
    @media(max-width:600px){
      .home-language-setting{align-items:flex-start;gap:10px}
      .relay-language-button{min-width:118px;height:38px}
      .relay-language-menu{width:170px}
    }
  `;
  document.head.appendChild(css);

  const make = () => {
    const wrap = document.createElement('div');
    wrap.className = 'home-language-setting';

    const copy = document.createElement('div');
    copy.className = 'home-language-copy';
    const title = document.createElement('strong');
    title.textContent = 'LANGUAGE';
    const hint = document.createElement('small');
    hint.textContent = 'Choose the game language';
    copy.append(title, hint);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'relay-language-button';
    button.setAttribute('aria-haspopup', 'listbox');

    const menu = document.createElement('div');
    menu.className = 'relay-language-menu hidden';
    menu.setAttribute('role', 'listbox');

    const refresh = () => {
      const current = get();
      const language = LANGUAGES.find(([code]) => code === current) || LANGUAGES[0];
      button.textContent = `🌐  ${language[1]}`;
      button.setAttribute('aria-label', `Language: ${language[1]}`);
      button.setAttribute('aria-expanded', String(!menu.classList.contains('hidden')));
      menu.querySelectorAll('button').forEach(option => {
        option.classList.toggle('active', option.dataset.lang === language[0]);
        option.setAttribute('aria-selected', String(option.dataset.lang === language[0]));
      });
    };

    LANGUAGES.forEach(([code, name]) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'relay-language-option';
      option.dataset.lang = code;
      option.textContent = name;
      option.setAttribute('role', 'option');
      option.addEventListener('click', event => {
        event.stopPropagation();
        set(code);
        menu.classList.add('hidden');
        refresh();
      });
      menu.appendChild(option);
    });

    button.addEventListener('click', event => {
      event.stopPropagation();
      document.querySelectorAll('.relay-language-menu').forEach(other => {
        if (other !== menu) other.classList.add('hidden');
      });
      menu.classList.toggle('hidden');
      refresh();
    });

    document.addEventListener('click', () => menu.classList.add('hidden'));
    wrap.append(copy, button, menu);
    refresh();
    return wrap;
  };

  const mountHomeSettings = () => {
    const panel = document.getElementById('titlePanel');
    const content = document.getElementById('titlePanelContent');
    if (!panel || !content || panel.classList.contains('hidden')) return;
    if (!document.querySelector('[data-title-panel="controls"]')?.matches(':focus-visible') && document.getElementById('titlePanelHeading')?.textContent !== 'OPTIONS') return;
    if (!content.querySelector('.home-language-setting')) content.appendChild(make());
  };

  const observe = () => {
    const content = document.getElementById('titlePanelContent');
    if (!content) return;
    new MutationObserver(mountHomeSettings).observe(content, { childList: true, subtree: true });
    document.querySelectorAll('[data-title-panel="controls"]').forEach(button => {
      button.addEventListener('click', () => {
        requestAnimationFrame(() => requestAnimationFrame(mountHomeSettings));
      });
    });
  };

  const init = () => {
    set(get());
    observe();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();