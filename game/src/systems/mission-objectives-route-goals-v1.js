import { RunnerScene } from '../scenes/RunnerScene.js';

export const MISSION_OBJECTIVES = Object.freeze({
  'first-delivery': {
    title: 'DELIVER THE SIGNAL PACKAGE',
    label: 'DELIVERY ROUTE',
    completeAt: .72
  },

  'dead-drop': {
    title: 'SECURE THE DROP',
    label: 'DROP ROUTE',
    completeAt: .76
  },

  blackout: {
    title: 'RESTORE THE GRID',
    label: 'GRID ROUTE',
    completeAt: .70
  },

  pursuit: {
    title: 'ESCAPE THE INTERCEPTOR',
    label: 'ESCAPE ROUTE',
    completeAt: .78
  },

  'signal-storm': {
    title: 'STABILIZE THE ARRAY',
    label: 'STORM ROUTE',
    completeAt: .74
  },

  'corporate-lockdown': {
    title: 'BREACH THE LOCKDOWN',
    label: 'BREACH ROUTE',
    completeAt: .80
  },

  'final-relay': {
    title: 'REACH THE FINAL RELAY',
    label: 'FINAL ROUTE',
    completeAt: .82
  }
});


/* =========================================================
   STATE
   ========================================================= */

const states = new WeakMap();


/* =========================================================
   TUTORIAL DETECTION
   ========================================================= */

const TUTORIAL_TEXT =
  /TUTORIAL|RUNNER LESSON|PRACTICE IT NOW|BOOST PAD|DOUBLE JUMP|HOLD S|BLACKOUT|WALL ROUTES|CHASE|AIR DASH|STORM|COMBINE|LOCKDOWN|ELITE|FINAL RUN|CITYSPINE|CHECKPOINT/i;


const FALLBACK_OBJECTIVE = {
  title: 'COMPLETE THE ACTIVE ROUTE',
  label: 'MISSION ROUTE',
  completeAt: .78
};


/* =========================================================
   HELPERS
   ========================================================= */

function missionId(scene) {
  return (
    scene?.mission?.id ||
    scene?.sys?.settings?.data?.missionId ||
    scene?.registry?.get?.('missionId') ||
    scene?.registry?.get?.('activeMission')?.id ||
    null
  );
}


function worldWidth(scene) {
  return (
    scene?.physics?.world?.bounds?.width ||
    scene?.scale?.width ||
    1
  );
}


function clamp(v, min = 0, max = 1) {
  return Math.max(
    min,
    Math.min(
      max,
      v || 0
    )
  );
}


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

  return {
    w,
    h,
    mobile: w <= 760
  };
}


/* =========================================================
   TUTORIAL BOUNDS
   ========================================================= */

function tutorialBounds(scene) {
  const list =
    scene?.children?.list || [];

  const matches =
    list.filter(
      child =>
        child?.active &&
        child.visible !== false &&
        child.type === 'Text' &&
        TUTORIAL_TEXT.test(
          String(child.text || '')
        )
    );


  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;


  matches.forEach(child => {
    const bounds =
      child.getBounds?.();

    if (!bounds) return;


    minX =
      Math.min(
        minX,
        bounds.x
      );

    minY =
      Math.min(
        minY,
        bounds.y
      );

    maxX =
      Math.max(
        maxX,
        bounds.right
      );

    maxY =
      Math.max(
        maxY,
        bounds.bottom
      );
  });


  const explicit =
    scene?.firstTimeTutorial === true ||
    (scene?.routeTutorials?.size || 0) > 0 ||
    !!scene?.intelCard?.visible;


  if (
    !matches.length &&
    !explicit
  ) {
    return null;
  }


  if (!Number.isFinite(minY)) {
    return {
      x: 40,
      y: 340,
      right: 500,
      bottom: 540
    };
  }


  return {
    x: Math.max(
      0,
      minX - 24
    ),

    y: Math.max(
      0,
      minY - 24
    ),

    right: maxX + 24,

    bottom: maxY + 86
  };
}


/* =========================================================
   BUILD MISSION PANEL
   ========================================================= */

