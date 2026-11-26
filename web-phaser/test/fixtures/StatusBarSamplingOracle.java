import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

public class StatusBarSamplingOracle {
    public static void main(String[] args) {
        BufferedImage image = new BufferedImage(192, 58, BufferedImage.TYPE_4BYTE_ABGR);
        for (int y = 0; y < 58; y++) for (int x = 0; x < 192; x++)
            image.setRGB(x, y, 0xff000000 | ((x + 1) << 16) | ((y + 1) << 8));
        for (int width : new int[]{408, 600, 832, 864, 1000, 1280}) {
            double zoom = width / 1664.0;
            for (int ox : new int[]{0, 15}) for (int oy : new int[]{0, 288}) {
                BufferedImage output = new BufferedImage(width, 900, BufferedImage.TYPE_INT_RGB);
                Graphics2D g = output.createGraphics();
                g.translate(ox, oy); g.scale(zoom, zoom);
                g.drawImage(image, 20, 20, 384, 116, null); g.dispose();
                int left = Math.max(0, (int) Math.floor(ox + 20 * zoom));
                int right = Math.min(width, (int) Math.ceil(ox + 404 * zoom));
                int top = Math.max(0, (int) Math.floor(oy + 20 * zoom));
                int bottom = Math.min(900, (int) Math.ceil(oy + 136 * zoom));
                for (int py = top; py < bottom; py += 3) for (int px = left; px < right; px += 5) {
                    int color = output.getRGB(px, py);
                    int sx = ((color >> 16) & 255) - 1, sy = ((color >> 8) & 255) - 1;
                    if (sx >= 0 && sy >= 0)
                        System.out.printf("%d,%d,%d,%d,%d,%d,%d%n", width, ox, oy, px, py, sx, sy);
                }
            }
        }
    }
}
