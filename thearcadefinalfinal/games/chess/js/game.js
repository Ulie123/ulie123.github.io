// ==========================================================================
// game.js
// Thin wrapper around chess.js. This is the ONLY file that touches the
// chess.js instance directly -- everything else (ai.js, ui.js, main.js)
// goes through the functions exported here. This keeps rules/state logic
// separate from rendering and AI decision-making.
//
// Loaded as a classic script. Depends on:
//   - window.Chess          (js/vendor/chess.js, must load first)
//   - window.App.constants  (js/constants.js, must load first)
// Exposes: window.App.game
// ==========================================================================

(function () {
  const { GAME_MODES } = window.App.constants;

  /**
   * Creates a fresh game-state object. This object is the single source of
   * truth shared across main.js, ai.js (read-only access to `.chess`), and
   * ui.js (rendering only, never mutating).
   */
  function createGame(mode) {
    return {
      chess: new window.Chess(),
      mode: mode || GAME_MODES.CPU, // GAME_MODES.CPU | GAME_MODES.HUMAN
      orientation: "white", // 'white' | 'black' -- which side is at the bottom
    };
  }

  /** Resets the board to the starting position, keeping the current mode/orientation. */
  function resetGame(state) {
    state.chess = new window.Chess();
  }

  /** Returns the array of legal moves (verbose) for a given square, or all legal moves if omitted. */
  function getLegalMoves(state, square) {
    return square
      ? state.chess.moves({ square: square, verbose: true })
      : state.chess.moves({ verbose: true });
  }

  /**
   * Attempts to play a move. Returns the move object on success, or null if
   * the move was illegal.
   */
  function playMove(state, move) {
    return state.chess.move({ from: move.from, to: move.to, promotion: move.promotion });
  }

  /**
   * Undoes the last move. In CPU mode this undoes a full "turn" (the player's
   * move plus the AI's reply) so it's always the human's turn again. In Human
   * mode it undoes a single ply.
   */
  function undoLastTurn(state) {
    if (state.mode === GAME_MODES.CPU) {
      const undone1 = state.chess.undo();
      if (undone1 === null) {
        return false;
      }
      if (state.chess.history().length > 0) {
        // Only undo a second ply if there's actually a prior player move to
        // return to (guards against undoing before the AI has even moved).
        state.chess.undo();
      }
      return true;
    }
    return state.chess.undo() !== null;
  }

  /** Whose turn it is: 'w' | 'b'. */
  function getTurn(state) {
    return state.chess.turn();
  }

  function isGameOver(state) {
    return state.chess.game_over();
  }

  /**
   * Returns a structured game-over result, or null if the game is still going.
   */
  function getGameOverInfo(state) {
    const chess = state.chess;
    if (!chess.game_over()) return null;

    if (chess.in_checkmate()) {
      const winner = chess.turn() === "w" ? "Black" : "White";
      return { type: "checkmate", winner: winner };
    }
    if (chess.in_stalemate()) {
      return { type: "stalemate", winner: null };
    }
    if (chess.in_threefold_repetition()) {
      return { type: "repetition", winner: null };
    }
    if (chess.insufficient_material()) {
      return { type: "insufficient-material", winner: null };
    }
    if (chess.in_draw()) {
      return { type: "draw", winner: null };
    }
    return { type: "unknown", winner: null };
  }

  /** Collects captured pieces from move history, grouped by which side captured them. */
  function getCapturedPieces(state) {
    const history = state.chess.history({ verbose: true });
    const capturedByWhite = []; // black pieces White has captured
    const capturedByBlack = []; // white pieces Black has captured

    for (let i = 0; i < history.length; i++) {
      const move = history[i];
      if (!move.captured) continue;
      if (move.color === "w") {
        capturedByWhite.push(move.captured);
      } else {
        capturedByBlack.push(move.captured);
      }
    }
    return { capturedByWhite: capturedByWhite, capturedByBlack: capturedByBlack };
  }

  function getMoveHistory(state) {
    return state.chess.history({ verbose: true });
  }

  function getBoard(state) {
    return state.chess.board();
  }

  function isInCheck(state) {
    return state.chess.in_check();
  }

  /** Finds the board square of the king belonging to the given color. */
  function findKingSquare(state, color) {
    const board = state.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === "k" && piece.color === color) {
          return piece.square;
        }
      }
    }
    return null;
  }

  window.App.game = {
    createGame: createGame,
    resetGame: resetGame,
    getLegalMoves: getLegalMoves,
    playMove: playMove,
    undoLastTurn: undoLastTurn,
    getTurn: getTurn,
    isGameOver: isGameOver,
    getGameOverInfo: getGameOverInfo,
    getCapturedPieces: getCapturedPieces,
    getMoveHistory: getMoveHistory,
    getBoard: getBoard,
    isInCheck: isInCheck,
    findKingSquare: findKingSquare,
  };
})();
