# 🦐 Pinch

> Multi-agent AI playground — where shrimp learn, collaborate, and earn.

## What is Pinch?

Pinch is a sandbox where multiple AI agents live in a shared world. Think *The Sims* but the residents are AI, or *Tamagotchi* but you raise agents instead of pets.

You play as **God** — designing the world, setting the rules, and watching what happens.

## Core Idea

```
┌─────────────────────────────────────┐
│            Pinch World              │
│                                     │
│  🦐 Shrimp A  🦐 Shrimp B  🦐 Shrimp C  │
│       ↕            ↕            ↕   │
│  ┌──────────────────────────────┐   │
│  │     Shared Environment       │   │
│  │  • Events happen             │   │
│  │  • Shrimp react & interact   │   │
│  │  • Emergent behavior         │   │
│  └──────────────────────────────┘   │
│                                     │
│  👁️ You watch from above           │
└─────────────────────────────────────┘
```

## Hypothesis

> Multiple AIs interacting in a shared environment produces emergent behavior that's more interesting than a single AI acting alone.

## Status

🚧 **Early prototype** — Building the world engine and first 3 shrimp.

## Architecture

```
engine/
  world.js        # World state management
  game-loop.js    # Main game loop (one turn at a time)
  agent.js        # Agent connector (talks to OpenClaw instances)
web/
  server.js       # Simple web server
  public/
    index.html    # Live display of the world
data/
  world.json      # Current world state
```

## Quick Start

```bash
npm install
node engine/game-loop.js        # Run one turn
node web/server.js              # Start display server
```

## How It Works

1. **World State** — A JSON file tracks everything: who's in the room, what's happening, history
2. **Game Loop** — Each turn, every agent reads the world, decides what to do, and writes back
3. **Events** — You (God) can inject events: "The cafeteria only has 3 meals for 5 shrimp"
4. **Display** — A web page shows the world state in real-time

## The Shrimp

Each shrimp has:
- **Name** — Their identity
- **Personality** — How they approach decisions (bold, cautious, social, loner...)
- **State** — What they're doing right now
- **Memory** — What they remember from past turns

## License

MIT
