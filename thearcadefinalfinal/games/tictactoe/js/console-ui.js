/* ==========================================================================
   console-ui.js  —  port of ConsoleUI.java
   Same box-drawing board, same "B2"-style coordinate parser (column letter
   first, row digit second), same grumpy rejection message.
   ========================================================================== */
(function () {
  "use strict";
  var Player = window.T3.Player;

  function ConsoleUI(model, onMove) {
    this.model = model;
    this.onMove = onMove;
    this.out = null;
    this.input = null;
    this.log = [];
  }

  ConsoleUI.prototype.mount = function (container) {
    container.innerHTML = "";

    var term = document.createElement("div");
    term.className = "t3-terminal";

    var out = document.createElement("pre");
    out.className = "t3-term-out";
    out.setAttribute("aria-live", "polite");

    var row = document.createElement("div");
    row.className = "t3-term-row";

    var caret = document.createElement("span");
    caret.className = "t3-term-caret";
    caret.textContent = "ENTER MOVE >";

    var input = document.createElement("input");
    input.className = "t3-term-input";
    input.type = "text";
    input.maxLength = 2;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "B2";
    input.setAttribute("aria-label", "Enter a move, for example B2");

    var self = this;
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var s = input.value.trim().toUpperCase();
      input.value = "";
      if (!s) return;

      self.log.push("> " + s);
      if (!self.tryMoveFromString(s)) {
        self.log.push("Illegal Move. Give it another go bub");
        self.refresh();
      } else {
        self.onMove();
      }
    });

    row.appendChild(caret);
    row.appendChild(input);
    term.appendChild(out);
    term.appendChild(row);
    container.appendChild(term);

    this.out = out;
    this.input = input;
    this.refresh();
    input.focus();
  };

  ConsoleUI.prototype.tryMoveFromString = function (s) {
    if (s.length !== 2) return false;

    var columnChar = s.charAt(0);
    var rowChar = s.charAt(1);

    var column = { A: 0, B: 1, C: 2 }[columnChar];
    var row = { "1": 0, "2": 1, "3": 2 }[rowChar];

    if (column === undefined || row === undefined) return false;
    return this.model.move(row, column);
  };

  /* printBoard() */
  ConsoleUI.prototype.printBoard = function () {
    var lines = [];
    lines.push("    A   B   C");
    lines.push("  ┌───┬───┬───┐");
    for (var i = 0; i < 3; i++) {
      var line = (i + 1) + " |";
      for (var j = 0; j < 3; j++) {
        var p = this.model.getCell(i, j);
        var cell = (p === Player.NONE) ? " " : p;
        line += " " + cell + " |";
      }
      lines.push(line);
      if (i < 2) lines.push("  ├───┼───┼───┤");
    }
    lines.push("  └───┴───┴───┘");
    return lines.join("\n");
  };

  ConsoleUI.prototype.refresh = function () {
    if (!this.out) return;

    var text = this.printBoard() + "\n\n";

    if (this.model.isGameOver()) {
      text += (this.model.getWinner() !== Player.NONE)
        ? "Winner: " + this.model.getWinner() + "\n"
        : "Tie game!!\n";
      if (this.input) this.input.disabled = true;
    } else {
      text += "Turn for: " + this.model.getCurrentPlayer() + "\n";
      if (this.input) this.input.disabled = false;
    }

    // Keep the last few lines of chatter under the board, like scrollback.
    var tail = this.log.slice(-4);
    if (tail.length) text += "\n" + tail.join("\n");

    this.out.textContent = text;
  };

  ConsoleUI.prototype.clearLog = function () {
    this.log = [];
  };

  window.T3.ConsoleUI = ConsoleUI;
})();
