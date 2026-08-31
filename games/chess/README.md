# Fianchetto — Chess

A browser chess game with two modes, chosen from the toggle at the top:

- **vs CPU** — you play White against an AI opponent tuned to roughly 800 Elo.
- **vs Human** — two players, same device, alternating turns.

## Running it

Just double-click `index.html`. That's it — no server, no install, no build
step, and no internet connection required.

This works because everything is loaded as plain classic `<script>` tags
(including a locally-vendored copy of the chess.js rules engine in
`js/vendor/`), rather than ES modules. Browsers block ES modules from loading
over a `file://` URL, which is what made earlier versions of this project
require a local server — that requirement is gone now.

## File structure

```
chess-game/
├── index.html        — markup only
├── style.css         — all styling
└── js/
    ├── vendor/
    │   └── chess.js   — vendored chess.js rules engine (BSD-2-Clause,
    │                     jhlywa/chess.js), converted to a classic script
    ├── constants.js   — every tunable number (piece values, AI weights, etc.)
    ├── game.js        — chess.js wrapper: the only file that touches the engine directly
    ├── ai.js          — the CPU opponent (search + difficulty calibration)
    ├── ui.js          — all DOM rendering
    └── main.js        — entry point, wires DOM events to game.js/ai.js/ui.js
```

Each file (other than the vendored engine) attaches its public functions to
`window.App.<name>` — e.g. `window.App.game`, `window.App.ai` — instead of
using `import`/`export`. `index.html` loads them in dependency order:
`vendor/chess.js` → `constants.js` → `game.js` → `ai.js` → `ui.js` → `main.js`.

## How the ~800 Elo calibration works

A shallow minimax search on its own is *not* enough to hit a low Elo target —
even a 1-2 ply search with a decent evaluation function will reliably spot
hanging pieces and simple tactics, which alone plays well above 800 Elo. Real
players around that level miss tactics and misjudge moves regularly, so the
AI's search results are deliberately passed through a second, weighted step
that decides how faithfully it actually follows its own analysis
(`chooseWeightedMove` in `js/ai.js`):

| Outcome | Chance | What happens |
|---|---|---|
| Best move | 25% | Plays the move the search actually ranked highest. |
| Near-best move | 40% | Plays a random pick from its top 5 candidate moves. |
| Random legal move | 20% | Plays any legal move at random — a genuine blunder. |
| Ignores a free capture | 15% | If a safe, undefended capture is available, it deliberately looks past it and plays something else. |

All of these percentages, along with the search depth (`AI_SEARCH_DEPTH`) and
the "near-best" pool size (`AI_TOP_N_CANDIDATES`), live at the top of
`js/constants.js`. If the AI feels too strong, raise the RANDOM and
IGNORE_HANGING weights (and lower BEST); if it feels too weak, do the
opposite. The artificial thinking delay (`AI_THINK_DELAY_MIN_MS` /
`AI_THINK_DELAY_MAX_MS`) is purely cosmetic and doesn't affect strength.

## A note on the vendored chess engine

`js/vendor/chess.js` is chess.js v0.13.4 (BSD-2-Clause, © Jeff Hlywa),
copied in unmodified except for the wrapper: its ES-module `export` syntax
is replaced with a plain `window.Chess = Chess` assignment inside an IIFE,
so it works as a classic script. This was necessary because chess.js's own
CDN builds (jsDelivr, unpkg, cdnjs) are all ES-module-only as of v1.x — there
is currently no official global/UMD browser build to link to directly.
