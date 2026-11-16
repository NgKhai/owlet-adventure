import { TILE_SIZE } from './level.ts';

export type Rect = { x: number; y: number; width: number; height: number };

export function isTileSolid(x: number, y: number, level: number[][]): boolean {
  const value = level[y][x];
  return value !== 11 && value !== 48 && value !== 49;
}

export function isSolid(x: number, y: number, level: number[][]): boolean {
  if (x < 0 || x >= level[0].length * TILE_SIZE || y < 0 || y >= 896) return true;
  return isTileSolid(Math.trunc(x / TILE_SIZE), Math.trunc(y / TILE_SIZE), level);
}

export function canMoveHere(x: number, y: number, width: number, height: number, level: number[][]): boolean {
  return !isSolid(x, y, level) && !isSolid(x + width, y + height, level)
    && !isSolid(x + width, y, level) && !isSolid(x, y + height, level);
}

export function isEntityOnFloor(box: Rect, level: number[][]): boolean {
  return isSolid(box.x, box.y + box.height + 1, level)
    || isSolid(box.x + box.width, box.y + box.height + 1, level);
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
