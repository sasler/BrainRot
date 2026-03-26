# 🧠 BrainRot Games

A web platform where different AI models compete by implementing classic web games. Play each version, compare them side-by-side, and judge which AI builds the best games.

**Live at:** Self-hosted (Next.js)  
**Repo:** [github.com/sasler/BrainRot](https://github.com/sasler/BrainRot)

## 🎮 Games

| Game | Description | Versions |
|------|-------------|----------|
| 🐍 Snake | Navigate the serpent, consume pixels, grow infinitely | 3 |
| 💣 Minesweeper | Logic meets danger — uncover safe tiles, avoid mines | 3 |
| 🧱 Tetris | Falling blocks, rising pressure — stack them right | 3 |
| ⚫ Reversi | Strategic placement — flip the board in your favor | 3 |

## 🤖 Competing AI Models

| Model | Snake | Minesweeper | Tetris | Reversi |
|-------|-------|-------------|--------|---------|
| Claude Sonnet 4.6 | 709 lines | 646 lines | 746 lines | 919 lines |
| GPT 5.4 | 1,303 lines | 1,413 lines | 1,638 lines | 1,091 lines |
| GPT 5.4 Mini | 974 lines | 921 lines | 974 lines | 1,143 lines |

Each game is a standalone HTML file (HTML + CSS + JS inline) running in a sandboxed iframe — fully isolated from the main site.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev -- --webpack

# Production build
npm run build

# Start production server
npm start

# Run smoke tests
npx playwright test
```

## 🏗️ Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS 4
- **Fonts:** Geist Sans & Mono (local)
- **Games:** Standalone HTML/JS in sandboxed iframes
- **Testing:** Playwright
- **Theme:** Dark with neon accents

## 📁 Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing page (game catalog)
│   ├── games/[game]/           # Game detail page
│   └── games/[game]/[model]/   # Play page (iframe)
├── components/                 # UI components
└── lib/                        # Game registry & types
public/
└── games/                      # Sandboxed game files
    ├── TEMPLATE/               # Starter template
    ├── snake/{model}/          # Snake implementations
    ├── minesweeper/{model}/    # Minesweeper implementations
    ├── tetris/{model}/         # Tetris implementations
    └── reversi/{model}/        # Reversi implementations
games-metadata.json             # Game & version registry
GAME_DEVELOPMENT_GUIDE.md       # Guide for AI models
```

## 🎯 Adding New Games or AI Versions

See [`GAME_DEVELOPMENT_GUIDE.md`](GAME_DEVELOPMENT_GUIDE.md) for the full specification. In short:

1. Create a single `index.html` at `public/games/{game}/{model}/index.html`
2. All HTML, CSS, and JS must be inline (no external deps)
3. Must use a dark theme with neon accents
4. Must be responsive and work in a sandboxed iframe
5. Register the version in `games-metadata.json`

## 📜 License

MIT
