import { RunnerScene } from '../scenes/RunnerScene.js';


/* ============================================================
   FUTURISTIC NEON WORLD V2.1
   ------------------------------------------------------------
   WORLD SYSTEM ONLY
   - futuristic route generation
   - layered sky
   - parallax city
   - mega towers
   - sky rails
   - bridges
   - holographic signage
   - ground infrastructure
   - checkpoint beacons
   - start gate
   - goal relay
   - world presentation patch
   ============================================================ */


/* ============================================================
   WORLD SKINS
   ============================================================ */

const WORLD_SKINS =
  Object.freeze({

    'first-delivery': {
      accent: 0x55e9ff,
      secondary: 0x8b65ff,
      tertiary: 0x69efb0,
      warning: 0xffca70,
      sky: 0x030813,
      horizon: 0x071426,
      building: 0x081322,
      building2: 0x0b1a2b,
      zone: 'NEON DISTRICT',
      architecture: 'CITY'
    },

    'dead-drop': {
      accent: 0xff7f66,
      secondary: 0xffca70,
      tertiary: 0x55e9ff,
      warning: 0xff5364,
      sky: 0x060b14,
      horizon: 0x10151e,
      building: 0x101722,
      building2: 0x1a2028,
      zone: 'DOCK SECTOR',
      architecture: 'INDUSTRIAL'
    },

    blackout: {
      accent: 0x55e9ff,
      secondary: 0x69efb0,
      tertiary: 0x8b65ff,
      warning: 0xff5364,
      sky: 0x02060d,
      horizon: 0x061014,
      building: 0x061014,
      building2: 0x0a171a,
      zone: 'BLACK GRID',
      architecture: 'BLACKOUT'
    },

    pursuit: {
      accent: 0xff5364,
      secondary: 0x55e9ff,
      tertiary: 0xffca70,
      warning: 0xff7f66,
      sky: 0x050813,
      horizon: 0x11101b,
      building: 0x0c111d,
      building2: 0x111927,
      zone: 'RAIL SPINE',
      architecture: 'TRANSIT'
    },

    'signal-storm': {
      accent: 0x9f7bff,
      secondary: 0x55e9ff,
      tertiary: 0xffca70,
      warning: 0xff5364,
      sky: 0x070511,
      horizon: 0x10091b,
      building: 0x100c1d,
      building2: 0x17112a,
      zone: 'CROWN ARRAY',
      architecture: 'SIGNAL'
    },

    'corporate-lockdown': {
      accent: 0xff5364,
      secondary: 0xffca70,
      tertiary: 0x55e9ff,
      warning: 0xff7f66,
      sky: 0x07090f,
      horizon: 0x11141b,
      building: 0x0d1119,
      building2: 0x151a23,
      zone: 'HELIX VERTICAL',
      architecture: 'CORPORATE'
    },

    'final-relay': {
      accent: 0xffca70,
      secondary: 0x55e9ff,
      tertiary: 0x9f7bff,
      warning: 0xff5364,
      sky: 0x06050b,
      horizon: 0x14100b,
      building: 0x100d0a,
      building2: 0x19140e,
      zone: 'APEX SPINE',
      architecture: 'APEX'
    },
    'mission-08': {
      accent: 0x76e7ff,
      secondary: 0x9f7bff,
      tertiary: 0x69efb0,
      warning: 0xff5364,
      sky: 0x03050c,
      horizon: 0x07101d,
      building: 0x08101c,
      building2: 0x10172a,
      zone: 'GHOSTLINE',
      architecture: 'GHOST'
    }

  });


/* ============================================================
   HELPERS
   ============================================================ */

function getSkin(
  mission
) {
  return (
    WORLD_SKINS[
      mission?.id
    ] ||
    WORLD_SKINS[
      'first-delivery'
    ]
  );
}


function safeNumber(
  value,
  fallback
) {
  const n =
    Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
}


/* ============================================================
   FUTURISTIC ROUTE GENERATOR
   ------------------------------------------------------------
   This remains part of the World system because the generated
   route determines the environment/gameplay geometry.
   ============================================================ */

