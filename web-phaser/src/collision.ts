import { TILE_SIZE } from './level.ts';

export type Rect = { x: number; y: number; width: number; height: number };

export function isTileSolid(x: number, y: number, level: number[][]): boolean {
  const value = level[y][x];
  return value !== 11 && value !== 48 && value !== 49;
}

export function isSolid(x: number, y: number, level: number[][]): boolean {
  x = Math.fround(x); y = Math.fround(y);
  if (x < 0 || x >= level[0].length * TILE_SIZE || y < 0 || y >= 896) return true;
  return isTileSolid(Math.trunc(x / TILE_SIZE), Math.trunc(y / TILE_SIZE), level);
}

export function canMoveHere(x: number, y: number, width: number, height: number, level: number[][]): boolean {
  x = Math.fround(x); y = Math.fround(y); width = Math.fround(width); height = Math.fround(height);
  return !isSolid(x, y, level) && !isSolid(Math.fround(x + width), Math.fround(y + height), level)
    && !isSolid(Math.fround(x + width), y, level) && !isSolid(x, Math.fround(y + height), level);
}

export function isEntityOnFloor(box: Rect, level: number[][]): boolean {
  const bottom = Math.fround(Math.fround(box.y + box.height) + 1);
  return isSolid(box.x, bottom, level)
    || isSolid(Math.fround(box.x + box.width), bottom, level);
}

export function isEntityInWater(box: Rect, level: number[][]): boolean {
  const y = Math.trunc(Math.fround(box.y + box.height) / TILE_SIZE);
  const tile = (x: number) => {
    if (y < 0 || y >= level.length || x < 0 || x >= level[y].length) throw new RangeError('Tile outside level');
    return level[y][x];
  };
  return tile(Math.trunc(box.x / TILE_SIZE)) === 48
    || tile(Math.trunc(Math.fround(box.x + box.width) / TILE_SIZE)) === 48;
}

export function isAllTilesClear(start: number, end: number, y: number, level: number[][]): boolean {
  for (let i = start; i < end; i++) if (isTileSolid(i, y, level)) return false;
  return true;
}

export function isAllTilesWalkable(start: number, end: number, y: number, level: number[][]): boolean {
  if (isAllTilesClear(start, end, y, level))
    for (let i = start; i < end; i++) if (!isTileSolid(i, y + 1, level)) return false;
  return true;
}
