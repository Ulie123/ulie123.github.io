// ==========================================================================
// main.js
// App entry point. Owns transient UI state (current selection, whether
// input is locked while the AI "thinks") and the game-mode switch, and
// wires DOM events to game.js (rules/state) and ai.js (CPU opponent).
// Rendering itself always goes through ui.js.
//
// Loaded as a classic script, last, after constants.js/game.js/ai.js/ui.js
// and the vendored chess engine. Everything is read off window.App.
// ==========================================================================

(function () {
  const gameApi = window.App.game;
  const aiApi = window.App.ai;
  const ui = window.App.ui;
  const GAME_MODES = window.App.constants.GAME_MODES;

  // --- App state --------------------------------------------------------------
  let game = gameApi.createGame(GAME_MODES.CPU);
  let selectedSquare = null;
  let selectedMoves = []; // verbose legal moves for the currently selected square
  let inputLocked = false; // true while the AI is "thinking" or a modal is open

  init();

  function init() {
    ui.renderModeToggle(game.mode);
    refreshAll();

    // Board interaction (click + drag/drop), delegated so re-renders don't
    // require re-binding listeners.
    ui.els.board.addEventListener("click", onBoardClick);
    ui.els.board.addEventListener("dragstart", onBoardDragStart);
    ui.els.board.addEventListener("dragover", onBoardDragOver);
    ui.els.board.addEventListener("drop", onBoardDrop);

    ui.els.newGameBtn.addEventListener("click", onNewGame);
    ui.els.undoBtn.addEventListener("click", onUndo);
    ui.els.flipBtn.addEventListener("click", onFlip);
    ui.els.gameOverNewGameBtn.addEventListener("click", onNewGame);

    ui.els.modeCpuBtn.addEventListener("click", () => onModeChangeRequested(GAME_MODES.CPU));
    ui.els.modeHumanBtn.addEventListener("click", () => onModeChangeRequested(GAME_MODES.HUMAN));
  }

  // --- Rendering ---------------------------------------------------------------

  function refreshAll() {
    const board = gameApi.getBoard(game);
    const turnColor = gameApi.getTurn(game);
    const history = gameApi.getMoveHistory(game);
    const interactive = !inputLocked && !(game.mode === GAME_MODES.CPU && turnColor === "b");

    const legalTargets = selectedMoves.map((m) => ({
      square: m.to,
      isCapture: Boolean(m.captured),
    }));
    const lastMove = history.length
      ? { from: history[history.length - 1].from, to: history[history.length - 1].to }
      : null;
    const checkSquare = gameApi.isInCheck(game) ? gameApi.findKingSquare(game, turnColor) : null;

    ui.renderBoard(
      board,
      game.orientation,
      { selectedSquare: selectedSquare, legalTargets: legalTargets, lastMove: lastMove, checkSquare: checkSquare },
      interactive,
      turnColor
    );
    ui.renderStatus(computeStatus(turnColor));
    ui.renderMoveList(history);
    ui.renderCapturedPieces(gameApi.getCapturedPieces(game));
    ui.setUndoEnabled(!inputLocked && history.length > 0);
    ui.setControlsLocked(inputLocked);
  }

  function computeStatus(turnColor) {
    const thinking = inputLocked && game.mode === GAME_MODES.CPU && turnColor === "b";
    let text;

    if (thinking) {
      text = "AI is thinking\u2026";
    } else if (game.mode === GAME_MODES.CPU) {
      text = turnColor === "w" ? "Your move" : "AI's move";
    } else {
      text = turnColor === "w" ? "White to move" : "Black to move";
    }

    const inCheck = gameApi.isInCheck(game);
    if (inCheck && !thinking) text += " \u2014 Check!";

    return { text: text, inCheck: inCheck, thinking: thinking };
  }

  function clearSelection() {
    selectedSquare = null;
    selectedMoves = [];
  }

  // --- Board interaction: click-to-move ----------------------------------------

  function onBoardClick(event) {
    if (inputLocked) return;
    const squareEl = event.target.closest(".square");
    if (!squareEl) return;
    handleSquareClick(squareEl.dataset.square);
  }

  async function handleSquareClick(square) {
    const turnColor = gameApi.getTurn(game);
    if (game.mode === GAME_MODES.CPU && turnColor !== "w") return; // AI's turn, ignore clicks

    if (selectedSquare === square) {
      clearSelection();
      refreshAll();
      return;
    }

    if (selectedSquare) {
      const isLegalTarget = selectedMoves.some((m) => m.to === square);
      if (isLegalTarget) {
        const from = selectedSquare;
        clearSelection();
        const played = await attemptMove(from, square);
        refreshAll();
        if (played) await afterMovePlayed();
        return;
      }
    }

    // Select a new piece, if it belongs to the side to move.
    const moves = gameApi.getLegalMoves(game, square);
    if (moves.length > 0) {
      selectedSquare = square;
      selectedMoves = moves;
    } else {
      clearSelection();
    }
    refreshAll();
  }

  // --- Board interaction: drag-and-drop ---------------------------------------

  function onBoardDragStart(event) {
    const squareEl = event.target.closest(".square");
    if (!squareEl || !squareEl.draggable) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", squareEl.dataset.square);
    event.dataTransfer.effectAllowed = "move";
  }

  function onBoardDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  async function onBoardDrop(event) {
    event.preventDefault();
    if (inputLocked) return;

    const targetEl = event.target.closest(".square");
    if (!targetEl) return;
    const from = event.dataTransfer.getData("text/plain");
    const to = targetEl.dataset.square;
    if (!from || !to || from === to) return;

    const turnColor = gameApi.getTurn(game);
    if (game.mode === GAME_MODES.CPU && turnColor !== "w") return;

    clearSelection();
    const played = await attemptMove(from, to);
    refreshAll();
    if (played) await afterMovePlayed();
  }

  // --- Shared move-attempt logic (used by both click and drag paths) ----------

  /** Attempts a move from -> to, prompting for promotion choice if needed. */
  async function attemptMove(from, to) {
    const candidates = gameApi.getLegalMoves(game, from).filter((m) => m.to === to);
    if (candidates.length === 0) return false;

    let promotion;
    if (candidates.some((m) => m.promotion)) {
      inputLocked = true; // prevent stray clicks while the modal is open
      promotion = await ui.showPromotionModal(gameApi.getTurn(game));
      inputLocked = false;
    }

    const move = gameApi.playMove(game, { from: from, to: to, promotion: promotion });
    return Boolean(move);
  }

  /** Runs after any successful human move: checks for game over, then hands off to the AI if needed. */
  async function afterMovePlayed() {
    if (checkAndShowGameOver()) return;

    if (game.mode === GAME_MODES.CPU && gameApi.getTurn(game) === "b") {
      await runAITurn();
    }
  }

  async function runAITurn() {
    inputLocked = true;
    refreshAll();

    const move = await aiApi.getAIMove(game);
    if (move) {
      gameApi.playMove(game, move);
    }

    inputLocked = false;
    refreshAll();
    checkAndShowGameOver();
  }

  function checkAndShowGameOver() {
    if (!gameApi.isGameOver(game)) return false;
    const info = gameApi.getGameOverInfo(game);
    ui.showGameOverModal(info);
    return true;
  }

  // --- Controls -----------------------------------------------------------------

  function onNewGame() {
    if (inputLocked) return;
    gameApi.resetGame(game);
    clearSelection();
    ui.hideGameOverModal();
    refreshAll();
  }

  function onUndo() {
    if (inputLocked) return;
    gameApi.undoLastTurn(game);
    clearSelection();
    ui.hideGameOverModal();
    refreshAll();
  }

  function onFlip() {
    game.orientation = game.orientation === "white" ? "black" : "white";
    refreshAll();
  }

  async function onModeChangeRequested(mode) {
    if (inputLocked || mode === game.mode) return;

    const hasProgress = gameApi.getMoveHistory(game).length > 0;
    if (hasProgress) {
      const confirmed = await ui.showSwitchModal();
      if (!confirmed) return;
    }

    game.mode = mode;
    gameApi.resetGame(game);
    clearSelection();
    ui.hideGameOverModal();
    ui.renderModeToggle(game.mode);
    refreshAll();
  }
})();
