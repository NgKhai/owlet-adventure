import { test } from 'node:test';
import { ok } from 'node:assert';
import { audioVolume } from '../src/audio.ts';

test('slider values map Java mixer decibels to linear gain', () => {
  ok(Math.abs(audioVolume(0) - 0.0001) < 1e-8);
  ok(Math.abs(audioVolume(0.5) - 0.014142) < 1e-6);
  ok(Math.abs(audioVolume(1) - 2) < 1e-5);
});
