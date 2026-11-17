package entities;

import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.lang.reflect.Field;
import levels.Level;
import sun.misc.Unsafe;

public class EnemyHitOracle {
    public static void main(String[] args) throws Exception {
        Field unsafeField = Unsafe.class.getDeclaredField("theUnsafe");
        unsafeField.setAccessible(true);
        Unsafe unsafe = (Unsafe) unsafeField.get(null);
        Field currentLevel = EnemyManager.class.getDeclaredField("currentLevel");
        Field state = Entity.class.getDeclaredField("state");
        Field index = Entity.class.getDeclaredField("aniIndex");
        Field health = Entity.class.getDeclaredField("currentHealth");
        Field active = Enemy.class.getDeclaredField("active");
        for (Field field : new Field[]{currentLevel, state, index, health, active}) field.setAccessible(true);

        for (int scenario = 0; scenario < 6; scenario++) {
            BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
            image.setRGB(0, 0, 0xffffff);
            Level level = new Level(image);
            Crabby crab = new Crabby(scenario == 1 || scenario == 2 ? 400 : 100, 100);
            Pinkstar pink = new Pinkstar(scenario == 1 || scenario == 2 ? 400 : 100, 100);
            Shark shark = new Shark(100, 100);
            level.getCrabs().add(crab); level.getPinkstars().add(pink); level.getSharks().add(shark);
            if (scenario == 1 || scenario == 2) { state.setInt(pink, 2); index.setInt(pink, scenario == 1 ? 3 : 2); }
            if (scenario == 3) state.setInt(crab, 3);
            if (scenario == 4) { active.setBoolean(crab, false); state.setInt(pink, 4); }
            EnemyManager manager = (EnemyManager) unsafe.allocateInstance(EnemyManager.class);
            currentLevel.set(manager, level);
            manager.checkEnemyHit(scenario == 5 ? new Rectangle2D.Float(0, 100, 100, 40) : new Rectangle2D.Float(100, 100, 70, 40));
            System.out.println(health.getInt(crab) + "," + health.getInt(pink) + "," + health.getInt(shark));
        }
    }
}
