import { RunnerScene } from '../scenes/RunnerScene.js';
import {
  installFuturisticWorldPatch
} from './futuristic-neon-world-v1.js';

export const MISSION_OBJECTIVES = Object.freeze({
  'first-delivery': {
    title: 'DELIVER THE SIGNAL PACKAGE',
    label: 'MISSION ROUTE',
    completeAt: .72
  },

  'dead-drop': {
    title: 'SECURE THE DROP',
    label: 'MISSION ROUTE',
    completeAt: .76
  },

  blackout: {
    title: 'RESTORE THE GRID',
    label: 'MISSION ROUTE',
    completeAt: .70
  },

  pursuit: {
    title: 'ESCAPE THE INTERCEPTOR',
    label: 'MISSION ROUTE',
    completeAt: .78
  },

  'signal-storm': {
    title: 'STABILIZE THE ARRAY',
    label: 'MISSION ROUTE',
    completeAt: .74
  },

  'corporate-lockdown': {
    title: 'BREACH THE LOCKDOWN',
    label: 'MISSION ROUTE',
    completeAt: .80
  },

  'final-relay': {
    title: 'REACH THE FINAL RELAY',
    label: 'MISSION ROUTE',
    completeAt: .82
  }
});

const FALLBACK_OBJECTIVE = {
  title: 'COMPLETE THE ACTIVE ROUTE',
  label: 'MISSION ROUTE',
  completeAt: .78,
  id: 'active-mission'
};

const states = new WeakMap();

const missionId = scene =>
  scene?.mission?.id ||
  scene?.sys?.settings?.data?.missionId ||
  scene?.registry?.get?.('missionId') ||
  scene?.registry?.get?.('activeMission')?.id ||
  null;

const clamp = (
  v,
  a = 0,
  b = 1
) =>
  Math.max(
    a,
    Math.min(
      b,
      Number(v) || 0
    )
  );

const worldWidth = scene =>
  scene?.physics?.world?.bounds?.width ||
  scene?.scale?.width ||
  1;

function viewport(scene) {
  const w =
    scene?.scale?.gameSize?.width ||
    scene?.scale?.width ||
    window.innerWidth ||
    1280;

  const h =
    scene?.scale?.gameSize?.height ||
    scene?.scale?.height ||
    window.innerHeight ||
    720;

  const phone =
    window.matchMedia?.(
      '(pointer: coarse) and (max-width: 900px) and (max-height: 600px)'
    ).matches ||
    window.matchMedia?.(
      '(pointer: coarse) and (max-width: 600px) and (max-height: 900px)'
    ).matches;

  return {
    w,
    h,
    mobile: w <= 760,
    phone
  };
}


/* ============================================================
   ROUTE PROGRESS
   Uses the real mission spawn -> goal range.
   ============================================================ */

function getRouteProgress(scene) {
  const startX =
    Number(
      scene?.mission?.spawn?.x
    );

  const goalX =
    Number(
      scene?.mission?.goal?.x
    );

  const playerX =
    Number(
      scene?.player?.x
    );

  if (
    !Number.isFinite(startX) ||
    !Number.isFinite(goalX) ||
    !Number.isFinite(playerX)
  ) {
    return 0;
  }

  const span =
    Math.max(
      1,
      goalX - startX
    );

  return clamp(
    (playerX - startX) / span
  );
}


/* ============================================================
   ROUTE PHASE
   ============================================================ */

function getRoutePhase(progress) {
  if (progress < .25) {
    return 'PHASE 01 // APPROACH';
  }

  if (progress < .50) {
    return 'PHASE 02 // INFILTRATE';
  }

  if (progress < .75) {
    return 'PHASE 03 // INTERCEPT';
  }

  return 'PHASE 04 // FINAL RUN';
}


/* ============================================================
   PREMIUM MISSION ROUTE HUD V3
   ============================================================ */