function buildPanel(scene, objective) {

  const c =
    scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(9200)
      .setAlpha(0);


  c.setData?.(
    'mobileLayoutRole',
    'mission-objective'
  );


  /* =======================================================
     PALETTE
     ======================================================= */

  const ORANGE = 0xff9f1c;
  const ORANGE_BRIGHT = 0xffc247;
  const ORANGE_PALE = 0xffd98a;

  const CYAN = 0x52d9ff;
  const CYAN_SOFT = 0x8ae9ff;

  const WHITE = 0xf4f7fa;
  const MUTED = 0x8fa4b5;

  const BG = 0x05080c;
  const BG_2 = 0x091018;
  const TRACK = 0x101820;


  /* =======================================================
     DIM OUTER PLATE
     ======================================================= */

  const shadowPlate =
    scene.add
      .rectangle(
        4,
        5,
        400,
        150,
        0x000000,
        0.24
      )
      .setOrigin(0);


  /* =======================================================
     MAIN PLATE
     ======================================================= */

  const bg =
    scene.add
      .rectangle(
        0,
        0,
        400,
        150,
        BG,
        0.975
      )
      .setOrigin(0)
      .setStrokeStyle(
        1,
        ORANGE,
        0.82
      );


  /* =======================================================
     INNER PLATE
     ======================================================= */

  const inner =
    scene.add
      .rectangle(
        7,
        7,
        386,
        136,
        BG_2,
        0.76
      )
      .setOrigin(0)
      .setStrokeStyle(
        1,
        0xffffff,
        0.055
      );


  /* =======================================================
     ORANGE SIDE ACCENT
     ======================================================= */

  const accent =
    scene.add
      .rectangle(
        0,
        0,
        4,
        150,
        ORANGE,
        1
      )
      .setOrigin(0);


  /* =======================================================
     TOP TACTICAL RAIL
     ======================================================= */

  const topRail =
    scene.add
      .rectangle(
        24,
        10,
        350,
        1,
        ORANGE,
        0.24
      )
      .setOrigin(0);


  const cyanRail =
    scene.add
      .rectangle(
        24,
        12,
        92,
        1,
        CYAN,
        0.82
      )
      .setOrigin(0);


  /* =======================================================
     HEADER STATUS DOT
     ======================================================= */

  const statusDot =
    scene.add
      .circle(
        28,
        28,
        4,
        ORANGE_BRIGHT,
        1
      );


  const statusRing =
    scene.add
      .circle(
        28,
        28,
        7,
        ORANGE,
        0
      )
      .setStrokeStyle(
        1,
        ORANGE,
        0.24
      );


  /* =======================================================
     HEADER
     ======================================================= */

  const kicker =
    scene.add.text(
      40,
      18,
      'MISSION OBJECTIVE',
      {
        fontFamily: 'monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#ffb52e',
        letterSpacing: 1.8
      }
    );


  const live =
    scene.add.text(
      374,
      18,
      'ACTIVE',
      {
        fontFamily: 'monospace',
        fontSize: '7px',
        fontStyle: 'bold',
        color: '#6de7ff',
        letterSpacing: 1.4
      }
    ).setOrigin(1, 0);


  /* =======================================================
     MAIN OBJECTIVE TITLE
     ======================================================= */

  const title =
    scene.add.text(
      24,
      44,
      objective.title,
      {
        fontFamily: 'monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
        lineSpacing: 2,
        wordWrap: {
          width: 350
        }
      }
    );


  /* =======================================================
     ROUTE LABEL
     ======================================================= */

  const label =
    scene.add.text(
      24,
      79,
      `// ${objective.label}`,
      {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#8fa4b5',
        letterSpacing: 1.2
      }
    );


  /* =======================================================
     PROGRESS HEADER
     ======================================================= */

  const progress =
    scene.add.text(
      24,
      98,
      'ROUTE PROGRESS',
      {
        fontFamily: 'monospace',
        fontSize: '8px',
        fontStyle: 'bold',
        color: '#9dafbc',
        letterSpacing: 1.3
      }
    );


  const percent =
    scene.add.text(
      374,
      96,
      '0%',
      {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffd47a',
        letterSpacing: 0.8
      }
    ).setOrigin(1, 0);


  /* =======================================================
     PROGRESS TRACK
     ======================================================= */

  const track =
    scene.add
      .rectangle(
        24,
        118,
        350,
        8,
        TRACK,
        1
      )
      .setOrigin(0, 0.5)
      .setStrokeStyle(
        1,
        ORANGE,
        0.20
      );


  /* subtle upper reflection */

  const trackHighlight =
    scene.add
      .rectangle(
        26,
        116.5,
        346,
        1.5,
        0xffffff,
        0.05
      )
      .setOrigin(0, 0.5);


  /* actual progress */

  const fill =
    scene.add
      .rectangle(
        24,
        118,
        0,
        8,
        ORANGE,
        1
      )
      .setOrigin(0, 0.5);


  /* brighter progress cap */

  const fillHighlight =
    scene.add
      .rectangle(
        24,
        116.5,
        0,
        2,
        ORANGE_BRIGHT,
        0.88
      )
      .setOrigin(0, 0.5);


  /* moving shine at end of progress */

  const fillCap =
    scene.add
      .rectangle(
        24,
        118,
        2,
        10,
        ORANGE_BRIGHT,
        0.9
      )
      .setOrigin(0.5, 0.5);


  /* =======================================================
     PROGRESS SEGMENT DIVIDERS
     ======================================================= */

  const segments = [];

  for (let i = 1; i < 10; i++) {

    const x =
      24 + (350 / 10) * i;

    const divider =
      scene.add
        .rectangle(
          x,
          118,
          1,
          8,
          0x05080c,
          0.62
        )
        .setOrigin(0.5);

    segments.push(divider);
  }


  /* =======================================================
     FOOTER
     ======================================================= */

  const footerLine =
    scene.add
      .rectangle(
        24,
        132,
        350,
        1,
        0xffffff,
        0.06
      )
      .setOrigin(0);


  const status =
    scene.add.text(
      24,
      136,
      '●  OBJECTIVE IN PROGRESS',
      {
        fontFamily: 'monospace',
        fontSize: '7px',
        fontStyle: 'bold',
        color: '#927642',
        letterSpacing: 1.1
      }
    );


  /* =======================================================
     TACTICAL CORNER DETAILS
     ======================================================= */

  const cornerTL =
    scene.add
      .rectangle(
        0,
        0,
        24,
        1,
        CYAN,
        0.55
      )
      .setOrigin(0);


  const cornerTR =
    scene.add
      .rectangle(
        376,
        0,
        24,
        1,
        ORANGE,
        0.78
      )
      .setOrigin(0);


  const cornerBR =
    scene.add
      .rectangle(
        376,
        149,
        24,
        1,
        CYAN,
        0.42
      )
      .setOrigin(0);


  const cornerRight =
    scene.add
      .rectangle(
        399,
        14,
        1,
        24,
        CYAN,
        0.28
      )
      .setOrigin(0);


  /* =======================================================
     MICRO DECORATION
     ======================================================= */

  const micro1 =
    scene.add
      .rectangle(
        340,
        137,
        5,
        1,
        CYAN,
        0.38
      )
      .setOrigin(0);


  const micro2 =
    scene.add
      .rectangle(
        348,
        137,
        3,
        1,
        CYAN,
        0.28
      )
      .setOrigin(0);


  const micro3 =
    scene.add
      .rectangle(
        354,
        137,
        10,
        1,
        ORANGE,
        0.38
      )
      .setOrigin(0);


  /* =======================================================
     BUILD CONTAINER
     ======================================================= */

  c.add([
    shadowPlate,
    bg,
    inner,
    accent,

    topRail,
    cyanRail,

    statusRing,
    statusDot,

    kicker,
    live,
    title,
    label,

    progress,
    percent,

    track,
    trackHighlight,
    fill,
    fillHighlight,
    fillCap,

    ...segments,

    footerLine,
    status,

    cornerTL,
    cornerTR,
    cornerBR,
    cornerRight,

    micro1,
    micro2,
    micro3
  ]);


  /* =======================================================
     INITIAL ANIMATION
     ======================================================= */

  scene.tweens?.add?.({
    targets: statusDot,
    alpha: {
      from: 0.28,
      to: 1
    },
    scale: {
      from: 0.88,
      to: 1.08
    },
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });


  scene.tweens?.add?.({
    targets: statusRing,
    alpha: {
      from: 0.10,
      to: 0.42
    },
    scale: {
      from: 0.92,
      to: 1.16
    },
    duration: 1100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });


  scene.tweens?.add?.({
    targets: topRail,
    alpha: {
      from: 0.10,
      to: 0.34
    },
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });


  scene.tweens?.add?.({
    targets: cyanRail,
    alpha: {
      from: 0.30,
      to: 0.95
    },
    duration: 1700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });


  return {
    c,

    shadowPlate,
    bg,
    inner,
    accent,

    topRail,
    cyanRail,

    statusDot,
    statusRing,

    kicker,
    live,
    title,
    label,

    progress,
    percent,

    track,
    trackHighlight,
    fill,
    fillHighlight,
    fillCap,

    segments,

    footerLine,
    status,

    cornerTL,
    cornerTR,
    cornerBR,
    cornerRight,

    micro1,
    micro2,
    micro3
  };
}


