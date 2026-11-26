import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

public class ShipSamplingOracle {
    public static void main(String[] args) {
        for (int[] dimensions : new int[][]{{78, 72}}) {
            int sw = dimensions[0], sh = dimensions[1];
            BufferedImage image = new BufferedImage(sw, sh, BufferedImage.TYPE_4BYTE_ABGR);
            for (int y = 0; y < sh; y++) for (int x = 0; x < sw; x++)
                image.setRGB(x, y, 0xff000000 | (((x >> 8) + 1) << 16) | ((x & 255) << 8) | (y + 1));
            for (int width : new int[]{408, 600, 832, 864, 1000, 1280}) {
                double zoom = width / 1664.0;
                for (int ox : new int[]{0, 15}) for (int x : new int[]{-50, 0, 200, 592}) {
                    int y = 576, oy = 107;
                    BufferedImage output = new BufferedImage(width, 900, BufferedImage.TYPE_INT_RGB);
                    Graphics2D g = output.createGraphics();
                    g.translate(ox, oy); g.scale(zoom, zoom);
                    g.drawImage(image, x, y, sw * 2, sh * 2, null); g.dispose();
                    int left = Math.max(0, (int) Math.floor(ox + x * zoom));
                    int right = Math.min(width, (int) Math.ceil(ox + (x + sw * 2) * zoom));
                    int top = Math.max(0, (int) Math.floor(oy + y * zoom));
                    int bottom = Math.min(900, (int) Math.ceil(oy + (y + sh * 2) * zoom));
                    for (int py = top; py < bottom; py += 7) for (int px = left; px < right; px += 11) {
                        int color = output.getRGB(px, py);
                        int high = ((color >> 16) & 255) - 1, sy = (color & 255) - 1;
                        if (high >= 0 && sy >= 0) {
                            int sx = (high << 8) | ((color >> 8) & 255);
                            System.out.printf("%d,%d,%d,%d,%d,%d,%d,%d,%d,%d%n", width, ox, oy, sw, sh, x, y, px, py, (sx << 8) | sy);
                        }
                    }
                }
            }
        }
    }
}
