import javax.swing.*;
import java.awt.*;

public class ButtonGUI extends JFrame{
    private final IT3Model model;
    private final JButton[][] squares;
    private final JLabel statusBar;
    private final JButton newGame;
    private JPanel grid;

    public ButtonGUI(IT3Model model, int size) {
        this.model = model;

        setTitle("Tic-Tac-Toe");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        squares = new JButton[3][3];
        statusBar = new JLabel("");
        newGame = new JButton("New Game");
        buildBoard();
        grid.setPreferredSize(new Dimension(size, size));
        buildBottom();
        updateStatus();
        refreshBoard();

        pack();
        setLocationRelativeTo(null);
        setVisible(true);

    }

        private void buildBoard(){
            grid = new JPanel(new GridLayout(3,3));
            for (int i = 0; i < 3; i++){
                for (int j = 0; j < 3; j++){
                    JButton square = new JButton(" ");
                    squares[i][j] = square;
                    int row = i;
                    int column = j;
                    square.addActionListener(e ->{
                        if(!model.move(row, column)) {
                            return;
                        }
                        refreshBoard();
                        updateStatus();

                        if(model.isGameOver()) {
                            disableSquares();
                            showGameOverDialog();
                        }
                    });
                    grid.add(square);
                }
            }
            add(grid, BorderLayout.CENTER);
        }

        private void buildBottom(){
            JPanel panel = new JPanel();
            panel.add(statusBar);
            panel.add(newGame);

            newGame.addActionListener(e -> newGame());
            add(panel, BorderLayout.SOUTH);

        }

        private void refreshBoard() {
            for (int i = 0; i < 3; i++){
                for (int j = 0; j < 3; j++){
                    Player p = model.getCell(i,j);
                    if (p == Player.NONE){
                        squares[i][j].setText("");
                        squares[i][j].setEnabled(!model.isGameOver());
                    } else{
                        squares[i][j].setText(p.name());
                        squares[i][j].setEnabled(false);
                    }
                }
            }
        }

        private void newGame() {
            model.reset();
            for(int i = 0; i < 3; i++){
                for (int j = 0; j < 3; j++){
                    squares[i][j].setText("");
                    squares[i][j].setEnabled(true);
                }
            }
            refreshBoard();
            updateStatus();

        }
        private void updateStatus(){
            if (model.getWinner() != Player.NONE){
                statusBar.setText(model.getWinner() + " Won!");
            } else if (model.isTie()) {
                statusBar.setText("Tie Game!");
            } else {
                statusBar.setText(model.getCurrentPlayer() + "'s turn");
            }
        }

        private void disableSquares(){
            for(int i = 0; i < 3; i++) {
                for (int j = 0; j < 3; j++) {
                    squares[i][j].setEnabled(false);
                }
            }
        }

    private void showGameOverDialog() {
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
    }
    }

}
