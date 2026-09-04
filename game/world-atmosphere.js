/* =========================================================
   WORLD ATMOSPHERE — FINAL GAMING / CINEMATIC VERSION
   Visual-only:
   - Home panel untouched
   - Options untouched
   - Gameplay untouched
   - JS controls actual time / atmosphere state
   ========================================================= */

#intro.intro{
  isolation:isolate;
  position:relative;

  --atm-sky-top:#07111f;
  --atm-sky-mid:#101f34;
  --atm-horizon:#203b55;
  --atm-ground:#04080f;

  --atm-glow:rgba(116,182,232,.12);
  --atm-city-back:#0a1728;
  --atm-city-front:#07101d;

  --atm-window:rgba(255,208,110,.16);
  --atm-city-light:.48;

  --atm-fog:rgba(137,172,205,.09);
  --atm-rain:.68;

  --atm-moon:#f7dfb0;
  --atm-moon-opacity:1;
  --atm-moon-glow:rgba(249,201,121,.18);

  --atm-star:rgba(220,238,255,.62);
  --atm-vignette:rgba(2,5,10,.56);

  background:#02050a;

  transition:
    background-color 1.8s ease,
    color 1.8s ease;
}


/* =========================================================
   MAIN SKY
   ========================================================= */

#intro.intro .menu-backdrop{
  background:
    radial-gradient(
      circle at var(--relay-sun-x,68%) var(--relay-sun-y,17%),
      var(--atm-glow),
      transparent 24%
    ),
    radial-gradient(
      circle at 82% 14%,
      var(--atm-moon-glow),
      transparent 19%
    ),
    radial-gradient(
      ellipse at 50% 63%,
      var(--atm-glow),
      transparent 48%
    ),
    linear-gradient(
      180deg,
      var(--atm-sky-top) 0%,
      var(--atm-sky-mid) 45%,
      var(--atm-horizon) 75%,
      var(--atm-ground) 100%
    );

  transition:
    background 2s ease,
    filter 2s ease;
}


/* =========================================================
   STARS + FOG + ATMOSPHERIC PARTICLES
   ========================================================= */

#intro.intro .menu-backdrop::before{
  content:"";
  position:absolute;
  z-index:2;
  inset:0;

  background:
    radial-gradient(circle at 8% 16%,
      var(--atm-star) 0 1px,
      transparent 1.8px),

    radial-gradient(circle at 17% 27%,
      var(--atm-star) 0 1px,
      transparent 1.8px),

    radial-gradient(circle at 27% 11%,
      var(--atm-star) 0 1px,
      transparent 1.8px),

    radial-gradient(circle at 39% 22%,
      var(--atm-star) 0 1px,
      transparent 1.8px),

    radial-gradient(circle at 51% 9%,
      var(--atm-star) 0 1px,
      transparent 1.8px),

    radial-gradient(circle at 63% 27%,
      var(--atm-star) 0 1px,
      transparent 1.8px),

    radial-gradient(circle at 75% 12%,
      var(--atm-star) 0 1px,
      transparent 1.8px),

    radial-gradient(circle at 88% 25%,
      var(--atm-star) 0 1px,
      transparent 1.8px),

    radial-gradient(circle at 94% 10%,
      var(--atm-star) 0 1px,
      transparent 1.8px),

    radial-gradient(
      ellipse at 20% 72%,
      var(--atm-fog),
      transparent 32%
    ),

    radial-gradient(
      ellipse at 76% 67%,
      var(--atm-fog),
      transparent 35%
    ),

    radial-gradient(
      ellipse at 50% 84%,
      var(--atm-fog),
      transparent 42%
    );

  opacity:.72;

  pointer-events:none;

  transition:
    opacity 2s ease,
    filter 2s ease;
}


/* =========================================================
   CINEMATIC VIGNETTE
   ========================================================= */

#intro.intro .menu-backdrop::after{
  content:"";
  position:absolute;
  z-index:7;
  inset:0;

  background:
    radial-gradient(
      ellipse at 50% 43%,
      transparent 18%,
      rgba(2,5,10,.025) 55%,
      var(--atm-vignette) 100%
    ),

    linear-gradient(
      180deg,
      rgba(2,5,10,.02) 0%,
      transparent 48%,
      var(--atm-ground) 100%
    );

  pointer-events:none;

  transition:
    background 2s ease,
    opacity 2s ease;
}


