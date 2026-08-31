# The Arcade

A tiny browser arcade: **Tic-Tac-Toe**, **Othello**, **Pong** and **Chess**, behind
one black-and-neon-green cabinet-select page.

Three of the four started life as Java Swing programs. Browsers can't run Swing, so
each was rewritten in JavaScript — same rules, same AI, same bounce angles. The
`.java` files ride along in [`java-source/`](java-source/) so you can put them side
by side.

---

### Running it locally

Just open `index.html` in a browser. No server, no build step, no npm — the whole
thing is plain HTML, CSS and classic `<script>` tags. Every internal link points at
an explicit `index.html` rather than a bare folder, so PLAY works off the filesystem
too, not only over `http://`.

---

## What's in here

```
.
├── index.html              the cabinet-select page
├── css/
│   ├── arcade.css          shared theme: palette, buttons, cabinet chrome, modals
│   └── home.css            landing page only
├── js/
│   ├── invaders-bg.js      the drifting wall of pixel invaders (canvas)
│   └── center-game.js      scrolls the board into the middle of the window on load
├── assets/
│   ├── arcade-cabinet.png  the cabinet photo (kept, no longer shown)
│   └── favicon.svg         a pixel invader
├── source/                 generated code-reader pages, one per game
├── tools/
│   ├── build-source-pages.py   regenerates /source and java-source/index.html
│   └── strip-java-comments.py  the one-time comment strip (see below)
├── games/
│   ├── tictactoe/
│   ├── othello/
│   ├── pong/
│   └── chess/              logic untouched; style.css reskinned to match
└── java-source/            the Swing programs the ports came from
                        (index.html is generated; comments have been stripped)
```

## Reading the code on the site

Each game card has a **SEE SOURCE** button leading to `source/<game>.html` — a
reader with the JavaScript, the HTML and CSS, and (for the three ports) the Java
it came from, syntax-highlighted with line numbers.

`java-source/index.html` is the same reader with the Java originals on their own,
grouped by game — it used to be a plain list of links that handed you the raw
`.java` file, unstyled and unnumbered.

Those pages embed the code rather than fetching it, so they work off the filesystem
as well as over http. That makes them a snapshot: **after editing a game, re-run**

```bash
python3 tools/build-source-pages.py
```

from the repo root to refresh them. It writes the five pages under `/source` plus
`java-source/index.html`. Nothing else in the project has a build step — this is
the one optional script, and only those reader pages depend on it.

The reader's syntax highlighting is a small hand-written scanner in that script
(comments, strings, keywords, numbers) rather than a highlighting library, so the
pages stay dependency-free. It's verified by comparing the rendered text back
against the file on disk.

## How the port maps

| Java | JavaScript |
|---|---|
| `T3Model.java` | `games/tictactoe/js/t3-model.js` |
| `ButtonGUI.java` | `games/tictactoe/js/button-ui.js` |
| `PaintGUI.java` | `games/tictactoe/js/paint-ui.js` |
| `ConsoleUI.java` | `games/tictactoe/js/console-ui.js` |
| `T3Launcher.java` | `games/tictactoe/js/main.js` |
| `OthelloModel.java` | `games/othello/js/othello-model.js` |
| `OthelloComputerAndAI.java` | `games/othello/js/othello-ai.js` |
| `OthelloGUI.java` | `games/othello/js/main.js` |
| `GameConstants.java` | `games/pong/js/game-constants.js` |
| `PongModel.java` | `games/pong/js/pong-model.js` |
| `PongPanel.java` | `games/pong/js/pong-panel.js` |
| `PongLauncher.java` | `games/pong/js/main.js` |
| `JOptionPane` dialogs | the shared `.arcade-modal` in `css/arcade.css` |
| `javax.swing.Timer` | `setInterval` at the same 16ms tick |
| `addMouseWheelListener` | a `wheel` event listener on the canvas |

## Things that changed on the way across

Everything else is a straight translation. These three are the exceptions, all
flagged with comments in the code:

1. **Tic-Tac-Toe — a win on the ninth move was scored as a tie.**
   `T3Model.checkForWin()` only returned early when *X* won. When the winning move
   was also the move that filled the board, execution fell through to the
   `boardIsFull()` check at the bottom, which overwrote the win with `Tie_Game`.
   In the port every win returns immediately and the tie check only fires while
   the game is still undecided. See the comment in `t3-model.js`.

2. **Pong — the centre net was drawn off-screen.**
   `PongPanel` computed `centerX = DASH_WIDTH / 2` (which is 1) and then filled at
   `centerX - DASH_WIDTH`, i.e. x = −1. The net never appeared. It's drawn at the
   real centre now. Nothing about gameplay changed.

