/* ==========================================================================
   pong-model.js  —  port of PongModel.java
   All the rules: movement, bouncing, scoring, game over. Nothing here draws.
   Ported straight across, including the bounce-angle table.
   ========================================================================== */
(function () {
  "use strict";
  var C = window.GameConstants;

  function PongModel(width, height, gameMode) {
    this.width = width;
    this.height = height;
    this.gameMode = gameMode;

    this.dx = 4;
    this.dy = 4;
    this.resetBall();
    this.resetPaddle();

    this.soloScore = 0;
    this.soloMisses = 0;
    this.humanScore = 0;
    this.cpuScore = 0;
    this.gameOver = false;
    this.ballPause = false;
    this.pauseTicksRemaining = 0;
    this.cpuPaddleY = height / 2 - C.PADDLE_HEIGHT / 2;
  }

  PongModel.prototype.resetGame = function () {
    this.soloScore = 0;
    this.soloMisses = 0;
    this.humanScore = 0;
    this.cpuScore = 0;
    this.gameOver = false;
    this.dx = 4;
    this.dy = 4;
    this.resetPaddle();
    this.resetBall();
    this.ballPause = false;
    this.pauseTicksRemaining = 0;
    this.cpuPaddleY = this.height / 2 - C.PADDLE_HEIGHT / 2;
  };

  /* One second of stillness after a point, so you can see what happened. */
  PongModel.prototype.pause = function () {
    this.ballPause = true;
    this.pauseTicksRemaining = 60;
  };

  PongModel.prototype.resetBall = function () {
    this.ballX = this.width / 2 - C.BALL_SIZE / 2;
    this.ballY = this.height / 2 - C.BALL_SIZE / 2;
  };

  PongModel.prototype.resetPaddle = function () {
    this.paddleY = this.height / 2 - C.PADDLE_HEIGHT / 2;
  };

  PongModel.prototype.movePaddle = function (amount) {
    this.paddleY += amount;
    if (this.paddleY < C.BORDER) this.paddleY = C.BORDER;
    if (this.paddleY + C.PADDLE_HEIGHT > this.height - C.BORDER) {
      this.paddleY = this.height - C.BORDER - C.PADDLE_HEIGHT;
    }
  };

  PongModel.prototype.cpuMovePaddle = function () {
    var cpuCenter = this.cpuPaddleY + C.PADDLE_HEIGHT / 2;
    var ballCenter = this.ballY + C.BALL_SIZE / 2;
    var cpuSpeed = 6;

    if (ballCenter < cpuCenter) this.cpuPaddleY -= cpuSpeed;
    if (ballCenter > cpuCenter) this.cpuPaddleY += cpuSpeed;

    if (this.cpuPaddleY < C.BORDER) this.cpuPaddleY = C.BORDER;
    if (this.cpuPaddleY + C.PADDLE_HEIGHT > this.height - C.BORDER) {
      this.cpuPaddleY = this.height - C.BORDER - C.PADDLE_HEIGHT;
    }
  };

  /* Where on the paddle you hit decides the outgoing angle. Dead centre
     sends it flat; the edges send it steeply away. */
  PongModel.prototype.bouncing = function (paddleTopY) {
    var paddleCenter = paddleTopY + C.PADDLE_HEIGHT / 2;
    var ballCenter = this.ballY + C.BALL_SIZE / 2;
    var angle = ballCenter - paddleCenter;

    if (angle <= -20) {
      this.dy = -10;
    } else if (angle <= -8 && angle > -20) {
      this.dy = -8;
    } else if (angle >= -8 && angle < 0) {
      this.dy = -5;
    } else if (angle === 0) {
      this.dy = 0;
    } else if (angle > 0 && angle <= 8) {
      this.dy = 5;
    } else if (angle > 8 && angle <= 20) {
      this.dy = 8;
    } else if (angle > 20) {
      this.dy = 10;
    }
  };

  PongModel.prototype.tick = function () {
    var C = window.GameConstants;

    if (this.gameOver) return;

    if (this.ballPause) {
      this.pauseTicksRemaining--;
      if (this.pauseTicksRemaining <= 0) this.ballPause = false;
      return;
    }

    if (this.gameMode === "cpu") this.cpuMovePaddle();

    this.ballX += this.dx;
    this.ballY += this.dy;

    /* top and bottom walls */
    if (this.ballY <= C.BORDER) {
      this.ballY = C.BORDER;
      this.dy = -this.dy;
    }
    if (this.ballY + C.BALL_SIZE >= this.height - C.BORDER) {
      this.ballY = this.height - C.BORDER - C.BALL_SIZE;
      this.dy = -this.dy;
    }

    var paddleX = (this.gameMode === "solo")
      ? this.width - C.BORDER - C.PADDLE_FILLER - C.PADDLE_WIDTH
      : C.BORDER + C.PADDLE_FILLER;

    /* Overlap split into two axes on purpose — one combined condition was a
       nightmare to debug. Same for the CPU paddle below. */
    var overlapsUpandDown = this.ballY + C.BALL_SIZE >= this.paddleY &&
                            this.ballY <= this.paddleY + C.PADDLE_HEIGHT;
    var overlapsSidetoSide = this.ballX + C.BALL_SIZE >= paddleX &&
                             this.ballX <= paddleX + C.PADDLE_WIDTH;

    if (this.gameMode === "solo") {
      if (this.ballX <= C.BORDER) {          // left wall is the "opponent"
        this.ballX = C.BORDER;
        this.dx = -this.dx;
      }
      if (this.dx > 0 && overlapsUpandDown && overlapsSidetoSide) {
        this.ballX = paddleX - C.BALL_SIZE;
        this.dx = -this.dx;
        this.soloScore++;
        this.bouncing(this.paddleY);
      }
    }

    if (this.gameMode === "cpu") {
      if (this.dx < 0 && overlapsUpandDown && overlapsSidetoSide) {
        this.ballX = paddleX + C.PADDLE_WIDTH;
        this.dx = -this.dx;
        this.bouncing(this.paddleY);
      }

      var cpuPaddleX = this.width - C.BORDER - C.PADDLE_FILLER - C.PADDLE_WIDTH;
      var cpuOverlapsUpandDown = this.ballY + C.BALL_SIZE >= this.cpuPaddleY &&
                                 this.ballY <= this.cpuPaddleY + C.PADDLE_HEIGHT;
      var cpuOverlapsSidetoSide = this.ballX + C.BALL_SIZE >= cpuPaddleX &&
                                  this.ballX <= cpuPaddleX + C.PADDLE_WIDTH;

      if (this.dx > 0 && cpuOverlapsUpandDown && cpuOverlapsSidetoSide) {
        this.ballX = cpuPaddleX - C.BALL_SIZE;
        this.dx = -this.dx;
        this.bouncing(this.cpuPaddleY);
      }
    }

    /* scoring */
    if (this.gameMode === "solo") {
      if (this.ballX + C.BALL_SIZE >= this.width - C.BORDER) {
        this.soloMisses++;
        if (this.soloMisses >= 3) this.gameOver = true;
        this.resetBall();
        this.pause();
      }
    }

    if (this.gameMode === "cpu") {
      if (this.ballX + C.BALL_SIZE <= C.BORDER) {
        this.cpuScore++;
        if (this.cpuScore >= 3) this.gameOver = true;
        this.resetBall();
        this.pause();
        this.dx = 4;
      }
      if (this.ballX + C.BALL_SIZE >= this.width - C.BORDER) {
        this.humanScore++;
        if (this.humanScore >= 3) this.gameOver = true;
        this.resetBall();
        this.pause();
        this.dx = -4;
      }
    }
  };

  window.PongModel = PongModel;
})();