function futuristicRoute(
  scene
) {
  const mission =
    scene.mission;

  if (!mission) {
    return;
  }


  const start =
    safeNumber(
      mission.spawn?.x,
      120
    );


  const requestedGoal =
    safeNumber(
      mission.goal?.x,
      start + 6000
    );


  const end =
    Math.max(
      start + 2400,
      requestedGoal
    );


  const span =
    end - start;


  const skin =
    getSkin(
      mission
    );


  const basePlatforms = [];
  const obstacles = [];
  const boosts = [];
  const checkpoints = [];
  const signals = [];
  const guides = [];
  const movingGates = [];


  /* ==========================================================
     LOW-LINE ROUTE
     ========================================================== */

  for (
    let i = 0;
    i < 9;
    i++
  ) {

    const x =
      start +
      i *
        (span / 9);


    const gap =
      i === 0
        ? 0
        : 72 +
          (i % 3) *
            24;


    const width =
      Math.max(
        300,
        span / 9 -
          gap
      );


    const y =
      610 -
      (
        i % 4 === 1
          ? 28
          : i % 4 === 2
            ? 58
            : 0
      );


    basePlatforms.push([
      x,
      y,
      width,
      110
    ]);


    if (
      i > 0
    ) {
      boosts.push([
        x + 42,
        y - 22
      ]);
    }


    if (
      i > 1 &&
      i < 8
    ) {
      obstacles.push([
        x +
          width *
            .52,
        y - 32
      ]);
    }

  }


  /* ==========================================================
     ROOFTOP CHAIN
     ========================================================== */

  for (
    let i = 0;
    i < 10;
    i++
  ) {

    const x =
      start +
      230 +
      i *
        (span / 10);


    const y =
      450 -
      (i % 3) *
        42;


    basePlatforms.push([
      x,
      y,
      170 +
        (i % 2) *
          28,
      20,
      'roof'
    ]);


    signals.push([
      x + 72,
      y - 28
    ]);

  }


  /* ==========================================================
     CHECKPOINTS
     ========================================================== */

  const checkpointX = [
    0.24,
    0.52,
    0.78
  ];


  checkpointX.forEach(
    (
      ratio,
      index
    ) => {

      const x =
        start +
        span *
          ratio;


      checkpoints.push([
        x,
        535 -
          (index % 2) *
            40
      ]);


      signals.push([
        x + 70,
        520 -
          (index % 2) *
            36
      ]);


      if (
        index > 0
      ) {

        movingGates.push([
          x + 125,
          420,
          370,
          560
        ]);

      }

    }
  );


  /* ==========================================================
     SIGNAL COLLECTION
     ========================================================== */

  for (
    let i = 0;
    i < 10;
    i++
  ) {

    const x =
      start +
      260 +
      i *
        (
          (span - 520) /
          9
        );


    const y =
      548 -
      (
        i % 4 === 1
          ? 62
          : i % 4 === 2
            ? 20
            : 0
      );


    signals.push([
      x,
      y
    ]);

  }


  /* ==========================================================
     GUIDES
     ========================================================== */

  guides.push(

    {
      x:
        start + 120,

      y:
        525,

      text:
        'NEON GATE // FOLLOW THE TRACE'
    },

    {
      x:
        start +
        span * .30,

      y:
        410,

      text:
        'VERTICAL ROUTE // TAKE THE HIGH LINE'
    },

    {
      x:
        start +
        span * .58,

      y:
        490,

      text:
        'CHECKPOINT // MOMENTUM IS YOUR SHIELD'
    },

    {
      x:
        start +
        span * .84,

      y:
        410,

      text:
        `${skin.zone} // FINAL APPROACH`
    }

  );


  /* ==========================================================
     APPLY GENERATED ROUTE
     ========================================================== */

  mission.platforms =
    basePlatforms;


  mission.obstacles =
    obstacles;


  mission.boostPads =
    boosts;


  mission.checkpoints =
    checkpoints;


  mission.signals =
    signals.slice(
      0,
      24
    );


  mission.guides =
    guides;


  mission.movingGates =
    movingGates;


  mission.safeZones =
    checkpoints.map(
      ([x, y]) => [
        Math.max(
          start,
          x - 100
        ),

        y + 30,

        200
      ]
    );


  /* ==========================================================
     ENEMIES
     ========================================================== */

  const enemyTypes = [
    'enemy-runner',
    'security',
    'alien-ground',
    'invader',
    'dino'
  ];


  mission.enemies =
    enemyTypes
      .slice(
        0,
        4
      )
      .map(
        (
          type,
          index
        ) => {

          const x =
            start +
            span *
              (
                .18 +
                index *
                  .18
              );


          return {

            type,

            x,

            y:
              510 -
              (index % 2) *
                85,

            min:
              x - 120,

            max:
              x + 120

          };

        }
      );


  mission.goal.x =
    end;


  mission.goal.y =
    535;


  mission.__futuristicWorld =
    true;

}


/* ============================================================
   BACKGROUND STAR FIELD
   ============================================================ */

function createStarField(
  scene,
  width,
  skin
) {

  const stars =
    scene.add
      .graphics()
      .setScrollFactor(.03)
      .setDepth(-19);


  for (
    let i = 0;
    i < 120;
    i++
  ) {

    const x =
      (
        i * 173
      ) %
      width;


    const y =
      45 +
      (
        (i * 97) %
        350
      );


    const radius =
      i % 17 === 0
        ? 2
        : i % 5 === 0
          ? 1.4
          : .8;


    const color =
      i % 7 === 0
        ? skin.secondary
        : i % 5 === 0
          ? skin.tertiary
          : skin.accent;


    stars
      .fillStyle(
        color,
        .12 +
          (i % 5) *
            .035
      )
      .fillCircle(
        x,
        y,
        radius
      );

  }


  return stars;
}