/* =========================================================
   MOON
   ========================================================= */

#intro.intro .backdrop-moon{
  z-index:1;

  width:clamp(130px,16vw,230px);

  left:auto;
  right:clamp(9%,16vw,18%);
  top:10%;

  transform:none;

  background:var(--atm-moon);

  opacity:var(--atm-moon-opacity);

  box-shadow:
    0 0 34px 10px var(--atm-moon-glow),
    0 0 72px 20px var(--atm-moon-glow),
    0 0 150px 46px var(--atm-moon-glow);

  animation:
    relay-moon-breathe 7s ease-in-out infinite;

  transition:
    background 2s ease,
    box-shadow 2s ease,
    opacity 2s ease,
    filter 2s ease;
}


@keyframes relay-moon-breathe{

  0%,
  100%{
    transform:translateY(0) scale(1);
    filter:brightness(1);
  }

  50%{
    transform:translateY(-4px) scale(1.018);
    filter:brightness(1.045);
  }

}


/* =========================================================
   ORBIT / SCI-FI RINGS
   ========================================================= */

#intro.intro .backdrop-orbit{
  z-index:1;

  opacity:.24;

  pointer-events:none;

  filter:
    drop-shadow(0 0 8px rgba(120,190,240,.12));

  transition:
    border-color 2s ease,
    opacity 2s ease,
    filter 2s ease;
}


#intro.intro .orbit-one{
  border-color:
    rgba(210,226,244,.18);
}


#intro.intro .orbit-two{
  border-color:
    var(--atm-window);

  opacity:.24;

  filter:
    drop-shadow(0 0 12px var(--atm-window));
}


/* =========================================================
   BACK CITY
   ========================================================= */

#intro.intro .city-one{
  z-index:4;

  height:38%;

  left:-2%;
  right:-2%;

  background-color:
    var(--atm-city-back);

  background-image:

    repeating-linear-gradient(
      90deg,
      transparent 0 42px,
      var(--atm-window) 43px 46px,
      transparent 47px 82px
    ),

    repeating-linear-gradient(
      90deg,
      transparent 0 91px,
      rgba(108,178,225,.08) 92px 94px,
      transparent 95px 145px
    ),

    linear-gradient(
      180deg,
      transparent 0 8%,
      rgba(160,195,220,.08) 9%,
      transparent 11%
    );

  box-shadow:
    inset 0 18px 42px rgba(137,180,215,.06),
    0 -18px 48px rgba(30,90,130,.12),
    0 -32px 90px rgba(20,45,70,.14);

  transition:
    background-color 2s ease,
    background-image 2s ease,
    box-shadow 2s ease;
}


/* =========================================================
   BACK CITY WINDOWS
   ========================================================= */

#intro.intro .city-one::after{
  content:"";

  position:absolute;

  left:0;
  right:0;
  bottom:0;

  height:58%;

  opacity:var(--atm-city-light);

  background:

    repeating-linear-gradient(
      90deg,
      transparent 0 28px,
      var(--atm-window) 29px 31px,
      transparent 32px 63px
    ),

    repeating-linear-gradient(
      0deg,
      transparent 0 18px,
      rgba(255,214,145,.055) 19px 20px,
      transparent 21px 34px
    );

  -webkit-mask-image:
    linear-gradient(
      180deg,
      transparent,
      #000 24%,
      #000
    );

  mask-image:
    linear-gradient(
      180deg,
      transparent,
      #000 24%,
      #000
    );

  pointer-events:none;

  transition:
    opacity 2s ease;
}


/* =========================================================
   FRONT CITY
   ========================================================= */

#intro.intro .city-two{
  z-index:5;

  height:25%;

  background:
    linear-gradient(
      180deg,
      rgba(20,50,75,.12),
      transparent 30%
    ),
    var(--atm-city-front);

  box-shadow:
    inset 0 18px 38px rgba(0,0,0,.30),
    0 -18px 50px rgba(0,0,0,.20),
    0 -4px 22px rgba(50,130,180,.07);

  transition:
    background 2s ease,
    box-shadow 2s ease;
}


/* =========================================================
   FRONT CITY WINDOWS
   ========================================================= */

