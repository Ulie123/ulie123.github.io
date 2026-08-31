import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;

public class OthelloGUI extends JFrame {
    private final OthelloModel model;
    private final OthelloComputerAndAI computerAndAI;
    private final JButton[][] buttons;
    private JLabel statusLabel;
    private JLabel scoreLabel;
    private JComboBox<OthelloComputerAndAI.CompType> computerSelection;
    private JSpinner depthSpinner;

    private static final OthelloModel.Player human = OthelloModel.Player.BLACK;
    private static final OthelloModel.Player computer_And_Ai = OthelloModel.Player.WHITE;

    public OthelloGUI() {
        model = new OthelloModel();
        computerAndAI = new OthelloComputerAndAI();
        buttons = new JButton[model.getSize()][model.getSize()];
        setupFrame();
        setupTopPanel();
        setupBoard();
        setupBottomPanel();
        refreshBoard();
        setVisible(true);
    }

    private void setupFrame() {
        setTitle("Othello - Human vs Computer/AI");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout());
        setSize(750, 750);
        setLocationRelativeTo(null);
    }

    private void setupTopPanel() {
        JPanel topPanel = new JPanel();
        computerSelection = new JComboBox<>(OthelloComputerAndAI.CompType.values());
        depthSpinner = new JSpinner(new SpinnerNumberModel(3, 1, 6, 1));
        JButton newGameButton = new JButton("New Game");
        newGameButton.addActionListener(e -> {
            model.resetGame();
            refreshBoard();
        });
        topPanel.add(new JLabel("Computer/AI: "));
        topPanel.add(computerSelection);
        topPanel.add(new JLabel("Minimax Depth "));
        topPanel.add(depthSpinner);
        topPanel.add(newGameButton);
        add(topPanel, BorderLayout.NORTH);
    }

    private void setupBoard() {
        JPanel boardPanel = new JPanel(new GridLayout(8, 8));
        boardPanel.setBackground(new Color(0, 100, 0));
        for (int i = 0; i < model.getSize(); i++) {
            for (int j = 0; j < model.getSize(); j++) {
                JButton button = new JButton();
                button.setBackground((new Color(0, 130, 0)));
                button.setOpaque(true);
                button.setBorder(BorderFactory.createLineBorder(Color.BLACK));
                button.setFocusPainted(false);
                final int row = i;
                final int column = j;
                button.addActionListener((ActionEvent e) -> handleHumanMove(row, column)
                );
                buttons[i][j] = button;
                boardPanel.add(button);
            }
        }
        add(boardPanel, BorderLayout.CENTER);
    }

    private void setupBottomPanel() {
        JPanel bottomPanel = new JPanel(new GridLayout(2, 1));
        statusLabel = new JLabel("Your turn. You are Black.", SwingConstants.CENTER);
        scoreLabel = new JLabel("", SwingConstants.CENTER);
        bottomPanel.add(statusLabel);
        bottomPanel.add(scoreLabel);
        add(bottomPanel, BorderLayout.SOUTH);
    }

    private void handleHumanMove(int row, int column) {
        if (model.isGameOver() == true) {
            return;
        }
        if (model.getCurrentPlayer() != human) {
            return;
        }
        boolean moveMade = model.makeMove(row, column, human);
        if (moveMade == false) {
            JOptionPane.showMessageDialog(this, "Can't do that man");
            return;
        }
        refreshBoard();
        if ((model.isGameOver() == false) && (model.getCurrentPlayer() == computer_And_Ai)) {
            computerMove();
        }
    }

    private void computerMove() {
        Timer timer = new Timer(500, e -> {
            OthelloComputerAndAI.CompType theType = (OthelloComputerAndAI.CompType) computerSelection.getSelectedItem();
            int maximizeDepth = (int) depthSpinner.getValue();
            OthelloModel.Move move = computerAndAI.getComputerMove(model, theType, computer_And_Ai, maximizeDepth);
            if (move != null) {
                model.makeMove(move.row, move.column, computer_And_Ai);
            }
            refreshBoard();
            if (model.isGameOver() == true) {
                showGameOverMessage();
            }
        });
        timer.setRepeats(false);
        timer.start();
    }

    private void refreshBoard() {
        for (int i = 0; i < model.getSize(); i++) {
            for (int j = 0; j < model.getSize(); j++) {
                JButton button = buttons[i][j];
                button.setText("");
                button.setIcon(null);
                OthelloModel.Square square = model.getSquare(i, j);
                if (square == OthelloModel.Square.BLACK) {
                    displayBlackPiece(button);
                } else if (square == OthelloModel.Square.WHITE) {
                    displayWhitePiece(button);
                } else if (model.getCurrentPlayer() == human && model.isValidMove(i, j, human)) {
                    displayPossibleMove(button);
                } else {
                    displayEmptySquare(button);
                }
            }
        }
        updateScoreLabel();
        updateStatusLabel();
    }
    private void displayBlackPiece(JButton button){
        button.setText("●");
        button.setFont(new Font("Arial", Font.BOLD, 42));
        button.setForeground(Color.BLACK);
        button.setBackground(new Color(0,130,0));
    }
    private void displayWhitePiece(JButton button){
        button.setText("●");
        button.setFont(new Font("Arial", Font.BOLD, 42));
        button.setForeground(Color.WHITE);
        button.setBackground(new Color(0,130,0));
    }
    private void displayPossibleMove(JButton button){
        button.setText("●");
        button.setFont(new Font("Arial", Font.BOLD, 42));
        button.setForeground(Color.YELLOW);
        button.setBackground(new Color(0,130,0));
    }
    private void displayEmptySquare(JButton button){
        button.setText("");
        button.setBackground(new Color(0,130,0));
    }
    private void updateScoreLabel(){
        int blackScore = model.countPieces(OthelloModel.Player.BLACK);
        int whiteScore = model.countPieces(OthelloModel.Player.WHITE);
        scoreLabel.setText("Black: " + blackScore + "   White: " + whiteScore);
    }
    private void updateStatusLabel(){
        if (model.isGameOver() == true){
            showGameOverMessage();
        } else if (model.getCurrentPlayer() == human) {
            statusLabel.setText("Your Turn. You are Black");
        } else {
            statusLabel.setText("Computer thinking...");
        }
    }

    private void showGameOverMessage(){
        OthelloModel.Player winner = model.getWinner();
        String message = "Game Over! ";
        if (winner == null){
            message = message + "Tie game!!";
        } else if (winner == human) {
            message = message + "YOU WIN!!! CONGRATS!!!";
        } else {
            message = message + "Computer won :(";
        }
        statusLabel.setText(message);
    }

    public static void main(String[] args){
        SwingUtilities.invokeLater(OthelloGUI::new);
    }
}
