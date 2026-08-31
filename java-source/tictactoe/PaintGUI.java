import javax.swing.*;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
public class PaintGUI extends JFrame {
    private final IT3Model model;
    public PaintGUI(IT3Model model, int size){
        this.model = model;
        setTitle("Tic-Tac-Toe");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        BoardPanel panel = new BoardPanel();
        panel.setPreferredSize(new Dimension(size,size));
        add(panel);
        pack();
        setLocationRelativeTo(null);
        setVisible(true);
    }

    private class BoardPanel extends JPanel {
        public BoardPanel(){
            addMouseListener(new MouseAdapter() {
                @Override
                public void mousePressed(MouseEvent e) {
                    int width = getWidth() / 3;
                    int height = getHeight() / 3;
                    int row = e.getY() / height;
                    int col = e.getX() / width;

                    if(model.move(row, col)){
                        repaint();
                    }
                    if(model.isGameOver()){
                        showGameOver();
                    }
                }
            });
        }

        @Override
        protected void paintComponent(Graphics g){
            super.paintComponent(g);

            int fullWidth = getWidth();
            int fullHeight = getHeight();
            int cellWidth = fullWidth / 3;
            int cellheight = fullHeight / 3;

            g.drawLine(cellWidth, 0, cellWidth, fullHeight);
            g.drawLine(2 * cellWidth, 0, 2 * cellWidth, fullHeight);
            g.drawLine(0, cellheight, fullWidth, cellheight);
            g.drawLine(0, 2 * cellheight, fullWidth, 2 * cellheight);

            int padding = 20;

            for (int i = 0; i < 3; i++){
                for (int j = 0; j < 3; j++){
                    Player p = model.getCell(i,j);

                    int x = j * cellWidth;
                    int y = i * cellheight;

                    if(p == Player.X){
                        g.drawLine(x + padding, y + padding,
                                x + cellWidth - padding, y + cellheight - padding);
                        g.drawLine(x + padding, y + cellheight - padding,
                                x + cellWidth - padding, y + padding);
                    }
                    if(p == Player.O){
                        g.drawOval(x + padding, y+ padding,
                                cellWidth - 2 * padding, cellheight - 2 * padding);
                    }
                }
            }
        }
        private void showGameOver() {
            String message;

            if (model.getWinner() != Player.NONE){
                message = model.getWinner() + " won!!!!";
            } else {
                message = "It's a tie!";
            }
            int choice = JOptionPane.showConfirmDialog(
                    this,
                    message + "\nPlay again?",
                    "Game Over",
                    JOptionPane.YES_NO_OPTION
            );

            if (choice == JOptionPane.YES_OPTION){
                model.reset();
                repaint();
            }
        }
    }
}
