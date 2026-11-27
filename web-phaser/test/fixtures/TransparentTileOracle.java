import java.io.File;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

public class TransparentTileOracle {
    public static void main(String[] args) throws Exception {
        BufferedImage atlas = ImageIO.read(new File(args[0]));
        int columns = atlas.getWidth() / 32, x = (11 % columns) * 32, y = (11 / columns) * 32;
        for (int py = 0; py < 32; py++) for (int px = 0; px < 32; px++)
            if ((atlas.getRGB(x + px, y + py) >>> 24) != 0) throw new AssertionError("Tile 11 is not transparent");
    }
}
