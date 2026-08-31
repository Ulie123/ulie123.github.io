#!/usr/bin/env python3
"""
build-source-pages.py — regenerate the pages under /source

The source pages embed the code directly in the HTML rather than fetching it at
runtime, so they work when you double-click index.html locally (a fetch() of a
neighbouring file is blocked under file://) as well as on GitHub Pages.

The trade-off is that they're a snapshot: edit a game and re-run this to refresh
them.

    python3 tools/build-source-pages.py

Run it from the repo root. It writes source/index.html and one page per game.
"""

import html
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "source"

# --------------------------------------------------------------------------
# What goes on each page. (path, short note shown under the filename)
# --------------------------------------------------------------------------

GAMES = {
    "tictactoe": {
        "title": "TIC-TAC-TOE",
        "play": "../games/tictactoe/index.html",
        "intro": [
            "One model, three front ends. <code>t3-model.js</code> knows the rules and "
            "nothing about the screen; the three UI files each render that same model a "
            "different way, which is the point <code>IT3Model</code> was making in the "
            "Java version.",
            "The one behaviour change is in <code>checkForWin()</code> — the Java "
            "original scored a win on the ninth move as a tie. The comment there "
            "explains why.",
        ],
        "groups": [
            ("BROWSER — JAVASCRIPT", [
                ("games/tictactoe/js/t3-model.js", "the rules, no drawing"),
                ("games/tictactoe/js/button-ui.js", "3x3 grid of buttons"),
                ("games/tictactoe/js/paint-ui.js", "hand-drawn canvas"),
                ("games/tictactoe/js/console-ui.js", "type B2 to move"),
                ("games/tictactoe/js/main.js", "wires it together"),
            ]),
            ("BROWSER — MARKUP & STYLE", [
                ("games/tictactoe/index.html", "page structure"),
                ("games/tictactoe/style.css", "board styling"),
            ]),
            ("ORIGINAL — JAVA (SWING)", [
                ("java-source/tictactoe/T3Model.java", "→ t3-model.js"),
                ("java-source/tictactoe/IT3Model.java", "the model interface"),
                ("java-source/tictactoe/Player.java", "enum X / O / NONE"),
                ("java-source/tictactoe/ButtonGUI.java", "→ button-ui.js"),
                ("java-source/tictactoe/PaintGUI.java", "→ paint-ui.js"),
                ("java-source/tictactoe/ConsoleUI.java", "→ console-ui.js"),
                ("java-source/tictactoe/T3Launcher.java", "→ main.js"),
            ]),
        ],
    },
    "othello": {
        "title": "OTHELLO",
        "play": "../games/othello/index.html",
        "intro": [
            "<code>othello-model.js</code> holds the board and the flipping rules; "
            "<code>othello-ai.js</code> holds both opponents — a greedy one that takes "
            "the biggest flip available, and a minimax search that assumes you'll answer "
            "with your best reply.",
            "<code>copyBoard()</code> is the one place the port diverges: minimax calls "
            "it tens of thousands of times, so it clones off the prototype instead of "
            "building a fresh board and resetting all 64 squares first.",
        ],
        "groups": [
            ("BROWSER — JAVASCRIPT", [
                ("games/othello/js/othello-model.js", "board + rules"),
                ("games/othello/js/othello-ai.js", "greedy CPU + minimax"),
                ("games/othello/js/main.js", "the GUI"),
            ]),
            ("BROWSER — MARKUP & STYLE", [
                ("games/othello/index.html", "page structure"),
                ("games/othello/style.css", "board styling"),
            ]),
            ("ORIGINAL — JAVA (SWING)", [
                ("java-source/othello/OthelloModel.java", "→ othello-model.js"),
                ("java-source/othello/OthelloComputerAndAI.java", "→ othello-ai.js"),
                ("java-source/othello/OthelloGUI.java", "→ main.js"),
            ]),
        ],
    },
    "pong": {
        "title": "PONG",
        "play": "../games/pong/index.html",
        "intro": [
            "<code>pong-model.js</code> is the physics and the scoring; "
            "<code>pong-panel.js</code> owns the canvas and the 16&nbsp;ms tick, the same "
            "split <code>PongModel</code> and <code>PongPanel</code> had in Java.",
            "Gameplay was ported without changes. The only edit is cosmetic: the centre "
            "net used to be drawn at x&nbsp;=&nbsp;−1, off the left edge of the screen.",
        ],
        "groups": [
            ("BROWSER — JAVASCRIPT", [
                ("games/pong/js/game-constants.js", "every tunable number"),
                ("games/pong/js/pong-model.js", "movement + scoring"),
                ("games/pong/js/pong-panel.js", "canvas + game loop"),
                ("games/pong/js/main.js", "mode select"),
            ]),
            ("BROWSER — MARKUP & STYLE", [
                ("games/pong/index.html", "page structure"),
                ("games/pong/style.css", "playfield styling"),
            ]),
            ("ORIGINAL — JAVA (SWING)", [
                ("java-source/pong/GameConstants.java", "→ game-constants.js"),
                ("java-source/pong/PongModel.java", "→ pong-model.js"),
                ("java-source/pong/PongPanel.java", "→ pong-panel.js"),
                ("java-source/pong/PongLauncher.java", "→ main.js"),
            ]),
        ],
    },
    "chess": {
        "title": "CHESS",
        "play": "../games/chess/index.html",
        "intro": [
            "The odd one out: chess was written for the browser from the start, so "
            "there's no Java beside it. Every file attaches its public functions to "
            "<code>window.App</code> and loads as a classic <code>&lt;script&gt;</code> "
            "— no imports, no bundler, which is why it runs straight off the filesystem.",
            "<code>ai.js</code> is the interesting one. A shallow minimax alone plays "
            "well above 800&nbsp;Elo, so its search results are passed through a second "
            "weighted step that decides how faithfully it actually follows its own "
            "analysis — 20% of the time it throws the search away and plays a random "
            "legal move.",
            "The arcade skin lives entirely in <code>style.css</code>. None of the "
            "JavaScript changed when the look did.",
        ],
        "groups": [
            ("BROWSER — JAVASCRIPT", [
                ("games/chess/js/constants.js", "tunables + AI weights"),
                ("games/chess/js/game.js", "the engine wrapper"),
                ("games/chess/js/ai.js", "search + blunder weighting"),
                ("games/chess/js/ui.js", "all DOM rendering"),
                ("games/chess/js/main.js", "entry point"),
            ]),
            ("BROWSER — MARKUP & STYLE", [
                ("games/chess/index.html", "page structure"),
                ("games/chess/style.css", "the arcade skin"),
            ]),
            ("VENDORED", [
                ("games/chess/js/vendor/chess.js", "chess.js 0.13.4, BSD-2"),
            ]),
            ("NOTES", [
                ("games/chess/README.md", "how the Elo calibration works"),
            ]),
        ],
    },
}

