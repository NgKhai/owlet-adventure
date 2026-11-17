package utilz;

import java.awt.geom.Rectangle2D;
import java.util.Random;

public class CollisionOracle {
    public static void main(String[] args) {
        int[][] level = new int[14][26];
        int[] tiles = {0, 11, 48, 49, 11};
        int[] widths = {36, 40, 44, 64, 70};
        int[] heights = {38, 44, 54, 64};
        for (int y = 0; y < 14; y++)
            for (int x = 0; x < 26; x++)
                level[y][x] = tiles[(x * 7 + y * 11) % tiles.length];
        Random random = new Random(7391);
        for (int i = 0; i < 7000; i++) {
            float x = ((i * 37) % 23 + 1) * 64f - widths[i % widths.length];
            float y = ((i * 17) % 11 + 1) * 64f - heights[i % heights.length];
            if (i < 2000) {
                if (i % 3 == 0) x = Math.nextDown(x);
                if (i % 3 == 1) x = Math.nextUp(x);
                if (i % 5 == 0) y = Math.nextDown(y);
                if (i % 5 == 1) y = Math.nextUp(y);
            } else {
                x = random.nextFloat() * (1663 - widths[i % widths.length]);
                y = random.nextFloat() * (895 - heights[i % heights.length]);
            }
            float width = widths[i % widths.length], height = heights[i % heights.length];
            Rectangle2D.Float box = new Rectangle2D.Float(x, y, width, height);
            System.out.println(Float.floatToIntBits(x) + "," + Float.floatToIntBits(y) + "," +
                (int) width + "," + (int) height + "," +
                HelpMethods.CanMoveHere(x, y, width, height, level) + "," +
                HelpMethods.IsEntityOnFloor(box, level) + "," +
                HelpMethods.IsEntityInWater(box, level));
        }
        float[] edgeX = {-128f, -64f, -0.001f, 0f, 0.001f, 63.999f, 64f, 1593f, 1663.999f, 1664f, 1700f};
        float[] edgeY = {-64f, -0.001f, 0f, 0.001f, 63.999f, 832f, 895.999f, 896f};
        for (float x : edgeX) for (float y : edgeY) {
            float width = 40, height = 54;
            Rectangle2D.Float box = new Rectangle2D.Float(x, y, width, height);
            System.out.println(Float.floatToIntBits(x) + "," + Float.floatToIntBits(y) + ",40,54," +
                HelpMethods.CanMoveHere(x, y, width, height, level) + "," +
                HelpMethods.IsEntityOnFloor(box, level) + ",skip");
        }
    }
}
