/* ==========================================================================
   main.js  —  port of T3Launcher.java
   The launcher took a mode argument (buttons | paint | console) and built the
   matching front end over one shared model. Here the mode is a row of buttons
   instead of a command-line argument, and you can switch mid-game because the
   model outlives the view.
   ========================================================================== */
(function () {
  "use strict";

  var Player = window.T3.Player;

  var model = new window.T3.T3Model();

  var stage = document.getElementById("stage");
  var statusBar = document.getElementById("status");
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll("[data-mode]"));
  var newGameBtn = document.getElementById("newGameBtn");

  var modal = document.getElementById("gameOverModal");
  var modalTitle = document.getElementById("gameOverTitle");
  var modalSub = document.getElementById("gameOverSubtitle");
  var playAgainBtn = document.getElementById("playAgainBtn");

  var uis = {
    buttons: new window.T3.ButtonUI(model, onMove),
    paint:   new window.T3.PaintUI(model, onMove),
    console: new window.T3.ConsoleUI(model, onMove)
  };

  var current = null;
  var currentName = null;

  function setMode(name) {
    currentName = name;
    current = uis[name];
    stage.className = "t3-stage mode-" + name;
    current.mount(stage);
    modeBtns.forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-mode") === name);
    });
    updateStatus();
  }

  function onMove() {
    current.refresh();
    updateStatus();
    if (model.isGameOver()) {
      // A beat before the dialog, so you actually see the winning move land.
      setTimeout(showGameOverDialog, 260);
    }
  }

  function updateStatus() {
    if (model.getWinner() !== Player.NONE) {
      statusBar.textContent = model.getWinner() + " WON!";
    } else if (model.isTie()) {
      statusBar.textContent = "TIE GAME!";
    } else {
      statusBar.textContent = model.getCurrentPlayer() + "'S TURN";
    }
  }

  function showGameOverDialog() {
    if (model.getWinner() !== Player.NONE) {
      modalTitle.textContent = model.getWinner() + " WON!!!!";
      modalSub.textContent = "Play again?";
    } else {
      modalTitle.textContent = "IT'S A TIE!";
      modalSub.textContent = "Nobody blinked. Play again?";
    }
    modal.hidden = false;
    playAgainBtn.focus();
  }

  function newGame() {
    model.reset();
    if (uis.console.clearLog) uis.console.clearLog();
    modal.hidden = true;
    current.mount(stage);
    updateStatus();
  }

  modeBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      setMode(b.getAttribute("data-mode"));
    });
  });

  newGameBtn.addEventListener("click", newGame);
  playAgainBtn.addEventListener("click", newGame);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) modal.hidden = true;
  });

  setMode("buttons");
})();
