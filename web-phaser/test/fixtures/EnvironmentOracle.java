import gamestates.Playing;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import sun.misc.Unsafe;

public class EnvironmentOracle {
  public static void main(String[] args) throws Exception {
    Field unsafeField = Unsafe.class.getDeclaredField("theUnsafe");
    unsafeField.setAccessible(true);
    Playing playing = (Playing) ((Unsafe) unsafeField.get(null)).allocateInstance(Playing.class);
    Field dir = field("shipDir"), delta = field("shipHeightDelta"), change = field("shipHeightChange"), tick = field("shipTick"), frame = field("shipAni");
    dir.setInt(playing, 1); change.setFloat(playing, 0.05f * 2);
    Method update = Playing.class.getDeclaredMethod("updateShipAni"); update.setAccessible(true);
    for (int i = 0; i < 1000; i++) {
      update.invoke(playing);
      System.out.println(tick.getInt(playing) + "," + frame.getInt(playing) + "," + Float.floatToIntBits(delta.getFloat(playing)) + "," + dir.getInt(playing));
    }
  }
  private static Field field(String name) throws Exception { Field field = Playing.class.getDeclaredField(name); field.setAccessible(true); return field; }
}
