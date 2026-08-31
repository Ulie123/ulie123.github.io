import javax.swing.JPanel;
import java.awt.*;
import javax.swing.Timer;
import javax.swing.JOptionPane;

public class PongPanel extends JPanel{
    private String gameMode;
    private PongModel model;

    public PongPanel(String gameMode){
        this.gameMode = gameMode;
        model = new PongModel(GameConstants.WINDOW_WIDTH,GameConstants.WINDOW_HEIGHT, gameMode);
        Timer timer = new Timer(GameConstants.TIMER_DELAY,e -> {
            model.tick();
            repaint();

            if (model.gameOver == true){
                String message = "";
                if (gameMode.equals("solo")){
                    message = "Game Over! Final Score: " + model.soloScore + "\nPlay Again?";
                }
                if (gameMode.equals("cpu")){
                    String winner = "";
                    if (model.humanScore >= 3){
                        winner = "You win!";
                    }
                    if (model.cpuScore >= 3){
                        winner = "CPU wins!";
                    }
                    message = winner + "\nFinal Score - You: " + model.humanScore + ", CPU: " + model.cpuScore + "\nPlay Again?";
                }
                int choice = JOptionPane.showConfirmDialog(
                        this,
                        message,
                        "Pong",
                        JOptionPane.YES_NO_OPTION);
                if (choice == JOptionPane.YES_OPTION){
                    model.resetGame();
                }else{
                    System.exit(0);
                }
            }
        });
        timer.start();
        addMouseWheelListener(e ->{
            int scrollAmount = e.getWheelRotation() * GameConstants.SCROLL_AMOUNT;
            model.movePaddle(scrollAmount);
            repaint();
        });
    }

    @Override
    protected void paintComponent(Graphics g){
        super.paintComponent(g);
        g.setColor(Color.BLACK);
        g.fillRect(0,0,getWidth(),getHeight());
        g.setColor(Color.DARK_GRAY);
        g.drawRect(GameConstants.BORDER,GameConstants.BORDER, getWidth() - 2* GameConstants.BORDER, getHeight() - 2 * GameConstants.BORDER);
        if (gameMode.equals("cpu")){
            int centerX = GameConstants.DASH_WIDTH / 2;
            g.setColor(Color.DARK_GRAY);
            for (int y = GameConstants.BORDER; y < getHeight() - GameConstants.BORDER; y += GameConstants.DASH_GAP){
                g.fillRect(centerX - GameConstants.DASH_WIDTH, y, GameConstants.DASH_WIDTH, GameConstants.DASH_HEIGHT);
            }
        }
        g.setColor(Color.WHITE);
        g.fillOval(model.ballX, model.ballY, GameConstants.BALL_SIZE, GameConstants.BALL_SIZE);
        int paddleX;
        if (gameMode.equals("solo")){
            paddleX = getWidth() - GameConstants.BORDER - GameConstants.PADDLE_FILLER - GameConstants.PADDLE_WIDTH;
            g.fillRect(paddleX, model.paddleY, GameConstants.PADDLE_WIDTH, GameConstants.PADDLE_HEIGHT);

        }

        if (gameMode.equals("cpu")){
            paddleX = GameConstants.BORDER + GameConstants.PADDLE_FILLER;
            int cpuPaddleX = getWidth() - GameConstants.BORDER - GameConstants.PADDLE_FILLER - GameConstants.PADDLE_WIDTH;
            g.fillRect(cpuPaddleX, model.cpuPaddleY, GameConstants.PADDLE_WIDTH, GameConstants.PADDLE_HEIGHT);
            g.fillRect(paddleX, model.paddleY, GameConstants.PADDLE_WIDTH, GameConstants.PADDLE_HEIGHT);

        }

        g.setColor(Color.WHITE);
        if (gameMode.equals("solo")){
            g.drawString("Score: " + model.soloScore, GameConstants.SOLO_SCORE_X, GameConstants.SCORE_Y);
            g.drawString("Misses: " + model.soloMisses, GameConstants.SOLO_MISSES_X, GameConstants.SCORE_Y);
        }
        if (gameMode.equals("cpu")){
            g.drawString("YOU: " + model.humanScore, GameConstants.SOLO_SCORE_X, GameConstants.SCORE_Y);
            g.drawString("CPU: " + model.cpuScore, getWidth() - GameConstants.BORDER - GameConstants.CPU_SCORE_OFFSET, GameConstants.SCORE_Y);
        }
    }

}
