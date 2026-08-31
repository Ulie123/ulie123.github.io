public interface IT3Model {

    boolean move(int row, int col);
    Player getCurrentPlayer();
    Player getWinner();
    boolean isGameOver();
    boolean isTie();
    Player getCell(int row, int col);
    void reset();
}
