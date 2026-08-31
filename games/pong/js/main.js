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

  var pad = document.getElementById("pad");
  var padUp = document.getElementById("padUp");
  var padDown = document.getElementById("padDown");

  var panel = null;

  var HINTS = {
    solo: "Hold ▲ / ▼ to move your paddle, or scroll the wheel over the board. Keep the ball alive — three misses and it's over.",
    cpu:  "Hold ▲ / ▼ to move the green paddle, or scroll the wheel over the board. First to three points wins."
  };

  /* ------------------------------------------------------------ paddle pad

     A phone has no wheel, so the buttons are the only way in on mobile; on a
     desktop they sit alongside the wheel rather than replacing it. Holding one
     sets a direction that the game loop applies on every 16ms tick, so the
     paddle glides instead of stepping once per click.

     Pointer events cover mouse, touch and pen in one path. The release is
     bound on the window, not the button, because a finger or cursor that
     slides off the button mid-hold would otherwise never deliver the "up"
     and the paddle would run away on its own. */
  function bindPaddleButton(button, direction) {
    if (!button) return;

    function press(e) {
      e.preventDefault();
      if (!panel) return;
      panel.setHeld(direction);
      button.classList.add("is-held");
    }

    function release() {
      if (panel) panel.setHeld(0);
      button.classList.remove("is-held");
    }

    button.addEventListener("pointerdown", press);
    button.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);

    // Keyboard: the buttons are real <button>s, so Enter/Space reach them.
    button.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") press(e);
    });
    button.addEventListener("keyup", release);
  }

  bindPaddleButton(padUp, -1);
  bindPaddleButton(padDown, 1);

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
    pad.hidden = false;
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
    if (panel) panel.setHeld(0);
    padUp.classList.remove("is-held");
    padDown.classList.remove("is-held");
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
