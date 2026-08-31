// ==========================================================================
// ai.js
// The CPU opponent.
//
// WHY THIS ISN'T "JUST A WEAK MINIMAX":
// A depth-limited minimax with a reasonable evaluation function still plays
// well above 800 Elo, because it never blunders material -- it always sees
// one-move and two-move tactics within its search window. Real ~800 Elo
// players, by contrast, regularly miss hanging pieces, get tempted by
// almost-as-good moves instead of the best one, and occasionally play a
// move that makes no sense at all.
//
// So the search below is intentionally shallow (see AI_SEARCH_DEPTH), AND
// its output is passed through a weighted "how well does the AI actually
// listen to its own analysis" step (see chooseWeightedMove). That second
// step is what actually caps the Elo -- the search quality alone would not.
//
// Loaded as a classic script. Depends on:
//   - window.App.game       (js/game.js, must load first)
//   - window.App.constants  (js/constants.js, must load first)
// Exposes: window.App.ai
// ==========================================================================

(function () {
  const gameApi = window.App.game;
  const constants = window.App.constants;
  const PIECE_VALUES = constants.PIECE_VALUES;
  const PAWN_PST_ROW_BONUS = constants.PAWN_PST_ROW_BONUS;
  const CENTER_PST = constants.CENTER_PST;
  const AI_SEARCH_DEPTH = constants.AI_SEARCH_DEPTH;
  const AI_TOP_N_CANDIDATES = constants.AI_TOP_N_CANDIDATES;
  const AI_MOVE_WEIGHTS = constants.AI_MOVE_WEIGHTS;
  const AI_THINK_DELAY_MIN_MS = constants.AI_THINK_DELAY_MIN_MS;
  const AI_THINK_DELAY_MAX_MS = constants.AI_THINK_DELAY_MAX_MS;

  /**
   * Public entry point. Given the live game state, returns the move the AI
   * will play: { from, to, promotion }. Includes an artificial "thinking"
   * delay so the move doesn't appear instantly.
   */
  async function getAIMove(state) {
    const delay =
      AI_THINK_DELAY_MIN_MS +
      Math.random() * (AI_THINK_DELAY_MAX_MS - AI_THINK_DELAY_MIN_MS);
    const results = await Promise.all([
      Promise.resolve(computeAIMove(state)),
      new Promise((resolve) => setTimeout(resolve, delay)),
    ]);
    return results[0];
  }

  function computeAIMove(state) {
    const chess = state.chess;
    const legalMoves = gameApi.getLegalMoves(state);
    if (legalMoves.length === 0) return null;

    // Score every legal move by searching AI_SEARCH_DEPTH - 1 plies deeper
    // after playing it (so total plies searched = AI_SEARCH_DEPTH, including
    // this move itself).
    const scoredMoves = legalMoves.map((move) => {
      chess.move(move);
      const isFreeCapture = Boolean(move.captured) && !isSquareDefended(chess, move.to);
      const score = minimax(
        chess,
        AI_SEARCH_DEPTH - 1,
        -Infinity,
        Infinity,
        true // it's White's (the human's) turn next -> maximizing
      );
      chess.undo();
      return { move: move, score: score, isFreeCapture: isFreeCapture };
    });

    // The AI plays Black, which wants to MINIMIZE the White-relative score.
    scoredMoves.sort((a, b) => a.score - b.score);

    return chooseWeightedMove(scoredMoves, legalMoves);
  }

  /**
   * Implements the weighted "how faithfully does the AI follow its own
   * analysis" distribution described in AI_MOVE_WEIGHTS. This is what
   * actually determines the AI's playing strength, more so than search depth.
   */
  function chooseWeightedMove(scoredMoves, legalMoves) {
    const roll = Math.random();
    const w = AI_MOVE_WEIGHTS;

    const bestMove = scoredMoves[0].move;
    const nearBestPool = scoredMoves.slice(
      0,
      Math.min(AI_TOP_N_CANDIDATES, scoredMoves.length)
    );
    const freeCapture = scoredMoves.find((m) => m.isFreeCapture);

    // Branch order matches AI_MOVE_WEIGHTS: BEST, NEAR_BEST, RANDOM, IGNORE_HANGING
    if (roll < w.BEST) {
      return bestMove;
    }

    if (roll < w.BEST + w.NEAR_BEST) {
      return randomFrom(nearBestPool).move;
    }

    if (roll < w.BEST + w.NEAR_BEST + w.RANDOM) {
      return randomFrom(legalMoves);
    }

    // IGNORE_HANGING branch: if a free capture exists, deliberately avoid it
    // and pick from the remaining near-best moves instead. If there's no free
    // capture this turn, this branch just behaves like NEAR_BEST.
    if (freeCapture) {
      const withoutFreeCapture = nearBestPool.filter((m) => !m.isFreeCapture);
      if (withoutFreeCapture.length > 0) {
        return randomFrom(withoutFreeCapture).move;
      }
      // Every near-best move happened to be a free capture -- fall back to a
      // fully random legal move instead so the "ignore it" behavior still holds.
      const nonCaptureMoves = legalMoves.filter((m) => !m.captured);
      return nonCaptureMoves.length > 0
        ? randomFrom(nonCaptureMoves)
        : randomFrom(legalMoves);
    }
    return randomFrom(nearBestPool).move;
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * A "free capture" check: after a move lands on `square`, can the opponent
   * (whose turn it now is) immediately recapture there? If not, the AI won
   * material for free. This is a simplified stand-in for a full
   * static-exchange-evaluation (SEE) -- good enough to model "weak players
   * miss/ignore easy tactics" without the cost of a real SEE implementation.
   */
  function isSquareDefended(chess, square) {
    const opponentMoves = chess.moves({ verbose: true });
    return opponentMoves.some((m) => m.to === square && m.flags.indexOf("c") !== -1);
  }

  /**
   * Standard minimax with alpha-beta pruning. `maximizing` = true means it's
   * White's turn to move at this node (White wants to maximize the score).
   */
  function minimax(chess, depth, alpha, beta, maximizing) {
    if (depth === 0 || chess.game_over()) {
      return evaluatePosition(chess);
    }

    const moves = chess.moves({ verbose: true });

    if (maximizing) {
      let value = -Infinity;
      for (let i = 0; i < moves.length; i++) {
        chess.move(moves[i]);
        value = Math.max(value, minimax(chess, depth - 1, alpha, beta, false));
        chess.undo();
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break; // beta cutoff
      }
      return value;
    } else {
      let value = Infinity;
      for (let i = 0; i < moves.length; i++) {
        chess.move(moves[i]);
        value = Math.min(value, minimax(chess, depth - 1, alpha, beta, true));
        chess.undo();
        beta = Math.min(beta, value);
        if (alpha >= beta) break; // alpha cutoff
      }
      return value;
    }
  }

  /**
   * Evaluates the current position from White's perspective: positive is good
   * for White, negative is good for Black. Combines material count with a
   * small positional bonus (pawn advancement + knight/bishop centralization).
   * Deliberately simple -- no king safety, pawn structure, etc. -- since those
   * refinements aren't needed (or wanted) for an ~800 Elo target.
   */
  function evaluatePosition(chess) {
    if (chess.in_checkmate()) {
      // The side whose turn it is has just been checkmated.
      return chess.turn() === "w" ? -Infinity : Infinity;
    }
    if (chess.in_draw() || chess.in_stalemate()) {
      return 0;
    }

    const board = chess.board();
    let score = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;

        const sign = piece.color === "w" ? 1 : -1;
        score += sign * PIECE_VALUES[piece.type];

        if (piece.type === "p") {
          const rowForBonus = piece.color === "w" ? row : 7 - row;
          score += sign * PAWN_PST_ROW_BONUS[rowForBonus];
        } else if (piece.type === "n" || piece.type === "b") {
          score += sign * CENTER_PST[row][col];
        }
      }
    }

    return score;
  }

  window.App.ai = {
    getAIMove: getAIMove,
  };
})();
