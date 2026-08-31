// ==========================================================================
// constants.js
// Every "tunable number" in the app lives here so difficulty/behavior can be
// adjusted without touching game logic, AI logic, or rendering code.
//
// Loaded as a classic (non-module) script -- see index.html for load order.
// Everything this file exposes is namespaced under window.App.constants so
// the other files can use it without any bundler or <script type="module">.
// ==========================================================================

(function () {
  // --- Piece values (in "pawns") -------------------------------------------
  const PIECE_VALUES = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0, // king's value is handled via checkmate detection, not material score
  };

  // --- Piece-square tables ---------------------------------------------------
  // Indexed [row][col] where row 0 = rank 8 and row 7 = rank 1 (this matches
  // chess.js's board() output order directly). Values are in "pawns".
  //
  // PAWN_PST_ROW_BONUS rewards advancing pawns up the board. Because White
  // advances toward rank 8 (row 0) and Black advances toward rank 1 (row 7),
  // the table below is written for White and must be read in reverse
  // row-order for Black (see getPawnAdvancementBonus in ai.js).
  const PAWN_PST_ROW_BONUS = [0, 0.5, 0.3, 0.2, 0.1, 0.05, 0, 0];

  // CENTER_PST rewards knights/bishops for controlling central squares. This
  // table is symmetric top-to-bottom, so the same table applies to both colors.
  const CENTER_PST = [
    [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5],
    [-0.4, -0.2, 0.0, 0.0, 0.0, 0.0, -0.2, -0.4],
    [-0.3, 0.0, 0.1, 0.15, 0.15, 0.1, 0.0, -0.3],
    [-0.3, 0.05, 0.15, 0.2, 0.2, 0.15, 0.05, -0.3],
    [-0.3, 0.0, 0.15, 0.2, 0.2, 0.15, 0.0, -0.3],
    [-0.3, 0.05, 0.1, 0.15, 0.15, 0.1, 0.05, -0.3],
    [-0.4, -0.2, 0.0, 0.05, 0.05, 0.0, -0.2, -0.4],
    [-0.5, -0.4, -0.3, -0.3, -0.3, -0.3, -0.4, -0.5],
  ];

  // --- AI difficulty (target: ~800 Elo) --------------------------------------
  // See ai.js for a full explanation of why "just lowering search depth" isn't
  // enough to hit a low Elo target, and how these knobs are used together.

  // Plies searched by minimax, including the AI's own candidate move.
  // 2 = the AI's move + the opponent's best reply.
  const AI_SEARCH_DEPTH = 2;

  // How many of the AI's top-evaluated candidate moves count as "near-best"
  // for the TOP_N blunder branch below.
  const AI_TOP_N_CANDIDATES = 5;

  // Weighted move-selection distribution. Must sum to 1.
  // - BEST:           play the engine's actual best move
  // - NEAR_BEST:      play a random move from the top N candidates
  // - RANDOM:         play a fully random legal move (a genuine "blunder")
  // - IGNORE_HANGING: if a free/safe capture is available, deliberately look
  //                    past it and play something else (weak players miss
  //                    tactics constantly -- this matters more than eval tuning)
  const AI_MOVE_WEIGHTS = {
    BEST: 0.25,
    NEAR_BEST: 0.4,
    RANDOM: 0.2,
    IGNORE_HANGING: 0.15,
  };

  // Artificial "thinking" delay so the AI doesn't move instantly.
  const AI_THINK_DELAY_MIN_MS = 500;
  const AI_THINK_DELAY_MAX_MS = 1200;

  // --- Rendering --------------------------------------------------------------
  // Both colors deliberately use the SAME glyph codepoints (the "black chess
  // piece" set, U+265A-U+265F). The "white chess piece" set (U+2654-U+2659)
  // renders as a hollow outline in most fonts regardless of CSS color -- that
  // hollow/see-through look isn't fixable by recoloring it. Using one filled
  // glyph set for both colors and varying only the CSS fill color (see
  // .piece-white / .piece-black in style.css) gives solid pieces for both sides.
  const UNICODE_PIECES = {
    w: { k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F" },
    b: { k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F" },
  };

  const PROMOTION_PIECES = ["q", "r", "b", "n"];

  const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

  const GAME_MODES = {
    CPU: "cpu",
    HUMAN: "human",
  };

  window.App = window.App || {};
  window.App.constants = {
    PIECE_VALUES,
    PAWN_PST_ROW_BONUS,
    CENTER_PST,
    AI_SEARCH_DEPTH,
    AI_TOP_N_CANDIDATES,
    AI_MOVE_WEIGHTS,
    AI_THINK_DELAY_MIN_MS,
    AI_THINK_DELAY_MAX_MS,
    UNICODE_PIECES,
    PROMOTION_PIECES,
    FILES,
    RANKS,
    GAME_MODES,
  };
})();
