import { test } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { Player, type PlayerHooks } from '../src/player.ts';

const level = Array.from({ length: 14 }, (_, y) => Array(26).fill(y === 2 ? 0 : 11));
function hooks(events: string[]): PlayerHooks {
  return {
    potion: () => events.push('potion'), spikes: () => events.push('spikes'), water: () => false,
    enemyHit: () => events.push('enemy'), objectHit: () => events.push('object'),
    effect: name => events.push(name), dying: () => events.push('dying'), gameOver: () => events.push('gameover'),
  };
}

test('attacks occur at frame one and hit enemy before object once', () => {
  const events: string[] = [], player = new Player(100, 73, level);
  player.movement.inAir = false;
  player.animation.attacking = true;
  player.update(hooks(events));
  strictEqual(player.animation.index, 1);
  player.update(hooks(events));
  deepStrictEqual(events, ['enemy', 'object', 'attack']);
  player.update(hooks(events));
  deepStrictEqual(events, ['enemy', 'object', 'attack']);
});

test('potions and spikes are checked only when moving, in Java order', () => {
  const events: string[] = [], player = new Player(100, 73, level);
  player.movement.inAir = false;
  player.update(hooks(events));
  deepStrictEqual(events, []);
  player.movement.right = true;
  player.update(hooks(events));
  deepStrictEqual(events, ['potion', 'spikes']);
});

test('damage rejects repeated hits and death reaches game over after final animation frame', () => {
  const events: string[] = [], player = new Player(100, 73, level);
  player.changeHealth(-25, 200);
  player.changeHealth(-25, 200);
  strictEqual(player.health, 75);
  player.kill();
  player.update(hooks(events));
  deepStrictEqual(events, ['dying', 'die']);
  for (let i = 0; i < 200; i++) player.update(hooks(events));
  deepStrictEqual(events, ['dying', 'die', 'gameover', 'gameover']);
});

test('health bar width uses Java float precision before truncating', () => {
  const player = new Player(100, 73, level);
  player.health = 21;
  player.update(hooks([]));
  strictEqual(player.healthWidth, 62);
  player.health = 57;
  player.update(hooks([]));
  strictEqual(player.healthWidth, 171);
});
