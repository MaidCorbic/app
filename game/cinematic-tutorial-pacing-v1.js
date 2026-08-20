/* Cinematic + Tutorial pacing polish V1. Presentation only; gameplay ownership stays untouched. */
(() => {
  if (window.__relayPacingPolishV1) return;
  window.__relayPacingPolishV1 = true;

  const style = document.createElement('style');
  style.textContent = `
    /* CINEMATIC: slower reveal, longer holds, more breathing room. */
    #relaySplash.cinematic-arrival #relaySplashArt{animation-duration:22s!important}
    #relaySplash.cinematic-arrival .arrival-status{animation-duration:1.4s!important;animation-delay:.8s!important}
    #relaySplash.cinematic-arrival .arrival-kicker{animation-duration:1.8s!important;animation-delay:1.8s!important}
    #relaySplash.cinematic-arrival .arrival-title{animation-duration:3.8s!important;animation-delay:3.7s!important}
    #relaySplash.cinematic-arrival .arrival-title span{animation-delay:6s!important;animation-duration:5s!important}
    #relaySplash.cinematic-arrival .arrival-title em{animation-delay:7.2s!important;animation-duration:4s!important}
    #relaySplash.cinematic-arrival .arrival-line{animation-duration:2.2s!important;animation-delay:8.1s!important}
    #relaySplash.cinematic-arrival .arrival-message{animation-duration:2.4s!important;animation-delay:9.3s!important}
    #relaySplash.cinematic-arrival .arrival-mission{animation-duration:2.3s!important;animation-delay:12.4s!important}
    #relaySplash.cinematic-arrival .arrival-signal{animation-duration:1.2s!important;animation-delay:2.8s!important}
    #relaySplash.cinematic-arrival::after{animation-duration:7s!important}
    #relaySplash.cinematic-arrival .arrival-particles i{animation-duration:9s!important}
    #relaySplash.cinematic-arrival.is-leaving{transition-duration:1.4s!important}

    /* TUTORIAL: same layout, calmer reveal and readable accordion motion. */
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-intro,
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-quick-card,
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-accordion,
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-foot{
      animation:tutorialCinematicIn .65s cubic-bezier(.2,.75,.2,1) both;
    }
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-intro{animation-delay:.08s}
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-quick-card:nth-child(1){animation-delay:.22s}
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-quick-card:nth-child(2){animation-delay:.34s}
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-quick-card:nth-child(3){animation-delay:.46s}
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-accordion:nth-of-type(1){animation-delay:.60s}
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-accordion:nth-of-type(2){animation-delay:.72s}
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-accordion:nth-of-type(3){animation-delay:.84s}
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-accordion:nth-of-type(4){animation-delay:.96s}
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-accordion:nth-of-type(5){animation-delay:1.08s}
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-accordion:nth-of-type(6){animation-delay:1.20s}
    #titlePanel:not(.hidden) .home-tutorial-content .tutorial-accordion:nth-of-type(7){animation-delay:1.32s}
    #titlePanel:not(.hidden) .tutorial-accordion.is-open .tutorial-panel{animation:tutorialPanelSlow .48s cubic-bezier(.2,.75,.2,1) both}
    #titlePanel:not(.hidden) .tutorial-accordion>button{transition:background .35s ease,color .35s ease,letter-spacing .35s ease}
    @keyframes tutorialCinematicIn{from{opacity:0;transform:translateY(12px) scale(.985);filter:blur(2px)}to{opacity:1;transform:none;filter:none}}
    @keyframes tutorialPanelSlow{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:none}}
    @media(prefers-reduced-motion:reduce){#titlePanel:not(.hidden) .home-tutorial-content *{animation-duration:.01ms!important;animation-delay:0ms!important}}
  `;
  document.head.appendChild(style);
})();
