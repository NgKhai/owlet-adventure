package entities;

import gamestates.Playing;
import java.awt.geom.Rectangle2D;
import java.lang.reflect.Field;
import sun.misc.Unsafe;

public class EnemyOracle {
    public static void main(String[] args) throws Exception {
        Field field = Unsafe.class.getDeclaredField("theUnsafe");
        field.setAccessible(true);
        Unsafe unsafe = (Unsafe) field.get(null);
        Player player = (Player) unsafe.allocateInstance(Player.class);
        Playing playing = (Playing) unsafe.allocateInstance(Playing.class);
        field = Entity.class.getDeclaredField("hitbox");
        field.setAccessible(true);
        field.set(player, new Rectangle2D.Float(1500, 73, 40, 54));
        field = Playing.class.getDeclaredField("player");
        field.setAccessible(true);
        field.set(playing, player);
        int[][] level = new int[14][26];
        for (int y = 0; y < 14; y++) for (int x = 0; x < 26; x++) level[y][x] = y == 2 ? 0 : 11;
        Enemy[] enemies = {new Crabby(100, 89), new Pinkstar(100, 85), new Shark(100, 83)};
        for (int type = 0; type < enemies.length; type++) {
            Enemy enemy = enemies[type];
            for (int tick = 0; tick < 500; tick++) {
                if (type == 0) ((Crabby) enemy).update(level, playing);
                else if (type == 1) ((Pinkstar) enemy).update(level, playing);
                else ((Shark) enemy).update(level, playing);
                System.out.printf("%d,%d,%d,%d,%d,%d%n", type, tick,
                    Float.floatToIntBits(enemy.hitbox.x), Float.floatToIntBits(enemy.hitbox.y), enemy.state, enemy.aniIndex);
            }
        }
    }
}