#intro.intro .city-two::before{
  content:"";

  position:absolute;

  inset:18% 0 0;

  background:

    repeating-linear-gradient(
      90deg,
      transparent 0 38px,
      rgba(255,207,112,.13) 39px 42px,
      transparent 43px 78px
    ),

    repeating-linear-gradient(
      0deg,
      transparent 0 15px,
      rgba(255,207,112,.065) 16px 18px,
      transparent 19px 31px
    );

  opacity:var(--atm-city-light);

  -webkit-mask-image:
    linear-gradient(
      180deg,
      transparent,
      #000 14%
    );

  mask-image:
    linear-gradient(
      180deg,
      transparent,
      #000 14%
    );

  pointer-events:none;

  transition:
    opacity 2s ease;
}


/* =========================================================
   RAIN
   ========================================================= */

#intro.intro .backdrop-rain{
  z-index:6;

  opacity:var(--atm-rain);

  mix-blend-mode:screen;

  filter:
    brightness(1.08)
    contrast(1.04);

  transition:
    opacity 2s ease,
    filter 2s ease;
}


/* =========================================================
   ATMOSPHERE SHIFT
   ========================================================= */

#intro.intro.atmosphere-shift .menu-backdrop::before{
  animation:
    relay-atmosphere-breathe 1.5s ease both;
}


@keyframes relay-atmosphere-breathe{

  0%{
    opacity:.30;
    filter:blur(0);
  }

  45%{
    opacity:1;
    filter:blur(.15px);
  }

  100%{
    opacity:.72;
    filter:blur(0);
  }

}


/* =========================================================
   DAWN
   ========================================================= */

#intro.intro[data-atmosphere=dawn]{

  --atm-sky-top:#111a34;
  --atm-sky-mid:#5a526b;
  --atm-horizon:#dc8a6d;
  --atm-ground:#18131c;

  --atm-glow:rgba(255,151,94,.34);

  --atm-city-back:#34475d;
  --atm-city-front:#1c2e42;

  --atm-window:rgba(255,209,135,.16);

  --atm-city-light:.34;

  --atm-fog:rgba(255,190,157,.20);

  --atm-rain:.08;

  --atm-moon:#ffe2b0;
  --atm-moon-opacity:0;

  --atm-moon-glow:
    rgba(255,190,126,.12);

  --atm-star:
    rgba(255,232,206,.20);

  --atm-vignette:
    rgba(24,15,15,.38);
}


/* =========================================================
   DAY
   ========================================================= */

#intro.intro[data-atmosphere=day]{

  --atm-sky-top:#2c638b;
  --atm-sky-mid:#72a0b4;
  --atm-horizon:#bdcfcc;
  --atm-ground:#26363e;

  --atm-glow:rgba(255,225,184,.30);

  --atm-city-back:#4a697b;
  --atm-city-front:#2c4659;

  --atm-window:
    rgba(255,228,169,.065);

  --atm-city-light:.08;

  --atm-fog:
    rgba(225,239,242,.16);

  --atm-rain:.012;

  --atm-moon:#f1eee4;
  --atm-moon-opacity:0;

  --atm-moon-glow:transparent;

  --atm-star:transparent;

  --atm-vignette:
    rgba(8,15,20,.18);
}


/* =========================================================
   DUSK
   ========================================================= */

#intro.intro[data-atmosphere=dusk]{

  --atm-sky-top:#1a1b31;
  --atm-sky-mid:#65435b;
  --atm-horizon:#c86a58;
  --atm-ground:#130b15;

  --atm-glow:
    rgba(255,113,77,.36);

  --atm-city-back:#263a50;
  --atm-city-front:#14263c;

  --atm-window:
    rgba(255,190,111,.34);

  --atm-city-light:.72;

  --atm-fog:
    rgba(224,150,142,.17);

  --atm-rain:.15;

  --atm-moon:#ffe0ad;
  --atm-moon-opacity:0;

  --atm-moon-glow:
    rgba(255,165,107,.12);

  --atm-star:
    rgba(255,220,200,.26);

  --atm-vignette:
    rgba(15,8,14,.52);
}


/* =========================================================
   NIGHT
   ========================================================= */

