import { test } from 'node:test';
import { deepStrictEqual, throws } from 'node:assert/strict';
import { readLevel } from '../src/level.ts';

test('reads the same level channels and coordinates as the Java level loader', () => {
  const level = readLevel(3, 1, new Uint8ClampedArray([
    0, 100, 255, 255, 48, 1, 4, 255, 50, 255, 9, 255,
  ]));
  deepStrictEqual(level.tiles, [[0, 48, 0]]);
  deepStrictEqual(level.spawn, { x: 0, y: 0 });
  deepStrictEqual(level.enemies, [{ type: 1, x: 64, y: 0 }]);
  deepStrictEqual(level.objects, [{ type: 4, x: 64, y: 0 }, { type: 9, x: 128, y: 0 }]);
  deepStrictEqual(level.grass, [{ type: 0, x: 0, y: -64 }]);
  deepStrictEqual(level.offset, -1472);
});

test('rejects truncated pixel data', () => {
  throws(() => readLevel(1, 1, new Uint8ClampedArray(3)));
});
