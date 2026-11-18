import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

public class RectOracle {
    private static void emit(double scale, int offset, int x, int width) {
        BufferedImage image = new BufferedImage(1200, 1, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.WHITE);
        g.translate(offset, 0);
        g.scale(scale, 1);
        g.fillRect(x, 0, width, 1);
        g.dispose();
        int first = -1, last = -1;
        for (int i = 0; i < image.getWidth(); i++) {
            if (image.getRGB(i, 0) != 0xff000000) {
                if (first < 0) first = i;
                last = i;
            }
        }
        System.out.println(scale + "," + offset + "," + x + "," + width + "," + first + "," + last);
    }

    public static void main(String[] args) {
        for (double scale : new double[]{600d / 1664, 1280d / 1664, 1, 0.5, 0.9}) {
            for (int offset : new int[]{0, 15, 288}) {
                for (int x : new int[]{0, 1, 44, 88, 108}) {
                    for (int width : new int[]{1, 4, 8, 50, 208, 300}) {
                        emit(scale, offset, x, width);
                    }
                }
            }
        }
        for (double scale : new double[]{600d / 1664, 1280d / 1664, 1023d / 1664})
            for (int offset : new int[]{0, 15})
                for (int x : new int[]{88, 108})
                    for (int width = 0; width <= (x == 88 ? 300 : 208); width++)
                        emit(scale, offset, x, width);
    }
}