#intro.intro[data-atmosphere=night]{

  --atm-sky-top:#030a17;
  --atm-sky-mid:#091a2e;
  --atm-horizon:#153e5d;
  --atm-ground:#03070e;

  --atm-glow:
    rgba(72,164,230,.20);

  --atm-city-back:#0c263d;
  --atm-city-front:#07182a;

  --atm-window:
    rgba(255,207,112,.28);

  --atm-city-light:.78;

  --atm-fog:
    rgba(100,153,195,.12);

  --atm-rain:.62;

  --atm-moon:#f6dfb2;
  --atm-moon-opacity:1;

  --atm-moon-glow:
    rgba(249,201,121,.22);

  --atm-star:
    rgba(212,235,255,.72);

  --atm-vignette:
    rgba(2,5,10,.60);
}


/* =========================================================
   DEEP NIGHT
   ========================================================= */

#intro.intro[data-atmosphere=deep-night]{

  --atm-sky-top:#01040b;
  --atm-sky-mid:#030b17;
  --atm-horizon:#09283f;
  --atm-ground:#010409;

  --atm-glow:
    rgba(53,130,190,.14);

  --atm-city-back:#061827;
  --atm-city-front:#020b16;

  --atm-window:
    rgba(106,186,235,.16);

  --atm-city-light:.46;

  --atm-fog:
    rgba(66,112,151,.11);

  --atm-rain:.82;

  --atm-moon:#dce7ef;
  --atm-moon-opacity:.82;

  --atm-moon-glow:
    rgba(119,168,205,.16);

  --atm-star:
    rgba(197,224,247,.58);

  --atm-vignette:
    rgba(1,3,7,.76);
}


/* =========================================================
   DAY — SPECIAL LIGHTING
   ========================================================= */

#intro.intro[data-atmosphere=day] .backdrop-moon,
#intro.intro[data-atmosphere=dawn] .backdrop-moon,
#intro.intro[data-atmosphere=dusk] .backdrop-moon{
  opacity:0!important;
}


#intro.intro[data-atmosphere=day] .backdrop-orbit{
  opacity:.08;
}


#intro.intro[data-atmosphere=day] .menu-backdrop::before{
  opacity:.20;
}


#intro.intro[data-atmosphere=day] .backdrop-rain{
  opacity:.01;
}


/* =========================================================
   DAWN CINEMATIC OVERLAY
   ========================================================= */

#intro.intro[data-atmosphere=dawn] .menu-backdrop::after{

  background:

    radial-gradient(
      ellipse at 50% 55%,
      transparent 16%,
      rgba(36,25,25,.025) 60%,
      var(--atm-vignette) 100%
    ),

    linear-gradient(
      180deg,
      rgba(255,160,100,.09),
      transparent 56%,
      rgba(20,18,22,.20) 100%
    );
}


/* =========================================================
   DAY CINEMATIC OVERLAY
   ========================================================= */

#intro.intro[data-atmosphere=day] .menu-backdrop::after{

  background:

    radial-gradient(
      ellipse at 50% 45%,
      transparent 18%,
      rgba(20,35,45,.018) 62%,
      var(--atm-vignette) 100%
    ),

    linear-gradient(
      180deg,
      rgba(255,255,255,.10),
      transparent 58%,
      rgba(8,15,20,.14) 100%
    );
}


/* =========================================================
   DUSK CINEMATIC OVERLAY
   ========================================================= */

#intro.intro[data-atmosphere=dusk] .menu-backdrop::after{

  background:

    radial-gradient(
      ellipse at 50% 44%,
      transparent 19%,
      rgba(25,12,20,.045) 60%,
      var(--atm-vignette) 100%
    ),

    linear-gradient(
      180deg,
      rgba(255,122,82,.11),
      transparent 53%,
      rgba(9,8,15,.32) 100%
    );
}


/* =========================================================
   NIGHT CINEMATIC OVERLAY
   ========================================================= */

#intro.intro[data-atmosphere=night] .menu-backdrop::after{

  background:

    radial-gradient(
      ellipse at 50% 43%,
      transparent 17%,
      rgba(2,5,10,.08) 57%,
      var(--atm-vignette) 100%
    ),

    linear-gradient(
      180deg,
      rgba(0,5,12,.04),
      transparent 50%,
      rgba(0,2,6,.40) 100%
    );
}


/* =========================================================
   DEEP NIGHT OVERLAY
   ========================================================= */

