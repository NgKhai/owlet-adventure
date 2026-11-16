import { test } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { canHandleClick, canHandleKey, updatePlaying, type PlayingSteps } from '../src/playing.ts';

test('active playing updates systems in the Java order even when enemies complete the level', () => {
  const calls: string[] = [];
  const steps: PlayingSteps = {
    dialogue: () => calls.push('dialogue'), rain: () => calls.push('rain'),
    level: () => calls.push('level'), objects: () => calls.push('objects'),
    player: () => calls.push('player'), enemies: () => calls.push('enemies'),
    camera: () => calls.push('camera'), ship: () => calls.push('ship'),
  };
  updatePlaying(false, true, steps);
  deepStrictEqual(calls, ['dialogue', 'rain', 'level', 'objects', 'player', 'enemies', 'camera', 'ship']);
});

test('keyboard and mouse use the same overlay restrictions as Playing.java', () => {
  strictEqual(canHandleKey(true, 'none'), true);
  strictEqual(canHandleKey(true, 'pause'), true);
  strictEqual(canHandleKey(true, 'gameOver'), false);
  strictEqual(canHandleKey(true, 'levelCompleted'), false);
  strictEqual(canHandleKey(true, 'gameCompleted'), false);
  strictEqual(canHandleClick(true, 'pause'), true);
  strictEqual(canHandleClick(true, 'levelCompleted'), true);
  strictEqual(canHandleClick(true, 'gameCompleted'), true);
  strictEqual(canHandleClick(true, 'gameOver'), false);
  strictEqual(canHandleClick(false, 'none'), false);
});

test('dying player updates alone and disabled rain is skipped', () => {
  const calls: string[] = [];
  const steps: PlayingSteps = {
    dialogue: () => calls.push('dialogue'), rain: () => calls.push('rain'),
    level: () => calls.push('level'), objects: () => calls.push('objects'),
    player: () => calls.push('player'), enemies: () => calls.push('enemies'),
    camera: () => calls.push('camera'), ship: () => calls.push('ship'),
  };
  updatePlaying(true, true, steps);
  deepStrictEqual(calls, ['player']);
  calls.length = 0;
  updatePlaying(false, false, steps);
  deepStrictEqual(calls, ['dialogue', 'level', 'objects', 'player', 'enemies', 'camera', 'ship']);
});
