# RUNNER RELAY

> **RUN THE CITY. CARRY THE SIGNAL.**

A fast-paced arcade rooftop runner built around movement, missions, signal recovery, combat, route choices, XP, progression and replayability.

<p align="center">
  <a href="https://app-sooty-pi.vercel.app/">
    <img src="https://img.shields.io/badge/PLAY-LIVE%20DEMO-f5c451?style=for-the-badge&logo=vercel&logoColor=white" alt="Play Live Demo">
  </a>
  <a href="https://github.com/MaidCorbic/app">
    <img src="https://img.shields.io/badge/GITHUB-SOURCE-111827?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Source">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Phaser-3.90-6A1B9A?style=flat-square" alt="Phaser">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
</p>

---

## 🎮 PLAY RUNNER RELAY

<p align="center">
  <a href="https://app-sooty-pi.vercel.app/">
    <strong>▶ PLAY THE LIVE BUILD</strong>
  </a>
</p>

Runner Relay is a game-first rooftop running experience focused on movement, mission objectives, signal recovery, route decisions, combat and long-term progression.

> **RUN FARTHER. RECOVER THE SIGNAL. BUILD YOUR RUNNER.**

---

## ⚡ CORE GAME LOOP

```text
                 ┌───────────────┐
                 │      RUN      │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    EXPLORE    │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ RECOVER SIGNAL│
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    CHOOSE     │
                 │     ROUTE     │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    COMPLETE   │
                 │    MISSION    │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    EARN XP    │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    LEVEL UP   │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    UNLOCKS    │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    RUN AGAIN  │
                 └───────────────┘
```

---

# ✨ FEATURES

## 🏃 ROOFTOP MOVEMENT

Runner Relay is built around fast arcade movement.

Core gameplay actions include:

- Running
- Jumping
- Dash movement
- Shooting
- Blade / sword combat
- Environmental navigation
- Touch-based mobile gameplay

The movement system is designed to keep the player active and moving through the city.

---

## 📡 SIGNAL MISSIONS

The signal is at the center of the game's mission loop.

Recover signals, complete objectives, survive the route and carry the relay farther through the city.

```text
MISSION
   │
   ├── OBJECTIVES
   │
   ├── SIGNALS
   │
   ├── DISTANCE
   │
   ├── ROUTE
   │
   └── COMPLETION
```

---

## 🧭 ROUTE CHOICES

Runner Relay contains gameplay systems for route selection and branching.

Route systems include:

- Route choices
- Branching routes
- Route score bonuses
- Route mutations
- Duplicate-event protection
- Mutation coordination
- Runtime route authority

This allows individual runs to vary instead of following one completely fixed path.

---

## ⭐ XP & PROGRESSION

Runs contribute to long-term player progression.

```text
RUN
 ↓
MISSION
 ↓
XP
 ↓
LEVEL
 ↓
UNLOCKS
 ↓
NEXT RUN
```

Progression-related systems include:

- XP
- Levels
- Missions
- Challenges
- Upgrades
- Unlock reconciliation
- Seasonal progression
- Special event rewards

---

## 🎯 MISSION RESULTS

Mission completion is handled as a dedicated end-of-run flow.

```text
┌────────────────────────────┐
│      MISSION COMPLETE      │
├────────────────────────────┤
│ SIGNALS      04 / 04       │
│ SCORE        12850          │
│ TIME         02:41          │
│ XP           +120           │
└────────────────────────────┘
```

The result flow is designed to connect gameplay completion with progression.

---

## ⚔️ COMBAT

Runner Relay includes action-oriented combat mechanics.

Current input actions include:

```text
E       FIRE
Q       BLADE
SHIFT   DASH
```

Combat is integrated into the movement-oriented gameplay loop rather than being a separate game mode.

---

## 👾 ENEMY & WORLD SYSTEMS

The current codebase includes systems related to:

- Enemy intelligence
- Signal network
- Cargo integrity
- City response
- Gameplay variety
- Runtime authority
- Level wiring
- Campaign flow

