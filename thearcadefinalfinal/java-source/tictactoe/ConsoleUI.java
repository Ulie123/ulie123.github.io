import java.util.Locale;
import java.util.Scanner;

public class ConsoleUI {
    private final IT3Model model;
    private final Scanner in = new Scanner(System.in);
    public ConsoleUI(IT3Model model) {
        this.model = model;
        gameLoop();
    }

    private void gameLoop(){
        while (true){
            model.reset();
            while (!model.isGameOver()) {
                printBoard();
                System.out.println();
                System.out.println("Turn for: " + model.getCurrentPlayer());
                System.out.println("Enter move: ");
                String s = in.nextLine().trim().toUpperCase(Locale.ROOT);
                if (!tryMoveFromString(s)) {
                    System.out.println("Illegal Move. Give it another go bub");
                }
            }
            printBoard();
            if (model.getWinner() != Player.NONE){
                System.out.println("\nWinner: " + model.getWinner());
            } else {
                System.out.println("Tie game!!");
            }
            System.out.print("Play again? (y/n): ");
            String playAgain = in.nextLine().trim().toLowerCase(Locale.ROOT);
            if (!playAgain.equals("y")){
                break;
            }
        }
    }
    private boolean tryMoveFromString(String s){
        if (s.length() != 2){
            return false;
        }
        char columnChar = s.charAt(0);
        char rowChar = s.charAt(1);

        int column = switch (columnChar){
            case 'A' -> 0;
            case 'B' -> 1;
            case 'C' -> 2;
            default -> -1;
        };
        int row = switch (rowChar){
            case '1' -> 0;
            case '2' -> 1;
            case '3' -> 2;
            default -> -1;
        };
        if (row == -1 || column == -1){
            return false;
        }
        return model.move(row, column);
    }

    private void printBoard(){
        System.out.println("    A   B   C");
        System.out.println("  ┌───┬───┬───┐");
        for (int i = 0; i < 3; i++){
            System.out.print((i + 1) + " |");
            for (int j = 0; j < 3; j++){
                Player p = model.getCell(i,j);
                String cell = " ";
                if (p != Player.NONE){
                    cell = p.name();
                }
                System.out.print(" " + cell + " |");
            }
            System.out.println();
            if(i < 2){
                System.out.println("  ├───┼───┼───┤");
            }
        }
        System.out.println("  └───┴───┴───┘");
    }
}
