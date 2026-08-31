/* ==========================================================================
   pong-panel.js  —  port of PongPanel.java
   Owns the canvas, the 16ms tick, the mouse wheel listener and every pixel
   that gets drawn. Gameplay is untouched; only the palette changed (white on
   black became neon green on black to match the rest of the arcade).
   ========================================================================== */
(function () {
  "use strict";
  var C = window.GameConstants;

  function PongPanel(canvas, gameMode, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.gameMode = gameMode;
    this.onGameOver = onGameOver;
    this.model = new window.PongModel(C.WINDOW_WIDTH, C.WINDOW_HEIGHT, gameMode);
    this.raf = null;
    this.running = false;
    this.lastFrame = 0;
    this.accumulator = 0;
    this.reported = false;
    this.held = 0;          // -1 up, +1 down, 0 not held — set by the buttons

    canvas.width = C.WINDOW_WIDTH;
    canvas.height = C.WINDOW_HEIGHT;

    var self = this;

    /* The Swing version used addMouseWheelListener; the browser equivalent is
       the wheel event. preventDefault stops the page scrolling underneath. */
    this.onWheel = function (e) {
      e.preventDefault();
      var direction = e.deltaY > 0 ? 1 : -1;
      self.model.movePaddle(direction * C.SCROLL_AMOUNT);
      self.paintComponent();
    };
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
  }

  /* This was setInterval(TIMER_DELAY), a direct translation of
     javax.swing.Timer. On a desktop it is fine; on a phone it is why tapping a
     paddle button could hang for a moment. setInterval fires at a fixed rate
     whether or not the browser is keeping up, so once a tick costs more than
     16ms the callbacks queue back to back with no idle gap between them and
     input events sit in the queue behind them. Measured on a throttled phone,
     a tap waited ~40ms just to reach its own handler, and the handler itself
     took 2ms.

     requestAnimationFrame instead: the browser schedules it, so it yields
     between frames and simply skips frames when busy rather than piling up a
     backlog. Game speed is unchanged because the logic still advances in fixed
     16ms steps, counted out of an accumulator — pauseTicksRemaining = 60 still
     means exactly one second, as it did in Java. */
  PongPanel.prototype.start = function () {
    var self = this;
    this.stop();
    this.running = true;
    this.lastFrame = 0;
    this.accumulator = 0;

    function frame(now) {
      if (!self.running) return;
      self.raf = requestAnimationFrame(frame);

      if (!self.lastFrame) self.lastFrame = now;
      var elapsed = now - self.lastFrame;
      self.lastFrame = now;

      /* Cap the catch-up. After a real stall — a backgrounded tab, a garbage
         collection — replaying every missed tick would block for longer than
         the stall did. Five is enough to smooth a hiccup and few enough that
         the frame stays cheap. */
      self.accumulator = Math.min(self.accumulator + elapsed, C.TIMER_DELAY * 5);

      var stepped = false;
      while (self.accumulator >= C.TIMER_DELAY) {
        self.accumulator -= C.TIMER_DELAY;

        /* Held buttons move the paddle on the same clock as everything else,
           so holding one feels identical whatever the frame rate. Applied
           before tick() so it still works during the pause between points. */
        if (self.held) self.model.movePaddle(self.held * C.BUTTON_PADDLE_STEP);

        self.model.tick();
        stepped = true;
      }

      // One paint per frame, however many logic steps that frame covered.
      if (stepped) self.paintComponent();

      if (self.model.gameOver && !self.reported) {
        self.reported = true;
        self.stop();
        self.onGameOver(self.buildGameOverMessage());
      }
    }

    this.raf = requestAnimationFrame(frame);
  };

  PongPanel.prototype.stop = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.held = 0;          // never resume with a button still stuck down
    this.lastFrame = 0;
    this.accumulator = 0;
  };

  /* -1 for up, +1 for down, 0 to stop. */
  PongPanel.prototype.setHeld = function (direction) {
    this.held = direction;
  };

  PongPanel.prototype.destroy = function () {
    this.stop();
    this.canvas.removeEventListener("wheel", this.onWheel);
  };

  PongPanel.prototype.resetGame = function () {
    this.model.resetGame();
    this.reported = false;
    this.start();
  };

  PongPanel.prototype.buildGameOverMessage = function () {
    var m = this.model;
    if (this.gameMode === "solo") {
      return {
        title: "GAME OVER",
        sub: "Final score: " + m.soloScore + " returns. Play again?"
      };
    }
    var winner = m.humanScore >= 3 ? "YOU WIN!" : "CPU WINS!";
    return {
      title: winner,
      sub: "Final score — you " + m.humanScore + ", CPU " + m.cpuScore + ". Play again?"
    };
  };

  /* -------------------------------------------------------- paintComponent */

  PongPanel.prototype.paintComponent = function () {
    var g = this.ctx;
    var m = this.model;
    var w = C.WINDOW_WIDTH;
    var h = C.WINDOW_HEIGHT;

    g.fillStyle = "#000000";
    g.fillRect(0, 0, w, h);

    /* playfield border */
    g.strokeStyle = "#2c5c2a";
    g.lineWidth = 2;
    g.strokeRect(C.BORDER + 0.5, C.BORDER + 0.5, w - 2 * C.BORDER, h - 2 * C.BORDER);

    /* Centre net, cpu mode only.
       In the Java original this was drawn at `centerX - DASH_WIDTH`, where
       centerX was DASH_WIDTH / 2 — i.e. x = -1, off the left edge, so the net
       never appeared. Drawn at the actual centre here; nothing else changed. */
    if (this.gameMode === "cpu") {
      var centerX = w / 2 - C.DASH_WIDTH / 2;
      g.fillStyle = "#2c5c2a";
      for (var y = C.BORDER; y < h - C.BORDER; y += C.DASH_GAP) {
        g.fillRect(centerX, y, C.DASH_WIDTH, C.DASH_HEIGHT);
      }
    }

    /* ball */
    g.fillStyle = "#b7ff9f";
    g.shadowColor = "rgba(124, 255, 107, 0.9)";
    g.shadowBlur = 18;
    g.beginPath();
    g.arc(
      m.ballX + C.BALL_SIZE / 2,
      m.ballY + C.BALL_SIZE / 2,
      C.BALL_SIZE / 2, 0, Math.PI * 2
    );
    g.fill();

    /* paddles */
    g.fillStyle = "#7cff6b";
    var paddleX;
    if (this.gameMode === "solo") {
      paddleX = w - C.BORDER - C.PADDLE_FILLER - C.PADDLE_WIDTH;
      g.fillRect(paddleX, m.paddleY, C.PADDLE_WIDTH, C.PADDLE_HEIGHT);
    } else {
      paddleX = C.BORDER + C.PADDLE_FILLER;
      var cpuPaddleX = w - C.BORDER - C.PADDLE_FILLER - C.PADDLE_WIDTH;
      g.fillRect(paddleX, m.paddleY, C.PADDLE_WIDTH, C.PADDLE_HEIGHT);
      g.fillStyle = "#ff63c8";
      g.shadowColor = "rgba(255, 99, 200, 0.9)";
      g.fillRect(cpuPaddleX, m.cpuPaddleY, C.PADDLE_WIDTH, C.PADDLE_HEIGHT);
    }
    g.shadowBlur = 0;

    /* score readout */
    g.font = "12px 'Press Start 2P', monospace";
    g.textBaseline = "alphabetic";
    if (this.gameMode === "solo") {
      g.fillStyle = "#7cff6b";
      g.fillText("SCORE " + m.soloScore, C.SOLO_SCORE_X, C.SCORE_Y);
      g.fillStyle = "#ff63c8";
      g.fillText("MISSES " + m.soloMisses, C.SOLO_MISSES_X + 40, C.SCORE_Y);
    } else {
      g.fillStyle = "#7cff6b";
      g.fillText("YOU " + m.humanScore, C.SOLO_SCORE_X, C.SCORE_Y);
      g.fillStyle = "#ff63c8";
      g.fillText("CPU " + m.cpuScore, w - C.BORDER - C.CPU_SCORE_OFFSET, C.SCORE_Y);
    }

    /* "get ready" beat between points */
    if (m.ballPause && !m.gameOver) {
      g.fillStyle = "rgba(183, 255, 159, 0.85)";
      g.font = "14px 'Press Start 2P', monospace";
      g.textAlign = "center";
      g.fillText("READY...", w / 2, h / 2 - 40);
      g.textAlign = "left";
    }
  };

  window.PongPanel = PongPanel;
})();