# The Java originals on their own, in the same reader. This one writes over
# java-source/index.html, which used to be a plain list of links — clicking one
# handed you the raw .java file, unstyled, with no line numbers.
JAVA_PAGE = {
    "title": "JAVA SOURCE",
    "heading": "JAVA SOURCE",
    "out": "java-source/index.html",
    "links": [("&#9654; READ THE PORTS", "../source/index.html", "btn-amber")],
    "subtitle": "The Swing programs the ports came from",
    "intro": [
        "These are the programs the browser versions were translated from. The code "
        "is exactly as it was written &mdash; only the comments have been taken out, "
        "which changes nothing about how it runs. Every file here has a JavaScript "
        "counterpart; the note under each filename says which.",
        "They're reference material, not part of the running site. To compile them "
        "the usual way: <code>javac *.java</code>, then "
        "<code>java T3Launcher buttons</code>, <code>java OthelloGUI</code>, or "
        "<code>java PongLauncher solo</code>.",
        "To read a Java file side by side with the JavaScript it became, open that "
        "game on the <a href=\"../source/index.html\">ports page</a> instead "
        "&mdash; both versions are listed there together.",
    ],
    "groups": [
        ("TIC-TAC-TOE", [
            ("java-source/tictactoe/T3Launcher.java", "→ games/tictactoe/js/main.js"),
            ("java-source/tictactoe/IT3Model.java", "the model interface"),
            ("java-source/tictactoe/T3Model.java", "→ js/t3-model.js"),
            ("java-source/tictactoe/Player.java", "enum X / O / NONE"),
            ("java-source/tictactoe/ButtonGUI.java", "→ js/button-ui.js"),
            ("java-source/tictactoe/PaintGUI.java", "→ js/paint-ui.js"),
            ("java-source/tictactoe/ConsoleUI.java", "→ js/console-ui.js"),
        ]),
        ("OTHELLO", [
            ("java-source/othello/OthelloModel.java", "→ js/othello-model.js"),
            ("java-source/othello/OthelloComputerAndAI.java", "→ js/othello-ai.js"),
            ("java-source/othello/OthelloGUI.java", "→ js/main.js"),
        ]),
        ("PONG", [
            ("java-source/pong/GameConstants.java", "→ js/game-constants.js"),
            ("java-source/pong/PongModel.java", "→ js/pong-model.js"),
            ("java-source/pong/PongPanel.java", "→ js/pong-panel.js"),
            ("java-source/pong/PongLauncher.java", "→ js/main.js"),
        ]),
    ],
}