/* ============================================================
   ATMOSPHERIC STREAKS
   ============================================================ */

function createAtmosphericStreaks(
  scene,
  width,
  skin
) {

  const streaks =
    scene.add
      .graphics()
      .setScrollFactor(.06)
      .setDepth(-18);


  for (
    let i = 0;
    i < 14;
    i++
  ) {

    const x =
      (
        i * 287
      ) %
      width;


    const y =
      100 +
      (
        (i * 83) %
        300
      );


    const length =
      80 +
      (
        (i * 31) %
        170
      );


    streaks
      .lineStyle(
        i % 4 === 0
          ? 2
          : 1,
        i % 3 === 0
          ? skin.secondary
          : skin.accent,
        .035 +
          (i % 3) *
            .012
      )
      .lineBetween(
        x,
        y,
        x + length,
        y
      );

  }


  return streaks;
}


/* ============================================================
   FAR CITY
   ============================================================ */

function createFarCity(
  scene,
  width,
  skin
) {

  const far =
    scene.add
      .graphics()
      .setScrollFactor(.12)
      .setDepth(-15);


  for (
    let x = -180,
      i = 0;

    x <
      width + 320;

    x += 135,
      i++
  ) {

    const h =
      120 +
      (
        (i * 53) %
        220
      );


    const w =
      82 +
      (
        (i * 29) %
        62
      );


    const top =
      585 -
      h;


    far
      .fillStyle(
        skin.building,
        .92
      )
      .fillRect(
        x,
        top,
        w,
        h
      );


    far
      .lineStyle(
        1,
        skin.accent,
        .13
      )
      .strokeRect(
        x,
        top,
        w,
        h
      );


    for (
      let y =
        top + 24;

      y <
        560;

      y += 25
    ) {

      const light =
        i % 4 === 0
          ? skin.secondary
          : skin.accent;


      far
        .fillStyle(
          light,
          .10 +
            (i % 3) *
              .025
        )
        .fillRect(
          x + 12,
          y,
          8,
          3
        );


      if (
        w > 110
      ) {

        far.fillRect(
          x + 34,
          y,
          8,
          3
        );


        far.fillRect(
          x + 56,
          y,
          8,
          3
        );

      }

    }

  }


  return far;
}


/* ============================================================
   MEGA TOWERS
   ============================================================ */

function createMegaTowers(
  scene,
  width,
  skin
) {

  const towers =
    scene.add
      .graphics()
      .setScrollFactor(.25)
      .setDepth(-12);


  const towerPositions = [
    420,
    1050,
    1780,
    2500,
    3350,
    4200,
    5050,
    5900
  ];


  towerPositions.forEach(
    (
      x,
      index
    ) => {

      if (
        x >
        width + 500
      ) {
        return;
      }


      const h =
        300 +
        (
          index % 4
        ) *
          80;


      const w =
        150 +
        (
          index % 3
        ) *
          35;


      const top =
        610 -
        h;


      /* Main body */

      towers
        .fillStyle(
          skin.building2,
          .96
        )
        .fillRoundedRect(
          x,
          top,
          w,
          h,
          10
        );


      /* Outer frame */

      towers
        .lineStyle(
          2,
          skin.accent,
          .22
        )
        .strokeRoundedRect(
          x,
          top,
          w,
          h,
          10
        );


      /* Central spine */

      towers
        .lineStyle(
          1,
          skin.secondary,
          .20
        )
        .lineBetween(
          x + w * .5,
          top,
          x + w * .5,
          610
        );


      /* Side neon rails */

      towers
        .lineStyle(
          2,
          skin.accent,
          .16
        )
        .lineBetween(
          x + 15,
          top + 15,
          x + 15,
          595
        );


      towers
        .lineBetween(
          x + w - 15,
          top + 15,
          x + w - 15,
          595
        );


      /* Vertical window banks */

      for (
        let y =
          top + 32;

        y <
          575;

        y += 30
      ) {

        const alpha =
          .08 +
          (index % 3) *
            .025;


        towers
          .fillStyle(
            skin.accent,
            alpha
          )
          .fillRect(
            x + 28,
            y,
            22,
            5
          );


        towers
          .fillStyle(
            skin.secondary,
            alpha
          )
          .fillRect(
            x + w - 50,
            y,
            22,
            5
          );

      }


      /* Crown */

      towers
        .lineStyle(
          2,
          skin.secondary,
          .22
        )
        .lineBetween(
          x + 28,
          top,
          x + w - 28,
          top
        );


      /* Antenna */

      if (
        index % 2 === 0
      ) {

        towers
          .lineStyle(
            1,
            skin.accent,
            .30
          )
          .lineBetween(
            x + w * .5,
            top,
            x + w * .5,
            top - 70
          );


        towers
          .fillStyle(
            skin.accent,
            .65
          )
          .fillCircle(
            x + w * .5,
            top - 72,
            2
          );

      }

    }
  );


  return towers;
}


