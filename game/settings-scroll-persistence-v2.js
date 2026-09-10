/* Relay Runner — Settings scroll persistence V2. Saves the actual scroll container position. */
(() => {
  'use strict';
  if (window.__relaySettingsScrollPersistenceV2) return;
  window.__relaySettingsScrollPersistenceV2 = true;
  const KEY='relay-settings-scroll';let saved=0;let body=null;
  try{saved=Number(sessionStorage.getItem(KEY))||0;}catch{}
  const getBody=()=>document.querySelector('#titlePanel.relay-options-unified .relay-options-body');
  const clamp=(el,value)=>Math.max(0,Math.min(Math.max(0,el.scrollHeight-el.clientHeight),Number(value)||0));
  const persist=value=>{saved=Math.max(0,Number(value)||0);try{sessionStorage.setItem(KEY,String(saved));}catch{}};
  const attach=()=>{const next=getBody();if(!next||next===body)return;body=next;body.addEventListener('scroll',()=>persist(body.scrollTop),{passive:true});const restore=()=>{if(body)body.scrollTop=clamp(body,saved);};restore();requestAnimationFrame(restore);window.setTimeout(restore,50);};
  const sync=()=>{attach();if(body)body.scrollTop=clamp(body,saved);};
  const boot=()=>{sync();const panel=document.getElementById('titlePanel');if(panel)new MutationObserver(sync).observe(panel,{attributes:true,childList:true,subtree:true});window.addEventListener('resize',sync,{passive:true});window.addEventListener('orientationchange',sync,{passive:true});document.addEventListener('relay-open-home-options',()=>{requestAnimationFrame(sync);window.setTimeout(sync,40);window.setTimeout(sync,140);});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