/* =========================================================
   LAYOUT
   ========================================================= */

function layout(
  state,
  scene,
  force = false
) {

  const {
    w,
    h,
    mobile
  } = viewport(scene);


  const tutorial =
    tutorialBounds(scene);


  const baseW = 400;
  const baseH = 150;


  /* =======================================================
     MOBILE
     ======================================================= */

  if (mobile) {

    const pw =
      Math.min(
        290,
        Math.max(
          224,
          w - 24
        )
      );


    const scale =
      pw / baseW;


    const actualH =
      baseH * scale;


    const x =
      Math.max(
        12,
        w - pw - 12
      );


    const y =
      Math.max(
        80,
        h - actualH - 108
      );


    if (
      !force &&
      state.x === x &&
      state.y === y &&
      state.scale === scale &&
      state.tutorial === false
    ) {
      return;
    }


    state.x = x;
    state.y = y;
    state.scale = scale;
    state.tutorial = false;


    state.c
      .setPosition(x, y)
      .setScale(scale);


    return;
  }


  /* =======================================================
     DESKTOP
     ======================================================= */

  const pw =
    Math.min(
      430,
      Math.max(
        360,
        w - 76
      )
    );


  const scale =
    pw / baseW;


  const actualH =
    baseH * scale;


  const x =
    Math.max(
      24,
      w - pw - 30
    );


  let y =
    Math.max(
      100,
      h - actualH - 34
    );


  /* =======================================================
     TUTORIAL COLLISION AVOIDANCE
     ======================================================= */

  if (
    tutorial &&
    tutorial.right > x - 8 &&
    tutorial.bottom > y - 8
  ) {

    y =
      Math.max(
        92,
        tutorial.y - actualH - 18
      );
  }


  if (
    !force &&
    state.x === x &&
    state.y === y &&
    state.scale === scale &&
    state.tutorial === !!tutorial
  ) {
    return;
  }


  state.x = x;
  state.y = y;
  state.scale = scale;
  state.tutorial = !!tutorial;


  state.c
    .setPosition(x, y)
    .setScale(scale);
}


