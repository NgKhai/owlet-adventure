import { test } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { DialogueEffect, DialogueEffects, Rain } from '../src/effects.ts';

test('dialogue lasts five frames of 25 updates', () => {
  const effect = new DialogueEffect(10, 20, 0);
  for (let i = 0; i < 124; i++) effect.update();
  strictEqual(effect.index, 4);
  strictEqual(effect.active, true);
  effect.update();
  strictEqual(effect.active, false);
  strictEqual(effect.index, 0);
});

test('dialogue allocation and reuse follow Playing.addDialogue', () => {
  const effects = new DialogueEffects();
  effects.add(100, 150, 0);
  strictEqual(effects.items.length, 21);
  deepStrictEqual(effects.items.filter(item => item.active).map(item => [item.x, item.y]), [[100, -30], [100, 120]]);
  effects.clear();
  effects.add(200, 300, 1);
  deepStrictEqual(effects.items.map(item => [item.x, item.y]), [[200, 270]]);
});

test('rain wraps beneath the screen with the current level offset', () => {
  const rain = new Rain(() => 0);
  rain.drops[0].y = 895;
  rain.update(300);
  strictEqual(rain.drops.length, 1000);
  deepStrictEqual(rain.drops[0], { x: -1364, y: -20 });
});
