(() => {
  'use strict';
  if (window.__relayExitButtonPolishV1) return;
  window.__relayExitButtonPolishV1 = true;

  const style = document.createElement('style');
  style.id = 'relay-exit-button-polish-v1';
  style.textContent = `
    #intro .title-secondary .exit-button {
      position: relative;
      width: 100%;
      min-height: 54px;
      padding: 10px 15px;
      display: grid;
      place-items: center;
      gap: 3px;
      overflow: hidden;
      border: 1px solid rgba(255, 130, 110, .34);
      border-radius: 8px;
      color: #ffd9d1;
      background: linear-gradient(145deg, rgba(42, 16, 18, .94), rgba(14, 11, 18, .98));
      box-shadow: inset 0 1px rgba(255,255,255,.035), 0 10px 28px rgba(0,0,0,.28);
      font: 900 10px/1 'DM Mono', monospace;
      letter-spacing: .12em;
      cursor: pointer;
      transition: transform .16s ease, border-color .16s ease, color .16s ease, background .16s ease, box-shadow .16s ease;
    }

    #intro .title-secondary .exit-button::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,130,110,.06), transparent);
      transform: translateX(-110%);
      transition: transform .32s ease;
    }

    #intro .title-secondary .exit-button::after {
      content: '×';
      position: absolute;
      right: 10px;
      top: 7px;
      color: rgba(255,130,110,.55);
      font: 900 15px/1 'Manrope', sans-serif;
    }

    #intro .title-secondary .exit-button span,
    #intro .title-secondary .exit-button small {
      position: relative;
      z-index: 1;
      display: block;
    }

    #intro .title-secondary .exit-button span {
      color: #fff0eb;
      font-size: 10px;
    }

    #intro .title-secondary .exit-button small {
      color: #a98486;
      font: 700 7px/1.2 'DM Mono', monospace;
      letter-spacing: .08em;
    }

    #intro .title-secondary .exit-button:hover,
    #intro .title-secondary .exit-button:focus-visible {
      border-color: rgba(255,130,110,.72);
      color: #fff3ef;
      background: linear-gradient(145deg, rgba(58,20,22,.98), rgba(18,11,18,.99));
      box-shadow: inset 0 1px rgba(255,255,255,.05), 0 12px 34px rgba(0,0,0,.34), 0 0 26px rgba(255,130,110,.08);
      outline: none;
      transform: translateY(-1px);
    }

    #intro .title-secondary .exit-button:hover::before,
    #intro .title-secondary .exit-button:focus-visible::before {
      transform: translateX(110%);
    }

    #intro .title-secondary .exit-button:active {
      transform: translateY(0) scale(.975);
      border-color: rgba(255,130,110,.92);
      box-shadow: inset 0 2px 8px rgba(0,0,0,.24), 0 6px 18px rgba(0,0,0,.24);
    }

    @media (max-width: 650px) {
      #intro .title-secondary .exit-button {
        min-height: 50px;
        padding: 9px 13px;
      }
      #intro .title-secondary .exit-button span { font-size: 9px; }
      #intro .title-secondary .exit-button small { font-size: 6.8px; }
      #intro .title-secondary .exit-button::after { right: 8px; top: 6px; }
    }

    @media (prefers-reduced-motion: reduce) {
      #intro .title-secondary .exit-button,
      #intro .title-secondary .exit-button::before { transition: none; }
    }
  `;
  document.head.appendChild(style);
})();
