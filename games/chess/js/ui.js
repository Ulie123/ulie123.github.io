// ==========================================================================
// ui.js
// All DOM rendering lives here. Nothing in this file mutates game state --
// it only reads state (or plain data passed in) and updates the DOM, or
// resolves promises based on user clicks (promotion choice, mode-switch
// confirmation). main.js owns wiring board clicks/drags back into game logic.
//
// Loaded as a classic script. Depends on:
//   - window.App.constants  (js/constants.js, must load first)
// Exposes: window.App.ui
// ==========================================================================

(function () {
  const constants = window.App.constants;
  const UNICODE_PIECES = constants.UNICODE_PIECES;
  const PROMOTION_PIECES = constants.PROMOTION_PIECES;
  const FILES = constants.FILES;
  const RANKS = constants.RANKS;
  const GAME_MODES = constants.GAME_MODES;

  // --- Cached DOM references --------------------------------------------------
  const els = {
    board: document.getElementById("board"),
    statusBar: document.getElementById("statusBar"),
    statusDot: document.getElementById("statusDot"),
    statusText: document.getElementById("statusText"),
    moveList: document.getElementById("moveList"),
    capturedByWhitePieces: document.getElementById("capturedByWhitePieces"),
    capturedByBlackPieces: document.getElementById("capturedByBlackPieces"),
    newGameBtn: document.getElementById("newGameBtn"),
    undoBtn: document.getElementById("undoBtn"),
    flipBtn: document.getElementById("flipBtn"),
    modeToggle: document.getElementById("modeToggle"),
    modeCpuBtn: document.getElementById("modeCpuBtn"),
    modeHumanBtn: document.getElementById("modeHumanBtn"),
    promotionModal: document.getElementById("promotionModal"),
    promotionOptions: document.getElementById("promotionOptions"),
    gameOverModal: document.getElementById("gameOverModal"),
    gameOverTitle: document.getElementById("gameOverTitle"),
    gameOverSubtitle: document.getElementById("gameOverSubtitle"),
    gameOverNewGameBtn: document.getElementById("gameOverNewGameBtn"),
    switchModal: document.getElementById("switchModal"),
    switchCancelBtn: document.getElementById("switchCancelBtn"),
    switchConfirmBtn: document.getElementById("switchConfirmBtn"),
  };

  /**
   * Renders the 8x8 board.
   *
   * @param board        chess.js board() output (8x8, row 0 = rank 8)
   * @param orientation  'white' | 'black' -- which side is shown at the bottom
   * @param selection    { selectedSquare, legalTargets: [{square, isCapture}], lastMove: {from,to}|null, checkSquare }
   * @param interactive  whether squares should be clickable/draggable right now
   * @param turnColor    'w' | 'b' -- only this color's pieces are made draggable
   */
  function renderBoard(board, orientation, selection, interactive, turnColor) {
    const selectedSquare = selection.selectedSquare;
    const legalTargets = selection.legalTargets;
    const lastMove = selection.lastMove;
    const checkSquare = selection.checkSquare;

    const targetSquares = new Map(legalTargets.map((t) => [t.square, t.isCapture]));

    const rowOrder = orientation === "white" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
    const colOrder = orientation === "white" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    els.board.innerHTML = "";

    rowOrder.forEach((row, displayRow) => {
      colOrder.forEach((col, displayCol) => {
        const piece = board[row][col];
        const square = FILES[col] + RANKS[row];
        const isLight = (row + col) % 2 === 0;

        const squareEl = document.createElement("div");
        squareEl.className = "square " + (isLight ? "light" : "dark");
        squareEl.dataset.square = square;
        squareEl.setAttribute("role", "gridcell");

        if (square === selectedSquare) squareEl.classList.add("is-selected");
        if (lastMove && (square === lastMove.from || square === lastMove.to)) {
          squareEl.classList.add("is-last-move");
        }
        if (square === checkSquare) squareEl.classList.add("is-check");

        // Coordinate labels along the bottom rank / left file, respecting orientation.
        if (displayRow === 7) {
          const fileLabel = document.createElement("span");
          fileLabel.className = "coord file";
          fileLabel.textContent = FILES[col];
          squareEl.appendChild(fileLabel);
        }
        if (displayCol === 0) {
          const rankLabel = document.createElement("span");
          rankLabel.className = "coord rank";
          rankLabel.textContent = RANKS[row];
          squareEl.appendChild(rankLabel);
        }

        if (piece) {
          const pieceEl = document.createElement("span");
          pieceEl.className = "piece piece-" + (piece.color === "w" ? "white" : "black");
          pieceEl.textContent = UNICODE_PIECES[piece.color][piece.type];
          if (interactive && piece.color === turnColor) {
            squareEl.draggable = true;
          }
          squareEl.appendChild(pieceEl);
        }

        if (targetSquares.has(square)) {
          const marker = document.createElement("span");
          marker.className = targetSquares.get(square) ? "capture-ring" : "move-dot";
          squareEl.appendChild(marker);
        }

        els.board.appendChild(squareEl);
      });
    });
  }

  /** Updates the status line ("White to move", "AI is thinking...", check flag). */
  function renderStatus(info) {
    els.statusText.textContent = info.text;
    els.statusBar.classList.toggle("is-check", Boolean(info.inCheck));
    els.statusBar.classList.toggle("is-thinking", Boolean(info.thinking));
  }

  /** Renders the move ledger from verbose chess.js history. */
  function renderMoveList(history) {
    els.moveList.innerHTML = "";
    for (let i = 0; i < history.length; i += 2) {
      const moveNumber = i / 2 + 1;
      const whiteMove = history[i];
      const blackMove = history[i + 1];

      const li = document.createElement("li");
      li.innerHTML =
        '<span class="move-number">' + moveNumber + '.</span>' +
        '<span class="move-white">' + (whiteMove ? whiteMove.san : "") + '</span>' +
        '<span class="move-black">' + (blackMove ? blackMove.san : "") + '</span>';
      els.moveList.appendChild(li);
    }
    els.moveList.scrollTop = els.moveList.scrollHeight;
  }

  /** Renders the two captured-piece trays. */
  function renderCapturedPieces(captured) {
    els.capturedByWhitePieces.textContent = captured.capturedByWhite
      .map((type) => UNICODE_PIECES.b[type])
      .join(" ");
    els.capturedByBlackPieces.textContent = captured.capturedByBlack
      .map((type) => UNICODE_PIECES.w[type])
      .join(" ");
  }

  /** Reflects the active mode in the segmented toggle control. */
  function renderModeToggle(mode) {
    els.modeToggle.dataset.mode = mode;
    els.modeCpuBtn.classList.toggle("is-active", mode === GAME_MODES.CPU);
    els.modeHumanBtn.classList.toggle("is-active", mode === GAME_MODES.HUMAN);
  }

  function setUndoEnabled(enabled) {
    els.undoBtn.disabled = !enabled;
  }

  /** Disables New Game / mode-switch controls while the AI is "thinking" or a modal is open. */
  function setControlsLocked(locked) {
    els.newGameBtn.disabled = locked;
    els.modeCpuBtn.disabled = locked;
    els.modeHumanBtn.disabled = locked;
  }

  /**
   * Shows the promotion modal for the given color and resolves with the
   * chosen piece type ('q' | 'r' | 'b' | 'n') once the user picks one.
   */
  function showPromotionModal(color) {
    return new Promise((resolve) => {
      els.promotionOptions.innerHTML = "";
      PROMOTION_PIECES.forEach((type) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = UNICODE_PIECES[color][type];
        btn.addEventListener("click", () => {
          els.promotionModal.hidden = true;
          resolve(type);
        });
        els.promotionOptions.appendChild(btn);
      });
      els.promotionModal.hidden = false;
    });
  }

  function showGameOverModal(info) {
    const messages = {
      checkmate: ["Checkmate", info.winner + " wins the game."],
      stalemate: ["Stalemate", "The game is drawn -- no legal moves remain."],
      repetition: ["Draw", "Draw by threefold repetition."],
      "insufficient-material": ["Draw", "Draw by insufficient material."],
      draw: ["Draw", "The game is drawn."],
      unknown: ["Game Over", "The game has ended."],
    };
    const pair = messages[info.type] || messages.unknown;
    els.gameOverTitle.textContent = pair[0];
    els.gameOverSubtitle.textContent = pair[1];
    els.gameOverModal.hidden = false;
  }

  function hideGameOverModal() {
    els.gameOverModal.hidden = true;
  }

  /** Shows the "switch mode?" confirmation and resolves true/false. */
  function showSwitchModal() {
    return new Promise((resolve) => {
      els.switchModal.hidden = false;

      const cleanup = () => {
        els.switchModal.hidden = true;
        els.switchConfirmBtn.removeEventListener("click", onConfirm);
        els.switchCancelBtn.removeEventListener("click", onCancel);
      };
      const onConfirm = () => {
        cleanup();
        resolve(true);
      };
      const onCancel = () => {
        cleanup();
        resolve(false);
      };
      els.switchConfirmBtn.addEventListener("click", onConfirm);
      els.switchCancelBtn.addEventListener("click", onCancel);
    });
  }

  window.App.ui = {
    els: els,
    renderBoard: renderBoard,
    renderStatus: renderStatus,
    renderMoveList: renderMoveList,
    renderCapturedPieces: renderCapturedPieces,
    renderModeToggle: renderModeToggle,
    setUndoEnabled: setUndoEnabled,
    setControlsLocked: setControlsLocked,
    showPromotionModal: showPromotionModal,
    showGameOverModal: showGameOverModal,
    hideGameOverModal: hideGameOverModal,
    showSwitchModal: showSwitchModal,
  };
})();
