/* Production cinematic splash: supplied artwork is embedded, so first paint has no image-request race. */
(() => {
  if (window.__relayCinematicSplashV2) return;
  window.__relayCinematicSplashV2 = true;
  const artwork = 'data:image/webp;base64,ARTWORK_B64';
  document.getElementById('bootLoader')?.remove();
  const style = document.createElement('style');
  style.textContent = `.relay-splash{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#020714;overflow:hidden;opacity:1;visibility:visible;transition:opacity .45s ease,visibility .45s ease}.relay-splash.is-hidden{opacity:0;visibility:hidden;pointer-events:none}.relay-splash-art{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;background:#020714}.relay-splash-ui{position:absolute;z-index:2;left:max(18px,env(safe-area-inset-left));right:max(18px,env(safe-area-inset-right));bottom:max(22px,env(safe-area-inset-bottom));width:min(760px,calc(100% - 36px));margin:auto;display:grid;gap:8px;text-shadow:0 2px 12px #000}.relay-splash-meta{display:flex;justify-content:space-between;align-items:center;color:#f5f7fb;font:800 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase}.relay-splash-percent{color:#19c8f5;font-variant-numeric:tabular-nums}.relay-splash-track{height:5px;border:1px solid #ffffff38;background:#00000085;overflow:hidden;box-shadow:0 0 22px #19c8f526}.relay-splash-progress{display:block;width:0;height:100%;background:linear-gradient(90deg,#19c8f5,#ffffff);box-shadow:0 0 14px #19c8f5cc;transition:width .12s linear}@media(max-width:700px){.relay-splash-ui{bottom:max(16px,env(safe-area-inset-bottom));width:calc(100% - 28px)}.relay-splash-meta{font-size:9px}.relay-splash-track{height:4px}}@media(prefers-reduced-motion:reduce){.relay-splash,.relay-splash-progress{transition:none}}`;
  document.head.appendChild(style);
  const splash = document.createElement('div');
  splash.className = 'relay-splash';
  splash.setAttribute('role','status'); splash.setAttribute('aria-live','polite'); splash.setAttribute('aria-busy','true');
  splash.innerHTML = `<img class="relay-splash-art" src="${artwork}" alt="Relay Runner" decoding="async" fetchpriority="high"><div class="relay-splash-ui"><div class="relay-splash-meta"><span class="relay-splash-status">INITIALIZING RELAY</span><span class="relay-splash-percent">0%</span></div><div class="relay-splash-track"><i class="relay-splash-progress"></i></div></div>`;
  document.body.prepend(splash);
  const bar=splash.querySelector('.relay-splash-progress'), pct=splash.querySelector('.relay-splash-percent'), status=splash.querySelector('.relay-splash-status');
  let current=0,imageReady=false,domReady=document.readyState!=='loading',engineReady=false,pageReady=document.readyState==='complete',finishing=false;
  const setProgress=(value,text)=>{current=Math.max(current,Math.min(100,Math.round(value)));bar.style.width=`${current}%`;pct.textContent=`${current}%`;if(text)status.textContent=text;};
  const animateTo=(target,text)=>new Promise(resolve=>{const from=current;if(target<=from){setProgress(target,text);resolve();return;}const start=performance.now(),duration=Math.max(100,Math.min(420,(target-from)*8));const frame=now=>{const t=Math.min(1,(now-start)/duration);setProgress(from+(target-from)*(t*(2-t)),text);if(t<1)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
  const finish=async()=>{if(finishing||!imageReady||!domReady||!engineReady||!pageReady)return;finishing=true;await animateTo(100,'READY');splash.setAttribute('aria-busy','false');splash.classList.add('is-hidden');window.setTimeout(()=>splash.remove(),500);};
  const image=splash.querySelector('.relay-splash-art');
  image.addEventListener('load',()=>{imageReady=true;animateTo(18,'LOADING INTERFACE').then(finish);},{once:true});
  image.addEventListener('error',()=>{imageReady=true;animateTo(18,'LOADING INTERFACE').then(finish);},{once:true});
  if(image.complete&&image.naturalWidth){imageReady=true;setProgress(18,'LOADING INTERFACE');}
  const checkEngine=()=>{if(document.querySelector('#phaser-game canvas')){engineReady=true;animateTo(72,'PREPARING HOME').then(finish);return;}window.setTimeout(checkEngine,50);};
  if(domReady)animateTo(34,'LOADING GAME SYSTEMS');else document.addEventListener('DOMContentLoaded',()=>{domReady=true;animateTo(34,'LOADING GAME SYSTEMS');finish();},{once:true});
  if(pageReady)setProgress(86,'FINALIZING');else window.addEventListener('load',()=>{pageReady=true;animateTo(86,'FINALIZING').then(finish);},{once:true});
  checkEngine(); window.setTimeout(()=>{if(!engineReady)status.textContent='STARTING GAME ENGINE';},2500);
})();
".replace("ARTWORK_B64