#intro.intro[data-atmosphere=deep-night] .menu-backdrop::after{

  background:

    radial-gradient(
      ellipse at 50% 43%,
      transparent 14%,
      rgba(1,3,7,.14) 56%,
      var(--atm-vignette) 100%
    ),

    linear-gradient(
      180deg,
      rgba(0,2,6,.10),
      transparent 50%,
      rgba(0,2,6,.58) 100%
    );
}


/* =========================================================
   NIGHT CITY BOOST
   ========================================================= */

#intro.intro[data-atmosphere=night] .city-one,
#intro.intro[data-atmosphere=deep-night] .city-one{

  box-shadow:
    inset 0 18px 42px rgba(50,130,180,.06),
    0 -20px 60px rgba(20,75,110,.20),
    0 -2px 18px rgba(80,170,225,.08);
}


#intro.intro[data-atmosphere=night] .city-two,
#intro.intro[data-atmosphere=deep-night] .city-two{

  box-shadow:
    inset 0 18px 38px rgba(0,0,0,.34),
    0 -22px 55px rgba(0,0,0,.26),
    0 -3px 22px rgba(50,145,205,.08);
}


/* =========================================================
   NIGHT STARS BOOST
   ========================================================= */

#intro.intro[data-atmosphere=night] .menu-backdrop::before{

  opacity:.78;

  filter:
    drop-shadow(0 0 3px rgba(180,225,255,.16));
}


#intro.intro[data-atmosphere=deep-night] .menu-backdrop::before{

  opacity:.88;

  filter:
    drop-shadow(0 0 4px rgba(150,210,255,.14));
}


/* =========================================================
   MOBILE — 900px
   ========================================================= */

@media(max-width:900px){

  #intro.intro .backdrop-moon{

    width:clamp(105px,19vw,175px);

    right:8%;
    top:9%;
  }


  #intro.intro .backdrop-orbit{
    opacity:.14;
  }


  #intro.intro .city-one{
    height:34%;
  }


  #intro.intro .city-two{
    height:23%;
  }


  #intro.intro .menu-backdrop::before{
    opacity:.52;
  }

}


/* =========================================================
   MOBILE — 700px
   ========================================================= */

@media(max-width:700px){

  #intro.intro .backdrop-moon{

    width:108px;

    right:6%;
    top:8%;

    box-shadow:
      0 0 28px 10px var(--atm-moon-glow),
      0 0 65px 20px var(--atm-moon-glow),
      0 0 105px 30px var(--atm-moon-glow);
  }


  #intro.intro .city-one{
    height:31%;
  }


  #intro.intro .city-two{
    height:20%;
  }


  #intro.intro .city-one::after{
    opacity:
      calc(var(--atm-city-light) * .76);
  }


  #intro.intro .city-two::before{
    opacity:
      calc(var(--atm-city-light) * .76);
  }


  #intro.intro .backdrop-rain{
    opacity:
      calc(var(--atm-rain) * .60);
  }


  #intro.intro .menu-backdrop::before{

    filter:blur(.2px);

    opacity:.42;
  }

}


/* =========================================================
   SMALL MOBILE — 420px
   ========================================================= */

@media(max-width:420px){

  #intro.intro .backdrop-moon{

    width:84px;

    right:5%;
    top:7%;
  }


  #intro.intro .city-one{
    height:28%;
  }


  #intro.intro .city-two{
    height:18%;
  }


  #intro.intro .menu-backdrop::before{
    opacity:.38;
  }

}


/* =========================================================
   LANDSCAPE MOBILE
   ========================================================= */

@media(orientation:landscape) and (max-height:560px){

  #intro.intro .backdrop-moon{

    top:6%;

    width:
      clamp(70px,15vw,140px);
  }


  #intro.intro .city-one{
    height:34%;
  }


  #intro.intro .city-two{
    height:22%;
  }

}


/* =========================================================
   REDUCED MOTION
   ========================================================= */

@media(prefers-reduced-motion:reduce){

  #intro.intro *{

    animation-duration:.001ms!important;
    animation-iteration-count:1!important;

    scroll-behavior:auto!important;
  }


  #intro.intro .menu-backdrop,
  #intro.intro .menu-backdrop::before,
  #intro.intro .menu-backdrop::after,
  #intro.intro .backdrop-moon,
  #intro.intro .city-one,
  #intro.intro .city-two,
  #intro.intro .backdrop-rain{

    transition:none!important;
  }

    }