3. **Both grid boards resized themselves mid-game.**
   `repeat(8, 1fr)` is shorthand for `repeat(8, minmax(auto, 1fr))`, and that
   `auto` minimum lets a track grow to fit its contents — so any row or column
   holding a piece came out larger than an empty one, and the squares changed
   size as pieces appeared. Othello had it worse: it declared no
   `grid-template-rows` at all, so its eight rows were implicit `auto` tracks
   sized entirely by content, which is why its cells weren't square. Both boards
   now use explicit `minmax(0, 1fr)` tracks in both directions, and the cells
   carry `min-width: 0; min-height: 0` so their contents can never push them
   around. Chess also scales its piece glyphs off the board itself with
   container-query units rather than off the viewport, so a piece is always the
   same fraction of its square.

4. **Othello — `copyBoard()` got cheaper.**
   The Java version built a `new OthelloModel()` — resetting all 64 squares — just
   to overwrite them a line later. Minimax calls it tens of thousands of times, so
   the port clones off the prototype instead. Same resulting object, none of the
   setup cost. Deep searches would otherwise lock the page up.

## Two edits to the Java files themselves

Separate from the port. Both are in `java-source/`, and neither changes what the
code does:

- **Comments removed.** They were coursework comments written for a marker, which
  read oddly on a portfolio site. `tools/strip-java-comments.py` did it in one pass
  and is kept in the repo so the edit is on the record. It understands string and
  character literals, so a `//` inside quotes survives. Verified by compiling every
  file before and after and diffing the disassembled bytecode: 21 classes, zero
  differences. (It also normalised the files from CRLF to LF line endings.)
- **One extraneous semicolon.** `PaintGUI.java` opened with `import java.awt.*;;`.
  Modern `javac` treats that as an error, not a warning, so Tic-Tac-Toe would not
  compile at all on JDK 21 until the second semicolon went.

## Notes on the games

**Tic-Tac-Toe** ships all three of the original front ends, and you can switch
between them mid-game because the model outlives the view — the same point
`IT3Model` was making. In console mode, type a column letter then a row number,
like `B2`.

**Othello** — you're black and you move first. `GREEDY CPU` grabs the biggest flip
available each turn, which is exactly the trap Othello sets for beginners.
`MINIMAX AI` searches ahead to the chosen depth. Depth 5–6 is slow: it's the same
exhaustive search the Java version ran, and it thinks with the page held still.

**Pong** — mouse wheel over the board moves your paddle, matching the Swing
version's `addMouseWheelListener`. There's no keyboard or touch control, so it
needs a mouse or a trackpad. The playfield stays at the full 700x500 the Java
window used; on a short screen `center-game.js` scrolls it into the middle
rather than shrinking it.

**Every game page positions itself on arrival.** `js/center-game.js` runs on load:
if the cabinet fits the window it centres it, and if it doesn't it pins the top
just inside the viewport instead — because the top is where the controls live, and
centring a too-tall cabinet hides them. It runs again once webfonts have settled,
but backs off if you've already scrolled.

**Board sizes respond to window width only, never height.** Tic-Tac-Toe is 450px,
Othello and Chess 520px, and they stay that size on every screen; you scroll rather
than watch the board shrink. Pong is the one exception — it caps against height
too, so its full cabinet border stays in frame.

**Chess** (*Fianchetto*) was reskinned into the arcade theme. Not a line of its
JavaScript changed — `ui.js` still writes the same class names (`square light`,
`is-selected`, `piece-black` and so on), they just look different now, so the
whole restyle lives in `games/chess/style.css`. The board keeps two-tone squares,
because chess is unreadable without them: dark forest green and near-black. The
contrast moved into the pieces instead — white plays as bone-white, black plays as
a pink-outlined silhouette. Selected squares glow amber, the last move glows cyan,
check glows red. The move ledger is a fixed six-row box that scrolls, so it never
grows and shoves the captured-piece trays down the page. Its own README is still in
[`games/chess/`](games/chess/).

It also sits in the same cabinet frame as the other three now — shell bar, mode
row, bordered screen with the board on the left and the trays and move ledger on
the right, note underneath. That's markup and CSS only: `index.html` gained the
wrapper elements and `style.css` loads `../../css/arcade.css` ahead of itself for
the shared chrome, taking care to restate anything both sheets define.

If you ever want the original midnight-and-copper look back, `git checkout` the old
`games/chess/style.css` — nothing else depends on it.

## Credits

Chess uses a vendored copy of [chess.js](https://github.com/jhlywa/chess.js)
v0.13.4 (BSD-2-Clause, © Jeff Hlywa) for rules and move generation — see
`games/chess/js/vendor/`.

Type is [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) and
[IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono), both loaded from
Google Fonts. If you'd rather not depend on that, download the two `.woff2` files
into `assets/` and swap the `<link>` tags for a local `@font-face` block.
