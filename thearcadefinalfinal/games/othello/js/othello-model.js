/* ==========================================================================
   othello-model.js  —  port of OthelloModel.java
   Rules per https://www.ultraboardgames.com/othello/game-rules.php:
   black moves first, and a player with no legal move forfeits the turn.
   ========================================================================== */
(function () {
  "use strict";
  window.Oth = window.Oth || {};

  var Square = Object.freeze({ EMPTY: 0, WHITE: 1, BLACK: 2 });
  var Player = Object.freeze({ WHITE: "WHITE", BLACK: "BLACK" });

  var DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1]
  ];

  function Move(row, column) {
    this.row = row;
    this.column = column;
  }
  Move.prototype.toString = function () {
    return "(" + this.row + ", " + this.column + ")";
  };

  function OthelloModel() {
    this.size = 8;
    this.board = [];
    for (var i = 0; i < this.size; i++) this.board.push(new Int8Array(this.size));
    this.currentPlayer = Player.BLACK;
    this.resetGame();
  }

  OthelloModel.prototype.resetGame = function () {
    for (var i = 0; i < this.size; i++) {
      for (var j = 0; j < this.size; j++) this.board[i][j] = Square.EMPTY;
    }
    this.board[3][3] = Square.WHITE;
    this.board[3][4] = Square.BLACK;
    this.board[4][3] = Square.BLACK;
    this.board[4][4] = Square.WHITE;
    this.currentPlayer = Player.BLACK;   // black goes first in Othello
  };

  OthelloModel.prototype.getSize = function () { return this.size; };

  OthelloModel.prototype.getSquare = function (row, column) {
    return this.board[row][column];
  };

  OthelloModel.prototype.getCurrentPlayer = function () { return this.currentPlayer; };

  OthelloModel.prototype.switchTurn = function () {
    this.currentPlayer = this.opponent(this.currentPlayer);
  };

  OthelloModel.prototype.opponent = function (player) {
    return player === Player.BLACK ? Player.WHITE : Player.BLACK;
  };

  OthelloModel.prototype.playersSquare = function (player) {
    return player === Player.BLACK ? Square.BLACK : Square.WHITE;
  };

  OthelloModel.prototype.opponentSquareColor = function (player) {
    return player === Player.BLACK ? Square.WHITE : Square.BLACK;
  };

  OthelloModel.prototype.isInside = function (row, column) {
    return row >= 0 && row < this.size && column >= 0 && column < this.size;
  };

  OthelloModel.prototype.isValidMove = function (row, column, player) {
    if (!this.isInside(row, column)) return false;
    if (this.board[row][column] !== Square.EMPTY) return false;

    for (var d = 0; d < DIRECTIONS.length; d++) {
      if (this.capturesInAnyDirection(row, column, DIRECTIONS[d][0], DIRECTIONS[d][1], player)) {
        return true;
      }
    }
    return false;
  };

  /* Walk out from (row, column): we need at least one enemy disc, then one of
     ours, with no gap in between. */
  OthelloModel.prototype.capturesInAnyDirection = function (row, column, dRow, dCol, player) {
    var r = row + dRow;
    var c = column + dCol;
    var opponent = this.opponentSquareColor(player);
    var own = this.playersSquare(player);
    var foundOpponent = false;

    while (this.isInside(r, c)) {
      if (this.board[r][c] === opponent) {
        foundOpponent = true;
      } else if (this.board[r][c] === own) {
        return foundOpponent;
      } else {
        return false;
      }
      r += dRow;
      c += dCol;
    }
    return false;
  };

  OthelloModel.prototype.flipInDirection = function (row, column, dRow, dCol, player) {
    var r = row + dRow;
    var c = column + dCol;
    var opponent = this.opponentSquareColor(player);
    var own = this.playersSquare(player);

    while (this.isInside(r, c) && this.board[r][c] === opponent) {
      this.board[r][c] = own;
      r += dRow;
      c += dCol;
    }
  };

  OthelloModel.prototype.getValidMoves = function (player) {
    var moves = [];
    for (var i = 0; i < this.size; i++) {
      for (var j = 0; j < this.size; j++) {
        if (this.isValidMove(i, j, player)) moves.push(new Move(i, j));
      }
    }
    return moves;
  };

  OthelloModel.prototype.makeMove = function (row, column, player) {
    if (!this.isValidMove(row, column, player)) return false;

    this.board[row][column] = this.playersSquare(player);
    this.lastMove = { row: row, column: column };

    for (var d = 0; d < DIRECTIONS.length; d++) {
      if (this.capturesInAnyDirection(row, column, DIRECTIONS[d][0], DIRECTIONS[d][1], player)) {
        this.flipInDirection(row, column, DIRECTIONS[d][0], DIRECTIONS[d][1], player);
      }
    }
    this.currentPlayer = this.opponent(player);
    this.handleSkips();
    return true;
  };

  /* If the player to move has nothing legal, the turn bounces back. */
  OthelloModel.prototype.handleSkips = function () {
    this.skipped = false;
    if (this.getValidMoves(this.currentPlayer).length === 0 && !this.isGameOver()) {
      this.currentPlayer = this.opponent(this.currentPlayer);
      this.skipped = true;
    }
  };

  OthelloModel.prototype.countPieces = function (player) {
    var correctColor = this.playersSquare(player);
    var count = 0;
    for (var i = 0; i < this.size; i++) {
      for (var j = 0; j < this.size; j++) {
        if (this.board[i][j] === correctColor) count++;
      }
    }
    return count;
  };

  OthelloModel.prototype.isGameOver = function () {
    return this.getValidMoves(Player.BLACK).length === 0 &&
           this.getValidMoves(Player.WHITE).length === 0;
  };

  OthelloModel.prototype.getWinner = function () {
    var black = this.countPieces(Player.BLACK);
    var white = this.countPieces(Player.WHITE);
    if (black > white) return Player.BLACK;
    if (white > black) return Player.WHITE;
    return null;                       // tie
  };

  /* Simple material evaluation: my discs minus theirs. */
  OthelloModel.prototype.checkWhoIsWinning = function (player) {
    return this.countPieces(player) - this.countPieces(this.opponent(player));
  };

  /* The Java copyBoard() went through `new OthelloModel()`, which resets the
     whole board just to overwrite it a line later. Minimax calls this tens of
     thousands of times, so here it clones directly off the prototype instead —
     same resulting object, none of the setup cost. */
  OthelloModel.prototype.copyBoard = function () {
    var copy = Object.create(OthelloModel.prototype);
    copy.size = this.size;
    copy.board = new Array(this.size);
    for (var i = 0; i < this.size; i++) copy.board[i] = this.board[i].slice();
    copy.currentPlayer = this.currentPlayer;
    return copy;
  };

  window.Oth.Square = Square;
  window.Oth.Player = Player;
  window.Oth.Move = Move;
  window.Oth.OthelloModel = OthelloModel;
})();