KEYWORDS = set("""
abstract arguments as async await boolean break byte case catch char class const
continue debugger default delete do double else enum export extends false final
finally float for from function get goto if implements import in instanceof int
interface let long native new null package private protected public return set
short static super switch synchronized this throw throws transient true try
typeof var void volatile while with yield
""".split())


def tokenize(src, mode):
    """Split source into (text, css-class) pairs. `mode` is 'clike' or 'plain'."""
    if mode == "plain":
        return [(src, None)]

    tokens, buf = [], []
    i, n = 0, len(src)

    def flush():
        if buf:
            tokens.append(("".join(buf), None))
            del buf[:]

    while i < n:
        c = src[i]

        if c == "/" and i + 1 < n and src[i + 1] == "/":            # line comment
            j = src.find("\n", i)
            j = n if j == -1 else j
            flush(); tokens.append((src[i:j], "c")); i = j

        elif c == "/" and i + 1 < n and src[i + 1] == "*":          # block comment
            j = src.find("*/", i + 2)
            j = n if j == -1 else j + 2
            flush(); tokens.append((src[i:j], "c")); i = j

        elif c in "\"'`":                                           # string
            q, j = c, i + 1
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == q:
                    j += 1
                    break
                if src[j] == "\n" and q != "`":
                    break
                j += 1
            flush(); tokens.append((src[i:min(j, n)], "s")); i = min(j, n)

        elif c.isdigit() and (i == 0 or not (src[i - 1].isalnum() or src[i - 1] == "_")):
            j = i
            while j < n and (src[j].isalnum() or src[j] == "."):
                j += 1
            flush(); tokens.append((src[i:j], "n")); i = j

        elif c.isalpha() or c in "_$":                              # word
            j = i
            while j < n and (src[j].isalnum() or src[j] in "_$"):
                j += 1
            word = src[i:j]
            if word in KEYWORDS:
                flush(); tokens.append((word, "k"))
            else:
                buf.append(word)
            i = j

        else:
            buf.append(c)
            i += 1

    flush()
    return tokens


def render_code(src, mode):
    """Tokenize, then re-split on newlines so each line is its own element."""
    lines = [[]]
    for text, cls in tokenize(src, mode):
        parts = text.split("\n")
        for k, part in enumerate(parts):
            if k:
                lines.append([])
            if part:
                esc = html.escape(part)
                lines[-1].append('<span class="%s">%s</span>' % (cls, esc) if cls else esc)
    if lines and not lines[-1]:
        lines.pop()
    return "".join('<span class="cl">%s\n</span>' % ("".join(l) or " ") for l in lines)


def mode_for(path):
    return "plain" if path.suffix in (".html", ".md") else "clike"


HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title} SOURCE — The Arcade</title>
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../css/arcade.css" />
<link rel="stylesheet" href="../css/home.css" />
<link rel="stylesheet" href="../css/source.css" />
</head>
<body>

<canvas id="bg-invaders" aria-hidden="true"></canvas>
<div class="bg-grid" aria-hidden="true"></div>
<div class="bg-vignette" aria-hidden="true"></div>
<div class="bg-scanlines" aria-hidden="true"></div>

<div class="wrap">
"""

FOOT = """
<footer class="arcade-footer">
  <p><a href="../index.html">&#9664; BACK TO THE ARCADE</a></p>
</footer>

<script src="../js/invaders-bg.js"></script>
</body>
</html>
"""


def build_game(slug, spec):

    nav, panes = [], []

    idx = 0
    for group_name, group_files in spec["groups"]:
        nav.append('<p class="src-group">%s</p>' % group_name)
        for rel, note in group_files:
            path = ROOT / rel
            if not path.exists():
                print("  ! missing:", rel, file=sys.stderr)
                continue
            src = path.read_text(encoding="utf-8")
            lines = src.count("\n") + 1
            nav.append(
                '<button class="src-file" type="button" data-pane="p%d">%s'
                '<span class="src-note">%s</span></button>'
                % (idx, html.escape(path.name), html.escape(note))
            )
            panes.append(
                '<div class="src-pane" id="p%d" hidden data-path="%s" '
                'data-meta="%d LINES">\n<pre class="code">%s</pre>\n</div>'
                % (idx, html.escape(rel), lines, render_code(src, mode_for(path)))
            )
            idx += 1

    intro = "\n".join("      <p>%s</p>" % p for p in spec["intro"])

    links = "\n".join(
        '      <a class="btn %s" href="%s">%s</a>' % (cls, href, label)
        for label, href, cls in
        spec.get("links", [("&#9654; PLAY", spec.get("play", "#"), "")])
        + [("&#9664; ARCADE", "../index.html", "btn-pink")]
    )

    body = """
  <div class="shell-bar">
    <div>
      <h1 class="shell-title">{heading}</h1>
      <p class="shell-sub">{subtitle}</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
{links}
    </div>
  </div>

  <div class="src-intro">
{intro}
  </div>

  <div class="src-layout">
    <nav class="src-files" aria-label="Files">
{nav}
    </nav>

    <div class="src-viewer">
      <div class="src-head">
        <span class="src-path" id="srcPath"></span>
        <span class="src-meta" id="srcMeta"></span>
      </div>
      <div class="src-body">
{panes}
      </div>
    </div>
  </div>