/* ============================================================
   SKY RAILS
   ============================================================ */

function createSkyRails(
  scene,
  width,
  skin
) {

  const rails =
    scene.add
      .graphics()
      .setScrollFactor(.20)
      .setDepth(-11);


  const railY = [
    185,
    275,
    350
  ];


  railY.forEach(
    (
      y,
      index
    ) => {

      const color =
        index === 1
          ? skin.secondary
          : skin.accent;


      rails
        .lineStyle(
          index === 1
            ? 2
            : 1,
          color,
          index === 1
            ? .24
            : .12
        )
        .lineBetween(
          -200,
          y,
          width + 300,
          y
        );


      rails
        .lineStyle(
          1,
          color,
          .07
        )
        .lineBetween(
          -200,
          y + 8,
          width + 300,
          y + 8
        );


      for (
        let x = 120;
        x < width;
        x += 220
      ) {

        rails
          .lineStyle(
            1,
            color,
            .10
          )
          .lineBetween(
            x,
            y,
            x + 35,
            y + 35
          );

      }

    }
  );


  return rails;
}


/* ============================================================
   SKY BRIDGES
   ============================================================ */

function createSkyBridges(
  scene,
  width,
  skin
) {

  const bridges =
    scene.add
      .graphics()
      .setScrollFactor(.32)
      .setDepth(-9);


  const bridgeData = [
    {
      x: 640,
      y: 330,
      w: 420
    },

    {
      x: 1800,
      y: 295,
      w: 520
    },

    {
      x: 3180,
      y: 345,
      w: 360
    },

    {
      x: 4550,
      y: 285,
      w: 470
    }
  ];


  bridgeData.forEach(
    (
      bridge,
      index
    ) => {

      if (
        bridge.x >
        width + 400
      ) {
        return;
      }


      const x =
        bridge.x;


      const y =
        bridge.y;


      const w =
        bridge.w;


      /* Main bridge */

      bridges
        .fillStyle(
          skin.building2,
          .90
        )
        .fillRect(
          x,
          y,
          w,
          22
        );


      /* Top rail */

      bridges
        .lineStyle(
          2,
          skin.accent,
          .22
        )
        .lineBetween(
          x,
          y,
          x + w,
          y
        );


      /* Bottom light */

      bridges
        .lineStyle(
          2,
          skin.secondary,
          .15
        )
        .lineBetween(
          x,
          y + 22,
          x + w,
          y + 22
        );


      /* Support towers */

      const supportA =
        x + 40;


      const supportB =
        x + w - 40;


      bridges
        .lineStyle(
          2,
          skin.accent,
          .15
        )
        .lineBetween(
          supportA,
          y + 22,
          supportA,
          y + 130
        );


      bridges
        .lineBetween(
          supportB,
          y + 22,
          supportB,
          y + 130
        );


      /* Bridge windows */

      for (
        let px =
          x + 24;

        px <
          x + w - 20;

        px += 46
      ) {

        bridges
          .fillStyle(
            index % 2 === 0
              ? skin.accent
              : skin.secondary,
            .14
          )
          .fillRect(
            px,
            y + 7,
            22,
            3
          );

      }

    }
  );


  return bridges;
}


/* ============================================================
   HOLOGRAPHIC SIGNAGE
   ============================================================ */

function createHolographicSigns(
  scene,
  width,
  skin
) {

  const signs =
    scene.add
      .graphics()
      .setScrollFactor(.38)
      .setDepth(-7);


  const labels = [
    'RELAY NETWORK',
    'SECTOR 07',
    'NEON DISTRICT',
    'HELIX GRID',
    'SIGNAL NODE',
    'TRANSIT CORE'
  ];


  for (
    let i = 0;
    i < labels.length;
    i++
  ) {

    const x =
      500 +
      i *
        920;


    if (
      x >
      width + 300
    ) {
      break;
    }


    const y =
      230 +
      (
        i % 3
      ) *
        72;


    const color =
      i % 2 === 0
        ? skin.accent
        : skin.secondary;


    signs
      .lineStyle(
        1,
        color,
        .18
      )
      .strokeRect(
        x,
        y,
        170,
        38
      );


    signs
      .lineStyle(
        1,
        color,
        .08
      )
      .lineBetween(
        x + 10,
        y + 19,
        x + 160,
        y + 19
      );


    /*
     * Small technical blocks instead of Phaser text.
     * Keeps the background cheap and crisp.
     */

    signs
      .fillStyle(
        color,
        .26
      )
      .fillRect(
        x + 10,
        y + 10,
        4,
        18
      );


    signs
      .fillStyle(
        color,
        .13
      )
      .fillRect(
        x + 22,
        y + 12,
        72,
        3
      );


    signs
      .fillRect(
        x + 22,
        y + 21,
        112,
        3
      );


    signs
      .fillStyle(
        skin.tertiary,
        .18
      )
      .fillRect(
        x + 142,
        y + 10,
        14,
        4
      );

  }


  return signs;
}


