import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { PlayerAnimation } from '../src/animation.ts';

test('player idle animation advances after 25 updates and wraps after 5 frames', () => {
  const animation = new PlayerAnimation();
  for (let i = 0; i < 24; i++) animation.update(false, false, 0);
  strictEqual(animation.index, 0);
  animation.update(false, false, 0);
  strictEqual(animation.index, 1);
  for (let i = 0; i < 100; i++) animation.update(false, false, 0);
  strictEqual(animation.index, 0);
});

test('changing movement and airborne state resets the frame', () => {
  const animation = new PlayerAnimation();
  for (let i = 0; i < 25; i++) animation.update(false, false, 0);
  animation.update(true, false, 0);
  strictEqual(animation.state, 1);
  strictEqual(animation.index, 0);
  animation.update(true, true, -4.5);
  strictEqual(animation.state, 2);
  animation.update(true, true, 0.08);
  strictEqual(animation.state, 3);
});

test('hit animation returns to idle when its fourth frame ends', () => {
  const animation = new PlayerAnimation();
  animation.state = 5;
  for (let i = 0; i < 100; i++) animation.update(false, false, 0);
  strictEqual(animation.state, 0);
  strictEqual(animation.index, 0);
});

test('death stops at the final frame and signals game over at the original tick', () => {
  const animation = new PlayerAnimation();
  strictEqual(animation.updateDeath(), false);
  strictEqual(animation.state, 6);
  for (let i = 0; i < 199; i++) strictEqual(animation.updateDeath(), false);
  strictEqual(animation.index, 7);
  strictEqual(animation.tick, 24);
  strictEqual(animation.updateDeath(), true);
});
