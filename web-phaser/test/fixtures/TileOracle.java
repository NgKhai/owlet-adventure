package utilz;

public class TileOracle {
    interface Check { boolean run(); }
    static String result(Check check) {
        try { return Boolean.toString(check.run()); }
        catch (ArrayIndexOutOfBoundsException e) { return "error"; }
    }
    public static void main(String[] args) {
        int[][] level = new int[14][26];
        for (int y = 0; y < level.length; y++) for (int x = 0; x < level[y].length; x++)
            level[y][x] = new int[]{0, 11, 48, 49}[(x + y) % 4];
        for (int y = -1; y <= 14; y++) for (int start = -2; start <= 27; start++) for (int length = 0; length <= 3; length++) {
            final int row = y, first = start, end = start + length;
            System.out.println(row + "," + first + "," + end + "," +
                result(() -> HelpMethods.IsTileSolid(first, row, level)) + "," +
                result(() -> HelpMethods.IsAllTilesClear(first, end, row, level)) + "," +
                result(() -> HelpMethods.IsAllTilesWalkable(first, end, row, level)));
        }
    }
}