/* ============================================================
   ORBITAL STRUCTURE
   ============================================================ */

function createOrbitalStructure(
  scene,
  width,
  skin
) {

  const rings =
    scene.add
      .graphics()
      .setScrollFactor(.035)
      .setDepth(-13);


  const ringBase =
    Math.max(
      780,
      Math.min(
        width * .68,
        1180
      )
    );


  rings
    .lineStyle(
      3,
      skin.accent,
      .12
    )
    .strokeCircle(
      ringBase,
      250,
      150
    );


  rings
    .lineStyle(
      2,
      skin.secondary,
      .10
    )
    .strokeCircle(
      ringBase,
      250,
      205
    );


  rings
    .lineStyle(
      1,
      skin.tertiary,
      .12
    )
    .strokeCircle(
      ringBase,
      250,
      270
    );


  rings
    .fillStyle(
      skin.accent,
      .035
    )
    .fillCircle(
      ringBase,
      250,
      130
    );


  /* Cross axis */

  rings
    .lineStyle(
      1,
      skin.accent,
      .06
    )
    .lineBetween(
      ringBase - 300,
      250,
      ringBase + 300,
      250
    );


  rings
    .lineBetween(
      ringBase,
      -30,
      ringBase,
      530
    );


  return rings;
}


/* ============================================================
   GROUND INFRASTRUCTURE
   ============================================================ */

function createGroundGrid(
  scene,
  width,
  skin
) {

  const grid =
    scene.add
      .graphics()
      .setScrollFactor(.82)
      .setDepth(-2);


  /* Base */

  grid
    .fillStyle(
      0x030912,
      .98
    )
    .fillRect(
      0,
      610,
      width,
      250
    );


  /* Main horizon rail */

  grid
    .lineStyle(
      3,
      skin.accent,
      .20
    )
    .lineBetween(
      0,
      610,
      width,
      610
    );


  /* Secondary horizon rail */

  grid
    .lineStyle(
      1,
      skin.secondary,
      .10
    )
    .lineBetween(
      0,
      618,
      width,
      618
    );


  /* Perspective lanes */

  for (
    let x = -100;
    x < width + 200;
    x += 80
  ) {

    grid
      .lineStyle(
        1,
        skin.accent,
        .075
      )
      .lineBetween(
        x,
        610,
        x + 180,
        860
      );

  }


  /* Horizontal depth lines */

  for (
    let y = 650;
    y < 860;
    y += 42
  ) {

    grid
      .lineStyle(
        1,
        skin.accent,
        .07
      )
      .lineBetween(
        0,
        y,
        width,
        y
      );

  }


  /* Main transit lanes */

  const transitLines = [
    675,
    770
  ];


  transitLines.forEach(
    y => {

      grid
        .lineStyle(
          2,
          skin.secondary,
          .10
        )
        .lineBetween(
          0,
          y,
          width,
          y
        );

    }
  );


  /* Warning strips */

  for (
    let x = 240;
    x < width;
    x += 620
  ) {

    grid
      .fillStyle(
        skin.warning,
        .10
      )
      .fillRect(
        x,
        624,
        90,
        4
      );

  }


  return grid;
}


/* ============================================================
   PLATFORM ARCHITECTURE
   ------------------------------------------------------------
   Visual treatment for generated route platforms.
   ============================================================ */

