export const TILE_SIZE = 64;

export type Placement = { type: number; x: number; y: number };
export type LevelData = {
  tiles: number[][];
  enemies: Placement[];
  objects: Placement[];
  grass: Placement[];
  spawn: { x: number; y: number } | null;
  offset: number;
};

// Java Level.loadLevel interprets the red, green and blue channels separately.
export function readLevel(width: number, height: number, rgba: Uint8ClampedArray): LevelData {
  if (width < 1 || height < 1 || rgba.length !== width * height * 4)
    throw new Error('Invalid level image');

  const level: LevelData = { tiles: [], enemies: [], objects: [], grass: [], spawn: null, offset: (width - 26) * TILE_SIZE };
  const grassTiles = new Set([0, 1, 2, 3, 30, 31, 33, 34, 35, 36, 37, 38, 39]);
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const [red, green, blue] = [rgba[i], rgba[i + 1], rgba[i + 2]];
      row.push(red >= 50 ? 0 : red);
      if (grassTiles.has(red)) level.grass.push({ type: x % 2, x: x * TILE_SIZE, y: (y - 1) * TILE_SIZE });
      if (green <= 2) level.enemies.push({ type: green, x: x * TILE_SIZE, y: y * TILE_SIZE });
      if (green === 100) level.spawn = { x: x * TILE_SIZE, y: y * TILE_SIZE };
      if (blue <= 9) level.objects.push({ type: blue, x: x * TILE_SIZE, y: y * TILE_SIZE });
    }
    level.tiles.push(row);
  }
  return level;
}
