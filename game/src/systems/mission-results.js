import { loadState } from '../state.js';

const RESULT_CLASS = 'mission-results-panel';

const style = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');

/* ============================================================
   RELAY // MISSION RESULTS
   SCI-FI TACTICAL FINISH SYSTEM
   ============================================================ */

@keyframes missionResultsIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(.985);
    filter: brightness(.65);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: brightness(1);
  }
}

@keyframes tacticalScan {
  from {
    transform: translateY(-120%);
  }

  to {
    transform: translateY(120%);
  }
}

@keyframes cyanPulse {
  0%,
  100% {
    opacity: .35;
  }

  50% {
    opacity: 1;
  }
}

@keyframes masteryPulse {
  0%,
  100% {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.035),
      0 0 0 rgba(88,231,255,0);
  }

  50% {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.055),
      0 0 25px rgba(88,231,255,.075);
  }
}

/* ============================================================
   FINISH SCREEN
   ============================================================ */

#finish {
  z-index: 70 !important;

  box-sizing: border-box;

  overflow-x: hidden !important;
  overflow-y: auto !important;

  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  font-family:
    'Orbitron',
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    monospace !important;

  background:
    radial-gradient(
      circle at 50% 16%,
      rgba(0,217,255,.09),
      transparent 31%
    ),
    radial-gradient(
      circle at 12% 82%,
      rgba(88,231,255,.045),
      transparent 30%
    ),
    linear-gradient(
      145deg,
      #01070b 0%,
      #031119 48%,
      #010509 100%
    ) !important;

  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;

  -webkit-touch-callout: none !important;
}

/* ============================================================
   MAIN SCI-FI CARD
   ============================================================ */

#finish:not(.hidden) .outcome {
  position: relative;

  z-index: 71;

  width:
    min(760px, calc(100vw - 20px)) !important;

  max-width:
    760px !important;

  max-height:
    calc(100dvh - 20px) !important;

  margin: auto;

  padding:
    18px 20px 15px !important;

  box-sizing: border-box;

  overflow-x: hidden !important;
  overflow-y: auto !important;

  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  scrollbar-width: thin;

  scrollbar-color:
    rgba(88,231,255,.55)
    rgba(2,11,17,.8);

  border:
    1px solid rgba(88,231,255,.38) !important;

  border-radius:
    10px !important;

  background:
    linear-gradient(
      145deg,
      rgba(3,17,25,.985),
      rgba(2,9,15,.995) 56%,
      rgba(1,6,10,.995)
    ) !important;

  box-shadow:
    0 28px 80px rgba(0,0,0,.68),
    0 0 45px rgba(0,217,255,.055),
    inset 0 1px 0 rgba(255,255,255,.055),
    inset 0 0 0 1px rgba(88,231,255,.025);

  clip-path:
    polygon(
      0 12px,
      12px 0,
      calc(100% - 12px) 0,
      100% 12px,
      100% calc(100% - 12px),
      calc(100% - 12px) 100%,
      12px 100%,
      0 calc(100% - 12px)
    );

  animation:
    missionResultsIn .30s ease-out both;
}

#finish:not(.hidden) .outcome::-webkit-scrollbar {
  width: 6px;
}

#finish:not(.hidden) .outcome::-webkit-scrollbar-track {
  background: rgba(1,8,13,.82);
}

#finish:not(.hidden) .outcome::-webkit-scrollbar-thumb {
  background:
    linear-gradient(
      180deg,
      rgba(88,231,255,.68),
      rgba(0,217,255,.25)
    );

  border-radius: 999px;
}

/* ============================================================
   TACTICAL GRID
   ============================================================ */

#finish:not(.hidden) .outcome::before {
  content: "";

  position: absolute;
  inset: 0;

  pointer-events: none;

  opacity: .23;

  background-image:
    linear-gradient(
      rgba(88,231,255,.055) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(88,231,255,.055) 1px,
      transparent 1px
    );

  background-size: 24px 24px;

  mask-image:
    linear-gradient(
      to bottom,
      #000,
      transparent 92%
    );
}

#finish:not(.hidden) .outcome::after {
  content: "";

  position: absolute;

  left: 0;
  right: 0;
  top: 0;

  height: 1px;

  pointer-events: none;

  background:
    rgba(88,231,255,.35);

  box-shadow:
    0 0 14px rgba(88,231,255,.28);

  animation:
    tacticalScan 5.5s linear infinite;
}

/* ============================================================
   GLOBAL FINISH TYPOGRAPHY
   ============================================================ */

#finish,
#finish *,
#finish .outcome,
#finish .outcome * {
  font-family:
    'Orbitron',
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    monospace;
}

/* ============================================================
   MARK / CORE
   ============================================================ */

#finish .outcome-mark {
  position: relative;

  display: grid !important;
  place-items: center !important;

  width: 42px !important;
  height: 42px !important;

  margin: 0 auto 8px !important;

  border:
    1px solid rgba(88,231,255,.64) !important;

  border-radius: 7px !important;

  background:
    linear-gradient(
      145deg,
      rgba(88,231,255,.16),
      rgba(0,217,255,.025)
    ) !important;

  color: #58e7ff !important;

  font-size: 18px !important;
  line-height: 1 !important;

  box-shadow:
    0 0 20px rgba(88,231,255,.14),
    inset 0 1px 0 rgba(255,255,255,.07);

  text-shadow:
    0 0 12px rgba(88,231,255,.65);
}

#finish .outcome-mark::before,
#finish .outcome-mark::after {
  content: "";

  position: absolute;

  width: 7px;
  height: 7px;

  border-color: #58e7ff;
  border-style: solid;

  opacity: .9;
}

#finish .outcome-mark::before {
  top: -3px;
  left: -3px;

  border-width: 1px 0 0 1px;
}

#finish .outcome-mark::after {
  right: -3px;
  bottom: -3px;

  border-width: 0 1px 1px 0;
}

/* ============================================================
   TITLE
   ============================================================ */

#finish .outcome > h1,
#finish .outcome > h2,
#finish .outcome .title {
  position: relative;

  margin: 5px 0 8px !important;

  color: #e7fbff !important;

  text-align: center !important;

  font-size:
    clamp(34px, 4.5vw, 52px) !important;

  line-height: .96 !important;

  font-weight: 800 !important;

  letter-spacing: .075em !important;

  text-transform: uppercase;

  text-shadow:
    0 0 8px rgba(88,231,255,.35),
    0 0 25px rgba(0,217,255,.15);

  overflow-wrap: anywhere;
}

