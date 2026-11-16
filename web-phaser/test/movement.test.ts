import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { PlayerMovement } from '../src/movement.ts';

const level = Array.from({length: 14}, (_, y) => Array(26).fill(y === 2 ? 0 : 11));

test('walking advances two pixels per update and conflicting keys stop movement', () => {
  const player = new PlayerMovement(10, 73, level);
  player.right = true;
  player.update();
  strictEqual(player.box.x, 12);
  player.left = true;
  player.update();
  strictEqual(player.box.x, 12);
  strictEqual(player.moving, false);
});

test('jump starts with the Java velocity and gravity per update', () => {
  const player = new PlayerMovement(10, 73, level);
  player.jump = true;
  player.update();
  strictEqual(player.box.y, 68.5);
  strictEqual(player.airSpeed, Math.fround(-4.5 + Math.fround(0.08)));
});

test('power attack moves three times walking speed in facing direction', () => {
  const player = new PlayerMovement(10, 73, level);
  player.powerAttackActive = true;
  player.update();
  strictEqual(player.box.x, 16);
});

test('enemy damage pushes player away and animates the vertical offset', () => {
  const player = new PlayerMovement(100, 73, level);
  player.hitByEnemy(50);
  player.updateHit(0);
  strictEqual(player.box.x, 102.5);
  strictEqual(player.pushDrawOffset, Math.fround(-0.95));
  player.hitByEnemy(200);
  player.updateHit(0);
  strictEqual(player.box.x, 100);
});

test('hit recovery resets air speed and resumes falling when left floor probe is empty', () => {
  const player = new PlayerMovement(100, 20, level);
  player.airSpeed = -3;
  player.recoverFromHit();
  strictEqual(player.airSpeed, 0);
  strictEqual(player.inAir, true);
});

test('reset returns to spawn and checks its floor while keeping facing and hit offset', () => {
  const player = new PlayerMovement(100, 73, level);
  player.flip = -1;
  player.jump = true;
  player.hitByEnemy(200);
  player.updateHit(0);
  const offset = player.pushDrawOffset;
  player.reset(200, 20, level);
  strictEqual(player.box.x, 200);
  strictEqual(player.box.y, 20);
  strictEqual(player.inAir, true);
  strictEqual(player.flip, -1);
  strictEqual(player.jump, true);
  strictEqual(player.pushDrawOffset, offset);
});
