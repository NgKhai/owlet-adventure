import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { ObjectManager } from '../src/objects.ts';

const level = Array.from({ length: 14 }, () => Array(26).fill(11));

test('hitting a box spawns a red potion and removes the box after eight frames', () => {
  const objects = new ObjectManager([{ type: 3, x: 64, y: 64 }]);
  objects.checkHit({ x: 64, y: 64, width: 80, height: 80 });
  strictEqual(objects.potions.length, 1);
  strictEqual(objects.potions[0].type, 0);
  strictEqual(objects.containers[0].active, true);
  for (let i = 0; i < 200; i++) objects.update(level, { x: 0, y: 0, width: 40, height: 54 }, 0, () => {});
  strictEqual(objects.containers[0].active, false);
});

test('cannon fires on animation frame four and projectile advances immediately', () => {
  const objects = new ObjectManager([{ type: 5, x: 320, y: 64 }]);
  const player = { x: 128, y: 64, width: 40, height: 54 };
  for (let i = 0; i < 100; i++) objects.update(level, player, 1, () => {});
  strictEqual(objects.projectiles.length, 1);
  strictEqual(objects.projectiles[0].box.x, 312.5);
});

test('potions deactivate on pickup and spikes report intersection', () => {
  const objects = new ObjectManager([{ type: 1, x: 64, y: 64 }, { type: 4, x: 128, y: 64 }]);
  let picked = -1;
  objects.checkPotions({ x: 64, y: 64, width: 40, height: 54 }, type => { picked = type; });
  strictEqual(picked, 1);
  strictEqual(objects.potions[0].active, false);
  strictEqual(objects.touchesSpikes({ x: 128, y: 96, width: 40, height: 54 }), true);
});

test('reset restores original objects and removes potions spawned by containers', () => {
  const objects = new ObjectManager([{ type: 1, x: 0, y: 0 }, { type: 3, x: 64, y: 64 }]);
  const original = objects.potions[0];
  original.update();
  const hover = original.hover;
  objects.checkHit({ x: 64, y: 64, width: 80, height: 80 });
  original.active = false;
  objects.reset();
  strictEqual(objects.potions.length, 1);
  strictEqual(objects.potions[0], original);
  strictEqual(original.active, true);
  strictEqual(original.hover, hover);
  strictEqual(objects.containers[0].animate, false);
});