/* ============================================================
   EYEBROW
   ============================================================ */

#finish .outcome > .eyebrow {
  position: relative;

  margin: 0 0 9px !important;

  color: #58e7ff !important;

  text-align: center !important;

  font-size: 10px !important;
  line-height: 1.2;

  font-weight: 700;

  letter-spacing: .21em;

  text-transform: uppercase;

  text-shadow:
    0 0 10px rgba(88,231,255,.25);
}

#finish .outcome > .eyebrow::before {
  content: "RELAY // ";

  opacity: .55;
}

/* ============================================================
   FINISH LINE
   ============================================================ */

#finish #finishLine {
  position: relative;

  width:
    min(100%, 580px) !important;

  margin: 0 auto 12px !important;

  color: #9bc1cc !important;

  text-align: center !important;

  font-size: 11px !important;
  line-height: 1.5 !important;

  font-weight: 500;

  letter-spacing: .045em !important;

  overflow-wrap: anywhere;
}

/* ============================================================
   MISSION XP REWARD
   ============================================================ */

#finish .reward {
  position: relative;

  width:
    min(100%, 650px);

  margin:
    12px auto 18px !important;

  padding:
    15px 18px 17px !important;

  box-sizing: border-box;

  border:
    1px solid rgba(88,231,255,.25);

  border-radius: 7px;

  background:
    linear-gradient(
      145deg,
      rgba(88,231,255,.075),
      rgba(3,18,27,.94) 50%,
      rgba(1,8,13,.98)
    );

  text-align: center;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.045),
    0 12px 28px rgba(0,0,0,.24),
    0 0 22px rgba(88,231,255,.035);
}

#finish .reward::before {
  content: "MISSION XP REWARD";

  display: block;

  margin-bottom: 7px;

  color: #69a6b4;

  font-size: 9px;

  font-weight: 800;

  letter-spacing: .22em;
}

#finish .reward::after {
  content: "";

  position: absolute;

  left: 18%;
  right: 18%;
  bottom: -1px;

  height: 1px;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(88,231,255,.7),
      transparent
    );

  box-shadow:
    0 0 9px rgba(88,231,255,.35);
}

#finish .reward > b {
  display: block;

  margin: 0 !important;

  color: #58e7ff !important;

  font-size:
    clamp(34px, 4.5vw, 46px) !important;

  line-height: 1 !important;

  font-weight: 900;

  letter-spacing: .045em;

  text-shadow:
    0 0 12px rgba(88,231,255,.42),
    0 0 28px rgba(0,217,255,.16);
}

#finish .reward > span {
  display: block;

  margin: 7px 0 0 !important;

  color: #6f929e !important;

  font-size: 8px !important;

  line-height: 1.25 !important;

  font-weight: 600;

  letter-spacing: .15em;

  text-transform: uppercase;
}
/* ============================================================
   FINISH SUMMARY
   SIGNALS / RATING / SCORE / TIME
   ============================================================ */

#finish .reward .finish-summary {
  width: min(100%, 520px);

  margin:
    12px auto 0;

  display: grid;

  gap: 5px;

  text-align: left;
}

/* ------------------------------------------------------------
   SUMMARY ROW
   ------------------------------------------------------------ */

#finish .reward .finish-summary-line {
  position: relative;

  min-width: 0;

  min-height: 31px;

  padding:
    7px 10px;

  box-sizing: border-box;

  display: grid;

  grid-template-columns:
    76px minmax(0, 1fr);

  align-items: center;

  column-gap: 10px;

  border:
    1px solid rgba(88,231,255,.12);

  border-radius: 4px;

  background:
    linear-gradient(
      90deg,
      rgba(88,231,255,.045),
      rgba(2,11,17,.42)
    );

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.025);

  transition:
    border-color .16s ease,
    background .16s ease,
    box-shadow .16s ease,
    transform .16s ease;
}

/* LEFT CYAN EDGE */

#finish .reward .finish-summary-line::before {
  content: "";

  position: absolute;

  left: 0;
  top: 6px;
  bottom: 6px;

  width: 2px;

  background:
    rgba(88,231,255,.58);

  box-shadow:
    0 0 8px rgba(88,231,255,.25);

  pointer-events: none;
}

/* TOP RIGHT STATUS DOT */

#finish .reward .finish-summary-line::after {
  content: "";

  position: absolute;

  right: 7px;
  top: 7px;

  width: 4px;
  height: 4px;

  border:
    1px solid rgba(88,231,255,.48);

  background:
    rgba(88,231,255,.18);

  box-shadow:
    0 0 6px rgba(88,231,255,.32);

  animation:
    cyanPulse 2.4s ease-in-out infinite;
}

/* ------------------------------------------------------------
   LABEL
   SIGNALS / RATING / SCORE / TIME
   ------------------------------------------------------------ */

#finish .reward .finish-summary-line strong {
  min-width: 0;

  color:
    #58e7ff;

  font-size:
    8px;

  line-height:
    1;

  font-weight:
    900;

  letter-spacing:
    .16em;

  text-transform:
    uppercase;

  white-space:
    nowrap;

  text-shadow:
    0 0 8px rgba(88,231,255,.22);
}

/* ------------------------------------------------------------
   VALUE
   ------------------------------------------------------------ */

#finish .reward .finish-summary-line i,
#finish .reward .finish-summary-line small {
  min-width: 0;

  margin: 0;

  color:
    #b9e9f2;

  font-size:
    8px;

  line-height:
    1.2;

  font-style:
    normal;

  font-weight:
    700;

  letter-spacing:
    .055em;

  text-align:
    right;

  white-space:
    nowrap;

  overflow:
    hidden;

  text-overflow:
    ellipsis;
}

/* ------------------------------------------------------------
   INDIVIDUAL VALUE ACCENTS
   ------------------------------------------------------------ */

/* SIGNALS */

#finish .reward .finish-summary-line:nth-child(1) i {
  color:
    #baf7ff;

  text-shadow:
    0 0 8px rgba(0,217,255,.22);
}

/* RATING */

