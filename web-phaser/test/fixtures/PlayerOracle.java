package entities;

import java.awt.geom.Rectangle2D;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import sun.misc.Unsafe;

public class PlayerOracle {
    public static void main(String[] args) throws Exception {
        Field field = Unsafe.class.getDeclaredField("theUnsafe");
        field.setAccessible(true);
        Player player = (Player) ((Unsafe) field.get(null)).allocateInstance(Player.class);
        player.hitbox = new Rectangle2D.Float(100, 73, 40, 54);
        player.walkSpeed = 2f;
        player.width = 128;
        int[][] level = new int[14][26];
        for (int y = 0; y < 14; y++) for (int x = 0; x < 26; x++) level[y][x] = y == 2 ? 0 : 11;
        Field data = Player.class.getDeclaredField("lvlData"); data.setAccessible(true); data.set(player, level);
        Field moving = Player.class.getDeclaredField("moving"); moving.setAccessible(true);
        Field flip = Player.class.getDeclaredField("flipW"); flip.setAccessible(true); flip.setInt(player, 1);
        Field fall = Player.class.getDeclaredField("fallSpeedAfterCollision"); fall.setAccessible(true); fall.setFloat(player, 1f);
        Method update = Player.class.getDeclaredMethod("updatePos"); update.setAccessible(true);
        for (int tick = 0; tick < 500; tick++) {
            player.setLeft(tick % 160 < 60);
            player.setRight(tick % 160 >= 40 && tick % 160 < 120);
            if (tick == 150) { player.inAir = true; player.airSpeed = -4.5f; }
            update.invoke(player);
            System.out.printf("%d,%d,%d,%d,%b,%b,%d%n", tick, Float.floatToIntBits(player.hitbox.x),
                Float.floatToIntBits(player.hitbox.y), Float.floatToIntBits(player.airSpeed), player.inAir, moving.getBoolean(player), flip.getInt(player));
        }
    }
}
