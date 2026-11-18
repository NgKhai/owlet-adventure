import java.awt.event.MouseEvent;
import main.GamePanel;

public class MouseCoordinateOracle {
    public static void main(String[] args) {
        int[][] sizes = {{745, 400}, {1553, 736}, {864, 900}, {600, 900}, {1280, 720}, {1920, 1080}};
        GamePanel panel = new GamePanel(null);
        for (int[] size : sizes) {
            panel.setSize(size[0], size[1]);
            for (int x = 0; x < size[0]; x++) {
                int y = (x * 37) % size[1];
                MouseEvent event = new MouseEvent(panel, MouseEvent.MOUSE_MOVED, 0, 0, x, y, x, y, 0, false, MouseEvent.NOBUTTON);
                MouseEvent mapped = panel.toGameCoordinates(event);
                System.out.printf("%d,%d,%d,%d,%d,%d%n", size[0], size[1], x, y, mapped.getX(), mapped.getY());
            }
        }
    }
}
