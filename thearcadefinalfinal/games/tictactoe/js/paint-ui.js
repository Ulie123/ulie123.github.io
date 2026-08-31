/* ==========================================================================
   paint-ui.js  —  port of PaintGUI.java
   Everything is drawn by hand: the four grid lines, then an X as two crossing
   strokes and an O as an oval, each inset by PADDING. Clicks are translated to
   a cell with the same integer division the Java version used
   (row = y / cellHeight, col = x / cellWidth).
   ========================================================================== */
(function () {
  "use strict";
  var Player = window.T3.Player;

  var SIZE = 450;        // the launcher's default board size
  var PADDING = 20;      // PaintGUI's `padding`

  function PaintUI(model, onMove) {
    this.model = model;
    this.onMove = onMove;
    this.canvas = null;
    this.ctx = null;
  }

  PaintUI.prototype.mount = function (container) {
    container.innerHTML = "";

    var canvas = document.createElement("canvas");
    canvas.className = "t3-canvas";
    canvas.width = SIZE;
    canvas.height = SIZE;
    canvas.setAttribute("role", "grid");
    canvas.setAttribute("aria-label", "Tic-tac-toe board");

    var self = this;
    canvas.addEventListener("mousedown", function (e) {
      var rect = canvas.getBoundingClientRect();
      // The canvas is displayed at CSS size, not backing-store size, so scale
      // the click back into drawing coordinates before dividing into cells.
      var x = (e.clientX - rect.left) * (SIZE / rect.width);
      var y = (e.clientY - rect.top) * (SIZE / rect.height);

      var cellWidth = SIZE / 3;
      var cellHeight = SIZE / 3;
      var row = Math.floor(y / cellHeight);
      var col = Math.floor(x / cellWidth);

      if (self.model.move(row, col)) self.onMove();
    });

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    container.appendChild(canvas);
    this.refresh();
  };

  /* paintComponent() */
  PaintUI.prototype.refresh = function () {
    var g = this.ctx;
    if (!g) return;

    var fullWidth = SIZE;
    var fullHeight = SIZE;
    var cellWidth = Math.floor(fullWidth / 3);
    var cellHeight = Math.floor(fullHeight / 3);

    g.clearRect(0, 0, fullWidth, fullHeight);
    g.fillStyle = "#04060a";
    g.fillRect(0, 0, fullWidth, fullHeight);

    /* the four grid lines */
    g.strokeStyle = "#3f8c39";
    g.lineWidth = 3;
    g.lineCap = "square";
    g.beginPath();
    g.moveTo(cellWidth + 0.5, 0);            g.lineTo(cellWidth + 0.5, fullHeight);
    g.moveTo(2 * cellWidth + 0.5, 0);        g.lineTo(2 * cellWidth + 0.5, fullHeight);
    g.moveTo(0, cellHeight + 0.5);           g.lineTo(fullWidth, cellHeight + 0.5);
    g.moveTo(0, 2 * cellHeight + 0.5);       g.lineTo(fullWidth, 2 * cellHeight + 0.5);
    g.stroke();

    g.lineWidth = 8;
    g.lineCap = "round";

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var p = this.model.getCell(i, j);
        var x = j * cellWidth;
        var y = i * cellHeight;

        if (p === Player.X) {
          g.strokeStyle = "#7cff6b";
          g.shadowColor = "rgba(124,255,107,0.8)";
          g.shadowBlur = 16;
          g.beginPath();
          g.moveTo(x + PADDING, y + PADDING);
          g.lineTo(x + cellWidth - PADDING, y + cellHeight - PADDING);
          g.moveTo(x + PADDING, y + cellHeight - PADDING);
          g.lineTo(x + cellWidth - PADDING, y + PADDING);
          g.stroke();
          g.shadowBlur = 0;
        }

        if (p === Player.O) {
          g.strokeStyle = "#ff63c8";
          g.shadowColor = "rgba(255,99,200,0.8)";
          g.shadowBlur = 16;
          g.beginPath();
          // drawOval(x, y, w, h) → an ellipse inscribed in that box
          g.ellipse(
            x + cellWidth / 2,
            y + cellHeight / 2,
            (cellWidth - 2 * PADDING) / 2,
            (cellHeight - 2 * PADDING) / 2,
            0, 0, Math.PI * 2
          );
          g.stroke();
          g.shadowBlur = 0;
        }
      }
    }

    this.drawWinLine(g, cellWidth, cellHeight);
  };

  PaintUI.prototype.drawWinLine = function (g, cellWidth, cellHeight) {
    var line = this.model.winLine;
    if (!line) return;

    var half = cellWidth / 2;
    var halfH = cellHeight / 2;
    var from, to;

    if (line.type === "row") {
      from = [12, line.index * cellHeight + halfH];
      to   = [SIZE - 12, line.index * cellHeight + halfH];
    } else if (line.type === "col") {
      from = [line.index * cellWidth + half, 12];
      to   = [line.index * cellWidth + half, SIZE - 12];
    } else if (line.index === 0) {
      from = [16, 16]; to = [SIZE - 16, SIZE - 16];
    } else {
      from = [SIZE - 16, 16]; to = [16, SIZE - 16];
    }

    g.strokeStyle = "#ffcf4a";
    g.lineWidth = 6;
    g.shadowColor = "rgba(255,207,74,0.9)";
    g.shadowBlur = 18;
    g.beginPath();
    g.moveTo(from[0], from[1]);
    g.lineTo(to[0], to[1]);
    g.stroke();
    g.shadowBlur = 0;
  };

  window.T3.PaintUI = PaintUI;
})();