#finish .reward .finish-summary-line:nth-child(2) small {
  color:
    #effeff;

  font-size:
    11px;

  letter-spacing:
    .08em;

  text-shadow:
    0 0 10px rgba(88,231,255,.30);
}

/* SCORE */

#finish .reward .finish-summary-line:nth-child(3) small {
  color:
    #d8f8ff;
}

/* TIME */

#finish .reward .finish-summary-line:nth-child(4) small {
  color:
    #c5edf4;
}

/* ------------------------------------------------------------
   HOVER
   ------------------------------------------------------------ */

#finish .reward .finish-summary-line:hover {
  transform:
    translateY(-1px);

  border-color:
    rgba(88,231,255,.34);

  background:
    linear-gradient(
      90deg,
      rgba(88,231,255,.085),
      rgba(3,16,24,.68)
    );

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 6px 15px rgba(0,0,0,.22),
    0 0 14px rgba(88,231,255,.055);
}

#finish .reward .finish-summary-line:hover::before {
  width:
    3px;

  background:
    #58e7ff;

  box-shadow:
    0 0 10px rgba(88,231,255,.55);
}

/* ============================================================
   FINISH SUMMARY MOBILE
   ============================================================ */

@media (max-width: 700px) {

  #finish .reward .finish-summary {
    width: 100%;

    margin-top:
      10px;

    gap:
      4px;
  }

  #finish .reward .finish-summary-line {
    min-height:
      30px;

    padding:
      7px 8px;

    grid-template-columns:
      68px minmax(0, 1fr);

    column-gap:
      8px;
  }

  #finish .reward .finish-summary-line strong {
    font-size:
      7px;

    letter-spacing:
      .12em;
  }

  #finish .reward .finish-summary-line i,
  #finish .reward .finish-summary-line small {
    font-size:
      7px;

    letter-spacing:
      .035em;
  }

  #finish .reward .finish-summary-line:nth-child(2) small {
    font-size:
      10px;
  }
}

@media (max-width: 430px) {

  #finish .reward .finish-summary-line {
    min-height:
      29px;

    grid-template-columns:
      60px minmax(0, 1fr);

    padding:
      6px 7px;
  }

  #finish .reward .finish-summary-line strong {
    font-size:
      6.5px;

    letter-spacing:
      .10em;
  }

  #finish .reward .finish-summary-line i,
  #finish .reward .finish-summary-line small {
    font-size:
      6.5px;
  }

  #finish .reward .finish-summary-line:nth-child(2) small {
    font-size:
      9px;
  }
}
/* ============================================================
   MAIN STAT CARDS
   ============================================================ */

#finish .${RESULT_CLASS} {
  position: relative;

  width:
    min(100%, 650px);

  margin:
    0 auto 18px;

  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 8px;

  text-align: left;
}

/* ============================================================
   STAT CARD
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-card {
  position: relative;

  min-width: 0;

  min-height: 82px;

  padding:
    13px 14px;

  box-sizing: border-box;

  overflow: hidden;

  border:
    1px solid rgba(88,231,255,.20);

  border-radius: 7px;

  background:
    linear-gradient(
      145deg,
      rgba(5,22,31,.97),
      rgba(2,10,16,.99)
    );

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 8px 20px rgba(0,0,0,.22);

  transition:
    border-color .16s ease,
    box-shadow .16s ease,
    transform .16s ease,
    background .16s ease;
}

/* ============================================================
   MISSION XP EARNED // TACTICAL STAT COLORS
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-card {
  position: relative;

  background:
    linear-gradient(
      145deg,
      rgba(5,22,31,.98),
      rgba(2,10,16,.99)
    );

  border:
    1px solid rgba(88,231,255,.20);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.045),
    0 8px 22px rgba(0,0,0,.25);

  transition:
    transform .18s ease,
    border-color .18s ease,
    background .18s ease,
    box-shadow .18s ease;
}

/* GRADE */

#finish .${RESULT_CLASS}
.mission-result-card:nth-child(1) {
  border-color:
    rgba(88,231,255,.45);

  background:
    linear-gradient(
      145deg,
      rgba(88,231,255,.12),
      rgba(3,18,27,.98)
    );
}

#finish .${RESULT_CLASS}
.mission-result-card:nth-child(1)
.mission-result-label {
  color:
    #58e7ff;
}

#finish .${RESULT_CLASS}
.mission-result-card:nth-child(1)
.mission-result-value {
  color:
    #effeff;

  text-shadow:
    0 0 12px rgba(88,231,255,.45),
    0 0 25px rgba(88,231,255,.16);
}

/* TIME */

#finish .${RESULT_CLASS}
.mission-result-card:nth-child(2)
.mission-result-label {
  color:
    #78a9b6;
}

#finish .${RESULT_CLASS}
.mission-result-card:nth-child(2)
.mission-result-value {
  color:
    #d9f8ff;

  text-shadow:
    0 0 10px rgba(88,231,255,.20);
}

/* SIGNALS */

#finish .${RESULT_CLASS}
.mission-result-card:nth-child(3) {
  border-color:
    rgba(0,217,255,.30);

  background:
    linear-gradient(
      145deg,
      rgba(0,217,255,.075),
      rgba(2,12,19,.99)
    );
}

#finish .${RESULT_CLASS}
.mission-result-card:nth-child(3)
.mission-result-label {
  color:
    #55eaff;
}

#finish .${RESULT_CLASS}
.mission-result-card:nth-child(3)
.mission-result-value {
  color:
    #baf7ff;

  text-shadow:
    0 0 12px rgba(0,217,255,.28);
}

/* RUN SCORE */

#finish .${RESULT_CLASS}
.mission-result-card:nth-child(4) {
  border-color:
    rgba(88,231,255,.27);

  background:
    linear-gradient(
      145deg,
      rgba(88,231,255,.055),
      rgba(2,10,16,.99)
    );
}

#finish .${RESULT_CLASS}
.mission-result-card:nth-child(4)
.mission-result-label {
  color:
    #70a5b2;
}

#finish .${RESULT_CLASS}
.mission-result-card:nth-child(4)
.mission-result-value {
  color:
    #e1fbff;

  text-shadow:
    0 0 11px rgba(88,231,255,.24);
}