/* =========================================================
   SKIN EXISTING HUD
   ========================================================= */

function skinExistingHud(
  scene,
  state
) {

  if (
    state.hudSkinned ||
    !scene?.add ||
    window.__relayCinematicLock
  ) {
    return;
  }


  const { w } =
    viewport(scene);


  const texts =
    (
      scene.children?.list || []
    )
    .filter(
      child =>
        child?.active &&
        child.visible !== false &&
        child.type === 'Text' &&
        child.getBounds &&
        child.scrollFactorX === 0
    );


  const groups = {

    mission:
      texts.filter(
        t => {

          const b =
            t.getBounds();

          return (
            b.x < w * .26 &&
            b.y < 125
          );
        }
      ),


    signal:
      texts.filter(
        t => {

          const b =
            t.getBounds();

          const s =
            String(
              t.text || ''
            );


          return (
            b.x > w * .30 &&
            b.x < w * .70 &&
            b.y < 120 &&
            (
              /SIGNAL|ENERGY|^\d+$|\d+\s*SIGNALS/i
            ).test(s)
          );
        }
      )
  };


  state.hudSkins = [];


  for (
    const [kind, items]
    of Object.entries(groups)
  ) {

    if (!items.length) continue;


    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let minDepth = Infinity;


    items.forEach(item => {

      const b =
        item.getBounds();


      minX =
        Math.min(
          minX,
          b.x
        );

      minY =
        Math.min(
          minY,
          b.y
        );

      maxX =
        Math.max(
          maxX,
          b.right
        );

      maxY =
        Math.max(
          maxY,
          b.bottom
        );


      minDepth =
        Math.min(
          minDepth,
          Number.isFinite(item.depth)
            ? item.depth
            : 9100
        );
    });


    const padX =
      kind === 'mission'
        ? 18
        : 16;


    const padY = 14;


    const existingBg =
      scene.add
        .rectangle(
          minX - padX,
          minY - padY,
          (maxX - minX) +
            padX * 2,
          (maxY - minY) +
            padY * 2,
          0x070a0f,
          .88
        )
        .setOrigin(0)
        .setScrollFactor(0)
        .setStrokeStyle(
          1,
          0xffd06e,
          .34
        )
        .setDepth(
          minDepth - .01
        );


    const rail =
      scene.add
        .rectangle(
          minX - padX,
          minY - padY,
          3,
          (maxY - minY) +
            padY * 2,
          0xffd06e,
          .82
        )
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(
          minDepth
        );


    state.hudSkins.push(
      existingBg,
      rail
    );
  }


  state.hudSkinned = true;
}


