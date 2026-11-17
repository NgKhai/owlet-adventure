package entities;

import gamestates.Playing;
import java.awt.geom.Rectangle2D;
import java.lang.reflect.Field;
import java.util.ArrayList;
import sun.misc.Unsafe;

public class EnemyCombatOracle {
    public static void main(String[] args) throws Exception {
        Field f = Unsafe.class.getDeclaredField("theUnsafe"); f.setAccessible(true);
        Unsafe unsafe = (Unsafe) f.get(null);
        int[][] level = new int[14][26];
        for (int y = 0; y < 14; y++) for (int x = 0; x < 26; x++) level[y][x] = y == 2 ? 0 : 11;
        for (int scenario = 0; scenario < 2; scenario++) for (int type = 0; type < 3; type++) {
            Player player = (Player) unsafe.allocateInstance(Player.class);
            player.hitbox = new Rectangle2D.Float(250, 73, 40, 54);
            player.maxHealth = 100; player.currentHealth = 100;
            Playing playing = (Playing) unsafe.allocateInstance(Playing.class);
            f = Playing.class.getDeclaredField("player"); f.setAccessible(true); f.set(playing, player);
            f = Playing.class.getDeclaredField("dialogEffects"); f.setAccessible(true); f.set(playing, new ArrayList<>());
            Enemy enemy = type == 0 ? new Crabby(200, 89) : type == 1 ? new Pinkstar(200, 85) : new Shark(200, 83);
            enemy.tileY = 1;
            for (int tick = 0; tick < 600; tick++) {
                if (scenario == 1) {
                    if (tick == 0) { player.hitbox.x = 400; level[1][4] = 0; }
                    if (tick == 80) level[1][4] = 11;
                    if (tick == 160 || tick == 340) player.hitbox.x = 250;
                    if (tick == 260) player.hitbox.x = 150;
                }
                if (tick % 50 == 0) player.state = 0;
                if (tick == 180) enemy.hurt(20);
                if (tick == 380) enemy.resetEnemy();
                if (type == 0) ((Crabby) enemy).update(level, playing);
                else if (type == 1) ((Pinkstar) enemy).update(level, playing);
                else ((Shark) enemy).update(level, playing);
                System.out.printf("%d,%d,%d,%d,%d,%d,%d,%d%n", type, tick,
                    Float.floatToIntBits(enemy.hitbox.x), enemy.state, enemy.aniIndex, enemy.walkDir, player.currentHealth, player.state);
            }
        }
    }
}