/* ============================================================
   HOVER // TACTICAL HUD
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-card:hover {
  transform:
    translateY(-3px);

  border-color:
    rgba(88,231,255,.58);

  background:
    linear-gradient(
      145deg,
      rgba(7,31,42,.99),
      rgba(2,11,18,1)
    );

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    0 14px 30px rgba(0,0,0,.34),
    0 0 25px rgba(88,231,255,.10);
}

/* CYAN ACTIVE EDGE */

#finish .${RESULT_CLASS}
.mission-result-card:hover::before {
  width:
    3px;

  background:
    #58e7ff;

  box-shadow:
    0 0 12px rgba(88,231,255,.65),
    0 0 25px rgba(88,231,255,.20);
}

/* STATUS DOT */

#finish .${RESULT_CLASS}
.mission-result-card:hover::after {
  background:
    #58e7ff;

  border-color:
    #9cf5ff;

  box-shadow:
    0 0 10px rgba(88,231,255,.85);
}
    /* ============================================================
   HUD LABEL / VALUE SEPARATION
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-label {
  position: relative;

  display: flex;
  align-items: center;
  gap: 7px;

  margin-bottom: 9px;

  color:
    #6f9eaa;

  font-size:
    9px;

  font-weight:
    800;

  letter-spacing:
    .17em;
}

#finish .${RESULT_CLASS}
.mission-result-label::before {
  content:
    "";

  width:
    14px;

  height:
    1px;

  background:
    #58e7ff;

  box-shadow:
    0 0 7px rgba(88,231,255,.45);

  opacity:
    .65;
}

#finish .${RESULT_CLASS}
.mission-result-value {
  color:
    #e7fcff;

  font-size:
    23px;

  font-weight:
    900;

  letter-spacing:
    .035em;
}

#finish .${RESULT_CLASS}
.mission-result-sub {
  margin-top:
    8px;

  padding-top:
    6px;

  border-top:
    1px solid rgba(88,231,255,.075);

  color:
    #4f7782;

  font-size:
    7px;

  font-weight:
    600;

  letter-spacing:
    .10em;
}

#finish .${RESULT_CLASS}
.mission-result-card:hover {
  border-color:
    rgba(88,231,255,.48);

  background:
    linear-gradient(
      145deg,
      rgba(8,30,40,.98),
      rgba(2,12,19,.99)
    );

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.055),
    0 12px 28px rgba(0,0,0,.30),
    0 0 22px rgba(88,231,255,.075);

  transform:
    translateY(-2px);
}

#finish .${RESULT_CLASS}
.mission-result-card::before {
  content: "";

  position: absolute;

  left: 0;
  top: 0;
  bottom: 0;

  width: 2px;

  background:
    rgba(88,231,255,.52);

  box-shadow:
    0 0 12px rgba(88,231,255,.18);

  pointer-events: none;
}

#finish .${RESULT_CLASS}
.mission-result-card::after {
  content: "";

  position: absolute;

  right: 8px;
  top: 8px;

  width: 5px;
  height: 5px;

  border:
    1px solid rgba(88,231,255,.58);

  background:
    rgba(88,231,255,.22);

  box-shadow:
    0 0 7px rgba(88,231,255,.38);

  animation:
    cyanPulse 2.2s ease-in-out infinite;
}

/* ============================================================
   CARD LABELS
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-label {
  display: block;

  margin-bottom: 7px;

  color: #6e9ca8;

  font-size: 9px;

  line-height: 1;

  font-weight: 800;

  letter-spacing: .16em;

  text-transform: uppercase;
}

/* ============================================================
   CARD VALUE
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-value {
  display: block;

  min-width: 0;

  color: #e4fbff;

  font-size: 22px;

  line-height: 1.08;

  font-weight: 900;

  letter-spacing: .035em;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;

  text-shadow:
    0 0 9px rgba(88,231,255,.11);
}

/* ============================================================
   CARD SUBTITLE
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-sub {
  display: block;

  margin-top: 7px;

  min-width: 0;

  color: #557b87;

  font-size: 8px;

  line-height: 1.35;

  font-weight: 600;

  letter-spacing: .08em;

  text-transform: uppercase;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
}

/* ============================================================
   WIDE CARDS
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-wide {
  grid-column: span 2;
}

/* ============================================================
   GRADE
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-performance {
  border-color:
    rgba(88,231,255,.42);

  background:
    linear-gradient(
      145deg,
      rgba(88,231,255,.105),
      rgba(4,20,29,.97) 55%,
      rgba(2,9,15,.99)
    );

  box-shadow:
    0 0 22px rgba(88,231,255,.065),
    inset 0 1px 0 rgba(255,255,255,.05);
}

#finish .${RESULT_CLASS}
.mission-result-performance::before {
  background: #58e7ff;

  box-shadow:
    0 0 13px rgba(88,231,255,.45),
    0 0 27px rgba(88,231,255,.12);
}

#finish .${RESULT_CLASS}
.mission-result-performance
.mission-result-label {
  color: #58e7ff;
}

#finish .${RESULT_CLASS}
.mission-result-performance
.mission-result-value {
  color: #effeff;

  font-size: 25px;

  text-shadow:
    0 0 12px rgba(88,231,255,.34),
    0 0 25px rgba(0,217,255,.12);
}

/* ============================================================
   PERFORMANCE SCORE
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-wide.mission-result-performance
.mission-result-value {
  font-size: 23px;
}

/* ============================================================
   BONUS BREAKDOWN
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-wide:not(.mission-result-performance) {
  padding:
    15px 15px 16px;

  border-color:
    rgba(88,231,255,.27);

  background:
    linear-gradient(
      145deg,
      rgba(4,22,31,.98),
      rgba(2,10,16,.99)
    );
}

#finish .${RESULT_CLASS}
.mission-result-wide:not(.mission-result-performance)
.mission-result-label {
  color: #58e7ff;

  font-size: 10px;

  letter-spacing: .18em;
}

#finish .${RESULT_CLASS}
.mission-result-wide:not(.mission-result-performance)
.mission-result-value {
  font-size: 24px;

  color: #dffaff;
}

/* ============================================================
   BONUS MATRIX
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-bonus-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 7px;

  margin-top: 12px;
}

#finish .${RESULT_CLASS}
.mission-bonus-item {
  position: relative;

  min-width: 0;

  min-height: 48px;

  padding:
    9px 10px;

  box-sizing: border-box;

  border:
    1px solid rgba(88,231,255,.14);

  border-radius: 4px;

  background:
    linear-gradient(
      145deg,
      rgba(88,231,255,.045),
      rgba(0,0,0,.12)
    );

  transition:
    border-color .15s ease,
    background .15s ease,
    transform .15s ease,
    box-shadow .15s ease;
}

#finish .${RESULT_CLASS}
.mission-bonus-item:hover {
  border-color:
    rgba(88,231,255,.38);

  background:
    linear-gradient(
      145deg,
      rgba(88,231,255,.09),
      rgba(0,0,0,.10)
    );

  box-shadow:
    0 0 14px rgba(88,231,255,.055);

  transform:
    translateY(-1px);
}

#finish .${RESULT_CLASS}
.mission-bonus-name {
  display: block;

  color: #68929e;

  font-size: 8px;

  line-height: 1.25;

  font-weight: 700;

  letter-spacing: .08em;

  text-transform: uppercase;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
}

#finish .${RESULT_CLASS}
.mission-bonus-value {
  display: block;

  margin-top: 6px;

  color: #aef5ff;

  font-size: 15px;

  line-height: 1;

  font-weight: 900;

  letter-spacing: .04em;

  text-shadow:
    0 0 8px rgba(88,231,255,.18);
}

/* ============================================================
   MISSION MASTERY
   Works with existing Mission Mastery elements
   ============================================================ */

