(() => {
  'use strict';
  if (window.__relayGameplayIntroPrologueMapV1) return;
  window.__relayGameplayIntroPrologueMapV1 = true;

  const install = root => {
    if (!root || root.querySelector('.prologue-map')) return;
    const style = document.createElement('style');
    style.id = 'relay-prologue-map-v1-style';
    style.textContent = `
#relayGameplayIntroFinalV1 .prologue-map{position:absolute;inset:0;z-index:1;overflow:hidden;opacity:0;pointer-events:none;background:radial-gradient(circle at 68% 24%,rgba(81,184,208,.25),transparent 25%),linear-gradient(160deg,#020815 0%,#07192c 52%,#02060f 100%);transition:opacity 1s ease}
#relayGameplayIntroFinalV1.playing .prologue-map{opacity:1}
#relayGameplayIntroFinalV1 .prologue-map:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 0 55%,rgba(2,7,13,.3) 56%,rgba(1,4,8,.92) 100%),repeating-linear-gradient(105deg,transparent 0 9%,rgba(141,244,255,.05) 9.1% 9.22%,transparent 9.3% 18%)}
#relayGameplayIntroFinalV1 .prologue-skyline{position:absolute;left:-4%;right:-4%;bottom:16%;height:45%;display:flex;align-items:flex-end;gap:1.5%;transform:perspective(600px) rotateX(48deg) translateY(8%);transform-origin:bottom center;opacity:.84}
#relayGameplayIntroFinalV1 .prologue-building{position:relative;flex:1;background:linear-gradient(180deg,#18324e,#071320);border:1px solid rgba(141,244,255,.1);box-shadow:inset 0 0 18px rgba(141,244,255,.035)}
#relayGameplayIntroFinalV1 .prologue-building:nth-child(2n){background:linear-gradient(180deg,#213347,#08131f)}
#relayGameplayIntroFinalV1 .prologue-building:nth-child(3n){background:linear-gradient(180deg,#2a2942,#0a1120)}
#relayGameplayIntroFinalV1 .prologue-building:after{content:"";position:absolute;inset:10% 12%;background:repeating-linear-gradient(90deg,rgba(255,208,110,.45) 0 4px,transparent 4px 17px),repeating-linear-gradient(180deg,rgba(141,244,255,.28) 0 3px,transparent 3px 14px);opacity:.28}
#relayGameplayIntroFinalV1 .prologue-water{position:absolute;left:-10%;right:-10%;bottom:-8%;height:30%;background:linear-gradient(180deg,rgba(23,80,98,.32),rgba(1,9,18,.95));transform:skewY(-3deg)}
#relayGameplayIntroFinalV1 .prologue-water:after{content:"";position:absolute;inset:20% 0;background:repeating-linear-gradient(90deg,transparent 0 7%,rgba(141,244,255,.11) 7.2% 8.4%,transparent 8.8% 16%);animation:prologue-water 4.5s linear infinite}
#relayGameplayIntroFinalV1 .prologue-bridge{position:absolute;left:8%;right:8%;bottom:31%;height:7%;border-top:2px solid rgba(141,244,255,.4);border-bottom:1px solid rgba(255,208,110,.25);transform:skewY(-5deg);box-shadow:0 0 24px rgba(141,244,255,.1)}
#relayGameplayIntroFinalV1 .prologue-beacon{position:absolute;right:17%;bottom:28%;width:8px;height:150px;background:linear-gradient(180deg,rgba(255,208,110,.95),rgba(141,244,255,.45));box-shadow:0 0 28px rgba(255,208,110,.4),0 0 60px rgba(141,244,255,.12);transform:rotate(3deg);transform-origin:bottom}
#relayGameplayIntroFinalV1 .prologue-beacon:after{content:"";position:absolute;left:50%;top:-10px;width:90px;height:90px;transform:translateX(-50%);border:1px solid rgba(255,208,110,.22);border-radius:50%;box-shadow:0 0 28px rgba(255,208,110,.12)}
#relayGameplayIntroFinalV1 .prologue-label{position:absolute;left:50%;top:12%;transform:translateX(-50%);padding:7px 10px;border:1px solid rgba(141,244,255,.18);background:rgba(2,9,16,.56);color:#8df4ff;font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.22em;backdrop-filter:blur(8px)}
@keyframes prologue-water{to{transform:translateX(12%)}}
@media(max-width:760px){#relayGameplayIntroFinalV1 .prologue-skyline{bottom:18%;height:39%}#relayGameplayIntroFinalV1 .prologue-bridge{bottom:33%}#relayGameplayIntroFinalV1 .prologue-beacon{right:12%;height:105px}#relayGameplayIntroFinalV1 .prologue-label{top:10%;font-size:7px;letter-spacing:.16em}}
@media(prefers-reduced-motion:reduce){#relayGameplayIntroFinalV1 .prologue-water:after{animation:none}}
`;
    root.appendChild(style);

    const map = document.createElement('div');
    map.className = 'prologue-map';
    map.setAttribute('aria-hidden', 'true');
    map.innerHTML = '<div class="prologue-label">PROLOGUE MAP // SALT DOCKS</div><div class="prologue-skyline"><i class="prologue-building"></i><i class="prologue-building"></i><i class="prologue-building"></i><i class="prologue-building"></i><i class="prologue-building"></i><i class="prologue-building"></i><i class="prologue-building"></i><i class="prologue-building"></i></div><div class="prologue-bridge"></div><div class="prologue-beacon"></div><div class="prologue-water"></div>';
    root.insertBefore(map, root.firstChild);
  };

  const observer = new MutationObserver(() => {
    const root = document.getElementById('relayGameplayIntroFinalV1');
    if (root) { install(root); observer.disconnect(); }
  });
  const root = document.getElementById('relayGameplayIntroFinalV1');
  if (root) install(root); else observer.observe(document.body, { childList: true });
})();