---

# 📱 MOBILE GAMEPLAY

Runner Relay contains a dedicated mobile gameplay layer.

Mobile controls are designed around:

```text
┌──────────────────────────────────┐
│                                  │
│          GAMEPLAY AREA            │
│                                  │
│                                  │
│   ◯                         ◉    │
│ JOYSTICK                  ACTION │
│                                  │
│                JUMP   FIRE DASH  │
│                                  │
└──────────────────────────────────┘
```

Mobile-related systems include:

- Virtual joystick
- Touch action buttons
- Mobile action layout
- Gameplay touch locking
- Pause access
- Responsive control positioning
- Mobile-specific UI polish
- Single-owner input handling

---

# ⏸️ PAUSE & SETTINGS

Runner Relay contains an in-game pause and options architecture.

The game UI includes systems for:

- Pause menu
- Settings
- Language selection
- Game options
- Modal overlays
- Mobile pause behavior
- Runtime pause handling
- Centralized UI ownership

The UI architecture is designed to reduce conflicting state handlers and duplicate ownership.

---

# 🌍 LOCALIZATION

The project currently contains localization support for:

- English
- Ex-Yugoslav languages
- Spanish
- German

The internal i18n system provides strings for menus, gameplay actions and interface elements.

---

# 🎮 CONTROLS

## DESKTOP

```text
┌─────────────────────────────┐
│ A / D       RUN             │
│ SPACE       JUMP            │
│ E           FIRE            │
│ Q           SWORD           │
│ SHIFT       DASH            │
│ PAUSE       IN-GAME MENU    │
└─────────────────────────────┘
```

## MOBILE

```text
┌─────────────────────────────┐
│     VIRTUAL JOYSTICK        │
│                             │
│   JUMP    FIRE    DASH      │
│                             │
│   SWORD   ACTION   GEAR     │
└─────────────────────────────┘
```

---

# 📸 SCREENSHOTS

## 🏠 TITLE SCREEN

<p align="center">
  <img src="docs/screenshots/intro.jpg" width="900" alt="Runner Relay title screen">
</p>

## 📖 MISSION / TUTORIAL

<p align="center">
  <img src="docs/screenshots/tutorial.jpg" width="900" alt="Runner Relay mission briefing">
</p>

## 🎮 GAMEPLAY

<p align="center">
  <img src="docs/screenshots/game.jpg" width="900" alt="Runner Relay gameplay">
</p>

---

# 🎥 GAMEPLAY DEMO

<p align="center">
  <img src="docs/demo.gif" width="900" alt="Runner Relay gameplay demo">
</p>

Recommended gameplay sequence:

```text
BOOT
  ↓
TITLE
  ↓
MISSION
  ↓
GAMEPLAY
  ↓
MOVEMENT
  ↓
SIGNAL RECOVERY
  ↓
ROUTE CHOICE
  ↓
MISSION COMPLETE
  ↓
RESULTS
  ↓
XP / PROGRESSION
  ↓
NEXT RUN
```

---

# 🧠 GAME ARCHITECTURE

```text
RUNNER RELAY
│
├── HOME / TITLE
│
├── CAMPAIGN
│
├── MISSION SYSTEM
│
├── CHALLENGES
│
├── PLAYER SYSTEMS
│
├── GAMEPLAY
│   ├── Movement
│   ├── Jump
│   ├── Dash
│   ├── Fire
│   ├── Blade
│   ├── Enemy Systems
│   └── Touch Input
│
├── ROUTE SYSTEM
│   ├── Route Choice
│   ├── Branching
│   ├── Route Scoring
│   ├── Route Mutation
│   └── Duplicate Event Guard
│
├── PROGRESSION
│   ├── XP
│   ├── Levels
│   ├── Unlocks
│   ├── Upgrades
│   ├── Missions
│   ├── Seasonal Progression
│   └── Rewards
│
└── UI
    ├── HUD
    ├── Home
    ├── Pause
    ├── Settings
    ├── Results
    ├── Overlays
    └── Mobile UI
```

