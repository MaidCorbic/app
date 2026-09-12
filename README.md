
<h1 align="center">RUNNER RELAY</h1>

<p align="center">
  <strong>RUN THE CITY. CARRY THE SIGNAL.</strong>
</p>

<p align="center">
  A rooftop running game built around movement, missions, combat, signals, XP and progression.
</p>

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
  <img src="https://img.shields.io/badge/Phaser-3.90-6A1B9A?style=flat-square" alt="Phaser 3.90">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8">
  <img src="https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 24">
</p>

---

## 🎮 PLAY RUNNER RELAY

<p align="center">
  <a href="https://app-sooty-pi.vercel.app/">
    <strong>▶ PLAY THE LIVE BUILD</strong>
  </a>
</p>

Runner Relay is a game-first rooftop running experience built around fast movement, missions, combat, signal recovery and long-term player progression.

> **RUN THE CITY. CARRY THE SIGNAL.**

The project is actively developed with a focus on gameplay stability, responsive controls, mission flow and production-ready UI.

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
              │   SURVIVE     │
              │   / COMBAT    │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ RECOVER SIGNAL│
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
              │    PROGRESS   │
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │    RUN AGAIN  │
              └───────────────┘
````

---

# ✨ FEATURES

## 🏃 ROOFTOP MOVEMENT

Runner Relay is built around continuous movement through a rooftop environment.

Core gameplay includes:

* Running
* Jumping
* Dash movement
* Slide / momentum movement
* Wall interaction
* Combat movement
* Environmental interaction
* Mobile touch controls
* Keyboard controls

The project uses Phaser 3.90 as the game engine and keeps the main gameplay scene as the primary gameplay authority.

---

## 🎯 MISSION SYSTEM

Each run is driven by a mission with an objective and a progression state.

```text
MISSION
   │
   ├── OBJECTIVE
   │
   ├── SIGNALS
   │
   ├── ENCOUNTERS
   │
   ├── CHECKPOINTS
   │
   ├── COMPLETION
   │
   └── RESULTS
```

Missions are represented through the game's runtime systems and support different gameplay situations, objectives and route decisions.

---

## 📡 SIGNAL RECOVERY

Signals are part of the core Runner Relay identity.

Players move through the environment, recover required signals and advance the current mission.

```text
SEARCH
  ↓
LOCATE
  ↓
RECOVER
  ↓
CONFIRM
  ↓
ADVANCE
```

Signal gameplay is integrated with mission progression rather than being a separate menu-only feature.

---

## ⚔️ COMBAT & THREATS

Runner Relay includes hostile encounters and enemy-specific behavior.

Enemy systems support multiple threat types, including:

```text
SCOUT RUNNER
EGG HAZARD
DINOSAUR
INVADER
GROUND ALIEN
SENTINEL
STORM BOSS
APEX BOSS
```

Enemy encounters are supported by dedicated gameplay systems for combat, discovery, encounters and enemy intelligence.

---

## ⭐ XP & PROGRESSION

Runs contribute to persistent player progression.

```text
RUN
 ↓
MISSION RESULT
 ↓
XP
 ↓
LEVEL
 ↓
UNLOCKS
 ↓
NEXT RUN
```

Progression and persistent state are handled through dedicated progression and state systems.

---

## 🏆 MISSION RESULTS

Mission completion is followed by a dedicated result flow.

Example presentation:

```text
┌────────────────────────────┐
│      MISSION COMPLETE      │
├────────────────────────────┤
│ SIGNALS      04 / 04       │
│ RATING       S              │
│ SCORE        12850          │
│ TIME         02:41          │
│ XP           +120           │
└────────────────────────────┘
```

The values above are presentation examples. Actual mission results are determined at runtime.

---

# 🎮 CONTROLS

## DESKTOP

```text
┌─────────────────────────────┐
│ A / D       MOVE            │
│ SPACE       JUMP            │
│ E           FIRE            │
│ Q           SWORD           │
│ SHIFT       DASH            │
└─────────────────────────────┘
```

