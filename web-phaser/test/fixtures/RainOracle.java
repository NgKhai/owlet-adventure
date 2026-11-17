package effects;

import java.awt.geom.Point2D;
import java.lang.reflect.Field;
import java.util.Random;
import sun.misc.Unsafe;

public class RainOracle {
    public static void main(String[] args) throws Exception {
        Field unsafeField = Unsafe.class.getDeclaredField("theUnsafe");
        unsafeField.setAccessible(true);
        Rain rain = (Rain) ((Unsafe) unsafeField.get(null)).allocateInstance(Rain.class);
        Field dropsField = Rain.class.getDeclaredField("drops");
        Field randomField = Rain.class.getDeclaredField("rand");
        Field speedField = Rain.class.getDeclaredField("rainSpeed");
        dropsField.setAccessible(true); randomField.setAccessible(true); speedField.setAccessible(true);
        Point2D.Float[] drops = {new Point2D.Float(0, 895), new Point2D.Float(1000, 880), new Point2D.Float(-100, -20)};
        dropsField.set(rain, drops);
        randomField.set(rain, new Random() { @Override public int nextInt(int bound) { return bound / 2; } });
        speedField.setFloat(rain, 1.25f);
        for (int tick = 0; tick < 50; tick++) {
            rain.update(tick * 13);
            for (Point2D.Float drop : drops)
                System.out.println(Float.floatToIntBits(drop.x) + "," + Float.floatToIntBits(drop.y));
        }
    }
}