function buildPanel(scene, objective) {
  const colors = {
    cyan: 0x55e9ff,
    cyanBright: 0xd8fbff,
    violet: 0x8b65ff,
    amber: 0xffca70,
    green: 0x55e5a1,
    white: 0xf3fbff,
    muted: 0x7895a7,
    dark: 0x020812,
    dark2: 0x061321,
    track: 0x0b1b2a,
    grid: 0x123044
  };

  const PANEL_W = 420;
  const PANEL_H = 196;

  const TRACK_X = 34;
  const TRACK_W = 352;
  const TRACK_Y = 111;

  const c =
    scene.add
      .container(
        0,
        0
      )
      .setScrollFactor(0)
      .setDepth(9200)
      .setAlpha(0);

  c.setData?.(
    'mobileLayoutRole',
    'mission-objective'
  );


  /* ==========================================================
     FRAME
     ========================================================== */

  const shadow =
    scene.add
      .rectangle(
        7,
        8,
        PANEL_W,
        PANEL_H,
        0x000000,
        .46
      )
      .setOrigin(0);

  const bg =
    scene.add
      .rectangle(
        0,
        0,
        PANEL_W,
        PANEL_H,
        colors.dark,
        .985
      )
      .setOrigin(0)
      .setStrokeStyle(
        1,
        colors.cyan,
        .82
      );

  const inner =
    scene.add
      .rectangle(
        6,
        6,
        PANEL_W - 12,
        PANEL_H - 12,
        colors.dark2,
        .93
      )
      .setOrigin(0)
      .setStrokeStyle(
        1,
        0xffffff,
        .045
      );


  /* ==========================================================
     MICRO GRID
     ========================================================== */

  const gridLines = [];

  for (
    let x = 18;
    x < PANEL_W - 12;
    x += 28
  ) {
    gridLines.push(
      scene.add
        .rectangle(
          x,
          18,
          1,
          PANEL_H - 36,
          colors.grid,
          .045
        )
        .setOrigin(.5)
    );
  }

  for (
    let y = 22;
    y < PANEL_H - 14;
    y += 22
  ) {
    gridLines.push(
      scene.add
        .rectangle(
          12,
          y,
          PANEL_W - 24,
          1,
          colors.grid,
          .045
        )
        .setOrigin(
          0,
          .5
        )
    );
  }


  /* ==========================================================
     TECH RAILS
     ========================================================== */

  const leftRail =
    scene.add
      .rectangle(
        0,
        10,
        3,
        PANEL_H - 20,
        colors.cyan,
        1
      )
      .setOrigin(0);

  const topRail =
    scene.add
      .rectangle(
        24,
        10,
        372,
        1,
        colors.cyan,
        .42
      )
      .setOrigin(0);

  const topHot =
    scene.add
      .rectangle(
        24,
        12,
        118,
        1,
        colors.violet,
        .92
      )
      .setOrigin(0);

  const bottomRail =
    scene.add
      .rectangle(
        24,
        PANEL_H - 10,
        372,
        1,
        colors.cyan,
        .18
      )
      .setOrigin(0);


  /* ==========================================================
     CORNER BRACKETS
     ========================================================== */

  const corners = [
    scene.add
      .rectangle(
        10,
        10,
        18,
        1,
        colors.cyan,
        .65
      )
      .setOrigin(0),

    scene.add
      .rectangle(
        10,
        10,
        1,
        18,
        colors.cyan,
        .65
      )
      .setOrigin(0),

    scene.add
      .rectangle(
        PANEL_W - 28,
        10,
        18,
        1,
        colors.cyan,
        .35
      )
      .setOrigin(0),

    scene.add
      .rectangle(
        PANEL_W - 11,
        10,
        1,
        18,
        colors.cyan,
        .35
      )
      .setOrigin(0),

    scene.add
      .rectangle(
        10,
        PANEL_H - 11,
        18,
        1,
        colors.cyan,
        .30
      )
      .setOrigin(0),

    scene.add
      .rectangle(
        10,
        PANEL_H - 28,
        1,
        18,
        colors.cyan,
        .30
      )
      .setOrigin(0),

    scene.add
      .rectangle(
        PANEL_W - 28,
        PANEL_H - 11,
        18,
        1,
        colors.cyan,
        .30
      )
      .setOrigin(0),

    scene.add
      .rectangle(
        PANEL_W - 11,
        PANEL_H - 28,
        1,
        18,
        colors.cyan,
        .30
      )
      .setOrigin(0)
  ];


  /* ==========================================================
     HEADER
     ========================================================== */

  const statusRing =
    scene.add
      .circle(
        28,
        28,
        7,
        colors.cyan,
        0
      )
      .setStrokeStyle(
        1,
        colors.cyan,
        .45
      );

  const statusDot =
    scene.add.circle(
      28,
      28,
      3.5,
      colors.cyanBright,
      1
    );

  const header =
    scene.add.text(
      42,
      18,
      'MISSION ROUTE // ACTIVE',
      {
        fontFamily:
          'Orbitron, monospace',

        fontSize:
          '9px',

        fontStyle:
          'bold',

        color:
          '#66eaff',

        letterSpacing:
          1.45,

        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#55e9ff',
          blur: 7,
          fill: true
        }
      }
    );

  const statusText =
    scene.add
      .text(
        396,
        18,
        '● LIVE',
        {
          fontFamily:
            'Orbitron, monospace',

          fontSize:
            '7px',

          fontStyle:
            'bold',

          color:
            '#b9f8ff',

          letterSpacing:
            1.25
        }
      )
      .setOrigin(
        1,
        0
      );


  /* ==========================================================
     OBJECTIVE TITLE
     ========================================================== */

  const title =
    scene.add.text(
      24,
      41,
      objective.title,
      {
        fontFamily:
          'Orbitron, monospace',

        fontSize:
          '13px',

        fontStyle:
          'bold',

        color:
          '#f3fbff',

        letterSpacing:
          .42,

        lineSpacing:
          2,

        wordWrap: {
          width: 372
        },

        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: '#000000',
          blur: 7,
          fill: true
        }
      }
    );

  title.setMaxLines?.(2);


  /* ==========================================================
     PROGRESS HEADER
     ========================================================== */

  const progressLabel =
    scene.add.text(
      24,
      73,
      'ROUTE PROGRESS',
      {
        fontFamily:
          'Orbitron, monospace',

        fontSize:
          '7px',

        fontStyle:
          'bold',

        color:
          '#7895a7',

        letterSpacing:
          1.35
      }
    );

  const phaseText =
    scene.add.text(
      142,
      73,
      'PHASE 01 // APPROACH',
      {
        fontFamily:
          'monospace',

        fontSize:
          '6px',

        fontStyle:
          'bold',

        color:
          '#476d7c',

        letterSpacing:
          1
      }
    );

  const percent =
    scene.add
      .text(
        396,
        69,
        '0%',
        {
          fontFamily:
            'Orbitron, monospace',

          fontSize:
            '11px',

          fontStyle:
            'bold',

          color:
            '#dffcff',

          letterSpacing:
            .8,

          shadow: {
            offsetX: 0,
            offsetY: 0,
            color: '#55e9ff',
            blur: 5,
            fill: true
          }
        }
      )
      .setOrigin(
        1,
        0
      );


  /* ==========================================================
     ROUTE TRACK
     ========================================================== */

  const mapBg =
    scene.add
      .rectangle(
        24,
        TRACK_Y,
        372,
        48,
        colors.track,
        .97
      )
      .setOrigin(
        0,
        .5
      )
      .setStrokeStyle(
        1,
        colors.cyan,
        .18
      );

  const trackTop =
    scene.add
      .rectangle(
        TRACK_X,
        TRACK_Y - 9,
        TRACK_W,
        1,
        colors.cyan,
        .075
      )
      .setOrigin(
        0,
        .5
      );

  const trackBottom =
    scene.add
      .rectangle(
        TRACK_X,
        TRACK_Y + 9,
        TRACK_W,
        1,
        colors.cyan,
        .075
      )
      .setOrigin(
        0,
        .5
      );

  const mapLine =
    scene.add
      .rectangle(
        TRACK_X,
        TRACK_Y,
        TRACK_W,
        2,
        colors.cyan,
        .20
      )
      .setOrigin(
        0,
        .5
      );

  const mapGlow =
    scene.add
      .rectangle(
        TRACK_X,
        TRACK_Y,
        0,
        5,
        colors.cyan,
        .42
      )
      .setOrigin(
        0,
        .5
      );

  const mapHot =
    scene.add
      .rectangle(
        TRACK_X,
        TRACK_Y - .8,
        0,
        1.3,
        colors.cyanBright,
        .95
      )
      .setOrigin(
        0,
        .5
      );


  /* ==========================================================
     START MARKER
     ========================================================== */

  const startMarker =
    scene.add
      .circle(
        TRACK_X,
        TRACK_Y,
        4,
        colors.green,
        1
      )
      .setStrokeStyle(
        1,
        colors.green,
        .55
      );


  /* ==========================================================
     PLAYER MARKER
     ========================================================== */

  const playerHalo =
    scene.add
      .circle(
        TRACK_X,
        TRACK_Y,
        9,
        colors.cyan,
        0
      )
      .setStrokeStyle(
        1,
        colors.cyan,
        .20
      );

  const playerMarker =
    scene.add
      .circle(
        TRACK_X,
        TRACK_Y,
        4.5,
        colors.cyanBright,
        1
      )
      .setStrokeStyle(
        1,
        colors.cyan,
        .70
      );


  /* ==========================================================
     GOAL MARKER
     ========================================================== */

  const goalHalo =
    scene.add
      .circle(
        TRACK_X + TRACK_W,
        TRACK_Y,
        9,
        colors.amber,
        0
      )
      .setStrokeStyle(
        1,
        colors.amber,
        .24
      );

  const goalMarker =
    scene.add.circle(
      TRACK_X + TRACK_W,
      TRACK_Y,
      5.5,
      colors.amber,
      1
    );


  /* ==========================================================
     CHECKPOINT MARKERS
     ========================================================== */

  const checkpointMarkers = [];

  const routeData =
    Array.isArray(
      scene.mission?.checkpoints
    )
      ? scene.mission.checkpoints
      : [];

  const routeStart =
    Number(
      scene.mission?.spawn?.x
    );

  const routeGoal =
    Number(
      scene.mission?.goal?.x
    );

  const routeSpan =
    Math.max(
      1,
      routeGoal - routeStart
    );

  for (
    let i = 0;
    i < routeData.length && i < 7;
    i++
  ) {
    const cp =
      routeData[i];

    const cpX =
      Number(
        cp?.x
      );

    const normalized =
      Number.isFinite(
        cpX
      )
        ? clamp(
            (cpX - routeStart) /
            routeSpan
          )
        : 0;

    const x =
      TRACK_X +
      normalized *
      TRACK_W;

    const outer =
      scene.add
        .circle(
          x,
          TRACK_Y,
          5.5,
          colors.violet,
          0
        )
        .setStrokeStyle(
          1,
          colors.violet,
          .82
        );

    const innerDot =
      scene.add
        .circle(
          x,
          TRACK_Y,
          2.2,
          colors.violet,
          .95
        );

    const label =
      scene.add
        .text(
          x,
          98,
          `CP-${String(
            i + 1
          ).padStart(
            2,
            '0'
          )}`,
          {
            fontFamily:
              'monospace',

            fontSize:
              '5px',

            fontStyle:
              'bold',

            color:
              '#667e8c',

            letterSpacing:
              .5
          }
        )
        .setOrigin(
          .5,
          1
        );

    checkpointMarkers.push({
      outer,
      innerDot,
      label,
      x,
      worldX: cpX,
      index: i
    });
  }


  /* ==========================================================
     ROUTE LABELS
     ========================================================== */

  const startLabel =
    scene.add.text(
      TRACK_X,
      126,
      'START',
      {
        fontFamily:
          'Orbitron, monospace',

        fontSize:
          '6px',

        fontStyle:
          'bold',

        color:
          '#55e5a1',

        letterSpacing:
          .8
      }
    );

  const zoneText =
    scene.add
      .text(
        210,
        126,
        'NEON DISTRICT',
        {
          fontFamily:
            'monospace',

          fontSize:
            '6px',

          fontStyle:
            'bold',

          color:
            '#7895a7',

          letterSpacing:
            .65
        }
      )
      .setOrigin(
        .5,
        0
      );

  const goalLabel =
    scene.add
      .text(
        TRACK_X + TRACK_W,
        126,
        'GOAL',
        {
          fontFamily:
            'Orbitron, monospace',

          fontSize:
            '6px',

          fontStyle:
            'bold',

          color:
            '#ffca70',

          letterSpacing:
            .8
        }
      )
      .setOrigin(
        1,
        0
      );


  /* ==========================================================
     FOOTER
     ========================================================== */

  const footerLine =
    scene.add
      .rectangle(
        24,
        145,
        372,
        1,
        0xffffff,
        .075
      )
      .setOrigin(0);

  const footer =
    scene.add.text(
      24,
      154,
      '● FOLLOW THE NEON TRACE',
      {
        fontFamily:
          'Orbitron, monospace',

        fontSize:
          '6px',

        fontStyle:
          'bold',

        color:
          '#628292',

        letterSpacing:
          .85
      }
    );

  const channelText =
    scene.add
      .text(
        396,
        154,
        'ROUTE CHANNEL // ONLINE',
        {
          fontFamily:
            'monospace',

          fontSize:
            '5px',

          fontStyle:
            'bold',

          color:
            '#3e6675',

          letterSpacing:
            .55
        }
      )
      .setOrigin(
        1,
        0
      );

  const telemetry =
    scene.add
      .text(
        24,
        174,
        'R-01',
        {
          fontFamily:
            'Orbitron, monospace',

          fontSize:
            '6px',

          fontStyle:
            'bold',

          color:
            '#5cd9ef',

          letterSpacing:
            1
        }
      );

  const hint =
    scene.add
      .text(
        396,
        174,
        'NAVIGATION LOCKED',
        {
          fontFamily:
            'monospace',

          fontSize:
            '6px',

          fontStyle:
            'bold',

          color:
            '#385868',

          letterSpacing:
            .8
        }
      )
      .setOrigin(
        1,
        0
      );


  /* ==========================================================
     PANEL CHILDREN
     ========================================================== */

  c.add([
    shadow,
    bg,
    inner,

    ...gridLines,

    leftRail,
    topRail,
    topHot,
    bottomRail,

    ...corners,

    statusRing,
    statusDot,

    header,
    statusText,

    title,

    progressLabel,
    phaseText,
    percent,

    mapBg,
    trackTop,
    trackBottom,
    mapLine,
    mapGlow,
    mapHot,

    startMarker,

    playerHalo,
    playerMarker,

    goalHalo,
    goalMarker,

    ...checkpointMarkers.flatMap(
      item => [
        item.outer,
        item.innerDot,
        item.label
      ]
    ),

    startLabel,
    zoneText,
    goalLabel,

    footerLine,
    footer,
    channelText,
    telemetry,
    hint
  ]);


  /* ==========================================================
     ANIMATION
     ========================================================== */

  scene.tweens?.add?.({
    targets:
      statusDot,

    alpha: {
      from: .35,
      to: 1
    },

    scale: {
      from: .9,
      to: 1.1
    },

    duration:
      720,

    yoyo:
      true,

    repeat:
      -1,

    ease:
      'Sine.easeInOut'
  });

  scene.tweens?.add?.({
    targets:
      statusRing,

    alpha: {
      from: .08,
      to: .45
    },

    scale: {
      from: .9,
      to: 1.16
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

  scene.tweens?.add?.({
    targets:
      playerHalo,

    alpha: {
      from: .08,
      to: .32
    },

    scale: {
      from: .85,
      to: 1.2
    },

    duration:
      850,

    yoyo:
      true,

    repeat:
      -1,

    ease:
      'Sine.easeInOut'
  });

  scene.tweens?.add?.({
    targets:
      goalHalo,

    alpha: {
      from: .08,
      to: .32
    },

    scale: {
      from: .85,
      to: 1.2
    },

    duration:
      1000,

    yoyo:
      true,

    repeat:
      -1,

    ease:
      'Sine.easeInOut'
  });

  scene.tweens?.add?.({
    targets:
      topHot,

    alpha: {
      from: .20,
      to: 1
    },

    duration:
      1600,

    yoyo:
      true,

    repeat:
      -1,

    ease:
      'Sine.easeInOut'
  });


  return {
    c,

    bg,

    leftRail,
    topRail,
    topHot,

    statusDot,
    statusRing,

    header,
    statusText,

    title,
    phaseText,

    progressLabel,

    mapGlow,
    mapHot,

    playerHalo,
    playerMarker,

    goalHalo,
    goalMarker,

    startMarker,

    checkpointMarkers,

    percent,

    startLabel,
    goalLabel,
    zoneText,

    footer,
    channelText,
    telemetry,
    hint,

    scale: 1,
    x: 0,
    y: 0,

    objective,

    completed: false,

    lastProgress: -1,
    lastCheckpointState: ''
  };
}


/* ============================================================
   CHECKPOINT VISUAL STATE
   ============================================================ */

function updateCheckpointState(
  state,
  scene,
  progress
) {
  if (
    !Array.isArray(
      state.checkpointMarkers
    ) ||
    !state.checkpointMarkers.length
  ) {
    return;
  }

  const checkpointState = [];

  let activeIndex = -1;

  for (
    let i = 0;
    i < state.checkpointMarkers.length;
    i++
  ) {
    const marker =
      state.checkpointMarkers[i];

    if (
      !Number.isFinite(
        marker.worldX
      )
    ) {
      checkpointState.push(
        'unknown'
      );

      continue;
    }

    const startX =
      Number(
        scene.mission?.spawn?.x
      ) || 0;

    const goalX =
      Number(
        scene.mission?.goal?.x
      ) ||
      worldWidth(scene);

    const span =
      Math.max(
        1,
        goalX - startX
      );

    const cpProgress =
      clamp(
        (
          marker.worldX -
          startX
        ) / span
      );

    if (
      progress >=
      cpProgress
    ) {
      checkpointState.push(
        'passed'
      );

      marker.outer
        .setFillStyle?.(
          0x55e5a1,
          .20
        );

      marker.outer
        .setStrokeStyle?.(
          1,
          0x55e5a1,
          .88
        );

      marker.innerDot
        .setFillStyle?.(
          0x55e5a1,
          1
        );

      marker.label.setColor?.(
        '#55e5a1'
      );

      marker.label.setText?.(
        `CP-${String(
          i + 1
        ).padStart(
          2,
          '0'
        )} // PASSED`
      );

      continue;
    }

    if (
      activeIndex === -1
    ) {
      activeIndex = i;

      checkpointState.push(
        'active'
      );

      marker.outer
        .setFillStyle?.(
          0x55e9ff,
          .16
        );

      marker.outer
        .setStrokeStyle?.(
          1,
          0x55e9ff,
          1
        );

      marker.innerDot
        .setFillStyle?.(
          0xd8fbff,
          1
        );

      marker.label.setColor?.(
        '#66eaff'
      );

      marker.label.setText?.(
        `CP-${String(
          i + 1
        ).padStart(
          2,
          '0'
        )} // ACTIVE`
      );

      continue;
    }

    checkpointState.push(
      'upcoming'
    );

    marker.outer
      .setFillStyle?.(
        0x8b65ff,
        .03
      );

    marker.outer
      .setStrokeStyle?.(
        1,
        0x8b65ff,
        .70
      );

    marker.innerDot
      .setFillStyle?.(
        0x8b65ff,
        .90
      );

    marker.label.setColor?.(
      '#66768d'
    );

    marker.label.setText?.(
      `CP-${String(
        i + 1
      ).padStart(
        2,
        '0'
      )} // UPCOMING`
    );
  }

  const stateKey =
    checkpointState.join('|');

  if (
    state.lastCheckpointState ===
    stateKey
  ) {
    return;
  }

  state.lastCheckpointState =
    stateKey;

  /*
   * Only animate the active checkpoint.
   * Avoid creating a new infinite tween
   * every frame.
   */

  state.checkpointMarkers.forEach(
    (
      marker,
      index
    ) => {
      scene.tweens?.killTweensOf?.(
        marker.outer
      );

      if (
        checkpointState[index] ===
        'active'
      ) {
        scene.tweens?.add?.({
          targets:
            marker.outer,

          scale: {
            from: .90,
            to: 1.28
          },

          alpha: {
            from: .45,
            to: 1
          },

          duration:
            700,

          yoyo:
            true,

          repeat:
            -1,

          ease:
            'Sine.easeInOut'
        });
      } else {
        marker.outer.setScale(
          1
        );
      }
    }
  );
}


/* ============================================================
   RESPONSIVE LAYOUT
   ============================================================ */

function layout(
  state,
  scene,
  force = false
) {
  const {
    w,
    h,
    mobile
  } =
    viewport(scene);

  const panelW =
    mobile
      ? Math.min(
          390,
          Math.max(
            260,
            w - 16
          )
        )
      : Math.min(
          420,
          Math.max(
            360,
            w - 48
          )
        );

  const scale =
    panelW / 420;

  const actualH =
    196 * scale;

  const x =
    mobile
      ? Math.max(
          8,
          (w - panelW) *
            .5
        )
      : Math.max(
          24,
          w -
            panelW -
            28
        );

  const y =
    mobile
      ? Math.max(
          64,
          h -
            actualH -
            86
        )
      : Math.max(
          86,
          h -
            actualH -
            28
        );

  if (
    !force &&
    state.x === x &&
    state.y === y &&
    state.scale === scale
  ) {
    return;
  }

  state.x =
    x;

  state.y =
    y;

  state.scale =
    scale;

  state.c
    .setPosition(
      x,
      y
    )
    .setScale(
      scale
    );
}


/* ============================================================
   CLEAR
   ============================================================ */

export function clearMissionObjective(
  scene
) {
  const s =
    states.get(scene) ||
    scene?.__missionObjectiveState;

  s?.c?.destroy?.();

  s?.hudSkins?.forEach(
    item =>
      item?.destroy?.()
  );

  states.delete(
    scene
  );

  if (scene) {
    scene.__missionObjectiveState =
      null;

    scene.__missionObjective =
      null;
  }
}


/* ============================================================
   APPLY
   ============================================================ */

export function applyMissionObjective(
  scene,
  id = missionId(scene)
) {
  clearMissionObjective(
    scene
  );

  if (
    !scene?.add
  ) {
    return null;
  }

  const objective = {
    ...(MISSION_OBJECTIVES[id] ||
      FALLBACK_OBJECTIVE),

    id:
      id ||
      FALLBACK_OBJECTIVE.id
  };

  const ui =
    buildPanel(
      scene,
      objective
    );

  const state = {
    ...ui,

    hudSkinned:
      true,

    hudSkins:
      [],

    pendingReveal:
      false
  };

  states.set(
    scene,
    state
  );

  scene.__missionObjectiveState =
    state;

  scene.__missionObjective =
    objective;

  layout(
    state,
    scene,
    true
  );

  state.c.setVisible(
    true
  );

  scene.tweens?.add?.({
    targets:
      state.c,

    alpha: {
      from: 0,
      to: 1
    },

    y: {
      from:
        state.y + 12,

      to:
        state.y
    },

    duration:
      240,

    ease:
      'Quad.easeOut'
  });

  return objective;
}


/* ============================================================
   UPDATE
   ============================================================ */

export function updateMissionObjective(
  scene
) {
  const s =
    states.get(scene);

  if (
    !s ||
    !scene?.player
  ) {
    return;
  }

  if (
    window.__relayCinematicLock
  ) {
    s.c.setVisible(
      false
    );

    return;
  }

  s.c.setVisible(
    true
  );

  layout(
    s,
    scene
  );

  /*
   * IMPORTANT:
   * Progress is now calculated from
   * actual mission spawn -> actual goal.
   */

  const p =
    getRouteProgress(
      scene
    );

  /*
   * Keep route marker visually aligned
   * with the real route.
   */

  const width =
    352 * p;

  s.mapGlow.width =
    width;

  s.mapHot.width =
    width;

  s.playerMarker.x =
    34 + width;


  /* ==========================================================
     PROGRESS TEXT
     ========================================================== */

  s.percent.setText(
    `${Math.round(
      p * 100
    )}%`
  );

  s.phaseText?.setText(
    getRoutePhase(
      p
    )
  );


  /* ==========================================================
     MISSION ZONE
     ========================================================== */

  const missionZone =
    scene.mission?.zone ||
    scene.mission?.district ||
    '';

  if (
    missionZone
  ) {
    s.zoneText.setText(
      String(
        missionZone
      ).toUpperCase()
    );
  }


  /* ==========================================================
     CHECKPOINTS
     ========================================================== */

  updateCheckpointState(
    s,
    scene,
    p
  );


  /* ==========================================================
     TELEMETRY
     ========================================================== */

  s.telemetry.setText(
    `R-${String(
      Math.round(
        p * 99
      )
    ).padStart(
      2,
      '0'
    )}`
  );


  /*
   * Avoid unnecessary work
   * when player progress barely changed.
   */

  if (
    Math.abs(
      p -
      s.lastProgress
    ) < .002
  ) {
    return;
  }

  s.lastProgress =
    p;


  /* ==========================================================
     COMPLETION
     ========================================================== */

  if (
    !s.completed &&
    p >=
      s.objective.completeAt
  ) {
    s.completed =
      true;

    s.mapGlow.width =
      352;

    s.mapHot.width =
      352;

    s.playerMarker.x =
      386;

    s.percent.setText(
      '100%'
    );

    s.phaseText.setText(
      'ROUTE // COMPLETE'
    );

    s.statusText.setText(
      '● SECURED'
    );

    s.header.setText(
      'MISSION ROUTE // SECURED'
    );

    s.footer.setText(
      '● ROUTE GOAL SECURED'
    );

    s.channelText.setText(
      'RELAY CHANNEL // ONLINE'
    );

    s.footer.setColor?.(
      '#69efb0'
    );

    s.statusText.setColor?.(
      '#69efb0'
    );

    s.header.setColor?.(
      '#69efb0'
    );

    s.phaseText.setColor?.(
      '#69efb0'
    );

    s.channelText.setColor?.(
      '#55e5a1'
    );

    s.leftRail.setFillStyle?.(
      0x55e5a1,
      1
    );

    s.bg.setStrokeStyle?.(
      1,
      0x55e5a1,
      .72
    );

    s.mapGlow.setFillStyle?.(
      0x55e5a1,
      .52
    );

    s.mapHot.setFillStyle?.(
      0xc4ffe1,
      .95
    );

    s.playerHalo.setStrokeStyle?.(
      1,
      0x55e5a1,
      .60
    );

    s.playerMarker.setFillStyle?.(
      0xc4ffe1,
      1
    );

    /*
     * Completion pulse.
     */

    scene.tweens?.add?.({
      targets:
        s.c,

      scaleX:
        s.scale *
        1.025,

      scaleY:
        s.scale *
        1.025,

      yoyo:
        true,

      repeat:
        1,

      duration:
        130,

      ease:
        'Quad.easeOut'
    });

    scene.tweens?.add?.({
      targets:
        s.playerHalo,

      scale: {
        from: 1,
        to: 1.7
      },

      alpha: {
        from: .65,
        to: 0
      },

      duration:
        360,

      ease:
        'Quad.easeOut'
    });

    scene.events?.emit?.(
      'mission-objective-complete',
      {
        id:
          missionId(scene),

        objective:
          s.objective
      }
    );
  }
}

/* ============================================================
   MISSION OBJECTIVES PATCH
   ============================================================ */

if (
  !RunnerScene
    .prototype
    .__missionObjectivesV1Patched
) {
  installFuturisticWorldPatch();

  const baseCreate =
    RunnerScene
      .prototype
      .create;

  const baseUpdate =
    RunnerScene
      .prototype
      .update;

  const baseShutdown =
    RunnerScene
      .prototype
      .shutdown;


  RunnerScene
    .prototype
    .create =
      function missionObjectivesCreate(
        ...args
      ) {
        const result =
          baseCreate.apply(
            this,
            args
          );

        try {
          applyMissionObjective(
            this
          );
        } catch (
          error
        ) {
          console.error(
            '[MissionObjectivesV1] create failed',
            error
          );
        }

        return result;
      };


  RunnerScene
    .prototype
    .update =
      function missionObjectivesUpdate(
        ...args
      ) {
        const result =
          baseUpdate.apply(
            this,
            args
          );

        try {
          updateMissionObjective(
            this
          );
        } catch (
          error
        ) {
          console.error(
            '[MissionObjectivesV1] update failed',
            error
          );
        }

        return result;
      };


  RunnerScene
    .prototype
    .shutdown =
      function missionObjectivesShutdown(
        ...args
      ) {
        try {
          clearMissionObjective(
            this
          );
        } catch (
          error
        ) {
          console.error(
            '[MissionObjectivesV1] shutdown failed',
            error
          );
        }

        return baseShutdown
          ?.apply(
            this,
            args
          );
      };


  RunnerScene
    .prototype
    .__missionObjectivesV1Patched =
      true;
}

