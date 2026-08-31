/* ==========================================================================
   button-ui.js  —  port of ButtonGUI.java
   A 3x3 grid of clickable cells. Occupied cells disable themselves, same as
   the Swing version did with setEnabled(false).
   ========================================================================== */
(function () {
  "use strict";
  var Player = window.T3.Player;

  function ButtonUI(model, onMove) {
    this.model = model;
    this.onMove = onMove;
    this.squares = [[], [], []];
    this.root = null;
  }

  ButtonUI.prototype.mount = function (container) {
    container.innerHTML = "";

    var grid = document.createElement("div");
    grid.className = "t3-grid";

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var square = document.createElement("button");
        square.type = "button";
        square.className = "t3-cell";
        square.setAttribute("aria-label", "Row " + (i + 1) + ", column " + (j + 1));

        (function (self, row, column, el) {
          el.addEventListener("click", function () {
            // Same guard the Java version needed: bail out before touching the
            // view if the model rejects the move.
            if (!self.model.move(row, column)) return;
            self.onMove();
          });
        })(this, i, j, square);

        this.squares[i][j] = square;
        grid.appendChild(square);
      }
    }

    this.root = grid;
    container.appendChild(grid);
    this.refresh();
  };

  ButtonUI.prototype.refresh = function () {
    var over = this.model.isGameOver();
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var p = this.model.getCell(i, j);
        var el = this.squares[i][j];
        el.classList.remove("is-x", "is-o", "is-win");
        if (p === Player.NONE) {
          el.textContent = "";
          el.disabled = over;
        } else {
          el.textContent = p;
          el.classList.add(p === Player.X ? "is-x" : "is-o");
          el.disabled = true;
        }
      }
    }
    this.highlightWin();
  };

  /* Not in the Java original — a small flourish so a win is obvious. */
  ButtonUI.prototype.highlightWin = function () {
    var line = this.model.winLine;
    if (!line) return;
    var cells = [];
    var k;
    if (line.type === "row")  for (k = 0; k < 3; k++) cells.push([line.index, k]);
    if (line.type === "col")  for (k = 0; k < 3; k++) cells.push([k, line.index]);
    if (line.type === "diag") {
      for (k = 0; k < 3; k++) cells.push(line.index === 0 ? [k, k] : [k, 2 - k]);
    }
    for (k = 0; k < cells.length; k++) {
      this.squares[cells[k][0]][cells[k][1]].classList.add("is-win");
    }
  };

  window.T3.ButtonUI = ButtonUI;
})();
