import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class T3Model implements IT3Model {

    public enum GameState {Still_Going, X_WON, O_WON, Tie_Game};

    private final Player[][] board;
    private Player player;
    private GameState gameState;
    public T3Model(){
        board = new Player[3][3];
        reset();
    }

    @Override
    public boolean move(int row, int col) {
        if (gameState != gameState.Still_Going){
            return false;
        }
        if (row < 0 || row >= 3 || col < 0 || col >= 3){
            return false;
        }
        if (board[row][col] != Player.NONE){
            return false;
        }
        board[row][col] = player;
        checkForWin();

        if (gameState == gameState.Still_Going) {
            changePlayer();
        }
        return true;
    }

    @Override
    public Player getCurrentPlayer() {
        return player;
    }

    @Override
    public Player getWinner() {
        if(gameState == GameState.X_WON) {
            return Player.X;
        }
        if(gameState == GameState.O_WON){
            return Player.O;
        }
        return Player.NONE;
    }
    @Override
    public boolean isGameOver() {
        return gameState != GameState.Still_Going;
    }

    @Override
    public boolean isTie() {
        return gameState == GameState.Tie_Game;
    }

    @Override
    public Player getCell(int row, int col) {
        if (row < 0 || row >= 3 || col < 0 || col >= 3){
            return Player.NONE;
        }
        return board[row][col];
    }

    @Override
    public void reset() {
        for (int i = 0; i < 3; i++){
            for (int j = 0; j < 3; j++){
                board[i][j] = Player.NONE;
            }
        }
        player = Player.X;
        gameState = gameState.Still_Going;

    }
    private void changePlayer(){
        if (player == Player.X){
            player = Player.O;
            return;
        }
        player = Player.X;
    }
    private void checkForWin(){
        for (int i = 0; i < 3; i++){
            if (board[i][0] != Player.NONE
                    && board[i][0] == board[i][1]
                    && board[i][1] == board[i][2]){
                if (player == Player.X){
                    gameState = gameState.X_WON;
                    return;
                }
                gameState = gameState.O_WON;
            }
        }
        for (int i = 0; i < 3; i++){
            if (board[0][i] != Player.NONE
                    && board[0][i] == board[1][i]
                    && board[1][i] == board[2][i]){
                if (player == Player.X){
                    gameState = gameState.X_WON;
                    return;
                }
                gameState = gameState.O_WON;
            }
        }
        if (board[0][0] != Player.NONE
                && board[0][0] == board[1][1]
                && board[1][1] == board[2][2]){
            if (player == Player.X){
                gameState = gameState.X_WON;
                return;
            }
            gameState = gameState.O_WON;
        }
        if (board[0][2] != Player.NONE
                && board[0][2] == board[1][1]
                && board[1][1] == board[2][0]){
            if (player == Player.X){
                gameState = gameState.X_WON;
                return;
            }
            gameState = gameState.O_WON;
        }
        if(boardIsFull() == true){
            gameState = gameState.Tie_Game;
        }
    }

    private boolean boardIsFull(){
        for (int i = 0; i <3; i++){
            for (int j = 0; j < 3; j++){
                if (board[i][j] == Player.NONE){
                    return false;
                }
            }
        }
        return true;
    }
}
