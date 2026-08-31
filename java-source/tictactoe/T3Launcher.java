import java.util.Locale;

public class T3Launcher {
    public static void main(String[] args){
        if (args.length < 1){
            printUsage();
            return;
        }
        String mode = args[0].toLowerCase();
        int size = 450;
        if (args.length >= 2) {
            try {
                size = Integer.parseInt(args[1]);
                if (size < 200) {
                    size = 200;
                }
            } catch (NumberFormatException e) {

            }
        }
            IT3Model model = new T3Model();

            switch (mode){
                case "buttons":
                    new ButtonGUI(model, size);
                    break;
                case "paint":
                    new PaintGUI(model, size);
                    break;
                case "console":
                    new ConsoleUI(model);
                    break;
                default:
                    printUsage();
            }
        }

    private static void printUsage(){
        System.out.println("Usage:");
        System.out.println("java T3 Launchers buttons [size]");
        System.out.println("java T3Launcher paint [size]");
        System.out.println("java T3Launcher console");
        System.out.println();
        System.out.println("Examples:");
        System.out.println("java T3Launcher buttons");
        System.out.println("java T3Launcher paint 600");
        System.out.println("java T3Launcher console");
    }
}
