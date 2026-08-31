/* ==========================================================================
   main.js  —  port of PongLauncher.java
   The launcher validated one argument, solo or cpu, and refused to start
   without it. Same idea, except the argument is a button on an attract screen
   instead of something you type after `java PongLauncher`.
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("pong");
  var attract = document.getElementById("attract");
  var hint = document.getElementById("hint");
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll("[data-pong-mode]"));
  var quitBtn = document.getElementById("quitBtn");

  var modal = document.getElementById("gameOverModal");
  var modalTitle = document.getElementById("gameOverTitle");
  var modalSub = document.getElementById("gameOverSubtitle");
  var playAgainBtn = document.getElementById("playAgainBtn");

  var panel = null;

  var HINTS = {
    solo: "Scroll the wheel over the board to move your paddle. Keep the ball alive — three misses and it's over.",
    cpu:  "Scroll the wheel over the board to move the green paddle. First to three points wins."
  };

  function launch(mode) {
    if (panel) panel.destroy();

    // Usage check, straight from the launcher: nothing but solo or cpu.
    if (mode !== "solo" && mode !== "cpu") {
      console.error("Usage: PongPanel <solo|cpu>");
      return;
    }

    panel = new window.PongPanel(canvas, mode, showGameOver);
    panel.start();

    attract.hidden = true;
    canvas.hidden = false;
    hint.textContent = HINTS[mode];

    modeBtns.forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-pong-mode") === mode);
    });

    // Bring the playfield fully into view. Starting the game from the attract
    // screen used to leave the bottom of the board under the fold, and you
    // can't scroll the page while the wheel is busy driving the paddle.
    var cabinet = document.querySelector("[data-center]");
    if (cabinet && cabinet.scrollIntoView) {
      cabinet.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function showGameOver(message) {
    modalTitle.textContent = message.title;
    modalSub.textContent = message.sub;
    modal.hidden = false;
    playAgainBtn.focus();
  }

  /* JOptionPane's YES branch called model.resetGame(); the NO branch called
     System.exit(0). On a web page, "quit" means going back to the arcade. */
  playAgainBtn.addEventListener("click", function () {
    modal.hidden = true;
    if (panel) panel.resetGame();
  });

  quitBtn.addEventListener("click", function () {
    window.location.href = "../../index.html";
  });

  modeBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      modal.hidden = true;
      launch(b.getAttribute("data-pong-mode"));
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) modal.hidden = true;
  });

  /* Pause the tick while the tab is hidden so the ball isn't 40 seconds ahead
     when you come back. */
  document.addEventListener("visibilitychange", function () {
    if (!panel) return;
    if (document.hidden) {
      panel.stop();
    } else if (!panel.model.gameOver && modal.hidden) {
      panel.start();
    }
  });
})();
