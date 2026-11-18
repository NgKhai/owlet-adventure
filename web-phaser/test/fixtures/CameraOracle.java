import gamestates.Playing;
import entities.Entity;
import entities.Player;
import java.awt.geom.Rectangle2D;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import sun.misc.Unsafe;

public class CameraOracle {
  public static void main(String[] args) throws Exception {
    Field u = Unsafe.class.getDeclaredField("theUnsafe"); u.setAccessible(true);
    Unsafe allocator = (Unsafe) u.get(null);
    Playing playing = (Playing) allocator.allocateInstance(Playing.class);
    Player player = (Player) allocator.allocateInstance(Player.class);
    Field playerField = field(Playing.class, "player"); playerField.set(playing, player);
    Rectangle2D.Float box = new Rectangle2D.Float(); field(Entity.class, "hitbox").set(player, box);
    field(Playing.class, "leftBorder").setInt(playing, 416);
    field(Playing.class, "rightBorder").setInt(playing, 1248);
    Field maxOffset = field(Playing.class, "maxLvlOffsetX");
    Field offset = field(Playing.class, "xLvlOffset");
    Method update = Playing.class.getDeclaredMethod("checkCloseToBorder"); update.setAccessible(true);
    for (int max : new int[]{0, 1000, 3000}) {
      maxOffset.setInt(playing, max);
      offset.setInt(playing, 0);
      for (int i = 0; i < 1800; i++) {
        box.x = (i < 900 ? -100 + i * 7 : 6200 - (i - 900) * 7) + 0.75f;
        update.invoke(playing);
        System.out.println(offset.getInt(playing));
      }
    }
  }
  private static Field field(Class<?> type, String name) throws Exception { Field f = type.getDeclaredField(name); f.setAccessible(true); return f; }
}