function createPlatformArchitecture(
  scene,
  mission,
  skin
) {

  const platforms =
    Array.isArray(
      mission.platforms
    )
      ? mission.platforms
      : [];


  const architecture =
    scene.add
      .graphics()
      .setScrollFactor(1)
      .setDepth(-1);


  platforms.forEach(
    (
      platform,
      index
    ) => {

      const x =
        Number(
          platform?.[0]
        );


      const y =
        Number(
          platform?.[1]
        );


      const width =
        Number(
          platform?.[2]
        );


      const height =
        Number(
          platform?.[3]
        );


      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(width) ||
        !Number.isFinite(height)
      ) {
        return;
      }


      const isRoof =
        platform?.[4] ===
        'roof';


      const edgeColor =
        isRoof
          ? skin.secondary
          : skin.accent;


      /* Main body */

      architecture
        .fillStyle(
          isRoof
            ? 0x0a1420
            : 0x07111c,
          .94
        )
        .fillRect(
          x,
          y,
          width,
          height
        );


      /* Top edge */

      architecture
        .lineStyle(
          isRoof
            ? 2
            : 2,
          edgeColor,
          isRoof
            ? .48
            : .34
        )
        .lineBetween(
          x,
          y,
          x + width,
          y
        );


      /* Lower edge */

      architecture
        .lineStyle(
          1,
          skin.secondary,
          .12
        )
        .lineBetween(
          x,
          y + height,
          x + width,
          y + height
        );


      /* Underside energy segments */

      const segmentWidth =
        Math.max(
          28,
          Math.min(
            80,
            width / 5
          )
        );


      for (
        let sx =
          x + 18;

        sx <
          x + width - 18;

        sx +=
          segmentWidth + 22
      ) {

        architecture
          .fillStyle(
            index % 3 === 0
              ? skin.accent
              : skin.secondary,
            .13
          )
          .fillRect(
            sx,
            y + height - 8,
            segmentWidth,
            3
          );

      }


      /* Structural supports */

      if (
        !isRoof &&
        index % 2 === 0
      ) {

        architecture
          .lineStyle(
            1,
            skin.accent,
            .10
          )
          .lineBetween(
            x + 32,
            y + height,
            x + 52,
            y + height + 55
          );


        architecture
          .lineBetween(
            x + width - 32,
            y + height,
            x + width - 52,
            y + height + 55
          );

      }


      /* Rooftop technical elements */

      if (
        isRoof
      ) {

        architecture
          .lineStyle(
            1,
            skin.secondary,
            .25
          )
          .lineBetween(
            x + width * .5,
            y,
            x + width * .5,
            y - 22
          );


        architecture
          .fillStyle(
            skin.secondary,
            .42
          )
          .fillRect(
            x + width * .5 - 8,
            y - 25,
            16,
            3
          );

      }

    }
  );


  return architecture;
}


/* ============================================================
   CHECKPOINT BEACONS
   ============================================================ */

function createCheckpointBeacons(
  scene,
  mission,
  skin
) {

  const checkpoints =
    Array.isArray(
      mission.checkpoints
    )
      ? mission.checkpoints
      : [];


  const objects = [];


  checkpoints.forEach(
    (
      point,
      index
    ) => {

      const x =
        Number(
          point?.[0]
        );


      const y =
        Number(
          point?.[1]
        );


      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y)
      ) {
        return;
      }


      const beam =
        scene.add
          .rectangle(
            x,
            535,
            4,
            150,
            skin.accent,
            .07
          )
          .setDepth(-1);


      const core =
        scene.add
          .circle(
            x,
            y - 8,
            11,
            skin.accent,
            .20
          )
          .setDepth(-1);


      core.setStrokeStyle(
        2,
        skin.accent,
        .70
      );


      const halo =
        scene.add
          .circle(
            x,
            y - 8,
            22,
            skin.secondary,
            0
          )
          .setDepth(-1);


      halo.setStrokeStyle(
        1,
        skin.secondary,
        .20
      );


      /* Vertical signal rails */

      const rail =
        scene.add
          .rectangle(
            x - 17,
            450,
            1,
            165,
            skin.secondary,
            .08
          )
          .setDepth(-1);


      const rail2 =
        scene.add
          .rectangle(
            x + 17,
            450,
            1,
            165,
            skin.secondary,
            .08
          )
          .setDepth(-1);


      objects.push({
        beam,
        core,
        halo,
        rail,
        rail2
      });


      if (
        !scene.motionReduced
      ) {

        scene.tweens?.add?.({
          targets:
            core,

          scale: {
            from: .9,
            to: 1.35
          },

          alpha: {
            from: .10,
            to: .34
          },

          duration:
            900 +
            index *
              120,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'
        });


        scene.tweens?.add?.({
          targets:
            halo,

          scale: {
            from: .85,
            to: 1.18
          },

          alpha: {
            from: .06,
            to: .20
          },

          duration:
            1300 +
            index *
              100,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'
        });


        scene.tweens?.add?.({
          targets:
            beam,

          alpha: {
            from: .025,
            to: .11
          },

          duration:
            1200,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'
        });

      }

    }
  );


  return objects;
}


/* ============================================================
   START GATE
   ============================================================ */

