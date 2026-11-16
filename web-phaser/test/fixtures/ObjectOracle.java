package objects;

public class ObjectOracle {
    public static void main(String[] args) {
        for (int type : new int[] {0, 1, 2, 3, 5, 6}) {
            GameObject object = type < 2 ? new Potion(128, 64, type)
                : type < 4 ? new GameContainer(128, 64, type) : new Cannon(128, 64, type);
            for (int tick = 0; tick < 600; tick++) {
                if ((tick == 5 || tick == 305) && type >= 2) object.setAnimation(true);
                if (tick == 300) object.reset();
                if (object instanceof Potion && object.active) ((Potion) object).update();
                else if (object instanceof GameContainer && object.active) ((GameContainer) object).update();
                else if (object instanceof Cannon) ((Cannon) object).update();
                System.out.printf("%d,%d,%d,%d,%d,%d,%d,%d,%b,%b%n", type, tick,
                    Float.floatToIntBits(object.hitbox.x), Float.floatToIntBits(object.hitbox.y),
                    Float.floatToIntBits(object.hitbox.width), Float.floatToIntBits(object.hitbox.height),
                    object.aniIndex, object.aniTick, object.active, object.doAnimation);
            }
        }
    }
}
