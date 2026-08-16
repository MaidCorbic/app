const LANG_KEY = 'relay-runner-language';
const LANGUAGES = { en: 'English', exyu: 'EX-YU', es: 'Español', de: 'Deutsch' };

const T = {
  en: { faq:'FAQ', info:'LATEST UPDATE', options:'OPTIONS', language:'LANGUAGE', close:'CLOSE', play:'PLAY NOW', continue:'CONTINUE', run:'RUN', jump:'JUMP', fire:'FIRE', blade:'BLADE', dash:'DASH', signals:'SIGNALS', pause:'PAUSE', resume:'RESUME', missions:'MISSIONS', progress:'PROGRESS', settings:'SETTINGS', nextMission:'NEXT MISSION', returnBriefing:'RETURN TO BRIEFING', cityNetwork:'CITY RELAY NETWORK', chooseDistrict:'CHOOSE A DISTRICT.' },
  exyu: { faq:'ČESTA PITANJA', info:'NAJNOVIJI UPDATE', options:'OPCIJE', language:'JEZIK', close:'ZATVORI', play:'IGRAJ', continue:'NASTAVI', run:'TRČANJE', jump:'SKOK', fire:'PALJBA', blade:'MAČ', dash:'DASH', signals:'SIGNALI', pause:'PAUZA', resume:'NASTAVI', missions:'MISIJE', progress:'NAPREDAK', settings:'POSTAVKE', nextMission:'SLJEDEĆA MISIJA', returnBriefing:'NAZAD NA POČETAK', cityNetwork:'GRADSKA RELAY MREŽA', chooseDistrict:'IZABERI DISTRIKT.' },
  es: { faq:'PREGUNTAS FRECUENTES', info:'ÚLTIMA ACTUALIZACIÓN', options:'OPCIONES', language:'IDIOMA', close:'CERRAR', play:'JUGAR', continue:'CONTINUAR', run:'CORRER', jump:'SALTAR', fire:'DISPARAR', blade:'ESPADA', dash:'DASH', signals:'SEÑALES', pause:'PAUSA', resume:'CONTINUAR', missions:'MISIONES', progress:'PROGRESO', settings:'AJUSTES', nextMission:'SIGUIENTE MISIÓN', returnBriefing:'VOLVER AL INICIO', cityNetwork:'RED DE RELAY DE LA CIUDAD', chooseDistrict:'ELIGE UN DISTRITO.' },
  de: { faq:'FAQ', info:'LETZTES UPDATE', options:'OPTIONEN', language:'SPRACHE', close:'SCHLIESSEN', play:'SPIELEN', continue:'FORTSETZEN', run:'LAUFEN', jump:'SPRINGEN', fire:'FEUERN', blade:'KLINGE', dash:'DASH', signals:'SIGNALE', pause:'PAUSE', resume:'FORTSETZEN', missions:'MISSIONEN', progress:'FORTSCHRITT', settings:'EINSTELLUNGEN', nextMission:'NÄCHSTE MISSION', returnBriefing:'ZURÜCK ZUM START', cityNetwork:'STÄDTISCHES RELAY-NETZ', chooseDistrict:'DISTRIKT AUSWÄHLEN.' }
};

const getLang = () => localStorage.getItem(LANG_KEY) || 'en';
const text = key => T[getLang]?.[key] || T.en[key] || key;

function applyLanguage(lang = getLang()) {
  if (!T[lang]) lang = 'en';
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang === 'exyu' ? 'hr' : lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = text(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', text(el.dataset.i18nAria)));
  document.querySelectorAll('[data-language-name]').forEach(el => { el.textContent = LANGUAGES[lang]; });
  window.dispatchEvent(new CustomEvent('relay-language-change', { detail: { lang } }));
}

function buildLanguageUI() {
  if (document.getElementById('relayLanguagePanel')) return;
  const panel = document.createElement('section');
  panel.id = 'relayLanguagePanel';
  panel.className = 'relay-language-panel hidden';
  panel.innerHTML = `<div class="relay-language-card" role="dialog" aria-modal="true"><button type="button" class="relay-language-close" aria-label="Close">×</button><p class="relay-info-eyebrow">RELAY RUNNER</p><h2 data-i18n="language">LANGUAGE</h2><div class="relay-language-list">${Object.entries(LANGUAGES).map(([code,name]) => `<button type="button" data-language="${code}"><span>${name}</span><b>${code.toUpperCase()}</b></button>`).join('')}</div></div>`;
  document.body.appendChild(panel);
  document.querySelectorAll('[data-language-open]').forEach(b => b.addEventListener('click', () => panel.classList.remove('hidden')));
  panel.addEventListener('click', e => {
    const choice = e.target.closest('[data-language]');
    if (choice) { applyLanguage(choice.dataset.language); panel.classList.add('hidden'); }
    if (e.target === panel || e.target.closest('.relay-language-close')) panel.classList.add('hidden');
  });
}

window.relayI18n = { applyLanguage, getLang, text, languages: LANGUAGES };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { buildLanguageUI(); applyLanguage(); }, { once:true });
else { buildLanguageUI(); applyLanguage(); }
