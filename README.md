<h1 align="center"> RUNNER RELAY </h1>

<p align="center">
  <strong>Run. Progress. Compete. Repeat.</strong>
</p>

<p align="center">
  Turn every run into progression.
  Earn XP, level up, unlock rewards and build your runner.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-getting-started">Getting Started</a> 
</p>

---

## 🎮 What is Runner Relay?

**Runner Relay** is a running-focused application that combines an interactive running experience with game-style progression.

Instead of treating every run as an isolated activity, Runner Relay turns running into an ongoing player journey.

The core loop is simple:

```text
        🏃 RUN
          │
          ▼
       ⭐ EARN XP
          │
          ▼
      📈 PROGRESS
          │
          ▼
       🆙 LEVEL UP
          │
          ▼
       🏆 REWARDS
          │
          ▼
      🏃 RUN AGAIN
```

> **Don't just track your run. Build your runner.**

---

## 🚀 Live Demo

> Add your deployed application URL here when available.

▶[ Try Runner Relay](https://app-sooty-pi.vercel.app/)

No installation required when using the hosted version.

---

## ✨ Features

### 🏃 Running Experience

Runner Relay is built around the runner and their journey.

The application provides an interactive environment designed to make running feel more engaging than a traditional activity tracker.

### ⭐ XP System

Runs contribute to player progression through an experience point system.

XP can be used as the foundation for:

* Player progression
* Level requirements
* Rewards
* Challenges
* Achievements
* Competitive systems

### 📈 Player Levels

Players have a persistent level that represents their progression.

```text
XP
 │
 ├──► Level 1
 │
 ├──► Level 2
 │
 ├──► Level 3
 │
 ├──► Level 4
 │
 └──► Higher Levels
```

The goal is to make every session contribute toward a larger progression journey.

### 💾 Persistent Progression

Backend functionality is powered by **Supabase**, allowing player-related data and progression to be persisted.

This provides a foundation for future systems such as:

* Player profiles
* Statistics
* Achievements
* Leaderboards
* Challenges
* Rewards

### 🎮 Game Architecture

The core application is organized around a dedicated `game/` directory.

This makes it easier to expand the project with additional gameplay and progression systems as development continues.

---

## 🎥 See It In Action

Add a short gameplay GIF or video here once available.

```md
<p align="center">
  <img src="docs/demo.gif" width="800">
</p>
```

A short recording showing the following flow would work especially well:

```text
Intro
  ↓
Tutorial
  ↓
Game
  ↓
Run
  ↓
XP
  ↓
Level Progression
```

---

## 📸 Screenshots

### 🏠 Introduction

<p align="center">
  <img src="docs/screenshots/intro.jpg" width="700">
</p>

### 📖 Tutorial

<p align="center">
  <img src="docs/screenshots/tutorial.jpg" width="700">
</p>

### 🎮 Game

<p align="center">
  <img src="docs/screenshots/game.jpg" width="700">
</p>

---

## 🧠 Progression System

The central idea behind Runner Relay is to make each run meaningful beyond the individual session.

```text
┌─────────────┐
│   🏃 RUN    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ⭐ XP      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  📈 LEVEL   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  🏆 REWARD  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  🏃 RUN     │
│   AGAIN     │
└─────────────┘
```

This system is designed to support future mechanics such as:

* Experience milestones
* Achievements
* Daily challenges
* Weekly challenges
* Unlockable rewards
* Competitive progression
* Runner customization

---

## 🧩 Architecture

The project separates the application experience from backend persistence.

```text
┌─────────────────────────────┐
│       Runner Relay         │
│          Frontend           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        Game Systems         │
│                             │
│  • Running                  │
│  • XP                       │
│  • Levels                   │
│  • Progression              │
│  • Future gameplay systems  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          Supabase           │
│                             │
│  • Player data              │
│  • Progression              │
│  • Persistent storage       │
└─────────────────────────────┘
```

The architecture is intentionally designed to leave room for additional gameplay systems without having to rebuild the entire application.

---

## 🛠️ Tech Stack

| Technology        | Purpose                           |
| ----------------- | --------------------------------- |
| 🟧 **HTML5**      | Application structure             |
| 🟦 **CSS3**       | Styling and UI                    |
| 🟨 **JavaScript** | Core application and game logic   |
| 🔷 **TypeScript** | Typed application logic           |
| 🟩 **Supabase**   | Backend, database and persistence |
| 🐳 **Docker**     | Containerization and deployment   |
| 📦 **npm**        | Package management                |
| 🐙 **GitHub**     | Source control and collaboration  |

---

## 📁 Project Structure

```text
app/
│
├── game/
│   └── Core Runner Relay application
│
├── supabase/
│   └── Backend and database functionality
│
├── docs/
│   └── Screenshots and documentation assets
│
├── diploi.yaml
│   └── Deployment configuration
│
├── package.json
│   └── Project scripts and dependencies
│
├── package-lock.json
│   └── Dependency lock file
│
├── .gitignore
│   └── Ignored files and environment configuration
│
└── README.md
    └── Project documentation
```

> The structure may evolve as new systems are introduced.

---

# 🚀 Getting Started

## Requirements

Before running Runner Relay locally, make sure you have:

* [Node.js](https://nodejs.org/)
* npm
* Git
* Docker, if using the containerized environment
* A Supabase project, when backend configuration is required

---

## 📥 Clone the Repository

```bash
git clone https://github.com/MaidCorbic/app.git
cd app
```

---

## 📦 Install Dependencies

```bash
npm install
```

---

## ▶️ Start Development

If the project uses a Vite development server:

```bash
npm run dev
```

Otherwise, use the start script defined in `package.json`:

```bash
npm start
```

The exact available scripts can be found in `package.json`.

---

## 🏗️ Production Build

If a production build script is configured:

```bash
npm run build
```

You can then preview or serve the generated application according to the project's deployment configuration.

---

# 🐳 Docker

Runner Relay can also be prepared for containerized deployment.

### Build the image

```bash
docker build -t Runner-relay .
```

### Run the container

```bash
docker run -p 3000:3000 Runner-relay
```

The exact port may vary depending on the application's Docker configuration.

---

# 🔐 Environment Variables

Never commit private credentials or secrets to GitHub.

Create a local environment file when required:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use the exact environment variable names expected by the application.

### Security

* Never commit `.env` files containing secrets.
* Never expose Supabase service-role credentials in client-side code.
* Use appropriate Supabase Row Level Security policies.
* Keep production secrets outside the repository.

---

# 🗺️ Roadmap

Runner Relay is actively evolving.

## ✅ Completed

* [x] Core application
* [x] Game structure
* [x] Running experience
* [x] XP progression foundation
* [x] Player level system
* [x] Supabase integration
* [x] Persistent progression foundation
* [x] Deployment configuration
* [x] Improved UX / UI Home Screen


## 🚧 In Progress

* [ ] Player profiles
* [ ] Achievements
* [ ] Daily challenges
* [ ] Advanced statistics


## 🔮 Planned

* [ ] Weekly challenges
* [ ] Leaderboards
* [ ] Rewards
* [ ] Runner customization
* [ ] Competitive features
* [ ] Social features
* [ ] Additional gameplay mechanics
* [ ] Expanded progression systems

---

# 🧪 Development Status

🚧 **Runner Relay is currently under active development.**

The project is continuously evolving, and gameplay systems, UI, backend functionality and progression mechanics may change as development continues.

Some features described in the roadmap are planned rather than currently implemented.

---

# 🤝 Contributing

Contributions, ideas and feedback are welcome.

If you want to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes locally.
5. Commit your changes.
6. Open a pull request.

For bugs and feature requests, please open an issue and provide as much useful context as possible.

---

# 🐛 Bug Reports

When reporting a bug, include the following information:

```text
### Description

What happened?

### Steps to reproduce

1. Open the application
2. ...
3. ...

### Expected behavior

What should have happened?

### Actual behavior

What happened instead?

### Environment

Browser:
OS:
Device:
Node.js version:
```

Screenshots, console errors and reproduction steps are especially helpful.

---

# 💡 Feature Requests

Have an idea for Runner Relay?

Open an issue and describe:

* What you would like to add
* Why it would improve the application
* How you imagine the feature working
* Screenshots or examples, if relevant

Ideas related to running, progression, competition and game mechanics are especially welcome.

---

# 🎯 Vision

The long-term vision for Runner Relay is to combine:

```text
🏃 Running
   +
🎮 Game Mechanics
   +
📈 Progression
   +
🏆 Competition
   +
🤝 Social Features
```

into one experience.

The goal isn't simply to track a run.

The goal is to create a system where every run contributes to something bigger.

> **Run. Progress. Compete. Repeat.**

---

# 👨‍💻 Author

Built by **MaidCorbic**.

<p align="center">
  <a href="https://github.com/MaidCorbic">
    <img src="https://img.shields.io/badge/GitHub-MaidCorbic-181717?style=for-the-badge&logo=github&logoColor=white">
  </a>
</p>

---

# 📄 License

Add your project's license here.

For example, if the project is released under MIT:

```text
MIT License
```

See the `LICENSE` file for the full license text.

---

<p align="center">
  <strong>🏃 Runner Relay</strong>
  <br>
  Run. Progress. Compete. Repeat.
</p>
