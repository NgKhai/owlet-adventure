package entities;

import java.awt.geom.Rectangle2D;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import sun.misc.Unsafe;

public class PlayerAnimationOracle {
    public static void main(String[] args) throws Exception {
        Field f = Unsafe.class.getDeclaredField("theUnsafe"); f.setAccessible(true);
        Player player = (Player) ((Unsafe) f.get(null)).allocateInstance(Player.class);
        player.hitbox = new Rectangle2D.Float(100, 73, 40, 54);
        int[][] level = new int[14][26];
        for (int y = 0; y < 14; y++) for (int x = 0; x < 26; x++) level[y][x] = y == 2 ? 0 : 11;
        Field data = Player.class.getDeclaredField("lvlData"); data.setAccessible(true); data.set(player, level);
        Field moving = Player.class.getDeclaredField("moving"); moving.setAccessible(true);
        Field attacking = Player.class.getDeclaredField("attacking"); attacking.setAccessible(true);
        Field power = Player.class.getDeclaredField("powerAttackActive"); power.setAccessible(true);
        Field checked = Player.class.getDeclaredField("attackChecked"); checked.setAccessible(true);
        Method tickAnimation = Player.class.getDeclaredMethod("updateAnimationTick"); tickAnimation.setAccessible(true);
        Method setAnimation = Player.class.getDeclaredMethod("setAnimation"); setAnimation.setAccessible(true);
        for (int tick = 0; tick < 600; tick++) {
            moving.setBoolean(player, tick % 150 >= 50 && tick % 150 < 100);
            player.inAir = tick % 200 >= 120 && tick % 200 < 160;
            player.airSpeed = tick % 200 < 140 ? -2f : 2f;
            power.setBoolean(player, tick >= 260 && tick < 280);
            if (tick == 15 || tick == 180) attacking.setBoolean(player, true);
            if (tick == 400) player.newState(5);
            tickAnimation.invoke(player); setAnimation.invoke(player);
            System.out.printf("%d,%d,%d,%d,%b,%b%n", tick, player.state, player.aniIndex, player.aniTick,
                attacking.getBoolean(player), checked.getBoolean(player));
        }
    }
}