Additional gameplay systems may introduce contextual or mission-specific interactions.

---

## 📱 MOBILE

Runner Relay includes touch-oriented gameplay support.

```text
┌─────────────────────────────┐
│       VIRTUAL JOYSTICK      │
│                             │
│   JUMP     FIRE     DASH    │
│                             │
│   SWORD    ACTION    GEAR   │
└─────────────────────────────┘
```

Mobile input is implemented with dedicated input ownership to avoid duplicate touch dispatchers and conflicting controls.

---

# 🖥️ UI / GAMEPLAY HUD

The project contains a complete gameplay presentation layer covering:

```text
HUD
│
├── Mission information
├── Progress / status
├── Pause
├── Settings
├── Finish / results
├── Mobile controls
└── Gameplay feedback
```

The repository's release-hardening structure defines the canonical UI layer as the shared authority for HUD, Home, Pause, Settings, overlays and touch layout.

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

Recommended gameplay flow:

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
COMBAT / ENCOUNTERS
  ↓
SIGNAL RECOVERY
  ↓
MISSION COMPLETE
  ↓
RESULTS
  ↓
XP / PROGRESSION
```

---

# 🧩 GAMEPLAY SYSTEMS

Runner Relay is implemented as a modular set of gameplay systems around the main Phaser gameplay scene.

Major system areas include:

```text
GAMEPLAY
│
├── Movement
├── Jump / Dash / Slide
├── Combat
├── Enemy encounters
├── Enemy intelligence
├── Missions
├── Signals
├── Route choices
├── Environmental mechanics
├── Mobile input
├── UI / HUD
├── Pause / Settings
├── Death / Respawn
└── Mission completion
```

The repository also contains dedicated systems for advanced gameplay layers, mission route decisions, enemy discovery, faction interactions, environmental events and other gameplay features.

---

# 🧠 PROGRESSION FLOW

```text
┌───────────────┐
│      RUN      │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   OBJECTIVE   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ SIGNAL / GOAL │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   COMPLETION  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│      XP       │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   PERSISTENT  │
│     STATE     │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   NEXT RUN    │
└───────────────┘
```

---

# 🏗️ ARCHITECTURE

```text
RUNNER RELAY
│
├── game/
│   │
│   ├── src/
│   │   ├── scenes/
│   │   ├── systems/
│   │   └── combat/
│   │
│   ├── assets/
│   ├── tests/
│   ├── *.js
│   ├── *.css
│   ├── package.json
│   └── vite.config.mjs
│
├── supabase/
│   ├── functions/
│   ├── migrations/
│   ├── seed.sql
│   └── Dockerfiles
│
├── docs/
│   ├── screenshots/
│   └── demo.gif
│
├── Dockerfile
├── diploi.yaml
└── README.md
```

---

# 🛠️ TECH STACK

| Technology   | Purpose                                        |
| ------------ | ---------------------------------------------- |
| HTML5        | Application structure                          |
| CSS3         | UI and visual presentation                     |
| JavaScript   | Gameplay and application logic                 |
| Phaser 3.90  | 2D game engine                                 |
| Vite 8       | Development and production build               |
| Node.js 24.x | Runtime and build environment                  |
| Supabase     | Backend component / persistence infrastructure |
| npm          | Package management                             |
| Docker       | Containerized workflow                         |
| GitHub       | Source control                                 |
| Vercel       | Deployment and previews                        |

---

# 🚀 GETTING STARTED

## REQUIREMENTS

Install:

```text
Node.js 24.x
npm
Git
```

Docker is optional.

---

## 📥 CLONE

```bash
git clone https://github.com/MaidCorbic/app.git
cd app/game
```

---

## 📦 INSTALL

```bash
npm install
```

---

## ▶️ DEVELOPMENT

```bash
npm run dev
```

The development server runs on port `3000`.

---

## 🏗️ PRODUCTION BUILD

```bash
npm run build
```

---

## 🌐 PREVIEW

```bash
npm start
```

This builds the application and starts the Vite preview server.

---

# 🧪 TESTING

Runner Relay includes an extensive automated test suite covering gameplay, progression, UI contracts, mobile input, route systems and release stability.

## CORE CHECKS

```bash
npm run test:start-flow
npm run test:missions
npm run test:progression
npm run test:gameplay-smoke
npm run test:final-stability
```

## ADDITIONAL CHECKS

```bash
npm run test:build-system
npm run test:enemy-intel
npm run test:signal-network
npm run test:cargo-integrity
npm run test:city-response
npm run test:mobile-action-layout
npm run test:mobile-input-single-owner
npm run test:settings-state
npm run test:gameplay-touch-lock
npm run test:death-retry-state-reset
npm run test:respawn-shield-single-owner
npm run test:runtime-authority
npm run test:canonical-css
npm run test:runner-runtime-stability
npm run test:gameplay-variety-safe-layer
npm run test:gameplay-route-choice-v2
npm run test:route-choice-branching-v1
```

## RELEASE HARDENING

```bash
npm run test:release-hardening
```

The release-hardening script combines multiple gameplay, runtime, route, stability and build checks.

---

# 🔐 ENVIRONMENT

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

Never expose Supabase service-role credentials in client-side code.

---

# 🐳 DOCKER

## BUILD

```bash
docker build -t runner-relay .
```

## RUN

```bash
docker run -p 3000:3000 runner-relay
```

The repository also contains a separate Supabase deployment component.

---

# 🌐 DEPLOYMENT

Runner Relay uses a deployment workflow built around:

```text
GitHub
   ↓
