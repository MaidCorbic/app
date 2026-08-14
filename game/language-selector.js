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
  css.textContent = `.relay-language-wrap{position:absolute;top:24px;left:24px;z-index:30;font-family:'DM Mono',monospace}.relay-language-button{height:44px;min-width:118px;padding:0 14px;border:1px solid #d9e7f433;border-radius:22px;background:linear-gradient(145deg,#0b1729ee,#07101dea);color:#eaf2f8;box-shadow:0 8px 30px #0007;cursor:pointer;font:800 10px 'DM Mono',monospace;letter-spacing:1px}.relay-language-button:hover,.relay-language-button:focus-visible{border-color:#ffd06e;color:#ffd06e;outline:none}.relay-language-menu{position:absolute;left:0;top:52px;width:170px;padding:7px;border:1px solid #d9e7f233;border-radius:8px;background:#07101df5;box-shadow:0 18px 50px #000b;backdrop-filter:blur(12px)}.relay-language-menu.hidden{display:none}.relay-language-option{display:block;width:100%;padding:11px 12px;border:0;background:transparent;color:#aebdcc;text-align:left;font:800 10px 'DM Mono',monospace;cursor:pointer}.relay-language-option:hover,.relay-language-option.active{background:#ffd06e12;color:#ffd06e}.pause-language-wrap{position:relative;display:flex;align-items:center;gap:8px;margin-top:14px}.pause-language-wrap .relay-language-menu{top:42px;left:0;z-index:100}.pause-language-wrap .relay-language-button{height:38px;min-width:112px}.relay-language-label{color:#8999aa;font:800 9px 'DM Mono',monospace;letter-spacing:1px}@media(max-width:600px){.relay-language-wrap{top:12px;left:12px}.relay-language-button{height:40px;min-width:106px;font-size:9px}}`;
  document.head.appendChild(css);

  const make = (pause = false) => {
    const wrap = document.createElement('div');
    wrap.className = pause ? 'pause-language-wrap' : 'relay-language-wrap';
    if (pause) { const label = document.createElement('span'); label.className='relay-language-label'; label.textContent='LANGUAGE'; wrap.appendChild(label); }
    const button = document.createElement('button');
    button.type='button'; button.className='relay-language-button';
    const menu = document.createElement('div'); menu.className='relay-language-menu hidden';
    const refresh = () => { const current=get(); button.textContent='🌐  '+LANGUAGES.find(x=>x[0]===current)?.[1] || '🌐  ENGLISH'; menu.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.lang===current)); };
    LANGUAGES.forEach(([code,name])=>{ const option=document.createElement('button'); option.type='button'; option.className='relay-language-option'; option.dataset.lang=code; option.textContent=name; option.addEventListener('click',e=>{e.stopPropagation();set(code);menu.classList.add('hidden');refresh();}); menu.appendChild(option); });
    button.addEventListener('click',e=>{e.stopPropagation();document.querySelectorAll('.relay-language-menu').forEach(m=>{if(m!==menu)m.classList.add('hidden')});menu.classList.toggle('hidden');});
    document.addEventListener('click',()=>menu.classList.add('hidden'));
    wrap.append(button,menu); refresh(); return wrap;
  };

  const mount = () => {
    const intro=document.getElementById('intro');
    if(intro && !intro.querySelector('.relay-language-wrap')) intro.appendChild(make(false));
    const pause=document.getElementById('pauseMenu');
    if(pause && !pause.querySelector('.pause-language-wrap')) {
      const nav=pause.querySelector('nav');
      (nav || pause.querySelector('.menu-grid') || pause).appendChild(make(true));
    }
  };
  const init=()=>{mount(); set(get());};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();