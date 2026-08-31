public class PongModel {
    int ballX;
    int ballY;
    int dx = 4;
    int dy = 4;
    int width;
    int height;
    int paddleY;
    String gameMode;
    int soloScore;
    int soloMisses;
    boolean gameOver;
    boolean ballPause;
    int pauseTicksRemaining;
    int cpuPaddleY;
    int humanScore;
    int cpuScore;

    public PongModel(int width, int height, String gameMode) {
        this.width = width;
        this.height = height;
        this.gameMode = gameMode;
        resetBall();
        resetPaddle();
        soloScore = 0;
        soloMisses = 0;
        humanScore = 0;
        cpuScore = 0;
        gameOver = false;
        ballPause = false;
        pauseTicksRemaining = 0;
        cpuPaddleY = height / 2 - GameConstants.PADDLE_HEIGHT / 2;
    }

    public void resetGame() {
        soloScore = 0;
        soloMisses = 0;
        humanScore = 0;
        cpuScore = 0;
        gameOver = false;
        dx = 4;
        dy = 4;
        resetPaddle();
        resetBall();
        ballPause = false;
        pauseTicksRemaining = 0;
        cpuPaddleY = height / 2 - GameConstants.PADDLE_HEIGHT / 2;
    }

    public void pause() {
        ballPause = true;
        pauseTicksRemaining = 60;
    }

    public void resetBall() {
        ballX = width / 2 - GameConstants.BALL_SIZE / 2;
        ballY = height / 2 - GameConstants.BALL_SIZE / 2;
    }

    public void resetPaddle() {
        paddleY = height / 2 - GameConstants.PADDLE_HEIGHT / 2;
    }

    public void movePaddle(int amount) {
        paddleY += amount;
        if (paddleY < GameConstants.BORDER) {
            paddleY = GameConstants.BORDER;
        }
        if (paddleY + GameConstants.PADDLE_HEIGHT > height - GameConstants.BORDER) {
            paddleY = height - GameConstants.BORDER - GameConstants.PADDLE_HEIGHT;
        }
    }

    public void cpuMovePaddle() {
        int cpuCenter = cpuPaddleY + GameConstants.PADDLE_HEIGHT / 2;
        int ballCenter = ballY + GameConstants.BALL_SIZE / 2;
        int cpuSpeed = 6;

        if (ballCenter < cpuCenter) {
            cpuPaddleY -= cpuSpeed;
        }
        if (ballCenter > cpuCenter) {
            cpuPaddleY += cpuSpeed;
        }

        if (cpuPaddleY < GameConstants.BORDER) {
            cpuPaddleY = GameConstants.BORDER;
        }
        if (cpuPaddleY + GameConstants.PADDLE_HEIGHT > height - GameConstants.BORDER) {
            cpuPaddleY = height - GameConstants.BORDER - GameConstants.PADDLE_HEIGHT;
        }
    }
    public void bouncing(int paddleTopY) {
        int paddleCenter = paddleTopY + GameConstants.PADDLE_HEIGHT / 2;
        int ballCenter = ballY + GameConstants.BALL_SIZE / 2;
        int angle = ballCenter - paddleCenter;

        if (angle <= -20) {
            dy = -10;
        } else if (angle <= -8 && angle > -20) {
            dy = -8;
        } else if (angle >= -8 && angle < 0) {
            dy = -5;
        } else if (angle == 0) {
            dy = 0;
        } else if (angle > 0 && angle <= 8) {
            dy = 5;
        } else if (angle > 8 && angle <= 20) {
            dy = 8;
        } else if (angle > 20) {
            dy = 10;
        }

    }
    public void tick() {
        if (gameOver == true) {
            return;
        }
        if (ballPause == true) {
            pauseTicksRemaining--;
            if (pauseTicksRemaining <= 0) {
                ballPause = false;
            }
            return;
        }
        if (gameMode.equals("cpu")) {
            cpuMovePaddle();
        }
        ballX += dx;
        ballY += dy;
        if (ballY <= GameConstants.BORDER){
            ballY = GameConstants.BORDER;
            dy = -dy;
        }
        if (ballY + GameConstants.BALL_SIZE >= height - GameConstants.BORDER) {
            ballY = height - GameConstants.BORDER -GameConstants.BALL_SIZE;
            dy = -dy;
        }
        int paddleX;
        if (gameMode.equals("solo")) {
            paddleX = width - GameConstants.BORDER - GameConstants.PADDLE_FILLER- GameConstants.PADDLE_WIDTH;
        } else {
          paddleX = GameConstants.BORDER + GameConstants.PADDLE_FILLER;
        }
        boolean overlapsUpandDown = ballY + GameConstants.BALL_SIZE >= paddleY &&
                ballY <= paddleY + GameConstants.PADDLE_HEIGHT;
        boolean overlapsSidetoSide = ballX + GameConstants.BALL_SIZE >= paddleX &&
                ballX <= paddleX + GameConstants.PADDLE_WIDTH;;
        if (gameMode.equals("solo")) {
            if(ballX <= GameConstants.BORDER){
                ballX = GameConstants.BORDER;
                dx = -dx;
            }
            if (dx > 0 && overlapsUpandDown && overlapsSidetoSide) {
                ballX = paddleX - GameConstants.BALL_SIZE;
                dx = -dx;
                soloScore++;
                bouncing(paddleY);
            }
        }

        if (gameMode.equals("cpu")) {
            if(dx < 0 && overlapsUpandDown && overlapsSidetoSide){
                ballX = paddleX + GameConstants.PADDLE_WIDTH;
                dx = -dx;
                bouncing(paddleY);
            }
            int cpuPaddleX = width - GameConstants.BORDER - GameConstants.PADDLE_FILLER - GameConstants.PADDLE_WIDTH;

            boolean cpuOverlapsUpandDown = ballY + GameConstants.BALL_SIZE >= cpuPaddleY &&
                    ballY <= cpuPaddleY + GameConstants.PADDLE_HEIGHT;
            boolean cpuOverlapsSidetoSide = ballX + GameConstants.BALL_SIZE >= cpuPaddleX &&
                    ballX <= cpuPaddleX + GameConstants.PADDLE_WIDTH;
            if (dx > 0 && cpuOverlapsUpandDown && cpuOverlapsSidetoSide) {
                ballX = cpuPaddleX - GameConstants.BALL_SIZE;
                dx = -dx;
                bouncing(cpuPaddleY);
            }
        }
        if (gameMode.equals("solo")) {
            if (ballX + GameConstants.BALL_SIZE >= width - GameConstants.BORDER) {
                soloMisses++;
                if (soloMisses >= 3) {
                    gameOver = true;
                }
                resetBall();
                pause();
            }
        }
        if (gameMode.equals("cpu")) {
            if (ballX + GameConstants.BALL_SIZE<= GameConstants.BORDER) {
                cpuScore++;
                if (cpuScore >= 3) {
                    gameOver = true;
                }
                resetBall();
                pause();
                dx = 4;
            }
            if (ballX + GameConstants.BALL_SIZE >= width - GameConstants.BORDER) {
                humanScore++;
                if (humanScore >= 3) {
                    gameOver = true;
                }
                resetBall();
                pause();
                dx = -4;
            }
        }
    }
}
