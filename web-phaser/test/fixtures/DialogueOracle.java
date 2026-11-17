package effects;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import gamestates.Playing;
import sun.misc.Unsafe;

public class DialogueOracle {
    public static void main(String[] args) throws Exception {
        Field unsafeField = Unsafe.class.getDeclaredField("theUnsafe"); unsafeField.setAccessible(true);
        Playing playing = (Playing) ((Unsafe) unsafeField.get(null)).allocateInstance(Playing.class);
        Field effectsField = Playing.class.getDeclaredField("dialogEffects"); effectsField.setAccessible(true);
        Field tickField = DialogueEffect.class.getDeclaredField("aniTick"); tickField.setAccessible(true);
        Method update = Playing.class.getDeclaredMethod("updateDialogue"); update.setAccessible(true);
        ArrayList<DialogueEffect> effects = new ArrayList<>();
        for (int type : new int[]{1, 0}) for (int i = 0; i < 10; i++) {
            DialogueEffect effect = new DialogueEffect(0, 0, type); effect.deactive(); effects.add(effect);
        }
        effectsField.set(playing, effects);
        for (int tick = 0; tick < 250; tick++) {
            if (tick == 0 || tick == 10 || tick == 125 || tick == 150 || tick == 181)
                playing.addDialogue(100 + tick, 200 + tick, tick == 10 || tick == 181 ? 1 : 0);
            if (tick == 180) effects.clear();
            update.invoke(playing);
            StringBuilder result = new StringBuilder();
            for (DialogueEffect effect : effects) {
                if (result.length() > 0) result.append(';');
                result.append(effect.getX()).append(':').append(effect.getY()).append(':').append(effect.getType())
                    .append(':').append(effect.getAniIndex()).append(':').append(tickField.getInt(effect))
                    .append(':').append(effect.isActive());
            }
            System.out.println(result);
        }
    }
}