function createStartGate(
  scene,
  mission,
  skin
) {

  const x =
    safeNumber(
      mission.spawn?.x,
      120
    );


  const y =
    safeNumber(
      mission.spawn?.y,
      535
    );


  const gate =
    scene.add
      .graphics()
      .setDepth(-1);


  const leftX =
    x - 38;


  const rightX =
    x + 38;


  /* Pillars */

  gate
    .fillStyle(
      0x07111c,
      .94
    )
    .fillRect(
      leftX,
      y - 125,
      9,
      125
    );


  gate
    .fillRect(
      rightX - 9,
      y - 125,
      9,
      125
    );


  /* Pillar edges */

  gate
    .lineStyle(
      2,
      skin.accent,
      .34
    )
    .lineBetween(
      leftX,
      y - 125,
      leftX,
      y
    );


  gate
    .lineBetween(
      rightX,
      y - 125,
      rightX,
      y
    );


  /* Top frame */

  gate
    .lineStyle(
      3,
      skin.secondary,
      .35
    )
    .lineBetween(
      leftX,
      y - 125,
      rightX,
      y - 125
    );


  /* Energy gate */

  gate
    .lineStyle(
      2,
      skin.accent,
      .18
    )
    .lineBetween(
      x,
      y - 118,
      x,
      y - 8
    );


  gate
    .lineStyle(
      1,
      skin.secondary,
      .16
    )
    .lineBetween(
      x - 20,
      y - 108,
      x + 20,
      y - 108
    );


  /* Floor marker */

  gate
    .lineStyle(
      2,
      skin.accent,
      .26
    )
    .strokeEllipse(
      x,
      y + 2,
      110,
      28
    );


  gate
    .lineStyle(
      1,
      skin.secondary,
      .15
    )
    .strokeEllipse(
      x,
      y + 2,
      76,
      18
    );


  if (
    !scene.motionReduced
  ) {

    scene.tweens?.add?.({
      targets:
        gate,

      alpha: {
        from: .72,
        to: 1
      },

      duration:
        1200,

      yoyo:
        true,

      repeat:
        -1,

      ease:
        'Sine.easeInOut'
    });

  }


  return gate;
}


/* ============================================================
   GOAL RELAY STRUCTURE
   ============================================================ */

function createGoalRelay(
  scene,
  mission,
  skin
) {

  const x =
    safeNumber(
      mission.goal?.x,
      6000
    );


  const y =
    safeNumber(
      mission.goal?.y,
      535
    );


  const relay =
    scene.add
      .graphics()
      .setDepth(-1);


  /* Floor rings */

  relay
    .lineStyle(
      3,
      skin.accent,
      .24
    )
    .strokeEllipse(
      x + 30,
      y + 16,
      190,
      48
    );


  relay
    .lineStyle(
      1,
      skin.secondary,
      .22
    )
    .strokeEllipse(
      x + 30,
      y + 16,
      140,
      34
    );


  /* Main pylons */

  relay
    .fillStyle(
      0x090e18,
      .97
    )
    .fillRect(
      x - 12,
      y - 175,
      14,
      190
    );


  relay
    .fillRect(
      x + 92,
      y - 175,
      14,
      190
    );


  /* Pylon edges */

  relay
    .lineStyle(
      2,
      skin.accent,
      .38
    )
    .lineBetween(
      x - 12,
      y - 175,
      x - 12,
      y + 15
    );


  relay
    .lineBetween(
      x + 106,
      y - 175,
      x + 106,
      y + 15
    );


  /* Crown */

  relay
    .lineStyle(
      3,
      skin.secondary,
      .40
    )
    .lineBetween(
      x - 12,
      y - 175,
      x + 106,
      y - 175
    );


  /* Central relay core */

  relay
    .fillStyle(
      skin.accent,
      .12
    )
    .fillCircle(
      x + 47,
      y - 82,
      42
    );


  relay
    .lineStyle(
      3,
      skin.accent,
      .72
    )
    .strokeCircle(
      x + 47,
      y - 82,
      34
    );


  relay
    .lineStyle(
      1,
      skin.secondary,
      .52
    )
    .strokeCircle(
      x + 47,
      y - 82,
      52
    );


  relay
    .fillStyle(
      0xdffcff,
      .92
    )
    .fillCircle(
      x + 47,
      y - 82,
      8
    );


  /* Energy beam */

  relay
    .lineStyle(
      2,
      skin.accent,
      .16
    )
    .lineBetween(
      x + 47,
      y - 52,
      x + 47,
      y - 8
    );


  relay
    .lineStyle(
      1,
      skin.secondary,
      .14
    )
    .lineBetween(
      x + 47,
      y - 8,
      x + 47,
      y + 40
    );


  if (
    !scene.motionReduced
  ) {

    scene.tweens?.add?.({
      targets:
        relay,

      alpha: {
        from: .72,
        to: 1
      },

      duration:
        950,

      yoyo:
        true,

      repeat:
        -1,

      ease:
        'Sine.easeInOut'
    });

  }


  return relay;
}


/* ============================================================
   WORLD BADGE
   ============================================================ */

function createWorldBadge(
  scene,
  skin
) {

  const badge =
    scene.add.text(
      34,
      34,
      `${skin.zone} // FUTURE GRID`,
      {
        fontFamily:
          'Orbitron, monospace',

        fontSize:
          '9px',

        fontStyle:
          'bold',

        color:
          '#8df4ff',

        letterSpacing:
          1.5,

        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#55e9ff',
          blur: 5,
          fill: true
        }
      }
    )
    .setScrollFactor(0)
    .setDepth(10)
    .setAlpha(.78);


  return badge;
}


/* ============================================================
   FUTURISTIC ENVIRONMENT
   ============================================================ */