---

# 🛠️ TECH STACK

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | UI and visual presentation |
| JavaScript | Game and application logic |
| Phaser 3.90 | 2D game engine |
| Vite 8 | Development and production build |
| Node.js 24.x | Runtime and tooling |
| Playwright | Automated testing |
| Supabase | Repository/backend integration |
| npm | Package management |
| Docker | Container workflow |
| GitHub | Source control |
| Vercel | Deployment |

---

# 📁 PROJECT STRUCTURE

```text
app/
│
├── game/
│   ├── src/
│   │   └── main.js
│   │
│   ├── index.html
│   ├── package.json
│   │
│   ├── pause-interactions.js
│   ├── unified-options-ui-v1.js
│   ├── home-world-ui-polish-v1.js
│   ├── gameplay-touch-lock.js
│   ├── runtime-authority-v1.js
│   ├── campaign-v2.js
│   ├── challenges-v1.js
│   ├── p1-gameplay-correctness-v1.js
│   └── ...
│
├── supabase/
│   └── ...
│
├── docs/
│   ├── screenshots/
│   │   ├── intro.jpg
│   │   ├── tutorial.jpg
│   │   └── game.jpg
│   │
│   └── demo.gif
│
└── README.md
```

---

# 🚀 GETTING STARTED

## REQUIREMENTS

Install:

```text
Node.js 24.x
npm
Git
```

Docker can be used for containerized workflows.

---

## 📥 CLONE

```bash
git clone https://github.com/MaidCorbic/app.git
cd app/game
```

---

## 📦 INSTALL DEPENDENCIES

```bash
npm install
```

---

## ▶️ START DEVELOPMENT

```bash
npm run dev
```

---

## 🏗️ BUILD

```bash
npm run build
```

---

## 🌐 START

```bash
npm start
```

---

# 🧪 TESTING

The repository contains automated test coverage for gameplay, progression, runtime state, mobile controls, UI ownership and release stability.

Examples:

```bash
npm run test:progression
npm run test:missions
npm run test:start-flow
npm run test:upgrades
npm run test:build-system
npm run test:enemy-intel
npm run test:signal-network
npm run test:cargo-integrity
npm run test:city-response
npm run test:mobile-action-layout
npm run test:mobile-input-single-owner
npm run test:settings-state
npm run test:seasonal-progression
npm run test:gameplay-touch-lock
npm run test:gameplay-smoke
npm run test:final-stability
```

---

# 🔒 RELEASE HARDENING

The project contains a dedicated release-hardening suite intended to catch regressions before deployment.

The hardening flow covers areas including:

```text
Gameplay
Progression
Mission flow
Route choices
Route scoring
Route branching
Route mutation
Duplicate-event protection
Runtime authority
Mobile input ownership
Pause behavior
Settings state
Respawn lifecycle
Death / retry lifecycle
Gameplay touch locking
CSS ownership
Runtime stability
Build validation
Release UX
```

Run the complete release-hardening command:

```bash
npm run test:release-hardening
```

---

# 🧩 UI ARCHITECTURE

Runner Relay uses a centralized approach to shared UI ownership.

The architecture is intended to prevent:

```text
Duplicate event handlers
Conflicting CSS
Incorrect mobile positioning
Multiple input owners
Pause state conflicts
Settings state conflicts
Runtime/UI ownership collisions
```

Shared UI areas include:

- HUD
- Home
- Pause
- Settings
- Overlays
- Mobile controls
- Gameplay touch interaction

---

# 🐳 DOCKER

Build the container:

```bash
docker build -t runner-relay .
```

Run the container:

```bash
docker run -p 3000:3000 runner-relay
```

---

# 🔐 ENVIRONMENT VARIABLES

Keep credentials outside the repository.

Example:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Never commit:

```text
.env
.env.local
private keys
service-role credentials
```

Never expose server-side credentials in client-side code.

---

