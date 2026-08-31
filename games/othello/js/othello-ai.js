/* ==========================================================================
   othello-ai.js  —  port of OthelloComputerAndAI.java

   Two opponents:
     GREEDY_CPU  — plays whichever legal move flips the most discs right now.
                   Strong-looking early, reliably bad at Othello, because
                   grabbing discs early hands your opponent options later.
     MINIMAX_AI  — searches to the chosen depth, scoring positions by disc
                   difference, assuming the opponent plays its best reply.
   ========================================================================== */
(function () {
  "use strict";
  window.Oth = window.Oth || {};

  var CompType = Object.freeze({
    GREEDY_CPU: "GREEDY_CPU",
    MINIMAX_AI: "MINIMAX_AI"
  });

  function OthelloComputerAndAI() {}

  OthelloComputerAndAI.prototype.getComputerMove =
    function (model, compType, computerPlayer, minimaxDepth) {
      if (compType === CompType.GREEDY_CPU) {
        return this.getGreedyCpuMove(model, computerPlayer);
      }
      return this.getMinimaxAiMove(model, computerPlayer, minimaxDepth);
    };

  OthelloComputerAndAI.prototype.getGreedyCpuMove = function (model, player) {
    var moves = model.getValidMoves(player);
    if (moves.length === 0) return null;

    var bestMove = null;
    var bestScore = -Infinity;

    for (var i = 0; i < moves.length; i++) {
      var move = moves[i];
      var copy = model.copyBoard();
      var scoreBeforeMove = copy.countPieces(player);
      copy.makeMove(move.row, move.column, player);
      var scoreAfterMove = copy.countPieces(player);
      var gainThisMove = scoreAfterMove - scoreBeforeMove;

      if (gainThisMove > bestScore) {
        bestScore = gainThisMove;
        bestMove = move;
      }
    }
    return bestMove;
  };

  OthelloComputerAndAI.prototype.getMinimaxAiMove = function (model, player, minimaxDepth) {
    var moves = model.getValidMoves(player);
    if (moves.length === 0) return null;

    var bestMove = null;
    var bestScore = -Infinity;

    for (var i = 0; i < moves.length; i++) {
      var move = moves[i];
      var copy = model.copyBoard();
      copy.makeMove(move.row, move.column, player);
      var score = this.minimax(copy, minimaxDepth - 1, false, player);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  };

  OthelloComputerAndAI.prototype.minimax = function (model, minimaxDepth, maximize, player) {
    if (minimaxDepth <= 0 || model.isGameOver()) {
      return model.checkWhoIsWinning(player);
    }

    var currentPlayer = model.getCurrentPlayer();
    var moves = model.getValidMoves(currentPlayer);

    if (moves.length === 0) {
      var passed = model.copyBoard();
      passed.switchTurn();
      return this.minimax(passed, minimaxDepth - 1, !maximize, player);
    }

    return maximize
      ? this.getMaxScore(model, moves, minimaxDepth, player)
      : this.getMinScore(model, moves, minimaxDepth, player);
  };

  OthelloComputerAndAI.prototype.getMaxScore = function (model, moves, minimaxDepth, player) {
    var bestScore = -Infinity;
    for (var i = 0; i < moves.length; i++) {
      var copy = model.copyBoard();
      copy.makeMove(moves[i].row, moves[i].column, model.getCurrentPlayer());
      bestScore = Math.max(bestScore, this.minimax(copy, minimaxDepth - 1, false, player));
    }
    return bestScore;
  };

  OthelloComputerAndAI.prototype.getMinScore = function (model, moves, minimaxDepth, player) {
    var bestScore = Infinity;
    for (var i = 0; i < moves.length; i++) {
      var copy = model.copyBoard();
      copy.makeMove(moves[i].row, moves[i].column, model.getCurrentPlayer());
      bestScore = Math.min(bestScore, this.minimax(copy, minimaxDepth - 1, true, player));
    }
    return bestScore;
  };

  window.Oth.CompType = CompType;
  window.Oth.OthelloComputerAndAI = OthelloComputerAndAI;
})();