/* =========================================================
   REVEAL
   ========================================================= */

function reveal(
  state,
  scene
) {

  if (
    window.__relayCinematicLock
  ) {

    state.pendingReveal = true;
    state.visible = false;

    state.c.setVisible(false);

    return;
  }


  if (state.visible) return;


  state.visible = true;
  state.pendingReveal = false;


  layout(
    state,
    scene,
    true
  );


  state.c.setVisible(true);


  skinExistingHud(
    scene,
    state
  );


  scene.tweens?.add?.({
    targets: state.c,

    alpha: {
      from: 0,
      to: 1
    },

    x: {
      from: state.x + 20,
      to: state.x
    },

    duration: 220,

    ease: 'Quad.easeOut'
  });
}


/* =========================================================
   APPLY
   ========================================================= */

export function applyMissionObjective(
  scene,
  id = missionId(scene)
) {

  clearMissionObjective(scene);


  if (!scene?.add) {
    return null;
  }


  const objective =
    MISSION_OBJECTIVES[id] ||
    {
      ...FALLBACK_OBJECTIVE,
      id:
        id ||
        'active-mission'
    };


  const ui =
    buildPanel(
      scene,
      objective
    );


  const state = {

    objective,

    ...ui,

    completed: false,

    last: -1,

    visible: false,

    pendingReveal: false,

    x: null,

    y: null,

    scale: null,

    tutorial: null,

    hudSkinned: false,

    hudSkins: []
  };


  states.set(
    scene,
    state
  );


  scene.__missionObjectiveState =
    state;


  scene.__missionObjective =
    objective;


  reveal(
    state,
    scene
  );


  return objective;
}


/* =========================================================
   UPDATE
   ========================================================= */

