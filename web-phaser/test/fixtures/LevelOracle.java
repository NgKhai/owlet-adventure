package levels;

import entities.Enemy;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import javax.imageio.ImageIO;
import objects.*;

public class LevelOracle {
    static void enemy(ArrayList<String> out, int type, Enemy item) {
        out.add(type + ":" + (int) item.getHitbox().x + ":" + (int) item.getHitbox().y);
    }
    static void object(ArrayList<String> out, GameObject item) {
        out.add(item.getObjType() + ":" + (int) item.getHitbox().x + ":" + (int) item.getHitbox().y + ":" + (int) item.getHitbox().width + ":" + (int) item.getHitbox().height);
    }
    public static void main(String[] args) throws Exception {
        for (int number = 1; number <= 5; number++) {
            BufferedImage image = ImageIO.read(new File(args[0], number + ".png"));
            Level level = new Level(image);
            int width = image.getWidth(), height = image.getHeight();
            byte[] rgba = new byte[width * height * 4];
            StringBuilder tiles = new StringBuilder();
            for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
                int rgb = image.getRGB(x, y), i = (y * width + x) * 4;
                rgba[i] = (byte) (rgb >> 16); rgba[i + 1] = (byte) (rgb >> 8); rgba[i + 2] = (byte) rgb; rgba[i + 3] = (byte) (rgb >> 24);
                if (tiles.length() > 0) tiles.append(',');
                tiles.append(level.getSpriteIndex(x, y));
            }
            ArrayList<String> enemies = new ArrayList<>(), objects = new ArrayList<>(), trees = new ArrayList<>(), grass = new ArrayList<>();
            level.getCrabs().forEach(item -> enemy(enemies, 0, item));
            level.getPinkstars().forEach(item -> enemy(enemies, 1, item));
            level.getSharks().forEach(item -> enemy(enemies, 2, item));
            level.getPotions().forEach(item -> object(objects, item));
            level.getContainers().forEach(item -> object(objects, item));
            level.getSpikes().forEach(item -> object(objects, item));
            level.getCannons().forEach(item -> object(objects, item));
            level.getTrees().forEach(item -> trees.add(item.getType() + ":" + item.getX() + ":" + item.getY()));
            level.getGrass().forEach(item -> grass.add(item.getType() + ":" + item.getX() + ":" + item.getY()));
            Collections.sort(enemies); Collections.sort(objects); Collections.sort(trees); Collections.sort(grass);
            System.out.println(width + "," + height + "," + level.getPlayerSpawn().x + "," + level.getPlayerSpawn().y + "," + level.getLvlOffset());
            System.out.println(Base64.getEncoder().encodeToString(rgba));
            System.out.println(tiles);
            System.out.println(String.join(";", enemies)); System.out.println(String.join(";", objects));
            System.out.println(String.join(";", trees)); System.out.println(String.join(";", grass));
        }
    }
}
