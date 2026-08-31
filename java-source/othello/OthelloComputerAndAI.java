import java.util.List;

public class OthelloComputerAndAI {
    public enum CompType {
        GREEDY_CPU, MINIMAX_AI
    }

    public OthelloModel.Move getComputerMove(OthelloModel model, CompType compType, OthelloModel.Player computerPlayer, int minimaxDepth){
        if(compType == CompType.GREEDY_CPU){
            return getGreedyCpuMove(model, computerPlayer);
        } else {
            return getMinimaxAiMove(model,computerPlayer,minimaxDepth);
        }
    }

    public OthelloModel.Move getGreedyCpuMove(OthelloModel model, OthelloModel.Player player){
        List<OthelloModel.Move> moves = model.getValidMoves(player);
        if(moves.isEmpty() == true){
            return null;
        }
        OthelloModel.Move bestMove = null;
        int bestScore = Integer.MIN_VALUE;

        for (OthelloModel.Move move: moves){
            OthelloModel copy = model.copyBoard();
            int scoreBeforeMove = copy.countPieces(player);
            copy.makeMove(move.row, move.column, player);
            int scoreAfterMove = copy.countPieces(player);
            int gainThisMove = scoreAfterMove - scoreBeforeMove;

            if (gainThisMove > bestScore){
                bestScore = gainThisMove;
                bestMove = move;
            }
        }
        return bestMove;
    }
    public OthelloModel.Move getMinimaxAiMove(OthelloModel model, OthelloModel.Player player, int minimaxDepth){
        List<OthelloModel.Move> moves = model.getValidMoves(player);
        if(moves.isEmpty() == true){
            return null;
        }
        OthelloModel.Move bestMove = null;
        int bestScore = Integer.MIN_VALUE;

        for (OthelloModel.Move move: moves) {
            OthelloModel copy = model.copyBoard();
            copy.makeMove(move.row, move.column, player);
            int score = minimax(copy,minimaxDepth - 1, false, player);
            if (score > bestScore){
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }
    private int minimax(OthelloModel model, int minimaxDepth, boolean maxmize, OthelloModel.Player player){
        if (minimaxDepth == 0 || model.isGameOver() == true){
            return model.checkWhoIsWinning(player);
        }
        OthelloModel.Player currentPlayer = model.getCurrentPlayer();
        List<OthelloModel.Move> moves = model.getValidMoves(currentPlayer);
        if(moves.isEmpty() == true){
            OthelloModel copy = model.copyBoard();
            copy.switchTurn();
            return minimax(copy, minimaxDepth - 1, !maxmize, player);
        }
        if (maxmize == true){
            return getMaxScore(model, moves, minimaxDepth, player);
        } else {
            return getMinScore(model, moves, minimaxDepth, player);
        }
    }

    private int getMaxScore(OthelloModel model, List<OthelloModel.Move> moves, int minimaxDepth, OthelloModel.Player player){
        int bestScore = Integer.MIN_VALUE;
        for (OthelloModel.Move move: moves) {
            OthelloModel copy = model.copyBoard();
            copy.makeMove(move.row, move.column, model.getCurrentPlayer());
            int score = minimax(copy, minimaxDepth - 1, false, player);
            bestScore = Math.max(bestScore, score);
        }
        return bestScore;
    }
    private int getMinScore(OthelloModel model, List<OthelloModel.Move> moves, int minimaxDepth, OthelloModel.Player player){
        int bestScore = Integer.MAX_VALUE;
        for (OthelloModel.Move move: moves) {
            OthelloModel copy = model.copyBoard();
            copy.makeMove(move.row, move.column, model.getCurrentPlayer());
            int score = minimax(copy, minimaxDepth - 1, true, player);
            bestScore = Math.min(bestScore, score);
        }
        return bestScore;
    }
}