export function updateMissionObjective(
  scene
) {

  const s =
    states.get(scene);


  if (
    !s ||
    !scene.player
  ) {
    return;
  }


  if (
    window.__relayCinematicLock
  ) {

    s.c.setVisible(false);

    return;
  }


  if (s.pendingReveal) {

    reveal(
      s,
      scene
    );
  }


  layout(
    s,
    scene
  );


  skinExistingHud(
    scene,
    s
  );


  const p =
    clamp(
      scene.player.x /
      worldWidth(scene)
    );


  if (
    Math.abs(
      p - s.last
    ) < .002
  ) {
    return;
  }


  s.last = p;


  const pct =
    Math.round(
      p * 100
    );


  /* =======================================================
     LIVE PROGRESS
     ======================================================= */

  const progressWidth =
    350 * p;


  s.fill.width =
    progressWidth;


  s.fillHighlight.width =
    progressWidth;


  if (p > 0) {
    s.fillCap.x =
      24 + progressWidth;
  } else {
    s.fillCap.x = 24;
  }


  s.percent.setText(
    `${pct}%`
  );


  /* =======================================================
     COMPLETION
     ======================================================= */

  if (
    !s.completed &&
    p >= s.objective.completeAt
  ) {

    s.completed = true;


    s.fill.width = 350;
    s.fillHighlight.width = 350;

    s.fillCap.x = 374;


    s.percent.setText(
      '100%'
    );


    s.progress.setText(
      'ROUTE STATUS'
    );


    s.kicker.setText(
      'OBJECTIVE COMPLETE'
    );


    s.live.setText(
      'SECURED'
    );


    s.status.setText(
      '●  ROUTE GOAL SECURED'
    );


    s.status.setColor?.(
      '#63e6a8'
    );


    s.percent.setColor?.(
      '#8cf5c2'
    );


    s.kicker.setColor?.(
      '#7ff0b8'
    );


    s.fill.setFillStyle?.(
      0x35d07f,
      1
    );


    s.fillHighlight.setFillStyle?.(
      0x7ff0b8,
      0.92
    );


    s.fillCap.setFillStyle?.(
      0x9df8cb,
      0.95
    );


    s.accent.setFillStyle?.(
      0x35d07f,
      1
    );


    s.bg.setStrokeStyle?.(
      1,
      0x35d07f,
      0.78
    );


    s.topRail.setFillStyle?.(
      0x35d07f,
      0.26
    );


    s.cyanRail.setFillStyle?.(
      0x7ff0b8,
      0.86
    );


    scene.tweens?.add?.({

      targets: s.c,

      scaleX: {
        from: s.scale,
        to: s.scale * 1.025
      },

      scaleY: {
        from: s.scale,
        to: s.scale * 1.025
      },

      yoyo: true,

      duration: 140,

      repeat: 1,

      ease: 'Quad.easeOut'
    });


    scene.tweens?.add?.({

      targets: [
        s.statusDot,
        s.statusRing
      ],

      alpha: {
        from: 1,
        to: 0.25
      },

      duration: 180,

      yoyo: true,

      repeat: 2,

      ease: 'Quad.easeOut'
    });


    scene.events?.emit?.(
      'mission-objective-complete',
      {
        id: missionId(scene),

        objective:
          s.objective
      }
    );
  }
}


/* =========================================================
   CLEAR
   ========================================================= */

export function clearMissionObjective(
  scene
) {

  const s =
    states.get(scene) ||
    scene.__missionObjectiveState;


  s?.c?.destroy?.();


  s?.hudSkins?.forEach(
    item =>
      item?.destroy?.()
  );


  states.delete(scene);


  scene.__missionObjectiveState =
    null;


  scene.__missionObjective =
    null;
}


/* =========================================================
   RUNNER SCENE HOOKS
   ========================================================= */

if (
  !RunnerScene.prototype
    .__missionObjectivesV1Patched
) {

  const create =
    RunnerScene.prototype.create;

  const update =
    RunnerScene.prototype.update;

  const shutdown =
    RunnerScene.prototype.shutdown;


  RunnerScene.prototype.create =
    function(...a) {

      const r =
        create.apply(
          this,
          a
        );


      try {

        applyMissionObjective(
          this
        );

      } catch(e) {

        console.error(
          '[MissionObjectivesV1] create failed',
          e
        );
      }


      return r;
    };


  RunnerScene.prototype.update =
    function(...a) {

      const r =
        update.apply(
          this,
          a
        );


      try {

        updateMissionObjective(
          this
        );

      } catch(e) {

        console.error(
          '[MissionObjectivesV1] update failed',
          e
        );
      }


      return r;
    };


  RunnerScene.prototype.shutdown =
    function(...a) {

      try {

        clearMissionObjective(
          this
        );

      } catch(e) {

        console.error(
          '[MissionObjectivesV1] shutdown failed',
          e
        );
      }


      return typeof shutdown === 'function'
        ? shutdown.apply(
            this,
            a
          )
        : undefined;
    };


  RunnerScene.prototype
    .__missionObjectivesV1Patched =
    true;
}