# 🌐 DEPLOYMENT

Runner Relay is built with Vite and deployed as a browser game.

Production build:

```bash
npm run build
```

Live deployment:

https://app-sooty-pi.vercel.app/

Repository:

https://github.com/MaidCorbic/app

Primary branch:

```text
main
```

---

# 🗺️ DEVELOPMENT STATUS

> 🚧 **RUNNER RELAY IS IN ACTIVE DEVELOPMENT**

The game is playable and the repository contains active gameplay, UI, runtime and release-hardening work.

Systems may continue to evolve as new versions are introduced.

---

# ✅ CURRENT DEVELOPMENT AREAS

```text
[x] Core Runner Relay gameplay
[x] Rooftop movement
[x] Jump / dash systems
[x] Combat actions
[x] Mission systems
[x] XP progression
[x] Route choice systems
[x] Route scoring
[x] Route branching
[x] Checkpoint / respawn systems
[x] Mobile gameplay controls
[x] Pause system
[x] Settings system
[x] Localization support
[x] Automated gameplay tests
[x] Runtime stability checks
[x] Release hardening
[x] Production build
[x] Vercel deployment
```

---

# 🔮 ROADMAP

Future development can expand the game with:

```text
[ ] Additional cities
[ ] More mission content
[ ] More route variations
[ ] Additional enemy types
[ ] More upgrades
[ ] Additional seasonal content
[ ] More special events
[ ] Expanded statistics
[ ] Achievements
[ ] Player profiles
[ ] Daily challenges
[ ] Weekly challenges
[ ] Leaderboards
[ ] Runner customization
[ ] Additional social systems
```

---

# 🤝 CONTRIBUTING

Contributions and feedback are welcome.

Recommended workflow:

```text
FORK
  ↓
CREATE BRANCH
  ↓
MAKE CHANGES
  ↓
RUN TESTS
  ↓
BUILD
  ↓
COMMIT
  ↓
OPEN PULL REQUEST
```

Keep changes focused and avoid introducing duplicated UI or runtime ownership.

---

# 🐛 BUG REPORTS

When opening a bug report, include:

```md
### Description

What happened?

### Steps to reproduce

1. ...
2. ...
3. ...

### Expected behavior

...

### Actual behavior

...

### Environment

Browser:
Operating System:
Device:
Node.js version:

### Additional information

Console errors:
Screenshots:
Video:
```

For gameplay issues, include the relevant mission, route, checkpoint or action sequence when possible.

---

# 💡 FEATURE REQUESTS

When proposing a feature, describe:

```text
WHAT
What should be added?

WHY
Why would it improve the game?

HOW
How should it work?

WHERE
Which part of the game should contain it?

REFERENCE
Screenshots, examples or inspiration
```

---

# 🎯 THE VISION

Runner Relay combines:

```text
        🏃 FAST MOVEMENT
               +
        🎮 ARCADE GAMEPLAY
               +
        📡 SIGNAL RECOVERY
               +
        🧭 ROUTE CHOICES
               +
        ⚔️ COMBAT
               +
        📈 PROGRESSION
               +
        🌃 THE CITY
```

into one connected experience.

The objective is not simply to run.

The objective is to keep the relay moving.

> **RUN THE CITY. CARRY THE SIGNAL.**

---

# 👤 AUTHOR

Built by **MaidCorbic**.

<p align="center">
  <a href="https://github.com/MaidCorbic">
    <img src="https://img.shields.io/badge/GitHub-MaidCorbic-111827?style=for-the-badge&logo=github&logoColor=white" alt="MaidCorbic GitHub">
  </a>
</p>

---

# 📄 LICENSE

See the repository license for the applicable terms.

---

<p align="center">
  <strong>RUNNER RELAY</strong>
  <br>
  <sub>RUN THE CITY. CARRY THE SIGNAL.</sub>
  <br><br>
  <strong>RUN. JUMP. DASH. FIGHT. CHOOSE. CARRY THE SIGNAL.</strong>
</p>
