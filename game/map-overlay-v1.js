/* ============================================================
   RELAY // TACTICAL MAP V3
   SVG tactical world map
   - Real mission geometry
   - SVG rendering
   - Zoom / Pan
   - Animated route
   - Platforms / roofs
   - Water
   - Obstacles
   - Boost pads
   - Moving gates
   - Checkpoints
   - Signals
   - Enemies
   - Start / Goal
   - Player telemetry
   ============================================================ */

(() => {
  'use strict';

  const ID = 'relay-tactical-map-v3';

  const state = {
    open: false,
    pausedByMap: false,
    keyHandlerInstalled: false,
    telemetryTimer: null,

    svg: null,
    viewport: null,
    world: null,

    view: {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    },

    baseView: {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    },

    pointer: {
      active: false,
      id: null,
      x: 0,
      y: 0,
    },
  };

  const MAP_PROFILES = {
    'first-delivery': {
      zone: 'OLD QUARTER',
      code: 'SECTOR 01',
      accent: '#22d3ee',
      secondary: '#67e8f9',
      danger: '#fb7185',
      checkpoint: '#34d399',
    },

    'dead-drop': {
      zone: 'INDUSTRIAL DISTRICT',
      code: 'SECTOR 02',
      accent: '#a78bfa',
      secondary: '#c4b5fd',
      danger: '#fb7185',
      checkpoint: '#34d399',
    },

    blackout: {
      zone: 'BLACKOUT GRID',
      code: 'SECTOR 03',
      accent: '#facc15',
      secondary: '#fde68a',
      danger: '#ef4444',
      checkpoint: '#22d3ee',
    },

    pursuit: {
      zone: 'CHASE CORRIDOR',
      code: 'SECTOR 04',
      accent: '#fb7185',
      secondary: '#fda4af',
      danger: '#ef4444',
      checkpoint: '#facc15',
    },

    'signal-storm': {
      zone: 'STORM SECTOR',
      code: 'SECTOR 05',
      accent: '#38bdf8',
      secondary: '#7dd3fc',
      danger: '#f43f5e',
      checkpoint: '#a78bfa',
    },

    'corporate-lockdown': {
      zone: 'CORPORATE COMPLEX',
      code: 'SECTOR 06',
      accent: '#60a5fa',
      secondary: '#93c5fd',
      danger: '#f43f5e',
      checkpoint: '#34d399',
    },

    'final-relay': {
      zone: 'RELAY SPIRE',
      code: 'SECTOR 07',
      accent: '#34d399',
      secondary: '#6ee7b7',
      danger: '#fb7185',
      checkpoint: '#22d3ee',
    },

    ghostline: {
      zone: 'GHOSTLINE NETWORK',
      code: 'SECTOR 08',
      accent: '#c084fc',
      secondary: '#e9d5ff',
      danger: '#f43f5e',
      checkpoint: '#22d3ee',
    },
  };

  const DEFAULT_PROFILE = {
    zone: 'UNKNOWN SECTOR',
    code: 'TACTICAL GRID',
    accent: '#22d3ee',
    secondary: '#67e8f9',
    danger: '#fb7185',
    checkpoint: '#34d399',
  };

  /* ============================================================
     HELPERS
     ============================================================ */

  const $ = (id) => document.getElementById(id);

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const num = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const esc = (value) =>
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const createSvg = (tag, attrs = {}) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);

    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && value !== null) {
        el.setAttribute(key, String(value));
      }
    }

    return el;
  };

  const textSvg = (tag, text, attrs = {}) => {
    const el = createSvg(tag, attrs);
    el.textContent = text;
    return el;
  };

  const normalizeArray = (value) => (Array.isArray(value) ? value : []);

  /* ============================================================
     FIND ACTIVE RUNNER / MISSION
     ============================================================ */

  function getRunnerScene() {
    return window.__relayRunnerScene || window.game?.scene?.getScene?.('runner') || null;
  }

  function getMission() {
    const scene = getRunnerScene();

    const mission =
      scene?.mission ||
      scene?.runMission ||
      window.__relayCurrentMission ||
      window.relayCurrentMission ||
      null;

    if (!mission) return null;

    return mission;
  }

  function getMissionId(mission) {
    return mission?.id || mission?.missionId || mission?.key || 'first-delivery';
  }

  function getProfile(mission) {
    return MAP_PROFILES[getMissionId(mission)] || DEFAULT_PROFILE;
  }

  /* ============================================================
     WORLD DATA
     ============================================================ */

  function parsePlatform(item) {
    if (Array.isArray(item)) {
      return {
        x: num(item[0]),
        y: num(item[1]),
        width: Math.max(1, num(item[2], 100)),
        height: Math.max(1, num(item[3], 30)),
        type: item[4] || 'platform',
      };
    }

    if (item && typeof item === 'object') {
      return {
        x: num(item.x),
        y: num(item.y),
        width: Math.max(1, num(item.width ?? item.w, 100)),
        height: Math.max(1, num(item.height ?? item.h, 30)),
        type: item.type || 'platform',
      };
    }

    return null;
  }

  function parsePoint(item) {
    if (Array.isArray(item)) {
      return {
        x: num(item[0]),
        y: num(item[1]),
      };
    }

    if (item && typeof item === 'object') {
      return {
        x: num(item.x),
        y: num(item.y),
      };
    }

    return null;
  }

  function getWorldData(mission) {
    const platforms = normalizeArray(mission?.platforms).map(parsePlatform).filter(Boolean);

    const obstacles = normalizeArray(mission?.obstacles).map(parsePoint).filter(Boolean);

    const boostPads = normalizeArray(mission?.boostPads).map(parsePoint).filter(Boolean);

    const checkpoints = normalizeArray(mission?.checkpoints).map(parsePoint).filter(Boolean);

    const signals = normalizeArray(mission?.signals).map(parsePoint).filter(Boolean);

    const movingGates = normalizeArray(mission?.movingGates)
      .map((item) => {
        if (Array.isArray(item)) {
          return {
            x: num(item[0]),
            y: num(item[1]),
            width: Math.max(20, num(item[2], 200)),
            height: Math.max(20, num(item[3], 300)),
          };
        }

        if (item && typeof item === 'object') {
          return {
            x: num(item.x),
            y: num(item.y),
            width: Math.max(20, num(item.width ?? item.w, 200)),
            height: Math.max(20, num(item.height ?? item.h, 300)),
          };
        }

        return null;
      })
      .filter(Boolean);

    const waterZones = normalizeArray(mission?.waterZones)
      .map((item) => {
        if (Array.isArray(item)) {
          return {
            x: num(item[0]),
            y: num(item[1]),
            width: Math.max(20, num(item[2], 100)),
            height: Math.max(20, num(item[3], 100)),
          };
        }

        if (item && typeof item === 'object') {
          return {
            x: num(item.x),
            y: num(item.y),
            width: Math.max(20, num(item.width ?? item.w, 100)),
            height: Math.max(20, num(item.height ?? item.h, 100)),
          };
        }

        return null;
      })
      .filter(Boolean);

    const enemies = normalizeArray(mission?.enemies)
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        return {
          type: item.type || 'security',
          x: num(item.x),
          y: num(item.y),
          min: num(item.min, num(item.x) - 100),
          max: num(item.max, num(item.x) + 100),
        };
      })
      .filter(Boolean);

    const guides = normalizeArray(mission?.guides)
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        return {
          x: num(item.x),
          y: num(item.y),
          text: String(item.text || 'SECTOR'),
        };
      })
      .filter(Boolean);

    const spawn =
      parsePoint(mission?.spawn) ||
      (platforms.length
        ? {
            x: platforms[0].x + 50,
            y: platforms[0].y,
          }
        : { x: 120, y: 520 });

    const goal = parsePoint(mission?.goal) || {
      x: platforms.length
        ? platforms[platforms.length - 1].x + platforms[platforms.length - 1].width
        : 6100,
      y: 500,
    };

    return {
      platforms,
      obstacles,
      boostPads,
      checkpoints,
      signals,
      movingGates,
      waterZones,
      enemies,
      guides,
      spawn,
      goal,
    };
  }

  /* ============================================================
     BOUNDS
     ============================================================ */

  function calculateBounds(world) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const include = (x, y, width = 0, height = 0) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    };

    world.platforms.forEach((p) => {
      include(p.x, p.y, p.width, p.height);
    });

    world.movingGates.forEach((g) => {
      include(g.x, g.y, g.width, g.height);
    });

    world.waterZones.forEach((w) => {
      include(w.x, w.y, w.width, w.height);
    });

    [
      ...world.obstacles,
      ...world.boostPads,
      ...world.checkpoints,
      ...world.signals,
      ...world.enemies,
      ...world.guides,
    ].forEach((p) => {
      include(p.x, p.y, 1, 1);
    });

    include(world.spawn.x, world.spawn.y, 1, 1);
    include(world.goal.x, world.goal.y, 1, 1);

    if (!Number.isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 6000;
      maxY = 900;
    }

    const paddingX = Math.max(250, (maxX - minX) * 0.07);
    const paddingY = Math.max(180, (maxY - minY) * 0.22);

    return {
      x: minX - paddingX,
      y: minY - paddingY,
      width: Math.max(1000, maxX - minX + paddingX * 2),
      height: Math.max(700, maxY - minY + paddingY * 2),
    };
  }

  /* ============================================================
     OVERLAY
     ============================================================ */

  function ensureOverlay() {
    let root = $(ID);

    if (root) {
      return root;
    }

    root = document.createElement('div');
    root.id = ID;
    root.className = 'relay-map-overlay';

    root.innerHTML = `
      <div class="relay-map-shell">

        <header class="relay-map-header">

          <div class="relay-map-title-block">
            <div class="relay-map-kicker">
              RELAY // TACTICAL NAVIGATION
            </div>

            <div
              class="relay-map-title"
              id="relayMapMissionTitle"
            >
              UNKNOWN MISSION
            </div>

            <div
              class="relay-map-zone"
              id="relayMapMissionZone"
            >
              UNKNOWN SECTOR
            </div>
          </div>

          <div class="relay-map-status">
            <span class="relay-map-status-dot"></span>
            <span>LIVE WORLD DATA</span>
          </div>

          <button
            type="button"
            class="relay-map-close"
            id="relayMapClose"
            aria-label="Close tactical map"
          >
            ESC
          </button>

        </header>

        <section class="relay-map-main">

          <aside class="relay-map-sidebar">

            <div class="relay-map-panel">
              <div class="relay-map-panel-title">
                MAP SYSTEM
              </div>

              <div class="relay-map-stat">
                <span>GRID</span>
                <strong id="relayMapGridStatus">ONLINE</strong>
              </div>

              <div class="relay-map-stat">
                <span>ZOOM</span>
                <strong id="relayMapZoom">100%</strong>
              </div>

              <div class="relay-map-stat">
                <span>SECTOR</span>
                <strong id="relayMapSector">--</strong>
              </div>
            </div>

            <div class="relay-map-panel relay-map-legend">

              <div class="relay-map-panel-title">
                LEGEND
              </div>

              <div class="relay-map-legend-row">
                <span class="legend-symbol legend-player"></span>
                PLAYER
              </div>

              <div class="relay-map-legend-row">
                <span class="legend-symbol legend-checkpoint"></span>
                CHECKPOINT
              </div>

              <div class="relay-map-legend-row">
                <span class="legend-symbol legend-signal"></span>
                SIGNAL
              </div>

              <div class="relay-map-legend-row">
                <span class="legend-symbol legend-enemy"></span>
                SECURITY
              </div>

              <div class="relay-map-legend-row">
                <span class="legend-symbol legend-goal"></span>
                RELAY
              </div>

              <div class="relay-map-legend-row">
                <span class="legend-symbol legend-boost"></span>
                BOOST
              </div>

            </div>

            <div class="relay-map-controls">

              <button
                type="button"
                data-map-action="zoom-in"
              >
                +
              </button>

              <button
                type="button"
                data-map-action="zoom-out"
              >
                −
              </button>

              <button
                type="button"
                data-map-action="fit"
              >
                FIT
              </button>

              <button
                type="button"
                data-map-action="player"
              >
                PLAYER
              </button>

            </div>

          </aside>

          <div
            class="relay-map-viewport"
            id="relayMapViewport"
          >

            <div class="relay-map-scanline"></div>

            <svg
              id="relayMapSvg"
              class="relay-map-svg"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
              aria-label="Tactical map"
            ></svg>

            <div class="relay-map-corner relay-map-corner-tl"></div>
            <div class="relay-map-corner relay-map-corner-tr"></div>
            <div class="relay-map-corner relay-map-corner-bl"></div>
            <div class="relay-map-corner relay-map-corner-br"></div>

            <div class="relay-map-hint">
              DRAG TO PAN · WHEEL TO ZOOM · M / ESC TO CLOSE
            </div>

          </div>

        </section>

        <footer class="relay-map-footer">

          <div>
            <span class="footer-label">POSITION</span>
            <strong id="relayMapPlayerPosition">---</strong>
          </div>

          <div>
            <span class="footer-label">CHECKPOINT</span>
            <strong id="relayMapCheckpointStatus">---</strong>
          </div>

          <div>
            <span class="footer-label">SIGNALS</span>
            <strong id="relayMapSignalStatus">---</strong>
          </div>

          <div>
            <span class="footer-label">THREAT</span>
            <strong id="relayMapThreatStatus">---</strong>
          </div>

        </footer>

      </div>
    `;

    document.body.appendChild(root);

    state.svg = $('relayMapSvg');
    state.viewport = $('relayMapViewport');

    $('relayMapClose')?.addEventListener('click', close);

    root.querySelectorAll('[data-map-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.mapAction;

        if (action === 'zoom-in') {
          zoomAtCenter(1.25);
        }

        if (action === 'zoom-out') {
          zoomAtCenter(0.8);
        }

        if (action === 'fit') {
          fit();
        }

        if (action === 'player') {
          centerOnPlayer();
        }
      });
    });

    installPointerControls();
    installKeyboard();

    return root;
  }

  /* ============================================================
     SVG DEFS
     ============================================================ */

  function buildDefs(svg, profile) {
    const defs = createSvg('defs');

    const grid = createSvg('pattern', {
      id: 'relayGridPattern',
      width: 100,
      height: 100,
      patternUnits: 'userSpaceOnUse',
    });

    grid.appendChild(
      createSvg('path', {
        d: 'M 100 0 L 0 0 0 100',
        fill: 'none',
        stroke: profile.accent,
        'stroke-width': 1,
        opacity: 0.12,
      }),
    );

    const majorGrid = createSvg('pattern', {
      id: 'relayMajorGrid',
      width: 500,
      height: 500,
      patternUnits: 'userSpaceOnUse',
    });

    majorGrid.appendChild(
      createSvg('rect', {
        width: 500,
        height: 500,
        fill: 'url(#relayGridPattern)',
      }),
    );

    majorGrid.appendChild(
      createSvg('path', {
        d: 'M 500 0 L 0 0 0 500',
        fill: 'none',
        stroke: profile.accent,
        'stroke-width': 2,
        opacity: 0.18,
      }),
    );

    defs.appendChild(grid);
    defs.appendChild(majorGrid);

    const filterColors = [
      ['cyan', profile.accent],
      ['green', profile.checkpoint],
      ['red', profile.danger],
      ['yellow', '#facc15'],
    ];

    filterColors.forEach(([name, color]) => {
      const filter = createSvg('filter', {
        id: `relayGlow-${name}`,
        x: '-100%',
        y: '-100%',
        width: '300%',
        height: '300%',
      });

      const blur1 = createSvg('feGaussianBlur', {
        stdDeviation: 8,
        result: 'blur',
      });

      const flood = createSvg('feFlood', {
        'flood-color': color,
        'flood-opacity': 0.9,
      });

      const composite = createSvg('feComposite', {
        in2: 'blur',
        operator: 'in',
      });

      const merge = createSvg('feMerge');

      merge.appendChild(
        createSvg('feMergeNode', {
          in: 'SourceGraphic',
        }),
      );

      merge.appendChild(
        createSvg('feMergeNode', {
          in: 'SourceGraphic',
        }),
      );

      filter.appendChild(blur1);
      filter.appendChild(flood);
      filter.appendChild(composite);
      filter.appendChild(merge);

      defs.appendChild(filter);
    });

    const waterGradient = createSvg('linearGradient', {
      id: 'relayWaterGradient',
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 1,
    });

    waterGradient.appendChild(
      createSvg('stop', {
        offset: '0%',
        'stop-color': '#082f49',
        'stop-opacity': 0.95,
      }),
    );

    waterGradient.appendChild(
      createSvg('stop', {
        offset: '100%',
        'stop-color': '#020617',
        'stop-opacity': 0.98,
      }),
    );

    defs.appendChild(waterGradient);

    const platformGradient = createSvg('linearGradient', {
      id: 'relayPlatformGradient',
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 1,
    });

    platformGradient.appendChild(
      createSvg('stop', {
        offset: '0%',
        'stop-color': '#16243f',
      }),
    );

    platformGradient.appendChild(
      createSvg('stop', {
        offset: '100%',
        'stop-color': '#050b18',
      }),
    );

    defs.appendChild(platformGradient);

    const playerGradient = createSvg('radialGradient', {
      id: 'relayPlayerGradient',
    });

    playerGradient.appendChild(
      createSvg('stop', {
        offset: '0%',
        'stop-color': '#ffffff',
      }),
    );

    playerGradient.appendChild(
      createSvg('stop', {
        offset: '35%',
        'stop-color': profile.accent,
      }),
    );

    playerGradient.appendChild(
      createSvg('stop', {
        offset: '100%',
        'stop-color': '#0f172a',
      }),
    );

    defs.appendChild(playerGradient);

    svg.appendChild(defs);
  }

  /* ============================================================
     WORLD BACKGROUND
     ============================================================ */

  function drawWorldBackground(svg, bounds, profile) {
    const background = createSvg('g', {
      class: 'relay-map-background',
    });

    background.appendChild(
      createSvg('rect', {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        fill: '#030712',
      }),
    );

    background.appendChild(
      createSvg('rect', {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        fill: 'url(#relayMajorGrid)',
      }),
    );

    background.appendChild(
      createSvg('rect', {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        fill: 'none',
        stroke: profile.accent,
        'stroke-width': 5,
        opacity: 0.28,
      }),
    );

    svg.appendChild(background);
  }

  /* ============================================================
     DECORATIVE CITY / TERRAIN
     ============================================================ */

  function drawCity(world, svg, bounds, profile) {
    const group = createSvg('g', {
      class: 'relay-map-city',
    });

    const start = Math.floor(bounds.x);
    const end = Math.ceil(bounds.x + bounds.width);

    let seed = Math.abs(
      getMissionId(getMission())
        .split('')
        .reduce((a, c) => a + c.charCodeAt(0), 0),
    );

    for (let x = start; x < end; x += 180) {
      seed = (seed * 1664525 + 1013904223) % 4294967296;

      const normalized = seed / 4294967296;
      const width = 90 + normalized * 100;
      const height = 90 + normalized * 280;

      const groundY = bounds.y + bounds.height * 0.78;

      const building = createSvg('rect', {
        x,
        y: groundY - height,
        width,
        height,
        fill: '#07101f',
        stroke: profile.accent,
        'stroke-width': 2,
        opacity: 0.16,
      });

      group.appendChild(building);

      const lightCount = 2 + Math.floor(normalized * 5);

      for (let i = 0; i < lightCount; i++) {
        group.appendChild(
          createSvg('rect', {
            x: x + 16 + i * 18,
            y: groundY - height + 25,
            width: 5,
            height: Math.max(20, height - 50),
            fill: profile.accent,
            opacity: 0.08,
          }),
        );
      }
    }

    svg.appendChild(group);
  }

  /* ============================================================
     WATER
     ============================================================ */

  function drawWater(world, svg, profile) {
    const group = createSvg('g', {
      class: 'relay-map-water',
    });

    world.waterZones.forEach((water, index) => {
      const rect = createSvg('rect', {
        x: water.x,
        y: water.y,
        width: water.width,
        height: water.height,
        rx: 12,
        fill: 'url(#relayWaterGradient)',
        stroke: '#0ea5e9',
        'stroke-width': 3,
        opacity: 0.9,
      });

      group.appendChild(rect);

      for (let y = water.y + 20; y < water.y + water.height; y += 32) {
        group.appendChild(
          createSvg('path', {
            d: `M ${water.x + 12} ${y}
                C ${water.x + water.width * 0.25} ${y - 10},
                  ${water.x + water.width * 0.75} ${y + 10},
                  ${water.x + water.width - 12} ${y}`,
            fill: 'none',
            stroke: profile.accent,
            'stroke-width': 2,
            opacity: 0.16,
            class: 'relay-water-wave',
            style: `animation-delay:${index * 0.2}s`,
          }),
        );
      }

      group.appendChild(
        textSvg('text', 'WATER', {
          x: water.x + water.width / 2,
          y: water.y + 30,
          class: 'relay-map-water-label',
          'text-anchor': 'middle',
        }),
      );
    });

    svg.appendChild(group);
  }

  /* ============================================================
     PLATFORMS
     ============================================================ */

  function drawPlatforms(world, svg, profile) {
    const group = createSvg('g', {
      class: 'relay-map-platforms',
    });

    world.platforms.forEach((platform) => {
      const roof = String(platform.type).toLowerCase() === 'roof';

      const rect = createSvg('rect', {
        x: platform.x,
        y: platform.y,
        width: platform.width,
        height: platform.height,
        rx: roof ? 3 : 6,
        fill: roof ? '#101a32' : 'url(#relayPlatformGradient)',
        stroke: roof ? profile.secondary : profile.accent,
        'stroke-width': roof ? 3 : 2,
        opacity: roof ? 0.95 : 0.92,
      });

      group.appendChild(rect);

      group.appendChild(
        createSvg('rect', {
          x: platform.x,
          y: platform.y,
          width: platform.width,
          height: Math.min(8, platform.height),
          fill: roof ? profile.secondary : profile.accent,
          opacity: 0.7,
          class: 'relay-platform-edge',
        }),
      );

      if (platform.width > 180) {
        for (let x = platform.x + 45; x < platform.x + platform.width - 20; x += 90) {
          group.appendChild(
            createSvg('line', {
              x1: x,
              y1: platform.y + 18,
              x2: x,
              y2: platform.y + platform.height - 12,
              stroke: profile.accent,
              'stroke-width': 1,
              opacity: 0.11,
            }),
          );
        }
      }
    });

    svg.appendChild(group);
  }

  /* ============================================================
     OBSTACLES
     ============================================================ */

  function drawObstacles(world, svg, profile) {
    const group = createSvg('g', {
      class: 'relay-map-obstacles',
    });

    world.obstacles.forEach((obstacle, index) => {
      const x = obstacle.x;
      const y = obstacle.y;

      group.appendChild(
        createSvg('rect', {
          x: x - 24,
          y: y - 42,
          width: 48,
          height: 84,
          rx: 5,
          fill: '#160b18',
          stroke: profile.danger,
          'stroke-width': 3,
          opacity: 0.92,
        }),
      );

      group.appendChild(
        createSvg('line', {
          x1: x - 18,
          y1: y - 30,
          x2: x + 18,
          y2: y + 30,
          stroke: profile.danger,
          'stroke-width': 5,
          opacity: 0.8,
        }),
      );

      group.appendChild(
        createSvg('line', {
          x1: x + 18,
          y1: y - 30,
          x2: x - 18,
          y2: y + 30,
          stroke: profile.danger,
          'stroke-width': 5,
          opacity: 0.8,
        }),
      );

      group.appendChild(
        textSvg('text', `HAZARD ${String(index + 1).padStart(2, '0')}`, {
          x,
          y: y - 55,
          class: 'relay-map-small-label',
          'text-anchor': 'middle',
        }),
      );
    });

    svg.appendChild(group);
  }

  /* ============================================================
     BOOST PADS
     ============================================================ */

  function drawBoostPads(world, svg, profile) {
    const group = createSvg('g', {
      class: 'relay-map-boosts',
    });

    world.boostPads.forEach((boost) => {
      const x = boost.x;
      const y = boost.y;

      group.appendChild(
        createSvg('rect', {
          x: x - 42,
          y: y - 8,
          width: 84,
          height: 16,
          rx: 8,
          fill: '#062a31',
          stroke: '#22d3ee',
          'stroke-width': 3,
          class: 'relay-boost-glow',
        }),
      );

      for (let i = -1; i <= 1; i++) {
        group.appendChild(
          createSvg('path', {
            d: `
              M ${x + i * 18 - 9} ${y}
              L ${x + i * 18} ${y - 5}
              L ${x + i * 18 + 9} ${y}
              L ${x + i * 18} ${y + 5}
              Z
            `,
            fill: profile.accent,
            opacity: 0.85,
          }),
        );
      }
    });

    svg.appendChild(group);
  }

  /* ============================================================
     MOVING GATES
     ============================================================ */

  function drawMovingGates(world, svg, profile) {
    const group = createSvg('g', {
      class: 'relay-map-gates',
    });

    world.movingGates.forEach((gate, index) => {
      group.appendChild(
        createSvg('rect', {
          x: gate.x,
          y: gate.y,
          width: gate.width,
          height: gate.height,
          fill: 'none',
          stroke: '#facc15',
          'stroke-width': 5,
          'stroke-dasharray': '18 12',
          opacity: 0.7,
          class: 'relay-gate-line',
        }),
      );

      group.appendChild(
        createSvg('rect', {
          x: gate.x + 12,
          y: gate.y + 12,
          width: Math.max(1, gate.width - 24),
          height: Math.max(1, gate.height - 24),
          fill: 'none',
          stroke: '#facc15',
          'stroke-width': 1,
          'stroke-dasharray': '4 12',
          opacity: 0.28,
        }),
      );

      group.appendChild(
        textSvg('text', `GATE ${String(index + 1).padStart(2, '0')}`, {
          x: gate.x + gate.width / 2,
          y: gate.y - 18,
          class: 'relay-map-gate-label',
          'text-anchor': 'middle',
        }),
      );
    });

    svg.appendChild(group);
  }

  /* ============================================================
     ROUTE
     ============================================================ */

  function buildRoute(world) {
    const points = [world.spawn, ...world.checkpoints, world.goal];

    if (!points.length) return '';

    return points
      .map((point, index) => {
        return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
      })
      .join(' ');
  }

  function drawRoute(world, svg, profile) {
    const group = createSvg('g', {
      class: 'relay-map-route',
    });

    const pathData = buildRoute(world);

    if (!pathData) {
      svg.appendChild(group);
      return;
    }

    group.appendChild(
      createSvg('path', {
        d: pathData,
        fill: 'none',
        stroke: '#020617',
        'stroke-width': 42,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        opacity: 0.85,
      }),
    );

    group.appendChild(
      createSvg('path', {
        d: pathData,
        fill: 'none',
        stroke: profile.accent,
        'stroke-width': 16,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        opacity: 0.22,
        class: 'relay-route-glow',
      }),
    );

    group.appendChild(
      createSvg('path', {
        d: pathData,
        fill: 'none',
        stroke: profile.accent,
        'stroke-width': 4,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-dasharray': '22 18',
        class: 'relay-route-flow',
      }),
    );

    svg.appendChild(group);
  }

  /* ============================================================
     CHECKPOINTS
     ============================================================ */

  function drawCheckpoints(world, svg, profile) {
    const group = createSvg('g', {
      class: 'relay-map-checkpoints',
    });

    world.checkpoints.forEach((point, index) => {
      const n = String(index + 1).padStart(2, '0');

      group.appendChild(
        createSvg('circle', {
          cx: point.x,
          cy: point.y,
          r: 48,
          fill: 'none',
          stroke: profile.checkpoint,
          'stroke-width': 3,
          opacity: 0.25,
          class: 'relay-checkpoint-pulse',
        }),
      );

      group.appendChild(
        createSvg('polygon', {
          points: `
            ${point.x},${point.y - 28}
            ${point.x + 28},${point.y}
            ${point.x},${point.y + 28}
            ${point.x - 28},${point.y}
          `,
          fill: '#041b17',
          stroke: profile.checkpoint,
          'stroke-width': 4,
          filter: 'url(#relayGlow-green)',
        }),
      );

      group.appendChild(
        textSvg('text', n, {
          x: point.x,
          y: point.y + 7,
          class: 'relay-map-marker-number',
          'text-anchor': 'middle',
        }),
      );

      group.appendChild(
        textSvg('text', `CHECKPOINT ${n}`, {
          x: point.x,
          y: point.y - 48,
          class: 'relay-map-marker-label',
          'text-anchor': 'middle',
        }),
      );
    });

    svg.appendChild(group);
  }

  /* ============================================================
     SIGNALS
     ============================================================ */

  function drawSignals(world, svg, profile) {
    const group = createSvg('g', {
      class: 'relay-map-signals',
    });

    world.signals.forEach((point, index) => {
      const n = String(index + 1).padStart(2, '0');

      group.appendChild(
        createSvg('circle', {
          cx: point.x,
          cy: point.y,
          r: 26,
          fill: 'none',
          stroke: profile.accent,
          'stroke-width': 2,
          opacity: 0.32,
          class: 'relay-signal-pulse',
          style: `animation-delay:${(index % 8) * 0.12}s`,
        }),
      );

      group.appendChild(
        createSvg('circle', {
          cx: point.x,
          cy: point.y,
          r: 9,
          fill: profile.accent,
          filter: 'url(#relayGlow-cyan)',
        }),
      );

      group.appendChild(
        createSvg('circle', {
          cx: point.x,
          cy: point.y,
          r: 3,
          fill: '#ffffff',
        }),
      );

      group.appendChild(
        textSvg('text', `S-${n}`, {
          x: point.x + 18,
          y: point.y - 16,
          class: 'relay-map-signal-label',
        }),
      );
    });

    svg.appendChild(group);
  }

  /* ============================================================
     ENEMIES
     ============================================================ */

  function drawEnemies(world, svg, profile) {
    const group = createSvg('g', {
      class: 'relay-map-enemies',
    });

    world.enemies.forEach((enemy, index) => {
      const x = enemy.x;
      const y = enemy.y;

      group.appendChild(
        createSvg('circle', {
          cx: x,
          cy: y,
          r: 36,
          fill: 'none',
          stroke: profile.danger,
          'stroke-width': 2,
          'stroke-dasharray': '8 8',
          opacity: 0.35,
          class: 'relay-enemy-ring',
        }),
      );

      group.appendChild(
        createSvg('polygon', {
          points: `
            ${x},${y - 18}
            ${x + 18},${y}
            ${x},${y + 18}
            ${x - 18},${y}
          `,
          fill: '#220b12',
          stroke: profile.danger,
          'stroke-width': 3,
          filter: 'url(#relayGlow-red)',
        }),
      );

      group.appendChild(
        textSvg('text', '!', {
          x,
          y: y + 6,
          class: 'relay-map-enemy-symbol',
          'text-anchor': 'middle',
        }),
      );

      group.appendChild(
        createSvg('line', {
          x1: enemy.min,
          y1: y + 32,
          x2: enemy.max,
          y2: y + 32,
          stroke: profile.danger,
          'stroke-width': 2,
          opacity: 0.25,
        }),
      );

      group.appendChild(
        textSvg('text', String(enemy.type).toUpperCase(), {
          x,
          y: y + 55,
          class: 'relay-map-threat-label',
          'text-anchor': 'middle',
        }),
      );

      group.appendChild(
        textSvg('text', `THREAT ${String(index + 1).padStart(2, '0')}`, {
          x,
          y: y - 48,
          class: 'relay-map-small-label',
          'text-anchor': 'middle',
        }),
      );
    });

    svg.appendChild(group);
  }

  /* ============================================================
     START
     ============================================================ */

  function drawStart(world, svg, profile) {
    const group = createSvg('g', {
      class: 'relay-map-start',
    });

    const x = world.spawn.x;
    const y = world.spawn.y;

    group.appendChild(
      createSvg('circle', {
        cx: x,
        cy: y,
        r: 62,
        fill: 'none',
        stroke: profile.accent,
        'stroke-width': 2,
        'stroke-dasharray': '10 10',
        opacity: 0.35,
        class: 'relay-start-ring',
      }),
    );

    group.appendChild(
      createSvg('circle', {
        cx: x,
        cy: y,
        r: 34,
        fill: '#061923',
        stroke: profile.accent,
        'stroke-width': 4,
        filter: 'url(#relayGlow-cyan)',
      }),
    );

    group.appendChild(
      textSvg('text', 'START', {
        x,
        y: y + 5,
        class: 'relay-map-start-text',
        'text-anchor': 'middle',
      }),
    );

    svg.appendChild(group);
  }

  /* ============================================================
     GOAL
     ============================================================ */

  function drawGoal(world, svg, profile) {
    const group = createSvg('g', {
      class: 'relay-map-goal',
    });

    const x = world.goal.x;
    const y = world.goal.y;

    group.appendChild(
      createSvg('circle', {
        cx: x,
        cy: y,
        r: 82,
        fill: 'none',
        stroke: profile.checkpoint,
        'stroke-width': 3,
        'stroke-dasharray': '16 12',
        opacity: 0.32,
        class: 'relay-goal-ring',
      }),
    );

    group.appendChild(
      createSvg('circle', {
        cx: x,
        cy: y,
        r: 58,
        fill: '#041b17',
        stroke: profile.checkpoint,
        'stroke-width': 4,
        filter: 'url(#relayGlow-green)',
      }),
    );

    group.appendChild(
      createSvg('polygon', {
        points: `
          ${x},${y - 28}
          ${x + 28},${y}
          ${x},${y + 28}
          ${x - 28},${y}
        `,
        fill: profile.checkpoint,
        opacity: 0.9,
      }),
    );

    group.appendChild(
      textSvg('text', 'RELAY', {
        x,
        y: y - 92,
        class: 'relay-map-goal-label',
        'text-anchor': 'middle',
      }),
    );

    group.appendChild(
      textSvg('text', 'TARGET', {
        x,
        y: y + 98,
        class: 'relay-map-goal-sub',
        'text-anchor': 'middle',
      }),
    );

    svg.appendChild(group);
  }

  /* ============================================================
     GUIDES / SECTORS
     ============================================================ */

  function drawGuides(world, svg, profile, bounds) {
    const group = createSvg('g', {
      class: 'relay-map-guides',
    });

    world.guides.forEach((guide, index) => {
      group.appendChild(
        createSvg('line', {
          x1: guide.x,
          y1: bounds.y,
          x2: guide.x,
          y2: bounds.y + bounds.height,
          stroke: profile.accent,
          'stroke-width': 1,
          'stroke-dasharray': '5 20',
          opacity: 0.12,
        }),
      );

      group.appendChild(
        textSvg('text', String(guide.text).toUpperCase(), {
          x: guide.x,
          y: bounds.y + 70 + index * 28,
          class: 'relay-map-guide-label',
          'text-anchor': 'middle',
        }),
      );
    });

    svg.appendChild(group);
  }

  /* ============================================================
     PLAYER
     ============================================================ */

  function createPlayerMarker(profile) {
    const group = createSvg('g', {
      id: 'relayMapPlayerMarker',
      class: 'relay-map-player-marker',
    });

    group.appendChild(
      createSvg('circle', {
        cx: 0,
        cy: 0,
        r: 54,
        fill: 'none',
        stroke: profile.accent,
        'stroke-width': 3,
        opacity: 0.3,
        class: 'relay-player-pulse',
      }),
    );

    group.appendChild(
      createSvg('circle', {
        cx: 0,
        cy: 0,
        r: 28,
        fill: 'url(#relayPlayerGradient)',
        stroke: '#ffffff',
        'stroke-width': 3,
        filter: 'url(#relayGlow-cyan)',
      }),
    );

    group.appendChild(
      createSvg('polygon', {
        points: '0,-42 12,-18 -12,-18',
        fill: '#ffffff',
      }),
    );

    group.appendChild(
      textSvg('text', 'PLAYER', {
        x: 0,
        y: -68,
        class: 'relay-map-player-label',
        'text-anchor': 'middle',
      }),
    );

    return group;
  }

  function updatePlayerMarker() {
    const marker = $('relayMapPlayerMarker');

    if (!marker) return;

    const scene = getRunnerScene();
    const player = scene?.player;

    if (!player) return;

    marker.setAttribute('transform', `translate(${num(player.x)} ${num(player.y)})`);

    const x = Math.round(num(player.x));
    const y = Math.round(num(player.y));

    const position = $('relayMapPlayerPosition');

    if (position) {
      position.textContent = `${x} / ${y}`;
    }
  }

  /* ============================================================
     BUILD MAP
     ============================================================ */

  function buildMap() {
    ensureOverlay();

    const mission = getMission();

    if (!mission || !state.svg) {
      return false;
    }

    const profile = getProfile(mission);
    const world = getWorldData(mission);
    const bounds = calculateBounds(world);

    state.world = world;

    state.baseView = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };

    state.view = {
      ...state.baseView,
    };

    const svg = state.svg;

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    svg.setAttribute(
      'viewBox',
      `${state.view.x} ${state.view.y} ${state.view.width} ${state.view.height}`,
    );

    buildDefs(svg, profile);
    drawWorldBackground(svg, bounds, profile);
    drawCity(world, svg, bounds, profile);
    drawGuides(world, svg, profile, bounds);
    drawWater(world, svg, profile);
    drawPlatforms(world, svg, profile);
    drawMovingGates(world, svg, profile);
    drawObstacles(world, svg, profile);
    drawBoostPads(world, svg, profile);
    drawRoute(world, svg, profile);
    drawCheckpoints(world, svg, profile);
    drawSignals(world, svg, profile);
    drawEnemies(world, svg, profile);
    drawStart(world, svg, profile);
    drawGoal(world, svg, profile);

    svg.appendChild(
      createSvg('g', {
        id: 'relayMapPlayerLayer',
      }),
    );

    const playerMarker = createPlayerMarker(profile);

    $('relayMapPlayerLayer')?.appendChild(playerMarker);

    const title = mission.title || mission.name || mission.id || 'UNKNOWN MISSION';

    const zone = mission.zone || mission.region || profile.zone;

    if ($('relayMapMissionTitle')) {
      $('relayMapMissionTitle').textContent = String(title).toUpperCase();
    }

    if ($('relayMapMissionZone')) {
      $('relayMapMissionZone').textContent = `${profile.code} // ${String(zone).toUpperCase()}`;
    }

    if ($('relayMapSector')) {
      $('relayMapSector').textContent = profile.code;
    }

    updatePlayerMarker();
    updateTelemetry();

    return true;
  }

  /* ============================================================
     VIEW / ZOOM / PAN
     ============================================================ */

  function applyView() {
    if (!state.svg) return;

    state.svg.setAttribute(
      'viewBox',
      `${state.view.x} ${state.view.y} ${state.view.width} ${state.view.height}`,
    );

    updateZoomLabel();
  }

  function fit() {
    if (!state.baseView) return;

    state.view = {
      ...state.baseView,
    };

    applyView();
  }

  function zoomAt(worldX, worldY, factor) {
    const oldWidth = state.view.width;
    const oldHeight = state.view.height;

    const newWidth = clamp(
      oldWidth * factor,
      state.baseView.width * 0.18,
      state.baseView.width * 2.8,
    );

    const newHeight = clamp(
      oldHeight * factor,
      state.baseView.height * 0.18,
      state.baseView.height * 2.8,
    );

    const ratioX = (worldX - state.view.x) / oldWidth;

    const ratioY = (worldY - state.view.y) / oldHeight;

    state.view.width = newWidth;
    state.view.height = newHeight;

    state.view.x = worldX - ratioX * newWidth;

    state.view.y = worldY - ratioY * newHeight;

    applyView();
  }

  function zoomAtCenter(factor) {
    zoomAt(state.view.x + state.view.width / 2, state.view.y + state.view.height / 2, factor);
  }

  function getSvgPoint(clientX, clientY) {
    if (!state.svg) return null;

    const point = new DOMPoint(clientX, clientY);

    const matrix = state.svg.getScreenCTM();

    if (!matrix) return null;

    return point.matrixTransform(matrix.inverse());
  }

  function centerOnPlayer() {
    const scene = getRunnerScene();
    const player = scene?.player;

    if (!player) return;

    state.view.x = num(player.x) - state.view.width / 2;

    state.view.y = num(player.y) - state.view.height / 2;

    applyView();
  }

  function updateZoomLabel() {
    const element = $('relayMapZoom');

    if (!element) return;

    if (!state.baseView.width) {
      element.textContent = '100%';
      return;
    }

    const zoom = (state.baseView.width / state.view.width) * 100;

    element.textContent = `${Math.round(zoom)}%`;
  }

  /* ============================================================
     POINTER PAN
     ============================================================ */

  function installPointerControls() {
    const viewport = state.viewport;

    if (!viewport) return;

    viewport.addEventListener('pointerdown', (event) => {
      if (!state.open) return;

      state.pointer.active = true;
      state.pointer.id = event.pointerId;
      state.pointer.x = event.clientX;
      state.pointer.y = event.clientY;

      viewport.setPointerCapture?.(event.pointerId);

      viewport.classList.add('is-panning');
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!state.pointer.active || state.pointer.id !== event.pointerId) {
        return;
      }

      const dx = event.clientX - state.pointer.x;

      const dy = event.clientY - state.pointer.y;

      const rect = state.svg?.getBoundingClientRect();

      if (!rect || !rect.width || !rect.height) {
        return;
      }

      const worldPerPixelX = state.view.width / rect.width;

      const worldPerPixelY = state.view.height / rect.height;

      state.view.x -= dx * worldPerPixelX;

      state.view.y -= dy * worldPerPixelY;

      state.pointer.x = event.clientX;
      state.pointer.y = event.clientY;

      applyView();
    });

    const stopPointer = (event) => {
      if (
        state.pointer.id !== null &&
        event.pointerId !== undefined &&
        state.pointer.id !== event.pointerId
      ) {
        return;
      }

      state.pointer.active = false;
      state.pointer.id = null;

      viewport.classList.remove('is-panning');
    };

    viewport.addEventListener('pointerup', stopPointer);

    viewport.addEventListener('pointercancel', stopPointer);

    viewport.addEventListener('pointerleave', (event) => {
      if (!state.pointer.active || state.pointer.id !== event.pointerId) {
        return;
      }
    });

    viewport.addEventListener(
      'wheel',
      (event) => {
        if (!state.open) return;

        event.preventDefault();

        const point = getSvgPoint(event.clientX, event.clientY);

        if (!point) return;

        const factor = event.deltaY < 0 ? 0.82 : 1.22;

        zoomAt(point.x, point.y, factor);
      },
      {
        passive: false,
      },
    );
  }

  /* ============================================================
     KEYBOARD
     ============================================================ */

  function installKeyboard() {
    if (state.keyHandlerInstalled) {
      return;
    }

    state.keyHandlerInstalled = true;

    window.addEventListener(
      'keydown',
      (event) => {
        const key = String(event.key || '').toLowerCase();

        if (key === 'escape' && state.open) {
          event.preventDefault();
          event.stopPropagation();
          close();
          return;
        }

        if (key === 'm' && !event.ctrlKey && !event.altKey && !event.metaKey) {
          const target = event.target;

          const isTyping =
            target &&
            (target.tagName === 'INPUT' ||
              target.tagName === 'TEXTAREA' ||
              target.isContentEditable);

          if (isTyping) return;

          event.preventDefault();

          if (state.open) {
            close();
          } else {
            open();
          }
        }
      },
      true,
    );
  }

  /* ============================================================
     TELEMETRY
     ============================================================ */

  function updateTelemetry() {
    const mission = getMission();

    if (!mission || !state.world) {
      return;
    }

    const scene = getRunnerScene();
    const player = scene?.player;

    if (player) {
      updatePlayerMarker();
    }

    const checkpointCount = state.world.checkpoints.length;

    const signalCount = state.world.signals.length;

    let currentCheckpoint = 0;

    if (player && checkpointCount) {
      state.world.checkpoints.forEach((checkpoint, index) => {
        const distance = Math.hypot(num(player.x) - checkpoint.x, num(player.y) - checkpoint.y);

        if (distance < 130) {
          currentCheckpoint = Math.max(currentCheckpoint, index + 1);
        }
      });
    }

    if ($('relayMapCheckpointStatus')) {
      $('relayMapCheckpointStatus').textContent = checkpointCount
        ? `${currentCheckpoint}/${checkpointCount}`
        : 'NONE';
    }

    if ($('relayMapSignalStatus')) {
      $('relayMapSignalStatus').textContent = signalCount ? `${signalCount} ACTIVE` : 'NONE';
    }

    let nearestThreat = Infinity;

    if (player) {
      state.world.enemies.forEach((enemy) => {
        const distance = Math.hypot(num(player.x) - enemy.x, num(player.y) - enemy.y);

        nearestThreat = Math.min(nearestThreat, distance);
      });
    }

    if ($('relayMapThreatStatus')) {
      if (!Number.isFinite(nearestThreat)) {
        $('relayMapThreatStatus').textContent = 'CLEAR';
      } else if (nearestThreat < 220) {
        $('relayMapThreatStatus').textContent = 'CRITICAL';
      } else if (nearestThreat < 500) {
        $('relayMapThreatStatus').textContent = 'DETECTED';
      } else {
        $('relayMapThreatStatus').textContent = 'LOW';
      }
    }
  }

  /* ============================================================
     OPEN / CLOSE
     ============================================================ */

  function pauseRunner() {
    const scene = getRunnerScene();

    if (!scene || !scene.scene || !scene.scene.isActive?.()) {
      return;
    }

    if (typeof scene.scene.isPaused === 'function' && scene.scene.isPaused()) {
      state.pausedByMap = false;
      return;
    }

    try {
      scene.scene.pause();
      state.pausedByMap = true;
    } catch {
      state.pausedByMap = false;
    }
  }

  function resumeRunner() {
    if (!state.pausedByMap) {
      return;
    }

    const scene = getRunnerScene();

    try {
      if (scene?.scene && typeof scene.scene.isPaused === 'function' && scene.scene.isPaused()) {
        scene.scene.resume();
      }
    } catch {
      // Ignore resume errors.
    }

    state.pausedByMap = false;
  }

  function open() {
    const root = ensureOverlay();

    if (state.open) {
      return;
    }

    const built = buildMap();

    if (!built) {
      console.warn('[RELAY MAP] No active mission found.');
      return;
    }

    state.open = true;

    root.classList.add('is-open');

    pauseRunner();

    fit();

    window.setTimeout(updateTelemetry, 0);

    if (!state.telemetryTimer) {
      state.telemetryTimer = window.setInterval(updateTelemetry, 120);
    }
  }

  function close() {
    const root = $(ID);

    if (!state.open) {
      return;
    }

    state.open = false;

    root?.classList.remove('is-open');

    resumeRunner();

    if (state.telemetryTimer) {
      window.clearInterval(state.telemetryTimer);

      state.telemetryTimer = null;
    }
  }

  function toggle() {
    if (state.open) {
      close();
    } else {
      open();
    }
  }

  function refresh() {
    if (!state.open) {
      return;
    }

    buildMap();
    fit();
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */

  window.relayMap = Object.freeze({
    open,
    close,
    toggle,
    refresh,
    fit,
    centerOnPlayer,
    isOpen: () => state.open,
  });

  /*
   * Compatibility aliases in case another module already
   * expects a previous tactical-map API.
   */
  window.relayTacticalMap = window.relayMap;
  window.relayMapV3 = window.relayMap;

  ensureOverlay();
})();
