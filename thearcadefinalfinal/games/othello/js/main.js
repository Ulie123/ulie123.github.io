/* ==========================================================================
   main.js  —  port of OthelloGUI.java
   Human is BLACK and moves first. The computer's reply is fired on a short
   delay (the Swing version used a one-shot javax.swing.Timer) so the board has
   a chance to repaint with your move before the machine answers.
   ========================================================================== */
(function () {
  "use strict";

  var Oth = window.Oth;
  var Player = Oth.Player;
  var Square = Oth.Square;

  var HUMAN = Player.BLACK;
  var COMPUTER = Player.WHITE;

  var model = new Oth.OthelloModel();
  var brain = new Oth.OthelloComputerAndAI();

  var boardEl = document.getElementById("board");
  var statusEl = document.getElementById("status");
  var scoreEl = document.getElementById("score");
  var typeEl = document.getElementById("compType");
  var depthEl = document.getElementById("depth");
  var depthWrap = document.getElementById("depthWrap");
  var newGameBtn = document.getElementById("newGameBtn");

  var modal = document.getElementById("gameOverModal");
  var modalTitle = document.getElementById("gameOverTitle");
  var modalSub = document.getElementById("gameOverSubtitle");
  var playAgainBtn = document.getElementById("playAgainBtn");

  var cells = [];
  var thinking = false;

  /* ------------------------------------------------------------ board setup */

  function setupBoard() {
    boardEl.innerHTML = "";
    cells = [];
    for (var i = 0; i < model.getSize(); i++) {
      cells.push([]);
      for (var j = 0; j < model.getSize(); j++) {
        var cell = document.createElement("button");
        cell.type = "button";
        cell.className = "oth-cell";
        cell.setAttribute("aria-label", "Row " + (i + 1) + ", column " + (j + 1));

        var disc = document.createElement("span");
        disc.className = "oth-disc";
        cell.appendChild(disc);

        (function (row, column, el) {
          el.addEventListener("click", function () { handleHumanMove(row, column); });
        })(i, j, cell);

        cells[i][j] = cell;
        boardEl.appendChild(cell);
      }
    }
  }

  /* -------------------------------------------------------------- game flow */

  function handleHumanMove(row, column) {
    if (model.isGameOver() || thinking) return;
    if (model.getCurrentPlayer() !== HUMAN) return;

    if (!model.makeMove(row, column, HUMAN)) {
      flashIllegal(cells[row][column]);
      return;
    }

    refreshBoard();

    if (!model.isGameOver() && model.getCurrentPlayer() === COMPUTER) {
      computerMove();
    } else if (model.isGameOver()) {
      showGameOverMessage();
    }
  }

  function computerMove() {
    thinking = true;
    statusEl.textContent = "COMPUTER THINKING...";
    boardEl.classList.add("is-thinking");

    // Two frames of breathing room: the first lets the browser paint the
    // "thinking" state, the second runs the search (which blocks the thread).
    requestAnimationFrame(function () {
      setTimeout(function () {
        var theType = typeEl.value;
        var maximizeDepth = parseInt(depthEl.value, 10) || 3;
        var move = brain.getComputerMove(model, theType, COMPUTER, maximizeDepth);

        if (move) model.makeMove(move.row, move.column, COMPUTER);

        thinking = false;
        boardEl.classList.remove("is-thinking");
        refreshBoard();

        // If the human has no legal reply, the model already bounced the turn
        // back to the computer — keep going until it's genuinely our move.
        if (!model.isGameOver() && model.getCurrentPlayer() === COMPUTER) {
          computerMove();
        } else if (model.isGameOver()) {
          showGameOverMessage();
        }
      }, 260);
    });
  }

  /* ------------------------------------------------------------- rendering */

  function refreshBoard() {
    var showHints = !thinking && model.getCurrentPlayer() === HUMAN && !model.isGameOver();

    for (var i = 0; i < model.getSize(); i++) {
      for (var j = 0; j < model.getSize(); j++) {
        var cell = cells[i][j];
        cell.className = "oth-cell";

        var square = model.getSquare(i, j);
        if (square === Square.BLACK) {
          cell.classList.add("has-black");
        } else if (square === Square.WHITE) {
          cell.classList.add("has-white");
        } else if (showHints && model.isValidMove(i, j, HUMAN)) {
          cell.classList.add("is-hint");
        }

        if (model.lastMove && model.lastMove.row === i && model.lastMove.column === j) {
          cell.classList.add("is-last");
        }
      }
    }
    updateScoreLabel();
    updateStatusLabel();
  }

  function updateScoreLabel() {
    scoreEl.textContent =
      "YOU " + model.countPieces(Player.BLACK) +
      "  ·  CPU " + model.countPieces(Player.WHITE);
  }

  function updateStatusLabel() {
    if (model.isGameOver()) {
      statusEl.textContent = gameOverHeadline();
    } else if (thinking) {
      statusEl.textContent = "COMPUTER THINKING...";
    } else if (model.getCurrentPlayer() === HUMAN) {
      statusEl.textContent = model.skipped
        ? "CPU HAD NO MOVE — YOUR TURN AGAIN"
        : "YOUR TURN — YOU ARE BLACK";
    } else {
      statusEl.textContent = "COMPUTER THINKING...";
    }
  }

  function gameOverHeadline() {
    var winner = model.getWinner();
    if (winner === null) return "GAME OVER — TIE GAME!!";
    if (winner === HUMAN) return "GAME OVER — YOU WIN!!!";
    return "GAME OVER — COMPUTER WON :(";
  }

  function showGameOverMessage() {
    var winner = model.getWinner();
    modalTitle.textContent =
      winner === null ? "TIE GAME!!" :
      winner === HUMAN ? "YOU WIN!!! CONGRATS!!!" : "COMPUTER WON :(";
    modalSub.textContent =
      "Final count — you " + model.countPieces(Player.BLACK) +
      ", computer " + model.countPieces(Player.WHITE) + ".";
    modal.hidden = false;
    playAgainBtn.focus();
  }

  function flashIllegal(cell) {
    cell.classList.add("is-illegal");
    setTimeout(function () { cell.classList.remove("is-illegal"); }, 320);
  }

  /* ----------------------------------------------------------------- wiring */

  function newGame() {
    model.resetGame();
    model.lastMove = null;
    model.skipped = false;
    thinking = false;
    modal.hidden = true;
    boardEl.classList.remove("is-thinking");
    refreshBoard();
  }

  function syncDepthVisibility() {
    depthWrap.style.visibility =
      (typeEl.value === Oth.CompType.MINIMAX_AI) ? "visible" : "hidden";
  }

  newGameBtn.addEventListener("click", newGame);
  playAgainBtn.addEventListener("click", newGame);
  typeEl.addEventListener("change", syncDepthVisibility);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) modal.hidden = true;
  });

  setupBoard();
  syncDepthVisibility();
  refreshBoard();
})();