#finish .mission-mastery,
#finish #missionMastery,
#finish .mastery,
#finish [data-mission-mastery] {
  position: relative;

  width:
    min(100%, 650px);

  margin:
    22px auto 18px;

  padding:
    16px 17px;

  box-sizing: border-box;

  border:
    1px solid rgba(88,231,255,.28);

  border-radius: 8px;

  background:
    linear-gradient(
      145deg,
      rgba(5,25,35,.98),
      rgba(2,11,18,.99)
    );

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.045),
    0 12px 30px rgba(0,0,0,.25);

  overflow: hidden;

  transition:
    border-color .18s ease,
    transform .18s ease,
    box-shadow .18s ease,
    background .18s ease;
}

#finish .mission-mastery:hover,
#finish #missionMastery:hover,
#finish .mastery:hover,
#finish [data-mission-mastery]:hover {
  border-color:
    rgba(88,231,255,.60);

  background:
    linear-gradient(
      145deg,
      rgba(7,32,43,.99),
      rgba(2,12,19,.99)
    );

  transform:
    translateY(-2px);

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    0 15px 35px rgba(0,0,0,.34),
    0 0 28px rgba(88,231,255,.09);
}

#finish .mission-mastery::before,
#finish #missionMastery::before,
#finish .mastery::before,
#finish [data-mission-mastery]::before {
  content: "MISSION MASTERY";

  display: block;

  margin-bottom: 8px;

  color: #58e7ff;

  font-size: 10px;

  font-weight: 800;

  letter-spacing: .18em;

  text-transform: uppercase;
}

#finish .mission-mastery::after,
#finish #missionMastery::after,
#finish .mastery::after,
#finish [data-mission-mastery]::after {
  content: "";

  position: absolute;

  left: 15%;
  right: 15%;
  bottom: 0;

  height: 1px;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(88,231,255,.65),
      transparent
    );

  box-shadow:
    0 0 10px rgba(88,231,255,.30);
}

/* ============================================================
   TOTAL REWARD
   ============================================================ */

#finish .${RESULT_CLASS}
.mission-result-total {
  border-color:
    rgba(88,231,255,.46);

  background:
    linear-gradient(
      145deg,
      rgba(0,217,255,.09),
      rgba(4,18,26,.97)
    );

  box-shadow:
    0 0 24px rgba(0,217,255,.075),
    inset 0 1px 0 rgba(255,255,255,.05);
}

#finish .${RESULT_CLASS}
.mission-result-total::before {
  background: #00d9ff;

  box-shadow:
    0 0 14px rgba(0,217,255,.45),
    0 0 30px rgba(0,217,255,.13);
}

#finish .${RESULT_CLASS}
.mission-result-total
.mission-result-label {
  color: #58e7ff;

  font-size: 10px;
}

#finish .${RESULT_CLASS}
.mission-result-total
.mission-result-value {
  color: #effeff;

  font-size: 24px;

  text-shadow:
    0 0 12px rgba(88,231,255,.30);
}

/* ============================================================
   ACTION BUTTONS
   ============================================================ */

#finish .finish-actions {
  position: relative;

  width:
    min(650px, 100%);

  margin: 15px auto 0;

  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1.15fr);

  gap: 8px;

  align-items: stretch;
}

#finish #again,
#finish #nextMission {
  position: relative;

  z-index: 72;

  box-sizing: border-box;

  width: 100% !important;

  min-height: 48px;

  margin: 0 !important;

  padding: 9px 13px !important;

  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 8px;

  border-radius: 5px !important;

  font-size: 9px;

  line-height: 1;

  font-weight: 800;

  letter-spacing: .10em;

  text-transform: uppercase;

  cursor: pointer;

  touch-action: manipulation;

  user-select: none;

  transition:
    transform .14s ease,
    border-color .14s ease,
    background .14s ease,
    box-shadow .14s ease;
}

#finish #again {
  color: #8dcbd6 !important;

  border:
    1px solid rgba(88,231,255,.25) !important;

  background:
    linear-gradient(
      145deg,
      rgba(88,231,255,.055),
      rgba(88,231,255,.012)
    ) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.035),
    0 8px 20px rgba(0,0,0,.22);
}

#finish #again::before {
  content: "↻";

  color: #58e7ff;

  font-size: 17px;

  text-shadow:
    0 0 8px rgba(88,231,255,.45);
}

#finish #nextMission {
  color: #eaffff !important;

  border:
    1px solid rgba(88,231,255,.65) !important;

  background:
    linear-gradient(
      145deg,
      rgba(88,231,255,.17),
      rgba(0,123,147,.08)
    ) !important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.055),
    0 10px 24px rgba(0,0,0,.26),
    0 0 22px rgba(88,231,255,.09);
}

#finish #nextMission::after {
  content: "→";

  color: #58e7ff;

  font-size: 18px;

  text-shadow:
    0 0 9px rgba(88,231,255,.5);
}

