package entities;

import gamestates.Playing;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.lang.reflect.Field;
import java.util.ArrayList;
import levels.Level;
import levels.LevelManager;
import objects.*;
import sun.misc.Unsafe;

public class ObjectManagerOracle {
    static ArrayList<Potion> originalPotions = new ArrayList<>();
    static ArrayList<GameContainer> originalContainers = new ArrayList<>();
    static ArrayList<Cannon> cannons = new ArrayList<>();
    static int[][] tiles = new int[14][26];
    static Player player;
    static FakeLevel level;
    static FakeLevels levels;

    static class FakeLevel extends Level {
        FakeLevel() { super(new BufferedImage(26, 14, BufferedImage.TYPE_INT_RGB)); }
        public int[][] getLevelData() { return tiles; }
        public ArrayList<Potion> getPotions() { return originalPotions; }
        public ArrayList<GameContainer> getContainers() { return originalContainers; }
        public ArrayList<Cannon> getCannons() { return cannons; }
        public ArrayList<BackgroundTree> getTrees() { return new ArrayList<>(); }
    }
    static class FakeLevels extends LevelManager {
        FakeLevels() { super(null); }
        public Level getCurrentLevel() { return level; }
    }
    static class FakePlaying extends Playing {
        FakePlaying() { super(null); }
        public LevelManager getLevelManager() { return levels; }
        public Player getPlayer() { return player; }
    }
    @SuppressWarnings("unchecked")
    public static void main(String[] args) throws Exception {
        Field f = Unsafe.class.getDeclaredField("theUnsafe"); f.setAccessible(true);
        Unsafe unsafe = (Unsafe) f.get(null);
        player = (Player) unsafe.allocateInstance(Player.class);
        player.hitbox = new Rectangle2D.Float(128, 64, 40, 54);
        player.maxHealth = 100; player.currentHealth = 50;
        f = Player.class.getDeclaredField("tileY"); f.setAccessible(true); f.setInt(player, 1);
        level = (FakeLevel) unsafe.allocateInstance(FakeLevel.class);
        levels = (FakeLevels) unsafe.allocateInstance(FakeLevels.class);
        FakePlaying playing = (FakePlaying) unsafe.allocateInstance(FakePlaying.class);
        for (int y = 0; y < 14; y++) for (int x = 0; x < 26; x++) tiles[y][x] = 11;
        originalPotions.add(new Potion(128, 64, 0));
        originalContainers.add(new GameContainer(220, 64, 3));
        cannons.add(new Cannon(320, 64, 5));
        cannons.add(new Cannon(64, 64, 6));
        ObjectManager manager = new ObjectManager(playing);
        manager.loadObjects(level);
        Field p = ObjectManager.class.getDeclaredField("potions"); p.setAccessible(true);
        Field c = ObjectManager.class.getDeclaredField("containers"); c.setAccessible(true);
        Field shots = ObjectManager.class.getDeclaredField("projectiles"); shots.setAccessible(true);
        for (int tick = 0; tick < 600; tick++) {
            if (tick % 50 == 0) player.state = 0;
            if (tick == 5 || tick == 305) manager.checkObjectHit(new Rectangle2D.Float(220, 64, 80, 80));
            if (tick == 10 || tick == 310) manager.checkObjectTouched(player.hitbox);
            if (tick == 300) manager.resetAllObjects();
            manager.update(tiles, player);
            ArrayList<Potion> potions = (ArrayList<Potion>) p.get(manager);
            ArrayList<GameContainer> containers = (ArrayList<GameContainer>) c.get(manager);
            ArrayList<Projectile> projectiles = (ArrayList<Projectile>) shots.get(manager);
            StringBuilder projectileState = new StringBuilder();
            for (Projectile shot : projectiles) projectileState.append('|').append(Float.floatToIntBits(shot.getHitbox().x)).append(':').append(shot.isActive());
            System.out.printf("%d,%d,%d,%d,%b,%d,%d,%b,%d,%d,%d,%d,%d,%s%n", tick, player.currentHealth, player.state,
                potions.size(), potions.get(0).isActive(), containers.get(0).getAniIndex(), containers.get(0).getAniTick(),
                containers.get(0).isActive(), cannons.get(0).getAniIndex(), cannons.get(0).getAniTick(),
                cannons.get(1).getAniIndex(), cannons.get(1).getAniTick(), projectiles.size(), projectileState);
        }
    }
}
