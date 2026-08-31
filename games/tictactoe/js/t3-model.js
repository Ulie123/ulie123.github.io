/* ==========================================================================
   t3-model.js  —  port of Player.java + IT3Model.java + T3Model.java
   The model knows the rules and nothing else. No drawing lives in here,
   exactly like the Java version.
   ========================================================================== */
(function () {
  "use strict";

  window.T3 = window.T3 || {};

  /* enum Player { X, O, NONE } */
  var Player = Object.freeze({
    X: "X",
    O: "O",
    NONE: "NONE"
  });

  /* enum GameState { Still_Going, X_WON, O_WON, Tie_Game } */
  var GameState = Object.freeze({
    STILL_GOING: "Still_Going",
    X_WON: "X_WON",
    O_WON: "O_WON",
    TIE_GAME: "Tie_Game"
  });

  function T3Model() {
    this.board = [];
    for (var i = 0; i < 3; i++) this.board.push([null, null, null]);
    this.player = Player.X;
    this.gameState = GameState.STILL_GOING;
    this.reset();
  }

  /* Attempt a move for the current player. Returns true if it was legal. */
  T3Model.prototype.move = function (row, col) {
    if (this.gameState !== GameState.STILL_GOING) return false;
    if (row < 0 || row >= 3 || col < 0 || col >= 3) return false;
    if (this.board[row][col] !== Player.NONE) return false;

    this.board[row][col] = this.player;
    this.checkForWin();

    if (this.gameState === GameState.STILL_GOING) this.changePlayer();
    return true;
  };

  T3Model.prototype.getCurrentPlayer = function () {
    return this.player;
  };

  T3Model.prototype.getWinner = function () {
    if (this.gameState === GameState.X_WON) return Player.X;
    if (this.gameState === GameState.O_WON) return Player.O;
    return Player.NONE;
  };

  T3Model.prototype.isGameOver = function () {
    return this.gameState !== GameState.STILL_GOING;
  };

  T3Model.prototype.isTie = function () {
    return this.gameState === GameState.TIE_GAME;
  };

  T3Model.prototype.getCell = function (row, col) {
    if (row < 0 || row >= 3 || col < 0 || col >= 3) return Player.NONE;
    return this.board[row][col];
  };

  T3Model.prototype.reset = function () {
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) this.board[i][j] = Player.NONE;
    }
    this.player = Player.X;
    this.gameState = GameState.STILL_GOING;
    this.winLine = null;   // extra: lets the UIs draw a strike-through
  };

  T3Model.prototype.changePlayer = function () {
    this.player = (this.player === Player.X) ? Player.O : Player.X;
  };

  /* ------------------------------------------------------------------------
     checkForWin — runs after a piece is placed but BEFORE the turn flips, so
     `this.player` is still whoever just moved.

     Two fixes vs. the Java original, both in the same spot:
       1. The Java version only `return`ed early when X won. When O won it fell
          through to the next check. Harmless on its own...
       2. ...except that it then reached the boardIsFull() test at the bottom,
          which would overwrite a genuine win with Tie_Game whenever the
          winning move was also the move that filled the board. That's a real
          losable game — O completing a line on move 9 was scored as a draw.
     Here every win returns immediately, and the tie test only fires while the
     game is still undecided.
     ------------------------------------------------------------------------ */
  T3Model.prototype.checkForWin = function () {
    var b = this.board;
    var won = (this.player === Player.X) ? GameState.X_WON : GameState.O_WON;
    var i;

    for (i = 0; i < 3; i++) {                       // rows
      if (b[i][0] !== Player.NONE && b[i][0] === b[i][1] && b[i][1] === b[i][2]) {
        this.gameState = won;
        this.winLine = { type: "row", index: i };
        return;
      }
    }
    for (i = 0; i < 3; i++) {                       // columns
      if (b[0][i] !== Player.NONE && b[0][i] === b[1][i] && b[1][i] === b[2][i]) {
        this.gameState = won;
        this.winLine = { type: "col", index: i };
        return;
      }
    }
    if (b[0][0] !== Player.NONE && b[0][0] === b[1][1] && b[1][1] === b[2][2]) {
      this.gameState = won;
      this.winLine = { type: "diag", index: 0 };
      return;
    }
    if (b[0][2] !== Player.NONE && b[0][2] === b[1][1] && b[1][1] === b[2][0]) {
      this.gameState = won;
      this.winLine = { type: "diag", index: 1 };
      return;
    }
    if (this.boardIsFull()) this.gameState = GameState.TIE_GAME;
  };

  T3Model.prototype.boardIsFull = function () {
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        if (this.board[i][j] === Player.NONE) return false;
      }
    }
    return true;
  };

  window.T3.Player = Player;
  window.T3.GameState = GameState;
  window.T3.T3Model = T3Model;
})();