#finish #again:hover,
#finish #again:focus-visible {
  transform: translateY(-2px);

  color: #e9fdff !important;

  border-color:
    rgba(88,231,255,.52) !important;

  background:
    rgba(88,231,255,.09) !important;

  box-shadow:
    0 11px 24px rgba(0,0,0,.28),
    0 0 20px rgba(88,231,255,.10);

  outline: none;
}

#finish #nextMission:hover,
#finish #nextMission:focus-visible {
  transform: translateY(-2px);

  border-color:
    #58e7ff !important;

  background:
    linear-gradient(
      145deg,
      rgba(88,231,255,.27),
      rgba(0,145,170,.13)
    ) !important;

  box-shadow:
    0 13px 28px rgba(0,0,0,.31),
    0 0 30px rgba(88,231,255,.18);

  outline: none;
}

#finish #again:active,
#finish #nextMission:active {
  transform:
    translateY(0) scale(.985);
}

#finish #again b,
#finish #nextMission b {
  display: none;
}

/* ============================================================
   RETURN
   ============================================================ */

#finish #finishTitle {
  display: block;

  margin: 9px auto 0 !important;

  padding: 7px 10px !important;

  border: 0 !important;

  background: transparent !important;

  color: #4f707b !important;

  font-size: 8px;

  line-height: 1;

  font-weight: 700;

  letter-spacing: .17em;

  text-transform: uppercase;

  cursor: pointer;

  touch-action: manipulation;

  transition:
    color .14s ease,
    transform .14s ease;
}

#finish #finishTitle:hover,
#finish #finishTitle:focus-visible {
  color: #9bd9e5 !important;

  transform: translateY(-1px);

  outline: none;
}

/* ============================================================
   TEXT PROTECTION
   ============================================================ */

#finish,
#finish *,
#finish .outcome,
#finish .outcome *,
#finish .mission-results-panel,
#finish .mission-results-panel * {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;

  -webkit-touch-callout: none !important;
}

#finish img,
#finish canvas,
#finish svg {
  -webkit-user-drag: none !important;
  user-drag: none !important;
  user-select: none !important;
}

/* ============================================================
   MOBILE
   ============================================================ */

@media (max-width: 700px) {

  #finish:not(.hidden) .outcome {
    width:
      calc(100vw - 14px) !important;

    max-height:
      calc(100dvh - 14px) !important;

    padding:
      15px 12px 13px !important;
  }

  #finish .outcome-mark {
    width: 37px !important;
    height: 37px !important;

    margin-bottom: 7px !important;

    font-size: 16px !important;
  }

  #finish .outcome > h1,
  #finish .outcome > h2,
  #finish .outcome .title {
    font-size:
      clamp(29px, 9vw, 42px) !important;

    margin-bottom: 7px !important;

    letter-spacing: .055em !important;
  }

  #finish .outcome > .eyebrow {
    font-size: 8px !important;
    letter-spacing: .15em;
  }

  #finish #finishLine {
    font-size: 10px !important;
    line-height: 1.45 !important;
  }

  #finish .reward {
    margin-bottom: 16px !important;

    padding:
      13px 10px 15px !important;
  }

  #finish .reward > b {
    font-size:
      clamp(29px, 8.5vw, 39px) !important;
  }

  #finish .${RESULT_CLASS} {
    width: 100%;
    gap: 7px;
  }

  #finish .${RESULT_CLASS}
  .mission-result-card {
    min-height: 70px;

    padding:
      11px 10px;
  }

  #finish .${RESULT_CLASS}
  .mission-result-label {
    font-size: 8px;
  }

  #finish .${RESULT_CLASS}
  .mission-result-value {
    font-size: 19px;
  }

  #finish .${RESULT_CLASS}
  .mission-result-sub {
    font-size: 7px;
  }

  #finish .${RESULT_CLASS}
  .mission-bonus-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));

    gap: 6px;
  }

  #finish .${RESULT_CLASS}
  .mission-bonus-item {
    min-height: 46px;

    padding:
      8px 8px;
  }

  #finish .${RESULT_CLASS}
  .mission-bonus-name {
    font-size: 7px;
  }

  #finish .${RESULT_CLASS}
  .mission-bonus-value {
    font-size: 14px;
  }

  #finish .mission-mastery,
  #finish #missionMastery,
  #finish .mastery,
  #finish [data-mission-mastery] {
    margin-top: 20px;
    margin-bottom: 16px;

    padding:
      14px 13px;
  }

  #finish .finish-actions {
    margin-top: 11px;
    gap: 6px;
  }

  #finish #again,
  #finish #nextMission {
    min-height: 45px;

    padding:
      8px 9px !important;

    font-size: 8px;
  }
}

/* ============================================================
   SMALL PHONES
   ============================================================ */

@media (max-width: 430px) {

  #finish:not(.hidden) .outcome {
    width:
      calc(100vw - 10px) !important;

    max-height:
      calc(100dvh - 10px) !important;

    padding:
      13px 9px 11px !important;
  }

  #finish .outcome-mark {
    width: 34px !important;
    height: 34px !important;

    font-size: 14px !important;
  }

  #finish .outcome > h1,
  #finish .outcome > h2,
  #finish .outcome .title {
    font-size:
      clamp(25px, 9.8vw, 35px) !important;

    letter-spacing: .035em !important;
  }

  #finish .${RESULT_CLASS} {
    grid-template-columns: 1fr;
  }

  #finish .${RESULT_CLASS}
  .mission-result-wide {
    grid-column: span 1;
  }

  #finish .${RESULT_CLASS}
  .mission-result-card {
    min-height: 64px;
  }

  #finish .${RESULT_CLASS}
  .mission-bonus-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  #finish .mission-mastery,
  #finish #missionMastery,
  #finish .mastery,
  #finish [data-mission-mastery] {
    margin-top: 18px;
    padding: 13px 11px;
  }

  #finish .finish-actions {
    grid-template-columns: 1fr;
  }

  #finish #again,
  #finish #nextMission {
    min-height: 44px;
  }
}

/* ============================================================
   REDUCED MOTION
   ============================================================ */