</div>

<script>
(function () {{
  var buttons = [].slice.call(document.querySelectorAll(".src-file"));
  var pathEl = document.getElementById("srcPath");
  var metaEl = document.getElementById("srcMeta");

  function show(id) {{
    buttons.forEach(function (b) {{
      var on = b.getAttribute("data-pane") === id;
      b.classList.toggle("is-active", on);
    }});
    [].slice.call(document.querySelectorAll(".src-pane")).forEach(function (p) {{
      p.hidden = p.id !== id;
      if (!p.hidden) {{
        pathEl.textContent = p.getAttribute("data-path");
        metaEl.textContent = p.getAttribute("data-meta");
      }}
    }});
  }}

  buttons.forEach(function (b) {{
    b.addEventListener("click", function () {{
      show(b.getAttribute("data-pane"));
      // Switching files while scrolled deep into a long one used to drop you
      // into the middle of the new file. Pull the top of the viewer back into
      // view, but only when it has actually scrolled off.
      var viewer = document.querySelector(".src-viewer");
      if (viewer.getBoundingClientRect().top < 0) {{
        viewer.scrollIntoView({{ behavior: "smooth", block: "start" }});
      }}
    }});
  }});

  if (buttons.length) show(buttons[0].getAttribute("data-pane"));
}})();
</script>
""".format(
        heading=spec.get("heading", spec["title"] + " &mdash; SOURCE"),
        subtitle=spec.get("subtitle", "%d files, shown exactly as they ship" % idx),
        links=links, intro=intro,
        nav="\n".join("      " + l for l in nav),
        panes="\n".join(panes),
    )

    out = ROOT / spec.get("out", "source/%s.html" % slug)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(HEAD.format(title=spec["title"]) + body + FOOT, encoding="utf-8")
    print("  wrote %s (%d files)" % (out.relative_to(ROOT), idx))


HUB_CARDS = [
    ("tictactoe", "TIC-TAC-TOE", "One model, three front ends — buttons, canvas and console — plus the Swing originals."),
    ("othello", "OTHELLO", "Board rules, the greedy CPU and the minimax search, next to the Java they came from."),
    ("pong", "PONG", "Physics, the 16ms tick and the canvas draw loop, next to the Java they came from."),
    ("chess", "CHESS", "Built for the browser, so no Java — the engine wrapper, the AI, and the arcade skin."),
]

JAVA_CARD = (
    "../java-source/index.html", "THE JAVA ORIGINALS",
    "All fourteen Swing files on their own, without the JavaScript beside them.",
)


def build_hub():
    rows = [(s + ".html", t, d) for s, t, d in HUB_CARDS] + [JAVA_CARD]
    cards = "\n".join(
        '''    <div class="about-box">
      <h3>{t}</h3>
      <p>{d}</p>
      <p style="margin-top:14px;"><a href="{href}">Read the code &rarr;</a></p>
    </div>'''.format(t=t, d=d, href=href) for href, t, d in rows
    )

    body = """
  <div class="shell-bar">
    <div>
      <h1 class="shell-title">SOURCE CODE</h1>
      <p class="shell-sub">Every file behind the four games</p>
    </div>
    <a class="btn btn-pink" href="../index.html">&#9664; ARCADE</a>
  </div>

  <div class="src-intro">
    <p>
      Pick a game to read its code. Each page lists the JavaScript that runs in
      your browser, the HTML and CSS around it, and &mdash; for the three ports
      &mdash; the original Java Swing files they were translated from.
    </p>
    <p>
      The <code>.java</code> files on their own are also in
      <a href="../java-source/index.html">/java-source</a>.
    </p>
  </div>

  <div class="src-hub">
{cards}
  </div>
</div>
""".format(cards=cards)

    (OUT / "index.html").write_text(
        HEAD.format(title="ALL") + body + FOOT, encoding="utf-8"
    )
    print("  wrote source/index.html")


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    print("building source pages...")
    for slug, spec in GAMES.items():
        build_game(slug, spec)
    build_game("java", JAVA_PAGE)
    build_hub()
    print("done.")