Vercel
   ↓
Production / Preview Builds
```

The repository also contains a Diploi configuration for:

```text
Node.js
Supabase
```

---

# 🗺️ ROADMAP

## ✅ CURRENT / IMPLEMENTED

```text
[x] Core Runner Relay experience
[x] Rooftop gameplay
[x] Mission system
[x] Mission flow
[x] XP progression
[x] Level progression
[x] Enemy systems
[x] Combat systems
[x] Signal gameplay
[x] Mission results
[x] Pause / gameplay UI
[x] Settings
[x] Mobile controls
[x] Responsive UI
[x] Production deployment
[x] Release hardening framework
```

## 🚧 IN DEVELOPMENT

```text
[ ] Further mission content
[ ] Additional gameplay variety
[ ] Expanded progression content
[ ] Additional player-facing systems
[ ] Additional polish and QA coverage
```

## 🔮 FUTURE

```text
[ ] Daily challenges
[ ] Weekly challenges
[ ] Leaderboards
[ ] Expanded achievements
[ ] Additional rewards
[ ] Runner customization
[ ] Competitive systems
[ ] Social features
```

---

# 📊 DEVELOPMENT STATUS

> 🚧 **RUNNER RELAY IS IN ACTIVE DEVELOPMENT**

The project is playable and continuously evolving.

Gameplay systems, UI, mission content, balancing and presentation may change as development continues.

---

# 🤝 CONTRIBUTING

Contributions, ideas and feedback are welcome.

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

For bugs and feature requests, provide enough information to reproduce the issue.

---

# 🐛 BUG REPORTS

Use the following format:

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
OS:
Device:
Node.js version:
```

Screenshots, console errors and reproduction steps are especially useful for gameplay and UI issues.

---

# 💡 FEATURE REQUESTS

For new gameplay or UI ideas, describe:

```text
WHAT
What should be added?

WHY
Why would it improve Runner Relay?

HOW
How should the feature work?

REFERENCE
Screenshots / examples / inspiration
```

---

# 🎯 THE VISION

Runner Relay combines:

```text
        🏃 RUNNING
             +
        🎮 GAMEPLAY
             +
        ⚔️ COMBAT
             +
        📡 SIGNALS
             +
        🎯 MISSIONS
             +
        📈 PROGRESSION
             +
        🌃 THE CITY
```

into one continuous experience.

The goal is not simply to run.

The goal is to create a world where **every run moves the relay forward**.

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
</p>

