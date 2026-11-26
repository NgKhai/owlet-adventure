import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

public class TileSamplingOracle {
    public static void main(String[] args) {
        BufferedImage tile = new BufferedImage(32, 32, BufferedImage.TYPE_4BYTE_ABGR);
        for (int y = 0; y < 32; y++) for (int x = 0; x < 32; x++)
            tile.setRGB(x, y, 0xff000000 | ((x + 1) << 16) | ((y + 1) << 8));

        for (int width : new int[]{408, 600, 832, 864, 1000, 1280}) {
            double zoom = width / 1664.0;
            for (int offsetX : new int[]{0, 15}) for (int x : new int[]{-37, 0, 1, 64, 127, 1500})
                for (int y : new int[]{-17, 0, 1, 64}) {
                    BufferedImage output = new BufferedImage(width, 128, BufferedImage.TYPE_INT_RGB);
                    Graphics2D g = output.createGraphics();
                    g.translate(offsetX, 20);
                    g.scale(zoom, zoom);
                    g.drawImage(tile, x, y, 64, 64, null);
                    g.dispose();
                    int left = Math.max(0, (int) Math.floor(offsetX + x * zoom));
                    int right = Math.min(width, (int) Math.ceil(offsetX + (x + 64) * zoom));
                    int top = Math.max(0, (int) Math.floor(20 + y * zoom));
                    int bottom = Math.min(128, (int) Math.ceil(20 + (y + 64) * zoom));
                    for (int py = top; py < bottom; py += 3) for (int px = left; px < right; px += 3) {
                        int color = output.getRGB(px, py);
                        int sx = ((color >> 16) & 255) - 1, sy = ((color >> 8) & 255) - 1;
                        if (sx >= 0 && sy >= 0)
                            System.out.printf("%d,%d,%d,%d,%d,%d,%d,%d%n", width, offsetX, x, y, px, py, sx, sy);
                    }
                }
        }
    }
}