function createFuturisticEnvironment() {

  const mission =
    this.mission ||
    {};


  const skin =
    getSkin(
      mission
    );


  const width =
    safeNumber(
      this.worldWidth,
      6000
    ) +
    900;


  const height =
    860;


  /* ==========================================================
     SKY BASE
     ========================================================== */

  const sky =
    this.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(-20);


  sky
    .fillStyle(
      skin.sky,
      1
    )
    .fillRect(
      0,
      0,
      width,
      height
    );


  /* ==========================================================
     HORIZON ATMOSPHERE
     ========================================================== */

  const horizon =
    this.add
      .graphics()
      .setScrollFactor(.08)
      .setDepth(-19);


  horizon
    .fillGradientStyle(
      skin.sky,
      skin.horizon,
      skin.sky,
      0x02040a,
      1,
      1,
      1,
      1
    )
    .fillRect(
      0,
      0,
      width,
      height
    );


  /* ==========================================================
     ATMOSPHERE LAYERS
     ========================================================== */

  createStarField(
    this,
    width,
    skin
  );


  createAtmosphericStreaks(
    this,
    width,
    skin
  );


  /* ==========================================================
     DISTANT CITY
     ========================================================== */

  createFarCity(
    this,
    width,
    skin
  );


  /* ==========================================================
     ORBITAL STRUCTURE
     ========================================================== */

  createOrbitalStructure(
    this,
    width,
    skin
  );


  /* ==========================================================
     MEGA CITY
     ========================================================== */

  createMegaTowers(
    this,
    width,
    skin
  );


  /* ==========================================================
     SKY TRANSPORT
     ========================================================== */

  createSkyRails(
    this,
    width,
    skin
  );


  createSkyBridges(
    this,
    width,
    skin
  );


  /* ==========================================================
     HOLOGRAPHIC BACKGROUND
     ========================================================== */

  createHolographicSigns(
    this,
    width,
    skin
  );


  /* ==========================================================
     GROUND
     ========================================================== */

  createGroundGrid(
    this,
    width,
    skin
  );


  /* ==========================================================
     GAMEPLAY PLATFORM ARCHITECTURE
     ========================================================== */

  createPlatformArchitecture(
    this,
    mission,
    skin
  );


  /* ==========================================================
     CHECKPOINTS
     ========================================================== */

  createCheckpointBeacons(
    this,
    mission,
    skin
  );


  /* ==========================================================
     START
     ========================================================== */

  createStartGate(
    this,
    mission,
    skin
  );


  /* ==========================================================
     GOAL
     ========================================================== */

  createGoalRelay(
    this,
    mission,
    skin
  );


  /* ==========================================================
     WORLD BADGE
     ========================================================== */

  this.futuristicWorldBadge =
    createWorldBadge(
      this,
      skin
    );

}


/* ============================================================
   FUTURISTIC WORLD PATCH
   ============================================================ */

export function installFuturisticWorldPatch() {

  if (
    RunnerScene
      .prototype
      .__futuristicNeonWorldPatched
  ) {
    return;
  }


  const originalCreate =
    RunnerScene
      .prototype
      .create;


  const originalUpdate =
    RunnerScene
      .prototype
      .update;


  const originalShutdown =
    RunnerScene
      .prototype
      .shutdown;


  /* ==========================================================
     ENVIRONMENT OVERRIDE
     ========================================================== */

  RunnerScene
    .prototype
    .createEnvironment =
      function futuristicCreateEnvironment() {

        createFuturisticEnvironment
          .call(this);

      };


  /* ==========================================================
     CREATE PATCH
     ========================================================== */

  RunnerScene
    .prototype
    .create =
      function futuristicWorldCreate(
        ...args
      ) {

        /*
         * Generate the route before the
         * original RunnerScene create.
         */

        futuristicRoute(
          this
        );


        const result =
          originalCreate.apply(
            this,
            args
          );


        try {

          this.game.events.emit(
            'world-style',
            'FUTURISTIC_NEON_WORLD'
          );

        } catch {}


        return result;

      };


  /* ==========================================================
     UPDATE PATCH
     ========================================================== */

  RunnerScene
    .prototype
    .update =
      function futuristicWorldUpdate(
        ...args
      ) {

        const result =
          originalUpdate.apply(
            this,
            args
          );


        if (
          this.futuristicWorldBadge
        ) {

          const skin =
            getSkin(
              this.mission
            );


          this.futuristicWorldBadge
            .setText(
              `${skin.zone} // FUTURE GRID`
            );

        }


        return result;

      };


  /* ==========================================================
     SHUTDOWN PATCH
     ========================================================== */

  RunnerScene
    .prototype
    .shutdown =
      function futuristicWorldShutdown(
        ...args
      ) {

        this.futuristicWorldBadge
          ?.destroy?.();


        this.futuristicWorldBadge =
          null;


        return originalShutdown
          ?.apply(
            this,
            args
          );

      };


  /* ==========================================================
     PATCH FLAG
     ========================================================== */

  RunnerScene
    .prototype
    .__futuristicNeonWorldPatched =
    true;

}