import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { canMoveHere, isEntityInWater, isEntityOnFloor, isAllTilesWalkable } from '../src/collision.ts';

const level = [
  [11, 11, 11, 11],
  [11, 11, 11, 11],
  [0, 0, 11, 0],
];

test('collision treats outside map and all tiles except 11, 48 and 49 as solid', () => {
  strictEqual(canMoveHere(5, 5, 20, 20, level), true);
  strictEqual(canMoveHere(-1, 5, 20, 20, level), false);
  strictEqual(canMoveHere(5, 110, 20, 20, level), false);
  strictEqual(canMoveHere(236, 5, 20, 20, level), false);
});

test('floor and sight use the original tile checks', () => {
  strictEqual(isEntityOnFloor({x: 5, y: 74, width: 40, height: 53}, level), true);
  strictEqual(isEntityOnFloor({x: 133, y: 74, width: 40, height: 53}, level), false);
  strictEqual(isAllTilesWalkable(0, 2, 1, level), true);
  strictEqual(isAllTilesWalkable(0, 3, 1, level), false);
});

test('tile boundaries use Java float rounding', () => {
  const tiles = [[11, 11, 0, 11], [11, 11, 11, 11]];
  strictEqual(canMoveHere(Math.fround(63.999996), 0, 64, 20, tiles), false);
});

test('water checks round hitbox edges like Java float arithmetic', () => {
  const tiles = [[11, 11, 11], [11, 11, 11], [11, 11, 48]];
  strictEqual(isEntityInWater({x: Math.fround(63.999996), y: Math.fround(63.999996), width: 64, height: 64}, tiles), true);
});
