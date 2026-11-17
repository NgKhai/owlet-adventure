package entities;

import audio.AudioPlayer;
import gamestates.Playing;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.lang.reflect.Field;
import levels.Level;
import levels.LevelManager;
import main.Game;
import objects.ObjectManager;
import objects.Spike;
import objects.Potion;
import java.util.ArrayList;
import sun.misc.Unsafe;

public class PlayerUpdateOracle {
    static StringBuilder events = new StringBuilder();
    static int[][] tiles = new int[14][26];
    static FakeAudio audio;
    static FakeGame game;
    static FakeLevels levels;
    static FakeLevel level;
    static ObjectManager spikes;
    static ObjectManager potions;
    static Player currentPlayer;
    static ArrayList<Spike> spikeList = new ArrayList<>();

    static class FakeAudio extends AudioPlayer {
        public void playEffect(int effect) { events.append(effect == JUMP ? "J" : effect == DIE ? "D" : "G"); }
        public void playAttackSound() { events.append("A"); }
        public void stopSong() { events.append("S"); }
    }
    static class FakeGame extends Game { public AudioPlayer getAudioPlayer() { return audio; } }
    static class FakeLevel extends Level {
        FakeLevel() { super(new BufferedImage(26, 14, BufferedImage.TYPE_INT_RGB)); }
        public int[][] getLevelData() { return tiles; }
        public ArrayList<Spike> getSpikes() { return spikeList; }
    }
    static class FakeLevels extends LevelManager {
        FakeLevels() { super(null); }
        public Level getCurrentLevel() { return level; }
    }
    static class FakePlaying extends Playing {
        FakePlaying() { super(null); }
        public Game getGame() { return PlayerUpdateOracle.game; }
        public LevelManager getLevelManager() { return levels; }
        public Player getPlayer() { return currentPlayer; }
        public void checkPotionTouched(Rectangle2D.Float box) { events.append("P"); if (potions != null) potions.checkObjectTouched(box); }
        public void checkSpikesTouched(Player player) { events.append("S"); if (spikes != null) spikes.checkSpikesTouched(player); }
        public void checkEnemyHit(Rectangle2D.Float box) { events.append("E"); }
        public void checkObjectHit(Rectangle2D.Float box) { events.append("O"); }
        public void setPlayerDying(boolean dying) { events.append("D"); }
        public void setGameOver(boolean over) { events.append("G"); }
    }
    static Field field(String name) throws Exception {
        Field f = Player.class.getDeclaredField(name); f.setAccessible(true); return f;
    }
    public static void main(String[] args) throws Exception {
        Field f = Unsafe.class.getDeclaredField("theUnsafe"); f.setAccessible(true);
        Unsafe unsafe = (Unsafe) f.get(null);
        audio = (FakeAudio) unsafe.allocateInstance(FakeAudio.class);
        game = (FakeGame) unsafe.allocateInstance(FakeGame.class);
        levels = (FakeLevels) unsafe.allocateInstance(FakeLevels.class);
        level = (FakeLevel) unsafe.allocateInstance(FakeLevel.class);
        FakePlaying playing = (FakePlaying) unsafe.allocateInstance(FakePlaying.class);
        Player player = (Player) unsafe.allocateInstance(Player.class);
        currentPlayer = player;
        for (int y = 0; y < 14; y++) for (int x = 0; x < 26; x++) tiles[y][x] = y == 2 ? 0 : 11;
        player.hitbox = new Rectangle2D.Float(100, 73, 40, 54);
        player.attackBox = new Rectangle2D.Float(230, 200, 70, 40);
        player.x = 100; player.y = 73;
        player.width = 128; player.walkSpeed = 2; player.maxHealth = 100; player.currentHealth = 100;
        player.pushBackOffsetDir = 1;
        field("lvlData").set(player, tiles); field("playing").set(player, playing);
        field("jumpSpeed").setFloat(player, -4.5f); field("fallSpeedAfterCollision").setFloat(player, 1f);
        field("flipW").setInt(player, 1); field("powerMaxValue").setInt(player, 200);
        field("powerValue").setInt(player, 200); field("powerGrowSpeed").setInt(player, 15);
        field("healthBarWidth").setInt(player, 300); field("powerBarWidth").setInt(player, 208);
        Field power = field("powerValue"), healthWidth = field("healthWidth"), powerWidth = field("powerWidth");
        Field flip = field("flipW"), tileY = field("tileY"), attacking = field("attacking"), checked = field("attackChecked");
        Field powerActive = field("powerAttackActive"), powerTick = field("powerAttackTick"), moving = field("moving");
        Enemy attacker = new Crabby(500, 73);
        for (int tick = 0; tick < 680; tick++) {
            events.setLength(0);
            player.setLeft(tick >= 80 && tick < 140);
            player.setRight(tick < 80);
            player.setJump(tick >= 20 && tick < 50);
            if (tick == 10 || tick == 100 || tick == 360) player.setAttacking(true);
            if (tick == 180 && args.length > 0 && args[0].equals("airborne-wall")) {
                player.hitbox.x = 150; player.hitbox.y = 20; player.inAir = true; player.airSpeed = -2;
                field("flipW").setInt(player, 1); tiles[0][3] = 0; tiles[1][3] = 0;
            }
            if (tick == 180 && args.length > 0 && args[0].equals("water")) {
                player.hitbox.x = 150; player.hitbox.y = 73; player.inAir = false; player.setRight(true); tiles[1][2] = 48;
            }
            if (tick == 180 && args.length > 0 && args[0].equals("spikes")) {
                player.hitbox.x = 150; player.hitbox.y = 73; player.inAir = false; player.setRight(true);
                spikeList.add(new Spike(128, 64, 4));
                spikes = (ObjectManager) unsafe.allocateInstance(ObjectManager.class);
                Field currentLevel = ObjectManager.class.getDeclaredField("currentLevel"); currentLevel.setAccessible(true); currentLevel.set(spikes, level);
            }
            if (tick == 180 && args.length > 0 && args[0].equals("potions")) {
                player.hitbox.x = 150; player.hitbox.y = 73; player.inAir = false; player.setRight(true);
                player.currentHealth = 70; field("powerValue").setInt(player, 100);
                potions = (ObjectManager) unsafe.allocateInstance(ObjectManager.class);
                Field owner = ObjectManager.class.getDeclaredField("playing"); owner.setAccessible(true); owner.set(potions, playing);
                Field list = ObjectManager.class.getDeclaredField("potions"); list.setAccessible(true);
                ArrayList<Potion> items = new ArrayList<>(); items.add(new Potion(150, 73, 0)); items.add(new Potion(150, 73, 1)); list.set(potions, items);
            }
            if (tick == 180) player.powerAttack();
            if (tick == 240) player.changeHealth(-25);
            if (tick == 360) player.changeHealth(-25, attacker);
            if (tick == 400) player.resetAll();
            if (tick == 450) player.kill();
            player.update();
            System.out.printf("%d,%d,%d,%d,%b,%d,%d,%d,%d,%d,%d,%d,%d,%d,%b,%b,%d,%d,%d,%b,%d,%b,%s%n", tick,
                Float.floatToIntBits(player.hitbox.x), Float.floatToIntBits(player.hitbox.y), Float.floatToIntBits(player.airSpeed), player.inAir,
                player.state, player.aniIndex, player.aniTick, player.currentHealth, power.getInt(player), healthWidth.getInt(player), powerWidth.getInt(player),
                flip.getInt(player), tileY.getInt(player), attacking.getBoolean(player), checked.getBoolean(player),
                Float.floatToIntBits(player.attackBox.x), Float.floatToIntBits(player.attackBox.y), Float.floatToIntBits(player.pushDrawOffset),
                powerActive.getBoolean(player), powerTick.getInt(player), moving.getBoolean(player), events);
        }
    }
}
