import { test } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { MouseClicks, canHandleClick, canHandleKey, centerOffset, containsRect, gameCoordinate, updatePlaying, type PlayingSteps } from '../src/playing.ts';

test('mouse coordinates subtract the letterbox offset before scaling as Java does', () => {
  strictEqual(Math.trunc(gameCoordinate(852, 93, 736 / 896)), 924);
  strictEqual(Math.trunc(gameCoordinate(550, 0, 736 / 896)), 669);
});

test('centering truncates small negative floating-point errors like Java', () => {
  strictEqual(Math.abs(centerOffset(864, 1664, 864 / 1664)), 0);
  strictEqual(Math.abs(centerOffset(900, 896, 900 / 896)), 0);
  strictEqual(centerOffset(900, 896, 600 / 1664), 288);
});

test('button hitboxes include the top and left edges but exclude the bottom and right edges', () => {
  const bounds = { x: 10, y: 20, width: 30, height: 40 };
  strictEqual(containsRect(bounds, 10, 20), true);
  strictEqual(containsRect(bounds, 39.9, 59.9), true);
  strictEqual(containsRect(bounds, 40, 30), false);
  strictEqual(containsRect(bounds, 20, 60), false);
  strictEqual(containsRect(bounds, 9.9, 20), false);
  strictEqual(containsRect({ ...bounds, width: 0 }, 10, 20), false);
});

test('a dragged mouse press does not generate a click, even if it returns to the start', () => {
  const clicks = new MouseClicks();
  clicks.press(0, 10, 10);
  clicks.move(11, 10, true);
  clicks.move(10, 10, true);
  strictEqual(clicks.release(0), false);
  clicks.press(2, 10, 10);
  clicks.move(10, 10, true);
  strictEqual(clicks.release(2), true);
});

test('mouse buttons retain separate clicks until a drag cancels them', () => {
  const clicks = new MouseClicks();
  clicks.press(0, 10, 10);
  clicks.press(2, 10, 10);
  strictEqual(clicks.release(0), true);
  strictEqual(clicks.release(2), true);
  clicks.press(0, 10, 10);
  clicks.press(2, 10, 10);
  clicks.move(11, 10, true);
  strictEqual(clicks.release(0), false);
  strictEqual(clicks.release(2), false);
});

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
