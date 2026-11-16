import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { Enemy } from '../src/enemy.ts';

const level = Array.from({ length: 14 }, (_, y) => Array(26).fill(y === 2 ? 0 : 11));
const player = { x: 1000, y: 73, width: 40, height: 54 };
const hooks = { hitPlayer: () => {}, onSpikes: () => {}, dialogue: () => {} };

test('crab begins walking left after its idle update', () => {
  const enemy = new Enemy(0, 100, 89);
  enemy.update(level, player, hooks);
  strictEqual(enemy.state, 1);
  enemy.update(level, player, hooks);
  strictEqual(enemy.box.x, Math.fround(100 - Math.fround(0.7)));
});

test('pinkstar waits 120 ticks before beginning to walk', () => {
  const enemy = new Enemy(1, 100, 85);
  for (let i = 0; i < 120; i++) enemy.update(level, player, hooks);
  strictEqual(enemy.state, 0);
  enemy.update(level, player, hooks);
  strictEqual(enemy.state, 1);
});

test('enemy death animation remains active until all five frames finish', () => {
  const enemy = new Enemy(2, 100, 83);
  enemy.hurt(25);
  strictEqual(enemy.state, 4);
  for (let i = 0; i < 124; i++) enemy.update(level, player, hooks);
  strictEqual(enemy.active, true);
  enemy.update(level, player, hooks);
  strictEqual(enemy.active, false);
});

test('reset restores spawn and health but retains walking direction like Enemy.resetEnemy', () => {
  const enemy = new Enemy(0, 100, 89);
  enemy.walkDir = 2;
  enemy.box.x = 180;
  enemy.hurt(50);
  enemy.reset();
  strictEqual(enemy.box.x, 100);
  strictEqual(enemy.health, 50);
  strictEqual(enemy.state, 0);
  strictEqual(enemy.active, true);
  strictEqual(enemy.walkDir, 2);
});
