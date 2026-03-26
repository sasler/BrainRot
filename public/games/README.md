# Games Directory

This directory contains all game implementations for BrainRot Games. Each game version is a **standalone `index.html`** file that runs inside a sandboxed iframe, fully isolated from the main website.

## Structure

```
games/
├── TEMPLATE/              ← Starter template for new games
│   └── index.html
├── snake/                 ← 🐍 Snake
│   ├── sonnet-4-6/        Claude Sonnet 4.6  (709 lines)
│   ├── gpt-5-4/           GPT 5.4            (1,303 lines)
│   └── gpt-5-4-mini/      GPT 5.4 Mini       (974 lines)
├── minesweeper/           ← 💣 Minesweeper
│   ├── sonnet-4-6/        Claude Sonnet 4.6  (646 lines)
│   ├── gpt-5-4/           GPT 5.4            (1,413 lines)
│   └── gpt-5-4-mini/      GPT 5.4 Mini       (921 lines)
├── tetris/                ← 🧱 Tetris
│   ├── sonnet-4-6/        Claude Sonnet 4.6  (746 lines)
│   ├── gpt-5-4/           GPT 5.4            (1,638 lines)
│   └── gpt-5-4-mini/      GPT 5.4 Mini       (974 lines)
└── reversi/               ← ⚫ Reversi
    ├── sonnet-4-6/        Claude Sonnet 4.6  (919 lines)
    ├── gpt-5-4/           GPT 5.4            (1,091 lines)
    └── gpt-5-4-mini/      GPT 5.4 Mini       (1,143 lines)
```

## Rules for Adding Games

1. **Single file only** — entire game in one `index.html` (HTML + CSS + JS inline)
2. **No external dependencies** — no CDNs, imports, or external files
3. **Dark theme** — background must be dark, use neon accents
4. **Responsive** — must work at any viewport size
5. **Sandboxed** — runs with `sandbox="allow-scripts"`, no parent DOM access

See [`GAME_DEVELOPMENT_GUIDE.md`](../../GAME_DEVELOPMENT_GUIDE.md) in the project root for full specifications and the template.