@media (prefers-reduced-motion: reduce) {

  #finish:not(.hidden) .outcome,
  #finish:not(.hidden) .outcome::after,
  #finish .${RESULT_CLASS}
  .mission-result-card::after,
  #finish .mission-mastery,
  #finish #missionMastery,
  #finish .mastery,
  #finish [data-mission-mastery] {
    animation: none !important;
    transition: none !important;
  }
}
`;

/* ============================================================
   TIME FORMAT
   ============================================================ */

export const formatResultTime = ms => {
  const value = Number(ms);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return '--:--.--';
  }

  const minutes =
    Math.floor(value / 60000);

  const seconds =
    Math.floor(value / 1000) % 60;

  const tenths =
    Math.floor(
      (value % 1000) / 100
    );

  return (
    `${String(minutes).padStart(2, '0')}:` +
    `${String(seconds).padStart(2, '0')}.` +
    `${tenths}`
  );
};

/* ============================================================
   GRADE
   ============================================================ */

export const resultGrade = ratingText => {
  const text =
    String(
      ratingText || ''
    ).toUpperCase();

  if (
    /\bS\+\b|\bS\b|★★★|3\/3|3 STARS/.test(
      text
    )
  ) {
    return text.includes('S+')
      ? 'S+'
      : 'S';
  }

  if (
    /\bA\b|★★|2\/3|2 STARS/.test(
      text
    )
  ) {
    return 'A';
  }

  if (
    /\bB\b|★|1\/3|1 STAR/.test(
      text
    )
  ) {
    return 'B';
  }

  return 'C';
};

/* ============================================================
   HELPERS
   ============================================================ */

const escapeHtml = value =>
  String(value ?? '').replace(
    /[&<>"']/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]
  );

const number = value =>
  Number.isFinite(Number(value))
    ? Number(value).toLocaleString()
    : '0';

const integer = value =>
  Number.isFinite(Number(value))
    ? Math.max(
        0,
        Math.floor(Number(value))
      )
    : 0;

function installStyle() {
  if (
    document.getElementById(
      'mission-results-style'
    )
  ) {
    return;
  }

  const element =
    document.createElement(
      'style'
    );

  element.id =
    'mission-results-style';

  element.textContent =
    style;

  document.head.appendChild(
    element
  );
}

/* ============================================================
   ROUTE
   ============================================================ */

function latestRouteAchievement(state) {
  return [
    ...(state.achievements || [])
  ]
    .reverse()
    .find(id =>
      String(id).startsWith(
        'route-'
      )
    )
    ?.slice(6) || null;
}

/* ============================================================
   PERFORMANCE
   ============================================================ */

function getPerformanceResult() {
  const result =
    window
      .__missionFlowPerformanceV1
      ?.latest;

  if (!result?.completed) {
    return null;
  }

  return result;
}

/* ============================================================
   ACTION BUTTONS
   ============================================================ */

function polishFinishActions() {
  const again =
    document.getElementById(
      'again'
    );

  const next =
    document.getElementById(
      'nextMission'
    );

  if (again) {
    again.classList.add(
      'finish-replay-action'
    );

    again.setAttribute(
      'aria-label',
      'Replay this mission'
    );

    again.innerHTML =
      'REPLAY RUN <b aria-hidden="true">↻</b>';
  }

  if (next) {
    next.classList.add(
      'finish-next-action'
    );

    next.setAttribute(
      'aria-label',
      'Continue to the next mission'
    );

    next.innerHTML =
      'NEXT MISSION <b aria-hidden="true">→</b>';
  }
}

/* ============================================================
   TEXT PROTECTION
   ============================================================ */

function protectFinishScreen() {
  const finish =
    document.getElementById(
      'finish'
    );

  if (!finish) {
    return;
  }

  if (
    finish.dataset.textProtectionInstalled ===
    'true'
  ) {
    return;
  }

  finish.dataset.textProtectionInstalled =
    'true';

  finish.addEventListener(
    'contextmenu',
    event => {
      event.preventDefault();
    }
  );

  finish.addEventListener(
    'selectstart',
    event => {
      event.preventDefault();
    }
  );

  finish.addEventListener(
    'dragstart',
    event => {
      event.preventDefault();
    }
  );

  finish.addEventListener(
    'copy',
    event => {
      event.preventDefault();
    }
  );

  finish.addEventListener(
    'cut',
    event => {
      event.preventDefault();
    }
  );

  finish.addEventListener(
    'keydown',
    event => {
      const key =
        event.key.toLowerCase();

      if (
        (event.ctrlKey || event.metaKey) &&
        [
          'c',
          'x',
          'a',
          'u',
          's'
        ].includes(key)
      ) {
        event.preventDefault();
      }
    }
  );
}

/* ============================================================
   BUILD RESULTS
   ============================================================ */

export function buildMissionResults() {
  const finish =
    document.getElementById(
      'finish'
    );

  if (
    !finish ||
    finish.classList.contains(
      'hidden'
    )
  ) {
    return;
  }

  installStyle();
  protectFinishScreen();
  polishFinishActions();

  const state =
    loadState() || {};

  const breakdown =
    state.lastXpBreakdown || {};

  const performance =
    getPerformanceResult();

  const existingRatingText =
    document.getElementById(
      'finishRating'
    )?.textContent || '';

  const grade =
    performance?.rating ||
    resultGrade(
      existingRatingText
    );

  const score =
    document.getElementById(
      'runScore'
    )?.textContent || '0';

  const time =
    performance?.raw?.elapsedMs > 0
      ? formatResultTime(
          performance.raw.elapsedMs
        )
      : (
          document.getElementById(
            'runTime'
          )?.textContent ||
          document.getElementById(
            'finishTime'
          )?.textContent ||
          ''
        );

  const collectedSignals =
    performance?.raw
      ? integer(
          performance.raw.signals
        )
      : integer(
          document
            .getElementById(
              'signalTotal'
            )
            ?.textContent
            ?.match(/\d+/)
            ?.[0]
        );

  const totalSignals =
    integer(
      performance?.raw
        ?.totalSignals
    );

  const signalText =
    totalSignals > 0
      ? `${collectedSignals} / ${totalSignals}`
      : (
          document.getElementById(
            'finishSignals'
          )?.textContent ||
          '0'
        );

  const cleanRoute =
    latestRouteAchievement(
      state
    );

  const clean =
    Boolean(
      cleanRoute &&
      state.achievements?.includes(
        `clean-${cleanRoute}`
      )
    );

  /* ==========================================================
     REAL BONUS CALCULATION
     ========================================================== */

  const bonusTotal =
    integer(
      breakdown.signals
    ) +
    integer(
      breakdown.secrets
    ) +
    integer(
      breakdown.optional
    ) +
    integer(
      breakdown.streak
    ) +
    integer(
      breakdown.package
    ) +
    integer(
      breakdown.modifier
    ) +
    integer(
      breakdown.contract
    ) +
    integer(
      breakdown.campaign
    ) +
    integer(
      breakdown.rival
    );

  const existing =
    finish.querySelector(
      `.${RESULT_CLASS}`
    );

  if (existing) {
    existing.remove();
  }

  const panel =
    document.createElement(
      'div'
    );

  panel.className =
    RESULT_CLASS;

  panel.setAttribute(
    'aria-label',
    'Mission results'
  );

  const performanceScore =
    performance
      ? `${integer(performance.score)} / 100`
      : '--';

  const performanceSub =
    performance?.metrics
      ? [
          `SPEED ${performance.metrics.speed}`,
          `SIGNALS ${performance.metrics.signals}`,
          `ROUTE ${performance.metrics.route}`,
          `SURVIVAL ${performance.metrics.survival}`
        ].join(' · ')
      : 'PERFORMANCE DATA NOT AVAILABLE';

  const totalXp =
    integer(
      breakdown.total
    );

  const credits =
    integer(
      breakdown.credits
    );

  const bonusItems = [
    ['SIGNAL BONUS', breakdown.signals],
    ['SECRET BONUS', breakdown.secrets],
    ['OPTIONAL BONUS', breakdown.optional],
    ['STREAK BONUS', breakdown.streak],
    ['PACKAGE BONUS', breakdown.package],
    ['MODIFIER BONUS', breakdown.modifier],
    ['CONTRACT BONUS', breakdown.contract],
    ['CAMPAIGN BONUS', breakdown.campaign],
    ['RIVAL BONUS', breakdown.rival]
  ];

  panel.innerHTML = `
    <!-- ======================================================
         CORE MISSION STATS
         ====================================================== -->

    <div class="mission-result-card mission-result-performance">
      <span class="mission-result-label">
        GRADE
      </span>

      <b class="mission-result-value">
        ${escapeHtml(grade)}
      </b>

      <small class="mission-result-sub">
        PERFORMANCE QUALITY
      </small>
    </div>

    <div class="mission-result-card">
      <span class="mission-result-label">
        TIME
      </span>

      <b class="mission-result-value">
        ${escapeHtml(
          time || '--:--.--'
        )}
      </b>

      <small class="mission-result-sub">
        FINISH TIME
      </small>
    </div>

    <div class="mission-result-card">
      <span class="mission-result-label">
        SIGNALS
      </span>

      <b class="mission-result-value">
        ${escapeHtml(
          signalText
        )}
      </b>

      <small class="mission-result-sub">
        COLLECTED
      </small>
    </div>

    <div class="mission-result-card">
      <span class="mission-result-label">
        RUN SCORE
      </span>

      <b class="mission-result-value">
        ${escapeHtml(score)}
      </b>

      <small class="mission-result-sub">
        EXISTING GAME SCORE
      </small>
    </div>

    <!-- ======================================================
         PERFORMANCE
         ====================================================== -->

    <div class="mission-result-card mission-result-performance mission-result-wide">
      <span class="mission-result-label">
        PERFORMANCE SCORE
      </span>

      <b class="mission-result-value">
        ${escapeHtml(
          performanceScore
        )}
      </b>

      <small class="mission-result-sub">
        ${escapeHtml(
          performanceSub
        )}
      </small>
    </div>

    <!-- ======================================================
         BONUS BREAKDOWN
         ====================================================== -->

    <div class="mission-result-card mission-result-wide">
      <span class="mission-result-label">
        BONUS BREAKDOWN
      </span>

      <b class="mission-result-value">
        +${number(bonusTotal)} XP
      </b>

      <small class="mission-result-sub">
        ${
          clean
            ? 'CLEAN RUN BONUS INCLUDED'
            : 'BONUSES FROM THIS RUN'
        }
      </small>

      <div class="mission-bonus-grid">

        ${bonusItems.map(
          ([label, value]) => `
            <div class="mission-bonus-item">

              <span class="mission-bonus-name">
                ${escapeHtml(label)}
              </span>

              <span class="mission-bonus-value">
                +${number(
                  integer(value)
                )}
              </span>

            </div>
          `
        ).join('')}

      </div>
    </div>

    <!-- ======================================================
         TOTAL REWARD
         ====================================================== -->

    <div class="mission-result-card mission-result-total mission-result-wide">

      <span class="mission-result-label">
        TOTAL REWARD
      </span>

      <b class="mission-result-value">
        +${number(totalXp)}
        XP
        ·
        +${number(credits)}
        CREDITS
      </b>

      <small class="mission-result-sub">
        PERSISTED TO COURIER PROFILE
      </small>

    </div>
  `;

  /* ==========================================================
     INSERT AFTER EXISTING MISSION XP REWARD
     ========================================================== */

  const reward =
    finish.querySelector(
      '.reward'
    );

  if (reward) {
    reward.insertAdjacentElement(
      'afterend',
      panel
    );
  } else {
    finish
      .querySelector(
        '.outcome'
      )
      ?.appendChild(
        panel
      );
  }
}

/* ============================================================
   REFRESH
   ============================================================ */

export function refreshIfVisible() {
  buildMissionResults();
}

/* ============================================================
   INIT
   ============================================================ */

if (
  typeof document !==
  'undefined'
) {
  installStyle();
  protectFinishScreen();

  const finish =
    document.getElementById(
      'finish'
    );

  if (finish) {
    new MutationObserver(
      () =>
        window.requestAnimationFrame(
          buildMissionResults
        )
    ).observe(
      finish,
      {
        attributes: true,
        attributeFilter: [
          'class'
        ]
      }
    );

    refreshIfVisible();
  }

  window.addEventListener(
    'relay:mission-complete',
    () =>
      window.requestAnimationFrame(
        buildMissionResults
      )
  );

  window.addEventListener(
    'relay:mission-performance-complete',
    () =>
      window.requestAnimationFrame(
        buildMissionResults
      )
  );
}