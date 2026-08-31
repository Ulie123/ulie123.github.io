import javax.swing.JFrame;
import java.awt.Dimension;

public class PongLauncher {

    public static void main(String[] args){
        if (args.length != 1 || (!args[0].equals("solo") && (!args[0].equals("cpu")))){
            System.err.println("Usage: java PongLauncher <solo|cpu>");
            System.exit(1);
        }
        JFrame frame = new JFrame("Pong");
        PongPanel panel = new PongPanel(args[0]);
        panel.setPreferredSize(new Dimension(GameConstants.WINDOW_WIDTH, GameConstants.WINDOW_HEIGHT));
        frame.add(panel);
        frame.pack();
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setResizable(false);
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }
}
