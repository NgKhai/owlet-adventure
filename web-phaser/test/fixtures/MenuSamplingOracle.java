import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

public class MenuSamplingOracle {
    public static void main(String[] args) {
        for (int[] d : new int[][]{{282, 406, 550, 50}, {282, 393, 550, 66}, {832, 448, 0, 0}}) {
        int sw = d[0], sh = d[1], x = d[2], y = d[3];
        BufferedImage image = new BufferedImage(sw, sh, BufferedImage.TYPE_INT_RGB);
        for (int sy = 0; sy < sh; sy++) for (int sx = 0; sx < sw; sx++)
            image.setRGB(sx, sy, 0xff000000 | (1 + (sx << 10) + sy));
        for (int width : new int[]{408, 600, 832, 864, 1000, 1280}) {
            double zoom = width / 1664.0;
            int oy = 288;
            BufferedImage output = new BufferedImage(width, 900, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = output.createGraphics();
            g.translate(0, oy); g.scale(zoom, zoom);
            g.drawImage(image, x, y, sw * 2, sh * 2, null); g.dispose();
            int left = Math.max(0, (int) Math.floor(x * zoom));
            int right = Math.min(width, (int) Math.ceil((x + sw * 2) * zoom));
            int top = Math.max(0, (int) Math.floor(oy + y * zoom));
            int bottom = Math.min(900, (int) Math.ceil(oy + (y + sh * 2) * zoom));
            for (int py = top; py < bottom; py += 7) for (int px = left; px < right; px += 11) {
                int code = (output.getRGB(px, py) & 0xffffff) - 1;
                if (code >= 0) System.out.printf("%d,%d,%d,%d,%d,%d,%d,%d,%d,%d%n", width, oy, sw, sh, x, y, px, py, code >> 10, code & 1023);
            }
        }
        }
    }
}
