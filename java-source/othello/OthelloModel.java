import java.util.ArrayList;
import java.util.List;
public class OthelloModel {
    private final int size = 8;
    private final Square[][] board;
    private Player currentPlayer;

    public OthelloModel(){
        board = new Square[size][size];
        resetGame();
    }

    public void resetGame(){
        for (int i = 0; i < size; i++){
            for (int j = 0; j < size; j++){
                board[i][j] = Square.EMPTY;
            }
        }
        board[3][3] = Square.WHITE;
        board[3][4] = Square.BLACK;
        board[4][3] = Square.BLACK;
        board[4][4] = Square.WHITE;
        currentPlayer = Player.BLACK;
    }
    public int getSize(){
        return size;
    }
    public Square getSquare(int row, int column){
        return board[row][column];
    }

    public Player getCurrentPlayer() {
        return currentPlayer;
    }
    public void switchTurn(){
        currentPlayer = opponent(currentPlayer);
    }
    public Player opponent(Player player){
        if(player == Player.BLACK){
            return Player.WHITE;
        }
        return Player.BLACK;
    }
    public Square playersSquare(Player player){
        if (player == Player.BLACK){
            return Square.BLACK;
        }
        return Square.WHITE;
    }
    public  Square opponentSquareColor(Player player){
        if( player == Player.BLACK){
            return Square.WHITE;
        }
        return Square.BLACK;
    }

    public  boolean isValidMove(int row, int column, Player player){
        if (isInside(row, column) == false){
            return false;
        }
        if (board[row][column] != Square.EMPTY){
            return false;
        }
        int[][] directions = getDirections();

        for (int[] direction : directions){
            if (capturesInAnyDirection(row, column, direction[0], direction[1], player) == true){
                return true;
            }
        }
        return false;
    }

    private boolean isInside(int row, int column){
        if ((row >= 0 && row < size && column >= 0 && column < size) == true){
            return true;
        }
        return false;
    }
    private int[][] getDirections(){
        int[][] directions = new int[][]{ {-1,-1}, {-1, 0}, {-1, 1}, {0,-1}, {0,1}, {1,-1}, {1, 0}, {1,1}};
        return directions;
    }

    private boolean capturesInAnyDirection(int row, int column, int directionRow, int directionColumn, Player player){
        int r = row + directionRow;
        int c = column + directionColumn;
        Square opponent = opponentSquareColor(player);
        Square own = playersSquare(player);
        boolean foundOpponent = false;

        while(isInside(r,c) == true){
            if(board[r][c] == opponent){
                foundOpponent = true;
            } else if (board[r][c] == own) {
                return foundOpponent;
            } else{
                return false;
            }
            r += directionRow;
            c += directionColumn;
        }
        return false;
    }

    private void flipInDirection(int row, int column, int directionRow, int directionColumn, Player player){
        int r = row + directionRow;
        int c = column + directionColumn;
        Square opponent = opponentSquareColor(player);
        Square own = playersSquare(player);

        while(isInside(r,c) == true && board[r][c] == opponent) {
            board[r][c] = own;
            r += directionRow;
            c += directionColumn;
        }
    }
    public List<Move> getValidMoves(Player player){
        List<Move> moves = new ArrayList<>();
        for (int i = 0; i < size; i++){
            for (int j = 0; j < size; j++){
                if (isValidMove(i,j, player)){
                    moves.add(new Move(i,j));
                }
            }
        }
        return moves;
    }
    public boolean makeMove(int row, int column, Player player){
        if (isValidMove(row, column, player) == false){
            return false;
        }
        board[row][column] = playersSquare(player);
        int[][] directions = getDirections();
        for (int[] direction : directions){
            if (capturesInAnyDirection(row, column, direction[0], direction[1], player) == true){
                flipInDirection(row, column, direction[0], direction[1], player);
            }
        }
        currentPlayer = opponent(player);
        handleSkips();
        return true;
    }

    private void handleSkips(){
        if (getValidMoves(currentPlayer).isEmpty() && isGameOver() == false){
            currentPlayer = opponent(currentPlayer);
        }
    }
    public int countPieces(Player player){
        Square correctColor = playersSquare(player);
        int count = 0;
        for (int i = 0; i < size; i++){
            for (int j = 0; j < size; j++){
                if (board[i][j] == correctColor){
                    count++;
                }
            }
        }
        return count;
    }
    public boolean isGameOver(){
        if (getValidMoves(Player.BLACK).isEmpty() && getValidMoves(Player.WHITE).isEmpty()){
            return true;
        }
        return false;
    }
    public Player getWinner(){
        int black = countPieces(Player.BLACK);
        int white = countPieces(Player.WHITE);

        if (black > white){
            return Player.BLACK;
        } else if (white > black) {
            return Player.WHITE;
        } else {
            return null;
        }
    }

    public int checkWhoIsWinning(Player player){
        Player opponent = opponent(player);
        int score = countPieces(player) - countPieces(opponent);
        return score;
    }

    public OthelloModel copyBoard(){
        OthelloModel copy = new OthelloModel();
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                copy.board[i][j] = this.board[i][j];
            }
        }
        copy.currentPlayer = this.currentPlayer;
        return copy;
    }

    public enum Square{
        EMPTY, WHITE, BLACK
    }

    public enum Player{
        WHITE, BLACK
    }

    public static class Move {
        public final int row;
        public final int column;

        public Move(int row, int column) {
            this.row = row;
            this.column = column;
        }

        @Override
        public String toString(){
            return "(" + row + ", " + column + ")";
        }
    }

}
